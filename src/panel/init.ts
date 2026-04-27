import { state } from './state';
import { injectRuntime, call } from './bridge';
import { addGuide } from './guides';
import { addBox } from './boxes';
import { renderGuideList, renderBoxList, renderSelected } from './render';
import { updateCoordDisplay, ensurePolling } from './sync';
import { clearAll, applyGrid, toggleInspect, toggleBoxModelPicker, scanBreakpoints } from './features';
import { initTheme } from './theme';

interface ToastEl extends HTMLElement {
  _timer?: ReturnType<typeof setTimeout>;
}

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error('UI Tools: missing #' + id);
  return el as T;
}

byId('btn-add-h').addEventListener('click', () => { addGuide('h'); });
byId('btn-add-v').addEventListener('click', () => { addGuide('v'); });
byId('btn-add-box').addEventListener('click', addBox);
byId('btn-clear-all').addEventListener('click', clearAll);

byId('btn-box-model').addEventListener('click', function (this: HTMLElement) {
  state.boxModel = !state.boxModel;
  this.classList.toggle('active', state.boxModel);

  if (state.boxModel) {
    if (state.inspect) {
      state.inspect = false;
      byId('btn-inspect').classList.remove('active');
      toggleInspect(false);
    }
    toggleBoxModelPicker(true);
    ensurePolling();
  } else {
    toggleBoxModelPicker(false);
    void call('clearBoxModel');
  }
});

byId('btn-rulers').addEventListener('click', function (this: HTMLElement) {
  state.rulers = !state.rulers;
  this.classList.toggle('active', state.rulers);
  void call('setRulers', state.rulers);
});

byId('btn-crosshair').addEventListener('click', function (this: HTMLElement) {
  state.crosshair = !state.crosshair;
  this.classList.toggle('active', state.crosshair);
  void call('setCrosshair', state.crosshair);
});

byId('btn-grid').addEventListener('click', function (this: HTMLElement) {
  state.grid = !state.grid;
  this.classList.toggle('active', state.grid);
  byId('grid-settings').classList.toggle('hidden', !state.grid);
  applyGrid();
});

byId<HTMLInputElement>('input-grid-cols').addEventListener('input', function (this: HTMLInputElement) {
  const v = parseInt(this.value, 10);
  if (v >= 1 && v <= 48) {
    state.gridCols = v;
    if (state.grid) applyGrid();
  }
});

byId<HTMLInputElement>('input-grid-gap').addEventListener('input', function (this: HTMLInputElement) {
  const v = parseInt(this.value, 10);
  if (!isNaN(v) && v >= 0) {
    state.gridGap = v;
    if (state.grid) applyGrid();
  }
});

byId<HTMLInputElement>('input-grid-color').addEventListener('input', function (this: HTMLInputElement) {
  state.gridColor = this.value;
  if (state.grid) applyGrid();
});

byId('btn-bp-scan').addEventListener('click', scanBreakpoints);

document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (!state.selectedId) return;
  const isArrow = e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight';
  if (!isArrow) return;
  e.preventDefault();

  const guide = state.guides.find((g) => g.id === state.selectedId);
  if (!guide) return;

  let delta = e.shiftKey ? 10 : 1;
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') delta = -delta;
  if (guide.axis === 'h' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
  if (guide.axis === 'v' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) return;

  guide.pos = Math.max(0, guide.pos + delta);
  void call('nudgeGuide', state.selectedId, delta);
  updateCoordDisplay(state.selectedId, guide.pos);
});

function showColorToast(hex: string): void {
  void navigator.clipboard.writeText(hex);
  const toast = document.getElementById('color-toast') as ToastEl | null;
  if (!toast) return;
  while (toast.firstChild) toast.removeChild(toast.firstChild);
  const swatch = document.createElement('span');
  swatch.className = 'color-toast-swatch';
  swatch.style.background = hex;
  const label = document.createElement('span');
  label.className = 'color-toast-hex';
  label.textContent = hex;
  const hint = document.createElement('span');
  hint.className = 'color-toast-copy';
  hint.textContent = 'copied';
  toast.appendChild(swatch);
  toast.appendChild(label);
  toast.appendChild(hint);
  toast.classList.remove('hidden');
  if (toast._timer) clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}

interface EyeDropperResult { sRGBHex: string }
interface EyeDropperCtor { new (): { open(): Promise<EyeDropperResult> } }
const eyeDropperCtor = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;

if (!eyeDropperCtor) {
  byId('btn-eyedropper').style.display = 'none';
}

byId('btn-eyedropper').addEventListener('click', async () => {
  if (!eyeDropperCtor) return;
  try {
    const result = await new eyeDropperCtor().open();
    showColorToast(result.sRGBHex);
  } catch { /* user cancelled */ }
});

byId('btn-inspect').addEventListener('click', function (this: HTMLElement) {
  state.inspect = !state.inspect;
  this.classList.toggle('active', state.inspect);

  if (state.inspect && state.boxModel) {
    state.boxModel = false;
    byId('btn-box-model').classList.remove('active');
    toggleBoxModelPicker(false);
    void call('clearBoxModel');
  }

  toggleInspect(state.inspect);
  if (state.inspect) ensurePolling();
});

byId('btn-font').addEventListener('click', function (this: HTMLElement) {
  state.fontInspector = !state.fontInspector;
  this.classList.toggle('active', state.fontInspector);
  void call('setFontInspector', state.fontInspector);
});

byId('btn-selected-clear').addEventListener('click', () => {
  state.selectedElement = null;
  renderSelected();
});

if (chrome.devtools && chrome.devtools.network && chrome.devtools.network.onNavigated) {
  chrome.devtools.network.onNavigated.addListener(() => {
    state.selectedElement = null;
    renderSelected();
  });
}

initTheme();

renderGuideList();
renderBoxList();
renderSelected();

byId('version-bar').textContent = 'v' + chrome.runtime.getManifest().version;

injectRuntime(() => {
  byId('btn-rulers').classList.add('active');
  scanBreakpoints();
});
