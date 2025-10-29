import type { CommunityTemplate, TemplateProjectData } from "../types/template";
import { initialEditState, initialLayerState, initialCurvesState, initialSelectionSettings } from "@/types/editor";

const mockTemplateData: TemplateProjectData = {
  dimensions: { width: 1920, height: 1080 },
  layers: [
    {
      ...initialLayerState[0],
      dataUrl: "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=1920&q=80",
    },
    {
      id: 'text-1',
      name: 'Headline Text',
      type: 'text',
      visible: true,
      content: 'NANO EDIT',
      x: 50,
      y: 30,
      fontSize: 120,
      color: '#FFFFFF',
      fontFamily: 'Montserrat',
      opacity: 100,
      blendMode: 'normal',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      rotation: 0,
      letterSpacing: 5,
      lineHeight: 1.2,
      isLocked: false,
    },
  ],
  editState: {
    ...initialEditState,
    adjustments: { brightness: 100, contrast: 110, saturation: 120 },
    effects: { blur: 0, hueShift: 0, vignette: 0, noise: 0, sharpen: 0, clarity: 0 },
    grading: { grayscale: 0, sepia: 0, invert: 0 },
    selectedFilter: "contrast(1.2) saturate(1.1) brightness(0.9)",
    frame: { type: 'border', width: 15, color: '#000000' },
  },
};

const mockTemplates: CommunityTemplate[] = [
  {
    id: "t1",
    name: "Cinematic Poster",
    description: "High contrast, saturated look with bold typography.",
    previewUrl: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800&q=80",
    data: mockTemplateData,
  },
  {
    id: "t2",
    name: "Minimalist Card",
    description: "Clean design with subtle color grading and simple shapes.",
    previewUrl: "https://images.unsplash.com/photo-1542228263-4d5345cf082f?w=800&q=80",
    data: {
      dimensions: { width: 1080, height: 1080 },
      layers: [
        {
          ...initialLayerState[0],
          dataUrl: "https://images.unsplash.com/photo-1542228263-4d5345cf082f?w=1080&q=80",
        },
        {
          id: 'shape-1',
          name: 'Circle Accent',
          type: 'vector-shape',
          visible: true,
          x: 80,
          y: 20,
          width: 30,
          height: 30,
          rotation: 0,
          opacity: 80,
          blendMode: 'multiply',
          shapeType: 'circle',
          fillColor: '#FFD700',
          strokeColor: '#FFFFFF',
          strokeWidth: 5,
          isLocked: false,
        },
      ],
      editState: {
        ...initialEditState,
        adjustments: { brightness: 100, contrast: 100, saturation: 100 },
        grading: { grayscale: 10, sepia: 0, invert: 0 },
        selectedFilter: "",
      },
    },
  },
];

export const fetchCommunityTemplates = async (): Promise<CommunityTemplate[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockTemplates;
};