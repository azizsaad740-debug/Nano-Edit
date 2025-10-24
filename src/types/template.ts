import type { EditState, Layer } from "@/hooks/useEditorState";

export interface TemplateProjectData {
  editState: Partial<EditState>;
  layers: Layer[];
  dimensions: { width: number; height: number };
}

export interface CommunityTemplate {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  data: TemplateProjectData;
}

// Simplified structure for template data to be loaded into the editor
export interface TemplateData extends CommunityTemplate {}