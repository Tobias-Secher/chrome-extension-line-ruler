import { state } from './state.js';
import { setGuideColor, removeGuide } from './guides.js';
import { setBoxColor, removeBox } from './boxes.js';

var COLOR_RE = /#[0-9a-f]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)/i;

function showCopyToast(value) {
  navigator.clipboard.writeText(value);
  var toast = document.getElementById('color-toast');
  while (toast.firstChild) toast.removeChild(toast.firstChild);

  var colorMatch = value.match(COLOR_RE);
  if (colorMatch) {
    var swatch = document.createElement('span');
    swatch.className = 'color-toast-swatch';
    swatch.style.background = colorMatch[0];
    toast.appendChild(swatch);
  }
  var label = document.createElement('span');
  label.className = 'color-toast-hex';
  label.textContent = value;
  var hint = document.createElement('span');
  hint.className = 'color-toast-copy';
  hint.textContent = 'copied';
  toast.appendChild(label);
  toast.appendChild(hint);
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function () { toast.classList.add('hidden'); }, 3000);
}

export function renderSelected() {
  var section = document.getElementById('selected-section');
  var identEl = document.getElementById('selected-ident');
  var body = document.getElementById('selected-body');

  if (!state.selectedElement) {
    section.classList.add('hidden');
    identEl.textContent = '';
    identEl.title = '';
    body.innerHTML = '';
    return;
  }

  section.classList.remove('hidden');
  var sel = state.selectedElement;
  identEl.textContent = sel.ident;
  identEl.title = sel.ident;

  body.innerHTML = '';
  sel.groups.forEach(function (group) {
    var header = document.createElement('div');
    header.className = 'prop-group-header';
    header.textContent = group.name;
    body.appendChild(header);

    group.rows.forEach(function (pair) {
      var key = pair[0];
      var value = pair[1];
      if (value === '' || value == null) return;

      var row = document.createElement('div');
      row.className = 'prop-row';
      row.title = 'Click to copy';
      var decl = key + ': ' + value;
      row.addEventListener('click', function () { showCopyToast(decl); });

      var keyEl = document.createElement('span');
      keyEl.className = 'prop-key';
      keyEl.textContent = key;

      var valWrap = document.createElement('span');
      valWrap.className = 'prop-value';

      var colorMatch = value.match(COLOR_RE);
      if (colorMatch) {
        var swatch = document.createElement('span');
        swatch.className = 'prop-swatch';
        swatch.style.background = colorMatch[0];
        valWrap.appendChild(swatch);
      }
      var valText = document.createElement('span');
      valText.className = 'prop-value-text';
      valText.textContent = value;
      valWrap.appendChild(valText);

      row.appendChild(keyEl);
      row.appendChild(valWrap);
      body.appendChild(row);
    });
  });
}

function updateSectionHeaders() {
  var gc = document.getElementById('guides-count');
  var bc = document.getElementById('boxes-count');
  if (gc) gc.textContent = state.guides.length > 0 ? state.guides.length : '';
  if (bc) bc.textContent = state.boxes.length > 0 ? state.boxes.length : '';
}

export function renderGuideList() {
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

export function renderBoxList() {
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
