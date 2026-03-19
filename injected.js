(function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────

  var RULER_SIZE = 20; // px — width of left ruler, height of top ruler
  var TICK_COLOR = 'rgba(180, 180, 180, 0.6)';
  var RULER_BG = 'rgba(30, 30, 30, 0.85)';
  var LABEL_COLOR = 'rgba(200, 200, 200, 0.7)';

  // ─── State — preserved across re-injections ───────────────────────────────

  var guides = {};
  var boxes = {};

  // ─── Host container — created only once ───────────────────────────────────

  var host = document.getElementById('__rl-host');
  if (!host) {
    host = document.createElement('div');
    host.id = '__rl-host';
    host.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100vw',
      'height:100vh',
      'pointer-events:none',
      'z-index:2147483647',
      'overflow:hidden',
    ].join(';');
    document.body.appendChild(host);
  }

  // ─── Ruler bars ───────────────────────────────────────────────────────────

  function buildRulerTop() {
    var ruler = document.createElement('div');
    ruler.id = '__rl-ruler-top';
    ruler.style.cssText = [
      'position:fixed',
      'top:0',
      'left:' + RULER_SIZE + 'px',
      'width:calc(100vw - ' + RULER_SIZE + 'px)',
      'height:' + RULER_SIZE + 'px',
      'background:' + RULER_BG,
      'pointer-events:none',
      'overflow:hidden',
    ].join(';');

    var vw = Math.max(window.innerWidth, 2000);
    var frag = document.createDocumentFragment();
    for (var x = 0; x <= vw; x += 10) {
      var isMajor = x % 100 === 0;
      var isMid = x % 50 === 0;
      var tickH = isMajor ? RULER_SIZE : isMid ? 10 : 5;

      var tick = document.createElement('div');
      tick.style.cssText = [
        'position:absolute',
        'left:' + x + 'px',
        'bottom:0',
        'width:1px',
        'height:' + tickH + 'px',
        'background:' + TICK_COLOR,
        'pointer-events:none',
      ].join(';');

      if (isMajor && x > 0) {
        var lbl = document.createElement('span');
        lbl.textContent = x;
        lbl.style.cssText = [
          'position:absolute',
          'top:2px',
          'left:2px',
          'font:8px monospace',
          'color:' + LABEL_COLOR,
          'pointer-events:none',
          'white-space:nowrap',
        ].join(';');
        tick.appendChild(lbl);
      }

      frag.appendChild(tick);
    }
    ruler.appendChild(frag);
    return ruler;
  }

  function buildRulerLeft() {
    var ruler = document.createElement('div');
    ruler.id = '__rl-ruler-left';
    ruler.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:' + RULER_SIZE + 'px',
      'height:100vh',
      'background:' + RULER_BG,
      'pointer-events:none',
      'overflow:hidden',
    ].join(';');

    var vh = Math.max(window.innerHeight, 2000);
    var frag = document.createDocumentFragment();
    for (var y = 0; y <= vh; y += 10) {
      var isMajor = y % 100 === 0;
      var isMid = y % 50 === 0;
      var tickW = isMajor ? RULER_SIZE : isMid ? 10 : 5;

      var tick = document.createElement('div');
      tick.style.cssText = [
        'position:absolute',
        'top:' + y + 'px',
        'right:0',
        'width:' + tickW + 'px',
        'height:1px',
        'background:' + TICK_COLOR,
        'pointer-events:none',
      ].join(';');

      if (isMajor && y > 0) {
        var lbl = document.createElement('span');
        lbl.textContent = y;
        lbl.style.cssText = [
          'position:absolute',
          'top:2px',
          'left:2px',
          'font:8px monospace',
          'color:' + LABEL_COLOR,
          'pointer-events:none',
          'white-space:nowrap',
          'transform:rotate(90deg)',
          'transform-origin:top left',
        ].join(';');
        tick.appendChild(lbl);
      }

      frag.appendChild(tick);
    }
    ruler.appendChild(frag);
    return ruler;
  }

  function buildCornerCap() {
    var cap = document.createElement('div');
    cap.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:' + RULER_SIZE + 'px',
      'height:' + RULER_SIZE + 'px',
      'background:' + RULER_BG,
      'pointer-events:none',
    ].join(';');
    return cap;
  }

  if (!document.getElementById('__rl-ruler-top')) {
    host.appendChild(buildRulerTop());
    host.appendChild(buildRulerLeft());
    host.appendChild(buildCornerCap());
  }

  // ─── Guide creation ───────────────────────────────────────────────────────

  function createGuide(id, axis, pos, color) {
    var el = document.createElement('div');
    el.className = '__rl-guide __rl-' + axis;
    el.dataset.id = id;

    var isH = axis === 'h';
    el.style.cssText = [
      'position:fixed',
      isH ? 'top:' + pos + 'px' : 'top:0',
      isH ? 'left:0' : 'left:' + pos + 'px',
      isH ? 'width:100vw' : 'width:1px',
      isH ? 'height:1px' : 'height:100vh',
      'background:' + color,
      'pointer-events:none',
    ].join(';');

    var handle = document.createElement('div');
    handle.className = '__rl-handle';
    handle.style.cssText = [
      'position:absolute',
      isH ? 'top:-5px' : 'left:-5px',
      isH ? 'left:0' : 'top:0',
      isH ? 'width:100%' : 'width:11px',
      isH ? 'height:11px' : 'height:100%',
      'cursor:' + (isH ? 'ns-resize' : 'ew-resize'),
      'pointer-events:all',
    ].join(';');
    attachDragHandler(handle, el, id, isH);

    var label = document.createElement('span');
    label.className = '__rl-label';
    label.textContent = pos + 'px';
    label.style.cssText = [
      'position:absolute',
      isH ? 'top:3px' : 'top:24px',
      isH ? 'left:24px' : 'left:3px',
      'font:9px monospace',
      'color:#fff',
      'background:rgba(0,0,0,0.55)',
      'padding:1px 3px',
      'border-radius:2px',
      'pointer-events:none',
      'white-space:nowrap',
      !isH ? 'writing-mode:vertical-rl' : '',
    ].join(';');

    el.appendChild(handle);
    el.appendChild(label);
    return el;
  }

  // ─── Guide drag handling ──────────────────────────────────────────────────

  function attachDragHandler(handle, guideEl, id, isH) {
    handle.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      window.__RulerLines.isDragging = true;

      function onMove(e) {
        var pos = isH ? e.clientY : e.clientX;
        pos = Math.max(0, pos);
        guideEl.style[isH ? 'top' : 'left'] = pos + 'px';
        var label = guideEl.querySelector('.__rl-label');
        if (label) label.textContent = pos + 'px';
        window.__RulerLines.pendingUpdate = { type: 'guide', id: id, pos: pos };
      }

      function onUp() {
        window.__RulerLines.isDragging = false;
        document.removeEventListener('mousemove', onMove, true);
        document.removeEventListener('mouseup', onUp, true);
      }

      document.addEventListener('mousemove', onMove, true);
      document.addEventListener('mouseup', onUp, true);
    });
  }

  // ─── Box creation ─────────────────────────────────────────────────────────

  function createBox(id, x, y, w, h, color) {
    var el = document.createElement('div');
    el.className = '__rl-box';
    el.dataset.id = id;
    el.style.cssText = [
      'position:fixed',
      'left:' + x + 'px',
      'top:' + y + 'px',
      'width:' + w + 'px',
      'height:' + h + 'px',
      'outline:1px solid ' + color,
      'outline-offset:-1px',
      'background:transparent',
      'pointer-events:none',
    ].join(';');

    // Central drag zone — inset 8px from edges, safe from all resize handle overlap
    var dragZone = document.createElement('div');
    dragZone.className = '__rl-box-drag';
    dragZone.style.cssText = [
      'position:absolute',
      'top:8px',
      'left:8px',
      'right:8px',
      'bottom:8px',
      'cursor:move',
      'pointer-events:all',
    ].join(';');
    attachMoveHandler(dragZone, el, id);
    el.appendChild(dragZone);

    // Center crosshair — horizontal
    var crossH = document.createElement('div');
    crossH.className = '__rl-box-crosshair';
    crossH.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:0',
      'right:0',
      'height:1px',
      'background:' + color,
      'opacity:0.45',
      'pointer-events:none',
      'transform:translateY(-0.5px)',
    ].join(';');

    // Center crosshair — vertical
    var crossV = document.createElement('div');
    crossV.className = '__rl-box-crosshair';
    crossV.style.cssText = [
      'position:absolute',
      'left:50%',
      'top:0',
      'bottom:0',
      'width:1px',
      'background:' + color,
      'opacity:0.45',
      'pointer-events:none',
      'transform:translateX(-0.5px)',
    ].join(';');

    // Resize handles — corners (visible) and edges (transparent, cursor only)
    var handleDefs = [
      { dir: 'nw', css: 'top:-4px;left:-4px;width:8px;height:8px;cursor:nwse-resize', corner: true },
      { dir: 'ne', css: 'top:-4px;right:-4px;width:8px;height:8px;cursor:nesw-resize', corner: true },
      { dir: 'se', css: 'bottom:-4px;right:-4px;width:8px;height:8px;cursor:nwse-resize', corner: true },
      { dir: 'sw', css: 'bottom:-4px;left:-4px;width:8px;height:8px;cursor:nesw-resize', corner: true },
      { dir: 'n',  css: 'top:-4px;left:8px;right:8px;height:8px;cursor:ns-resize', corner: false },
      { dir: 's',  css: 'bottom:-4px;left:8px;right:8px;height:8px;cursor:ns-resize', corner: false },
      { dir: 'e',  css: 'top:8px;right:-4px;bottom:8px;width:8px;cursor:ew-resize', corner: false },
      { dir: 'w',  css: 'top:8px;left:-4px;bottom:8px;width:8px;cursor:ew-resize', corner: false },
    ];
    handleDefs.forEach(function (def) {
      var handle = document.createElement('div');
      handle.className = '__rl-box-handle';
      handle.dataset.resize = def.dir;
      handle.style.cssText = [
        'position:absolute',
        def.css,
        'pointer-events:all',
        def.corner ? 'background:' + color : 'background:transparent',
        def.corner ? 'border:1px solid rgba(0,0,0,0.5)' : '',
      ].join(';');
      attachResizeHandler(handle, el, id);
      el.appendChild(handle);
    });

    // Dimension label — shown below the box
    var label = document.createElement('span');
    label.className = '__rl-box-label';
    label.style.cssText = [
      'position:absolute',
      'bottom:-18px',
      'left:0',
      'font:9px monospace',
      'color:#fff',
      'background:rgba(0,0,0,0.55)',
      'padding:1px 3px',
      'border-radius:2px',
      'pointer-events:none',
      'white-space:nowrap',
    ].join(';');
    label.textContent = w + ' \u00d7 ' + h;

    el.appendChild(crossH);
    el.appendChild(crossV);
    el.appendChild(label);
    return el;
  }

  // ─── Box move handling ────────────────────────────────────────────────────

  function attachMoveHandler(strip, el, id) {
    strip.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();

      var startX = e.clientX;
      var startY = e.clientY;
      var origX = parseInt(el.style.left) || 0;
      var origY = parseInt(el.style.top) || 0;

      window.__RulerLines.isDragging = true;

      function onMove(e) {
        var newX = origX + (e.clientX - startX);
        var newY = origY + (e.clientY - startY);
        var w = parseInt(el.style.width);
        var h = parseInt(el.style.height);
        el.style.left = newX + 'px';
        el.style.top = newY + 'px';
        window.__RulerLines.pendingUpdate = { type: 'box', id: id, x: newX, y: newY, w: w, h: h };
      }

      function onUp() {
        window.__RulerLines.isDragging = false;
        document.removeEventListener('mousemove', onMove, true);
        document.removeEventListener('mouseup', onUp, true);
      }

      document.addEventListener('mousemove', onMove, true);
      document.addEventListener('mouseup', onUp, true);
    });
  }

  // ─── Box resize handling ──────────────────────────────────────────────────

  function attachResizeHandler(handle, el, id) {
    handle.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();

      var dir = handle.dataset.resize;
      var startX = e.clientX;
      var startY = e.clientY;
      var origX = parseInt(el.style.left) || 0;
      var origY = parseInt(el.style.top) || 0;
      var origW = parseInt(el.style.width) || 100;
      var origH = parseInt(el.style.height) || 100;

      window.__RulerLines.isDragging = true;

      function onMove(e) {
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        var newX = origX, newY = origY, newW = origW, newH = origH;

        if (dir.indexOf('e') !== -1) { newW = Math.max(20, origW + dx); }
        if (dir.indexOf('w') !== -1) { newW = Math.max(20, origW - dx); newX = origX + origW - newW; }
        if (dir.indexOf('s') !== -1) { newH = Math.max(20, origH + dy); }
        if (dir.indexOf('n') !== -1) { newH = Math.max(20, origH - dy); newY = origY + origH - newH; }

        el.style.left = newX + 'px';
        el.style.top = newY + 'px';
        el.style.width = newW + 'px';
        el.style.height = newH + 'px';

        var label = el.querySelector('.__rl-box-label');
        if (label) label.textContent = newW + ' \u00d7 ' + newH;

        window.__RulerLines.pendingUpdate = { type: 'box', id: id, x: newX, y: newY, w: newW, h: newH };
      }

      function onUp() {
        window.__RulerLines.isDragging = false;
        document.removeEventListener('mousemove', onMove, true);
        document.removeEventListener('mouseup', onUp, true);
      }

      document.addEventListener('mousemove', onMove, true);
      document.addEventListener('mouseup', onUp, true);
    });
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  window.__RulerLines = {
    isDragging: false,
    pendingUpdate: null,
    _bmEls: [],

    // ── Guide methods ──

    addGuide: function (id, axis, pos, color) {
      if (guides[id]) return;
      var el = createGuide(id, axis, pos, color);
      guides[id] = el;
      host.appendChild(el);
    },

    removeGuide: function (id) {
      var el = guides[id];
      if (el) {
        el.parentNode && el.parentNode.removeChild(el);
        delete guides[id];
      }
    },

    setColor: function (id, color) {
      var el = guides[id];
      if (el) el.style.background = color;
    },

    // ── Box methods ──

    addBox: function (id, x, y, w, h, color) {
      if (boxes[id]) return;
      // Center in viewport if position not provided
      if (x === null || x === undefined) x = Math.max(0, Math.floor((window.innerWidth - w) / 2));
      if (y === null || y === undefined) y = Math.max(0, Math.floor((window.innerHeight - h) / 2));
      var el = createBox(id, x, y, w, h, color);
      boxes[id] = el;
      host.appendChild(el);
      // Return actual position so panel can sync state
      return { x: x, y: y };
    },

    removeBox: function (id) {
      var el = boxes[id];
      if (el) {
        el.parentNode && el.parentNode.removeChild(el);
        delete boxes[id];
      }
    },

    setBoxColor: function (id, color) {
      var el = boxes[id];
      if (!el) return;
      el.style.outline = '1px solid ' + color;
      var crosshairs = el.querySelectorAll('.__rl-box-crosshair');
      for (var i = 0; i < crosshairs.length; i++) {
        crosshairs[i].style.background = color;
      }
      var handles = el.querySelectorAll('.__rl-box-handle');
      for (var j = 0; j < handles.length; j++) {
        var h = handles[j];
        if (h.dataset.resize && h.dataset.resize.length === 2) {
          h.style.background = color;
        }
      }
    },

    clearBoxes: function () {
      Object.keys(boxes).forEach(function (id) {
        var el = boxes[id];
        el.parentNode && el.parentNode.removeChild(el);
      });
      boxes = {};
    },

    // ── Combined ──

    clearAll: function () {
      Object.keys(guides).forEach(function (id) {
        var el = guides[id];
        el.parentNode && el.parentNode.removeChild(el);
      });
      guides = {};
      Object.keys(boxes).forEach(function (id) {
        var el = boxes[id];
        el.parentNode && el.parentNode.removeChild(el);
      });
      boxes = {};
    },

    clearPendingUpdate: function () {
      this.pendingUpdate = null;
    },

    // ── Box model overlay ──

    setBoxModel: function (d) {
      this._bmEls.forEach(function (el) { el.parentNode && el.parentNode.removeChild(el); });
      this._bmEls = [];

      var layers = [
        {
          t: d.y - d.mt, l: d.x - d.ml,
          w: d.w + d.ml + d.mr, h: d.h + d.mt + d.mb,
          bg: 'rgba(248,192,125,0.2)',
        },
        {
          t: d.y, l: d.x, w: d.w, h: d.h,
          bg: 'rgba(255,232,163,0.2)',
        },
        {
          t: d.y + d.bt, l: d.x + d.bl,
          w: d.w - d.bl - d.br, h: d.h - d.bt - d.bb,
          bg: 'rgba(147,196,125,0.2)',
        },
        {
          t: d.y + d.bt + d.pt, l: d.x + d.bl + d.pl,
          w: d.w - d.bl - d.br - d.pl - d.pr,
          h: d.h - d.bt - d.bb - d.pt - d.pb,
          bg: 'rgba(111,168,220,0.2)',
        },
      ];

      var self = this;
      layers.forEach(function (layer, i) {
        var el = document.createElement('div');
        el.className = '__rl-bm';
        el.style.cssText = [
          'position:fixed',
          'top:' + layer.t + 'px',
          'left:' + layer.l + 'px',
          'width:' + Math.max(0, layer.w) + 'px',
          'height:' + Math.max(0, layer.h) + 'px',
          'background:' + layer.bg,
          'pointer-events:none',
          'z-index:' + (2147483640 + i),
        ].join(';');
        host.appendChild(el);
        self._bmEls.push(el);
      });
    },

    clearBoxModel: function () {
      this._bmEls.forEach(function (el) { el.parentNode && el.parentNode.removeChild(el); });
      this._bmEls = [];
    },
  };
})();
