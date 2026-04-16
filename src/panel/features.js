import { state } from './state.js';
import { evalInPage } from './bridge.js';
import { renderGuideList, renderBoxList } from './render.js';
import { stopPolling } from './sync.js';
import { addGuideAt } from './guides.js';

export function applyGrid() {
  evalInPage(
    '__UITools.setGrid(' +
      state.grid + ',' +
      state.gridCols + ',' +
      state.gridGap + ',' +
      JSON.stringify(state.gridColor) +
    ')'
  );
}

export function clearAll() {
  state.guides = [];
  state.boxes = [];
  state.rulers = true;
  state.grid = false;
  state.inspect = false;
  state.fontInspector = false;
  state.selectedId = null;
  document.getElementById('chk-rulers').checked = true;
  document.getElementById('btn-grid').classList.remove('active');
  document.getElementById('btn-inspect').classList.remove('active');
  document.getElementById('btn-font').classList.remove('active');
  document.getElementById('grid-settings').classList.add('hidden');
  evalInPage('__UITools.clearAll()');
  evalInPage('__UITools.setRulers(true)');
  evalInPage('__UITools.setGrid(false)');
  evalInPage('__UITools.setInspectMode(false)');
  evalInPage('__UITools.setFontInspector(false)');
  renderGuideList();
  renderBoxList();
  stopPolling();
}

export function showBoxModel() {
  evalInPage(
    '(function(){if(!$0)return null;var r=$0.getBoundingClientRect();var s=window.getComputedStyle($0);return JSON.stringify({x:r.left,y:r.top,w:r.width,h:r.height,pt:parseFloat(s.paddingTop),pr:parseFloat(s.paddingRight),pb:parseFloat(s.paddingBottom),pl:parseFloat(s.paddingLeft),bt:parseFloat(s.borderTopWidth),br:parseFloat(s.borderRightWidth),bb:parseFloat(s.borderBottomWidth),bl:parseFloat(s.borderLeftWidth),mt:parseFloat(s.marginTop),mr:parseFloat(s.marginRight),mb:parseFloat(s.marginBottom),ml:parseFloat(s.marginLeft)});})();',
    function (json) {
      if (!json || json === 'null') return;
      evalInPage('__UITools.setBoxModel(' + json + ')');
    }
  );
}

export function toggleInspect(enable) {
  state.inspect = enable;
  evalInPage('__UITools.setInspectMode(' + enable + ')');
}

// ─── Breakpoint presets ───────────────────────────────────────────────────

var FALLBACK_BREAKPOINTS = [320, 768, 1024, 1440];

export function renderBreakpoints(widths, isFallback) {
  var container = document.getElementById('bp-buttons');
  var label = document.getElementById('bp-label');
  container.innerHTML = '';
  if (isFallback) {
    label.title = 'No breakpoints detected — showing defaults';
    label.classList.add('bp-label-fallback');
  } else {
    label.title = '';
    label.classList.remove('bp-label-fallback');
  }
  widths.forEach(function (pos) {
    var btn = document.createElement('button');
    btn.className = 'btn-bp';
    btn.textContent = pos;
    btn.dataset.pos = pos;
    btn.addEventListener('click', function () {
      addGuideAt('v', pos);
    });
    container.appendChild(btn);
  });
}

export function scanBreakpoints() {
  var scanExpr = '(function(){' +
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

  evalInPage(scanExpr, function (json) {
    var widths = null;
    try { widths = json ? JSON.parse(json) : null; } catch (e) {}
    if (widths && widths.length) {
      if (widths.length > 6) widths = widths.slice(0, 6);
      renderBreakpoints(widths, false);
    } else {
      renderBreakpoints(FALLBACK_BREAKPOINTS, true);
    }
  });
}
