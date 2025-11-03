// src/types/editor/template.ts

import type { Layer, Dimensions, EditState } from "./core";

export interface TemplateProjectData {
    layers: Layer[];
    dimensions: Dimensions;
    editState: Partial<EditState>;
}

export interface CommunityTemplate {
    id: string;
    name: string;
    description: string;
    previewUrl: string;
    data: TemplateProjectData;
}