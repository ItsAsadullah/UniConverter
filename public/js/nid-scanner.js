/*!
 * TechHat Image Studio — NID Card Scanner & A4 Print Studio Engine
 * Extracted from image-tools.js for modular architecture.
 * Handles: Smart/Laminated NID auto-detection, 4-corner perspective homography,
 * magnetic edge snap, deglare/text-HD filters, A4/Card sheet composition & PDF export.
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function on(id, ev, fn) { var el = $('#' + id); if (el) el.addEventListener(ev, fn); }

  function isEn() { return document.documentElement.getAttribute('data-lang') === 'en'; }
  function tr(bn, en) { return isEn() ? en : bn; }
  var bDig = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  function toBn(n) {
    if (isEn()) return String(n);
    return String(n).replace(/\d/g, function (d) { return bDig[d]; });
  }
  function fmtSize(bytes) {
    if (window.TechHatImageUtils && window.TechHatImageUtils.fmtSize) return window.TechHatImageUtils.fmtSize(bytes);
    if (!bytes || bytes <= 0) return '0 KB';
    var kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(kb < 10 ? 1 : 0) + ' KB';
    return (kb / 1024).toFixed(2) + ' MB';
  }
  function showToast(msg, enMsg) {
    if (window.TechHatImageUtils && window.TechHatImageUtils.showToast) { window.TechHatImageUtils.showToast(msg, enMsg); return; }
    var text = (enMsg && isEn()) ? enMsg : (typeof msg === 'object' && msg ? (isEn() ? msg.en : msg.bn) : msg);
    if (window.TechHatToast) { window.TechHatToast(text); return; }
  }
  function downloadBlob(blob, filename) {
    if (window.TechHatImageUtils && window.TechHatImageUtils.downloadBlob) { window.TechHatImageUtils.downloadBlob(blob, filename); return; }
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 1500);
  }
  function loadImageFile(file) {
    if (window.TechHatScanGeometry && window.TechHatScanGeometry.load) return window.TechHatScanGeometry.load(file);
    if (window.TechHatImageUtils && window.TechHatImageUtils.loadImageFile) return window.TechHatImageUtils.loadImageFile(file);
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//i.test(file.type || '')) {
        reject(new Error(tr('অনুগ্রহ করে একটি বৈধ ছবি ফাইল নির্বাচন করুন', 'Please select a valid image file')));
        return;
      }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        resolve({
          file: file,
          name: file.name || 'image.png',
          size: file.size || 0,
          type: file.type || 'image/png',
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          url: url,
          img: img
        });
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error(tr('ছবিটি পড়া যায়নি', 'Could not decode image')));
      };
      img.src = url;
    });
  }
  function canvasToBlob(canvas, mime, quality) {
    if (window.TechHatImageUtils && window.TechHatImageUtils.canvasToBlob) return window.TechHatImageUtils.canvasToBlob(canvas, mime, quality);
    return new Promise(function (resolve) {
      canvas.toBlob(function (b) { resolve(b || new Blob([], { type: mime })); }, mime, quality);
    });
  }
  function openDialog(dlg) {
    if (window.TechHatImageUtils && window.TechHatImageUtils.openDialog) { window.TechHatImageUtils.openDialog(dlg); return; }
    if (dlg && dlg.showModal) { if (!dlg.open) dlg.showModal(); } else if (dlg) dlg.setAttribute('open', '');
  }
  function wireDropzone(zone, input, onFiles) {
    if (window.TechHatImageUtils && window.TechHatImageUtils.wireDropzone) {
      window.TechHatImageUtils.wireDropzone(zone, input, onFiles);
      return;
    }
    if (!zone || !input) return;
    if (!input._thInputWired) {
      input._thInputWired = true;
      input.addEventListener('change', function () {
        if (input.files && input.files.length) {
          onFiles(Array.prototype.slice.call(input.files));
          input.value = '';
        }
      });
    }
    if (zone._thDropWired) return;
    zone._thDropWired = true;
    if (zone.tagName !== 'LABEL') {
      zone.addEventListener('click', function (e) {
        if (e.target && e.target.closest && e.target.closest('button, label, input, a, select, textarea')) return;
        input.click();
      });
    }
    ['dragenter', 'dragover'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); zone.classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); zone.classList.remove('is-over'); });
    });
    zone.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        onFiles(Array.prototype.slice.call(e.dataTransfer.files));
      }
    });
  }
  function switchImgTab(tabId) {
    if (window.TechHatImage && window.TechHatImage.switchTab) window.TechHatImage.switchTab(tabId);
  }

  /* ==================================================================
   * 5. ID CARD SCANNER, AUTO EDGE DETECTION, MAGNETIC SNAP, 4-CORNER PERSPECTIVE CROP & TOP-BOTTOM MAKER
   * ================================================================== */
  var combineItems = []; // [{ item, rot:0, flipH:1, fineAngle:0, pts:[{x,y},{x,y},{x,y},{x,y}], autoDetected:bool, cw, ch, snapField }]
  var activeNidIdx = 0;
  var nidMagSnapEnabled = false;
  var nidCropDragActive = false;
  var nidExportPendingAfterDrag = false;
  var combineOut = { blob: null, url: null };
  var combineToken = 0;
  var nidCamStream = null;
  var nidCamSlot = -1;
  var nidCamFacing = 'environment';

  function defaultQuadPts(pad) {
    var p = typeof pad === 'number' ? pad : 0.04;
    return [
      { x: p, y: p },
      { x: 1 - p, y: p },
      { x: 1 - p, y: 1 - p },
      { x: p, y: 1 - p }
    ];
  }

  function cloneQuadPts(pts) {
    return pts.map(function (pt) { return { x: pt.x, y: pt.y }; });
  }

  function buildRotatedCanvas(img, rotDeg, maxDim, flipH) {
    var rot = ((rotDeg % 360) + 360) % 360;
    var swapped = rot === 90 || rot === 270;
    var baseW = swapped ? (img.naturalHeight || img.height) : (img.naturalWidth || img.width);
    var baseH = swapped ? (img.naturalWidth || img.width) : (img.naturalHeight || img.height);
    var scale = maxDim ? Math.min(1, maxDim / Math.max(baseW, baseH)) : 1;
    var w = Math.max(16, Math.round(baseW * scale));
    var h = Math.max(16, Math.round(baseH * scale));
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
    ctx.save();
    ctx.translate(w / 2, h / 2);
    if (flipH === -1) ctx.scale(-1, 1);
    ctx.rotate((rot * Math.PI) / 180);
    var dw = swapped ? h : w;
    var dh = swapped ? w : h;
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
    return c;
  }

  /**
   * Reference NID Card Structural Templates & Capture Scene Handling Profiles (`NID_DETECTION_PROFILES`).
   * Defines the anatomical layout zones, aspect-ratio priors, and multi-scene detection strategies
   * used by `autoDetectCardQuad` to handle every class of Bangladesh National ID card image:
   *  1. `SMART_NID_FRONT`          : ISO ID-1 (1.586:1) Smart Card front — top Bangla/English header +
   *                                  top-left red/gold national emblem + left portrait & signature +
   *                                  center personal fields/Shapla guilloche + right metallic gold IC chip.
   *  2. `SMART_NID_BACK`           : ISO ID-1 (1.586:1) Smart Card back — top full-width 2D PDF417 barcode +
   *                                  middle Bangla address/blood-group block + bottom 3-line OCR-B MRZ.
   *  3. `CLASSIC_LAMINATED_FRONT`  : Laminated paper NID front (1.42..1.66:1) — inner printed black frame +
   *                                  top header divider + left portrait/signature + center fields & red ID NO.
   *  4. `CLASSIC_LAMINATED_BACK`   : Laminated paper NID back (1.42..1.66:1) — inner printed black frame +
   *                                  top address/disclaimer block + bottom 1D/2D barcode.
   *  5. `sceneStrategies`          : Explicit handling rules for:
   *     - `FULL_BLEED_SCAN`        : Already-cropped or full-frame scan (88%..100% of frame) — locks to full
   *                                  card frame (trimming only any 0..3% dark scanner rim) without shrinking.
   *     - `A4_FLATBED_SCAN`        : Small card (3%..24% area, 22%..58% width) on an A4 page or scanner bed
   *                                  (with or without forms/tables/handwriting) — scans down to A4 scales,
   *                                  enforces 4-margin card coverage to reject blank paper, and prevents
   *                                  white-scanner background over-expansion.
   *     - `SURFACE_PERSPECTIVE`    : Handheld angled photo on cloth, table, or desk — estimates Radon tilt
   *                                  and fits 4 independent RANSAC perspective lines with frame-border lock.
   *     - `AUTO_ROTATE_90_180_270` : Vertical (90° CW / 90° CCW) or upside-down (180°) cards — normalizes
   *                                  into upright horizontal orientation using template zone scores.
   *     - `DUAL_CARD_CLONE`        : Masks 1st card (`excludeQuad`) to detect 2nd card on the same sheet.
   */
  var NID_DETECTION_PROFILES = {
    cardTemplates: {
      SMART_NID_FRONT: {
        id: 'SMART_NID_FRONT',
        label: 'স্মার্ট এনআইডি (সামনের পৃষ্ঠা)',
        idealAspect: 1.586,
        aspectRange: [1.44, 1.72],
        zones: {
          headerBand:   { x0: 0.14, y0: 0.03, x1: 0.86, y1: 0.25 },
          emblemTL:     { x0: 0.02, y0: 0.03, x1: 0.16, y1: 0.25 },
          portraitLeft: { x0: 0.03, y0: 0.25, x1: 0.31, y1: 0.82 },
          signatureBL:  { x0: 0.03, y0: 0.78, x1: 0.31, y1: 0.95 },
          infoFields:   { x0: 0.30, y0: 0.25, x1: 0.72, y1: 0.94 },
          smartChipR:   { x0: 0.72, y0: 0.44, x1: 0.93, y1: 0.70 },
          lotusMarkTR:  { x0: 0.76, y0: 0.10, x1: 0.95, y1: 0.36 }
        }
      },
      SMART_NID_BACK: {
        id: 'SMART_NID_BACK',
        label: 'স্মার্ট এনআইডি (পেছনের পৃষ্ঠা)',
        idealAspect: 1.586,
        aspectRange: [1.44, 1.72],
        zones: {
          pdf417Top:    { x0: 0.05, y0: 0.04, x1: 0.95, y1: 0.27 },
          addressMid:   { x0: 0.05, y0: 0.28, x1: 0.94, y1: 0.58 },
          mrzBottom:    { x0: 0.05, y0: 0.64, x1: 0.95, y1: 0.93 }
        }
      },
      CLASSIC_LAMINATED_FRONT: {
        id: 'CLASSIC_LAMINATED_FRONT',
        label: 'পুরাতন লেমিনেটেড এনআইডি (সামনের পৃষ্ঠা)',
        idealAspect: 1.54,
        aspectRange: [1.38, 1.68],
        zones: {
          innerFrame:   { insetX: 0.025, insetY: 0.035, headerDividerY: 0.24 },
          headerBand:   { x0: 0.15, y0: 0.04, x1: 0.88, y1: 0.24 },
          emblemTL:     { x0: 0.03, y0: 0.04, x1: 0.17, y1: 0.24 },
          portraitLeft: { x0: 0.03, y0: 0.26, x1: 0.28, y1: 0.84 },
          infoFields:   { x0: 0.27, y0: 0.26, x1: 0.92, y1: 0.93 }
        }
      },
      CLASSIC_LAMINATED_BACK: {
        id: 'CLASSIC_LAMINATED_BACK',
        label: 'পুরাতন লেমিনেটেড এনআইডি (পেছনের পৃষ্ঠা)',
        idealAspect: 1.54,
        aspectRange: [1.38, 1.68],
        zones: {
          innerFrame:   { insetX: 0.025, insetY: 0.035 },
          addressTop:   { x0: 0.05, y0: 0.05, x1: 0.95, y1: 0.52 },
          barcodeBot:   { x0: 0.08, y0: 0.72, x1: 0.92, y1: 0.94 }
        }
      }
    },
    sceneStrategies: {
      FULL_BLEED_SCAN: {
        aspectRange: [1.35, 1.78],
        minOuterMarginLum: 450,
        maxOuterMarginChroma: 38,
        minMidLum: 420
      },
      A4_FLATBED_SCAN: {
        minWidthFrac: 0.28,
        minHeightFrac: 0.125,
        minAreaFrac: 0.038,
        scales: [0.30, 0.36, 0.41, 0.46, 0.52, 0.58, 0.65, 0.685, 0.72, 0.80, 0.88, 0.94, 0.98],
        ratios: [1.585, 1.50, 1.66, 1.42]
      },
      SURFACE_PERSPECTIVE: {
        minBgColorDistForGrow: 75,
        maxPerspectiveSlope: 0.18
      },
      AUTO_ROTATE_90_180_270: {
        vhRatioThreshold: 1.65,
        flip180ThresholdVertical: 0,
        flip180ThresholdHorizontal: -20
      }
    }
  };
  if (typeof window !== 'undefined') {
    window.NID_DETECTION_PROFILES = NID_DETECTION_PROFILES;
  }

  var nidCardOrient = 'landscape';
  function getNidCardOrient(entry) {
    return (entry && (entry.cardOrient === 'portrait' || entry.cardOrient === 'landscape'))
      ? entry.cardOrient
      : (nidCardOrient === 'portrait' ? 'portrait' : 'landscape');
  }

  function autoDetectCardQuad(img, rotDeg, flipH, excludeQuad, seedPt, allowAutoRotate, orientMode) {
    var normRot = (((rotDeg || 0) % 360) + 360) % 360;
    var activeOrient = orientMode === 'portrait' || orientMode === 'landscape' ? orientMode : getNidCardOrient();
    var isPortraitTarget = activeOrient === 'portrait';
    try {
      var c = buildRotatedCanvas(img, normRot, 340, flipH || 1);
      var aw = c.width;
      var ah = c.height;
      var ctx = c.getContext('2d', { willReadFrequently: true });
      var imgData = ctx.getImageData(0, 0, aw, ah);
      var data = imgData.data;

      // Detect and skip top/bottom or left/right dark screenshot letterbox / pillarbox bars (up to #202020 neutral dark gray)
      var activeY0 = Math.max(3, Math.round(ah * 0.015));
      var activeY1 = ah - activeY0;
      var activeX0 = Math.max(3, Math.round(aw * 0.015));
      var activeX1 = aw - activeX0;

      for (var ty = 0; ty < ah * 0.28; ty++) {
        var rowBright = 0, rowChroma = 0, cntT = 0;
        for (var tx = activeX0; tx < activeX1; tx += 4) {
          var ti = (ty * aw + tx) * 4;
          var rT = data[ti], gT = data[ti + 1], bT = data[ti + 2];
          rowBright += rT + gT + bT;
          rowChroma += Math.max(rT, gT, bT) - Math.min(rT, gT, bT);
          cntT++;
        }
        if (cntT > 0 && (rowBright / cntT) < 96 && (rowChroma / cntT) < 18) activeY0 = Math.max(activeY0, ty + 4);
        else break;
      }
      for (var by0 = ah - 1; by0 > ah * 0.72; by0--) {
        var rowBrightB = 0, rowChromaB = 0, cntB = 0;
        for (var txB = activeX0; txB < activeX1; txB += 4) {
          var tiB = (by0 * aw + txB) * 4;
          var rB = data[tiB], gB = data[tiB + 1], bB = data[tiB + 2];
          rowBrightB += rB + gB + bB;
          rowChromaB += Math.max(rB, gB, bB) - Math.min(rB, gB, bB);
          cntB++;
        }
        if (cntB > 0 && (rowBrightB / cntB) < 96 && (rowChromaB / cntB) < 18) activeY1 = Math.min(activeY1, by0 - 4);
        else break;
      }
      for (var lx = 0; lx < aw * 0.28; lx++) {
        var colBrightL = 0, colChromaL = 0, cntL = 0;
        for (var ly = activeY0; ly < activeY1; ly += 4) {
          var li = (ly * aw + lx) * 4;
          var rL = data[li], gL = data[li + 1], bL = data[li + 2];
          colBrightL += rL + gL + bL;
          colChromaL += Math.max(rL, gL, bL) - Math.min(rL, gL, bL);
          cntL++;
        }
        if (cntL > 0 && (colBrightL / cntL) < 96 && (colChromaL / cntL) < 18) activeX0 = Math.max(activeX0, lx + 4);
        else break;
      }
      for (var rx0 = aw - 1; rx0 > aw * 0.72; rx0--) {
        var colBrightR = 0, colChromaR = 0, cntR = 0;
        for (var ry0 = activeY0; ry0 < activeY1; ry0 += 4) {
          var ri0 = (ry0 * aw + rx0) * 4;
          var rR = data[ri0], gR = data[ri0 + 1], bR = data[ri0 + 2];
          colBrightR += rR + gR + bR;
          colChromaR += Math.max(rR, gR, bR) - Math.min(rR, gR, bR);
          cntR++;
        }
        if (cntR > 0 && (colBrightR / cntR) < 96 && (colChromaR / cntR) < 18) activeX1 = Math.min(activeX1, rx0 - 4);
        else break;
      }

      var marginX = activeX0;
      var marginY = activeY0;
      var maxX = activeX1;
      var maxY = activeY1;

      // 1. 3x3 Sobel directional gradients (max across R,G,B)
      var gxSigned = new Float32Array(aw * ah);
      var gySigned = new Float32Array(aw * ah);
      var gxAbs = new Float32Array(aw * ah);
      var gyAbs = new Float32Array(aw * ah);
      var gradMag = new Float32Array(aw * ah);
      var gradHist = new Uint32Array(256);
      var validPixels = 0;

      for (var y = marginY; y < maxY; y++) {
        var r0 = Math.max(0, y - 1) * aw, r1 = y * aw, r2 = Math.min(ah - 1, y + 1) * aw;
        for (var x = marginX; x < maxX; x++) {
          var bestSx = 0, bestSy = 0, maxAx = 0, maxAy = 0;
          var xL1 = Math.max(0, x - 1), xR1 = Math.min(aw - 1, x + 1);
          for (var ch = 0; ch < 3; ch++) {
            var p00 = data[(r0 + xL1) * 4 + ch], p01 = data[(r0 + x) * 4 + ch], p02 = data[(r0 + xR1) * 4 + ch];
            var p10 = data[(r1 + xL1) * 4 + ch],                                p12 = data[(r1 + xR1) * 4 + ch];
            var p20 = data[(r2 + xL1) * 4 + ch], p21 = data[(r2 + x) * 4 + ch], p22 = data[(r2 + xR1) * 4 + ch];
            var sx = ((p02 + 2 * p12 + p22) - (p00 + 2 * p10 + p20)) * 0.25;
            var sy = ((p20 + 2 * p21 + p22) - (p00 + 2 * p01 + p02)) * 0.25;
            if (Math.abs(sx) > maxAx) { maxAx = Math.abs(sx); bestSx = sx; }
            if (Math.abs(sy) > maxAy) { maxAy = Math.abs(sy); bestSy = sy; }
          }
          var g = Math.min(255, Math.hypot(maxAx, maxAy));
          var idx = r1 + x;
          gxSigned[idx] = bestSx;
          gySigned[idx] = bestSy;
          gxAbs[idx] = maxAx;
          gyAbs[idx] = maxAy;
          gradMag[idx] = g;
          gradHist[Math.min(255, g | 0)]++;
          validPixels++;
        }
      }

      var acc = 0, medianG = 4;
      for (var hIdx = 0; hIdx < 256; hIdx++) {
        acc += gradHist[hIdx];
        if (acc >= validPixels * 0.60) { medianG = hIdx; break; }
      }
      var noiseFloor = Math.max(4.0, Math.min(16, medianG * 1.65));

      // Dual background surface estimation inside active non-letterbox area
      var actH = Math.max(16, maxY - marginY);
      var actW = Math.max(16, maxX - marginX);
      var borderBuckets = {}, darkBorderBuckets = {};
      var bestBorder = null, bestBorderN = 0;
      var bestDarkBorder = null, bestDarkBorderN = 0;
      var totalOuterN = 0, darkOuterN = 0;
      for (var by = marginY; by < maxY; by += 2) {
        for (var bx = marginX; bx < maxX; bx += 2) {
          var bIdx = by * aw + bx;
          var bi = bIdx * 4;
          if (data[bi] < 16 && data[bi + 1] < 16 && data[bi + 2] < 16) continue;
          var isOuter = (bx < marginX + actW * 0.16 || bx > maxX - actW * 0.16 ||
                         by < marginY + actH * 0.18 || by > maxY - actH * 0.18);
          if (isOuter) {
            totalOuterN++;
            var bLum = data[bi] + data[bi + 1] + data[bi + 2];
            var key = ((data[bi] >> 4) << 8) | ((data[bi + 1] >> 4) << 4) | (data[bi + 2] >> 4);
            var be = borderBuckets[key];
            if (!be) { be = { n: 0, r: 0, g: 0, b: 0 }; borderBuckets[key] = be; }
            be.n++; be.r += data[bi]; be.g += data[bi + 1]; be.b += data[bi + 2];
            if (be.n > bestBorderN) { bestBorderN = be.n; bestBorder = be; }
            if (bLum < 480) {
              darkOuterN++;
              var dbe = darkBorderBuckets[key];
              if (!dbe) { dbe = { n: 0, r: 0, g: 0, b: 0 }; darkBorderBuckets[key] = dbe; }
              dbe.n++; dbe.r += data[bi]; dbe.g += data[bi + 1]; dbe.b += data[bi + 2];
              if (dbe.n > bestDarkBorderN) { bestDarkBorderN = dbe.n; bestDarkBorder = dbe; }
            }
          }
        }
      }
      var chosenBorder = (darkOuterN > totalOuterN * 0.52 && bestDarkBorder) ? bestDarkBorder : bestBorder;
      var bgR = chosenBorder ? (chosenBorder.r / chosenBorder.n) : (totalOuterN === 0 ? 0 : 180);
      var bgG = chosenBorder ? (chosenBorder.g / chosenBorder.n) : (totalOuterN === 0 ? 0 : 180);
      var bgB = chosenBorder ? (chosenBorder.b / chosenBorder.n) : (totalOuterN === 0 ? 0 : 180);

      // Optional exclusion mask when searching for a 2nd card on the same sheet
      var exMinX = -1, exMaxX = -1, exMinY = -1, exMaxY = -1;
      if (excludeQuad && excludeQuad.length === 4) {
        exMinX = Math.floor(Math.min(excludeQuad[0].x, excludeQuad[1].x, excludeQuad[2].x, excludeQuad[3].x) * aw);
        exMaxX = Math.ceil(Math.max(excludeQuad[0].x, excludeQuad[1].x, excludeQuad[2].x, excludeQuad[3].x) * aw);
        exMinY = Math.floor(Math.min(excludeQuad[0].y, excludeQuad[1].y, excludeQuad[2].y, excludeQuad[3].y) * ah);
        exMaxY = Math.ceil(Math.max(excludeQuad[0].y, excludeQuad[1].y, excludeQuad[2].y, excludeQuad[3].y) * ah);
      }

      var seedPx = (seedPt && typeof seedPt.x === 'number') ? { x: seedPt.x * aw, y: seedPt.y * ah } : null;

      // 2. Build 2D Summed Area Tables (Integral Images) for O(1) color, structure, and tangential frame queries
      var sw = aw + 1;
      var satLen = (aw + 1) * (ah + 1);
      var satR = new Float64Array(satLen);
      var satG = new Float64Array(satLen);
      var satB = new Float64Array(satLen);
      var satHoriz = new Float64Array(satLen);
      var satVert = new Float64Array(satLen);
      var satStruct = new Float64Array(satLen);
      var structMap = new Float32Array(aw * ah);

      for (var iy = 1; iy <= ah; iy++) {
        var rowR = 0, rowG = 0, rowB = 0, rowH = 0, rowV = 0, rowS = 0;
        var py0 = iy - 1;
        var srcRow = py0 * aw;
        var dstRow = iy * sw;
        var prevRow = py0 * sw;
        for (var ix = 1; ix <= aw; ix++) {
          var px0 = ix - 1;
          var pIdx = srcRow + px0;
          var pi4 = pIdx * 4;
          var r = data[pi4], g = data[pi4 + 1], b = data[pi4 + 2];
          var isExcluded = (exMinX >= 0 && px0 >= exMinX && px0 <= exMaxX && py0 >= exMinY && py0 <= exMaxY);
          var hEdge = 0, vEdge = 0, sVal = 0;

          if (!isExcluded && px0 >= marginX && px0 < maxX && py0 >= marginY && py0 < maxY) {
            var ax = gxAbs[pIdx], ay = gyAbs[pIdx];
            var gVal = gradMag[pIdx];
            var effG = gVal > noiseFloor ? (gVal - noiseFloor) : 0;

            hEdge = ay > noiseFloor * 0.6 ? Math.max(0, ay - 0.45 * ax) : 0;
            vEdge = ax > noiseFloor * 0.6 ? Math.max(0, ax - 0.45 * ay) : 0;

            var pChroma = Math.max(r, g, b) - Math.min(r, g, b);
            var bgLum0 = bgR + bgG + bgB;
            var bgChroma0 = Math.max(bgR, bgG, bgB) - Math.min(bgR, bgG, bgB);
            var cDist = (bgLum0 < 430 && pChroma < 30 && (r + g + b) >= Math.max(380, bgLum0 + 50)) ? Math.hypot(r - bgR, g - bgG, b - bgB) : 0;
            var cTerm = cDist > 26 ? Math.min(50, (cDist - 26) * 0.58) : 0;
            if (bgLum0 >= 510 && bgChroma0 <= 36) {
              var drB = r - bgR, dgB = g - bgG, dbB = b - bgB;
              var chrShiftB = Math.hypot(drB - dgB, drB - dbB, dgB - dbB);
              var lumDropB = Math.max(0, bgLum0 - (r + g + b)) * 0.22;
              var fbDiff = Math.max(chrShiftB * 1.15, lumDropB);
              if (fbDiff > 12) {
                cTerm = Math.max(cTerm, Math.min(26, (fbDiff - 12) * 0.78));
              }
            }
            var hvAlign = (hEdge + vEdge) / (gVal + 1);
            sVal = effG * (0.85 + 0.90 * hvAlign) + cTerm;
          }

          structMap[pIdx] = sVal;
          rowR += r; rowG += g; rowB += b;
          rowH += hEdge; rowV += vEdge; rowS += sVal;

          satR[dstRow + ix] = satR[prevRow + ix] + rowR;
          satG[dstRow + ix] = satG[prevRow + ix] + rowG;
          satB[dstRow + ix] = satB[prevRow + ix] + rowB;
          satHoriz[dstRow + ix] = satHoriz[prevRow + ix] + rowH;
          satVert[dstRow + ix] = satVert[prevRow + ix] + rowV;
          satStruct[dstRow + ix] = satStruct[prevRow + ix] + rowS;
        }
      }

      function rectSum(sat, x0, y0, x1, y1) {
        var ax0 = Math.max(0, Math.min(aw, x0 | 0));
        var ay0 = Math.max(0, Math.min(ah, y0 | 0));
        var ax1 = Math.max(ax0, Math.min(aw, x1 | 0));
        var ay1 = Math.max(ay0, Math.min(ah, y1 | 0));
        return sat[ay1 * sw + ax1] - sat[ay0 * sw + ax1] - sat[ay1 * sw + ax0] + sat[ay0 * sw + ax0];
      }

      // Stage 1: Auto-rotation for sideways cards (90° CW / 90° CCW) into target card axis
      var cx0R = Math.round(marginX + actW * 0.15);
      var cx1R = Math.round(maxX - actW * 0.15);
      var cy0R = Math.round(marginY + actH * 0.15);
      var cy1R = Math.round(maxY - actH * 0.15);
      var centralHoriz = rectSum(satHoriz, cx0R, cy0R, cx1R, cy1R);
      var centralVert = rectSum(satVert, cx0R, cy0R, cx1R, cy1R);
      if (allowAutoRotate === true && !excludeQuad && !seedPt && !isPortraitTarget) {
        var fastRotThresh = actW < actH * 0.85
          ? NID_DETECTION_PROFILES.sceneStrategies.AUTO_ROTATE_90_180_270.vhRatioThreshold
          : Math.max(1.85, NID_DETECTION_PROFILES.sceneStrategies.AUTO_ROTATE_90_180_270.vhRatioThreshold);
        if (centralVert > centralHoriz * fastRotThresh) {
          return autoDetectCardQuad(img, (normRot + 90) % 360, flipH, null, null, 'check180', activeOrient);
        }
      }

      // Stage 1.5: Scene Strategy `FULL_BLEED_SCAN` — handle already-cropped / full-frame scanned ID cards (Front & Back)
      var actAspect = isPortraitTarget ? (actH / Math.max(1, actW)) : (actW / Math.max(1, actH));
      var fbCfg = NID_DETECTION_PROFILES.sceneStrategies.FULL_BLEED_SCAN;
      if (!excludeQuad && !seedPt && actAspect >= fbCfg.aspectRange[0] && actAspect <= fbCfg.aspectRange[1]) {
        var fbBoxRGB = function (rx0, ry0, rx1, ry1) {
          var bx0 = Math.round(marginX + actW * rx0), by0 = Math.round(marginY + actH * ry0);
          var bx1 = Math.round(marginX + actW * rx1), by1 = Math.round(marginY + actH * ry1);
          var bArea = Math.max(1, (bx1 - bx0) * (by1 - by0));
          var r = rectSum(satR, bx0, by0, bx1, by1) / bArea;
          var g = rectSum(satG, bx0, by0, bx1, by1) / bArea;
          var b = rectSum(satB, bx0, by0, bx1, by1) / bArea;
          var st = rectSum(satStruct, bx0, by0, bx1, by1) / bArea;
          var ch = Math.max(r, g, b) - Math.min(r, g, b);
          return { r: r, g: g, b: b, lum: r + g + b, chroma: ch, st: st };
        };
        var fbMid = fbBoxRGB(0.15, 0.15, 0.85, 0.85);
        // Sample the 3.5% outer card border margins (before the top PDF417 barcode or header text begins)
        var fbTopM = fbBoxRGB(0.05, 0.004, 0.95, 0.036);
        var fbBotM = fbBoxRGB(0.05, 0.964, 0.95, 0.996);
        var fbLeftM = fbBoxRGB(0.004, 0.05, 0.036, 0.95);
        var fbRightM = fbBoxRGB(0.964, 0.05, 0.996, 0.95);
        // Sample 4 peripheral rings (3%..15% from each edge) — a true full-bleed card has structure near all 4 edges,
        // whereas an uncropped card sitting on a sheet/table has blank margin in at least 2 of these outer 15% rings.
        var fbTop28 = fbBoxRGB(0.06, 0.03, 0.94, 0.15);
        var fbBot32 = fbBoxRGB(0.06, 0.85, 0.94, 0.97);
        var fbLeft28 = fbBoxRGB(0.03, 0.06, 0.15, 0.94);
        var fbRight28 = fbBoxRGB(0.85, 0.06, 0.97, 0.94);
        var minOuterLum = Math.min(fbTopM.lum, fbBotM.lum, fbLeftM.lum, fbRightM.lum);
        var maxOuterChroma = Math.max(fbTopM.chroma, fbBotM.chroma, fbLeftM.chroma, fbRightM.chroma);
        if (minOuterLum >= fbCfg.minOuterMarginLum &&
            maxOuterChroma <= fbCfg.maxOuterMarginChroma &&
            fbMid.lum >= fbCfg.minMidLum &&
            fbTop28.st > noiseFloor * 0.65 &&
            fbBot32.st > noiseFloor * 0.65 &&
            fbLeft28.st > noiseFloor * 0.55 &&
            fbRight28.st > noiseFloor * 0.55) {
          var fbTopHalfH = rectSum(satHoriz, marginX, marginY, maxX, marginY + (actH >> 1));
          var fbBotHalfH = rectSum(satHoriz, marginX, marginY + (actH >> 1), maxX, maxY);
          if (allowAutoRotate && (!isPortraitTarget ? (fbBotHalfH > fbTopHalfH * 1.45) : (allowAutoRotate === 'check180' && fbBotHalfH > fbTopHalfH * 1.75))) {
            return autoDetectCardQuad(img, (normRot + 180) % 360, flipH, null, null, false, activeOrient);
          }
          var defaultPadX = Math.max(3, Math.round(aw * 0.015));
          var defaultPadY = Math.max(3, Math.round(ah * 0.015));
          var hasLetterbox = (activeX0 > defaultPadX + 2) || (activeX1 < aw - defaultPadX - 2) ||
                             (activeY0 > defaultPadY + 2) || (activeY1 < ah - defaultPadY - 2);
          return {
            pts: hasLetterbox ? [
              { x: +(marginX / aw).toFixed(4), y: +(marginY / ah).toFixed(4) },
              { x: +(maxX / aw).toFixed(4),    y: +(marginY / ah).toFixed(4) },
              { x: +(maxX / aw).toFixed(4),    y: +(maxY / ah).toFixed(4) },
              { x: +(marginX / aw).toFixed(4), y: +(maxY / ah).toFixed(4) }
            ] : defaultQuadPts(0),
            auto: true,
            rot: normRot,
            sceneMode: 'FULL_BLEED_SCAN'
          };
        }
      }

      var a4Cfg = NID_DETECTION_PROFILES.sceneStrategies.A4_FLATBED_SCAN;
      function scoreCandidateBox(x0, y0, x1, y1, isVertMode) {
        var w = x1 - x0, h = y1 - y0;
        if (!isVertMode) {
          if (w < aw * a4Cfg.minWidthFrac || h < ah * a4Cfg.minHeightFrac) return -1;
        } else {
          var minWPort = isPortraitTarget ? aw * (a4Cfg.minHeightFrac * 0.65) : aw * a4Cfg.minHeightFrac;
          var minHPort = isPortraitTarget ? ah * (a4Cfg.minWidthFrac * 0.65) : ah * a4Cfg.minWidthFrac;
          if (h < minHPort || w < minWPort) return -1;
        }
        var area = w * h;
        var frameArea = aw * ah;
        var minAreaReq = isPortraitTarget ? frameArea * (a4Cfg.minAreaFrac * 0.48) : frameArea * a4Cfg.minAreaFrac;
        var maxAreaReq = isPortraitTarget ? frameArea * 0.985 : frameArea * 0.96;
        if (area < minAreaReq || area > maxAreaReq) return -1;

        if (seedPx) {
          if (seedPx.x < x0 + w * 0.08 || seedPx.x > x1 - w * 0.08 ||
              seedPx.y < y0 + h * 0.08 || seedPx.y > y1 - h * 0.08) return -1;
        }

        var aspect = isVertMode ? (h / Math.max(1, w)) : (w / Math.max(1, h));
        var isLandscape = aspect >= 1.28 && aspect <= 1.88;
        if (!isLandscape) return -1;
        var normAspect = aspect;

        var inSum = rectSum(satStruct, x0, y0, x1, y1);
        var inMean = inSum / area;
        if (inMean < 2.0) return -1;

        // 4-quadrant internal distribution check + 4-margin card coverage check (rejects boxes with blank A4 paper strips)
        var mx = (x0 + x1) >> 1, my = (y0 + y1) >> 1;
        var qArea = Math.max(1, area * 0.25);
        var q0 = rectSum(satStruct, x0, y0, mx, my) / qArea;
        var q1 = rectSum(satStruct, mx, y0, x1, my) / qArea;
        var q2 = rectSum(satStruct, x0, my, mx, y1) / qArea;
        var q3 = rectSum(satStruct, mx, my, x1, y1) / qArea;
        var activeQuads = (q0 > inMean * 0.20 ? 1 : 0) + (q1 > inMean * 0.20 ? 1 : 0) +
                          (q2 > inMean * 0.20 ? 1 : 0) + (q3 > inMean * 0.20 ? 1 : 0);
        if (activeQuads < 3) return -1;

        var minHalf = Math.min(q0 + q1, q2 + q3) * 0.5;
        var minSide = Math.min(q0 + q2, q1 + q3) * 0.5;
        var balanceFactor = Math.min(1.25, (minHalf / (inMean + 1)) * 0.6 + (minSide / (inMean + 1)) * 0.6);

        // Exterior surround structural contrast
        var padX = Math.max(5, Math.round(w * 0.16));
        var padY = Math.max(6, Math.round(h * 0.18));
        var ox0 = Math.max(marginX, x0 - padX), oy0 = Math.max(marginY, y0 - padY);
        var ox1 = Math.min(maxX, x1 + padX), oy1 = Math.min(maxY, y1 + padY);
        var rawOuterArea = (ox1 - ox0) * (oy1 - oy0) - area;
        var outerArea = Math.max(1, rawOuterArea);
        var outerSum = Math.max(0, rectSum(satStruct, ox0, oy0, ox1, oy1) - inSum);
        var outerMean = rawOuterArea >= area * 0.08 ? (outerSum / outerArea) : inMean * 0.85;
        var structContrast = (inMean + 4.5) / (outerMean + 5.5);

        // Exact O(1) Local Card-vs-Surround RGB Contrast
        var inR = rectSum(satR, x0, y0, x1, y1) / area;
        var inG = rectSum(satG, x0, y0, x1, y1) / area;
        var inB = rectSum(satB, x0, y0, x1, y1) / area;
        var outR = rawOuterArea >= 16 ? (rectSum(satR, ox0, oy0, ox1, oy1) - inR * area) / outerArea : bgR;
        var outG = rawOuterArea >= 16 ? (rectSum(satG, ox0, oy0, ox1, oy1) - inG * area) / outerArea : bgG;
        var outB = rawOuterArea >= 16 ? (rectSum(satB, ox0, oy0, ox1, oy1) - inB * area) / outerArea : bgB;
        var localColorDiff = Math.hypot(inR - outR, inG - outG, inB - outB);

        // Penalize boxes that chop off the top header ("গণপ্রজাতন্ত্রী বাংলাদেশ সরকার") or bottom of the card
        var topStripArea = Math.max(1, w * (y0 - oy0));
        var botStripArea = Math.max(1, w * (oy1 - y1));
        var cutPenalty = 1.0;
        if (y0 - oy0 >= 4 && oy1 - y1 >= 4) {
          var tR = rectSum(satR, x0, oy0, x1, y0) / topStripArea;
          var tG = rectSum(satG, x0, oy0, x1, y0) / topStripArea;
          var tB = rectSum(satB, x0, oy0, x1, y0) / topStripArea;
          var bR = rectSum(satR, x0, y1, x1, oy1) / botStripArea;
          var bG = rectSum(satG, x0, y1, x1, oy1) / botStripArea;
          var bB = rectSum(satB, x0, y1, x1, oy1) / botStripArea;
          var topDiffToCard = Math.hypot(tR - inR, tG - inG, tB - inB);
          var botDiffToCard = Math.hypot(bR - inR, bG - inG, bB - inB);
          var topBotAsym = Math.hypot(tR - bR, tG - bG, tB - bB);
          var bgLum = bgR + bgG + bgB;
          var topOutSt = rectSum(satStruct, x0, oy0, x1, y0) / topStripArea;
          var botOutSt = rectSum(satStruct, x0, y1, x1, oy1) / botStripArea;
          if (bgLum < 430 || topOutSt > inMean * 0.45) {
            if (topDiffToCard < 24 && botDiffToCard > 60 && topBotAsym > 48) {
              cutPenalty *= 0.48;
            }
          }
          if (bgLum < 430 || botOutSt > inMean * 0.45) {
            if (botDiffToCard < 24 && topDiffToCard > 60 && topBotAsym > 48) {
              cutPenalty *= 0.48;
            }
          }
          var topDiffToBg = Math.hypot(tR - bgR, tG - bgG, tB - bgB);
          var botDiffToBg = Math.hypot(bR - bgR, bG - bgG, bB - bgB);
          if (topBotAsym > 85 && botDiffToBg < 35 && topDiffToBg > 85 && (tR + tG + tB) >= (inR + inG + inB) - 35) {
            cutPenalty *= 0.22;
          }
          if (topBotAsym > 85 && topDiffToBg < 35 && botDiffToBg > 85 && (bR + bG + bB) >= (inR + inG + inB) - 35) {
            cutPenalty *= 0.22;
          }
          if (bgLum < 380 && topDiffToCard < 38 && botDiffToCard < 38 && topDiffToBg > 75 && botDiffToBg > 75) {
            cutPenalty *= 0.15;
          }
        }
        var leftStripArea = Math.max(1, (x0 - ox0) * h);
        var rightStripArea = Math.max(1, (ox1 - x1) * h);
        var leftOutSt = (x0 - ox0 >= 4) ? rectSum(satStruct, ox0, y0, x0, y1) / leftStripArea : inMean * 0.85;
        var rightOutSt = (ox1 - x1 >= 4) ? rectSum(satStruct, x1, y0, ox1, y1) / rightStripArea : inMean * 0.85;
        var topOutSt0 = (y0 - oy0 >= 4) ? rectSum(satStruct, x0, oy0, x1, y0) / topStripArea : inMean * 0.85;
        var botOutSt0 = (oy1 - y1 >= 4) ? rectSum(satStruct, x0, y1, x1, oy1) / botStripArea : inMean * 0.85;
        if (x0 - ox0 >= 4 && ox1 - x1 >= 4) {
          var lR = rectSum(satR, ox0, y0, x0, y1) / leftStripArea;
          var lG = rectSum(satG, ox0, y0, x0, y1) / leftStripArea;
          var lB = rectSum(satB, ox0, y0, x0, y1) / leftStripArea;
          var rR = rectSum(satR, x1, y0, ox1, y1) / rightStripArea;
          var rG = rectSum(satG, x1, y0, ox1, y1) / rightStripArea;
          var rB = rectSum(satB, x1, y0, ox1, y1) / rightStripArea;
          var leftDiffToCard = Math.hypot(lR - inR, lG - inG, lB - inB);
          var rightDiffToCard = Math.hypot(rR - inR, rG - inG, rB - inB);
          var leftRightAsym = Math.hypot(lR - rR, lG - rG, lB - rB);
          if (leftOutSt > inMean * 0.78 && leftDiffToCard < 28 && rightDiffToCard > 60 && leftRightAsym > 48) {
            cutPenalty *= 0.42;
          }
          if (rightOutSt > inMean * 0.78 && rightDiffToCard < 28 && leftDiffToCard > 60 && leftRightAsym > 48) {
            cutPenalty *= 0.42;
          }
        }

        if (w >= aw * 0.65 && Math.max(topOutSt0, botOutSt0) < inMean * 0.52 && Math.min(leftOutSt, rightOutSt) < inMean * 0.58) {
          var clean3Mean = (topOutSt0 + botOutSt0 + Math.min(leftOutSt, rightOutSt)) / 3;
          if (clean3Mean < outerMean) {
            outerMean = clean3Mean * 0.75 + outerMean * 0.25;
            structContrast = (inMean + 4.5) / (outerMean + 5.5);
          }
        }

        // Penalize candidate boxes whose top+bottom (or left+right) inner 12% margins are both dark background or blank table/pouch
        var inBandH12 = Math.max(3, Math.round(h * 0.12));
        var inBandW12 = Math.max(3, Math.round(w * 0.12));
        var midY0 = y0 + Math.round(h * 0.25), midY1 = y1 - Math.round(h * 0.25);
        var midX0 = x0 + Math.round(w * 0.25), midX1 = x1 - Math.round(w * 0.25);
        var midAreaH = Math.max(1, w * (midY1 - midY0));
        var midAreaW = Math.max(1, h * (midX1 - midX0));
        var midLumH = (rectSum(satR, x0, midY0, x1, midY1) + rectSum(satG, x0, midY0, x1, midY1) + rectSum(satB, x0, midY0, x1, midY1)) / midAreaH;
        var midLumW = (rectSum(satR, midX0, y0, midX1, y1) + rectSum(satG, midX0, y0, midX1, y1) + rectSum(satB, midX0, y0, midX1, y1)) / midAreaW;
        var topArea12 = Math.max(1, w * inBandH12);
        var botArea12 = Math.max(1, w * inBandH12);
        var topInR = rectSum(satR, x0, y0, x1, y0 + inBandH12) / topArea12;
        var topInG = rectSum(satG, x0, y0, x1, y0 + inBandH12) / topArea12;
        var topInB = rectSum(satB, x0, y0, x1, y0 + inBandH12) / topArea12;
        var topInLum = topInR + topInG + topInB;
        var botInR = rectSum(satR, x0, y1 - inBandH12, x1, y1) / botArea12;
        var botInG = rectSum(satG, x0, y1 - inBandH12, x1, y1) / botArea12;
        var botInB = rectSum(satB, x0, y1 - inBandH12, x1, y1) / botArea12;
        var botInLum = botInR + botInG + botInB;
        var topInChroma = Math.max(topInR, topInG, topInB) - Math.min(topInR, topInG, topInB);
        var botInChroma = Math.max(botInR, botInG, botInB) - Math.min(botInR, botInG, botInB);
        var topDiffBg12 = Math.hypot(topInR - bgR, topInG - bgG, topInB - bgB);
        var botDiffBg12 = Math.hypot(botInR - bgR, botInG - bgG, botInB - bgB);
        var topInStruct = rectSum(satStruct, x0, y0, x1, y0 + inBandH12) / topArea12;
        var botInStruct = rectSum(satStruct, x0, y1 - inBandH12, x1, y1) / botArea12;
        var leftArea12 = Math.max(1, h * inBandW12);
        var rightArea12 = Math.max(1, h * inBandW12);
        var leftInR = rectSum(satR, x0, y0, x0 + inBandW12, y1) / leftArea12;
        var leftInG = rectSum(satG, x0, y0, x0 + inBandW12, y1) / leftArea12;
        var leftInB = rectSum(satB, x0, y0, x0 + inBandW12, y1) / leftArea12;
        var rightInR = rectSum(satR, x1 - inBandW12, y0, x1, y1) / rightArea12;
        var rightInG = rectSum(satG, x1 - inBandW12, y0, x1, y1) / rightArea12;
        var rightInB = rectSum(satB, x1 - inBandW12, y0, x1, y1) / rightArea12;
        var leftInStruct = rectSum(satStruct, x0, y0, x0 + inBandW12, y1) / leftArea12;
        var rightInStruct = rectSum(satStruct, x1 - inBandW12, y0, x1, y1) / rightArea12;
        var leftInLum = leftInR + leftInG + leftInB;
        var rightInLum = rightInR + rightInG + rightInB;
        var leftDiffBg12 = Math.hypot(leftInR - bgR, leftInG - bgG, leftInB - bgB);
        var rightDiffBg12 = Math.hypot(rightInR - bgR, rightInG - bgG, rightInB - bgB);
        var lrWarmthAsym = Math.abs((leftInR - leftInB) - (rightInR - rightInB));
        var isColoredPortraitHeaders = isPortraitTarget && (bgLum >= 460 || (topInChroma > 36 && topDiffBg12 > 52 && botInChroma > 36 && botDiffBg12 > 52));
        if ((midLumH - topInLum > 165 && midLumH - botInLum > 165 && !isColoredPortraitHeaders && (bgLum < 460 || Math.max(topInChroma, botInChroma) < 32)) ||
            (midLumW - leftInLum > 165 && midLumW - rightInLum > 165 && (bgLum < 460 || !isPortraitTarget))) {
          cutPenalty *= 0.16;
        }
        if ((midLumH - topInLum > 65 && midLumH - botInLum > 65 && ((bgR + bgG + bgB) < 460 || (topInLum > bgR + bgG + bgB - 40 && botInLum > bgR + bgG + bgB - 40)) && (topInStruct < inMean * 0.72 || botInStruct < inMean * 0.72))) {
          cutPenalty *= 0.28;
        }
        if ((topInLum - midLumH > 65 && topInStruct < inMean * 0.60) ||
            (botInLum - midLumH > 65 && botInStruct < inMean * 0.60) ||
            (leftInStruct < inMean * 0.28 && w > aw * 0.76) ||
            (leftInStruct < inMean * 0.35 && rightInStruct < inMean * 0.55 && w > aw * 0.86)) {
          cutPenalty *= 0.28;
        }
        var topDarkDeskLeak = (bgLum < 460 && !(isPortraitTarget && topInChroma > 36 && topDiffBg12 > 52)) || topDiffBg12 < 52 || (!isPortraitTarget && topInChroma < 28 && topInStruct < inMean * 0.55);
        var botDarkDeskLeak = (bgLum < 460 && !(isPortraitTarget && botInChroma > 36 && botDiffBg12 > 52)) || botDiffBg12 < 52 || (!isPortraitTarget && botInChroma < 28 && botInStruct < inMean * 0.55);
        if ((topDarkDeskLeak && midLumH - topInLum > 115 && botInLum - topInLum > 100 && (topInLum < 310 || topInStruct < inMean * 0.75)) ||
            (botDarkDeskLeak && midLumH - botInLum > 115 && topInLum - botInLum > 100 && (botInLum < 310 || botInStruct < inMean * 0.75)) ||
            (midLumW - leftInLum > 95 && rightInLum - leftInLum > 95 && (leftInLum < 320 || leftDiffBg12 < 52) && leftInStruct < inMean * 0.65) ||
            (midLumW - rightInLum > 95 && leftInLum - rightInLum > 95 && (rightInLum < 320 || rightDiffBg12 < 52) && rightInStruct < inMean * 0.65) ||
            (lrWarmthAsym > 26 && (bgR + bgG + bgB) < 430 && Math.min(leftInStruct, rightInStruct) < inMean * 0.55)) {
          cutPenalty *= 0.22;
        }

        var inLum = inR + inG + inB;
        var outLum = outR + outG + outB;
        if (outLum > inLum + 18 && (inLum < 360 || outerMean > inMean * 0.75)) {
          cutPenalty *= 0.16;
        }
        if (area / frameArea < 0.85 && outerMean > inMean * 0.82 && Math.max(Math.min(topOutSt0, botOutSt0), Math.min(leftOutSt, rightOutSt)) > inMean * 0.45) {
          cutPenalty *= 0.12;
        }
        var blueExcess = Math.max(0, inB - Math.max(inR, inG));
        var paperBonus = (isVertMode && isPortraitTarget && inLum > 420) ? 1.15 : (blueExcess > 16 ? Math.max(0.30, 1 - (blueExcess - 16) * 0.03) : 1.15);
        var effColorDiff = outLum > inLum + 10 ? ((isVertMode && isPortraitTarget && inLum > 460 && outerMean < inMean * 0.42 && Math.max(topInChroma, botInChroma) > 36) ? localColorDiff * 0.8 : 0) : localColorDiff;
        var colorContrastBoost = 1 + Math.min(2.2, effColorDiff / 36);

        // 4-side tangential boundary frame energy
        var bandX = Math.max(3, Math.round(w * 0.05));
        var bandY = Math.max(3, Math.round(h * 0.06));
        var topEdge = rectSum(satHoriz, x0, y0 - bandY, x1, y0 + bandY) / Math.max(1, w * bandY * 2);
        var botEdge = rectSum(satHoriz, x0, y1 - bandY, x1, y1 + bandY) / Math.max(1, w * bandY * 2);
        var leftEdge = rectSum(satVert, x0 - bandX, y0, x0 + bandX, y1) / Math.max(1, h * bandX * 2);
        var rightEdge = rectSum(satVert, x1 - bandX, y0, x1 + bandX, y1) / Math.max(1, h * bandX * 2);

        // Multi-object & passport-photo rejection: reject boxes that bridge across an empty background gap
        // (e.g. two side-by-side passport photos on an A4 scan), pad a narrow portrait with blank paper,
        // or contain royal-blue studio portrait backdrops / extreme two-photo half splits.
        var bgChromaBox = Math.max(bgR, bgG, bgB) - Math.min(bgR, bgG, bgB);
        var hasStudioBlueStrip = false;
        var hitLongGap = false;
        for (var slIdx = 0; slIdx < 13; slIdx++) {
          var f0 = 0.12 + slIdx * 0.056, f1 = f0 + 0.08;
          var slSt, slR, slG, slB, slEdgeA, slEdgeB;
          if (!isVertMode) {
            var slX0 = x0 + Math.round(w * f0), slX1 = Math.max(slX0 + 1, x0 + Math.round(w * f1));
            var slW = slX1 - slX0, slArea = Math.max(1, slW * h);
            slSt = rectSum(satStruct, slX0, y0, slX1, y1) / slArea;
            slR = rectSum(satR, slX0, y0, slX1, y1) / slArea;
            slG = rectSum(satG, slX0, y0, slX1, y1) / slArea;
            slB = rectSum(satB, slX0, y0, slX1, y1) / slArea;
            slEdgeA = rectSum(satHoriz, slX0, y0 - bandY, slX1, y0 + bandY) / Math.max(1, slW * bandY * 2);
            slEdgeB = rectSum(satHoriz, slX0, y1 - bandY, slX1, y1 + bandY) / Math.max(1, slW * bandY * 2);
          } else {
            var slY0 = y0 + Math.round(h * f0), slY1 = Math.max(slY0 + 1, y0 + Math.round(h * f1));
            var slH = slY1 - slY0, slAreaV = Math.max(1, w * slH);
            slSt = rectSum(satStruct, x0, slY0, x1, slY1) / slAreaV;
            slR = rectSum(satR, x0, slY0, x1, slY1) / slAreaV;
            slG = rectSum(satG, x0, slY0, x1, slY1) / slAreaV;
            slB = rectSum(satB, x0, slY0, x1, slY1) / slAreaV;
            slEdgeA = rectSum(satVert, x0 - bandX, slY0, x0 + bandX, slY1) / Math.max(1, bandX * 2 * slH);
            slEdgeB = rectSum(satVert, x1 - bandX, slY0, x1 + bandX, slY1) / Math.max(1, bandX * 2 * slH);
          }
          var slDistBg = Math.min(
            Math.hypot(slR - bgR, slG - bgG, slB - bgB),
            Math.hypot(slR - outR, slG - outG, slB - outB)
          );
          if (!hitLongGap && slDistBg < 24 && slSt < Math.max(1.4, inMean * 0.18) && slEdgeA < 1.35 && slEdgeB < 1.35) {
            hitLongGap = true;
          }
          if (bgChromaBox < 28 && (slB - Math.max(slR, slG)) > 22) {
            hasStudioBlueStrip = true;
          }
        }
        if (hitLongGap) {
          cutPenalty *= 0.02;
        }
        if (hasStudioBlueStrip && !isPortraitTarget) {
          cutPenalty *= 0.22;
        }
        // Short-axis sliding band check: reject multi-row bridges (e.g. 2 passport photos above + narrow blank paper gap + card header below)
        for (var shIdx = 0; shIdx < 13; shIdx++) {
          var sf0 = 0.13 + shIdx * 0.055, sf1 = sf0 + 0.085;
          var shSt, shR, shG, shB;
          if (!isVertMode) {
            var shX0 = x0 + Math.round(w * 0.12), shX1 = Math.max(shX0 + 1, x1 - Math.round(w * 0.12));
            var shY0 = y0 + Math.round(h * sf0), shY1 = Math.max(shY0 + 1, y0 + Math.round(h * sf1));
            var shArea = Math.max(1, (shX1 - shX0) * (shY1 - shY0));
            shSt = rectSum(satStruct, shX0, shY0, shX1, shY1) / shArea;
            shR = rectSum(satR, shX0, shY0, shX1, shY1) / shArea;
            shG = rectSum(satG, shX0, shY0, shX1, shY1) / shArea;
            shB = rectSum(satB, shX0, shY0, shX1, shY1) / shArea;
          } else {
            var svX0 = x0 + Math.round(w * sf0), svX1 = Math.max(svX0 + 1, x0 + Math.round(w * sf1));
            var svY0 = y0 + Math.round(h * 0.12), svY1 = Math.max(svY0 + 1, y1 - Math.round(h * 0.12));
            var svArea = Math.max(1, (svX1 - svX0) * (svY1 - svY0));
            shSt = rectSum(satStruct, svX0, svY0, svX1, svY1) / svArea;
            shR = rectSum(satR, svX0, svY0, svX1, svY1) / svArea;
            shG = rectSum(satG, svX0, svY0, svX1, svY1) / svArea;
            shB = rectSum(satB, svX0, svY0, svX1, svY1) / svArea;
          }
          var shDistBg = Math.min(
            Math.hypot(shR - bgR, shG - bgG, shB - bgB),
            Math.hypot(shR - outR, shG - outG, shB - outB)
          );
          if (shDistBg < 20 && shSt < Math.max(1.1, inMean * 0.11)) {
            cutPenalty *= 0.02;
            break;
          }
        }
        var halfAreaLong = Math.max(1, area * 0.5);
        var h0R, h0G, h0B, h1R, h1G, h1B;
        if (!isVertMode) {
          h0R = rectSum(satR, x0, y0, mx, y1) / halfAreaLong;
          h0G = rectSum(satG, x0, y0, mx, y1) / halfAreaLong;
          h0B = rectSum(satB, x0, y0, mx, y1) / halfAreaLong;
          h1R = rectSum(satR, mx, y0, x1, y1) / halfAreaLong;
          h1G = rectSum(satG, mx, y0, x1, y1) / halfAreaLong;
          h1B = rectSum(satB, mx, y0, x1, y1) / halfAreaLong;
        } else {
          h0R = rectSum(satR, x0, y0, x1, my) / halfAreaLong;
          h0G = rectSum(satG, x0, y0, x1, my) / halfAreaLong;
          h0B = rectSum(satB, x0, y0, x1, my) / halfAreaLong;
          h1R = rectSum(satR, x0, my, x1, y1) / halfAreaLong;
          h1G = rectSum(satG, x0, my, x1, y1) / halfAreaLong;
          h1B = rectSum(satB, x0, my, x1, y1) / halfAreaLong;
        }
        var halfDiffLimit = (isVertMode && isPortraitTarget) ? 95 : 62;
        if (Math.hypot(h0R - h1R, h0G - h1G, h0B - h1B) > halfDiffLimit) {
          cutPenalty *= 0.25;
        }

        var activeSides = (topEdge > 1.8 ? 1 : 0) + (botEdge > 1.8 ? 1 : 0) +
                          (leftEdge > 1.8 ? 1 : 0) + (rightEdge > 1.8 ? 1 : 0);
        if (isVertMode && isPortraitTarget) {
          // Reject narrow vertical sub-slices across a horizontal landscape card where both side exteriors carry dense card text
          if (leftOutSt > inMean * 0.72 && rightOutSt > inMean * 0.72 && leftEdge < 1.8 && rightEdge < 1.8 && structContrast < 1.15) {
            return -1;
          }
          if (activeSides < 2 && structContrast < 1.12 && localColorDiff < 10) {
            return -1;
          }
        }
        var sideMult = activeSides === 4 ? 1.35 : (activeSides === 3 ? 1.12 : 0.78);
        var frameStrength = (1 + (topEdge + botEdge + leftEdge + rightEdge) * 0.06) * sideMult;

        var aspectDiff = Math.abs(normAspect - 1.56);
        var aspectWeight = Math.exp(-(aspectDiff * aspectDiff) / 0.11);
        var orientBonus = isLandscape ? 1.0 : 0.88;

        var areaFrac = area / frameArea;
        var sizeWeight = areaFrac > 0.96 ? 0.45 : Math.pow(areaFrac, 0.30);

        var seedBonus = 1.0;
        if (seedPx) {
          var distToCenter = Math.hypot((seedPx.x - (x0 + x1) * 0.5) / w, (seedPx.y - (y0 + y1) * 0.5) / h);
          seedBonus = Math.exp(-(distToCenter * distToCenter) * 2.5);
        }

        return inMean * structContrast * colorContrastBoost * paperBonus * cutPenalty * balanceFactor * frameStrength * aspectWeight * orientBonus * sizeWeight * seedBonus;
      }

      var bestBox = null;
      var bestScore = -1;

      var ratios = a4Cfg.ratios;
      var scales = isPortraitTarget ? [0.18, 0.21, 0.24, 0.27].concat(a4Cfg.scales) : a4Cfg.scales;

      if (!isPortraitTarget) {
        for (var sIdx = 0; sIdx < scales.length; sIdx++) {
          var candW = Math.min(maxX - marginX, Math.round(aw * scales[sIdx]));
          for (var rIdx = 0; rIdx < ratios.length; rIdx++) {
            var candH = Math.round(candW / ratios[rIdx]);
            if (candH < ah * a4Cfg.minHeightFrac || candH > maxY - marginY) continue;
            var stepX = Math.max(3, Math.round((aw - candW) > 20 ? candW * 0.065 : 3));
            var stepY = Math.max(4, Math.round(candH * 0.065));
            for (var y0 = marginY; y0 + candH <= maxY; y0 += stepY) {
              for (var x0 = marginX; x0 + candW <= maxX; x0 += stepX) {
                var sc = scoreCandidateBox(x0, y0, x0 + candW, y0 + candH, false);
                if (sc > bestScore) {
                  bestScore = sc;
                  bestBox = { x0: x0, y0: y0, x1: x0 + candW, y1: y0 + candH, score: sc };
                }
              }
            }
          }
        }

        if (allowAutoRotate === true && !excludeQuad && !seedPt) {
          var bestVertScore = -1;
          for (var vsIdx = 0; vsIdx < scales.length; vsIdx++) {
            var vCandH = Math.min(maxY - marginY, Math.round(ah * scales[vsIdx]));
            for (var vrIdx = 0; vrIdx < ratios.length; vrIdx++) {
              var vCandW = Math.round(vCandH / ratios[vrIdx]);
              if (vCandW < aw * a4Cfg.minHeightFrac || vCandW > maxX - marginX) continue;
              var vStepX = Math.max(4, Math.round(vCandW * 0.075));
              var vStepY = Math.max(4, Math.round((ah - vCandH) > 20 ? vCandH * 0.075 : 4));
              for (var vy0 = marginY; vy0 + vCandH <= maxY; vy0 += vStepY) {
                for (var vx0 = marginX; vx0 + vCandW <= maxX; vx0 += vStepX) {
                  var vsc = scoreCandidateBox(vx0, vy0, vx0 + vCandW, vy0 + vCandH, true);
                  if (vsc > bestVertScore) bestVertScore = vsc;
                }
              }
            }
          }
          if (bestVertScore > bestScore * 1.08) {
            return autoDetectCardQuad(img, (normRot + 90) % 360, flipH, null, null, 'check180', activeOrient);
          }
        }
      } else {
        // Portrait ID card mode: search upright vertical ID boxes (`h > w`, ~54×85.6mm) directly without rotating sideways
        for (var psIdx = 0; psIdx < scales.length; psIdx++) {
          var pCandH = Math.min(maxY - marginY, Math.round(ah * scales[psIdx]));
          for (var prIdx = 0; prIdx < ratios.length; prIdx++) {
            var pCandW = Math.round(pCandH / ratios[prIdx]);
            if (pCandW < aw * (a4Cfg.minHeightFrac * 0.65) || pCandW > maxX - marginX) continue;
            var pStepX = Math.max(3, Math.round((aw - pCandW) > 20 ? pCandW * 0.065 : 3));
            var pStepY = Math.max(4, Math.round(pCandH * 0.065));
            for (var py0 = marginY; py0 + pCandH <= maxY; py0 += pStepY) {
              for (var px0 = marginX; px0 + pCandW <= maxX; px0 += pStepX) {
                var psc = scoreCandidateBox(px0, py0, px0 + pCandW, py0 + pCandH, true);
                if (psc > bestScore) {
                  bestScore = psc;
                  bestBox = { x0: px0, y0: py0, x1: px0 + pCandW, y1: py0 + pCandH, score: psc };
                }
              }
            }
          }
        }

        if (allowAutoRotate === true && !excludeQuad && !seedPt) {
          var bestHorizPortScore = -1;
          for (var hsIdx = 0; hsIdx < scales.length; hsIdx++) {
            var hCandW = Math.min(maxX - marginX, Math.round(aw * scales[hsIdx]));
            for (var hrIdx = 0; hrIdx < ratios.length; hrIdx++) {
              var hCandH = Math.round(hCandW / ratios[hrIdx]);
              if (hCandH < ah * (a4Cfg.minHeightFrac * 0.65) || hCandH > maxY - marginY) continue;
              var hStepX = Math.max(4, Math.round((aw - hCandW) > 20 ? hCandW * 0.075 : 4));
              var hStepY = Math.max(4, Math.round(hCandH * 0.075));
              for (var hy0 = marginY; hy0 + hCandH <= maxY; hy0 += hStepY) {
                for (var hx0 = marginX; hx0 + hCandW <= maxX; hx0 += hStepX) {
                  var hsc = scoreCandidateBox(hx0, hy0, hx0 + hCandW, hy0 + hCandH, false);
                  if (hsc > bestHorizPortScore) bestHorizPortScore = hsc;
                }
              }
            }
          }
          if (bestScore <= 0 && bestHorizPortScore > 0 && actW > actH * 1.15) {
            return autoDetectCardQuad(img, (normRot + 90) % 360, flipH, null, null, 'check180', activeOrient);
          }
        }
      }

      if (bestBox) {
        // Fine 4-edge box coordinate refinement
        var base = bestBox;
        var dStep = Math.max(2, Math.round(Math.min(aw, ah) * 0.015));
        for (var dx0 = -3 * dStep; dx0 <= 3 * dStep; dx0 += dStep) {
          for (var dy0 = -3 * dStep; dy0 <= 3 * dStep; dy0 += dStep) {
            for (var dx1 = -3 * dStep; dx1 <= 3 * dStep; dx1 += dStep) {
              for (var dy1 = -3 * dStep; dy1 <= 3 * dStep; dy1 += dStep) {
                var nx0 = base.x0 + dx0, ny0 = base.y0 + dy0;
                var nx1 = base.x1 + dx1, ny1 = base.y1 + dy1;
                if (nx0 < marginX || ny0 < marginY || nx1 > maxX || ny1 > maxY) continue;
                var nAsp = isPortraitTarget
                  ? (ny1 - ny0) / Math.max(1, nx1 - nx0)
                  : (nx1 - nx0) / Math.max(1, ny1 - ny0);
                if (nAsp < 1.36 || nAsp > 1.68) continue;
                var nsc = scoreCandidateBox(nx0, ny0, nx1, ny1, isPortraitTarget);
                if (nsc > bestScore) {
                  bestScore = nsc;
                  bestBox = { x0: nx0, y0: ny0, x1: nx1, y1: ny1, score: nsc };
                }
              }
            }
          }
        }

        // Stage 3: Upright vs 180°-Upside-Down Orientation Verification + Radon Tilt & 4-Line Intersection
        var bw = bestBox.x1 - bestBox.x0;
        var bh = bestBox.y1 - bestBox.y0;

        if (allowAutoRotate && !excludeQuad && !seedPt) {
          var uReg = function (rx0, ry0, rx1, ry1) {
            var ax0 = Math.max(1, Math.round(bestBox.x0 + bw * rx0));
            var ay0 = Math.max(1, Math.round(bestBox.y0 + bh * ry0));
            var ax1 = Math.min(aw - 1, Math.round(bestBox.x0 + bw * rx1));
            var ay1 = Math.min(ah - 1, Math.round(bestBox.y0 + bh * ry1));
            var rArea = Math.max(1, (ax1 - ax0) * (ay1 - ay0));
            var lum = (rectSum(satR, ax0, ay0, ax1, ay1) + rectSum(satG, ax0, ay0, ax1, ay1) + rectSum(satB, ax0, ay0, ax1, ay1)) / rArea;
            var hEdge = rectSum(satHoriz, ax0, ay0, ax1, ay1) / rArea;
            var vEdge = rectSum(satVert, ax0, ay0, ax1, ay1) / rArea;
            var redEx = 0;
            for (var uy = ay0; uy < ay1; uy++) {
              for (var ux = ax0; ux < ax1; ux++) {
                var ui = (uy * aw + ux) * 4;
                var ur = data[ui], ug = data[ui + 1], ub = data[ui + 2];
                if (ur - ug > 18 && ur - ub > 14) redEx += ur - Math.max(ug, ub);
              }
            }
            return { lum: lum, hEdge: hEdge, edge: hEdge + vEdge, redEx: redEx / rArea };
          };
          var topBandU = uReg(0.08, 0.05, 0.92, 0.26);
          var botBandU = uReg(0.08, 0.74, 0.92, 0.95);
          var topHalfU = uReg(0.06, 0.05, 0.94, 0.48);
          var botHalfU = uReg(0.06, 0.52, 0.94, 0.95);
          var topVsBotU = (topBandU.hEdge - botBandU.hEdge) * 1.1 + (topBandU.edge - botBandU.edge) * 0.35 + (topHalfU.hEdge - botHalfU.hEdge);

          if (!isPortraitTarget) {
            var leftPhotoU = uReg(0.05, 0.24, 0.34, 0.86);
            var rightPhotoU = uReg(0.66, 0.14, 0.95, 0.76);
            var tlEmblemU = uReg(0.04, 0.05, 0.22, 0.30);
            var brEmblemU = uReg(0.78, 0.70, 0.96, 0.95);

            var tlVsBrU = (tlEmblemU.hEdge - brEmblemU.hEdge) * 1.1 + (tlEmblemU.edge - brEmblemU.edge) * 0.4 + (tlEmblemU.redEx - brEmblemU.redEx) * 4.5;
            var photoLumDiff = Math.abs(leftPhotoU.edge - rightPhotoU.edge) > 3.5 ? Math.max(-35, Math.min(110, rightPhotoU.lum - leftPhotoU.lum)) * 0.35 : 0;
            var leftVsRightU = (leftPhotoU.edge - rightPhotoU.edge) * 1.6 + photoLumDiff;
            var uprightScore = topVsBotU + tlVsBrU + leftVsRightU;

            var flipThreshold = allowAutoRotate === 'check180' ? 0 : -20;
            if (uprightScore < flipThreshold) {
              return autoDetectCardQuad(img, (normRot + 180) % 360, flipH, null, null, false, activeOrient);
            }
          } else if (allowAutoRotate === 'check180' && topVsBotU < -24) {
            return autoDetectCardQuad(img, (normRot + 180) % 360, flipH, null, null, false, activeOrient);
          }
        }
        // Stage 3: High-Resolution Sub-Degree Radon Tilt, Glare/Chroma-Aware Edge Peak & 7-Slice Perspective RANSAC
        var isSmallCardOnPage = (bw * bh) < (aw * ah * 0.24);
        var hiMaxDim = isSmallCardOnPage ? 920 : 680;
        var hiCanvas = buildRotatedCanvas(img, normRot, hiMaxDim, flipH || 1);
        var s3w = hiCanvas.width, s3h = hiCanvas.height;
        var scaleX3 = s3w / aw, scaleY3 = s3h / ah;
        var pxS = Math.max(1, Math.min(s3w, s3h) / 255);
        var s3Data = data;
        var s3GxSigned = gxSigned, s3GySigned = gySigned, s3GradMag = gradMag, s3StructMap = structMap;
        var bx0_3 = bestBox.x0, by0_3 = bestBox.y0, bx1_3 = bestBox.x1, by1_3 = bestBox.y1;
        var s3MarginX = marginX, s3MarginY = marginY, s3MaxX = maxX, s3MaxY = maxY;

        if (s3w !== aw || s3h !== ah) {
          var hiCtx = hiCanvas.getContext('2d', { willReadFrequently: true });
          s3Data = hiCtx.getImageData(0, 0, s3w, s3h).data;
          bx0_3 = Math.round(bestBox.x0 * scaleX3);
          by0_3 = Math.round(bestBox.y0 * scaleY3);
          bx1_3 = Math.round(bestBox.x1 * scaleX3);
          by1_3 = Math.round(bestBox.y1 * scaleY3);
          s3MarginX = Math.round(marginX * scaleX3);
          s3MarginY = Math.round(marginY * scaleY3);
          s3MaxX = Math.min(s3w - 2, Math.round(maxX * scaleX3));
          s3MaxY = Math.min(s3h - 2, Math.round(maxY * scaleY3));

          var pad3X = Math.max(16, Math.round((bx1_3 - bx0_3) * 0.24));
          var pad3Y = Math.max(16, Math.round((by1_3 - by0_3) * 0.26));
          var rx0_3 = Math.max(1, bx0_3 - pad3X), ry0_3 = Math.max(1, by0_3 - pad3Y);
          var rx1_3 = Math.min(s3w - 1, bx1_3 + pad3X), ry1_3 = Math.min(s3h - 1, by1_3 + pad3Y);

          s3GxSigned = new Float32Array(s3w * s3h);
          s3GySigned = new Float32Array(s3w * s3h);
          s3GradMag = new Float32Array(s3w * s3h);
          s3StructMap = new Float32Array(s3w * s3h);

          for (var hy = ry0_3; hy < ry1_3; hy++) {
            var hr0 = (hy - 1) * s3w, hr1 = hy * s3w, hr2 = (hy + 1) * s3w;
            for (var hx = rx0_3; hx < rx1_3; hx++) {
              var hBestSx = 0, hBestSy = 0, hMaxAx = 0, hMaxAy = 0;
              for (var hc = 0; hc < 3; hc++) {
                var hp00 = s3Data[(hr0 + hx - 1) * 4 + hc], hp01 = s3Data[(hr0 + hx) * 4 + hc], hp02 = s3Data[(hr0 + hx + 1) * 4 + hc];
                var hp10 = s3Data[(hr1 + hx - 1) * 4 + hc],                                     hp12 = s3Data[(hr1 + hx + 1) * 4 + hc];
                var hp20 = s3Data[(hr2 + hx - 1) * 4 + hc], hp21 = s3Data[(hr2 + hx) * 4 + hc], hp22 = s3Data[(hr2 + hx + 1) * 4 + hc];
                var hsx = ((hp02 + 2 * hp12 + hp22) - (hp00 + 2 * hp10 + hp20)) * 0.25;
                var hsy = ((hp20 + 2 * hp21 + hp22) - (hp00 + 2 * hp01 + hp02)) * 0.25;
                if (Math.abs(hsx) > hMaxAx) { hMaxAx = Math.abs(hsx); hBestSx = hsx; }
                if (Math.abs(hsy) > hMaxAy) { hMaxAy = Math.abs(hsy); hBestSy = hsy; }
              }
              var hIdx = hr1 + hx;
              s3GxSigned[hIdx] = hBestSx;
              s3GySigned[hIdx] = hBestSy;
              var hgm = Math.hypot(hMaxAx, hMaxAy);
              s3GradMag[hIdx] = hgm;
              s3StructMap[hIdx] = hgm > noiseFloor ? Math.min(95, hgm - noiseFloor) : 0;
            }
          }
        }

        var bw3 = Math.max(20, bx1_3 - bx0_3);
        var bh3 = Math.max(16, by1_3 - by0_3);
        var cx = (bx0_3 + bx1_3) * 0.5;
        var cy = (by0_3 + by1_3) * 0.5;
        var cardArea = Math.max(1, bw * bh);
        var cardR = rectSum(satR, bestBox.x0, bestBox.y0, bestBox.x1, bestBox.y1) / cardArea;
        var cardG = rectSum(satG, bestBox.x0, bestBox.y0, bestBox.x1, bestBox.y1) / cardArea;
        var cardB = rectSum(satB, bestBox.x0, bestBox.y0, bestBox.x1, bestBox.y1) / cardArea;
        var meanCardLum = cardR + cardG + cardB;
        var subR = 0, subG = 0, subB = 0, subN = 0;
        var pureSubSamples = [];

        var actX = [], actY = [], actGx = [], actGy = [];
        var stepAct = s3w > 420 ? 2 : 1;
        for (var py = by0_3; py < by1_3; py += stepAct) {
          for (var px = bx0_3; px < bx1_3; px += stepAct) {
            var pIdx2 = py * s3w + px;
            var pi2_4 = pIdx2 * 4;
            var pr2 = s3Data[pi2_4], pg2 = s3Data[pi2_4 + 1], pb2 = s3Data[pi2_4 + 2];
            var pLum = pr2 + pg2 + pb2;
            if (pLum >= meanCardLum) {
              subR += pr2; subG += pg2; subB += pb2; subN++;
              var pChr2 = Math.max(pr2, pg2, pb2) - Math.min(pr2, pg2, pb2);
              if (pChr2 <= 24 && s3GradMag[pIdx2] <= noiseFloor * 1.65) {
                pureSubSamples.push({ r: pr2, g: pg2, b: pb2, lum: pLum });
              }
            }
            if (s3GradMag[pIdx2] > noiseFloor * 1.2) {
              actX.push(px - cx);
              actY.push(py - cy);
              actGx.push(s3GxSigned[pIdx2]);
              actGy.push(s3GySigned[pIdx2]);
            }
          }
        }
        if (subN > 16) {
          cardR = subR / subN;
          cardG = subG / subN;
          cardB = subB / subN;
        }
        var cardSubR = cardR, cardSubG = cardG, cardSubB = cardB;
        if (pureSubSamples.length >= 20) {
          pureSubSamples.sort(function (a, b) { return a.lum - b.lum; });
          var psStart = Math.floor(pureSubSamples.length * 0.45);
          var psEnd = Math.max(psStart + 1, Math.floor(pureSubSamples.length * 0.94));
          var psR = 0, psG = 0, psB = 0, psN = 0;
          for (var psi = psStart; psi < psEnd; psi++) {
            psR += pureSubSamples[psi].r;
            psG += pureSubSamples[psi].g;
            psB += pureSubSamples[psi].b;
            psN++;
          }
          if (psN > 0) {
            cardSubR = psR / psN;
            cardSubG = psG / psN;
            cardSubB = psB / psN;
          }
        }

        var bestAngle = 0;
        if (actX.length >= 24) {
          var nBins = 64;
          var histU = new Float32Array(nBins);
          var histV = new Float32Array(nBins);
          var maxSpan = Math.hypot(bw3, bh3) * 0.55;
          var evalRadonDeg = function (degVal) {
            var rad = (degVal * Math.PI) / 180;
            var cosA = Math.cos(rad), sinA = Math.sin(rad);
            histU.fill(0);
            histV.fill(0);
            for (var k = 0; k < actX.length; k++) {
              var u = actX[k] * cosA + actY[k] * sinA;
              var v = -actX[k] * sinA + actY[k] * cosA;
              var gU = Math.abs(actGx[k] * cosA + actGy[k] * sinA);
              var gV = Math.abs(-actGx[k] * sinA + actGy[k] * cosA);
              var bu = Math.floor(((u + maxSpan) / (2 * maxSpan)) * nBins);
              var bv = Math.floor(((v + maxSpan) / (2 * maxSpan)) * nBins);
              if (bu >= 0 && bu < nBins && gU > gV * 1.2) histU[bu] += gU - gV * 0.5;
              if (bv >= 0 && bv < nBins && gV > gU * 1.2) histV[bv] += gV - gU * 0.5;
            }
            var rScore = 0;
            for (var b = 0; b < nBins; b++) {
              rScore += histV[b] * histV[b] + histU[b] * histU[b] * 0.65;
            }
            return rScore;
          };

          var scoreAtZero = evalRadonDeg(0);
          var bestRadonScore = scoreAtZero;
          var bestDeg = 0;

          for (var deg = -28; deg <= 28; deg += 1) {
            var rScore = deg === 0 ? scoreAtZero : evalRadonDeg(deg);
            if (rScore > bestRadonScore) {
              bestRadonScore = rScore;
              bestDeg = deg;
            }
          }
          // Sub-degree 0.25° refinement around bestDeg so 0.5°..2.0° card tilts lock cleanly
          var coarseCenter = bestDeg;
          for (var fDeg = coarseCenter - 1.25; fDeg <= coarseCenter + 1.25; fDeg += 0.25) {
            var fScore = evalRadonDeg(fDeg);
            if (fScore > bestRadonScore) {
              bestRadonScore = fScore;
              bestDeg = fDeg;
            }
          }
          if ((Math.abs(bestDeg) >= 2 && bestRadonScore > scoreAtZero * 1.10) ||
              (Math.abs(bestDeg) >= 0.5 && bestRadonScore > scoreAtZero * 1.035)) {
            bestAngle = (bestDeg * Math.PI) / 180;
          }
        }

        var cosB = Math.cos(bestAngle), sinB = Math.sin(bestAngle);
        var minU = -bw3 * 0.5, maxU = bw3 * 0.5;
        var minV = -bh3 * 0.5, maxV = bh3 * 0.5;

        var cardLum = cardR + cardG + cardB;
        var cardSubLum = cardSubR + cardSubG + cardSubB;
        var cardChroma = Math.max(cardR, cardG, cardB) - Math.min(cardR, cardG, cardB);
        var cardSubChroma = Math.max(cardSubR, cardSubG, cardSubB) - Math.min(cardSubR, cardSubG, cardSubB);
        var cardRG = cardR - cardG, cardRB = cardR - cardB, cardGB = cardG - cardB;
        var cardBgDist = Math.hypot(cardR - bgR, cardG - bgG, cardB - bgB);
        var bgLumGlobal = bgR + bgG + bgB;
        var bgChromaGlobal = Math.max(bgR, bgG, bgB) - Math.min(bgR, bgG, bgB);
        var isWhitePageBg = (cardBgDist < 68 && (bw * bh) < (aw * ah) * 0.56) ||
                            (bgLumGlobal >= 520 && bgChromaGlobal <= 36 && (bw * bh) < (aw * ah) * 0.62);

        var flatbedColorDist = function (r, g, b, refR, refG, refB) {
          var dr = r - refR, dg = g - refG, db = b - refB;
          var euc = Math.hypot(dr, dg, db);
          var dChr = Math.hypot(dr - dg, dr - db, dg - db);
          return Math.hypot(euc * 0.75, dChr * 1.85);
        };

        var sampleLocalSideBg = function (isHorizontal, outSign) {
          var dMin = Math.round(13 * pxS), dMax = Math.round(28 * pxS);
          var sx0, sy0, sx1, sy1;
          if (isHorizontal) {
            sx0 = Math.max(s3MarginX + 2, bx0_3);
            sx1 = Math.min(s3MaxX - 2, bx1_3);
            if (outSign < 0) {
              sy0 = Math.max(s3MarginY + 2, by0_3 - dMax);
              sy1 = Math.max(sy0, by0_3 - dMin);
            } else {
              sy0 = Math.min(s3MaxY - 2, by1_3 + dMin);
              sy1 = Math.min(s3MaxY - 2, by1_3 + dMax);
            }
          } else {
            sy0 = Math.max(s3MarginY + 2, by0_3);
            sy1 = Math.min(s3MaxY - 2, by1_3);
            if (outSign < 0) {
              sx0 = Math.max(s3MarginX + 2, bx0_3 - dMax);
              sx1 = Math.max(sx0, bx0_3 - dMin);
            } else {
              sx0 = Math.min(s3MaxX - 2, bx1_3 + dMin);
              sx1 = Math.min(s3MaxX - 2, bx1_3 + dMax);
            }
          }
          var sumR = 0, sumG = 0, sumB = 0, cnt = 0;
          for (var yy = sy0; yy < sy1; yy += 2) {
            for (var xx = sx0; xx < sx1; xx += 2) {
              if (s3GradMag[yy * s3w + xx] <= noiseFloor * 1.8) {
                var o4 = (yy * s3w + xx) * 4;
                sumR += s3Data[o4]; sumG += s3Data[o4 + 1]; sumB += s3Data[o4 + 2];
                cnt++;
              }
            }
          }
          if (cnt >= 14) {
            return { r: sumR / cnt, g: sumG / cnt, b: sumB / cnt };
          }
          return { r: bgR, g: bgG, b: bgB };
        };

        var bgChroma3 = Math.max(bgR, bgG, bgB) - Math.min(bgR, bgG, bgB);
        var bgRG3 = bgR - bgG, bgRB3 = bgR - bgB, bgGB3 = bgG - bgB;
        var cardSurfaceDist = function (r, g, b) {
          var rawD = Math.hypot(r - cardR, g - cardG, b - cardB);
          var subD = Math.hypot(r - cardSubR, g - cardSubG, b - cardSubB);
          var cShift = Math.hypot((r - g) - cardRG, (r - b) - cardRB, (g - b) - cardGB);
          var ch = Math.max(r, g, b) - Math.min(r, g, b);
          var lm = r + g + b;
          if (!isWhitePageBg && lm >= cardLum * 0.90 && r > 202 && g > 202 && b > 196 && ch <= Math.max(20, cardChroma + 12) && cShift <= 20) {
            return Math.min(rawD, subD, 22);
          }
          if (isWhitePageBg) {
            var subFlatD = flatbedColorDist(r, g, b, cardSubR, cardSubG, cardSubB);
            if (ch > bgChroma3 + 10) {
              var dBgChr = Math.hypot((r - g) - bgRG3, (r - b) - bgRB3, (g - b) - bgGB3);
              var isWarmPouchTint = (cardSubG <= Math.max(cardSubR, cardSubB) + 3 && lm >= bgLumGlobal - 90 && r >= g && g >= b && dBgChr < 28 && subFlatD > 30);
              if (!isWarmPouchTint) return Math.min(rawD, subFlatD);
            }
            return subFlatD;
          }
          return Math.max(Math.min(rawD, subD * 1.05), cShift * 1.28);
        };

        if (Math.abs(bestAngle) > 0.055) {
          var roiX0 = Math.max(s3MarginX, Math.round(bx0_3 - bw3 * 0.18));
          var roiY0 = Math.max(s3MarginY, Math.round(by0_3 - bh3 * 0.18));
          var roiX1 = Math.min(s3MaxX, Math.round(bx1_3 + bw3 * 0.18));
          var roiY1 = Math.min(s3MaxY, Math.round(by1_3 + bh3 * 0.18));
          var uVals = [], vVals = [];
          for (var ry = roiY0; ry < roiY1; ry += stepAct) {
            for (var rx = roiX0; rx < roiX1; rx += stepAct) {
              var ri = (ry * s3w + rx) * 4;
              var dCard = cardSurfaceDist(s3Data[ri], s3Data[ri + 1], s3Data[ri + 2]);
              if ((dCard < 52 && s3StructMap[ry * s3w + rx] > noiseFloor * 0.6) || (dCard < 62 && s3GradMag[ry * s3w + rx] > noiseFloor * 1.45)) {
                var dx = rx - cx, dy = ry - cy;
                uVals.push(dx * cosB + dy * sinB);
                vVals.push(-dx * sinB + dy * cosB);
              }
            }
          }
          if (uVals.length > 30) {
            uVals.sort(function (a, b) { return a - b; });
            vVals.sort(function (a, b) { return a - b; });
            minU = uVals[Math.floor(uVals.length * 0.02)];
            maxU = uVals[Math.floor(uVals.length * 0.98)];
            minV = vVals[Math.floor(vVals.length * 0.02)];
            maxV = vVals[Math.floor(vVals.length * 0.98)];
          }
        }

        var spanU = Math.max(20, maxU - minU);
        var spanV = Math.max(16, maxV - minV);

        var cardPxS = Math.max(0.95, Math.min(pxS, Math.min(Math.max(spanU, spanV) / 170, Math.min(spanU, spanV) / 112)));
        var cPx = isWhitePageBg ? cardPxS : pxS;
        var dNear = 1.15 * cPx;
        var dIn1 = 1.25 * cPx, dIn2 = (isWhitePageBg ? 2.5 : 2.6) * cPx, dIn3 = (isWhitePageBg ? 5.0 : 5.5) * cPx;
        var dOut1 = (isWhitePageBg ? 1.35 : 1.6) * cPx;
        var dOut2 = (isWhitePageBg ? 2.55 : 3.0) * cPx;
        var dOutM = (isWhitePageBg ? 3.95 : 4.6) * cPx;
        var dOutF = (isWhitePageBg ? 6.2 : 7.5) * cPx;
        var dOutW = 8.8 * cPx;

        var findBestBoundaryPeak = function (baseCoord, searchIn, searchOut, tStart, tEnd, isHorizontal, outSign, sideBg) {
          var sBgR = sideBg ? sideBg.r : bgR, sBgG = sideBg ? sideBg.g : bgG, sBgB = sideBg ? sideBg.b : bgB;
          var sBgLum = sBgR + sBgG + sBgB;
          var sBgChroma = Math.max(sBgR, sBgG, sBgB) - Math.min(sBgR, sBgG, sBgB);
          var subToSideBgDist = flatbedColorDist(cardSubR, cardSubG, cardSubB, sBgR, sBgG, sBgB);
          var bestCoord = baseCoord;
          var bestVal = -1;
          var steps = 18;
          var dStepPeak = cPx > 1.55 ? 0.75 : 0.5;
          var biasX = isHorizontal ? (-sinB * outSign * 1e-4) : (cosB * outSign * 1e-4);
          var biasY = isHorizontal ? (cosB * outSign * 1e-4) : (sinB * outSign * 1e-4);
          for (var d = -searchIn; d <= searchOut; d += dStepPeak) {
            var coord = baseCoord + outSign * d;
            var sumScore = 0, valid = 0;
            for (var s = 1; s < steps; s++) {
              var t = tStart + (tEnd - tStart) * (s / steps);
              var u = isHorizontal ? t : coord;
              var v = isHorizontal ? coord : t;
              var ix = Math.round(cx + u * cosB - v * sinB + biasX);
              var iy = Math.round(cy + u * sinB + v * cosB + biasY);

              var uNearIn = isHorizontal ? t : (coord - outSign * dNear);
              var vNearIn = isHorizontal ? (coord - outSign * dNear) : t;
              var uNearOut = isHorizontal ? t : (coord + outSign * dNear);
              var vNearOut = isHorizontal ? (coord + outSign * dNear) : t;
              var uIn = isHorizontal ? t : (coord - outSign * dIn1);
              var vIn = isHorizontal ? (coord - outSign * dIn1) : t;
              var uIn2 = isHorizontal ? t : (coord - outSign * dIn2);
              var vIn2 = isHorizontal ? (coord - outSign * dIn2) : t;
              var uIn3 = isHorizontal ? t : (coord - outSign * dIn3);
              var vIn3 = isHorizontal ? (coord - outSign * dIn3) : t;
              var uOut1 = isHorizontal ? t : (coord + outSign * dOut1);
              var vOut1 = isHorizontal ? (coord + outSign * dOut1) : t;
              var uOut = isHorizontal ? t : (coord + outSign * dOut2);
              var vOut = isHorizontal ? (coord + outSign * dOut2) : t;
              var uOutM = isHorizontal ? t : (coord + outSign * dOutM);
              var vOutM = isHorizontal ? (coord + outSign * dOutM) : t;
              var uOutF = isHorizontal ? t : (coord + outSign * dOutF);
              var vOutF = isHorizontal ? (coord + outSign * dOutF) : t;
              var ixNearIn = Math.max(0, Math.min(s3w - 1, Math.round(cx + uNearIn * cosB - vNearIn * sinB + biasX)));
              var iyNearIn = Math.max(0, Math.min(s3h - 1, Math.round(cy + uNearIn * sinB + vNearIn * cosB + biasY)));
              var ixNearOut = Math.max(0, Math.min(s3w - 1, Math.round(cx + uNearOut * cosB - vNearOut * sinB + biasX)));
              var iyNearOut = Math.max(0, Math.min(s3h - 1, Math.round(cy + uNearOut * sinB + vNearOut * cosB + biasY)));
              var ixIn = Math.round(cx + uIn * cosB - vIn * sinB + biasX);
              var iyIn = Math.round(cy + uIn * sinB + vIn * cosB + biasY);
              var ixIn2 = Math.round(cx + uIn2 * cosB - vIn2 * sinB + biasX);
              var iyIn2 = Math.round(cy + uIn2 * sinB + vIn2 * cosB + biasY);
              var ixIn3 = Math.round(cx + uIn3 * cosB - vIn3 * sinB + biasX);
              var iyIn3 = Math.round(cy + uIn3 * sinB + vIn3 * cosB + biasY);
              var rawIxOut1 = Math.round(cx + uOut1 * cosB - vOut1 * sinB + biasX);
              var rawIyOut1 = Math.round(cy + uOut1 * sinB + vOut1 * cosB + biasY);
              var rawIxOut = Math.round(cx + uOut * cosB - vOut * sinB + biasX);
              var rawIyOut = Math.round(cy + uOut * sinB + vOut * cosB + biasY);
              var ixOut1 = Math.max(0, Math.min(s3w - 1, rawIxOut1));
              var iyOut1 = Math.max(0, Math.min(s3h - 1, rawIyOut1));
              var ixOut = Math.max(0, Math.min(s3w - 1, rawIxOut));
              var iyOut = Math.max(0, Math.min(s3h - 1, rawIyOut));
              var rawIxOutM = Math.round(cx + uOutM * cosB - vOutM * sinB + biasX);
              var rawIyOutM = Math.round(cy + uOutM * sinB + vOutM * cosB + biasY);
              var rawIxOutF = Math.round(cx + uOutF * cosB - vOutF * sinB + biasX);
              var rawIyOutF = Math.round(cy + uOutF * sinB + vOutF * cosB + biasY);
              var outTouchesFrameBorder = (rawIxOut < 1 || rawIxOut >= s3w - 1 || rawIyOut < 1 || rawIyOut >= s3h - 1);

              if (ix >= 1 && ix < s3w - 1 && iy >= 1 && iy < s3h - 1 &&
                  ixIn >= 0 && ixIn < s3w && iyIn >= 0 && iyIn < s3h &&
                  ixIn2 >= 0 && ixIn2 < s3w && iyIn2 >= 0 && iyIn2 < s3h &&
                  ixIn3 >= 0 && ixIn3 < s3w && iyIn3 >= 0 && iyIn3 < s3h) {
                var pIdx3 = iy * s3w + ix;
                var gTang = isHorizontal
                  ? Math.abs(-s3GxSigned[pIdx3] * sinB + s3GySigned[pIdx3] * cosB)
                  : Math.abs(s3GxSigned[pIdx3] * cosB + s3GySigned[pIdx3] * sinB);
                var gOrtho = isHorizontal
                  ? Math.abs(s3GxSigned[pIdx3] * cosB + s3GySigned[pIdx3] * sinB)
                  : Math.abs(-s3GxSigned[pIdx3] * sinB + s3GySigned[pIdx3] * cosB);
                var pureG = Math.max(0, gTang - 0.35 * gOrtho);

                var i0_4 = pIdx3 * 4;
                var iNearIn4 = (iyNearIn * s3w + ixNearIn) * 4;
                var iNearOut4 = (iyNearOut * s3w + ixNearOut) * 4;
                var iIn4 = (iyIn * s3w + ixIn) * 4;
                var iIn2_4 = (iyIn2 * s3w + ixIn2) * 4;
                var iIn3_4 = (iyIn3 * s3w + ixIn3) * 4;
                var iOut1_4 = (iyOut1 * s3w + ixOut1) * 4;
                var iOut4 = (iyOut * s3w + ixOut) * 4;
                var r0 = s3Data[i0_4], g0 = s3Data[i0_4 + 1], b0 = s3Data[i0_4 + 2];
                var rNIn = s3Data[iNearIn4], gNIn = s3Data[iNearIn4 + 1], bNIn = s3Data[iNearIn4 + 2];
                var rNOut = s3Data[iNearOut4], gNOut = s3Data[iNearOut4 + 1], bNOut = s3Data[iNearOut4 + 2];
                var r1 = s3Data[iIn4], g1 = s3Data[iIn4 + 1], b1 = s3Data[iIn4 + 2];
                var r2 = s3Data[iIn2_4], g2 = s3Data[iIn2_4 + 1], b2 = s3Data[iIn2_4 + 2];
                var r3 = s3Data[iIn3_4], g3 = s3Data[iIn3_4 + 1], b3 = s3Data[iIn3_4 + 2];
                var rOut1 = s3Data[iOut1_4], gOut1 = s3Data[iOut1_4 + 1], bOut1 = s3Data[iOut1_4 + 2];
                var rOut = s3Data[iOut4], gOut = s3Data[iOut4 + 1], bOut = s3Data[iOut4 + 2];
                var lum0 = r0 + g0 + b0;
                var lumNIn = rNIn + gNIn + bNIn;
                var lum1 = r1 + g1 + b1;
                var lum2 = r2 + g2 + b2;
                var lum3 = r3 + g3 + b3;
                var lumOut1 = rOut1 + gOut1 + bOut1;
                var lumOut2 = rOut + gOut + bOut;

                // Prevent dark internal ink strokes (e.g. bottom NID No digits, MRZ, or 1px black border)
                // from inflating step contrast against the bright card margin outside them
                var refR1 = r1, refG1 = g1, refB1 = b1;
                var refRNIn = rNIn, refGNIn = gNIn, refBNIn = bNIn;
                if (cardSubLum >= 460 && lumOut1 > lum1 + 52 && lum1 < cardSubLum * 0.78) {
                  if (lum2 >= cardSubLum * 0.84) {
                    refR1 = r2; refG1 = g2; refB1 = b2;
                  } else {
                    refR1 = cardSubR; refG1 = cardSubG; refB1 = cardSubB;
                  }
                }
                if (cardSubLum >= 460 && (rNOut + gNOut + bNOut) > lumNIn + 52 && lumNIn < cardSubLum * 0.78) {
                  refRNIn = refR1; refGNIn = refG1; refBNIn = refB1;
                }

                var tightStep = isWhitePageBg
                  ? flatbedColorDist(rNOut, gNOut, bNOut, refRNIn, refGNIn, refBNIn)
                  : Math.hypot(rNOut - refRNIn, gNOut - refGNIn, bNOut - refBNIn);
                var step1 = isWhitePageBg
                  ? flatbedColorDist(rOut1, gOut1, bOut1, refR1, refG1, refB1)
                  : Math.hypot(rOut1 - refR1, gOut1 - refG1, bOut1 - refB1);
                var step2 = isWhitePageBg
                  ? flatbedColorDist(rOut, gOut, bOut, refR1, refG1, refB1)
                  : Math.hypot(rOut - refR1, gOut - refG1, bOut - refB1);
                if (!isWhitePageBg) {
                  var cStep1 = Math.hypot((rOut1 - gOut1) - (refR1 - refG1), (rOut1 - bOut1) - (refR1 - refB1), (gOut1 - bOut1) - (refG1 - refB1));
                  var cStep2 = Math.hypot((rOut - gOut) - (refR1 - refG1), (rOut - bOut) - (refR1 - refB1), (gOut - bOut) - (refG1 - refB1));
                  step1 = Math.max(step1, cStep1 * 0.92);
                  step2 = Math.max(step2, cStep2 * 0.92);
                }
                var distIn = cardSurfaceDist(r1, g1, b1);
                var distIn2 = cardSurfaceDist(r2, g2, b2);
                var distIn3 = cardSurfaceDist(r3, g3, b3);
                var distOut1 = cardSurfaceDist(rOut1, gOut1, bOut1);
                var distOut = cardSurfaceDist(rOut, gOut, bOut);
                // On bright pages/lids, prevent plunging from bright card into dark internal ink (e.g. top edge of NID No digits)
                // from masquerading as a huge background step/color transition
                if (isWhitePageBg && sBgLum >= 530 && cardSubLum >= 500) {
                  var darkPlungeThr = Math.min(cardSubLum, sBgLum) * 0.78;
                  var maxPlungeStep = Math.max(subToSideBgDist * 1.25, 26);
                  var lumNOut0 = rNOut + gNOut + bNOut;
                  if (lumNOut0 < darkPlungeThr) tightStep = Math.min(tightStep, maxPlungeStep);
                  if (lumOut1 < darkPlungeThr) {
                    step1 = Math.min(step1, maxPlungeStep);
                    distOut1 = Math.min(distOut1, maxPlungeStep);
                  }
                  if (lumOut2 < darkPlungeThr) {
                    step2 = Math.min(step2, maxPlungeStep);
                    distOut = Math.min(distOut, maxPlungeStep);
                  }
                }
                var directStep = tightStep * 0.45 + step1 * 0.35 + step2 * 0.20;
                var dOutBg1 = isWhitePageBg ? flatbedColorDist(rOut1, gOut1, bOut1, sBgR, sBgG, sBgB) : Math.hypot(rOut1 - sBgR, gOut1 - sBgG, bOut1 - sBgB);
                var dOutBg2 = isWhitePageBg ? flatbedColorDist(rOut, gOut, bOut, sBgR, sBgG, sBgB) : Math.hypot(rOut - sBgR, gOut - sBgG, bOut - sBgB);
                var colorTransition = Math.max(0, (distOut1 * 0.60 + distOut * 0.40) - Math.min(distIn, distIn2));
                var nearIn = Math.min(distIn, distIn2);
                var deepIn = Math.min(distIn2, distIn3);
                var worstIn = nearIn * 0.72 + deepIn * 0.28;
                var paperMatch = (nearIn < 44 && worstIn < 52) ? 1.45 : (worstIn < 64 ? 0.68 : 0.16);
                // Locally shadowed card rim (e.g. cast shadow on left side of plastic holder while card steps sharply up)
                if (paperMatch < 1.0 && sBgLum < cardSubLum * 0.74 && lum1 >= sBgLum + 52 && lum1 >= lumOut1 + 28 && lum3 >= lum1 - 18) {
                  paperMatch = 1.15;
                }
                if (isPortraitTarget) {
                  var inChr1 = Math.max(r1, g1, b1) - Math.min(r1, g1, b1);
                  var inChr2 = Math.max(r2, g2, b2) - Math.min(r2, g2, b2);
                  var outChr1 = Math.max(rOut1, gOut1, bOut1) - Math.min(rOut1, gOut1, bOut1);
                  var dInBg1 = isWhitePageBg ? flatbedColorDist(r1, g1, b1, sBgR, sBgG, sBgB) : Math.hypot(r1 - sBgR, g1 - sBgG, b1 - sBgB);
                  var dInBg2 = isWhitePageBg ? flatbedColorDist(r2, g2, b2, sBgR, sBgG, sBgB) : Math.hypot(r2 - sBgR, g2 - sBgG, b2 - sBgB);
                  // Colored ID header/footer banner against outer background sBg: reward true banner-to-desk edge and penalize interior white-to-banner seam
                  if (paperMatch < 1.0 && Math.max(inChr1, inChr2) > 28 && Math.max(dInBg1, dInBg2) > 48 && dOutBg1 < 30 && dOutBg2 < 32) {
                    paperMatch = Math.max(paperMatch, 1.35);
                    colorTransition = Math.max(colorTransition, Math.max(0, Math.max(dInBg1, dInBg2) - dOutBg1) * 0.65);
                  }
                  if (paperMatch > 0.25 && outChr1 > 28 && dOutBg1 > 48 && dOutBg2 > 48) {
                    paperMatch *= 0.08;
                  }
                }

                // Prevent wide step1/step2 from pulling a boundary peak 3px away from the actual local transition
                if (pureG < noiseFloor * 0.45 && tightStep < (isWhitePageBg ? 4.5 : 9)) {
                  paperMatch *= 0.14;
                }

                // Penalize dark background pixels just outside the card where only the 3x3 Sobel neighbor touched the card
                var d0Card = cardSurfaceDist(r0, g0, b0);
                var d0Bg = Math.hypot(r0 - sBgR, g0 - sBgG, b0 - sBgB);
                if (d0Card > d0Bg * 1.15 && lum0 < cardLum * 0.52) {
                  paperMatch *= 0.45;
                }

                var sampleRelRGB = isWhitePageBg ? function (offsetPx) {
                  var uP = isHorizontal ? t : (coord + outSign * offsetPx);
                  var vP = isHorizontal ? (coord + outSign * offsetPx) : t;
                  var rxP = Math.round(cx + uP * cosB - vP * sinB + biasX);
                  var ryP = Math.round(cy + uP * sinB + vP * cosB + biasY);
                  var cxP = Math.max(0, Math.min(s3w - 1, rxP));
                  var cyP = Math.max(0, Math.min(s3h - 1, ryP));
                  var iP = (cyP * s3w + cxP) * 4;
                  return {
                    r: s3Data[iP], g: s3Data[iP + 1], b: s3Data[iP + 2],
                    lum: s3Data[iP] + s3Data[iP + 1] + s3Data[iP + 2],
                    inBounds: rxP >= 2 && rxP < s3w - 2 && ryP >= 2 && ryP < s3h - 2
                  };
                } : null;

                // On white flatbed / paper scans, reject outer translucent lamination pouch / plastic rail -> scanner bed transitions
                // (where the interior inside `coord` is neutral or warm-aged translucent plastic over `sBg` before transitioning inward onto opaque `cardSub`)
                if (isWhitePageBg && cardSubLum >= sBgLum - 55) {
                  var lumInAvg = (lum1 + lum2) * 0.5;
                  var lumOutAvg = (lumOut1 + lumOut2) * 0.5;
                  var inCh1 = Math.max(r1, g1, b1) - Math.min(r1, g1, b1);
                  var inCh2 = Math.max(r2, g2, b2) - Math.min(r2, g2, b2);
                  var inChromaAvg = (inCh1 + inCh2) * 0.5;
                  var subDistIn1 = flatbedColorDist(r1, g1, b1, cardSubR, cardSubG, cardSubB);
                  var subDistIn2 = flatbedColorDist(r2, g2, b2, cardSubR, cardSubG, cardSubB);
                  if (lumInAvg >= sBgLum * 0.42 && lumInAvg <= sBgLum - 18 && lumInAvg <= cardSubLum - 20 &&
                      lumOutAvg > lumInAvg + 12 && inChromaAvg <= sBgChroma + 6.5 &&
                      Math.min(subDistIn1, subDistIn2) > 20) {
                    paperMatch *= 0.06;
                  }
                  var lumIn23 = (lum2 + lum3) * 0.5;
                  var subDistIn3 = flatbedColorDist(r3, g3, b3, cardSubR, cardSubG, cardSubB);
                  var bgDistIn2 = flatbedColorDist(r2, g2, b2, sBgR, sBgG, sBgB);
                  var bgDistIn3 = flatbedColorDist(r3, g3, b3, sBgR, sBgG, sBgB);
                  var minSubIn23 = Math.min(subDistIn2, subDistIn3);
                  var minBgIn23 = Math.min(bgDistIn2, bgDistIn3);
                  if (paperMatch > 0 && cardSubG <= Math.max(cardSubR, cardSubB) + 3 &&
                      sBgLum >= 530 && lumIn23 >= sBgLum * 0.78 && lumIn23 <= sBgLum - 12 &&
                      lumOutAvg >= lumIn23 + 8 && minSubIn23 >= 25 &&
                      (minBgIn23 < minSubIn23 * 0.85 || (r2 >= g2 && g2 >= b2 && cardSubB >= cardSubR - 3))) {
                    var innerPaperHits = 0;
                    for (var dInP = 5.5 * cPx; dInP <= 26.0 * cPx; dInP += 2.0 * cPx) {
                      var pInP = sampleRelRGB(-dInP);
                      if (!pInP.inBounds || pInP.lum < cardSubLum * 0.38) break;
                      if (flatbedColorDist(pInP.r, pInP.g, pInP.b, cardSubR, cardSubG, cardSubB) < 22 &&
                          flatbedColorDist(pInP.r, pInP.g, pInP.b, r2, g2, b2) >= 22) {
                        innerPaperHits++;
                        if (innerPaperHits >= 2) {
                          paperMatch = 0;
                          break;
                        }
                      }
                    }
                  }
                }

                // When the card physically touches the image border, treat the frame boundary as a strong outer step
                if (outTouchesFrameBorder) {
                  if (nearIn < 48) {
                    directStep = Math.max(directStep, cardBgDist * 0.65);
                    colorTransition = Math.max(colorTransition, cardBgDist * 0.55);
                  }
                } else if (isWhitePageBg) {
                  // Flatbed / bright-page internal ink rejection (NID No digits, MRZ text, barcode, Old NID 1px black printed border):
                  var sampleOutRGB = sampleRelRGB;
                  var pOut15 = sampleOutRGB((dOut1 + dOut2) * 0.5);
                  var pOut32 = sampleOutRGB((dOut2 + dOutM) * 0.5);
                  var pOutM = sampleOutRGB(dOutM);
                  var pOutF = sampleOutRGB(dOutF);
                  var pOutW = sampleOutRGB(dOutW);

                  var isTranslucentPouchOverBed = function (pr, pg, pb) {
                    if (cardSubG > Math.max(cardSubR, cardSubB) + 3) return false;
                    var pLum = pr + pg + pb;
                    if (pLum < sBgLum * 0.76 || pLum > sBgLum - 9) return false;
                    var dSub = flatbedColorDist(pr, pg, pb, cardSubR, cardSubG, cardSubB);
                    if (dSub < 25) return false;
                    var dBg = Math.min(
                      flatbedColorDist(pr, pg, pb, sBgR, sBgG, sBgB),
                      flatbedColorDist(pr, pg, pb, bgR, bgG, bgB)
                    );
                    if (dBg < dSub * 0.82) return true;
                    return (pr >= pg && pg >= pb && cardSubB >= cardSubR - 3 && (pr - pb) >= (cardSubR - cardSubB) + 10);
                  };

                  var isProbeStillCard = function (pr, pg, pb) {
                    if (isTranslucentPouchOverBed(pr, pg, pb)) return false;
                    var pLum = pr + pg + pb;
                    var pCh = Math.max(pr, pg, pb) - Math.min(pr, pg, pb);
                    var dBg = flatbedColorDist(pr, pg, pb, sBgR, sBgG, sBgB);
                    var dGlobBg = flatbedColorDist(pr, pg, pb, bgR, bgG, bgB);
                    var minBgD = Math.min(dBg, dGlobBg);
                    var dSub = flatbedColorDist(pr, pg, pb, cardSubR, cardSubG, cardSubB);
                    // Bright colored guilloche/artwork or non-lid pastel card rim outside `coord` = still inside card
                    if (sBgChroma < 26 && pLum >= sBgLum * 0.76 && pCh > sBgChroma + 9 && minBgD > 16) {
                      return true;
                    }
                    if (subToSideBgDist >= 11 && pLum >= Math.min(cardSubLum, sBgLum) * 0.92 && minBgD >= 17 && dSub < minBgD * 0.95) {
                      return true;
                    }
                    if (pLum < cardSubLum * 0.85) return false;
                    if (subToSideBgDist >= 11) {
                      return dSub < 21 && dSub < dBg * 0.75;
                    }
                    return dSub < 14 && Math.abs(pCh - cardSubChroma) < 10;
                  };

                  var cOut1 = isProbeStillCard(rOut1, gOut1, bOut1) ? 1 : 0;
                  var cOut2 = isProbeStillCard(rOut, gOut, bOut) ? 1 : 0;
                  var cOutM = (pOutM.inBounds && isProbeStillCard(pOutM.r, pOutM.g, pOutM.b)) ? 1 : 0;
                  var cOutF = (pOutF.inBounds && isProbeStillCard(pOutF.r, pOutF.g, pOutF.b)) ? 1 : 0;
                  var cOutW = (pOutW.inBounds && isProbeStillCard(pOutW.r, pOutW.g, pOutW.b)) ? 1 : 0;
                  var cardProbesOut = cOut1 + cOut2 + cOutM + cOutF + cOutW;
                  var lumNOut = rNOut + gNOut + bNOut;
                  var minStrokeLum = Math.min(lum0, lumNIn, lum1);
                  var minValleyLum = Math.min(minStrokeLum, lumNOut, lumOut1);
                  var inDarkInk = minStrokeLum < cardSubLum * 0.85;

                  // Thin dark printed line / text stroke inside a narrow (e.g. 2.5-3px) or pastel card margin:
                  // 1) Dark valley (either at `coord` or 1-1.5px outside `coord` when sitting on the inner edge of a 1px black frame)
                  //    with matching bright card paper on BOTH sides:
                  if (minValleyLum < cardSubLum * 0.86 && Math.max(lum1, lum2) >= cardSubLum * 0.87) {
                    var outerIsValley = Math.min(lumNOut, lumOut1) < minStrokeLum - 12;
                    var candProbes = outerIsValley ? [pOut15, { r: rOut, g: gOut, b: bOut, lum: lumOut2 }, pOut32, pOutM]
                                                   : [{ r: rNOut, g: gNOut, b: bNOut, lum: lumNOut }, { r: rOut1, g: gOut1, b: bOut1, lum: lumOut1 }, pOut15, { r: rOut, g: gOut, b: bOut, lum: lumOut2 }, pOut32];
                    var inPaperR = lum2 >= lum1 ? r2 : r1, inPaperG = lum2 >= lum1 ? g2 : g1, inPaperB = lum2 >= lum1 ? b2 : b1;
                    for (var cpIdx = 0; cpIdx < candProbes.length; cpIdx++) {
                      var cp = candProbes[cpIdx];
                      if (cp.lum >= minValleyLum + 40 && cp.lum >= cardSubLum * 0.86 &&
                          !isTranslucentPouchOverBed(cp.r, cp.g, cp.b) &&
                          flatbedColorDist(cp.r, cp.g, cp.b, inPaperR, inPaperG, inPaperB) < 24 &&
                          (subToSideBgDist < 10 || flatbedColorDist(cp.r, cp.g, cp.b, sBgR, sBgG, sBgB) >= 13)) {
                        paperMatch = 0;
                        break;
                      }
                    }
                  }
                  // 2) Dark ink stroke / signature / colored guilloche (both TOP and BOTTOM edges of `NID No` digits, signature, MRZ)
                  //    followed outward by a card margin plateau that later steps onto `sBg`:
                  var outNearCh = Math.max(
                    Math.max(rOut1, gOut1, bOut1) - Math.min(rOut1, gOut1, bOut1),
                    Math.max(rOut, gOut, bOut) - Math.min(rOut, gOut, bOut)
                  );
                  var minNearValley = Math.min(minStrokeLum, lumNOut, lumOut1, lumOut2, pOut15.lum, pOut32.lum, pOutM.lum);
                  var hasNearDarkInk = minNearValley < cardSubLum * 0.88;
                  if (paperMatch > 0 && sBgLum >= 540 &&
                      (hasNearDarkInk || (sBgChroma < 22 && outNearCh >= sBgChroma + 8))) {
                    var seenMargin = false, marginLum = 0, marginR = 0, marginG = 0, marginB = 0;
                    for (var dScan = 1.8 * cPx; dScan <= 24.0 * cPx; dScan += 1.6 * cPx) {
                      var pScan = sampleOutRGB(dScan);
                      if (!pScan.inBounds) break;
                      var scanBedDist = flatbedColorDist(pScan.r, pScan.g, pScan.b, sBgR, sBgG, sBgB);
                      if (!seenMargin) {
                        if (pScan.lum >= sBgLum * 0.74 &&
                            (!hasNearDarkInk || pScan.lum >= minNearValley + 36) &&
                            scanBedDist >= 11.5 &&
                            (minNearValley < cardSubLum * 0.70 || !isTranslucentPouchOverBed(pScan.r, pScan.g, pScan.b))) {
                          seenMargin = true;
                          marginLum = pScan.lum;
                          marginR = pScan.r; marginG = pScan.g; marginB = pScan.b;
                        }
                      } else {
                        var marginToBedDist = flatbedColorDist(pScan.r, pScan.g, pScan.b, marginR, marginG, marginB);
                        if (scanBedDist < 16 && (Math.abs(pScan.lum - marginLum) >= 13 || marginToBedDist >= 13)) {
                          paperMatch = 0;
                          break;
                        }
                      }
                    }
                  }

                  if (paperMatch > 0) {
                    if (subToSideBgDist >= 11) {
                      if (cardProbesOut >= 2 || (cOut1 && inDarkInk) || (cOut2 && inDarkInk)) {
                        paperMatch = 0;
                      } else if (cOutM || cOutF || cOutW) {
                        paperMatch *= 0.05;
                      }
                    } else if (cardProbesOut >= 2 && hasNearDarkInk) {
                      // Identical white card on identical white lid: check if any edge exists further out before rejecting
                      var hasOuterEdge = false;
                      for (var dChk = dOut2; dChk <= 22.0 * cPx; dChk += 1.25 * cPx) {
                        var uChk = isHorizontal ? t : (coord + outSign * dChk);
                        var vChk = isHorizontal ? (coord + outSign * dChk) : t;
                        var ixChk = Math.round(cx + uChk * cosB - vChk * sinB);
                        var iyChk = Math.round(cy + uChk * sinB + vChk * cosB);
                        if (ixChk >= 2 && ixChk < s3w - 2 && iyChk >= 2 && iyChk < s3h - 2 && s3GradMag[iyChk * s3w + ixChk] > noiseFloor * 1.35) {
                          hasOuterEdge = true;
                          break;
                        }
                      }
                      if (hasOuterEdge) paperMatch = 0;
                    }
                  }
                } else {
                  // Dark / colored background: penalize internal printed lines where outside is still bright card plastic/paper
                  var outChroma1 = Math.max(rOut1, gOut1, bOut1) - Math.min(rOut1, gOut1, bOut1);
                  var outChroma2 = Math.max(rOut, gOut, bOut) - Math.min(rOut, gOut, bOut);
                  if (distOut1 < 50 && (rOut1 + gOut1 + bOut1) >= cardLum * 0.84 && Math.abs(outChroma1 - cardChroma) < 14) {
                    if (distOut < 48 && (rOut + gOut + bOut) >= cardLum * 0.83 && Math.abs(outChroma2 - cardChroma) < 14) {
                      paperMatch = 0;
                    } else {
                      paperMatch *= 0.12;
                    }
                  } else if (rawIxOutF >= 2 && rawIxOutF < s3w - 2 && rawIyOutF >= 2 && rawIyOutF < s3h - 2) {
                    var iOutF4 = (rawIyOutF * s3w + rawIxOutF) * 4;
                    var rOutF2 = s3Data[iOutF4], gOutF2 = s3Data[iOutF4 + 1], bOutF2 = s3Data[iOutF4 + 2];
                    var distOutF = cardSurfaceDist(rOutF2, gOutF2, bOutF2);
                    var outChromaF = Math.max(rOutF2, gOutF2, bOutF2) - Math.min(rOutF2, gOutF2, bOutF2);
                    if (distOutF < 46 && (rOutF2 + gOutF2 + bOutF2) >= cardLum * 0.84 && Math.abs(outChromaF - cardChroma) < 14) {
                      paperMatch *= 0.04;
                    }
                  }
                }

                sumScore += (pureG * 0.68 + directStep * 0.42 + colorTransition * 0.52) * paperMatch;
                valid++;
              }
            }
            if (valid > 5) {
              var distPenalty = 1 - (Math.abs(d) / (Math.max(searchIn, searchOut) + 12 * pxS)) * 0.10;
              var avg = (sumScore / valid) * distPenalty;
              if (avg > bestVal) {
                bestVal = avg;
                bestCoord = coord;
              }
            }
          }
          return { coord: bestCoord, score: Math.max(1, bestVal) };
        };

        var fitPerspectiveSideLine = function (baseCoord, searchIn, searchOut, tMin, tMax, isHorizontal, outSign, orthoSpan, sideBg) {
          var span = tMax - tMin;
          var tMid = (tMin + tMax) * 0.5;
          var slices = [];
          var nSlices = 7;
          var tPad = isHorizontal ? 0.08 : 0.115;
          var sStep = (1 - 2 * tPad) / nSlices;
          for (var si = 0; si < nSlices; si++) {
            var s0 = tMin + (tPad + si * sStep) * span;
            var s1 = s0 + sStep * span;
            var res = findBestBoundaryPeak(baseCoord, searchIn, searchOut, s0, s1, isHorizontal, outSign, sideBg);
            slices.push({ t: (s0 + s1) * 0.5, c: res.coord, w: res.score });
          }

          var inlierTol = Math.max(1.8 * pxS, orthoSpan * 0.013);
          var bestFlatCand = { mid: baseCoord, slope: 0 };
          var bestFlatScore = -1;
          var bestSlopeCand = null;
          var bestSlopeScore = -1;
          var bestSlopeInliers = 0;

          var evalCandidate = function (mid, slope) {
            var cScore = 0, cnt = 0, minT = 1e9, maxT = -1e9;
            for (var k = 0; k < nSlices; k++) {
              var pred = mid + slope * (slices[k].t - tMid);
              var err = Math.abs(slices[k].c - pred);
              if (err <= inlierTol) {
                var dampedW = Math.pow(Math.max(1, slices[k].w), 0.60);
                cScore += dampedW * (1 - (err / (inlierTol * 1.45)));
                cnt++;
                if (slices[k].t < minT) minT = slices[k].t;
                if (slices[k].t > maxT) maxT = slices[k].t;
              }
            }
            if (cnt >= 2) {
              cScore *= (1 + 0.25 * Math.min(5, cnt - 1));
            }
            return { score: cScore, inliers: cnt, spanT: cnt >= 2 ? (maxT - minT) : 0 };
          };

          for (var i = 0; i < nSlices; i++) {
            var f1 = evalCandidate(slices[i].c, 0);
            if (f1.score > bestFlatScore) {
              bestFlatScore = f1.score;
              bestFlatCand = { mid: slices[i].c, slope: 0 };
            }
            for (var j = i + 1; j < nSlices; j++) {
              var avgMid = (slices[i].c + slices[j].c) * 0.5;
              var f2 = evalCandidate(avgMid, 0);
              if (f2.score > bestFlatScore) {
                bestFlatScore = f2.score;
                bestFlatCand = { mid: avgMid, slope: 0 };
              }
              if (j - i >= 2) {
                var dt = slices[j].t - slices[i].t;
                if (Math.abs(dt) < 6) continue;
                var sl = (slices[j].c - slices[i].c) / dt;
                if (Math.abs(sl) > 0.18) continue;
                var md = slices[i].c + sl * (tMid - slices[i].t);
                var sEv = evalCandidate(md, sl);
                if (sEv.inliers >= 4 && sEv.spanT >= span * 0.44 && sEv.score > bestSlopeScore) {
                  bestSlopeScore = sEv.score;
                  bestSlopeCand = { mid: md, slope: sl };
                  bestSlopeInliers = sEv.inliers;
                }
              }
            }
          }

          var useSlope = !!(bestSlopeCand && bestSlopeInliers >= 4 && bestSlopeScore > bestFlatScore * 1.02);
          var bestCand = useSlope ? bestSlopeCand : bestFlatCand;

          // Refine (mid, slope) via balanced sqrt-weighted least squares across all inlier slices
          // (prevents sunlit half with 10x gradient from pivoting steep slope past shadowed half)
          var sumW = 0, sumWT = 0, sumWC = 0, sumWTT = 0, sumWTC = 0, inliers = 0;
          for (var m = 0; m < nSlices; m++) {
            var predM = bestCand.mid + bestCand.slope * (slices[m].t - tMid);
            if (Math.abs(slices[m].c - predM) <= inlierTol * 1.15) {
              var w = Math.sqrt(Math.max(1, slices[m].w));
              var dtM = slices[m].t - tMid;
              sumW += w;
              sumWT += w * dtM;
              sumWC += w * slices[m].c;
              sumWTT += w * dtM * dtM;
              sumWTC += w * dtM * slices[m].c;
              inliers++;
            }
          }

          var finalMid = bestCand.mid;
          var finalSlope = bestCand.slope;
          if (inliers >= 2 && sumW > 0) {
            if (useSlope && inliers >= 5) {
              var denom = sumW * sumWTT - sumWT * sumWT;
              if (Math.abs(denom) > 1e-3) {
                var wSlope = (sumW * sumWTC - sumWT * sumWC) / denom;
                var wMid = (sumWC - wSlope * sumWT) / sumW;
                if (Math.abs(wSlope) <= 0.18) {
                  finalMid = wMid;
                  finalSlope = wSlope;
                }
              } else {
                finalMid = sumWC / sumW;
                finalSlope = 0;
              }
            } else {
              finalMid = sumWC / sumW;
              finalSlope = 0;
            }
          }
          if (Math.abs(finalSlope * span) < 0.75 * pxS) {
            finalSlope = 0;
          }
          return { mid: finalMid, slope: finalSlope, tMid: tMid, flatMid: bestFlatCand.mid };
        };

        var searchVIn = Math.max(5 * pxS, Math.round(spanV * (isWhitePageBg ? 0.125 : 0.105)));
        var searchVOut = Math.max(5 * pxS, Math.round(spanV * (isWhitePageBg ? 0.155 : 0.095)));
        var searchUIn = Math.max(5 * pxS, Math.round(spanU * (isWhitePageBg ? 0.12 : 0.095)));
        var searchUOut = Math.max(5 * pxS, Math.round(spanU * (isWhitePageBg ? 0.145 : 0.075)));

        var topSideBg = sampleLocalSideBg(true, -1);
        var botSideBg = sampleLocalSideBg(true, +1);
        var leftSideBg = sampleLocalSideBg(false, -1);
        var rightSideBg = sampleLocalSideBg(false, +1);

        // Pre-trim outer plastic badge holders / lanyard clip slots / frosted sleeves so Stage 3 locks onto the inner ID card
        var samplePlasticStrip = function (coord, tMin, tMax, isHorizontal, sideBg) {
          var sBgR0 = sideBg ? sideBg.r : bgR, sBgG0 = sideBg ? sideBg.g : bgG, sBgB0 = sideBg ? sideBg.b : bgB;
          var sBgLum0 = sBgR0 + sBgG0 + sBgB0;
          var t0 = tMin + (tMax - tMin) * 0.13, t1 = tMax - (tMax - tMin) * 0.13;
          var sr = 0, sg = 0, sb = 0, sTang = 0, sOrtho = 0, opq = 0, cnt = 0;
          var segLum = [0, 0, 0], segCnt = [0, 0, 0];
          for (var m = 0; m < 24; m++) {
            var t = t0 + (t1 - t0) * (m / 23);
            var u = isHorizontal ? t : coord;
            var v = isHorizontal ? coord : t;
            var ix = Math.round(cx + u * cosB - v * sinB);
            var iy = Math.round(cy + u * sinB + v * cosB);
            if (ix < 1 || ix >= s3w - 1 || iy < 1 || iy >= s3h - 1) continue;
            var pIdx = iy * s3w + ix;
            var p4 = pIdx * 4;
            var pr = s3Data[p4], pg = s3Data[p4 + 1], pb = s3Data[p4 + 2];
            var pLum = pr + pg + pb;
            var segIdx = m < 8 ? 0 : (m < 16 ? 1 : 2);
            segLum[segIdx] += pLum;
            segCnt[segIdx]++;
            var dSub = flatbedColorDist(pr, pg, pb, cardSubR, cardSubG, cardSubB);
            var dBgS = flatbedColorDist(pr, pg, pb, sBgR0, sBgG0, sBgB0);
            if (pLum >= cardSubLum * 0.85 && (dSub < 28 || (pg - pr >= 7 && pLum >= cardSubLum * 0.78)) &&
                (!isWhitePageBg || sBgLum0 <= cardSubLum + 10 || dSub < dBgS * 0.88 || pg - pr >= 6)) {
              opq++;
            }
            var gT = isHorizontal
              ? Math.abs(-s3GxSigned[pIdx] * sinB + s3GySigned[pIdx] * cosB)
              : Math.abs(s3GxSigned[pIdx] * cosB + s3GySigned[pIdx] * sinB);
            var gO = isHorizontal
              ? Math.abs(s3GxSigned[pIdx] * cosB + s3GySigned[pIdx] * sinB)
              : Math.abs(-s3GxSigned[pIdx] * sinB + s3GySigned[pIdx] * cosB);
            sr += pr; sg += pg; sb += pb;
            sTang += gT; sOrtho += gO;
            cnt++;
          }
          if (cnt < 12) return null;
          var mr = sr / cnt, mg = sg / cnt, mb = sb / cnt;
          var mLum = mr + mg + mb;
          return {
            r: mr, g: mg, b: mb,
            lum: mLum,
            greenAdv: mg - mr,
            tangGrad: sTang / cnt,
            orthoGrad: sOrtho / cnt,
            opaqueFrac: opq / cnt,
            bgDist: flatbedColorDist(mr, mg, mb, sBgR0, sBgG0, sBgB0),
            s0: segCnt[0] > 0 ? segLum[0] / segCnt[0] : mLum,
            s1: segCnt[1] > 0 ? segLum[1] / segCnt[1] : mLum,
            s2: segCnt[2] > 0 ? segLum[2] / segCnt[2] : mLum
          };
        };

        var trimPlasticHolderSide = function (baseCoord, maxTrimFrac, orthoSpan, tMin, tMax, isHorizontal, outSign, sideBg) {
          if (isWhitePageBg && isSmallCardOnPage) return null;
          var maxTrim = Math.round(orthoSpan * maxTrimFrac);
          if (maxTrim < Math.ceil(6.5 * cPx)) return null;
          var sBgLum0 = sideBg ? (sideBg.r + sideBg.g + sideBg.b) : bgLumGlobal;
          var isShadowedSide = sBgLum0 < cardSubLum * 0.76;
          var stepD = Math.max(1.0, 1.35 * cPx);
          var bestD = -1, bestEdgeScore = -1, lockEndD = -1;
          for (var d = 5.5 * cPx; d <= maxTrim; d += stepD) {
            if (lockEndD > 0 && d > lockEndD) break;
            var pMid = samplePlasticStrip(baseCoord - outSign * d, tMin, tMax, isHorizontal, sideBg);
            var pOut1 = samplePlasticStrip(baseCoord - outSign * (d - 1.8 * cPx), tMin, tMax, isHorizontal, sideBg);
            var pOut2 = samplePlasticStrip(baseCoord - outSign * (d - 3.8 * cPx), tMin, tMax, isHorizontal, sideBg);
            var pOut3 = samplePlasticStrip(baseCoord - outSign * Math.max(1.2 * cPx, d - 5.8 * cPx), tMin, tMax, isHorizontal, sideBg);
            var pIn1 = samplePlasticStrip(baseCoord - outSign * (d + 2.0 * cPx), tMin, tMax, isHorizontal, sideBg);
            var pIn2 = samplePlasticStrip(baseCoord - outSign * (d + 4.8 * cPx), tMin, tMax, isHorizontal, sideBg);
            var pIn3 = samplePlasticStrip(baseCoord - outSign * (d + 8.5 * cPx), tMin, tMax, isHorizontal, sideBg);
            if (!pMid || !pOut1 || !pOut2 || !pOut3 || !pIn1 || !pIn2 || !pIn3) continue;

            // Stop immediately if we already entered a bare opaque card directly from bright page background
            if (bestD < 0 && pOut2.lum >= Math.min(cardSubLum, sBgLum0) - 20 &&
                pMid.lum >= cardSubLum * 0.86 && pMid.opaqueFrac >= 0.48 &&
                (!isWhitePageBg || pMid.bgDist >= 14 || pMid.greenAdv >= 6)) {
              break;
            }

            var maxOutLum = isWhitePageBg ? Math.max(pOut1.lum, pOut2.lum, pOut3.lum) : Math.max(pOut1.lum, pOut2.lum);
            var maxOutOpq = isWhitePageBg ? Math.max(pOut1.opaqueFrac, pOut2.opaqueFrac, pOut3.opaqueFrac) : Math.max(pOut1.opaqueFrac, pOut2.opaqueFrac);
            var maxOutOrtho = Math.max(pOut1.orthoGrad, pOut2.orthoGrad);
            var outChroma1 = Math.max(pOut1.r, pOut1.g, pOut1.b) - Math.min(pOut1.r, pOut1.g, pOut1.b);
            var outChroma2 = Math.max(pOut2.r, pOut2.g, pOut2.b) - Math.min(pOut2.r, pOut2.g, pOut2.b);
            // Full-span plastic rail / sleeve guard: all 3 longitudinal thirds outside `d` must be non-card (and on dark tables, brighter than raw table)
            var allThirdsPlastic = pOut1.s0 <= cardSubLum - 18 && pOut1.s1 <= cardSubLum - 18 && pOut1.s2 <= cardSubLum - 18;
            var aboveDarkTable = isWhitePageBg || (pOut1.lum >= sBgLum0 + 36 && pOut2.lum >= sBgLum0 + 28);
            var isOuterPlasticBand = allThirdsPlastic &&
                                     aboveDarkTable &&
                                     Math.max(outChroma1, outChroma2) <= 34 &&
                                     maxOutLum <= cardSubLum - 26 &&
                                     (!isWhitePageBg || maxOutLum <= sBgLum0 - 24) &&
                                     maxOutOpq < 0.38 &&
                                     maxOutOrtho < (isWhitePageBg ? 21 : 32);
            if (!isOuterPlasticBand) continue;

            var lumJump = pIn1.lum - pOut1.lum;
            var greenJump = pIn1.greenAdv - pOut1.greenAdv;
            var maxInOpq = Math.max(pIn1.opaqueFrac, pIn2.opaqueFrac);
            var thirdSteps = ((pIn1.s0 - pOut1.s0 >= 8) ? 1 : 0) + ((pIn1.s1 - pOut1.s1 >= 8) ? 1 : 0) + ((pIn1.s2 - pOut1.s2 >= 8) ? 1 : 0);
            var outerThirdSteps = (pIn1.s0 - pOut1.s0 >= 8) || (pIn1.s2 - pOut1.s2 >= 8) || (greenJump >= 8 && pIn1.greenAdv >= 4);
            var entersOpaqueCard = false;
            if (thirdSteps >= 2 && outerThirdSteps) {
              if (!isWhitePageBg) {
                // Dark table: skip narrow specular seal reflections (`pIn3` drops back into dark plastic) and lock onto sustained inner card
                var sustainedWhite = pIn2.lum >= cardSubLum * 0.84 && pIn3.lum >= cardSubLum * 0.82;
                var sustainedGreen = pIn2.lum >= cardSubLum * 0.78 && pIn3.lum >= cardSubLum * 0.76;
                entersOpaqueCard =
                  (sustainedWhite && lumJump >= 16 && pIn1.lum >= cardSubLum * 0.88 && maxInOpq >= 0.48) ||
                  (sustainedGreen && greenJump >= 6 && pIn1.greenAdv >= 4 && pIn1.lum >= cardSubLum * 0.80 && lumJump >= 8);
              } else {
                var minCardLumReq = isShadowedSide ? cardSubLum * 0.70 : cardSubLum * 0.83;
                entersOpaqueCard =
                  (lumJump >= 16 && pIn1.lum >= minCardLumReq && pIn3.lum >= minCardLumReq * 0.94 &&
                   (maxInOpq >= 0.44 || pIn1.lum >= cardSubLum * 0.86 || (pIn1.lum - pOut2.lum >= 55 && pIn2.lum >= pIn1.lum - 14))) ||
                  (greenJump >= 8 && pIn1.greenAdv >= 4 && pIn1.lum >= cardSubLum * 0.81 && lumJump >= 8);
              }
            }

            if (entersOpaqueCard) {
              var eScore = Math.max(0, lumJump) + Math.max(0, greenJump) * 3.4 + pMid.tangGrad * 0.85;
              if (lockEndD < 0) lockEndD = d + 3.5 * cPx;
              if (eScore > bestEdgeScore) {
                bestEdgeScore = eScore;
                bestD = d;
              }
            }
          }
          if (bestD < 5.5 * cPx) return null;
          var adjBase = baseCoord - outSign * bestD;
          var plasticOutProf = samplePlasticStrip(adjBase + outSign * (3.2 * cPx), tMin, tMax, isHorizontal, sideBg);
          return {
            base: adjBase,
            searchIn: Math.max(4, Math.round(5.0 * cPx)),
            searchOut: Math.max(3, Math.round(2.8 * cPx)),
            sideBg: plasticOutProf ? { r: plasticOutProf.r, g: plasticOutProf.g, b: plasticOutProf.b } : sideBg
          };
        };

        var topTrim = trimPlasticHolderSide(minV, 0.17, spanV, minU, maxU, true, -1, topSideBg);
        var botTrim = trimPlasticHolderSide(maxV, 0.17, spanV, minU, maxU, true, +1, botSideBg);
        var leftTrim = trimPlasticHolderSide(minU, 0.24, spanU, minV, maxV, false, -1, leftSideBg);
        var rightTrim = trimPlasticHolderSide(maxU, 0.24, spanU, minV, maxV, false, +1, rightSideBg);

        var topLine = fitPerspectiveSideLine(
          topTrim ? topTrim.base : minV, topTrim ? topTrim.searchIn : searchVIn, topTrim ? topTrim.searchOut : searchVOut,
          minU, maxU, true, -1, spanV, topTrim ? topTrim.sideBg : topSideBg
        );
        var botLine = fitPerspectiveSideLine(
          botTrim ? botTrim.base : maxV, botTrim ? botTrim.searchIn : searchVIn, botTrim ? botTrim.searchOut : searchVOut,
          minU, maxU, true, +1, spanV, botTrim ? botTrim.sideBg : botSideBg
        );
        var leftLine = fitPerspectiveSideLine(
          leftTrim ? leftTrim.base : minU, leftTrim ? leftTrim.searchIn : searchUIn, leftTrim ? leftTrim.searchOut : searchUOut,
          minV, maxV, false, -1, spanU, leftTrim ? leftTrim.sideBg : leftSideBg
        );
        var rightLine = fitPerspectiveSideLine(
          rightTrim ? rightTrim.base : maxU, rightTrim ? rightTrim.searchIn : searchUIn, rightTrim ? rightTrim.searchOut : searchUOut,
          minV, maxV, false, +1, spanU, rightTrim ? rightTrim.sideBg : rightSideBg
        );

        // Orthographic flatbed / A4 page orthogonality guard: prevent outlier pouch/glare slices from tilting one horizontal side into a trapezoid,
        // and prevent rounded corners or barcode guard bars from inducing spurious convergence on the short vertical sides
        if (isWhitePageBg && isSmallCardOnPage) {
          if (Math.abs(topLine.slope - botLine.slope) >= 0.025) {
            if (Math.abs(botLine.slope) <= 0.022 && Math.abs(topLine.slope - botLine.slope) > 0.028) {
              topLine.slope = botLine.slope;
              topLine.mid = topLine.flatMid;
            } else if (Math.abs(topLine.slope) <= 0.022 && Math.abs(botLine.slope - topLine.slope) > 0.028) {
              botLine.slope = topLine.slope;
              botLine.mid = botLine.flatMid;
            }
          }
          if (Math.abs(topLine.slope - botLine.slope) < 0.025) {
            var orthoVertSlope = -((topLine.slope + botLine.slope) * 0.5);
            if (Math.abs(rightLine.slope - leftLine.slope) > 0.02 || Math.abs(leftLine.slope - orthoVertSlope) > 0.025) {
              leftLine.slope = orthoVertSlope;
              leftLine.mid = Math.min(leftLine.mid, leftLine.flatMid);
            }
            if (Math.abs(rightLine.slope - leftLine.slope) > 0.02 || Math.abs(rightLine.slope - orthoVertSlope) > 0.025) {
              rightLine.slope = orthoVertSlope;
              rightLine.mid = Math.max(rightLine.mid, rightLine.flatMid);
            }
          }
        }

        /*
         * Extend each side outward ONLY across genuine card paper/surface (e.g. when a line snapped onto
         * the inner printed black frame inside the white paper margin, or when a cropped card continues
         * toward the frame border). Strictly stops before translucent lamination pouches, frosted sleeves, cloth, or white A4 scanner beds.
         */
        var growSide = function (line, outSign, isHorizontal, tMin, tMax, orthoSpan, wasPlasticTrimmed) {
          if (isWhitePageBg || wasPlasticTrimmed) return;
          var maxExt = Math.round(orthoSpan * 0.45);
          var t0 = tMin + (tMax - tMin) * 0.14;
          var t1 = tMax - (tMax - tMin) * 0.14;
          var sampleLineLum = function (stepOff) {
            var lr = 0, lg = 0, lb = 0, ln = 0;
            for (var k0 = 0; k0 < 14; k0++) {
              var tInit = t0 + (t1 - t0) * (k0 / 13);
              var cInit = line.mid + line.slope * (tInit - line.tMid) + outSign * stepOff;
              var u0 = isHorizontal ? tInit : cInit;
              var v0 = isHorizontal ? cInit : tInit;
              var gx0 = Math.round(cx + u0 * cosB - v0 * sinB);
              var gy0 = Math.round(cy + u0 * sinB + v0 * cosB);
              if (gx0 < 1 || gx0 >= s3w - 1 || gy0 < 1 || gy0 >= s3h - 1) continue;
              var gi0 = (gy0 * s3w + gx0) * 4;
              lr += s3Data[gi0]; lg += s3Data[gi0 + 1]; lb += s3Data[gi0 + 2]; ln++;
            }
            return ln > 0 ? (lr + lg + lb) / ln : cardSubLum;
          };
          var prevLum = sampleLineLum(-Math.max(1, Math.round(1.5 * pxS)));
          var minOpaqueLum = Math.max(cardLum * 0.84, cardSubLum * 0.88);
          var best = 0, miss = 0;
          var maxMiss = cardBgDist < 65 ? Math.round(4 * pxS) : Math.round(pxS);
          for (var s = 1; s <= maxExt; s++) {
            var sr = 0, sg = 0, sb = 0, n = 0, oob = 0;
            for (var k = 0; k < 14; k++) {
              var t = t0 + (t1 - t0) * (k / 13);
              var coord = line.mid + line.slope * (t - line.tMid) + outSign * s;
              var u = isHorizontal ? t : coord;
              var v = isHorizontal ? coord : t;
              var gx = Math.round(cx + u * cosB - v * sinB);
              var gy = Math.round(cy + u * sinB + v * cosB);
              if (gx < 1 || gx >= s3w - 1 || gy < 1 || gy >= s3h - 1) { oob++; continue; }
              var gi = (gy * s3w + gx) * 4;
              sr += s3Data[gi]; sg += s3Data[gi + 1]; sb += s3Data[gi + 2]; n++;
            }
            if (oob > 4 || n < 8) break;
            sr /= n; sg /= n; sb /= n;
            var dBg = Math.hypot(sr - bgR, sg - bgG, sb - bgB);
            var dCard = cardSurfaceDist(sr, sg, sb);
            var sLum = sr + sg + sb;
            if (sLum < prevLum - 22) break;
            var sChroma = Math.max(sr, sg, sb) - Math.min(sr, sg, sb);
            var sChromaShift = Math.hypot((sr - sg) - cardRG, (sr - sb) - cardRB, (sg - sb) - cardGB);
            var isCardPaper = cardBgDist >= 65
              ? (dCard < 62 && sChromaShift < 16 && sLum >= minOpaqueLum && Math.abs(sChroma - cardChroma) < 13 && dCard < dBg * 0.45)
              : (dCard < 46 && sChromaShift < 15 && sLum >= minOpaqueLum && Math.abs(sChroma - cardChroma) < 12);
            if (isCardPaper) {
              best = s;
              miss = 0;
              prevLum = sLum;
            } else if (++miss > maxMiss) {
              break;
            }
          }
          if (best >= 1) line.mid += outSign * best;
        };
        growSide(topLine, -1, true, minU, maxU, spanV, !!topTrim);
        growSide(botLine, +1, true, minU, maxU, spanV, !!botTrim);
        growSide(leftLine, -1, false, minV, maxV, spanU, !!leftTrim);
        growSide(rightLine, +1, false, minV, maxV, spanU, !!rightTrim);

        var intersectLines = function (hLine, vLine) {
          var denom = 1 - hLine.slope * vLine.slope;
          var u = vLine.mid + vLine.slope * (hLine.mid - vLine.tMid);
          var v = hLine.mid + hLine.slope * (u - hLine.tMid);
          if (Math.abs(denom) > 0.1) {
            u = (vLine.mid + vLine.slope * (hLine.mid - hLine.slope * hLine.tMid - vLine.tMid)) / denom;
            v = hLine.mid + hLine.slope * (u - hLine.tMid);
          }
          return { u: u, v: v };
        };

        var cTL = intersectLines(topLine, leftLine);
        var cTR = intersectLines(topLine, rightLine);
        var cBR = intersectLines(botLine, rightLine);
        var cBL = intersectLines(botLine, leftLine);

        var toImgPt = function (uv) {
          var px = cx + uv.u * cosB - uv.v * sinB;
          var py = cy + uv.u * sinB + uv.v * cosB;
          return {
            x: Math.max(0.004, Math.min(0.996, px / s3w)),
            y: Math.max(0.004, Math.min(0.996, py / s3h))
          };
        };

        var quad = [
          toImgPt(cTL),
          toImgPt(cTR),
          toImgPt(cBR),
          toImgPt(cBL)
        ];

        return { pts: orderQuadClockwise(quad), auto: true, rot: normRot };
      }
    } catch (e) {}
    return { pts: defaultQuadPts(0.04), auto: true, rot: normRot, fallback: true };
  }

  /**
   * Builds a cached 2D Magnetic Boundary & Corner Attraction Field (`snapField`)
   * using an 8-pixel color-step filter + signed gradient coherence so internal text letters
   * and thin internal divider lines are ignored, while true outer card borders attract cleanly.
   */
  function buildMagneticSnapField(canvas) {
    var srcW = canvas.width;
    var srcH = canvas.height;
    var maxSnapDim = 800;
    var scale = Math.min(1, maxSnapDim / Math.max(srcW, srcH, 1));
    var cw = Math.max(64, Math.round(srcW * scale));
    var ch = Math.max(64, Math.round(srcH * scale));
    var workCanvas = canvas;
    if (cw !== srcW || ch !== srcH) {
      workCanvas = document.createElement('canvas');
      workCanvas.width = cw;
      workCanvas.height = ch;
      workCanvas.getContext('2d', { willReadFrequently: true }).drawImage(canvas, 0, 0, cw, ch);
    }
    var ctx = workCanvas.getContext('2d', { willReadFrequently: true });
    var data = ctx.getImageData(0, 0, cw, ch).data;

    var lum = new Uint8Array(cw * ch);
    var centerHist = new Uint32Array(256);
    var centerCount = 0;
    var cx0 = Math.round(cw * 0.18), cx1 = Math.round(cw * 0.82);
    var cy0 = Math.round(ch * 0.18), cy1 = Math.round(ch * 0.82);

    for (var ly = 0; ly < ch; ly++) {
      var lRow = ly * cw;
      var inCy = (ly >= cy0 && ly <= cy1);
      for (var lx = 0; lx < cw; lx++) {
        var p4 = (lRow + lx) << 2;
        var lVal = (data[p4] * 77 + data[p4 + 1] * 150 + data[p4 + 2] * 29) >> 8;
        lum[lRow + lx] = lVal;
        if (inCy && lx >= cx0 && lx <= cx1) {
          centerHist[lVal]++;
          centerCount++;
        }
      }
    }

    var cardP78 = 175;
    if (centerCount > 0) {
      var accC = 0, targetC = centerCount * 0.78;
      for (var bi = 0; bi < 256; bi++) {
        accC += centerHist[bi];
        if (accC >= targetC) { cardP78 = bi; break; }
      }
    }
    // Minimum brightness of genuine ID card plastic margin (rejects dark cloth, fingers, keyboard, drop shadows)
    var cardFloor = Math.max(92, Math.min(168, Math.round(cardP78 * 0.62)));

    var gxSigned = new Float32Array(cw * ch);
    var gySigned = new Float32Array(cw * ch);
    var gx = new Float32Array(cw * ch);
    var gy = new Float32Array(cw * ch);
    var boundH = new Float32Array(cw * ch);
    var boundV = new Float32Array(cw * ch);
    var corner = new Float32Array(cw * ch);

    for (var y = 2; y < ch - 2; y++) {
      var r0 = (y - 1) * cw, r1 = y * cw, r2 = (y + 1) * cw;
      for (var x = 2; x < cw - 2; x++) {
        var bestSx = 0, bestSy = 0, maxAx = 0, maxAy = 0;
        for (var c = 0; c < 3; c++) {
          var p00 = data[(r0 + x - 1) * 4 + c], p01 = data[(r0 + x) * 4 + c], p02 = data[(r0 + x + 1) * 4 + c];
          var p10 = data[(r1 + x - 1) * 4 + c],                               p12 = data[(r1 + x + 1) * 4 + c];
          var p20 = data[(r2 + x - 1) * 4 + c], p21 = data[(r2 + x) * 4 + c], p22 = data[(r2 + x + 1) * 4 + c];
          var sx = ((p02 + 2 * p12 + p22) - (p00 + 2 * p10 + p20)) * 0.25;
          var sy = ((p20 + 2 * p21 + p22) - (p00 + 2 * p01 + p02)) * 0.25;
          if (Math.abs(sx) > maxAx) { maxAx = Math.abs(sx); bestSx = sx; }
          if (Math.abs(sy) > maxAy) { maxAy = Math.abs(sy); bestSy = sy; }
        }
        var idx = r1 + x;
        // Sign convention: use luminance gradient sign so moving from dark exterior to bright card interior is always predictable
        var lumSx = (lum[r1 + x + 1] - lum[r1 + x - 1]) * 0.5;
        var lumSy = (lum[r2 + x] - lum[r0 + x]) * 0.5;
        gxSigned[idx] = Math.abs(lumSx) >= 2 ? (lumSx >= 0 ? maxAx : -maxAx) : bestSx;
        gySigned[idx] = Math.abs(lumSy) >= 2 ? (lumSy >= 0 ? maxAy : -maxAy) : bestSy;
        gx[idx] = maxAx;
        gy[idx] = maxAy;
      }
    }

    // Filter for true outer card boundaries (where 6px span across the line has a genuine surface step
    // and signed gradients are coherent along the line, rejecting 1-2px internal text and divider lines)
    for (var by = 4; by < ch - 4; by++) {
      var rUp = (by - 3) * cw, rMid = by * cw, rDn = (by + 3) * cw;
      for (var bx = 4; bx < cw - 4; bx++) {
        var bIdx = rMid + bx;
        var cohGy = Math.abs(gySigned[bIdx - 2] + gySigned[bIdx] + gySigned[bIdx + 2]) / 3;
        var cohGx = Math.abs(gxSigned[bIdx - 2 * cw] + gxSigned[bIdx] + gxSigned[bIdx + 2 * cw]) / 3;

        var iU4 = (rUp + bx) * 4, iD4 = (rDn + bx) * 4;
        var iL4 = (rMid + bx - 3) * 4, iR4 = (rMid + bx + 3) * 4;
        var stepH = Math.hypot(data[iU4] - data[iD4], data[iU4 + 1] - data[iD4 + 1], data[iU4 + 2] - data[iD4 + 2]);
        var stepV = Math.hypot(data[iL4] - data[iR4], data[iL4 + 1] - data[iR4 + 1], data[iL4 + 2] - data[iR4 + 2]);

        boundH[bIdx] = Math.max(0, cohGy - 0.48 * gx[bIdx]) * (0.25 + 0.75 * Math.min(1.8, stepH / 32));
        boundV[bIdx] = Math.max(0, cohGx - 0.48 * gy[bIdx]) * (0.25 + 0.75 * Math.min(1.8, stepV / 32));
      }
    }

    return {
      cw: cw,
      ch: ch,
      gx: boundV,
      gy: boundH,
      gxSigned: gxSigned,
      gySigned: gySigned,
      lum: lum,
      cardFloor: cardFloor,
      corner: corner
    };
  }

  /**
   * Magnetically snaps a single dragged corner `cornerIdx` to nearby true card boundaries/corners.
   */
  function ensureEntrySnapField(entry) {
    if (!entry) return null;
    // Generic Crop tool (`cropState`) owns its own snap field built from `#imgCropSourceCanvas`
    if (entry._snapFieldKey === 'crop') return entry.snapField || null;
    var key = (((entry.rot || 0) % 360) + 360) % 360 + ':' + (entry.flipH || 1);
    if (entry.snapField && entry._snapFieldKey === key) return entry.snapField;
    var srcCanvas = $('#nidCropSourceCanvas');
    if (!srcCanvas || !srcCanvas.width) return null;
    entry.snapField = buildMagneticSnapField(srcCanvas);
    entry._snapFieldKey = key;
    return entry.snapField;
  }

  /**
   * Computes exact 2D line-line intersection of Line A (`a1 -> a2`) and Line B (`b1 -> b2`).
   * Returns `null` if lines are nearly parallel.
   */
  function intersectLines2D(a1, a2, b1, b2) {
    var dax = a2.x - a1.x, day = a2.y - a1.y;
    var dbx = b2.x - b1.x, dby = b2.y - b1.y;
    var denom = dax * dby - day * dbx;
    if (Math.abs(denom) < 1e-5) return null;
    var t = ((b1.x - a1.x) * dby - (b1.y - a1.y) * dbx) / denom;
    return {
      x: a1.x + dax * t,
      y: a1.y + day * t
    };
  }

  /**
   * Sticky Magnetic H/V Tangent Corner Snap (`snapCornerMagnetically`):
   * - Samples strictly along the local straight Horizontal & Vertical card edges (past the rounded corner arc),
   *   decoupled from the opposite handles so it works on large pages where the card is small.
   * - Verifies Inside-Card Polarity (`lumIn >= sf.cardFloor` and `lumIn > lumOut + 5`) and rejects outer drop shadows,
   *   background patterns and internal barcode/header lines so the handle NEVER snaps outside the ID card.
   * - Sticky Lock (`prevLock`): once a line is captured inside `radius`, it is held until the cursor moves
   *   further than `release` (= 1.35 × radius) away, so the handle never shakes between nearby edges (`কাপাকাপি = 0`).
   * - `customRadius` is expressed in snap-field pixels and is derived from a constant on-screen distance by the caller,
   *   so the capture zone feels identical at any zoom level or page size.
   */
  function snapCornerMagnetically(entry, pts, cornerIdx, rawX, rawY, customRadius, prevLock) {
    var sf = ensureEntrySnapField(entry);
    if (!sf) return { x: rawX, y: rawY, snapped: false, snapH: false, snapV: false, guideH: null, guideV: null, lock: null };
    var cw = sf.cw, ch = sf.ch;
    var domW = entry.cw || cw, domH = entry.ch || ch;
    var px = rawX * cw, py = rawY * ch;
    var x0 = Math.round(px), y0 = Math.round(py);

    var hPt = pts[cornerIdx ^ 1];
    var vPt = pts[3 - cornerIdx];
    var hPx = { x: hPt.x * cw, y: hPt.y * ch };
    var vPx = { x: vPt.x * cw, y: vPt.y * ch };

    var radius = Math.max(4, customRadius || 10);
    var release = radius * 1.35 + 2;
    var CAPTURE = 11.0;
    var KEEP = 6.5;

    // Direction from corner INTO the card along H and V axes
    var dirX = (cornerIdx === 0 || cornerIdx === 3) ? 1 : -1;
    var dirY = (cornerIdx === 0 || cornerIdx === 1) ? 1 : -1;

    // Quantized local tilt slope (0 for nearly axis-aligned cards; steps of 0.02 if tilted <= 8°)
    var rawSlopeH = (Math.abs(hPx.x - px) > 45) ? ((hPx.y - py) / (hPx.x - px)) : 0;
    var slopeH = (Math.abs(rawSlopeH) <= 0.14) ? (Math.round(rawSlopeH * 50) / 50) : 0;
    var rawSlopeV = (Math.abs(vPx.y - py) > 45) ? ((vPx.x - px) / (vPx.y - py)) : 0;
    var slopeV = (Math.abs(rawSlopeV) <= 0.14) ? (Math.round(rawSlopeV * 50) / 50) : 0;

    // Sample strictly past the rounded corner arc
    var hSpan = Math.max(160, Math.abs(hPx.x - px));
    var dHStart = Math.max(18, Math.min(34, Math.round(hSpan * 0.075)));
    var dHStep = Math.max(3.2, Math.min(5.2, (hSpan * 0.16) / 9));
    var vSpan = Math.max(120, Math.abs(vPx.y - py));
    var dVStart = Math.max(18, Math.min(34, Math.round(vSpan * 0.09)));
    var dVStep = Math.max(3.2, Math.min(5.0, (vSpan * 0.18) / 9));

    var lum = sf.lum, floorL = sf.cardFloor;

    function scoreRow(yf) {
      var iy = Math.round(yf);
      if (iy < 6 || iy >= ch - 6) return 0;
      var sumE = 0, valid = 0, hits = 0, veto = 0;
      for (var s = 0; s < 10; s++) {
        var dd = dHStart + s * dHStep;
        var sx = Math.round(x0 + dirX * dd);
        var sy = Math.round(iy + dirX * dd * slopeH);
        if (sx < 6 || sx >= cw - 6 || sy < 12 || sy >= ch - 12) continue;
        valid++;
        var idx = sy * cw + sx;
        if (sf.gySigned[idx] * dirY <= 1.5) continue;
        var lIn = lum[(sy + dirY * 4) * cw + sx];
        var lDeep = lum[(sy + dirY * 10) * cw + sx];
        var lOut = lum[(sy - dirY * 3) * cw + sx];
        var lOutFar = lum[(sy - dirY * 8) * cw + sx];
        if ((lIn < lDeep - 16 && lIn < lOut + 8) || (lOutFar >= floorL + 14 && lOut >= floorL)) { veto++; continue; }
        if (lIn >= floorL && lIn >= lOut + 5) {
          hits++;
          sumE += sf.gy[idx] * (1 + Math.min(0.6, (lIn - lOut) / 65));
        }
      }
      if (valid < 6 || hits < Math.ceil(valid * 0.70) || veto > 2) return 0;
      return sumE / valid;
    }

    function scoreCol(xf) {
      var ix = Math.round(xf);
      if (ix < 6 || ix >= cw - 6) return 0;
      var sumE = 0, valid = 0, hits = 0, veto = 0;
      for (var s = 0; s < 10; s++) {
        var dd = dVStart + s * dVStep;
        var sy = Math.round(y0 + dirY * dd);
        var sx = Math.round(ix + dirY * dd * slopeV);
        if (sx < 12 || sx >= cw - 12 || sy < 6 || sy >= ch - 6) continue;
        valid++;
        var idx = sy * cw + sx;
        if (sf.gxSigned[idx] * dirX <= 1.5) continue;
        var rowO = sy * cw;
        var lIn = lum[rowO + sx + dirX * 4];
        var lDeep = lum[rowO + sx + dirX * 10];
        var lOut = lum[rowO + sx - dirX * 3];
        var lOutFar = lum[rowO + sx - dirX * 8];
        if ((lIn < lDeep - 16 && lIn < lOut + 8) || (lOutFar >= floorL + 14 && lOut >= floorL)) { veto++; continue; }
        if (lIn >= floorL && lIn >= lOut + 5) {
          hits++;
          sumE += sf.gx[idx] * (1 + Math.min(0.6, (lIn - lOut) / 65));
        }
      }
      if (valid < 6 || hits < Math.ceil(valid * 0.70) || veto > 2) return 0;
      return sumE / valid;
    }

    function refinePeak(scoreFn, best, lo, hi) {
      var sm = best > lo ? scoreFn(best - 1) : 0;
      var sc = scoreFn(best);
      var sp = best < hi ? scoreFn(best + 1) : 0;
      var den = sm - 2 * sc + sp;
      if (sm > 0 && sp > 0 && Math.abs(den) > 1e-3) {
        return best + Math.max(-0.45, Math.min(0.45, 0.5 * (sm - sp) / den));
      }
      return best;
    }

    // 1. Horizontal tangent line (sticky)
    var snapH = false, bestY = py;
    if (prevLock && prevLock.snapH && Math.abs(py - prevLock.bestY) <= release && scoreRow(prevLock.bestY) >= KEEP) {
      snapH = true;
      bestY = prevLock.bestY;
    } else {
      var iyMin = Math.max(6, y0 - radius), iyMax = Math.min(ch - 7, y0 + radius);
      var bestIy = -1, bestSH = CAPTURE;
      for (var iy = iyMin; iy <= iyMax; iy++) {
        var scH = scoreRow(iy);
        if (scH <= 0) continue;
        scH *= 1 - (Math.abs(iy - py) / (radius + 8)) * 0.22;
        if (scH > bestSH) { bestSH = scH; bestIy = iy; }
      }
      if (bestIy >= 0) {
        snapH = true;
        bestY = refinePeak(scoreRow, bestIy, iyMin, iyMax);
      }
    }

    // 2. Vertical tangent line (sticky)
    var snapV = false, bestX = px;
    if (prevLock && prevLock.snapV && Math.abs(px - prevLock.bestX) <= release && scoreCol(prevLock.bestX) >= KEEP) {
      snapV = true;
      bestX = prevLock.bestX;
    } else {
      var ixMin = Math.max(6, x0 - radius), ixMax = Math.min(cw - 7, x0 + radius);
      var bestIx = -1, bestSV = CAPTURE;
      for (var ix = ixMin; ix <= ixMax; ix++) {
        var scV = scoreCol(ix);
        if (scV <= 0) continue;
        scV *= 1 - (Math.abs(ix - px) / (radius + 8)) * 0.22;
        if (scV > bestSV) { bestSV = scV; bestIx = ix; }
      }
      if (bestIx >= 0) {
        snapV = true;
        bestX = refinePeak(scoreCol, bestIx, ixMin, ixMax);
      }
    }

    var normOutX = Math.max(0.005, Math.min(0.995, bestX / cw));
    var normOutY = Math.max(0.005, Math.min(0.995, bestY / ch));
    return {
      x: normOutX,
      y: normOutY,
      snapped: snapH || snapV,
      snapH: snapH,
      snapV: snapV,
      guideH: snapH ? (normOutY * domH) : null,
      guideV: snapV ? (normOutX * domW) : null,
      lock: { snapH: snapH, snapV: snapV, bestX: bestX, bestY: bestY }
    };
  }

  /**
   * Magnetically snaps a dragged edge segment (`p1..p2`) along its inward normal `(-uy, ux)`
   * onto the strongest straight outer card boundary, verifying inside-card polarity (`lumIn >= sf.cardFloor`)
   * so it never snaps outward onto drop shadows or background textures.
   * Optional `prevLock` ({ n }) keeps the edge glued to the previously captured line until the cursor
   * moves past the release distance (no shaking while dragging).
   */
  function snapEdgeMagnetically(entry, p1, p2, maxSearchIn, maxSearchOut, prevLock) {
    var sf = ensureEntrySnapField(entry);
    if (!sf) return { p1: p1, p2: p2, snapped: false, lock: null };
    var cw = sf.cw, ch = sf.ch;
    var x1 = p1.x * cw, y1 = p1.y * ch;
    var x2 = p2.x * cw, y2 = p2.y * ch;
    var len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 12) return { p1: p1, p2: p2, snapped: false, lock: null };

    var ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    // For clockwise quad [TL->TR, TR->BR, BR->BL, BL->TL], inward normal pointing into card is `(-uy, ux)`
    var nx = -uy, ny = ux;
    var lum = sf.lum, floorL = sf.cardFloor;

    function px(v, maxV) { return v < 2 ? 2 : (v > maxV - 3 ? maxV - 3 : v); }

    function scoreD(d) {
      var sumE = 0, valid = 0, hits = 0, veto = 0;
      // Sample 15 points strictly in the straight middle [0.15 .. 0.85], skipping rounded corners at both ends
      for (var s = 0; s < 15; s++) {
        var t = 0.15 + s * 0.05;
        var sx = Math.round(x1 + (x2 - x1) * t + nx * d);
        var sy = Math.round(y1 + (y2 - y1) * t + ny * d);
        if (sx < 6 || sx >= cw - 6 || sy < 6 || sy >= ch - 6) continue;
        valid++;
        var idx = sy * cw + sx;
        if (sf.gxSigned[idx] * nx + sf.gySigned[idx] * ny <= 1.5) continue;
        var lIn = lum[px(Math.round(sy + ny * 4), ch) * cw + px(Math.round(sx + nx * 4), cw)];
        var lDeep = lum[px(Math.round(sy + ny * 10), ch) * cw + px(Math.round(sx + nx * 10), cw)];
        var lOut = lum[px(Math.round(sy - ny * 3), ch) * cw + px(Math.round(sx - nx * 3), cw)];
        var lOutFar = lum[px(Math.round(sy - ny * 8), ch) * cw + px(Math.round(sx - nx * 8), cw)];
        if ((lIn < lDeep - 16 && lIn < lOut + 8) || (lOutFar >= floorL + 14 && lOut >= floorL)) { veto++; continue; }
        if (lIn >= floorL && lIn >= lOut + 5) {
          var gPerp = sf.gx[idx] * Math.abs(nx) + sf.gy[idx] * Math.abs(ny);
          var gPara = sf.gx[idx] * Math.abs(ux) + sf.gy[idx] * Math.abs(uy);
          hits++;
          sumE += Math.max(0, gPerp - 0.32 * gPara) * (1 + Math.min(0.6, (lIn - lOut) / 65));
        }
      }
      if (valid < 8 || hits < Math.ceil(valid * 0.72) || veto > 2) return 0;
      return sumE / valid;
    }

    var sIn = maxSearchIn || 10;
    var sOut = maxSearchOut || sIn;
    var rawN = x1 * nx + y1 * ny;
    var bestD = 0;
    var snapped = false;

    if (prevLock && typeof prevLock.n === 'number') {
      var lockD = prevLock.n - rawN;
      var releaseD = Math.max(sIn, sOut) * 1.35 + 2;
      if (Math.abs(lockD) <= releaseD && scoreD(Math.round(lockD)) >= 6.5) {
        bestD = lockD;
        snapped = true;
      }
    }

    if (!snapped) {
      var bestScore = 11.0;
      var maxRange = Math.max(sIn, sOut) + 8;
      for (var d = -sOut; d <= sIn; d++) {
        var sc = scoreD(d);
        if (sc <= 0) continue;
        sc *= 1 - (Math.abs(d) / maxRange) * 0.22;
        if (sc > bestScore) {
          bestScore = sc;
          bestD = d;
          snapped = true;
        }
      }
    }

    if (!snapped) return { p1: p1, p2: p2, snapped: false, lock: null };
    return {
      p1: {
        x: Math.max(0.005, Math.min(0.995, (x1 + nx * bestD) / cw)),
        y: Math.max(0.005, Math.min(0.995, (y1 + ny * bestD) / ch))
      },
      p2: {
        x: Math.max(0.005, Math.min(0.995, (x2 + nx * bestD) / cw)),
        y: Math.max(0.005, Math.min(0.995, (y2 + ny * bestD) / ch))
      },
      snapped: true,
      lock: { n: rawN + bestD }
    };
  }

  /**
   * One-click H/V Tangent Border Lock (`🎯 বর্ডার মেলান`):
   * 1. Locks all 4 straight edges (`t ∈ [0.15, 0.85]`) onto the outer horizontal & vertical card borders
   *    (searching up to 22% inward on large pages so handles placed outside the card pull cleanly onto the card).
   * 2. Computes the 4 exact 2D line-line intersections of those straight edges (`Top ∩ Left`, `Top ∩ Right`, `Bottom ∩ Right`, `Bottom ∩ Left`)
   *    so rounded PVC corners are never cropped off!
   * 3. Runs a fine H/V tangent intersection pass (`snapCornerMagnetically`) on each corner.
   */
  function snapCurrentQuadToNearestEdges(entry) {
    if (!entry || !entry.pts) return;
    var sf = ensureEntrySnapField(entry);
    if (!sf) return;
    var pts = cloneQuadPts(entry.pts);
    var minDim = Math.min(sf.cw || 360, sf.ch || 260);
    var searchIn = Math.max(18, Math.round(minDim * 0.22));
    var searchOut = Math.max(16, Math.round(minDim * 0.12));

    var snappedEdges = [];
    for (var eIdx = 0; eIdx < 4; eIdx++) {
      var nIdx = (eIdx + 1) % 4;
      var resE = snapEdgeMagnetically(entry, pts[eIdx], pts[nIdx], searchIn, searchOut);
      snappedEdges.push({ p1: resE.p1, p2: resE.p2, snapped: resE.snapped });
    }

    // Intersect adjacent straight edge lines (`prevEdge` and `currEdge`) to form sharp 90° tangent corners
    for (var cIdx = 0; cIdx < 4; cIdx++) {
      var prevEdge = snappedEdges[(cIdx + 3) % 4];
      var currEdge = snappedEdges[cIdx];
      var inter = intersectLines2D(prevEdge.p1, prevEdge.p2, currEdge.p1, currEdge.p2);
      if (inter) {
        pts[cIdx] = {
          x: Math.max(0.005, Math.min(0.995, inter.x)),
          y: Math.max(0.005, Math.min(0.995, inter.y))
        };
      }
    }

    // Fine H/V tangent refinement on each corner
    for (var k = 0; k < 4; k++) {
      var resC = snapCornerMagnetically(entry, pts, k, pts[k].x, pts[k].y, 9, null);
      if (resC.snapped) {
        pts[k].x = resC.x;
        pts[k].y = resC.y;
      }
    }
    entry.pts = orderQuadClockwise(pts);
    entry.autoDetected = false;
  }

  /**
   * Insets (`delta < 0`, e.g. `-0.012` for `➖ টাইট বর্ডার`) or outsets (`delta > 0`, e.g. `+0.012` for `➕ মার্জিন`)
   * the 4 corners radially from the polygon centroid while preserving perspective angles.
   */
  function adjustQuadMargin(entry, delta) {
    if (!entry || !entry.pts) return;
    var pts = entry.pts;
    var cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) * 0.25;
    var cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) * 0.25;
    var scale = 1 + delta * 2.2;
    entry.pts = pts.map(function (pt) {
      return {
        x: Math.max(0.005, Math.min(0.995, cx + (pt.x - cx) * scale)),
        y: Math.max(0.005, Math.min(0.995, cy + (pt.y - cy) * scale))
      };
    });
    entry.autoDetected = false;
  }

  /**
   * Snaps the current 4-corner selection to a clean ISO ID-1 rectangle
   * (85.6 × 53.98 mm Landscape -> 1.5858:1, or 53.98 × 85.6 mm Portrait -> 0.6306:1)
   * preserving the center and average tilt angle of the user's current selection.
   */
  function snapQuadToCardRatio(entry, orientOverride) {
    if (!entry || !entry.pts) return;
    var rotNorm = (((entry.rot || 0) % 360) + 360) % 360;
    var imW = (entry.item && entry.item.img) ? (entry.item.img.naturalWidth || entry.item.img.width || 360) : 360;
    var imH = (entry.item && entry.item.img) ? (entry.item.img.naturalHeight || entry.item.img.height || 260) : 260;
    var fbW = (rotNorm === 90 || rotNorm === 270) ? imH : imW;
    var fbH = (rotNorm === 90 || rotNorm === 270) ? imW : imH;
    var cw = entry.cw || fbW;
    var ch = entry.ch || fbH;
    var p = entry.pts.map(function (pt) { return { x: pt.x * cw, y: pt.y * ch }; });
    var cx = (p[0].x + p[1].x + p[2].x + p[3].x) * 0.25;
    var cy = (p[0].y + p[1].y + p[2].y + p[3].y) * 0.25;

    var topW = Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y);
    var botW = Math.hypot(p[2].x - p[3].x, p[2].y - p[3].y);
    var leftH = Math.hypot(p[3].x - p[0].x, p[3].y - p[0].y);
    var rightH = Math.hypot(p[2].x - p[1].x, p[2].y - p[1].y);

    var avgW = (topW + botW) * 0.5;
    var avgH = (leftH + rightH) * 0.5;
    var angle = Math.atan2((p[1].y - p[0].y) + (p[2].y - p[3].y), (p[1].x - p[0].x) + (p[2].x - p[3].x));

    var orient = orientOverride || getNidCardOrient(entry);
    entry.cardOrient = orient === 'portrait' ? 'portrait' : 'landscape';
    var isoRatio = 85.6 / 53.98; // 1.5858
    var targetW, targetH;
    if (entry.cardOrient === 'portrait') {
      targetH = avgW > avgH * 1.15 ? Math.max(avgW, avgH) : avgH;
      targetW = targetH / isoRatio;
      if (targetH > ch * 0.90) {
        targetH = ch * 0.88;
        targetW = targetH / isoRatio;
      }
      if (targetW > cw * 0.90) {
        targetW = cw * 0.88;
        targetH = targetW * isoRatio;
      }
    } else {
      targetW = avgH > avgW * 1.15 ? Math.max(avgW, avgH) : avgW;
      targetH = targetW / isoRatio;
      if (targetH > ch * 0.90) {
        targetH = ch * 0.88;
        targetW = targetH * isoRatio;
      }
      if (targetW > cw * 0.90) {
        targetW = cw * 0.88;
        targetH = targetW / isoRatio;
      }
    }

    var cosA = Math.cos(angle);
    var sinA = Math.sin(angle);
    var hw = targetW * 0.5;
    var hh = targetH * 0.5;

    var relOffsets = [
      { x: -hw, y: -hh },
      { x:  hw, y: -hh },
      { x:  hw, y:  hh },
      { x: -hw, y:  hh }
    ].map(function (loc) {
      return {
        dx: loc.x * cosA - loc.y * sinA,
        dy: loc.x * sinA + loc.y * cosA
      };
    });

    var minDx = Infinity, maxDx = -Infinity, minDy = Infinity, maxDy = -Infinity;
    relOffsets.forEach(function (o) {
      if (o.dx < minDx) minDx = o.dx;
      if (o.dx > maxDx) maxDx = o.dx;
      if (o.dy < minDy) minDy = o.dy;
      if (o.dy > maxDy) maxDy = o.dy;
    });
    var padX = cw * 0.015;
    var padY = ch * 0.015;
    var minCx = padX - minDx, maxCx = cw - padX - maxDx;
    var minCy = padY - minDy, maxCy = ch - padY - maxDy;
    cx = minCx <= maxCx ? Math.max(minCx, Math.min(maxCx, cx)) : cw * 0.5;
    cy = minCy <= maxCy ? Math.max(minCy, Math.min(maxCy, cy)) : ch * 0.5;

    var corners = relOffsets.map(function (o) {
      return {
        x: Math.max(0.01, Math.min(0.99, (cx + o.dx) / cw)),
        y: Math.max(0.01, Math.min(0.99, (cy + o.dy) / ch))
      };
    });

    entry.pts = corners;
    entry.autoDetected = false;
  }

  /**
   * Ensures 4 points are ordered clockwise starting from Top-Left: [TL, TR, BR, BL].
   */
  function orderQuadClockwise(pts) {
    var cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) * 0.25;
    var cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) * 0.25;
    var sorted = pts.slice().sort(function (a, b) {
      return Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx);
    });
    // Find Top-Left (minimum x + y)
    var minIdx = 0;
    var minSum = Infinity;
    for (var i = 0; i < 4; i++) {
      var s = sorted[i].x + sorted[i].y;
      if (s < minSum) {
        minSum = s;
        minIdx = i;
      }
    }
    var out = [];
    for (var j = 0; j < 4; j++) {
      out.push(sorted[(minIdx + j) % 4]);
    }
    return out;
  }

  /**
   * True 4-Corner Projective Homography Perspective Warp (`warpPerspectiveCard`).
   * Maps any tilted/skewed quadrilateral `pts = [TL, TR, BR, BL]` on `sourceCanvas`
   * into a flat, straight high-DPI rectangular canvas using bilinear pixel interpolation.
   */
  function warpPerspectiveCard(sourceCanvas, normPts, customMinW, customMaxW, preserveLongEdge, foldAxis, targetAspect) {
    var sw = sourceCanvas.width;
    var sh = sourceCanvas.height;
    if (normPts && normPts.length === 6 && window.TechHatDocumentCore && window.TechHatDocumentCore.warpSixPoints) {
      var dims6 = window.TechHatDocumentCore.computeSixPointDims(sw, sh, normPts, customMinW, customMaxW, preserveLongEdge, foldAxis);
      var srcData6 = sourceCanvas._cachedPixelData;
      if (!srcData6 || sourceCanvas._cachedPixelW !== sw || sourceCanvas._cachedPixelH !== sh) {
        var srcCtx6 = sourceCanvas.getContext('2d', { willReadFrequently: true });
        srcData6 = srcCtx6.getImageData(0, 0, sw, sh).data;
        sourceCanvas._cachedPixelData = srcData6;
        sourceCanvas._cachedPixelW = sw;
        sourceCanvas._cachedPixelH = sh;
      }
      var outCanvas6 = document.createElement('canvas');
      outCanvas6.width = dims6.outW;
      outCanvas6.height = dims6.outH;
      var outCtx6 = outCanvas6.getContext('2d', { willReadFrequently: true });
      var outImg6 = outCtx6.createImageData(dims6.outW, dims6.outH);
      window.TechHatDocumentCore.warpSixPoints(srcData6, sw, sh, normPts, dims6.outW, dims6.outH, foldAxis, outImg6.data);
      outCtx6.putImageData(outImg6, 0, 0);
      return outCanvas6;
    }
    var p = normPts.map(function (pt) {
      return { x: pt.x * sw, y: pt.y * sh };
    });

    var topW = Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y);
    var botW = Math.hypot(p[2].x - p[3].x, p[2].y - p[3].y);
    var leftH = Math.hypot(p[3].x - p[0].x, p[3].y - p[0].y);
    var rightH = Math.hypot(p[2].x - p[1].x, p[2].y - p[1].y);

    var natW = Math.max(60, Math.max(topW, botW));
    var natH = Math.max(40, Math.max(leftH, rightH));
    // Ensure high-DPI output resolution (>= 1320 px wide for export, or lightweight preview width during live interaction)
    var minTargetW = customMinW || 1320;
    var maxTargetW = customMaxW || 2600;
    var refEdge = (!preserveLongEdge && targetAspect && targetAspect > 0) ? Math.max(natW, natH) : natW;
    var upScale = refEdge < minTargetW ? (minTargetW / refEdge) : (refEdge > maxTargetW ? (maxTargetW / refEdge) : 1);
    var outW = Math.max(120, Math.min(maxTargetW, Math.round(natW * upScale)));
    var outH = Math.max(80, Math.min(maxTargetW, Math.round(natH * upScale)));
    // Documents may be portrait or panoramic: constrain both dimensions together.
    if (preserveLongEdge) {
      var docScale = Math.min(1, maxTargetW / Math.max(natW, natH));
      outW = Math.max(16, Math.round(natW * docScale));
      outH = Math.max(16, Math.round(natH * docScale));
    } else if (targetAspect && targetAspect > 0) {
      // Lock ID card output dimensions to fixed ISO CR80 aspect ratio regardless of manual quad stretch/skew
      var longTarget = Math.max(120, Math.min(maxTargetW, Math.max(minTargetW, Math.round(Math.max(natW, natH) * upScale))));
      if (targetAspect >= 1) {
        outW = longTarget;
        outH = Math.max(80, Math.round(outW / targetAspect));
      } else {
        outH = longTarget;
        outW = Math.max(80, Math.round(outH * targetAspect));
      }
    }

    // Fast hardware-resampled path when the quad is already an axis-aligned rectangle (within 1.5px)
    var isAxisAligned =
      p[0].x >= 0 && p[3].x >= 0 && p[1].x <= sw && p[2].x <= sw && p[0].y >= 0 && p[1].y >= 0 && p[2].y <= sh && p[3].y <= sh && Math.abs(p[0].y - p[1].y) < 1.5 &&
      Math.abs(p[3].y - p[2].y) < 1.5 &&
      Math.abs(p[0].x - p[3].x) < 1.5 &&
      Math.abs(p[1].x - p[2].x) < 1.5;

    if (isAxisAligned) {
      var rx = Math.max(0, Math.min(p[0].x, p[3].x));
      var ry = Math.max(0, Math.min(p[0].y, p[1].y));
      var rw = Math.max(1, Math.min(sw - rx, Math.max(p[1].x, p[2].x) - rx));
      var rh = Math.max(1, Math.min(sh - ry, Math.max(p[2].y, p[3].y) - ry));
      var rectCanvas = document.createElement('canvas');
      rectCanvas.width = outW;
      rectCanvas.height = outH;
      var rctx = rectCanvas.getContext('2d', { willReadFrequently: true });
      rctx.imageSmoothingEnabled = true;
      rctx.imageSmoothingQuality = 'high';
      rctx.drawImage(sourceCanvas, rx, ry, rw, rh, 0, 0, outW, outH);
      return rectCanvas;
    }

    // Closed-form projective homography from unit square (u,v) in [0,1]^2 to quad (p0, p1, p2, p3)
    var x0 = p[0].x, y0 = p[0].y;
    var x1 = p[1].x, y1 = p[1].y;
    var x2 = p[2].x, y2 = p[2].y;
    var x3 = p[3].x, y3 = p[3].y;

    var dx1 = x1 - x2, dx2 = x3 - x2, sx = x0 - x1 + x2 - x3;
    var dy1 = y1 - y2, dy2 = y3 - y2, sy = y0 - y1 + y2 - y3;
    var denom = dx1 * dy2 - dx2 * dy1;
    var g = 0, h = 0;
    if (Math.abs(denom) > 1e-6) {
      g = (sx * dy2 - dx2 * sy) / denom;
      h = (dx1 * sy - sx * dy1) / denom;
    }
    var a = x1 - x0 + g * x1;
    var b = x3 - x0 + h * x3;
    var c = x0;
    var d = y1 - y0 + g * y1;
    var e = y3 - y0 + h * y3;
    var f = y0;

    var srcData = sourceCanvas._cachedPixelData;
    if (!srcData || sourceCanvas._cachedPixelW !== sw || sourceCanvas._cachedPixelH !== sh) {
      var srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
      srcData = srcCtx.getImageData(0, 0, sw, sh).data;
      sourceCanvas._cachedPixelData = srcData;
      sourceCanvas._cachedPixelW = sw;
      sourceCanvas._cachedPixelH = sh;
    }

    var outCanvas = document.createElement('canvas');
    outCanvas.width = outW;
    outCanvas.height = outH;
    var outCtx = outCanvas.getContext('2d', { willReadFrequently: true });
    var outImg = outCtx.createImageData(outW, outH);
    var dst = outImg.data;

    var invW = 1 / Math.max(1, outW - 1);
    var invH = 1 / Math.max(1, outH - 1);
    var maxSx = sw - 1.001;
    var maxSy = sh - 1.001;

    var dstIdx = 0;
    for (var oy = 0; oy < outH; oy++) {
      var v = oy * invH;
      var bvX = b * v + c;
      var evY = e * v + f;
      var hvW = h * v + 1;

      for (var ox = 0; ox < outW; ox++) {
        var u = ox * invW;
        var w = g * u + hvW;
        var srcX = (a * u + bvX) / w;
        var srcY = (d * u + evY) / w;

        if (srcX < 0 || srcX > maxSx || srcY < 0 || srcY > maxSy) { dst[dstIdx] = dst[dstIdx + 1] = dst[dstIdx + 2] = dst[dstIdx + 3] = 255; dstIdx += 4; continue; }




        var ix = srcX | 0;
        var iy = srcY | 0;
        var fx = srcX - ix;
        var fy = srcY - iy;
        var w00 = (1 - fx) * (1 - fy);
        var w10 = fx * (1 - fy);
        var w01 = (1 - fx) * fy;
        var w11 = fx * fy;

        var i00 = (iy * sw + ix) * 4;
        var i10 = i00 + 4;
        var i01 = i00 + sw * 4;
        var i11 = i01 + 4;

        dst[dstIdx]     = srcData[i00] * w00 + srcData[i10] * w10 + srcData[i01] * w01 + srcData[i11] * w11;
        dst[dstIdx + 1] = srcData[i00 + 1] * w00 + srcData[i10 + 1] * w10 + srcData[i01 + 1] * w01 + srcData[i11 + 1] * w11;
        dst[dstIdx + 2] = srcData[i00 + 2] * w00 + srcData[i10 + 2] * w10 + srcData[i01 + 2] * w01 + srcData[i11 + 2] * w11;
        dst[dstIdx + 3] = 255;
        dstIdx += 4;
      }
    }

    outCtx.putImageData(outImg, 0, 0);
    return outCanvas;
  }

  function triggerNidScanAnimation() {
    var beam = $('#nidScanBeam');
    if (!beam) return;
    beam.hidden = false;
    beam.style.animation = 'none';
    void beam.offsetWidth;
    beam.style.animation = '';
    setTimeout(function () {
      beam.hidden = true;
    }, 720);
  }

  var nidColorTarget = 'all';
  var NID_FILTER_LABELS = {
    original: { bn: 'অরিজিনাল', en: 'Original' },
    vivid: { bn: 'আসল রঙ HD', en: 'Vivid HD' },
    magic: { bn: 'Magic', en: 'Magic' },
    magic_plus: { bn: 'Magic+', en: 'Magic+' },
    no_shadow: { bn: 'No Shadow', en: 'No Shadow' },
    clean: { bn: 'পরিষ্কার সাদা', en: 'Clean White' },
    eco: { bn: 'কালি সাশ্রয়ী', en: 'Eco Ink' },
    bw: { bn: 'ফটোকপি B/W', en: 'B/W Copy' },
    grayscale: { bn: 'গ্রেস্কেল', en: 'Grayscale' }
  };
  function getNidFilterLabel(mode) {
    var meta = NID_FILTER_LABELS[mode] || NID_FILTER_LABELS.original;
    return isEn() ? meta.en : meta.bn;
  }

  function getDefaultEnhancersForMode(scanMode) {
    if (scanMode === 'magic_plus' || scanMode === 'no_shadow' || scanMode === 'eco' || scanMode === 'bw') {
      return { deglare: true, textBoost: true };
    }
    if (scanMode === 'magic' || scanMode === 'clean' || scanMode === 'grayscale') {
      return { deglare: false, textBoost: true };
    }
    return { deglare: false, textBoost: false };
  }

  function getEntryColorState(entry) {
    if (!entry) {
      return { scanMode: 'original', br: 100, ct: 100, st: 100, sharp: 20, deglare: false, textBoost: false };
    }
    var mode = entry.scanMode || 'original';
    var defs = getDefaultEnhancersForMode(mode);
    return {
      scanMode: mode,
      br: typeof entry.bright === 'number' ? entry.bright : 100,
      ct: typeof entry.contrast === 'number' ? entry.contrast : 100,
      st: typeof entry.sat === 'number' ? entry.sat : 100,
      sharp: typeof entry.sharp === 'number' ? entry.sharp : 20,
      deglare: typeof entry.deglare === 'boolean' ? entry.deglare : defs.deglare,
      textBoost: typeof entry.textBoost === 'boolean' ? entry.textBoost : defs.textBoost
    };
  }

  function isEntryColorCustom(entry) {
    var s = getEntryColorState(entry);
    return s.scanMode !== 'original' || s.br !== 100 || s.ct !== 100 || s.st !== 100 || s.sharp !== 20 || s.deglare || s.textBoost;
  }

  function areCombinePagesColorDifferent() {
    if (combineItems.length < 2) return false;
    var a = getEntryColorState(combineItems[0]);
    var b = getEntryColorState(combineItems[1]);
    return a.scanMode !== b.scanMode || a.br !== b.br || a.ct !== b.ct || a.st !== b.st || a.sharp !== b.sharp || a.deglare !== b.deglare || a.textBoost !== b.textBoost;
  }

  function getActiveColorRefEntry() {
    if (!combineItems.length) return null;
    if (nidColorTarget === '0') return combineItems[0];
    if (nidColorTarget === '1') return combineItems[1] || combineItems[0];
    return combineItems[activeNidIdx] || combineItems[0];
  }

  function updateNidRightPanelBadges() {
    if (combineItems.length < 2 && nidColorTarget === '1') {
      nidColorTarget = 'all';
    }
    $$('#nidColorTargetGroup [data-color-target]').forEach(function (btn) {
      var t = btn.getAttribute('data-color-target');
      if (t === '1') {
        btn.disabled = combineItems.length < 2;
      }
      var isAct = (t === nidColorTarget);
      btn.classList.toggle('active', isAct);
      btn.setAttribute('aria-pressed', isAct ? 'true' : 'false');
    });

    for (var i = 0; i < 2; i++) {
      var entry = combineItems[i];
      var tagEl = $('#nidTargetTag' + i);
      var dotEl = $('#nidTargetDot' + i);
      if (tagEl) {
        if (!entry) {
          tagEl.textContent = tr('নেই', 'None');
        } else {
          var st = getEntryColorState(entry);
          var lbl = getNidFilterLabel(st.scanMode);
          var tuned = (st.br !== 100 || st.ct !== 100 || st.st !== 100 || st.sharp !== 20 || (st.scanMode === 'original' && (st.deglare || st.textBoost)));
          tagEl.textContent = tuned && st.scanMode === 'original' ? tr('এনহ্যান্সড', 'Enhanced') : (tuned ? lbl + tr(' • টিউন', ' • Tuned') : lbl);
        }
      }
      if (dotEl) {
        dotEl.classList.toggle('is-custom', !!entry && isEntryColorCustom(entry));
      }
    }

    var diffPages = areCombinePagesColorDifferent();
    var statusEl = $('#nidColorTargetStatus');
    var hintEl = $('#nidTargetSyncHint');
    if (statusEl) {
      if (nidColorTarget === 'all') {
        statusEl.textContent = diffPages ? tr('উভয় পাতা নির্বাচিত (পৃথক ফিল্টার সক্রিয়)', 'Both sides selected (different filters active)') : tr('উভয় পাতায় একসাথে কার্যকর', 'Applied to both sides simultaneously');
      } else if (nidColorTarget === '0') {
        statusEl.textContent = tr('শুধুমাত্র ১ম পাতায় (সামনের অংশ) কার্যকর', 'Applied to 1st side (front) only');
      } else {
        statusEl.textContent = tr('শুধুমাত্র ২য় পাতায় (পেছনের অংশ) কার্যকর', 'Applied to 2nd side (back) only');
      }
    }
    if (hintEl) {
      if (nidColorTarget === 'all') {
        hintEl.textContent = diffPages ? tr('১ম ও ২য় পাতা ভিন্ন', '1st & 2nd sides differ') : tr('ডিফল্ট: উভয় পাতা', 'Default: both sides');
      } else {
        hintEl.textContent = nidColorTarget === '0' ? tr('১ম পাতা নির্বাচিত', '1st side selected') : tr('২য় পাতা নির্বাচিত', '2nd side selected');
      }
    }

    var refEntry = getActiveColorRefEntry();
    var refSt = getEntryColorState(refEntry);

    var deglareBtn = $('#nidDeglareBtn');
    var deglareState = $('#nidDeglareState');
    if (deglareBtn) {
      deglareBtn.setAttribute('aria-pressed', refSt.deglare ? 'true' : 'false');
    }
    if (deglareState) {
      deglareState.textContent = refSt.deglare ? tr('চালু', 'On') : tr('বন্ধ', 'Off');
    }

    var textBoostBtn = $('#nidTextBoostBtn');
    var textBoostState = $('#nidTextBoostState');
    if (textBoostBtn) {
      textBoostBtn.setAttribute('aria-pressed', refSt.textBoost ? 'true' : 'false');
    }
    if (textBoostState) {
      textBoostState.textContent = refSt.textBoost ? tr('চালু', 'On') : tr('বন্ধ', 'Off');
    }

    var filterBadge = $('#nidFilterSummaryBadge');
    if (filterBadge) {
      if (combineItems.length >= 2 && combineItems[0].scanMode !== combineItems[1].scanMode && nidColorTarget === 'all') {
        var l0 = getNidFilterLabel(combineItems[0].scanMode || 'original');
        var l1 = getNidFilterLabel(combineItems[1].scanMode || 'original');
        filterBadge.textContent = l0 + ' / ' + l1;
      } else {
        var baseLbl = getNidFilterLabel(refSt.scanMode);
        if (refSt.scanMode === 'original' && (refSt.deglare || refSt.textBoost)) {
          baseLbl = refSt.deglare && refSt.textBoost ? tr('প্রো ফিক্স', 'Pro Fix') : (refSt.deglare ? tr('শ্যাডো ফিক্স', 'Shadow Fix') : tr('টেক্সট শার্প', 'Text Sharp'));
        }
        filterBadge.textContent = baseLbl;
      }
    }

    var tuneBadge = $('#nidTuneSummaryBadge');
    if (tuneBadge) {
      if (refSt.br === 100 && refSt.ct === 100 && refSt.st === 100 && refSt.sharp === 20) {
        tuneBadge.textContent = tr('ডিফল্ট', 'Default');
      } else {
        tuneBadge.textContent = toBn(refSt.br) + '% • ' + toBn(refSt.ct) + '%';
      }
    }

    var modeEl = $('input[name="imgCombineMode"]:checked');
    var modeVal = modeEl ? modeEl.value : 'nid-a4';
    var layoutBadge = $('#nidLayoutSummaryBadge');
    if (layoutBadge) {
      var modeMap = {
        'nid-a4': tr('A4 উপরে-নিচে', 'A4 Top-Bottom'),
        'nid-a4-side': tr('A4 পাশাপাশি', 'A4 Side-by-Side'),
        'vertical': tr('কার্ড উপরে-নিচে', 'Card Top-Bottom'),
        'horizontal': tr('কার্ড পাশাপাশি', 'Card Side-by-Side')
      };
      layoutBadge.textContent = modeMap[modeVal] || tr('A4 উপরে-নিচে', 'A4 Top-Bottom');
    }

    var copySets = $('#imgCombineCopies') ? (parseInt($('#imgCombineCopies').value, 10) || 1) : 1;
    var cutMarks = $('#imgCombineCutMarks') ? $('#imgCombineCutMarks').checked : false;
    var printBadge = $('#nidPrintOptSummaryBadge');
    if (printBadge) {
      printBadge.textContent = toBn(copySets) + tr(' সেট', ' sets') + (cutMarks ? tr(' • কাট মার্ক', ' • Cut marks') : '');
    }

    var gapVal = Math.max(0, parseInt($('#imgCombineGap') && $('#imgCombineGap').value, 10) || 36);
    var gapBadge = $('#nidGapSummaryBadge');
    if (gapBadge) {
      gapBadge.textContent = toBn(gapVal) + 'px';
    }
  }

  function syncNidColorControlsFromTarget() {
    var refEntry = getActiveColorRefEntry();
    var st = getEntryColorState(refEntry);
    var rad = $('input[name="imgCombineScanMode"][value="' + st.scanMode + '"]');
    if (rad) rad.checked = true;
    if ($('#imgCombineBright')) $('#imgCombineBright').value = st.br;
    if ($('#imgCombineContrast')) $('#imgCombineContrast').value = st.ct;
    if ($('#imgCombineSat')) $('#imgCombineSat').value = st.st;
    if ($('#imgCombineSharp')) $('#imgCombineSharp').value = st.sharp;
    if ($('#imgCombineBrightVal')) $('#imgCombineBrightVal').textContent = toBn(st.br) + '%';
    if ($('#imgCombineContrastVal')) $('#imgCombineContrastVal').textContent = toBn(st.ct) + '%';
    if ($('#imgCombineSatVal')) $('#imgCombineSatVal').textContent = toBn(st.st) + '%';
    if ($('#imgCombineSharpVal')) $('#imgCombineSharpVal').textContent = toBn(st.sharp) + '%';
    updateNidRightPanelBadges();
  }

  function applyDomColorControlsToTarget(presetChanged) {
    var scanEl = $('input[name="imgCombineScanMode"]:checked');
    var scanMode = scanEl ? scanEl.value : 'original';
    var br = $('#imgCombineBright') ? (parseInt($('#imgCombineBright').value, 10) || 100) : 100;
    var ct = $('#imgCombineContrast') ? (parseInt($('#imgCombineContrast').value, 10) || 100) : 100;
    var st = $('#imgCombineSat') ? Number($('#imgCombineSat').value) : 100;
    var sharp = $('#imgCombineSharp') ? (parseInt($('#imgCombineSharp').value, 10) || 0) : 20;
    var modeDefs = getDefaultEnhancersForMode(scanMode);

    if ($('#imgCombineBrightVal')) $('#imgCombineBrightVal').textContent = toBn(br) + '%';
    if ($('#imgCombineContrastVal')) $('#imgCombineContrastVal').textContent = toBn(ct) + '%';
    if ($('#imgCombineSatVal')) $('#imgCombineSatVal').textContent = toBn(st) + '%';
    if ($('#imgCombineSharpVal')) $('#imgCombineSharpVal').textContent = toBn(sharp) + '%';

    var applyToEntry = function (entry) {
      if (!entry) return;
      entry.scanMode = scanMode;
      entry.bright = br;
      entry.contrast = ct;
      entry.sat = st;
      entry.sharp = sharp;
      if (presetChanged || typeof entry.deglare !== 'boolean') {
        entry.deglare = modeDefs.deglare;
      }
      if (presetChanged || typeof entry.textBoost !== 'boolean') {
        entry.textBoost = modeDefs.textBoost;
      }
    };

    if (nidColorTarget === 'all') {
      combineItems.forEach(applyToEntry);
    } else {
      var idx = parseInt(nidColorTarget, 10);
      applyToEntry(combineItems[idx] || combineItems[0]);
    }
    updateNidRightPanelBadges();
  }

  function toggleNidSmartEnhancer(propName) {
    if (!combineItems.length) return;
    pushNidHistory();
    var refEntry = getActiveColorRefEntry();
    var refSt = getEntryColorState(refEntry);
    var nextVal = !refSt[propName];
    if (nidColorTarget === 'all') {
      combineItems.forEach(function (entry) {
        var es = getEntryColorState(entry);
        entry.deglare = propName === 'deglare' ? nextVal : es.deglare;
        entry.textBoost = propName === 'textBoost' ? nextVal : es.textBoost;
      });
    } else {
      var idx = parseInt(nidColorTarget, 10);
      var targetEntry = combineItems[idx] || combineItems[0];
      if (targetEntry) {
        var ts = getEntryColorState(targetEntry);
        targetEntry.deglare = propName === 'deglare' ? nextVal : ts.deglare;
        targetEntry.textBoost = propName === 'textBoost' ? nextVal : ts.textBoost;
      }
    }
    updateNidRightPanelBadges();
    renderCombineLivePreview();
  }

  function createCombineEntry(loadedItem) {
    var orientMode = getNidCardOrient();
    var det = autoDetectCardQuad(loadedItem.img, 0, 1, null, null, true, orientMode);
    var baseEntry = (nidColorTarget === 'all' && combineItems.length > 0) ? combineItems[0] : null;
    var bs = getEntryColorState(baseEntry);
    return {
      item: loadedItem,
      rot: typeof det.rot === 'number' ? det.rot : 0,
      manualRot: 0,
      flipH: 1,
      fineAngle: 0,
      pts: det.pts,
      autoDetected: det.auto,
      cardOrient: orientMode,
      cw: 0,
      ch: 0,
      scanMode: bs.scanMode,
      bright: bs.br,
      contrast: bs.ct,
      sat: bs.st,
      sharp: bs.sharp,
      deglare: bs.deglare,
      textBoost: bs.textBoost
    };
  }

  function syncNidDeskewControl() {
    var entry = combineItems[activeNidIdx];
    var ang = entry ? (entry.fineAngle || 0) : 0;
    if ($('#nidFineAngle')) $('#nidFineAngle').value = ang;
    if ($('#nidFineAngleVal')) {
      var prefix = ang > 0 ? '+' : '';
      $('#nidFineAngleVal').textContent = prefix + toBn(ang) + '°';
    }
  }

  var MAX_NID_SIDES = 2;

  function showMaxNidSidesToast() {
    showToast(tr(
      'আইডি কার্ডে সর্বোচ্চ ২টি ছবি (সামনের ও পেছনের পৃষ্ঠা) আপলোড করা যাবে। ছবি পরিবর্তন করতে "বদলান" অপশন ব্যবহার করুন।',
      'Maximum 2 images (Front & Back sides) allowed for ID card. Use "Replace" to change an image.'
    ));
  }

  function syncNidAddLimitControls() {
    var isFull = combineItems.length >= MAX_NID_SIDES;
    var addInp = $('#imgCombineAddMore');
    if (addInp) addInp.disabled = isFull;
    $$('label[for="imgCombineAddMore"]').forEach(function (lbl) {
      lbl.classList.toggle('opacity-45', isFull);
      lbl.classList.toggle('cursor-not-allowed', isFull);
      lbl.setAttribute('aria-disabled', isFull ? 'true' : 'false');
      var txt = lbl.querySelector('[data-i18n-bn]');
      if (txt && lbl.classList.contains('ds-add-more')) {
        txt.textContent = isFull ? tr('২/২ পৃষ্ঠা যুক্ত', '2/2 Sides Full') : tr('পেজ যোগ করুন', 'Add Side');
      }
    });
    $$('#nidPagesSidebar [data-cam-slot="-1"], #nidCameraStageBtn, #nidMobCamBtn').forEach(function (btn) {
      btn.classList.toggle('opacity-45', isFull);
      btn.setAttribute('aria-disabled', isFull ? 'true' : 'false');
    });
  }

  function ensureActiveNidCropMode() {
    nidFitMode = true;
    nidPan = { x: 0, y: 0 };
    if (nidColorTarget !== 'all' && activeNidIdx >= 0 && activeNidIdx < 2) {
      nidColorTarget = String(activeNidIdx);
    }
    var pane = $('#img-pane-combine');
    if (pane && pane.getAttribute('data-view') === 'preview') {
      var restoreView = window.innerWidth < 768 ? 'crop' : 'split';
      pane.setAttribute('data-view', restoreView);
      $$('[data-nid-canvas-view]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-nid-canvas-view') === restoreView ? 'true' : 'false');
      });
    }
  }

  async function addCombineFiles(files) {
    var incoming = Array.prototype.slice.call(files || []);
    if (!incoming.length) return;
    if (combineItems.length >= MAX_NID_SIDES) {
      showMaxNidSidesToast();
      return;
    }
    var prevCount = combineItems.length;
    var remainingSlots = MAX_NID_SIDES - prevCount;
    var wasCapped = incoming.length > remainingSlots;
    if (wasCapped) {
      incoming = incoming.slice(0, remainingSlots);
    }
    var addedCount = 0;
    for (var i = 0; i < incoming.length; i++) {
      try {
        var it = await loadImageFile(incoming[i]);
        combineItems.push(createCombineEntry(it));
        addedCount++;
      } catch (e) {}
    }
    if (!combineItems.length || !addedCount) {
      showToast(tr('অনুগ্রহ করে ছবি নির্বাচন করুন', 'Please select an image'));
      return;
    }
    // When uploading the 2nd part after the 1st part is already loaded, automatically switch to the newly added 2nd part
    activeNidIdx = prevCount > 0 ? (combineItems.length - 1) : 0;
    clearNidHistory();
    $('#imgCombineDropzone').hidden = true;
    $('#imgCombineStage').hidden = false;
    if ($('#imgCombineTopActions')) $('#imgCombineTopActions').hidden = false;
    if ($('#img-pane-combine')) $('#img-pane-combine').setAttribute('data-has-pages', 'true');
    ensureActiveNidCropMode();
    switchNidView('edit');
    renderNidCardTabs();
    syncNidDeskewControl();
    syncNidColorControlsFromTarget();
    drawNidCropSourceCanvas();
    triggerNidScanAnimation();
    renderCombineLivePreview();
    if (wasCapped) {
      showToast(tr('আইডি কার্ডের জন্য সর্বোচ্চ ২টি ছবি (সামনের ও পেছনের পৃষ্ঠা) নেওয়া হয়েছে', 'Loaded maximum 2 images (Front & Back sides) for ID card'));
    } else if (prevCount > 0) {
      showToast(tr('২য় পৃষ্ঠা লোড হয়েছে এবং অটো-সিলেক্ট করা হয়েছে!', '2nd side loaded & selected automatically!'));
    }
  }

  async function setCombineSlotFile(slotIdx, file) {
    if ((typeof slotIdx !== 'number' || slotIdx < 0 || slotIdx >= MAX_NID_SIDES) && combineItems.length >= MAX_NID_SIDES) {
      showMaxNidSidesToast();
      return;
    }
    try {
      var it = await loadImageFile(file);
      var entry = createCombineEntry(it);
      if (slotIdx === 0) {
        if (combineItems.length > 0) {
          combineItems[0] = entry;
        } else {
          combineItems.push(entry);
        }
        activeNidIdx = 0;
      } else if (slotIdx === 1) {
        if (combineItems.length >= 2) {
          combineItems[1] = entry;
          activeNidIdx = 1;
        } else {
          combineItems.push(entry);
          activeNidIdx = combineItems.length - 1;
        }
      } else if (combineItems.length < MAX_NID_SIDES) {
        combineItems.push(entry);
        activeNidIdx = combineItems.length - 1;
      } else {
        showMaxNidSidesToast();
        return;
      }
      $('#imgCombineDropzone').hidden = true;
      clearNidHistory();
      $('#imgCombineStage').hidden = false;
      if ($('#imgCombineTopActions')) $('#imgCombineTopActions').hidden = false;
      if ($('#img-pane-combine')) $('#img-pane-combine').setAttribute('data-has-pages', 'true');
      ensureActiveNidCropMode();
      switchNidView('edit');
      renderNidCardTabs();
      syncNidDeskewControl();
      syncNidColorControlsFromTarget();
      drawNidCropSourceCanvas();
      triggerNidScanAnimation();
      renderCombineLivePreview();
      showToast(getNidCardOrient(entry) === 'portrait'
        ? tr('পোর্ট্রেট আইডি কার্ডের এজ অটো-ডিটেক্ট ও সোজা করা হয়েছে!', 'Portrait ID card edges auto-detected & straightened!')
        : tr('আইডি কার্ডের এজ অটো-ডিটেক্ট ও সোজা করা হয়েছে!', 'ID card edges auto-detected & straightened!'));
    } catch (e) {
      showToast(e.message || tr('ছবি লোড করা যায়নি', 'Failed to load image'));
    }
  }

  function cloneCurrentImageToOtherSide() {
    var srcEntry = combineItems[activeNidIdx] || combineItems[0];
    if (!srcEntry) return;
    // Try auto-detecting a 2nd card on the same sheet by masking out the 1st card's region!
    var cloneOrient = getNidCardOrient(srcEntry);
    var det2 = autoDetectCardQuad(srcEntry.item.img, srcEntry.rot || 0, srcEntry.flipH || 1, srcEntry.pts, null, false, cloneOrient);
    var pts = det2 && !det2.fallback && det2.pts ? cloneQuadPts(det2.pts) : cloneQuadPts(srcEntry.pts);

    // Check if det2 overlapped heavily with srcEntry.pts or fell back (e.g., if only 1 card exists on the sheet)
    var c1x = (srcEntry.pts[0].x + srcEntry.pts[2].x) * 0.5;
    var c1y = (srcEntry.pts[0].y + srcEntry.pts[2].y) * 0.5;
    var c2x = (pts[0].x + pts[2].x) * 0.5;
    var c2y = (pts[0].y + pts[2].y) * 0.5;
    if ((det2 && det2.fallback) || Math.hypot(c2x - c1x, c2y - c1y) < 0.14) {
      pts = cloneQuadPts(srcEntry.pts);
      var minX = Math.min(pts[0].x, pts[1].x, pts[2].x, pts[3].x);
      var maxX = Math.max(pts[0].x, pts[1].x, pts[2].x, pts[3].x);
      var minY = Math.min(pts[0].y, pts[1].y, pts[2].y, pts[3].y);
      var maxY = Math.max(pts[0].y, pts[1].y, pts[2].y, pts[3].y);
      var freeVert = Math.max(minY, 1 - maxY);
      var freeHoriz = Math.max(minX, 1 - maxX);
      if (cloneOrient === 'portrait' && freeHoriz > freeVert && freeHoriz > 0.22) {
        var shiftX = c1x < 0.5 ? 0.36 : -0.36;
        var clampedShiftX = Math.max(-minX + 0.02, Math.min(0.98 - maxX, shiftX));
        for (var ix = 0; ix < 4; ix++) {
          pts[ix].x = +(pts[ix].x + clampedShiftX).toFixed(4);
        }
      } else {
        var shiftY = c1y < 0.5 ? 0.36 : -0.36;
        var clampedShiftY = Math.max(-minY + 0.02, Math.min(0.98 - maxY, shiftY));
        for (var i = 0; i < 4; i++) {
          pts[i].y = +(pts[i].y + clampedShiftY).toFixed(4);
        }
      }
    }

    var srcCol = getEntryColorState(srcEntry);
    var clonedEntry = {
      item: srcEntry.item,
      rot: srcEntry.rot || 0,
      manualRot: srcEntry.manualRot || 0,
      flipH: srcEntry.flipH || 1,
      fineAngle: 0,
      pts: pts,
      autoDetected: true,
      cardOrient: cloneOrient,
      cw: srcEntry.cw || 0,
      ch: srcEntry.ch || 0,
      snapField: srcEntry.snapField || null,
      _snapFieldKey: srcEntry._snapFieldKey,
      scanMode: srcCol.scanMode,
      bright: srcCol.br,
      contrast: srcCol.ct,
      sat: srcCol.st,
      sharp: srcCol.sharp,
      deglare: srcCol.deglare,
      textBoost: srcCol.textBoost
    };

    clearNidHistory();
    if (combineItems.length === 1) {
      combineItems.push(clonedEntry);
      activeNidIdx = 1;
    } else {
      var targetIdx = activeNidIdx === 0 ? 1 : 0;
      combineItems[targetIdx] = clonedEntry;
      activeNidIdx = targetIdx;
    }
    ensureActiveNidCropMode();
    switchNidView('edit');
    renderNidCardTabs();
    syncNidDeskewControl();
    syncNidColorControlsFromTarget();
    drawNidCropSourceCanvas();
    triggerNidScanAnimation();
    renderCombineLivePreview();
    showToast(tr('একই ছবি থেকে অপর পাশের কার্ড অটো-ডিটেক্ট করা হয়েছে!', 'Auto-detected other side of card from same image!'));
  }

  var nidUndoStack = [];
  var nidRedoStack = [];
  var nidCanvasZoom = 1;
  var nidPan = { x: 0, y: 0 };
  var nidFitMode = true;
  var nidHandTool = false;
  var nidSpaceHeld = false;

  function captureNidSnapshot() {
    return {
      activeIdx: activeNidIdx,
      colorTarget: nidColorTarget,
      cardOrient: nidCardOrient,
      items: combineItems.map(function (e) {
        var cs = getEntryColorState(e);
        return {
          rot: e.rot || 0,
          manualRot: e.manualRot || 0,
          flipH: e.flipH || 1,
          fineAngle: e.fineAngle || 0,
          autoDetected: !!e.autoDetected,
          cardOrient: e.cardOrient || nidCardOrient,
          pts: cloneQuadPts(e.pts),
          scanMode: cs.scanMode,
          bright: cs.br,
          contrast: cs.ct,
          sat: cs.st,
          sharp: cs.sharp,
          deglare: cs.deglare,
          textBoost: cs.textBoost
        };
      })
    };
  }

  function syncNidOrientButtons() {
    var entry = combineItems[activeNidIdx];
    var orient = getNidCardOrient(entry);
    var isPort = orient === 'portrait';
    var landBtn = $('#nidSnapRatioBtn');
    var portBtn = $('#nidSnapPortraitRatioBtn');
    var mobLand = $('#nidMobSnapRatio');
    var mobPort = $('#nidMobSnapPortrait');
    var dropLand = $('#nidDropOrientLandscape');
    var dropPort = $('#nidDropOrientPortrait');
    if (landBtn) {
      landBtn.setAttribute('aria-pressed', !isPort ? 'true' : 'false');
    }
    if (portBtn) {
      portBtn.setAttribute('aria-pressed', isPort ? 'true' : 'false');
    }
    if (mobLand) {
      mobLand.setAttribute('aria-pressed', !isPort ? 'true' : 'false');
    }
    if (mobPort) {
      mobPort.setAttribute('aria-pressed', isPort ? 'true' : 'false');
    }
    if (dropLand) {
      dropLand.setAttribute('aria-pressed', !isPort ? 'true' : 'false');
    }
    if (dropPort) {
      dropPort.setAttribute('aria-pressed', isPort ? 'true' : 'false');
    }
  }

  function updateNidHistoryButtons() {
    var uBtn = $('#nidUndoBtn');
    var rBtn = $('#nidRedoBtn');
    var mobUBtn = $('#nidMobUndoBtn');
    var mobRBtn = $('#nidMobRedoBtn');
    if (uBtn) uBtn.disabled = nidUndoStack.length === 0;
    if (rBtn) rBtn.disabled = nidRedoStack.length === 0;
    if (mobUBtn) mobUBtn.disabled = nidUndoStack.length === 0;
    if (mobRBtn) mobRBtn.disabled = nidRedoStack.length === 0;
  }

  function clearNidHistory() {
    nidUndoStack = [];
    nidRedoStack = [];
    updateNidHistoryButtons();
  }

  function pushNidHistory() {
    if (!combineItems.length) return;
    nidUndoStack.push(captureNidSnapshot());
    if (nidUndoStack.length > 30) nidUndoStack.shift();
    nidRedoStack = [];
    updateNidHistoryButtons();
  }

  function applyNidSnapshot(snap) {
    if (!snap || snap.items.length !== combineItems.length) return;
    activeNidIdx = Math.min(combineItems.length - 1, Math.max(0, snap.activeIdx || 0));
    if (snap.colorTarget) nidColorTarget = snap.colorTarget;
    if (snap.cardOrient) nidCardOrient = snap.cardOrient;
    snap.items.forEach(function (st, i) {
      combineItems[i].rot = st.rot;
      combineItems[i].manualRot = typeof st.manualRot === 'number' ? st.manualRot : 0;
      combineItems[i].flipH = st.flipH;
      combineItems[i].fineAngle = st.fineAngle;
      combineItems[i].autoDetected = st.autoDetected;
      combineItems[i].cardOrient = st.cardOrient || nidCardOrient;
      combineItems[i].pts = cloneQuadPts(st.pts);
      combineItems[i].scanMode = st.scanMode || 'original';
      combineItems[i].bright = typeof st.bright === 'number' ? st.bright : 100;
      combineItems[i].contrast = typeof st.contrast === 'number' ? st.contrast : 100;
      combineItems[i].sat = typeof st.sat === 'number' ? st.sat : 100;
      combineItems[i].sharp = typeof st.sharp === 'number' ? st.sharp : 20;
      combineItems[i].deglare = typeof st.deglare === 'boolean' ? st.deglare : false;
      combineItems[i].textBoost = typeof st.textBoost === 'boolean' ? st.textBoost : false;
    });
    syncNidOrientButtons();
    renderNidCardTabs();
    syncNidDeskewControl();
    syncNidColorControlsFromTarget();
    drawNidCropSourceCanvas();
    renderCombineLivePreview();
    updateNidHistoryButtons();
  }

  function syncNidViewport() {
    var entry = combineItems[activeNidIdx];
    var viewport = $('#nidCanvasViewport');
    var plane = $('#nidCanvasZoomPlane');
    if (!entry || !viewport || !plane || !entry.viewWidth) return;
    var w = entry.viewWidth * nidCanvasZoom;
    var h = entry.viewHeight * nidCanvasZoom;
    // Keep a reachable part of the image in the viewport, even after a long pan.
    var maxX = Math.max(0, (w + viewport.clientWidth) / 2 - 48);
    var maxY = Math.max(0, (h + viewport.clientHeight) / 2 - 48);
    nidPan.x = Math.max(-maxX, Math.min(maxX, nidPan.x));
    nidPan.y = Math.max(-maxY, Math.min(maxY, nidPan.y));
    plane.style.width = w + 'px';
    plane.style.height = h + 'px';
    plane.style.transform = 'translate(-50%, -50%) translate(' + nidPan.x + 'px,' + nidPan.y + 'px)';
    $('#nidZoomPercent').value = Math.round(nidCanvasZoom * 100);
    $('#nidZoomFitBtn').classList.toggle('active', nidFitMode);
    $('#nidZoomOutBtn').disabled = nidCanvasZoom <= 0.01;
    $('#nidZoomInBtn').disabled = nidCanvasZoom >= 8;
  }

  function setNidCanvasZoom(z, anchor) {
    if (!Number.isFinite(z)) return;
    var next = Math.max(0.01, Math.min(8, z));
    var ratio = next / nidCanvasZoom;
    var at = anchor || { x: 0, y: 0 };
    nidPan.x = at.x - (at.x - nidPan.x) * ratio;
    nidPan.y = at.y - (at.y - nidPan.y) * ratio;
    nidCanvasZoom = next;
    nidFitMode = false;
    syncNidViewport();
  }

  function fitNidCanvas() {
    var entry = combineItems[activeNidIdx];
    var viewport = $('#nidCanvasViewport');
    if (!entry || !entry.viewWidth || !viewport || !viewport.clientWidth || !viewport.clientHeight) return;
    nidCanvasZoom = Math.max(0.01, Math.min(1,
      (viewport.clientWidth - 72) / entry.viewWidth,
      (viewport.clientHeight - 72) / entry.viewHeight));
    nidPan = { x: 0, y: 0 };
    nidFitMode = true;
    syncNidViewport();
  }

  function setNidHandTool(enabled) {
    nidHandTool = enabled;
    $('#nidHandToolBtn').setAttribute('aria-pressed', String(enabled));
    $('#nidHandToolBtn').classList.toggle('active', enabled);
    $('#nidCanvasViewport').classList.toggle('is-hand', enabled || nidSpaceHeld);
  }

  function installNidViewport() {
    var viewport = $('#nidCanvasViewport');
    if (!viewport) return;
    var panDrag = null;
    function editingField(target) {
      return target instanceof Element && !!target.closest('input, textarea, select, [contenteditable="true"]');
    }
    function active() {
      return combineItems.length && !$('#img-pane-combine').hidden && !$('#imgCombineStage').hidden;
    }
    document.addEventListener('keydown', function (e) {
      if (!active() || editingField(e.target) || e.isComposing) return;
      var key = e.key.toLowerCase();
      var mod = e.ctrlKey || e.metaKey;
      if (mod && (key === '+' || key === '=' || key === '-')) {
        e.preventDefault();
        setNidCanvasZoom(nidCanvasZoom * (key === '-' ? 1 / 1.25 : 1.25));
      } else if (mod && (key === '0' || key === '1')) {
        e.preventDefault();
        if (key === '0') fitNidCanvas();
        else { nidPan = { x: 0, y: 0 }; setNidCanvasZoom(1); }
      } else if (mod && (key === 'z' || key === 'y')) {
        e.preventDefault();
        $(key === 'y' || e.shiftKey ? '#nidRedoBtn' : '#nidUndoBtn').click();
      } else if (!mod && !e.altKey && (key === 'h' || key === 'v')) {
        e.preventDefault();
        setNidHandTool(key === 'h');
      } else if (e.code === 'Space' && (viewport.contains(document.activeElement) || viewport.matches(':hover'))) {
        e.preventDefault();
        nidSpaceHeld = true;
        setNidHandTool(nidHandTool);
      }
    });
    document.addEventListener('keyup', function (e) {
      if (e.code === 'Space') { nidSpaceHeld = false; setNidHandTool(nidHandTool); }
    });
    window.addEventListener('blur', function () {
      nidSpaceHeld = false;
      panDrag = null;
      viewport.classList.remove('is-panning');
      setNidHandTool(nidHandTool);
    });
    viewport.addEventListener('wheel', function (e) {
      if (!active()) return;
      if (e.ctrlKey || e.metaKey || e.altKey) {
        e.preventDefault();
        var rect = viewport.getBoundingClientRect();
        var delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? viewport.clientHeight : 1);
        setNidCanvasZoom(nidCanvasZoom * Math.exp(-Math.max(-200, Math.min(200, delta)) * 0.002), {
          x: e.clientX - rect.left - rect.width / 2,
          y: e.clientY - rect.top - rect.height / 2
        });
      }
    }, { passive: false });
    // Capture before crop handles: hand panning must never change the crop polygon.
    viewport.addEventListener('pointerdown', function (e) {
      if (!active() || !(e.button === 1 || (e.button === 0 && (nidHandTool || nidSpaceHeld)))) return;
      e.preventDefault();
      e.stopPropagation();
      viewport.focus({ preventScroll: true });
      panDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, panX: nidPan.x, panY: nidPan.y };
      viewport.setPointerCapture(e.pointerId);
      viewport.classList.add('is-panning');
      nidFitMode = false;
    }, true);
    viewport.addEventListener('pointermove', function (e) {
      if (!panDrag || panDrag.id !== e.pointerId) return;
      e.preventDefault();
      nidPan.x = panDrag.panX + e.clientX - panDrag.x;
      nidPan.y = panDrag.panY + e.clientY - panDrag.y;
      syncNidViewport();
    });
    function stopPan(e) {
      if (!panDrag || panDrag.id !== e.pointerId) return;
      panDrag = null;
      viewport.classList.remove('is-panning');
      if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
    }
    viewport.addEventListener('pointerup', stopPan);
    viewport.addEventListener('pointercancel', stopPan);
    viewport.addEventListener('lostpointercapture', stopPan);
    new ResizeObserver(function () {
      if (nidFitMode) fitNidCanvas(); else syncNidViewport();
    }).observe(viewport);
  }

  function activateNidInspectorTab(tab) {
    var targetTab = tab || 'filters';
    $$('[data-nid-insp-tab]').forEach(function (b) {
      var active = b.getAttribute('data-nid-insp-tab') === targetTab;
      b.setAttribute('aria-selected', active ? 'true' : 'false');
      b.className = active
        ? 'px-2.5 py-1.5 rounded-t-md text-[11.5px] font-bold text-indigo-600 dark:text-indigo-300 bg-white dark:bg-studio-sidebar border-t-2 border-x border-t-indigo-500 border-x-slate-200 dark:border-x-studio-border -mb-px inline-flex items-center gap-1 cursor-pointer transition-colors'
        : 'px-2.5 py-1.5 rounded-t-md text-[11px] font-semibold text-slate-600 dark:text-studio-muted hover:text-slate-900 dark:hover:text-studio-text bg-transparent border-t-2 border-x border-transparent -mb-px inline-flex items-center gap-1 cursor-pointer transition-colors';
    });
    $$('[data-nid-insp-pane]').forEach(function (paneEl) {
      var isMatch = paneEl.getAttribute('data-nid-insp-pane') === targetTab;
      paneEl.hidden = !isMatch;
    });
    $$('[data-nid-mob-insp]').forEach(function (mobBtn) {
      var active = mobBtn.getAttribute('data-nid-mob-insp') === targetTab;
      mobBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    var targetBar = $('#nidColorTargetBar');
    if (targetBar) {
      targetBar.hidden = (targetTab === 'layout');
    }
  }

  function setNidMobileStep(step, inspTab) {
    var pane = $('#img-pane-combine');
    if (!pane) return;
    var isMob = window.innerWidth < 1024;
    var normStep = step === 'enhance' || step === 'pages' ? step : 'crop';
    pane.setAttribute('data-mobile-step', normStep);
    pane.setAttribute('data-mobile-view', normStep === 'enhance' ? 'inspect' : (normStep === 'pages' ? 'pages' : 'edit'));

    var pagesBtn = $('#nidMobPagesBtn');
    if (pagesBtn) {
      pagesBtn.setAttribute('aria-pressed', normStep === 'pages' ? 'true' : 'false');
    }
    var backTxt = $('#nidMobBackTxt');
    if (backTxt) {
      var isRootCrop = normStep === 'crop';
      backTxt.setAttribute('data-i18n-bn', isRootCrop ? 'নতুন' : 'ক্রপ');
      backTxt.setAttribute('data-i18n-en', isRootCrop ? 'New' : 'Crop');
      backTxt.textContent = isRootCrop ? tr('নতুন', 'New') : tr('ক্রপ', 'Crop');
    }

    if (isMob) {
      var targetView = normStep === 'enhance' ? 'preview' : 'crop';
      pane.setAttribute('data-view', targetView);
      $$('[data-nid-canvas-view]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-nid-canvas-view') === targetView ? 'true' : 'false');
      });
    } else if (normStep === 'crop' && (!pane.getAttribute('data-view') || pane.getAttribute('data-view') === 'crop')) {
      pane.setAttribute('data-view', 'split');
      $$('[data-nid-canvas-view]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-nid-canvas-view') === 'split' ? 'true' : 'false');
      });
    }

    if (inspTab) {
      activateNidInspectorTab(inspTab);
    }

    if (normStep === 'enhance') {
      renderCombineLivePreview();
    } else if (normStep === 'crop') {
      requestAnimationFrame(function () {
        if (nidFitMode) fitNidCanvas(); else syncNidViewport();
      });
    }
  }

  function switchNidView(view) {
    var normalized = view === 'images' || view === 'print' || view === 'inspect' ? 'enhance' : (view === 'pages' ? 'pages' : 'crop');
    setNidMobileStep(normalized);
  }

  function setNidExportReady(ready) {
    ['imgCombineDownloadBtn', 'imgCombineDownloadPdfBtn', 'imgCombinePrintBtn', 'nidMobPdfBtn', 'nidMobJpgBtn'].forEach(function (id) {
      var btn = $('#' + id);
      if (btn) btn.disabled = !ready;
    });
  }

  function updateNidSidebarThumbnails(previewCanvases) {
    if (!previewCanvases || !previewCanvases.length) return;
    previewCanvases.forEach(function (c, idx) {
      if (!c || !combineItems[idx]) return;
      try {
        var thumbUrl = c.toDataURL('image/jpeg', 0.72);
        combineItems[idx]._thumbUrl = thumbUrl;
        var imgEl = $('[data-nid-thumb-idx="' + idx + '"]');
        if (imgEl) imgEl.src = thumbUrl;
      } catch (_) {}
    });
  }

  function renderNidCardTabs() {
    var tabsEl = $('#nidCardTabs');
    var countEl = $('#nidCount');
    var mobCountEl = $('#nidMobCountBadge');
    var expCountEl = $('#nidExportCount');
    if (countEl) countEl.textContent = toBn(combineItems.length);
    if (mobCountEl) mobCountEl.textContent = toBn(combineItems.length);
    if (expCountEl) {
      expCountEl.textContent = toBn(combineItems.length) + tr('টি কার্ড', combineItems.length === 1 ? ' card' : ' cards');
    }

    // Update CamScanner Mobile Top Header Front / Back Switcher Pills
    var frontPill = $('#nidMobFrontPill');
    var backPill = $('#nidMobBackPill');
    var frontTxt = $('#nidMobFrontTxt');
    var backTxt = $('#nidMobBackSideTxt');
    var swapBtn = $('#nidMobSwapBtn');
    if (frontPill) {
      var isFrontAct = activeNidIdx === 0;
      frontPill.setAttribute('aria-selected', isFrontAct ? 'true' : 'false');
      frontPill.className = 'inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11.5px] font-bold transition-colors cursor-pointer shrink-0 ' +
        (isFrontAct ? 'bg-emerald-500 text-white shadow-xs' : 'bg-transparent text-slate-300 hover:text-white');
    }
    if (frontTxt) {
      frontTxt.textContent = tr('সামনে', 'Front') + (combineItems.length >= 1 ? ' ✓' : '');
    }
    if (backPill) {
      var hasBack = combineItems.length >= 2;
      var isBackAct = hasBack && activeNidIdx >= 1;
      backPill.setAttribute('aria-selected', isBackAct ? 'true' : 'false');
      backPill.className = 'inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11.5px] font-bold transition-colors cursor-pointer shrink-0 ' +
        (isBackAct
          ? 'bg-emerald-500 text-white shadow-xs'
          : (hasBack
              ? 'bg-transparent text-slate-300 hover:text-white'
              : 'bg-indigo-500/25 border border-dashed border-indigo-400/50 text-indigo-200 hover:bg-indigo-500/35'));
    }
    if (backTxt) {
      backTxt.textContent = combineItems.length >= 2
        ? (activeNidIdx > 1 ? (tr('কার্ড ', 'Card ') + toBn(activeNidIdx + 1) + ' ✓') : tr('পেছনে ✓', 'Back ✓'))
        : tr('+ পেছনে', '+ Back');
    }
    if (swapBtn) {
      swapBtn.disabled = combineItems.length < 2;
      swapBtn.style.opacity = combineItems.length < 2 ? '0.35' : '1';
    }

    if (!tabsEl) {
      syncNidAddLimitControls();
      return;
    }
    tabsEl.innerHTML = '';
    combineItems.forEach(function (entry, idx) {
      var label = idx === 0 ? tr('সামনের পৃষ্ঠা', 'Front Side') : (idx === 1 ? tr('পেছনের পৃষ্ঠা', 'Back Side') : tr('কার্ড ', 'Card ') + toBn(idx + 1));
      var badgeNum = toBn(idx + 1);
      var active = idx === activeNidIdx;
      var card = document.createElement('div');
      card.className = 'nid-card-tab ds-page shrink-0 w-full group relative flex flex-col gap-1.5 p-2 rounded-xl border text-left transition-all cursor-pointer ' +
        (active
          ? ' active is-active border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/15 ring-2 ring-indigo-500/25 shadow-xs'
          : ' border-slate-200 dark:border-studio-border bg-slate-50/80 dark:bg-studio-panel/60 hover:border-indigo-400');
      card.setAttribute('role', 'tab');
      card.setAttribute('aria-selected', active ? 'true' : 'false');

      var headRow = document.createElement('div');
      headRow.className = 'flex items-center justify-between gap-1 min-w-0';

      var titleWrap = document.createElement('div');
      titleWrap.className = 'inline-flex items-center gap-1.5 min-w-0';

      var numBadge = document.createElement('span');
      numBadge.className = 'inline-flex items-center justify-center w-4.5 h-4.5 rounded-full text-[10px] font-extrabold shrink-0 ' +
        (active ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-studio-surface text-slate-700 dark:text-studio-muted');
      numBadge.textContent = badgeNum;

      var titleEl = document.createElement('strong');
      titleEl.className = 'text-[11.5px] font-extrabold text-slate-900 dark:text-studio-text truncate';
      titleEl.textContent = label;

      titleWrap.appendChild(numBadge);
      titleWrap.appendChild(titleEl);

      var actions = document.createElement('div');
      actions.className = 'inline-flex items-center gap-0.5 shrink-0';
      var makeActBtn = function (svgHtml, titleTxt, onClick, isDanger) {
        var b = document.createElement('button');
        b.type = 'button';
        b.title = titleTxt;
        b.className = 'w-5 h-5 rounded-md grid place-items-center border border-slate-200/80 dark:border-studio-border bg-white/90 dark:bg-studio-surface text-slate-600 dark:text-studio-text cursor-pointer transition-colors ' +
          (isDanger ? 'hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 dark:hover:bg-rose-950/50' : 'hover:border-indigo-400 hover:text-indigo-600');
        b.innerHTML = svgHtml;
        b.addEventListener('click', function (ev) {
          ev.stopPropagation();
          onClick();
        });
        return b;
      };
      actions.appendChild(makeActBtn(
        '<svg class="w-3 h-3 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
        tr('এই পৃষ্ঠার ছবি বদলান', 'Replace This Side'),
        function () {
          var repIn = $(idx === 0 ? '#nidReplaceFrontInput' : '#nidReplaceBackInput');
          if (repIn) repIn.click();
        }
      ));
      if (combineItems.length > 1) {
        if (idx > 0) {
          actions.appendChild(makeActBtn(
            '<svg class="w-3 h-3 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><path d="m18 15-6-6-6 6"/></svg>',
            tr('উপরে নিন', 'Move Up'),
            function () {
              var tmp = combineItems[idx - 1];
              combineItems[idx - 1] = combineItems[idx];
              combineItems[idx] = tmp;
              activeNidIdx = idx - 1;
              renderNidCardTabs();
              drawNidCropSourceCanvas();
              renderCombineLivePreview();
            }
          ));
        }
        if (idx < combineItems.length - 1) {
          actions.appendChild(makeActBtn(
            '<svg class="w-3 h-3 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
            tr('নিচে নিন', 'Move Down'),
            function () {
              var tmp = combineItems[idx + 1];
              combineItems[idx + 1] = combineItems[idx];
              combineItems[idx] = tmp;
              activeNidIdx = idx + 1;
              renderNidCardTabs();
              drawNidCropSourceCanvas();
              renderCombineLivePreview();
            }
          ));
        }
      }
      actions.appendChild(makeActBtn(
        '<svg class="w-3 h-3 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m6 6 1 14h10l1-14"/></svg>',
        tr('মুছুন', 'Delete Side'),
        function () {
          if (combineItems.length <= 1) {
            var clr = $('#imgCombineClearBtn');
            if (clr) clr.click();
            return;
          }
          combineItems.splice(idx, 1);
          activeNidIdx = Math.max(0, Math.min(activeNidIdx, combineItems.length - 1));
          renderNidCardTabs();
          syncNidDeskewControl();
          syncNidColorControlsFromTarget();
          drawNidCropSourceCanvas();
          renderCombineLivePreview();
        },
        true
      ));

      headRow.appendChild(titleWrap);
      headRow.appendChild(actions);

      var thumbWrap = document.createElement('div');
      var isEntryPort = getNidCardOrient(entry) === 'portrait';
      thumbWrap.className = 'nid-card-tab__thumb-wrap w-full ' + (isEntryPort ? 'aspect-[1.2/1] min-h-[124px]' : 'aspect-[1.586/1] min-h-[104px]') + ' shrink-0 rounded-lg overflow-hidden bg-white dark:bg-studio-bg border border-slate-200/90 dark:border-studio-border relative grid place-items-center p-1 shadow-2xs';
      var thumbImg = document.createElement('img');
      thumbImg.alt = label;
      thumbImg.setAttribute('data-nid-thumb-idx', String(idx));
      thumbImg.className = 'nid-card-tab__thumb w-full h-full object-contain rounded-[4px]';
      thumbImg.src = entry._thumbUrl || (entry.item && entry.item.url) || '';
      thumbWrap.appendChild(thumbImg);

      card.appendChild(headRow);
      card.appendChild(thumbWrap);

      card.addEventListener('click', function () {
        var pane = $('#img-pane-combine');
        var wasPreview = pane && pane.getAttribute('data-view') === 'preview';
        if (wasPreview) {
          var restoreView = window.innerWidth < 768 ? 'crop' : 'split';
          pane.setAttribute('data-view', restoreView);
          $$('[data-nid-canvas-view]').forEach(function (b) {
            b.setAttribute('aria-pressed', b.getAttribute('data-nid-canvas-view') === restoreView ? 'true' : 'false');
          });
        }
        if (window.innerWidth < 1024) {
          switchNidView('edit');
        }
        if (activeNidIdx === idx && !wasPreview) return;
        activeNidIdx = idx;
        if (nidColorTarget !== 'all' && idx < 2) {
          nidColorTarget = String(idx);
        }
        syncNidOrientButtons();
        renderNidCardTabs();
        syncNidDeskewControl();
        syncNidColorControlsFromTarget();
        drawNidCropSourceCanvas();
      });
      tabsEl.appendChild(card);
      if (active && typeof card.scrollIntoView === 'function') {
        requestAnimationFrame(function () {
          try { card.scrollIntoView({ block: 'nearest' }); } catch (_) {}
        });
      }
    });

    if (combineItems.length < MAX_NID_SIDES) {
      var addBackBtn = document.createElement('button');
      addBackBtn.type = 'button';
      addBackBtn.className = 'nid-card-tab nid-card-tab--add shrink-0 w-full aspect-[1.586/1] min-h-[112px] p-2.5 rounded-xl border-2 border-dashed border-indigo-400/60 dark:border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition';
      addBackBtn.innerHTML =
        '<svg class="w-5 h-5 stroke-current stroke-2 fill-none opacity-85" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M12 9v6M9 12h6"/></svg>' +
        '<span>' + tr('+ পেছনের পৃষ্ঠা যোগ করুন', '+ Add Back Side') + '</span>';
      addBackBtn.addEventListener('click', function () {
        var inp = $('#nidReplaceBackInput') || $('#nidBackInput');
        if (inp) inp.click();
      });
      tabsEl.appendChild(addBackBtn);
    }
    syncNidOrientButtons();
    syncNidAddLimitControls();
    updateNidRightPanelBadges();
  }

  function drawNidCropSourceCanvas() {
    var entry = combineItems[activeNidIdx];
    var canvas = $('#nidCropSourceCanvas');
    if (!entry || !canvas) return;
    var it = entry.item;
    var rot = ((entry.rot % 360) + 360) % 360;
    var swapped = rot === 90 || rot === 270;
    var srcW = swapped ? it.height : it.width;
    var srcH = swapped ? it.width : it.height;

    var maxStage = 1600;
    var scale = Math.min(1, maxStage / Math.max(srcW, srcH));
    var cw = Math.max(120, Math.round(srcW * scale));
    var ch = Math.max(120, Math.round(srcH * scale));

    canvas.width = cw;
    canvas.height = ch;
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    if (entry.flipH === -1) ctx.scale(-1, 1);
    ctx.rotate((rot * Math.PI) / 180);
    var drawW = swapped ? ch : cw;
    var drawH = swapped ? cw : ch;
    ctx.drawImage(it.img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    entry.cw = cw;
    entry.ch = ch;
    entry.viewWidth = srcW;
    entry.viewHeight = srcH;
    positionNidQuadDOM();
    fitNidCanvas();
    // Warm up the magnetic snap field in idle time so the first handle drag is instant
    setTimeout(function () {
      if (combineItems[activeNidIdx] === entry && !nidCropDragActive) ensureEntrySnapField(entry);
    }, 80);
  }

  /**
   * CamScanner ImageCanvas (`R_`, `Xhe`, `Qhe`) Convex Quad & Minimum Edge Validator.
   * Ensures all 4 corners stay within [0,1], every edge meets minimum pixel length,
   * and all 4 cross-products share the same winding sign (strictly convex, non-self-intersecting).
   */
  function isValidConvexQuad(pts, cw, ch) {
    if (!pts || pts.length !== 4) return false;
    var w = Math.max(100, cw || 300);
    var h = Math.max(100, ch || 220);
    var minEdgePx = 28;
    var hasPos = false;
    var hasNeg = false;
    for (var i = 0; i < 4; i++) {
      var p0 = pts[i];
      if (p0.x < -1e-4 || p0.x > 1.0001 || p0.y < -1e-4 || p0.y > 1.0001) return false;
      var p1 = pts[(i + 1) % 4];
      var p2 = pts[(i + 2) % 4];
      var dx1 = (p1.x - p0.x) * w;
      var dy1 = (p1.y - p0.y) * h;
      if (Math.hypot(dx1, dy1) < minEdgePx) return false;
      var dx2 = (p2.x - p1.x) * w;
      var dy2 = (p2.y - p1.y) * h;
      var cross = dx1 * dy2 - dy1 * dx2;
      if (Math.abs(cross) < 12) return false;
      if (cross > 0) hasPos = true;
      else hasNeg = true;
    }
    return hasPos !== hasNeg;
  }

  var nidSpringAnimRaf = 0;
  function cancelNidQuadSpringBack() {
    if (nidSpringAnimRaf) {
      cancelAnimationFrame(nidSpringAnimRaf);
      nidSpringAnimRaf = 0;
    }
  }

  /**
   * CamScanner `Yhe` 200ms damped cosine spring-back animation when releasing an invalid twisted quad.
   */
  function animateInvalidQuadSpringBack(fromPts, toPts, onFrame) {
    cancelNidQuadSpringBack();
    var startPts = cloneQuadPts(fromPts);
    var endPts = cloneQuadPts(toPts);
    var t0 = performance.now();
    var step = function (now) {
      var l = Math.min(1, (now - t0) / 210);
      var ease = 1 - Math.pow(1 - l, 3) * Math.cos(l * Math.PI * 0.8);
      var cur = startPts.map(function (p, idx) {
        return {
          x: p.x + (endPts[idx].x - p.x) * ease,
          y: p.y + (endPts[idx].y - p.y) * ease
        };
      });
      onFrame(cur, l >= 1);
      if (l < 1) {
        nidSpringAnimRaf = requestAnimationFrame(step);
      } else {
        nidSpringAnimRaf = 0;
      }
    };
    nidSpringAnimRaf = requestAnimationFrame(step);
  }

  function positionNidQuadDOM(snapInfo) {
    var entry = combineItems[activeNidIdx];
    var svg = $('#nidQuadSvg');
    if (!entry || !svg) return;
    var cw = entry.cw || 300;
    var ch = entry.ch || 220;
    var pts = entry.pts || defaultQuadPts(0.04);
    var isInvalid = !!(snapInfo && snapInfo.invalid);

    svg.setAttribute('viewBox', '0 0 ' + cw + ' ' + ch);
    var maskBg = $('#nidQuadMaskBg');
    var dimRect = $('#nidQuadDimRect');
    if (maskBg) { maskBg.setAttribute('width', cw); maskBg.setAttribute('height', ch); }
    if (dimRect) { dimRect.setAttribute('width', cw); dimRect.setAttribute('height', ch); }

    var pxPts = pts.map(function (pt) {
      return { x: pt.x * cw, y: pt.y * ch };
    });
    var polyStr = pxPts.map(function (p) {
      return p.x.toFixed(1) + ',' + p.y.toFixed(1);
    }).join(' ');

    var hole = $('#nidQuadHole');
    var poly = $('#nidQuadPoly');
    if (hole) hole.setAttribute('points', polyStr);
    if (poly) {
      poly.setAttribute('points', polyStr);
      poly.classList.toggle('is-snapped', !!(snapInfo && snapInfo.snapped) && !isInvalid);
      poly.classList.toggle('is-invalid', isInvalid);
    }

    // Update magnetic alignment guide lines
    var gH = $('#nidSnapGuideH');
    var gV = $('#nidSnapGuideV');
    if (gH) {
      if (snapInfo && typeof snapInfo.guideH === 'number' && !isInvalid) {
        gH.setAttribute('x1', '0');
        gH.setAttribute('y1', snapInfo.guideH.toFixed(1));
        gH.setAttribute('x2', String(cw));
        gH.setAttribute('y2', snapInfo.guideH.toFixed(1));
        gH.hidden = false;
      } else {
        gH.hidden = true;
      }
    }
    if (gV) {
      if (snapInfo && typeof snapInfo.guideV === 'number' && !isInvalid) {
        gV.setAttribute('x1', snapInfo.guideV.toFixed(1));
        gV.setAttribute('y1', '0');
        gV.setAttribute('x2', snapInfo.guideV.toFixed(1));
        gV.setAttribute('y2', String(ch));
        gV.hidden = false;
      } else {
        gV.hidden = true;
      }
    }

    // Update perspective 3x3 internal grid lines
    var lerpPt = function (a, b, t) {
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    };
    var setLine = function (id, pA, pB) {
      var el = $('#' + id);
      if (!el) return;
      el.setAttribute('x1', pA.x.toFixed(1));
      el.setAttribute('y1', pA.y.toFixed(1));
      el.setAttribute('x2', pB.x.toFixed(1));
      el.setAttribute('y2', pB.y.toFixed(1));
    };
    setLine('nidGridH1', lerpPt(pxPts[0], pxPts[3], 1 / 3), lerpPt(pxPts[1], pxPts[2], 1 / 3));
    setLine('nidGridH2', lerpPt(pxPts[0], pxPts[3], 2 / 3), lerpPt(pxPts[1], pxPts[2], 2 / 3));
    setLine('nidGridV1', lerpPt(pxPts[0], pxPts[1], 1 / 3), lerpPt(pxPts[3], pxPts[2], 1 / 3));
    setLine('nidGridV2', lerpPt(pxPts[0], pxPts[1], 2 / 3), lerpPt(pxPts[3], pxPts[2], 2 / 3));

    // Position 4 corner handles with CamScanner directional cursors
    for (var i = 0; i < 4; i++) {
      var hEl = $('#nidQuadHandles [data-pt="' + i + '"]');
      if (hEl) {
        hEl.style.left = (pts[i].x * 100) + '%';
        hEl.style.top = (pts[i].y * 100) + '%';
        hEl.style.cursor = (i % 2 === 0) ? 'nwse-resize' : 'nesw-resize';
        hEl.classList.toggle('is-invalid', isInvalid);
      }
    }
    // Position 4 edge midpoint pill handles rotated to match edge angle (CamScanner `rectMiddlePoints`)
    for (var eIdx = 0; eIdx < 4; eIdx++) {
      var nextIdx = (eIdx + 1) % 4;
      var eEl = $('#nidQuadHandles [data-edge="' + eIdx + '"]');
      if (eEl) {
        var mx = (pts[eIdx].x + pts[nextIdx].x) * 50;
        var my = (pts[eIdx].y + pts[nextIdx].y) * 50;
        var edx = (pts[nextIdx].x - pts[eIdx].x) * cw;
        var edy = (pts[nextIdx].y - pts[eIdx].y) * ch;
        var edgeDeg = Math.atan2(edy, edx) * (180 / Math.PI);
        eEl.style.left = mx + '%';
        eEl.style.top = my + '%';
        eEl.style.setProperty('--edge-deg', edgeDeg.toFixed(1) + 'deg');
        eEl.style.cursor = (eIdx % 2 === 0) ? 'ns-resize' : 'ew-resize';
        eEl.classList.toggle('is-invalid', isInvalid);
      }
    }
  }

  /**
   * Wide-Context 2.15× / 3.5× Vector Magnifier Loupe with Rounded-Card H/V Tangent Guides (`┏`):
   * - Large 192×192px (220×220 internal retina canvas) viewport showing ~102px of card context around the corner
   *   so both the rounded corner arc AND the straight horizontal & vertical card edges are clearly visible
   * - Draws H/V tangent extension rays and straight-edge lock rails (`24px..96px` past the rounded corner curve)
   * - Draws a hollow bullseye precision reticle so the exact corner intersection is unobstructed
   * - Dynamically avoids clipping against canvas viewport edges
   */
  function updateNidLoupe(normX, normY, isSnapped, opts) {
    var loupe = $('#nidCropLoupe');
    var srcCanvas = $('#nidCropSourceCanvas');
    var entry = combineItems[activeNidIdx];
    if (!loupe || !srcCanvas) return;
    if (window._nidEnableLoupe === false) {
      loupe.hidden = true;
      return;
    }
    loupe.hidden = false;
    var cw = srcCanvas.width || 300;
    var ch = srcCanvas.height || 220;
    var lw = loupe.width;
    var lh = loupe.height;
    var lctx = loupe.getContext('2d');

    var isFine = !!(opts && opts.fine);
    var isInvalid = !!(opts && opts.invalid);
    var cornerIdx = (opts && typeof opts.cornerIdx === 'number') ? opts.cornerIdx : -1;
    var snapH = !!(opts && opts.snapH);
    var snapV = !!(opts && opts.snapV);
    var zoom = isFine ? 3.6 : 2.35;
    var px = normX * cw;
    var py = normY * ch;
    var sampleW = lw / zoom;
    var sampleH = lh / zoom;

    lctx.clearRect(0, 0, lw, lh);
    lctx.fillStyle = '#0f172a';
    lctx.fillRect(0, 0, lw, lh);
    lctx.imageSmoothingEnabled = true;
    lctx.imageSmoothingQuality = 'high';
    lctx.drawImage(
      srcCanvas,
      px - sampleW / 2,
      py - sampleH / 2,
      sampleW,
      sampleH,
      0,
      0,
      lw,
      lh
    );

    var accentColor = isInvalid ? '#ff4d4f' : (isSnapped ? '#06b6d4' : '#10b981');
    var cx = lw / 2;
    var cy = lh / 2;

    // Draw dimmed outside mask + real-time perspective polygon vectors + H/V Tangent Rails inside the loupe
    if (entry && entry.pts && entry.pts.length === 4) {
      var lPts = entry.pts.map(function (pt) {
        return {
          x: cx + (pt.x - normX) * cw * zoom,
          y: cy + (pt.y - normY) * ch * zoom
        };
      });

      // Even-odd fill to dim area outside the card quad inside the loupe
      lctx.save();
      lctx.beginPath();
      lctx.rect(0, 0, lw, lh);
      lctx.moveTo(lPts[0].x, lPts[0].y);
      lctx.lineTo(lPts[1].x, lPts[1].y);
      lctx.lineTo(lPts[2].x, lPts[2].y);
      lctx.lineTo(lPts[3].x, lPts[3].y);
      lctx.closePath();
      lctx.fillStyle = 'rgba(9, 13, 22, 0.34)';
      lctx.fill('evenodd');

      // Draw crisp perspective border vectors
      lctx.beginPath();
      lctx.moveTo(lPts[0].x, lPts[0].y);
      lctx.lineTo(lPts[1].x, lPts[1].y);
      lctx.lineTo(lPts[2].x, lPts[2].y);
      lctx.lineTo(lPts[3].x, lPts[3].y);
      lctx.closePath();
      lctx.strokeStyle = accentColor;
      lctx.lineWidth = 2.4;
      if (isInvalid) lctx.setLineDash([5, 4]);
      lctx.stroke();

      // If inspecting/dragging a corner (`cornerIdx` 0..3), highlight the Horizontal & Vertical Straight-Edge Tangent Rails (`┏`)
      if (cornerIdx >= 0 && cornerIdx < 4 && !isInvalid) {
        var cPt = lPts[cornerIdx];
        var hPt = lPts[cornerIdx ^ 1];
        var vPt = lPts[3 - cornerIdx];

        var drawTangentRail = function (targetPt, isAxisSnapped) {
          var dx = targetPt.x - cPt.x;
          var dy = targetPt.y - cPt.y;
          var len = Math.hypot(dx, dy);
          if (len < 16) return;
          var ux = dx / len, uy = dy / len;
          var nx = -uy, ny = ux;

          // 1. Dashed outer extension past the corner vertex so the 90° virtual tangent vertex is clear
          lctx.save();
          lctx.beginPath();
          lctx.setLineDash([3, 3]);
          lctx.strokeStyle = isAxisSnapped ? 'rgba(6, 182, 212, 0.9)' : 'rgba(251, 191, 36, 0.78)';
          lctx.lineWidth = 1.6;
          lctx.moveTo(cPt.x - ux * 28, cPt.y - uy * 28);
          lctx.lineTo(cPt.x, cPt.y);
          lctx.stroke();

          // 2. Highlighted Straight-Edge Tangent Lock Rail beyond the rounded corner zone (`24px .. 98px` from corner)
          var rStart = Math.min(len * 0.4, 24);
          var rEnd = Math.min(len * 0.85, 98);
          if (rEnd > rStart + 8) {
            lctx.setLineDash([]);
            lctx.strokeStyle = isAxisSnapped ? '#22d3ee' : '#fbbf24';
            lctx.lineWidth = 2.8;
            lctx.beginPath();
            lctx.moveTo(cPt.x + ux * rStart, cPt.y + uy * rStart);
            lctx.lineTo(cPt.x + ux * rEnd, cPt.y + uy * rEnd);
            // Alignment tick marks at start and mid of straight-edge tangent zone
            var t1x = cPt.x + ux * rStart, t1y = cPt.y + uy * rStart;
            var t2x = cPt.x + ux * ((rStart + rEnd) * 0.5), t2y = cPt.y + uy * ((rStart + rEnd) * 0.5);
            lctx.moveTo(t1x - nx * 4.5, t1y - ny * 4.5);
            lctx.lineTo(t1x + nx * 4.5, t1y + ny * 4.5);
            lctx.moveTo(t2x - nx * 4.5, t2y - ny * 4.5);
            lctx.lineTo(t2x + nx * 4.5, t2y + ny * 4.5);
            lctx.stroke();
          }
          lctx.restore();
        };

        drawTangentRail(hPt, snapH);
        drawTangentRail(vPt, snapV);
      }
      lctx.restore();
    }

    // Hollow Bullseye Precision Reticle (leaves exact center pixel 100% clear)
    var ringR = 6.5;
    lctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    lctx.lineWidth = 1.25;
    lctx.beginPath();
    lctx.moveTo(cx, 26);
    lctx.lineTo(cx, cy - ringR - 3);
    lctx.moveTo(cx, cy + ringR + 3);
    lctx.lineTo(cx, lh - 30);
    lctx.moveTo(18, cy);
    lctx.lineTo(cx - ringR - 3, cy);
    lctx.moveTo(cx + ringR + 3, cy);
    lctx.lineTo(lw - 18, cy);
    lctx.stroke();

    lctx.strokeStyle = accentColor;
    lctx.lineWidth = isSnapped ? 2.5 : 2.0;
    lctx.beginPath();
    lctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    lctx.stroke();

    // Top Zoom HUD badge
    var hudTxt = isFine ? tr('3.6× ফাইন জুম', '3.6× Fine Zoom') : tr('2.4× এজ জুম', '2.4× Edge Zoom');
    lctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
    lctx.beginPath();
    lctx.roundRect ? lctx.roundRect(cx - 48, 8, 96, 18, 9) : lctx.rect(cx - 48, 8, 96, 18);
    lctx.fill();
    lctx.fillStyle = '#e2e8f0';
    lctx.font = 'bold 11px sans-serif';
    lctx.textAlign = 'center';
    lctx.fillText(hudTxt, cx, 20.5);

    // Bottom status badge (H/V Tangent Snap or Invalid warning)
    if (isInvalid) {
      lctx.fillStyle = 'rgba(255, 77, 79, 0.94)';
      lctx.beginPath();
      lctx.roundRect ? lctx.roundRect(cx - 48, lh - 28, 96, 20, 10) : lctx.rect(cx - 48, lh - 28, 96, 20);
      lctx.fill();
      lctx.fillStyle = '#ffffff';
      lctx.font = 'bold 11px sans-serif';
      lctx.fillText(tr('⚠ বর্ডার ভাঁজ', '⚠ Crossed'), cx, lh - 14.5);
    } else if (isSnapped) {
      var snapLbl = (snapH && snapV)
        ? tr('✦ H+V স্ন্যাপ', '✦ H+V Snap')
        : (snapH ? tr('✦ H-লাইন স্ন্যাপ', '✦ H-Line Snap') : (snapV ? tr('✦ V-লাইন স্ন্যাপ', '✦ V-Line Snap') : tr('✦ বর্ডার স্ন্যাপ', '✦ Edge Snap')));
      lctx.fillStyle = 'rgba(6, 182, 212, 0.94)';
      lctx.beginPath();
      lctx.roundRect ? lctx.roundRect(cx - 54, lh - 28, 108, 20, 10) : lctx.rect(cx - 54, lh - 28, 108, 20);
      lctx.fill();
      lctx.fillStyle = '#ffffff';
      lctx.font = 'bold 11px sans-serif';
      lctx.fillText(snapLbl, cx, lh - 14.5);
    }

    var posX = (opts && typeof opts.cursorX === 'number') ? opts.cursorX : normX;
    var posY = (opts && typeof opts.cursorY === 'number') ? opts.cursorY : normY;

    loupe.style.borderColor = accentColor;

    // Viewport-Aware Placement: keeps the 176px loupe 100% inside `#nidCanvasViewport` at ANY zoom level (e.g. 13%..400%)
    var viewport = $('#nidCanvasViewport');
    var wrapEl = $('#nidCropInteractiveWrap');
    var vpRect = viewport && viewport.getBoundingClientRect ? viewport.getBoundingClientRect() : null;
    var wrapRect = wrapEl && wrapEl.getBoundingClientRect ? wrapEl.getBoundingClientRect() : null;
    if (vpRect && wrapRect && vpRect.width > 40 && wrapRect.width > 20) {
      var hx = (wrapRect.left - vpRect.left) + posX * wrapRect.width;
      var hy = (wrapRect.top - vpRect.top) + posY * wrapRect.height;
      var L = loupe.offsetWidth || 176;
      var leftPx = Math.max(8, Math.min(vpRect.width - L - 8, hx - L * 0.5));
      var topAbove = hy - L - 24;
      var topBelow = hy + 24;
      if (typeof loupe._flipBelow !== 'boolean') {
        loupe._flipBelow = topAbove < 8;
      } else if (loupe._flipBelow && topAbove >= 22) {
        loupe._flipBelow = false;
      } else if (!loupe._flipBelow && topAbove < 6) {
        loupe._flipBelow = true;
      }
      var topPx = loupe._flipBelow ? Math.min(vpRect.height - L - 8, topBelow) : Math.max(8, topAbove);
      if (Math.abs((topPx + L * 0.5) - hy) < L * 0.42) {
        leftPx = hx > vpRect.width * 0.5 ? 10 : Math.max(10, vpRect.width - L - 10);
        topPx = Math.max(8, Math.min(vpRect.height - L - 8, hy - L * 0.5));
      }
      loupe.style.left = Math.round(leftPx) + 'px';
      loupe.style.top = Math.round(topPx) + 'px';
      loupe.style.transform = 'none';
    } else {
      loupe.style.left = (posX * 100).toFixed(2) + '%';
      loupe.style.top = (posY * 100).toFixed(2) + '%';
      var txPct = -50;
      if (posX < 0.24) txPct = -6 - (posX / 0.24) * 44;
      else if (posX > 0.76) txPct = -50 - ((posX - 0.76) / 0.24) * 44;
      var tyPct = posY < 0.22 ? 18 : -118;
      loupe.style.transform = 'translate(' + txPct.toFixed(1) + '%, ' + tyPct + '%)';
    }
  }

  function hideNidLoupe() {
    var loupe = $('#nidCropLoupe');
    if (loupe) {
      loupe.hidden = true;
      loupe._flipBelow = undefined;
    }
    var poly = $('#nidQuadPoly');
    if (poly) poly.classList.remove('is-snapped', 'is-invalid');
    var gH = $('#nidSnapGuideH');
    var gV = $('#nidSnapGuideV');
    if (gH) gH.hidden = true;
    if (gV) gV.hidden = true;
    $$('#nidQuadHandles .nid-quad-handle').forEach(function (el) {
      el.classList.remove('active', 'is-snapped', 'is-invalid');
    });
  }

  function installNidCropInteraction() {
    var wrapEl = $('#nidCropInteractiveWrap');
    if (!wrapEl) return;

    var drag = null;

    // Hover preview on corner/edge handles so user can inspect alignment before dragging
    $$('#nidQuadHandles .nid-quad-handle').forEach(function (hBtn) {
      hBtn.addEventListener('pointerenter', function (e) {
        if (drag || nidHandTool || nidSpaceHeld) return;
        var entry = combineItems[activeNidIdx];
        if (!entry || !entry.pts) return;
        var ptAttr = hBtn.getAttribute('data-pt');
        var edgeAttr = hBtn.getAttribute('data-edge');
        if (ptAttr !== null) {
          var ci = parseInt(ptAttr, 10);
          updateNidLoupe(entry.pts[ci].x, entry.pts[ci].y, false, { fine: e.shiftKey, cornerIdx: ci });
        } else if (edgeAttr !== null) {
          var ei = parseInt(edgeAttr, 10);
          var ni = (ei + 1) % 4;
          updateNidLoupe((entry.pts[ei].x + entry.pts[ni].x) * 0.5, (entry.pts[ei].y + entry.pts[ni].y) * 0.5, false, { fine: e.shiftKey, cornerIdx: -1 });
        }
      });
      hBtn.addEventListener('pointerleave', function () {
        if (!drag) hideNidLoupe();
      });
    });

    wrapEl.addEventListener('pointerdown', function (e) {
      var entry = combineItems[activeNidIdx];
      if (e.button !== 0 || !entry) return;
      cancelNidQuadSpringBack();
      e.preventDefault();
      wrapEl.focus();

      var ptAttr = e.target.getAttribute('data-pt');
      var edgeAttr = e.target.getAttribute('data-edge');
      var mode = 'move';
      var idx = -1;

      if (ptAttr !== null) {
        mode = 'corner';
        idx = parseInt(ptAttr, 10);
        e.target.classList.add('active');
      } else if (edgeAttr !== null) {
        mode = 'edge';
        idx = parseInt(edgeAttr, 10);
        e.target.classList.add('active');
      }

      var rect = wrapEl.getBoundingClientRect();
      pushNidHistory();
      // Pre-build the magnetic snap field before the first move so dragging never hitches
      if (nidMagSnapEnabled && mode !== 'move') ensureEntrySnapField(entry);
      nidCropDragActive = true;
      drag = {
        mode: mode,
        idx: idx,
        targetEl: e.target,
        lastClientX: e.clientX,
        lastClientY: e.clientY,
        accDx: 0,
        accDy: 0,
        rw: rect.width || 1,
        rh: rect.height || 1,
        origPts: cloneQuadPts(entry.pts),
        snapLock: null,
        edgeLock: null,
        shift: e.shiftKey,
        alt: e.altKey,
        rafId: 0,
        previewTimer: 0,
        lastPreviewT: 0,
        isInvalid: false
      };

      wrapEl.setPointerCapture(e.pointerId);
      wrapEl.classList.add('dragging');

      if (mode === 'corner') {
        updateNidLoupe(entry.pts[idx].x, entry.pts[idx].y, false, { fine: e.shiftKey, cornerIdx: idx, cursorX: entry.pts[idx].x, cursorY: entry.pts[idx].y });
      } else if (mode === 'edge') {
        var nIdx = (idx + 1) % 4;
        var emx = (entry.pts[idx].x + entry.pts[nIdx].x) * 0.5;
        var emy = (entry.pts[idx].y + entry.pts[nIdx].y) * 0.5;
        updateNidLoupe(emx, emy, false, { fine: e.shiftKey, cornerIdx: -1, cursorX: emx, cursorY: emy });
      }
    });

    /**
     * Throttled live A4 preview while dragging (max ~16 fps) so the heavy card processing never
     * blocks pointer events — the crop polygon & loupe stay at full 60 fps.
     */
    function scheduleNidDragPreview(dd) {
      if (dd.previewTimer) return;
      var wait = Math.max(0, 64 - (performance.now() - dd.lastPreviewT));
      dd.previewTimer = setTimeout(function () {
        dd.previewTimer = 0;
        dd.lastPreviewT = performance.now();
        if (drag === dd && !dd.isInvalid) renderCombineLivePreview();
      }, wait);
    }

    /**
     * Converts a constant on-screen capture distance (px) into snap-field pixels, so the magnet
     * feels identical on small crops, huge camera pages, and any zoom level.
     */
    function nidSnapRadiusFor(entry, dd, screenPx) {
      var sf = entry.snapField;
      if (!sf) return 10;
      var fieldPerScreen = sf.cw / Math.max(1, dd.rw);
      return Math.max(4, Math.min(30, Math.round(screenPx * fieldPerScreen)));
    }

    function processNidDragFrame(dd) {
      var entry = combineItems[activeNidIdx];
      if (!entry || drag !== dd) return;
      var dx = dd.accDx;
      var dy = dd.accDy;
      var pts = cloneQuadPts(dd.origPts);
      var snapInfo = null;
      var useSnap = nidMagSnapEnabled && !dd.alt;
      var screenCapture = dd.shift ? 9 : 16;

      if (dd.mode === 'corner') {
        var ci = dd.idx;
        var rawX = Math.max(0, Math.min(1, pts[ci].x + dx));
        var rawY = Math.max(0, Math.min(1, pts[ci].y + dy));
        if (useSnap) {
          var sRes = snapCornerMagnetically(entry, pts, ci, rawX, rawY, nidSnapRadiusFor(entry, dd, screenCapture), dd.snapLock);
          pts[ci].x = sRes.x;
          pts[ci].y = sRes.y;
          dd.snapLock = sRes.lock;
          snapInfo = sRes;
          if (dd.targetEl) dd.targetEl.classList.toggle('is-snapped', sRes.snapped);
        } else {
          dd.snapLock = null;
          pts[ci].x = rawX;
          pts[ci].y = rawY;
        }
        var validCorner = isValidConvexQuad(pts, entry.cw, entry.ch);
        dd.isInvalid = !validCorner;
        if (!snapInfo) snapInfo = {};
        snapInfo.invalid = !validCorner;
        updateNidLoupe(pts[ci].x, pts[ci].y, !!snapInfo.snapped, {
          fine: dd.shift,
          invalid: !validCorner,
          cornerIdx: ci,
          snapH: !!snapInfo.snapH,
          snapV: !!snapInfo.snapV,
          cursorX: rawX,
          cursorY: rawY
        });
      } else if (dd.mode === 'edge') {
        var i1 = dd.idx;
        var i2 = (i1 + 1) % 4;
        var p1 = { x: Math.max(0, Math.min(1, pts[i1].x + dx)), y: Math.max(0, Math.min(1, pts[i1].y + dy)) };
        var p2 = { x: Math.max(0, Math.min(1, pts[i2].x + dx)), y: Math.max(0, Math.min(1, pts[i2].y + dy)) };
        var rawEdgeX = (p1.x + p2.x) * 0.5;
        var rawEdgeY = (p1.y + p2.y) * 0.5;
        if (useSnap) {
          var er = nidSnapRadiusFor(entry, dd, screenCapture);
          var eRes = snapEdgeMagnetically(entry, p1, p2, er, er, dd.edgeLock);
          pts[i1] = eRes.p1;
          pts[i2] = eRes.p2;
          dd.edgeLock = eRes.lock;
          snapInfo = { snapped: eRes.snapped };
          if (dd.targetEl) dd.targetEl.classList.toggle('is-snapped', eRes.snapped);
        } else {
          dd.edgeLock = null;
          pts[i1] = p1;
          pts[i2] = p2;
        }
        var validEdge = isValidConvexQuad(pts, entry.cw, entry.ch);
        dd.isInvalid = !validEdge;
        if (!snapInfo) snapInfo = {};
        snapInfo.invalid = !validEdge;
        updateNidLoupe((pts[i1].x + pts[i2].x) * 0.5, (pts[i1].y + pts[i2].y) * 0.5, !!snapInfo.snapped, {
          fine: dd.shift,
          invalid: !validEdge,
          cursorX: rawEdgeX,
          cursorY: rawEdgeY
        });
      } else {
        // Move entire 4-corner polygon within bounds
        var minX = Math.min(pts[0].x, pts[1].x, pts[2].x, pts[3].x);
        var maxX = Math.max(pts[0].x, pts[1].x, pts[2].x, pts[3].x);
        var minY = Math.min(pts[0].y, pts[1].y, pts[2].y, pts[3].y);
        var maxY = Math.max(pts[0].y, pts[1].y, pts[2].y, pts[3].y);
        var clampedDx = Math.max(-minX, Math.min(1 - maxX, dx));
        var clampedDy = Math.max(-minY, Math.min(1 - maxY, dy));
        for (var k = 0; k < 4; k++) {
          pts[k].x += clampedDx;
          pts[k].y += clampedDy;
        }
        dd.isInvalid = false;
      }

      entry.pts = pts;
      entry.autoDetected = false;
      positionNidQuadDOM(snapInfo);
      if (!dd.isInvalid) scheduleNidDragPreview(dd);
    }

    wrapEl.addEventListener('pointermove', function (e) {
      if (!drag || !wrapEl.hasPointerCapture(e.pointerId)) return;
      var speedScale = e.shiftKey ? 0.28 : 1.0;
      drag.accDx += ((e.clientX - drag.lastClientX) / drag.rw) * speedScale;
      drag.accDy += ((e.clientY - drag.lastClientY) / drag.rh) * speedScale;
      drag.lastClientX = e.clientX;
      drag.lastClientY = e.clientY;
      drag.shift = e.shiftKey;
      drag.alt = e.altKey;
      // Coalesce all pointer events of one display frame into a single snap + DOM update
      if (!drag.rafId) {
        var dd = drag;
        dd.rafId = requestAnimationFrame(function () {
          dd.rafId = 0;
          processNidDragFrame(dd);
        });
      }
    });

    wrapEl.addEventListener('lostpointercapture', function () {
      wrapEl.classList.remove('dragging');
      if (drag) {
        if (drag.rafId) {
          cancelAnimationFrame(drag.rafId);
          drag.rafId = 0;
          processNidDragFrame(drag);
        }
        if (drag.previewTimer) {
          clearTimeout(drag.previewTimer);
          drag.previewTimer = 0;
        }
      }
      nidCropDragActive = false;
      hideNidLoupe();
      if (!drag) return;
      var entry = combineItems[activeNidIdx];
      var finishedDrag = drag;
      drag = null;
      if (entry && finishedDrag.isInvalid) {
        showToast(tr('বর্ডার রেখা ক্রস করা যাবে না — আগের অবস্থানে ফেরানো হয়েছে', 'Border lines cannot intersect — reverted to previous shape'));
        animateInvalidQuadSpringBack(entry.pts, finishedDrag.origPts, function (animPts, done) {
          entry.pts = animPts;
          positionNidQuadDOM();
          if (done) scheduleCombineLiveRender();
        });
        return;
      }
      scheduleCombineLiveRender();
    });

    wrapEl.addEventListener('keydown', function (e) {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      var step = e.shiftKey ? 0.03 : 0.01;
      var dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else return;
      e.preventDefault();
      for (var i = 0; i < 4; i++) {
        entry.pts[i].x = Math.max(0, Math.min(1, entry.pts[i].x + dx));
        entry.pts[i].y = Math.max(0, Math.min(1, entry.pts[i].y + dy));
      }
      entry.autoDetected = false;
      positionNidQuadDOM();
      renderCombineLivePreview();
    });

    wrapEl.addEventListener('dblclick', function (e) {
      if (nidHandTool || nidSpaceHeld) return;
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      var rect = wrapEl.getBoundingClientRect();
      var sx = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / (rect.width || 1)));
      var sy = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / (rect.height || 1)));
      var det = autoDetectCardQuad(entry.item.img, entry.rot || 0, entry.flipH || 1, null, { x: sx, y: sy }, null, getNidCardOrient(entry));
      entry.pts = det.pts;
      entry.autoDetected = true;
      positionNidQuadDOM({ snapped: true });
      triggerNidScanAnimation();
      renderCombineLivePreview();
      showToast(tr('স্মার্ট ক্লিক অটো-সিলেকশন সম্পন্ন হয়েছে!', 'Smart click auto-selection completed!'));
    });
  }

  var magicToneLut = (function () {
    var lut = new Uint8Array(256);
    for (var i = 0; i < 256; i++) {
      if (i > 195) {
        var tH = (i - 195) / 60;
        lut[i] = Math.min(255, Math.round(195 + tH * 60 + tH * (1 - tH) * 14));
      } else if (i < 105) {
        lut[i] = Math.max(0, Math.round(i * 0.80));
      } else {
        lut[i] = Math.min(255, Math.round(84 + ((i - 105) / 90) * 111));
      }
    }
    return lut;
  })();

  /**
   * "আসল রঙ (NID কালার)" tone curve: mild filmic S (28% smoothstep) with a soft highlight shoulder
   * toward print white (252) and a floor that never crushes shadows (portrait hair / dark text stay detailed).
   */
  var vividToneLut = (function () {
    var lut = new Uint8Array(256);
    for (var i = 0; i < 256; i++) {
      var t = i / 255;
      var s = t * t * (3 - 2 * t);
      var o = 255 * (t * 0.72 + s * 0.28);
      if (o > 232) o = o + (252 - o) * ((o - 232) / 23) * 0.55;
      o = Math.max(o, i * 0.86);
      lut[i] = o >= 255 ? 255 : Math.round(o);
    }
    return lut;
  })();

  var magicPlusToneLut = (function () {
    var lut = new Uint8Array(256);
    for (var i = 0; i < 256; i++) {
      if (i > 188) {
        var tH = (i - 188) / 67;
        lut[i] = Math.min(255, Math.round(188 + tH * 67 + tH * (1 - tH) * 18));
      } else if (i < 120) {
        lut[i] = Math.max(0, Math.round(Math.pow(i / 120, 1.35) * 96));
      } else {
        lut[i] = Math.min(255, Math.round(96 + ((i - 120) / 68) * 92));
      }
    }
    return lut;
  })();

  function serializeQuadKey(pts) {
    if (!pts || pts.length < 4) return 'default';
    return (
      pts[0].x.toFixed(4) + ',' + pts[0].y.toFixed(4) + ';' +
      pts[1].x.toFixed(4) + ',' + pts[1].y.toFixed(4) + ';' +
      pts[2].x.toFixed(4) + ',' + pts[2].y.toFixed(4) + ';' +
      pts[3].x.toFixed(4) + ',' + pts[3].y.toFixed(4)
    );
  }

  function ensureGeomCache(geomCanvas) {
    if (geomCanvas._srcPixels && geomCanvas._gainGrid && geomCanvas._blackGridPlus && geomCanvas._gainGridShadow) return;
    var sw = geomCanvas.width;
    var sh = geomCanvas.height;
    var gctx = geomCanvas.getContext('2d', { willReadFrequently: true });
    var srcImgData = gctx.getImageData(0, 0, sw, sh);
    var sData = srcImgData.data;
    geomCanvas._srcPixels = sData;

    var gxCount = 10, gyCount = 8;
    var rawTileP82 = new Float32Array(gxCount * gyCount);
    var rawTileP10 = new Float32Array(gxCount * gyCount);
    var tileW = sw / gxCount, tileH = sh / gyCount;
    var lumHist = new Uint32Array(256);
    var globalHist = new Uint32Array(256);
    var globalSamples = 0;

    for (var ty = 0; ty < gyCount; ty++) {
      var yStart = Math.floor(ty * tileH), yEnd = Math.min(sh, Math.floor((ty + 1) * tileH));
      for (var tx = 0; tx < gxCount; tx++) {
        var xStart = Math.floor(tx * tileW), xEnd = Math.min(sw, Math.floor((tx + 1) * tileW));
        lumHist.fill(0);
        var samples = 0;
        for (var py = yStart; py < yEnd; py += 3) {
          var rOff = py * sw;
          for (var px = xStart; px < xEnd; px += 3) {
            var pi = (rOff + px) << 2;
            var lVal = (sData[pi] * 77 + sData[pi + 1] * 150 + sData[pi + 2] * 29) >> 8;
            lumHist[lVal]++;
            globalHist[lVal]++;
            samples++;
            globalSamples++;
          }
        }
        var targetP10 = samples * 0.10;
        var targetP82 = samples * 0.82;
        var accL = 0, p10 = 35, p82 = 215, gotP10 = false;
        for (var b = 0; b < 256; b++) {
          accL += lumHist[b];
          if (!gotP10 && accL >= targetP10) { p10 = b; gotP10 = true; }
          if (accL >= targetP82) { p82 = b; break; }
        }
        rawTileP10[ty * gxCount + tx] = p10;
        rawTileP82[ty * gxCount + tx] = p82;
      }
    }

    var globalAcc = 0, globalP10 = 35, globalP65 = 160, globalP86 = 215;
    var globalP02 = 20, globalP97 = 235;
    var gotGP10 = false, gotGP65 = false, gotGP02 = false, gotGP86 = false;
    for (var gb = 0; gb < 256; gb++) {
      globalAcc += globalHist[gb];
      if (!gotGP02 && globalAcc >= globalSamples * 0.02) { globalP02 = gb; gotGP02 = true; }
      if (!gotGP10 && globalAcc >= globalSamples * 0.10) { globalP10 = gb; gotGP10 = true; }
      if (!gotGP65 && globalAcc >= globalSamples * 0.65) { globalP65 = gb; gotGP65 = true; }
      if (!gotGP86 && globalAcc >= globalSamples * 0.86) { globalP86 = gb; gotGP86 = true; }
      if (globalAcc >= globalSamples * 0.97) { globalP97 = gb; break; }
    }

    // Estimate global paper white-balance tint from bright, low-saturation background pixels
    var sumWbR = 0, sumWbG = 0, sumWbB = 0, wbCnt = 0;
    var wbLowL = Math.max(70, globalP65);
    for (var wy = 0; wy < sh; wy += 4) {
      var wRow = wy * sw;
      for (var wx = 0; wx < sw; wx += 4) {
        var wpi = (wRow + wx) << 2;
        var wr = sData[wpi], wg = sData[wpi + 1], wb = sData[wpi + 2];
        var wLum = (wr * 77 + wg * 150 + wb * 29) >> 8;
        if (wLum >= wbLowL && wLum <= 252) {
          var wMax = wr > wg ? (wr > wb ? wr : wb) : (wg > wb ? wg : wb);
          var wMin = wr < wg ? (wr < wb ? wr : wb) : (wg < wb ? wg : wb);
          if ((wMax - wMin) < 42) {
            sumWbR += wr;
            sumWbG += wg;
            sumWbB += wb;
            wbCnt++;
          }
        }
      }
    }
    var wbR = 1, wbG = 1, wbB = 1;
    if (wbCnt > 25) {
      var avgR = sumWbR / wbCnt, avgG = sumWbG / wbCnt, avgB = sumWbB / wbCnt;
      var avgLum = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
      if (avgLum > 60) {
        wbR = Math.max(0.86, Math.min(1.18, avgLum / Math.max(40, avgR)));
        wbG = Math.max(0.88, Math.min(1.15, avgLum / Math.max(40, avgG)));
        wbB = Math.max(0.86, Math.min(1.22, avgLum / Math.max(40, avgB)));
      }
    }

    // Detect whether the left portrait zone (`x ∈ [0.05..0.27], y ∈ [0.26..0.74]`) contains a solid portrait photo
    // BEFORE smoothing the 10×8 illumination grid so dark portrait hair/clothes don't depress `blackGrid`
    // in the adjacent text column (`x ∈ [0.29..0.44]`, e.g. "MD. BAB", "নাম", "পিতা").
    var pR = Math.max(3, Math.round(sw * 0.016));
    var portraitCeiling = Math.max(148, globalP86 - 20);
    var solidPortraitPatches = 0;
    for (var pyIdx = 0; pyIdx < 5; pyIdx++) {
      var pcy = Math.round(sh * (0.28 + pyIdx * 0.10));
      for (var pxIdx = 0; pxIdx < 4; pxIdx++) {
        var pcx = Math.round(sw * (0.07 + pxIdx * 0.06));
        var patchMaxL = 0;
        for (var pdy = -pR; pdy <= pR; pdy += 2) {
          var pry = Math.max(0, Math.min(sh - 1, pcy + pdy)) * sw;
          for (var pdx = -pR; pdx <= pR; pdx += 2) {
            var prx = Math.max(0, Math.min(sw - 1, pcx + pdx));
            var pOff = (pry + prx) << 2;
            var pLum = (sData[pOff] * 77 + sData[pOff + 1] * 150 + sData[pOff + 2] * 29) >> 8;
            if (pLum > patchMaxL) patchMaxL = pLum;
          }
        }
        if (patchMaxL > 0 && patchMaxL < portraitCeiling) {
          solidPortraitPatches++;
        }
      }
    }
    var hasLeftPortrait = solidPortraitPatches >= 2;
    geomCanvas._hasLeftPortrait = hasLeftPortrait;

    var smoothWhite = new Float32Array(gxCount * gyCount);
    var smoothBlack = new Float32Array(gxCount * gyCount);
    var shadowWhite = new Float32Array(gxCount * gyCount);
    var shadowBlack = new Float32Array(gxCount * gyCount);
    for (var sy = 0; sy < gyCount; sy++) {
      for (var sx = 0; sx < gxCount; sx++) {
        var sumW = 0, sumB = 0, cntI = 0;
        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            var ny = sy + dy, nx = sx + dx;
            if (ny >= 0 && ny < gyCount && nx >= 0 && nx < gxCount) {
              var gIdx = ny * gxCount + nx;
              sumW += rawTileP82[gIdx];
              sumB += rawTileP10[gIdx];
              cntI++;
            }
          }
        }
        var localW = sumW / cntI;
        var localB = sumB / cntI;
        var tileWAvg = localW * 0.72 + globalP86 * 0.28;
        var tileBAvg = localB * 0.65 + globalP10 * 0.35;
        smoothWhite[sy * gxCount + sx] = Math.max(95, Math.min(252, tileWAvg));
        smoothBlack[sy * gxCount + sx] = Math.max(0, Math.min(tileWAvg - 42, tileBAvg));

        // Stronger local spatial adaptation (86% local weight) for deep shadow & flash-glare removal
        var shWAvg = localW * 0.86 + globalP86 * 0.14;
        var shBAvg = localB * 0.78 + globalP10 * 0.22;
        shadowWhite[sy * gxCount + sx] = Math.max(72, Math.min(252, shWAvg));
        shadowBlack[sy * gxCount + sx] = Math.max(0, Math.min(shWAvg - 38, shBAvg));
      }
    }

    var gainGrid = new Float32Array(gxCount * gyCount);
    var blackGrid = new Float32Array(gxCount * gyCount);
    var gainGridPlus = new Float32Array(gxCount * gyCount);
    var blackGridPlus = new Float32Array(gxCount * gyCount);
    var gainGridShadow = new Float32Array(gxCount * gyCount);
    var blackGridShadow = new Float32Array(gxCount * gyCount);

    for (var idxG = 0; idxG < gxCount * gyCount; idxG++) {
      var wPt = smoothWhite[idxG];
      var bPt = smoothBlack[idxG];
      // Magic (Auto): gentle haze removal (45% black-floor subtraction) + balanced paper white (247)
      var blkM = Math.min(wPt - 75, bPt * 0.45);
      if (blkM < 0) blkM = 0;
      blackGrid[idxG] = blkM;
      gainGrid[idxG] = Math.min(2.6, 247 / Math.max(75, wPt - blkM));

      // Magic+ (Pro): deep camera-haze removal (78% black-floor subtraction) + crisp white paper (252)
      var blkP = Math.min(wPt - 52, bPt * 0.78);
      if (blkP < 0) blkP = 0;
      blackGridPlus[idxG] = blkP;
      gainGridPlus[idxG] = Math.min(3.8, 252 / Math.max(52, wPt - blkP));

      // No Shadow / De-glare: deep local shadow flattening + flash haze suppression
      var wSh = shadowWhite[idxG];
      var bSh = shadowBlack[idxG];
      var blkS = Math.min(wSh - 48, bSh * 0.68);
      if (blkS < 0) blkS = 0;
      blackGridShadow[idxG] = blkS;
      gainGridShadow[idxG] = Math.min(3.6, 249 / Math.max(48, wSh - blkS));
    }

    // Vivid "Original NID Color" global normalization (keeps green/red card artwork saturated instead of
    // flattening every tile to white like the local Magic grids)
    var vividBlk = Math.max(0, Math.min(40, globalP02 * 0.55));
    geomCanvas._vividBlk = vividBlk;
    geomCanvas._vividGain = Math.max(0.92, Math.min(1.75, 250 / Math.max(90, globalP97 - vividBlk)));

    /*
     * Content-Adaptive Photo Mask (colored portraits on old laminated paper NIDs + grayscale smart-card photos).
     * A block is a photo candidate when it is mostly darker/mid-tone than the local paper and has few bright paper pixels.
     * A 3×3 morphological opening removes text lines, bold NID numbers, MRZ and barcodes; the result is feathered
     * so later stages can blend protection smoothly (no hard seams).
     */
    var pbS = Math.max(8, Math.round(sw / 30));
    var pgw = Math.ceil(sw / pbS), pgh = Math.ceil(sh / pbS);
    var candMask = new Uint8Array(pgw * pgh);
    var paperChromaSum = 0, paperChromaCnt = 0;
    for (var pby = 0; pby < pgh; pby++) {
      var pyS = pby * pbS, pyE = Math.min(sh, pyS + pbS);
      var gyP = Math.min(gyCount - 1, Math.floor(((pyS + pyE) * 0.5) / tileH));
      for (var pbx = 0; pbx < pgw; pbx++) {
        var pxS = pbx * pbS, pxE = Math.min(sw, pxS + pbS);
        var gxP = Math.min(gxCount - 1, Math.floor(((pxS + pxE) * 0.5) / tileW));
        var wRef = Math.max(smoothWhite[gyP * gxCount + gxP], globalP86 * 0.92);
        var darkT = wRef - 38, midLo = wRef * 0.30, brightT = wRef - 16;
        var nS = 0, nDark = 0, nMid = 0, nBright = 0;
        for (var yy = pyS; yy < pyE; yy += 2) {
          var rowO = yy * sw;
          for (var xx = pxS; xx < pxE; xx += 2) {
            var o4 = (rowO + xx) << 2;
            var cr = sData[o4], cg = sData[o4 + 1], cb = sData[o4 + 2];
            var L = (cr * 77 + cg * 150 + cb * 29) >> 8;
            nS++;
            if (L < darkT) {
              nDark++;
              if (L > midLo) nMid++;
            } else if (L >= brightT) {
              nBright++;
              var mxC = cr > cg ? (cr > cb ? cr : cb) : (cg > cb ? cg : cb);
              var mnC = cr < cg ? (cr < cb ? cr : cb) : (cg < cb ? cg : cb);
              paperChromaSum += mxC - mnC;
              paperChromaCnt++;
            }
          }
        }
        if (nS > 0 && nDark >= nS * 0.42 && nMid >= nS * 0.22 && nBright <= nS * 0.32) {
          candMask[pby * pgw + pbx] = 1;
        }
      }
    }
    var erodedMask = new Uint8Array(pgw * pgh);
    for (var ey = 1; ey < pgh - 1; ey++) {
      for (var ex = 1; ex < pgw - 1; ex++) {
        var allOn = 1;
        for (var ky = -1; ky <= 1 && allOn; ky++) {
          for (var kx = -1; kx <= 1; kx++) {
            if (!candMask[(ey + ky) * pgw + ex + kx]) { allOn = 0; break; }
          }
        }
        erodedMask[ey * pgw + ex] = allOn;
      }
    }
    var photoMask = new Float32Array(pgw * pgh);
    var photoAny = false;
    for (var my = 0; my < pgh; my++) {
      for (var mx = 0; mx < pgw; mx++) {
        var near1 = 0, near2 = 0;
        for (var qy = -2; qy <= 2; qy++) {
          var ny2 = my + qy;
          if (ny2 < 0 || ny2 >= pgh) continue;
          for (var qx = -2; qx <= 2; qx++) {
            var nx2 = mx + qx;
            if (nx2 < 0 || nx2 >= pgw || !erodedMask[ny2 * pgw + nx2]) continue;
            if (qy >= -1 && qy <= 1 && qx >= -1 && qx <= 1) near1 = 1;
            near2 = 1;
          }
        }
        var mv = near1 ? 1 : (near2 ? 0.45 : 0);
        photoMask[my * pgw + mx] = mv;
        if (mv > 0) photoAny = true;
      }
    }
    geomCanvas._photoMask = photoAny ? photoMask : null;
    geomCanvas._photoBS = pbS;
    geomCanvas._photoGW = pgw;
    geomCanvas._photoGH = pgh;
    geomCanvas._paperChroma = paperChromaCnt > 20 ? paperChromaSum / paperChromaCnt : 0;
    if (window.__nidDebug) {
      (window.__nidDbgMasks = window.__nidDbgMasks || []).push({ gw: pgw, gh: pgh, bs: pbS, sw: sw, sh: sh, cand: Array.from(candMask), mask: Array.from(photoMask), paperChroma: geomCanvas._paperChroma });
    }

    var gx0Arr = new Int32Array(sw);
    var fxArr = new Float32Array(sw);
    var invSw = (gxCount - 1) / Math.max(1, sw);
    for (var ix0 = 0; ix0 < sw; ix0++) {
      var gxPos = Math.min(gxCount - 1.001, ix0 * invSw);
      var gxi = gxPos | 0;
      gx0Arr[ix0] = gxi;
      fxArr[ix0] = gxPos - gxi;
    }

    geomCanvas._gainGrid = gainGrid;
    geomCanvas._blackGrid = blackGrid;
    geomCanvas._gainGridPlus = gainGridPlus;
    geomCanvas._blackGridPlus = blackGridPlus;
    geomCanvas._gainGridShadow = gainGridShadow;
    geomCanvas._blackGridShadow = blackGridShadow;
    geomCanvas._wbR = wbR;
    geomCanvas._wbG = wbG;
    geomCanvas._wbB = wbB;
    geomCanvas._gx0Arr = gx0Arr;
    geomCanvas._fxArr = fxArr;
  }

  /**
   * Produces a perspective-rectified (homography warped) + deskewed + 2D illumination shadow-flattened
   * + color-adjusted canvas for a single card, with multi-stage dirty-flag caching for 60fps live preview
   * (`isPreview = true`) and full 300-DPI print resolution (`isPreview = false`).
   */
  function renderProcessedCardCanvas(entry, scanMode, br, ct, st, sharp, isPreview, deglare, textBoost) {
    var rotNorm = (((entry.rot || 0) % 360) + 360) % 360;
    var flipVal = entry.flipH || 1;
    var pts = entry.pts || defaultQuadPts(0.04);
    var fineDeg = entry.fineAngle || 0;
    var hasDeglare = !!deglare;
    var hasTextBoost = !!textBoost;

    var rotFlipKey = rotNorm + ':' + flipVal;
    var cardOrient = getNidCardOrient(entry);
    var cardTargetAspect = cardOrient === 'portrait' ? (53.98 / 85.6) : (85.6 / 53.98);
    var warpKey = rotFlipKey + ':' + cardOrient + ':' + serializeQuadKey(pts);
    var deskewKey = warpKey + ':' + fineDeg.toFixed(2);
    var procKey = deskewKey + ':' + scanMode + ':' + br + ':' + ct + ':' + st + ':' + sharp + ':' + (hasDeglare ? 1 : 0) + ':' + (hasTextBoost ? 1 : 0);

    if (isPreview) {
      if (entry._procPreviewKey === procKey && entry._procPreviewCanvas) {
        return entry._procPreviewCanvas;
      }
    } else {
      if (entry._procFullKey === procKey && entry._procFullCanvas) {
        return entry._procFullCanvas;
      }
    }

    // Stage 1: Cached Rotated Source Canvas
    var rotCanvas;
    if (isPreview) {
      if (entry._rotPreviewKey !== rotFlipKey || !entry._rotPreviewCanvas) {
        entry._rotPreviewCanvas = buildRotatedCanvas(entry.item.img, rotNorm, 1080, flipVal);
        entry._rotPreviewKey = rotFlipKey;
      }
      rotCanvas = entry._rotPreviewCanvas;
    } else {
      if (entry._rotFullKey !== rotFlipKey || !entry._rotFullCanvas) {
        entry._rotFullCanvas = buildRotatedCanvas(entry.item.img, rotNorm, 4800, flipVal);
        entry._rotFullKey = rotFlipKey;
      }
      rotCanvas = entry._rotFullCanvas;
    }

    // Stage 2: Cached 4-Corner Homography Warped Canvas
    var warpedCanvas;
    if (isPreview) {
      if (entry._warpPreviewKey !== warpKey || !entry._warpPreviewCanvas) {
        entry._warpPreviewCanvas = warpPerspectiveCard(rotCanvas, pts, 360, 400, false, null, cardTargetAspect);
        entry._warpPreviewKey = warpKey;
      }
      warpedCanvas = entry._warpPreviewCanvas;
    } else {
      if (entry._warpFullKey !== warpKey || !entry._warpFullCanvas) {
        entry._warpFullCanvas = warpPerspectiveCard(rotCanvas, pts, 1320, 2600, false, null, cardTargetAspect);
        entry._warpFullKey = warpKey;
      }
      warpedCanvas = entry._warpFullCanvas;
    }

    var sw = warpedCanvas.width;
    var sh = warpedCanvas.height;

    // Stage 3: Cached Fine Straighten / Deskew Canvas
    var geomCanvas = warpedCanvas;
    if (Math.abs(fineDeg) > 0.05) {
      if (isPreview && entry._deskewPreviewKey === deskewKey && entry._deskewPreviewCanvas) {
        geomCanvas = entry._deskewPreviewCanvas;
      } else if (!isPreview && entry._deskewFullKey === deskewKey && entry._deskewFullCanvas) {
        geomCanvas = entry._deskewFullCanvas;
      } else {
        var deskewCanvas = document.createElement('canvas');
        deskewCanvas.width = sw;
        deskewCanvas.height = sh;
        var dctx = deskewCanvas.getContext('2d', { willReadFrequently: true });
        dctx.imageSmoothingEnabled = true;
        dctx.imageSmoothingQuality = isPreview ? 'medium' : 'high';
        dctx.fillStyle = '#ffffff';
        dctx.fillRect(0, 0, sw, sh);
        dctx.save();
        dctx.translate(sw / 2, sh / 2);
        var rad = (fineDeg * Math.PI) / 180;
        var zoom = 1 + Math.abs(Math.sin(rad)) * 0.45;
        dctx.rotate(rad);
        dctx.scale(zoom, zoom);
        dctx.drawImage(warpedCanvas, -sw / 2, -sh / 2, sw, sh);
        dctx.restore();
        geomCanvas = deskewCanvas;
        if (isPreview) {
          entry._deskewPreviewCanvas = deskewCanvas;
          entry._deskewPreviewKey = deskewKey;
        } else {
          entry._deskewFullCanvas = deskewCanvas;
          entry._deskewFullKey = deskewKey;
        }
      }
    }

    // Fast path: untouched original card with 0 sharpness and no smart enhancers needs zero pixel copying
    if (scanMode === 'original' && br === 100 && ct === 100 && st === 100 && sharp === 0 && !hasDeglare && !hasTextBoost) {
      if (isPreview) {
        entry._procPreviewCanvas = geomCanvas;
        entry._procPreviewKey = procKey;
      } else {
        entry._procFullCanvas = geomCanvas;
        entry._procFullKey = procKey;
      }
      return geomCanvas;
    }

    // Stage 4: Single-Pass TypedArray Color + Cached Illumination Grid + Specular De-Glare + Edge-Aware Bangla Text Clarifier
    ensureGeomCache(geomCanvas);
    var src = geomCanvas._srcPixels;
    var activeGainGrid = scanMode === 'magic_plus'
      ? geomCanvas._gainGridPlus
      : ((scanMode === 'no_shadow' || hasDeglare) ? geomCanvas._gainGridShadow : geomCanvas._gainGrid);
    var activeBlackGrid = scanMode === 'magic_plus'
      ? geomCanvas._blackGridPlus
      : ((scanMode === 'no_shadow' || hasDeglare) ? geomCanvas._blackGridShadow : geomCanvas._blackGrid);
    var gx0Arr = geomCanvas._gx0Arr;
    var fxArr = geomCanvas._fxArr;
    var wbStrength = scanMode === 'magic_plus' ? 0.80 : (scanMode === 'magic' ? 0.50 : (scanMode === 'vivid' ? 0.55 : ((scanMode === 'clean' || scanMode === 'eco') ? 0.65 : (scanMode === 'no_shadow' || hasDeglare ? 0.48 : 0))));
    var wbR = 1 + ((geomCanvas._wbR || 1) - 1) * wbStrength;
    var wbG = 1 + ((geomCanvas._wbG || 1) - 1) * wbStrength;
    var wbB = 1 + ((geomCanvas._wbB || 1) - 1) * wbStrength;

    var outCanvas = (isPreview && entry._procPreviewOutCanvas) ? entry._procPreviewOutCanvas : document.createElement('canvas');
    if (isPreview) entry._procPreviewOutCanvas = outCanvas;
    if (outCanvas.width !== sw) outCanvas.width = sw;
    if (outCanvas.height !== sh) outCanvas.height = sh;
    var octx = outCanvas.getContext('2d');
    var outImgData = (geomCanvas._outImgData && geomCanvas._outImgData.width === sw && geomCanvas._outImgData.height === sh)
      ? geomCanvas._outImgData
      : octx.createImageData(sw, sh);
    geomCanvas._outImgData = outImgData;
    var d = outImgData.data;

    var isGray = (scanMode === 'grayscale' || scanMode === 'bw' || st === 0);
    // Only apply user's manual slider offsets on top of the preset's native curve
    var effBr = scanMode === 'clean' ? Math.round(br * 1.03) : (scanMode === 'eco' ? Math.round(br * 1.06) : br);
    var effCt = scanMode === 'clean' ? Math.round(ct * 1.12) : (scanMode === 'eco' ? Math.round(ct * 1.18) : (scanMode === 'bw' ? Math.round(ct * 1.35) : ct));
    var effSt = scanMode === 'magic_plus' ? Math.round(st * 1.25) : (scanMode === 'magic' ? Math.round(st * 1.15) : (scanMode === 'no_shadow' ? Math.round(st * 1.08) : (scanMode === 'eco' ? Math.round(st * 0.88) : st)));
    var effSharp = scanMode === 'magic_plus' ? Math.min(100, sharp + 26) : (scanMode === 'magic' ? Math.min(100, sharp + 14) : (scanMode === 'no_shadow' ? Math.min(100, sharp + 12) : (scanMode === 'vivid' ? Math.min(100, sharp + 10) : sharp)));
    if (hasTextBoost) {
      effSharp = Math.min(100, Math.max(42, effSharp + 24));
    }
    var satFixed = Math.round((effSt / 100) * 256);

    // Colored-paper cards (old laminated NIDs on yellow/green/pink paper): soften whitening & ink reconstruction
    var paperChroma = geomCanvas._paperChroma || 0;
    var colorPaperT = Math.max(0, Math.min(1, (paperChroma - 16) / 22));
    var whitenChromaMax = 52 - colorPaperT * 28;

    // Feathered content-adaptive photo mask (bilinear-sampled per pixel)
    var photoMask = geomCanvas._photoMask || null;
    var pmBS = geomCanvas._photoBS || 1, pmGW = geomCanvas._photoGW || 1, pmGH = geomCanvas._photoGH || 1;
    var pmX0 = null, pmFx = null;
    if (photoMask) {
      pmX0 = new Int32Array(sw);
      pmFx = new Float32Array(sw);
      for (var pmx = 0; pmx < sw; pmx++) {
        var pmPos = Math.max(0, Math.min(pmGW - 1.001, pmx / pmBS - 0.5));
        pmX0[pmx] = pmPos | 0;
        pmFx[pmx] = pmPos - (pmPos | 0);
      }
    }
    var vividGain = geomCanvas._vividGain || 1;
    var vividBlk = geomCanvas._vividBlk || 0;

    var hasUserBc = (effBr !== 100 || effCt !== 100);
    var bcLut = new Uint8Array(256);
    var bMul = effBr / 100;
    var cMul = effCt / 100;
    for (var bi = 0; bi < 256; bi++) {
      var bv = (bi * bMul - 127.5) * cMul + 127.5;
      bcLut[bi] = bv <= 0 ? 0 : (bv >= 255 ? 255 : (bv + 0.5) | 0);
    }

    var useIllum = (
      scanMode === 'magic' ||
      scanMode === 'magic_plus' ||
      scanMode === 'vivid' ||
      scanMode === 'no_shadow' ||
      scanMode === 'clean' ||
      scanMode === 'eco' ||
      scanMode === 'bw' ||
      hasDeglare
    ) && sw >= 32 && sh >= 32;
    var doSharp = (effSharp > 0 || hasTextBoost) && sw > 4 && sh > 4;
    var totalPx = sw * sh;
    var lumBuf = null;
    var pwBuf = null;
    if (doSharp) {
      lumBuf = (geomCanvas._lumBuf && geomCanvas._lumBuf.length === totalPx)
        ? geomCanvas._lumBuf
        : (geomCanvas._lumBuf = new Uint8Array(totalPx));
      if (photoMask) {
        pwBuf = (geomCanvas._pwBuf && geomCanvas._pwBuf.length === totalPx)
          ? geomCanvas._pwBuf
          : (geomCanvas._pwBuf = new Uint8Array(totalPx));
      }
    }

    var gxCount = 10, gyCount = 8;
    var invSh = (gyCount - 1) / Math.max(1, sh);
    var hasLeftPortrait = !!geomCanvas._hasLeftPortrait;
    var pLeftX0 = Math.round(sw * 0.025), pLeftX1 = Math.round(sw * 0.295);
    var pLeftY0 = Math.round(sh * 0.225), pLeftY1 = Math.round(sh * 0.77);
    var pGhostX0 = Math.round(sw * 0.73), pGhostX1 = Math.round(sw * 0.94);
    var pGhostY0 = Math.round(sh * 0.22), pGhostY1 = Math.round(sh * 0.51);

    for (var y0 = 0; y0 < sh; y0++) {
      var gyPos = Math.min(gyCount - 1.001, y0 * invSh);
      var gy0 = gyPos | 0, fy = gyPos - gy0, invFy = 1 - fy;
      var gRow0 = gy0 * gxCount, gRow1 = (gy0 + 1) * gxCount;
      var pxRowOff = y0 * sw;
      var inPortraitY = hasLeftPortrait && (y0 >= pLeftY0 && y0 <= pLeftY1);
      var inGhostY = hasLeftPortrait && (y0 >= pGhostY0 && y0 <= pGhostY1);
      var pmRowA = 0, pmRowB = 0, pmFy = 0;
      if (photoMask) {
        var pmYPos = Math.max(0, Math.min(pmGH - 1.001, y0 / pmBS - 0.5));
        var pmY0 = pmYPos | 0;
        pmFy = pmYPos - pmY0;
        pmRowA = pmY0 * pmGW;
        pmRowB = (pmY0 + 1 < pmGH ? pmY0 + 1 : pmY0) * pmGW;
      }

      for (var x0 = 0; x0 < sw; x0++) {
        var pixIdx = pxRowOff + x0;
        var pIdx = pixIdx << 2;
        var r = src[pIdx];
        var g = src[pIdx + 1];
        var b2 = src[pIdx + 2];
        var pw = 0;
        if (photoMask) {
          var pmxi = pmX0[x0], pmfx = pmFx[x0];
          var pmxj = pmxi + 1 < pmGW ? pmxi + 1 : pmxi;
          pw = (photoMask[pmRowA + pmxi] * (1 - pmfx) + photoMask[pmRowA + pmxj] * pmfx) * (1 - pmFy) +
               (photoMask[pmRowB + pmxi] * (1 - pmfx) + photoMask[pmRowB + pmxj] * pmfx) * pmFy;
        }
        var inPortraitBox = (inPortraitY && x0 >= pLeftX0 && x0 <= pLeftX1) || (inGhostY && x0 >= pGhostX0 && x0 <= pGhostX1) || pw >= 0.72;

        if (useIllum) {
          var gx0 = gx0Arr[x0], fx = fxArr[x0], invFx = 1 - fx;
          var gain =
            (activeGainGrid[gRow0 + gx0] * invFx + activeGainGrid[gRow0 + gx0 + 1] * fx) * invFy +
            (activeGainGrid[gRow1 + gx0] * invFx + activeGainGrid[gRow1 + gx0 + 1] * fx) * fy;
          var blk =
            (activeBlackGrid[gRow0 + gx0] * invFx + activeBlackGrid[gRow0 + gx0 + 1] * fx) * invFy +
            (activeBlackGrid[gRow1 + gx0] * invFx + activeBlackGrid[gRow1 + gx0 + 1] * fx) * fy;

          var vInkLum = 255;
          if (scanMode === 'vivid') {
            // Local (Magic-normalized) luminance: paper ≈ 250 everywhere, so faint gray print under glare is still
            // recognized as ink and can be deepened, while colors use the gentle global exposure below.
            vInkLum = ((r * wbR - blk) * gain * 77 + (g * wbG - blk) * gain * 150 + (b2 * wbB - blk) * gain * 29) / 256;
            // 35% local shadow flattening + 65% global exposure, so colored artwork keeps its true saturation
            gain = vividGain + (gain - vividGain) * 0.35;
            blk = vividBlk + (blk - vividBlk) * 0.25;
          }

          // Feathered photo protection: soften black-floor subtraction & gain on portraits (no hard seams)
          if (pw > 0) {
            blk *= 1 - 0.6 * pw;
            gain = 1 + (gain - 1) * (1 - 0.4 * pw);
          }

          // Specular Flash Glare Recovery before gain amplification:
          // Lamination flash reflections have very high luminance (>205) and low chroma (<28)
          if (hasDeglare || scanMode === 'no_shadow') {
            var rawLum = (r * 77 + g * 150 + b2 * 29) >> 8;
            var rawMax = r > g ? (r > b2 ? r : b2) : (g > b2 ? g : b2);
            var rawMin = r < g ? (r < b2 ? r : b2) : (g < b2 ? g : b2);
            if (rawLum > 198 && (rawMax - rawMin) < 32 && gain > 1.04) {
              var glareT = Math.min(1, (rawLum - 198) / 52);
              // Dampen excessive gain on bright flash hotspots so strokes under lamination don't blow out
              gain = 1 + (gain - 1) * (1 - glareT * 0.72);
            }
          }

          r = (r * wbR - blk) * gain;
          g = (g * wbG - blk) * gain;
          b2 = (b2 * wbB - blk) * gain;
          r = r <= 0 ? 0 : (r >= 255 ? 255 : r);
          g = g <= 0 ? 0 : (g >= 255 ? 255 : g);
          b2 = b2 <= 0 ? 0 : (b2 >= 255 ? 255 : b2);

          if (scanMode === 'magic') {
            var lumM = 0.299 * r + 0.587 * g + 0.114 * b2;
            var rM = magicToneLut[r | 0];
            var gM = magicToneLut[g | 0];
            var bM = magicToneLut[b2 | 0];
            if ((inPortraitBox && lumM < 192) || (pw > 0.4 && lumM < 238) || (!hasLeftPortrait && r > g && g > b2 && (r - b2) > 22 && lumM > 75 && lumM < 220)) {
              r = (rM * 0.65 + r * 0.35) | 0;
              g = (gM * 0.65 + g * 0.35) | 0;
              b2 = (bM * 0.65 + b2 * 0.35) | 0;
            } else if (lumM < 145) {
              // Luminance-coupled darkening for text strokes over colored guilloche waves
              var tLumM = magicToneLut[lumM | 0];
              var scM = tLumM / Math.max(1, lumM);
              r = Math.min(255, (r * scM * 0.72 + tLumM * 0.28 + 0.5) | 0);
              g = Math.min(255, (g * scM * 0.72 + tLumM * 0.28 + 0.5) | 0);
              b2 = Math.min(255, (b2 * scM * 0.72 + tLumM * 0.28 + 0.5) | 0);
            } else {
              r = rM;
              g = gM;
              b2 = bM;
            }
          } else if (scanMode === 'magic_plus') {
            var lumP = 0.299 * r + 0.587 * g + 0.114 * b2;
            var maxP = r > g ? (r > b2 ? r : b2) : (g > b2 ? g : b2);
            var minP = r < g ? (r < b2 ? r : b2) : (g < b2 ? g : b2);
            var chromaP = maxP - minP;
            var isSkinTone = (inPortraitBox && lumP < 188) || (pw > 0.4 && lumP < 238) || (!hasLeftPortrait && r > g && g > b2 && (r - b2) > 22 && lumP > 75 && lumP < 220);

            if (lumP > 188 && chromaP < whitenChromaMax && !isSkinTone) {
              // Cleanly whiten paper & light guilloche background above 188 (preserving gray engraved text!)
              var tWhite = Math.min(1, (lumP - 188) / 52);
              var wBlend = tWhite * tWhite * (3 - 2 * tWhite) * 0.94;
              r = (r + (254 - r) * wBlend + 0.5) | 0;
              g = (g + (254 - g) * wBlend + 0.5) | 0;
              b2 = (b2 + (254 - b2) * wBlend + 0.5) | 0;
            } else if (isSkinTone) {
              var rP = magicToneLut[r | 0];
              var gP = magicToneLut[g | 0];
              var bP = magicToneLut[b2 | 0];
              r = (rP * 0.56 + r * 0.44) | 0;
              g = (gP * 0.56 + g * 0.44) | 0;
              b2 = (bP * 0.56 + b2 * 0.44) | 0;
            } else if (lumP < 152) {
              // Luminance-coupled tone mapping so text strokes on warm/orange guilloche don't split R above knee
              var tLumP = magicPlusToneLut[lumP | 0];
              var scP = tLumP / Math.max(1, lumP);
              var neutMix = chromaP < 64 ? 0.46 : 0.20;
              var colMix = 1 - neutMix;
              r = Math.min(255, (r * scP * colMix + tLumP * neutMix + 0.5) | 0);
              g = Math.min(255, (g * scP * colMix + tLumP * neutMix + 0.5) | 0);
              b2 = Math.min(255, (b2 * scP * colMix + tLumP * neutMix + 0.5) | 0);
            } else {
              r = magicPlusToneLut[r | 0];
              g = magicPlusToneLut[g | 0];
              b2 = magicPlusToneLut[b2 | 0];
            }
          } else if (scanMode === 'vivid') {
            // "আসল রঙ (NID কালার)": true-to-card colors for color printing.
            // Gentle filmic S-curve (no crushed blacks / no over-contrast) + vibrance that boosts muted
            // green guilloche & red sun disc more than already-saturated colors, while keeping portraits natural.
            var protectV = inPortraitBox || pw > 0.35;
            var rV = vividToneLut[r | 0], gV = vividToneLut[g | 0], bV = vividToneLut[b2 | 0];
            if (protectV) {
              var tBl = 0.45 + 0.2 * (1 - pw);
              r = rV * tBl + r * (1 - tBl);
              g = gV * tBl + g * (1 - tBl);
              b2 = bV * tBl + b2 * (1 - tBl);
            } else {
              r = rV; g = gV; b2 = bV;
            }
            var lumVv = 0.299 * r + 0.587 * g + 0.114 * b2;
            var maxVv = r > g ? (r > b2 ? r : b2) : (g > b2 ? g : b2);
            var minVv = r < g ? (r < b2 ? r : b2) : (g < b2 ? g : b2);
            var chromaVv = maxVv - minVv;
            if (!protectV && lumVv > 218 && chromaVv < 16) {
              // Clean near-neutral paper glare toward print white without bleaching colored artwork
              var tPw = Math.min(1, (lumVv - 218) / 30);
              r += (251 - r) * tPw * 0.8;
              g += (251 - g) * tPw * 0.8;
              b2 += (251 - b2) * tPw * 0.8;
            } else if (!protectV && chromaVv < 48 && (lumVv < 140 || vInkLum < 178)) {
              // Deepen neutral printed text toward true black ink (smooth ramp, no posterized edges).
              // Uses the locally-normalized luminance so thin gray print under glare also becomes crisp dark ink.
              var tInk = Math.max((140 - lumVv) / 140, (178 - vInkLum) / 118);
              tInk = tInk < 0 ? 0 : (tInk > 1 ? 1 : tInk);
              var inkTarget = Math.max(12, Math.min(lumVv, vInkLum * 0.55));
              var kInk = 1 - (1 - inkTarget / Math.max(1, lumVv)) * tInk * (2 - tInk);
              r *= kInk; g *= kInk; b2 *= kInk;
            } else {
              var satN = chromaVv / Math.max(1, maxVv);
              var vib = protectV ? 0.10 * (1 - pw * 0.5) : 0.85;
              var hiFade = lumVv > 232 ? Math.max(0, (255 - lumVv) / 23) : 1;
              var shFade = lumVv < 40 ? lumVv / 40 : 1;
              var boostV = 1 + vib * (1 - satN) * hiFade * shFade;
              r = lumVv + (r - lumVv) * boostV;
              g = lumVv + (g - lumVv) * boostV;
              b2 = lumVv + (b2 - lumVv) * boostV;
            }
            r = r <= 0 ? 0 : (r >= 255 ? 255 : r | 0);
            g = g <= 0 ? 0 : (g >= 255 ? 255 : g | 0);
            b2 = b2 <= 0 ? 0 : (b2 >= 255 ? 255 : b2 | 0);
          } else if (scanMode === 'no_shadow') {
            // CamScanner "No Shadow": removes uneven phone/hand shadows while keeping natural portrait & card tint
            var lumNs = 0.299 * r + 0.587 * g + 0.114 * b2;
            var maxNs = r > g ? (r > b2 ? r : b2) : (g > b2 ? g : b2);
            var minNs = r < g ? (r < b2 ? r : b2) : (g < b2 ? g : b2);
            var isSkinNs = inPortraitBox || (r > g && g > b2 && (r - b2) > 18 && lumNs > 70 && lumNs < 225);
            if (lumNs > 205 && (maxNs - minNs) < 34 && !isSkinNs) {
              var tNs = Math.min(1, (lumNs - 205) / 42);
              r = (r + (253 - r) * tNs * 0.82 + 0.5) | 0;
              g = (g + (253 - g) * tNs * 0.82 + 0.5) | 0;
              b2 = (b2 + (253 - b2) * tNs * 0.82 + 0.5) | 0;
            } else {
              var rN = magicToneLut[r | 0];
              var gN = magicToneLut[g | 0];
              var bN = magicToneLut[b2 | 0];
              var blendN = isSkinNs ? 0.45 : 0.78;
              r = (rN * blendN + r * (1 - blendN) + 0.5) | 0;
              g = (gN * blendN + g * (1 - blendN) + 0.5) | 0;
              b2 = (bN * blendN + b2 * (1 - blendN) + 0.5) | 0;
            }
          } else if (scanMode === 'clean') {
            var lumC = 0.299 * r + 0.587 * g + 0.114 * b2;
            var maxC = r > g ? (r > b2 ? r : b2) : (g > b2 ? g : b2);
            var minC = r < g ? (r < b2 ? r : b2) : (g < b2 ? g : b2);
            if (lumC > 188 && (maxC - minC) < 42 && !inPortraitBox) {
              var tW = Math.min(1, (lumC - 188) / 48);
              r = (r + (255 - r) * tW + 0.5) | 0;
              g = (g + (255 - g) * tW + 0.5) | 0;
              b2 = (b2 + (255 - b2) * tW + 0.5) | 0;
            } else if (lumC < 105 && !inPortraitBox) {
              r = (r * 0.80) | 0;
              g = (g * 0.80) | 0;
              b2 = (b2 * 0.80) | 0;
            } else {
              r = r | 0;
              g = g | 0;
              b2 = b2 | 0;
            }
          } else if (scanMode === 'eco') {
            // CamScanner "Save Ink / Eco Print": aggressively whitens mid-bright paper background (>158) to save printer toner while keeping portraits & dark text clear
            var lumEco = 0.299 * r + 0.587 * g + 0.114 * b2;
            var maxEco = r > g ? (r > b2 ? r : b2) : (g > b2 ? g : b2);
            var minEco = r < g ? (r < b2 ? r : b2) : (g < b2 ? g : b2);
            var isSkinEco = inPortraitBox || (r > g && g > b2 && (r - b2) > 20 && lumEco > 75 && lumEco < 215);
            if (lumEco > 158 && (maxEco - minEco) < 44 && !isSkinEco) {
              var tEco = Math.min(1, (lumEco - 158) / 56);
              var ecoBlend = tEco * (2 - tEco);
              r = (r + (255 - r) * ecoBlend + 0.5) | 0;
              g = (g + (255 - g) * ecoBlend + 0.5) | 0;
              b2 = (b2 + (255 - b2) * ecoBlend + 0.5) | 0;
            } else if (lumEco < 118 && !isSkinEco) {
              r = (r * 0.76) | 0;
              g = (g * 0.76) | 0;
              b2 = (b2 * 0.76) | 0;
            } else {
              r = r | 0;
              g = g | 0;
              b2 = b2 | 0;
            }
          } else if (scanMode === 'bw') {
            var lumBw = (r * 77 + g * 150 + b2 * 29) >> 8;
            var bwVal = lumBw > 172 ? 255 : (lumBw < 102 ? 0 : (((lumBw - 102) * 3.6428) | 0));
            r = g = b2 = bwVal;
          } else {
            r = r | 0;
            g = g | 0;
            b2 = b2 | 0;
          }
        }

        if (hasUserBc) {
          r = bcLut[r | 0];
          g = bcLut[g | 0];
          b2 = bcLut[b2 | 0];
        }

        if (isGray) {
          r = g = b2 = (r * 77 + g * 150 + b2 * 29) >> 8;
        } else if (satFixed !== 256) {
          // Portraits keep natural skin: pull extra preset saturation back toward neutral inside the photo mask
          var satLocal = (pw > 0 && satFixed > 256) ? (satFixed + (((256 - satFixed) * pw * 0.75) | 0)) : satFixed;
          var lumS = (r * 77 + g * 150 + b2 * 29) >> 8;
          var sr0 = lumS + (((r - lumS) * satLocal) >> 8);
          var sg0 = lumS + (((g - lumS) * satLocal) >> 8);
          var sb0 = lumS + (((b2 - lumS) * satLocal) >> 8);
          r = sr0 < 0 ? 0 : (sr0 > 255 ? 255 : sr0);
          g = sg0 < 0 ? 0 : (sg0 > 255 ? 255 : sg0);
          b2 = sb0 < 0 ? 0 : (sb0 > 255 ? 255 : sb0);
        }

        // Portrait skin guard: on (old color-paper) cards the photo is already warm, so tone curves + preset
        // saturation make faces glow red. Cap chroma growth inside the feathered photo mask to ~1.12x of source.
        if (!isGray && (pw > 0.15 || inPortraitBox) && scanMode !== 'original') {
          var sR = src[pIdx], sG = src[pIdx + 1], sB = src[pIdx + 2];
          var sMx = sR > sG ? (sR > sB ? sR : sB) : (sG > sB ? sG : sB);
          var sMn = sR < sG ? (sR < sB ? sR : sB) : (sG < sB ? sG : sB);
          var oMx = r > g ? (r > b2 ? r : b2) : (g > b2 ? g : b2);
          var oMn = r < g ? (r < b2 ? r : b2) : (g < b2 ? g : b2);
          var oCh = oMx - oMn;
          if (oCh > 12) {
            var sLumG = (sR * 77 + sG * 150 + sB * 29) >> 8;
            var oLumG = (r * 77 + g * 150 + b2 * 29) >> 8;
            var expoK = Math.min(1.6, Math.max(1, oLumG / Math.max(16, sLumG)));
            var chCap = (sMx - sMn) * expoK * 1.12 + 5;
            if (oCh > chCap) {
              var wSk = inPortraitBox ? Math.max(pw, 0.8) : Math.min(1, pw * 2.2);
              var kSk = 1 - (1 - chCap / oCh) * wSk;
              r = (oLumG + (r - oLumG) * kSk) | 0;
              g = (oLumG + (g - oLumG) * kSk) | 0;
              b2 = (oLumG + (b2 - oLumG) * kSk) | 0;
              r = r < 0 ? 0 : (r > 255 ? 255 : r);
              g = g < 0 ? 0 : (g > 255 ? 255 : g);
              b2 = b2 < 0 ? 0 : (b2 > 255 ? 255 : b2);
            }
          }
        }

        d[pIdx]     = r;
        d[pIdx + 1] = g;
        d[pIdx + 2] = b2;
        d[pIdx + 3] = 255;
        if (doSharp) {
          lumBuf[pixIdx] = (r * 77 + g * 150 + b2 * 29) >> 8;
          if (pwBuf) pwBuf[pixIdx] = (pw * 255) | 0;
        }
      }
    }

    // Stage 5: CamScanner Native Typed-Ink Reconstruction Engine
    // (Multi-Scale Two-Sided Valley Stroke Detector + Morphological Shock Filter + Sigmoidal Ink Reconstruction)
    if (doSharp) {
      var amtFixed = Math.round((effSharp / 100) * 0.55 * 2.2 * 64);
      var r1 = Math.max(1, Math.round(sw / 420));
      var r2 = Math.max(2, Math.round(sw / 185));
      var r3 = Math.max(4, Math.round(sw / 105));
      var margin = hasTextBoost ? r3 : 1;

      for (var y = margin; y < sh - margin; y++) {
        var lRow = y * sw;
        var pRow = lRow * 4;
        var inPortY = hasLeftPortrait && (y >= pLeftY0 && y <= pLeftY1);
        var inGhY = hasLeftPortrait && (y >= pGhostY0 && y <= pGhostY1);

        for (var x = margin; x < sw - margin; x++) {
          var lIdx = lRow + x;
          var cLum = lumBuf[lIdx];
          var lLeft = lumBuf[lIdx - 1];
          var lRight = lumBuf[lIdx + 1];
          var lUp = lumBuf[lIdx - sw];
          var lDown = lumBuf[lIdx + sw];
          var diff4 = (cLum << 2) - lLeft - lRight - lUp - lDown;

          var p = pRow + (x << 2);
          var pr = d[p], pg = d[p + 1], pb = d[p + 2];
          var maxCh = pr > pg ? (pr > pb ? pr : pb) : (pg > pb ? pg : pb);
          var minCh = pr < pg ? (pr < pb ? pr : pb) : (pg < pb ? pg : pb);
          var chroma = maxCh - minCh;
          var inPort = (inPortY && x >= pLeftX0 && x <= pLeftX1) || (inGhY && x >= pGhostX0 && x <= pGhostX1);
          var pwS = pwBuf ? pwBuf[lIdx] : 0;
          if (pwS >= 90) inPort = true;
          // Only protect skin tones inside the portrait zones (or when no left portrait was detected on a non-standard card),
          // so warm orange/pink guilloche patterns behind the text column (`x ∈ [0.30..0.72]`) never block text reconstruction!
          var isPortraitSkin = inPort || (!hasLeftPortrait && pr > pg && pg > pb && (pr - pb) > 22 && cLum > 75 && cLum < 220);

          // Protect red/green national emblem in header (`y < 0.21 * sh`) & gold smart-card chip (`x > 0.72 * sw`)
          var inHeaderOrChip = (y < sh * 0.21) || (hasLeftPortrait && x > sw * 0.72 && y > sh * 0.44 && y < sh * 0.78);
          var isColoredElement = inHeaderOrChip && (chroma > 48 || (pr - pg > 30 && pr > 105));
          // Colored print anywhere (green/red titles on old paper NIDs, red sun disc, purple lotus) is never turned into black ink
          if (!isColoredElement && chroma > 56 && cLum > 60) isColoredElement = true;

          // If Typed-Text HD Reconstruction (`hasTextBoost`) is active and pixel is outside portrait & colored emblems:
          if (hasTextBoost && !isPortraitSkin && !isColoredElement && cLum < 232) {
            // 1. Multi-Radius Two-Sided Valley Stroke Detector across 4 axes (H, V, D1, D2) at radii r1, r2, r3
            // A real text stroke (Bangla/English character, NID digit, signature, MRZ, barcode) is narrower than 2*r3
            // and is bounded on BOTH sides along at least one axis by brighter card background!
            var bestValley = 0;
            var envBg = cLum;
            var localCore = cLum;

            // Check r1 core minimum & valley
            var r1W = r1 * sw;
            var a1L = lumBuf[lIdx - r1], a1R = lumBuf[lIdx + r1];
            var a1U = lumBuf[lIdx - r1W], a1D = lumBuf[lIdx + r1W];
            var a1NW = lumBuf[lIdx - r1W - r1], a1SE = lumBuf[lIdx + r1W + r1];
            var a1NE = lumBuf[lIdx - r1W + r1], a1SW = lumBuf[lIdx + r1W - r1];

            if (a1L < localCore) localCore = a1L;
            if (a1R < localCore) localCore = a1R;
            if (a1U < localCore) localCore = a1U;
            if (a1D < localCore) localCore = a1D;
            if (a1NW < localCore) localCore = a1NW;
            if (a1SE < localCore) localCore = a1SE;
            if (a1NE < localCore) localCore = a1NE;
            if (a1SW < localCore) localCore = a1SW;

            var v1H = (a1L < a1R ? a1L : a1R) - cLum;
            var v1V = (a1U < a1D ? a1U : a1D) - cLum;
            var v1D1 = (a1NW < a1SE ? a1NW : a1SE) - cLum;
            var v1D2 = (a1NE < a1SW ? a1NE : a1SW) - cLum;
            if (v1H > bestValley) { bestValley = v1H; envBg = (a1L + a1R) >> 1; }
            if (v1V > bestValley) { bestValley = v1V; envBg = (a1U + a1D) >> 1; }
            if (v1D1 > bestValley) { bestValley = v1D1; envBg = (a1NW + a1SE) >> 1; }
            if (v1D2 > bestValley) { bestValley = v1D2; envBg = (a1NE + a1SW) >> 1; }

            // Check r2 valley & core minimum (normal character & name strokes)
            var r2W = r2 * sw;
            var a2L = lumBuf[lIdx - r2], a2R = lumBuf[lIdx + r2];
            var a2U = lumBuf[lIdx - r2W], a2D = lumBuf[lIdx + r2W];
            var a2NW = lumBuf[lIdx - r2W - r2], a2SE = lumBuf[lIdx + r2W + r2];
            var a2NE = lumBuf[lIdx - r2W + r2], a2SW = lumBuf[lIdx + r2W - r2];
            if (a2L < localCore) localCore = a2L;
            if (a2R < localCore) localCore = a2R;
            if (a2U < localCore) localCore = a2U;
            if (a2D < localCore) localCore = a2D;

            var v2H = (a2L < a2R ? a2L : a2R) - cLum;
            var v2V = (a2U < a2D ? a2U : a2D) - cLum;
            var v2D1 = (a2NW < a2SE ? a2NW : a2SE) - cLum;
            var v2D2 = (a2NE < a2SW ? a2NE : a2SW) - cLum;
            if (v2H > bestValley) { bestValley = v2H; envBg = (a2L + a2R) >> 1; }
            if (v2V > bestValley) { bestValley = v2V; envBg = (a2U + a2D) >> 1; }
            if (v2D1 > bestValley) { bestValley = v2D1; envBg = (a2NW + a2SE) >> 1; }
            if (v2D2 > bestValley) { bestValley = v2D2; envBg = (a2NE + a2SW) >> 1; }

            // Check r3 valley (bold NID digits, headers & barcodes)
            var r3W = r3 * sw;
            var a3L = lumBuf[lIdx - r3], a3R = lumBuf[lIdx + r3];
            var a3U = lumBuf[lIdx - r3W], a3D = lumBuf[lIdx + r3W];
            var a3NW = lumBuf[lIdx - r3W - r3], a3SE = lumBuf[lIdx + r3W + r3];
            var a3NE = lumBuf[lIdx - r3W + r3], a3SW = lumBuf[lIdx + r3W - r3];
            var v3H = (a3L < a3R ? a3L : a3R) - cLum;
            var v3V = (a3U < a3D ? a3U : a3D) - cLum;
            var v3D1 = (a3NW < a3SE ? a3NW : a3SE) - cLum;
            var v3D2 = (a3NE < a3SW ? a3NE : a3SW) - cLum;
            if (v3H > bestValley) { bestValley = v3H; envBg = (a3L + a3R) >> 1; }
            if (v3V > bestValley) { bestValley = v3V; envBg = (a3U + a3D) >> 1; }
            if (v3D1 > bestValley) { bestValley = v3D1; envBg = (a3NW + a3SE) >> 1; }
            if (v3D2 > bestValley) { bestValley = v3D2; envBg = (a3NE + a3SW) >> 1; }

            // Local background ceiling from r2/r3 envelope
            var nearBg = a2L > a2R ? a2L : a2R;
            if (a2U > nearBg) nearBg = a2U;
            if (a2D > nearBg) nearBg = a2D;
            if (a3L > nearBg) nearBg = a3L;
            if (a3R > nearBg) nearBg = a3R;
            var bgRef = envBg > nearBg ? envBg : nearBg;
            var span = bgRef - localCore;

            if (bgRef >= 118 && span >= 13) {
              var u = (cLum - localCore) / span;
              if (u <= 0.46 && bestValley >= 6) {
                // Inside true character stroke core (`u <= 0.46`):
                // Reconstruct faded/blurry gray stroke into thin, crisp carbon-black printed ink
                var corePull = Math.min(localCore - 6, Math.round(bestValley * (1.48 - 0.30 * colorPaperT)));
                var targetCore = Math.max(6, localCore - corePull);
                var tCore = u / 0.46;
                var uTyped = tCore * tCore * (0.24 + 0.18 * tCore);
                var newLum = Math.round(targetCore + uTyped * (bgRef - targetCore));
                var lumDelta = newLum - cLum;

                // Neutralize camera chromatic aberration & background guilloche tint inside dark ink strokes
                var inkNeutralBlend = !inHeaderOrChip ? 0.90 : (chroma < 42 ? 0.82 : 0.48);
                var nrT = Math.round((pr + lumDelta) * (1 - inkNeutralBlend) + newLum * inkNeutralBlend);
                var ngT = Math.round((pg + lumDelta) * (1 - inkNeutralBlend) + newLum * inkNeutralBlend);
                var nbT = Math.round((pb + lumDelta) * (1 - inkNeutralBlend) + newLum * inkNeutralBlend);
                d[p]     = nrT < 0 ? 0 : (nrT > 255 ? 255 : nrT);
                d[p + 1] = ngT < 0 ? 0 : (ngT > 255 ? 255 : ngT);
                d[p + 2] = nbT < 0 ? 0 : (nbT > 255 ? 255 : nbT);
                continue;
              } else if (u >= 0.50 && span >= 16) {
                // Outside character stroke in blurry gray smudge halo (`u >= 0.50`):
                // Shock-Filter Halo Eraser strips blur spread so strokes become thin, separated & vector-sharp.
                // Multiplicative (hue-preserving) lift so colored paper / green guilloche never bleach to white.
                var tHalo = (u - 0.50) / 0.50;
                var haloLift = Math.round((bgRef - cLum) * Math.min(0.76 - 0.34 * colorPaperT, 0.25 + tHalo * 0.65));
                if (haloLift > 0) {
                  var haloScale = (cLum + haloLift) / Math.max(8, cLum);
                  var nrH = Math.round(pr * haloScale);
                  var ngH = Math.round(pg * haloScale);
                  var nbH = Math.round(pb * haloScale);
                  d[p]     = nrH > 255 ? 255 : nrH;
                  d[p + 1] = ngH > 255 ? 255 : ngH;
                  d[p + 2] = nbH > 255 ? 255 : nbH;
                  continue;
                }
              }
            }
          }

          // Standard Edge-Aware Unsharp Mask for portraits, emblems & general details
          var absDiff = diff4 < 0 ? -diff4 : diff4;
          if (absDiff <= 3) continue;
          var delta = (diff4 * amtFixed) >> 8;
          if (delta > 26) delta = 26 + ((delta - 26) >> 2);
          if (isPortraitSkin && delta < 0) delta = (delta * 4) >> 3;

          if (delta !== 0) {
            var nr = pr + delta;
            var ng = pg + delta;
            var nb = pb + delta;
            d[p]     = nr < 0 ? 0 : (nr > 255 ? 255 : nr);
            d[p + 1] = ng < 0 ? 0 : (ng > 255 ? 255 : ng);
            d[p + 2] = nb < 0 ? 0 : (nb > 255 ? 255 : nb);
          }
        }
      }
    }

    octx.putImageData(outImgData, 0, 0);

    if (isPreview) {
      entry._procPreviewCanvas = outCanvas;
      entry._procPreviewKey = procKey;
    } else {
      entry._procFullCanvas = outCanvas;
      entry._procFullKey = procKey;
    }
    return outCanvas;
  }

  /**
   * Builds a genuine PDF 1.4 document embedding the high-DPI JPEG image stream (`/DCTDecode`)
   * with zero re-compression loss.
   */
  function buildJpegPdfBlob(jpegBytes, imgW, imgH, isA4, printWidthMm) {
    var pageW = isA4 ? 595.28 : (printWidthMm && printWidthMm > 0 ? Math.max(120, Math.min(841.89, +(printWidthMm * 72 / 25.4).toFixed(2))) : 540);
    var pageH = isA4 ? 841.89 : Math.max(100, +(pageW * (imgH / Math.max(1, imgW))).toFixed(2));
    var contentStr = 'q\n' + pageW.toFixed(2) + ' 0 0 ' + pageH.toFixed(2) + ' 0 0 cm\n/Im0 Do\nQ\n';

    var enc = new TextEncoder();
    var chunks = [];
    var offsets = [0];
    var byteLen = 0;

    function pushStr(s) {
      var b = enc.encode(s);
      chunks.push(b);
      byteLen += b.byteLength;
    }
    function pushBytes(b) {
      chunks.push(b);
      byteLen += b.byteLength;
    }
    function startObj() {
      offsets.push(byteLen);
    }

    pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

    startObj();
    pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    startObj();
    pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

    startObj();
    pushStr(
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' +
      pageW.toFixed(2) + ' ' + pageH.toFixed(2) +
      '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n'
    );

    startObj();
    pushStr(
      '4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + imgW +
      ' /Height ' + imgH +
      ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' +
      jpegBytes.byteLength + ' >>\nstream\n'
    );
    pushBytes(jpegBytes);
    pushStr('\nendstream\nendobj\n');

    startObj();
    pushStr(
      '5 0 obj\n<< /Length ' + contentStr.length + ' >>\nstream\n' +
      contentStr + 'endstream\nendobj\n'
    );

    var xrefOffset = byteLen;
    var xref = 'xref\n0 6\n0000000000 65535 f \n';
    for (var i = 1; i <= 5; i++) {
      xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }
    xref += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n';
    pushStr(xref);

    return new Blob(chunks, { type: 'application/pdf' });
  }

  /**
   * Draws a single ID card onto `ctx` at `(x, y, w, h)` with optional PVC rounded corners,
   * card border, and outer scissor cut marks, scaled proportionally by `scaleRatio` (1 = 300 DPI).
   */
  function drawCardWithOptions(ctx, img, x, y, w, h, roundCorner, showBorder, showCutMarks, scaleRatio) {
    var sr = scaleRatio || 1;
    var r = roundCorner ? Math.round(Math.min(w, h) * 0.055) : 0;
    ctx.save();
    ctx.beginPath();
    if (r > 0 && ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
    } else if (r > 0) {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.save();
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();

    if (showBorder) {
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.28)';
      ctx.lineWidth = Math.max(1, 3 * sr);
      ctx.stroke();
    }
    ctx.restore();

    if (showCutMarks) {
      ctx.save();
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.55)';
      ctx.lineWidth = Math.max(1, 2 * sr);
      var tick = Math.max(6, Math.round(22 * sr));
      var off = Math.max(3, Math.round(10 * sr));
      // Top-left
      ctx.beginPath();
      ctx.moveTo(x - off - tick, y); ctx.lineTo(x - off, y);
      ctx.moveTo(x, y - off - tick); ctx.lineTo(x, y - off);
      // Top-right
      ctx.moveTo(x + w + off, y); ctx.lineTo(x + w + off + tick, y);
      ctx.moveTo(x + w, y - off - tick); ctx.lineTo(x + w, y - off);
      // Bottom-right
      ctx.moveTo(x + w + off, y + h); ctx.lineTo(x + w + off + tick, y + h);
      ctx.moveTo(x + w, y + h + off); ctx.lineTo(x + w, y + h + off + tick);
      // Bottom-left
      ctx.moveTo(x - off - tick, y + h); ctx.lineTo(x - off, y + h);
      ctx.moveTo(x, y + h + off); ctx.lineTo(x, y + h + off + tick);
      ctx.stroke();
      ctx.restore();
    }
  }

  function readCombineControlState() {
    var modeEl = $('input[name="imgCombineMode"]:checked');
    var mode = modeEl ? modeEl.value : 'nid-a4';
    var scanEl = $('input[name="imgCombineScanMode"]:checked');
    var scanMode = scanEl ? scanEl.value : 'original';

    var br = $('#imgCombineBright') ? (parseInt($('#imgCombineBright').value, 10) || 100) : 100;
    var ct = $('#imgCombineContrast') ? (parseInt($('#imgCombineContrast').value, 10) || 100) : 100;
    var st = $('#imgCombineSat') ? Number($('#imgCombineSat').value) : 100;
    var sharp = $('#imgCombineSharp') ? (parseInt($('#imgCombineSharp').value, 10) || 0) : 20;

    if ($('#imgCombineBrightVal')) $('#imgCombineBrightVal').textContent = toBn(br) + '%';
    if ($('#imgCombineContrastVal')) $('#imgCombineContrastVal').textContent = toBn(ct) + '%';
    if ($('#imgCombineSatVal')) $('#imgCombineSatVal').textContent = toBn(st) + '%';
    if ($('#imgCombineSharpVal')) $('#imgCombineSharpVal').textContent = toBn(sharp) + '%';

    updateNidRightPanelBadges();

    var cardWEl = $('#imgCombineCardW');
    var cardWInput = Math.max(420, Math.min(950, parseInt(cardWEl && cardWEl.value, 10) || 660));
    syncNidSizePresetButtons(cardWInput);

    return {
      mode: mode,
      scanMode: scanMode,
      br: br,
      ct: ct,
      st: st,
      sharp: sharp,
      cardWInput: cardWInput,
      gap: Math.max(0, parseInt($('#imgCombineGap') && $('#imgCombineGap').value, 10) || 36),
      bg: ($('#imgCombineBg') && $('#imgCombineBg').value) || '#ffffff',
      alignMode: $('#imgCombineAlign') ? $('#imgCombineAlign').value : 'top',
      copySets: $('#imgCombineCopies') ? (parseInt($('#imgCombineCopies').value, 10) || 1) : 1,
      roundCorner: $('#imgCombineRoundCorner') ? $('#imgCombineRoundCorner').checked : true,
      showBorder: $('#imgCombineCardBorder') ? $('#imgCombineCardBorder').checked : true,
      showCutMarks: $('#imgCombineCutMarks') ? $('#imgCombineCutMarks').checked : false
    };
  }

  function syncNidSizePresetButtons(cardWVal) {
    var btns = $$('[data-cardw]');
    if (!btns.length) return;
    btns.forEach(function (b) {
      var v = parseInt(b.getAttribute('data-cardw'), 10);
      var match = Math.abs(v - cardWVal) <= 12;
      b.classList.toggle('active', match);
      b.setAttribute('aria-pressed', match ? 'true' : 'false');
    });
  }

  function measureCardForLongEdge(c, longPx) {
    var cw0 = Math.max(1, (c && c.width) || 1);
    var ch0 = Math.max(1, (c && c.height) || 1);
    if (ch0 > cw0) {
      return { img: c, w: Math.max(1, Math.round(cw0 * (longPx / ch0))), h: Math.max(1, Math.round(longPx)) };
    }
    return { img: c, w: Math.max(1, Math.round(longPx)), h: Math.max(1, Math.round(ch0 * (longPx / cw0))) };
  }

  /**
   * Synchronously composes the output sheet onto `canvas` at the requested `dpiScale`
   * (`dpiScale = 0.65` for 60fps interactive live preview, `dpiScale = 2` for 300-DPI print master).
   * Returns `{ width, height, fullW, fullH, printWidthMm }`.
   */
  function composeCombineSheetCanvas(canvas, processedCards, cfg, dpiScale) {
    var sr = dpiScale / 2;
    var mode = cfg.mode;
    var gap = cfg.gap;
    var bg = cfg.bg;
    var alignMode = cfg.alignMode;
    var copySets = cfg.copySets;
    var roundCorner = cfg.roundCorner;
    var showBorder = cfg.showBorder;
    var showCutMarks = cfg.showCutMarks;
    var fullW = 2480, fullH = 3508;
    var cardWNum = Math.max(420, Math.min(950, Number(cfg.cardWInput) || 660));

    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = dpiScale < 1 ? 'medium' : 'high';

    if (mode === 'nid-a4' || mode === 'nid-a4-side') {
      fullW = 2480;
      fullH = 3508;
      var cw = Math.round(fullW * sr);
      var ch = Math.round(fullH * sr);
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cw, ch);

      var cardLongPx = Math.round(Math.max(520, Math.min(2200, cardWNum * 2)) * sr);
      var gapPx = Math.round(gap * dpiScale);

      if (mode === 'nid-a4-side' && processedCards.length >= 2) {
        var pairBase = processedCards.slice(0, 2).map(function (c) {
          return measureCardForLongEdge(c, cardLongPx);
        });
        var maxSideAvailW = cw - Math.round(200 * sr);
        var sideScale = Math.min(1, (maxSideAvailW - gapPx) / Math.max(1, pairBase[0].w + pairBase[1].w));
        var rowsCount = copySets;
        var rowGapSide = Math.round(gapPx * 1.4);
        var baseRowH = Math.max(pairBase[0].h, pairBase[1].h);
        var maxSideAvailH = ch - Math.round(220 * sr);
        var allSideH0 = rowsCount * (baseRowH * sideScale) + Math.max(0, rowsCount - 1) * rowGapSide;
        if (allSideH0 > maxSideAvailH && rowsCount > 0) {
          var vSideScale = Math.max(0.25, (maxSideAvailH - Math.max(0, rowsCount - 1) * rowGapSide) / Math.max(1, rowsCount * baseRowH));
          sideScale = Math.min(sideScale, vSideScale);
        }
        var pairItems = pairBase.map(function (p) {
          return { img: p.img, w: Math.max(1, Math.round(p.w * sideScale)), h: Math.max(1, Math.round(p.h * sideScale)) };
        });
        var rowH = Math.max(pairItems[0].h, pairItems[1].h);
        var totalPairW = pairItems[0].w + gapPx + pairItems[1].w;
        var startX = Math.round((cw - totalPairW) / 2);
        var allRowsH = rowsCount * rowH + Math.max(0, rowsCount - 1) * rowGapSide;
        var startY = alignMode === 'center'
          ? Math.max(Math.round(140 * sr), Math.round((ch - allRowsH) / 2))
          : Math.round(220 * sr);

        for (var rIdx = 0; rIdx < rowsCount; rIdx++) {
          var ry = Math.round(startY + rIdx * (rowH + rowGapSide));
          if (ry + rowH > ch - Math.round(80 * sr)) break;
          var y0 = ry + Math.round((rowH - pairItems[0].h) / 2);
          var y1 = ry + Math.round((rowH - pairItems[1].h) / 2);
          drawCardWithOptions(ctx, pairItems[0].img, startX, y0, pairItems[0].w, pairItems[0].h, roundCorner, showBorder, showCutMarks, sr);
          drawCardWithOptions(ctx, pairItems[1].img, startX + pairItems[0].w + gapPx, y1, pairItems[1].w, pairItems[1].h, roundCorner, showBorder, showCutMarks, sr);
        }
      } else {
        var colsCount = copySets >= 2 ? 2 : 1;
        var rowsSets = copySets === 4 ? 2 : 1;
        var colGap = Math.round(gapPx * 1.6);
        var rowGapA4 = gapPx * 2;
        var measured = processedCards.map(function (c) {
          return measureCardForLongEdge(c, cardLongPx);
        });
        var maxBaseW = 0;
        var sumBaseH = 0;
        measured.forEach(function (m) {
          if (m.w > maxBaseW) maxBaseW = m.w;
          sumBaseH += m.h;
        });
        var maxAvailW = cw - Math.round(220 * sr);
        var maxAvailH = ch - Math.round(220 * sr);
        var fitWScale = (maxAvailW - (colsCount - 1) * colGap) / Math.max(1, colsCount * maxBaseW);
        var cardGapsPerSet = gapPx * Math.max(0, measured.length - 1);
        var fitHScale = (maxAvailH - rowsSets * cardGapsPerSet - (rowsSets - 1) * rowGapA4) / Math.max(1, rowsSets * sumBaseH);
        var a4Scale = Math.min(1, fitWScale, fitHScale);
        if (a4Scale < 0.25) a4Scale = 0.25;

        var oneSetH = 0;
        var colBoxW = 0;
        var scaled = measured.map(function (m) {
          var w = Math.max(1, Math.round(m.w * a4Scale));
          var h = Math.max(1, Math.round(m.h * a4Scale));
          if (w > colBoxW) colBoxW = w;
          oneSetH += h;
          return { img: m.img, w: w, h: h };
        });
        oneSetH += cardGapsPerSet;

        var totalBlockH = rowsSets * oneSetH + (rowsSets - 1) * rowGapA4;
        var baseTopY = alignMode === 'center'
          ? Math.max(Math.round(140 * sr), Math.round((ch - totalBlockH) / 2))
          : Math.round(220 * sr);

        var totalColsW = colsCount * colBoxW + (colsCount - 1) * colGap;
        var baseLeftX = Math.round((cw - totalColsW) / 2);

        for (var rs = 0; rs < rowsSets; rs++) {
          for (var cs = 0; cs < colsCount; cs++) {
            var colX = baseLeftX + cs * (colBoxW + colGap);
            var curY = baseTopY + rs * (oneSetH + rowGapA4);
            scaled.forEach(function (s) {
              var drawX = colX + Math.round((colBoxW - s.w) / 2);
              drawCardWithOptions(ctx, s.img, drawX, curY, s.w, s.h, roundCorner, showBorder, showCutMarks, sr);
              curY += s.h + gapPx;
            });
          }
        }
      }
    } else if (mode === 'vertical') {
      var fullLongV = Math.max(520, Math.min(2200, cardWNum * 2));
      var targetLongV = Math.round(fullLongV * sr);
      var pad = Math.round(gap * 2 * sr);
      var vGap = Math.round(gap * 2 * sr);
      var maxRowW = 0, maxFullRowW = 0;
      var sumH = pad * 2 + vGap * Math.max(0, processedCards.length - 1);
      var fullSumH = (gap * 4) + (gap * 2) * Math.max(0, processedCards.length - 1);
      var rows = processedCards.map(function (c) {
        var r = measureCardForLongEdge(c, targetLongV);
        var rf = measureCardForLongEdge(c, fullLongV);
        if (r.w > maxRowW) maxRowW = r.w;
        if (rf.w > maxFullRowW) maxFullRowW = rf.w;
        sumH += r.h;
        fullSumH += rf.h;
        return r;
      });
      fullW = Math.max(200, maxFullRowW + gap * 4);
      fullH = Math.max(200, fullSumH);
      var cwV = Math.max(120, maxRowW + pad * 2);
      var chV = Math.max(120, sumH);
      if (canvas.width !== cwV) canvas.width = cwV;
      if (canvas.height !== chV) canvas.height = chV;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      var y = pad;
      rows.forEach(function (r) {
        var rx = Math.round((cwV - r.w) / 2);
        drawCardWithOptions(ctx, r.img, rx, y, r.w, r.h, roundCorner, showBorder, showCutMarks, sr);
        y += r.h + vGap;
      });
    } else {
      var fullLongH = Math.max(520, Math.min(2200, cardWNum * 2));
      var targetLongH = Math.round(fullLongH * sr);
      var padH = Math.round(gap * 2 * sr);
      var hGap = Math.round(gap * 2 * sr);
      var maxColH = 0, maxFullColH = 0;
      var sumW = padH * 2 + hGap * Math.max(0, processedCards.length - 1);
      var fullSumW = (gap * 4) + (gap * 2) * Math.max(0, processedCards.length - 1);
      var cols = processedCards.map(function (c) {
        var col = measureCardForLongEdge(c, targetLongH);
        var colF = measureCardForLongEdge(c, fullLongH);
        if (col.h > maxColH) maxColH = col.h;
        if (colF.h > maxFullColH) maxFullColH = colF.h;
        sumW += col.w;
        fullSumW += colF.w;
        return col;
      });
      fullW = Math.max(200, fullSumW);
      fullH = Math.max(200, maxFullColH + gap * 4);
      var cwH = Math.max(120, sumW);
      var chH = Math.max(120, maxColH + padH * 2);
      if (canvas.width !== cwH) canvas.width = cwH;
      if (canvas.height !== chH) canvas.height = chH;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      var x = padH;
      cols.forEach(function (c) {
        var cy = Math.round((chH - c.h) / 2);
        drawCardWithOptions(ctx, c.img, x, cy, c.w, c.h, roundCorner, showBorder, showCutMarks, sr);
        x += c.w + hGap;
      });
    }

    var printWidthMm = (mode === 'nid-a4' || mode === 'nid-a4-side')
      ? 210
      : +(fullW * 210 / 2480).toFixed(2);
    return { width: canvas.width, height: canvas.height, fullW: fullW, fullH: fullH, printWidthMm: printWidthMm };
  }

  var nidLiveRafId = 0;
  var nidIdleExportTimer = 0;
  var nidExportPromise = null;

  /**
   * Synchronously renders the 60fps live preview onto `#nidLivePreviewCanvas` (< 2ms)
   * without blocking the UI thread or flickering export buttons.
   */
  function renderCombineLivePreview() {
    if (!combineItems.length) return;
    combineToken++;
    var cfg = readCombineControlState();
    var previewCards = combineItems.map(function (entry) {
      var es = getEntryColorState(entry);
      return renderProcessedCardCanvas(entry, es.scanMode, es.br, es.ct, es.st, es.sharp, true, es.deglare, es.textBoost);
    });

    updateNidSidebarThumbnails(previewCards);

    var liveCanvas = $('#nidLivePreviewCanvas');
    var outImg = $('#imgCombineOutPreview');
    if (liveCanvas) {
      var dims = composeCombineSheetCanvas(liveCanvas, previewCards, cfg, 0.65);
      liveCanvas.hidden = false;
      if (outImg) outImg.hidden = true;
      var isA4Live = cfg.mode === 'nid-a4' || cfg.mode === 'nid-a4-side';
      var isActualLive = cfg.cardWInput <= 525;
      $('#nidPreviewPanel').style.setProperty('--nid-output-ratio', dims.fullW / dims.fullH);
      $('#nidPaperLabel').textContent = isA4Live
        ? (isActualLive ? tr('A4 · আসল ID (85.6×54mm)', 'A4 · Actual ID (85.6×54mm)') : 'A4 · 210 × 297 mm')
        : (isActualLive ? tr('আসল ID · 85.6×54 mm', 'Actual ID · 85.6×54 mm') : tr('কার্ড লেআউট', 'Card Layout'));
      var sizeTxt = combineOut.blob ? (' • ' + fmtSize(combineOut.blob.size)) : '';
      $('#imgCombineOutMeta').textContent = dims.fullW + ' × ' + dims.fullH + ' px (300 DPI)' + sizeTxt;
      $('#imgCombineSummary').textContent = toBn(combineItems.length) + tr('টি কার্ড • ', ' cards • ') + toBn(cfg.copySets) + tr(' সেট • 300 DPI HD', ' sets • 300 DPI HD') + sizeTxt;
    }
    combineOut.dirty = true;
    setNidExportReady(true);
    scheduleFullResCombineExport();
  }

  function scheduleCombineLiveRender() {
    if (!combineItems.length) return;
    // Update slider numeric labels immediately on the same tick
    readCombineControlState();
    if (nidLiveRafId) return;
    nidLiveRafId = requestAnimationFrame(function () {
      nidLiveRafId = 0;
      renderCombineLivePreview();
    });
  }

  function scheduleFullResCombineExport() {
    if (nidIdleExportTimer) clearTimeout(nidIdleExportTimer);
    // Never run the heavy 300-DPI export while a crop handle is being dragged (prevents drag stutter)
    if (nidCropDragActive) {
      nidIdleExportTimer = 0;
      nidExportPendingAfterDrag = true;
      return;
    }
    nidExportPendingAfterDrag = false;
    nidIdleExportTimer = setTimeout(function () {
      nidIdleExportTimer = 0;
      if (nidCropDragActive) { nidExportPendingAfterDrag = true; return; }
      buildFullResCombineExport(true);
    }, 220);
  }

  async function buildFullResCombineExport(yieldBetweenCards) {
    if (!combineItems.length) return;
    var token = ++combineToken;
    var cfg = readCombineControlState();

    var processedCards = [];
    for (var i = 0; i < combineItems.length; i++) {
      if (yieldBetweenCards && i > 0) {
        await new Promise(function (r) { setTimeout(r, 0); });
        if (token !== combineToken) return;
      }
      var entry = combineItems[i];
      var es = getEntryColorState(entry);
      var c = renderProcessedCardCanvas(entry, es.scanMode, es.br, es.ct, es.st, es.sharp, false, es.deglare, es.textBoost);
      entry.croppedCanvas = c;
      processedCards.push(c);
    }

    if (yieldBetweenCards) {
      await new Promise(function (r) { setTimeout(r, 0); });
      if (token !== combineToken) return;
    }

    var canvas = document.createElement('canvas');
    var sheetDims = composeCombineSheetCanvas(canvas, processedCards, cfg, 2);

    var blob = await canvasToBlob(canvas, 'image/jpeg', 0.96);
    if (token !== combineToken) return;
    if (combineOut.url) URL.revokeObjectURL(combineOut.url);
    combineOut.blob = blob;
    combineOut.url = URL.createObjectURL(blob);
    combineOut.width = canvas.width;
    combineOut.height = canvas.height;
    combineOut.mode = cfg.mode;
    combineOut.cardWInput = cfg.cardWInput;
    combineOut.printWidthMm = sheetDims.printWidthMm;
    combineOut.dirty = false;

    var outImg = $('#imgCombineOutPreview');
    var liveCanvas = $('#nidLivePreviewCanvas');
    if (outImg) outImg.src = combineOut.url;
    if (liveCanvas) {
      liveCanvas.hidden = false;
      if (outImg) outImg.hidden = true;
      var lctx = liveCanvas.getContext('2d');
      lctx.imageSmoothingEnabled = true;
      lctx.imageSmoothingQuality = 'high';
      lctx.drawImage(canvas, 0, 0, liveCanvas.width, liveCanvas.height);
    } else if (outImg) {
      outImg.hidden = false;
    }
    var isA4Full = cfg.mode === 'nid-a4' || cfg.mode === 'nid-a4-side';
    var isActualFull = cfg.cardWInput <= 525;
    $('#nidPreviewPanel').style.setProperty('--nid-output-ratio', canvas.width / canvas.height);
    $('#nidPaperLabel').textContent = isA4Full
      ? (isActualFull ? tr('A4 · আসল ID (85.6×54mm)', 'A4 · Actual ID (85.6×54mm)') : 'A4 · 210 × 297 mm')
      : (isActualFull ? tr('আসল ID · 85.6×54 mm', 'Actual ID · 85.6×54 mm') : tr('কার্ড লেআউট', 'Card Layout'));
    $('#imgCombineOutMeta').textContent = canvas.width + ' × ' + canvas.height + ' px (300 DPI) • ' + fmtSize(blob.size);
    $('#imgCombineSummary').textContent = toBn(combineItems.length) + tr('টি কার্ড • ', ' cards • ') + toBn(cfg.copySets) + tr(' সেট • 300 DPI HD • ', ' sets • 300 DPI HD • ') + fmtSize(blob.size);
    setNidExportReady(true);
  }

  async function ensureFullResCombineOutput() {
    if (nidLiveRafId) {
      cancelAnimationFrame(nidLiveRafId);
      nidLiveRafId = 0;
      renderCombineLivePreview();
    }
    if (nidIdleExportTimer) {
      clearTimeout(nidIdleExportTimer);
      nidIdleExportTimer = 0;
    }
    if (combineOut.dirty || !combineOut.blob) {
      await buildFullResCombineExport();
    }
  }

  async function renderCombineOutput() {
    if (!combineItems.length) return;
    if (nidLiveRafId) {
      cancelAnimationFrame(nidLiveRafId);
      nidLiveRafId = 0;
    }
    renderCombineLivePreview();
    if (nidIdleExportTimer) {
      clearTimeout(nidIdleExportTimer);
      nidIdleExportTimer = 0;
    }
    await buildFullResCombineExport();
  }

  function stopNidCamera() {
    if (nidCamStream) {
      nidCamStream.getTracks().forEach(function (t) { t.stop(); });
      nidCamStream = null;
    }
    var v = $('#nidCameraVideo');
    if (v) v.srcObject = null;
  }

  async function openNidCamera(slotIdx) {
    if ((typeof slotIdx !== 'number' || slotIdx < 0 || slotIdx >= MAX_NID_SIDES) && combineItems.length >= MAX_NID_SIDES) {
      showMaxNidSidesToast();
      return;
    }
    nidCamSlot = typeof slotIdx === 'number' ? slotIdx : -1;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      var fallbackIn = slotIdx === 0 ? $('#nidFrontInput') : (slotIdx === 1 ? $('#nidBackInput') : $('#imgCombineInput'));
      if (fallbackIn) fallbackIn.click();
      return;
    }
    try {
      stopNidCamera();
      nidCamStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nidCamFacing, width: { ideal: 1600 }, height: { ideal: 1000 } },
        audio: false
      });
      var video = $('#nidCameraVideo');
      video.srcObject = nidCamStream;
      openDialog($('#nidCameraDialog'));
    } catch (e) {
      showToast(tr('ক্যামেরা চালু করা যায়নি — অনুগ্রহ করে ফাইল সিলেক্ট করুন', 'Could not open camera — please select a file'));
      var fb = slotIdx === 0 ? $('#nidFrontInput') : (slotIdx === 1 ? $('#nidBackInput') : $('#imgCombineInput'));
      if (fb) fb.click();
    }
  }


  function initNidScanner() {
    var pane = $('#img-pane-combine');
    if (!pane || pane.dataset.nidBound === '1') return;
    pane.dataset.nidBound = '1';
    // 5. CamScanner ID Card Scanner & Combine Images
    setNidExportReady(false);
    $$('[data-nid-view], [data-nid-mobile-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = btn.getAttribute('data-nid-view') || btn.getAttribute('data-nid-mobile-tab');
        switchNidView(v);
      });
    });
    on('nidSidebarToggleBtn', 'click', function () {
      var pane = $('#img-pane-combine');
      if (!pane) return;
      var collapsed = pane.getAttribute('data-sidebar-collapsed') === 'true';
      pane.setAttribute('data-sidebar-collapsed', collapsed ? 'false' : 'true');
      $('#nidSidebarToggleBtn').setAttribute('aria-pressed', collapsed ? 'true' : 'false');
      requestAnimationFrame(function () {
        if (nidFitMode) fitNidCanvas(); else syncNidViewport();
      });
    });
    $$('[data-nid-canvas-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var clickedView = btn.getAttribute('data-nid-canvas-view') || 'split';
        var pane = $('#img-pane-combine');
        var curView = (pane && pane.getAttribute('data-view')) || 'split';
        // Clicking 'crop' again when already in 'crop' mode completes cropping and switches to 'preview'
        var view = (clickedView === 'crop' && curView === 'crop') ? 'preview' : clickedView;
        if (pane) pane.setAttribute('data-view', view);
        $$('[data-nid-canvas-view]').forEach(function (b) {
          b.setAttribute('aria-pressed', b.getAttribute('data-nid-canvas-view') === view ? 'true' : 'false');
        });
        if (view === 'preview') {
          renderCombineLivePreview();
          if (clickedView === 'crop' && curView === 'crop') {
            showToast(tr('ক্রপ সম্পন্ন — প্রিভিউ আপডেট হয়েছে!', 'Crop completed — preview updated!'));
          }
        }
        requestAnimationFrame(function () {
          if (nidFitMode) fitNidCanvas(); else syncNidViewport();
        });
      });
    });
    on('nidDoneCropBtn', 'click', function () {
      var pane = $('#img-pane-combine');
      if (!pane) return;
      var nextView = 'preview';
      pane.setAttribute('data-view', nextView);
      $$('[data-nid-canvas-view]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-nid-canvas-view') === nextView ? 'true' : 'false');
      });
      renderCombineLivePreview();
      requestAnimationFrame(function () {
        if (nidFitMode) fitNidCanvas(); else syncNidViewport();
      });
      showToast(tr('ক্রপ সম্পন্ন — প্রিভিউ আপডেট হয়েছে!', 'Crop completed — preview updated!'));
    });
    $$('[data-nid-insp-tab]').forEach(function (tabBtn) {
      tabBtn.addEventListener('click', function () {
        var tab = tabBtn.getAttribute('data-nid-insp-tab') || 'filters';
        activateNidInspectorTab(tab);
      });
    });

    // Wire CamScanner Mobile Top & Bottom Controls (< 1024px)
    on('nidMobBackBtn', 'click', function () {
      var pane = $('#img-pane-combine');
      var step = (pane && pane.getAttribute('data-mobile-step')) || 'crop';
      if (step !== 'crop') {
        setNidMobileStep('crop');
      } else {
        var clr = $('#imgCombineClearBtn');
        if (clr) clr.click();
      }
    });
    on('nidMobUndoBtn', 'click', function () {
      var b = $('#nidUndoBtn');
      if (b && !b.disabled) b.click();
    });
    on('nidMobRedoBtn', 'click', function () {
      var b = $('#nidRedoBtn');
      if (b && !b.disabled) b.click();
    });
    on('nidMobFrontPill', 'click', function () {
      if (!combineItems.length) {
        var inp = $('#nidReplaceFrontInput') || $('#nidFrontInput');
        if (inp) inp.click();
        return;
      }
      activeNidIdx = 0;
      if (nidColorTarget !== 'all') nidColorTarget = '0';
      setNidMobileStep('crop');
      renderNidCardTabs();
      syncNidDeskewControl();
      syncNidColorControlsFromTarget();
      drawNidCropSourceCanvas();
    });
    on('nidMobBackPill', 'click', function () {
      if (combineItems.length < 2) {
        var inp = $('#nidReplaceBackInput') || $('#nidBackInput');
        if (inp) inp.click();
        return;
      }
      activeNidIdx = 1;
      if (nidColorTarget !== 'all') nidColorTarget = '1';
      setNidMobileStep('crop');
      renderNidCardTabs();
      syncNidDeskewControl();
      syncNidColorControlsFromTarget();
      drawNidCropSourceCanvas();
    });
    on('nidMobSwapBtn', 'click', function () {
      var b = $('#imgCombineSwapBtn');
      if (b && combineItems.length >= 2) b.click();
    });
    on('nidMobCamBtn', 'click', function () {
      openNidCamera(combineItems.length === 1 ? 1 : -1);
    });
    on('nidMobPagesBtn', 'click', function () {
      var pane = $('#img-pane-combine');
      var curStep = (pane && pane.getAttribute('data-mobile-step')) || 'crop';
      setNidMobileStep(curStep === 'pages' ? 'crop' : 'pages');
    });
    on('nidMobClosePagesBtn', 'click', function () {
      setNidMobileStep('crop');
    });
    on('nidMobSnapRatio', 'click', function () { var b = $('#nidSnapRatioBtn'); if (b) b.click(); });
    on('nidMobSnapPortrait', 'click', function () { var b = $('#nidSnapPortraitRatioBtn'); if (b) b.click(); });
    on('nidMobFullCrop', 'click', function () { var b = $('#nidFullCropBtn'); if (b) b.click(); });
    on('nidMobCloneSide', 'click', function () { var b = $('#nidCloneSameImgBtn'); if (b) b.click(); });
    on('nidMobRotL', 'click', function () { var b = $('#nidRotLBtn'); if (b) b.click(); });
    on('nidMobRotR', 'click', function () { var b = $('#nidRotRBtn'); if (b) b.click(); });
    on('nidMobFlipH', 'click', function () { var b = $('#nidFlipHBtn'); if (b) b.click(); });
    on('nidMobAutoCrop', 'click', function () { var b = $('#nidAutoCropBtn'); if (b) b.click(); });
    on('nidMobNextStepBtn', 'click', function () {
      setNidMobileStep('enhance', 'filters');
      showToast(tr('ক্রপ সম্পন্ন — ফিল্টার ও A4 প্রিভিউ প্রস্তুত!', 'Crop complete — filters & A4 preview ready!'));
    });
    $$('[data-nid-mob-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setNidMobileStep(btn.getAttribute('data-nid-mob-step') || 'crop');
      });
    });
    $$('[data-nid-mob-insp]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.getAttribute('data-nid-mob-insp') || 'filters';
        setNidMobileStep('enhance', tab);
      });
    });
    on('nidMobPdfBtn', 'click', function () {
      var b = $('#imgCombineDownloadPdfBtn');
      if (b) b.click();
    });
    on('nidMobJpgBtn', 'click', function () {
      var b = $('#imgCombineDownloadBtn');
      if (b) b.click();
    });
    wireDropzone($('#imgCombineDropzone'), $('#imgCombineInput'), addCombineFiles);
    if ($('#imgCombineDropzone')) {
      $('#imgCombineDropzone').addEventListener('click', function (e) {
        if (e.target.closest('label, button, input, a')) return;
        var inp = $('#imgCombineInput');
        if (inp) inp.click();
      });
    }
    if ($('#imgCombineStage') && !$('#imgCombineStage')._thStageDropWired) {
      $('#imgCombineStage')._thStageDropWired = true;
      ['dragenter', 'dragover'].forEach(function (ev) {
        $('#imgCombineStage').addEventListener(ev, function (e) {
          if (e.dataTransfer && e.dataTransfer.types && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') !== -1) {
            e.preventDefault();
          }
        });
      });
      $('#imgCombineStage').addEventListener('drop', function (e) {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
          e.preventDefault();
          e.stopPropagation();
          addCombineFiles(Array.prototype.slice.call(e.dataTransfer.files));
        }
      });
    }
    if (!document._thNidPasteWired) {
      document._thNidPasteWired = true;
      document.addEventListener('paste', function (e) {
        var paneEl = $('#img-pane-combine');
        if (!paneEl || paneEl.hidden || !paneEl.offsetParent) return;
        var activeEl = document.activeElement;
        if (activeEl && /^(INPUT|TEXTAREA|SELECT)$/i.test(activeEl.tagName) && activeEl.type !== 'file' && activeEl.type !== 'radio' && activeEl.type !== 'checkbox') return;
        var items = e.clipboardData && e.clipboardData.items;
        if (!items) return;
        var pastedFiles = [];
        for (var pi = 0; pi < items.length; pi++) {
          if (items[pi].kind === 'file' && /^image\//i.test(items[pi].type || '')) {
            var f = items[pi].getAsFile();
            if (f) pastedFiles.push(f);
          }
        }
        if (pastedFiles.length) {
          e.preventDefault();
          addCombineFiles(pastedFiles);
        }
      });
    }
    installNidViewport();
    installNidCropInteraction();
    on('nidReplaceActiveBtn', 'click', function () {
      if (activeNidIdx < 2) {
        $(activeNidIdx === 0 ? '#nidReplaceFrontInput' : '#nidReplaceBackInput').click();
      } else {
        $('#nidReplaceExtraInput').click();
      }
    });
    on('nidReplaceExtraInput', 'change', async function (e) {
      var index = activeNidIdx;
      var file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        var loaded = await loadImageFile(file);
        if (!combineItems[index]) return;
        combineItems[index] = createCombineEntry(loaded);
        clearNidHistory();
        renderNidCardTabs(); syncNidDeskewControl(); drawNidCropSourceCanvas();
        renderCombineLivePreview();
      } catch (err) { showToast(tr('ছবিটি লোড করা যায়নি', 'Failed to load image')); }
    });
    ['nidFrontInput', 'nidReplaceFrontInput'].forEach(function (id) {
      on(id, 'change', function (e) {
        if (e.target.files && e.target.files.length) {
          setCombineSlotFile(0, e.target.files[0]);
          e.target.value = '';
        }
      });
    });
    ['nidBackInput', 'nidReplaceBackInput'].forEach(function (id) {
      on(id, 'change', function (e) {
        if (e.target.files && e.target.files.length) {
          setCombineSlotFile(1, e.target.files[0]);
          e.target.value = '';
        }
      });
    });
    $$('label[for="imgCombineAddMore"]').forEach(function (lbl) {
      lbl.addEventListener('click', function (e) {
        if (combineItems.length >= MAX_NID_SIDES) {
          e.preventDefault();
          showMaxNidSidesToast();
        }
      });
    });
    on('imgCombineAddMore', 'change', function (e) {
      if (e.target.files && e.target.files.length) {
        addCombineFiles(Array.prototype.slice.call(e.target.files));
        e.target.value = '';
      }
    });
    on('nidCloneSameImgBtn', 'click', function () {
      cloneCurrentImageToOtherSide();
    });
    on('nidAutoCropBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      pushNidHistory();
      var orient = getNidCardOrient(entry);
      var det = autoDetectCardQuad(entry.item.img, entry.rot, entry.flipH || 1, null, null, true, orient);
      var prevRot = (((entry.rot || 0) % 360) + 360) % 360;
      if (typeof det.rot === 'number') entry.rot = det.rot;
      entry.pts = det.pts;
      entry.autoDetected = true;
      if (typeof det.rot === 'number' && det.rot !== prevRot) {
        drawNidCropSourceCanvas();
      }
      positionNidQuadDOM({ snapped: true });
      triggerNidScanAnimation();
      renderCombineLivePreview();
      showToast(orient === 'portrait'
        ? tr('পোর্ট্রেট আইডি কার্ডের এজ অটো-ডিটেক্ট ও সোজা করা হয়েছে!', 'Portrait ID card edges auto-detected & straightened!')
        : tr('আইডি কার্ডের এজ অটো-ডিটেক্ট ও সোজা করা হয়েছে!', 'ID card edges auto-detected & straightened!'));
    });
    on('nidTightenCropBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      pushNidHistory();
      adjustQuadMargin(entry, -0.012);
      positionNidQuadDOM({ snapped: true });
      renderCombineLivePreview();
      showToast(tr('চারপাশের বর্ডার সামান্য টাইট করা হয়েছে', 'Border margins slightly tightened'));
    });
    on('nidExpandCropBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      pushNidHistory();
      adjustQuadMargin(entry, 0.012);
      positionNidQuadDOM({ snapped: true });
      renderCombineLivePreview();
      showToast(tr('চারপাশের বর্ডার মার্জিন বাড়ানো হয়েছে', 'Border margins expanded'));
    });
    on('nidMagSnapBtn', 'click', function () {
      nidMagSnapEnabled = !nidMagSnapEnabled;
      var btn = $('#nidMagSnapBtn');
      if (btn) {
        btn.setAttribute('aria-pressed', nidMagSnapEnabled ? 'true' : 'false');
        btn.classList.toggle('chip-btn--accent', nidMagSnapEnabled);
        var bnTitle = nidMagSnapEnabled ? 'ম্যাগনেটিক স্ন্যাপ: চালু' : 'ম্যাগনেটিক স্ন্যাপ: বন্ধ';
        var enTitle = nidMagSnapEnabled ? 'Magnetic Snap: On' : 'Magnetic Snap: Off';
        btn.setAttribute('data-i18n-title-bn', bnTitle);
        btn.setAttribute('data-i18n-title-en', enTitle);
        btn.title = tr(bnTitle, enTitle);
        var txtSpan = btn.querySelector('.nid-btn-txt');
        if (txtSpan) {
          txtSpan.textContent = nidMagSnapEnabled ? tr('স্ন্যাপ: চালু', 'Snap: On') : tr('স্ন্যাপ: বন্ধ', 'Snap: Off');
        }
      }
      showToast(nidMagSnapEnabled ? tr('ম্যাগনেটিক এজ স্ন্যাপ চালু হয়েছে', 'Magnetic edge snap enabled') : tr('ম্যাগনেটিক এজ স্ন্যাপ বন্ধ করা হয়েছে', 'Magnetic edge snap disabled'));
    });
    function applyNidOrientationSelection(targetOrient) {
      var orient = targetOrient === 'portrait' ? 'portrait' : 'landscape';
      nidCardOrient = orient;
      var entry = combineItems[activeNidIdx];
      if (!entry) {
        syncNidOrientButtons();
        showToast(orient === 'portrait'
          ? tr('পোর্ট্রেট আইডি কার্ড (54×85.6mm) সিলেক্ট করা হয়েছে — ছবি আপলোড করলেই পোর্ট্রেট কার্ড অটো-ডিটেক্ট হবে!', 'Portrait ID card (54×85.6mm) selected — Portrait card will auto-detect on upload!')
          : tr('আড়াআড়ি / ল্যান্ডস্কেপ আইডি কার্ড (85.6×54mm) সিলেক্ট করা হয়েছে!', 'Landscape ID card (85.6×54mm) selected!'));
        return;
      }
      pushNidHistory();
      entry.cardOrient = orient;
      syncNidOrientButtons();
      // Keep page orientation fixed (never auto-rotate page on ratio/card-type click) while detecting card in selected orientation
      var det = autoDetectCardQuad(entry.item.img, entry.rot || 0, entry.flipH || 1, null, null, false, orient);
      var detectedCard = !!(det && !det.fallback && det.pts && det.pts.length === 4);
      if (detectedCard) {
        entry.pts = det.pts;
        entry.autoDetected = true;
        positionNidQuadDOM({ snapped: true });
        triggerNidScanAnimation();
      } else {
        snapQuadToCardRatio(entry, orient);
        positionNidQuadDOM();
      }
      renderNidCardTabs();
      renderCombineLivePreview();
      if (detectedCard) {
        showToast(orient === 'portrait'
          ? tr('পোর্ট্রেট আইডি কার্ড (54×85.6mm) অটো-ডিটেক্ট করা হয়েছে!', 'Portrait ID card (54×85.6mm) auto-detected!')
          : tr('আড়াআড়ি / ল্যান্ডস্কেপ আইডি কার্ড (85.6×54mm) অটো-ডিটেক্ট করা হয়েছে!', 'Landscape ID card (85.6×54mm) auto-detected!'));
      } else {
        showToast(orient === 'portrait'
          ? tr('ক্রপ রেশিও: পোর্ট্রেট আইডি (54×85.6mm) সেট করা হয়েছে!', 'Crop ratio set to Portrait ID (54×85.6mm)!')
          : tr('ক্রপ রেশিও: ল্যান্ডস্কেপ আইডি (85.6×54mm) সেট করা হয়েছে!', 'Crop ratio set to Landscape ID (85.6×54mm)!'));
      }
    }
    on('nidSnapRatioBtn', 'click', function () {
      applyNidOrientationSelection('landscape');
    });
    on('nidSnapPortraitRatioBtn', 'click', function () {
      applyNidOrientationSelection('portrait');
    });
    on('nidDropOrientLandscape', 'click', function () {
      applyNidOrientationSelection('landscape');
    });
    on('nidDropOrientPortrait', 'click', function () {
      applyNidOrientationSelection('portrait');
    });
    on('nidFullCropBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      pushNidHistory();
      entry.pts = defaultQuadPts(0);
      entry.autoDetected = false;
      positionNidQuadDOM();
      renderCombineLivePreview();
    });
    on('nidRotLBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      pushNidHistory();
      entry.rot -= 90;
      entry.manualRot = (((entry.rot || 0) % 360) + 360) % 360;
      entry.pts = orderQuadClockwise((entry.pts || defaultQuadPts(0.04)).map(function (pt) {
        return { x: pt.y, y: 1 - pt.x };
      }));
      drawNidCropSourceCanvas();
      renderCombineLivePreview();
    });
    on('nidRotRBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      pushNidHistory();
      entry.rot += 90;
      entry.manualRot = (((entry.rot || 0) % 360) + 360) % 360;
      entry.pts = orderQuadClockwise((entry.pts || defaultQuadPts(0.04)).map(function (pt) {
        return { x: 1 - pt.y, y: pt.x };
      }));
      drawNidCropSourceCanvas();
      renderCombineLivePreview();
    });
    on('nidFlipHBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      pushNidHistory();
      entry.flipH = (entry.flipH || 1) * -1;
      entry.pts = entry.pts.map(function (pt) { return { x: 1 - pt.x, y: pt.y }; });
      entry.pts = orderQuadClockwise(entry.pts);
      drawNidCropSourceCanvas();
      renderCombineLivePreview();
    });
    on('nidUndoBtn', 'click', function () {
      if (!nidUndoStack.length) return;
      nidRedoStack.push(captureNidSnapshot());
      var prev = nidUndoStack.pop();
      applyNidSnapshot(prev);
    });
    on('nidRedoBtn', 'click', function () {
      if (!nidRedoStack.length) return;
      nidUndoStack.push(captureNidSnapshot());
      var next = nidRedoStack.pop();
      applyNidSnapshot(next);
    });
    on('nidZoomOutBtn', 'click', function () { setNidCanvasZoom(nidCanvasZoom / 1.25); });
    on('nidZoomInBtn', 'click', function () { setNidCanvasZoom(nidCanvasZoom * 1.25); });
    on('nidZoomResetBtn', 'click', function () { nidPan = { x: 0, y: 0 }; setNidCanvasZoom(1); });
    on('nidZoomFitBtn', 'click', fitNidCanvas);
    on('nidHandToolBtn', 'click', function () { setNidHandTool(!nidHandTool); });
    function commitNidZoom(e) {
      var percent = parseFloat(e.target.value);
      if (Number.isFinite(percent)) setNidCanvasZoom(percent / 100);
      else syncNidViewport();
    }
    on('nidZoomPercent', 'change', commitNidZoom);
    on('nidZoomPercent', 'blur', commitNidZoom);
    on('nidZoomPercent', 'keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); commitNidZoom(e); e.target.blur(); $('#nidCanvasViewport').focus(); }
      if (e.key === 'Escape') { syncNidViewport(); e.target.blur(); $('#nidCanvasViewport').focus(); }
    });
    on('nidToggleGridBtn', 'click', function () {
      var svg = $('#nidQuadSvg');
      var btn = $('#nidToggleGridBtn');
      if (!svg || !btn) return;
      var hidden = svg.classList.toggle('is-grid-hidden');
      btn.classList.toggle('active', !hidden);
      btn.setAttribute('aria-pressed', !hidden ? 'true' : 'false');
    });
    $$('[data-launch-img-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var det = $('#nidToolsLauncher');
        if (det) det.open = false;
        switchImgTab(btn.getAttribute('data-launch-img-tab'));
      });
    });
    on('nidStudioThemeBtn', 'click', function () {
      var tBtn = $('#themeToggle');
      if (tBtn) tBtn.click();
    });
    on('nidFineAngle', 'input', function (e) {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      entry.fineAngle = parseFloat(e.target.value) || 0;
      syncNidDeskewControl();
      scheduleCombineLiveRender();
    });
    on('nidFineAngleReset', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      entry.fineAngle = 0;
      syncNidDeskewControl();
      renderCombineLivePreview();
    });
    $$('#nidColorTargetGroup [data-color-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var t = btn.getAttribute('data-color-target');
        if (!t || btn.disabled) return;
        nidColorTarget = t;
        if (t !== 'all') {
          var targetIdx = parseInt(t, 10);
          if (combineItems[targetIdx] && activeNidIdx !== targetIdx) {
            activeNidIdx = targetIdx;
            renderNidCardTabs();
            syncNidDeskewControl();
            drawNidCropSourceCanvas();
          }
        }
        syncNidColorControlsFromTarget();
      });
    });
    $$('input[name="imgCombineMode"]').forEach(function (r) {
      r.addEventListener('change', function () {
        updateNidRightPanelBadges();
        renderCombineLivePreview();
      });
    });
    $$('input[name="imgCombineScanMode"]').forEach(function (r) {
      r.addEventListener('change', function () {
        pushNidHistory();
        applyDomColorControlsToTarget(true);
        renderCombineLivePreview();
      });
    });
    on('nidDeglareBtn', 'click', function () {
      toggleNidSmartEnhancer('deglare');
    });
    on('nidTextBoostBtn', 'click', function () {
      toggleNidSmartEnhancer('textBoost');
    });
    ['imgCombineBright', 'imgCombineContrast', 'imgCombineSat', 'imgCombineSharp'].forEach(function (id) {
      on(id, 'pointerdown', function () { pushNidHistory(); });
      on(id, 'input', function () {
        applyDomColorControlsToTarget(false);
        scheduleCombineLiveRender();
      });
    });
    $$('[data-cardw]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = parseInt(btn.getAttribute('data-cardw'), 10);
        if (!val) return;
        if ($('#imgCombineCardW')) $('#imgCombineCardW').value = String(val);
        syncNidSizePresetButtons(val);
        updateNidRightPanelBadges();
        renderCombineLivePreview();
      });
    });
    on('imgCombineCardW', 'input', function () {
      updateNidRightPanelBadges();
      scheduleCombineLiveRender();
    });
    ['imgCombineGap', 'imgCombineBg'].forEach(function (id) {
      on(id, 'input', function () {
        updateNidRightPanelBadges();
        scheduleCombineLiveRender();
      });
    });
    ['imgCombineAlign', 'imgCombineCopies', 'imgCombineRoundCorner', 'imgCombineCardBorder', 'imgCombineCutMarks'].forEach(function (id) {
      on(id, 'change', function () {
        updateNidRightPanelBadges();
        renderCombineLivePreview();
      });
    });
    on('imgCombineColorResetBtn', 'click', function () {
      pushNidHistory();
      var origR = $('input[name="imgCombineScanMode"][value="original"]');
      if (origR) origR.checked = true;
      if ($('#imgCombineBright')) $('#imgCombineBright').value = 100;
      if ($('#imgCombineContrast')) $('#imgCombineContrast').value = 100;
      if ($('#imgCombineSat')) $('#imgCombineSat').value = 100;
      if ($('#imgCombineSharp')) $('#imgCombineSharp').value = 20;
      applyDomColorControlsToTarget(true);
      renderCombineLivePreview();
      showToast(
        nidColorTarget === 'all'
          ? tr('উভয় পাতার কালার ও ফিল্টার রিসেট করা হয়েছে', 'Reset color and filters for both sides')
          : (nidColorTarget === '0'
              ? tr('১ম পাতার কালার ও ফিল্টার রিসেট করা হয়েছে', 'Reset color and filters for 1st side')
              : tr('২য় পাতার কালার ও ফিল্টার রিসেট করা হয়েছে', 'Reset color and filters for 2nd side'))
      );
    });
    on('imgCombineSwapBtn', 'click', function () {
      clearNidHistory();
      combineItems.reverse();
      activeNidIdx = 0;
      renderNidCardTabs();
      syncNidDeskewControl();
      syncNidColorControlsFromTarget();
      drawNidCropSourceCanvas();
      renderCombineLivePreview();
    });
    on('imgCombineClearBtn', 'click', function () {
      combineToken++;
      if (nidLiveRafId) { cancelAnimationFrame(nidLiveRafId); nidLiveRafId = 0; }
      if (nidIdleExportTimer) { clearTimeout(nidIdleExportTimer); nidIdleExportTimer = 0; }
      if (combineOut.url) URL.revokeObjectURL(combineOut.url);
      combineOut = {};
      setNidExportReady(false);
      switchNidView('edit');
      combineItems = [];
      activeNidIdx = 0;
      nidColorTarget = 'all';
      nidCardOrient = 'landscape';
      syncNidOrientButtons();
      nidUndoStack = [];
      nidRedoStack = [];
      updateNidHistoryButtons();
      syncNidColorControlsFromTarget();
      setNidCanvasZoom(1);
      nidFitMode = true;
      nidPan = { x: 0, y: 0 };
      nidSpaceHeld = false;
      setNidHandTool(false);
      if ($('#nidCardTabs')) $('#nidCardTabs').innerHTML = '';
      if ($('#nidCount')) $('#nidCount').textContent = '০';
      syncNidAddLimitControls();
      if ($('#img-pane-combine')) $('#img-pane-combine').setAttribute('data-has-pages', 'false');
      $('#imgCombineStage').hidden = true;
      if ($('#imgCombineTopActions')) $('#imgCombineTopActions').hidden = true;
      $('#imgCombineDropzone').hidden = false;
    });
    on('imgCombineDownloadBtn', 'click', async function () {
      await ensureFullResCombineOutput();
      if (!combineOut.blob) return;
      downloadBlob(combineOut.blob, 'techhat-nid-scanned-card.jpg');
      showToast(tr('হাই-রেজোলিউশন JPG কার্ড ডাউনলোড হয়েছে!', 'High-resolution JPG card downloaded!'));
    });
    on('imgCombineDownloadPdfBtn', 'click', async function () {
      await ensureFullResCombineOutput();
      if (!combineOut.blob) return;
      try {
        var ab = await combineOut.blob.arrayBuffer();
        var jpegBytes = new Uint8Array(ab);
        var isA4Mode = combineOut.mode === 'nid-a4' || combineOut.mode === 'nid-a4-side';
        var pdfBlob = buildJpegPdfBlob(
          jpegBytes,
          combineOut.width || 2480,
          combineOut.height || 3508,
          isA4Mode,
          combineOut.printWidthMm
        );
        downloadBlob(pdfBlob, 'techhat-nid-scanned-card.pdf');
        showToast(isA4Mode
          ? tr('প্রিন্ট-রেডি A4 PDF ডাউনলোড হয়েছে!', 'Print-ready A4 PDF downloaded!')
          : tr('সঠিক কার্ড মাপের PDF ডাউনলোড হয়েছে!', 'Actual-size ID PDF downloaded!'));
      } catch (e) {
        showToast(tr('PDF তৈরি করা যায়নি', 'Failed to generate PDF'));
      }
    });
    on('imgCombinePrintBtn', 'click', async function () {
      var w = window.open('', '_blank', 'width=840,height=960');
      if (!w) {
        showToast(tr('পপ-আপ ব্লক করা হয়েছে — অনুগ্রহ করে PDF ডাউনলোড করে প্রিন্ট করুন', 'Pop-up blocked — please download PDF to print'));
        return;
      }
      await ensureFullResCombineOutput();
      if (!combineOut.url) { w.close(); return; }
      var isA4Out = combineOut.mode === 'nid-a4' || combineOut.mode === 'nid-a4-side';
      var printMm = isA4Out ? 210 : (combineOut.printWidthMm || +(((combineOut.width || 1156) * 210 / 2480).toFixed(2)));
      var imgCss = isA4Out
        ? 'width:210mm;max-width:210mm;max-height:297mm;height:auto;display:block'
        : 'width:' + printMm.toFixed(2) + 'mm;max-width:206mm;max-height:290mm;height:auto;display:block;margin-top:12mm';
      w.document.write(
        '<!doctype html><html><head><title>TechHat ID Card Print</title>' +
        '<style>@page{size:A4;margin:0}html,body{margin:0;padding:0;background:#fff;display:flex;justify-content:center;align-items:flex-start}img{' + imgCss + '}</style>' +
        '</head><body><img src="' + combineOut.url + '" onload="setTimeout(function(){window.focus();window.print();},150)"></body></html>'
      );
      w.document.close();
    });

    // Live Camera Scanner Dialog Controls
    $$('[data-cam-slot]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openNidCamera(parseInt(btn.getAttribute('data-cam-slot'), 10));
      });
    });
    on('nidCameraStageBtn', 'click', function () { openNidCamera(-1); });
    on('nidCameraClose', 'click', function () {
      stopNidCamera();
      $('#nidCameraDialog').close();
    });
    if ($('#nidCameraDialog')) {
      $('#nidCameraDialog').addEventListener('close', stopNidCamera);
    }
    on('nidCameraSwitchBtn', 'click', function () {
      nidCamFacing = nidCamFacing === 'environment' ? 'user' : 'environment';
      openNidCamera(nidCamSlot);
    });
    on('nidCameraSnapBtn', 'click', async function () {
      var video = $('#nidCameraVideo');
      if (!video || !video.videoWidth) return;
      var c = document.createElement('canvas');
      c.width = video.videoWidth;
      c.height = video.videoHeight;
      c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
      var blob = await canvasToBlob(c, 'image/jpeg', 0.94);
      var file = new File([blob], 'nid-camera-scan-' + Date.now() + '.jpg', { type: 'image/jpeg' });
      stopNidCamera();
      $('#nidCameraDialog').close();
      await setCombineSlotFile(nidCamSlot >= 0 ? nidCamSlot : combineItems.length, file);
    });
    onNidLangChange();
  }

  function onNidLangChange() {
        var pane = $('#img-pane-combine');
        if (pane) {
          var enLang = isEn();
          pane.querySelectorAll('[data-i18n-title-bn],[data-i18n-title-en]').forEach(function (el) {
            var t = enLang ? el.getAttribute('data-i18n-title-en') : el.getAttribute('data-i18n-title-bn');
            if (t) el.setAttribute('title', t);
          });
        }
        renderNidCardTabs();
        updateNidRightPanelBadges();
        syncNidColorControlsFromTarget();
        if (combineItems.length) {
          renderCombineLivePreview();
        }
        var snapBtn = $('#nidMagSnapBtn');
        if (snapBtn) {
          var bnTitle = nidMagSnapEnabled ? 'ম্যাগনেটিক স্ন্যাপ: চালু' : 'ম্যাগনেটিক স্ন্যাপ: বন্ধ';
          var enTitle = nidMagSnapEnabled ? 'Magnetic Snap: On' : 'Magnetic Snap: Off';
          snapBtn.setAttribute('data-i18n-title-bn', bnTitle);
          snapBtn.setAttribute('data-i18n-title-en', enTitle);
          snapBtn.title = tr(bnTitle, enTitle);
          var txtSpan = snapBtn.querySelector('.nid-btn-txt');
          if (txtSpan) {
            txtSpan.textContent = nidMagSnapEnabled ? tr('স্ন্যাপ: চালু', 'Snap: On') : tr('স্ন্যাপ: বন্ধ', 'Snap: Off');
          }
        }
  }

  window.TechHatNidScanner = {
    init: initNidScanner,
    onLangChange: onNidLangChange,
    maxSides: MAX_NID_SIDES,
    addFiles: addCombineFiles,
    setSlotFile: setCombineSlotFile,
    getActiveIndex: function () { return activeNidIdx; },
    getCount: function () { return combineItems.length; },
    autoDetectCardQuad: autoDetectCardQuad,
    rotate: buildRotatedCanvas,
    warp: warpPerspectiveCard,
    buildMagneticSnapField: buildMagneticSnapField,
    snapEdgeMagnetically: snapEdgeMagnetically,
    snapCurrentQuadToNearestEdges: snapCurrentQuadToNearestEdges,
    snapQuadToCardRatio: snapQuadToCardRatio,
    renderProcessedCardCanvas: renderProcessedCardCanvas,
    composeCombineSheetCanvas: composeCombineSheetCanvas,
    setCardOrient: function (mode) {
      nidCardOrient = mode === 'portrait' ? 'portrait' : 'landscape';
      syncNidOrientButtons();
    }
  };
  if (!window.TechHatScanGeometry) {
    window.TechHatScanGeometry = {
      load: loadImageFile,
      rotate: buildRotatedCanvas,
      warp: warpPerspectiveCard
    };
  }

  if ($('#img-pane-combine')) {
    initNidScanner();
  }
})();
