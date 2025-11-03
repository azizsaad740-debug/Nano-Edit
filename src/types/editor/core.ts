// src/types/editor/core.ts

import type { Icon as LucideIcon } from "lucide-react";
import type { AdjustmentState, CurvesState, GradingState, HslAdjustmentsState, FrameState } from "./adjustments"; // <-- Import FrameState here

// --- Core Types ---

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
// Expanded ActiveTool and ShapeType
export type ActiveTool = 'move' | 'crop' | 'brush' | 'eraser' | 'pencil' | 'cloneStamp' | 'patternStamp' | 'historyBrush' | 'artHistoryBrush' | 'selectionBrush' | 'blurBrush' | 'sharpenTool' | 'text' | 'shape' | 'gradient' | 'marqueeRect' | 'marqueeEllipse' | 'lassoFree' | 'lassoPoly' | 'magicWand' | 'objectSelect' | 'eyedropper' | 'hand' | 'zoom' | 'lasso' | 'quickSelect' | 'paintBucket' | 'lassoMagnetic'; // Added lassoMagnetic
export type ShapeType = 'rect' | 'ellipse' | 'triangle' | 'polygon' | 'star' | 'line' | 'circle' | 'arrow' | 'custom';
export type HslColorKey = 'master' | 'red' | 'orange' | 'yellow' | 'green' | 'aqua' | 'blue' | 'purple' | 'magenta'; // Standard HSL keys

export interface Point {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

// --- Adjustment/State Interfaces (Re-exported from adjustments.ts for convenience) ---

export interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: 'px' | '%';
  aspect: number | null;
}

export interface HslAdjustment {
  hue: number;
  saturation: number;
  lightness: number; // Standardized property name
}

// Exporting the imported types to make them available via '@/types/editor'
export type { AdjustmentState, CurvesState, GradingState, HslAdjustmentsState, FrameState }; // <-- ADDED EXPORTS

// --- Layer Data Interfaces ---

export interface BaseLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  isLocked: boolean;
  maskDataUrl: string | null;
  isClippingMask?: boolean;
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
  fontWeight: string | number; // Allow number for font weight
  fontStyle: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  letterSpacing: number;
  lineHeight: number;
  padding: number;
  // Fixed textShadow properties (Fixes 23, 24, 25, 26)
  textShadow?: { color: string; blur: number; offsetX: number; offsetY: number } | null;
  stroke?: { color: string; width: number } | null;
  backgroundColor?: string | null;
}

export interface VectorShapeLayerData extends BaseLayer {
  type: 'vector-shape';
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius: number;
  points?: Point[]; // For polygon/star
  starPoints?: number;
  lineThickness?: number;
  strokeDasharray?: string; // NEW: e.g., "10 5"
  strokeLinecap?: 'butt' | 'round' | 'square'; // NEW
  strokeLinejoin?: 'miter' | 'round' | 'bevel'; // NEW
}

export interface GradientLayerData extends BaseLayer {
  type: 'gradient';
  gradientType: 'linear' | 'radial';
  gradientColors: string[];
  stops: number[];
  gradientAngle: number;
  gradientFeather: number;
  gradientInverted: boolean;
  gradientCenterX: number;
  gradientCenterY: number;
  gradientRadius: number;
  startPoint?: Point; // ADDED
  endPoint?: Point; // ADDED
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
    width?: number;
    height?: number;
  };
}

export interface GroupLayerData extends BaseLayer {
  type: 'group';
  children: Layer[];
  isExpanded: boolean;
}

export type Layer = ImageLayerData | DrawingLayerData | TextLayerData | VectorShapeLayerData | GradientLayerData | AdjustmentLayerData | SmartObjectLayerData | GroupLayerData;

// --- Type Guards (No changes needed here, assuming they were correct) ---

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
  smoothness?: number;
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
  dither?: boolean;
  transparency?: boolean;
}

export interface SelectionSettings {
  selectionMode: 'new' | 'add' | 'subtract' | 'intersect';
  tolerance: number;
  feather: number;
  antiAlias: boolean;
  contiguous: boolean;
  autoSelectLayer?: boolean;
  showTransformControls?: boolean;
  snapToPixels?: boolean;
  fixedRatio?: boolean;
  fixedWidth?: number;
  fixedHeight?: number;
  edgeDetection?: number;
  sampleAllLayers?: boolean;
  refineFeather?: number;
  refineSmooth?: number;
  refineContrast?: number;
  refineShiftEdge?: number;
  decontaminateColors?: boolean;
  autoEnhanceEdges?: boolean;
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
  crop: CropState;
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
  colorMode: 'rgb' | 'cmyk' | 'grayscale' | 'Grayscale' | 'CMYK';
  selectiveBlurAmount: number;
  selectiveSharpenAmount: number;
  customHslColor: string;
  selectionSettings: SelectionSettings;
  channels: {
    r: boolean;
    g: boolean;
    b: boolean;
    alpha: boolean;
  };
  history: HistoryItem[];
  historyBrushSourceIndex: number;
  brushState: BrushState;
  selectiveBlurMask?: string | null;
  selectiveSharpenMask?: string | null;
  isProxyMode: boolean; // <-- ADDED
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
  dpi: number; // Added missing DPI property
}

export interface PanelTab {
  id: string;
  name: string;
  icon: typeof LucideIcon;
  location: 'right' | 'bottom' | 'hidden';
  visible: boolean;
  order: number;
}