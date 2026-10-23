/*!
 * TechHat PDF Studio — Universal "anything → PDF" converter (100% client-side)
 *
 *   • Images  : JPG / PNG / WebP / GIF / BMP           → PDF (A4, auto orientation)
 *   • Word    : .docx (text, headings, bold/italic, tables, images, Bijoy runs) and legacy .doc (text)
 *   • PowerPoint: .pptx (positioned text boxes, shapes, pictures, tables, backgrounds) → one page per slide
 *   • Excel   : .xlsx (every sheet rendered as a gridded table, landscape A4)
 *   • Text    : .txt / .md / .csv / .rtf (Unicode or Bijoy/SutonnyMJ auto-detected)
 *
 * Bangla text is shaped by the browser's own text engine on <canvas>, so complex conjuncts and
 * SutonnyMJ (Bijoy) glyphs render correctly — something PDF standard fonts cannot do.
 *
 * Exposes window.TechHatPDFConvert.
 */
(function () {
  'use strict';

  var UNI_FAMILY = '"Anek Bangla", "Noto Sans Bengali", "Nirmala UI", "Vrinda", "Segoe UI", Arial, sans-serif';
  var BIJOY_FAMILY = '"SutonnyMJ", "SutonnyOMJ", "Anek Bangla", sans-serif';
  var A4 = [595.28, 841.89];

  function engine() { return window.BijoyEngine || null; }
  function isBijoyFontName(name) {
    var E = engine();
    if (E && E.isBijoyFont) return E.isBijoyFont(name);
    return /MJ(\s|$)|sutonny|bijoy/i.test(String(name || ''));
  }
  function detectScript(text) {
    var E = engine();
    return E && E.detect ? E.detect(text) : 'unknown';
  }

  function extOf(name) {
    var m = /\.([a-z0-9]+)$/i.exec(String(name || ''));
    return m ? m[1].toLowerCase() : '';
  }

  /** Classify a File into a converter kind. */
  function kindOf(file) {
    var ext = extOf(file.name);
    var type = String(file.type || '');
    if (ext === 'pdf' || type === 'application/pdf') return 'pdf';
    if (/^image\//.test(type) || /^(jpe?g|png|webp|gif|bmp)$/.test(ext)) return 'image';
    if (ext === 'docx' || ext === 'docm' || ext === 'dotx') return 'docx';
    if (ext === 'doc') return 'doc';
    if (ext === 'pptx' || ext === 'ppsx') return 'pptx';
    if (ext === 'xlsx' || ext === 'xlsm') return 'xlsx';
    if (ext === 'rtf') return 'rtf';
    if (/^(txt|md|csv|log|text)$/.test(ext) || /^text\//.test(type)) return 'text';
    return '';
  }

  function badgeOf(kind, name) {
    var ext = extOf(name).toUpperCase();
    if (kind === 'image') return ext === 'JPEG' ? 'JPG' : (ext || 'IMG');
    return { pdf: 'PDF', docx: 'DOCX', doc: 'DOC', pptx: 'PPTX', xlsx: 'XLSX', rtf: 'RTF', text: ext || 'TXT' }[kind] || ext;
  }

  function readAB(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(new Error('ফাইল পড়া যায়নি')); };
      r.readAsArrayBuffer(file);
    });
  }
  function readDataURL(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(new Error('ফাইল পড়া যায়নি')); };
      r.readAsDataURL(blob);
    });
  }
  function dataUrlToBytes(dataUrl) {
    var bin = atob(dataUrl.split(',')[1] || '');
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }
  function loadImage(src) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () { resolve(im); };
      im.onerror = function () { resolve(null); };
      im.src = src;
    });
  }
  function decodeText(buf) {
    var u8 = new Uint8Array(buf);
    if (u8[0] === 0xFF && u8[1] === 0xFE) return new TextDecoder('utf-16le').decode(u8.subarray(2));
    if (u8[0] === 0xFE && u8[1] === 0xFF) return new TextDecoder('utf-16be').decode(u8.subarray(2));
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(u8);
    } catch (e) {
      return new TextDecoder('windows-1252').decode(u8);
    }
  }

  function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('400 24px "Anek Bangla"', 'অআ'),
      document.fonts.load('700 24px "Anek Bangla"', 'অআ'),
      document.fonts.load('400 24px "SutonnyMJ"', 'Avwg'),
      document.fonts.load('700 24px "SutonnyMJ"', 'Avwg')
    ]).catch(function () {});
  }

  /* ==================================================================
   * TEXT LAYOUT (run-aware word wrapping on canvas)
   * ================================================================== */
  function fontCss(run, pxPerPt) {
    var px = Math.max(4, (run.size || 11) * pxPerPt);
    return (run.italic ? 'italic ' : '') + (run.bold ? '700 ' : '400 ') + px.toFixed(1) + 'px ' +
      (run.font === 'bijoy' ? BIJOY_FAMILY : UNI_FAMILY);
  }

  /**
   * Lays out styled runs into lines that fit maxW pixels.
   * Returns [{ segs: [{text, css, color, underline, w}], w, maxPx }]
   */
  function layoutRuns(ctx, runs, maxW, pxPerPt, defaultSize) {
    var lines = [];
    var line = { segs: [], w: 0, maxPx: 0 };
    var fallbackPx = (defaultSize || 11) * pxPerPt;

    function finalize() {
      while (line.segs.length && /^\s+$/.test(line.segs[line.segs.length - 1].text)) {
        line.w -= line.segs.pop().w;
      }
      if (!line.maxPx) line.maxPx = fallbackPx;
      lines.push(line);
      line = { segs: [], w: 0, maxPx: 0 };
    }

    function addSeg(text, run, css, w) {
      var px = (run.size || defaultSize || 11) * pxPerPt;
      line.segs.push({ text: text, css: css, color: run.color || '#1e293b', underline: !!run.underline, w: w });
      line.w += w;
      if (px > line.maxPx) line.maxPx = px;
    }

    (runs || []).forEach(function (run) {
      var css = fontCss(run, pxPerPt);
      ctx.font = css;
      var text = String(run.text || '').replace(/\t/g, '    ');
      var tokens = text.split(/(\n|[ \u00A0]+)/);
      tokens.forEach(function (tok) {
        if (!tok) return;
        if (tok === '\n') {
          if (!line.maxPx) line.maxPx = (run.size || defaultSize || 11) * pxPerPt;
          finalize();
          return;
        }
        var w = ctx.measureText(tok).width;
        if (/^[ \u00A0]+$/.test(tok)) {
          if (!line.segs.length) return;
          addSeg(tok, run, css, w);
          return;
        }
        if (line.w + w > maxW && line.segs.length) finalize();
        if (w > maxW) {
          // Very long word / URL — hard-break by characters
          var chunk = '';
          Array.from(tok).forEach(function (ch) {
            var cw = ctx.measureText(chunk + ch).width;
            if (cw > maxW && chunk) {
              addSeg(chunk, run, css, ctx.measureText(chunk).width);
              finalize();
              chunk = ch;
            } else {
              chunk += ch;
            }
          });
          if (chunk) addSeg(chunk, run, css, ctx.measureText(chunk).width);
          return;
        }
        addSeg(tok, run, css, w);
      });
    });
    if (line.segs.length || !lines.length) finalize();
    return lines;
  }

  function drawLine(ctx, ln, x, baseline) {
    var cx = x;
    ln.segs.forEach(function (s) {
      ctx.font = s.css;
      ctx.fillStyle = s.color;
      ctx.fillText(s.text, cx, baseline);
      if (s.underline && !/^\s+$/.test(s.text)) {
        ctx.fillRect(cx, baseline + 2, s.w, Math.max(1, ln.maxPx / 16));
      }
      cx += s.w;
    });
  }

  /* ==================================================================
   * BLOCK RENDERER → multi-page PDF (A4 by default)
   * blocks: para | image | table | pagebreak | hr
   * ================================================================== */
  function renderBlocksToPdf(blocks, opts) {
    opts = opts || {};
    var pageW = opts.pageW || A4[0];
    var pageH = opts.pageH || A4[1];
    var S = opts.scale || 2;            // px per pt
    var W = Math.round(pageW * S), H = Math.round(pageH * S);
    var M = Math.round((opts.margin == null ? 54 : opts.margin) * S);
    var usable = W - M * 2;
    var canvases = [];
    var ctx = null;
    var y = M;

    function newPage() {
      var c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.textBaseline = 'alphabetic';
      canvases.push(c);
      y = M;
    }
    function ensure(h) {
      if (y + h > H - M && y > M + 1) newPage();
    }

    return ensureFonts().then(function () {
      newPage();
      var chain = Promise.resolve();

      blocks.forEach(function (b) {
        chain = chain.then(function () {
          if (b.type === 'pagebreak') {
            if (y > M + 1) newPage();
            return;
          }
          if (b.type === 'hr') {
            ensure(14 * S);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(M, y + 5 * S, usable, Math.max(1, S));
            y += 14 * S;
            return;
          }
          if (b.type === 'para') {
            var indent = (b.indent || 0) * S;
            var bulletW = 0;
            var defSize = (b.runs && b.runs[0] && b.runs[0].size) || 11;
            if (b.bullet) {
              ctx.font = fontCss({ size: defSize }, S);
              bulletW = ctx.measureText(b.bullet + '  ').width;
            }
            var maxW = Math.max(40, usable - indent - bulletW);
            var lines = layoutRuns(ctx, b.runs, maxW, S, defSize);
            y += (b.spaceBefore || 0) * S;
            lines.forEach(function (ln, li) {
              var lh = ln.maxPx * (b.lineHeight || 1.45);
              ensure(lh);
              var x0 = M + indent + bulletW;
              if (b.align === 'center') x0 = M + indent + bulletW + (maxW - ln.w) / 2;
              else if (b.align === 'right') x0 = M + indent + bulletW + (maxW - ln.w);
              var baseline = y + ln.maxPx * 1.08;
              if (li === 0 && b.bullet) {
                ctx.font = fontCss({ size: defSize }, S);
                ctx.fillStyle = '#334155';
                ctx.fillText(b.bullet, M + indent, baseline);
              }
              drawLine(ctx, ln, x0, baseline);
              y += lh;
            });
            y += (b.spaceAfter == null ? 6 : b.spaceAfter) * S;
            return;
          }
          if (b.type === 'image') {
            return loadImage(b.src).then(function (im) {
              if (!im) return;
              var wPx = (b.widthPt ? b.widthPt * S : im.naturalWidth);
              var hPx = (b.heightPt ? b.heightPt * S : im.naturalHeight);
              var k = Math.min(1, usable / wPx, (H - M * 2) / hPx);
              wPx *= k;
              hPx *= k;
              ensure(hPx);
              var x = b.align === 'center' ? M + (usable - wPx) / 2 : (b.align === 'right' ? M + usable - wPx : M);
              ctx.drawImage(im, x, y, wPx, hPx);
              y += hPx + 6 * S;
            });
          }
          if (b.type === 'table') {
            renderTable(b);
          }
        });
      });

      function renderTable(b) {
        var rows = b.rows || [];
        if (!rows.length) return;
        var fs = b.fontSize || 10;
        var cols = 0;
        rows.forEach(function (r) { cols = Math.max(cols, r.length); });
        if (!cols) return;
        var pad = 4 * S;
        // Natural column widths
        ctx.font = fontCss({ size: fs }, S);
        var nat = [];
        for (var c = 0; c < cols; c++) nat[c] = 24 * S;
        rows.forEach(function (r) {
          for (var c2 = 0; c2 < cols; c2++) {
            var txt = String((r[c2] && r[c2].text != null ? r[c2].text : r[c2]) || '');
            var longest = 0;
            txt.split('\n').forEach(function (ln) { longest = Math.max(longest, ctx.measureText(ln).width); });
            nat[c2] = Math.max(nat[c2], Math.min(longest + pad * 2 + 3 * S, (b.maxColPt || 230) * S));
          }
        });
        var total = nat.reduce(function (a, v) { return a + v; }, 0);
        var k = (total > usable || b.stretch) ? usable / total : 1;
        var widths = nat.map(function (v) { return v * k; });

        if (b.title) {
          ensure(fs * 2.4 * S);
          ctx.font = fontCss({ size: fs + 4, bold: true }, S);
          ctx.fillStyle = '#0f172a';
          ctx.fillText(b.title, M, y + (fs + 4) * S);
          y += (fs + 4) * S * 1.8;
        }

        rows.forEach(function (r, ri) {
          var cellLines = [];
          var rowH = 0;
          for (var c3 = 0; c3 < cols; c3++) {
            var cell = r[c3];
            var t = String((cell && cell.text != null ? cell.text : cell) || '');
            var bold = (b.header && ri === 0) || !!(cell && cell.bold);
            var font = cell && cell.font === 'bijoy' ? 'bijoy' : (detectScript(t) === 'bijoy' ? 'bijoy' : 'uni');
            var lns = layoutRuns(ctx, [{ text: t, size: fs, bold: bold, font: font }], Math.max(10, widths[c3] - pad * 2), S, fs);
            cellLines.push(lns);
            var h = lns.reduce(function (a, l) { return a + l.maxPx * 1.32; }, 0) + pad * 2;
            rowH = Math.max(rowH, h);
          }
          rowH = Math.min(rowH, H - M * 2);
          ensure(rowH);
          var x = M;
          for (var c4 = 0; c4 < cols; c4++) {
            if ((b.header && ri === 0)) {
              ctx.fillStyle = '#f1f5f9';
              ctx.fillRect(x, y, widths[c4], rowH);
            }
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = Math.max(1, S * 0.6);
            ctx.strokeRect(x, y, widths[c4], rowH);
            var ty = y + pad;
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, widths[c4], rowH);
            ctx.clip();
            cellLines[c4].forEach(function (ln) {
              drawLine(ctx, ln, x + pad, ty + ln.maxPx * 1.02);
              ty += ln.maxPx * 1.32;
            });
            ctx.restore();
            x += widths[c4];
          }
          y += rowH;
        });
        y += 8 * S;
      }

      return chain.then(function () {
        if (opts.pageNumbers !== false && canvases.length > 1) {
          canvases.forEach(function (c, i) {
            var cx = c.getContext('2d');
            cx.font = fontCss({ size: 9 }, S);
            cx.fillStyle = '#94a3b8';
            cx.textAlign = 'center';
            cx.fillText((i + 1) + ' / ' + canvases.length, W / 2, H - M / 2);
            cx.textAlign = 'left';
          });
        }
        return canvasesToPdf(canvases, pageW, pageH, opts.quality || 0.9);
      });
    });
  }

  function canvasesToPdf(canvases, pageW, pageH, quality) {
    return window.PDFLib.PDFDocument.create().then(function (pdf) {
      var chain = Promise.resolve();
      canvases.forEach(function (c) {
        chain = chain.then(function () {
          var bytes = dataUrlToBytes(c.toDataURL('image/jpeg', quality || 0.9));
          return pdf.embedJpg(bytes).then(function (img) {
            var pw = pageW || c.width / 2, ph = pageH || c.height / 2;
            var page = pdf.addPage([pw, ph]);
            page.drawImage(img, { x: 0, y: 0, width: pw, height: ph });
          });
        });
      });
      return chain.then(function () { return pdf.save(); });
    });
  }

  /* ==================================================================
   * PLAIN TEXT → BLOCKS
   * ================================================================== */
  function textToBlocks(text, o) {
    o = o || {};
    var size = o.size || 11;
    var font = o.font || (detectScript(text) === 'bijoy' ? 'bijoy' : 'uni');
    var blocks = [];
    if (o.title) {
      blocks.push({ type: 'para', runs: [{ text: o.title, size: Math.round(size * 1.6), bold: true, font: detectScript(o.title) === 'bijoy' ? 'bijoy' : font }], spaceAfter: 4 });
      blocks.push({ type: 'hr' });
    }
    String(text || '').replace(/\r\n?/g, '\n').split('\n').forEach(function (ln) {
      blocks.push({ type: 'para', runs: [{ text: ln, size: size, font: font }], spaceAfter: 2 });
    });
    return blocks;
  }

  /* ==================================================================
   * XML helpers
   * ================================================================== */
  function parseXml(str) {
    return new DOMParser().parseFromString(str, 'application/xml');
  }
  function kids(el, local) {
    var out = [];
    if (!el) return out;
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 1 && (!local || n.localName === local)) out.push(n);
    }
    return out;
  }
  function kid(el, local) { return kids(el, local)[0] || null; }
  function desc(el, local) {
    return el ? Array.prototype.slice.call(el.getElementsByTagNameNS('*', local)) : [];
  }
  function attr(el, name) {
    if (!el) return '';
    return el.getAttribute(name) || el.getAttribute(name.replace(/^[a-z]+:/, '')) || '';
  }
  function relsMap(xmlStr) {
    var map = {};
    if (!xmlStr) return map;
    desc(parseXml(xmlStr), 'Relationship').forEach(function (r) {
      map[r.getAttribute('Id')] = { target: r.getAttribute('Target'), mode: r.getAttribute('TargetMode') };
    });
    return map;
  }
  function resolvePath(baseDir, target) {
    if (!target) return '';
    if (target.charAt(0) === '/') return target.slice(1);
    var parts = (baseDir + target).split('/');
    var out = [];
    parts.forEach(function (p) {
      if (p === '..') out.pop();
      else if (p && p !== '.') out.push(p);
    });
    return out.join('/');
  }
  function zipText(zip, path) {
    var f = zip.file(path);
    return f ? f.async('string') : Promise.resolve('');
  }
  function zipImageDataUrl(zip, path) {
    var f = zip.file(path);
    if (!f) return Promise.resolve(null);
    var ext = extOf(path);
    var mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp', svg: 'image/svg+xml' }[ext];
    if (!mime) return Promise.resolve(null); // emf / wmf / tiff are not browser-renderable
    return f.async('base64').then(function (b64) { return 'data:' + mime + ';base64,' + b64; });
  }

  /* ==================================================================
   * DOCX → BLOCKS
   * ================================================================== */
  function onOff(el) {
    if (!el) return false;
    var v = attr(el, 'w:val');
    return !(v === '0' || v === 'false' || v === 'off');
  }

  function docxToBlocks(buffer) {
    var zip;
    return window.JSZip.loadAsync(buffer).then(function (z) {
      zip = z;
      return Promise.all([
        zipText(zip, 'word/document.xml'),
        zipText(zip, 'word/_rels/document.xml.rels'),
        zipText(zip, 'word/styles.xml')
      ]);
    }).then(function (res) {
      if (!res[0]) throw new Error('সঠিক .docx ফাইল নয়');
      var doc = parseXml(res[0]);
      var rels = relsMap(res[1]);
      var styles = {};
      var defSize = 11;
      var defFont = '';
      if (res[2]) {
        var sdoc = parseXml(res[2]);
        var dd = desc(sdoc, 'rPrDefault')[0];
        if (dd) {
          var sz = desc(dd, 'sz')[0];
          if (sz) defSize = (parseInt(attr(sz, 'w:val'), 10) || 22) / 2;
          var rf = desc(dd, 'rFonts')[0];
          if (rf) defFont = attr(rf, 'w:ascii') || attr(rf, 'w:hAnsi');
        }
        desc(sdoc, 'style').forEach(function (st) {
          var id = attr(st, 'w:styleId');
          var name = attr(kid(st, 'name'), 'w:val');
          var rPr = kid(st, 'rPr');
          var pPr = kid(st, 'pPr');
          var info = { name: name };
          if (rPr) {
            var s2 = kid(rPr, 'sz');
            if (s2) info.size = (parseInt(attr(s2, 'w:val'), 10) || 22) / 2;
            if (kid(rPr, 'b')) info.bold = onOff(kid(rPr, 'b'));
            if (kid(rPr, 'i')) info.italic = onOff(kid(rPr, 'i'));
            var f2 = kid(rPr, 'rFonts');
            if (f2) info.font = attr(f2, 'w:ascii') || attr(f2, 'w:hAnsi');
            var col = kid(rPr, 'color');
            if (col && /^[0-9a-f]{6}$/i.test(attr(col, 'w:val'))) info.color = '#' + attr(col, 'w:val');
          }
          if (pPr && kid(pPr, 'jc')) info.align = attr(kid(pPr, 'jc'), 'w:val');
          styles[id] = info;
        });
      }

      var headingSizes = { title: 26, heading1: 18, heading2: 15, heading3: 13, heading4: 12, subtitle: 14 };
      var body = desc(doc, 'body')[0];
      var blocks = [];
      var pending = [];

      function mapAlign(v) {
        if (v === 'center') return 'center';
        if (v === 'right' || v === 'end') return 'right';
        return 'left';
      }

      function paraToBlocks(p, out) {
        var pPr = kid(p, 'pPr');
        var styleId = pPr ? attr(kid(pPr, 'pStyle'), 'w:val') : '';
        var st = styles[styleId] || {};
        var key = String(st.name || styleId || '').toLowerCase().replace(/\s+/g, '');
        var hSize = headingSizes[key];
        var align = mapAlign(pPr && kid(pPr, 'jc') ? attr(kid(pPr, 'jc'), 'w:val') : st.align);
        var bullet = pPr && kid(pPr, 'numPr') ? '•' : '';
        var indent = 0;
        if (pPr && kid(pPr, 'ind')) {
          var left = parseInt(attr(kid(pPr, 'ind'), 'w:left') || attr(kid(pPr, 'ind'), 'w:start'), 10) || 0;
          indent = Math.min(160, left / 20);
        }
        if (pPr && kid(pPr, 'pageBreakBefore') && onOff(kid(pPr, 'pageBreakBefore'))) out.push({ type: 'pagebreak' });

        var runs = [];
        var trailing = [];

        function handleRun(r) {
          var rPr = kid(r, 'rPr');
          var run = {
            size: hSize || st.size || defSize,
            bold: hSize ? true : !!st.bold,
            italic: !!st.italic,
            color: st.color || '',
            fontName: st.font || defFont
          };
          if (rPr) {
            var sz = kid(rPr, 'sz') || kid(rPr, 'szCs');
            if (sz) run.size = (parseInt(attr(sz, 'w:val'), 10) || 22) / 2;
            if (kid(rPr, 'b')) run.bold = onOff(kid(rPr, 'b'));
            if (kid(rPr, 'i')) run.italic = onOff(kid(rPr, 'i'));
            if (kid(rPr, 'u') && attr(kid(rPr, 'u'), 'w:val') !== 'none') run.underline = true;
            var col = kid(rPr, 'color');
            if (col && /^[0-9a-f]{6}$/i.test(attr(col, 'w:val'))) run.color = '#' + attr(col, 'w:val');
            var rf = kid(rPr, 'rFonts');
            if (rf) run.fontName = attr(rf, 'w:ascii') || attr(rf, 'w:hAnsi') || attr(rf, 'w:cs') || run.fontName;
          }
          run.font = isBijoyFontName(run.fontName) ? 'bijoy' : 'uni';
          var text = '';
          kids(r).forEach(function (c) {
            var ln = c.localName;
            if (ln === 't') text += c.textContent || '';
            else if (ln === 'tab') text += '\t';
            else if (ln === 'br' || ln === 'cr') {
              if (attr(c, 'w:type') === 'page') {
                if (text) { runs.push(Object.assign({}, run, { text: text })); text = ''; }
                trailing.push({ type: 'pagebreak' });
              } else {
                text += '\n';
              }
            } else if (ln === 'drawing' || ln === 'pict' || ln === 'object') {
              var blip = desc(c, 'blip')[0];
              var rid = blip ? (blip.getAttribute('r:embed') || blip.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed')) : '';
              if (!rid) {
                var imd = desc(c, 'imagedata')[0];
                rid = imd ? (imd.getAttribute('r:id') || '') : '';
              }
              var ext = desc(c, 'extent')[0];
              var wPt = ext ? (parseInt(ext.getAttribute('cx'), 10) || 0) / 12700 : 0;
              var hPt = ext ? (parseInt(ext.getAttribute('cy'), 10) || 0) / 12700 : 0;
              if (rid && rels[rid]) {
                trailing.push({ type: 'image', path: resolvePath('word/', rels[rid].target), widthPt: wPt, heightPt: hPt, align: align });
              }
            }
          });
          if (text) runs.push(Object.assign({}, run, { text: text }));
        }

        (function walk(node) {
          kids(node).forEach(function (c) {
            var ln = c.localName;
            if (ln === 'r') handleRun(c);
            else if (ln === 'hyperlink' || ln === 'smartTag' || ln === 'ins' || ln === 'sdt' || ln === 'sdtContent' || ln === 'fldSimple' || ln === 'customXml') walk(c);
          });
        })(p);

        // Auto-detect Bijoy text typed in a Unicode-named font (common in Bangladeshi docs)
        runs.forEach(function (rr) {
          if (rr.font !== 'bijoy' && detectScript(rr.text) === 'bijoy' && /[A-Za-z]/.test(rr.text) && !/[\u0980-\u09FF]/.test(rr.text) && isBijoyFontName(defFont)) rr.font = 'bijoy';
        });

        var imgs = trailing.filter(function (t) { return t.type === 'image'; });
        var breaks = trailing.filter(function (t) { return t.type === 'pagebreak'; });
        if (runs.length || !imgs.length) {
          out.push({
            type: 'para',
            runs: runs.length ? runs : [{ text: '', size: hSize || st.size || defSize }],
            align: align,
            bullet: bullet,
            indent: indent,
            spaceBefore: hSize ? 8 : 0,
            spaceAfter: hSize ? 6 : 5
          });
        }
        imgs.forEach(function (im) { out.push(im); pending.push(im); });
        breaks.forEach(function (b) { out.push(b); });
      }

      function tableToBlock(tbl) {
        var rows = [];
        kids(tbl, 'tr').forEach(function (tr) {
          var row = [];
          kids(tr, 'tc').forEach(function (tc) {
            var bijoy = false;
            var text = kids(tc, 'p').map(function (p) {
              return desc(p, 'r').map(function (r) {
                var rf = desc(r, 'rFonts')[0];
                if (rf && isBijoyFontName(attr(rf, 'w:ascii'))) bijoy = true;
                return desc(r, 't').map(function (t) { return t.textContent; }).join('');
              }).join('');
            }).join('\n');
            row.push({ text: text, font: bijoy ? 'bijoy' : '' });
          });
          rows.push(row);
        });
        return { type: 'table', rows: rows, header: true, stretch: true, fontSize: Math.max(8, defSize - 1) };
      }

      kids(body).forEach(function (el) {
        if (el.localName === 'p') paraToBlocks(el, blocks);
        else if (el.localName === 'tbl') blocks.push(tableToBlock(el));
        else if (el.localName === 'sdt') {
          desc(el, 'p').forEach(function (p) { paraToBlocks(p, blocks); });
        }
      });

      // Resolve embedded images to data URLs
      return Promise.all(pending.map(function (im) {
        return zipImageDataUrl(zip, im.path).then(function (url) { im.src = url; });
      })).then(function () {
        return blocks.filter(function (b) { return b.type !== 'image' || b.src; });
      });
    });
  }

  /* ==================================================================
   * LEGACY .DOC (Word 97-2003 binary) → TEXT (best-effort)
   * ================================================================== */
  function docBinaryToText(buffer) {
    var u8 = new Uint8Array(buffer);
    function score(s) {
      var good = (s.match(/[A-Za-z\u0980-\u09FF0-9\s.,;:!?'"()\-]/g) || []).length;
      return good / Math.max(1, s.length);
    }
    // UTF-16LE runs
    var runs16 = [], cur = '';
    for (var i = 0; i + 1 < u8.length; i += 2) {
      var code = u8[i] | (u8[i + 1] << 8);
      var ok = code === 13 || code === 9 || code === 11 || (code >= 32 && code < 0xD800 && !(code >= 0x7F && code < 0xA0));
      if (ok) cur += String.fromCharCode(code === 13 || code === 11 ? 10 : code);
      else {
        if (cur.length >= 12 && score(cur) > 0.7 && / /.test(cur)) runs16.push(cur);
        cur = '';
      }
    }
    if (cur.length >= 12) runs16.push(cur);
    // 8-bit (cp1252 "compressed") runs
    var runs8 = [];
    cur = '';
    var dec = new TextDecoder('windows-1252');
    var start = -1;
    for (var j = 0; j <= u8.length; j++) {
      var b = j < u8.length ? u8[j] : 0;
      var ok8 = b === 13 || b === 9 || (b >= 32 && b !== 127);
      if (ok8) {
        if (start < 0) start = j;
      } else {
        if (start >= 0 && j - start >= 20) {
          var s = dec.decode(u8.subarray(start, j)).replace(/\r/g, '\n');
          if (score(s) > 0.75 && / /.test(s)) runs8.push(s);
        }
        start = -1;
      }
    }
    var t16 = runs16.join('\n'), t8 = runs8.join('\n');
    var text = t16.replace(/\s/g, '').length >= t8.replace(/\s/g, '').length ? t16 : t8;
    return text.replace(/\n{3,}/g, '\n\n').trim();
  }

  /* ==================================================================
   * RTF → TEXT (simple control-word stripper)
   * ================================================================== */
  function rtfToText(rtf) {
    var out = '';
    var depth = 0, skipDepth = -1;
    var i = 0;
    while (i < rtf.length) {
      var ch = rtf.charAt(i);
      if (ch === '{') { depth++; i++; continue; }
      if (ch === '}') { if (depth === skipDepth) skipDepth = -1; depth--; i++; continue; }
      if (skipDepth >= 0 && depth >= skipDepth) { i++; continue; }
      if (ch === '\\') {
        var nx = rtf.charAt(i + 1);
        if (nx === '*') { skipDepth = depth; i += 2; continue; }
        if (nx === '\\' || nx === '{' || nx === '}') { out += nx; i += 2; continue; }
        if (nx === "'") { out += String.fromCharCode(parseInt(rtf.substr(i + 2, 2), 16)); i += 4; continue; }
        var m = /^\\([a-z]+)(-?\d+)? ?/i.exec(rtf.slice(i, i + 40));
        if (m) {
          var w = m[1];
          if (w === 'par' || w === 'line') out += '\n';
          else if (w === 'tab') out += '\t';
          else if (w === 'u') out += String.fromCharCode((parseInt(m[2], 10) + 65536) % 65536);
          else if (/^(fonttbl|colortbl|stylesheet|info|pict|header|footer)$/.test(w)) skipDepth = depth;
          i += m[0].length;
          if (w === 'u' && rtf.charAt(i) === '?') i++;
          continue;
        }
        i += 2;
        continue;
      }
      if (ch !== '\r' && ch !== '\n') out += ch;
      i++;
    }
    return out.trim();
  }

  /* ==================================================================
   * PPTX → PDF (one page per slide)
   * ================================================================== */
  function pptxToPdf(buffer, onProgress) {
    var zip;
    var themeColors = {};
    return window.JSZip.loadAsync(buffer).then(function (z) {
      zip = z;
      return Promise.all([
        zipText(zip, 'ppt/presentation.xml'),
        zipText(zip, 'ppt/_rels/presentation.xml.rels')
      ]);
    }).then(function (res) {
      if (!res[0]) throw new Error('সঠিক .pptx ফাইল নয়');
      var pres = parseXml(res[0]);
      var presRels = relsMap(res[1]);
      var sz = desc(pres, 'sldSz')[0];
      var cx = sz ? parseInt(sz.getAttribute('cx'), 10) : 9144000;
      var cy = sz ? parseInt(sz.getAttribute('cy'), 10) : 6858000;
      var slidePaths = desc(pres, 'sldId').map(function (s) {
        var rid = s.getAttribute('r:id') || s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
        return presRels[rid] ? resolvePath('ppt/', presRels[rid].target) : '';
      }).filter(Boolean);

      var themePath = '';
      Object.keys(presRels).forEach(function (k) {
        if (/theme/.test(presRels[k].target)) themePath = resolvePath('ppt/', presRels[k].target);
      });

      return zipText(zip, themePath || 'ppt/theme/theme1.xml').then(function (themeXml) {
        if (themeXml) {
          var cs = desc(parseXml(themeXml), 'clrScheme')[0];
          kids(cs).forEach(function (c) {
            var s = kid(c, 'srgbClr'), sys = kid(c, 'sysClr');
            themeColors[c.localName] = s ? '#' + s.getAttribute('val') : (sys ? '#' + (sys.getAttribute('lastClr') || '000000') : '');
          });
        }
        themeColors.tx1 = themeColors.dk1 || '#000000';
        themeColors.bg1 = themeColors.lt1 || '#ffffff';
        themeColors.tx2 = themeColors.dk2 || themeColors.tx1;
        themeColors.bg2 = themeColors.lt2 || themeColors.bg1;

        var CW = 1600;
        var k = CW / cx;
        var CH = Math.round(cy * k);
        var canvases = [];
        var chain = ensureFonts();

        slidePaths.forEach(function (sp, si) {
          chain = chain.then(function () {
            if (onProgress) onProgress(si + 1, slidePaths.length);
            return renderSlide(sp).then(function (c) { canvases.push(c); });
          });
        });

        function colorOf(el) {
          if (!el) return '';
          var s = kid(el, 'srgbClr');
          if (s) return '#' + s.getAttribute('val');
          var sc = kid(el, 'schemeClr');
          if (sc) return themeColors[sc.getAttribute('val')] || '';
          var sys = kid(el, 'sysClr');
          if (sys) return '#' + (sys.getAttribute('lastClr') || '000000');
          var p = kid(el, 'prstClr');
          if (p) return p.getAttribute('val');
          return '';
        }

        function xfrmOf(el) {
          var x = desc(el, 'xfrm')[0];
          if (!x) return null;
          var off = kid(x, 'off'), ext = kid(x, 'ext');
          if (!off || !ext) return null;
          var r = {
            x: parseInt(off.getAttribute('x'), 10) || 0,
            y: parseInt(off.getAttribute('y'), 10) || 0,
            w: parseInt(ext.getAttribute('cx'), 10) || 0,
            h: parseInt(ext.getAttribute('cy'), 10) || 0
          };
          var co = kid(x, 'chOff'), ce = kid(x, 'chExt');
          if (co && ce) {
            r.chx = parseInt(co.getAttribute('x'), 10) || 0;
            r.chy = parseInt(co.getAttribute('y'), 10) || 0;
            r.chw = parseInt(ce.getAttribute('cx'), 10) || 1;
            r.chh = parseInt(ce.getAttribute('cy'), 10) || 1;
          }
          return r;
        }

        function phKey(sp) {
          var ph = desc(sp, 'ph')[0];
          if (!ph) return null;
          return { type: ph.getAttribute('type') || 'body', idx: ph.getAttribute('idx') || '' };
        }

        function collectPh(xmlDoc) {
          var map = {};
          desc(xmlDoc, 'sp').forEach(function (sp) {
            var key = phKey(sp);
            var xf = xfrmOf(kid(sp, 'spPr'));
            if (key && xf) {
              if (key.idx) map['idx:' + key.idx] = xf;
              if (!map['type:' + key.type]) map['type:' + key.type] = xf;
            }
          });
          return map;
        }

        function bgColor(xmlDoc) {
          var bg = desc(xmlDoc, 'bg')[0];
          if (!bg) return '';
          var fill = desc(bg, 'solidFill')[0];
          if (fill) return colorOf(fill);
          var ref = desc(bg, 'bgRef')[0];
          return ref ? colorOf(ref) : '';
        }

        function renderSlide(path) {
          var dir = path.replace(/[^/]+$/, '');
          var relPath = dir + '_rels/' + path.split('/').pop() + '.rels';
          var slideDoc, rels, layoutDoc = null, masterDoc = null;
          return Promise.all([zipText(zip, path), zipText(zip, relPath)]).then(function (r) {
            slideDoc = parseXml(r[0]);
            rels = relsMap(r[1]);
            var layoutTarget = '';
            Object.keys(rels).forEach(function (id) {
              if (/slideLayout/.test(rels[id].target)) layoutTarget = resolvePath(dir, rels[id].target);
            });
            if (!layoutTarget) return;
            var lDir = layoutTarget.replace(/[^/]+$/, '');
            return Promise.all([zipText(zip, layoutTarget), zipText(zip, lDir + '_rels/' + layoutTarget.split('/').pop() + '.rels')]).then(function (lr) {
              layoutDoc = parseXml(lr[0]);
              var lrels = relsMap(lr[1]);
              var mt = '';
              Object.keys(lrels).forEach(function (id) {
                if (/slideMaster/.test(lrels[id].target)) mt = resolvePath(lDir, lrels[id].target);
              });
              if (mt) return zipText(zip, mt).then(function (mx) { masterDoc = parseXml(mx); });
            });
          }).then(function () {
            var layoutPh = layoutDoc ? collectPh(layoutDoc) : {};
            var masterPh = masterDoc ? collectPh(masterDoc) : {};
            var canvas = document.createElement('canvas');
            canvas.width = CW;
            canvas.height = CH;
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = bgColor(slideDoc) || (layoutDoc && bgColor(layoutDoc)) || (masterDoc && bgColor(masterDoc)) || '#ffffff';
            ctx.fillRect(0, 0, CW, CH);

            var ops = []; // ordered drawing operations (images need async loading first)

            function mapRect(xf, T) {
              return {
                x: (xf.x * T.sx + T.tx) * k,
                y: (xf.y * T.sy + T.ty) * k,
                w: xf.w * T.sx * k,
                h: xf.h * T.sy * k
              };
            }

            function walk(tree, T) {
              kids(tree).forEach(function (el) {
                var ln = el.localName;
                if (ln === 'grpSp') {
                  var gx = xfrmOf(kid(el, 'grpSpPr'));
                  var T2 = T;
                  if (gx && gx.chw) {
                    var ax = gx.w / gx.chw, ay = gx.h / gx.chh;
                    T2 = { sx: T.sx * ax, sy: T.sy * ay, tx: T.sx * (gx.x - gx.chx * ax) + T.tx, ty: T.sy * (gx.y - gx.chy * ay) + T.ty };
                  }
                  walk(el, T2);
                } else if (ln === 'sp' || ln === 'cxnSp') {
                  var key = phKey(el);
                  var xf = xfrmOf(kid(el, 'spPr'));
                  if (!xf && key) {
                    xf = (key.idx && (layoutPh['idx:' + key.idx] || masterPh['idx:' + key.idx])) ||
                      layoutPh['type:' + key.type] || masterPh['type:' + key.type] ||
                      (/title/i.test(key.type) ? masterPh['type:title'] : masterPh['type:body']) || null;
                  }
                  if (!xf) {
                    if (!key) return;
                    xf = /title/i.test(key.type) ? { x: cx * 0.06, y: cy * 0.05, w: cx * 0.88, h: cy * 0.17 } : { x: cx * 0.06, y: cy * 0.25, w: cx * 0.88, h: cy * 0.68 };
                  }
                  ops.push({ kind: 'shape', el: el, rect: mapRect(xf, T), ph: key });
                } else if (ln === 'pic') {
                  var pxf = xfrmOf(kid(el, 'spPr'));
                  var blip = desc(el, 'blip')[0];
                  var rid = blip ? (blip.getAttribute('r:embed') || blip.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed')) : '';
                  if (pxf && rid && rels[rid]) ops.push({ kind: 'pic', rect: mapRect(pxf, T), path: resolvePath(dir, rels[rid].target) });
                } else if (ln === 'graphicFrame') {
                  var gxf = xfrmOf(el);
                  var tbl = desc(el, 'tbl')[0];
                  if (gxf && tbl) ops.push({ kind: 'table', rect: mapRect(gxf, T), tbl: tbl });
                }
              });
            }

            var spTree = desc(slideDoc, 'spTree')[0];
            walk(spTree, { sx: 1, sy: 1, tx: 0, ty: 0 });

            return Promise.all(ops.map(function (op) {
              if (op.kind !== 'pic') return null;
              return zipImageDataUrl(zip, op.path).then(loadImageOrNull).then(function (im) { op.img = im; });
            })).then(function () {
              ops.forEach(function (op) {
                if (op.kind === 'pic' && op.img) ctx.drawImage(op.img, op.rect.x, op.rect.y, op.rect.w, op.rect.h);
                else if (op.kind === 'shape') drawShape(ctx, op);
                else if (op.kind === 'table') drawPptTable(ctx, op);
              });
              return canvas;
            });
          });
        }

        function loadImageOrNull(url) { return url ? loadImage(url) : null; }

        function drawShape(ctx, op) {
          var el = op.el, R = op.rect;
          var spPr = kid(el, 'spPr');
          var geom = spPr ? desc(spPr, 'prstGeom')[0] : null;
          var prst = geom ? geom.getAttribute('prst') : 'rect';
          var fillEl = spPr ? kid(spPr, 'solidFill') : null;
          var fill = fillEl ? colorOf(fillEl) : '';
          if (!fill) {
            var styleFill = desc(el, 'fillRef')[0];
            if (styleFill && !op.ph && spPr && !kid(spPr, 'noFill') && el.localName === 'sp' && geom) fill = colorOf(styleFill);
          }
          var ln = spPr ? kid(spPr, 'ln') : null;
          var lineColor = ln && kid(ln, 'solidFill') ? colorOf(kid(ln, 'solidFill')) : '';
          if (el.localName === 'cxnSp' && !lineColor) lineColor = '#64748b';
          ctx.save();
          ctx.beginPath();
          if (prst === 'ellipse') ctx.ellipse(R.x + R.w / 2, R.y + R.h / 2, Math.abs(R.w / 2), Math.abs(R.h / 2), 0, 0, Math.PI * 2);
          else if (prst === 'roundRect' && ctx.roundRect) ctx.roundRect(R.x, R.y, R.w, R.h, Math.min(R.w, R.h) * 0.16);
          else if (el.localName === 'cxnSp' || prst === 'line') { ctx.moveTo(R.x, R.y); ctx.lineTo(R.x + R.w, R.y + R.h); }
          else ctx.rect(R.x, R.y, R.w, R.h);
          if (fill && el.localName !== 'cxnSp') { ctx.fillStyle = fill; ctx.fill(); }
          if (lineColor) {
            var wEmu = parseInt(ln && ln.getAttribute('w'), 10) || 12700;
            ctx.lineWidth = Math.max(1, wEmu * k);
            ctx.strokeStyle = lineColor;
            ctx.stroke();
          }
          ctx.restore();

          var tx = kid(el, 'txBody');
          if (tx) drawTextBody(ctx, tx, R, op.ph);
        }

        function drawTextBody(ctx, tx, R, ph) {
          var bodyPr = kid(tx, 'bodyPr');
          var lIns = 91440 * k, rIns = 91440 * k, tIns = 45720 * k, bIns = 45720 * k;
          if (bodyPr) {
            if (bodyPr.getAttribute('lIns')) lIns = parseInt(bodyPr.getAttribute('lIns'), 10) * k;
            if (bodyPr.getAttribute('rIns')) rIns = parseInt(bodyPr.getAttribute('rIns'), 10) * k;
            if (bodyPr.getAttribute('tIns')) tIns = parseInt(bodyPr.getAttribute('tIns'), 10) * k;
            if (bodyPr.getAttribute('bIns')) bIns = parseInt(bodyPr.getAttribute('bIns'), 10) * k;
          }
          var anchor = bodyPr ? bodyPr.getAttribute('anchor') : '';
          var fontScale = 1;
          var auto = bodyPr ? kid(bodyPr, 'normAutofit') : null;
          if (auto && auto.getAttribute('fontScale')) fontScale = parseInt(auto.getAttribute('fontScale'), 10) / 100000;
          var type = ph ? ph.type : '';
          var defPt = /ctrTitle/.test(type) ? 44 : (/title/i.test(type) ? 36 : (/subTitle/.test(type) ? 24 : (ph ? 22 : 18)));
          if (!anchor && /title/i.test(type)) anchor = 'ctr';
          var pxPerPt = 12700 * k * fontScale;
          var maxW = Math.max(10, R.w - lIns - rIns);

          var paraLayouts = [];
          kids(tx, 'p').forEach(function (p) {
            var pPr = kid(p, 'pPr');
            var lvl = pPr ? parseInt(pPr.getAttribute('lvl'), 10) || 0 : 0;
            var algn = pPr ? pPr.getAttribute('algn') : '';
            var align = algn === 'ctr' ? 'center' : (algn === 'r' ? 'right' : (/title/i.test(type) && /ctr/i.test(type) ? 'center' : 'left'));
            var levelPt = defPt - (ph && !/title/i.test(type) ? lvl * 2 : 0);
            var runs = [];
            kids(p).forEach(function (c) {
              if (c.localName === 'r' || c.localName === 'fld') {
                var rPr = kid(c, 'rPr');
                var t = kid(c, 't');
                var run = { text: t ? t.textContent : '', size: levelPt, color: themeColors.tx1 || '#000000' };
                if (rPr) {
                  if (rPr.getAttribute('sz')) run.size = parseInt(rPr.getAttribute('sz'), 10) / 100;
                  if (rPr.getAttribute('b') === '1') run.bold = true;
                  if (rPr.getAttribute('i') === '1') run.italic = true;
                  if (rPr.getAttribute('u') && rPr.getAttribute('u') !== 'none') run.underline = true;
                  var f = kid(rPr, 'solidFill');
                  if (f && colorOf(f)) run.color = colorOf(f);
                  var latin = kid(rPr, 'latin') || kid(rPr, 'cs');
                  if (latin && isBijoyFontName(latin.getAttribute('typeface'))) run.font = 'bijoy';
                }
                if (!run.font && detectScript(run.text) === 'bijoy' && !/[\u0980-\u09FF]/.test(run.text)) run.font = 'bijoy';
                if (/title/i.test(type) && !rPr) run.bold = false;
                runs.push(run);
              } else if (c.localName === 'br') {
                runs.push({ text: '\n', size: levelPt });
              }
            });
            var endPr = kid(p, 'endParaRPr');
            var emptySize = endPr && endPr.getAttribute('sz') ? parseInt(endPr.getAttribute('sz'), 10) / 100 : levelPt;
            var hasText = runs.some(function (r) { return r.text && r.text.trim(); });
            var bullet = '';
            if (hasText && ph && !/title/i.test(type) && !/subTitle/.test(type) && !(pPr && kid(pPr, 'buNone'))) bullet = '•';
            if (pPr && kid(pPr, 'buChar')) bullet = kid(pPr, 'buChar').getAttribute('char') || '•';
            if (pPr && kid(pPr, 'buNone')) bullet = '';
            var indent = lvl * 0.35 * 72 * pxPerPt;
            var bulletW = 0;
            if (bullet) {
              ctx.font = fontCss({ size: (runs[0] && runs[0].size) || levelPt }, pxPerPt);
              bulletW = ctx.measureText(bullet + '  ').width;
            }
            var lines = layoutRuns(ctx, runs.length ? runs : [{ text: '', size: emptySize }], Math.max(10, maxW - indent - bulletW), pxPerPt, emptySize);
            paraLayouts.push({ lines: lines, align: align, bullet: bullet, indent: indent, bulletW: bulletW, color: (runs[0] && runs[0].color) || themeColors.tx1 });
          });

          var totalH = 0;
          paraLayouts.forEach(function (pl) {
            pl.lines.forEach(function (l) { totalH += l.maxPx * 1.2; });
          });
          var y = R.y + tIns;
          if (anchor === 'ctr') y = R.y + (R.h - totalH) / 2;
          else if (anchor === 'b') y = R.y + R.h - bIns - totalH;

          ctx.save();
          ctx.textBaseline = 'alphabetic';
          paraLayouts.forEach(function (pl) {
            pl.lines.forEach(function (ln, li) {
              var lh = ln.maxPx * 1.2;
              var left = R.x + lIns + pl.indent + pl.bulletW;
              var x0 = left;
              if (pl.align === 'center') x0 = left + (maxW - pl.indent - pl.bulletW - ln.w) / 2;
              else if (pl.align === 'right') x0 = left + (maxW - pl.indent - pl.bulletW - ln.w);
              var baseline = y + ln.maxPx * 0.98;
              if (li === 0 && pl.bullet) {
                ctx.font = fontCss({ size: ln.maxPx / pxPerPt }, pxPerPt);
                ctx.fillStyle = pl.color || '#000';
                ctx.fillText(pl.bullet, R.x + lIns + pl.indent, baseline);
              }
              drawLine(ctx, ln, x0, baseline);
              y += lh;
            });
          });
          ctx.restore();
        }

        function drawPptTable(ctx, op) {
          var R = op.rect, tbl = op.tbl;
          var cols = desc(tbl, 'gridCol').map(function (g) { return (parseInt(g.getAttribute('w'), 10) || 0) * k; });
          var sumW = cols.reduce(function (a, v) { return a + v; }, 0) || R.w;
          var sx = R.w / sumW;
          cols = cols.map(function (w) { return w * sx; });
          var rows = kids(tbl, 'tr');
          var y = R.y;
          var pxPerPt = 12700 * k;
          rows.forEach(function (tr, ri) {
            var rh = (parseInt(tr.getAttribute('h'), 10) || 370840) * k;
            var cells = kids(tr, 'tc');
            var layouts = cells.map(function (tc, ci) {
              var runs = [];
              desc(tc, 'p').forEach(function (p, pi) {
                if (pi) runs.push({ text: '\n', size: 14 });
                desc(p, 'r').forEach(function (r) {
                  var rPr = kid(r, 'rPr');
                  runs.push({
                    text: (kid(r, 't') || {}).textContent || '',
                    size: rPr && rPr.getAttribute('sz') ? parseInt(rPr.getAttribute('sz'), 10) / 100 : 14,
                    bold: ri === 0 || (rPr && rPr.getAttribute('b') === '1'),
                    color: '#0f172a'
                  });
                });
              });
              return layoutRuns(ctx, runs, Math.max(10, (cols[ci] || 50) - 12), pxPerPt, 14);
            });
            layouts.forEach(function (l) {
              var h = l.reduce(function (a, ln) { return a + ln.maxPx * 1.25; }, 0) + 12;
              if (h > rh) rh = h;
            });
            var x = R.x;
            cells.forEach(function (tc, ci) {
              var w = cols[ci] || 50;
              var fill = desc(tc, 'solidFill')[0];
              ctx.fillStyle = (fill && colorOf(fill)) || (ri === 0 ? '#e2e8f0' : (ri % 2 ? '#ffffff' : '#f8fafc'));
              ctx.fillRect(x, y, w, rh);
              ctx.strokeStyle = '#94a3b8';
              ctx.lineWidth = 1;
              ctx.strokeRect(x, y, w, rh);
              var ty = y + 6;
              (layouts[ci] || []).forEach(function (ln) {
                drawLine(ctx, ln, x + 6, ty + ln.maxPx);
                ty += ln.maxPx * 1.25;
              });
              x += w;
            });
            y += rh;
          });
        }

        return chain.then(function () {
          if (!canvases.length) throw new Error('প্রেজেন্টেশনে কোনো স্লাইড পাওয়া যায়নি');
          return canvasesToPdf(canvases, cx / 12700, cy / 12700, 0.9);
        });
      });
    });
  }

  /* ==================================================================
   * XLSX → BLOCKS (every sheet as a table)
   * ================================================================== */
  function colIndex(ref) {
    var m = /^([A-Z]+)/.exec(ref || '');
    if (!m) return 0;
    var n = 0;
    for (var i = 0; i < m[1].length; i++) n = n * 26 + (m[1].charCodeAt(i) - 64);
    return n - 1;
  }

  function xlsxToBlocks(buffer) {
    var zip;
    return window.JSZip.loadAsync(buffer).then(function (z) {
      zip = z;
      return Promise.all([
        zipText(zip, 'xl/workbook.xml'),
        zipText(zip, 'xl/_rels/workbook.xml.rels'),
        zipText(zip, 'xl/sharedStrings.xml')
      ]);
    }).then(function (res) {
      if (!res[0]) throw new Error('সঠিক .xlsx ফাইল নয়');
      var wb = parseXml(res[0]);
      var rels = relsMap(res[1]);
      var shared = [];
      if (res[2]) {
        desc(parseXml(res[2]), 'si').forEach(function (si) {
          shared.push(desc(si, 't').map(function (t) { return t.textContent; }).join(''));
        });
      }
      var sheets = desc(wb, 'sheet').map(function (s) {
        var rid = s.getAttribute('r:id') || s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
        return { name: s.getAttribute('name'), path: rels[rid] ? resolvePath('xl/', rels[rid].target) : '' };
      }).filter(function (s) { return s.path; });

      var blocks = [];
      var chain = Promise.resolve();
      sheets.forEach(function (sh) {
        chain = chain.then(function () {
          return zipText(zip, sh.path).then(function (xml) {
            if (!xml) return;
            var d = parseXml(xml);
            var grid = [];
            var maxC = 0;
            desc(d, 'row').slice(0, 1000).forEach(function (row) {
              var rIdx = (parseInt(row.getAttribute('r'), 10) || (grid.length + 1)) - 1;
              if (rIdx > 1500) return;
              var cells = [];
              kids(row, 'c').forEach(function (c) {
                var ci = colIndex(c.getAttribute('r'));
                if (ci > 40) return;
                var t = c.getAttribute('t');
                var v = kid(c, 'v');
                var val = '';
                if (t === 's') val = shared[parseInt(v && v.textContent, 10)] || '';
                else if (t === 'inlineStr') val = desc(c, 't').map(function (x) { return x.textContent; }).join('');
                else if (t === 'b') val = v && v.textContent === '1' ? 'TRUE' : 'FALSE';
                else if (v) {
                  val = v.textContent;
                  if (/^-?\d+\.\d{6,}$/.test(val)) val = String(Math.round(parseFloat(val) * 10000) / 10000);
                }
                cells[ci] = val;
                if (val !== '' && ci + 1 > maxC) maxC = ci + 1;
              });
              grid[rIdx] = cells;
            });
            // Trim empty rows at the end and fill holes
            var rows = [];
            var lastNonEmpty = -1;
            for (var r = 0; r < grid.length; r++) {
              var cells2 = grid[r] || [];
              var arr = [];
              var any = false;
              for (var c2 = 0; c2 < maxC; c2++) {
                var vv = cells2[c2] == null ? '' : String(cells2[c2]);
                if (vv) any = true;
                arr.push(vv);
              }
              rows.push(arr);
              if (any) lastNonEmpty = r;
            }
            rows = rows.slice(0, lastNonEmpty + 1);
            if (!rows.length || !maxC) return;
            if (blocks.length) blocks.push({ type: 'pagebreak' });
            blocks.push({ type: 'table', title: sh.name, rows: rows, header: true, fontSize: maxC > 12 ? 7 : 9, maxColPt: 200 });
          });
        });
      });
      return chain.then(function () {
        if (!blocks.length) blocks.push({ type: 'para', runs: [{ text: '(খালি ওয়ার্কবুক)', size: 12 }] });
        return blocks;
      });
    });
  }

  /* ==================================================================
   * IMAGE → PDF
   * ================================================================== */
  function imageToPdf(file) {
    return readDataURL(file).then(function (url) {
      return loadImage(url).then(function (im) {
        if (!im) throw new Error('ছবিটি পড়া যায়নি');
        var isPng = /png/i.test(file.type) || /\.png$/i.test(file.name);
        var isJpg = /jpe?g/i.test(file.type) || /\.jpe?g$/i.test(file.name);
        var w = im.naturalWidth, h = im.naturalHeight;
        var bytesPromise;
        if (isJpg) bytesPromise = Promise.resolve({ bytes: dataUrlToBytes(url), png: false });
        else if (isPng) bytesPromise = Promise.resolve({ bytes: dataUrlToBytes(url), png: true });
        else {
          var c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          var cx = c.getContext('2d');
          cx.fillStyle = '#ffffff';
          cx.fillRect(0, 0, w, h);
          cx.drawImage(im, 0, 0);
          bytesPromise = Promise.resolve({ bytes: dataUrlToBytes(c.toDataURL('image/jpeg', 0.92)), png: false });
        }
        return bytesPromise.then(function (b) {
          return window.PDFLib.PDFDocument.create().then(function (pdf) {
            return (b.png ? pdf.embedPng(b.bytes) : pdf.embedJpg(b.bytes)).then(function (img) {
              var land = w > h;
              var pw = land ? A4[1] : A4[0], ph = land ? A4[0] : A4[1];
              var m = 18;
              var s = Math.min((pw - m * 2) / w, (ph - m * 2) / h, 1.5);
              var page = pdf.addPage([pw, ph]);
              page.drawImage(img, { x: (pw - w * s) / 2, y: (ph - h * s) / 2, width: w * s, height: h * s });
              return pdf.save();
            });
          });
        });
      });
    });
  }

  /* ==================================================================
   * PUBLIC: convert any supported File → PDF bytes
   * ================================================================== */
  function convertFileToPdf(file, onProgress) {
    var kind = kindOf(file);
    if (!kind) return Promise.reject(new Error(file.name + ': এই ফরম্যাট সাপোর্টেড নয়'));
    if (kind === 'pdf') return readAB(file).then(function (ab) { return { bytes: new Uint8Array(ab), kind: kind }; });
    var p;
    if (kind === 'image') p = imageToPdf(file);
    else if (kind === 'docx') p = readAB(file).then(docxToBlocks).then(function (bl) { return renderBlocksToPdf(bl); });
    else if (kind === 'pptx') p = readAB(file).then(function (ab) { return pptxToPdf(ab, onProgress); });
    else if (kind === 'xlsx') p = readAB(file).then(xlsxToBlocks).then(function (bl) {
      return renderBlocksToPdf(bl, { pageW: A4[1], pageH: A4[0], margin: 32 });
    });
    else if (kind === 'doc') p = readAB(file).then(function (ab) {
      var text = docBinaryToText(ab);
      if (!text) throw new Error('পুরনো .doc ফাইল থেকে লেখা পাওয়া যায়নি — .docx হিসেবে সেভ করে আবার চেষ্টা করুন');
      return renderBlocksToPdf(textToBlocks(text, { size: 12 }));
    });
    else if (kind === 'rtf') p = readAB(file).then(function (ab) {
      return renderBlocksToPdf(textToBlocks(rtfToText(new TextDecoder('windows-1252').decode(new Uint8Array(ab))), { size: 12 }));
    });
    else p = readAB(file).then(function (ab) {
      var text = decodeText(ab);
      return renderBlocksToPdf(textToBlocks(text, { size: 11 }));
    });
    return p.then(function (bytes) { return { bytes: bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), kind: kind }; });
  }

  /** Extracts plain text from office/text files (used by the "text → PDF" editor). */
  function extractText(file) {
    var kind = kindOf(file);
    return readAB(file).then(function (ab) {
      if (kind === 'docx') {
        return docxToBlocks(ab).then(function (bl) {
          return bl.map(function (b) {
            if (b.type === 'para') return b.runs.map(function (r) { return r.text; }).join('');
            if (b.type === 'table') return b.rows.map(function (r) { return r.map(function (c) { return c.text; }).join('\t'); }).join('\n');
            return '';
          }).join('\n');
        });
      }
      if (kind === 'doc') return docBinaryToText(ab);
      if (kind === 'rtf') return rtfToText(new TextDecoder('windows-1252').decode(new Uint8Array(ab)));
      return decodeText(ab);
    });
  }

  window.TechHatPDFConvert = {
    kindOf: kindOf,
    badgeOf: badgeOf,
    convertFileToPdf: convertFileToPdf,
    extractText: extractText,
    renderBlocksToPdf: renderBlocksToPdf,
    textToBlocks: textToBlocks,
    detectScript: detectScript
  };
})();
