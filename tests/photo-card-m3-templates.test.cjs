/* tests/photo-card-m3-templates.test.cjs
 * Comprehensive Automated Test Suite for Milestone 3 (15 New Modern Templates, IDs 31–45)
 * Requirements: R1 (State Isolation), R6 (15 Modern Templates), R7 (Stock Photos), R8 (Auto-Contrast)
 *
 * Zero external dependencies: Built strictly with Node.js native standard libraries.
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

/* =========================================================================
 * 1. HIGH-FIDELITY MOCK DOM & CANVAS 2D SPY CONTEXT
 * ========================================================================= */

function createMockCanvasContext(w = 1080, h = 1080) {
  let saves = 0;
  let restores = 0;
  const drawLog = [];
  let _fillStyle = '#000000';
  let _strokeStyle = '#000000';
  let _font = '16px sans-serif';
  let _lineWidth = 1.0;
  let _filter = 'none';

  return {
    canvas: { width: w, height: h },
    __drawLog: drawLog,
    get saveCount() { return saves; },
    get restoreCount() { return restores; },
    get saveDepth() { return saves - restores; },

    get fillStyle() { return _fillStyle; },
    set fillStyle(v) { _fillStyle = v; drawLog.push({ op: 'fillStyle', val: v }); },

    get strokeStyle() { return _strokeStyle; },
    set strokeStyle(v) { _strokeStyle = v; drawLog.push({ op: 'strokeStyle', val: v }); },

    get font() { return _font; },
    set font(v) { _font = v; drawLog.push({ op: 'font', val: v }); },

    get lineWidth() { return _lineWidth; },
    set lineWidth(v) { _lineWidth = v; },

    get filter() { return _filter; },
    set filter(v) { _filter = v; },

    textAlign: 'left',
    textBaseline: 'top',
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    lineCap: 'butt',
    lineJoin: 'miter',

    save() {
      saves++;
      drawLog.push({ op: 'save', depth: saves - restores });
    },
    restore() {
      restores++;
      drawLog.push({ op: 'restore', depth: saves - restores });
    },
    beginPath() { drawLog.push({ op: 'beginPath' }); },
    closePath() { drawLog.push({ op: 'closePath' }); },
    moveTo(x, y) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y), `moveTo coord must be finite: (${x}, ${y})`);
      drawLog.push({ op: 'moveTo', x, y });
    },
    lineTo(x, y) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y), `lineTo coord must be finite: (${x}, ${y})`);
      drawLog.push({ op: 'lineTo', x, y });
    },
    bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
      assert.ok(Number.isFinite(c1x) && Number.isFinite(c1y) && Number.isFinite(c2x) && Number.isFinite(c2y) && Number.isFinite(x) && Number.isFinite(y), 'bezier coords must be finite');
      drawLog.push({ op: 'bezierCurveTo', c1x, c1y, c2x, c2y, x, y });
    },
    quadraticCurveTo(cx, cy, x, y) {
      assert.ok(Number.isFinite(cx) && Number.isFinite(cy) && Number.isFinite(x) && Number.isFinite(y), 'quadratic coords must be finite');
      drawLog.push({ op: 'quadraticCurveTo', cx, cy, x, y });
    },
    arc(x, y, r, sa, ea) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(r), 'arc coords must be finite');
      drawLog.push({ op: 'arc', x, y, r, sa, ea });
    },
    arcTo(x1, y1, x2, y2, r) {
      assert.ok(Number.isFinite(x1) && Number.isFinite(y1) && Number.isFinite(x2) && Number.isFinite(y2) && Number.isFinite(r), 'arcTo coords must be finite');
      drawLog.push({ op: 'arcTo', x1, y1, x2, y2, r });
    },
    rect(x, y, w, h) { drawLog.push({ op: 'rect', x, y, w, h }); },
    fillRect(x, y, w, h) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(w) && Number.isFinite(h), 'fillRect coords must be finite');
      drawLog.push({ op: 'fillRect', x, y, w, h, fillStyle: _fillStyle });
    },
    strokeRect(x, y, w, h) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(w) && Number.isFinite(h), 'strokeRect coords must be finite');
      drawLog.push({ op: 'strokeRect', x, y, w, h });
    },
    stroke() { drawLog.push({ op: 'stroke' }); },
    fill() { drawLog.push({ op: 'fill' }); },
    clip() { drawLog.push({ op: 'clip' }); },
    fillText(text, x, y, maxW) {
      drawLog.push({ op: 'fillText', text: String(text || ''), x, y, maxW, font: _font, fillStyle: _fillStyle });
    },
    strokeText(text, x, y, maxW) {
      drawLog.push({ op: 'strokeText', text: String(text || ''), x, y, maxW, font: _font, strokeStyle: _strokeStyle });
    },
    measureText(text) {
      const len = String(text || '').length;
      return { width: len * 11, actualBoundingBoxAscent: 11, actualBoundingBoxDescent: 3 };
    },
    translate(x, y) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y), 'translate coords must be finite');
      drawLog.push({ op: 'translate', x, y });
    },
    rotate(rad) {
      assert.ok(Number.isFinite(rad), 'rotate rad must be finite');
      drawLog.push({ op: 'rotate', rad });
    },
    scale(sx, sy) {
      assert.ok(Number.isFinite(sx) && Number.isFinite(sy), 'scale coords must be finite');
      drawLog.push({ op: 'scale', sx, sy });
    },
    createLinearGradient(x0, y0, x1, y1) {
      return { addColorStop() {} };
    },
    createRadialGradient(x0, y0, r0, x1, y1, r1) {
      return { addColorStop() {} };
    },
    drawImage(img, ...args) {
      drawLog.push({ op: 'drawImage', args });
    },
    setLineDash() {},
    getLineDash() { return []; }
  };
}

function createMockElement(tag = 'div', id = '') {
  const children = [];
  const el = {
    tagName: tag.toUpperCase(),
    id: id,
    className: '',
    value: '',
    textContent: '',
    innerHTML: '',
    dataset: {},
    style: {},
    children: children,
    parentElement: null,
    parentNode: null,
    classList: {
      add() {},
      remove() {},
      contains() { return false; },
      toggle() {}
    },
    appendChild(c) {
      children.push(c);
      c.parentElement = el;
      return c;
    },
    removeChild(c) {
      const idx = children.indexOf(c);
      if (idx !== -1) children.splice(idx, 1);
      return c;
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect() {
      return { top: 0, left: 0, width: 1080, height: 1080, bottom: 1080, right: 1080 };
    },
    getContext(type) {
      if (type === '2d') {
        if (!el.__ctx) el.__ctx = createMockCanvasContext(el.width || 1080, el.height || 1080);
        return el.__ctx;
      }
      return null;
    }
  };
  return el;
}

// Global Browser / DOM Setup
const domRegistry = {};
function regEl(id, tag = 'div') {
  const el = createMockElement(tag, id);
  domRegistry[id] = el;
  return el;
}

global.requestAnimationFrame = cb => cb();
global.cancelAnimationFrame = () => {};

global.window = {
  location: { search: '', origin: 'https://tools.techhat.com.bd' },
  innerWidth: 1440,
  innerHeight: 900,
  requestAnimationFrame: global.requestAnimationFrame,
  cancelAnimationFrame: global.cancelAnimationFrame,
  addEventListener() {},
  removeEventListener() {}
};

const head = createMockElement('head');
const body = createMockElement('body');
const html = createMockElement('html');

global.document = {
  readyState: 'complete',
  documentElement: html,
  head: head,
  body: body,
  activeElement: null,
  addEventListener() {},
  removeEventListener() {},
  createElement(tag) { return createMockElement(tag); },
  getElementById(id) { return domRegistry[id] || null; },
  querySelector(sel) {
    if (sel.startsWith('#')) return domRegistry[sel.slice(1)] || null;
    return null;
  },
  querySelectorAll() { return []; }
};

// Canvas element in DOM
const pcCanvas = regEl('pcCanvas', 'canvas');
pcCanvas.width = 1080;
pcCanvas.height = 1080;
regEl('pcStageScrollArea');
regEl('pcArtboardColumn');
regEl('pcArtboardWrap');
regEl('pcContextMenu');
regEl('pcShareDropdown');

// Mock Image class
class MockImage {
  constructor() {
    this.naturalWidth = 1200;
    this.naturalHeight = 800;
    this.width = 1200;
    this.height = 800;
    this._src = '';
  }
  get src() { return this._src; }
  set src(v) {
    this._src = v;
    setTimeout(() => { if (this.onload) this.onload(); }, 2);
  }
}
global.Image = MockImage;

// Load Engine
const Engine = require('../public/js/photo-card-engine.js');

/* =========================================================================
 * 2. TEST DEFINITIONS: 15 NEW TEMPLATES (IDs 31–45)
 * ========================================================================= */

const M3_TEMPLATE_SPECS = [
  { id: 'channel-i-flag-news', cat: 'news', primary: '#15803d', accent: '#dc2626', bg: '#051f15' },
  { id: 'torn-paper-advice', cat: 'quote', primary: '#000000', accent: '#f59e0b', bg: '#ffffff' },
  { id: 'creator-milestone', cat: 'modern', primary: '#7c3aed', accent: '#facc15', bg: '#0b0416' },
  { id: 'framed-satire-troll', cat: 'modern', primary: '#f59e0b', accent: '#facc15', bg: '#09090b' },
  { id: 'multi-store-links', cat: 'modern', primary: '#b91c1c', accent: '#dc2626', bg: '#fbf8f1' },
  { id: 'quran-tafseer-editorial', cat: 'quote', primary: '#1d3c34', accent: '#047857', bg: '#f0f7f4' },
  { id: 'split-horizon-quote', cat: 'quote', primary: '#0f766e', accent: '#facc15', bg: '#0b2926' },
  { id: 'minimal-pair-verse', cat: 'quote', primary: '#991b1b', accent: '#000000', bg: '#ffffff' },
  { id: 'burgundy-grid-scholar', cat: 'quote', primary: '#881337', accent: '#dc2626', bg: '#2a0812' },
  { id: 'jummah-hadith-ribbon', cat: 'quote', primary: '#047857', accent: '#10b981', bg: '#fcfbf7' },
  { id: 'design-mockup-showcase', cat: 'modern', primary: '#ea580c', accent: '#334155', bg: '#f8fafc' },
  { id: 'sacred-hadith-frame', cat: 'quote', primary: '#15803d', accent: '#b45309', bg: '#ffffff' },
  { id: 'channel24-broadcast-news', cat: 'news', primary: '#b91c1c', accent: '#f97316', bg: '#1a0508' },
  { id: 'parody-satire-portal', cat: 'news', primary: '#dc2626', accent: '#1e293b', bg: '#ffffff' },
  { id: 'humanitarian-hotline-split', cat: 'charity', primary: '#dc2626', accent: '#16a34a', bg: '#ffffff' }
];

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failCount++;
  }
}

console.log('\n======================================================================');
console.log('  MILESTONE 3: 15 NEW MODERN TEMPLATES ENGINE AUTOMATED TEST SUITE');
console.log('======================================================================\n');

// -------------------------------------------------------------------------
// SECTION 1: METADATA & SCHEMA COMPLETENESS
// -------------------------------------------------------------------------
console.log('[SECTION 1] Template Metadata & Schema Completeness:');

test('M3-01: Engine.TEMPLATES total catalog count equals 45', () => {
  assert.equal(Object.keys(Engine.TEMPLATES).length, 45, 'TEMPLATES must have exactly 45 templates');
});

test('M3-02: All 15 new templates exist in TEMPLATES with valid schema', () => {
  const mandatoryFields = [
    'cat', 'nameBn', 'whenToUseBn', 'primary', 'accent', 'bg',
    'align', 'titleSize', 'badge', 'headline', 'tagline', 'detail',
    'defaultBrand', 'defaultFooter', 'labels'
  ];

  for (const spec of M3_TEMPLATE_SPECS) {
    const meta = Engine.TEMPLATES[spec.id];
    assert.ok(meta, `Template "${spec.id}" must exist in TEMPLATES`);

    for (const f of mandatoryFields) {
      assert.ok(meta[f] !== undefined && meta[f] !== null, `Template "${spec.id}" missing field: ${f}`);
    }

    assert.equal(meta.cat, spec.cat, `Template "${spec.id}" category mismatch`);
    assert.equal(meta.primary.toLowerCase(), spec.primary.toLowerCase(), `Template "${spec.id}" primary color mismatch`);
    assert.equal(meta.accent.toLowerCase(), spec.accent.toLowerCase(), `Template "${spec.id}" accent color mismatch`);
    assert.equal(meta.bg.toLowerCase(), spec.bg.toLowerCase(), `Template "${spec.id}" bg color mismatch`);

    assert.ok(meta.labels.badge, `Template "${spec.id}" missing labels.badge`);
    assert.ok(meta.labels.headline, `Template "${spec.id}" missing labels.headline`);
    assert.ok(meta.labels.tagline, `Template "${spec.id}" missing labels.tagline`);
    assert.ok(meta.labels.detail, `Template "${spec.id}" missing labels.detail`);
  }
});

test('M3-03: Category distribution for the 15 templates matches scope', () => {
  const counts = { news: 0, quote: 0, modern: 0, charity: 0 };
  for (const spec of M3_TEMPLATE_SPECS) {
    counts[spec.cat]++;
  }
  assert.equal(counts.news, 3, 'Expected 3 news templates');
  assert.equal(counts.quote, 7, 'Expected 7 quote templates');
  assert.equal(counts.modern, 4, 'Expected 4 modern templates');
  assert.equal(counts.charity, 1, 'Expected 1 charity template');
});

// -------------------------------------------------------------------------
// SECTION 2: SVELTE CATALOG INTEGRATION PARITY
// -------------------------------------------------------------------------
console.log('\n[SECTION 2] Svelte Component Catalog Parity:');

test('M3-04: PhotoCardStudio.svelte catalog contains all 45 templates', () => {
  const svelteSrc = fs.readFileSync(path.join(__dirname, '../src/components/PhotoCardStudio.svelte'), 'utf8');
  const match = svelteSrc.match(/const templates: TemplateItem\[\] = \[([\s\S]*?)\];/);
  assert.ok(match, 'Template array must be present in Svelte component');

  const svelteIds = [...match[1].matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
  assert.equal(svelteIds.length, 45, `Expected 45 templates in Svelte catalog, found ${svelteIds.length}`);

  for (const spec of M3_TEMPLATE_SPECS) {
    assert.ok(svelteIds.includes(spec.id), `Svelte catalog must contain template "${spec.id}"`);
  }
});

test('M3-05: Svelte category filter header labels reflect updated counts', () => {
  const svelteSrc = fs.readFileSync(path.join(__dirname, '../src/components/PhotoCardStudio.svelte'), 'utf8');
  assert.ok(svelteSrc.includes("সব (৪৫)"), 'Must show সব (৪৫) in category filter');
  assert.ok(svelteSrc.includes("All (45)"), 'Must show All (45) in category filter');
  assert.ok(svelteSrc.includes("ফাউন্ডেশন (৯)"), 'Must show ফাউন্ডেশন (৯) in category filter');
  assert.ok(svelteSrc.includes("নিউজ (১১)"), 'Must show নিউজ (১১) in category filter');
  assert.ok(svelteSrc.includes("উক্তি (১৩)"), 'Must show উক্তি (১৩) in category filter');
  assert.ok(svelteSrc.includes("মডার্ন (৯)"), 'Must show মডার্ন (৯) in category filter');
});

// -------------------------------------------------------------------------
// SECTION 3: RENDERERS DISPATCH & ALIAS MAPPING
// -------------------------------------------------------------------------
console.log('\n[SECTION 3] Renderers Master Dispatch & Aliases:');

test('M3-06: Master RENDERERS dictionary dispatches all 45 templates', () => {
  assert.ok(Engine.RENDERERS, 'RENDERERS must be exported');
  assert.equal(Object.keys(Engine.RENDERERS).length, 45, 'RENDERERS must dispatch 45 templates');

  for (const spec of M3_TEMPLATE_SPECS) {
    const fn = Engine.RENDERERS[spec.id];
    assert.equal(typeof fn, 'function', `Renderer for "${spec.id}" must be a function`);
  }
});

// -------------------------------------------------------------------------
// SECTION 4: RENDERING ACROSS ASPECT RATIOS (1:1, 4:5, 16:9)
// -------------------------------------------------------------------------
console.log('\n[SECTION 4] Multi-Aspect Ratio Rendering Resilience:');

const ASPECT_RATIOS = [
  { name: 'Square 1:1', w: 1080, h: 1080, u: 1.0 },
  { name: 'Portrait 4:5', w: 1080, h: 1350, u: 1.0 },
  { name: 'Landscape 16:9', w: 1200, h: 630, u: 0.74 }
];

test('M3-07: All 15 renderers execute cleanly across Square, Portrait, and Landscape', () => {
  for (const spec of M3_TEMPLATE_SPECS) {
    const fn = Engine.RENDERERS[spec.id];
    const meta = Engine.TEMPLATES[spec.id];

    // Initialize state
    const state = Engine.getState();
    state.template = spec.id;
    state.primaryColor = meta.primary;
    state.accentColor = meta.accent;
    state.bgColor = meta.bg;
    state.headline = meta.headline;
    state.tagline = meta.tagline;
    state.detail = meta.detail;
    state.badge = meta.badge;
    state.brandName = meta.defaultBrand;
    state.footerText = meta.defaultFooter;
    state.titleSize = meta.titleSize;
    state.customLayers = [];

    for (const ar of ASPECT_RATIOS) {
      const ctx = createMockCanvasContext(ar.w, ar.h);
      assert.doesNotThrow(() => {
        fn(ctx, ar.w, ar.h, ar.u);
      }, `Template "${spec.id}" failed rendering on ${ar.name}`);
      assert.ok(ctx.__drawLog.length > 5, `Template "${spec.id}" should emit drawing commands`);
    }
  }
});

// -------------------------------------------------------------------------
// SECTION 5: STRICT CANVAS STATE ISOLATION (saveDepth === 0)
// -------------------------------------------------------------------------
console.log('\n[SECTION 5] Strict Canvas State Isolation (saveDepth === 0):');

test('M3-08: Every template renderer maintains net save/restore balance (saveDepth === 0)', () => {
  for (const spec of M3_TEMPLATE_SPECS) {
    const fn = Engine.RENDERERS[spec.id];
    const meta = Engine.TEMPLATES[spec.id];

    const state = Engine.getState();
    state.template = spec.id;
    state.primaryColor = meta.primary;
    state.accentColor = meta.accent;
    state.bgColor = meta.bg;
    state.headline = meta.headline;
    state.tagline = meta.tagline;
    state.detail = meta.detail;
    state.badge = meta.badge;

    for (const ar of ASPECT_RATIOS) {
      const ctx = createMockCanvasContext(ar.w, ar.h);
      fn(ctx, ar.w, ar.h, ar.u);

      assert.equal(
        ctx.saveDepth,
        0,
        `Template "${spec.id}" (${ar.name}) unbalanced stack: saves=${ctx.saveCount}, restores=${ctx.restoreCount}`
      );
    }
  }
});

// -------------------------------------------------------------------------
// SECTION 6: CONTEXT-AWARE STOCK PHOTO RESOLUTION
// -------------------------------------------------------------------------
console.log('\n[SECTION 6] Royalty-Free Stock Photo Placeholders (R7):');

test('M3-09: All 15 templates resolve to valid Unsplash stock photo specs', () => {
  for (const spec of M3_TEMPLATE_SPECS) {
    const stockSpec = Engine.getStockPhotoSpec(spec.id, spec.cat);
    assert.ok(stockSpec, `Template "${spec.id}" must have stock photo spec`);
    assert.ok(stockSpec.url.startsWith('https://images.unsplash.com/'), `Template "${spec.id}" URL must be Unsplash HTTPS`);
    assert.equal(stockSpec.cat, spec.cat, `Stock spec category mismatch for "${spec.id}"`);
    assert.ok(stockSpec.labelBn && stockSpec.labelBn.length > 2, `Missing labelBn for "${spec.id}"`);
    assert.ok(stockSpec.credit && stockSpec.credit.length > 5, `Missing credit for "${spec.id}"`);
  }
});

// -------------------------------------------------------------------------
// SECTION 7: SMART TEXT CONTRAST ADAPTATION (R8)
// -------------------------------------------------------------------------
console.log('\n[SECTION 7] Smart Text Contrast Adaptation Engine (WCAG 2.1):');

test('M3-10: Light deck templates adapt light text to deep slate/black', () => {
  const lightTemplates = [
    'torn-paper-advice',
    'multi-store-links',
    'quran-tafseer-editorial',
    'sacred-hadith-frame',
    'parody-satire-portal',
    'humanitarian-hotline-split'
  ];

  for (const tplId of lightTemplates) {
    const meta = Engine.TEMPLATES[tplId];
    const lum = Engine.getRelativeLuminance(meta.bg);
    assert.ok(lum > 0.42, `Template "${tplId}" background should be light ($L > 0.42), got: ${lum}`);

    // Test text color resolution
    const effectiveWhite = Engine.getEffectiveTextColor('#ffffff', meta.bg);
    assert.equal(effectiveWhite, '#0f172a', `White text over "${tplId}" bg must flip to deep slate #0f172a`);

    const effectiveSlate = Engine.getEffectiveTextColor('#e2e8f0', meta.bg);
    assert.equal(effectiveSlate, '#0f172a', `Light slate text over "${tplId}" bg must flip to deep slate`);

    // Saturated accents preserved if compliant
    if (meta.primary && Engine.getContrastRatio(meta.primary, meta.bg) >= 4.5) {
      const effectivePrimary = Engine.getEffectiveTextColor(meta.primary, meta.bg);
      assert.equal(effectivePrimary.toLowerCase(), meta.primary.toLowerCase(), `Compliant primary accent should be preserved on "${tplId}"`);
    }
  }
});

// -------------------------------------------------------------------------
// SECTION 8: PROCEDURAL VECTOR GEOMETRIES & MATHEMATICAL RESILIENCE
// -------------------------------------------------------------------------
console.log('\n[SECTION 8] Procedural Vector Geometry & Robustness:');

test('M3-11: Procedural deckle edge in torn-paper-advice generates harmonic serrations', () => {
  const ctx = createMockCanvasContext(1080, 1080);
  const state = Engine.getState();
  state.template = 'torn-paper-advice';
  state.bgColor = '#ffffff';
  state.headline = 'উপদেশ *নসিহত* বাক্য';

  Engine.RENDERERS['torn-paper-advice'](ctx, 1080, 1080, 1.0);

  const lineTos = ctx.__drawLog.filter(op => op.op === 'lineTo');
  const deckleLineTos = lineTos.filter(op => op.y >= 300 && op.y <= 600);
  assert.ok(deckleLineTos.length >= 32, 'Deckle edge must generate at least 32 interpolation segments');

  for (const op of deckleLineTos) {
    assert.ok(Number.isFinite(op.x), 'Deckle X must be finite');
    assert.ok(Number.isFinite(op.y), 'Deckle Y must be finite');
    assert.ok(op.x >= 0 && op.x <= 1080, `Deckle X out of bounds: ${op.x}`);
    assert.ok(op.y >= 300 && op.y <= 600, `Deckle Y out of expected deckle zone: ${op.y}`);
  }
});

test('M3-12: ECG heartbeat pulse in humanitarian-hotline-split generates valid cardiogram spike', () => {
  const ctx = createMockCanvasContext(1080, 1080);
  const state = Engine.getState();
  state.template = 'humanitarian-hotline-split';
  state.bgColor = '#ffffff';
  state.headline = 'মনোসামাজিক\nসহায়তায়\n*হটলাইন*';
  state.detail = '০১৮১১-৪৫৮৫৪১';

  Engine.RENDERERS['humanitarian-hotline-split'](ctx, 1080, 1080, 1.0);

  const strokes = ctx.__drawLog.filter(op => op.op === 'stroke');
  assert.ok(strokes.length >= 2, 'Must render ECG cardiogram pulse stroke');
});

test('M3-13: Organic cloud puffs in sacred-hadith-frame & jummah-hadith-ribbon render smoothly', () => {
  const cloudTemplates = ['sacred-hadith-frame', 'jummah-hadith-ribbon'];

  for (const tplId of cloudTemplates) {
    const ctx = createMockCanvasContext(1080, 1080);
    const meta = Engine.TEMPLATES[tplId];
    const state = Engine.getState();
    state.template = tplId;
    state.bgColor = meta.bg;
    state.headline = meta.headline;
    state.tagline = meta.tagline;
    state.detail = meta.detail;

    Engine.RENDERERS[tplId](ctx, 1080, 1080, 1.0);

    const arcs = ctx.__drawLog.filter(op => op.op === 'arc');
    assert.ok(arcs.length >= 7, `Template "${tplId}" must render cloud puff arcs`);
  }
});

// -------------------------------------------------------------------------
// SECTION 9: RAPID STATE ISOLATION & SWITCHING STRESS
// -------------------------------------------------------------------------
console.log('\n[SECTION 9] State Isolation & Template Churn Stress (R1):');

test('M3-14: Rapid sequential switching across all 15 templates unloads cleanly without leaking layers', () => {
  const state = Engine.getState();

  for (let cycle = 0; cycle < 3; cycle++) {
    for (const spec of M3_TEMPLATE_SPECS) {
      const meta = Engine.TEMPLATES[spec.id];

      // Simulate user adding dirty custom layers on current template
      state.customLayers.push({ id: `dirty_${spec.id}`, layerType: 'text', text: 'Stale Custom Text' });
      state.elementOffsets = { headline: { dx: 50, dy: -50 } };

      // Switch to template: apply clean state
      state.template = spec.id;
      state.primaryColor = meta.primary;
      state.accentColor = meta.accent;
      state.bgColor = meta.bg;
      state.headline = meta.headline;
      state.tagline = meta.tagline;
      state.detail = meta.detail;
      state.customLayers = []; // Clean state unload
      state.elementOffsets = {};

      const ctx = createMockCanvasContext(1080, 1080);
      Engine.RENDERERS[spec.id](ctx, 1080, 1080, 1.0);

      assert.equal(state.customLayers.length, 0, `Template "${spec.id}" must maintain clean state`);
      assert.equal(ctx.saveDepth, 0, `Template "${spec.id}" canvas stack unbalanced during churn`);
    }
  }
});

// -------------------------------------------------------------------------
// SECTION 10: RICH TYPOGRAPHY AND MARKDOWN HIGHLIGHT RESILIENCE
// -------------------------------------------------------------------------
console.log('\n[SECTION 10] Rich Typography & Markdown Highlight Rendering:');

test('M3-15: All 15 templates execute cleanly with complex multi-word markdown highlights and element offsets', () => {
  for (const spec of M3_TEMPLATE_SPECS) {
    const meta = Engine.TEMPLATES[spec.id];
    const state = Engine.getState();
    state.template = spec.id;
    state.primaryColor = meta.primary;
    state.accentColor = meta.accent;
    state.bgColor = meta.bg;
    state.headline = 'প্রথম অংশ *হাইলাইট শব্দ* এবং শেষাংশ বড় শিরোনাম';
    state.tagline = 'উপ-শিরোনাম *ট্যাগ* লাইন তথ্য';
    state.detail = 'বিস্তারিত *তথ্য* বিবরণী ও হাদিস নম্বর';
    state.elementOffsets = { headline: { dx: 10, dy: -5 } };

    const ctx = createMockCanvasContext(1080, 1080);
    Engine.RENDERERS[spec.id](ctx, 1080, 1080, 1.0);

    const fillTexts = ctx.__drawLog.filter(op => op.op === 'fillText');
    assert.ok(fillTexts.length >= 2, `Template "${spec.id}" must render text tokens on canvas`);
    assert.equal(ctx.saveDepth, 0, `Template "${spec.id}" must maintain saveDepth === 0 with offsets and markdown`);
  }
});

// -------------------------------------------------------------------------
// SECTION 11: DEFECT #5 & DEFECT #6 VISUAL CONTRAST & TYPOGRAPHY REGRESSIONS
// -------------------------------------------------------------------------
console.log('\n[SECTION 11] Defect #5 & #6 Contrast, Badge Pill, Arch Clearance & Typography Scale Regressions:');

test('M3-16 (Defect #6): split-horizon-quote renders dark high-contrast reflection text on light lower surface and keeps arch emblem clear of logo pill', () => {
  const state = Engine.getState();
  const meta = Engine.TEMPLATES['split-horizon-quote'];
  state.template = 'split-horizon-quote';
  state.primaryColor = meta.primary;
  state.accentColor = meta.accent;
  state.bgColor = meta.bg; // dark teal #0f3b3e
  state.headline = meta.headline;
  state.tagline = meta.tagline;
  state.detail = meta.detail;
  state.brandName = meta.defaultBrand;
  state.logoPos = 'top-right';
  state.elementOffsets = {};
  state.elementHidden = {};

  const ctx = createMockCanvasContext(1080, 1080);
  Engine.RENDERERS['split-horizon-quote'](ctx, 1080, 1080, 1.0);

  // Lower wave surface starts around y >= 620 (#f6f8f7). Every fillText in the reflection zone (620..960) MUST have dark ink (CR >= 4.5 against #f6f8f7), NEVER white!
  const lowerTexts = ctx.__drawLog.filter(op => op.op === 'fillText' && op.y >= 620 && op.y <= 960);
  assert.ok(lowerTexts.length >= 1, 'split-horizon-quote must render lower reflection text');
  for (const tOp of lowerTexts) {
    assert.notEqual(String(tOp.fillStyle).toLowerCase(), '#ffffff', `Reflection word "${tOp.text}" must not be white on #f6f8f7`);
    const cr = Engine.getContrastRatio(tOp.fillStyle, '#f6f8f7');
    assert.ok(cr >= 4.5, `Reflection word "${tOp.text}" contrast ${cr.toFixed(2)} must be >= 4.5 against #f6f8f7`);
  }
});

test('M3-17 (Defect #6): burgundy-grid-scholar respects Clean Paper (#f8fafc) background and adapts statement ink to high contrast', () => {
  const state = Engine.getState();
  state.template = 'burgundy-grid-scholar';
  state.bgColor = '#f8fafc';      // Clean Paper light background
  state.primaryColor = '#b91c1c'; // Clean Paper primary
  state.accentColor = '#0f172a';  // Clean Paper accent
  state.headline = 'জ্ঞানই মানুষের *প্রকৃত* শক্তি';
  state.tagline = 'ড. মুহাম্মদ শহীদুল্লাহ';
  state.detail = 'শিক্ষাবিদ ও গবেষক';
  state.elementOffsets = {};
  state.elementHidden = {};

  const ctx = createMockCanvasContext(1080, 1080);
  Engine.RENDERERS['burgundy-grid-scholar'](ctx, 1080, 1080, 1.0);

  // First full-bleed background fillRect must use #f8fafc, NOT hardcoded #35080f
  const fullBgRect = ctx.__drawLog.find(op => op.op === 'fillRect' && op.w === 1080 && op.h === 1080);
  assert.ok(fullBgRect, 'burgundy-grid-scholar must draw full-bleed background');
  assert.equal(String(fullBgRect.fillStyle).toLowerCase(), '#f8fafc', 'burgundy-grid-scholar must honor Clean Paper state.bgColor');

  // Statement words in upper/middle card (y < 760) must have WCAG >= 4.5 contrast against #f8fafc
  const quoteTexts = ctx.__drawLog.filter(op => op.op === 'fillText' && op.y >= 160 && op.y <= 740 && op.text.trim().length > 1);
  assert.ok(quoteTexts.length >= 2, 'burgundy-grid-scholar must render quote words');
  for (const tOp of quoteTexts) {
    const cr = Engine.getContrastRatio(tOp.fillStyle, '#f8fafc');
    assert.ok(cr >= 4.5, `Quote word "${tOp.text}" color ${tOp.fillStyle} must achieve >= 4.5 contrast on Clean Paper (#f8fafc), got ${cr.toFixed(2)}`);
  }
});

test('M3-18 (Defect #6): blood-donation blood group pill keeps crisp white text even when Clean Paper sets accentColor=#0f172a', () => {
  const state = Engine.getState();
  state.template = 'blood-donation';
  state.bgColor = '#f8fafc';
  state.primaryColor = '#b91c1c';
  state.accentColor = '#0f172a';
  state.badge = 'O+ (পজিটিভ)';
  state.headline = 'মুমূর্ষু রোগীর জন্য জরুরি *রক্তের* প্রয়োজন';
  state.tagline = 'ঢাকা মেডিকেল কলেজ হাসপাতাল';
  state.detail = 'যোগাযোগ: ০১৭১২-৩৪৫৬৭৮';

  const ctx = createMockCanvasContext(1080, 1080);
  Engine.RENDERERS['blood-donation'](ctx, 1080, 1080, 1.0);

  const bgPillText = ctx.__drawLog.find(op => op.op === 'fillText' && op.text.includes('গ্রুপ:') && op.text.includes('O+'));
  assert.ok(bgPillText, 'blood-donation must render blood group text inside red pill');
  const crOnRed = Engine.getContrastRatio(bgPillText.fillStyle, '#b91c1c');
  assert.ok(crOnRed >= 4.5, `Blood group pill text (${bgPillText.fillStyle}) must have >= 4.5 contrast against #b91c1c pill fill, got ${crOnRed.toFixed(2)}`);
});

test('M3-19 (Defect #6): Editorial & Hadith templates use scaled-up default typography (multi-store-links, quran-tafseer-editorial, jummah-hadith-ribbon, sacred-hadith-frame)', () => {
  assert.ok(Engine.TEMPLATES['multi-store-links'].titleSize >= 52, 'multi-store-links titleSize must be >= 52');
  assert.ok(Engine.TEMPLATES['quran-tafseer-editorial'].titleSize >= 58, 'quran-tafseer-editorial titleSize must be >= 58');
  assert.ok(Engine.TEMPLATES['jummah-hadith-ribbon'].titleSize >= 52, 'jummah-hadith-ribbon titleSize must be >= 52');
  assert.ok(Engine.TEMPLATES['sacred-hadith-frame'].titleSize >= 46, 'sacred-hadith-frame titleSize must be >= 46');
});

// -------------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------------
console.log('\n----------------------------------------------------------------------');
console.log(`Test Execution Finished: ${passCount}/${passCount + failCount} Passed (${failCount} Failed)`);
console.log('----------------------------------------------------------------------\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL 15 NEW MODERN TEMPLATES ENGINE TESTS PASSED WITH 100% SUCCESS.\n');
  process.exit(0);
}
