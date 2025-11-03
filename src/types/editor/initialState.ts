// src/types/editor/initialState.ts

import type { Layer, EditState, BrushState, GradientToolState, HistoryItem, SelectionSettings, PanelTab, HslAdjustment, CurvesState, GradingState, AdjustmentState, FrameState, CropState } from "./core";
import { Layers, SlidersHorizontal, Settings, Brush, Palette, LayoutGrid, PenTool, History, Info, Compass, SquareStack, Zap } from "lucide-react";

// Define initial states and export them
export const initialBrushState: BrushState = {
    size: 20,
    hardness: 50,
    opacity: 100,
    flow: 100,
    spacing: 25,
    blendMode: 'normal',
    shape: 'circle',
    angle: 0,
    roundness: 100,
    jitter: 0,
    scatter: 0,
    texture: null,
    dualBrush: null,
    smoothing: true,
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
    historySource: 'current',
    smoothness: 0, // Added
};

export const initialAdjustmentState: AdjustmentState = {
    brightness: 100,
    contrast: 100,
    exposure: 0,
    saturation: 100,
    vibrance: 0,
    temperature: 0,
    tint: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    clarity: 0,
    dehaze: 0,
    gamma: 100, // Added
    grain: 0, // Added
};

export const initialGradingState: GradingState = {
    shadows: { hue: 0, saturation: 0, luminosity: 0 },
    midtones: { hue: 0, saturation: 0, luminosity: 0 },
    highlights: { hue: 0, saturation: 0, luminosity: 0 },
    blending: 50,
    balance: 0,
    grayscale: 0,
    sepia: 0,
    invert: 0,
    shadowsColor: '#000000', // Added
    midtonesColor: '#808080', // Added
    highlightsColor: '#FFFFFF', // Added
    shadowsLuminance: 0, // Added
    highlightsLuminance: 0, // Added
};

export const initialHslAdjustment: HslAdjustment = {
    hue: 0,
    saturation: 0,
    lightness: 0, // Standardized property name
};

export const initialHslAdjustmentsState = {
    master: initialHslAdjustment,
    red: initialHslAdjustment,
    orange: initialHslAdjustment,
    yellow: initialHslAdjustment,
    green: initialHslAdjustment,
    aqua: initialHslAdjustment,
    blue: initialHslAdjustment,
    purple: initialHslAdjustment,
    magenta: initialHslAdjustment,
};

export const initialCurvesState: CurvesState = {
    all: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
    r: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
    g: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
    b: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
};

export const initialFrameState: FrameState = {
    type: 'none',
    color: '#000000',
    width: 0,
    opacity: 100,
    roundness: 0,
    vignetteAmount: 0,
    vignetteRoundness: 0,
};

export const initialCropState: CropState = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    unit: '%',
    aspect: null,
};

export const initialSelectionSettings: SelectionSettings = {
    selectionMode: 'new',
    tolerance: 32,
    feather: 0,
    antiAlias: true,
    contiguous: true,
    autoSelectLayer: false,
    showTransformControls: true,
    snapToPixels: true,
    fixedRatio: false,
    fixedWidth: 0,
    fixedHeight: 0,
    edgeDetection: 50,
    sampleAllLayers: false,
    refineFeather: 0,
    refineSmooth: 0,
    refineContrast: 0,
    refineShiftEdge: 0,
    decontaminateColors: false,
    autoEnhanceEdges: false,
};

export const initialEditState: EditState = {
    adjustments: initialAdjustmentState,
    effects: {
        blur: 0,
        hueShift: 0,
        vignette: 0,
        noise: 0,
        sharpen: 0,
        clarity: 0,
    },
    grading: initialGradingState,
    hslAdjustments: initialHslAdjustmentsState,
    curves: initialCurvesState,
    frame: initialFrameState,
    crop: initialCropState,
    transform: {
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0,
        perspectiveX: 0,
        perspectiveY: 0,
    },
    rotation: 0,
    aspect: null,
    selectedFilter: '',
    colorMode: 'rgb',
    selectiveBlurAmount: 0,
    selectiveSharpenAmount: 0,
    customHslColor: 'red',
    selectionSettings: initialSelectionSettings,
    channels: {
        r: true,
        g: true,
        b: true,
        alpha: true,
    },
    history: [],
    historyBrushSourceIndex: 0,
    brushState: initialBrushState,
    selectiveBlurMask: null,
    selectiveSharpenMask: null,
    isProxyMode: false, // <-- ADDED
};

export const initialGradientToolState: GradientToolState = {
    type: 'linear',
    colors: ['#000000', '#FFFFFF'],
    stops: [0, 1],
    angle: 90,
    feather: 0,
    inverted: false,
    centerX: 50,
    centerY: 50,
    radius: 50,
};

export const initialLayerState: Layer[] = [
    {
        id: 'background',
        name: 'Background',
        type: 'image',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        isLocked: true,
        maskDataUrl: null,
        dataUrl: '',
        exifData: null,
        x: 50, y: 50, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1,
    } as Layer,
];

export const initialHistoryItem: HistoryItem = {
    name: 'Initial State',
    state: initialEditState,
    layers: initialLayerState,
};

export const initialPanelLayout: PanelTab[] = [
    { id: 'layers', name: 'Layers', icon: Layers, location: 'right', visible: true, order: 1 },
    { id: 'properties', name: 'Properties', icon: Settings, location: 'right', visible: true, order: 2 },
    { id: 'correction', name: 'Correction', icon: SlidersHorizontal, location: 'bottom', visible: true, order: 3 },
    { id: 'ai-xtra', name: 'AI Xtra', icon: Zap, location: 'bottom', visible: true, order: 4 },
    { id: 'history', name: 'History', icon: History, location: 'right', visible: false, order: 5 },
    { id: 'channels', name: 'Channels', icon: SquareStack, location: 'right', visible: false, order: 6 },
    { id: 'color', name: 'Color', icon: Palette, location: 'bottom', visible: false, order: 7 },
    { id: 'info', name: 'Info', icon: Info, location: 'bottom', visible: false, order: 8 },
    { id: 'navigator', name: 'Navigator', icon: Compass, location: 'bottom', visible: false, order: 9 },
    { id: 'brushes', name: 'Brushes', icon: Brush, location: 'right', visible: false, order: 10 },
    { id: 'paths', name: 'Paths', icon: PenTool, location: 'right', visible: false, order: 11 },
    { id: 'adjustments', name: 'Adjustments', icon: SlidersHorizontal, location: 'right', visible: false, order: 12 },
    { id: 'templates', name: 'Templates', icon: LayoutGrid, location: 'right', visible: false, order: 13 },
];