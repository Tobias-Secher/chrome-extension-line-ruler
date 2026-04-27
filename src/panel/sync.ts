import type { PendingUpdate } from '../shared/api';
import { state, COLORS } from './state';
import { call } from './bridge';
import { renderGuideList, renderSelected } from './render';

export function ensurePolling(): void {
  if (state.polling) return;
  state.polling = setInterval(() => {
    chrome.devtools.inspectedWindow.eval(
      'window.__UITools ? JSON.stringify(window.__UITools.pendingUpdate) : null',
      (json) => {
        if (json === null || json === undefined || json === 'null') return;
        if (typeof json !== 'string') return;
        let update: PendingUpdate | null;
        try { update = JSON.parse(json) as PendingUpdate; } catch { return; }
        if (!update) return;

        handleUpdate(update);
        void call('clearPendingUpdate');
      },
    );
  }, 16);
}

function handleUpdate(update: PendingUpdate): void {
  switch (update.type) {
    case 'newGuide': {
      const color = COLORS[(state.nextId - 1) % COLORS.length]!;
      state.nextId++;
      const id = update.id;
      state.guides.push({ id, axis: update.axis, pos: update.pos, color });
      state.lastAddedId = id;
      void call('setColor', id, color);
      renderGuideList();
      return;
    }
    case 'box': {
      const box = state.boxes.find((b) => b.id === update.id);
      if (box) {
        box.x = update.x;
        box.y = update.y;
        box.w = update.w;
        box.h = update.h;
        updateBoxDisplay(update.id, update.w, update.h);
      }
      return;
    }
    case 'inspectExit': {
      state.inspect = false;
      document.getElementById('btn-inspect')?.classList.remove('active');
      return;
    }
    case 'boxModelPickerExit': {
      state.boxModel = false;
      document.getElementById('btn-box-model')?.classList.remove('active');
      void call('clearBoxModel');
      return;
    }
    case 'elementPicked': {
      state.selectedElement = { ident: update.ident, groups: update.groups };
      renderSelected();
      return;
    }
    case 'guide': {
      const guide = state.guides.find((g) => g.id === update.id);
      if (guide) {
        guide.pos = update.pos;
        updateCoordDisplay(update.id, update.pos);
      }
      return;
    }
  }
}

export function stopPolling(): void {
  if (state.polling) {
    clearInterval(state.polling);
    state.polling = null;
  }
}

export function updateCoordDisplay(id: string, pos: number): void {
  const span = document.getElementById('coord-' + id);
  if (span) span.textContent = pos + 'px';
  updateDistanceRows();
}

export function updateDistanceRows(): void {
  const hGuides = state.guides.filter((g) => g.axis === 'h').slice().sort((a, b) => a.pos - b.pos);
  const vGuides = state.guides.filter((g) => g.axis === 'v').slice().sort((a, b) => a.pos - b.pos);
  const ordered = hGuides.concat(vGuides);
  for (let i = 1; i < ordered.length; i++) {
    const cur = ordered[i];
    const prev = ordered[i - 1];
    if (!cur || !prev) continue;
    if (cur.axis !== prev.axis) continue;
    const row = document.querySelector<HTMLElement>(`.distance-row[data-from="${prev.id}"][data-to="${cur.id}"]`);
    if (row) {
      const dist = cur.pos - prev.pos;
      row.textContent = (cur.axis === 'h' ? '↕' : '↔') + ' ' + dist + 'px';
    }
  }
}

export function updateBoxDisplay(id: string, w: number, h: number): void {
  const span = document.getElementById('box-dim-' + id);
  if (span) span.textContent = w + ' × ' + h;
}
