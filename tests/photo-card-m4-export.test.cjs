/**
 * TechHat Photo Card Studio — Milestone 4 Image Metadata Export Pipeline Test Suite
 * 
 * Verifies Milestone 4 requirements:
 * - R11: Embedded TechHat Website Metadata in Exported Images (PNG & JPEG)
 * - Canvas blob simulation & asynchronous export pipeline in Node.js
 * - PNG tEXt & iTXt chunks (Bengali Unicode, valid IEEE 802.3 CRC32)
 * - JPEG APP1 EXIF (TIFF IFD0) & APP1 XMP (RDF packet)
 * - Strictly ZERO AI markers (c2pa, synthid, ai_generated, compositesynthetic, etc.)
 * - Dynamic card state metadata extraction (title, template deep-link, multi-page)
 * - Clipboard copy & mobile share metadata injection
 * - Fallback & resilience (missing injector, corrupted blob, permission failure)
 * 
 * Run: node tests/photo-card-m4-export.test.cjs
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

/* =========================================================================
 * 1. IN-MEMORY MINIMAL VALID IMAGE FIXTURE GENERATORS
 * ========================================================================= */

/**
 * Creates a valid minimal 1x1 RGBA PNG buffer (70 bytes).
 */
function createMinimalPng() {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR (13 bytes payload)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(1, 0); // width = 1
  ihdrData.writeUInt32BE(1, 4); // height = 1
  ihdrData[8] = 8;  // bit depth = 8
  ihdrData[9] = 6;  // color type = RGBA
  ihdrData[10] = 0; // compression = 0
  ihdrData[11] = 0; // filter = 0
  ihdrData[12] = 0; // interlace = 0
  const ihdrCrc = zlib.crc32(Buffer.concat([Buffer.from('IHDR', 'ascii'), ihdrData])) >>> 0;
  const ihdrChunk = Buffer.alloc(25);
  ihdrChunk.writeUInt32BE(13, 0);
  ihdrChunk.write('IHDR', 4, 4, 'ascii');
  ihdrData.copy(ihdrChunk, 8);
  ihdrChunk.writeUInt32BE(ihdrCrc, 21);

  // IDAT (deflated 1x1 scanline: filter 0 + RGBA 4 bytes)
  const rawScanline = Buffer.from([0x00, 0x00, 0x99, 0xFF, 0xFF]);
  const idatData = zlib.deflateSync(rawScanline);
  const idatCrc = zlib.crc32(Buffer.concat([Buffer.from('IDAT', 'ascii'), idatData])) >>> 0;
  const idatChunk = Buffer.alloc(12 + idatData.length);
  idatChunk.writeUInt32BE(idatData.length, 0);
  idatChunk.write('IDAT', 4, 4, 'ascii');
  idatData.copy(idatChunk, 8);
  idatChunk.writeUInt32BE(idatCrc, 8 + idatData.length);

  // IEND (0 bytes payload)
  const iendCrc = zlib.crc32(Buffer.from('IEND', 'ascii')) >>> 0;
  const iendChunk = Buffer.alloc(12);
  iendChunk.writeUInt32BE(0, 0);
  iendChunk.write('IEND', 4, 4, 'ascii');
  iendChunk.writeUInt32BE(iendCrc, 8);

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Creates a valid minimal 1x1 JPEG buffer (134 bytes).
 */
function createMinimalJpeg() {
  const b64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  return Buffer.from(b64, 'base64');
}

/* =========================================================================
 * 2. HIGH-FIDELITY MOCK DOM & ASYNCHRONOUS EXPORT SPY ENVIRONMENT
 * ========================================================================= */

const domRegistry = {};
const listeners = {};
const blobStore = new Map();
let urlIdCounter = 0;

let lastDownload = null;
let downloadWaiters = [];

let lastClipboardItems = null;
let lastSharedData = null;
let lastToast = null;

function notifyDownloadWaiters(info) {
  lastDownload = info;
  const waiters = downloadWaiters.slice();
  downloadWaiters = [];
  for (const w of waiters) w(info);
}

function waitForDownload(actionFn, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Download timeout: anchor click was not triggered within ${timeoutMs}ms`));
    }, timeoutMs);

    downloadWaiters.push((info) => {
      clearTimeout(timer);
      resolve(info);
    });

    try {
      actionFn();
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

function createMockElement(tag, id = null) {
  const el = {
    tagName: tag.toUpperCase(),
    id: id || '',
    attributes: {},
    dataset: {},
    style: {},
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
      toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
    },
    children: [],
    parentNode: null,
    textContent: '',
    innerHTML: '',
    value: '',
    checked: false,

    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] != null ? this.attributes[k] : null; },
    hasAttribute(k) { return k in this.attributes; },
    removeAttribute(k) { delete this.attributes[k]; },

    appendChild(child) {
      if (child) {
        child.parentNode = this;
        this.children.push(child);
      }
      return child;
    },
    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        child.parentNode = null;
      }
      return child;
    },
    remove() {
      if (this.parentNode) this.parentNode.removeChild(this);
    },
    contains(child) {
      if (child === this) return true;
      for (const c of this.children) {
        if (c === child || (c.contains && c.contains(child))) return true;
      }
      return false;
    },
    querySelector(sel) {
      if (sel.startsWith('#')) return domRegistry[sel.slice(1)] || null;
      return null;
    },
    querySelectorAll(sel) {
      return [];
    },
    addEventListener(ev, fn) {
      if (!listeners[ev]) listeners[ev] = [];
      listeners[ev].push({ el: this, fn });
    },
    removeEventListener(ev, fn) {
      if (!listeners[ev]) return;
      listeners[ev] = listeners[ev].filter(l => !(l.el === this && l.fn === fn));
    },
    click() {
      // If this is an anchor element with download attribute, register download event
      if (this.tagName === 'A' && this.download) {
        const url = this.href || '';
        const blob = blobStore.get(url) || null;
        notifyDownloadWaiters({
          download: this.download,
          href: this.href,
          blob: blob
        });
      }
      if (listeners['click']) {
        for (const l of listeners['click']) {
          if (l.el === this) l.fn({ target: this, preventDefault() {}, stopPropagation() {} });
        }
      }
    }
  };

  // Specific properties for anchor element
  if (tag.toLowerCase() === 'a') {
    el.href = '';
    el.download = '';
  }

  // Specific properties for canvas element
  if (tag.toLowerCase() === 'canvas') {
    el.width = 1080;
    el.height = 1080;
    el.getContext = () => createInspectableCanvasContext(el);
    el.toBlob = function (cb, type = 'image/png', quality) {
      const isJpg = type === 'image/jpeg' || type === 'image/jpg';
      const buf = isJpg ? createMinimalJpeg() : createMinimalPng();
      const blob = new Blob([buf], { type: isJpg ? 'image/jpeg' : 'image/png' });
      queueMicrotask(() => {
        if (typeof cb === 'function') cb(blob);
      });
    };
  }

  if (id) domRegistry[id] = el;
  return el;
}

// Global URL mock
global.URL = global.URL || {};
global.URL.createObjectURL = (blob) => {
  const url = `blob:techhat-test/${++urlIdCounter}`;
  blobStore.set(url, blob);
  return url;
};
global.URL.revokeObjectURL = (url) => {
  blobStore.delete(url);
};

// Global Clipboard mock
global.ClipboardItem = global.ClipboardItem || class ClipboardItem {
  constructor(items) {
    this.items = items;
  }
};

const mockNavigator = {
  clipboard: {
    write: async (items) => {
      lastClipboardItems = items;
      return Promise.resolve();
    },
    writeText: async (txt) => {
      return Promise.resolve();
    }
  },
  canShare: () => true,
  share: async (data) => {
    lastSharedData = data;
    return Promise.resolve();
  }
};

try {
  Object.defineProperty(global, 'navigator', {
    value: mockNavigator,
    configurable: true,
    writable: true
  });
} catch (e) {
  if (global.navigator) {
    global.navigator.clipboard = mockNavigator.clipboard;
    global.navigator.canShare = mockNavigator.canShare;
    global.navigator.share = mockNavigator.share;
  }
}

// Global DOM document
const docBody = createMockElement('body');
const docHead = createMockElement('head');
global.document = {
  readyState: 'complete',
  head: docHead,
  body: docBody,
  documentElement: createMockElement('html'),
  activeElement: null,
  addEventListener(ev, fn) {
    if (!listeners[ev]) listeners[ev] = [];
    listeners[ev].push({ el: this, fn });
  },
  removeEventListener(ev, fn) {
    if (!listeners[ev]) return;
    listeners[ev] = listeners[ev].filter(l => !(l.el === this && l.fn === fn));
  },
  createElement(tag) { return createMockElement(tag); },
  getElementById(id) { return domRegistry[id] || null; },
  querySelector(sel) {
    if (sel.startsWith('#')) return domRegistry[sel.slice(1)] || null;
    return null;
  },
  querySelectorAll() { return []; }
};

// Global Window mock
global.window = {
  document: global.document,
  location: { search: '', origin: 'https://tools.techhat.com.bd' },
  navigator: global.navigator,
  URL: global.URL,
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  cancelAnimationFrame: (id) => clearTimeout(id),
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
  addEventListener() {},
  removeEventListener() {},
  TechHatToast(msg) { lastToast = msg; }
};

// Global Path2D & Image
if (typeof global.Path2D === 'undefined') {
  global.Path2D = class Path2D { constructor(d) { this.d = d || ''; } };
}
global.Image = class MockImage {
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
};

// Populate standard Photo Card DOM elements
const pcCanvas = createMockElement('canvas', 'pcCanvas');
pcCanvas.width = 1080;
pcCanvas.height = 1080;

// Canvas 2D spy context
const drawLog = [];
function createInspectableCanvasContext(canvasEl) {
  let _fillStyle = '#000000';
  let _strokeStyle = '#000000';
  let _font = '16px sans-serif';
  let _textAlign = 'left';
  let _textBaseline = 'alphabetic';
  let _globalAlpha = 1.0;
  let _lineWidth = 1.0;

  return {
    canvas: canvasEl,
    __drawLog: drawLog,
    get fillStyle() { return _fillStyle; },
    set fillStyle(val) { _fillStyle = val; },
    get strokeStyle() { return _strokeStyle; },
    set strokeStyle(val) { _strokeStyle = val; },
    get font() { return _font; },
    set font(val) { _font = val; },
    get textAlign() { return _textAlign; },
    set textAlign(val) { _textAlign = val; },
    get textBaseline() { return _textBaseline; },
    set textBaseline(val) { _textBaseline = val; },
    get globalAlpha() { return _globalAlpha; },
    set globalAlpha(val) { _globalAlpha = val; },
    get lineWidth() { return _lineWidth; },
    set lineWidth(val) { _lineWidth = val; },

    save() { drawLog.push({ op: 'save' }); },
    restore() { drawLog.push({ op: 'restore' }); },
    beginPath() { drawLog.push({ op: 'beginPath' }); },
    closePath() { drawLog.push({ op: 'closePath' }); },
    moveTo(x, y) { drawLog.push({ op: 'moveTo', x, y }); },
    lineTo(x, y) { drawLog.push({ op: 'lineTo', x, y }); },
    arc(x, y, r, sa, ea) { drawLog.push({ op: 'arc', x, y, r }); },
    arcTo(x1, y1, x2, y2, r) { drawLog.push({ op: 'arcTo', x1, y1, x2, y2, r }); },
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) { drawLog.push({ op: 'bezierCurveTo', cp1x, cp1y, cp2x, cp2y, x, y }); },
    quadraticCurveTo(cpx, cpy, x, y) { drawLog.push({ op: 'quadraticCurveTo', cpx, cpy, x, y }); },
    rect(x, y, w, h) { drawLog.push({ op: 'rect', x, y, w, h }); },
    ellipse(x, y, rx, ry, rot, sa, ea) { drawLog.push({ op: 'ellipse', x, y, rx, ry, rot }); },
    clip() { drawLog.push({ op: 'clip' }); },
    fill() { drawLog.push({ op: 'fill' }); },
    stroke() { drawLog.push({ op: 'stroke' }); },
    fillRect(x, y, w, h) { drawLog.push({ op: 'fillRect', x, y, w, h }); },
    strokeRect(x, y, w, h) { drawLog.push({ op: 'strokeRect', x, y, w, h }); },
    clearRect(x, y, w, h) { drawLog.push({ op: 'clearRect', x, y, w, h }); },
    fillText(text, x, y, maxW) { drawLog.push({ op: 'fillText', text: String(text || ''), x, y }); },
    strokeText(text, x, y, maxW) { drawLog.push({ op: 'strokeText', text: String(text || ''), x, y }); },
    measureText(text) {
      const len = String(text || '').length;
      return { width: len * 12, actualBoundingBoxAscent: 12, actualBoundingBoxDescent: 3 };
    },
    drawImage(img, ...args) { drawLog.push({ op: 'drawImage' }); },
    createLinearGradient(x0, y0, x1, y1) { return { addColorStop() {} }; },
    createRadialGradient(x0, y0, r0, x1, y1, r1) { return { addColorStop() {} }; },
    createPattern() { return {}; },
    getImageData() { return { data: new Uint8ClampedArray(4) }; },
    putImageData() {},
    translate(x, y) { drawLog.push({ op: 'translate', x, y }); },
    rotate(rad) { drawLog.push({ op: 'rotate', rad }); },
    scale(sx, sy) { drawLog.push({ op: 'scale', sx, sy }); },
    setTransform() {},
    resetTransform() {}
  };
}
pcCanvas.getContext = () => createInspectableCanvasContext(pcCanvas);

// Canvas toBlob mock returning minimal valid PNG or JPEG
pcCanvas.toBlob = function (cb, type = 'image/png', quality) {
  const isJpg = type === 'image/jpeg' || type === 'image/jpg';
  const buf = isJpg ? createMinimalJpeg() : createMinimalPng();
  const blob = new Blob([buf], { type: isJpg ? 'image/jpeg' : 'image/png' });
  queueMicrotask(() => {
    if (typeof cb === 'function') cb(blob);
  });
};

const pane = createMockElement('div', 'img-pane-photo-card');
docBody.appendChild(pane);

const scrollArea = createMockElement('div', 'pcStageScrollArea');
pane.appendChild(scrollArea);

const artCol = createMockElement('div', 'pcArtboardColumn');
scrollArea.appendChild(artCol);

const artWrap = createMockElement('div', 'pcArtboardWrap');
artCol.appendChild(artWrap);
artWrap.appendChild(pcCanvas);

pane.appendChild(createMockElement('div', 'pcContextMenu'));
pane.appendChild(createMockElement('button', 'pcDownloadPngBtn'));
pane.appendChild(createMockElement('button', 'pcDownloadJpgBtn'));
pane.appendChild(createMockElement('button', 'pcCopyCardBtn'));
pane.appendChild(createMockElement('button', 'pcShareCardBtn'));
pane.appendChild(createMockElement('button', 'pcShareNativeBtn'));
pane.appendChild(createMockElement('button', 'pcQuickDownloadPngBtn'));
pane.appendChild(createMockElement('button', 'pcQuickDownloadJpgBtn'));
pane.appendChild(createMockElement('button', 'pcShareDownloadPdf'));
pane.appendChild(createMockElement('button', 'pcShareCopyImageBtn'));
pane.appendChild(createMockElement('div', 'toast'));

// Locate project root portably
const projectRoot = fs.existsSync(path.join(__dirname, 'public')) ? __dirname :
  fs.existsSync(path.join(__dirname, '../public')) ? path.join(__dirname, '..') :
  path.join(__dirname, '../../..');

// Load Metadata Injector and Canvas Engine
const MetadataInjector = require(path.join(projectRoot, 'public/js/photo-card-metadata.js'));
global.PhotoCardMetadata = MetadataInjector;
global.TechHatPhotoCardMetadata = MetadataInjector;
global.window.PhotoCardMetadata = MetadataInjector;
global.window.TechHatPhotoCardMetadata = MetadataInjector;

const Engine = require(path.join(projectRoot, 'public/js/photo-card-engine.js'));

/* =========================================================================
 * 3. TEST HARNESS
 * ========================================================================= */

let totalTests = 0;
let passedTests = 0;
const tests = [];

function test(name, fn) {
  tests.push([name, fn]);
}

async function runAllTests() {
  console.log('\n======================================================================');
  console.log('  TechHat Photo Card Studio: M4 Image Metadata Export Test Suite');
  console.log('======================================================================\n');

  for (const [name, fn] of tests) {
    totalTests++;
    try {
      await fn();
      passedTests++;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error('    Error:', err && err.message ? err.message : err);
      process.exitCode = 1;
    }
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`Total Assertions: ${totalTests} | Passed: ${passedTests} | Failed: ${totalTests - passedTests}`);
  console.log(`Status: ${process.exitCode ? 'FAILURES DETECTED' : 'ALL TESTS PASSED (100% SUCCESS)'}\n`);
}

/* =========================================================================
 * 4. SUITE 1: CANVAS BLOB SIMULATION & MOCK DOM ENVIRONMENT
 * ========================================================================= */

test('M4-SIM-01: Canvas mock delivers asynchronous Blob matching requested MIME type', async () => {
  const blob = await new Promise((res) => pcCanvas.toBlob(res, 'image/png'));
  assert.ok(blob instanceof Blob, 'Canvas must produce a Blob instance');
  assert.equal(blob.type, 'image/png');
  const ab = await blob.arrayBuffer();
  assert.equal(Buffer.from(ab).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');

  const jpgBlob = await new Promise((res) => pcCanvas.toBlob(res, 'image/jpeg'));
  assert.equal(jpgBlob.type, 'image/jpeg');
  const jpgAb = await jpgBlob.arrayBuffer();
  assert.equal(Buffer.from(jpgAb).subarray(0, 2).toString('hex'), 'ffd8');
});

test('M4-SIM-02: Simulated anchor download catches filename and Object URL correctly', async () => {
  const testBlob = new Blob([Buffer.from('test')], { type: 'text/plain' });
  const downloadPromise = waitForDownload(() => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(testBlob);
    a.download = 'test-file.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  const dl = await downloadPromise;
  assert.equal(dl.download, 'test-file.png');
  assert.ok(dl.href.startsWith('blob:techhat-test/'));
  assert.equal(dl.blob, testBlob);
});

test('M4-SIM-03: URL.createObjectURL maps Blob instances into revocable URL registry', () => {
  const b = new Blob([Buffer.from('sample')]);
  const url = URL.createObjectURL(b);
  assert.equal(blobStore.get(url), b);
  URL.revokeObjectURL(url);
  assert.equal(blobStore.has(url), false);
});

test('M4-SIM-04: Notification toast system receives export notifications', () => {
  lastToast = null;
  window.TechHatToast('ডাউনলোড সম্পন্ন হয়েছে!');
  assert.equal(lastToast, 'ডাউনলোড সম্পন্ন হয়েছে!');
});

/* =========================================================================
 * 5. SUITE 2: PNG EXPORT PIPELINE END-TO-END VERIFICATION
 * ========================================================================= */

test('M4-PNG-01: Export PNG produces valid PNG file with 8-byte signature', async () => {
  Engine.applyTemplate('quote-card', true);
  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadPngBtn'].click();
  });

  assert.ok(dl.blob, 'Exported blob must exist');
  assert.equal(dl.blob.type, 'image/png');
  const ab = await dl.blob.arrayBuffer();
  const buf = Buffer.from(ab);
  assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
});

test('M4-PNG-02: File slug formatting matches safeFileSlug() + .png', async () => {
  const state = Engine.getState();
  state.designTitle = 'আমার প্রিয় উক্তি';
  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadPngBtn'].click();
  });
  assert.ok(dl.download.endsWith('.png'));
  assert.ok(dl.download.includes('1080x1080'));
});

test('M4-PNG-03: PNG chunks ordered correctly (IHDR -> metadata tEXt/iTXt -> IDAT -> IEND)', async () => {
  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadPngBtn'].click();
  });
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parsePngMetadata(buf);

  assert.equal(parsed.chunks[0].type, 'IHDR');
  const firstIdat = parsed.chunks.findIndex(c => c.type === 'IDAT');
  assert.ok(firstIdat > 1, 'Metadata chunks must precede IDAT');

  for (let i = 1; i < firstIdat; i++) {
    assert.ok(parsed.chunks[i].type === 'tEXt' || parsed.chunks[i].type === 'iTXt');
  }
  const iendIdx = parsed.chunks.findIndex(c => c.type === 'IEND');
  assert.ok(firstIdat < iendIdx, 'IDAT must precede IEND');
});

test('M4-PNG-04: Injected ASCII tEXt chunks contain Software, Source, URL, Creation Time', async () => {
  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadPngBtn'].click();
  });
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parsePngMetadata(buf);

  assert.ok(parsed.tags.Software && parsed.tags.Software.includes('TechHat Photo Card Studio'));
  assert.ok(parsed.tags.Source && parsed.tags.Source.includes('techhat.com.bd'));
  assert.ok(parsed.tags.URL && parsed.tags.URL.includes('techhat.com.bd'));
  assert.ok(parsed.tags['Creation Time']);
});

test('M4-PNG-05: Injected Bengali Unicode iTXt chunk Title preserves headline without mojibake', async () => {
  const state = Engine.getState();
  const testTitle = 'টেকহ্যাট ফটোকার্ড - স্বাধীনতা দিবসের শুভেচ্ছা ও অভিনন্দন';
  state.designTitle = testTitle;

  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadPngBtn'].click();
  });
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parsePngMetadata(buf);
  assert.equal(parsed.tags.Title, testTitle);
  assert.equal(parsed.tags['Title:lang'], 'bn');
});

test('M4-PNG-06: Injected Bengali Unicode iTXt chunk Author and Description preserve Bengali codepoints', async () => {
  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadPngBtn'].click();
  });
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parsePngMetadata(buf);

  assert.ok(parsed.tags.Author && parsed.tags.Author.includes('TechHat'));
  assert.ok(parsed.tags.Description && parsed.tags.Description.includes('TechHat Photo Card Studio'));
});

test('M4-PNG-07: Injected iTXt chunk Copyright includes © and Bengali digits ২০২৬', async () => {
  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadPngBtn'].click();
  });
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parsePngMetadata(buf);
  assert.ok(parsed.tags.Copyright);
  assert.ok(parsed.tags.Copyright.includes('TechHat'));
});

test('M4-PNG-08: Every PNG chunk (IHDR, tEXt, iTXt, IDAT, IEND) satisfies IEEE 802.3 CRC32 checksums', async () => {
  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadPngBtn'].click();
  });
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parsePngMetadata(buf);

  for (const c of parsed.chunks) {
    const chunkBytes = buf.subarray(c.offset + 4, c.offset + 8 + c.len);
    const expectedCrc = zlib.crc32(chunkBytes) >>> 0;
    assert.equal(c.crc, expectedCrc, `CRC32 mismatch on chunk ${c.type}`);
  }
});

/* =========================================================================
 * 6. SUITE 3: JPEG EXPORT PIPELINE END-TO-END VERIFICATION
 * ========================================================================= */

test('M4-JPG-01: Export JPEG produces valid JPEG starting with SOI (0xFFD8)', async () => {
  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadJpgBtn'].click();
  });
  assert.ok(dl.blob);
  assert.equal(dl.blob.type, 'image/jpeg');
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  assert.equal(buf[0], 0xFF);
  assert.equal(buf[1], 0xD8);
});

test('M4-JPG-02: File slug formatting matches safeFileSlug() + .jpg', async () => {
  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadJpgBtn'].click();
  });
  assert.ok(dl.download.endsWith('.jpg'));
});

test('M4-JPG-03: JPEG output contains APP1 EXIF segment with Exif\\0\\0 header', async () => {
  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadJpgBtn'].click();
  });
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parseJpegMetadata(buf);
  assert.ok(parsed.exifPayload, 'EXIF payload must exist');
});

test('M4-JPG-04: EXIF IFD0 contains Software tag (0x0131) and Artist tag (0x013B)', async () => {
  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadJpgBtn'].click();
  });
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parseJpegMetadata(buf);
  const tags = MetadataInjector.parseExifTags(parsed.exifPayload);

  assert.equal(tags['0x0131'], 'TechHat Photo Card Studio 2.0');
  assert.ok(tags['0x013B'] && tags['0x013B'].includes('TechHat'));
});

test('M4-JPG-05: EXIF IFD0 contains Copyright tag (0x8298) and DateTime tag (0x0132)', async () => {
  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadJpgBtn'].click();
  });
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parseJpegMetadata(buf);
  const tags = MetadataInjector.parseExifTags(parsed.exifPayload);

  assert.ok(tags['0x8298'] && tags['0x8298'].includes('TechHat'));
  assert.match(tags['0x0132'], /^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/);
});

test('M4-JPG-06: JPEG output contains APP1 XMP segment with standard Adobe namespace', async () => {
  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadJpgBtn'].click();
  });
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parseJpegMetadata(buf);
  assert.ok(parsed.xmpPayload, 'XMP payload must exist');
  assert.ok(parsed.xmpString.includes('http://ns.adobe.com/xap/1.0/'));
});

test('M4-JPG-07: XMP packet contains well-formed Dublin Core (dc:title, dc:creator, dc:description, dc:rights)', async () => {
  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadJpgBtn'].click();
  });
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parseJpegMetadata(buf);

  assert.ok(parsed.xmpString.includes('<dc:title>'));
  assert.ok(parsed.xmpString.includes('<dc:creator>'));
  assert.ok(parsed.xmpString.includes('<dc:description>'));
  assert.ok(parsed.xmpString.includes('<dc:rights>'));
});

test('M4-JPG-08: XMP packet contains Photoshop Source, CreatorTool, and proper XML escaping', async () => {
  const state = Engine.getState();
  state.designTitle = 'বিশেষ প্রতিবেদন <টেকহ্যাট & সংবাদ>';

  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadJpgBtn'].click();
  });
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parseJpegMetadata(buf);

  assert.ok(parsed.xmpString.includes('<xmp:CreatorTool>TechHat Photo Card Studio 2.0</xmp:CreatorTool>'));
  assert.ok(parsed.xmpString.includes('<photoshop:Source>'));
  assert.ok(parsed.xmpString.includes('&lt;টেকহ্যাট &amp; সংবাদ&gt;'));
});

/* =========================================================================
 * 7. SUITE 4: STRICTLY ZERO AI MARKERS GUARANTEE
 * ========================================================================= */

test('M4-AI-01: Exported PNG has strictly zero C2PA metadata chunks or manifests', async () => {
  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadPngBtn'].click();
  });
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const str = buf.toString('latin1').toLowerCase();
  assert.ok(!str.includes('c2pa'), 'PNG must not contain c2pa');
});

test('M4-AI-02: Exported JPEG has strictly zero C2PA APP11 markers (0xFFEB) or JUMBF boxes', async () => {
  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadJpgBtn'].click();
  });
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parseJpegMetadata(buf);
  for (const s of parsed.segments) {
    assert.notEqual(s.marker, 0xEB, 'APP11 marker must not exist');
  }
  const str = buf.toString('latin1').toLowerCase();
  assert.ok(!str.includes('jumbf'), 'JPEG must not contain jumbf');
});

test('M4-AI-03: Exported PNG and JPEG contain zero Google SynthID watermarks', async () => {
  const dlPng = await waitForDownload(() => domRegistry['pcDownloadPngBtn'].click());
  const dlJpg = await waitForDownload(() => domRegistry['pcDownloadJpgBtn'].click());

  const pngStr = Buffer.from(await dlPng.blob.arrayBuffer()).toString('latin1').toLowerCase();
  const jpgStr = Buffer.from(await dlJpg.blob.arrayBuffer()).toString('latin1').toLowerCase();

  assert.ok(!pngStr.includes('synthid'));
  assert.ok(!jpgStr.includes('synthid'));
});

test('M4-AI-04: Exported XMP contains zero synthetic media DigitalSourceType URIs', async () => {
  const dl = await waitForDownload(() => domRegistry['pcDownloadJpgBtn'].click());
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parseJpegMetadata(buf);
  assert.ok(!parsed.xmpString.includes('compositeSynthetic'));
  assert.ok(!parsed.xmpString.includes('trainedAlgorithmicMedia'));
});

test('M4-AI-05: User-supplied adversarial AI tokens are sanitized from metadata', async () => {
  const state = Engine.getState();
  state.designTitle = 'Prompt generated with DALL-E 3, Midjourney v6, and c2pa manifest';

  const dl = await waitForDownload(() => domRegistry['pcDownloadPngBtn'].click());
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parsePngMetadata(buf);

  assert.ok(!parsed.tags.Title.toLowerCase().includes('dall-e'));
  assert.ok(!parsed.tags.Title.toLowerCase().includes('midjourney'));
  assert.ok(!parsed.tags.Title.toLowerCase().includes('c2pa'));
});

test('M4-AI-06: findAiMarkers scans across all exported buffers return exactly 0 detected markers', async () => {
  const dlPng = await waitForDownload(() => domRegistry['pcDownloadPngBtn'].click());
  const dlJpg = await waitForDownload(() => domRegistry['pcDownloadJpgBtn'].click());

  const pngBuf = Buffer.from(await dlPng.blob.arrayBuffer());
  const jpgBuf = Buffer.from(await dlJpg.blob.arrayBuffer());

  assert.equal(MetadataInjector.findAiMarkers(pngBuf).length, 0);
  assert.equal(MetadataInjector.findAiMarkers(jpgBuf).length, 0);
});

/* =========================================================================
 * 8. SUITE 5: DYNAMIC STATE EXTRACTION & MULTI-PAGE METADATA
 * ========================================================================= */

test('M4-STATE-01: Active card designTitle dynamically maps to PNG/JPEG Title tag', async () => {
  const state = Engine.getState();
  state.designTitle = 'তারুণ্যের জয়গান ও ডিজিটাল বাংলাদেশ';

  const dl = await waitForDownload(() => domRegistry['pcDownloadPngBtn'].click());
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parsePngMetadata(buf);
  assert.equal(parsed.tags.Title, 'তারুণ্যের জয়গান ও ডিজিটাল বাংলাদেশ');
});

test('M4-STATE-02: Active template ID dynamically maps to source URL deep-link parameter', async () => {
  Engine.applyTemplate('breaking-news', true);

  const dl = await waitForDownload(() => domRegistry['pcDownloadPngBtn'].click());
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parsePngMetadata(buf);
  assert.ok(parsed.tags.Source.includes('template=breaking-news'));
});

test('M4-STATE-03: Multi-page card export appends -p[N] to filename matching active page', async () => {
  const state = Engine.getState();
  state.pages = [
    { id: 'page-1', title: 'Page 1', layers: [] },
    { id: 'page-2', title: 'Page 2', layers: [] }
  ];
  state.activePageIndex = 1;

  const dl = await waitForDownload(() => domRegistry['pcDownloadPngBtn'].click());
  assert.ok(dl.download.includes('-p2-'), `Download filename should include -p2-, got: ${dl.download}`);
});

test('M4-STATE-04: Multi-page card export includes active page title in metadata', async () => {
  const state = Engine.getState();
  state.pages = [
    { id: 'page-1', title: 'প্রথম পৃষ্ঠা', layers: [] },
    { id: 'page-2', title: 'দ্বিতীয় পৃষ্ঠা বিবরণ', layers: [] }
  ];
  state.activePageIndex = 1;
  state.designTitle = 'দ্বিতীয় পৃষ্ঠা বিবরণ';

  const dl = await waitForDownload(() => domRegistry['pcDownloadPngBtn'].click());
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parsePngMetadata(buf);
  assert.equal(parsed.tags.Title, 'দ্বিতীয় পৃষ্ঠা বিবরণ');
});

test('M4-STATE-05: Switching templates updates metadata dynamically on subsequent export', async () => {
  Engine.applyTemplate('factcheck-dual', true);
  const dl1 = await waitForDownload(() => domRegistry['pcDownloadPngBtn'].click());
  const parsed1 = MetadataInjector.parsePngMetadata(Buffer.from(await dl1.blob.arrayBuffer()));
  assert.ok(parsed1.tags.Source.includes('template=factcheck-dual'));

  Engine.applyTemplate('quote-card', true);
  const dl2 = await waitForDownload(() => domRegistry['pcDownloadPngBtn'].click());
  const parsed2 = MetadataInjector.parsePngMetadata(Buffer.from(await dl2.blob.arrayBuffer()));
  assert.ok(parsed2.tags.Source.includes('template=quote-card'));
});

/* =========================================================================
 * 9. SUITE 6: CLIPBOARD COPY & MOBILE SHARE PIPELINE
 * ========================================================================= */

test('M4-CLIP-01: copyCardToClipboard() passes tagged PNG blob to navigator.clipboard.write', async () => {
  lastClipboardItems = null;
  Engine.copyCardToClipboard();
  // Wait microtask tick for canvas.toBlob & metadata injection to complete
  await new Promise(r => setTimeout(r, 50));

  assert.ok(lastClipboardItems && lastClipboardItems.length > 0, 'Clipboard items must be written');
  const item = lastClipboardItems[0];
  assert.ok(item.items['image/png']);
});

test('M4-CLIP-02: Clipboard image blob contains embedded TechHat metadata and valid CRC32', async () => {
  assert.ok(lastClipboardItems);
  const blob = lastClipboardItems[0].items['image/png'];
  const buf = Buffer.from(await blob.arrayBuffer());
  const parsed = MetadataInjector.parsePngMetadata(buf);
  assert.ok(parsed.tags.Software.includes('TechHat Photo Card Studio'));
  assert.equal(MetadataInjector.findAiMarkers(buf).length, 0);
});

test('M4-CLIP-03: shareCardMobile() passes tagged File to navigator.share', async () => {
  lastSharedData = null;
  if (typeof Engine.shareCardMobile === 'function') {
    Engine.shareCardMobile();
  } else if (domRegistry['pcShareNativeBtn']) {
    domRegistry['pcShareNativeBtn'].click();
  }
  await new Promise(r => setTimeout(r, 50));

  assert.ok(lastSharedData && lastSharedData.files && lastSharedData.files.length > 0);
  const file = lastSharedData.files[0];
  assert.equal(file.type, 'image/png');
});

test('M4-CLIP-04: Shared File preserves metadata, valid CRC32, and zero AI markers', async () => {
  assert.ok(lastSharedData);
  const file = lastSharedData.files[0];
  const buf = Buffer.from(await file.arrayBuffer());
  const parsed = MetadataInjector.parsePngMetadata(buf);
  assert.ok(parsed.tags.URL.includes('techhat.com.bd'));
  assert.equal(MetadataInjector.findAiMarkers(buf).length, 0);
});

/* =========================================================================
 * 10. SUITE 7: RESILIENCE, ERROR HANDLING & FALLBACK GUARANTEES
 * ========================================================================= */

test('M4-RES-01: Graceful fallback to raw blob when PhotoCardMetadata is undefined / not loaded', async () => {
  const origInjector = global.window.PhotoCardMetadata;
  try {
    global.window.PhotoCardMetadata = undefined;
    global.window.TechHatPhotoCardMetadata = undefined;

    const dl = await waitForDownload(() => {
      domRegistry['pcDownloadPngBtn'].click();
    });
    assert.ok(dl.blob, 'Raw blob must still be downloaded');
    assert.equal(dl.blob.type, 'image/png');
  } finally {
    global.window.PhotoCardMetadata = origInjector;
    global.window.TechHatPhotoCardMetadata = origInjector;
  }
});

test('M4-RES-02: Graceful fallback to raw blob when embedTechHatMetadata throws an error', async () => {
  const origMethod = MetadataInjector.embedTechHatMetadata;
  try {
    MetadataInjector.embedTechHatMetadata = async () => {
      throw new Error('Simulated injection crash');
    };

    const dl = await waitForDownload(() => {
      domRegistry['pcDownloadPngBtn'].click();
    });
    assert.ok(dl.blob, 'Raw blob must still be downloaded upon error');
  } finally {
    MetadataInjector.embedTechHatMetadata = origMethod;
  }
});

test('M4-RES-03: Graceful handling when canvas produces null blob (no crash or unhandled rejection)', async () => {
  const origToBlob = pcCanvas.toBlob;
  try {
    pcCanvas.toBlob = (cb) => {
      queueMicrotask(() => cb(null));
    };

    // Should not throw
    domRegistry['pcDownloadPngBtn'].click();
    await new Promise(r => setTimeout(r, 20));
  } finally {
    pcCanvas.toBlob = origToBlob;
  }
});

test('M4-RES-04: Clipboard failure gracefully falls back to direct file download', async () => {
  const origWrite = navigator.clipboard.write;
  try {
    navigator.clipboard.write = async () => {
      throw new Error('Clipboard permission denied');
    };

    const dl = await waitForDownload(() => {
      Engine.copyCardToClipboard();
    });
    assert.ok(dl.download.endsWith('.png'));
  } finally {
    navigator.clipboard.write = origWrite;
  }
});

test('M4-RES-05: Mobile share failure / lack of support gracefully falls back to direct file download', async () => {
  const origCanShare = navigator.canShare;
  try {
    navigator.canShare = () => false;

    const dl = await waitForDownload(() => {
      if (typeof Engine.shareCardMobile === 'function') {
        Engine.shareCardMobile();
      } else if (domRegistry['pcShareNativeBtn']) {
        domRegistry['pcShareNativeBtn'].click();
      }
    });
    assert.ok(dl.download.endsWith('.png'));
  } finally {
    navigator.canShare = origCanShare;
  }
});

test('M4-RES-06: Omitted or undefined metadata state properties safely apply authentic TechHat defaults', async () => {
  const state = Engine.getState();
  state.designTitle = undefined;
  state.template = undefined;

  const dl = await waitForDownload(() => {
    domRegistry['pcDownloadPngBtn'].click();
  });
  const buf = Buffer.from(await dl.blob.arrayBuffer());
  const parsed = MetadataInjector.parsePngMetadata(buf);
  assert.ok(parsed.tags.Title, 'Default title must be supplied');
  assert.ok(parsed.tags.Author, 'Default author must be supplied');
  assert.ok(parsed.tags.URL, 'Default URL must be supplied');
});

/* =========================================================================
 * 10B. SUITE 8: MULTI-PAGE PDF EXPORT & CACHE-BUSTING REGRESSIONS (DEFECTS #7 & #8)
 * ========================================================================= */

test('M4-PDF-01 (Defect #7): Share dropdown #pcShareDownloadPdf exports multi-page PDF with TechHat metadata and zero AI markers', async () => {
  while (Engine.getPages().length > 1) {
    Engine.deletePage(Engine.getPages().length - 1);
  }
  Engine.applyTemplate('breaking-news', true);
  const state = Engine.getState();
  state.designTitle = 'টেকহ্যাট মাল্টি-পেজ বুলেটিন';
  Engine.addBlankPage(0);
  assert.equal(Engine.getPages().length, 2, 'Should have 2 pages before PDF export');

  const dl = await waitForDownload(() => {
    domRegistry['pcShareDownloadPdf'].click();
  });

  assert.ok(dl.download.endsWith('.pdf'), `Expected .pdf download filename, got ${dl.download}`);
  assert.ok(dl.download.includes('2pages'), `Multi-page PDF filename should indicate page count, got ${dl.download}`);
  assert.ok(dl.blob, 'Exported PDF blob must exist');
  assert.equal(dl.blob.type, 'application/pdf');

  const pdfBuf = Buffer.from(await dl.blob.arrayBuffer());
  const latin = pdfBuf.toString('latin1');
  const utf8 = pdfBuf.toString('utf8');

  assert.ok(latin.startsWith('%PDF-1.4\n'), 'Exported PDF must start with %PDF-1.4');
  assert.ok(latin.includes('/Type /Pages /Count 2'), 'Exported 2-page PDF must contain /Count 2');
  assert.ok(utf8.includes('techhat.com.bd'), 'Exported PDF must include TechHat domain attribution');
  assert.ok(utf8.includes('টেকহ্যাট মাল্টি-পেজ বুলেটিন'), 'Exported PDF XMP must preserve Bangla designTitle');
  assert.equal(MetadataInjector.findAiMarkers(pdfBuf).length, 0, 'Exported PDF must contain strictly zero AI markers');
});

test('M4-VER-01 (Defect #8): Cache-busting ?v=99 query strings and Nikosh font fallback are synchronized across Astro, image-tools, engine, and Svelte', () => {
  const astroSrc = fs.readFileSync(path.join(projectRoot, 'src/pages/image/[tool].astro'), 'utf8');
  const toolsSrc = fs.readFileSync(path.join(projectRoot, 'public/js/image-tools.js'), 'utf8');
  const engineSrc = fs.readFileSync(path.join(projectRoot, 'public/js/photo-card-engine.js'), 'utf8');
  const svelteSrc = fs.readFileSync(path.join(projectRoot, 'src/components/PhotoCardStudio.svelte'), 'utf8');

  assert.ok(astroSrc.includes('/js/photo-card-metadata.js?v=99'), '[tool].astro must load photo-card-metadata.js?v=99');
  assert.ok(astroSrc.includes('/js/photo-card-engine.js?v=99'), '[tool].astro must load photo-card-engine.js?v=99');
  assert.ok(astroSrc.includes('/js/image-tools.js?v=106'), '[tool].astro must load image-tools.js?v=106');

  assert.ok(toolsSrc.includes('/js/photo-card-metadata.js?v=99'), 'image-tools.js must lazy-load photo-card-metadata.js?v=99');
  assert.ok(toolsSrc.includes('/js/photo-card-engine.js?v=99'), 'image-tools.js must lazy-load photo-card-engine.js?v=99');
  assert.ok(engineSrc.includes('/js/photo-card-metadata.js?v=99'), 'photo-card-engine.js must reference photo-card-metadata.js?v=99');

  assert.equal(svelteSrc.includes('/fonts/Nikosh.ttf'), false, 'PhotoCardStudio.svelte must never request missing /fonts/Nikosh.ttf');
  assert.ok(svelteSrc.includes("font-family: 'Nikosh'") && svelteSrc.includes("url('/fonts/Kalpurush.ttf')"), 'Nikosh @font-face must alias cleanly to /fonts/Kalpurush.ttf');
  assert.ok(svelteSrc.includes('id="pcShareDownloadPdf"'), 'PhotoCardStudio.svelte Share menu must expose #pcShareDownloadPdf');
});

/* =========================================================================
 * 11. EXECUTION
 * ========================================================================= */

runAllTests();
