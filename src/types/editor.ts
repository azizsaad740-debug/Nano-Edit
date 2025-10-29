import type { Layer, EditState, HistoryItem, BrushState, GradientToolState, Dimensions, HslAdjustment, HslAdjustmentsState, SelectionSettings, ActiveTool, Point, BlendMode, HslColorKey, NewProjectSettings, AdjustmentLayerData, SmartObjectData, ImageLayerData, DrawingLayerData, TextLayerData, VectorShapeLayerData, GradientLayerData, AdjustmentLayerData, SmartObjectLayerData, GroupLayerData, ShapeType } from "@/types/editor.d";

// --- Initial State Constants ---

export const initialBrushState: Omit<BrushState, 'color'> = {
  size: 20,
  opacity: 100,
  hardness: 50,
  smoothness: 0,
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

export const initialHslAdjustment: HslAdjustment = {
  hue: 0,
  saturation: 100,
  luminance: 0,
};

export const initialHslAdjustments: HslAdjustmentsState = {
  global: { ...initialHslAdjustment },
  red: { ...initialHslAdjustment },
  orange: { ...initialHslAdjustment },
  yellow: { ...initialHslAdjustment },
  green: { ...initialHslAdjustment },
  aqua: { ...initialHslAdjustment },
  blue: { ...initialHslAdjustment },
  purple: { ...initialHslAdjustment },
  magenta: { ...initialHslAdjustment },
};

export const initialCurvesState = {
  all: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  r: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  g: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  b: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
};

export const initialSelectionSettings: SelectionSettings = {
  feather: 0,
  antiAlias: true,
  fixedRatio: false,
  fixedWidth: 100,
  fixedHeight: 100,
  tolerance: 32,
  contiguous: true,
  sampleAllLayers: false,
  autoEnhanceEdges: true,
  showTransformControls: true,
  autoSelectLayer: true,
  snapToPixels: true,
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
  hslAdjustments: initialHslAdjustments,
  channels: { r: true, g: true, b: true },
  curves: initialCurvesState,
  selectedFilter: '',
  transforms: {
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    flipX: false,
    flipY: false,
  },
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
    dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    isLocked: true,
    x: 50, y: 50, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1,
  },
];

export const initialHistoryItem: HistoryItem = {
  name: 'Initial State',
  state: initialEditState,
  layers: initialLayerState,
};

export type { Layer, EditState, HistoryItem, BrushState, GradientToolState, Dimensions, HslAdjustment, HslColorKey, SelectionSettings, ActiveTool, Point, NewProjectSettings, BlendMode, AdjustmentLayerData, SmartObjectData, ImageLayerData, DrawingLayerData, TextLayerData, VectorShapeLayerData, GradientLayerData, AdjustmentLayerData, SmartObjectLayerData, GroupLayerData, ShapeType };