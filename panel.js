(function () {
  'use strict';

  const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

  const state = {
    guides: [],
    boxes: [],
    nextId: 1,
    polling: null,
    runtimeReady: false,
    boxModel: false,
    crosshair: false,
    rulers: true,
    grid: false,
    gridCols: 12,
    gridGap: 20,
    gridColor: '#4a9eff',
    spacing: false,
    fontInspector: false,
    selectedId: null,
    lastAddedId: null,
  };

  // ─── Eval helpers ─────────────────────────────────────────────────────────

  function injectRuntime(callback) {
    fetch(chrome.runtime.getURL('injected.js'))
      .then(function (r) { return r.text(); })
      .then(function (source) {
        chrome.devtools.inspectedWindow.eval(source, function (result, err) {
          if (err) {
            console.error('Ruler Lines: runtime injection failed', err);
            return;
          }
          state.runtimeReady = true;
          if (callback) callback();
        });
      });
  }

  function evalInPage(expression, callback) {
    chrome.devtools.inspectedWindow.eval(expression, function (result, exceptionInfo) {
      if (exceptionInfo) {
        state.runtimeReady = false;
        injectRuntime(function () {
          chrome.devtools.inspectedWindow.eval(expression, function (result2, err2) {
            if (!err2 && callback) callback(result2);
          });
        });
        return;
      }
      if (callback) callback(result);
    });
  }

  // ─── Guide operations ─────────────────────────────────────────────────────

  function addGuide(axis) {
    const id = 'g' + state.nextId++;
    const pos = axis === 'h' ? 300 : 400;
    const color = COLORS[(state.nextId - 2) % COLORS.length];
    state.guides.push({ id, axis, pos, color });
    state.lastAddedId = id;
    evalInPage(
      '__RulerLines.addGuide(' +
        JSON.stringify(id) + ',' +
        JSON.stringify(axis) + ',' +
        pos + ',' +
        JSON.stringify(color) +
      ')'
    );
    renderGuideList();
    ensurePolling();
  }

  function removeGuide(id) {
    state.guides = state.guides.filter(function (g) { return g.id !== id; });
    evalInPage('__RulerLines.removeGuide(' + JSON.stringify(id) + ')');
    renderGuideList();
    if (state.guides.length === 0 && state.boxes.length === 0) stopPolling();
  }

  function setGuideColor(id, color) {
    const guide = state.guides.find(function (g) { return g.id === id; });
    if (guide) guide.color = color;
    evalInPage('__RulerLines.setColor(' + JSON.stringify(id) + ',' + JSON.stringify(color) + ')');
    // Update the row border color live
    var row = document.querySelector('.guide-row[data-id="' + id + '"]');
    if (row) row.style.borderLeftColor = color;
  }

  // ─── Box operations ───────────────────────────────────────────────────────

  function addBox() {
    const id = 'b' + state.nextId++;
    const w = 200, h = 150;
    const color = COLORS[(state.nextId - 2) % COLORS.length];
    // x/y are null — injected.js will center in viewport and return actual coords
    state.boxes.push({ id, x: null, y: null, w, h, color });
    state.lastAddedId = id;
    evalInPage(
      'JSON.stringify(__RulerLines.addBox(' +
        JSON.stringify(id) + ', null, null,' +
        w + ',' + h + ',' +
        JSON.stringify(color) +
      '))',
      function (json) {
        // Sync actual centered position back to panel state
        if (json) {
          try {
            var pos = JSON.parse(json);
            var box = state.boxes.find(function (b) { return b.id === id; });
            if (box && pos) { box.x = pos.x; box.y = pos.y; }
          } catch (e) {}
        }
      }
    );
    renderBoxList();
    ensurePolling();
  }

  function removeBox(id) {
    state.boxes = state.boxes.filter(function (b) { return b.id !== id; });
    evalInPage('__RulerLines.removeBox(' + JSON.stringify(id) + ')');
    renderBoxList();
    if (state.guides.length === 0 && state.boxes.length === 0) stopPolling();
  }

  function setBoxColor(id, color) {
    const box = state.boxes.find(function (b) { return b.id === id; });
    if (box) box.color = color;
    evalInPage('__RulerLines.setBoxColor(' + JSON.stringify(id) + ',' + JSON.stringify(color) + ')');
    // Update the row border color live
    var row = document.querySelector('.guide-row[data-id="' + id + '"]');
    if (row) row.style.borderLeftColor = color;
  }

  // ─── Clear all ────────────────────────────────────────────────────────────

  function applyGrid() {
    evalInPage(
      '__RulerLines.setGrid(' +
        state.grid + ',' +
        state.gridCols + ',' +
        state.gridGap + ',' +
        JSON.stringify(state.gridColor) +
      ')'
    );
  }

  function clearAll() {
    state.guides = [];
    state.boxes = [];
    state.rulers = true;
    state.grid = false;
    state.spacing = false;
    state.fontInspector = false;
    state.selectedId = null;
    document.getElementById('chk-rulers').checked = true;
    document.getElementById('btn-grid').classList.remove('active');
    document.getElementById('btn-spacing').classList.remove('active');
    document.getElementById('btn-font').classList.remove('active');
    document.getElementById('grid-settings').classList.add('hidden');
    evalInPage('__RulerLines.clearAll()');
    evalInPage('__RulerLines.setRulers(true)');
    evalInPage('__RulerLines.setGrid(false)');
    evalInPage('__RulerLines.clearSpacing()');
    evalInPage('__RulerLines.setFontInspector(false)');
    renderGuideList();
    renderBoxList();
    stopPolling();
  }

  // ─── Drag polling ─────────────────────────────────────────────────────────

  function ensurePolling() {
    if (state.polling) return;
    state.polling = setInterval(function () {
      chrome.devtools.inspectedWindow.eval(
        'window.__RulerLines ? JSON.stringify(window.__RulerLines.pendingUpdate) : null',
        function (json) {
          if (!json || json === 'null') return;
          var update;
          try { update = JSON.parse(json); } catch (e) { return; }
          if (!update) return;

          if (update.type === 'newGuide') {
            const color = COLORS[(state.nextId - 1) % COLORS.length];
            state.nextId++;
            const id = update.id;
            state.guides.push({ id, axis: update.axis, pos: update.pos, color });
            state.lastAddedId = id;
            evalInPage('__RulerLines.setColor(' + JSON.stringify(id) + ',' + JSON.stringify(color) + ')');
            renderGuideList();
          } else if (update.type === 'box') {
            var box = state.boxes.find(function (b) { return b.id === update.id; });
            if (box) {
              box.x = update.x; box.y = update.y;
              box.w = update.w; box.h = update.h;
              updateBoxDisplay(update.id, update.w, update.h);
            }
          } else {
            // Guide update (type === 'guide' or absent for safety)
            var guide = state.guides.find(function (g) { return g.id === update.id; });
            if (guide) {
              guide.pos = update.pos;
              updateCoordDisplay(update.id, update.pos);
            }
          }

          chrome.devtools.inspectedWindow.eval('__RulerLines.clearPendingUpdate()');
        }
      );
    }, 16);
  }

  function stopPolling() {
    if (state.polling) {
      clearInterval(state.polling);
      state.polling = null;
    }
  }

  function updateCoordDisplay(id, pos) {
    var span = document.getElementById('coord-' + id);
    if (span) span.textContent = pos + 'px';
    updateDistanceRows();
  }

  function updateDistanceRows() {
    var hGuides = state.guides.filter(function (g) { return g.axis === 'h'; }).slice().sort(function (a, b) { return a.pos - b.pos; });
    var vGuides = state.guides.filter(function (g) { return g.axis === 'v'; }).slice().sort(function (a, b) { return a.pos - b.pos; });
    var ordered = hGuides.concat(vGuides);
    for (var i = 1; i < ordered.length; i++) {
      if (ordered[i].axis !== ordered[i - 1].axis) continue;
      var row = document.querySelector('.distance-row[data-from="' + ordered[i - 1].id + '"][data-to="' + ordered[i].id + '"]');
      if (row) {
        var dist = ordered[i].pos - ordered[i - 1].pos;
        row.textContent = (ordered[i].axis === 'h' ? '\u2195' : '\u2194') + ' ' + dist + 'px';
      }
    }
  }

  function addGuideAt(axis, pos) {
    var id = 'g' + state.nextId++;
    var color = COLORS[(state.nextId - 2) % COLORS.length];
    state.guides.push({ id: id, axis: axis, pos: pos, color: color });
    state.lastAddedId = id;
    evalInPage(
      '__RulerLines.addGuide(' +
        JSON.stringify(id) + ',' +
        JSON.stringify(axis) + ',' +
        pos + ',' +
        JSON.stringify(color) +
      ')'
    );
    renderGuideList();
    ensurePolling();
  }

  function updateBoxDisplay(id, w, h) {
    var span = document.getElementById('box-dim-' + id);
    if (span) span.textContent = w + ' \u00d7 ' + h;
  }

  // ─── Section headers ──────────────────────────────────────────────────────

  function updateSectionHeaders() {
    var gc = document.getElementById('guides-count');
    var bc = document.getElementById('boxes-count');
    if (gc) gc.textContent = state.guides.length > 0 ? state.guides.length : '';
    if (bc) bc.textContent = state.boxes.length > 0 ? state.boxes.length : '';
  }

  // ─── Render: guides ───────────────────────────────────────────────────────

  function renderGuideList() {
    var list = document.getElementById('guide-list');
    list.innerHTML = '';

    if (state.guides.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No guides yet';
      list.appendChild(empty);
      updateSectionHeaders();
      return;
    }

    // Group by axis, sort by pos within each group for distance rows
    var hGuides = state.guides.filter(function (g) { return g.axis === 'h'; }).slice().sort(function (a, b) { return a.pos - b.pos; });
    var vGuides = state.guides.filter(function (g) { return g.axis === 'v'; }).slice().sort(function (a, b) { return a.pos - b.pos; });
    var ordered = hGuides.concat(vGuides);

    ordered.forEach(function (guide, i) {
      // Distance row between same-axis adjacent guides
      if (i > 0 && ordered[i - 1].axis === guide.axis) {
        var dist = guide.pos - ordered[i - 1].pos;
        var distRow = document.createElement('div');
        distRow.className = 'distance-row';
        distRow.dataset.axis = guide.axis;
        distRow.dataset.from = ordered[i - 1].id;
        distRow.dataset.to = guide.id;
        distRow.textContent = (guide.axis === 'h' ? '\u2195' : '\u2194') + ' ' + dist + 'px';
        list.appendChild(distRow);
      }

      var row = document.createElement('div');
      row.className = 'guide-row';
      row.dataset.id = guide.id;
      row.style.borderLeftColor = guide.color;
      if (guide.id === state.lastAddedId) row.classList.add('row-new');
      if (guide.id === state.selectedId) row.classList.add('row-selected');

      row.addEventListener('click', function (e) {
        // Don't trigger selection when clicking color or remove
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        var clickedId = row.dataset.id;
        state.selectedId = state.selectedId === clickedId ? null : clickedId;
        document.querySelectorAll('.guide-row').forEach(function (r) {
          r.classList.toggle('row-selected', r.dataset.id === state.selectedId);
        });
      });

      var axisLabel = document.createElement('span');
      axisLabel.className = 'axis-label';
      axisLabel.textContent = guide.axis.toUpperCase();

      var coord = document.createElement('span');
      coord.className = 'coord-display';
      coord.id = 'coord-' + guide.id;
      coord.textContent = guide.pos + 'px';

      var colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.className = 'color-picker';
      colorInput.value = guide.color;
      colorInput.dataset.id = guide.id;
      colorInput.addEventListener('input', function (e) {
        setGuideColor(e.target.dataset.id, e.target.value);
      });

      var removeBtn = document.createElement('button');
      removeBtn.className = 'btn-remove';
      removeBtn.textContent = '\u2715';
      removeBtn.dataset.id = guide.id;
      removeBtn.addEventListener('click', function (e) {
        removeGuide(e.target.dataset.id);
      });

      row.appendChild(axisLabel);
      row.appendChild(coord);
      row.appendChild(colorInput);
      row.appendChild(removeBtn);
      list.appendChild(row);
    });

    state.lastAddedId = null;
    updateSectionHeaders();
  }

  // ─── Render: boxes ────────────────────────────────────────────────────────

  function renderBoxList() {
    var list = document.getElementById('box-list');
    list.innerHTML = '';

    if (state.boxes.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No boxes yet';
      list.appendChild(empty);
      updateSectionHeaders();
      return;
    }

    state.boxes.forEach(function (box) {
      var row = document.createElement('div');
      row.className = 'guide-row box-row';
      row.dataset.id = box.id;
      row.style.borderLeftColor = box.color;
      if (box.id === state.lastAddedId) row.classList.add('row-new');

      var typeLabel = document.createElement('span');
      typeLabel.className = 'axis-label box-type-label';
      typeLabel.textContent = 'BOX';

      var dim = document.createElement('span');
      dim.className = 'coord-display box-dim';
      dim.id = 'box-dim-' + box.id;
      dim.textContent = box.w + ' \u00d7 ' + box.h;

      var colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.className = 'color-picker';
      colorInput.value = box.color;
      colorInput.dataset.id = box.id;
      colorInput.addEventListener('input', function (e) {
        setBoxColor(e.target.dataset.id, e.target.value);
      });

      var removeBtn = document.createElement('button');
      removeBtn.className = 'btn-remove';
      removeBtn.textContent = '\u2715';
      removeBtn.dataset.id = box.id;
      removeBtn.addEventListener('click', function (e) {
        removeBox(e.target.dataset.id);
      });

      row.appendChild(typeLabel);
      row.appendChild(dim);
      row.appendChild(colorInput);
      row.appendChild(removeBtn);
      list.appendChild(row);
    });

    state.lastAddedId = null;
    updateSectionHeaders();
  }

  // ─── Box model overlay ────────────────────────────────────────────────────

  function showSpacing() {
    evalInPage(
      '(function(){' +
        'if(!$0||!$1)return null;' +
        'var r0=$0.getBoundingClientRect(),r1=$1.getBoundingClientRect();' +
        'return JSON.stringify({' +
          'r0:{x:r0.left,y:r0.top,w:r0.width,h:r0.height},' +
          'r1:{x:r1.left,y:r1.top,w:r1.width,h:r1.height}' +
        '});' +
      '})()',
      function (json) {
        if (!json || json === 'null') return;
        evalInPage('__RulerLines.setSpacing(' + json + ')');
      }
    );
  }

  function showBoxModel() {
    evalInPage(
      '(function(){if(!$0)return null;var r=$0.getBoundingClientRect();var s=window.getComputedStyle($0);return JSON.stringify({x:r.left,y:r.top,w:r.width,h:r.height,pt:parseFloat(s.paddingTop),pr:parseFloat(s.paddingRight),pb:parseFloat(s.paddingBottom),pl:parseFloat(s.paddingLeft),bt:parseFloat(s.borderTopWidth),br:parseFloat(s.borderRightWidth),bb:parseFloat(s.borderBottomWidth),bl:parseFloat(s.borderLeftWidth),mt:parseFloat(s.marginTop),mr:parseFloat(s.marginRight),mb:parseFloat(s.marginBottom),ml:parseFloat(s.marginLeft)});})();',
      function (json) {
        if (!json || json === 'null') return;
        evalInPage('__RulerLines.setBoxModel(' + json + ')');
      }
    );
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

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
      evalInPage('__RulerLines.clearBoxModel()');
    }
  });

  document.getElementById('chk-rulers').addEventListener('change', function () {
    state.rulers = this.checked;
    evalInPage('__RulerLines.setRulers(' + state.rulers + ')');
  });

  document.getElementById('btn-crosshair').addEventListener('click', function () {
    state.crosshair = !state.crosshair;
    this.classList.toggle('active', state.crosshair);
    evalInPage('__RulerLines.setCrosshair(' + state.crosshair + ')');
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

  // ─── Breakpoint presets ────────────────────────────────────────────────────

  var FALLBACK_BREAKPOINTS = [320, 768, 1024, 1440];

  function renderBreakpoints(widths, isFallback) {
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

  function scanBreakpoints() {
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
    evalInPage('__RulerLines.nudgeGuide(' + JSON.stringify(state.selectedId) + ',' + delta + ')');
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

  // ─── Spacing inspector ────────────────────────────────────────────────────

  document.getElementById('btn-spacing').addEventListener('click', function () {
    state.spacing = !state.spacing;
    this.classList.toggle('active', state.spacing);
    if (state.spacing) {
      showSpacing();
    } else {
      evalInPage('__RulerLines.clearSpacing()');
    }
  });

  // ─── Font inspector ───────────────────────────────────────────────────────

  document.getElementById('btn-font').addEventListener('click', function () {
    state.fontInspector = !state.fontInspector;
    this.classList.toggle('active', state.fontInspector);
    evalInPage('__RulerLines.setFontInspector(' + state.fontInspector + ')');
  });

  chrome.devtools.panels.elements.onSelectionChanged.addListener(function () {
    if (state.boxModel) showBoxModel();
    if (state.spacing) showSpacing();
  });

  renderGuideList();
  renderBoxList();

  // Inject runtime immediately so rulers appear on panel open
  injectRuntime(function () {
    document.getElementById('chk-rulers').checked = true;
    scanBreakpoints();
  });
})();
