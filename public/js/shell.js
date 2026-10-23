/*!
 * TechHat Utility Hub — Shared App Shell (Astro Multi-Page Edition)
 * Handles:
 *   1. Light / Dark theme toggle & persistence
 *   2. Right-hand "অন্যান্য টুলস" sidebar live search filter
 *   3. PWA service worker & install prompt
 *   4. Footer Bangla year & legacy #tool-* hash redirects
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

  /* ------------------------------------------------------------------ Footer Year & PWA */
  var yearEl = $('#year');
  if (yearEl && !yearEl.textContent) {
    yearEl.textContent = toBn(new Date().getFullYear());
  }

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
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
