// src/types/editor/tools.ts

export interface BrushState {
  size: number;
  opacity: number;
  hardness: number;
  smoothness: number;
  shape: 'circle' | 'square';
  color: string;
  flow: number;
  angle: number;
  roundness: number;
  spacing: number;
  blendMode: string;
}

export interface GradientToolState {
  type: 'linear' | 'radial' | 'angle' | 'reflected' | 'diamond';
  colors: string[];
  stops: number[];
  angle: number;
  centerX: number;
  centerY: number;
  radius: number;
  feather: number;
  inverted: boolean;
  dither: boolean;
  transparency: boolean;
}

export interface SelectionSettings {
  feather: number;
  antiAlias: boolean;
  fixedRatio: boolean;
  fixedWidth: number;
  fixedHeight: number;
  tolerance: number;
  contiguous: boolean;
  sampleAllLayers: boolean;
  autoEnhanceEdges: boolean;
  showTransformControls: boolean;
  autoSelectLayer: boolean;
  snapToPixels: boolean;
  selectionMode: 'new' | 'add' | 'subtract' | 'intersect';
  refineFeather: number;
  refineSmooth: number;
  refineContrast: number;
  refineShiftEdge: number;
  decontaminateColors: boolean;
  edgeDetection: number;
}