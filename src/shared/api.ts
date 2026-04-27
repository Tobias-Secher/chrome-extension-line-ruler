export type Axis = 'h' | 'v';

export interface BoxPos {
  x: number;
  y: number;
}

export interface BoxModelDims {
  x: number; y: number; w: number; h: number;
  pt: number; pr: number; pb: number; pl: number;
  bt: number; br: number; bb: number; bl: number;
  mt: number; mr: number; mb: number; ml: number;
}

export interface StyleGroup {
  name: string;
  rows: [string, string][];
}

export type PendingUpdate =
  | { type: 'guide'; id: string; pos: number }
  | { type: 'newGuide'; id: string; axis: Axis; pos: number }
  | { type: 'box'; id: string; x: number; y: number; w: number; h: number }
  | { type: 'inspectExit' }
  | { type: 'boxModelPickerExit' }
  | { type: 'elementPicked'; ident: string; groups: StyleGroup[] };

export interface UIToolsAPI {
  addGuide(id: string, axis: Axis, pos: number, color: string): void;
  removeGuide(id: string): void;
  setColor(id: string, color: string): void;

  addBox(id: string, x: number | null, y: number | null, w: number, h: number, color: string): BoxPos;
  removeBox(id: string): void;
  setBoxColor(id: string, color: string): void;
  clearBoxes(): void;

  clearAll(): void;
  clearPendingUpdate(): void;

  setRulers(visible: boolean): void;
  setBoxModel(d: BoxModelDims): void;
  clearBoxModel(): void;
  nudgeGuide(id: string, delta: number): void;
  setInspectMode(enable: boolean): void;
  setBoxModelPicker(enable: boolean): void;
  setFontInspector(enable: boolean): void;
  setGrid(visible: boolean, columns: number, gap: number, color: string): void;
  setCrosshair(enable: boolean): void;
}

export interface UIToolsRuntime extends UIToolsAPI {
  isDragging: boolean;
  pendingUpdate: PendingUpdate | null;
}
