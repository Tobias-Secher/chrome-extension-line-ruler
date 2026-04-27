export const RULER_SIZE = 20;
export const TICK_COLOR = 'rgba(180, 180, 180, 0.6)';
export const RULER_BG = 'rgba(30, 30, 30, 0.85)';
export const LABEL_COLOR = 'rgba(200, 200, 200, 0.7)';

export const guides = new Map<string, HTMLElement>();
export const boxes = new Map<string, HTMLElement>();

function ensureHost(): HTMLElement {
  const existing = document.getElementById('__rl-host');
  if (existing) return existing;
  const el = document.createElement('div');
  el.id = '__rl-host';
  el.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'width:100vw',
    'height:100vh',
    'pointer-events:none',
    'z-index:2147483647',
    'overflow:hidden',
  ].join(';');
  document.body.appendChild(el);
  return el;
}

export const host: HTMLElement = ensureHost();
