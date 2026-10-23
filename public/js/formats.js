/*!
 * TechHat RTF + TXT converter
 * ------------------------------------------------------------
 * RTF: a streaming tokenizer rewrites only the text runs whose font is a
 * Bijoy font (B→U) or that contain Bangla (U→B). Everything else — tables,
 * pictures, styles, fields — is copied byte-for-byte.
 * TXT: legacy Bijoy .txt is ANSI (Windows-1252); Unicode output is UTF-8.
 */
(function (root) {
  'use strict';
  function E() { return root.BijoyEngine; }

  var SKIP_DEST = {
    colortbl: 1, stylesheet: 1, info: 1, pict: 1, object: 1, themedata: 1, colorschememapping: 1,
    latentstyles: 1, datastore: 1, xmlnstbl: 1, listtable: 1, listoverridetable: 1, rsidtbl: 1,
    generator: 1, fldinst: 1, revtbl: 1, filetbl: 1, mmathPr: 1, wgrffmtfilter: 1, pgdsctbl: 1, fchars: 1, lchars: 1
  };
  var CHAR_WORDS = {
    lquote: '\u2018', rquote: '\u2019', ldblquote: '\u201C', rdblquote: '\u201D',
    emdash: '\u2014', endash: '\u2013', bullet: '\u2022', emspace: '\u2003', enspace: '\u2002'
  };
  var BREAK_WORDS = { par: 1, line: 1, tab: 1, sect: 1, page: 1, cell: 1, row: 1, nestcell: 1, column: 1 };

  function bytesToBinary(u8) {
    var s = '', CH = 0x8000;
    for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
    return s;
  }
  function binaryToBytes(s) {
    var u8 = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i) & 0xFF;
    return u8;
  }
  function hex2(n) { return (n < 16 ? '0' : '') + n.toString(16); }

  function escAscii(ch) { return ch === '\\' || ch === '{' || ch === '}' ? '\\' + ch : ch; }
  function encUnicode(str, uc) {
    var out = '', fb = uc > 0 ? new Array(uc + 1).join('?') : '';
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) out += escAscii(str[i]);
      else out += '\\u' + (c > 32767 ? c - 65536 : c) + fb;
    }
    return out;
  }
  function encAnsi(str) {
    var out = '';
    for (var i = 0; i < str.length; i++) {
      var b = E().cp1252Byte(str[i]);
      if (b < 0) out += '?';
      else if (b < 0x80) out += escAscii(String.fromCharCode(b));
      else out += "\\'" + hex2(b);
    }
    return out;
  }

  /**
   * @param {Uint8Array} bytes
   * @param {{direction:'b2u'|'u2b', unicodeFont:string, bijoyFont:string, detect:'auto'|'all'}} opts
   */
  function convertRtf(bytes, opts) {
    var E_ = E();
    var s = bytesToBinary(bytes);
    if (s.slice(0, 5) !== '{\\rtf') throw new Error('NOT_RTF');
    var dir = opts.direction, allText = opts.detect === 'all';
    var out = [], i = 0, n = s.length;
    var fonts = {}, deff = 0, maxFont = -1, newFont = -1, symFont = -1;
    var st = { font: -1, uc: 1, skip: false, dest: '', fs: 24, b: false, it: false, afs: 0, ab: false, ai: false };
    var stack = [];
    var buf = [];              // pending text tokens {ch, raw}
    var fontName = '';         // font table entry accumulator
    var fontNameRaw = '';
    var groupStart = false;    // just after '{'
    var stats = { runs: 0, styles: 0 };

    function copyState(o) { var c = {}; for (var k in o) c[k] = o[k]; return c; }
    function curFont() { return st.font >= 0 ? st.font : deff; }

    function flush() {
      if (!buf.length) return;
      var text = '', raw = '', k;
      for (k = 0; k < buf.length; k++) { text += buf[k].ch; raw += buf[k].raw; }
      var f = fonts[curFont()], fname = f ? f.name : '';
      if (dir === 'b2u') {
        if (/^symbol$/i.test(fname) && /[\u00B4\uF0B4\u00B8\uF0B8]/.test(text)) {
          stats.runs++;
          var su = E_.symbolToUnicode(text);
          var spre = '{\\af' + curFont() + (st.fs ? '\\afs' + st.fs : '') + (st.b ? '\\ab' : '') + (st.it ? '\\ai' : '') + ' ';
          out.push(spre + encUnicode(su, st.uc) + '}');
        } else if ((allText || E_.isBijoyFont(fname)) && !E_.hasBengali(text) && /\S/.test(text)) {
          stats.runs++;
          var u = E_.bijoyToUnicode(text);
          var pre = '{\\af' + curFont() + (st.fs ? '\\afs' + st.fs : '') + (st.b ? '\\ab' : '') + (st.it ? '\\ai' : '') + ' ';
          out.push(pre + encUnicode(u, st.uc) + '}');
        } else out.push(raw);
      } else {
        if (E_.hasU2B(text)) {
          stats.runs++;
          var segs = E_.unicodeToBijoySegments(text), size = st.afs || st.fs;
          for (k = 0; k < segs.length; k++) {
            var sg = segs[k];
            if (sg.bijoy || sg.symbol) {
              var fid = sg.symbol ? symFont : newFont;
              out.push('{\\f' + fid + (size ? '\\fs' + size : '') + ((st.ab || st.b) ? '\\b' : '') + ((st.ai || st.it) ? '\\i' : '') +
                ' ' + encAnsi(sg.text) + '}');
            } else out.push(encUnicode(sg.text, st.uc));
          }
        } else out.push(raw);
      }
      buf = [];
    }

    function emitText(ch, raw) {
      groupStart = false;
      if (st.skip) { out.push(raw); return; }
      if (st.dest === 'fonttbl') {
        if (ch === ';') {
          var name = fontName.trim();
          fonts[st.font] = { name: name };
          if (st.font > maxFont) maxFont = st.font;
          if (dir === 'b2u' && E_.isBijoyFont(name)) { out.push(encUnicode(opts.unicodeFont, 0) + ';'); stats.styles++; }
          else out.push(fontNameRaw + ';');
          fontName = ''; fontNameRaw = '';
        } else { fontName += ch; fontNameRaw += raw; }
        return;
      }
      buf.push({ ch: ch, raw: raw });
    }

    function skipFallback(count) {
      // skip `count` fallback characters after \uN
      var raw = '';
      while (count > 0 && i < n) {
        var c = s[i];
        if (c === '\\' && s[i + 1] === "'") { raw += s.substr(i, 4); i += 4; count--; }
        else if (c === '{' || c === '}' || c === '\\') break;
        else if (c === '\r' || c === '\n') { raw += c; i++; }
        else { raw += c; i++; count--; }
      }
      return raw;
    }

    while (i < n) {
      var c = s[i];
      if (c === '{') {
        flush();
        stack.push(st); st = copyState(st);
        out.push('{'); i++; groupStart = true;
        continue;
      }
      if (c === '}') {
        flush();
        if (st.dest === 'fonttbl' && stack.length && stack[stack.length - 1].dest !== 'fonttbl' && dir === 'u2b') {
          newFont = Math.max(maxFont + 1, 0);
          symFont = newFont + 1;
          out.push('{\\f' + newFont + '\\fnil\\fcharset0 ' + opts.bijoyFont + ';}{\\f' + symFont + '\\fnil\\fcharset2 Symbol;}');
          fonts[newFont] = { name: opts.bijoyFont };
          fonts[symFont] = { name: 'Symbol' };
        }
        st = stack.pop() || st;
        out.push('}'); i++; groupStart = false;
        continue;
      }
      if (c === '\r' || c === '\n') { out.push(c); i++; continue; }
      if (c !== '\\') {
        var code = c.charCodeAt(0);
        emitText(code >= 0x80 ? E_.cp1252Char(code) : c, c);
        i++;
        continue;
      }
      // control
      var nx = s[i + 1];
      if (nx === "'") {
        var hx = s.substr(i + 2, 2), byte = parseInt(hx, 16);
        emitText(E_.cp1252Char(byte), s.substr(i, 4));
        i += 4;
        continue;
      }
      if (nx === '\\' || nx === '{' || nx === '}') { emitText(nx, '\\' + nx); i += 2; continue; }
      if (nx === '~') { emitText('\u00A0', '\\~'); i += 2; continue; }
      if (nx === '*') { flush(); st.skip = true; out.push('\\*'); i += 2; continue; }
      if (nx === '\r' || nx === '\n') { flush(); out.push('\\' + nx); i += 2; continue; }
      if (!/[a-zA-Z]/.test(nx || '')) { flush(); out.push('\\' + (nx || '')); i += 2; continue; }

      var m = /^\\([a-zA-Z]{1,32})(-?\d{1,10})? ?/.exec(s.substr(i, 48));
      var word = m[1], param = m[2] !== undefined ? parseInt(m[2], 10) : null, raw = m[0];
      i += raw.length;
      var wasGroupStart = groupStart;
      groupStart = false;

      if (word === 'bin' && param > 0) { flush(); out.push(raw + s.substr(i, param)); i += param; continue; }
      if (word === 'u' && param !== null) {
        var fbRaw = skipFallback(st.uc);
        emitText(String.fromCharCode(param < 0 ? param + 65536 : param), raw + fbRaw);
        continue;
      }
      if (CHAR_WORDS[word] && !st.skip && st.dest !== 'fonttbl') { emitText(CHAR_WORDS[word], raw); continue; }

      flush();
      if (wasGroupStart && SKIP_DEST[word]) st.skip = true;
      switch (word) {
        case 'fonttbl': st.dest = 'fonttbl'; break;
        case 'deff': deff = param || 0; break;
        case 'f': st.font = param || 0; if (st.dest === 'fonttbl') { fontName = ''; fontNameRaw = ''; } break;
        case 'uc': st.uc = param || 0; break;
        case 'fs': st.fs = param || 24; break;
        case 'afs': st.afs = param || 0; break;
        case 'b': st.b = param !== 0; break;
        case 'i': st.it = param !== 0; break;
        case 'ab': st.ab = param !== 0; break;
        case 'ai': st.ai = param !== 0; break;
        case 'plain': st.b = st.it = false; st.fs = 24; st.font = -1; break;
      }
      out.push(raw);
      if (BREAK_WORDS[word]) { /* run boundary — already flushed */ }
    }
    flush();
    return { data: binaryToBytes(out.join('')), stats: stats };
  }

  /* ------------------------------------------------------------------ TXT */
  function decodeText(u8) {
    if (u8[0] === 0xEF && u8[1] === 0xBB && u8[2] === 0xBF) return new TextDecoder('utf-8').decode(u8.subarray(3));
    if (u8[0] === 0xFF && u8[1] === 0xFE) return new TextDecoder('utf-16le').decode(u8.subarray(2));
    if (u8[0] === 0xFE && u8[1] === 0xFF) return new TextDecoder('utf-16be').decode(u8.subarray(2));
    try { return new TextDecoder('utf-8', { fatal: true }).decode(u8); }
    catch (e) {
      var s = '';
      for (var i = 0; i < u8.length; i++) s += E().cp1252Char(u8[i]);
      return s;
    }
  }
  function encodeAnsi(str) {
    var u8 = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) { var b = E().cp1252Byte(str[i]); u8[i] = b < 0 ? 0x3F : b; }
    return u8;
  }
  function convertTxt(bytes, opts) {
    var text = decodeText(bytes);
    if (opts.direction === 'b2u') {
      var u = E().bijoyToUnicode(text);
      var enc = new TextEncoder().encode(u), outB = new Uint8Array(enc.length + 3);
      outB.set([0xEF, 0xBB, 0xBF]); outB.set(enc, 3);
      return { data: outB, stats: { runs: 1, styles: 0 } };
    }
    return { data: encodeAnsi(E().unicodeToBijoy(text)), stats: { runs: 1, styles: 0 } };
  }

  var api = { convertRtf: convertRtf, convertTxt: convertTxt, decodeText: decodeText };
  root.TextFormats = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this));
