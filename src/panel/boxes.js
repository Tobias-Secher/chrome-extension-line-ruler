import { state, COLORS } from './state.js';
import { evalInPage } from './bridge.js';
import { renderBoxList } from './render.js';
import { ensurePolling, stopPolling } from './sync.js';

export function addBox() {
  const id = 'b' + state.nextId++;
  const w = 200, h = 150;
  const color = COLORS[(state.nextId - 2) % COLORS.length];
  // x/y are null — injected runtime will center in viewport and return actual coords
  state.boxes.push({ id, x: null, y: null, w, h, color });
  state.lastAddedId = id;
  evalInPage(
    'JSON.stringify(__UITools.addBox(' +
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

export function removeBox(id) {
  state.boxes = state.boxes.filter(function (b) { return b.id !== id; });
  evalInPage('__UITools.removeBox(' + JSON.stringify(id) + ')');
  renderBoxList();
  if (state.guides.length === 0 && state.boxes.length === 0) stopPolling();
}

export function setBoxColor(id, color) {
  const box = state.boxes.find(function (b) { return b.id === id; });
  if (box) box.color = color;
  evalInPage('__UITools.setBoxColor(' + JSON.stringify(id) + ',' + JSON.stringify(color) + ')');
  // Update the row border color live
  var row = document.querySelector('.guide-row[data-id="' + id + '"]');
  if (row) row.style.borderLeftColor = color;
}
