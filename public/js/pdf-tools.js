/*!
 * TechHat PDF Studio — Client-Side iLovePDF Suite
 * Features:
 *   1. Merge PDF  — PDF + JPG/PNG/Word/PowerPoint/Excel/Text → one PDF, drag-to-reorder, per-file & per-page rotate,
 *                   multi-page viewer for every file
 *   2. Split PDF  — custom ranges / burst, per-page rotate
 *   3. Compress   — size + before/after quality preview, manual download, per-page rotate
 *   4. Organize   — drag-to-reorder, rotate, duplicate, blank page, delete, page numbers, watermark
 *   5. PDF → JPG / PNG / Word / Text (with rotation)
 *   6. Images / Office / Text → PDF
 * Requires: vendor/pdf-lib.min.js, vendor/pdf.min.js (lazy-loaded), vendor/jszip.min.js, js/pdf-convert.js
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var bDig = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  function toBn(n) { return String(n).replace(/\d/g, function (d) { return bDig[d]; }); }
  function isEn() { return document.documentElement.getAttribute('data-lang') === 'en'; }
  function tr(bn, en) { return isEn() ? en : bn; }
  function fmtN(n) { return isEn() ? String(n) : toBn(n); }
  function fmtSize(bytes) {
    if (!bytes || bytes <= 0) return '0 KB';
    var kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(kb < 10 ? 1 : 0) + ' KB';
    return (kb / 1024).toFixed(2) + ' MB';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function baseName(filename) { return String(filename || 'document').replace(/\.[^.]+$/, ''); }
  function C() { return window.TechHatPDFConvert; }

  function showToast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(showToast._tid);
    showToast._tid = setTimeout(function () { t.hidden = true; }, 3400);
  }

  function setProgress(pct, text) {
    var wrap = $('#pdfProgressWrap');
    if (!wrap) return;
    if (pct === null || pct === undefined) { wrap.hidden = true; return; }
    wrap.hidden = false;
    var v = Math.max(0, Math.min(100, Math.round(pct)));
    $('#pdfProgressBar').style.width = v + '%';
    if (text) $('#pdfProgressText').textContent = text;
    $('#pdfProgressPct').textContent = toBn(v) + '%';
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);
  }

  function dataUrlToUint8(dataUrl) {
    var bin = atob(dataUrl.split(',')[1] || '');
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  function readFileArrayBuffer(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(new Error('ফাইল পড়া যায়নি')); };
      r.readAsArrayBuffer(file);
    });
  }
  function readFileDataURL(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(new Error('ফাইল পড়া যায়নি')); };
      r.readAsDataURL(file);
    });
  }
  function isPdfFile(f) { return /\.pdf$/i.test(f.name) || f.type === 'application/pdf'; }

  /* ==================================================================
   * LAZY LOADER FOR PDF-LIB & PDF.JS
   * ================================================================== */
  var assetBase = (function () {
    var s = document.querySelector('script[src*="pdf-tools.js"]');
    if (s && s.src) return s.src.replace(/js\/pdf-tools\.js(?:\?.*)?$/, '');
    return '/';
  })();
  var libsPromise = null;
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(s);
    });
  }
  function ensurePdfLibs() {
    var workerUrl = assetBase + 'vendor/pdf.worker.min.js';
    if (window.PDFLib && window.pdfjsLib) {
      if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      return Promise.resolve();
    }
    if (libsPromise) return libsPromise;
    libsPromise = Promise.all([
      window.PDFLib ? Promise.resolve() : loadScript(assetBase + 'vendor/pdf-lib.min.js'),
      window.pdfjsLib ? Promise.resolve() : loadScript(assetBase + 'vendor/pdf.min.js')
    ]).then(function () {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    }).catch(function (err) {
      libsPromise = null;
      showToast('PDF লাইব্রেরি লোড করতে সমস্যা হয়েছে।');
      throw err;
    });
    return libsPromise;
  }

  /* ==================================================================
   * DOCUMENT & PAGE MODEL
   *   doc  = { id, name, buffer(ArrayBuffer), pdfjs, numPages, thumbs:{idx:Promise}, thumbUrls:{idx:url} }
   *   page = { key, doc, idx(0-based), rotation(extra deg), isBlank, w, h, imgUrl? }
   * ================================================================== */
  var docSeq = 1, pageSeq = 1;

  function promptPdfPassword(fileName, isRetry) {
    return new Promise(function (resolve) {
      var dlg = $('#pdfPasswordDialog');
      if (!dlg) {
        dlg = document.createElement('dialog');
        dlg.id = 'pdfPasswordDialog';
        dlg.className = 'pdf-dialog m-auto w-[min(420px,calc(100vw-24px))] rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border p-5 text-slate-900 dark:text-studio-text shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-xs';
        dlg.innerHTML =
          '<form id="pdfPwdForm" class="space-y-4">' +
            '<div class="flex items-start gap-3">' +
              '<div class="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">' +
                '<svg class="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
              '</div>' +
              '<div class="min-w-0 flex-1">' +
                '<h3 class="text-base font-bold m-0 leading-snug" id="pdfPwdTitle"></h3>' +
                '<p class="text-xs text-slate-500 dark:text-studio-muted mt-0.5 mb-0 truncate font-medium" id="pdfPwdFile"></p>' +
              '</div>' +
            '</div>' +
            '<p class="text-xs text-slate-600 dark:text-studio-muted m-0 leading-relaxed" id="pdfPwdDesc"></p>' +
            '<div id="pdfPwdError" class="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold" hidden></div>' +
            '<div class="relative">' +
              '<input type="password" id="pdfPwdInput" class="w-full h-10 pl-3.5 pr-10 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-300 dark:border-studio-border text-sm text-slate-900 dark:text-studio-text focus:border-emerald-500 outline-none transition-colors" autocomplete="off" />' +
              '<button type="button" id="pdfPwdToggle" class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-studio-text flex items-center justify-center cursor-pointer bg-transparent border-0" aria-label="Toggle password visibility">' +
                '<svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>' +
              '</button>' +
            '</div>' +
            '<div class="flex items-center justify-end gap-2 pt-1">' +
              '<button type="button" id="pdfPwdCancel" class="chip-btn h-9 px-4 rounded-xl bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-slate-200/70 transition-colors"></button>' +
              '<button type="submit" id="pdfPwdSubmit" class="btn btn--primary h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border-0 cursor-pointer transition-colors"></button>' +
            '</div>' +
          '</form>';
        document.body.appendChild(dlg);
        var toggleBtn = $('#pdfPwdToggle', dlg);
        if (toggleBtn) {
          toggleBtn.addEventListener('click', function () {
            var inp = $('#pdfPwdInput', dlg);
            if (!inp) return;
            inp.type = inp.type === 'password' ? 'text' : 'password';
            inp.focus();
          });
        }
      }

      var titleEl = $('#pdfPwdTitle', dlg);
      var fileEl = $('#pdfPwdFile', dlg);
      var descEl = $('#pdfPwdDesc', dlg);
      var errEl = $('#pdfPwdError', dlg);
      var inputEl = $('#pdfPwdInput', dlg);
      var cancelBtn = $('#pdfPwdCancel', dlg);
      var submitBtn = $('#pdfPwdSubmit', dlg);
      var formEl = $('#pdfPwdForm', dlg);

      titleEl.textContent = tr('পাসওয়ার্ড সংরক্ষিত PDF', 'Password Protected PDF');
      fileEl.textContent = fileName || '';
      descEl.textContent = tr('এই PDF ফাইলটি খুলতে পাসওয়ার্ড প্রয়োজন। আনলক করার পর ডাউনলোড করা ফাইলে আর পাসওয়ার্ড থাকবে না।', 'This PDF requires a password to open. The output file will be unlocked.');
      errEl.textContent = tr('পাসওয়ার্ড সঠিক নয়, অনুগ্রহ করে আবার চেষ্টা করুন।', 'Incorrect password, please try again.');
      errEl.hidden = !isRetry;
      inputEl.placeholder = tr('পাসওয়ার্ড লিখুন…', 'Enter PDF password…');
      inputEl.type = 'password';
      inputEl.value = '';
      cancelBtn.textContent = tr('বাতিল', 'Cancel');
      submitBtn.textContent = tr('আনলক করুন', 'Unlock PDF');

      var settled = false;
      function finish(val) {
        if (settled) return;
        settled = true;
        formEl.removeEventListener('submit', onSubmit);
        cancelBtn.removeEventListener('click', onCancel);
        dlg.removeEventListener('cancel', onCancel);
        closeDialog(dlg);
        resolve(val);
      }
      function onSubmit(e) {
        e.preventDefault();
        var v = inputEl.value;
        if (!v) { inputEl.focus(); return; }
        finish(v);
      }
      function onCancel(e) {
        if (e) e.preventDefault();
        finish(null);
      }

      formEl.addEventListener('submit', onSubmit);
      cancelBtn.addEventListener('click', onCancel);
      dlg.addEventListener('cancel', onCancel);
      openDialog(dlg);
      setTimeout(function () { inputEl.focus(); }, 40);
    });
  }

  function openPdfDoc(bytes, name, password) {
    var buffer = bytes instanceof ArrayBuffer ? bytes : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    var params = { data: new Uint8Array(buffer.slice(0)) };
    if (password) params.password = password;
    return window.pdfjsLib.getDocument(params).promise.then(function (pdfjs) {
      return { id: docSeq++, name: name, buffer: buffer, password: password || '', pdfjs: pdfjs, numPages: pdfjs.numPages, thumbs: {}, thumbUrls: {} };
    }).catch(function (err) {
      if (err && (err.name === 'PasswordException' || /password/i.test(err.message || ''))) {
        var isWrong = err.code === 2 || Boolean(password);
        return promptPdfPassword(name, isWrong).then(function (pw) {
          if (pw === null) throw new Error(tr(name + ' — পাসওয়ার্ড না দেওয়ায় ফাইলটি বাদ দেওয়া হয়েছে', name + ' — Skipped (password required)'));
          return openPdfDoc(buffer, name, pw);
        });
      }
      throw new Error(name + ' — ফাইলটি পড়া যায়নি (ত্রুটিযুক্ত PDF)');
    });
  }

  function makePages(doc) {
    var arr = [];
    for (var i = 0; i < doc.numPages; i++) arr.push({ key: 'p' + (pageSeq++), doc: doc, idx: i, rotation: 0 });
    return arr;
  }
  function clonePage(p) {
    var c = {};
    for (var k in p) c[k] = p[k];
    c.key = 'p' + (pageSeq++);
    return c;
  }

  function renderPageCanvas(doc, pageNum, opt) {
    return doc.pdfjs.getPage(pageNum).then(function (page) {
      var rot = (((page.rotate || 0) + (opt.rotation || 0)) % 360 + 360) % 360;
      var vp1 = page.getViewport({ scale: 1, rotation: rot });
      var scale = opt.width ? opt.width / vp1.width : (opt.scale || 1);
      var vp = page.getViewport({ scale: scale, rotation: rot });
      var canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(vp.width));
      canvas.height = Math.max(1, Math.floor(vp.height));
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
        return { canvas: canvas, ptW: vp1.width, ptH: vp1.height };
      });
    });
  }

  // Thumbnail queue (max 2 concurrent renders) + lazy loading via IntersectionObserver
  var thumbQueue = [], thumbBusy = 0;
  function enqueue(task) {
    return new Promise(function (resolve, reject) {
      thumbQueue.push({ task: task, resolve: resolve, reject: reject });
      pump();
    });
  }
  function pump() {
    while (thumbBusy < 2 && thumbQueue.length) {
      var job = thumbQueue.shift();
      thumbBusy++;
      job.task().then(job.resolve, job.reject).then(function () { thumbBusy--; pump(); });
    }
  }
  function docThumb(doc, idx) {
    if (!doc.thumbs[idx]) {
      doc.thumbs[idx] = enqueue(function () {
        var targetW = Math.min(600, Math.max(420, Math.round(280 * (window.devicePixelRatio || 1.5))));
        return renderPageCanvas(doc, idx + 1, { width: targetW }).then(function (r) {
          var url = r.canvas.toDataURL('image/jpeg', 0.88);
          doc.thumbUrls[idx] = url;
          return url;
        });
      });
    }
    return doc.thumbs[idx];
  }
  function cachedThumb(p) {
    if (p.imgUrl) return p.imgUrl;
    if (p.doc && p.doc.thumbUrls[p.idx]) return p.doc.thumbUrls[p.idx];
    return null;
  }
  function loadThumbInto(img) {
    var p = img._page;
    if (!p || p.isBlank || !p.doc) return;
    docThumb(p.doc, p.idx).then(function (url) {
      img.src = url;
      var wrap = img.closest('.pdf-page-card__thumb-wrap');
      if (wrap) wrap.classList.remove('is-loading');
    }).catch(function () {});
  }
  var thumbObserver = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        thumbObserver.unobserve(en.target);
        loadThumbInto(en.target);
      }
    });
  }, { rootMargin: '300px 0px' }) : null;

  function rotStyle(deg) {
    deg = ((deg % 360) + 360) % 360;
    if (deg === 0) return '';
    return 'transform:rotate(' + deg + 'deg)' + (deg % 180 ? ' scale(.72)' : '') + ';';
  }

  /* ==================================================================
   * GENERIC PAGE / FILE CARD GRID (rotate, delete, zoom, select, drag-sort)
   * ================================================================== */
  var ACTIONS = {
    left: {
      label: '<svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
      title: 'বামে সরান',
      titleEn: 'Move Left'
    },
    right: {
      label: '<svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
      title: 'ডানে সরান',
      titleEn: 'Move Right'
    },
    rotL: {
      label: '<svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
      title: 'বামে ঘোরান',
      titleEn: 'Rotate Left'
    },
    rotR: {
      label: '<svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>',
      title: 'ডানে ঘোরান',
      titleEn: 'Rotate Right'
    },
    zoom: {
      label: '<svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
      title: 'বড় করে দেখুন',
      titleEn: 'Preview'
    },
    dup: {
      label: '<svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><rect width="13" height="13" x="9" y="9" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
      title: 'ডুপ্লিকেট',
      titleEn: 'Duplicate'
    },
    del: {
      label: '<svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
      title: 'মুছুন',
      titleEn: 'Remove',
      cls: 'pdf-mini-btn--del hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/10'
    }
  };

  /**
   * opts: { items, thumbOf(item)->page, label(item,i), meta(item,i), badge(item,i), actions(item,i)->[...],
   *         selectable, isSelected(item), onSelect(i), onAction(act,i), sortable, onReorder(order), multi(item), addMoreFor }
   */
  function renderGrid(grid, opts) {
    grid._opts = opts;
    installGridEvents(grid);
    var frag = document.createDocumentFragment();
    opts.items.forEach(function (item, i) {
      var page = opts.thumbOf ? opts.thumbOf(item) : item;
      var sel = opts.selectable && opts.isSelected(item);
      var card = document.createElement('div');
      card.className = 'pdf-page-card group relative flex flex-col rounded-xl bg-white dark:bg-studio-sidebar border p-2.5 shadow-2xs hover:shadow-md transition-all duration-150 hover:border-emerald-500/70' +
        (opts.selectable ? ' pdf-page-card--selectable cursor-pointer' : '') +
        (sel ? ' is-selected border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20' : ' border-slate-200/90 dark:border-studio-border') +
        (opts.sortable ? ' pdf-page-card--sortable' : '') +
        (opts.multi && opts.multi(item) ? ' is-multi' : '');
      card.dataset.idx = i;
      if (opts.selectable) {
        card.setAttribute('role', 'checkbox');
        card.setAttribute('aria-checked', sel ? 'true' : 'false');
        card.tabIndex = 0;
      }
      var acts = opts.actions ? opts.actions(item, i) : [];
      var cached = page ? cachedThumb(page) : null;
      var topOverlays = '';
      if (opts.sortable) {
        topOverlays += '<span class="pdf-drag-handle absolute top-2 right-2 z-10 w-7 h-7 rounded-md bg-slate-900/75 backdrop-blur-xs text-white inline-flex items-center justify-center cursor-grab active:cursor-grabbing shadow-xs hover:bg-slate-900 transition-colors" tabindex="0" role="button" aria-label="' + tr('ক্রম পরিবর্তন করতে টেনে আনুন', 'Drag to reorder') + '" title="' + tr('ড্র্যাগ করে সরান', 'Drag to reorder') + '"><svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg></span>';
      }
      topOverlays += '<div class="pdf-page-card__badge absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs">' + (opts.badge ? opts.badge(item, i) : '#' + fmtN(i + 1)) +
        (page && page.rotation ? ' <span class="pdf-rot-pill px-1.5 py-0.25 rounded bg-emerald-500 text-slate-950 text-[11px] font-extrabold">' + fmtN(((page.rotation % 360) + 360) % 360) + '°</span>' : '') + '</div>';
      if (opts.selectable) {
        topOverlays += '<div class="pdf-page-card__check absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 inline-flex items-center justify-center shadow-xs transition-colors ' + (sel ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 bg-white/95 dark:bg-studio-sidebar/95 text-transparent') + '" aria-hidden="true">' + (sel ? '<svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.8]" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>' : '') + '</div>';
      }

      var quickOverlay = '';
      if (!opts.selectable) {
        quickOverlay = '<div class="pdf-page-card__quick-zoom absolute inset-0 z-10 flex items-center justify-center bg-slate-900/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg">' +
          '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-bold shadow-md transform translate-y-1 group-hover:translate-y-0 transition-transform">' +
          '<svg class="w-3 h-3 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
          '<span>' + tr('প্রিভিউ', 'Preview') + '</span></span></div>';
      }

      var html = '';
      var thumbCursor = opts.selectable ? ' cursor-pointer' : ' cursor-zoom-in';
      if (page && page.isBlank) {
        html += '<div class="pdf-page-card__thumb-wrap relative aspect-[3/4] rounded-lg bg-slate-100/90 dark:bg-studio-panel border border-slate-200/70 dark:border-studio-border/60 overflow-hidden flex items-center justify-center p-3 mb-2.5' + thumbCursor + '">' + topOverlays + quickOverlay + '<div class="pdf-blank-thumb w-3/4 h-4/5 rounded border border-dashed border-slate-300 dark:border-slate-600 bg-white flex items-center justify-center text-xs text-slate-400 font-semibold shadow-xs" style="' + rotStyle(page.rotation || 0) + '">' + tr('সাদা পৃষ্ঠা', 'Blank Page') + '</div></div>';
      } else {
        html += '<div class="pdf-page-card__thumb-wrap relative aspect-[3/4] rounded-lg bg-slate-100/90 dark:bg-studio-panel border border-slate-200/70 dark:border-studio-border/60 overflow-hidden flex items-center justify-center p-2.5 mb-2.5' + thumbCursor + (cached ? '' : ' is-loading') + '">' + topOverlays + quickOverlay + '<img class="pdf-page-card__thumb max-w-full max-h-full object-contain rounded-xs bg-white shadow-sm ring-1 ring-slate-900/10 dark:ring-white/10 transition-transform duration-200" alt="" draggable="false" decoding="async" style="' +
          rotStyle(page ? page.rotation || 0 : 0) + '"' + (cached ? ' src="' + cached + '"' : '') + '></div>';
      }
      html += '<div class="pdf-page-card__title text-xs font-bold text-slate-800 dark:text-studio-text truncate leading-snug" title="' + esc(opts.label(item, i)) + '">' + esc(opts.label(item, i)) + '</div>';
      if (opts.meta) html += '<div class="pdf-page-card__meta text-xs font-medium text-slate-500 dark:text-studio-muted truncate mt-0.5">' + opts.meta(item, i) + '</div>';
      if (acts.length) {
        html += '<div class="pdf-page-card__tools flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-slate-100 dark:border-studio-border">' + acts.map(function (a) {
          var def = typeof a === 'string' ? ACTIONS[a] : a;
          var act = typeof a === 'string' ? a : a.act;
          var disabled = (act === 'left' && i === 0) || (act === 'right' && i === opts.items.length - 1);
          var tip = isEn() && def.titleEn ? def.titleEn : def.title;
          return '<button type="button" class="pdf-mini-btn flex-1 min-w-7 h-8 px-1.5 rounded-lg bg-slate-100/90 dark:bg-studio-panel border border-slate-200/80 dark:border-studio-border text-xs font-bold text-slate-700 dark:text-studio-text hover:bg-white dark:hover:bg-studio-surface hover:border-emerald-500 inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all ' + (def.cls || '') + '" data-act="' + act + '" title="' + tip + '" aria-label="' + tip + '"' + (disabled ? ' disabled' : '') + '>' + def.label + '</button>';
        }).join('') + '</div>';
      }
      card.innerHTML = html;
      var img = card.querySelector('img.pdf-page-card__thumb');
      if (img && !cached && page) {
        img._page = page;
        if (thumbObserver) thumbObserver.observe(img); else loadThumbInto(img);
      }
      frag.appendChild(card);
    });

    if (opts.addMoreFor) {
      var addCard = document.createElement('label');
      addCard.setAttribute('for', opts.addMoreFor);
      addCard.className = 'group flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-white/50 dark:bg-studio-sidebar/40 hover:border-emerald-500 hover:bg-emerald-500/[0.04] p-4 min-h-[220px] cursor-pointer transition-all';
      addCard.innerHTML =
        '<div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">' +
          '<svg class="w-5.5 h-5.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>' +
        '</div>' +
        '<span class="text-sm font-bold text-slate-800 dark:text-studio-text">' + tr('আরও ফাইল যোগ করুন', 'Add More Files') + '</span>' +
        '<span class="text-xs text-slate-400 dark:text-studio-muted mt-0.5">' + tr('ক্লিক বা ড্রপ করুন', 'Click or drop here') + '</span>';
      frag.appendChild(addCard);
    }

    grid.innerHTML = '';
    grid.appendChild(frag);
  }

  function installGridEvents(grid) {
    if (grid._installed) return;
    grid._installed = true;
    grid.addEventListener('click', function (e) {
      if (grid._justDragged) return;
      var o = grid._opts;
      var card = e.target.closest('.pdf-page-card');
      if (!o || !card) return;
      var idx = +card.dataset.idx;
      var btn = e.target.closest('[data-act]');
      if (btn) {
        if (!btn.disabled && o.onAction) o.onAction(btn.getAttribute('data-act'), idx);
        return;
      }
      if (e.target.closest('.pdf-drag-handle')) return;
      if (o.selectable && o.onSelect) o.onSelect(idx);
      else if (o.onAction && !e.target.closest('a')) o.onAction('zoom', idx);
    });
    grid.addEventListener('keydown', function (e) {
      var o = grid._opts;
      if (!o) return;
      var card = e.target.closest('.pdf-page-card');
      if (!card) return;
      var idx = +card.dataset.idx;
      if (e.target.classList.contains('pdf-drag-handle') && o.sortable) {
        var delta = (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : ((e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : 0);
        if (!delta) return;
        e.preventDefault();
        var to = idx + delta;
        if (to < 0 || to >= o.items.length) return;
        var order = o.items.map(function (_, i) { return i; });
        order.splice(idx, 1);
        order.splice(to, 0, idx);
        o.onReorder(order);
        var h = grid.children[to] && grid.children[to].querySelector('.pdf-drag-handle');
        if (h) h.focus();
        return;
      }
      if (o.selectable && e.target === card && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        o.onSelect(idx);
      }
    });
    grid.addEventListener('dragstart', function (e) { e.preventDefault(); });
    enableSortable(grid);
  }

  /** Pointer-events based drag-to-reorder (mouse anywhere on the card, touch via the drag handle). */
  function enableSortable(grid) {
    var drag = null;
    grid.addEventListener('pointerdown', function (e) {
      var o = grid._opts;
      if (!o || !o.sortable || e.button !== 0) return;
      if (e.target.closest('button, input, select, textarea, a')) return;
      var card = e.target.closest('.pdf-page-card');
      if (!card || card.parentNode !== grid) return;
      var onHandle = !!e.target.closest('.pdf-drag-handle');
      if (e.pointerType === 'touch' && !onHandle) return;
      var r = card.getBoundingClientRect();
      drag = { card: card, id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, active: false };
      if (onHandle) e.preventDefault();
    });

    function onMove(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var card = drag.card;
      if (!drag.active) {
        if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) < 6) return;
        drag.active = true;
        card.classList.add('is-dragging');
        grid.classList.add('is-sorting');
        document.documentElement.classList.add('pdf-no-select');
      }
      e.preventDefault();
      card.style.transform = 'none';
      var r = card.getBoundingClientRect();
      card.style.transform = 'translate(' + (e.clientX - drag.ox - r.left) + 'px,' + (e.clientY - drag.oy - r.top) + 'px) scale(1.04)';

      card.style.visibility = 'hidden';
      var el = document.elementFromPoint(e.clientX, e.clientY);
      card.style.visibility = '';
      var over = el && el.closest ? el.closest('.pdf-page-card') : null;
      if (over && over !== card && over.parentNode === grid) {
        var kidsArr = Array.prototype.indexOf.call(grid.children, over) > Array.prototype.indexOf.call(grid.children, card);
        grid.insertBefore(card, kidsArr ? over.nextSibling : over);
      }
      // Auto-scroll the grid (it has its own scrollbar) and the window near the edges
      var gr = grid.getBoundingClientRect();
      if (e.clientY < gr.top + 40) grid.scrollTop -= 14;
      else if (e.clientY > gr.bottom - 40) grid.scrollTop += 14;
      if (e.clientY < 60) window.scrollBy(0, -14);
      else if (e.clientY > window.innerHeight - 60) window.scrollBy(0, 14);
    }

    function onUp(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag;
      drag = null;
      if (!d.active) return;
      d.card.classList.remove('is-dragging');
      d.card.style.transform = '';
      grid.classList.remove('is-sorting');
      document.documentElement.classList.remove('pdf-no-select');
      grid._justDragged = true;
      setTimeout(function () { grid._justDragged = false; }, 60);
      var order = Array.prototype.filter.call(grid.children, function (c) { return c.classList.contains('pdf-page-card'); })
        .map(function (c) { return +c.dataset.idx; });
      var changed = order.some(function (v, i) { return v !== i; });
      if (changed && grid._opts && grid._opts.onReorder) grid._opts.onReorder(order);
    }

    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  }

  function reorderArray(arr, order) {
    return order.map(function (i) { return arr[i]; });
  }
  function rotatePage(p, delta) { p.rotation = (((p.rotation || 0) + delta) % 360 + 360) % 360; }

  /* ==================================================================
   * DIALOGS: per-file page viewer & large preview / compare
   * ================================================================== */
  function setupDialog(dlg) {
    if (!dlg || dlg._setup) return;
    dlg._setup = true;
    // Light-dismiss fallback for browsers without <dialog closedby>
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

  // ---- Large preview ----
  var preview = { total: 0, cur: 1, zoom: 100, render: null, token: 0 };
  function computeBaseFitWidth(img, stage) {
    var box = (stage && stage.parentElement) || stage;
    var maxW = Math.max(240, (box ? box.clientWidth : 800) - 36);
    var maxH = Math.max(240, (box ? box.clientHeight : 520) - 56);
    if ( stage && stage.classList.contains('is-compare') && maxW > 640 ) {
      maxW = Math.floor((maxW - 24) / 2);
    }
    var nw = img.naturalWidth || img.clientWidth || 595;
    var nh = img.naturalHeight || img.clientHeight || 842;
    var fitScale = Math.min(maxW / nw, maxH / nh);
    return Math.max(120, Math.round(nw * fitScale));
  }
  function applyPreviewZoom(z) {
    preview.zoom = Math.max(50, Math.min(300, Math.round(z || 100)));
    var resetBtn = $('#pdfPreviewZoomReset');
    var outBtn = $('#pdfPreviewZoomOut');
    var inBtn = $('#pdfPreviewZoomIn');
    if (resetBtn) resetBtn.textContent = fmtN(preview.zoom) + '%';
    if (outBtn) outBtn.disabled = preview.zoom <= 50;
    if (inBtn) inBtn.disabled = preview.zoom >= 300;
    var stage = $('#pdfPreviewStage');
    if (!stage) return;
    $$('figure.pdf-preview-fig', stage).forEach(function (fig) {
      fig.classList.toggle('is-zoomed', preview.zoom > 100);
      var img = fig.querySelector('img.pdf-preview-img');
      if (!img) return;
      if (!img._baseW && img.naturalWidth > 0) {
        img._baseW = computeBaseFitWidth(img, stage);
      }
      var baseW = img._baseW || 420;
      img.style.width = Math.round(baseW * (preview.zoom / 100)) + 'px';
      img.style.maxWidth = 'none';
      img.style.maxHeight = 'none';
      img.classList.toggle('cursor-zoom-in', preview.zoom <= 100);
      img.classList.toggle('cursor-zoom-out', preview.zoom > 100);
    });
  }
  function openPreview(title, sub, total, start, renderFn) {
    preview.total = total;
    preview.cur = Math.max(1, Math.min(total, start || 1));
    preview.zoom = 100;
    preview.render = renderFn;
    $('#pdfPreviewTitle').textContent = title;
    $('#pdfPreviewSub').textContent = sub || '';
    openDialog($('#pdfPreviewDialog'));
    showPreviewPage();
  }
  function showPreviewPage() {
    var stage = $('#pdfPreviewStage');
    $('#pdfPreviewCounter').textContent = fmtN(preview.cur) + ' / ' + fmtN(preview.total);
    $('#pdfPreviewPrev').disabled = preview.cur <= 1;
    $('#pdfPreviewNext').disabled = preview.cur >= preview.total;
    applyPreviewZoom(preview.zoom || 100);
    stage.innerHTML = '<div class="pdf-preview-loading py-16 flex flex-col items-center justify-center gap-3 text-xs font-semibold text-slate-500 dark:text-studio-muted">' +
      '<svg class="w-8 h-8 text-emerald-600 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>' +
      '<span>' + tr('প্রিভিউ তৈরি হচ্ছে…', 'Rendering preview…') + '</span></div>';
    var token = ++preview.token;
    preview.render(preview.cur).then(function (list) {
      if (token !== preview.token) return;
      stage.classList.toggle('is-compare', list.length > 1);
      stage.innerHTML = list.map(function (it) {
        return '<figure class="pdf-preview-fig m-0 flex flex-col items-center gap-2.5"><figcaption class="text-xs font-bold text-slate-700 dark:text-studio-text">' + it.label + '</figcaption>' +
          '<img class="pdf-preview-img block h-auto object-contain rounded-md shadow-2xl ring-1 ring-slate-900/10 dark:ring-white/10 bg-white cursor-zoom-in transition-[width] duration-150" src="' + it.url + '" alt="' + esc(it.label.replace(/<[^>]+>/g, '')) + '" title="' + tr('ক্লিক করে জুম ইন/আউট করুন', 'Click to zoom in/out') + '"></figure>';
      }).join('');
      $$('img.pdf-preview-img', stage).forEach(function (img) {
        var onReady = function () {
          img._baseW = computeBaseFitWidth(img, stage);
          applyPreviewZoom(preview.zoom || 100);
        };
        if (img.complete && img.naturalWidth > 0) onReady();
        else img.addEventListener('load', onReady, { once: true });
      });
    }).catch(function () {
      if (token === preview.token) stage.innerHTML = '<div class="pdf-preview-loading py-12 text-center text-xs font-semibold text-slate-500 dark:text-studio-muted">' + tr('প্রিভিউ তৈরি করা যায়নি', 'Could not render preview') + '</div>';
    });
  }

  function pageImageUrl(p, width) {
    if (p.isBlank) {
      var c = document.createElement('canvas');
      var swap = (p.rotation || 0) % 180 !== 0;
      var ratio = (p.h || 842) / (p.w || 595);
      c.width = width;
      c.height = Math.round(width * (swap ? 1 / ratio : ratio));
      var cx = c.getContext('2d');
      cx.fillStyle = '#fff';
      cx.fillRect(0, 0, c.width, c.height);
      return Promise.resolve(c.toDataURL('image/png'));
    }
    if (p.imgUrl) {
      return rasterizeImage(p.imgUrl, p.rotation || 0, 0.9).then(function (r) { return r.dataUrl; });
    }
    return renderPageCanvas(p.doc, p.idx + 1, { width: width, rotation: p.rotation || 0 }).then(function (r) {
      return r.canvas.toDataURL('image/jpeg', 0.9);
    });
  }

  function previewPages(pages, title, start) {
    openPreview(title, tr('ঘোরানো (Rotate) অবস্থাসহ প্রিভিউ', 'Preview with current rotation'), pages.length, start + 1, function (n) {
      var p = pages[n - 1];
      return pageImageUrl(p, 1100).then(function (url) { return [{ label: tr('পৃষ্ঠা ', 'Page ') + fmtN(n), url: url }]; });
    });
  }

  // ---- Merge per-file page viewer ----
  var pagesDlgItem = null;
  function openPagesDialog(item) {
    pagesDlgItem = item;
    $('#pdfPagesDialogTitle').textContent = item.name;
    renderPagesDialog();
    openDialog($('#pdfPagesDialog'));
  }
  function renderPagesDialog() {
    var item = pagesDlgItem;
    if (!item) return;
    $('#pdfPagesDialogSub').textContent = isEn()
      ? fmtN(item.pages.length) + (item.pages.length === 1 ? ' page' : ' pages') + ' • Drag to reorder, rotate, or remove pages'
      : 'মোট ' + fmtN(item.pages.length) + ' পৃষ্ঠা • ড্র্যাগ করে সাজান, ঘোরান বা অপ্রয়োজনীয় পৃষ্ঠা মুছুন';
    renderGrid($('#pdfPagesDialogGrid'), {
      items: item.pages,
      label: function (p) { return tr('পৃষ্ঠা ', 'Page ') + fmtN(p.idx + 1); },
      actions: function () { return ['rotL', 'rotR', 'zoom', 'del']; },
      sortable: true,
      onReorder: function (order) { item.pages = reorderArray(item.pages, order); renderPagesDialog(); },
      onAction: function (act, i) {
        var p = item.pages[i];
        if (act === 'rotL') rotatePage(p, -90);
        else if (act === 'rotR') rotatePage(p, 90);
        else if (act === 'zoom') { previewPages(item.pages, item.name, i); return; }
        else if (act === 'del') {
          if (item.pages.length <= 1) { showToast(tr('শেষ পৃষ্ঠা মোছা যাবে না — পুরো ফাইল সরাতে কার্ডের ডিলিট বাটন ব্যবহার করুন।', 'Cannot delete the last page — use the remove button on the main card to delete the file.')); return; }
          item.pages.splice(i, 1);
        }
        renderPagesDialog();
      }
    });
  }

  /* ==================================================================
   * PDF STANDARD SECURITY DECRYPTOR (RC4 40..128-bit V1/V2/V4) + FALLBACK
   * ================================================================== */
  var PDF_ENC_PAD = new Uint8Array([
    0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41,
    0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08,
    0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68, 0x3E, 0x80,
    0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A
  ]);

  function md5Bytes(input) {
    var data = input instanceof Uint8Array ? input : new Uint8Array(input);
    var len = data.length;
    var bitLenLo = (len << 3) >>> 0;
    var bitLenHi = (len >>> 29) >>> 0;
    var padLen = (((len + 8) >>> 6) << 4) + 16;
    var words = new Int32Array(padLen);
    for (var i = 0; i < len; i++) {
      words[i >> 2] |= data[i] << ((i & 3) << 3);
    }
    words[len >> 2] |= 0x80 << ((len & 3) << 3);
    words[padLen - 2] = bitLenLo;
    words[padLen - 1] = bitLenHi;

    var K = md5Bytes._K, S = md5Bytes._S;
    if (!K) {
      K = md5Bytes._K = new Int32Array(64);
      for (var j = 0; j < 64; j++) K[j] = (Math.floor(Math.abs(Math.sin(j + 1)) * 4294967296)) | 0;
      S = md5Bytes._S = [
        7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
        5, 9,14,20,5, 9,14,20,5, 9,14,20,5, 9,14,20,
        4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
        6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21
      ];
    }

    var a0 = 0x67452301 | 0, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476 | 0;
    for (var off = 0; off < padLen; off += 16) {
      var A = a0, B = b0, C = c0, D = d0;
      for (var k = 0; k < 64; k++) {
        var F, g;
        if (k < 16) { F = (B & C) | (~B & D); g = k; }
        else if (k < 32) { F = (D & B) | (~D & C); g = (5 * k + 1) & 15; }
        else if (k < 48) { F = B ^ C ^ D; g = (3 * k + 5) & 15; }
        else { F = C ^ (B | ~D); g = (7 * k) & 15; }
        var tmp = D;
        D = C;
        C = B;
        var x = (A + F + K[k] + words[off + g]) | 0;
        var s = S[k];
        B = (B + ((x << s) | (x >>> (32 - s)))) | 0;
        A = tmp;
      }
      a0 = (a0 + A) | 0;
      b0 = (b0 + B) | 0;
      c0 = (c0 + C) | 0;
      d0 = (d0 + D) | 0;
    }
    var out = new Uint8Array(16);
    var st = [a0, b0, c0, d0];
    for (var m = 0; m < 4; m++) {
      var v = st[m];
      out[m * 4]     = v & 0xff;
      out[m * 4 + 1] = (v >>> 8) & 0xff;
      out[m * 4 + 2] = (v >>> 16) & 0xff;
      out[m * 4 + 3] = (v >>> 24) & 0xff;
    }
    return out;
  }

  function rc4Bytes(key, data) {
    var S = new Uint8Array(256);
    for (var i = 0; i < 256; i++) S[i] = i;
    var j = 0, kLen = key.length;
    for (var m = 0; m < 256; m++) {
      j = (j + S[m] + key[m % kLen]) & 0xff;
      var t = S[m]; S[m] = S[j]; S[j] = t;
    }
    var out = new Uint8Array(data.length);
    var x = 0, y = 0;
    for (var k = 0; k < data.length; k++) {
      x = (x + 1) & 0xff;
      y = (y + S[x]) & 0xff;
      var tmp = S[x]; S[x] = S[y]; S[y] = tmp;
      out[k] = data[k] ^ S[(S[x] + S[y]) & 0xff];
    }
    return out;
  }

  function concatUint8(arrays) {
    var total = 0;
    for (var i = 0; i < arrays.length; i++) total += arrays[i].length;
    var out = new Uint8Array(total);
    var off = 0;
    for (var j = 0; j < arrays.length; j++) {
      out.set(arrays[j], off);
      off += arrays[j].length;
    }
    return out;
  }

  function bytesToHex(b) {
    var s = '';
    for (var i = 0; i < b.length; i++) {
      var v = b[i];
      s += (v < 16 ? '0' : '') + v.toString(16);
    }
    return s;
  }

  function isZlibHeaderValid(b) {
    if (!b || b.length < 2) return false;
    var cmf = b[0], flg = b[1];
    return (cmf & 0x0f) === 8 && (cmf >> 4) <= 7 && (((cmf << 8) | flg) % 31 === 0);
  }

  function hasFlateFilter(dict, PDFLib) {
    if (!dict || typeof dict.get !== 'function') return false;
    var f = dict.get(PDFLib.PDFName.of('Filter'));
    if (!f) return false;
    var s = f.toString();
    return s === '/FlateDecode' || s === '[ /FlateDecode ]' || s === '[/FlateDecode]';
  }

  function decryptPdfObject(obj, objKey, PDFLib, skipMetadata, seen) {
    if (!obj || typeof obj !== 'object') return;
    if (seen) {
      if (seen.has(obj)) return;
      seen.add(obj);
    }
    if (obj instanceof PDFLib.PDFRawStream) {
      var type = obj.dict && typeof obj.dict.get === 'function' ? obj.dict.get(PDFLib.PDFName.of('Type')) : null;
      var typeStr = type ? type.toString() : '';
      if (typeStr === '/XRef') return;
      if (skipMetadata && typeStr === '/Metadata') return;
      var filter = obj.dict && typeof obj.dict.get === 'function' ? obj.dict.get(PDFLib.PDFName.of('Filter')) : null;
      if (filter && filter.toString().indexOf('/Crypt') !== -1) return;
      obj.contents = rc4Bytes(objKey, obj.contents);
      decryptPdfObject(obj.dict, objKey, PDFLib, skipMetadata, seen);
    } else if (obj instanceof PDFLib.PDFDict) {
      obj.dict.forEach(function (v, k) {
        if (v instanceof PDFLib.PDFString || v instanceof PDFLib.PDFHexString) {
          var dec = rc4Bytes(objKey, v.asBytes());
          obj.dict.set(k, PDFLib.PDFHexString.of(bytesToHex(dec)));
        } else {
          decryptPdfObject(v, objKey, PDFLib, skipMetadata, seen);
        }
      });
    } else if (obj instanceof PDFLib.PDFArray) {
      var arr = obj.array;
      for (var i = 0; i < arr.length; i++) {
        var v = arr[i];
        if (v instanceof PDFLib.PDFString || v instanceof PDFLib.PDFHexString) {
          var decArr = rc4Bytes(objKey, v.asBytes());
          arr[i] = PDFLib.PDFHexString.of(bytesToHex(decArr));
        } else {
          decryptPdfObject(v, objKey, PDFLib, skipMetadata, seen);
        }
      }
    }
  }

  function padPdfPassword(pw) {
    var out = new Uint8Array(32);
    var pwBytes = [];
    if (pw) {
      for (var i = 0; i < pw.length && pwBytes.length < 32; i++) {
        pwBytes.push(pw.charCodeAt(i) & 0xff);
      }
    }
    var n = pwBytes.length;
    for (var j = 0; j < n; j++) out[j] = pwBytes[j];
    for (var k = 0; n + k < 32; k++) out[n + k] = PDF_ENC_PAD[k];
    return out;
  }

  /**
   * Decrypts owner-password / user-password protected PDFs in-place inside pdf-lib.
   * Returns true if all streams are verified decrypted; false if raster fallback is needed.
   */
  function tryDecryptPdfLibDoc(sdoc, expectedPages, password) {
    try {
      var PDFLib = window.PDFLib;
      var ctx = sdoc.context;
      var encRef = ctx.trailerInfo && ctx.trailerInfo.Encrypt;
      if (!encRef) return true;
      var enc = ctx.lookup(encRef);
      if (!enc || typeof enc.get !== 'function') return false;

      var filterObj = ctx.lookup(enc.get(PDFLib.PDFName.of('Filter')));
      if (filterObj && filterObj.toString() !== '/Standard') return false;

      var vObj = ctx.lookup(enc.get(PDFLib.PDFName.of('V')));
      var rObj = ctx.lookup(enc.get(PDFLib.PDFName.of('R')));
      var pObj = ctx.lookup(enc.get(PDFLib.PDFName.of('P')));
      var V = vObj && typeof vObj.asNumber === 'function' ? vObj.asNumber() : 0;
      var R = rObj && typeof rObj.asNumber === 'function' ? rObj.asNumber() : 0;
      if ((V !== 1 && V !== 2 && V !== 4) || (R !== 2 && R !== 3 && R !== 4) || !pObj) return false;

      if (V === 4) {
        var cf = ctx.lookup(enc.get(PDFLib.PDFName.of('CF')));
        var stmF = ctx.lookup(enc.get(PDFLib.PDFName.of('StmF')));
        var cfName = stmF ? stmF.toString().replace(/^\//, '') : 'StdCF';
        if (cf && typeof cf.get === 'function') {
          var stdCf = ctx.lookup(cf.get(PDFLib.PDFName.of(cfName)));
          if (stdCf && typeof stdCf.get === 'function') {
            var cfm = ctx.lookup(stdCf.get(PDFLib.PDFName.of('CFM')));
            if (cfm && cfm.toString() !== '/V2') return false;
          }
        }
      }

      var lenObj = ctx.lookup(enc.get(PDFLib.PDFName.of('Length')));
      var keyLen = (V === 1) ? 5 : ((lenObj && typeof lenObj.asNumber === 'function' ? lenObj.asNumber() : 40) / 8);
      if (keyLen < 5 || keyLen > 16) return false;

      var oObj = ctx.lookup(enc.get(PDFLib.PDFName.of('O')));
      var uObj = ctx.lookup(enc.get(PDFLib.PDFName.of('U')));
      if (!oObj || !uObj || typeof oObj.asBytes !== 'function' || typeof uObj.asBytes !== 'function') return false;
      var O = oObj.asBytes();
      var U = uObj.asBytes();

      var idArr = ctx.lookup(ctx.trailerInfo.ID);
      var id0Obj = idArr && typeof idArr.get === 'function' ? ctx.lookup(idArr.get(0)) : null;
      var id0 = id0Obj && typeof id0Obj.asBytes === 'function' ? id0Obj.asBytes() : new Uint8Array(0);

      var P = pObj.asNumber();
      var pBuf = new Uint8Array([P & 0xff, (P >> 8) & 0xff, (P >> 16) & 0xff, (P >> 24) & 0xff]);

      var encMetaObj = ctx.lookup(enc.get(PDFLib.PDFName.of('EncryptMetadata')));
      var encryptMetadata = !(encMetaObj && encMetaObj.toString() === 'false');

      var paddedPw = padPdfPassword(password || '');
      var hashInputs = [paddedPw, O.slice(0, 32), pBuf, id0];
      if (R >= 4 && !encryptMetadata) {
        hashInputs.push(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
      }
      var hash = md5Bytes(concatUint8(hashInputs));
      if (R >= 3) {
        for (var r = 0; r < 50; r++) {
          hash = md5Bytes(hash.slice(0, keyLen));
        }
      }
      var fileKey = hash.slice(0, keyLen);

      if (R === 2) {
        var uCheck2 = rc4Bytes(fileKey, PDF_ENC_PAD);
        for (var c2 = 0; c2 < 32; c2++) {
          if (uCheck2[c2] !== U[c2]) return false;
        }
      } else {
        var uHash = md5Bytes(concatUint8([PDF_ENC_PAD, id0]));
        for (var step = 0; step < 20; step++) {
          var stepKey = new Uint8Array(fileKey.length);
          for (var kb = 0; kb < fileKey.length; kb++) stepKey[kb] = fileKey[kb] ^ step;
          uHash = rc4Bytes(stepKey, uHash);
        }
        for (var c3 = 0; c3 < 16; c3++) {
          if (uHash[c3] !== U[c3]) return false;
        }
      }

      var seen = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
      ctx.indirectObjects.forEach(function (obj, ref) {
        if (encRef && ref.objectNumber === encRef.objectNumber && ref.generationNumber === encRef.generationNumber) return;
        var n = ref.objectNumber, g = ref.generationNumber;
        var suffix = new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, g & 0xff, (g >> 8) & 0xff]);
        var objKey = md5Bytes(concatUint8([fileKey, suffix])).slice(0, Math.min(keyLen + 5, 16));
        decryptPdfObject(obj, objKey, PDFLib, !encryptMetadata, seen);
      });

      delete ctx.trailerInfo.Encrypt;
      sdoc.isEncrypted = false;

      if (expectedPages && sdoc.getPageCount() !== expectedPages) return false;

      var allStreamsValid = true;
      ctx.indirectObjects.forEach(function (obj) {
        if (!allStreamsValid) return;
        if (obj instanceof PDFLib.PDFRawStream && hasFlateFilter(obj.dict, PDFLib)) {
          if (!isZlibHeaderValid(obj.contents)) allStreamsValid = false;
        }
      });
      return allStreamsValid;
    } catch (e) {
      return false;
    }
  }

  function canCopyPageLosslessly(sdoc, pageIdx) {
    try {
      if (!sdoc || sdoc._needsRasterFallback || sdoc.isEncrypted) return false;
      var PDFLib = window.PDFLib;
      var pages = sdoc.getPages();
      if (pageIdx < 0 || pageIdx >= pages.length) return false;
      var page = pages[pageIdx];
      var contents = page.node.Contents();
      if (!contents) return !sdoc._wasEncrypted;
      var ctx = sdoc.context;
      var checkStream = function (refOrObj) {
        var st = ctx.lookup(refOrObj);
        if (!st) return false;
        if (st instanceof PDFLib.PDFRawStream && hasFlateFilter(st.dict, PDFLib)) {
          return isZlibHeaderValid(st.contents);
        }
        return true;
      };
      if (contents instanceof PDFLib.PDFArray) {
        for (var i = 0; i < contents.size(); i++) {
          if (!checkStream(contents.get(i))) return false;
        }
      } else if (!checkStream(contents)) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function renderPageAsPdfPage(out, doc, pageIdx) {
    return renderPageCanvas(doc, pageIdx + 1, { scale: 2.25, rotation: 0 }).then(function (r) {
      var bytes = dataUrlToUint8(r.canvas.toDataURL('image/jpeg', 0.92));
      return out.embedJpg(bytes).then(function (jpg) {
        var page = out.addPage([r.ptW, r.ptH]);
        page.drawImage(jpg, { x: 0, y: 0, width: r.ptW, height: r.ptH });
        return page;
      });
    });
  }

  /* ==================================================================
   * OUTPUT BUILDER (copy pages with rotation, optional page numbers / watermark)
   * ================================================================== */
  function createStampPng(text, isWatermark) {
    var canvas = document.createElement('canvas');
    canvas.width = isWatermark ? 900 : 260;
    canvas.height = isWatermark ? 200 : 48;
    var ctx = canvas.getContext('2d');
    ctx.font = (isWatermark ? 'bold 64px ' : 'bold 22px ') + '"Anek Bangla", "Noto Sans Bengali", sans-serif';
    ctx.fillStyle = isWatermark ? 'rgba(15, 23, 42, 0.16)' : '#334155';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    return dataUrlToUint8(canvas.toDataURL('image/png'));
  }

  function buildPdfFromPages(pages, opt) {
    opt = opt || {};
    var PDFLib = window.PDFLib;
    var srcCache = {};
    function src(doc) {
      if (!srcCache[doc.id]) {
        srcCache[doc.id] = PDFLib.PDFDocument.load(doc.buffer, { ignoreEncryption: true }).then(function (sdoc) {
          if (sdoc.isEncrypted) {
            sdoc._wasEncrypted = true;
            var ok = tryDecryptPdfLibDoc(sdoc, doc.numPages, doc.password);
            sdoc._needsRasterFallback = !ok;
          }
          return sdoc;
        }).catch(function () {
          return { _needsRasterFallback: true };
        });
      }
      return srcCache[doc.id];
    }
    return PDFLib.PDFDocument.create().then(function (out) {
      var chain = Promise.resolve();
      var wmImg = null;
      if (opt.watermark) {
        chain = chain.then(function () { return out.embedPng(createStampPng(opt.watermark, true)).then(function (im) { wmImg = im; }); });
      }
      pages.forEach(function (p, i) {
        chain = chain.then(function () {
          if (opt.onProgress) opt.onProgress(i + 1, pages.length);
          var pp;
          if (p.isBlank) pp = Promise.resolve(out.addPage([p.w || 595.28, p.h || 841.89]));
          else {
            pp = src(p.doc).then(function (sdoc) {
              if (!canCopyPageLosslessly(sdoc, p.idx)) {
                return renderPageAsPdfPage(out, p.doc, p.idx);
              }
              return out.copyPages(sdoc, [p.idx]).then(function (cp) {
                out.addPage(cp[0]);
                return cp[0];
              }).catch(function () {
                return renderPageAsPdfPage(out, p.doc, p.idx);
              });
            });
          }
          return pp.then(function (page) {
            var base = (page.getRotation() && page.getRotation().angle) || 0;
            var eff = (((base + (p.rotation || 0)) % 360) + 360) % 360;
            if (p.rotation) page.setRotation(PDFLib.degrees(eff));
            var sz = page.getSize();
            var w = sz.width, h = sz.height;
            if (wmImg) {
              var vw = eff % 180 ? h : w;
              var ww = Math.min(vw * 0.75, 420), wh = ww * (200 / 900);
              var theta = (30 + eff) * Math.PI / 180;
              var a = ww / 2, b = wh / 2;
              page.drawImage(wmImg, {
                x: w / 2 - (Math.cos(theta) * a - Math.sin(theta) * b),
                y: h / 2 - (Math.sin(theta) * a + Math.cos(theta) * b),
                width: ww, height: wh, rotate: PDFLib.degrees(30 + eff)
              });
            }
            if (opt.pageNumbers) {
              return out.embedPng(createStampPng((i + 1) + ' / ' + pages.length, false)).then(function (img) {
                var iw = 110, ih = 20, pos;
                if (eff === 90) pos = { x: w - 14, y: (h - iw) / 2 };
                else if (eff === 180) pos = { x: (w + iw) / 2, y: h - 14 };
                else if (eff === 270) pos = { x: 14, y: (h + iw) / 2 };
                else pos = { x: (w - iw) / 2, y: 14 };
                page.drawImage(img, { x: pos.x, y: pos.y, width: iw, height: ih, rotate: PDFLib.degrees(eff) });
              });
            }
          });
        });
      });
      return chain.then(function () { return out.save({ useObjectStreams: true }); });
    });
  }

  /* ==================================================================
   * NAVIGATION
   * ================================================================== */
  var initialized = false;
  var currentSubTab = 'hub';
  var PDF_SUB_SLUGS = {
    hub: '/pdf',
    merge: '/pdf/merge',
    split: '/pdf/split',
    compress: '/pdf/compress',
    organize: '/pdf/organize',
    pdf2other: '/pdf/pdf-to-other',
    other2pdf: '/pdf/other-to-pdf'
  };
  var PDF_SUB_TITLES = {
    merge: { bn: 'মার্জ PDF', en: 'Merge PDF' },
    split: { bn: 'স্প্লিট PDF', en: 'Split PDF' },
    compress: { bn: 'কম্প্রেস PDF', en: 'Compress PDF' },
    organize: { bn: 'অর্গানাইজ ও এডিট PDF', en: 'Organize & Edit PDF' },
    pdf2other: { bn: 'PDF → অন্য ফরম্যাট', en: 'PDF Converter' },
    other2pdf: { bn: 'অন্য ফাইল → PDF', en: 'Convert to PDF' }
  };

  function switchPdfTab(tabId, subOpt, skipUrl) {
    currentSubTab = tabId || 'hub';
    var targetPane = $('#pdf-pane-' + currentSubTab);
    if (!targetPane && PDF_SUB_SLUGS[currentSubTab]) {
      if (window.TechHatNavigate) window.TechHatNavigate(PDF_SUB_SLUGS[currentSubTab]);
      else location.href = PDF_SUB_SLUGS[currentSubTab];
      return;
    }
    $$('#tool-pdf .pdf-nav-btn').forEach(function (btn) {
      var active = btn.getAttribute('data-pdf-tab') === currentSubTab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    $$('#tool-pdf .pdf-pane').forEach(function (pane) { pane.hidden = pane.id !== 'pdf-pane-' + currentSubTab; });
    var bcTool = $('#globalBreadcrumbTool');
    if (bcTool && PDF_SUB_TITLES[currentSubTab]) {
      var tMeta = PDF_SUB_TITLES[currentSubTab];
      var lang = document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'bn';
      bcTool.setAttribute('data-i18n-bn', tMeta.bn);
      bcTool.setAttribute('data-i18n-en', tMeta.en);
      bcTool.textContent = tMeta[lang];
    }
    var targetSlug = PDF_SUB_SLUGS[currentSubTab] || '/pdf';
    $$('#globalBreadcrumbDropdown [data-bc-item]').forEach(function (item) {
      item.classList.toggle('is-active', item.getAttribute('data-bc-item') === targetSlug);
    });
    if (subOpt) {
      var name = currentSubTab === 'pdf2other' ? 'pdfToOtherFmt' : (currentSubTab === 'other2pdf' ? 'otherToPdfMode' : '');
      var r = name && $('input[name="' + name + '"][value="' + subOpt + '"]');
      if (r) { r.checked = true; r.dispatchEvent(new Event('change')); }
    }
    if (!skipUrl && history.pushState && /^\/pdf(\/|$)/.test(location.pathname)) {
      var targetUrl = PDF_SUB_SLUGS[currentSubTab] || '/pdf';
      if (location.pathname !== targetUrl) {
        history.pushState(null, '', targetUrl);
      }
    }
    if (currentSubTab !== 'hub') ensurePdfLibs().catch(function () {});
  }

  /** Loads a single PDF File into { doc, name, size, pages }. */
  function loadSinglePdf(files, label) {
    var file = files && files.filter(isPdfFile)[0];
    if (!file) {
      showToast('অনুগ্রহ করে একটি PDF ফাইল নির্বাচন করুন।');
      return Promise.reject(new Error('no pdf'));
    }
    return ensurePdfLibs().then(function () {
      setProgress(30, label || 'PDF লোড হচ্ছে…');
      return readFileArrayBuffer(file);
    }).then(function (buf) {
      return openPdfDoc(buf, file.name);
    }).then(function (doc) {
      setProgress(null);
      return { doc: doc, name: file.name, size: file.size, pages: makePages(doc) };
    }).catch(function (err) {
      setProgress(null);
      if (err && err.message !== 'no pdf') showToast(err.message || 'PDF ফাইলটি পড়া যায়নি।');
      throw err;
    });
  }

  function fileBanner(el, st) {
    if (!el) return;
    el.innerHTML = '<div class="pdf-file-banner__icon shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center"><svg class="w-4.5 h-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><div class="pdf-file-banner__body flex flex-col gap-0.5 min-w-0"><strong class="text-xs font-bold text-slate-900 dark:text-studio-text truncate">' + esc(st.name) +
      '</strong><span class="text-[11px] text-slate-500 dark:text-studio-muted">মোট ' + toBn(st.pages.length) + ' পৃষ্ঠা • সাইজ: <b>' + fmtSize(st.size) + '</b></span></div>';
  }

  function showStage(prefix, has) {
    $('#' + prefix + 'Dropzone').hidden = has;
    $('#' + prefix + 'Stage').hidden = !has;
    var top = $('#' + prefix + 'TopActions');
    if (top) top.hidden = !has;
  }

  /* ==================================================================
   * 1. MERGE (PDF + images + office files)
   * ================================================================== */
  var mergeItems = []; // { key, name, size, kind, badge, doc, pages }

  function addMergeFiles(files) {
    var conv = C();
    var ok = files.filter(function (f) { return conv && conv.kindOf(f); });
    var bad = files.length - ok.length;
    if (bad) showToast(toBn(bad) + 'টি ফাইলের ফরম্যাট সাপোর্টেড নয় — বাদ দেওয়া হয়েছে।');
    if (!ok.length) return;
    ensurePdfLibs().then(function () {
      var chain = Promise.resolve();
      ok.forEach(function (file, i) {
        chain = chain.then(function () {
          var kind = conv.kindOf(file);
          var base = (i / ok.length) * 100;
          setProgress(base + 2, toBn(i + 1) + '/' + toBn(ok.length) + ' • ' + file.name + (kind === 'pdf' ? ' লোড হচ্ছে…' : ' PDF-এ রূপান্তর হচ্ছে…'));
          return conv.convertFileToPdf(file, function (n, total) {
            setProgress(base + (n / total) * (100 / ok.length), file.name + ' • স্লাইড ' + toBn(n) + '/' + toBn(total));
          }).then(function (res) {
            return openPdfDoc(res.bytes, file.name).then(function (doc) {
              mergeItems.push({ key: 'f' + doc.id, name: file.name, size: file.size, kind: res.kind, badge: conv.badgeOf(res.kind, file.name), doc: doc, pages: makePages(doc) });
              renderMergeUI();
            });
          }).catch(function (err) {
            showToast((err && err.message) || (file.name + ' রূপান্তর করা যায়নি'));
          });
        });
      });
      return chain;
    }).then(function () { setProgress(null); renderMergeUI(); }, function () { setProgress(null); });
  }

  var KIND_PILL_CLS = {
    pdf: 'bg-rose-500 text-white',
    img: 'bg-emerald-500 text-slate-950',
    doc: 'bg-blue-500 text-white',
    ppt: 'bg-amber-500 text-slate-950',
    xls: 'bg-teal-500 text-slate-950',
    txt: 'bg-slate-600 text-white'
  };

  function renderMergeUI() {
    showStage('pdfMerge', mergeItems.length > 0);
    if (!mergeItems.length) return;
    renderGrid($('#pdfMergeList'), {
      items: mergeItems,
      thumbOf: function (it) { return it.pages[0]; },
      multi: function (it) { return it.pages.length > 1; },
      badge: function (it, i) {
        var pillCls = KIND_PILL_CLS[it.kind] || 'bg-emerald-500 text-slate-950';
        return '#' + fmtN(i + 1) + ' <span class="pdf-kind px-1.5 py-0.25 rounded text-[9px] font-extrabold uppercase tracking-wide ' + pillCls + ' pdf-kind--' + it.kind + '">' + esc(it.badge) + '</span>';
      },
      label: function (it) { return it.name; },
      meta: function (it) {
        var rot = it.pages.some(function (p) { return p.rotation; });
        var pgLbl = isEn()
          ? fmtN(it.pages.length) + (it.pages.length === 1 ? ' page' : ' pages')
          : fmtN(it.pages.length) + ' পৃষ্ঠা';
        var origLbl = it.pages.length !== it.doc.numPages
          ? (isEn() ? ' (orig ' + fmtN(it.doc.numPages) + ')' : ' (মূল ' + fmtN(it.doc.numPages) + ')')
          : '';
        return pgLbl + origLbl + ' • ' + fmtSize(it.size) + (rot ? tr(' • ঘোরানো', ' • Rotated') : '');
      },
      actions: function (it) {
        return [
          'rotL',
          'rotR',
          'zoom',
          {
            act: 'pages',
            label: '<svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>' + fmtN(it.pages.length) + '</span>',
            title: 'সব পৃষ্ঠা দেখুন ও সম্পাদনা করুন',
            titleEn: 'View & edit pages',
            cls: 'pdf-mini-btn--wide'
          },
          'del'
        ];
      },
      sortable: true,
      addMoreFor: 'pdfMergeAddMore',
      onReorder: function (order) { mergeItems = reorderArray(mergeItems, order); renderMergeUI(); },
      onAction: function (act, i) {
        var it = mergeItems[i];
        if (act === 'rotL' || act === 'rotR') it.pages.forEach(function (p) { rotatePage(p, act === 'rotL' ? -90 : 90); });
        else if (act === 'pages') { openPagesDialog(it); return; }
        else if (act === 'zoom') { previewPages(it.pages, it.name, 0); return; }
        else if (act === 'del') mergeItems.splice(i, 1);
        renderMergeUI();
      }
    });
    var totalPages = 0, totalBytes = 0;
    mergeItems.forEach(function (it) { totalPages += it.pages.length; totalBytes += it.size; });
    $('#pdfMergeSummary').textContent = isEn()
      ? fmtN(mergeItems.length) + (mergeItems.length === 1 ? ' file' : ' files') + ' • ' + fmtN(totalPages) + (totalPages === 1 ? ' page total' : ' pages total') + ' (' + fmtSize(totalBytes) + ')'
      : fmtN(mergeItems.length) + 'টি ফাইল • মোট ' + fmtN(totalPages) + ' পৃষ্ঠা (' + fmtSize(totalBytes) + ')';
  }

  function runMergePdf() {
    if (!mergeItems.length) { showToast('অন্তত ১টি ফাইল যোগ করুন।'); return; }
    var pages = [];
    mergeItems.forEach(function (it) { pages = pages.concat(it.pages); });
    var singleModified = mergeItems[0].doc && (mergeItems[0].doc.password || mergeItems[0].pages.length !== mergeItems[0].doc.numPages);
    if (mergeItems.length < 2 && !pages.some(function (p) { return p.rotation; }) && mergeItems[0].kind === 'pdf' && !singleModified) {
      showToast('মার্জ করার জন্য অন্তত ২টি ফাইল যোগ করুন।');
      return;
    }
    var btn = $('#pdfMergeRunBtn');
    btn.disabled = true;
    ensurePdfLibs().then(function () {
      return buildPdfFromPages(pages, {
        onProgress: function (n, t) { setProgress(5 + (n / t) * 88, 'পৃষ্ঠা ' + toBn(n) + '/' + toBn(t) + ' যুক্ত হচ্ছে…'); }
      });
    }).then(function (bytes) {
      setProgress(null);
      btn.disabled = false;
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), baseName(mergeItems[0].name) + '-merged.pdf');
      showToast('সফলভাবে মার্জ হয়েছে! মোট ' + toBn(pages.length) + ' পৃষ্ঠা (' + fmtSize(bytes.byteLength) + ')');
    }).catch(function (err) {
      setProgress(null);
      btn.disabled = false;
      showToast('মার্জ করতে সমস্যা হয়েছে: ' + ((err && err.message) || ''));
    });
  }

  /* ==================================================================
   * 2. SPLIT
   * ================================================================== */
  var splitState = null; // { doc, name, size, pages, selected:Set(pageNum) }

  function loadSplitFile(files) {
    loadSinglePdf(files).then(function (st) {
      st.selected = new Set([1]);
      splitState = st;
      $('#pdfSplitRange').value = '1';
      renderSplitUI();
    }).catch(function () {});
  }

  function parseRangeGroups(str, maxPage) {
    var groups = [];
    String(str || '').split(',').forEach(function (part) {
      var s = part.trim();
      if (!s) return;
      var m = /^(\d+)\s*-\s*(\d+)$/.exec(s);
      if (m) {
        var a = Math.max(1, Math.min(maxPage, +m[1])), b = Math.max(1, Math.min(maxPage, +m[2]));
        var pages = [], step = a <= b ? 1 : -1;
        for (var i = a; step > 0 ? i <= b : i >= b; i += step) pages.push(i);
        groups.push({ label: a + '-' + b, pages: pages });
      } else if (/^\d+$/.test(s) && +s >= 1 && +s <= maxPage) {
        groups.push({ label: s, pages: [+s] });
      }
    });
    return groups;
  }
  function setToRangeString(set, maxPage) {
    var nums = [];
    for (var i = 1; i <= maxPage; i++) if (set.has(i)) nums.push(i);
    if (!nums.length) return '';
    var parts = [], start = nums[0], prev = nums[0];
    for (var j = 1; j < nums.length; j++) {
      if (nums[j] === prev + 1) prev = nums[j];
      else { parts.push(start === prev ? '' + start : start + '-' + prev); start = prev = nums[j]; }
    }
    parts.push(start === prev ? '' + start : start + '-' + prev);
    return parts.join(', ');
  }

  function renderSplitUI() {
    showStage('pdfSplit', !!splitState);
    if (!splitState) return;
    var st = splitState;
    renderGrid($('#pdfSplitPagesGrid'), {
      items: st.pages,
      label: function (p) { return 'পৃষ্ঠা ' + toBn(p.idx + 1); },
      actions: function () { return ['rotL', 'rotR', 'zoom']; },
      selectable: true,
      isSelected: function (p) { return st.selected.has(p.idx + 1); },
      onSelect: function (i) {
        var n = i + 1;
        if (st.selected.has(n)) st.selected.delete(n); else st.selected.add(n);
        $('#pdfSplitRange').value = setToRangeString(st.selected, st.pages.length);
        renderSplitUI();
      },
      onAction: function (act, i) {
        if (act === 'zoom') { previewPages(st.pages, st.name, i); return; }
        rotatePage(st.pages[i], act === 'rotL' ? -90 : 90);
        renderSplitUI();
      }
    });
    $('#pdfSplitSummary').textContent = st.name + ' • মোট ' + toBn(st.pages.length) + ' পৃষ্ঠা (' + toBn(st.selected.size) + 'টি নির্বাচিত)';
  }

  function runSplitPdf() {
    if (!splitState) return;
    var st = splitState;
    var mode = ($('input[name="pdfSplitMode"]:checked') || {}).value || 'range';
    var groups = [], single = false;
    if (mode === 'range') {
      groups = parseRangeGroups($('#pdfSplitRange').value, st.pages.length);
      if (!groups.length) { showToast('অনুগ্রহ করে অন্তত ১টি পৃষ্ঠা বা পেজ রেঞ্জ নির্বাচন করুন।'); return; }
      single = $('#pdfSplitMergeRanges').checked || groups.length === 1;
    } else {
      var step = Math.max(1, parseInt($('#pdfSplitEvery').value, 10) || 1);
      for (var i = 1; i <= st.pages.length; i += step) {
        var end = Math.min(st.pages.length, i + step - 1), arr = [];
        for (var p = i; p <= end; p++) arr.push(p);
        groups.push({ label: i === end ? '' + i : i + '-' + end, pages: arr });
      }
      single = groups.length === 1;
    }
    var btn = $('#pdfSplitRunBtn');
    btn.disabled = true;
    var pick = function (nums) { return nums.map(function (n) { return st.pages[n - 1]; }); };

    ensurePdfLibs().then(function () {
      if (single) {
        var all = [];
        groups.forEach(function (g) { all = all.concat(g.pages); });
        setProgress(40, 'নির্বাচিত পৃষ্ঠাগুলো আলাদা করা হচ্ছে…');
        return buildPdfFromPages(pick(all)).then(function (bytes) {
          downloadBlob(new Blob([bytes], { type: 'application/pdf' }), baseName(st.name) + '-pages-' + groups.map(function (g) { return g.label; }).join('_').slice(0, 40) + '.pdf');
          showToast('স্প্লিট করা PDF ডাউনলোড সম্পন্ন হয়েছে!');
        });
      }
      var zip = new window.JSZip();
      var chain = Promise.resolve();
      groups.forEach(function (g, gi) {
        chain = chain.then(function () {
          setProgress(10 + ((gi + 1) / groups.length) * 80, 'ফাইল ' + toBn(gi + 1) + '/' + toBn(groups.length) + ' তৈরি হচ্ছে…');
          return buildPdfFromPages(pick(g.pages)).then(function (bytes) { zip.file(baseName(st.name) + '-page-' + g.label + '.pdf', bytes); });
        });
      });
      return chain.then(function () {
        setProgress(95, 'ZIP আর্কাইভ তৈরি হচ্ছে…');
        return zip.generateAsync({ type: 'blob' });
      }).then(function (blob) {
        downloadBlob(blob, baseName(st.name) + '-split-files.zip');
        showToast(toBn(groups.length) + 'টি আলাদা PDF ফাইলের ZIP ডাউনলোড হয়েছে!');
      });
    }).then(function () { setProgress(null); btn.disabled = false; }, function (err) {
      setProgress(null);
      btn.disabled = false;
      showToast('স্প্লিট করতে সমস্যা হয়েছে: ' + ((err && err.message) || ''));
    });
  }

  /* ==================================================================
   * 3. COMPRESS (preview first, download only when the user is happy)
   * ================================================================== */
  var compressState = null; // { doc, name, size, pages, result:{bytes, doc, level, gray} }

  function loadCompressFile(files) {
    loadSinglePdf(files, 'PDF ফাইল বিশ্লেষণ করা হচ্ছে…').then(function (st) {
      compressState = st;
      renderCompressUI();
    }).catch(function () {});
  }

  function invalidateCompress() {
    if (compressState && compressState.result) {
      compressState.result = null;
      renderCompressResult();
    }
  }

  function renderCompressUI() {
    showStage('pdfCompress', !!compressState);
    if (!compressState) return;
    var st = compressState;
    fileBanner($('#pdfCompressFileInfo'), st);
    renderGrid($('#pdfCompressPagesGrid'), {
      items: st.pages,
      label: function (p) { return 'পৃষ্ঠা ' + toBn(p.idx + 1); },
      actions: function () { return ['rotL', 'rotR', 'zoom']; },
      onAction: function (act, i) {
        if (act === 'zoom') { previewPages(st.pages, st.name, i); return; }
        rotatePage(st.pages[i], act === 'rotL' ? -90 : 90);
        invalidateCompress();
        renderCompressUI();
      }
    });
    renderCompressResult();
  }

  function renderCompressResult() {
    var st = compressState;
    var box = $('#pdfCompressResult');
    var bar = $('#pdfCompressActionBar');
    if (!st || !st.result) {
      box.hidden = true;
      bar.hidden = false;
      if (st) $('#pdfCompressSummary').textContent = 'মূল সাইজ: ' + fmtSize(st.size);
      return;
    }
    var r = st.result;
    var newSize = r.bytes.byteLength;
    var saved = st.size - newSize;
    var pct = st.size > 0 ? Math.round((saved / st.size) * 100) : 0;
    box.hidden = false;
    bar.hidden = true;
    var levelName = { extreme: 'এক্সট্রিম', recommended: 'রেকমেন্ডেড', light: 'হালকা' }[r.level] || '';
    $('#pdfCompressStat').innerHTML =
      '<div class="pdf-size-card inline-flex flex-col px-3 py-1.5 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs"><span class="text-[10px] text-slate-500 dark:text-studio-muted font-medium">আগের সাইজ</span><b class="text-sm font-extrabold text-slate-900 dark:text-studio-text">' + fmtSize(st.size) + '</b></div>' +
      '<span class="pdf-compress-arrow text-slate-400 mx-1 inline-flex items-center" aria-hidden="true"><svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg></span>' +
      '<div class="pdf-size-card pdf-size-card--new inline-flex flex-col px-3 py-1.5 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs"><span class="text-[10px] text-slate-500 dark:text-studio-muted font-medium">নতুন সাইজ</span><b class="text-sm font-extrabold text-emerald-600 dark:text-studio-primary">' + fmtSize(newSize) + '</b></div>' +
      '<span class="pdf-compress-badge inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ' + (pct > 0 ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'is-neutral bg-slate-200 dark:bg-studio-surface text-slate-600 dark:text-studio-muted') + '">' +
      (pct > 0 ? toBn(pct) + '% ছোট হয়েছে' : 'সাইজ কমেনি — ফাইলটি আগেই অপটিমাইজড') + '</span>' +
      '<span class="pdf-compress-level text-xs text-slate-500 dark:text-studio-muted ml-auto">' + levelName + ' লেভেল' + (r.gray ? ' • সাদাকালো' : '') + '</span>';
    renderGrid($('#pdfCompressPreviewGrid'), {
      items: makePages(r.doc).map(function (p, i) { p.label = 'পৃষ্ঠা ' + toBn(i + 1); return p; }),
      label: function (p) { return p.label; },
      actions: function () { return [{ act: 'compare', label: '<svg class="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span>' + tr('তুলনা', 'Compare') + '</span>', title: 'আগে ও পরে তুলনা করুন', cls: 'pdf-mini-btn--wide' }]; },
      onAction: function (act, i) { openCompare(i + 1); }
    });
  }

  function openCompare(n) {
    var st = compressState;
    if (!st || !st.result) return;
    var r = st.result;
    openPreview('আগে / পরে কোয়ালিটি তুলনা', 'ছবিতে ক্লিক করে জুম করে খুঁটিনাটি দেখুন', r.doc.numPages, n || 1, function (k) {
      return Promise.all([
        pageImageUrl(st.pages[k - 1], 1000),
        renderPageCanvas(r.doc, k, { width: 1000 }).then(function (res) { return res.canvas.toDataURL('image/png'); })
      ]).then(function (urls) {
        return [
          { label: 'আগে (মূল) • ' + fmtSize(st.size), url: urls[0] },
          { label: 'পরে (কমপ্রেসড) • ' + fmtSize(r.bytes.byteLength), url: urls[1] }
        ];
      });
    });
  }

  function runCompressPdf() {
    var st = compressState;
    if (!st) return;
    var lvl = ($('input[name="pdfCompressLevel"]:checked') || {}).value || 'recommended';
    var gray = $('#pdfCompressGray').checked;
    var cfg = lvl === 'extreme' ? { scale: 1.0, quality: 0.45 } : (lvl === 'light' ? { scale: 1.7, quality: 0.8 } : { scale: 1.35, quality: 0.62 });
    var btn = $('#pdfCompressRunBtn');
    btn.disabled = true;

    ensurePdfLibs().then(function () {
      return window.PDFLib.PDFDocument.create().then(function (out) {
        var chain = Promise.resolve();
        st.pages.forEach(function (p, i) {
          chain = chain.then(function () {
            setProgress(5 + ((i + 1) / st.pages.length) * 80, 'পৃষ্ঠা ' + toBn(i + 1) + '/' + toBn(st.pages.length) + ' অপটিমাইজ হচ্ছে…');
            return renderPageCanvas(p.doc, p.idx + 1, { scale: cfg.scale, rotation: p.rotation }).then(function (r) {
              var ctx = r.canvas.getContext('2d');
              if (gray) {
                var img = ctx.getImageData(0, 0, r.canvas.width, r.canvas.height), d = img.data;
                for (var j = 0; j < d.length; j += 4) {
                  var g = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2];
                  d[j] = d[j + 1] = d[j + 2] = g;
                }
                ctx.putImageData(img, 0, 0);
              }
              return out.embedJpg(dataUrlToUint8(r.canvas.toDataURL('image/jpeg', cfg.quality))).then(function (jpg) {
                var page = out.addPage([r.ptW, r.ptH]);
                page.drawImage(jpg, { x: 0, y: 0, width: r.ptW, height: r.ptH });
              });
            });
          });
        });
        return chain.then(function () {
          setProgress(90, 'ফাইল স্ট্রাকচার অপটিমাইজ হচ্ছে…');
          return out.save({ useObjectStreams: true });
        });
      });
    }).then(function (rasterBytes) {
      // Text-only / vector PDFs often get bigger when rasterised — keep the structurally optimised original instead
      if (gray) return rasterBytes;
      return buildPdfFromPages(st.pages).then(function (structBytes) {
        var best = structBytes.byteLength < rasterBytes.byteLength ? structBytes : rasterBytes;
        // Never hand back something bigger than the untouched original (when nothing was rotated)
        var untouched = !st.pages.some(function (p) { return p.rotation; });
        if (untouched && st.doc.buffer.byteLength <= best.byteLength) best = new Uint8Array(st.doc.buffer.slice(0));
        return best;
      }).catch(function () { return rasterBytes; });
    }).then(function (finalBytes) {
      setProgress(95, 'প্রিভিউ তৈরি হচ্ছে…');
      return openPdfDoc(finalBytes, st.name).then(function (doc) {
        st.result = { bytes: finalBytes, doc: doc, level: lvl, gray: gray };
      });
    }).then(function () {
      setProgress(null);
      btn.disabled = false;
      renderCompressResult();
      var box = $('#pdfCompressResult');
      if (box) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast('কমপ্রেস সম্পন্ন! সাইজ ও প্রিভিউ দেখে পছন্দ হলে ডাউনলোড করুন।');
    }).catch(function (err) {
      setProgress(null);
      btn.disabled = false;
      showToast('কমপ্রেস করতে সমস্যা হয়েছে: ' + ((err && err.message) || ''));
    });
  }

  function downloadCompressed() {
    var st = compressState;
    if (!st || !st.result) return;
    downloadBlob(new Blob([st.result.bytes], { type: 'application/pdf' }), baseName(st.name) + '-compressed.pdf');
    showToast('কমপ্রেসড PDF ডাউনলোড হয়েছে!');
  }

  /* ==================================================================
   * 4. ORGANIZE
   * ================================================================== */
  var orgState = null; // { doc, name, size, pages }

  function loadOrgFile(files) {
    loadSinglePdf(files, 'PDF পৃষ্ঠাগুলো লোড হচ্ছে…').then(function (st) {
      orgState = st;
      renderOrgUI();
    }).catch(function () {});
  }

  function renderOrgUI() {
    showStage('pdfOrg', !!(orgState && orgState.pages.length));
    if (!orgState) return;
    var st = orgState;
    renderGrid($('#pdfOrgPagesGrid'), {
      items: st.pages,
      label: function (p) { return p.isBlank ? 'নতুন সাদা পেজ' : 'মূল পৃষ্ঠা ' + toBn(p.idx + 1); },
      actions: function () { return ['rotL', 'rotR', 'zoom', 'dup', 'del']; },
      sortable: true,
      onReorder: function (order) { st.pages = reorderArray(st.pages, order); renderOrgUI(); },
      onAction: function (act, i) {
        var p = st.pages[i];
        if (act === 'rotL') rotatePage(p, -90);
        else if (act === 'rotR') rotatePage(p, 90);
        else if (act === 'zoom') { previewPages(st.pages, st.name, i); return; }
        else if (act === 'dup') st.pages.splice(i + 1, 0, clonePage(p));
        else if (act === 'del') {
          if (st.pages.length <= 1) { showToast('সবগুলো পৃষ্ঠা মুছে ফেলা যাবে না।'); return; }
          st.pages.splice(i, 1);
        }
        renderOrgUI();
      }
    });
    $('#pdfOrgSummary').textContent = st.name + ' • মোট ' + toBn(st.pages.length) + ' পৃষ্ঠা';
  }

  function runOrgPdf() {
    var st = orgState;
    if (!st || !st.pages.length) return;
    var btn = $('#pdfOrgRunBtn');
    btn.disabled = true;
    ensurePdfLibs().then(function () {
      return buildPdfFromPages(st.pages, {
        pageNumbers: $('#pdfOrgPageNums').checked,
        watermark: $('#pdfOrgWatermark').value.trim(),
        onProgress: function (n, t) { setProgress(5 + (n / t) * 88, 'পৃষ্ঠা ' + toBn(n) + '/' + toBn(t) + ' প্রস্তুত হচ্ছে…'); }
      });
    }).then(function (bytes) {
      setProgress(null);
      btn.disabled = false;
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), baseName(st.name) + '-organized.pdf');
      showToast('সাজানো PDF সফলভাবে ডাউনলোড হয়েছে!');
    }).catch(function (err) {
      setProgress(null);
      btn.disabled = false;
      showToast('অর্গানাইজ করতে সমস্যা হয়েছে: ' + ((err && err.message) || ''));
    });
  }

  /* ==================================================================
   * 5. PDF → JPG / PNG / WORD / TEXT
   * ================================================================== */
  var p2oState = null;

  function loadPdf2OtherFile(files) {
    loadSinglePdf(files).then(function (st) {
      p2oState = st;
      renderPdf2OtherUI();
    }).catch(function () {});
  }

  function renderPdf2OtherUI() {
    showStage('pdfToOther', !!p2oState);
    if (!p2oState) return;
    var st = p2oState;
    var prev = $('#pdfToOtherPreview');
    prev.hidden = true;
    prev.innerHTML = '';
    fileBanner($('#pdfToOtherFileInfo'), st);
    renderGrid($('#pdfToOtherPagesGrid'), {
      items: st.pages,
      label: function (p) { return 'পৃষ্ঠা ' + toBn(p.idx + 1); },
      actions: function () { return ['rotL', 'rotR', 'zoom']; },
      onAction: function (act, i) {
        if (act === 'zoom') { previewPages(st.pages, st.name, i); return; }
        rotatePage(st.pages[i], act === 'rotL' ? -90 : 90);
        renderPdf2OtherUI();
      }
    });
    $('#pdfToOtherSummary').textContent = toBn(st.pages.length) + ' পৃষ্ঠা রূপান্তরের জন্য প্রস্তুত';
  }

  function extractPageText(page) {
    return page.getTextContent().then(function (tc) {
      var lines = [], lastY = null, cur = [];
      (tc.items || []).forEach(function (it) {
        var y = it.transform ? Math.round(it.transform[5]) : 0;
        if (lastY !== null && Math.abs(y - lastY) > 6) { lines.push(cur.join(' ')); cur = []; }
        if (it.str) cur.push(it.str);
        lastY = y;
      });
      if (cur.length) lines.push(cur.join(' '));
      return lines.join('\n');
    });
  }

  function runPdf2Other() {
    var st = p2oState;
    if (!st) return;
    var fmt = ($('input[name="pdfToOtherFmt"]:checked') || {}).value || 'jpg';
    var scale = parseFloat(($('input[name="pdfImgScale"]:checked') || {}).value || '2.2');
    var btn = $('#pdfToOtherRunBtn');
    var prev = $('#pdfToOtherPreview');
    var base = baseName(st.name);
    btn.disabled = true;

    ensurePdfLibs().then(function () {
      var total = st.pages.length;
      if (fmt === 'jpg' || fmt === 'png') {
        var mime = fmt === 'png' ? 'image/png' : 'image/jpeg';
        var rendered = [];
        var chain = Promise.resolve();
        st.pages.forEach(function (p, i) {
          chain = chain.then(function () {
            setProgress(5 + ((i + 1) / total) * 85, 'পৃষ্ঠা ' + toBn(i + 1) + '/' + toBn(total) + ' ছবিতে রূপান্তর হচ্ছে…');
            return renderPageCanvas(p.doc, p.idx + 1, { scale: scale, rotation: p.rotation }).then(function (r) {
              var url = r.canvas.toDataURL(mime, 0.92);
              rendered.push({ n: i + 1, url: url });
            });
          });
        });
        return chain.then(function () {
          prev.hidden = false;
          prev.innerHTML = '<div class="pdf-pages-grid pdf-pages-grid--compact grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">' + rendered.map(function (r) {
            var dl = base + '-page-' + r.n + '.' + fmt;
            return '<div class="pdf-page-card relative flex flex-col rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border p-2.5 shadow-2xs"><div class="pdf-page-card__badge absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded bg-slate-900/75 text-white text-[10px] font-bold">পৃষ্ঠা ' + toBn(r.n) + '</div>' +
              '<div class="pdf-page-card__thumb-wrap relative aspect-[3/4] rounded-lg bg-slate-100 dark:bg-studio-panel overflow-hidden flex items-center justify-center mb-2"><img src="' + r.url + '" class="pdf-page-card__thumb max-w-full max-h-full object-contain rounded" alt="পৃষ্ঠা ' + r.n + '"></div>' +
              '<a href="' + r.url + '" download="' + esc(dl) + '" class="chip-btn pdf-dl-chip mt-2 w-full inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text hover:border-emerald-500 no-underline transition-colors">⬇ ' + fmt.toUpperCase() + '</a></div>';
          }).join('') + '</div>';
          if (rendered.length === 1) {
            downloadBlob(new Blob([dataUrlToUint8(rendered[0].url)], { type: mime }), base + '-page-1.' + fmt);
            showToast('ছবি ডাউনলোড সম্পন্ন হয়েছে!');
            return;
          }
          setProgress(95, 'ZIP আর্কাইভ তৈরি হচ্ছে…');
          var zip = new window.JSZip();
          rendered.forEach(function (r) { zip.file(base + '-page-' + r.n + '.' + fmt, dataUrlToUint8(r.url)); });
          return zip.generateAsync({ type: 'blob' }).then(function (blob) {
            downloadBlob(blob, base + '-' + fmt + '-images.zip');
            showToast(toBn(rendered.length) + 'টি পৃষ্ঠার ছবি ZIP আকারে ডাউনলোড হয়েছে!');
          });
        });
      }

      var texts = [];
      var chainT = Promise.resolve();
      st.pages.forEach(function (p, i) {
        chainT = chainT.then(function () {
          setProgress(5 + ((i + 1) / total) * 85, 'পৃষ্ঠা ' + toBn(i + 1) + '/' + toBn(total) + ' থেকে লেখা পড়া হচ্ছে…');
          if (p.isBlank) { texts.push(''); return; }
          return p.doc.pdfjs.getPage(p.idx + 1).then(extractPageText).then(function (t) { texts.push(t); });
        });
      });
      return chainT.then(function () {
        var full = texts.map(function (t, i) {
          return '=== পৃষ্ঠা ' + toBn(i + 1) + ' ===\n' + (t || '(এই পৃষ্ঠায় কোনো টেক্সট লেয়ার পাওয়া যায়নি — স্ক্যান করা পৃষ্ঠা হতে পারে)');
        }).join('\n\n');
        prev.hidden = false;
        prev.innerHTML = '<div class="pdf-extracted-box space-y-2"><div class="pdf-extracted-head flex items-center justify-between gap-2"><strong>এক্সট্র্যাক্ট করা লেখা:</strong>' +
          '<button type="button" class="chip-btn inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text hover:border-emerald-500 cursor-pointer transition-colors" id="pdfCopyExtTxtBtn">কপি করুন</button></div>' +
          '<textarea class="textbox w-full p-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs font-sans text-slate-800 dark:text-studio-text outline-none" rows="7" readonly id="pdfExtTxtArea" aria-label="এক্সট্র্যাক্ট করা লেখা"></textarea></div>';
        $('#pdfExtTxtArea').value = full;
        $('#pdfCopyExtTxtBtn').addEventListener('click', function () {
          navigator.clipboard.writeText(full).then(function () { showToast('লেখা কপি করা হয়েছে!'); });
        });
        if (fmt === 'txt') {
          downloadBlob(new Blob(['\ufeff' + full], { type: 'text/plain;charset=utf-8' }), base + '.txt');
          showToast('টেক্সট (.txt) ফাইল ডাউনলোড হয়েছে!');
        } else {
          var body = texts.map(function (t) {
            return '<div>' + String(t || '').split('\n').map(function (line) {
              return '<p style="font-family:\'Nirmala UI\',\'Calibri\',sans-serif;font-size:12pt;line-height:1.5;margin:0 0 8pt;">' + esc(line) + '</p>';
            }).join('') + '</div>';
          }).join('<br clear="all" style="page-break-before:always" />');
          var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
            '<head><meta charset="utf-8"><title>' + esc(base) + '</title></head><body>' + body + '</body></html>';
          downloadBlob(new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' }), base + '.doc');
          showToast('Word (.doc) ফাইল ডাউনলোড হয়েছে!');
        }
      });
    }).then(function () { setProgress(null); btn.disabled = false; }, function (err) {
      setProgress(null);
      btn.disabled = false;
      showToast('কনভার্ট করতে সমস্যা হয়েছে: ' + ((err && err.message) || ''));
    });
  }

  /* ==================================================================
   * 6A. IMAGES → PDF
   * ================================================================== */
  var imgItems = []; // page-like: { key, name, size, imgUrl, rotation, width, height }

  function addImg2PdfFiles(files) {
    var imgs = files.filter(function (f) { return /^image\//i.test(f.type) || /\.(jpe?g|png|webp|bmp|gif)$/i.test(f.name); });
    if (!imgs.length) { showToast('অনুগ্রহ করে সঠিক ছবি (JPG, PNG, WebP) নির্বাচন করুন।'); return; }
    var chain = Promise.resolve();
    imgs.forEach(function (file) {
      chain = chain.then(function () {
        return readFileDataURL(file).then(function (url) {
          return new Promise(function (resolve) {
            var im = new Image();
            im.onload = function () {
              imgItems.push({ key: 'i' + (pageSeq++), name: file.name, size: file.size, imgUrl: url, rotation: 0, width: im.naturalWidth, height: im.naturalHeight });
              resolve();
            };
            im.onerror = function () { showToast(file.name + ' ছবিটি পড়া যায়নি'); resolve(); };
            im.src = url;
          });
        });
      });
    });
    chain.then(renderImg2PdfUI);
  }

  function renderImg2PdfUI() {
    showStage('img2pdf', imgItems.length > 0);
    if (!imgItems.length) return;
    renderGrid($('#img2pdfGrid'), {
      items: imgItems,
      label: function (it) { return it.name; },
      meta: function (it) { return it.width + '×' + it.height + ' • ' + fmtSize(it.size); },
      actions: function () { return ['rotL', 'rotR', 'zoom', 'del']; },
      sortable: true,
      onReorder: function (order) { imgItems = reorderArray(imgItems, order); renderImg2PdfUI(); },
      onAction: function (act, i) {
        if (act === 'zoom') { previewPages(imgItems, 'ছবি প্রিভিউ', i); return; }
        if (act === 'del') imgItems.splice(i, 1);
        else rotatePage(imgItems[i], act === 'rotL' ? -90 : 90);
        renderImg2PdfUI();
      }
    });
    $('#img2pdfSummary').textContent = toBn(imgItems.length) + 'টি ছবি নির্বাচিত';
  }

  function rasterizeImage(url, rotation, quality) {
    return new Promise(function (resolve, reject) {
      var im = new Image();
      im.onload = function () {
        var rot = ((rotation || 0) % 360 + 360) % 360;
        var swap = rot === 90 || rot === 270;
        var w = swap ? im.naturalHeight : im.naturalWidth;
        var h = swap ? im.naturalWidth : im.naturalHeight;
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.translate(w / 2, h / 2);
        ctx.rotate(rot * Math.PI / 180);
        ctx.drawImage(im, -im.naturalWidth / 2, -im.naturalHeight / 2);
        var dataUrl = c.toDataURL('image/jpeg', quality || 0.92);
        resolve({ dataUrl: dataUrl, bytes: dataUrlToUint8(dataUrl), width: w, height: h });
      };
      im.onerror = function () { reject(new Error('ছবি প্রসেস করা যায়নি')); };
      im.src = url;
    });
  }

  function runImg2Pdf() {
    if (!imgItems.length) { showToast('অন্তত ১টি ছবি যোগ করুন।'); return; }
    var sizeMode = $('#img2pdfPageSize').value;
    var orient = $('#img2pdfOrient').value;
    var margin = parseInt($('#img2pdfMargin').value, 10) || 0;
    var btn = $('#img2pdfRunBtn');
    btn.disabled = true;
    ensurePdfLibs().then(function () {
      return window.PDFLib.PDFDocument.create().then(function (pdf) {
        var chain = Promise.resolve();
        imgItems.forEach(function (it, i) {
          chain = chain.then(function () {
            setProgress(5 + ((i + 1) / imgItems.length) * 85, 'ছবি ' + toBn(i + 1) + '/' + toBn(imgItems.length) + ' যুক্ত হচ্ছে…');
            return rasterizeImage(it.imgUrl, it.rotation).then(function (r) {
              return pdf.embedJpg(r.bytes).then(function (jpg) {
                var pw, ph;
                if (sizeMode === 'fit') { pw = r.width + margin * 2; ph = r.height + margin * 2; }
                else {
                  var dim = sizeMode === 'letter' ? [612, 792] : [595.28, 841.89];
                  var land = orient === 'landscape' || (orient === 'auto' && r.width > r.height);
                  pw = land ? dim[1] : dim[0];
                  ph = land ? dim[0] : dim[1];
                }
                var page = pdf.addPage([pw, ph]);
                var s = Math.min((pw - margin * 2) / r.width, (ph - margin * 2) / r.height);
                page.drawImage(jpg, { x: (pw - r.width * s) / 2, y: (ph - r.height * s) / 2, width: r.width * s, height: r.height * s });
              });
            });
          });
        });
        return chain.then(function () { return pdf.save(); });
      });
    }).then(function (bytes) {
      setProgress(null);
      btn.disabled = false;
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), baseName(imgItems[0].name) + '-images.pdf');
      showToast('ছবি থেকে PDF সফলভাবে ডাউনলোড হয়েছে!');
    }).catch(function (err) {
      setProgress(null);
      btn.disabled = false;
      showToast('PDF তৈরি করতে সমস্যা হয়েছে: ' + ((err && err.message) || ''));
    });
  }

  /* ==================================================================
   * 6B. OFFICE / TEXT → PDF
   * ================================================================== */
  function loadDoc2PdfFile(files) {
    var file = files && files[0];
    if (!file) return;
    var conv = C();
    var kind = conv.kindOf(file);
    var lbl = $('#doc2pdfFileName');
    if (kind === 'docx' || kind === 'doc' || kind === 'pptx' || kind === 'xlsx' || kind === 'rtf') {
      ensurePdfLibs().then(function () {
        setProgress(20, file.name + ' PDF-এ রূপান্তর হচ্ছে…');
        return conv.convertFileToPdf(file, function (n, t) { setProgress(20 + (n / t) * 70, 'স্লাইড ' + toBn(n) + '/' + toBn(t) + ' রেন্ডার হচ্ছে…'); });
      }).then(function (res) {
        setProgress(null);
        lbl.textContent = '✓ ' + file.name + ' → PDF (' + fmtSize(res.bytes.byteLength) + ') ডাউনলোড হয়েছে';
        downloadBlob(new Blob([res.bytes], { type: 'application/pdf' }), baseName(file.name) + '.pdf');
        showToast(file.name + ' সফলভাবে PDF-এ রূপান্তর হয়েছে!');
      }).catch(function (err) {
        setProgress(null);
        showToast((err && err.message) || 'ফাইলটি রূপান্তর করা যায়নি');
      });
      return;
    }
    conv.extractText(file).then(function (text) {
      $('#doc2pdfText').value = text;
      lbl.textContent = 'লোড হয়েছে: ' + file.name + ' (' + fmtSize(file.size) + ')';
      if (!$('#doc2pdfTitle').value) $('#doc2pdfTitle').value = baseName(file.name);
      if (conv.detectScript(text) === 'bijoy') $('#doc2pdfFont').value = 'bijoy';
      showToast('ফাইলের লেখা লোড হয়েছে!');
    }).catch(function () { showToast('ফাইলটি পড়া যায়নি।'); });
  }

  function runDoc2Pdf() {
    var text = $('#doc2pdfText').value;
    if (!text.trim()) { showToast('অনুগ্রহ করে কিছু লেখা দিন অথবা ফাইল আপলোড করুন।'); return; }
    var title = $('#doc2pdfTitle').value.trim();
    var font = $('#doc2pdfFont').value === 'bijoy' ? 'bijoy' : 'uni';
    var size = parseInt($('#doc2pdfFontSize').value, 10) || 13;
    var btn = $('#doc2pdfRunBtn');
    btn.disabled = true;
    ensurePdfLibs().then(function () {
      setProgress(40, 'A4 পৃষ্ঠা রেন্ডার হচ্ছে…');
      return C().renderBlocksToPdf(C().textToBlocks(text, { title: title, font: font, size: size }));
    }).then(function (bytes) {
      setProgress(null);
      btn.disabled = false;
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), (title ? baseName(title) : 'bangla-document') + '.pdf');
      showToast('প্রিন্ট-রেডি A4 PDF সফলভাবে ডাউনলোড হয়েছে!');
    }).catch(function (err) {
      setProgress(null);
      btn.disabled = false;
      showToast('PDF তৈরি করতে সমস্যা হয়েছে: ' + ((err && err.message) || ''));
    });
  }

  /* ==================================================================
   * DRAG & DROP ROUTING (never leaves the PDF tool)
   * ================================================================== */
  function wireDropzone(zone, input, onFiles) {
    if (!zone || !input) return;
    input.addEventListener('change', function () {
      if (input.files && input.files.length) {
        onFiles(Array.prototype.slice.call(input.files));
        input.value = '';
      }
    });
  }
  function wireInput(input, onFiles) {
    if (!input) return;
    input.addEventListener('change', function () {
      if (input.files && input.files.length) {
        onFiles(Array.prototype.slice.call(input.files));
        input.value = '';
      }
    });
  }
  function hasFiles(e) {
    return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') !== -1;
  }

  function routeDroppedFiles(files) {
    switch (currentSubTab) {
      case 'hub': switchPdfTab('merge'); addMergeFiles(files); break;
      case 'merge': addMergeFiles(files); break;
      case 'split': loadSplitFile(files); break;
      case 'compress': loadCompressFile(files); break;
      case 'organize': loadOrgFile(files); break;
      case 'pdf2other': loadPdf2OtherFile(files); break;
      case 'other2pdf':
        if (!$('#other2pdfImgBox').hidden) addImg2PdfFiles(files); else loadDoc2PdfFile(files);
        break;
    }
  }

  function installPaneDrop() {
    var root = $('#tool-pdf');
    var depth = 0;
    root.addEventListener('dragenter', function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth++;
      root.classList.add('is-file-over');
    });
    root.addEventListener('dragover', function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    root.addEventListener('dragleave', function (e) {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) root.classList.remove('is-file-over');
    });
    root.addEventListener('drop', function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation(); // keep the global Bijoy file-drop handler from hijacking the drop
      depth = 0;
      root.classList.remove('is-file-over');
      var files = Array.prototype.slice.call(e.dataTransfer.files || []);
      if (files.length) routeDroppedFiles(files);
    });
  }

  function rotateAll(pages, delta) { pages.forEach(function (p) { rotatePage(p, delta); }); }

  /* ==================================================================
   * INIT
   * ================================================================== */
  function on(id, ev, fn) { var el = $('#' + id); if (el) el.addEventListener(ev, fn); }

  function init() {
    var pdfRoot = $('#tool-pdf');
    if (!pdfRoot) return;
    if (pdfRoot.dataset.pdfBound === '1') {
      var existingTab = pdfRoot.getAttribute('data-initial-tab');
      if (existingTab) switchPdfTab(existingTab, pdfRoot.getAttribute('data-initial-opt') || undefined, true);
      return;
    }
    pdfRoot.dataset.pdfBound = '1';
    initialized = true;

    $$('#tool-pdf .pdf-nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        switchPdfTab(btn.getAttribute('data-pdf-tab'));
      });
    });
    $$('#tool-pdf [data-open-pdf]').forEach(function (card) {
      card.addEventListener('click', function (e) {
        e.preventDefault();
        switchPdfTab(card.getAttribute('data-open-pdf'), card.getAttribute('data-sub-opt'));
      });
    });
    installPaneDrop();

    // Dialogs
    on('pdfPagesDlgClose', 'click', function () { $('#pdfPagesDialog').close(); });
    on('pdfPagesDlgDone', 'click', function () { $('#pdfPagesDialog').close(); });
    on('pdfPagesDlgRotL', 'click', function () { if (pagesDlgItem) { rotateAll(pagesDlgItem.pages, -90); renderPagesDialog(); } });
    on('pdfPagesDlgRotR', 'click', function () { if (pagesDlgItem) { rotateAll(pagesDlgItem.pages, 90); renderPagesDialog(); } });
    on('pdfPagesDialog', 'close', function () { pagesDlgItem = null; renderMergeUI(); });
    on('pdfPreviewClose', 'click', function () { $('#pdfPreviewDialog').close(); });
    on('pdfPreviewPrev', 'click', function () { if (preview.cur > 1) { preview.cur--; showPreviewPage(); } });
    on('pdfPreviewNext', 'click', function () { if (preview.cur < preview.total) { preview.cur++; showPreviewPage(); } });
    on('pdfPreviewZoomIn', 'click', function () { applyPreviewZoom((preview.zoom || 100) + 25); });
    on('pdfPreviewZoomOut', 'click', function () { applyPreviewZoom((preview.zoom || 100) - 25); });
    on('pdfPreviewZoomReset', 'click', function () { applyPreviewZoom(100); });
    on('pdfPreviewDialog', 'keydown', function (e) {
      if (e.key === 'ArrowLeft' && preview.cur > 1) { preview.cur--; showPreviewPage(); }
      else if (e.key === 'ArrowRight' && preview.cur < preview.total) { preview.cur++; showPreviewPage(); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); applyPreviewZoom((preview.zoom || 100) + 25); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); applyPreviewZoom((preview.zoom || 100) - 25); }
      else if (e.key === '0') { e.preventDefault(); applyPreviewZoom(100); }
    });
    on('pdfPreviewStage', 'click', function (e) {
      var fig = e.target.closest('.pdf-preview-fig');
      if (fig) {
        applyPreviewZoom(preview.zoom > 100 ? 100 : 175);
      }
    });

    // 1. Merge
    wireDropzone($('#pdfMergeDropzone'), $('#pdfMergeInput'), addMergeFiles);
    wireInput($('#pdfMergeAddMore'), addMergeFiles);
    on('pdfMergeSortBtn', 'click', function () {
      mergeItems.sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); });
      renderMergeUI();
    });
    on('pdfMergeRotLeftAll', 'click', function () { mergeItems.forEach(function (it) { rotateAll(it.pages, -90); }); renderMergeUI(); });
    on('pdfMergeRotRightAll', 'click', function () { mergeItems.forEach(function (it) { rotateAll(it.pages, 90); }); renderMergeUI(); });
    on('pdfMergeClearBtn', 'click', function () { mergeItems = []; renderMergeUI(); });
    on('pdfMergeRunBtn', 'click', runMergePdf);

    // 2. Split
    wireDropzone($('#pdfSplitDropzone'), $('#pdfSplitInput'), loadSplitFile);
    $$('input[name="pdfSplitMode"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var burst = $('input[name="pdfSplitMode"]:checked').value === 'burst';
        $('#pdfSplitRangeControls').hidden = burst;
        $('#pdfSplitBurstControls').hidden = !burst;
      });
    });
    on('pdfSplitRange', 'input', function () {
      if (!splitState) return;
      var set = new Set();
      parseRangeGroups($('#pdfSplitRange').value, splitState.pages.length).forEach(function (g) { g.pages.forEach(function (p) { set.add(p); }); });
      splitState.selected = set;
      renderSplitUI();
    });
    on('pdfSplitSelectAllBtn', 'click', function () {
      if (!splitState) return;
      if (splitState.selected.size === splitState.pages.length) splitState.selected.clear();
      else for (var i = 1; i <= splitState.pages.length; i++) splitState.selected.add(i);
      $('#pdfSplitRange').value = setToRangeString(splitState.selected, splitState.pages.length);
      renderSplitUI();
    });
    on('pdfSplitRotLeftAll', 'click', function () { if (splitState) { rotateAll(splitState.pages, -90); renderSplitUI(); } });
    on('pdfSplitRotRightAll', 'click', function () { if (splitState) { rotateAll(splitState.pages, 90); renderSplitUI(); } });
    on('pdfSplitResetBtn', 'click', function () { splitState = null; renderSplitUI(); });
    on('pdfSplitRunBtn', 'click', runSplitPdf);

    // 3. Compress
    wireDropzone($('#pdfCompressDropzone'), $('#pdfCompressInput'), loadCompressFile);
    on('pdfCompressRotLeftAll', 'click', function () { if (compressState) { rotateAll(compressState.pages, -90); invalidateCompress(); renderCompressUI(); } });
    on('pdfCompressRotRightAll', 'click', function () { if (compressState) { rotateAll(compressState.pages, 90); invalidateCompress(); renderCompressUI(); } });
    $$('input[name="pdfCompressLevel"]').forEach(function (r) { r.addEventListener('change', invalidateCompress); });
    on('pdfCompressGray', 'change', invalidateCompress);
    on('pdfCompressResetBtn', 'click', function () { compressState = null; renderCompressUI(); });
    on('pdfCompressRunBtn', 'click', runCompressPdf);
    on('pdfCompressDownloadBtn', 'click', downloadCompressed);
    on('pdfCompressCompareBtn', 'click', function () { openCompare(1); });
    on('pdfCompressRetryBtn', 'click', function () {
      invalidateCompress();
      var opts = $('#pdfCompressStage .pdf-options-box');
      if (opts) opts.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // 4. Organize
    wireDropzone($('#pdfOrgDropzone'), $('#pdfOrgInput'), loadOrgFile);
    on('pdfOrgRotLeftAll', 'click', function () { if (orgState) { rotateAll(orgState.pages, -90); renderOrgUI(); } });
    on('pdfOrgRotRightAll', 'click', function () { if (orgState) { rotateAll(orgState.pages, 90); renderOrgUI(); } });
    on('pdfOrgAddBlank', 'click', function () {
      if (!orgState) return;
      var ref = orgState.pages.filter(function (p) { return !p.isBlank; })[0];
      var add = function (w, h) { orgState.pages.push({ key: 'p' + (pageSeq++), isBlank: true, rotation: 0, w: w, h: h }); renderOrgUI(); };
      if (ref) ref.doc.pdfjs.getPage(ref.idx + 1).then(function (pg) { var v = pg.getViewport({ scale: 1 }); add(v.width, v.height); });
      else add(595.28, 841.89);
    });
    on('pdfOrgReverseBtn', 'click', function () { if (orgState) { orgState.pages.reverse(); renderOrgUI(); } });
    on('pdfOrgResetBtn', 'click', function () { orgState = null; renderOrgUI(); });
    on('pdfOrgRunBtn', 'click', runOrgPdf);

    // 5. PDF → others
    wireDropzone($('#pdfToOtherDropzone'), $('#pdfToOtherInput'), loadPdf2OtherFile);
    $$('input[name="pdfToOtherFmt"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var v = $('input[name="pdfToOtherFmt"]:checked').value;
        $('#pdfToImgDpiWrap').hidden = !(v === 'jpg' || v === 'png');
      });
    });
    on('pdfToOtherRotLeftAll', 'click', function () { if (p2oState) { rotateAll(p2oState.pages, -90); renderPdf2OtherUI(); } });
    on('pdfToOtherRotRightAll', 'click', function () { if (p2oState) { rotateAll(p2oState.pages, 90); renderPdf2OtherUI(); } });
    on('pdfToOtherResetBtn', 'click', function () { p2oState = null; renderPdf2OtherUI(); });
    on('pdfToOtherRunBtn', 'click', runPdf2Other);

    // 6. Others → PDF
    $$('input[name="otherToPdfMode"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var img = $('input[name="otherToPdfMode"]:checked').value === 'img2pdf';
        $('#other2pdfImgBox').hidden = !img;
        $('#other2pdfDocBox').hidden = img;
      });
    });
    wireDropzone($('#img2pdfDropzone'), $('#img2pdfInput'), addImg2PdfFiles);
    wireInput($('#img2pdfAddMore'), addImg2PdfFiles);
    on('img2pdfRotAll', 'click', function () { rotateAll(imgItems, 90); renderImg2PdfUI(); });
    on('img2pdfClearBtn', 'click', function () { imgItems = []; renderImg2PdfUI(); });
    on('img2pdfRunBtn', 'click', runImg2Pdf);
    wireInput($('#doc2pdfInput'), loadDoc2PdfFile);
    on('doc2pdfRunBtn', 'click', runDoc2Pdf);

    window.addEventListener('th:langchange', function () {
      if (mergeItems.length) renderMergeUI();
      if (splitState) renderSplitUI();
      if (compressState) renderCompressUI();
      if (orgState) renderOrgUI();
      if (p2oState) renderPdf2OtherUI();
      if (imgItems.length) renderImg2PdfUI();
      if (pagesDlgItem) renderPagesDialog();
    });

    var pdfRoot = $('#tool-pdf');
    var initTab = pdfRoot && pdfRoot.getAttribute('data-initial-tab');
    var initOpt = pdfRoot && pdfRoot.getAttribute('data-initial-opt');
    if (initTab) {
      switchPdfTab(initTab, initOpt || undefined, true);
    }
  }

  window.TechHatPDF = { init: init, switchTab: switchPdfTab };

  // Auto-init on dedicated Astro PDF pages where #tool-pdf is already visible
  var pdfEl = $('#tool-pdf');
  if (pdfEl && !pdfEl.hidden) {
    init();
  }
})();
