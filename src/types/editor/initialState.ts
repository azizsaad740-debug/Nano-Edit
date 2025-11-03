import type {
  EditState,
  Layer,
  HistoryItem,
  BrushState,
  GradientToolState,
  SelectionSettings,
  PanelTab,
} from "./core";
import {
  initialAdjustmentState, // Fix TS2724
  initialCurvesState, // Fix TS2305
  initialGradingState, // Fix TS2305
  initialHslAdjustment, // Fix TS2305
  initialHslAdjustmentsState, // Fix TS2724
  initialFrameState, // Fix TS2305
} from "./adjustments";

// --- Brush State ---
export const initialBrushState: BrushState = {
  size: 20,
  opacity: 100,
  hardness: 50,
  smoothness: 0,
  shape: 'circle',
  color: '#000000', // Fix TS2741
  flow: 100,
  angle: 0,
  roundness: 100,
  spacing: 25,
  blendMode: 'normal',
  jitter: 0,
  scatter: 0,
  texture: null,
  dualBrush: null,
  smoothing: false,
  protectTexture: false,
  wetEdges: false,
  buildUp: false,
  flipX: false,
  flipY: false,
  colorDynamics: false,
  transfer: false,
  noise: false,
  wetness: 0,
  mix: 0,
  load: 0,
  historySource: 'background',
};

// --- Gradient Tool State ---
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
  dither: false, // Fix TS2739
  transparency: false, // Fix TS2739
};

// --- Selection Settings ---
export const initialSelectionSettings: SelectionSettings = {
  feather: 0,
  antiAlias: true,
  fixedRatio: false,
  fixedWidth: 0,
  fixedHeight: 0,
  tolerance: 32,
  contiguous: true,
  sampleAllLayers: false,
  autoEnhanceEdges: false,
  showTransformControls: true,
  autoSelectLayer: false,
  snapToPixels: true,
  selectionMode: 'new',
  refineFeather: 0,
  refineSmooth: 0,
  refineContrast: 0,
  refineShiftEdge: 0,
  decontaminateColors: false,
  edgeDetection: 0,
};

// --- Layer State ---
export const initialLayerState: Layer[] = [];

// --- History Item ---
export const initialHistoryItem: HistoryItem = {
  name: 'Initial State',
  state: {} as EditState, // Placeholder, filled below
  layers: initialLayerState,
};

// --- Edit State ---
export const initialEditState: EditState = {
  adjustments: initialAdjustmentState,
  effects: { blur: 0, hueShift: 0, vignette: 0, noise: 0, sharpen: 0, clarity: 0 },
  grading: initialGradingState,
  hslAdjustments: initialHslAdjustmentsState,
  curves: initialCurvesState,
  frame: initialFrameState,
  crop: { x: 0, y: 0, width: 100, height: 100, unit: '%', aspect: null },
  transform: { scaleX: 1, scaleY: 1, skewX: 0, skewY: 0, perspectiveX: 0, perspectiveY: 0 },
  rotation: 0,
  aspect: null,
  selectedFilter: '',
  colorMode: 'rgb',
  selectiveBlurAmount: 0,
  selectiveSharpenAmount: 0,
  customHslColor: 'master',
  selectionSettings: initialSelectionSettings,
  channels: { r: true, g: true, b: true, alpha: true },
  history: [initialHistoryItem],
  historyBrushSourceIndex: 0,
  brushState: initialBrushState,
  selectiveBlurMask: null,
  selectiveSharpenMask: null,
  isProxyMode: false,
  gradientToolState: initialGradientToolState, // Fix TS2741
  customFonts: [], // Fix TS2339
};

// Update the placeholder in initialHistoryItem
initialHistoryItem.state = initialEditState;

// --- Panel Layout ---
// Note: Icons are imported in the component using this type
export const initialPanelLayout: PanelTab[] = [
  { id: 'layers', name: 'Layers', icon: {} as any, location: 'right', visible: true, order: 1 },
  { id: 'adjustments', name: 'Adjustments', icon: {} as any, location: 'right', visible: true, order: 2 },
  { id: 'history', name: 'History', icon: {} as any, location: 'bottom', visible: true, order: 1 },
  { id: 'correction', name: 'Color Correction', icon: {} as any, location: 'bottom', visible: true, order: 2 },
  { id: 'info', name: 'Info', icon: {} as any, location: 'bottom', visible: false, order: 3 },
];