// ─── Box creation ─────────────────────────────────────────────────────────

function createBox(id, x, y, w, h, color) {
  let el = document.createElement('div');
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
  let dragZone = document.createElement('div');
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
  let crossH = document.createElement('div');
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
  let crossV = document.createElement('div');
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
  let handleDefs = [
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
    let handle = document.createElement('div');
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
  let label = document.createElement('span');
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

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = parseInt(el.style.left) || 0;
    const origY = parseInt(el.style.top) || 0;

    window.__UITools.isDragging = true;

    function onMove(e) {
      const newX = origX + (e.clientX - startX);
      const newY = origY + (e.clientY - startY);
      const w = parseInt(el.style.width);
      const h = parseInt(el.style.height);
      el.style.left = newX + 'px';
      el.style.top = newY + 'px';
      window.__UITools.pendingUpdate = { type: 'box', id: id, x: newX, y: newY, w: w, h: h };
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

// ─── Box resize handling ──────────────────────────────────────────────────

function attachResizeHandler(handle, el, id) {
  handle.addEventListener('mousedown', function (e) {
    e.preventDefault();
    e.stopPropagation();

    const dir = handle.dataset.resize;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = parseInt(el.style.left) || 0;
    const origY = parseInt(el.style.top) || 0;
    const origW = parseInt(el.style.width) || 100;
    const origH = parseInt(el.style.height) || 100;

    window.__UITools.isDragging = true;

    function onMove(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newX = origX, newY = origY, newW = origW, newH = origH;

      if (dir.indexOf('e') !== -1) { newW = Math.max(20, origW + dx); }
      if (dir.indexOf('w') !== -1) { newW = Math.max(20, origW - dx); newX = origX + origW - newW; }
      if (dir.indexOf('s') !== -1) { newH = Math.max(20, origH + dy); }
      if (dir.indexOf('n') !== -1) { newH = Math.max(20, origH - dy); newY = origY + origH - newH; }

      el.style.left = newX + 'px';
      el.style.top = newY + 'px';
      el.style.width = newW + 'px';
      el.style.height = newH + 'px';

      const label = el.querySelector('.__rl-box-label');
      if (label) label.textContent = newW + ' \u00d7 ' + newH;

      window.__UITools.pendingUpdate = { type: 'box', id: id, x: newX, y: newY, w: newW, h: newH };
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
