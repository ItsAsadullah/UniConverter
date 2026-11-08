/* Vector export tests — run: node tests/vector-export.test.cjs */
const assert = require('node:assert/strict');
const C = require('../public/js/vector-trace-core.js');
const E = require('../public/js/vector-export.js');

let passed = 0;
function test(name, fn) { fn(); passed++; console.log('✓ ' + name); }

const WHITE = [255, 255, 255, 255], BLACK = [0, 0, 0, 255], RED = [220, 30, 30, 255], BLUE = [30, 60, 220, 255];
function makeImage(w, h, fill) {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) d.set(fill, i * 4);
  return { data: d, w, h };
}
function fillCircle(img, cx, cy, r, color) {
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++)
    if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) img.data.set(color, (y * img.w + x) * 4);
}
function fillRect(img, x0, y0, x1, y1, color) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) img.data.set(color, (y * img.w + x) * 4);
}

// shared fixtures
const monoImg = makeImage(100, 100, WHITE);
fillCircle(monoImg, 50, 50, 30, BLACK);
const mono = C.trace(monoImg, { mode: 'mono', minArea: 5, tolerance: 1 });

const colorImg = makeImage(90, 60, WHITE);
fillRect(colorImg, 0, 0, 90, 20, RED);
fillRect(colorImg, 0, 20, 90, 40, BLUE);
const colorRes = C.trace(colorImg, { mode: 'color', colors: 4, minArea: 20, tolerance: 1, stacking: 'stacked' });

// ---- SVG ----
test('svg has viewBox, grouped paths and hex fills', () => {
  const svg = E.toSvg(mono, { title: 'test' });
  assert.ok(svg.includes('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(svg.includes('viewBox="0 0 100 100"'));
  assert.ok(svg.includes('fill="#000000"'));
  assert.ok(svg.includes('<title>test</title>'));
  const pathCount = (svg.match(/<path /g) || []).length;
  assert.equal(pathCount, mono.stats.paths);
  assert.ok(!svg.includes('NaN') && !svg.includes('undefined'));
});

test('svg color output has one group per color', () => {
  const svg = E.toSvg(colorRes);
  const groups = (svg.match(/<g fill=/g) || []).length;
  assert.equal(groups, colorRes.stats.colors);
  assert.ok(svg.includes('fill="#dc1e1e"') || svg.includes('fill="#1e3cdc"'));
});

// ---- EPS ----
test('eps has valid header, bounding box and PostScript operators', () => {
  const eps = E.toEps(mono, { title: 'logo' });
  assert.ok(eps.startsWith('%!PS-Adobe-3.0 EPSF-3.0\n'));
  assert.ok(eps.includes('%%BoundingBox: 0 0 100 100'));
  assert.ok(eps.includes('%%HiResBoundingBox: 0 0 100 100'));
  assert.ok(eps.includes(' setrgbcolor'));
  assert.ok(eps.includes(' moveto'));
  assert.ok(eps.includes(' curveto') || eps.includes(' lineto'));
  assert.ok(eps.includes('closepath'));
  assert.ok(/\n(fill|eofill)\n/.test(eps));
  assert.ok(eps.trim().endsWith('%%EOF'));
  assert.ok(eps.includes('showpage'));
});

test('eps flips the y axis (y-up PostScript)', () => {
  // circle centre at y=50 in a 100px image → EPS y ≈ 50 (symmetric), so use an
  // off-centre shape: square at top of image
  const img = makeImage(40, 40, WHITE);
  fillRect(img, 10, 2, 30, 12, BLACK); // top band, y ∈ [2,12)
  const r = C.trace(img, { mode: 'mono', minArea: 2, tolerance: 0.8 });
  const eps = E.toEps(r);
  const moveto = eps.match(/([\d.]+) ([\d.]+) moveto/g) || [];
  assert.ok(moveto.length > 0);
  const ys = moveto.map(m => parseFloat(m.split(' ')[1]));
  // all y coords must be ≥ 28 (flipped from ≤ 12)
  for (const y of ys) assert.ok(y >= 27, `eps y ${y} should be flipped ≥ 27`);
});

test('eps supports CMYK colour space', () => {
  const eps = E.toEps(colorRes, { colorSpace: 'cmyk' });
  assert.ok(eps.includes(' setcmykcolor'));
  assert.ok(!eps.includes(' setrgbcolor'));
});

// ---- AI ----
test('ai is a valid PDF 1.5 container with correct xref offsets', () => {
  const ai = E.toAi(mono, { title: 'logo' });
  assert.ok(ai.startsWith('%PDF-1.5\n'));
  assert.ok(ai.includes('/Type /Catalog'));
  assert.ok(ai.includes('/MediaBox [0 0 100 100]'));
  // verify every xref entry points at "N 0 obj"
  const xrefPos = ai.lastIndexOf('startxref');
  const xrefStart = ai.indexOf('xref\n');
  const entries = ai.slice(xrefStart + 5, ai.indexOf('trailer')).split('\n').slice(2);
  let ok = 0;
  for (const line of entries) {
    if (!/^\d{10} 00000 n /.test(line)) continue;
    const off = parseInt(line.slice(0, 10), 10);
    const expect = ai.slice(off, off + 12);
    assert.ok(/^\d+ 0 obj/.test(expect), `xref offset ${off} → "${expect}"`);
    ok++;
  }
  assert.ok(ok >= 5, `checked ${ok} xref entries`);
  assert.ok(ai.trim().endsWith('%%EOF'));
});

test('ai content stream uses PDF path operators', () => {
  const ai = E.toAi(mono);
  assert.ok(ai.includes(' rg\n') || ai.includes(' rg\n0'));
  assert.ok(/ \dm[\n ]/.test(ai) || ai.includes(' m\n'));
  assert.ok(ai.includes(' c\n') || ai.includes(' l\n'));
  assert.ok(/\nf\*?\n/.test(ai));
  assert.ok(ai.includes('/Creator (Adobe Illustrator(R) 17.0)'));
});

test('ai supports CMYK', () => {
  const ai = E.toAi(colorRes, { colorSpace: 'cmyk' });
  assert.ok(ai.includes(' k\n'));
  assert.ok(ai.includes('/DeviceCMYK') || !ai.includes(' rg\n'));
});

// ---- palette ops ----
test('recolor, merge, remove, hide and reorder mutate results correctly', () => {
  const res = JSON.parse(JSON.stringify(colorRes));
  const before = res.paths.length;
  assert.ok(E.recolorPath(res.paths[0], [10, 200, 30]));
  assert.deepEqual(res.paths[0].fill, [10, 200, 30]);
  const svgRecolored = E.toSvg(res);
  assert.ok(svgRecolored.includes('fill="#0ac81e"'));
  // merge last into first
  const okMerge = E.mergePaths(res, [res.paths.length - 1], 0);
  assert.ok(okMerge);
  assert.equal(res.paths.length, before - 1);
  // hide
  assert.ok(E.setPathHidden(res, 0, true));
  const svgHidden = E.toSvg(res);
  assert.ok(!svgHidden.includes('fill="#0ac81e"'), 'hidden layer not rendered');
  assert.ok(E.setPathHidden(res, 0, false));
  // remove
  const cnt = res.paths.length;
  assert.ok(E.removePath(res, 0));
  assert.equal(res.paths.length, cnt - 1);
  // reorder
  if (res.paths.length >= 2) {
    const firstFill = res.paths[0].fill.join(',');
    assert.ok(E.movePath(res, 1, -1));
    assert.equal(res.paths[0].fill.join(','), firstFill);
  }
});

// ---- estimates ----
test('estimateBytes returns positive sizes for all formats', () => {
  for (const fmt of ['svg', 'eps', 'ai']) {
    const b = E.estimateBytes(mono, fmt);
    assert.ok(b > 100, `${fmt} ${b} bytes`);
  }
});

test('exporters are deterministic', () => {
  assert.equal(E.toSvg(mono), E.toSvg(mono));
  assert.equal(E.toEps(mono), E.toEps(mono));
  assert.equal(E.toAi(mono), E.toAi(mono));
});

// ---- gradients ----
const gradRes = {
  w: 100, h: 60, palette: [],
  stats: { paths: 2, colors: 2 },
  paths: [
    { fill: [255, 255, 255], hidden: false, subpaths: [{ start: [0, 0], segs: [{ l: [100, 0] }, { l: [100, 60] }, { l: [0, 60] }, { l: [0, 0] }], closed: true, nodes: 5 }] },
    {
      fill: [120, 60, 210], hidden: false,
      gradient: { type: 'linear', x1: 10, y1: 30, x2: 90, y2: 30, stops: [{ o: 0, c: [30, 80, 220] }, { o: 0.5, c: [110, 60, 210] }, { o: 1, c: [200, 40, 200] }] },
      subpaths: [{ start: [10, 10], segs: [{ l: [90, 10] }, { l: [90, 50] }, { l: [10, 50] }, { l: [10, 10] }], closed: true, nodes: 5 }]
    },
    {
      fill: [250, 180, 40], hidden: false,
      gradient: { type: 'radial', cx: 50, cy: 30, r: 12, stops: [{ o: 0, c: [255, 220, 60] }, { o: 1, c: [230, 120, 30] }] },
      subpaths: [{ start: [38, 30], segs: [{ c: [38, 23, 43, 18, 50, 18] }, { c: [57, 18, 62, 23, 62, 30] }, { c: [62, 37, 57, 42, 50, 42] }, { c: [43, 42, 38, 37, 38, 30] }], closed: true, nodes: 5 }]
    }
  ]
};

test('svg writes linear & radial gradients in defs and keeps paint order', () => {
  const svg = E.toSvg(gradRes);
  assert.ok(svg.includes('<defs>'));
  assert.ok(svg.includes('<linearGradient id="thg1" gradientUnits="userSpaceOnUse" x1="10" y1="30" x2="90" y2="30">'));
  assert.ok(svg.includes('<radialGradient id="thg2"'));
  assert.ok(svg.includes('stop-color="#1e50dc"') && svg.includes('offset="0.5"'));
  assert.ok(svg.indexOf('fill="#ffffff"') < svg.indexOf('url(#thg1)'), 'background painted first');
  assert.ok(svg.indexOf('url(#thg1)') < svg.indexOf('url(#thg2)'), 'z-order preserved');
});

test('eps paints gradients with clip + PostScript 3 shfill', () => {
  const eps = E.toEps(gradRes);
  assert.ok(eps.includes('%%LanguageLevel: 3'));
  assert.ok(eps.includes('/ShadingType 2') && eps.includes('/ShadingType 3'));
  assert.ok(eps.includes('/FunctionType 3') && eps.includes('/Bounds [0.5]'));
  assert.ok(eps.includes('clip\nnewpath\n') && eps.includes(' shfill'));
  // y flipped: linear coords at y = 60 - 30 = 30, radial centre 60 - 30 = 30
  assert.ok(eps.includes('/Coords [10 30 90 30]'));
  const cmyk = E.toEps(gradRes, { colorSpace: 'cmyk' });
  assert.ok(cmyk.includes('/ColorSpace /DeviceCMYK'));
});

test('ai declares shadings in page resources and uses sh operator', () => {
  const ai = E.toAi(gradRes);
  assert.ok(ai.includes('/Resources << /Shading << /Sh1 << /ShadingType 2'));
  assert.ok(ai.includes('/Sh2 << /ShadingType 3'));
  assert.ok(ai.includes('W n\n/Sh1 sh') && ai.includes('/Sh2 sh'));
  const xrefStart = ai.indexOf('xref\n');
  const entries = ai.slice(xrefStart + 5, ai.indexOf('trailer')).split('\n').slice(2).filter(l => /^\d{10} 00000 n /.test(l));
  for (const line of entries) assert.ok(/^\d+ 0 obj/.test(ai.slice(parseInt(line, 10), parseInt(line, 10) + 12)));
});

test('recolouring a gradient layer shifts its stops instead of flattening it', () => {
  const res = JSON.parse(JSON.stringify(gradRes));
  E.recolorPath(res.paths[1], [140, 60, 210]);
  assert.ok(res.paths[1].gradient, 'gradient kept');
  assert.deepEqual(res.paths[1].gradient.stops[0].c, [50, 80, 220]);
});

console.log(passed + ' vector export tests passed');
