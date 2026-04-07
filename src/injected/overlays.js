// ─── Box model overlay ────────────────────────────────────────────────────

var _bmEls = [];

function setBoxModel(d) {
  _bmEls.forEach(function (el) { el.parentNode && el.parentNode.removeChild(el); });
  _bmEls = [];

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

// ─── Spacing inspector ────────────────────────────────────────────────────

var _spacingEls = [];

function setSpacing(data) {
  clearSpacing();
  var r0 = data.r0, r1 = data.r1;

  function makeLine(x1, y1, len, isH, gap, overlap) {
    var line = document.createElement('div');
    var color = overlap ? 'rgba(248,113,113,0.8)' : 'rgba(156,220,254,0.8)';
    line.style.cssText = [
      'position:fixed',
      'pointer-events:none',
      isH ? 'top:' + (y1 - 0.5) + 'px' : 'left:' + (x1 - 0.5) + 'px',
      isH ? 'left:' + x1 + 'px' : 'top:' + y1 + 'px',
      isH ? 'width:' + len + 'px' : 'width:1px',
      isH ? 'height:1px' : 'height:' + len + 'px',
      'background:' + color,
      'z-index:2147483646',
    ].join(';');
    host.appendChild(line);
    _spacingEls.push(line);

    var lbl = document.createElement('span');
    lbl.style.cssText = [
      'position:fixed',
      isH ? 'top:' + (y1 + 3) + 'px' : 'top:' + (y1 + len / 2 - 6) + 'px',
      isH ? 'left:' + (x1 + len / 2 - 14) + 'px' : 'left:' + (x1 + 3) + 'px',
      'font:9px monospace',
      'color:#fff',
      'background:rgba(0,0,0,0.6)',
      'padding:1px 3px',
      'border-radius:2px',
      'pointer-events:none',
      'white-space:nowrap',
      'z-index:2147483647',
    ].join(';');
    lbl.textContent = Math.round(Math.abs(gap)) + 'px';
    host.appendChild(lbl);
    _spacingEls.push(lbl);
  }

  // Horizontal gap (between right of left-most and left of right-most)
  var leftEl = r0.x < r1.x ? r0 : r1;
  var rightEl = r0.x < r1.x ? r1 : r0;
  var hGap = rightEl.x - (leftEl.x + leftEl.w);
  if (Math.abs(hGap) > 1) {
    var midY = (r0.y + r0.h / 2 + r1.y + r1.h / 2) / 2;
    makeLine(leftEl.x + leftEl.w, midY, Math.abs(rightEl.x - (leftEl.x + leftEl.w)), true, hGap, hGap < 0);
  }

  // Vertical gap (between bottom of top-most and top of bottom-most)
  var topEl = r0.y < r1.y ? r0 : r1;
  var botEl = r0.y < r1.y ? r1 : r0;
  var vGap = botEl.y - (topEl.y + topEl.h);
  if (Math.abs(vGap) > 1) {
    var midX = (r0.x + r0.w / 2 + r1.x + r1.w / 2) / 2;
    makeLine(midX, topEl.y + topEl.h, Math.abs(botEl.y - (topEl.y + topEl.h)), false, vGap, vGap < 0);
  }
}

function clearSpacing() {
  _spacingEls.forEach(function (el) { el.parentNode && el.parentNode.removeChild(el); });
  _spacingEls = [];
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
