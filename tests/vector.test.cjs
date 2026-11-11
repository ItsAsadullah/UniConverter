/* Vector trace core tests — run: node tests/vector.test.cjs */
const assert = require('node:assert/strict');
const C = require('../public/js/vector-trace-core.js');

let passed = 0;
function test(name, fn) { fn(); passed++; console.log('✓ ' + name); }

function makeImage(w, h, fill) {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) d.set(fill, i * 4);
  return { data: d, w, h };
}
function fillCircle(img, cx, cy, r, color) {
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) img.data.set(color, (y * img.w + x) * 4);
  }
}
function fillRect(img, x0, y0, x1, y1, color) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) img.data.set(color, (y * img.w + x) * 4);
}
function finite(sub) {
  for (const v of sub.start) assert.ok(Number.isFinite(v), 'start finite');
  for (const seg of sub.segs) {
    const arr = seg.c || seg.l;
    for (const v of arr) assert.ok(Number.isFinite(v), 'seg finite');
  }
}

const WHITE = [255, 255, 255, 255], BLACK = [0, 0, 0, 255], RED = [220, 30, 30, 255], GREEN = [30, 180, 70, 255], BLUE = [40, 60, 200, 255];

// 1. Monochrome circle
test('mono trace of a filled circle yields one closed path within bounds', () => {
  const img = makeImage(100, 100, WHITE);
  fillCircle(img, 50, 50, 30, BLACK);
  const r = C.trace(img, { mode: 'mono', minArea: 5, tolerance: 1, cornerThreshold: 60 });
  assert.equal(r.paths.length, 1);
  assert.ok(r.paths[0].subpaths.length >= 1);
  assert.equal(r.stats.paths, 1);
  assert.ok(r.stats.nodes >= 4, 'has anchors');
  const area = r.paths[0].subpaths.reduce((s, sp) => s + sp.area, 0);
  assert.ok(Math.abs(area - Math.PI * 900) < Math.PI * 900 * 0.15, `area ${area} ≈ ${Math.PI * 900}`);
  for (const sp of r.paths[0].subpaths) {
    finite(sp);
    assert.ok(sp.start[0] >= 15 && sp.start[0] <= 85);
    assert.ok(sp.start[1] >= 15 && sp.start[1] <= 85);
    assert.ok(sp.segs.length >= 2);
    assert.equal(sp.closed, true);
  }
});

// 2. Ring → outer + hole
test('ring produces outer and hole subpaths', () => {
  const img = makeImage(120, 120, WHITE);
  fillCircle(img, 60, 60, 40, BLACK);
  fillCircle(img, 60, 60, 18, WHITE);
  const r = C.trace(img, { mode: 'mono', minArea: 5, tolerance: 1 });
  assert.equal(r.paths.length, 1);
  assert.equal(r.paths[0].subpaths.length, 2, 'outer + hole');
  const areas = r.paths[0].subpaths.map(s => s.area).sort((a, b) => b - a);
  assert.ok(areas[0] > areas[1], 'outer larger than hole');
  const outer = areas[0], hole = areas[1];
  assert.ok(Math.abs(outer - Math.PI * 1600) < Math.PI * 1600 * 0.15, 'outer ≈ π·40²');
  assert.ok(Math.abs(hole - Math.PI * 324) < Math.PI * 324 * 0.25, 'hole ≈ π·18²');
});

// 3. Speckle suppression
test('speckle suppression removes dots smaller than minArea', () => {
  const img = makeImage(100, 100, WHITE);
  fillCircle(img, 50, 50, 25, BLACK);
  fillRect(img, 5, 5, 7, 7, BLACK);   // 4 px dot
  fillRect(img, 90, 90, 93, 93, BLACK); // 9 px dot
  const noisy = C.trace(img, { mode: 'mono', minArea: 0, tolerance: 1 });
  const clean = C.trace(img, { mode: 'mono', minArea: 50, tolerance: 1 });
  const countSubs = r => r.paths.reduce((s, p) => s + p.subpaths.length, 0);
  assert.ok(countSubs(noisy) > countSubs(clean), `noisy ${countSubs(noisy)} > clean ${countSubs(clean)}`);
  assert.equal(countSubs(clean), 1, 'only the circle remains');
});

// 4. Hole filling
test('small holes are filled when minArea is set', () => {
  const img = makeImage(100, 100, BLACK);
  fillCircle(img, 50, 50, 30, WHITE);      // big hole stays
  fillCircle(img, 20, 20, 2, WHITE);       // tiny hole (outside big hole region)
  const r = C.trace(img, { mode: 'mono', minArea: 40, tolerance: 1 });
  // after filling the tiny hole, the outer shape is a full black square → 1 outer + 1 big hole
  const subs = r.paths[0].subpaths.length;
  assert.ok(subs >= 1 && subs <= 2, `subpaths ${subs}`);
});

// 5. Color mode: 3-band flag
test('color mode separates three bands with distinct fills', () => {
  const img = makeImage(90, 60, WHITE);
  fillRect(img, 0, 0, 90, 20, RED);
  fillRect(img, 0, 20, 90, 40, GREEN);
  fillRect(img, 0, 40, 90, 60, BLUE);
  const r = C.trace(img, { mode: 'color', colors: 6, minArea: 20, tolerance: 1, stacking: 'stacked' });
  assert.equal(r.paths.length, 3, 'three layers');
  const fills = r.paths.map(p => p.fill.join(','));
  assert.equal(new Set(fills).size, 3, 'distinct colors');
  for (const p of r.paths) for (const sp of p.subpaths) finite(sp);
  // total covered area ≈ 3 × (90×20)
  const total = r.paths.reduce((s, p) => s + p.area, 0);
  assert.ok(Math.abs(total - 5400) < 5400 * 0.2, `total area ${total} ≈ 5400`);
});

// 6. Cutout vs stacked
test('cutout stacking reduces lower-layer area vs stacked', () => {
  const img = makeImage(80, 80, WHITE);
  fillCircle(img, 40, 40, 35, RED);
  fillCircle(img, 40, 40, 18, BLUE);
  const stacked = C.trace(img, { mode: 'color', colors: 4, minArea: 10, tolerance: 1, stacking: 'stacked' });
  const cutout = C.trace(img, { mode: 'color', colors: 4, minArea: 10, tolerance: 1, stacking: 'cutout' });
  assert.ok(stacked.paths.length >= 2);
  assert.ok(cutout.paths.length >= 2);
  // stacked: red layer's hole is filled (extends under blue) → solid disc;
  // cutout: natural masks → red stays a ring. So cutout red area > stacked red.
  const isRed = p => p.fill[0] > 150 && p.fill[2] < 120;
  const isBlue = p => p.fill[2] > 150 && p.fill[0] < 120;
  const redS = stacked.paths.find(isRed), redC = cutout.paths.find(isRed);
  const blueS = stacked.paths.find(isBlue), blueC = cutout.paths.find(isBlue);
  assert.ok(redS && redC && blueS && blueC, 'red & blue layers in both modes');
  assert.ok(redS.subpaths.length === 1, 'stacked red is a filled disc');
  assert.ok(Math.abs(redS.area - Math.PI * 1225) < Math.PI * 1225 * 0.15, `stacked red ≈ π·35², got ${redS.area}`);
  assert.ok(redC.subpaths.length === 2, 'cutout red keeps its hole');
  assert.ok(redC.area > redS.area + 100, `cutout red ${redC.area} > stacked red ${redS.area}`);
  assert.ok(Math.abs(blueS.area - Math.PI * 324) < Math.PI * 324 * 0.25, `blue ≈ π·18², got ${blueS.area}`);
  assert.ok(Math.abs(blueC.area - blueS.area) < blueS.area * 0.2, 'blue identical in both modes');
});

// 7. Quantize bounds
test('quantize returns at most k colors and a valid index map', () => {
  const img = makeImage(50, 50, WHITE);
  fillRect(img, 0, 0, 25, 50, RED);
  fillRect(img, 25, 0, 50, 50, BLUE);
  const q = C.quantize(img.data, img.w, img.h, 4);
  assert.ok(q.palette.length <= 4);
  assert.ok(q.palette.length >= 2);
  assert.equal(q.index.length, 2500);
  for (let i = 0; i < q.index.length; i++) assert.ok(q.index[i] !== 255, 'no transparent px here');
});

// 8. Preprocess: resize + bg removal + median
test('preprocess resizes, keys out background and removes salt noise', () => {
  const img = makeImage(100, 80, WHITE);
  fillCircle(img, 50, 40, 20, BLACK);
  // salt noise
  img.data.set(BLACK, (10 * 100 + 10) * 4);
  img.data.set(BLACK, (70 * 100 + 80) * 4);
  const pre = C.preprocess(img.data, img.w, img.h, { scale: 50, bgMode: 'color', bgColor: [255, 255, 255], bgTolerance: 10, median: 1 });
  assert.equal(pre.w, 50);
  assert.equal(pre.h, 40);
  // background corners transparent
  assert.equal(pre.data[3], 0, 'corner alpha 0');
  assert.equal(pre.data[(39 * 50 + 49) * 4 + 3], 0, 'bottom-right alpha 0');
  // center still opaque dark
  const c = pre.data[(20 * 50 + 25) * 4];
  assert.ok(c < 80, `center dark, got ${c}`);
});

// 9. Otsu sanity
test('otsu finds a threshold between black and white', () => {
  const img = makeImage(40, 40, WHITE);
  fillRect(img, 0, 0, 20, 40, BLACK);
  const t = C.otsu(img.data, img.w, img.h);
  assert.ok(t > 40 && t < 220, `threshold ${t}`);
});

// 10. Determinism
test('tracing is deterministic across runs', () => {
  const img = makeImage(80, 80, WHITE);
  fillCircle(img, 40, 40, 28, BLACK);
  fillRect(img, 55, 10, 70, 25, BLACK);
  const a = JSON.stringify(C.trace(img, { mode: 'mono', minArea: 5, tolerance: 1.2 }));
  const b = JSON.stringify(C.trace(img, { mode: 'mono', minArea: 5, tolerance: 1.2 }));
  assert.equal(a, b);
});

// 11. Alpha handling
test('transparent pixels are excluded from all layers', () => {
  const img = makeImage(60, 60, WHITE);
  fillCircle(img, 30, 30, 20, RED);
  // make left half transparent
  for (let y = 0; y < 60; y++) for (let x = 0; x < 30; x++) img.data[(y * 60 + x) * 4 + 3] = 0;
  const r = C.trace(img, { mode: 'color', colors: 4, minArea: 5, tolerance: 1 });
  assert.ok(r.paths.length >= 1);
  for (const p of r.paths) for (const sp of p.subpaths) {
    // nothing traced deep into the transparent half
    assert.ok(sp.start[0] > 5 || sp.area < 50, 'no geometry inside transparent zone');
  }
});

// 12. Stats consistency
test('stats match traced content', () => {
  const img = makeImage(100, 100, WHITE);
  fillCircle(img, 50, 50, 30, BLACK);
  const r = C.trace(img, { mode: 'mono', minArea: 5, tolerance: 1 });
  let nodes = 0, subs = 0;
  for (const p of r.paths) {
    subs += p.subpaths.length;
    for (const sp of p.subpaths) nodes += sp.nodes;
  }
  assert.equal(r.stats.paths, r.paths.length);
  assert.equal(r.stats.subpaths, subs);
  assert.equal(r.stats.nodes, nodes);
  assert.equal(r.stats.pixelWidth, 100);
  assert.equal(r.stats.pixelHeight, 100);
});

// ---------- professional-quality checks: gradients, crisp corners, layers ----------
function aaImage(w, h, painter) {
  // 4×4 supersampled anti-aliased renderer: painter(px, py) → [r,g,b] | null
  const img = makeImage(w, h, WHITE);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const c = painter(x + (i + 0.5) / 4, y + (j + 0.5) / 4) || [255, 255, 255];
      r += c[0]; g += c[1]; b += c[2];
    }
    img.data.set([Math.round(r / 16), Math.round(g / 16), Math.round(b / 16), 255], (y * w + x) * 4);
  }
  return img;
}

// 13. Linear gradient → ONE gradient layer (not a pile of solid bands)
test('linear gradient fill is kept as a single linear-gradient layer', () => {
  const img = aaImage(200, 140, (x, y) => {
    if (x < 30.3 || x > 170.6 || y < 25.4 || y > 115.2) return null;
    const t = (x - 30) / 140;
    return [30 + 170 * t, 80 - 40 * t, 220 - 20 * t];
  });
  const r = C.trace(img, { mode: 'color', colors: 16, minArea: 8, tolerance: 1, cornerThreshold: 50, gradients: true });
  const grads = r.paths.filter(p => p.gradient);
  assert.equal(grads.length, 1, 'exactly one gradient layer');
  assert.ok(r.paths.length <= 2, `≤ 2 layers (bg + gradient), got ${r.paths.length}`);
  const g = grads[0].gradient;
  assert.equal(g.type, 'linear');
  assert.ok(Math.abs(g.y1 - g.y2) < 3, 'horizontal gradient axis');
  const first = g.stops[0].c, last = g.stops[g.stops.length - 1].c;
  assert.ok(first[2] > first[0] && last[0] > last[1], 'blue → purple stops');
  // crisp rectangle: 4 straight edges, no curves
  const sp = grads[0].subpaths[0];
  assert.equal(sp.segs.length, 4, 'rectangle has exactly 4 segments');
  assert.ok(sp.segs.every(s => s.l), 'all edges straight');
  // disabling gradients falls back to solid bands
  const solid = C.trace(img, { mode: 'color', colors: 16, minArea: 8, tolerance: 1, gradients: false });
  assert.ok(solid.paths.every(p => !p.gradient));
  assert.ok(solid.paths.length > r.paths.length, 'solid mode needs more layers');
});

// 14. Radial glow → radial gradient centred on the disc
test('radial glow is detected as a radial gradient', () => {
  const img = aaImage(160, 160, (x, y) => {
    const d = Math.hypot(x - 80, y - 80);
    if (d > 60) return null;
    const t = d / 60;
    return [255 - 60 * t, 200 - 150 * t, 40];
  });
  const r = C.trace(img, { mode: 'color', colors: 16, minArea: 8, tolerance: 1, gradients: true });
  const g = r.paths.find(p => p.gradient);
  assert.ok(g, 'gradient layer present');
  assert.equal(g.gradient.type, 'radial');
  assert.ok(Math.hypot(g.gradient.cx - 80, g.gradient.cy - 80) < 4, 'centre ≈ (80,80)');
  assert.ok(Math.abs(g.gradient.r - 60) < 6, 'radius ≈ 60');
});

// 15. Anti-aliased flat logo: one layer per colour, exact sharp corners
test('anti-aliased flat logo yields one layer per colour with sharp corners', () => {
  const img = aaImage(220, 160, (x, y) => {
    if (y >= 40 && y <= 140 && Math.abs(x - 170) <= (y - 40) * 0.4) return [250, 200, 20];
    if (x >= 20.5 && x <= 110.5 && y >= 20.5 && y <= 120.5) return [220, 30, 40];
    return null;
  });
  const r = C.trace(img, { mode: 'color', colors: 12, minArea: 8, tolerance: 1, cornerThreshold: 50 });
  assert.equal(r.paths.length, 3, `bg + red + yellow, got ${r.paths.length}`);
  const red = r.paths.find(p => p.fill[0] > 180 && p.fill[1] < 80);
  const sp = red.subpaths[0];
  assert.equal(sp.segs.length, 4, 'square = 4 segments');
  const pts = [sp.start].concat(sp.segs.map(s => s.l));
  for (const pt of pts) {
    const nearX = Math.min(Math.abs(pt[0] - 20.5), Math.abs(pt[0] - 110.5));
    const nearY = Math.min(Math.abs(pt[1] - 20.5), Math.abs(pt[1] - 120.5));
    assert.ok(nearX <= 0.6 && nearY <= 0.6, `corner ${pt} within 0.6px of true corner`);
  }
  const yellow = r.paths.find(p => p.fill[1] > 150);
  assert.ok(yellow.subpaths[0].segs.length <= 4, 'triangle ≤ 4 segments');
});

// 16. Grayscale mode: all layers are neutral grays
test('grayscale mode produces only neutral gray layers', () => {
  const img = makeImage(120, 80, WHITE);
  fillRect(img, 10, 10, 50, 70, RED);
  fillRect(img, 60, 10, 110, 70, BLUE);
  const r = C.trace(img, { mode: 'gray', grays: 4, minArea: 8, tolerance: 1 });
  assert.ok(r.paths.length >= 2);
  for (const p of r.paths) assert.ok(p.fill[0] === p.fill[1] && p.fill[1] === p.fill[2], `gray fill ${p.fill}`);
});

// 17. Ignore White (color): no white layer, white areas become holes
test('ignoreWhite drops white layers in color mode', () => {
  const img = makeImage(100, 100, WHITE);
  fillRect(img, 20, 20, 80, 80, GREEN);
  fillRect(img, 40, 40, 60, 60, WHITE);
  const r = C.trace(img, { mode: 'color', colors: 4, minArea: 8, tolerance: 1, ignoreWhite: true });
  assert.ok(r.paths.length >= 1);
  for (const p of r.paths) assert.ok(!(p.fill[0] > 230 && p.fill[1] > 230 && p.fill[2] > 230), 'no white layer');
  const g = r.paths.find(p => p.fill[1] > 150);
  assert.equal(g.subpaths.length, 2, 'green square keeps a hole');
});

// 18. Limited / custom palette: fills are exact swatches
test('custom palette snaps every layer to a swatch', () => {
  const img = makeImage(100, 60, WHITE);
  fillRect(img, 10, 10, 45, 50, [200, 40, 50, 255]);
  fillRect(img, 55, 10, 90, 50, [40, 50, 190, 255]);
  const pal = [[255, 255, 255], [255, 0, 0], [0, 0, 255]];
  const r = C.trace(img, { mode: 'color', fixedPalette: pal, minArea: 8, tolerance: 1 });
  for (const p of r.paths) assert.ok(pal.some(c => c.join() === p.fill.join()), `fill ${p.fill} is a swatch`);
  assert.ok(r.paths.some(p => p.fill.join() === '255,0,0') && r.paths.some(p => p.fill.join() === '0,0,255'));
});

// 19. B&W without Ignore White traces a white layer under the black one
test('mono with ignoreWhite=false adds a white layer below black', () => {
  const img = makeImage(80, 80, WHITE);
  fillCircle(img, 40, 40, 20, BLACK);
  const r = C.trace(img, { mode: 'mono', minArea: 5, ignoreWhite: false });
  assert.equal(r.paths.length, 2);
  assert.deepEqual(r.paths[0].fill, [255, 255, 255]);
  assert.deepEqual(r.paths[1].fill, [0, 0, 0]);
});

// 20. Centerline strokes: a thin line becomes one open stroke path
test('strokes mode turns a thin line into an open centerline stroke', () => {
  const img = makeImage(120, 60, WHITE);
  fillRect(img, 10, 28, 110, 32, BLACK);       // 4 px thick horizontal bar
  const r = C.trace(img, { mode: 'mono', minArea: 3, strokes: true, fills: false, strokeWidth: 10 });
  const s = r.paths.filter(p => p.isStroke);
  assert.ok(s.length >= 1, 'stroke layer');
  const subs = s.flatMap(p => p.subpaths);
  assert.ok(subs.length >= 1 && subs.length <= 2, `subpaths ${subs.length}`);
  assert.equal(subs[0].closed, false);
  assert.ok(s[0].strokeWidth >= 2 && s[0].strokeWidth <= 6, `width ${s[0].strokeWidth}`);
  let minX = 1e9, maxX = -1e9;
  for (const sp of subs) { const pts = [sp.start].concat(sp.segs.map(q => q.l || q.c.slice(4))); for (const pt of pts) { minX = Math.min(minX, pt[0]); maxX = Math.max(maxX, pt[0]); assert.ok(Math.abs(pt[1] - 30) < 2.5, `y ${pt[1]} on centerline`); } }
  assert.ok(maxX - minX > 80, `span ${maxX - minX}`);
});

// 21. Fills + strokes: thick blobs stay filled, thin lines become strokes
test('fills+strokes keeps thick shapes as fills and thin ones as strokes', () => {
  const img = makeImage(160, 80, WHITE);
  fillCircle(img, 40, 40, 25, BLACK);
  fillRect(img, 90, 38, 150, 41, BLACK);
  const r = C.trace(img, { mode: 'mono', minArea: 3, strokes: true, fills: true, strokeWidth: 8 });
  assert.ok(r.paths.some(p => !p.isStroke), 'fill layer for the disc');
  assert.ok(r.paths.some(p => p.isStroke), 'stroke layer for the line');
});

// 22. Regression: very long jagged outlines (brush strokes / script text) must
//     not be dropped — perimeter can far exceed 4·(w+h)
test('long jagged outline (comb) is traced, not silently dropped', () => {
  const img = makeImage(200, 120, WHITE);
  fillRect(img, 10, 10, 190, 20, BLACK);
  for (let x = 10; x < 190; x += 4) fillRect(img, x, 20, x + 2, 110, BLACK);   // 45 teeth → perimeter ≈ 8000
  const r = C.trace(img, { mode: 'mono', minArea: 2, tolerance: 1 });
  assert.equal(r.paths.length, 1);
  const area = r.paths[0].subpaths.reduce((s, sp) => s + sp.area, 0);
  assert.ok(area > 1800 + 45 * 180 * 0.8, `comb area ${area}`);
});

// 23. Regression: a crescent with only its two tips as corners must not
//     collapse into a single zero-length line
test('crescent / swoosh keeps its full outline', () => {
  const img = makeImage(160, 160, WHITE);
  fillCircle(img, 80, 80, 60, [250, 200, 20, 255]);
  fillCircle(img, 100, 70, 55, WHITE);
  const r = C.trace(img, { mode: 'color', colors: 4, minArea: 8, tolerance: 1, cornerThreshold: 50 });
  const y = r.paths.find(p => p.fill[0] > 200 && p.fill[1] > 150 && p.fill[2] < 100);
  assert.ok(y, 'yellow crescent layer');
  for (const sp of y.subpaths) assert.ok(sp.segs.length >= 2, `segments ${sp.segs.length}`);
});

console.log(passed + ' vector trace tests passed');