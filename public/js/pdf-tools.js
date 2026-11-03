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

  function openPdfDoc(bytes, name, password, isRetryPrompt) {
    var buffer = bytes instanceof ArrayBuffer ? bytes : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    var params = { data: new Uint8Array(buffer.slice(0)) };
    if (password) params.password = password;
    return window.pdfjsLib.getDocument(params).promise.then(function (pdfjs) {
      return inspectPdfEncryptionMeta(buffer, password || '').then(function (sec) {
        return { id: docSeq++, name: name, buffer: buffer, password: password || '', security: sec, pdfjs: pdfjs, numPages: pdfjs.numPages, thumbs: {}, thumbUrls: {} };
      });
    }).catch(function (err) {
      if (err && (err.name === 'PasswordException' || /password/i.test(err.message || ''))) {
        if (!password && !isRetryPrompt) {
          return autoRecoverPdfPassword(buffer, name).then(function (recoveredPw) {
            if (recoveredPw !== null) {
              return openPdfDoc(buffer, name, recoveredPw, true).then(function (doc) {
                if (doc.security) {
                  doc.security.autoRecovered = true;
                  doc.security.recoveredPassword = recoveredPw;
                }
                return doc;
              });
            }
            return promptAndRetry(false);
          });
        }
        return promptAndRetry(true);
      }
      throw new Error(name + ' — ফাইলটি পড়া যায়নি (ত্রুটিযুক্ত PDF)');
    });

    function promptAndRetry(isWrong) {
      return promptPdfPassword(name, isWrong).then(function (pw) {
        if (pw === null) throw new Error(tr(name + ' — পাসওয়ার্ড না দেওয়ায় ফাইলটি বাদ দেওয়া হয়েছে', name + ' — Skipped (password required)'));
        return openPdfDoc(buffer, name, pw, true);
      });
    }
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

  var TECHHAT_MASTER_OWNER_KEY = 'TechHat#MasterKey!2026';

  function savePdfVaultPassword(idHex, pw) {
    if (!idHex || !pw) return;
    try {
      var raw = localStorage.getItem('thbc-pdf-vault');
      var map = raw ? JSON.parse(raw) : {};
      map[idHex] = pw;
      var keys = Object.keys(map);
      if (keys.length > 60) delete map[keys[0]];
      localStorage.setItem('thbc-pdf-vault', JSON.stringify(map));
    } catch (e) {}
  }

  function getPdfVaultPassword(idHex) {
    if (!idHex) return null;
    try {
      var raw = localStorage.getItem('thbc-pdf-vault');
      var map = raw ? JSON.parse(raw) : {};
      return map[idHex] || null;
    } catch (e) {
      return null;
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

  function extractPwFromUserPad(userPad) {
    for (var len = 0; len <= 32; len++) {
      var match = true;
      for (var k = 0; len + k < 32; k++) {
        if (userPad[len + k] !== PDF_ENC_PAD[k]) { match = false; break; }
      }
      if (match) {
        var s = '';
        for (var i = 0; i < len; i++) s += String.fromCharCode(userPad[i]);
        return s;
      }
    }
    return null;
  }

  function computePdfFileKeyFromUserPad(userPad, O, pBuf, id0, R, keyLen, encryptMetadata) {
    var hashInputs = [userPad, O.slice(0, 32), pBuf, id0];
    if (R >= 4 && !encryptMetadata) {
      hashInputs.push(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
    }
    var hash = md5Bytes(concatUint8(hashInputs));
    if (R >= 3) {
      for (var r = 0; r < 50; r++) {
        hash = md5Bytes(hash.slice(0, keyLen));
      }
    }
    return hash.slice(0, keyLen);
  }

  function verifyPdfFileKeyAgainstU(fileKey, U, id0, R) {
    if (R === 2) {
      var uCheck2 = rc4Bytes(fileKey, PDF_ENC_PAD);
      for (var c2 = 0; c2 < 32; c2++) {
        if (uCheck2[c2] !== U[c2]) return false;
      }
      return true;
    }
    var uHash = md5Bytes(concatUint8([PDF_ENC_PAD, id0]));
    for (var step = 0; step < 20; step++) {
      var stepKey = new Uint8Array(fileKey.length);
      for (var kb = 0; kb < fileKey.length; kb++) stepKey[kb] = fileKey[kb] ^ step;
      uHash = rc4Bytes(stepKey, uHash);
    }
    for (var c3 = 0; c3 < 16; c3++) {
      if (uHash[c3] !== U[c3]) return false;
    }
    return true;
  }

  function recoverUserPadFromOwnerPw(ownerPw, O, R, keyLen) {
    var oKey = md5Bytes(padPdfPassword(ownerPw || ''));
    if (R >= 3) {
      for (var i = 0; i < 50; i++) oKey = md5Bytes(oKey.slice(0, keyLen));
    }
    oKey = oKey.slice(0, keyLen);
    if (R === 2) {
      return rc4Bytes(oKey, O.slice(0, 32));
    }
    var acc = O.slice(0, 32);
    for (var step = 19; step >= 0; step--) {
      var sk = new Uint8Array(keyLen);
      for (var kb = 0; kb < keyLen; kb++) sk[kb] = oKey[kb] ^ step;
      acc = rc4Bytes(sk, acc);
    }
    return acc;
  }

  function extractEncryptParams(sdoc) {
    try {
      var PDFLib = window.PDFLib;
      var ctx = sdoc.context;
      var encRef = ctx.trailerInfo && ctx.trailerInfo.Encrypt;
      if (!encRef) return { encrypted: false };
      var enc = ctx.lookup(encRef);
      if (!enc || typeof enc.get !== 'function') return { encrypted: true, supported: false };

      var filterObj = ctx.lookup(enc.get(PDFLib.PDFName.of('Filter')));
      if (filterObj && filterObj.toString() !== '/Standard') return { encrypted: true, supported: false };

      var vObj = ctx.lookup(enc.get(PDFLib.PDFName.of('V')));
      var rObj = ctx.lookup(enc.get(PDFLib.PDFName.of('R')));
      var pObj = ctx.lookup(enc.get(PDFLib.PDFName.of('P')));
      var V = vObj && typeof vObj.asNumber === 'function' ? vObj.asNumber() : 0;
      var R = rObj && typeof rObj.asNumber === 'function' ? rObj.asNumber() : 0;
      var P = pObj && typeof pObj.asNumber === 'function' ? pObj.asNumber() : -4;
      var lenObj = ctx.lookup(enc.get(PDFLib.PDFName.of('Length')));
      var bitLen = (V === 1) ? 40 : (lenObj && typeof lenObj.asNumber === 'function' ? lenObj.asNumber() : (V >= 4 ? 128 : 40));
      var keyLen = bitLen / 8;

      var isRc4 = (V === 1 || V === 2 || V === 4) && (R === 2 || R === 3 || R === 4) && keyLen >= 5 && keyLen <= 16;
      if (V === 4 && isRc4) {
        var cf = ctx.lookup(enc.get(PDFLib.PDFName.of('CF')));
        var stmF = ctx.lookup(enc.get(PDFLib.PDFName.of('StmF')));
        var cfName = stmF ? stmF.toString().replace(/^\//, '') : 'StdCF';
        if (cf && typeof cf.get === 'function') {
          var stdCf = ctx.lookup(cf.get(PDFLib.PDFName.of(cfName)));
          if (stdCf && typeof stdCf.get === 'function') {
            var cfm = ctx.lookup(stdCf.get(PDFLib.PDFName.of('CFM')));
            if (cfm && cfm.toString() !== '/V2') isRc4 = false;
          }
        }
      }

      var oObj = ctx.lookup(enc.get(PDFLib.PDFName.of('O')));
      var uObj = ctx.lookup(enc.get(PDFLib.PDFName.of('U')));
      var O = oObj && typeof oObj.asBytes === 'function' ? oObj.asBytes() : null;
      var U = uObj && typeof uObj.asBytes === 'function' ? uObj.asBytes() : null;

      var idArr = ctx.lookup(ctx.trailerInfo.ID);
      var id0Obj = idArr && typeof idArr.get === 'function' ? ctx.lookup(idArr.get(0)) : null;
      var id0 = id0Obj && typeof id0Obj.asBytes === 'function' ? id0Obj.asBytes() : new Uint8Array(0);
      var pBuf = new Uint8Array([P & 0xff, (P >> 8) & 0xff, (P >> 16) & 0xff, (P >> 24) & 0xff]);

      var encMetaObj = ctx.lookup(enc.get(PDFLib.PDFName.of('EncryptMetadata')));
      var encryptMetadata = !(encMetaObj && encMetaObj.toString() === 'false');

      var algoLabel = V === 5 ? '256-bit AES' : (V === 4 && !isRc4 ? '128-bit AES' : (bitLen + '-bit RC4'));
      return {
        encrypted: true,
        supported: Boolean(isRc4 && O && U),
        encRef: encRef,
        V: V,
        R: R,
        P: P,
        pBuf: pBuf,
        keyLen: keyLen,
        O: O,
        U: U,
        id0: id0,
        idHex: bytesToHex(id0),
        encryptMetadata: encryptMetadata,
        algoLabel: algoLabel,
        canPrint: (P & 4) !== 0,
        canModify: (P & 8) !== 0,
        canCopy: (P & 16) !== 0,
        canAssemble: (P & 1024) !== 0
      };
    } catch (e) {
      return { encrypted: false };
    }
  }

  function inspectPdfEncryptionMeta(buffer, unlockedPassword) {
    return window.PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true }).then(function (sdoc) {
      var info = extractEncryptParams(sdoc);
      if (!info.encrypted) {
        return { encrypted: false, lockType: 'none', algoLabel: 'None', canPrint: true, canCopy: true, canModify: true };
      }
      return {
        encrypted: true,
        lockType: unlockedPassword ? 'user' : 'owner',
        algoLabel: info.algoLabel || '128-bit Standard',
        canPrint: info.canPrint,
        canCopy: info.canCopy,
        canModify: info.canModify,
        canAssemble: info.canAssemble
      };
    }).catch(function () {
      return { encrypted: Boolean(unlockedPassword), lockType: unlockedPassword ? 'user' : 'none', algoLabel: 'Standard' };
    });
  }

  function autoRecoverPdfPassword(buffer, fileName) {
    return window.PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true }).then(function (sdoc) {
      var ep = extractEncryptParams(sdoc);
      if (!ep.encrypted || !ep.supported) return null;

      // 1. Check local vault by file ID[0]
      var vaulted = getPdfVaultPassword(ep.idHex);
      if (vaulted !== null) {
        var vFk = computePdfFileKeyFromUserPad(padPdfPassword(vaulted), ep.O, ep.pBuf, ep.id0, ep.R, ep.keyLen, ep.encryptMetadata);
        if (verifyPdfFileKeyAgainstU(vFk, ep.U, ep.id0, ep.R)) return vaulted;
      }

      var base = baseName(fileName || '');
      // 2. Algorithm 3.7: Recover exact User Password from Owner Password candidates (empty, TechHat master key, common owner keys)
      var ownerCands = ['', TECHHAT_MASTER_OWNER_KEY, 'owner', 'admin', 'password', 'master', '1234', '123456', base];
      for (var oi = 0; oi < ownerCands.length; oi++) {
        var recPad = recoverUserPadFromOwnerPw(ownerCands[oi], ep.O, ep.R, ep.keyLen);
        var oFk = computePdfFileKeyFromUserPad(recPad, ep.O, ep.pBuf, ep.id0, ep.R, ep.keyLen, ep.encryptMetadata);
        if (verifyPdfFileKeyAgainstU(oFk, ep.U, ep.id0, ep.R)) {
          var extracted = extractPwFromUserPad(recPad);
          if (extracted !== null) return extracted;
        }
      }

      // 3. Fast User Password dictionary + filename tokens + 1-4 digit PINs
      var userCands = [
        '', ' ', '1234', '12345', '123456', '1234567', '12345678', '123456789', '1234567890',
        '0000', '000000', '1111', '111111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
        '4321', '654321', '123123', '112233', 'password', 'Password', 'PASSWORD', 'admin', 'Admin',
        'root', 'user', 'test', 'pdf', 'PDF', 'secret', '123', 'abc123', 'qwerty', 'bangladesh', 'dhaka', 'techhat'
      ];
      if (base) {
        userCands.push(base, base.toLowerCase(), base.toUpperCase());
        var tokens = base.split(/[\s_\-.]+/).filter(Boolean);
        for (var ti = 0; ti < tokens.length; ti++) {
          userCands.push(tokens[ti], tokens[ti].toLowerCase());
        }
      }
      for (var ui = 0; ui < userCands.length; ui++) {
        var cand = userCands[ui];
        var uFk = computePdfFileKeyFromUserPad(padPdfPassword(cand), ep.O, ep.pBuf, ep.id0, ep.R, ep.keyLen, ep.encryptMetadata);
        if (verifyPdfFileKeyAgainstU(uFk, ep.U, ep.id0, ep.R)) return cand;
      }

      // 4. Scan 1-to-4 digit numeric PINs (0..9, 00..99, 000..999, 0000..9999)
      for (var d1 = 0; d1 < 10; d1++) {
        var s1 = String(d1);
        var fk1 = computePdfFileKeyFromUserPad(padPdfPassword(s1), ep.O, ep.pBuf, ep.id0, ep.R, ep.keyLen, ep.encryptMetadata);
        if (verifyPdfFileKeyAgainstU(fk1, ep.U, ep.id0, ep.R)) return s1;
      }
      for (var d3 = 0; d3 < 1000; d3++) {
        var s3 = (d3 < 10 ? '00' : (d3 < 100 ? '0' : '')) + d3;
        var fk3 = computePdfFileKeyFromUserPad(padPdfPassword(s3), ep.O, ep.pBuf, ep.id0, ep.R, ep.keyLen, ep.encryptMetadata);
        if (verifyPdfFileKeyAgainstU(fk3, ep.U, ep.id0, ep.R)) return s3;
      }
      for (var d4 = 0; d4 < 10000; d4++) {
        var s4 = (d4 < 10 ? '000' : (d4 < 100 ? '00' : (d4 < 1000 ? '0' : ''))) + d4;
        var fk4 = computePdfFileKeyFromUserPad(padPdfPassword(s4), ep.O, ep.pBuf, ep.id0, ep.R, ep.keyLen, ep.encryptMetadata);
        if (verifyPdfFileKeyAgainstU(fk4, ep.U, ep.id0, ep.R)) return s4;
      }
      return null;
    }).catch(function () {
      return null;
    });
  }

  /**
   * Decrypts owner-password / user-password protected PDFs in-place inside pdf-lib.
   * Returns true if all streams are verified decrypted; false if raster fallback is needed.
   */
  function tryDecryptPdfLibDoc(sdoc, expectedPages, password) {
    try {
      var PDFLib = window.PDFLib;
      var ctx = sdoc.context;
      var ep = extractEncryptParams(sdoc);
      if (!ep.encrypted) return true;
      if (!ep.supported) return false;

      var fileKey = null;
      var pwCands = [password || '', ''];
      for (var pi = 0; pi < pwCands.length && !fileKey; pi++) {
        var candFk = computePdfFileKeyFromUserPad(padPdfPassword(pwCands[pi]), ep.O, ep.pBuf, ep.id0, ep.R, ep.keyLen, ep.encryptMetadata);
        if (verifyPdfFileKeyAgainstU(candFk, ep.U, ep.id0, ep.R)) fileKey = candFk;
      }
      if (!fileKey) {
        var ownCands = [password || '', '', TECHHAT_MASTER_OWNER_KEY];
        for (var oi = 0; oi < ownCands.length && !fileKey; oi++) {
          var recPad = recoverUserPadFromOwnerPw(ownCands[oi], ep.O, ep.R, ep.keyLen);
          var ownFk = computePdfFileKeyFromUserPad(recPad, ep.O, ep.pBuf, ep.id0, ep.R, ep.keyLen, ep.encryptMetadata);
          if (verifyPdfFileKeyAgainstU(ownFk, ep.U, ep.id0, ep.R)) fileKey = ownFk;
        }
      }
      if (!fileKey) return false;

      var encRef = ep.encRef;
      var keyLen = ep.keyLen;
      var encryptMetadata = ep.encryptMetadata;
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

  /**
   * Encrypts an unencrypted PDF Uint8Array with PDF 1.7 Standard 128-bit RC4 Security (V=2, R=3).
   */
  function encryptPdfBytes(unencryptedBytes, opts) {
    opts = opts || {};
    var PDFLib = window.PDFLib;
    return PDFLib.PDFDocument.load(unencryptedBytes, { updateMetadata: false }).then(function (sdoc) {
      sdoc.flush();
      var ctx = sdoc.context;
      delete ctx.trailerInfo.Encrypt;

      var keyLen = 16; // 128-bit RC4
      var P = 0xFFFFF0C0 | 0; // Base Revision 3 permission flags (-3904)
      if (opts.allowPrint !== false) P |= (1 << 2) | (1 << 11);
      if (opts.allowCopy) P |= (1 << 4) | (1 << 9);
      if (opts.allowModify) P |= (1 << 3) | (1 << 5) | (1 << 8) | (1 << 10);
      var pBuf = new Uint8Array([P & 0xff, (P >> 8) & 0xff, (P >> 16) & 0xff, (P >> 24) & 0xff]);

      var seedStr = String(Date.now()) + ':' + unencryptedBytes.length + ':' + Math.random();
      var seedBytes = new Uint8Array(seedStr.length);
      for (var si = 0; si < seedStr.length; si++) seedBytes[si] = seedStr.charCodeAt(si) & 0xff;
      var id0 = md5Bytes(seedBytes);
      var idHex = bytesToHex(id0);

      var userPw = opts.userPassword || '';
      var ownerPw = opts.ownerPassword || TECHHAT_MASTER_OWNER_KEY;
      var userPad = padPdfPassword(userPw);
      var ownerPad = padPdfPassword(ownerPw);

      // Save in local browser vault so Decrypt PDF on this device can always auto-unlock even with custom ownerPw
      if (userPw) savePdfVaultPassword(idHex, userPw);

      // Algorithm 3.3: Compute O
      var oKey = md5Bytes(ownerPad);
      for (var i = 0; i < 50; i++) oKey = md5Bytes(oKey.slice(0, keyLen));
      var O = rc4Bytes(oKey.slice(0, keyLen), userPad);
      for (var stepO = 1; stepO <= 19; stepO++) {
        var stepKeyO = new Uint8Array(keyLen);
        for (var kbO = 0; kbO < keyLen; kbO++) stepKeyO[kbO] = oKey[kbO] ^ stepO;
        O = rc4Bytes(stepKeyO, O);
      }

      // Algorithm 3.2: Compute file encryption key
      var fileKey = computePdfFileKeyFromUserPad(userPad, O, pBuf, id0, 3, keyLen, true);

      // Algorithm 3.5: Compute U
      var uHash = md5Bytes(concatUint8([PDF_ENC_PAD, id0]));
      for (var stepU = 0; stepU <= 19; stepU++) {
        var stepKeyU = new Uint8Array(keyLen);
        for (var kbU = 0; kbU < keyLen; kbU++) stepKeyU[kbU] = fileKey[kbU] ^ stepU;
        uHash = rc4Bytes(stepKeyU, uHash);
      }
      var U = concatUint8([uHash, new Uint8Array(16)]);

      var seen = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
      ctx.indirectObjects.forEach(function (obj, ref) {
        var n = ref.objectNumber, g = ref.generationNumber;
        var suffix = new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, g & 0xff, (g >> 8) & 0xff]);
        var objKey = md5Bytes(concatUint8([fileKey, suffix])).slice(0, Math.min(keyLen + 5, 16));
        decryptPdfObject(obj, objKey, PDFLib, false, seen);
      });

      var encDict = ctx.obj({
        Filter: 'Standard',
        V: 2,
        R: 3,
        Length: 128,
        P: P,
        O: PDFLib.PDFHexString.of(bytesToHex(O)),
        U: PDFLib.PDFHexString.of(bytesToHex(U))
      });
      var encRef = ctx.register(encDict);
      ctx.trailerInfo.Encrypt = encRef;
      var pdfIdHex = PDFLib.PDFHexString.of(idHex);
      ctx.trailerInfo.ID = ctx.obj([pdfIdHex, pdfIdHex]);

      return sdoc.save({ useObjectStreams: false });
    });
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
    other2pdf: '/pdf/other-to-pdf',
    decrypt: '/pdf/decrypt',
    encrypt: '/pdf/encrypt'
  };
  var PDF_SUB_TITLES = {
    merge: { bn: 'মার্জ PDF', en: 'Merge PDF' },
    split: { bn: 'স্প্লিট PDF', en: 'Split PDF' },
    compress: { bn: 'কম্প্রেস PDF', en: 'Compress PDF' },
    organize: { bn: 'অর্গানাইজ ও এডিট PDF', en: 'Organize & Edit PDF' },
    pdf2other: { bn: 'PDF → অন্য ফরম্যাট', en: 'PDF Converter' },
    other2pdf: { bn: 'অন্য ফাইল → PDF', en: 'Convert to PDF' },
    decrypt: { bn: 'ডিক্রিপ্ট PDF', en: 'Decrypt PDF' },
    encrypt: { bn: 'এনক্রিপ্ট PDF', en: 'Encrypt PDF' }
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
   * 5. PDF → JPG / PNG / WORD / TEXT (WITH SMART 2D LAYOUT, BIJOY/UNICODE FIX & AI OCR)
   * ================================================================== */
  var p2oState = null;
  var tesseractReady = null;

  var C1_TO_CP1252 = {
    0x80: '\u20AC', 0x82: '\u201A', 0x83: '\u0192', 0x84: '\u201E', 0x85: '\u2026',
    0x86: '\u2020', 0x87: '\u2021', 0x88: '\u02C6', 0x89: '\u2030', 0x8A: '\u0160',
    0x8B: '\u2039', 0x8C: '\u0152', 0x8E: '\u017D', 0x91: '\u2018', 0x92: '\u2019',
    0x93: '\u201C', 0x94: '\u201D', 0x95: '\u2022', 0x96: '\u2013', 0x97: '\u2014',
    0x98: '\u02DC', 0x99: '\u2122', 0x9A: '\u0161', 0x9B: '\u203A', 0x9C: '\u0153',
    0x9E: '\u017E', 0x9F: '\u0178'
  };

  function normalizeC1ToCp1252(str) {
    if (!str) return '';
    return String(str).replace(/[\u0080-\u009F]/g, function (ch) {
      var code = ch.charCodeAt(0);
      return C1_TO_CP1252[code] || ch;
    });
  }

  function isBijoyFontName(fontHint) {
    if (!fontHint) return false;
    var s = String(fontHint).toLowerCase();
    if (/unicode|nikosh|kalpurush|solaiman|siyam|vrinda|nirmala|shonar|adorsho|charukola|bornomala|mitra|mukti|akaash|lohit|noto|anek|hind|baloo|atma|galada|mina|omj\b/.test(s)) {
      return false;
    }
    return /sutonny|tonnybangla|sulekha|chanchal|rinky|boishakhi|prothoma|bensen|kongsho|shorif|bijoy|mj\b|cmj\b|bmj\b|emj\b/.test(s);
  }

  function hasBijoyGlyphSignature(str) {
    if (!str) return false;
    var s = normalizeC1ToCp1252(str);
    if (/[†‡ˆ‰Š‹ŒŽ‘’“”•–˜™š›œžŸ©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿À-ÿ\u03BC]/.test(s)) return true;
    if (/\b(?:Avwg|Avgvi|evsjv|Zvi|Zv‡`i|K‡i|Ki‡Z|n‡q‡Q|wKš‘|Rb¨|gvbyl|gvbly|myLx|mLyx|bvwUKvq|DÏxcK|cÖkœ|DËi|mwVK|wb‡Pi|\d+wU)\b/.test(s)) return true;
    var eng = window.BijoyEngine;
    if (eng && typeof eng.detect === 'function' && eng.detect(s) === 'bijoy') return true;
    return false;
  }

  function normalizeBijoyPreConvert(str) {
    if (!str) return '';
    var s = normalizeC1ToCp1252(str)
      // Greek mu (\u03BC) from PDF Adobe Glyph List (/mu) -> Micro sign (\u00B5 = ক্র in SutonnyMJ)
      .replace(/\u03BC/g, '\u00B5')
      // Em-dash (\u2014) is only '্ত' in SutonnyMJ when preceded by half-form prefix (š, ›, ¯, ¤, •, ®).
      // Otherwise it is an actual em-dash (\u00D1 in SutonnyMJ -> '—').
      .replace(/([^\u0161\u203A\u00AF\u00A4\u2022\u00AE]|^)\u2014/g, '$1\u00D1');

    // Convert PostScript quoteleft (\u2018 ‘) to Bijoy grave (` = দ) when used as consonant দ:
    // 1) Before B+y/z ("‘By" -> "`yB" দুই)
    s = s.replace(/[\u2018\u2019'`]B([yz])/g, '`$1B');
    // 2) Inside a word after any Bijoy char or pre-base kar ("w‘‡q" -> "w`‡q" দিয়ে, "b‘xi" -> "b`xi" নদীর)
    s = s.replace(/([A-Za-z\u2020\u2021\u02C6\u2030\u00A9&])\u2018/g, '$1`');
    // 3) At start of word when followed by dependent kar/phala or common দ-clusters ("‘qvjy" -> "`qvjy" দয়ালু, "‘vI" -> "`vI" দাও)
    s = s.replace(/\u2018(?=[vxxyz~\u201C\u2013\u201E\u2026\u00A8\u00D6\u00AA\u00AB]|qv|wL|wZ|wY|w`|e\u00A9)/g, '`');

    // Rejoin words broken after pre-base kar: e.g. "cÖK…w Zi" -> "cÖK…wZi", "¯§„w Z" -> "¯§„wZ"
    s = s.replace(/([w\u2020\u2021\u02C6\u2030])\s+([A-Za-z`_]+)/g, '$1$2');

    // Rule 1: Pre-base kar (w, †, ‡, ˆ, ‰) followed by subscript kar/phala -> swap back! ("g‡yLvk" -> "gy‡Lvk")
    s = s.replace(/([w\u2020\u2021\u02C6\u2030])([yz~\u201C\u2013\u00E6\u201A\u0192\u201E\u2026\u00D6\u00AA\u00AB])/g, '$2$1');

    // Rule 2: Post-base kar (v, x) followed by phala (Ö, ª, «, ¨, etc.) -> swap back! ("AvKvÖšÍ" -> "AvKÖvšÍ")
    s = s.replace(/([vx])([\u00D6\u00AA\u00AB\u00A8^\u00A1\u00A6\u0178\u00AC\u00AD\u00F8\u00A5\u00A7\u0153\u00E8])/g, '$2$1');

    // Rule 3: C1 + C2 + (phala)? + subscriptKar + anyKar -> move subscriptKar back to C1!
    // Fixes "mLyx" -> "myLx" (সুখী), "gZ…¨y" -> "g…Z¨y" (মৃত্যু)
    s = s.replace(/([K-Z_`a-np-tw])([K-Z_`a-np-t])([\u00A8\u00D6\u00AA\u00AB^\u00A1\u00A6\u0178\u00AC\u00AD\u00F8\u00A5\u00A7\u0153\u00E8]?)([yz~\u201C\u2013\u00E6\u201A\u0192\u201E\u2026])([vxyz~\u201C\u2013\u00E6\u201A\u0192\u201E\u2026])/g, '$1$4$2$3$5');

    // Rule 4: Independent vowel (B-J) cannot take subscript kar
    s = s.replace(/([`K-Z_a-np-t])([B-J])([yz~\u201C\u2013\u201A\u0192\u201E\u2026])/g, '$1$3$2');

    // Rule 5: Hyphen or tilde transposed in gj-Z / gj~Z -> g~jZ (মূলত)
    s = s.replace(/\bgj[-~]Z\b/g, 'g~jZ');

    // Rule 6: Transposed ri-kar (…) / u-kar across final consonant
    s = s.replace(/([K-Z_`a-np-t\u00A1-\u00FF])([K-Z_`a-np-t])([\u201E\u2026])/g, '$1$3$2');
    s = s.replace(/([\u00A1-\u00FF])([K-Z_`a-np-t])([yz~])(?![vxyz~\u201E\u2026])/g, '$1$3$2');
    s = s.replace(/\bgvbly/g, 'gvbyl')
         .replace(/\b(A?)mLy(x?)\b/g, '$1myL$2')
         .replace(/\bNgy\b/g, 'Nyg')
         .replace(/\bwecjy\b/g, 'wecyj')
         .replace(/\bcZzj\b/g, 'cyZzj')
         .replace(/\bbZbz\b/g, 'bZzb')
         .replace(/\bZibz\b/g, 'ZiyY')
         .replace(/\bG[kK]mgg\b/g, 'GKmgq');

    return s;
  }

  function convertBijoyPreserveRoman(str) {
    var eng = window.BijoyEngine;
    if (!eng || typeof eng.bijoyToUnicode !== 'function') return str;
    var s = normalizeBijoyPreConvert(str);
    var tokens = [];
    function stash(m) {
      var ch = String.fromCharCode(0xE100 + tokens.length);
      tokens.push(m);
      return ch;
    }
    // Protect Roman numerals in MCQ options ("i, ii I iii", "i I ii") and list markers ("i.", "ii.", "iii.")
    s = s.replace(/\b(i{1,3}|iv)\s*,\s*(i{1,3}|iv)\s+I\s+(i{1,3}|iv)\b/g, function (_, a, b, c) {
      return stash(a) + ', ' + stash(b) + ' I ' + stash(c);
    });
    s = s.replace(/\b(i{1,3}|iv)\s+I\s+(i{1,3}|iv)\b/g, function (_, a, b) {
      return stash(a) + ' I ' + stash(b);
    });
    s = s.replace(/(^|[\s\t(])(i{1,3}|iv)\.(?=\s|$)/g, function (_, pre, rom) {
      return pre + stash(rom + '.');
    });

    var out = s;
    try {
      out = eng.bijoyToUnicode(s);
    } catch (e) {}
    out = out.replace(/[\uE100-\uE1FF]/g, function (ch) {
      return tokens[ch.charCodeAt(0) - 0xE100] || '';
    });
    return out;
  }

  function repairUnicodeBangla(str) {
    if (!str) return '';
    var s = String(str);
    if (s.normalize) s = s.normalize('NFC');
    // Remove stray zero-width characters in the middle of consonant+halant clusters
    s = s.replace(/([\u0995-\u09B9\u09DC\u09DD\u09DF])[\u200B\uFEFF]+(\u09CD)/g, '$1$2');
    // Replace space + visarga (used as colon in Bijoy, e.g. "নাম ঃ" -> "নাম :") to prevent dotted circle
    s = s.replace(/\s+\u0983/g, ' :');
    // 1. Rejoin words split right after a pre-base vowel sign (e.g. "প্রকৃি তর" -> "প্রকৃতির", "স্মৃি ত" -> "স্মৃতি")
    s = s.replace(/([\u09BE-\u09CC\u09D7])([\u09BF\u09C7\u09C8])\s*([\u0995-\u09B9\u09DC\u09DD\u09DF](?:\u09BC)?(?:\u09CD[\u0995-\u09B9\u09DC\u09DD\u09DF](?:\u09BC)?)*)/g, '$1$3$2');
    // 2. Fix visual-order pre-base vowel signs (ি, ে, ৈ) ONLY when ORPHANED (at word start or preceded by space/punct/vowel),
    // NEVER when already preceded by a consonant!
    s = s.replace(/(^|[\s([{'"“‘—–\-\u0985-\u0994\u09BE-\u09CC\u09D7])([\u09BF\u09C7\u09C8])([\u0995-\u09B9\u09DC\u09DD\u09DF](?:\u09BC)?(?:\u09CD[\u0995-\u09B9\u09DC\u09DD\u09DF](?:\u09BC)?)*)/g, '$1$3$2');
    // 3. If a consonant cluster C1 (with no vowel sign) is followed by C2 + V1 + V2 (two consecutive vowel signs on C2, which is illegal in Bangla),
    // move V1 back onto C1! (Fixes কবরিাজরে -> কবিরাজের, নচরিে -> নিচের, দৃষ্টতিে -> দৃষ্টিতে, মত্যৃুকে -> মৃত্যুকে, নর্দশিে -> নির্দেশ, মেুখাশ -> মুখোশ)
    s = s.replace(/([\u0995-\u09B9\u09DC\u09DD\u09DF](?:\u09BC)?(?:\u09CD[\u0995-\u09B9\u09DC\u09DD\u09DF](?:\u09BC)?)*)([\u0995-\u09B9\u09DC\u09DD\u09DF](?:\u09BC)?(?:\u09CD[\u0995-\u09B9\u09DC\u09DD\u09DF](?:\u09BC)?)*)([\u09BE-\u09CC\u09D7])([\u09BE-\u09CC\u09D7])/g, '$1$3$2$4');
    // 4. Combine split two-part vowel signs: ে + া -> ো and ে + ৗ -> ৌ
    s = s.replace(/\u09C7\u09BE/g, '\u09CB').replace(/\u09C7\u09D7/g, '\u09CC');
    s = s.replace(/\u09BE\u09C7/g, '\u09CB').replace(/\u09D7\u09C7/g, '\u09CC');
    // 5. Collapse accidental identical consecutive vowel signs on the same consonant
    s = s.replace(/([\u09BE-\u09CC\u09D7])\1+/g, '$1');
    return s;
  }

  function cleanAndConvertPdfRun(str, fontHint, forceBijoy) {
    if (!str) return '';
    var s = normalizeC1ToCp1252(str)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
    if (!s) return '';

    var bijoyMode = !!(forceBijoy || isBijoyFontName(fontHint) || hasBijoyGlyphSignature(s));
    var hasBanglaUnicode = /[\u0980-\u09FF]/.test(s);

    if (!hasBanglaUnicode) {
      if (bijoyMode) {
        s = convertBijoyPreserveRoman(s);
      }
    } else {
      // Mixed string containing BOTH Unicode Bangla and embedded Bijoy fragments (e.g. "আµাšÍ।", "প্রকৃ Zi", "1. 'সুখী মানুষ' bvwUKvq")
      s = s.replace(/[^\u0980-\u09FF\u0964\u0965]+/g, function (frag) {
        if (!/[A-Za-z0-9\u00A1-\u00FF\u03BC\u0152\u0153\u0160\u0161\u0178\u0192\u02C6\u02DC\u2013-\u203A\u2122`|~_]/.test(frag)) {
          return frag;
        }
        if (bijoyMode || hasBijoyGlyphSignature(frag) || /[`|~_\u03BC]/.test(frag)) {
          return convertBijoyPreserveRoman(frag);
        }
        return frag;
      });
    }

    if (/[\u0980-\u09FF]/.test(s)) {
      s = repairUnicodeBangla(s);
    }
    return s;
  }

  function isTextGarbledOrEmpty(text, rawItemsCount) {
    var trimmed = String(text || '').replace(/\s+/g, '');
    if (!trimmed.length) return true;
    if (rawItemsCount > 5 && trimmed.length < 3) return true;

    // PUA or Unicode replacement characters indicate missing/broken ToUnicode CMap
    var puaMatches = trimmed.match(/[\uE000-\uF8FF\uFFFD]/g);
    if (puaMatches && puaMatches.length / trimmed.length > 0.05) return true;

    // Count legitimate readable characters (Bangla, Latin, digits, common punctuation)
    var validMatches = trimmed.match(/[\u0980-\u09FF\u0964\u0965a-zA-Z0-9.,;:!?"'()\[\]{}\-\/\\+@#$%&*=<>|_~`^৳₹$€£¥°•–—‘’“”…]/g);
    var validCount = validMatches ? validMatches.length : 0;
    if (validCount / trimmed.length < 0.72) return true;

    var wordsCount = Math.max(1, String(text || '').trim().split(/\s+/).length);
    var leftoverBijoy = (text.match(/[†‡ˆ‰Š‹ŒŽ•˜™š›œžŸ¡-ÿ\u03BC]/g) || []).length;
    if (leftoverBijoy >= Math.max(4, wordsCount * 0.12)) return true;

    var doubleKars = (text.match(/[\u09BE-\u09CC\u09D7]{2,}|\u09CD[\u09BE-\u09CC\u09D7]/g) || []).length;
    if (doubleKars >= Math.max(5, wordsCount * 0.15)) return true;

    var weirdInsideWord = trimmed.match(/[a-zA-Z][~`|\\^<>]+[a-zA-Z]/g);
    if (weirdInsideWord && weirdInsideWord.length >= 4) return true;

    return false;
  }

  function isBoldFontHint(fontHint) {
    if (!fontHint) return false;
    return /bold|black|heavy|demi|semibold|extrabold|[-_.]bd\b/i.test(String(fontHint));
  }

  function groupPreliminaryRows(items) {
    var rows = [];
    items.forEach(function (it) {
      var bestRow = null;
      var bestDist = Infinity;
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var tol = Math.max(4.0, Math.min(r.h, it.h) * 0.48);
        var dist = Math.abs(r.y - it.y);
        if (dist <= tol && dist < bestDist) {
          bestDist = dist;
          bestRow = r;
        }
      }
      if (bestRow) {
        bestRow.items.push(it);
        bestRow.y = (bestRow.y * (bestRow.items.length - 1) + it.y) / bestRow.items.length;
        bestRow.h = Math.max(bestRow.h, it.h);
      } else {
        rows.push({ y: it.y, h: it.h, items: [it] });
      }
    });
    rows.sort(function (a, b) { return b.y - a.y; });

    rows.forEach(function (r) {
      r.items.sort(function (a, b) { return a.x - b.x; });
      var clusters = [];
      r.items.forEach(function (it) {
        var endX = it.x + Math.max(1, it.w);
        if (!clusters.length) {
          clusters.push({ minX: it.x, maxX: endX, chars: it.str.length, items: [it] });
          return;
        }
        var prev = clusters[clusters.length - 1];
        var gap = it.x - prev.maxX;
        var refH = Math.max(r.h, it.h, 8);
        if (gap <= Math.max(14, refH * 1.5)) {
          prev.maxX = Math.max(prev.maxX, endX);
          prev.chars += it.str.length;
          prev.items.push(it);
        } else {
          clusters.push({ minX: it.x, maxX: endX, chars: it.str.length, items: [it] });
        }
      });
      r.clusters = clusters;
      r.minX = clusters.length ? clusters[0].minX : 0;
      r.maxX = clusters.length ? clusters[clusters.length - 1].maxX : 0;
    });
    return rows;
  }

  function segmentPageBands(items, pageWidth) {
    var minX = Infinity, maxX = -Infinity;
    items.forEach(function (it) {
      if (it.x < minX) minX = it.x;
      var ex = it.x + Math.max(2, it.w);
      if (ex > maxX) maxX = ex;
    });
    if (!isFinite(minX) || !isFinite(maxX)) {
      return [{ type: 'single', items: items, bounds: { minX: 36, maxX: 559, width: 523, isNarrowCol: false } }];
    }
    var spanW = Math.max(100, maxX - minX);
    var fullBounds = { minX: minX, maxX: maxX, width: spanW, isNarrowCol: false };
    if (items.length < 10 || spanW < 230) {
      return [{ type: 'single', items: items, bounds: fullBounds }];
    }

    var prelimRows = groupPreliminaryRows(items);
    if (prelimRows.length < 5) {
      return [{ type: 'single', items: items, bounds: fullBounds }];
    }

    var bestX = null;
    var bestScore = -Infinity;
    var bestSplitInfo = null;

    for (var frac = 0.43; frac <= 0.57; frac += 0.01) {
      var candX = minX + spanW * frac;
      var rowStates = prelimRows.map(function (r) {
        var crosses = false;
        var leftW = 0, rightW = 0, leftChars = 0, rightChars = 0;
        var leftMin = Infinity, leftMax = -Infinity, rightMin = Infinity, rightMax = -Infinity;
        for (var c = 0; c < r.clusters.length; c++) {
          var cl = r.clusters[c];
          if (cl.maxX <= candX + 6) {
            leftChars += cl.chars;
            if (cl.minX < leftMin) leftMin = cl.minX;
            if (cl.maxX > leftMax) leftMax = cl.maxX;
          } else if (cl.minX >= candX - 6) {
            rightChars += cl.chars;
            if (cl.minX < rightMin) rightMin = cl.minX;
            if (cl.maxX > rightMax) rightMax = cl.maxX;
          } else {
            crosses = true;
          }
        }
        if (isFinite(leftMin)) leftW = leftMax - leftMin;
        if (isFinite(rightMin)) rightW = rightMax - rightMin;
        return { row: r, crosses: crosses, leftW: leftW, rightW: rightW, leftChars: leftChars, rightChars: rightChars };
      });

      var topIdx = 0;
      var maxTop = Math.min(8, Math.floor(rowStates.length * 0.35));
      while (topIdx < maxTop && rowStates[topIdx].crosses) {
        topIdx++;
      }
      var botIdx = rowStates.length - 1;
      var minBot = Math.max(topIdx + 4, rowStates.length - 3);
      while (botIdx >= minBot && rowStates[botIdx].crosses) {
        botIdx--;
      }

      var bodyStates = rowStates.slice(topIdx, botIdx + 1);
      var leftRows = 0, rightRows = 0, crossRows = 0;
      var leftLongRows = 0, rightLongRows = 0;
      var leftNumOrOpt = 0, rightNumOrOpt = 0;

      bodyStates.forEach(function (st) {
        if (st.crosses) {
          crossRows++;
          return;
        }
        if (st.leftChars > 0) {
          leftRows++;
          if (st.leftW > spanW * 0.22 || st.leftChars >= 14) leftLongRows++;
        }
        if (st.rightChars > 0) {
          rightRows++;
          if (st.rightW > spanW * 0.22 || st.rightChars >= 14) rightLongRows++;
        }
        st.row.items.forEach(function (it) {
          var s = it.str.trim();
          if (/^(?:[0-9০-৯]+[.)]|[কখগঘABCDKLMN][.)]|i{1,3}\.)/.test(s)) {
            if (it.x < candX) leftNumOrOpt++;
            else rightNumOrOpt++;
          }
        });
      });

      if (leftRows >= 4 && rightRows >= 4 && crossRows <= Math.max(1, Math.floor(bodyStates.length * 0.08))) {
        var isArticleOrExam = (leftLongRows >= 2 && rightLongRows >= 2) || (leftNumOrOpt >= 2 && rightNumOrOpt >= 2);
        if (isArticleOrExam) {
          var balance = Math.min(leftRows, rightRows) / Math.max(leftRows, rightRows);
          var score = (leftRows + rightRows) * 2 - crossRows * 15 + balance * 10;
          if (score > bestScore) {
            bestScore = score;
            bestX = candX;
            bestSplitInfo = { topIdx: topIdx, botIdx: botIdx, prelimRows: prelimRows };
          }
        }
      }
    }

    if (bestX === null || !bestSplitInfo) {
      return [{ type: 'single', items: items, bounds: fullBounds }];
    }

    var bands = [];
    var pRows = bestSplitInfo.prelimRows;
    if (bestSplitInfo.topIdx > 0) {
      var topItems = [];
      for (var t = 0; t < bestSplitInfo.topIdx; t++) {
        topItems.push.apply(topItems, pRows[t].items);
      }
      bands.push({ type: 'single', items: topItems, bounds: fullBounds });
    }

    var leftItems = [], rightItems = [];
    for (var b = bestSplitInfo.topIdx; b <= bestSplitInfo.botIdx; b++) {
      pRows[b].items.forEach(function (it) {
        if (it.x + Math.max(0, it.w) * 0.35 < bestX) leftItems.push(it);
        else rightItems.push(it);
      });
    }
    var leftMinX = minX, leftMaxX = bestX - 6;
    var rightMinX = bestX + 6, rightMaxX = maxX;
    leftItems.forEach(function (it) {
      if (it.x < leftMinX) leftMinX = it.x;
      if (it.x + it.w > leftMaxX && it.x + it.w <= bestX + 8) leftMaxX = it.x + it.w;
    });
    rightItems.forEach(function (it) {
      if (it.x < rightMinX && it.x >= bestX - 8) rightMinX = it.x;
      if (it.x + it.w > rightMaxX) rightMaxX = it.x + it.w;
    });

    bands.push({
      type: 'two-col',
      leftItems: leftItems,
      rightItems: rightItems,
      leftBounds: { minX: leftMinX, maxX: Math.max(leftMinX + 120, leftMaxX), width: Math.max(120, leftMaxX - leftMinX), isNarrowCol: true },
      rightBounds: { minX: rightMinX, maxX: Math.max(rightMinX + 120, rightMaxX), width: Math.max(120, rightMaxX - rightMinX), isNarrowCol: true }
    });

    if (bestSplitInfo.botIdx < pRows.length - 1) {
      var botItems = [];
      for (var f = bestSplitInfo.botIdx + 1; f < pRows.length; f++) {
        botItems.push.apply(botItems, pRows[f].items);
      }
      bands.push({ type: 'single', items: botItems, bounds: fullBounds });
    }

    return bands;
  }

  function extractStructuredBlocks(colItems, pageBijoy, colBounds) {
    if (!colItems || !colItems.length) return [];
    var rows = [];
    colItems.forEach(function (it) {
      var bestRow = null;
      var bestDist = Infinity;
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var tol = Math.max(4.0, Math.min(r.h, it.h) * 0.48);
        var dist = Math.abs(r.y - it.y);
        if (dist <= tol && dist < bestDist) {
          bestDist = dist;
          bestRow = r;
        }
      }
      if (bestRow) {
        bestRow.items.push(it);
        bestRow.y = (bestRow.y * (bestRow.items.length - 1) + it.y) / bestRow.items.length;
        bestRow.h = Math.max(bestRow.h, it.h);
      } else {
        rows.push({ y: it.y, h: it.h, items: [it] });
      }
    });

    rows.sort(function (a, b) { return b.y - a.y; });

    var rawRowObjs = [];
    rows.forEach(function (r) {
      // Strictly sort left-to-right by X coordinate (never use a wide streamIdx window which breaks V8 TimSort transitivity!)
      r.items.sort(function (a, b) { return a.x - b.x; });

      var rowForceBijoy = pageBijoy || r.items.some(function (it) {
        return it.bijoyFont || hasBijoyGlyphSignature(it.str);
      });

      var wordRuns = [];
      r.items.forEach(function (cur) {
        var curEndX = cur.x + cur.w;
        if (!wordRuns.length) {
          wordRuns.push({
            str: cur.str,
            x: cur.x,
            endX: Math.max(cur.x, curEndX),
            h: cur.h,
            isBold: !!cur.isBold,
            fontHint: cur.fontHint || '',
            bijoyFont: !!(cur.bijoyFont || rowForceBijoy)
          });
          return;
        }
        var prev = wordRuns[wordRuns.length - 1];
        var gap = cur.x - prev.endX;
        var refH = Math.max(prev.h, cur.h, 8);
        // Faux-bold overlaid duplicate text detection
        if (gap < -refH * 0.45 && cur.str === prev.str) {
          prev.isBold = true;
          return;
        }
        if (gap <= refH * 0.16 && (prev.bijoyFont === !!(cur.bijoyFont || rowForceBijoy))) {
          prev.str += cur.str;
          prev.endX = Math.max(prev.endX, curEndX);
          prev.h = Math.max(prev.h, cur.h);
          if (cur.isBold) prev.isBold = true;
        } else {
          wordRuns.push({
            str: cur.str,
            x: cur.x,
            endX: Math.max(cur.x, curEndX),
            h: cur.h,
            isBold: !!cur.isBold,
            fontHint: cur.fontHint || '',
            bijoyFont: !!(cur.bijoyFont || rowForceBijoy)
          });
        }
      });

      // Assemble raw cells BEFORE calling cleanAndConvertPdfRun so full context (like "K. i I ii" or "cÖK…w Zi") is preserved!
      var rawCells = [];
      for (var i = 0; i < wordRuns.length; i++) {
        var seg = wordRuns[i];
        var segTrim = seg.str.trim();
        if (!segTrim) continue;
        if (!rawCells.length) {
          rawCells.push({ rawText: seg.str, x: seg.x, endX: seg.endX, h: seg.h, isBold: seg.isBold, fontHint: seg.fontHint });
          continue;
        }
        var prevC = rawCells[rawCells.length - 1];
        var gap2 = seg.x - prevC.endX;
        var refH2 = Math.max(prevC.h, seg.h, 8);
        // Inside a narrow column (2-col exam paper), ONLY split into sub-columns when a mid-line secondary MCQ option (খ/ঘ / L/N / B/D) starts!
        // On a full-width band, split when there is a large tab jump (> 28pt or 2.5 * h).
        var isMidLineMcqRaw = /^\(?([খঘঙBbDdLN])[.)](?:\s|$)/.test(segTrim) && prevC.rawText.trim().length > 0;
        var isFullWidthTabJump = !colBounds.isNarrowCol && gap2 > Math.max(28, refH2 * 2.5);
        if (isMidLineMcqRaw || isFullWidthTabJump) {
          rawCells.push({ rawText: seg.str, x: seg.x, endX: seg.endX, h: seg.h, isBold: seg.isBold, fontHint: seg.fontHint });
        } else {
          prevC.rawText += (gap2 > refH2 * 0.14 ? ' ' : '') + seg.str;
          prevC.endX = Math.max(prevC.endX, seg.endX);
          prevC.h = Math.max(prevC.h, seg.h);
          if (seg.isBold) prevC.isBold = true;
        }
      }

      var cells = [];
      rawCells.forEach(function (rc) {
        var conv = cleanAndConvertPdfRun(rc.rawText, rc.fontHint, rowForceBijoy)
          .replace(/ +/g, ' ')
          .trim();
        if (conv) {
          cells.push({ text: conv, x: rc.x, endX: rc.endX, h: rc.h, isBold: rc.isBold });
        }
      });

      // Split a single cell if two side-by-side MCQ options (ক... খ... or গ... ঘ...) were stored in one cell
      if (cells.length === 1) {
        var mOpt = cells[0].text.match(/^(\(?[কগAca][.)]\s+.+?)\s+(?=\(?[খঘBdb][.)]\s+.+)/);
        if (mOpt) {
          var leftPart = mOpt[1].trim();
          var rightPart = cells[0].text.slice(mOpt[0].length).trim();
          var c0 = cells[0];
          cells = [
            { text: leftPart, x: c0.x, endX: colBounds.minX + colBounds.width * 0.48, h: c0.h, isBold: c0.isBold },
            { text: rightPart, x: colBounds.minX + colBounds.width * 0.5, endX: c0.endX, h: c0.h, isBold: c0.isBold }
          ];
        }
      }

      if (!cells.length) return;
      var rowMinX = cells[0].x;
      var rowMaxX = cells[cells.length - 1].endX;
      var rowW = Math.max(10, rowMaxX - rowMinX);
      var leftOff = Math.max(0, rowMinX - colBounds.minX);
      var rightOff = Math.max(0, colBounds.maxX - rowMaxX);
      var align = 'left';
      if (cells.length === 1) {
        if (leftOff > 14 && rightOff > 14 && Math.abs(leftOff - rightOff) < Math.max(22, colBounds.width * 0.14) && rowW < colBounds.width * 0.86) {
          align = 'center';
        } else if (leftOff > colBounds.width * 0.48 && rightOff < 26) {
          align = 'right';
        }
      }
      var indentPt = (align === 'left' && cells.length === 1 && leftOff >= 8 && leftOff <= colBounds.width * 0.4)
        ? Math.round(Math.min(36, leftOff * 0.8))
        : 0;

      var fullRowText = cells.map(function (c) { return c.text; }).join('\t');
      var isBoldRow = cells.some(function (c) { return c.isBold; }) ||
        /^(নিচের\s+উদ্দীপক|উদ্দীপকটি\s+পড়ে|নিচের\s+কোনটি)/.test(fullRowText.trim());

      rawRowObjs.push({
        y: r.y,
        h: Math.round(Math.min(20, Math.max(9, r.h)) * 2) / 2,
        minX: rowMinX,
        maxX: rowMaxX,
        align: align,
        indentPt: indentPt,
        isBold: isBoldRow,
        cells: cells,
        text: fullRowText
      });
    });

    // Merge wrapped continuation lines of paragraphs/questions so multi-line sentences don't split with gaps
    var merged = [];
    rawRowObjs.forEach(function (cur) {
      if (!merged.length) {
        cur.lastY = cur.y;
        cur.lastMaxX = cur.maxX;
        cur.mergedCount = 1;
        cur.spaceBeforePt = 0;
        merged.push(cur);
        return;
      }
      var prev = merged[merged.length - 1];
      var dy = prev.lastY - cur.y;
      var maxH = Math.max(prev.h, cur.h, 10);

      var canMerge = (
        prev.cells.length === 1 &&
        cur.cells.length === 1 &&
        (prev.align === 'left' || prev.align === 'justify') &&
        cur.align === 'left' &&
        dy > 0 && dy <= maxH * 1.85 &&
        Math.abs(prev.h - cur.h) <= 1.5 &&
        prev.isBold === cur.isBold &&
        !/^\s*\(?([কখগঘঙABCDabcd]|[ivxIVX]{1,4})[.)]\s/.test(prev.text) &&
        !/:\s*$/.test(prev.text) &&
        !/^[^:]{1,32}:\s+.+/.test(prev.text) &&
        !/^\s*\(?[0-9০-৯]+[.)।]\s*/.test(cur.text) &&
        !/^\s*\(?([কখগঘঙABCDabcd]|[ivxIVX]{1,4})[.)]\s*/.test(cur.text) &&
        !/^\s*([-•▪*]|নিচের\s+উদ্দীপক|উদ্দীপকটি\s+পড়ে|নিচের\s+কোনটি|বি\.?\s*দ্র|দ্রষ্টব্য)/.test(cur.text) &&
        !/^\s*[A-Za-z\u0980-\u09FF\s().]{2,28}:\s*/.test(cur.text) &&
        ((prev.lastMaxX - colBounds.minX) >= colBounds.width * 0.55 || !/[।?!]\s*$/.test(prev.text))
      );

      if (canMerge) {
        prev.cells[0].text = repairUnicodeBangla(prev.cells[0].text + ' ' + cur.cells[0].text);
        prev.text = prev.cells[0].text;
        prev.lastY = cur.y;
        prev.lastMaxX = cur.maxX;
        prev.mergedCount = (prev.mergedCount || 1) + 1;
        if (prev.mergedCount >= 3) prev.align = 'justify';
      } else {
        cur.spaceBeforePt = dy > maxH * 2.0 ? 6.5 : (dy > maxH * 1.45 ? 3 : 1.2);
        cur.lastY = cur.y;
        cur.lastMaxX = cur.maxX;
        cur.mergedCount = 1;
        merged.push(cur);
      }
    });

    return merged;
  }

  function buildPageLayoutFromItems(items, pageWidth, pageBijoy, rawCount) {
    if (!items || !items.length) {
      return { text: '', layout: null, rawCount: rawCount || 0, garbled: true };
    }
    var bands = segmentPageBands(items, pageWidth || 595);
    var layoutBands = [];
    var textParts = [];

    bands.forEach(function (band) {
      if (band.type === 'two-col') {
        var leftBlocks = extractStructuredBlocks(band.leftItems, pageBijoy, band.leftBounds);
        var rightBlocks = extractStructuredBlocks(band.rightItems, pageBijoy, band.rightBounds);
        layoutBands.push({
          type: 'two-col',
          leftBlocks: leftBlocks,
          rightBlocks: rightBlocks,
          leftBounds: band.leftBounds,
          rightBounds: band.rightBounds
        });
        var lTxt = leftBlocks.map(function (b) { return b.text; }).join('\n').trim();
        var rTxt = rightBlocks.map(function (b) { return b.text; }).join('\n').trim();
        if (lTxt) textParts.push(lTxt);
        if (rTxt) textParts.push(rTxt);
      } else {
        var singleBlocks = extractStructuredBlocks(band.items, pageBijoy, band.bounds);
        layoutBands.push({
          type: 'single',
          blocks: singleBlocks,
          bounds: band.bounds
        });
        var sTxt = singleBlocks.map(function (b) { return b.text; }).join('\n').trim();
        if (sTxt) textParts.push(sTxt);
      }
    });

    var combinedText = textParts.join('\n\n').trim();
    return {
      text: combinedText,
      layout: { bands: layoutBands, pageWidth: pageWidth || 595 },
      rawCount: rawCount || items.length,
      garbled: isTextGarbledOrEmpty(combinedText, rawCount || items.length)
    };
  }

  function extractPageTextSmart(page) {
    var vp = page.getViewport ? page.getViewport({ scale: 1 }) : { width: 595 };
    return page.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false }).then(function (tc) {
      var styles = tc.styles || {};
      var rawItems = tc.items || [];
      var fontConcat = {};
      var allConcat = '';

      rawItems.forEach(function (it) {
        var raw = it.str || '';
        if (!raw.trim()) return;
        var fn = it.fontName || '_default';
        fontConcat[fn] = (fontConcat[fn] || '') + ' ' + raw;
        allConcat += ' ' + raw;
      });

      var fontIsBijoy = {};
      var anyBijoyFont = false;
      Object.keys(fontConcat).forEach(function (fn) {
        var stObj = styles[fn] || {};
        var hint = fn + ' ' + (stObj.fontFamily || '');
        var sample = fontConcat[fn];
        var isBj = isBijoyFontName(hint) || (!/[\u0980-\u09FF]/.test(sample) && hasBijoyGlyphSignature(sample));
        fontIsBijoy[fn] = isBj;
        if (isBj) anyBijoyFont = true;
      });

      var pageBijoy = anyBijoyFont || hasBijoyGlyphSignature(allConcat);
      var items = [];

      rawItems.forEach(function (it, idx) {
        var raw = it.str || '';
        if (!raw || !raw.trim()) return;
        var tr = it.transform || [1, 0, 0, 1, 0, 0];
        var x = tr[4] || 0;
        var y = tr[5] || 0;
        var h = Math.max(6, Math.abs(tr[3]) || Math.abs(tr[0]) || it.height || 10);
        var w = Math.max(0, it.width || (raw.length * h * 0.48));
        var fn = it.fontName || '_default';
        var stObj = styles[fn] || {};
        var fontHint = fn + ' ' + (stObj.fontFamily || '');
        items.push({
          str: raw,
          x: x,
          y: y,
          w: w,
          h: h,
          streamIdx: idx,
          isBold: isBoldFontHint(fontHint),
          fontHint: fontHint,
          bijoyFont: !!(fontIsBijoy[fn] || isBijoyFontName(fontHint))
        });
      });

      return buildPageLayoutFromItems(items, vp.width, pageBijoy, rawItems.length);
    });
  }

  function ensureTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (!tesseractReady) {
      tesseractReady = loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js')
        .catch(function () {
          return loadScript('https://unpkg.com/tesseract.js@5/dist/tesseract.min.js');
        })
        .then(function () {
          if (!window.Tesseract) throw new Error('OCR ইঞ্জিন লোড করা যায়নি');
          return window.Tesseract;
        });
    }
    return tesseractReady;
  }

  function preprocessCanvasForOcr(srcCanvas) {
    var w = srcCanvas.width;
    var h = srcCanvas.height;
    var out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    var ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(srcCanvas, 0, 0);
    try {
      var img = ctx.getImageData(0, 0, w, h);
      var d = img.data;
      // Enhance contrast and suppress faint watermarks (like light red/green seals behind text)
      for (var i = 0; i < d.length; i += 4) {
        var r = d[i], g = d[i + 1], b = d[i + 2];
        var lum = 0.299 * r + 0.587 * g + 0.114 * b;
        var maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
        var sat = maxC - minC;
        if (lum > 205 || (lum > 165 && sat > 28)) {
          d[i] = d[i + 1] = d[i + 2] = 255;
        } else if (lum < 145) {
          var dark = Math.max(0, Math.round((lum / 145) * 85));
          d[i] = d[i + 1] = d[i + 2] = dark;
        } else {
          var mid = Math.min(255, Math.round(140 + ((lum - 145) / 60) * 115));
          d[i] = d[i + 1] = d[i + 2] = mid;
        }
      }
      ctx.putImageData(img, 0, 0);
    } catch (e) {}
    return out;
  }

  function ocrPageCanvas(doc, pageNum, rotation, lang, onPct) {
    var ocrScale = 2.4;
    var canvasHeight = 842 * ocrScale;
    var pageW = 595;
    return ensureTesseract().then(function (Tesseract) {
      return renderPageCanvas(doc, pageNum, { scale: ocrScale, rotation: rotation || 0 }).then(function (r) {
        canvasHeight = r.canvas.height || canvasHeight;
        pageW = Math.round((r.canvas.width || (595 * ocrScale)) / ocrScale);
        var cleanCanvas = preprocessCanvasForOcr(r.canvas);
        return Tesseract.recognize(cleanCanvas, lang || 'ben+eng', {
          logger: function (m) {
            if (m && m.status === 'recognizing text' && typeof m.progress === 'number' && onPct) {
              onPct(m.progress);
            }
          }
        });
      });
    }).then(function (res) {
      var data = (res && res.data) || {};
      var words = data.words || [];
      if (words.length > 0) {
        var ocrItems = [];
        words.forEach(function (w, idx) {
          var txt = repairUnicodeBangla((w.text || '').trim());
          if (!txt) return;
          var bb = w.bbox || {};
          var x0 = (bb.x0 || 0) / ocrScale;
          var x1 = (bb.x1 || (bb.x0 || 0) + 20) / ocrScale;
          var y0 = (bb.y0 || 0) / ocrScale;
          var y1 = (bb.y1 || (bb.y0 || 0) + 14) / ocrScale;
          var hPt = Math.max(8.5, Math.min(18, (y1 - y0) * 0.78));
          ocrItems.push({
            str: txt,
            x: x0,
            y: (canvasHeight / ocrScale) - y1,
            w: Math.max(4, x1 - x0),
            h: hPt,
            streamIdx: idx,
            isSub: false,
            isBold: !!w.is_bold,
            fontHint: '',
            bijoyFont: false
          });
        });
        if (ocrItems.length > 0) {
          return buildPageLayoutFromItems(ocrItems, pageW, false, ocrItems.length);
        }
      }
      var raw = data.text || '';
      var cleaned = raw
        .split(/\r?\n/)
        .map(function (ln) { return repairUnicodeBangla(ln).replace(/\s+/g, ' ').trim(); })
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      return { text: cleaned, layout: null, rawCount: 1, garbled: !cleaned };
    });
  }

  function syncPdf2OtherFormatControls() {
    var fmt = ($('input[name="pdfToOtherFmt"]:checked') || {}).value || 'jpg';
    var isImg = (fmt === 'jpg' || fmt === 'png');
    var dpiWrap = $('#pdfToImgDpiWrap');
    var ocrWrap = $('#pdfToTextOcrWrap');
    if (dpiWrap) dpiWrap.hidden = !isImg;
    if (ocrWrap) ocrWrap.hidden = isImg;
  }

  function loadPdf2OtherFile(files) {
    loadSinglePdf(files).then(function (st) {
      p2oState = st;
      renderPdf2OtherUI();
    }).catch(function () {});
  }

  function renderPdf2OtherUI() {
    showStage('pdfToOther', !!p2oState);
    syncPdf2OtherFormatControls();
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

  function formatBlockHtmlContent(text) {
    var escaped = esc(text);
    // Highlight leading question number (e.g. "১. ", "12. ") slightly bold for visual clarity
    return escaped.replace(/^(\s*\(?[0-9০-৯]+[.)])(\s+)/, '<b>$1</b>$2');
  }

  function renderStructuredBlocksHtml(blocks, colBounds, fontStack) {
    if (!blocks || !blocks.length) return '';
    var htmlParts = [];
    var tableQueue = [];
    var bounds = colBounds || { minX: 36, maxX: 559, width: 523, isNarrowCol: false };

    function flushTableQueue() {
      if (!tableQueue.length) return;
      var maxCols = 2;
      tableQueue.forEach(function (b) { if (b.cells.length > maxCols) maxCols = b.cells.length; });

      var trs = tableQueue.map(function (b) {
        var tds = [];
        var fSize = Math.min(13, Math.max(9.5, b.h || 10.5));
        for (var c = 0; c < maxCols; c++) {
          var cell = b.cells[c] || { text: '', x: bounds.minX, endX: bounds.maxX, isBold: false };
          var widthPct = Math.floor(100 / maxCols);
          var textAlign = 'left';
          var boldCell = cell.isBold || b.isBold;

          if (maxCols === 2) {
            var isMcqPair = bounds.isNarrowCol || /^\s*\(?[কখগঘঙABCDabcd][.)]/.test(b.cells[0].text);
            var isHeaderLeftRight = !bounds.isNarrowCol && b.cells[1] &&
              (b.cells[1].x > bounds.minX + bounds.width * 0.55) &&
              (b.cells[1].endX > bounds.maxX - 45);
            if (isMcqPair) {
              widthPct = 50;
            } else if (isHeaderLeftRight) {
              widthPct = c === 0 ? 58 : 42;
              if (c === 1) textAlign = 'right';
            } else {
              var c1Rel = b.cells[1] ? Math.round(((b.cells[1].x - bounds.minX) / Math.max(100, bounds.width)) * 100) : 35;
              var col0W = Math.max(22, Math.min(55, c1Rel));
              widthPct = c === 0 ? col0W : (100 - col0W);
              if (c === 0 && cell.text.length < 32 && /[:：]\s*$/.test(cell.text)) boldCell = true;
            }
          }

          tds.push(
            '<td width="' + widthPct + '%" valign="top" align="' + textAlign + '" style="width:' + widthPct + '%;padding:1.5pt ' + (c < maxCols - 1 ? '6pt' : '0') + ' 1.5pt 0;vertical-align:top;text-align:' + textAlign + ';font-family:' + fontStack + ';font-size:' + fSize + 'pt;line-height:1.3;' +
            (boldCell ? 'font-weight:bold;' : '') + '">' + esc(cell.text) + '</td>'
          );
        }
        return '<tr>' + tds.join('') + '</tr>';
      }).join('');

      htmlParts.push(
        '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;table-layout:fixed;mso-table-lspace:0pt;mso-table-rspace:0pt;margin:1.5pt 0 3pt 0;">' +
        trs +
        '</table>'
      );
      tableQueue = [];
    }

    blocks.forEach(function (b) {
      if (b.cells && b.cells.length >= 2) {
        if (tableQueue.length && tableQueue[0].cells.length !== b.cells.length) {
          flushTableQueue();
        }
        tableQueue.push(b);
        return;
      }
      flushTableQueue();
      var txt = (b.text || '').trim();
      if (!txt) return;

      var isQuestion = /^\s*\(?[0-9০-৯]+[.)]\s+/.test(txt);
      var isSingleOpt = /^\s*\(?[কখগঘঙABCDabcd][.)]\s+/.test(txt);
      var isRomanOpt = /^\s*\(?[ivxIVX]{1,4}[.)]\s+/.test(txt);
      var fSize = Math.min(18, Math.max(9.5, b.h || 10.5));
      var topM = b.spaceBeforePt !== undefined ? b.spaceBeforePt : 1.5;
      var botM = 2;

      if (isQuestion) {
        topM = Math.max(topM, 4.5);
        botM = 2;
      } else if (isSingleOpt || isRomanOpt) {
        topM = Math.min(topM, 1);
        botM = 1;
      } else if (b.align === 'center') {
        botM = 2.5;
      } else if (b.align === 'justify') {
        topM = Math.max(topM, 2.5);
        botM = 4;
      }

      var leftIndent = b.indentPt || (isRomanOpt ? 10 : (isSingleOpt ? 3 : 0));
      var alignAttr = (b.align === 'center' || b.align === 'right' || b.align === 'justify') ? ' align="' + b.align + '"' : '';
      var styleStr = 'font-family:' + fontStack + ';font-size:' + fSize + 'pt;line-height:1.32;margin:' + topM + 'pt 0 ' + botM + 'pt ' + leftIndent + 'pt;color:#0f172a;text-align:' + (b.align || 'left') + ';' +
        (b.isBold ? 'font-weight:bold;' : '');

      htmlParts.push('<p' + alignAttr + ' style="' + styleStr + '">' + formatBlockHtmlContent(txt) + '</p>');
    });

    flushTableQueue();
    return htmlParts.join('');
  }

  function renderPlainFallbackBlocksHtml(colText, fontStack) {
    var lines = String(colText || '').split(/\r?\n/);
    var pseudoBlocks = [];
    lines.forEach(function (ln) {
      var trimmed = ln.trim();
      if (!trimmed) return;
      var parts = trimmed.split('\t');
      if (parts.length >= 2) {
        pseudoBlocks.push({
          h: 10.5,
          align: 'left',
          isBold: false,
          cells: parts.map(function (p, i) { return { text: p.trim(), x: i * 140, endX: (i + 1) * 130, isBold: false }; }),
          text: trimmed
        });
      } else {
        pseudoBlocks.push({
          h: 10.5,
          align: 'left',
          indentPt: 0,
          isBold: /^(নিচের\s+উদ্দীপক|উদ্দীপকটি\s+পড়ে|নিচের\s+কোনটি)/.test(trimmed),
          cells: [{ text: trimmed, x: 0, endX: 200, isBold: false }],
          text: trimmed
        });
      }
    });
    return renderStructuredBlocksHtml(pseudoBlocks, { minX: 0, maxX: 520, width: 520, isNarrowCol: false }, fontStack);
  }

  function renderPageLayoutBodyHtml(pageText, pageLayout, fontStack) {
    if (pageLayout && pageLayout.bands && pageLayout.bands.length) {
      return pageLayout.bands.map(function (band) {
        if (band.type === 'two-col') {
          var leftHtml = renderStructuredBlocksHtml(band.leftBlocks, band.leftBounds, fontStack);
          var rightHtml = renderStructuredBlocksHtml(band.rightBlocks, band.rightBounds, fontStack);
          return '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;table-layout:fixed;mso-table-lspace:0pt;mso-table-rspace:0pt;margin:2pt 0;">' +
            '<tr>' +
              '<td width="48%" valign="top" style="width:48.5%;vertical-align:top;padding-right:9pt;border-right:1pt solid #cbd5e1;">' + leftHtml + '</td>' +
              '<td width="3%" valign="top" style="width:2.5%;vertical-align:top;font-size:1pt;">&nbsp;</td>' +
              '<td width="49%" valign="top" style="width:49%;vertical-align:top;padding-left:6pt;">' + rightHtml + '</td>' +
            '</tr>' +
          '</table>';
        }
        return renderStructuredBlocksHtml(band.blocks, band.bounds, fontStack);
      }).join('');
    }
    return renderPlainFallbackBlocksHtml(pageText, fontStack);
  }

  function buildWordDocHtml(pageTexts, title, pageLayouts, customHtmlBody) {
    var fontStack = "'Nirmala UI','Kalpurush','Siyam Rupali','Noto Sans Bengali','Calibri',sans-serif";
    var bodyContent = '';
    if (customHtmlBody) {
      bodyContent = '<div class="WordSection1">' + customHtmlBody + '</div>';
    } else {
      var pageHtmls = pageTexts.map(function (pageText, idx) {
        var lay = pageLayouts && pageLayouts[idx];
        return renderPageLayoutBodyHtml(pageText, lay, fontStack);
      });
      bodyContent = '<div class="WordSection1">' +
        pageHtmls.join('<br clear="all" style="page-break-before:always;mso-break-type:section-break" />') +
        '</div>';
    }

    return '<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8"><title>' + esc(title) + '</title>' +
      '<!--[if gte mso 9]><xml>' +
      '<w:WordDocument>' +
      '<w:View>Print</w:View>' +
      '<w:Zoom>100</w:Zoom>' +
      '<w:DoNotOptimizeForBrowser/>' +
      '</w:WordDocument>' +
      '</xml><![endif]-->' +
      '<style>' +
      '@page WordSection1 { size: 595.3pt 841.9pt; margin: 34.0pt 36.0pt 34.0pt 36.0pt; mso-header-margin: 18.0pt; mso-footer-margin: 18.0pt; }' +
      'div.WordSection1 { page: WordSection1; }' +
      'body { font-family: ' + fontStack + '; font-size: 10.5pt; color: #0f172a; margin: 0; padding: 0; }' +
      'p { margin: 0 0 2pt 0; line-height: 1.32; }' +
      'table { border-collapse: collapse; }' +
      'td { vertical-align: top; }' +
      '</style>' +
      '</head><body>' +
      bodyContent +
      '</body></html>';
  }

  function runPdf2Other() {
    var st = p2oState;
    if (!st) return;
    var fmt = ($('input[name="pdfToOtherFmt"]:checked') || {}).value || 'jpg';
    var scale = parseFloat(($('input[name="pdfImgScale"]:checked') || {}).value || '2.2');
    var ocrMode = ($('input[name="pdfOcrMode"]:checked') || {}).value || 'auto';
    var ocrLang = ($('input[name="pdfOcrLang"]:checked') || {}).value || 'ben+eng';
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
      var pageLayouts = [];
      var usedOcrCount = 0;
      var chainT = Promise.resolve();
      st.pages.forEach(function (p, i) {
        chainT = chainT.then(function () {
          if (p.isBlank) { texts.push(''); pageLayouts.push(null); return; }
          var basePct = 5 + (i / total) * 85;
          var stepPct = 85 / total;

          if (ocrMode === 'force') {
            setProgress(basePct + 2, 'পৃষ্ঠা ' + toBn(i + 1) + '/' + toBn(total) + ' — AI OCR চলছে (বাংলা + ইংরেজি)…');
            return ocrPageCanvas(p.doc, p.idx + 1, p.rotation, ocrLang, function (prog) {
              var pct = Math.min(94, Math.round(basePct + prog * stepPct));
              setProgress(pct, 'পৃষ্ঠা ' + toBn(i + 1) + '/' + toBn(total) + ' — OCR চলছে (' + toBn(Math.round(prog * 100)) + '%)…');
            }).then(function (ocrRes) {
              usedOcrCount++;
              texts.push(ocrRes.text || '');
              pageLayouts.push(ocrRes.layout || null);
            });
          }

          setProgress(basePct + 2, 'পৃষ্ঠা ' + toBn(i + 1) + '/' + toBn(total) + ' থেকে স্মার্ট লেআউট ও ফন্ট পড়া হচ্ছে…');
          return p.doc.pdfjs.getPage(p.idx + 1).then(extractPageTextSmart).then(function (res) {
            if (ocrMode === 'auto' && res.garbled) {
              setProgress(basePct + 5, 'পৃষ্ঠা ' + toBn(i + 1) + '/' + toBn(total) + ' স্ক্যান/হিজিবিজি শনাক্ত হয়েছে — অটো OCR চলছে…');
              return ocrPageCanvas(p.doc, p.idx + 1, p.rotation, ocrLang, function (prog) {
                var pct = Math.min(94, Math.round(basePct + prog * stepPct));
                setProgress(pct, 'পৃষ্ঠা ' + toBn(i + 1) + '/' + toBn(total) + ' — অটো OCR চলছে (' + toBn(Math.round(prog * 100)) + '%)…');
              }).then(function (ocrRes) {
                usedOcrCount++;
                texts.push((ocrRes && ocrRes.text) || res.text);
                pageLayouts.push((ocrRes && ocrRes.layout) || res.layout || null);
              }).catch(function () {
                texts.push(res.text);
                pageLayouts.push(res.layout || null);
              });
            }
            texts.push(res.text);
            pageLayouts.push(res.layout || null);
          });
        });
      });

      return chainT.then(function () {
        var full = texts.map(function (t, i) {
          var cleanT = String(t || '').replace(/\t/g, '    ');
          return (total > 1 ? '=== পৃষ্ঠা ' + toBn(i + 1) + ' ===\n' : '') +
            (cleanT || '(এই পৃষ্ঠায় কোনো লেখা পাওয়া যায়নি)');
        }).join('\n\n');

        var fontStack = "'Nirmala UI','Kalpurush','Siyam Rupali','Noto Sans Bengali','Calibri',sans-serif";
        var richPreviewPagesHtml = texts.map(function (t, idx) {
          var pageHead = total > 1
            ? '<div style="font-size:9pt;color:#64748b;border-bottom:1px dashed #cbd5e1;padding-bottom:4px;margin-bottom:10px;font-weight:bold;">পৃষ্ঠা ' + toBn(idx + 1) + '</div>'
            : '';
          var bodyH = renderPageLayoutBodyHtml(t, pageLayouts[idx], fontStack);
          return '<div class="pdf-doc-sheet" style="background:#ffffff;color:#0f172a;padding:22px 26px;border:1px solid #cbd5e1;border-radius:10px;box-shadow:0 2px 8px rgba(15,23,42,0.06);margin-bottom:12px;">' +
            pageHead +
            (bodyH || '<p style="color:#94a3b8;">(এই পৃষ্ঠায় কোনো লেখা পাওয়া যায়নি)</p>') +
            '</div>';
        }).join('');

        var modeBadge = usedOcrCount > 0
          ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">AI OCR (' + toBn(usedOcrCount) + ' পৃষ্ঠা) + ২ডি লেআউট</span>'
          : '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[11px] font-bold">হুবহু ২ডি লেআউট + বিজয়/ইউনিকোড ফিক্স</span>';

        var showRichDefault = (fmt !== 'txt');

        prev.hidden = false;
        prev.innerHTML = '<div class="pdf-extracted-box space-y-2.5">' +
          '<div class="pdf-extracted-head flex items-center justify-between flex-wrap gap-2">' +
            '<div class="flex items-center gap-2 flex-wrap"><strong>কনভার্ট করা ডকুমেন্ট (সম্পাদনাযোগ্য প্রিভিউ):</strong>' + modeBadge + '</div>' +
            '<div class="flex items-center gap-2 flex-wrap">' +
              '<button type="button" class="chip-btn inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text hover:border-emerald-500 cursor-pointer transition-colors" id="pdfToggleViewModeBtn">' +
                (showRichDefault ? '📝 প্লেইন টেক্সট ভিউ' : '📄 ফরম্যাটেড পেজ ভিউ') +
              '</button>' +
              '<button type="button" class="chip-btn inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text hover:border-emerald-500 cursor-pointer transition-colors" id="pdfCopyExtTxtBtn">কপি করুন</button>' +
              '<button type="button" class="chip-btn inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border-0 cursor-pointer transition-colors" id="pdfRedownloadExtBtn">⬇ আবার ডাউনলোড (' + (fmt === 'txt' ? '.txt' : '.doc') + ')</button>' +
            '</div>' +
          '</div>' +
          '<div id="pdfDocRichPreview" contenteditable="true" spellcheck="false" class="w-full max-h-[540px] overflow-y-auto p-3 rounded-xl bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border outline-none"' + (showRichDefault ? '' : ' hidden') + '>' +
            richPreviewPagesHtml +
          '</div>' +
          '<textarea class="textbox w-full p-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs font-sans text-slate-800 dark:text-studio-text outline-none leading-relaxed" rows="12" id="pdfExtTxtArea" aria-label="এক্সট্র্যাক্ট করা লেখা"' + (showRichDefault ? ' hidden' : '') + '></textarea>' +
        '</div>';

        var area = $('#pdfExtTxtArea');
        var richBox = $('#pdfDocRichPreview');
        var toggleBtn = $('#pdfToggleViewModeBtn');
        area.value = full;
        var richEdited = false;
        var plainEdited = false;

        if (richBox) {
          richBox.addEventListener('input', function () { richEdited = true; });
        }
        if (area) {
          area.addEventListener('input', function () { plainEdited = true; });
        }
        if (toggleBtn) {
          toggleBtn.addEventListener('click', function () {
            var isRichVisible = !richBox.hidden;
            richBox.hidden = isRichVisible;
            area.hidden = !isRichVisible;
            toggleBtn.textContent = isRichVisible ? '📄 ফরম্যাটেড পেজ ভিউ' : '📝 প্লেইন টেক্সট ভিউ';
          });
        }

        function triggerDocOrTxtDownload(initialAuto) {
          if (fmt === 'txt') {
            var txtContent = initialAuto ? full : area.value;
            downloadBlob(new Blob(['\ufeff' + txtContent], { type: 'text/plain;charset=utf-8' }), base + '.txt');
            showToast('টেক্সট (.txt) ফাইল ডাউনলোড হয়েছে!');
          } else {
            var html;
            if (!initialAuto && richEdited && richBox) {
              var sheets = $all('.pdf-doc-sheet', richBox);
              var customBody = sheets.length
                ? sheets.map(function (sh) { return sh.innerHTML; }).join('<br clear="all" style="page-break-before:always;mso-break-type:section-break" />')
                : richBox.innerHTML;
              html = buildWordDocHtml(texts, base, pageLayouts, customBody);
            } else if (!initialAuto && plainEdited && !richEdited) {
              html = buildWordDocHtml([area.value], base, null);
            } else {
              html = buildWordDocHtml(texts, base, pageLayouts);
            }
            downloadBlob(new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' }), base + '.doc');
            showToast('Word (.doc) ফাইল ডাউনলোড হয়েছে!');
          }
        }

        $('#pdfCopyExtTxtBtn').addEventListener('click', function () {
          var copyTxt = (!richBox.hidden && richEdited) ? richBox.innerText : area.value;
          navigator.clipboard.writeText(copyTxt).then(function () { showToast('লেখা কপি করা হয়েছে!'); });
        });
        $('#pdfRedownloadExtBtn').addEventListener('click', function () {
          triggerDocOrTxtDownload(false);
        });

        triggerDocOrTxtDownload(true);
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
   * 7. DECRYPT PDF (Auto-unlock without password + optional new password)
   * ================================================================== */
  var decryptState = null;

  function loadDecryptFile(files) {
    loadSinglePdf(files, tr('PDF লক পরীক্ষা ও আনলক হচ্ছে…', 'Inspecting & unlocking PDF…')).then(function (st) {
      decryptState = st;
      renderDecryptUI();
      var sec = st.doc && st.doc.security;
      if (sec && sec.encrypted) {
        showToast(tr('সফলভাবে আনলক হয়েছে! ডাউনলোড বা নতুন পাসওয়ার্ড সেট করতে পারেন।', 'PDF unlocked! Ready to download or set a new password.'));
      } else {
        showToast(tr('ফাইল লোড হয়েছে (কোনো পাসওয়ার্ড লক পাওয়া যায়নি)।', 'PDF loaded (no password lock detected).'));
      }
    }).catch(function () {});
  }

  function renderDecryptUI() {
    showStage('pdfDecrypt', !!decryptState);
    if (!decryptState) return;
    var st = decryptState;
    var sec = (st.doc && st.doc.security) || { encrypted: false };
    var card = $('#pdfDecryptStatusCard');
    if (card) {
      var badgeHtml = '';
      var detailHtml = '';
      if (sec.encrypted) {
        if (sec.lockType === 'owner') {
          badgeHtml = '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold">' +
            '<svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.4]" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>' +
            tr('পাসওয়ার্ড ছাড়াই আনলক হয়েছে (Owner / Permission Lock)', 'Unlocked Without Password (Owner / Permission Lock)') +
          '</span>';
        } else if (sec.autoRecovered) {
          badgeHtml = '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold">' +
            '<svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.4]" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>' +
            tr('পাসওয়ার্ড ছাড়াই স্বয়ংক্রিয়ভাবে আনলক হয়েছে!', 'Automatically Unlocked Without Password!') +
          '</span>';
        } else {
          badgeHtml = '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold">' +
            '<svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.4]" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>' +
            tr('পাসওয়ার্ড আনলক সম্পন্ন', 'Unlocked & Ready') +
          '</span>';
        }
        var locks = [];
        if (!sec.canPrint) locks.push(tr('প্রিন্ট লক', 'Print Locked'));
        if (!sec.canCopy) locks.push(tr('কপি লক', 'Copy Locked'));
        if (!sec.canModify) locks.push(tr('এডিট/মার্জ লক', 'Edit/Merge Locked'));
        var lockDesc = locks.length ? locks.join(' • ') : tr('ওপেন/সিকিউরিটি লক', 'Security Lock');
        detailHtml = '<div class="text-xs text-slate-600 dark:text-studio-muted mt-1">' +
          tr('শনাক্তকৃত সিকিউরিটি: ', 'Detected Security: ') + '<b>' + esc(sec.algoLabel || '128-bit Standard') + '</b> (' + lockDesc + ') — ' +
          '<span class="text-emerald-600 dark:text-emerald-400 font-semibold">' + tr('সব রেস্ট্রিকশন সরিয়ে ফেলা হয়েছে', 'All restrictions removed') + '</span></div>';
      } else {
        badgeHtml = '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-studio-panel text-slate-700 dark:text-studio-text text-xs font-bold">' +
          tr('কোনো পাসওয়ার্ড লক নেই (Already Unlocked)', 'No Password Lock Detected (Already Unlocked)') +
        '</span>';
        detailHtml = '<div class="text-xs text-slate-500 dark:text-studio-muted mt-1">' +
          tr('ফাইলটি ইতিমধ্যে আনলকড। আপনি ক্লিন কপি ডাউনলোড করতে পারেন অথবা নিচে নতুন ইউজার পাসওয়ার্ড সেট করতে পারেন।', 'This PDF is already unlocked. You can download a clean copy or set a new user password below.') + '</div>';
      }

      card.innerHTML =
        '<div class="flex items-start justify-between flex-wrap gap-2">' +
          '<div class="flex items-center gap-2.5 min-w-0">' +
            '<div class="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-studio-primary flex items-center justify-center shrink-0">' +
              '<svg class="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>' +
            '</div>' +
            '<div class="min-w-0">' +
              '<div class="text-xs sm:text-sm font-bold text-slate-900 dark:text-studio-text truncate">' + esc(st.name) + '</div>' +
              '<div class="text-[11px] text-slate-500 dark:text-studio-muted">' + tr('মোট ', 'Total ') + fmtN(st.pages.length) + tr(' পৃষ্ঠা • সাইজ: ', ' pages • Size: ') + '<b>' + fmtSize(st.size) + '</b></div>' +
            '</div>' +
          '</div>' +
          badgeHtml +
        '</div>' +
        detailHtml;
    }

    var isReencrypt = $('input[name="pdfDecryptAction"]:checked') && $('input[name="pdfDecryptAction"]:checked').value === 'reencrypt';
    var newPwdBox = $('#pdfDecryptNewPwdBox');
    if (newPwdBox) newPwdBox.hidden = !isReencrypt;
    var btnLbl = $('#pdfDecryptRunBtnLabel');
    if (btnLbl) {
      btnLbl.textContent = isReencrypt
        ? tr('নতুন পাসওয়ার্ডসহ ডাউনলোড করুন', 'Encrypt with New Password & Download')
        : tr('আনলক ও ডাউনলোড করুন', 'Decrypt & Download PDF');
    }

    renderGrid($('#pdfDecryptPagesGrid'), {
      items: st.pages,
      label: function (p, i) { return tr('পৃষ্ঠা ', 'Page ') + fmtN(i + 1); },
      actions: function () { return ['rotL', 'rotR', 'zoom']; },
      onAction: function (act, i) {
        if (act === 'rotL') rotatePage(st.pages[i], -90);
        else if (act === 'rotR') rotatePage(st.pages[i], 90);
        else if (act === 'zoom') { previewPages(st.pages, st.name, i); return; }
        renderDecryptUI();
      }
    });

    $('#pdfDecryptSummary').textContent = isEn()
      ? fmtN(st.pages.length) + (st.pages.length === 1 ? ' page' : ' pages') + ' • ' + (isReencrypt ? 'Ready to set new password' : 'Ready to download unlocked')
      : 'মোট ' + fmtN(st.pages.length) + ' পৃষ্ঠা • ' + (isReencrypt ? 'নতুন পাসওয়ার্ড সেট করতে প্রস্তুত' : 'পাসওয়ার্ডমুক্ত ডাউনলোডের জন্য প্রস্তুত');
  }

  function runDecryptPdf() {
    if (!decryptState) { showToast(tr('অনুগ্রহ করে একটি PDF ফাইল নির্বাচন করুন।', 'Please select a PDF file first.')); return; }
    var isReencrypt = $('input[name="pdfDecryptAction"]:checked') && $('input[name="pdfDecryptAction"]:checked').value === 'reencrypt';
    var newPw = ($('#pdfDecryptNewUserPwd') && $('#pdfDecryptNewUserPwd').value) || '';
    if (isReencrypt && !newPw) {
      showToast(tr('অনুগ্রহ করে নতুন ইউজার পাসওয়ার্ড লিখুন।', 'Please enter a new user password.'));
      if ($('#pdfDecryptNewUserPwd')) $('#pdfDecryptNewUserPwd').focus();
      return;
    }
    var btn = $('#pdfDecryptRunBtn');
    btn.disabled = true;
    buildPdfFromPages(decryptState.pages, {
      onProgress: function (n, t) { setProgress(5 + (n / t) * 75, tr('পৃষ্ঠা ', 'Page ') + fmtN(n) + '/' + fmtN(t) + tr(' আনলক হচ্ছে…', ' unlocking…')); }
    }).then(function (unlockedBytes) {
      if (!isReencrypt) return unlockedBytes;
      setProgress(88, tr('নতুন পাসওয়ার্ড দিয়ে এনক্রিপ্ট হচ্ছে…', 'Applying new password…'));
      return encryptPdfBytes(unlockedBytes, {
        userPassword: newPw,
        allowPrint: $('#pdfDecryptAllowPrint') ? $('#pdfDecryptAllowPrint').checked : true,
        allowCopy: $('#pdfDecryptAllowCopy') ? $('#pdfDecryptAllowCopy').checked : true,
        allowModify: $('#pdfDecryptAllowModify') ? $('#pdfDecryptAllowModify').checked : true
      });
    }).then(function (finalBytes) {
      setProgress(null);
      btn.disabled = false;
      var suffix = isReencrypt ? '-protected.pdf' : '-unlocked.pdf';
      downloadBlob(new Blob([finalBytes], { type: 'application/pdf' }), baseName(decryptState.name) + suffix);
      showToast(isReencrypt
        ? tr('নতুন পাসওয়ার্ডসহ PDF সফলভাবে ডাউনলোড হয়েছে!', 'PDF protected with new password and downloaded!')
        : tr('পাসওয়ার্ডমুক্ত আনলকড PDF সফলভাবে ডাউনলোড হয়েছে!', 'Unlocked PDF downloaded successfully!'));
    }).catch(function (err) {
      setProgress(null);
      btn.disabled = false;
      showToast(tr('ডিক্রিপ্ট করতে সমস্যা হয়েছে: ', 'Decryption failed: ') + ((err && err.message) || ''));
    });
  }

  /* ==================================================================
   * 8. ENCRYPT PDF (Protect PDF with User Password & Permissions)
   * ================================================================== */
  var encryptState = null;

  function loadEncryptFile(files) {
    loadSinglePdf(files, tr('PDF লোড হচ্ছে…', 'Loading PDF…')).then(function (st) {
      encryptState = st;
      renderEncryptUI();
      setTimeout(function () {
        var inp = $('#pdfEncryptUserPwd');
        if (inp) inp.focus();
      }, 60);
    }).catch(function () {});
  }

  function updateEncryptStrengthPill() {
    var pill = $('#pdfEncryptStrength');
    var inp = $('#pdfEncryptUserPwd');
    if (!pill || !inp) return;
    var v = inp.value || '';
    if (!v.length) {
      pill.className = 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-studio-sidebar text-slate-600 dark:text-studio-muted';
      pill.textContent = tr('শুধু পারমিশন লক', 'Permission-only lock');
    } else if (v.length < 4) {
      pill.className = 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400';
      pill.textContent = tr('দুর্বল পাসওয়ার্ড', 'Weak password');
    } else if (v.length < 8) {
      pill.className = 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400';
      pill.textContent = tr('মাঝারি পাসওয়ার্ড', 'Medium strength');
    } else {
      pill.className = 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
      pill.textContent = tr('শক্তিশালী পাসওয়ার্ড', 'Strong password');
    }
  }

  function renderEncryptUI() {
    showStage('pdfEncrypt', !!encryptState);
    if (!encryptState) return;
    var st = encryptState;
    fileBanner($('#pdfEncryptFileInfo'), st);
    updateEncryptStrengthPill();
    renderGrid($('#pdfEncryptPagesGrid'), {
      items: st.pages,
      label: function (p, i) { return tr('পৃষ্ঠা ', 'Page ') + fmtN(i + 1); },
      actions: function () { return ['rotL', 'rotR', 'zoom']; },
      onAction: function (act, i) {
        if (act === 'rotL') rotatePage(st.pages[i], -90);
        else if (act === 'rotR') rotatePage(st.pages[i], 90);
        else if (act === 'zoom') { previewPages(st.pages, st.name, i); return; }
        renderEncryptUI();
      }
    });
    $('#pdfEncryptSummary').textContent = isEn()
      ? fmtN(st.pages.length) + (st.pages.length === 1 ? ' page' : ' pages') + ' • 128-bit Standard Security'
      : 'মোট ' + fmtN(st.pages.length) + ' পৃষ্ঠা • ১২৮-বিট স্ট্যান্ডার্ড সিকিউরিটি';
  }

  function runEncryptPdf() {
    if (!encryptState) { showToast(tr('অনুগ্রহ করে একটি PDF ফাইল নির্বাচন করুন।', 'Please select a PDF file first.')); return; }
    var userPw = ($('#pdfEncryptUserPwd') && $('#pdfEncryptUserPwd').value) || '';
    var ownerPw = ($('#pdfEncryptOwnerPwd') && $('#pdfEncryptOwnerPwd').value) || '';
    var allowPrint = $('#pdfEncryptAllowPrint') ? $('#pdfEncryptAllowPrint').checked : true;
    var allowCopy = $('#pdfEncryptAllowCopy') ? $('#pdfEncryptAllowCopy').checked : false;
    var allowModify = $('#pdfEncryptAllowModify') ? $('#pdfEncryptAllowModify').checked : false;

    if (!userPw && !ownerPw && allowPrint && allowCopy && allowModify) {
      showToast(tr('অনুগ্রহ করে একটি ইউজার পাসওয়ার্ড দিন অথবা অন্তত একটি পারমিশন আনচেক করুন।', 'Please enter a user password or restrict at least one permission.'));
      if ($('#pdfEncryptUserPwd')) $('#pdfEncryptUserPwd').focus();
      return;
    }

    var btn = $('#pdfEncryptRunBtn');
    btn.disabled = true;
    buildPdfFromPages(encryptState.pages, {
      onProgress: function (n, t) { setProgress(5 + (n / t) * 70, tr('পৃষ্ঠা ', 'Page ') + fmtN(n) + '/' + fmtN(t) + tr(' প্রস্তুত হচ্ছে…', ' preparing…')); }
    }).then(function (plainBytes) {
      setProgress(85, tr('১২৮-বিট পাসওয়ার্ড এনক্রিপশন যুক্ত হচ্ছে…', 'Applying 128-bit password encryption…'));
      return encryptPdfBytes(plainBytes, {
        userPassword: userPw,
        ownerPassword: ownerPw,
        allowPrint: allowPrint,
        allowCopy: allowCopy,
        allowModify: allowModify
      });
    }).then(function (encBytes) {
      setProgress(null);
      btn.disabled = false;
      downloadBlob(new Blob([encBytes], { type: 'application/pdf' }), baseName(encryptState.name) + '-protected.pdf');
      showToast(tr('সফলভাবে পাসওয়ার্ড লক করা হয়েছে! (' + fmtSize(encBytes.byteLength) + ')', 'PDF encrypted and downloaded! (' + fmtSize(encBytes.byteLength) + ')'));
    }).catch(function (err) {
      setProgress(null);
      btn.disabled = false;
      showToast(tr('এনক্রিপ্ট করতে সমস্যা হয়েছে: ', 'Encryption failed: ') + ((err && err.message) || ''));
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
      case 'decrypt': loadDecryptFile(files); break;
      case 'encrypt': loadEncryptFile(files); break;
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
      r.addEventListener('change', syncPdf2OtherFormatControls);
    });
    syncPdf2OtherFormatControls();
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

    // 7. Decrypt PDF
    wireDropzone($('#pdfDecryptDropzone'), $('#pdfDecryptInput'), loadDecryptFile);
    $$('input[name="pdfDecryptAction"]').forEach(function (r) {
      r.addEventListener('change', function () {
        renderDecryptUI();
        if (r.value === 'reencrypt' && r.checked && $('#pdfDecryptNewUserPwd')) {
          setTimeout(function () { $('#pdfDecryptNewUserPwd').focus(); }, 40);
        }
      });
    });
    on('pdfDecryptNewPwdToggle', 'click', function () {
      var inp = $('#pdfDecryptNewUserPwd');
      if (!inp) return;
      inp.type = inp.type === 'password' ? 'text' : 'password';
      inp.focus();
    });
    on('pdfDecryptRotLeftAll', 'click', function () { if (decryptState) { rotateAll(decryptState.pages, -90); renderDecryptUI(); } });
    on('pdfDecryptRotRightAll', 'click', function () { if (decryptState) { rotateAll(decryptState.pages, 90); renderDecryptUI(); } });
    on('pdfDecryptResetBtn', 'click', function () { decryptState = null; renderDecryptUI(); });
    on('pdfDecryptRunBtn', 'click', runDecryptPdf);

    // 8. Encrypt PDF
    wireDropzone($('#pdfEncryptDropzone'), $('#pdfEncryptInput'), loadEncryptFile);
    on('pdfEncryptUserPwd', 'input', updateEncryptStrengthPill);
    on('pdfEncryptUserPwdToggle', 'click', function () {
      var inp = $('#pdfEncryptUserPwd');
      if (!inp) return;
      inp.type = inp.type === 'password' ? 'text' : 'password';
      inp.focus();
    });
    on('pdfEncryptOwnerPwdToggle', 'click', function () {
      var inp = $('#pdfEncryptOwnerPwd');
      if (!inp) return;
      inp.type = inp.type === 'password' ? 'text' : 'password';
      inp.focus();
    });
    on('pdfEncryptRotLeftAll', 'click', function () { if (encryptState) { rotateAll(encryptState.pages, -90); renderEncryptUI(); } });
    on('pdfEncryptRotRightAll', 'click', function () { if (encryptState) { rotateAll(encryptState.pages, 90); renderEncryptUI(); } });
    on('pdfEncryptResetBtn', 'click', function () { encryptState = null; renderEncryptUI(); });
    on('pdfEncryptRunBtn', 'click', runEncryptPdf);

    window.addEventListener('th:langchange', function () {
      if (mergeItems.length) renderMergeUI();
      if (splitState) renderSplitUI();
      if (compressState) renderCompressUI();
      if (orgState) renderOrgUI();
      if (p2oState) renderPdf2OtherUI();
      if (imgItems.length) renderImg2PdfUI();
      if (decryptState) renderDecryptUI();
      if (encryptState) renderEncryptUI();
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
