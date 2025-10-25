import React, { useState, useRef, useCallback } from "react";
import { type Crop } from "react-image-crop";
import { useHotkeys } from "react-hotkeys-hook";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { downloadImage, copyImageToClipboard } from "@/utils/imageUtils";
import ExifReader from "exifreader";
import type { Preset } from "./usePresets";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import type { NewProjectSettings } from "@/components/editor/NewProjectDialog";
import { saveProjectToFile, loadProjectFromFile } from "@/utils/projectUtils";
import { readPsd } from "ag-psd";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils";
import { useLayers } from "./useLayers";
import { maskToPolygon } from "@/utils/maskToPolygon";
import { polygonToMaskDataUrl } from "@/utils/maskUtils";
import type { TemplateData } from "../types/template";
import { useSettings } from "./useSettings";

export interface HslAdjustment {
  hue: number;
  saturation: number;
  luminance: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface TextShadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface TextStroke {
  color: string;
  width: number;
}

export interface BrushState {
  size: number;
  opacity: number;
  hardness: number;
  smoothness: number;
  shape: 'circle' | 'square';
}

export interface GradientToolState {
  type: 'linear' | 'radial';
  colors: string[];
  stops: number[]; // 0 to 1
  angle: number; // 0 to 360 (for linear)
  centerX: number; // 0 to 100 (for radial)
  centerY: number; // 0 to 100 (for radial)
  radius: number; // 0 to 100 (for radial)
  feather: number; // 0 to 100
  inverted: boolean;
}

export interface AdjustmentLayerData {
  type: 'brightness' | 'curves' | 'hsl' | 'grading';
  adjustments?: { brightness: number; contrast: number; saturation: number };
  grading?: { grayscale: number; sepia: number; invert: number };
  hslAdjustments?: { [key in HslColorKey]: HslAdjustment };
  curves?: { [key in keyof EditState['curves']]: Point[] };
}

export interface Layer {
  id: string;
  type: 'image' | 'text' | 'drawing' | 'smart-object' | 'vector-shape' | 'group' | 'gradient' | 'adjustment';
  name: string;
  visible: boolean;
  opacity: number; // 0-100
  blendMode: string; // CSS blend mode string
  isClippingMask?: boolean; // If true, clips the layer below it
  isLocked?: boolean; // If true, layer cannot be moved/edited/deleted
  maskDataUrl?: string; // Data URL of the layer mask (white=visible, black=hidden)
  
  // Transform properties (used by all movable layers except 'image' and 'drawing')
  x?: number; // Center X position (0-100%)
  y?: number; // Center Y position (0-100%)
  width?: number; // Width (0-100%)
  height?: number; // Height (0-100%)
  rotation?: number; // Rotation in degrees

  // Type-specific properties
  dataUrl?: string; // For 'image' and 'drawing'
  content?: string; // For 'text'
  fontSize?: number; // For 'text'
  color?: string; // For 'text'
  fontFamily?: string; // For 'text'
  fontWeight?: string; // For 'text'
  fontStyle?: string; // For 'text'
  textAlign?: 'left' | 'center' | 'right'; // For 'text'
  letterSpacing?: number; // For 'text'
  lineHeight?: number; // For 'text' multiplier
  textShadow?: TextShadow; // For 'text'
  stroke?: TextStroke; // For 'text'
  backgroundColor?: string; // For 'text' background
  padding?: number; // For 'text' background padding

  shapeType?: 'rect' | 'circle' | 'triangle' | 'polygon'; // For 'vector-shape'
  fillColor?: string; // For 'vector-shape'
  strokeColor?: string; // For 'vector-shape'
  strokeWidth?: number; // For 'vector-shape'
  borderRadius?: number; // For 'vector-shape' (0-50%)
  points?: Point[]; // For 'vector-shape' polygon/triangle points (0-100%)

  smartObjectData?: {
    layers: Layer[];
    width: number; // Internal canvas width in pixels
    height: number; // Internal canvas height in pixels
  }; // For 'smart-object'

  children?: Layer[]; // For 'group'
  expanded?: boolean; // For 'group'

  gradientType?: 'linear' | 'radial'; // For 'gradient'
  gradientColors?: string[]; // For 'gradient'
  gradientStops?: number[]; // For 'gradient' (0-1)
  gradientAngle?: number; // For 'gradient' (0-360)
  gradientFeather?: number; // For 'gradient' (0-100)
  gradientInverted?: boolean; // For 'gradient'
  gradientCenterX?: number; // For 'gradient' (0-100)
  gradientCenterY?: number; // For 'gradient' (0-100)
  gradientRadius?: number; // For 'gradient' (0-100)

  adjustmentData?: AdjustmentLayerData; // For 'adjustment'
}

export type ActiveTool = "lasso" | "brush" | "text" | "crop" | "eraser" | "eyedropper" | "shape" | "move" | "gradient" | "selectionBrush" | "blurBrush";
export type HslColorKey = 'global' | 'red' | 'orange' | 'yellow' | 'green' | 'aqua' | 'blue' | 'purple' | 'magenta';

export interface EditState {
  adjustments: {
    brightness: number; // 0-200
    contrast: number; // 0-200
    saturation: number; // 0-200
  };
  effects: {
    blur: number; // 0-20 (px)
    hueShift: number; // -180 to 180 (deg)
    vignette: number; // 0-100 (%)
    noise: number; // 0-100 (%)
    sharpen: number; // 0-100 (%)
    clarity: number; // 0-100 (%)
  };
  grading: {
    grayscale: number; // 0-100
    sepia: number; // 0-100
    invert: number; // 0-100
  };
  hslAdjustments: { [key in HslColorKey]: HslAdjustment };
  curves: { [key in 'all' | 'r' | 'g' | 'b']: Point[] };
  channels: {
    r: boolean;
    g: boolean;
    b: boolean;
  };
  selectedFilter: string; // CSS filter string
  transforms: {
    rotation: number; // -180 to 180
    scaleX: 1 | -1;
    scaleY: 1 | -1;
  };
  crop: Crop | undefined;
  frame: {
    type: 'none' | 'solid';
    width: number; // px
    color: string;
  };
  selectiveBlurMask: string | null; // Data URL of the mask (white=blur, black=clear)
  selectiveBlurAmount: number; // 0-100
  colorMode: 'RGB' | 'CMYK' | 'Grayscale';
}

export interface HistoryItem {
  name: string;
  state: EditState;
  layers: Layer[];
}

export const initialCurvesState: EditState['curves'] = {
  all: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  r: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  g: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  b: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
};

export const initialHslAdjustment: HslAdjustment = { hue: 0, saturation: 100, luminance: 0 };

export const initialEditState: EditState = {
  adjustments: { brightness: 100, contrast: 100, saturation: 100 },
  effects: { blur: 0, hueShift: 0, vignette: 0, noise: 0, sharpen: 0, clarity: 0 },
  grading: { grayscale: 0, sepia: 0, invert: 0 },
  hslAdjustments: {
    global: { ...initialHslAdjustment },
    red: { ...initialHslAdjustment },
    orange: { ...initialHslAdjustment },
    yellow: { ...initialHslAdjustment },
    green: { ...initialHslAdjustment },
    aqua: { ...initialHslAdjustment },
    blue: { ...initialHslAdjustment },
    purple: { ...initialHslAdjustment },
    magenta: { ...initialHslAdjustment },
  },
  curves: initialCurvesState,
  channels: { r: true, g: true, b: true },
  selectedFilter: "",
  transforms: { rotation: 0, scaleX: 1, scaleY: 1 },
  crop: undefined,
  frame: { type: 'none', width: 0, color: '#000000' },
  selectiveBlurMask: null,
  selectiveBlurAmount: 50,
  colorMode: 'RGB',
};

export const initialLayerState: Layer[] = [
  {
    id: 'background',
    type: 'image',
    name: 'Background',
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    dataUrl: '',
    isLocked: true,
  }
];

export const initialHistoryItem: HistoryItem = {
  name: "Initial State",
  state: initialEditState,
  layers: initialLayerState,
};

export const initialBrushState: BrushState = {
  size: 20,
  opacity: 100,
  hardness: 50,
  smoothness: 50,
  shape: 'circle',
};

export const initialGradientToolState: GradientToolState = {
  type: 'linear',
  colors: ["#FFFFFF", "#000000"],
  stops: [0, 1],
  angle: 90,
  centerX: 50,
  centerY: 50,
  radius: 50,
  feather: 0,
  inverted: false,
};

export const useEditorState = (
  initialProject: {
    image: string | null;
    dimensions: { width: number; height: number } | null;
    fileInfo: { name: string; size: number } | null;
    exifData: any | null;
    history: HistoryItem[];
    currentHistoryIndex: number;
    layers: Layer[];
    selectedLayerId: string | null;
    aspect: number | undefined;
    pendingCrop: Crop | undefined;
    selectionPath: Point[] | null;
    selectionMaskDataUrl: string | null;
    foregroundColor: string;
    backgroundColor: string;
    gradientToolState: GradientToolState;
    brushStateInternal: Omit<BrushState, 'color'>;
    selectedShapeType: Layer['shapeType'] | null;
    activeTool: ActiveTool | null;
    selectiveBlurAmount: number; // Added to initialProject type
  },
  onProjectUpdate: (updates: Partial<typeof initialProject>) => void,
  onHistoryUpdate: (history: HistoryItem[], currentHistoryIndex: number, layers: Layer[]) => void,
  onLayerUpdate: (layers: Layer[], historyName?: string) => void,
  image: string | null,
  dimensions: { width: number; height: number } | null,
  fileInfo: { name: string; size: number } | null,
  exifData: any | null,
  imgRef: React.RefObject<HTMLImageElement>,
) => {
  const { stabilityApiKey } = useSettings();

  const [currentState, setCurrentState] = useState<EditState>(initialProject.history[initialProject.currentHistoryIndex].state);
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(initialProject.activeTool);
  const [brushStateInternal, setBrushStateInternal] = useState<Omit<BrushState, 'color'>>(initialProject.brushStateInternal);
  const [foregroundColor, setForegroundColor] = useState(initialProject.foregroundColor);
  const [backgroundColor, setBackgroundColor] = useState(initialProject.backgroundColor);
  const [gradientToolState, setGradientToolState] = useState<GradientToolState>(initialProject.gradientToolState);
  const [selectedShapeType, setSelectedShapeType] = useState<Layer['shapeType'] | null>(initialProject.selectedShapeType);

  // Sync local state when project changes
  React.useEffect(() => {
    setCurrentState(initialProject.history[initialProject.currentHistoryIndex].state);
    setActiveTool(initialProject.activeTool);
    setBrushStateInternal(initialProject.brushStateInternal);
    setForegroundColor(initialProject.foregroundColor);
    setBackgroundColor(initialProject.backgroundColor);
    setGradientToolState(initialProject.gradientToolState);
    setSelectedShapeType(initialProject.selectedShapeType);
  }, [initialProject]);

  // Sync project state when local state changes
  React.useEffect(() => {
    onProjectUpdate({
      activeTool,
      brushStateInternal,
      foregroundColor,
      backgroundColor,
      gradientToolState,
      selectedShapeType,
    });
  }, [activeTool, brushStateInternal, foregroundColor, backgroundColor, gradientToolState, selectedShapeType, onProjectUpdate]);

  const recordHistory = useCallback((name: string, state: EditState, layers: Layer[]) => {
    const newHistory = initialProject.history.slice(0, initialProject.currentHistoryIndex + 1);
    const newHistoryIndex = newHistory.length;
    const newHistoryItem = { name, state, layers };
    onHistoryUpdate([...newHistory, newHistoryItem], newHistoryIndex, layers);
  }, [initialProject.history, initialProject.currentHistoryIndex, onHistoryUpdate]);

  const updateCurrentState = useCallback((updates: Partial<EditState>) => {
    setCurrentState(prev => ({ ...prev, ...updates }));
  }, []);

  const commitStateChange = useCallback((name: string, updates?: Partial<EditState>) => {
    const newState = updates ? { ...currentState, ...updates } : currentState;
    recordHistory(name, newState, initialProject.layers);
    setCurrentState(newState);
  }, [currentState, initialProject.layers, recordHistory]);

  // --- Layer Management Hook ---
  const {
    layers,
    selectedLayerId,
    setSelectedLayerId: setLayerId,
    handleAddTextLayer: addTextLayer,
    handleAddDrawingLayer: addDrawingLayer,
    handleAddLayerFromBackground: addLayerFromBackground, // NEW
    handleAddShapeLayer: addShapeLayer,
    handleAddGradientLayer: addGradientLayer,
    addAdjustmentLayer,
    handleToggleVisibility: toggleLayerVisibility,
    renameLayer,
    handleDeleteLayer: deleteLayer,
    handleDeleteHiddenLayers: deleteHiddenLayers, // NEW
    handleDuplicateLayer: duplicateLayer,
    handleMergeLayerDown: mergeLayerDown,
    handleRasterizeLayer: rasterizeLayer,
    handleRasterizeSmartObject: rasterizeSmartObject, // NEW
    handleConvertSmartObjectToLayers: convertSmartObjectToLayers, // NEW
    handleExportSmartObjectContents: exportSmartObjectContents, // NEW
    handleArrangeLayer: arrangeLayer, // NEW
    updateLayer,
    commitLayerChange,
    handleLayerPropertyCommit,
    handleLayerOpacityChange,
    handleLayerOpacityCommit,
    reorderLayers,
    createSmartObject,
    openSmartObjectEditor,
    closeSmartObjectEditor,
    saveSmartObjectChanges,
    isSmartObjectEditorOpen,
    smartObjectEditingId,
    moveSelectedLayer,
    groupLayers,
    toggleGroupExpanded,
    handleDrawingStrokeEnd,
    removeLayerMask,
    invertLayerMask,
    toggleClippingMask,
    toggleLayerLock,
    canUndo: canUndoLayers,
    canRedo: canRedoLayers,
  } = useLayers({
    currentEditState: currentState,
    recordHistory,
    updateCurrentState,
    imgRef,
    imageNaturalDimensions: dimensions,
    gradientToolState,
    activeTool,
    layers: initialProject.layers,
    setLayers: onLayerUpdate,
    selectedLayerId: initialProject.selectedLayerId,
    setSelectedLayerId: (id) => onProjectUpdate({ selectedLayerId: id }),
    history: initialProject.history,
    currentHistoryIndex: initialProject.currentHistoryIndex,
    foregroundColor,
    backgroundColor,
    selectedShapeType,
  });

  // --- History & Undo/Redo ---
  const handleUndo = useCallback(() => {
    if (initialProject.currentHistoryIndex > 0) {
      const newIndex = initialProject.currentHistoryIndex - 1;
      const { state, layers } = initialProject.history[newIndex];
      onHistoryUpdate(initialProject.history, newIndex, layers);
      setCurrentState(state);
      onProjectUpdate({ selectedLayerId: null });
      showSuccess(`Undo: ${initialProject.history[newIndex + 1].name}`);
    }
  }, [initialProject.history, initialProject.currentHistoryIndex, onHistoryUpdate, onProjectUpdate]);

  const handleRedo = useCallback(() => {
    if (initialProject.currentHistoryIndex < initialProject.history.length - 1) {
      const newIndex = initialProject.currentHistoryIndex + 1;
      const { state, layers } = initialProject.history[newIndex];
      onHistoryUpdate(initialProject.history, newIndex, layers);
      setCurrentState(state);
      onProjectUpdate({ selectedLayerId: null });
      showSuccess(`Redo: ${initialProject.history[newIndex].name}`);
    }
  }, [initialProject.history, initialProject.currentHistoryIndex, onHistoryUpdate, onProjectUpdate]);

  const jumpToHistory = useCallback((index: number) => {
    if (index >= 0 && index < initialProject.history.length) {
      const { state, layers } = initialProject.history[index];
      onHistoryUpdate(initialProject.history, index, layers);
      setCurrentState(state);
      onProjectUpdate({ selectedLayerId: null });
      showSuccess(`Jumped to: ${initialProject.history[index].name}`);
    }
  }, [initialProject.history, onHistoryUpdate, onProjectUpdate]);

  // --- File & Image Loading ---
  const loadImageData = useCallback((dataUrl: string, name: string, size: number, isImport: boolean) => {
    const img = new Image();
    img.onload = () => {
      const newDimensions = { width: img.naturalWidth, height: img.naturalHeight };
      const newFileInfo = { name, size };
      
      ExifReader.load(dataUrl).then(exif => {
        const newExif = exif;

        const newLayer: Layer = {
          id: uuidv4(),
          type: 'image',
          name: name,
          visible: true,
          opacity: 100,
          blendMode: 'normal',
          dataUrl: dataUrl,
          isLocked: true,
        };

        let newLayers: Layer[];
        let historyName: string;

        if (isImport) {
          // Import: Add as a new layer above the background
          newLayers = [...initialProject.layers, newLayer];
          historyName = `Import Image: ${name}`;
        } else {
          // New Image: Replace the background layer
          newLayers = initialProject.layers.map(l => l.id === 'background' ? newLayer : l);
          historyName = `Load Image: ${name}`;
        }

        onProjectUpdate({
          image: dataUrl,
          dimensions: newDimensions,
          fileInfo: newFileInfo,
          exifData: newExif,
          aspect: newDimensions.width / newDimensions.height,
          pendingCrop: undefined,
          selectionPath: null,
          selectionMaskDataUrl: null,
        });
        recordHistory(historyName, initialEditState, newLayers);
        showSuccess(`Image "${name}" loaded.`);
      }).catch(err => {
        console.error("Error reading EXIF:", err);
        showError("Failed to read EXIF data.");
      });
    };
    img.onerror = () => showError("Failed to load image data.");
    img.src = dataUrl;
  }, [initialProject.layers, onProjectUpdate, recordHistory]);

  const handleFileSelect = useCallback((file: File | undefined, isImport: boolean = false) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (file.name.toLowerCase().endsWith('.psd') || file.name.toLowerCase().endsWith('.psb')) {
        // Handle PSD/PSB files (stub)
        const toastId = showLoading("Reading PSD file (stub)...");
        try {
          const buffer = new Uint8Array(dataUrl.split(',')[1].length);
          // Stub: In a real app, you'd parse the PSD buffer here.
          // For now, we just acknowledge the file and load the base image.
          
          // Fallback to loading the base image data URL
          loadImageData(dataUrl, file.name, file.size, isImport);
          dismissToast(toastId);
        } catch (error) {
          dismissToast(toastId);
          showError("Failed to read PSD file (stub).");
        }
      } else {
        loadImageData(dataUrl, file.name, file.size, isImport);
      }
    };
    reader.onerror = () => showError("Failed to read file.");
    reader.readAsDataURL(file);
  }, [loadImageData]);

  const handleUrlImageLoad = useCallback((url: string, isImport: boolean = false) => {
    const toastId = showLoading("Loading image from URL...");
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const file = new File([blob], url.substring(url.lastIndexOf('/') + 1) || 'url-image.jpg', { type: blob.type });
        const reader = new FileReader();
        reader.onload = (e) => {
          dismissToast(toastId);
          loadImageData(e.target?.result as string, file.name, file.size, isImport);
        };
        reader.readAsDataURL(file);
      })
      .catch(err => {
        dismissToast(toastId);
        console.error(err);
        showError("Failed to load image from URL.");
      });
  }, [loadImageData]);

  const handleGeneratedImageLoad = useCallback((url: string) => {
    // Generated images are always loaded into a new project/tab, so isImport is false
    const name = "Generated Image";
    const size = 0; // Size is unknown for generated images
    loadImageData(url, name, size, false);
  }, [loadImageData]);

  const handleNewProject = useCallback((settings: NewProjectSettings) => {
    const { width, height, backgroundColor } = settings;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    const dataUrl = canvas.toDataURL();

    loadImageData(dataUrl, "New Project", 0, false);
  }, [loadImageData]);

  const handleNewFromClipboard = useCallback(async (importInSameProject: boolean) => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        if (item.types.includes('image/png')) {
          const blob = await item.getType('image/png');
          const file = new File([blob], 'pasted-image.png', { type: 'image/png' });
          handleFileSelect(file, importInSameProject);
          return;
        }
      }
      showError("No image found in clipboard.");
    } catch (err) {
      console.error("Failed to read clipboard contents:", err);
      showError("Failed to read clipboard. Ensure you have granted clipboard permissions.");
    }
  }, [handleFileSelect]);

  const handleSaveProject = useCallback(() => {
    if (!image || !dimensions || !fileInfo) {
      showError("No image loaded to save.");
      return;
    }
    
    const projectState = {
      sourceImage: image,
      history: initialProject.history,
      currentHistoryIndex: initialProject.currentHistoryIndex,
      fileInfo: fileInfo,
    };
    saveProjectToFile(projectState);
  }, [image, dimensions, fileInfo, initialProject.history, initialProject.currentHistoryIndex]);

  const handleLoadProject = useCallback((file: File) => {
    const toastId = showLoading("Loading project...");
    loadProjectFromFile(file)
      .then(projectData => {
        // 1. Load image data
        if (projectData.sourceImage) {
          loadImageData(projectData.sourceImage, projectData.fileInfo?.name || 'Loaded Project', projectData.fileInfo?.size || 0, false);
        }
        
        // 2. Restore history and state
        onProjectUpdate({
          history: projectData.history,
          currentHistoryIndex: projectData.currentHistoryIndex,
          layers: projectData.history[projectData.currentHistoryIndex].layers,
          selectedLayerId: null,
        });
        setCurrentState(projectData.history[projectData.currentHistoryIndex].state);
        
        dismissToast(toastId);
        showSuccess(`Project "${projectData.fileInfo?.name || 'Untitled'}" loaded.`);
      })
      .catch(error => {
        dismissToast(toastId);
        showError(error.message || "Failed to load project file.");
      });
  }, [loadImageData, onProjectUpdate]);

  const loadTemplateData = useCallback((template: TemplateData) => {
    const toastId = showLoading(`Applying template "${template.name}"...`);
    
    // 1. Load the preview image as the background layer
    fetch(template.previewUrl)
      .then(response => response.blob())
      .then(blob => {
        const file = new File([blob], `${template.name}-bg.jpg`, { type: blob.type });
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          
          // 2. Set up initial project state based on template dimensions
          const newDimensions = template.data.dimensions;
          const newFileInfo = { name: file.name, size: file.size };
          
          const backgroundLayer: Layer = {
            id: 'background',
            type: 'image',
            name: 'Background',
            visible: true,
            opacity: 100,
            blendMode: 'normal',
            dataUrl: dataUrl,
            isLocked: true,
          };
          
          // 3. Combine template layers with the new background layer
          const templateLayers = template.data.layers.filter(l => l.type !== 'image');
          const newLayers = [backgroundLayer, ...templateLayers];
          
          // 4. Create the initial state from template editState
          const newEditState = { ...initialEditState, ...template.data.editState };
          
          // 5. Update project state and history
          onProjectUpdate({
            image: dataUrl,
            dimensions: newDimensions,
            fileInfo: newFileInfo,
            exifData: null,
            aspect: newDimensions.width / newDimensions.height,
            pendingCrop: undefined,
            selectionPath: null,
            selectionMaskDataUrl: null,
          });
          recordHistory(`Apply Template: ${template.name}`, newEditState, newLayers);
          setCurrentState(newEditState);
          
          dismissToast(toastId);
          showSuccess(`Template "${template.name}" applied successfully.`);
        };
        reader.readAsDataURL(file);
      })
      .catch(err => {
        dismissToast(toastId);
        console.error(err);
        showError("Failed to load template image data.");
      });
  }, [onProjectUpdate, recordHistory]);

  // --- Edit State Handlers ---
  const handleAdjustmentChange = (key: string, value: number) => {
    updateCurrentState({ adjustments: { ...currentState.adjustments, [key]: value } });
  };
  const handleAdjustmentCommit = (key: string, value: number) => {
    commitStateChange(`Adjust ${key}`, { adjustments: { ...currentState.adjustments, [key]: value } });
  };

  const handleEffectChange = (key: string, value: number) => {
    updateCurrentState({ effects: { ...currentState.effects, [key]: value } });
  };
  const handleEffectCommit = (key: string, value: number) => {
    commitStateChange(`Adjust Effect ${key}`, { effects: { ...currentState.effects, [key]: value } });
  };

  const handleGradingChange = (key: string, value: number) => {
    updateCurrentState({ grading: { ...currentState.grading, [key]: value } });
  };
  const handleGradingCommit = (key: string, value: number) => {
    commitStateChange(`Adjust Grading ${key}`, { grading: { ...currentState.grading, [key]: value } });
  };

  const handleHslAdjustmentChange = (color: HslColorKey, key: keyof HslAdjustment, value: number) => {
    const newHsl = { 
      ...currentState.hslAdjustments, 
      [color]: { ...currentState.hslAdjustments[color], [key]: value } 
    };
    updateCurrentState({ hslAdjustments: newHsl });
  };

  const handleHslAdjustmentCommit = (color: HslColorKey, key: keyof HslAdjustment, value: number) => {
    const newHsl = { 
      ...currentState.hslAdjustments, 
      [color]: { ...currentState.hslAdjustments[color], [key]: value } 
    };
    commitStateChange(`Adjust HSL ${color}/${key}`, { hslAdjustments: newHsl });
  };

  const handleChannelChange = (channel: 'r' | 'g' | 'b', value: boolean) => {
    const newChannels = { ...currentState.channels, [channel]: value };
    commitStateChange(`Toggle Channel ${channel.toUpperCase()}`, { channels: newChannels });
  };

  const handleCurvesChange = (channel: keyof EditState['curves'], points: Point[]) => {
    updateCurrentState({ curves: { ...currentState.curves, [channel]: points } });
  };
  const handleCurvesCommit = (channel: keyof EditState['curves'], points: Point[]) => {
    commitStateChange(`Adjust Curves ${channel.toUpperCase()}`, { curves: { ...currentState.curves, [channel]: points } });
  };

  const handleFilterChange = (filterValue: string, filterName: string) => {
    commitStateChange(`Apply Filter: ${filterName}`, { selectedFilter: filterValue });
  };

  const handleTransformChange = (transformType: string) => {
    let newTransforms = { ...currentState.transforms };
    let name = "";

    switch (transformType) {
      case "rotate-left":
        newTransforms.rotation = (newTransforms.rotation - 90) % 360;
        name = "Rotate Left";
        break;
      case "rotate-right":
        newTransforms.rotation = (newTransforms.rotation + 90) % 360;
        name = "Rotate Right";
        break;
      case "flip-horizontal":
        newTransforms.scaleX *= -1;
        name = "Flip Horizontal";
        break;
      case "flip-vertical":
        newTransforms.scaleY *= -1;
        name = "Flip Vertical";
        break;
    }
    commitStateChange(name, { transforms: newTransforms });
  };

  const handleRotationChange = (value: number) => {
    updateCurrentState({ transforms: { ...currentState.transforms, rotation: value } });
  };
  const handleRotationCommit = (value: number) => {
    commitStateChange(`Set Rotation to ${value}°`, { transforms: { ...currentState.transforms, rotation: value } });
  };

  const handleFramePresetChange = (type: string, name: string, options?: { width: number; color: string }) => {
    commitStateChange(`Apply Frame: ${name}`, { frame: { type: type as 'none' | 'solid', width: options?.width || 0, color: options?.color || '#000000' } });
  };

  const handleFramePropertyChange = (key: 'width' | 'color', value: any) => {
    updateCurrentState({ frame: { ...currentState.frame, [key]: value } });
  };

  const handleFramePropertyCommit = () => {
    commitStateChange(`Adjust Frame`, { frame: currentState.frame });
  };

  const handleReset = () => {
    commitStateChange("Reset All Edits", initialEditState);
    onProjectUpdate({ pendingCrop: undefined, selectionPath: null, selectionMaskDataUrl: null });
  };

  // --- Crop Handlers ---
  const applyCrop = () => {
    if (initialProject.pendingCrop) {
      commitStateChange("Apply Crop", { crop: initialProject.pendingCrop });
      onProjectUpdate({ pendingCrop: undefined });
      setActiveTool(null);
    }
  };
  const cancelCrop = () => {
    onProjectUpdate({ pendingCrop: undefined });
    setActiveTool(null);
  };

  // --- Preset Handler ---
  const applyPreset = useCallback((preset: Preset) => {
    const newState = { ...currentState, ...preset.state };
    commitStateChange(`Apply Preset: ${preset.name}`, newState);
  }, [currentState, commitStateChange]);

  // --- Clipboard & Download ---
  const getEditedImageOptions = useCallback(() => {
    if (!imgRef.current || !image || !dimensions) return null;
    return {
      image: imgRef.current,
      layers,
      ...currentState,
    };
  }, [imgRef, image, dimensions, layers, currentState]);

  const handleCopy = useCallback(() => {
    const options = getEditedImageOptions();
    if (options) {
      copyImageToClipboard(options);
    } else {
      showError("No image loaded to copy.");
    }
  }, [getEditedImageOptions]);

  const handleDownload = useCallback((exportOptions: { format: string; quality: number; width: number; height: number; upscale: 1 | 2 | 4 }) => {
    const options = getEditedImageOptions();
    if (options) {
      downloadImage(options, exportOptions, stabilityApiKey);
    } else {
      showError("No image loaded to download.");
    }
  }, [getEditedImageOptions, stabilityApiKey]);

  // --- Color Tool Handlers ---
  const handleColorPick = useCallback((color: string) => {
    setForegroundColor(color);
    showSuccess(`Foreground color set to ${color}`);
  }, []);

  const handleForegroundColorChange = useCallback((color: string) => {
    setForegroundColor(color);
  }, []);

  const handleBackgroundColorChange = useCallback((color: string) => {
    setBackgroundColor(color);
  }, []);

  const handleSwapColors = useCallback(() => {
    setForegroundColor(backgroundColor);
    setBackgroundColor(foregroundColor);
  }, [foregroundColor, backgroundColor]);

  // --- Brush State ---
  const brushState: BrushState = {
    ...brushStateInternal,
    // color is handled by foregroundColor in the workspace
  };

  const setBrushState = useCallback((updates: Partial<Omit<BrushState, 'color'>>) => {
    setBrushStateInternal(prev => ({ ...prev, ...updates }));
  }, []);

  // --- Selection & Generative Fill ---
  const setSelectionPath = useCallback((path: Point[] | null) => {
    onProjectUpdate({ selectionPath: path, selectionMaskDataUrl: null });
  }, [onProjectUpdate]);

  const clearSelectionMask = useCallback(() => {
    onProjectUpdate({ selectionPath: null, selectionMaskDataUrl: null });
  }, [onProjectUpdate]);

  const applyMaskToSelectionPath = useCallback(() => {
    if (!initialProject.selectionMaskDataUrl) {
      showError("No mask data available to apply.");
      return;
    }
    if (!dimensions) {
      showError("Cannot convert mask without dimensions.");
      return;
    }
    const toastId = showLoading("Converting mask to path...");
    maskToPolygon(initialProject.selectionMaskDataUrl, dimensions.width, dimensions.height)
      .then(path => {
        onProjectUpdate({ selectionPath: path });
        dismissToast(toastId);
        showSuccess("Selection path refined from mask.");
      })
      .catch(err => {
        console.error(err);
        dismissToast(toastId);
        showError("Failed to convert mask to path.");
      });
  }, [initialProject.selectionMaskDataUrl, dimensions, onProjectUpdate]);

  const convertSelectionPathToMask = useCallback(() => {
    if (!initialProject.selectionPath || !dimensions) {
      showError("No selection path or dimensions available.");
      return;
    }
    const toastId = showLoading("Converting path to mask...");
    polygonToMaskDataUrl(initialProject.selectionPath, dimensions.width, dimensions.height)
      .then(maskDataUrl => {
        onProjectUpdate({ selectionMaskDataUrl: maskDataUrl });
        dismissToast(toastId);
        showSuccess("Selection mask created.");
      })
      .catch(err => {
        console.error(err);
        dismissToast(toastId);
        showError("Failed to convert path to mask.");
      });
  }, [initialProject.selectionPath, dimensions, onProjectUpdate]);

  const handleSelectionBrushStroke = useCallback(async (strokeDataUrl: string, operation: 'add' | 'subtract') => {
    if (!dimensions) return;

    const baseMaskUrl = initialProject.selectionMaskDataUrl || await polygonToMaskDataUrl(initialProject.selectionPath || [], dimensions.width, dimensions.height);
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = dimensions.width;
    tempCanvas.height = dimensions.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const baseImg = new Image();
    const strokeImg = new Image();

    const basePromise = baseMaskUrl ? new Promise((res, rej) => { baseImg.onload = res; baseImg.onerror = rej; baseImg.src = baseMaskUrl; }) : Promise.resolve();
    const strokePromise = new Promise((res, rej) => { strokeImg.onload = res; strokeImg.onerror = rej; strokeImg.src = strokeDataUrl; });

    await Promise.all([basePromise, strokePromise]);

    // 1. Draw existing mask (if any)
    if (baseMaskUrl) {
      tempCtx.drawImage(baseImg, 0, 0);
    }

    // 2. Apply the new stroke
    tempCtx.globalCompositeOperation = operation === 'add' ? 'source-over' : 'destination-out';
    tempCtx.drawImage(strokeImg, 0, 0);

    const combinedMaskUrl = tempCanvas.toDataURL();
    onProjectUpdate({ selectionMaskDataUrl: combinedMaskUrl, selectionPath: null });
  }, [dimensions, initialProject.selectionMaskDataUrl, initialProject.selectionPath, onProjectUpdate]);

  const handleSelectiveBlurStroke = useCallback(async (strokeDataUrl: string, operation: 'add' | 'subtract') => {
    if (!dimensions) return;

    const baseMaskUrl = currentState.selectiveBlurMask || await polygonToMaskDataUrl([], dimensions.width, dimensions.height);
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = dimensions.width;
    tempCanvas.height = dimensions.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const baseImg = new Image();
    const strokeImg = new Image();

    const basePromise = baseMaskUrl ? new Promise((res, rej) => { baseImg.onload = res; baseImg.onerror = rej; baseImg.src = baseMaskUrl; }) : Promise.resolve();
    const strokePromise = new Promise((res, rej) => { strokeImg.onload = res; strokeImg.onerror = rej; strokeImg.src = strokeDataUrl; });

    await Promise.all([basePromise, strokePromise]);

    // 1. Draw existing mask (if any)
    if (baseMaskUrl) {
      tempCtx.drawImage(baseImg, 0, 0);
    }

    // 2. Apply the new stroke
    // For blur mask: 'add' means draw the gray stroke (increasing blur), 'subtract' means draw black (removing blur)
    tempCtx.globalCompositeOperation = 'source-over'; 
    tempCtx.drawImage(strokeImg, 0, 0);

    const combinedMaskUrl = tempCanvas.toDataURL();
    commitStateChange("Selective Blur Stroke", { selectiveBlurMask: combinedMaskUrl });
  }, [dimensions, currentState.selectiveBlurMask, commitStateChange]);

  const handleSelectiveBlurStrengthChange = useCallback((value: number) => {
    onProjectUpdate({ selectiveBlurAmount: value });
  }, [onProjectUpdate]);

  const handleSelectiveBlurStrengthCommit = useCallback((value: number) => {
    onProjectUpdate({ selectiveBlurAmount: value });
    recordHistory(`Set Selective Blur Strength to ${value}%`, currentState, layers);
  }, [recordHistory, currentState, layers, onProjectUpdate]);

  const applyGenerativeResult = useCallback(async (resultUrl: string, maskDataUrl: string | null) => {
    if (!dimensions || !maskDataUrl) {
      showError("Missing dimensions or mask data for generative fill.");
      return;
    }

    // 1. Rasterize the current edited image (excluding the selection area)
    const editedCanvas = await rasterizeLayerToCanvas({
      id: 'temp-bg',
      type: 'image',
      name: 'Temp Background',
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      dataUrl: image!,
    }, dimensions);

    if (!editedCanvas) {
      showError("Failed to rasterize current image.");
      return;
    }

    const ctx = editedCanvas.getContext('2d');
    if (!ctx) return;

    // 2. Load the generated image
    const generatedImg = new Image();
    await new Promise((res, rej) => {
      generatedImg.onload = res;
      generatedImg.onerror = rej;
      generatedImg.src = resultUrl;
    });

    // 3. Load the mask
    const maskImg = new Image();
    await new Promise((res, rej) => {
      maskImg.onload = res;
      maskImg.onerror = rej;
      maskImg.src = maskDataUrl;
    });

    // 4. Create a temporary canvas for the masked generated image
    const maskedGeneratedCanvas = document.createElement('canvas');
    maskedGeneratedCanvas.width = dimensions.width;
    maskedGeneratedCanvas.height = dimensions.height;
    const maskedCtx = maskedGeneratedCanvas.getContext('2d');
    if (!maskedCtx) return;

    // Draw generated image
    maskedCtx.drawImage(generatedImg, 0, 0, dimensions.width, dimensions.height);

    // Apply mask to the generated image (destination-in)
    maskedCtx.globalCompositeOperation = 'destination-in';
    maskedCtx.drawImage(maskImg, 0, 0, dimensions.width, dimensions.height);

    // 5. Merge the masked generated image onto the main canvas
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(maskedGeneratedCanvas, 0, 0);

    const mergedDataUrl = editedCanvas.toDataURL();

    // 6. Create a new drawing layer with the merged result
    const newLayer: Layer = {
      id: uuidv4(),
      type: "drawing",
      name: "Generative Fill",
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      dataUrl: mergedDataUrl,
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
    };

    // Replace the background layer with the new merged image
    const updatedLayers = layers.map(l => l.id === 'background' ? newLayer : l);

    onProjectUpdate({
      image: mergedDataUrl, // Update the main image source
      selectionPath: null,
      selectionMaskDataUrl: null,
    });
    recordHistory("Generative Fill Applied", currentState, updatedLayers);
    showSuccess("Generative fill applied.");
  }, [dimensions, image, layers, currentState, onProjectUpdate, recordHistory]);

  const applySelectionAsMask = useCallback(() => {
    if (!selectedLayerId || !initialProject.selectionMaskDataUrl) {
      showError("Select a layer and ensure a selection mask is active.");
      return;
    }
    
    const layer = layers.find(l => l.id === selectedLayerId);
    if (!layer || layer.type === 'image') {
      showError("Cannot apply mask to the background layer.");
      return;
    }

    const updatedLayers = layers.map(l => 
      l.id === selectedLayerId ? { ...l, maskDataUrl: initialProject.selectionMaskDataUrl } : l
    );
    
    onProjectUpdate({ selectionPath: null, selectionMaskDataUrl: null });
    onLayerUpdate(updatedLayers, `Apply Selection as Mask to "${layer.name}"`);
    showSuccess(`Selection applied as mask to layer "${layer.name}".`);
  }, [selectedLayerId, layers, initialProject.selectionMaskDataUrl, onProjectUpdate, onLayerUpdate]);

  // --- Hotkeys ---
  useHotkeys("ctrl+z, cmd+z", handleUndo, { preventDefault: true });
  useHotkeys("ctrl+y, cmd+shift+z", handleRedo, { preventDefault: true });
  useHotkeys("ctrl+s, cmd+s", (e) => {
    e.preventDefault();
    handleSaveProject();
  }, { preventDefault: true });
  useHotkeys("ctrl+c, cmd+c", handleCopy, { preventDefault: true });
  useHotkeys("x", handleSwapColors, { preventDefault: true });

  return {
    // Project State
    image,
    dimensions,
    fileInfo,
    exifData,
    currentState,
    history: initialProject.history,
    currentHistoryIndex: initialProject.currentHistoryIndex,
    aspect: initialProject.aspect,
    canUndo: initialProject.currentHistoryIndex > 0,
    canRedo: initialProject.currentHistoryIndex < initialProject.history.length - 1,
    
    // File & History Actions
    handleFileSelect,
    handleUrlImageLoad,
    handleGeneratedImageLoad,
    handleNewProject,
    handleNewFromClipboard,
    handleSaveProject,
    handleLoadProject,
    handleUndo,
    handleRedo,
    jumpToHistory,
    handleDownload,
    handleCopy,
    handleReset,
    recordHistory,
    loadTemplateData,
    loadImageData,

    // Edit State Actions
    handleAdjustmentChange,
    handleAdjustmentCommit,
    handleEffectChange,
    handleEffectCommit,
    handleGradingChange,
    handleGradingCommit,
    handleHslAdjustmentChange,
    handleHslAdjustmentCommit,
    handleChannelChange,
    handleCurvesChange,
    handleCurvesCommit,
    handleFilterChange,
    handleTransformChange,
    handleRotationChange,
    handleRotationCommit,
    handleFramePresetChange,
    handleFramePropertyChange,
    handleFramePropertyCommit,
    applyPreset,
    
    // Crop State
    pendingCrop: initialProject.pendingCrop,
    setPendingCrop: (crop) => onProjectUpdate({ pendingCrop: crop }),
    applyCrop,
    cancelCrop,
    setAspect: (aspect) => onProjectUpdate({ aspect }),

    // Layer utilities
    layers,
    selectedLayerId,
    setSelectedLayer: (id) => onProjectUpdate({ selectedLayerId: id }),
    addTextLayer: (coords) => addTextLayer(coords, foregroundColor),
    addDrawingLayer,
    handleAddLayerFromBackground: addLayerFromBackground, // NEW
    addShapeLayer: (coords, shapeType, initialWidth, initialHeight) => addShapeLayer(coords, shapeType, initialWidth, initialHeight, foregroundColor, backgroundColor),
    addGradientLayer,
    addAdjustmentLayer,
    toggleLayerVisibility,
    renameLayer,
    deleteLayer,
    handleDeleteHiddenLayers: deleteHiddenLayers, // NEW
    duplicateLayer,
    mergeLayerDown,
    rasterizeLayer,
    handleRasterizeSmartObject: rasterizeSmartObject, // NEW
    handleConvertSmartObjectToLayers: convertSmartObjectToLayers, // NEW
    handleExportSmartObjectContents: exportSmartObjectContents, // NEW
    handleArrangeLayer: arrangeLayer, // NEW
    updateLayer,
    commitLayerChange,
    handleLayerPropertyCommit,
    handleLayerOpacityChange,
    handleLayerOpacityCommit,
    reorderLayers,
    createSmartObject,
    openSmartObjectEditor,
    closeSmartObjectEditor,
    saveSmartObjectChanges,
    isSmartObjectEditorOpen,
    smartObjectEditingId,
    moveSelectedLayer,
    groupLayers,
    toggleGroupExpanded,
    handleDrawingStrokeEnd,
    removeLayerMask,
    invertLayerMask,
    toggleClippingMask,
    toggleLayerLock,

    // Tool state
    activeTool,
    setActiveTool,
    brushState,
    setBrushState,
    foregroundColor,
    handleForegroundColorChange,
    backgroundColor,
    handleBackgroundColorChange,
    handleSwapColors,
    handleColorPick,
    gradientToolState,
    setGradientToolState,
    selectedShapeType,
    setSelectedShapeType,

    // Selection & Generative Fill
    applyGenerativeResult,
    selectionPath: initialProject.selectionPath,
    setSelectionPath,
    selectionMaskDataUrl: initialProject.selectionMaskDataUrl,
    handleSelectionBrushStroke,
    clearSelectionMask,
    applyMaskToSelectionPath,
    convertSelectionPathToMask,
    applySelectionAsMask,

    // Selective Blur
    handleSelectiveBlurStroke,
    selectiveBlurStrength: initialProject.selectiveBlurAmount,
    handleSelectiveBlurStrengthChange,
    handleSelectiveBlurStrengthCommit,
  };
};