// src/types/editor/core.ts

import type { Icon as LucideIcon } from "lucide-react";

// --- Core Types ---

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
export type ActiveTool = 'move' | 'crop' | 'brush' | 'eraser' | 'pencil' | 'cloneStamp' | 'patternStamp' | 'historyBrush' | 'artHistoryBrush' | 'selectionBrush' | 'blurBrush' | 'sharpenTool' | 'text' | 'shape' | 'gradient' | 'marqueeRect' | 'marqueeEllipse' | 'lassoFree' | 'lassoPoly' | 'magicWand' | 'objectSelect' | 'eyedropper' | 'hand' | 'zoom';
export type ShapeType = 'rect' | 'ellipse' | 'triangle' | 'polygon' | 'star' | 'line';
export type HslColorKey = 'red' | 'yellow' | 'green' | 'cyan' | 'blue' | 'magenta' | 'master';

export interface Point {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

// --- Layer Data Interfaces ---

export interface BaseLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  isLocked: boolean;
  maskDataUrl: string | null;
  // Transform properties (relative to canvas size 0-100)
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface ImageLayerData extends BaseLayer {
  type: 'image';
  dataUrl: string;
  exifData: any;
}

export interface DrawingLayerData extends BaseLayer {
  type: 'drawing';
  dataUrl: string;
}

export interface TextLayerData extends BaseLayer {
  type: 'text';
  content: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  padding: number;
}

export interface VectorShapeLayerData extends BaseLayer {
  type: 'vector-shape';
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius: number;
  points?: Point[]; // For polygon/star
}

export interface GradientLayerData extends BaseLayer {
  type: 'gradient';
  gradientType: 'linear' | 'radial';
  gradientColors: string[];
  gradientStops: number[];
  gradientAngle: number;
  gradientFeather: number;
  gradientInverted: boolean;
  gradientCenterX: number;
  gradientCenterY: number;
  gradientRadius: number;
}

export interface AdjustmentLayerData extends BaseLayer {
  type: 'adjustment';
  adjustmentData: {
    type: 'brightness' | 'curves' | 'hsl' | 'grading';
    adjustments?: AdjustmentState;
    curves?: CurvesState;
    hslAdjustments?: HslAdjustmentsState;
    grading?: GradingState;
  };
}

export interface SmartObjectLayerData extends BaseLayer {
  type: 'smart-object';
  smartObjectData: {
    sourceLayerId: string;
    layers: Layer[]; // Layers contained within the smart object
  };
}

export interface GroupLayerData extends BaseLayer {
  type: 'group';
  children: Layer[];
  isExpanded: boolean;
}

export type Layer = ImageLayerData | DrawingLayerData | TextLayerData | VectorShapeLayerData | GradientLayerData | AdjustmentLayerData | SmartObjectLayerData | GroupLayerData;

// --- Type Guards ---

export const isImageLayer = (layer: Layer): layer is ImageLayerData => layer.type === 'image';
export const isDrawingLayer = (layer: Layer): layer is DrawingLayerData => layer.type === 'drawing';
export const isImageOrDrawingLayer = (layer: Layer): layer is ImageLayerData | DrawingLayerData => isImageLayer(layer) || isDrawingLayer(layer);
export const isTextLayer = (layer: Layer): layer is TextLayerData => layer.type === 'text';
export const isVectorShapeLayer = (layer: Layer): layer is VectorShapeLayerData => layer.type === 'vector-shape';
export const isGradientLayer = (layer: Layer): layer is GradientLayerData => layer.type === 'gradient';
export const isAdjustmentLayer = (layer: Layer): layer is AdjustmentLayerData => layer.type === 'adjustment';
export const isSmartObjectLayer = (layer: Layer): layer is SmartObjectLayerData => layer.type === 'smart-object';
export const isGroupLayer = (layer: Layer): layer is GroupLayerData => layer.type === 'group';

// --- State Interfaces ---

export interface BrushState {
  size: number;
  hardness: number;
  opacity: number;
  flow: number;
  spacing: number;
  blendMode: BlendMode;
  shape: 'circle' | 'square' | 'custom';
  angle: number;
  roundness: number;
  jitter: number;
  scatter: number;
  texture: string | null;
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
  historySource: 'current' | 'snapshot';
}

export interface GradientToolState {
  type: 'linear' | 'radial';
  colors: string[];
  stops: number[];
  angle: number;
  feather: number;
  inverted: boolean;
  centerX: number;
  centerY: number;
  radius: number;
}

export interface AdjustmentState {
  brightness: number;
  contrast: number;
  exposure: number;
  saturation: number;
  vibrance: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  clarity: number;
  dehaze: number;
}

export interface GradingState {
  shadows: { hue: number; saturation: number; luminosity: number };
  midtones: { hue: number; saturation: number; luminosity: number };
  highlights: { hue: number; saturation: number; luminosity: number };
  blending: number;
  balance: number;
  grayscale: number;
  sepia: number;
  invert: number;
}

export interface HslAdjustment {
  hue: number;
  saturation: number;
  lightness: number;
}

export type HslAdjustmentsState = Record<HslColorKey, HslAdjustment>;

export interface CurvesState {
  all: Point[];
  red: Point[];
  green: Point[];
  blue: Point[];
}

export interface FrameState {
  type: 'none' | 'border' | 'vignette';
  color: string;
  size: number;
  opacity: number;
  roundness: number;
  vignetteAmount: number;
  vignetteRoundness: number;
}

export interface SelectionSettings {
  selectionMode: 'new' | 'add' | 'subtract' | 'intersect';
  tolerance: number;
  feather: number;
  antiAlias: boolean;
  contiguous: boolean;
}

export interface EditState {
  adjustments: AdjustmentState;
  effects: {
    blur: number;
    hueShift: number;
    vignette: number;
    noise: number;
    sharpen: number;
    clarity: number;
  };
  grading: GradingState;
  hslAdjustments: HslAdjustmentsState;
  curves: CurvesState;
  frame: FrameState;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
    unit: 'px' | '%';
    aspect: number | null;
  };
  transform: {
    scaleX: number;
    scaleY: number;
    skewX: number;
    skewY: number;
    perspectiveX: number;
    perspectiveY: number;
  };
  rotation: number;
  aspect: number | null;
  selectedFilter: string;
  colorMode: 'rgb' | 'cmyk' | 'grayscale';
  selectiveBlurAmount: number;
  selectiveSharpenAmount: number;
  customHslColor: string;
  selectionSettings: SelectionSettings;
  channels: {
    red: boolean;
    green: boolean;
    blue: boolean;
    alpha: boolean;
  };
  // History state is managed externally but included here for type consistency
  history: HistoryItem[];
  historyBrushSourceIndex: number;
  brushState: BrushState;
}

export interface HistoryItem {
  name: string;
  state: EditState;
  layers: Layer[];
}

export interface NewProjectSettings {
  width: number;
  height: number;
  backgroundColor: string;
  colorMode: 'rgb' | 'cmyk' | 'grayscale';
}

export interface PanelTab {
  id: string;
  name: string;
  icon: LucideIcon;
  location: 'right' | 'bottom' | 'hidden';
  visible: boolean;
  order: number;
}