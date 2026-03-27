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
    document.getElementById('chk-rulers').checked = true;
    document.getElementById('btn-grid').classList.remove('active');
    document.getElementById('grid-settings').classList.add('hidden');
    evalInPage('__RulerLines.clearAll()');
    evalInPage('__RulerLines.setRulers(true)');
    evalInPage('__RulerLines.setGrid(false)');
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

          if (update.type === 'box') {
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

    state.guides.forEach(function (guide) {
      var row = document.createElement('div');
      row.className = 'guide-row';
      row.dataset.id = guide.id;
      row.style.borderLeftColor = guide.color;
      if (guide.id === state.lastAddedId) row.classList.add('row-new');

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

  chrome.devtools.panels.elements.onSelectionChanged.addListener(function () {
    if (state.boxModel) showBoxModel();
  });

  renderGuideList();
  renderBoxList();

  // Inject runtime immediately so rulers appear on panel open
  injectRuntime(function () {
    document.getElementById('chk-rulers').checked = true;
  });
})();
