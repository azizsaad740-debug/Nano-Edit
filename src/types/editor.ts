export type LayerType = "image" | "text" | "drawing" | "smart-object" | "vector-shape" | "group" | "gradient" | "adjustment";

export type ActiveTool = "move" | "lasso" | "brush" | "eraser" | "text" | "crop" | "eyedropper" | "shape" | "gradient" | "selectionBrush" | "blurBrush";

export interface Point {
  x: number;
  y: number;
}

export interface BrushState {
  size: number;
  opacity: number;
  hardness: number;
  smoothness: number;
  shape: 'circle' | 'square';
}

export interface GradientToolState {
  type: 'linear' | 'radial';
  colors: string[];
  stops: number[]; // 0 to 1
  angle: number; // 0 to 360 (for linear)
  centerX: number; // 0 to 100 (for radial)
  centerY: number; // 0 to 100 (for radial)
  radius: number; // 0 to 100 (for radial)
  feather: number; // 0 to 100
  inverted: boolean;
}

export interface HslAdjustment {
  hue: number; // -180 to 180
  saturation: number; // 0 to 200 (100 is neutral)
  luminance: number; // -100 to 100
}

export type HslColorKey = 'global' | 'red' | 'orange' | 'yellow' | 'green' | 'aqua' | 'blue' | 'purple' | 'magenta';

export interface AdjustmentLayerData {
  type: 'brightness' | 'curves' | 'hsl' | 'grading';
  adjustments?: EditState['adjustments'];
  curves?: EditState['curves'];
  hslAdjustments?: EditState['hslAdjustments'];
  grading?: EditState['grading'];
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  isLocked: boolean;
  type: LayerType;
  opacity: number;
  blendMode: string; // CSS blend mode string

  // Transform/Position (used by all non-image layers)
  x?: number; // 0-100% center position
  y?: number; // 0-100% center position
  width?: number; // 0-100% width relative to canvas
  height?: number; // 0-100% height relative to canvas
  rotation?: number; // -180 to 180

  // Image/Drawing/SmartObject content
  dataUrl?: string;
  maskDataUrl?: string;
  isClippingMask?: boolean;

  // Group properties
  expanded?: boolean;
  children?: Layer[];

  // Text properties
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | number;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  letterSpacing?: number;
  lineHeight?: number;
  color?: string;
  textShadow?: { color: string; blur: number; offsetX: number; offsetY: number };
  stroke?: { color: string; width: number };
  backgroundColor?: string;
  padding?: number;

  // Vector Shape properties
  shapeType?: 'rect' | 'circle' | 'triangle' | 'polygon';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number; // For rect
  points?: Point[]; // For polygon/triangle (0-100% relative to layer bounds)

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

  // Smart Object properties
  smartObjectData?: {
    layers: Layer[];
    width: number; // internal pixel width
    height: number; // internal pixel height
  };

  // Adjustment Layer properties
  adjustmentData?: AdjustmentLayerData;
}

export interface EditState {
  adjustments: {
    brightness: number; // 0-200
    contrast: number; // 0-200
    saturation: number; // 0-200
  };
  effects: {
    blur: number; // 0-20
    hueShift: number; // -180 to 180
    vignette: number; // 0-100
    noise: number; // 0-100
    sharpen: number; // 0-100
    clarity: number; // 0-100
  };
  grading: {
    grayscale: number; // 0-100
    sepia: number; // 0-100
    invert: number; // 0-100
  };
  hslAdjustments: Record<HslColorKey, HslAdjustment>;
  curves: {
    all: Point[];
    r: Point[];
    g: Point[];
    b: Point[];
  };
  channels: {
    r: boolean;
    g: boolean;
    b: boolean;
  };
  selectedFilter: string;
  transforms: {
    rotation: number; // 0-360
    scaleX: 1 | -1;
    scaleY: 1 | -1;
  };
  frame: {
    type: 'none' | 'solid';
    width: number;
    color: string;
  };
  crop: any; // react-image-crop Crop type
  colorMode: 'RGB' | 'Grayscale' | 'CMYK';
  selectiveBlurMask: string | null;
  selectiveBlurAmount: number;
}

export interface HistoryItem {
  name: string;
  state: EditState;
  layers: Layer[];
}

// --- Initial States ---

export const initialCurvesState: EditState['curves'] = {
  all: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  r: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  g: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  b: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
};

export const initialHslAdjustment: HslAdjustment = {
  hue: 0,
  saturation: 100,
  luminance: 0,
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
  channels: { r: true, g: true, b: true },
  selectedFilter: "",
  transforms: { rotation: 0, scaleX: 1, scaleY: 1 },
  frame: { type: 'none', width: 0, color: '#000000' },
  crop: undefined,
  colorMode: 'RGB',
  selectiveBlurMask: null,
  selectiveBlurAmount: 50,
};

export const initialLayerState: Layer[] = [
  {
    id: 'background',
    name: 'Background',
    visible: true,
    isLocked: true,
    type: 'image',
    opacity: 100,
    blendMode: 'normal',
  },
];

export const initialHistoryItem: HistoryItem = {
  name: "Initial State",
  state: initialEditState,
  layers: initialLayerState,
};

export const initialBrushState: BrushState = {
  size: 20,
  opacity: 100,
  hardness: 50,
  smoothness: 50,
  shape: 'circle',
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
};