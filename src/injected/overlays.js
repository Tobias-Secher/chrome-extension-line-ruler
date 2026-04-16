// ─── Box model overlay ────────────────────────────────────────────────────

var _bmEls = [];

function setBoxModel(d) {
  _bmEls.forEach(function (el) { el.parentNode && el.parentNode.removeChild(el); });
  _bmEls = [];

  var layers = [
    {
      t: d.y - d.mt, l: d.x - d.ml,
      w: d.w + d.ml + d.mr, h: d.h + d.mt + d.mb,
      bg: 'rgba(246,152,51,0.35)',
    },
    {
      t: d.y, l: d.x, w: d.w, h: d.h,
      bg: 'rgba(255,213,79,0.3)',
    },
    {
      t: d.y + d.bt, l: d.x + d.bl,
      w: d.w - d.bl - d.br, h: d.h - d.bt - d.bb,
      bg: 'rgba(76,175,80,0.35)',
    },
    {
      t: d.y + d.bt + d.pt, l: d.x + d.bl + d.pl,
      w: d.w - d.bl - d.br - d.pl - d.pr,
      h: d.h - d.bt - d.bb - d.pt - d.pb,
      bg: 'rgba(66,133,244,0.35)',
    },
  ];

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
    _bmEls.push(el);
  });
}

function clearBoxModel() {
  _bmEls.forEach(function (el) { el.parentNode && el.parentNode.removeChild(el); });
  _bmEls = [];
}

// ─── Box Model Picker ─────────────────────────────────────────────────────

var _bmPickerActive = false;
var _bmPickerInterceptor = null;
var _bmPickerHighlight = null;
var _bmPickerHandlers = {};

function setBoxModelPicker(enable) {
  if (enable && _bmPickerActive) return;
  if (!enable && !_bmPickerActive) return;

  if (enable) {
    _bmPickerActive = true;

    _bmPickerInterceptor = document.createElement('div');
    _bmPickerInterceptor.id = '__rl-bm-picker-interceptor';
    _bmPickerInterceptor.style.cssText = [
      'position:fixed',
      'top:0', 'left:0',
      'width:100vw', 'height:100vh',
      'pointer-events:all',
      'cursor:crosshair',
      'background:transparent',
      'z-index:2147483646',
    ].join(';');
    host.appendChild(_bmPickerInterceptor);

    _bmPickerHandlers.mousemove = _bmPickerOnMouseMove;
    _bmPickerHandlers.click = _bmPickerOnClick;
    _bmPickerHandlers.keydown = _bmPickerOnKeyDown;

    _bmPickerInterceptor.addEventListener('mousemove', _bmPickerHandlers.mousemove);
    _bmPickerInterceptor.addEventListener('click', _bmPickerHandlers.click);
    document.addEventListener('keydown', _bmPickerHandlers.keydown, true);
  } else {
    _bmPickerActive = false;
    _bmPickerClearHighlight();
    if (_bmPickerInterceptor) {
      _bmPickerInterceptor.removeEventListener('mousemove', _bmPickerHandlers.mousemove);
      _bmPickerInterceptor.removeEventListener('click', _bmPickerHandlers.click);
      _bmPickerInterceptor.parentNode && _bmPickerInterceptor.parentNode.removeChild(_bmPickerInterceptor);
      _bmPickerInterceptor = null;
    }
    document.removeEventListener('keydown', _bmPickerHandlers.keydown, true);
    _bmPickerHandlers = {};
  }
}

function _bmPickerElementFromPoint(x, y) {
  _bmPickerInterceptor.style.pointerEvents = 'none';
  var el = document.elementFromPoint(x, y);
  _bmPickerInterceptor.style.pointerEvents = 'all';
  if (el && host.contains(el)) return null;
  return el;
}

function _bmPickerOnMouseMove(e) {
  var el = _bmPickerElementFromPoint(e.clientX, e.clientY);
  _bmPickerClearHighlight();
  if (!el) return;

  var r = el.getBoundingClientRect();
  _bmPickerHighlight = document.createElement('div');
  _bmPickerHighlight.style.cssText = [
    'position:fixed',
    'top:' + r.top + 'px',
    'left:' + r.left + 'px',
    'width:' + r.width + 'px',
    'height:' + r.height + 'px',
    'outline:2px solid rgba(59,130,246,0.9)',
    'background:rgba(59,130,246,0.08)',
    'pointer-events:none',
    'z-index:2147483645',
    'box-sizing:border-box',
  ].join(';');
  host.appendChild(_bmPickerHighlight);
}

function _bmPickerOnClick(e) {
  e.preventDefault();
  e.stopPropagation();

  var el = _bmPickerElementFromPoint(e.clientX, e.clientY);
  if (!el) return;

  var r = el.getBoundingClientRect();
  var s = window.getComputedStyle(el);
  var d = {
    x: r.left, y: r.top, w: r.width, h: r.height,
    pt: parseFloat(s.paddingTop), pr: parseFloat(s.paddingRight),
    pb: parseFloat(s.paddingBottom), pl: parseFloat(s.paddingLeft),
    bt: parseFloat(s.borderTopWidth), br: parseFloat(s.borderRightWidth),
    bb: parseFloat(s.borderBottomWidth), bl: parseFloat(s.borderLeftWidth),
    mt: parseFloat(s.marginTop), mr: parseFloat(s.marginRight),
    mb: parseFloat(s.marginBottom), ml: parseFloat(s.marginLeft),
  };
  setBoxModel(d);
}

function _bmPickerOnKeyDown(e) {
  if (e.key === 'Escape' && _bmPickerActive) {
    e.preventDefault();
    e.stopPropagation();
    setBoxModelPicker(false);
    window.__UITools.pendingUpdate = { type: 'boxModelPickerExit' };
  }
}

function _bmPickerClearHighlight() {
  if (_bmPickerHighlight) {
    _bmPickerHighlight.parentNode && _bmPickerHighlight.parentNode.removeChild(_bmPickerHighlight);
    _bmPickerHighlight = null;
  }
}

// ─── Nudge ────────────────────────────────────────────────────────────────

function nudgeGuide(id, delta) {
  var el = guides[id];
  if (!el) return;
  var isH = el.classList.contains('__rl-h');
  var prop = isH ? 'top' : 'left';
  var cur = parseInt(el.style[prop]) || 0;
  var next = Math.max(0, cur + delta);
  el.style[prop] = next + 'px';
  var label = el.querySelector('.__rl-label');
  if (label) label.textContent = next + 'px';
  window.__UITools.pendingUpdate = { type: 'guide', id: id, pos: next };
}

// ─── Font inspector ────────────────────────────────────────────────────────

var _fontActive = false;
var _fontTip = null;
var _fontMoveHandler = null;

function setFontInspector(enable) {
  if (enable === _fontActive) return;
  _fontActive = enable;

  if (enable) {
    _fontTip = document.createElement('div');
    _fontTip.id = '__rl-font-tip';
    _fontTip.style.cssText = [
      'position:fixed',
      'pointer-events:none',
      'font:10px monospace',
      'color:#d4d4d8',
      'background:rgba(20,20,22,0.92)',
      'border:1px solid rgba(74,158,255,0.35)',
      'border-radius:3px',
      'padding:4px 7px',
      'z-index:2147483647',
      'line-height:1.6',
      'white-space:nowrap',
      'display:none',
    ].join(';');
    host.appendChild(_fontTip);

    _fontMoveHandler = function (e) {
      var el = e.target;
      if (!el || el === _fontTip) return;
      var s = window.getComputedStyle(el);
      var family = s.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
      var size = s.fontSize;
      var weight = s.fontWeight;
      var lh = parseFloat(s.lineHeight) && parseFloat(s.fontSize)
        ? (parseFloat(s.lineHeight) / parseFloat(s.fontSize)).toFixed(2)
        : s.lineHeight;
      var dim = '<span style="color:#5a5a65">size</span>&nbsp;' + size +
        '&nbsp;&nbsp;<span style="color:#5a5a65">weight</span>&nbsp;' + weight +
        '&nbsp;&nbsp;<span style="color:#5a5a65">lh</span>&nbsp;' + lh;
      _fontTip.innerHTML =
        '<span style="color:#9cdcfe">' + family + '</span><br>' + dim;
      var tx = e.clientX + 14, ty = e.clientY + 14;
      if (tx + 160 > window.innerWidth) tx = e.clientX - 170;
      if (ty + 52 > window.innerHeight) ty = e.clientY - 58;
      _fontTip.style.left = tx + 'px';
      _fontTip.style.top = ty + 'px';
      _fontTip.style.display = '';
    };
    document.addEventListener('mousemove', _fontMoveHandler, true);
  } else {
    document.removeEventListener('mousemove', _fontMoveHandler, true);
    _fontMoveHandler = null;
    if (_fontTip) { _fontTip.remove(); _fontTip = null; }
    _fontActive = false;
  }
}

// ─── Grid overlay ─────────────────────────────────────────────────────────

function setGrid(visible, columns, gap, color) {
  var existing = document.getElementById('__rl-grid');
  if (existing) { existing.parentNode && existing.parentNode.removeChild(existing); }
  if (!visible) return;

  var grid = document.createElement('div');
  grid.id = '__rl-grid';
  grid.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'width:100vw',
    'height:100vh',
    'pointer-events:none',
    'display:grid',
    'grid-template-columns:repeat(' + columns + ',1fr)',
    'column-gap:' + gap + 'px',
    'z-index:2147483645',
  ].join(';');

  for (var i = 0; i < columns; i++) {
    var col = document.createElement('div');
    col.style.cssText = 'background:' + color + ';opacity:0.12;pointer-events:none;';
    grid.appendChild(col);
  }

  host.appendChild(grid);
}
