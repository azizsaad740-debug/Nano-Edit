// src/types/editor/core.ts

import type { Icon as LucideIcon } from "lucide-react";

// --- Core Types ---

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
// Expanded ActiveTool and ShapeType
export type ActiveTool = 'move' | 'crop' | 'brush' | 'eraser' | 'pencil' | 'cloneStamp' | 'patternStamp' | 'historyBrush' | 'artHistoryBrush' | 'selectionBrush' | 'blurBrush' | 'sharpenTool' | 'text' | 'shape' | 'gradient' | 'marqueeRect' | 'marqueeEllipse' | 'lassoFree' | 'lassoPoly' | 'magicWand' | 'objectSelect' | 'eyedropper' | 'hand' | 'zoom' | 'lasso' | 'quickSelect' | 'paintBucket' | 'lassoMagnetic'; // Added lassoMagnetic
export type ShapeType = 'rect' | 'ellipse' | 'triangle' | 'polygon' | 'star' | 'line' | 'circle' | 'arrow' | 'custom';
export type HslColorKey = 'red' | 'yellow' | 'green' | 'cyan' | 'blue' | 'magenta' | 'master'; // Standard HSL keys

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
  strokeDasharray?: string;
  strokeLinecap?: 'butt' | 'round' | 'square';
  strokeLinejoin?: 'miter' | 'round' | 'bevel';
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
  gamma?: number; // Fix 47 dependency
  grain?: number; // Fix 47 dependency
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
  shadowsColor?: string; // Fix 49 dependency
  midtonesColor?: string; // Fix 49 dependency
  highlightsColor?: string; // Fix 49 dependency
  shadowsLuminance?: number; // Fix 49 dependency
  highlightsLuminance?: number; // Fix 49 dependency
}

export interface HslAdjustment {
  hue: number;
  saturation: number;
  lightness: number;
  luminance?: number;
}

export type HslAdjustmentsState = Record<HslColorKey, HslAdjustment>;

export interface CurvesState {
  all: Point[];
  red: Point[];
  green: Point[];
  blue: Point[];
}

export interface FrameState {
  type: 'none' | 'border' | 'vignette' | 'solid';
  color: string;
  size: number;
  opacity: number;
  roundness: number;
  vignetteAmount: number;
  vignetteRoundness: number;
  width?: number;
  options?: any;
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
  autoEnhanceEdges?: boolean; // Fix 52, 54 dependency
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
  transform: { // Fix 15, 33: Renamed from 'transforms'
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
    red: boolean;
    green: boolean;
    blue: boolean;
    alpha: boolean;
    r?: boolean;
    g?: boolean;
    b?: boolean;
  };
  history: HistoryItem[];
  historyBrushSourceIndex: number;
  brushState: BrushState;
  selectiveBlurMask?: string | null;
  selectiveSharpenMask?: string | null;
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
  icon: typeof LucideIcon;
  location: 'right' | 'bottom' | 'hidden';
  visible: boolean;
  order: number;
}