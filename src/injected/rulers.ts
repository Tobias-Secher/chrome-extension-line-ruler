import type { Axis } from '../shared/api';
import { host, guides, RULER_SIZE, RULER_BG, TICK_COLOR, LABEL_COLOR } from './state';
import { createGuide } from './guides';

function buildRulerTop(): HTMLElement {
  const ruler = document.createElement('div');
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

  const vw = Math.max(window.innerWidth, 2000);
  const frag = document.createDocumentFragment();
  for (let x = 0; x <= vw; x += 10) {
    const isMajor = x % 100 === 0;
    const isMid = x % 50 === 0;
    const tickH = isMajor ? RULER_SIZE : isMid ? 10 : 5;

    const tick = document.createElement('div');
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
      const lbl = document.createElement('span');
      lbl.textContent = String(x);
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

function buildRulerLeft(): HTMLElement {
  const ruler = document.createElement('div');
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

  const vh = Math.max(window.innerHeight, 2000);
  const frag = document.createDocumentFragment();
  for (let y = 0; y <= vh; y += 10) {
    const isMajor = y % 100 === 0;
    const isMid = y % 50 === 0;
    const tickW = isMajor ? RULER_SIZE : isMid ? 10 : 5;

    const tick = document.createElement('div');
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
      const lbl = document.createElement('span');
      lbl.textContent = String(y);
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

function buildCornerCap(): HTMLElement {
  const cap = document.createElement('div');
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

function attachRulerDrag(): void {
  const top = document.getElementById('__rl-ruler-top');
  const left = document.getElementById('__rl-ruler-left');
  if (!top || !left) return;

  function startDrag(e: MouseEvent, axis: Axis): void {
    e.preventDefault();
    e.stopPropagation();
    const isH = axis === 'h';
    const tempId = '_d' + Date.now();
    const startPos = isH ? e.clientY : e.clientX;

    const el = createGuide(tempId, axis, startPos, '#888');
    guides.set(tempId, el);
    host.appendChild(el);
    window.__UITools.isDragging = true;

    const onMove = (ev: MouseEvent): void => {
      let newPos = isH ? ev.clientY : ev.clientX;
      newPos = Math.max(0, newPos);
      el.style[isH ? 'top' : 'left'] = newPos + 'px';
      const lbl = el.querySelector<HTMLElement>('.__rl-label');
      if (lbl) lbl.textContent = Math.round(newPos) + 'px';
    };

    const onUp = (ev: MouseEvent): void => {
      window.__UITools.isDragging = false;
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('mouseup', onUp, true);
      const finalPos = isH ? ev.clientY : ev.clientX;
      if (finalPos <= RULER_SIZE) {
        window.__UITools.removeGuide(tempId);
      } else {
        window.__UITools.pendingUpdate = {
          type: 'newGuide',
          id: tempId,
          axis,
          pos: Math.round(finalPos),
        };
      }
    };

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseup', onUp, true);
  }

  top.addEventListener('mousedown', (e: MouseEvent) => { startDrag(e, 'h'); });
  left.addEventListener('mousedown', (e: MouseEvent) => { startDrag(e, 'v'); });
}

attachRulerDrag();
