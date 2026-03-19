(function () {
  'use strict';

  // Idempotency guard: if already injected, just clear existing guides
  if (window.__RulerLines) {
    window.__RulerLines.clearAll();
    return;
  }

  // ─── Constants ────────────────────────────────────────────────────────────

  var RULER_SIZE = 20; // px — width of left ruler, height of top ruler
  var TICK_COLOR = 'rgba(180, 180, 180, 0.6)';
  var RULER_BG = 'rgba(30, 30, 30, 0.85)';
  var LABEL_COLOR = 'rgba(200, 200, 200, 0.7)';

  // ─── Host container ───────────────────────────────────────────────────────

  var host = document.createElement('div');
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

    var vw = Math.max(window.innerWidth, 2000); // generate ticks for wide viewports
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

  // Corner cap where the two rulers meet
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

  host.appendChild(buildRulerTop());
  host.appendChild(buildRulerLeft());
  host.appendChild(buildCornerCap());

  // ─── Guide creation ───────────────────────────────────────────────────────

  var guides = {}; // id → element

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

    // Drag handle — thin invisible hit area around the guide line
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

    // Position label
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

  // ─── Drag handling ────────────────────────────────────────────────────────

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
        window.__RulerLines.pendingUpdate = { id: id, pos: pos };
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

    clearAll: function () {
      Object.keys(guides).forEach(function (id) {
        var el = guides[id];
        el.parentNode && el.parentNode.removeChild(el);
      });
      guides = {};
    },

    setColor: function (id, color) {
      var el = guides[id];
      if (el) el.style.background = color;
    },

    clearPendingUpdate: function () {
      this.pendingUpdate = null;
    },
  };
})();
