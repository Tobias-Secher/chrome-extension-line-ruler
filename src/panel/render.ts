import { state } from './state';
import { setGuideColor, removeGuide } from './guides';
import { setBoxColor, removeBox } from './boxes';

const COLOR_RE = /#[0-9a-f]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)/i;

interface ToastEl extends HTMLElement {
  _timer?: ReturnType<typeof setTimeout>;
}

function showCopyToast(value: string): void {
  void navigator.clipboard.writeText(value);
  const toast = document.getElementById('color-toast') as ToastEl | null;
  if (!toast) return;
  while (toast.firstChild) toast.removeChild(toast.firstChild);

  const colorMatch = value.match(COLOR_RE);
  if (colorMatch) {
    const swatch = document.createElement('span');
    swatch.className = 'color-toast-swatch';
    swatch.style.background = colorMatch[0];
    toast.appendChild(swatch);
  }
  const label = document.createElement('span');
  label.className = 'color-toast-hex';
  label.textContent = value;
  const hint = document.createElement('span');
  hint.className = 'color-toast-copy';
  hint.textContent = 'copied';
  toast.appendChild(label);
  toast.appendChild(hint);
  toast.classList.remove('hidden');
  if (toast._timer) clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}

export function renderSelected(): void {
  const section = document.getElementById('selected-section');
  const identEl = document.getElementById('selected-ident');
  const body = document.getElementById('selected-body');
  if (!section || !identEl || !body) return;

  if (!state.selectedElement) {
    section.classList.add('hidden');
    identEl.textContent = '';
    identEl.title = '';
    body.innerHTML = '';
    return;
  }

  section.classList.remove('hidden');
  const sel = state.selectedElement;
  identEl.textContent = sel.ident;
  identEl.title = sel.ident;

  body.innerHTML = '';
  for (const group of sel.groups) {
    const header = document.createElement('div');
    header.className = 'prop-group-header';
    header.textContent = group.name;
    body.appendChild(header);

    for (const [key, value] of group.rows) {
      if (value === '' || value == null) continue;

      const row = document.createElement('div');
      row.className = 'prop-row';
      row.title = 'Click to copy';
      const decl = key + ': ' + value;
      row.addEventListener('click', () => { showCopyToast(decl); });

      const keyEl = document.createElement('span');
      keyEl.className = 'prop-key';
      keyEl.textContent = key;

      const valWrap = document.createElement('span');
      valWrap.className = 'prop-value';

      const colorMatch = value.match(COLOR_RE);
      if (colorMatch) {
        const swatch = document.createElement('span');
        swatch.className = 'prop-swatch';
        swatch.style.background = colorMatch[0];
        valWrap.appendChild(swatch);
      }
      const valText = document.createElement('span');
      valText.className = 'prop-value-text';
      valText.textContent = value;
      valWrap.appendChild(valText);

      row.appendChild(keyEl);
      row.appendChild(valWrap);
      body.appendChild(row);
    }
  }
}

function updateSectionHeaders(): void {
  const gc = document.getElementById('guides-count');
  const bc = document.getElementById('boxes-count');
  if (gc) gc.textContent = state.guides.length > 0 ? String(state.guides.length) : '';
  if (bc) bc.textContent = state.boxes.length > 0 ? String(state.boxes.length) : '';
}

export function renderGuideList(): void {
  const list = document.getElementById('guide-list');
  if (!list) return;
  list.innerHTML = '';

  if (state.guides.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No guides yet';
    list.appendChild(empty);
    updateSectionHeaders();
    return;
  }

  const hGuides = state.guides.filter((g) => g.axis === 'h').slice().sort((a, b) => a.pos - b.pos);
  const vGuides = state.guides.filter((g) => g.axis === 'v').slice().sort((a, b) => a.pos - b.pos);
  const ordered = hGuides.concat(vGuides);

  ordered.forEach((guide, i) => {
    const prev = ordered[i - 1];
    if (i > 0 && prev && prev.axis === guide.axis) {
      const dist = guide.pos - prev.pos;
      const distRow = document.createElement('div');
      distRow.className = 'distance-row';
      distRow.dataset['axis'] = guide.axis;
      distRow.dataset['from'] = prev.id;
      distRow.dataset['to'] = guide.id;
      distRow.textContent = (guide.axis === 'h' ? '↕' : '↔') + ' ' + dist + 'px';
      list.appendChild(distRow);
    }

    const row = document.createElement('div');
    row.className = 'guide-row';
    row.dataset['id'] = guide.id;
    row.style.borderLeftColor = guide.color;
    if (guide.id === state.lastAddedId) row.classList.add('row-new');
    if (guide.id === state.selectedId) row.classList.add('row-selected');

    row.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'BUTTON') return;
      const clickedId = row.dataset['id'] ?? null;
      state.selectedId = state.selectedId === clickedId ? null : clickedId;
      document.querySelectorAll<HTMLElement>('.guide-row').forEach((r) => {
        r.classList.toggle('row-selected', r.dataset['id'] === state.selectedId);
      });
    });

    const axisLabel = document.createElement('span');
    axisLabel.className = 'axis-label';
    axisLabel.textContent = guide.axis.toUpperCase();

    const coord = document.createElement('span');
    coord.className = 'coord-display';
    coord.id = 'coord-' + guide.id;
    coord.textContent = guide.pos + 'px';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'color-picker';
    colorInput.value = guide.color;
    colorInput.dataset['id'] = guide.id;
    colorInput.addEventListener('input', (e) => {
      const t = e.target as HTMLInputElement;
      const id = t.dataset['id'];
      if (id) setGuideColor(id, t.value);
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.textContent = '✕';
    removeBtn.dataset['id'] = guide.id;
    removeBtn.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const id = t.dataset['id'];
      if (id) removeGuide(id);
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

export function renderBoxList(): void {
  const list = document.getElementById('box-list');
  if (!list) return;
  list.innerHTML = '';

  if (state.boxes.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No boxes yet';
    list.appendChild(empty);
    updateSectionHeaders();
    return;
  }

  for (const box of state.boxes) {
    const row = document.createElement('div');
    row.className = 'guide-row box-row';
    row.dataset['id'] = box.id;
    row.style.borderLeftColor = box.color;
    if (box.id === state.lastAddedId) row.classList.add('row-new');

    const typeLabel = document.createElement('span');
    typeLabel.className = 'axis-label box-type-label';
    typeLabel.textContent = 'BOX';

    const dim = document.createElement('span');
    dim.className = 'coord-display box-dim';
    dim.id = 'box-dim-' + box.id;
    dim.textContent = box.w + ' × ' + box.h;

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'color-picker';
    colorInput.value = box.color;
    colorInput.dataset['id'] = box.id;
    colorInput.addEventListener('input', (e) => {
      const t = e.target as HTMLInputElement;
      const id = t.dataset['id'];
      if (id) setBoxColor(id, t.value);
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.textContent = '✕';
    removeBtn.dataset['id'] = box.id;
    removeBtn.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const id = t.dataset['id'];
      if (id) removeBox(id);
    });

    row.appendChild(typeLabel);
    row.appendChild(dim);
    row.appendChild(colorInput);
    row.appendChild(removeBtn);
    list.appendChild(row);
  }

  state.lastAddedId = null;
  updateSectionHeaders();
}
