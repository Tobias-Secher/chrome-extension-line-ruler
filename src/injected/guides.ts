import type { Axis, UIToolsRuntime } from '../shared/api';

declare const __UITools: UIToolsRuntime;

export function createGuide(id: string, axis: Axis, pos: number, color: string): HTMLElement {
  const el = document.createElement('div');
  el.className = '__rl-guide __rl-' + axis;
  el.dataset['id'] = id;

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

  const handle = document.createElement('div');
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

  const label = document.createElement('span');
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

function attachDragHandler(handle: HTMLElement, guideEl: HTMLElement, id: string, isH: boolean): void {
  handle.addEventListener('mousedown', (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.__UITools.isDragging = true;

    const onMove = (ev: MouseEvent): void => {
      let pos = isH ? ev.clientY : ev.clientX;
      pos = Math.max(0, pos);
      guideEl.style[isH ? 'top' : 'left'] = pos + 'px';
      const label = guideEl.querySelector<HTMLElement>('.__rl-label');
      if (label) label.textContent = pos + 'px';
      window.__UITools.pendingUpdate = { type: 'guide', id, pos };
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
