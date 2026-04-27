import { host } from './state';

let active = false;
let elH: HTMLElement | null = null;
let elV: HTMLElement | null = null;
let moveHandler: ((e: MouseEvent) => void) | null = null;

export function setCrosshair(enable: boolean): void {
  if (enable === active) return;
  active = enable;

  if (enable) {
    elH = document.createElement('div');
    elH.style.cssText =
      'position:fixed;left:0;top:0;width:100%;height:1px;' +
      'background:rgba(255,255,255,0.55);pointer-events:none;' +
      'box-shadow:0 0 0 1px rgba(0,0,0,0.25);z-index:2147483647;';

    elV = document.createElement('div');
    elV.style.cssText =
      'position:fixed;left:0;top:0;width:1px;height:100%;' +
      'background:rgba(255,255,255,0.55);pointer-events:none;' +
      'box-shadow:0 0 0 1px rgba(0,0,0,0.25);z-index:2147483647;';

    host.appendChild(elH);
    host.appendChild(elV);

    moveHandler = (e: MouseEvent): void => {
      if (elH) elH.style.top = e.clientY + 'px';
      if (elV) elV.style.left = e.clientX + 'px';
    };
    document.addEventListener('mousemove', moveHandler);
  } else {
    if (moveHandler) document.removeEventListener('mousemove', moveHandler);
    moveHandler = null;
    if (elH) { elH.remove(); elH = null; }
    if (elV) { elV.remove(); elV = null; }
  }
}
