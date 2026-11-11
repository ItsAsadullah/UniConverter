/**
 * TechHat Reusable Photoshop Studio Engine (`window.TechHatPsStudio`)
 * ===================================================================
 * Shared Photoshop-grade viewport zoom/pan, keyboard shortcut router,
 * feathered brush cursor HUD, scrubby slider wheel handler, and curved
 * outside-crop rotation cursor used across Image Studio & Document Scanner.
 */
(function () {
  'use strict';

  var ZOOM_STEPS = [0.1, 0.16, 0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 12];

  // Crisp Photoshop-style curved double-arrow rotation cursor (SVG data URI, hotspot 12 12)
  var PS_ROTATE_CURSOR_SVG =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E" +
    "%3Cg fill='none' stroke='%23000000' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'%3E" +
    "%3Cpath d='M6 5.5A9.5 9.5 0 0 1 18.5 18'/%3E%3Cpath d='M9.5 4.2 5.5 5.4l1.3 4'/%3E%3Cpath d='M19.8 14.5 18.6 18.5l-4-1.3'/%3E" +
    "%3C/g%3E" +
    "%3Cg fill='none' stroke='%23ffffff' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E" +
    "%3Cpath d='M6 5.5A9.5 9.5 0 0 1 18.5 18'/%3E%3Cpath d='M9.5 4.2 5.5 5.4l1.3 4'/%3E%3Cpath d='M19.8 14.5 18.6 18.5l-4-1.3'/%3E" +
    "%3C/g%3E%3C/svg%3E\") 12 12, grab";

  function clamp(v, mn, mx) {
    return v < mn ? mn : (v > mx ? mx : v);
  }

  function parseHexRgb(hex) {
    var clean = String(hex || '#ffffff').replace('#', '');
    if (clean.length === 3) {
      clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    var n = parseInt(clean, 16);
    if (!Number.isFinite(n)) return [255, 255, 255];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /**
   * Renders a real-time Photoshop feathered brush preview into a 144x144 canvas.
   */
  function renderFeatheredBrushPreview(canvas, opts) {
    if (!canvas) return;
    var size = opts.size || 26;
    var hardness = opts.hardness != null ? opts.hardness : 65;
    var opacity = opts.opacity != null ? opts.opacity : 100;
    var color = opts.color || '#ffffff';
    var hudMode = !!opts.hudMode;
    var cacheKey = (hudMode ? '1:' : '0:') + size + ':' + hardness + ':' + opacity + ':' + color;
    if (canvas._psBrushKey === cacheKey) return;
    canvas._psBrushKey = cacheKey;

    var cw = 144, ch = 144;
    if (canvas.width !== cw) canvas.width = cw;
    if (canvas.height !== ch) canvas.height = ch;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);

    var im = ctx.createImageData(cw, ch);
    var d = im.data;
    var R = cw / 2;
    var hard = clamp(hardness / 100, 0, 1);
    var rInner = R * Math.min(0.98, hard);
    var rSpan = Math.max(0.001, R - rInner);
    var rSq = R * R;
    var rInnerSq = rInner * rInner;
    var op = clamp(opacity / 100, 0.08, 1);
    var rgb = hudMode ? [248, 105, 105] : parseHexRgb(color);

    for (var y = 0; y < ch; y++) {
      var dy = y + 0.5 - R;
      var dySq = dy * dy;
      for (var x = 0; x < cw; x++) {
        var dx = x + 0.5 - R;
        var dSq = dx * dx + dySq;
        if (dSq > rSq) continue;
        var wt = 1;
        if (dSq > rInnerSq) {
          var tt = (Math.sqrt(dSq) - rInner) / rSpan;
          wt = Math.pow(0.5 * (1 + Math.cos(Math.PI * tt)), 0.78);
        }
        var idx = (y * cw + x) * 4;
        d[idx] = rgb[0];
        d[idx + 1] = rgb[1];
        d[idx + 2] = rgb[2];
        d[idx + 3] = Math.round(wt * op * 255);
      }
    }
    ctx.putImageData(im, 0, 0);
  }

  /**
   * Creates a reusable Photoshop Studio Viewport + Shortcut + Tool Controller.
   *
   * @param {Object} cfg
   * @param {HTMLElement} cfg.rootEl        Root tool pane element (e.g. #img-pane-passport-photo)
   * @param {HTMLElement} cfg.stageEl       Outer pasteboard viewport (#ppSingleStageWrap)
   * @param {Function}    cfg.getPlaneEl    Returns currently visible zoomable artboard plane (#ppCropInteractiveWrap or #ppEditedCanvasWrap)
   * @param {Function}    cfg.isActive      Returns true when workspace is active & visible
   * @param {Function}    cfg.getTool       Returns current tool id ('crop'|'move'|'brush'|'eraser'|'picker'|'hand'|'zoom')
   * @param {Function}    cfg.setTool       Switches active tool id
   * @param {Function}    cfg.onZoomChange  Called with (zoomRatio, panObj) whenever viewport zoom/pan updates
   * @param {Function}    cfg.onBrushStep   Called with ({ sizeDelta, hardnessDelta, opacityVal })
   * @param {Function}    cfg.onUndo        Undo callback (Ctrl+Z)
   * @param {Function}    cfg.onRedo        Redo callback (Ctrl+Y / Ctrl+Shift+Z)
   * @param {Function}    cfg.onCommitCrop  Enter key in Crop mode
   * @param {Function}    cfg.onCancelCrop  Escape key in Crop mode
   * @param {Function}    cfg.onNudge       Arrow key nudge in Move mode: (dx, dy)
   * @param {Function}    cfg.onSwapColors  'X' shortcut to swap FG/BG swatches
   * @param {Function}    cfg.onResetColors 'D' shortcut to reset default swatches
   */
  function createController(cfg) {
    var zoom = 1;
    var pan = { x: 0, y: 0 };
    var spaceHeld = false;
    var altHeld = false;
    var tempPrevTool = null;
    var panDrag = null;

    function getPlane() {
      return (cfg.getPlaneEl && cfg.getPlaneEl()) || null;
    }

    function clampPan() {
      var st = cfg.stageEl;
      var pl = getPlane();
      if (!st || !pl) return;
      var pw = pl.offsetWidth || 400;
      var ph = pl.offsetHeight || 500;
      var mx = Math.max(120, (pw * zoom - st.clientWidth) * 0.5 + 180);
      var my = Math.max(120, (ph * zoom - st.clientHeight) * 0.5 + 180);
      pan.x = clamp(pan.x, -mx, mx);
      pan.y = clamp(pan.y, -my, my);
    }

    function syncViewport() {
      var pl = getPlane();
      clampPan();
      if (pl) {
        pl.style.transformOrigin = 'center center';
        pl.style.transform =
          zoom === 1 && Math.abs(pan.x) < 0.5 && Math.abs(pan.y) < 0.5
            ? ''
            : 'translate3d(' + pan.x.toFixed(1) + 'px,' + pan.y.toFixed(1) + 'px,0) scale(' + zoom.toFixed(4) + ')';
      }
      if (cfg.onZoomChange) cfg.onZoomChange(zoom, pan);
    }

    function fitScreen() {
      zoom = 1;
      pan.x = 0;
      pan.y = 0;
      syncViewport();
    }

    function setZoom(nextZoom, anchorClientX, anchorClientY) {
      var st = cfg.stageEl;
      var pl = getPlane();
      var nz = clamp(nextZoom, 0.15, 12);
      if (anchorClientX == null || anchorClientY == null) {
        if (Math.abs(nz - 1) < 1e-4) {
          fitScreen();
          return;
        }
        if (st) {
          var sr = st.getBoundingClientRect();
          anchorClientX = sr.left + sr.width * 0.5;
          anchorClientY = sr.top + sr.height * 0.5;
        }
      }
      if (pl && anchorClientX != null) {
        var r = pl.getBoundingClientRect();
        var cx = r.left + r.width * 0.5;
        var cy = r.top + r.height * 0.5;
        var k = 1 - nz / zoom;
        pan.x += (anchorClientX - cx) * k;
        pan.y += (anchorClientY - cy) * k;
      }
      zoom = nz;
      syncViewport();
    }

    function stepZoom(dir, ax, ay) {
      var nz = zoom;
      if (dir > 0) {
        for (var i = 0; i < ZOOM_STEPS.length; i++) {
          if (ZOOM_STEPS[i] > zoom + 0.01) {
            nz = ZOOM_STEPS[i];
            break;
          }
        }
        if (nz === zoom) nz = 12;
      } else {
        for (var j = ZOOM_STEPS.length - 1; j >= 0; j--) {
          if (ZOOM_STEPS[j] < zoom - 0.01) {
            nz = ZOOM_STEPS[j];
            break;
          }
        }
        if (nz === zoom) nz = 0.15;
      }
      setZoom(nz, ax, ay);
    }

    function actualPixels(canvasEl) {
      if (!canvasEl || !canvasEl.clientWidth) {
        setZoom(1);
        return;
      }
      pan.x = 0;
      pan.y = 0;
      zoom = 1;
      syncViewport();
      var dpr = window.devicePixelRatio || 1;
      var baseClientW = canvasEl.clientWidth;
      if (baseClientW > 0) {
        setZoom(clamp(canvasEl.width / (baseClientW * dpr), 0.2, 8));
      }
    }

    // Pasteboard Wheel Zoom & Pan (True Photoshop Canvas-Level Zoom!)
    if (cfg.stageEl) {
      cfg.stageEl.addEventListener(
        'wheel',
        function (e) {
          if (!cfg.isActive || !cfg.isActive()) return;
          if (e.target && e.target.closest && e.target.closest('[data-ps-dock]')) return;
          e.preventDefault();
          // Smooth canvas-level zoom toward cursor on wheel (or Shift/Two-finger pan when holding Shift without Ctrl/Alt)
          if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
            pan.x -= e.deltaY || e.deltaX;
            syncViewport();
            return;
          }
          var pinch = e.ctrlKey && Math.abs(e.deltaY) < 40 && !Number.isInteger(e.deltaY);
          var factor = Math.exp(-e.deltaY * (pinch ? 0.01 : 0.0022));
          setZoom(zoom * factor, e.clientX, e.clientY);
        },
        { passive: false }
      );

      // Hand Tool / Spacebar Pan + Zoom Tool Click on Stage
      cfg.stageEl.addEventListener(
        'pointerdown',
        function (e) {
          if (!cfg.isActive || !cfg.isActive()) return;
          if (e.target && e.target.closest && e.target.closest('[data-ps-dock],button[data-ps-ignore-stage]')) return;
          var curTool = cfg.getTool ? cfg.getTool() : 'crop';
          // Middle mouse button OR Spacebar OR Hand tool => Pan whole canvas artboard
          if (e.button === 1 || spaceHeld || curTool === 'hand') {
            e.preventDefault();
            e.stopPropagation();
            panDrag = {
              sx: e.clientX,
              sy: e.clientY,
              px: pan.x,
              py: pan.y,
              pointerId: e.pointerId
            };
            cfg.stageEl.style.cursor = 'grabbing';
            if (cfg.stageEl.setPointerCapture) {
              try { cfg.stageEl.setPointerCapture(e.pointerId); } catch (_) {}
            }
            return;
          }
          if (curTool === 'zoom' && e.button === 0) {
            e.preventDefault();
            e.stopPropagation();
            stepZoom(e.altKey || altHeld ? -1 : 1, e.clientX, e.clientY);
          }
        },
        true
      );

      cfg.stageEl.addEventListener('pointermove', function (e) {
        if (!panDrag) return;
        e.preventDefault();
        pan.x = panDrag.px + (e.clientX - panDrag.sx);
        pan.y = panDrag.py + (e.clientY - panDrag.sy);
        syncViewport();
      });

      var endPan = function (e) {
        if (!panDrag) return;
        if (e && e.pointerId != null && cfg.stageEl.hasPointerCapture) {
          try {
            if (cfg.stageEl.hasPointerCapture(e.pointerId)) cfg.stageEl.releasePointerCapture(e.pointerId);
          } catch (_) {}
        }
        panDrag = null;
        var curTool = cfg.getTool ? cfg.getTool() : 'crop';
        cfg.stageEl.style.cursor = curTool === 'hand' || spaceHeld ? 'grab' : (curTool === 'zoom' ? (altHeld ? 'zoom-out' : 'zoom-in') : '');
      };
      cfg.stageEl.addEventListener('pointerup', endPan);
      cfg.stageEl.addEventListener('pointercancel', endPan);

      cfg.stageEl.addEventListener('dblclick', function (e) {
        if (!cfg.isActive || !cfg.isActive()) return;
        var curTool = cfg.getTool ? cfg.getTool() : '';
        if (curTool === 'hand') {
          e.preventDefault();
          fitScreen();
        } else if (curTool === 'zoom') {
          e.preventDefault();
          setZoom(1);
        }
      });
    }

    // Scrubby Mouse-Wheel on Sliders inside Root (matching DocumentScanner!)
    if (cfg.rootEl) {
      cfg.rootEl.addEventListener(
        'wheel',
        function (e) {
          var pod = e.target && e.target.closest ? e.target.closest('[data-ps-slider-pod], input[type="range"]') : null;
          if (!pod) return;
          var inp = pod.tagName === 'INPUT' ? pod : pod.querySelector('input[type="range"]');
          if (!inp || inp.disabled) return;
          e.preventDefault();
          e.stopPropagation();
          var dir = e.deltaY < 0 ? 1 : (e.deltaY > 0 ? -1 : 0);
          if (!dir) return;
          var step = Number(inp.step) || 1;
          if (e.shiftKey) step *= 5;
          else if (step === 1 && Number(inp.max) - Number(inp.min) >= 80) step = 2;
          var next = clamp(Number((Number(inp.value) + dir * step).toFixed(2)), Number(inp.min), Number(inp.max));
          if (next === Number(inp.value)) return;
          inp.value = String(next);
          inp.dispatchEvent(new Event('input', { bubbles: true }));
        },
        { passive: false }
      );
    }

    // Unified Photoshop Keyboard Shortcuts Router
    var KEY_TO_TOOL = {
      c: 'crop',
      v: 'move',
      b: 'brush',
      e: 'eraser',
      i: 'picker',
      h: 'hand',
      z: 'zoom'
    };

    document.addEventListener(
      'keydown',
      function (e) {
        if (!cfg.isActive || !cfg.isActive()) return;
        if (cfg.rootEl && cfg.rootEl.querySelector('dialog[open]')) return;
        var isTextInput =
          e.target &&
          e.target.closest &&
          e.target.closest('input:not([type="range"]):not([type="checkbox"]):not([type="color"]),textarea,select,[contenteditable="true"]');
        if (isTextInput) return;

        var curTool = cfg.getTool ? cfg.getTool() : 'crop';
        var mod = e.ctrlKey || e.metaKey;
        var k = (e.key || '').toLowerCase();

        // [ / ] Brush Size & Shift+[ / Shift+] Hardness
        if (e.code === 'BracketLeft' || e.code === 'BracketRight' || e.key === '[' || e.key === ']' || e.key === '{' || e.key === '}') {
          e.preventDefault();
          var up = e.code === 'BracketRight' || e.key === ']' || e.key === '}';
          if (cfg.onBrushStep) {
            if (e.shiftKey) cfg.onBrushStep({ hardnessDelta: up ? 20 : -20 });
            else cfg.onBrushStep({ sizeDelta: up ? 4 : -4 });
          }
          return;
        }

        if (e.key === 'Alt') {
          altHeld = true;
          if (cfg.stageEl && curTool === 'zoom') cfg.stageEl.style.cursor = 'zoom-out';
          return;
        }

        // Spacebar temporary Hand Pan (exact Photoshop behavior)
        if (e.code === 'Space' && !spaceHeld) {
          e.preventDefault();
          spaceHeld = true;
          tempPrevTool = curTool;
          if (cfg.stageEl) cfg.stageEl.style.cursor = 'grab';
          return;
        }

        // Ctrl/Cmd Shortcuts: Undo, Redo, Fit Screen (Ctrl+0), 100% (Ctrl+1), Zoom +/-
        if (mod) {
          if (k === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
              if (cfg.onRedo) cfg.onRedo();
            } else if (cfg.onUndo) {
              cfg.onUndo();
            }
            return;
          }
          if (k === 'y') {
            e.preventDefault();
            if (cfg.onRedo) cfg.onRedo();
            return;
          }
          if (k === '0') {
            e.preventDefault();
            fitScreen();
            return;
          }
          if (k === '1') {
            e.preventDefault();
            setZoom(1);
            return;
          }
          if (k === '=' || k === '+') {
            e.preventDefault();
            stepZoom(1);
            return;
          }
          if (k === '-' || k === '_') {
            e.preventDefault();
            stepZoom(-1);
            return;
          }
          if (k === 't' && cfg.onToggleTransform) {
            e.preventDefault();
            cfg.onToggleTransform();
            return;
          }
          return;
        }

        // Enter / Escape in Crop Mode
        if (e.key === 'Enter' && curTool === 'crop') {
          e.preventDefault();
          if (cfg.onCommitCrop) cfg.onCommitCrop();
          return;
        }
        if (e.key === 'Escape' && curTool === 'crop') {
          e.preventDefault();
          if (cfg.onCancelCrop) cfg.onCancelCrop();
          return;
        }

        // Arrow Keys Nudge in Move Mode
        if (curTool === 'move' && e.key && e.key.indexOf('Arrow') === 0) {
          e.preventDefault();
          var step = e.shiftKey ? 10 : 1;
          var dx = e.key === 'ArrowLeft' ? -step : (e.key === 'ArrowRight' ? step : 0);
          var dy = e.key === 'ArrowUp' ? -step : (e.key === 'ArrowDown' ? step : 0);
          if (cfg.onNudge) cfg.onNudge(dx, dy);
          return;
        }

        // Number keys 1..0 => Brush Opacity 10%..100%
        if (/^[0-9]$/.test(e.key) && (curTool === 'brush' || curTool === 'eraser') && !e.altKey) {
          e.preventDefault();
          if (cfg.onBrushStep) cfg.onBrushStep({ opacityVal: e.key === '0' ? 100 : Number(e.key) * 10 });
          return;
        }

        if (k === 'x' && !e.altKey) {
          e.preventDefault();
          if (cfg.onSwapColors) cfg.onSwapColors();
          return;
        }
        if (k === 'd' && !e.altKey) {
          e.preventDefault();
          if (cfg.onResetColors) cfg.onResetColors();
          return;
        }

        if (KEY_TO_TOOL[k] && !e.altKey) {
          e.preventDefault();
          tempPrevTool = null;
          if (cfg.setTool) cfg.setTool(KEY_TO_TOOL[k]);
        }
      },
      true
    );

    document.addEventListener(
      'keyup',
      function (e) {
        if (e.key === 'Alt') {
          altHeld = false;
          if (cfg.stageEl && cfg.getTool && cfg.getTool() === 'zoom') cfg.stageEl.style.cursor = 'zoom-in';
        }
        if (e.code === 'Space' && spaceHeld) {
          spaceHeld = false;
          if (cfg.stageEl && !panDrag) {
            var cur = cfg.getTool ? cfg.getTool() : 'crop';
            cfg.stageEl.style.cursor = cur === 'hand' ? 'grab' : (cur === 'zoom' ? 'zoom-in' : '');
          }
          tempPrevTool = null;
        }
      },
      true
    );

    window.addEventListener('blur', function () {
      spaceHeld = false;
      altHeld = false;
      panDrag = null;
    });

    return {
      PS_ROTATE_CURSOR_SVG: PS_ROTATE_CURSOR_SVG,
      renderFeatheredBrushPreview: renderFeatheredBrushPreview,
      getZoom: function () { return zoom; },
      getPan: function () { return { x: pan.x, y: pan.y }; },
      isSpaceHeld: function () { return spaceHeld; },
      isAltHeld: function () { return altHeld; },
      setZoom: setZoom,
      stepZoom: stepZoom,
      fitScreen: fitScreen,
      actualPixels: actualPixels,
      syncViewport: syncViewport
    };
  }

  window.TechHatPsStudio = {
    PS_ROTATE_CURSOR_SVG: PS_ROTATE_CURSOR_SVG,
    renderFeatheredBrushPreview: renderFeatheredBrushPreview,
    createController: createController
  };
})();
