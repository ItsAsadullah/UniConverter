/* TechHat Vector Export — SVG / EPS / AI generators for traced paths.
 * UMD like vector-trace-core.js. Path model comes from TechHatVectorTrace:
 * path = { fill:[r,g,b], subpaths:[{ start:[x,y], segs:[{c:[6]}|{l:[2]}] }], hidden } */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TechHatVectorExport = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function n(v) {
    var r = Math.round(v * 1000) / 1000;
    return String(r);
  }
  function hex(fill) {
    var h = function (c) { var s = Math.round(c).toString(16); return s.length < 2 ? '0' + s : s; };
    return '#' + h(fill[0]) + h(fill[1]) + h(fill[2]);
  }
  function visiblePaths(result) {
    return result.paths.filter(function (p) { return !p.hidden && p.subpaths.length; });
  }

  /* ============================== SVG ============================== */

  function subpathToSvgD(sp) {
    var d = 'M' + n(sp.start[0]) + ' ' + n(sp.start[1]);
    for (var i = 0; i < sp.segs.length; i++) {
      var s = sp.segs[i];
      if (s.c) d += 'C' + n(s.c[0]) + ' ' + n(s.c[1]) + ' ' + n(s.c[2]) + ' ' + n(s.c[3]) + ' ' + n(s.c[4]) + ' ' + n(s.c[5]);
      else d += 'L' + n(s.l[0]) + ' ' + n(s.l[1]);
    }
    return d + (sp.closed === false ? '' : 'Z');
  }

  function svgStrokeAttrs(p) {
    return ' fill="none" stroke="' + hex(p.stroke || p.fill) + '" stroke-width="' + n(p.strokeWidth || 1) + '" stroke-linecap="round" stroke-linejoin="round"';
  }

  function toSvg(result, opts) {
    opts = opts || {};
    var w = opts.width || result.w, h = opts.height || result.h;
    var out = '<?xml version="1.0" encoding="UTF-8"?>\n';
    out += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n(w) + ' ' + n(h) + '" width="' + n(w) + '" height="' + n(h) + '">\n';
    if (opts.title) out += '<title>' + String(opts.title).replace(/[<>&]/g, '') + '</title>\n';
    var paths = visiblePaths(result);
    var defs = [], body = [];
    var gid = 0;
    // Paint order is significant (stacked layers), so only *consecutive*
    // same-colour paths share a <g>; gradient paths reference <defs>.
    var i = 0;
    while (i < paths.length) {
      var p = paths[i];
      if (p.isStroke) {
        var dsS = [];
        for (var ss = 0; ss < p.subpaths.length; ss++) dsS.push(subpathToSvgD(p.subpaths[ss]));
        body.push('<path' + svgStrokeAttrs(p) + ' d="' + dsS.join('') + '"/>\n');
        i++;
        continue;
      }
      if (p.gradient) {
        var id = 'thg' + (++gid);
        defs.push(svgGradient(p.gradient, id));
        var dsG = [];
        for (var s = 0; s < p.subpaths.length; s++) dsG.push(subpathToSvgD(p.subpaths[s]));
        body.push('<path fill="url(#' + id + ')"' + (p.subpaths.length > 1 ? ' fill-rule="evenodd"' : '') + ' d="' + dsG.join('') + '"/>\n');
        i++;
        continue;
      }
      var color = hex(p.fill);
      var group = [];
      while (i < paths.length && !paths[i].gradient && !paths[i].isStroke && hex(paths[i].fill) === color) { group.push(paths[i]); i++; }
      var hasHoles = group.some(function (gp) { return gp.subpaths.length > 1; });
      var g = '<g fill="' + color + '"' + (hasHoles ? ' fill-rule="evenodd"' : '') + '>\n';
      for (var j = 0; j < group.length; j++) {
        var ds = [];
        for (var k = 0; k < group[j].subpaths.length; k++) ds.push(subpathToSvgD(group[j].subpaths[k]));
        g += '<path d="' + ds.join('') + '"/>\n';
      }
      body.push(g + '</g>\n');
    }
    if (defs.length) out += '<defs>\n' + defs.join('') + '</defs>\n';
    out += body.join('');
    out += '</svg>\n';
    return out;
  }

  function svgGradient(g, id) {
    var stops = normStops(g.stops);
    var head = g.type === 'radial'
      ? '<radialGradient id="' + id + '" gradientUnits="userSpaceOnUse" cx="' + n(g.cx) + '" cy="' + n(g.cy) + '" r="' + n(g.r) + '">'
      : '<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="' + n(g.x1) + '" y1="' + n(g.y1) + '" x2="' + n(g.x2) + '" y2="' + n(g.y2) + '">';
    var body = stops.map(function (s) { return '<stop offset="' + n(s.o) + '" stop-color="' + hex(s.c) + '"/>'; }).join('');
    return head + body + (g.type === 'radial' ? '</radialGradient>\n' : '</linearGradient>\n');
  }

  // Sorted stops covering [0,1] with strictly increasing offsets.
  function normStops(stops) {
    var s = (stops || []).map(function (x) { return { o: Math.max(0, Math.min(1, +x.o || 0)), c: x.c.slice() }; })
      .sort(function (a, b) { return a.o - b.o; });
    if (!s.length) s = [{ o: 0, c: [0, 0, 0] }];
    if (s[0].o > 0) s.unshift({ o: 0, c: s[0].c.slice() });
    if (s[s.length - 1].o < 1) s.push({ o: 1, c: s[s.length - 1].c.slice() });
    var out = [s[0]];
    for (var i = 1; i < s.length; i++) {
      if (s[i].o - out[out.length - 1].o < 1e-4) { if (i === s.length - 1) out[out.length - 1] = s[i]; continue; }
      out.push(s[i]);
    }
    if (out.length === 1) out.push({ o: 1, c: out[0].c.slice() });
    out[0].o = 0; out[out.length - 1].o = 1;
    return out;
  }

  // PostScript / PDF shading dictionary (identical syntax in both).
  // Coordinates are already y-flipped by the caller.
  function shadingDict(g, h, cmyk) {
    var stops = normStops(g.stops);
    var col = function (c) {
      if (cmyk) { var k = rgbToCmyk(c); return '[' + n(k[0]) + ' ' + n(k[1]) + ' ' + n(k[2]) + ' ' + n(k[3]) + ']'; }
      return '[' + n(c[0] / 255) + ' ' + n(c[1] / 255) + ' ' + n(c[2] / 255) + ']';
    };
    var seg = function (a, b) { return '<< /FunctionType 2 /Domain [0 1] /C0 ' + col(a.c) + ' /C1 ' + col(b.c) + ' /N 1 >>'; };
    var fn;
    if (stops.length === 2) fn = seg(stops[0], stops[1]);
    else {
      var fns = [], bounds = [], enc = [];
      for (var i = 0; i + 1 < stops.length; i++) { fns.push(seg(stops[i], stops[i + 1])); enc.push('0 1'); }
      for (var j = 1; j + 1 < stops.length; j++) bounds.push(n(stops[j].o));
      fn = '<< /FunctionType 3 /Domain [0 1] /Functions [' + fns.join(' ') + '] /Bounds [' + bounds.join(' ') + '] /Encode [' + enc.join(' ') + '] >>';
    }
    var cs = cmyk ? '/DeviceCMYK' : '/DeviceRGB';
    var coords = g.type === 'radial'
      ? '/ShadingType 3 /Coords [' + n(g.cx) + ' ' + n(h - g.cy) + ' 0 ' + n(g.cx) + ' ' + n(h - g.cy) + ' ' + n(g.r) + ']'
      : '/ShadingType 2 /Coords [' + n(g.x1) + ' ' + n(h - g.y1) + ' ' + n(g.x2) + ' ' + n(h - g.y2) + ']';
    return '<< ' + coords + ' /ColorSpace ' + cs + ' /Function ' + fn + ' /Extend [true true] >>';
  }

  /* ============================== EPS ============================== */

  // EPS is y-up; flip y. Q→C conversion happens here too.
  function subpathToEpsOps(sp, h) {
    var ops = [];
    var flip = function (y) { return h - y; };
    ops.push(n(sp.start[0]) + ' ' + n(flip(sp.start[1])) + ' moveto');
    for (var i = 0; i < sp.segs.length; i++) {
      var s = sp.segs[i];
      if (s.c) {
        ops.push(n(s.c[0]) + ' ' + n(flip(s.c[1])) + ' ' + n(s.c[2]) + ' ' + n(flip(s.c[3])) + ' ' + n(s.c[4]) + ' ' + n(flip(s.c[5])) + ' curveto');
      } else {
        ops.push(n(s.l[0]) + ' ' + n(flip(s.l[1])) + ' lineto');
      }
    }
    if (sp.closed !== false) ops.push('closepath');
    return ops;
  }

  function rgbToCmyk(fill) {
    var r = fill[0] / 255, g = fill[1] / 255, b = fill[2] / 255;
    var k = 1 - Math.max(r, g, b);
    if (k >= 1) return [0, 0, 0, 1];
    return [
      (1 - r - k) / (1 - k),
      (1 - g - k) / (1 - k),
      (1 - b - k) / (1 - k),
      k
    ];
  }

  function toEps(result, opts) {
    opts = opts || {};
    var w = opts.width || result.w, h = opts.height || result.h;
    var cmyk = opts.colorSpace === 'cmyk';
    var out = '%!PS-Adobe-3.0 EPSF-3.0\n';
    out += '%%Creator: TechHat Studio Vector Converter\n';
    out += '%%Title: (' + (opts.title || 'vector') + ')\n';
    out += '%%BoundingBox: 0 0 ' + Math.ceil(w) + ' ' + Math.ceil(h) + '\n';
    out += '%%HiResBoundingBox: 0 0 ' + n(w) + ' ' + n(h) + '\n';
    out += '%%LanguageLevel: 3\n';
    out += '%%EndComments\n';
    var paths = visiblePaths(result);
    for (var i = 0; i < paths.length; i++) {
      out += 'gsave\n';
      var hasHoles = paths[i].subpaths.length > 1;
      if (paths[i].isStroke) {
        var sc = paths[i].stroke || paths[i].fill;
        if (cmyk) { var ck = rgbToCmyk(sc); out += n(ck[0]) + ' ' + n(ck[1]) + ' ' + n(ck[2]) + ' ' + n(ck[3]) + ' setcmykcolor\n'; }
        else out += n(sc[0] / 255) + ' ' + n(sc[1] / 255) + ' ' + n(sc[2] / 255) + ' setrgbcolor\n';
        out += n(paths[i].strokeWidth || 1) + ' setlinewidth 1 setlinecap 1 setlinejoin\nnewpath\n';
        for (var si = 0; si < paths[i].subpaths.length; si++) out += subpathToEpsOps(paths[i].subpaths[si], h).join('\n') + '\n';
        out += 'stroke\ngrestore\n';
        continue;
      }
      if (paths[i].gradient) {
        // clip to the shape, then paint a smooth PostScript-3 shading
        out += 'newpath\n';
        for (var g = 0; g < paths[i].subpaths.length; g++) out += subpathToEpsOps(paths[i].subpaths[g], h).join('\n') + '\n';
        out += (hasHoles ? 'eoclip\n' : 'clip\n') + 'newpath\n';
        out += shadingDict(paths[i].gradient, h, cmyk) + ' shfill\n';
        out += 'grestore\n';
        continue;
      }
      if (cmyk) {
        var c = rgbToCmyk(paths[i].fill);
        out += n(c[0]) + ' ' + n(c[1]) + ' ' + n(c[2]) + ' ' + n(c[3]) + ' setcmykcolor\n';
      } else {
        out += n(paths[i].fill[0] / 255) + ' ' + n(paths[i].fill[1] / 255) + ' ' + n(paths[i].fill[2] / 255) + ' setrgbcolor\n';
      }
      out += 'newpath\n';
      for (var j = 0; j < paths[i].subpaths.length; j++) {
        out += subpathToEpsOps(paths[i].subpaths[j], h).join('\n') + '\n';
      }
      out += (hasHoles ? 'eofill\n' : 'fill\n');
      out += 'grestore\n';
    }
    out += 'showpage\n';
    out += '%%EOF\n';
    return out;
  }

  /* ============================== AI (PDF 1.5) ============================== */

  function pdfEscapeText(s) { return String(s).replace(/([\\()])/g, '\\$1'); }

  // Content stream: y-up, `m/l/c/h` path ops + `f*` even-odd fill.
  // Gradient paths: clip (`W n`) + `/ShN sh`; shadings are collected in
  // opts._shadings so toAi can declare them in the page Resources.
  function aiContentStream(result, opts) {
    var w = opts.width || result.w, h = opts.height || result.h;
    var cmyk = opts.colorSpace === 'cmyk';
    var cs = [];
    var shadings = opts._shadings || [];
    cs.push('q');
    var paths = visiblePaths(result);
    for (var i = 0; i < paths.length; i++) {
      var grad = paths[i].gradient;
      var isStroke = !!paths[i].isStroke;
      if (isStroke) {
        var sc = paths[i].stroke || paths[i].fill;
        if (cmyk) { var ck = rgbToCmyk(sc); cs.push(n(ck[0]) + ' ' + n(ck[1]) + ' ' + n(ck[2]) + ' ' + n(ck[3]) + ' K'); }
        else cs.push(n(sc[0] / 255) + ' ' + n(sc[1] / 255) + ' ' + n(sc[2] / 255) + ' RG');
        cs.push(n(paths[i].strokeWidth || 1) + ' w 1 J 1 j');
        grad = null;
      } else if (!grad) {
        if (cmyk) {
          var c = rgbToCmyk(paths[i].fill);
          cs.push(n(c[0]) + ' ' + n(c[1]) + ' ' + n(c[2]) + ' ' + n(c[3]) + ' k');
        } else {
          cs.push(n(paths[i].fill[0] / 255) + ' ' + n(paths[i].fill[1] / 255) + ' ' + n(paths[i].fill[2] / 255) + ' rg');
        }
      } else {
        cs.push('q');
      }
      var hasHoles = paths[i].subpaths.length > 1;
      for (var j = 0; j < paths[i].subpaths.length; j++) {
        var sp = paths[i].subpaths[j];
        cs.push(n(sp.start[0]) + ' ' + n(h - sp.start[1]) + ' m');
        for (var k = 0; k < sp.segs.length; k++) {
          var s = sp.segs[k];
          if (s.c) cs.push(n(s.c[0]) + ' ' + n(h - s.c[1]) + ' ' + n(s.c[2]) + ' ' + n(h - s.c[3]) + ' ' + n(s.c[4]) + ' ' + n(h - s.c[5]) + ' c');
          else cs.push(n(s.l[0]) + ' ' + n(h - s.l[1]) + ' l');
        }
        if (sp.closed !== false) cs.push('h');
      }
      if (isStroke) {
        cs.push('S');
      } else if (grad) {
        shadings.push(shadingDict(grad, h, cmyk));
        cs.push(hasHoles ? 'W* n' : 'W n');
        cs.push('/Sh' + shadings.length + ' sh');
        cs.push('Q');
      } else {
        cs.push(hasHoles ? 'f*' : 'f');
      }
    }
    cs.push('Q');
    void w;
    return cs.join('\n');
  }

  // Minimal Illustrator-compatible PDF container. Opens in Adobe Illustrator
  // as editable vector paths (PDF-compatible .ai), not a placed image.
  function toAi(result, opts) {
    opts = opts || {};
    var w = opts.width || result.w, h = opts.height || result.h;
    var shadings = [];
    var stream = aiContentStream(result, { width: opts.width, height: opts.height, colorSpace: opts.colorSpace, _shadings: shadings });
    var res = '<< >>';
    if (shadings.length) {
      res = '<< /Shading << ' + shadings.map(function (sd, i) { return '/Sh' + (i + 1) + ' ' + sd; }).join(' ') + ' >> >>';
    }
    var objects = [];
    objects.push('<< /Type /Catalog /Pages 2 0 R >>');
    objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + n(w) + ' ' + n(h) + '] /Resources ' + res + ' /Contents 4 0 R >>');
    objects.push('<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream');
    objects.push('<< /Title (' + pdfEscapeText(opts.title || 'TechHat Vector') + ') /Creator (Adobe Illustrator(R) 17.0) /Producer (TechHat Studio Vector Converter) >>');

    var out = '%PDF-1.5\n%âãÏÓ\n';
    var offsets = [];
    for (var i = 0; i < objects.length; i++) {
      offsets.push(out.length);
      out += (i + 1) + ' 0 obj\n' + objects[i] + '\nendobj\n';
    }
    var xrefPos = out.length;
    out += 'xref\n0 ' + (objects.length + 1) + '\n';
    out += '0000000000 65535 f \n';
    for (var j = 0; j < offsets.length; j++) {
      var off = String(offsets[j]);
      while (off.length < 10) off = '0' + off;
      out += off + ' 00000 n \n';
    }
    out += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R /Info 5 0 R >>\n';
    out += 'startxref\n' + xrefPos + '\n%%EOF\n';
    return out;
  }

  /* ============================== helpers ============================== */

  function estimateBytes(result, fmt, opts) {
    var text = fmt === 'eps' ? toEps(result, opts) : fmt === 'ai' ? toAi(result, opts) : toSvg(result, opts);
    return text.length; // ASCII-safe output → chars ≈ bytes
  }

  // Recolour a layer. Gradient layers keep their gradient: every stop is
  // shifted by the same delta so the ramp moves to the new hue/brightness.
  function recolorPath(path, rgb) {
    var nf = [Math.round(rgb[0]), Math.round(rgb[1]), Math.round(rgb[2])];
    if (path.gradient && path.gradient.stops) {
      var d = [nf[0] - path.fill[0], nf[1] - path.fill[1], nf[2] - path.fill[2]];
      path.gradient.stops.forEach(function (s) {
        s.c = [0, 1, 2].map(function (i) { return Math.max(0, Math.min(255, Math.round(s.c[i] + d[i]))); });
      });
    }
    path.fill = nf;
    if (path.stroke) path.stroke = nf.slice();
    return path;
  }

  function mergePaths(result, fromIndexes, intoIndex) {
    var target = result.paths[intoIndex];
    if (!target) return false;
    var removed = 0;
    for (var i = result.paths.length - 1; i >= 0; i--) {
      if (fromIndexes.indexOf(i) < 0 || i === intoIndex) continue;
      target.subpaths = target.subpaths.concat(result.paths[i].subpaths);
      target.area = (target.area || 0) + (result.paths[i].area || 0);
      result.paths.splice(i, 1);
      removed++;
    }
    return removed > 0;
  }

  function removePath(result, index) {
    if (index < 0 || index >= result.paths.length) return false;
    result.paths.splice(index, 1);
    return true;
  }

  function setPathHidden(result, index, hidden) {
    var p = result.paths[index];
    if (!p) return false;
    p.hidden = !!hidden;
    return true;
  }

  function movePath(result, index, delta) {
    var to = index + delta;
    if (index < 0 || index >= result.paths.length || to < 0 || to >= result.paths.length) return false;
    var p = result.paths.splice(index, 1)[0];
    result.paths.splice(to, 0, p);
    return true;
  }

  return {
    toSvg: toSvg,
    toEps: toEps,
    toAi: toAi,
    estimateBytes: estimateBytes,
    recolorPath: recolorPath,
    mergePaths: mergePaths,
    removePath: removePath,
    setPathHidden: setPathHidden,
    movePath: movePath,
    rgbToCmyk: rgbToCmyk,
    subpathToSvgD: subpathToSvgD
  };
});
