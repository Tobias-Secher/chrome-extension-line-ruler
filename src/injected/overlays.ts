import type { BoxModelDims, StyleGroup } from '../shared/api';
import { host, guides } from './state';

// ─── Box model overlay ────────────────────────────────────────────────────

let _bmEls: HTMLElement[] = [];

export function setBoxModel(d: BoxModelDims): void {
  for (const el of _bmEls) { el.parentNode?.removeChild(el); }
  _bmEls = [];

  const layers = [
    {
      t: d.y - d.mt, l: d.x - d.ml,
      w: d.w + d.ml + d.mr, h: d.h + d.mt + d.mb,
      bg: 'rgba(246,152,51,0.35)',
    },
    {
      t: d.y, l: d.x, w: d.w, h: d.h,
      bg: 'rgba(255,213,79,0.3)',
    },
    {
      t: d.y + d.bt, l: d.x + d.bl,
      w: d.w - d.bl - d.br, h: d.h - d.bt - d.bb,
      bg: 'rgba(76,175,80,0.35)',
    },
    {
      t: d.y + d.bt + d.pt, l: d.x + d.bl + d.pl,
      w: d.w - d.bl - d.br - d.pl - d.pr,
      h: d.h - d.bt - d.bb - d.pt - d.pb,
      bg: 'rgba(66,133,244,0.35)',
    },
  ];

  layers.forEach((layer, i) => {
    const el = document.createElement('div');
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

export function clearBoxModel(): void {
  for (const el of _bmEls) { el.parentNode?.removeChild(el); }
  _bmEls = [];
}

// ─── Box Model Picker ─────────────────────────────────────────────────────

let _bmPickerActive = false;
let _bmPickerInterceptor: HTMLElement | null = null;
let _bmPickerHighlight: HTMLElement | null = null;
let _bmPickerHandlers: {
  mousemove?: (e: MouseEvent) => void;
  click?: (e: MouseEvent) => void;
  keydown?: (e: KeyboardEvent) => void;
} = {};

export function setBoxModelPicker(enable: boolean): void {
  if (enable && _bmPickerActive) return;
  if (!enable && !_bmPickerActive) return;

  if (enable) {
    _bmPickerActive = true;

    _bmPickerInterceptor = document.createElement('div');
    _bmPickerInterceptor.id = '__rl-bm-picker-interceptor';
    _bmPickerInterceptor.style.cssText = [
      'position:fixed',
      'top:0', 'left:0',
      'width:100vw', 'height:100vh',
      'pointer-events:all',
      'cursor:crosshair',
      'background:transparent',
      'z-index:2147483646',
    ].join(';');
    host.appendChild(_bmPickerInterceptor);

    _bmPickerHandlers.mousemove = _bmPickerOnMouseMove;
    _bmPickerHandlers.click = _bmPickerOnClick;
    _bmPickerHandlers.keydown = _bmPickerOnKeyDown;

    _bmPickerInterceptor.addEventListener('mousemove', _bmPickerHandlers.mousemove);
    _bmPickerInterceptor.addEventListener('click', _bmPickerHandlers.click);
    document.addEventListener('keydown', _bmPickerHandlers.keydown, true);
  } else {
    _bmPickerActive = false;
    _bmPickerClearHighlight();
    if (_bmPickerInterceptor) {
      if (_bmPickerHandlers.mousemove) _bmPickerInterceptor.removeEventListener('mousemove', _bmPickerHandlers.mousemove);
      if (_bmPickerHandlers.click) _bmPickerInterceptor.removeEventListener('click', _bmPickerHandlers.click);
      _bmPickerInterceptor.parentNode?.removeChild(_bmPickerInterceptor);
      _bmPickerInterceptor = null;
    }
    if (_bmPickerHandlers.keydown) document.removeEventListener('keydown', _bmPickerHandlers.keydown, true);
    _bmPickerHandlers = {};
  }
}

function _bmPickerElementFromPoint(x: number, y: number): Element | null {
  if (!_bmPickerInterceptor) return null;
  _bmPickerInterceptor.style.pointerEvents = 'none';
  const el = document.elementFromPoint(x, y);
  _bmPickerInterceptor.style.pointerEvents = 'all';
  if (el && host.contains(el)) return null;
  return el;
}

function _bmPickerOnMouseMove(e: MouseEvent): void {
  const el = _bmPickerElementFromPoint(e.clientX, e.clientY);
  _bmPickerClearHighlight();
  if (!el) return;

  const r = el.getBoundingClientRect();
  _bmPickerHighlight = document.createElement('div');
  _bmPickerHighlight.style.cssText = [
    'position:fixed',
    'top:' + r.top + 'px',
    'left:' + r.left + 'px',
    'width:' + r.width + 'px',
    'height:' + r.height + 'px',
    'outline:2px solid rgba(59,130,246,0.9)',
    'background:rgba(59,130,246,0.08)',
    'pointer-events:none',
    'z-index:2147483645',
    'box-sizing:border-box',
  ].join(';');
  host.appendChild(_bmPickerHighlight);
}

function _bmPickerOnClick(e: MouseEvent): void {
  e.preventDefault();
  e.stopPropagation();

  const el = _bmPickerElementFromPoint(e.clientX, e.clientY);
  if (!el) return;

  const r = el.getBoundingClientRect();
  const s = window.getComputedStyle(el);
  const d: BoxModelDims = {
    x: r.left, y: r.top, w: r.width, h: r.height,
    pt: parseFloat(s.paddingTop), pr: parseFloat(s.paddingRight),
    pb: parseFloat(s.paddingBottom), pl: parseFloat(s.paddingLeft),
    bt: parseFloat(s.borderTopWidth), br: parseFloat(s.borderRightWidth),
    bb: parseFloat(s.borderBottomWidth), bl: parseFloat(s.borderLeftWidth),
    mt: parseFloat(s.marginTop), mr: parseFloat(s.marginRight),
    mb: parseFloat(s.marginBottom), ml: parseFloat(s.marginLeft),
  };
  setBoxModel(d);

  window.__UITools.pendingUpdate = {
    type: 'elementPicked',
    ident: _buildIdent(el),
    groups: _collectStyleGroups(s),
  };
}

function _buildIdent(el: Element): string {
  const tag = el.tagName ? el.tagName.toLowerCase() : '';
  const id = el.id ? '#' + el.id : '';
  let classes = '';
  if (el.classList && el.classList.length) {
    for (let i = 0; i < el.classList.length; i++) classes += '.' + el.classList[i];
  }
  return tag + classes + id;
}

function _collectStyleGroups(s: CSSStyleDeclaration): StyleGroup[] {
  const groups: StyleGroup[] = [
    {
      name: 'Typography',
      rows: [
        ['font-family', s.fontFamily],
        ['font-size', s.fontSize],
        ['font-weight', s.fontWeight],
        ['line-height', s.lineHeight],
        ['letter-spacing', s.letterSpacing],
        ['text-align', s.textAlign],
        ['text-transform', s.textTransform],
        ['color', s.color],
      ],
    },
    {
      name: 'Box',
      rows: [
        ['width', s.width],
        ['height', s.height],
        ['padding', s.padding || [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].join(' ')],
        ['margin', s.margin || [s.marginTop, s.marginRight, s.marginBottom, s.marginLeft].join(' ')],
        ['border', s.border || (s.borderTopWidth + ' ' + s.borderTopStyle + ' ' + s.borderTopColor)],
        ['box-sizing', s.boxSizing],
      ],
    },
  ];

  const layoutRows: [string, string][] = [
    ['display', s.display],
    ['position', s.position],
    ['z-index', s.zIndex],
    ['overflow', s.overflow],
  ];
  if (s.position && s.position !== 'static') {
    layoutRows.push(['top', s.top]);
    layoutRows.push(['right', s.right]);
    layoutRows.push(['bottom', s.bottom]);
    layoutRows.push(['left', s.left]);
  }
  groups.push({ name: 'Layout', rows: layoutRows });

  groups.push({
    name: 'Appearance',
    rows: [
      ['background-color', s.backgroundColor],
      ['background-image', s.backgroundImage],
      ['opacity', s.opacity],
      ['border-radius', s.borderRadius],
      ['box-shadow', s.boxShadow],
      ['transform', s.transform],
      ['filter', s.filter],
      ['cursor', s.cursor],
    ],
  });

  if (s.display === 'flex' || s.display === 'inline-flex') {
    groups.push({
      name: 'Flex container',
      rows: [
        ['flex-direction', s.flexDirection],
        ['justify-content', s.justifyContent],
        ['align-items', s.alignItems],
        ['gap', s.gap],
      ],
    });
  } else if (s.display === 'grid' || s.display === 'inline-grid') {
    groups.push({
      name: 'Grid container',
      rows: [
        ['grid-template-columns', s.gridTemplateColumns],
        ['grid-template-rows', s.gridTemplateRows],
        ['gap', s.gap],
      ],
    });
  }

  return groups;
}

function _bmPickerOnKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && _bmPickerActive) {
    e.preventDefault();
    e.stopPropagation();
    setBoxModelPicker(false);
    window.__UITools.pendingUpdate = { type: 'boxModelPickerExit' };
  }
}

function _bmPickerClearHighlight(): void {
  if (_bmPickerHighlight) {
    _bmPickerHighlight.parentNode?.removeChild(_bmPickerHighlight);
    _bmPickerHighlight = null;
  }
}

// ─── Nudge ────────────────────────────────────────────────────────────────

export function nudgeGuide(id: string, delta: number): void {
  const el = guides.get(id);
  if (!el) return;
  const isH = el.classList.contains('__rl-h');
  const prop = isH ? 'top' : 'left';
  const cur = parseInt(el.style[prop]) || 0;
  const next = Math.max(0, cur + delta);
  el.style[prop] = next + 'px';
  const label = el.querySelector<HTMLElement>('.__rl-label');
  if (label) label.textContent = next + 'px';
  window.__UITools.pendingUpdate = { type: 'guide', id, pos: next };
}

// ─── Font inspector ────────────────────────────────────────────────────────

let _fontActive = false;
let _fontTip: HTMLElement | null = null;
let _fontMoveHandler: ((e: MouseEvent) => void) | null = null;

export function setFontInspector(enable: boolean): void {
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

    _fontMoveHandler = (e: MouseEvent): void => {
      const el = e.target as Element | null;
      if (!el || el === _fontTip) return;
      const s = window.getComputedStyle(el);
      const family = s.fontFamily.split(',')[0]!.replace(/['"]/g, '').trim();
      const size = s.fontSize;
      const weight = s.fontWeight;
      const lh = parseFloat(s.lineHeight) && parseFloat(s.fontSize)
        ? (parseFloat(s.lineHeight) / parseFloat(s.fontSize)).toFixed(2)
        : s.lineHeight;
      const dim = '<span style="color:#5a5a65">size</span>&nbsp;' + size +
        '&nbsp;&nbsp;<span style="color:#5a5a65">weight</span>&nbsp;' + weight +
        '&nbsp;&nbsp;<span style="color:#5a5a65">lh</span>&nbsp;' + lh;
      if (!_fontTip) return;
      _fontTip.innerHTML =
        '<span style="color:#9cdcfe">' + family + '</span><br>' + dim;
      let tx = e.clientX + 14, ty = e.clientY + 14;
      if (tx + 160 > window.innerWidth) tx = e.clientX - 170;
      if (ty + 52 > window.innerHeight) ty = e.clientY - 58;
      _fontTip.style.left = tx + 'px';
      _fontTip.style.top = ty + 'px';
      _fontTip.style.display = '';
    };
    document.addEventListener('mousemove', _fontMoveHandler, true);
  } else {
    if (_fontMoveHandler) document.removeEventListener('mousemove', _fontMoveHandler, true);
    _fontMoveHandler = null;
    if (_fontTip) { _fontTip.remove(); _fontTip = null; }
    _fontActive = false;
  }
}

// ─── Grid overlay ─────────────────────────────────────────────────────────

export function setGrid(visible: boolean, columns: number, gap: number, color: string): void {
  const existing = document.getElementById('__rl-grid');
  if (existing) { existing.parentNode?.removeChild(existing); }
  if (!visible) return;

  const grid = document.createElement('div');
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

  for (let i = 0; i < columns; i++) {
    const col = document.createElement('div');
    col.style.cssText = 'background:' + color + ';opacity:0.12;pointer-events:none;';
    grid.appendChild(col);
  }

  host.appendChild(grid);
}
