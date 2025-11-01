// src/types/editor/core.ts

export type ActiveTool =
  | "move"
  | "lasso"
  | "brush"
  | "eraser"
  | "selectionBrush"
  | "blurBrush"
  | "text"
  | "shape"
  | "gradient"
  | "crop"
  | "eyedropper"
  | "marqueeRect"
  | "marqueeEllipse"
  | "lassoPoly"
  | "lassoMagnetic"
  | "quickSelect"
  | "magicWand"
  | "objectSelect"
  | "pencil"
  | "paintBucket"
  | "patternStamp"
  | "cloneStamp"
  | "historyBrush"
  | "artHistoryBrush"
  | "sharpenTool";

export interface Dimensions {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export type ShapeType = 'rect' | 'circle' | 'triangle' | 'polygon' | 'star' | 'line' | 'arrow' | 'custom';

export interface NewProjectSettings {
  width: number;
  height: number;
  dpi: number;
  backgroundColor: string;
}