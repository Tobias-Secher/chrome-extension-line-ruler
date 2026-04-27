import { state } from './state';
import { call } from './bridge';
import { renderGuideList, renderBoxList, renderSelected } from './render';
import { stopPolling } from './sync';
import { addGuideAt } from './guides';

export function applyGrid(): void {
  void call('setGrid', state.grid, state.gridCols, state.gridGap, state.gridColor);
}

export function clearAll(): void {
  state.guides = [];
  state.boxes = [];
  state.rulers = true;
  state.grid = false;
  state.boxModel = false;
  state.inspect = false;
  state.fontInspector = false;
  state.selectedId = null;
  state.selectedElement = null;
  document.getElementById('btn-rulers')?.classList.add('active');
  document.getElementById('btn-box-model')?.classList.remove('active');
  document.getElementById('btn-grid')?.classList.remove('active');
  document.getElementById('btn-inspect')?.classList.remove('active');
  document.getElementById('btn-font')?.classList.remove('active');
  document.getElementById('grid-settings')?.classList.add('hidden');
  void call('clearAll');
  void call('setRulers', true);
  void call('setGrid', false, state.gridCols, state.gridGap, state.gridColor);
  void call('setInspectMode', false);
  void call('setBoxModelPicker', false);
  void call('setFontInspector', false);
  renderGuideList();
  renderBoxList();
  renderSelected();
  stopPolling();
}

export function toggleInspect(enable: boolean): void {
  state.inspect = enable;
  void call('setInspectMode', enable);
}

export function toggleBoxModelPicker(enable: boolean): void {
  void call('setBoxModelPicker', enable);
}

const FALLBACK_BREAKPOINTS = [320, 768, 1024, 1440];

export function renderBreakpoints(widths: number[], isFallback: boolean): void {
  const container = document.getElementById('bp-buttons');
  const label = document.getElementById('bp-label');
  if (!container || !label) return;
  container.innerHTML = '';
  if (isFallback) {
    label.title = 'No breakpoints detected — showing defaults';
    label.classList.add('bp-label-fallback');
  } else {
    label.title = '';
    label.classList.remove('bp-label-fallback');
  }
  for (const pos of widths) {
    const btn = document.createElement('button');
    btn.className = 'btn-bp';
    btn.textContent = String(pos);
    btn.dataset['pos'] = String(pos);
    btn.addEventListener('click', () => { addGuideAt('v', pos); });
    container.appendChild(btn);
  }
}

export function scanBreakpoints(): void {
  const scanExpr = '(function(){' +
    'var seen={};var sheets=document.styleSheets;' +
    'for(var i=0;i<sheets.length;i++){' +
      'var rules;try{rules=sheets[i].cssRules||sheets[i].rules;}catch(e){continue;}' +
      'if(!rules)continue;' +
      'for(var j=0;j<rules.length;j++){' +
        'var rule=rules[j];' +
        'var media=rule.conditionText||(rule.media&&rule.media.mediaText)||"";' +
        'if(media.indexOf("width")===-1)continue;' +
        'var ms=media.match(/\\d+(?:\\.\\d+)?px/g);' +
        'if(ms)ms.forEach(function(m){var w=Math.round(parseFloat(m));if(w>=320)seen[w]=true;});' +
      '}' +
    '}' +
    'var sorted=Object.keys(seen).map(Number).sort(function(a,b){return a-b;});' +
    'return JSON.stringify(sorted.length?sorted:null);' +
  '})()';

  chrome.devtools.inspectedWindow.eval(scanExpr, (json) => {
    let widths: number[] | null = null;
    if (typeof json === 'string') {
      try { widths = JSON.parse(json) as number[] | null; } catch { /* ignore */ }
    }
    if (widths && widths.length) {
      if (widths.length > 6) widths = widths.slice(0, 6);
      renderBreakpoints(widths, false);
    } else {
      renderBreakpoints(FALLBACK_BREAKPOINTS, true);
    }
  });
}
