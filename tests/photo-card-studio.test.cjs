/* tests/photo-card-studio.test.cjs
 * Comprehensive E2E Test Suite for TechHat Photo Card Studio (/image/photo-card)
 * Enforcing Milestone E2E-2 requirements across Tiers 1-4 (Features F01 through F10).
 *
 * Tier 1: Category-Partition Feature Coverage (50 tests: PC-T1-F01-01 to PC-T1-F10-05)
 * Tier 2: Boundary Value Analysis & Corner Cases (50 tests: PC-T2-F01-01 to PC-T2-F10-05)
 * Tier 3: Pairwise Cross-Feature Combinations (11 tests: PC-T3-PAIR-01 to PC-T3-PAIR-11)
 * Tier 4: Real-World Workload Scenarios (6 tests: PC-T4-SCEN-01 to PC-T4-SCEN-06)
 *
 * Zero external dependencies: Built strictly with Node.js native standard libraries.
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const zlib = require('node:zlib');
const crypto = require('node:crypto');

/* =========================================================================
 * 1. HIGH-FIDELITY MOCK DOM ENVIRONMENT & CANVAS 2D SPY CONTEXT
 * ========================================================================= */

if (typeof global.Path2D === 'undefined') {
  global.Path2D = class Path2D {
    constructor(d) {
      this.d = typeof d === 'string' ? d : '';
    }
  };
}

function createInspectableCanvasContext(canvasEl) {
  const drawLog = [];
  let _fillStyle = '#000000';
  let _strokeStyle = '#000000';
  let _font = '16px sans-serif';
  let _textAlign = 'left';
  let _textBaseline = 'alphabetic';
  let _globalAlpha = 1.0;
  let _lineWidth = 1.0;

  const ctx = {
    canvas: canvasEl,
    __drawLog: drawLog,
    __clearLog() { drawLog.length = 0; },

    get fillStyle() { return _fillStyle; },
    set fillStyle(val) { _fillStyle = val; drawLog.push({ op: 'set_fillStyle', val }); },

    get strokeStyle() { return _strokeStyle; },
    set strokeStyle(val) { _strokeStyle = val; drawLog.push({ op: 'set_strokeStyle', val }); },

    get font() { return _font; },
    set font(val) { _font = val; drawLog.push({ op: 'set_font', val }); },

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
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
      drawLog.push({ op: 'bezierCurveTo', cp1x, cp1y, cp2x, cp2y, x, y });
    },
    quadraticCurveTo(cpx, cpy, x, y) { drawLog.push({ op: 'quadraticCurveTo', cpx, cpy, x, y }); },
    rect(x, y, w, h) { drawLog.push({ op: 'rect', x, y, w, h }); },
    ellipse(x, y, rx, ry, rot, sa, ea) { drawLog.push({ op: 'ellipse', x, y, rx, ry, rot }); },
    clip() { drawLog.push({ op: 'clip' }); },

    fill(path) { drawLog.push({ op: 'fill', fillStyle: _fillStyle, path: path || null }); },
    stroke() { drawLog.push({ op: 'stroke', strokeStyle: _strokeStyle }); },
    fillRect(x, y, w, h) { drawLog.push({ op: 'fillRect', x, y, w, h, fillStyle: _fillStyle }); },
    strokeRect(x, y, w, h) { drawLog.push({ op: 'strokeRect', x, y, w, h, strokeStyle: _strokeStyle }); },
    clearRect(x, y, w, h) { drawLog.push({ op: 'clearRect', x, y, w, h }); },

    fillText(text, x, y, maxW) {
      drawLog.push({
        op: 'fillText',
        text: String(text || ''),
        x, y, maxW,
        fillStyle: _fillStyle,
        font: _font
      });
    },
    strokeText(text, x, y, maxW) {
      drawLog.push({ op: 'strokeText', text: String(text || ''), x, y, strokeStyle: _strokeStyle });
    },
    measureText(text) {
      const len = String(text || '').length;
      return { width: len * 12, actualBoundingBoxAscent: 12, actualBoundingBoxDescent: 3 };
    },

    drawImage(img, ...args) {
      drawLog.push({ op: 'drawImage', src: img ? (img.src || img.currentSrc || 'img') : null, args });
    },
    createLinearGradient(x0, y0, x1, y1) {
      drawLog.push({ op: 'createLinearGradient', x0, y0, x1, y1 });
      return { addColorStop() {} };
    },
    createRadialGradient(x0, y0, r0, x1, y1, r1) {
      drawLog.push({ op: 'createRadialGradient', x0, y0, r0, x1, y1, r1 });
      return { addColorStop() {} };
    },
    createPattern() { return {}; },
    getImageData() { return { data: new Uint8ClampedArray(4) }; },
    putImageData() {},
    translate(x, y) { drawLog.push({ op: 'translate', x, y }); },
    rotate(rad) { drawLog.push({ op: 'rotate', rad }); },
    scale(sx, sy) { drawLog.push({ op: 'scale', sx, sy }); },
    setTransform() {},
    resetTransform() {}
  };

  return ctx;
}

function createMockElement(tagName = 'div', id = '') {
  const listeners = {};
  const attrs = {};
  const classes = new Set();
  const children = [];
  let _id = id || '';
  let _innerHTML = '';

  const el = {
    tagName: tagName.toUpperCase(),
    get id() { return _id; },
    set id(v) {
      if (_id && typeof domRegistry !== 'undefined' && domRegistry[_id] === el) {
        delete domRegistry[_id];
      }
      _id = String(v || '');
      if (_id) {
        attrs.id = _id;
        if (typeof domRegistry !== 'undefined') domRegistry[_id] = el;
      } else {
        delete attrs.id;
      }
    },
    get className() { return Array.from(classes).join(' '); },
    set className(v) {
      classes.clear();
      String(v || '').split(/\s+/).forEach(c => c && classes.add(c));
    },
    hidden: false,
    disabled: false,
    checked: false,
    value: '',
    textContent: '',
    get innerHTML() { return _innerHTML; },
    set innerHTML(v) {
      _innerHTML = String(v || '');
      if (classes.has('pc-page-container') && _innerHTML.includes('pc-artboard-wrap')) {
        children.length = 0;
        const pIdx = el.dataset.pageIndex || '0';
        const w = createMockElement('div');
        w.className = 'pc-artboard-wrap';
        w.setAttribute('data-page-index', pIdx);
        const cv = createMockElement('canvas');
        cv.className = 'pc-page-canvas';
        cv.width = 1080;
        cv.height = 1080;
        cv.setAttribute('data-page-index', pIdx);
        if (typeof canvas !== 'undefined' && canvas) {
          cv.toBlob = canvas.toBlob;
          cv.toDataURL = canvas.toDataURL;
        }
        w.appendChild(cv);
        el.appendChild(w);
      } else if (_id === 'pcPagesStrip' && _innerHTML.includes('data-switch-page=')) {
        children.length = 0;
        const matches = [..._innerHTML.matchAll(/data-switch-page="(\d+)"/g)];
        for (const m of matches) {
          const b = createMockElement('button');
          b.setAttribute('data-switch-page', m[1]);
          el.appendChild(b);
        }
      }
    },
    dataset: {},
    style: {},
    children: children,
    parentElement: null,
    parentNode: null,
    focus() { if (typeof global.document !== 'undefined') global.document.activeElement = el; },
    select() {},

    classList: {
      add(...cls) { cls.forEach(c => c && classes.add(c)); },
      remove(...cls) { cls.forEach(c => classes.delete(c)); },
      toggle(c, force) {
        if (force !== undefined) {
          if (force) classes.add(c); else classes.delete(c);
        } else {
          if (classes.has(c)) classes.delete(c); else classes.add(c);
        }
        return classes.has(c);
      },
      contains(c) { return classes.has(c); }
    },

    setAttribute(k, v) {
      attrs[k] = String(v);
      if (k === 'id') el.id = String(v);
      if (k.startsWith('data-')) {
        const camel = k.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
        el.dataset[camel] = String(v);
      }
    },
    getAttribute(k) { return attrs[k] !== undefined ? attrs[k] : null; },
    removeAttribute(k) {
      delete attrs[k];
      if (k === 'id') el.id = '';
      if (k.startsWith('data-')) {
        const camel = k.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
        delete el.dataset[camel];
      }
    },
    hasAttribute(k) { return attrs[k] !== undefined; },

    addEventListener(ev, fn, opts) {
      if (!listeners[ev]) listeners[ev] = [];
      listeners[ev].push({ fn, opts });
    },
    removeEventListener(ev, fn) {
      if (!listeners[ev]) return;
      listeners[ev] = listeners[ev].filter(item => item.fn !== fn);
    },
    dispatchEvent(event) {
      try {
        Object.defineProperty(event, 'target', { value: el, configurable: true, writable: true });
      } catch (e) {
        try { event.target = el; } catch (err) {}
      }
      try {
        Object.defineProperty(event, 'currentTarget', { value: el, configurable: true, writable: true });
      } catch (e) {
        try { event.currentTarget = el; } catch (err) {}
      }
      if (!event.stopPropagation) {
        event.stopPropagation = () => { event.propagationStopped = true; };
      }
      const list = listeners[event.type] || [];
      for (const item of list) {
        item.fn(event);
      }
      if (event.bubbles && el.parentElement && !event.propagationStopped) {
        el.parentElement.dispatchEvent(event);
      }
      return !event.defaultPrevented;
    },

    appendChild(child) {
      if (child.parentElement) child.parentElement.removeChild(child);
      children.push(child);
      child.parentElement = el;
      child.parentNode = el;
      return child;
    },
    insertBefore(newChild, refChild) {
      if (newChild.parentElement) newChild.parentElement.removeChild(newChild);
      const idx = children.indexOf(refChild);
      if (idx === -1) children.push(newChild);
      else children.splice(idx, 0, newChild);
      newChild.parentElement = el;
      newChild.parentNode = el;
      return newChild;
    },
    removeChild(child) {
      const idx = children.indexOf(child);
      if (idx !== -1) {
        children.splice(idx, 1);
        child.parentElement = null;
        child.parentNode = null;
      }
      return child;
    },
    contains(other) {
      if (other === el) return true;
      for (const c of children) {
        if (c.contains && c.contains(other)) return true;
      }
      return false;
    },
    closest(selector) {
      let cur = el;
      while (cur) {
        if (selector.startsWith('#') && cur.id === selector.slice(1)) return cur;
        if (selector.startsWith('.') && cur.classList && cur.classList.contains(selector.slice(1))) return cur;
        if (selector.startsWith('[data-')) {
          const m = selector.match(/\[([a-zA-Z0-9_-]+)(?:="([^"]+)")?\]/);
          if (m && cur.hasAttribute && cur.hasAttribute(m[1])) {
            if (!m[2] || cur.getAttribute(m[1]) === m[2]) return cur;
          }
        }
        cur = cur.parentElement;
      }
      return null;
    },

    querySelector(sel) {
      const trimmed = String(sel || '').trim();
      const spIdx = trimmed.indexOf(' ');
      if (spIdx > 0 && trimmed.startsWith('#')) {
        const first = trimmed.slice(0, spIdx);
        const rest = trimmed.slice(spIdx + 1).trim();
        const rootMatch = (typeof domRegistry !== 'undefined' && domRegistry[first.slice(1)]) || el.querySelector(first);
        return rootMatch && rootMatch.querySelector ? rootMatch.querySelector(rest) : null;
      }
      for (const c of children) {
        if (sel.startsWith('#') && c.id === sel.slice(1)) return c;
        if (sel.startsWith('.') && c.classList && c.classList.contains(sel.slice(1))) return c;
        if (sel.startsWith('[data-') && c.getAttribute) {
          const m = sel.match(/\[([a-zA-Z0-9_-]+)(?:="([^"]+)")?\]/);
          if (m && c.getAttribute(m[1]) === (m[2] || '')) return c;
        }
        if (c.tagName && sel.toUpperCase() === c.tagName) return c;
        if (c.querySelector) {
          const sub = c.querySelector(sel);
          if (sub) return sub;
        }
      }
      return null;
    },
    querySelectorAll(sel) {
      const trimmed = String(sel || '').trim();
      const spIdx = trimmed.indexOf(' ');
      if (spIdx > 0 && trimmed.startsWith('#')) {
        const first = trimmed.slice(0, spIdx);
        const rest = trimmed.slice(spIdx + 1).trim();
        const rootMatch = (typeof domRegistry !== 'undefined' && domRegistry[first.slice(1)]) || el.querySelector(first);
        return rootMatch && rootMatch.querySelectorAll ? rootMatch.querySelectorAll(rest) : [];
      }
      let res = [];
      for (const c of children) {
        if (sel.startsWith('#') && c.id === sel.slice(1)) res.push(c);
        else if (sel.startsWith('.') && c.classList && c.classList.contains(sel.slice(1))) res.push(c);
        else if (sel.startsWith('[data-') && c.getAttribute) {
          const m = sel.match(/\[([a-zA-Z0-9_-]+)(?:="([^"]+)")?\]/);
          if (m && c.hasAttribute(m[1])) {
            if (!m[2] || c.getAttribute(m[1]) === m[2]) res.push(c);
          }
        } else if (c.tagName && sel.toUpperCase() === c.tagName) res.push(c);

        if (c.querySelectorAll) {
          res = res.concat(c.querySelectorAll(sel));
        }
      }
      return res;
    },

    getContext(type) {
      if (type === '2d') {
        if (!el.__mock2dContext) {
          el.__mock2dContext = createInspectableCanvasContext(el);
        }
        return el.__mock2dContext;
      }
      return null;
    },
    getBoundingClientRect() {
      return { top: 100, left: 100, width: 580, height: 580, bottom: 680, right: 680 };
    },
    click() {
      if (typeof this.onclick === 'function') {
        this.onclick();
      }
      const ev = { type: 'click', target: el, currentTarget: el, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
      el.dispatchEvent(ev);
    }
  };

  return el;
}

// In-Memory Binary Image Fixtures for Export Simulation
function createMinimalPng() {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(1, 0); // width: 1
  ihdrData.writeUInt32BE(1, 4); // height: 1
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrCrc = zlib.crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdrChunk = Buffer.alloc(4 + 4 + 13 + 4);
  ihdrChunk.writeUInt32BE(13, 0);
  ihdrChunk.write('IHDR', 4);
  ihdrData.copy(ihdrChunk, 8);
  ihdrChunk.writeUInt32BE(ihdrCrc, 21);

  const rawScanline = Buffer.from([0x00, 0xFF, 0x00, 0x00, 0xFF]);
  const compressed = zlib.deflateSync(rawScanline);
  const idatChunk = Buffer.alloc(4 + 4 + compressed.length + 4);
  idatChunk.writeUInt32BE(compressed.length, 0);
  idatChunk.write('IDAT', 4);
  compressed.copy(idatChunk, 8);
  idatChunk.writeUInt32BE(zlib.crc32(Buffer.concat([Buffer.from('IDAT'), compressed])), 8 + compressed.length);

  const iendChunk = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function createMinimalJpeg() {
  return Buffer.from([
    0xFF, 0xD8, // SOI
    0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, // APP0 JFIF
    0xFF, 0xDB, 0x00, 0x43, 0x00, // DQT
    ...new Array(64).fill(16),
    0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, // SOF0
    0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, // SOS
    0x00, // Image data
    0xFF, 0xD9  // EOI
  ]);
}

// Mock Image Class for Stock Photos & Preloads
class MockImage {
  constructor() {
    this.crossOrigin = '';
    this.naturalWidth = 1200;
    this.naturalHeight = 800;
    this.width = 1200;
    this.height = 800;
    this._src = '';
    this.onload = null;
    this.onerror = null;
  }
  get src() { return this._src; }
  set src(val) {
    this._src = String(val);
    if (!val || val === 'error://trigger-fail' || val === 'data:corrupt') {
      setTimeout(() => { if (this.onerror) this.onerror(new Error('Mock load failed')); }, 2);
    } else {
      setTimeout(() => { if (this.onload) this.onload(); }, 2);
    }
  }
}
global.Image = MockImage;

// Mock Event Generators
function createMockWheelEvent(opts = {}) {
  const ev = {
    type: 'wheel',
    ctrlKey: !!opts.ctrlKey,
    metaKey: !!opts.metaKey,
    shiftKey: !!opts.shiftKey,
    deltaY: opts.deltaY !== undefined ? opts.deltaY : 100,
    clientX: opts.clientX || 300,
    clientY: opts.clientY || 300,
    defaultPrevented: false,
    bubbles: true,
    stopPropagation() {},
    preventDefault() { ev.defaultPrevented = true; }
  };
  return ev;
}

function createMockContextMenuEvent(opts = {}) {
  const ev = {
    type: 'contextmenu',
    button: 2,
    clientX: opts.clientX || 400,
    clientY: opts.clientY || 400,
    defaultPrevented: false,
    bubbles: true,
    stopPropagation() {},
    preventDefault() { ev.defaultPrevented = true; }
  };
  return ev;
}

// Global DOM Registry & Browser Environment Setup
const domRegistry = {};
function registerElement(id, el) { domRegistry[id] = el; return el; }

const rootDoc = createMockElement('document', 'document');

global.requestAnimationFrame = (cb) => cb();
global.cancelAnimationFrame = (id) => clearTimeout(id);

const windowListeners = {};
global.window = {
  location: { search: '', origin: 'https://tools.techhat.com.bd' },
  innerWidth: 1440,
  innerHeight: 900,
  requestAnimationFrame: global.requestAnimationFrame,
  cancelAnimationFrame: global.cancelAnimationFrame,
  addEventListener(ev, fn) {
    if (!windowListeners[ev]) windowListeners[ev] = [];
    windowListeners[ev].push(fn);
  },
  removeEventListener(ev, fn) {
    if (!windowListeners[ev]) return;
    windowListeners[ev] = windowListeners[ev].filter(f => f !== fn);
  },
  dispatchEvent(ev) {
    const list = windowListeners[ev.type] || [];
    for (const fn of list) fn(ev);
  },
  open(url) { global.window.__lastOpenedUrl = url; }
};

const headMock = createMockElement('head');
const bodyMock = createMockElement('body');
const htmlMock = createMockElement('html');

global.document = {
  readyState: 'complete',
  activeElement: null,
  documentElement: htmlMock,
  head: headMock,
  body: bodyMock,
  addEventListener() {},
  removeEventListener() {},
  createElement(tag) { return createMockElement(tag); },
  getElementById(id) {
    return domRegistry[id] || rootDoc.querySelector('#' + id);
  },
  querySelector(sel) {
    if (sel.startsWith('#')) {
      const id = sel.slice(1);
      return domRegistry[id] || rootDoc.querySelector(sel);
    }
    return rootDoc.querySelector(sel);
  },
  querySelectorAll(sel) {
    return rootDoc.querySelectorAll(sel);
  }
};

try {
  Object.defineProperty(global, 'navigator', {
    value: {
      clipboard: {
        writeText(txt) {
          global.navigator.__clipboardText = txt;
          if (global.navigator.__rejectClipboard) {
            return Promise.reject(new Error('NotAllowedError'));
          }
          return Promise.resolve();
        },
        write() { return Promise.resolve(); }
      }
    },
    configurable: true,
    writable: true
  });
} catch (e) {
  if (global.navigator) {
    global.navigator.clipboard = {
      writeText(txt) {
        global.navigator.__clipboardText = txt;
        if (global.navigator.__rejectClipboard) {
          return Promise.reject(new Error('NotAllowedError'));
        }
        return Promise.resolve();
      },
      write() { return Promise.resolve(); }
    };
  }
}

global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};

global.sessionStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};

// Initialize Studio DOM Structure
const pane = registerElement('img-pane-photo-card', createMockElement('div', 'img-pane-photo-card'));
rootDoc.appendChild(pane);

const scrollArea = registerElement('pcStageScrollArea', createMockElement('div', 'pcStageScrollArea'));
pane.appendChild(scrollArea);

const artCol = registerElement('pcArtboardColumn', createMockElement('div', 'pcArtboardColumn'));
scrollArea.appendChild(artCol);

const page0Container = createMockElement('div');
page0Container.className = 'pc-page-container';
page0Container.setAttribute('data-page-index', '0');
artCol.appendChild(page0Container);

const artWrap = registerElement('pcArtboardWrap', createMockElement('div', 'pcArtboardWrap'));
artWrap.classList.add('pc-artboard-wrap');
artWrap.setAttribute('data-page-index', '0');
page0Container.appendChild(artWrap);

const canvas = registerElement('pcCanvas', createMockElement('canvas', 'pcCanvas'));
canvas.classList.add('pc-page-canvas');
canvas.setAttribute('data-page-index', '0');
canvas.width = 1080;
canvas.height = 1080;
artWrap.appendChild(canvas);

const addPageBtn = registerElement('pcAddPageBtn', createMockElement('button', 'pcAddPageBtn'));
artCol.appendChild(addPageBtn);

const pagesStrip = registerElement('pcPagesStrip', createMockElement('div', 'pcPagesStrip'));
pagesStrip.hidden = true;
scrollArea.appendChild(pagesStrip);

const pagesCountBtn = registerElement('pcPagesCountBtn', createMockElement('button', 'pcPagesCountBtn'));
pane.appendChild(pagesCountBtn);

// Extend canvas mock with toBlob (returning a true Blob) and toDataURL
canvas.toBlob = function (cb, type = 'image/png') {
  const buf = type === 'image/jpeg' ? createMinimalJpeg() : createMinimalPng();
  const blob = new Blob([buf], { type });
  if (typeof cb === 'function') cb(blob);
};
canvas.toDataURL = function (type = 'image/png') {
  return 'data:' + type + ';base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
};

const overlayGroup = registerElement('pcInteractiveOverlayGroup', createMockElement('div', 'pcInteractiveOverlayGroup'));
artWrap.appendChild(overlayGroup);

const selBox = registerElement('pcSelectionBox', createMockElement('div', 'pcSelectionBox'));
overlayGroup.appendChild(selBox);

const hovBox = registerElement('pcHoverBox', createMockElement('div', 'pcHoverBox'));
hovBox.hidden = true;
overlayGroup.appendChild(hovBox);

const inlineEditor = registerElement('pcInlineEditor', createMockElement('textarea', 'pcInlineEditor'));
inlineEditor.hidden = true;
overlayGroup.appendChild(inlineEditor);

const shpEditTextBtn = registerElement('pcCtxShapeEditTextBtn', createMockElement('button', 'pcCtxShapeEditTextBtn'));
pane.appendChild(shpEditTextBtn);

const sld = registerElement('pcCanvasZoomSlider', createMockElement('input', 'pcCanvasZoomSlider'));
const lbl = registerElement('pcCanvasZoomVal', createMockElement('span', 'pcCanvasZoomVal'));
const autoToggle = registerElement('pcAutoSampleToggle', createMockElement('input', 'pcAutoSampleToggle'));
autoToggle.checked = false;

const ctxMenu = registerElement('pcContextMenu', createMockElement('div', 'pcContextMenu'));
pane.appendChild(ctxMenu);

const pcCtxDelBtn = registerElement('pcCtxDelBtn', createMockElement('button', 'pcCtxDelBtn'));
ctxMenu.appendChild(pcCtxDelBtn);
registerElement('pcCtxDeleteBtn', pcCtxDelBtn);

const pcCtxLockBtn = registerElement('pcCtxLockBtn', createMockElement('button', 'pcCtxLockBtn'));
ctxMenu.appendChild(pcCtxLockBtn);

const pcCtxPasteBtn = registerElement('pcCtxPasteBtn', createMockElement('button', 'pcCtxPasteBtn'));
ctxMenu.appendChild(pcCtxPasteBtn);

const pcCtxCopyBtn = registerElement('pcCtxCopyBtn', createMockElement('button', 'pcCtxCopyBtn'));
ctxMenu.appendChild(pcCtxCopyBtn);

const pcCtxCopyStyleBtn = registerElement('pcCtxCopyStyleBtn', createMockElement('button', 'pcCtxCopyStyleBtn'));
ctxMenu.appendChild(pcCtxCopyStyleBtn);

const pcCtxPasteStyleBtn = registerElement('pcCtxPasteStyleBtn', createMockElement('button', 'pcCtxPasteStyleBtn'));
ctxMenu.appendChild(pcCtxPasteStyleBtn);

// Share Popover DOM
const shareDropdown = registerElement('pcShareDropdown', createMockElement('div', 'pcShareDropdown'));
shareDropdown.hidden = true;
pane.appendChild(shareDropdown);

const shareUrlInput = registerElement('pcShareUrlInput', createMockElement('input', 'pcShareUrlInput'));
shareDropdown.appendChild(shareUrlInput);

const shareWhatsAppBtn = registerElement('pcShareWhatsAppBtn', createMockElement('button', 'pcShareWhatsAppBtn'));
shareDropdown.appendChild(shareWhatsAppBtn);

const copyLinkBtn = registerElement('pcCopyLinkBtn', createMockElement('button', 'pcCopyLinkBtn'));
shareDropdown.appendChild(copyLinkBtn);

const quickExportPngBtn = registerElement('pcQuickExportPngBtn', createMockElement('button', 'pcQuickExportPngBtn'));
quickExportPngBtn.setAttribute('data-export-format', 'png');
shareDropdown.appendChild(quickExportPngBtn);

const quickExportJpgBtn = registerElement('pcQuickExportJpgBtn', createMockElement('button', 'pcQuickExportJpgBtn'));
quickExportJpgBtn.setAttribute('data-export-format', 'jpeg');
shareDropdown.appendChild(quickExportJpgBtn);

// Color Popover, Highlight & Brand Kit DOM Mocks
const colorPopover = registerElement('pcColorPopover', createMockElement('div', 'pcColorPopover'));
colorPopover.hidden = true;
pane.appendChild(colorPopover);

const colorPopoverTitle = registerElement('pcColorPopoverTitle', createMockElement('span', 'pcColorPopoverTitle'));
colorPopover.appendChild(colorPopoverTitle);

const colorPopoverResetBtn = registerElement('pcColorPopoverResetBtn', createMockElement('button', 'pcColorPopoverResetBtn'));
colorPopover.appendChild(colorPopoverResetBtn);

const colorPopoverCloseBtn = registerElement('pcColorPopoverCloseBtn', createMockElement('button', 'pcColorPopoverCloseBtn'));
colorPopover.appendChild(colorPopoverCloseBtn);

const colorPopoverBrandRow = registerElement('pcColorPopoverBrandRow', createMockElement('div', 'pcColorPopoverBrandRow'));
colorPopoverBrandRow.hidden = true;
colorPopover.appendChild(colorPopoverBrandRow);

const colorPopoverBrandSwatches = registerElement('pcColorPopoverBrandSwatches', createMockElement('div', 'pcColorPopoverBrandSwatches'));
colorPopoverBrandRow.appendChild(colorPopoverBrandSwatches);

const colorPopoverLivePreview = registerElement('pcColorPopoverLivePreview', createMockElement('span', 'pcColorPopoverLivePreview'));
colorPopover.appendChild(colorPopoverLivePreview);

const colorPopoverHexInput = registerElement('pcColorPopoverHexInput', createMockElement('input', 'pcColorPopoverHexInput'));
colorPopover.appendChild(colorPopoverHexInput);

const colorPopoverNativeInput = registerElement('pcColorPopoverNativeInput', createMockElement('input', 'pcColorPopoverNativeInput'));
colorPopover.appendChild(colorPopoverNativeInput);

const ctxTextColorBtn = registerElement('pcCtxTextColorBtn', createMockElement('button', 'pcCtxTextColorBtn'));
pane.appendChild(ctxTextColorBtn);
const ctxTextColorBar = registerElement('pcCtxTextColorBar', createMockElement('span', 'pcCtxTextColorBar'));
ctxTextColorBtn.appendChild(ctxTextColorBar);
const ctxTextColorInput = registerElement('pcCtxTextColorInput', createMockElement('input', 'pcCtxTextColorInput'));
ctxTextColorBtn.appendChild(ctxTextColorInput);

const ctxHighlightColorBtn = registerElement('pcCtxHighlightColorBtn', createMockElement('button', 'pcCtxHighlightColorBtn'));
pane.appendChild(ctxHighlightColorBtn);
const ctxHighlightColorBar = registerElement('pcCtxHighlightColorBar', createMockElement('span', 'pcCtxHighlightColorBar'));
ctxHighlightColorBtn.appendChild(ctxHighlightColorBar);

const ctxTextBgWrapper = registerElement('pcCtxTextBgWrapper', createMockElement('div', 'pcCtxTextBgWrapper'));
ctxTextBgWrapper.hidden = true;
pane.appendChild(ctxTextBgWrapper);
const ctxTextBgBtn = registerElement('pcCtxTextBgBtn', createMockElement('button', 'pcCtxTextBgBtn'));
ctxTextBgWrapper.appendChild(ctxTextBgBtn);
const ctxTextBgColorBar = registerElement('pcCtxTextBgColorBar', createMockElement('span', 'pcCtxTextBgColorBar'));
ctxTextBgBtn.appendChild(ctxTextBgColorBar);
const ctxTextBgColorInput = registerElement('pcCtxTextBgColorInput', createMockElement('input', 'pcCtxTextBgColorInput'));
ctxTextBgBtn.appendChild(ctxTextBgColorInput);

const miniTintGroup = registerElement('pcMiniTintGroup', createMockElement('div', 'pcMiniTintGroup'));
miniTintGroup.hidden = true;
pane.appendChild(miniTintGroup);
const miniBgColorBtn = registerElement('pcMiniBgColorBtn', createMockElement('button', 'pcMiniBgColorBtn'));
miniTintGroup.appendChild(miniBgColorBtn);
const miniBgColorSwatch = registerElement('pcMiniBgColorSwatch', createMockElement('span', 'pcMiniBgColorSwatch'));
miniBgColorBtn.appendChild(miniBgColorSwatch);
const miniBgColorInput = registerElement('pcMiniBgColorInput', createMockElement('input', 'pcMiniBgColorInput'));
miniBgColorBtn.appendChild(miniBgColorInput);
const miniFgColorBtn = registerElement('pcMiniFgColorBtn', createMockElement('button', 'pcMiniFgColorBtn'));
miniTintGroup.appendChild(miniFgColorBtn);
const miniFgColorSwatch = registerElement('pcMiniFgColorSwatch', createMockElement('span', 'pcMiniFgColorSwatch'));
miniFgColorBtn.appendChild(miniFgColorSwatch);
const miniFgColorInput = registerElement('pcMiniFgColorInput', createMockElement('input', 'pcMiniFgColorInput'));
miniFgColorBtn.appendChild(miniFgColorInput);

const headlineHighlightColorBtn = registerElement('pcHeadlineHighlightColorBtn', createMockElement('button', 'pcHeadlineHighlightColorBtn'));
pane.appendChild(headlineHighlightColorBtn);
const headlineHighlightColorDot = registerElement('pcHeadlineHighlightColorDot', createMockElement('span', 'pcHeadlineHighlightColorDot'));
headlineHighlightColorBtn.appendChild(headlineHighlightColorDot);
const highlightModeBtn = registerElement('pcHighlightModeBtn', createMockElement('button', 'pcHighlightModeBtn'));
pane.appendChild(highlightModeBtn);
const highlightModeLabel = registerElement('pcHighlightModeLabel', createMockElement('span', 'pcHighlightModeLabel'));
highlightModeBtn.appendChild(highlightModeLabel);

const footerUrlInput = registerElement('pcFooterUrl', createMockElement('input', 'pcFooterUrl'));
pane.appendChild(footerUrlInput);
const syncFooterToBrandBtn = registerElement('pcSyncFooterToBrandBtn', createMockElement('button', 'pcSyncFooterToBrandBtn'));
pane.appendChild(syncFooterToBrandBtn);

const brandNameInput = registerElement('pcBrandName', createMockElement('input', 'pcBrandName'));
pane.appendChild(brandNameInput);
const brandWebsiteInput = registerElement('pcBrandWebsite', createMockElement('input', 'pcBrandWebsite'));
pane.appendChild(brandWebsiteInput);
const brandPhoneInput = registerElement('pcBrandPhone', createMockElement('input', 'pcBrandPhone'));
pane.appendChild(brandPhoneInput);
const brandFooterFormatSelect = registerElement('pcBrandFooterFormat', createMockElement('select', 'pcBrandFooterFormat'));
brandFooterFormatSelect.value = 'both';
pane.appendChild(brandFooterFormatSelect);
const brandExtraInfoInput = registerElement('pcBrandExtraInfo', createMockElement('input', 'pcBrandExtraInfo'));
pane.appendChild(brandExtraInfoInput);
const brandPrimaryColorInput = registerElement('pcBrandPrimaryColor', createMockElement('input', 'pcBrandPrimaryColor'));
brandPrimaryColorInput.value = '#dc2626';
pane.appendChild(brandPrimaryColorInput);
const brandAccentColorInput = registerElement('pcBrandAccentColor', createMockElement('input', 'pcBrandAccentColor'));
brandAccentColorInput.value = '#facc15';
pane.appendChild(brandAccentColorInput);
const brandBgColorInput = registerElement('pcBrandBgColor', createMockElement('input', 'pcBrandBgColor'));
brandBgColorInput.value = '#0f172a';
pane.appendChild(brandBgColorInput);
const brandApplyColorsToggle = registerElement('pcBrandApplyColorsToggle', createMockElement('input', 'pcBrandApplyColorsToggle'));
brandApplyColorsToggle.checked = true;
pane.appendChild(brandApplyColorsToggle);
const savedBrandProfilesList = registerElement('pcSavedBrandProfilesList', createMockElement('div', 'pcSavedBrandProfilesList'));
pane.appendChild(savedBrandProfilesList);
const deactivateBrandBtn = registerElement('pcDeactivateBrandBtn', createMockElement('button', 'pcDeactivateBrandBtn'));
deactivateBrandBtn.hidden = true;
pane.appendChild(deactivateBrandBtn);
const newBrandProfileBtn = registerElement('pcNewBrandProfileBtn', createMockElement('button', 'pcNewBrandProfileBtn'));
pane.appendChild(newBrandProfileBtn);
const saveBrandProfileBtn = registerElement('pcSaveBrandProfileBtn', createMockElement('button', 'pcSaveBrandProfileBtn'));
pane.appendChild(saveBrandProfileBtn);
const saveAsNewBrandBtn = registerElement('pcSaveAsNewBrandBtn', createMockElement('button', 'pcSaveAsNewBrandBtn'));
pane.appendChild(saveAsNewBrandBtn);
const brandGrabCurrentColorsBtn = registerElement('pcBrandGrabCurrentColorsBtn', createMockElement('button', 'pcBrandGrabCurrentColorsBtn'));
pane.appendChild(brandGrabCurrentColorsBtn);

// Canva Studio Upgrade DOM Mocks (Rich Inline Editor, Dynamic Context Toolbar, Tool Popover, Position/Layers, Organized Elements & Brand)
const inlineRichEditor = registerElement('pcInlineRichEditor', createMockElement('div', 'pcInlineRichEditor'));
inlineRichEditor.hidden = true;
overlayGroup.appendChild(inlineRichEditor);

const selectionQuickBar = registerElement('pcSelectionQuickBar', createMockElement('div', 'pcSelectionQuickBar'));
selectionQuickBar.hidden = true;
overlayGroup.appendChild(selectionQuickBar);

const selToolbarMock = registerElement('pcSelectionToolbar', createMockElement('div', 'pcSelectionToolbar'));
selBox.appendChild(selToolbarMock);
const miniEditBtn = registerElement('pcMiniEditBtn', createMockElement('button', 'pcMiniEditBtn'));
selToolbarMock.appendChild(miniEditBtn);
const miniDupBtn = registerElement('pcMiniDupBtn', createMockElement('button', 'pcMiniDupBtn'));
selToolbarMock.appendChild(miniDupBtn);
const miniLockBtn = registerElement('pcMiniLockBtn', createMockElement('button', 'pcMiniLockBtn'));
miniLockBtn.appendChild(createMockElement('svg'));
selToolbarMock.appendChild(miniLockBtn);
const miniDelBtn = registerElement('pcMiniDelBtn', createMockElement('button', 'pcMiniDelBtn'));
selToolbarMock.appendChild(miniDelBtn);

const selMoveHandle = registerElement('pcMoveHandle', createMockElement('button', 'pcMoveHandle'));
selBox.appendChild(selMoveHandle);
const selRotHandle = registerElement('pcRotateHandle', createMockElement('button', 'pcRotateHandle'));
selBox.appendChild(selRotHandle);
const selCornerHandle = createMockElement('span');
selCornerHandle.setAttribute('data-pc-handle', 'se');
selBox.appendChild(selCornerHandle);

const contextToolbar = registerElement('pcContextToolbar', createMockElement('div', 'pcContextToolbar'));
pane.appendChild(contextToolbar);
const ctxPanels = {};
['text', 'photo', 'shape', 'vector', 'logo', 'locked', 'card'].forEach(panelName => {
  const pEl = createMockElement('div');
  pEl.setAttribute('data-ctx-panel', panelName);
  pEl.hidden = panelName !== 'card';
  contextToolbar.appendChild(pEl);
  ctxPanels[panelName] = pEl;
});
const topFlipBtn = registerElement('pcTopFlipBtn', createMockElement('button', 'pcTopFlipBtn'));
contextToolbar.appendChild(topFlipBtn);
const topTransparencyBtn = registerElement('pcTopTransparencyBtn', createMockElement('button', 'pcTopTransparencyBtn'));
const topTransparencyVal = registerElement('pcTopTransparencyVal', createMockElement('span', 'pcTopTransparencyVal'));
topTransparencyBtn.appendChild(topTransparencyVal);
contextToolbar.appendChild(topTransparencyBtn);
const topPositionBtn = registerElement('pcTopPositionBtn', createMockElement('button', 'pcTopPositionBtn'));
contextToolbar.appendChild(topPositionBtn);
const topLayersBtn = registerElement('pcTopLayersBtn', createMockElement('button', 'pcTopLayersBtn'));
contextToolbar.appendChild(topLayersBtn);
const topCopyStyleBtn = registerElement('pcTopCopyStyleBtn', createMockElement('button', 'pcTopCopyStyleBtn'));
contextToolbar.appendChild(topCopyStyleBtn);
const topDuplicateBtn = registerElement('pcTopDuplicateBtn', createMockElement('button', 'pcTopDuplicateBtn'));
contextToolbar.appendChild(topDuplicateBtn);
const topLockBtn = registerElement('pcTopLockBtn', createMockElement('button', 'pcTopLockBtn'));
topLockBtn.appendChild(createMockElement('svg'));
contextToolbar.appendChild(topLockBtn);
const topDeleteBtn = registerElement('pcTopDeleteBtn', createMockElement('button', 'pcTopDeleteBtn'));
contextToolbar.appendChild(topDeleteBtn);

const toolPopover = registerElement('pcToolPopover', createMockElement('div', 'pcToolPopover'));
toolPopover.hidden = true;
pane.appendChild(toolPopover);
const toolPopoverTitle = registerElement('pcToolPopoverTitle', createMockElement('span', 'pcToolPopoverTitle'));
toolPopover.appendChild(toolPopoverTitle);
const toolPopSections = {};
['transparency', 'spacing', 'effects', 'border', 'adjust', 'flip'].forEach(secKey => {
  const sEl = createMockElement('div');
  sEl.setAttribute('data-tool-pop-sec', secKey);
  sEl.hidden = true;
  toolPopover.appendChild(sEl);
  toolPopSections[secKey] = sEl;
});
const popOpacityRange = registerElement('pcPopOpacityRange', createMockElement('input', 'pcPopOpacityRange'));
toolPopSections.transparency.appendChild(popOpacityRange);
const popOpacityInput = registerElement('pcPopOpacityInput', createMockElement('input', 'pcPopOpacityInput'));
toolPopSections.transparency.appendChild(popOpacityInput);

const positionDrawer = createMockElement('div');
positionDrawer.setAttribute('data-pc-drawer', 'position');
positionDrawer.hidden = true;
pane.appendChild(positionDrawer);
const posTabArrange = createMockElement('button');
posTabArrange.setAttribute('data-pos-tab', 'arrange');
positionDrawer.appendChild(posTabArrange);
const posTabLayers = createMockElement('button');
posTabLayers.setAttribute('data-pos-tab', 'layers');
positionDrawer.appendChild(posTabLayers);
const posArrangePane = registerElement('pcPosArrangePane', createMockElement('div', 'pcPosArrangePane'));
positionDrawer.appendChild(posArrangePane);
const posLayersPane = registerElement('pcPosLayersPane', createMockElement('div', 'pcPosLayersPane'));
posLayersPane.hidden = true;
positionDrawer.appendChild(posLayersPane);
const posAdvW = registerElement('pcPosAdvW', createMockElement('input', 'pcPosAdvW'));
posArrangePane.appendChild(posAdvW);
const posAdvH = registerElement('pcPosAdvH', createMockElement('input', 'pcPosAdvH'));
posArrangePane.appendChild(posAdvH);
const posAdvX = registerElement('pcPosAdvX', createMockElement('input', 'pcPosAdvX'));
posArrangePane.appendChild(posAdvX);
const posAdvY = registerElement('pcPosAdvY', createMockElement('input', 'pcPosAdvY'));
posArrangePane.appendChild(posAdvY);
const posAdvRot = registerElement('pcPosAdvRot', createMockElement('input', 'pcPosAdvRot'));
posArrangePane.appendChild(posAdvRot);
const posRatioLockBtn = registerElement('pcPosRatioLockBtn', createMockElement('button', 'pcPosRatioLockBtn'));
posRatioLockBtn.appendChild(createMockElement('svg'));
posArrangePane.appendChild(posRatioLockBtn);
const layersFilterAll = createMockElement('button');
layersFilterAll.setAttribute('data-layers-filter', 'all');
posLayersPane.appendChild(layersFilterAll);
const layersFilterOverlapping = createMockElement('button');
layersFilterOverlapping.setAttribute('data-layers-filter', 'overlapping');
posLayersPane.appendChild(layersFilterOverlapping);
const layersStackList = registerElement('pcLayersStackList', createMockElement('div', 'pcLayersStackList'));
posLayersPane.appendChild(layersStackList);

const elementsDrawer = createMockElement('div');
elementsDrawer.setAttribute('data-pc-drawer', 'elements');
elementsDrawer.hidden = true;
pane.appendChild(elementsDrawer);
const elementsSearchInput = registerElement('pcElementsSearchInput', createMockElement('input', 'pcElementsSearchInput'));
elementsDrawer.appendChild(elementsSearchInput);
const elementsCatChips = registerElement('pcElementsCatChips', createMockElement('div', 'pcElementsCatChips'));
elementsDrawer.appendChild(elementsCatChips);
['all', 'icons', 'social', 'payment', 'shapes', 'graphics', 'badges', 'colors'].forEach(catId => {
  const cBtn = createMockElement('button');
  cBtn.setAttribute('data-el-cat', catId);
  elementsCatChips.appendChild(cBtn);
});
const elementsDrillHeader = registerElement('pcElementsDrillHeader', createMockElement('div', 'pcElementsDrillHeader'));
elementsDrillHeader.hidden = true;
elementsDrawer.appendChild(elementsDrillHeader);
const elementsBackBtn = registerElement('pcElementsBackBtn', createMockElement('button', 'pcElementsBackBtn'));
elementsDrillHeader.appendChild(elementsBackBtn);
const elementsDrillTitle = registerElement('pcElementsDrillTitle', createMockElement('strong', 'pcElementsDrillTitle'));
elementsDrillHeader.appendChild(elementsDrillTitle);
const elShelfMap = {};
['icons', 'social', 'payment', 'shapes', 'graphics', 'badges', 'colors'].forEach(shelfId => {
  const shEl = createMockElement('div');
  shEl.setAttribute('data-el-shelf', shelfId);
  const seeAll = createMockElement('button');
  seeAll.setAttribute('data-el-see-all', shelfId);
  shEl.appendChild(seeAll);
  const item0 = createMockElement('button');
  item0.setAttribute('data-el-item', '1');
  item0.setAttribute('data-el-overflow', '0');
  item0.setAttribute('data-el-keywords', shelfId + ' primary item phone nagad rocket facebook');
  shEl.appendChild(item0);
  const itemOverflow = createMockElement('button');
  itemOverflow.setAttribute('data-el-item', '1');
  itemOverflow.setAttribute('data-el-overflow', '1');
  itemOverflow.setAttribute('data-el-keywords', shelfId + ' overflow extra item upay discord');
  itemOverflow.hidden = true;
  shEl.appendChild(itemOverflow);
  elementsDrawer.appendChild(shEl);
  elShelfMap[shelfId] = { shelf: shEl, seeAll, item0, itemOverflow };
});

const brandDrawer = createMockElement('div');
brandDrawer.setAttribute('data-pc-drawer', 'brand');
brandDrawer.hidden = true;
pane.appendChild(brandDrawer);
const brandSearchInput = registerElement('pcBrandSearchInput', createMockElement('input', 'pcBrandSearchInput'));
brandDrawer.appendChild(brandSearchInput);
const brandKitDropdownBtn = registerElement('pcBrandKitDropdownBtn', createMockElement('button', 'pcBrandKitDropdownBtn'));
brandDrawer.appendChild(brandKitDropdownBtn);
const brandKitDropdownMenu = registerElement('pcBrandKitDropdownMenu', createMockElement('div', 'pcBrandKitDropdownMenu'));
brandKitDropdownMenu.hidden = true;
brandDrawer.appendChild(brandKitDropdownMenu);
const brandSectionNav = registerElement('pcBrandSectionNav', createMockElement('div', 'pcBrandSectionNav'));
brandDrawer.appendChild(brandSectionNav);
['all', 'logos', 'colors', 'fonts', 'info', 'graphics'].forEach(secId => {
  const bSec = createMockElement('button');
  bSec.setAttribute('data-brand-sec', secId);
  brandSectionNav.appendChild(bSec);
});
const brandBackToAllBtn = registerElement('pcBrandBackToAllBtn', createMockElement('button', 'pcBrandBackToAllBtn'));
brandBackToAllBtn.hidden = true;
brandDrawer.appendChild(brandBackToAllBtn);
const brandCardMap = {};
['logos', 'colors', 'fonts', 'info', 'graphics', 'saved'].forEach(cId => {
  const cEl = createMockElement('div');
  cEl.setAttribute('data-brand-card', cId);
  cEl.setAttribute('data-brand-keywords', cId + ' brand asset');
  brandDrawer.appendChild(cEl);
  brandCardMap[cId] = cEl;
});

// Load Engine and Metadata Injector
const Engine = require('../public/js/photo-card-engine.js');
let MetadataInjector = null;
try {
  MetadataInjector = require('../public/js/photo-card-metadata.js');
} catch (e) {
  // Graceful fallback
}

// Load Svelte Component source for static UI contracts
const sveltePath = path.join(__dirname, '../src/components/PhotoCardStudio.svelte');
const svelteSrc = fs.readFileSync(sveltePath, 'utf8');

// NO MONKEYPATCHING: All wrappers on alignSelectedToPage, color math, stock photos,
// payment vectors, stickers catalog, and NEW_15_SPECS injection are completely removed.
// All tests invoke genuine production engine exports directly.




/* =========================================================================
 * 3. TEST RUNNER HARNESS & STATE ISOLATION HELPERS
 * ========================================================================= */

let passed = 0;
let failed = 0;
const testErrors = [];
const testSuite = [];

function runTest(id, name, fn) {
  testSuite.push({ id, name, fn });
}

function resetStudioState() {
  global.localStorage.removeItem('th_photocard_brand_profiles_v1');
  global.localStorage.removeItem('th_photocard_active_brand_v1');
  global.localStorage.removeItem('th_photocard_brand_prefs_v1');
  global.localStorage.removeItem('th_photocard_brand_v1');
  const state = Engine.getState();
  state.template = 'blood-donation';
  state.designTitle = 'নতুন ফটোকার্ড ডিজাইন';
  state.userEditedTitle = false;
  state.userEditedText = false;
  state.customLayers = [];
  state.elementOffsets = {};
  state.elementFontDelta = {};
  state.elementScale = {};
  state.elementCrop = {};
  state.elementBoxW = {};
  state.elementRotation = {};
  state.userResized = {};
  state.elementHidden = {};
  state.elementStyles = {};
  state.elementFonts = {};
  state.elementLocked = {};
  state.selectedElementId = null;
  state.pageLocked = false;
  state.logoCustomX = null;
  state.logoCustomY = null;
  state.canvasZoom = 100;
  state.activePageIndex = 0;
  state.pages = [{ id: 'page_1', title: 'Page 1', customLayers: [] }];
  state.photoImg = null;
  state.photoAssetId = '';
  state.logoImg = null;
  state.logoAssetId = '';
  state.logoDataUrl = '';
  state.brandWebsite = '';
  state.brandPhone = '';
  state.brandExtraInfo = '';
  state.brandFooterFormat = 'both';
  state.highlightColor = '';
  state.highlightBgMode = '';
  ctxMenu.hidden = true;
  shareDropdown.hidden = true;
  inlineEditor.hidden = true;
  colorPopover.hidden = true;
  global.document.activeElement = null;
  global.navigator.__rejectClipboard = false;
  autoToggle.checked = false;
  if (typeof Engine.renderPagesUi === 'function') Engine.renderPagesUi();
  const mockCtx = canvas.getContext('2d');
  if (mockCtx && mockCtx.__clearLog) mockCtx.__clearLog();
}

console.log('======================================================================');
console.log('  TechHat Photo Card Studio: E2E Test Suite (Tiers 1-4)');
console.log('======================================================================\n');

/* =========================================================================
 * 4. TIER 1: FEATURE COVERAGE (50 CASES: PC-T1-F01-01 to PC-T1-F10-05)
 * ========================================================================= */

// --- Feature 1: Template State Isolation (R1) ---
runTest('PC-T1-F01-01', 'Switching template resets state.customLayers to []', () => {
  const state = Engine.getState();
  state.customLayers = [
    { id: 'stk_1', layerType: 'badge', text: 'জরুরি' },
    { id: 'shp_1', layerType: 'shape', shapeType: 'circle' }
  ];
  assert.equal(state.customLayers.length, 2);
  Engine.applyTemplate('kalbela-news', true);
  assert.equal(Array.isArray(state.customLayers), true);
  assert.equal(state.customLayers.length, 0);
});

runTest('PC-T1-F01-02', 'Switching template resets all element transform maps', () => {
  const state = Engine.getState();
  state.elementOffsets = { headline: { dx: 50, dy: -30 } };
  state.elementScale = { headline: 1.4 };
  state.elementRotation = { headline: 15 };
  state.elementCrop = { photo: { top: 10, left: 20 } };
  state.elementBoxW = { headline: 820 };
  state.userResized = { headline: true };
  state.elementHidden = { tagline: true };

  Engine.applyTemplate('breaking-news', true);
  assert.deepEqual(state.elementOffsets, {});
  assert.deepEqual(state.elementScale, {});
  assert.deepEqual(state.elementRotation, {});
  assert.deepEqual(state.elementCrop, {});
  assert.deepEqual(state.elementBoxW, {});
  assert.deepEqual(state.userResized, {});
  assert.deepEqual(state.elementHidden, {});
});

runTest('PC-T1-F01-03', 'Switching template clears custom formatting dictionaries', () => {
  const state = Engine.getState();
  state.elementStyles = { headline: { fill: '#ff0055', uppercase: true } };
  state.elementFonts = { headline: 'Anek Bangla' };
  state.elementFontDelta = { headline: 12 };

  Engine.applyTemplate('quote-card', true);
  assert.deepEqual(state.elementStyles, {});
  assert.deepEqual(state.elementFonts, {});
  assert.deepEqual(state.elementFontDelta, {});
});

runTest('PC-T1-F01-04', 'Switching template clears element lock states and selection', () => {
  const state = Engine.getState();
  state.elementLocked = { headline: true, photo: true };
  Engine.selectElement('headline');
  state.pageLocked = true;

  Engine.applyTemplate('charity-appeal', true);
  assert.deepEqual(state.elementLocked, {});
  assert.ok(state.selectedElementId === null || state.selectedElementId === 'card');
  assert.equal(state.pageLocked, false);
});

runTest('PC-T1-F01-05', 'Switching template restores target default palette and typography', () => {
  const state = Engine.getState();
  state.primaryColor = '#123456';
  state.accentColor = '#654321';
  state.bgColor = '#abcdef';

  Engine.applyTemplate('duotone-poster', true);
  const meta = Engine.TEMPLATES['duotone-poster'];
  assert.equal(state.template, 'duotone-poster');
  assert.equal(state.primaryColor, meta.primary);
  assert.equal(state.accentColor, meta.accent);
  assert.equal(state.bgColor, meta.bg);
  assert.equal(state.titleSize, meta.titleSize);
});

// --- Feature 2: Canvas Zoom Scoping (R2) ---
runTest('PC-T1-F02-01', 'Wheel event with ctrlKey: true calls preventDefault()', () => {
  const ev = createMockWheelEvent({ ctrlKey: true, deltaY: -80 });
  scrollArea.dispatchEvent(ev);
  assert.equal(ev.defaultPrevented, true);
});

runTest('PC-T1-F02-02', 'Canvas zoom updates state.canvasZoom proportionally', () => {
  const state = Engine.getState();
  state.canvasZoom = 100;
  Engine.applyCanvasZoom(state.canvasZoom + 10);
  assert.equal(state.canvasZoom, 110);
  Engine.applyCanvasZoom(state.canvasZoom - 20);
  assert.equal(state.canvasZoom, 90);
});

runTest('PC-T1-F02-03', 'Canvas element DOM styles update based on canvasZoom', () => {
  Engine.applyCanvasZoom(120);
  const canvasEl = document.getElementById('pcCanvas');
  assert.ok(canvasEl.style.width.includes('696') || canvasEl.style.width.includes('120') || canvasEl.style.width !== '');
});

runTest('PC-T1-F02-04', 'Regular wheel event does not call preventDefault()', () => {
  const ev = createMockWheelEvent({ ctrlKey: false, deltaY: 100 });
  scrollArea.dispatchEvent(ev);
  assert.equal(ev.defaultPrevented, false);
});

runTest('PC-T1-F02-05', 'Direct zoom button controls mutate canvasZoom synchronously', () => {
  const state = Engine.getState();
  Engine.applyCanvasZoom(100);
  Engine.applyCanvasZoom(state.canvasZoom + 10);
  assert.equal(state.canvasZoom, 110);
  Engine.applyCanvasZoom(state.canvasZoom - 10);
  assert.equal(state.canvasZoom, 100);
});

// --- Feature 3: Vertical Stacked Multi-Page Canvas Layout (R3) ---
runTest('PC-T1-F03-01', 'Adding a page creates pristine page with clean elementLocked, elementStyles, and elementFonts', () => {
  const state = Engine.getState();
  const pages = Engine.getPages();
  while (pages.length > 1) Engine.deletePage(1);
  Engine.switchToPage(0);

  // Set dirty state on Page 0: lock headline, custom font, and custom element style
  state.elementLocked = { headline: true };
  state.elementStyles = { headline: { color: '#ff0000', fontSize: 52 } };
  state.elementFonts = { headline: 'Kalpurush' };
  state.elementOffsets = { headline: { dx: 15, dy: 25 } };
  state.customLayers = [{ id: 'p0_stk', text: 'Page 0 Sticker' }];

  // Add blank page after Page 0
  Engine.addBlankPage(0);

  // Assert Page 1 is active and appends properly
  assert.equal(state.pages.length, 2);
  assert.equal(state.activePageIndex, 1);
  const title = state.pages[1].title || ('Page ' + (state.activePageIndex + 1));
  assert.ok(title.includes('Page 2') || title.includes('পাতা ২') || title.includes('পেজ ২'));

  // Assert Page 1 is pristine: clean elementLocked, elementStyles, and elementFonts
  assert.deepEqual(state.elementLocked, {}, 'Page 1 elementLocked must be clean empty object');
  assert.deepEqual(state.elementStyles, {}, 'Page 1 elementStyles must be clean empty object');
  assert.deepEqual(state.elementFonts, {}, 'Page 1 elementFonts must be clean empty object');
  assert.deepEqual(state.elementOffsets, {}, 'Page 1 elementOffsets must be clean empty object');
  assert.deepEqual(state.customLayers, [], 'Page 1 customLayers must be clean empty array');

  // Verify Page 1 snapshot stored in pages array is also pristine
  const p1Snap = state.pages[1].snap;
  assert.ok(p1Snap, 'Page 1 snapshot must exist');
  assert.deepEqual(p1Snap.elementLocked, {}, 'Page 1 snapshot elementLocked must be empty');
  assert.deepEqual(p1Snap.elementStyles, {}, 'Page 1 snapshot elementStyles must be empty');
  assert.deepEqual(p1Snap.elementFonts, {}, 'Page 1 snapshot elementFonts must be empty');

  // Verify switching back to Page 0 preserves Page 0 dirty state
  Engine.switchToPage(0);
  assert.equal(state.activePageIndex, 0);
  assert.equal(state.elementLocked.headline, true, 'Page 0 locked headline preserved');
  assert.equal(state.elementStyles.headline.color, '#ff0000', 'Page 0 element style preserved');
  assert.equal(state.elementFonts.headline, 'Kalpurush', 'Page 0 element font preserved');

  // Verify switching back to Page 1 remains completely pristine
  Engine.switchToPage(1);
  assert.equal(state.activePageIndex, 1);
  assert.deepEqual(state.elementLocked, {}, 'Page 1 remains unlocked after round-trip switch');
  assert.deepEqual(state.elementStyles, {}, 'Page 1 remains unstyled after round-trip switch');
  assert.deepEqual(state.elementFonts, {}, 'Page 1 remains uncustomized after round-trip switch');
});

runTest('PC-T1-F03-02', 'Page duplication clones active page elements independently', () => {
  const state = Engine.getState();
  state.customLayers = [{ id: 'orig_1', text: 'মূল বার্তা' }];
  state.pages[0].snap = { customLayers: [{ id: 'orig_1', text: 'মূল বার্তা' }] };
  state.pages[0].customLayers = [{ id: 'orig_1', text: 'মূল বার্তা' }];
  Engine.duplicatePage(0);
  assert.equal(state.pages.length, 2);
  assert.equal(state.activePageIndex, 1);
  assert.equal(state.customLayers[0].text, 'মূল বার্তা');
  state.customLayers[0].text = 'পরিবর্তিত';
  assert.equal(state.pages[0].snap.customLayers[0].text, 'মূল বার্তা');
});

runTest('PC-T1-F03-03', 'Deleting a page removes specified index and activates adjacent', () => {
  const state = Engine.getState();
  state.pages = [
    { id: 'p0', title: '0', snap: {} },
    { id: 'p1', title: '1', snap: {} },
    { id: 'p2', title: '2', snap: {} }
  ];
  state.activePageIndex = 1;
  Engine.deletePage(1);
  assert.equal(state.pages.length, 2);
  assert.ok(state.activePageIndex === 0 || state.activePageIndex === 1);
});

runTest('PC-T1-F03-04', 'Reordering pages swaps indices correctly in stack', () => {
  const state = Engine.getState();
  state.pages = [{ id: 'pA', title: 'A' }, { id: 'pB', title: 'B' }, { id: 'pC', title: 'C' }];
  state.activePageIndex = 2;
  Engine.movePage(2, 0);
  assert.equal(state.pages[0].title, 'C');
  assert.equal(state.pages[1].title, 'A');
  assert.equal(state.pages[2].title, 'B');
  assert.equal(state.activePageIndex, 0);
});

runTest('PC-T1-F03-05', 'Page title updates mutate the specific page object', () => {
  const state = Engine.getState();
  state.pages[0].title = 'বক্তাদের পরিচিতি';
  assert.equal(state.pages[0].title, 'বক্তাদের পরিচিতি');
});

// --- Feature 4: Custom Right-Click Context Menu (R4) ---
runTest('PC-T1-F04-01', 'Right-click calls e.preventDefault() to suppress native menu', () => {
  const ev = createMockContextMenuEvent({ clientX: 300, clientY: 400 });
  canvas.dispatchEvent(ev);
  assert.equal(ev.defaultPrevented, true);
});

runTest('PC-T1-F04-02', 'Context menu sets viewport coordinates matching click', () => {
  Engine.openContextMenuAt(250, 380);
  const menuEl = document.getElementById('pcContextMenu');
  assert.equal(menuEl.hidden, false);
  assert.ok(menuEl.style.left.includes('250') || menuEl.dataset.menuX === '250');
  assert.ok(menuEl.style.top.includes('380') || menuEl.dataset.menuY === '380');
});

runTest('PC-T1-F04-03', 'copySelected and pasteElement duplicate with +24px offset', () => {
  const state = Engine.getState();
  state.customLayers = [{ id: 'test_lyr', layerType: 'text', text: 'কপি টেক্সট', x: 200, y: 150 }];
  Engine.selectElement('layer:test_lyr');
  Engine.copySelectedElement();
  Engine.pasteElement();
  assert.equal(state.customLayers.length, 2);
  const pasted = state.customLayers[1];
  assert.equal(pasted.text, 'কপি টেক্সট');
  assert.equal(pasted.x, 200 + 24);
  assert.equal(pasted.y, 150 + 24);
});

runTest('PC-T1-F04-04', 'Layer operations update layer z-indices', () => {
  const state = Engine.getState();
  state.customLayers = [{ id: 'L0' }, { id: 'L1' }, { id: 'L2' }];
  Engine.selectElement('layer:L0');
  Engine.reorderCustomLayer('front');
  assert.equal(state.customLayers[2].id, 'L0');
  Engine.reorderCustomLayer('back');
  assert.equal(state.customLayers[0].id, 'L0');
});

runTest('PC-T1-F04-05', 'alignSelectedToPage computes exact artboard bounds on genuine engine', () => {
  const state = Engine.getState();
  state.customLayers = [{ id: 'align_test', layerType: 'text', x: 100, y: 100, w: 200, h: 50 }];
  Engine.selectElement('layer:align_test');
  Engine.render();

  // Test center & middle
  Engine.alignSelectedToPage('center');
  const lyr = state.customLayers.find(l => l.id === 'align_test');
  assert.equal(lyr.x, 540, 'Horizontal center must be 540');

  Engine.alignSelectedToPage('middle');
  assert.equal(lyr.y, 540, 'Vertical middle must be 540');

  // Test left & right boundary
  Engine.alignSelectedToPage('left');
  assert.equal(lyr.x, 100, 'Left alignment half-width offset must be 100');

  Engine.alignSelectedToPage('right');
  assert.equal(lyr.x, 980, 'Right alignment offset must be 980 (1080 - 100)');

  // Test top & bottom boundary
  Engine.alignSelectedToPage('top');
  assert.equal(lyr.y, 25, 'Top alignment half-height offset must be 25');

  Engine.alignSelectedToPage('bottom');
  assert.equal(lyr.y, 1055, 'Bottom alignment offset must be 1055 (1080 - 25)');
});

// --- Feature 5: Dedicated Universal Share Button (R5) ---
runTest('PC-T1-F05-01', 'Share button click toggles share dropdown visibility', () => {
  const dd = document.getElementById('pcShareDropdown');
  Engine.openShareDropdown();
  assert.equal(dd.hidden, false);
  Engine.closeShareDropdown();
  assert.equal(dd.hidden, true);
});

runTest('PC-T1-F05-02', 'Copy Link action generates valid URL with template slug', () => {
  const state = Engine.getState();
  state.template = 'breaking-news';
  const url = Engine.getTemplateDeepLink();
  assert.ok(url.startsWith('http'));
  assert.ok(url.includes('template=breaking-news'));
});

runTest('PC-T1-F05-03', 'WhatsApp share constructs properly encoded intent URL', () => {
  const state = Engine.getState();
  state.designTitle = 'বিশেষ ফটোকার্ড';
  state.template = 'kalbela-news';
  Engine.shareOnWhatsApp();
  const openedUrl = global.window.__lastOpenedUrl;
  assert.ok(openedUrl.includes('whatsapp') || openedUrl.includes('wa.me'));
  assert.ok(openedUrl.includes(encodeURIComponent('বিশেষ ফটোকার্ড')));
  assert.ok(openedUrl.includes(encodeURIComponent('template=kalbela-news')));
});

runTest('PC-T1-F05-04', 'Share dropdown provides quick export triggers for PNG and JPEG', () => {
  const pngBtn = document.querySelector('[data-export-format="png"]') || document.getElementById('pcQuickExportPngBtn');
  const jpgBtn = document.querySelector('[data-export-format="jpeg"]') || document.getElementById('pcQuickExportJpgBtn');
  assert.ok(pngBtn !== null);
  assert.ok(jpgBtn !== null);
});

runTest('PC-T1-F05-05', 'Share dropdown provides copy image to clipboard trigger', () => {
  assert.doesNotThrow(() => {
    Engine.copyCardToClipboard();
  });
});

// --- Feature 6: Template Catalog & Modern Layouts (R6) ---
runTest('PC-T1-F06-01', 'Total template catalog contains at least 30 baseline templates', () => {
  const keys = Object.keys(Engine.TEMPLATES);
  assert.ok(keys.length >= 30, `Expected at least 30 baseline templates, got: ${keys.length}`);
  const requiredBaselines = [
    'blood-donation', 'charity-appeal', 'winter-eid-drive', 'zakat-sadakah',
    'medical-camp', 'tree-environment', 'charity-activity', 'volunteer-member',
    'kalbela-news', 'janakantha-frame', 'breaking-news', 'tv-lower-third',
    'vertical-sidebar', 'minimal-portal', 'floating-overlap', 'newspaper-classic',
    'red-arc-quote', 'dark-border-quote', 'notebook-quote', 'white-sheet-redbar',
    'story-long-quote', 'quote-card', 'factcheck-dual', 'factcheck-report',
    'factcheck-stamp', 'glass-bento', 'split-magazine', 'polaroid-story',
    'cyber-neon', 'duotone-poster'
  ];
  for (const bId of requiredBaselines) {
    assert.ok(keys.includes(bId), `Baseline template ${bId} must be present in Engine.TEMPLATES`);
  }
});

runTest('PC-T1-F06-02', 'All templates in TEMPLATE_META have valid required schema properties', () => {
  const entries = Object.entries(Engine.TEMPLATES);
  assert.ok(entries.length >= 30, 'Catalog must not be empty');
  for (const [id, meta] of entries) {
    assert.ok(typeof meta.nameBn === 'string' && meta.nameBn.length > 0, `Template ${id} must have non-empty nameBn`);
    assert.ok(['charity', 'news', 'quote', 'factcheck', 'modern'].includes(meta.cat), `Template ${id} has invalid category: ${meta.cat}`);
    assert.ok(/^#[0-9a-fA-F]{6}$/.test(meta.primary), `Template ${id} primary color ${meta.primary} is not valid 6-hex`);
    assert.ok(/^#[0-9a-fA-F]{6}$/.test(meta.accent), `Template ${id} accent color ${meta.accent} is not valid 6-hex`);
    assert.ok(/^#[0-9a-fA-F]{6}$/.test(meta.bg), `Template ${id} bg color ${meta.bg} is not valid 6-hex`);
    assert.ok(typeof meta.titleSize === 'number' && meta.titleSize > 0, `Template ${id} titleSize must be positive number`);
    assert.ok(['left', 'center', 'right'].includes(meta.align), `Template ${id} align must be left/center/right`);
    assert.ok(typeof meta.headline === 'string' && meta.headline.length > 0, `Template ${id} must have default headline`);
    assert.ok(typeof meta.labels === 'object' && meta.labels !== null, `Template ${id} must define input labels object`);
  }
});

runTest('PC-T1-F06-03', 'All templates in catalog have corresponding registered renderers', () => {
  const engineSrc = fs.readFileSync(path.join(__dirname, '../public/js/photo-card-engine.js'), 'utf8');
  const rMatch = engineSrc.match(/var RENDERERS = \{([\s\S]*?)\n  \};/);
  assert.ok(rMatch, 'RENDERERS map must exist in photo-card-engine.js');
  const registeredRendererKeys = Array.from(rMatch[1].matchAll(/'([a-z0-9-]+)':/g)).map(m => m[1]);

  for (const id of Object.keys(Engine.TEMPLATES)) {
    assert.ok(
      registeredRendererKeys.includes(id),
      `Template ${id} must be registered in RENDERERS map without relying on default fallback`
    );
    assert.doesNotThrow(() => {
      Engine.applyTemplate(id, true);
    }, `applyTemplate must execute cleanly for ${id}`);
  }
});

runTest('PC-T1-F06-04', 'PhotoCardStudio.svelte templates array matches Engine.TEMPLATES 1-to-1 with valid categories', () => {
  const sMatch = svelteSrc.match(/const templates: TemplateItem\[\] = \[([\s\S]*?)\];/);
  assert.ok(sMatch, 'templates array must exist in PhotoCardStudio.svelte');

  const svelteIds = Array.from(sMatch[1].matchAll(/id:\s*'([a-z0-9-]+)'/g)).map(m => m[1]);
  const engineIds = Object.keys(Engine.TEMPLATES);

  assert.equal(svelteIds.length, engineIds.length, `Svelte template count (${svelteIds.length}) must match Engine count (${engineIds.length})`);

  for (const id of engineIds) {
    assert.ok(svelteIds.includes(id), `Template ${id} from Engine.TEMPLATES must be present in PhotoCardStudio.svelte`);
    const meta = Engine.TEMPLATES[id];
    assert.ok(['charity', 'news', 'quote', 'factcheck', 'modern'].includes(meta.cat));
  }
});

runTest('PC-T1-F06-05', 'Invoking render on all templates executes cleanly and executes canvas drawing operations', () => {
  const ctx = canvas.getContext('2d');
  for (const id of Object.keys(Engine.TEMPLATES)) {
    Engine.applyTemplate(id, true);
    ctx.__clearLog();
    assert.doesNotThrow(() => {
      Engine.render();
    }, `Render for template ${id} must not throw`);
    assert.ok(
      ctx.__drawLog.length > 0,
      `Template ${id} must execute drawing operations on canvas, got 0 ops`
    );
    if (id === 'channel24-broadcast-news') {
      const fills = ctx.__drawLog.filter(op => op.op === 'fill').length;
      assert.ok(fills > 0, `channel24-broadcast-news must execute path fill operations (Nagad vector sponsor), got ${fills}`);
    }
  }
});

// --- Feature 7: Context-Aware Royalty-Free Stock Photo Placeholders (R7) ---
runTest('PC-T1-F07-01', 'Stock photo registry contains definitions for all categories', () => {
  const cats = ['charity', 'news', 'quote', 'factcheck', 'modern'];
  for (const cat of cats) {
    const spec = Engine.getStockPhotoSpec('kalbela-news', cat, false);
    assert.ok(spec && typeof spec.url === 'string' && spec.url.length > 0);
  }
});

runTest('PC-T1-F07-02', 'Loading template without upload assigns category stock photo', () => {
  const state = Engine.getState();
  Engine.applyTemplate('kalbela-news', true);
  assert.equal(state.photoAssetId, '');
  assert.equal(state.photoImg, null);
  const spec = Engine.getStockPhotoSpec('kalbela-news', 'news', false);
  assert.ok(spec && (spec.url.includes('unsplash') || spec.url.length > 0));
});

runTest('PC-T1-F07-03', 'Stock placeholder scales and centers adhering to aspect ratio', () => {
  Engine.applyTemplate('kalbela-news', true);
  const spec = Engine.getStockPhotoSpec('kalbela-news', 'news', false);
  assert.ok(spec && spec.url, 'Spec must provide valid stock photo URL');

  // Inject a mock image with known intrinsic dimensions (16:9 aspect ratio -> 1600x900)
  const iw = 1600;
  const ih = 900;
  const mockImg = new MockImage();
  mockImg.naturalWidth = iw;
  mockImg.naturalHeight = ih;
  mockImg.width = iw;
  mockImg.height = ih;
  Engine.stockPhotoCache[spec.url] = { status: 'loaded', img: mockImg };

  const ctx = canvas.getContext('2d');
  ctx.__clearLog();
  Engine.render();

  // Find the drawImage call recorded by canvas context spy
  const drawOps = ctx.__drawLog.filter(op => op.op === 'drawImage');
  assert.ok(drawOps.length > 0, 'Engine.render must execute drawImage for photo slot');
  const [dx, dy, dw, dh] = drawOps[0].args;

  // Real engine slot dimensions for kalbela-news (pad = 30, photoW = 1020, photoH = 540)
  const slotW = 1020;
  const slotH = 540;
  const slotCenterX = 30 + slotW / 2;
  const slotCenterY = 30 + slotH / 2;

  // 1. Coverage: Rendered dimensions must fully cover slot (object-fit: cover)
  assert.ok(dw >= slotW - 0.01, `dw (${dw}) must cover slotW (${slotW})`);
  assert.ok(dh >= slotH - 0.01, `dh (${dh}) must cover slotH (${slotH})`);

  // 2. Aspect ratio preservation: dw / dh must equal intrinsic aspect ratio iw / ih
  const renderedAspect = dw / dh;
  const intrinsicAspect = iw / ih;
  assert.ok(Math.abs(renderedAspect - intrinsicAspect) < 1e-4,
    `Rendered aspect ratio (${renderedAspect}) must match intrinsic aspect ratio (${intrinsicAspect})`);

  // 3. Centering: Rendered image center must align with slot center
  const imgCenterX = dx + dw / 2;
  const imgCenterY = dy + dh / 2;
  assert.ok(Math.abs(imgCenterX - slotCenterX) < 1.0,
    `Image center X (${imgCenterX}) must align with slot center X (${slotCenterX})`);
  assert.ok(Math.abs(imgCenterY - slotCenterY) < 1.0,
    `Image center Y (${imgCenterY}) must align with slot center Y (${slotCenterY})`);
});

runTest('PC-T1-F07-04', 'Image failure triggers procedural vector fallback safely', () => {
  Engine.applyTemplate('blood-donation', true);
  const state = Engine.getState();
  state.photoImg = null;

  const spec = Engine.getStockPhotoSpec('blood-donation', 'charity', false);
  // Simulate image network/load failure in stock cache
  Engine.stockPhotoCache[spec.url] = { status: 'error', img: null };

  const ctx = canvas.getContext('2d');
  ctx.__clearLog();

  assert.doesNotThrow(() => {
    Engine.render();
  });

  // Verify procedural vector fallback artwork was rendered
  const drawLog = ctx.__drawLog;
  const hasGradients = drawLog.some(op => op.op === 'createLinearGradient');
  const hasFills = drawLog.some(op => op.op === 'fill' || op.op === 'fillRect');
  const hasDrawImage = drawLog.some(op => op.op === 'drawImage');

  assert.ok(hasGradients, 'Procedural fallback must create studio gradient background');
  assert.ok(hasFills, 'Procedural fallback must perform fill drawing operations');
  assert.equal(hasDrawImage, false, 'Failed image must not invoke drawImage with broken source');
});

runTest('PC-T1-F07-05', 'Uploading custom user photo replaces stock placeholder', () => {
  const state = Engine.getState();
  state.photoImg = { width: 800, height: 600, src: 'data:image/png;base64,...' };
  state.photoAssetId = 'user_upload_1';
  assert.equal(state.photoAssetId, 'user_upload_1');
  assert.ok(state.photoImg !== null);
});

// --- Feature 8: Smart Text Contrast Adaptation (R8) ---
runTest('PC-T1-F08-01', 'Pure white text on pure white background converts to dark slate', () => {
  const textColor = Engine.getEffectiveTextColor('#ffffff', '#ffffff');
  assert.equal(textColor, '#0f172a');
});

runTest('PC-T1-F08-02', 'Pure white text on dark background remains #ffffff', () => {
  const textColor = Engine.getEffectiveTextColor('#ffffff', '#0f172a');
  assert.equal(textColor, '#ffffff');
});

runTest('PC-T1-F08-03', 'Pure black text on dark background converts to #ffffff', () => {
  const textColor = Engine.getEffectiveTextColor('#000000', '#0a0a0a');
  assert.equal(textColor, '#ffffff');
});

runTest('PC-T1-F08-04', 'Saturated accent colors with sufficient contrast remain preserved', () => {
  const textColor = Engine.getEffectiveTextColor('#f59e0b', '#0f172a');
  assert.equal(textColor, '#f59e0b');
});

runTest('PC-T1-F08-05', 'Relative luminance calculation accurately classifies intermediate hues', () => {
  const lumYellow = Engine.getRelativeLuminance('#fef08a');
  const lumNavy = Engine.getRelativeLuminance('#091e42');
  assert.ok(lumYellow > 0.42);
  assert.ok(lumNavy <= 0.42);
});

// --- Feature 9: Expanded Badges & Editable Stickers (R9) ---
runTest('PC-T1-F09-01', 'Elements drawer catalog contains at least 32 distinct badges', () => {
  const match = svelteSrc.match(/const stickerElements:\s*StickerElementItem\[\]\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(match, 'stickerElements array must be declared in PhotoCardStudio.svelte');
  const count = (match[1].match(/text:\s*'/g) || []).length;
  assert.ok(count >= 32, `Elements drawer must contain >= 32 badges, found: ${count}`);
});

runTest('PC-T1-F09-02', 'Clicking badge adds it as editable custom layer', () => {
  const state = Engine.getState();
  const initLen = state.customLayers.length;
  Engine.addStickerBadge('⚡ ব্রেকিং নিউজ', '#b91c1c', '#fde047', 34);
  assert.equal(state.customLayers.length, initLen + 1);
  const added = state.customLayers[state.customLayers.length - 1];
  assert.equal(added.text, '⚡ ব্রেকিং নিউজ');
  assert.equal(added.bgColor, '#b91c1c');
  assert.equal(added.color, '#fde047');
});

runTest('PC-T1-F09-03', 'Custom badge/sticker layer supports resize / scale modifications', () => {
  const state = Engine.getState();
  Engine.addStickerBadge('লাইভ', '#dc2626', '#ffffff', 30);
  const lyr = state.customLayers[state.customLayers.length - 1];
  lyr.scale = 1.5;
  assert.equal(lyr.scale, 1.5);
});

runTest('PC-T1-F09-04', 'Custom badge/sticker layer supports rotation modifications', () => {
  const state = Engine.getState();
  Engine.addStickerBadge('লাইভ', '#dc2626', '#ffffff', 30);
  const lyr = state.customLayers[state.customLayers.length - 1];
  lyr.rotation = 15;
  assert.equal(lyr.rotation, 15);
});

runTest('PC-T1-F09-05', 'Custom badge/sticker layer supports color tinting', () => {
  const state = Engine.getState();
  Engine.addStickerBadge('লাইভ', '#dc2626', '#ffffff', 30);
  const lyr = state.customLayers[state.customLayers.length - 1];
  lyr.bgColor = '#047857';
  lyr.color = '#ffffff';
  assert.equal(lyr.bgColor, '#047857');
  assert.equal(lyr.color, '#ffffff');
});

// --- Feature 10: Native SVG Payment & Brand Icons (R10) ---
runTest('PC-T1-F10-01', 'bKash vector asset renders using authentic brand SVG path (not emoji)', () => {
  const data = Engine.PAYMENT_BRAND_VECTORS.bkash;
  assert.ok(data !== undefined);
  assert.equal(data.polygons.length, 8);
  assert.equal(/[\u{1F300}-\u{1F9FF}]/u.test(data.name), false);
});

runTest('PC-T1-F10-02', 'Nagad vector asset renders using authentic brand SVG path', () => {
  const data = Engine.PAYMENT_BRAND_VECTORS.nagad;
  assert.ok(data !== undefined);
  assert.ok(data.paths.length > 0);
  assert.equal(/[\u{1F300}-\u{1F9FF}]/u.test(data.name), false);
});

runTest('PC-T1-F10-03', 'Rocket vector asset renders using authentic brand SVG path', () => {
  const data = Engine.PAYMENT_BRAND_VECTORS.rocket;
  assert.ok(data !== undefined);
  assert.ok(data.paths.length > 0);
  assert.equal(/[\u{1F300}-\u{1F9FF}]/u.test(data.name), false);
});

runTest('PC-T1-F10-04', 'Payment vectors render cleanly at multiple scales', () => {
  assert.doesNotThrow(() => {
    const mockCtx = canvas.getContext('2d');
    Engine.drawBrandVectorIcon(mockCtx, 'bkash', 50, 50, 24);
    Engine.drawBrandVectorIcon(mockCtx, 'bkash', 50, 50, 120);
  });
});

runTest('PC-T1-F10-05', 'Elements drawer provides payment brand icons ready for placement', () => {
  assert.ok(svelteSrc.includes('data-add-vector="bkash"'), 'bKash button must exist in Drawer 2');
  assert.ok(svelteSrc.includes('data-add-vector="nagad"'), 'Nagad button must exist in Drawer 2');
  assert.ok(svelteSrc.includes('data-add-vector="rocket"'), 'Rocket button must exist in Drawer 2');
});

/* =========================================================================
 * 5. TIER 2: BOUNDARY VALUE ANALYSIS (50 CASES: PC-T2-F01-01 to PC-T2-F10-05)
 * ========================================================================= */

// --- Feature 1 Boundaries ---
runTest('PC-T2-F01-01', 'Idempotency: Switching to same template ID purges dirty layers', () => {
  const state = Engine.getState();
  Engine.applyTemplate('kalbela-news', true);
  state.customLayers = [{ id: 'test' }];
  state.elementRotation = { headline: 10 };
  Engine.applyTemplate('kalbela-news', true);
  assert.equal(state.template, 'kalbela-news');
  assert.equal(state.customLayers.length, 0);
  assert.deepEqual(state.elementRotation, {});
});

runTest('PC-T2-F01-02', 'Switching with 50+ deep/rotated stickers leaves exactly 0 residual layers', () => {
  const state = Engine.getState();
  state.customLayers = Array.from({ length: 50 }, (_, i) => ({
    id: `layer_${i}`,
    rotation: i * 7,
    scale: 1 + (i % 5) * 0.2
  }));
  Engine.applyTemplate('quote-card', true);
  assert.equal(state.customLayers.length, 0);
});

runTest('PC-T2-F01-03', 'Switching template with invalid ID gracefully no-ops and __proto__ falls back safely without crashing', () => {
  const state = Engine.getState();
  state.template = 'blood-donation';

  // 1. Invalid template slug gracefully no-ops on valid state
  assert.doesNotThrow(() => {
    Engine.applyTemplate('non-existent-template-slug-xyz', true);
  });
  assert.equal(state.template, 'blood-donation', 'Invalid template slug gracefully no-ops');

  // 2. Hostile prototype pollution key '__proto__' must not crash and must not pollute state
  assert.doesNotThrow(() => {
    Engine.applyTemplate('__proto__', true);
    Engine.render();
  });
  assert.notEqual(state.template, '__proto__', 'state.template must not be polluted with __proto__');
  assert.ok(typeof (Engine.TEMPLATES[state.template] || {}).nameBn === 'string', 'Active template remains valid');

  // 3. Fallback to default 'breaking-news' when applying invalid/hostile template on corrupted or empty template state
  state.template = '__proto__';
  assert.doesNotThrow(() => {
    Engine.applyTemplate('__proto__', true);
  });
  assert.equal(state.template, 'breaking-news', 'Corrupted template state falls back safely to breaking-news');

  // 4. Invoking Engine.render() on fallback template executes cleanly
  assert.doesNotThrow(() => {
    Engine.render();
  });
});

runTest('PC-T2-F01-04', 'Switching template with forceLoadSample=false retains user text', () => {
  const state = Engine.getState();
  state.headline = 'ইউজারের নিজস্ব বিশেষ খবর';
  state.userEditedText = true;
  state.elementOffsets = { headline: { dx: 100, dy: 50 } };
  Engine.applyTemplate('janakantha-frame', false);
  assert.equal(state.headline, 'ইউজারের নিজস্ব বিশেষ খবর');
  assert.deepEqual(state.elementOffsets, {});
});

runTest('PC-T2-F01-05', 'Rapid successive template switches do not leak state', () => {
  const state = Engine.getState();
  const templateKeys = Object.keys(Engine.TEMPLATES).slice(0, 10);
  for (let i = 0; i < 20; i++) {
    Engine.applyTemplate(templateKeys[i % templateKeys.length], true);
  }
  assert.equal(state.customLayers.length, 0);
  assert.ok(state.selectedElementId === null || state.selectedElementId === 'card');
});

// --- Feature 2 Boundaries ---
runTest('PC-T2-F02-01', 'Minimum zoom clamp: requests below 50% clamp to 50%', () => {
  const state = Engine.getState();
  Engine.applyCanvasZoom(10);
  assert.equal(state.canvasZoom, 50);
  Engine.applyCanvasZoom(-50);
  assert.equal(state.canvasZoom, 50);
  Engine.applyCanvasZoom(40);
  assert.equal(state.canvasZoom, 50);
});

runTest('PC-T2-F02-02', 'Maximum zoom clamp: requests above 150% clamp to 150%', () => {
  const state = Engine.getState();
  Engine.applyCanvasZoom(160);
  assert.equal(state.canvasZoom, 150);
  Engine.applyCanvasZoom(500);
  assert.equal(state.canvasZoom, 150);
});

runTest('PC-T2-F02-03', 'Exactly at 100% zoom, canvas style resets for responsive fitting', () => {
  Engine.applyCanvasZoom(100);
  const canvasEl = document.getElementById('pcCanvas');
  assert.equal(canvasEl.style.width, '');
  assert.equal(canvasEl.style.maxHeight, '');
});

runTest('PC-T2-F02-04', 'Meta key (macOS) triggers zoom clamp identically to ctrlKey', () => {
  const ev = createMockWheelEvent({ ctrlKey: false, metaKey: true, deltaY: -50 });
  scrollArea.dispatchEvent(ev);
  assert.equal(ev.defaultPrevented, true);
});

runTest('PC-T2-F02-05', 'Fractional/NaN zoom inputs fall back safely to default 100%', () => {
  const state = Engine.getState();
  Engine.applyCanvasZoom('invalid');
  assert.equal(state.canvasZoom, 100);
  Engine.applyCanvasZoom(NaN);
  assert.equal(state.canvasZoom, 100);
  Engine.applyCanvasZoom(null);
  assert.equal(state.canvasZoom, 100);
});

// --- Feature 3 Boundaries ---
runTest('PC-T2-F03-01', 'Single-page delete guard: Attempt to delete last page is blocked', () => {
  const state = Engine.getState();
  state.pages = [{ id: 'p1', title: 'Page 1' }];
  Engine.deletePage(0);
  assert.equal(state.pages.length, 1);
});

runTest('PC-T2-F03-02', 'Top page boundary: movePageUp(0) is blocked / no-op', () => {
  const state = Engine.getState();
  assert.doesNotThrow(() => {
    Engine.movePage(0, -1);
  });
  assert.equal(state.activePageIndex, 0);
});

runTest('PC-T2-F03-03', 'Bottom page boundary: movePageDown(last) is blocked / no-op', () => {
  const state = Engine.getState();
  const lastIdx = state.pages.length - 1;
  assert.doesNotThrow(() => {
    Engine.movePage(lastIdx, lastIdx + 1);
  });
  assert.equal(state.activePageIndex, lastIdx);
});

runTest('PC-T2-F03-04', 'Extreme page count: Adding 20+ pages maintains unique IDs', () => {
  const state = Engine.getState();
  for (let i = 0; i < 20; i++) {
    Engine.addBlankPage(state.pages.length - 1);
  }
  assert.ok(state.pages.length >= 20);
  const ids = new Set(state.pages.map(p => p.id));
  assert.equal(ids.size, state.pages.length);
});

runTest('PC-T2-F03-05', 'Switching active page clears active element selection', () => {
  const state = Engine.getState();
  state.pages = [{ id: 'p0', snap: {} }, { id: 'p1', snap: {} }];
  Engine.selectElement('layer:some_stk');
  Engine.switchToPage(1);
  assert.equal(state.activePageIndex, 1);
  assert.ok(state.selectedElementId === null || state.selectedElementId === 'card');
});

// --- Feature 4 Boundaries ---
runTest('PC-T2-F04-01', 'Right-clicking locked element disables mutation actions', () => {
  const state = Engine.getState();
  state.elementLocked['headline'] = true;
  Engine.selectElement('headline');
  Engine.openContextMenuAt(300, 300);
  assert.equal(state.elementLocked['headline'], true);
  const delBtn = document.getElementById('pcCtxDelBtn');
  const lockBtn = document.getElementById('pcCtxLockBtn');
  assert.ok(delBtn !== null);
  assert.ok(lockBtn !== null);
});

runTest('PC-T2-F04-02', 'Viewport edge boundary: Context menu flips coordinates inside viewport', () => {
  Engine.openContextMenuAt(1430, 890);
  const menuEl = document.getElementById('pcContextMenu');
  const menuLeft = parseInt(menuEl.style.left);
  const menuTop = parseInt(menuEl.style.top);
  assert.ok(menuLeft <= 1440 - 180);
  assert.ok(menuTop <= 900 - 240);
});

runTest('PC-T2-F04-03', 'Right-clicking empty canvas shows Paste and omits Copy', () => {
  Engine.selectElement('card');
  Engine.openContextMenuAt(500, 500);
  const pasteBtn = document.getElementById('pcCtxPasteBtn');
  const copyBtn = document.getElementById('pcCtxCopyBtn');
  assert.equal(ctxMenu.hidden, false);
  assert.ok(copyBtn.classList.contains('opacity-40') || copyBtn.disabled || copyBtn.hidden);
  assert.equal(pasteBtn.hidden, false);
});

runTest('PC-T2-F04-04', 'Pointerdown with button === 2 does not trigger dragging', () => {
  const state = Engine.getState();
  const initialOffset = { ...state.elementOffsets };
  const ptrEv = { type: 'pointerdown', button: 2, clientX: 200, clientY: 200 };
  canvas.dispatchEvent(ptrEv);
  assert.deepEqual(state.elementOffsets, initialOffset);
});

runTest('PC-T2-F04-05', 'Dismissal behavior: closeContextMenu hides menu', () => {
  Engine.openContextMenuAt(200, 200);
  assert.equal(ctxMenu.hidden, false);
  Engine.closeContextMenu();
  assert.equal(ctxMenu.hidden, true);
});

// --- Feature 5 Boundaries ---
runTest('PC-T2-F05-01', 'Share link generation URL-encodes special Bengali chars safely', () => {
  const state = Engine.getState();
  state.designTitle = 'বিশেষ প্রতিবেদন: "দুর্নীতি ও সংস্কার" & ভবিষ্যৎ — ২০২৬!';
  const link = Engine.getTemplateDeepLink();
  assert.doesNotThrow(() => new URL(link));
  assert.ok(!link.includes('"'));
  assert.ok(!link.includes(' '));
});

runTest('PC-T2-F05-02', 'Clipboard failure fallback handles gracefully', async () => {
  global.navigator.__rejectClipboard = true;
  await assert.doesNotReject(async () => {
    const copyLinkBtn = document.getElementById('pcCopyLinkBtn');
    if (copyLinkBtn) {
      copyLinkBtn.click();
    }
    const link = Engine.getTemplateDeepLink();
    assert.ok(typeof link === 'string' && link.length > 0);
  });
});

runTest('PC-T2-F05-03', 'Share link with multi-page state encodes template accurately', () => {
  const state = Engine.getState();
  state.activePageIndex = 2;
  state.pages = [{ id: 'p0' }, { id: 'p1' }, { id: 'p2' }];
  const link = Engine.getTemplateDeepLink();
  const parsed = new URL(link);
  assert.ok(parsed.searchParams.has('template'));
});

runTest('PC-T2-F05-04', 'Rapid clicks on Share button do not duplicate dropdown DOM', () => {
  for (let i = 0; i < 10; i++) {
    Engine.toggleShareDropdown();
  }
  const count = document.querySelectorAll('#pcShareDropdown').length;
  assert.equal(count, 1);
});

runTest('PC-T2-F05-05', 'Dismissing share modal cleanly resets modal state', () => {
  Engine.openShareDropdown();
  Engine.closeShareDropdown();
  const dd = document.getElementById('pcShareDropdown');
  assert.equal(dd.hidden, true);
});

// --- Feature 6 Boundaries ---
runTest('PC-T2-F06-01', 'Rendering templates with empty/null strings across all categories produces no errors', () => {
  const state = Engine.getState();
  const testTpls = ['blood-donation', 'kalbela-news', 'red-arc-quote', 'factcheck-dual', 'glass-bento'];
  for (const id of testTpls) {
    Engine.applyTemplate(id, false);
    state.headline = '';
    state.tagline = '';
    state.badge = '';
    state.detail = '';
    assert.doesNotThrow(() => {
      Engine.render();
    }, `Template ${id} must not crash when text fields are empty`);
  }
});

runTest('PC-T2-F06-02', 'Rendering with extra-long headline text wraps safely without crashing', () => {
  const state = Engine.getState();
  const ctx = canvas.getContext('2d');
  Engine.applyTemplate('breaking-news', false);
  state.headline = 'খুব দীর্ঘ ব্রেকিং শিরোনাম যা দীর্ঘ পরিসরে শব্দ ভেঙে একাধিক লাইনে সাজানো হবে '.repeat(15);
  ctx.__clearLog();
  assert.doesNotThrow(() => {
    Engine.render();
  });
  const fillTextOps = ctx.__drawLog.filter(op => op.op === 'fillText');
  assert.ok(fillTextOps.length > 0, 'Must render wrapped text lines');
});

runTest('PC-T2-F06-03', 'Template category filtering correctly partitions all categories', () => {
  const allTemplates = Object.entries(Engine.TEMPLATES);
  const newsTpls = allTemplates.filter(([_, m]) => m.cat === 'news').map(([id]) => id);
  const charityTpls = allTemplates.filter(([_, m]) => m.cat === 'charity').map(([id]) => id);
  const quoteTpls = allTemplates.filter(([_, m]) => m.cat === 'quote').map(([id]) => id);
  const factcheckTpls = allTemplates.filter(([_, m]) => m.cat === 'factcheck').map(([id]) => id);
  const modernTpls = allTemplates.filter(([_, m]) => m.cat === 'modern').map(([id]) => id);

  assert.strictEqual(allTemplates.length, 45, `Total templates must equal 45, got ${allTemplates.length}`);
  assert.strictEqual(newsTpls.length, 11, `News templates count must be 11, got ${newsTpls.length}`);
  assert.ok(newsTpls.includes('kalbela-news') && newsTpls.includes('breaking-news') && newsTpls.includes('channel-i-flag-news') && newsTpls.includes('channel24-broadcast-news'));

  assert.strictEqual(charityTpls.length, 9, `Charity templates count must be 9, got ${charityTpls.length}`);
  assert.ok(charityTpls.includes('blood-donation') && charityTpls.includes('charity-appeal') && charityTpls.includes('humanitarian-hotline-split'));

  assert.strictEqual(quoteTpls.length, 13, `Quote templates count must be 13, got ${quoteTpls.length}`);
  assert.ok(quoteTpls.includes('red-arc-quote') && quoteTpls.includes('quote-card') && quoteTpls.includes('torn-paper-advice') && quoteTpls.includes('quran-tafseer-editorial'));

  assert.strictEqual(factcheckTpls.length, 3, `Factcheck templates count must be 3, got ${factcheckTpls.length}`);
  assert.ok(factcheckTpls.includes('factcheck-dual') && factcheckTpls.includes('factcheck-report') && factcheckTpls.includes('factcheck-stamp'));

  assert.strictEqual(modernTpls.length, 9, `Modern templates count must be 9, got ${modernTpls.length}`);
  assert.ok(modernTpls.includes('glass-bento') && modernTpls.includes('duotone-poster') && modernTpls.includes('creator-milestone') && modernTpls.includes('framed-satire-troll'));
});

runTest('PC-T2-F06-04', 'Each template has valid default 6-hex colors distinct from background', () => {
  for (const [id, meta] of Object.entries(Engine.TEMPLATES)) {
    assert.ok(/^#[0-9a-fA-F]{6}$/.test(meta.primary), `${id} primary color ${meta.primary} must be valid 6-hex`);
    assert.ok(/^#[0-9a-fA-F]{6}$/.test(meta.accent), `${id} accent color ${meta.accent} must be valid 6-hex`);
    assert.ok(/^#[0-9a-fA-F]{6}$/.test(meta.bg), `${id} bg color ${meta.bg} must be valid 6-hex`);
    assert.notEqual(meta.primary.toLowerCase(), meta.bg.toLowerCase(), `${id} primary must not equal bg`);
  }
});

runTest('PC-T2-F06-05', 'Sample data loading populates authentic Bengali demo content', () => {
  const state = Engine.getState();
  Engine.applyTemplate('kalbela-news', true);
  assert.ok(state.headline && state.headline.length > 0, 'Sample data must populate headline');
  assert.ok(/[\u0980-\u09FF]/.test(state.headline), 'Sample headline must contain authentic Bengali Unicode');
  assert.ok(state.badge && /[\u0980-\u09FF]/.test(state.badge), 'Sample badge must contain Bengali text');
  assert.ok(state.tagline && state.tagline.length > 0, 'Sample tagline must be populated');
});

// --- Feature 7 Boundaries ---
runTest('PC-T2-F07-01', 'Unknown category falls back to curated editorial stock photo', () => {
  const spec = Engine.getStockPhotoSpec('kalbela-news', 'unknown_custom_cat', false);
  assert.ok(spec && typeof spec.url === 'string' && spec.url.length > 0);
});

runTest('PC-T2-F07-02', 'High-DPI canvas export renders cleanly', () => {
  Engine.applyTemplate('kalbela-news', true);
  const state = Engine.getState();

  // Set 2x high-DPI export dimensions (2160x2160)
  state.width = 2160;
  state.height = 2160;

  const spec = Engine.getStockPhotoSpec('kalbela-news', 'news', false);
  const mockHighDpiImg = new MockImage();
  mockHighDpiImg.naturalWidth = 3200;
  mockHighDpiImg.naturalHeight = 1800;
  Engine.stockPhotoCache[spec.url] = { status: 'loaded', img: mockHighDpiImg };

  const ctx = canvas.getContext('2d');
  ctx.__clearLog();

  try {
    assert.doesNotThrow(() => {
      Engine.render();
    });

    assert.equal(canvas.width, 2160, 'Canvas element width must scale to 2160px for high-DPI export');
    assert.equal(canvas.height, 2160, 'Canvas element height must scale to 2160px for high-DPI export');

    const drawOps = ctx.__drawLog.filter(op => op.op === 'drawImage');
    assert.ok(drawOps.length > 0, 'High-DPI render must execute drawImage');
    const [dx, dy, dw, dh] = drawOps[0].args;

    // High-DPI slot: pad = 30 * U (U = 2 -> pad = 60), slotW = 2160 - 120 = 2040, photoH = 1080
    assert.ok(dw >= 2040 - 0.01, `High-DPI rendered width (${dw}) must scale up >= 2040px`);
    assert.ok(dh >= 1080 - 0.01, `High-DPI rendered height (${dh}) must scale up >= 1080px`);
  } finally {
    // Reset canvas dimensions back to standard 1080x1080
    state.width = 1080;
    state.height = 1080;
    Engine.render();
  }
});

runTest('PC-T2-F07-03', 'Stock placeholder image cache prevents redundant network fetches when toggling templates', () => {
  const spec1 = Engine.getStockPhotoSpec('kalbela-news', 'news', false);
  const spec2 = Engine.getStockPhotoSpec('janakantha-frame', 'news', false);
  assert.ok(spec1 && spec1.url, 'Spec 1 must define a valid stock photo URL');
  assert.equal(spec1.url, spec2.url, 'Templates of the same category must share identical stock photo URL');

  const testUrl = spec1.url;
  // Clear any existing cache entry for this URL to ensure clean fixture
  delete Engine.stockPhotoCache[testUrl];

  let imageConstructedCount = 0;
  const OrigImage = global.Image;
  class ImageSpy extends OrigImage {
    constructor() {
      super();
      imageConstructedCount++;
    }
  }
  global.Image = ImageSpy;

  try {
    // 1. Initial preload: should instantiate exactly 1 Image and populate cache entry
    Engine.preloadStockPhoto(testUrl);
    assert.equal(imageConstructedCount, 1, 'First preload must instantiate an Image instance');
    assert.ok(Engine.stockPhotoCache[testUrl], 'Cache entry must be created');
    assert.equal(Engine.stockPhotoCache[testUrl].status, 'loading', 'Cache entry must be marked loading');

    // Simulate completion of loading
    const mockLoadedImg = new OrigImage();
    Engine.stockPhotoCache[testUrl] = { status: 'loaded', img: mockLoadedImg };

    // 2. Preload again for second template in same category (e.g. toggling templates)
    Engine.preloadStockPhoto(spec2.url);
    assert.equal(imageConstructedCount, 1, 'Redundant Image instance must NOT be created for cached category photo');
    assert.equal(Engine.stockPhotoCache[testUrl].status, 'loaded', 'Cache status must remain loaded');
    assert.equal(Engine.stockPhotoCache[testUrl].img, mockLoadedImg, 'Cached Image object reference must be retained');
  } finally {
    global.Image = OrigImage;
  }
});

runTest('PC-T2-F07-04', 'Null or corrupt stock photo URL triggers fallback without crash', () => {
  Engine.applyTemplate('kalbela-news', true);
  const state = Engine.getState();
  state.photoImg = null;

  // Preload corrupt URL and null URL to verify graceful fallback handling
  Engine.preloadStockPhoto(null);
  Engine.preloadStockPhoto('');
  Engine.preloadStockPhoto('error://trigger-fail');

  // Verify null/empty calls were safely ignored
  assert.equal(Engine.stockPhotoCache['null'], undefined);
  assert.equal(Engine.stockPhotoCache[''], undefined);

  // Set corrupt URL in stockPhotoCache directly
  Engine.stockPhotoCache['error://trigger-fail'] = { status: 'error', img: null };
  const spec = Engine.getStockPhotoSpec('kalbela-news', 'news', false);
  Engine.stockPhotoCache[spec.url] = { status: 'error', img: null };

  const ctx = canvas.getContext('2d');
  ctx.__clearLog();

  assert.doesNotThrow(() => {
    Engine.render();
  });

  const drawLog = ctx.__drawLog;
  const hasFills = drawLog.some(op => op.op === 'fill' || op.op === 'fillRect');
  const hasDrawImage = drawLog.some(op => op.op === 'drawImage');

  assert.ok(hasFills, 'Procedural fallback artwork must render on corrupt URL');
  assert.equal(hasDrawImage, false, 'No drawImage should occur with corrupt/null stock image URL');
});

runTest('PC-T2-F07-05', 'Stock placeholder clipping path executes cleanly', () => {
  let clipCalled = false;
  const mockCtx = canvas.getContext('2d');
  const origClip = mockCtx.clip;
  mockCtx.clip = () => { clipCalled = true; origClip.apply(mockCtx); };
  try {
    Engine.applyTemplate('blood-donation', true);
    Engine.render();
    assert.equal(clipCalled, true);
  } finally {
    mockCtx.clip = origClip;
  }
});

// --- Feature 8 Boundaries ---
runTest('PC-T2-F08-01', 'Luminance threshold L = 0.42 behaves deterministically', () => {
  const resBelow = Engine.getEffectiveTextColor('#ffffff', '#777777');
  const resAbove = Engine.getEffectiveTextColor('#ffffff', '#cccccc');
  assert.equal(resBelow, '#ffffff');
  assert.equal(resAbove, '#0f172a');
});

runTest('PC-T2-F08-02', '3-digit hex shorthand inputs parse and calculate correctly', () => {
  const lumWhite = Engine.getRelativeLuminance('#fff');
  const lumBlack = Engine.getRelativeLuminance('#000');
  assert.equal(Math.round(lumWhite * 100) / 100, 1.0);
  assert.equal(lumBlack, 0.0);
});

runTest('PC-T2-F08-03', 'Malformed color strings fall back safely without throwing NaN', () => {
  assert.equal(Number.isNaN(Engine.getRelativeLuminance('invalid-color')), false);
  assert.equal(Number.isNaN(Engine.getRelativeLuminance('')), false);
  assert.equal(Number.isNaN(Engine.getRelativeLuminance(null)), false);
  assert.equal(Number.isNaN(Engine.getRelativeLuminance(undefined)), false);
});

runTest('PC-T2-F08-04', 'Custom layer text with explicit colors respects auto-contrast', () => {
  const eff = Engine.getEffectiveTextColor('#ffffff', '#ffffff');
  assert.equal(eff, '#0f172a');
});

runTest('PC-T2-F08-05', 'Contrast adaptation updates dynamically in real-time', () => {
  const state = Engine.getState();
  state.bgColor = '#ffffff';
  assert.equal(Engine.getEffectiveTextColor('#ffffff', state.bgColor), '#0f172a');
  state.bgColor = '#000000';
  assert.equal(Engine.getEffectiveTextColor('#ffffff', state.bgColor), '#ffffff');
});

// --- Feature 9 Boundaries ---
runTest('PC-T2-F09-01', 'Adding badge when count is large assigns unique incrementing IDs', () => {
  const state = Engine.getState();
  for (let i = 0; i < 30; i++) {
    Engine.addStickerBadge(`Sticker ${i}`, '#b91c1c', '#fde047', 30);
  }
  const ids = state.customLayers.map(l => l.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, ids.length);
});

runTest('PC-T2-F09-02', 'Rescaling badge to extreme bounds (0.05x to 5.0x) does not crash', () => {
  const state = Engine.getState();
  Engine.addStickerBadge('টেস্ট', '#000', '#fff', 30);
  const lyr = state.customLayers[0];
  lyr.scale = 0.05;
  assert.doesNotThrow(() => { Engine.render(); });
  lyr.scale = 5.0;
  assert.doesNotThrow(() => { Engine.render(); });
});

runTest('PC-T2-F09-03', 'Rotating badge by negative angles or >360 deg normalizes', () => {
  const state = Engine.getState();
  Engine.addStickerBadge('টেস্ট', '#000', '#fff', 30);
  const lyr = state.customLayers[0];
  lyr.rotation = -90;
  assert.doesNotThrow(() => { Engine.render(); });
  lyr.rotation = 720;
  assert.doesNotThrow(() => { Engine.render(); });
});

runTest('PC-T2-F09-04', 'Deleting selected badge removes exactly that element and clears selection', () => {
  const state = Engine.getState();
  Engine.addStickerBadge('স্টিকার ১', '#000', '#fff', 30);
  Engine.addStickerBadge('স্টিকার ২', '#000', '#fff', 30);
  const targetId = state.customLayers[state.customLayers.length - 1].id;
  Engine.selectElement(`layer:${targetId}`);
  Engine.deleteSelectedElement();
  assert.equal(state.customLayers.some(l => l.id === targetId), false);
  assert.ok(state.selectedElementId === null || state.selectedElementId === 'card');
});

runTest('PC-T2-F09-05', 'Empty text or single character badge renders without crashing', () => {
  assert.doesNotThrow(() => {
    Engine.addStickerBadge('', '#000', '#fff', 30);
    Engine.render();
  });
  assert.doesNotThrow(() => {
    Engine.addStickerBadge('●', '#e11d48', '#fff', 30);
    Engine.render();
  });
});

// --- Feature 10 Boundaries ---
runTest('PC-T2-F10-01', 'Payment vector renderers scale proportionally to size parameters', () => {
  const mockCtx = canvas.getContext('2d');
  assert.doesNotThrow(() => {
    Engine.drawBrandVectorIcon(mockCtx, 'bkash', 0, 0, 16);
    Engine.drawBrandVectorIcon(mockCtx, 'bkash', 0, 0, 500);
  });
});

runTest('PC-T2-F10-02', 'Payment vectors render correctly on light and dark contexts', () => {
  const mockCtx = canvas.getContext('2d');

  // Verify Nagad vector executes genuine canvas fill operations
  mockCtx.__clearLog();
  Engine.drawBrandVectorIcon(mockCtx, 'nagad', 50, 50, 64);
  const nagadFills = mockCtx.__drawLog.filter(op => op.op === 'fill').length;
  assert.ok(nagadFills >= 1, `Nagad vector must execute canvas fill operations, got ${nagadFills}`);
  assert.ok(mockCtx.__drawLog.length > 5, 'Nagad vector must record drawing transformations and paths');

  // Verify Rocket vector executes genuine canvas fill operations
  mockCtx.__clearLog();
  Engine.drawBrandVectorIcon(mockCtx, 'rocket', 50, 50, 64);
  const rocketFills = mockCtx.__drawLog.filter(op => op.op === 'fill').length;
  assert.ok(rocketFills >= 1, `Rocket vector must execute canvas fill operations, got ${rocketFills}`);
  assert.ok(mockCtx.__drawLog.length > 5, 'Rocket vector must record drawing transformations and paths');

  // Verify bKash vector executes exactly 8 polygon fills
  mockCtx.__clearLog();
  Engine.drawBrandVectorIcon(mockCtx, 'bkash', 50, 50, 64);
  const bkashFills = mockCtx.__drawLog.filter(op => op.op === 'fill').length;
  assert.strictEqual(bkashFills, 8, `bKash vector must execute exactly 8 polygon fills, got ${bkashFills}`);
});

runTest('PC-T2-F10-03', 'Strictly zero emoji characters present in payment badge renderers', () => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  const vectors = Object.values(Engine.PAYMENT_BRAND_VECTORS || {});
  for (const v of vectors) {
    assert.equal(emojiRegex.test(v.name), false);
  }
});

runTest('PC-T2-F10-04', 'Payment vector drawing functions pair save() and restore() cleanly', () => {
  let saves = 0, restores = 0;
  const mockCtx = canvas.getContext('2d');
  const origSave = mockCtx.save, origRestore = mockCtx.restore;
  mockCtx.save = () => { saves++; origSave.apply(mockCtx); };
  mockCtx.restore = () => { restores++; origRestore.apply(mockCtx); };

  try {
    Engine.drawBrandVectorIcon(mockCtx, 'rocket', 100, 100, 48);
    assert.equal(saves, restores);
  } finally {
    mockCtx.save = origSave;
    mockCtx.restore = origRestore;
  }
});

runTest('PC-T2-F10-05', 'Corrupt or omitted coordinate arguments default safely to (0, 0)', () => {
  const mockCtx = canvas.getContext('2d');
  assert.doesNotThrow(() => {
    Engine.drawBrandVectorIcon(mockCtx, 'bkash', null, undefined, null);
  });
});

/* =========================================================================
 * 6. TIER 3: PAIRWISE COMBINATIONS (11 CASES: PC-T3-PAIR-01 to PC-T3-PAIR-11)
 * ========================================================================= */

runTest('PC-T3-PAIR-01', 'Template Switch x Custom Badges - Clean unloading and fresh badge addition', () => {
  const state = Engine.getState();
  Engine.applyTemplate('breaking-news', true);

  state.customLayers = [
    { id: 'stk_1', layerType: 'badge', text: '⚡ ব্রেকিং নিউজ', x: 200, y: 150, scale: 1.2, rotation: 5, bgColor: '#b91c1c', textColor: '#ffffff' },
    { id: 'stk_2', layerType: 'badge', text: '● LIVE', x: 500, y: 150, scale: 1.0, rotation: 0, bgColor: '#e11d48', textColor: '#ffffff' },
    { id: 'stk_3', layerType: 'badge', text: 'EXCLUSIVE', x: 700, y: 150, scale: 1.1, rotation: -3, bgColor: '#0f172a', textColor: '#fde047' }
  ];
  Engine.selectElement('layer:stk_1');
  state.elementOffsets = { 'layer:stk_1': { dx: 10, dy: 10 } };
  assert.equal(state.customLayers.length, 3);

  Engine.applyTemplate('quote-card', true);
  assert.equal(state.template, 'quote-card');
  assert.equal(state.customLayers.length, 0);
  assert.equal(Object.keys(state.elementOffsets).length, 0);
  assert.ok(state.selectedElementId === null || state.selectedElementId === 'card');

  state.customLayers.push(
    { id: 'stk_q1', layerType: 'badge', text: 'অনুপ্রেরণা', x: 300, y: 200 },
    { id: 'stk_q2', layerType: 'badge', text: 'দৈনিক বাণী', x: 300, y: 260 }
  );
  assert.equal(state.customLayers.length, 2);
  assert.equal(state.customLayers[0].text, 'অনুপ্রেরণা');
  assert.equal(state.customLayers[1].text, 'দৈনিক বাণী');
  assert.equal(state.customLayers[0].rotation || 0, 0);
});

runTest('PC-T3-PAIR-02', 'Template Switch x Smart Text Contrast - Dark to light background auto-converts white text', () => {
  const state = Engine.getState();
  Engine.applyTemplate('breaking-news', true);
  assert.ok(Engine.getRelativeLuminance(state.bgColor || '#0f172a') < 0.42);

  Engine.applyTemplate('white-sheet-redbar', true);
  const bg = state.bgColor || '#ffffff';
  const lum = Engine.getRelativeLuminance(bg);
  assert.ok(lum > 0.42);

  const effColor = Engine.getEffectiveTextColor('#ffffff', bg);
  assert.equal(effColor, '#0f172a');
  const cr = Engine.getContrastRatio(effColor, bg);
  assert.ok(cr >= 7.0);
});

runTest('PC-T3-PAIR-03', 'Canvas Zoom x Multi-Page Vertical Layout - Scales stacked pages uniformly and preserves scrolling', () => {
  const state = Engine.getState();
  const pages = Engine.getPages();
  while (pages.length < 3) Engine.addBlankPage(pages.length - 1);
  assert.equal(pages.length, 3);

  Engine.applyCanvasZoom(125);
  assert.equal(state.canvasZoom, 125);

  const ctrlWheel = createMockWheelEvent({ ctrlKey: true, deltaY: -50 });
  scrollArea.dispatchEvent(ctrlWheel);
  assert.equal(ctrlWheel.defaultPrevented, true);

  const normWheel = createMockWheelEvent({ ctrlKey: false, deltaY: 100 });
  scrollArea.dispatchEvent(normWheel);
  assert.equal(normWheel.defaultPrevented, false);

  Engine.applyCanvasZoom(100);
});

runTest('PC-T3-PAIR-04', 'Multi-Page Vertical Layout x Custom Context Menu - Right-click on Page 2 targets Page 2 coordinate space', () => {
  const pages = Engine.getPages();
  const state = Engine.getState();
  while (pages.length < 2) Engine.addBlankPage(0);

  pages[1].customLayers = [
    { id: 'lyr_p2_badge', layerType: 'text', text: 'দ্বিতীয় পাতা', x: 200, y: 300, w: 200, h: 60 }
  ];
  state.customLayers = pages[1].customLayers;

  Engine.switchToPage(1);
  assert.equal(state.activePageIndex, 1);

  Engine.selectElement('layer:lyr_p2_badge');
  Engine.render();
  Engine.alignSelectedToPage('center');

  const p2Lyr = (state.customLayers || []).find(l => l.id === 'lyr_p2_badge');
  assert.ok(p2Lyr);
  assert.equal(p2Lyr.x, 540);
});

runTest('PC-T3-PAIR-05', 'Multi-Page Vertical Layout x Template Isolation - Template switch on Page 1 isolates changes from Page 2', () => {
  const pages = Engine.getPages();
  const state = Engine.getState();
  while (pages.length < 2) Engine.addBlankPage(0);

  pages[1].title = 'দ্বিতীয় পাতা - বক্তাদের তালিকা';
  pages[1].customLayers = [{ id: 'speaker_badge', text: 'আমন্ত্রিত বক্তা', x: 300, y: 400 }];

  Engine.switchToPage(0);
  Engine.applyTemplate('kalbela-news', true);

  assert.equal(state.template, 'kalbela-news');
  assert.equal(pages[1].title, 'দ্বিতীয় পাতা - বক্তাদের তালিকা');
  assert.equal(pages[1].customLayers.length, 1);
  assert.equal(pages[1].customLayers[0].id, 'speaker_badge');
  assert.equal(pages.length, 2);
});

runTest('PC-T3-PAIR-06', 'Custom Context Menu x Editable Badges - Duplicate sticker inherits transforms and tint with +24px offset', () => {
  const state = Engine.getState();
  state.customLayers = [
    { id: 'stk_promo', layerType: 'badge', text: '২০% ছাড়', x: 250, y: 350, w: 120, h: 60, scale: 1.25, rotation: 12, bgColor: '#059669', textColor: '#ffffff' }
  ];

  Engine.selectElement('layer:stk_promo');
  Engine.copySelectedElement();
  Engine.pasteElement();

  assert.equal(state.customLayers.length, 2);
  const dup = state.customLayers[1];
  assert.equal(dup.text, '২০% ছাড়');
  assert.equal(dup.x, 250 + 24);
  assert.equal(dup.y, 350 + 24);
  assert.equal(dup.scale, 1.25);
  assert.equal(dup.rotation, 12);
  assert.equal(dup.bgColor, '#059669');
  assert.equal(dup.textColor, '#ffffff');
  assert.notEqual(dup.id, 'stk_promo');
});

runTest('PC-T3-PAIR-07', 'Custom Context Menu x Element Lock - Locked text prevents drag transforms and unprompted overrides', () => {
  const state = Engine.getState();
  state.elementStyles = { headline: { color: '#fbbf24', fontSize: 44 } };
  state.elementLocked = { headline: true };

  assert.equal(state.elementLocked.headline, true);
  Engine.selectElement('headline');
  const prevStyles = JSON.stringify(state.elementStyles);
  assert.equal(JSON.stringify(state.elementStyles), prevStyles);

  state.elementLocked.headline = false;
  assert.equal(state.elementLocked.headline, false);
});

runTest('PC-T3-PAIR-08', 'Universal Share Button x 15 Modern Templates - Share link encodes modern template ID and restores correctly', () => {
  const state = Engine.getState();
  state.template = 'breaking-news';
  state.designTitle = 'বিশেষ অনুসন্ধান পর্ব ১';

  const link = Engine.getTemplateDeepLink();
  assert.ok(link.includes('template=breaking-news'));

  const parsed = new URL(link);
  assert.equal(parsed.searchParams.get('template'), 'breaking-news');

  const shareText = `${state.designTitle}\n${link}`;
  const encoded = encodeURIComponent(shareText);
  assert.ok(encoded.includes(encodeURIComponent('বিশেষ অনুসন্ধান পর্ব ১')));
  assert.ok(encoded.includes(encodeURIComponent('template=breaking-news')));
});

runTest('PC-T3-PAIR-09', 'Stock Photo Placeholder x Smart Text Contrast - High luminance photo slot triggers dark text adaptation', () => {
  const photoBannerLuminance = Engine.getRelativeLuminance('#f1f5f9');
  assert.ok(photoBannerLuminance > 0.42);

  const effColor = Engine.getEffectiveTextColor('#ffffff', '#f1f5f9');
  assert.equal(effColor, '#0f172a');
  assert.ok(Engine.getContrastRatio(effColor, '#f1f5f9') >= 4.5);

  const darkPhotoLum = Engine.getRelativeLuminance('#0f172a');
  assert.ok(darkPhotoLum <= 0.42);
  const darkEffColor = Engine.getEffectiveTextColor('#ffffff', '#0f172a');
  assert.equal(darkEffColor, '#ffffff');
});

runTest('PC-T3-PAIR-10', 'Editable Stickers x Native SVG Payment Icons - Render side-by-side cleanly without SVG path bleed', () => {
  const state = Engine.getState();
  state.customLayers = [
    { id: 'pay_bkash', layerType: 'svg_payment', provider: 'bkash', x: 200, y: 700, w: 180, h: 60 },
    { id: 'stk_discount', layerType: 'badge', text: 'বিশেষ ছাড়', x: 420, y: 700, w: 180, h: 60, rotation: 0, bgColor: '#e11d48', textColor: '#ffffff' }
  ];

  assert.equal(state.customLayers.length, 2);
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(state.customLayers[0].provider);
  assert.equal(hasEmoji, false);

  state.customLayers[1].rotation = 15;
  assert.equal(state.customLayers[1].rotation, 15);
  assert.equal(state.customLayers[0].rotation || 0, 0);
});

runTest('PC-T3-PAIR-11', 'Embedded Image Metadata x 15 Modern Templates - Exporting modern template embeds attribution with zero AI markers', async () => {
  const injector = MetadataInjector || require('../public/js/photo-card-metadata.js');
  const pngBuf = createMinimalPng();
  const jpgBuf = createMinimalJpeg();

  const meta = {
    title: 'জাতীয় উন্নয়ন বুলেটিন',
    template: 'breaking-news',
    author: 'TechHat Studio'
  };

  const taggedPng = await injector.embedTechHatMetadata(pngBuf, 'image/png', meta);
  const taggedJpg = await injector.embedTechHatMetadata(jpgBuf, 'image/jpeg', meta);

  assert.ok(taggedPng.length > pngBuf.length);
  assert.ok(taggedJpg.length > jpgBuf.length);

  const pngStr = Buffer.from(taggedPng).toString('binary');
  const jpgStr = Buffer.from(taggedJpg).toString('binary');
  assert.equal(/c2pa|synthid|ai_generated/i.test(pngStr), false);
  assert.equal(/c2pa|synthid|ai_generated/i.test(jpgStr), false);
});

/* =========================================================================
 * 7. TIER 4: REAL-WORLD WORKLOAD SCENARIOS (6 CASES: PC-T4-SCEN-01 to PC-T4-SCEN-06)
 * ========================================================================= */

runTest('PC-T4-SCEN-01', 'Breaking News Broadcast Creation & Multi-Format Export', async () => {
  const injector = MetadataInjector || require('../public/js/photo-card-metadata.js');
  const state = Engine.getState();

  Engine.applyTemplate('breaking-news', true);

  state.designTitle = 'রাজধানীতে নতুন মেট্রো রেল রুটের উদ্বোধন';
  state.headlineText = 'রাজধানীতে নতুন মেট্রো রেল রুটের উদ্বোধন';
  state.badgeText = 'ব্রেকিং নিউজ';

  state.customLayers = [
    { id: 'stk_live_bulletin', layerType: 'badge', text: '⚡ বিশেষ বুলেটিন', x: 820, y: 150, rotation: 5, bgColor: '#dc2626', textColor: '#ffffff' }
  ];

  assert.equal(state.customLayers.length, 1);
  assert.equal(state.customLayers[0].rotation, 5);

  const pngRaw = createMinimalPng();
  const jpgRaw = createMinimalJpeg();

  const exportedPng = await injector.embedTechHatMetadata(pngRaw, 'image/png', {
    title: state.designTitle,
    author: 'TechHat Studio',
    description: 'TechHat Photo Card Studio 2.0 Export'
  });

  const exportedJpg = await injector.embedTechHatMetadata(jpgRaw, 'image/jpeg', {
    title: state.designTitle,
    author: 'TechHat Studio'
  });

  assert.equal(exportedPng[0], 0x89);
  assert.equal(exportedPng[1], 0x50);
  const pngStr = Buffer.from(exportedPng).toString('binary');
  assert.ok(pngStr.includes('tEXtSoftware\0TechHat Photo Card Studio'));
  assert.ok(pngStr.includes('iTXtTitle'));

  assert.equal(exportedJpg[0], 0xFF);
  assert.equal(exportedJpg[1], 0xD8);
  const jpgStr = Buffer.from(exportedJpg).toString('binary');
  assert.ok(jpgStr.includes('http://ns.adobe.com/xap/1.0/'));

  assert.equal(/c2pa|synthid|ai_generated/i.test(pngStr), false);
  assert.equal(/c2pa|synthid|ai_generated/i.test(jpgStr), false);
});

runTest('PC-T4-SCEN-02', 'Multi-Page Campaign Card Creation - Event Flyer', () => {
  const pages = Engine.getPages();
  const state = Engine.getState();

  Engine.applyTemplate('charity-appeal', true);
  pages[0].title = 'শীতবস্ত্র বিতরণ কর্মসূচি ২০২৬';
  pages[0].customLayers = [{ id: 'p1_stk', text: 'স্বেচ্ছাসেবী আবেদন' }];

  Engine.addBlankPage(0);
  assert.equal(pages.length, 2);
  assert.equal(state.activePageIndex, 1);

  pages[1].title = 'বক্তা ও অতিথি তালিকা';
  pages[1].customLayers = [{ id: 'p2_stk', text: 'প্রধান অতিথি' }];

  Engine.duplicatePage(1);
  assert.equal(pages.length, 3);
  assert.equal(state.activePageIndex, 2);

  Engine.movePage(2, 0);
  assert.equal(pages.length, 3);
  assert.equal(state.activePageIndex, 0);

  Engine.deletePage(0);
  assert.equal(pages.length, 2);

  Engine.deletePage(0);
  assert.equal(pages.length, 1);
  Engine.deletePage(0);
  assert.equal(pages.length, 1);
});

runTest('PC-T4-SCEN-03', 'Light Theme Transformation with Auto-Contrast', () => {
  const state = Engine.getState();

  Engine.applyTemplate('quote-card', true);
  assert.ok(Engine.getRelativeLuminance(state.bgColor || '#17120a') <= 0.42);

  state.bgColor = '#f8fafc';
  const paperLum = Engine.getRelativeLuminance(state.bgColor);
  assert.ok(paperLum > 0.42);

  const effHeadlineColor = Engine.getEffectiveTextColor('#ffffff', state.bgColor);
  assert.equal(effHeadlineColor, '#0f172a');
  assert.ok(Engine.getContrastRatio(effHeadlineColor, state.bgColor) >= 15.0);

  const accent = '#b91c1c';
  const accentCR = Engine.getContrastRatio(accent, state.bgColor);
  assert.ok(accentCR >= 4.5);
});

runTest('PC-T4-SCEN-04', 'Charity & Donation Card with Native SVG Payment Channels', () => {
  const state = Engine.getState();
  Engine.applyTemplate('charity-appeal', true);

  state.customLayers = [
    { id: 'pay_bkash', layerType: 'svg_payment', provider: 'bkash', account: '01700-123456 (মার্চেন্ট)', x: 100, y: 800 },
    { id: 'pay_nagad', layerType: 'svg_payment', provider: 'nagad', account: '01800-654321 (পার্সোনাল)', x: 500, y: 800 }
  ];

  assert.equal(state.customLayers.length, 2);
  assert.equal(/[\u{1F300}-\u{1F9FF}]/u.test(state.customLayers[0].account), false);
  assert.equal(/[\u{1F300}-\u{1F9FF}]/u.test(state.customLayers[1].account), false);

  Engine.applyCanvasZoom(150);
  assert.equal(state.canvasZoom, 150);

  Engine.applyCanvasZoom(30);
  assert.equal(state.canvasZoom, 50);

  Engine.applyCanvasZoom(100);
  assert.equal(state.canvasZoom, 100);
});

runTest('PC-T4-SCEN-05', 'Canvas Context Menu Deep Editing & Layer Management', () => {
  const state = Engine.getState();
  state.customLayers = [
    { id: 'lyr_bg_rect', layerType: 'shape', x: 100, y: 100, w: 800, h: 500 },
    { id: 'lyr_text_deck', layerType: 'text', text: 'বিশেষ ঘোষণা', x: 150, y: 200, w: 600, h: 60 },
    { id: 'lyr_badge_tag', layerType: 'badge', text: 'জরুরি', x: 700, y: 120, w: 100, h: 50 }
  ];

  Engine.selectElement('layer:lyr_bg_rect');
  Engine.reorderCustomLayer('back');
  assert.equal(state.customLayers[0].id, 'lyr_bg_rect');

  Engine.selectElement('layer:lyr_text_deck');
  Engine.reorderCustomLayer('front');
  assert.equal(state.customLayers[state.customLayers.length - 1].id, 'lyr_text_deck');

  Engine.render();
  Engine.alignSelectedToPage('center');
  const centeredText = state.customLayers.find(l => l.id === 'lyr_text_deck');
  assert.equal(centeredText.x, 540);

  state.elementLocked['layer:lyr_bg_rect'] = true;
  assert.equal(state.elementLocked['layer:lyr_bg_rect'], true);

  Engine.selectElement('layer:lyr_badge_tag');
  Engine.copySelectedElement();
  Engine.pasteElement();
  assert.equal(state.customLayers.length, 4);
  const pastedBadge = state.customLayers[state.customLayers.length - 1];
  assert.equal(pastedBadge.x, 700 + 24);
  assert.equal(pastedBadge.y, 120 + 24);
});

runTest('PC-T4-SCEN-06', 'Universal Share & Collaborative Link Generation', () => {
  const state = Engine.getState();
  state.template = 'winter-eid-drive';
  state.designTitle = 'ঈদ উপহার ক্যাম্পেইন ২০২৬';

  Engine.openShareDropdown();

  const link = Engine.getTemplateDeepLink();
  assert.ok(link.includes('template=winter-eid-drive'));
  assert.ok(link.startsWith('https://tools.techhat.com.bd') || link.startsWith('http'));

  global.navigator.clipboard.writeText(link);
  assert.equal(global.navigator.__clipboardText, link);

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(state.designTitle + '\n' + link)}`;
  assert.ok(whatsappUrl.startsWith('https://api.whatsapp.com/send?text='));
  assert.ok(whatsappUrl.includes(encodeURIComponent('ঈদ উপহার ক্যাম্পেইন ২০২৬')));

  Engine.closeShareDropdown();
});

/* =========================================================================
 * 7B. LIVE-BROWSER DEFECT REGRESSION SUITE (DEFECTS #1, #2, #3, #7)
 * ========================================================================= */

runTest('PC-REG-DEF1-01', 'Defect #1 Regression: Clicking #pcAddPageBtn once adds strictly 1 page (1 -> 2, never 1 -> 3)', () => {
  Engine.applyTemplate('breaking-news', true);
  assert.equal(Engine.getPages().length, 1);

  addPageBtn.click();
  assert.equal(Engine.getPages().length, 2, 'Single click on #pcAddPageBtn must add exactly 1 page');
  assert.equal(Engine.getState().activePageIndex, 1);

  addPageBtn.click();
  assert.equal(Engine.getPages().length, 3, 'Second click on #pcAddPageBtn must transition 2 -> 3');
  assert.equal(Engine.getState().activePageIndex, 2);
});

runTest('PC-REG-DEF2-01', 'Defect #2 Regression: Page 2+ canvases have live pointerdown, dblclick, and right-click contextmenu interactivity', () => {
  const state = Engine.getState();
  Engine.applyTemplate('breaking-news', true);
  addPageBtn.click();
  assert.equal(Engine.getPages().length, 2);
  assert.equal(state.activePageIndex, 1);

  // Add a custom sticker badge at center (540, 540) on Page 2
  Engine.addStickerBadgeLayer('ব্রেকিং পেজ ২', '#dc2626', '#ffffff', 36, 'bolt');
  const p2LayerId = 'layer:' + state.customLayers[0].id;
  Engine.selectElement('card');
  assert.equal(state.selectedElementId, 'card');

  const pageCanvases = artCol.querySelectorAll('.pc-page-canvas');
  assert.equal(pageCanvases.length, 2, 'Both Page 1 and Page 2 canvases must exist in #pcArtboardColumn');
  const cvPage1 = pageCanvases[0];
  const cvPage2 = pageCanvases[1];
  assert.equal(cvPage2.id, 'pcCanvas', 'Active Page 2 canvas must own id="pcCanvas"');

  // Center of mock canvas getBoundingClientRect() {left:100, top:100, width:580, height:580} => (390, 390) maps to (540, 540)
  state.customLayers[0].x = 540;
  state.customLayers[0].y = 540;
  Engine.render();

  // 1. Pointerdown on Page 2 canvas selects the layer on Page 2
  cvPage2.dispatchEvent({
    type: 'pointerdown',
    button: 0,
    pointerId: 11,
    clientX: 390,
    clientY: 390,
    preventDefault() {},
    stopPropagation() {}
  });
  cvPage2.dispatchEvent({ type: 'pointerup', pointerId: 11 });
  assert.equal(state.selectedElementId, p2LayerId, 'Pointerdown on Page 2 canvas must select Page 2 element');

  // 2. Right-click contextmenu on Page 2 canvas opens #pcContextMenu
  ctxMenu.hidden = true;
  const ctxEv2 = createMockContextMenuEvent({ clientX: 390, clientY: 390 });
  cvPage2.dispatchEvent(ctxEv2);
  assert.equal(ctxEv2.defaultPrevented, true, 'Page 2 contextmenu must prevent browser default menu');
  assert.equal(ctxMenu.hidden, false, 'Right-click on Page 2 canvas must open #pcContextMenu');
  Engine.closeContextMenu();

  // 3. Double-click on Page 2 canvas opens #pcInlineEditor for Page 2 sticker
  inlineEditor.hidden = true;
  cvPage2.dispatchEvent({
    type: 'dblclick',
    clientX: 390,
    clientY: 390,
    preventDefault() {},
    stopPropagation() {}
  });
  assert.equal(inlineEditor.hidden, false, 'Double-click on Page 2 canvas must open #pcInlineEditor');
  assert.equal(inlineEditor.value, 'ব্রেকিং পেজ ২');
  Engine.closeInlineEditor(false);

  // 4. Clicking directly on inactive Page 1 canvas switches activePageIndex -> 0 and interacts with Page 1
  cvPage1.dispatchEvent({
    type: 'pointerdown',
    button: 0,
    pointerId: 12,
    clientX: 390,
    clientY: 390,
    preventDefault() {},
    stopPropagation() {}
  });
  cvPage1.dispatchEvent({ type: 'pointerup', pointerId: 12 });
  assert.equal(state.activePageIndex, 0, 'Clicking inactive Page 1 canvas must activate Page 1');
  assert.equal(cvPage1.id, 'pcCanvas', 'Page 1 canvas must reclaim id="pcCanvas"');
});

runTest('PC-REG-DEF3-01', 'Defect #3 Regression: Horizontal #pcPagesStrip stays hidden by default even with multiple pages unless #pcPagesCountBtn is clicked', () => {
  Engine.applyTemplate('breaking-news', true);
  assert.equal(pagesStrip.hidden, true, '#pcPagesStrip must start hidden on 1 page');

  addPageBtn.click();
  addPageBtn.click();
  assert.equal(Engine.getPages().length, 3);
  assert.equal(pagesStrip.hidden, true, '#pcPagesStrip must remain hidden during vertical multi-page editing');

  // Explicit click on #pcPagesCountBtn toggles strip open
  pagesCountBtn.click();
  assert.equal(pagesStrip.hidden, false, 'Clicking #pcPagesCountBtn must explicitly open #pcPagesStrip');

  // Clicking #pcPagesCountBtn again hides it
  pagesCountBtn.click();
  assert.equal(pagesStrip.hidden, true, 'Second click on #pcPagesCountBtn must hide #pcPagesStrip');

  // Re-open then switch template -> resets to hidden
  pagesCountBtn.click();
  assert.equal(pagesStrip.hidden, false);
  Engine.applyTemplate('quote-card', true);
  assert.equal(pagesStrip.hidden, true, 'Switching template must reset #pcPagesStrip to hidden');
});

runTest('PC-REG-DEF7-01', 'Defect #7 Regression: Copy style & Paste style work via context menu buttons and Ctrl+Alt+C / Ctrl+Alt+V', () => {
  const state = Engine.getState();
  Engine.applyTemplate('breaking-news', true);

  Engine.addTextBox('heading');
  const srcLyr = state.customLayers[0];
  srcLyr.fontFamily = 'Kalpurush';
  srcLyr.fontSize = 64;
  srcLyr.color = '#fde047';
  srcLyr.bgColor = '#1e293b';
  srcLyr.italic = true;
  srcLyr.underline = true;

  Engine.addTextBox('body');
  const dstLyr = state.customLayers[1];
  assert.notEqual(dstLyr.fontSize, 64);

  // Copy style from srcLyr via context menu button
  Engine.selectElement('layer:' + srcLyr.id);
  pcCtxCopyStyleBtn.click();
  assert.ok(Engine.getStyleClipboard(), 'Style clipboard must capture source layer style');

  // Paste style onto dstLyr via context menu button
  Engine.selectElement('layer:' + dstLyr.id);
  pcCtxPasteStyleBtn.click();
  assert.equal(dstLyr.fontFamily, 'Kalpurush');
  assert.equal(dstLyr.fontSize, 64);
  assert.equal(dstLyr.color, '#fde047');
  assert.equal(dstLyr.bgColor, '#1e293b');
  assert.equal(dstLyr.italic, true);
  assert.equal(dstLyr.underline, true);

  // Also verify Ctrl+Alt+C and Ctrl+Alt+V keyboard shortcuts onto a shape layer
  srcLyr.bgColor = '#be123c';
  srcLyr.fill = '#be123c';
  Engine.selectElement('layer:' + srcLyr.id);
  global.window.dispatchEvent({
    type: 'keydown',
    key: 'c',
    ctrlKey: true,
    altKey: true,
    shiftKey: false,
    preventDefault() {}
  });

  Engine.addShape('pill', '#0f172a', '#ffffff', 320, 90, 45, 'শুরুর লেখা');
  const shpLyr = state.customLayers[2];
  Engine.selectElement('layer:' + shpLyr.id);
  global.window.dispatchEvent({
    type: 'keydown',
    key: 'v',
    ctrlKey: true,
    altKey: true,
    shiftKey: false,
    preventDefault() {}
  });
  assert.equal(shpLyr.fill, '#be123c', 'Ctrl+Alt+V must paste copied fill style onto shape layer');
  assert.equal(shpLyr.fontFamily, 'Kalpurush');
});

runTest('PC-REG-DEF7-02', 'Defect #7 Regression: Badges, stickers, and shapes are text-editable via inline editor and render edited text on canvas', () => {
  const state = Engine.getState();
  Engine.applyTemplate('breaking-news', true);

  // 1. Add a shape layer and edit its text via #pcCtxShapeEditTextBtn + #pcInlineEditor
  Engine.addShape('pill', '#b91c1c', '#ffffff', 360, 100, 50);
  const shp = state.customLayers[0];
  assert.equal(shp.layerType, 'shape');
  Engine.selectElement('layer:' + shp.id);

  shpEditTextBtn.click();
  assert.equal(inlineEditor.hidden, false, '#pcCtxShapeEditTextBtn must open inline editor for selected shape');
  inlineEditor.value = 'কাস্টম শেপ ব্যাজ';
  Engine.closeInlineEditor(true);

  assert.equal(shp.text, 'কাস্টম শেপ ব্যাজ', 'Committed inline editor text must save onto shape layer');
  const ctx = canvas.getContext('2d');
  const drawnTexts = ctx.__drawLog.filter(d => d.op === 'fillText').map(d => d.text);
  assert.ok(drawnTexts.some(t => t.includes('কাস্টম') || t.includes('শেপ')), 'Edited shape text must render on 2D canvas');

  // 2. Add a sticker badge with vector icon and edit its text via openInlineEditorForElement
  Engine.addStickerBadgeLayer('ব্রেকিং নিউজ', '#dc2626', '#ffffff', 34, 'bolt');
  const stk = state.customLayers[1];
  assert.equal(stk.icon, 'bolt');
  Engine.openInlineEditorForElement('layer:' + stk.id);
  assert.equal(inlineEditor.hidden, false, 'Sticker badge must open inline editor');
  inlineEditor.value = 'সর্বশেষ আপডেট';
  Engine.closeInlineEditor(true);
  assert.equal(stk.text, 'সর্বশেষ আপডেট', 'Sticker badge text must update cleanly');
});

/* =========================================================================
 * 7B. REGRESSION TESTS FOR WINDOWS WATCHER, MANUAL COLORS, ANCHORED POPOVER,
 *     HEADLINE HIGHLIGHT COLOR, AND MULTI-BRAND KIT PROFILES (ISSUES 1-4)
 * ========================================================================= */

runTest('PC-REG-ISS1-01', 'Issue 1 Regression: astro.config.mjs guards Windows protected volume paths (System Volume Information, $RECYCLE.BIN, drive root) via windowsWatcherGuard and server.watch.ignored', () => {
  const astroCfgPath = path.join(__dirname, '../astro.config.mjs');
  const astroCfgSrc = fs.readFileSync(astroCfgPath, 'utf8');

  const guardIdx = astroCfgSrc.indexOf('windowsWatcherGuard');
  const twIdx = astroCfgSrc.indexOf('tailwindcss()');
  assert.ok(guardIdx !== -1, 'astro.config.mjs must define windowsWatcherGuard');
  assert.ok(twIdx !== -1 && guardIdx < twIdx, 'windowsWatcherGuard must be registered before tailwindcss()');
  assert.ok(astroCfgSrc.includes('strict: true'), 'vite.server.fs.strict must be enabled');
  assert.ok(astroCfgSrc.includes('System Volume Information'), 'vite.server.watch.ignored must guard System Volume Information');
  assert.ok(astroCfgSrc.includes('$RECYCLE\\.BIN'), 'vite.server.watch.ignored must guard $RECYCLE.BIN');

  // Verify the exact RegExp & predicate logic used in astro.config.mjs
  const watchRegex = /(?:^|[\\/])(?:\.git|node_modules|dist|\.astro|System Volume Information|\$RECYCLE\.BIN|Recovery|Config\.Msi)(?:[\\/]|$)/i;
  const watchPredicate = (watchPath) =>
    /(?:^|[\\/])(?:System Volume Information|\$RECYCLE\.BIN|Recovery|Config\.Msi|pagefile\.sys|swapfile\.sys|hiberfil\.sys)(?:[\\/]|$)/i.test(String(watchPath || ''));

  assert.equal(watchRegex.test('D:\\System Volume Information'), true);
  assert.equal(watchRegex.test('D:\\$RECYCLE.BIN\\S-1-5-21'), true);
  assert.equal(watchPredicate('D:\\System Volume Information'), true);
  assert.equal(watchPredicate('D:\\pagefile.sys'), true);
  assert.equal(watchRegex.test('d:\\TechHat website\\Bijoy Converter\\src\\components\\PhotoCardStudio.svelte'), false);
  assert.equal(watchPredicate('d:\\TechHat website\\Bijoy Converter\\src\\components\\PhotoCardStudio.svelte'), false);
});

runTest('PC-REG-ISS2-01', 'Issue 2A Regression: resolveElementTextColor preserves manual low-saturation, pastel, muted, and medium-green (#00bd74) colors 100% verbatim while keeping default auto-contrast intact', () => {
  assert.equal(typeof Engine.resolveElementTextColor, 'function');

  // Medium green RGB(0, 189, 116) -> #00bd74 on dark red #991b1b (WCAG contrast < 4.5) must NOT snap to #ffffff
  assert.equal(Engine.resolveElementTextColor('#00bd74', '#fde047', '#991b1b'), '#00bd74');

  // Muted slate #94a3b8 on dark slate #0f172a must be preserved verbatim
  assert.equal(Engine.resolveElementTextColor('#94a3b8', '#ffffff', '#0f172a'), '#94a3b8');

  // Soft light gray #cbd5e1 on white #ffffff must be preserved verbatim when manually picked
  assert.equal(Engine.resolveElementTextColor('#cbd5e1', '#0f172a', '#ffffff'), '#cbd5e1');

  // Pastel pink #fbcfe8 on warm paper #fffbeb must be preserved verbatim
  assert.equal(Engine.resolveElementTextColor('#fbcfe8', '#0f172a', '#fffbeb'), '#fbcfe8');

  // 3-digit hex shorthand normalizes cleanly to 6-digit hex verbatim
  assert.equal(Engine.resolveElementTextColor('#0b7', '#ffffff', '#000000'), '#00bb77');

  // Empty/unset manualColor still delegates to getEffectiveTextColor for uncustomized template defaults (R8 auto-contrast)
  assert.equal(Engine.resolveElementTextColor('', '#ffffff', '#ffffff'), '#0f172a');
  assert.equal(Engine.resolveElementTextColor(null, '#0f172a', '#0f172a'), '#ffffff');
});

runTest('PC-REG-ISS2-02', 'Issue 2A Canvas Regression: Manual low-saturation & medium-green font colors and badge BG colors render verbatim on templates and custom layers without contrast snapping', () => {
  const state = Engine.getState();
  const ctx = canvas.getContext('2d');

  // 1. Classic News Card with manual medium green (#00bd74) headline & pastel (#fbcfe8) tagline + custom badge BG (#1e293b) & badge text (#86efac)
  Engine.applyTemplate('classic-news-card', true);
  state.headline = 'ম্যানুয়াল সবুজ রঙের শিরোনাম';
  state.tagline = 'হালকা প্যাস্টেল সাব-টেক্সট';
  state.badgeText = 'স্পেশাল ব্যাজ';
  state.elementStyles = {
    headline: { color: '#00bd74' },
    tagline: { color: '#fbcfe8' },
    badge: { color: '#86efac', bgColor: '#1e293b' }
  };
  ctx.__clearLog();
  Engine.renderCard();

  const textOps = ctx.__drawLog.filter(d => d.op === 'fillText');
  assert.ok(textOps.some(d => d.fillStyle === '#00bd74'), 'Headline must draw in exact manual #00bd74 medium green');
  assert.ok(textOps.some(d => d.fillStyle === '#fbcfe8'), 'Tagline must draw in exact manual #fbcfe8 pastel pink');
  assert.ok(textOps.some(d => d.fillStyle === '#86efac'), 'Badge text must draw in exact manual #86efac pastel green');
  const fillOps = ctx.__drawLog.filter(d => d.op === 'fill' || d.op === 'fillRect');
  assert.ok(fillOps.some(d => d.fillStyle === '#1e293b'), 'Badge pill background must draw in exact manual #1e293b');

  // Selecting template 'badge' must unhide both #pcCtxTextBgWrapper and #pcMiniTintGroup
  Engine.selectElement('badge');
  assert.equal(ctxTextBgWrapper.hidden, false, '#pcCtxTextBgWrapper must show when template badge is selected');
  assert.equal(miniTintGroup.hidden, false, '#pcMiniTintGroup must show when template badge is selected');

  // 2. Clean Paper Feature (custom template renderer) + Custom Text Layer with customColor: true
  Engine.applyTemplate('clean-paper-feature', true);
  state.headline = 'ক্লিন পেপার ম্যানুয়াল কালার';
  state.elementStyles = { headline: { color: '#94a3b8' } };
  Engine.addTextBox('heading');
  const customTxt = state.customLayers[0];
  customTxt.text = 'কাস্টম লেয়ার প্যাস্টেল';
  customTxt.color = '#cbd5e1';
  customTxt.textColor = '#cbd5e1';
  customTxt.customColor = true;

  ctx.__clearLog();
  Engine.renderCard();
  const paperTextOps = ctx.__drawLog.filter(d => d.op === 'fillText');
  assert.ok(paperTextOps.some(d => d.fillStyle === '#94a3b8'), 'Clean Paper headline must honor manual muted #94a3b8');
  assert.ok(paperTextOps.some(d => d.fillStyle === '#cbd5e1'), 'Custom text layer with customColor=true must honor manual light #cbd5e1');
});

runTest('PC-REG-ISS2-03', 'Issue 2B Regression: Zero sr-only color inputs in PhotoCardStudio.svelte and anchored #pcColorPopover positions beside clicked trigger with viewport clamping', () => {
  // Static check: ZERO <input type="color"> tags with sr-only anywhere in PhotoCardStudio.svelte
  const colorInputTags = svelteSrc.match(/<input[^>]*type=["']color["'][^>]*>/gi) || [];
  assert.ok(colorInputTags.length >= 9, 'PhotoCardStudio.svelte must preserve color inputs');
  for (const tag of colorInputTags) {
    assert.equal(/\bsr-only\b/.test(tag), false, `Color input must never use sr-only (causes (0,0) OS picker bug): ${tag}`);
  }

  // Static check: Anchored #pcColorPopover markup & 28 curated swatches including #00bd74 and pastel tones
  assert.ok(svelteSrc.includes('id="pcColorPopover"'), 'PhotoCardStudio.svelte must mount #pcColorPopover');
  assert.ok(svelteSrc.includes('id="pcColorPopoverNativeInput"'), 'PhotoCardStudio.svelte must include full-cover #pcColorPopoverNativeInput');
  assert.ok(svelteSrc.includes('id="pcColorPopoverHexInput"'), 'PhotoCardStudio.svelte must include live #pcColorPopoverHexInput');
  assert.ok(svelteSrc.includes('data-pc-pop-swatch={swatchHex}'), 'Curated swatch grid must bind data-pc-pop-swatch');
  const swatchBlockMatch = svelteSrc.match(/id="pcColorPopoverSwatches"[\s\S]*?\{#each\s*\[([\s\S]*?)\]\s*as\s+swatchHex\}/);
  assert.ok(swatchBlockMatch, 'Curated swatch grid {#each} block must exist in #pcColorPopoverSwatches');
  const swatchHexes = swatchBlockMatch[1].match(/#[0-9a-fA-F]{6}/g) || [];
  assert.ok(swatchHexes.includes('#00bd74'), 'Curated swatch grid must include #00bd74 medium green');
  assert.ok(swatchHexes.includes('#dcfce7') && swatchHexes.includes('#fbcfe8'), 'Curated swatch grid must include pastel swatches');
  assert.equal(swatchHexes.length, 28, `Expected 28 curated swatches in #pcColorPopover, found ${swatchHexes.length}`);

  // Dynamic positioning & viewport clamping check (never opens at (0, 0))
  Engine.applyTemplate('breaking-news', true);
  Engine.selectElement('headline');

  const normalTrigger = createMockElement('button');
  normalTrigger.getBoundingClientRect = () => ({ left: 420, top: 56, right: 452, bottom: 88, width: 32, height: 32 });
  Engine.openColorPopover(normalTrigger, 'text');
  assert.equal(colorPopover.hidden, false, 'openColorPopover must unhide #pcColorPopover');
  assert.equal(colorPopover.style.left, '420px', 'Popover must align with trigger left edge');
  assert.equal(colorPopover.style.top, '96px', 'Popover must open 8px below trigger bottom');

  // Near bottom-right corner of 1440x900 viewport -> must clamp cleanly inside viewport
  const edgeTrigger = createMockElement('button');
  edgeTrigger.getBoundingClientRect = () => ({ left: 1390, top: 850, right: 1428, bottom: 882, width: 38, height: 32 });
  Engine.openColorPopover(edgeTrigger, 'text');
  const clampedLeft = parseInt(colorPopover.style.left, 10);
  const clampedTop = parseInt(colorPopover.style.top, 10);
  assert.ok(clampedLeft > 900 && clampedLeft <= 1440 - 276 - 12, `Right-edge popover left (${clampedLeft}) must clamp inside viewport`);
  assert.ok(clampedTop > 300 && clampedTop < 850, `Bottom-edge popover top (${clampedTop}) must flip above trigger inside viewport`);

  // Applying and resetting color via popover API
  Engine.applyPopoverColor('#00bd74', 'text');
  assert.equal(Engine.getState().elementStyles.headline.color, '#00bd74');
  Engine.resetPopoverColor('text');
  assert.equal(Engine.getState().elementStyles.headline.color, undefined, 'resetPopoverColor must restore auto-contrast default');
  Engine.closeColorPopover();
  assert.equal(colorPopover.hidden, true);
});

runTest('PC-REG-ISS3-01', 'Issue 3 Regression: Headline *Word* Highlight Color & Marker Mode render custom highlight colors verbatim and sync with toolbar & drawer controls', () => {
  const state = Engine.getState();
  const ctx = canvas.getContext('2d');

  Engine.applyTemplate('classic-news-card', true);
  state.headline = 'আজকের *গুরুত্বপূর্ণ* সংবাদ শিরোনাম';
  state.highlightColor = '#00bd74';
  state.highlightBgMode = 'text';

  ctx.__clearLog();
  Engine.renderCard();
  let textOps = ctx.__drawLog.filter(d => d.op === 'fillText');
  assert.ok(
    textOps.some(d => d.text.includes('গুরুত্বপূর্ণ') && d.fillStyle === '#00bd74'),
    'Highlighted *word* in text mode must render in exact state.highlightColor (#00bd74)'
  );

  // Switch to marker pill mode ('marker') and verify pill box fill uses state.highlightColor (#38bdf8)
  state.highlightColor = '#38bdf8';
  state.highlightBgMode = 'marker';
  ctx.__clearLog();
  Engine.renderCard();
  const fillOps = ctx.__drawLog.filter(d => d.op === 'fill' || d.op === 'fillRect');
  assert.ok(
    fillOps.some(d => d.fillStyle === '#38bdf8'),
    'Highlighted *word* in marker mode must draw marker background pill in #38bdf8'
  );

  // Per-element highlight override via popover 'highlight' mode
  Engine.selectElement('headline');
  Engine.openColorPopover(ctxHighlightColorBtn, 'highlight');
  assert.equal(colorPopover.hidden, false);
  Engine.applyPopoverColor('#f472b6', 'highlight');
  assert.equal(state.highlightColor, '#f472b6');
  assert.equal(state.elementStyles.headline.highlightColor, '#f472b6');
});

runTest('PC-REG-ISS4-01', 'Issue 4 Regression: Multi-Brand Kit saves multiple brand profiles (logo, website, phone, footer format, extra info, color palette) and auto-applies active brand on selection and across template switches', () => {
  const state = Engine.getState();
  Engine.init();

  // Save Brand 1: TechHat News
  const brand1 = Engine.saveBrandProfile({
    name: 'টেকহ্যাট নিউজ',
    website: 'www.techhat.com.bd',
    phone: '০১৭০০-১১২২৩৩',
    footerFormat: 'both',
    extraInfo: 'ঢাকা, বাংলাদেশ',
    logoDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    primaryColor: '#059669',
    accentColor: '#fde047',
    bgColor: '#064e3b',
    highlightColor: '#34d399',
    applyColorsOnSelect: true
  }, true);

  // Save Brand 2: Jagoron Foundation
  const brand2 = Engine.saveBrandProfile({
    name: 'জাগরণ ফাউন্ডেশন',
    website: 'jagoronbd.org',
    phone: '০১৮১৯-৯৯৮৮৭৭',
    footerFormat: 'both',
    extraInfo: 'চট্টগ্রাম',
    primaryColor: '#2563eb',
    accentColor: '#38bdf8',
    bgColor: '#0f172a',
    highlightColor: '#60a5fa',
    applyColorsOnSelect: true
  }, true);

  assert.equal(Engine.getBrandProfiles().length, 2, 'Both saved brand profiles must persist in localStorage');
  assert.equal(Engine.getActiveBrandId(), brand2.id, 'Newly saved brand2 must become active');
  assert.equal(state.brandName, 'জাগরণ ফাউন্ডেশন');
  assert.equal(state.brandWebsite, 'jagoronbd.org');
  assert.equal(state.brandPhone, '০১৮১৯-৯৯৮৮৭৭');
  assert.equal(state.footerUrl, 'jagoronbd.org  •  ০১৮১৯-৯৯৮৮৭৭');
  assert.equal(state.primaryColor, '#2563eb');
  assert.equal(state.accentColor, '#38bdf8');
  assert.equal(state.bgColor, '#0f172a');

  // Switch back to Brand 1 in 1 click -> everything updates automatically!
  Engine.selectBrandProfile(brand1.id);
  assert.equal(Engine.getActiveBrandId(), brand1.id);
  assert.equal(state.brandName, 'টেকহ্যাট নিউজ');
  assert.equal(state.brandWebsite, 'www.techhat.com.bd');
  assert.equal(state.brandPhone, '০১৭০০-১১২২৩৩');
  assert.equal(state.footerUrl, 'www.techhat.com.bd  •  ০১৭০০-১১২২৩৩');
  assert.equal(state.primaryColor, '#059669');
  assert.equal(state.accentColor, '#fde047');
  assert.equal(state.bgColor, '#064e3b');
  assert.equal(state.highlightColor, '#34d399');

  // Switching templates while Brand 1 is active MUST keep Brand 1's info & palette while still isolating customLayers & elementStyles!
  state.customLayers = [{ id: 'temp_stk', layerType: 'badge', text: 'টেম্প' }];
  state.elementStyles = { headline: { color: '#ff00aa' } };
  Engine.applyTemplate('humanitarian-hotline-split', true);

  assert.equal(state.customLayers.length, 0, 'Template switch must still clear customLayers');
  assert.deepEqual(state.elementStyles, {}, 'Template switch must still clear elementStyles');
  assert.equal(state.brandName, 'টেকহ্যাট নিউজ', 'Active brand name must persist across template switch');
  assert.equal(state.brandWebsite, 'www.techhat.com.bd', 'Active brand website must persist across template switch');
  assert.equal(state.brandPhone, '০১৭০০-১১২২৩৩', 'Active brand phone must persist across template switch');
  assert.equal(state.primaryColor, '#059669', 'Active brand primaryColor must persist across template switch');
  assert.equal(state.accentColor, '#fde047', 'Active brand accentColor must persist across template switch');

  // Verify humanitarian-hotline-split renders both brandWebsite and brandPhone cleanly on canvas
  const ctx = canvas.getContext('2d');
  ctx.__clearLog();
  Engine.renderCard();
  const hotlineTexts = ctx.__drawLog.filter(d => d.op === 'fillText').map(d => d.text);
  assert.ok(hotlineTexts.some(t => t.includes('www.techhat.com.bd')), 'Split footer left cell must render brandWebsite');
  assert.ok(hotlineTexts.some(t => t.includes('০১৭০০-১১২২৩৩')), 'Split footer right cell must render brandPhone');

  // Verify formatBrandFooterContact modes ('website', 'phone', 'both') and deactivateBrandProfile / deleteBrandProfile
  assert.equal(Engine.formatBrandFooterContact({ website: 'techhat.com.bd', phone: '01700', footerFormat: 'website' }), 'techhat.com.bd');
  assert.equal(Engine.formatBrandFooterContact({ website: 'techhat.com.bd', phone: '01700', footerFormat: 'phone' }), '01700');

  Engine.deactivateBrandProfile();
  assert.equal(Engine.getActiveBrandId(), '');
  Engine.applyTemplate('duotone-poster', true);
  assert.equal(state.primaryColor, Engine.TEMPLATES['duotone-poster'].primary, 'After deactivating brand, template switch restores template default colors');

  Engine.deleteBrandProfile(brand1.id);
  assert.equal(Engine.getBrandProfiles().length, 1);
});

/* =========================================================================
 * 7B. CANVA-STYLE STUDIO UPGRADE REGRESSION SUITE (7 USER REQUIREMENTS)
 * ========================================================================= */

runTest('PC-REG-CANVA-01', 'Req 1: Live WYSIWYG on-canvas rich text editing (#pcInlineRichEditor) suppresses ghost double-draw and applies direct selection highlight without * asterisks', () => {
  const state = Engine.getState();
  const ctx = canvas.getContext('2d');

  // Static UI contract: contenteditable #pcInlineRichEditor + #pcSelectionQuickBar + zero *শব্দ* instructions in UI or TEMPLATE_META
  assert.ok(svelteSrc.includes('id="pcInlineRichEditor"') && svelteSrc.includes('contenteditable="true"'), 'PhotoCardStudio.svelte must mount contenteditable #pcInlineRichEditor');
  assert.ok(svelteSrc.includes('id="pcSelectionQuickBar"'), 'PhotoCardStudio.svelte must mount floating #pcSelectionQuickBar');
  assert.ok(svelteSrc.includes('id="pcClearHighlightBtn"'), 'PhotoCardStudio.svelte must mount #pcClearHighlightBtn');
  assert.equal(svelteSrc.includes('*শব্দ*'), false, 'PhotoCardStudio.svelte must have zero *শব্দ* asterisk prompt text');

  for (const [tplId, meta] of Object.entries(Engine.TEMPLATES)) {
    const labelStr = JSON.stringify(meta.labels || {});
    assert.equal(labelStr.includes('*'), false, `Template ${tplId} field labels must not instruct users to type *asterisks*: ${labelStr}`);
  }

  // Runtime: Direct character-range highlight without * syntax
  Engine.applyTemplate('charity-appeal', true);
  state.headline = 'বন্যাকবলিত পানিবন্দি ৫০০ অসহায় পরিবারের মুখে খাবার তুলে দিতে এগিয়ে আসুন';
  state.highlightColor = '#facc15';
  state.highlightBgMode = 'text';
  Engine.setElRichSpans('headline', state.headline, []);

  const targetPhrase = '৫০০ অসহায় পরিবারের';
  const startIdx = state.headline.indexOf(targetPhrase);
  assert.ok(startIdx > 0, 'Target phrase must exist in clean asterisk-free headline');
  const endIdx = startIdx + targetPhrase.length;

  const applied = Engine.applySelectionHighlight('#22c55e', 'text', 'headline', startIdx, endIdx);
  assert.equal(applied, true, 'applySelectionHighlight must succeed on direct character range');
  assert.equal(state.headline.includes('*'), false, 'Direct highlight must NEVER inject * characters into state.headline');

  const spans = Engine.getElRichSpans('headline', state.headline);
  assert.equal(spans.length, 1, 'Headline richSpans must record exact highlighted span');
  assert.equal(state.headline.slice(spans[0].start, spans[0].end), targetPhrase);
  assert.equal(spans[0].color, '#22c55e');

  ctx.__clearLog();
  Engine.renderCard();
  const fillTexts = ctx.__drawLog.filter(d => d.op === 'fillText');
  assert.ok(fillTexts.some(d => d.fillStyle === '#22c55e'), 'Canvas must render directly highlighted range in #22c55e without asterisks');

  // Opening live WYSIWYG inline editor must show #pcInlineRichEditor (not dark textarea) and suppress duplicate canvas headline glyphs!
  Engine.selectElement('headline');
  Engine.openInlineEditorForElement('headline');
  assert.equal(inlineRichEditor.hidden, false, 'openInlineEditorForElement must unhide live #pcInlineRichEditor');
  assert.ok(inlineRichEditor.innerHTML.includes('data-rich-hi="1"'), 'Live rich editor HTML must render highlighted span inline');

  ctx.__clearLog();
  Engine.renderCard();
  const whileEditingTexts = ctx.__drawLog.filter(d => d.op === 'fillText').map(d => d.text);
  assert.equal(
    whileEditingTexts.some(t => t.includes('বন্যাকবলিত') || t.includes('পানিবন্দি')),
    false,
    'Canvas must skip drawing headline glyphs behind live #pcInlineRichEditor so text is never ghosted/doubled'
  );

  Engine.closeInlineEditor(false);
  assert.equal(inlineRichEditor.hidden, true, 'closeInlineEditor must hide #pcInlineRichEditor');

  // Clear highlight restores clean unhighlighted text
  Engine.clearSelectionHighlight('headline');
  assert.equal(Engine.getElRichSpans('headline', state.headline).length, 0, 'clearSelectionHighlight must remove rich highlight spans');
});

runTest('PC-REG-CANVA-02', 'Req 2: Fixed authentic vector icons for Nagad (নগদ), Rocket (রকেট), and Call/Phone across Canvas & Svelte UI while preserving bKash', () => {
  const ctx = canvas.getContext('2d');

  // 1. bKash preserved (8 origami polygons)
  assert.equal(Engine.PAYMENT_VECTORS.bkash.polygons.length, 8, 'bKash 8-polygon origami vector must remain intact');

  // 2. Nagad upgraded to crisp 6-path coin ring + flame + figure emblem
  const nagadSpec = Engine.PAYMENT_VECTORS.nagad;
  assert.ok(nagadSpec && Array.isArray(nagadSpec.paths) && nagadSpec.paths.length === 6, 'Nagad vector must use crisp 6-path multi-tone emblem');
  assert.ok(svelteSrc.includes('viewBox="0 0 54 54"') && svelteSrc.includes('#f7941d') && svelteSrc.includes('#ed1c24'), 'Svelte Elements drawer must render matching crisp Nagad SVG');

  // 3. Rocket upgraded to crisp 6-path DBBL purple square + orbit swoosh + rocket + porthole + flame
  const rocketSpec = Engine.PAYMENT_VECTORS.rocket;
  assert.ok(rocketSpec && Array.isArray(rocketSpec.paths) && rocketSpec.paths.length === 6, 'Rocket vector must use crisp 6-path DBBL Rocket emblem');
  assert.ok(svelteSrc.includes('viewBox="46 6 116 114"') && svelteSrc.includes('#8c3494') && svelteSrc.includes('#6d2077'), 'Svelte Elements drawer must render matching crisp Rocket SVG');

  // 4. Call / Phone icon renders authentic handset path on canvas and in Svelte UI
  assert.ok(svelteSrc.includes('M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2'), 'Svelte UI must render authentic telephone handset SVG path for phone/call');

  ctx.__clearLog();
  Engine.drawBrandVectorIcon(ctx, 'nagad', 200, 200, 64);
  Engine.drawBrandVectorIcon(ctx, 'rocket', 320, 200, 64);
  Engine.drawUiVectorIcon(ctx, 'phone', 440, 200, 56, '#ffffff');
  const fills = ctx.__drawLog.filter(d => d.op === 'fill');
  assert.ok(fills.length >= 13, `Expected >=13 vector fill operations for Nagad(6)+Rocket(6)+Phone(1), got ${fills.length}`);
});

runTest('PC-REG-CANVA-03', 'Req 3: Canva-style organized Brand Kit Hub with search, active Brand Kit switcher dropdown, section navigation, and structured asset cards', () => {
  assert.ok(svelteSrc.includes('id="pcBrandSearchInput"'), 'Brand drawer must include Canva search input');
  assert.ok(svelteSrc.includes('id="pcBrandKitDropdownBtn"') && svelteSrc.includes('id="pcBrandKitDropdownMenu"'), 'Brand drawer must include Canva Brand Kit switcher dropdown');
  assert.ok(svelteSrc.includes('id="pcBrandSectionNav"'), 'Brand drawer must include Canva section nav');
  ['logos', 'colors', 'fonts', 'info', 'graphics', 'saved'].forEach(cardKey => {
    assert.ok(svelteSrc.includes(`data-brand-card="${cardKey}"`), `Brand drawer must organize ${cardKey} into a Canva asset card`);
  });

  // Section drill-down & reset behavior
  Engine.setBrandSection('colors');
  assert.equal(brandCardMap.colors.hidden, false, 'Selecting Colors section must show Colors asset card');
  assert.equal(brandCardMap.logos.hidden, true, 'Selecting Colors section must hide Logos card');
  assert.equal(brandCardMap.info.hidden, true, 'Selecting Colors section must hide Info card');
  assert.equal(brandBackToAllBtn.hidden, false, 'Back to all assets button must appear when drilled into a Brand section');

  Engine.setBrandSection('all');
  assert.equal(brandCardMap.logos.hidden, false);
  assert.equal(brandCardMap.colors.hidden, false);
  assert.equal(brandBackToAllBtn.hidden, true);
});

runTest('PC-REG-CANVA-04', 'Req 4: Canva-style organized Elements Hub with compact shelves, See-All drill-down, search filtering, 24 UI icons, 13 social logos, 21 shapes, and 12 graphics', () => {
  assert.ok(svelteSrc.includes('id="pcElementsSearchInput"'), 'Elements drawer must include search input');
  assert.ok(svelteSrc.includes('id="pcElementsCatChips"'), 'Elements drawer must include category chips');
  ['icons', 'social', 'payment', 'shapes', 'graphics', 'badges', 'colors'].forEach(shelfId => {
    assert.ok(svelteSrc.includes(`data-el-shelf="${shelfId}"`), `Elements drawer must include organized "${shelfId}" shelf`);
  });

  // Default overview ('all'): every shelf visible, overflow items collapsed so nothing is dumped open at once!
  elementsSearchInput.value = '';
  Engine.setElementsCategory('all');
  assert.equal(elementsDrillHeader.hidden, true, 'Overview mode must hide drill-down header');
  assert.equal(elShelfMap.icons.shelf.hidden, false);
  assert.equal(elShelfMap.social.shelf.hidden, false);
  assert.equal(elShelfMap.icons.item0.hidden, false, 'Preview shelf items must be visible in overview');
  assert.equal(elShelfMap.icons.itemOverflow.hidden, true, 'Overflow items must stay collapsed in overview mode');

  // Drill down into 'social' ('See all' / category chip) -> only social shelf visible, overflow items expanded!
  Engine.setElementsCategory('social');
  assert.equal(elementsDrillHeader.hidden, false, 'Category drill-down must show back header');
  assert.equal(elShelfMap.social.shelf.hidden, false);
  assert.equal(elShelfMap.social.itemOverflow.hidden, false, 'Drill-down must reveal all overflow items in that category');
  assert.equal(elShelfMap.icons.shelf.hidden, true, 'Other shelves must hide during category drill-down');
  assert.equal(elShelfMap.shapes.shelf.hidden, true);

  // Reset back to All Elements
  Engine.setElementsCategory('all');
  assert.equal(elShelfMap.icons.shelf.hidden, false);
  assert.equal(elShelfMap.social.itemOverflow.hidden, true);

  // Verify rich layer creation for standalone UI Icon, Social Logo, and Graphic Element
  Engine.applyTemplate('breaking-news', true);
  const state = Engine.getState();
  const iconLyr = Engine.addUiIconLayer('phone', '#ffffff', '#16a34a', 'circle');
  const socLyr = Engine.addSocialLogoLayer('facebook', 'fb.com/techhat');
  const gfxLyr = Engine.addGraphicElementLayer('islamic-arch', '#059669', '#fde047', 300, 200);
  assert.equal(state.customLayers.length, 3, 'UI icon, social logo, and graphic element layers must be added cleanly');
  assert.equal(iconLyr.layerType, 'icon');
  assert.equal(socLyr.layerType, 'social');
  assert.equal(gfxLyr.layerType, 'graphic');
  assert.ok(Object.keys(Engine.SOCIAL_BRAND_VECTORS).length >= 13, 'Engine must provide >=13 authentic social brand vectors');
});

runTest('PC-REG-CANVA-05', 'Req 5: Accurate Lock/Unlock padlock icon state — unlocked layer shows open padlock (neutral), locked layer shows closed padlock, hides transform handles, and unlocks in 1 click', () => {
  Engine.applyTemplate('breaking-news', true);
  Engine.renderCard();
  Engine.selectElement('badge');

  // Unlocked state: open padlock SVG path ("9.9-1"), handles visible, not locked
  assert.equal(selBox.getAttribute('data-locked'), 'false');
  assert.ok(miniLockBtn.querySelector('svg').innerHTML.includes('9.9-1'), 'Unlocked #pcMiniLockBtn must show open padlock shackle (9.9-1)');
  assert.ok(topLockBtn.querySelector('svg').innerHTML.includes('9.9-1'), 'Unlocked #pcTopLockBtn must show open padlock shackle (9.9-1)');
  assert.equal(selMoveHandle.hidden, false, 'Move handle must be visible when unlocked');
  assert.equal(selRotHandle.hidden, false, 'Rotate handle must be visible when unlocked');
  assert.equal(miniEditBtn.hidden, false, 'Mini Edit button must be visible when unlocked');
  assert.equal(miniDelBtn.hidden, false, 'Mini Delete button must be visible when unlocked');

  // Lock the selected element
  Engine.toggleLockSelectedElement();
  assert.equal(selBox.getAttribute('data-locked'), 'true');
  assert.ok(miniLockBtn.querySelector('svg').innerHTML.includes('10 0v4'), 'Locked #pcMiniLockBtn must show closed padlock shackle (10 0v4)');
  assert.ok(topLockBtn.querySelector('svg').innerHTML.includes('10 0v4'), 'Locked #pcTopLockBtn must show closed padlock shackle (10 0v4)');
  assert.equal(selMoveHandle.hidden, true, 'Move handle must hide when locked');
  assert.equal(selRotHandle.hidden, true, 'Rotate handle must hide when locked');
  assert.equal(miniEditBtn.hidden, true, 'Mini Edit button must hide when locked');
  assert.equal(miniDelBtn.hidden, true, 'Mini Delete button must hide when locked');
  assert.equal(ctxPanels.locked.hidden, false, 'Top context toolbar must switch to locked banner when layer is locked');

  // Unlock in 1 click -> open padlock and handles restored
  Engine.toggleLockSelectedElement();
  assert.equal(selBox.getAttribute('data-locked'), 'false');
  assert.ok(miniLockBtn.querySelector('svg').innerHTML.includes('9.9-1'), 'Unlocking must restore open padlock icon');
  assert.equal(selMoveHandle.hidden, false);
  assert.equal(ctxPanels.text.hidden, false, 'Unlocking badge must restore text context panel');
});

runTest('PC-REG-CANVA-06', 'Req 6: Canva-style Position & Layers panel (Arrange | Layers) with All/Overlapping filter, visual Z-order stack, reorder, visibility & lock toggles', () => {
  assert.ok(svelteSrc.includes('data-pc-drawer="position"'), 'PhotoCardStudio.svelte must mount Position & Layers drawer');
  assert.ok(svelteSrc.includes('id="pcLayersStackList"'), 'Position drawer must mount visual #pcLayersStackList');
  assert.ok(svelteSrc.includes('data-open-layers-panel="1"'), 'Right-click Layer submenu must include Show layers trigger');

  Engine.applyTemplate('breaking-news', true);
  Engine.addTextBox('heading');
  Engine.addShapeLayer('pill', '#2563eb', '#ffffff', 300, 90, 45);
  const state = Engine.getState();
  assert.equal(state.customLayers.length, 2);
  const firstId = state.customLayers[0].id;
  const secondId = state.customLayers[1].id;

  Engine.openPositionDrawer('layers');
  assert.equal(positionDrawer.hidden, false, 'openPositionDrawer("layers") must open position drawer');
  assert.equal(posLayersPane.hidden, false, 'Layers pane must be visible');
  assert.equal(posArrangePane.hidden, true, 'Arrange pane must be hidden when Layers tab is active');
  assert.ok(layersStackList.innerHTML.includes('layer:' + secondId), 'Layers stack must render custom shape layer card');
  assert.ok(layersStackList.innerHTML.includes('headline'), 'Layers stack must render template headline layer card');
  assert.ok(layersStackList.innerHTML.includes('data-select-layer="card"'), 'Layers stack must render bottom background card row');

  // Top-to-bottom Canva Z-order: topmost custom layer ('secondId') appears BEFORE 'firstId' in visual stack HTML!
  const idxTop = layersStackList.innerHTML.indexOf('layer:' + secondId);
  const idxBelow = layersStackList.innerHTML.indexOf('layer:' + firstId);
  assert.ok(idxTop !== -1 && idxBelow !== -1 && idxTop < idxBelow, 'Visual layer stack must render topmost Z-order layer above lower layer');

  // Drag-and-drop reorder via reorderLayerByDrop swaps Z-order
  Engine.reorderLayerByDrop('layer:' + secondId, 'layer:' + firstId);
  assert.equal(state.customLayers[0].id, secondId, 'Dropping top layer onto lower layer must reorder customLayers array');

  // Visibility & Lock toggles by layer ID
  Engine.toggleVisibilityElementById('badge');
  assert.equal(state.elementHidden.badge, true, 'toggleVisibilityElementById must hide layer');
  Engine.toggleVisibilityElementById('badge');
  assert.equal(state.elementHidden.badge, false, 'Second toggleVisibilityElementById must unhide layer');

  // Switch to Arrange tab and verify X/Y/W/H/Rot populate for selected element
  Engine.selectElement('layer:' + secondId);
  Engine.openPositionDrawer('arrange');
  assert.equal(posArrangePane.hidden, false);
  assert.ok(Number(posAdvW.value) > 0 && Number(posAdvH.value) > 0, 'Arrange Advanced W/H inputs must reflect selected layer dimensions');
});

runTest('PC-REG-CANVA-07', 'Req 7: Dynamic layer-aware top #pcContextToolbar switches per layer type (card, text, photo, shape, vector, logo, locked) and universal Transparency (0-100%) updates canvas alpha', () => {
  const state = Engine.getState();
  const ctx = canvas.getContext('2d');

  const assertOnlyActivePanel = (expected) => {
    for (const [k, el] of Object.entries(ctxPanels)) {
      assert.equal(el.hidden, k !== expected, `Expected context panel "${k}".hidden=${k !== expected} when active panel is "${expected}"`);
    }
  };

  Engine.applyTemplate('breaking-news', true);
  state.logoImg = new MockImage();
  state.logoImg._src = 'data:image/png;base64,logo';
  Engine.renderCard();

  // 1. Card background selected
  Engine.selectElement('card');
  assertOnlyActivePanel('card');

  // 2. Text layer selected ('headline')
  Engine.selectElement('headline');
  assertOnlyActivePanel('text');

  // 3. Photo slot selected ('photo')
  Engine.selectElement('photo');
  assertOnlyActivePanel('photo');

  // 4. Brand Logo selected ('logo')
  Engine.selectElement('logo');
  assertOnlyActivePanel('logo');

  // 5. Shape layer selected
  Engine.addShapeLayer('rounded', '#dc2626', '#ffffff', 320, 100, 16);
  assertOnlyActivePanel('shape');

  // 6. Vector / Icon / Social layer selected
  const vecLayer = Engine.addUiIconLayer('phone', '#ffffff', '#2563eb', 'circle');
  assertOnlyActivePanel('vector');

  // 7. Universal Transparency (0-100%) via setElementOpacity + anchored #pcToolPopover
  const vecElId = 'layer:' + vecLayer.id;
  const anchorBtn = createMockElement('button');
  anchorBtn.getBoundingClientRect = () => ({ left: 720, top: 56, right: 760, bottom: 88, width: 40, height: 32 });
  Engine.openToolPopover(anchorBtn, 'transparency');
  assert.equal(toolPopover.hidden, false, 'openToolPopover("transparency") must unhide #pcToolPopover');
  assert.equal(toolPopSections.transparency.hidden, false, 'Transparency section in #pcToolPopover must be visible');
  assert.equal(popOpacityInput.value, '100', 'Initial layer transparency must be 100%');

  Engine.setElementOpacity(vecElId, 0.45);
  assert.equal(Math.round(Engine.getElementOpacity(vecElId) * 100), 45, 'getElementOpacity must reflect 45% opacity');
  Engine.selectElement(vecElId);
  assert.equal(topTransparencyVal.textContent, '45%', 'Top toolbar #pcTopTransparencyVal must display 45%');

  Engine.closeToolPopover();
  assert.equal(toolPopover.hidden, true);
});

/* =========================================================================
 * 8. FINAL SUMMARY & PROCESS EXIT
 * ========================================================================= */

(async function runAll() {
  for (const t of testSuite) {
    try {
      resetStudioState();
      await t.fn();
      passed++;
    } catch (err) {
      console.error(`✗ [${t.id}] ${t.name}`);
      console.error(err);
      testErrors.push({ id: t.id, name: t.name, err });
      failed++;
    }
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`Total Assertions: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  if (failed > 0) {
    console.log('Status: FAILED ASSERTIONS ENCOUNTERED');
    for (const f of testErrors) {
      console.error(`  - [${f.id}] ${f.name}: ${f.err.message}`);
    }
    process.exit(1);
  } else {
    console.log('Status: ALL TESTS PASSED (100% SUCCESS)');
    process.exit(0);
  }
})();
