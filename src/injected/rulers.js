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
    'pointer-events:all',
    'cursor:ns-resize',
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
    'pointer-events:all',
    'cursor:ew-resize',
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
  cap.id = '__rl-ruler-corner';
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

// ─── Ruler drag-to-create ─────────────────────────────────────────────────

function attachRulerDrag() {
  var top = document.getElementById('__rl-ruler-top');
  var left = document.getElementById('__rl-ruler-left');
  if (!top || !left) return;

  function startDrag(e, axis) {
    e.preventDefault();
    e.stopPropagation();
    var isH = axis === 'h';
    var pos = isH ? e.clientY : e.clientX;
    var tempId = '_d' + Date.now();

    var el = createGuide(tempId, axis, pos, '#888');
    guides[tempId] = el;
    host.appendChild(el);
    window.__UITools.isDragging = true;

    function onMove(ev) {
      var newPos = isH ? ev.clientY : ev.clientX;
      newPos = Math.max(0, newPos);
      el.style[isH ? 'top' : 'left'] = newPos + 'px';
      var lbl = el.querySelector('.__rl-label');
      if (lbl) lbl.textContent = Math.round(newPos) + 'px';
    }

    function onUp(ev) {
      window.__UITools.isDragging = false;
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('mouseup', onUp, true);
      var finalPos = isH ? ev.clientY : ev.clientX;
      if (finalPos <= RULER_SIZE) {
        window.__UITools.removeGuide(tempId);
      } else {
        window.__UITools.pendingUpdate = {
          type: 'newGuide',
          id: tempId,
          axis: axis,
          pos: Math.round(finalPos),
        };
      }
    }

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseup', onUp, true);
  }

  top.addEventListener('mousedown', function (e) { startDrag(e, 'h'); });
  left.addEventListener('mousedown', function (e) { startDrag(e, 'v'); });
}

attachRulerDrag();
