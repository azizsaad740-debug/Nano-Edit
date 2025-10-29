import type { Dispatch, SetStateAction } from "react";

// --- Core Types ---

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
  | "quickSelect"
  | "magicWand"
  | "objectSelect"
  | "pencil"
  | "paintBucket"
  | "patternStamp"
  | "cloneStamp"
  | "historyBrush"
  | "artHistoryBrush";

export interface Dimensions {
  width: number;
  height: number;
}

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

export interface AdjustmentState {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  gamma: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  clarity: number;
  vibrance: number;
}

export interface EffectState {
  vignette: number;
  grain: number;
  sharpen: number;
  blur: number;
  hueShift: number;
  noise: number;
  clarity: number;
}

export interface GradingState {
  grayscale: number;
  sepia: number;
  invert: number;
  shadowsColor: string;
  midtonesColor: string;
  highlightsColor: string;
  shadowsLuminance: number;
  highlightsLuminance: number;
  blending: number;
}

export type HslColorKey = 'global' | 'red' | 'orange' | 'yellow' | 'green' | 'aqua' | 'blue' | 'purple' | 'magenta';

export interface HslAdjustment {
  hue: number;
  saturation: number;
  luminance: number;
}

export interface HslAdjustmentsState {
  global: HslAdjustment;
  red: HslAdjustment;
  orange: HslAdjustment;
  yellow: HslAdjustment;
  green: HslAdjustment;
  aqua: HslAdjustment;
  blue: HslAdjustment;
  purple: HslAdjustment;
  magenta: HslAdjustment;
}

export interface ChannelState {
  r: boolean;
  g: boolean;
  b: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface CurvesState {
  all: Point[];
  r: Point[];
  g: Point[];
  b: Point[];
}

export interface TransformState {
  rotation: number;
  scaleX: number;
  scaleY: number;
  flipX: boolean;
  flipY: boolean;
}

export interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: 'px' | '%';
  aspect?: number;
}

export interface FrameState {
  type: 'none' | 'border' | 'polaroid' | 'film' | 'solid';
  width: number;
  color: string;
  padding?: number;
  radius?: number;
  opacity?: number;
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
  // Refine Edge settings (Stub)
  refineFeather: number;
  refineSmooth: number;
  refineContrast: number;
  refineShiftEdge: number;
  decontaminateColors: boolean;
}

export interface EditState {
  adjustments: AdjustmentState;
  effects: EffectState;
  grading: GradingState;
  hslAdjustments: HslAdjustmentsState;
  channels: ChannelState;
  curves: CurvesState;
  selectedFilter: string;
  transforms: TransformState;
  crop: CropState | null;
  frame: FrameState;
  colorMode: 'RGB' | 'CMYK' | 'Grayscale';
  selectiveBlurMask: string | null;
  selectiveBlurAmount: number;
  customHslColor: string;
  selectionSettings: SelectionSettings;
}

export interface NewProjectSettings {
  width: number;
  height: number;
  dpi: number;
  backgroundColor: string;
}

// --- Layer Types ---

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

// Base layer properties that all layers share
export interface BaseLayerData {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  isLocked: boolean;
  maskDataUrl?: string;
  isClippingMask?: boolean;
}

export interface ImageLayerData extends BaseLayerData {
  type: 'image';
  dataUrl: string;
}

export interface DrawingLayerData extends BaseLayerData {
  type: 'drawing';
  dataUrl: string;
}

export interface TextLayerData extends BaseLayerData {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | 'normal' | 'bold' | string;
  fontStyle: 'normal' | 'italic';
  color: string;
  fillColor?: string;
  stroke?: { width: number; color: string }; // Text stroke
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  backgroundColor?: string;
  padding?: number;
  textShadow?: { offsetX: number; offsetY: number; blur: number; color: string };
}

export interface VectorShapeLayerData extends BaseLayerData {
  type: 'vector-shape';
  shapeType: 'rect' | 'circle' | 'triangle' | 'polygon' | 'star' | 'line' | 'arrow' | 'custom';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius?: number;
  points?: Point[];
  starPoints?: number;
  lineThickness?: number;
}

export interface GradientLayerData extends BaseLayerData {
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

export interface AdjustmentLayerData extends BaseLayerData {
  type: 'adjustment';
  adjustmentData: {
    type: 'brightness' | 'curves' | 'hsl' | 'grading';
    adjustments?: AdjustmentState;
    curves?: CurvesState;
    hslAdjustments?: HslAdjustmentsState;
    grading?: GradingState;
  };
}

export interface SmartObjectData {
  layers: Layer[];
  width: number;
  height: number;
}

export interface SmartObjectLayerData extends BaseLayerData {
  type: 'smart-object';
  smartObjectData: SmartObjectData;
}

export interface GroupLayerData extends BaseLayerData {
  type: 'group';
  children: Layer[];
  expanded: boolean;
}

export type Layer =
  | ImageLayerData
  | DrawingLayerData
  | TextLayerData
  | VectorShapeLayerData
  | GradientLayerData
  | AdjustmentLayerData
  | SmartObjectLayerData
  | GroupLayerData;

// --- Project & History Types ---

export interface HistoryItem {
  name: string;
  state: EditState;
  layers: Layer[];
}