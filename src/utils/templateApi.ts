import type { CommunityTemplate } from "../types/template"; // FIXED: Relative path
import { v4 as uuidv4 } from "uuid";

const mockTemplates: CommunityTemplate[] = [
  {
    id: uuidv4(),
    name: "Minimalist Poster",
    description: "A clean, modern poster design template with bold typography and simple shapes.",
    previewUrl: "https://images.unsplash.com/photo-1518655048521-f130df041f66?w=400&q=80",
    data: {
      editState: {
        adjustments: { brightness: 100, contrast: 100, saturation: 100 },
        selectedFilter: "",
      },
      layers: [
        {
          id: uuidv4(),
          type: "image",
          name: "Background",
          visible: true,
          opacity: 100,
          blendMode: 'normal',
        },
        {
          id: uuidv4(),
          type: "vector-shape",
          name: "Accent Circle",
          visible: true,
          x: 80,
          y: 20,
          width: 30,
          height: 30,
          rotation: 0,
          opacity: 80,
          blendMode: 'normal',
          shapeType: 'circle',
          fillColor: "#EF4444",
          strokeColor: "none",
          strokeWidth: 0,
        },
        {
          id: uuidv4(),
          type: "text",
          name: "Headline",
          visible: true,
          content: "DESIGN",
          x: 50,
          y: 40,
          fontSize: 120,
          color: "#000000",
          fontFamily: "Montserrat",
          opacity: 100,
          blendMode: 'normal',
          fontWeight: "bold",
          textAlign: "center",
          letterSpacing: 5,
        },
        {
          id: uuidv4(),
          type: "text",
          name: "Subtext",
          visible: true,
          content: "Keep it simple.",
          x: 50,
          y: 65,
          fontSize: 32,
          color: "#000000",
          fontFamily: "Lato",
          opacity: 100,
          blendMode: 'normal',
          fontWeight: "normal",
          textAlign: "center",
        },
      ],
      dimensions: { width: 1080, height: 1350 }, // 4:5 aspect ratio
    },
  },
  {
    id: uuidv4(),
    name: "Cinematic Photo Edit",
    description: "A dark, high-contrast look with a cool color grade and subtle vignette effect.",
    previewUrl: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400&q=80",
    data: {
      editState: {
        adjustments: { brightness: 90, contrast: 120, saturation: 110 },
        effects: { blur: 0, hueShift: -10, vignette: 30, noise: 5, sharpen: 0, clarity: 0 },
        grading: { grayscale: 0, sepia: 0, invert: 0 },
        selectedFilter: "contrast(1.2) saturate(1.1) brightness(0.9)",
        frame: { type: 'solid', width: 15, color: '#000000' },
      },
      layers: [
        {
          id: uuidv4(),
          type: "image",
          name: "Background",
          visible: true,
          opacity: 100,
          blendMode: 'normal',
        },
      ],
      dimensions: { width: 1920, height: 1080 }, // 16:9 aspect ratio
    },
  },
  {
    id: uuidv4(),
    name: "Social Media Quote",
    description: "Bold text overlay on a blurred background image, perfect for Instagram stories.",
    previewUrl: "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=400&q=80",
    data: {
      editState: {
        adjustments: { brightness: 100, contrast: 100, saturation: 100 },
        effects: { blur: 10, hueShift: 0, vignette: 0, noise: 0, sharpen: 0, clarity: 0 },
        selectedFilter: "",
      },
      layers: [
        {
          id: uuidv4(),
          type: "image",
          name: "Background",
          visible: true,
          opacity: 100,
          blendMode: 'normal',
        },
        {
          id: uuidv4(),
          type: "text",
          name: "Quote Text",
          visible: true,
          content: "The best view comes after the hardest climb.",
          x: 50,
          y: 50,
          fontSize: 64,
          color: "#FFFFFF",
          fontFamily: "Playfair Display",
          opacity: 100,
          blendMode: 'normal',
          fontWeight: "bold",
          textAlign: "center",
          textShadow: { color: 'rgba(0,0,0,0.8)', blur: 10, offsetX: 2, offsetY: 2 },
        },
      ],
      dimensions: { width: 1080, height: 1920 }, // 9:16 aspect ratio
    },
  },
  {
    id: uuidv4(),
    name: "Vintage Sepia Look",
    description: "A classic, warm sepia tone with soft contrast for a nostalgic feel.",
    previewUrl: "https://images.unsplash.com/photo-1542228263-4d5345cf082f?w=400&q=80",
    data: {
      editState: {
        adjustments: { brightness: 110, contrast: 90, saturation: 100 },
        effects: { blur: 0, hueShift: 0, vignette: 0, noise: 0, sharpen: 0, clarity: 0 },
        grading: { grayscale: 0, sepia: 50, invert: 0 },
        selectedFilter: "sepia(0.6) contrast(0.9) brightness(1.1) saturate(1.2)",
      },
      layers: [
        {
          id: uuidv4(),
          type: "image",
          name: "Background",
          visible: true,
          opacity: 100,
          blendMode: 'normal',
        },
      ],
      dimensions: { width: 1200, height: 800 },
    },
  },
];

export const fetchCommunityTemplates = async (): Promise<CommunityTemplate[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockTemplates;
};