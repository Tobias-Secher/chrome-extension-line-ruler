// ─── Constants ────────────────────────────────────────────────────────────

const RULER_SIZE = 20; // px — width of left ruler, height of top ruler
const TICK_COLOR = 'rgba(180, 180, 180, 0.6)';
const RULER_BG = 'rgba(30, 30, 30, 0.85)';
const LABEL_COLOR = 'rgba(200, 200, 200, 0.7)';

// ─── State — preserved across re-injections ───────────────────────────────

let guides = {};
let boxes = {};

// ─── Host container — created only once ───────────────────────────────────

let host = document.getElementById('__rl-host');
if (!host) {
  host = document.createElement('div');
  host.id = '__rl-host';
  host.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'width:100vw',
    'height:100vh',
    'pointer-events:none',
    'z-index:2147483647',
    'overflow:hidden',
  ].join(';');
  document.body.appendChild(host);
}
