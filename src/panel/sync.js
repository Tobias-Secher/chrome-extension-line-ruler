import { state, COLORS } from './state.js';
import { evalInPage } from './bridge.js';
import { renderGuideList } from './render.js';

export function ensurePolling() {
  if (state.polling) return;
  state.polling = setInterval(function () {
    chrome.devtools.inspectedWindow.eval(
      'window.__UITools ? JSON.stringify(window.__UITools.pendingUpdate) : null',
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
          evalInPage('__UITools.setColor(' + JSON.stringify(id) + ',' + JSON.stringify(color) + ')');
          renderGuideList();
        } else if (update.type === 'box') {
          var box = state.boxes.find(function (b) { return b.id === update.id; });
          if (box) {
            box.x = update.x; box.y = update.y;
            box.w = update.w; box.h = update.h;
            updateBoxDisplay(update.id, update.w, update.h);
          }
        } else {
          var guide = state.guides.find(function (g) { return g.id === update.id; });
          if (guide) {
            guide.pos = update.pos;
            updateCoordDisplay(update.id, update.pos);
          }
        }

        chrome.devtools.inspectedWindow.eval('__UITools.clearPendingUpdate()');
      }
    );
  }, 16);
}

export function stopPolling() {
  if (state.polling) {
    clearInterval(state.polling);
    state.polling = null;
  }
}

export function updateCoordDisplay(id, pos) {
  var span = document.getElementById('coord-' + id);
  if (span) span.textContent = pos + 'px';
  updateDistanceRows();
}

export function updateDistanceRows() {
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

export function updateBoxDisplay(id, w, h) {
  var span = document.getElementById('box-dim-' + id);
  if (span) span.textContent = w + ' \u00d7 ' + h;
}
