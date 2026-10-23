/*!
 * TechHat Utility Hub — Multi-Tool Controller
 * Tools:
 *   1. Bijoy ⇄ Unicode Converter (bijoy)
 *   2. Date Converter: EN / BN / Hijri (calendar)
 *   3. Age Calculator & DOB Finder (age)
 *   4. Date Duration Calculator (datecalc)
 *   5. A4 Invoice Generator (invoice)
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var bDig = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  var enM = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var enMFull = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  var bnM = ['বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন', 'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'];
  var hjM = ['মহররম', 'সফর', 'রবিউল আউয়াল', 'রবিউল সানি', 'জমাদিউল আউয়াল', 'জমাদিউল সানি', 'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জিলক্বদ', 'জিলহজ'];
  var days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  var sea = ['গ্রীষ্ম', 'বর্ষা', 'শরৎ', 'হেমন্ত', 'শীত', 'বসন্ত'];
  var zod = [
    { n: 'মকর', i: '♑' }, { n: 'কুম্ভ', i: '♒' }, { n: 'মীন', i: '♓' }, { n: 'মেষ', i: '♈' },
    { n: 'বৃষ', i: '♉' }, { n: 'মিথুন', i: '♊' }, { n: 'কর্কট', i: '♋' }, { n: 'সিংহ', i: '♌' },
    { n: 'কন্যা', i: '♍' }, { n: 'তুলা', i: '♎' }, { n: 'বৃশ্চিক', i: '♏' }, { n: 'ধনু', i: '♐' }
  ];

  function toBn(n) {
    return String(n).replace(/\d/g, function (d) { return bDig[d]; });
  }
  function isLeap(y) {
    return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  }
  function getBDDate() {
    var d = new Date();
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 6));
  }
  function setMonthClamped(date, month) {
    var day = date.getDate();
    date.setDate(1);
    date.setMonth(month);
    date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
  }
  function setYearClamped(date, year) {
    var month = date.getMonth(), day = date.getDate();
    date.setDate(1);
    date.setFullYear(year);
    date.setMonth(month);
    date.setDate(Math.min(day, new Date(year, month + 1, 0).getDate()));
  }

  /* ==================================================================
   * TOOLS REGISTRY & RIGHT SIDEBAR NAVIGATION
   * ================================================================== */
  var TOOLS = [
    {
      id: 'bijoy',
      href: '/',
      title: 'বিজয় ⇄ ইউনিকোড',
      desc: 'টেক্সট, ভয়েস ও ফাইল রূপান্তর',
      badge: 'কনভার্টার',
      color: 'emerald',
      keywords: 'bijoy unicode bangla converter sutonny ফন্ট বিজয় ইউনিকোড ভয়েস টাইপ',
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h14"/><path d="m18 14 3 3-3 3"/></svg>'
    },
    {
      id: 'pdf',
      href: '/pdf',
      title: 'পিডিএফ স্টুডিও',
      desc: 'মার্জ, স্প্লিট, কমপ্রেস ও কনভার্ট',
      badge: 'PDF টুলস',
      color: 'crimson',
      keywords: 'pdf merge split compress organize rotate jpg to pdf word to pdf ilovepdf পিডিএফ মার্জ স্প্লিট কমপ্রেস কনভার্ট',
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h2a2 2 0 0 1 0 4H8v-4Z"/><path d="M14 13h2v4h-2z"/></svg>'
    },
    {
      id: 'calendar',
      href: '/calendar',
      title: 'তারিখ কনভার্টার',
      desc: 'ইংরেজি, বাংলা ও হিজরি সন',
      badge: 'ক্যালেন্ডার',
      color: 'blue',
      keywords: 'calendar date converter bangla hijri arabic তারিখ ক্যালেন্ডার বাংলা আরবি হিজরি সন',
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>'
    },
    {
      id: 'age',
      href: '/age-calculator',
      title: 'বয়স ম্যানেজার',
      desc: 'বয়স ও জন্মতারিখ নির্ণয়',
      badge: 'বয়স হিসাব',
      color: 'purple',
      keywords: 'age calculator dob birthday বয়স ক্যালকুলেটর জন্মতারিখ হিসাব',
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01"/></svg>'
    },
    {
      id: 'datecalc',
      href: '/date-calculator',
      title: 'দিন গণনা',
      desc: 'তারিখের ব্যবধান হিসাব',
      badge: 'সময় হিসাব',
      color: 'amber',
      keywords: 'date duration calculator days before after দিন গণনা তারিখ ব্যবধান',
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>'
    },
    {
      id: 'invoice',
      href: '/invoice',
      title: 'ইনভয়েস মেকার',
      desc: 'ক্যাশ মেমো ও A4 বিল প্রিন্ট',
      badge: 'বিজনেস',
      color: 'rose',
      keywords: 'invoice bill pdf generator cash memo ইনভয়েস বিল মেমো প্রিন্ট',
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 3 2 3-2 3 2 3-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>'
    }
  ];

  var activeTool = 'bijoy';
  var searchQuery = '';
  var isMultiPage = function () {
    return document.body && document.body.getAttribute('data-astro-mpa') === '1';
  };

  function getToolById(id) {
    for (var i = 0; i < TOOLS.length; i++) {
      if (TOOLS[i].id === id) return TOOLS[i];
    }
    return TOOLS[0];
  }

  function renderSidebar() {
    var listEl = $('#toolsSidebarList');
    var countEl = $('#toolsCountBadge');
    if (!listEl) return;

    var q = (searchQuery || '').trim().toLowerCase();
    var otherTools = TOOLS.filter(function (t) {
      if (t.id === activeTool) return false;
      if (!q) return true;
      return t.title.toLowerCase().indexOf(q) !== -1 ||
             t.desc.toLowerCase().indexOf(q) !== -1 ||
             t.badge.toLowerCase().indexOf(q) !== -1 ||
             t.keywords.toLowerCase().indexOf(q) !== -1;
    });

    if (countEl) {
      countEl.textContent = toBn(TOOLS.length - 1) + 'টি';
    }

    listEl.innerHTML = '';
    if (!otherTools.length) {
      var empty = document.createElement('div');
      empty.className = 'tools-empty';
      empty.textContent = 'কোনো টুল পাওয়া যায়নি';
      listEl.appendChild(empty);
      return;
    }

    otherTools.forEach(function (t) {
      var link = document.createElement('a');
      link.href = t.href;
      link.className = 'tool-nav-card';
      link.setAttribute('data-color', t.color);
      link.setAttribute('data-tool-id', t.id);
      link.innerHTML =
        '<span class="tool-nav-card__icon">' + t.icon + '</span>' +
        '<span class="tool-nav-card__body">' +
          '<span class="tool-nav-card__title">' + t.title + '</span>' +
          '<span class="tool-nav-card__desc">' + t.desc + '</span>' +
        '</span>' +
        '<span class="tool-nav-card__arrow" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>' +
        '</span>';
      link.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        // If target section exists in the current DOM (SPA mode), switch in-place; otherwise navigate to Astro page
        if ($('#tool-' + t.id) && !isMultiPage()) {
          e.preventDefault();
          openTool(t.id, true);
        }
      });
      listEl.appendChild(link);
    });
  }

  function openTool(id, scrollUp) {
    var tool = getToolById(id);
    if (!$('#tool-' + tool.id) && isMultiPage()) {
      location.href = tool.href;
      return;
    }
    activeTool = tool.id;

    // Toggle tool views
    $$('.tool-view').forEach(function (sec) {
      var isMatch = sec.id === 'tool-' + activeTool;
      sec.hidden = !isMatch;
    });

    // Toggle topbar center controls & guide section
    var bijoyTabs = $('#bijoyTabs');
    var activeToolBar = $('#activeToolHeader');
    var activeToolName = $('#activeToolName');
    var btnCalReset = $('#btnCalReset');
    var bijoyGuide = $('#bijoyGuide');

    if (bijoyTabs) bijoyTabs.hidden = activeTool !== 'bijoy';
    if (activeToolBar) activeToolBar.hidden = activeTool === 'bijoy';
    if (activeToolName) activeToolName.innerHTML = tool.icon + ' <span>' + tool.title + '</span>';
    if (btnCalReset) btnCalReset.hidden = activeTool !== 'calendar';
    if (bijoyGuide) bijoyGuide.hidden = activeTool !== 'bijoy';

    // Initialize the selected tool
    if (activeTool === 'pdf' && window.TechHatPDF) window.TechHatPDF.init();
    else if (activeTool === 'calendar') initConv();
    else if (activeTool === 'age') initAge();
    else if (activeTool === 'datecalc') initCalc();
    else if (activeTool === 'invoice') initInv();

    // Re-render right sidebar excluding the currently open tool
    renderSidebar();

    // Save state & hash (only mutate hash in single-page mode)
    try { localStorage.setItem('thbc-active-tool', activeTool); } catch (e) {}
    if (!isMultiPage() && history.replaceState) {
      history.replaceState(null, '', activeTool === 'bijoy' ? location.pathname + location.search : '#tool-' + activeTool);
    }

    if (scrollUp) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* ==================================================================
   * CALENDAR / DATE ALGORITHMS
   * ================================================================== */
  function getBn(d) {
    var y = d.getFullYear(), m = d.getMonth(), dt = d.getDate();
    var by = (m < 3 || (m === 3 && dt < 14)) ? y - 594 : y - 593;
    var doy = Math.floor((d - new Date(y, 0, 1)) / 86400000) + 1;
    var st = isLeap(y) ? 105 : 104;
    var bD = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 29, 30];
    if (isLeap(y)) bD[10] = 30;
    var bm = 0, bd = 0;
    if (doy >= st) {
      var r = doy - st;
      for (var i = 0; i < 12; i++) {
        if (r < bD[i]) { bm = i; bd = r + 1; break; }
        r -= bD[i];
      }
    } else {
      var r2 = st - doy, tm = 11;
      while (r2 > 0) {
        var x = bD[tm];
        if (r2 <= x) { bm = tm; bd = (x - r2) + 1; break; }
        r2 -= x;
        tm--;
      }
    }
    return { d: bd, m: bm, y: by };
  }

  function getHj(d) {
    var dt = d.getDate(), m = d.getMonth(), y = d.getFullYear();
    var m1 = m + 1, y1 = y;
    if (m1 < 3) { y1 -= 1; m1 += 12; }
    var a = Math.floor(y1 / 100), b = 2 - a + Math.floor(a / 4);
    if (y1 < 1583) b = 0;
    if (y1 === 1582 && (m1 > 10 || (m1 === 10 && dt > 4))) b = -10;
    var jd = Math.floor(365.25 * (y1 + 4716)) + Math.floor(30.6001 * (m1 + 1)) + dt + b - 1524;
    var z = jd - 1948084, cyc = Math.floor(z / 10631);
    z -= 10631 * cyc;
    var j = Math.floor((z - 8.01 / 60) / 10631 * 30), iy = 30 * cyc + j;
    z -= Math.floor(j * 10631 / 30 + 8.01 / 60);
    var im = Math.floor((z + 28.5001) / 29.5);
    if (im === 13) im = 12;
    var id = z - Math.floor(29.5001 * im - 29);
    return { d: id, m: im - 1, y: iy };
  }

  var hjAdj = 0;
  function setAdj(v) {
    hjAdj = parseInt(v, 10) || 0;
    renderConv();
  }

  function getHjWithAdj(d) {
    var h = getHj(d);
    var newD = h.d + hjAdj;
    if (newD > 30) { newD -= 30; h.m++; }
    if (newD < 1) { newD += 30; h.m--; }
    if (h.m > 11) { h.m = 0; h.y++; }
    if (h.m < 0) { h.m = 11; h.y--; }
    h.d = newD;
    return h;
  }

  function bnToEn(bd, bm, by) {
    var gy = by + 593;
    var gDate = new Date(gy, 3, 14);
    var bD = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 29, 30];
    if (isLeap(gy + 1)) bD[10] = 30;
    for (var i = 0; i < bm; i++) gDate.setDate(gDate.getDate() + bD[i]);
    gDate.setDate(gDate.getDate() + (bd - 1));
    return gDate;
  }

  function hjToEn(hd, hm, hy) {
    var estGY = Math.floor(hy * 0.9702) + 622;
    var tempDate = new Date(estGY - 1, 0, 1);
    var lastValidDate = null;
    for (var i = 0; i < 1200; i++) {
      var h = getHj(tempDate);
      if (h.y === hy && h.m === hm) {
        lastValidDate = new Date(tempDate);
        if (h.d === (hd - hjAdj)) return new Date(tempDate);
      }
      if (h.y > hy || (h.y === hy && h.m > hm)) {
        if (lastValidDate) return lastValidDate;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    return lastValidDate || new Date();
  }

  /* ==================================================================
   * SWIPE / WHEEL / DRAG INTERACTION HELPER
   * ================================================================== */
  function bindSwipeBox(id, cb) {
    var el = document.getElementById(id);
    if (!el || el.dataset.swipeBound === '1') return;
    el.dataset.swipeBound = '1';

    var sy = 0, acc = 0, isSwipe = false, isMouseDown = false;
    el.addEventListener('touchstart', function (e) {
      if (e.target.tagName === 'INPUT') return;
      sy = e.touches[0].clientY;
      acc = 0;
      isSwipe = false;
      el.classList.add('active');
    }, { passive: false });

    el.addEventListener('touchmove', function (e) {
      if (e.target.tagName === 'INPUT') return;
      var cy = e.touches[0].clientY;
      var diff = sy - cy;
      if (Math.abs(diff) > 2) {
        isSwipe = true;
        if (e.cancelable) e.preventDefault();
        acc += diff;
        sy = cy;
        if (Math.abs(acc) > 25) {
          cb(acc > 0 ? 1 : -1);
          acc = 0;
        }
      }
    }, { passive: false });

    el.addEventListener('touchend', function (e) {
      el.classList.remove('active');
      if (isSwipe && e.cancelable) e.preventDefault();
    });

    el.addEventListener('mousedown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.closest('.arr-btn')) return;
      isMouseDown = true;
      sy = e.clientY;
      acc = 0;
      el.classList.add('active');
    });

    el.addEventListener('mousemove', function (e) {
      if (!isMouseDown) return;
      e.preventDefault();
      var cy = e.clientY;
      var diff = sy - cy;
      if (Math.abs(diff) > 2) {
        acc += diff;
        sy = cy;
        if (Math.abs(acc) > 25) {
          cb(acc > 0 ? 1 : -1);
          acc = 0;
        }
      }
    });

    var endM = function () {
      if (isMouseDown) {
        isMouseDown = false;
        el.classList.remove('active');
      }
    };
    el.addEventListener('mouseup', endM);
    el.addEventListener('mouseleave', endM);

    el.addEventListener('wheel', function (e) {
      e.preventDefault();
      var now = Date.now();
      if (now - (el._lastT || 0) > 50) {
        cb(e.deltaY > 0 ? -1 : 1);
        el._lastT = now;
      }
    }, { passive: false });
  }

  /* ==================================================================
   * TOOL 2: DATE CONVERTER (EN / BN / HJ)
   * ================================================================== */
  var base = getBDDate(), mode = 'EN';

  function initConv() {
    ['boxD', 'boxM', 'boxY'].forEach(function (id) {
      bindSwipeBox(id, function (v) { upd(v, id.charAt(3).toLowerCase()); });
    });
    renderConv();
  }

  function resetConverter() {
    base = getBDDate();
    hjAdj = 0;
    var adjEl = $('#hjAdj');
    if (adjEl) adjEl.value = '0';
    renderConv();
  }

  function setMode(m) {
    mode = m;
    $$('#tool-calendar .cal-mode-tab').forEach(function (b) {
      b.classList.toggle('active', b.id === 't' + m);
    });
    var card = $('#tool-calendar');
    if (card) card.setAttribute('data-cal-mode', m.toLowerCase());
    renderConv();
  }

  function renderConv() {
    if (!$('#txtD')) return;
    var d = base.getDate(), m = base.getMonth(), y = base.getFullYear();
    var dispD = d, dispM = enM[m], dispY = y;
    if (mode === 'BN') {
      var b = getBn(base);
      dispD = b.d; dispM = bnM[b.m]; dispY = b.y;
    } else if (mode === 'HJ') {
      var h = getHjWithAdj(base);
      dispD = h.d; dispM = hjM[h.m]; dispY = h.y;
    }
    $('#txtD').textContent = toBn(dispD < 10 ? '0' + dispD : dispD);
    $('#txtM').textContent = dispM;
    $('#txtY').textContent = toBn(dispY);

    var bn = getBn(base), hj = getHjWithAdj(base), dn = days[base.getDay()], s = sea[Math.floor(bn.m / 2)];
    if (mode === 'EN') {
      updR('বাংলা তারিখ', toBn(bn.d) + ' ' + bnM[bn.m] + ', ' + toBn(bn.y), dn + ' • ' + s + ' কাল', 'হিজরি তারিখ', toBn(hj.d) + ' ' + hjM[hj.m] + ', ' + toBn(hj.y));
    } else if (mode === 'BN') {
      updR('ইংরেজি তারিখ', toBn(d) + ' ' + enMFull[m] + ', ' + toBn(y), dn + ' • ' + s + ' কাল', 'হিজরি তারিখ', toBn(hj.d) + ' ' + hjM[hj.m] + ', ' + toBn(hj.y));
    } else {
      updR('ইংরেজি তারিখ', toBn(d) + ' ' + enMFull[m] + ', ' + toBn(y), dn, 'বাংলা তারিখ', toBn(bn.d) + ' ' + bnM[bn.m] + ', ' + toBn(bn.y) + ' (' + s + ' কাল)');
    }
  }

  function updR(l1, v1, vm, l2, v2) {
    $('#lblMain').textContent = l1;
    $('#resMain').textContent = v1;
    $('#resMeta').textContent = vm;
    $('#lblSec').textContent = l2;
    $('#resSec').textContent = v2;
  }

  function upd(v, t) {
    if (v === 0) return;
    if (mode === 'EN') {
      if (t === 'm') {
        var nm = base.getMonth() + v;
        if (nm < 0 || nm > 11) return;
        setMonthClamped(base, nm);
      } else if (t === 'd') {
        var nd = base.getDate() + v;
        var max = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
        if (nd < 1 || nd > max) return;
        base.setDate(nd);
      } else {
        var ny = base.getFullYear() + v;
        if (ny < 1 || ny > 9999) return;
        setYearClamped(base, ny);
      }
    } else if (mode === 'BN') {
      var b = getBn(base), td = b.d, tm = b.m, ty = b.y;
      var gy = ty + 593;
      var bD = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 29, 30];
      if (isLeap(gy + 1)) bD[10] = 30;
      if (t === 'd') { var ndB = td + v; if (ndB < 1 || ndB > bD[tm]) return; td = ndB; }
      if (t === 'm') { var nmB = tm + v; if (nmB < 0 || nmB > 11) return; if (td > bD[nmB]) td = bD[nmB]; tm = nmB; }
      if (t === 'y') {
        ty += v;
        var nGy = ty + 593;
        bD[10] = isLeap(nGy + 1) ? 30 : 29;
        if (tm === 10 && td > bD[10]) td = bD[10];
      }
      base = bnToEn(td, tm, ty);
    } else {
      var h = getHjWithAdj(base), tdH = h.d, tmH = h.m, tyH = h.y;
      if (t === 'd') { var ndH = tdH + v; if (ndH < 1 || ndH > 30) return; tdH = ndH; }
      if (t === 'm') { var nmH = tmH + v; if (nmH < 0 || nmH > 11) return; tmH = nmH; }
      if (t === 'y') tyH += v;
      base = hjToEn(tdH, tmH, tyH);
    }
    renderConv();
  }

  function manual(v, t) {
    var cur;
    if (mode === 'EN') cur = (t === 'd' ? base.getDate() : base.getMonth());
    else if (mode === 'BN') { var b = getBn(base); cur = (t === 'd' ? b.d : b.m); }
    else { var h = getHjWithAdj(base); cur = (t === 'd' ? h.d : h.m); }
    upd(parseInt(v, 10) - cur, t);
  }

  function editY() {
    $('#txtY').style.display = 'none';
    var i = $('#yearInp');
    i.style.display = 'block';
    var y = mode === 'EN' ? base.getFullYear() : (mode === 'BN' ? getBn(base).y : getHjWithAdj(base).y);
    i.value = y;
    i.focus();
  }

  function closeY() {
    var i = $('#yearInp'), v = parseInt(i.value, 10);
    var cy = mode === 'EN' ? base.getFullYear() : (mode === 'BN' ? getBn(base).y : getHjWithAdj(base).y);
    if (!isNaN(v)) upd(v - cy, 'y');
    i.style.display = 'none';
    $('#txtY').style.display = 'block';
  }

  /* ==================================================================
   * TOOL 3: AGE MANAGER (AGE CALCULATOR & DOB FINDER)
   * ================================================================== */
  var dob = new Date(2000, 0, 1), ref = getBDDate(), fref = getBDDate(), rev = { y: 0, m: 0, d: 0 };

  function ctxFromId(id) {
    if (id.indexOf('ad') === 0) return 'dob';
    if (id.indexOf('ar') === 0) return 'ref';
    return 'fref';
  }

  function initAge() {
    ['adD', 'adM', 'adY', 'arD', 'arM', 'arY', 'afD', 'afM', 'afY'].forEach(function (id) {
      bindSwipeBox(id, function (v) { updAge(ctxFromId(id), id.charAt(2).toLowerCase(), v); });
    });
    ['agY', 'agM', 'agD'].forEach(function (id) {
      bindSwipeBox(id, function (v) { updRev(id.charAt(2).toLowerCase(), v); });
    });
    renAge('dob', dob);
    renAge('ref', ref);
    renAge('fref', fref);
    if ($('#agY-txt')) {
      $('#agY-txt').textContent = toBn(rev.y);
      $('#agM-txt').textContent = toBn(rev.m);
      $('#agD-txt').textContent = toBn(rev.d);
    }
    calcStats();
    calcDob();
  }

  function switchAgeTab(t) {
    $$('#tool-age .sub-tab-btn').forEach(function (b) {
      b.classList.toggle('active', b.id === 'at-' + t);
    });
    $('#av-calc').hidden = t !== 'calc';
    $('#av-find').hidden = t !== 'find';
  }

  function renAge(ctx, dObj) {
    var p = ctx === 'dob' ? 'ad' : (ctx === 'ref' ? 'ar' : 'af');
    var elD = $('#' + p + 'D-txt');
    if (!elD) return;
    var d = dObj.getDate(), m = dObj.getMonth(), y = dObj.getFullYear();
    elD.textContent = toBn(d < 10 ? '0' + d : d);
    $('#' + p + 'M-txt').textContent = enM[m];
    $('#' + p + 'Y-txt').textContent = toBn(y);
  }

  function updAge(ctx, t, v) {
    var d = ctx === 'dob' ? dob : (ctx === 'ref' ? ref : fref);
    if (t === 'd') {
      var nd = d.getDate() + v;
      var max = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      if (nd < 1 || nd > max) return;
      d.setDate(nd);
    }
    if (t === 'm') {
      var nm = d.getMonth() + v;
      if (nm < 0 || nm > 11) return;
      setMonthClamped(d, nm);
    }
    if (t === 'y') setYearClamped(d, d.getFullYear() + v);
    renAge(ctx, d);
    if (ctx === 'fref') calcDob();
    else calcStats();
  }

  function manAge(ctx, t, v) {
    var d = ctx === 'dob' ? dob : (ctx === 'ref' ? ref : fref);
    if (t === 'd') d.setDate(parseInt(v, 10));
    if (t === 'm') setMonthClamped(d, parseInt(v, 10));
    renAge(ctx, d);
    if (ctx === 'fref') calcDob();
    else calcStats();
  }

  function edAgeY(ctx) {
    var p = ctx === 'dob' ? 'ad' : (ctx === 'ref' ? 'ar' : 'af');
    var i = $('#' + p + 'Y-inp'), t = $('#' + p + 'Y-txt');
    t.style.display = 'none';
    i.style.display = 'block';
    i.value = (ctx === 'dob' ? dob : (ctx === 'ref' ? ref : fref)).getFullYear();
    i.focus();
  }

  function clAgeY(ctx) {
    var p = ctx === 'dob' ? 'ad' : (ctx === 'ref' ? 'ar' : 'af');
    var i = $('#' + p + 'Y-inp'), v = parseInt(i.value, 10);
    var curY = (ctx === 'dob' ? dob : (ctx === 'ref' ? ref : fref)).getFullYear();
    if (!isNaN(v)) updAge(ctx, 'y', v - curY);
    i.style.display = 'none';
    $('#' + p + 'Y-txt').style.display = 'block';
  }

  function edRev(t) {
    var txt = $('#ag' + t.toUpperCase() + '-txt');
    var inp = $('#ag' + t.toUpperCase() + '-inp');
    txt.style.display = 'none';
    inp.style.display = 'block';
    inp.value = rev[t];
    inp.focus();
  }

  function clRev(t) {
    var txt = $('#ag' + t.toUpperCase() + '-txt');
    var inp = $('#ag' + t.toUpperCase() + '-inp');
    var v = parseInt(inp.value, 10);
    if (!isNaN(v) && v >= 0) {
      rev[t] = v;
      txt.textContent = toBn(rev[t]);
      calcDob();
    }
    inp.style.display = 'none';
    txt.style.display = 'block';
  }

  function updRev(t, v) {
    if (rev[t] + v >= 0) rev[t] += v;
    $('#agY-txt').textContent = toBn(rev.y);
    $('#agM-txt').textContent = toBn(rev.m);
    $('#agD-txt').textContent = toBn(rev.d);
    calcDob();
  }

  function calcStats() {
    if (!$('#age-main')) return;
    var d = new Date(dob), r = new Date(ref);
    if (d > r) { var tmp = d; d = r; r = tmp; }
    var y = r.getFullYear() - d.getFullYear();
    var m = r.getMonth() - d.getMonth();
    var dt = r.getDate() - d.getDate();
    if (dt < 0) {
      m--;
      dt += new Date(r.getFullYear(), r.getMonth(), 0).getDate();
    }
    if (m < 0) {
      y--;
      m += 12;
    }
    $('#age-main').textContent = toBn(y) + ' বছর, ' + toBn(m) + ' মাস, ' + toBn(dt) + ' দিন';
    var diff = r - d;
    $('#st-sec').textContent = toBn(Math.floor(diff / 1000));
    $('#st-min').textContent = toBn(Math.floor(diff / 60000));
    $('#st-hour').textContent = toBn(Math.floor(diff / 3600000));
    var td = Math.floor(diff / 86400000);
    $('#st-day').textContent = toBn(td);
    $('#st-week').textContent = toBn(Math.floor(td / 7));
    $('#st-month').textContent = toBn((y * 12) + m);
  }

  function calcDob() {
    if (!$('#dob-main')) return;
    var t = new Date(fref);
    t.setFullYear(t.getFullYear() - rev.y);
    t.setMonth(t.getMonth() - rev.m);
    t.setDate(t.getDate() - rev.d);
    var dn = days[t.getDay()], bn = getBn(t), s = sea[Math.floor(bn.m / 2)], hj = getHjWithAdj(t);
    $('#dob-main').textContent = toBn(t.getDate()) + ' ' + enMFull[t.getMonth()] + ', ' + toBn(t.getFullYear()) + ' (' + dn + ')';
    $('#dob-season').textContent = s + ' কাল';
    $('#dob-bn').textContent = 'বাংলা: ' + toBn(bn.d) + ' ' + bnM[bn.m] + ', ' + toBn(bn.y);
    $('#dob-hj').textContent = 'হিজরি: ' + toBn(hj.d) + ' ' + hjM[hj.m] + ', ' + toBn(hj.y);
  }

  /* ==================================================================
   * TOOL 4: DATE DURATION CALCULATOR
   * ================================================================== */
  var start = getBDDate(), dur = { y: 0, m: 0, d: 0 };

  function initCalc() {
    ['dcD', 'dcM', 'dcY'].forEach(function (id) {
      bindSwipeBox(id, function (v) { updCalc('s', id.charAt(2).toLowerCase(), v); });
    });
    ['duY', 'duM', 'duD'].forEach(function (id) {
      bindSwipeBox(id, function (v) { updCalc('c', id.charAt(2).toLowerCase(), v); });
    });
    renCalc();
    compCalc();
  }

  function renCalc() {
    if (!$('#dcD-txt')) return;
    var d = start.getDate(), m = start.getMonth(), y = start.getFullYear();
    $('#dcD-txt').textContent = toBn(d < 10 ? '0' + d : d);
    $('#dcM-txt').textContent = enM[m];
    $('#dcY-txt').textContent = toBn(y);
    $('#duY-txt').textContent = toBn(dur.y);
    $('#duM-txt').textContent = toBn(dur.m);
    $('#duD-txt').textContent = toBn(dur.d);
  }

  function updCalc(ctx, t, v) {
    if (ctx === 's') {
      if (t === 'd') {
        var nd = start.getDate() + v;
        var max = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
        if (nd < 1 || nd > max) return;
        start.setDate(nd);
      }
      if (t === 'm') {
        var nm = start.getMonth() + v;
        if (nm < 0 || nm > 11) return;
        setMonthClamped(start, nm);
      }
      if (t === 'y') setYearClamped(start, start.getFullYear() + v);
    } else {
      if (dur[t] + v >= 0) dur[t] += v;
    }
    renCalc();
    compCalc();
  }

  function manCalc(t, v) {
    if (t === 'd') start.setDate(parseInt(v, 10));
    if (t === 'm') setMonthClamped(start, parseInt(v, 10));
    renCalc();
    compCalc();
  }

  function edCalcY() {
    $('#dcY-txt').style.display = 'none';
    var i = $('#dcY-inp');
    i.style.display = 'block';
    i.value = start.getFullYear();
    i.focus();
  }

  function clCalcY() {
    var i = $('#dcY-inp'), v = parseInt(i.value, 10);
    if (!isNaN(v)) updCalc('s', 'y', v - start.getFullYear());
    i.style.display = 'none';
    $('#dcY-txt').style.display = 'block';
  }

  function edDur(t) {
    var txt = $('#du' + t.toUpperCase() + '-txt');
    var inp = $('#du' + t.toUpperCase() + '-inp');
    txt.style.display = 'none';
    inp.style.display = 'block';
    inp.value = dur[t];
    inp.focus();
  }

  function clDur(t) {
    var txt = $('#du' + t.toUpperCase() + '-txt');
    var inp = $('#du' + t.toUpperCase() + '-inp');
    var v = parseInt(inp.value, 10);
    if (!isNaN(v) && v >= 0) {
      dur[t] = v;
      updCalc('c', t, 0);
    }
    inp.style.display = 'none';
    txt.style.display = 'block';
  }

  function compCalc() {
    if (!$('#dcResEn')) return;
    var checked = $('input[name="dcDir"]:checked');
    var isAfter = !checked || checked.value === 'after';
    var t = new Date(start), fac = isAfter ? 1 : -1;
    t.setFullYear(t.getFullYear() + (dur.y * fac));
    t.setMonth(t.getMonth() + (dur.m * fac));
    t.setDate(t.getDate() + (dur.d * fac));
    var b = getBn(t), dn = days[t.getDay()], hj = getHjWithAdj(t);
    $('#dcResEn').textContent = toBn(t.getDate()) + ' ' + enMFull[t.getMonth()] + ', ' + toBn(t.getFullYear());
    $('#dcResBn').textContent = 'বাংলা: ' + toBn(b.d) + ' ' + bnM[b.m] + ', ' + toBn(b.y) + ' (' + dn + ') • হিজরি: ' + toBn(hj.d) + ' ' + hjM[hj.m] + ', ' + toBn(hj.y);
  }

  /* ==================================================================
   * TOOL 5: INVOICE GENERATOR (FULL-FEATURED & PRINT READY)
   * ================================================================== */
  var invItems = [{ desc: '', qty: 1, price: 0 }];
  var invInitialized = false;

  var bnNumWords = [
    'শূন্য', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়',
    'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ',
    'বিশ', 'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আটাশ', 'ঊনত্রিশ',
    'ত্রিশ', 'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'ঊনচল্লিশ',
    'চল্লিশ', 'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ',
    'পঞ্চাশ', 'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট',
    'ষাট', 'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর',
    'সত্তর', 'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি',
    'আশি', 'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'আটাশি', 'ঊননব্বই',
    'নব্বই', 'একানব্বই', 'বিরানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'
  ];

  function intToBnWords(n) {
    n = Math.floor(Math.abs(n));
    if (n === 0) return 'শূন্য';
    var parts = [];
    if (n >= 10000000) {
      parts.push(intToBnWords(Math.floor(n / 10000000)) + ' কোটি');
      n %= 10000000;
    }
    if (n >= 100000) {
      parts.push(bnNumWords[Math.floor(n / 100000)] + ' লক্ষ');
      n %= 100000;
    }
    if (n >= 1000) {
      parts.push(bnNumWords[Math.floor(n / 1000)] + ' হাজার');
      n %= 1000;
    }
    if (n >= 100) {
      parts.push(bnNumWords[Math.floor(n / 100)] + ' শত');
      n %= 100;
    }
    if (n > 0) {
      parts.push(bnNumWords[n]);
    }
    return parts.join(' ');
  }

  function numberToBanglaWords(amount, currSym) {
    var num = Math.max(0, parseFloat(amount) || 0);
    var unitName = currSym === '$' ? 'ডলার' : (currSym === '₹' ? 'রুপি' : 'টাকা');
    var subUnit = currSym === '$' ? 'সেন্ট' : 'পয়সা';
    var whole = Math.floor(num);
    var frac = Math.round((num - whole) * 100);
    if (frac === 100) { whole += 1; frac = 0; }
    var text = intToBnWords(whole) + ' ' + unitName;
    if (frac > 0) {
      text += ' ' + intToBnWords(frac) + ' ' + subUnit;
    }
    return text + ' মাত্র';
  }

  function getInvCurr() {
    var el = $('#invCurrency');
    return (el && el.value) ? el.value : '৳';
  }

  function saveShopMeta() {
    try {
      var data = {
        shopName: ($('#invShopName') && $('#invShopName').value) || '',
        shopSub: ($('#invShopSub') && $('#invShopSub').value) || '',
        payInfo: ($('#invPayInfo') && $('#invPayInfo').value) || '',
        terms: ($('#invTerms') && $('#invTerms').value) || '',
        footAddr: ($('#invFootAddr') && $('#invFootAddr').value) || '',
        footPhone: ($('#invFootPhone') && $('#invFootPhone').value) || '',
        footEmail: ($('#invFootEmail') && $('#invFootEmail').value) || ''
      };
      localStorage.setItem('thbc-inv-shop', JSON.stringify(data));
    } catch (e) {}
  }

  function loadShopMeta() {
    try {
      var raw = localStorage.getItem('thbc-inv-shop');
      if (raw) {
        var data = JSON.parse(raw);
        if (data.shopName && $('#invShopName')) $('#invShopName').value = data.shopName;
        if (data.shopSub && $('#invShopSub')) $('#invShopSub').value = data.shopSub;
        if (data.payInfo && $('#invPayInfo')) $('#invPayInfo').value = data.payInfo;
        if (data.terms && $('#invTerms')) $('#invTerms').value = data.terms;
        if (data.footAddr && $('#invFootAddr')) $('#invFootAddr').value = data.footAddr;
        if (data.footPhone && $('#invFootPhone')) $('#invFootPhone').value = data.footPhone;
        if (data.footEmail && $('#invFootEmail')) $('#invFootEmail').value = data.footEmail;
      }
      var savedLogo = localStorage.getItem('thbc-inv-logo');
      if (savedLogo && $('#invLogoImg')) {
        $('#invLogoImg').src = savedLogo;
      }
    } catch (e) {}
  }

  function initInv() {
    if (!invInitialized) {
      var dateInp = $('#invDate');
      if (dateInp) {
        try { dateInp.valueAsDate = getBDDate(); } catch (e) {}
      }
      loadShopMeta();
      ['invShopName', 'invShopSub', 'invPayInfo', 'invTerms', 'invFootAddr', 'invFootPhone', 'invFootEmail'].forEach(function (id) {
        var el = $('#' + id);
        if (el) el.addEventListener('input', saveShopMeta);
      });
      var logoInp = $('#invLogoInput');
      if (logoInp) {
        logoInp.addEventListener('change', function () {
          var file = logoInp.files && logoInp.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function (ev) {
            var dataUrl = ev.target && ev.target.result;
            if (dataUrl && $('#invLogoImg')) {
              $('#invLogoImg').src = dataUrl;
              try { localStorage.setItem('thbc-inv-logo', dataUrl); } catch (e) {}
            }
          };
          reader.readAsDataURL(file);
        });
      }
      invInitialized = true;
    }
    renderInvItems();
  }

  function renderInvItems() {
    var list = $('#invList');
    if (!list) return;
    var curr = getInvCurr();
    list.innerHTML = '';
    invItems.forEach(function (item, index) {
      var row = document.createElement('tr');
      var lineTotal = ((parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0)).toFixed(2);
      row.innerHTML =
        '<td class="inv-sl-cell" style="text-align:center;">' + toBn(index + 1) + '</td>' +
        '<td><input type="text" class="inv-inp-trans" placeholder="পণ্যের নাম বা বিবরণ লিখুন..." value="' + String(item.desc).replace(/"/g, '&quot;') + '" data-idx="' + index + '" data-field="desc"></td>' +
        '<td style="text-align:right;"><input type="number" class="inv-inp-trans" style="text-align:right;" placeholder="0" min="0" step="any" value="' + item.price + '" data-idx="' + index + '" data-field="price"></td>' +
        '<td style="text-align:center;"><input type="number" class="inv-inp-trans" style="text-align:center;" placeholder="1" min="0" step="any" value="' + item.qty + '" data-idx="' + index + '" data-field="qty"></td>' +
        '<td class="inv-line-total" style="text-align:right;">' + curr + ' ' + lineTotal + '</td>' +
        '<td class="no-print inv-del-col" style="text-align:center;"><button type="button" class="btn-del no-print" data-del="' + index + '" title="সারি মুছুন" aria-label="সারি মুছুন">✕</button></td>';
      list.appendChild(row);
    });

    $$('input[data-idx]', list).forEach(function (inp) {
      inp.addEventListener('input', function () {
        var idx = +inp.getAttribute('data-idx');
        var field = inp.getAttribute('data-field');
        invItems[idx][field] = inp.value;
        var tr = inp.closest('tr');
        if (tr && field !== 'desc') {
          var lt = ((parseFloat(invItems[idx].qty) || 0) * (parseFloat(invItems[idx].price) || 0)).toFixed(2);
          var cell = tr.querySelector('.inv-line-total');
          if (cell) cell.textContent = getInvCurr() + ' ' + lt;
        }
        calcInv();
      });
    });

    $$('button[data-del]', list).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = +btn.getAttribute('data-del');
        if (invItems.length > 1) {
          invItems.splice(idx, 1);
          renderInvItems();
        } else {
          invItems[0] = { desc: '', qty: 1, price: 0 };
          renderInvItems();
        }
      });
    });

    calcInv();
  }

  function addInvItem() {
    invItems.push({ desc: '', qty: 1, price: 0 });
    renderInvItems();
    var inputs = $$('#invList input[data-field="desc"]');
    if (inputs.length) {
      inputs[inputs.length - 1].focus();
    }
  }

  function calcInv() {
    if (!$('#invSub')) return;
    var curr = getInvCurr();
    var sub = 0;
    var lineCells = $$('#invList .inv-line-total');
    invItems.forEach(function (i, idx) {
      var lt = (parseFloat(i.qty) || 0) * (parseFloat(i.price) || 0);
      sub += lt;
      if (lineCells[idx]) {
        lineCells[idx].textContent = curr + ' ' + lt.toFixed(2);
      }
    });

    var disc = Math.max(0, parseFloat(($('#invDisc') && $('#invDisc').value) || 0) || 0);
    var afterDisc = Math.max(0, sub - disc);
    var taxRate = Math.max(0, parseFloat(($('#invTax') && $('#invTax').value) || 0) || 0);
    var tax = afterDisc * (taxRate / 100);
    var ship = Math.max(0, parseFloat(($('#invShip') && $('#invShip').value) || 0) || 0);
    var total = afterDisc + tax + ship;
    var paid = Math.max(0, parseFloat(($('#invPaid') && $('#invPaid').value) || 0) || 0);
    var due = Math.max(0, total - paid);

    $('#invSub').textContent = curr + ' ' + sub.toFixed(2);
    $('#invTaxVal').textContent = curr + ' ' + tax.toFixed(2);
    $('#invGrand').textContent = curr + ' ' + total.toFixed(2);
    if ($('#invDue')) $('#invDue').textContent = curr + ' ' + due.toFixed(2);
    if ($('#invWords')) $('#invWords').textContent = numberToBanglaWords(total, curr);

    var badge = $('#invStatusBadge');
    if (badge) {
      if (total <= 0) {
        badge.setAttribute('data-status', 'draft');
        badge.textContent = 'খসড়া (DRAFT)';
      } else if (due <= 0.005) {
        badge.setAttribute('data-status', 'paid');
        badge.textContent = 'পরিশোধিত (PAID)';
      } else if (paid > 0) {
        badge.setAttribute('data-status', 'partial');
        badge.textContent = 'আংশিক বাকি (PARTIAL)';
      } else {
        badge.setAttribute('data-status', 'due');
        badge.textContent = 'বাকি (DUE)';
      }
    }
  }

  function resetInv() {
    invItems = [{ desc: '', qty: 1, price: 0 }];
    if ($('#invCli')) $('#invCli').value = '';
    if ($('#invPhone')) $('#invPhone').value = '';
    if ($('#invAddr')) $('#invAddr').value = '';
    if ($('#invDisc')) $('#invDisc').value = '0';
    if ($('#invTax')) $('#invTax').value = '0';
    if ($('#invShip')) $('#invShip').value = '0';
    if ($('#invPaid')) $('#invPaid').value = '0';
    if ($('#invDate')) {
      try { $('#invDate').valueAsDate = getBDDate(); } catch (e) {}
    }
    if ($('#invNo')) {
      var curNo = $('#invNo').value || '#INV-001';
      var m = /^(.*?)(\d+)$/.exec(curNo);
      if (m) {
        var nextNum = String(parseInt(m[2], 10) + 1);
        while (nextNum.length < m[2].length) nextNum = '0' + nextNum;
        $('#invNo').value = m[1] + nextNum;
      }
    }
    renderInvItems();
  }

  function printInv() {
    window.print();
  }

  /* ==================================================================
   * GRID PICKER MODAL (DAY & MONTH SELECTION)
   * ================================================================== */
  var activeGridId = null;

  function openGrid(type, id) {
    var gridOverlay = $('#gridModalOverlay');
    var gridContent = $('#gridContent');
    var gridTitle = $('#gridTitle');
    var gridSub = $('#gridSub');
    var calHeader = $('#calHeader');
    if (!gridOverlay || !gridContent) return;

    activeGridId = id;
    gridOverlay.hidden = false;
    gridOverlay.setAttribute('aria-hidden', 'false');
    gridContent.innerHTML = '';

    var ctxDate, ctxMode = 'EN', mName, yNum, maxD, curD;
    if (id.indexOf('txt') === 0) {
      ctxMode = mode;
      if (mode === 'EN') ctxDate = { d: base.getDate(), m: base.getMonth(), y: base.getFullYear() };
      else if (mode === 'BN') ctxDate = getBn(base);
      else ctxDate = getHjWithAdj(base);
    } else if (id.indexOf('ad') === 0) {
      ctxDate = { d: dob.getDate(), m: dob.getMonth(), y: dob.getFullYear() };
    } else if (id.indexOf('ar') === 0) {
      ctxDate = { d: ref.getDate(), m: ref.getMonth(), y: ref.getFullYear() };
    } else if (id.indexOf('af') === 0) {
      ctxDate = { d: fref.getDate(), m: fref.getMonth(), y: fref.getFullYear() };
    } else if (id.indexOf('dc') === 0) {
      ctxDate = { d: start.getDate(), m: start.getMonth(), y: start.getFullYear() };
    }

    curD = ctxDate.d;

    if (type === 'd') {
      gridTitle.textContent = 'দিন নির্বাচন';
      calHeader.style.display = 'grid';
      gridContent.className = 'grid-grid g-day-grid';

      var startDayIdx = 0;
      if (ctxMode === 'EN' || id.indexOf('ad') === 0 || id.indexOf('ar') === 0 || id.indexOf('af') === 0 || id.indexOf('dc') === 0) {
        maxD = new Date(ctxDate.y, ctxDate.m + 1, 0).getDate();
        startDayIdx = new Date(ctxDate.y, ctxDate.m, 1).getDay();
        mName = enMFull[ctxDate.m];
        yNum = toBn(ctxDate.y);
      } else if (ctxMode === 'BN') {
        var gy = ctxDate.y + 593;
        maxD = (ctxDate.m < 6) ? 31 : (ctxDate.m === 10 && !isLeap(gy + 1) ? 29 : 30);
        var bD = bnToEn(1, ctxDate.m, ctxDate.y);
        startDayIdx = bD.getDay();
        mName = bnM[ctxDate.m];
        yNum = toBn(ctxDate.y);
      } else {
        maxD = 30;
        var hD = hjToEn(1, ctxDate.m, ctxDate.y);
        startDayIdx = hD.getDay();
        mName = hjM[ctxDate.m];
        yNum = toBn(ctxDate.y);
      }

      gridSub.textContent = mName + ', ' + yNum;

      for (var s = 0; s < startDayIdx; s++) {
        var emptySlot = document.createElement('div');
        emptySlot.className = 'grid-item empty';
        gridContent.appendChild(emptySlot);
      }

      var makeDayClick = function (dayVal) {
        return function () { selectGrid(dayVal, 'd'); };
      };
      for (var i = 1; i <= maxD; i++) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'grid-item' + (i === curD ? ' active' : '');
        btn.textContent = toBn(i);
        btn.addEventListener('click', makeDayClick(i));
        gridContent.appendChild(btn);
      }
    } else if (type === 'm') {
      gridTitle.textContent = 'মাস নির্বাচন';
      calHeader.style.display = 'none';
      gridContent.className = 'grid-grid g-month-grid';
      gridSub.textContent = toBn(ctxDate.y);

      var arr = (ctxMode === 'EN' || id.indexOf('ad') === 0 || id.indexOf('ar') === 0 || id.indexOf('af') === 0 || id.indexOf('dc') === 0)
        ? enMFull
        : (ctxMode === 'BN' ? bnM : hjM);

      arr.forEach(function (n, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'grid-item' + (idx === ctxDate.m ? ' active' : '');
        btn.textContent = n;
        btn.addEventListener('click', function () { selectGrid(idx, 'm'); });
        gridContent.appendChild(btn);
      });
    }
  }

  function closeGrid() {
    var gridOverlay = $('#gridModalOverlay');
    if (gridOverlay) {
      gridOverlay.hidden = true;
      gridOverlay.setAttribute('aria-hidden', 'true');
    }
    activeGridId = null;
  }

  function selectGrid(val, type) {
    var id = activeGridId;
    closeGrid();
    if (!id) return;
    if (id.indexOf('txt') === 0) manual(val, type);
    else if (id.indexOf('ad') === 0) manAge('dob', type, val);
    else if (id.indexOf('ar') === 0) manAge('ref', type, val);
    else if (id.indexOf('af') === 0) manAge('fref', type, val);
    else if (id.indexOf('dc') === 0) manCalc(type, val);
  }

  /* ==================================================================
   * INSIGHTS & HISTORY MODAL (OFFLINE-READY + OPTIONAL AI)
   * ================================================================== */
  function getLocalDateInsights(dObj) {
    var d = dObj.getDate(), m = dObj.getMonth(), y = dObj.getFullYear();
    var bn = getBn(dObj), hj = getHjWithAdj(dObj), dn = days[dObj.getDay()], s = sea[Math.floor(bn.m / 2)];
    var z = m;
    if (d >= [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22][m]) z = (m + 1) % 12;
    var doy = Math.floor((dObj - new Date(y, 0, 1)) / 86400000) + 1;
    var totalDays = isLeap(y) ? 366 : 365;
    var remDays = totalDays - doy;
    return '<h3>তারিখ পরিক্রমা ও বৈশিষ্ট্য</h3>' +
      '<ul>' +
        '<li><strong>ইংরেজি তারিখ:</strong> ' + toBn(d) + ' ' + enMFull[m] + ', ' + toBn(y) + ' (' + dn + ')</li>' +
        '<li><strong>বাংলা তারিখ:</strong> ' + toBn(bn.d) + ' ' + bnM[bn.m] + ', ' + toBn(bn.y) + ' বঙ্গাব্দ (' + s + ' কাল)</li>' +
        '<li><strong>হিজরি তারিখ:</strong> ' + toBn(hj.d) + ' ' + hjM[hj.m] + ', ' + toBn(hj.y) + ' হিজরি</li>' +
        '<li><strong>রাশিচক্র (পাশ্চাত্য):</strong> ' + zod[z].i + ' ' + zod[z].n + ' রাশি</li>' +
        '<li><strong>বছরের অবস্থান:</strong> এটি বছরের ' + toBn(doy) + 'তম দিন (বছর শেষ হতে আরও ' + toBn(remDays) + ' দিন বাকি, ' + (isLeap(y) ? 'অধিবর্ষ' : 'সাধারণ বর্ষ') + ')।</li>' +
      '</ul>';
  }

  function getLocalAgeInsights() {
    var d = new Date(dob), r = new Date(ref);
    if (d > r) { var t = d; d = r; r = t; }
    var y = r.getFullYear() - d.getFullYear();
    var m = r.getMonth() - d.getMonth();
    var dt = r.getDate() - d.getDate();
    if (dt < 0) { m--; dt += new Date(r.getFullYear(), r.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    var nextBday = new Date(r.getFullYear(), d.getMonth(), d.getDate());
    if (nextBday < new Date(r.getFullYear(), r.getMonth(), r.getDate())) {
      nextBday.setFullYear(r.getFullYear() + 1);
    }
    var daysToBday = Math.round((nextBday - new Date(r.getFullYear(), r.getMonth(), r.getDate())) / 86400000);
    var bn = getBn(d), hj = getHjWithAdj(d), dn = days[d.getDay()], s = sea[Math.floor(bn.m / 2)];
    var z = d.getMonth();
    if (d.getDate() >= [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22][z]) z = (z + 1) % 12;

    return '<h3>আপনার জন্ম ও জীবন পরিক্রমা</h3>' +
      '<ul>' +
        '<li><strong>জন্মবার ও ঋতু:</strong> আপনি <strong>' + dn + '</strong>, বাংলার <strong>' + s + ' কালে</strong> জন্মগ্রহণ করেছেন।</li>' +
        '<li><strong>জন্মদিনের বাংলা ও হিজরি তারিখ:</strong> ' + toBn(bn.d) + ' ' + bnM[bn.m] + ', ' + toBn(bn.y) + ' বঙ্গাব্দ • ' + toBn(hj.d) + ' ' + hjM[hj.m] + ', ' + toBn(hj.y) + ' হিজরি।</li>' +
        '<li><strong>রাশি:</strong> ' + zod[z].i + ' ' + zod[z].n + ' রাশি।</li>' +
        '<li><strong>পরবর্তী জন্মদিন:</strong> ' + (daysToBday === 0 ? 'আজ আপনার জন্মদিন! শুভ জন্মদিন! 🎉' : 'আর মাত্র <strong>' + toBn(daysToBday) + ' দিন</strong> পরে আপনার পরবর্তী জন্মদিন (' + days[nextBday.getDay()] + ')।') + '</li>' +
      '</ul>';
  }

  function getLocalCalcInsights() {
    var checked = $('input[name="dcDir"]:checked');
    var isAfter = !checked || checked.value === 'after';
    var t = new Date(start), fac = isAfter ? 1 : -1;
    t.setFullYear(t.getFullYear() + (dur.y * fac));
    t.setMonth(t.getMonth() + (dur.m * fac));
    t.setDate(t.getDate() + (dur.d * fac));
    var diffDays = Math.round(Math.abs(t - start) / 86400000);
    var weeks = Math.floor(diffDays / 7), remD = diffDays % 7;
    var b = getBn(t), hj = getHjWithAdj(t), dn = days[t.getDay()], s = sea[Math.floor(b.m / 2)];
    return '<h3>সময়ের ব্যবধান বিশ্লেষণ</h3>' +
      '<ul>' +
        '<li><strong>নির্ধারিত তারিখ:</strong> ' + toBn(t.getDate()) + ' ' + enMFull[t.getMonth()] + ', ' + toBn(t.getFullYear()) + ' (' + dn + ')</li>' +
        '<li><strong>বাংলা ও হিজরি:</strong> ' + toBn(b.d) + ' ' + bnM[b.m] + ', ' + toBn(b.y) + ' (' + s + ' কাল) • ' + toBn(hj.d) + ' ' + hjM[hj.m] + ', ' + toBn(hj.y) + ' হিজরি</li>' +
        '<li><strong>মোট দিনের পার্থক্য:</strong> সর্বমোট <strong>' + toBn(diffDays) + ' দিন</strong> (' + toBn(weeks) + ' সপ্তাহ ' + toBn(remD) + ' দিন)।</li>' +
        '<li><strong>মোট ঘণ্টা:</strong> প্রায় ' + toBn(diffDays * 24) + ' ঘণ্টা।</li>' +
      '</ul>';
  }

  function openAIModal(title, htmlContent) {
    var modal = $('#aiModal');
    if (!modal) return;
    $('#aiTitle').innerHTML = '✦ ' + title;
    $('#aiContent').innerHTML = htmlContent;
    modal.hidden = false;
  }

  function closeAIModal(e) {
    var modal = $('#aiModal');
    if (!modal) return;
    if (!e || e.target === modal || (e.target.closest && e.target.closest('.ai-close'))) {
      modal.hidden = true;
    }
  }

  function showAIHoroscope() {
    openAIModal('এই দিনের বিস্তারিত তথ্য', getLocalDateInsights(base));
  }
  function showAILifeInsights() {
    openAIModal('আপনার সম্পর্কে তথ্য', getLocalAgeInsights());
  }
  function showAICalcAnalysis() {
    openAIModal('সময়ের বিশ্লেষণ', getLocalCalcInsights());
  }

  /* ==================================================================
   * EVENT BINDINGS & INITIALIZATION
   * ================================================================== */
  document.addEventListener('click', function (e) {
    var gridTarget = e.target.closest && e.target.closest('[data-grid]');
    if (gridTarget && !e.target.closest('.arr-btn') && !/^INPUT$/i.test(e.target.tagName)) {
      openGrid(gridTarget.getAttribute('data-grid'), gridTarget.getAttribute('data-ref'));
    }
  });

  var gridOverlayEl = $('#gridModalOverlay');
  if (gridOverlayEl) {
    gridOverlayEl.addEventListener('click', function (e) {
      if (e.target === gridOverlayEl || (e.target.closest && e.target.closest('#gridCloseBtn'))) closeGrid();
    });
  }

  var searchInput = $('#toolSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      searchQuery = searchInput.value;
      renderSidebar();
    });
  }

  var backToBijoyBtn = $('#backToBijoyBtn');
  if (backToBijoyBtn) {
    backToBijoyBtn.addEventListener('click', function () {
      openTool('bijoy', true);
    });
  }

  var btnCalResetEl = $('#btnCalReset');
  if (btnCalResetEl) {
    btnCalResetEl.addEventListener('click', resetConverter);
  }

  // Expose handlers used by inline attributes in tool templates
  window.TechHatTools = {
    openTool: openTool,
    setMode: setMode,
    upd: upd,
    editY: editY,
    closeY: closeY,
    setAdj: setAdj,
    resetConverter: resetConverter,
    switchAgeTab: switchAgeTab,
    updAge: updAge,
    edAgeY: edAgeY,
    clAgeY: clAgeY,
    updRev: updRev,
    edRev: edRev,
    clRev: clRev,
    updCalc: updCalc,
    edCalcY: edCalcY,
    clCalcY: clCalcY,
    edDur: edDur,
    clDur: clDur,
    compCalc: compCalc,
    addInvItem: addInvItem,
    calcInv: calcInv,
    resetInv: resetInv,
    printInv: printInv,
    showAIHoroscope: showAIHoroscope,
    showAILifeInsights: showAILifeInsights,
    showAICalcAnalysis: showAICalcAnalysis,
    closeAIModal: closeAIModal
  };

  // Initialize from page's data-active-tool (Astro multi-page) or URL hash (defaulting to 'bijoy')
  var initialTool = (document.body && document.body.getAttribute('data-active-tool')) || 'bijoy';
  var hashMatch = /^#tool-([a-z]+)$/i.exec(location.hash || '');
  if (hashMatch) {
    initialTool = hashMatch[1].toLowerCase();
  }
  openTool(initialTool, false);
})();
