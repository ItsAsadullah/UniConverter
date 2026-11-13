/* TechHat Vector Studio — Photoshop-Grade Logo/Icon Retouch Editor & High-Quality Vectorizer
 * Works with VectorStudio.svelte (#img-pane-vector, vs* ids) and vector-trace-core/worker/export.
 * 100% Client-Side Offline-First Engine. */
(function () {
  'use strict';

  function $(sel, rootEl) { return (rootEl || document).querySelector(sel); }
  function $$(sel, rootEl) { return Array.prototype.slice.call((rootEl || document).querySelectorAll(sel)); }
  function isEn() { return document.documentElement.getAttribute('data-lang') === 'en'; }
  function tr(bn, en) { return isEn() ? en : bn; }
  function toBn(n) {
    var s = String(n);
    if (!isEn()) {
      var d = '০১২৩৪৫৬৭৮৯';
      s = s.replace(/[0-9]/g, function (ch) { return d[+ch]; });
    }
    return s;
  }
  function fmtKB(bytes) {
    return toBn(bytes >= 1024 * 1024 ? (bytes / 1048576).toFixed(2) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB');
  }
  function baseName(name) { return String(name || 'logo').replace(/\.[^.]+$/, ''); }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function showToast(msg, enMsg) {
    if (window.TechHatImageUtils && window.TechHatImageUtils.showToast) {
      window.TechHatImageUtils.showToast(msg, enMsg);
      return;
    }
    var text = isEn() ? (enMsg || msg) : msg;
    if (window.TechHatToast) { window.TechHatToast(text); return; }
    var t = $('#toast');
    if (!t) return;
    t.textContent = text;
    t.hidden = false;
    clearTimeout(showToast._tid);
    showToast._tid = setTimeout(function () { t.hidden = true; }, 2800);
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 1500);
  }

  function wireDropzone(zone, input, onFiles) {
    if (!zone) return;
    if (input && !input._vsWired) {
      input._vsWired = true;
      input.addEventListener('change', function () {
        if (input.files && input.files.length) {
          onFiles(Array.prototype.slice.call(input.files));
          input.value = '';
        }
      });
    }
    if (zone._vsZoneWired) return;
    zone._vsZoneWired = true;
    if (input && zone.tagName !== 'LABEL') {
      zone.addEventListener('click', function (e) {
        if (e.target && e.target.closest && e.target.closest('button, label, input, a, select, textarea, [data-vs]')) return;
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

  function rgbToHex(r, g, b) {
    var h = function (v) { var s = clamp(Math.round(v), 0, 255).toString(16); return s.length < 2 ? '0' + s : s; };
    return '#' + h(r) + h(g) + h(b);
  }

  function hexToRgb(hexStr) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hexStr || ''));
    if (!m) return [255, 255, 255];
    var v = parseInt(m[1], 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  function cloneCanvas(src) {
    var c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d').drawImage(src, 0, 0);
    return c;
  }

  function makeThumbUrl(canvas) {
    try {
      var maxSide = 140;
      var s = Math.min(1, maxSide / Math.max(canvas.width || 1, canvas.height || 1));
      var w = Math.max(1, Math.round(canvas.width * s));
      var h = Math.max(1, Math.round(canvas.height * s));
      var c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d').drawImage(canvas, 0, 0, w, h);
      return c.toDataURL('image/png');
    } catch (e) {
      return '';
    }
  }

  /* ============================ PRESET DEFINITIONS ============================ */

  // Tracing presets. `corner` is the turn angle (deg) above which a contour
  // point becomes a sharp corner → LOWER = more / crisper corners.
  // `gradients` keeps smooth colour ramps as real linear/radial gradients.
  function P(o) {
    var base = { mode: 'color', colors: 12, tolerance: 9, corner: 50, minArea: 8, bgTol: 15, scale: 100, contrast: 0, brightness: 0,
      hdEnhance: true, gapFree: true, autoThr: true, invert: false, gradients: true, sharp: true, bgMode: null,
      // Illustrator Image Trace options
      palette: 'auto', grays: 12, threshold: 50, ignoreWhite: false, strokes: false, fills: true, strokeW: 10, snapLines: false };
    for (var k in o) base[k] = o[k];
    return base;
  }
  var PRESET_CONFIGS = {
    auto: P({}),                                                              // replaced per image by autoAnalyze()
    logo_hd: P({ colors: 12, tolerance: 9, corner: 50, minArea: 8, contrast: 5 }),
    mono_logo: P({ mode: 'mono', colors: 2, tolerance: 9, corner: 50, minArea: 6, contrast: 15, gradients: false, ignoreWhite: true }),
    flat_icon: P({ colors: 8, tolerance: 11, corner: 55, minArea: 12, gradients: false }),
    line_art: P({ mode: 'mono', colors: 2, tolerance: 7, corner: 55, minArea: 3, bgTol: 20, contrast: 25, gapFree: false, gradients: false, ignoreWhite: true }),
    detailed_art: P({ colors: 24, tolerance: 8, corner: 60, minArea: 6, bgTol: 12 }),
    sharp_geo: P({ colors: 10, tolerance: 6, corner: 38, minArea: 10, contrast: 10, gradients: false }),
    // ---- Adobe Illustrator Image Trace presets ----
    ai_default: P({ mode: 'mono', autoThr: false, threshold: 50, tolerance: 9, corner: 50, minArea: 25, gradients: false, ignoreWhite: true, hdEnhance: false }),
    ai_high_photo: P({ palette: 'full', colors: 96, tolerance: 3, corner: 110, minArea: 2, gradients: true, hdEnhance: false }),
    ai_low_photo: P({ palette: 'auto', colors: 20, tolerance: 6, corner: 110, minArea: 25, gradients: true, hdEnhance: false }),
    ai_3_colors: P({ palette: 'limited', colors: 3, tolerance: 9, corner: 50, minArea: 25, gradients: false }),
    ai_6_colors: P({ palette: 'limited', colors: 6, tolerance: 9, corner: 50, minArea: 25, gradients: false }),
    ai_16_colors: P({ palette: 'limited', colors: 16, tolerance: 9, corner: 50, minArea: 12, gradients: false }),
    ai_gray: P({ mode: 'gray', grays: 12, tolerance: 8, corner: 80, minArea: 10, gradients: false }),
    ai_bw_logo: P({ mode: 'mono', autoThr: false, threshold: 50, tolerance: 4, corner: 32, minArea: 25, gradients: false, ignoreWhite: true }),
    ai_sketch: P({ mode: 'mono', autoThr: false, threshold: 55, tolerance: 7, corner: 80, minArea: 100, gradients: false, ignoreWhite: true, gapFree: false }),
    ai_silhouette: P({ mode: 'mono', autoThr: false, threshold: 92, tolerance: 12, corner: 80, minArea: 40, gradients: false, ignoreWhite: true }),
    ai_line_art: P({ mode: 'mono', autoThr: false, threshold: 50, tolerance: 8, corner: 80, minArea: 5, gradients: false, ignoreWhite: true, strokes: true, fills: false, strokeW: 10, gapFree: false }),
    ai_technical: P({ mode: 'mono', autoThr: false, threshold: 50, tolerance: 10, corner: 20, minArea: 5, gradients: false, ignoreWhite: true, strokes: true, fills: false, strokeW: 4, snapLines: true, gapFree: false })
  };

  // Illustrator slider ↔ engine unit conversions
  //   Paths %   → curve-fit tolerance (px): 0 % = 3 px (few nodes), 100 % = 0.25 px
  //   Corners % → corner angle (°): 0 % = 140° (smooth), 100 % = 20° (many corners)
  function pathsPctToTol(p) { return 0.25 * Math.pow(12, (100 - clamp(p, 0, 100)) / 100); }
  function tolToPathsPct(t) { return clamp(Math.round(100 - 100 * Math.log(Math.max(0.25, t) / 0.25) / Math.log(12)), 0, 100); }
  function cornersPctToDeg(c) { return Math.round(20 + (100 - clamp(c, 0, 100)) * 1.2); }
  function degToCornersPct(d) { return clamp(Math.round(100 - (d - 20) / 1.2), 0, 100); }

  /* ============================ ONE-CLICK AUTO ANALYSIS ============================ */

  // Inspects the image and returns the best preset config: colour count,
  // mono vs colour, gradient presence and background removal.
  function autoAnalyze(canvas) {
    var maxSide = 256;
    var s = Math.min(1, maxSide / Math.max(canvas.width, canvas.height));
    var w = Math.max(1, Math.round(canvas.width * s)), h = Math.max(1, Math.round(canvas.height * s));
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(canvas, 0, 0, w, h);
    var d = cx.getImageData(0, 0, w, h).data;
    var cd = function (i, j) {
      var dr = d[i] - d[j], dg = d[i + 1] - d[j + 1], db = d[i + 2] - d[j + 2];
      return Math.sqrt((dr * dr + dg * dg + db * db) / 3);
    };

    // 1. border analysis → background
    var border = [], transparentBorder = 0;
    for (var x = 0; x < w; x++) { border.push(x * 4, ((h - 1) * w + x) * 4); }
    for (var y = 0; y < h; y++) { border.push(y * w * 4, (y * w + w - 1) * 4); }
    var br = 0, bg = 0, bb = 0, bn = 0;
    border.forEach(function (o) { if (d[o + 3] < 40) transparentBorder++; else { br += d[o]; bg += d[o + 1]; bb += d[o + 2]; bn++; } });
    var bgMode = 'off', bgHex = '#ffffff';
    if (bn && transparentBorder < border.length * 0.5) {
      var mr = br / bn, mg = bg / bn, mb = bb / bn, near = 0;
      border.forEach(function (o) {
        if (d[o + 3] < 40) return;
        var dr = d[o] - mr, dg = d[o + 1] - mg, db = d[o + 2] - mb;
        if (Math.sqrt((dr * dr + dg * dg + db * db) / 3) < 22) near++;
      });
      if (near >= bn * 0.85) { bgMode = 'flood'; bgHex = rgbToHex(mr, mg, mb); }
    }
    var bgRgb = hexToRgb(bgHex);
    var isBg = function (o) {
      if (d[o + 3] < 128) return true;
      if (bgMode === 'off') return false;
      var dr = d[o] - bgRgb[0], dg = d[o + 1] - bgRgb[1], db = d[o + 2] - bgRgb[2];
      return Math.sqrt((dr * dr + dg * dg + db * db) / 3) < 18;
    };

    // 2. colour statistics over foreground
    var bins = {}, fg = 0, satSum = 0;
    var soft = 0, edges = 0;
    for (var p = 0; p < w * h; p++) {
      var o = p * 4;
      if (isBg(o)) continue;
      fg++;
      var key = (d[o] >> 4) + ',' + (d[o + 1] >> 4) + ',' + (d[o + 2] >> 4);
      bins[key] = (bins[key] || 0) + 1;
      var mx = Math.max(d[o], d[o + 1], d[o + 2]), mn = Math.min(d[o], d[o + 1], d[o + 2]);
      satSum += mx ? (mx - mn) / mx : 0;
      if ((p % w) < w - 1 && !isBg(o + 4)) {
        var dd = cd(o, o + 4);
        if (dd > 1.5) { edges++; if (dd < 14) soft++; }
      }
    }
    if (!fg) fg = 1;
    var counts = Object.keys(bins).map(function (k) { return bins[k]; }).sort(function (a, b) { return b - a; });
    var acc = 0, sig = 0;
    for (var i = 0; i < counts.length; i++) { acc += counts[i]; sig++; if (acc >= fg * 0.95) break; }
    var meanSat = satSum / fg;
    var softRatio = edges ? soft / edges : 0;
    var softFrac = soft / fg;
    var hasGradient = softRatio > 0.45 && softFrac > 0.05;

    var cfg = P({ bgMode: bgMode, bgHex: bgHex });
    if (meanSat < 0.12 && sig <= 6 && !hasGradient) {
      cfg.mode = 'mono'; cfg.gradients = false; cfg.contrast = 15; cfg.ignoreWhite = true;
    } else {
      cfg.gradients = hasGradient;
      cfg.colors = clamp(Math.round(sig * 1.4) + 2, 4, hasGradient ? 32 : 24);
      if (hasGradient) cfg.colors = Math.max(cfg.colors, 16);
      if (sig > 40) { cfg.minArea = 12; cfg.tolerance = 10; }
    }
    cfg.summary = {
      colors: cfg.mode === 'mono' ? 1 : cfg.colors,
      gradient: hasGradient,
      bg: bgMode !== 'off',
      mono: cfg.mode === 'mono'
    };
    return cfg;
  }

  var ADJ_META = {
    colors:     { id: 'vsColors',     outId: 'vsColorsLabel',    min: 2,    max: 128, def: 12,  fmt: function (v) { return toBn(v); } },
    tolerance:  { id: 'vsTolerance',  outId: 'vsToleranceValue', min: 1,    max: 50,  def: 10,  fmt: function (v) { return toBn((v / 10).toFixed(1)); } },
    corner:     { id: 'vsCorner',     outId: 'vsCornerValue',    min: 20,   max: 160, def: 60,  fmt: function (v) { return toBn(v) + '°'; } },
    minArea:    { id: 'vsMinArea',    outId: 'vsMinAreaValue',   min: 0,    max: 200, def: 8,   fmt: function (v) { return toBn(v) + 'px'; } },
    bgTol:      { id: 'vsBgTol',      outId: 'vsBgTolValue',     min: 0,    max: 100, def: 15,  fmt: function (v) { return toBn(v) + '%'; } },
    scale:      { id: 'vsScale',      outId: 'vsScaleValue',     min: 25,   max: 300, def: 100, fmt: function (v) { return toBn(v) + '%'; } },
    contrast:   { id: 'vsContrast',   outId: 'vsContrastValue',  min: -100, max: 100, def: 15,  fmt: function (v) { return toBn(v); } },
    brightness: { id: 'vsBrightness', outId: 'vsBrightnessValue',min: -100, max: 100, def: 0,   fmt: function (v) { return toBn(v); } }
  };

  var PS_TOOL_NAMES = {
    'move': 'Move & Pan Tool',
    'marquee-rect': 'Rectangular Marquee',
    'marquee-ellipse': 'Elliptical Marquee',
    'lasso': 'Freehand Lasso Tool',
    'lasso-poly': 'Polygonal Lasso Tool',
    'wand': 'Magic Wand BG Eraser',
    'picker': 'Eyedropper Color Picker',
    'heal': 'Spot Healing Brush',
    'brush': 'Brush Paint Tool',
    'eraser': 'Transparent Eraser',
    'clone': 'Clone Stamp Tool',
    'dodge': 'Dodge (Lighten) Tool',
    'burn': 'Burn (Darken) Tool',
    'text': 'Horizontal Type Tool',
    'hand': 'Hand Pan Tool',
    'zoom': 'Zoom Tool'
  };

  /* ============================ STATE ============================ */

  var state = {
    items: [],
    activeId: null,
    itemSeq: 0,
    img: null,          // Synced to activeItem().workCanvas
    imgName: 'logo',    // Synced to activeItem().name
    result: null,       // Synced to activeItem().result
    mode: 'color',
    preset: 'logo_hd',
    view: 'split',      // 'split' | 'preview' | 'wire' | 'crop'
    editing: false,     // Full-screen Photoshop Canvas Editor mode
    psTool: 'brush',    // Current Photoshop tool id
    selMode: 'new',     // 'new' | 'add' | 'sub' | 'int'
    selection: null,    // { w, h, mask: Uint8Array, pathD: string } or null
    polyPoints: [],     // Active polygonal lasso points
    cloneSrc: null,     // { x, y } on workCanvas
    cloneOffset: null,  // { dx, dy } during clone stroke
    txtBold: true,
    txtItalic: false,
    txtAlign: 'left',
    txtPos: null,       // { x, y } on workCanvas
    camStream: null,
    camFacing: 'environment',
    busy: false,
    traceSeq: 0,
    worker: null,
    jobs: {},
    jobSeq: 0,
    coreReady: false,
    zoom: 1,
    fitScale: 1,
    panX: 0,
    panY: 0,
    wire: false,
    vecVisible: true,
    comparingOrig: false,
    // Illustrator Image Trace panel state
    it: { palette: 'auto', grays: 12, threshold: 128, ignoreWhite: false, strokes: false, fills: true, strokeW: 10, snapLines: false, custom: [], preview: true },
    exports: {},
    debounceTid: 0
  };

  function root() { return $('#img-pane-vector'); }

  function activeItem() {
    for (var i = 0; i < state.items.length; i++) {
      if (state.items[i].id === state.activeId) return state.items[i];
    }
    return state.items[0] || null;
  }

  function syncLegacyState() {
    var it = activeItem();
    state.img = it ? it.workCanvas : null;
    state.imgName = it ? it.name : 'logo';
    state.result = it ? it.result : null;
    state.exports = it ? it.exports : {};
  }

  function setStatus(bn, en) {
    var el = $('#vsStatus', root());
    if (el) el.textContent = tr(bn, en || bn);
  }

  /* ============================ CORE + WORKER ============================ */

  function ensureCore() {
    if (state.coreReady && window.TechHatVectorTrace && window.TechHatVectorExport) return Promise.resolve();
    var load = function (src) {
      if (window.TechHatEnsureScript) return window.TechHatEnsureScript(src);
      var clean = src.split('?')[0];
      if (document.querySelector('script[src^="' + clean + '"]')) return Promise.resolve();
      return new Promise(function (resolve) {
        var s = document.createElement('script');
        s.src = src;
        s.async = false;
        s.onload = resolve;
        s.onerror = resolve;
        document.body.appendChild(s);
      });
    };
    return Promise.all([load('/js/vector-trace-core.js?v=76'), load('/js/vector-export.js?v=76')])
      .then(function () { state.coreReady = true; });
  }

  function getWorker() {
    if (state.worker) return state.worker;
    try {
      var w = new Worker('/js/vector-trace-worker.js?v=76');
      w.onmessage = function (e) {
        var job = state.jobs[e.data.id];
        if (!job) return;
        delete state.jobs[e.data.id];
        if (e.data.error) job.reject(new Error(e.data.error));
        else job.resolve(e.data.result);
      };
      w.onerror = function () {
        state.worker = null;
        var pending = state.jobs;
        state.jobs = {};
        Object.keys(pending).forEach(function (k) { pending[k].reject(new Error('worker-failed')); });
      };
      state.worker = w;
      return w;
    } catch (e) {
      state.worker = null;
      return null;
    }
  }

  /* ============================ HD LOGO ENHANCER & TRACING ============================ */

  // HD pre-pass for logos/icons:
  //  1. edge-preserving smoothing at native size — kills JPEG noise/ringing in
  //     flat areas and gradients without softening edges (no unsharp mask:
  //     its overshoot halos would become extra colour slivers);
  //  2. high-quality upscale of small images so the tracer sees the
  //     anti-aliased ramp at sub-pixel resolution → accurate, crisp edges.
  function buildEnhancedTraceCanvas(srcCanvas, hdOn) {
    var w = srcCanvas.width;
    var h = srcCanvas.height;
    var base = srcCanvas;
    if (hdOn && w * h <= 4000000) {
      base = document.createElement('canvas');
      base.width = w; base.height = h;
      var bctx = base.getContext('2d', { willReadFrequently: true });
      bctx.drawImage(srcCanvas, 0, 0);
      var id = bctx.getImageData(0, 0, w, h);
      var d = id.data, src = new Uint8ClampedArray(d);
      for (var y = 1; y < h - 1; y++) {
        for (var x = 1; x < w - 1; x++) {
          var o = (y * w + x) * 4;
          if (src[o + 3] < 8) continue;
          var sr = 0, sg = 0, sb = 0, n = 0;
          for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
              var q = o + (dy * w + dx) * 4;
              var er = src[q] - src[o], eg = src[q + 1] - src[o + 1], eb = src[q + 2] - src[o + 2];
              if (er * er + eg * eg + eb * eb < 1200 && src[q + 3] > 8) { sr += src[q]; sg += src[q + 1]; sb += src[q + 2]; n++; }
            }
          }
          if (n > 1) { d[o] = sr / n; d[o + 1] = sg / n; d[o + 2] = sb / n; }
        }
      }
      bctx.putImageData(id, 0, 0);
    }
    var maxSide = Math.max(w, h);
    var boostScale = 1;
    if (hdOn && maxSide > 0 && maxSide < 1000) {
      boostScale = clamp(Math.ceil(1000 / maxSide), 2, 4);
      if (maxSide * boostScale > 1600) boostScale = Math.max(1, Math.floor(1600 / maxSide));
    }
    if (boostScale === 1) return { canvas: base, boostScale: 1 };
    var c = document.createElement('canvas');
    c.width = Math.round(w * boostScale);
    c.height = Math.round(h * boostScale);
    var ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(base, 0, 0, c.width, c.height);
    return { canvas: c, boostScale: boostScale };
  }

  function normalizeResultScale(result, boostScale) {
    if (!result || !boostScale || boostScale === 1) return result;
    var inv = 1 / boostScale;
    result.w = Math.round(result.w * inv * 100) / 100;
    result.h = Math.round(result.h * inv * 100) / 100;
    if (result.stats) {
      result.stats.pixelWidth = Math.round(result.w);
      result.stats.pixelHeight = Math.round(result.h);
    }
    for (var i = 0; i < result.paths.length; i++) {
      var p = result.paths[i];
      if (p.area) p.area = p.area * inv * inv;
      var g = p.gradient;
      if (g) {
        ['x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r'].forEach(function (k) { if (typeof g[k] === 'number') g[k] *= inv; });
      }
      for (var j = 0; j < p.subpaths.length; j++) {
        var sp = p.subpaths[j];
        sp.start[0] *= inv;
        sp.start[1] *= inv;
        if (sp.area) sp.area = sp.area * inv * inv;
        for (var k = 0; k < sp.segs.length; k++) {
          var s = sp.segs[k];
          if (s.c) {
            for (var ci = 0; ci < 6; ci++) s.c[ci] *= inv;
          } else if (s.l) {
            s.l[0] *= inv;
            s.l[1] *= inv;
          }
        }
      }
    }
    return result;
  }

  function traceAsync(canvas, options) {
    var seq = ++state.traceSeq;
    var r = root();
    var hdOn = $('#vsHdEnhance', r) ? $('#vsHdEnhance', r).checked : true;
    var prep = buildEnhancedTraceCanvas(canvas, hdOn);
    var ctx = prep.canvas.getContext('2d', { willReadFrequently: true });
    var info = ctx.getImageData(0, 0, prep.canvas.width, prep.canvas.height);
    var payload = { w: info.width, h: info.height, buffer: info.data.buffer, options: options };
    var worker = getWorker();
    var finishRes = function (res) {
      if (seq !== state.traceSeq || !res) return null;
      return normalizeResultScale(res, prep.boostScale);
    };
    if (worker) {
      return new Promise(function (resolve, reject) {
        var id = 'j' + (++state.jobSeq);
        state.jobs[id] = { resolve: resolve, reject: reject, seq: seq };
        try {
          worker.postMessage({ id: id, width: payload.w, height: payload.h, buffer: payload.buffer, options: options }, [payload.buffer]);
        } catch (err) {
          delete state.jobs[id];
          fallbackTrace(payload).then(resolve, reject);
        }
      }).then(finishRes);
    }
    return fallbackTrace(payload).then(finishRes);
  }

  function fallbackTrace(payload) {
    return ensureCore().then(function () {
      var pixels = new Uint8ClampedArray(payload.buffer);
      return window.TechHatVectorTrace.trace({ data: pixels, w: payload.w, h: payload.h }, payload.options);
    });
  }

  /* ============================ MULTI-LOGO QUEUE & UNDO/REDO ============================ */

  function pushUndo(item) {
    if (!item || !item.workCanvas) return;
    var ctx = item.workCanvas.getContext('2d', { willReadFrequently: true });
    var snap = ctx.getImageData(0, 0, item.workCanvas.width, item.workCanvas.height);
    item.undoStack.push(snap);
    if (item.undoStack.length > 25) item.undoStack.shift();
    item.redoStack = [];
    updateUndoRedoButtons();
  }

  function undoAction() {
    var item = activeItem();
    if (!item || !item.undoStack.length) return;
    var ctx = item.workCanvas.getContext('2d', { willReadFrequently: true });
    item.redoStack.push(ctx.getImageData(0, 0, item.workCanvas.width, item.workCanvas.height));
    var prev = item.undoStack.pop();
    item.workCanvas.width = prev.width;
    item.workCanvas.height = prev.height;
    item.workCanvas.getContext('2d').putImageData(prev, 0, 0);
    item.thumbUrl = makeThumbUrl(item.workCanvas);
    updateUndoRedoButtons();
    syncCanvasToStage();
    renderFilmstrip();
    if (!state.editing) scheduleTrace(50);
  }

  function redoAction() {
    var item = activeItem();
    if (!item || !item.redoStack.length) return;
    var ctx = item.workCanvas.getContext('2d', { willReadFrequently: true });
    item.undoStack.push(ctx.getImageData(0, 0, item.workCanvas.width, item.workCanvas.height));
    var next = item.redoStack.pop();
    item.workCanvas.width = next.width;
    item.workCanvas.height = next.height;
    item.workCanvas.getContext('2d').putImageData(next, 0, 0);
    item.thumbUrl = makeThumbUrl(item.workCanvas);
    updateUndoRedoButtons();
    syncCanvasToStage();
    renderFilmstrip();
    if (!state.editing) scheduleTrace(50);
  }

  function resetItemEdits() {
    var item = activeItem();
    if (!item || !item.origCanvas) return;
    pushUndo(item);
    item.workCanvas = cloneCanvas(item.origCanvas);
    item.thumbUrl = makeThumbUrl(item.workCanvas);
    clearSelection();
    syncLegacyState();
    syncCanvasToStage();
    renderFilmstrip();
    showToast('মূল ছবিতে রিসেট করা হয়েছে', 'Reset to original image');
    if (!state.editing) scheduleTrace(0);
  }

  function updateUndoRedoButtons() {
    var r = root();
    if (!r) return;
    var item = activeItem();
    var canUndo = !!(item && item.undoStack.length);
    var canRedo = !!(item && item.redoStack.length);
    $$('[data-vs="undo"], [data-vs="undo-erase"]', r).forEach(function (b) { b.disabled = !canUndo; });
    $$('[data-vs="redo"]', r).forEach(function (b) { b.disabled = !canRedo; });
  }

  function loadVectorFile(fileOrFiles) {
    var files = [];
    if (Array.isArray(fileOrFiles)) {
      files = fileOrFiles;
    } else if (fileOrFiles && fileOrFiles.length !== undefined && !(fileOrFiles instanceof Blob)) {
      files = Array.prototype.slice.call(fileOrFiles);
    } else if (fileOrFiles) {
      files = [fileOrFiles];
    }
    if (!files.length) return;

    var validFiles = files.filter(function (f) {
      return f && (/^image\//i.test(f.type || '') || /\.(png|jpe?g|webp|bmp|gif|svg)$/i.test(f.name || ''));
    });

    if (!validFiles.length) {
      showToast('ছবি বা লোগো ফাইল দিন (PNG, JPG, WebP)', 'Please select an image/logo file (PNG, JPG, WebP)');
      return;
    }

    var loadedCount = 0;
    validFiles.forEach(function (file) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.naturalWidth || img.width || 256;
        var h = img.naturalHeight || img.height || 256;
        var orig = document.createElement('canvas');
        orig.width = w;
        orig.height = h;
        orig.getContext('2d').drawImage(img, 0, 0, w, h);
        addCanvasItem(orig, baseName(file.name || 'logo'));
        loadedCount++;
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        showToast('ছবি লোড করা যায়নি', 'Could not load the image');
      };
      img.src = url;
    });
  }

  function addCanvasItem(origCanvas, name) {
    var work = cloneCanvas(origCanvas);
    var item = {
      id: 'vs-' + (++state.itemSeq),
      name: name || ('logo-' + state.itemSeq),
      origCanvas: origCanvas,
      workCanvas: work,
      undoStack: [],
      redoStack: [],
      result: null,
      exports: {},
      activeLayerIdx: 0,
      thumbUrl: makeThumbUrl(work)
    };
    state.items.push(item);
    selectItem(item.id);
  }

  function selectItem(id) {
    var r = root();
    state.activeId = id;
    var item = activeItem();
    syncLegacyState();
    clearSelection();

    if (!item) {
      resetAll();
      return;
    }

    if (r) {
      r.dataset.hasPages = 'true';
      if ($('#vsTopActions', r)) $('#vsTopActions', r).hidden = false;
      if ($('#vsStage', r)) $('#vsStage', r).hidden = false;
      if ($('#vsEmpty', r)) $('#vsEmpty', r).hidden = true;
      if ($('#vsDropzone', r)) $('#vsDropzone', r).hidden = true;
      if ($('#vsFilename', r)) $('#vsFilename', r).value = item.name + '-vector';
    }

    state.zoom = 1;
    state.panX = 0;
    state.panY = 0;

    updateUndoRedoButtons();
    renderFilmstrip();
    syncCanvasToStage();
    fitZoom();

    // One-click mode: analyse this logo and apply its own optimal settings
    if (state.preset === 'auto' && !item.result) applyPreset('auto', true);
    if (state.preset === 'auto' && !item.result && item.autoCfg && item.autoCfg.summary) {
      var sm = item.autoCfg.summary;
      showToast(
        'অটো বিশ্লেষণ: ' + (sm.mono ? 'মনোক্রোম' : toBn(sm.colors) + ' রং') + (sm.gradient ? ' · গ্রেডিয়েন্ট শনাক্ত' : '') + (sm.bg ? ' · ব্যাকগ্রাউন্ড রিমুভ' : ''),
        'Auto analysis: ' + (sm.mono ? 'monochrome' : sm.colors + ' colors') + (sm.gradient ? ' · gradient detected' : '') + (sm.bg ? ' · background removed' : '')
      );
    }

    if (item.result) {
      renderPreview();
      renderStats();
      renderPalette();
    } else {
      scheduleTrace(0);
    }
  }

  function renderFilmstrip() {
    var r = root();
    if (!r) return;
    var list = $('#vsPageList', r);
    var countEl = $('#vsCount', r);
    var total = state.items.length;
    if (countEl) countEl.textContent = toBn(total);

    var idx = state.items.findIndex(function (it) { return it.id === state.activeId; });
    var badgeText = tr('লোগো ', 'Logo ') + toBn(idx >= 0 ? idx + 1 : 0) + '/' + toBn(total);
    if ($('#vsPageName', r)) $('#vsPageName', r).textContent = badgeText;
    if ($('#vsMobPageBadge', r)) $('#vsMobPageBadge', r).textContent = badgeText;

    var item = activeItem();
    if (item && $('#vsPreviewMeta', r)) {
      $('#vsPreviewMeta', r).textContent = toBn(item.workCanvas.width) + ' × ' + toBn(item.workCanvas.height) + ' px';
    }

    if (!list) return;
    list.innerHTML = '';
    state.items.forEach(function (it, i) {
      var active = it.id === state.activeId;
      var card = document.createElement('div');
      card.className = 'group/card relative rounded-lg border p-1.5 transition-all cursor-pointer ' +
        (active
          ? 'border-violet-500 bg-violet-500/10 dark:bg-violet-500/15 shadow-2xs'
          : 'border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel hover:border-violet-400/60');
      card.setAttribute('data-vs-page-id', it.id);
      card.innerHTML =
        '<div class="relative aspect-4/3 rounded-md overflow-hidden border border-slate-200/70 dark:border-white/10 mb-1.5 flex items-center justify-center" style="background: repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 0 0 / 10px 10px;">' +
          '<img src="' + (it.thumbUrl || '') + '" alt="' + it.name + '" class="max-w-full max-h-full object-contain select-none" draggable="false" />' +
          '<span class="absolute left-1 top-1 px-1.5 py-0.2 rounded bg-slate-900/75 text-white text-[10px] font-bold tabular-nums">' + toBn(i + 1) + '</span>' +
          '<button type="button" data-vs-page-del="' + it.id + '" title="মুছে ফেলুন (Remove)" class="opacity-0 group-hover/card:opacity-100 absolute right-1 top-1 w-5 h-5 rounded bg-rose-600/90 text-white text-[11px] font-bold flex items-center justify-center cursor-pointer transition-opacity">✕</button>' +
        '</div>' +
        '<div class="flex items-center justify-between gap-1 px-0.5">' +
          '<strong class="text-[11px] font-bold text-slate-800 dark:text-studio-text truncate">' + it.name + '</strong>' +
          '<small class="text-[10px] text-slate-400 dark:text-studio-muted tabular-nums shrink-0">' + toBn(it.workCanvas.width) + '×' + toBn(it.workCanvas.height) + '</small>' +
        '</div>';
      list.appendChild(card);
    });
  }

  function resetAll() {
    if (state.editing) exitEditMode(false);
    state.items = [];
    state.activeId = null;
    syncLegacyState();
    clearSelection();
    var r = root();
    if (r) {
      r.dataset.hasPages = 'false';
      r.dataset.editing = 'false';
      delete r.dataset.drawer;
      if ($('#vsDrawerBackdrop', r)) $('#vsDrawerBackdrop', r).hidden = true;
      if ($('#vsTopActions', r)) $('#vsTopActions', r).hidden = true;
      if ($('#vsStage', r)) $('#vsStage', r).hidden = true;
      if ($('#vsEmpty', r)) $('#vsEmpty', r).hidden = false;
      if ($('#vsDropzone', r)) $('#vsDropzone', r).hidden = false;
      if ($('#vsPageList', r)) $('#vsPageList', r).innerHTML = '';
      if ($('#vsPaletteList', r)) $('#vsPaletteList', r).innerHTML = '';
      if ($('#vsCount', r)) $('#vsCount', r).textContent = '0';
      if ($('#vsLayerCount', r)) $('#vsLayerCount', r).textContent = '0';
    }
  }

  /* ============================ ROTATE, FLIP & SMART AUTO-TRIM ============================ */

  function rotateActive(deg) {
    var item = activeItem();
    if (!item) return;
    pushUndo(item);
    var src = item.workCanvas;
    var c = document.createElement('canvas');
    c.width = src.height;
    c.height = src.width;
    var ctx = c.getContext('2d');
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.drawImage(src, -src.width / 2, -src.height / 2);
    item.workCanvas = c;
    item.thumbUrl = makeThumbUrl(c);
    clearSelection();
    syncLegacyState();
    syncCanvasToStage();
    fitZoom();
    renderFilmstrip();
    if (!state.editing) scheduleTrace(0);
  }

  function flipActiveHorizontal() {
    var item = activeItem();
    if (!item) return;
    pushUndo(item);
    var src = item.workCanvas;
    var c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    var ctx = c.getContext('2d');
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0);
    item.workCanvas = c;
    item.thumbUrl = makeThumbUrl(c);
    clearSelection();
    syncLegacyState();
    syncCanvasToStage();
    renderFilmstrip();
    if (!state.editing) scheduleTrace(0);
  }

  function autoTrimActiveLogo() {
    var item = activeItem();
    if (!item) return;
    var src = item.workCanvas;
    var w = src.width, h = src.height;
    if (w < 8 || h < 8) return;
    var ctx = src.getContext('2d', { willReadFrequently: true });
    var d = ctx.getImageData(0, 0, w, h).data;

    // Sample corner pixel to detect solid background if opaque
    var cR = d[0], cG = d[1], cB = d[2], cA = d[3];
    var isFg = function (x, y) {
      var i = (y * w + x) * 4;
      var a = d[i + 3];
      if (a < 20) return false;
      if (cA < 20) return a >= 20;
      var dist = Math.abs(d[i] - cR) + Math.abs(d[i + 1] - cG) + Math.abs(d[i + 2] - cB);
      return dist > 36;
    };

    var minX = w, minY = h, maxX = -1, maxY = -1;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (isFg(x, y)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      showToast('ট্রিম করার মতো অতিরিক্ত মার্জিন পাওয়া যায়নি', 'No extra margins found to trim');
      return;
    }

    var pad = Math.max(4, Math.round(Math.max(maxX - minX, maxY - minY) * 0.04));
    var x0 = Math.max(0, minX - pad);
    var y0 = Math.max(0, minY - pad);
    var x1 = Math.min(w, maxX + 1 + pad);
    var y1 = Math.min(h, maxY + 1 + pad);
    var nw = x1 - x0, nh = y1 - y0;

    if (nw >= w - 2 && nh >= h - 2) {
      showToast('লোগোটি ইতিমধ্যে নিখুঁতভাবে ট্রিম করা আছে', 'Logo margins are already tightly trimmed');
      return;
    }

    pushUndo(item);
    var out = document.createElement('canvas');
    out.width = nw;
    out.height = nh;
    out.getContext('2d').drawImage(src, x0, y0, nw, nh, 0, 0, nw, nh);
    item.workCanvas = out;
    item.thumbUrl = makeThumbUrl(out);
    clearSelection();
    syncLegacyState();
    syncCanvasToStage();
    fitZoom();
    renderFilmstrip();
    showToast('লোগো অটো-ট্রিম সম্পন্ন (' + toBn(nw) + '×' + toBn(nh) + ')', 'Logo auto-trimmed (' + nw + '×' + nh + ')');
    if (!state.editing) scheduleTrace(0);
  }

  /* ============================ OPTIONS & PRESETS ============================ */

  function updateSliderPodUI(key) {
    var r = root();
    if (!r || !ADJ_META[key]) return;
    var m = ADJ_META[key];
    var input = $('#' + m.id, r);
    if (!input) return;
    var val = parseFloat(input.value);
    var pct = clamp(((val - m.min) / (m.max - m.min)) * 100, 0, 100);
    var fill = $('[data-vs-adj-fill="' + key + '"]', r);
    if (fill) fill.style.width = pct.toFixed(1) + '%';
    var out = $('#' + m.outId, r);
    if (out) out.textContent = m.fmt(val);
    var pod = $('[data-vs-adj-pod="' + key + '"]', r);
    if (pod) pod.setAttribute('data-modified', val !== m.def ? 'true' : 'false');
  }

  function updateAllSliderPods() {
    Object.keys(ADJ_META).forEach(updateSliderPodUI);
  }

  function applyPreset(presetKey, skipTrace) {
    var r = root();
    var cfg = PRESET_CONFIGS[presetKey] || PRESET_CONFIGS.logo_hd;
    state.preset = presetKey;
    if (!r) return;
    if (presetKey === 'auto') {
      var it = activeItem();
      if (it) {
        if (!it.autoCfg) it.autoCfg = autoAnalyze(it.workCanvas);
        cfg = it.autoCfg;
      }
    }

    var setVal = function (id, v) { var el = $('#' + id, r); if (el) el.value = String(v); };
    var setChk = function (id, v) { var el = $('#' + id, r); if (el) el.checked = !!v; };

    setVal('vsColors', cfg.colors);
    setVal('vsTolerance', cfg.tolerance);
    setVal('vsCorner', cfg.corner);
    setVal('vsMinArea', cfg.minArea);
    setVal('vsBgTol', cfg.bgTol);
    setVal('vsScale', cfg.scale);
    setVal('vsContrast', cfg.contrast);
    setVal('vsBrightness', cfg.brightness);

    setChk('vsHdEnhance', cfg.hdEnhance);
    setChk('vsGapFree', cfg.gapFree);
    setChk('vsAutoThr', cfg.autoThr);
    setChk('vsInvert', cfg.invert);
    setChk('vsGradient', cfg.gradients);
    setChk('vsSharpCorners', cfg.sharp);
    if (cfg.bgMode) {
      setVal('vsBgMode', cfg.bgMode);
      if (cfg.bgHex) setVal('vsBgColor', cfg.bgHex);
    }

    if (presetKey === 'auto' && cfg.summary && !skipTrace) {
      var sm = cfg.summary;
      showToast(
        'অটো বিশ্লেষণ: ' + (sm.mono ? 'মনোক্রোম' : toBn(sm.colors) + ' রং') + (sm.gradient ? ' · গ্রেডিয়েন্ট শনাক্ত' : '') + (sm.bg ? ' · ব্যাকগ্রাউন্ড রিমুভ' : ''),
        'Auto analysis: ' + (sm.mono ? 'monochrome' : sm.colors + ' colors') + (sm.gradient ? ' · gradient detected' : '') + (sm.bg ? ' · background removed' : '')
      );
    }

    var stackVal = cfg.gapFree ? 'stacked' : 'cutout';
    setVal('vsStacking', stackVal);
    setVal('vsLayerStackMode', stackVal);

    // Illustrator Image Trace fields
    state.it.palette = cfg.palette || 'auto';
    state.it.grays = cfg.grays || 12;
    state.it.threshold = Math.round((cfg.threshold == null ? 50 : cfg.threshold) * 2.55);
    setVal('vsThreshold', cfg.threshold == null ? 50 : cfg.threshold);
    state.it.ignoreWhite = !!cfg.ignoreWhite;
    state.it.strokes = !!cfg.strokes;
    state.it.fills = cfg.fills !== false;
    state.it.strokeW = cfg.strokeW || 10;
    state.it.snapLines = !!cfg.snapLines;

    // Sync radio check
    $$('input[name="vsPreset"]', r).forEach(function (rad) {
      rad.checked = rad.value === presetKey;
    });
    if ($('#itPreset', r) && $('#itPreset', r).querySelector('option[value="' + presetKey + '"]')) $('#itPreset', r).value = presetKey;

    updateAllSliderPods();
    setMode(cfg.mode, true);
    syncItFromLegacy();
    if (!skipTrace) scheduleTrace(0);
  }

  function setMode(mode, skipTrace) {
    state.mode = mode === 'mono' ? 'mono' : (mode === 'gray' ? 'gray' : 'color');
    var r = root();
    if (!r) return;
    $$('#vsModeTabs [data-vs-mode]', r).forEach(function (b) {
      var active = b.getAttribute('data-vs-mode') === state.mode;
      b.classList.toggle('active', active);
      b.classList.toggle('bg-white', active);
      b.classList.toggle('dark:bg-violet-600', active);
      b.classList.toggle('text-violet-700', active);
      b.classList.toggle('dark:text-white', active);
      b.classList.toggle('shadow-2xs', active);
      b.classList.toggle('text-slate-600', !active);
      b.classList.toggle('dark:text-slate-400', !active);
    });
    if ($('#itMode', r)) $('#itMode', r).value = state.mode;
    r.dataset.itMode = state.mode;
    updateItVisibility();
    if (!skipTrace) scheduleTrace(0);
  }

  /* ============================ ILLUSTRATOR IMAGE TRACE PANEL ============================ */

  // Rows tagged data-it-when="color|gray|mono" only show for that mode;
  // data-it-pal="custom" only for the swatch palette; the stroke-width row
  // only when "Strokes" is enabled — exactly like Illustrator's panel.
  function updateItVisibility() {
    var r = root();
    if (!r) return;
    $$('[data-it-when]', r).forEach(function (el) {
      var modes = el.getAttribute('data-it-when').split(/\s+/);
      var ok = modes.indexOf(state.mode) >= 0;
      var pal = el.getAttribute('data-it-pal');
      if (ok && pal) ok = state.it.palette === pal;
      if (ok && el.hasAttribute('data-it-strokes-row')) ok = !!state.it.strokes;
      el.hidden = !ok;
    });
    var thr = $('#itThreshold', r), thrN = $('#itThresholdNum', r);
    var auto = !!($('#itAutoThr', r) && $('#itAutoThr', r).checked);
    if (thr) thr.disabled = auto;
    if (thrN) thrN.disabled = auto;
  }

  function itSetRange(id, val) {
    var r = root();
    var el = $('#' + id, r);
    if (el) el.value = String(val);
    var num = $('#' + id + 'Num', r);
    if (num) num.value = String(val);
    var fill = $('[data-it-fill="' + id + '"]', r);
    if (fill && el) {
      var mn = parseFloat(el.min) || 0, mx = parseFloat(el.max) || 100;
      fill.style.width = clamp(((val - mn) / (mx - mn)) * 100, 0, 100).toFixed(1) + '%';
    }
  }

  // Legacy controls (presets / adjustments) → Image Trace panel
  function syncItFromLegacy() {
    var r = root();
    if (!r || !$('#itPanel', r)) return;
    var gv = function (id, d) { var el = $('#' + id, r); return el ? parseFloat(el.value) : d; };
    itSetRange('itColors', clamp(gv('vsColors', 12), 2, 128));
    itSetRange('itGrays', clamp(state.it.grays, 2, 128));
    itSetRange('itThreshold', clamp(state.it.threshold, 0, 255));
    itSetRange('itPaths', tolToPathsPct(gv('vsTolerance', 9) / 10));
    itSetRange('itCorners', degToCornersPct(gv('vsCorner', 50)));
    itSetRange('itNoise', clamp(gv('vsMinArea', 8), 1, 200));
    itSetRange('itStrokeW', clamp(state.it.strokeW, 1, 100));
    if ($('#itPalette', r)) $('#itPalette', r).value = state.it.palette;
    if ($('#itAutoThr', r)) $('#itAutoThr', r).checked = !!($('#vsAutoThr', r) && $('#vsAutoThr', r).checked);
    if ($('#itIgnoreWhite', r)) $('#itIgnoreWhite', r).checked = state.it.ignoreWhite;
    if ($('#itSnapLines', r)) $('#itSnapLines', r).checked = state.it.snapLines;
    if ($('#itFills', r)) $('#itFills', r).checked = state.it.fills;
    if ($('#itStrokes', r)) $('#itStrokes', r).checked = state.it.strokes;
    if ($('#itGradients', r)) $('#itGradients', r).checked = !!($('#vsGradient', r) && $('#vsGradient', r).checked);
    var method = (($('#vsLayerStackMode', r) || {}).value || 'stacked') === 'cutout' ? 'abut' : 'overlap';
    $$('[data-it-method]', r).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-it-method') === method ? 'true' : 'false'); });
    r.dataset.itPalette = state.it.palette;
    r.dataset.itStrokes = state.it.strokes ? 'true' : 'false';
    renderSwatches();
    updateItVisibility();
  }

  // Image Trace panel → legacy controls (single source of engine options)
  function syncLegacyFromIt() {
    var r = root();
    if (!r) return;
    var gv = function (id, d) { var el = $('#' + id, r); return el ? parseFloat(el.value) : d; };
    var setVal = function (id, v) { var el = $('#' + id, r); if (el) el.value = String(v); };
    setVal('vsColors', clamp(Math.round(gv('itColors', 12)), 2, 128));
    setVal('vsTolerance', clamp(Math.round(pathsPctToTol(gv('itPaths', 50)) * 10), 1, 50));
    setVal('vsCorner', clamp(cornersPctToDeg(gv('itCorners', 75)), 20, 160));
    setVal('vsMinArea', clamp(Math.round(gv('itNoise', 8)), 0, 200));
    state.it.grays = clamp(Math.round(gv('itGrays', 12)), 2, 128);
    state.it.threshold = clamp(Math.round(gv('itThreshold', 128)), 0, 255);
    setVal('vsThreshold', Math.round(state.it.threshold / 2.55));
    state.it.strokeW = clamp(Math.round(gv('itStrokeW', 10)), 1, 100);
    state.it.palette = ($('#itPalette', r) || {}).value || 'auto';
    var ck = function (id) { var el = $('#' + id, r); return !!(el && el.checked); };
    if ($('#vsAutoThr', r) && $('#itAutoThr', r)) $('#vsAutoThr', r).checked = ck('itAutoThr');
    if ($('#vsGradient', r) && $('#itGradients', r)) $('#vsGradient', r).checked = ck('itGradients');
    state.it.ignoreWhite = ck('itIgnoreWhite');
    state.it.snapLines = ck('itSnapLines');
    state.it.fills = ck('itFills');
    state.it.strokes = ck('itStrokes');
    if (!state.it.fills && !state.it.strokes) { state.it.fills = true; if ($('#itFills', r)) $('#itFills', r).checked = true; }
    r.dataset.itPalette = state.it.palette;
    r.dataset.itStrokes = state.it.strokes ? 'true' : 'false';
    updateAllSliderPods();
    updateItVisibility();
  }

  function markCustomPreset() {
    var r = root();
    state.preset = 'custom';
    if ($('#itPreset', r)) $('#itPreset', r).value = 'custom';
    $$('input[name="vsPreset"]', r).forEach(function (rad) { rad.checked = false; });
  }

  function itChanged(immediate) {
    syncLegacyFromIt();
    markCustomPreset();
    if (state.it.preview) scheduleTrace(immediate ? 0 : 260);
  }

  function renderSwatches() {
    var r = root();
    var box = $('#itSwatches', r);
    if (!box) return;
    box.innerHTML = '';
    if (!state.it.custom.length) {
      box.innerHTML = '<span class="text-[10.5px] text-slate-400 dark:text-slate-500">' + tr('কোনো সোয়াচ নেই — নিচে যোগ করুন বা ছবি থেকে নিন', 'No swatches — add below or extract from image') + '</span>';
      return;
    }
    state.it.custom.forEach(function (c, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-it-swatch-del', String(i));
      b.title = rgbToHex(c[0], c[1], c[2]).toUpperCase() + ' — ' + tr('সরাতে ক্লিক করুন', 'click to remove');
      b.className = 'w-5 h-5 rounded-[3px] border border-slate-300 dark:border-white/25 cursor-pointer hover:scale-110 transition-transform';
      b.style.background = rgbToHex(c[0], c[1], c[2]);
      box.appendChild(b);
    });
  }

  function extractSwatches() {
    var item = activeItem();
    if (!item || !window.TechHatVectorTrace) return;
    var src = item.workCanvas;
    var s = Math.min(1, 320 / Math.max(src.width, src.height));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(src.width * s)); c.height = Math.max(1, Math.round(src.height * s));
    var cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(src, 0, 0, c.width, c.height);
    var d = cx.getImageData(0, 0, c.width, c.height).data;
    var k = clamp(parseInt(($('#itColors', root()) || {}).value, 10) || 8, 2, 32);
    var q = window.TechHatVectorTrace.quantize(d, c.width, c.height, k);
    state.it.custom = q.palette.map(function (p) { return [p[0], p[1], p[2]]; });
    renderSwatches();
    showToast('ছবি থেকে ' + toBn(state.it.custom.length) + 'টি সোয়াচ নেওয়া হয়েছে', 'Extracted ' + state.it.custom.length + ' swatches from image');
  }

  function installImageTracePanel() {
    var r = root();
    if (!r || !$('#itPanel', r)) return;
    // range + number pairs
    ['itColors', 'itGrays', 'itThreshold', 'itPaths', 'itCorners', 'itNoise', 'itStrokeW'].forEach(function (id) {
      var el = $('#' + id, r), num = $('#' + id + 'Num', r);
      if (el) el.addEventListener('input', function () { itSetRange(id, parseFloat(el.value)); itChanged(false); });
      if (num) num.addEventListener('change', function () {
        var v = clamp(parseFloat(num.value) || 0, parseFloat(el.min), parseFloat(el.max));
        itSetRange(id, v); itChanged(true);
      });
    });
    ['itAutoThr', 'itIgnoreWhite', 'itSnapLines', 'itFills', 'itStrokes', 'itGradients'].forEach(function (id) {
      var el = $('#' + id, r);
      if (el) el.addEventListener('change', function () { itChanged(true); });
    });
    var pal = $('#itPalette', r);
    if (pal) pal.addEventListener('change', function () {
      if (pal.value === 'custom' && !state.it.custom.length) extractSwatches();
      itChanged(true);
    });
    var mode = $('#itMode', r);
    if (mode) mode.addEventListener('change', function () {
      setMode(mode.value, true);
      if (state.mode === 'mono' && !state.it.ignoreWhite) { state.it.ignoreWhite = true; if ($('#itIgnoreWhite', r)) $('#itIgnoreWhite', r).checked = true; }
      itChanged(true);
    });
    var preset = $('#itPreset', r);
    if (preset) preset.addEventListener('change', function () {
      if (preset.value !== 'custom') applyPreset(preset.value, !state.it.preview);
    });
    var view = $('#itView', r);
    if (view) view.addEventListener('change', function () { setViewMode(view.value); });
    var prev = $('#itPreview', r);
    if (prev) prev.addEventListener('change', function () {
      state.it.preview = prev.checked;
      if (prev.checked) scheduleTrace(0);
    });
    var eye = $('#itEye', r);
    if (eye) {
      var down = function (e) { e.preventDefault(); state.comparingOrig = true; updateLayerVisibility(); };
      var up = function () { if (!state.comparingOrig) return; state.comparingOrig = false; updateLayerVisibility(); };
      eye.addEventListener('pointerdown', down);
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { eye.addEventListener(ev, up); });
    }
    var add = $('#itSwatchAdd', r);
    if (add) add.addEventListener('change', function () {
      state.it.custom.push(hexToRgb(add.value));
      renderSwatches();
      if (state.it.palette === 'custom') itChanged(true);
    });
    r.addEventListener('click', function (e) {
      var q = e.target.closest('[data-it-quick]');
      if (q) { applyPreset(q.getAttribute('data-it-quick'), false); return; }
      var m = e.target.closest('[data-it-method]');
      if (m) {
        var v = m.getAttribute('data-it-method') === 'abut' ? 'cutout' : 'stacked';
        if ($('#vsLayerStackMode', r)) $('#vsLayerStackMode', r).value = v;
        if ($('#vsStacking', r)) $('#vsStacking', r).value = v;
        if ($('#vsGapFree', r)) $('#vsGapFree', r).checked = v === 'stacked';
        $$('[data-it-method]', r).forEach(function (b) { b.setAttribute('aria-pressed', b === m ? 'true' : 'false'); });
        itChanged(true);
        return;
      }
      var sd = e.target.closest('[data-it-swatch-del]');
      if (sd) {
        state.it.custom.splice(parseInt(sd.getAttribute('data-it-swatch-del'), 10), 1);
        renderSwatches();
        if (state.it.palette === 'custom') itChanged(true);
        return;
      }
      if (e.target.closest('[data-it="extract"]')) { extractSwatches(); if (state.it.palette === 'custom') itChanged(true); return; }
      if (e.target.closest('[data-it="trace"]')) { syncLegacyFromIt(); scheduleTrace(0); }
    });
    syncItFromLegacy();
  }

  function collectOptions() {
    var r = root();
    var mode = state.mode;
    var pre = {
      scale: parseInt(($('#vsScale', r) || {}).value, 10) || 100,
      brightness: parseInt(($('#vsBrightness', r) || {}).value, 10) || 0,
      contrast: parseInt(($('#vsContrast', r) || {}).value, 10) || 0,
      bgMode: ($('#vsBgMode', r) || {}).value || 'off',
      bgColor: hexToRgb(($('#vsBgColor', r) || {}).value || '#ffffff'),
      bgTolerance: parseInt(($('#vsBgTol', r) || {}).value, 10) || 15,
      median: parseInt(($('#vsMedian', r) || {}).value, 10) || 0,
      blur: parseInt(($('#vsBlur', r) || {}).value, 10) || 0
    };
    var opts = {
      mode: mode,
      preprocess: pre,
      cornerThreshold: parseInt(($('#vsCorner', r) || {}).value, 10) || 60,
      tolerance: (parseInt(($('#vsTolerance', r) || {}).value, 10) || 10) / 10,
      minArea: parseInt(($('#vsMinArea', r) || {}).value, 10) || 0,
      gradients: $('#vsGradient', r) ? $('#vsGradient', r).checked : true,
      sharpCorners: $('#vsSharpCorners', r) ? $('#vsSharpCorners', r).checked : true,
      snapLines: !!state.it.snapLines,
      ignoreWhite: !!state.it.ignoreWhite,
      stacking: ($('#vsLayerStackMode', r) || $('#vsStacking', r) || {}).value || 'stacked'
    };
    if (mode === 'mono') {
      opts.threshold = ($('#vsAutoThr', r) && $('#vsAutoThr', r).checked) ? null : (parseInt(($('#vsThreshold', r) || {}).value, 10) || 50);
      opts.invert = !!($('#vsInvert', r) && $('#vsInvert', r).checked);
      opts.strokes = !!state.it.strokes;
      opts.fills = state.it.fills !== false;
      opts.strokeWidth = state.it.strokeW || 10;
    } else if (mode === 'gray') {
      opts.grays = state.it.grays || 12;
    } else {
      opts.colors = parseInt(($('#vsColors', r) || {}).value, 10) || 12;
      var pal = state.it.palette;
      if (pal === 'limited') { opts.gradients = false; opts.snapPalette = true; }
      else if (pal === 'custom' && state.it.custom.length) { opts.fixedPalette = state.it.custom.slice(); opts.gradients = false; }
    }
    return opts;
  }

  function scheduleTrace(delay) {
    clearTimeout(state.debounceTid);
    state.debounceTid = setTimeout(runTrace, delay == null ? 240 : delay);
  }

  function setBusy(on, label) {
    state.busy = on;
    var r = root();
    if (!r) return;
    var b = $('#vsBusy', r);
    if (b) {
      b.classList.toggle('hidden', !on);
      b.classList.toggle('flex', on);
      if (on && label && $('#vsBusyText', r)) $('#vsBusyText', r).textContent = label;
    }
    var loader = $('#vsPreviewLoader', r);
    if (loader) loader.hidden = !on;
    var btn = $('#vsTraceBtn', r);
    if (btn) btn.disabled = on;
  }

  function runTrace() {
    var item = activeItem();
    if (!item || !item.workCanvas) return;
    syncLegacyState();
    var opts = collectOptions();
    setBusy(true, tr('ভেক্টর তৈরি হচ্ছে…', 'Vectorizing…'));
    setStatus('ভেক্টর পাথ ও বেজিয়ার কার্ভ তৈরি হচ্ছে…', 'Tracing high-precision Bezier vector paths…');
    ensureCore().then(function () {
      return traceAsync(item.workCanvas, opts);
    }).then(function (result) {
      setBusy(false);
      if (!result) return;
      item.result = result;
      item.exports = {};
      if (item.activeLayerIdx >= result.paths.length) {
        item.activeLayerIdx = Math.max(0, result.paths.length - 1);
      }
      syncLegacyState();
      renderPreview();
      renderStats();
      renderPalette();
      scheduleProjectAutosave(900);
      setStatus(
        'প্রস্তুত · ' + toBn(result.stats.paths) + 'টি ভেক্টর পাথ ও ' + toBn(result.stats.nodes) + 'টি বেজিয়ার নোড',
        'Ready · ' + result.stats.paths + ' vector paths & ' + result.stats.nodes + ' Bezier nodes'
      );
    }).catch(function (err) {
      setBusy(false);
      console.warn('vector trace failed', err);
      showToast('রূপান্তর ব্যর্থ: ' + (err && err.message ? err.message : ''), 'Conversion failed: ' + (err && err.message ? err.message : ''));
    });
  }

  var _projSaveTimer = null;
  function scheduleProjectAutosave(delay) {
    clearTimeout(_projSaveTimer);
    _projSaveTimer = setTimeout(function () {
      var item = activeItem();
      if (!item || !item.workCanvas || !item.result) return;
      if (!window.TechHatStore || !window.TechHatStore.saveProject) return;
      try {
        item.workCanvas.toBlob(function (blob) {
          if (!blob) return;
          var projKey = item.projectId || ('proj:vectorize:' + (item.name || 'logo'));
          window.TechHatStore.saveProject('vectorize', projKey, {
            title: item.name || 'Vector Logo',
            thumb: item.thumbUrl || '',
            blob: blob,
            mime: 'image/png',
            state: {
              name: item.name || 'logo',
              preset: state.preset,
              mode: state.mode,
              view: state.view,
              activeLayerIdx: item.activeLayerIdx || 0,
              it: JSON.parse(JSON.stringify(state.it || {})),
              result: {
                w: item.result.w,
                h: item.result.h,
                paths: item.result.paths,
                stats: item.result.stats
              }
            }
          }).then(function (rec) {
            if (rec && rec.id) item.projectId = rec.id;
          }).catch(function () {});
        }, 'image/png');
      } catch (_) {}
    }, delay == null ? 1000 : delay);
  }

  function restoreSavedProject(explicitId) {
    if (!window.TechHatStore) return;
    var openId = explicitId || '';
    if (!openId) {
      try {
        openId = sessionStorage.getItem('thbc-open-project') || '';
        if (openId) sessionStorage.removeItem('thbc-open-project');
      } catch (_) {}
    }
    if (!openId && state.items.length > 0) return;
    var p = openId ? window.TechHatStore.get('projects', openId) : window.TechHatStore.latestProject('vectorize');
    Promise.resolve(p).then(function (rec) {
      if (!rec || rec.deleted || rec.tool !== 'vectorize') return null;
      if (!rec.blob && rec.blobRemote && window.TechHatCloud && window.TechHatCloud.ensureBlob) {
        return window.TechHatCloud.ensureBlob('projects', rec);
      }
      return rec;
    }).then(function (rec) {
      if (!rec || !rec.blob) return;
      var blob = rec.blob instanceof Blob ? rec.blob : new Blob([rec.blob], { type: rec.mime || 'image/png' });
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.naturalWidth || img.width || 256;
        var h = img.naturalHeight || img.height || 256;
        var orig = document.createElement('canvas');
        orig.width = w;
        orig.height = h;
        orig.getContext('2d').drawImage(img, 0, 0, w, h);
        var work = cloneCanvas(orig);
        var st = rec.state || {};
        if (st.it && typeof st.it === 'object') {
          Object.keys(st.it).forEach(function (k) { state.it[k] = st.it[k]; });
          syncItFromLegacy();
        }
        if (st.preset) state.preset = st.preset;
        if (st.mode) state.mode = st.mode;
        var existing = state.items.find(function (x) { return x.projectId === rec.id; });
        if (existing) {
          existing.origCanvas = orig;
          existing.workCanvas = work;
          existing.result = (st.result && Array.isArray(st.result.paths)) ? st.result : null;
          existing.thumbUrl = rec.thumb || makeThumbUrl(work);
          selectItem(existing.id);
          return;
        }
        var item = {
          id: 'vs-' + (++state.itemSeq),
          projectId: rec.id,
          name: st.name || rec.title || ('logo-' + state.itemSeq),
          origCanvas: orig,
          workCanvas: work,
          undoStack: [],
          redoStack: [],
          result: (st.result && Array.isArray(st.result.paths)) ? st.result : null,
          exports: {},
          activeLayerIdx: st.activeLayerIdx || 0,
          thumbUrl: rec.thumb || makeThumbUrl(work)
        };
        state.items.push(item);
        ensureCore().then(function () {
          selectItem(item.id);
        });
      };
      img.onerror = function () { URL.revokeObjectURL(url); };
      img.src = url;
    }).catch(function () {});
  }

  /* ============================ PREVIEW & VIEW MODES ============================ */

  function syncCanvasToStage() {
    var r = root();
    var item = activeItem();
    if (!r || !item || !item.workCanvas) return;
    var c = $('#vsSrcCanvas', r);
    if (!c) return;
    c.width = item.workCanvas.width;
    c.height = item.workCanvas.height;
    c.getContext('2d').drawImage(item.workCanvas, 0, 0);

    var txtC = $('#vsTextLayer', r);
    if (txtC && (txtC.width !== c.width || txtC.height !== c.height)) {
      txtC.width = c.width;
      txtC.height = c.height;
    }
  }

  function applyTransform() {
    var r = root();
    if (!r) return;
    var layer = $('#vsZoomLayer', r);
    if (!layer) return;
    var scale = (state.fitScale || 1) * (state.zoom || 1);
    layer.style.transform = 'translate(calc(-50% + ' + state.panX + 'px), calc(-50% + ' + state.panY + 'px)) scale(' + scale + ')';
    var pctText = toBn(Math.round(state.zoom * 100)) + '%';
    if ($('#vsZoomLabel', r)) $('#vsZoomLabel', r).textContent = pctText;
    if ($('#vsPreviewZoomLabel', r)) $('#vsPreviewZoomLabel', r).textContent = pctText;
    if (state.view === 'split') positionSplit();
  }

  function fitZoom() {
    var r = root();
    if (!r) return;
    var vp = $('#vsViewport', r);
    var c = $('#vsSrcCanvas', r);
    if (!vp || !c || !c.width || !c.height) return;
    var vw = Math.max(120, vp.clientWidth - (state.editing ? 76 : 32));
    var vh = Math.max(120, vp.clientHeight - 32);
    state.fitScale = Math.min(vw / c.width, vh / c.height);
    if (!Number.isFinite(state.fitScale) || state.fitScale <= 0) state.fitScale = 1;
    state.zoom = 1;
    state.panX = 0;
    state.panY = 0;
    applyTransform();
  }

  function setViewMode(viewMode) {
    var r = root();
    if (!r) return;
    var v = viewMode || 'split';
    if (v === 'preview') v = 'result';
    if (v === 'wire') v = 'result-outlines';
    state.view = v;
    r.dataset.view = state.view;
    $$('[data-vs-view]', r).forEach(function (btn) {
      var bv = btn.getAttribute('data-vs-view');
      if (bv === 'preview') bv = 'result';
      if (bv === 'wire') bv = 'result-outlines';
      btn.setAttribute('aria-pressed', bv === state.view ? 'true' : 'false');
    });
    var sel = $('#itView', r);
    if (sel && sel.value !== state.view && sel.querySelector('option[value="' + state.view + '"]')) sel.value = state.view;
    updateLayerVisibility();
  }

  // Split position is stored as a percentage of the IMAGE width (#vsSplit).
  // The on-screen divider is placed in viewport pixels from the image's real
  // (zoomed / panned) rectangle, so the line always sits exactly on the
  // before/after boundary.
  function positionSplit() {
    var r = root();
    if (!r) return;
    var handle = $('#vsSplitHandle', r);
    var vp = $('#vsViewport', r);
    var layer = $('#vsZoomLayer', r);
    var splitInput = $('#vsSplit', r);
    if (!handle || !vp || !layer) return;
    var pct = clamp(parseFloat(splitInput ? splitInput.value : '50') || 0, 0, 100);
    var lr = layer.getBoundingClientRect();
    var vr = vp.getBoundingClientRect();
    if (!lr.width) return;
    var x = lr.left - vr.left + (pct / 100) * lr.width;
    var top = Math.max(0, lr.top - vr.top), bottom = Math.min(vr.height, lr.bottom - vr.top);
    handle.style.left = x + 'px';
    handle.style.transform = 'translateX(-50%)';
    handle.style.top = top + 'px';
    handle.style.bottom = 'auto';
    handle.style.height = Math.max(0, bottom - top) + 'px';
    var vecImg = $('#vsVecImg', r);
    var src = $('#vsSrcCanvas', r);
    if (state.view === 'split' && !state.editing && !state.comparingOrig) {
      if (vecImg) vecImg.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
      if (src) src.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
    }
  }

  function setSplitFromClientX(clientX) {
    var r = root();
    var layer = $('#vsZoomLayer', r);
    var split = $('#vsSplit', r);
    if (!layer) return;
    var lr = layer.getBoundingClientRect();
    var pct = clamp(((clientX - lr.left) / Math.max(1, lr.width)) * 100, 0, 100);
    if (split) split.value = String(Math.round(pct * 10) / 10);
    positionSplit();
  }

  function updateLayerVisibility() {
    var r = root();
    if (!r) return;
    var src = $('#vsSrcCanvas', r);
    var vecImg = $('#vsVecImg', r);
    var wire = $('#vsWireLayer', r);
    var handle = $('#vsSplitHandle', r);
    var splitWrap = $('#vsSplitWrap', r);
    var badgeOrig = $('#vsBadgeOrig', r);
    var badgeVec = $('#vsBadgeVec', r);
    var v = state.view;

    var show = function (el, on) { if (el) el.classList.toggle('hidden', !on); };
    // the raster canvas always keeps its layout box (it sizes the stage);
    // only its paint is hidden so the vector result is never "polluted" by
    // the source pixels underneath (hidden / deleted layers become visible).
    var srcVisible = true;
    if (src) { src.style.clipPath = 'none'; }
    if (vecImg) vecImg.style.clipPath = 'none';

    if (state.editing || state.comparingOrig || v === 'crop' || v === 'source' || !state.result) {
      show(vecImg, false); show(wire, false); show(handle, false); show(splitWrap, false);
      show(badgeOrig, !state.editing); show(badgeVec, false);
    } else if (v === 'result') {
      srcVisible = false;
      show(vecImg, true); show(wire, false); show(handle, false); show(splitWrap, false);
      show(badgeOrig, false); show(badgeVec, true);
    } else if (v === 'result-outlines' || v === 'outlines' || v === 'outlines-source') {
      srcVisible = v === 'outlines-source';
      show(vecImg, v === 'result-outlines');
      show(wire, true);
      if (wire && state.result) wire.innerHTML = buildWireSvg(state.result, v);
      show(handle, false); show(splitWrap, false);
      show(badgeOrig, v === 'outlines-source'); show(badgeVec, v !== 'outlines-source');
    } else {
      // 'split' — before (left, raster) / after (right, vector)
      show(vecImg, true); show(wire, false); show(handle, true); show(splitWrap, true);
      show(badgeOrig, true); show(badgeVec, true);
    }
    if (src) src.style.visibility = srcVisible ? 'visible' : 'hidden';
    if (v === 'split' && state.result && !state.editing && !state.comparingOrig) positionSplit();
  }

  function renderPreview() {
    var r = root();
    var item = activeItem();
    if (!r || !item || !state.result) return;
    syncCanvasToStage();

    var vecImg = $('#vsVecImg', r);
    var svgText = window.TechHatVectorExport.toSvg(state.result, { title: item.name });
    item.exports.svg = svgText;
    state.exports = item.exports;

    if (vecImg) {
      var blob = new Blob([svgText], { type: 'image/svg+xml' });
      if (vecImg._url) URL.revokeObjectURL(vecImg._url);
      vecImg._url = URL.createObjectURL(blob);
      vecImg.src = vecImg._url;
    }

    var wire = $('#vsWireLayer', r);
    if (wire && /outlines/.test(state.view)) {
      wire.innerHTML = buildWireSvg(state.result, state.view);
    }

    updateLayerVisibility();
  }

  // Illustrator-style outline views. 'result-outlines' = blue paths with
  // anchor points over the result; 'outlines' / 'outlines-source' = thin dark
  // path outlines only (centerline strokes drawn as open paths).
  function buildWireSvg(result, view) {
    var w = result.w, h = result.h;
    var out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '">'];
    var paths = result.paths.filter(function (p) { return !p.hidden && p.subpaths.length; });
    var plain = view === 'outlines' || view === 'outlines-source';
    var sw = Math.max(0.8, Math.max(w, h) / (plain ? 520 : 360));
    var nr = Math.max(1.4, Math.max(w, h) / 210);
    var stroke = plain ? (view === 'outlines-source' ? '#0ea5e9' : '#111827') : '#38bdf8';
    for (var i = 0; i < paths.length; i++) {
      var col = rgbToHex(paths[i].fill[0], paths[i].fill[1], paths[i].fill[2]);
      for (var j = 0; j < paths[i].subpaths.length; j++) {
        var sp = paths[i].subpaths[j];
        var d = 'M' + sp.start[0] + ' ' + sp.start[1];
        var anchors = [sp.start];
        for (var k = 0; k < sp.segs.length; k++) {
          var s = sp.segs[k];
          if (s.c) {
            d += 'C' + s.c[0] + ' ' + s.c[1] + ' ' + s.c[2] + ' ' + s.c[3] + ' ' + s.c[4] + ' ' + s.c[5];
            anchors.push([s.c[4], s.c[5]]);
          } else {
            d += 'L' + s.l[0] + ' ' + s.l[1];
            anchors.push([s.l[0], s.l[1]]);
          }
        }
        if (sp.closed !== false) d += 'Z';
        out.push('<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-opacity="0.95"/>');
        if (plain) continue;
        for (var a = 0; a < anchors.length; a++) {
          out.push('<rect x="' + (anchors[a][0] - nr) + '" y="' + (anchors[a][1] - nr) + '" width="' + (nr * 2) + '" height="' + (nr * 2) + '" fill="#ffffff" stroke="' + col + '" stroke-width="' + (sw * 0.8) + '"/>');
        }
      }
    }
    out.push('</svg>');
    return out.join('');
  }

  function renderStats() {
    var r = root();
    if (!r || !state.result) return;
    var st = state.result.stats;
    if ($('#vsStatPaths', r)) $('#vsStatPaths', r).textContent = toBn(st.paths);
    if ($('#vsStatNodes', r)) $('#vsStatNodes', r).textContent = toBn(st.nodes);
    if ($('#vsStatColors', r)) $('#vsStatColors', r).textContent = toBn(st.colors);
    if ($('#itStatPaths', r)) $('#itStatPaths', r).textContent = toBn(st.subpaths != null ? st.subpaths : st.paths);
    if ($('#itStatAnchors', r)) $('#itStatAnchors', r).textContent = toBn(st.nodes);
    if ($('#itStatColors', r)) $('#itStatColors', r).textContent = toBn(st.colors);
    try {
      if (!state.exports.svg) state.exports.svg = window.TechHatVectorExport.toSvg(state.result, exportOpts());
      if (!state.exports.eps) state.exports.eps = window.TechHatVectorExport.toEps(state.result, exportOpts());
      if (!state.exports.ai) state.exports.ai = window.TechHatVectorExport.toAi(state.result, exportOpts());
      if ($('#vsStatSvg', r)) $('#vsStatSvg', r).textContent = fmtKB(state.exports.svg.length);
      if ($('#vsStatEps', r)) $('#vsStatEps', r).textContent = fmtKB(state.exports.eps.length);
      if ($('#vsStatAi', r)) $('#vsStatAi', r).textContent = fmtKB(state.exports.ai.length);
    } catch (e) { /* non-critical */ }
  }

  /* ============================ PHOTOSHOP VECTOR COLOR LAYERS STACK ============================ */

  function swatchCss(p) {
    var g = p.gradient;
    if (!g || !g.stops || !g.stops.length) return rgbToHex(p.fill[0], p.fill[1], p.fill[2]);
    var stops = g.stops.map(function (s) { return rgbToHex(s.c[0], s.c[1], s.c[2]) + ' ' + Math.round(s.o * 100) + '%'; }).join(', ');
    return g.type === 'radial' ? 'radial-gradient(circle, ' + stops + ')' : 'linear-gradient(90deg, ' + stops + ')';
  }

  function renderPalette() {
    var r = root();
    var item = activeItem();
    if (!r || !item || !state.result) return;
    var list = $('#vsPaletteList', r);
    var countBadge = $('#vsLayerCount', r);
    var paths = state.result.paths || [];
    if (countBadge) countBadge.textContent = toBn(paths.length);
    if (!list) return;

    list.innerHTML = '';
    if (!paths.length) {
      list.innerHTML = '<div class="p-4 text-center text-[11.5px] text-slate-400 dark:text-slate-500">' +
        tr('কোনো ভেক্টর লেয়ার পাওয়া যায়নি', 'No vector layers found') + '</div>';
      return;
    }

    var activeIdx = clamp(item.activeLayerIdx || 0, 0, paths.length - 1);
    item.activeLayerIdx = activeIdx;

    paths.forEach(function (p, i) {
      var isSelected = i === activeIdx;
      var hexv = rgbToHex(p.fill[0], p.fill[1], p.fill[2]);
      var nodes = p.subpaths.reduce(function (s, sp) { return s + (sp.nodes || sp.segs.length); }, 0);
      var row = document.createElement('div');
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      row.setAttribute('data-vs-layer-row', String(i));
      row.className = 'group/lrow flex items-center gap-1.5 px-2 py-1 rounded-[4px] border text-[11.5px] select-none cursor-pointer transition-colors ' +
        (isSelected
          ? 'bg-violet-600/14 dark:bg-[#3d3d46] border-violet-500/60 dark:border-violet-400/50 text-slate-900 dark:text-white font-semibold'
          : 'bg-white dark:bg-[#262626] border-slate-200/80 dark:border-[#1a1a1a] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#303030]') +
        (p.hidden ? ' opacity-50' : '');

      var eyeSvg = p.hidden
        ? '<svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg class="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';

      row.innerHTML =
        '<button type="button" data-vs-act="hide" data-idx="' + i + '" class="w-6 h-6 inline-flex items-center justify-center rounded hover:bg-slate-200/70 dark:hover:bg-white/10 cursor-pointer shrink-0" title="' + (p.hidden ? tr('লেয়ার দেখান', 'Show Layer') : tr('লেয়ার লুকান', 'Hide Layer')) + '">' +
          eyeSvg +
        '</button>' +
        '<label class="relative w-6 h-6 rounded-[3px] border border-slate-300 dark:border-white/25 overflow-hidden shrink-0 cursor-pointer shadow-2xs" style="background:' + swatchCss(p) + '" title="' + tr('লেয়ারের রঙ পরিবর্তন করুন', 'Click to change layer color') + '">' +
          '<input type="color" value="' + hexv + '" data-vs-act="color" data-idx="' + i + '" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer border-0 p-0" />' +
        '</label>' +
        '<div class="min-w-0 flex-1 flex flex-col leading-tight">' +
          '<span class="truncate font-bold text-[11px]">' + tr('লেয়ার ', 'Layer ') + toBn(i + 1) + ' ' + (p.isStroke
            ? '<em class="not-italic px-1 rounded bg-sky-500/15 text-sky-600 dark:text-sky-300 text-[9.5px] font-extrabold uppercase">' + tr('স্ট্রোক ', 'Stroke ') + toBn(p.strokeWidth || 1) + 'px</em>'
            : p.gradient
            ? '<em class="not-italic px-1 rounded bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300 text-[9.5px] font-extrabold uppercase">' + (p.gradient.type === 'radial' ? tr('রেডিয়াল', 'Radial') : tr('লিনিয়ার', 'Linear')) + '</em>'
            : '<code class="font-mono text-[10.5px] opacity-80">' + hexv.toUpperCase() + '</code>') + '</span>' +
          '<small class="text-[10px] text-slate-400 dark:text-slate-400 tabular-nums">' + toBn(p.subpaths.length) + ' ' + tr('পাথ', 'paths') + ' · ' + toBn(nodes) + ' ' + tr('নোড', 'nodes') + '</small>' +
        '</div>' +
        '<div class="inline-flex items-center gap-0.5 shrink-0">' +
          '<button type="button" data-vs-act="merge" data-idx="' + i + '" class="w-5.5 h-5.5 inline-flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-white/15 text-slate-500 dark:text-slate-300 cursor-pointer text-[11px]" title="' + tr('উপরের লেয়ারের সাথে মার্জ করুন', 'Merge into layer above') + '">⇧</button>' +
          '<button type="button" data-vs-act="del" data-idx="' + i + '" class="w-5.5 h-5.5 inline-flex items-center justify-center rounded hover:bg-rose-500/20 text-rose-500 cursor-pointer text-[11px]" title="' + tr('লেয়ার ডিলিট করুন', 'Delete layer') + '">✕</button>' +
        '</div>';

      list.appendChild(row);
    });
  }

  function refreshVectorStatsFromPaths(result) {
    if (!result || !result.paths) return;
    var stats = { paths: 0, subpaths: 0, nodes: 0, colors: 0, pixelWidth: result.w, pixelHeight: result.h };
    var seen = {};
    for (var i = 0; i < result.paths.length; i++) {
      var p = result.paths[i];
      if (p.hidden) continue;
      stats.paths++;
      stats.subpaths += p.subpaths.length;
      for (var s = 0; s < p.subpaths.length; s++) stats.nodes += (p.subpaths[s].nodes || p.subpaths[s].segs.length);
      seen[p.fill.join(',')] = 1;
    }
    stats.colors = Object.keys(seen).length;
    result.stats = stats;
  }

  function performLayerAction(act, idx) {
    var item = activeItem();
    if (!item || !state.result || !state.result.paths.length) return;
    var X = window.TechHatVectorExport;
    if (idx == null || isNaN(idx)) idx = item.activeLayerIdx || 0;
    idx = clamp(idx, 0, state.result.paths.length - 1);

    if (act === 'show-all') {
      state.result.paths.forEach(function (p) { p.hidden = false; });
    } else if (act === 'hide') {
      X.setPathHidden(state.result, idx, !state.result.paths[idx].hidden);
    } else if (act === 'del') {
      X.removePath(state.result, idx);
      item.activeLayerIdx = clamp(idx, 0, Math.max(0, state.result.paths.length - 1));
    } else if (act === 'up') {
      if (X.movePath(state.result, idx, -1)) item.activeLayerIdx = idx - 1;
    } else if (act === 'down') {
      if (X.movePath(state.result, idx, 1)) item.activeLayerIdx = idx + 1;
    } else if (act === 'merge') {
      var target = -1;
      for (var i = idx - 1; i >= 0; i--) {
        if (!state.result.paths[i].hidden) { target = i; break; }
      }
      if (target < 0 && idx + 1 < state.result.paths.length) target = idx + 1;
      if (target < 0) {
        showToast('মার্জ করার জন্য অন্য কোনো লেয়ার নেই', 'No other layer to merge with');
        return;
      }
      X.mergePaths(state.result, [idx], target);
      item.activeLayerIdx = clamp(Math.min(idx, target), 0, Math.max(0, state.result.paths.length - 1));
    }

    refreshVectorStatsFromPaths(state.result);
    item.exports = {};
    state.exports = item.exports;
    renderPreview();
    renderStats();
    renderPalette();
    scheduleProjectAutosave(900);
  }

  function onPaletteClick(e) {
    var actBtn = e.target.closest('[data-vs-act]');
    if (actBtn) {
      var act = actBtn.getAttribute('data-vs-act');
      if (act === 'color') return;
      e.stopPropagation();
      var idx = parseInt(actBtn.getAttribute('data-idx'), 10);
      performLayerAction(act, idx);
      return;
    }
    var row = e.target.closest('[data-vs-layer-row]');
    if (row && activeItem()) {
      activeItem().activeLayerIdx = parseInt(row.getAttribute('data-vs-layer-row'), 10) || 0;
      renderPalette();
    }
  }

  function onPaletteColor(e) {
    var input = e.target.closest('input[data-vs-act="color"]');
    if (!input || !state.result) return;
    var idx = parseInt(input.getAttribute('data-idx'), 10);
    if (!state.result.paths[idx]) return;
    window.TechHatVectorExport.recolorPath(state.result.paths[idx], hexToRgb(input.value));
    refreshVectorStatsFromPaths(state.result);
    if (activeItem()) {
      activeItem().activeLayerIdx = idx;
      activeItem().exports = {};
      state.exports = activeItem().exports;
    }
    renderPreview();
    renderStats();
    renderPalette();
    scheduleProjectAutosave(900);
  }

  /* ============================ FULL-SCREEN PHOTOSHOP RETOUCH & LAYER EDITOR ============================ */

  function enterEditMode() {
    var r = root();
    if (!r || !activeItem()) return;
    state.editing = true;
    r.dataset.editing = 'true';
    if ($('#vsEraserBar', r)) $('#vsEraserBar', r).hidden = false;
    if ($('#vsPsDock', r)) $('#vsPsDock', r).hidden = false;
    syncCanvasToStage();
    updateLayerVisibility();
    selectPsTool(state.psTool || 'brush');
    setTimeout(fitZoom, 30);
    setStatus(
      'ফটোশপ এডিট মোড · ব্রাশ (B), ট্রান্সপারেন্ট ইরেজার (E), ম্যাজিক ওয়ান্ড (W) দিয়ে লোগো পরিষ্কার করে "সেভ ও ভেক্টর ভিউ" চাপুন',
      'Photoshop Edit Mode · Clean logo with Brush (B), Eraser (E), or Magic Wand (W), then click "Save & Vectorize"'
    );
  }

  function exitEditMode(retrace) {
    var r = root();
    if (!r) return;
    commitTextTool();
    state.editing = false;
    r.dataset.editing = 'false';
    if ($('#vsEraserBar', r)) $('#vsEraserBar', r).hidden = true;
    if ($('#vsPsDock', r)) $('#vsPsDock', r).hidden = true;
    if ($('#vsEraserCursor', r)) $('#vsEraserCursor', r).hidden = true;
    if ($('#vsPickerLoupe', r)) $('#vsPickerLoupe', r).hidden = true;
    updateLayerVisibility();
    setTimeout(fitZoom, 30);
    if (retrace !== false && activeItem()) {
      activeItem().thumbUrl = makeThumbUrl(activeItem().workCanvas);
      renderFilmstrip();
      scheduleTrace(0);
    }
  }

  function selectPsTool(toolId) {
    var r = root();
    if (!r) return;
    if (state.psTool === 'text' && toolId !== 'text') commitTextTool();
    state.psTool = toolId;

    // Close any open flyouts
    $$('[data-vs-flyout]', r).forEach(function (f) { f.hidden = true; });

    // Update dock buttons and icons
    $$('[data-vs-group]', r).forEach(function (grp) {
      var btn = $('[data-vs-group-btn]', grp);
      var toolItem = $('[data-vs-tool="' + toolId + '"]', grp);
      var icons = $$('[data-vs-icon-for]', grp);
      var hasDirect = icons.some(function (ic) { return ic.getAttribute('data-vs-icon-for') === toolId; });

      if (hasDirect || toolItem) {
        if (btn) {
          btn.setAttribute('aria-pressed', 'true');
          btn.setAttribute('data-vs-cur', toolId);
        }
        icons.forEach(function (ic) {
          ic.hidden = ic.getAttribute('data-vs-icon-for') !== toolId;
        });
      } else if (btn) {
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    $$('[data-vs-fly-check]', r).forEach(function (chk) {
      chk.style.visibility = chk.getAttribute('data-vs-fly-check') === toolId ? 'visible' : 'hidden';
    });

    // Update active tool badge in #vsEraserBar
    var lbl = $('#vsPsActiveToolLabel b', r);
    if (lbl) lbl.textContent = PS_TOOL_NAMES[toolId] || toolId;
    var activeIconSpan = $('[data-vs-icon-for="' + toolId + '"]', r);
    var topIcon = $('#vsPsActiveToolIcon', r);
    if (topIcon && activeIconSpan) topIcon.innerHTML = activeIconSpan.innerHTML;

    // Toggle contextual options groups in #vsEraserBar
    $$('#vsEraserBar [data-vs-opts]', r).forEach(function (el) {
      var list = (el.getAttribute('data-vs-opts') || '').split(/\s+/);
      el.hidden = list.indexOf(toolId) < 0;
    });

    // Update viewport cursor
    var vp = $('#vsViewport', r);
    if (vp) {
      if (toolId === 'hand' || toolId === 'move') vp.style.cursor = 'grab';
      else if (toolId === 'zoom') vp.style.cursor = 'zoom-in';
      else if (toolId === 'text') vp.style.cursor = 'text';
      else vp.style.cursor = 'crosshair';
    }
  }

  function canvasCoordsFromEvent(e) {
    var r = root();
    var c = $('#vsSrcCanvas', r);
    if (!c) return { x: 0, y: 0, inside: false };
    var rect = c.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 0, y: 0, inside: false };
    var x = ((e.clientX - rect.left) / rect.width) * c.width;
    var y = ((e.clientY - rect.top) / rect.height) * c.height;
    var inside = x >= 0 && y >= 0 && x <= c.width && y <= c.height;
    return {
      x: clamp(x, 0, c.width - 1),
      y: clamp(y, 0, c.height - 1),
      rawX: x,
      rawY: y,
      inside: inside
    };
  }

  /* ---- Selection Mask Helpers (Marquee & Lasso) ---- */

  function ensureSelectionMask(w, h) {
    if (!state.selection || state.selection.w !== w || state.selection.h !== h) {
      state.selection = { w: w, h: h, mask: new Uint8Array(w * h) };
    }
    return state.selection;
  }

  function clearSelection() {
    state.selection = null;
    state.polyPoints = [];
    var r = root();
    if (!r) return;
    var ov = $('#vsSelOverlay', r);
    if (ov) ov.hidden = true;
  }

  function renderSelectionMarchingAnts() {
    var r = root();
    if (!r) return;
    var ov = $('#vsSelOverlay', r);
    var pathA = $('#vsSelPathA', r);
    var pathB = $('#vsSelPathB', r);
    if (!ov || !pathA || !pathB) return;

    if (!state.selection) {
      ov.hidden = true;
      return;
    }

    var w = state.selection.w, h = state.selection.h;
    var mask = state.selection.mask;
    var any = false;
    var segs = [];
    // Trace horizontal & vertical boundary edges of selection mask (step by max(1, floor(max/250)) for fast SVG)
    var step = Math.max(1, Math.floor(Math.max(w, h) / 300));
    for (var y = 0; y < h; y += step) {
      for (var x = 0; x < w; x += step) {
        var cur = mask[y * w + x] ? 1 : 0;
        if (cur) any = true;
        var right = (x + step < w) ? (mask[y * w + (x + step)] ? 1 : 0) : 0;
        var down = (y + step < h) ? (mask[(y + step) * w + x] ? 1 : 0) : 0;
        if (cur !== right) {
          var sx = ((x + step) / w) * 1000;
          segs.push('M' + sx.toFixed(1) + ' ' + ((y / h) * 1000).toFixed(1) + 'L' + sx.toFixed(1) + ' ' + (((y + step) / h) * 1000).toFixed(1));
        }
        if (cur !== down) {
          var sy = ((y + step) / h) * 1000;
          segs.push('M' + ((x / w) * 1000).toFixed(1) + ' ' + sy.toFixed(1) + 'L' + (((x + step) / w) * 1000).toFixed(1) + ' ' + sy.toFixed(1));
        }
      }
    }

    if (!any) {
      state.selection = null;
      ov.hidden = true;
      return;
    }

    var d = segs.join('');
    pathA.setAttribute('d', d);
    pathB.setAttribute('d', d);
    ov.hidden = false;
  }

  function applyShapeToSelection(shapeMask, w, h, mode) {
    var sel = ensureSelectionMask(w, h);
    var m = sel.mask;
    var op = mode || state.selMode || 'new';
    for (var i = 0; i < m.length; i++) {
      var s = shapeMask[i] ? 1 : 0;
      if (op === 'new') m[i] = s;
      else if (op === 'add') m[i] = (m[i] || s) ? 1 : 0;
      else if (op === 'sub') m[i] = (m[i] && !s) ? 1 : 0;
      else if (op === 'int') m[i] = (m[i] && s) ? 1 : 0;
    }
    renderSelectionMarchingAnts();
  }

  function handleSelectionCommand(cmd) {
    var item = activeItem();
    if (!item || !item.workCanvas) return;
    var w = item.workCanvas.width, h = item.workCanvas.height;
    if (cmd === 'all') {
      var sel = ensureSelectionMask(w, h);
      sel.mask.fill(1);
      renderSelectionMarchingAnts();
    } else if (cmd === 'deselect') {
      clearSelection();
    } else if (cmd === 'invert') {
      var sel2 = ensureSelectionMask(w, h);
      for (var i = 0; i < sel2.mask.length; i++) sel2.mask[i] = sel2.mask[i] ? 0 : 1;
      renderSelectionMarchingAnts();
    } else if (cmd === 'clear') {
      if (!state.selection) {
        showToast('প্রথমে Marquee বা Lasso দিয়ে অংশ সিলেক্ট করুন', 'Select an area first with Marquee or Lasso');
        return;
      }
      pushUndo(item);
      var ctx = item.workCanvas.getContext('2d', { willReadFrequently: true });
      var imgData = ctx.getImageData(0, 0, w, h);
      var d = imgData.data;
      var mask = state.selection.mask;
      for (var p = 0; p < mask.length; p++) {
        if (mask[p]) d[p * 4 + 3] = 0;
      }
      ctx.putImageData(imgData, 0, 0);
      syncCanvasToStage();
      showToast('সিলেক্ট করা অংশ স্বচ্ছ (Transparent) করা হয়েছে', 'Selected area erased to transparent');
    } else if (cmd === 'fill') {
      if (!state.selection) {
        showToast('প্রথমে Marquee বা Lasso দিয়ে অংশ সিলেক্ট করুন', 'Select an area first with Marquee or Lasso');
        return;
      }
      pushUndo(item);
      var rgb = hexToRgb(($('#vsEraserColor', root()) || {}).value || '#000000');
      var ctx2 = item.workCanvas.getContext('2d', { willReadFrequently: true });
      var imgData2 = ctx2.getImageData(0, 0, w, h);
      var d2 = imgData2.data;
      var mask2 = state.selection.mask;
      for (var p2 = 0; p2 < mask2.length; p2++) {
        if (mask2[p2]) {
          var o = p2 * 4;
          d2[o] = rgb[0];
          d2[o + 1] = rgb[1];
          d2[o + 2] = rgb[2];
          d2[o + 3] = 255;
        }
      }
      ctx2.putImageData(imgData2, 0, 0);
      syncCanvasToStage();
      showToast('রঙ দিয়ে ফিল করা হয়েছে', 'Filled selection with color');
    }
  }

  /* ---- Magic Wand Background Eraser (1-Click Flood / Global Erase to Transparent) ---- */

  function magicWandEraseAt(cx, cy) {
    var item = activeItem();
    var r = root();
    if (!item || !item.workCanvas || !r) return;
    var c = item.workCanvas;
    var w = c.width, h = c.height;
    var sx = clamp(Math.floor(cx), 0, w - 1);
    var sy = clamp(Math.floor(cy), 0, h - 1);

    var ctx = c.getContext('2d', { willReadFrequently: true });
    var imgData = ctx.getImageData(0, 0, w, h);
    var d = imgData.data;
    var seedIdx = (sy * w + sx) * 4;
    var sr = d[seedIdx], sg = d[seedIdx + 1], sb = d[seedIdx + 2], sa = d[seedIdx + 3];
    if (sa === 0) {
      showToast('এই অংশটি ইতিমধ্যে স্বচ্ছ (Transparent)', 'This pixel is already transparent');
      return;
    }

    pushUndo(item);
    var tol = (parseInt(($('#vsWandTolerance', r) || {}).value, 10) || 28) * 2.55;
    var contiguous = $('#vsWandContiguous', r) ? $('#vsWandContiguous', r).checked : true;
    var erased = 0;

    var distAt = function (p) {
      var o = p * 4;
      if (d[o + 3] === 0) return 9999;
      var dr = d[o] - sr, dg = d[o + 1] - sg, db = d[o + 2] - sb;
      return Math.sqrt((dr * dr + dg * dg + db * db) / 3);
    };

    if (contiguous) {
      var visited = new Uint8Array(w * h);
      var q = new Int32Array(w * h);
      var head = 0, tail = 0;
      var startP = sy * w + sx;
      visited[startP] = 1;
      q[tail++] = startP;

      while (head < tail) {
        var cur = q[head++];
        var dist = distAt(cur);
        if (dist <= tol) {
          d[cur * 4 + 3] = 0;
          erased++;
          var x = cur % w, y = (cur - x) / w;
          if (x > 0 && !visited[cur - 1]) { visited[cur - 1] = 1; q[tail++] = cur - 1; }
          if (x + 1 < w && !visited[cur + 1]) { visited[cur + 1] = 1; q[tail++] = cur + 1; }
          if (y > 0 && !visited[cur - w]) { visited[cur - w] = 1; q[tail++] = cur - w; }
          if (y + 1 < h && !visited[cur + w]) { visited[cur + w] = 1; q[tail++] = cur + w; }
        } else if (dist <= tol + 18) {
          // Feather border pixel alpha for smooth logo edge
          var factor = (dist - tol) / 18;
          d[cur * 4 + 3] = Math.round(d[cur * 4 + 3] * factor);
        }
      }
    } else {
      for (var p = 0; p < w * h; p++) {
        var dist2 = distAt(p);
        if (dist2 <= tol) {
          d[p * 4 + 3] = 0;
          erased++;
        } else if (dist2 <= tol + 18) {
          d[p * 4 + 3] = Math.round(d[p * 4 + 3] * ((dist2 - tol) / 18));
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    syncCanvasToStage();
    showToast(
      'ম্যাজিক ওয়ান্ড: ' + toBn(erased) + ' পিক্সেল ব্যাকগ্রাউন্ড স্বচ্ছ করা হয়েছে',
      'Magic Wand: Erased ' + erased + ' background pixels to transparent'
    );
  }

  /* ---- Brush, Transparent Eraser, Heal, Clone, Dodge & Burn ---- */

  function paintDab(x, y, tool) {
    var item = activeItem();
    var r = root();
    if (!item || !item.workCanvas || !r) return;
    var c = item.workCanvas;
    var w = c.width, h = c.height;
    var ctx = c.getContext('2d', { willReadFrequently: true });

    var size = parseInt(($('#vsBrushSize', r) || {}).value, 10) || 24;
    var hardness = (parseInt(($('#vsBrushHardness', r) || {}).value, 10) || 85) / 100;
    var opacity = (parseInt(($('#vsBrushOpacity', r) || {}).value, 10) || 100) / 100;
    var rad = Math.max(1, size / 2);

    if (tool === 'brush' || tool === 'eraser') {
      ctx.save();
      var x0 = Math.max(0, Math.floor(x - rad - 2));
      var y0 = Math.max(0, Math.floor(y - rad - 2));
      var x1 = Math.min(w - 1, Math.ceil(x + rad + 2));
      var y1 = Math.min(h - 1, Math.ceil(y + rad + 2));
      var bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      if (bw <= 0 || bh <= 0) { ctx.restore(); return; }

      var imgData = ctx.getImageData(x0, y0, bw, bh);
      var d = imgData.data;
      var rgb = hexToRgb(($('#vsEraserColor', r) || {}).value || '#000000');
      var selMask = state.selection && state.selection.w === w ? state.selection.mask : null;

      for (var py = y0; py <= y1; py++) {
        for (var px = x0; px <= x1; px++) {
          if (selMask && !selMask[py * w + px]) continue;
          var dist = Math.hypot(px - x, py - y);
          if (dist > rad) continue;
          var norm = dist / rad;
          var falloff = norm <= hardness ? 1 : 1 - (norm - hardness) / Math.max(0.01, 1 - hardness);
          var strength = clamp(falloff * opacity, 0, 1);
          var o = ((py - y0) * bw + (px - x0)) * 4;

          if (tool === 'eraser') {
            d[o + 3] = Math.round(d[o + 3] * (1 - strength));
          } else {
            var outA = strength + (d[o + 3] / 255) * (1 - strength);
            if (outA > 0) {
              d[o] = Math.round((rgb[0] * strength + d[o] * (d[o + 3] / 255) * (1 - strength)) / outA);
              d[o + 1] = Math.round((rgb[1] * strength + d[o + 1] * (d[o + 3] / 255) * (1 - strength)) / outA);
              d[o + 2] = Math.round((rgb[2] * strength + d[o + 2] * (d[o + 3] / 255) * (1 - strength)) / outA);
              d[o + 3] = Math.round(outA * 255);
            }
          }
        }
      }
      ctx.putImageData(imgData, x0, y0);
      ctx.restore();
      return;
    }

    if (tool === 'dodge' || tool === 'burn' || tool === 'heal' || tool === 'clone') {
      var x0b = Math.max(0, Math.floor(x - rad - 1));
      var y0b = Math.max(0, Math.floor(y - rad - 1));
      var x1b = Math.min(w - 1, Math.ceil(x + rad + 1));
      var y1b = Math.min(h - 1, Math.ceil(y + rad + 1));
      var bwb = x1b - x0b + 1, bhb = y1b - y0b + 1;
      if (bwb <= 0 || bhb <= 0) return;
      var fullData = ctx.getImageData(0, 0, w, h);
      var fd = fullData.data;

      // For Spot Heal, compute ring average around dab
      var healR = 255, healG = 255, healB = 255, healA = 255, healCnt = 0;
      if (tool === 'heal') {
        for (var a = 0; a < 16; a++) {
          var ang = (a / 16) * Math.PI * 2;
          var rx = clamp(Math.round(x + Math.cos(ang) * (rad + 2)), 0, w - 1);
          var ry = clamp(Math.round(y + Math.sin(ang) * (rad + 2)), 0, h - 1);
          var ro = (ry * w + rx) * 4;
          healR += fd[ro]; healG += fd[ro + 1]; healB += fd[ro + 2]; healA += fd[ro + 3];
          healCnt++;
        }
        if (healCnt > 0) {
          healR /= (healCnt + 1); healG /= (healCnt + 1); healB /= (healCnt + 1); healA /= (healCnt + 1);
        }
      }

      for (var py2 = y0b; py2 <= y1b; py2++) {
        for (var px2 = x0b; px2 <= x1b; px2++) {
          var dist2 = Math.hypot(px2 - x, py2 - y);
          if (dist2 > rad) continue;
          var str = (1 - (dist2 / rad) * (1 - hardness)) * opacity;
          var idx2 = (py2 * w + px2) * 4;

          if (tool === 'dodge') {
            fd[idx2] = clamp(fd[idx2] + Math.round(28 * str), 0, 255);
            fd[idx2 + 1] = clamp(fd[idx2 + 1] + Math.round(28 * str), 0, 255);
            fd[idx2 + 2] = clamp(fd[idx2 + 2] + Math.round(28 * str), 0, 255);
          } else if (tool === 'burn') {
            fd[idx2] = clamp(fd[idx2] - Math.round(28 * str), 0, 255);
            fd[idx2 + 1] = clamp(fd[idx2 + 1] - Math.round(28 * str), 0, 255);
            fd[idx2 + 2] = clamp(fd[idx2 + 2] - Math.round(28 * str), 0, 255);
          } else if (tool === 'heal') {
            fd[idx2] = Math.round(fd[idx2] * (1 - str * 0.65) + healR * (str * 0.65));
            fd[idx2 + 1] = Math.round(fd[idx2 + 1] * (1 - str * 0.65) + healG * (str * 0.65));
            fd[idx2 + 2] = Math.round(fd[idx2 + 2] * (1 - str * 0.65) + healB * (str * 0.65));
          } else if (tool === 'clone' && state.cloneOffset) {
            var sx2 = clamp(Math.round(px2 + state.cloneOffset.dx), 0, w - 1);
            var sy2 = clamp(Math.round(py2 + state.cloneOffset.dy), 0, h - 1);
            var sIdx = (sy2 * w + sx2) * 4;
            fd[idx2] = Math.round(fd[idx2] * (1 - str) + fd[sIdx] * str);
            fd[idx2 + 1] = Math.round(fd[idx2 + 1] * (1 - str) + fd[sIdx + 1] * str);
            fd[idx2 + 2] = Math.round(fd[idx2 + 2] * (1 - str) + fd[sIdx + 2] * str);
            fd[idx2 + 3] = Math.round(fd[idx2 + 3] * (1 - str) + fd[sIdx + 3] * str);
          }
        }
      }
      ctx.putImageData(fullData, 0, 0);
    }
  }

  function paintLine(x0, y0, x1, y1, tool) {
    var r = root();
    var size = parseInt(($('#vsBrushSize', r) || {}).value, 10) || 24;
    var step = Math.max(1, size * 0.22);
    var dist = Math.hypot(x1 - x0, y1 - y0);
    var steps = Math.max(1, Math.ceil(dist / step));
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      paintDab(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, tool);
    }
    syncCanvasToStage();
  }

  /* ---- Horizontal Type Tool ---- */

  function openTextToolAt(cx, cy) {
    var r = root();
    var ed = $('#vsTextEditor', r);
    var act = $('#vsTxtEditActions', r);
    var c = $('#vsSrcCanvas', r);
    if (!ed || !c) return;
    commitTextTool();
    state.txtPos = { x: cx, y: cy };
    var size = parseInt(($('#vsTxtSize', r) || {}).value, 10) || 36;
    var font = ($('#vsTxtFont', r) || {}).value || 'Kalpurush';
    var col = ($('#vsTxtColor', r) || {}).value || '#111111';

    ed.style.left = ((cx / c.width) * 100) + '%';
    ed.style.top = ((cy / c.height) * 100) + '%';
    ed.style.fontFamily = '"' + font + '", sans-serif';
    ed.style.fontSize = Math.max(14, size) + 'px';
    ed.style.fontWeight = state.txtBold ? 'bold' : 'normal';
    ed.style.fontStyle = state.txtItalic ? 'italic' : 'normal';
    ed.style.textAlign = state.txtAlign || 'left';
    ed.style.color = col;
    ed.value = '';
    ed.hidden = false;
    if (act) act.hidden = false;
    setTimeout(function () { ed.focus(); }, 20);
  }

  function commitTextTool() {
    var r = root();
    var item = activeItem();
    if (!r) return;
    var ed = $('#vsTextEditor', r);
    var act = $('#vsTxtEditActions', r);
    if (!ed || ed.hidden) return;
    var text = ed.value;
    ed.hidden = true;
    if (act) act.hidden = true;
    if (!text || !text.trim() || !item || !state.txtPos) return;

    pushUndo(item);
    var ctx = item.workCanvas.getContext('2d');
    var size = parseInt(($('#vsTxtSize', r) || {}).value, 10) || 36;
    var font = ($('#vsTxtFont', r) || {}).value || 'Kalpurush';
    var col = ($('#vsTxtColor', r) || {}).value || '#111111';
    ctx.save();
    ctx.font = (state.txtItalic ? 'italic ' : '') + (state.txtBold ? 'bold ' : '') + size + 'px "' + font + '", sans-serif';
    ctx.fillStyle = col;
    ctx.textBaseline = 'top';
    ctx.textAlign = state.txtAlign || 'left';
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], state.txtPos.x, state.txtPos.y + i * (size * 1.2));
    }
    ctx.restore();
    state.txtPos = null;
    syncCanvasToStage();
  }

  function cancelTextTool() {
    var r = root();
    if (!r) return;
    var ed = $('#vsTextEditor', r);
    var act = $('#vsTxtEditActions', r);
    if (ed) { ed.value = ''; ed.hidden = true; }
    if (act) act.hidden = true;
    state.txtPos = null;
  }

  /* ============================ STAGE POINTER INTERACTIONS ============================ */

  function installStageInteractions() {
    var r = root();
    if (!r) return;
    var vp = $('#vsViewport', r);
    var split = $('#vsSplit', r);
    var handle = $('#vsSplitHandle', r);
    var vecImg = $('#vsVecImg', r);

    if (split) {
      split.addEventListener('input', function () { positionSplit(); });
    }

    // Draggable Split Divider Handle on Viewport
    if (handle && vp) {
      var splitDragging = false;
      handle.addEventListener('pointerdown', function (e) {
        e.stopPropagation();
        splitDragging = true;
        handle.setPointerCapture(e.pointerId);
      });
      handle.addEventListener('pointermove', function (e) {
        if (!splitDragging) return;
        setSplitFromClientX(e.clientX);
      });
      ['pointerup', 'pointercancel'].forEach(function (ev) {
        handle.addEventListener(ev, function () { splitDragging = false; });
      });
      window.addEventListener('resize', function () { if (state.view === 'split') positionSplit(); });
      if (window.ResizeObserver) new ResizeObserver(function () { if (state.view === 'split') positionSplit(); }).observe(vp);
    }
    void vecImg;

    if (!vp) return;

    // Wheel zoom around cursor
    vp.addEventListener('wheel', function (e) {
      if (!activeItem()) return;
      e.preventDefault();
      var old = state.zoom;
      var factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      state.zoom = clamp(state.zoom * factor, 0.2, 24);
      if (old !== state.zoom) {
        var rect = vp.getBoundingClientRect();
        var cx = e.clientX - rect.left - rect.width / 2;
        var cy = e.clientY - rect.top - rect.height / 2;
        var k = state.zoom / old - 1;
        state.panX -= cx * k;
        state.panY -= cy * k;
        applyTransform();
      }
    }, { passive: false });

    // PointerDown / Move / Up for Panning & Photoshop Tools
    var panning = false, lastClientX = 0, lastClientY = 0;
    var painting = false, lastCanvasX = 0, lastCanvasY = 0;
    var selDragStart = null, lassoPoints = [];

    vp.addEventListener('pointermove', function (e) {
      var item = activeItem();
      if (!item) return;

      // Update Brush/Eraser cursor or Eyedropper Loupe in edit mode
      if (state.editing) {
        var pt = canvasCoordsFromEvent(e);
        var curEl = $('#vsEraserCursor', r);
        var loupe = $('#vsPickerLoupe', r);
        var brushTools = ['brush', 'eraser', 'heal', 'clone', 'dodge', 'burn'];

        if (curEl) {
          if (brushTools.indexOf(state.psTool) >= 0 && pt.inside) {
            var bSize = parseInt(($('#vsBrushSize', r) || {}).value, 10) || 24;
            curEl.style.width = bSize + 'px';
            curEl.style.height = bSize + 'px';
            curEl.style.left = ((pt.x / item.workCanvas.width) * 100) + '%';
            curEl.style.top = ((pt.y / item.workCanvas.height) * 100) + '%';
            curEl.hidden = false;
          } else {
            curEl.hidden = true;
          }
        }

        if (loupe) {
          if (state.psTool === 'picker' && pt.inside) {
            var pCtx = item.workCanvas.getContext('2d', { willReadFrequently: true });
            var px = pCtx.getImageData(Math.floor(pt.x), Math.floor(pt.y), 1, 1).data;
            var hex = rgbToHex(px[0], px[1], px[2]).toUpperCase();
            loupe.style.left = ((pt.x / item.workCanvas.width) * 100) + '%';
            loupe.style.top = ((pt.y / item.workCanvas.height) * 100) + '%';
            if ($('#vsPickerLoupeSwatch', r)) $('#vsPickerLoupeSwatch', r).style.background = hex;
            if ($('#vsPickerLoupeHex', r)) $('#vsPickerLoupeHex', r).textContent = hex;
            loupe.hidden = false;
          } else {
            loupe.hidden = true;
          }
        }
      }

      if (panning) {
        state.panX += e.clientX - lastClientX;
        state.panY += e.clientY - lastClientY;
        lastClientX = e.clientX;
        lastClientY = e.clientY;
        applyTransform();
        return;
      }

      if (painting && state.editing) {
        var cPt = canvasCoordsFromEvent(e);
        paintLine(lastCanvasX, lastCanvasY, cPt.x, cPt.y, state.psTool);
        lastCanvasX = cPt.x;
        lastCanvasY = cPt.y;
        return;
      }

      if (selDragStart && state.editing) {
        var sPt = canvasCoordsFromEvent(e);
        if (state.psTool === 'lasso') {
          lassoPoints.push([sPt.x, sPt.y]);
        }
        // Live preview path on #vsSelOverlay
        var ov = $('#vsSelOverlay', r);
        var pA = $('#vsSelPathA', r);
        var pB = $('#vsSelPathB', r);
        if (ov && pA && pB) {
          var w = item.workCanvas.width, h = item.workCanvas.height;
          var d = '';
          if (state.psTool === 'marquee-rect') {
            var x0 = (Math.min(selDragStart.x, sPt.x) / w) * 1000;
            var y0 = (Math.min(selDragStart.y, sPt.y) / h) * 1000;
            var x1 = (Math.max(selDragStart.x, sPt.x) / w) * 1000;
            var y1 = (Math.max(selDragStart.y, sPt.y) / h) * 1000;
            d = 'M' + x0 + ' ' + y0 + 'L' + x1 + ' ' + y0 + 'L' + x1 + ' ' + y1 + 'L' + x0 + ' ' + y1 + 'Z';
          } else if (state.psTool === 'marquee-ellipse') {
            var cx = ((selDragStart.x + sPt.x) * 0.5 / w) * 1000;
            var cy = ((selDragStart.y + sPt.y) * 0.5 / h) * 1000;
            var rx = (Math.abs(sPt.x - selDragStart.x) * 0.5 / w) * 1000;
            var ry = (Math.abs(sPt.y - selDragStart.y) * 0.5 / h) * 1000;
            d = 'M' + (cx - rx) + ' ' + cy + 'A' + rx + ' ' + ry + ' 0 1 0 ' + (cx + rx) + ' ' + cy + 'A' + rx + ' ' + ry + ' 0 1 0 ' + (cx - rx) + ' ' + cy + 'Z';
          } else if (state.psTool === 'lasso' && lassoPoints.length > 1) {
            d = lassoPoints.map(function (pt2, idx) {
              return (idx === 0 ? 'M' : 'L') + ((pt2[0] / w) * 1000).toFixed(1) + ' ' + ((pt2[1] / h) * 1000).toFixed(1);
            }).join('') + 'Z';
          }
          if (d) {
            pA.setAttribute('d', d);
            pB.setAttribute('d', d);
            ov.hidden = false;
          }
        }
      }
    });

    vp.addEventListener('pointerdown', function (e) {
      var item = activeItem();
      if (!item || e.target.closest('#vsSplitHandle') || e.target.closest('#vsTextEditor')) return;

      // In normal studio preview mode or when Hand/Move tool is selected, pan the canvas
      if (!state.editing || state.psTool === 'hand' || state.psTool === 'move' || e.button === 1) {
        panning = true;
        lastClientX = e.clientX;
        lastClientY = e.clientY;
        vp.setPointerCapture(e.pointerId);
        vp.style.cursor = 'grabbing';
        return;
      }

      var pt = canvasCoordsFromEvent(e);
      if (!pt.inside) return;

      if (state.psTool === 'zoom') {
        var factor = e.altKey ? 1 / 1.25 : 1.25;
        state.zoom = clamp(state.zoom * factor, 0.2, 24);
        applyTransform();
        return;
      }

      if (state.psTool === 'wand') {
        magicWandEraseAt(pt.x, pt.y);
        return;
      }

      if (state.psTool === 'picker') {
        var ctx = item.workCanvas.getContext('2d', { willReadFrequently: true });
        var px = ctx.getImageData(Math.floor(pt.x), Math.floor(pt.y), 1, 1).data;
        var hex = rgbToHex(px[0], px[1], px[2]);
        if ($('#vsPickerSwatch', r)) $('#vsPickerSwatch', r).style.background = hex;
        if ($('#vsPickerHex', r)) $('#vsPickerHex', r).textContent = hex.toUpperCase();
        if ($('#vsEraserColor', r)) $('#vsEraserColor', r).value = hex;
        if ($('#vsEraserColorChip', r)) $('#vsEraserColorChip', r).style.background = hex;
        if ($('#vsDockColor', r)) $('#vsDockColor', r).value = hex;
        if ($('#vsDockSwatch', r)) $('#vsDockSwatch', r).style.background = hex;
        showToast('রঙ পিক করা হয়েছে: ' + hex.toUpperCase(), 'Picked color: ' + hex.toUpperCase());
        return;
      }

      if (state.psTool === 'text') {
        openTextToolAt(pt.x, pt.y);
        return;
      }

      if (state.psTool === 'clone' && e.altKey) {
        state.cloneSrc = { x: pt.x, y: pt.y };
        var mark = $('#vsCloneSrcMark', r);
        if (mark) {
          mark.style.left = ((pt.x / item.workCanvas.width) * 100) + '%';
          mark.style.top = ((pt.y / item.workCanvas.height) * 100) + '%';
          mark.hidden = false;
        }
        if ($('#vsCloneSrcInfo', r)) $('#vsCloneSrcInfo', r).textContent = 'Source: ' + Math.round(pt.x) + ',' + Math.round(pt.y);
        showToast('ক্লোন সোর্স সেট করা হয়েছে', 'Clone source point set');
        return;
      }

      if (['brush', 'eraser', 'heal', 'clone', 'dodge', 'burn'].indexOf(state.psTool) >= 0) {
        if (state.psTool === 'clone') {
          if (!state.cloneSrc) {
            showToast('প্রথমে Alt + ক্লিক করে ক্লোন সোর্স সেট করুন', 'Alt + Click on canvas first to set Clone Source');
            return;
          }
          state.cloneOffset = { dx: state.cloneSrc.x - pt.x, dy: state.cloneSrc.y - pt.y };
        }
        pushUndo(item);
        painting = true;
        lastCanvasX = pt.x;
        lastCanvasY = pt.y;
        vp.setPointerCapture(e.pointerId);
        paintDab(pt.x, pt.y, state.psTool);
        syncCanvasToStage();
        return;
      }

      if (['marquee-rect', 'marquee-ellipse', 'lasso'].indexOf(state.psTool) >= 0) {
        selDragStart = { x: pt.x, y: pt.y };
        lassoPoints = [[pt.x, pt.y]];
        vp.setPointerCapture(e.pointerId);
        return;
      }

      if (state.psTool === 'lasso-poly') {
        state.polyPoints.push([pt.x, pt.y]);
        if (state.polyPoints.length >= 3) {
          var first = state.polyPoints[0];
          if (Math.hypot(pt.x - first[0], pt.y - first[1]) < 12 || e.detail >= 2) {
            finalizePolygonSelection(state.polyPoints);
            state.polyPoints = [];
          }
        }
      }
    });

    ['pointerup', 'pointercancel'].forEach(function (ev) {
      vp.addEventListener(ev, function (e) {
        if (panning) {
          panning = false;
          vp.style.cursor = 'grab';
        }
        if (painting) {
          painting = false;
        }
        if (selDragStart && activeItem()) {
          var pt = canvasCoordsFromEvent(e);
          var w = activeItem().workCanvas.width, h = activeItem().workCanvas.height;
          var shape = new Uint8Array(w * h);
          if (state.psTool === 'marquee-rect') {
            var x0 = Math.floor(Math.min(selDragStart.x, pt.x));
            var y0 = Math.floor(Math.min(selDragStart.y, pt.y));
            var x1 = Math.ceil(Math.max(selDragStart.x, pt.x));
            var y1 = Math.ceil(Math.max(selDragStart.y, pt.y));
            for (var y = y0; y < y1; y++) {
              for (var x = x0; x < x1; x++) shape[y * w + x] = 1;
            }
            applyShapeToSelection(shape, w, h, state.selMode);
          } else if (state.psTool === 'marquee-ellipse') {
            var cx = (selDragStart.x + pt.x) * 0.5;
            var cy = (selDragStart.y + pt.y) * 0.5;
            var rx = Math.max(1, Math.abs(pt.x - selDragStart.x) * 0.5);
            var ry = Math.max(1, Math.abs(pt.y - selDragStart.y) * 0.5);
            for (var y2 = 0; y2 < h; y2++) {
              for (var x2 = 0; x2 < w; x2++) {
                var dx = (x2 - cx) / rx, dy = (y2 - cy) / ry;
                if (dx * dx + dy * dy <= 1) shape[y2 * w + x2] = 1;
              }
            }
            applyShapeToSelection(shape, w, h, state.selMode);
          } else if (state.psTool === 'lasso' && lassoPoints.length >= 3) {
            finalizePolygonSelection(lassoPoints);
          }
          selDragStart = null;
          lassoPoints = [];
        }
      });
    });
  }

  function finalizePolygonSelection(pts) {
    var item = activeItem();
    if (!item || !pts || pts.length < 3) return;
    var w = item.workCanvas.width, h = item.workCanvas.height;
    var tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    var tctx = tmp.getContext('2d');
    tctx.fillStyle = '#ffffff';
    tctx.beginPath();
    tctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) tctx.lineTo(pts[i][0], pts[i][1]);
    tctx.closePath();
    tctx.fill();
    var d = tctx.getImageData(0, 0, w, h).data;
    var shape = new Uint8Array(w * h);
    for (var p = 0; p < w * h; p++) if (d[p * 4 + 3] > 127) shape[p] = 1;
    applyShapeToSelection(shape, w, h, state.selMode);
  }

  /* ============================ CAMERA CAPTURE ============================ */

  function openCameraDialog() {
    var r = root();
    var dlg = $('#vsCameraDialog', r);
    var video = $('#vsVideo', r);
    if (!dlg || !video || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if ($('#vsCameraFallback', r)) $('#vsCameraFallback', r).click();
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: state.camFacing, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then(function (stream) {
        state.camStream = stream;
        video.srcObject = stream;
        if (dlg.showModal) dlg.showModal();
        else dlg.setAttribute('open', '');
      })
      .catch(function () {
        if ($('#vsCameraFallback', r)) $('#vsCameraFallback', r).click();
      });
  }

  function closeCameraDialog() {
    var r = root();
    var dlg = $('#vsCameraDialog', r);
    var video = $('#vsVideo', r);
    if (state.camStream) {
      state.camStream.getTracks().forEach(function (t) { t.stop(); });
      state.camStream = null;
    }
    if (video) video.srcObject = null;
    if (dlg) {
      if (dlg.close) dlg.close();
      else dlg.removeAttribute('open');
    }
  }

  function captureFromCamera() {
    var r = root();
    var video = $('#vsVideo', r);
    if (!video || !video.videoWidth) return;
    var c = document.createElement('canvas');
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext('2d').drawImage(video, 0, 0);
    closeCameraDialog();
    addCanvasItem(c, 'camera-logo-' + (state.itemSeq + 1));
  }

  /* ============================ EXPORT (SVG, EPS, AI, TRANSPARENT PNG) ============================ */

  function exportOpts() {
    var r = root();
    var customName = ($('#vsFilename', r) && $('#vsFilename', r).value.trim()) || state.imgName || 'TechHat-vector-logo';
    return {
      title: customName,
      colorSpace: ($('#vsCmyk', r) && $('#vsCmyk', r).checked) ? 'cmyk' : 'rgb'
    };
  }

  function exportFileBaseName() {
    var r = root();
    var v = ($('#vsFilename', r) && $('#vsFilename', r).value.trim()) || state.imgName || 'TechHat-vector-logo';
    return v.replace(/\.[^.]+$/, '');
  }

  function exportBlob(fmt) {
    var item = activeItem();
    if (!item || !state.result) {
      showToast('প্রথমে একটি লোগো বা ছবি আপলোড করুন', 'Please upload a logo or image first');
      return;
    }
    var base = exportFileBaseName();

    if (fmt === 'png') {
      ensureCore().then(function () {
        var svgText = window.TechHatVectorExport.toSvg(state.result, exportOpts());
        var svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
        var url = URL.createObjectURL(svgBlob);
        var img = new Image();
        img.onload = function () {
          URL.revokeObjectURL(url);
          var minSide = Math.max(state.result.w, state.result.h);
          var mult = minSide < 1024 ? Math.ceil(1024 / Math.max(1, minSide)) : 1;
          var c = document.createElement('canvas');
          c.width = Math.round(state.result.w * mult);
          c.height = Math.round(state.result.h * mult);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(function (pngBlob) {
            if (!pngBlob) return;
            downloadBlob(pngBlob, base + '.png');
            showToast('হাই-রেজোলিউশন ট্রান্সপারেন্ট PNG ডাউনলোড হয়েছে!', 'High-Res Transparent PNG downloaded!');
          }, 'image/png');
        };
        img.src = url;
      });
      return;
    }

    ensureCore().then(function () {
      var text = fmt === 'eps' ? window.TechHatVectorExport.toEps(state.result, exportOpts())
        : fmt === 'ai' ? window.TechHatVectorExport.toAi(state.result, exportOpts())
        : window.TechHatVectorExport.toSvg(state.result, exportOpts());
      var mime = fmt === 'eps' ? 'application/postscript' : fmt === 'ai' ? 'application/pdf' : 'image/svg+xml';
      var blob = new Blob([text], { type: mime });
      var name = base + '.' + fmt;
      if (navigator.canShare && navigator.canShare({ files: [new File([blob], name, { type: mime })] })) {
        var shareBtn = $('#vsShareBtn', root());
        if (shareBtn) {
          shareBtn.hidden = false;
          shareBtn._blob = blob;
          shareBtn._name = name;
          shareBtn._mime = mime;
        }
      }
      downloadBlob(blob, name);
      showToast(fmt.toUpperCase() + ' ' + tr('ভেক্টর ডাউনলোড হয়েছে!', 'vector downloaded!'));
    });
  }

  function shareExport() {
    var btn = $('#vsShareBtn', root());
    if (!btn || !btn._blob) return;
    var file = new File([btn._blob], btn._name, { type: btn._mime });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: btn._name }).catch(function () {});
    }
  }

  function pasteFromClipboard() {
    if (!navigator.clipboard || !navigator.clipboard.read) {
      showToast('Ctrl+V চেপে ছবি পেস্ট করুন', 'Press Ctrl+V to paste an image');
      return;
    }
    navigator.clipboard.read().then(function (items) {
      for (var i = 0; i < items.length; i++) {
        var types = items[i].types || [];
        for (var j = 0; j < types.length; j++) {
          if (types[j].indexOf('image/') === 0) {
            items[i].getType(types[j]).then(function (blob) {
              blob.name = 'pasted-logo.png';
              loadVectorFile([blob]);
            });
            return;
          }
        }
      }
      showToast('ক্লিপবোর্ডে কোনো ছবি পাওয়া যায়নি', 'No image found in clipboard');
    }).catch(function () {
      showToast('Ctrl+V চেপে ছবি পেস্ট করুন', 'Press Ctrl+V to paste an image');
    });
  }

  /* ============================ INITIALIZATION ============================ */

  function on(id, ev, fn) {
    var el = $('#' + id, root());
    if (el) el.addEventListener(ev, fn);
  }

  function init() {
    var r = root();
    if (!r || r.dataset.vsBound === '1') return;
    r.dataset.vsBound = '1';

    // Dropzones & file inputs
    wireDropzone($('#vsDropzone', r), $('#vsInput', r), loadVectorFile);
    wireDropzone($('#vsStage', r), null, loadVectorFile);
    on('vsCameraFallback', 'change', function (e) {
      if (e.target.files && e.target.files.length) {
        loadVectorFile(Array.prototype.slice.call(e.target.files));
        e.target.value = '';
      }
    });

    // Global paste support when vector pane is visible
    document.addEventListener('paste', function (e) {
      var pane = root();
      if (!pane || pane.hidden) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      var items = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf('image/') === 0) {
          var f = items[i].getAsFile();
          if (f) {
            e.preventDefault();
            loadVectorFile([f]);
            return;
          }
        }
      }
    });

    // Delegated click handler for all [data-vs], [data-vs-view], [data-vs-insp-tab], [data-vs-layer-act], etc.
    r.addEventListener('click', function (e) {
      // 1. Filmstrip page card click / delete
      var delPageBtn = e.target.closest('[data-vs-page-del]');
      if (delPageBtn) {
        e.stopPropagation();
        var delId = delPageBtn.getAttribute('data-vs-page-del');
        state.items = state.items.filter(function (it) { return it.id !== delId; });
        if (!state.items.length) resetAll();
        else if (state.activeId === delId) selectItem(state.items[0].id);
        else renderFilmstrip();
        return;
      }
      var pageCard = e.target.closest('[data-vs-page-id]');
      if (pageCard) {
        var pid = pageCard.getAttribute('data-vs-page-id');
        if (pid && pid !== state.activeId) selectItem(pid);
        return;
      }

      // 2. Inspector tabs (Presets | Smart Fix | Adjustments)
      var inspTab = e.target.closest('[data-vs-insp-tab]');
      if (inspTab) {
        var tabName = inspTab.getAttribute('data-vs-insp-tab');
        $$('[data-vs-insp-tab]', r).forEach(function (b) {
          b.setAttribute('aria-selected', b === inspTab ? 'true' : 'false');
        });
        $$('[data-vs-insp-pane]', r).forEach(function (p) {
          p.hidden = p.getAttribute('data-vs-insp-pane') !== tabName;
        });
        return;
      }

      // 3. View switcher (split | preview | wire | crop)
      var viewBtn = e.target.closest('[data-vs-view]');
      if (viewBtn) {
        setViewMode(viewBtn.getAttribute('data-vs-view'));
        return;
      }

      // 4. Individual slider reset button
      var resetAdjBtn = e.target.closest('[data-vs-reset-adj]');
      if (resetAdjBtn) {
        var key = resetAdjBtn.getAttribute('data-vs-reset-adj');
        var m = ADJ_META[key];
        if (m && $('#' + m.id, r)) {
          $('#' + m.id, r).value = String(m.def);
          updateSliderPodUI(key);
          scheduleTrace(0);
        }
        return;
      }

      // 5. Photoshop Layer bottom action bar
      var layerActBtn = e.target.closest('[data-vs-layer-act]');
      if (layerActBtn) {
        performLayerAction(layerActBtn.getAttribute('data-vs-layer-act'));
        return;
      }

      // 6. Photoshop Dock Tool Groups & Flyouts
      var flyToolBtn = e.target.closest('[data-vs-tool]');
      if (flyToolBtn) {
        selectPsTool(flyToolBtn.getAttribute('data-vs-tool'));
        return;
      }
      var grpBtn = e.target.closest('[data-vs-group-btn]');
      if (grpBtn) {
        var grpId = grpBtn.getAttribute('data-vs-group-btn');
        var curTool = grpBtn.getAttribute('data-vs-cur');
        var fly = $('[data-vs-flyout="' + grpId + '"]', r);
        if (fly && grpBtn.getAttribute('aria-pressed') === 'true') {
          fly.hidden = !fly.hidden;
        } else {
          selectPsTool(curTool);
        }
        return;
      }

      // 7. Selection mode & commands
      var selModeBtn = e.target.closest('[data-vs-sel-mode]');
      if (selModeBtn) {
        state.selMode = selModeBtn.getAttribute('data-vs-sel-mode');
        $$('[data-vs-sel-mode]', r).forEach(function (b) {
          b.setAttribute('aria-pressed', b === selModeBtn ? 'true' : 'false');
        });
        return;
      }
      var selCmdBtn = e.target.closest('[data-vs-sel]');
      if (selCmdBtn) {
        handleSelectionCommand(selCmdBtn.getAttribute('data-vs-sel'));
        return;
      }

      // 8. Text tool options
      var txtToggle = e.target.closest('[data-vs-txt-toggle]');
      if (txtToggle) {
        var which = txtToggle.getAttribute('data-vs-txt-toggle');
        if (which === 'bold') state.txtBold = !state.txtBold;
        if (which === 'italic') state.txtItalic = !state.txtItalic;
        txtToggle.setAttribute('aria-pressed', (which === 'bold' ? state.txtBold : state.txtItalic) ? 'true' : 'false');
        return;
      }
      var txtAlignBtn = e.target.closest('[data-vs-txt-align]');
      if (txtAlignBtn) {
        state.txtAlign = txtAlignBtn.getAttribute('data-vs-txt-align');
        $$('[data-vs-txt-align]', r).forEach(function (b) {
          b.setAttribute('aria-pressed', b === txtAlignBtn ? 'true' : 'false');
        });
        return;
      }
      var txtActBtn = e.target.closest('[data-vs-txt]');
      if (txtActBtn) {
        if (txtActBtn.getAttribute('data-vs-txt') === 'commit') commitTextTool();
        else cancelTextTool();
        return;
      }

      // 9. Main [data-vs] studio actions
      var vsBtn = e.target.closest('[data-vs]');
      if (!vsBtn) return;
      var act = vsBtn.getAttribute('data-vs');

      if (act === 'add' || act === 'import-files') {
        if ($('#vsInput', r)) $('#vsInput', r).click();
      } else if (act === 'paste') {
        pasteFromClipboard();
      } else if (act === 'camera') {
        openCameraDialog();
      } else if (act === 'camera-close') {
        closeCameraDialog();
      } else if (act === 'camera-switch') {
        state.camFacing = state.camFacing === 'environment' ? 'user' : 'environment';
        closeCameraDialog();
        openCameraDialog();
      } else if (act === 'capture') {
        captureFromCamera();
      } else if (act === 'reset') {
        resetAll();
      } else if (act === 'undo' || act === 'undo-erase') {
        undoAction();
      } else if (act === 'redo') {
        redoAction();
      } else if (act === 'clear-erases') {
        resetItemEdits();
      } else if (act === 'left') {
        rotateActive(-90);
      } else if (act === 'right') {
        rotateActive(90);
      } else if (act === 'flip-h') {
        flipActiveHorizontal();
      } else if (act === 'auto-trim') {
        autoTrimActiveLogo();
      } else if (act === 'edit-page') {
        enterEditMode();
      } else if (act === 'close-eraser') {
        exitEditMode(true);
      } else if (act === 'trace-now') {
        scheduleTrace(0);
      } else if (act === 'toggle-sidebar') {
        if (window.innerWidth < 1024) {
          r.dataset.drawer = r.dataset.drawer === 'pages' ? '' : 'pages';
          if ($('#vsDrawerBackdrop', r)) $('#vsDrawerBackdrop', r).hidden = !r.dataset.drawer;
        } else {
          var collapsed = r.dataset.sidebarCollapsed === 'true';
          r.dataset.sidebarCollapsed = collapsed ? 'false' : 'true';
          if ($('#vsSidebarToggleBtn', r)) $('#vsSidebarToggleBtn', r).setAttribute('aria-pressed', collapsed ? 'true' : 'false');
        }
      } else if (act === 'toggle-inspector') {
        r.dataset.drawer = r.dataset.drawer === 'inspector' ? '' : 'inspector';
        if ($('#vsDrawerBackdrop', r)) $('#vsDrawerBackdrop', r).hidden = !r.dataset.drawer;
      } else if (act === 'close-drawers') {
        delete r.dataset.drawer;
        if ($('#vsDrawerBackdrop', r)) $('#vsDrawerBackdrop', r).hidden = true;
      } else if (act === 'reset-settings') {
        applyPreset(state.preset || 'logo_hd', false);
        showToast('ভেক্টর সেটিংস রিসেট করা হয়েছে', 'Vector settings reset to preset defaults');
      } else if (act === 'zoom-in') {
        state.zoom = clamp(state.zoom * 1.25, 0.2, 24);
        applyTransform();
      } else if (act === 'zoom-out') {
        state.zoom = clamp(state.zoom / 1.25, 0.2, 24);
        applyTransform();
      } else if (act === 'fit') {
        fitZoom();
      } else if (act === 'actual') {
        state.zoom = 1;
        state.panX = 0;
        state.panY = 0;
        applyTransform();
      } else if (act === 'compare') {
        state.comparingOrig = !state.comparingOrig;
        vsBtn.setAttribute('aria-pressed', state.comparingOrig ? 'true' : 'false');
        updateLayerVisibility();
      } else if (act === 'use-picked-bg') {
        var hex = ($('#vsPickerHex', r) && $('#vsPickerHex', r).textContent) || '#ffffff';
        if ($('#vsBgColor', r)) $('#vsBgColor', r).value = hex.toLowerCase();
        if ($('#vsBgMode', r)) $('#vsBgMode', r).value = 'color';
        showToast('ব্যাকগ্রাউন্ড রিমুভ রঙ সেট করা হয়েছে: ' + hex, 'Set background removal key color: ' + hex);
        if (!state.editing) scheduleTrace(0);
      } else if (act === 'open-export-modal') {
        var dlg = $('#vsExportDialog', r);
        if (dlg) {
          if (dlg.showModal) dlg.showModal();
          else dlg.setAttribute('open', '');
        }
      } else if (act === 'export-close') {
        var dlg2 = $('#vsExportDialog', r);
        if (dlg2) {
          if (dlg2.close) dlg2.close();
          else dlg2.removeAttribute('open');
        }
      } else if (act === 'dl-svg') {
        exportBlob('svg');
      } else if (act === 'dl-eps') {
        exportBlob('eps');
      } else if (act === 'dl-ai') {
        exportBlob('ai');
      } else if (act === 'dl-png') {
        exportBlob('png');
      }
    });

    // Mode tabs (Full Color | Mono)
    $$('#vsModeTabs [data-vs-mode]', r).forEach(function (b) {
      b.addEventListener('click', function () {
        var m = b.getAttribute('data-vs-mode');
        if (m === 'mono') state.it.ignoreWhite = true;
        setMode(m, true);
        syncItFromLegacy();
        scheduleTrace(0);
      });
    });

    // Preset radio buttons
    $$('input[name="vsPreset"]', r).forEach(function (rad) {
      rad.addEventListener('change', function () {
        if (rad.checked) applyPreset(rad.value, false);
      });
    });

    // 8 Fill-Bar Adjustment Sliders
    Object.keys(ADJ_META).forEach(function (key) {
      var m = ADJ_META[key];
      on(m.id, 'input', function () {
        updateSliderPodUI(key);
        syncItFromLegacy();
        scheduleTrace();
      });
    });

    // Smart Fix switches & BG Removal
    ['vsHdEnhance', 'vsAutoThr', 'vsInvert', 'vsMedian', 'vsBlur', 'vsThreshold', 'vsGradient', 'vsSharpCorners'].forEach(function (id) {
      on(id, 'change', function () { syncItFromLegacy(); scheduleTrace(0); });
    });
    on('vsGapFree', 'change', function () {
      var modeVal = ($('#vsGapFree', r) && $('#vsGapFree', r).checked) ? 'stacked' : 'cutout';
      if ($('#vsStacking', r)) $('#vsStacking', r).value = modeVal;
      if ($('#vsLayerStackMode', r)) $('#vsLayerStackMode', r).value = modeVal;
      scheduleTrace(0);
    });
    on('vsLayerStackMode', 'change', function () {
      var v = $('#vsLayerStackMode', r).value;
      if ($('#vsStacking', r)) $('#vsStacking', r).value = v;
      if ($('#vsGapFree', r)) $('#vsGapFree', r).checked = (v === 'stacked');
      syncItFromLegacy();
      scheduleTrace(0);
    });
    on('vsBgMode', 'change', function () { scheduleTrace(0); });
    on('vsBgColor', 'input', function () {
      if ($('#vsBgMode', r) && $('#vsBgMode', r).value === 'off') $('#vsBgMode', r).value = 'color';
      scheduleTrace();
    });
    on('vsBgPick', 'click', function () {
      var item = activeItem();
      if (!item) return;
      var ctx = item.workCanvas.getContext('2d', { willReadFrequently: true });
      var d = ctx.getImageData(2, 2, 1, 1).data;
      var hexv = rgbToHex(d[0], d[1], d[2]);
      if ($('#vsBgColor', r)) $('#vsBgColor', r).value = hexv;
      if ($('#vsBgMode', r)) $('#vsBgMode', r).value = 'color';
      showToast('লোগোর কর্নার থেকে ব্যাকগ্রাউন্ড রঙ (' + hexv.toUpperCase() + ') পিক করা হয়েছে', 'Picked background color (' + hexv.toUpperCase() + ') from corner');
      scheduleTrace(0);
    });

    // Photoshop Contextual Tool Options Sliders (Brush Size, Hardness, Opacity, Wand Tolerance, Colors)
    on('vsBrushSize', 'input', function () {
      var v = parseInt($('#vsBrushSize', r).value, 10) || 24;
      if ($('#vsBrushSizeVal', r)) $('#vsBrushSizeVal', r).textContent = v + 'px';
      if ($('#vsBrushSizeFill', r)) $('#vsBrushSizeFill', r).style.width = ((v - 2) / 118 * 100).toFixed(1) + '%';
    });
    on('vsBrushHardness', 'input', function () {
      var v = parseInt($('#vsBrushHardness', r).value, 10) || 85;
      if ($('#vsBrushHardnessVal', r)) $('#vsBrushHardnessVal', r).textContent = v + '%';
      if ($('#vsBrushHardnessFill', r)) $('#vsBrushHardnessFill', r).style.width = v + '%';
    });
    on('vsBrushOpacity', 'input', function () {
      var v = parseInt($('#vsBrushOpacity', r).value, 10) || 100;
      if ($('#vsBrushOpacityVal', r)) $('#vsBrushOpacityVal', r).textContent = v + '%';
      if ($('#vsBrushOpacityFill', r)) $('#vsBrushOpacityFill', r).style.width = ((v - 10) / 90 * 100).toFixed(1) + '%';
    });
    on('vsWandTolerance', 'input', function () {
      var v = parseInt($('#vsWandTolerance', r).value, 10) || 28;
      if ($('#vsWandTolVal', r)) $('#vsWandTolVal', r).textContent = String(v);
      if ($('#vsWandToleranceFill', r)) $('#vsWandToleranceFill', r).style.width = v + '%';
    });
    on('vsEraserColor', 'input', function () {
      var v = $('#vsEraserColor', r).value;
      if ($('#vsEraserColorChip', r)) $('#vsEraserColorChip', r).style.background = v;
      if ($('#vsDockColor', r)) $('#vsDockColor', r).value = v;
      if ($('#vsDockSwatch', r)) $('#vsDockSwatch', r).style.background = v;
    });
    on('vsDockColor', 'input', function () {
      var v = $('#vsDockColor', r).value;
      if ($('#vsDockSwatch', r)) $('#vsDockSwatch', r).style.background = v;
      if ($('#vsEraserColor', r)) $('#vsEraserColor', r).value = v;
      if ($('#vsEraserColorChip', r)) $('#vsEraserColorChip', r).style.background = v;
    });
    on('vsTxtColor', 'input', function () {
      var v = $('#vsTxtColor', r).value;
      if ($('#vsTxtColorChip', r)) $('#vsTxtColorChip', r).style.background = v;
    });

    // Keyboard shortcuts when vector pane is active
    document.addEventListener('keydown', function (e) {
      var pane = root();
      if (!pane || pane.hidden || pane.dataset.hasPages !== 'true') return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        if (e.target.id === 'vsTextEditor' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          commitTextTool();
        } else if (e.target.id === 'vsTextEditor' && e.key === 'Escape') {
          e.preventDefault();
          cancelTextTool();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redoAction();
        else undoAction();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redoAction();
        return;
      }

      if (!state.editing) return;
      var k = e.key.toLowerCase();
      if (k === 'v') selectPsTool('move');
      else if (k === 'm') selectPsTool('marquee-rect');
      else if (k === 'l') selectPsTool('lasso');
      else if (k === 'w') selectPsTool('wand');
      else if (k === 'i') selectPsTool('picker');
      else if (k === 'j') selectPsTool('heal');
      else if (k === 'b') selectPsTool('brush');
      else if (k === 'e') selectPsTool('eraser');
      else if (k === 's') selectPsTool('clone');
      else if (k === 'o') selectPsTool('dodge');
      else if (k === 't') selectPsTool('text');
      else if (k === 'h') selectPsTool('hand');
      else if (k === 'z') selectPsTool('zoom');
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selection) {
          e.preventDefault();
          handleSelectionCommand('clear');
        }
      } else if (e.key === 'Escape') {
        clearSelection();
      }
    });

    // Stage & Layer interactions
    installStageInteractions();
    on('vsPaletteList', 'click', onPaletteClick);
    on('vsPaletteList', 'input', onPaletteColor);

    // Quick export dock buttons
    on('vsDlSvg', 'click', function () { exportBlob('svg'); });
    on('vsDlEps', 'click', function () { exportBlob('eps'); });
    on('vsDlAi', 'click', function () { exportBlob('ai'); });
    on('vsDlPng', 'click', function () { exportBlob('png'); });
    on('vsShareBtn', 'click', shareExport);
    on('vsCmyk', 'change', function () {
      if (activeItem()) activeItem().exports = {};
      state.exports = {};
      renderStats();
    });

    // Initialize Illustrator Image Trace panel + default One-Click Auto preset
    installImageTracePanel();
    applyPreset('auto', true);
    ensureCore();
    window.addEventListener('th-open-project', function (e) {
      if (e && e.detail && e.detail.id) restoreSavedProject(e.detail.id);
    });
    setTimeout(function () { restoreSavedProject(); }, 60);
  }

  window.TechHatVector = {
    init: init,
    traceNow: runTrace,
    loadFile: loadVectorFile,
    enterEditMode: enterEditMode,
    exitEditMode: exitEditMode,
    state: state
  };

  if ($('#img-pane-vector')) {
    init();
  }
})();
