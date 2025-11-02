import type { CommunityTemplate, TemplateProjectData } from "../types/template";
import { initialEditState, initialLayerState, initialCurvesState, initialSelectionSettings, ImageLayerData, initialAdjustmentState, initialGradingState } from "@/types/editor";

// ... (rest of imports)

const template1: TemplateProjectData = {
    layers: initialLayerState, // Fix 79
    dimensions: { width: 1920, height: 1080 }, // Fix 79
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
    layers: initialLayerState, // Fix 80
    dimensions: { width: 1920, height: 1080 }, // Fix 80
    editState: {
        ...initialEditState,
        adjustments: { ...initialAdjustmentState, brightness: 100, contrast: 100, saturation: 100 },
        grading: { ...initialGradingState, grayscale: 10, sepia: 0, invert: 0 },
        selectedFilter: "",
    },
    // ...
};

// ... (rest of file)

// Assuming fetchCommunityTemplates is defined here
export const fetchCommunityTemplates = async (): Promise<CommunityTemplate[]> => {
    // Stub implementation
    return [
        { id: 't1', name: 'Template 1', description: 'A high contrast template.', previewUrl: '', data: template1 },
        { id: 't2', name: 'Template 2', description: 'A grayscale template.', previewUrl: '', data: template2 },
    ];
};

export { fetchCommunityTemplates }; // Fix 81