/*!
 * TechHat Utility Hub — Shared App Shell (Astro Multi-Page Edition)
 * Handles:
 *   1. Light / Dark theme toggle & persistence
 *   2. Cascading "টুলস" menu (accordion + live search)
 *   3. PWA service worker & install prompt
 *   4. Clipboard image paste (Ctrl+V and paste button)
 *   5. Footer Bangla year & legacy #tool-* hash redirects
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var BN = '০১২৩৪৫৬৭৮৯';
  function toBn(n) { return String(n).replace(/\d/g, function (d) { return BN[d]; }); }

  /* ------------------------------------------------------------------ Legacy #tool-* Hash Redirects */
  var HASH_ROUTES = {
    '#tool-pdf': '/pdf',
    '#tool-image': '/image',
    '#tool-calendar': '/calendar',
    '#tool-age': '/age-calculator',
    '#tool-datecalc': '/date-calculator',
    '#tool-invoice': '/invoice'
  };
  if (document.body && document.body.getAttribute('data-astro-mpa') === '1' && location.hash) {
    var targetRoute = HASH_ROUTES[location.hash.toLowerCase()];
    if (targetRoute && location.pathname !== targetRoute) {
      location.replace(targetRoute);
      return;
    }
  }

  /* ------------------------------------------------------------------ Toast */
  var toastTimer = null;
  function showToast(msg, ms) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    t.style.animation = 'none';
    void t.offsetWidth;
    t.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, ms || 2400);
  }
  window.TechHatToast = showToast;

  /* ------------------------------------------------------------------ Dual Theme (Light / Dark) */
  var metaColorScheme = $('meta[name="color-scheme"]');
  var metaThemeColor = $('meta[name="theme-color"]');
  var mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : { matches: false };

  function getCurrentTheme() {
    var stored = null;
    try { stored = localStorage.getItem('thbc-theme') || localStorage.getItem('color-scheme'); } catch (e) {}
    if (stored === 'dark' || stored === 'light') return stored;
    var attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr;
    return mqDark.matches ? 'dark' : 'light';
  }

  function applyTheme(theme, save) {
    document.documentElement.setAttribute('data-theme', theme);
    if (metaColorScheme) metaColorScheme.content = theme;
    if (metaThemeColor) metaThemeColor.content = theme === 'dark' ? '#090d16' : '#ffffff';
    var themeBtn = $('#themeToggle');
    if (themeBtn) {
      themeBtn.title = theme === 'dark' ? 'লাইট থিমে যান' : 'ডার্ক থিমে যান';
      themeBtn.setAttribute('aria-label', themeBtn.title);
    }
    if (save) {
      try { localStorage.setItem('thbc-theme', theme); } catch (e) {}
    }
  }

  var themeToggleBtn = $('#themeToggle');
  if (themeToggleBtn && !themeToggleBtn.dataset.shellBound) {
    themeToggleBtn.dataset.shellBound = '1';
    themeToggleBtn.addEventListener('click', function () {
      var next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
      showToast(next === 'dark' ? 'ডার্ক থিম চালু হয়েছে' : 'লাইট থিম চালু হয়েছে', 1800);
    });
  }
  applyTheme(getCurrentTheme(), false);

  /* ------------------------------------------------------------------ Sidebar Search Filter (Static DOM) */
  var searchInput = $('#toolSearch');
  var sidebarList = $('#toolsSidebarList');
  if (searchInput && sidebarList && !searchInput.dataset.shellBound) {
    searchInput.dataset.shellBound = '1';
    searchInput.addEventListener('input', function () {
      // If tools.js is not loaded on this page, filter the Astro-rendered .tool-nav-card links directly
      if (window.TechHatTools) return;
      var q = (searchInput.value || '').trim().toLowerCase();
      var cards = $$('.tool-nav-card', sidebarList);
      var visible = 0;
      cards.forEach(function (card) {
        var hay = (
          (card.textContent || '') + ' ' +
          (card.getAttribute('data-keywords') || '') + ' ' +
          (card.getAttribute('data-badge') || '')
        ).toLowerCase();
        var match = !q || hay.indexOf(q) !== -1;
        card.hidden = !match;
        if (match) visible++;
      });
      var emptyEl = $('.tools-empty', sidebarList);
      if (!visible) {
        if (!emptyEl) {
          emptyEl = document.createElement('div');
          emptyEl.className = 'tools-empty';
          emptyEl.textContent = 'কোনো টুল পাওয়া যায়নি';
          sidebarList.appendChild(emptyEl);
        }
        emptyEl.hidden = false;
      } else if (emptyEl) {
        emptyEl.hidden = true;
      }
    });
  }

    /* ------------------------------------------------------------------ Tools Menu (cascading, searchable) */
  $$('.tm').forEach(function (toolsMenu) {
  if (!toolsMenu.dataset.shellBound) {
    toolsMenu.dataset.shellBound = '1';
    var tmTree = $('.tm__tree', toolsMenu);
    var tmSearch = $('.tm__input', toolsMenu);
    var tmEmpty = $('.tm__empty', toolsMenu);
    var tmGroups = $$('.tm__group', toolsMenu);

    function normPath(p) { return (p || '/').replace(/\/+$/, '') || '/'; }

    function setGroup(group, open) {
      group.classList.toggle('is-open', open);
      var btn = $('.tm__group-btn', group);
      var sub = $('.tm__sub', group);
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (sub) sub.hidden = !open;
    }

    function collapseAll() { tmGroups.forEach(function (g) { setGroup(g, false); }); }

    function markCurrent() {
      var here = normPath(location.pathname);
      $$('.tm__leaf, .tm__single', toolsMenu).forEach(function (a) {
        var cur = normPath(a.getAttribute('href')) === here;
        if (a.classList.contains('tm__leaf')) {
          if (cur) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        } else {
          a.classList.toggle('is-current', cur);
        }
      });
      tmGroups.forEach(function (g) {
        g.classList.toggle('is-current', !!$('.tm__leaf[aria-current="page"]', g));
      });
    }

    function runSearch() {
      var q = (tmSearch.value || '').trim().toLowerCase().normalize('NFC');
      var visible = 0;
      tmTree.classList.toggle('is-searching', !!q);
      tmGroups.forEach(function (g) {
        var leaves = $$('.tm__leaf', g);
        var matched = 0;
        leaves.forEach(function (l) {
          var ok = !q || (l.getAttribute('data-search') || '').normalize('NFC').indexOf(q) !== -1;
          l.hidden = !ok;
          if (ok) matched++;
        });
        var groupHit = q && (g.getAttribute('data-search') || '').normalize('NFC').indexOf(q) !== -1 && !matched;
        if (groupHit) { leaves.forEach(function (l) { l.hidden = false; }); matched = leaves.length; }
        g.hidden = !!q && !matched;
        if (q) setGroup(g, matched > 0); else setGroup(g, false);
        if (!g.hidden) visible += q ? matched : 1;
      });
      $$('.tm__single', toolsMenu).forEach(function (a) {
        var ok = !q || (a.getAttribute('data-search') || '').normalize('NFC').indexOf(q) !== -1;
        a.hidden = !ok;
        if (ok) visible++;
      });
      if (tmEmpty) tmEmpty.hidden = visible > 0;
    }

    tmGroups.forEach(function (g) {
      var btn = $('.tm__group-btn', g);
      btn.addEventListener('click', function () {
        var willOpen = !g.classList.contains('is-open');
        if (!tmTree.classList.contains('is-searching')) collapseAll();
        setGroup(g, willOpen);
      });
    });

    tmSearch.addEventListener('input', runSearch);

    // Inside the same studio, switch tabs in-page instead of reloading.
    toolsMenu.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('.tm__leaf') : null;
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      var studio = a.getAttribute('data-studio');
      var tab = a.getAttribute('data-sub-tab');
      var host = studio === 'image' ? $('#tool-image') : studio === 'pdf' ? $('#tool-pdf') : null;
      var attr = studio === 'image' ? 'data-img-tab' : 'data-pdf-tab';
      var tabBtn = host && tab ? $('[' + attr + '="' + tab + '"]', host) : null;
      if (tabBtn) {
        e.preventDefault();
        tabBtn.click();
        toolsMenu.open = false;
        window.scrollTo({ top: 0 });
      }
    });

    toolsMenu.addEventListener('toggle', function () {
      if (toolsMenu.open) {
        markCurrent();
        tmSearch.value = '';
        runSearch();
        tmSearch.focus({ preventScroll: true });
      }
    });
    document.addEventListener('click', function (e) {
      if (toolsMenu.open && !toolsMenu.contains(e.target)) toolsMenu.open = false;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toolsMenu.open) {
        toolsMenu.open = false;
        var sum = $('summary', toolsMenu);
        if (sum) sum.focus();
      }
    });
    markCurrent();
  }
  });

/* ------------------------------------------------------------------ Clipboard image paste (Ctrl+V + paste button) */
  (function () {
    var EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/bmp': 'bmp' };
    // Primary (dropzone) input -> button that clears the already-loaded image(s) of that tool.
    var RESET = {
      imgResizeInput: 'imgResizeResetBtn',
      imgCompressInput: 'imgCompressClearBtn',
      imgCropInput: 'imgCropResetBtn',
      imgConvertInput: 'imgConvertResetBtn',
      imgColorsInput: 'imgColorsResetBtn',
      pdfMergeInput: 'pdfMergeClearBtn',
      img2pdfInput: 'img2pdfClearBtn'
    };

    function isImageFile(f) { return f && /^image\//.test(f.type || ''); }

    function acceptsImages(input) {
      var acc = (input.getAttribute('accept') || '').toLowerCase();
      return !acc || acc.indexOf('image/') !== -1;
    }

    function nameFiles(files) {
      var stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
      return files.map(function (f, i) {
        var ext = EXT[f.type] || 'png';
        return new File([f], 'clipboard-' + stamp + (files.length > 1 ? '-' + (i + 1) : '') + '.' + ext, { type: f.type, lastModified: Date.now() });
      });
    }

    function feed(input, files) {
      var list = input.multiple ? files : files.slice(0, 1);
      var dt = new DataTransfer();
      list.forEach(function (f) { dt.items.add(f); });
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return list.length;
    }

    /** Small modal asking whether the pasted image should replace the current one. */
    function confirmReplace(message, file) {
      return new Promise(function (resolve) {
        var dlg = document.createElement('dialog');
        dlg.className = 'paste-confirm';
        dlg.setAttribute('aria-label', 'ছবি রিপ্লেস নিশ্চিত করুন');
        var url = null;
        var preview = '';
        if (file) { url = URL.createObjectURL(file); preview = '<img class="paste-confirm__img" alt="ক্লিপবোর্ডের ছবি" src="' + url + '">'; }
        dlg.innerHTML =
          '<div class="paste-confirm__body">' +
            '<div class="paste-confirm__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div>' +
            '<h3 class="paste-confirm__title">বর্তমান ছবি রিপ্লেস করবেন?</h3>' +
            '<p class="paste-confirm__msg"></p>' + preview +
            '<div class="paste-confirm__actions">' +
              '<button type="button" class="chip-btn" data-r="0">না, থাক</button>' +
              '<button type="button" class="btn btn--primary" data-r="1">হ্যাঁ, রিপ্লেস করুন</button>' +
            '</div>' +
          '</div>';
        dlg.querySelector('.paste-confirm__msg').textContent = message;
        var done = false;
        function finish(v) {
          if (done) return;
          done = true;
          if (dlg.open) dlg.close();
          dlg.remove();
          if (url) URL.revokeObjectURL(url);
          resolve(v);
        }
        dlg.addEventListener('click', function (e) {
          var b = e.target.closest ? e.target.closest('[data-r]') : null;
          if (b) finish(b.getAttribute('data-r') === '1');
          else if (e.target === dlg) finish(false);
        });
        dlg.addEventListener('cancel', function (e) { e.preventDefault(); finish(false); });
        document.body.appendChild(dlg);
        dlg.showModal();
        var ok = dlg.querySelector('[data-r="1"]');
        if (ok) ok.focus();
      });
    }

    /**
     * Decide where the pasted image(s) go.
     * Returns { input, replace, resetId, message } or null when no tool accepts images.
     */
    function findTarget(files) {
      // ID-card studio: own front/back workflow.
      var combine = $('#img-pane-combine');
      if (combine && !combine.hidden) {
        var stage = $('#imgCombineStage');
        if (stage && stage.hidden) return { input: $(files.length > 1 ? '#imgCombineInput' : '#nidFrontInput') };
        if ($('.nid-card-tab--add', combine)) return { input: $('#nidReplaceBackInput') }; // only front exists -> fill the back
        var tabs = $$('#nidCardTabs .nid-card-tab:not(.nid-card-tab--add)');
        var idx = 0;
        tabs.forEach(function (t, i) { if (t.classList.contains('active')) idx = i; });
        var label = idx === 0 ? 'সামনের পৃষ্ঠা' : idx === 1 ? 'পেছনের পৃষ্ঠা' : 'কার্ড ' + toBn(idx + 1);
        return {
          input: $(idx === 0 ? '#nidReplaceFrontInput' : idx === 1 ? '#nidReplaceBackInput' : '#nidReplaceExtraInput'),
          replace: true,
          message: 'এখন খোলা "' + label + '"-এর ছবি ক্লিপবোর্ডের ছবি দিয়ে বদলে যাবে। ক্রপ ও এডজাস্টমেন্ট নতুন করে শুরু হবে।'
        };
      }

      // A document paste appends pages and keeps existing page edits.
      var scanner = $('#img-pane-scan');
      if (scanner && !scanner.hidden) return { input: $('#dsFiles') };

      var logo = $('#invLogoInput');
      if (logo) return { input: logo };

      var found = null;
      $$('input[type="file"]').some(function (input) {
        if (!acceptsImages(input) || !RESET[input.id]) return false;
        var zone = input.closest('.pdf-dropzone');
        var outer = (zone ? zone.parentElement : input.parentElement);
        if (outer && outer.closest('[hidden]')) return false; // belongs to a pane / mode that is not on screen
        var loaded = !!(zone && zone.hidden);
        found = loaded
          ? { input: input, replace: true, resetId: RESET[input.id],
              message: 'এই টুলে আগে থেকে যে ছবি আছে তা ক্লিপবোর্ডের ছবি দিয়ে বদলে যাবে। আগের ছবি ও করা পরিবর্তন মুছে যাবে।' }
          : { input: input };
        return true;
      });
      return found;
    }

    function dispatch(rawFiles, forcedInput) {
      var files = rawFiles.filter(isImageFile);
      if (!files.length) return false;
      files = nameFiles(files);
      var t = forcedInput ? { input: forcedInput } : findTarget(files);
      if (!t || !t.input) {
        showToast('এই টুলে ছবি যোগ করার সুযোগ নেই — ছবি নেওয়ার মতো একটি টুল খুলুন');
        return true;
      }
      function go() {
        if (t.resetId) { var rb = $('#' + t.resetId); if (rb) rb.click(); }
        var n = feed(t.input, files);
        showToast(t.replace ? 'ছবি ক্লিপবোর্ডের ছবি দিয়ে রিপ্লেস হয়েছে' : 'ক্লিপবোর্ড থেকে ' + toBn(n) + 'টি ছবি যুক্ত হয়েছে');
      }
      if (t.replace) {
        confirmReplace(t.message, files[0]).then(function (ok) { if (ok) go(); });
      } else {
        go();
      }
      return true;
    }

    function editable(el) {
      return el instanceof Element && !!el.closest('textarea, input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), [contenteditable="true"]');
    }

    document.addEventListener('paste', function (e) {
      if (document.querySelector('dialog.paste-confirm[open]')) { e.preventDefault(); return; }
      var cd = e.clipboardData;
      if (!cd) return;
      var files = [];
      if (cd.files && cd.files.length) files = Array.prototype.slice.call(cd.files);
      else if (cd.items) {
        Array.prototype.forEach.call(cd.items, function (it) {
          if (it.kind === 'file') { var f = it.getAsFile(); if (f) files.push(f); }
        });
      }
      files = files.filter(isImageFile);
      if (!files.length) return;
      // Let normal text pasting work; only take over when the clipboard truly holds an image.
      if (editable(e.target) && cd.getData && cd.getData('text/plain')) return;
      e.preventDefault();
      dispatch(files);
    });

    // Button for touch devices / when Ctrl+V is inconvenient.
    var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>';

    function readClipboard(input) {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        showToast('এই ব্রাউজারে বাটন কাজ করবে না — Ctrl+V চাপুন');
        return;
      }
      navigator.clipboard.read().then(function (items) {
        var jobs = [];
        items.forEach(function (it) {
          it.types.forEach(function (t) {
            if (/^image\//.test(t)) jobs.push(it.getType(t).then(function (b) { return new File([b], 'image', { type: t }); }));
          });
        });
        return Promise.all(jobs);
      }).then(function (files) {
        if (!files.length) { showToast('ক্লিপবোর্ডে কোনো ছবি পাওয়া যায়নি'); return; }
        dispatch(files, input || null);
      }).catch(function () {
        showToast('ক্লিপবোর্ড পড়ার অনুমতি মেলেনি — Ctrl+V চাপুন');
      });
    }

    function makeBtn(cls, input) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.innerHTML = ICON + '<span>ক্লিপবোর্ড থেকে পেস্ট (Ctrl+V)</span>';
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        readClipboard(input);
      });
      return b;
    }

    $$('.pdf-dropzone').forEach(function (zone) {
      var input = $('input[type="file"]', zone);
      if (!input || !acceptsImages(input) || zone.querySelector('.paste-btn')) return;
      zone.appendChild(makeBtn('chip-btn paste-btn', input));
    });
    var artboard = $('.th-empty-artboard__subactions');
    if (artboard && !artboard.querySelector('.paste-btn')) {
      var sep = document.createElement('span');
      sep.className = 'th-dot-sep';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '•';
      artboard.appendChild(sep);
      artboard.appendChild(makeBtn('th-empty-link paste-btn', null));
    }
  })();


  /* ------------------------------------------------------------------ Footer Year & PWA */
  var yearEl = $('#year');
  if (yearEl && !yearEl.textContent) {
    yearEl.textContent = toBn(new Date().getFullYear());
  }

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (r) { r.unregister(); });
      }).catch(function () {});
    } else {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    }
  }

  var installBtn = $('#installBtn');
  if (installBtn && !installBtn.dataset.shellBound) {
    installBtn.dataset.shellBound = '1';
    var installEvt = null;
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      installEvt = e;
      installBtn.hidden = false;
    });
    installBtn.addEventListener('click', function () {
      if (!installEvt) return;
      installEvt.prompt();
      installEvt.userChoice.then(function () {
        installEvt = null;
        installBtn.hidden = true;
      });
    });
    window.addEventListener('appinstalled', function () {
      installBtn.hidden = true;
      showToast('অ্যাপ ইনস্টল হয়েছে!');
    });
  }
})();
