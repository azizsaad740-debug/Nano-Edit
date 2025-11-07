// src/types/editor/tools.ts

export interface BrushState {
  size: number;
  opacity: number;
  hardness: number;
  smoothness: number;
  shape: 'circle' | 'square';
  flow: number;
  angle: number;
  roundness: number;
  spacing: number;
  blendMode: string;
  // FIX 2: Added missing properties
  jitter: number;
  scatter: number;
  texture: any;
  dualBrush: any;
  smoothing: boolean;
  protectTexture: boolean;
  wetEdges: boolean;
  buildUp: boolean;
  flipX: boolean;
  flipY: boolean;
  colorDynamics: boolean;
  transfer: boolean;
  noise: boolean;
  wetness: number;
  mix: number;
  load: number;
  historySource: string;
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
  dither: boolean; // FIX 5
  transparency: boolean; // FIX 5
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