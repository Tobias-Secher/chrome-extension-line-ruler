// ─── Guide creation ───────────────────────────────────────────────────────

function createGuide(id, axis, pos, color) {
  let el = document.createElement('div');
  el.className = '__rl-guide __rl-' + axis;
  el.dataset.id = id;

  const isH = axis === 'h';
  el.style.cssText = [
    'position:fixed',
    isH ? 'top:' + pos + 'px' : 'top:0',
    isH ? 'left:0' : 'left:' + pos + 'px',
    isH ? 'width:100vw' : 'width:1px',
    isH ? 'height:1px' : 'height:100vh',
    'background:' + color,
    'pointer-events:none',
  ].join(';');

  let handle = document.createElement('div');
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

  let label = document.createElement('span');
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
    window.__UITools.isDragging = true;

    function onMove(e) {
      let pos = isH ? e.clientY : e.clientX;
      pos = Math.max(0, pos);
      guideEl.style[isH ? 'top' : 'left'] = pos + 'px';
      const label = guideEl.querySelector('.__rl-label');
      if (label) label.textContent = pos + 'px';
      window.__UITools.pendingUpdate = { type: 'guide', id: id, pos: pos };
    }

    function onUp() {
      window.__UITools.isDragging = false;
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('mouseup', onUp, true);
    }

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseup', onUp, true);
  });
}
