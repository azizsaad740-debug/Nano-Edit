// src/types/editor/initialState.ts
import type {
  EditState,
  HistoryItem,
} from './state'; // REVERT
import type {
  BrushState,
  GradientToolState,
  SelectionSettings,
} from './tools'; // REVERT
import type {
  HslAdjustment,
  CurvesState,
  GradingState,
} from './adjustments'; // REVERT
import type {
  Layer,
  ImageLayerData,
} from './layers'; // REVERT

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

export const initialGradingState: GradingState = {
  grayscale: 0,
  sepia: 0,
  invert: 0,
  shadowsColor: '#000000',
  midtonesColor: '#808080',
  highlightsColor: '#FFFFFF',
  shadowsLuminance: 0,
  highlightsLuminance: 0,
  blending: 50,
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
  state: {} as EditState, // Placeholder, will be filled below
  layers: initialLayerState,
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
  grading: initialGradingState,
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
  selectiveSharpenMask: null,
  selectiveSharpenAmount: 0,
  customHslColor: '#FF00FF',
  selectionSettings: initialSelectionSettings,
  colorMode: 'RGB',
  
  // Added for persistence
  brushState: initialBrushState,
  history: [initialHistoryItem], // Self-reference placeholder
  historyBrushSourceIndex: 0,
};

// Fix circular dependency placeholder for initialHistoryItem
initialHistoryItem.state = initialEditState;