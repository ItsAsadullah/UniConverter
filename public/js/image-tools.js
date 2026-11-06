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
    colors: '/image/colors'
  };
  var IMG_SUB_TITLES = {
    scan: { bn: 'ডকুমেন্ট স্ক্যানার', en: 'Document Scanner' },
    passport: { bn: 'পাসপোর্ট মেকার ও স্ক্যানার', en: 'Passport Maker & Scanner' },
    resize: { bn: 'ইমেজ রিসাইজার', en: 'Image Resizer' },
    compress: { bn: 'কমপ্রেস ইমেজ', en: 'Compress Image' },
    crop: { bn: 'ক্রপ ও রাউন্ড ফটো', en: 'Crop & Circle Photo' },
    convert: { bn: 'ফরম্যাট ও ওয়াটারমার্ক', en: 'Convert & Watermark' },
    combine: { bn: 'NID কার্ড স্ক্যানার', en: 'NID Card Scanner' },
    colors: { bn: 'কালার পিকার', en: 'Color Picker' }
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
          .then(function () { return loadScriptOnce('/js/document-scanner.js?v=70'); })
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
        loadScriptOnce('/js/nid-scanner.js?v=70').then(function () {
          if (window.TechHatNidScanner && window.TechHatNidScanner.init) window.TechHatNidScanner.init();
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
    input.addEventListener('change', function () {
      if (input.files && input.files.length) {
        onFiles(Array.prototype.slice.call(input.files));
        input.value = '';
      }
    });
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
    var det = autoDetectCardQuad(cropState.item.img, cropState.rot || 0, cropState.flipH || 1, null, seedPt);
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
    if (!cropState.snapField || cropState._snapFieldKey !== 'crop' || !cropState.snapField.lum) {
      cropState.snapField = buildMagneticSnapField(canvas);
      cropState._snapFieldKey = 'crop';
    }
    var b = cropState.box;
    var pts = [
      { x: b.x, y: b.y },
      { x: b.x + b.w, y: b.y },
      { x: b.x + b.w, y: b.y + b.h },
      { x: b.x, y: b.y + b.h }
    ];
    var topS = snapEdgeMagnetically(cropState, pts[0], pts[1], 18);
    var rightS = snapEdgeMagnetically(cropState, pts[1], pts[2], 18);
    var botS = snapEdgeMagnetically(cropState, pts[2], pts[3], 18);
    var leftS = snapEdgeMagnetically(cropState, pts[3], pts[0], 18);

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

    var root = $('#tool-image');
    var initTab = root && root.getAttribute('data-initial-tab');
    if (initTab) switchImgTab(initTab, true);

    if (!initialized) {
      initialized = true;
      window.addEventListener('th:langchange', function () {
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
