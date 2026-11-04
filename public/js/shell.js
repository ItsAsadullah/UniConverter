/*!
 * TechHat Studio — Pure SPA App Shell, Universal Bilingual Engine & Command Palette
 * Provides a native desktop-app feel (Photoshop/Linear style) with zero full-page reloads,
 * zero layout shift (CLS), instant hover prefetching, and synchronous language hydration.
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var BN = '০১২৩৪৫৬৭৮৯';
  function toBn(n) { return String(n).replace(/\d/g, function (d) { return BN[d]; }); }
  function normPath(p) {
    if (!p) return '/';
    var clean = String(p).split('#')[0].split('?')[0].replace(/\/+$/, '');
    return clean || '/';
  }

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
    if (targetRoute && normPath(location.pathname) !== targetRoute) {
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
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, ms || 2000);
  }
  window.TechHatToast = showToast;

  /* ------------------------------------------------------------------ Universal Language Engine (বাংলা ⇄ EN) */
  var LANG_KEY = 'thbc-lang';
  var SCAN_LANG_KEY = 'thbc-scan-lang';

  function getCurrentLang() {
    var stored = null;
    try { stored = localStorage.getItem(LANG_KEY) || localStorage.getItem(SCAN_LANG_KEY); } catch (e) {}
    if (stored === 'en' || stored === 'bn') return stored;
    var attr = document.documentElement.getAttribute('data-lang');
    return attr === 'en' ? 'en' : 'bn';
  }

  function isEn() {
    return getCurrentLang() === 'en';
  }

  function fmtNum(n) {
    return isEn() ? String(n) : toBn(n);
  }

  var WORKSPACE_SELECTOR_I18N = [
    // Bijoy & Office Workspace
    ['label[for="textDirB2U"]', 'বিজয় → ইউনিকোড', 'Bijoy → Unicode'],
    ['label[for="textDirU2B"]', 'ইউনিকোড → বিজয়', 'Unicode → Bijoy'],
    ['label[for="fileDirB2U"]', 'বিজয় → ইউনিকোড', 'Bijoy → Unicode'],
    ['label[for="fileDirU2B"]', 'ইউনিকোড → বিজয়', 'Unicode → Bijoy'],
    ['#swapBtn', null, null, 'দিক ও লেখা অদলবদল', 'Swap direction & text'],
    ['#clearBtn', null, null, 'মুছুন', 'Clear'],
    ['#voiceBtnLabel', 'ভয়েস টাইপ', 'Voice Type'],
    ['#pasteBtn', 'পেস্ট', 'Paste'],
    ['#sampleBtn', 'নমুনা', 'Sample'],
    ['#copyBtn', 'কপি', 'Copy'],
    ['#copyRichBtn', 'Word কপি', 'Copy for Word'],
    ['#downloadTxtBtn', '.txt', '.txt'],
    ['#convertFilesBtn', 'সব ফাইল রূপান্তর করুন', 'Convert All Files'],
    ['#zipAllBtn', 'সব ডাউনলোড (.zip)', 'Download All (.zip)'],
    ['#clearQueueBtn', 'তালিকা মুছুন', 'Clear Queue'],
    // PDF Studio Header & Tabs
    ['.pdf-hero__title', 'অল-ইন-ওয়ান PDF স্টুডিও', 'PDF Studio'],
    ['[data-pdf-tab="hub"] span', 'সব PDF টুলস', 'All PDF Tools'],
    ['[data-pdf-tab="merge"] span', 'মার্জ PDF', 'Merge PDF'],
    ['[data-pdf-tab="split"] span', 'স্প্লিট PDF', 'Split PDF'],
    ['[data-pdf-tab="compress"] span', 'কমপ্রেস PDF', 'Compress PDF'],
    ['[data-pdf-tab="organize"] span', 'অর্গানাইজ PDF', 'Organize PDF'],
    ['[data-pdf-tab="pdf2other"] span', 'PDF → অন্যান্য', 'PDF Converter'],
    ['[data-pdf-tab="other2pdf"] span', 'অন্যান্য → PDF', 'Files to PDF'],
    ['#pdfMergeRunBtn', 'মার্জ করে PDF ডাউনলোড করুন', 'Merge & Download PDF'],
    ['#pdfSplitRunBtn', 'স্প্লিট করে ডাউনলোড করুন', 'Split & Download'],
    ['#pdfCompressRunBtn', 'কমপ্রেস করা PDF ডাউনলোড করুন', 'Download Compressed PDF'],
    ['#pdfOrganizeRunBtn', 'পরিবর্তনসহ PDF ডাউনলোড করুন', 'Save & Download PDF'],
    // Image Studio Header & Tabs
    ['.img-hero__title', 'অল-ইন-ওয়ান ইমেজ স্টুডিও', 'Image Studio'],
    ['[data-img-tab="hub"] span', 'সব ইমেজ টুলস', 'All Image Tools'],
    ['[data-img-tab="scan"] span', 'ডকুমেন্ট স্ক্যানার', 'Document Scanner'],
    ['[data-img-tab="resize"] span', 'রিসাইজ ও প্রিসেট', 'Resize & Presets'],
    ['[data-img-tab="compress"] span', 'কমপ্রেস ইমেজ', 'Compress Image'],
    ['[data-img-tab="crop"] span', 'ক্রপ ও রাউন্ড', 'Crop & Round'],
    ['[data-img-tab="convert"] span', 'কনভার্ট ও ইফেক্ট', 'Convert & Effects'],
    ['[data-img-tab="combine"] span', 'ছবি জোড়া / NID', 'NID Card Sheet'],
    ['[data-img-tab="colors"] span', 'কালার পিকার', 'Color Picker'],
    // Calendar, Age, DateCalc, Invoice Headers
    ['.cal-hero__title', 'তারিখ কনভার্টার ও ক্যালেন্ডার', 'Date Converter & Calendar'],
    ['.age-hero__title', 'বয়স ও জন্মতারিখ ক্যালকুলেটর', 'Age & DOB Calculator'],
    ['.dc-hero__title', 'দিন গণনা ও তারিখের ব্যবধান', 'Date Duration Calculator'],
    ['.inv-hero__title', 'ইনভয়েস ও ক্যাশ মেমো জেনারেটর', 'Invoice & Cash Memo Generator']
  ];

  function applyWorkspaceTranslations(lang) {
    var en = lang === 'en';
    WORKSPACE_SELECTOR_I18N.forEach(function (entry) {
      var sel = entry[0], bnTxt = entry[1], enTxt = entry[2], bnTip = entry[3], enTip = entry[4];
      $$(sel).forEach(function (el) {
        if (bnTxt && enTxt) {
          var hasSvg = !!el.querySelector('svg');
          if (!hasSvg) {
            el.textContent = en ? enTxt : bnTxt;
          } else {
            var textNodes = [];
            el.childNodes.forEach(function (n) {
              if (n.nodeType === 3 && n.nodeValue.trim()) textNodes.push(n);
            });
            if (textNodes.length) {
              textNodes[textNodes.length - 1].nodeValue = ' ' + (en ? enTxt : bnTxt);
            }
          }
        }
        if (bnTip && enTip) {
          el.title = en ? enTip : bnTip;
        }
      });
    });
  }

  function applyGlobalLanguage(lang, skipToast) {
    var cleanLang = lang === 'en' ? 'en' : 'bn';
    document.documentElement.setAttribute('data-lang', cleanLang);
    document.documentElement.lang = cleanLang;
    try {
      localStorage.setItem(LANG_KEY, cleanLang);
      localStorage.setItem(SCAN_LANG_KEY, cleanLang);
    } catch (e) {}

    $$('[data-set-lang]').forEach(function (btn) {
      var active = btn.getAttribute('data-set-lang') === cleanLang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    $$('[data-i18n-bn][data-i18n-en]').forEach(function (el) {
      var val = el.getAttribute(cleanLang === 'en' ? 'data-i18n-en' : 'data-i18n-bn');
      if (val !== null) el.textContent = val;
    });

    $$('[data-i18n-placeholder-bn][data-i18n-placeholder-en]').forEach(function (el) {
      var val = el.getAttribute(cleanLang === 'en' ? 'data-i18n-placeholder-en' : 'data-i18n-placeholder-bn');
      if (val !== null) el.setAttribute('placeholder', val);
    });

    $$('[data-i18n-title-bn][data-i18n-title-en]').forEach(function (el) {
      var val = el.getAttribute(cleanLang === 'en' ? 'data-i18n-title-en' : 'data-i18n-title-bn');
      if (val !== null) {
        el.setAttribute('title', val);
        el.setAttribute('aria-label', val);
      }
    });

    applyWorkspaceTranslations(cleanLang);
    window.dispatchEvent(new CustomEvent('th:langchange', { detail: { lang: cleanLang } }));

    if (!skipToast) {
      showToast(cleanLang === 'en' ? 'Language switched to English' : 'ভাষা বাংলায় পরিবর্তন করা হয়েছে', 1400);
    }
  }

  window.TechHatSetLang = applyGlobalLanguage;

  document.addEventListener('click', function (e) {
    var langBtn = e.target.closest ? e.target.closest('[data-set-lang]') : null;
    if (!langBtn) return;
    var target = langBtn.getAttribute('data-set-lang');
    if (target && target !== getCurrentLang()) {
      applyGlobalLanguage(target, false);
    }
  });

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
    if (metaThemeColor) metaThemeColor.content = theme === 'dark' ? '#0B1120' : '#f8fafc';
    var themeBtn = $('#themeToggle');
    if (themeBtn) {
      themeBtn.title = theme === 'dark'
        ? (isEn() ? 'Switch to Light Mode' : 'লাইট মোড')
        : (isEn() ? 'Switch to Dark Mode' : 'ডার্ক মোড');
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
      showToast(
        next === 'dark'
          ? (isEn() ? 'Dark mode enabled' : 'ডার্ক মোড চালু')
          : (isEn() ? 'Light mode enabled' : 'লাইট মোড চালু'),
        1400
      );
    });
  }
  applyTheme(getCurrentTheme(), false);

  /* ------------------------------------------------------------------ Bilingual Synonym Expansion */
  var SYNONYM_MAP = {
    'scan': 'স্ক্যান স্ক্যানার camscanner document scanner ক্যামস্ক্যানার',
    'scanner': 'স্ক্যান স্ক্যানার camscanner document scanner',
    'merge': 'মার্জ জোড়া একত্র pdf combine join',
    'split': 'স্প্লিট আলাদা ভাগ পৃষ্ঠা আলাদা extract',
    'compress': 'কমপ্রেস সাইজ কমান kb reduce optimize',
    'resize': 'রিসাইজ 300x300 300x80 সাইজ পাসপোর্ট স্বাক্ষর photo resizer',
    'crop': 'ক্রপ গোল কাটুন বৃত্তাকার প্রোফাইল aspect ratio',
    'nid': 'এনআইডি আইডি কার্ড ভোটার স্মার্ট কার্ড সামনের পেছনের combine',
    'bijoy': 'বিজয় ইউনিকোড সুতন্বী sutonnyMJ অভ্র বিজয় ফন্ট কনভার্টার',
    'unicode': 'ইউনিকোড বিজয় অভ্র বাংলা কনভার্টার',
    'word': 'ওয়ার্ড ডক docx অফিস ফাইল',
    'excel': 'এক্সেল xlsx অফিস ফাইল',
    'voice': 'ভয়েস কথা বলে টাইপিং স্পিচ মাইক্রোফোন',
    'age': 'বয়স জন্মতারিখ জন্মদিন ক্যালকুলেটর চাকরির বয়স',
    'date': 'তারিখ দিন গণনা ব্যবধান কর্মদিবস',
    'calendar': 'ক্যালেন্ডার বঙ্গাব্দ হিজরি পঞ্জিকা ছুটি',
    'invoice': 'ইনভয়েস ক্যাশ মেমো বিল ভাউচার রশিদ',
    'color': 'কালার রঙ পিকার প্যালেট হেক্স আরজিবি eyedropper'
  };

  function expandSearchTokens(rawQuery) {
    var q = (rawQuery || '').trim().toLowerCase().normalize('NFC');
    if (!q) return [];
    var parts = q.split(/\s+/).filter(Boolean);
    return parts.map(function (token) {
      var alts = [token];
      Object.keys(SYNONYM_MAP).forEach(function (k) {
        if (k.indexOf(token) !== -1 || SYNONYM_MAP[k].indexOf(token) !== -1) {
          alts.push(k);
        }
      });
      return alts;
    });
  }

  function matchesExpandedQuery(haystack, tokenGroups) {
    if (!tokenGroups.length) return true;
    var hay = (haystack || '').toLowerCase().normalize('NFC');
    return tokenGroups.every(function (alts) {
      return alts.some(function (alt) { return hay.indexOf(alt) !== -1; });
    });
  }

  /* ------------------------------------------------------------------ Universal Search Modal (#universalSearchDialog) */
  (function initUniversalSearch() {
    var dlg = $('#universalSearchDialog');
    var input = $('#universalSearchInput');
    var closeBtn = $('#closeUniversalSearchBtn');
    var catBtns = $$('[data-cmd-cat]', dlg);
    var items = $$('[data-cmd-item]', dlg);
    var emptyEl = $('#universalSearchEmpty');
    var resultsLbl = $('#universalResultsLabel');
    var recentWrap = $('#universalRecentWrap');
    var recentPills = $('#universalRecentPills');
    if (!dlg || !input || !items.length) return;

    var activeCat = 'all';
    var activeIdx = 0;
    var RECENT_SEARCH_KEY = 'thbc-recent-searches';

    function getRecentSearches() {
      try {
        var arr = JSON.parse(localStorage.getItem(RECENT_SEARCH_KEY) || '[]');
        return Array.isArray(arr) ? arr.slice(0, 6) : [];
      } catch (e) { return []; }
    }

    function saveRecentSearch(term) {
      var clean = (term || '').trim();
      if (!clean || clean.length < 2) return;
      var list = getRecentSearches().filter(function (x) { return x.toLowerCase() !== clean.toLowerCase(); });
      list.unshift(clean);
      try { localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(list.slice(0, 6))); } catch (e) {}
    }

    function renderRecentSearches() {
      if (!recentWrap || !recentPills) return;
      var list = getRecentSearches();
      var q = (input.value || '').trim();
      if (!list.length || q) {
        recentWrap.hidden = true;
        return;
      }
      recentWrap.hidden = false;
      recentPills.innerHTML = '';
      list.forEach(function (term) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'th-SearchChip inline-flex items-center h-7 px-2.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text hover:border-emerald-500 cursor-pointer transition-colors';
        btn.textContent = term;
        btn.addEventListener('click', function () {
          input.value = term;
          filterItems();
          input.focus();
        });
        recentPills.appendChild(btn);
      });
    }

    function getVisibleItems() {
      return items.filter(function (el) { return !el.hidden; });
    }

    function updateHighlight() {
      var vis = getVisibleItems();
      if (activeIdx >= vis.length) activeIdx = Math.max(0, vis.length - 1);
      if (activeIdx < 0) activeIdx = 0;
      items.forEach(function (el) { el.classList.remove('is-selected'); });
      if (vis[activeIdx]) {
        vis[activeIdx].classList.add('is-selected');
        if (vis[activeIdx].scrollIntoView) {
          vis[activeIdx].scrollIntoView({ block: 'nearest' });
        }
      }
    }

    function filterItems() {
      var q = (input.value || '').trim();
      var tokenGroups = expandSearchTokens(q);
      var visibleCount = 0;

      items.forEach(function (item) {
        var catOk = activeCat === 'all' || item.getAttribute('data-cat') === activeCat;
        var searchOk = matchesExpandedQuery(item.getAttribute('data-search') || '', tokenGroups);
        var show = catOk && searchOk;
        item.hidden = !show;
        if (show) visibleCount++;
      });

      if (resultsLbl) {
        if (isEn()) {
          resultsLbl.textContent = q
            ? 'Results (' + visibleCount + ')'
            : 'All Tools (' + visibleCount + ')';
        } else {
          resultsLbl.textContent = q
            ? 'ফলাফল (' + toBn(visibleCount) + ')'
            : 'সকল টুলস (' + toBn(visibleCount) + ')';
        }
      }
      if (emptyEl) emptyEl.hidden = visibleCount > 0;
      activeIdx = 0;
      updateHighlight();
      renderRecentSearches();
    }

    function openSearch(prefill) {
      var mobileDrawer = $('#mobileNavDrawer');
      if (mobileDrawer && mobileDrawer.open) mobileDrawer.close();
      if (!dlg.open) dlg.showModal();
      if (typeof prefill === 'string') {
        input.value = prefill;
      }
      filterItems();
      setTimeout(function () {
        input.focus();
        if (prefill) input.select();
      }, 10);
    }

    function closeSearch() {
      if (dlg.open) dlg.close();
    }

    // Delegated listener so [data-open-search] works across SPA page swaps
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-open-search]') : null;
      if (!btn) return;
      e.preventDefault();
      var prefill = btn.getAttribute('data-search-prefill') || '';
      openSearch(prefill);
    });

    if (closeBtn) closeBtn.addEventListener('click', closeSearch);
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) closeSearch();
    });

    catBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeCat = btn.getAttribute('data-cmd-cat') || 'all';
        catBtns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        filterItems();
        input.focus();
      });
    });

    input.addEventListener('input', filterItems);

    input.addEventListener('keydown', function (e) {
      var vis = getVisibleItems();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIdx = vis.length ? (activeIdx + 1) % vis.length : 0;
        updateHighlight();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdx = vis.length ? (activeIdx - 1 + vis.length) % vis.length : 0;
        updateHighlight();
      } else if (e.key === 'Enter') {
        if (vis[activeIdx]) {
          e.preventDefault();
          saveRecentSearch(input.value);
          vis[activeIdx].click();
        }
      }
    });

    items.forEach(function (item) {
      item.addEventListener('click', function () {
        if (input.value && input.value.trim()) {
          saveRecentSearch(input.value.trim());
        }
        closeSearch();
      });
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (dlg.open) closeSearch(); else openSearch('');
      }
    });

    window.addEventListener('th:langchange', filterItems);
    window.TechHatOpenSearch = openSearch;
  })();

  /* ------------------------------------------------------------------ Mobile Navigation Drawer (#mobileNavDrawer) */
  (function initMobileDrawer() {
    var drawer = $('#mobileNavDrawer');
    var openBtn = $('#openMobileMenuBtn');
    var closeBtn = $('#closeMobileMenuBtn');
    if (!drawer || !openBtn) return;

    openBtn.addEventListener('click', function () {
      if (!drawer.open) drawer.showModal();
    });
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        if (drawer.open) drawer.close();
      });
    }
    drawer.addEventListener('click', function (e) {
      if (e.target === drawer) drawer.close();
    });
  })();

  /* ------------------------------------------------------------------ Favorites & Recently Used Tools Manager */
  var FAV_KEY = 'thbc-fav-tools';
  var RECENT_KEY = 'thbc-recent-tools';
  var catalogById = {};
  var catalogByPath = {};

  $$('#universalSearchList [data-cmd-item]').forEach(function (el) {
    var id = el.getAttribute('data-tool-id');
    var href = normPath(el.getAttribute('href'));
    var iconEl = $('.th-cmd-item__ic', el);
    if (!id) return;
    var meta = {
      id: id,
      href: el.getAttribute('href') || '/',
      cat: el.getAttribute('data-cat') || '',
      titleBn: el.getAttribute('data-title-bn') || id,
      titleEn: el.getAttribute('data-title-en') || id,
      descBn: el.getAttribute('data-desc-bn') || '',
      descEn: el.getAttribute('data-desc-en') || '',
      iconHtml: iconEl ? iconEl.innerHTML : ''
    };
    catalogById[id] = meta;
    catalogByPath[href] = meta;
  });

  var ALIAS_PATHS = {
    '/calendar/age-calculator': 'age',
    '/calendar/date-calculator': 'datecalc',
    '/business/invoice-maker': 'invoice',
    '/image/scanner': 'image-scan'
  };

  function getFavs() {
    try {
      var list = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function saveFavs(list) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function getRecents() {
    try {
      var list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function recordCurrentToolVisit() {
    var here = normPath(location.pathname);
    if (here === '/' || here === '/bangla' || here === '/pdf' || here === '/image' || here === '/dates' || here === '/calendar' && !catalogByPath[here] || here === '/business' || here === '/utilities') {
      if (here !== '/calendar') return;
    }
    var matchedId = ALIAS_PATHS[here] || (catalogByPath[here] && catalogByPath[here].id);
    if (!matchedId) return;
    var recents = getRecents().filter(function (id) { return id !== matchedId; });
    recents.unshift(matchedId);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(recents.slice(0, 6))); } catch (e) {}
  }

  function buildMiniToolCard(meta, isFav) {
    var en = isEn();
    var card = document.createElement('article');
    card.className = 'th-tool-card relative flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-2xs hover:border-emerald-500/60 transition-colors';
    card.setAttribute('data-tool-id', meta.id);
    var titleText = en ? meta.titleEn : meta.titleBn;
    var descText = en ? meta.descEn : meta.descBn;
    card.innerHTML =
      '<a href="' + meta.href + '" class="th-tool-card__main flex items-center gap-3 flex-1 min-w-0 no-underline text-slate-900 dark:text-studio-text">' +
        '<span class="th-tool-card__icon w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center shrink-0">' + meta.iconHtml + '</span>' +
        '<div class="th-tool-card__body min-w-0 flex-1">' +
          '<h3 class="th-tool-card__title text-sm font-bold text-slate-900 dark:text-studio-text m-0 truncate" data-i18n-bn="' + meta.titleBn + '" data-i18n-en="' + meta.titleEn + '">' + titleText + '</h3>' +
          '<p class="th-tool-card__desc text-xs text-slate-500 dark:text-studio-muted mt-0.5 mb-0 truncate" data-i18n-bn="' + meta.descBn + '" data-i18n-en="' + meta.descEn + '">' + descText + '</p>' +
        '</div>' +
      '</a>' +
      '<button type="button" class="th-tool-card__fav w-7 h-7 rounded-lg border-0 bg-transparent text-slate-400 hover:text-amber-500 inline-flex items-center justify-center cursor-pointer transition-colors shrink-0' + (isFav ? ' is-fav text-amber-500' : '') + '" data-fav-btn="' + meta.id + '" title="Favorite" aria-label="Favorite">' +
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="' + (isFav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
      '</button>';
    return card;
  }

  function syncFavButtons() {
    var favs = getFavs();
    $$('[data-fav-btn]').forEach(function (btn) {
      var id = btn.getAttribute('data-fav-btn');
      var active = favs.indexOf(id) !== -1;
      btn.classList.toggle('is-fav', active);
      var svg = $('svg', btn);
      if (svg) svg.setAttribute('fill', active ? 'currentColor' : 'none');
    });
  }

  function renderHomePersonalizedSections() {
    var favSec = $('#homeFavoritesSection');
    var favGrid = $('#homeFavoritesGrid');
    var recSec = $('#homeRecentSection');
    var recGrid = $('#homeRecentGrid');
    var favs = getFavs();
    var recents = getRecents();

    if (favSec && favGrid) {
      var validFavs = favs.map(function (id) { return catalogById[id]; }).filter(Boolean);
      favSec.hidden = validFavs.length === 0;
      favGrid.innerHTML = '';
      validFavs.forEach(function (meta) {
        favGrid.appendChild(buildMiniToolCard(meta, true));
      });
    }

    if (recSec && recGrid) {
      var validRecents = recents.map(function (id) { return catalogById[id]; }).filter(Boolean);
      recSec.hidden = validRecents.length === 0;
      recGrid.innerHTML = '';
      validRecents.forEach(function (meta) {
        recGrid.appendChild(buildMiniToolCard(meta, favs.indexOf(meta.id) !== -1));
      });
    }
  }

  document.addEventListener('click', function (e) {
    var favBtn = e.target.closest ? e.target.closest('[data-fav-btn]') : null;
    if (favBtn) {
      e.preventDefault();
      e.stopPropagation();
      var id = favBtn.getAttribute('data-fav-btn');
      if (!id) return;
      var favs = getFavs();
      var idx = favs.indexOf(id);
      if (idx === -1) {
        favs.unshift(id);
        showToast(isEn() ? 'Added to favorites ★' : 'পছন্দের তালিকায় যোগ হয়েছে ★', 1400);
      } else {
        favs.splice(idx, 1);
        showToast(isEn() ? 'Removed from favorites' : 'পছন্দের তালিকা থেকে সরানো হয়েছে', 1400);
      }
      saveFavs(favs);
      syncFavButtons();
      renderHomePersonalizedSections();
      return;
    }

    var clearRecentBtn = e.target.closest ? e.target.closest('#clearRecentToolsBtn') : null;
    if (clearRecentBtn) {
      e.preventDefault();
      try { localStorage.removeItem(RECENT_KEY); } catch (err) {}
      renderHomePersonalizedSections();
      var dirContainer = $('[data-directory-root]');
      if (dirContainer && dirContainer._runFilter) dirContainer._runFilter();
      showToast(isEn() ? 'Recent history cleared' : 'সাম্প্রতিক তালিকা মুছে ফেলা হয়েছে', 1400);
    }
  });

  /* ------------------------------------------------------------------ Directory & Category Live Filter */
  function bindDirectoryFilters() {
    var dirContainer = $('[data-directory-root]');
    if (!dirContainer || dirContainer.dataset.dirBound === '1') return;
    dirContainer.dataset.dirBound = '1';

    var tabBtns = $$('[data-dir-cat]', dirContainer);
    var searchInput = $('[data-dir-search]', dirContainer);
    var cards = $$('[data-tool-card]', dirContainer);
    var emptyState = $('[data-dir-empty]', dirContainer);
    var countBadge = $('[data-dir-count]', dirContainer);
    var clearBtn = $('#clearRecentToolsBtn', dirContainer);
    var activeCat = dirContainer.getAttribute('data-default-tab') || 'all';

    function runFilter() {
      var q = searchInput ? (searchInput.value || '').trim() : '';
      var tokenGroups = expandSearchTokens(q);
      var visible = 0;
      var recents = getRecents().filter(function (id) { return !!catalogById[id]; });

      if (clearBtn) {
        clearBtn.hidden = !(activeCat === 'recent' && recents.length > 0 && !q);
      }

      cards.forEach(function (card) {
        var toolId = card.getAttribute('data-tool-id') || '';
        var cardCat = card.getAttribute('data-cat') || '';
        var isPop = card.getAttribute('data-popular') === '1';
        var catOk = false;

        if (q && (activeCat === 'recent' || activeCat === 'popular')) {
          catOk = true;
          card.style.order = '';
        } else if (activeCat === 'recent') {
          if (recents.length > 0) {
            var rIdx = recents.indexOf(toolId);
            catOk = rIdx !== -1;
            card.style.order = catOk ? String(rIdx) : '';
          } else {
            catOk = isPop;
            card.style.order = '';
          }
        } else if (activeCat === 'popular') {
          catOk = isPop;
          card.style.order = '';
        } else {
          catOk = activeCat === 'all' || cardCat === activeCat;
          card.style.order = '';
        }

        var searchOk = matchesExpandedQuery(card.getAttribute('data-search') || '', tokenGroups);
        var show = catOk && searchOk;
        card.hidden = !show;
        if (show) visible++;
      });

      if (emptyState) emptyState.hidden = visible > 0;
      if (countBadge) countBadge.textContent = fmtNum(q ? visible : cards.length);
    }

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeCat = btn.getAttribute('data-dir-cat') || 'all';
        tabBtns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        runFilter();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', runFilter);
    }
    dirContainer._runFilter = runFilter;
    runFilter();
  }
  window.addEventListener('th:langchange', function () {
    var dirContainer = $('[data-directory-root]');
    if (dirContainer && dirContainer._runFilter) dirContainer._runFilter();
  });

  /* ------------------------------------------------------------------ Tools Menu (cascading, searchable) */
  function markToolsMenuCurrent() {
    var here = normPath(location.pathname);
    $$('.tm').forEach(function (toolsMenu) {
      $$('.tm__leaf, .tm__single', toolsMenu).forEach(function (a) {
        var cur = normPath(a.getAttribute('href')) === here;
        if (a.classList.contains('tm__leaf')) {
          if (cur) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        } else {
          a.classList.toggle('is-current', cur);
        }
      });
      $$('.tm__group', toolsMenu).forEach(function (g) {
        g.classList.toggle('is-current', !!$('.tm__leaf[aria-current="page"]', g));
      });
    });
  }

  $$('.tm').forEach(function (toolsMenu) {
    if (!toolsMenu.dataset.shellBound) {
      toolsMenu.dataset.shellBound = '1';
      var tmTree = $('.tm__tree', toolsMenu);
      var tmSearch = $('.tm__input', toolsMenu);
      var tmEmpty = $('.tm__empty', toolsMenu);
      var tmGroups = $$('.tm__group', toolsMenu);

      function setGroup(group, open) {
        group.classList.toggle('is-open', open);
        var btn = $('.tm__group-btn', group);
        var sub = $('.tm__sub', group);
        if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (sub) sub.hidden = !open;
      }

      function collapseAll() { tmGroups.forEach(function (g) { setGroup(g, false); }); }

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

      toolsMenu.addEventListener('toggle', function () {
        if (toolsMenu.open) {
          markToolsMenuCurrent();
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
      markToolsMenuCurrent();
    }
  });

  /* ------------------------------------------------------------------ Clipboard image paste (Ctrl+V + paste button) */
  var mountClipboardPasteButtons = (function () {
    var EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/bmp': 'bmp' };
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

    function confirmReplace(message, file) {
      return new Promise(function (resolve) {
        var dlg = document.createElement('dialog');
        dlg.className = 'paste-confirm w-[min(420px,calc(100vw-24px))] m-auto p-0 rounded-2xl border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar text-slate-900 dark:text-studio-text shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-xs';
        dlg.setAttribute('aria-label', isEn() ? 'Confirm replace' : 'ছবি রিপ্লেস নিশ্চিত করুন');
        var url = null;
        var preview = '';
        if (file) { url = URL.createObjectURL(file); preview = '<img class="paste-confirm__img max-h-40 max-w-full object-contain rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel p-1" alt="Clipboard preview" src="' + url + '">'; }
        dlg.innerHTML =
          '<div class="paste-confirm__body p-5 flex flex-col items-center text-center gap-2.5">' +
            '<div class="paste-confirm__icon w-11 h-11 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div>' +
            '<h3 class="paste-confirm__title text-sm font-bold text-slate-900 dark:text-studio-text m-0">' + (isEn() ? 'Replace current image?' : 'বর্তমান ছবি রিপ্লেস করবেন?') + '</h3>' +
            '<p class="paste-confirm__msg text-xs text-slate-500 dark:text-studio-muted m-0"></p>' + preview +
            '<div class="paste-confirm__actions flex items-center justify-center gap-2 w-full mt-2">' +
              '<button type="button" class="chip-btn inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text hover:border-emerald-500 transition-colors cursor-pointer" data-r="0">' + (isEn() ? 'Cancel' : 'না, থাক') + '</button>' +
              '<button type="button" class="btn btn--primary inline-flex items-center justify-center h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border-0 cursor-pointer transition-colors" data-r="1">' + (isEn() ? 'Replace' : 'হ্যাঁ, রিপ্লেস করুন') + '</button>' +
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

    function findTarget(files) {
      var combine = $('#img-pane-combine');
      if (combine && !combine.hidden) {
        var stage = $('#imgCombineStage');
        if (stage && stage.hidden) return { input: $(files.length > 1 ? '#imgCombineInput' : '#nidFrontInput') };
        if ($('.nid-card-tab--add', combine)) return { input: $('#nidReplaceBackInput') };
        var tabs = $$('#nidCardTabs .nid-card-tab:not(.nid-card-tab--add)');
        var idx = 0;
        tabs.forEach(function (t, i) { if (t.classList.contains('active')) idx = i; });
        return {
          input: $(idx === 0 ? '#nidReplaceFrontInput' : idx === 1 ? '#nidReplaceBackInput' : '#nidReplaceExtraInput'),
          replace: true,
          message: isEn() ? 'Replace current card image with clipboard image?' : 'বর্তমান কার্ডের ছবি ক্লিপবোর্ডের ছবি দিয়ে বদলে যাবে।'
        };
      }

      var scanner = $('#img-pane-scan');
      if (scanner && !scanner.hidden) return { input: $('#dsFiles') };

      var logo = $('#invLogoInput');
      if (logo) return { input: logo };

      var found = null;
      $$('input[type="file"]').some(function (input) {
        if (!acceptsImages(input) || !RESET[input.id]) return false;
        var zone = input.closest('.pdf-dropzone');
        var outer = (zone ? zone.parentElement : input.parentElement);
        if (outer && outer.closest('[hidden]')) return false;
        var loaded = !!(zone && zone.hidden);
        found = loaded
          ? { input: input, replace: true, resetId: RESET[input.id],
              message: isEn() ? 'Replace current image with clipboard image?' : 'এই টুলে থাকা ছবি ক্লিপবোর্ডের ছবি দিয়ে বদলে যাবে।' }
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
        showToast(isEn() ? 'Open an image tool to paste images' : 'ছবি নেওয়ার মতো একটি টুল খুলুন');
        return true;
      }
      function go() {
        if (t.resetId) { var rb = $('#' + t.resetId); if (rb) rb.click(); }
        var n = feed(t.input, files);
        showToast(
          t.replace
            ? (isEn() ? 'Image replaced from clipboard' : 'ছবি রিপ্লেস হয়েছে')
            : (isEn() ? n + ' image(s) pasted from clipboard' : 'ক্লিপবোর্ড থেকে ' + toBn(n) + 'টি ছবি যুক্ত হয়েছে')
        );
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
      if (editable(e.target) && cd.getData && cd.getData('text/plain')) return;
      e.preventDefault();
      dispatch(files);
    });

    var ICON = '<svg class="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-studio-primary" viewBox="0 0 24 24" aria-hidden="true" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>';

    function readClipboard(input) {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        showToast(isEn() ? 'Press Ctrl+V to paste' : 'Ctrl+V চাপুন');
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
        if (!files.length) { showToast(isEn() ? 'No image found in clipboard' : 'ক্লিপবোর্ডে কোনো ছবি পাওয়া যায়নি'); return; }
        dispatch(files, input || null);
      }).catch(function () {
        showToast(isEn() ? 'Press Ctrl+V to paste' : 'Ctrl+V চাপুন');
      });
    }

    function makeBtn(cls, input) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.innerHTML = ICON + '<span data-i18n-bn="ক্লিপবোর্ড পেস্ট (Ctrl+V)" data-i18n-en="Paste from Clipboard (Ctrl+V)">' + (isEn() ? 'Paste from Clipboard (Ctrl+V)' : 'ক্লিপবোর্ড পেস্ট (Ctrl+V)') + '</span>';
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        readClipboard(input);
      });
      return b;
    }

    function mountButtons() {
      $$('.pdf-dropzone').forEach(function (zone) {
        var input = $('input[type="file"]', zone);
        if (!input || !acceptsImages(input) || zone.querySelector('.paste-btn')) return;
        zone.appendChild(makeBtn('chip-btn paste-btn mt-3.5 inline-flex items-center justify-center gap-1.5 h-8.5 px-3.5 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text shadow-2xs hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-studio-primary transition-all cursor-pointer', input));
      });
      var artboard = $('.th-empty-artboard__subactions');
      if (artboard && !artboard.querySelector('.paste-btn')) {
        var sep = document.createElement('span');
        sep.className = 'th-dot-sep text-slate-400 dark:text-studio-muted mx-1.5';
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = '•';
        artboard.appendChild(sep);
        artboard.appendChild(makeBtn('th-empty-link paste-btn inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-studio-primary hover:underline cursor-pointer bg-transparent border-0 p-0', null));
      }
    }

    mountButtons();
    return mountButtons;
  })();

  /* ============================================================================
   * PURE SPA CLIENT-SIDE ROUTER (Zero Full-Page Reloads, Instant Prefetching)
   * ============================================================================ */
  var pageHtmlCache = {};
  var inflightFetches = {};
  var loadedScripts = {};
  var loadedStyles = {};
  var navSeq = 0;

  // Record already-loaded scripts & stylesheets from initial document
  $$('script[src]').forEach(function (s) {
    var src = (s.getAttribute('src') || '').split('?')[0];
    if (src) loadedScripts[src] = Promise.resolve();
  });
  $$('link[rel="stylesheet"][href]').forEach(function (l) {
    var href = l.getAttribute('href');
    if (href) loadedStyles[href] = true;
  });

  function ensureScriptLoaded(rawSrc) {
    var cleanSrc = (rawSrc || '').split('?')[0];
    if (!cleanSrc) return Promise.resolve();
    if (loadedScripts[cleanSrc]) return loadedScripts[cleanSrc];
    var p = new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = rawSrc;
      s.async = false;
      s.onload = function () { resolve(); };
      s.onerror = function () { resolve(); };
      document.body.appendChild(s);
    });
    loadedScripts[cleanSrc] = p;
    return p;
  }

  function ensureHeadStyles(newDoc) {
    var promises = [];
    $$('link[rel="stylesheet"][href]', newDoc.head).forEach(function (lnk) {
      var href = lnk.getAttribute('href');
      if (!href || loadedStyles[href]) return;
      loadedStyles[href] = true;
      promises.push(new Promise(function (resolve) {
        var clone = document.createElement('link');
        clone.rel = 'stylesheet';
        clone.href = href;
        clone.onload = resolve;
        clone.onerror = resolve;
        document.head.appendChild(clone);
        setTimeout(resolve, 120);
      }));
    });
    $$('style', newDoc.head).forEach(function (st) {
      var devId = st.getAttribute('data-vite-dev-id');
      if (devId && $$('style[data-vite-dev-id]', document.head).some(function (existing) {
        return existing.getAttribute('data-vite-dev-id') === devId;
      })) {
        return;
      }
      var txt = (st.textContent || '').trim();
      if (!txt) return;
      var exists = $$('style', document.head).some(function (existing) {
        return (existing.textContent || '').trim() === txt;
      });
      if (!exists) {
        var copy = document.createElement('style');
        if (devId) copy.setAttribute('data-vite-dev-id', devId);
        copy.textContent = txt;
        document.head.appendChild(copy);
      }
    });
    return Promise.all(promises);
  }

  function fetchPageHtml(pathname) {
    var key = normPath(pathname);
    if (pageHtmlCache[key]) return Promise.resolve(pageHtmlCache[key]);
    if (inflightFetches[key]) return inflightFetches[key];

    var p = fetch(key === '/' ? '/' : key, { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (html) {
        pageHtmlCache[key] = html;
        delete inflightFetches[key];
        // Preload any new stylesheets found in the prefetched HTML
        try {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          ensureHeadStyles(doc);
        } catch (e) {}
        return html;
      })
      .catch(function (err) {
        delete inflightFetches[key];
        throw err;
      });

    inflightFetches[key] = p;
    return p;
  }

  function inferCategoryFromPath(pathname) {
    var p = normPath(pathname);
    if (p === '/bangla' || p.indexOf('/bangla/') === 0) return 'bangla';
    if (p === '/pdf' || p.indexOf('/pdf/') === 0) return 'pdf';
    if (p === '/image' || p.indexOf('/image/') === 0) return 'image';
    if (p === '/dates' || p === '/calendar' || p === '/age-calculator' || p === '/date-calculator' || p.indexOf('/calendar/') === 0) return 'dates';
    if (p === '/utilities' || p === '/business' || p === '/invoice' || p.indexOf('/business/') === 0) return 'utilities';
    return '';
  }

  function syncGlobalBreadcrumb(pathname) {
    var p = normPath(pathname);
    var sepEl = $('#globalBreadcrumbSep');
    var wrapEl = $('#globalBreadcrumbToolWrap');
    var toolEl = $('#globalBreadcrumbTool');
    var catEl = $('#globalBreadcrumbCat');
    if (!sepEl || !toolEl) return;

    var matchedId = ALIAS_PATHS[p] || (catalogByPath[p] && catalogByPath[p].id);
    var meta = matchedId ? catalogById[matchedId] : null;
    if (meta) {
      sepEl.hidden = false;
      if (wrapEl) wrapEl.hidden = false;
      toolEl.hidden = false;
      toolEl.setAttribute('data-i18n-bn', meta.titleBn);
      toolEl.setAttribute('data-i18n-en', meta.titleEn);
      toolEl.textContent = isEn() ? meta.titleEn : meta.titleBn;
      if (catEl) {
        catEl.classList.remove('text-slate-800', 'dark:text-studio-text', 'font-semibold');
        catEl.classList.add('text-slate-500', 'dark:text-studio-muted');
      }
    } else {
      sepEl.hidden = true;
      if (wrapEl) wrapEl.hidden = true;
      toolEl.hidden = true;
      if (catEl) {
        catEl.classList.remove('text-slate-500', 'dark:text-studio-muted');
        catEl.classList.add('text-slate-800', 'dark:text-studio-text', 'font-semibold');
      }
    }

    $$('#globalBreadcrumbDropdown [data-bc-item]').forEach(function (item) {
      var itemHref = normPath(item.getAttribute('data-bc-item') || '');
      var itemId = item.getAttribute('data-bc-tool-id');
      var isAct = (matchedId && itemId === matchedId) || (!itemId && itemHref === p);
      item.classList.toggle('is-active', !!isAct);
    });
  }

  document.addEventListener('click', function (e) {
    var wrap = $('#globalBreadcrumbToolWrap');
    if (!wrap) return;
    var btn = e.target.closest && e.target.closest('#globalBreadcrumbToolBtn');
    if (btn) {
      e.stopPropagation();
      var open = wrap.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      return;
    }
    if (wrap.classList.contains('is-open') && (!e.target.closest || !e.target.closest('#globalBreadcrumbDropdown'))) {
      wrap.classList.remove('is-open');
      var trigger = $('#globalBreadcrumbToolBtn');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }
  });

  function updateHeaderNavState(pathname) {
    var activeCat = inferCategoryFromPath(pathname);
    $$('[data-nav-cat]').forEach(function (a) {
      var isAct = a.getAttribute('data-nav-cat') === activeCat;
      a.classList.toggle('is-active', isAct);
    });
    syncGlobalBreadcrumb(pathname);
    markToolsMenuCurrent();
  }

  function closeAllOverlays() {
    var searchDlg = $('#universalSearchDialog');
    if (searchDlg && searchDlg.open) searchDlg.close();
    var mobileDrawer = $('#mobileNavDrawer');
    if (mobileDrawer && mobileDrawer.open) mobileDrawer.close();
    $$('.tm[open]').forEach(function (tm) { tm.open = false; });
    var bcWrap = $('#globalBreadcrumbToolWrap');
    if (bcWrap) bcWrap.classList.remove('is-open');
    var bcBtn = $('#globalBreadcrumbToolBtn');
    if (bcBtn) bcBtn.setAttribute('aria-expanded', 'false');
    if (document.activeElement && document.activeElement.closest && (document.activeElement.closest('#desktopPrimaryNav') || document.activeElement.closest('#globalBreadcrumbToolWrap'))) {
      document.activeElement.blur();
    }
    // Instant close desktop hover dropdowns on click
    $$('.th-nav-dropdown').forEach(function (dd) {
      dd.style.pointerEvents = 'none';
      dd.style.opacity = '0';
      dd.style.visibility = 'hidden';
      var restore = function () {
        dd.style.pointerEvents = '';
        dd.style.opacity = '';
        dd.style.visibility = '';
        document.removeEventListener('pointermove', restore);
      };
      setTimeout(function () {
        document.addEventListener('pointermove', restore, { once: true });
      }, 40);
    });
  }

  function runMountedToolInitializers() {
    if ($('#tool-bijoy') && window.TechHatBijoyInit) {
      window.TechHatBijoyInit();
    }
    if ($('#tool-pdf') && window.TechHatPDF && window.TechHatPDF.init) {
      window.TechHatPDF.init();
    }
    if ($('#tool-image') && window.TechHatImage && window.TechHatImage.init) {
      window.TechHatImage.init();
    }
    if ($('#img-pane-scan') && window.TechHatScannerInit) {
      window.TechHatScannerInit();
    }
    if (($('#tool-calendar') || $('#tool-age') || $('#tool-datecalc') || $('#tool-invoice')) && window.TechHatTools && window.TechHatTools.initPage) {
      window.TechHatTools.initPage();
    }
  }

  var BANGLA_ROUTES = {
    '/bangla/bijoy-to-unicode': { tab: 'text', voice: false, bn: 'বিজয় ⇄ ইউনিকোড কনভার্টার', en: 'Bijoy ⇄ Unicode Converter' },
    '/bangla/office-converter': { tab: 'file', voice: false, bn: 'অফিস ফাইল কনভার্টার (DOCX / XLSX / PPTX)', en: 'Office File Converter (DOCX / XLSX / PPTX)' },
    '/bangla/voice-typing': { tab: 'text', voice: true, bn: 'বাংলা ও ইংরেজি ভয়েস টাইপিং', en: 'Bangla & English Voice Typing' }
  };

  function tryInPlaceStudioSwitch(targetPath, pushState) {
    // 1. In-place switch between Bangla sub-routes if #tool-bijoy is already mounted
    var banglaCfg = BANGLA_ROUTES[targetPath];
    var bijoyRoot = $('#tool-bijoy');
    if (banglaCfg && bijoyRoot) {
      bijoyRoot.setAttribute('data-initial-tab', banglaCfg.tab);
      bijoyRoot.setAttribute('data-voice-focus', banglaCfg.voice ? 'true' : 'false');
      $$('#tool-bijoy [data-i18n-bn][data-i18n-en]').forEach(function (el) {
        if (el.tagName === 'SPAN' && (el.closest('h1') || el.closest('nav[aria-label="Breadcrumb"]')) && !el.getAttribute('href')) {
          el.setAttribute('data-i18n-bn', banglaCfg.bn);
          el.setAttribute('data-i18n-en', banglaCfg.en);
          el.textContent = isEn() ? banglaCfg.en : banglaCfg.bn;
        }
      });
      if (pushState && normPath(location.pathname) !== targetPath) {
        history.pushState(null, '', targetPath);
      }
      updateHeaderNavState(targetPath);
      recordCurrentToolVisit();
      if (window.TechHatBijoyInit) window.TechHatBijoyInit();
      return true;
    }

    // 2. In-place switch inside PDF Studio if the target pane is already in the DOM
    var PDF_MAP = {
      '/pdf': 'hub',
      '/pdf/merge': 'merge',
      '/pdf/split': 'split',
      '/pdf/compress': 'compress',
      '/pdf/organize': 'organize',
      '/pdf/pdf-to-other': 'pdf2other',
      '/pdf/other-to-pdf': 'other2pdf'
    };
    if (PDF_MAP[targetPath] && $('#tool-pdf') && $('#pdf-pane-' + PDF_MAP[targetPath]) && window.TechHatPDF) {
      if (pushState && normPath(location.pathname) !== targetPath) {
        history.pushState(null, '', targetPath);
      }
      window.TechHatPDF.switchTab(PDF_MAP[targetPath], undefined, true);
      updateHeaderNavState(targetPath);
      recordCurrentToolVisit();
      return true;
    }

    // 3. In-place switch inside Image Studio if the target pane is already in the DOM
    var IMG_MAP = {
      '/image': 'hub',
      '/image/scan': 'scan',
      '/image/scanner': 'scan',
      '/image/passport': 'passport',
      '/image/resize': 'resize',
      '/image/compress': 'compress',
      '/image/crop': 'crop',
      '/image/convert': 'convert',
      '/image/combine': 'combine',
      '/image/colors': 'colors'
    };
    var imgPaneId = IMG_MAP[targetPath] === 'passport' ? 'scan' : IMG_MAP[targetPath];
    if (IMG_MAP[targetPath] && $('#tool-image') && $('#img-pane-' + imgPaneId) && window.TechHatImage) {
      if (pushState && normPath(location.pathname) !== targetPath) {
        history.pushState(null, '', targetPath);
      }
      window.TechHatImage.switchTab(IMG_MAP[targetPath], true);
      updateHeaderNavState(targetPath);
      recordCurrentToolVisit();
      return true;
    }

    return false;
  }

  function navigateSPA(rawUrl, pushState) {
    var targetPath = normPath(rawUrl);
    closeAllOverlays();

    if (pushState !== false && normPath(location.pathname) === targetPath) {
      return Promise.resolve();
    }

    // Fast-path: in-place switch if the studio & pane are already mounted
    if (tryInPlaceStudioSwitch(targetPath, pushState !== false)) {
      return Promise.resolve();
    }

    var token = ++navSeq;
    return fetchPageHtml(targetPath)
      .then(function (html) {
        if (token !== navSeq) return;
        var newDoc = new DOMParser().parseFromString(html, 'text/html');
        return ensureHeadStyles(newDoc).then(function () {
          return newDoc;
        });
      })
      .then(function (newDoc) {
        if (!newDoc || token !== navSeq) return;

        var newShellScript = $('script[src*="/js/shell.js"]', newDoc);
        var curShellScript = $('script[src*="/js/shell.js"]', document);
        if (
          newShellScript &&
          curShellScript &&
          newShellScript.getAttribute('src') !== curShellScript.getAttribute('src')
        ) {
          location.href = targetPath;
          return;
        }

        var newWorkbench = $('#workbench', newDoc);
        var curWorkbench = $('#workbench');
        if (!newWorkbench || !curWorkbench) {
          location.href = targetPath;
          return;
        }

        // Update URL & Document metadata
        if (pushState !== false && normPath(location.pathname) !== targetPath) {
          history.pushState(null, '', targetPath);
        }
        if (newDoc.title) document.title = newDoc.title;

        var activeTool = newDoc.body && newDoc.body.getAttribute('data-active-tool');
        if (activeTool) document.body.setAttribute('data-active-tool', activeTool);

        var calResetBtn = $('#btnCalReset');
        if (calResetBtn) calResetBtn.hidden = activeTool !== 'calendar';

        // Swap workbench & after-workbench slots synchronously
        curWorkbench.innerHTML = newWorkbench.innerHTML;

        var newAfterSlot = $('#afterWorkbenchSlot', newDoc);
        var curAfterSlot = $('#afterWorkbenchSlot');
        if (curAfterSlot && newAfterSlot) {
          curAfterSlot.innerHTML = newAfterSlot.innerHTML;
        }

        // Synchronously hydrate language, directory filters, favorites & recents BEFORE frame paint
        updateHeaderNavState(targetPath);
        recordCurrentToolVisit();
        syncFavButtons();
        renderHomePersonalizedSections();
        bindDirectoryFilters();
        mountClipboardPasteButtons();
        applyGlobalLanguage(getCurrentLang(), true);

        window.scrollTo(0, 0);

        // Load any required page scripts sequentially, then initialize mounted workspace
        var scriptEls = $$('script[src]', newDoc.body);
        var chain = Promise.resolve();
        scriptEls.forEach(function (s) {
          var src = s.getAttribute('src');
          if (src && src.indexOf('/js/shell.js') === -1) {
            chain = chain.then(function () { return ensureScriptLoaded(src); });
          }
        });
        return chain.then(function () {
          if (token !== navSeq) return;
          runMountedToolInitializers();
          applyGlobalLanguage(getCurrentLang(), true);
        });
      })
      .catch(function () {
        location.href = targetPath;
      });
  }

  window.TechHatNavigate = function (url) {
    return navigateSPA(url, true);
  };

  // Cache initial page HTML so navigating back to the entry page is 0ms
  try {
    pageHtmlCache[normPath(location.pathname)] = document.documentElement.outerHTML;
  } catch (e) {}

  // Intercept all internal <a> clicks for pure SPA navigation
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest ? e.target.closest('a[href]') : null;
    if (!link) return;
    if (link.hasAttribute('download') || link.getAttribute('target') === '_blank' || link.getAttribute('rel') === 'external') return;
    var rawHref = link.getAttribute('href') || '';
    if (!rawHref || rawHref.charAt(0) === '#' || /^mailto:|^tel:|^javascript:/i.test(rawHref)) return;

    var url;
    try { url = new URL(rawHref, location.origin); } catch (err) { return; }
    if (url.origin !== location.origin) return;

    e.preventDefault();
    navigateSPA(url.pathname, true);
  });

  // Prefetch internal routes on hover / touchstart for 0ms instant response
  function onLinkHover(e) {
    var link = e.target.closest ? e.target.closest('a[href]') : null;
    if (!link) return;
    var rawHref = link.getAttribute('href') || '';
    if (!rawHref || rawHref.charAt(0) === '#' || rawHref.indexOf('/') !== 0) return;
    fetchPageHtml(rawHref).catch(function () {});
  }
  document.addEventListener('pointerover', onLinkHover, { passive: true });
  document.addEventListener('touchstart', onLinkHover, { passive: true });

  // Handle browser Back / Forward buttons in SPA mode
  window.addEventListener('popstate', function () {
    navigateSPA(location.pathname, false);
  });

  // Background idle prefetch of core routes so first clicks are already in RAM
  var requestIdle = window.requestIdleCallback || function (cb) { setTimeout(cb, 400); };
  requestIdle(function () {
    ['/', '/bangla/bijoy-to-unicode', '/image/scan', '/pdf/merge', '/image/resize', '/calendar', '/age-calculator', '/invoice'].forEach(function (route) {
      if (normPath(location.pathname) !== route) {
        fetchPageHtml(route).catch(function () {});
      }
    });
  });

  /* ------------------------------------------------------------------ Synchronous Initial Hydration & PWA */
  updateHeaderNavState(location.pathname);
  recordCurrentToolVisit();
  syncFavButtons();
  renderHomePersonalizedSections();
  bindDirectoryFilters();
  applyGlobalLanguage(getCurrentLang(), true);

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
      showToast(isEn() ? 'App installed!' : 'অ্যাপ ইনস্টল হয়েছে!');
    });
  }
})();
