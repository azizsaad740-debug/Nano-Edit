export interface Dimensions {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface TextShadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface Stroke {
  color: string;
  width: number;
}

export type HslColorKey = 'global' | 'red' | 'orange' | 'yellow' | 'green' | 'aqua' | 'blue' | 'purple' | 'magenta';

export interface HslAdjustment {
  hue: number;
  saturation: number;
  luminance: number;
}

export const initialHslAdjustment: HslAdjustment = {
  hue: 0,
  saturation: 100,
  luminance: 0,
};

export interface AdjustmentLayerData {
  type: 'brightness' | 'curves' | 'hsl' | 'grading';
  adjustments?: AdjustmentState;
  grading?: GradingState;
  hslAdjustments?: EditState['hslAdjustments'];
  curves?: EditState['curves'];
}

export const initialCurvesState = {
  all: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  r: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  g: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  b: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
};

export interface TextWarpData {
  type: 'none' | 'arc' | 'arch' | 'bulge' | 'shell' | 'wave' | 'fish' | 'rise' | 'fisheye' | 'inflate' | 'squeeze' | 'twist' | 'custom';
  bend: number; // -100 to 100
  horizontalDistortion: number;
  verticalDistortion: number;
  customPath?: string; // For custom warping
}

export interface OpenTypeFeatures {
  ligatures: boolean;
  swashes: boolean;
  stylisticSet: number;
  fractions: boolean;
}

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

export type LayerType = 'image' | 'drawing' | 'vector-shape' | 'gradient' | 'adjustment' | 'smart-object' | 'text' | 'group';
export type ShapeType = 'rect' | 'circle' | 'triangle' | 'polygon' | 'star' | 'line' | 'arrow' | 'custom';
export type TextAlignment = 'left' | 'center' | 'right' | 'justify';
export type TextVerticalAlignment = 'top' | 'middle' | 'bottom';
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type TextDecoration = 'none' | 'underline' | 'line-through';

export interface BaseLayerData {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  blendMode: BlendMode;
  maskDataUrl?: string; // Data URL of the mask image
  isClippingMask?: boolean;
  isLocked: boolean;
}

export interface Layer extends BaseLayerData {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  // Content/Data
  dataUrl?: string; // For image/drawing layers
  content?: string; // For text layers
  // Text properties
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  color?: string;
  textAlign?: TextAlignment;
  verticalAlignment?: TextVerticalAlignment;
  lineHeight?: number;
  letterSpacing?: number;
  wordSpacing?: number;
  baselineShift?: number;
  indentation?: number;
  spaceBefore?: number;
  spaceAfter?: number;
  hyphenate?: boolean;
  textTransform?: TextTransform;
  textDecoration?: TextDecoration;
  isSuperscript?: boolean;
  isSubscript?: boolean;
  openTypeFeatures?: OpenTypeFeatures;
  textWarp?: TextWarpData;
  textShadow?: TextShadow;
  stroke?: Stroke;
  backgroundColor?: string;
  padding?: number;
  // Shape properties
  shapeType?: ShapeType;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  points?: Point[];
  starPoints?: number;
  lineThickness?: number;
  // Gradient properties
  gradientType?: 'linear' | 'radial';
  gradientColors?: string[];
  gradientStops?: number[];
  gradientAngle?: number;
  gradientFeather?: number;
  gradientInverted?: boolean;
  gradientCenterX?: number;
  gradientCenterY?: number;
  gradientRadius?: number;
  dither?: boolean;
  transparency?: boolean;
  // Adjustment properties
  adjustmentData?: AdjustmentLayerData;
  // Smart Object properties
  smartObjectData?: { width: number; height: number; layers: Layer[] };
  // Group properties
  children?: Layer[];
  expanded?: boolean;
}

export interface SelectionSettings {
  autoSelectLayer: boolean;
  showTransformControls: boolean;
  snapToPixels: boolean;
  feather: number;
  antiAlias: boolean;
  fixedRatio: boolean;
  fixedWidth: number;
  fixedHeight: number;
  edgeDetection: number; // For magnetic lasso
  tolerance: number; // For magic wand/paint bucket
  contiguous: boolean; // For magic wand/paint bucket
  autoEnhanceEdges: boolean; // For quick select/object select
  sampleAllLayers: boolean; // For quick select/magic wand/paint bucket
  // Refine Edge settings (Stub)
  refineFeather: number;
  refineSmooth: number;
  refineContrast: number;
  refineShiftEdge: number;
  decontaminateColors: boolean;
}

export interface BrushState {
  size: number;
  opacity: number;
  hardness: number;
  smoothness: number;
  shape: 'circle' | 'square';
  color: string;
  // Advanced Brush Dynamics
  flow: number;
  angle: number;
  roundness: number;
  spacing: number;
  blendMode: BlendMode;
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

export const initialBrushState: Omit<BrushState, 'color'> = {
  size: 20,
  opacity: 100,
  hardness: 50,
  smoothness: 10,
  shape: 'circle',
  flow: 100,
  angle: 0,
  roundness: 100,
  spacing: 25,
  blendMode: 'normal',
};

export const initialGradientToolState: GradientToolState = {
  type: 'linear',
  colors: ['#000000', '#FFFFFF'],
  stops: [0, 1],
  angle: 90,
  centerX: 50,
  centerY: 50,
  radius: 50,
  feather: 0,
  inverted: false,
  dither: false,
  transparency: true,
};

export interface AdjustmentState {
  brightness: number;
  contrast: number;
  saturation: number;
}

export interface EffectState {
  blur: number;
  hueShift: number;
  vignette: number;
  noise: number;
  sharpen: number;
  clarity: number;
}

export interface GradingState {
  grayscale: number;
  sepia: number;
  invert: number;
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
}

export interface FrameState {
  type: 'none' | 'border' | 'polaroid' | 'film';
  width: number;
  color: string;
  padding?: number;
  radius?: number;
  opacity?: number;
}

export interface EditState {
  adjustments: AdjustmentState;
  effects: EffectState;
  grading: GradingState;
  hslAdjustments: Record<HslColorKey, HslAdjustment>;
  curves: CurvesState;
  selectedFilter: string;
  transforms: TransformState;
  crop: CropState | null;
  frame: FrameState;
  colorMode: 'RGB' | 'CMYK' | 'Grayscale';
  selectiveBlurMask: string | null;
  selectiveBlurAmount: number;
  customHslColor: string;
  selectionSettings: SelectionSettings; // NEW
}

export const initialSelectionSettings: SelectionSettings = {
  autoSelectLayer: true,
  showTransformControls: true,
  snapToPixels: true,
  feather: 0,
  antiAlias: true,
  fixedRatio: false,
  fixedWidth: 100,
  fixedHeight: 100,
  edgeDetection: 50,
  tolerance: 32,
  contiguous: true,
  autoEnhanceEdges: true,
  sampleAllLayers: false,
  refineFeather: 0,
  refineSmooth: 0,
  refineContrast: 0,
  refineShiftEdge: 0,
  decontaminateColors: false,
};

export const initialEditState: EditState = {
  adjustments: { brightness: 100, contrast: 100, saturation: 100 },
  effects: { blur: 0, hueShift: 0, vignette: 0, noise: 0, sharpen: 0, clarity: 0 },
  grading: { grayscale: 0, sepia: 0, invert: 0 },
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
  curves: initialCurvesState,
  selectedFilter: "",
  transforms: { rotation: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false },
  crop: null,
  frame: { type: 'none', width: 0, color: '#000000' },
  colorMode: 'RGB',
  selectiveBlurMask: null,
  selectiveBlurAmount: 0,
  customHslColor: '#FF00FF',
  selectionSettings: initialSelectionSettings,
};

export const initialLayerState: Layer[] = [
  {
    id: 'background',
    name: 'Background',
    type: 'image',
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    dataUrl: 'public/placeholder.svg',
    isLocked: true,
    x: 50, y: 50, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1,
  },
];

export interface HistoryItem {
  name: string;
  state: EditState;
  layers: Layer[];
}

export const initialHistoryItem: HistoryItem = {
  name: 'Initial State',
  state: initialEditState,
  layers: initialLayerState,
};

export interface NewProjectSettings {
  width: number;
  height: number;
  dpi: number;
  backgroundColor: string;
}

export type ActiveTool = "lasso" | "brush" | "text" | "crop" | "eraser" | "eyedropper" | "shape" | "move" | "gradient" | "selectionBrush" | "blurBrush" | "marqueeRect" | "marqueeEllipse" | "marqueeRow" | "marqueeCol" | "lassoPoly" | "lassoMagnetic" | "quickSelect" | "magicWand" | "objectSelect" | "pencil" | "paintBucket" | "patternStamp" | "cloneStamp" | "historyBrush" | "artHistoryBrush";