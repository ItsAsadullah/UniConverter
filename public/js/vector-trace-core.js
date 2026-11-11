/* TechHat Vector Trace Core — raster → vector bezier tracing, no dependencies.
 * UMD: works in Node (tests), Web Worker and window. Deterministic output. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TechHatVectorTrace = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  /* ============================ 1. PREPROCESS ============================ */

  // Bilinear resize of an RGBA buffer to (tw, th).
  function resizeRGBA(data, w, h, tw, th) {
    if (tw === w && th === h) return { data: data, w: w, h: h };
    var out = new Uint8ClampedArray(tw * th * 4);
    var xr = w / tw, yr = h / th;
    for (var y = 0; y < th; y++) {
      var sy = (y + 0.5) * yr - 0.5;
      var y0 = Math.floor(sy); var fy = sy - y0;
      var y0c = clamp(y0, 0, h - 1), y1c = clamp(y0 + 1, 0, h - 1);
      for (var x = 0; x < tw; x++) {
        var sx = (x + 0.5) * xr - 0.5;
        var x0 = Math.floor(sx); var fx = sx - x0;
        var x0c = clamp(x0, 0, w - 1), x1c = clamp(x0 + 1, 0, w - 1);
        var i00 = (y0c * w + x0c) * 4, i10 = (y0c * w + x1c) * 4;
        var i01 = (y1c * w + x0c) * 4, i11 = (y1c * w + x1c) * 4;
        var o = (y * tw + x) * 4;
        for (var c = 0; c < 4; c++) {
          var a = data[i00 + c] * (1 - fx) + data[i10 + c] * fx;
          var b = data[i01 + c] * (1 - fx) + data[i11 + c] * fx;
          out[o + c] = a * (1 - fy) + b * fy;
        }
      }
    }
    return { data: out, w: tw, h: th };
  }

  function adjustTone(data, brightness, contrast) {
    if (!brightness && !contrast) return data;
    var b = Math.round((brightness || 0) * 1.5);
    var c = clamp(contrast || 0, -100, 100) * 2.55;
    var f = (259 * (c + 255)) / (255 * (259 - c));
    var lut = new Uint8ClampedArray(256);
    for (var i = 0; i < 256; i++) lut[i] = clamp(f * (i + b) + 128 * (1 - f), 0, 255);
    for (var p = 0; p < data.length; p += 4) {
      data[p] = lut[data[p]]; data[p + 1] = lut[data[p + 1]]; data[p + 2] = lut[data[p + 2]];
    }
    return data;
  }

  function colorDist(r, g, b, cr, cg, cb) {
    var dr = r - cr, dg = g - cg, db = b - cb;
    return Math.sqrt((dr * dr + dg * dg + db * db) / 3);
  }

  // Background removal: 'color' (colour key + tolerance) or 'bright' (luminance key).
  function removeBackground(data, w, h, opts) {
    var mode = opts.bgMode || 'off';
    if (mode === 'off') return data;
    var tol = clamp(opts.bgTolerance == null ? 12 : opts.bgTolerance, 0, 100) * 2.55;
    var soft = Math.max(1, tol * 0.25);
    var bg = opts.bgColor || [255, 255, 255];
    if (mode === 'flood') return floodRemoveBackground(data, w, h, bg, tol, soft);
    for (var p = 0; p < data.length; p += 4) {
      if (data[p + 3] === 0) continue;
      var d;
      if (mode === 'color') {
        d = colorDist(data[p], data[p + 1], data[p + 2], bg[0], bg[1], bg[2]);
      } else {
        var lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
        d = 255 - lum; // distance from pure white
      }
      if (d <= tol - soft) data[p + 3] = 0;
      else if (d < tol + soft) data[p + 3] = Math.round(data[p + 3] * (d - (tol - soft)) / (2 * soft));
    }
    return data;
  }

  // Contiguous background removal: flood-fills from the image border through
  // pixels close to the key colour, so same-coloured details INSIDE the logo
  // (white text on a badge, eye highlights …) are preserved.
  function floodRemoveBackground(data, w, h, bg, tol, soft) {
    var n = w * h;
    var seen = new Uint8Array(n);
    var stack = new Int32Array(n);
    var sp = 0;
    var lim = tol + soft;
    function near(p) {
      var o = p * 4;
      if (data[o + 3] === 0) return 0;
      return colorDist(data[o], data[o + 1], data[o + 2], bg[0], bg[1], bg[2]);
    }
    function seed(p) {
      if (seen[p]) return;
      if (data[p * 4 + 3] === 0 || near(p) < lim) { seen[p] = 1; stack[sp++] = p; }
    }
    for (var x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
    for (var y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
    while (sp) {
      var q = stack[--sp];
      var o = q * 4;
      var d = data[o + 3] === 0 ? 0 : near(q);
      if (d <= tol - soft) data[o + 3] = 0;
      else if (d < lim) {
        data[o + 3] = Math.round(data[o + 3] * (d - (tol - soft)) / (2 * soft));
        continue; // anti-aliased rim: soften but do not spread past it
      }
      var qx = q % w;
      if (qx > 0) seed(q - 1);
      if (qx < w - 1) seed(q + 1);
      if (q >= w) seed(q - w);
      if (q + w < n) seed(q + w);
    }
    return data;
  }

  function medianFilter(data, w, h) {
    var src = data.slice();
    var win = new Array(9);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var o = (y * w + x) * 4;
        for (var c = 0; c < 3; c++) {
          var n = 0;
          for (var dy = -1; dy <= 1; dy++) {
            var yy = clamp(y + dy, 0, h - 1);
            for (var dx = -1; dx <= 1; dx++) {
              var xx = clamp(x + dx, 0, w - 1);
              win[n++] = src[(yy * w + xx) * 4 + c];
            }
          }
          win.sort(function (a, b) { return a - b; });
          data[o + c] = win[4];
        }
      }
    }
    return data;
  }

  function blurFilter(data, w, h) {
    var src = data.slice();
    var k = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var o = (y * w + x) * 4;
        for (var c = 0; c < 3; c++) {
          var s = 0, n = 0;
          for (var dy = -1; dy <= 1; dy++) {
            var yy = clamp(y + dy, 0, h - 1);
            for (var dx = -1; dx <= 1; dx++) {
              var xx = clamp(x + dx, 0, w - 1);
              s += src[(yy * w + xx) * 4 + c] * k[n++];
            }
          }
          data[o + c] = s / 16;
        }
      }
    }
    return data;
  }

  // Full preprocess chain. opts: { scale, brightness, contrast, bgMode, bgColor,
  // bgTolerance, median, blur, maxEdge }
  function preprocess(data, w, h, opts) {
    opts = opts || {};
    var maxEdge = clamp(opts.maxEdge || 4000, 16, 4000);
    var scale = clamp(opts.scale == null ? 100 : opts.scale, 5, 400) / 100;
    var longest = Math.max(w, h);
    var tw = Math.round(w * scale), th = Math.round(h * scale);
    if (longest * scale > maxEdge) {
      var f = maxEdge / (longest * scale);
      tw = Math.max(1, Math.round(tw * f));
      th = Math.max(1, Math.round(th * f));
    }
    var r = resizeRGBA(data, w, h, tw, th);
    var out = r.data;
    adjustTone(out, opts.brightness, opts.contrast);
    removeBackground(out, r.w, r.h, opts);
    var passes = clamp(opts.median || 0, 0, 3);
    for (var i = 0; i < passes; i++) medianFilter(out, r.w, r.h);
    var bp = clamp(opts.blur || 0, 0, 3);
    for (var j = 0; j < bp; j++) blurFilter(out, r.w, r.h);
    return { data: out, w: r.w, h: r.h };
  }

  /* ============================ 2. BINARIZE ============================ */

  // Otsu threshold over opaque pixels only.
  function otsu(data, w, h) {
    var hist = new Float64Array(256);
    var count = 0;
    for (var p = 0; p < data.length; p += 4) {
      if (data[p + 3] < 128) continue;
      hist[Math.round(0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2])]++;
      count++;
    }
    if (!count) return 128;
    var sum = 0;
    for (var t = 0; t < 256; t++) sum += t * hist[t];
    var sumB = 0, wB = 0, best = -1, thrLo = 128, thrHi = 128;
    for (var t2 = 0; t2 < 256; t2++) {
      wB += hist[t2];
      if (!wB) continue;
      var wF = count - wB;
      if (!wF) break;
      sumB += t2 * hist[t2];
      var mB = sumB / wB, mF = (sum - sumB) / wF;
      var between = wB * wF * (mB - mF) * (mB - mF);
      if (between > best) { best = between; thrLo = t2; thrHi = t2; }
      else if (between === best) { thrHi = t2; } // plateau (e.g. pure bimodal) → midpoint below
    }
    return Math.round((thrLo + thrHi) / 2);
  }

  // Build a 1/0 foreground mask. Foreground = darker side unless opts.invert.
  function binarize(data, w, h, opts) {
    opts = opts || {};
    var thr;
    if (opts.threshold == null) thr = otsu(data, w, h);
    else thr = clamp(opts.threshold, 0, 100) * 2.55;
    var invert = !!opts.invert;
    var mask = new Uint8Array(w * h);
    for (var i = 0, p = 0; i < mask.length; i++, p += 4) {
      if (data[p + 3] < 128) { mask[i] = 0; continue; }
      var lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
      var dark = lum < thr;
      mask[i] = (dark !== invert) ? 1 : 0;
    }
    return mask;
  }

  /* ============================ 3. DESPECKLE ============================ */

  // Removes foreground components smaller than minArea and fills background
  // holes (not touching the border) smaller than minArea.
  function despeckle(mask, w, h, minArea) {
    if (!minArea || minArea < 1) return mask;
    var n = w * h;
    var stack = new Int32Array(n);
    var i, x, y, p, sp, size, touchesBorder, k, r;
    // pass 1: remove small foreground blobs
    for (p = 0; p < n; p++) {
      if (mask[p] !== 1) continue;
      sp = 0; stack[sp++] = p; mask[p] = 2;
      size = 0; touchesBorder = false;
      var pixels = [];
      while (sp) {
        var q = stack[--sp];
        size++;
        x = q % w; y = (q / w) | 0;
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touchesBorder = true;
        if (size <= minArea) pixels.push(q);
        if (x > 0 && mask[q - 1] === 1) { mask[q - 1] = 2; stack[sp++] = q - 1; }
        if (x < w - 1 && mask[q + 1] === 1) { mask[q + 1] = 2; stack[sp++] = q + 1; }
        if (q - w >= 0 && mask[q - w] === 1) { mask[q - w] = 2; stack[sp++] = q - w; }
        if (q + w < n && mask[q + w] === 1) { mask[q + w] = 2; stack[sp++] = q + w; }
      }
      if (size < minArea) for (i = 0; i < pixels.length; i++) mask[pixels[i]] = 0;
    }
    for (p = 0; p < n; p++) if (mask[p] === 2) mask[p] = 1;
    // pass 2: fill small background holes
    for (p = 0; p < n; p++) {
      if (mask[p] !== 0) continue;
      sp = 0; stack[sp++] = p; mask[p] = 3;
      size = 0; touchesBorder = false;
      var holes = [];
      while (sp) {
        var q2 = stack[--sp];
        size++;
        x = q2 % w; y = (q2 / w) | 0;
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touchesBorder = true;
        if (size <= minArea) holes.push(q2);
        if (x > 0 && mask[q2 - 1] === 0) { mask[q2 - 1] = 3; stack[sp++] = q2 - 1; }
        if (x < w - 1 && mask[q2 + 1] === 0) { mask[q2 + 1] = 3; stack[sp++] = q2 + 1; }
        if (q2 - w >= 0 && mask[q2 - w] === 0) { mask[q2 - w] = 3; stack[sp++] = q2 - w; }
        if (q2 + w < n && mask[q2 + w] === 0) { mask[q2 + w] = 3; stack[sp++] = q2 + w; }
      }
      if (size < minArea && !touchesBorder) for (i = 0; i < holes.length; i++) mask[holes[i]] = 4;
    }
    for (p = 0; p < n; p++) { if (mask[p] === 3) mask[p] = 0; else if (mask[p] === 4) mask[p] = 1; }
    return mask;
  }

  // Fills every hole enclosed by the foreground (background components not
  // connected to the image border). Used by 'stacked' mode so lower layers
  // extend underneath upper ones — no hairline seam artifacts.
  function fillHoles(mask, w, h) {
    var n = w * h;
    var stack = new Int32Array(n);
    var sp = 0;
    var x, y, q, p;
    // flood background from all border pixels, marking reached bg as 3
    for (x = 0; x < w; x++) { if (!mask[x]) { mask[x] = 3; stack[sp++] = x; }
      q = (h - 1) * w + x; if (!mask[q]) { mask[q] = 3; stack[sp++] = q; } }
    for (y = 0; y < h; y++) { if (!mask[y * w]) { mask[y * w] = 3; stack[sp++] = y * w; }
      q = y * w + w - 1; if (!mask[q]) { mask[q] = 3; stack[sp++] = q; } }
    while (sp) {
      q = stack[--sp];
      x = q % w; y = (q / w) | 0;
      if (x > 0 && !mask[q - 1]) { mask[q - 1] = 3; stack[sp++] = q - 1; }
      if (x < w - 1 && !mask[q + 1]) { mask[q + 1] = 3; stack[sp++] = q + 1; }
      if (q - w >= 0 && !mask[q - w]) { mask[q - w] = 3; stack[sp++] = q - w; }
      if (q + w < n && !mask[q + w]) { mask[q + w] = 3; stack[sp++] = q + w; }
    }
    for (p = 0; p < n; p++) { if (mask[p] === 3) mask[p] = 0; else if (!mask[p]) mask[p] = 1; }
    return mask;
  }

  /* ============================ 4. QUANTIZE (color mode) ============================ */

  // Median-cut palette + 2-pass k-means refine over a 32³ LUT.
  // Returns { palette: [[r,g,b]...], index: Uint8Array (255 = transparent) }.
  function quantize(data, w, h, k) {
    k = clamp(k | 0, 2, 128);
    var n = w * h;
    var samples = [];
    var stride = Math.max(1, Math.floor(Math.sqrt(n / 20000)));
    for (var i = 0; i < n; i += stride) {
      if (data[i * 4 + 3] < 128) continue;
      samples.push([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]);
    }
    if (!samples.length) samples.push([255, 255, 255]);
    var unique = [];
    var seen = {};
    for (var s = 0; s < samples.length; s++) {
      var key = (samples[s][0] >> 3) + ',' + (samples[s][1] >> 3) + ',' + (samples[s][2] >> 3);
      if (!seen[key]) { seen[key] = 1; unique.push(samples[s]); }
    }
    if (unique.length <= k) {
      var pal = unique.map(function (c) { return c.slice(); });
      var safePal = pal.length ? pal : [[255, 255, 255]];
      return { palette: safePal, index: assignLut(data, w, h, safePal) };
    }
    // median cut: repeatedly split the box with the widest channel range
    var boxes = [unique];
    while (boxes.length < k) {
      var bi = -1, br = -1, bc = -1;
      for (var b = 0; b < boxes.length; b++) {
        if (boxes[b].length < 2) continue;
        for (var ch = 0; ch < 3; ch++) {
          var lo = 255, hi = 0;
          for (var m = 0; m < boxes[b].length; m++) {
            var v = boxes[b][m][ch];
            if (v < lo) lo = v;
            if (v > hi) hi = v;
          }
          if (hi - lo > br) { br = hi - lo; bi = b; bc = ch; }
        }
      }
      if (bi < 0 || br <= 0) break;
      var box = boxes[bi];
      box.sort(function (a, c) { return a[bc] - c[bc]; });
      var mid = box.length >> 1;
      boxes.splice(bi, 1, box.slice(0, mid), box.slice(mid));
    }
    var palette = boxes.map(function (bx) {
      var r = 0, g = 0, bl = 0;
      for (var m2 = 0; m2 < bx.length; m2++) { r += bx[m2][0]; g += bx[m2][1]; bl += bx[m2][2]; }
      var L = bx.length || 1;
      return [Math.round(r / L), Math.round(g / L), Math.round(bl / L)];
    });
    // k-means refine (2 iterations, weighted by full-image bin histogram)
    var hist = new Float64Array(32768);
    for (var hp = 0; hp < n; hp++) {
      var q = hp * 4;
      if (data[q + 3] < 128) continue;
      hist[((data[q] >> 3) << 10) | ((data[q + 1] >> 3) << 5) | (data[q + 2] >> 3)]++;
    }
    var lut = buildLut(palette);
    for (var iter = 0; iter < 2; iter++) {
      var sums = palette.map(function () { return [0, 0, 0, 0]; });
      for (var bin = 0; bin < 32768; bin++) {
        var cnt = hist[bin];
        if (!cnt) continue;
        var ci = lut[bin];
        var rr = ((bin >> 10) & 31) * 8 + 4, gg = ((bin >> 5) & 31) * 8 + 4, bb = (bin & 31) * 8 + 4;
        sums[ci][0] += rr * cnt; sums[ci][1] += gg * cnt; sums[ci][2] += bb * cnt; sums[ci][3] += cnt;
      }
      for (var c3 = 0; c3 < palette.length; c3++) {
        if (sums[c3][3] > 0) {
          palette[c3] = [Math.round(sums[c3][0] / sums[c3][3]), Math.round(sums[c3][1] / sums[c3][3]), Math.round(sums[c3][2] / sums[c3][3])];
        }
      }
      lut = buildLut(palette);
    }
    // dedupe identical palette entries and remap the LUT
    var dedup = [], map = {};
    var remap = new Uint8Array(palette.length);
    for (var c4 = 0; c4 < palette.length; c4++) {
      var kk = palette[c4].join(',');
      if (map[kk] == null) { map[kk] = dedup.length; dedup.push(palette[c4]); }
      remap[c4] = map[kk];
    }
    for (var bin2 = 0; bin2 < 32768; bin2++) lut[bin2] = remap[lut[bin2]];
    var index = new Uint8Array(n);
    for (var ip = 0; ip < n; ip++) {
      var pp = ip * 4;
      if (data[pp + 3] < 128) { index[ip] = 255; continue; }
      index[ip] = lut[((data[pp] >> 3) << 10) | ((data[pp + 1] >> 3) << 5) | (data[pp + 2] >> 3)];
    }
    return { palette: dedup, index: index };
  }

  // Map every opaque pixel to its nearest palette index via the 32³ LUT.
  function assignLut(data, w, h, palette) {
    var lut = buildLut(palette);
    var n = w * h;
    var index = new Uint8Array(n);
    for (var i = 0; i < n; i++) {
      var p = i * 4;
      if (data[p + 3] < 128) { index[i] = 255; continue; }
      index[i] = lut[((data[p] >> 3) << 10) | ((data[p + 1] >> 3) << 5) | (data[p + 2] >> 3)];
    }
    return index;
  }

  function buildLut(palette) {
    var lut = new Uint8Array(32768);
    for (var bin = 0; bin < 32768; bin++) {
      var r = ((bin >> 10) & 31) * 8 + 4, g = ((bin >> 5) & 31) * 8 + 4, b = (bin & 31) * 8 + 4;
      var best = 0, bd = Infinity;
      for (var c = 0; c < palette.length; c++) {
        var d = colorDist(r, g, b, palette[c][0], palette[c][1], palette[c][2]);
        if (d < bd) { bd = d; best = c; }
      }
      lut[bin] = best;
    }
    return lut;
  }

  /* ============================ 5. CONTOUR TRACING ============================ */

  // Directed crack edges around foreground regions (clockwise in screen coords).
  // Returns loops as flat arrays [x0,y0,x1,y1,...] of lattice points. Outer
  // loops have positive shoelace area; holes negative.
  function traceContours(mask, w, h) {
    var PW = w + 1;
    // dir 0 = right, 1 = down, 2 = left, 3 = up
    var edges = new Uint8Array(PW * (h + 1));
    function setEdge(px, py, d) { edges[py * PW + px] |= (1 << d); }
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (!mask[y * w + x]) continue;
        if (y === 0 || !mask[(y - 1) * w + x]) setEdge(x, y, 0);              // top → right
        if (x === w - 1 || !mask[y * w + x + 1]) setEdge(x + 1, y, 1);        // right → down
        if (y === h - 1 || !mask[(y + 1) * w + x]) setEdge(x + 1, y + 1, 2);  // bottom → left
        if (x === 0 || !mask[y * w + x - 1]) setEdge(x, y + 1, 3);            // left → up
      }
    }
    var DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
    var loops = [];
    // Upper bound = total number of crack edges. (A perimeter-based bound
    // silently dropped long, jagged outlines — brush strokes, script text.)
    var maxLen = 2 * (w + 1) * (h + 1) + 16;
    for (var py = 0; py <= h; py++) {
      for (var px = 0; px <= w; px++) {
        var cell = py * PW + px;
        var e0 = edges[cell];
        if (!e0) continue;
        for (var d0 = 0; d0 < 4; d0++) {
          if (!(e0 & (1 << d0))) continue;
          var sx = px, sy = py, d = d0;
          var loop = [];
          var cx = sx, cy = sy, guard = 0;
          do {
            loop.push(cx, cy);
            edges[cy * PW + cx] &= ~(1 << d);
            cx += DX[d]; cy += DY[d];
            var avail = edges[cy * PW + cx];
            if (!avail) break;
            // turn preference: sharpest right turn keeps loops consistent
            var order = [(d + 1) & 3, d, (d + 3) & 3, (d + 2) & 3];
            var nd = -1;
            for (var oi = 0; oi < 4; oi++) {
              if (avail & (1 << order[oi])) { nd = order[oi]; break; }
            }
            if (nd < 0) break;
            d = nd;
          } while ((cx !== sx || cy !== sy) && ++guard < maxLen);
          if (loop.length >= 8 && cx === sx && cy === sy) loops.push(loop);
        }
      }
    }
    return loops;
  }

  function loopArea(flat) {
    var a = 0;
    for (var i = 0; i < flat.length; i += 2) {
      var j = (i + 2) % flat.length;
      a += flat[i] * flat[j + 1] - flat[j] * flat[i + 1];
    }
    return a / 2;
  }

  /* ============================ 6. CORNER DETECTION ============================ */

  // [1,2,1] smoothing of a closed flat polyline, `passes` times.
  function smoothClosed(flat, n, passes) {
    var a = new Float64Array(flat.length);
    for (var i = 0; i < flat.length; i++) a[i] = flat[i];
    var b = new Float64Array(flat.length);
    for (var p = 0; p < passes; p++) {
      for (var j = 0; j < n; j++) {
        var jm = ((j - 1 + n) % n) * 2, jp = ((j + 1) % n) * 2, jj = j * 2;
        b[jj] = (a[jm] + 2 * a[jj] + a[jp]) * 0.25;
        b[jj + 1] = (a[jm + 1] + 2 * a[jj + 1] + a[jp + 1]) * 0.25;
      }
      var t = a; a = b; b = t;
    }
    return a;
  }

  // Max perpendicular distance of points i..j (forward, wrapping) from chord i→j.
  function chordDeviation(pts, n, i, j) {
    var ax = pts[i * 2], ay = pts[i * 2 + 1];
    var dx = pts[j * 2] - ax, dy = pts[j * 2 + 1] - ay;
    var len = Math.hypot(dx, dy);
    if (len < 1e-9) return 0;
    var m = 0;
    var count = (j - i + n) % n;
    for (var s = 1; s < count; s++) {
      var q = (i + s) % n;
      var d = Math.abs((pts[q * 2] - ax) * dy - (pts[q * 2 + 1] - ay) * dx) / len;
      if (d > m) m = d;
    }
    return m;
  }

  // Returns indices of corner points along a closed flat loop of unit lattice
  // steps. Works on a lightly smoothed copy so pixel staircases on diagonal
  // edges are not mistaken for corners, and requires both sides of a corner
  // to be locally straight (true geometric corner vs. tight curve wobble).
  function findCorners(flat, cornerThresholdDeg) {
    var n = flat.length / 2;
    if (n < 8) return [];
    var k = clamp(Math.round(Math.sqrt(n) / 2), 3, 7);
    if (k * 2 + 1 > n) k = Math.max(1, Math.floor((n - 1) / 2));
    var thr = clamp(cornerThresholdDeg == null ? 60 : cornerThresholdDeg, 5, 170) * Math.PI / 180;
    var sm = smoothClosed(flat, n, 1);
    var devs = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var im = ((i - k) + n) % n, ip = (i + k) % n;
      var ax = sm[i * 2] - sm[im * 2], ay = sm[i * 2 + 1] - sm[im * 2 + 1];
      var bx = sm[ip * 2] - sm[i * 2], by = sm[ip * 2 + 1] - sm[i * 2 + 1];
      var la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
      if (la < 1e-6 || lb < 1e-6) { devs[i] = 0; continue; }
      var cosA = clamp((ax * bx + ay * by) / (la * lb), -1, 1);
      devs[i] = Math.acos(cosA); // 0 = straight, π = full reversal
    }
    var corners = [];
    for (var j = 0; j < n; j++) {
      if (devs[j] < thr) continue;
      var isMax = true;
      for (var m = -k; m <= k; m++) {
        var q = ((j + m) + n) % n;
        if (q === j) continue;
        if (devs[q] > devs[j] || (devs[q] === devs[j] && q < j)) { isMax = false; break; }
      }
      if (!isMax) continue;
      // both arms must be (nearly) straight → a real corner, not a small curl
      var left = chordDeviation(sm, n, ((j - k) + n) % n, j);
      var right = chordDeviation(sm, n, j, (j + k) % n);
      if (left > 1.1 || right > 1.1) continue;
      corners.push(j);
    }
    corners.sort(function (a, b) { return a - b; });
    var filtered = [];
    for (var c = 0; c < corners.length; c++) {
      if (filtered.length && corners[c] - filtered[filtered.length - 1] < k) {
        if (devs[corners[c]] > devs[filtered[filtered.length - 1]]) filtered[filtered.length - 1] = corners[c];
        continue;
      }
      filtered.push(corners[c]);
    }
    if (filtered.length > 1 && (filtered[0] + n - filtered[filtered.length - 1]) < k) {
      if (devs[filtered[0]] > devs[filtered[filtered.length - 1]]) filtered.pop();
      else filtered.shift();
    }
    return filtered;
  }

  // Total-least-squares line through points idx[a..b] (wrapping). Returns
  // { mx, my, dx, dy, rms } or null.
  function fitLine(pts, n, from, count) {
    if (count < 2) return null;
    var sx = 0, sy = 0;
    for (var i = 0; i < count; i++) { var q = ((from + i) % n + n) % n; sx += pts[q * 2]; sy += pts[q * 2 + 1]; }
    var mx = sx / count, my = sy / count;
    var cxx = 0, cxy = 0, cyy = 0;
    for (var j = 0; j < count; j++) {
      var r = ((from + j) % n + n) % n;
      var ex = pts[r * 2] - mx, ey = pts[r * 2 + 1] - my;
      cxx += ex * ex; cxy += ex * ey; cyy += ey * ey;
    }
    var ang = 0.5 * Math.atan2(2 * cxy, cxx - cyy);
    var dx = Math.cos(ang), dy = Math.sin(ang);
    var ss = 0;
    for (var t = 0; t < count; t++) {
      var u = ((from + t) % n + n) % n;
      var d = (pts[u * 2] - mx) * dy - (pts[u * 2 + 1] - my) * dx;
      ss += d * d;
    }
    return { mx: mx, my: my, dx: dx, dy: dy, rms: Math.sqrt(ss / count) };
  }

  // Sharp-corner refinement: intersect the straight lines fitted to the two
  // arms of a corner. Pixel quantisation and anti-aliasing round corners off by
  // ~1 px — the intersection restores a crisp mathematical corner.
  // Returns [x, y] or null when the arms are straight AND nearly collinear
  // (a false corner caused by a junction wobble → caller drops it).
  function refineCorner(loop, n, corners, ci) {
    var nc = corners.length;
    var c = corners[ci];
    var raw = [loop[c * 2], loop[c * 2 + 1]];
    var leftLen = nc === 1 ? n : (c - corners[(ci - 1 + nc) % nc] + n) % n;
    var rightLen = nc === 1 ? n : (corners[(ci + 1) % nc] - c + n) % n;
    var L = Math.min(10, Math.floor(leftLen / 2), Math.floor(rightLen / 2));
    if (L < 3) return raw;
    var A = fitLine(loop, n, c - L, L - 1);       // c-L .. c-2 (skip rounded tip)
    var B = fitLine(loop, n, c + 2, L - 1);       // c+2 .. c+L
    if (!A || !B || A.rms > 0.8 || B.rms > 0.8) return raw;
    // orient both arm directions along the loop and measure the turn angle
    var ia = ((c - L) % n + n) % n, ib = ((c - 2) % n + n) % n;
    if (A.dx * (loop[ib * 2] - loop[ia * 2]) + A.dy * (loop[ib * 2 + 1] - loop[ia * 2 + 1]) < 0) { A.dx = -A.dx; A.dy = -A.dy; }
    var ja = (c + 2) % n, jb = (c + L) % n;
    if (B.dx * (loop[jb * 2] - loop[ja * 2]) + B.dy * (loop[jb * 2 + 1] - loop[ja * 2 + 1]) < 0) { B.dx = -B.dx; B.dy = -B.dy; }
    var turn = Math.acos(clamp(A.dx * B.dx + A.dy * B.dy, -1, 1));
    if (turn < 20 * Math.PI / 180 && L >= 5) return null;
    var cross = A.dx * B.dy - A.dy * B.dx;
    if (Math.abs(cross) < 0.26) return raw;       // arms nearly parallel
    var wx = B.mx - A.mx, wy = B.my - A.my;
    var s = (wx * B.dy - wy * B.dx) / cross;
    var px = A.mx + A.dx * s, py = A.my + A.dy * s;
    if (Math.hypot(px - raw[0], py - raw[1]) > 2.5) return raw;
    return [px, py];
  }

  /* ============================ 7. BEZIER FITTING (Schneider) ============================ */

  // Fits cubic beziers to pts[first..last] (flat xy array) within maxError.
  // Appends beziers as [p0x,p0y, c1x,c1y, c2x,c2y, p3x,p3y] to `out`.
  function fitCurve(pts, first, last, t1, t2, maxError, out) {
    var nPts = last - first + 1;
    if (nPts < 2) return;
    if (nPts === 2) {
      var d = Math.hypot(pts[last * 2] - pts[first * 2], pts[last * 2 + 1] - pts[first * 2 + 1]) / 3;
      out.push([
        pts[first * 2], pts[first * 2 + 1],
        pts[first * 2] + t1[0] * d, pts[first * 2 + 1] + t1[1] * d,
        pts[last * 2] + t2[0] * d, pts[last * 2 + 1] + t2[1] * d,
        pts[last * 2], pts[last * 2 + 1]
      ]);
      return;
    }
    var u = chordParam(pts, first, last);
    var bez = generateBezier(pts, first, last, u, t1, t2);
    var e = maxErrorInfo(pts, first, last, bez, u);
    if (e.err < maxError) { out.push(bez); return; }
    if (e.err < maxError * 4) {
      for (var i = 0; i < 12; i++) {
        var uP = reparametrize(pts, first, last, u, bez);
        bez = generateBezier(pts, first, last, uP, t1, t2);
        e = maxErrorInfo(pts, first, last, bez, uP);
        if (e.err < maxError) { out.push(bez); return; }
        u = uP;
      }
    }
    var split = clamp(e.idx, first + 1, last - 1);
    var tcx = pts[(split - 1) * 2] - pts[(split + 1) * 2];
    var tcy = pts[(split - 1) * 2 + 1] - pts[(split + 1) * 2 + 1];
    var tl = Math.hypot(tcx, tcy) || 1;
    var tc = [tcx / tl, tcy / tl];
    fitCurve(pts, first, split, t1, tc, maxError, out);
    fitCurve(pts, split, last, [-tc[0], -tc[1]], t2, maxError, out);
  }

  function chordParam(pts, first, last) {
    var u = new Float64Array(last - first + 1);
    u[0] = 0;
    for (var i = first + 1; i <= last; i++) {
      u[i - first] = u[i - first - 1] + Math.hypot(pts[i * 2] - pts[(i - 1) * 2], pts[i * 2 + 1] - pts[(i - 1) * 2 + 1]);
    }
    var total = u[u.length - 1];
    if (total > 0) for (var j = 0; j < u.length; j++) u[j] /= total;
    return u;
  }

  function B0(u) { var t = 1 - u; return t * t * t; }
  function B1(u) { var t = 1 - u; return 3 * t * t * u; }
  function B2(u) { return 3 * (1 - u) * u * u; }
  function B3(u) { return u * u * u; }

  function generateBezier(pts, first, last, u, t1, t2) {
    var p0x = pts[first * 2], p0y = pts[first * 2 + 1];
    var p3x = pts[last * 2], p3y = pts[last * 2 + 1];
    var c00 = 0, c01 = 0, c11 = 0, x0 = 0, x1 = 0, i, j;
    for (i = first, j = 0; i <= last; i++, j++) {
      var ui = u[j];
      var b1 = B1(ui), b2 = B2(ui);
      var a0x = t1[0] * b1, a0y = t1[1] * b1;
      var a1x = t2[0] * b2, a1y = t2[1] * b2;
      c00 += a0x * a0x + a0y * a0y;
      c01 += a0x * a1x + a0y * a1y;
      c11 += a1x * a1x + a1y * a1y;
      var px = pts[i * 2], py = pts[i * 2 + 1];
      var tmpx = px - (B0(ui) + b1) * p0x - (b2 + B3(ui)) * p3x;
      var tmpy = py - (B0(ui) + b1) * p0y - (b2 + B3(ui)) * p3y;
      x0 += a0x * tmpx + a0y * tmpy;
      x1 += a1x * tmpx + a1y * tmpy;
    }
    var det = c00 * c11 - c01 * c01;
    var al = 0, ar = 0;
    if (Math.abs(det) > 1e-12) {
      al = (x0 * c11 - x1 * c01) / det;
      ar = (c00 * x1 - c01 * x0) / det;
    }
    var segLen = Math.hypot(p3x - p0x, p3y - p0y);
    var eps = 1e-6 * segLen;
    if (al < eps || ar < eps) { al = segLen / 3; ar = segLen / 3; }
    return [p0x, p0y, p0x + t1[0] * al, p0y + t1[1] * al, p3x + t2[0] * ar, p3y + t2[1] * ar, p3x, p3y];
  }

  function bezPoint(bez, t) {
    var mt = 1 - t;
    var b0 = mt * mt * mt, b1 = 3 * mt * mt * t, b2 = 3 * mt * t * t, b3 = t * t * t;
    return [
      b0 * bez[0] + b1 * bez[2] + b2 * bez[4] + b3 * bez[6],
      b0 * bez[1] + b1 * bez[3] + b2 * bez[5] + b3 * bez[7]
    ];
  }

  function maxErrorInfo(pts, first, last, bez, u) {
    var maxDist = 0, idx = Math.floor((first + last) / 2);
    for (var i = first + 1, j = 1; i < last; i++, j++) {
      var p = bezPoint(bez, u[j]);
      var dx = p[0] - pts[i * 2], dy = p[1] - pts[i * 2 + 1];
      var d = dx * dx + dy * dy;
      if (d > maxDist) { maxDist = d; idx = i; }
      var um = (u[j - 1] + u[j]) / 2;
      var pm = bezPoint(bez, um);
      var mx = pm[0] - (pts[i * 2] + pts[(i - 1) * 2]) / 2;
      var my = pm[1] - (pts[i * 2 + 1] + pts[(i - 1) * 2 + 1]) / 2;
      var md = mx * mx + my * my;
      if (md > maxDist) { maxDist = md; idx = i; }
    }
    return { err: Math.sqrt(maxDist), idx: idx };
  }

  function reparametrize(pts, first, last, u, bez) {
    var out = new Float64Array(u.length);
    out[0] = u[0]; out[u.length - 1] = u[u.length - 1];
    for (var i = first + 1, j = 1; i < last; i++, j++) {
      var t = u[j];
      var px = pts[i * 2], py = pts[i * 2 + 1];
      for (var it = 0; it < 4; it++) {
        var p = bezPoint(bez, t);
        var d0x = p[0] - px, d0y = p[1] - py;
        var mt = 1 - t;
        var qx = 3 * mt * mt * (bez[2] - bez[0]) + 6 * mt * t * (bez[4] - bez[2]) + 3 * t * t * (bez[6] - bez[4]);
        var qy = 3 * mt * mt * (bez[3] - bez[1]) + 6 * mt * t * (bez[5] - bez[3]) + 3 * t * t * (bez[7] - bez[5]);
        var ql = qx * qx + qy * qy;
        if (ql < 1e-14) break;
        var tNew = t - (d0x * qx + d0y * qy) / ql;
        if (tNew <= 0 || tNew >= 1) break;
        var step = Math.abs(tNew - t);
        t = tNew;
        if (step < 1e-8) break;
      }
      out[j] = t;
    }
    return out;
  }

  /* ============================ 8. LOOP → SUBPATH ============================ */

  // [1,2,1] smoothing of an open span; endpoints (corners) stay fixed.
  function smoothSpanFixed(pts, count, passes) {
    if (count < 3) return;
    var tmp = new Float64Array(pts.length);
    for (var p = 0; p < passes; p++) {
      tmp.set(pts);
      for (var i = 1; i < count; i++) {
        pts[i * 2] = (tmp[(i - 1) * 2] + 2 * tmp[i * 2] + tmp[(i + 1) * 2]) * 0.25;
        pts[i * 2 + 1] = (tmp[(i - 1) * 2 + 1] + 2 * tmp[i * 2 + 1] + tmp[(i + 1) * 2 + 1]) * 0.25;
      }
    }
  }

  function spanIsStraight(pts, count, thr) {
    var ax = pts[0], ay = pts[1];
    var dx = pts[count * 2] - ax, dy = pts[count * 2 + 1] - ay;
    var len = Math.hypot(dx, dy);
    if (len < 1.5) return count < 4;   // a long span that returns to its start is a loop, never a line
    for (var i = 1; i < count; i++) {
      var d = Math.abs((pts[i * 2] - ax) * dy - (pts[i * 2 + 1] - ay) * dx) / len;
      if (d > thr) return false;
    }
    return true;
  }

  function pushBeziers(segs, beziers, snapLines) {
    for (var bi = 0; bi < beziers.length; bi++) {
      var bz = beziers[bi];
      if (isStraight(bz, snapLines)) segs.push({ l: [round3(bz[6]), round3(bz[7])] });
      else segs.push({ c: [round3(bz[2]), round3(bz[3]), round3(bz[4]), round3(bz[5]), round3(bz[6]), round3(bz[7])] });
    }
  }

  // Traces one closed lattice loop into a subpath of cubic/line segments.
  // Pipeline: corner detection → corner refinement (line intersection) →
  // per-span staircase smoothing with fixed corners → straight-span detection
  // with horizontal/vertical snapping → Schneider cubic fitting.
  // Subpath: { start:[x,y], segs:[{c:[c1x,c1y,c2x,c2y,x,y]}|{l:[x,y]}], closed, nodes }
  function traceLoop(loop, opts) {
    var n = loop.length / 2;
    var tol = clamp(opts.tolerance == null ? 1 : opts.tolerance, 0.05, 20);
    var sharp = opts.sharpCorners !== false;
    var snap = !!opts.snapLines;   // Illustrator "Snap Curves To Lines"
    var segs = [];
    if (n < 8) {
      for (var q = 1; q < n; q++) segs.push({ l: [loop[q * 2], loop[q * 2 + 1]] });
      return { start: [loop[0], loop[1]], segs: segs, closed: true, nodes: n };
    }
    var corners = findCorners(loop, opts.cornerThreshold);
    var startX, startY;

    if (!corners.length) {
      // Smooth closed shape (circle, ellipse, blob): G1-continuous 4-piece fit.
      var sm = smoothClosed(loop, n, 3);
      var splits = [0, Math.round(n * 0.25), Math.round(n * 0.5), Math.round(n * 0.75)];
      var tans = splits.map(function (i) {
        var a = ((i - 2) + n) % n, b = (i + 2) % n;
        return norm2(sm[b * 2] - sm[a * 2], sm[b * 2 + 1] - sm[a * 2 + 1]);
      });
      startX = sm[0]; startY = sm[1];
      for (var s = 0; s < 4; s++) {
        var a0 = splits[s], b0 = splits[(s + 1) % 4];
        var cnt = (b0 - a0 + n) % n;
        if (cnt < 1) continue;
        var span = new Float64Array((cnt + 1) * 2);
        for (var p = 0; p <= cnt; p++) {
          var ii = ((a0 + p) % n) * 2;
          span[p * 2] = sm[ii]; span[p * 2 + 1] = sm[ii + 1];
        }
        var tE = tans[(s + 1) % 4];
        var bz = [];
        fitCurve(span, 0, cnt, tans[s], [-tE[0], -tE[1]], tol, bz);
        pushBeziers(segs, bz, snap);
      }
    } else {
      var nc = corners.length;
      var cpos = [];
      if (sharp) {
        var keptC = [];
        for (var c = 0; c < nc; c++) {
          var rc = refineCorner(loop, n, corners, c);
          if (rc) { keptC.push(corners[c]); cpos.push(rc); }
        }
        if (keptC.length && keptC.length < nc) {
          // re-refine with the surviving corner set (arm lengths changed)
          corners = keptC; nc = corners.length; cpos = [];
          for (var c1 = 0; c1 < nc; c1++) cpos.push(refineCorner(loop, n, corners, c1) || [loop[corners[c1] * 2], loop[corners[c1] * 2 + 1]]);
        } else if (!keptC.length) {
          corners = [corners[0]]; nc = 1; cpos = [[loop[corners[0] * 2], loop[corners[0] * 2 + 1]]];
        }
      } else {
        for (var c2 = 0; c2 < nc; c2++) cpos.push([loop[corners[c2] * 2], loop[corners[c2] * 2 + 1]]);
      }
      var straightThr = snap ? clamp(tol * 1.6, 1.0, 2.6) : clamp(tol * 0.7, 0.45, 1.2);
      var spans = [];
      for (var s2 = 0; s2 < nc; s2++) {
        var a = corners[s2], b = corners[(s2 + 1) % nc];
        var count = (b - a + n) % n || n;
        var pts = new Float64Array((count + 1) * 2);
        for (var k = 0; k <= count; k++) {
          var idx = ((a + k) % n) * 2;
          pts[k * 2] = loop[idx]; pts[k * 2 + 1] = loop[idx + 1];
        }
        pts[0] = cpos[s2][0]; pts[1] = cpos[s2][1];
        pts[count * 2] = cpos[(s2 + 1) % nc][0]; pts[count * 2 + 1] = cpos[(s2 + 1) % nc][1];
        smoothSpanFixed(pts, count, 2);
        spans.push({ pts: pts, count: count, straight: spanIsStraight(pts, count, straightThr) });
      }
      // Snap nearly horizontal / vertical straight edges to exact axes.
      if (sharp || snap) {
        var axTol = snap ? 0.09 : 0.035;
        for (var s3 = 0; s3 < nc; s3++) {
          if (!spans[s3].straight) continue;
          var A = cpos[s3], B = cpos[(s3 + 1) % nc];
          var ddx = B[0] - A[0], ddy = B[1] - A[1];
          if (Math.abs(ddy) <= Math.abs(ddx) * axTol) { var my = (A[1] + B[1]) / 2; A[1] = my; B[1] = my; }
          else if (Math.abs(ddx) <= Math.abs(ddy) * axTol) { var mx = (A[0] + B[0]) / 2; A[0] = mx; B[0] = mx; }
        }
      }
      startX = cpos[0][0]; startY = cpos[0][1];
      for (var s4 = 0; s4 < nc; s4++) {
        var sp = spans[s4];
        var P = sp.pts, cn = sp.count;
        var E = cpos[(s4 + 1) % nc];
        P[0] = cpos[s4][0]; P[1] = cpos[s4][1];
        P[cn * 2] = E[0]; P[cn * 2 + 1] = E[1];
        if (sp.straight || cn < 2) {
          segs.push({ l: [round3(E[0]), round3(E[1])] });
          continue;
        }
        var m = Math.min(3, cn);
        var t1 = norm2(P[m * 2] - P[0], P[m * 2 + 1] - P[1]);
        var t2 = norm2(P[(cn - m) * 2] - P[cn * 2], P[(cn - m) * 2 + 1] - P[cn * 2 + 1]);
        var bzs = [];
        fitCurve(P, 0, cn, t1, t2, tol, bzs);
        pushBeziers(segs, bzs, snap);
      }
    }
    if (!segs.length) return null;
    var outSp = { start: [round3(startX), round3(startY)], segs: segs, closed: true, nodes: 0 };
    mergeCollinear(outSp);
    outSp.nodes = outSp.segs.length + 1;
    return outSp;
  }

  // Merge runs of consecutive line segments whose shared vertex lies on the
  // chord (within 0.35 px) — removes redundant nodes on straight edges.
  function mergeCollinear(sp) {
    var segs = sp.segs;
    if (segs.length < 3) return;
    var changed = true;
    while (changed && segs.length > 3) {
      changed = false;
      var px = sp.start[0], py = sp.start[1];
      for (var i = 0; i + 1 < segs.length; i++) {
        var a = segs[i], b = segs[i + 1];
        var ax = a.l ? a.l[0] : a.c[4], ay = a.l ? a.l[1] : a.c[5];
        if (a.l && b.l) {
          var dx = b.l[0] - px, dy = b.l[1] - py;
          var len = Math.hypot(dx, dy);
          if (len > 1e-6 && Math.abs((ax - px) * dy - (ay - py) * dx) / len < 0.35 &&
              ((ax - px) * dx + (ay - py) * dy) > 0 && ((b.l[0] - ax) * dx + (b.l[1] - ay) * dy) > 0) {
            segs.splice(i, 1);
            changed = true;
            break;
          }
        }
        px = ax; py = ay;
      }
    }
  }

  function norm2(x, y) {
    var l = Math.hypot(x, y);
    return l > 1e-9 ? [x / l, y / l] : [1, 0];
  }

  function isStraight(bz, loose) {
    // both control points hug the chord → emit a line segment (crisper edges,
    // smaller files). Tolerance scales with length but is capped at 0.8 px
    // (2.2 px with "Snap Curves To Lines").
    var dx = bz[6] - bz[0], dy = bz[7] - bz[1];
    var len = Math.hypot(dx, dy);
    if (len < 1e-9) return true;
    var lim = loose ? Math.max(0.6, Math.min(len * 0.07, 2.2)) : Math.max(0.25, Math.min(len * 0.03, 0.8));
    var d1 = Math.abs((bz[2] - bz[0]) * dy - (bz[3] - bz[1]) * dx) / len;
    var d2 = Math.abs((bz[4] - bz[0]) * dy - (bz[5] - bz[1]) * dx) / len;
    return d1 < lim && d2 < lim;
  }

  function round3(v) { return Math.round(v * 1000) / 1000; }

  function offsetSubpath(sp, ox, oy) {
    sp.start[0] = round3(sp.start[0] + ox); sp.start[1] = round3(sp.start[1] + oy);
    for (var i = 0; i < sp.segs.length; i++) {
      var s = sp.segs[i];
      if (s.c) {
        s.c[0] = round3(s.c[0] + ox); s.c[1] = round3(s.c[1] + oy);
        s.c[2] = round3(s.c[2] + ox); s.c[3] = round3(s.c[3] + oy);
        s.c[4] = round3(s.c[4] + ox); s.c[5] = round3(s.c[5] + oy);
      } else {
        s.l[0] = round3(s.l[0] + ox); s.l[1] = round3(s.l[1] + oy);
      }
    }
  }

  /* ============================ 9. TRACE PIPELINE ============================ */

  // Traces a binary mask into an array of subpaths. (ox, oy) offsets the
  // geometry when the mask is a crop of a larger image.
  function traceMask(mask, w, h, opts, ox, oy) {
    var loops = traceContours(mask, w, h);
    var subpaths = [];
    var totalArea = 0;
    for (var i = 0; i < loops.length; i++) {
      var sp = traceLoop(loops[i], opts);
      if (!sp) continue;
      sp.area = Math.abs(loopArea(loops[i]));
      if (ox || oy) offsetSubpath(sp, ox || 0, oy || 0);
      totalArea += sp.area;
      subpaths.push(sp);
    }
    return { subpaths: subpaths, area: totalArea };
  }

  /* ---------- least-squares colour models (solid / linear / quadratic) ---------- */

  // Per-region sufficient statistics layout (Float64Array block of ST):
  // [0..14] spatial moments, [15..32] Σ monomial·colour (6 monomials × RGB),
  // [33..35] Σ colour², [36..39] bbox minX,minY,maxX,maxY (pixels),
  // [40] pixel count (all pixels), [41..43] Σ colour (all pixels). Moments and
  // model sums use INTERIOR pixels only (anti-aliased rims would bias fits).
  var ST = 44;
  var MOM_EXP = [[0, 0], [1, 0], [0, 1], [2, 0], [1, 1], [0, 2], [3, 0], [2, 1], [1, 2], [0, 3], [4, 0], [3, 1], [2, 2], [1, 3], [0, 4]];
  var MONO = [[0, 0], [1, 0], [0, 1], [2, 0], [1, 1], [0, 2]];
  var MI = (function () {
    var t = [];
    for (var i = 0; i < 6; i++) {
      t.push([]);
      for (var j = 0; j < 6; j++) {
        var ex = MONO[i][0] + MONO[j][0], ey = MONO[i][1] + MONO[j][1];
        for (var m = 0; m < MOM_EXP.length; m++) if (MOM_EXP[m][0] === ex && MOM_EXP[m][1] === ey) t[i].push(m);
      }
    }
    return t;
  })();

  function addPixelStats(S, o, X, Y, r, g, b, px, py, interior) {
    S[o + 40] += 1; S[o + 41] += r; S[o + 42] += g; S[o + 43] += b;
    if (px < S[o + 36]) S[o + 36] = px;
    if (py < S[o + 37]) S[o + 37] = py;
    if (px > S[o + 38]) S[o + 38] = px;
    if (py > S[o + 39]) S[o + 39] = py;
    if (!interior) return;
    var x2 = X * X, xy = X * Y, y2 = Y * Y;
    S[o] += 1; S[o + 1] += X; S[o + 2] += Y; S[o + 3] += x2; S[o + 4] += xy; S[o + 5] += y2;
    S[o + 6] += x2 * X; S[o + 7] += x2 * Y; S[o + 8] += X * y2; S[o + 9] += y2 * Y;
    S[o + 10] += x2 * x2; S[o + 11] += x2 * xy; S[o + 12] += x2 * y2; S[o + 13] += xy * y2; S[o + 14] += y2 * y2;
    var mono0 = 1, mono1 = X, mono2 = Y, mono3 = x2, mono4 = xy, mono5 = y2;
    var mons = [mono0, mono1, mono2, mono3, mono4, mono5];
    for (var m = 0; m < 6; m++) {
      var base = o + 15 + m * 3;
      S[base] += mons[m] * r; S[base + 1] += mons[m] * g; S[base + 2] += mons[m] * b;
    }
    S[o + 33] += r * r; S[o + 34] += g * g; S[o + 35] += b * b;
  }

  function mergeStats(S, oa, ob) {
    for (var i = 0; i < 36; i++) S[oa + i] += S[ob + i];
    for (var j = 40; j < 44; j++) S[oa + j] += S[ob + j];
    if (S[ob + 36] < S[oa + 36]) S[oa + 36] = S[ob + 36];
    if (S[ob + 37] < S[oa + 37]) S[oa + 37] = S[ob + 37];
    if (S[ob + 38] > S[oa + 38]) S[oa + 38] = S[ob + 38];
    if (S[ob + 39] > S[oa + 39]) S[oa + 39] = S[ob + 39];
  }

  // Least-squares fit with the first `terms` monomials (1 → solid, 3 → linear,
  // 6 → quadratic). Returns { sse, beta:[[...]×3] }. Works on summed stats
  // from one array or the sum of two blocks (oa, ob ≥ 0).
  function fitModel(S, oa, ob, terms) {
    var get = function (i) { return S[oa + i] + (ob >= 0 ? S[ob + i] : 0); };
    var A = [], Bm = [], rhs0 = [];
    for (var i = 0; i < terms; i++) {
      var row = [];
      for (var j = 0; j < terms; j++) row.push(get(MI[i][j]));
      A.push(row);
      var rr = [get(15 + i * 3), get(15 + i * 3 + 1), get(15 + i * 3 + 2)];
      Bm.push(rr.slice());
      rhs0.push(rr);
    }
    var tr = 0;
    for (var d = 0; d < terms; d++) tr += A[d][d];
    for (var d2 = 0; d2 < terms; d2++) A[d2][d2] += 1e-9 * tr + 1e-12;
    for (var col = 0; col < terms; col++) {
      var piv = col, best = Math.abs(A[col][col]);
      for (var r2 = col + 1; r2 < terms; r2++) if (Math.abs(A[r2][col]) > best) { best = Math.abs(A[r2][col]); piv = r2; }
      if (best < 1e-18) continue;
      if (piv !== col) { var tA = A[piv]; A[piv] = A[col]; A[col] = tA; var tB = Bm[piv]; Bm[piv] = Bm[col]; Bm[col] = tB; }
      for (var r3 = col + 1; r3 < terms; r3++) {
        var f = A[r3][col] / A[col][col];
        if (!f) continue;
        for (var c3 = col; c3 < terms; c3++) A[r3][c3] -= f * A[col][c3];
        for (var ch = 0; ch < 3; ch++) Bm[r3][ch] -= f * Bm[col][ch];
      }
    }
    var beta = [new Float64Array(terms), new Float64Array(terms), new Float64Array(terms)];
    for (var ch2 = 0; ch2 < 3; ch2++) {
      for (var r4 = terms - 1; r4 >= 0; r4--) {
        var s = Bm[r4][ch2];
        for (var c4 = r4 + 1; c4 < terms; c4++) s -= A[r4][c4] * beta[ch2][c4];
        beta[ch2][r4] = Math.abs(A[r4][r4]) > 1e-18 ? s / A[r4][r4] : 0;
      }
    }
    var sse = 0;
    for (var ch3 = 0; ch3 < 3; ch3++) {
      var e = get(33 + ch3);
      for (var k = 0; k < terms; k++) e -= beta[ch3][k] * rhs0[k][ch3];
      sse += Math.max(0, e);
    }
    return { sse: sse, beta: beta };
  }

  function statsRms(S, oa, ob, terms) {
    var n = S[oa] + (ob >= 0 ? S[ob] : 0);
    if (n <= 0) return 0;
    return Math.sqrt(fitModel(S, oa, ob, terms).sse / (3 * n));
  }

  function solidSse(S, o) {
    var n = S[o];
    if (n <= 0) return 0;
    var e = 0;
    for (var c = 0; c < 3; c++) e += S[o + 33 + c] - S[o + 15 + c] * S[o + 15 + c] / n;
    return Math.max(0, e);
  }

  function meanOf(S, o) {
    var n = S[o + 40] || 1;
    return [S[o + 41] / n, S[o + 42] / n, S[o + 43] / n];
  }

  // Simplify gradient stops (Douglas–Peucker in colour space over offset).
  function simplifyStops(stops, tolC) {
    if (stops.length <= 2) return stops;
    var keep = new Uint8Array(stops.length);
    keep[0] = 1; keep[stops.length - 1] = 1;
    (function rec(a, b) {
      if (b - a < 2) return;
      var worst = -1, wi = -1;
      for (var i = a + 1; i < b; i++) {
        var t = (stops[i].o - stops[a].o) / ((stops[b].o - stops[a].o) || 1);
        var e = 0;
        for (var c = 0; c < 3; c++) {
          var v = stops[a].c[c] + (stops[b].c[c] - stops[a].c[c]) * t;
          e = Math.max(e, Math.abs(v - stops[i].c[c]));
        }
        if (e > worst) { worst = e; wi = i; }
      }
      if (worst > tolC) { keep[wi] = 1; rec(a, wi); rec(wi, b); }
    })(0, stops.length - 1);
    return stops.filter(function (_, i) { return keep[i]; });
  }

  /* ---------- colour mode: region segmentation + gradient-aware merging ---------- */

  function traceColor(data, w, h, opts) {
    var N = w * h;
    var fixedPal = opts.fixedPalette && opts.fixedPalette.length ? opts.fixedPalette.slice(0, 254) : null;
    var q = fixedPal
      ? { palette: fixedPal.map(function (c) { return [c[0] | 0, c[1] | 0, c[2] | 0]; }), index: assignLut(data, w, h, fixedPal) }
      : quantize(data, w, h, opts.colors || 8);
    var cls = q.index;
    // Illustrator "Ignore White": white palette entries become transparent holes
    if (opts.ignoreWhite) {
      var whiteIdx = q.palette.map(function (c) {
        var mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]);
        return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) >= 232 && mx - mn <= 22;
      });
      for (var wp = 0; wp < N; wp++) if (cls[wp] !== 255 && whiteIdx[cls[wp]]) cls[wp] = 255;
    }
    var minArea = Math.max(0, Math.round(opts.minArea || 0));
    var gradients = opts.gradients !== false && !fixedPal;
    var stackedMode = opts.stacking !== 'cutout';
    var traceOpts = { tolerance: opts.tolerance, cornerThreshold: opts.cornerThreshold, sharpCorners: opts.sharpCorners, snapLines: opts.snapLines };
    var x, y, p, i;

    // 1. connected components of equal palette index (4-connectivity)
    var label = new Int32Array(N).fill(-1);
    var stack = new Int32Array(N);
    var R = 0;
    var regCluster = [];
    for (p = 0; p < N; p++) {
      if (cls[p] === 255 || label[p] >= 0) continue;
      var cc = cls[p];
      var sp = 0; stack[sp++] = p; label[p] = R;
      while (sp) {
        var qq = stack[--sp];
        var qx = qq % w;
        if (qx > 0 && label[qq - 1] < 0 && cls[qq - 1] === cc) { label[qq - 1] = R; stack[sp++] = qq - 1; }
        if (qx < w - 1 && label[qq + 1] < 0 && cls[qq + 1] === cc) { label[qq + 1] = R; stack[sp++] = qq + 1; }
        if (qq >= w && label[qq - w] < 0 && cls[qq - w] === cc) { label[qq - w] = R; stack[sp++] = qq - w; }
        if (qq + w < N && label[qq + w] < 0 && cls[qq + w] === cc) { label[qq + w] = R; stack[sp++] = qq + w; }
      }
      regCluster.push(cc);
      R++;
    }
    if (!R) return finish([], w, h, q.palette);

    // 2. basic stats for sliver / speck absorption
    var cnt = new Float64Array(R), sum = new Float64Array(R * 3), perim = new Float64Array(R);
    var adj = new Map();
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        p = y * w + x;
        var lp = label[p];
        if (lp < 0) continue;
        cnt[lp]++;
        sum[lp * 3] += data[p * 4]; sum[lp * 3 + 1] += data[p * 4 + 1]; sum[lp * 3 + 2] += data[p * 4 + 2];
        if (x === 0 || x === w - 1) perim[lp]++;
        if (y === 0 || y === h - 1) perim[lp]++;
        var nbs = [x < w - 1 ? p + 1 : -1, y < h - 1 ? p + w : -1];
        for (var e = 0; e < 2; e++) {
          var qn = nbs[e];
          if (qn < 0) continue;
          var lq = label[qn];
          if (lq === lp) continue;
          perim[lp]++;
          if (lq < 0) continue;
          perim[lq]++;
          var key = lp < lq ? lp * R + lq : lq * R + lp;
          adj.set(key, (adj.get(key) || 0) + 1);
        }
        if (x > 0 && label[p - 1] < 0) perim[lp]++;
        if (y > 0 && label[p - w] < 0) perim[lp]++;
      }
    }
    var means = new Float64Array(R * 3);
    for (i = 0; i < R; i++) for (var c0 = 0; c0 < 3; c0++) means[i * 3 + c0] = sum[i * 3 + c0] / (cnt[i] || 1);
    var nbList = [];
    for (i = 0; i < R; i++) nbList.push([]);
    adj.forEach(function (v, k) {
      var a = Math.floor(k / R), b = k - a * R;
      nbList[a].push([b, v]); nbList[b].push([a, v]);
    });
    function mdist(a, b) {
      return colorDist(means[a * 3], means[a * 3 + 1], means[a * 3 + 2], means[b * 3], means[b * 3 + 1], means[b * 3 + 2]);
    }

    // 3. decide which regions get absorbed: specks (< minArea) and thin
    //    anti-aliasing slivers whose colour is a blend of their neighbours.
    var absorb = new Uint8Array(R);
    var bigLimit = Math.max(400, N * 0.02);
    for (i = 0; i < R; i++) {
      if (cnt[i] < minArea) { absorb[i] = 1; continue; }
      if (cnt[i] > bigLimit) continue;
      var thin = cnt[i] / Math.max(1, perim[i]);
      if (thin >= 1.6) continue;
      var nb = nbList[i].slice().sort(function (a, b) { return b[1] - a[1] || a[0] - b[0]; });
      if (!nb.length) continue;
      if (nb.length === 1) { if (mdist(i, nb[0][0]) < 45) absorb[i] = 1; continue; }
      var A0 = nb[0][0], B0 = nb[1][0];
      var dab = mdist(A0, B0);
      if (dab > 20 && mdist(A0, i) + mdist(i, B0) <= dab * 1.12 + 6) absorb[i] = 1;
    }

    // 4. per-pixel reassignment of absorbed pixels to the best-matching
    //    neighbouring region → sub-pixel accurate shared edges.
    var pending = [];
    for (p = 0; p < N; p++) if (label[p] >= 0 && absorb[label[p]]) pending.push(p);
    var assigned = new Uint8Array(N); // 1 = resolved
    // Reference colour per resolved pixel: its own colour for genuine region
    // pixels, inherited for reassigned ones. Comparing an edge pixel with the
    // *local* neighbour colour (not the region mean) keeps edges accurate on
    // gradient regions and splits anti-aliased pixels at 50 % coverage.
    var ref = new Uint8ClampedArray(N * 3);
    for (p = 0; p < N; p++) {
      if (label[p] >= 0 && !absorb[label[p]]) {
        assigned[p] = 1;
        ref[p * 3] = data[p * 4]; ref[p * 3 + 1] = data[p * 4 + 1]; ref[p * 3 + 2] = data[p * 4 + 2];
      }
    }
    var newLab = new Int32Array(pending.length);
    var newRef = new Int32Array(pending.length);
    var absorbedPx = pending.slice();
    for (var pass = 0; pass < 48 && pending.length; pass++) {
      var changed = 0;
      for (var pi = 0; pi < pending.length; pi++) {
        var pp = pending[pi];
        var px = pp % w;
        var best = -1, bd = Infinity, bq = -1;
        var sec = -1, sd = Infinity, sq = -1;
        var cand = [px > 0 ? pp - 1 : -1, px < w - 1 ? pp + 1 : -1, pp >= w ? pp - w : -1, pp + w < N ? pp + w : -1];
        for (var ci = 0; ci < 4; ci++) {
          var qc = cand[ci];
          if (qc < 0 || !assigned[qc]) continue;
          var dd = colorDist(data[pp * 4], data[pp * 4 + 1], data[pp * 4 + 2], ref[qc * 3], ref[qc * 3 + 1], ref[qc * 3 + 2]);
          var lq2 = label[qc];
          if (dd < bd) {
            if (best >= 0 && best !== lq2) { sec = best; sd = bd; sq = bq; }
            bd = dd; best = lq2; bq = qc;
          } else if (lq2 !== best && dd < sd) { sec = lq2; sd = dd; sq = qc; }
        }
        // ~50 % coverage tie → always favour the smaller (foreground) region,
        // so an edge sitting on a half-pixel resolves to ONE straight side.
        if (sec >= 0 && sd - bd < 0.15 * (sd + bd) && cnt[sec] < cnt[best]) { best = sec; bq = sq; }
        newLab[pi] = best;
        newRef[pi] = bq;
      }
      var rest = [];
      for (var pj = 0; pj < pending.length; pj++) {
        if (newLab[pj] >= 0) {
          var tgt = pending[pj], src = newRef[pj];
          label[tgt] = newLab[pj];
          ref[tgt * 3] = ref[src * 3]; ref[tgt * 3 + 1] = ref[src * 3 + 1]; ref[tgt * 3 + 2] = ref[src * 3 + 2];
          changed++;
        } else { rest.push(pending[pj]); }
      }
      for (var pk = 0; pk < pending.length; pk++) if (newLab[pk] >= 0) assigned[pending[pk]] = 1;
      pending = rest;
      newLab = new Int32Array(pending.length);
      newRef = new Int32Array(pending.length);
      if (!changed) break;
    }
    // Edge consistency: anti-aliased pixels at ~50 % coverage can flip-flop
    // between the two sides, producing a 1-px zigzag. A sequential majority
    // pass over the reassigned pixels straightens such edges.
    for (var mpass = 0; mpass < 2; mpass++) {
      for (var ai = 0; ai < absorbedPx.length; ai++) {
        var ap = absorbedPx[ai];
        var own = label[ap];
        if (own < 0) continue;
        var ax0 = ap % w;
        var nl = [ax0 > 0 ? label[ap - 1] : -2, ax0 < w - 1 ? label[ap + 1] : -2, ap >= w ? label[ap - w] : -2, ap + w < N ? label[ap + w] : -2];
        for (var a1 = 0; a1 < 4; a1++) {
          var cand2 = nl[a1];
          if (cand2 < 0 || cand2 === own) continue;
          var votes = 0;
          for (var a2 = 0; a2 < 4; a2++) if (nl[a2] === cand2) votes++;
          if (votes >= 3) { label[ap] = cand2; break; }
        }
      }
    }
    // unresolved leftovers: drop tiny isolated specks, keep everything else
    for (var pr = 0; pr < pending.length; pr++) {
      var lo = label[pending[pr]];
      if (cnt[lo] < minArea) label[pending[pr]] = -1;
    }

    // 5. full statistics (normalised coordinates for numeric stability)
    var Sc = Math.max(w, h) / 2;
    var S = new Float64Array(R * ST);
    for (i = 0; i < R; i++) { S[i * ST + 36] = Infinity; S[i * ST + 37] = Infinity; S[i * ST + 38] = -1; S[i * ST + 39] = -1; }
    var edges = new Map(); // key → [count, sumDiff]
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        p = y * w + x;
        var l = label[p];
        if (l < 0) continue;
        var o4 = p * 4;
        var interior = x > 0 && x < w - 1 && y > 0 && y < h - 1 &&
          label[p - 1] === l && label[p + 1] === l && label[p - w] === l && label[p + w] === l;
        addPixelStats(S, l * ST, (x + 0.5 - w / 2) / Sc, (y + 0.5 - h / 2) / Sc, data[o4], data[o4 + 1], data[o4 + 2], x, y, interior);
        var nb2 = [x < w - 1 ? p + 1 : -1, y < h - 1 ? p + w : -1];
        for (var e2 = 0; e2 < 2; e2++) {
          var q2 = nb2[e2];
          if (q2 < 0) continue;
          var l2 = label[q2];
          if (l2 < 0 || l2 === l) continue;
          var k2 = l < l2 ? l * R + l2 : l2 * R + l;
          var rec = edges.get(k2);
          if (!rec) { rec = [0, 0]; edges.set(k2, rec); }
          rec[0]++;
          rec[1] += colorDist(data[o4], data[o4 + 1], data[o4 + 2], data[q2 * 4], data[q2 * 4 + 1], data[q2 * 4 + 2]);
        }
      }
    }
    var origMean = new Float64Array(R * 3);
    for (i = 0; i < R; i++) { var mm = meanOf(S, i * ST); origMean[i * 3] = mm[0]; origMean[i * 3 + 1] = mm[1]; origMean[i * 3 + 2] = mm[2]; }

    // 6. union-find merging: near-identical colours always; smooth (soft)
    //    boundaries whose union is still well explained by a smooth colour
    //    field → one gradient region instead of many solid bands.
    var parent = new Int32Array(R);
    for (i = 0; i < R; i++) parent[i] = i;
    function find(a) { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; }
    var rmsCache = new Float64Array(R).fill(-1);
    function rootRms(r) { if (rmsCache[r] < 0) rmsCache[r] = statsRms(S, r * ST, -1, 6); return rmsCache[r]; }
    var elist = [];
    edges.forEach(function (v, k) {
      var a = Math.floor(k / R), b = k - a * R;
      var od = colorDist(origMean[a * 3], origMean[a * 3 + 1], origMean[a * 3 + 2], origMean[b * 3], origMean[b * 3 + 1], origMean[b * 3 + 2]);
      elist.push([a, b, v[0], v[1] / v[0], od]);
    });
    elist.sort(function (A, B) { return A[4] - B[4] || A[0] - B[0] || A[1] - B[1]; });
    for (var mp = 0; mp < 4; mp++) {
      var merged = 0;
      for (var ei = 0; ei < elist.length; ei++) {
        var E = elist[ei];
        var ra = find(E[0]), rb = find(E[1]);
        if (ra === rb) continue;
        var ma = meanOf(S, ra * ST), mb = meanOf(S, rb * ST);
        var dm = colorDist(ma[0], ma[1], ma[2], mb[0], mb[1], mb[2]);
        var ok = dm < 5;
        if (!ok && gradients && E[2] >= 2 && dm < 140) {
          var softThr = Math.max(4, 0.42 * E[4]);
          if (E[3] < softThr) {
            var rmsM = statsRms(S, ra * ST, rb * ST, 6);
            ok = rmsM <= 7.5 && rmsM <= Math.max(rootRms(ra), rootRms(rb)) + 3.5;
          }
        }
        if (!ok) continue;
        if (S[ra * ST + 40] < S[rb * ST + 40]) { var t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        mergeStats(S, ra * ST, rb * ST);
        rmsCache[ra] = -1;
        merged++;
      }
      if (!merged) break;
    }

    // 7. compact roots + fill models
    var rootIdx = new Int32Array(R).fill(-1);
    var roots = [];
    for (i = 0; i < R; i++) {
      var r0 = find(i);
      if (S[r0 * ST + 40] <= 0) continue;
      if (rootIdx[r0] < 0) { rootIdx[r0] = roots.length; roots.push(r0); }
    }
    for (i = 0; i < R; i++) rootIdx[i] = rootIdx[find(i)];
    var K = roots.length;
    var fills = [];
    var BINS = 40;
    var cand = [];   // per compact root: { lin:{ux,uy,t0,t1,bins}, rad:{cx,cy,r1,bins} }
    for (var kk = 0; kk < K; kk++) {
      var o = roots[kk] * ST;
      var n0 = S[o];
      var mean = meanOf(S, o);
      fills.push({ mean: mean, gradient: null, cluster: regCluster[roots[kk]] });
      cand.push(null);
      if (!gradients || n0 < 80) continue;
      var sse0 = solidSse(S, o);
      if (Math.sqrt(sse0 / (3 * n0)) < 4) continue;
      var bx0 = S[o + 36], by0 = S[o + 37], bx1 = S[o + 38] + 1, by1 = S[o + 39] + 1;
      var entry = { sse0: sse0 };
      // linear direction = principal axis of the per-channel colour slopes
      var lin = fitModel(S, o, -1, 3);
      var mxx = 0, mxy = 0, myy = 0;
      for (var c1 = 0; c1 < 3; c1++) {
        var gx = lin.beta[c1][1], gy = lin.beta[c1][2];
        mxx += gx * gx; mxy += gx * gy; myy += gy * gy;
      }
      if (mxx + myy > 1e-9) {
        var ang = 0.5 * Math.atan2(2 * mxy, mxx - myy);
        var ux = Math.cos(ang), uy = Math.sin(ang);
        var corners4 = [[bx0, by0], [bx1, by0], [bx0, by1], [bx1, by1]];
        var t0 = Infinity, t1 = -Infinity;
        corners4.forEach(function (pt) { var tt = pt[0] * ux + pt[1] * uy; if (tt < t0) t0 = tt; if (tt > t1) t1 = tt; });
        if (t1 - t0 > 2) entry.lin = { ux: ux, uy: uy, t0: t0, t1: t1, bins: new Float64Array(BINS * 7) };
      }
      // radial centre from the isotropic part of the quadratic fit
      var quad = fitModel(S, o, -1, 6);
      var bc = 0, bmag = -1;
      for (var c2 = 0; c2 < 3; c2++) {
        var mag = Math.abs(quad.beta[c2][3] + quad.beta[c2][5]);
        if (mag > bmag) { bmag = mag; bc = c2; }
      }
      var axx = quad.beta[bc][3], axy = quad.beta[bc][4], ayy = quad.beta[bc][5];
      var iso = Math.abs(axx + ayy);
      if (iso > 1e-6 && Math.abs(axx - ayy) <= 0.45 * iso && Math.abs(axy) <= 0.45 * iso && axx * ayy > 0) {
        var det = 4 * axx * ayy - axy * axy;
        if (Math.abs(det) > 1e-12) {
          var axn = quad.beta[bc][1], ayn = quad.beta[bc][2];
          var cxN = (-axn * 2 * ayy + axy * ayn) / det;
          var cyN = (-2 * axx * ayn + axy * axn) / det;
          var cxp = cxN * Sc + w / 2, cyp = cyN * Sc + h / 2;
          var bw = bx1 - bx0, bh = by1 - by0;
          if (cxp > bx0 - bw * 0.3 && cxp < bx1 + bw * 0.3 && cyp > by0 - bh * 0.3 && cyp < by1 + bh * 0.3) {
            var r1 = 0;
            [[bx0, by0], [bx1, by0], [bx0, by1], [bx1, by1]].forEach(function (pt) { r1 = Math.max(r1, Math.hypot(pt[0] - cxp, pt[1] - cyp)); });
            if (r1 > 2) entry.rad = { cx: cxp, cy: cyp, r1: r1, bins: new Float64Array(BINS * 7) };
          }
        }
      }
      if (entry.lin || entry.rad) cand[kk] = entry;
    }
    // bin original colours along each candidate gradient axis
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        p = y * w + x;
        if (label[p] < 0) continue;
        var ck = cand[rootIdx[label[p]]];
        if (!ck) continue;
        // skip edge pixels: anti-aliasing blends them with the neighbour colour
        var lself = rootIdx[label[p]];
        if ((x > 0 && (label[p - 1] < 0 || rootIdx[label[p - 1]] !== lself)) ||
            (x < w - 1 && (label[p + 1] < 0 || rootIdx[label[p + 1]] !== lself)) ||
            (y > 0 && (label[p - w] < 0 || rootIdx[label[p - w]] !== lself)) ||
            (y < h - 1 && (label[p + w] < 0 || rootIdx[label[p + w]] !== lself))) continue;
        var rr = data[p * 4], gg = data[p * 4 + 1], bb = data[p * 4 + 2];
        var fx = x + 0.5, fy = y + 0.5;
        if (ck.lin) {
          var tt = (fx * ck.lin.ux + fy * ck.lin.uy - ck.lin.t0) / (ck.lin.t1 - ck.lin.t0);
          var bi = clamp(Math.floor(tt * BINS), 0, BINS - 1) * 7;
          var LB = ck.lin.bins;
          LB[bi]++; LB[bi + 1] += rr; LB[bi + 2] += gg; LB[bi + 3] += bb; LB[bi + 4] += rr * rr; LB[bi + 5] += gg * gg; LB[bi + 6] += bb * bb;
        }
        if (ck.rad) {
          var rt = Math.hypot(fx - ck.rad.cx, fy - ck.rad.cy) / ck.rad.r1;
          var bj = clamp(Math.floor(rt * BINS), 0, BINS - 1) * 7;
          var RB = ck.rad.bins;
          RB[bj]++; RB[bj + 1] += rr; RB[bj + 2] += gg; RB[bj + 3] += bb; RB[bj + 4] += rr * rr; RB[bj + 5] += gg * gg; RB[bj + 6] += bb * bb;
        }
      }
    }
    function binModel(B, n0) {
      var sse = 0, stops = [];
      var minN = Math.max(3, n0 * 0.002);
      for (var b = 0; b < BINS; b++) {
        var o7 = b * 7, nb0 = B[o7];
        if (!nb0) continue;
        for (var c = 0; c < 3; c++) sse += Math.max(0, B[o7 + 4 + c] - B[o7 + 1 + c] * B[o7 + 1 + c] / nb0);
        if (nb0 >= minN) stops.push({ t: (b + 0.5) / BINS, c: [B[o7 + 1] / nb0, B[o7 + 2] / nb0, B[o7 + 3] / nb0] });
      }
      return { sse: sse, stops: stops };
    }
    for (var k3 = 0; k3 < K; k3++) {
      var ce = cand[k3];
      if (!ce) continue;
      var nR = S[roots[k3] * ST];
      var Lm = ce.lin ? binModel(ce.lin.bins, nR) : null;
      var Rm = ce.rad ? binModel(ce.rad.bins, nR) : null;
      var useRad = Rm && (!Lm || Rm.sse < Lm.sse * 0.85);
      var M = useRad ? Rm : Lm;
      if (!M || M.stops.length < 2 || M.sse > ce.sse0 * 0.5) continue;
      var range = 0;
      for (var c5 = 0; c5 < 3; c5++) {
        var lo5 = 255, hi5 = 0;
        M.stops.forEach(function (s0) { lo5 = Math.min(lo5, s0.c[c5]); hi5 = Math.max(hi5, s0.c[c5]); });
        range = Math.max(range, hi5 - lo5);
      }
      if (range < 14) continue;
      var tS = M.stops[0].t, tE = M.stops[M.stops.length - 1].t;
      if (tE - tS < 1e-6) continue;
      var stops = M.stops.map(function (s0) {
        return { o: useRad ? s0.t / tE : (s0.t - tS) / (tE - tS), c: s0.c };
      });
      var tolC = 4;
      var simp = simplifyStops(stops, tolC);
      while (simp.length > 8) { tolC *= 1.5; simp = simplifyStops(stops, tolC); }
      simp = simp.map(function (s0) {
        return { o: round3(clamp(s0.o, 0, 1)), c: [Math.round(clamp(s0.c[0], 0, 255)), Math.round(clamp(s0.c[1], 0, 255)), Math.round(clamp(s0.c[2], 0, 255))] };
      });
      var g;
      if (useRad) {
        g = { type: 'radial', cx: round3(ce.rad.cx), cy: round3(ce.rad.cy), r: round3(ce.rad.r1 * tE), stops: simp };
      } else {
        var Lr = ce.lin;
        var a1 = Lr.t0 + (Lr.t1 - Lr.t0) * tS, a2 = Lr.t0 + (Lr.t1 - Lr.t0) * tE;
        var mo = roots[k3] * ST;
        var cxm = (S[mo + 1] / S[mo]) * Sc + w / 2, cym = (S[mo + 2] / S[mo]) * Sc + h / 2;
        var base = cxm * Lr.ux + cym * Lr.uy;
        g = {
          type: 'linear',
          x1: round3(cxm + (a1 - base) * Lr.ux), y1: round3(cym + (a1 - base) * Lr.uy),
          x2: round3(cxm + (a2 - base) * Lr.ux), y2: round3(cym + (a2 - base) * Lr.uy),
          stops: simp
        };
      }
      fills[k3].gradient = g;
    }

    // 8. canonical colour keys for solid regions (near-identical → same layer)
    var keyOf = new Array(K);
    var keyColors = [];
    for (var k4 = 0; k4 < K; k4++) {
      if (fills[k4].gradient) { keyOf[k4] = 'g' + k4; continue; }
      var m4 = fills[k4].mean, found = -1;
      for (var kc = 0; kc < keyColors.length; kc++) {
        var kcol = keyColors[kc];
        if (colorDist(m4[0], m4[1], m4[2], kcol[0], kcol[1], kcol[2]) < 6) { found = kc; break; }
      }
      if (found < 0) { found = keyColors.length; keyColors.push(m4); }
      keyOf[k4] = 'c' + found;
    }

    // 9. per-root masks (crop), stacking extension, coverage DAG, tracing
    var order = [];
    for (var k5 = 0; k5 < K; k5++) order.push(k5);
    order.sort(function (a, b) { return S[roots[b] * ST + 40] - S[roots[a] * ST + 40] || roots[a] - roots[b]; });
    var rank = new Int32Array(K);
    order.forEach(function (k, rnk) { rank[k] = rnk; });
    var succ = [];
    for (var k6 = 0; k6 < K; k6++) succ.push(new Set());
    var traced = new Array(K);
    function rootAt(pIdx) { var lb = label[pIdx]; return lb < 0 ? -1 : rootIdx[lb]; }
    function rootBox(k) {
      var so = roots[k] * ST;
      var x0 = Math.max(0, S[so + 36] - 1), y0 = Math.max(0, S[so + 37] - 1);
      var x1 = Math.min(w - 1, S[so + 38] + 1), y1 = Math.min(h - 1, S[so + 39] + 1);
      return { x0: x0, y0: y0, cw: x1 - x0 + 1, ch: y1 - y0 + 1 };
    }
    function ownMask(k, bx) {
      var m = new Uint8Array(bx.cw * bx.ch);
      for (var yy = 0; yy < bx.ch; yy++) {
        for (var xx = 0; xx < bx.cw; xx++) {
          if (rootAt((yy + bx.y0) * w + xx + bx.x0) === k) m[yy * bx.cw + xx] = 1;
        }
      }
      return m;
    }
    // Phase A: which regions does each region's hole-fill cover? (needed so
    // the seam extension never contradicts containment → no z-order cycles)
    var holeCov = [];
    for (var ka = 0; ka < K; ka++) {
      var hs = new Set();
      if (stackedMode) {
        var bxa = rootBox(ka);
        var ma0 = ownMask(ka, bxa);
        var mb0 = ma0.slice();
        fillHoles(mb0, bxa.cw, bxa.ch);
        for (var ia = 0; ia < mb0.length; ia++) {
          if (!mb0[ia] || ma0[ia]) continue;
          var oa2 = rootAt((Math.floor(ia / bxa.cw) + bxa.y0) * w + (ia % bxa.cw) + bxa.x0);
          if (oa2 >= 0 && oa2 !== ka) hs.add(oa2);
        }
      }
      holeCov.push(hs);
    }
    for (var k7 = 0; k7 < K; k7++) {
      var bx7 = rootBox(k7);
      var x0 = bx7.x0, y0 = bx7.y0, cw = bx7.cw, chh = bx7.ch;
      var mask = ownMask(k7, bx7);
      if (stackedMode) {
        // 1-px extension under regions painted above → no hairline seams
        var ext = [];
        for (var yy2 = 0; yy2 < chh; yy2++) {
          for (var xx2 = 0; xx2 < cw; xx2++) {
            if (mask[yy2 * cw + xx2] !== 1) continue;
            var nbr = [[xx2 - 1, yy2], [xx2 + 1, yy2], [xx2, yy2 - 1], [xx2, yy2 + 1]];
            for (var ni = 0; ni < 4; ni++) {
              var ex2 = nbr[ni][0], ey2 = nbr[ni][1];
              if (ex2 < 0 || ey2 < 0 || ex2 >= cw || ey2 >= chh) continue;
              var mi = ey2 * cw + ex2;
              if (mask[mi]) continue;
              var other = rootAt((ey2 + y0) * w + ex2 + x0);
              if (other >= 0 && rank[other] > rank[k7] && !holeCov[other].has(k7)) { ext.push(mi); succ[k7].add(other); }
            }
          }
        }
        for (var ei2 = 0; ei2 < ext.length; ei2++) mask[ext[ei2]] = 2;
        var before = mask.slice();
        fillHoles(mask, cw, chh);
        for (var mi2 = 0; mi2 < mask.length; mi2++) {
          if (!mask[mi2] || before[mi2]) continue;
          var gx2 = (mi2 % cw) + x0, gy2 = Math.floor(mi2 / cw) + y0;
          var ow = rootAt(gy2 * w + gx2);
          if (ow < 0) { mask[mi2] = 0; continue; }   // keep transparent holes open
          if (ow !== k7) succ[k7].add(ow);
        }
      }
      for (var mi3 = 0; mi3 < mask.length; mi3++) if (mask[mi3]) mask[mi3] = 1;
      traced[k7] = traceMask(mask, cw, chh, traceOpts, x0, y0);
    }
    if (opts._debug) { opts._debug.label = label; opts._debug.rootIdx = rootIdx; opts._debug.traced = traced; opts._debug.keyOf = keyOf; }

    // 10. topological emission grouped by colour key → valid z-order with the
    //     fewest possible layers.
    var indeg = new Int32Array(K);
    for (var k8 = 0; k8 < K; k8++) succ[k8].forEach(function (j) { if (j !== k8) indeg[j]++; });
    var done = new Uint8Array(K);
    var avail = [];
    for (var k9 = 0; k9 < K; k9++) if (!indeg[k9]) avail.push(k9);
    var remaining = K;
    var paths = [];
    while (remaining > 0) {
      if (!avail.length) {
        var pick = -1;
        for (var oi = 0; oi < order.length; oi++) if (!done[order[oi]]) { pick = order[oi]; break; }
        indeg[pick] = 0;
        avail.push(pick);
      }
      var areaBy = {};
      avail.forEach(function (k) { areaBy[keyOf[k]] = (areaBy[keyOf[k]] || 0) + S[roots[k] * ST + 40]; });
      var bestKey = null, bestA = -1;
      Object.keys(areaBy).sort().forEach(function (kk2) { if (areaBy[kk2] > bestA) { bestA = areaBy[kk2]; bestKey = kk2; } });
      var group = avail.filter(function (k) { return keyOf[k] === bestKey; });
      avail = avail.filter(function (k) { return keyOf[k] !== bestKey; });
      group.sort(function (a, b) { return rank[a] - rank[b]; });
      var subs = [], area = 0, wsum = [0, 0, 0], wn = 0;
      group.forEach(function (k) {
        done[k] = 1; remaining--;
        var tr0 = traced[k];
        for (var si = 0; si < tr0.subpaths.length; si++) subs.push(tr0.subpaths[si]);
        area += tr0.area;
        var nk = S[roots[k] * ST + 40];
        wsum[0] += fills[k].mean[0] * nk; wsum[1] += fills[k].mean[1] * nk; wsum[2] += fills[k].mean[2] * nk; wn += nk;
        succ[k].forEach(function (j) {
          if (done[j] || j === k) return;
          if (--indeg[j] === 0) avail.push(j);
        });
      });
      if (!subs.length) continue;
      var pathObj = {
        fill: [Math.round(wsum[0] / wn), Math.round(wsum[1] / wn), Math.round(wsum[2] / wn)],
        subpaths: subs,
        area: area,
        sourceIndex: fills[group[0]].cluster,
        hidden: false
      };
      if (fills[group[0]].gradient) pathObj.gradient = fills[group[0]].gradient;
      paths.push(pathObj);
    }
    // Limited / custom ("Document Library") palette: every solid layer uses an
    // exact palette swatch, like Illustrator's swatch-restricted tracing.
    if (fixedPal || opts.snapPalette) {
      for (var sp2 = 0; sp2 < paths.length; sp2++) {
        if (paths[sp2].gradient) continue;
        var f0 = paths[sp2].fill, bestC = q.palette[0], bestD = Infinity;
        for (var pc = 0; pc < q.palette.length; pc++) {
          var dd0 = colorDist(f0[0], f0[1], f0[2], q.palette[pc][0], q.palette[pc][1], q.palette[pc][2]);
          if (dd0 < bestD) { bestD = dd0; bestC = q.palette[pc]; }
        }
        paths[sp2].fill = [bestC[0], bestC[1], bestC[2]];
      }
    }
    return finish(paths, w, h, q.palette);
  }

  /* ============================ 10. CENTERLINE STROKES (B&W) ============================ */

  // Chamfer distance (px) from every foreground pixel to the nearest background
  // pixel (outside the image counts as background). Edge pixels = 1.
  function distanceMap(mask, w, h) {
    var N = w * h, d = new Float32Array(N), D2 = Math.SQRT2, x, y, p, v, t;
    for (p = 0; p < N; p++) d[p] = mask[p] ? 1e9 : 0;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        p = y * w + x; if (!d[p]) continue; v = d[p];
        t = x > 0 ? d[p - 1] + 1 : 1; if (t < v) v = t;
        t = y > 0 ? d[p - w] + 1 : 1; if (t < v) v = t;
        t = (x > 0 && y > 0) ? d[p - w - 1] + D2 : D2; if (t < v) v = t;
        t = (x < w - 1 && y > 0) ? d[p - w + 1] + D2 : D2; if (t < v) v = t;
        d[p] = v;
      }
    }
    for (y = h - 1; y >= 0; y--) {
      for (x = w - 1; x >= 0; x--) {
        p = y * w + x; if (!d[p]) continue; v = d[p];
        t = x < w - 1 ? d[p + 1] + 1 : 1; if (t < v) v = t;
        t = y < h - 1 ? d[p + w] + 1 : 1; if (t < v) v = t;
        t = (x < w - 1 && y < h - 1) ? d[p + w + 1] + D2 : D2; if (t < v) v = t;
        t = (x > 0 && y < h - 1) ? d[p + w - 1] + D2 : D2; if (t < v) v = t;
        d[p] = v;
      }
    }
    return d;
  }

  // Zhang–Suen thinning → 1-px skeleton, then staircase cleanup so every
  // interior skeleton pixel has exactly two neighbours.
  function thinMask(mask, w, h) {
    var N = w * h, img = new Uint8Array(N), list = [], p, i;
    for (p = 0; p < N; p++) if (mask[p]) { img[p] = 1; list.push(p); }
    var at = function (x, y) { return (x < 0 || y < 0 || x >= w || y >= h) ? 0 : img[y * w + x]; };
    var changed = true, del = [];
    while (changed) {
      changed = false;
      for (var step = 0; step < 2; step++) {
        del.length = 0;
        for (i = 0; i < list.length; i++) {
          p = list[i]; if (!img[p]) continue;
          var x = p % w, y = (p / w) | 0;
          var P2 = at(x, y - 1), P3 = at(x + 1, y - 1), P4 = at(x + 1, y), P5 = at(x + 1, y + 1);
          var P6 = at(x, y + 1), P7 = at(x - 1, y + 1), P8 = at(x - 1, y), P9 = at(x - 1, y - 1);
          var B = P2 + P3 + P4 + P5 + P6 + P7 + P8 + P9;
          if (B < 2 || B > 6) continue;
          var A = (!P2 && P3) + (!P3 && P4) + (!P4 && P5) + (!P5 && P6) + (!P6 && P7) + (!P7 && P8) + (!P8 && P9) + (!P9 && P2);
          if (A !== 1) continue;
          if (step === 0 ? (P2 * P4 * P6 || P4 * P6 * P8) : (P2 * P4 * P8 || P2 * P6 * P8)) continue;
          del.push(p);
        }
        for (i = 0; i < del.length; i++) img[del[i]] = 0;
        if (del.length) changed = true;
      }
      list = list.filter(function (q) { return img[q]; });
    }
    // staircase cleanup: drop L-corner pixels whose neighbours stay connected
    var L = [[0, -1, 1, 0, 1, -1], [1, 0, 0, 1, 1, 1], [0, 1, -1, 0, -1, 1], [-1, 0, 0, -1, -1, -1]];
    for (i = 0; i < list.length; i++) {
      p = list[i]; if (!img[p]) continue;
      var px = p % w, py = (p / w) | 0;
      for (var li = 0; li < 4; li++) {
        var c = L[li];
        if (!at(px + c[0], py + c[1]) || !at(px + c[2], py + c[3]) || at(px + c[4], py + c[5])) continue;
        var ok = true;
        for (var oy = -1; oy <= 1 && ok; oy++) {
          for (var ox = -1; ox <= 1; ox++) {
            if ((!ox && !oy) || !at(px + ox, py + oy)) continue;
            if ((ox === c[0] && oy === c[1]) || (ox === c[2] && oy === c[3])) continue;
            var adjA = Math.abs(ox - c[0]) <= 1 && Math.abs(oy - c[1]) <= 1;
            var adjB = Math.abs(ox - c[2]) <= 1 && Math.abs(oy - c[3]) <= 1;
            if (!adjA && !adjB) { ok = false; break; }
          }
        }
        if (ok) { img[p] = 0; break; }
      }
    }
    return img;
  }

  // Skeleton pixel graph → polylines (arrays of pixel indices).
  function skeletonPolylines(skel, w, h) {
    var N = w * h, pixels = [], p, k;
    for (p = 0; p < N; p++) if (skel[p]) pixels.push(p);
    var nb = function (q) {
      var x = q % w, y = (q / w) | 0, out = [];
      for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) {
        if (!ox && !oy) continue;
        var nx = x + ox, ny = y + oy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (skel[ny * w + nx]) out.push(ny * w + nx);
      }
      return out;
    };
    var deg = new Map();
    pixels.forEach(function (q) { deg.set(q, nb(q).length); });
    var used = new Set();
    var key = function (a, b) { return a < b ? a * N + b : b * N + a; };
    var visited = new Uint8Array(N);
    var lines = [];
    function walk(start, next) {
      var line = [start, next];
      used.add(key(start, next));
      var prev = start, cur = next;
      while (deg.get(cur) === 2 && cur !== start) {
        visited[cur] = 1;
        var ns = nb(cur), nx = -1;
        for (var i = 0; i < ns.length; i++) {
          if (ns[i] === prev || used.has(key(cur, ns[i]))) continue;
          nx = ns[i]; break;
        }
        if (nx < 0) break;
        used.add(key(cur, nx));
        line.push(nx); prev = cur; cur = nx;
      }
      return line;
    }
    for (k = 0; k < pixels.length; k++) {
      p = pixels[k];
      var dg = deg.get(p);
      if (dg === 2) continue;
      if (dg === 0) { lines.push({ px: [p, p], closed: false }); continue; }
      var ns0 = nb(p);
      for (var j = 0; j < ns0.length; j++) {
        if (used.has(key(p, ns0[j]))) continue;
        lines.push({ px: walk(p, ns0[j]), closed: false });
      }
    }
    for (k = 0; k < pixels.length; k++) {
      p = pixels[k];
      if (deg.get(p) !== 2 || visited[p]) continue;
      visited[p] = 1;
      var line = walk(p, nb(p)[0]);
      var closed = line[line.length - 1] === p;
      if (closed) line.pop();
      lines.push({ px: line, closed: closed });
    }
    return lines;
  }

  // Polyline (pixel indices) → open/closed subpath of fitted cubic beziers.
  function polylineToSubpath(pl, w, opts) {
    var idx = pl.px.slice();
    if (pl.closed) idx.push(idx[0]);
    var cnt = idx.length - 1;
    var pts = new Float64Array(idx.length * 2);
    for (var i = 0; i < idx.length; i++) { pts[i * 2] = (idx[i] % w) + 0.5; pts[i * 2 + 1] = ((idx[i] / w) | 0) + 0.5; }
    var segs = [];
    if (cnt < 1 || (cnt === 1 && idx[0] === idx[1])) {
      segs.push({ l: [round3(pts[0] + 0.01), round3(pts[1])] });
      return { start: [round3(pts[0]), round3(pts[1])], segs: segs, closed: false, nodes: 2 };
    }
    smoothSpanFixed(pts, cnt, 2);
    var tol = clamp(opts.tolerance == null ? 1 : opts.tolerance, 0.2, 20);
    if (cnt < 3 || spanIsStraight(pts, cnt, opts.snapLines ? 1.4 : 0.7)) {
      segs.push({ l: [round3(pts[cnt * 2]), round3(pts[cnt * 2 + 1])] });
    } else {
      var m = Math.min(3, cnt);
      var t1 = norm2(pts[m * 2] - pts[0], pts[m * 2 + 1] - pts[1]);
      var t2 = norm2(pts[(cnt - m) * 2] - pts[cnt * 2], pts[(cnt - m) * 2 + 1] - pts[cnt * 2 + 1]);
      var bz = [];
      fitCurve(pts, 0, cnt, t1, t2, tol, bz);
      pushBeziers(segs, bz, opts.snapLines);
    }
    return { start: [round3(pts[0]), round3(pts[1])], segs: segs, closed: !!pl.closed, nodes: segs.length + 1 };
  }

  // Splits a B&W mask into thin parts (→ centerline strokes ≤ strokeWidth)
  // and thick parts (→ filled outlines). strokesOnly → every part is a stroke.
  function traceStrokes(mask, w, h, opts, traceOpts, color) {
    var N = w * h, maxW = Math.max(1, +opts.strokeWidth || 10);
    var dist = distanceMap(mask, w, h);
    var skel = thinMask(mask, w, h);
    // 8-connected components of the mask
    var comp = new Int32Array(N).fill(-1), stack = new Int32Array(N), C = 0, compMax = [];
    for (var p = 0; p < N; p++) {
      if (!mask[p] || comp[p] >= 0) continue;
      var sp = 0; stack[sp++] = p; comp[p] = C; var mx = 0;
      while (sp) {
        var q = stack[--sp], qx = q % w, qy = (q / w) | 0;
        if (skel[q] && dist[q] > mx) mx = dist[q];
        for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) {
          var nx = qx + ox, ny = qy + oy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          var r = ny * w + nx;
          if (mask[r] && comp[r] < 0) { comp[r] = C; stack[sp++] = r; }
        }
      }
      compMax.push(2 * mx - 1);
      C++;
    }
    var asStroke = new Uint8Array(C);
    for (var c = 0; c < C; c++) asStroke[c] = (opts.strokesOnly || compMax[c] <= maxW + 0.5) ? 1 : 0;
    var thick = new Uint8Array(N), thin = new Uint8Array(N), anyThick = false;
    for (var p2 = 0; p2 < N; p2++) {
      if (!mask[p2]) continue;
      if (asStroke[comp[p2]]) { if (skel[p2]) thin[p2] = 1; } else { thick[p2] = 1; anyThick = true; }
    }
    var out = [];
    if (anyThick && !opts.strokesOnly) {
      var tr = traceMask(thick, w, h, traceOpts);
      if (tr.subpaths.length) out.push({ fill: color.slice(), subpaths: tr.subpaths, area: tr.area, hidden: false });
    }
    // group stroke polylines by (rounded) width → one stroke layer per width
    var lines = skeletonPolylines(thin, w, h);
    var groups = {};
    for (var li = 0; li < lines.length; li++) {
      var pl = lines[li];
      if (!pl.closed && pl.px.length < 3) {
        var e0 = pl.px[0], e1 = pl.px[pl.px.length - 1];
        var nb0 = 0, nb1 = 0;
        for (var oy2 = -1; oy2 <= 1; oy2++) for (var ox2 = -1; ox2 <= 1; ox2++) {
          if (!ox2 && !oy2) continue;
          var a0x = (e0 % w) + ox2, a0y = ((e0 / w) | 0) + oy2, a1x = (e1 % w) + ox2, a1y = ((e1 / w) | 0) + oy2;
          if (a0x >= 0 && a0y >= 0 && a0x < w && a0y < h && thin[a0y * w + a0x]) nb0++;
          if (a1x >= 0 && a1y >= 0 && a1x < w && a1y < h && thin[a1y * w + a1x]) nb1++;
        }
        if (nb0 > 2 && nb1 > 2) continue; // tiny junction-to-junction link
      }
      var ws = 0;
      for (var pi = 0; pi < pl.px.length; pi++) ws += Math.max(1, 2 * dist[pl.px[pi]] - 1);
      var sw = Math.max(1, Math.round((ws / pl.px.length) * 2) / 2);
      if (opts.strokesOnly) sw = Math.min(sw, maxW);
      var sub = polylineToSubpath(pl, w, traceOpts);
      if (!groups[sw]) groups[sw] = [];
      groups[sw].push(sub);
    }
    Object.keys(groups).sort(function (a, b) { return b - a; }).forEach(function (k) {
      out.push({ fill: color.slice(), stroke: color.slice(), strokeWidth: +k, isStroke: true, subpaths: groups[k], area: 0, hidden: false });
    });
    return out;
  }

  // Top-level API. image = { data: Uint8ClampedArray RGBA, w, h }.
  // opts: {
  //   mode: 'color' | 'gray' | 'mono' (Black & White),
  //   colors: 2..128 (color mode), grays: 2..128 (gray mode),
  //   gradients: bool (color mode; default true) — keep smooth colour ramps as
  //              linear / radial gradient fills instead of many solid bands,
  //   fixedPalette: [[r,g,b]...] (custom "Document Library" swatches),
  //   snapPalette: bool (Limited palette — layers use exact palette colours),
  //   sharpCorners: bool (default true) — corner refinement + axis snapping,
  //   snapLines: bool — Illustrator "Snap Curves To Lines",
  //   ignoreWhite: bool — white areas become transparent (no white layers),
  //   fills / strokes / strokeWidth (B&W) — centerline stroke tracing,
  //   threshold: null | 0..100 (mono; null = Otsu auto),
  //   invert: bool (mono — trace light-on-dark),
  //   minArea: px (speckle suppression),
  //   cornerThreshold: deg, tolerance: px,
  //   stacking: 'cutout' (Abutting) | 'stacked' (Overlapping),
  //   preprocess: { scale, brightness, contrast, bgMode, bgColor, bgTolerance, median, blur }
  // }
  function trace(image, opts) {
    opts = opts || {};
    var pre = preprocess(image.data, image.w, image.h, opts.preprocess || {});
    var w = pre.w, h = pre.h, data = pre.data;
    var minArea = Math.max(0, Math.round(opts.minArea || 0));
    var traceOpts = { tolerance: opts.tolerance, cornerThreshold: opts.cornerThreshold, sharpCorners: opts.sharpCorners, snapLines: opts.snapLines };

    if (opts.mode === 'gray') {
      for (var g = 0; g < data.length; g += 4) {
        var lum = Math.round(0.299 * data[g] + 0.587 * data[g + 1] + 0.114 * data[g + 2]);
        data[g] = data[g + 1] = data[g + 2] = lum;
      }
      var gopts = {};
      for (var k in opts) gopts[k] = opts[k];
      gopts.colors = clamp(opts.grays || opts.colors || 8, 2, 128);
      gopts.gradients = false;
      gopts.fixedPalette = null;
      return traceColor(data, w, h, gopts);
    }

    if (opts.mode !== 'color') {
      var mask = binarize(data, w, h, { threshold: opts.threshold, invert: opts.invert });
      despeckle(mask, w, h, minArea);
      var paths = [];
      var fg = [0, 0, 0];
      var bgc = [255, 255, 255];
      // "Ignore White" off → white areas are traced too (white layer below black)
      if (opts.ignoreWhite === false) {
        var wm = new Uint8Array(w * h);
        var abut = opts.stacking === 'cutout';
        for (var i = 0, p4 = 3; i < wm.length; i++, p4 += 4) wm[i] = data[p4] >= 128 && (!abut || !mask[i]) ? 1 : 0;
        despeckle(wm, w, h, minArea);
        var tw = traceMask(wm, w, h, traceOpts);
        if (tw.subpaths.length) paths.push({ fill: bgc, subpaths: tw.subpaths, area: tw.area, hidden: false });
      }
      if (opts.strokes) {
        var sp = traceStrokes(mask, w, h, { strokeWidth: opts.strokeWidth, strokesOnly: opts.fills === false }, traceOpts, fg);
        for (var s = 0; s < sp.length; s++) paths.push(sp[s]);
      } else {
        var traced = traceMask(mask, w, h, traceOpts);
        if (traced.subpaths.length) paths.push({ fill: fg, subpaths: traced.subpaths, area: traced.area, hidden: false });
      }
      return finish(paths, w, h, [fg]);
    }
    return traceColor(data, w, h, opts);
  }

  function finish(paths, w, h, palette) {
    var stats = { paths: 0, subpaths: 0, nodes: 0, colors: 0, gradients: 0 };
    var seen = {};
    for (var i = 0; i < paths.length; i++) {
      if (paths[i].hidden) continue;
      stats.paths++;
      if (paths[i].gradient) stats.gradients++;
      stats.subpaths += paths[i].subpaths.length;
      for (var s = 0; s < paths[i].subpaths.length; s++) stats.nodes += paths[i].subpaths[s].nodes;
      seen[paths[i].gradient ? 'g' + i : paths[i].fill.join(',')] = 1;
    }
    stats.colors = Object.keys(seen).length;
    stats.pixelWidth = w;
    stats.pixelHeight = h;
    return { paths: paths, w: w, h: h, palette: palette, stats: stats };
  }

  return {
    preprocess: preprocess,
    resizeRGBA: resizeRGBA,
    otsu: otsu,
    binarize: binarize,
    despeckle: despeckle,
    quantize: quantize,
    traceContours: traceContours,
    loopArea: loopArea,
    fillHoles: fillHoles,
    findCorners: findCorners,
    refineCorner: refineCorner,
    traceLoop: traceLoop,
    traceMask: traceMask,
    trace: trace,
    distanceMap: distanceMap,
    thinMask: thinMask,
    traceStrokes: traceStrokes,
    colorDist: colorDist
  };
});
