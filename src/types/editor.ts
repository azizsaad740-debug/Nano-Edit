export type ActiveTool = "lasso" | "brush" | "text" | "crop" | "eraser" | "eyedropper" | "shape" | "move" | "gradient" | "selectionBrush" | "blurBrush";

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
  saturation: number; // 0 to 200 (100 is neutral)
  luminance: number; // -100 to 100 (0 is neutral)
}

export const initialHslAdjustment: HslAdjustment = {
  hue: 0,
  saturation: 100,
  luminance: 0,
};

export interface AdjustmentLayerData {
  type: 'brightness' | 'curves' | 'hsl' | 'grading';
  adjustments?: {
    brightness: number; // 0 to 200
    contrast: number; // 0 to 200
    saturation: number; // 0 to 200
  };
  grading?: {
    grayscale: number; // 0 to 100
    sepia: number; // 0 to 100
    invert: number; // 0 to 100
  };
  hslAdjustments?: {
    global: HslAdjustment;
    red: HslAdjustment;
    orange: HslAdjustment;
    yellow: HslAdjustment;
    green: HslAdjustment;
    aqua: HslAdjustment;
    blue: HslAdjustment;
    purple: HslAdjustment;
    magenta: HslAdjustment;
  };
  curves?: {
    all: Point[];
    r: Point[];
    g: Point[];
    b: Point[];
  };
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

export interface Layer {
  id: string;
  name: string;
  type: 'image' | 'drawing' | 'text' | 'smart-object' | 'vector-shape' | 'group' | 'gradient' | 'adjustment';
  visible: boolean;
  opacity: number; // 0 to 100
  blendMode: string; // CSS blend mode string
  isLocked: boolean;
  isClippingMask?: boolean;
  maskDataUrl?: string; // Data URL of the layer mask (white=visible, black=hidden)

  // Transform properties (used by all non-background layers)
  x?: number; // Center X position (0-100%)
  y?: number; // Center Y position (0-100%)
  width?: number; // Width (0-100%)
  height?: number; // Height (0-100%)
  rotation?: number; // Rotation in degrees

  // Type-specific properties
  dataUrl?: string; // For 'image' and 'drawing'
  content?: string; // For 'text'
  fontSize?: number; // For 'text'
  color?: string; // For 'text'
  fontFamily?: string; // For 'text'
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | string | number; // For 'text'
  fontStyle?: 'normal' | 'italic'; // For 'text'
  textAlign?: 'left' | 'center' | 'right' | 'justify'; // For 'text'
  letterSpacing?: number; // For 'text'
  lineHeight?: number; // For 'text' (multiplier)
  textShadow?: TextShadow; // For 'text'
  stroke?: Stroke; // For 'text'
  backgroundColor?: string; // For 'text' background
  padding?: number; // For 'text' background padding
  
  // NEW TEXT PROPERTIES
  verticalAlignment?: 'top' | 'middle' | 'bottom';
  indentation?: number;
  spaceBefore?: number;
  spaceAfter?: number;
  hyphenate?: boolean;
  wordSpacing?: number;
  baselineShift?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration?: 'none' | 'underline' | 'line-through';
  isSuperscript?: boolean;
  isSubscript?: boolean;
  openTypeFeatures?: OpenTypeFeatures;
  textWarp?: TextWarpData;


  shapeType?: 'rect' | 'circle' | 'triangle' | 'polygon' | 'star' | 'line' | 'arrow' | 'custom'; // For 'vector-shape'
  fillColor?: string; // For 'vector-shape'
  strokeColor?: string; // For 'vector-shape'
  strokeWidth?: number; // For 'vector-shape'
  borderRadius?: number; // For 'vector-shape' (percentage of min(width, height))
  points?: Point[]; // For 'polygon', 'triangle', 'star', 'arrow', 'custom'
  starPoints?: number; // Number of points for a star
  lineThickness?: number; // Thickness for line/arrow (in pixels or percentage)

  gradientType?: 'linear' | 'radial'; // For 'gradient'
  gradientColors?: string[]; // For 'gradient'
  gradientStops?: number[]; // For 'gradient' (0 to 1)
  gradientAngle?: number; // For 'gradient' (0 to 360)
  gradientFeather?: number; // For 'gradient' (0 to 100)
  gradientInverted?: boolean; // For 'gradient'
  gradientCenterX?: number; // For 'radial' (0 to 100)
  gradientCenterY?: number; // For 'radial' (0 to 100)
  gradientRadius?: number; // For 'radial' (0 to 100)

  smartObjectData?: {
    layers: Layer[];
    width: number; // Internal canvas width in pixels
    height: number; // Internal canvas height in pixels
  }; // For 'smart-object'

  children?: Layer[]; // For 'group'
  expanded?: boolean; // For 'group'

  adjustmentData?: AdjustmentLayerData; // For 'adjustment'
}

export interface EditState {
  adjustments: {
    brightness: number; // 0 to 200
    contrast: number; // 0 to 200
    saturation: number; // 0 to 200
  };
  effects: {
    blur: number; // 0 to 20
    hueShift: number; // -180 to 180
    vignette: number; // 0 to 100
    noise: number; // 0 to 100
    sharpen: number; // 0 to 100
    clarity: number; // 0 to 100
  };
  grading: {
    grayscale: number; // 0 to 100
    sepia: number; // 0 to 100
    invert: number; // 0 to 100
  };
  hslAdjustments: {
    global: HslAdjustment;
    red: HslAdjustment;
    orange: HslAdjustment;
    yellow: HslAdjustment;
    green: HslAdjustment;
    aqua: HslAdjustment;
    blue: HslAdjustment;
    purple: HslAdjustment;
    magenta: HslAdjustment;
  };
  curves: {
    all: Point[];
    r: Point[];
    g: Point[];
    b: Point[];
  };
  selectedFilter: string;
  transforms: {
    rotation: number; // -180 to 180
    scaleX: number; // 1 or -1
    scaleY: number; // 1 or -1
  };
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
    unit: 'px' | '%';
  } | undefined;
  frame: {
    type: 'none' | 'solid';
    width: number; // in pixels
    color: string;
  };
  channels: {
    r: boolean;
    g: boolean;
    b: boolean;
  };
  colorMode: 'RGB' | 'CMYK' | 'Grayscale';
  selectiveBlurMask: string | null; // Data URL of the mask for selective blur
  selectiveBlurAmount: number; // 0 to 100 (max blur strength)
}

export interface BrushState {
  size: number;
  opacity: number;
  hardness: number; // 0 to 100
  smoothness: number; // 0 to 100
  shape: 'circle' | 'square';
}

export interface GradientToolState {
  type: 'linear' | 'radial';
  colors: string[];
  stops: number[]; // 0 to 1
  angle: number; // 0 to 360
  feather: number; // 0 to 100
  inverted: boolean;
  centerX: number; // 0 to 100
  centerY: number; // 0 to 100
  radius: number; // 0 to 100
}

export const initialBrushState: Omit<BrushState, 'color'> = {
  size: 20,
  opacity: 100,
  hardness: 50,
  smoothness: 50,
  shape: 'circle',
};

export const initialGradientToolState: GradientToolState = {
  type: 'linear',
  colors: ["#FFFFFF", "#000000"],
  stops: [0, 1],
  angle: 90,
  feather: 0,
  inverted: false,
  centerX: 50,
  centerY: 50,
  radius: 50,
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
  transforms: { rotation: 0, scaleX: 1, scaleY: 1 },
  crop: undefined,
  frame: { type: 'none', width: 0, color: '#000000' },
  channels: { r: true, g: true, b: true },
  colorMode: 'RGB',
  selectiveBlurMask: null,
  selectiveBlurAmount: 50,
};

export const initialLayerState: Layer[] = [
  {
    id: 'background',
    name: 'Background',
    type: 'image',
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    dataUrl: null,
    isLocked: true,
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