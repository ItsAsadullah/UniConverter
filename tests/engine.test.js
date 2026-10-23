// Run: node tests/engine.test.js
'use strict';
const E = require('../public/js/bijoy-engine.js');

let pass = 0, fail = 0;
function eq(label, got, want) {
  if (got === want) { pass++; return; }
  fail++;
  const cps = s => [...s].slice(0, 40).map(c => c.charCodeAt(0).toString(16).padStart(4, '0')).join(' ');
  if (got.length > 80) {
    let k = 0; while (got[k] === want[k]) k++;
    got = '…' + got.slice(Math.max(0, k - 10), k + 20); want = '…' + want.slice(Math.max(0, k - 10), k + 20);
  }
  console.log(`✗ ${label}\n   got : ${got}  [${cps(got)}]\n   want: ${want}  [${cps(want)}]`);
}

// --- Known Bijoy → Unicode pairs (as typed by Bijoy users) ---
const B2U = [
  ['Avwg evsjvq Mvb MvB|', 'আমি বাংলায় গান গাই।'],
  ['¶gv', 'ক্ষমা'], ['kÖx', 'শ্রী'], ['¯¿x', 'স্ত্রী'], ['K…ò', 'কৃষ্ণ'], ['ivóª', 'রাষ্ট্র'],
  ['D¾¡j', 'উজ্জ্বল'], ['mÜ¨v', 'সন্ধ্যা'], ['we`y¨r', 'বিদ্যুৎ'], ['Kg©', 'কর্ম'], ['i¨ve', 'র\u200D্যাব'],
  ['12345', '১২৩৪৫'], ['evsjv‡`k', 'বাংলাদেশ'], ['cÖwZ', 'প্রতি'], ['‡kÖYx', 'শ্রেণী'],
  ['Kgx©', 'কর্মী'], ['Kg©x', 'কর্মী'], ['agx©q', 'ধর্মীয়'], ['KxwZ©', 'কীর্তি'], ['c~‡e©', 'পূর্বে'],
  ['Ac©Y', 'অর্পণ'], ['‡Kvb', 'কোন'], ['‡KŠkj', 'কৌশল'], ['‰Zwi', 'তৈরি'], ['Pvu`', 'চাঁদ'],
  ['ev¯Íe', 'বাস্তব'], ['AšÍi', 'অন্তর'], ['¯^vaxb', 'স্বাধীন'], ['wek¦', 'বিশ্ব'], ['aŸsm', 'ধ্বংস'],
  ['MÖvg', 'গ্রাম'], ['cÖ_g', 'প্রথম'], ['¯§„wZ', 'স্মৃতি'], ['AvZ¥v', 'আত্মা'], ['M„n', 'গৃহ'],
  ['iƒc', 'রূপ'], ['`ª“Z', 'দ্রুত'], ['`ª–Z', 'দ্রুত'], ['¸iæ', 'গুরু'], ['Kvh©vjq', 'কার্যালয়'], ['evZ©v', 'বার্তা'],
  ['m~h©', 'সূর্য'], ['‡cuŠQv‡bv', 'পৌঁছানো'], ['weÁvb', 'বিজ্ঞান'], ['wkÿv', 'শিক্ষা'], ['wk¶v', 'শিক্ষা'],
  ['Dci', 'উপর'], ['‡`k', 'দেশ'], ['g~j¨', 'মূল্য'], ['e¨vsK', 'ব্যাংক'], ['A¨vcm', 'অ্যাপস'],
  ['K&', 'ক্\u200C'], ['Ò‡`kÓ', '“দেশ”'], ['ÔAvgvi', '‘আমার'], ['AvaywbK', 'আধুনিক'],
  ['ïay', 'শুধু'], ['û`q', 'হৃদয়'.replace('হৃ', 'হু')], ['ü`q', 'হৃদয়'], ['mvwn‡Z¨', 'সাহিত্যে'],
  ['DËi', 'উত্তর'.replace('ত্ত', 'ত্ত')], ['wbe©vPb', 'নির্বাচন'], ['m¤ú‡K©', 'সম্পর্কে'],
  ['ALÛ', 'অখণ্ড'.replace('ণ্ড', 'ন্ড')], ['eÜz', 'বন্ধু'], ['Kó', 'কষ্ট'], ['¯‹zj', 'স্কুল'],
];
for (const [b, u] of B2U) eq(`B2U ${b}`, E.bijoyToUnicode(b), u.normalize ? u : u);

// --- Unicode → Bijoy → Unicode round trips ---
const WORDS = `আমি বাংলায় গান গাই। ক্ষমা শ্রী স্ত্রী কৃষ্ণ রাষ্ট্র উজ্জ্বল সন্ধ্যা বিদ্যুৎ কর্ম র‍্যাব ১২৩৪৫
বাংলাদেশ প্রতি শ্রেণী কর্মী ধর্মীয় কীর্তি পূর্বে অর্পণ কোন কৌশল তৈরি চাঁদ বাস্তব অন্তর স্বাধীন বিশ্ব
ধ্বংস গ্রাম প্রথম স্মৃতি আত্মা গৃহ রূপ দ্রুত গুরু কার্যালয় বার্তা সূর্য পৌঁছানো বিজ্ঞান শিক্ষা উপর দেশ মূল্য
ব্যাংক অ্যাপস আধুনিক শুধু হৃদয় সাহিত্যে উত্তর নির্বাচন সম্পর্কে বন্ধু কষ্ট স্কুল মুক্তিযুদ্ধ স্বাস্থ্য
পরীক্ষা ঐতিহ্য ঔষধ ঋতু ঊর্ধ্ব ঈদ উৎসব আকাঙ্ক্ষা সংস্কৃতি শঙ্খ অঙ্ক রঙ্গ লক্ষ্মী বৃষ্টি ব্রাহ্মণ আহ্বান
জিহ্বা সন্ন্যাসী উচ্ছ্বাস তত্ত্ব মহত্ত্ব সত্ত্বেও যন্ত্র মন্ত্রী রাষ্ট্রপতি স্ত্রী নিষ্ক্রিয় স্ক্রিন অস্ত্র চন্দ্র ইন্দ্রিয়
সম্ভ্রম ক্লান্ত প্লাবন ব্লগ গ্লাস শ্লোক উল্লেখ বিল্ব কল্পনা উল্কা গল্প জন্ম পদ্ম আত্মীয় পাঁচ ছুঁতে ভুঁই
দুঃখ বাঃ রং ঢাকা আষাঢ় পড়া গাঢ় শ্রদ্ধা বুদ্ধি উদ্ভব অদ্ভুত দ্বিতীয় ধন্যবাদ অনুগ্রহ পূর্ণ বর্ণ কার্তিক
তর্ক মার্চ ওয়ার্ড ফর্ম পার্থক্য দীর্ঘ সর্বত্র নির্ভর বর্ষা হর্ষ আর্দ্র শীর্ষ কর্ণ গর্ভ মূর্খ ঊর্মি পর্যন্ত
সর্বাঙ্গীণ পূর্বাঞ্চল চঞ্চল ঝঞ্ঝা বাঞ্ছিত জ্ঞান যজ্ঞ সজ্জা কুঞ্জ ঘণ্টা কণ্ঠ ঠাণ্ডা পণ্ডিত চট্টগ্রাম বড্ড
ক্যাম্পাস লম্ফ কম্বল আরম্ভ সম্মান স্পষ্ট পুষ্প নিষ্ফল গুল্ম স্খলন স্টেশন স্তব্ধ স্থান স্নান স্ফটিক
স্মরণ ভস্ম গ্রীষ্ম বিষ্ণু হুকুম আহ্লাদ মধ্যাহ্ন অপরাহ্ণ পৃথিবী কৃতজ্ঞ ক্রিকেট বক্তা রক্ত শক্তি সংযুক্ত
অক্টোবর ডাক্তার পক্ব রুটি রূপা মরু গুণ শুরু দ্রুত শ্রুতি প্রুফ কেন্দ্র সন্ত্রাস দুর্নীতি নির্দিষ্ট ব্যক্তিত্ব
উদ্দেশ্য সিদ্ধান্ত চট্টলা শিশু হুমায়ূন রবীন্দ্রনাথ ঠাকুর নজরুল জীবনানন্দ বঙ্গবন্ধু একুশে ফেব্রুয়ারি`;

const words = WORDS.split(/\s+/).filter(Boolean);
for (const w of words) {
  const b = E.unicodeToBijoy(w);
  const back = E.bijoyToUnicode(b);
  eq(`RT ${w} (bijoy: ${b})`, back, w);
}

// full sentence & mixed content
eq('sentence RT', E.bijoyToUnicode(E.unicodeToBijoy(WORDS)), WORDS.replace(/\n/g, '\n'));
const segs = E.unicodeToBijoySegments('Hello, আমি "TechHat" থেকে বলছি (২০২৬)।');
eq('segments mixed count', segs.map(s => (s.bijoy ? 'B' : 'O')).join(''), 'OBOBOB'.slice(0, segs.length));

// --- Specific glyph & punctuation regression tests ---
// 1) শৃ and right-stem consonants use stem-joining ৃ (\u201E = „), non-stem use \u2026 (…)
eq('শৃ stem-joining ri-kar', E.unicodeToBijoy('শৃ'), 'k\u201E');
eq('শৃঙ্খলা stem-joining ri-kar', E.unicodeToBijoy('শৃঙ্খলা'), 'k\u201E\u2022Ljv');
eq('সৃষ্টি stem-joining ri-kar', E.unicodeToBijoy('সৃষ্টি'), 'm\u201Ew\u00F3');
eq('কৃষি non-stem ri-kar', E.unicodeToBijoy('কৃষি'), 'K\u2026wl');
eq('তৃতীয় non-stem ri-kar', E.unicodeToBijoy('তৃতীয়'), 'Z\u2026Zxq');
eq('শ‍ৃ with stray ZWJ before ri-kar', E.unicodeToBijoy('শ\u200Dৃ'), 'k\u201E');
// 2) ূ (uu-kar) stem vs non-stem
eq('উপকূলীয় non-stem uu-kar', E.unicodeToBijoy('উপকূলীয়'), 'DcK\u201Ajxq');
eq('ভূমিকম্প non-stem uu-kar', E.unicodeToBijoy('ভূমিকম্প'), 'f\u201AwgK\u00A4\u00FA');
eq('মূল্য right-stem uu-kar', E.unicodeToBijoy('মূল্য'), 'g~j\u00A8');
// 3) ণ্ড (\u00D0) and রু (i\u00E6) and দ্রু (`\u00AA\u2013)
eq('অগ্নিকাণ্ড conj glyph', E.unicodeToBijoy('অগ্নিকাণ্ড'), 'AwM\u0153Kv\u00D0');
eq('রুটি-মাংস ru glyph', E.unicodeToBijoy('রুটি-মাংস'), 'i\u00E6wU-gvsm');
eq('দ্রুত ra-phala u-kar glyph', E.unicodeToBijoy('দ্রুত'), '`\u00AA\u2013Z');
// 4) /, (), =, and × (Symbol font)
const mathSegs = E.unicodeToBijoySegments('১ × ১৫ = ১৫');
eq('math × symbol segment', JSON.stringify(mathSegs), JSON.stringify([
  { bijoy: true, text: '1 ' },
  { bijoy: false, symbol: true, text: '\u00B4' },
  { bijoy: true, text: ' 15 = 15' }
]));
eq('math RT', E.bijoyToUnicode(E.unicodeToBijoy('১ × ১৫ = ১৫')), '১ × ১৫ = ১৫');
const romanSegs = E.unicodeToBijoySegments('(iii) অগ্নিকাণ্ড (iv) রুটি-মাংস');
eq('brackets around roman numerals get bijoy:true', JSON.stringify(romanSegs), JSON.stringify([
  { bijoy: true, text: '(' },
  { bijoy: false, text: 'iii' },
  { bijoy: true, text: ') AwM\u0153Kv\u00D0 (' },
  { bijoy: false, text: 'iv' },
  { bijoy: true, text: ') i\u00E6wU-gvsm' }
]));
const slashSegs = E.unicodeToBijoySegments('৫/৬ বাক্যে উত্তর দাও');
eq('slash in bangla gets bijoy:true', JSON.stringify(slashSegs), JSON.stringify([
  { bijoy: true, text: '5/6 ev\u2021K\u00A8 D\u00CBi `vI' }
]));
// 5) Word-initial vs word-internal ে/ো/ৌ († = \u2020 vs ‡ = \u2021) and ৈ (ˆ = \u02C6 vs ‰ = \u2030)
eq('word-initial কোন uses matra-less †', E.unicodeToBijoy('কোন'), '\u2020Kvb');
eq('word-initial দেখা uses matra-less †', E.unicodeToBijoy('দেখা'), '\u2020`Lv');
eq('word-initial জেলায় uses matra-less †', E.unicodeToBijoy('জেলায়'), '\u2020Rjvq');
eq('word-initial কোথায় uses matra-less †', E.unicodeToBijoy('কোথায়'), '\u2020Kv_vq');
eq('দেশের has † at start and ‡ inside word', E.unicodeToBijoy('দেশের'), '\u2020`\u2021ki');
eq('বাংলাদেশের has ‡ inside word', E.unicodeToBijoy('বাংলাদেশের'), 'evsjv\u2021`\u2021ki');
eq('বৈশিষ্ট্য uses matra-less ˆ at start', E.unicodeToBijoy('বৈশিষ্ট্য'), '\u02C6ewk\u00F3\u00A8');
eq('রাজনৈতিক uses matra-bearing ‰ inside word', E.unicodeToBijoy('রাজনৈতিক'), 'ivR\u2030bwZK');
eq('sentence e-kar matra check', E.unicodeToBijoy('গারো নৃগোষ্ঠী বাংলাদেশের কোন কোন জেলায় বাস করে? জলাবন কোথায় দেখা যায়?'),
  'Mv\u2021iv b\u201E\u2021Mv\u00F4x evsjv\u2021`\u2021ki \u2020Kvb \u2020Kvb \u2020Rjvq evm K\u2021i? Rjveb \u2020Kv_vq \u2020`Lv hvq?');

eq('detect unicode', E.detect('আমি বাংলায় গান গাই'), 'unicode');
eq('detect bijoy', E.detect('Avwg evsjvq Mvb MvB'), 'bijoy');
eq('font SutonnyMJ', E.isBijoyFont('SutonnyMJ'), true);
eq('font SutonnyOMJ', E.isBijoyFont('SutonnyOMJ'), false);
eq('font Nirmala', E.isBijoyFont('Nirmala UI'), false);

// performance
const big = WORDS.repeat(400);
let t = Date.now(); const bb = E.unicodeToBijoy(big); const t1 = Date.now() - t;
t = Date.now(); E.bijoyToUnicode(bb); const t2 = Date.now() - t;
console.log(`\nperf: ${(big.length / 1024).toFixed(0)} KB  U→B ${t1}ms  B→U ${t2}ms`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
