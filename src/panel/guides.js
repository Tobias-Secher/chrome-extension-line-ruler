import { state, COLORS } from './state.js';
import { evalInPage } from './bridge.js';
import { renderGuideList } from './render.js';
import { ensurePolling, stopPolling } from './sync.js';

export function addGuide(axis) {
  const id = 'g' + state.nextId++;
  const pos = axis === 'h' ? 300 : 400;
  const color = COLORS[(state.nextId - 2) % COLORS.length];
  state.guides.push({ id, axis, pos, color });
  state.lastAddedId = id;
  evalInPage(
    '__UITools.addGuide(' +
      JSON.stringify(id) + ',' +
      JSON.stringify(axis) + ',' +
      pos + ',' +
      JSON.stringify(color) +
    ')'
  );
  renderGuideList();
  ensurePolling();
}

export function addGuideAt(axis, pos) {
  var id = 'g' + state.nextId++;
  var color = COLORS[(state.nextId - 2) % COLORS.length];
  state.guides.push({ id: id, axis: axis, pos: pos, color: color });
  state.lastAddedId = id;
  evalInPage(
    '__UITools.addGuide(' +
      JSON.stringify(id) + ',' +
      JSON.stringify(axis) + ',' +
      pos + ',' +
      JSON.stringify(color) +
    ')'
  );
  renderGuideList();
  ensurePolling();
}

export function removeGuide(id) {
  state.guides = state.guides.filter(function (g) { return g.id !== id; });
  evalInPage('__UITools.removeGuide(' + JSON.stringify(id) + ')');
  renderGuideList();
  if (state.guides.length === 0 && state.boxes.length === 0) stopPolling();
}

export function setGuideColor(id, color) {
  const guide = state.guides.find(function (g) { return g.id === id; });
  if (guide) guide.color = color;
  evalInPage('__UITools.setColor(' + JSON.stringify(id) + ',' + JSON.stringify(color) + ')');
  // Update the row border color live
  var row = document.querySelector('.guide-row[data-id="' + id + '"]');
  if (row) row.style.borderLeftColor = color;
}
