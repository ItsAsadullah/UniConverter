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

  var bDig = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  function toBn(n) { return String(n).replace(/\d/g, function (d) { return bDig[d]; }); }

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

  function showToast(msg) {
    if (window.TechHatToast) { window.TechHatToast(msg); return; }
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
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
        reject(new Error('অনুগ্রহ করে একটি বৈধ ছবি (JPG, PNG, WebP) নির্বাচন করুন'));
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
        reject(new Error('ছবিটি লোড করা যায়নি'));
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
    colors: '/image/colors'
  };

  function switchImgTab(tabId, skipUrl) {
    currentTab = tabId || 'hub';
    $$('#tool-image .pdf-nav-btn').forEach(function (btn) {
      var active = btn.getAttribute('data-img-tab') === currentTab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    $$('#tool-image .img-pane').forEach(function (pane) {
      pane.hidden = pane.id !== 'img-pane-' + currentTab;
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
      showToast(e.message || 'ছবি লোড করা যায়নি');
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
      showToast('অনুগ্রহ করে ছবি ফাইল (JPG, PNG, WebP) নির্বাচন করুন');
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
      '<div class="pdf-stat-item"><span>আগের মোট সাইজ</span><strong>' + fmtSize(totalOrig) + '</strong></div>' +
      '<div class="pdf-stat-arrow">→</div>' +
      '<div class="pdf-stat-item pdf-stat-item--new"><span>কমপ্রেসড সাইজ</span><strong>' + fmtSize(totalOut) + '</strong></div>' +
      '<div class="pdf-stat-badge">-' + toBn(savedPct) + '% সাশ্রয় (' + fmtSize(savedBytes) + ' কমেছে)</div>';

    $('#imgCompressSummary').textContent = toBn(compressItems.length) + 'টি ছবি • ' + fmtSize(totalOut);
    renderCompressList();
  }

  function renderCompressList() {
    var list = $('#imgCompressList');
    if (!list) return;
    list.innerHTML = '';
    compressItems.forEach(function (entry, idx) {
      var it = entry.item;
      var diffPct = it.origSize > 0 ? Math.round(((it.origSize - entry.outBlob.size) / it.origSize) * 100) : 0;
      var badgeTxt = diffPct > 0 ? '-' + toBn(diffPct) + '%' : '০%';
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
            '<button type="button" class="chip-btn" data-cmp-idx="' + idx + '">🔍 আগে/পরে দেখুন</button>' +
            '<button type="button" class="chip-btn chip-btn--accent" data-dl-idx="' + idx + '">⬇ ডাউনলোড</button>' +
          '</div>' +
        '</div>';
      list.appendChild(card);
    });
  }

  function openCompressCompare(idx) {
    var entry = compressItems[idx];
    if (!entry) return;
    $('#imgPreviewTitle').textContent = 'আগে ও পরে তুলনা — ' + entry.item.name;
    $('#imgPreviewSub').textContent = 'অরিজিনাল (' + fmtSize(entry.item.origSize) + ') বনাম কমপ্রেসড (' + fmtSize(entry.outBlob.size) + ')';
    $('#imgPreviewStage').innerHTML =
      '<div class="pdf-compare-grid">' +
        '<figure class="pdf-preview-fig"><figcaption>অরিজিনাল (' + fmtSize(entry.item.origSize) + ')</figcaption><img src="' + entry.item.url + '" alt="Original"></figure>' +
        '<figure class="pdf-preview-fig"><figcaption>কমপ্রেসড (' + fmtSize(entry.outBlob.size) + ')</figcaption><img src="' + entry.outUrl + '" alt="Compressed"></figure>' +
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
      applyCropRatioConstraint();
      await updateCropPreview();
      $('#imgCropDropzone').hidden = true;
      $('#imgCropStage').hidden = false;
      $('#imgCropTopActions').hidden = false;
    } catch (e) {
      showToast(e.message || 'ছবি লোড করা যায়নি');
    }
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
      showToast(e.message || 'ছবি লোড করা যায়নি');
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
   * 5. ID CARD SCANNER, AUTO EDGE DETECTION, 4-CORNER PERSPECTIVE CROP & TOP-BOTTOM MAKER
   * ================================================================== */
  var combineItems = []; // [{ item, rot:0, flipH:1, fineAngle:0, pts:[{x,y},{x,y},{x,y},{x,y}], autoDetected:bool, cw, ch }]
  var activeNidIdx = 0;
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
   * Full-image scanner & 4-corner quadrilateral detector (`autoDetectCardQuad`).
   * Evaluates candidate components across multiple morphological scales and scores each
   * candidate by ISO ID-1 aspect-ratio proximity (~1.586:1), rectangular density (`rectFill`),
   * and 4-side perimeter gradient strength so it locks onto the rectangular ID card even on
   * cluttered sheets with handwriting or small passport photos.
   */
  function autoDetectCardQuad(img, rotDeg, flipH) {
    try {
      var c = buildRotatedCanvas(img, rotDeg || 0, 260, flipH || 1);
      var aw = c.width;
      var ah = c.height;
      var ctx = c.getContext('2d', { willReadFrequently: true });
      var data = ctx.getImageData(0, 0, aw, ah).data;

      // 1. Directional & total gradients (ignoring outer 3.5% scanner border shadow)
      var gradX = new Float32Array(aw * ah);
      var gradY = new Float32Array(aw * ah);
      var gradMap = new Float32Array(aw * ah);
      var margin = Math.max(5, Math.round(Math.min(aw, ah) * 0.035));

      for (var y = 2; y < ah - 2; y++) {
        for (var x = 2; x < aw - 2; x++) {
          var i = (y * aw + x) * 4;
          var ir = i + 4, il = i - 4, id = i + aw * 4, iu = i - aw * 4;
          var gx = Math.abs(data[ir] - data[il]) + Math.abs(data[ir + 1] - data[il + 1]) + Math.abs(data[ir + 2] - data[il + 2]);
          var gy = Math.abs(data[id] - data[iu]) + Math.abs(data[id + 1] - data[iu + 1]) + Math.abs(data[id + 2] - data[iu + 2]);
          gradX[y * aw + x] = gx;
          gradY[y * aw + x] = gy;
          gradMap[y * aw + x] = (gx + gy) * 0.25;
        }
      }

      // 2. Estimate smooth background color in 4 quadrants using ONLY low-gradient pixels inside margin
      var qBg = [
        { r: 0, g: 0, b: 0, n: 0 },
        { r: 0, g: 0, b: 0, n: 0 },
        { r: 0, g: 0, b: 0, n: 0 },
        { r: 0, g: 0, b: 0, n: 0 }
      ];
      for (var by = margin; by < ah - margin; by++) {
        for (var bx = margin; bx < aw - margin; bx++) {
          if (gradMap[by * aw + bx] < 12) {
            var bi = (by * aw + bx) * 4;
            var qi = (by < ah / 2 ? 0 : 2) + (bx < aw / 2 ? 0 : 1);
            if (qi === 2) qi = 3;
            else if (qi === 3) qi = 2;
            qBg[qi].r += data[bi];
            qBg[qi].g += data[bi + 1];
            qBg[qi].b += data[bi + 2];
            qBg[qi].n++;
          }
        }
      }
      var globalR = 0, globalG = 0, globalB = 0, globalN = 0;
      for (var k = 0; k < 4; k++) {
        globalR += qBg[k].r;
        globalG += qBg[k].g;
        globalB += qBg[k].b;
        globalN += qBg[k].n;
      }
      globalR /= Math.max(1, globalN);
      globalG /= Math.max(1, globalN);
      globalB /= Math.max(1, globalN);
      for (var k2 = 0; k2 < 4; k2++) {
        if (qBg[k2].n > 20) {
          qBg[k2].r /= qBg[k2].n;
          qBg[k2].g /= qBg[k2].n;
          qBg[k2].b /= qBg[k2].n;
        } else {
          qBg[k2].r = globalR;
          qBg[k2].g = globalG;
          qBg[k2].b = globalB;
        }
      }

      // 3. Combined feature energy inside margin
      var energy = new Float32Array(aw * ah);
      var sumE = 0, sumE2 = 0, countE = 0;
      for (var ey = margin; ey < ah - margin; ey++) {
        var v = ey / (ah - 1);
        for (var ex = margin; ex < aw - margin; ex++) {
          var u = ex / (aw - 1);
          var w0 = (1 - u) * (1 - v);
          var w1 = u * (1 - v);
          var w2 = u * v;
          var w3 = (1 - u) * v;
          var expR = qBg[0].r * w0 + qBg[1].r * w1 + qBg[2].r * w2 + qBg[3].r * w3;
          var expG = qBg[0].g * w0 + qBg[1].g * w1 + qBg[2].g * w2 + qBg[3].g * w3;
          var expB = qBg[0].b * w0 + qBg[1].b * w1 + qBg[2].b * w2 + qBg[3].b * w3;

          var ii = (ey * aw + ex) * 4;
          var dr = data[ii] - expR, dg = data[ii + 1] - expG, db = data[ii + 2] - expB;
          var colorDist = Math.sqrt(dr * dr + dg * dg + db * db);
          var grad = gradMap[ey * aw + ex];

          var eVal = Math.min(255, colorDist * 0.85 + grad * 1.65);
          energy[ey * aw + ex] = eVal;
          sumE += eVal;
          sumE2 += eVal * eVal;
          countE++;
        }
      }

      var meanE = sumE / Math.max(1, countE);
      var stdE = Math.sqrt(Math.max(0, sumE2 / Math.max(1, countE) - meanE * meanE));

      // Helper to evaluate a candidate component and compute its minimum-area rotated bounding box + ID-1 card score
      var evaluateComponent = function (ptsX, ptsY, area, energySum) {
        var compMask = new Uint8Array(aw * ah);
        for (var ci = 0; ci < area; ci++) {
          compMask[ptsY[ci] * aw + ptsX[ci]] = 1;
        }
        // Horizontal span fill inside component
        var filledArea = 0;
        for (var fy = 2; fy < ah - 2; fy++) {
          var rowOff = fy * aw;
          var firstX = -1, lastX = -1;
          for (var fx = 2; fx < aw - 2; fx++) {
            if (compMask[rowOff + fx]) {
              if (firstX === -1) firstX = fx;
              lastX = fx;
            }
          }
          if (firstX !== -1 && lastX >= firstX) {
            for (var fillX = firstX; fillX <= lastX; fillX++) {
              compMask[rowOff + fillX] = 1;
              filledArea++;
            }
          }
        }

        var edgeX = [];
        var edgeY = [];
        for (var by2 = 2; by2 < ah - 2; by2++) {
          for (var bx2 = 2; bx2 < aw - 2; bx2++) {
            var pIdx = by2 * aw + bx2;
            if (!compMask[pIdx]) continue;
            if (!compMask[pIdx - 1] || !compMask[pIdx + 1] || !compMask[pIdx - aw] || !compMask[pIdx + aw]) {
              edgeX.push(bx2);
              edgeY.push(by2);
            }
          }
        }
        if (edgeX.length < 12) return null;

        var minArea = Infinity;
        var bestAngle = 0;
        var bestMinU = 0, bestMaxU = 0, bestMinV = 0, bestMaxV = 0;
        for (var deg = -44; deg <= 44; deg += 2) {
          var rad = (deg * Math.PI) / 180;
          var cosA = Math.cos(rad);
          var sinA = Math.sin(rad);
          var minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
          for (var ei = 0; ei < edgeX.length; ei++) {
            var ex2 = edgeX[ei], ey2 = edgeY[ei];
            var uProj = ex2 * cosA + ey2 * sinA;
            var vProj = -ex2 * sinA + ey2 * cosA;
            if (uProj < minU) minU = uProj;
            if (uProj > maxU) maxU = uProj;
            if (vProj < minV) minV = vProj;
            if (vProj > maxV) maxV = vProj;
          }
          var rArea = (maxU - minU) * (maxV - minV);
          if (rArea < minArea) {
            minArea = rArea;
            bestAngle = rad;
            bestMinU = minU;
            bestMaxU = maxU;
            bestMinV = minV;
            bestMaxV = maxV;
          }
        }

        var spanU = Math.max(1, bestMaxU - bestMinU);
        var spanV = Math.max(1, bestMaxV - bestMinV);
        var boxArea = spanU * spanV;
        var frameArea = aw * ah;
        if (boxArea < frameArea * 0.025 || boxArea > frameArea * 0.96) return null;

        var aspect = Math.max(spanU, spanV) / Math.max(1, Math.min(spanU, spanV));
        if (aspect > 3.1) return null;

        // ISO ID-1 card aspect ratio is 85.60 / 53.98 = 1.5858
        var aspectDiff = Math.abs(aspect - 1.586);
        var aspectWeight = 0.35 + 1.15 * Math.exp(-(aspectDiff * aspectDiff) / 0.22);
        var rectFill = Math.min(1, filledArea / Math.max(1, boxArea));

        return {
          score: energySum * Math.pow(rectFill, 1.35) * aspectWeight,
          bestAngle: bestAngle,
          bestMinU: bestMinU,
          bestMaxU: bestMaxU,
          bestMinV: bestMinV,
          bestMaxV: bestMaxV
        };
      };

      // 4. Multi-scale morphological pass (tight pass separates card from nearby handwriting; standard pass fuses card interior)
      var passes = [
        { threshMul: 0.92, rX: Math.max(4, Math.round(aw * 0.024)), rY: Math.max(4, Math.round(ah * 0.020)) },
        { threshMul: 0.72, rX: Math.max(6, Math.round(aw * 0.038)), rY: Math.max(5, Math.round(ah * 0.028)) }
      ];

      var bestCand = null;
      var qx = new Int32Array(aw * ah);
      var qy = new Int32Array(aw * ah);

      for (var pIdx = 0; pIdx < passes.length; pIdx++) {
        var pass = passes[pIdx];
        var activeThresh = Math.max(18, Math.min(88, meanE + stdE * pass.threshMul));
        var rawMask = new Uint8Array(aw * ah);
        for (var mIdx = 0; mIdx < energy.length; mIdx++) {
          if (energy[mIdx] >= activeThresh) rawMask[mIdx] = 1;
        }

        var rX = pass.rX, rY = pass.rY;
        var dilated = new Uint8Array(aw * ah);
        for (var dy = margin; dy < ah - margin; dy++) {
          var y0 = Math.max(margin, dy - rY);
          var y1 = Math.min(ah - margin - 1, dy + rY);
          for (var dx = margin; dx < aw - margin; dx++) {
            var x0 = Math.max(margin, dx - rX);
            var x1 = Math.min(aw - margin - 1, dx + rX);
            var hit = 0;
            for (var wy = y0; wy <= y1 && !hit; wy++) {
              var rOff = wy * aw;
              for (var wx = x0; wx <= x1; wx++) {
                if (rawMask[rOff + wx]) { hit = 1; break; }
              }
            }
            dilated[dy * aw + dx] = hit;
          }
        }

        var closed = new Uint8Array(aw * ah);
        var erX = Math.max(2, rX - 2);
        var erY = Math.max(2, rY - 2);
        for (var cy = margin; cy < ah - margin; cy++) {
          var cy0 = Math.max(margin, cy - erY);
          var cy1 = Math.min(ah - margin - 1, cy + erY);
          for (var cx = margin; cx < aw - margin; cx++) {
            if (!dilated[cy * aw + cx]) continue;
            var cx0 = Math.max(margin, cx - erX);
            var cx1 = Math.min(aw - margin - 1, cx + erX);
            var allHit = 1;
            for (var ewy = cy0; ewy <= cy1 && allHit; ewy++) {
              var erOff = ewy * aw;
              for (var ewx = cx0; ewx <= cx1; ewx++) {
                if (!dilated[erOff + ewx]) { allHit = 0; break; }
              }
            }
            closed[cy * aw + cx] = allHit;
          }
        }

        var visited = new Uint8Array(aw * ah);
        for (var sy = margin; sy < ah - margin; sy++) {
          for (var sx = margin; sx < aw - margin; sx++) {
            var startIdx = sy * aw + sx;
            if (!closed[startIdx] || visited[startIdx]) continue;

            var head = 0, tail = 0;
            qx[tail] = sx;
            qy[tail] = sy;
            tail++;
            visited[startIdx] = 1;

            var minX = sx, maxX = sx, minY = sy, maxY = sy;
            var energySum = 0;

            while (head < tail) {
              var px = qx[head];
              var py = qy[head];
              head++;
              energySum += energy[py * aw + px];
              if (px < minX) minX = px;
              if (px > maxX) maxX = px;
              if (py < minY) minY = py;
              if (py > maxY) maxY = py;

              var nbs = [px - 1, py, px + 1, py, px, py - 1, px, py + 1];
              for (var nb = 0; nb < 8; nb += 2) {
                var nx = nbs[nb], ny = nbs[nb + 1];
                if (nx >= margin && nx < aw - margin && ny >= margin && ny < ah - margin) {
                  var ni = ny * aw + nx;
                  if (closed[ni] && !visited[ni]) {
                    visited[ni] = 1;
                    qx[tail] = nx;
                    qy[tail] = ny;
                    tail++;
                  }
                }
              }
            }

            var area = tail;
            var bw = maxX - minX + 1;
            var bh = maxY - minY + 1;
            if (area < aw * ah * 0.015 || bw < aw * 0.12 || bh < ah * 0.06) continue;

            var ptsX = new Int16Array(area);
            var ptsY = new Int16Array(area);
            for (var pi = 0; pi < area; pi++) {
              ptsX[pi] = qx[pi];
              ptsY[pi] = qy[pi];
            }
            var cand = evaluateComponent(ptsX, ptsY, area, energySum);
            if (cand && (!bestCand || cand.score > bestCand.score)) {
              bestCand = cand;
            }
          }
        }
      }

      if (bestCand) {
        var bestAngle = bestCand.bestAngle;
        var bestMinU = bestCand.bestMinU;
        var bestMaxU = bestCand.bestMaxU;
        var bestMinV = bestCand.bestMinV;
        var bestMaxV = bestCand.bestMaxV;
        var cosB = Math.cos(bestAngle);
        var sinB = Math.sin(bestAngle);
        var spanU = bestMaxU - bestMinU;
        var spanV = bestMaxV - bestMinV;

        // Outward 4-side edge-gradient snapping in rotated frame (captures subtle white plastic borders beyond text/MRZ)
        var sampleLineGrad = function (fixedCoord, startT, endT, isHorizontal) {
          var steps = 28;
          var sumG = 0, valid = 0;
          for (var s = 0; s <= steps; s++) {
            var t = startT + (endT - startT) * (s / steps);
            var uC = isHorizontal ? t : fixedCoord;
            var vC = isHorizontal ? fixedCoord : t;
            var ix = Math.round(uC * cosB - vC * sinB);
            var iy = Math.round(uC * sinB + vC * cosB);
            if (ix >= margin && ix < aw - margin && iy >= margin && iy < ah - margin) {
              var gVal = isHorizontal ? gradY[iy * aw + ix] : gradX[iy * aw + ix];
              sumG += gVal;
              valid++;
            }
          }
          return valid > 0 ? (sumG / valid) : 0;
        };

        var uIn0 = bestMinU + spanU * 0.1;
        var uIn1 = bestMaxU - spanU * 0.1;
        var vIn0 = bestMinV + spanV * 0.1;
        var vIn1 = bestMaxV - spanV * 0.1;

        var maxSearchV = Math.max(5, Math.round(spanV * 0.24));
        var maxSearchU = Math.max(5, Math.round(spanU * 0.16));

        var extMinV = bestMinV;
        for (var dv1 = 1; dv1 <= maxSearchV; dv1++) {
          if (sampleLineGrad(bestMinV - dv1, uIn0, uIn1, true) >= 8.5) {
            extMinV = bestMinV - dv1;
          }
        }
        var extMaxV = bestMaxV;
        for (var dv2 = 1; dv2 <= maxSearchV; dv2++) {
          if (sampleLineGrad(bestMaxV + dv2, uIn0, uIn1, true) >= 8.5) {
            extMaxV = bestMaxV + dv2;
          }
        }
        var extMinU = bestMinU;
        for (var du1 = 1; du1 <= maxSearchU; du1++) {
          if (sampleLineGrad(bestMinU - du1, vIn0, vIn1, false) >= 8.5) {
            extMinU = bestMinU - du1;
          }
        }
        var extMaxU = bestMaxU;
        for (var du2 = 1; du2 <= maxSearchU; du2++) {
          if (sampleLineGrad(bestMaxU + du2, vIn0, vIn1, false) >= 8.5) {
            extMaxU = bestMaxU + du2;
          }
        }

        var padU = (extMaxU - extMinU) * 0.012;
        var padV = (extMaxV - extMinV) * 0.014;
        extMinU -= padU;
        extMaxU += padU;
        extMinV -= padV;
        extMaxV += padV;

        var toImgPt = function (uVal, vVal) {
          var px = uVal * cosB - vVal * sinB;
          var py = uVal * sinB + vVal * cosB;
          return {
            x: Math.max(0.01, Math.min(0.99, px / aw)),
            y: Math.max(0.01, Math.min(0.99, py / ah))
          };
        };

        var quad = [
          toImgPt(extMinU, extMinV),
          toImgPt(extMaxU, extMinV),
          toImgPt(extMaxU, extMaxV),
          toImgPt(extMinU, extMaxV)
        ];

        return { pts: orderQuadClockwise(quad), auto: true };
      }
    } catch (e) {}
    return { pts: defaultQuadPts(0.04), auto: true };
  }

  /**
   * Snaps the current 4-corner selection to a clean ISO ID-1 rectangle (85.6 × 54 mm -> 1.5858:1)
   * preserving the center and average tilt angle of the user's current selection.
   */
  function snapQuadToCardRatio(entry) {
    if (!entry || !entry.pts) return;
    var cw = entry.cw || 360;
    var ch = entry.ch || 260;
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

    var isoRatio = 85.6 / 53.98; // 1.5858
    var targetW = avgW;
    var targetH = avgW / isoRatio;
    if (targetH > ch * 0.92) {
      targetH = ch * 0.88;
      targetW = targetH * isoRatio;
    }
    if (targetW > cw * 0.92) {
      targetW = cw * 0.88;
      targetH = targetW / isoRatio;
    }

    var cosA = Math.cos(angle);
    var sinA = Math.sin(angle);
    var hw = targetW * 0.5;
    var hh = targetH * 0.5;

    var corners = [
      { x: -hw, y: -hh },
      { x:  hw, y: -hh },
      { x:  hw, y:  hh },
      { x: -hw, y:  hh }
    ].map(function (loc) {
      var rx = cx + loc.x * cosA - loc.y * sinA;
      var ry = cy + loc.x * sinA + loc.y * cosA;
      return {
        x: Math.max(0.01, Math.min(0.99, rx / cw)),
        y: Math.max(0.01, Math.min(0.99, ry / ch))
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
  function warpPerspectiveCard(sourceCanvas, normPts) {
    var sw = sourceCanvas.width;
    var sh = sourceCanvas.height;
    var p = normPts.map(function (pt) {
      return { x: pt.x * sw, y: pt.y * sh };
    });

    var topW = Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y);
    var botW = Math.hypot(p[2].x - p[3].x, p[2].y - p[3].y);
    var leftH = Math.hypot(p[3].x - p[0].x, p[3].y - p[0].y);
    var rightH = Math.hypot(p[2].x - p[1].x, p[2].y - p[1].y);

    var natW = Math.max(60, Math.max(topW, botW));
    var natH = Math.max(40, Math.max(leftH, rightH));
    // Ensure high-DPI output resolution (>= 1320 px wide) so small card regions on full-page scans render crisply
    var minTargetW = 1320;
    var upScale = natW < minTargetW ? (minTargetW / natW) : 1;
    var outW = Math.max(120, Math.min(2600, Math.round(natW * upScale)));
    var outH = Math.max(80, Math.min(2600, Math.round(natH * upScale)));

    // Fast hardware-resampled path when the quad is already an axis-aligned rectangle (within 1.5px)
    var isAxisAligned =
      Math.abs(p[0].y - p[1].y) < 1.5 &&
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

    var srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
    var srcData = srcCtx.getImageData(0, 0, sw, sh).data;

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

        if (srcX < 0) srcX = 0;
        else if (srcX > maxSx) srcX = maxSx;
        if (srcY < 0) srcY = 0;
        else if (srcY > maxSy) srcY = maxSy;

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

  function createCombineEntry(loadedItem) {
    var det = autoDetectCardQuad(loadedItem.img, 0, 1);
    return {
      item: loadedItem,
      rot: 0,
      flipH: 1,
      fineAngle: 0,
      pts: det.pts,
      autoDetected: det.auto,
      cw: 0,
      ch: 0
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

  async function addCombineFiles(files) {
    for (var i = 0; i < files.length; i++) {
      try {
        var it = await loadImageFile(files[i]);
        combineItems.push(createCombineEntry(it));
      } catch (e) {}
    }
    if (!combineItems.length) {
      showToast('অনুগ্রহ করে ছবি নির্বাচন করুন');
      return;
    }
    activeNidIdx = Math.min(activeNidIdx, combineItems.length - 1);
    $('#imgCombineDropzone').hidden = true;
    $('#imgCombineStage').hidden = false;
    $('#imgCombineTopActions').hidden = false;
    renderNidCardTabs();
    syncNidDeskewControl();
    drawNidCropSourceCanvas();
    triggerNidScanAnimation();
    await renderCombineOutput();
  }

  async function setCombineSlotFile(slotIdx, file) {
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
      } else {
        combineItems.push(entry);
        activeNidIdx = combineItems.length - 1;
      }
      $('#imgCombineDropzone').hidden = true;
      $('#imgCombineStage').hidden = false;
      $('#imgCombineTopActions').hidden = false;
      renderNidCardTabs();
      syncNidDeskewControl();
      drawNidCropSourceCanvas();
      triggerNidScanAnimation();
      await renderCombineOutput();
      showToast('আইডি কার্ডের এজ অটো-ডিটেক্ট ও সোজা করা হয়েছে!');
    } catch (e) {
      showToast(e.message || 'ছবি লোড করা যায়নি');
    }
  }

  function cloneCurrentImageToOtherSide() {
    var srcEntry = combineItems[activeNidIdx] || combineItems[0];
    if (!srcEntry) return;
    var pts = cloneQuadPts(srcEntry.pts);
    // Offset initial quad slightly toward the opposite half of the page so user can easily position on 2nd card
    var cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) * 0.25;
    var shiftY = cy < 0.5 ? 0.36 : -0.36;
    var minY = Math.min(pts[0].y, pts[1].y, pts[2].y, pts[3].y);
    var maxY = Math.max(pts[0].y, pts[1].y, pts[2].y, pts[3].y);
    var clampedShiftY = Math.max(-minY + 0.02, Math.min(0.98 - maxY, shiftY));
    for (var i = 0; i < 4; i++) {
      pts[i].y = +(pts[i].y + clampedShiftY).toFixed(4);
    }

    var clonedEntry = {
      item: srcEntry.item,
      rot: srcEntry.rot || 0,
      flipH: srcEntry.flipH || 1,
      fineAngle: 0,
      pts: pts,
      autoDetected: false,
      cw: srcEntry.cw || 0,
      ch: srcEntry.ch || 0
    };

    if (combineItems.length === 1) {
      combineItems.push(clonedEntry);
      activeNidIdx = 1;
    } else {
      var targetIdx = activeNidIdx === 0 ? 1 : 0;
      combineItems[targetIdx] = clonedEntry;
      activeNidIdx = targetIdx;
    }
    renderNidCardTabs();
    syncNidDeskewControl();
    drawNidCropSourceCanvas();
    renderCombineOutput();
    showToast('একই ছবি থেকে অপর পাশের ক্রপ ফ্রেম তৈরি হয়েছে — চার কোণা দ্বিতীয় কার্ডে বসান');
  }

  function renderNidCardTabs() {
    var tabsEl = $('#nidCardTabs');
    if (!tabsEl) return;
    tabsEl.innerHTML = '';
    combineItems.forEach(function (entry, idx) {
      var label = idx === 0 ? '১. সামনের অংশ (Front)' : (idx === 1 ? '২. পেছনের অংশ (Back)' : 'কার্ড ' + toBn(idx + 1));
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nid-card-tab' + (idx === activeNidIdx ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', idx === activeNidIdx ? 'true' : 'false');
      btn.textContent = label + ' ✓';
      btn.addEventListener('click', function () {
        activeNidIdx = idx;
        renderNidCardTabs();
        syncNidDeskewControl();
        drawNidCropSourceCanvas();
        renderCombineOutput();
      });
      tabsEl.appendChild(btn);
    });
    if (combineItems.length < 2) {
      var addBackBtn = document.createElement('button');
      addBackBtn.type = 'button';
      addBackBtn.className = 'nid-card-tab nid-card-tab--add';
      addBackBtn.textContent = '+ ২. পেছনের অংশ (Back Side) যোগ করুন';
      addBackBtn.addEventListener('click', function () {
        var inp = $('#nidReplaceBackInput') || $('#nidBackInput');
        if (inp) inp.click();
      });
      tabsEl.appendChild(addBackBtn);
    }
  }

  function renderNidDualPreviewStrip() {
    var strip = $('#nidDualPreviewStrip');
    if (!strip) return;
    strip.innerHTML = '';
    combineItems.forEach(function (entry, idx) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nid-mini-thumb' + (idx === activeNidIdx ? ' active' : '');
      var imgUrl = entry.croppedCanvas ? entry.croppedCanvas.toDataURL('image/jpeg', 0.85) : entry.item.url;
      var sideTitle = idx === 0 ? '১. সামনের অংশ' : (idx === 1 ? '২. পেছনের অংশ' : 'কার্ড ' + toBn(idx + 1));
      var dimText = entry.croppedCanvas ? (entry.croppedCanvas.width + '×' + entry.croppedCanvas.height + ' px') : 'প্রস্তুত';
      btn.innerHTML =
        '<img src="' + imgUrl + '" alt="' + sideTitle + '" width="58" height="38">' +
        '<span class="nid-mini-thumb__info">' +
          '<span class="nid-mini-thumb__title">' + sideTitle + '</span>' +
          '<span class="nid-mini-thumb__sub">' + dimText + '</span>' +
        '</span>';
      btn.addEventListener('click', function () {
        activeNidIdx = idx;
        renderNidCardTabs();
        syncNidDeskewControl();
        drawNidCropSourceCanvas();
        renderCombineOutput();
      });
      strip.appendChild(btn);
    });

    if (combineItems.length === 1) {
      var cloneBtn = document.createElement('button');
      cloneBtn.type = 'button';
      cloneBtn.className = 'nid-mini-thumb';
      cloneBtn.style.borderStyle = 'dashed';
      cloneBtn.innerHTML =
        '<span class="nid-mini-thumb__info">' +
          '<span class="nid-mini-thumb__title" style="color:var(--brand);">+ পেছনের অংশ যোগ করুন</span>' +
          '<span class="nid-mini-thumb__sub">একই ছবি বা নতুন ফাইল থেকে</span>' +
        '</span>';
      cloneBtn.addEventListener('click', function () {
        cloneCurrentImageToOtherSide();
      });
      strip.appendChild(cloneBtn);
    }
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

    var maxStage = 440;
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
    positionNidQuadDOM();
  }

  function positionNidQuadDOM() {
    var entry = combineItems[activeNidIdx];
    var svg = $('#nidQuadSvg');
    if (!entry || !svg) return;
    var cw = entry.cw || 300;
    var ch = entry.ch || 220;
    var pts = entry.pts || defaultQuadPts(0.04);

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
    if (poly) poly.setAttribute('points', polyStr);

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

    // Position 4 corner handles
    for (var i = 0; i < 4; i++) {
      var hEl = $('#nidQuadHandles [data-pt="' + i + '"]');
      if (hEl) {
        hEl.style.left = (pts[i].x * 100) + '%';
        hEl.style.top = (pts[i].y * 100) + '%';
      }
    }
    // Position 4 edge midpoint handles
    for (var eIdx = 0; eIdx < 4; eIdx++) {
      var nextIdx = (eIdx + 1) % 4;
      var eEl = $('#nidQuadHandles [data-edge="' + eIdx + '"]');
      if (eEl) {
        var mx = (pts[eIdx].x + pts[nextIdx].x) * 50;
        var my = (pts[eIdx].y + pts[nextIdx].y) * 50;
        eEl.style.left = mx + '%';
        eEl.style.top = my + '%';
      }
    }
  }

  function updateNidLoupe(normX, normY) {
    var loupe = $('#nidCropLoupe');
    var srcCanvas = $('#nidCropSourceCanvas');
    if (!loupe || !srcCanvas) return;
    loupe.hidden = false;
    var cw = srcCanvas.width;
    var ch = srcCanvas.height;
    var lw = loupe.width;
    var lh = loupe.height;
    var lctx = loupe.getContext('2d');

    var px = normX * cw;
    var py = normY * ch;
    var zoom = 2.6;
    var sampleW = lw / zoom;
    var sampleH = lh / zoom;

    lctx.clearRect(0, 0, lw, lh);
    lctx.fillStyle = '#0f172a';
    lctx.fillRect(0, 0, lw, lh);
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

    // Draw precision crosshair
    lctx.strokeStyle = '#10b981';
    lctx.lineWidth = 1.5;
    lctx.beginPath();
    lctx.moveTo(lw / 2, 0);
    lctx.lineTo(lw / 2, lh);
    lctx.moveTo(0, lh / 2);
    lctx.lineTo(lw, lh / 2);
    lctx.stroke();

    loupe.style.left = (normX * 100) + '%';
    loupe.style.top = (normY * 100) + '%';
    loupe.style.transform = normY < 0.28 ? 'translate(-50%, 28%)' : 'translate(-50%, -125%)';
  }

  function hideNidLoupe() {
    var loupe = $('#nidCropLoupe');
    if (loupe) loupe.hidden = true;
    $$('#nidQuadHandles .nid-quad-handle.active').forEach(function (el) {
      el.classList.remove('active');
    });
  }

  function installNidCropInteraction() {
    var wrapEl = $('#nidCropInteractiveWrap');
    if (!wrapEl) return;

    var drag = null;
    wrapEl.addEventListener('pointerdown', function (e) {
      var entry = combineItems[activeNidIdx];
      if (e.button !== 0 || !entry) return;
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
      drag = {
        mode: mode,
        idx: idx,
        startX: e.clientX,
        startY: e.clientY,
        rw: rect.width || 1,
        rh: rect.height || 1,
        origPts: cloneQuadPts(entry.pts)
      };

      wrapEl.setPointerCapture(e.pointerId);
      wrapEl.classList.add('dragging');

      if (mode === 'corner') {
        updateNidLoupe(entry.pts[idx].x, entry.pts[idx].y);
      } else if (mode === 'edge') {
        var nIdx = (idx + 1) % 4;
        updateNidLoupe((entry.pts[idx].x + entry.pts[nIdx].x) * 0.5, (entry.pts[idx].y + entry.pts[nIdx].y) * 0.5);
      }
    });

    wrapEl.addEventListener('pointermove', function (e) {
      var entry = combineItems[activeNidIdx];
      if (!drag || !entry || !wrapEl.hasPointerCapture(e.pointerId)) return;
      var dx = (e.clientX - drag.startX) / drag.rw;
      var dy = (e.clientY - drag.startY) / drag.rh;
      var pts = cloneQuadPts(drag.origPts);

      if (drag.mode === 'corner') {
        var ci = drag.idx;
        pts[ci].x = Math.max(0, Math.min(1, pts[ci].x + dx));
        pts[ci].y = Math.max(0, Math.min(1, pts[ci].y + dy));
        updateNidLoupe(pts[ci].x, pts[ci].y);
      } else if (drag.mode === 'edge') {
        var i1 = drag.idx;
        var i2 = (i1 + 1) % 4;
        pts[i1].x = Math.max(0, Math.min(1, pts[i1].x + dx));
        pts[i1].y = Math.max(0, Math.min(1, pts[i1].y + dy));
        pts[i2].x = Math.max(0, Math.min(1, pts[i2].x + dx));
        pts[i2].y = Math.max(0, Math.min(1, pts[i2].y + dy));
        updateNidLoupe((pts[i1].x + pts[i2].x) * 0.5, (pts[i1].y + pts[i2].y) * 0.5);
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
      }

      entry.pts = pts;
      entry.autoDetected = false;
      positionNidQuadDOM();
    });

    wrapEl.addEventListener('lostpointercapture', function () {
      wrapEl.classList.remove('dragging');
      hideNidLoupe();
      if (!drag) return;
      drag = null;
      renderCombineOutput();
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
      renderCombineOutput();
    });
  }

  /**
   * Produces a perspective-rectified (homography warped) + deskewed + color-adjusted canvas for a single card at full native resolution.
   */
  function renderProcessedCardCanvas(entry, scanMode, br, ct, st, sharp) {
    // Use full original image resolution (up to 4800px) so cropped ID cards retain every pixel of detail
    var fullCanvas = buildRotatedCanvas(entry.item.img, entry.rot || 0, 4800, entry.flipH || 1);
    var pts = entry.pts || defaultQuadPts(0.04);

    // 1. Rectify tilted/skewed quadrilateral into a flat high-DPI rectangular canvas
    var warpedCanvas = warpPerspectiveCard(fullCanvas, pts);
    var sw = warpedCanvas.width;
    var sh = warpedCanvas.height;

    // 2. Apply fine straighten / deskew rotation if set (-15 deg .. +15 deg)
    var fineDeg = entry.fineAngle || 0;
    if (Math.abs(fineDeg) > 0.05) {
      var deskewCanvas = document.createElement('canvas');
      deskewCanvas.width = sw;
      deskewCanvas.height = sh;
      var dctx = deskewCanvas.getContext('2d', { willReadFrequently: true });
      dctx.imageSmoothingEnabled = true;
      dctx.imageSmoothingQuality = 'high';
      dctx.fillStyle = '#ffffff';
      dctx.fillRect(0, 0, sw, sh);
      dctx.save();
      dctx.translate(sw / 2, sh / 2);
      var rad = (fineDeg * Math.PI) / 180;
      // Zoom slightly so rotated corners stay filled
      var zoom = 1 + Math.abs(Math.sin(rad)) * 0.45;
      dctx.rotate(rad);
      dctx.scale(zoom, zoom);
      dctx.drawImage(warpedCanvas, -sw / 2, -sh / 2, sw, sh);
      dctx.restore();
      warpedCanvas = deskewCanvas;
    }

    var outCanvas = document.createElement('canvas');
    outCanvas.width = sw;
    outCanvas.height = sh;
    var octx = outCanvas.getContext('2d', { willReadFrequently: true });
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';

    var grayPct = (scanMode === 'grayscale' || scanMode === 'bw') ? 100 : 0;
    var effBr = scanMode === 'magic' ? Math.round(br * 1.08) : (scanMode === 'clean' ? Math.round(br * 1.05) : br);
    var effCt = scanMode === 'magic' ? Math.round(ct * 1.24) : (scanMode === 'clean' ? Math.round(ct * 1.18) : (scanMode === 'bw' ? Math.round(ct * 1.45) : ct));
    var effSt = scanMode === 'magic' ? Math.round(st * 1.15) : st;

    octx.save();
    octx.filter = 'brightness(' + effBr + '%) contrast(' + effCt + '%) saturate(' + effSt + '%) grayscale(' + grayPct + '%)';
    octx.drawImage(warpedCanvas, 0, 0, sw, sh);
    octx.restore();

    if (scanMode === 'magic' || scanMode === 'clean' || scanMode === 'bw' || sharp > 0) {
      var imgData = octx.getImageData(0, 0, sw, sh);
      var d = imgData.data;

      if (scanMode === 'magic') {
        for (var i = 0; i < d.length; i += 4) {
          for (var c = 0; c < 3; c++) {
            var v = d[i + c];
            if (v > 185) v = Math.min(255, Math.round(185 + (v - 185) * 1.38));
            else if (v < 85) v = Math.max(0, Math.round(v * 0.82));
            d[i + c] = v;
          }
        }
      } else if (scanMode === 'clean') {
        // Adaptive document background whitener: lifts light gray/yellowish card background to pure white while keeping text & photo crisp
        for (var k = 0; k < d.length; k += 4) {
          var r = d[k], g = d[k + 1], b = d[k + 2];
          var lumC = 0.299 * r + 0.587 * g + 0.114 * b;
          var chroma = Math.max(r, g, b) - Math.min(r, g, b);
          if (lumC > 162 && chroma < 38) {
            var tW = Math.min(1, (lumC - 162) / 58);
            d[k]     = Math.round(r + (255 - r) * tW);
            d[k + 1] = Math.round(g + (255 - g) * tW);
            d[k + 2] = Math.round(b + (255 - b) * tW);
          } else if (lumC < 95) {
            d[k]     = Math.max(0, Math.round(r * 0.84));
            d[k + 1] = Math.max(0, Math.round(g * 0.84));
            d[k + 2] = Math.max(0, Math.round(b * 0.84));
          }
        }
      } else if (scanMode === 'bw') {
        for (var j = 0; j < d.length; j += 4) {
          var lum = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2];
          var bwVal = lum > 162 ? 255 : (lum < 95 ? 0 : Math.round(((lum - 95) / 67) * 255));
          d[j] = d[j + 1] = d[j + 2] = bwVal;
        }
      }

      if (sharp > 0 && sw > 4 && sh > 4) {
        var copy = new Uint8ClampedArray(d);
        var amt = (sharp / 100) * 0.55;
        var stride = sw * 4;
        for (var y = 1; y < sh - 1; y++) {
          var rowOff = y * stride;
          for (var x = 1; x < sw - 1; x++) {
            var p = rowOff + x * 4;
            for (var ch = 0; ch < 3; ch++) {
              var center = copy[p + ch];
              var neighbors = (copy[p - 4 + ch] + copy[p + 4 + ch] + copy[p - stride + ch] + copy[p + stride + ch]) * 0.25;
              var val = center + (center - neighbors) * amt * 2.2;
              d[p + ch] = val < 0 ? 0 : (val > 255 ? 255 : val);
            }
          }
        }
      }
      octx.putImageData(imgData, 0, 0);
    }

    return outCanvas;
  }

  /**
   * Builds a genuine PDF 1.4 document embedding the high-DPI JPEG image stream (`/DCTDecode`)
   * with zero re-compression loss.
   */
  function buildJpegPdfBlob(jpegBytes, imgW, imgH, isA4) {
    var pageW = isA4 ? 595.28 : 540;
    var pageH = isA4 ? 841.89 : Math.max(120, +(540 * (imgH / Math.max(1, imgW))).toFixed(2));
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
   * card border, and outer scissor cut marks.
   */
  function drawCardWithOptions(ctx, img, x, y, w, h, roundCorner, showBorder, showCutMarks) {
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
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();

    if (showCutMarks) {
      ctx.save();
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.55)';
      ctx.lineWidth = 2;
      var tick = 22;
      var off = 10;
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

  async function renderCombineOutput() {
    if (!combineItems.length) return;
    var token = ++combineToken;
    var modeEl = $('input[name="imgCombineMode"]:checked');
    var mode = modeEl ? modeEl.value : 'nid-a4';
    var scanEl = $('input[name="imgCombineScanMode"]:checked');
    var scanMode = scanEl ? scanEl.value : 'original';

    var br = $('#imgCombineBright') ? (parseInt($('#imgCombineBright').value, 10) || 100) : 100;
    var ct = $('#imgCombineContrast') ? (parseInt($('#imgCombineContrast').value, 10) || 100) : 100;
    var st = $('#imgCombineSat') ? (parseInt($('#imgCombineSat').value, 10) || 100) : 100;
    var sharp = $('#imgCombineSharp') ? (parseInt($('#imgCombineSharp').value, 10) || 0) : 20;

    if ($('#imgCombineBrightVal')) $('#imgCombineBrightVal').textContent = toBn(br) + '%';
    if ($('#imgCombineContrastVal')) $('#imgCombineContrastVal').textContent = toBn(ct) + '%';
    if ($('#imgCombineSatVal')) $('#imgCombineSatVal').textContent = toBn(st) + '%';
    if ($('#imgCombineSharpVal')) $('#imgCombineSharpVal').textContent = toBn(sharp) + '%';

    var cardWInput = $('#imgCombineCardW') ? (parseInt($('#imgCombineCardW').value, 10) || 660) : 660;
    var gap = Math.max(0, parseInt($('#imgCombineGap').value, 10) || 36);
    var bg = $('#imgCombineBg').value || '#ffffff';
    var alignMode = $('#imgCombineAlign') ? $('#imgCombineAlign').value : 'top';
    var copySets = $('#imgCombineCopies') ? (parseInt($('#imgCombineCopies').value, 10) || 1) : 1;
    var roundCorner = $('#imgCombineRoundCorner') ? $('#imgCombineRoundCorner').checked : true;
    var showBorder = $('#imgCombineCardBorder') ? $('#imgCombineCardBorder').checked : true;
    var showCutMarks = $('#imgCombineCutMarks') ? $('#imgCombineCutMarks').checked : false;

    // Render each card through perspective rectification + deskew + color enhancer at full resolution
    var processedCards = combineItems.map(function (entry) {
      var c = renderProcessedCardCanvas(entry, scanMode, br, ct, st, sharp);
      entry.croppedCanvas = c;
      return c;
    });

    // Update Active Card Cropped Preview + Dual Mini Thumbnails in Left Column
    var activeEntry = combineItems[activeNidIdx];
    if (activeEntry && activeEntry.croppedCanvas && $('#nidActiveCardPreview')) {
      $('#nidActiveCardPreview').src = activeEntry.croppedCanvas.toDataURL('image/jpeg', 0.96);
      var lbl = activeNidIdx === 0 ? 'সামনের অংশ (Front)' : (activeNidIdx === 1 ? 'পেছনের অংশ (Back)' : 'কার্ড ' + toBn(activeNidIdx + 1));
      if ($('#nidActiveCardTitle')) $('#nidActiveCardTitle').textContent = lbl + ' — প্রিভিউ';
      if ($('#nidActiveCardMeta')) {
        $('#nidActiveCardMeta').textContent = activeEntry.croppedCanvas.width + ' × ' + activeEntry.croppedCanvas.height + ' px • ' + (activeEntry.autoDetected ? 'অটো এজ ডিটেক্ট ✓' : 'পার্সপেক্টিভ ক্রপ ✓');
      }
    }
    renderNidDualPreviewStrip();

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (mode === 'nid-a4' || mode === 'nid-a4-side') {
      // Full 300 DPI A4 = 2480 × 3508 px (2x scale factor from 150 DPI layout units)
      var dpiScale = 2;
      canvas.width = 2480;
      canvas.height = 3508;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      var cardW = Math.max(520, Math.min(2200, cardWInput * dpiScale));
      var gapPx = gap * dpiScale;

      if (mode === 'nid-a4-side' && processedCards.length >= 2) {
        // Side-by-side Front & Back on A4 sheet
        var maxSideW = Math.floor((canvas.width - 240 - gapPx) / 2);
        var sideW = Math.min(cardW, maxSideW);
        var pairItems = processedCards.slice(0, 2).map(function (c) {
          return { img: c, w: sideW, h: Math.round(c.height * (sideW / c.width)) };
        });
        var rowH = Math.max(pairItems[0].h, pairItems[1].h);
        var totalPairW = pairItems[0].w + gapPx + pairItems[1].w;
        var startX = Math.round((canvas.width - totalPairW) / 2);
        var rowsCount = copySets;
        var allRowsH = rowsCount * rowH + Math.max(0, rowsCount - 1) * (gapPx * 1.4);
        var startY = alignMode === 'center'
          ? Math.max(160, Math.round((canvas.height - allRowsH) / 2))
          : 240;

        for (var rIdx = 0; rIdx < rowsCount; rIdx++) {
          var ry = Math.round(startY + rIdx * (rowH + gapPx * 1.4));
          if (ry + rowH > canvas.height - 80) break;
          drawCardWithOptions(ctx, pairItems[0].img, startX, ry, pairItems[0].w, pairItems[0].h, roundCorner, showBorder, showCutMarks);
          drawCardWithOptions(ctx, pairItems[1].img, startX + pairItems[0].w + gapPx, ry, pairItems[1].w, pairItems[1].h, roundCorner, showBorder, showCutMarks);
        }
      } else {
        // Top-to-Bottom on A4 sheet (supports 1, 2, or 4 copy sets)
        var colsCount = copySets >= 2 ? 2 : 1;
        var rowsSets = copySets === 4 ? 2 : 1;
        var effCardW = colsCount === 2 ? Math.min(cardW, Math.floor((canvas.width - 280 - gapPx * 1.5) / 2)) : cardW;

        var oneSetH = 0;
        var scaled = processedCards.map(function (c) {
          var h = Math.round(c.height * (effCardW / c.width));
          oneSetH += h;
          return { img: c, w: effCardW, h: h };
        });
        oneSetH += gapPx * Math.max(0, scaled.length - 1);

        var totalBlockH = rowsSets * oneSetH + (rowsSets - 1) * (gapPx * 2);
        var baseTopY = alignMode === 'center'
          ? Math.max(150, Math.round((canvas.height - totalBlockH) / 2))
          : 230;

        var totalColsW = colsCount * effCardW + (colsCount - 1) * Math.round(gapPx * 1.6);
        var baseLeftX = Math.round((canvas.width - totalColsW) / 2);

        for (var rs = 0; rs < rowsSets; rs++) {
          for (var cs = 0; cs < colsCount; cs++) {
            var colX = baseLeftX + cs * (effCardW + Math.round(gapPx * 1.6));
            var curY = baseTopY + rs * (oneSetH + gapPx * 2);
            scaled.forEach(function (s) {
              drawCardWithOptions(ctx, s.img, colX, curY, s.w, s.h, roundCorner, showBorder, showCutMarks);
              curY += s.h + gapPx;
            });
          }
        }
      }
    } else if (mode === 'vertical') {
      var targetW = Math.max(1400, Math.min(2600, Math.max.apply(null, processedCards.map(function (c) { return c.width; }))));
      var pad = gap * 2;
      var vGap = gap * 2;
      var sumH = pad * 2 + vGap * Math.max(0, processedCards.length - 1);
      var rows = processedCards.map(function (c) {
        var h = Math.round(c.height * (targetW / c.width));
        sumH += h;
        return { img: c, w: targetW, h: h };
      });
      canvas.width = targetW + pad * 2;
      canvas.height = sumH;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      var y = pad;
      rows.forEach(function (r) {
        drawCardWithOptions(ctx, r.img, pad, y, r.w, r.h, roundCorner, showBorder, showCutMarks);
        y += r.h + vGap;
      });
    } else {
      // horizontal
      var targetH = Math.max(900, Math.min(2000, Math.max.apply(null, processedCards.map(function (c) { return c.height; }))));
      var padH = gap * 2;
      var hGap = gap * 2;
      var sumW = padH * 2 + hGap * Math.max(0, processedCards.length - 1);
      var cols = processedCards.map(function (c) {
        var w = Math.round(c.width * (targetH / c.height));
        sumW += w;
        return { img: c, w: w, h: targetH };
      });
      canvas.width = sumW;
      canvas.height = targetH + padH * 2;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      var x = padH;
      cols.forEach(function (c) {
        drawCardWithOptions(ctx, c.img, x, padH, c.w, c.h, roundCorner, showBorder, showCutMarks);
        x += c.w + hGap;
      });
    }

    var blob = await canvasToBlob(canvas, 'image/jpeg', 0.96);
    if (token !== combineToken) return;
    if (combineOut.url) URL.revokeObjectURL(combineOut.url);
    combineOut.blob = blob;
    combineOut.url = URL.createObjectURL(blob);
    combineOut.width = canvas.width;
    combineOut.height = canvas.height;
    combineOut.mode = mode;

    $('#imgCombineOutPreview').src = combineOut.url;
    $('#imgCombineOutMeta').textContent = canvas.width + ' × ' + canvas.height + ' px (300 DPI) • ' + fmtSize(blob.size);
    $('#imgCombineSummary').textContent = toBn(combineItems.length) + 'টি কার্ড • ' + toBn(copySets) + ' সেট • 300 DPI HD • ' + fmtSize(blob.size);
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
      showToast('ক্যামেরা চালু করা যায়নি — অনুগ্রহ করে ফাইল সিলেক্ট করুন');
      var fb = slotIdx === 0 ? $('#nidFrontInput') : (slotIdx === 1 ? $('#nidBackInput') : $('#imgCombineInput'));
      if (fb) fb.click();
    }
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
          showToast(hex + ' কপি হয়েছে!');
        });
        grid.appendChild(btn);
      });
    } catch (e) {
      showToast(e.message || 'ছবি লোড করা যায়নি');
    }
  }

  /* ==================================================================
   * INITIALIZATION
   * ================================================================== */
  function on(id, ev, fn) { var el = $('#' + id); if (el) el.addEventListener(ev, fn); }

  function init() {
    if (initialized) return;
    initialized = true;

    $$('#tool-image .pdf-nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchImgTab(btn.getAttribute('data-img-tab'));
      });
    });

    $$('#tool-image [data-open-img]').forEach(function (card) {
      card.addEventListener('click', function () {
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
      showToast('রিসাইজড ছবি ডাউনলোড হয়েছে!');
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
        showToast('কমপ্রেসড ছবি ডাউনলোড হয়েছে!');
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
        showToast('সবগুলো ছবি ZIP হিসেবে ডাউনলোড হয়েছে!');
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
      showToast('ক্রপ করা ছবি ডাউনলোড হয়েছে!');
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
        showToast('Base64 কোড কপি হয়েছে!');
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
      showToast('ছবি ডাউনলোড হয়েছে!');
    });

    // 5. CamScanner ID Card Scanner & Combine Images
    wireDropzone($('#imgCombineDropzone'), $('#imgCombineInput'), addCombineFiles);
    installNidCropInteraction();
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
      var det = autoDetectCardQuad(entry.item.img, entry.rot, entry.flipH || 1);
      entry.pts = det.pts;
      entry.autoDetected = true;
      positionNidQuadDOM();
      triggerNidScanAnimation();
      renderCombineOutput();
      showToast('আইডি কার্ডের এজ অটো-ডিটেক্ট ও সোজা করা হয়েছে!');
    });
    on('nidSnapRatioBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      snapQuadToCardRatio(entry);
      positionNidQuadDOM();
      renderCombineOutput();
      showToast('আসল আইডি কার্ডের অনুপাত (85.6×54mm) সেট করা হয়েছে!');
    });
    on('nidFullCropBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      entry.pts = defaultQuadPts(0);
      entry.autoDetected = false;
      positionNidQuadDOM();
      renderCombineOutput();
    });
    on('nidRotLBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      entry.rot -= 90;
      var detL = autoDetectCardQuad(entry.item.img, entry.rot, entry.flipH || 1);
      entry.pts = detL.pts;
      drawNidCropSourceCanvas();
      renderCombineOutput();
    });
    on('nidRotRBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      entry.rot += 90;
      var detR = autoDetectCardQuad(entry.item.img, entry.rot, entry.flipH || 1);
      entry.pts = detR.pts;
      drawNidCropSourceCanvas();
      renderCombineOutput();
    });
    on('nidFlipHBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      entry.flipH = (entry.flipH || 1) * -1;
      entry.pts = entry.pts.map(function (pt) { return { x: 1 - pt.x, y: pt.y }; });
      entry.pts = orderQuadClockwise(entry.pts);
      drawNidCropSourceCanvas();
      renderCombineOutput();
    });
    on('nidFineAngle', 'input', function (e) {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      entry.fineAngle = parseFloat(e.target.value) || 0;
      syncNidDeskewControl();
      renderCombineOutput();
    });
    on('nidFineAngleReset', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      entry.fineAngle = 0;
      syncNidDeskewControl();
      renderCombineOutput();
    });
    $$('#nidSizePresets [data-cardw]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('#nidSizePresets [data-cardw]').forEach(function (b) { b.classList.remove('chip-btn--accent'); });
        btn.classList.add('chip-btn--accent');
        if ($('#imgCombineCardW')) {
          $('#imgCombineCardW').value = btn.getAttribute('data-cardw');
        }
        renderCombineOutput();
      });
    });
    $$('input[name="imgCombineMode"], input[name="imgCombineScanMode"]').forEach(function (r) {
      r.addEventListener('change', renderCombineOutput);
    });
    ['imgCombineBright', 'imgCombineContrast', 'imgCombineSat', 'imgCombineSharp', 'imgCombineCardW', 'imgCombineGap', 'imgCombineAlign', 'imgCombineCopies', 'imgCombineBg', 'imgCombineRoundCorner', 'imgCombineCardBorder', 'imgCombineCutMarks'].forEach(function (id) {
      on(id, 'input', renderCombineOutput);
      on(id, 'change', renderCombineOutput);
    });
    on('imgCombineColorResetBtn', 'click', function () {
      var origR = $('input[name="imgCombineScanMode"][value="original"]');
      if (origR) origR.checked = true;
      if ($('#imgCombineBright')) $('#imgCombineBright').value = 100;
      if ($('#imgCombineContrast')) $('#imgCombineContrast').value = 100;
      if ($('#imgCombineSat')) $('#imgCombineSat').value = 100;
      if ($('#imgCombineSharp')) $('#imgCombineSharp').value = 20;
      renderCombineOutput();
    });
    on('imgCombineSwapBtn', 'click', function () {
      combineItems.reverse();
      activeNidIdx = 0;
      renderNidCardTabs();
      syncNidDeskewControl();
      drawNidCropSourceCanvas();
      renderCombineOutput();
    });
    on('imgCombineClearBtn', 'click', function () {
      combineItems = [];
      activeNidIdx = 0;
      $('#imgCombineStage').hidden = true;
      $('#imgCombineTopActions').hidden = true;
      $('#imgCombineDropzone').hidden = false;
    });
    on('imgCombineDownloadBtn', 'click', function () {
      if (!combineOut.blob) return;
      downloadBlob(combineOut.blob, 'techhat-nid-scanned-card.jpg');
      showToast('হাই-রেজোলিউশন JPG কার্ড ডাউনলোড হয়েছে!');
    });
    on('imgCombineDownloadPdfBtn', 'click', async function () {
      if (!combineOut.blob) return;
      try {
        var ab = await combineOut.blob.arrayBuffer();
        var jpegBytes = new Uint8Array(ab);
        var pdfBlob = buildJpegPdfBlob(
          jpegBytes,
          combineOut.width || 2480,
          combineOut.height || 3508,
          combineOut.mode === 'nid-a4' || combineOut.mode === 'nid-a4-side'
        );
        downloadBlob(pdfBlob, 'techhat-nid-scanned-card.pdf');
        showToast('প্রিন্ট-রেডি A4 PDF ডাউনলোড হয়েছে!');
      } catch (e) {
        showToast('PDF তৈরি করা যায়নি');
      }
    });
    on('imgCombinePrintBtn', 'click', function () {
      if (!combineOut.url) return;
      var w = window.open('', '_blank', 'width=840,height=960');
      if (!w) {
        showToast('পপ-আপ ব্লক করা হয়েছে — অনুগ্রহ করে PDF ডাউনলোড করে প্রিন্ট করুন');
        return;
      }
      w.document.write(
        '<!doctype html><html><head><title>TechHat ID Card Print</title>' +
        '<style>@page{size:A4;margin:0}html,body{margin:0;padding:0;background:#fff;display:flex;justify-content:center;align-items:flex-start}img{width:100%;max-width:210mm;height:auto;display:block}</style>' +
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
        showToast(hex + ' কপি হয়েছে!');
      });
    }
    on('imgCopyHexBtn', 'click', function () {
      var hex = $('#imgPickedHex').textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(hex);
      showToast(hex + ' কপি হয়েছে!');
    });
    on('imgCopyRgbBtn', 'click', function () {
      var rgb = $('#imgPickedRgb').textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(rgb);
      showToast(rgb + ' কপি হয়েছে!');
    });
    on('imgColorsResetBtn', 'click', function () {
      $('#imgColorsStage').hidden = true;
      $('#imgColorsTopActions').hidden = true;
      $('#imgColorsDropzone').hidden = false;
    });

    var root = $('#tool-image');
    var initTab = root && root.getAttribute('data-initial-tab');
    if (initTab) switchImgTab(initTab, true);
  }

  window.TechHatImage = { init: init, switchTab: switchImgTab };

  var imgRoot = $('#tool-image');
  if (imgRoot && !imgRoot.hidden) {
    init();
  }
})();
