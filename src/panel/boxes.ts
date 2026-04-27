import { state, COLORS } from './state';
import { call } from './bridge';
import { renderBoxList } from './render';
import { ensurePolling, stopPolling } from './sync';

function pickColor(): string {
  return COLORS[(state.nextId - 2) % COLORS.length]!;
}

export function addBox(): void {
  const id = 'b' + state.nextId++;
  const w = 200, h = 150;
  const color = pickColor();
  state.boxes.push({ id, x: null, y: null, w, h, color });
  state.lastAddedId = id;

  call('addBox', id, null, null, w, h, color).then((pos) => {
    const box = state.boxes.find((b) => b.id === id);
    if (box && pos) {
      box.x = pos.x;
      box.y = pos.y;
    }
  });

  renderBoxList();
  ensurePolling();
}

export function removeBox(id: string): void {
  state.boxes = state.boxes.filter((b) => b.id !== id);
  void call('removeBox', id);
  renderBoxList();
  if (state.guides.length === 0 && state.boxes.length === 0) stopPolling();
}

export function setBoxColor(id: string, color: string): void {
  const box = state.boxes.find((b) => b.id === id);
  if (box) box.color = color;
  void call('setBoxColor', id, color);
  const row = document.querySelector<HTMLElement>(`.guide-row[data-id="${id}"]`);
  if (row) row.style.borderLeftColor = color;
}
