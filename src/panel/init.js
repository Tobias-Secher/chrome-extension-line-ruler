import { state } from './state.js';
import { injectRuntime, evalInPage } from './bridge.js';
import { addGuide } from './guides.js';
import { addBox } from './boxes.js';
import { renderGuideList, renderBoxList } from './render.js';
import { updateCoordDisplay, ensurePolling } from './sync.js';
import { clearAll, applyGrid, showBoxModel, toggleInspect, scanBreakpoints } from './features.js';

// ─── Toolbar buttons ───────────────────────────────────────────────────────

document.getElementById('btn-add-h').addEventListener('click', function () { addGuide('h'); });
document.getElementById('btn-add-v').addEventListener('click', function () { addGuide('v'); });
document.getElementById('btn-add-box').addEventListener('click', addBox);
document.getElementById('btn-clear-all').addEventListener('click', clearAll);

document.getElementById('btn-box-model').addEventListener('click', function () {
  state.boxModel = !state.boxModel;
  this.classList.toggle('active', state.boxModel);
  if (state.boxModel) {
    showBoxModel();
  } else {
    evalInPage('__UITools.clearBoxModel()');
  }
});

document.getElementById('chk-rulers').addEventListener('change', function () {
  state.rulers = this.checked;
  evalInPage('__UITools.setRulers(' + state.rulers + ')');
});

document.getElementById('btn-crosshair').addEventListener('click', function () {
  state.crosshair = !state.crosshair;
  this.classList.toggle('active', state.crosshair);
  evalInPage('__UITools.setCrosshair(' + state.crosshair + ')');
});

document.getElementById('btn-grid').addEventListener('click', function () {
  state.grid = !state.grid;
  this.classList.toggle('active', state.grid);
  document.getElementById('grid-settings').classList.toggle('hidden', !state.grid);
  applyGrid();
});

document.getElementById('input-grid-cols').addEventListener('input', function () {
  var v = parseInt(this.value, 10);
  if (v >= 1 && v <= 48) {
    state.gridCols = v;
    if (state.grid) applyGrid();
  }
});

document.getElementById('input-grid-gap').addEventListener('input', function () {
  var v = parseInt(this.value, 10);
  if (!isNaN(v) && v >= 0) {
    state.gridGap = v;
    if (state.grid) applyGrid();
  }
});

document.getElementById('input-grid-color').addEventListener('input', function () {
  state.gridColor = this.value;
  if (state.grid) applyGrid();
});

document.getElementById('btn-bp-scan').addEventListener('click', scanBreakpoints);

// ─── Keyboard nudge ────────────────────────────────────────────────────────

document.addEventListener('keydown', function (e) {
  if (!state.selectedId) return;
  var isArrow = e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight';
  if (!isArrow) return;
  e.preventDefault();

  var guide = state.guides.find(function (g) { return g.id === state.selectedId; });
  if (!guide) return;

  var delta = e.shiftKey ? 10 : 1;
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') delta = -delta;
  // Only allow axis-appropriate arrow keys
  if (guide.axis === 'h' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
  if (guide.axis === 'v' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) return;

  guide.pos = Math.max(0, guide.pos + delta);
  evalInPage('__UITools.nudgeGuide(' + JSON.stringify(state.selectedId) + ',' + delta + ')');
  updateCoordDisplay(state.selectedId, guide.pos);
});

// ─── Color eyedropper ─────────────────────────────────────────────────────

document.getElementById('btn-eyedropper').addEventListener('click', async function () {
  if (!('EyeDropper' in window)) return;
  try {
    var result = await new EyeDropper().open();
    var hex = result.sRGBHex;
    navigator.clipboard.writeText(hex);
    var toast = document.getElementById('color-toast');
    toast.innerHTML = '';
    var swatch = document.createElement('span');
    swatch.className = 'color-toast-swatch';
    swatch.style.background = hex;
    var label = document.createElement('span');
    label.className = 'color-toast-hex';
    label.textContent = hex;
    var hint = document.createElement('span');
    hint.className = 'color-toast-copy';
    hint.textContent = 'copied';
    toast.appendChild(swatch);
    toast.appendChild(label);
    toast.appendChild(hint);
    toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { toast.classList.add('hidden'); }, 3000);
  } catch (e) { /* user cancelled */ }
});

// ─── Inspect mode ─────────────────────────────────────────────────────────

document.getElementById('btn-inspect').addEventListener('click', function () {
  state.inspect = !state.inspect;
  this.classList.toggle('active', state.inspect);
  toggleInspect(state.inspect);
  if (state.inspect) ensurePolling();
});

// ─── Font inspector ───────────────────────────────────────────────────────

document.getElementById('btn-font').addEventListener('click', function () {
  state.fontInspector = !state.fontInspector;
  this.classList.toggle('active', state.fontInspector);
  evalInPage('__UITools.setFontInspector(' + state.fontInspector + ')');
});

// ─── Element selection changes ────────────────────────────────────────────

chrome.devtools.panels.elements.onSelectionChanged.addListener(function () {
  if (state.boxModel) showBoxModel();
});

// ─── Startup ─────────────────────────────────────────────────────────────

renderGuideList();
renderBoxList();

// Inject runtime immediately so rulers appear on panel open
injectRuntime(function () {
  document.getElementById('chk-rulers').checked = true;
  scanBreakpoints();
});
