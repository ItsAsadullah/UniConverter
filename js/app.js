/*!
 * TechHat Bangla Converter — UI controller
 */
(function () {
  'use strict';

  var E = window.BijoyEngine;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var BN = '০১২৩৪৫৬৭৮৯';
  function bn(n) { return String(n).replace(/\d/g, function (d) { return BN[d]; }); }
  function esc(s) { return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ------------------------------------------------------------------ storage */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  var settings = Object.assign({
    textDir: 'b2u', fileDir: 'b2u', live: true, previewFont: 'Noto Sans Bengali', fontSize: 18,
    unicodeFont: 'Nirmala UI', bijoyFont: 'SutonnyMJ', customFont: '', detect: 'auto', englishTnr: true, tab: 'text',
    voiceLang: 'bn-BD'
  }, store.get('thbc-settings', {}));
  function saveSettings() { store.set('thbc-settings', settings); }

  /* ------------------------------------------------------------------ fonts */
  var UNICODE_FONTS = [
    ['Nirmala UI', 'Nirmala UI (Windows-এ থাকে)'], ['Kalpurush', 'Kalpurush'], ['SolaimanLipi', 'SolaimanLipi'],
    ['SutonnyOMJ', 'SutonnyOMJ (ইউনিকোড সুতন্নী)'], ['Siyam Rupali', 'Siyam Rupali'], ['Noto Sans Bengali', 'Noto Sans Bengali'],
    ['Noto Serif Bengali', 'Noto Serif Bengali'], ['Hind Siliguri', 'Hind Siliguri'], ['Tiro Bangla', 'Tiro Bangla'],
    ['Anek Bangla', 'Anek Bangla'], ['Baloo Da 2', 'Baloo Da 2'], ['Vrinda', 'Vrinda'], ['BornomalaBN', 'BornomalaBN'],
    ['Nikosh', 'Nikosh'], ['AdorshoLipi', 'AdorshoLipi']
  ];
  var GOOGLE_FONTS = { 'Noto Sans Bengali': 1, 'Noto Serif Bengali': 1, 'Hind Siliguri': 1, 'Tiro Bangla': 1, 'Anek Bangla': 1, 'Baloo Da 2': 1 };
  var BIJOY_FONTS = ['SutonnyMJ', 'SutonnyEMJ', 'TonnyBanglaMJ', 'ChandrabatiMJ', 'KarnaphuliMJ', 'JamunaMJ', 'BhagirathiMJ'];

  var loadedGoogle = { 'Anek Bangla': 1, 'Tiro Bangla': 1 };
  function ensureGoogleFont(name) {
    if (!GOOGLE_FONTS[name] || loadedGoogle[name]) return;
    loadedGoogle[name] = 1;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + name.replace(/ /g, '+') + ':wght@400;600&display=swap';
    document.head.appendChild(l);
  }

  var fontCanvas = null;
  function fontAvailable(name, sample) {
    fontCanvas = fontCanvas || document.createElement('canvas').getContext('2d');
    sample = sample || 'Avwg evsjvq ‡`k ¯^vaxb abcXYZ 123';
    return ['monospace', 'serif', 'sans-serif'].some(function (base) {
      fontCanvas.font = '40px ' + base;
      var w = fontCanvas.measureText(sample).width;
      fontCanvas.font = '40px "' + name + '", ' + base;
      return fontCanvas.measureText(sample).width !== w;
    });
  }

  function fillSelect(sel, list, value, withCustom) {
    sel.innerHTML = '';
    list.forEach(function (f) {
      var name = Array.isArray(f) ? f[0] : f, label = Array.isArray(f) ? f[1] : f;
      var o = document.createElement('option');
      o.value = name; o.textContent = label;
      sel.appendChild(o);
    });
    if (withCustom) {
      var c = document.createElement('option');
      c.value = '__custom__'; c.textContent = 'অন্য ফন্ট… (নাম লিখুন)';
      sel.appendChild(c);
    }
    sel.value = value;
    if (sel.value !== value) sel.value = withCustom ? '__custom__' : (Array.isArray(list[0]) ? list[0][0] : list[0]);
  }

  /* ------------------------------------------------------------------ toast */
  var toastTimer = null;
  function toast(msg, ms) {
    var t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, ms || 2600);
  }

  /* ------------------------------------------------------------------ downloads & clipboard */
  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function legacyCopy(html, text) {
    var holder = document.createElement('div');
    holder.contentEditable = 'true';
    holder.style.cssText = 'position:fixed;left:-9999px;top:0;white-space:pre-wrap';
    if (html) holder.innerHTML = html; else holder.textContent = text;
    document.body.appendChild(holder);
    var range = document.createRange();
    range.selectNodeContents(holder);
    var sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    sel.removeAllRanges(); holder.remove();
    return ok;
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) { return legacyCopy(null, text); }
  }
  async function copyHtml(html, text) {
    try {
      if (!window.ClipboardItem) throw new Error('no ClipboardItem');
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' })
      })]);
      return true;
    } catch (e) { return legacyCopy(html, text); }
  }
  function flashBtn(btn, label) {
    var old = btn.innerHTML;
    btn.classList.add('is-done');
    btn.lastChild.textContent = ' ' + label;
    setTimeout(function () { btn.classList.remove('is-done'); btn.innerHTML = old; }, 1400);
  }

  /* ================================================================== TABS */
  function setTab(name, focus) {
    if (name !== 'text' && typeof stopVoice === 'function') stopVoice();
    settings.tab = name; saveSettings();
    $('.tabs').dataset.active = name;
    $$('.tab').forEach(function (t) {
      var on = t.id === 'tab-' + name;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    $('#panel-text').hidden = name !== 'text';
    $('#panel-file').hidden = name !== 'file';
  }
  $$('.tab').forEach(function (t) {
    t.addEventListener('click', function () { setTab(t.id.replace('tab-', '')); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setTab(settings.tab === 'text' ? 'file' : 'text', true);
      }
    });
  });

  /* ================================================================== TEXT CONVERTER */
  var input = $('#inputText'), output = $('#outputText');
  var smart = null;      // smart-paste result {input, output}
  var lastSegs = null;   // last U→B segments (for rich copy)
  var pending = 0;

  function textDir() { return $('input[name="textDir"]:checked').value; }

  function countText(s) {
    var words = (s.match(/\S+/g) || []).length;
    return bn(s.length) + ' অক্ষর • ' + bn(words) + ' শব্দ';
  }

  function applyDirUI() {
    var b2u = textDir() === 'b2u';
    var seg = $('#textDirB2U').closest('.seg');
    if (seg) seg.dataset.dir = b2u ? 'b2u' : 'u2b';
    $('#inputLabel').innerHTML = b2u ? 'বিজয় টেক্সট <small>(SutonnyMJ)</small>' : 'ইউনিকোড টেক্সট';
    $('#outputLabel').innerHTML = b2u ? 'ইউনিকোড আউটপুট' : 'বিজয় আউটপুট <small>(SutonnyMJ)</small>';
    input.placeholder = b2u
      ? 'বিজয় টেক্সট লিখুন বা পেস্ট করুন… (Word থেকে পেস্ট করলে ইংরেজি অংশ অক্ষত থাকবে)'
      : 'ইউনিকোড বাংলা লিখুন বা পেস্ট করুন… (ইংরেজি অংশ আলাদা থাকবে)';
    input.classList.toggle('is-bijoy', b2u); input.classList.toggle('is-unicode', !b2u);
    output.classList.toggle('is-bijoy', !b2u); output.classList.toggle('is-unicode', b2u);
    var textEnField = $('#textEnglishFontField');
    if (textEnField) textEnField.hidden = b2u;
    settings.textDir = textDir(); saveSettings();
  }

  function convertNow() {
    var src = input.value, dir = textDir();
    var t0 = performance.now(), out;
    if (dir === 'b2u') {
      lastSegs = null;
      if (smart && smart.input === src) out = smart.output;
      else { smart = null; out = E.bijoyToUnicode(src); }
    } else {
      smart = null;
      lastSegs = E.unicodeToBijoySegments(src);
      out = lastSegs.map(function (s) { return s.text; }).join('');
    }
    var ms = performance.now() - t0;
    output.value = out;
    $('#smartHint').hidden = !smart;
    $('#inputCount').textContent = countText(src);
    $('#outputCount').textContent = countText(out);
    $('#timing').textContent = src ? (ms < 1 ? '১ মি.সে.-এর কম' : bn(Math.round(ms)) + ' মি.সে.') : '';
    store.set('thbc-draft', src.length <= 150000 ? src : '');
  }
  function scheduleConvert() {
    if (!settings.live) { $('#inputCount').textContent = countText(input.value); return; }
    clearTimeout(pending);
    if (input.value.length < 60000) { pending = 0; convertNow(); }
    else pending = setTimeout(convertNow, 280);
  }
  function flashOutput() {
    output.classList.remove('flash'); void output.offsetWidth; output.classList.add('flash');
  }

  input.addEventListener('input', function () { smart = null; scheduleConvert(); });

  // direction auto-detect after a paste
  function autoDirection() {
    var d = E.detect(input.value), dir = textDir();
    if (dir === 'b2u' && d === 'unicode') {
      $('#textDirU2B').checked = true; applyDirUI(); toast('ইউনিকোড লেখা শনাক্ত হয়েছে — “ইউনিকোড → বিজয়” করা হলো');
    } else if (dir === 'u2b' && d === 'bijoy') {
      $('#textDirB2U').checked = true; applyDirUI(); toast('বিজয় লেখা শনাক্ত হয়েছে — “বিজয় → ইউনিকোড” করা হলো');
    }
  }

  /* --- Smart paste: Word/Docs HTML keeps font info → convert only Bijoy-font parts */
  var BLOCK = /^(P|DIV|LI|TR|H[1-6]|BLOCKQUOTE|PRE|TABLE|UL|OL|SECTION|ARTICLE)$/;
  function parseFontSegments(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var defaultFont = '';
    var css = Array.prototype.map.call(doc.querySelectorAll('style'), function (s) { return s.textContent; }).join('\n');
    var m = /(?:p|\.)MsoNormal[^{]*\{[^}]*?font-family:\s*["']?([^"';,}]+)/i.exec(css);
    if (m) defaultFont = m[1].trim();
    var segs = [], anyBijoy = false, anyOther = false;
    function fontOf(el) {
      for (var n = el; n && n.nodeType === 1; n = n.parentNode) {
        var ff = n.style && n.style.fontFamily;
        if (ff) return ff.split(',')[0].replace(/["']/g, '').trim();
        var face = n.getAttribute && n.getAttribute('face');
        if (face) return face.split(',')[0].trim();
      }
      return defaultFont;
    }
    function push(text, bijoy) {
      if (!text) return;
      var last = segs[segs.length - 1];
      if (last && last.bijoy === bijoy) last.text += text; else segs.push({ text: text, bijoy: bijoy });
    }
    function walk(node) {
      for (var c = node.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) {
          var t = c.nodeValue.replace(/[\r\n\t ]+/g, ' ').replace(/\u00A0/g, ' ');
          if (!t) continue;
          var fn = fontOf(c.parentNode);
          var isB = (E.isBijoyFont(fn) || (/^symbol$/i.test(fn) && /[\u00B4\uF0B4\u00B8\uF0B8]/.test(t))) && !E.hasBengali(t);
          if (/\S/.test(t)) { if (isB) anyBijoy = true; else anyOther = true; }
          push(t, isB);
        } else if (c.nodeType === 1) {
          if (/^(STYLE|SCRIPT|HEAD|TITLE|META)$/.test(c.tagName)) continue;
          if (c.tagName === 'BR') { push('\n', false); continue; }
          walk(c);
          if (BLOCK.test(c.tagName)) push('\n', false);
          else if (c.tagName === 'TD' || c.tagName === 'TH') push('\t', false);
        }
      }
    }
    walk(doc.body || doc.documentElement);
    if (segs.length) segs[segs.length - 1].text = segs[segs.length - 1].text.replace(/\s+$/, '');
    return anyBijoy && anyOther ? segs : null;
  }

  function insertSmart(segs) {
    var start = input.selectionStart, end = input.selectionEnd, val = input.value;
    var before = val.slice(0, start), after = val.slice(end);
    var pasted = segs.map(function (s) { return s.text; }).join('');
    var converted = segs.map(function (s) { return s.bijoy ? E.bijoyToUnicode(s.text) : s.text; }).join('');
    input.value = before + pasted + after;
    input.selectionStart = input.selectionEnd = before.length + pasted.length;
    smart = { input: input.value, output: E.bijoyToUnicode(before) + converted + E.bijoyToUnicode(after) };
    convertNow(); flashOutput();
    toast('স্মার্ট পেস্ট: শুধু বিজয় ফন্টের অংশ রূপান্তর হয়েছে, ইংরেজি অক্ষত');
  }

  input.addEventListener('paste', function (e) {
    var cd = e.clipboardData;
    var html = cd && cd.getData('text/html');
    if (html && textDir() === 'b2u') {
      var segs = parseFontSegments(html);
      if (segs) { e.preventDefault(); insertSmart(segs); return; }
    }
    setTimeout(function () { autoDirection(); convertNow(); flashOutput(); }, 0);
  });

  $('#pasteBtn').addEventListener('click', async function () {
    try {
      if (navigator.clipboard.read && textDir() === 'b2u') {
        var items = await navigator.clipboard.read();
        for (var i = 0; i < items.length; i++) {
          if (items[i].types.indexOf('text/html') !== -1) {
            var html = await (await items[i].getType('text/html')).text();
            var segs = parseFontSegments(html);
            if (segs) { input.focus(); input.select(); insertSmart(segs); return; }
          }
        }
      }
      var text = await navigator.clipboard.readText();
      input.value = text; smart = null;
      autoDirection(); convertNow(); flashOutput();
    } catch (err) {
      input.focus();
      toast('ব্রাউজার ক্লিপবোর্ড পড়তে দেয়নি — Ctrl+V চাপুন');
    }
  });

  $$('input[name="textDir"]').forEach(function (r) {
    r.addEventListener('change', function () {
      commitVoiceInterim();
      smart = null; applyDirUI(); applyPreviewFont(); convertNow();
    });
  });

  $('#swapBtn').addEventListener('click', swap);
  function swap() {
    commitVoiceInterim();
    var out = output.value;
    (textDir() === 'b2u' ? $('#textDirU2B') : $('#textDirB2U')).checked = true;
    smart = null;
    applyDirUI(); applyPreviewFont();
    input.value = out;
    voiceAnchorStart = input.value.length;
    voiceInterimLen = 0;
    convertNow(); flashOutput();
  }

  $('#clearBtn').addEventListener('click', function () {
    input.value = ''; smart = null;
    voiceAnchorStart = 0; voiceInterimLen = 0;
    convertNow(); input.focus();
  });

  var copyInputBtn = $('#copyInputBtn');
  if (copyInputBtn) {
    copyInputBtn.addEventListener('click', async function () {
      if (!input.value) return toast('কপি করার মতো কিছু নেই');
      if (await copyText(input.value)) flashBtn(this, 'কপি হয়েছে');
    });
  }

  /* --- Voice Typing (Web Speech API) */
  var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  var voiceBtn = $('#voiceBtn');
  var voiceBtnLabel = $('#voiceBtnLabel');
  var voiceGroup = $('#voiceGroup');
  var voiceLangSel = $('#voiceLang');
  var voiceBar = $('#voiceBar');
  var voiceStatusText = $('#voiceStatusText');
  var voiceBackspaceBtn = $('#voiceBackspaceBtn');

  var rec = null;
  var wantListening = false;
  var isListening = false;
  var voiceAnchorStart = 0;
  var voiceInterimLen = 0;
  var sessionResultOffset = 0;
  var isMobileSpeech = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

  if (voiceLangSel) {
    voiceLangSel.value = settings.voiceLang || 'bn-BD';
    if (voiceLangSel.value !== settings.voiceLang) voiceLangSel.value = 'bn-BD';
    voiceLangSel.addEventListener('change', function () {
      settings.voiceLang = voiceLangSel.value;
      saveSettings();
      if (wantListening && rec) {
        try { rec.stop(); } catch (e) {}
      }
    });
  }

  function applyVoiceCommands(str, lang) {
    if (!str) return '';
    var s = str;
    if (/^bn/i.test(lang || 'bn-BD')) {
      s = s
        .replace(/\s*(?:পূর্ণচ্ছেদ|দাঁড়ি চিহ্ন|দাড়ি চিহ্ন|দাঁড়ি চিহ্ন|দাড়ি চিহ্ন)/g, '। ')
        .replace(/\s*(?:প্রশ্নবোধক চিহ্ন|প্রশ্ন চিহ্ন)/g, '? ')
        .replace(/\s*(?:বিস্ময়সূচক চিহ্ন|আশ্চর্যবোধক চিহ্ন)/g, '! ')
        .replace(/\s*(?:কমা চিহ্ন)/g, ', ')
        .replace(/\s*(?:নতুন প্যারাগ্রাফ|নতুন অনুচ্ছেদ)\s*/g, '\n\n')
        .replace(/\s*(?:নতুন লাইন|নিউ লাইন)\s*/g, '\n');
    } else {
      s = s
        .replace(/\s*\b(?:full stop|period)\b/gi, '. ')
        .replace(/\s*\bquestion mark\b/gi, '? ')
        .replace(/\s*\bexclamation (?:mark|point)\b/gi, '! ')
        .replace(/\s*\bcomma\b/gi, ', ')
        .replace(/\s*\bnew paragraph\b\s*/gi, '\n\n')
        .replace(/\s*\bnew line\b\s*/gi, '\n');
    }
    return s;
  }

  function formatVoiceForDir(text, prevChar) {
    if (!text) return '';
    var s = text;
    if (textDir() === 'b2u') {
      s = E.unicodeToBijoy(s);
    }
    var trimmed = s.replace(/^[ \t]+/, '');
    if (!trimmed) return '';
    var startsWithPunct = /^[।.,?!:;)\]}'"”’\n]/.test(trimmed);
    var needsSpace = prevChar && !/[\s\n([{"'“‘]/.test(prevChar) && !startsWithPunct;
    return (needsSpace ? ' ' : '') + trimmed;
  }

  function setVoiceUI(active, statusMsg) {
    if (!voiceBtn) return;
    voiceBtn.classList.toggle('is-listening', active);
    voiceBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    if (voiceGroup) voiceGroup.classList.toggle('is-listening', active);
    if (voiceBtnLabel) voiceBtnLabel.textContent = active ? 'থামান' : 'ভয়েস টাইপ';
    if (voiceBar) voiceBar.hidden = !active;
    if (voiceStatusText && statusMsg) voiceStatusText.textContent = statusMsg;
    input.classList.toggle('is-listening', active);
  }

  function commitVoiceInterim() {
    if (voiceInterimLen > 0) {
      voiceAnchorStart += voiceInterimLen;
      voiceInterimLen = 0;
    }
  }

  function syncVoiceCursor() {
    if (!wantListening) return;
    commitVoiceInterim();
    voiceAnchorStart = typeof input.selectionStart === 'number' ? input.selectionStart : input.value.length;
  }

  input.addEventListener('click', syncVoiceCursor);
  input.addEventListener('keyup', function (e) {
    if (wantListening && /^Arrow|Home|End|Page|Backspace|Delete/.test(e.key)) syncVoiceCursor();
  });
  input.addEventListener('input', function () {
    if (wantListening) {
      voiceInterimLen = 0;
      voiceAnchorStart = typeof input.selectionStart === 'number' ? input.selectionStart : input.value.length;
    }
  });

  function initRecognition() {
    if (rec || !SpeechRec) return rec;
    rec = new SpeechRec();
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = function () {
      isListening = true;
      sessionResultOffset = 0;
      var langLabel = voiceLangSel ? voiceLangSel.options[voiceLangSel.selectedIndex].text : 'বাংলা';
      setVoiceUI(true, 'শুনছি (' + langLabel + ')… কথা বলুন');
    };

    rec.onresult = function (e) {
      if (!wantListening) return;
      var finalRaw = '', interimRaw = '';
      for (var i = sessionResultOffset; i < e.results.length; i++) {
        var r = e.results[i];
        var t = (r[0] && r[0].transcript) || '';
        if (r.isFinal) {
          finalRaw += t;
          sessionResultOffset = i + 1;
        } else {
          interimRaw += t;
        }
      }

      var lang = settings.voiceLang || 'bn-BD';
      if (finalRaw) {
        var prevChar = voiceAnchorStart > 0 ? input.value.charAt(voiceAnchorStart - 1) : '';
        var finalPiece = formatVoiceForDir(applyVoiceCommands(finalRaw, lang), prevChar);
        var before = input.value.slice(0, voiceAnchorStart);
        var after = input.value.slice(voiceAnchorStart + voiceInterimLen);
        if (/^[।.,?!:;]/.test(finalPiece) && /[ \t]$/.test(before)) {
          before = before.replace(/[ \t]+$/, '');
        }
        input.value = before + finalPiece + after;
        voiceAnchorStart = before.length + finalPiece.length;
        voiceInterimLen = 0;
      }

      if (interimRaw) {
        var prevCharI = voiceAnchorStart > 0 ? input.value.charAt(voiceAnchorStart - 1) : '';
        var interimPiece = formatVoiceForDir(applyVoiceCommands(interimRaw, lang), prevCharI);
        var beforeI = input.value.slice(0, voiceAnchorStart);
        var afterI = input.value.slice(voiceAnchorStart + voiceInterimLen);
        input.value = beforeI + interimPiece + afterI;
        voiceInterimLen = interimPiece.length;
        if (voiceStatusText) voiceStatusText.textContent = 'শুনছি: “' + interimRaw.trim() + '”';
      } else {
        if (voiceInterimLen > 0) {
          input.value = input.value.slice(0, voiceAnchorStart) + input.value.slice(voiceAnchorStart + voiceInterimLen);
          voiceInterimLen = 0;
        }
        if (voiceStatusText) {
          var lbl = voiceLangSel ? voiceLangSel.options[voiceLangSel.selectedIndex].text : 'বাংলা';
          voiceStatusText.textContent = 'শুনছি (' + lbl + ')… কথা বলুন';
        }
      }

      var caret = voiceAnchorStart + voiceInterimLen;
      try { input.setSelectionRange(caret, caret); } catch (err) {}
      input.scrollTop = input.scrollHeight;
      smart = null;
      scheduleConvert();
    };

    rec.onerror = function (e) {
      var err = e && e.error;
      if (err === 'no-speech' || err === 'aborted') return;
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        wantListening = false;
        isListening = false;
        commitVoiceInterim();
        setVoiceUI(false);
        toast('মাইক্রোফোন ব্যবহারের অনুমতি দেওয়া হয়নি — ব্রাউজারের অ্যাড্রেস বার থেকে Allow করুন', 4200);
      } else if (err === 'audio-capture') {
        wantListening = false;
        isListening = false;
        commitVoiceInterim();
        setVoiceUI(false);
        toast('কোনো মাইক্রোফোন পাওয়া যায়নি — মাইক্রোফোন সংযোগ পরীক্ষা করুন', 4000);
      } else if (err === 'network') {
        toast('ভয়েস টাইপিংয়ের জন্য ইন্টারনেট সংযোগ প্রয়োজন', 3500);
      }
    };

    rec.onend = function () {
      isListening = false;
      commitVoiceInterim();
      if (wantListening) {
        try {
          rec.lang = settings.voiceLang || 'bn-BD';
          rec.continuous = !isMobileSpeech;
          rec.start();
          return;
        } catch (err) {}
      }
      setVoiceUI(false);
    };

    return rec;
  }

  function startVoice() {
    if (!SpeechRec) {
      toast('আপনার ব্রাউজারে ভয়েস টাইপিং সমর্থিত নয় — Google Chrome বা Microsoft Edge ব্যবহার করুন', 4200);
      return;
    }
    // If input is empty or already Unicode while in B2U mode, switch to U2B so spoken Unicode
    // appears naturally in the input box and converts live to Bijoy in the output box.
    if (textDir() === 'b2u' && (!input.value.trim() || E.detect(input.value) === 'unicode')) {
      $('#textDirU2B').checked = true;
      smart = null;
      applyDirUI();
      applyPreviewFont();
      convertNow();
    }
    initRecognition();
    wantListening = true;
    var selStart = typeof input.selectionStart === 'number' ? input.selectionStart : input.value.length;
    var selEnd = typeof input.selectionEnd === 'number' ? input.selectionEnd : selStart;
    if (document.activeElement !== input && selStart === 0 && selEnd === 0 && input.value.length > 0) {
      selStart = selEnd = input.value.length;
    }
    voiceAnchorStart = selStart;
    voiceInterimLen = selEnd - selStart;
    sessionResultOffset = 0;

    try {
      rec.lang = settings.voiceLang || 'bn-BD';
      rec.continuous = !isMobileSpeech;
      rec.start();
      input.focus();
      try { input.setSelectionRange(selStart, selEnd); } catch (e) {}
    } catch (e) {
      // Already started
    }
  }

  function stopVoice() {
    wantListening = false;
    commitVoiceInterim();
    setVoiceUI(false);
    if (rec && isListening) {
      try { rec.stop(); } catch (e) {}
    }
  }

  function toggleVoice() {
    if (wantListening) stopVoice();
    else startVoice();
  }

  if (voiceBtn) {
    voiceBtn.addEventListener('click', toggleVoice);
  }

  $$('.voice-chip[data-insert]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      commitVoiceInterim();
      var raw = btn.getAttribute('data-insert') || '';
      var ins = textDir() === 'b2u' ? E.unicodeToBijoy(raw) : raw;
      var pos = wantListening ? voiceAnchorStart : (typeof input.selectionStart === 'number' ? input.selectionStart : input.value.length);
      var end = wantListening ? voiceAnchorStart : (typeof input.selectionEnd === 'number' ? input.selectionEnd : pos);
      var before = input.value.slice(0, pos);
      var after = input.value.slice(end);
      if (/^[।.,?!:;]/.test(raw) && /[ \t]$/.test(before)) {
        before = before.replace(/[ \t]+$/, '');
      }
      input.value = before + ins + after;
      var nextPos = before.length + ins.length;
      voiceAnchorStart = nextPos;
      voiceInterimLen = 0;
      input.focus();
      try { input.setSelectionRange(nextPos, nextPos); } catch (e) {}
      smart = null;
      scheduleConvert();
    });
  });

  if (voiceBackspaceBtn) {
    voiceBackspaceBtn.addEventListener('click', function () {
      var pos = wantListening ? voiceAnchorStart : (typeof input.selectionStart === 'number' ? input.selectionStart : input.value.length);
      if (voiceInterimLen > 0) {
        input.value = input.value.slice(0, voiceAnchorStart) + input.value.slice(voiceAnchorStart + voiceInterimLen);
        voiceInterimLen = 0;
      } else {
        var before = input.value.slice(0, pos);
        var after = input.value.slice(pos);
        var trimmed = before.replace(/(\s*\S+\s*|\n)$/, '');
        input.value = trimmed + after;
        voiceAnchorStart = trimmed.length;
      }
      input.focus();
      try { input.setSelectionRange(voiceAnchorStart, voiceAnchorStart); } catch (e) {}
      smart = null;
      scheduleConvert();
    });
  }

  $('#liveToggle').addEventListener('change', function (e) {
    settings.live = e.target.checked; saveSettings();
    $('#convertBtn').hidden = settings.live;
    if (settings.live) convertNow();
  });
  $('#convertBtn').addEventListener('click', function () { convertNow(); flashOutput(); });

  $('#copyBtn').addEventListener('click', async function () {
    if (!output.value) return toast('কপি করার মতো কিছু নেই');
    if (await copyText(output.value)) flashBtn(this, 'কপি হয়েছে');
  });

  $('#copyRichBtn').addEventListener('click', async function () {
    var out = output.value;
    if (!out) return toast('কপি করার মতো কিছু নেই');
    var size = '14pt', html;
    var lines = function (s) { return esc(s).replace(/\t/g, '&#9;').replace(/\n/g, '<br>'); };
    if (textDir() === 'u2b') {
      var segs = lastSegs && lastSegs.length ? lastSegs : [{ text: out, bijoy: true }];
      var enFont = settings.englishTnr !== false ? 'Times New Roman' : settings.previewFont;
      html = segs.map(function (s) {
        var ff = s.symbol ? 'Symbol' : (s.bijoy ? 'SutonnyMJ' : enFont);
        return '<span style="font-family:\'' + ff + '\'">' + lines(s.text) + '</span>';
      }).join('');
    } else {
      html = '<span style="font-family:\'' + settings.previewFont + '\'">' + lines(out) + '</span>';
    }
    html = '<div style="font-size:' + size + '">' + html + '</div>';
    if (await copyHtml(html, out)) {
      flashBtn(this, 'ফন্টসহ কপি হয়েছে');
      toast(textDir() === 'u2b' ? 'Word-এ পেস্ট করুন — বাংলা অংশ SutonnyMJ ফন্টে বসবে' : 'Word-এ পেস্ট করুন — ' + settings.previewFont + ' ফন্টে বসবে');
    }
  });

  $('#downloadTxtBtn').addEventListener('click', function () {
    var out = output.value;
    if (!out) return toast('ডাউনলোড করার মতো কিছু নেই');
    var blob;
    if (textDir() === 'b2u') {
      blob = new Blob(['\uFEFF' + out], { type: 'text/plain;charset=utf-8' });
      downloadBlob(blob, 'converted-unicode.txt');
    } else {
      var u8 = new Uint8Array(out.length);
      for (var i = 0; i < out.length; i++) { var b = E.cp1252Byte(out[i]); u8[i] = b < 0 ? 63 : b; }
      downloadBlob(new Blob([u8], { type: 'text/plain;charset=windows-1252' }), 'converted-bijoy.txt');
    }
  });

  // preview font & size
  var previewSel = $('#previewFont');
  fillSelect(previewSel, UNICODE_FONTS, settings.previewFont, false);
  function applyPreviewFont() {
    settings.previewFont = previewSel.value; saveSettings();
    ensureGoogleFont(settings.previewFont);
    document.documentElement.style.setProperty('--preview-font', '"' + settings.previewFont + '", "Noto Sans Bengali", "Nirmala UI", sans-serif');
    var avail = GOOGLE_FONTS[settings.previewFont] || fontAvailable(settings.previewFont, 'বাংলা লেখা অক্ষর');
    previewSel.title = avail ? '' : 'এই ফন্টটি ডিভাইসে নেই — বিকল্প ফন্টে দেখানো হচ্ছে';
  }
  previewSel.addEventListener('change', applyPreviewFont);

  var sizeIn = $('#fontSize');
  sizeIn.value = settings.fontSize;
  function applySize() {
    settings.fontSize = +sizeIn.value; saveSettings();
    document.documentElement.style.setProperty('--text-size', settings.fontSize + 'px');
    $('#fontSizeOut').textContent = bn(settings.fontSize);
  }
  sizeIn.addEventListener('input', applySize);

  function updateFontStatus() {
    var el = $('#fontStatus');
    if (fontAvailable('SutonnyMJ')) {
      el.className = 'font-status is-ok';
      el.textContent = 'SutonnyMJ ফন্ট সক্রিয় আছে — মোবাইল ও পিসিতে বিজয় লেখা সঠিকভাবে দেখাবে।';
    } else {
      el.className = 'font-status is-warn';
      el.textContent = 'এই ডিভাইসে SutonnyMJ ফন্ট লোড হয়নি, তাই বিজয় লেখা ইংরেজি অক্ষরের মতো দেখাবে — রূপান্তর তবুও সঠিক। Word-এ বসাতে “Word-এর জন্য কপি” ব্যবহার করুন।';
    }
    el.title = el.textContent;
  }

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && settings.tab === 'text') { e.preventDefault(); convertNow(); flashOutput(); }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's') && settings.tab === 'text') { e.preventDefault(); swap(); }
    if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'v' || e.key === 'V' || e.code === 'KeyV') && settings.tab === 'text') { e.preventDefault(); toggleVoice(); }
    if (e.key === 'Escape' && wantListening) { e.preventDefault(); stopVoice(); }
  });

  /* ================================================================== FILE CONVERTER */
  var queue = [], qid = 0;
  var OFFICE_EXT = { docx: 'word', docm: 'word', dotx: 'word', dotm: 'word', xlsx: 'excel', xlsm: 'excel', pptx: 'powerpoint', pptm: 'powerpoint', ppsx: 'powerpoint' };
  var MIME = {
    word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    powerpoint: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    rtf: 'application/rtf', txt: 'text/plain'
  };
  var KIND_LABEL = { word: 'DOC', excel: 'XLS', powerpoint: 'PPT', rtf: 'RTF', txt: 'TXT' };

  function extOf(name) { return (name.split('.').pop() || '').toLowerCase(); }
  function kindOfFile(name) {
    var ext = extOf(name);
    return OFFICE_EXT[ext] || (ext === 'rtf' ? 'rtf' : ext === 'txt' ? 'txt' : null);
  }
  function fileDir() { return $('input[name="fileDir"]:checked').value; }
  function fmtSize(b) {
    if (b < 1024) return bn(b) + ' B';
    if (b < 1048576) return bn((b / 1024).toFixed(1)) + ' KB';
    return bn((b / 1048576).toFixed(1)) + ' MB';
  }

  function chosenFont(sel) {
    if (sel.value === '__custom__') return ($('#customFont').value || '').trim() || (sel.id === 'bijoyFont' ? 'SutonnyMJ' : 'Nirmala UI');
    return sel.value;
  }

  var unicodeSel = $('#unicodeFont'), bijoySel = $('#bijoyFont');
  var enTnrCheck = $('#englishTnrToggle'), textEnTnrCheck = $('#textEnglishTnrToggle');
  fillSelect(unicodeSel, UNICODE_FONTS, settings.unicodeFont, true);
  fillSelect(bijoySel, BIJOY_FONTS, settings.bijoyFont, true);
  $('#customFont').value = settings.customFont || '';
  $('input[name="detect"][value="' + settings.detect + '"]').checked = true;
  if (enTnrCheck) enTnrCheck.checked = settings.englishTnr !== false;
  if (textEnTnrCheck) textEnTnrCheck.checked = settings.englishTnr !== false;

  function applyFileDirUI() {
    var b2u = fileDir() === 'b2u';
    var seg = $('#fileDirB2U').closest('.seg');
    if (seg) seg.dataset.dir = b2u ? 'b2u' : 'u2b';
    $('#unicodeFontField').hidden = !b2u;
    $('#bijoyFontField').hidden = b2u;
    $('#detectField').hidden = !b2u;
    var enField = $('#englishFontField');
    if (enField) enField.hidden = b2u;
    var activeSel = b2u ? unicodeSel : bijoySel;
    $('#customFontField').hidden = activeSel.value !== '__custom__';
    settings.fileDir = fileDir(); saveSettings();
  }
  function settingsChanged(e) {
    settings.unicodeFont = unicodeSel.value; settings.bijoyFont = bijoySel.value;
    settings.customFont = $('#customFont').value;
    settings.detect = $('input[name="detect"]:checked').value;
    if (e && e.target === textEnTnrCheck && enTnrCheck) enTnrCheck.checked = textEnTnrCheck.checked;
    else if (e && e.target === enTnrCheck && textEnTnrCheck) textEnTnrCheck.checked = enTnrCheck.checked;
    if (enTnrCheck) settings.englishTnr = enTnrCheck.checked;
    saveSettings();
    applyFileDirUI();
    queue.forEach(function (it) {
      if (it.status === 'done') { it.status = 'ready'; it.msg = 'সেটিং বদলেছে — আবার রূপান্তর করুন'; it.blob = null; renderItem(it); }
    });
    updateFileActions();
  }
  [unicodeSel, bijoySel].forEach(function (s) { s.addEventListener('change', settingsChanged); });
  $('#customFont').addEventListener('change', settingsChanged);
  if (enTnrCheck) enTnrCheck.addEventListener('change', settingsChanged);
  if (textEnTnrCheck) textEnTnrCheck.addEventListener('change', settingsChanged);
  $$('input[name="detect"], input[name="fileDir"]').forEach(function (r) { r.addEventListener('change', settingsChanged); });

  function addFiles(list) {
    var added = 0, legacy = 0, bad = 0;
    Array.prototype.forEach.call(list, function (f) {
      var kind = kindOfFile(f.name), ext = extOf(f.name);
      if (!kind) { if (['doc', 'xls', 'ppt'].indexOf(ext) !== -1) legacy++; else bad++; return; }
      queue.push({ id: ++qid, file: f, kind: kind, status: 'ready', progress: 0, msg: '', blob: null, outName: '' });
      added++;
    });
    if (legacy) toast('পুরোনো .doc/.xls/.ppt সরাসরি সমর্থিত নয় — Office-এ খুলে .docx/.xlsx/.pptx হিসেবে সেভ করুন', 5000);
    else if (bad) toast(bn(bad) + 'টি ফাইলের ফরম্যাট সমর্থিত নয়');
    renderQueue();
    if (added && !legacy && !bad) toast(bn(added) + 'টি ফাইল যোগ হয়েছে');
  }

  var ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  var ICON_DL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>';

  function renderItem(it) {
    var li = document.getElementById('q' + it.id);
    if (!li) {
      li = document.createElement('li');
      li.className = 'qitem'; li.id = 'q' + it.id;
      li.innerHTML =
        '<span class="qitem__type" data-kind="' + it.kind + '">' + KIND_LABEL[it.kind] + '</span>' +
        '<div class="qitem__main"><div class="qitem__name"></div><div class="qitem__meta"></div><div class="qitem__bar" hidden><i></i></div></div>' +
        '<div class="qitem__actions"></div>';
      li.querySelector('.qitem__name').textContent = it.file.name;
      li.querySelector('.qitem__name').title = it.file.name;
      $('#queue').appendChild(li);
    }
    var meta = li.querySelector('.qitem__meta'), bar = li.querySelector('.qitem__bar'), actions = li.querySelector('.qitem__actions');
    meta.className = 'qitem__meta' + (it.status === 'done' ? ' is-ok' : it.status === 'error' ? ' is-err' : '');
    var base = fmtSize(it.file.size);
    meta.textContent = it.status === 'working' ? base + ' • রূপান্তর হচ্ছে… ' + bn(Math.round(it.progress * 100)) + '%'
      : base + (it.msg ? ' • ' + it.msg : ' • প্রস্তুত');
    bar.hidden = it.status !== 'working';
    bar.firstChild.style.width = Math.round(it.progress * 100) + '%';
    actions.innerHTML = '';
    if (it.status === 'done' && it.blob) {
      var dl = document.createElement('button');
      dl.type = 'button'; dl.className = 'chip-btn chip-btn--accent';
      dl.innerHTML = ICON_DL + ' ডাউনলোড';
      dl.addEventListener('click', function () { downloadBlob(it.blob, it.outName); });
      actions.appendChild(dl);
    }
    if (it.status !== 'working') {
      var rm = document.createElement('button');
      rm.type = 'button'; rm.className = 'qitem__remove'; rm.title = 'তালিকা থেকে সরান'; rm.setAttribute('aria-label', 'সরান');
      rm.innerHTML = ICON_X;
      rm.addEventListener('click', function () {
        queue = queue.filter(function (q) { return q !== it; });
        li.remove(); updateFileActions();
      });
      actions.appendChild(rm);
    }
  }
  function renderQueue() { queue.forEach(renderItem); updateFileActions(); }
  function updateFileActions() {
    var busy = queue.some(function (q) { return q.status === 'working'; });
    var done = queue.filter(function (q) { return q.status === 'done' && q.blob; });
    $('#convertFilesBtn').disabled = busy || !queue.length;
    $('#zipAllBtn').hidden = done.length < 2;
    $('#clearQueueBtn').hidden = !queue.length || busy;
  }

  function outName(name, dir) {
    var dot = name.lastIndexOf('.');
    return name.slice(0, dot) + (dir === 'b2u' ? '-unicode' : '-bijoy') + name.slice(dot);
  }
  function errorText(e) {
    var m = String(e && e.message || e);
    if (/Corrupted zip|End of data|zip/i.test(m)) return 'ফাইলটি নষ্ট বা পাসওয়ার্ড-সুরক্ষিত';
    if (m === 'NOT_RTF') return 'সঠিক RTF ফাইল নয়';
    return 'রূপান্তর করা যায়নি (' + m.slice(0, 60) + ')';
  }

  async function convertItem(it) {
    var dir = fileDir();
    var opts = {
      direction: dir,
      unicodeFont: chosenFont(unicodeSel),
      bijoyFont: chosenFont(bijoySel),
      englishFont: settings.englishTnr !== false ? 'Times New Roman' : '',
      detect: $('input[name="detect"]:checked').value,
      outputType: 'uint8array',
      onProgress: function (p) { it.progress = Math.max(it.progress, p * 0.95); renderItem(it); }
    };
    it.status = 'working'; it.progress = 0.02; it.msg = ''; renderItem(it); updateFileActions();
    try {
      var buf = await it.file.arrayBuffer();
      var res;
      if (it.kind === 'rtf') res = window.TextFormats.convertRtf(new Uint8Array(buf), opts);
      else if (it.kind === 'txt') res = window.TextFormats.convertTxt(new Uint8Array(buf), opts);
      else res = await window.OfficeConverter.convertOffice(buf, it.file.name, opts);
      it.blob = new Blob([res.data], { type: MIME[it.kind] });
      it.outName = outName(it.file.name, dir);
      it.status = 'done'; it.progress = 1;
      var n = res.stats.runs;
      it.msg = n ? '✓ ' + bn(n) + 'টি লেখা-অংশ রূপান্তরিত' + (res.usedAllText ? ' (বিজয় ফন্ট পাওয়া যায়নি, লেখা দেখে রূপান্তর)' : '')
        : 'রূপান্তরযোগ্য কোনো ' + (dir === 'b2u' ? 'বিজয়' : 'ইউনিকোড বাংলা') + ' লেখা পাওয়া যায়নি';
    } catch (e) {
      console.error(e);
      it.status = 'error'; it.msg = errorText(e); it.blob = null;
    }
    renderItem(it); updateFileActions();
  }

  $('#convertFilesBtn').addEventListener('click', async function () {
    var todo = queue.filter(function (q) { return q.status !== 'working'; });
    if (!todo.length) return;
    for (var i = 0; i < todo.length; i++) await convertItem(todo[i]);
    var done = todo.filter(function (q) { return q.status === 'done' && q.blob; });
    if (done.length === 1 && todo.length === 1) downloadBlob(done[0].blob, done[0].outName);
    toast(bn(done.length) + '/' + bn(todo.length) + 'টি ফাইল রূপান্তর সম্পন্ন');
  });

  $('#zipAllBtn').addEventListener('click', async function () {
    var zip = new window.JSZip();
    var used = {};
    queue.forEach(function (q) {
      if (q.status !== 'done' || !q.blob) return;
      var name = q.outName, k = 2;
      while (used[name]) name = q.outName.replace(/(\.[^.]+)$/, ' (' + (k++) + ')$1');
      used[name] = 1;
      zip.file(name, q.blob);
    });
    var blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
    downloadBlob(blob, 'converted-files.zip');
  });

  $('#clearQueueBtn').addEventListener('click', function () {
    queue = queue.filter(function (q) { return q.status === 'working'; });
    $('#queue').innerHTML = '';
    renderQueue();
  });

  var fileInput = $('#fileInput'), drop = $('#dropZone');
  fileInput.addEventListener('change', function () { addFiles(fileInput.files); fileInput.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
  });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });
  // dropping a file anywhere on the page opens the file tab
  window.addEventListener('dragover', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') !== -1) e.preventDefault(); });
  window.addEventListener('drop', function (e) {
    if (e.target.closest && e.target.closest('#dropZone')) return;
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      e.preventDefault(); setTab('file'); addFiles(e.dataTransfer.files);
    }
  });

  /* ================================================================== THEME (Dual Theme: Light / Dark) */
  var metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  var metaThemeColor = document.querySelector('meta[name="theme-color"]');
  var mqDark = window.matchMedia('(prefers-color-scheme: dark)');

  function getCurrentTheme() {
    var stored = null;
    try { stored = localStorage.getItem('thbc-theme') || localStorage.getItem('color-scheme'); } catch (e) {}
    if (stored === 'dark' || stored === 'light') return stored;
    var currentAttr = document.documentElement.getAttribute('data-theme');
    if (currentAttr === 'dark' || currentAttr === 'light') return currentAttr;
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
      try {
        localStorage.setItem('thbc-theme', theme);
      } catch (e) {}
    }
  }

  var themeToggleBtn = $('#themeToggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      var current = getCurrentTheme();
      var next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
      toast(next === 'dark' ? 'ডার্ক থিম চালু হয়েছে' : 'লাইট থিম চালু হয়েছে', 1800);
    });
  }

  try {
    mqDark.addEventListener('change', function (e) {
      var saved = null;
      try { saved = localStorage.getItem('thbc-theme'); } catch (err) {}
      if (!saved) applyTheme(e.matches ? 'dark' : 'light', false);
    });
  } catch (e) {}

  applyTheme(getCurrentTheme(), false);

  /* ================================================================== PWA */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline cache unavailable */ });
  }

  var installEvt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); installEvt = e; $('#installBtn').hidden = false;
  });
  $('#installBtn').addEventListener('click', async function () {
    if (!installEvt) return;
    installEvt.prompt();
    await installEvt.userChoice;
    installEvt = null; $('#installBtn').hidden = true;
  });
  window.addEventListener('appinstalled', function () { $('#installBtn').hidden = true; toast('অ্যাপ ইনস্টল হয়েছে!'); });

  // installed app: "Open with…" a .docx/.rtf/… file (File Handling API)
  if ('launchQueue' in window) {
    window.launchQueue.setConsumer(async function (params) {
      if (!params.files || !params.files.length) return;
      var files = await Promise.all(params.files.map(function (h) { return h.getFile(); }));
      setTab('file'); addFiles(files);
    });
  }

  /* ================================================================== init */
  $('#year').textContent = bn(new Date().getFullYear());
  (settings.textDir === 'u2b' ? $('#textDirU2B') : $('#textDirB2U')).checked = true;
  (settings.fileDir === 'u2b' ? $('#fileDirU2B') : $('#fileDirB2U')).checked = true;
  $('#liveToggle').checked = settings.live;
  $('#convertBtn').hidden = settings.live;
  applyDirUI(); applyPreviewFont(); applySize(); applyFileDirUI();
  setTab(settings.tab === 'file' ? 'file' : 'text');
  input.value = store.get('thbc-draft', '') || '';
  convertNow();
  updateFontStatus();
  if (document.fonts) {
    if (document.fonts.load) {
      document.fonts.load('18px "SutonnyMJ"', 'Avwg evsjv').then(updateFontStatus, updateFontStatus);
    }
    if (document.fonts.ready) document.fonts.ready.then(updateFontStatus);
  }
})();
