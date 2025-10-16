import type { EditState, Layer } from "@/hooks/useEditorState";

export interface CommunityTemplate {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  data: {
    editState: Partial<EditState>;
    layers: Layer[];
    dimensions: { width: number; height: number };
  };
}

// Simplified structure for template data to be loaded into the editor
export interface TemplateData {
  editState: Partial<EditState>;
  layers: Layer[];
  dimensions: { width: number; height: number };
}