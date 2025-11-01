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
  grain: number;
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

export type ShapeType = 'rect' | 'circle' | 'triangle' | 'polygon' | 'star' | 'line' | 'arrow' | 'custom';

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
  // Selection Mode (New based on miniPaint/Photoshop)
  selectionMode: 'new' | 'add' | 'subtract' | 'intersect';
  // Refine Edge settings (Stub)
  refineFeather: number;
  refineSmooth: number;
  refineContrast: number;
  refineShiftEdge: number;
  decontaminateColors: boolean;
  edgeDetection: number;
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
  selectiveSharpenMask: string | null; // ADDED
  selectiveSharpenAmount: number; // ADDED
  customHslColor: string;
  selectionSettings: SelectionSettings;
}

export interface NewProjectSettings {
  width: number;
  height: number;
  dpi: number;
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
  shapeType: ShapeType;
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

// --- Initial States ---

export const initialHslAdjustment: HslAdjustment = {
  hue: 0,
  saturation: 100,
  luminance: 0,
};

export const initialCurvesState: CurvesState = {
  all: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  r: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  g: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  b: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
};

export const initialSelectionSettings: SelectionSettings = {
  feather: 0,
  antiAlias: true,
  fixedRatio: false,
  fixedWidth: 0,
  fixedHeight: 0,
  tolerance: 32,
  contiguous: true,
  sampleAllLayers: false,
  autoEnhanceEdges: true,
  showTransformControls: true,
  autoSelectLayer: true,
  snapToPixels: true,
  selectionMode: 'new', // Default to new selection
  refineFeather: 0,
  refineSmooth: 0,
  refineContrast: 0,
  refineShiftEdge: 0,
  decontaminateColors: false,
  edgeDetection: 50,
};

export const initialEditState: EditState = {
  adjustments: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    exposure: 0,
    gamma: 100,
    temperature: 0,
    tint: 0,
    highlights: 0,
    shadows: 0,
    clarity: 0,
    vibrance: 100,
    grain: 0,
  },
  effects: {
    blur: 0,
    hueShift: 0,
    vignette: 0,
    noise: 0,
    sharpen: 0,
    clarity: 0,
    grain: 0,
  },
  grading: {
    grayscale: 0,
    sepia: 0,
    invert: 0,
    shadowsColor: '#000000',
    midtonesColor: '#808080',
    highlightsColor: '#FFFFFF',
    shadowsLuminance: 0,
    highlightsLuminance: 0,
    blending: 50,
  },
  hslAdjustments: {
    global: { ...initialHslAdjustment },
    red: { ...initialHslAdjustment },
    orange: { ...initialHslAdjustment },
    yellow: { ...initialHslAdjustment },
    green: { ...initialHslAdjustment },
    aqua: { ...initialHslAdjustment },
    blue: { ...initialHslAdjustment },
    purple: { ...initialHslAdjustment },
    magenta: { ...initialHslAdjustment },
  },
  channels: { r: true, g: true, b: true },
  curves: initialCurvesState,
  selectedFilter: "",
  transforms: { rotation: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  crop: null,
  frame: { type: 'none', width: 0, color: '#000000' },
  selectiveBlurMask: null,
  selectiveBlurAmount: 0,
  selectiveSharpenMask: null, // ADDED
  selectiveSharpenAmount: 0, // ADDED
  customHslColor: '#FF00FF',
  selectionSettings: initialSelectionSettings,
  colorMode: 'RGB',
};

export const initialBrushState: BrushState = {
  size: 20,
  opacity: 100,
  hardness: 50,
  smoothness: 10,
  shape: 'circle',
  color: '#000000',
  flow: 100,
  angle: 0,
  roundness: 100,
  spacing: 25,
  blendMode: 'normal',
};

export const initialGradientToolState: GradientToolState = {
  type: 'linear',
  colors: ['#FFFFFF', '#000000'],
  stops: [0, 1],
  angle: 90,
  centerX: 50,
  centerY: 50,
  radius: 50,
  feather: 0,
  inverted: false,
  dither: true,
  transparency: true,
};

export const initialLayerState: Layer[] = [
  {
    id: 'background',
    name: 'Background',
    type: 'image',
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    dataUrl: '',
    isLocked: true,
    x: 50, y: 50, width: 100, height: 100, rotation: 0,
    scaleX: 1, scaleY: 1,
    isClippingMask: false,
  } as ImageLayerData,
];

export const initialHistoryItem: HistoryItem = {
  name: 'Initial State',
  state: initialEditState,
  layers: initialLayerState,
};

// --- Type Guards ---

export function isVectorShapeLayer(layer: Layer): layer is VectorShapeLayerData {
  return layer.type === 'vector-shape';
}

export function isTextLayer(layer: Layer): layer is TextLayerData {
  return layer.type === 'text';
}

export function isDrawingLayer(layer: Layer): layer is DrawingLayerData {
  return layer.type === 'drawing';
}

export function isImageLayer(layer: Layer): layer is ImageLayerData {
  return layer.type === 'image';
}

export function isImageOrDrawingLayer(layer: Layer): layer is ImageLayerData | DrawingLayerData {
  return layer.type === 'image' || layer.type === 'drawing';
}