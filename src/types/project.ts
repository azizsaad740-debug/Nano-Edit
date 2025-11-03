import type { Layer } from "./layer";
import type { EditState } from "./edit-state";

export interface TemplateProjectData {
    name: string;
    layers: Layer[];
    editState: EditState;
    // Add other properties as needed by the application
}