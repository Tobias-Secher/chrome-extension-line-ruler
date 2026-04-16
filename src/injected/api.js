// ─── Public API ───────────────────────────────────────────────────────────

window.__UITools = {
  isDragging: false,
  pendingUpdate: null,

  // ── Guide methods ──

  addGuide: function (id, axis, pos, color) {
    if (guides[id]) return;
    const el = createGuide(id, axis, pos, color);
    guides[id] = el;
    host.appendChild(el);
  },

  removeGuide: function (id) {
    const el = guides[id];
    if (el) {
      el.parentNode && el.parentNode.removeChild(el);
      delete guides[id];
    }
  },

  setColor: function (id, color) {
    const el = guides[id];
    if (el) el.style.background = color;
  },

  // ── Box methods ──

  addBox: function (id, x, y, w, h, color) {
    if (boxes[id]) return;
    // Center in viewport if position not provided
    if (x === null || x === undefined) x = Math.max(0, Math.floor((window.innerWidth - w) / 2));
    if (y === null || y === undefined) y = Math.max(0, Math.floor((window.innerHeight - h) / 2));
    const el = createBox(id, x, y, w, h, color);
    boxes[id] = el;
    host.appendChild(el);
    // Return actual position so panel can sync state
    return { x: x, y: y };
  },

  removeBox: function (id) {
    const el = boxes[id];
    if (el) {
      el.parentNode && el.parentNode.removeChild(el);
      delete boxes[id];
    }
  },

  setBoxColor: function (id, color) {
    const el = boxes[id];
    if (!el) return;
    el.style.outline = '1px solid ' + color;
    const crosshairs = el.querySelectorAll('.__rl-box-crosshair');
    for (let i = 0; i < crosshairs.length; i++) {
      crosshairs[i].style.background = color;
    }
    const handles = el.querySelectorAll('.__rl-box-handle');
    for (let j = 0; j < handles.length; j++) {
      const h = handles[j];
      if (h.dataset.resize && h.dataset.resize.length === 2) {
        h.style.background = color;
      }
    }
  },

  clearBoxes: function () {
    Object.keys(boxes).forEach(function (id) {
      const el = boxes[id];
      el.parentNode && el.parentNode.removeChild(el);
    });
    boxes = {};
  },

  // ── Combined ──

  clearAll: function () {
    Object.keys(guides).forEach(function (id) {
      const el = guides[id];
      el.parentNode && el.parentNode.removeChild(el);
    });
    guides = {};
    Object.keys(boxes).forEach(function (id) {
      const el = boxes[id];
      el.parentNode && el.parentNode.removeChild(el);
    });
    boxes = {};
    setInspectMode(false);
    setFontInspector(false);
  },

  clearPendingUpdate: function () {
    this.pendingUpdate = null;
  },

  setRulers: function (visible) {
    const ids = ['__rl-ruler-top', '__rl-ruler-left', '__rl-ruler-corner'];
    ids.forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.style.display = visible ? '' : 'none';
    });
  },

  // ── Overlays (delegated to named functions) ──

  setBoxModel: setBoxModel,
  clearBoxModel: clearBoxModel,
  nudgeGuide: nudgeGuide,
  setInspectMode: setInspectMode,
  setFontInspector: setFontInspector,
  setGrid: setGrid,
  setCrosshair: setCrosshair,
};
