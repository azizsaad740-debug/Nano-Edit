import type { CommunityTemplate, TemplateProjectData } from "../types/template";
import { initialEditState, initialLayerState, initialCurvesState, initialSelectionSettings, ImageLayerData, initialAdjustmentState, initialGradingState } from "@/types/editor";

// Mock Template Data (using corrected luminosity property)
const template1: TemplateProjectData = {
    layers: initialLayerState,
    dimensions: { width: 1920, height: 1080 },
    editState: {
        ...initialEditState,
        adjustments: { ...initialAdjustmentState, brightness: 100, contrast: 110, saturation: 120 },
        effects: { ...initialEditState.effects, blur: 0, hueShift: 0, vignette: 0, noise: 0, sharpen: 0, clarity: 0 },
        grading: { ...initialGradingState, grayscale: 0, sepia: 0, invert: 0 },
        selectedFilter: "contrast(1.2) saturate(1.1) brightness(0.9)",
    },
};

const template2: TemplateProjectData = {
    layers: initialLayerState,
    dimensions: { width: 1920, height: 1080 },
    editState: {
        ...initialEditState,
        adjustments: { ...initialAdjustmentState, brightness: 100, contrast: 100, saturation: 100 },
        grading: { ...initialGradingState, grayscale: 10, sepia: 0, invert: 0 },
        selectedFilter: "",
    },
};

// Assuming fetchCommunityTemplates is defined here
export const fetchCommunityTemplates = async (): Promise<CommunityTemplate[]> => {
    // Stub implementation
    return [
        { id: 't1', name: 'Social Media Post', description: 'A high contrast template for Instagram.', previewUrl: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=800&q=80', data: template1 },
        { id: 't2', name: 'Print Flyer', description: 'A grayscale template for print media.', previewUrl: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800&q=80', data: template2 },
        { id: 't3', name: 'Web Banner Ad', description: 'Modern design for web advertising.', previewUrl: 'https://images.unsplash.com/photo-1542228263-4d5345cf082f?w=800&q=80', data: template1 },
        { id: 't4', name: 'E-commerce Product Shot', description: 'Clean layout for product display.', previewUrl: 'https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=800&q=80', data: template2 },
    ];
};