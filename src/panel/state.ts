import type { Axis, StyleGroup } from '../shared/api';

export interface Guide {
  id: string;
  axis: Axis;
  pos: number;
  color: string;
}

export interface Box {
  id: string;
  x: number | null;
  y: number | null;
  w: number;
  h: number;
  color: string;
}

export interface SelectedElement {
  ident: string;
  groups: StyleGroup[];
}

export interface PanelState {
  guides: Guide[];
  boxes: Box[];
  nextId: number;
  polling: ReturnType<typeof setInterval> | null;
  runtimeReady: boolean;
  boxModel: boolean;
  crosshair: boolean;
  rulers: boolean;
  grid: boolean;
  gridCols: number;
  gridGap: number;
  gridColor: string;
  inspect: boolean;
  fontInspector: boolean;
  selectedId: string | null;
  lastAddedId: string | null;
  selectedElement: SelectedElement | null;
}

export const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'] as readonly string[];

export const state: PanelState = {
  guides: [],
  boxes: [],
  nextId: 1,
  polling: null,
  runtimeReady: false,
  boxModel: false,
  crosshair: false,
  rulers: true,
  grid: false,
  gridCols: 12,
  gridGap: 20,
  gridColor: '#4a9eff',
  inspect: false,
  fontInspector: false,
  selectedId: null,
  lastAddedId: null,
  selectedElement: null,
};

