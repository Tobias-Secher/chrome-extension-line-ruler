export function createBox(id: string, x: number, y: number, w: number, h: number, color: string): HTMLElement {
  const el = document.createElement('div');
  el.className = '__rl-box';
  el.dataset['id'] = id;
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

  const dragZone = document.createElement('div');
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

  const crossH = document.createElement('div');
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

  const crossV = document.createElement('div');
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

  interface HandleDef {
    dir: string;
    css: string;
    corner: boolean;
  }
  const handleDefs: HandleDef[] = [
    { dir: 'nw', css: 'top:-4px;left:-4px;width:8px;height:8px;cursor:nwse-resize', corner: true },
    { dir: 'ne', css: 'top:-4px;right:-4px;width:8px;height:8px;cursor:nesw-resize', corner: true },
    { dir: 'se', css: 'bottom:-4px;right:-4px;width:8px;height:8px;cursor:nwse-resize', corner: true },
    { dir: 'sw', css: 'bottom:-4px;left:-4px;width:8px;height:8px;cursor:nesw-resize', corner: true },
    { dir: 'n',  css: 'top:-4px;left:8px;right:8px;height:8px;cursor:ns-resize', corner: false },
    { dir: 's',  css: 'bottom:-4px;left:8px;right:8px;height:8px;cursor:ns-resize', corner: false },
    { dir: 'e',  css: 'top:8px;right:-4px;bottom:8px;width:8px;cursor:ew-resize', corner: false },
    { dir: 'w',  css: 'top:8px;left:-4px;bottom:8px;width:8px;cursor:ew-resize', corner: false },
  ];

  for (const def of handleDefs) {
    const handle = document.createElement('div');
    handle.className = '__rl-box-handle';
    handle.dataset['resize'] = def.dir;
    handle.style.cssText = [
      'position:absolute',
      def.css,
      'pointer-events:all',
      def.corner ? 'background:' + color : 'background:transparent',
      def.corner ? 'border:1px solid rgba(0,0,0,0.5)' : '',
    ].join(';');
    attachResizeHandler(handle, el, id);
    el.appendChild(handle);
  }

  const label = document.createElement('span');
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
  label.textContent = w + ' × ' + h;

  el.appendChild(crossH);
  el.appendChild(crossV);
  el.appendChild(label);
  return el;
}

function attachMoveHandler(strip: HTMLElement, el: HTMLElement, id: string): void {
  strip.addEventListener('mousedown', (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = parseInt(el.style.left) || 0;
    const origY = parseInt(el.style.top) || 0;

    window.__UITools.isDragging = true;

    const onMove = (ev: MouseEvent): void => {
      const newX = origX + (ev.clientX - startX);
      const newY = origY + (ev.clientY - startY);
      const w = parseInt(el.style.width);
      const h = parseInt(el.style.height);
      el.style.left = newX + 'px';
      el.style.top = newY + 'px';
      window.__UITools.pendingUpdate = { type: 'box', id, x: newX, y: newY, w, h };
    };

    const onUp = (): void => {
      window.__UITools.isDragging = false;
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('mouseup', onUp, true);
    };

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseup', onUp, true);
  });
}

function attachResizeHandler(handle: HTMLElement, el: HTMLElement, id: string): void {
  handle.addEventListener('mousedown', (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const dir = handle.dataset['resize'] ?? '';
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = parseInt(el.style.left) || 0;
    const origY = parseInt(el.style.top) || 0;
    const origW = parseInt(el.style.width) || 100;
    const origH = parseInt(el.style.height) || 100;

    window.__UITools.isDragging = true;

    const onMove = (ev: MouseEvent): void => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let newX = origX, newY = origY, newW = origW, newH = origH;

      if (dir.indexOf('e') !== -1) { newW = Math.max(20, origW + dx); }
      if (dir.indexOf('w') !== -1) { newW = Math.max(20, origW - dx); newX = origX + origW - newW; }
      if (dir.indexOf('s') !== -1) { newH = Math.max(20, origH + dy); }
      if (dir.indexOf('n') !== -1) { newH = Math.max(20, origH - dy); newY = origY + origH - newH; }

      el.style.left = newX + 'px';
      el.style.top = newY + 'px';
      el.style.width = newW + 'px';
      el.style.height = newH + 'px';

      const label = el.querySelector<HTMLElement>('.__rl-box-label');
      if (label) label.textContent = newW + ' × ' + newH;

      window.__UITools.pendingUpdate = { type: 'box', id, x: newX, y: newY, w: newW, h: newH };
    };

    const onUp = (): void => {
      window.__UITools.isDragging = false;
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('mouseup', onUp, true);
    };

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseup', onUp, true);
  });
}
