import type { CommunityTemplate, TemplateProjectData } from "../types/template";
import { initialEditState, initialLayerState, initialCurvesState, initialSelectionSettings, ImageLayerData, initialAdjustmentState, initialGradingState } from "@/types/editor";

// ... (rest of imports)

const template1: TemplateProjectData = {
    // ...
    editState: {
        ...initialEditState,
        adjustments: { ...initialAdjustmentState, brightness: 100, contrast: 110, saturation: 120 },
        effects: { ...initialEditState.effects, blur: 0, hueShift: 0, vignette: 0, noise: 0, sharpen: 0, clarity: 0 },
        grading: { ...initialGradingState, grayscale: 0, sepia: 0, invert: 0 },
        selectedFilter: "contrast(1.2) saturate(1.1) brightness(0.9)",
    },
    // ...
};

const template2: TemplateProjectData = {
    // ...
    editState: {
        ...initialEditState,
        adjustments: { ...initialAdjustmentState, brightness: 100, contrast: 100, saturation: 100 },
        grading: { ...initialGradingState, grayscale: 10, sepia: 0, invert: 0 },
        selectedFilter: "",
    },
    // ...
};

// ... (rest of file)