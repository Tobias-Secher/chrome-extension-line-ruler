(function () {
  'use strict';

  const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

  const state = {
    guides: [],
    nextId: 1,
    polling: null,
    runtimeReady: false,
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
        // Runtime not present — inject then retry once
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
    if (state.guides.length === 0) stopPolling();
  }

  function clearAll() {
    state.guides = [];
    evalInPage('__RulerLines.clearAll()');
    renderGuideList();
    stopPolling();
  }

  function setGuideColor(id, color) {
    const guide = state.guides.find(function (g) { return g.id === id; });
    if (guide) guide.color = color;
    evalInPage('__RulerLines.setColor(' + JSON.stringify(id) + ',' + JSON.stringify(color) + ')');
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
          var guide = state.guides.find(function (g) { return g.id === update.id; });
          if (guide) {
            guide.pos = update.pos;
            updateCoordDisplay(update.id, update.pos);
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

  // ─── Render ───────────────────────────────────────────────────────────────

  function renderGuideList() {
    var list = document.getElementById('guide-list');
    list.innerHTML = '';

    if (state.guides.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No guides yet.\nAdd a horizontal or vertical line above.';
      list.appendChild(empty);
      return;
    }

    state.guides.forEach(function (guide) {
      var row = document.createElement('div');
      row.className = 'guide-row';
      row.dataset.id = guide.id;

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
      removeBtn.textContent = '✕';
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
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  document.getElementById('btn-add-h').addEventListener('click', function () { addGuide('h'); });
  document.getElementById('btn-add-v').addEventListener('click', function () { addGuide('v'); });
  document.getElementById('btn-clear-all').addEventListener('click', clearAll);

  renderGuideList();
})();
