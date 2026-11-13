/*!
 * TechHat Image Studio — 100% Client-Side Image Toolkit
 * Sub-tools:
 *   1. Resize & Govt Form Presets (300×300 Job Photo ≤100KB, 300×80 Signature ≤60KB, Passport, Stamp, Custom)
 *   2. Compress Image (Batch/Single, Quality & Target KB, Side-by-Side Before/After Preview, ZIP Download)
 *   3. Crop, Rotate, Flip & Circle/Rounded Avatar Maker
 *   4. Format Converter (JPG / PNG / WebP / Base64), Photo Filters, Border & Bangla/English Watermark
 *   5. Combine Images & NID Front+Back A4 Sheet Maker
 *   6. Color Picker & Dominant Palette Extractor (HEX / RGB)
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function isEn() { return document.documentElement.getAttribute('data-lang') === 'en'; }
  function tr(bn, en) { return isEn() ? en : bn; }
  var bDig = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  function toBn(n) {
    if (isEn()) return String(n);
    return String(n).replace(/\d/g, function (d) { return bDig[d]; });
  }

  function fmtSize(bytes) {
    if (!bytes || bytes <= 0) return '0 KB';
    var kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(kb < 10 ? 1 : 0) + ' KB';
    return (kb / 1024).toFixed(2) + ' MB';
  }
  function baseName(filename) { return String(filename || 'image').replace(/\.[^.]+$/, ''); }
  function extFromMime(mime) {
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    return 'jpg';
  }

  function showToast(msg, enMsg) {
    var text = (enMsg && isEn()) ? enMsg : (typeof msg === 'object' && msg ? (isEn() ? msg.en : msg.bn) : msg);
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

  function loadImageFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//i.test(file.type)) {
        reject(new Error(tr('অনুগ্রহ করে একটি বৈধ ছবি (JPG, PNG, WebP) নির্বাচন করুন', 'Please select a valid image (JPG, PNG, WebP)')));
        return;
      }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        resolve({
          file: file,
          name: file.name,
          origSize: file.size,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          img: img,
          url: url
        });
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error(tr('ছবিটি লোড করা যায়নি', 'Failed to load image')));
      };
      img.src = url;
    });
  }

  function canvasToBlob(canvas, mime, quality) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (b) {
        resolve(b || new Blob([], { type: mime }));
      }, mime, quality);
    });
  }

  /**
   * Encodes a canvas into a Blob. If maxKb > 0 and format is lossy (JPEG/WebP),
   * performs a binary search on quality (and if needed, gentle downscale) to fit within maxKb.
   */
  async function encodeCanvasWithLimit(canvas, mime, defaultQuality, maxKb) {
    var q = typeof defaultQuality === 'number' ? defaultQuality : 0.9;
    if (!maxKb || maxKb <= 0 || mime === 'image/png') {
      return canvasToBlob(canvas, mime, q);
    }
    var targetBytes = maxKb * 1024;
    var initial = await canvasToBlob(canvas, mime, 0.92);
    if (initial.size <= targetBytes) return initial;

    var lo = 0.12, hi = 0.90, best = initial;
    for (var i = 0; i < 6; i++) {
      var mid = (lo + hi) / 2;
      var candidate = await canvasToBlob(canvas, mime, mid);
      if (candidate.size <= targetBytes) {
        best = candidate;
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return best;
  }

  function setupDialog(dlg) {
    if (!dlg || dlg._setup) return;
    dlg._setup = true;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dlg.addEventListener('click', function (e) {
        if (e.target !== dlg) return;
        var r = dlg.getBoundingClientRect();
        var inside = r.top <= e.clientY && e.clientY <= r.bottom && r.left <= e.clientX && e.clientX <= r.right;
        if (!inside) dlg.close();
      });
    }
  }
  function openDialog(dlg) {
    setupDialog(dlg);
    if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
  }

  /* ==================================================================
   * NAVIGATION & SUB-ROUTE SYNC
   * ================================================================== */
  var initialized = false;
  var currentTab = 'hub';
  var IMG_SUB_SLUGS = {
    hub: '/image',
    resize: '/image/resize',
    compress: '/image/compress',
    crop: '/image/crop',
    convert: '/image/convert',
    combine: '/image/combine',
    scan: '/image/scan',
    passport: '/image/passport',
    'passport-photo': '/image/passport-photo',
    'remove-bg': '/image/remove-bg',
    'photo-card': '/image/photo-card',
    colors: '/image/colors',
    vector: '/image/vectorize'
  };
  var IMG_SUB_TITLES = {
    scan: { bn: 'ডকুমেন্ট স্ক্যানার', en: 'Document Scanner' },
    passport: { bn: 'পাসপোর্ট মেকার ও স্ক্যানার', en: 'Passport Maker & Scanner' },
    'passport-photo': { bn: 'পাসপোর্ট সাইজ ছবি', en: 'Passport Size Photo' },
    'remove-bg': { bn: 'AI ব্যাকগ্রাউন্ড রিমুভার', en: 'Remove Background' },
    'photo-card': { bn: 'ফটো কার্ড মেকার', en: 'Photo Card Maker' },
    resize: { bn: 'ইমেজ রিসাইজার', en: 'Image Resizer' },
    compress: { bn: 'কমপ্রেস ইমেজ', en: 'Compress Image' },
    crop: { bn: 'ক্রপ ও রাউন্ড ফটো', en: 'Crop & Circle Photo' },
    convert: { bn: 'ফরম্যাট ও ওয়াটারমার্ক', en: 'Convert & Watermark' },
    combine: { bn: 'NID কার্ড স্ক্যানার', en: 'NID Card Scanner' },
    colors: { bn: 'কালার পিকার', en: 'Color Picker' },
    vector: { bn: 'রাস্টার টু ভেক্টর', en: 'Raster to Vector' }
  };

  function switchImgTab(tabId, skipUrl) {
    currentTab = tabId || 'hub';
    var imgRootEl = $('#tool-image');
    var targetPaneId = currentTab === 'passport' ? 'img-pane-scan' : ('img-pane-' + currentTab);
    var targetPane = $('#' + targetPaneId);
    if (!targetPane && IMG_SUB_SLUGS[currentTab]) {
      var curPath = (location.pathname || '/').replace(/\/+$/, '') || '/';
      if (!skipUrl && curPath !== IMG_SUB_SLUGS[currentTab]) {
        if (window.TechHatNavigate) window.TechHatNavigate(IMG_SUB_SLUGS[currentTab]);
        else location.href = IMG_SUB_SLUGS[currentTab];
      }
      return;
    }
    if (imgRootEl) {
      imgRootEl.setAttribute('data-initial-tab', currentTab);
    }
    function loadScriptOnce(src) {
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
    }
    if (currentTab === 'compress' || currentTab === 'scan' || currentTab === 'passport') {
      // JSZip powers Compress "download all" and scanner ZIP export; lazy-load when not on the page yet.
      if (!window.JSZip) loadScriptOnce('/vendor/jszip.min.js');
    }
    if (currentTab === 'scan' || currentTab === 'passport') {
      var scanMode = currentTab === 'passport' ? 'passport' : 'scan';
      if (targetPane) targetPane.setAttribute('data-scan-mode', scanMode);
      if (window.TechHatDocumentCore && (window.TechHatScannerInit || window.TechHatScannerSetMode)) {
        if (targetPane && targetPane.dataset.dsBound !== '1' && window.TechHatScannerInit) {
          window.TechHatScannerInit();
        }
        if (window.TechHatScannerSetMode) {
          window.TechHatScannerSetMode(scanMode);
        }
      } else {
        loadScriptOnce('/js/bijoy-engine.js?v=70')
          .then(function () { return loadScriptOnce('/js/document-scan-core.js?v=70'); })
          .then(function () { return loadScriptOnce('/js/document-scanner.js?v=77'); })
          .then(function () {
            if (window.TechHatScannerInit) window.TechHatScannerInit();
            if ((currentTab === 'scan' || currentTab === 'passport') && window.TechHatScannerSetMode) {
              window.TechHatScannerSetMode(currentTab === 'passport' ? 'passport' : 'scan');
            }
          });
      }
    }
    if (currentTab === 'combine') {
      if (window.TechHatNidScanner && window.TechHatNidScanner.init) {
        window.TechHatNidScanner.init();
      } else {
        loadScriptOnce('/js/nid-scanner.js?v=96').then(function () {
          if (window.TechHatNidScanner && window.TechHatNidScanner.init) window.TechHatNidScanner.init();
        });
      }
    }
    if (currentTab === 'vector') {
      if (window.TechHatVector && window.TechHatVector.init) {
        window.TechHatVector.init();
      } else {
        loadScriptOnce('/js/vector-tools.js?v=88').then(function () {
          if (window.TechHatVector && window.TechHatVector.init) window.TechHatVector.init();
        });
      }
    }
    if (currentTab === 'remove-bg' || currentTab === 'passport-photo') {
      if (!window.TechHatBgRemover) {
        loadScriptOnce('/js/bg-remover-engine.js?v=79');
      }
    }
    if (currentTab === 'photo-card') {
      if (window.TechHatPhotoCard && window.TechHatPhotoCard.init) {
        window.TechHatPhotoCard.init();
      } else {
        loadScriptOnce('/js/photo-card-metadata.js?v=99').then(function () {
          return loadScriptOnce('/js/photo-card-engine.js?v=99');
        }).then(function () {
          if (window.TechHatPhotoCard && window.TechHatPhotoCard.init) window.TechHatPhotoCard.init();
        });
      }
    }
    $$('#tool-image .pdf-nav-btn').forEach(function (btn) {
      var active = btn.getAttribute('data-img-tab') === currentTab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    $$('#tool-image .img-pane').forEach(function (pane) {
      pane.hidden = pane.id !== targetPaneId;
    });
    var bcTool = $('#globalBreadcrumbTool');
    var bcSep = $('#globalBreadcrumbSep');
    var bcWrap = $('#globalBreadcrumbToolWrap');
    if (bcTool && IMG_SUB_TITLES[currentTab]) {
      var tMeta = IMG_SUB_TITLES[currentTab];
      var lang = document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'bn';
      bcTool.setAttribute('data-i18n-bn', tMeta.bn);
      bcTool.setAttribute('data-i18n-en', tMeta.en);
      bcTool.textContent = tMeta[lang];
      if (bcSep) bcSep.hidden = false;
      if (bcWrap) bcWrap.hidden = false;
    } else if (currentTab === 'hub') {
      if (bcSep) bcSep.hidden = true;
      if (bcWrap) bcWrap.hidden = true;
    }
    var targetSlug = IMG_SUB_SLUGS[currentTab] || '/image';
    $$('#globalBreadcrumbDropdown [data-bc-item]').forEach(function (item) {
      item.classList.toggle('is-active', item.getAttribute('data-bc-item') === targetSlug);
    });
    if (!skipUrl && history.replaceState && /^\/image(\/|$)/.test(location.pathname)) {
      var targetUrl = IMG_SUB_SLUGS[currentTab] || '/image';
      if (location.pathname !== targetUrl) {
        history.replaceState(null, '', targetUrl);
      }
    }
  }

  function wireDropzone(zone, input, onFiles) {
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

  /* ==================================================================
   * 1. RESIZE & GOVT FORM PRESETS (WITH MANUAL TOUCH/MOUSE PAN & ZOOM)
   * ================================================================== */
  var resizeState = null; // { item, panX:0, panY:0, outBlob, outUrl, outW, outH, fmt }
  var resizeToken = 0;

  async function loadResizeFile(files) {
    try {
      var item = await loadImageFile(files[0]);
      if (resizeState && resizeState.item && resizeState.item.url) URL.revokeObjectURL(resizeState.item.url);
      resizeState = { item: item, panX: 0, panY: 0, outBlob: null, outUrl: null };
      if ($('#imgResizeZoom')) $('#imgResizeZoom').value = 100;
      $('#imgResizeOrigPreview').src = item.url;
      $('#imgResizeOrigMeta').textContent = item.width + ' × ' + item.height + ' px • ' + fmtSize(item.origSize);
      await renderResizeOutput();
      $('#imgResizeDropzone').hidden = true;
      $('#imgResizeStage').hidden = false;
      $('#imgResizeTopActions').hidden = false;
    } catch (e) {
      showToast(e.message || tr('ছবি লোড করা যায়নি', 'Failed to load image'));
    }
  }

  async function renderResizeOutput() {
    if (!resizeState || !resizeState.item) return;
    var token = ++resizeToken;
    var it = resizeState.item;
    var w = Math.max(1, Math.min(8000, parseInt($('#imgResizeW').value, 10) || 300));
    var h = Math.max(1, Math.min(8000, parseInt($('#imgResizeH').value, 10) || 300));
    var maxKb = Math.max(0, parseFloat($('#imgResizeMaxKb').value) || 0);
    var bg = $('#imgResizeBg').value || '#ffffff';
    var fitEl = $('input[name="imgResizeFit"]:checked');
    var fit = fitEl ? fitEl.value : 'cover';
    var fmtEl = $('input[name="imgResizeFmt"]:checked');
    var fmt = fmtEl ? fmtEl.value : 'image/jpeg';
    var zoomPct = $('#imgResizeZoom') ? (parseInt($('#imgResizeZoom').value, 10) || 100) : 100;
    if ($('#imgResizeZoomVal')) $('#imgResizeZoomVal').textContent = toBn(zoomPct) + '%';
    var zoom = zoomPct / 100;

    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');

    if (fmt !== 'image/png' || fit === 'contain' || zoom < 1 || resizeState.panX !== 0 || resizeState.panY !== 0) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (fit === 'stretch' && zoom === 1 && resizeState.panX === 0 && resizeState.panY === 0) {
      ctx.drawImage(it.img, 0, 0, w, h);
    } else {
      var baseScale = fit === 'contain'
        ? Math.min(w / it.width, h / it.height)
        : Math.max(w / it.width, h / it.height);
      var scale = baseScale * zoom;
      var dw = it.width * scale;
      var dh = it.height * scale;

      var maxPanX = Math.max(Math.abs(dw - w) / 2 + w * 0.4, w * 0.65);
      var maxPanY = Math.max(Math.abs(dh - h) / 2 + h * 0.4, h * 0.65);
      resizeState.panX = Math.max(-maxPanX, Math.min(maxPanX, resizeState.panX || 0));
      resizeState.panY = Math.max(-maxPanY, Math.min(maxPanY, resizeState.panY || 0));

      var dx = Math.round((w - dw) / 2 + resizeState.panX);
      var dy = Math.round((h - dh) / 2 + resizeState.panY);
      ctx.drawImage(it.img, dx, dy, Math.round(dw), Math.round(dh));
    }

    var blob = await encodeCanvasWithLimit(canvas, fmt, 0.90, maxKb);
    if (token !== resizeToken || !resizeState) return;
    if (resizeState.outUrl) URL.revokeObjectURL(resizeState.outUrl);
    var outUrl = URL.createObjectURL(blob);
    resizeState.outBlob = blob;
    resizeState.outUrl = outUrl;
    resizeState.outW = w;
    resizeState.outH = h;
    resizeState.fmt = fmt;

    $('#imgResizeOutPreview').src = outUrl;
    var limitBadge = maxKb > 0 ? (blob.size <= maxKb * 1024 ? ' ✓ (≤ ' + maxKb + ' KB)' : '') : '';
    $('#imgResizeOutMeta').textContent = w + ' × ' + h + ' px • ' + fmtSize(blob.size) + limitBadge;
    $('#imgResizeSummary').textContent = toBn(w) + '×' + toBn(h) + ' px • ' + fmtSize(blob.size) + ' (' + extFromMime(fmt).toUpperCase() + ')';
  }

  function installResizePanInteraction() {
    var panWrap = $('#imgResizePanWrap');
    if (!panWrap) return;
    var drag = null;

    panWrap.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || !resizeState) return;
      e.preventDefault();
      var rect = panWrap.getBoundingClientRect();
      drag = {
        startX: e.clientX,
        startY: e.clientY,
        rw: Math.max(1, rect.width),
        rh: Math.max(1, rect.height),
        origX: resizeState.panX || 0,
        origY: resizeState.panY || 0
      };
      panWrap.setPointerCapture(e.pointerId);
      panWrap.classList.add('dragging');
    });

    panWrap.addEventListener('pointermove', function (e) {
      if (!drag || !resizeState || !panWrap.hasPointerCapture(e.pointerId)) return;
      var w = resizeState.outW || 300;
      var h = resizeState.outH || 300;
      var dx = ((e.clientX - drag.startX) / drag.rw) * w;
      var dy = ((e.clientY - drag.startY) / drag.rh) * h;
      resizeState.panX = drag.origX + dx;
      resizeState.panY = drag.origY + dy;
      renderResizeOutput();
    });

    panWrap.addEventListener('lostpointercapture', function () {
      drag = null;
      panWrap.classList.remove('dragging');
    });

    panWrap.addEventListener('keydown', function (e) {
      if (!resizeState) return;
      var step = e.shiftKey ? 20 : 8;
      if (e.key === 'ArrowLeft') { e.preventDefault(); resizeState.panX -= step; renderResizeOutput(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); resizeState.panX += step; renderResizeOutput(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); resizeState.panY -= step; renderResizeOutput(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); resizeState.panY += step; renderResizeOutput(); }
    });

    panWrap.addEventListener('wheel', function (e) {
      if (!resizeState || !$('#imgResizeZoom')) return;
      e.preventDefault();
      var zEl = $('#imgResizeZoom');
      var cur = parseInt(zEl.value, 10) || 100;
      var next = Math.max(50, Math.min(300, cur + (e.deltaY < 0 ? 8 : -8)));
      zEl.value = next;
      renderResizeOutput();
    }, { passive: false });
  }

  /* ==================================================================
   * 2. COMPRESS IMAGES (BATCH + BEFORE/AFTER PREVIEW)
   * ================================================================== */
  var compressItems = []; // [{ item, outBlob, outUrl }]

  async function addCompressFiles(files) {
    var added = 0;
    for (var i = 0; i < files.length; i++) {
      try {
        var loaded = await loadImageFile(files[i]);
        compressItems.push({ item: loaded, outBlob: null, outUrl: null });
        added++;
      } catch (e) {}
    }
    if (!added) {
      showToast(tr('অনুগ্রহ করে ছবি ফাইল (JPG, PNG, WebP) নির্বাচন করুন', 'Please select image files (JPG, PNG, WebP)'));
      return;
    }
    await runAllCompress();
    $('#imgCompressDropzone').hidden = true;
    $('#imgCompressStage').hidden = false;
    $('#imgCompressTopActions').hidden = false;
  }

  async function runAllCompress() {
    if (!compressItems.length) return;
    var qPct = parseInt($('#imgCompressQuality').value, 10) || 75;
    $('#imgCompressQualityLbl').textContent = toBn(qPct) + '%';
    var targetKb = parseFloat($('#imgCompressTargetKb').value) || 0;
    var maxDim = parseInt($('#imgCompressMaxDim').value, 10) || 0;
    var fmtEl = $('input[name="imgCompressFmt"]:checked');
    var fmt = fmtEl ? fmtEl.value : 'image/jpeg';

    var totalOrig = 0, totalOut = 0;
    for (var i = 0; i < compressItems.length; i++) {
      var entry = compressItems[i];
      var it = entry.item;
      totalOrig += it.origSize;

      var w = it.width, h = it.height;
      if (maxDim > 0 && (w > maxDim || h > maxDim)) {
        var r = Math.min(maxDim / w, maxDim / h);
        w = Math.max(1, Math.round(w * r));
        h = Math.max(1, Math.round(h * r));
      }
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(it.img, 0, 0, w, h);

      var blob = await encodeCanvasWithLimit(canvas, fmt, qPct / 100, targetKb);
      if (entry.outUrl) URL.revokeObjectURL(entry.outUrl);
      entry.outBlob = blob;
      entry.outUrl = URL.createObjectURL(blob);
      entry.outW = w;
      entry.outH = h;
      entry.fmt = fmt;
      totalOut += blob.size;
    }

    var savedBytes = Math.max(0, totalOrig - totalOut);
    var savedPct = totalOrig > 0 ? Math.max(0, Math.round((savedBytes / totalOrig) * 100)) : 0;
    $('#imgCompressTotalStat').innerHTML =
      '<div class="pdf-stat-item"><span>' + tr('আগের মোট সাইজ', 'Original Size') + '</span><strong>' + fmtSize(totalOrig) + '</strong></div>' +
      '<div class="pdf-stat-arrow">→</div>' +
      '<div class="pdf-stat-item pdf-stat-item--new"><span>' + tr('কমপ্রেসড সাইজ', 'Compressed Size') + '</span><strong>' + fmtSize(totalOut) + '</strong></div>' +
      '<div class="pdf-stat-badge">-' + toBn(savedPct) + '%' + tr(' সাশ্রয় (', ' saved (') + fmtSize(savedBytes) + tr(' কমেছে)', ')') + '</div>';

    $('#imgCompressSummary').textContent = toBn(compressItems.length) + tr('টি ছবি • ', ' images • ') + fmtSize(totalOut);
    renderCompressList();
  }

  function renderCompressList() {
    var list = $('#imgCompressList');
    if (!list) return;
    list.innerHTML = '';
    compressItems.forEach(function (entry, idx) {
      var it = entry.item;
      var diffPct = it.origSize > 0 ? Math.round(((it.origSize - entry.outBlob.size) / it.origSize) * 100) : 0;
      var badgeTxt = diffPct > 0 ? '-' + toBn(diffPct) + '%' : (isEn() ? '0%' : '০%');
      var card = document.createElement('div');
      card.className = 'img-comp-card';
      card.innerHTML =
        '<div class="img-comp-card__thumb"><img src="' + entry.outUrl + '" alt=""></div>' +
        '<div class="img-comp-card__body">' +
          '<div class="img-comp-card__name" title="' + it.name.replace(/"/g, '&quot;') + '">' + it.name + '</div>' +
          '<div class="img-comp-card__meta">' +
            '<span>' + fmtSize(it.origSize) + ' → <b>' + fmtSize(entry.outBlob.size) + '</b></span>' +
            '<span class="img-comp-card__badge">' + badgeTxt + '</span>' +
          '</div>' +
          '<div class="img-comp-card__actions">' +
            '<button type="button" class="chip-btn inline-flex items-center gap-1.5" data-cmp-idx="' + idx + '"><svg class="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span>' + tr('আগে/পরে দেখুন', 'Compare') + '</span></button>' +
            '<button type="button" class="chip-btn chip-btn--accent inline-flex items-center gap-1.5" data-dl-idx="' + idx + '"><svg class="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg><span>' + tr('ডাউনলোড', 'Download') + '</span></button>' +
          '</div>' +
        '</div>';
      list.appendChild(card);
    });
  }

  function openCompressCompare(idx) {
    var entry = compressItems[idx];
    if (!entry) return;
    $('#imgPreviewTitle').textContent = tr('আগে ও পরে তুলনা — ', 'Before & After Comparison — ') + entry.item.name;
    $('#imgPreviewSub').textContent = tr('অরিজিনাল (', 'Original (') + fmtSize(entry.item.origSize) + tr(') বনাম কমপ্রেসড (', ') vs Compressed (') + fmtSize(entry.outBlob.size) + ')';
    $('#imgPreviewStage').innerHTML =
      '<div class="pdf-compare-grid">' +
        '<figure class="pdf-preview-fig"><figcaption>' + tr('অরিজিনাল (', 'Original (') + fmtSize(entry.item.origSize) + ')</figcaption><img src="' + entry.item.url + '" alt="Original"></figure>' +
        '<figure class="pdf-preview-fig"><figcaption>' + tr('কমপ্রেসড (', 'Compressed (') + fmtSize(entry.outBlob.size) + ')</figcaption><img src="' + entry.outUrl + '" alt="Compressed"></figure>' +
      '</div>';
    openDialog($('#imgPreviewDialog'));
  }

  /* ==================================================================
   * 3. INTERACTIVE CROP, ROTATE, FLIP & CIRCLE AVATAR
   * ================================================================== */
  var cropState = null; // { item, rot:0, flipH:1, flipV:1, box:{x,y,w,h}, cw, ch, outBlob, outUrl }
  var cropToken = 0;

  async function loadCropFile(files) {
    try {
      var item = await loadImageFile(files[0]);
      if (cropState && cropState.item && cropState.item.url) URL.revokeObjectURL(cropState.item.url);
      cropState = { item: item, rot: 0, flipH: 1, flipV: 1, box: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 }, outBlob: null, outUrl: null };
      drawCropSourceCanvas();
      autoDetectCropSubjectBox();
      await updateCropPreview();
      $('#imgCropDropzone').hidden = true;
      $('#imgCropStage').hidden = false;
      $('#imgCropTopActions').hidden = false;
    } catch (e) {
      showToast(e.message || tr('ছবি লোড করা যায়নি', 'Failed to load image'));
    }
  }

  function autoDetectCropSubjectBox(seedPt) {
    if (!cropState) return;
    var canvas = $('#imgCropSourceCanvas');
    if (!canvas) return;
    var cw = canvas.width, ch = canvas.height;
    var ratio = getSelectedCropRatio();

    // First check if autoDetectCardQuad finds a clean card/document box
    var det = (window.TechHatNidScanner && window.TechHatNidScanner.autoDetectCardQuad)
      ? window.TechHatNidScanner.autoDetectCardQuad(cropState.item.img, cropState.rot || 0, cropState.flipH || 1, null, seedPt)
      : null;
    var minX = 0.1, minY = 0.1, maxX = 0.9, maxY = 0.9;
    if (det && det.pts && det.pts.length === 4) {
      minX = Math.max(0.01, Math.min(det.pts[0].x, det.pts[1].x, det.pts[2].x, det.pts[3].x));
      maxX = Math.min(0.99, Math.max(det.pts[0].x, det.pts[1].x, det.pts[2].x, det.pts[3].x));
      minY = Math.max(0.01, Math.min(det.pts[0].y, det.pts[1].y, det.pts[2].y, det.pts[3].y));
      maxY = Math.min(0.99, Math.max(det.pts[0].y, det.pts[1].y, det.pts[2].y, det.pts[3].y));
    }

    // Also compute foreground saliency bounding box (ideal for signatures, portraits, logos, avatars)
    try {
      var ctx = canvas.getContext('2d', { willReadFrequently: true });
      var data = ctx.getImageData(0, 0, cw, ch).data;
      var borderR = 0, borderG = 0, borderB = 0, bCnt = 0;
      for (var bx = 0; bx < cw; bx += 2) {
        var iT = bx * 4, iB = ((ch - 1) * cw + bx) * 4;
        borderR += data[iT] + data[iB];
        borderG += data[iT + 1] + data[iB + 1];
        borderB += data[iT + 2] + data[iB + 2];
        bCnt += 2;
      }
      for (var by = 0; by < ch; by += 2) {
        var iL = (by * cw) * 4, iR = (by * cw + (cw - 1)) * 4;
        borderR += data[iL] + data[iR];
        borderG += data[iL + 1] + data[iR + 1];
        borderB += data[iL + 2] + data[iR + 2];
        bCnt += 2;
      }
      borderR /= Math.max(1, bCnt);
      borderG /= Math.max(1, bCnt);
      borderB /= Math.max(1, bCnt);

      var colProj = new Float32Array(cw);
      var rowProj = new Float32Array(ch);
      var totalSal = 0;
      for (var y = 2; y < ch - 2; y++) {
        for (var x = 2; x < cw - 2; x++) {
          var idx4 = (y * cw + x) * 4;
          var cDiff = Math.hypot(data[idx4] - borderR, data[idx4 + 1] - borderG, data[idx4 + 2] - borderB);
          var gx = Math.abs(data[idx4 + 4] - data[idx4 - 4]);
          var gy = Math.abs(data[idx4 + cw * 4] - data[idx4 - cw * 4]);
          var sal = (cDiff > 24 ? cDiff - 20 : 0) + (gx + gy > 22 ? (gx + gy) * 0.6 : 0);
          if (sal > 8) {
            colProj[x] += sal;
            rowProj[y] += sal;
            totalSal += sal;
          }
        }
      }
      if (totalSal > cw * ch * 0.35) {
        var accX = 0, sx0 = 2, sx1 = cw - 3;
        for (var ix = 2; ix < cw - 2; ix++) { accX += colProj[ix]; if (accX >= totalSal * 0.025) { sx0 = ix; break; } }
        accX = 0;
        for (var ix2 = cw - 3; ix2 >= 2; ix2--) { accX += colProj[ix2]; if (accX >= totalSal * 0.025) { sx1 = ix2; break; } }
        var accY = 0, sy0 = 2, sy1 = ch - 3;
        for (var iy = 2; iy < ch - 2; iy++) { accY += rowProj[iy]; if (accY >= totalSal * 0.025) { sy0 = iy; break; } }
        accY = 0;
        for (var iy2 = ch - 3; iy2 >= 2; iy2--) { accY += rowProj[iy2]; if (accY >= totalSal * 0.025) { sy1 = iy2; break; } }

        var padX = Math.max(4, Math.round((sx1 - sx0) * 0.05));
        var padY = Math.max(4, Math.round((sy1 - sy0) * 0.06));
        var salX0 = Math.max(0.01, (sx0 - padX) / cw);
        var salX1 = Math.min(0.99, (sx1 + padX) / cw);
        var salY0 = Math.max(0.01, (sy0 - padY) / ch);
        var salY1 = Math.min(0.99, (sy1 + padY) / ch);
        if ((maxX - minX) * (maxY - minY) > 0.84 && (salX1 - salX0) * (salY1 - salY0) >= 0.05) {
          minX = salX0; maxX = salX1; minY = salY0; maxY = salY1;
        }
      }
    } catch (e) {}

    var boxW = Math.max(0.12, maxX - minX);
    var boxH = Math.max(0.12, maxY - minY);
    var cx = (minX + maxX) * 0.5;
    var cy = (minY + maxY) * 0.5;
    if (seedPt && typeof seedPt.x === 'number') {
      cx = seedPt.x;
      cy = seedPt.y;
    }

    if (ratio > 0) {
      var pxW = boxW * cw;
      var pxH = pxW / ratio;
      if (pxH < boxH * ch) {
        pxH = boxH * ch;
        pxW = pxH * ratio;
      }
      if (pxW > cw * 0.96) { pxW = cw * 0.94; pxH = pxW / ratio; }
      if (pxH > ch * 0.96) { pxH = ch * 0.94; pxW = pxH * ratio; }
      boxW = pxW / cw;
      boxH = pxH / ch;
    }

    var fx = Math.max(0, Math.min(1 - boxW, cx - boxW * 0.5));
    var fy = Math.max(0, Math.min(1 - boxH, cy - boxH * 0.5));
    cropState.box = { x: fx, y: fy, w: boxW, h: boxH };
    positionCropBoxDOM();
  }

  function snapCropBoxToEdges() {
    if (!cropState) return;
    var canvas = $('#imgCropSourceCanvas');
    if (!canvas) return;
    var nidApi = window.TechHatNidScanner;
    if (!nidApi || !nidApi.buildMagneticSnapField || !nidApi.snapEdgeMagnetically) {
      autoDetectCropSubjectBox();
      return;
    }
    if (!cropState.snapField || cropState._snapFieldKey !== 'crop' || !cropState.snapField.lum) {
      cropState.snapField = nidApi.buildMagneticSnapField(canvas);
      cropState._snapFieldKey = 'crop';
    }
    var b = cropState.box;
    var pts = [
      { x: b.x, y: b.y },
      { x: b.x + b.w, y: b.y },
      { x: b.x + b.w, y: b.y + b.h },
      { x: b.x, y: b.y + b.h }
    ];
    var topS = nidApi.snapEdgeMagnetically(cropState, pts[0], pts[1], 18);
    var rightS = nidApi.snapEdgeMagnetically(cropState, pts[1], pts[2], 18);
    var botS = nidApi.snapEdgeMagnetically(cropState, pts[2], pts[3], 18);
    var leftS = nidApi.snapEdgeMagnetically(cropState, pts[3], pts[0], 18);

    var nx0 = leftS.snapped ? leftS.p1.x : b.x;
    var ny0 = topS.snapped ? topS.p1.y : b.y;
    var nx1 = rightS.snapped ? rightS.p1.x : (b.x + b.w);
    var ny1 = botS.snapped ? botS.p1.y : (b.y + b.h);
    if (nx1 - nx0 >= 0.08 && ny1 - ny0 >= 0.08) {
      cropState.box = { x: nx0, y: ny0, w: nx1 - nx0, h: ny1 - ny0 };
      if (getSelectedCropRatio() > 0) {
        var r = getSelectedCropRatio();
        var nh = (cropState.box.w * cropState.cw) / (r * cropState.ch);
        if (cropState.box.y + nh <= 1) cropState.box.h = nh;
      }
      positionCropBoxDOM();
    }
  }

  function adjustCropBoxMargin(delta) {
    if (!cropState) return;
    var b = cropState.box;
    var cx = b.x + b.w * 0.5;
    var cy = b.y + b.h * 0.5;
    var nw = Math.max(0.08, Math.min(1, b.w + delta * 2));
    var nh = Math.max(0.08, Math.min(1, b.h + delta * 2));
    var ratio = getSelectedCropRatio();
    if (ratio > 0) {
      nh = (nw * cropState.cw) / (ratio * cropState.ch);
      if (nh > 1) {
        nh = 1;
        nw = (nh * cropState.ch * ratio) / cropState.cw;
      }
    }
    cropState.box = {
      x: Math.max(0, Math.min(1 - nw, cx - nw * 0.5)),
      y: Math.max(0, Math.min(1 - nh, cy - nh * 0.5)),
      w: nw,
      h: nh
    };
    positionCropBoxDOM();
  }

  function drawCropSourceCanvas() {
    if (!cropState) return;
    var it = cropState.item;
    var rot = ((cropState.rot % 360) + 360) % 360;
    var swapped = rot === 90 || rot === 270;
    var srcW = swapped ? it.height : it.width;
    var srcH = swapped ? it.width : it.height;

    var maxStage = 460;
    var scale = Math.min(1, maxStage / Math.max(srcW, srcH));
    var cw = Math.max(80, Math.round(srcW * scale));
    var ch = Math.max(80, Math.round(srcH * scale));

    var canvas = $('#imgCropSourceCanvas');
    canvas.width = cw;
    canvas.height = ch;
    var ctx = canvas.getContext('2d');
    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(cropState.flipH, cropState.flipV);
    var drawW = swapped ? ch : cw;
    var drawH = swapped ? cw : ch;
    ctx.drawImage(it.img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    cropState.cw = cw;
    cropState.ch = ch;
    cropState.srcW = srcW;
    cropState.srcH = srcH;
    positionCropBoxDOM();
  }

  function getSelectedCropRatio() {
    var cwEl = $('#imgCropCustomW');
    var chEl = $('#imgCropCustomH');
    var lockEl = $('#imgCropLockCustomRatio');
    var customW = cwEl ? (parseInt(cwEl.value, 10) || 0) : 0;
    var customH = chEl ? (parseInt(chEl.value, 10) || 0) : 0;
    if (customW > 0 && customH > 0 && (!lockEl || lockEl.checked)) {
      return customW / customH;
    }
    var el = $('input[name="imgCropRatio"]:checked');
    var v = el ? el.value : 'free';
    if (v === 'free' || v === 'custom') return 0;
    var p = v.split(':');
    return parseFloat(p[0]) / parseFloat(p[1]);
  }

  function applyCropRatioConstraint() {
    if (!cropState) return;
    var ratio = getSelectedCropRatio();
    if (!ratio) {
      positionCropBoxDOM();
      return;
    }
    var cw = cropState.cw, ch = cropState.ch;
    var targetW = cw * 0.8;
    var targetH = targetW / ratio;
    if (targetH > ch * 0.8) {
      targetH = ch * 0.8;
      targetW = targetH * ratio;
    }
    cropState.box = {
      x: (cw - targetW) / (2 * cw),
      y: (ch - targetH) / (2 * ch),
      w: targetW / cw,
      h: targetH / ch
    };
    positionCropBoxDOM();
  }

  function positionCropBoxDOM() {
    if (!cropState) return;
    var boxEl = $('#imgCropBox');
    var b = cropState.box;
    var shapeEl = $('input[name="imgCropShape"]:checked');
    var shape = shapeEl ? shapeEl.value : 'rect';
    boxEl.style.left = (b.x * 100) + '%';
    boxEl.style.top = (b.y * 100) + '%';
    boxEl.style.width = (b.w * 100) + '%';
    boxEl.style.height = (b.h * 100) + '%';
    boxEl.style.borderRadius = shape === 'circle' ? '50%' : (shape === 'rounded' ? '16px' : '0');
  }

  async function updateCropPreview() {
    if (!cropState) return;
    var token = ++cropToken;
    var it = cropState.item;
    var rot = ((cropState.rot % 360) + 360) % 360;
    var swapped = rot === 90 || rot === 270;
    var fullW = swapped ? it.height : it.width;
    var fullH = swapped ? it.width : it.height;

    // Render full-res transformed image to offscreen canvas
    var fullCanvas = document.createElement('canvas');
    fullCanvas.width = fullW;
    fullCanvas.height = fullH;
    var fctx = fullCanvas.getContext('2d');
    fctx.translate(fullW / 2, fullH / 2);
    fctx.rotate((rot * Math.PI) / 180);
    fctx.scale(cropState.flipH, cropState.flipV);
    var dw = swapped ? fullH : fullW;
    var dh = swapped ? fullW : fullH;
    fctx.drawImage(it.img, -dw / 2, -dh / 2, dw, dh);

    var b = cropState.box;
    var sx = Math.max(0, Math.round(b.x * fullW));
    var sy = Math.max(0, Math.round(b.y * fullH));
    var sw = Math.max(1, Math.min(fullW - sx, Math.round(b.w * fullW)));
    var sh = Math.max(1, Math.min(fullH - sy, Math.round(b.h * fullH)));

    var customW = $('#imgCropCustomW') ? (parseInt($('#imgCropCustomW').value, 10) || 0) : 0;
    var customH = $('#imgCropCustomH') ? (parseInt($('#imgCropCustomH').value, 10) || 0) : 0;
    var outW = customW > 0 ? Math.min(8000, customW) : (customH > 0 ? Math.max(1, Math.round((customH * sw) / sh)) : sw);
    var outH = customH > 0 ? Math.min(8000, customH) : (customW > 0 ? Math.max(1, Math.round((customW * sh) / sw)) : sh);

    var shapeEl = $('input[name="imgCropShape"]:checked');
    var shape = shapeEl ? shapeEl.value : 'rect';
    var outCanvas = document.createElement('canvas');
    outCanvas.width = outW;
    outCanvas.height = outH;
    var octx = outCanvas.getContext('2d');
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';

    if (shape === 'circle') {
      octx.beginPath();
      octx.ellipse(outW / 2, outH / 2, outW / 2, outH / 2, 0, 0, Math.PI * 2);
      octx.closePath();
      octx.clip();
    } else if (shape === 'rounded') {
      var r = Math.min(outW, outH) * 0.12;
      octx.beginPath();
      octx.roundRect(0, 0, outW, outH, r);
      octx.closePath();
      octx.clip();
    }

    octx.drawImage(fullCanvas, sx, sy, sw, sh, 0, 0, outW, outH);
    var mime = shape === 'rect' ? 'image/jpeg' : 'image/png';
    var blob = await canvasToBlob(outCanvas, mime, 0.92);
    if (token !== cropToken || !cropState) return;
    if (cropState.outUrl) URL.revokeObjectURL(cropState.outUrl);
    cropState.outBlob = blob;
    cropState.outUrl = URL.createObjectURL(blob);
    cropState.mime = mime;
    cropState.outW = outW;
    cropState.outH = outH;

    $('#imgCropOutPreview').src = cropState.outUrl;
    $('#imgCropOutMeta').textContent = outW + ' × ' + outH + ' px • ' + fmtSize(blob.size);
    $('#imgCropSummary').textContent = toBn(outW) + ' × ' + toBn(outH) + ' px (' + extFromMime(mime).toUpperCase() + ')';
  }

  function installCropInteraction() {
    var boxEl = $('#imgCropBox');
    var wrapEl = $('#imgCropInteractiveWrap');
    if (!boxEl || !wrapEl) return;

    var drag = null;
    boxEl.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || !cropState) return;
      e.preventDefault();
      var handle = e.target.getAttribute('data-h') || 'move';
      var rect = wrapEl.getBoundingClientRect();
      drag = {
        handle: handle,
        startX: e.clientX,
        startY: e.clientY,
        rw: rect.width || 1,
        rh: rect.height || 1,
        orig: Object.assign({}, cropState.box)
      };
      boxEl.setPointerCapture(e.pointerId);
      boxEl.classList.add('dragging');
    });

    boxEl.addEventListener('pointermove', function (e) {
      if (!drag || !cropState || !boxEl.hasPointerCapture(e.pointerId)) return;
      var dx = (e.clientX - drag.startX) / drag.rw;
      var dy = (e.clientY - drag.startY) / drag.rh;
      var b = Object.assign({}, drag.orig);
      var ratio = getSelectedCropRatio();

      if (drag.handle === 'move') {
        b.x = Math.max(0, Math.min(1 - b.w, b.x + dx));
        b.y = Math.max(0, Math.min(1 - b.h, b.y + dy));
      } else {
        if (drag.handle.indexOf('e') !== -1) b.w = Math.max(0.06, Math.min(1 - b.x, b.w + dx));
        if (drag.handle.indexOf('s') !== -1) b.h = Math.max(0.06, Math.min(1 - b.y, b.h + dy));
        if (drag.handle.indexOf('w') !== -1) {
          var nw = Math.max(0.06, Math.min(b.x + b.w, b.w - dx));
          b.x += b.w - nw;
          b.w = nw;
        }
        if (drag.handle.indexOf('n') !== -1) {
          var nh = Math.max(0.06, Math.min(b.y + b.h, b.h - dy));
          b.y += b.h - nh;
          b.h = nh;
        }
        if (ratio > 0) {
          if (drag.handle === 'n' || drag.handle === 's') {
            var pxH2 = b.h * cropState.ch;
            var pxW2 = pxH2 * ratio;
            b.w = Math.min(1 - b.x, pxW2 / cropState.cw);
            b.h = (b.w * cropState.cw) / (ratio * cropState.ch);
          } else {
            var pxW = b.w * cropState.cw;
            var pxH = pxW / ratio;
            b.h = Math.min(1 - b.y, pxH / cropState.ch);
            b.w = (b.h * cropState.ch * ratio) / cropState.cw;
          }
        }
      }
      cropState.box = b;
      positionCropBoxDOM();
    });

    boxEl.addEventListener('lostpointercapture', function () {
      boxEl.classList.remove('dragging');
      if (!drag) return;
      drag = null;
      updateCropPreview();
    });

    boxEl.addEventListener('keydown', function (e) {
      if (!cropState) return;
      var step = e.shiftKey ? 0.05 : 0.015;
      var b = cropState.box;
      if (e.key === 'ArrowLeft') { e.preventDefault(); b.x = Math.max(0, b.x - step); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); b.x = Math.min(1 - b.w, b.x + step); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); b.y = Math.max(0, b.y - step); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); b.y = Math.min(1 - b.h, b.y + step); }
      else return;
      positionCropBoxDOM();
      updateCropPreview();
    });

    wrapEl.addEventListener('dblclick', function (e) {
      if (!cropState) return;
      var rect = wrapEl.getBoundingClientRect();
      var sx = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / (rect.width || 1)));
      var sy = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / (rect.height || 1)));
      autoDetectCropSubjectBox({ x: sx, y: sy });
      updateCropPreview();
      showToast(tr('অটো-সিলেকশন সম্পন্ন হয়েছে!', 'Auto-selection completed!'));
    });
  }

  /* ==================================================================
   * 4. FORMAT CONVERTER, PHOTO EFFECTS, WATERMARK & BORDER
   * ================================================================== */
  var convertState = null;
  var convertToken = 0;

  async function loadConvertFile(files) {
    try {
      var item = await loadImageFile(files[0]);
      if (convertState && convertState.item && convertState.item.url) URL.revokeObjectURL(convertState.item.url);
      convertState = { item: item, outBlob: null, outUrl: null };
      await renderConvertOutput();
      $('#imgConvertDropzone').hidden = true;
      $('#imgConvertStage').hidden = false;
      $('#imgConvertTopActions').hidden = false;
    } catch (e) {
      showToast(e.message || tr('ছবি লোড করা যায়নি', 'Failed to load image'));
    }
  }

  async function renderConvertOutput() {
    if (!convertState || !convertState.item) return;
    var token = ++convertToken;
    var it = convertState.item;
    var fmtEl = $('input[name="imgConvertFmt"]:checked');
    var fmtChoice = fmtEl ? fmtEl.value : 'image/jpeg';
    var isBase64 = fmtChoice === 'base64';
    var mime = isBase64 ? 'image/png' : fmtChoice;

    var br = parseInt($('#imgEffBright').value, 10) || 100;
    var ct = parseInt($('#imgEffContrast').value, 10) || 100;
    var st = parseInt($('#imgEffSat').value, 10) || 100;
    var gray = $('#imgEffGray').checked ? 100 : 0;
    var borderPx = Math.max(0, parseInt($('#imgEffBorder').value, 10) || 0);
    var borderColor = $('#imgEffBorderColor').value || '#ffffff';
    var wmText = ($('#imgWatermarkText').value || '').trim();
    var wmPos = $('#imgWatermarkPos').value || 'bottom';
    var wmColor = $('#imgWatermarkColor').value || '#ffffff';

    $('#imgEffBrightVal').textContent = br + '%';
    $('#imgEffContrastVal').textContent = ct + '%';
    $('#imgEffSatVal').textContent = st + '%';

    var w = it.width + borderPx * 2;
    var h = it.height + borderPx * 2;
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');

    if (borderPx > 0 || mime === 'image/jpeg') {
      ctx.fillStyle = borderPx > 0 ? borderColor : '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.save();
    ctx.filter = 'brightness(' + br + '%) contrast(' + ct + '%) saturate(' + st + '%) grayscale(' + gray + '%)';
    ctx.drawImage(it.img, borderPx, borderPx, it.width, it.height);
    ctx.restore();

    if (wmText) {
      var fontSize = Math.max(18, Math.round(Math.min(w, h) * 0.048));
      ctx.save();
      ctx.font = '700 ' + fontSize + 'px "Anek Bangla", "Noto Sans Bengali", sans-serif';
      ctx.fillStyle = wmColor;
      ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.12));
      ctx.lineJoin = 'round';
      var tx = w / 2, ty = h - borderPx - fontSize * 0.9;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (wmPos === 'center') {
        ty = h / 2;
      } else if (wmPos === 'top') {
        ty = borderPx + fontSize * 1.1;
      } else if (wmPos === 'br') {
        ctx.textAlign = 'right';
        tx = w - borderPx - fontSize * 0.7;
      }
      ctx.strokeText(wmText, tx, ty);
      ctx.fillText(wmText, tx, ty);
      ctx.restore();
    }

    var blob = await canvasToBlob(canvas, mime, 0.92);
    if (token !== convertToken || !convertState) return;
    if (convertState.outUrl) URL.revokeObjectURL(convertState.outUrl);
    convertState.outBlob = blob;
    convertState.outUrl = URL.createObjectURL(blob);
    convertState.mime = mime;

    $('#imgConvertOutPreview').src = convertState.outUrl;
    $('#imgConvertOutMeta').textContent = w + ' × ' + h + ' px • ' + fmtSize(blob.size);
    $('#imgConvertSummary').textContent = extFromMime(mime).toUpperCase() + ' • ' + fmtSize(blob.size);

    var b64Box = $('#imgBase64Box');
    if (isBase64) {
      b64Box.hidden = false;
      $('#imgBase64Output').value = canvas.toDataURL('image/png');
    } else {
      b64Box.hidden = true;
    }
  }


  /* ==================================================================
   * 5. SHARED SCAN GEOMETRY (ROTATION & 4/6-POINT PERSPECTIVE HOMOGRAPHY)
   * ================================================================== */
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
   * True 4-Corner Projective Homography Perspective Warp (`warpPerspectiveCard`).
   * Maps any tilted/skewed quadrilateral `pts = [TL, TR, BR, BL]` on `sourceCanvas`
   * into a flat, straight high-DPI rectangular canvas using bilinear pixel interpolation.
   */
  function warpPerspectiveCard(sourceCanvas, normPts, customMinW, customMaxW, preserveLongEdge, foldAxis) {
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
    var upScale = natW < minTargetW ? (minTargetW / natW) : (natW > maxTargetW ? (maxTargetW / natW) : 1);
    var outW = Math.max(120, Math.min(maxTargetW, Math.round(natW * upScale)));
    var outH = Math.max(80, Math.min(maxTargetW, Math.round(natH * upScale)));
    // Documents may be portrait or panoramic: constrain both dimensions together.
    if (preserveLongEdge) {
      var docScale = Math.min(1, maxTargetW / Math.max(natW, natH));
      outW = Math.max(16, Math.round(natW * docScale));
      outH = Math.max(16, Math.round(natH * docScale));
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

  /* ==================================================================
   * 6. COLOR PICKER & DOMINANT PALETTE
   * ================================================================== */
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (x) { return x.toString(16).padStart(2, '0'); }).join('').toUpperCase();
  }

  function setPickedColor(r, g, b) {
    var hex = rgbToHex(r, g, b);
    var rgb = 'rgb(' + r + ', ' + g + ', ' + b + ')';
    $('#imgPickedSwatch').style.background = hex;
    $('#imgPickedHex').textContent = hex;
    $('#imgPickedRgb').textContent = rgb;
  }

  async function loadColorsFile(files) {
    try {
      var item = await loadImageFile(files[0]);
      $('#imgColorsDropzone').hidden = true;
      $('#imgColorsStage').hidden = false;
      $('#imgColorsTopActions').hidden = false;

      var canvas = $('#imgColorsCanvas');
      var maxW = 560;
      var scale = Math.min(1, maxW / Math.max(item.width, item.height));
      canvas.width = Math.max(1, Math.round(item.width * scale));
      canvas.height = Math.max(1, Math.round(item.height * scale));
      var ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(item.img, 0, 0, canvas.width, canvas.height);

      // Extract dominant palette by bucketing RGB space
      var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      var buckets = {};
      var step = Math.max(4, Math.floor((data.length / 4) / 4000) * 4);
      for (var i = 0; i < data.length; i += step) {
        if (data[i + 3] < 128) continue;
        var qr = Math.round(data[i] / 32) * 32;
        var qg = Math.round(data[i + 1] / 32) * 32;
        var qb = Math.round(data[i + 2] / 32) * 32;
        var key = qr + ',' + qg + ',' + qb;
        if (!buckets[key]) buckets[key] = { count: 0, r: 0, g: 0, b: 0 };
        buckets[key].count++;
        buckets[key].r += data[i];
        buckets[key].g += data[i + 1];
        buckets[key].b += data[i + 2];
      }
      var sorted = Object.keys(buckets).map(function (k) {
        var b = buckets[k];
        return {
          count: b.count,
          r: Math.round(b.r / b.count),
          g: Math.round(b.g / b.count),
          b: Math.round(b.b / b.count)
        };
      }).sort(function (a, b) { return b.count - a.count; }).slice(0, 8);

      if (sorted.length) {
        setPickedColor(sorted[0].r, sorted[0].g, sorted[0].b);
      }

      var grid = $('#imgPaletteGrid');
      grid.innerHTML = '';
      sorted.forEach(function (c) {
        var hex = rgbToHex(c.r, c.g, c.b);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'img-palette-swatch';
        btn.innerHTML =
          '<span class="img-palette-swatch__color" style="background:' + hex + '"></span>' +
          '<span class="img-palette-swatch__hex">' + hex + '</span>';
        btn.addEventListener('click', function () {
          setPickedColor(c.r, c.g, c.b);
          if (navigator.clipboard) navigator.clipboard.writeText(hex);
          showToast(hex + tr(' কপি হয়েছে!', ' copied!'));
        });
        grid.appendChild(btn);
      });
    } catch (e) {
      showToast(e.message || tr('ছবি লোড করা যায়নি', 'Failed to load image'));
    }
  }

  /* ==================================================================
   * 7. PASSPORT SIZE PHOTO & PRINT SHEET MAKER (PHOTOSHOP STUDIO ENGINE + AI DSLR)
   * ================================================================== */
  var ppState = null;
  var ppPsController = null;

  var PP_SIZE_SPECS = {
    'passport-4x5':  { w: 472, h: 591, dispW: 4,   dispH: 5,   unit: 'cm', mmW: '40', mmH: '50', label: '4×5 cm • 472×591 px',     free: false },
    'bd-passport':   { w: 450, h: 570, dispW: 3.8, dispH: 4.8, unit: 'cm', mmW: '38', mmH: '48', label: '3.8×4.8 cm • 450×570 px', free: false },
    'intl-passport': { w: 413, h: 531, dispW: 3.5, dispH: 4.5, unit: 'cm', mmW: '35', mmH: '45', label: '3.5×4.5 cm • 413×531 px', free: false },
    'bd-stamp':      { w: 236, h: 295, dispW: 2,   dispH: 2.5, unit: 'cm', mmW: '20', mmH: '25', label: '2×2.5 cm • 236×295 px',   free: false },
    'us-visa':       { w: 600, h: 600, dispW: 2,   dispH: 2,   unit: 'in', mmW: '51', mmH: '51', label: '2×2 in • 600×600 px',     free: false },
    'nid-photo':     { w: 300, h: 300, dispW: 300, dispH: 300, unit: 'px', mmW: '25', mmH: '25', label: 'Online • 300×300 px',     free: false },
    'free':          { w: 472, h: 591, dispW: 4,   dispH: 5,   unit: 'cm', mmW: 'Free', mmH: '', label: 'Free Crop • Custom',      free: true }
  };

  var PP_AI_STYLE_PRESETS = {
    male: [
      {
        id: 'fit-current',
        titleBn: '✨ বর্তমান শার্ট ও কলার ফিট (DSLR)',
        titleEn: '✨ Tailor Current Shirt & Collar',
        subBn: 'কলার ভাঁজ, ইস্ত্রি ও স্টুডিও লুক',
        outfitPrompt: 'keeping the EXACT same existing shirt/polo/garment color, stripes, and pattern worn in the input photo, neatly folding down any popped or messy collar symmetrically, hiding/tucking any visible inner undershirt cleanly, centering the button placket vertically, ironing out all fabric wrinkles, and leveling both shoulders horizontally'
      },
      {
        id: 'navy-suit',
        titleBn: 'নেভি স্যুট ও টাই',
        titleEn: 'Navy Suit & Tie',
        subBn: 'কর্পোরেট ও অফিসিয়াল',
        outfitPrompt: 'wearing a tailored dark navy blue formal business suit jacket, crisp white collared dress shirt, and a neat classic silk tie'
      },
      {
        id: 'black-suit',
        titleBn: 'ব্ল্যাক ব্লেজার ও টাই',
        titleEn: 'Black Blazer & Tie',
        subBn: 'প্রিমিয়াম পাসপোর্ট লুক',
        outfitPrompt: 'wearing a classic charcoal black formal suit blazer, crisp white collared dress shirt, and a neat formal tie'
      },
      {
        id: 'white-shirt',
        titleBn: 'ফরমাল সাদা শার্ট',
        titleEn: 'Formal White Shirt',
        subBn: 'কলারসহ পরিপাটি শার্ট',
        outfitPrompt: 'wearing a clean, well-ironed formal white collared button-down dress shirt'
      },
      {
        id: 'sky-shirt',
        titleBn: 'হালকা নীল শার্ট',
        titleEn: 'Light Blue Shirt',
        subBn: 'স্মার্ট অফিস শার্ট',
        outfitPrompt: 'wearing a neat, well-fitted light sky-blue formal collared dress shirt'
      },
      {
        id: 'panjabi',
        titleBn: 'মার্জিত পাঞ্জাবি/কলার',
        titleEn: 'Formal Panjabi',
        subBn: 'ঐতিহ্যবাহী ও মার্জিত',
        outfitPrompt: 'wearing a neat, modest solid-colored formal band-collar Panjabi / kurta suitable for official ID photos'
      }
    ],
    female: [
      {
        id: 'fit-current',
        titleBn: '✨ বর্তমান ড্রেসই স্টুডিও ফিট (DSLR)',
        titleEn: '✨ Tailor Current Dress',
        subBn: 'ভাঁজ দূর ও পরিপাটি স্টুডিও ফিট',
        outfitPrompt: 'keeping the EXACT same existing dress/attire color and pattern worn in the input photo, neatly smoothing wrinkles, fixing collar/neckline symmetry, and leveling the shoulders cleanly for an official studio portrait'
      },
      {
        id: 'formal-kameez',
        titleBn: 'ফরমাল কামিজ / ড্রেস',
        titleEn: 'Formal Collar Dress',
        subBn: 'মার্জিত অফিসিয়াল লুক',
        outfitPrompt: 'wearing a modest, neat formal collared salwar kameez / professional South Asian formal attire with a clean neckline'
      },
      {
        id: 'blazer-shirt',
        titleBn: 'কর্পোরেট ব্লেজার',
        titleEn: 'Corporate Blazer',
        subBn: 'প্রফেশনাল ও পাসপোর্ট',
        outfitPrompt: 'wearing a tailored dark navy or black women\'s formal corporate blazer over a neat collared shirt'
      },
      {
        id: 'formal-saree',
        titleBn: 'মার্জিত ফরমাল শাড়ি',
        titleEn: 'Neat Formal Saree',
        subBn: 'ক্লাসিক ও অফিসিয়াল',
        outfitPrompt: 'wearing a neat, modest solid-bordered formal cotton/silk saree with a matching modest blouse pinned neatly at the shoulder'
      },
      {
        id: 'modest-hijab',
        titleBn: 'মার্জিত হিজাব ও ফরমাল',
        titleEn: 'Modest Hijab Attire',
        subBn: 'মুখমণ্ডল সম্পূর্ণ স্পষ্ট',
        outfitPrompt: 'wearing a neat, solid-colored modest hijab framing the face clearly from forehead to chin (full face and eyebrows completely visible for biometric compliance) with a modest formal top'
      },
      {
        id: 'white-shirt',
        titleBn: 'ফরমাল সাদা শার্ট',
        titleEn: 'Formal White Shirt',
        subBn: 'স্টুডেন্ট ও অফিস আইডি',
        outfitPrompt: 'wearing a crisp, clean formal white collared button-down shirt'
      }
    ],
    general: [
      {
        id: 'fit-current',
        titleBn: '✨ বর্তমান পোশাক স্টুডিও ফিট',
        titleEn: '✨ Tailor Current Attire',
        subBn: 'কলার ঠিক ও ভাঁজ দূর',
        outfitPrompt: 'keeping the person\'s exact existing clothing color, stripes, and style while neatly folding the collar symmetrically, smoothing wrinkles, and aligning shoulders cleanly'
      },
      {
        id: 'school-shirt',
        titleBn: 'স্কুল/কলেজ সাদা শার্ট',
        titleEn: 'White Uniform Shirt',
        subBn: 'শিক্ষার্থী ও স্টুডেন্ট আইডি',
        outfitPrompt: 'wearing a clean, neat white collared school/college uniform shirt'
      },
      {
        id: 'smart-formal',
        titleBn: 'স্মার্ট ফরমাল কলার',
        titleEn: 'Smart Formal Collar',
        subBn: 'সব বয়সের জন্য উপযুক্ত',
        outfitPrompt: 'wearing a clean, modest formal collared shirt suitable for an official biometric passport photo'
      },
      {
        id: 'dark-blazer',
        titleBn: 'অফিসিয়াল ডার্ক ব্লেজার',
        titleEn: 'Official Dark Blazer',
        subBn: 'পাসপোর্ট ও ভিসা স্ট্যান্ডার্ড',
        outfitPrompt: 'wearing a neat dark formal blazer over a white collared shirt'
      }
    ]
  };

  /**
   * DSLR Atmospheric De-Haze & Portrait Micro-Contrast Enhancer:
   * Removes indoor fluorescent white haze/glare from phone selfies and restores
   * deep rich hair/beard/eye blacks + natural warm studio skin tones.
   */
  function applyDslrPortraitClarity(ctx, w, h, dehazePct) {
    if (!dehazePct || dehazePct <= 1) return;
    var strength = Math.min(1, dehazePct / 100);
    var imgData = ctx.getImageData(0, 0, w, h);
    var d = imgData.data;
    // Estimate darkest channel floor in central portrait zone to remove indoor veil
    var darkSum = 0, samples = 0;
    var x0 = Math.floor(w * 0.2), x1 = Math.floor(w * 0.8);
    var y0 = Math.floor(h * 0.12), y1 = Math.floor(h * 0.85);
    for (var sy = y0; sy < y1; sy += 4) {
      for (var sx = x0; sx < x1; sx += 4) {
        var si = (sy * w + sx) * 4;
        if (d[si + 3] < 128) continue;
        var mn = Math.min(d[si], d[si + 1], d[si + 2]);
        darkSum += mn;
        samples++;
      }
    }
    var avgMin = samples > 0 ? darkSum / samples : 40;
    var veil = Math.min(48, Math.max(6, (avgMin - 18) * 0.55)) * strength;
    var gain = 255 / Math.max(180, 255 - veil * 0.92);

    for (var i = 0, len = d.length; i < len; i += 4) {
      if (d[i + 3] < 10) continue;
      var r = (d[i] - veil) * gain;
      var g = (d[i + 1] - veil) * gain;
      var b = (d[i + 2] - veil * 1.04) * gain;
      // Gentle S-curve + natural warm DSLR skin tone balance
      var sCurve = function (v) {
        var n = Math.max(0, Math.min(1, v / 255));
        var sc = n * n * (3 - 2 * n);
        return (n * (1 - 0.28 * strength) + sc * (0.28 * strength)) * 255;
      };
      r = sCurve(r) * (1 + 0.025 * strength);
      g = sCurve(g) * (1 + 0.008 * strength);
      b = sCurve(b) * (1 - 0.018 * strength);
      d[i]     = r < 0 ? 0 : (r > 255 ? 255 : Math.round(r));
      d[i + 1] = g < 0 ? 0 : (g > 255 ? 255 : Math.round(g));
      d[i + 2] = b < 0 ? 0 : (b > 255 ? 255 : Math.round(b));
    }
    ctx.putImageData(imgData, 0, 0);
  }

  /**
   * Studio Skin Smoothing & Fill-Light Retouching for Passport Portraits.
   */
  function applyPortraitRetouch(ctx, w, h, skinSmooth, studioLight) {
    if (!skinSmooth && !studioLight) return;
    var imgData = ctx.getImageData(0, 0, w, h);
    var d = imgData.data;
    var copy = skinSmooth ? new Uint8ClampedArray(d) : null;

    for (var y = 2; y < h - 2; y++) {
      for (var x = 2; x < w - 2; x++) {
        var idx = (y * w + x) * 4;
        var r = d[idx], g = d[idx + 1], b = d[idx + 2];

        if (skinSmooth && copy) {
          var isSkin = r > 75 && g > 38 && b > 22 && r > g && (r - b) > 15;
          if (isSkin) {
            var sr = r * 4, sg = g * 4, sb = b * 4, sw = 4;
            var offsets = [-w * 2, -w, -2, -1, 1, 2, w, w * 2];
            for (var k = 0; k < offsets.length; k++) {
              var nIdx = (y * w + x + offsets[k]) * 4;
              var nr = copy[nIdx], ng = copy[nIdx + 1], nb = copy[nIdx + 2];
              var diff = Math.abs(nr - r) + Math.abs(ng - g) + Math.abs(nb - b);
              if (diff < 42) {
                sr += nr; sg += ng; sb += nb; sw += 1;
              }
            }
            r = Math.round(sr / sw);
            g = Math.round(sg / sw);
            b = Math.round(sb / sw);
          }
        }

        if (studioLight) {
          var lift = function (v) {
            var n = v / 255;
            var lifted = Math.pow(n, 0.88) * 0.94 + n * 0.08;
            return Math.max(0, Math.min(255, Math.round(lifted * 255)));
          };
          r = lift(r);
          g = lift(g);
          b = lift(b);
        }

        d[idx] = r;
        d[idx + 1] = g;
        d[idx + 2] = b;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  /**
   * Computes exact 300-DPI pixel dimensions & physical mm size from Preset OR Custom W × H + Unit inputs.
   */
  function getActivePpSizeSpec() {
    var sel = $('#ppSizePreset');
    var key = (sel && sel.value) || 'passport-4x5';
    var base = PP_SIZE_SPECS[key] || PP_SIZE_SPECS['passport-4x5'];
    if (base.free) return base;

    var wInp = $('#ppCropW');
    var hInp = $('#ppCropH');
    var uSel = $('#ppCropUnit');
    var wVal = wInp ? parseFloat(wInp.value) : base.dispW;
    var hVal = hInp ? parseFloat(hInp.value) : base.dispH;
    var unit = (uSel && uSel.value) || base.unit || 'cm';

    if (!Number.isFinite(wVal) || wVal <= 0) wVal = base.dispW;
    if (!Number.isFinite(hVal) || hVal <= 0) hVal = base.dispH;

    var pxW, pxH, mmW, mmH, dimStr;
    if (unit === 'cm') {
      mmW = wVal * 10;
      mmH = hVal * 10;
      pxW = Math.round((mmW / 25.4) * 300);
      pxH = Math.round((mmH / 25.4) * 300);
      dimStr = wVal + '×' + hVal + ' cm';
    } else if (unit === 'mm') {
      mmW = wVal;
      mmH = hVal;
      pxW = Math.round((mmW / 25.4) * 300);
      pxH = Math.round((mmH / 25.4) * 300);
      dimStr = wVal + '×' + hVal + ' mm';
    } else if (unit === 'in') {
      mmW = wVal * 25.4;
      mmH = hVal * 25.4;
      pxW = Math.round(wVal * 300);
      pxH = Math.round(hVal * 300);
      dimStr = wVal + '×' + hVal + ' in';
    } else {
      pxW = Math.round(wVal);
      pxH = Math.round(hVal);
      mmW = (pxW / 300) * 25.4;
      mmH = (pxH / 300) * 25.4;
      dimStr = pxW + '×' + pxH + ' px';
    }
    pxW = Math.max(80, Math.min(2400, pxW));
    pxH = Math.max(80, Math.min(2400, pxH));

    return {
      w: pxW,
      h: pxH,
      mmW: String(Math.round(mmW)),
      mmH: String(Math.round(mmH)),
      dimText: dimStr,
      label: dimStr + ' • ' + pxW + '×' + pxH + ' px',
      free: false
    };
  }

  function autoStraightenAndCenterFace(state) {
    if (!state || !state.item) return { angle: 0, panX: 0, panY: 0 };
    var img = state.item.aiImg || state.item.img;
    if (!img) return { angle: 0, panX: 0, panY: 0 };
    var sw = 160;
    var sh = Math.max(120, Math.round((img.height / Math.max(1, img.width)) * sw));
    var c = document.createElement('canvas');
    c.width = sw;
    c.height = sh;
    var ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, sw, sh);
    var d = ctx.getImageData(0, 0, sw, sh).data;

    var sumX = 0, sumY = 0, count = 0;
    var leftEyeY = 0, leftN = 0, rightEyeY = 0, rightN = 0;

    for (var y = Math.floor(sh * 0.08); y < Math.floor(sh * 0.78); y++) {
      for (var x = Math.floor(sw * 0.12); x < Math.floor(sw * 0.88); x++) {
        var i = (y * sw + x) * 4;
        var r = d[i], g = d[i + 1], b = d[i + 2];
        var isSkin = r > 80 && g > 40 && b > 20 && r > g && (r - b) > 16 && (r - g) < 95;
        if (isSkin) {
          sumX += x;
          sumY += y;
          count++;
        }
      }
    }

    var cx = count > 40 ? (sumX / count) : sw * 0.5;
    var cy = count > 40 ? (sumY / count) : sh * 0.42;

    var eyeY0 = Math.max(4, Math.floor(cy - sh * 0.12));
    var eyeY1 = Math.min(sh - 4, Math.floor(cy + sh * 0.04));
    for (var ey = eyeY0; ey < eyeY1; ey++) {
      for (var ex = Math.max(4, Math.floor(cx - sw * 0.22)); ex < Math.min(sw - 4, Math.floor(cx + sw * 0.22)); ex++) {
        var ei = (ey * sw + ex) * 4;
        var lum = d[ei] * 0.299 + d[ei + 1] * 0.587 + d[ei + 2] * 0.114;
        var darkWeight = Math.max(0, 140 - lum);
        if (darkWeight > 15) {
          if (ex < cx - sw * 0.03) {
            leftEyeY += ey * darkWeight;
            leftN += darkWeight;
          } else if (ex > cx + sw * 0.03) {
            rightEyeY += ey * darkWeight;
            rightN += darkWeight;
          }
        }
      }
    }

    var angle = 0;
    if (leftN > 80 && rightN > 80) {
      var ly = leftEyeY / leftN;
      var ry = rightEyeY / rightN;
      var dxEye = sw * 0.18;
      var rawDeg = -Math.atan2(ry - ly, dxEye) * (180 / Math.PI) * 0.55;
      angle = Math.max(-8, Math.min(8, Math.round(rawDeg * 2) / 2));
    }

    return { angle: angle, panX: 0, panY: 0 };
  }

  var ppItems = [];
  var activePpIdx = 0;
  var ppUndoStack = [];
  var ppRedoStack = [];
  var ppActiveTool = 'crop'; // 'crop' | 'move' | 'picker' | 'brush' | 'eraser' | 'hand' | 'zoom'
  var ppActiveStep = 'edit'; // 'edit' | 'print'
  var ppBrushSubMode = 'paint'; // 'paint' | 'erase-bg' | 'restore-bg'
  var ppActiveLayerId = 'subject'; // 'paint' | 'adjust' | 'subject' | 'bg'
  var ppActiveCategory = 'male';
  var ppActiveStyleId = 'fit-current';
  var ppActiveBgHex = '#0088ff';
  var ppActiveBgName = 'vibrant studio passport sky blue (#0088FF)';

  var PP_AI_STORAGE_KEY = 'techhat_pp_ai_config';
  var ppAiConfig = {
    provider: 'free-flux',
    keys: { 'free-flux': '', gemini: '', grok: '', openai: '' }
  };

  function loadPpAiConfig() {
    try {
      var raw = localStorage.getItem(PP_AI_STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.provider) ppAiConfig.provider = parsed.provider;
          if (parsed.keys && typeof parsed.keys === 'object') {
            ppAiConfig.keys = Object.assign({ 'free-flux': '', gemini: '', grok: '', openai: '' }, parsed.keys);
          }
        }
      }
    } catch (_) {}
  }

  function savePpAiConfig() {
    try {
      localStorage.setItem(PP_AI_STORAGE_KEY, JSON.stringify(ppAiConfig));
    } catch (_) {}
  }

  function syncPpStateRef() {
    ppState = ppItems[activePpIdx] || null;
  }

  function ensureEntryPhotoshopState(entry) {
    if (!entry) return;
    if (!entry.layers) {
      entry.layers = {
        paint:   { id: 'paint',   nameBn: 'ব্রাশ ও রিটাচ (Brush)',   nameEn: 'Brush Retouch',    visible: true, locked: false, opacity: 100, blend: 'source-over', tx: 0, ty: 0, sx: 1, sy: 1, rot: 0 },
        adjust:  { id: 'adjust',  nameBn: 'কালার ও লাইট (Adjust)',    nameEn: 'Adjustments',      visible: true, locked: false, opacity: 100, blend: 'source-over', tx: 0, ty: 0, sx: 1, sy: 1, rot: 0 },
        subject: { id: 'subject', nameBn: 'পোর্ট্রেট ছবি (Portrait)', nameEn: 'Portrait Subject', visible: true, locked: false, opacity: 100, blend: 'source-over', tx: 0, ty: 0, sx: 1, sy: 1, rot: 0 },
        bg:      { id: 'bg',      nameBn: 'ব্যাকগ্রাউন্ড (Backdrop)', nameEn: 'Backdrop Fill',    visible: true, locked: true,  opacity: 100, blend: 'source-over', tx: 0, ty: 0, sx: 1, sy: 1, rot: 0 }
      };
    } else {
      ['paint', 'adjust', 'subject', 'bg'].forEach(function (k) {
        var l = entry.layers[k];
        if (l) {
          if (l.tx == null) l.tx = 0;
          if (l.ty == null) l.ty = 0;
          if (l.sx == null) l.sx = 1;
          if (l.sy == null) l.sy = 1;
          if (l.rot == null) l.rot = 0;
          if (l.locked == null) l.locked = k === 'bg';
        }
      });
    }
    if (entry.cropImgPanX == null) entry.cropImgPanX = 0;
    if (entry.cropImgPanY == null) entry.cropImgPanY = 0;
    if (entry.cropCommitted == null) entry.cropCommitted = false;
    if (entry.hasPaintLayer == null) entry.hasPaintLayer = false;
    if (entry.hasAdjustLayer == null) entry.hasAdjustLayer = false;
    if (!entry.cropBox) {
      var spec = getActivePpSizeSpec();
      var img = (entry.item && (entry.item.aiImg || entry.item.cutoutCanvas || entry.item.img)) || { width: 472, height: 591 };
      var iw = img.naturalWidth || img.width || 472;
      var ih = img.naturalHeight || img.height || 591;
      if (((entry.rot || 0) % 180 + 180) % 180 !== 0) {
        var tmp = iw; iw = ih; ih = tmp;
      }
      if (spec.free) {
        entry.cropBox = { x: 0, y: 0, w: 1, h: 1 };
      } else {
        var aspectNorm = (spec.w / Math.max(1, spec.h)) * (ih / Math.max(1, iw));
        var bw, bh;
        if (aspectNorm <= 1) {
          bh = 0.92;
          bw = bh * aspectNorm;
        } else {
          bw = 0.92;
          bh = bw / aspectNorm;
        }
        entry.cropBox = {
          x: (1 - bw) * 0.5,
          y: Math.max(0.02, (1 - bh) * 0.38),
          w: bw,
          h: bh
        };
      }
    }
  }

  function pushPpHistory() {
    if (!ppState) return;
    ensureEntryPhotoshopState(ppState);
    var paintSnap = ppState.paintCanvas ? ppState.paintCanvas.toDataURL('image/png') : null;
    ppUndoStack.push({
      cropImgPanX: ppState.cropImgPanX || 0,
      cropImgPanY: ppState.cropImgPanY || 0,
      rot: ppState.rot || 0,
      flipH: ppState.flipH || 1,
      straighten: ppState.straighten || 0,
      cropCommitted: !!ppState.cropCommitted,
      hasPaintLayer: !!ppState.hasPaintLayer,
      hasAdjustLayer: !!ppState.hasAdjustLayer,
      dslrClarity: !!ppState.dslrClarity,
      skinSmooth: !!ppState.skinSmooth,
      studioLight: !!ppState.studioLight,
      dehaze: ppState.dehaze || 0,
      sharpness: ppState.sharpness || 0,
      cropBox: ppState.cropBox ? Object.assign({}, ppState.cropBox) : null,
      layersSnap: JSON.parse(JSON.stringify(ppState.layers)),
      paintSnap: paintSnap,
      bgColor: ppActiveBgHex
    });
    if (ppUndoStack.length > 25) ppUndoStack.shift();
    ppRedoStack = [];
    if ($('#ppUndoBtn')) $('#ppUndoBtn').disabled = ppUndoStack.length === 0;
    if ($('#ppRedoBtn')) $('#ppRedoBtn').disabled = ppRedoStack.length === 0;
  }

  function setPpStep(step) {
    ppActiveStep = step === 'print' ? 'print' : 'edit';
    var pane = $('#img-pane-passport-photo');
    if (pane) pane.setAttribute('data-step', ppActiveStep);
    if (ppActiveStep === 'print') {
      renderPassportPhotoAndSheet();
    } else {
      updatePpStageVisibility();
    }
  }

  function updatePpStageVisibility() {
    var cropWrap = $('#ppCropInteractiveWrap');
    var editWrap = $('#ppEditedCanvasWrap');
    if (!cropWrap || !editWrap) return;
    var inCrop = ppActiveTool === 'crop';
    cropWrap.hidden = !inCrop;
    editWrap.hidden = inCrop;
    if (ppPsController) ppPsController.syncViewport();
    if (inCrop) {
      renderPpCropStage(true);
    } else {
      renderPassportPhotoAndSheet();
      renderPpTransformBox();
    }
  }

  function setPpTool(toolId) {
    ppActiveTool = toolId || 'crop';
    var pane = $('#img-pane-passport-photo');
    if (pane) pane.setAttribute('data-tool', ppActiveTool);

    // Sync Eraser tool shortcut -> Erase BG submode
    if (ppActiveTool === 'eraser') {
      ppBrushSubMode = 'erase-bg';
    } else if (ppActiveTool === 'brush' && ppBrushSubMode === 'erase-bg') {
      ppBrushSubMode = 'paint';
    }
    $$('#ppBrushSubModeGroup [data-pp-brush-mode]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-pp-brush-mode') === ppBrushSubMode ? 'true' : 'false');
    });

    // Auto-select movable layer when switching to Move Tool if Backdrop/Adjust is selected
    if (ppActiveTool === 'move' && ppState && ppState.layers) {
      var autoSel = !$('#ppMoveAutoSelect') || $('#ppMoveAutoSelect').checked;
      if (autoSel && (ppActiveLayerId === 'bg' || ppActiveLayerId === 'adjust')) {
        ppActiveLayerId = 'subject';
        renderPpLayersPanel();
      }
    }

    $$('#ppPsDock [data-pp-tool]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-pp-tool') === ppActiveTool ? 'true' : 'false');
    });

    var toolNames = {
      crop: 'Crop Tool (C)',
      move: 'Move Tool (V)',
      picker: 'Eyedropper (I)',
      brush: 'Brush Tool (B)',
      eraser: 'Mask Eraser (E)',
      hand: 'Hand Tool (H)',
      zoom: 'Zoom Tool (Z)'
    };
    if ($('#ppPsActiveToolName')) {
      $('#ppPsActiveToolName').textContent = toolNames[ppActiveTool] || 'Crop Tool';
    }
    var iconSrc = $('[data-pp-tool-icon="' + ppActiveTool + '"]');
    if (iconSrc && $('#ppPsActiveToolIconHost')) {
      $('#ppPsActiveToolIconHost').innerHTML = iconSrc.innerHTML;
    }

    $$('#ppPsOptionsBar [data-pp-opts]').forEach(function (el) {
      var tokens = (el.getAttribute('data-pp-opts') || '').split(/\s+/);
      el.hidden = tokens.indexOf(ppActiveTool) === -1;
    });

    if ($('#ppBrushCursor')) $('#ppBrushCursor').hidden = true;
    if ($('#ppPickerLoupe')) $('#ppPickerLoupe').hidden = true;

    var stageEl = $('#ppSingleStageWrap');
    if (stageEl) {
      var rotCur = (window.TechHatPsStudio && window.TechHatPsStudio.PS_ROTATE_CURSOR_SVG) || 'crosshair';
      stageEl.style.cursor = ppActiveTool === 'hand' ? 'grab' : (ppActiveTool === 'zoom' ? 'zoom-in' : (ppActiveTool === 'crop' ? rotCur : ''));
    }
    var outerZone = $('#ppCropRotateOuterZone');
    if (outerZone && window.TechHatPsStudio) {
      outerZone.style.cursor = window.TechHatPsStudio.PS_ROTATE_CURSOR_SVG;
    }

    var singleC = $('#ppSingleCanvas');
    if (singleC) {
      singleC.style.cursor =
        ppActiveTool === 'picker' ? 'crosshair'
        : (ppActiveTool === 'brush' || ppActiveTool === 'eraser' ? 'none'
        : (ppActiveTool === 'hand' ? 'grab'
        : (ppActiveTool === 'zoom' ? 'zoom-in' : 'move')));
    }

    updatePpStageVisibility();
  }

  function buildPassportAiPrompt() {
    var list = PP_AI_STYLE_PRESETS[ppActiveCategory] || PP_AI_STYLE_PRESETS.male;
    var preset = list.find(function (p) { return p.id === ppActiveStyleId; }) || list[0];
    var subjWord = ppActiveCategory === 'male'
      ? 'male subject'
      : (ppActiveCategory === 'female' ? 'female subject' : 'person');

    var headMode = ($('#ppAiHeadMode') && $('#ppAiHeadMode').value) || 'straighten';
    var hairMode = ($('#ppAiHairMode') && $('#ppAiHairMode').value) || 'trim-flyaway';
    var skinMode = ($('#ppAiSkinMode') && $('#ppAiSkinMode').value) || 'studio-hd';
    var beardMode = ($('#ppAiBeardMode') && $('#ppAiBeardMode').value) || 'keep';

    var parts = [
      'Transform this mobile portrait/selfie into an ultra-crisp 85mm f/5.6 DSLR studio biometric passport photograph of the EXACT same ' + subjWord + '.',
      'IDENTITY LOCK (CRITICAL): Preserve 100% of the person\'s exact real facial features, bone structure, eyes, nose, lips, eyebrows, and authentic skin tone without changing their identity.',
      'Garment & Collar Tailoring: Frame cleanly from chest and shoulders up, ' + preset.outfitPrompt + '.'
    ];

    if (headMode === 'straighten') {
      parts.push('Camera Perspective & Selfie Correction: Eliminate low-angle upward phone-camera perspective distortion and any mirror-selfie tilt so the camera is at dead-on eye level, head upright, chin level, looking straight into the lens with level symmetrical shoulders.');
    } else if (headMode === 'eye-contact') {
      parts.push('Posture: Align shoulders horizontally and ensure natural direct eye contact straight toward the camera.');
    }

    if (hairMode === 'neat-comb') {
      parts.push('Hair: Neatly comb, groom, and style the hair cleanly for a formal passport portrait while keeping their natural hair type and color.');
    } else if (hairMode === 'trim-flyaway') {
      parts.push('Hair: Render sharp individual hair strands, taming messy outer flyaways while preserving the exact natural parted hairstyle and volume.');
    } else {
      parts.push('Hair: Keep the person\'s exact natural hairstyle and hair volume unchanged.');
    }

    if (beardMode === 'trimmed') {
      parts.push('Facial Hair: Neatly trim, shape, and groom the beard and mustache cleanly with sharp hair detail.');
    } else if (beardMode === 'clean') {
      parts.push('Facial Hair: Make the face neatly clean-shaven.');
    } else if (beardMode === 'keep' && ppActiveCategory === 'male') {
      parts.push('Facial Hair: Keep the exact natural beard and mustache shape, rendering crisp clean individual beard hairs.');
    }

    if (skinMode === 'studio-hd') {
      parts.push('Studio DSLR Lighting & Skin: Remove all indoor fluorescent haze and glare; illuminate with balanced dual-softbox studio key and fill lighting, crisp catchlights in both eyes, rich natural color contrast, and realistic healthy skin pores (no plastic over-smoothing).');
    } else if (skinMode === 'blemish-free') {
      parts.push('Studio Lighting & Skin: Remove indoor haze, temporary blemishes, and harsh shadows under soft balanced studio lighting while preserving realistic natural skin texture.');
    }

    parts.push('Backdrop: Replace the entire background cleanly with a pure, flat, vibrant ' + ppActiveBgName + ' studio passport backdrop with zero clutter, zero halos, and crisp hair/shoulder edges.');

    var promptText = parts.join(' ');
    var promptEl = $('#ppAiPromptInput');
    if (promptEl) promptEl.value = promptText;
    return promptText;
  }

  function renderPpAiPresetButtons() {
    var container = $('#ppAiPresetList');
    if (!container) return;
    var list = PP_AI_STYLE_PRESETS[ppActiveCategory] || PP_AI_STYLE_PRESETS.male;
    if (!list.some(function (p) { return p.id === ppActiveStyleId; })) {
      ppActiveStyleId = list[0].id;
    }
    container.innerHTML = '';
    list.forEach(function (preset) {
      var isSelected = preset.id === ppActiveStyleId;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-ai-style', preset.id);
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      btn.className = 'p-2 rounded-lg border text-left transition cursor-pointer flex flex-col gap-0.5 ' +
        (isSelected
          ? 'border-indigo-500 bg-indigo-500/15 ring-1 ring-indigo-500/40 text-indigo-700 dark:text-indigo-300'
          : 'border-slate-200 dark:border-[#383838] bg-white dark:bg-[#2b2b2b] hover:border-indigo-400 text-slate-800 dark:text-slate-200');
      var titleEl = document.createElement('strong');
      titleEl.className = 'text-[11px] font-bold leading-tight block';
      titleEl.textContent = tr(preset.titleBn, preset.titleEn);
      var subEl = document.createElement('span');
      subEl.className = 'text-[9.5px] text-slate-500 dark:text-slate-400 leading-tight block';
      subEl.textContent = preset.subBn;
      btn.appendChild(titleEl);
      btn.appendChild(subEl);
      btn.addEventListener('click', function () {
        ppActiveStyleId = preset.id;
        renderPpAiPresetButtons();
        buildPassportAiPrompt();
      });
      container.appendChild(btn);
    });
    buildPassportAiPrompt();
  }

  function setPpApiDiagBanner(kind, messageText, actionUrl, actionLabel) {
    var box = $('#ppApiDiagBanner');
    if (!box) return;
    if (!messageText) {
      box.hidden = true;
      box.textContent = '';
      return;
    }
    box.hidden = false;
    box.className = 'p-2 rounded-lg border text-[10.5px] leading-relaxed ' + (
      kind === 'ok'
        ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200'
        : 'border-amber-300 dark:border-amber-500/40 bg-amber-50/90 dark:bg-amber-950/35 text-amber-900 dark:text-amber-200'
    );
    box.textContent = '';
    var span = document.createElement('span');
    span.textContent = messageText;
    box.appendChild(span);
    if (actionUrl && actionLabel) {
      box.appendChild(document.createTextNode(' '));
      var a = document.createElement('a');
      a.href = actionUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'font-bold underline text-indigo-700 dark:text-indigo-300';
      a.textContent = actionLabel;
      box.appendChild(a);
    }
  }

  async function discoverGeminiImageModels(apiKey) {
    var defaults = [
      'gemini-3.1-flash-image',
      'gemini-3.1-flash-lite-image',
      'gemini-2.5-flash-image',
      'gemini-nano-banana-2.1',
      'gemini-3-pro-image',
      'gemini-3.1-flash-image-preview',
      'gemini-3-pro-image-preview',
      'nano-banana-pro-preview'
    ];
    try {
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 8000) : null;
      var r = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models?key=' + encodeURIComponent(apiKey),
        ctrl ? { signal: ctrl.signal } : undefined
      );
      if (timer) clearTimeout(timer);
      if (!r.ok) return { ok: false, status: r.status, models: defaults };
      var j = await r.json();
      var availableSet = {};
      var discovered = [];
      ((j && j.models) || []).forEach(function (m) {
        var id = String(m.name || '').replace(/^models\//, '');
        var methods = m.supportedGenerationMethods || [];
        if (methods.indexOf('generateContent') === -1) return;
        availableSet[id] = true;
        if (/(-image|nano-banana)/i.test(id) && !/tts|embed/i.test(id)) {
          discovered.push(id);
        }
      });
      var ordered = defaults.filter(function (d) { return availableSet[d]; });
      discovered.forEach(function (d) {
        if (ordered.indexOf(d) === -1) ordered.push(d);
      });
      return { ok: true, status: 200, models: ordered.length ? ordered : defaults };
    } catch (_) {
      return { ok: false, status: 0, models: defaults };
    }
  }

  function syncPpApiUi() {
    var provider = ppAiConfig.provider || 'free-flux';
    var key = (ppAiConfig.keys && ppAiConfig.keys[provider]) || '';
    $$('#ppAiProviderTabs [data-ai-provider]').forEach(function (btn) {
      var act = btn.getAttribute('data-ai-provider') === provider;
      btn.setAttribute('aria-pressed', act ? 'true' : 'false');
    });
    if ($('#ppFreeFluxBanner')) {
      $('#ppFreeFluxBanner').hidden = provider !== 'free-flux';
    }
    if ($('#ppGeminiModelWrap')) {
      $('#ppGeminiModelWrap').hidden = provider !== 'gemini';
    }
    var inp = $('#ppApiKeyInput');
    if (inp) {
      inp.value = key;
      inp.placeholder = provider === 'free-flux'
        ? tr('ঐচ্ছিক ফ্রি HF Token (hf_...) — না দিলেও ফ্রি চলবে', 'Optional Free HF Token (hf_...) — works without key')
        : (provider === 'gemini'
            ? 'Google AI Studio / Vertex Key (AIza... বা AQ....)'
            : (provider === 'grok' ? 'xAI Grok API Key (xai-...)' : 'OpenAI API Key (sk-...)'));
    }
    var link = $('#ppGetApiKeyLink');
    var linkTxt = $('#ppGetApiKeyText');
    if (link && linkTxt) {
      if (provider === 'free-flux') {
        link.href = 'https://huggingface.co/settings/tokens';
        linkTxt.textContent = tr('ঐচ্ছিক: ফ্রি HuggingFace Token নিন (বেশি কোটার জন্য)', 'Optional: Get Free HuggingFace Token (5x Quota)');
      } else if (provider === 'gemini') {
        link.href = 'https://aistudio.google.com/apikey';
        linkTxt.textContent = tr('Google AI Studio থেকে API Key নিন', 'Get API Key from Google AI Studio');
      } else if (provider === 'grok') {
        link.href = 'https://console.x.ai/';
        linkTxt.textContent = tr('xAI Console থেকে Grok API Key নিন', 'Get Grok API Key from xAI Console');
      } else {
        link.href = 'https://platform.openai.com/api-keys';
        linkTxt.textContent = tr('OpenAI Platform থেকে API Key নিন', 'Get API Key from OpenAI Platform');
      }
    }
    var badge = $('#ppApiStatusBadge');
    var hudBadge = $('#ppAiActiveBadge');
    var providerLabel = provider === 'free-flux'
      ? 'FLUX Kontext ফ্রি'
      : (provider === 'gemini' ? 'Google Gemini' : (provider === 'grok' ? 'Grok (xAI)' : 'OpenAI'));
    if (badge) {
      if (provider === 'free-flux') {
        badge.textContent = key && key.length >= 8 ? 'HF Pro কোটা ✓' : tr('১০০% ফ্রি রেডি ✓', '100% Free Ready ✓');
        badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
      } else if (key && key.length >= 10) {
        badge.textContent = providerLabel + ' সংযুক্ত ✓';
        badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
      } else {
        badge.textContent = tr('API Key দিন', 'Enter API Key');
        badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300';
      }
    }
    if (hudBadge) {
      hudBadge.textContent = provider === 'free-flux'
        ? 'FLUX Kontext Free AI Ready'
        : ((key && key.length >= 10) ? (providerLabel + ' AI Ready') : 'Photoshop Studio Ready');
    }
  }

  function renderPpDocTabs() {
    var tabBar = $('#ppDocTabsBar');
    if (!tabBar) return;
    tabBar.textContent = '';
    var zPct = ppPsController ? Math.round(ppPsController.getZoom() * 100) : 100;

    ppItems.forEach(function (entry, idx) {
      var active = idx === activePpIdx;
      var fname = (entry.item && entry.item.name) || ('Photo-' + (idx + 1) + '.jpg');
      var tab = document.createElement('div');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.className = 'inline-flex items-center gap-2 h-[24px] px-2.5 rounded-t-[3px] border border-b-0 text-[11px] font-medium cursor-pointer transition shrink-0 ' +
        (active
          ? 'bg-[#dcdcdc] dark:bg-[#252526] border-slate-300 dark:border-[#383838] text-slate-900 dark:text-white font-semibold'
          : 'bg-slate-200/75 dark:bg-[#161618] border-transparent text-slate-500 dark:text-[#8e8e96] hover:text-slate-800 dark:hover:text-[#d4d4d4]');

      var labelSpan = document.createElement('span');
      labelSpan.className = 'truncate max-w-[220px] font-mono text-[10.5px]';
      labelSpan.textContent = fname + ' @ ' + (active ? zPct : 100) + '% (RGB/8)';
      if (active) labelSpan.id = 'ppActiveDocTabLabel';

      var closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'w-4 h-4 rounded-xs inline-flex items-center justify-center text-[11px] text-slate-400 hover:text-rose-500 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer';
      closeBtn.textContent = '×';
      closeBtn.title = tr('ট্যাব বন্ধ করুন', 'Close Document');
      closeBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (ppItems.length <= 1) {
          var rst = $('#ppClearAllBtn');
          if (rst) rst.click();
          return;
        }
        ppItems.splice(idx, 1);
        activePpIdx = Math.max(0, Math.min(activePpIdx, ppItems.length - 1));
        syncPpStateRef();
        renderPpFilmstrip();
        renderPpLayersPanel();
        updatePpStageVisibility();
      });

      tab.appendChild(labelSpan);
      tab.appendChild(closeBtn);
      tab.addEventListener('click', function () {
        if (activePpIdx === idx) return;
        activePpIdx = idx;
        syncPpStateRef();
        renderPpFilmstrip();
        renderPpLayersPanel();
        updatePpStageVisibility();
      });
      tabBar.appendChild(tab);
    });
  }

  function renderPpLayersPanel() {
    syncPpStateRef();
    var listEl = $('#ppLayerList');
    if (!listEl || !ppState) return;
    ensureEntryPhotoshopState(ppState);

    var hasCutout = !!(ppState.item && ppState.item.cutoutCanvas);
    var hasPaint = !!(ppState.hasPaintLayer || ppState.paintCanvas);
    var hasAdjust = !!(
      ppState.hasAdjustLayer ||
      ppState.dslrClarity ||
      ppState.skinSmooth ||
      ppState.studioLight ||
      (ppState.dehaze && ppState.dehaze > 0) ||
      (ppState.sharpness && ppState.sharpness > 0) ||
      ($('#ppBright') && $('#ppBright').value !== '100') ||
      ($('#ppContrast') && $('#ppContrast').value !== '100') ||
      ($('#ppSat') && $('#ppSat').value !== '100')
    );

    var visibleOrder = [];
    if (hasPaint) visibleOrder.push('paint');
    if (hasAdjust) visibleOrder.push('adjust');
    visibleOrder.push('subject');
    if (hasCutout) visibleOrder.push('bg');

    if (visibleOrder.indexOf(ppActiveLayerId) === -1) {
      ppActiveLayerId = 'subject';
    }
    if ($('#ppLayerCount')) {
      $('#ppLayerCount').textContent = String(visibleOrder.length);
    }

    listEl.textContent = '';

    visibleOrder.forEach(function (lid) {
      var lyr = ppState.layers[lid];
      if (!lyr) return;
      var isSel = ppActiveLayerId === lid;
      var isSingleBg = (lid === 'subject' && !hasCutout);

      var row = document.createElement('div');
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', isSel ? 'true' : 'false');
      row.className = 'flex items-center gap-2 px-2 py-1.5 rounded-[3px] border text-[11px] cursor-pointer transition select-none ' +
        (isSel
          ? 'bg-sky-600/20 dark:bg-[#1473e6]/35 border-sky-500/70 text-slate-900 dark:text-white font-bold'
          : 'bg-white dark:bg-[#2b2b2b] border-slate-200 dark:border-[#343434] text-slate-700 dark:text-[#d4d4d4] hover:bg-slate-100 dark:hover:bg-[#353535]');

      var eyeBtn = document.createElement('button');
      eyeBtn.type = 'button';
      eyeBtn.title = lyr.visible ? 'লেয়ার লুকান (Hide Layer)' : 'লেয়ার দেখান (Show Layer)';
      eyeBtn.className = 'w-5 h-5 rounded flex items-center justify-center text-[11px] border border-slate-300/70 dark:border-white/10 ' +
        (lyr.visible ? 'bg-slate-100 dark:bg-[#383838] text-sky-500' : 'bg-transparent text-slate-400 opacity-45');
      eyeBtn.textContent = lyr.visible ? '👁' : '—';
      eyeBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        lyr.visible = !lyr.visible;
        renderPpLayersPanel();
        if (ppActiveTool === 'crop') renderPpCropStage(true);
        else renderPassportPhotoAndSheet();
      });

      var swatch = document.createElement('span');
      swatch.className = 'w-6 h-6 rounded-[2px] border border-slate-400 dark:border-white/30 shrink-0 flex items-center justify-center text-[9px] font-mono overflow-hidden bg-[#181818]';
      if (lid === 'bg') {
        swatch.style.background = ppActiveBgHex || '#0088ff';
      } else if (lid === 'adjust') {
        swatch.style.background = 'linear-gradient(135deg,#0ea5e9,#f59e0b)';
        swatch.style.color = '#fff';
        swatch.textContent = '◐';
      } else if (lid === 'paint') {
        swatch.style.background = 'conic-gradient(#cbd5e1 25%,#fff 0 50%,#cbd5e1 0 75%,#fff 0)';
        swatch.style.backgroundSize = '6px 6px';
        if (ppState.paintCanvas) {
          var pImg = document.createElement('img');
          pImg.className = 'w-full h-full object-contain';
          try { pImg.src = ppState.paintCanvas.toDataURL('image/png'); } catch (_) {}
          swatch.appendChild(pImg);
        } else {
          swatch.textContent = '🖌';
        }
      } else {
        swatch.style.background = 'conic-gradient(#cbd5e1 25%,#fff 0 50%,#cbd5e1 0 75%,#fff 0)';
        swatch.style.backgroundSize = '6px 6px';
        var sImg = document.createElement('img');
        sImg.className = 'w-full h-full object-cover';
        sImg.alt = 'Layer thumbnail';
        sImg.src = ppState._thumbUrl || (ppState.item && ppState.item.url) || '';
        swatch.appendChild(sImg);
      }

      var lbl = document.createElement('span');
      lbl.className = 'flex-1 truncate';
      lbl.textContent = isSingleBg
        ? 'Background'
        : tr(lyr.nameBn, lyr.nameEn);
      if (isSingleBg) lbl.className += ' italic';

      var opTag = document.createElement('span');
      opTag.className = 'text-[10px] font-mono text-slate-400';
      opTag.textContent = ((lyr.locked || isSingleBg) ? '🔒 ' : '') + lyr.opacity + '%';

      row.appendChild(eyeBtn);
      row.appendChild(swatch);
      row.appendChild(lbl);
      row.appendChild(opTag);

      row.addEventListener('click', function () {
        ppActiveLayerId = lid;
        renderPpLayersPanel();
        renderPpTransformBox();
      });

      listEl.appendChild(row);
    });

    var activeLyr = ppState.layers[ppActiveLayerId];
    if (activeLyr) {
      if ($('#ppLayerBlendMode')) $('#ppLayerBlendMode').value = activeLyr.blend || 'source-over';
      if ($('#ppLayerOpacity')) $('#ppLayerOpacity').value = String(activeLyr.opacity);
      if ($('#ppLayerLockBtn')) $('#ppLayerLockBtn').setAttribute('aria-pressed', activeLyr.locked ? 'true' : 'false');
    }
  }

  function renderPpFilmstrip() {
    renderPpDocTabs();
    var listEl = $('#ppPhotoList');
    var countBadge = $('#ppPhotoCountBadge');
    var n = ppItems.length;
    if (countBadge) countBadge.textContent = toBn(n);

    if (!listEl) return;
    listEl.innerHTML = '';
    ppItems.forEach(function (entry, idx) {
      var active = idx === activePpIdx;
      var card = document.createElement('div');
      card.className = 'group relative flex flex-col gap-1.5 p-2 rounded-xl border text-left transition-all cursor-pointer shrink-0 ' +
        (active
          ? 'border-sky-500 bg-sky-500/10 dark:bg-sky-500/15 ring-2 ring-sky-500/25 shadow-xs'
          : 'border-slate-200 dark:border-[#343434] bg-white dark:bg-[#252526] hover:border-sky-400');

      var headRow = document.createElement('div');
      headRow.className = 'flex items-center justify-between gap-1 min-w-0';

      var titleWrap = document.createElement('div');
      titleWrap.className = 'inline-flex items-center gap-1.5 min-w-0';

      var numBadge = document.createElement('span');
      numBadge.className = 'inline-flex items-center justify-center w-4.5 h-4.5 rounded-full text-[10px] font-extrabold shrink-0 ' +
        (active ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-[#383838] text-slate-700 dark:text-slate-300');
      numBadge.textContent = toBn(idx + 1);

      var titleEl = document.createElement('strong');
      titleEl.className = 'text-[11px] font-bold text-slate-900 dark:text-white truncate';
      titleEl.textContent = entry.item.name || (tr('ছবি ', 'Photo ') + toBn(idx + 1));

      titleWrap.appendChild(numBadge);
      titleWrap.appendChild(titleEl);

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.title = tr('মুছুন', 'Remove');
      delBtn.className = 'w-5 h-5 rounded-md grid place-items-center text-slate-400 hover:text-rose-500 cursor-pointer';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (ppItems.length <= 1) {
          var rst = $('#ppClearAllBtn');
          if (rst) rst.click();
          return;
        }
        ppItems.splice(idx, 1);
        activePpIdx = Math.max(0, Math.min(activePpIdx, ppItems.length - 1));
        syncPpStateRef();
        renderPpFilmstrip();
        renderPpLayersPanel();
        updatePpStageVisibility();
      });

      headRow.appendChild(titleWrap);
      headRow.appendChild(delBtn);

      var thumbWrap = document.createElement('div');
      thumbWrap.className = 'w-full rounded-lg overflow-hidden bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#343434] relative flex items-center justify-center p-1';
      thumbWrap.style.height = '136px';
      var thumbImg = document.createElement('img');
      thumbImg.alt = titleEl.textContent;
      thumbImg.setAttribute('data-pp-thumb-idx', String(idx));
      thumbImg.className = 'w-full h-full object-contain rounded-[3px]';
      thumbImg.src = entry._thumbUrl || entry.item.url || '';
      thumbWrap.appendChild(thumbImg);

      card.appendChild(headRow);
      card.appendChild(thumbWrap);

      card.addEventListener('click', function () {
        if (activePpIdx === idx) return;
        activePpIdx = idx;
        syncPpStateRef();
        if ($('#ppAiRevertBtn')) {
          $('#ppAiRevertBtn').hidden = !(ppState && ppState.item && ppState.item.aiImg);
        }
        renderPpFilmstrip();
        renderPpLayersPanel();
        updatePpStageVisibility();
      });
      listEl.appendChild(card);
    });
  }

  /**
   * Builds the unrotated base source canvas (orientation 0/90/180/270 + flip + backdrop + subject)
   * ONCE per source change so live Crop/Rotate/Pan runs at pure 60fps GPU speed!
   */
  function rebuildPpCropBaseCanvas(state) {
    var it = state.item;
    var activeImg = it.aiImg || it.cutoutCanvas || it.img;
    var imgW = activeImg.naturalWidth || activeImg.width || it.width || 600;
    var imgH = activeImg.naturalHeight || activeImg.height || it.height || 750;

    var rotDeg = ((state.rot || 0) % 360 + 360) % 360;
    var swapped = rotDeg === 90 || rotDeg === 270;
    var cw = swapped ? imgH : imgW;
    var ch = swapped ? imgW : imgH;

    var maxSide = 1150;
    if (cw > maxSide || ch > maxSide) {
      var sc = Math.min(maxSide / cw, maxSide / ch);
      cw = Math.max(64, Math.round(cw * sc));
      ch = Math.max(64, Math.round(ch * sc));
    }

    var c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    var ctx = c.getContext('2d', { willReadFrequently: true });

    ensureEntryPhotoshopState(state);
    var bgLyr = state.layers.bg;
    var subjLyr = state.layers.subject;
    var adjLyr = state.layers.adjust;

    if (bgLyr && bgLyr.visible) {
      ctx.save();
      ctx.globalAlpha = (bgLyr.opacity || 100) / 100;
      ctx.fillStyle = ppActiveBgHex || '#0088ff';
      ctx.fillRect(0, 0, cw, ch);
      ctx.restore();
    }

    if (!subjLyr || subjLyr.visible) {
      var bright = ($('#ppBright') && parseInt($('#ppBright').value, 10)) || 100;
      var contrast = ($('#ppContrast') && parseInt($('#ppContrast').value, 10)) || 100;
      var sat = ($('#ppSat') && parseInt($('#ppSat').value, 10)) || 100;

      ctx.save();
      ctx.globalAlpha = ((subjLyr && subjLyr.opacity) || 100) / 100;
      ctx.globalCompositeOperation = (subjLyr && subjLyr.blend) || 'source-over';
      ctx.translate(cw * 0.5, ch * 0.5);
      if (state.flipH === -1) ctx.scale(-1, 1);
      ctx.rotate((rotDeg * Math.PI) / 180);
      if (!adjLyr || adjLyr.visible) {
        ctx.filter = 'brightness(' + bright + '%) contrast(' + contrast + '%) saturate(' + sat + '%)';
      }
      var drawW = swapped ? ch : cw;
      var drawH = swapped ? cw : ch;
      ctx.drawImage(activeImg, -drawW * 0.5, -drawH * 0.5, drawW, drawH);
      ctx.restore();
    }

    state._cropBaseCanvas = c;
    return c;
  }

  /**
   * Composites continuous fine rotation (`state.straighten`) + crop pan (`cropImgPanX/Y`)
   * matching the 60fps CSS transform on `#ppCropSourceCanvas` pixel-for-pixel.
   */
  function buildFullTransformedSubjectCanvas(state) {
    var baseC = rebuildPpCropBaseCanvas(state);
    var cw = baseC.width;
    var ch = baseC.height;
    var deg = Number(state.straighten) || 0;
    var panXNorm = Number(state.cropImgPanX) || 0;
    var panYNorm = Number(state.cropImgPanY) || 0;

    if (Math.abs(deg) < 0.02 && Math.abs(panXNorm) < 0.001 && Math.abs(panYNorm) < 0.001) {
      return baseC;
    }

    var out = document.createElement('canvas');
    out.width = cw;
    out.height = ch;
    var octx = out.getContext('2d', { willReadFrequently: true });
    if (state.layers.bg && state.layers.bg.visible) {
      octx.fillStyle = ppActiveBgHex || '#0088ff';
      octx.fillRect(0, 0, cw, ch);
    }
    var rad = (deg * Math.PI) / 180;
    var rotScale = 1 + Math.abs(Math.sin(rad)) * 0.36;
    octx.save();
    octx.translate(cw * (0.5 + panXNorm), ch * (0.5 + panYNorm));
    octx.rotate(rad);
    octx.scale(rotScale, rotScale);
    octx.drawImage(baseC, -cw * 0.5, -ch * 0.5, cw, ch);
    octx.restore();
    return out;
  }

  /**
   * Ultra-fast 60fps DOM-only update during Crop Box resize, pan, or outside-box rotation!
   * Zero canvas allocations or PNG encoding on pointermove!
   */
  function syncPpCropDomFast() {
    if (!ppState) return;
    var cropCanvas = $('#ppCropSourceCanvas');
    var cropBoxEl = $('#ppCropBox');
    if (!cropCanvas || !cropBoxEl) return;

    var b = ppState.cropBox;
    cropBoxEl.style.left = (b.x * 100).toFixed(2) + '%';
    cropBoxEl.style.top = (b.y * 100).toFixed(2) + '%';
    cropBoxEl.style.width = (b.w * 100).toFixed(2) + '%';
    cropBoxEl.style.height = (b.h * 100).toFixed(2) + '%';

    var deg = Number(ppState.straighten) || 0;
    var pxN = Number(ppState.cropImgPanX) || 0;
    var pyN = Number(ppState.cropImgPanY) || 0;
    var rad = (deg * Math.PI) / 180;
    var rotScale = Math.abs(deg) > 0.05 ? (1 + Math.abs(Math.sin(rad)) * 0.36) : 1;

    cropCanvas.style.transform =
      Math.abs(deg) < 0.02 && Math.abs(pxN) < 0.001 && Math.abs(pyN) < 0.001
        ? ''
        : 'translate3d(' + (pxN * 100).toFixed(2) + '%,' + (pyN * 100).toFixed(2) + '%,0) rotate(' + deg.toFixed(2) + 'deg) scale(' + rotScale.toFixed(4) + ')';

    var angleInp = $('#ppStraightenAngle');
    if (angleInp && document.activeElement !== angleInp) {
      angleInp.value = deg.toFixed(1);
    }
    var anglePill = $('#ppCropLiveAnglePill');
    if (anglePill) {
      anglePill.hidden = Math.abs(deg) < 0.05;
      anglePill.textContent = (deg > 0 ? '+' : '') + deg.toFixed(1) + '°';
    }

    var spec = getActivePpSizeSpec();
    if ($('#ppCropDimReadout')) {
      if (spec.free && ppState._cropBaseCanvas) {
        var pxW = Math.max(1, Math.round(b.w * ppState._cropBaseCanvas.width));
        var pxH = Math.max(1, Math.round(b.h * ppState._cropBaseCanvas.height));
        $('#ppCropDimReadout').textContent = pxW + '×' + pxH + ' px';
      } else {
        $('#ppCropDimReadout').textContent = spec.dimText || (spec.mmW + '×' + spec.mmH + ' mm');
      }
    }
  }

  function renderPpCropStage(forceRedrawSource) {
    syncPpStateRef();
    if (!ppState || !ppState.item) return;
    ensureEntryPhotoshopState(ppState);

    var cropCanvas = $('#ppCropSourceCanvas');
    if (!cropCanvas) return;

    if (forceRedrawSource || !ppState._cropBaseCanvas) {
      var baseC = rebuildPpCropBaseCanvas(ppState);
      cropCanvas.width = baseC.width;
      cropCanvas.height = baseC.height;
      var cctx = cropCanvas.getContext('2d');
      cctx.clearRect(0, 0, baseC.width, baseC.height);
      cctx.drawImage(baseC, 0, 0);
    }
    syncPpCropDomFast();
  }

  /**
   * Renders the Photoshop Free-Transform Bounding Box (`#ppTransformBox`) around the active layer in Move Tool (`V`).
   */
  function renderPpTransformBox() {
    var box = $('#ppTransformBox');
    if (!box) return;
    var showChk = $('#ppShowTransform');
    var showOn = Boolean(showChk && showChk.checked);
    if (!ppState || ppActiveStep !== 'edit' || ppActiveTool !== 'move' || !showOn) {
      box.hidden = true;
      return;
    }
    ensureEntryPhotoshopState(ppState);
    var lyr = ppState.layers[ppActiveLayerId];
    if (!lyr || lyr.locked || ppActiveLayerId === 'adjust') {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    var sx = lyr.sx || 1;
    var sy = lyr.sy || 1;
    var tx = lyr.tx || 0;
    var ty = lyr.ty || 0;
    var rot = lyr.rot || 0;
    box.style.left = (((1 - sx) * 0.5 + tx) * 100).toFixed(2) + '%';
    box.style.top = (((1 - sy) * 0.5 + ty) * 100).toFixed(2) + '%';
    box.style.width = (sx * 100).toFixed(2) + '%';
    box.style.height = (sy * 100).toFixed(2) + '%';
    box.style.transform = rot ? ('rotate(' + rot.toFixed(2) + 'deg)') : '';

    var tfRotOuter = $('#ppTfRotateOuter');
    if (tfRotOuter && window.TechHatPsStudio) {
      tfRotOuter.style.cursor = window.TechHatPsStudio.PS_ROTATE_CURSOR_SVG;
    }
  }

  function applySimpleUnsharpMask(ctx, w, h, amountPct) {
    if (!amountPct || amountPct <= 2) return;
    var amt = (amountPct / 100) * 0.85;
    var imgD = ctx.getImageData(0, 0, w, h);
    var d = imgD.data;
    var src = new Uint8ClampedArray(d);
    for (var y = 1; y < h - 1; y++) {
      var row = y * w;
      for (var x = 1; x < w - 1; x++) {
        var i = (row + x) * 4;
        for (var c = 0; c < 3; c++) {
          var center = src[i + c];
          var blur = (src[i - 4 + c] + src[i + 4 + c] + src[i - w * 4 + c] + src[i + w * 4 + c]) * 0.25;
          var v = center + (center - blur) * amt;
          d[i + c] = v < 0 ? 0 : (v > 255 ? 255 : v);
        }
      }
    }
    ctx.putImageData(imgD, 0, 0);
  }

  function syncPpAdjustSliderFills() {
    var pairs = [
      { key: 'bright', id: 'ppBright', outId: 'ppBrightVal', suffix: '%' },
      { key: 'contrast', id: 'ppContrast', outId: 'ppContrastVal', suffix: '%' },
      { key: 'sat', id: 'ppSat', outId: 'ppSatVal', suffix: '%' },
      { key: 'dehaze', id: 'ppDehaze', outId: 'ppDehazeVal', suffix: '%' },
      { key: 'sharp', id: 'ppSharpness', outId: 'ppSharpnessVal', suffix: '%' }
    ];
    pairs.forEach(function (p) {
      var inp = $('#' + p.id);
      if (!inp) return;
      var v = Number(inp.value) || 0;
      var mn = Number(inp.min) || 0;
      var mx = Number(inp.max) || 100;
      var pct = mx > mn ? Math.max(0, Math.min(100, ((v - mn) / (mx - mn)) * 100)) : 0;
      var out = $('#' + p.outId);
      if (out) out.textContent = v + p.suffix;
      var fill = $('[data-pp-adj-fill="' + p.key + '"]');
      if (fill) fill.style.width = pct.toFixed(1) + '%';
    });
  }

  function renderPassportPhotoAndSheet(forceSheetRender) {
    syncPpStateRef();
    if (!ppState || !ppState.item) return;
    ensureEntryPhotoshopState(ppState);

    var singleCanvas = $('#ppSingleCanvas');
    var sheetCanvas = $('#ppSheetCanvas');
    if (!singleCanvas || !sheetCanvas) return;

    syncPpAdjustSliderFills();

    var fullC = buildFullTransformedSubjectCanvas(ppState);
    ppState._fullWorkCanvas = fullC;

    var spec = getActivePpSizeSpec();
    var isCommitted = !!ppState.cropCommitted;
    var b = isCommitted ? ppState.cropBox : { x: 0, y: 0, w: 1, h: 1 };
    var outW, outH;
    if (!isCommitted) {
      outW = fullC.width;
      outH = fullC.height;
    } else if (spec.free) {
      outW = Math.max(80, Math.round(b.w * fullC.width));
      outH = Math.max(80, Math.round(b.h * fullC.height));
    } else {
      outW = spec.w;
      outH = spec.h;
    }

    var sharp = ($('#ppSharpness') && parseInt($('#ppSharpness').value, 10)) || 0;
    var dehaze = ($('#ppDehaze') && parseInt($('#ppDehaze').value, 10)) || 0;
    ppState.sharpness = sharp;
    ppState.dehaze = dehaze;
    var hasBorder = Boolean($('#ppShowBorder') && $('#ppShowBorder').checked);

    var origW = (ppState.item && ppState.item.width) || outW;
    var origH = (ppState.item && ppState.item.height) || outH;
    if (((ppState.rot || 0) % 180 + 180) % 180 !== 0) {
      var tmpO = origW; origW = origH; origH = tmpO;
    }
    var inW = Math.round((origW / 300) * 100) / 100;
    var inH = Math.round((origH / 300) * 100) / 100;

    if ($('#ppSingleDimBadge')) {
      if (!isCommitted) {
        $('#ppSingleDimBadge').textContent = origW + '×' + origH + ' px • ' + inW + '×' + inH + ' in';
      } else {
        $('#ppSingleDimBadge').textContent = spec.free ? (outW + '×' + outH + ' px') : spec.label;
      }
    }
    if ($('#ppDocPropsWH')) {
      if (!isCommitted) {
        $('#ppDocPropsWH').textContent = 'W: ' + inW + ' in • H: ' + inH + ' in';
      } else {
        $('#ppDocPropsWH').textContent = spec.free ? (outW + ' × ' + outH + ' px') : spec.dimText;
      }
    }
    if ($('#ppAiRevertBtn')) $('#ppAiRevertBtn').hidden = !ppState.item.aiImg;
    if ($('#ppResetCutoutBtn')) $('#ppResetCutoutBtn').hidden = !ppState.item.cutoutCanvas;
    if ($('#ppCutoutEdgeControls')) $('#ppCutoutEdgeControls').hidden = !ppState.item.cutoutCanvas;
    if ($('#ppDockBgSwatch')) $('#ppDockBgSwatch').style.background = ppActiveBgHex || '#0088ff';

    if (singleCanvas.width !== outW || singleCanvas.height !== outH) {
      singleCanvas.width = outW;
      singleCanvas.height = outH;
    }
    var ctx = singleCanvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, outW, outH);

    // 1. Backdrop Layer (`bg`)
    var bgLyr = ppState.layers.bg;
    if (bgLyr && bgLyr.visible) {
      ctx.save();
      ctx.globalAlpha = (bgLyr.opacity || 100) / 100;
      ctx.fillStyle = ppActiveBgHex || '#0088ff';
      ctx.fillRect(0, 0, outW, outH);
      ctx.restore();
    }

    // 2. Portrait Subject Layer (`subject`) with Independent Layer Move / Scale / Rotate & ZERO Stretching!
    var subjLyr = ppState.layers.subject;
    if (!subjLyr || subjLyr.visible) {
      var sx = b.x * fullC.width;
      var sy = b.y * fullC.height;
      var sw = Math.max(1, b.w * fullC.width);
      var sh = Math.max(1, b.h * fullC.height);

      // Strictly lock source aspect ratio to destination aspect ratio so faces NEVER stretch!
      var srcRatio = sw / sh;
      var dstRatio = outW / Math.max(1, outH);
      if (Math.abs(srcRatio - dstRatio) > 0.004) {
        if (srcRatio > dstRatio) {
          var targetSw = sh * dstRatio;
          sx += (sw - targetSw) * 0.5;
          sw = targetSw;
        } else {
          var targetSh = sw / dstRatio;
          sy += (sh - targetSh) * 0.5;
          sh = targetSh;
        }
      }

      var lTx = (subjLyr ? subjLyr.tx : 0) * outW;
      var lTy = (subjLyr ? subjLyr.ty : 0) * outH;
      var lSx = subjLyr ? (subjLyr.sx || 1) : 1;
      var lSy = subjLyr ? (subjLyr.sy || 1) : 1;
      var lRot = ((subjLyr ? (subjLyr.rot || 0) : 0) * Math.PI) / 180;

      ctx.save();
      ctx.globalAlpha = ((subjLyr && subjLyr.opacity) || 100) / 100;
      ctx.globalCompositeOperation = (subjLyr && subjLyr.blend) || 'source-over';
      ctx.translate(outW * 0.5 + lTx, outH * 0.5 + lTy);
      if (lRot) ctx.rotate(lRot);
      ctx.scale(lSx, lSy);
      ctx.drawImage(fullC, sx, sy, sw, sh, -outW * 0.5, -outH * 0.5, outW, outH);
      ctx.restore();
    }

    // 3. Adjustment Layer (`adjust`): DSLR De-Haze, Skin Smooth, Studio Light, Sharpness
    if (!ppState.layers.adjust || ppState.layers.adjust.visible) {
      var effDehaze = ppState.dslrClarity ? Math.max(58, dehaze) : dehaze;
      if (effDehaze > 1) {
        applyDslrPortraitClarity(ctx, outW, outH, effDehaze);
      }
      if (ppState.skinSmooth || ppState.studioLight) {
        applyPortraitRetouch(ctx, outW, outH, !!ppState.skinSmooth, !!ppState.studioLight);
      }
      var effSharp = ppState.dslrClarity ? Math.max(32, sharp) : sharp;
      if (effSharp > 2) {
        applySimpleUnsharpMask(ctx, outW, outH, effSharp);
      }
    }

    // 4. Non-Destructive Brush & Retouch Layer (`paint`) with Independent Layer Move / Scale / Rotate
    var paintLyr = ppState.layers.paint;
    if (ppState.paintCanvas && paintLyr && paintLyr.visible) {
      ctx.save();
      ctx.globalAlpha = (paintLyr.opacity || 100) / 100;
      ctx.globalCompositeOperation = paintLyr.blend || 'source-over';
      ctx.translate(outW * 0.5 + (paintLyr.tx || 0) * outW, outH * 0.5 + (paintLyr.ty || 0) * outH);
      if (paintLyr.rot) ctx.rotate((paintLyr.rot * Math.PI) / 180);
      ctx.scale(paintLyr.sx || 1, paintLyr.sy || 1);
      ctx.drawImage(ppState.paintCanvas, -outW * 0.5, -outH * 0.5, outW, outH);
      ctx.restore();
    }

    if (hasBorder) {
      ctx.save();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = Math.max(2, Math.round(outW * 0.008));
      ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, outW - ctx.lineWidth, outH - ctx.lineWidth);
      ctx.restore();
    }

    // Debounced Filmstrip & Layer Thumbnail Sync (prevents PNG encoding lag during interactive drags)
    clearTimeout(renderPassportPhotoAndSheet._thumbTimer);
    renderPassportPhotoAndSheet._thumbTimer = setTimeout(function () {
      if (!ppState) return;
      try {
        ppState._thumbUrl = singleCanvas.toDataURL('image/jpeg', 0.85);
        var thumbEl = $('[data-pp-thumb-idx="' + activePpIdx + '"]');
        if (thumbEl) thumbEl.src = ppState._thumbUrl;
        renderPpLayersPanel();
      } catch (_) {}
    }, 90);

    // Only render the heavy 2480×3508 Print Sheet when in Step 2 ('print') or explicitly requested!
    if (ppActiveStep !== 'print' && !forceSheetRender) {
      return;
    }

    var paper = ($('#ppSheetPaper') && $('#ppSheetPaper').value) || 'a4';
    var copiesRaw = ($('#ppCopiesCount') && $('#ppCopiesCount').value) || '8';
    var isCombo = copiesRaw === 'combo';
    var copies = isCombo ? 20 : (parseInt(copiesRaw, 10) || 8);
    var gapVal = ($('#ppSheetGap') && parseInt($('#ppSheetGap').value, 10)) || 42;
    var topMarginVal = ($('#ppSheetMargin') && parseInt($('#ppSheetMargin').value, 10)) || 96;
    var cutMarks = $('#ppPrintCutMarks') ? $('#ppPrintCutMarks').checked : hasBorder;

    if ($('#ppSheetGapVal')) $('#ppSheetGapVal').textContent = gapVal + ' px';
    if ($('#ppSheetMarginVal')) $('#ppSheetMarginVal').textContent = topMarginVal + ' px';

    var sheetW = paper === '4r' ? 1200 : (paper === '5r' ? 1500 : 2480);
    var sheetH = paper === '4r' ? 1800 : (paper === '5r' ? 2100 : 3508);
    sheetCanvas.width = sheetW;
    sheetCanvas.height = sheetH;
    var sctx = sheetCanvas.getContext('2d');
    sctx.fillStyle = '#ffffff';
    sctx.fillRect(0, 0, sheetW, sheetH);

    function drawAspectSafeCell(srcC, dx, dy, dw, dh) {
      var sw = srcC.width || 1;
      var sh = srcC.height || 1;
      var sRatio = sw / sh;
      var dRatio = dw / Math.max(1, dh);
      var sx = 0, sy = 0;
      if (Math.abs(sRatio - dRatio) > 0.005) {
        if (sRatio > dRatio) {
          var tw = sh * dRatio;
          sx = (sw - tw) * 0.5;
          sw = tw;
        } else {
          var th = sw / dRatio;
          sy = (sh - th) * 0.35;
          sh = th;
        }
      }
      sctx.drawImage(srcC, sx, sy, sw, sh, dx, dy, dw, dh);
    }

    function drawCropTicks(px, py, w, h) {
      if (!cutMarks) return;
      sctx.save();
      sctx.strokeStyle = '#94a3b8';
      sctx.lineWidth = 2;
      var m = 12;
      sctx.beginPath();
      sctx.moveTo(px - m, py); sctx.lineTo(px - 2, py);
      sctx.moveTo(px, py - m); sctx.lineTo(px, py - 2);
      sctx.moveTo(px + w + 2, py); sctx.lineTo(px + w + m, py);
      sctx.moveTo(px + w, py - m); sctx.lineTo(px + w, py - 2);
      sctx.moveTo(px - m, py + h); sctx.lineTo(px - 2, py + h);
      sctx.moveTo(px, py + h + 2); sctx.lineTo(px, py + h + m);
      sctx.moveTo(px + w + 2, py + h); sctx.lineTo(px + w + m, py + h);
      sctx.moveTo(px + w, py + h + 2); sctx.lineTo(px + w, py + h + m);
      sctx.stroke();
      sctx.restore();
    }

    var printItemW = spec.free ? 472 : spec.w;
    var printItemH = spec.free ? Math.round((outH / Math.max(1, outW)) * 472) : spec.h;

    if (isCombo && paper === 'a4') {
      var pW = 472, pH = 591, pCols = 4, pGap = gapVal;
      var pStartX = Math.round((sheetW - (pCols * pW + (pCols - 1) * pGap)) / 2);
      var pTop = topMarginVal;
      for (var pi = 0; pi < 8; pi++) {
        var pr = Math.floor(pi / pCols), pc = pi % pCols;
        var ppx = pStartX + pc * (pW + pGap);
        var ppy = pTop + pr * (pH + pGap);
        drawAspectSafeCell(singleCanvas, ppx, ppy, pW, pH);
        drawCropTicks(ppx, ppy, pW, pH);
      }
      var stW = 236, stH = 295, stCols = 6, stGap = gapVal;
      var stStartX = Math.round((sheetW - (stCols * stW + (stCols - 1) * stGap)) / 2);
      var stTop = pTop + 2 * (pH + pGap) + 60;
      for (var si = 0; si < 12; si++) {
        var sr = Math.floor(si / stCols), sc = si % stCols;
        var spx = stStartX + sc * (stW + stGap);
        var spy = stTop + sr * (stH + stGap);
        drawAspectSafeCell(singleCanvas, spx, spy, stW, stH);
        drawCropTicks(spx, spy, stW, stH);
      }
    } else {
      var maxFitCols = Math.max(1, Math.floor((sheetW - 60 + gapVal) / (printItemW + gapVal)));
      var cols = Math.min(maxFitCols, paper === '4r' ? 2 : (paper === '5r' ? 3 : 4));
      if (copies === 2) cols = Math.min(2, maxFitCols);
      var totalRowW = cols * printItemW + (cols - 1) * gapVal;
      var startX = Math.max(24, Math.round((sheetW - totalRowW) / 2));

      for (var i = 0; i < copies; i++) {
        var r = Math.floor(i / cols);
        var c = i % cols;
        var px = startX + c * (printItemW + gapVal);
        var py = topMarginVal + r * (printItemH + gapVal);
        if (py + printItemH > sheetH - 20) break;
        drawAspectSafeCell(singleCanvas, px, py, printItemW, printItemH);
        drawCropTicks(px, py, printItemW, printItemH);
      }
    }

    if ($('#ppSheetSummaryBadge')) {
      var paperLbl = paper === '4r' ? '4R (4×6")' : (paper === '5r' ? '5R (5×7")' : 'A4');
      var copyTxt = isCombo ? tr('৮ পাসপোর্ট + ১২ স্ট্যাম্প', '8 Passport + 12 Stamp') : (toBn(copies) + tr(' কপি', ' Copies'));
      $('#ppSheetSummaryBadge').textContent = paperLbl + ' • ' + copyTxt;
    }
  }

  /**
   * Encodes an HTMLImageElement into a normalized JPEG base64 string (max 1024px) for AI API input.
   */
  function encodeSourceImageForAi(img) {
    var maxDim = 1024;
    var w = img.naturalWidth || img.width || 600;
    var h = img.naturalHeight || img.height || 800;
    if (w > maxDim || h > maxDim) {
      var r = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * r);
      h = Math.round(h * r);
    }
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    var dataUrl = c.toDataURL('image/jpeg', 0.92);
    return {
      canvas: c,
      dataUrl: dataUrl,
      base64: dataUrl.split(',')[1] || ''
    };
  }

  function loadDataUrlIntoImage(dataUrl) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error(tr('AI জেনারেট করা ছবি লোড করা যায়নি', 'Failed to decode AI generated image'))); };
      img.src = dataUrl;
    });
  }

  var gradioClientPromise = null;
  function getGradioClientModule() {
    if (!gradioClientPromise) {
      gradioClientPromise = import('https://cdn.jsdelivr.net/npm/@gradio/client/+esm').catch(function (err) {
        gradioClientPromise = null;
        throw err;
      });
    }
    return gradioClientPromise;
  }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function runFreeFluxKontextEdit(srcCanvas, promptText, hfToken, loadingTxt) {
    if (loadingTxt) {
      loadingTxt.textContent = tr('✨ ফ্রি FLUX.1 Kontext Studio AI সংযুক্ত হচ্ছে...', '✨ Connecting to Free FLUX.1 Kontext Studio AI...');
    }
    var gradio = await getGradioClientModule();

    // Scale input to max 720px for fast ZeroGPU studio portrait generation
    var sw = srcCanvas.width || 600;
    var sh = srcCanvas.height || 750;
    var maxSide = 720;
    if (sw > maxSide || sh > maxSide) {
      var sc = Math.min(maxSide / sw, maxSide / sh);
      sw = Math.max(64, Math.round(sw * sc));
      sh = Math.max(64, Math.round(sh * sc));
    }
    var workC = document.createElement('canvas');
    workC.width = sw;
    workC.height = sh;
    var wctx = workC.getContext('2d');
    wctx.fillStyle = '#ffffff';
    wctx.fillRect(0, 0, sw, sh);
    wctx.drawImage(srcCanvas, 0, 0, sw, sh);
    var jpgBlob = await canvasToBlob(workC, 'image/jpeg', 0.92);
    var portraitFile = new File([jpgBlob], 'passport-input.jpg', { type: 'image/jpeg' });

    var opts = (hfToken && /^hf_/i.test(hfToken.trim())) ? { hf_token: hfToken.trim() } : undefined;
    var spaces = ['black-forest-labs/FLUX.1-Kontext-Dev', 'multimodalart/FLUX.1-Kontext-dev'];
    var res = null;
    var lastErr = null;

    for (var si = 0; si < spaces.length; si++) {
      try {
        var client = await gradio.Client.connect(spaces[si], opts);
        if (loadingTxt) {
          loadingTxt.textContent = tr('✨ ফ্রি FLUX.1 Kontext AI স্টুডিও DSLR ছবি তৈরি করছে (~১৫-২০ সে.)...', '✨ Free FLUX.1 Kontext AI is generating DSLR studio portrait (~15-20s)...');
        }
        res = await client.predict('/infer', {
          input_image: portraitFile,
          prompt: promptText,
          seed: 0,
          randomize_seed: true,
          guidance_scale: 2.5,
          steps: 24
        });
        if (res && res.data && res.data[0]) break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!res && lastErr) throw lastErr;

    var firstItem = res && res.data && res.data[0];
    var outUrl = (firstItem && firstItem.url) || (Array.isArray(firstItem) && firstItem[0] && firstItem[0].image && firstItem[0].image.url) || '';
    if (!outUrl) {
      throw new Error(tr('ফ্রি AI থেকে ছবি পাওয়া যায়নি, কিছুক্ষণ পর আবার চেষ্টা করুন।', 'No image returned from Free AI, please try again shortly.'));
    }
    var imgResp = await fetch(outUrl);
    if (!imgResp.ok) {
      throw new Error('HTTP ' + imgResp.status);
    }
    var outBlob = await imgResp.blob();
    return await blobToDataUrl(outBlob);
  }

  async function generatePassportWithAi() {
    syncPpStateRef();
    if (!ppState || !ppState.item || !ppState.item.img) {
      showToast(tr('প্রথমে একটি ছবি আপলোড করুন', 'Please upload a photo first'));
      return;
    }

    var provider = ppAiConfig.provider || 'free-flux';
    var inpKey = ($('#ppApiKeyInput') && $('#ppApiKeyInput').value.trim()) || '';
    if (inpKey) {
      ppAiConfig.keys[provider] = inpKey;
      savePpAiConfig();
      syncPpApiUi();
    }
    var apiKey = (ppAiConfig.keys && ppAiConfig.keys[provider]) || '';
    if (provider !== 'free-flux' && (!apiKey || apiKey.length < 10)) {
      showToast(tr('অনুগ্রহ করে প্রথমে আপনার AI API Key দিন অথবা "⚡ ফ্রি AI" ট্যাব ব্যবহার করুন', 'Please enter your API Key or select the "⚡ Free AI" tab'));
      if ($('#ppApiKeyInput')) $('#ppApiKeyInput').focus();
      return;
    }

    var promptText = ($('#ppAiPromptInput') && $('#ppAiPromptInput').value.trim()) || buildPassportAiPrompt();
    var overlay = $('#ppAiLoadingOverlay');
    var loadingTxt = $('#ppAiLoadingText');
    var genBtn = $('#ppAiGenerateBtn');
    if (overlay) overlay.hidden = false;
    if (loadingTxt) {
      loadingTxt.textContent = provider === 'free-flux'
        ? tr('✨ ফ্রি FLUX.1 Kontext AI পাসপোর্ট ছবি তৈরি করছে (~১৫-২০ সে.)...', '✨ Free FLUX.1 Kontext AI is generating passport photo (~15-20s)...')
        : (provider === 'gemini'
            ? tr('Google Gemini AI পাসপোর্ট ছবি তৈরি করছে...', 'Google Gemini AI is generating passport photo...')
            : (provider === 'grok' ? tr('Grok (xAI) পাসপোর্ট ছবি তৈরি করছে...', 'Grok AI is generating passport photo...') : tr('OpenAI পাসপোর্ট ছবি তৈরি করছে...', 'OpenAI is generating passport photo...')));
    }
    if (genBtn) genBtn.disabled = true;

    try {
      var srcInfo = encodeSourceImageForAi(ppState.item.img);
      var resultDataUrl = null;

      if (provider === 'free-flux') {
        setPpApiDiagBanner('', '');
        try {
          resultDataUrl = await runFreeFluxKontextEdit(srcInfo.canvas, promptText, apiKey, loadingTxt);
        } catch (fluxErr) {
          var fMsg = (fluxErr && (fluxErr.message || JSON.stringify(fluxErr))) || '';
          if (/quota|ZeroGPU|exceeded|limit/i.test(fMsg)) {
            setPpApiDiagBanner(
              'warn',
              tr('আজকের ফ্রি গেস্ট GPU কোটা শেষ হয়েছে। সম্পূর্ণ ফ্রি (কার্ড ছাড়া) ৫ গুণ বেশি কোটার জন্য HuggingFace থেকে একটি ফ্রি Read Token (hf_...) নিয়ে উপরে বসিয়ে দিন!', 'Daily guest ZeroGPU quota reached. Paste a free HuggingFace Read Token (hf_...) above for 5x more free daily quota (no credit card needed)!'),
              'https://huggingface.co/settings/tokens',
              'ফ্রি HF Token নিন →'
            );
            throw new Error(tr('গেস্ট কোটা শেষ — ফ্রি HuggingFace Token (hf_...) ব্যবহার করুন', 'Guest quota reached — paste a free HuggingFace Token (hf_...)'));
          }
          throw fluxErr;
        }
      } else if (provider === 'gemini') {
        setPpApiDiagBanner('', '');
        var selectedModel = ($('#ppGeminiModelSelect') && $('#ppGeminiModelSelect').value) || 'auto';
        var disc = await discoverGeminiImageModels(apiKey);
        var geminiModels = selectedModel !== 'auto'
          ? [selectedModel].concat(disc.models.filter(function (x) { return x !== selectedModel; }))
          : disc.models;

        var lastErr = null;
        var sawFreeTierZero = false;
        var vertexEnableUrl = '';

        async function tryGeminiEndpoint(endpointUrl) {
          var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
          var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 45000) : null;
          try {
            var resp = await fetch(endpointUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: ctrl ? ctrl.signal : undefined,
              body: JSON.stringify({
                contents: [{
                  role: 'user',
                  parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: srcInfo.base64 } },
                    { text: promptText }
                  ]
                }],
                generationConfig: {
                  responseModalities: ['TEXT', 'IMAGE']
                }
              })
            });
            if (timer) clearTimeout(timer);
            var data = await resp.json().catch(function () { return {}; });
            return { ok: resp.ok, status: resp.status, data: data };
          } catch (netErr) {
            if (timer) clearTimeout(timer);
            return { ok: false, status: 0, data: { error: { message: netErr && netErr.message } } };
          }
        }

        function extractInlineImageFromGemini(data) {
          var candidates = (data && data.candidates) || [];
          for (var ci = 0; ci < candidates.length; ci++) {
            var parts = (candidates[ci].content && candidates[ci].content.parts) || [];
            for (var pi = 0; pi < parts.length; pi++) {
              var inl = parts[pi].inlineData || parts[pi].inline_data;
              if (inl && inl.data) {
                var mime = inl.mimeType || inl.mime_type || 'image/png';
                return 'data:' + mime + ';base64,' + inl.data;
              }
            }
          }
          return null;
        }

        for (var m = 0; m < geminiModels.length; m++) {
          var modelName = geminiModels[m];
          var aiStudioUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':generateContent?key=' + encodeURIComponent(apiKey);
          var r1 = await tryGeminiEndpoint(aiStudioUrl);
          if (r1.ok) {
            resultDataUrl = extractInlineImageFromGemini(r1.data);
            if (resultDataUrl) break;
          } else {
            var msg1 = (r1.data && r1.data.error && r1.data.error.message) || ('HTTP ' + r1.status);
            lastErr = msg1;
            if (/free_tier|limit:\s*0|exceeded your current quota/i.test(msg1)) {
              sawFreeTierZero = true;
            }
          }

          // If key is a Google Cloud / Vertex AI Express key (AQ....), also attempt Vertex Express endpoint
          if (!resultDataUrl && /^AQ\./.test(apiKey) && m === 0) {
            var vertexUrl = 'https://aiplatform.googleapis.com/v1/publishers/google/models/' + modelName + ':generateContent?key=' + encodeURIComponent(apiKey);
            var r2 = await tryGeminiEndpoint(vertexUrl);
            if (r2.ok) {
              resultDataUrl = extractInlineImageFromGemini(r2.data);
              if (resultDataUrl) break;
            } else {
              var msg2 = (r2.data && r2.data.error && r2.data.error.message) || '';
              var urlMatch = msg2.match(/https:\/\/console\.developers\.google\.com\/apis\/api\/aiplatform\.googleapis\.com\/overview\?project=\d+/);
              if (urlMatch) vertexEnableUrl = urlMatch[0];
              if (!lastErr) lastErr = msg2;
            }
          }
        }

        if (!resultDataUrl) {
          if (sawFreeTierZero) {
            try {
              if (loadingTxt) {
                loadingTxt.textContent = tr(
                  'Google ফ্রি কোটা ০ — স্বয়ংক্রিয়ভাবে ফ্রি FLUX.1 Kontext AI দিয়ে পোশাক তৈরি হচ্ছে (~১৫-২০ সে.)...',
                  'Google Free Tier quota is 0 — automatically generating with Free FLUX.1 Kontext AI (~15-20s)...'
                );
              }
              resultDataUrl = await runFreeFluxKontextEdit(
                srcInfo.canvas,
                promptText,
                (ppAiConfig.keys && ppAiConfig.keys['free-flux']) || '',
                loadingTxt
              );
              ppAiConfig.provider = 'free-flux';
              savePpAiConfig();
              syncPpApiUi();
              setPpApiDiagBanner(
                'ok',
                tr(
                  '✓ Google ফ্রি-টিয়ারে ইমেজ কোটা ০ থাকায় স্বয়ংক্রিয়ভাবে ফ্রি FLUX.1 Kontext AI ইঞ্জিনে সুইচ করে আপনার ছবি তৈরি করা হয়েছে!',
                  '✓ Switched automatically to Free FLUX.1 Kontext AI because Google Free Tier image quota is 0!'
                )
              );
            } catch (_) {
              var quotaMsg = tr(
                'আপনার Gemini API Key সঠিক, কিন্তু Google ফ্রি-টিয়ারে ইমেজ জেনারেশন বন্ধ রেখেছে (limit: 0)। পাশের "⚡ ফ্রি AI" ট্যাব ব্যবহার করুন অথবা Google AI Studio-তে Billing চালু করুন।',
                'Your Gemini API Key is valid, but Google sets Free Tier image generation quota to 0. Use the "⚡ Free AI" tab or enable Tier 1 Billing.'
              );
              setPpApiDiagBanner(
                'warn',
                quotaMsg,
                vertexEnableUrl || 'https://aistudio.google.com/apikey',
                vertexEnableUrl ? 'Vertex AI চালু করুন →' : 'AI Studio Billing দেখুন →'
              );
              throw new Error(tr('Google ফ্রি-টিয়ারে ইমেজ কোটা ০ — "⚡ ফ্রি AI" ট্যাব ব্যবহার করুন', 'Google Free Tier image quota is 0 — use the "⚡ Free AI" tab'));
            }
          } else {
            setPpApiDiagBanner('warn', lastErr || tr('Gemini API থেকে ছবি পাওয়া যায়নি।', 'No image returned from Gemini API.'));
            throw new Error(lastErr || tr('Gemini API থেকে ছবি পাওয়া যায়নি। API Key ও কোটা চেক করুন।', 'No image returned from Gemini API. Check your API key and quota.'));
          }
        }
      } else if (provider === 'grok') {
        var grokResp = await fetch('https://api.x.ai/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
          },
          body: JSON.stringify({
            model: 'grok-2-image',
            prompt: promptText,
            response_format: 'b64_json'
          })
        });
        var grokData = await grokResp.json().catch(function () { return {}; });
        if (!grokResp.ok) {
          throw new Error((grokData.error && (grokData.error.message || grokData.error)) || ('Grok API HTTP ' + grokResp.status));
        }
        var b64Grok = grokData.data && grokData.data[0] && grokData.data[0].b64_json;
        var urlGrok = grokData.data && grokData.data[0] && grokData.data[0].url;
        if (b64Grok) {
          resultDataUrl = 'data:image/jpeg;base64,' + b64Grok;
        } else if (urlGrok) {
          resultDataUrl = urlGrok;
        } else {
          throw new Error(tr('Grok API থেকে ছবি পাওয়া যায়নি', 'No image returned from Grok API'));
        }
      } else {
        // OpenAI gpt-image-1 edits endpoint with fallback to generations
        var pngBlob = await canvasToBlob(srcInfo.canvas, 'image/png', 0.95);
        var fd = new FormData();
        fd.append('model', 'gpt-image-1');
        fd.append('image', pngBlob, 'portrait.png');
        fd.append('prompt', promptText);
        fd.append('size', '1024x1024');

        var oaResp = await fetch('https://api.openai.com/v1/images/edits', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + apiKey },
          body: fd
        });
        var oaData = await oaResp.json().catch(function () { return {}; });
        if (!oaResp.ok) {
          throw new Error((oaData.error && oaData.error.message) || ('OpenAI API HTTP ' + oaResp.status));
        }
        var b64Oa = oaData.data && oaData.data[0] && oaData.data[0].b64_json;
        var urlOa = oaData.data && oaData.data[0] && oaData.data[0].url;
        if (b64Oa) {
          resultDataUrl = 'data:image/png;base64,' + b64Oa;
        } else if (urlOa) {
          resultDataUrl = urlOa;
        } else {
          throw new Error(tr('OpenAI API থেকে ছবি পাওয়া যায়নি', 'No image returned from OpenAI API'));
        }
      }

      var aiDlg = $('#ppAiStudioDialog');
      if (aiDlg && aiDlg.open) aiDlg.close();

      var aiImg = await loadDataUrlIntoImage(resultDataUrl);
      pushPpHistory();
      ppState.item.aiImg = aiImg;
      ppState.item.cutoutCanvas = null;
      ppState.item.cutoutMask = null;
      ppState.panX = 0;
      ppState.panY = 0;
      ppState.straighten = 0;
      ppState.cropBox = null;
      ensureEntryPhotoshopState(ppState);
      if ($('#ppZoom')) $('#ppZoom').value = '100';
      if ($('#ppStraightenAngle')) $('#ppStraightenAngle').value = '0';
      if ($('#ppAiRevertBtn')) $('#ppAiRevertBtn').hidden = false;

      renderPpFilmstrip();
      renderPpLayersPanel();
      setPpTool('move');
      renderPassportPhotoAndSheet();
      showToast(tr('✨ AI পাসপোর্ট ছবি সফলভাবে তৈরি হয়েছে!', '✨ AI Passport Photo generated successfully!'));
    } catch (err) {
      showToast((err && err.message) || tr('AI ছবি তৈরি করতে সমস্যা হয়েছে', 'Failed to generate AI photo'));
    } finally {
      if (overlay) overlay.hidden = true;
      if (genBtn) genBtn.disabled = false;
    }
  }

  /**
   * Builds a standalone 300-DPI single-page PDF Blob directly from a canvas JPEG data URL.
   */
  async function canvasToPdfBlob(canvas, paperOrIs4R) {
    var jpgBlob = await canvasToBlob(canvas, 'image/jpeg', 0.94);
    var jpgBuf = new Uint8Array(await jpgBlob.arrayBuffer());
    var wPt = (paperOrIs4R === true || paperOrIs4R === '4r') ? 288 : (paperOrIs4R === '5r' ? 360 : 595.28);
    var hPt = (paperOrIs4R === true || paperOrIs4R === '4r') ? 432 : (paperOrIs4R === '5r' ? 504 : 841.89);
    var cw = canvas.width;
    var ch = canvas.height;

    var chunks = [];
    var offsets = [];
    var byteLen = 0;
    var enc = new TextEncoder();
    function pushStr(s) {
      var b = enc.encode(s);
      chunks.push(b);
      byteLen += b.length;
    }
    function pushBytes(b) {
      chunks.push(b);
      byteLen += b.length;
    }
    function startObj(id) {
      offsets[id] = byteLen;
    }

    pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');
    startObj(1);
    pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    startObj(2);
    pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    startObj(3);
    pushStr('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + wPt.toFixed(2) + ' ' + hPt.toFixed(2) + '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n');
    startObj(4);
    pushStr('4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + cw + ' /Height ' + ch + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpgBuf.length + ' >>\nstream\n');
    pushBytes(jpgBuf);
    pushStr('\nendstream\nendobj\n');
    var contentStream = 'q\n' + wPt.toFixed(2) + ' 0 0 ' + hPt.toFixed(2) + ' 0 0 cm\n/Im0 Do\nQ\n';
    startObj(5);
    pushStr('5 0 obj\n<< /Length ' + contentStream.length + ' >>\nstream\n' + contentStream + 'endstream\nendobj\n');

    var xrefPos = byteLen;
    pushStr('xref\n0 6\n0000000000 65535 f \n');
    for (var i = 1; i <= 5; i++) {
      var offStr = String(offsets[i] || 0).padStart(10, '0');
      pushStr(offStr + ' 00000 n \n');
    }
    pushStr('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF');
    return new Blob(chunks, { type: 'application/pdf' });
  }

  async function loadPassportPhotoFile(files, replaceActive) {
    if (!files || !files.length) return;
    try {
      for (var i = 0; i < files.length; i++) {
        var item = await loadImageFile(files[i]);
        var newEntry = {
          item: item,
          cropImgPanX: 0,
          cropImgPanY: 0,
          rot: 0,
          flipH: 1,
          straighten: 0,
          dslrClarity: false,
          skinSmooth: false,
          studioLight: false,
          dehaze: 0,
          sharpness: 0,
          cropCommitted: false,
          hasPaintLayer: false,
          hasAdjustLayer: false,
          cropBox: null,
          paintCanvas: null,
          layers: null
        };
        ensureEntryPhotoshopState(newEntry);

        if (replaceActive && ppItems[activePpIdx]) {
          if (ppItems[activePpIdx].item && ppItems[activePpIdx].item.url) {
            URL.revokeObjectURL(ppItems[activePpIdx].item.url);
          }
          ppItems[activePpIdx] = newEntry;
          break;
        } else {
          ppItems.push(newEntry);
          activePpIdx = ppItems.length - 1;
        }
      }
      syncPpStateRef();
      var pane = $('#img-pane-passport-photo');
      if (pane) pane.setAttribute('data-has-pages', 'true');
      if ($('#ppDropzone')) $('#ppDropzone').hidden = true;
      if ($('#ppStage')) $('#ppStage').hidden = false;
      if ($('#ppStraightenAngle') && ppState) $('#ppStraightenAngle').value = Number(ppState.straighten || 0).toFixed(1);

      // Fit viewport to screen and open in Single-Image Photoshop Crop Mode!
      if (ppPsController) ppPsController.fitScreen();
      setPpStep('edit');
      setPpTool('crop');
      renderPpCropStage(true);
      renderPassportPhotoAndSheet(false);
      renderPpFilmstrip();
      renderPpLayersPanel();
    } catch (e) {
      showToast(e.message || tr('ছবি লোড করা যায়নি', 'Failed to load image'));
    }
  }

  function initPassportPhotoMaker() {
    var dropzone = $('#ppDropzone');
    var input = $('#ppFileInput');
    if (!dropzone || !input) return;
    wireDropzone(dropzone, input, function (files) { loadPassportPhotoFile(files, false); });

    loadPpAiConfig();
    syncPpApiUi();
    renderPpAiPresetButtons();

    var aiDlg = $('#ppAiStudioDialog');
    if (aiDlg) setupDialog(aiDlg);

    function openPpAiModal() {
      if (!ppState || !ppState.item) {
        showToast(tr('প্রথমে একটি ছবি আপলোড করুন', 'Please upload a photo first'));
        return;
      }
      buildPassportAiPrompt();
      if (aiDlg) openDialog(aiDlg);
    }
    on('ppOpenAiModalTopBtn', 'click', openPpAiModal);
    on('ppOpenAiModalSideBtn', 'click', openPpAiModal);
    on('ppAiModalCloseBtn', 'click', function () { if (aiDlg && aiDlg.open) aiDlg.close(); });
    on('ppAiModalCancelBtn', 'click', function () { if (aiDlg && aiDlg.open) aiDlg.close(); });

    ['ppBatchInput', 'ppAddMoreInput'].forEach(function (inpId) {
      var el = $('#' + inpId);
      if (el) {
        el.addEventListener('change', function () {
          if (el.files && el.files.length) {
            loadPassportPhotoFile(Array.prototype.slice.call(el.files), false);
            el.value = '';
          }
        });
      }
    });

    // Camera capture integration
    function openPpCamera() {
      var dlg = $('#nidCameraDialog');
      var vid = $('#nidCameraVideo');
      if (!dlg || !vid || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (input) input.click();
        return;
      }
      openDialog(dlg);
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
        .then(function (stream) {
          vid.srcObject = stream;
          vid.play().catch(function () {});
          var snapBtn = $('#nidCameraSnapBtn');
          var closeBtn = $('#nidCameraClose');
          function stopStream() {
            stream.getTracks().forEach(function (t) { t.stop(); });
            vid.srcObject = null;
          }
          if (closeBtn) {
            closeBtn.onclick = function () { stopStream(); dlg.close(); };
          }
          if (snapBtn) {
            snapBtn.onclick = function () {
              var c = document.createElement('canvas');
              c.width = vid.videoWidth || 640;
              c.height = vid.videoHeight || 480;
              c.getContext('2d').drawImage(vid, 0, 0, c.width, c.height);
              stopStream();
              dlg.close();
              c.toBlob(function (blob) {
                if (!blob) return;
                var file = new File([blob], 'camera-portrait-' + Date.now() + '.jpg', { type: 'image/jpeg' });
                loadPassportPhotoFile([file], false);
              }, 'image/jpeg', 0.94);
            };
          }
        })
        .catch(function () {
          dlg.close();
          if (input) input.click();
        });
    }
    ['ppCameraOpenBtn', 'ppSidebarCamBtn'].forEach(function (id) {
      on(id, 'click', openPpCamera);
    });

    // Sidebar collapse toggle
    on('ppSidebarToggleBtn', 'click', function () {
      var pane = $('#img-pane-passport-photo');
      if (!pane) return;
      var collapsed = pane.getAttribute('data-sidebar-collapsed') === 'true';
      pane.setAttribute('data-sidebar-collapsed', collapsed ? 'false' : 'true');
    });

    // Left Photoshop Vertical Tool Dock (Crop | Brush | Picker | Move)
    $$('#ppPsDock [data-pp-tool]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setPpTool(btn.getAttribute('data-pp-tool') || 'crop');
      });
    });

    // Step 1 <-> Step 2 ("প্রিন্ট রেডি" Print Sheet Transition)
    on('ppGoPrintReadyBtn', 'click', function () {
      if (!ppState) return;
      setPpStep('print');
      showToast(tr('প্রিন্ট শিট তৈরি! কপি সংখ্যা ও পেপার সাইজ বাছাই করুন।', 'Print sheet ready! Choose copies & paper size.'));
    });
    on('ppBackToEditorBtn', 'click', function () {
      setPpStep('edit');
    });

    // Copies Quick Pills in Step 2 Print Ready View
    $$('#ppCopiesQuickPills [data-pp-copy-pill]').forEach(function (pill) {
      pill.addEventListener('click', function () {
        var val = pill.getAttribute('data-pp-copy-pill') || '8';
        if ($('#ppCopiesCount')) $('#ppCopiesCount').value = val;
        $$('#ppCopiesQuickPills [data-pp-copy-pill]').forEach(function (p) {
          p.setAttribute('aria-pressed', p === pill ? 'true' : 'false');
        });
        renderPassportPhotoAndSheet();
      });
    });

    // Right Upper Dock Tabs (adjust | bg)
    function activatePpInspectorTab(tab) {
      var target = tab || 'adjust';
      $$('[data-pp-tab]').forEach(function (b) {
        b.setAttribute('aria-selected', b.getAttribute('data-pp-tab') === target ? 'true' : 'false');
      });
      if ($('#ppInspectorTabAdjust')) $('#ppInspectorTabAdjust').hidden = target !== 'adjust';
      if ($('#ppInspectorTabBg')) $('#ppInspectorTabBg').hidden = target !== 'bg';
    }
    $$('[data-pp-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activatePpInspectorTab(btn.getAttribute('data-pp-tab'));
      });
    });

    // =========================================================================
    // 60FPS BUTTER-SMOOTH PHOTOSHOP CROP + OUTSIDE-BOX DRAG ROTATION + CUSTOM W×H
    // =========================================================================
    var cropBoxEl = $('#ppCropBox');
    var cropCanvEl = $('#ppCropSourceCanvas');
    var cropStageEl = $('#ppSingleStageWrap');
    var cropFineGrid = $('#ppCropFineRotateGrid');
    var rotHud = $('#ppFloatingRotateHud');

    function fitCropBoxToCurrentSpec() {
      if (!ppState) return;
      ppState.cropBox = null;
      ensureEntryPhotoshopState(ppState);
      syncPpCropDomFast();
    }

    on('ppSizePreset', 'change', function () {
      var sel = $('#ppSizePreset');
      var key = (sel && sel.value) || 'passport-4x5';
      var sp = PP_SIZE_SPECS[key] || PP_SIZE_SPECS['passport-4x5'];
      var dis = !!sp.free;
      if ($('#ppCropW')) { $('#ppCropW').disabled = dis; if (!dis) $('#ppCropW').value = String(sp.dispW); }
      if ($('#ppCropH')) { $('#ppCropH').disabled = dis; if (!dis) $('#ppCropH').value = String(sp.dispH); }
      if ($('#ppCropUnit')) { $('#ppCropUnit').disabled = dis; if (!dis) $('#ppCropUnit').value = sp.unit || 'cm'; }
      if ($('#ppCropSwapDimBtn')) $('#ppCropSwapDimBtn').disabled = dis;
      if (!ppState) return;
      if (!dis) fitCropBoxToCurrentSpec();
      if (ppActiveTool === 'crop') syncPpCropDomFast();
      renderPassportPhotoAndSheet(false);
    });

    ['ppCropW', 'ppCropH', 'ppCropUnit'].forEach(function (cid) {
      on(cid, 'input', function () {
        if (!ppState) return;
        fitCropBoxToCurrentSpec();
        renderPassportPhotoAndSheet(false);
      });
      on(cid, 'change', function () {
        if (!ppState) return;
        fitCropBoxToCurrentSpec();
        renderPassportPhotoAndSheet(false);
      });
    });

    on('ppCropSwapDimBtn', 'click', function () {
      var wEl = $('#ppCropW'), hEl = $('#ppCropH');
      if (!wEl || !hEl || wEl.disabled) return;
      var tmp = wEl.value;
      wEl.value = hEl.value;
      hEl.value = tmp;
      if (ppState) {
        fitCropBoxToCurrentSpec();
        renderPassportPhotoAndSheet(false);
      }
    });

    function commitPpCrop() {
      if (!ppState) return;
      ppState.cropCommitted = true;
      setPpTool('move');
      renderPassportPhotoAndSheet(false);
      showToast(tr('✓ ফটো ক্রপ সম্পন্ন হয়েছে!', '✓ Photo cropped!'));
    }
    on('ppCropCommitBtn', 'click', commitPpCrop);
    on('ppCropInlineCommitBtn', 'click', commitPpCrop);

    on('ppCropResetBoxBtn', 'click', function () {
      if (!ppState) return;
      pushPpHistory();
      ppState.cropCommitted = false;
      ppState.cropBox = null;
      ppState.cropImgPanX = 0;
      ppState.cropImgPanY = 0;
      ppState.straighten = 0;
      ensureEntryPhotoshopState(ppState);
      renderPpCropStage(true);
      renderPassportPhotoAndSheet(false);
      showToast(tr('ক্রপ ও রোটেশন রিসেট করা হয়েছে', 'Crop & rotation reset'));
    });

    if (cropStageEl && cropBoxEl && cropCanvEl) {
      var cropDrag = null;
      var cropRaf = 0;

      function startCropInteraction(e, mode) {
        if (!ppState || ppActiveTool !== 'crop' || ppActiveStep !== 'edit') return;
        if (ppPsController && ppPsController.isSpaceHeld()) return;
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        ensureEntryPhotoshopState(ppState);
        pushPpHistory();

        var cRect = cropCanvEl.getBoundingClientRect();
        var bRect = cropBoxEl.getBoundingClientRect();
        var centerX = bRect.left + bRect.width * 0.5;
        var centerY = bRect.top + bRect.height * 0.5;

        cropDrag = {
          mode: mode, // 'move-box' | 'nw'|'n'|'ne'|'e'|'se'|'s'|'sw'|'w' | 'rotate-outside'
          startX: e.clientX,
          startY: e.clientY,
          cw: Math.max(1, cRect.width),
          ch: Math.max(1, cRect.height),
          cx: centerX,
          cy: centerY,
          startRad: Math.atan2(e.clientY - centerY, e.clientX - centerX),
          origAngle: Number(ppState.straighten) || 0,
          origBox: Object.assign({}, ppState.cropBox),
          origPanX: Number(ppState.cropImgPanX) || 0,
          origPanY: Number(ppState.cropImgPanY) || 0,
          pointerId: e.pointerId
        };

        if (mode === 'rotate-outside') {
          if (cropFineGrid) cropFineGrid.setAttribute('opacity', '1');
          if (rotHud) {
            rotHud.hidden = false;
            rotHud.textContent = (cropDrag.origAngle > 0 ? '+' : '') + cropDrag.origAngle.toFixed(1) + '°';
            rotHud.style.left = (e.clientX + 16) + 'px';
            rotHud.style.top = (e.clientY - 12) + 'px';
          }
        }

        if (cropStageEl.setPointerCapture) {
          try { cropStageEl.setPointerCapture(e.pointerId); } catch (_) {}
        }
      }

      // Clicking inside Crop Box or on 8 L-Handles
      cropBoxEl.addEventListener('pointerdown', function (e) {
        if (e.target && e.target.closest && e.target.closest('#ppCropInlineCommitBtn')) return;
        var hBtn = e.target && e.target.closest ? e.target.closest('[data-pp-crop-handle]') : null;
        startCropInteraction(e, hBtn ? hBtn.getAttribute('data-pp-crop-handle') : 'move-box');
      });

      // Clicking ANYWHERE outside the Crop Box on the pasteboard/outer zone rotates smoothly like Photoshop!
      cropStageEl.addEventListener('pointerdown', function (e) {
        if (!ppState || ppActiveTool !== 'crop' || ppActiveStep !== 'edit') return;
        if (ppPsController && ppPsController.isSpaceHeld()) return;
        if (e.target && e.target.closest && e.target.closest('#ppCropBox,[data-ps-dock],button')) return;
        startCropInteraction(e, 'rotate-outside');
      });

      cropStageEl.addEventListener('pointermove', function (e) {
        if (!cropDrag || !ppState) return;
        e.preventDefault();
        var lastEvX = e.clientX;
        var lastEvY = e.clientY;
        var shiftKey = e.shiftKey;

        if (cropDrag.mode === 'rotate-outside') {
          var curRad = Math.atan2(lastEvY - cropDrag.cy, lastEvX - cropDrag.cx);
          var deltaDeg = ((curRad - cropDrag.startRad) * 180) / Math.PI;
          if (deltaDeg > 180) deltaDeg -= 360;
          if (deltaDeg < -180) deltaDeg += 360;
          var nextDeg = Math.max(-45, Math.min(45, cropDrag.origAngle + deltaDeg));
          if (shiftKey) nextDeg = Math.round(nextDeg);
          ppState.straighten = Math.round(nextDeg * 10) / 10;
          if (rotHud) {
            rotHud.hidden = false;
            rotHud.textContent = '↻ ' + (ppState.straighten > 0 ? '+' : '') + ppState.straighten.toFixed(1) + '°';
            rotHud.style.left = (lastEvX + 16) + 'px';
            rotHud.style.top = (lastEvY - 12) + 'px';
          }
        } else if (cropDrag.mode === 'move-box') {
          var dx = (lastEvX - cropDrag.startX) / cropDrag.cw;
          var dy = (lastEvY - cropDrag.startY) / cropDrag.ch;
          var ob = cropDrag.origBox;
          ppState.cropBox = {
            x: Math.max(0, Math.min(1 - ob.w, ob.x + dx)),
            y: Math.max(0, Math.min(1 - ob.h, ob.y + dy)),
            w: ob.w,
            h: ob.h
          };
        } else {
          var rdx = (lastEvX - cropDrag.startX) / cropDrag.cw;
          var rdy = (lastEvY - cropDrag.startY) / cropDrag.ch;
          var o = cropDrag.origBox;
          var b = Object.assign({}, o);
          var spec = getActivePpSizeSpec();
          var baseC = ppState._cropBaseCanvas || cropCanvEl;
          var aspectNorm = (spec.free || shiftKey) ? 0 : ((spec.w / Math.max(1, spec.h)) * (baseC.height / Math.max(1, baseC.width)));
          var m = cropDrag.mode;

          if (m.indexOf('e') !== -1) b.w = Math.max(0.12, Math.min(1 - o.x, o.w + rdx));
          if (m.indexOf('s') !== -1) b.h = Math.max(0.12, Math.min(1 - o.y, o.h + rdy));
          if (m.indexOf('w') !== -1) {
            var nw = Math.max(0.12, Math.min(o.x + o.w, o.w - rdx));
            b.x = o.x + (o.w - nw);
            b.w = nw;
          }
          if (m.indexOf('n') !== -1) {
            var nh = Math.max(0.12, Math.min(o.y + o.h, o.h - rdy));
            b.y = o.y + (o.h - nh);
            b.h = nh;
          }
          if (aspectNorm > 0) {
            var rightEdge = o.x + o.w;
            var bottomEdge = o.y + o.h;
            var maxW = m.indexOf('w') !== -1 ? rightEdge : (1 - b.x);
            var maxH = m.indexOf('n') !== -1 ? bottomEdge : (1 - b.y);
            if (m === 'n' || m === 's') {
              b.w = Math.min(maxW, b.h * aspectNorm);
              b.h = b.w / aspectNorm;
            } else {
              b.h = Math.min(maxH, b.w / aspectNorm);
              b.w = b.h * aspectNorm;
            }
            if (m.indexOf('w') !== -1) b.x = Math.max(0, rightEdge - b.w);
            if (m.indexOf('n') !== -1) b.y = Math.max(0, bottomEdge - b.h);
          }
          ppState.cropBox = b;
        }

        if (!cropRaf) {
          cropRaf = requestAnimationFrame(function () {
            cropRaf = 0;
            syncPpCropDomFast();
          });
        }
      });

      var endCropInteraction = function (e) {
        if (!cropDrag) return;
        if (e && e.pointerId != null && cropStageEl.hasPointerCapture) {
          try {
            if (cropStageEl.hasPointerCapture(e.pointerId)) cropStageEl.releasePointerCapture(e.pointerId);
          } catch (_) {}
        }
        cropDrag = null;
        if (cropFineGrid) cropFineGrid.setAttribute('opacity', '0');
        if (rotHud) rotHud.hidden = true;
        renderPassportPhotoAndSheet(false);
      };
      cropStageEl.addEventListener('pointerup', endCropInteraction);
      cropStageEl.addEventListener('pointercancel', endCropInteraction);
      cropBoxEl.addEventListener('dblclick', commitPpCrop);
    }

    // Brush Tool Sub-Modes & Feathered Brush Cursor HUD
    $$('#ppBrushSubModeGroup [data-pp-brush-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        ppBrushSubMode = btn.getAttribute('data-pp-brush-mode') || 'paint';
        $$('#ppBrushSubModeGroup [data-pp-brush-mode]').forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
      });
    });

    function syncPpBrushColorUi(hex) {
      var c = (hex || '#ffffff').toUpperCase();
      if ($('#ppBrushColor')) $('#ppBrushColor').value = c;
      if ($('#ppDockFgInput')) $('#ppDockFgInput').value = c;
      if ($('#ppBrushColorChip')) $('#ppBrushColorChip').style.background = c;
      if ($('#ppDockFgSwatch')) $('#ppDockFgSwatch').style.background = c;
      if ($('#ppBrushColorHex')) $('#ppBrushColorHex').textContent = c;
      refreshPpBrushPreview(false);
    }

    var brushHudTimer = 0;
    function refreshPpBrushPreview(showHud) {
      var bSize = parseInt(($('#ppBrushSize') && $('#ppBrushSize').value) || '26', 10);
      var bHard = parseInt(($('#ppBrushHardness') && $('#ppBrushHardness').value) || '65', 10);
      var bOp = parseInt(($('#ppBrushOpacity') && $('#ppBrushOpacity').value) || '100', 10);
      var bHex = ($('#ppBrushColor') && $('#ppBrushColor').value) || '#ffffff';

      if ($('#ppBrushSizeVal')) $('#ppBrushSizeVal').textContent = bSize + 'px';
      if ($('#ppBrushHardnessVal')) $('#ppBrushHardnessVal').textContent = bHard + '%';
      if ($('#ppBrushOpacityVal')) $('#ppBrushOpacityVal').textContent = bOp + '%';
      if ($('#ppBrushHudText')) $('#ppBrushHudText').textContent = bSize + 'px • ' + bHard + '% • ' + bOp + '%';

      var curEl = $('#ppBrushCursor');
      var prevCanv = $('#ppBrushPreviewCanvas');
      if (prevCanv && window.TechHatPsStudio) {
        window.TechHatPsStudio.renderFeatheredBrushPreview(prevCanv, {
          size: bSize,
          hardness: bHard,
          opacity: bOp,
          color: bHex,
          hudMode: !!showHud
        });
      }
      if (curEl) {
        curEl.style.width = bSize + 'px';
        curEl.style.height = bSize + 'px';
        if (showHud && (ppActiveTool === 'brush' || ppActiveTool === 'eraser')) {
          clearTimeout(brushHudTimer);
          curEl.hidden = false;
          if (!curEl.style.left) { curEl.style.left = '50%'; curEl.style.top = '50%'; }
          curEl.setAttribute('data-hud', 'true');
          brushHudTimer = setTimeout(function () {
            curEl.setAttribute('data-hud', 'false');
          }, 950);
        }
      }
    }

    on('ppBrushColor', 'input', function () { syncPpBrushColorUi($('#ppBrushColor').value); });
    on('ppDockFgInput', 'input', function () {
      syncPpBrushColorUi($('#ppDockFgInput').value);
      if (ppActiveTool !== 'brush') setPpTool('brush');
    });
    on('ppDockBgInput', 'input', function () {
      var hex = ($('#ppDockBgInput') && $('#ppDockBgInput').value) || '#0088ff';
      applyPpBgHex(hex);
    });

    ['ppBrushSize', 'ppBrushHardness', 'ppBrushOpacity'].forEach(function (id) {
      on(id, 'input', function () { refreshPpBrushPreview(true); });
    });

    on('ppClearPaintBtn', 'click', function () {
      if (!ppState || !ppState.paintCanvas) return;
      pushPpHistory();
      var pctx = ppState.paintCanvas.getContext('2d');
      pctx.clearRect(0, 0, ppState.paintCanvas.width, ppState.paintCanvas.height);
      renderPassportPhotoAndSheet(false);
      showToast(tr('ব্রাশ রিটাচ ক্লিয়ার করা হয়েছে', 'Brush layer cleared'));
    });

    // Color Picker Apply Actions
    var lastPickedPpHex = '#0088FF';
    on('ppApplyPickedBgBtn', 'click', function () {
      if (!ppState) return;
      pushPpHistory();
      applyPpBgHex(lastPickedPpHex);
      showToast(tr('পিক করা রঙ ব্যাকগ্রাউন্ডে বসানো হয়েছে!', 'Picked color applied to background!'));
    });
    on('ppApplyPickedBrushBtn', 'click', function () {
      syncPpBrushColorUi(lastPickedPpHex);
      setPpTool('brush');
      showToast(tr('ব্রাশ কালার সেট করা হয়েছে!', 'Brush color updated!'));
    });

    // Layers Blend Mode, Opacity & Lock Controls
    on('ppLayerBlendMode', 'change', function () {
      if (!ppState || !ppState.layers || !ppState.layers[ppActiveLayerId]) return;
      ppState.layers[ppActiveLayerId].blend = $('#ppLayerBlendMode').value || 'source-over';
      renderPassportPhotoAndSheet(false);
    });
    on('ppLayerOpacity', 'input', function () {
      if (!ppState || !ppState.layers || !ppState.layers[ppActiveLayerId]) return;
      var v = Math.max(0, Math.min(100, parseInt($('#ppLayerOpacity').value, 10) || 100));
      ppState.layers[ppActiveLayerId].opacity = v;
      renderPpLayersPanel();
      renderPassportPhotoAndSheet(false);
    });
    on('ppLayerLockBtn', 'click', function () {
      if (!ppState || !ppState.layers || !ppState.layers[ppActiveLayerId]) return;
      var lyr = ppState.layers[ppActiveLayerId];
      lyr.locked = !lyr.locked;
      renderPpLayersPanel();
      renderPpTransformBox();
    });

    // Photoshop Layer Action Footer Buttons (+ Paint Layer, + Adjustment Layer, + Cutout, Delete/Reset)
    on('ppLayerAddBgCutoutBtn', 'click', function () {
      var bgBtn = $('#ppAutoAiBgRemoveBtn');
      if (bgBtn) bgBtn.click();
    });
    on('ppLayerAddAdjBtn', 'click', function () {
      if (!ppState) return;
      pushPpHistory();
      ppState.hasAdjustLayer = true;
      ppActiveLayerId = 'adjust';
      renderPpLayersPanel();
      showToast(tr('অ্যাডজাস্টমেন্ট লেয়ার যোগ করা হয়েছে', 'Adjustment layer added'));
    });
    on('ppLayerAddPaintBtn', 'click', function () {
      if (!ppState) return;
      pushPpHistory();
      ppState.hasPaintLayer = true;
      ppActiveLayerId = 'paint';
      renderPpLayersPanel();
      setPpTool('brush');
      showToast(tr('নতুন ব্রাশ রিটাচ লেয়ার তৈরি হয়েছে', 'New Brush layer added'));
    });
    on('ppLayerDeleteBtn', 'click', function () {
      if (!ppState) return;
      if (ppActiveLayerId === 'paint') {
        pushPpHistory();
        ppState.hasPaintLayer = false;
        if (ppState.paintCanvas) {
          ppState.paintCanvas.getContext('2d').clearRect(0, 0, ppState.paintCanvas.width, ppState.paintCanvas.height);
          ppState.paintCanvas = null;
        }
        ppActiveLayerId = 'subject';
        renderPpLayersPanel();
        renderPassportPhotoAndSheet(false);
        showToast(tr('ব্রাশ লেয়ার মুছে ফেলা হয়েছে', 'Brush layer deleted'));
      } else if (ppActiveLayerId === 'adjust') {
        var rstClr = $('#ppColorResetBtn');
        if (rstClr) rstClr.click();
        ppState.hasAdjustLayer = false;
        ppActiveLayerId = 'subject';
        renderPpLayersPanel();
      } else if (ppState.item && ppState.item.cutoutCanvas) {
        var rstCut = $('#ppResetCutoutBtn');
        if (rstCut) rstCut.click();
        renderPpLayersPanel();
      } else {
        showToast(tr('মূল Background লেয়ার মোছা যাবে না', 'Cannot delete base Background layer'));
      }
    });

    // Move Tool Options: Show Transform Controls & 6 Alignment Buttons
    on('ppShowTransform', 'change', renderPpTransformBox);
    $$('[data-pp-align]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!ppState || !ppState.layers) return;
        var lyr = ppState.layers[ppActiveLayerId];
        if (!lyr || lyr.locked) return;
        pushPpHistory();
        var dir = btn.getAttribute('data-pp-align');
        var halfW = (1 - (lyr.sx || 1)) * 0.5;
        var halfH = (1 - (lyr.sy || 1)) * 0.5;
        if (dir === 'left') lyr.tx = -halfW;
        else if (dir === 'center-x') lyr.tx = 0;
        else if (dir === 'right') lyr.tx = halfW;
        else if (dir === 'top') lyr.ty = -halfH;
        else if (dir === 'center-y') lyr.ty = 0;
        else if (dir === 'bottom') lyr.ty = halfH;
        renderPassportPhotoAndSheet(false);
        renderPpTransformBox();
      });
    });

    // AI Provider Tabs
    $$('#ppAiProviderTabs [data-ai-provider]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        ppAiConfig.provider = btn.getAttribute('data-ai-provider') || 'free-flux';
        savePpAiConfig();
        syncPpApiUi();
      });
    });

    on('ppApiKeyToggleBtn', 'click', function () {
      var inp = $('#ppApiKeyInput');
      if (!inp) return;
      inp.type = inp.type === 'password' ? 'text' : 'password';
    });

    on('ppApiSaveBtn', 'click', async function () {
      var inp = $('#ppApiKeyInput');
      var key = (inp && inp.value.trim()) || '';
      var provider = ppAiConfig.provider || 'free-flux';
      ppAiConfig.keys[provider] = key;
      savePpAiConfig();
      syncPpApiUi();
      setPpApiDiagBanner('', '');
      if (provider === 'free-flux') {
        showToast(key ? tr('HuggingFace Token সংরক্ষিত হয়েছে!', 'HuggingFace Token saved!') : tr('ফ্রি মোড সক্রিয় আছে!', 'Free mode is active!'));
        return;
      }
      if (key.length < 10) {
        showToast(tr('সঠিক API Key প্রদান করুন', 'Please enter a valid API Key'));
        return;
      }
      if (provider === 'gemini') {
        var saveBtn = $('#ppApiSaveBtn');
        if (saveBtn) saveBtn.disabled = true;
        var disc = await discoverGeminiImageModels(key);
        if (saveBtn) saveBtn.disabled = false;
        if (disc.ok) {
          var sel = $('#ppGeminiModelSelect');
          if (sel) {
            var prevVal = sel.value || 'auto';
            sel.textContent = '';
            var autoOpt = document.createElement('option');
            autoOpt.value = 'auto';
            autoOpt.textContent = 'Auto (' + disc.models[0] + ')';
            sel.appendChild(autoOpt);
            disc.models.forEach(function (mId) {
              var opt = document.createElement('option');
              opt.value = mId;
              opt.textContent = mId;
              sel.appendChild(opt);
            });
            sel.value = disc.models.indexOf(prevVal) !== -1 ? prevVal : 'auto';
          }
          setPpApiDiagBanner('ok', '✓ Gemini API Key যাচাইকৃত (' + disc.models[0] + ')।');
          showToast(tr('Gemini API Key যাচাইকৃত ও সংযুক্ত হয়েছে!', 'Gemini API Key verified!'));
        } else {
          showToast(tr('API Key সংরক্ষিত হয়েছে', 'API Key saved'));
        }
      } else {
        showToast(tr('API Key সংরক্ষিত ও সংযুক্ত হয়েছে!', 'API Key saved and connected!'));
      }
    });

    on('ppApiClearBtn', 'click', function () {
      var provider = ppAiConfig.provider || 'free-flux';
      ppAiConfig.keys[provider] = '';
      savePpAiConfig();
      syncPpApiUi();
      setPpApiDiagBanner('', '');
      showToast(tr('API Key রিসেট করা হয়েছে', 'API Key cleared'));
    });

    // Subject Category Tabs (male | female | general)
    $$('#ppAiCategoryTabs [data-ai-cat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        ppActiveCategory = btn.getAttribute('data-ai-cat') || 'male';
        $$('#ppAiCategoryTabs [data-ai-cat]').forEach(function (b) {
          b.setAttribute('aria-pressed', b.getAttribute('data-ai-cat') === ppActiveCategory ? 'true' : 'false');
        });
        var list = PP_AI_STYLE_PRESETS[ppActiveCategory] || PP_AI_STYLE_PRESETS.male;
        ppActiveStyleId = list[0].id;
        renderPpAiPresetButtons();
      });
    });

    // Granular AI Portrait Customization Dropdowns (Head/Selfie, Hair, Skin, Beard)
    ['ppAiHeadMode', 'ppAiHairMode', 'ppAiSkinMode', 'ppAiBeardMode'].forEach(function (id) {
      on(id, 'change', buildPassportAiPrompt);
    });

    // Background Color Swatches (Sidebar + AI Modal)
    function applyPpBgHex(hex, bgName) {
      ppActiveBgHex = hex || '#ffffff';
      ppActiveBgName = bgName || ('solid studio color (' + ppActiveBgHex.toUpperCase() + ')');
      if ($('#ppBgColorInput')) $('#ppBgColorInput').value = ppActiveBgHex;
      if ($('#ppDockBgInput')) $('#ppDockBgInput').value = ppActiveBgHex;
      if ($('#ppDockBgSwatch')) $('#ppDockBgSwatch').style.background = ppActiveBgHex;
      if ($('#ppBgColorLabel')) $('#ppBgColorLabel').textContent = ppActiveBgHex.toUpperCase();
      $$('#ppBgSwatches .pp-swatch').forEach(function (b) {
        var match = (b.getAttribute('data-bg') || '').toLowerCase() === ppActiveBgHex.toLowerCase();
        b.classList.toggle('is-active', match);
        b.classList.toggle('border-2', match);
        b.classList.toggle('border-sky-500', match);
      });
      $$('#ppModalBgSwatches [data-modal-bg]').forEach(function (b) {
        var match = (b.getAttribute('data-modal-bg') || '').toLowerCase() === ppActiveBgHex.toLowerCase();
        b.classList.toggle('border-2', match);
        b.classList.toggle('border-sky-500', match);
      });
      buildPassportAiPrompt();
      renderPpLayersPanel();
      if (ppActiveTool === 'crop') renderPpCropStage();
      else renderPassportPhotoAndSheet();
    }

    $$('#ppBgSwatches [data-bg]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        pushPpHistory();
        applyPpBgHex(btn.getAttribute('data-bg'), btn.getAttribute('data-bg-name'));
      });
    });
    $$('#ppModalBgSwatches [data-modal-bg]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyPpBgHex(btn.getAttribute('data-modal-bg'), btn.getAttribute('data-bg-name'));
      });
    });

    on('ppBgColorInput', 'input', function () {
      var inp = $('#ppBgColorInput');
      if (inp) applyPpBgHex(inp.value);
    });

    // Prompt Options & Actions
    on('ppAiOptStraight', 'change', buildPassportAiPrompt);
    on('ppAiOptRetouch', 'change', buildPassportAiPrompt);
    on('ppAiResetPromptBtn', 'click', function () {
      buildPassportAiPrompt();
      showToast(tr('প্রম্পট রিসেট করা হয়েছে', 'Prompt reset to default'));
    });
    on('ppAiCopyPromptBtn', 'click', function () {
      var el = $('#ppAiPromptInput');
      if (!el || !el.value) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(el.value).then(function () {
          showToast(tr('প্রম্পট কপি করা হয়েছে!', 'Prompt copied to clipboard!'));
        });
      }
    });

    on('ppAiGenerateBtn', 'click', generatePassportWithAi);
    on('ppAiRevertBtn', 'click', function () {
      if (!ppState || !ppState.item) return;
      pushPpHistory();
      ppState.item.aiImg = null;
      ppState.cropBox = null;
      ensureEntryPhotoshopState(ppState);
      if ($('#ppAiRevertBtn')) $('#ppAiRevertBtn').hidden = true;
      renderPpFilmstrip();
      updatePpStageVisibility();
      showToast(tr('মূল ছবিতে ফিরে যাওয়া হয়েছে', 'Reverted to original photo'));
    });

    // 1-Click Free Browser 1024px Studio Neural AI Background Removal
    async function runPassportOneClickBgRemove() {
      syncPpStateRef();
      if (!ppState || !ppState.item || !ppState.item.img) {
        showToast(tr('প্রথমে একটি ছবি আপলোড করুন', 'Please upload a photo first'));
        return;
      }
      var btn = $('#ppAutoAiBgRemoveBtn');
      var overlay = $('#ppAiLoadingOverlay');
      var loadingTxt = $('#ppAiLoadingText');
      var badge = $('#ppAutoAiBgStatusBadge');
      if (btn) btn.disabled = true;
      if (overlay) overlay.hidden = false;
      if (loadingTxt) loadingTxt.textContent = tr('✨ ১০২৪px স্টুডিও AI ব্যাকগ্রাউন্ড রিমুভ করছে...', '✨ 1024px Studio AI is removing background...');

      try {
        if (!window.TechHatBgRemover) {
          await new Promise(function (resolve) {
            var s = document.createElement('script');
            s.src = '/js/bg-remover-engine.js?v=84';
            s.onload = resolve;
            s.onerror = resolve;
            document.body.appendChild(s);
          });
        }
        if (!window.TechHatBgRemover || !window.TechHatBgRemover.removeBackground) {
          throw new Error(tr('ব্যাকগ্রাউন্ড রিমুভার ইঞ্জিন লোড করা যায়নি', 'Background remover engine could not be loaded'));
        }
        var featherVal = parseFloat(($('#ppEdgeFeather') && $('#ppEdgeFeather').value) || '0.4');
        var res = await window.TechHatBgRemover.removeBackground(ppState.item.aiImg || ppState.item.img, {
          mode: 'auto',
          edgeFeather: featherVal,
          decontaminate: true,
          onProgress: function (pct, msg) {
            if (loadingTxt && msg) loadingTxt.textContent = msg;
          }
        });
        pushPpHistory();
        ppState.item.srcCanvas = res.srcCanvas;
        ppState.item.cutoutMask = new Float32Array(res.baseMask || res.mask);
        ppState.item.cutoutCanvas = res.cutoutCanvas;
        if ($('#ppCutoutEdgeControls')) $('#ppCutoutEdgeControls').hidden = false;
        if ($('#ppResetCutoutBtn')) $('#ppResetCutoutBtn').hidden = false;
        if (badge) {
          badge.textContent = 'AI Cutout ✓';
          badge.className = 'px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9.5px] font-extrabold';
        }
        renderPpFilmstrip();
        updatePpStageVisibility();
        showToast(tr('✨ ব্যাকগ্রাউন্ড সফলভাবে রিমুভ হয়েছে! যেকোনো রঙ বেছে নিন।', '✨ Background removed! Pick any backdrop color.'));
      } catch (err) {
        showToast((err && err.message) || tr('ব্যাকগ্রাউন্ড রিমুভ করতে সমস্যা হয়েছে', 'Failed to remove background'));
      } finally {
        if (overlay) overlay.hidden = true;
        if (btn) btn.disabled = false;
      }
    }
    on('ppAutoAiBgRemoveBtn', 'click', runPassportOneClickBgRemove);
    on('ppTopAutoBgBtn', 'click', runPassportOneClickBgRemove);

    on('ppEdgeFeather', 'input', function () {
      var fEl = $('#ppEdgeFeather');
      var fVal = parseFloat((fEl && fEl.value) || '0.4');
      if ($('#ppEdgeFeatherVal')) $('#ppEdgeFeatherVal').textContent = fVal.toFixed(1) + 'px';
      if (ppState && ppState.item && ppState.item.cutoutMask && ppState.item.srcCanvas && window.TechHatBgRemover) {
        ppState.item.cutoutCanvas = window.TechHatBgRemover.renderCutoutFromMask(
          ppState.item.srcCanvas,
          ppState.item.cutoutMask,
          { edgeFeather: fVal, decontaminate: true }
        );
        updatePpStageVisibility();
      }
    });

    on('ppResetCutoutBtn', 'click', function () {
      if (!ppState || !ppState.item) return;
      pushPpHistory();
      ppState.item.cutoutCanvas = null;
      ppState.item.cutoutMask = null;
      updatePpStageVisibility();
      showToast(tr('ব্যাকগ্রাউন্ড রিসেট করা হয়েছে', 'Background reset to original'));
    });

    // Auto Face Straighten & Centering
    function triggerAutoFaceStraighten() {
      if (!ppState) return;
      pushPpHistory();
      var res = autoStraightenAndCenterFace(ppState);
      ppState.straighten = res.angle;
      if ($('#ppStraightenAngle')) $('#ppStraightenAngle').value = String(res.angle);
      updatePpStageVisibility();
      showToast(tr('মুখমণ্ডল স্বয়ংক্রিয়ভাবে সোজা করা হয়েছে!', 'Face automatically straightened!'));
    }
    on('ppAutoFaceStraightenBtn', 'click', triggerAutoFaceStraighten);
    on('ppQuickStraightenBtn', 'click', triggerAutoFaceStraighten);

    // DSLR Clarity, Skin Smooth & Studio Light toggles
    on('ppDslrClarityBtn', 'click', function () {
      if (!ppState) return;
      pushPpHistory();
      ppState.dslrClarity = !ppState.dslrClarity;
      $('#ppDslrClarityBtn').setAttribute('aria-pressed', ppState.dslrClarity ? 'true' : 'false');
      if (ppActiveTool === 'crop') setPpTool('move');
      else renderPassportPhotoAndSheet(false);
    });
    on('ppSkinSmoothBtn', 'click', function () {
      if (!ppState) return;
      pushPpHistory();
      ppState.skinSmooth = !ppState.skinSmooth;
      $('#ppSkinSmoothBtn').setAttribute('aria-pressed', ppState.skinSmooth ? 'true' : 'false');
      if (ppActiveTool === 'crop') setPpTool('move');
      else renderPassportPhotoAndSheet(false);
    });
    on('ppStudioLightBtn', 'click', function () {
      if (!ppState) return;
      pushPpHistory();
      ppState.studioLight = !ppState.studioLight;
      $('#ppStudioLightBtn').setAttribute('aria-pressed', ppState.studioLight ? 'true' : 'false');
      if (ppActiveTool === 'crop') setPpTool('move');
      else renderPassportPhotoAndSheet(false);
    });
    on('ppColorResetBtn', 'click', function () {
      if (!ppState) return;
      pushPpHistory();
      ppState.dslrClarity = false;
      ppState.skinSmooth = false;
      ppState.studioLight = false;
      ppState.dehaze = 0;
      ppState.sharpness = 0;
      if ($('#ppBright')) $('#ppBright').value = '100';
      if ($('#ppContrast')) $('#ppContrast').value = '100';
      if ($('#ppSat')) $('#ppSat').value = '100';
      if ($('#ppDehaze')) $('#ppDehaze').value = '0';
      if ($('#ppSharpness')) $('#ppSharpness').value = '0';
      if ($('#ppDslrClarityBtn')) $('#ppDslrClarityBtn').setAttribute('aria-pressed', 'false');
      if ($('#ppSkinSmoothBtn')) $('#ppSkinSmoothBtn').setAttribute('aria-pressed', 'false');
      if ($('#ppStudioLightBtn')) $('#ppStudioLightBtn').setAttribute('aria-pressed', 'false');
      updatePpStageVisibility();
    });

    // Top toolbar Rotate 90° / Flip / Guide toggle
    on('ppRotLBtn', 'click', function () {
      if (!ppState) return;
      pushPpHistory();
      ppState.rot = ((ppState.rot || 0) - 90 + 360) % 360;
      ppState.cropBox = null;
      ensureEntryPhotoshopState(ppState);
      updatePpStageVisibility();
    });
    on('ppRotRBtn', 'click', function () {
      if (!ppState) return;
      pushPpHistory();
      ppState.rot = ((ppState.rot || 0) + 90) % 360;
      ppState.cropBox = null;
      ensureEntryPhotoshopState(ppState);
      updatePpStageVisibility();
    });
    on('ppFlipHBtn', 'click', function () {
      if (!ppState) return;
      pushPpHistory();
      ppState.flipH = (ppState.flipH || 1) * -1;
      updatePpStageVisibility();
    });
    on('ppToggleGuideBtn', 'click', function () {
      var b = $('#ppToggleGuideBtn');
      if (!b) return;
      var pressed = b.getAttribute('aria-pressed') !== 'false';
      var next = !pressed;
      b.setAttribute('aria-pressed', next ? 'true' : 'false');
      if ($('#ppCropGridSvg')) $('#ppCropGridSvg').style.opacity = next ? '1' : '0';
      if ($('#ppBiometricGuideSvg')) $('#ppBiometricGuideSvg').hidden = !next;
    });

    function restorePpSnapshot(snap) {
      if (!ppState || !snap) return;
      ppState.cropImgPanX = snap.cropImgPanX || 0;
      ppState.cropImgPanY = snap.cropImgPanY || 0;
      ppState.rot = snap.rot || 0;
      ppState.flipH = snap.flipH || 1;
      ppState.straighten = snap.straighten || 0;
      ppState.cropCommitted = !!snap.cropCommitted;
      ppState.hasPaintLayer = !!snap.hasPaintLayer;
      ppState.hasAdjustLayer = !!snap.hasAdjustLayer;
      ppState.dslrClarity = !!snap.dslrClarity;
      ppState.skinSmooth = !!snap.skinSmooth;
      ppState.studioLight = !!snap.studioLight;
      ppState.dehaze = snap.dehaze || 0;
      ppState.sharpness = snap.sharpness || 0;
      if (snap.cropBox) ppState.cropBox = Object.assign({}, snap.cropBox);
      if (snap.layersSnap) ppState.layers = JSON.parse(JSON.stringify(snap.layersSnap));
      ppActiveBgHex = snap.bgColor || '#0088ff';
      if ($('#ppStraightenAngle')) $('#ppStraightenAngle').value = Number(snap.straighten || 0).toFixed(1);
      if ($('#ppDslrClarityBtn')) $('#ppDslrClarityBtn').setAttribute('aria-pressed', ppState.dslrClarity ? 'true' : 'false');
      if ($('#ppSkinSmoothBtn')) $('#ppSkinSmoothBtn').setAttribute('aria-pressed', ppState.skinSmooth ? 'true' : 'false');
      if ($('#ppStudioLightBtn')) $('#ppStudioLightBtn').setAttribute('aria-pressed', ppState.studioLight ? 'true' : 'false');
      renderPpLayersPanel();
      if (snap.paintSnap && ppState.paintCanvas) {
        var im = new Image();
        im.onload = function () {
          var pctx = ppState.paintCanvas.getContext('2d');
          pctx.clearRect(0, 0, ppState.paintCanvas.width, ppState.paintCanvas.height);
          pctx.drawImage(im, 0, 0);
          updatePpStageVisibility();
        };
        im.src = snap.paintSnap;
      } else if (ppState.paintCanvas) {
        ppState.paintCanvas.getContext('2d').clearRect(0, 0, ppState.paintCanvas.width, ppState.paintCanvas.height);
      }
      updatePpStageVisibility();
    }

    function triggerPpUndo() {
      if (!ppState || !ppUndoStack.length) return;
      var curPaint = ppState.paintCanvas ? ppState.paintCanvas.toDataURL('image/png') : null;
      ppRedoStack.push({
        cropImgPanX: ppState.cropImgPanX || 0, cropImgPanY: ppState.cropImgPanY || 0,
        rot: ppState.rot || 0, flipH: ppState.flipH || 1, straighten: ppState.straighten || 0,
        cropCommitted: !!ppState.cropCommitted, hasPaintLayer: !!ppState.hasPaintLayer, hasAdjustLayer: !!ppState.hasAdjustLayer,
        dslrClarity: !!ppState.dslrClarity, skinSmooth: !!ppState.skinSmooth, studioLight: !!ppState.studioLight,
        dehaze: ppState.dehaze || 0, sharpness: ppState.sharpness || 0,
        cropBox: ppState.cropBox ? Object.assign({}, ppState.cropBox) : null,
        layersSnap: JSON.parse(JSON.stringify(ppState.layers)),
        paintSnap: curPaint, bgColor: ppActiveBgHex
      });
      var prev = ppUndoStack.pop();
      if ($('#ppUndoBtn')) $('#ppUndoBtn').disabled = ppUndoStack.length === 0;
      if ($('#ppRedoBtn')) $('#ppRedoBtn').disabled = ppRedoStack.length === 0;
      restorePpSnapshot(prev);
    }

    function triggerPpRedo() {
      if (!ppState || !ppRedoStack.length) return;
      var curPaint = ppState.paintCanvas ? ppState.paintCanvas.toDataURL('image/png') : null;
      ppUndoStack.push({
        cropImgPanX: ppState.cropImgPanX || 0, cropImgPanY: ppState.cropImgPanY || 0,
        rot: ppState.rot || 0, flipH: ppState.flipH || 1, straighten: ppState.straighten || 0,
        cropCommitted: !!ppState.cropCommitted, hasPaintLayer: !!ppState.hasPaintLayer, hasAdjustLayer: !!ppState.hasAdjustLayer,
        dslrClarity: !!ppState.dslrClarity, skinSmooth: !!ppState.skinSmooth, studioLight: !!ppState.studioLight,
        dehaze: ppState.dehaze || 0, sharpness: ppState.sharpness || 0,
        cropBox: ppState.cropBox ? Object.assign({}, ppState.cropBox) : null,
        layersSnap: JSON.parse(JSON.stringify(ppState.layers)),
        paintSnap: curPaint, bgColor: ppActiveBgHex
      });
      var next = ppRedoStack.pop();
      if ($('#ppUndoBtn')) $('#ppUndoBtn').disabled = ppUndoStack.length === 0;
      if ($('#ppRedoBtn')) $('#ppRedoBtn').disabled = ppRedoStack.length === 0;
      restorePpSnapshot(next);
    }

    on('ppUndoBtn', 'click', triggerPpUndo);
    on('ppRedoBtn', 'click', triggerPpRedo);

    // =========================================================================
    // MOUNT REUSABLE PHOTOSHOP STUDIO ENGINE (`window.TechHatPsStudio`)
    // Canvas-Level Zoom (Wheel / Z / Ctrl± / Ctrl+0) & Pan (Space / H) + Shortcuts!
    // =========================================================================
    if (window.TechHatPsStudio && window.TechHatPsStudio.createController) {
      ppPsController = window.TechHatPsStudio.createController({
        rootEl: $('#img-pane-passport-photo'),
        stageEl: $('#ppSingleStageWrap'),
        getPlaneEl: function () {
          return ppActiveTool === 'crop' ? $('#ppCropInteractiveWrap') : $('#ppEditedCanvasWrap');
        },
        isActive: function () {
          var pane = $('#img-pane-passport-photo');
          return !!(pane && !pane.hidden && pane.getAttribute('data-has-pages') === 'true' && ppActiveStep === 'edit');
        },
        getTool: function () { return ppActiveTool; },
        setTool: function (t) { setPpTool(t); },
        onZoomChange: function (z) {
          var pctNum = Math.round(z * 100);
          var pctTxt = pctNum + '%';
          if ($('#ppZoomHudVal')) $('#ppZoomHudVal').textContent = pctTxt;
          if ($('#ppTopZoomLabel')) $('#ppTopZoomLabel').textContent = pctTxt;
          var tabLbl = $('#ppActiveDocTabLabel');
          if (tabLbl && ppState && ppState.item) {
            tabLbl.textContent = (ppState.item.name || 'Photo.jpg') + ' @ ' + pctNum + '% (RGB/8)';
          }
        },
        onBrushStep: function (st) {
          if (st.sizeDelta && $('#ppBrushSize')) {
            var curSz = parseInt($('#ppBrushSize').value, 10) || 26;
            $('#ppBrushSize').value = String(Math.max(2, Math.min(140, curSz + st.sizeDelta)));
          }
          if (st.hardnessDelta && $('#ppBrushHardness')) {
            var curHd = parseInt($('#ppBrushHardness').value, 10) || 65;
            $('#ppBrushHardness').value = String(Math.max(0, Math.min(100, curHd + st.hardnessDelta)));
          }
          if (st.opacityVal != null && $('#ppBrushOpacity')) {
            $('#ppBrushOpacity').value = String(Math.max(10, Math.min(100, st.opacityVal)));
          }
          refreshPpBrushPreview(true);
        },
        onUndo: triggerPpUndo,
        onRedo: triggerPpRedo,
        onCommitCrop: commitPpCrop,
        onCancelCrop: function () {
          var rst = $('#ppCropResetBoxBtn');
          if (rst) rst.click();
        },
        onNudge: function (dx, dy) {
          if (!ppState || !ppState.layers) return;
          var lyr = ppState.layers[ppActiveLayerId];
          if (!lyr || lyr.locked) return;
          var sc = $('#ppSingleCanvas');
          var cw = (sc && sc.width) || 472;
          var ch = (sc && sc.height) || 591;
          lyr.tx = (lyr.tx || 0) + dx / cw;
          lyr.ty = (lyr.ty || 0) + dy / ch;
          renderPassportPhotoAndSheet(false);
          renderPpTransformBox();
        },
        onSwapColors: function () {
          var fg = ($('#ppBrushColor') && $('#ppBrushColor').value) || '#ffffff';
          var bg = ppActiveBgHex || '#0088ff';
          syncPpBrushColorUi(bg);
          applyPpBgHex(fg);
        },
        onResetColors: function () {
          syncPpBrushColorUi('#ffffff');
          applyPpBgHex('#0088ff', 'vibrant studio passport sky blue (#0088FF)');
        },
        onToggleTransform: function () {
          if (ppActiveTool !== 'move') setPpTool('move');
          var chk = $('#ppShowTransform');
          if (chk) {
            chk.checked = !chk.checked;
            renderPpTransformBox();
          }
        }
      });
    }

    // Bottom HUD & Top Viewport Zoom Buttons -> Delegate to Canvas-Level `ppPsController`!
    on('ppZoomInHudBtn', 'click', function () { if (ppPsController) ppPsController.stepZoom(1); });
    on('ppZoomOutHudBtn', 'click', function () { if (ppPsController) ppPsController.stepZoom(-1); });
    on('ppZoomFitHudBtn', 'click', function () { if (ppPsController) ppPsController.fitScreen(); });
    on('ppTopZoomInBtn', 'click', function () { if (ppPsController) ppPsController.stepZoom(1); });
    on('ppTopZoomOutBtn', 'click', function () { if (ppPsController) ppPsController.stepZoom(-1); });
    on('ppTopZoom100Btn', 'click', function () { if (ppPsController) ppPsController.setZoom(1); });
    on('ppTopZoomFitBtn', 'click', function () { if (ppPsController) ppPsController.fitScreen(); });

    on('ppStraightenAngle', 'input', function () {
      if (!ppState) return;
      ppState.straighten = Math.max(-45, Math.min(45, parseFloat($('#ppStraightenAngle').value) || 0));
      if (ppActiveTool === 'crop') syncPpCropDomFast();
      else renderPassportPhotoAndSheet(false);
    });

    ['ppBright', 'ppContrast', 'ppSat', 'ppDehaze', 'ppSharpness', 'ppShowBorder'].forEach(function (id) {
      on(id, 'input', function () {
        if (ppActiveTool === 'crop') renderPpCropStage(true);
        renderPassportPhotoAndSheet(false);
      });
      on(id, 'change', function () {
        if (ppActiveTool === 'crop') renderPpCropStage(true);
        renderPassportPhotoAndSheet(false);
      });
    });

    ['ppSheetPaper', 'ppCopiesCount', 'ppSheetGap', 'ppSheetMargin', 'ppPrintCutMarks'].forEach(function (id) {
      on(id, 'input', function () { renderPassportPhotoAndSheet(true); });
      on(id, 'change', function () { renderPassportPhotoAndSheet(true); });
    });

    on('ppResetPosBtn', 'click', function () {
      if (!ppState || !ppState.layers) return;
      var lyr = ppState.layers[ppActiveLayerId];
      if (!lyr || lyr.locked) return;
      pushPpHistory();
      lyr.tx = 0; lyr.ty = 0; lyr.sx = 1; lyr.sy = 1; lyr.rot = 0;
      renderPassportPhotoAndSheet(false);
      renderPpTransformBox();
      showToast(tr('লেয়ার ট্রান্সফর্ম রিসেট হয়েছে', 'Layer transform reset'));
    });

    function resetPpWorkspace() {
      ppItems.forEach(function (entry) {
        if (entry.item && entry.item.url) URL.revokeObjectURL(entry.item.url);
      });
      ppItems = [];
      activePpIdx = 0;
      ppState = null;
      var pane = $('#img-pane-passport-photo');
      if (pane) pane.setAttribute('data-has-pages', 'false');
      if ($('#ppStage')) $('#ppStage').hidden = true;
      if ($('#ppDropzone')) $('#ppDropzone').hidden = false;
    }
    on('ppClearAllBtn', 'click', resetPpWorkspace);

    // =========================================================================
    // EDITED ARTBOARD POINTER HANDLER: LAYER MOVE / FREE TRANSFORM, BRUSH & EYEDROPPER
    // =========================================================================
    var singleCanvas = $('#ppSingleCanvas');
    var editedWrap = $('#ppEditedCanvasWrap');
    var tfBoxEl = $('#ppTransformBox');
    if (singleCanvas && editedWrap) {
      var layerDrag = null;
      var isBrushing = false;

      function rgbToHexStr(r, g, b) {
        return '#' + [r, g, b].map(function (v) { return Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'); }).join('').toUpperCase();
      }

      function applyBrushDab(e) {
        if (!ppState) return;
        var rect = singleCanvas.getBoundingClientRect();
        var cx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * singleCanvas.width;
        var cy = ((e.clientY - rect.top) / Math.max(1, rect.height)) * singleCanvas.height;
        var bSize = parseInt(($('#ppBrushSize') && $('#ppBrushSize').value) || '26', 10);
        var hardness = parseInt(($('#ppBrushHardness') && $('#ppBrushHardness').value) || '65', 10) / 100;
        var opacity = parseInt(($('#ppBrushOpacity') && $('#ppBrushOpacity').value) || '100', 10) / 100;
        var rad = Math.max(2, (bSize * 0.5) * (singleCanvas.width / Math.max(1, rect.width)));

        if (ppBrushSubMode === 'erase-bg' || ppBrushSubMode === 'restore-bg' || ppActiveTool === 'eraser') {
          var it = ppState.item;
          if (!it.srcCanvas) {
            var baseIm = it.aiImg || it.img;
            var sc = document.createElement('canvas');
            sc.width = baseIm.naturalWidth || baseIm.width || 600;
            sc.height = baseIm.naturalHeight || baseIm.height || 750;
            sc.getContext('2d').drawImage(baseIm, 0, 0, sc.width, sc.height);
            it.srcCanvas = sc;
          }
          var mw = it.srcCanvas.width, mh = it.srcCanvas.height;
          if (!it.cutoutMask) {
            it.cutoutMask = new Float32Array(mw * mh);
            it.cutoutMask.fill(1);
          }
          var cb = ppState.cropCommitted ? (ppState.cropBox || { x: 0, y: 0, w: 1, h: 1 }) : { x: 0, y: 0, w: 1, h: 1 };
          var mx = Math.round((cb.x + (cx / singleCanvas.width) * cb.w) * mw);
          var my = Math.round((cb.y + (cy / singleCanvas.height) * cb.h) * mh);
          var mRad = Math.max(2, Math.round(rad * (mw * cb.w / singleCanvas.width)));
          var rSq = mRad * mRad;
          var targetVal = (ppBrushSubMode === 'restore-bg') ? 1 : 0;
          var x0 = Math.max(0, mx - mRad), x1 = Math.min(mw - 1, mx + mRad);
          var y0 = Math.max(0, my - mRad), y1 = Math.min(mh - 1, my + mRad);
          for (var py = y0; py <= y1; py++) {
            var rOff = py * mw;
            var dy2 = (py - my) * (py - my);
            for (var px = x0; px <= x1; px++) {
              var dSq = (px - mx) * (px - mx) + dy2;
              if (dSq <= rSq) {
                var distRatio = Math.sqrt(dSq) / mRad;
                var fall = distRatio <= hardness ? 1 : (1 - (distRatio - hardness) / Math.max(0.05, 1 - hardness));
                var str = Math.max(0, Math.min(1, fall * opacity));
                var cur = it.cutoutMask[rOff + px];
                it.cutoutMask[rOff + px] = cur + (targetVal - cur) * str;
              }
            }
          }
          if (window.TechHatBgRemover && window.TechHatBgRemover.renderCutoutFromMask) {
            it.cutoutCanvas = window.TechHatBgRemover.renderCutoutFromMask(it.srcCanvas, it.cutoutMask, { edgeFeather: 0.4, decontaminate: true });
          } else {
            var outC = document.createElement('canvas');
            outC.width = mw; outC.height = mh;
            var octx = outC.getContext('2d');
            octx.drawImage(it.srcCanvas, 0, 0);
            var idat = octx.getImageData(0, 0, mw, mh);
            for (var k = 0; k < mw * mh; k++) idat.data[k * 4 + 3] = Math.round(it.cutoutMask[k] * 255);
            octx.putImageData(idat, 0, 0);
            it.cutoutCanvas = outC;
          }
          renderPpLayersPanel();
          renderPassportPhotoAndSheet(false);
          return;
        }

        ppState.hasPaintLayer = true;
        if (!ppState.paintCanvas || ppState.paintCanvas.width !== singleCanvas.width || ppState.paintCanvas.height !== singleCanvas.height) {
          var pc = document.createElement('canvas');
          pc.width = singleCanvas.width;
          pc.height = singleCanvas.height;
          if (ppState.paintCanvas) pc.getContext('2d').drawImage(ppState.paintCanvas, 0, 0, pc.width, pc.height);
          ppState.paintCanvas = pc;
        }
        var pctx = ppState.paintCanvas.getContext('2d');
        var hex = ($('#ppBrushColor') && $('#ppBrushColor').value) || '#ffffff';
        var r = parseInt(hex.slice(1, 3), 16) || 255;
        var g = parseInt(hex.slice(3, 5), 16) || 255;
        var b = parseInt(hex.slice(5, 7), 16) || 255;
        var grad = pctx.createRadialGradient(cx, cy, rad * hardness * 0.85, cx, cy, rad);
        grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')');
        grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
        pctx.fillStyle = grad;
        pctx.beginPath();
        pctx.arc(cx, cy, rad, 0, Math.PI * 2);
        pctx.fill();
        renderPassportPhotoAndSheet(false);
      }

      // Free Transform Handles & Outer Rotation on `#ppTransformBox`
      if (tfBoxEl) {
        tfBoxEl.addEventListener('pointerdown', function (e) {
          if (!ppState || ppActiveTool !== 'move') return;
          if (ppPsController && ppPsController.isSpaceHeld()) return;
          var hBtn = e.target && e.target.closest ? e.target.closest('[data-pp-tf-handle]') : null;
          var isOuterRot = e.target && e.target.id === 'ppTfRotateOuter';
          if (!hBtn && !isOuterRot) return;
          var lyr = ppState.layers && ppState.layers[ppActiveLayerId];
          if (!lyr || lyr.locked) return;

          e.preventDefault();
          e.stopPropagation();
          pushPpHistory();
          var cRect = singleCanvas.getBoundingClientRect();
          var bRect = tfBoxEl.getBoundingClientRect();
          var cx = bRect.left + bRect.width * 0.5;
          var cy = bRect.top + bRect.height * 0.5;
          layerDrag = {
            kind: isOuterRot ? 'rot' : ('scale-' + hBtn.getAttribute('data-pp-tf-handle')),
            sx: e.clientX,
            sy: e.clientY,
            cw: Math.max(1, cRect.width),
            ch: Math.max(1, cRect.height),
            cx: cx,
            cy: cy,
            startRad: Math.atan2(e.clientY - cy, e.clientX - cx),
            orig: { tx: lyr.tx || 0, ty: lyr.ty || 0, sx: lyr.sx || 1, sy: lyr.sy || 1, rot: lyr.rot || 0 },
            lyr: lyr
          };
          if (editedWrap.setPointerCapture) {
            try { editedWrap.setPointerCapture(e.pointerId); } catch (_) {}
          }
        });
      }

      editedWrap.addEventListener('pointerdown', function (e) {
        if (!ppState || layerDrag) return;
        if (ppPsController && (ppPsController.isSpaceHeld() || ppActiveTool === 'hand' || ppActiveTool === 'zoom')) return;
        var rect = singleCanvas.getBoundingClientRect();

        // Alt+Click in Brush mode OR Picker mode => Sample Color (exact Photoshop behavior!)
        if (ppActiveTool === 'picker' || (e.altKey && (ppActiveTool === 'brush' || ppActiveTool === 'eraser'))) {
          var sx = Math.max(0, Math.min(singleCanvas.width - 1, Math.floor(((e.clientX - rect.left) / Math.max(1, rect.width)) * singleCanvas.width)));
          var sy = Math.max(0, Math.min(singleCanvas.height - 1, Math.floor(((e.clientY - rect.top) / Math.max(1, rect.height)) * singleCanvas.height)));
          var px = singleCanvas.getContext('2d').getImageData(sx, sy, 1, 1).data;
          lastPickedPpHex = rgbToHexStr(px[0], px[1], px[2]);
          if ($('#ppPickedSwatch')) $('#ppPickedSwatch').style.background = lastPickedPpHex;
          if ($('#ppPickedHex')) $('#ppPickedHex').textContent = lastPickedPpHex;
          syncPpBrushColorUi(lastPickedPpHex);
          showToast(lastPickedPpHex + tr(' রঙ নেওয়া হয়েছে!', ' color sampled!'));
          return;
        }

        if (ppActiveTool === 'brush' || ppActiveTool === 'eraser') {
          pushPpHistory();
          isBrushing = true;
          if (editedWrap.setPointerCapture) {
            try { editedWrap.setPointerCapture(e.pointerId); } catch (_) {}
          }
          applyBrushDab(e);
          return;
        }

        if (ppActiveTool === 'move') {
          ensureEntryPhotoshopState(ppState);
          var autoSel = !$('#ppMoveAutoSelect') || $('#ppMoveAutoSelect').checked;
          if (autoSel && (ppActiveLayerId === 'bg' || ppActiveLayerId === 'adjust')) {
            ppActiveLayerId = 'subject';
            renderPpLayersPanel();
          }
          var lyr = ppState.layers[ppActiveLayerId];
          if (!lyr || lyr.locked) {
            showToast(tr('এই লেয়ারটি লক করা আছে (আনলক করতে তালা আইকনে ক্লিক করুন)', 'Active layer is locked'));
            return;
          }
          pushPpHistory();
          layerDrag = {
            kind: 'move',
            sx: e.clientX,
            sy: e.clientY,
            cw: Math.max(1, rect.width),
            ch: Math.max(1, rect.height),
            orig: { tx: lyr.tx || 0, ty: lyr.ty || 0, sx: lyr.sx || 1, sy: lyr.sy || 1, rot: lyr.rot || 0 },
            lyr: lyr
          };
          if (editedWrap.setPointerCapture) {
            try { editedWrap.setPointerCapture(e.pointerId); } catch (_) {}
          }
        }
      });

      editedWrap.addEventListener('pointermove', function (e) {
        if (!ppState) return;
        var rect = singleCanvas.getBoundingClientRect();
        var curZoom = ppPsController ? ppPsController.getZoom() : 1;
        var relX = (e.clientX - rect.left) / Math.max(0.1, curZoom);
        var relY = (e.clientY - rect.top) / Math.max(0.1, curZoom);

        if (ppActiveTool === 'brush' || ppActiveTool === 'eraser') {
          var curEl = $('#ppBrushCursor');
          if (curEl) {
            refreshPpBrushPreview(false);
            curEl.hidden = false;
            curEl.style.left = relX + 'px';
            curEl.style.top = relY + 'px';
          }
          if (isBrushing) applyBrushDab(e);
          return;
        }

        if (ppActiveTool === 'picker') {
          var loupe = $('#ppPickerLoupe');
          if (loupe && e.clientX >= rect.left && e.clientY >= rect.top && e.clientX <= rect.right && e.clientY <= rect.bottom) {
            var sx = Math.max(0, Math.min(singleCanvas.width - 1, Math.floor(((e.clientX - rect.left) / Math.max(1, rect.width)) * singleCanvas.width)));
            var sy = Math.max(0, Math.min(singleCanvas.height - 1, Math.floor(((e.clientY - rect.top) / Math.max(1, rect.height)) * singleCanvas.height)));
            var px = singleCanvas.getContext('2d').getImageData(sx, sy, 1, 1).data;
            var hex = rgbToHexStr(px[0], px[1], px[2]);
            loupe.hidden = false;
            loupe.style.left = relX + 'px';
            loupe.style.top = relY + 'px';
            if ($('#ppPickerLoupeDot')) $('#ppPickerLoupeDot').style.background = hex;
            if ($('#ppPickerLoupeText')) $('#ppPickerLoupeText').textContent = hex;
          }
          return;
        }

        if (!layerDrag) return;
        var lyr = layerDrag.lyr;
        var o = layerDrag.orig;
        var dxN = (e.clientX - layerDrag.sx) / layerDrag.cw;
        var dyN = (e.clientY - layerDrag.sy) / layerDrag.ch;

        if (layerDrag.kind === 'move') {
          lyr.tx = o.tx + dxN;
          lyr.ty = o.ty + dyN;
        } else if (layerDrag.kind === 'rot') {
          var rCur = Math.atan2(e.clientY - layerDrag.cy, e.clientX - layerDrag.cx);
          var dDeg = ((rCur - layerDrag.startRad) * 180) / Math.PI;
          lyr.rot = Math.round((o.rot + dDeg) * 10) / 10;
        } else {
          var hId = layerDrag.kind.replace('scale-', '');
          var nsx = o.sx, nsy = o.sy;
          if (hId.indexOf('e') !== -1) nsx = Math.max(0.15, o.sx + dxN * 2);
          if (hId.indexOf('w') !== -1) nsx = Math.max(0.15, o.sx - dxN * 2);
          if (hId.indexOf('s') !== -1) nsy = Math.max(0.15, o.sy + dyN * 2);
          if (hId.indexOf('n') !== -1) nsy = Math.max(0.15, o.sy - dyN * 2);
          if (!e.shiftKey && (hId.length === 2)) {
            var uni = (nsx / Math.max(0.05, o.sx) + nsy / Math.max(0.05, o.sy)) * 0.5;
            nsx = Math.max(0.15, o.sx * uni);
            nsy = Math.max(0.15, o.sy * uni);
          }
          lyr.sx = nsx;
          lyr.sy = nsy;
        }
        renderPassportPhotoAndSheet(false);
        renderPpTransformBox();
      });

      editedWrap.addEventListener('pointerleave', function () {
        if ($('#ppBrushCursor')) $('#ppBrushCursor').hidden = true;
        if ($('#ppPickerLoupe')) $('#ppPickerLoupe').hidden = true;
      });
      var finishEditedPointer = function (e) {
        if (e && e.pointerId != null && editedWrap.hasPointerCapture) {
          try {
            if (editedWrap.hasPointerCapture(e.pointerId)) editedWrap.releasePointerCapture(e.pointerId);
          } catch (_) {}
        }
        layerDrag = null;
        isBrushing = false;
      };
      editedWrap.addEventListener('pointerup', finishEditedPointer);
      editedWrap.addEventListener('pointercancel', finishEditedPointer);
    }

    on('ppDownloadSingleBtn', 'click', async function () {
      if (!ppState || !$('#ppSingleCanvas')) return;
      var canvas = $('#ppSingleCanvas');
      var isJob = canvas.width === 300 && canvas.height === 300;
      var blob = await encodeCanvasWithLimit(canvas, 'image/jpeg', 0.94, isJob ? 95 : 0);
      var fname = baseName(ppState.item.name) + '-passport-' + canvas.width + 'x' + canvas.height + '.jpg';
      downloadBlob(blob, fname);
      if (window.TechHatStore && window.TechHatStore.save) {
        window.TechHatStore.save('passport_docs', {
          id: 'pp_photo_' + Date.now(),
          name: fname,
          type: 'passport',
          format: 'JPG',
          blob: blob,
          thumbUrl: canvas.toDataURL('image/jpeg', 0.8),
          createdAt: Date.now()
        });
      }
      showToast(tr('পাসপোর্ট সাইজ ছবি ডাউনলোড হয়েছে!', 'Passport size photo downloaded!'));
    });

    async function downloadPpPrintSheetJpg() {
      if (!ppState || !$('#ppSheetCanvas')) return;
      renderPassportPhotoAndSheet(true);
      var canvas = $('#ppSheetCanvas');
      var blob = await canvasToBlob(canvas, 'image/jpeg', 0.94);
      var paper = ($('#ppSheetPaper') && $('#ppSheetPaper').value) || 'a4';
      var fname = baseName(ppState.item.name) + '-passport-sheet-' + paper.toUpperCase() + '.jpg';
      downloadBlob(blob, fname);
      if (window.TechHatStore && window.TechHatStore.save) {
        window.TechHatStore.save('passport_docs', {
          id: 'pp_sheet_' + Date.now(),
          name: fname,
          type: 'passport',
          format: 'JPG',
          blob: blob,
          thumbUrl: $('#ppSingleCanvas') ? $('#ppSingleCanvas').toDataURL('image/jpeg', 0.8) : '',
          createdAt: Date.now()
        });
      }
      showToast(tr('প্রিন্ট শিট ডাউনলোড হয়েছে!', 'Print sheet downloaded!'));
    }
    on('ppDownloadSheetBtn', 'click', downloadPpPrintSheetJpg);

    on('ppDownloadPdfBtn', 'click', async function () {
      if (!ppState || !$('#ppSheetCanvas')) return;
      renderPassportPhotoAndSheet(true);
      var canvas = $('#ppSheetCanvas');
      var paper = ($('#ppSheetPaper') && $('#ppSheetPaper').value) || 'a4';
      var pdfBlob = await canvasToPdfBlob(canvas, paper);
      var fname = baseName(ppState.item.name) + '-passport-sheet-' + paper.toUpperCase() + '.pdf';
      downloadBlob(pdfBlob, fname);
      if (window.TechHatStore && window.TechHatStore.save) {
        window.TechHatStore.save('passport_docs', {
          id: 'pp_pdf_' + Date.now(),
          name: fname,
          type: 'passport',
          format: 'PDF',
          blob: pdfBlob,
          thumbUrl: $('#ppSingleCanvas') ? $('#ppSingleCanvas').toDataURL('image/jpeg', 0.8) : '',
          createdAt: Date.now()
        });
      }
      showToast(tr('পাসপোর্ট প্রিন্ট শিট PDF ডাউনলোড হয়েছে!', 'Passport print sheet PDF downloaded!'));
    });

    on('ppPrintSheetBtn', 'click', function () {
      if (!ppState || !$('#ppSheetCanvas')) return;
      renderPassportPhotoAndSheet(true);
      var dataUrl = $('#ppSheetCanvas').toDataURL('image/jpeg', 0.95);
      var w = window.open('', '_blank');
      if (!w) {
        showToast(tr('প্রিন্ট উইন্ডো পপ-আপ ব্লক হয়েছে', 'Print window blocked by browser'));
        return;
      }
      w.document.write('<!doctype html><html><head><title>Print Passport Photo Sheet</title><style>@page{margin:0;}body{margin:0;display:flex;align-items:center;justify-content:center;background:#fff;}img{max-width:100vw;max-height:100vh;object-fit:contain;}</style></head><body><img src="' + dataUrl + '" onload="setTimeout(function(){window.print();},180)"></body></html>');
      w.document.close();
    });

    // Check if a cutout was handed off from Standalone AI Background Remover (/image/remove-bg)
    try {
      var pendingHandoffRaw = sessionStorage.getItem('techhat_rbg_to_pp');
      if (pendingHandoffRaw && $('#img-pane-passport-photo')) {
        sessionStorage.removeItem('techhat_rbg_to_pp');
        var handoff = JSON.parse(pendingHandoffRaw);
        if (handoff && handoff.cutoutDataUrl) {
          var loadDataUrlImg = function (u) {
            return new Promise(function (resolve, reject) {
              var im = new Image();
              im.onload = function () { resolve(im); };
              im.onerror = reject;
              im.src = u;
            });
          };
          Promise.all([
            loadDataUrlImg(handoff.srcDataUrl || handoff.cutoutDataUrl),
            loadDataUrlImg(handoff.cutoutDataUrl)
          ]).then(function (imgs) {
            var origIm = imgs[0];
            var cutIm = imgs[1];
            var w = cutIm.naturalWidth || cutIm.width || 600;
            var h = cutIm.naturalHeight || cutIm.height || 750;
            var srcC = document.createElement('canvas');
            srcC.width = w;
            srcC.height = h;
            srcC.getContext('2d').drawImage(origIm, 0, 0, w, h);

            var cutC = document.createElement('canvas');
            cutC.width = w;
            cutC.height = h;
            cutC.getContext('2d').drawImage(cutIm, 0, 0, w, h);

            var newEntry = {
              item: {
                name: handoff.name || 'cutout-portrait.png',
                origSize: 0,
                width: w,
                height: h,
                img: origIm,
                url: handoff.cutoutDataUrl,
                srcCanvas: srcC,
                cutoutCanvas: cutC
              },
              panX: 0,
              panY: 0,
              rot: 0,
              flipH: 1,
              straighten: 0,
              skinSmooth: false,
              studioLight: false
            };
            var aligned = autoStraightenAndCenterFace(newEntry);
            newEntry.straighten = aligned.angle;
            ensureEntryPhotoshopState(newEntry);
            if (handoff.bgColor) {
              ppActiveBgHex = handoff.bgColor;
            }
            ppItems.push(newEntry);
            activePpIdx = ppItems.length - 1;
            syncPpStateRef();

            var ppPane = $('#img-pane-passport-photo');
            if (ppPane) ppPane.setAttribute('data-has-pages', 'true');
            if ($('#ppDropzone')) $('#ppDropzone').hidden = true;
            if ($('#ppStage')) $('#ppStage').hidden = false;
            if ($('#ppAutoAiBgStatusBadge')) $('#ppAutoAiBgStatusBadge').hidden = false;
            if ($('#ppResetCutoutBtn')) $('#ppResetCutoutBtn').hidden = false;
            setPpStep('edit');
            setPpTool('crop');
            renderPpFilmstrip();
            renderPpLayersPanel();
            renderPpCropStage();
            showToast(tr('কাটআউট ছবিটি পাসপোর্ট ফটো স্টুডিওতে লোড হয়েছে!', 'Cutout photo loaded into Passport Photo Studio!'));
          }).catch(function () {});
        }
      }
    } catch (_) {}
  }

  /* ==================================================================
   * 8. STANDALONE AI BACKGROUND REMOVER STUDIO (iLoveIMG + TechHat Studio)
   * ================================================================== */
  var rbgItems = [];
  var activeRbgIdx = 0;
  var rbgState = null;
  var rbgAiMode = 'auto';
  var rbgToolMode = 'pan'; // 'pan' | 'erase' | 'restore'
  var rbgViewMode = 'compare'; // 'compare' | 'result' | 'original'
  var rbgComparePct = 50;
  var rbgZoom = 100;

  function syncRbgStateRef() {
    rbgState = rbgItems[activeRbgIdx] || null;
  }

  async function ensureBgRemoverEngineLoaded() {
    if (window.TechHatBgRemover && window.TechHatBgRemover.removeBackground) return window.TechHatBgRemover;
    await new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = '/js/bg-remover-engine.js?v=81';
      s.onload = resolve;
      s.onerror = resolve;
      document.body.appendChild(s);
    });
    return window.TechHatBgRemover;
  }

  function updateRbgCompareSliderDom() {
    var clipWrap = $('#rbgBeforeClipWrap');
    var slider = $('#rbgCompareSlider');
    var afterLbl = $('#rbgAfterLabel');
    if (!clipWrap || !slider) return;
    if (rbgViewMode === 'compare') {
      clipWrap.hidden = false;
      slider.hidden = false;
      if (afterLbl) afterLbl.hidden = false;
      var rightInset = Math.max(0, Math.min(100, 100 - rbgComparePct));
      clipWrap.style.clipPath = 'inset(0 ' + rightInset.toFixed(2) + '% 0 0)';
      slider.style.left = rbgComparePct.toFixed(2) + '%';
    } else if (rbgViewMode === 'original') {
      clipWrap.hidden = false;
      clipWrap.style.clipPath = 'inset(0 0% 0 0)';
      slider.hidden = true;
      if (afterLbl) afterLbl.hidden = true;
    } else {
      clipWrap.hidden = true;
      slider.hidden = true;
      if (afterLbl) afterLbl.hidden = false;
    }
  }

  function rebuildRbgCutoutFromWorkingMask() {
    syncRbgStateRef();
    if (!rbgState || !rbgState.srcCanvas || !rbgState.workingMask || !window.TechHatBgRemover) return;
    var feather = parseFloat(($('#rbgEdgeFeather') && $('#rbgEdgeFeather').value) || '0.4');
    var shift = parseFloat(($('#rbgEdgeShift') && $('#rbgEdgeShift').value) || '0');
    var decon = $('#rbgDecontaminateToggle') ? $('#rbgDecontaminateToggle').checked : true;
    rbgState.cutoutCanvas = window.TechHatBgRemover.renderCutoutFromMask(
      rbgState.srcCanvas,
      rbgState.workingMask,
      {
        edgeFeather: feather,
        edgeShift: shift,
        decontaminate: decon
      }
    );
  }

  function renderRbgCanvases() {
    syncRbgStateRef();
    if (!rbgState || !rbgState.item) return;
    var resCanvas = $('#rbgResultCanvas');
    var befCanvas = $('#rbgBeforeCanvas');
    if (!resCanvas || !befCanvas) return;

    var srcImg = rbgState.srcCanvas || rbgState.item.img;
    var w = srcImg.width || rbgState.item.width || 600;
    var h = srcImg.height || rbgState.item.height || 750;

    if (befCanvas.width !== w || befCanvas.height !== h) {
      befCanvas.width = w;
      befCanvas.height = h;
    }
    var bctx = befCanvas.getContext('2d');
    bctx.clearRect(0, 0, w, h);
    bctx.drawImage(srcImg, 0, 0, w, h);

    if (resCanvas.width !== w || resCanvas.height !== h) {
      resCanvas.width = w;
      resCanvas.height = h;
    }
    var rctx = resCanvas.getContext('2d');
    rctx.clearRect(0, 0, w, h);

    // 1. Draw Background Layer (Transparent | Solid Color | Studio Gradient | Custom Image)
    var bgMode = rbgState.bgMode || 'transparent';
    if (bgMode === 'color') {
      rctx.fillStyle = rbgState.bgColor || '#ffffff';
      rctx.fillRect(0, 0, w, h);
    } else if (bgMode === 'gradient') {
      var g = rctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, rbgState.gradC1 || '#f8fafc');
      g.addColorStop(1, rbgState.gradC2 || '#cbd5e1');
      rctx.fillStyle = g;
      rctx.fillRect(0, 0, w, h);
    } else if (bgMode === 'image' && rbgState.customBgImg) {
      var bgI = rbgState.customBgImg;
      var bw = bgI.naturalWidth || bgI.width || w;
      var bh = bgI.naturalHeight || bgI.height || h;
      var sc = Math.max(w / Math.max(1, bw), h / Math.max(1, bh));
      var dw = bw * sc, dh = bh * sc;
      rctx.drawImage(bgI, (w - dw) * 0.5, (h - dh) * 0.5, dw, dh);
    }

    // 2. Draw Cutout Foreground (with optional 3D Studio Drop Shadow)
    var fg = rbgState.cutoutCanvas || srcImg;
    var hasShadow = $('#rbgShadowToggle') && $('#rbgShadowToggle').checked;
    rctx.save();
    if (hasShadow) {
      rctx.shadowColor = 'rgba(15, 23, 42, 0.38)';
      rctx.shadowBlur = Math.max(12, Math.round(Math.min(w, h) * 0.028));
      rctx.shadowOffsetX = 0;
      rctx.shadowOffsetY = Math.max(4, Math.round(h * 0.01));
    }
    rctx.drawImage(fg, 0, 0, w, h);
    rctx.restore();

    if ($('#rbgDimBadge')) {
      $('#rbgDimBadge').textContent = w + '×' + h + ' px • ' + (bgMode === 'transparent' ? 'Transparent PNG' : bgMode.toUpperCase());
    }
    if ($('#rbgUndoBtn')) $('#rbgUndoBtn').disabled = !(rbgState.undoStack && rbgState.undoStack.length);
    if ($('#rbgRedoBtn')) $('#rbgRedoBtn').disabled = !(rbgState.redoStack && rbgState.redoStack.length);

    try {
      rbgState._thumbUrl = resCanvas.toDataURL('image/png');
      var tEl = $('[data-rbg-thumb-idx="' + activeRbgIdx + '"]');
      if (tEl) tEl.src = rbgState._thumbUrl;
    } catch (_) {}

    updateRbgCompareSliderDom();
  }

  function renderRbgFilmstrip() {
    var listEl = $('#rbgPhotoList');
    var badge = $('#rbgPhotoCountBadge');
    if (badge) badge.textContent = toBn(rbgItems.length);
    if (!listEl) return;
    listEl.innerHTML = '';

    rbgItems.forEach(function (entry, idx) {
      var active = idx === activeRbgIdx;
      var card = document.createElement('div');
      card.className = 'nid-card-tab ds-page shrink-0 w-full group relative flex flex-col gap-1.5 p-2 rounded-xl border text-left transition-all cursor-pointer ' +
        (active
          ? ' active is-active border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/15 ring-2 ring-indigo-500/25 shadow-xs'
          : ' border-slate-200 dark:border-studio-border bg-slate-50/80 dark:bg-studio-panel/60 hover:border-indigo-400');

      var headRow = document.createElement('div');
      headRow.className = 'flex items-center justify-between gap-1 min-w-0';
      var titleEl = document.createElement('strong');
      titleEl.className = 'text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate';
      titleEl.textContent = toBn(idx + 1) + '. ' + (entry.item.name || 'Image');

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'w-5 h-5 rounded-md grid place-items-center text-slate-400 hover:text-rose-600 cursor-pointer';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (rbgItems.length <= 1) {
          var clr = $('#rbgClearAllBtn');
          if (clr) clr.click();
          return;
        }
        rbgItems.splice(idx, 1);
        activeRbgIdx = Math.max(0, Math.min(activeRbgIdx, rbgItems.length - 1));
        syncRbgStateRef();
        renderRbgFilmstrip();
        renderRbgCanvases();
      });

      headRow.appendChild(titleEl);
      headRow.appendChild(delBtn);

      var thumbWrap = document.createElement('div');
      thumbWrap.className = 'w-full aspect-[4/3] rounded-lg overflow-hidden bg-[conic-gradient(#e2e8f0_25%,#ffffff_0_50%,#e2e8f0_0_75%,#ffffff_0)] bg-[length:12px_12px] border border-slate-200 dark:border-studio-border grid place-items-center p-1';
      var thumbImg = document.createElement('img');
      thumbImg.setAttribute('data-rbg-thumb-idx', String(idx));
      thumbImg.className = 'w-full h-full object-contain';
      thumbImg.src = entry._thumbUrl || entry.item.url || '';
      thumbWrap.appendChild(thumbImg);

      card.appendChild(headRow);
      card.appendChild(thumbWrap);
      card.addEventListener('click', function () {
        if (activeRbgIdx === idx) return;
        activeRbgIdx = idx;
        syncRbgStateRef();
        renderRbgFilmstrip();
        renderRbgCanvases();
      });
      listEl.appendChild(card);
    });
  }

  async function runRbgSegmentationForEntry(entry, forceMode) {
    if (!entry || !entry.item || !entry.item.img) return;
    var overlay = $('#rbgLoadingOverlay');
    var loadTxt = $('#rbgLoadingText');
    var loadBar = $('#rbgLoadingBar');
    var engBadge = $('#rbgEngineBadge');

    if (overlay) overlay.hidden = false;
    if (loadBar) loadBar.style.width = '18%';
    if (loadTxt) loadTxt.textContent = tr('AI ব্যাকগ্রাউন্ড রিমুভ করছে...', 'AI is removing background...');

    try {
      var engine = await ensureBgRemoverEngineLoaded();
      if (!engine || !engine.removeBackground) {
        throw new Error(tr('AI ইঞ্জিন লোড করা যায়নি', 'AI engine failed to load'));
      }
      var feather = parseFloat(($('#rbgEdgeFeather') && $('#rbgEdgeFeather').value) || '0.4');
      var shift = parseFloat(($('#rbgEdgeShift') && $('#rbgEdgeShift').value) || '0');
      var decon = $('#rbgDecontaminateToggle') ? $('#rbgDecontaminateToggle').checked : true;

      var result = await engine.removeBackground(entry.item.img, {
        mode: forceMode || rbgAiMode || 'auto',
        edgeFeather: feather,
        edgeShift: shift,
        decontaminate: decon,
        onProgress: function (pct, msg) {
          if (loadBar) loadBar.style.width = Math.max(15, Math.min(100, pct)) + '%';
          if (loadTxt && msg) loadTxt.textContent = msg;
        }
      });

      var rawBase = result.baseMask || result.mask;
      entry.srcCanvas = result.srcCanvas;
      entry.baseMask = new Float32Array(rawBase);
      entry.workingMask = new Float32Array(rawBase);
      entry.cutoutCanvas = result.cutoutCanvas;
      entry.undoStack = [];
      entry.redoStack = [];

      if (engBadge) {
        engBadge.textContent = result.engineUsed === 'dual-rmbg-ensemble'
          ? '🎯 Dual-RMBG Ultra AI ✓'
          : (result.engineUsed === 'ormbg-hd' || result.engineUsed === 'rmbg-1.4'
              ? '✨ Studio HD AI (1024px) ✓'
              : (result.engineUsed === 'mediapipe-neural' ? '⚡ Neural Portrait AI ✓' : '✨ Smart AI Cutout ✓'));
      }
      renderRbgCanvases();
    } catch (err) {
      showToast((err && err.message) || tr('ব্যাকগ্রাউন্ড রিমুভ করতে সমস্যা হয়েছে', 'Background removal failed'));
    } finally {
      if (overlay) overlay.hidden = true;
    }
  }

  async function loadRbgFiles(files) {
    if (!files || !files.length) return;
    try {
      for (var i = 0; i < files.length; i++) {
        var item = await loadImageFile(files[i]);
        var entry = {
          item: item,
          srcCanvas: null,
          baseMask: null,
          workingMask: null,
          cutoutCanvas: null,
          bgMode: 'transparent',
          bgColor: '#ffffff',
          gradC1: '#f8fafc',
          gradC2: '#cbd5e1',
          customBgImg: null,
          undoStack: [],
          redoStack: []
        };
        rbgItems.push(entry);
        activeRbgIdx = rbgItems.length - 1;
      }
      syncRbgStateRef();
      var pane = $('#img-pane-remove-bg');
      if (pane) pane.setAttribute('data-has-pages', 'true');
      if ($('#rbgDropzone')) $('#rbgDropzone').hidden = true;
      if ($('#rbgStage')) $('#rbgStage').hidden = false;

      renderRbgFilmstrip();
      renderRbgCanvases();

      // Automatically run 1-click AI background removal on the newly uploaded active image
      await runRbgSegmentationForEntry(rbgState, rbgAiMode);
      renderRbgFilmstrip();
    } catch (e) {
      showToast(e.message || tr('ছবি লোড করা যায়নি', 'Failed to load image'));
    }
  }

  function initRemoveBgStudio() {
    var dropzone = $('#rbgDropzone');
    var input = $('#rbgFileInput');
    if (!dropzone || !input) return;

    wireDropzone(dropzone, input, function (files) { loadRbgFiles(files); });

    ['rbgBatchInput', 'rbgAddMoreInput'].forEach(function (id) {
      var el = $('#' + id);
      if (el) {
        el.addEventListener('change', function () {
          if (el.files && el.files.length) {
            loadRbgFiles(Array.prototype.slice.call(el.files));
            el.value = '';
          }
        });
      }
    });

    // Camera capture for Remove BG
    function openRbgCamera() {
      var dlg = $('#nidCameraDialog');
      var vid = $('#nidCameraVideo');
      if (!dlg || !vid || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (input) input.click();
        return;
      }
      openDialog(dlg);
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
        .then(function (stream) {
          vid.srcObject = stream;
          vid.play().catch(function () {});
          var snapBtn = $('#nidCameraSnapBtn');
          var closeBtn = $('#nidCameraClose');
          function stopStream() {
            stream.getTracks().forEach(function (t) { t.stop(); });
            vid.srcObject = null;
          }
          if (closeBtn) closeBtn.onclick = function () { stopStream(); dlg.close(); };
          if (snapBtn) {
            snapBtn.onclick = function () {
              var c = document.createElement('canvas');
              c.width = vid.videoWidth || 640;
              c.height = vid.videoHeight || 480;
              c.getContext('2d').drawImage(vid, 0, 0, c.width, c.height);
              stopStream();
              dlg.close();
              c.toBlob(function (blob) {
                if (!blob) return;
                var file = new File([blob], 'camera-photo-' + Date.now() + '.jpg', { type: 'image/jpeg' });
                loadRbgFiles([file]);
              }, 'image/jpeg', 0.94);
            };
          }
        })
        .catch(function () {
          dlg.close();
          if (input) input.click();
        });
    }
    ['rbgCameraOpenBtn', 'rbgSidebarCamBtn'].forEach(function (id) {
      on(id, 'click', openRbgCamera);
    });

    // Sidebar toggle & Clear All
    on('rbgSidebarToggleBtn', 'click', function () {
      var pane = $('#img-pane-remove-bg');
      if (!pane) return;
      var c = pane.getAttribute('data-sidebar-collapsed') === 'true';
      pane.setAttribute('data-sidebar-collapsed', c ? 'false' : 'true');
    });

    on('rbgClearAllBtn', 'click', function () {
      rbgItems.forEach(function (entry) {
        if (entry.item && entry.item.url) URL.revokeObjectURL(entry.item.url);
      });
      rbgItems = [];
      activeRbgIdx = 0;
      rbgState = null;
      var pane = $('#img-pane-remove-bg');
      if (pane) pane.setAttribute('data-has-pages', 'false');
      if ($('#rbgStage')) $('#rbgStage').hidden = true;
      if ($('#rbgDropzone')) $('#rbgDropzone').hidden = false;
    });

    // View mode switcher: compare | result | original
    $$('[data-rbg-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        rbgViewMode = btn.getAttribute('data-rbg-view') || 'compare';
        $$('[data-rbg-view]').forEach(function (b) {
          b.setAttribute('aria-pressed', b.getAttribute('data-rbg-view') === rbgViewMode ? 'true' : 'false');
        });
        updateRbgCompareSliderDom();
      });
    });

    // Draggable Before/After Split Comparison Slider
    var stageContainer = $('#rbgStageContainer');
    var compareSlider = $('#rbgCompareSlider');
    if (stageContainer && compareSlider) {
      var draggingCompare = false;
      function updateCompareFromClientX(clientX) {
        var rect = stageContainer.getBoundingClientRect();
        if (!rect.width) return;
        var pct = ((clientX - rect.left) / rect.width) * 100;
        rbgComparePct = Math.max(2, Math.min(98, pct));
        updateRbgCompareSliderDom();
      }
      compareSlider.addEventListener('pointerdown', function (e) {
        e.stopPropagation();
        draggingCompare = true;
        if (compareSlider.setPointerCapture) compareSlider.setPointerCapture(e.pointerId);
      });
      compareSlider.addEventListener('pointermove', function (e) {
        if (!draggingCompare) return;
        updateCompareFromClientX(e.clientX);
      });
      compareSlider.addEventListener('pointerup', function () { draggingCompare = false; });
      compareSlider.addEventListener('pointercancel', function () { draggingCompare = false; });
    }

    // Touch-up Brush Tools: pan | erase | restore
    $$('#rbgBrushModeGroup [data-rbg-tool]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        rbgToolMode = btn.getAttribute('data-rbg-tool') || 'pan';
        $$('#rbgBrushModeGroup [data-rbg-tool]').forEach(function (b) {
          b.setAttribute('aria-pressed', b.getAttribute('data-rbg-tool') === rbgToolMode ? 'true' : 'false');
        });
        var sizeWrap = $('#rbgBrushSizeWrap');
        if (sizeWrap) sizeWrap.hidden = rbgToolMode === 'pan';
        if (rbgToolMode !== 'pan' && rbgViewMode === 'compare') {
          rbgViewMode = 'result';
          $$('[data-rbg-view]').forEach(function (b) {
            b.setAttribute('aria-pressed', b.getAttribute('data-rbg-view') === 'result' ? 'true' : 'false');
          });
          updateRbgCompareSliderDom();
        }
      });
    });

    on('rbgBrushSize', 'input', function () {
      var v = ($('#rbgBrushSize') && $('#rbgBrushSize').value) || '32';
      if ($('#rbgBrushSizeVal')) $('#rbgBrushSizeVal').textContent = v + 'px';
    });

    // Painting Erase / Restore strokes onto rbgState.workingMask
    var resCanvas = $('#rbgResultCanvas');
    if (resCanvas) {
      var painting = false;
      function paintBrushAtEvent(e) {
        if (!rbgState || !rbgState.workingMask || !rbgState.srcCanvas) return;
        var rect = resCanvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var w = rbgState.srcCanvas.width;
        var h = rbgState.srcCanvas.height;
        var cx = ((e.clientX - rect.left) / rect.width) * w;
        var cy = ((e.clientY - rect.top) / rect.height) * h;
        var brushPx = parseFloat(($('#rbgBrushSize') && $('#rbgBrushSize').value) || '32');
        var scaleFactor = w / Math.max(1, rect.width);
        var radius = Math.max(3, (brushPx * 0.5) * scaleFactor);
        var rSq = radius * radius;
        var targetVal = rbgToolMode === 'erase' ? 0 : 1;

        var x0 = Math.max(0, Math.floor(cx - radius));
        var x1 = Math.min(w - 1, Math.ceil(cx + radius));
        var y0 = Math.max(0, Math.floor(cy - radius));
        var y1 = Math.min(h - 1, Math.ceil(cy + radius));
        var mask = rbgState.workingMask;

        for (var y = y0; y <= y1; y++) {
          var dy = y - cy;
          var rowOff = y * w;
          for (var x = x0; x <= x1; x++) {
            var dx = x - cx;
            var d2 = dx * dx + dy * dy;
            if (d2 <= rSq) {
              var falloff = 1 - Math.sqrt(d2) / radius;
              var strength = Math.min(1, falloff * 1.6);
              var cur = mask[rowOff + x];
              mask[rowOff + x] = cur + (targetVal - cur) * strength;
            }
          }
        }
        rebuildRbgCutoutFromWorkingMask();
        renderRbgCanvases();
      }

      resCanvas.addEventListener('pointerdown', function (e) {
        if (!rbgState || !rbgState.workingMask) return;
        if (rbgToolMode === 'pan') {
          if (rbgViewMode === 'compare' && stageContainer) {
            var rect = stageContainer.getBoundingClientRect();
            rbgComparePct = Math.max(2, Math.min(98, ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100));
            updateRbgCompareSliderDom();
          }
          return;
        }
        painting = true;
        rbgState.undoStack.push(new Float32Array(rbgState.workingMask));
        if (rbgState.undoStack.length > 20) rbgState.undoStack.shift();
        rbgState.redoStack = [];
        if (resCanvas.setPointerCapture) resCanvas.setPointerCapture(e.pointerId);
        paintBrushAtEvent(e);
      });
      resCanvas.addEventListener('pointermove', function (e) {
        if (!painting) return;
        paintBrushAtEvent(e);
      });
      resCanvas.addEventListener('pointerup', function () { painting = false; });
      resCanvas.addEventListener('pointercancel', function () { painting = false; });
    }

    on('rbgUndoBtn', 'click', function () {
      if (!rbgState || !rbgState.undoStack || !rbgState.undoStack.length) return;
      rbgState.redoStack.push(new Float32Array(rbgState.workingMask));
      rbgState.workingMask = rbgState.undoStack.pop();
      rebuildRbgCutoutFromWorkingMask();
      renderRbgCanvases();
    });
    on('rbgRedoBtn', 'click', function () {
      if (!rbgState || !rbgState.redoStack || !rbgState.redoStack.length) return;
      rbgState.undoStack.push(new Float32Array(rbgState.workingMask));
      rbgState.workingMask = rbgState.redoStack.pop();
      rebuildRbgCutoutFromWorkingMask();
      renderRbgCanvases();
    });

    // AI Segmentation Mode Tabs (auto | object) & Re-run button
    $$('#rbgAiModeTabs [data-rbg-ai-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        rbgAiMode = btn.getAttribute('data-rbg-ai-mode') || 'auto';
        $$('#rbgAiModeTabs [data-rbg-ai-mode]').forEach(function (b) {
          b.setAttribute('aria-pressed', b.getAttribute('data-rbg-ai-mode') === rbgAiMode ? 'true' : 'false');
        });
        if (rbgState) runRbgSegmentationForEntry(rbgState, rbgAiMode);
      });
    });
    on('rbgRerunAiBtn', 'click', function () {
      if (rbgState) runRbgSegmentationForEntry(rbgState, rbgAiMode);
    });

    // Background Fill Mode Tabs & Swatches
    function setRbgBgModeUi(mode, labelText) {
      if (!rbgState) return;
      rbgState.bgMode = mode;
      $$('#rbgBgModeTabs [data-rbg-bg-mode]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-rbg-bg-mode') === mode ? 'true' : 'false');
      });
      if ($('#rbgGradientSwatches')) $('#rbgGradientSwatches').hidden = mode !== 'gradient';
      if ($('#rbgCustomBgImgWrap')) $('#rbgCustomBgImgWrap').hidden = mode !== 'image';
      if ($('#rbgBgStatusLabel') && labelText) $('#rbgBgStatusLabel').textContent = labelText;
      renderRbgCanvases();
    }

    $$('#rbgBgModeTabs [data-rbg-bg-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var m = btn.getAttribute('data-rbg-bg-mode') || 'transparent';
        setRbgBgModeUi(m, m === 'transparent' ? 'Transparent PNG' : m.toUpperCase());
      });
    });

    $$('#rbgColorSwatches [data-rbg-swatch]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!rbgState) return;
        var val = btn.getAttribute('data-rbg-swatch') || 'transparent';
        $$('#rbgColorSwatches [data-rbg-swatch]').forEach(function (b) {
          var act = b === btn;
          b.classList.toggle('border-2', act);
          b.classList.toggle('border-indigo-600', act);
        });
        if (val === 'transparent') {
          setRbgBgModeUi('transparent', 'Transparent PNG');
        } else {
          rbgState.bgColor = val;
          if ($('#rbgCustomColorInput')) $('#rbgCustomColorInput').value = val;
          setRbgBgModeUi('color', val.toUpperCase());
        }
      });
    });

    on('rbgCustomColorInput', 'input', function () {
      if (!rbgState) return;
      var val = ($('#rbgCustomColorInput') && $('#rbgCustomColorInput').value) || '#ffffff';
      rbgState.bgColor = val;
      setRbgBgModeUi('color', val.toUpperCase());
    });

    $$('#rbgGradientSwatches [data-rbg-grad]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!rbgState) return;
        rbgState.gradC1 = btn.getAttribute('data-c1') || '#f8fafc';
        rbgState.gradC2 = btn.getAttribute('data-c2') || '#cbd5e1';
        setRbgBgModeUi('gradient', btn.textContent || 'Gradient');
      });
    });

    on('rbgCustomBgImgInput', 'change', function (e) {
      var f = e.target && e.target.files && e.target.files[0];
      if (!f || !rbgState) return;
      loadImageFile(f).then(function (loaded) {
        rbgState.customBgImg = loaded.img;
        setRbgBgModeUi('image', 'Custom Photo');
      }).catch(function () {});
    });

    // Edge Matting Sliders & Toggles
    ['rbgEdgeFeather', 'rbgEdgeShift', 'rbgDecontaminateToggle', 'rbgShadowToggle'].forEach(function (id) {
      on(id, 'input', function () {
        if ($('#rbgEdgeFeatherVal') && $('#rbgEdgeFeather')) {
          $('#rbgEdgeFeatherVal').textContent = parseFloat($('#rbgEdgeFeather').value).toFixed(1) + ' px';
        }
        if ($('#rbgEdgeShiftVal') && $('#rbgEdgeShift')) {
          var sv = parseFloat($('#rbgEdgeShift').value);
          $('#rbgEdgeShiftVal').textContent = (sv > 0 ? '+' : '') + sv;
        }
        rebuildRbgCutoutFromWorkingMask();
        renderRbgCanvases();
      });
      on(id, 'change', function () {
        rebuildRbgCutoutFromWorkingMask();
        renderRbgCanvases();
      });
    });

    on('rbgResetEdgeBtn', 'click', function () {
      if ($('#rbgEdgeFeather')) $('#rbgEdgeFeather').value = '0.4';
      if ($('#rbgEdgeFeatherVal')) $('#rbgEdgeFeatherVal').textContent = '0.4 px';
      if ($('#rbgEdgeShift')) $('#rbgEdgeShift').value = '0';
      if ($('#rbgEdgeShiftVal')) $('#rbgEdgeShiftVal').textContent = '0';
      if ($('#rbgDecontaminateToggle')) $('#rbgDecontaminateToggle').checked = true;
      if ($('#rbgShadowToggle')) $('#rbgShadowToggle').checked = false;
      if (rbgState && rbgState.baseMask) {
        rbgState.workingMask = new Float32Array(rbgState.baseMask);
      }
      rebuildRbgCutoutFromWorkingMask();
      renderRbgCanvases();
    });

    // HUD Zoom Controls
    function applyRbgZoom() {
      if ($('#rbgZoomHudVal')) $('#rbgZoomHudVal').textContent = rbgZoom + '%';
      if (stageContainer) {
        stageContainer.style.transform = rbgZoom === 100 ? '' : ('scale(' + (rbgZoom / 100) + ')');
      }
    }
    on('rbgZoomInBtn', 'click', function () { rbgZoom = Math.min(250, rbgZoom + 15); applyRbgZoom(); });
    on('rbgZoomOutBtn', 'click', function () { rbgZoom = Math.max(50, rbgZoom - 15); applyRbgZoom(); });
    on('rbgZoomFitBtn', 'click', function () { rbgZoom = 100; applyRbgZoom(); });

    // Export PNG, JPG & Send to Passport Photo Studio
    on('rbgDownloadPngBtn', 'click', async function () {
      if (!rbgState || !$('#rbgResultCanvas')) return;
      var canvas = $('#rbgResultCanvas');
      var blob = await canvasToBlob(canvas, 'image/png', 1);
      var fname = baseName(rbgState.item.name) + '-no-bg.png';
      downloadBlob(blob, fname);
      showToast(tr('স্বচ্ছ HD PNG ডাউনলোড হয়েছে!', 'HD Transparent PNG downloaded!'));
    });

    on('rbgDownloadJpgBtn', 'click', async function () {
      if (!rbgState || !$('#rbgResultCanvas')) return;
      var srcC = $('#rbgResultCanvas');
      var outC = document.createElement('canvas');
      outC.width = srcC.width;
      outC.height = srcC.height;
      var octx = outC.getContext('2d');
      if (rbgState.bgMode === 'transparent') {
        octx.fillStyle = '#ffffff';
        octx.fillRect(0, 0, outC.width, outC.height);
      }
      octx.drawImage(srcC, 0, 0);
      var blob = await canvasToBlob(outC, 'image/jpeg', 0.95);
      var fname = baseName(rbgState.item.name) + '-bg-edited.jpg';
      downloadBlob(blob, fname);
      showToast(tr('JPG ছবি ডাউনলোড হয়েছে!', 'JPG image downloaded!'));
    });

    on('rbgSendToPassportBtn', 'click', function () {
      if (!rbgState || !rbgState.item) return;
      var ppPane = $('#img-pane-passport-photo');
      if (!ppPane) {
        try {
          var cutCanvas = rbgState.cutoutCanvas || rbgState.srcCanvas;
          var srcCanvas = rbgState.srcCanvas || cutCanvas;
          if (cutCanvas) {
            sessionStorage.setItem('techhat_rbg_to_pp', JSON.stringify({
              cutoutDataUrl: cutCanvas.toDataURL('image/png'),
              srcDataUrl: srcCanvas ? srcCanvas.toDataURL('image/jpeg', 0.92) : '',
              bgColor: (rbgState.bgMode === 'color' && rbgState.bgColor) ? rbgState.bgColor : '',
              name: rbgState.item.name || 'cutout-portrait.png'
            }));
          }
        } catch (_) {}
        switchImgTab('passport-photo');
        return;
      }
      var newEntry = {
        item: {
          file: rbgState.item.file,
          name: rbgState.item.name,
          origSize: rbgState.item.origSize,
          width: rbgState.item.width,
          height: rbgState.item.height,
          img: rbgState.item.img,
          url: rbgState.item.url,
          srcCanvas: rbgState.srcCanvas,
          cutoutMask: rbgState.workingMask ? new Float32Array(rbgState.workingMask) : null,
          cutoutCanvas: rbgState.cutoutCanvas
        },
        panX: 0,
        panY: 0,
        rot: 0,
        flipH: 1,
        straighten: 0,
        skinSmooth: false,
        studioLight: false
      };
      var aligned = autoStraightenAndCenterFace(newEntry);
      newEntry.straighten = aligned.angle;
      ensureEntryPhotoshopState(newEntry);
      if (rbgState.bgMode === 'color' && rbgState.bgColor) {
        ppActiveBgHex = rbgState.bgColor;
      }
      ppItems.push(newEntry);
      activePpIdx = ppItems.length - 1;
      syncPpStateRef();

      switchImgTab('passport-photo');
      ppPane.setAttribute('data-has-pages', 'true');
      if ($('#ppDropzone')) $('#ppDropzone').hidden = true;
      if ($('#ppStage')) $('#ppStage').hidden = false;
      setPpStep('edit');
      setPpTool('crop');
      renderPpFilmstrip();
      renderPpLayersPanel();
      renderPpCropStage();
      showToast(tr('কাটআউট ছবিটি পাসপোর্ট ফটো স্টুডিওতে পাঠানো হয়েছে!', 'Cutout photo sent to Passport Photo Studio!'));
    });
  }

  /* ==================================================================
   * INITIALIZATION
   * ================================================================== */
  function on(id, ev, fn) { var el = $('#' + id); if (el) el.addEventListener(ev, fn); }

  function init() {
    var imgRootEl = $('#tool-image');
    if (!imgRootEl) return;
    if (imgRootEl.dataset.imgBound === '1') {
      var existingTab = imgRootEl.getAttribute('data-initial-tab');
      if (existingTab) switchImgTab(existingTab, true);
      return;
    }
    imgRootEl.dataset.imgBound = '1';

    $$('#tool-image .pdf-nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        switchImgTab(btn.getAttribute('data-img-tab'));
      });
    });

    $$('#tool-image [data-open-img]').forEach(function (card) {
      card.addEventListener('click', function (e) {
        e.preventDefault();
        switchImgTab(card.getAttribute('data-open-img'));
      });
    });

    on('imgPreviewClose', 'click', function () { $('#imgPreviewDialog').close(); });

    // 1. Resize & Presets (with Manual Pan & Zoom)
    wireDropzone($('#imgResizeDropzone'), $('#imgResizeInput'), loadResizeFile);
    installResizePanInteraction();
    $$('#imgResizePresets .img-preset-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        $$('#imgResizePresets .img-preset-pill').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        $('#imgResizeW').value = pill.getAttribute('data-w');
        $('#imgResizeH').value = pill.getAttribute('data-h');
        $('#imgResizeMaxKb').value = pill.getAttribute('data-kb');
        var fitR = $('input[name="imgResizeFit"][value="' + pill.getAttribute('data-fit') + '"]');
        if (fitR) fitR.checked = true;
        var fmtR = $('input[name="imgResizeFmt"][value="' + pill.getAttribute('data-fmt') + '"]');
        if (fmtR) fmtR.checked = true;
        if (resizeState) { resizeState.panX = 0; resizeState.panY = 0; }
        if ($('#imgResizeZoom')) $('#imgResizeZoom').value = 100;
        renderResizeOutput();
      });
    });
    on('imgResizeW', 'input', function () {
      if ($('#imgResizeLockRatio').checked && resizeState && resizeState.item) {
        var w = parseInt($('#imgResizeW').value, 10) || 1;
        $('#imgResizeH').value = Math.max(1, Math.round((w * resizeState.item.height) / resizeState.item.width));
      }
      renderResizeOutput();
    });
    on('imgResizeH', 'input', function () {
      if ($('#imgResizeLockRatio').checked && resizeState && resizeState.item) {
        var h = parseInt($('#imgResizeH').value, 10) || 1;
        $('#imgResizeW').value = Math.max(1, Math.round((h * resizeState.item.width) / resizeState.item.height));
      }
      renderResizeOutput();
    });
    on('imgResizeMaxKb', 'input', renderResizeOutput);
    on('imgResizeBg', 'input', renderResizeOutput);
    on('imgResizeZoom', 'input', renderResizeOutput);
    on('imgResizePosReset', 'click', function () {
      if (resizeState) { resizeState.panX = 0; resizeState.panY = 0; }
      if ($('#imgResizeZoom')) $('#imgResizeZoom').value = 100;
      renderResizeOutput();
    });
    on('imgResizeBgWhite', 'click', function () { $('#imgResizeBg').value = '#ffffff'; renderResizeOutput(); });
    on('imgResizeBgBlue', 'click', function () { $('#imgResizeBg').value = '#1e88e5'; renderResizeOutput(); });
    $$('input[name="imgResizeFit"], input[name="imgResizeFmt"]').forEach(function (r) {
      r.addEventListener('change', renderResizeOutput);
    });
    on('imgResizeResetBtn', 'click', function () {
      resizeState = null;
      $('#imgResizeStage').hidden = true;
      $('#imgResizeTopActions').hidden = true;
      $('#imgResizeDropzone').hidden = false;
    });
    on('imgResizeDownloadBtn', 'click', function () {
      if (!resizeState || !resizeState.outBlob) return;
      var ext = extFromMime(resizeState.fmt);
      var outName = baseName(resizeState.item.name) + '-' + resizeState.outW + 'x' + resizeState.outH + '.' + ext;
      downloadBlob(resizeState.outBlob, outName);
      showToast(tr('রিসাইজড ছবি ডাউনলোড হয়েছে!', 'Resized image downloaded!'));
    });

    // 2. Compress
    wireDropzone($('#imgCompressDropzone'), $('#imgCompressInput'), addCompressFiles);
    on('imgCompressAddMore', 'change', function (e) {
      if (e.target.files && e.target.files.length) {
        addCompressFiles(Array.prototype.slice.call(e.target.files));
        e.target.value = '';
      }
    });
    on('imgCompressQuality', 'input', runAllCompress);
    on('imgCompressTargetKb', 'input', runAllCompress);
    on('imgCompressMaxDim', 'change', runAllCompress);
    $$('input[name="imgCompressFmt"]').forEach(function (r) { r.addEventListener('change', runAllCompress); });
    on('imgCompressList', 'click', function (e) {
      var cmpBtn = e.target.closest('[data-cmp-idx]');
      if (cmpBtn) { openCompressCompare(+cmpBtn.getAttribute('data-cmp-idx')); return; }
      var dlBtn = e.target.closest('[data-dl-idx]');
      if (dlBtn) {
        var entry = compressItems[+dlBtn.getAttribute('data-dl-idx')];
        if (entry && entry.outBlob) {
          downloadBlob(entry.outBlob, baseName(entry.item.name) + '-compressed.' + extFromMime(entry.fmt));
        }
      }
    });
    on('imgCompressClearBtn', 'click', function () {
      compressItems = [];
      $('#imgCompressStage').hidden = true;
      $('#imgCompressTopActions').hidden = true;
      $('#imgCompressDropzone').hidden = false;
    });
    on('imgCompressDownloadAllBtn', 'click', async function () {
      if (!compressItems.length) return;
      if (compressItems.length === 1) {
        var e0 = compressItems[0];
        downloadBlob(e0.outBlob, baseName(e0.item.name) + '-compressed.' + extFromMime(e0.fmt));
        showToast(tr('কমপ্রেসড ছবি ডাউনলোড হয়েছে!', 'Compressed image downloaded!'));
        return;
      }
      if (!window.JSZip && window.TechHatEnsureScript) {
        await window.TechHatEnsureScript('/vendor/jszip.min.js');
      }
      if (window.JSZip) {
        var zip = new window.JSZip();
        compressItems.forEach(function (entry, i) {
          var fname = baseName(entry.item.name) + '-' + (i + 1) + '.' + extFromMime(entry.fmt);
          zip.file(fname, entry.outBlob);
        });
        var zblob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zblob, 'techhat-compressed-images.zip');
        showToast(tr('সবগুলো ছবি ZIP হিসেবে ডাউনলোড হয়েছে!', 'All images downloaded as ZIP!'));
      }
    });

    // 3. Crop, Custom Size & Round
    wireDropzone($('#imgCropDropzone'), $('#imgCropInput'), loadCropFile);
    installCropInteraction();
    $$('input[name="imgCropRatio"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var cw = r.getAttribute('data-cw');
        var ch = r.getAttribute('data-ch');
        if ($('#imgCropCustomW') && $('#imgCropCustomH')) {
          if (cw && ch) {
            $('#imgCropCustomW').value = cw;
            $('#imgCropCustomH').value = ch;
          } else if (r.value !== 'custom') {
            $('#imgCropCustomW').value = '';
            $('#imgCropCustomH').value = '';
          } else if (cropState && !$('#imgCropCustomW').value && !$('#imgCropCustomH').value) {
            $('#imgCropCustomW').value = cropState.outW || 300;
            $('#imgCropCustomH').value = cropState.outH || 300;
          }
        }
        applyCropRatioConstraint();
        updateCropPreview();
      });
    });
    var onCustomCropDimChange = function () {
      var customRadio = $('input[name="imgCropRatio"][value="custom"]');
      if (customRadio && ($('#imgCropCustomW').value || $('#imgCropCustomH').value)) {
        var curChecked = $('input[name="imgCropRatio"]:checked');
        if (!curChecked || (!curChecked.getAttribute('data-cw') && curChecked.value !== 'custom')) {
          customRadio.checked = true;
        }
      }
      applyCropRatioConstraint();
      updateCropPreview();
    };
    on('imgCropCustomW', 'input', onCustomCropDimChange);
    on('imgCropCustomH', 'input', onCustomCropDimChange);
    on('imgCropLockCustomRatio', 'change', function () {
      applyCropRatioConstraint();
      updateCropPreview();
    });
    on('imgCropClearCustomBtn', 'click', function () {
      if ($('#imgCropCustomW')) $('#imgCropCustomW').value = '';
      if ($('#imgCropCustomH')) $('#imgCropCustomH').value = '';
      var freeR = $('input[name="imgCropRatio"][value="free"]');
      if (freeR) freeR.checked = true;
      applyCropRatioConstraint();
      updateCropPreview();
    });
    $$('input[name="imgCropShape"]').forEach(function (r) {
      r.addEventListener('change', function () {
        positionCropBoxDOM();
        updateCropPreview();
      });
    });
    on('imgCropAutoBtn', 'click', function () {
      if (!cropState) return;
      autoDetectCropSubjectBox();
      updateCropPreview();
      showToast(tr('অটো-সিলেকশন ক্রপ সম্পন্ন হয়েছে!', 'Auto-selection crop completed!'));
    });
    on('imgCropSnapBtn', 'click', function () {
      if (!cropState) return;
      snapCropBoxToEdges();
      updateCropPreview();
      showToast(tr('নিকটস্থ বর্ডারে স্ন্যাপ করা হয়েছে!', 'Snapped to nearest borders!'));
    });
    on('imgCropTightBtn', 'click', function () {
      if (!cropState) return;
      adjustCropBoxMargin(-0.015);
      updateCropPreview();
    });
    on('imgCropExpandBtn', 'click', function () {
      if (!cropState) return;
      adjustCropBoxMargin(0.015);
      updateCropPreview();
    });
    on('imgCropFullBtn', 'click', function () {
      if (!cropState) return;
      cropState.box = { x: 0, y: 0, w: 1, h: 1 };
      positionCropBoxDOM();
      updateCropPreview();
    });
    on('imgCropRotL', 'click', function () { if (cropState) { cropState.rot -= 90; drawCropSourceCanvas(); updateCropPreview(); } });
    on('imgCropRotR', 'click', function () { if (cropState) { cropState.rot += 90; drawCropSourceCanvas(); updateCropPreview(); } });
    on('imgCropFlipH', 'click', function () { if (cropState) { cropState.flipH *= -1; drawCropSourceCanvas(); updateCropPreview(); } });
    on('imgCropFlipV', 'click', function () { if (cropState) { cropState.flipV *= -1; drawCropSourceCanvas(); updateCropPreview(); } });
    on('imgCropResetBtn', 'click', function () {
      cropState = null;
      $('#imgCropStage').hidden = true;
      $('#imgCropTopActions').hidden = true;
      $('#imgCropDropzone').hidden = false;
    });
    on('imgCropDownloadBtn', 'click', function () {
      if (!cropState || !cropState.outBlob) return;
      var ext = extFromMime(cropState.mime);
      downloadBlob(cropState.outBlob, baseName(cropState.item.name) + '-cropped-' + (cropState.outW || '') + 'x' + (cropState.outH || '') + '.' + ext);
      showToast(tr('ক্রপ করা ছবি ডাউনলোড হয়েছে!', 'Cropped image downloaded!'));
    });

    // 4. Convert, Effects & Watermark
    wireDropzone($('#imgConvertDropzone'), $('#imgConvertInput'), loadConvertFile);
    $$('input[name="imgConvertFmt"]').forEach(function (r) { r.addEventListener('change', renderConvertOutput); });
    ['imgEffBright', 'imgEffContrast', 'imgEffSat', 'imgEffBorder', 'imgEffBorderColor', 'imgWatermarkText', 'imgWatermarkPos', 'imgWatermarkColor', 'imgEffGray'].forEach(function (id) {
      on(id, 'input', renderConvertOutput);
      on(id, 'change', renderConvertOutput);
    });
    on('imgConvertResetFiltersBtn', 'click', function () {
      $('#imgEffBright').value = 100;
      $('#imgEffContrast').value = 100;
      $('#imgEffSat').value = 100;
      $('#imgEffBorder').value = 0;
      $('#imgWatermarkText').value = '';
      $('#imgEffGray').checked = false;
      renderConvertOutput();
    });
    on('imgBase64CopyBtn', 'click', function () {
      var val = $('#imgBase64Output').value;
      if (val && navigator.clipboard) {
        navigator.clipboard.writeText(val);
        showToast(tr('Base64 কোড কপি হয়েছে!', 'Base64 code copied!'));
      }
    });
    on('imgConvertResetBtn', 'click', function () {
      convertState = null;
      $('#imgConvertStage').hidden = true;
      $('#imgConvertTopActions').hidden = true;
      $('#imgConvertDropzone').hidden = false;
    });
    on('imgConvertDownloadBtn', 'click', function () {
      if (!convertState || !convertState.outBlob) return;
      var ext = extFromMime(convertState.mime);
      downloadBlob(convertState.outBlob, baseName(convertState.item.name) + '-converted.' + ext);
      showToast(tr('ছবি ডাউনলোড হয়েছে!', 'Image downloaded!'));
    });

    // 5. NID Card Scanner & Combine Images (Modularized in /js/nid-scanner.js)
    if (window.TechHatNidScanner && window.TechHatNidScanner.init) {
      window.TechHatNidScanner.init();
    }

    // 6. Color Picker & Palette
    wireDropzone($('#imgColorsDropzone'), $('#imgColorsInput'), loadColorsFile);
    var clrCanvas = $('#imgColorsCanvas');
    if (clrCanvas) {
      var pickFromEvent = function (e) {
        var rect = clrCanvas.getBoundingClientRect();
        var x = Math.max(0, Math.min(clrCanvas.width - 1, Math.floor(((e.clientX - rect.left) / rect.width) * clrCanvas.width)));
        var y = Math.max(0, Math.min(clrCanvas.height - 1, Math.floor(((e.clientY - rect.top) / rect.height) * clrCanvas.height)));
        var px = clrCanvas.getContext('2d').getImageData(x, y, 1, 1).data;
        setPickedColor(px[0], px[1], px[2]);
      };
      clrCanvas.addEventListener('click', function (e) {
        pickFromEvent(e);
        var hex = $('#imgPickedHex').textContent;
        if (navigator.clipboard) navigator.clipboard.writeText(hex);
        showToast(hex + tr(' কপি হয়েছে!', ' copied!'));
      });
    }
    on('imgCopyHexBtn', 'click', function () {
      var hex = $('#imgPickedHex').textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(hex);
      showToast(hex + tr(' কপি হয়েছে!', ' copied!'));
    });
    on('imgCopyRgbBtn', 'click', function () {
      var rgb = $('#imgPickedRgb').textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(rgb);
      showToast(rgb + tr(' কপি হয়েছে!', ' copied!'));
    });
    on('imgColorsResetBtn', 'click', function () {
      $('#imgColorsStage').hidden = true;
      $('#imgColorsTopActions').hidden = true;
      $('#imgColorsDropzone').hidden = false;
    });

    // 7. Passport Size Photo & Print Sheet Maker
    initPassportPhotoMaker();

    // 8. Standalone AI Background Remover Studio
    initRemoveBgStudio();

    var root = $('#tool-image');
    var initTab = root && root.getAttribute('data-initial-tab');
    if (initTab) switchImgTab(initTab, true);

    if (!initialized) {
      initialized = true;
      window.addEventListener('th:langchange', function () {
        if (!document.getElementById('tool-image')) return;
        if (currentTab && IMG_SUB_TITLES[currentTab]) {
          var tMeta = IMG_SUB_TITLES[currentTab];
          var bcTool = $('#globalBreadcrumbTool');
          if (bcTool) {
            bcTool.textContent = isEn() ? tMeta.en : tMeta.bn;
          }
        }
        if (currentTab === 'compress') {
          if (compressItems.length) {
            renderCompressUI();
          }
        }
        if (currentTab === 'combine' && window.TechHatNidScanner && window.TechHatNidScanner.onLangChange) {
          window.TechHatNidScanner.onLangChange();
        }
        if (currentTab === 'resize' && resizeState && resizeState.outBlob) {
          var ext = extFromMime(resizeState.fmt);
          $('#imgResizeSummary').textContent = toBn(resizeState.outW) + '×' + toBn(resizeState.outH) + ' px • ' +
            fmtSize(resizeState.outBlob.size) + ' (' + ext.toUpperCase() + ')';
        }
        if (currentTab === 'crop' && cropState) {
          $('#imgCropSummary').textContent = toBn(cropState.outW) + ' × ' + toBn(cropState.outH) + ' px (' +
            extFromMime(cropState.mime).toUpperCase() + ')';
        }
      });
    }
  }

  function buildRotatedCanvas(img, rotDeg, maxDim, flipH) {
    if (window.TechHatNidScanner && window.TechHatNidScanner.rotate) {
      return window.TechHatNidScanner.rotate(img, rotDeg, maxDim, flipH);
    }
    var rot = (((rotDeg || 0) % 360) + 360) % 360;
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

  function warpPerspectiveCard(sourceCanvas, normPts, customMinW, customMaxW, preserveLongEdge, foldAxis) {
    if (window.TechHatNidScanner && window.TechHatNidScanner.warp) {
      return window.TechHatNidScanner.warp(sourceCanvas, normPts, customMinW, customMaxW, preserveLongEdge, foldAxis);
    }
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
    var minTargetW = customMinW || 1320;
    var maxTargetW = customMaxW || 2600;
    var upScale = natW < minTargetW ? (minTargetW / natW) : (natW > maxTargetW ? (maxTargetW / natW) : 1);
    var outW = Math.max(120, Math.min(maxTargetW, Math.round(natW * upScale)));
    var outH = Math.max(80, Math.min(maxTargetW, Math.round(natH * upScale)));
    if (preserveLongEdge) {
      var docScale = Math.min(1, maxTargetW / Math.max(natW, natH));
      outW = Math.max(16, Math.round(natW * docScale));
      outH = Math.max(16, Math.round(natH * docScale));
    }
    var x0 = p[0].x, y0 = p[0].y, x1 = p[1].x, y1 = p[1].y, x2 = p[2].x, y2 = p[2].y, x3 = p[3].x, y3 = p[3].y;
    var dx1 = x1 - x2, dx2 = x3 - x2, sx = x0 - x1 + x2 - x3;
    var dy1 = y1 - y2, dy2 = y3 - y2, sy = y0 - y1 + y2 - y3;
    var denom = dx1 * dy2 - dx2 * dy1;
    var g = 0, h = 0;
    if (Math.abs(denom) > 1e-6) {
      g = (sx * dy2 - dx2 * sy) / denom;
      h = (dx1 * sy - sx * dy1) / denom;
    }
    var a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, c = x0;
    var d = y1 - y0 + g * y1, e = y3 - y0 + h * y3, f = y0;
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
    var invW = 1 / Math.max(1, outW - 1), invH = 1 / Math.max(1, outH - 1);
    var maxSx = sw - 1.001, maxSy = sh - 1.001;
    var dstIdx = 0;
    for (var oy = 0; oy < outH; oy++) {
      var v = oy * invH, bvX = b * v + c, evY = e * v + f, hvW = h * v + 1;
      for (var ox = 0; ox < outW; ox++) {
        var u = ox * invW, w = g * u + hvW;
        var srcX = (a * u + bvX) / w, srcY = (d * u + evY) / w;
        if (srcX < 0 || srcX > maxSx || srcY < 0 || srcY > maxSy) {
          dst[dstIdx] = dst[dstIdx + 1] = dst[dstIdx + 2] = dst[dstIdx + 3] = 255;
          dstIdx += 4;
          continue;
        }
        var ix = srcX | 0, iy = srcY | 0, fx = srcX - ix, fy = srcY - iy;
        var w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
        var i00 = (iy * sw + ix) * 4, i10 = i00 + 4, i01 = i00 + sw * 4, i11 = i01 + 4;
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

  window.TechHatImageUtils = {
    isEn: isEn,
    tr: tr,
    toBn: toBn,
    fmtSize: fmtSize,
    baseName: baseName,
    extFromMime: extFromMime,
    showToast: showToast,
    downloadBlob: downloadBlob,
    loadImageFile: loadImageFile,
    canvasToBlob: canvasToBlob,
    setupDialog: setupDialog,
    openDialog: openDialog,
    wireDropzone: wireDropzone
  };
  window.TechHatImage = { init: init, switchTab: switchImgTab };
  window.TechHatScanGeometry = {
    load: loadImageFile,
    rotate: buildRotatedCanvas,
    warp: warpPerspectiveCard
  };

  var imgRoot = $('#tool-image');
  if (imgRoot && !imgRoot.hidden) {
    init();
  }
})();
