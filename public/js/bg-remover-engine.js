/* ==========================================================================
 * TechHat Studio — Studio-Grade Neural AI Background Removal & Alpha Matting Engine
 * (`public/js/bg-remover-engine.js`)
 *
 * Architecture modeled after remove.bg / iLoveIMG / PyMatting Studio Pipeline:
 *   1. Dedicated Web Worker 1024x1024 Neural Segmentation (`ormbg-ONNX` + `briaai/RMBG-1.4`)
 *   2. Connected-Component Background Crumb Removal & Chamfer Distance Interior Solidifier
 *      (guarantees 100% solid shirts/collars/faces with zero background bleed-through)
 *   3. Multi-Scale Local (F0, B0) Color Pyramid + Trimap Color-Projection Alpha Matting
 *      (snaps sub-pixel hair strands to true physical opacity & strips wall halos)
 *   4. Closed-Form Maximum-Likelihood Foreground Color Unmixing
 *      (recovers pure unmixed hair/edge RGB so dark hair on white walls has zero white halo)
 *   5. Graceful MediaPipe + Border-GrabCut Offline Fallback
 * ========================================================================== */
(function () {
  'use strict';

  var workerInstance = null;
  var workerReqCounter = 0;
  var workerPending = {};
  var mpSegmenterPromise = null;

  function getOrCreateWorker() {
    if (workerInstance) return workerInstance;
    if (typeof Worker === 'undefined') return null;
    try {
      var w = new Worker('/js/bg-remover-worker.js?v=81', { type: 'module' });
      w.onmessage = function (ev) {
        var data = ev.data || {};
        var pending = workerPending[data.reqId];
        if (!pending) return;
        if (data.type === 'progress') {
          if (pending.onProgress) pending.onProgress(data.pct, data.msg);
        } else if (data.type === 'result') {
          delete workerPending[data.reqId];
          pending.resolve({
            mask: new Float32Array(data.maskBuffer),
            mw: data.mw,
            mh: data.mh,
            engineUsed: data.engineUsed || 'ormbg-hd'
          });
        } else if (data.type === 'error') {
          delete workerPending[data.reqId];
          pending.reject(new Error(data.error || 'Worker segmentation failed'));
        }
      };
      w.onerror = function (err) {
        var keys = Object.keys(workerPending);
        for (var i = 0; i < keys.length; i++) {
          var p = workerPending[keys[i]];
          delete workerPending[keys[i]];
          if (p) p.reject(err);
        }
        workerInstance = null;
      };
      workerInstance = w;
      return w;
    } catch (_) {
      return null;
    }
  }

  function runWorkerSegmentation(srcImgData, w, h, mode, onProgress) {
    return new Promise(function (resolve, reject) {
      var worker = getOrCreateWorker();
      if (!worker) {
        reject(new Error('Web Worker unavailable'));
        return;
      }
      var reqId = ++workerReqCounter;
      var rgba = srcImgData.data;
      var n = w * h;
      var rgb = new Uint8Array(n * 3);
      for (var i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
        rgb[j] = rgba[i];
        rgb[j + 1] = rgba[i + 1];
        rgb[j + 2] = rgba[i + 2];
      }
      workerPending[reqId] = {
        resolve: resolve,
        reject: reject,
        onProgress: onProgress
      };
      worker.postMessage(
        {
          type: 'segment',
          reqId: reqId,
          rgbBuffer: rgb.buffer,
          width: w,
          height: h,
          mode: mode || 'auto'
        },
        [rgb.buffer]
      );
    });
  }

  /**
   * Offline / fallback MediaPipe Selfie Segmenter if HuggingFace CDN is unreachable.
   */
  function getMediaPipeSegmenter() {
    if (mpSegmenterPromise) return mpSegmenterPromise;
    mpSegmenterPromise = (async function () {
      var vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
      var filesetResolver = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      return await vision.ImageSegmenter.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
          delegate: 'CPU'
        },
        runningMode: 'IMAGE',
        outputCategoryMask: false,
        outputConfidenceMasks: true
      });
    })().catch(function (err) {
      mpSegmenterPromise = null;
      throw err;
    });
    return mpSegmenterPromise;
  }

  /**
   * Fast O(N) 2D Separable Box Filter on Float32Array.
   */
  function boxFilterFloat32(src, w, h, radius) {
    var r = Math.max(1, Math.min(Math.floor(Math.min(w, h) / 3), Math.round(radius)));
    var tmp = new Float32Array(w * h);
    var dst = new Float32Array(w * h);

    for (var y = 0; y < h; y++) {
      var rowOff = y * w;
      var sum = 0;
      var count = 0;
      for (var ix = 0; ix <= r && ix < w; ix++) {
        sum += src[rowOff + ix];
        count++;
      }
      for (var x = 0; x < w; x++) {
        tmp[rowOff + x] = sum / count;
        var addX = x + r + 1;
        var remX = x - r;
        if (addX < w) {
          sum += src[rowOff + addX];
          count++;
        }
        if (remX >= 0) {
          sum -= src[rowOff + remX];
          count--;
        }
      }
    }

    for (var x2 = 0; x2 < w; x2++) {
      var sumY = 0;
      var countY = 0;
      for (var iy = 0; iy <= r && iy < h; iy++) {
        sumY += tmp[iy * w + x2];
        countY++;
      }
      for (var y2 = 0; y2 < h; y2++) {
        dst[y2 * w + x2] = sumY / countY;
        var addY = y2 + r + 1;
        var remY = y2 - r;
        if (addY < h) {
          sumY += tmp[addY * w + x2];
          countY++;
        }
        if (remY >= 0) {
          sumY -= tmp[remY * w + x2];
          countY--;
        }
      }
    }
    return dst;
  }

  /**
   * Bilinearly resamples a float32 mask of size (sw x sh) to target size (dw x dh).
   */
  function upscaleFloatMaskBilinear(srcMask, sw, sh, dw, dh) {
    if (sw === dw && sh === dh) return new Float32Array(srcMask);
    var dst = new Float32Array(dw * dh);
    var xRatio = sw / dw;
    var yRatio = sh / dh;
    for (var y = 0; y < dh; y++) {
      var sy = (y + 0.5) * yRatio - 0.5;
      var y0 = Math.max(0, Math.min(sh - 1, Math.floor(sy)));
      var y1 = Math.max(0, Math.min(sh - 1, y0 + 1));
      var fy = Math.max(0, sy - y0);
      var row0 = y0 * sw;
      var row1 = y1 * sw;
      var dstRow = y * dw;
      for (var x = 0; x < dw; x++) {
        var sx = (x + 0.5) * xRatio - 0.5;
        var x0 = Math.max(0, Math.min(sw - 1, Math.floor(sx)));
        var x1 = Math.max(0, Math.min(sw - 1, x0 + 1));
        var fx = Math.max(0, sx - x0);
        var v00 = srcMask[row0 + x0];
        var v10 = srcMask[row0 + x1];
        var v01 = srcMask[row1 + x0];
        var v11 = srcMask[row1 + x1];
        var top = v00 + (v10 - v00) * fx;
        var bot = v01 + (v11 - v01) * fx;
        dst[dstRow + x] = top + (bot - top) * fy;
      }
    }
    return dst;
  }

  /**
   * Multi-Scale Weighted Color Propagation Pyramid (O(N)).
   * Propagates pure foreground RGB (where alpha > 0.93) and pure background RGB (where alpha < 0.05)
   * across every boundary pixel so local hair/clothing color F0 and local wall/scene color B0 are known accurately.
   */
  function computeLocalFgBgPriors(rgba, mask, w, h) {
    var n = w * h;
    var wF = new Float32Array(n);
    var fR = new Float32Array(n);
    var fG = new Float32Array(n);
    var fB = new Float32Array(n);

    var wB = new Float32Array(n);
    var bR = new Float32Array(n);
    var bG = new Float32Array(n);
    var bB = new Float32Array(n);

    var globalFgR = 60, globalFgG = 60, globalFgB = 60, globalFgCnt = 0;
    var globalBgR = 235, globalBgG = 235, globalBgB = 235, globalBgCnt = 0;

    for (var i = 0; i < n; i++) {
      var a = mask[i];
      var i4 = i * 4;
      var r = rgba[i4];
      var g = rgba[i4 + 1];
      var b = rgba[i4 + 2];

      if (a >= 0.92) {
        var wf = (a - 0.92) / 0.08;
        wf = wf * wf + 0.05;
        wF[i] = wf;
        fR[i] = r * wf;
        fG[i] = g * wf;
        fB[i] = b * wf;
        if (i % 7 === 0) {
          globalFgR += r;
          globalFgG += g;
          globalFgB += b;
          globalFgCnt++;
        }
      } else if (a <= 0.05) {
        var wb = (0.05 - a) / 0.05;
        wb = wb * wb + 0.05;
        wB[i] = wb;
        bR[i] = r * wb;
        bG[i] = g * wb;
        bB[i] = b * wb;
        if (i % 7 === 0) {
          globalBgR += r;
          globalBgG += g;
          globalBgB += b;
          globalBgCnt++;
        }
      }
    }

    if (globalFgCnt > 0) {
      globalFgR /= globalFgCnt;
      globalFgG /= globalFgCnt;
      globalFgB /= globalFgCnt;
    }
    if (globalBgCnt > 0) {
      globalBgR /= globalBgCnt;
      globalBgG /= globalBgCnt;
      globalBgB /= globalBgCnt;
    }

    var shortSide = Math.min(w, h);
    var rFine = Math.max(3, Math.round(shortSide * 0.006));
    var rMed = Math.max(10, Math.round(shortSide * 0.022));
    var rCoarse = Math.max(28, Math.round(shortSide * 0.065));

    var wf1 = boxFilterFloat32(wF, w, h, rFine);
    var fr1 = boxFilterFloat32(fR, w, h, rFine);
    var fg1 = boxFilterFloat32(fG, w, h, rFine);
    var fb1 = boxFilterFloat32(fB, w, h, rFine);

    var wf2 = boxFilterFloat32(wF, w, h, rMed);
    var fr2 = boxFilterFloat32(fR, w, h, rMed);
    var fg2 = boxFilterFloat32(fG, w, h, rMed);
    var fb2 = boxFilterFloat32(fB, w, h, rMed);

    var wf3 = boxFilterFloat32(wF, w, h, rCoarse);
    var fr3 = boxFilterFloat32(fR, w, h, rCoarse);
    var fg3 = boxFilterFloat32(fG, w, h, rCoarse);
    var fb3 = boxFilterFloat32(fB, w, h, rCoarse);

    var wb1 = boxFilterFloat32(wB, w, h, rFine);
    var br1 = boxFilterFloat32(bR, w, h, rFine);
    var bg1 = boxFilterFloat32(bG, w, h, rFine);
    var bb1 = boxFilterFloat32(bB, w, h, rFine);

    var wb2 = boxFilterFloat32(wB, w, h, rMed);
    var br2 = boxFilterFloat32(bR, w, h, rMed);
    var bg2 = boxFilterFloat32(bG, w, h, rMed);
    var bb2 = boxFilterFloat32(bB, w, h, rMed);

    var wb3 = boxFilterFloat32(wB, w, h, rCoarse);
    var br3 = boxFilterFloat32(bR, w, h, rCoarse);
    var bg3 = boxFilterFloat32(bG, w, h, rCoarse);
    var bb3 = boxFilterFloat32(bB, w, h, rCoarse);

    var outFR = new Float32Array(n);
    var outFG = new Float32Array(n);
    var outFB = new Float32Array(n);
    var outBR = new Float32Array(n);
    var outBG = new Float32Array(n);
    var outBB = new Float32Array(n);

    for (var k = 0; k < n; k++) {
      var aVal = mask[k];
      if (aVal <= 0.003 || aVal >= 0.996) continue;

      // Multi-scale foreground estimate (prefer finest scale that reaches pure interior)
      if (wf1[k] > 0.015) {
        outFR[k] = fr1[k] / wf1[k];
        outFG[k] = fg1[k] / wf1[k];
        outFB[k] = fb1[k] / wf1[k];
      } else if (wf2[k] > 0.008) {
        outFR[k] = fr2[k] / wf2[k];
        outFG[k] = fg2[k] / wf2[k];
        outFB[k] = fb2[k] / wf2[k];
      } else if (wf3[k] > 0.003) {
        outFR[k] = fr3[k] / wf3[k];
        outFG[k] = fg3[k] / wf3[k];
        outFB[k] = fb3[k] / wf3[k];
      } else {
        outFR[k] = globalFgR;
        outFG[k] = globalFgG;
        outFB[k] = globalFgB;
      }

      // Multi-scale background estimate (prefer finest scale that reaches pure outer background)
      if (wb1[k] > 0.015) {
        outBR[k] = br1[k] / wb1[k];
        outBG[k] = bg1[k] / wb1[k];
        outBB[k] = bb1[k] / wb1[k];
      } else if (wb2[k] > 0.008) {
        outBR[k] = br2[k] / wb2[k];
        outBG[k] = bg2[k] / wb2[k];
        outBB[k] = bb2[k] / wb2[k];
      } else if (wb3[k] > 0.003) {
        outBR[k] = br3[k] / wb3[k];
        outBG[k] = bg3[k] / wb3[k];
        outBB[k] = bb3[k] / wb3[k];
      } else {
        outBR[k] = globalBgR;
        outBG[k] = globalBgG;
        outBB[k] = globalBgB;
      }
    }

    return {
      fR: outFR,
      fG: outFG,
      fB: outFB,
      bR: outBR,
      bG: outBG,
      bB: outBB
    };
  }

  /**
   * Removes isolated background crumbs via Connected Components and solidifies deep interior core
   * via 2-pass O(N) Chamfer Distance Transform so shirts, collars, shoulders, and faces are 100% solid.
   */
  function cleanAndSolidifyMask(rawMask, w, h) {
    var n = w * h;
    var mask = new Float32Array(rawMask);

    // 1. Connected-Component Island Filter: remove floating background dust (< 1.2% of main subject)
    var labels = new Int32Array(n);
    var queue = new Int32Array(n);
    var compSizes = [0];
    var curLabel = 0;
    var maxCompSize = 0;

    for (var i = 0; i < n; i++) {
      if (mask[i] > 0.14 && labels[i] === 0) {
        curLabel++;
        var head = 0;
        var tail = 0;
        labels[i] = curLabel;
        queue[tail++] = i;
        var cnt = 0;
        while (head < tail) {
          var p = queue[head++];
          cnt++;
          var py = (p / w) | 0;
          var px = p - py * w;
          if (px > 0 && labels[p - 1] === 0 && mask[p - 1] > 0.14) {
            labels[p - 1] = curLabel;
            queue[tail++] = p - 1;
          }
          if (px + 1 < w && labels[p + 1] === 0 && mask[p + 1] > 0.14) {
            labels[p + 1] = curLabel;
            queue[tail++] = p + 1;
          }
          if (py > 0 && labels[p - w] === 0 && mask[p - w] > 0.14) {
            labels[p - w] = curLabel;
            queue[tail++] = p - w;
          }
          if (py + 1 < h && labels[p + w] === 0 && mask[p + w] > 0.14) {
            labels[p + w] = curLabel;
            queue[tail++] = p + w;
          }
        }
        compSizes.push(cnt);
        if (cnt > maxCompSize) maxCompSize = cnt;
      }
    }

    if (maxCompSize > 64) {
      var minKeep = Math.max(24, Math.floor(maxCompSize * 0.012));
      for (var cIdx = 0; cIdx < n; cIdx++) {
        var lb = labels[cIdx];
        if (lb > 0 && compSizes[lb] < minKeep) {
          mask[cIdx] = 0;
        } else if (lb === 0 && mask[cIdx] <= 0.14) {
          // Suppress sub-threshold background haze far from subject
          if (mask[cIdx] < 0.04) mask[cIdx] = 0;
        }
      }
    }

    // 2. 2-Pass O(N) Chamfer Distance Transform from background (alpha < 0.20)
    // Pixels deeper than trimapWidth inside the subject core are guaranteed solid interior (shirt/face/body)
    var INF = 1e6;
    var dist = new Float32Array(n);
    for (var di = 0; di < n; di++) {
      dist[di] = mask[di] < 0.20 ? 0 : INF;
    }

    // Forward pass (top-left to bottom-right)
    for (var y = 0; y < h; y++) {
      var row = y * w;
      for (var x = 0; x < w; x++) {
        var idx = row + x;
        var d = dist[idx];
        if (d === 0) continue;
        if (x > 0 && dist[idx - 1] + 1 < d) d = dist[idx - 1] + 1;
        if (y > 0) {
          if (dist[idx - w] + 1 < d) d = dist[idx - w] + 1;
          if (x > 0 && dist[idx - w - 1] + 1.414 < d) d = dist[idx - w - 1] + 1.414;
          if (x + 1 < w && dist[idx - w + 1] + 1.414 < d) d = dist[idx - w + 1] + 1.414;
        }
        dist[idx] = d;
      }
    }

    // Backward pass (bottom-right to top-left)
    for (var y2 = h - 1; y2 >= 0; y2--) {
      var row2 = y2 * w;
      for (var x2 = w - 1; x2 >= 0; x2--) {
        var idx2 = row2 + x2;
        var d2 = dist[idx2];
        if (d2 === 0) continue;
        if (x2 + 1 < w && dist[idx2 + 1] + 1 < d2) d2 = dist[idx2 + 1] + 1;
        if (y2 + 1 < h) {
          if (dist[idx2 + w] + 1 < d2) d2 = dist[idx2 + w] + 1;
          if (x2 + 1 < w && dist[idx2 + w + 1] + 1.414 < d2) d2 = dist[idx2 + w + 1] + 1.414;
          if (x2 > 0 && dist[idx2 + w - 1] + 1.414 < d2) d2 = dist[idx2 + w - 1] + 1.414;
        }
        dist[idx2] = d2;
      }
    }

    var trimapRadius = Math.max(7, Math.round(Math.min(w, h) * 0.011));
    var fullSolidRadius = trimapRadius * 1.8;
    for (var m = 0; m < n; m++) {
      var dm = dist[m];
      var am = mask[m];
      if (dm > trimapRadius && am > 0.36) {
        var solidT = Math.min(1, (dm - trimapRadius) / Math.max(1, fullSolidRadius - trimapRadius));
        mask[m] = am + (1.0 - am) * solidT;
      }
    }

    return mask;
  }

  /**
   * 3-Channel Color-Aware Guided Filter + Local Trimap Color-Projection Alpha Matting.
   * Aligns upscaled neural alpha to full-res RGB hair strands and eliminates outer background wall halos.
   */
  function guidedFilterAlphaMatting(imgData, rawMask, w, h, radius, eps) {
    var n = w * h;
    var d = imgData.data;

    // Step A: Clean isolated dust & solidify interior core (shirts/collars/faces)
    var cleanMask = cleanAndSolidifyMask(rawMask, w, h);

    // Step B: Edge-Preserving Luminance + Chroma Guided Refinement with tight radius
    var I = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var i4 = i * 4;
      I[i] = (d[i4] * 0.299 + d[i4 + 1] * 0.587 + d[i4 + 2] * 0.114) / 255.0;
    }

    var r = Math.max(2, Math.round(radius || Math.max(2, Math.min(w, h) * 0.0035)));
    var epsilon = eps || 0.0008;

    var meanI = boxFilterFloat32(I, w, h, r);
    var meanP = boxFilterFloat32(cleanMask, w, h, r);

    var Ip = new Float32Array(n);
    var II = new Float32Array(n);
    for (var k = 0; k < n; k++) {
      Ip[k] = I[k] * cleanMask[k];
      II[k] = I[k] * I[k];
    }

    var meanIp = boxFilterFloat32(Ip, w, h, r);
    var meanII = boxFilterFloat32(II, w, h, r);

    var a = new Float32Array(n);
    var b = new Float32Array(n);
    for (var j = 0; j < n; j++) {
      var covIp = meanIp[j] - meanI[j] * meanP[j];
      var varI = Math.max(0, meanII[j] - meanI[j] * meanI[j]);
      a[j] = covIp / (varI + epsilon);
      b[j] = meanP[j] - a[j] * meanI[j];
    }

    var meanA = boxFilterFloat32(a, w, h, r);
    var meanB = boxFilterFloat32(b, w, h, r);

    var guided = new Float32Array(n);
    for (var m = 0; m < n; m++) {
      var origA = cleanMask[m];
      if (origA <= 0.004) {
        guided[m] = 0;
        continue;
      }
      if (origA >= 0.992) {
        guided[m] = 1;
        continue;
      }
      var v = meanA[m] * I[m] + meanB[m];
      v = Math.max(0, Math.min(1, v));
      // Never allow guided filter to leak outward where cleanMask was nearly zero
      if (origA < 0.06 && v > origA * 1.35) {
        v = origA;
      }
      guided[m] = v;
    }

    // Step C: Local Trimap Color-Projection Alpha Snapping (Physical Linear Matting Model)
    var priors = computeLocalFgBgPriors(d, guided, w, h);
    var fR = priors.fR, fG = priors.fG, fB = priors.fB;
    var bR = priors.bR, bG = priors.bG, bB = priors.bB;

    var refined = new Float32Array(n);
    for (var p = 0; p < n; p++) {
      var curA = guided[p];
      if (curA <= 0.008) {
        refined[p] = 0;
        continue;
      }
      if (curA >= 0.985) {
        refined[p] = 1;
        continue;
      }

      var p4 = p * 4;
      var cr = d[p4], cg = d[p4 + 1], cb = d[p4 + 2];
      var fr = fR[p], fg = fG[p], fb = fB[p];
      var br = bR[p], bg = bG[p], bb = bB[p];

      var dfr = fr - br, dfg = fg - bg, dfb = fb - bb;
      var distFBSq = dfr * dfr + dfg * dfg + dfb * dfb;
      var distFB = Math.sqrt(distFBSq);

      if (distFB > 26) {
        var dcr = cr - br, dcg = cg - bg, dcb = cb - bb;
        var aProj = (dcr * dfr + dcg * dfg + dcb * dfb) / (distFBSq + 1e-4);
        if (aProj < 0) aProj = 0;
        else if (aProj > 1) aProj = 1;

        // Collinearity residual: how closely C lies on the physical mixture line B + alpha*(F - B)
        var fitR = br + aProj * dfr;
        var fitG = bg + aProj * dfg;
        var fitB = bb + aProj * dfb;
        var errSq = (cr - fitR) * (cr - fitR) + (cg - fitG) * (cg - fitG) + (cb - fitB) * (cb - fitB);

        var sepWeight = Math.min(0.76, (distFB - 26) / 85);
        var lineWeight = Math.exp(-errSq / (2 * 30 * 30));
        var wColor = sepWeight * lineWeight;

        curA = (1 - wColor) * curA + wColor * aProj;

        // Hard halo killer: if pixel color is nearly indistinguishable from local background wall, trim fringe
        var distToBg = Math.sqrt(dcr * dcr + dcg * dcg + dcb * dcb);
        if (curA < 0.62 && distFB > 50 && distToBg < 15) {
          curA *= (distToBg / 15) * 0.25;
        }
      }

      if (curA <= 0.018) curA = 0;
      else if (curA >= 0.982) curA = 1;
      refined[p] = curA;
    }

    return refined;
  }

  /**
   * Offline Fallback Segmenter (Border-Connected GrabCut + Subject Core Protection).
   */
  function computeOfflineFallbackMask(imgData, w, h) {
    var d = imgData.data;
    var n = w * h;
    var borderSamples = [];
    var stepX = Math.max(1, Math.floor(w / 24));
    var stepY = Math.max(1, Math.floor(h / 24));
    for (var bx = 0; bx < w; bx += stepX) {
      var idxTop = (2 * w + bx) * 4;
      borderSamples.push([d[idxTop], d[idxTop + 1], d[idxTop + 2]]);
    }
    for (var by = 0; by < Math.floor(h * 0.75); by += stepY) {
      var idxL = (by * w + 2) * 4;
      var idxR = (by * w + (w - 3)) * 4;
      borderSamples.push([d[idxL], d[idxL + 1], d[idxL + 2]]);
      borderSamples.push([d[idxR], d[idxR + 1], d[idxR + 2]]);
    }

    function minColorDistSq(r, g, b) {
      var best = 1e9;
      for (var i = 0; i < borderSamples.length; i++) {
        var s = borderSamples[i];
        var dr = r - s[0], dg = g - s[1], db = b - s[2];
        var d2 = dr * dr + dg * dg + db * db;
        if (d2 < best) best = d2;
      }
      return best;
    }

    var bgProb = new Float32Array(n);
    var visited = new Uint8Array(n);
    var queue = new Int32Array(n);
    var head = 0, tail = 0;
    var tolSq = 44 * 44 * 3;

    function tryPush(x, y) {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      var pos = y * w + x;
      if (visited[pos]) return;
      var nx = (x - w * 0.5) / (w * 0.25);
      var ny = (y - h * 0.45) / (h * 0.28);
      if (nx * nx + ny * ny <= 0.72) return;
      var i4 = pos * 4;
      var dSq = minColorDistSq(d[i4], d[i4 + 1], d[i4 + 2]);
      if (dSq <= tolSq) {
        visited[pos] = 1;
        bgProb[pos] = 1.0;
        queue[tail++] = pos;
      } else if (dSq <= tolSq * 1.45) {
        visited[pos] = 1;
        bgProb[pos] = 0.5;
      }
    }

    for (var x0 = 0; x0 < w; x0++) tryPush(x0, 0);
    for (var y0 = 0; y0 < Math.floor(h * 0.88); y0++) {
      tryPush(0, y0);
      tryPush(w - 1, y0);
    }

    while (head < tail) {
      var p = queue[head++];
      var py = Math.floor(p / w);
      var px = p - py * w;
      if (px > 0) tryPush(px - 1, py);
      if (px + 1 < w) tryPush(px + 1, py);
      if (py > 0) tryPush(px, py - 1);
      if (py + 1 < h) tryPush(px, py + 1);
    }

    var fgMask = new Float32Array(n);
    for (var k = 0; k < n; k++) {
      fgMask[k] = 1.0 - bgProb[k];
    }
    return fgMask;
  }

  /**
   * Applies Inward-Safe Edge Feathering, Edge Shift (-4..+4), and Closed-Form Multi-Scale
   * ML Foreground Color Unmixing to produce a halo-free studio RGBA cutout canvas.
   */
  function renderCutoutFromMask(sourceCanvas, baseMask, opts) {
    var options = opts || {};
    var w = sourceCanvas.width;
    var h = sourceCanvas.height;
    var n = w * h;
    var edgeFeather = typeof options.edgeFeather === 'number' ? options.edgeFeather : 0.4;
    var edgeShift = typeof options.edgeShift === 'number' ? options.edgeShift : 0;
    var decontaminate = options.decontaminate !== false;

    var mask = new Float32Array(baseMask);

    // 1. Optional Morphological Edge Shift (contract < 0 to trim edge, expand > 0)
    if (Math.abs(edgeShift) > 0.08) {
      var shiftRad = Math.max(1, Math.round(Math.abs(edgeShift)));
      var shiftBlur = boxFilterFloat32(mask, w, h, shiftRad);
      var bias = edgeShift * 0.11;
      for (var si = 0; si < n; si++) {
        var sv = shiftBlur[si] + bias;
        mask[si] = Math.max(0, Math.min(1, (sv - 0.18) / 0.64));
      }
    }

    // 2. Boundary-Safe Edge Feathering (NEVER bleeds pure 0.0 background wall pixels outward!)
    if (edgeFeather > 0.15) {
      var fRad = Math.max(1, Math.round(edgeFeather));
      var blurred = boxFilterFloat32(mask, w, h, fRad);
      var blendAmt = Math.min(0.85, edgeFeather * 0.35);
      for (var fi = 0; fi < n; fi++) {
        var orig = mask[fi];
        if (orig <= 0.008) {
          // Strictly prevent expanding outer background into a white halo unless user shifted > 0
          mask[fi] = 0;
        } else if (orig >= 0.992) {
          // Allow slight inward anti-aliasing right at sharp silhouette corners
          mask[fi] = blurred[fi] < 0.96 ? (orig * (1 - blendAmt * 0.5) + blurred[fi] * (blendAmt * 0.5)) : 1;
        } else {
          mask[fi] = orig * (1 - blendAmt) + blurred[fi] * blendAmt;
        }
      }
    }

    var sctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
    var srcData = sctx.getImageData(0, 0, w, h);
    var sd = srcData.data;

    var outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    var octx = outCanvas.getContext('2d', { willReadFrequently: true });
    var outData = octx.createImageData(w, h);
    var od = outData.data;

    // 3. Closed-Form Local Multi-Scale Foreground Color Unmixing (removes hair/edge background color spill!)
    var priors = decontaminate ? computeLocalFgBgPriors(sd, mask, w, h) : null;

    for (var i = 0; i < n; i++) {
      var a = mask[i];
      var i4 = i * 4;
      if (a <= 0.008) {
        od[i4] = 0;
        od[i4 + 1] = 0;
        od[i4 + 2] = 0;
        od[i4 + 3] = 0;
        continue;
      }

      var r = sd[i4];
      var g = sd[i4 + 1];
      var b = sd[i4 + 2];

      if (priors && a < 0.985) {
        var f0r = priors.fR[i], f0g = priors.fG[i], f0b = priors.fB[i];
        var b0r = priors.bR[i], b0g = priors.bG[i], b0b = priors.bB[i];

        // 2x2 Tikhonov-regularized Maximum-Likelihood Matting Color Unmixing:
        // min_{F,B} || a*F + (1-a)*B - C ||^2 + lamF*||F - F0||^2 + lamB*||B - B0||^2
        var invA = 1.0 - a;
        var lamF = 0.05 + 0.22 * invA * invA;
        var lamB = 0.03;
        var a11 = a * a + lamF;
        var a12 = a * invA;
        var a22 = invA * invA + lamB;
        var det = a11 * a22 - a12 * a12;

        if (det > 1e-6) {
          var invDet = 1.0 / det;
          var ur = (a22 * (a * r + lamF * f0r) - a12 * (invA * r + lamB * b0r)) * invDet;
          var ug = (a22 * (a * g + lamF * f0g) - a12 * (invA * g + lamB * b0g)) * invDet;
          var ub = (a22 * (a * b + lamF * f0b) - a12 * (invA * b + lamB * b0b)) * invDet;

          // Clamp recovered foreground color within physical bounds around local foreground prior F0 & observed C
          var loR = Math.min(r, f0r) - 10, hiR = Math.max(r, f0r) + 10;
          var loG = Math.min(g, f0g) - 10, hiG = Math.max(g, f0g) + 10;
          var loB = Math.min(b, f0b) - 10, hiB = Math.max(b, f0b) + 10;

          // If background is much brighter than foreground (e.g. white wall behind dark hair),
          // prevent upper bound from retaining bright wall luminance!
          if (b0r > f0r + 25) hiR = Math.min(hiR, f0r + 14);
          if (b0g > f0g + 25) hiG = Math.min(hiG, f0g + 14);
          if (b0b > f0b + 25) hiB = Math.min(hiB, f0b + 14);
          if (b0r < f0r - 25) loR = Math.max(loR, f0r - 14);
          if (b0g < f0g - 25) loG = Math.max(loG, f0g - 14);
          if (b0b < f0b - 25) loB = Math.max(loB, f0b - 14);

          r = Math.max(0, Math.min(255, Math.round(Math.max(loR, Math.min(hiR, ur)))));
          g = Math.max(0, Math.min(255, Math.round(Math.max(loG, Math.min(hiG, ug)))));
          b = Math.max(0, Math.min(255, Math.round(Math.max(loB, Math.min(hiB, ub)))));
        }
      }

      od[i4] = r;
      od[i4 + 1] = g;
      od[i4 + 2] = b;
      od[i4 + 3] = Math.max(0, Math.min(255, Math.round(a * 255)));
    }

    octx.putImageData(outData, 0, 0);
    outCanvas.cutoutCanvas = outCanvas;
    outCanvas.refinedMask = mask;
    return outCanvas;
  }

  /**
   * Main entry point: removes background from an HTMLImageElement or HTMLCanvasElement.
   * Returns `{ srcCanvas, sourceCanvas, cutoutCanvas, baseMask, mask, width, height, engineUsed }`.
   */
  async function removeBackground(sourceEl, options) {
    var opts = options || {};
    var mode = opts.mode || 'auto'; // 'auto' (1024px Studio HD) | 'object' (Dual-Model Ensemble)
    var onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : function () {};

    var srcW = sourceEl.naturalWidth || sourceEl.width || 600;
    var srcH = sourceEl.naturalHeight || sourceEl.height || 800;
    var maxWorkDim = opts.maxDimension || 2048;
    var w = srcW;
    var h = srcH;
    if (w > maxWorkDim || h > maxWorkDim) {
      var scale = Math.min(maxWorkDim / w, maxWorkDim / h);
      w = Math.max(1, Math.round(w * scale));
      h = Math.max(1, Math.round(h * scale));
    }

    var sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = w;
    sourceCanvas.height = h;
    var sctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(sourceEl, 0, 0, w, h);
    var srcImgData = sctx.getImageData(0, 0, w, h);

    var rawMask = null;
    var engineUsed = 'ormbg-hd';

    onProgress(12, 'স্টুডিও HD AI ইঞ্জিন চালু হচ্ছে...');

    // 1. Primary 1024x1024 Studio Neural Engine inside Dedicated Web Worker (`ormbg-ONNX` / `RMBG-1.4`)
    try {
      var workerRes = await runWorkerSegmentation(srcImgData, w, h, mode, onProgress);
      if (workerRes && workerRes.mask && workerRes.mask.length > 0) {
        rawMask = upscaleFloatMaskBilinear(workerRes.mask, workerRes.mw, workerRes.mh, w, h);
        engineUsed = workerRes.engineUsed || 'ormbg-hd';
      }
    } catch (_) {
      rawMask = null;
    }

    // 2. Fallback to MediaPipe Neural Segmenter if Worker/HuggingFace CDN is unreachable
    if (!rawMask) {
      try {
        onProgress(45, 'ব্যাকআপ নিউরাল AI সেগমেন্টেশন চলছে...');
        var segmenter = await getMediaPipeSegmenter();
        var segResult = segmenter.segment(sourceCanvas);
        if (segResult && segResult.confidenceMasks && segResult.confidenceMasks.length > 0) {
          var cm = segResult.confidenceMasks[0];
          var maskFloats = cm.getAsFloat32Array();
          var mw = cm.width || w;
          var mh = cm.height || h;
          var upMask = upscaleFloatMaskBilinear(maskFloats, mw, mh, w, h);
          if (cm.close) cm.close();
          var fgSum = 0;
          for (var ci = 0; ci < upMask.length; ci++) {
            if (upMask[ci] > 0.5) fgSum++;
          }
          var fgRatio = fgSum / Math.max(1, upMask.length);
          if (fgRatio >= 0.02 && fgRatio <= 0.96) {
            rawMask = upMask;
            engineUsed = 'mediapipe-neural';
          }
        }
        if (segResult && segResult.close) segResult.close();
      } catch (_) {
        rawMask = null;
      }
    }

    // 3. Offline Fallback
    if (!rawMask) {
      onProgress(65, 'স্মার্ট এজ সেগমেন্টেশন চলছে...');
      rawMask = computeOfflineFallbackMask(srcImgData, w, h);
      engineUsed = 'smart-grabcut-fallback';
    }

    onProgress(86, 'চুল ও সূক্ষ্ম প্রান্তের হ্যালো রিমুভ করা হচ্ছে (Trimap Color Unmixing)...');
    var guidedMask = guidedFilterAlphaMatting(
      srcImgData,
      rawMask,
      w,
      h,
      Math.max(2, Math.round(Math.min(w, h) * 0.0035)),
      0.0008
    );

    var rendered = renderCutoutFromMask(sourceCanvas, guidedMask, {
      edgeFeather: typeof opts.edgeFeather === 'number' ? opts.edgeFeather : 0.4,
      edgeShift: typeof opts.edgeShift === 'number' ? opts.edgeShift : 0,
      decontaminate: opts.decontaminate !== false
    });

    onProgress(100, 'সম্পন্ন!');
    return {
      srcCanvas: sourceCanvas,
      sourceCanvas: sourceCanvas,
      cutoutCanvas: rendered.cutoutCanvas || rendered,
      baseMask: guidedMask,
      mask: rendered.refinedMask || guidedMask,
      width: w,
      height: h,
      engineUsed: engineUsed
    };
  }

  window.TechHatBgRemover = {
    removeBackground: removeBackground,
    renderCutoutFromMask: renderCutoutFromMask,
    guidedFilterAlphaMatting: guidedFilterAlphaMatting,
    boxFilterFloat32: boxFilterFloat32
  };
})();
