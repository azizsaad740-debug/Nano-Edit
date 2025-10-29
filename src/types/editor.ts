export interface Dimensions {
// ...
}

export interface Point {
// ...
}

export interface TextShadow {
// ...
}

export interface Stroke {
// ...
}

export type HslColorKey = 'global' | 'red' | 'orange' | 'yellow' | 'green' | 'aqua' | 'blue' | 'purple' | 'magenta';

export interface HslAdjustment {
// ...
}

export const initialHslAdjustment: HslAdjustment = {
// ...
};

export interface AdjustmentLayerData {
// ...
}

export const initialCurvesState = {
// ...
};

export interface TextWarpData {
// ...
}

export interface OpenTypeFeatures {
// ...
}

export interface Layer {
// ...
}

export interface SelectionSettings {
// ...
}

export interface BrushState {
// ...
}

export interface GradientToolState {
// ...
}

export const initialBrushState: Omit<BrushState, 'color'> = {
// ...
};

export const initialGradientToolState: GradientToolState = {
// ...
};

export interface EditState {
// ...
}

export const initialEditState: EditState = {
// ...
};

export const initialSelectionSettings: SelectionSettings = {
// ...
};

export const initialLayerState: Layer[] = [
// ...
];

export interface HistoryItem {
// ...
}

export const initialHistoryItem: HistoryItem = {
// ...
};

export interface NewProjectSettings {
// ...
}

export type ActiveTool = "lasso" | "brush" | "text" | "crop" | "eraser" | "eyedropper" | "shape" | "move" | "gradient" | "selectionBrush" | "blurBrush" | "marqueeRect" | "marqueeEllipse" | "marqueeRow" | "marqueeCol" | "lassoPoly" | "lassoMagnetic" | "quickSelect" | "magicWand" | "objectSelect" | "pencil" | "paintBucket" | "patternStamp" | "cloneStamp" | "historyBrush" | "artHistoryBrush";