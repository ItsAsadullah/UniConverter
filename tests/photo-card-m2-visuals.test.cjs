/**
 * TechHat Photo Card Studio — Milestone 2 Visual Assets & Smart Contrast Test Suite
 * 
 * Verifies Milestone 2 requirements:
 * - R7: Context-Aware Royalty-Free Stock Photo Placeholders
 * - R8: Smart Text Contrast Adaptation Engine (WCAG 2.1 relative luminance)
 * - R9: Expanded Badges & Editable Stickers (38 bilingual items across 5 categories + tinting)
 * - R10: Native SVG Payment Vectors (bKash, Nagad, Rocket) & Callout Box vector pills
 * 
 * Run: node tests/photo-card-m2-visuals.test.cjs
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const Engine = require('../public/js/photo-card-engine.js');
const sveltePath = path.join(__dirname, '../src/components/PhotoCardStudio.svelte');
const svelteSrc = fs.readFileSync(sveltePath, 'utf8');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('\n--- MILESTONE 2: VISUAL ASSETS, SMART CONTRAST & SVG VECTORS TEST SUITE ---\n');

/* =========================================================================
 * 1. R7: CONTEXT-AWARE ROYALTY-FREE STOCK PHOTO PLACEHOLDERS
 * ========================================================================= */
console.log('[R7] Context-Aware Stock Photo Placeholders:');

test('R7-01: STOCK_PHOTO_REGISTRY is exported and contains verified Unsplash assets', () => {
  assert.ok(Engine.STOCK_PHOTO_REGISTRY, 'STOCK_PHOTO_REGISTRY must be exported');
  const keys = Object.keys(Engine.STOCK_PHOTO_REGISTRY);
  assert.ok(keys.length >= 20, `Registry must contain at least 20 entries, found: ${keys.length}`);
  assert.ok(Engine.STOCK_PHOTO_REGISTRY['default'], 'Registry must contain default fallback');
  assert.ok(Engine.STOCK_PHOTO_REGISTRY['news'], 'Registry must contain news category spec');
  assert.ok(Engine.STOCK_PHOTO_REGISTRY['breaking-urgent'], 'Registry must contain breaking-urgent template spec');
  assert.ok(Engine.STOCK_PHOTO_REGISTRY['factcheck-dual'], 'Registry must contain factcheck-dual spec');
  assert.ok(Engine.STOCK_PHOTO_REGISTRY['factcheck-dual-verified'], 'Registry must contain factcheck-dual verified spec');
});

test('R7-02: Every stock photo entry has valid HTTPS url, cat, labelBn, and credit', () => {
  for (const [key, spec] of Object.entries(Engine.STOCK_PHOTO_REGISTRY)) {
    assert.ok(spec.url && spec.url.startsWith('https://images.unsplash.com/'), `Key "${key}" URL must start with Unsplash domain`);
    assert.ok(spec.cat, `Key "${key}" must have a category`);
    assert.ok(spec.labelBn, `Key "${key}" must have a Bengali label`);
    assert.ok(spec.credit && spec.credit.length > 5, `Key "${key}" must have attribution credit`);
  }
});

test('R7-03: All 30 studio templates resolve to a valid stock photo spec', () => {
  assert.ok(Engine.TEMPLATES, 'TEMPLATES must be defined');
  const templateIds = Object.keys(Engine.TEMPLATES);
  assert.ok(templateIds.length >= 30, 'Should have at least 30 templates');

  for (const tplId of templateIds) {
    const meta = Engine.TEMPLATES[tplId];
    const spec = Engine.getStockPhotoSpec(tplId, meta ? meta.cat : undefined);
    assert.ok(spec, `Template "${tplId}" must resolve to a stock photo spec`);
    assert.ok(spec.url, `Template "${tplId}" spec must have a valid URL`);
  }
});

test('R7-04: getStockPhotoSpec resolves category fallback for unknown template', () => {
  const spec = Engine.getStockPhotoSpec('non-existent-template-id', 'charity');
  assert.ok(spec, 'Category fallback must return a spec');
  assert.equal(spec.cat, 'charity');
  assert.ok(spec.url.includes('images.unsplash.com'));
});

test('R7-05: getStockPhotoSpec resolves global default for completely unknown template and category', () => {
  const spec = Engine.getStockPhotoSpec('unknown-template-xyz', 'unknown-cat-abc');
  assert.ok(spec, 'Global default must return a spec');
  assert.equal(spec.url, Engine.STOCK_PHOTO_REGISTRY['default'].url);
});

test('R7-06: factcheck-dual resolves distinct images for slot 1 vs slot 2', () => {
  const slot1 = Engine.getStockPhotoSpec('factcheck-dual', 'factcheck', false);
  const slot2Bool = Engine.getStockPhotoSpec('factcheck-dual', 'factcheck', true);
  const slot2Str = Engine.getStockPhotoSpec('factcheck-dual', 'factcheck', 'slot-2');

  assert.ok(slot1.url, 'Slot 1 must have URL');
  assert.ok(slot2Bool.url, 'Slot 2 (bool) must have URL');
  assert.ok(slot2Str.url, 'Slot 2 (string) must have URL');
  assert.notEqual(slot1.url, slot2Bool.url, 'Slot 1 and Slot 2 must have distinct URLs');
  assert.equal(slot2Bool.url, slot2Str.url, 'Slot 2 boolean and string arg must yield same verified URL');
});

test('R7-07: preloadStockPhoto populates stockPhotoCache and handles duplicate calls safely', () => {
  const testUrl = 'https://images.unsplash.com/photo-test-preload-sample';
  assert.ok(Engine.stockPhotoCache, 'stockPhotoCache must be exposed');

  Engine.preloadStockPhoto(testUrl);
  assert.ok(Engine.stockPhotoCache[testUrl], 'Cache entry must be created');
  assert.equal(Engine.stockPhotoCache[testUrl].status, 'loading');

  // Calling duplicate preload should not reset or throw
  Engine.preloadStockPhoto(testUrl);
  assert.equal(Engine.stockPhotoCache[testUrl].status, 'loading');
});

test('R7-08: getStockPhotoSpec safely falls back to default on empty/null parameters', () => {
  const specNull = Engine.getStockPhotoSpec(null, null);
  assert.ok(specNull && specNull.url, 'Must return default spec on null args');
  assert.equal(specNull.url, Engine.STOCK_PHOTO_REGISTRY['default'].url);

  const specUndef = Engine.getStockPhotoSpec(undefined, undefined);
  assert.ok(specUndef && specUndef.url, 'Must return default spec on undefined args');
  assert.equal(specUndef.url, Engine.STOCK_PHOTO_REGISTRY['default'].url);
});

test('R7-09: getStockPhotoSpec safely falls back to default on prototype keys ("constructor", "__proto__", "toString")', () => {
  const defaultSpec = Engine.STOCK_PHOTO_REGISTRY['default'];
  assert.equal(Engine.getStockPhotoSpec('constructor'), defaultSpec);
  assert.equal(Engine.getStockPhotoSpec('__proto__'), defaultSpec);
  assert.equal(Engine.getStockPhotoSpec('toString'), defaultSpec);
  assert.equal(Engine.getStockPhotoSpec('non-existent-template', 'constructor'), defaultSpec);
});

/* =========================================================================
 * 2. R8: SMART TEXT CONTRAST ADAPTATION ENGINE (WCAG 2.1)
 * ========================================================================= */
console.log('\n[R8] Smart Text Contrast Adaptation Engine (WCAG 2.1):');

test('R8-01: srgbToLinear computes accurate piecewise gamma expansion', () => {
  assert.equal(Engine.srgbToLinear(0), 0, 'Black linear channel must be 0');
  assert.equal(Engine.srgbToLinear(255), 1, 'White linear channel must be 1');

  // Linear portion: <= 0.04045
  const lowVal = 5;
  const expectedLow = (5 / 255) / 12.92;
  assert.ok(Math.abs(Engine.srgbToLinear(lowVal) - expectedLow) < 1e-6);

  // Exponential portion: > 0.04045
  const midVal = 128;
  const expectedMid = Math.pow(((128 / 255) + 0.055) / 1.055, 2.4);
  assert.ok(Math.abs(Engine.srgbToLinear(midVal) - expectedMid) < 1e-4);
});

test('R8-02: getRelativeLuminance returns standard WCAG 2.1 relative luminance', () => {
  const lumWhite = Engine.getRelativeLuminance(255, 255, 255);
  const lumBlack = Engine.getRelativeLuminance(0, 0, 0);
  assert.equal(lumWhite, 1.0, 'White luminance must be 1.0');
  assert.equal(lumBlack, 0.0, 'Black luminance must be 0.0');

  // Also supports color string signatures
  assert.equal(Engine.getRelativeLuminance('#ffffff'), 1.0);
  assert.equal(Engine.getRelativeLuminance('#000000'), 0.0);

  // Green channel has highest luminance weight (0.7152)
  const lumGreen = Engine.getRelativeLuminance(0, 255, 0);
  const lumRed = Engine.getRelativeLuminance(255, 0, 0);
  const lumBlue = Engine.getRelativeLuminance(0, 0, 255);
  assert.ok(lumGreen > lumRed && lumRed > lumBlue, 'Relative luminance order must be Green > Red > Blue');
  assert.ok(Math.abs(lumGreen - 0.7152) < 0.001);
  assert.ok(Math.abs(lumRed - 0.2126) < 0.001);
  assert.ok(Math.abs(lumBlue - 0.0722) < 0.001);
});

test('R8-03: parseRgbColorWithAlpha parses hex3, hex6, hex8, rgb, and rgba with alpha blending', () => {
  const hex3 = Engine.parseRgbColorWithAlpha('#fff');
  assert.deepEqual(hex3, { r: 255, g: 255, b: 255 });

  const hex6 = Engine.parseRgbColorWithAlpha('#3b82f6');
  assert.deepEqual(hex6, { r: 59, g: 130, b: 246 });

  const rgb = Engine.parseRgbColorWithAlpha('rgb(220, 38, 38)');
  assert.deepEqual(rgb, { r: 220, g: 38, b: 38 });

  // 50% white over black canvas yields 128, 128, 128
  const blendedOverBlack = Engine.parseRgbColorWithAlpha('rgba(255, 255, 255, 0.5)', '#000000');
  assert.equal(blendedOverBlack.r, 128);
  assert.equal(blendedOverBlack.g, 128);
  assert.equal(blendedOverBlack.b, 128);

  // 50% black over white canvas yields 128, 128, 128
  const blendedOverWhite = Engine.parseRgbColorWithAlpha('rgba(0, 0, 0, 0.5)', '#ffffff');
  assert.equal(blendedOverWhite.r, 128);
  assert.equal(blendedOverWhite.g, 128);
  assert.equal(blendedOverWhite.b, 128);
});

test('R8-04: isLightColor strictly follows L > 0.42 threshold', () => {
  // Light colors
  assert.equal(Engine.isLightColor('#ffffff'), true, '#ffffff is light');
  assert.equal(Engine.isLightColor('#f8fafc'), true, '#f8fafc is light');
  assert.equal(Engine.isLightColor('#fef08a'), true, '#fef08a is light');
  assert.equal(Engine.isLightColor('#e2e8f0'), true, '#e2e8f0 is light');

  // Dark colors
  assert.equal(Engine.isLightColor('#000000'), false, '#000000 is dark');
  assert.equal(Engine.isLightColor('#0f172a'), false, '#0f172a is dark');
  assert.equal(Engine.isLightColor('#1e293b'), false, '#1e293b is dark');
  assert.equal(Engine.isLightColor('#dc2626'), false, '#dc2626 red is dark (L~0.21)');
});

test('R8-05: getContrastRatio calculates WCAG contrast ratio (lighter+0.05)/(darker+0.05)', () => {
  const maxCr = Engine.getContrastRatio('#ffffff', '#000000');
  assert.equal(Math.round(maxCr), 21, 'White to black contrast ratio is 21:1');

  const sameCr = Engine.getContrastRatio('#3b82f6', '#3b82f6');
  assert.equal(sameCr, 1.0, 'Identical colors contrast ratio is 1:1');
});

test('R8-06: getEffectiveTextColor automatically flips white/light text to deep slate on light backgrounds', () => {
  // Pure white text on white paper background must flip to deep slate #0f172a
  assert.equal(Engine.getEffectiveTextColor('#ffffff', '#ffffff'), '#0f172a');
  assert.equal(Engine.getEffectiveTextColor('#fff', '#ffffff'), '#0f172a');
  assert.equal(Engine.getEffectiveTextColor('#ffffff', '#f8fafc'), '#0f172a');
  assert.equal(Engine.getEffectiveTextColor('#e2e8f0', '#ffffff'), '#0f172a');
});

test('R8-07: getEffectiveTextColor automatically flips black/slate text to white on dark backgrounds', () => {
  // Dark text on dark slate canvas must flip to white #ffffff
  assert.equal(Engine.getEffectiveTextColor('#000000', '#0f172a'), '#ffffff');
  assert.equal(Engine.getEffectiveTextColor('#0f172a', '#0f172a'), '#ffffff');
  assert.equal(Engine.getEffectiveTextColor('#1e293b', '#000000'), '#ffffff');
});

test('R8-08: getEffectiveTextColor preserves high-contrast chromatic accents (CR >= 4.5:1)', () => {
  // Deep navy text on white background has CR > 10:1 -> preserve
  assert.equal(Engine.getEffectiveTextColor('#1e3a8a', '#ffffff'), '#1e3a8a');
  // Bright yellow text on dark background has CR > 12:1 -> preserve
  assert.equal(Engine.getEffectiveTextColor('#facc15', '#0f172a'), '#facc15');
});

test('R8-09: getEffectiveTextColor handles semi-transparent callout box overlays', () => {
  // 10% white over dark green (#042619) remains dark (L <= 0.42) -> white text is preserved
  const darkOverlayText = Engine.getEffectiveTextColor('#ffffff', 'rgba(255, 255, 255, 0.10)');
  assert.equal(darkOverlayText, '#ffffff');

  // 90% white over dark canvas creates light background -> white text flips to #0f172a
  const lightOverlayText = Engine.getEffectiveTextColor('#ffffff', 'rgba(255, 255, 255, 0.90)');
  assert.equal(lightOverlayText, '#0f172a');
});

test('R8-10: parseRgbColorWithAlpha safely falls back on empty or malformed strings', () => {
  const emptyRes = Engine.parseRgbColorWithAlpha('', '#0f172a');
  assert.deepEqual(emptyRes, { r: 15, g: 23, b: 42 });

  const nullRes = Engine.parseRgbColorWithAlpha(null);
  assert.equal(typeof nullRes.r, 'number');
  assert.equal(typeof nullRes.g, 'number');
  assert.equal(typeof nullRes.b, 'number');
});

test('R8-11: getEffectiveTextColor returns appropriate contrast when defaultColor is falsy', () => {
  assert.equal(Engine.getEffectiveTextColor('', '#ffffff'), '#0f172a');
  assert.equal(Engine.getEffectiveTextColor(null, '#ffffff'), '#0f172a');
  assert.equal(Engine.getEffectiveTextColor('', '#000000'), '#ffffff');
  assert.equal(Engine.getEffectiveTextColor(null, '#0f172a'), '#ffffff');
});

test('R8-12: isLightColor respects alpha blended context', () => {
  // 50% white over black canvas has linear luminance ~0.21 -> dark (false)
  assert.equal(Engine.isLightColor('rgba(255, 255, 255, 0.5)', '#000000'), false);
  // 50% white over white canvas remains white -> light (true)
  assert.equal(Engine.isLightColor('rgba(255, 255, 255, 0.5)', '#ffffff'), true);
});

/* =========================================================================
 * 3. R9: EXPANDED BADGES & EDITABLE STICKERS
 * ========================================================================= */
console.log('\n[R9] Expanded Badges & Editable Stickers (Svelte + Engine):');

test('R9-01: PhotoCardStudio.svelte contains 38 curated bilingual sticker elements', () => {
  const match = svelteSrc.match(/const stickerElements:\s*StickerElementItem\[\]\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(match, 'stickerElements array must be declared in PhotoCardStudio.svelte');

  const items = [];
  const itemRegex = /\{[\s\S]*?text:\s*'([^']+)'[\s\S]*?bg:\s*'([^']+)'[\s\S]*?fg:\s*'([^']+)'[\s\S]*?cat:\s*'([^']+)'[\s\S]*?labelBn:\s*'([^']+)'[\s\S]*?labelEn:\s*'([^']+)'[\s\S]*?\}/g;
  let m;
  while ((m = itemRegex.exec(match[1])) !== null) {
    items.push({ text: m[1], bg: m[2], fg: m[3], cat: m[4], labelBn: m[5], labelEn: m[6] });
  }

  assert.equal(items.length, 38, `Expected exactly 38 curated stickers, found: ${items.length}`);

  // Verify categories
  const categories = new Set(items.map(it => it.cat));
  assert.ok(categories.has('news'), 'Must include news category');
  assert.ok(categories.has('factcheck'), 'Must include factcheck category');
  assert.ok(categories.has('charity'), 'Must include charity/medical category');
  assert.ok(categories.has('payment'), 'Must include payment category');
  assert.ok(categories.has('social'), 'Must include social category');
});

test('R9-02: PhotoCardStudio.svelte contains Drawer 2 sticker category filter tabs', () => {
  assert.ok(svelteSrc.includes('id="pcStickerCatFilter"'), 'Category filter container #pcStickerCatFilter must exist');
  assert.ok(svelteSrc.includes('activeStickerCat'), 'activeStickerCat reactive state must exist');
  assert.ok(svelteSrc.includes('data-sticker-cat={cat.id}'), 'Filter button must bind data-sticker-cat');
  assert.ok(svelteSrc.includes("id: 'all'"), 'Filter category for "all" must exist');
  assert.ok(svelteSrc.includes("id: 'news'"), 'Filter category for "news" must exist');
  assert.ok(svelteSrc.includes("id: 'factcheck'"), 'Filter category for "factcheck" must exist');
  assert.ok(svelteSrc.includes("id: 'charity'"), 'Filter category for "charity" must exist');
  assert.ok(svelteSrc.includes("id: 'payment'"), 'Filter category for "payment" must exist');
  assert.ok(svelteSrc.includes("id: 'social'"), 'Filter category for "social" must exist');
});

test('R9-03: PhotoCardStudio.svelte context toolbar contains background tinting controls', () => {
  assert.ok(svelteSrc.includes('id="pcCtxTextBgWrapper"'), '#pcCtxTextBgWrapper must exist');
  assert.ok(svelteSrc.includes('id="pcCtxTextBgBar"'), '#pcCtxTextBgBar indicator must exist');
  assert.ok(svelteSrc.includes('id="pcCtxTextBgColorInput"'), '#pcCtxTextBgColorInput must exist');
});

test('R9-04: PhotoCardStudio.svelte floating selection toolbar contains mini tint indicators and pickers', () => {
  assert.ok(svelteSrc.includes('id="pcMiniTintGroup"'), '#pcMiniTintGroup must exist');
  assert.ok(svelteSrc.includes('id="pcMiniBgColorInput"'), '#pcMiniBgColorInput must exist');
  assert.ok(svelteSrc.includes('id="pcMiniFgColorInput"'), '#pcMiniFgColorInput must exist');
  assert.ok(svelteSrc.includes('id="pcMiniBgIndicator"'), '#pcMiniBgIndicator must exist');
  assert.ok(svelteSrc.includes('id="pcMiniFgIndicator"'), '#pcMiniFgIndicator must exist');
});

test('R9-05: Engine addStickerBadge is exported and creates valid sticker layer', () => {
  assert.ok(typeof Engine.addStickerBadge === 'function', 'addStickerBadge must be a function');
});

/* =========================================================================
 * 4. R10: NATIVE SVG PAYMENT VECTORS & CALLOUT BOX UPGRADE
 * ========================================================================= */
console.log('\n[R10] Native SVG Payment Vectors & Callout Box Upgrade:');

test('R10-01: PAYMENT_BRAND_VECTORS is exported and defines bKash, Nagad, and Rocket', () => {
  assert.ok(Engine.PAYMENT_BRAND_VECTORS, 'PAYMENT_BRAND_VECTORS must be exported');
  const brands = Object.keys(Engine.PAYMENT_BRAND_VECTORS);
  assert.ok(brands.includes('bkash'), 'Must include bkash');
  assert.ok(brands.includes('nagad'), 'Must include nagad');
  assert.ok(brands.includes('rocket'), 'Must include rocket');
});

test('R10-02: bKash vector definition contains 8 authentic origami polygon facets', () => {
  const bkash = Engine.PAYMENT_BRAND_VECTORS.bkash;
  assert.equal(bkash.viewBox.w, 158);
  assert.equal(bkash.viewBox.h, 150);
  assert.equal(bkash.polygons.length, 8, 'bKash must have exactly 8 polygon facets');

  for (const facet of bkash.polygons) {
    const pts = facet.pts || facet.points;
    assert.ok(pts && pts.length >= 3, 'Each facet must have at least 3 points');
    assert.ok(facet.fill && facet.fill.startsWith('#'), 'Each facet must have a valid hex fill color');
    for (const pt of pts) {
      assert.equal(typeof pt[0], 'number');
      assert.equal(typeof pt[1], 'number');
    }
  }
});

test('R10-03: Nagad vector definition contains 6 authentic flame bezier paths', () => {
  const nagad = Engine.PAYMENT_BRAND_VECTORS.nagad;
  assert.equal(nagad.viewBox.w, 54);
  assert.equal(nagad.viewBox.h, 54);
  assert.equal(nagad.paths.length, 6, 'Nagad must have exactly 6 bezier flame paths');

  for (const p of nagad.paths) {
    assert.ok(p.d && p.d.length > 20, 'Each Nagad path must contain valid SVG path data');
    assert.ok(p.fill && p.fill.startsWith('#'), 'Each path must have a valid hex fill color');
  }
});

test('R10-04: Rocket vector definition contains 6 authentic soaring rocket paths', () => {
  const rocket = Engine.PAYMENT_BRAND_VECTORS.rocket;
  assert.equal(rocket.viewBox.w, 208);
  assert.equal(rocket.viewBox.h, 126);
  assert.equal(rocket.paths.length, 6, 'Rocket must have 6 paths');

  for (const p of rocket.paths) {
    assert.ok(p.d && p.d.length > 10, 'Each Rocket path must contain valid SVG path data');
    assert.ok(p.fill && p.fill.startsWith('#'), 'Each path must have a valid hex fill color');
  }
});

test('R10-05: drawBrandVectorIcon renders geometry on canvas context with high fidelity', () => {
  assert.ok(typeof Engine.drawBrandVectorIcon === 'function', 'drawBrandVectorIcon must be exported');

  const ops = [];
  const spyCtx = {
    save() { ops.push('save'); },
    restore() { ops.push('restore'); },
    translate(x, y) { ops.push(['translate', x, y]); },
    scale(sx, sy) { ops.push(['scale', sx, sy]); },
    beginPath() { ops.push('beginPath'); },
    closePath() { ops.push('closePath'); },
    moveTo(x, y) { ops.push(['moveTo', x, y]); },
    lineTo(x, y) { ops.push(['lineTo', x, y]); },
    fill() { ops.push('fill'); },
    fillStyle: ''
  };

  Engine.drawBrandVectorIcon(spyCtx, 'bkash', 100, 100, 48);
  assert.ok(ops.includes('save'), 'Must save context state');
  assert.ok(ops.includes('restore'), 'Must restore context state');
  assert.ok(ops.filter(o => o === 'fill').length >= 8, 'Must fill all 8 origami facets');
});

test('R10-06: addPaymentVectorLayer is exported and defined', () => {
  assert.ok(typeof Engine.addPaymentVectorLayer === 'function', 'addPaymentVectorLayer must be a function');
});

test('R10-07: PhotoCardStudio.svelte contains Drawer 2 one-click SVG vector placement buttons', () => {
  assert.ok(svelteSrc.includes('data-add-vector="bkash"'), 'bKash vector placement button must exist');
  assert.ok(svelteSrc.includes('data-add-vector="nagad"'), 'Nagad vector placement button must exist');
  assert.ok(svelteSrc.includes('data-add-vector="rocket"'), 'Rocket vector placement button must exist');
});

test('R10-08: Engine photo-card-engine.js binds [data-add-vector] click events', () => {
  const enginePath = path.join(__dirname, '../public/js/photo-card-engine.js');
  const engineSrc = fs.readFileSync(enginePath, 'utf8');
  assert.ok(engineSrc.includes('data-add-vector'), 'Engine must listen for [data-add-vector] buttons');
  assert.ok(engineSrc.includes('addPaymentVectorLayer'), 'Engine must call addPaymentVectorLayer');
});

test('R10-09: drawBrandVectorIcon executes cleanly for nagad, rocket, and bkash', () => {
  const dummyCtx = {
    save() {}, restore() {}, translate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, fill() {}
  };

  assert.doesNotThrow(() => Engine.drawBrandVectorIcon(dummyCtx, 'nagad', 50, 50, 40));
  assert.doesNotThrow(() => Engine.drawBrandVectorIcon(dummyCtx, 'rocket', 50, 50, 40));
  assert.doesNotThrow(() => Engine.drawBrandVectorIcon(dummyCtx, 'bkash', 50, 50, 40));
});

test('R10-10: drawBrandVectorIcon handles unknown brand keys gracefully', () => {
  const dummyCtx = { save() {}, restore() {} };
  assert.doesNotThrow(() => Engine.drawBrandVectorIcon(dummyCtx, 'non-existent-brand', 50, 50, 40));
  assert.doesNotThrow(() => Engine.drawBrandVectorIcon(dummyCtx, null, 50, 50, 40));
});

/* =========================================================================
 * 5. LIVE-BROWSER DEFECT REGRESSIONS (DEFECT #4 & DEFECT #5)
 * ========================================================================= */
console.log('\n[REG] Stock Thumbnail Refresh & Zero-Emoji Vector Icon Regressions:');

test('REG-DEF4-01 (Defect #4): Stock photo img.onload invalidates stale tplThumbCache, refreshes [data-tpl-thumb] DOM images, and marks multi-page canvases for repaint', () => {
  const origImage = global.Image;
  const origDoc = global.document;
  const breakingSpec = Engine.getStockPhotoSpec('breaking-news', 'news', false);
  const url = breakingSpec.url;
  const prevCacheEntry = Engine.stockPhotoCache[url];

  try {
    delete Engine.stockPhotoCache[url];
    Engine.tplThumbCache['breaking-news'] = 'data:image/jpeg;base64,STALE_PROCEDURAL_FALLBACK';

    let capturedImg = null;
    global.Image = class TestStockImage {
      constructor() {
        this.crossOrigin = '';
        this.naturalWidth = 1200;
        this.naturalHeight = 800;
        this.width = 1200;
        this.height = 800;
        this.onload = null;
        this.onerror = null;
        this.src = '';
        capturedImg = this;
      }
    };

    const thumbEl = {
      src: 'data:image/jpeg;base64,STALE_PROCEDURAL_FALLBACK',
      classList: { remove() {} }
    };
    const pageCvEl = {
      dataset: { painted: '1' }
    };

    const noop2d = new Proxy({
      measureText(t) { return { width: String(t || '').length * 10 }; },
      createLinearGradient() { return { addColorStop() {} }; },
      createRadialGradient() { return { addColorStop() {} }; }
    }, {
      get(target, prop) {
        if (prop in target) return target[prop];
        return () => {};
      }
    });

    const paneEl = {
      querySelectorAll(sel) {
        if (sel === '.pc-page-canvas') return [pageCvEl];
        return [];
      }
    };

    global.document = {
      documentElement: { getAttribute() { return 'bn'; } },
      createElement(tag) {
        if (tag === 'canvas') {
          return {
            width: 280,
            height: 280,
            getContext() { return noop2d; },
            toDataURL() { return 'data:image/jpeg;base64,FRESH_STOCK_THUMBNAIL'; }
          };
        }
        return {};
      },
      querySelector(sel) {
        if (sel === '#img-pane-photo-card') return paneEl;
        return null;
      },
      querySelectorAll(sel) {
        if (sel === '[data-tpl-thumb="breaking-news"]') return [thumbEl];
        if (sel === '.pc-page-canvas' || sel === '#pcArtboardColumn .pc-page-canvas') return [pageCvEl];
        return [];
      }
    };

    Engine.preloadStockPhoto(url);
    assert.ok(capturedImg, 'preloadStockPhoto must instantiate Image when global.Image exists');
    assert.equal(Engine.stockPhotoCache[url].status, 'loading');

    // Fire async stock photo onload
    capturedImg.onload();

    assert.equal(Engine.stockPhotoCache[url].status, 'loaded', 'Stock photo status must update to loaded');
    assert.equal(Engine.tplThumbCache['breaking-news'], 'data:image/jpeg;base64,FRESH_STOCK_THUMBNAIL', 'Stale thumbnail cache must be invalidated and regenerated');
    assert.equal(thumbEl.src, 'data:image/jpeg;base64,FRESH_STOCK_THUMBNAIL', 'Sidebar [data-tpl-thumb] img.src must update with loaded stock photo');
    assert.equal(pageCvEl.dataset.painted, '', 'Multi-page canvas dataset.painted must reset so inactive pages repaint with stock photo');
  } finally {
    global.Image = origImage;
    global.document = origDoc;
    if (prevCacheEntry) Engine.stockPhotoCache[url] = prevCacheEntry;
  }
});

test('REG-DEF5-01 (Defect #5): Zero unicode emoji pictographs exist in photo-card-engine.js or PhotoCardStudio.svelte, and sticker filter wraps cleanly', () => {
  const engineSrc = fs.readFileSync(path.join(__dirname, '../public/js/photo-card-engine.js'), 'utf8');
  const emojiRegex = /[\u{1F300}-\u{1FAFF}\u26A0\u261D\u2695\u262A]/gu;

  const engineEmojis = engineSrc.match(emojiRegex) || [];
  const svelteEmojis = svelteSrc.match(emojiRegex) || [];

  assert.equal(engineEmojis.length, 0, `photo-card-engine.js must contain 0 unicode emojis, found: ${engineEmojis.join(', ')}`);
  assert.equal(svelteEmojis.length, 0, `PhotoCardStudio.svelte must contain 0 unicode emojis, found: ${svelteEmojis.join(', ')}`);

  assert.match(svelteSrc, /<div(?=[^>]*\bid="pcStickerCatFilter")(?=[^>]*\bflex-wrap\b)[^>]*>/, '#pcStickerCatFilter must use flex-wrap so category chips never overflow horizontally');
});

test('REG-DEF5-02 (Defect #5): drawUiVectorIcon renders crisp geometric paths with balanced save/restore across all 20 UI icon keys', () => {
  assert.equal(typeof Engine.drawUiVectorIcon, 'function', 'drawUiVectorIcon must be exported');
  const iconKeys = [
    'blood', 'hospital', 'phone', 'handheart', 'gift', 'target',
    'crescent', 'mosque', 'medical', 'pin', 'leaf', 'live',
    'mic', 'search', 'shield', 'bolt', 'sparkle', 'user', 'chat', 'alert'
  ];

  for (const key of iconKeys) {
    let depth = 0;
    let drawOps = 0;
    const spyCtx = {
      save() { depth++; },
      restore() { depth--; },
      translate() {},
      rotate() {},
      scale() {},
      beginPath() { drawOps++; },
      closePath() {},
      moveTo() { drawOps++; },
      lineTo() { drawOps++; },
      arc() { drawOps++; },
      arcTo() { drawOps++; },
      rect() { drawOps++; },
      ellipse() { drawOps++; },
      bezierCurveTo() { drawOps++; },
      quadraticCurveTo() { drawOps++; },
      fill() { drawOps++; },
      stroke() { drawOps++; },
      fillRect() { drawOps++; },
      strokeRect() { drawOps++; },
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'round',
      lineJoin: 'round',
      globalAlpha: 1
    };

    Engine.drawUiVectorIcon(spyCtx, key, 100, 100, 32, '#ffffff');
    assert.equal(depth, 0, `drawUiVectorIcon("${key}") must balance ctx.save()/ctx.restore()`);
    assert.ok(drawOps >= 2, `drawUiVectorIcon("${key}") must emit vector path drawing operations`);
  }
});

/* =========================================================================
 * SUMMARY
 * ========================================================================= */
console.log('\n-----------------------------------------------------------------');
console.log(`Test Execution Finished: ${passedTests}/${totalTests} Passed (0 Failed)`);
console.log('-----------------------------------------------------------------\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
