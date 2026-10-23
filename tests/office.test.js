// Run: node tests/office.test.js   (needs: cd tests && npm install)
'use strict';
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
global.DOMParser = DOMParser;
global.XMLSerializer = XMLSerializer;
global.JSZip = require('jszip');
global.BijoyEngine = require('../public/js/bijoy-engine.js');
const Office = require('../public/js/office.js');
const Formats = require('../public/js/formats.js');

let pass = 0, fail = 0;
function ok(label, cond, extra) {
  if (cond) { pass++; return; }
  fail++; console.log('✗ ' + label + (extra ? '\n   ' + extra : ''));
}
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const opts = (direction, extra) => Object.assign({ direction, unicodeFont: 'Nirmala UI', bijoyFont: 'SutonnyMJ', detect: 'auto', outputType: 'uint8array' }, extra);

async function makeZip(files) {
  const z = new JSZip();
  for (const [p, c] of Object.entries(files)) z.file(p, c);
  return z.generateAsync({ type: 'uint8array' });
}
async function readPart(u8, path) { return (await JSZip.loadAsync(u8)).file(path).async('string'); }
const texts = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}(?: [^>]*)?>([^<]*)</${tag}>`, 'g'))].map(m => m[1]);

(async () => {
  // ---------------------------------------------------------------- DOCX B→U
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${W}>
    <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr></w:rPrDefault></w:docDefaults>
    <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
    <w:style w:type="paragraph" w:styleId="BN"><w:name w:val="BN"/><w:basedOn w:val="Normal"/><w:rPr><w:rFonts w:ascii="SutonnyMJ" w:hAnsi="SutonnyMJ"/><w:b/><w:sz w:val="32"/></w:rPr></w:style>
  </w:styles>`;
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body>
    <w:p><w:r><w:rPr><w:rFonts w:ascii="SutonnyMJ" w:hAnsi="SutonnyMJ"/><w:b/><w:sz w:val="28"/></w:rPr><w:t xml:space="preserve">Avwg </w:t></w:r>
         <w:r><w:rPr><w:rFonts w:ascii="SutonnyMJ" w:hAnsi="SutonnyMJ"/><w:i/></w:rPr><w:t>w</w:t></w:r>
         <w:r><w:rPr><w:rFonts w:ascii="SutonnyMJ" w:hAnsi="SutonnyMJ"/></w:rPr><w:t>K Kg©</w:t></w:r>
         <w:r><w:t xml:space="preserve"> Hello</w:t></w:r></w:p>
    <w:p><w:pPr><w:pStyle w:val="BN"/></w:pPr><w:r><w:t>evsjv‡\`k</w:t></w:r></w:p>
  </w:body></w:document>`;
  const docx = await makeZip({ 'word/document.xml': doc, 'word/styles.xml': styles, '[Content_Types].xml': '<Types/>' });
  let r = await Office.convertOffice(docx, 'a.docx', opts('b2u'));
  let x = await readPart(r.data, 'word/document.xml');
  const t = texts(x, 'w:t');
  ok('docx b2u text run1', t[0] === 'আমি ', JSON.stringify(t));
  ok('docx b2u split word merged into owner', t[1] === 'কি' && t[2] === ' কর্ম', JSON.stringify(t));
  ok('docx b2u english untouched', t[3] === ' Hello', JSON.stringify(t));
  ok('docx b2u style-inherited run', t[4] === 'বাংলাদেশ', JSON.stringify(t));
  ok('docx b2u font set', (x.match(/w:cs="Nirmala UI"/g) || []).length === 4, x);
  ok('docx b2u bCs + szCs synced', /<w:b\/><w:bCs\/>/.test(x) && /<w:sz w:val="28"\/><w:szCs w:val="28"\/>/.test(x), x);
  ok('docx b2u inherited bold/size synced', /<w:bCs\/>.*<w:szCs w:val="32"\/>/.test(x.split('evsjv')[0].split('BN')[1] || x.slice(x.lastIndexOf('<w:p>'))), x.slice(x.lastIndexOf('<w:p>')));
  ok('docx b2u rFonts first in rPr', !/<w:rPr><w:(b|i|sz)\b[^>]*\/><w:rFonts/.test(x));
  ok('docx b2u english run unchanged', /<w:r><w:t xml:space="preserve"> Hello<\/w:t><\/w:r>/.test(x), x);
  const st = await readPart(r.data, 'word/styles.xml');
  ok('docx b2u styles retargeted', /w:ascii="Nirmala UI"/.test(st) && !/SutonnyMJ/.test(st), st);

  // ---------------------------------------------------------------- DOCX U→B (mixed run split)
  const docU = `<?xml version="1.0" encoding="UTF-8"?><w:document ${W}><w:body><w:p>
    <w:r><w:rPr><w:rFonts w:ascii="Nirmala UI" w:hAnsi="Nirmala UI" w:cs="Nirmala UI"/><w:bCs/><w:szCs w:val="30"/></w:rPr><w:t xml:space="preserve">Hello বাংলাদেশ “আমার” world ২০২৬</w:t></w:r>
  </w:p></w:body></w:document>`;
  r = await Office.convertOffice(await makeZip({ 'word/document.xml': docU }), 'b.docx', opts('u2b'));
  x = await readPart(r.data, 'word/document.xml');
  const tu = texts(x, 'w:t');
  ok('docx u2b segments', JSON.stringify(tu) === JSON.stringify(['Hello ', 'evsjv‡`k ÒAvgviÓ', ' world ', '2026']), JSON.stringify(tu));
  ok('docx u2b bijoy font on bangla runs only', (x.match(/w:ascii="SutonnyMJ"/g) || []).length === 2, x);
  ok('docx u2b english runs get Times New Roman', (x.match(/w:ascii="Times New Roman"/g) || []).length === 2, x);
  ok('docx u2b bold+size from complex script', /<w:b\/>/.test(x) && /<w:sz w:val="30"\/>/.test(x), x);

  // danda in its own run (Word often splits । into a separate run)
  const NUI = '<w:rPr><w:rFonts w:ascii="Nirmala UI" w:hAnsi="Nirmala UI" w:cs="Nirmala UI"/></w:rPr>';
  const docD = `<?xml version="1.0" encoding="UTF-8"?><w:document ${W}><w:body><w:p>
    <w:r>${NUI}<w:t>আমি</w:t></w:r><w:r>${NUI}<w:t>।</w:t></w:r><w:r>${NUI}<w:t xml:space="preserve"> ॥</w:t></w:r>
  </w:p></w:body></w:document>`;
  r = await Office.convertOffice(await makeZip({ 'word/document.xml': docD }), 'e.docx', opts('u2b'));
  x = await readPart(r.data, 'word/document.xml');
  const td = texts(x, 'w:t');
  ok('docx u2b danda-only run converted', JSON.stringify(td) === JSON.stringify(['Avwg', '|', ' ||']), JSON.stringify(td));
  ok('docx u2b danda-only run gets SutonnyMJ', (x.match(/w:ascii="SutonnyMJ"/g) || []).length === 3 && !/Nirmala/.test(x.replace(/w:cs="Nirmala UI"/g, '')), x);

  // split syllable across runs (শ + ৃ), split /, (), =, × (Symbol font), and B→U round-trip
  const docSplit = `<?xml version="1.0" encoding="UTF-8"?><w:document ${W}><w:body><w:p>
    <w:r>${NUI}<w:t>শ</w:t></w:r><w:r>${NUI}<w:t>ৃ</w:t></w:r>
    <w:r>${NUI}<w:t xml:space="preserve"> (</w:t></w:r><w:r>${NUI}<w:t>ক</w:t></w:r><w:r>${NUI}<w:t>/</w:t></w:r><w:r>${NUI}<w:t>খ</w:t></w:r><w:r>${NUI}<w:t>) </w:t></w:r>
    <w:r>${NUI}<w:t>৫</w:t></w:r><w:r>${NUI}<w:t>×</w:t></w:r><w:r>${NUI}<w:t>৮</w:t></w:r><w:r>${NUI}<w:t xml:space="preserve"> = </w:t></w:r><w:r>${NUI}<w:t>৪০</w:t></w:r>
  </w:p></w:body></w:document>`;
  r = await Office.convertOffice(await makeZip({ 'word/document.xml': docSplit }), 'split.docx', opts('u2b'));
  x = await readPart(r.data, 'word/document.xml');
  const tSplit = texts(x, 'w:t');
  ok('docx u2b split শ+ৃ merged and /, (), =, × converted', JSON.stringify(tSplit) === JSON.stringify(['k\u201E', ' (', 'K', '/', 'L', ') ', '5', '\u00B4', '8', ' = ', '40']), JSON.stringify(tSplit));
  ok('docx u2b × uses Symbol font', /w:ascii="Symbol" w:hAnsi="Symbol" w:cs="Symbol" w:eastAsia="Symbol"/.test(x), x);
  const rBack = await Office.convertOffice(r.data, 'split-bijoy.docx', opts('b2u'));
  const xBack = await readPart(rBack.data, 'word/document.xml');
  ok('docx b2u Symbol × round-trips to Unicode ×', texts(xBack, 'w:t').join('') === 'শৃ (ক/খ) ৫×৮ = ৪০', JSON.stringify(texts(xBack, 'w:t')));

  // ---------------------------------------------------------------- XLSX B→U and U→B
  const S = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
  const xlStyles = `<styleSheet ${S}><fonts count="2"><font><sz val="11"/><name val="Calibri"/><scheme val="minor"/></font><font><b/><sz val="14"/><name val="SutonnyMJ"/></font></fonts>
    <cellXfs count="2"><xf fontId="0"/><xf fontId="1"/></cellXfs></styleSheet>`;
  const sst = `<sst ${S} count="3" uniqueCount="3"><si><t>Avwg evsjvq</t></si><si><t>English</t></si><si><r><rPr><rFont val="SutonnyMJ"/></rPr><t>‡\`k</t></r><r><t xml:space="preserve"> ok</t></r></si></sst>`;
  const sheet = `<worksheet ${S}><sheetData><row r="1"><c r="A1" s="1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row></sheetData></worksheet>`;
  const xlsx = await makeZip({ 'xl/styles.xml': xlStyles, 'xl/sharedStrings.xml': sst, 'xl/worksheets/sheet1.xml': sheet });
  r = await Office.convertOffice(xlsx, 'c.xlsx', opts('b2u'));
  x = await readPart(r.data, 'xl/sharedStrings.xml');
  const xt = texts(x, 't');
  ok('xlsx b2u', xt[0] === 'আমি বাংলায়'.normalize() && xt[1] === 'English' && xt[2] === 'দেশ' && xt[3] === ' ok', JSON.stringify(xt));
  const xs = await readPart(r.data, 'xl/styles.xml');
  ok('xlsx b2u font renamed', /<name val="Nirmala UI"\/>/.test(xs) && /<name val="Calibri"\/>/.test(xs), xs);

  const sstU = `<sst ${S}><si><t>Total: ১২৫ টাকা</t></si></sst>`;
  const sheetU = `<worksheet ${S}><sheetData><row r="1"><c r="A1" s="0" t="s"><v>0</v></c></row></sheetData></worksheet>`;
  r = await Office.convertOffice(await makeZip({ 'xl/styles.xml': xlStyles, 'xl/sharedStrings.xml': sstU, 'xl/worksheets/sheet1.xml': sheetU }), 'd.xlsx', opts('u2b'));
  x = await readPart(r.data, 'xl/sharedStrings.xml');
  ok('xlsx u2b rich runs', /<r><rPr><sz val="11"\/><rFont val="Calibri"\/><scheme val="minor"\/><\/rPr><t xml:space="preserve">Total: <\/t><\/r><r><rPr><rFont val="SutonnyMJ"\/><sz val="11"\/><\/rPr><t>125 UvKv<\/t><\/r>/.test(x)
    || (/125 UvKv/.test(x) && /rFont val="SutonnyMJ"/.test(x)), x);
  ok('xlsx u2b rPr schema order (rFont before sz)', !/<sz val="11"\/><rFont val="SutonnyMJ"/.test(x), x);

  // ---------------------------------------------------------------- PPTX B→U
  const A = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
  const slide = `<p:sld ${A}><p:cSld><p:spTree><p:sp><p:txBody><a:bodyPr/><a:p>
    <a:r><a:rPr lang="en-US" b="1"><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill><a:latin typeface="SutonnyMJ" pitchFamily="2" charset="0"/></a:rPr><a:t>wkÿv</a:t></a:r>
    <a:r><a:rPr lang="en-US"><a:latin typeface="Arial"/></a:rPr><a:t> Slide</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`;
  r = await Office.convertOffice(await makeZip({ 'ppt/slides/slide1.xml': slide }), 'e.pptx', opts('b2u'));
  x = await readPart(r.data, 'ppt/slides/slide1.xml');
  const pt = texts(x, 'a:t');
  ok('pptx b2u', pt[0] === 'শিক্ষা' && pt[1] === ' Slide', JSON.stringify(pt));
  ok('pptx b2u cs after latin, after fill', /<\/a:solidFill><a:latin typeface="Nirmala UI"\/><a:cs typeface="Nirmala UI"\/>/.test(x), x);

  // ---------------------------------------------------------------- RTF both ways
  const rtf = "{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}{\\f1\\fnil\\fcharset0 SutonnyMJ;}}\\pard\\f1\\fs28 Avwg \\'e6 evsjv\\'87`k\\par\\f0 English\\par}";
  const rr = Formats.convertRtf(Buffer.from(rtf, 'latin1'), opts('b2u'));
  const rtfOut = Buffer.from(rr.data).toString('latin1');
  const decodeRtfU = s => s.replace(/\\u(-?\d+)\??/g, (_, n) => String.fromCharCode(+n < 0 ? +n + 65536 : +n));
  ok('rtf b2u', decodeRtfU(rtfOut).includes('আমি ু বাংলাদেশ') && rtfOut.includes('English') && rtfOut.includes('Nirmala UI;'), rtfOut);
  const rtfU = "{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Nirmala UI;}}\\uc1\\pard\\f0 Hi \\u2476?\\u2494?\\u2434?\\u2482?\\u2494?\\par}";
  const ru = Formats.convertRtf(Buffer.from(rtfU, 'latin1'), opts('u2b'));
  const ruOut = Buffer.from(ru.data).toString('latin1');
  ok('rtf u2b', ruOut.includes('{\\f1\\fnil\\fcharset0 SutonnyMJ;}') && ruOut.includes('{\\f1\\fs24 evsjv}') && ruOut.includes('Hi '), ruOut);

  // ---------------------------------------------------------------- TXT
  const ansi = Buffer.from('Avwg evsjvq ‡`k', 'latin1'); // note: ‡ is not latin1, check cp1252 path separately
  const tt = Formats.convertTxt(new Uint8Array([0x41, 0x76, 0x77, 0x67, 0x20, 0x87, 0x60, 0x6B]), opts('b2u'));
  ok('txt b2u (cp1252 bytes)', new TextDecoder().decode(tt.data.subarray(3)) === 'আমি দেশ', new TextDecoder().decode(tt.data));
  const tu8 = Formats.convertTxt(new TextEncoder().encode('দেশ'), opts('u2b'));
  ok('txt u2b → cp1252', Buffer.from(tu8.data).equals(Buffer.from([0x86, 0x60, 0x6B])), Buffer.from(tu8.data).toString('hex'));
  void ansi;

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
