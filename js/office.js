/*!
 * TechHat Office converter — DOCX/DOCM/DOTX/DOTM, XLSX, PPTX
 * ------------------------------------------------------------
 * Works on the OOXML package directly (JSZip + DOM), so every bit of
 * formatting, images, tables, headers/footers, footnotes, comments,
 * text boxes, charts and SmartArt stays untouched — only Bangla text runs
 * and their fonts change.
 *
 * Correctness details handled here that simple converters miss:
 *  • Font detection follows the real inheritance chain
 *    (docDefaults → paragraph style → character style → direct, theme fonts).
 *  • Words split across runs (spell-check / formatting splits) are converted
 *    together when needed, so pre-base kars and reph never break.
 *  • Bangla Unicode is a *complex script* in Office: Word renders it with
 *    w:szCs / w:bCs / w:iCs, PowerPoint with a:cs. Those are synchronised,
 *    so converted text keeps its size, bold and italic.
 *  • Unicode → Bijoy splits mixed runs, so English stays in its own font.
 *  • New XML children are inserted in schema order (Office is strict).
 */
(function (root) {
  'use strict';

  var NS = {
    w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
    s: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
    xml: 'http://www.w3.org/XML/1998/namespace'
  };

  var W_RPR_ORDER = ['rStyle', 'rFonts', 'b', 'bCs', 'i', 'iCs', 'caps', 'smallCaps', 'strike', 'dstrike', 'outline',
    'shadow', 'emboss', 'imprint', 'noProof', 'snapToGrid', 'vanish', 'webHidden', 'color', 'spacing', 'w', 'kern',
    'position', 'sz', 'szCs', 'highlight', 'u', 'effect', 'bdr', 'shd', 'fitText', 'vertAlign', 'rtl', 'cs', 'em',
    'lang', 'eastAsianLayout', 'specVanish', 'oMath'];
  var A_RPR_ORDER = ['ln', 'noFill', 'solidFill', 'gradFill', 'blipFill', 'pattFill', 'grpFill', 'effectLst', 'effectDag',
    'highlight', 'uLnTx', 'uLn', 'uFillTx', 'uFill', 'latin', 'ea', 'cs', 'sym', 'hlinkClick', 'hlinkMouseOver', 'rtl', 'extLst'];
  var S_RPR_ORDER = ['rFont', 'charset', 'family', 'b', 'i', 'strike', 'outline', 'shadow', 'condense', 'extend', 'color',
    'sz', 'u', 'vertAlign', 'scheme'];
  var S_FONT_ORDER = ['b', 'i', 'strike', 'condense', 'extend', 'outline', 'shadow', 'u', 'vertAlign', 'sz', 'color',
    'name', 'family', 'charset', 'scheme'];

  /* ------------------------------------------------------------------ DOM helpers (xmldom-compatible) */
  function isEl(n, ns, name) { return n && n.nodeType === 1 && n.namespaceURI === ns && (!name || n.localName === name); }
  function kid(el, ns, name) {
    if (!el) return null;
    for (var c = el.firstChild; c; c = c.nextSibling) if (isEl(c, ns, name)) return c;
    return null;
  }
  function kids(el, ns, name) {
    var out = [];
    if (!el) return out;
    for (var c = el.firstChild; c; c = c.nextSibling) if (isEl(c, ns, name)) out.push(c);
    return out;
  }
  function all(doc, ns, name) {
    var list = doc.getElementsByTagNameNS(ns, name), out = [];
    for (var i = 0; i < list.length; i++) out.push(list[i]);
    return out;
  }
  function prefixFor(doc, ns, fallback) {
    var p = doc.documentElement.lookupPrefix ? doc.documentElement.lookupPrefix(ns) : null;
    return p === null || p === undefined ? fallback : p;
  }
  function qn(prefix, name) { return prefix ? prefix + ':' + name : name; }
  /** Get/create child `name`, inserted according to schema `order`. */
  function ensureKid(parent, ns, prefix, name, order) {
    var ex = kid(parent, ns, name);
    if (ex) return ex;
    var el = parent.ownerDocument.createElementNS(ns, qn(prefix, name));
    var idx = order.indexOf(name), ref = null;
    for (var c = parent.firstChild; c; c = c.nextSibling) {
      if (c.nodeType !== 1) continue;
      var ci = order.indexOf(c.localName);
      if (ci > idx) { ref = c; break; }
    }
    parent.insertBefore(el, ref);
    return el;
  }
  function firstElementChild(el) {
    for (var c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 1) return c;
    return null;
  }
  function removeKid(parent, ns, name) { var k = kid(parent, ns, name); if (k) parent.removeChild(k); }
  function textOf(el) { return el.textContent || ''; }
  function setText(el, text, preserve) {
    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(el.ownerDocument.createTextNode(text));
    if (preserve !== false && /^\s|\s$|\s\s|\t/.test(text)) el.setAttributeNS(NS.xml, 'xml:space', 'preserve');
  }
  function wAttr(el, name) { return el ? (el.getAttributeNS(NS.w, name) || el.getAttribute('w:' + name) || '') : ''; }

  /* ------------------------------------------------------------------ cross-run conversion */
  /**
   * Convert text that is spread over several XML text nodes (`pieces`).
   * Whitespace stays in place. A word spanning pieces is converted per piece
   * when that gives the same result (keeps mid-word formatting), otherwise
   * as a whole inside the piece where it starts.
   */
  function convertPieces(pieces, fn, preserve) {
    if (!pieces.length) return;
    if (pieces.length === 1) { setText(pieces[0].el, fn(pieces[0].text), preserve); return; }
    var out = pieces.map(function () { return ''; });
    var owner = [];
    pieces.forEach(function (p, i) { for (var k = 0; k < p.text.length; k++) owner.push(i); });
    var full = pieces.map(function (p) { return p.text; }).join('');
    var re = /\s+|[^\s]+/g, m;
    while ((m = re.exec(full))) {
      var tok = m[0], st = m.index, k;
      if (/^\s/.test(tok)) { for (k = 0; k < tok.length; k++) out[owner[st + k]] += tok[k]; continue; }
      var a = owner[st], b = owner[st + tok.length - 1];
      if (a === b) { out[a] += fn(tok); continue; }
      var parts = [], cur = owner[st], buf = '';
      for (k = 0; k < tok.length; k++) {
        var o = owner[st + k];
        if (o !== cur) { parts.push([cur, buf]); cur = o; buf = ''; }
        buf += tok[k];
      }
      parts.push([cur, buf]);
      var joint = fn(tok);
      var sep = parts.map(function (x) { return fn(x[1]); });
      if (sep.join('') === joint) parts.forEach(function (x, i) { out[x[0]] += sep[i]; });
      else out[a] += joint;
    }
    pieces.forEach(function (p, i) { setText(p.el, out[i], preserve); });
  }

  /* ------------------------------------------------------------------ theme fonts */
  function readTheme(doc) {
    var t = {};
    if (!doc) return t;
    var major = all(doc, NS.a, 'majorFont')[0], minor = all(doc, NS.a, 'minorFont')[0];
    function face(parent, name) { var e = kid(parent, NS.a, name); return e ? e.getAttribute('typeface') : ''; }
    if (major) { t.majorLatin = face(major, 'latin'); t.majorCs = face(major, 'cs'); t.majorEa = face(major, 'ea'); }
    if (minor) { t.minorLatin = face(minor, 'latin'); t.minorCs = face(minor, 'cs'); t.minorEa = face(minor, 'ea'); }
    // Word theme attribute values
    t.majorAscii = t.majorHAnsi = t.majorLatin; t.minorAscii = t.minorHAnsi = t.minorLatin;
    t.majorBidi = t.majorCs; t.minorBidi = t.minorCs; t.majorEastAsia = t.majorEa; t.minorEastAsia = t.minorEa;
    // DrawingML shorthands
    t['+mj-lt'] = t.majorLatin; t['+mn-lt'] = t.minorLatin; t['+mj-cs'] = t.majorCs; t['+mn-cs'] = t.minorCs;
    t['+mj-ea'] = t.majorEa; t['+mn-ea'] = t.minorEa;
    return t;
  }

  /* ================================================================== WORD */
  function onOff(el) {
    var v = wAttr(el, 'val');
    return !(v === '0' || v === 'false' || v === 'off');
  }
  var THEME_ATTR = { ascii: 'asciiTheme', hAnsi: 'hAnsiTheme', cs: 'cstheme', eastAsia: 'eastAsiaTheme' };

  function readWRPr(rPr, p, theme) {
    var f = kid(rPr, NS.w, 'rFonts');
    if (f) {
      ['ascii', 'hAnsi', 'cs', 'eastAsia'].forEach(function (k) {
        var th = wAttr(f, THEME_ATTR[k]), v = wAttr(f, k);
        if (th && theme[th]) p[k] = theme[th];
        else if (v) p[k] = v;
      });
    }
    ['b', 'bCs', 'i', 'iCs'].forEach(function (k) { var e = kid(rPr, NS.w, k); if (e) p[k] = onOff(e); });
    ['sz', 'szCs'].forEach(function (k) { var e = kid(rPr, NS.w, k); if (e && wAttr(e, 'val')) p[k] = wAttr(e, 'val'); });
    return p;
  }

  function WordStyles(stylesDoc, theme) {
    this.theme = theme || {};
    this.styles = {};
    this.defaults = {};
    this.defaultPara = null;
    this.cache = {};
    if (!stylesDoc) return;
    var dd = all(stylesDoc, NS.w, 'rPrDefault')[0];
    if (dd && kid(dd, NS.w, 'rPr')) this.defaults = readWRPr(kid(dd, NS.w, 'rPr'), {}, this.theme);
    var self = this;
    all(stylesDoc, NS.w, 'style').forEach(function (st) {
      var id = wAttr(st, 'styleId'), type = wAttr(st, 'type'), based = kid(st, NS.w, 'basedOn');
      self.styles[id] = { type: type, basedOn: based ? wAttr(based, 'val') : null, rPr: kid(st, NS.w, 'rPr') };
      var def = wAttr(st, 'default');
      if (type === 'paragraph' && (def === '1' || def === 'true')) self.defaultPara = id;
    });
  }
  WordStyles.prototype.chain = function (id, depth) {
    if (!id || (depth || 0) > 25) return {};
    if (this.cache[id]) return this.cache[id];
    var st = this.styles[id];
    if (!st) return {};
    var p = {};
    var base = this.chain(st.basedOn, (depth || 0) + 1);
    for (var k in base) p[k] = base[k];
    if (st.rPr) readWRPr(st.rPr, p, this.theme);
    this.cache[id] = p;
    return p;
  };
  WordStyles.prototype.resolve = function (run, pStyleId) {
    var p = {}, k, src;
    for (k in this.defaults) p[k] = this.defaults[k];
    src = this.chain(pStyleId || this.defaultPara);
    for (k in src) p[k] = src[k];
    var rPr = kid(run, NS.w, 'rPr');
    if (rPr) {
      var rs = kid(rPr, NS.w, 'rStyle');
      if (rs) { src = this.chain(wAttr(rs, 'val')); for (k in src) p[k] = src[k]; }
      readWRPr(rPr, p, this.theme);
    }
    return p;
  };

  function closestPara(node) {
    for (var n = node.parentNode; n; n = n.parentNode) if (isEl(n, NS.w, 'p')) return n;
    return null;
  }

  function wSet(el, name, val, pfx) { el.setAttributeNS(NS.w, qn(pfx, name), val); }
  function wDel(el, name) { if (el.hasAttributeNS(NS.w, name)) el.removeAttributeNS(NS.w, name); }

  function setWFonts(rPr, font, pfx) {
    var rf = ensureKid(rPr, NS.w, pfx, 'rFonts', W_RPR_ORDER);
    ['asciiTheme', 'hAnsiTheme', 'cstheme', 'eastAsiaTheme', 'hint'].forEach(function (a) { wDel(rf, a); });
    ['ascii', 'hAnsi', 'cs', 'eastAsia'].forEach(function (a) { wSet(rf, a, font, pfx); });
  }
  function setWToggle(rPr, name, on, inheritedOn, pfx) {
    var el = kid(rPr, NS.w, name);
    if (on) {
      el = el || ensureKid(rPr, NS.w, pfx, name, W_RPR_ORDER);
      wDel(el, 'val');
    } else if (el || inheritedOn) {
      el = el || ensureKid(rPr, NS.w, pfx, name, W_RPR_ORDER);
      wSet(el, 'val', '0', pfx);
    }
  }
  function setWVal(rPr, name, val, pfx) {
    var el = ensureKid(rPr, NS.w, pfx, name, W_RPR_ORDER);
    wSet(el, 'val', val, pfx);
  }
  function ensureWRPr(run, pfx) {
    var rPr = kid(run, NS.w, 'rPr');
    if (rPr) return rPr;
    rPr = run.ownerDocument.createElementNS(NS.w, qn(pfx, 'rPr'));
    run.insertBefore(rPr, run.firstChild);
    return rPr;
  }

  /** Bijoy run → Unicode run properties (font + complex-script formatting). */
  function wordApplyUnicodeProps(run, props, ctx, pfx) {
    var rPr = ensureWRPr(run, pfx);
    setWFonts(rPr, ctx.opts.unicodeFont, pfx);
    setWToggle(rPr, 'bCs', !!props.b, !!props.bCs, pfx);
    setWToggle(rPr, 'iCs', !!props.i, !!props.iCs, pfx);
    if (props.sz) setWVal(rPr, 'szCs', props.sz, pfx);
    var lang = ensureKid(rPr, NS.w, pfx, 'lang', W_RPR_ORDER);
    wSet(lang, 'bidi', 'bn-BD', pfx);
  }
  /** Unicode run → Bijoy/Symbol run properties (ANSI font + Latin formatting). */
  function wordApplyBijoyProps(run, props, ctx, pfx, fontOverride) {
    var rPr = ensureWRPr(run, pfx);
    setWFonts(rPr, fontOverride || ctx.opts.bijoyFont, pfx);
    var b = props.bCs !== undefined ? props.bCs : props.b;
    var i = props.iCs !== undefined ? props.iCs : props.i;
    setWToggle(rPr, 'b', !!b, !!props.b, pfx);
    setWToggle(rPr, 'i', !!i, !!props.i, pfx);
    var sz = props.szCs || props.sz;
    if (sz) setWVal(rPr, 'sz', sz, pfx);
    removeKid(rPr, NS.w, 'cs');
    removeKid(rPr, NS.w, 'rtl');
    var lang = kid(rPr, NS.w, 'lang');
    if (lang) wDel(lang, 'bidi');
  }

  function isWText(c) { return isEl(c, NS.w, 't') || isEl(c, NS.w, 'delText'); }
  function isSymbolFont(name) { return /^symbol$/i.test(String(name || '').trim()); }
  function isDingbatFont(name) { return /^(symbol|wingdings|webdings|marlett)/i.test(String(name || '').trim()); }

  function runIsBijoy(props, ctx) {
    if (isDingbatFont(props.ascii) || isDingbatFont(props.hAnsi)) return false;
    if (ctx.allText) return true;
    return E().isBijoyFont(props.ascii) || E().isBijoyFont(props.hAnsi);
  }

  var ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  var ARABIC_FONT_RE = /arabic|urdu|scheherazade|amiri|lateef|naskh|nastaliq|qalam|noorehuda|pdms/i;
  function isArabicRun(r, props, txt) {
    if (E().hasBengali(txt)) return false;
    if (ARABIC_RE.test(txt)) return true;
    if (/[A-Za-z]/.test(txt)) return false;
    var rPr = kid(r, NS.w, 'rPr');
    if (rPr && kid(rPr, NS.w, 'rtl')) return true;
    return ARABIC_FONT_RE.test(props.cs || '') || ARABIC_FONT_RE.test(props.ascii || '');
  }

  function runText(r) {
    var s = '';
    for (var c = r.firstChild; c; c = c.nextSibling) if (isWText(c)) s += textOf(c);
    return s;
  }
  function firstWText(r) {
    for (var c = r.firstChild; c; c = c.nextSibling) if (isWText(c)) return c;
    return null;
  }
  function lastWText(r) {
    var last = null;
    for (var c = r.firstChild; c; c = c.nextSibling) if (isWText(c)) last = c;
    return last;
  }
  function hasOnlyRPrAndEmptyText(r) {
    for (var c = r.firstChild; c; c = c.nextSibling) {
      if (c.nodeType !== 1) continue;
      if (isEl(c, NS.w, 'rPr')) continue;
      if (isWText(c) && !textOf(c)) continue;
      return false;
    }
    return true;
  }

  var DEP_START = /^[\u0981-\u0983\u09BC\u09BE-\u09CC\u09CD\u09D7\u200C\u200D]/;
  var LINK_END = /[\u09CD\u200C\u200D]$/;
  var BN_END = /[\u0980-\u09FF\u200C\u200D]$/;
  var BN_START = /^[\u0980-\u09FF\u200C\u200D]/;

  /** Merge Bangla syllables that Word split across adjacent <w:r> runs. */
  function mergeSplitSyllables(runs) {
    for (var i = 1; i < runs.length;) {
      var prevT = lastWText(runs[i - 1]), curT = firstWText(runs[i]);
      if (prevT && curT) {
        var pt = textOf(prevT), ct = textOf(curT);
        if ((BN_END.test(pt) && DEP_START.test(ct)) || (LINK_END.test(pt) && BN_START.test(ct))) {
          var m = /^[\u0980-\u09FF\u200C\u200D]+/.exec(ct);
          if (m) {
            setText(prevT, pt + m[0]);
            setText(curT, ct.slice(m[0].length));
            if (hasOnlyRPrAndEmptyText(runs[i])) {
              runs[i].parentNode.removeChild(runs[i]);
              runs.splice(i, 1);
              continue;
            }
          }
        }
      }
      i++;
    }
  }

  function processWordDoc(doc, ctx) {
    var pfx = prefixFor(doc, NS.w, 'w');
    var E_ = E();
    all(doc, NS.w, 'p').forEach(function (p) {
      var pPr = kid(p, NS.w, 'pPr'), ps = pPr && kid(pPr, NS.w, 'pStyle');
      var pStyle = ps ? wAttr(ps, 'val') : null;
      var runs = all(p, NS.w, 'r').filter(function (r) { return closestPara(r) === p; });

      if (ctx.dir === 'b2u') {
        var group = [];
        var flush = function () {
          if (group.length) { convertPieces(group, E_.bijoyToUnicode); group = []; }
        };
        runs.forEach(function (r) {
          var props = ctx.styles.resolve(r, pStyle);
          var hasText = false, unicodeAlready = false, hasSym = false, c;
          for (c = r.firstChild; c; c = c.nextSibling) {
            if (isWText(c)) {
              hasText = true;
              if (E_.hasBengali(textOf(c))) unicodeAlready = true;
            } else if (isEl(c, NS.w, 'sym') && /^symbol$/i.test(wAttr(c, 'font'))) {
              hasSym = true;
            }
          }
          if (hasSym || ((isSymbolFont(props.ascii) || isSymbolFont(props.hAnsi)) && hasText)) {
            flush();
            var convertedSym = false;
            for (c = r.firstChild; c; c = c.nextSibling) {
              if (isWText(c) && /[\u00B4\uF0B4\u00B8\uF0B8]/.test(textOf(c))) {
                setText(c, E_.symbolToUnicode(textOf(c)));
                convertedSym = true;
              } else if (isEl(c, NS.w, 'sym') && /^symbol$/i.test(wAttr(c, 'font'))) {
                var chHex = parseInt(wAttr(c, 'char'), 16);
                var symCh = chHex ? E_.symbolToUnicode(String.fromCharCode(chHex)) : '';
                if (symCh === '×' || symCh === '÷') {
                  var nt = doc.createElementNS(NS.w, qn(pfx, 't'));
                  setText(nt, symCh);
                  r.replaceChild(nt, c);
                  c = nt;
                  convertedSym = true;
                }
              }
            }
            if (convertedSym) {
              ctx.stats.runs++;
              wordApplyUnicodeProps(r, props, ctx, pfx);
            }
            return;
          }
          if (!runIsBijoy(props, ctx) || unicodeAlready) { flush(); return; }
          if (hasText) ctx.stats.runs++;
          for (c = r.firstChild; c; c = c.nextSibling) {
            if (c.nodeType !== 1) continue;
            if (isWText(c)) group.push({ el: c, text: textOf(c) });
            else if (!isEl(c, NS.w, 'rPr')) flush();
          }
          wordApplyUnicodeProps(r, props, ctx, pfx);
        });
        flush();
        // paragraph mark: keep typing in the Unicode font afterwards
        var markRPr = pPr && kid(pPr, NS.w, 'rPr');
        if (markRPr) {
          var mf = readWRPr(markRPr, {}, ctx.styles.theme);
          if (E_.isBijoyFont(mf.ascii) || E_.isBijoyFont(mf.hAnsi)) setWFonts(markRPr, ctx.opts.unicodeFont, pfx);
        }
      } else {
        mergeSplitSyllables(runs);
        var propsList = [], txtList = [], directList = [], arabicList = [], neutralAsBijoy = [];
        var anyDirect = false, i;
        for (i = 0; i < runs.length; i++) {
          propsList[i] = ctx.styles.resolve(runs[i], pStyle);
          txtList[i] = runText(runs[i]);
          arabicList[i] = isArabicRun(runs[i], propsList[i], txtList[i]);
          directList[i] = !arabicList[i] && E_.hasU2B(txtList[i]);
          if (directList[i]) anyDirect = true;
        }
        if (anyDirect) {
          for (i = 0; i < runs.length; i++) {
            if (directList[i] || arabicList[i] || !txtList[i] || !E_.isPureNeutral(txtList[i])) continue;
            var lIdx = i - 1; while (lIdx >= 0 && !txtList[lIdx]) lIdx--;
            var rIdx = i + 1; while (rIdx < runs.length && !txtList[rIdx]) rIdx++;
            var lOk = lIdx < 0 || (directList[lIdx] && !/[A-Za-z0-9]\s*$/.test(txtList[lIdx]));
            var rOk = rIdx >= runs.length || (directList[rIdx] && !/^\s*[A-Za-z0-9]/.test(txtList[rIdx]));
            var hasN = (lIdx >= 0 && directList[lIdx]) || (rIdx < runs.length && directList[rIdx]);
            if (hasN && lOk && rOk) neutralAsBijoy[i] = true;
          }
        }
        var enFont = ctx.opts.englishFont !== undefined ? ctx.opts.englishFont : 'Times New Roman';
        runs.forEach(function (r, idx) {
          if (!directList[idx] && !neutralAsBijoy[idx]) {
            if (enFont && !arabicList[idx] && /[A-Za-z]/.test(txtList[idx])) {
              ctx.stats.runs++;
              wordApplyBijoyProps(r, propsList[idx], ctx, pfx, enFont);
            }
            return;
          }
          ctx.stats.runs++;
          var props = propsList[idx];
          var rPr = kid(r, NS.w, 'rPr');
          var made = [], cur = null, curMode = null, c;
          var prevBnWord = idx > 0 && /[\u0980-\u09FF\u200C\u200D]$/.test(txtList[idx - 1]);
          var start = function (mode) {
            var nr = r.cloneNode(false);
            if (rPr) nr.appendChild(rPr.cloneNode(true));
            made.push({ el: nr, mode: mode, text: '' });
            cur = nr; curMode = mode;
          };
          for (c = r.firstChild; c; c = c.nextSibling) {
            if (c === rPr) continue;
            if (isWText(c)) {
              var rawT = textOf(c);
              var segs = neutralAsBijoy[idx]
                ? [{ bijoy: true, text: E_.convertBengaliRun(rawT, prevBnWord) }]
                : E_.unicodeToBijoySegments(rawT, prevBnWord);
              prevBnWord = /[\u0980-\u09FF\u200C\u200D]$/.test(rawT);
              segs.forEach(function (sg) {
                var mode = sg.symbol ? 'S' : (sg.bijoy ? 'B' : 'O');
                if (!cur || curMode !== mode) start(mode);
                made[made.length - 1].text += sg.text;
                var t = doc.createElementNS(NS.w, qn(pfx, c.localName));
                setText(t, sg.text);
                cur.appendChild(t);
              });
            } else {
              if (!cur) start('O');
              cur.appendChild(c.cloneNode(true));
            }
          }
          made.forEach(function (m) {
            if (m.mode === 'B') wordApplyBijoyProps(m.el, props, ctx, pfx);
            else if (m.mode === 'S') wordApplyBijoyProps(m.el, props, ctx, pfx, 'Symbol');
            else if (m.mode === 'O' && enFont && /[A-Za-z]/.test(m.text)) wordApplyBijoyProps(m.el, props, ctx, pfx, enFont);
            r.parentNode.insertBefore(m.el, r);
          });
          r.parentNode.removeChild(r);
        });
      }
    });
  }

  /** styles.xml: Bijoy fonts in styles/defaults → Unicode font (B→U only). */
  function retargetWordStyles(doc, ctx) {
    var pfx = prefixFor(doc, NS.w, 'w');
    var E_ = E();
    all(doc, NS.w, 'rFonts').forEach(function (rf) {
      if (E_.isBijoyFont(wAttr(rf, 'ascii')) || E_.isBijoyFont(wAttr(rf, 'hAnsi'))) {
        ['ascii', 'hAnsi', 'cs', 'eastAsia'].forEach(function (a) { wSet(rf, a, ctx.opts.unicodeFont, pfx); });
        ctx.stats.styles++;
      }
    });
  }

  /* ================================================================== DRAWINGML (pptx, charts, SmartArt, shapes) */
  function aFace(rPr, name) { var e = rPr && kid(rPr, NS.a, name); return e ? e.getAttribute('typeface') : ''; }
  function resolveFace(face, theme) { return face && face.charAt(0) === '+' ? (theme[face] || '') : face; }

  function lstStyleFace(p, theme) {
    var txBody = p.parentNode;
    var lst = txBody && kid(txBody, NS.a, 'lstStyle');
    if (!lst) return '';
    var pPr = kid(p, NS.a, 'pPr');
    var lvl = pPr && pPr.getAttribute('lvl') ? (+pPr.getAttribute('lvl') + 1) : 1;
    var lp = kid(lst, NS.a, 'lvl' + lvl + 'pPr');
    var def = lp && kid(lp, NS.a, 'defRPr');
    return resolveFace(aFace(def, 'latin'), theme);
  }

  function setAFace(rPr, name, font, pfx) {
    var el = ensureKid(rPr, NS.a, pfx, name, A_RPR_ORDER);
    el.setAttribute('typeface', font);
    el.removeAttribute('pitchFamily');
    el.removeAttribute('charset');
    el.removeAttribute('panose');
  }
  function ensureARPr(r, pfx) {
    var rPr = kid(r, NS.a, 'rPr');
    if (rPr) return rPr;
    rPr = r.ownerDocument.createElementNS(NS.a, qn(pfx, 'rPr'));
    r.insertBefore(rPr, r.firstChild);
    return rPr;
  }

  function processDrawingDoc(doc, ctx) {
    var pfx = prefixFor(doc, NS.a, 'a');
    var E_ = E();
    all(doc, NS.a, 'p').forEach(function (p) {
      var runs = [];
      for (var c = p.firstChild; c; c = c.nextSibling) {
        if (isEl(c, NS.a, 'r') || isEl(c, NS.a, 'fld') || isEl(c, NS.a, 'br')) runs.push(c);
      }
      if (!runs.length) return;
      var inherited = lstStyleFace(p, ctx.theme);

      if (ctx.dir === 'b2u') {
        var group = [];
        var flush = function () { if (group.length) { convertPieces(group, E_.bijoyToUnicode, false); group = []; } };
        runs.forEach(function (r) {
          if (isEl(r, NS.a, 'br')) { flush(); return; }
          var t = kid(r, NS.a, 't');
          var face = resolveFace(aFace(kid(r, NS.a, 'rPr'), 'latin'), ctx.theme) || inherited;
          if (t && isSymbolFont(face) && /[\u00B4\uF0B4\u00B8\uF0B8]/.test(textOf(t))) {
            flush();
            ctx.stats.runs++;
            setText(t, E_.symbolToUnicode(textOf(t)), false);
            var srPr = ensureARPr(r, pfx);
            setAFace(srPr, 'latin', ctx.opts.unicodeFont, pfx);
            setAFace(srPr, 'cs', ctx.opts.unicodeFont, pfx);
            srPr.setAttribute('lang', 'bn-BD');
            return;
          }
          var bijoy = !isDingbatFont(face) && (ctx.allText || (face ? E_.isBijoyFont(face) : ctx.defaultLatinBijoy));
          if (!t || !bijoy || E_.hasBengali(textOf(t))) { flush(); return; }
          ctx.stats.runs++;
          group.push({ el: t, text: textOf(t) });
          var rPr = ensureARPr(r, pfx);
          setAFace(rPr, 'latin', ctx.opts.unicodeFont, pfx);
          setAFace(rPr, 'cs', ctx.opts.unicodeFont, pfx);
          rPr.setAttribute('lang', 'bn-BD');
        });
        flush();
      } else {
        var enFont = ctx.opts.englishFont !== undefined ? ctx.opts.englishFont : 'Times New Roman';
        runs.forEach(function (r) {
          if (isEl(r, NS.a, 'br')) return;
          var t = kid(r, NS.a, 't');
          if (!t) return;
          if (!E_.hasU2B(textOf(t))) {
            if (enFont && /[A-Za-z]/.test(textOf(t))) {
              ctx.stats.runs++;
              var erPr = ensureARPr(r, pfx);
              ['latin', 'ea', 'cs'].forEach(function (n) { setAFace(erPr, n, enFont, pfx); });
            }
            return;
          }
          ctx.stats.runs++;
          var segs = E_.unicodeToBijoySegments(textOf(t));
          var rPr = kid(r, NS.a, 'rPr');
          segs.forEach(function (sg) {
            var nr = isEl(r, NS.a, 'fld') ? doc.createElementNS(NS.a, qn(pfx, 'r')) : r.cloneNode(false);
            nr.appendChild(rPr ? rPr.cloneNode(true) : doc.createElementNS(NS.a, qn(pfx, 'rPr')));
            var nt = doc.createElementNS(NS.a, qn(pfx, 't'));
            setText(nt, sg.text, false);
            nr.appendChild(nt);
            var nrPr = kid(nr, NS.a, 'rPr');
            if (sg.bijoy || sg.symbol) {
              var targetFont = sg.symbol ? 'Symbol' : ctx.opts.bijoyFont;
              ['latin', 'ea', 'cs', 'sym'].forEach(function (n) { setAFace(nrPr, n, targetFont, pfx); });
              nrPr.setAttribute('lang', 'en-US');
              nrPr.removeAttribute('altLang');
            } else if (enFont && /[A-Za-z]/.test(sg.text)) {
              ['latin', 'ea', 'cs'].forEach(function (n) { setAFace(nrPr, n, enFont, pfx); });
            }
            p.insertBefore(nr, r);
          });
          p.removeChild(r);
        });
      }
    });
  }

  /** Rename Bijoy typefaces left in defaults/masters/themes (B→U only). */
  function retargetDrawingFaces(doc, ctx) {
    var E_ = E();
    ['latin', 'cs', 'ea'].forEach(function (n) {
      all(doc, NS.a, n).forEach(function (el) {
        if (E_.isBijoyFont(el.getAttribute('typeface'))) {
          el.setAttribute('typeface', ctx.opts.unicodeFont);
          el.removeAttribute('pitchFamily'); el.removeAttribute('charset'); el.removeAttribute('panose');
          ctx.stats.styles++;
        }
      });
    });
  }

  /* ================================================================== EXCEL */
  function sAttr(el, n) { return el ? el.getAttribute(n) : null; }

  function fontToRPr(doc, fontEl, nameOverride, pfx) {
    var rPr = doc.createElementNS(NS.s, qn(pfx, 'rPr'));
    var parts = {};
    if (fontEl) {
      for (var c = fontEl.firstChild; c; c = c.nextSibling) {
        if (c.nodeType !== 1) continue;
        var ln = c.localName === 'name' ? 'rFont' : c.localName;
        if (S_RPR_ORDER.indexOf(ln) === -1) continue;
        var copy = doc.createElementNS(NS.s, qn(pfx, ln));
        for (var ai = 0; ai < c.attributes.length; ai++) copy.setAttribute(c.attributes[ai].name, c.attributes[ai].value);
        parts[ln] = copy;
      }
    }
    if (nameOverride) {
      var rf = doc.createElementNS(NS.s, qn(pfx, 'rFont'));
      rf.setAttribute('val', nameOverride);
      parts.rFont = rf;
      delete parts.scheme;   // a theme scheme would override the explicit font
      delete parts.charset;
    }
    S_RPR_ORDER.forEach(function (n) { if (parts[n]) rPr.appendChild(parts[n]); });
    return rPr;
  }
  function setSRFont(rPr, font, pfx) {
    var rf = ensureKid(rPr, NS.s, pfx, 'rFont', S_RPR_ORDER);
    rf.setAttribute('val', font);
    removeKid(rPr, NS.s, 'scheme');
    removeKid(rPr, NS.s, 'charset');
  }

  /** Convert one string item (<si>, <is>, <text>) given the cell font name/element. */
  function processSString(item, cellFontName, cellFontEl, ctx, pfx) {
    var E_ = E();
    var doc = item.ownerDocument;
    var runs = kids(item, NS.s, 'r');
    if (ctx.dir === 'b2u') {
      if (runs.length) {
        var group = [];
        var flush = function () { if (group.length) { convertPieces(group, E_.bijoyToUnicode); group = []; } };
        runs.forEach(function (r) {
          var t = kid(r, NS.s, 't'), rPr = kid(r, NS.s, 'rPr');
          var rf = rPr && kid(rPr, NS.s, 'rFont');
          var face = rf ? rf.getAttribute('val') : cellFontName;
          if (t && isSymbolFont(face) && /[\u00B4\uF0B4\u00B8\uF0B8]/.test(textOf(t))) {
            flush();
            ctx.stats.runs++;
            setText(t, E_.symbolToUnicode(textOf(t)));
            if (rf) setSRFont(rPr, ctx.opts.unicodeFont, pfx);
            return;
          }
          if (!t || E_.hasBengali(textOf(t)) || isDingbatFont(face) || !(ctx.allText || E_.isBijoyFont(face))) { flush(); return; }
          ctx.stats.runs++;
          group.push({ el: t, text: textOf(t) });
          if (rf) setSRFont(rPr, ctx.opts.unicodeFont, pfx);
        });
        flush();
      } else {
        var t = kid(item, NS.s, 't');
        if (t && isSymbolFont(cellFontName) && /[\u00B4\uF0B4\u00B8\uF0B8]/.test(textOf(t))) {
          ctx.stats.runs++;
          setText(t, E_.symbolToUnicode(textOf(t)));
        } else if (t && !E_.hasBengali(textOf(t)) && !isDingbatFont(cellFontName) && (ctx.allText || E_.isBijoyFont(cellFontName))) {
          ctx.stats.runs++;
          setText(t, E_.bijoyToUnicode(textOf(t)));
        }
      }
      return;
    }
    // u2b
    var sources = runs.length ? runs : [null];
    var any = false;
    if (runs.length) runs.forEach(function (r) { var t = kid(r, NS.s, 't'); if (t && E_.hasU2B(textOf(t))) any = true; });
    else { var t0 = kid(item, NS.s, 't'); any = !!(t0 && E_.hasU2B(textOf(t0))); }
    if (!any) return;
    ctx.stats.runs++;
    var newRuns = [];
    sources.forEach(function (r) {
      var t = r ? kid(r, NS.s, 't') : kid(item, NS.s, 't');
      var rPr = r ? kid(r, NS.s, 'rPr') : null;
      var text = t ? textOf(t) : '';
      var segs = E_.hasU2B(text) ? E_.unicodeToBijoySegments(text) : [{ text: text, bijoy: false }];
      segs.forEach(function (sg) {
        var nr = doc.createElementNS(NS.s, qn(pfx, 'r'));
        var nrPr, targetFont = sg.symbol ? 'Symbol' : (sg.bijoy ? ctx.opts.bijoyFont : null);
        if (rPr) { nrPr = rPr.cloneNode(true); if (targetFont) setSRFont(nrPr, targetFont, pfx); }
        else nrPr = fontToRPr(doc, cellFontEl, targetFont, pfx);
        if (nrPr.firstChild || targetFont) nr.appendChild(nrPr);
        var nt = doc.createElementNS(NS.s, qn(pfx, 't'));
        setText(nt, sg.text);
        nr.appendChild(nt);
        newRuns.push(nr);
      });
    });
    // replace content (keep phonetic data)
    for (var c = item.firstChild; c;) {
      var next = c.nextSibling;
      if (isEl(c, NS.s, 'r') || isEl(c, NS.s, 't')) item.removeChild(c);
      c = next;
    }
    var ref = firstElementChild(item);
    newRuns.forEach(function (nr) { item.insertBefore(nr, ref); });
  }

  /* ================================================================== package drivers */
  var parser = null, serializer = null;
  function getParser() { return parser || (parser = new (root.DOMParser)()); }
  function getSerializer() { return serializer || (serializer = new (root.XMLSerializer)()); }

  async function readXml(zip, path) {
    var f = zip.file(path);
    if (!f) return null;
    var str = await f.async('string');
    var doc = getParser().parseFromString(str, 'application/xml');
    if (!doc || !doc.documentElement || doc.getElementsByTagName('parsererror').length) return null;
    return doc;
  }
  function writeXml(zip, path, doc) {
    var s = getSerializer().serializeToString(doc);
    if (!/^<\?xml/.test(s)) s = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' + s;
    zip.file(path, s);
  }
  function listParts(zip, re) { return Object.keys(zip.files).filter(function (p) { return re.test(p) && !zip.files[p].dir; }).sort(); }
  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }

  async function forEachPart(zip, paths, ctx, fn) {
    for (var i = 0; i < paths.length; i++) {
      var doc = await readXml(zip, paths[i]);
      if (!doc) continue;
      fn(doc, paths[i]);
      writeXml(zip, paths[i], doc);
      if (ctx.onProgress) ctx.onProgress((i + 1) / paths.length, paths[i]);
      await tick();
    }
  }

  var DRAWING_PARTS = /^(word|xl|ppt)\/(charts\/chart\d*|diagrams\/(data|drawing)\d*|drawings\/drawing\d*)\.xml$/;

  async function convertWord(zip, ctx) {
    var stylesDoc = await readXml(zip, 'word/styles.xml');
    var themeDoc = await readXml(zip, 'word/theme/theme1.xml');
    ctx.theme = readTheme(themeDoc);
    ctx.styles = new WordStyles(stylesDoc, ctx.theme);
    ctx.defaultLatinBijoy = E().isBijoyFont(ctx.styles.defaults.ascii);
    var parts = listParts(zip, /^word\/(document|header\d*|footer\d*|footnotes|endnotes|comments\w*|glossary\/document)\.xml$/);
    await forEachPart(zip, parts, ctx, function (doc) { processWordDoc(doc, ctx); });
    await forEachPart(zip, listParts(zip, DRAWING_PARTS), ctx, function (doc) { processDrawingDoc(doc, ctx); });
    if (ctx.dir === 'b2u' && stylesDoc && ctx.stats.runs) { retargetWordStyles(stylesDoc, ctx); writeXml(zip, 'word/styles.xml', stylesDoc); }
  }

  async function convertPowerPoint(zip, ctx) {
    var themePaths = listParts(zip, /^ppt\/theme\/theme\d+\.xml$/);
    var themeDoc = themePaths.length ? await readXml(zip, themePaths[0]) : null;
    ctx.theme = readTheme(themeDoc);
    var E_ = E();
    var defBijoy = E_.isBijoyFont(ctx.theme.minorLatin) || E_.isBijoyFont(ctx.theme.majorLatin);
    // masters' text styles & presentation default text style
    var masters = listParts(zip, /^ppt\/(slideMasters\/slideMaster\d+|presentation)\.xml$/);
    for (var i = 0; i < masters.length && !defBijoy; i++) {
      var md = await readXml(zip, masters[i]);
      if (!md) continue;
      all(md, NS.a, 'defRPr').forEach(function (d) { if (E_.isBijoyFont(resolveFace(aFace(d, 'latin'), ctx.theme))) defBijoy = true; });
    }
    ctx.defaultLatinBijoy = defBijoy;
    var parts = listParts(zip, /^ppt\/(slides\/slide|slideLayouts\/slideLayout|slideMasters\/slideMaster|notesSlides\/notesSlide|notesMasters\/notesMaster|handoutMasters\/handoutMaster)\d+\.xml$/)
      .concat(listParts(zip, DRAWING_PARTS));
    await forEachPart(zip, parts, ctx, function (doc) {
      processDrawingDoc(doc, ctx);
      if (ctx.dir === 'b2u') retargetDrawingFaces(doc, ctx);
    });
    if (ctx.dir === 'b2u' && ctx.stats.runs) {
      await forEachPart(zip, themePaths.concat(listParts(zip, /^ppt\/presentation\.xml$/)), ctx, function (doc) { retargetDrawingFaces(doc, ctx); });
    }
  }

  async function convertExcel(zip, ctx) {
    var E_ = E();
    var stylesDoc = await readXml(zip, 'xl/styles.xml');
    var themeDoc = await readXml(zip, 'xl/theme/theme1.xml');
    ctx.theme = readTheme(themeDoc);
    var fontEls = [], xfFont = [];
    if (stylesDoc) {
      var fontsEl = kid(stylesDoc.documentElement, NS.s, 'fonts');
      fontEls = kids(fontsEl, NS.s, 'font');
      var xfsEl = kid(stylesDoc.documentElement, NS.s, 'cellXfs');
      xfFont = kids(xfsEl, NS.s, 'xf').map(function (x) { return +(sAttr(x, 'fontId') || 0); });
    }
    function fontName(fel) {
      if (!fel) return '';
      var n = kid(fel, NS.s, 'name'), sc = kid(fel, NS.s, 'scheme');
      if (sc && ctx.theme) {
        var v = sAttr(sc, 'val');
        if (v === 'minor' && ctx.theme.minorLatin) return ctx.theme.minorLatin;
        if (v === 'major' && ctx.theme.majorLatin) return ctx.theme.majorLatin;
      }
      return n ? sAttr(n, 'val') : '';
    }
    function cellFont(xf) { var fe = fontEls[xfFont[xf] || 0]; return { el: fe, name: fontName(fe) }; }

    var sheetPaths = listParts(zip, /^xl\/worksheets\/sheet\d+\.xml$/);
    var sstDoc = await readXml(zip, 'xl/sharedStrings.xml');
    var siXf = {};
    var sheets = [];
    for (var i = 0; i < sheetPaths.length; i++) {
      var sd = await readXml(zip, sheetPaths[i]);
      if (!sd) continue;
      sheets.push({ path: sheetPaths[i], doc: sd });
      all(sd, NS.s, 'c').forEach(function (c) {
        if (sAttr(c, 't') === 's') {
          var v = kid(c, NS.s, 'v');
          var idx = v ? +textOf(v) : -1;
          if (idx >= 0 && siXf[idx] === undefined) siXf[idx] = +(sAttr(c, 's') || 0);
        }
      });
    }
    if (sstDoc) {
      var pfx = prefixFor(sstDoc, NS.s, '');
      kids(sstDoc.documentElement, NS.s, 'si').forEach(function (si, idx) {
        var cf = cellFont(siXf[idx] || 0);
        processSString(si, cf.name, cf.el, ctx, pfx);
      });
      writeXml(zip, 'xl/sharedStrings.xml', sstDoc);
    }
    for (i = 0; i < sheets.length; i++) {
      var sh = sheets[i], spfx = prefixFor(sh.doc, NS.s, '');
      all(sh.doc, NS.s, 'c').forEach(function (c) {
        var t = sAttr(c, 't');
        var cf = cellFont(+(sAttr(c, 's') || 0));
        if (t === 'inlineStr') { var is = kid(c, NS.s, 'is'); if (is) processSString(is, cf.name, cf.el, ctx, spfx); }
        else if (t === 'str' && ctx.dir === 'b2u') {
          var v = kid(c, NS.s, 'v');
          if (v && !E_.hasBengali(textOf(v)) && (ctx.allText || E_.isBijoyFont(cf.name))) setText(v, E_.bijoyToUnicode(textOf(v)));
        }
      });
      writeXml(zip, sh.path, sh.doc);
      if (ctx.onProgress) ctx.onProgress((i + 1) / sheets.length, sh.path);
      await tick();
    }
    // comments
    await forEachPart(zip, listParts(zip, /^xl\/comments\d*\.xml$/), ctx, function (doc) {
      var cpfx = prefixFor(doc, NS.s, '');
      all(doc, NS.s, 'text').forEach(function (tx) { processSString(tx, '', null, ctx, cpfx); });
    });
    await forEachPart(zip, listParts(zip, DRAWING_PARTS), ctx, function (doc) { processDrawingDoc(doc, ctx); });
    // B→U: rename Bijoy fonts in styles so cell formatting follows
    if (ctx.dir === 'b2u' && stylesDoc && ctx.stats.runs) {
      all(stylesDoc, NS.s, 'font').forEach(function (f) {
        var n = kid(f, NS.s, 'name');
        if (n && E_.isBijoyFont(sAttr(n, 'val'))) {
          n.setAttribute('val', ctx.opts.unicodeFont);
          removeKid(f, NS.s, 'charset');
          removeKid(f, NS.s, 'scheme');
          ctx.stats.styles++;
        }
      });
      writeXml(zip, 'xl/styles.xml', stylesDoc);
    }
  }

  /* ------------------------------------------------------------------ public API */
  function E() { return root.BijoyEngine; }

  function kindOf(name) {
    var ext = (name.split('.').pop() || '').toLowerCase();
    if (['docx', 'docm', 'dotx', 'dotm'].indexOf(ext) !== -1) return 'word';
    if (['xlsx', 'xlsm', 'xltx', 'xltm'].indexOf(ext) !== -1) return 'excel';
    if (['pptx', 'pptm', 'potx', 'potm', 'ppsx', 'ppsm'].indexOf(ext) !== -1) return 'powerpoint';
    return null;
  }

  async function runOnce(buffer, kind, opts, allText) {
    var zip = await root.JSZip.loadAsync(buffer);
    var ctx = {
      dir: opts.direction, opts: opts, allText: allText,
      stats: { runs: 0, styles: 0 }, onProgress: opts.onProgress, theme: {}
    };
    if (kind === 'word') await convertWord(zip, ctx);
    else if (kind === 'excel') await convertExcel(zip, ctx);
    else if (kind === 'powerpoint') await convertPowerPoint(zip, ctx);
    return { zip: zip, stats: ctx.stats };
  }

  /**
   * Convert an OOXML package.
   * @param {ArrayBuffer} buffer
   * @param {string} fileName
   * @param {{direction:'b2u'|'u2b', unicodeFont:string, bijoyFont:string, detect:'auto'|'all', onProgress?:Function}} opts
   * @returns {Promise<{blob:Blob|Uint8Array, stats:object, usedAllText:boolean}>}
   */
  async function convertOffice(buffer, fileName, opts) {
    var kind = kindOf(fileName);
    if (!kind) throw new Error('UNSUPPORTED');
    var allText = opts.direction === 'b2u' && opts.detect === 'all';
    var res = await runOnce(buffer, kind, opts, allText);
    var usedAllText = allText;
    // Auto mode found no Bijoy-font text: fall back to converting all non-Unicode text
    if (opts.direction === 'b2u' && !allText && res.stats.runs === 0 && opts.detect === 'auto') {
      var retry = await runOnce(buffer, kind, opts, true);
      if (retry.stats.runs > 0) { res = retry; usedAllText = true; }
    }
    var type = opts.outputType || (typeof Blob !== 'undefined' ? 'blob' : 'uint8array');
    var out = await res.zip.generateAsync({
      type: type, compression: 'DEFLATE', compressionOptions: { level: 6 },
      mimeType: 'application/octet-stream'
    });
    return { data: out, stats: res.stats, usedAllText: usedAllText, kind: kind };
  }

  var api = { convertOffice: convertOffice, kindOf: kindOf, _convertPieces: convertPieces };
  root.OfficeConverter = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this));
