import type { Axis } from '../shared/api';
import { state, COLORS } from './state';
import { call } from './bridge';
import { renderGuideList } from './render';
import { ensurePolling, stopPolling } from './sync';

function pickColor(): string {
  return COLORS[(state.nextId - 2) % COLORS.length]!;
}

export function addGuide(axis: Axis): void {
  const id = 'g' + state.nextId++;
  const pos = axis === 'h' ? 300 : 400;
  const color = pickColor();
  state.guides.push({ id, axis, pos, color });
  state.lastAddedId = id;
  void call('addGuide', id, axis, pos, color);
  renderGuideList();
  ensurePolling();
}

export function addGuideAt(axis: Axis, pos: number): void {
  const id = 'g' + state.nextId++;
  const color = pickColor();
  state.guides.push({ id, axis, pos, color });
  state.lastAddedId = id;
  void call('addGuide', id, axis, pos, color);
  renderGuideList();
  ensurePolling();
}

export function removeGuide(id: string): void {
  state.guides = state.guides.filter((g) => g.id !== id);
  void call('removeGuide', id);
  renderGuideList();
  if (state.guides.length === 0 && state.boxes.length === 0) stopPolling();
}

export function setGuideColor(id: string, color: string): void {
  const guide = state.guides.find((g) => g.id === id);
  if (guide) guide.color = color;
  void call('setColor', id, color);
  const row = document.querySelector<HTMLElement>(`.guide-row[data-id="${id}"]`);
  if (row) row.style.borderLeftColor = color;
}
