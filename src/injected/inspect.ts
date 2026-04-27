import { host } from './state';

let _inspectActive = false;
let _inspectInterceptor: HTMLElement | null = null;
let _inspectSelected: Element | null = null;
let _inspectHovered: Element | null = null;
let _inspectOverlayEls: HTMLElement[] = [];
let _inspectHandlers: {
  mousemove?: (e: MouseEvent) => void;
  click?: (e: MouseEvent) => void;
  keydown?: (e: KeyboardEvent) => void;
  scroll?: () => void;
  resize?: () => void;
} = {};

const INSPECT_BLUE_OUTLINE = 'rgba(59,130,246,0.9)';
const INSPECT_BLUE_FILL = 'rgba(59,130,246,0.08)';
const INSPECT_GREEN_OUTLINE = 'rgba(34,197,94,0.9)';
const INSPECT_GREEN_FILL = 'rgba(34,197,94,0.08)';
const INSPECT_LINE_COLOR = 'rgba(255,100,100,0.9)';

export function setInspectMode(enable: boolean): void {
  if (enable && _inspectActive) return;
  if (!enable && !_inspectActive) return;

  if (enable) {
    _inspectActive = true;

    _inspectInterceptor = document.createElement('div');
    _inspectInterceptor.id = '__rl-inspect-interceptor';
    _inspectInterceptor.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100vw',
      'height:100vh',
      'pointer-events:all',
      'cursor:crosshair',
      'background:transparent',
      'z-index:2147483646',
    ].join(';');
    host.appendChild(_inspectInterceptor);

    _inspectHandlers.mousemove = _inspectOnMouseMove;
    _inspectHandlers.click = _inspectOnClick;
    _inspectHandlers.keydown = _inspectOnKeyDown;
    _inspectHandlers.scroll = _inspectOnScroll;
    _inspectHandlers.resize = _inspectOnResize;

    _inspectInterceptor.addEventListener('mousemove', _inspectHandlers.mousemove);
    _inspectInterceptor.addEventListener('click', _inspectHandlers.click);
    document.addEventListener('keydown', _inspectHandlers.keydown, true);
    window.addEventListener('scroll', _inspectHandlers.scroll, true);
    window.addEventListener('resize', _inspectHandlers.resize);
  } else {
    _inspectActive = false;

    if (_inspectInterceptor) {
      if (_inspectHandlers.mousemove) _inspectInterceptor.removeEventListener('mousemove', _inspectHandlers.mousemove);
      if (_inspectHandlers.click) _inspectInterceptor.removeEventListener('click', _inspectHandlers.click);
      _inspectInterceptor.parentNode?.removeChild(_inspectInterceptor);
      _inspectInterceptor = null;
    }
    if (_inspectHandlers.keydown) document.removeEventListener('keydown', _inspectHandlers.keydown, true);
    if (_inspectHandlers.scroll) window.removeEventListener('scroll', _inspectHandlers.scroll, true);
    if (_inspectHandlers.resize) window.removeEventListener('resize', _inspectHandlers.resize);
    _inspectHandlers = {};

    _inspectClearAll();
  }
}

function _inspectElementFromPoint(x: number, y: number): Element | null {
  if (!_inspectInterceptor) return null;
  _inspectInterceptor.style.pointerEvents = 'none';
  const el = document.elementFromPoint(x, y);
  _inspectInterceptor.style.pointerEvents = 'all';
  if (el && host.contains(el)) return null;
  return el;
}

function _inspectOnMouseMove(e: MouseEvent): void {
  const el = _inspectElementFromPoint(e.clientX, e.clientY);

  if (_inspectSelected) {
    if (!document.contains(_inspectSelected)) {
      _inspectSelected = null;
      _inspectHovered = null;
      _inspectClearOverlays();
      if (el) {
        _inspectHovered = el;
        _inspectRenderHover();
      }
      return;
    }

    const selRect = _inspectSelected.getBoundingClientRect();
    if (!_inspectIsInViewport(selRect)) {
      _inspectClearOverlays();
      return;
    }

    if (el === _inspectSelected) {
      _inspectHovered = null;
      _inspectClearOverlays();
      _inspectDrawHighlight(selRect, 'selected');
      return;
    }

    if (!el) {
      _inspectHovered = null;
      _inspectClearOverlays();
      _inspectDrawHighlight(selRect, 'selected');
      return;
    }

    _inspectHovered = el;
    _inspectRender();
  } else {
    if (!el) {
      _inspectHovered = null;
      _inspectClearOverlays();
      return;
    }
    _inspectHovered = el;
    _inspectRenderHover();
  }
}

function _inspectOnClick(e: MouseEvent): void {
  e.preventDefault();
  e.stopPropagation();

  const el = _inspectElementFromPoint(e.clientX, e.clientY);
  if (!el) return;

  if (el === _inspectSelected) {
    _inspectSelected = null;
    _inspectHovered = null;
    _inspectClearOverlays();
  } else {
    _inspectSelected = el;
    _inspectHovered = null;
    _inspectClearOverlays();
    _inspectDrawHighlight(_inspectSelected.getBoundingClientRect(), 'selected');
  }
}

function _inspectOnKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && _inspectActive) {
    e.preventDefault();
    e.stopPropagation();
    setInspectMode(false);
    window.__UITools.pendingUpdate = { type: 'inspectExit' };
  }
}

function _inspectOnScroll(): void {
  if (!_inspectSelected) return;
  if (!document.contains(_inspectSelected)) {
    _inspectSelected = null;
    _inspectHovered = null;
    _inspectClearOverlays();
    return;
  }
  const selRect = _inspectSelected.getBoundingClientRect();
  if (!_inspectIsInViewport(selRect)) {
    _inspectClearOverlays();
    return;
  }
  if (_inspectHovered && document.contains(_inspectHovered)) {
    _inspectRender();
  } else {
    _inspectClearOverlays();
    _inspectDrawHighlight(selRect, 'selected');
  }
}

function _inspectOnResize(): void {
  _inspectOnScroll();
}

function _inspectClearOverlays(): void {
  for (const el of _inspectOverlayEls) {
    el.parentNode?.removeChild(el);
  }
  _inspectOverlayEls = [];
}

function _inspectClearAll(): void {
  _inspectClearOverlays();
  _inspectSelected = null;
  _inspectHovered = null;
}

function _inspectRenderHover(): void {
  _inspectClearOverlays();
  if (!_inspectHovered) return;
  _inspectDrawHighlight(_inspectHovered.getBoundingClientRect(), 'hovered');
}

function _inspectRender(): void {
  _inspectClearOverlays();
  if (!_inspectSelected || !_inspectHovered) return;

  const selRect = _inspectSelected.getBoundingClientRect();
  const hovRect = _inspectHovered.getBoundingClientRect();

  _inspectDrawHighlight(selRect, 'selected');
  _inspectDrawHighlight(hovRect, 'hovered');
  _inspectComputeMeasurements(selRect, hovRect);
}

function _inspectDrawHighlight(rect: DOMRect, type: 'selected' | 'hovered'): void {
  const outlineColor = type === 'selected' ? INSPECT_BLUE_OUTLINE : INSPECT_GREEN_OUTLINE;
  const fillColor = type === 'selected' ? INSPECT_BLUE_FILL : INSPECT_GREEN_FILL;

  const el = document.createElement('div');
  el.style.cssText = [
    'position:fixed',
    'top:' + rect.top + 'px',
    'left:' + rect.left + 'px',
    'width:' + rect.width + 'px',
    'height:' + rect.height + 'px',
    'outline:2px solid ' + outlineColor,
    'background:' + fillColor,
    'pointer-events:none',
    'z-index:2147483645',
    'box-sizing:border-box',
  ].join(';');
  host.appendChild(el);
  _inspectOverlayEls.push(el);
}

function _inspectComputeMeasurements(selRect: DOMRect, hovRect: DOMRect): void {
  const selContainsHov = selRect.left <= hovRect.left && selRect.right >= hovRect.right &&
                         selRect.top <= hovRect.top && selRect.bottom >= hovRect.bottom;
  const hovContainsSel = hovRect.left <= selRect.left && hovRect.right >= selRect.right &&
                         hovRect.top <= selRect.top && hovRect.bottom >= selRect.bottom;

  if (selContainsHov) {
    _inspectDrawInset(selRect, hovRect);
    return;
  }
  if (hovContainsSel) {
    _inspectDrawInset(hovRect, selRect);
    return;
  }

  const hOverlap = Math.min(selRect.right, hovRect.right) - Math.max(selRect.left, hovRect.left);
  const vOverlap = Math.min(selRect.bottom, hovRect.bottom) - Math.max(selRect.top, hovRect.top);

  if (hOverlap > 0 && vOverlap > 0) return;

  let showHorizontal = false;
  let showVertical = false;

  if (hOverlap > 0 && vOverlap <= 0) {
    showVertical = true;
  } else if (vOverlap > 0 && hOverlap <= 0) {
    showHorizontal = true;
  } else {
    showHorizontal = true;
    showVertical = true;
  }

  if (showHorizontal) {
    let leftEdge: number, rightEdge: number;
    if (selRect.right <= hovRect.left) {
      leftEdge = selRect.right;
      rightEdge = hovRect.left;
    } else {
      leftEdge = hovRect.right;
      rightEdge = selRect.left;
    }
    const hDist = rightEdge - leftEdge;
    if (hDist > 0) {
      let midY: number;
      if (vOverlap > 0) {
        midY = (Math.max(selRect.top, hovRect.top) + Math.min(selRect.bottom, hovRect.bottom)) / 2;
      } else {
        midY = (selRect.top + selRect.bottom + hovRect.top + hovRect.bottom) / 4;
      }
      _inspectDrawLine(leftEdge, midY, hDist, true, Math.round(hDist));
    }
  }

  if (showVertical) {
    let topEdge: number, bottomEdge: number;
    if (selRect.bottom <= hovRect.top) {
      topEdge = selRect.bottom;
      bottomEdge = hovRect.top;
    } else {
      topEdge = hovRect.bottom;
      bottomEdge = selRect.top;
    }
    const vDist = bottomEdge - topEdge;
    if (vDist > 0) {
      let midX: number;
      if (hOverlap > 0) {
        midX = (Math.max(selRect.left, hovRect.left) + Math.min(selRect.right, hovRect.right)) / 2;
      } else {
        midX = (selRect.left + selRect.right + hovRect.left + hovRect.right) / 4;
      }
      _inspectDrawLine(midX, topEdge, vDist, false, Math.round(vDist));
    }
  }
}

function _inspectDrawLine(x: number, y: number, length: number, isHorizontal: boolean, value: number): void {
  const line = document.createElement('div');
  if (isHorizontal) {
    line.style.cssText = [
      'position:fixed',
      'top:' + (y - 0.5) + 'px',
      'left:' + x + 'px',
      'width:' + length + 'px',
      'height:1px',
      'background:' + INSPECT_LINE_COLOR,
      'pointer-events:none',
      'z-index:2147483646',
    ].join(';');
  } else {
    line.style.cssText = [
      'position:fixed',
      'top:' + y + 'px',
      'left:' + (x - 0.5) + 'px',
      'width:1px',
      'height:' + length + 'px',
      'background:' + INSPECT_LINE_COLOR,
      'pointer-events:none',
      'z-index:2147483646',
    ].join(';');
  }
  host.appendChild(line);
  _inspectOverlayEls.push(line);

  const capSize = 5;
  if (isHorizontal) {
    _inspectDrawCap(x, y - capSize, 1, capSize * 2);
    _inspectDrawCap(x + length - 1, y - capSize, 1, capSize * 2);
  } else {
    _inspectDrawCap(x - capSize, y, capSize * 2, 1);
    _inspectDrawCap(x - capSize, y + length - 1, capSize * 2, 1);
  }

  const lbl = document.createElement('span');
  lbl.textContent = value + 'px';
  lbl.style.cssText = [
    'position:fixed',
    'font:9px monospace',
    'color:#fff',
    'background:rgba(0,0,0,0.7)',
    'padding:1px 4px',
    'border-radius:2px',
    'pointer-events:none',
    'white-space:nowrap',
    'z-index:2147483647',
  ].join(';');

  lbl.style.visibility = 'hidden';
  host.appendChild(lbl);
  const lblWidth = lbl.offsetWidth;
  const lblHeight = lbl.offsetHeight;
  lbl.style.visibility = '';

  if (isHorizontal) {
    lbl.style.left = (x + length / 2 - lblWidth / 2) + 'px';
    lbl.style.top = (y - lblHeight - 2) + 'px';
  } else {
    lbl.style.left = (x + 4) + 'px';
    lbl.style.top = (y + length / 2 - lblHeight / 2) + 'px';
  }

  _inspectOverlayEls.push(lbl);
}

function _inspectDrawCap(x: number, y: number, w: number, h: number): void {
  const cap = document.createElement('div');
  cap.style.cssText = [
    'position:fixed',
    'top:' + y + 'px',
    'left:' + x + 'px',
    'width:' + w + 'px',
    'height:' + h + 'px',
    'background:' + INSPECT_LINE_COLOR,
    'pointer-events:none',
    'z-index:2147483646',
  ].join(';');
  host.appendChild(cap);
  _inspectOverlayEls.push(cap);
}

function _inspectDrawInset(containerRect: DOMRect, childRect: DOMRect): void {
  const top = childRect.top - containerRect.top;
  const bottom = containerRect.bottom - childRect.bottom;
  const left = childRect.left - containerRect.left;
  const right = containerRect.right - childRect.right;

  if (top > 0) {
    const cx = childRect.left + childRect.width / 2;
    _inspectDrawLine(cx, containerRect.top, top, false, Math.round(top));
  }

  if (bottom > 0) {
    const cx2 = childRect.left + childRect.width / 2;
    _inspectDrawLine(cx2, childRect.bottom, bottom, false, Math.round(bottom));
  }

  if (left > 0) {
    const cy = childRect.top + childRect.height / 2;
    _inspectDrawLine(containerRect.left, cy, left, true, Math.round(left));
  }

  if (right > 0) {
    const cy2 = childRect.top + childRect.height / 2;
    _inspectDrawLine(childRect.right, cy2, right, true, Math.round(right));
  }
}

function _inspectIsInViewport(rect: DOMRect): boolean {
  return rect.bottom > 0 && rect.top < window.innerHeight &&
         rect.right > 0 && rect.left < window.innerWidth;
}
