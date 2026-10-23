/*!
 * TechHat Bijoy ⇄ Unicode Engine
 * ------------------------------------------------------------
 * Pure, dependency-free conversion core. Works in browsers (classic
 * <script>, so it also runs from file://), Web Workers and Node.
 *
 * Bijoy (SutonnyMJ family) stores Bangla as *visual glyph order* in the
 * Windows-1252 code page, while Unicode stores *logical order*.
 * Conversion therefore needs, beyond a glyph table:
 *   - pre-base vowel signs  (ি ে ৈ ো ৌ) moved across the whole conjunct
 *   - reph (র্) moved from after the cluster to before it
 *   - phala / kar ordering  (e.g. "we`y¨r" → বিদ্যুৎ)
 *   - chandrabindu ordering and ো/ৌ composition
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BijoyEngine = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var HASANTA = '\u09CD';
  var ZWJ = '\u200D';
  var ZWNJ = '\u200C';
  var NUKTA = '\u09BC';
  var RRA = '\u09DC'; // ড়
  var RHA = '\u09DD'; // ঢ়
  var YYA = '\u09DF'; // য়

  // Private-use markers used during Bijoy → Unicode reordering
  var M_I = '\uE000';    // ি  (pre-base)
  var M_E = '\uE001';    // ে  (pre-base)
  var M_OI = '\uE002';   // ৈ  (pre-base)
  var M_REPH = '\uE003'; // র্ (reph, typed after the cluster)

  var CONSONANT_LIST = 'কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ' + RRA + RHA + YYA;
  var CONSONANTS = {};
  for (var ci = 0; ci < CONSONANT_LIST.length; ci++) CONSONANTS[CONSONANT_LIST[ci]] = true;

  var KARS = { 'া': 1, 'ি': 1, 'ী': 1, 'ু': 1, 'ূ': 1, 'ৃ': 1, 'ৄ': 1, 'ে': 1, 'ৈ': 1, 'ো': 1, 'ৌ': 1, 'ৗ': 1 };
  var POST_KARS = { 'া': 1, 'ী': 1, 'ু': 1, 'ূ': 1, 'ৃ': 1, 'ৗ': 1 };
  var PRE_KARS = { 'ি': 1, 'ে': 1, 'ৈ': 1, 'ো': 1, 'ৌ': 1 };
  var MODIFIERS = { 'ঁ': 1, 'ং': 1, 'ঃ': 1 };

  function isConsonant(c) { return CONSONANTS[c] === true; }
  function isKar(c) { return KARS[c] === 1; }

  /* ------------------------------------------------------------------
   * Windows-1252 helpers (Bijoy text is cp1252 glyph codes)
   * ------------------------------------------------------------------ */
  var CP1252_HIGH = {
    0x80: '\u20AC', 0x82: '\u201A', 0x83: '\u0192', 0x84: '\u201E', 0x85: '\u2026', 0x86: '\u2020',
    0x87: '\u2021', 0x88: '\u02C6', 0x89: '\u2030', 0x8A: '\u0160', 0x8B: '\u2039', 0x8C: '\u0152',
    0x8E: '\u017D', 0x91: '\u2018', 0x92: '\u2019', 0x93: '\u201C', 0x94: '\u201D', 0x95: '\u2022',
    0x96: '\u2013', 0x97: '\u2014', 0x98: '\u02DC', 0x99: '\u2122', 0x9A: '\u0161', 0x9B: '\u203A',
    0x9C: '\u0153', 0x9E: '\u017E', 0x9F: '\u0178'
  };
  var CP1252_REVERSE = {};
  Object.keys(CP1252_HIGH).forEach(function (k) { CP1252_REVERSE[CP1252_HIGH[k]] = +k; });

  /** Byte (0-255) → the character Windows-1252 assigns to it. */
  function cp1252Char(byte) {
    if (byte >= 0x80 && byte <= 0x9F && CP1252_HIGH[byte]) return CP1252_HIGH[byte];
    return String.fromCharCode(byte);
  }
  /** Character → Windows-1252 byte, or -1 if not representable. */
  function cp1252Byte(ch) {
    var c = ch.charCodeAt(0);
    if (c < 0x80 || (c >= 0xA0 && c <= 0xFF)) return c;
    if (CP1252_REVERSE[ch] !== undefined) return CP1252_REVERSE[ch];
    if (c >= 0x80 && c <= 0x9F) return c; // undefined slots kept as-is
    return -1;
  }
  /** Text that was decoded as ISO-8859-1 has C1 controls where cp1252 has glyphs. */
  function normalizeC1(s) {
    return s.replace(/[\u0080-\u009F]/g, function (ch) {
      return CP1252_HIGH[ch.charCodeAt(0)] || ch;
    });
  }

  /* ------------------------------------------------------------------
   * Glyph table: Bijoy (SutonnyMJ) → Unicode
   * ------------------------------------------------------------------ */
  var B2U = {
    // independent vowels
    'A': 'অ', 'B': 'ই', 'C': 'ঈ', 'D': 'উ', 'E': 'ঊ', 'F': 'ঋ', 'G': 'এ', 'H': 'ঐ', 'I': 'ও', 'J': 'ঔ',
    // consonants
    'K': 'ক', 'L': 'খ', 'M': 'গ', 'N': 'ঘ', 'O': 'ঙ', 'P': 'চ', 'Q': 'ছ', 'R': 'জ', 'S': 'ঝ', 'T': 'ঞ',
    'U': 'ট', 'V': 'ঠ', 'W': 'ড', 'X': 'ঢ', 'Y': 'ণ', 'Z': 'ত', '_': 'থ', '`': 'দ', 'a': 'ধ', 'b': 'ন',
    'c': 'প', 'd': 'ফ', 'e': 'ব', 'f': 'ভ', 'g': 'ম', 'h': 'য', 'i': 'র', 'j': 'ল', 'k': 'শ', 'l': 'ষ',
    'm': 'স', 'n': 'হ', 'o': RRA, 'p': RHA, 'q': YYA, 'r': 'ৎ', 's': 'ং', 't': 'ঃ', 'u': 'ঁ',
    // post-base vowel signs (all glyph variants)
    'v': 'া', 'x': 'ী', 'y': 'ু', 'z': 'ু', '\u201C': 'ু', '\u2013': 'ু', '\u00E6': 'ু',
    '~': 'ূ', '\u201A': 'ূ', '\u0192': 'ূ', '\u201E': 'ৃ', '\u2026': 'ৃ', '\u0160': 'ৗ',
    // digits
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
    // punctuation & signs
    '|': '।', '&': HASANTA + ZWNJ, '$': '৳', '\u00B4': '×', '\uF0B4': '×',
    '\u00D1': '—', '\u00D2': '“', '\u00D3': '”', '\u00D4': '‘', '\u00D5': '’',
    // phala / right-side conjunct parts
    '^': '্ব', '\u00A1': '্ব', '\u00A6': '্ব', '\u0178': '্ব',
    '\u00A8': '্য',
    '\u00AA': '্র', '\u00AB': '্র', '\u00D6': '্র',
    '\u00AC': '্ল', '\u00AD': '্ল', '\u00F8': '্ল',
    '\u00A5': '্ম', '\u00A7': '্ম',
    '\u0153': '্ন', '\u00E8': '্ণ',
    '\u2039': '্ক', '\u0152': '্ক্র', '\u2014': '্ত', '\u00CD': '্ত', '\u2018': '্তু', '\u00BF': '্ত্র',
    '\u2019': '্থ', '\u00FA': '্প', '\u00A2': '্ভ', '\u00A3': '্ভ্র',
    // left-side half forms
    '\u00AE': 'ষ্', '\u00AF': 'স্', '\u00A4': 'ম্', '\u0161': 'ন্', '\u203A': 'ন্',
    '\u02DC': 'দ্', '\u2122': 'দ্', '\u201D': 'চ্', '\u2022': 'ঙ্',
    // complete conjunct glyphs
    '\u00B0': 'ক্ক', '\u00B1': 'ক্ট', '\u00B2': 'ক্ষ্ম', '\u00B3': 'ক্ত', '\u00B5': 'ক্র', '\u00B6': 'ক্ষ',
    '\u00FF': 'ক্ষ', '\u00B7': 'ক্স', '\u00B8': 'গু', '\u00BB': 'গ্ধ', '\u00BC': 'ঙ্ক', '\u00BD': 'ঙ্গ',
    '\u00BE': 'জ্জ', '\u00C0': 'জ্ঝ', '\u00C1': 'জ্ঞ', '\u00C2': 'ঞ্চ', '\u00C3': 'ঞ্ছ', '\u00C4': 'ঞ্জ',
    '\u00C5': 'ঞ্ঝ', '\u00C6': 'ট্ট', '\u00C7': 'ড্ড', '\u00C8': 'ণ্ট', '\u00C9': 'ণ্ঠ', '\u00CA': 'ণ্ড', '\u00D0': 'ণ্ড',
    '\u00CB': 'ত্ত', '\u00CC': 'ত্থ', '\u00CE': 'ত্র', '\u00CF': 'দ্দ', '\u00D7': 'দ্ধ', '\u00D8': 'দ্ব',
    '\u00D9': 'দ্ম', '\u00DA': 'ন্ঠ', '\u00DB': 'ন্ড', '\u00DC': 'ন্ধ', '\u00DD': 'ন্স', '\u00DE': 'প্ট',
    '\u00DF': 'প্ত', '\u00E0': 'প্প', '\u00E1': 'প্স', '\u00E2': 'ব্জ', '\u00E3': 'ব্দ', '\u00E4': 'ব্ধ',
    '\u00E5': 'ভ্র', '\u00E7': 'ম্ফ', '\u00E9': 'ল্ক', '\u00EA': 'ল্গ', '\u00EB': 'ল্ট', '\u00EC': 'ল্ড',
    '\u00ED': 'ল্প', '\u00EE': 'ল্ফ', '\u00EF': 'শু', '\u00F0': 'শ্চ', '\u00F1': 'শ্ছ', '\u00F2': 'ষ্ণ',
    '\u00F3': 'ষ্ট', '\u00F4': 'ষ্ঠ', '\u00F5': 'ষ্ফ', '\u00F6': 'স্খ', '\u00F7': 'স্ট', '\u00F9': 'স্ফ',
    '\u00FB': 'হু', '\u00FC': 'হৃ', '\u00FD': 'হ্ন', '\u00FE': 'হ্ম'
  };
  // pre-base signs and reph become markers first
  var B2U_MARKERS = {
    'w': M_I,
    '\u2020': M_E, '\u2021': M_E,      // † ‡
    '\u2030': M_OI, '\u02C6': M_OI,    // ‰ ˆ
    '\u00A9': M_REPH                   // ©
  };
  var MARKER_KAR = {};
  MARKER_KAR[M_I] = 'ি'; MARKER_KAR[M_E] = 'ে'; MARKER_KAR[M_OI] = 'ৈ';

  function isPreMarker(c) { return c === M_I || c === M_E || c === M_OI; }

  /** Index just past a consonant cluster starting at j (C (্C)* incl. ZWJ ya-phala). */
  function clusterEnd(a, j) {
    var k = j + 1;
    if (a[k] === NUKTA) k++;
    for (;;) {
      if (a[k] === HASANTA && isConsonant(a[k + 1])) { k += 2; }
      else if (a[k] === ZWJ && a[k + 1] === HASANTA && isConsonant(a[k + 2])) { k += 3; }
      else if (a[k] === HASANTA && a[k + 1] === ZWJ && isConsonant(a[k + 2])) { k += 3; }
      else break;
      if (a[k] === NUKTA) k++;
    }
    return k;
  }

  /**
   * Bijoy (SutonnyMJ, ANSI) → Unicode.
   * Re-ordering never crosses whitespace, so each word is processed on its
   * own — this keeps the conversion linear even for multi-MB documents.
   * @param {string} input
   * @returns {string}
   */
  function bijoyToUnicode(input) {
    if (!input) return '';
    return normalizeC1(String(input)).replace(/[^\s]+/g, convertBijoyWord);
  }

  function convertBijoyWord(s) {
    var a = [];
    var i, j, c, u;

    // 1) glyph → code points (pre-base kars & reph as markers)
    for (i = 0; i < s.length; i++) {
      c = s[i];
      if (c === 'i' && s[i + 1] === '\u00A8') { a.push('র', ZWJ, HASANTA, 'য'); i++; continue; } // র‍্য
      if (c === 'A' && s[i + 1] === 'v') { a.push('আ'); i++; continue; }
      if (B2U_MARKERS[c]) { a.push(B2U_MARKERS[c]); continue; }
      u = B2U[c];
      if (u !== undefined) { for (j = 0; j < u.length; j++) a.push(u[j]); }
      else a.push(c);
    }

    // 2) half-form + right-part produce "্্" → collapse
    for (i = a.length - 1; i > 0; i--) {
      if (a[i] === HASANTA && a[i - 1] === HASANTA) a.splice(i, 1);
    }

    // 3) a post-base kar typed before a phala: "দু্য" → "দ্যু"
    var moved = true, guard = 0;
    while (moved && guard++ < 8) {
      moved = false;
      for (i = 0; i < a.length - 2; i++) {
        if (POST_KARS[a[i]] === 1 && a[i + 1] === HASANTA && isConsonant(a[i + 2]) && a[i + 3] !== ZWNJ) {
          var kar = a[i];
          a[i] = HASANTA; a[i + 1] = a[i + 2]; a[i + 2] = kar;
          moved = true;
        }
      }
    }

    // 4) pre-base kars → after the following consonant cluster
    for (i = 0; i < a.length; i++) {
      if (!isPreMarker(a[i])) continue;
      var karCh = MARKER_KAR[a[i]];
      j = i + 1;
      if (j < a.length && isConsonant(a[j])) {
        var end = clusterEnd(a, j);
        a.splice(i, 1);
        a.splice(end - 1, 0, karCh);
        i = end - 1;
      } else {
        a[i] = karCh;
      }
    }

    // 5) chandrabindu typed before a kar → after it
    for (i = 0; i < a.length - 1; i++) {
      if (a[i] === 'ঁ' && isKar(a[i + 1])) {
        a[i] = a[i + 1]; a[i + 1] = 'ঁ';
        if (i > 0) i -= 2;
      }
    }

    // 6) reph: typed after the cluster (and maybe after its kar) → before cluster
    for (i = 0; i < a.length; i++) {
      if (a[i] !== M_REPH) continue;
      a.splice(i, 1);
      var k = i - 1;
      while (k >= 0 && (isKar(a[k]) || a[k] === 'ঁ')) k--;
      if (k >= 0 && a[k] === NUKTA) k--;
      if (k >= 0 && isConsonant(a[k])) {
        for (;;) {
          if (k - 2 >= 0 && a[k - 1] === HASANTA && isConsonant(a[k - 2])) k -= 2;
          else if (k - 3 >= 0 && a[k - 1] === HASANTA && a[k - 2] === ZWJ && isConsonant(a[k - 3])) k -= 3;
          else break;
        }
        a.splice(k, 0, 'র', HASANTA);
      } else {
        a.splice(i, 0, 'র', HASANTA);
      }
      i += 1;
    }

    // 7) compose ো / ৌ, অ + া ; emit nukta letters in NFC (decomposed) form
    var out = a.join('');
    out = out
      .replace(/\u09C7\u09BE/g, '\u09CB')
      .replace(/\u09C7\u09D7/g, '\u09CC')
      .replace(/অা/g, 'আ')
      .replace(/\u09CD\u09CD+/g, HASANTA);
    if (!OPTIONS.precomposedNukta) {
      out = out.replace(/\u09DC/g, '\u09A1\u09BC').replace(/\u09DD/g, '\u09A2\u09BC').replace(/\u09DF/g, '\u09AF\u09BC');
    }
    return out;
  }

  var OPTIONS = { precomposedNukta: false };
  /** precomposedNukta:true → output U+09DC/09DD/09DF instead of NFC sequences. */
  function setOptions(o) { for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) OPTIONS[k] = o[k]; }

  /* ------------------------------------------------------------------
   * Unicode → Bijoy
   * ------------------------------------------------------------------ */
  var U2B_BASE = {
    'অ': 'A', 'আ': 'Av', 'ই': 'B', 'ঈ': 'C', 'উ': 'D', 'ঊ': 'E', 'ঋ': 'F', 'এ': 'G', 'ঐ': 'H', 'ও': 'I', 'ঔ': 'J',
    'ক': 'K', 'খ': 'L', 'গ': 'M', 'ঘ': 'N', 'ঙ': 'O', 'চ': 'P', 'ছ': 'Q', 'জ': 'R', 'ঝ': 'S', 'ঞ': 'T',
    'ট': 'U', 'ঠ': 'V', 'ড': 'W', 'ঢ': 'X', 'ণ': 'Y', 'ত': 'Z', 'থ': '_', 'দ': '`', 'ধ': 'a', 'ন': 'b',
    'প': 'c', 'ফ': 'd', 'ব': 'e', 'ভ': 'f', 'ম': 'g', 'য': 'h', 'র': 'i', 'ল': 'j', 'শ': 'k', 'ষ': 'l',
    'স': 'm', 'হ': 'n', 'ৎ': 'r', 'ং': 's', 'ঃ': 't', 'ঁ': 'u',
    'া': 'v', 'ি': 'w', 'ী': 'x', 'ু': 'y', 'ূ': '~', 'ৃ': '\u201E', 'ৄ': '\u201E', 'ে': '\u2020', 'ৈ': '\u02C6', 'ৗ': '\u0160',
    'ো': '\u2020v', 'ৌ': '\u2020\u0160',
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    '।': '|', '॥': '||', '৳': '$', '্': '&', 'ঽ': '&'
  };
  U2B_BASE[RRA] = 'o'; U2B_BASE[RHA] = 'p'; U2B_BASE[YYA] = 'q';

  // punctuation that must be remapped when it lives inside a Bijoy run
  var U2B_PUNCT = {
    '‘': '\u00D4', '’': '\u00D5', '“': '\u00D2', '”': '\u00D3', '—': '\u00D1', '–': '\u00D1', '…': '...'
  };

  // Conjunct glyphs (longest match wins). Keys are logical Unicode.
  var U2B_CONJ = {
    'ক্ক': '\u00B0', 'ক্ট': '\u00B1', 'ক্ত': '\u00B3', 'ক্র': '\u00B5', 'ক্ষ': '\u00B6', 'ক্স': '\u00B7',
    'ক্ব': 'K\u00A1', 'ক্ল': 'K\u00AC', 'ক্ষ্ণ': '\u00B6\u00E8',
    'গ্ধ': '\u00BB', 'গ্ন': 'M\u0153', 'গ্ম': 'M\u00A5', 'গ্ল': 'M\u00F8',
    'ঙ্ক': '\u00BC', 'ঙ্গ': '\u00BD', 'ঙ্খ': '\u2022L', 'ঙ্ঘ': '\u2022N', 'ঙ্ক্ষ': '\u2022\u00B6', 'ঙ্ম': '\u2022g',
    'চ্চ': '\u201DP', 'চ্ছ': '\u201DQ', 'চ্ছ্ব': '\u201DQ\u00A1', 'চ্ঞ': '\u201DT',
    'জ্জ': '\u00BE', 'জ্জ্ব': '\u00BE\u00A1', 'জ্ঝ': '\u00C0', 'জ্ঞ': '\u00C1', 'জ্ব': 'R\u00A1',
    'ঞ্চ': '\u00C2', 'ঞ্ছ': '\u00C3', 'ঞ্জ': '\u00C4', 'ঞ্ঝ': '\u00C5',
    'ট্ট': '\u00C6', 'ট্ব': 'U\u00A1', 'ট্ম': 'U\u00A5', 'ড্ড': '\u00C7',
    'ণ্ট': '\u00C8', 'ণ্ঠ': '\u00C9', 'ণ্ড': '\u00D0', 'ণ্ব': 'Y^',
    'ত্ত': '\u00CB', 'ত্ত্ব': '\u00CB\u00A1', 'ত্থ': '\u00CC', 'ত্ন': 'Z\u0153', 'ত্ম': 'Z\u00A5', 'ত্ব': 'Z\u00A1', 'ত্র': '\u00CE',
    'থ্ব': '_\u00A1',
    'দ্গ': '\u02DCM', 'দ্ঘ': '\u02DCN', 'দ্দ': '\u00CF', 'দ্ধ': '\u00D7', 'দ্ব': '\u00D8', 'দ্ভ': '\u2122\u00A2', 'দ্ম': '\u00D9',
    'ধ্ব': 'a\u0178', 'ধ্ম': 'a\u00A5',
    'ন্ট': '\u203AU', 'ন্ঠ': '\u00DA', 'ন্ড': '\u00DB', 'ন্ত': '\u0161\u00CD', 'ন্ত্র': '\u0161\u00BF', 'ন্ত্ব': '\u0161\u00CD\u00A1',
    'ন্থ': '\u0161\u2019', 'ন্দ': '\u203A`', 'ন্দ্ব': '\u203A\u00D8', 'ন্ধ': '\u00DC', 'ন্ন': 'b\u0153', 'ন্ব': '\u0161^',
    'ন্ম': 'b\u00A5', 'ন্স': '\u00DD', 'ন্ট্র': '\u203AU\u00AA', 'ন্ড্র': '\u00DB\u00AA', 'ন্দ্র': '\u203A`\u00AA',
    'প্ট': '\u00DE', 'প্ত': '\u00DF', 'প্ন': 'c\u0153', 'প্প': '\u00E0', 'প্ল': 'c\u00F8', 'প্স': '\u00E1',
    'ফ্ল': 'd\u00AC',
    'ব্জ': '\u00E2', 'ব্দ': '\u00E3', 'ব্ধ': '\u00E4', 'ব্ব': 'e\u0178', 'ব্ল': 'e\u00F8',
    'ভ্র': '\u00E5',
    'ম্ন': 'g\u0153', 'ম্প': '\u00A4\u00FA', 'ম্ফ': '\u00E7', 'ম্ব': '\u00A4^', 'ম্ভ': '\u00A4\u00A2', 'ম্ভ্র': '\u00A4\u00A3',
    'ম্ম': '\u00A4\u00A7', 'ম্ল': '\u00A4\u00F8',
    'র\u200D্য': 'i\u00A8',
    'ল্ক': '\u00E9', 'ল্গ': '\u00EA', 'ল্ট': '\u00EB', 'ল্ড': '\u00EC', 'ল্প': '\u00ED', 'ল্ফ': '\u00EE',
    'ল্ব': 'j\u00A6', 'ল্ম': 'j\u00A5', 'ল্ল': 'j\u00F8',
    'শ্চ': '\u00F0', 'শ্ছ': '\u00F1', 'শ্ন': 'k\u0153', 'শ্ব': 'k\u00A6', 'শ্ম': 'k\u00A5', 'শ্ল': 'k\u00F8',
    'ষ্ক': '\u00AE\u2039', 'ষ্ক্র': '\u00AE\u0152', 'ষ্ট': '\u00F3', 'ষ্ঠ': '\u00F4', 'ষ্ণ': '\u00F2', 'ষ্প': '\u00AE\u00FA',
    'ষ্ফ': '\u00F5', 'ষ্ম': '\u00AE\u00A7', 'ষ্ট্র': '\u00F3\u00AA',
    'স্ক': '\u00AF\u2039', 'স্ক্র': '\u00AF\u0152', 'স্খ': '\u00F6', 'স্ট': '\u00F7', 'স্ত': '\u00AF\u00CD', 'স্ত্র': '\u00AF\u00BF',
    'স্থ': '\u00AF\u2019', 'স্ন': 'm\u0153', 'স্প': '\u00AF\u00FA', 'স্ফ': '\u00F9', 'স্ব': '\u00AF^', 'স্ম': '\u00AF\u00A7', 'স্ল': '\u00AF\u00F8',
    'হ্ণ': 'n\u00E8', 'হ্ন': '\u00FD', 'হ্ম': '\u00FE', 'হ্ব': 'n\u0178', 'হ্ল': 'n\u00AC'
  };
  // conjunct + u/uu/ri-kar fused glyphs
  var U2B_FUSED = {
    'গু': '\u00B8', 'শু': '\u00EF', 'হু': '\u00FB', 'হৃ': '\u00FC', 'রু': 'i\u00E6', 'রূ': 'i\u0192',
    'ন্তু': '\u0161\u2018', 'স্তু': '\u00AF\u2018', 'দ্রু': '`\u00AA\u2013'
  };
  var CONJ_MAX = 0;
  Object.keys(U2B_CONJ).forEach(function (k) { if (k.length > CONJ_MAX) CONJ_MAX = k.length; });

  var HALF = { 'স': '\u00AF', 'ষ': '\u00AE', 'ম': '\u00A4', 'ন': '\u203A', 'দ': '\u02DC', 'চ': '\u201D', 'ঙ': '\u2022' };
  var RIGHT = { 'ক': '\u2039', 'ত': '\u00CD', 'থ': '\u2019', 'প': '\u00FA', 'ভ': '\u00A2', 'ণ': '\u00E8' };
  // consonants with a right stem take the "Ö" ra-phala, the rest "ª"
  var RA_PHALA_STEM = { 'খ': 1, 'গ': 1, 'ঘ': 1, 'ঝ': 1, 'ণ': 1, 'থ': 1, 'ধ': 1, 'ন': 1, 'প': 1, 'ফ': 1, 'ব': 1, 'ম': 1, 'য': 1, 'শ': 1, 'ষ': 1, 'স': 1 };
  var BA_PHALA = { 'ক': '\u00A1', 'জ': '\u00A1', 'ট': '\u00A1', 'ত': '\u00A1', 'থ': '\u00A1', 'ধ': '\u0178', 'ব': '\u0178', 'হ': '\u0178', 'ল': '\u00A6', 'শ': '\u00A6' };
  var LA_PHALA = { 'গ': '\u00F8', 'ল': '\u00F8', 'শ': '\u00F8', 'প': '\u00F8', 'ব': '\u00F8', 'ম': '\u00F8', 'স': '\u00F8' };

  function phalaGlyph(x, prev) {
    switch (x) {
      case 'য': return '\u00A8';
      case 'র': return RA_PHALA_STEM[prev] ? '\u00D6' : '\u00AA';
      case 'ব': return BA_PHALA[prev] || '^';
      case 'ম': return '\u00A5';
      case 'ন': return '\u0153';
      case 'ল': return LA_PHALA[prev] || '\u00AC';
    }
    return null;
  }

  /** Render a consonant cluster (no reph, no kar) to Bijoy glyphs. */
  function renderCluster(s) {
    var out = '', i = 0, prev = '', len, key, m, ch, x;
    while (i < s.length) {
      m = null;
      for (len = Math.min(CONJ_MAX, s.length - i); len >= 2; len--) {
        key = s.substr(i, len);
        if (U2B_CONJ[key] !== undefined) { m = key; break; }
      }
      if (m) {
        out += U2B_CONJ[m];
        prev = m[m.length - 1];
        i += m.length;
        continue;
      }
      ch = s[i];
      if (isConsonant(ch) && s[i + 1] === HASANTA && isConsonant(s[i + 2])) {
        x = s[i + 2];
        var ph = phalaGlyph(x, ch);
        if (ph) { out += U2B_BASE[ch] + ph; prev = x; i += 3; continue; }
        if (HALF[ch]) { out += HALF[ch]; prev = ch; i += 2; continue; }
        out += U2B_BASE[ch] + '&'; prev = ch; i += 2; continue;
      }
      if (ch === HASANTA) {
        x = s[i + 1];
        if (isConsonant(x)) {
          var p2 = phalaGlyph(x, prev);
          if (p2) { out += p2; prev = x; i += 2; continue; }
          if (RIGHT[x]) { out += RIGHT[x]; prev = x; i += 2; continue; }
        }
        out += '&'; i += 1;
        if (s[i] === ZWNJ || s[i] === ZWJ) i++;
        continue;
      }
      if (ch === ZWJ || ch === ZWNJ) { i++; continue; }
      out += U2B_BASE[ch] !== undefined ? U2B_BASE[ch] : ch;
      if (isConsonant(ch)) prev = ch;
      i++;
    }
    return { glyphs: out, last: prev, raPhala: /র$/.test(s) };
  }

  // consonants without a right vertical stem take left-shifted ৃ (\u2026) and ূ (\u201A);
  // consonants with a right stem take stem-joining ৃ (\u201E) and ূ (~)
  var KAR_NO_STEM = { 'ক': 1, 'ছ': 1, 'জ': 1, 'ট': 1, 'ঠ': 1, 'ড': 1, 'ঢ': 1, 'ত': 1, 'ফ': 1, 'ভ': 1 };
  KAR_NO_STEM[RRA] = 1; KAR_NO_STEM[RHA] = 1;
  var CONJ_STEM = { 'স্ত': 1, 'ন্ত': 1, 'প্ত': 1 };

  function karGlyph(kar, cluster) {
    var last = cluster[cluster.length - 1];
    if (cluster.length > 1 && last === 'র' && kar === 'ু') return '\u2013';
    var noStem = KAR_NO_STEM[last] === 1 && !CONJ_STEM[cluster];
    if (kar === 'ৃ' || kar === 'ৄ') return noStem ? '\u2026' : '\u201E';
    if (kar === 'ূ') return noStem ? '\u201A' : '~';
    return U2B_BASE[kar] || kar;
  }

  /**
   * One syllable: [reph] cluster [kar] [modifiers] → Bijoy visual order.
   * At the beginning of a word (!inWord), ে/ো/ৌ and ৈ take the matra-less
   * glyphs (\u2020 = †, \u02C6 = ˆ); inside a word (inWord), they take the
   * matra-bearing glyphs (\u2021 = ‡, \u2030 = ‰) to continue the headline.
   */
  function renderSyllable(reph, cluster, kar, mods, inWord) {
    var pre = '', post = '', body, karG = '', fusedDone = false;
    var eKar = inWord ? '\u2021' : '\u2020';
    var oiKar = inWord ? '\u2030' : '\u02C6';
    if (kar === 'ি') pre = 'w';
    else if (kar === 'ে') pre = eKar;
    else if (kar === 'ৈ') pre = oiKar;
    else if (kar === 'ো') { pre = eKar; post = 'v'; }
    else if (kar === 'ৌ') { pre = eKar; post = '\u0160'; }

    if (kar && !pre) {
      // fused u/uu/ri forms: find longest cluster suffix with a fused glyph
      for (var cut = 0; cut < cluster.length; cut++) {
        if (cut > 0 && cluster[cut - 1] === HASANTA) continue; // suffix must start a new letter, not a phala
        var suffix = cluster.slice(cut);
        if (U2B_FUSED[suffix + kar] !== undefined) {
          body = (cut > 0 ? renderCluster(cluster.slice(0, cut)).glyphs : '') + U2B_FUSED[suffix + kar];
          fusedDone = true;
          break;
        }
      }
      if (!fusedDone) { body = renderCluster(cluster).glyphs; karG = karGlyph(kar, cluster); }
    } else {
      body = renderCluster(cluster).glyphs;
      karG = post;
    }

    var R = reph ? '\u00A9' : '';
    var res;
    if (fusedDone) res = body + R;
    else if (kar === 'ী' || kar === 'ৌ') res = pre + body + karG + R;
    else res = pre + body + R + karG;
    for (var mi = 0; mi < mods.length; mi++) res += U2B_BASE[mods[mi]] || mods[mi];
    return res;
  }

  function normalizeUnicode(s) {
    return String(s)
      .replace(/\u09A1\u09BC/g, RRA)
      .replace(/\u09A2\u09BC/g, RHA)
      .replace(/\u09AF\u09BC/g, YYA)
      .replace(/\u09C7\u09BE/g, '\u09CB')
      .replace(/\u09C7\u09D7/g, '\u09CC')
      .replace(/অা/g, 'আ')
      .replace(/\u09A4\u09CD\u200D/g, 'ৎ')
      .replace(/র\u200C\u09CD/g, 'র\u200D\u09CD')
      .replace(/\u09CD\u098B/g, '\u09C3')
      .replace(/[\u200C\u200D]+([\u0981-\u0983\u09BE-\u09CC\u09D7])/g, '$1')
      .replace(/([\u0981-\u0983])([\u09BE-\u09CC\u09D7])/g, '$2$1'); // modifier typed before kar
  }

  function isBnWordChar(code) {
    return (code >= 0x0980 && code <= 0x09FF) || code === 0x200C || code === 0x200D;
  }

  /** Convert a pure Bengali string (no foreign text) to Bijoy. */
  function convertBengaliRun(s, inWordStart) {
    var out = '', i = 0, n = s.length, ch;
    while (i < n) {
      ch = s[i];
      if (isConsonant(ch)) {
        var inWord = i === 0 ? !!inWordStart : isBnWordChar(s.charCodeAt(i - 1));
        var reph = false;
        if (ch === 'র' && s[i + 1] === HASANTA && isConsonant(s[i + 2])) { reph = true; i += 2; }
        var cluster = s[i]; i++;
        if (s[i] === NUKTA) { cluster += NUKTA; i++; }
        for (;;) {
          if (s[i] === HASANTA && isConsonant(s[i + 1])) { cluster += HASANTA + s[i + 1]; i += 2; }
          else if (s[i] === ZWJ && s[i + 1] === HASANTA && isConsonant(s[i + 2])) { cluster += ZWJ + HASANTA + s[i + 2]; i += 3; }
          else if (s[i] === HASANTA && s[i + 1] === ZWJ && isConsonant(s[i + 2])) { cluster += HASANTA + ZWJ + s[i + 2]; i += 3; }
          else break;
          if (s[i] === NUKTA) { cluster += NUKTA; i++; }
        }
        if (s[i] === HASANTA) { // explicit / word-final hasanta
          cluster += HASANTA; i++;
          if (s[i] === ZWNJ || s[i] === ZWJ) i++;
        }
        var kar = '';
        if (isKar(s[i])) { kar = s[i]; i++; }
        var mods = '';
        while (MODIFIERS[s[i]] === 1) { mods += s[i]; i++; }
        out += renderSyllable(reph, cluster.replace(/\u09BC/g, ''), kar, mods, inWord);
        continue;
      }
      if (ch === HASANTA && isConsonant(s[i + 1])) { // orphan phala, e.g. অ্যা
        var g = phalaGlyph(s[i + 1], '');
        if (g) { out += g; i += 2; continue; }
      }
      if (ch === ZWJ || ch === ZWNJ || ch === NUKTA) { i++; continue; }
      if (U2B_BASE[ch] !== undefined) { out += U2B_BASE[ch]; i++; continue; }
      if (U2B_PUNCT[ch] !== undefined) { out += U2B_PUNCT[ch]; i++; continue; }
      out += ch; i++;
    }
    return out;
  }

  function isBengaliChar(c) {
    var code = c.charCodeAt(0);
    return (code >= 0x0980 && code <= 0x09FF) || code === 0x0964 || code === 0x0965 || code === 0x200C || code === 0x200D
      || c === '(' || c === ')' || c === '/' || c === '=';
  }
  // characters that must be rendered with the Symbol font in Bijoy documents
  var U2B_SYMBOL = { '\u00D7': '\u00B4' };
  var S2U_SYMBOL = { '\u00B4': '\u00D7', '\uF0B4': '\u00D7', '\u00B8': '\u00F7', '\uF0B8': '\u00F7' };
  function isSymbolChar(c) { return U2B_SYMBOL[c] !== undefined; }
  function convertSymbolRun(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) out += U2B_SYMBOL[s[i]] || s[i];
    return out;
  }
  function symbolToUnicode(s) {
    return String(s).replace(/[\u00B4\uF0B4\u00B8\uF0B8]/g, function (c) { return S2U_SYMBOL[c] || c; });
  }
  // characters that render the same in SutonnyMJ (or are remapped by U2B_PUNCT)
  var NEUTRAL = ' \u00A0\t\n\r,.?!:;\'"-+‘’“”–—…';
  function isNeutral(c) { return NEUTRAL.indexOf(c) !== -1; }
  function isPureNeutral(s) {
    if (!s) return false;
    for (var i = 0; i < s.length; i++) if (!isNeutral(s[i])) return false;
    return true;
  }

  /**
   * Unicode → Bijoy, keeping track of which parts are Bangla or Symbol.
   * Non-Bangla text (English, digits, etc.) is returned untouched with
   * bijoy:false so callers can keep it in its original font.
   * Multiplication sign (×) is returned with symbol:true (for Symbol font).
   * @returns {{text:string, bijoy:boolean, symbol?:boolean}[]}
   */
  function unicodeToBijoySegments(input, inWordStart) {
    if (!input) return [];
    var s = normalizeUnicode(input);
    // 1) classify into runs B (Bangla) / S (Symbol) / N (neutral) / O (other)
    var runs = [], cur = null, i, t;
    for (i = 0; i < s.length; i++) {
      var c = s[i];
      t = isBengaliChar(c) ? 'B' : (isSymbolChar(c) ? 'S' : (isNeutral(c) ? 'N' : 'O'));
      if (cur && cur.t === t) cur.s += c;
      else { cur = { t: t, s: c }; runs.push(cur); }
    }
    // 2) neutral runs join Bangla/Symbol when not touching foreign text;
    //    between Bangla/Symbol and foreign text, punctuation glued to the
    //    Bangla side (“…” quotes, commas) stays with it, spaces go foreign.
    function isBS(x) { return x === 'B' || x === 'S'; }
    var fixed = [];
    for (i = 0; i < runs.length; i++) {
      var rn = runs[i];
      if (rn.t !== 'N') { fixed.push(rn); continue; }
      var L = runs[i - 1] ? runs[i - 1].t : null, R = runs[i + 1] ? runs[i + 1].t : null;
      if (L !== 'O' && R !== 'O' && (isBS(L) || isBS(R))) { fixed.push({ t: 'B', s: rn.s }); continue; }
      if (isBS(L) && R === 'O') {
        var mL = /^[^\s]*/.exec(rn.s)[0];
        if (mL) fixed.push({ t: 'B', s: mL });
        if (rn.s.length > mL.length) fixed.push({ t: 'O', s: rn.s.slice(mL.length) });
        continue;
      }
      if (L === 'O' && isBS(R)) {
        var mR = /[^\s]*$/.exec(rn.s)[0];
        if (rn.s.length > mR.length) fixed.push({ t: 'O', s: rn.s.slice(0, rn.s.length - mR.length) });
        if (mR) fixed.push({ t: 'B', s: mR });
        continue;
      }
      fixed.push({ t: 'O', s: rn.s });
    }
    runs = fixed;
    // 3) merge and convert
    var segs = [];
    for (i = 0; i < runs.length; i++) {
      var last = segs[segs.length - 1];
      if (last && last.t === runs[i].t) last.src += runs[i].s;
      else segs.push({ t: runs[i].t, src: runs[i].s });
    }
    return segs.map(function (g, idx) {
      if (g.t === 'B') return { bijoy: true, text: convertBengaliRun(g.src, idx === 0 && !!inWordStart) };
      if (g.t === 'S') return { bijoy: false, symbol: true, text: convertSymbolRun(g.src) };
      return { bijoy: false, text: g.src };
    });
  }

  /** Unicode → Bijoy (plain string). */
  function unicodeToBijoy(input) {
    return unicodeToBijoySegments(input).map(function (g) { return g.text; }).join('');
  }

  /* ------------------------------------------------------------------
   * Detection helpers
   * ------------------------------------------------------------------ */
  // । (U+0964) and ॥ (U+0965) live in the Devanagari block but are Bangla punctuation
  function hasBengali(s) { return /[\u0980-\u09FF\u0964\u0965]/.test(s); }
  // Characters that trigger Unicode → Bijoy conversion (includes /, (), =, ×)
  function hasU2B(s) { return /[\u0980-\u09FF\u0964\u0965()\/=\u00D7]/.test(s); }

  /**
   * Guess the encoding of a text sample.
   * @returns {'unicode'|'bijoy'|'unknown'}
   */
  function detect(s) {
    if (!s) return 'unknown';
    var sample = s.slice(0, 4000);
    var bn = (sample.match(/[\u0980-\u09FF\u0964\u0965]/g) || []).length;
    var letters = (sample.match(/\S/g) || []).length || 1;
    if (bn / letters > 0.3) return 'unicode';
    // Bijoy fingerprints: glyph-only cp1252 chars and very common Bijoy bigrams
    var hi = (sample.match(/[\u00A1-\u00FF\u0152\u0153\u0160\u0161\u0178\u0192\u02C6\u02DC\u2013-\u203A\u2122]/g) || []).length;
    var bigrams = (sample.match(/Av|[\u2020\u2021]K|wK|[\u2020\u2021]`|i |K[\u2020\u2021]|evsjv|Ki|_vK|we|cÖ/g) || []).length;
    if (hi / letters > 0.04 || bigrams >= 2) return 'bijoy';
    return 'unknown';
  }

  /** Is this font name a Bijoy/ANSI (SutonnyMJ-compatible) font? */
  var extraBijoyFonts = [];
  function isBijoyFont(name) {
    if (!name) return false;
    var n = String(name).trim();
    if (/OMJ\b/i.test(n)) return false;             // SutonnyOMJ etc. are Unicode builds
    if (/MJ(\s|$)/i.test(n)) return true;            // SutonnyMJ, TonnyBanglaMJ, …
    if (/sutonny|bijoy|\bANSI\b/i.test(n)) return true;
    var low = n.toLowerCase();
    for (var i = 0; i < extraBijoyFonts.length; i++) if (extraBijoyFonts[i] === low) return true;
    return false;
  }
  /** Register extra ANSI font names (user setting). */
  function setExtraBijoyFonts(list) {
    extraBijoyFonts = (list || []).map(function (s) { return String(s).trim().toLowerCase(); }).filter(Boolean);
  }

  return {
    version: '1.1.0',
    bijoyToUnicode: bijoyToUnicode,
    unicodeToBijoy: unicodeToBijoy,
    unicodeToBijoySegments: unicodeToBijoySegments,
    convertBengaliRun: convertBengaliRun,
    symbolToUnicode: symbolToUnicode,
    detect: detect,
    hasBengali: hasBengali,
    hasU2B: hasU2B,
    isPureNeutral: isPureNeutral,
    isBijoyFont: isBijoyFont,
    setExtraBijoyFonts: setExtraBijoyFonts,
    setOptions: setOptions,
    cp1252Char: cp1252Char,
    cp1252Byte: cp1252Byte,
    normalizeC1: normalizeC1
  };
});
