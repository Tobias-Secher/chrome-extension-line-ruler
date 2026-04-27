import type { Axis, BoxModelDims, BoxPos, UIToolsAPI, UIToolsRuntime } from '../shared/api';
import { host, guides, boxes } from './state';
import { createGuide } from './guides';
import { createBox } from './boxes';
import {
  setBoxModel, clearBoxModel,
  setBoxModelPicker, setFontInspector,
  setGrid, nudgeGuide,
} from './overlays';
import { setInspectMode } from './inspect';
import { setCrosshair } from './crosshair';

declare global {
  interface Window {
    __UITools: UIToolsRuntime;
  }
}

const api: UIToolsRuntime = {
  isDragging: false,
  pendingUpdate: null,

  addGuide(id: string, axis: Axis, pos: number, color: string): void {
    if (guides.has(id)) return;
    const el = createGuide(id, axis, pos, color);
    guides.set(id, el);
    host.appendChild(el);
  },

  removeGuide(id: string): void {
    const el = guides.get(id);
    if (el) {
      el.parentNode?.removeChild(el);
      guides.delete(id);
    }
  },

  setColor(id: string, color: string): void {
    const el = guides.get(id);
    if (el) el.style.background = color;
  },

  addBox(id: string, x: number | null, y: number | null, w: number, h: number, color: string): BoxPos {
    if (boxes.has(id)) {
      const existing = boxes.get(id)!;
      return { x: parseInt(existing.style.left) || 0, y: parseInt(existing.style.top) || 0 };
    }
    const finalX = x ?? Math.max(0, Math.floor((window.innerWidth - w) / 2));
    const finalY = y ?? Math.max(0, Math.floor((window.innerHeight - h) / 2));
    const el = createBox(id, finalX, finalY, w, h, color);
    boxes.set(id, el);
    host.appendChild(el);
    return { x: finalX, y: finalY };
  },

  removeBox(id: string): void {
    const el = boxes.get(id);
    if (el) {
      el.parentNode?.removeChild(el);
      boxes.delete(id);
    }
  },

  setBoxColor(id: string, color: string): void {
    const el = boxes.get(id);
    if (!el) return;
    el.style.outline = '1px solid ' + color;
    const crosshairs = el.querySelectorAll<HTMLElement>('.__rl-box-crosshair');
    crosshairs.forEach((c) => { c.style.background = color; });
    const handles = el.querySelectorAll<HTMLElement>('.__rl-box-handle');
    handles.forEach((handle) => {
      const dir = handle.dataset['resize'];
      if (dir && dir.length === 2) {
        handle.style.background = color;
      }
    });
  },

  clearBoxes(): void {
    boxes.forEach((el) => { el.parentNode?.removeChild(el); });
    boxes.clear();
  },

  clearAll(): void {
    guides.forEach((el) => { el.parentNode?.removeChild(el); });
    guides.clear();
    boxes.forEach((el) => { el.parentNode?.removeChild(el); });
    boxes.clear();
    setInspectMode(false);
    setFontInspector(false);
  },

  clearPendingUpdate(): void {
    this.pendingUpdate = null;
  },

  setRulers(visible: boolean): void {
    const ids = ['__rl-ruler-top', '__rl-ruler-left', '__rl-ruler-corner'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) el.style.display = visible ? '' : 'none';
    }
  },

  setBoxModel(d: BoxModelDims): void { setBoxModel(d); },
  clearBoxModel(): void { clearBoxModel(); },
  nudgeGuide(id: string, delta: number): void { nudgeGuide(id, delta); },
  setInspectMode(enable: boolean): void { setInspectMode(enable); },
  setBoxModelPicker(enable: boolean): void { setBoxModelPicker(enable); },
  setFontInspector(enable: boolean): void { setFontInspector(enable); },
  setGrid(visible: boolean, columns: number, gap: number, color: string): void {
    setGrid(visible, columns, gap, color);
  },
  setCrosshair(enable: boolean): void { setCrosshair(enable); },
};

// Compile-time check that api implements UIToolsAPI
const _apiCheck: UIToolsAPI = api;
void _apiCheck;

window.__UITools = api;
