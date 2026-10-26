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
      autoDetectCropSubjectBox();
      await updateCropPreview();
      $('#imgCropDropzone').hidden = true;
      $('#imgCropStage').hidden = false;
      $('#imgCropTopActions').hidden = false;
    } catch (e) {
      showToast(e.message || 'ছবি লোড করা যায়নি');
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
    if (!cropState.snapField) cropState.snapField = buildMagneticSnapField(canvas);
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
      showToast('অটো-সিলেকশন সম্পন্ন হয়েছে!');
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
   * 5. ID CARD SCANNER, AUTO EDGE DETECTION, MAGNETIC SNAP, 4-CORNER PERSPECTIVE CROP & TOP-BOTTOM MAKER
   * ================================================================== */
  var combineItems = []; // [{ item, rot:0, flipH:1, fineAngle:0, pts:[{x,y},{x,y},{x,y},{x,y}], autoDetected:bool, cw, ch, snapField }]
  var activeNidIdx = 0;
  var nidMagSnapEnabled = true;
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
   * CamScanner-Grade Multi-Cue Auto ID Card & Quad Detector (`autoDetectCardQuad`).
   * Combines:
   *  1. 3x3 Multi-Channel RGB Sobel Gradients + Mode Background Surface Estimation
   *  2. 2D Summed Area Tables (Integral Images) for O(1) Multi-Scale Pyramid Proposals
   *     + Multi-Scale Morphological Connected Components (with 4-quadrant internal balance,
   *     surround contrast, 4-side perimeter frame energy, and ISO ID-1 aspect-ratio scoring)
   *  3. Radon Projection Angle Estimation (-32 deg .. +32 deg) for tilted cards
   *  4. 4-Side Independent Perspective Edge Snapping (Left/Right & Top/Bottom halves)
   *  5. Optional `excludeQuad` masking to detect a 2nd card on the same scanned sheet.
   */
  function autoDetectCardQuad(img, rotDeg, flipH, excludeQuad, seedPt) {
    try {
      var c = buildRotatedCanvas(img, rotDeg || 0, 340, flipH || 1);
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
      var smoothBuckets = {}, borderBuckets = {};
      var bestSmooth = null, bestSmoothN = 0;
      var bestBorder = null, bestBorderN = 0;
      for (var by = marginY; by < maxY; by += 2) {
        for (var bx = marginX; bx < maxX; bx += 2) {
          var bIdx = by * aw + bx;
          var bi = bIdx * 4;
          if (data[bi] < 32 && data[bi + 1] < 32 && data[bi + 2] < 32 &&
              Math.max(data[bi], data[bi + 1], data[bi + 2]) - Math.min(data[bi], data[bi + 1], data[bi + 2]) < 16) continue;
          var key = ((data[bi] >> 4) << 8) | ((data[bi + 1] >> 4) << 4) | (data[bi + 2] >> 4);
          var isOuter = (bx < marginX + actW * 0.16 || bx > maxX - actW * 0.16 ||
                         by < marginY + actH * 0.18 || by > maxY - actH * 0.18);
          if (isOuter) {
            var be = borderBuckets[key];
            if (!be) { be = { n: 0, r: 0, g: 0, b: 0 }; borderBuckets[key] = be; }
            be.n++; be.r += data[bi]; be.g += data[bi + 1]; be.b += data[bi + 2];
            if (be.n > bestBorderN) { bestBorderN = be.n; bestBorder = be; }
          }
          if (gradMag[bIdx] <= medianG + 3) {
            var se = smoothBuckets[key];
            if (!se) { se = { n: 0, r: 0, g: 0, b: 0 }; smoothBuckets[key] = se; }
            se.n++; se.r += data[bi]; se.g += data[bi + 1]; se.b += data[bi + 2];
            if (se.n > bestSmoothN) { bestSmoothN = se.n; bestSmooth = se; }
          }
        }
      }
      var bgR = bestBorder ? (bestBorder.r / bestBorder.n) : 180;
      var bgG = bestBorder ? (bestBorder.g / bestBorder.n) : 180;
      var bgB = bestBorder ? (bestBorder.b / bestBorder.n) : 180;
      if (bestSmooth && bestSmoothN > validPixels * 0.06) {
        var smR = bestSmooth.r / bestSmooth.n;
        var smG = bestSmooth.g / bestSmooth.n;
        var smB = bestSmooth.b / bestSmooth.n;
        var borderChroma = Math.max(bgR, bgG, bgB) - Math.min(bgR, bgG, bgB);
        if (borderChroma < 22 && (smR + smG + smB) > (bgR + bgG + bgB) + 45) {
          bgR = smR; bgG = smG; bgB = smB;
        }
      }

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

            var cDist = Math.hypot(r - bgR, g - bgG, b - bgB);
            var cTerm = cDist > 26 ? Math.min(50, (cDist - 26) * 0.58) : 0;
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

      function scoreCandidateBox(x0, y0, x1, y1) {
        var w = x1 - x0, h = y1 - y0;
        if (w < aw * 0.22 || h < ah * 0.16) return -1;
        var area = w * h;
        var frameArea = aw * ah;
        if (area < frameArea * 0.065 || area > frameArea * 0.95) return -1;

        if (seedPx) {
          if (seedPx.x < x0 + w * 0.08 || seedPx.x > x1 - w * 0.08 ||
              seedPx.y < y0 + h * 0.08 || seedPx.y > y1 - h * 0.08) return -1;
        }

        var aspect = w / Math.max(1, h);
        var isLandscape = aspect >= 1.28 && aspect <= 1.88 && w >= aw * 0.36;
        var isPortrait = aspect >= 0.54 && aspect <= 0.78 && h >= ah * 0.42;
        if (!isLandscape && !isPortrait) return -1;
        var normAspect = isLandscape ? aspect : (1 / aspect);

        var inSum = rectSum(satStruct, x0, y0, x1, y1);
        var inMean = inSum / area;
        if (inMean < 2.0) return -1;

        // 4-quadrant internal distribution check (rejects L-shaped merges with handwriting)
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
        var outerArea = Math.max(1, (ox1 - ox0) * (oy1 - oy0) - area);
        var outerSum = Math.max(0, rectSum(satStruct, ox0, oy0, ox1, oy1) - inSum);
        var outerMean = outerSum / outerArea;
        var structContrast = (inMean + 4.5) / (outerMean + 5.5);

        // Exact O(1) Local Card-vs-Surround RGB Contrast
        var inR = rectSum(satR, x0, y0, x1, y1) / area;
        var inG = rectSum(satG, x0, y0, x1, y1) / area;
        var inB = rectSum(satB, x0, y0, x1, y1) / area;
        var outR = (rectSum(satR, ox0, oy0, ox1, oy1) - inR * area) / outerArea;
        var outG = (rectSum(satG, ox0, oy0, ox1, oy1) - inG * area) / outerArea;
        var outB = (rectSum(satB, ox0, oy0, ox1, oy1) - inB * area) / outerArea;
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
          if (topDiffToCard < 34 && botDiffToCard > 60 && topBotAsym > 48) {
            cutPenalty *= 0.48;
          }
          if (botDiffToCard < 34 && topDiffToCard > 60 && topBotAsym > 48) {
            cutPenalty *= 0.48;
          }
          var topDiffToBg = Math.hypot(tR - bgR, tG - bgG, tB - bgB);
          var botDiffToBg = Math.hypot(bR - bgR, bG - bgG, bB - bgB);
          if (topBotAsym > 85 && botDiffToBg < 30 && topDiffToBg > 85 && (tR + tG + tB) >= (inR + inG + inB) - 30) {
            cutPenalty *= 0.22;
          }
        }

        // Penalize candidate boxes whose top+bottom (or left+right) inner 12% margins are both dark background around a bright center card
        var inBandH12 = Math.max(3, Math.round(h * 0.12));
        var inBandW12 = Math.max(3, Math.round(w * 0.12));
        var midY0 = y0 + Math.round(h * 0.25), midY1 = y1 - Math.round(h * 0.25);
        var midX0 = x0 + Math.round(w * 0.25), midX1 = x1 - Math.round(w * 0.25);
        var midAreaH = Math.max(1, w * (midY1 - midY0));
        var midAreaW = Math.max(1, h * (midX1 - midX0));
        var midLumH = (rectSum(satR, x0, midY0, x1, midY1) + rectSum(satG, x0, midY0, x1, midY1) + rectSum(satB, x0, midY0, x1, midY1)) / midAreaH;
        var midLumW = (rectSum(satR, midX0, y0, midX1, y1) + rectSum(satG, midX0, y0, midX1, y1) + rectSum(satB, midX0, y0, midX1, y1)) / midAreaW;
        var topInLum = (rectSum(satR, x0, y0, x1, y0 + inBandH12) + rectSum(satG, x0, y0, x1, y0 + inBandH12) + rectSum(satB, x0, y0, x1, y0 + inBandH12)) / Math.max(1, w * inBandH12);
        var botInLum = (rectSum(satR, x0, y1 - inBandH12, x1, y1) + rectSum(satG, x0, y1 - inBandH12, x1, y1) + rectSum(satB, x0, y1 - inBandH12, x1, y1)) / Math.max(1, w * inBandH12);
        var leftInLum = (rectSum(satR, x0, y0, x0 + inBandW12, y1) + rectSum(satG, x0, y0, x0 + inBandW12, y1) + rectSum(satB, x0, y0, x0 + inBandW12, y1)) / Math.max(1, h * inBandW12);
        var rightInLum = (rectSum(satR, x1 - inBandW12, y0, x1, y1) + rectSum(satG, x1 - inBandW12, y0, x1, y1) + rectSum(satB, x1 - inBandW12, y0, x1, y1)) / Math.max(1, h * inBandW12);
        if ((midLumH - topInLum > 165 && midLumH - botInLum > 165) ||
            (midLumW - leftInLum > 165 && midLumW - rightInLum > 165)) {
          cutPenalty *= 0.16;
        }

        var blueExcess = Math.max(0, inB - Math.max(inR, inG));
        var paperBonus = blueExcess > 16 ? Math.max(0.30, 1 - (blueExcess - 16) * 0.03) : 1.15;
        var colorContrastBoost = 1 + Math.min(2.2, localColorDiff / 36);

        // 4-side tangential boundary frame energy
        var bandX = Math.max(3, Math.round(w * 0.05));
        var bandY = Math.max(3, Math.round(h * 0.06));
        var topEdge = rectSum(satHoriz, x0, y0 - bandY, x1, y0 + bandY) / Math.max(1, w * bandY * 2);
        var botEdge = rectSum(satHoriz, x0, y1 - bandY, x1, y1 + bandY) / Math.max(1, w * bandY * 2);
        var leftEdge = rectSum(satVert, x0 - bandX, y0, x0 + bandX, y1) / Math.max(1, h * bandX * 2);
        var rightEdge = rectSum(satVert, x1 - bandX, y0, x1 + bandX, y1) / Math.max(1, h * bandX * 2);

        var activeSides = (topEdge > 1.8 ? 1 : 0) + (botEdge > 1.8 ? 1 : 0) +
                          (leftEdge > 1.8 ? 1 : 0) + (rightEdge > 1.8 ? 1 : 0);
        var sideMult = activeSides === 4 ? 1.35 : (activeSides === 3 ? 1.12 : 0.78);
        var frameStrength = (1 + (topEdge + botEdge + leftEdge + rightEdge) * 0.06) * sideMult;

        var aspectDiff = Math.abs(normAspect - 1.56);
        var aspectWeight = Math.exp(-(aspectDiff * aspectDiff) / 0.11);
        var orientBonus = isLandscape ? 1.0 : 0.88;

        var areaFrac = area / frameArea;
        var sizeWeight = areaFrac > 0.88 ? 0.35 : Math.pow(areaFrac, 0.30);

        var seedBonus = 1.0;
        if (seedPx) {
          var distToCenter = Math.hypot((seedPx.x - (x0 + x1) * 0.5) / w, (seedPx.y - (y0 + y1) * 0.5) / h);
          seedBonus = Math.exp(-(distToCenter * distToCenter) * 2.5);
        }

        return inMean * structContrast * colorContrastBoost * paperBonus * cutPenalty * balanceFactor * frameStrength * aspectWeight * orientBonus * sizeWeight * seedBonus;
      }

      var bestBox = null;
      var bestScore = -1;

      var ratios = [1.585, 1.50, 1.65, 1.42, 0.631, 0.667];
      var scales = [0.25, 0.30, 0.36, 0.41, 0.46, 0.52, 0.58, 0.65, 0.72, 0.80, 0.88, 0.94];
      for (var sIdx = 0; sIdx < scales.length; sIdx++) {
        var candW = Math.round(aw * scales[sIdx]);
        for (var rIdx = 0; rIdx < ratios.length; rIdx++) {
          var candH = Math.round(candW / ratios[rIdx]);
          if (candH < ah * 0.15 || candH > (maxY - marginY) * 0.98) continue;
          var stepX = Math.max(3, Math.round((aw - candW) > 20 ? candW * 0.065 : 3));
          var stepY = Math.max(4, Math.round(candH * 0.065));
          for (var y0 = marginY; y0 + candH <= maxY; y0 += stepY) {
            for (var x0 = marginX; x0 + candW <= maxX; x0 += stepX) {
              var sc = scoreCandidateBox(x0, y0, x0 + candW, y0 + candH);
              if (sc > bestScore) {
                bestScore = sc;
                bestBox = { x0: x0, y0: y0, x1: x0 + candW, y1: y0 + candH, score: sc };
              }
            }
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
                var nsc = scoreCandidateBox(nx0, ny0, nx1, ny1);
                if (nsc > bestScore) {
                  bestScore = nsc;
                  bestBox = { x0: nx0, y0: ny0, x1: nx1, y1: ny1, score: nsc };
                }
              }
            }
          }
        }

        // Stage 3: Radon Tilt Angle Estimation + 3-Span Collinear Perspective Line Fitting & 4-Line Intersection
        var bw = bestBox.x1 - bestBox.x0;
        var bh = bestBox.y1 - bestBox.y0;
        var cx = (bestBox.x0 + bestBox.x1) * 0.5;
        var cy = (bestBox.y0 + bestBox.y1) * 0.5;
        var cardArea = Math.max(1, bw * bh);
        var cardR = rectSum(satR, bestBox.x0, bestBox.y0, bestBox.x1, bestBox.y1) / cardArea;
        var cardG = rectSum(satG, bestBox.x0, bestBox.y0, bestBox.x1, bestBox.y1) / cardArea;
        var cardB = rectSum(satB, bestBox.x0, bestBox.y0, bestBox.x1, bestBox.y1) / cardArea;
        var meanCardLum = cardR + cardG + cardB;
        var subR = 0, subG = 0, subB = 0, subN = 0;

        var actX = [], actY = [], actGx = [], actGy = [];
        for (var py = bestBox.y0; py < bestBox.y1; py++) {
          for (var px = bestBox.x0; px < bestBox.x1; px++) {
            var pIdx2 = py * aw + px;
            var pi2_4 = pIdx2 * 4;
            var pLum = data[pi2_4] + data[pi2_4 + 1] + data[pi2_4 + 2];
            if (pLum >= meanCardLum) {
              subR += data[pi2_4]; subG += data[pi2_4 + 1]; subB += data[pi2_4 + 2]; subN++;
            }
            if (gradMag[pIdx2] > noiseFloor * 1.2) {
              actX.push(px - cx);
              actY.push(py - cy);
              actGx.push(gxSigned[pIdx2]);
              actGy.push(gySigned[pIdx2]);
            }
          }
        }
        if (subN > 16) {
          cardR = subR / subN;
          cardG = subG / subN;
          cardB = subB / subN;
        }

        var bestAngle = 0;
        if (actX.length >= 24) {
          var nBins = 56;
          var histU = new Float32Array(nBins);
          var histV = new Float32Array(nBins);
          var maxSpan = Math.hypot(bw, bh) * 0.55;
          var scoreAtZero = 0;
          var bestRadonScore = -1;
          var bestDeg = 0;

          for (var deg = -28; deg <= 28; deg += 1) {
            var rad = (deg * Math.PI) / 180;
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
            if (deg === 0) scoreAtZero = rScore;
            if (rScore > bestRadonScore) {
              bestRadonScore = rScore;
              bestDeg = deg;
            }
          }
          if (Math.abs(bestDeg) >= 2 && bestRadonScore > scoreAtZero * 1.12) {
            bestAngle = (bestDeg * Math.PI) / 180;
          }
        }

        var cosB = Math.cos(bestAngle), sinB = Math.sin(bestAngle);
        var minU = -bw * 0.5, maxU = bw * 0.5;
        var minV = -bh * 0.5, maxV = bh * 0.5;

        if (Math.abs(bestAngle) > 0.03) {
          var roiX0 = Math.max(marginX, Math.round(bestBox.x0 - bw * 0.18));
          var roiY0 = Math.max(marginY, Math.round(bestBox.y0 - bh * 0.18));
          var roiX1 = Math.min(maxX, Math.round(bestBox.x1 + bw * 0.18));
          var roiY1 = Math.min(maxY, Math.round(bestBox.y1 + bh * 0.18));
          var uVals = [], vVals = [];
          for (var ry = roiY0; ry < roiY1; ry++) {
            for (var rx = roiX0; rx < roiX1; rx++) {
              var ri = (ry * aw + rx) * 4;
              var dCard = Math.hypot(data[ri] - cardR, data[ri + 1] - cardG, data[ri + 2] - cardB);
              if ((dCard < 55 && structMap[ry * aw + rx] > noiseFloor * 0.6) || gradMag[ry * aw + rx] > noiseFloor * 1.45) {
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

        var findBestBoundaryPeak = function (baseCoord, searchIn, searchOut, tStart, tEnd, isHorizontal, outSign) {
          var bestCoord = baseCoord;
          var bestVal = -1;
          var steps = 18;
          for (var d = -searchIn; d <= searchOut; d++) {
            var coord = baseCoord + outSign * d;
            var sumScore = 0, valid = 0;
            for (var s = 1; s < steps; s++) {
              var t = tStart + (tEnd - tStart) * (s / steps);
              var u = isHorizontal ? t : coord;
              var v = isHorizontal ? coord : t;
              var ix = Math.round(cx + u * cosB - v * sinB);
              var iy = Math.round(cy + u * sinB + v * cosB);

              var uIn = isHorizontal ? t : (coord - outSign * 1);
              var vIn = isHorizontal ? (coord - outSign * 1) : t;
              var uIn2 = isHorizontal ? t : (coord - outSign * 4);
              var vIn2 = isHorizontal ? (coord - outSign * 4) : t;
              var uIn3 = isHorizontal ? t : (coord - outSign * 8);
              var vIn3 = isHorizontal ? (coord - outSign * 8) : t;
              var uOut = isHorizontal ? t : (coord + outSign * 3);
              var vOut = isHorizontal ? (coord + outSign * 3) : t;
              var ixIn = Math.round(cx + uIn * cosB - vIn * sinB);
              var iyIn = Math.round(cy + uIn * sinB + vIn * cosB);
              var ixIn2 = Math.round(cx + uIn2 * cosB - vIn2 * sinB);
              var iyIn2 = Math.round(cy + uIn2 * sinB + vIn2 * cosB);
              var ixIn3 = Math.round(cx + uIn3 * cosB - vIn3 * sinB);
              var iyIn3 = Math.round(cy + uIn3 * sinB + vIn3 * cosB);
              var ixOut = Math.round(cx + uOut * cosB - vOut * sinB);
              var iyOut = Math.round(cy + uOut * sinB + vOut * cosB);

              if (ix >= marginX && ix < maxX && iy >= marginY && iy < maxY &&
                  ixIn >= 0 && ixIn < aw && iyIn >= 0 && iyIn < ah &&
                  ixIn2 >= 0 && ixIn2 < aw && iyIn2 >= 0 && iyIn2 < ah &&
                  ixIn3 >= 0 && ixIn3 < aw && iyIn3 >= 0 && iyIn3 < ah &&
                  ixOut >= 0 && ixOut < aw && iyOut >= 0 && iyOut < ah) {
                var pIdx3 = iy * aw + ix;
                var gTang = isHorizontal
                  ? Math.abs(-gxSigned[pIdx3] * sinB + gySigned[pIdx3] * cosB)
                  : Math.abs(gxSigned[pIdx3] * cosB + gySigned[pIdx3] * sinB);
                var gOrtho = isHorizontal
                  ? Math.abs(gxSigned[pIdx3] * cosB + gySigned[pIdx3] * sinB)
                  : Math.abs(-gxSigned[pIdx3] * sinB + gySigned[pIdx3] * cosB);
                var pureG = Math.max(0, gTang - 0.35 * gOrtho);

                var iIn4 = (iyIn * aw + ixIn) * 4;
                var iIn2_4 = (iyIn2 * aw + ixIn2) * 4;
                var iIn3_4 = (iyIn3 * aw + ixIn3) * 4;
                var iOut4 = (iyOut * aw + ixOut) * 4;
                var r1 = data[iIn4], g1 = data[iIn4 + 1], b1 = data[iIn4 + 2];
                var r2 = data[iIn2_4], g2 = data[iIn2_4 + 1], b2 = data[iIn2_4 + 2];
                var r3 = data[iIn3_4], g3 = data[iIn3_4 + 1], b3 = data[iIn3_4 + 2];
                var directStep = Math.hypot(data[iOut4] - r1, data[iOut4 + 1] - g1, data[iOut4 + 2] - b1);
                var distIn = Math.hypot(r1 - cardR, g1 - cardG, b1 - cardB);
                var distIn2 = Math.hypot(r2 - cardR, g2 - cardG, b2 - cardB);
                var distIn3 = Math.hypot(r3 - cardR, g3 - cardG, b3 - cardB);
                var distOut = Math.hypot(data[iOut4] - cardR, data[iOut4 + 1] - cardG, data[iOut4 + 2] - cardB);
                var colorTransition = Math.max(0, distOut - distIn);
                var pDist1 = (r1 > 212 && g1 > 205 && (b1 - r1) <= 8) ? Math.min(distIn, 38) : distIn;
                var pDist2 = (r2 > 212 && g2 > 205 && (b2 - r2) <= 8) ? Math.min(distIn2, 38) : distIn2;
                var pDist3 = (r3 > 212 && g3 > 205 && (b3 - r3) <= 8) ? Math.min(distIn3, 38) : distIn3;
                var worstIn = Math.max(pDist1, pDist2 * 0.92, pDist3 * 0.85);
                var paperMatch = worstIn < 48 ? 1.45 : (worstIn < 66 ? 0.82 : 0.28);

                sumScore += (pureG * 0.72 + directStep * 0.35 + colorTransition * 0.48) * paperMatch;
                valid++;
              }
            }
            if (valid > 6) {
              var distPenalty = 1 - (Math.abs(d) / (Math.max(searchIn, searchOut) + 12)) * 0.12;
              var avg = (sumScore / valid) * distPenalty;
              if (avg > bestVal) {
                bestVal = avg;
                bestCoord = coord;
              }
            }
          }
          return bestCoord;
        };

        var fitPerspectiveSideLine = function (baseCoord, searchIn, searchOut, tMin, tMax, isHorizontal, outSign, orthoSpan) {
          var span = tMax - tMin;
          var tMid = (tMin + tMax) * 0.5;
          var cL = findBestBoundaryPeak(baseCoord, searchIn, searchOut, tMin + span * 0.08, tMid, isHorizontal, outSign);
          var cR = findBestBoundaryPeak(baseCoord, searchIn, searchOut, tMid, tMax - span * 0.08, isHorizontal, outSign);
          var cM = findBestBoundaryPeak(baseCoord, searchIn, searchOut, tMin + span * 0.22, tMax - span * 0.22, isHorizontal, outSign);

          var midErr = Math.abs(cM - (cL + cR) * 0.5);
          var halfDiff = Math.abs(cR - cL);
          var minDiff = isHorizontal ? orthoSpan * 0.048 : orthoSpan * 0.028;
          if (midErr <= Math.max(1.2, orthoSpan * 0.014) && halfDiff >= minDiff && halfDiff <= orthoSpan * 0.14) {
            var slope = (cR - cL) / Math.max(1, span * 0.46);
            var midVal = (cL + cM + cR) / 3;
            return { mid: midVal, slope: slope, tMid: tMid };
          }
          var flatCoord = Math.abs(cL - cM) <= Math.abs(cR - cM) ? (cL + cM) * 0.5 : (cR + cM) * 0.5;
          if (midErr <= 1.5) flatCoord = (cL + cM + cR) / 3;
          return { mid: flatCoord, slope: 0, tMid: tMid };
        };

        var searchVIn = Math.max(5, Math.round(spanV * 0.105));
        var searchVOut = Math.max(5, Math.round(spanV * 0.095));
        var searchUIn = Math.max(5, Math.round(spanU * 0.095));
        var searchUOut = Math.max(5, Math.round(spanU * 0.075));

        var topLine = fitPerspectiveSideLine(minV, searchVIn, searchVOut, minU, maxU, true, -1, spanV);
        var botLine = fitPerspectiveSideLine(maxV, searchVIn, searchVOut, minU, maxU, true, +1, spanV);
        var leftLine = fitPerspectiveSideLine(minU, searchUIn, searchUOut, minV, maxV, false, -1, spanU);
        var rightLine = fitPerspectiveSideLine(maxU, searchUIn, searchUOut, minV, maxV, false, +1, spanU);

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
            x: Math.max(0.01, Math.min(0.99, px / aw)),
            y: Math.max(0.01, Math.min(0.99, py / ah))
          };
        };

        var quad = [
          toImgPt(cTL),
          toImgPt(cTR),
          toImgPt(cBR),
          toImgPt(cBL)
        ];

        return { pts: orderQuadClockwise(quad), auto: true };
      }
    } catch (e) {}
    return { pts: defaultQuadPts(0.04), auto: true };
  }

  /**
   * Builds a cached 2D Magnetic Boundary & Corner Attraction Field (`snapField`)
   * using an 8-pixel color-step filter + signed gradient coherence so internal text letters
   * and thin internal divider lines are ignored, while true outer card borders attract cleanly.
   */
  function buildMagneticSnapField(canvas) {
    var cw = canvas.width;
    var ch = canvas.height;
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var data = ctx.getImageData(0, 0, cw, ch).data;

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
        gxSigned[idx] = bestSx;
        gySigned[idx] = bestSy;
        gx[idx] = maxAx;
        gy[idx] = maxAy;
      }
    }

    // Filter for true outer card boundaries (where 8px span across the line has a genuine surface step
    // and signed gradients are coherent along the line, rejecting 1-2px internal text and divider lines)
    for (var by = 4; by < ch - 4; by++) {
      var rUp = (by - 4) * cw, rMid = by * cw, rDn = (by + 4) * cw;
      for (var bx = 4; bx < cw - 4; bx++) {
        var bIdx = rMid + bx;
        var cohGy = Math.abs(gySigned[bIdx - 2] + gySigned[bIdx] + gySigned[bIdx + 2]) / 3;
        var cohGx = Math.abs(gxSigned[bIdx - 2 * cw] + gxSigned[bIdx] + gxSigned[bIdx + 2 * cw]) / 3;

        var iU4 = (rUp + bx) * 4, iD4 = (rDn + bx) * 4;
        var iL4 = (rMid + bx - 4) * 4, iR4 = (rMid + bx + 4) * 4;
        var stepH = Math.hypot(data[iU4] - data[iD4], data[iU4 + 1] - data[iD4 + 1], data[iU4 + 2] - data[iD4 + 2]);
        var stepV = Math.hypot(data[iL4] - data[iR4], data[iL4 + 1] - data[iR4 + 1], data[iL4 + 2] - data[iR4 + 2]);

        boundH[bIdx] = Math.max(0, cohGy - 0.48 * gx[bIdx]) * (0.25 + 0.75 * Math.min(1.8, stepH / 32));
        boundV[bIdx] = Math.max(0, cohGx - 0.48 * gy[bIdx]) * (0.25 + 0.75 * Math.min(1.8, stepV / 32));
      }
    }

    for (var cy = 5; cy < ch - 5; cy++) {
      for (var cx = 5; cx < cw - 5; cx++) {
        var cIdx = cy * cw + cx;
        if (boundH[cIdx] + boundV[cIdx] < 6) continue;
        var sumH = 0, sumV = 0;
        for (var dy = -2; dy <= 2; dy++) {
          var rowOff = (cy + dy) * cw + cx;
          for (var dx = -2; dx <= 2; dx++) {
            sumH += boundH[rowOff + dx];
            sumV += boundV[rowOff + dx];
          }
        }
        corner[cIdx] = Math.min(sumH, sumV) * 0.12 + (boundH[cIdx] + boundV[cIdx]) * 0.55;
      }
    }

    return { cw: cw, ch: ch, gx: boundV, gy: boundH, corner: corner };
  }

  /**
   * Magnetically snaps a single dragged corner `cornerIdx` to nearby true card boundaries/corners.
   * Uses a gentle 9px capture radius during manual dragging so the cursor never jumps onto internal text.
   */
  function snapCornerMagnetically(entry, pts, cornerIdx, rawX, rawY, customRadius) {
    var sf = entry.snapField;
    if (!sf) return { x: rawX, y: rawY, snapped: false, guideH: null, guideV: null };
    var cw = sf.cw, ch = sf.ch;
    var px = rawX * cw, py = rawY * ch;
    var prevPt = pts[(cornerIdx + 3) % 4];
    var nextPt = pts[(cornerIdx + 1) % 4];
    var prevPx = { x: prevPt.x * cw, y: prevPt.y * ch };
    var nextPx = { x: nextPt.x * cw, y: nextPt.y * ch };

    var radius = customRadius || 9;
    var bestX = px, bestY = py;
    var bestScore = 14;
    var snapped = false;

    var x0 = Math.max(5, Math.round(px - radius));
    var x1 = Math.min(cw - 6, Math.round(px + radius));
    var y0 = Math.max(5, Math.round(py - radius));
    var y1 = Math.min(ch - 6, Math.round(py + radius));

    var d1x = prevPx.x - px, d1y = prevPx.y - py;
    var len1 = Math.max(1, Math.hypot(d1x, d1y));
    var n1x = -d1y / len1, n1y = d1x / len1;

    var d2x = nextPx.x - px, d2y = nextPx.y - py;
    var len2 = Math.max(1, Math.hypot(d2x, d2y));
    var n2x = -d2y / len2, n2y = d2x / len2;

    for (var qy = y0; qy <= y1; qy++) {
      for (var qx = x0; qx <= x1; qx++) {
        var dist = Math.hypot(qx - px, qy - py);
        if (dist > radius) continue;
        var idx = qy * cw + qx;
        var cVal = sf.corner[idx];
        if (cVal < 6) continue;

        var rayE = 0;
        for (var s = 1; s <= 6; s++) {
          var t = s * 0.05;
          var r1x = Math.round(qx + (prevPx.x - qx) * t);
          var r1y = Math.round(qy + (prevPx.y - qy) * t);
          var r2x = Math.round(qx + (nextPx.x - qx) * t);
          var r2y = Math.round(qy + (nextPx.y - qy) * t);
          if (r1x >= 4 && r1x < cw - 4 && r1y >= 4 && r1y < ch - 4) {
            var idx1 = r1y * cw + r1x;
            rayE += sf.gx[idx1] * Math.abs(n1x) + sf.gy[idx1] * Math.abs(n1y);
          }
          if (r2x >= 4 && r2x < cw - 4 && r2y >= 4 && r2y < ch - 4) {
            var idx2 = r2y * cw + r2x;
            rayE += sf.gx[idx2] * Math.abs(n2x) + sf.gy[idx2] * Math.abs(n2y);
          }
        }
        var distWeight = 1 - (dist / (radius + 3)) * 0.45;
        var score = (cVal * 0.85 + (rayE / 12) * 1.05) * distWeight;
        if (score > bestScore) {
          bestScore = score;
          bestX = qx;
          bestY = qy;
          snapped = true;
        }
      }
    }

    // Geometric horizontal/vertical alignment guides with adjacent corners
    var guideH = null, guideV = null;
    var alignTol = 4.0;
    if (Math.abs(bestY - prevPx.y) <= alignTol) {
      bestY = prevPx.y;
      guideH = bestY;
      snapped = true;
    } else if (Math.abs(bestY - nextPx.y) <= alignTol) {
      bestY = nextPx.y;
      guideH = bestY;
      snapped = true;
    }
    if (Math.abs(bestX - prevPx.x) <= alignTol) {
      bestX = prevPx.x;
      guideV = bestX;
      snapped = true;
    } else if (Math.abs(bestX - nextPx.x) <= alignTol) {
      bestX = nextPx.x;
      guideV = bestX;
      snapped = true;
    }

    return {
      x: Math.max(0.005, Math.min(0.995, bestX / cw)),
      y: Math.max(0.005, Math.min(0.995, bestY / ch)),
      snapped: snapped,
      guideH: guideH,
      guideV: guideV
    };
  }

  /**
   * Magnetically snaps a dragged edge segment (`p1..p2`) along its normal vector `(-uy, ux)`
   * onto the strongest outer card boundary within `±9px` (or `±18px` on one-click border snap).
   */
  function snapEdgeMagnetically(entry, p1, p2, customSearch) {
    var sf = entry.snapField;
    if (!sf) return { p1: p1, p2: p2, snapped: false };
    var cw = sf.cw, ch = sf.ch;
    var x1 = p1.x * cw, y1 = p1.y * ch;
    var x2 = p2.x * cw, y2 = p2.y * ch;
    var len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 12) return { p1: p1, p2: p2, snapped: false };

    var ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    var nx = -uy, ny = ux; // unit normal perpendicular to edge

    var maxSearch = customSearch || 9;
    var bestD = 0;
    var bestScore = 11;
    var snapped = false;

    for (var d = -maxSearch; d <= maxSearch; d++) {
      var sumE = 0, valid = 0;
      for (var s = 2; s <= 18; s++) {
        var t = s / 20;
        var sx = Math.round(x1 + (x2 - x1) * t + nx * d);
        var sy = Math.round(y1 + (y2 - y1) * t + ny * d);
        if (sx >= 4 && sx < cw - 4 && sy >= 4 && sy < ch - 4) {
          var idx = sy * cw + sx;
          var gPerp = sf.gx[idx] * Math.abs(nx) + sf.gy[idx] * Math.abs(ny);
          var gPara = sf.gx[idx] * Math.abs(ux) + sf.gy[idx] * Math.abs(uy);
          sumE += Math.max(0, gPerp - 0.35 * gPara);
          valid++;
        }
      }
      if (valid > 8) {
        var distDecay = 1 - (Math.abs(d) / (maxSearch + 5)) * 0.32;
        var sc = (sumE / valid) * distDecay;
        if (sc > bestScore) {
          bestScore = sc;
          bestD = d;
          snapped = true;
        }
      }
    }

    if (!snapped) return { p1: p1, p2: p2, snapped: false };
    return {
      p1: {
        x: Math.max(0.005, Math.min(0.995, (x1 + nx * bestD) / cw)),
        y: Math.max(0.005, Math.min(0.995, (y1 + ny * bestD) / ch))
      },
      p2: {
        x: Math.max(0.005, Math.min(0.995, (x2 + nx * bestD) / cw)),
        y: Math.max(0.005, Math.min(0.995, (y2 + ny * bestD) / ch))
      },
      snapped: true
    };
  }

  /**
   * One-click Border Lock (`🎯 বর্ডার স্ন্যাপ`): snaps all 4 edges & corners of the user's
   * current polygon onto the strongest nearby outer card boundaries within ±18px.
   */
  function snapCurrentQuadToNearestEdges(entry) {
    if (!entry || !entry.pts) return;
    if (!entry.snapField && $('#nidCropSourceCanvas')) {
      entry.snapField = buildMagneticSnapField($('#nidCropSourceCanvas'));
    }
    var pts = cloneQuadPts(entry.pts);
    for (var eIdx = 0; eIdx < 4; eIdx++) {
      var nIdx = (eIdx + 1) % 4;
      var resE = snapEdgeMagnetically(entry, pts[eIdx], pts[nIdx], 18);
      if (resE.snapped) {
        pts[eIdx] = resE.p1;
        pts[nIdx] = resE.p2;
      }
    }
    for (var cIdx = 0; cIdx < 4; cIdx++) {
      var resC = snapCornerMagnetically(entry, pts, cIdx, pts[cIdx].x, pts[cIdx].y, 16);
      if (resC.snapped) {
        pts[cIdx].x = resC.x;
        pts[cIdx].y = resC.y;
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
    clearNidHistory();
    $('#imgCombineDropzone').hidden = true;
    $('#imgCombineStage').hidden = false;
    $('#imgCombineTopActions').hidden = false;
    switchNidView('edit');
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
      clearNidHistory();
      $('#imgCombineStage').hidden = false;
      $('#imgCombineTopActions').hidden = false;
      switchNidView('edit');
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
    // Try auto-detecting a 2nd card on the same sheet by masking out the 1st card's region!
    var det2 = autoDetectCardQuad(srcEntry.item.img, srcEntry.rot || 0, srcEntry.flipH || 1, srcEntry.pts);
    var pts = det2 && det2.pts ? cloneQuadPts(det2.pts) : cloneQuadPts(srcEntry.pts);

    // Check if det2 overlapped heavily with srcEntry.pts (e.g., if only 1 card exists on the sheet)
    var c1x = (srcEntry.pts[0].x + srcEntry.pts[2].x) * 0.5;
    var c1y = (srcEntry.pts[0].y + srcEntry.pts[2].y) * 0.5;
    var c2x = (pts[0].x + pts[2].x) * 0.5;
    var c2y = (pts[0].y + pts[2].y) * 0.5;
    if (Math.hypot(c2x - c1x, c2y - c1y) < 0.14) {
      pts = cloneQuadPts(srcEntry.pts);
      var shiftY = c1y < 0.5 ? 0.36 : -0.36;
      var minY = Math.min(pts[0].y, pts[1].y, pts[2].y, pts[3].y);
      var maxY = Math.max(pts[0].y, pts[1].y, pts[2].y, pts[3].y);
      var clampedShiftY = Math.max(-minY + 0.02, Math.min(0.98 - maxY, shiftY));
      for (var i = 0; i < 4; i++) {
        pts[i].y = +(pts[i].y + clampedShiftY).toFixed(4);
      }
    }

    var clonedEntry = {
      item: srcEntry.item,
      rot: srcEntry.rot || 0,
      flipH: srcEntry.flipH || 1,
      fineAngle: 0,
      pts: pts,
      autoDetected: true,
      cw: srcEntry.cw || 0,
      ch: srcEntry.ch || 0,
      snapField: srcEntry.snapField || null
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
    renderNidCardTabs();
    syncNidDeskewControl();
    drawNidCropSourceCanvas();
    triggerNidScanAnimation();
    renderCombineOutput();
    showToast('একই ছবি থেকে অপর পাশের কার্ড অটো-ডিটেক্ট করা হয়েছে!');
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
      items: combineItems.map(function (e) {
        return {
          rot: e.rot || 0,
          flipH: e.flipH || 1,
          fineAngle: e.fineAngle || 0,
          autoDetected: !!e.autoDetected,
          pts: cloneQuadPts(e.pts)
        };
      })
    };
  }

  function updateNidHistoryButtons() {
    var uBtn = $('#nidUndoBtn');
    var rBtn = $('#nidRedoBtn');
    if (uBtn) uBtn.disabled = nidUndoStack.length === 0;
    if (rBtn) rBtn.disabled = nidRedoStack.length === 0;
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
    snap.items.forEach(function (st, i) {
      combineItems[i].rot = st.rot;
      combineItems[i].flipH = st.flipH;
      combineItems[i].fineAngle = st.fineAngle;
      combineItems[i].autoDetected = st.autoDetected;
      combineItems[i].pts = cloneQuadPts(st.pts);
    });
    renderNidCardTabs();
    syncNidDeskewControl();
    drawNidCropSourceCanvas();
    renderCombineOutput();
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
    if (!entry || !entry.viewWidth || !viewport.clientWidth || !viewport.clientHeight) return;
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

  function switchNidView(view) {
    $('#img-pane-combine').setAttribute('data-mobile-view', view);
    $$('[data-nid-view]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-nid-view') === view ? 'true' : 'false');
    });
    if (view === 'edit') requestAnimationFrame(function () {
      if (nidFitMode) fitNidCanvas(); else syncNidViewport();
    });
  }

  function setNidExportReady(ready) {
    ['imgCombineDownloadBtn', 'imgCombineDownloadPdfBtn', 'imgCombinePrintBtn'].forEach(function (id) {
      var btn = $('#' + id);
      if (btn) btn.disabled = !ready;
    });
  }

  function renderNidCardTabs() {
    var tabsEl = $('#nidCardTabs');
    if (!tabsEl) return;
    tabsEl.innerHTML = '';
    combineItems.forEach(function (entry, idx) {
      var label = idx === 0 ? 'সামনের পৃষ্ঠা' : (idx === 1 ? 'পেছনের পৃষ্ঠা' : 'কার্ড ' + toBn(idx + 1));
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nid-card-tab' + (idx === activeNidIdx ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', idx === activeNidIdx ? 'true' : 'false');
      btn.innerHTML = '<span class="nid-card-tab__dot" aria-hidden="true"></span><span>' + label + '</span>';
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
      addBackBtn.textContent = '+ পেছনের ছবি';
      addBackBtn.addEventListener('click', function () {
        var inp = $('#nidReplaceBackInput') || $('#nidBackInput');
        if (inp) inp.click();
      });
      tabsEl.appendChild(addBackBtn);
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
    entry.snapField = buildMagneticSnapField(canvas);
    positionNidQuadDOM();
    fitNidCanvas();
  }

  function positionNidQuadDOM(snapInfo) {
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
    if (poly) {
      poly.setAttribute('points', polyStr);
      poly.classList.toggle('is-snapped', !!(snapInfo && snapInfo.snapped));
    }

    // Update magnetic alignment guide lines
    var gH = $('#nidSnapGuideH');
    var gV = $('#nidSnapGuideV');
    if (gH) {
      if (snapInfo && typeof snapInfo.guideH === 'number') {
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
      if (snapInfo && typeof snapInfo.guideV === 'number') {
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

  function updateNidLoupe(normX, normY, isSnapped) {
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

    // Draw precision crosshair + magnetic snap ring
    lctx.strokeStyle = isSnapped ? '#06b6d4' : '#10b981';
    lctx.lineWidth = isSnapped ? 2 : 1.5;
    lctx.beginPath();
    lctx.moveTo(lw / 2, 0);
    lctx.lineTo(lw / 2, lh);
    lctx.moveTo(0, lh / 2);
    lctx.lineTo(lw, lh / 2);
    lctx.stroke();

    if (isSnapped) {
      lctx.beginPath();
      lctx.arc(lw / 2, lh / 2, 11, 0, Math.PI * 2);
      lctx.stroke();
      lctx.fillStyle = 'rgba(6, 182, 212, 0.92)';
      lctx.fillRect(lw / 2 - 26, lh - 22, 52, 16);
      lctx.fillStyle = '#ffffff';
      lctx.font = 'bold 10px sans-serif';
      lctx.textAlign = 'center';
      lctx.fillText('স্ন্যাপ', lw / 2, lh - 10);
    }

    loupe.style.borderColor = isSnapped ? '#06b6d4' : '#10b981';
    loupe.style.left = (normX * 100) + '%';
    loupe.style.top = (normY * 100) + '%';
    loupe.style.transform = normY < 0.28 ? 'translate(-50%, 28%)' : 'translate(-50%, -125%)';
  }

  function hideNidLoupe() {
    var loupe = $('#nidCropLoupe');
    if (loupe) loupe.hidden = true;
    var poly = $('#nidQuadPoly');
    if (poly) poly.classList.remove('is-snapped');
    var gH = $('#nidSnapGuideH');
    var gV = $('#nidSnapGuideV');
    if (gH) gH.hidden = true;
    if (gV) gV.hidden = true;
    $$('#nidQuadHandles .nid-quad-handle').forEach(function (el) {
      el.classList.remove('active', 'is-snapped');
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
      pushNidHistory();
      drag = {
        mode: mode,
        idx: idx,
        targetEl: e.target,
        startX: e.clientX,
        startY: e.clientY,
        rw: rect.width || 1,
        rh: rect.height || 1,
        origPts: cloneQuadPts(entry.pts)
      };

      wrapEl.setPointerCapture(e.pointerId);
      wrapEl.classList.add('dragging');

      if (mode === 'corner') {
        updateNidLoupe(entry.pts[idx].x, entry.pts[idx].y, false);
      } else if (mode === 'edge') {
        var nIdx = (idx + 1) % 4;
        updateNidLoupe((entry.pts[idx].x + entry.pts[nIdx].x) * 0.5, (entry.pts[idx].y + entry.pts[nIdx].y) * 0.5, false);
      }
    });

    wrapEl.addEventListener('pointermove', function (e) {
      var entry = combineItems[activeNidIdx];
      if (!drag || !entry || !wrapEl.hasPointerCapture(e.pointerId)) return;
      var dx = (e.clientX - drag.startX) / drag.rw;
      var dy = (e.clientY - drag.startY) / drag.rh;
      var pts = cloneQuadPts(drag.origPts);
      var snapInfo = null;
      var useSnap = nidMagSnapEnabled && !e.altKey;

      if (drag.mode === 'corner') {
        var ci = drag.idx;
        var rawX = Math.max(0, Math.min(1, pts[ci].x + dx));
        var rawY = Math.max(0, Math.min(1, pts[ci].y + dy));
        if (useSnap) {
          var sRes = snapCornerMagnetically(entry, pts, ci, rawX, rawY);
          pts[ci].x = sRes.x;
          pts[ci].y = sRes.y;
          snapInfo = sRes;
          if (drag.targetEl) drag.targetEl.classList.toggle('is-snapped', sRes.snapped);
        } else {
          pts[ci].x = rawX;
          pts[ci].y = rawY;
        }
        updateNidLoupe(pts[ci].x, pts[ci].y, !!(snapInfo && snapInfo.snapped));
      } else if (drag.mode === 'edge') {
        var i1 = drag.idx;
        var i2 = (i1 + 1) % 4;
        var p1 = { x: Math.max(0, Math.min(1, pts[i1].x + dx)), y: Math.max(0, Math.min(1, pts[i1].y + dy)) };
        var p2 = { x: Math.max(0, Math.min(1, pts[i2].x + dx)), y: Math.max(0, Math.min(1, pts[i2].y + dy)) };
        if (useSnap) {
          var eRes = snapEdgeMagnetically(entry, p1, p2);
          pts[i1] = eRes.p1;
          pts[i2] = eRes.p2;
          snapInfo = { snapped: eRes.snapped };
          if (drag.targetEl) drag.targetEl.classList.toggle('is-snapped', eRes.snapped);
        } else {
          pts[i1] = p1;
          pts[i2] = p2;
        }
        updateNidLoupe((pts[i1].x + pts[i2].x) * 0.5, (pts[i1].y + pts[i2].y) * 0.5, !!(snapInfo && snapInfo.snapped));
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
      positionNidQuadDOM(snapInfo);
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

    wrapEl.addEventListener('dblclick', function (e) {
      if (nidHandTool || nidSpaceHeld) return;
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      var rect = wrapEl.getBoundingClientRect();
      var sx = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / (rect.width || 1)));
      var sy = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / (rect.height || 1)));
      var det = autoDetectCardQuad(entry.item.img, entry.rot || 0, entry.flipH || 1, null, { x: sx, y: sy });
      entry.pts = det.pts;
      entry.autoDetected = true;
      positionNidQuadDOM({ snapped: true });
      triggerNidScanAnimation();
      renderCombineOutput();
      showToast('স্মার্ট ক্লিক অটো-সিলেকশন সম্পন্ন হয়েছে!');
    });
  }

  /**
   * Produces a perspective-rectified (homography warped) + deskewed + 2D illumination shadow-flattened
   * + color-adjusted canvas for a single card at full native resolution.
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
    var effBr = scanMode === 'magic' ? Math.round(br * 1.06) : (scanMode === 'clean' ? Math.round(br * 1.04) : br);
    var effCt = scanMode === 'magic' ? Math.round(ct * 1.22) : (scanMode === 'clean' ? Math.round(ct * 1.16) : (scanMode === 'bw' ? Math.round(ct * 1.45) : ct));
    var effSt = scanMode === 'magic' ? Math.round(st * 1.15) : st;

    octx.save();
    octx.filter = 'brightness(' + effBr + '%) contrast(' + effCt + '%) saturate(' + effSt + '%) grayscale(' + grayPct + '%)';
    octx.drawImage(warpedCanvas, 0, 0, sw, sh);
    octx.restore();

    if (scanMode === 'magic' || scanMode === 'clean' || scanMode === 'bw' || sharp > 0) {
      var imgData = octx.getImageData(0, 0, sw, sh);
      var d = imgData.data;

      // CamScanner-grade 2D Local Background Illumination Normalization (removes uneven phone/room shadows across the card)
      if ((scanMode === 'magic' || scanMode === 'clean' || scanMode === 'bw') && sw >= 32 && sh >= 32) {
        var gxCount = 8, gyCount = 6;
        var gridIllum = new Float32Array(gxCount * gyCount);
        var tileW = sw / gxCount, tileH = sh / gyCount;
        var lumHist = new Uint32Array(256);

        for (var ty = 0; ty < gyCount; ty++) {
          var yStart = Math.floor(ty * tileH), yEnd = Math.min(sh, Math.floor((ty + 1) * tileH));
          for (var tx = 0; tx < gxCount; tx++) {
            var xStart = Math.floor(tx * tileW), xEnd = Math.min(sw, Math.floor((tx + 1) * tileW));
            lumHist.fill(0);
            var samples = 0;
            for (var py = yStart; py < yEnd; py += 3) {
              var rOff = py * sw;
              for (var px = xStart; px < xEnd; px += 3) {
                var pi = (rOff + px) * 4;
                var lVal = (0.299 * d[pi] + 0.587 * d[pi + 1] + 0.114 * d[pi + 2]) | 0;
                lumHist[lVal < 0 ? 0 : (lVal > 255 ? 255 : lVal)]++;
                samples++;
              }
            }
            // 82nd percentile luminance in tile represents local card background illumination
            var targetCount = samples * 0.82;
            var accL = 0, p82 = 215;
            for (var b = 0; b < 256; b++) {
              accL += lumHist[b];
              if (accL >= targetCount) { p82 = b; break; }
            }
            gridIllum[ty * gxCount + tx] = Math.max(130, Math.min(250, p82));
          }
        }

        // Smooth the 8x6 illumination grid
        var smoothIllum = new Float32Array(gxCount * gyCount);
        for (var sy = 0; sy < gyCount; sy++) {
          for (var sx = 0; sx < gxCount; sx++) {
            var sumI = 0, cntI = 0;
            for (var dy = -1; dy <= 1; dy++) {
              for (var dx = -1; dx <= 1; dx++) {
                var ny = sy + dy, nx = sx + dx;
                if (ny >= 0 && ny < gyCount && nx >= 0 && nx < gxCount) {
                  sumI += gridIllum[ny * gxCount + nx];
                  cntI++;
                }
              }
            }
            smoothIllum[sy * gxCount + sx] = sumI / cntI;
          }
        }

        for (var y0 = 0; y0 < sh; y0++) {
          var gyPos = Math.max(0, Math.min(gyCount - 1.001, (y0 / sh) * (gyCount - 1)));
          var gy0 = gyPos | 0, fy = gyPos - gy0;
          var rowOff0 = y0 * sw * 4;
          for (var x0 = 0; x0 < sw; x0++) {
            var gxPos = Math.max(0, Math.min(gxCount - 1.001, (x0 / sw) * (gxCount - 1)));
            var gx0 = gxPos | 0, fx = gxPos - gx0;
            var i00 = smoothIllum[gy0 * gxCount + gx0];
            var i10 = smoothIllum[gy0 * gxCount + gx0 + 1];
            var i01 = smoothIllum[(gy0 + 1) * gxCount + gx0];
            var i11 = smoothIllum[(gy0 + 1) * gxCount + gx0 + 1];
            var localWhite = i00 * (1 - fx) * (1 - fy) + i10 * fx * (1 - fy) + i01 * (1 - fx) * fy + i11 * fx * fy;
            var gain = 246 / Math.max(135, localWhite);

            var pIdx = rowOff0 + x0 * 4;
            var r = Math.min(255, d[pIdx] * gain);
            var g = Math.min(255, d[pIdx + 1] * gain);
            var b2 = Math.min(255, d[pIdx + 2] * gain);

            if (scanMode === 'magic') {
              for (var ch0 = 0; ch0 < 3; ch0++) {
                var v = ch0 === 0 ? r : (ch0 === 1 ? g : b2);
                if (v > 188) v = Math.min(255, Math.round(188 + (v - 188) * 1.32));
                else if (v < 90) v = Math.max(0, Math.round(v * 0.84));
                else v = Math.round(v);
                d[pIdx + ch0] = v;
              }
            } else if (scanMode === 'clean') {
              var lumC = 0.299 * r + 0.587 * g + 0.114 * b2;
              var chroma = Math.max(r, g, b2) - Math.min(r, g, b2);
              if (lumC > 165 && chroma < 42) {
                var tW = Math.min(1, (lumC - 165) / 52);
                d[pIdx]     = Math.round(r + (255 - r) * tW);
                d[pIdx + 1] = Math.round(g + (255 - g) * tW);
                d[pIdx + 2] = Math.round(b2 + (255 - b2) * tW);
              } else if (lumC < 98) {
                d[pIdx]     = Math.max(0, Math.round(r * 0.82));
                d[pIdx + 1] = Math.max(0, Math.round(g * 0.82));
                d[pIdx + 2] = Math.max(0, Math.round(b2 * 0.82));
              } else {
                d[pIdx]     = Math.round(r);
                d[pIdx + 1] = Math.round(g);
                d[pIdx + 2] = Math.round(b2);
              }
            } else if (scanMode === 'bw') {
              var lumBW = 0.299 * r + 0.587 * g + 0.114 * b2;
              var bwVal = lumBW > 168 ? 255 : (lumBW < 98 ? 0 : Math.round(((lumBW - 98) / 70) * 255));
              d[pIdx] = d[pIdx + 1] = d[pIdx + 2] = bwVal;
            }
          }
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
    setNidExportReady(false);
    $('#imgCombineSummary').textContent = 'প্রিভিউ তৈরি হচ্ছে…';
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

    var cardWInput = 660; // Default print width; the size controls have been removed.
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
    $('#nidPreviewPanel').style.setProperty('--nid-output-ratio', canvas.width / canvas.height);
    $('#nidPaperLabel').textContent = mode === 'nid-a4' || mode === 'nid-a4-side' ? 'A4 · 210 × 297 mm' : 'কার্ড লেআউট';
    $('#imgCombineOutMeta').textContent = canvas.width + ' × ' + canvas.height + ' px (300 DPI) • ' + fmtSize(blob.size);
    $('#imgCombineSummary').textContent = toBn(combineItems.length) + 'টি কার্ড • ' + toBn(copySets) + ' সেট • 300 DPI HD • ' + fmtSize(blob.size);
    setNidExportReady(true);
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
    on('imgCropAutoBtn', 'click', function () {
      if (!cropState) return;
      autoDetectCropSubjectBox();
      updateCropPreview();
      showToast('অটো-সিলেকশন ক্রপ সম্পন্ন হয়েছে!');
    });
    on('imgCropSnapBtn', 'click', function () {
      if (!cropState) return;
      snapCropBoxToEdges();
      updateCropPreview();
      showToast('নিকটস্থ বর্ডারে স্ন্যাপ করা হয়েছে!');
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
    setNidExportReady(false);
    $$('[data-nid-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchNidView(btn.getAttribute('data-nid-view'));
      });
    });
    wireDropzone($('#imgCombineDropzone'), $('#imgCombineInput'), addCombineFiles);
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
        renderCombineOutput();
      } catch (err) { showToast('ছবিটি লোড করা যায়নি'); }
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
      var det = autoDetectCardQuad(entry.item.img, entry.rot, entry.flipH || 1);
      entry.pts = det.pts;
      entry.autoDetected = true;
      positionNidQuadDOM({ snapped: true });
      triggerNidScanAnimation();
      renderCombineOutput();
      showToast('আইডি কার্ডের এজ অটো-ডিটেক্ট ও সোজা করা হয়েছে!');
    });
    on('nidSnapEdgesBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      pushNidHistory();
      snapCurrentQuadToNearestEdges(entry);
      entry.autoDetected = true;
      positionNidQuadDOM({ snapped: true });
      triggerNidScanAnimation();
      renderCombineOutput();
      showToast('কার্ডের ৪টি বর্ডার ও কোণায় ম্যাগনেটিক লক করা হয়েছে!');
    });
    on('nidTightenCropBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      pushNidHistory();
      adjustQuadMargin(entry, -0.012);
      positionNidQuadDOM({ snapped: true });
      renderCombineOutput();
      showToast('চারপাশের বর্ডার সামান্য টাইট করা হয়েছে');
    });
    on('nidExpandCropBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      pushNidHistory();
      adjustQuadMargin(entry, 0.012);
      positionNidQuadDOM({ snapped: true });
      renderCombineOutput();
      showToast('চারপাশের বর্ডার মার্জিন বাড়ানো হয়েছে');
    });
    on('nidMagSnapBtn', 'click', function () {
      nidMagSnapEnabled = !nidMagSnapEnabled;
      var btn = $('#nidMagSnapBtn');
      if (btn) {
        btn.setAttribute('aria-pressed', nidMagSnapEnabled ? 'true' : 'false');
        btn.classList.toggle('chip-btn--accent', nidMagSnapEnabled);
        var txtSpan = btn.querySelector('.nid-btn-txt');
        if (txtSpan) {
          txtSpan.textContent = nidMagSnapEnabled ? 'স্ন্যাপ: চালু' : 'স্ন্যাপ: বন্ধ';
        } else {
          btn.textContent = nidMagSnapEnabled ? 'স্ন্যাপ: চালু' : 'স্ন্যাপ: বন্ধ';
        }
      }
      showToast(nidMagSnapEnabled ? 'ম্যাগনেটিক এজ স্ন্যাপ চালু হয়েছে' : 'ম্যাগনেটিক এজ স্ন্যাপ বন্ধ করা হয়েছে');
    });
    on('nidSnapRatioBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      pushNidHistory();
      snapQuadToCardRatio(entry);
      positionNidQuadDOM();
      renderCombineOutput();
      showToast('আসল আইডি কার্ডের অনুপাত (85.6×54mm) সেট করা হয়েছে!');
    });
    on('nidFullCropBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      pushNidHistory();
      entry.pts = defaultQuadPts(0);
      entry.autoDetected = false;
      positionNidQuadDOM();
      renderCombineOutput();
    });
    on('nidRotLBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      pushNidHistory();
      entry.rot -= 90;
      var detL = autoDetectCardQuad(entry.item.img, entry.rot, entry.flipH || 1);
      entry.pts = detL.pts;
      drawNidCropSourceCanvas();
      renderCombineOutput();
    });
    on('nidRotRBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      pushNidHistory();
      entry.rot += 90;
      var detR = autoDetectCardQuad(entry.item.img, entry.rot, entry.flipH || 1);
      entry.pts = detR.pts;
      drawNidCropSourceCanvas();
      renderCombineOutput();
    });
    on('nidFlipHBtn', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      pushNidHistory();
      entry.flipH = (entry.flipH || 1) * -1;
      entry.pts = entry.pts.map(function (pt) { return { x: 1 - pt.x, y: pt.y }; });
      entry.pts = orderQuadClockwise(entry.pts);
      drawNidCropSourceCanvas();
      renderCombineOutput();
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
      renderCombineOutput();
    });
    on('nidFineAngleReset', 'click', function () {
      var entry = combineItems[activeNidIdx];
      if (!entry) return;
      entry.fineAngle = 0;
      syncNidDeskewControl();
      renderCombineOutput();
    });
    $$('input[name="imgCombineMode"], input[name="imgCombineScanMode"]').forEach(function (r) {
      r.addEventListener('change', renderCombineOutput);
    });
    ['imgCombineBright', 'imgCombineContrast', 'imgCombineSat', 'imgCombineSharp', 'imgCombineGap', 'imgCombineAlign', 'imgCombineCopies', 'imgCombineBg', 'imgCombineRoundCorner', 'imgCombineCardBorder', 'imgCombineCutMarks'].forEach(function (id) {
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
      clearNidHistory();
      combineItems.reverse();
      activeNidIdx = 0;
      renderNidCardTabs();
      syncNidDeskewControl();
      drawNidCropSourceCanvas();
      renderCombineOutput();
    });
    on('imgCombineClearBtn', 'click', function () {
      combineToken++;
      if (combineOut.url) URL.revokeObjectURL(combineOut.url);
      combineOut = {};
      setNidExportReady(false);
      switchNidView('edit');
      combineItems = [];
      activeNidIdx = 0;
      nidUndoStack = [];
      nidRedoStack = [];
      updateNidHistoryButtons();
      setNidCanvasZoom(1);
      nidFitMode = true;
      nidPan = { x: 0, y: 0 };
      nidSpaceHeld = false;
      setNidHandTool(false);
      if ($('#nidCardTabs')) $('#nidCardTabs').innerHTML = '';
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
