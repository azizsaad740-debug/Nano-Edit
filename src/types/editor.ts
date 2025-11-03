// src/types/editor.ts

export * from "./editor/core";
export * from "./editor/adjustments";
export * from "./editor/template"; // Fix TS2307

import {
    initialEditState,
    initialBrushState,
    initialGradientToolState,
    initialLayerState,
    initialHistoryItem,
    initialSelectionSettings,
    initialPanelLayout,
} from "./editor/initialState";

import {
    initialAdjustmentState, 
    initialGradingState, 
    initialHslAdjustment, 
    initialHslAdjustmentsState, 
    initialCurvesState, 
    initialFrameState, 
} from "./editor/adjustments";

export {
    initialEditState,
    initialBrushState,
    initialGradientToolState,
    initialLayerState,
    initialHistoryItem,
    initialSelectionSettings,
    initialPanelLayout,
    
    // Exporting initial adjustment states
    initialAdjustmentState,
    initialGradingState,
    initialHslAdjustment,
    initialHslAdjustmentsState,
    initialCurvesState,
    initialFrameState,
};