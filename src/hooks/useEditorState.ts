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

export interface EditState {
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  effects: {
    blur: number;
    hueShift: number;
    vignette: number;
    noise: number;
    sharpen: number;
    clarity: number;
  };
  grading: {
    grayscale: number;
    sepia: number;
    invert: number;
  };
  hslAdjustments: {
    global: HslAdjustment;
    red: HslAdjustment;
    orange: HslAdjustment;
    yellow: HslAdjustment;
    green: HslAdjustment;
    aqua: HslAdjustment;
    blue: HslAdjustment;
    purple: HslAdjustment;
    magenta: HslAdjustment;
  };
  channels: {
    r: boolean;
    g: boolean;
    b: boolean;
  };
  curves: {
    all: Point[];
    r: Point[];
    g: Point[];
    b: Point[];
  };
  selectedFilter: string;
  transforms: {
    rotation: number;
    scaleX: number;
    scaleY: number;
  };
  frame: {
    type: 'none' | 'solid';
    width: number;
    color: string;
  };
  crop: Crop | undefined;
  selectiveBlurMask: string | null;
  selectiveBlurAmount: number;
  selectiveBlurStrength: number;
  colorMode: 'RGB' | 'CMYK' | 'Grayscale';
}

export interface Point {
  x: number;
  y: number;
}

/** Data structure for an Adjustment Layer */
export interface AdjustmentLayerData {
  type: 'brightness' | 'curves' | 'hsl' | 'grading';
  // Only include the relevant state subset
  adjustments?: EditState['adjustments'];
  curves?: EditState['curves'];
  hslAdjustments?: EditState['hslAdjustments'];
  grading?: EditState['grading'];
}

/** Layer definition */
export interface Layer {
  id: string;
  type: "image" | "text" | "drawing" | "smart-object" | "vector-shape" | "group" | "gradient" | "adjustment";
  name: string;
  visible: boolean;
  opacity?: number;
  blendMode?: string;
  isClippingMask?: boolean;
  isLocked?: boolean;
  // Text layer specific properties
  content?: string;
  // Drawing layer specific properties
  dataUrl?: string;
  maskDataUrl?: string;
  // Common transform properties for movable layers (x, y, width, height, rotation)
  x?: number; // percentage from left
  y?: number; // percentage from top
  width?: number; // percentage of parent container width
  height?: number; // percentage of parent container height
  rotation?: number; // degrees
  // Text specific properties (moved here for clarity, but still text-specific)
  fontSize?: number; // pixels
  color?: string;
  fontFamily?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  letterSpacing?: number; // pixels
  lineHeight?: number; // multiplier (e.g., 1.2)
  textShadow?: { color: string; blur: number; offsetX: number; offsetY: number };
  stroke?: { color: string; width: number };
  backgroundColor?: string;
  padding?: number;
  // Vector shape specific properties
  shapeType?: "rect" | "circle" | "triangle" | "polygon";
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number; // For rect
  points?: { x: number; y: number }[]; // For polygon/triangle
  // Gradient layer specific properties
  gradientType?: "linear" | "radial";
  gradientColors?: string[]; // e.g., ["#FF0000", "#0000FF"]
  gradientStops?: number[]; // e.g., [0, 1]
  gradientAngle?: number; // 0-360 for linear
  gradientCenterX?: number; // 0-100 for radial
  gradientCenterY?: number; // 0-100 for radial
  gradientRadius?: number; // 0-100 for radial
  gradientFeather?: number; // 0-100
  gradientInverted?: boolean;
  // Smart object properties
  smartObjectData?: {
    layers: Layer[];
    width: number;
    height: number;
  };
  // Group layer properties
  children?: Layer[]; // For 'group' type
  expanded?: boolean; // For 'group' type
  // Adjustment layer properties
  adjustmentData?: AdjustmentLayerData;
}

export interface HistoryItem {
  name: string;
  state: EditState;
  layers: Layer[];
}

export interface BrushState {
  size: number;
  opacity: number;
  color: string; // This will now be derived from foregroundColor
  hardness: number; // Added hardness
  smoothness: number; // Added smoothness
  shape: 'circle' | 'square'; // Added brush shape
}

export interface GradientToolState {
  type: "linear" | "radial";
  colors: string[];
  stops: number[];
  angle: number;
  centerX: number;
  centerY: number;
  radius: number;
  feather: number;
  inverted: boolean;
}

export type ActiveTool = "lasso" | "brush" | "text" | "crop" | "eraser" | "eyedropper" | "shape" | "move" | "gradient" | "selectionBrush" | "blurBrush";

/* ---------- Initial state ---------- */
const defaultCurve = [{ x: 0, y: 0 }, { x: 255, y: 255 }];
export const initialCurvesState = {
  all: [...defaultCurve],
  r: [...defaultCurve],
  g: [...defaultCurve],
  b: [...defaultCurve],
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
  channels: { r: true, g: true, b: true },
  curves: initialCurvesState,
  selectedFilter: "",
  transforms: { rotation: 0, scaleX: 1, scaleY: 1 },
  frame: { type: 'none', width: 0, color: '#000000' },
  crop: undefined,
  selectiveBlurMask: null,
  selectiveBlurAmount: 0,
  selectiveBlurStrength: 50,
  colorMode: 'RGB',
};

export const initialBrushState: Omit<BrushState, 'color'> = {
  size: 50,
  opacity: 100,
  hardness: 50,
  smoothness: 0,
  shape: 'circle',
};

export const initialGradientToolState: GradientToolState = {
  type: "linear",
  colors: ["#FFFFFF", "#000000"],
    stops: [0, 1],
  angle: 90,
  centerX: 50,
  centerY: 50,
  radius: 50,
  feather: 0,
  inverted: false,
};

// Define initial layer structure for history
export const initialLayerState: Layer[] = [
  {
    id: uuidv4(),
    type: "image",
    name: "Background",
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    isLocked: true,
  },
];

export const initialHistoryItem: HistoryItem = {
  name: "Initial State",
  state: initialEditState,
  layers: initialLayerState,
};

/* ---------- Hook implementation ---------- */
export const useEditorState = (
  initialProject: {
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
    // ADDED MISSING PROPERTIES from Project interface (TS2353 fix)
    image: string | null;
    dimensions: { width: number; height: number } | null;
    fileInfo: { name: string; size: number } | null;
    exifData: any | null;
    activeTool: ActiveTool | null;
  },
  onProjectUpdate: (updates: Partial<typeof initialProject>) => void, // <-- FIX 1, 2, 3: Removed Omit<'history' | 'layers'>
  onHistoryUpdate: (history: HistoryItem[], currentHistoryIndex: number, layers: Layer[]) => void,
  onLayerUpdate: (layers: Layer[], historyName?: string) => void,
  image: string | null,
  dimensions: { width: number; height: number } | null,
  fileInfo: { name: string; size: number } | null,
  exifData: any | null,
  imgRef: React.RefObject<HTMLImageElement>,
) => {
  const { geminiApiKey, stabilityApiKey } = useSettings();
  
  const {
    history,
    currentHistoryIndex,
    layers,
    selectedLayerId,
    aspect,
    pendingCrop,
    selectionPath,
    selectionMaskDataUrl,
    foregroundColor,
    backgroundColor,
    gradientToolState,
    brushStateInternal,
    selectedShapeType,
    // Destructure activeTool (TS2552 fix)
    activeTool,
  } = initialProject;

  const currentState = history[currentHistoryIndex].state;

  /* ---------- History helpers ---------- */
  const recordHistory = useCallback(
    (name: string, state: EditState, layers: Layer[] = initialProject.layers) => {
      const newHistory = history.slice(0, currentHistoryIndex + 1);
      onHistoryUpdate([...newHistory, { name, state, layers }], newHistory.length, layers);
    },
    [history, currentHistoryIndex, onHistoryUpdate, initialProject.layers]
  );

  const updateCurrentState = useCallback(
    (updates: Partial<EditState>) => {
      const newState = { ...currentState, ...updates };
      const newHistory = [...history];
      newHistory[currentHistoryIndex] = { ...newHistory[currentHistoryIndex], state: newState };
      onHistoryUpdate(newHistory, currentHistoryIndex, layers);
    },
    [currentState, history, currentHistoryIndex, onHistoryUpdate, layers]
  );

  const {
    setLayers, // FIX 15
    setSelectedLayerId: setLayerId,
    handleAddTextLayer: addTextLayer, // FIX 16
    handleAddDrawingLayer: addDrawingLayer, // FIX 17
    handleAddShapeLayer: addShapeLayer, // FIX 18
    handleAddGradientLayer: addGradientLayer, // FIX 19
    addAdjustmentLayer,
    handleToggleVisibility: toggleLayerVisibility, // FIX 20
    renameLayer,
    handleDeleteLayer: deleteLayer, // FIX 21
    handleDuplicateLayer: duplicateLayer, // FIX 22
    handleMergeLayerDown: mergeLayerDown, // FIX 23
    handleRasterizeLayer: rasterizeLayer, // FIX 24
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
  } = useLayers({
    currentEditState: currentState,
    recordHistory: (name, state, layers) => recordHistory(name, state, layers),
    updateCurrentState,
    imgRef,
    imageNaturalDimensions: dimensions,
    gradientToolState,
    activeTool: activeTool,
    layers,
    // Handle function updater pattern (TS2345 fix)
    setLayers: (newLayersOrUpdater, historyName) => {
      let newLayers: Layer[];
      if (typeof newLayersOrUpdater === 'function') {
        newLayers = newLayersOrUpdater(layers);
      } else {
        newLayers = newLayersOrUpdater;
      }
      onLayerUpdate(newLayers, historyName);
    },
    selectedLayerId,
    setSelectedLayerId: (id) => onProjectUpdate({ selectedLayerId: id }),
    history, // Pass history for canUndo/canRedo calculation
    currentHistoryIndex, // Pass currentHistoryIndex for canUndo/canRedo calculation
    foregroundColor,
    backgroundColor,
    selectedShapeType,
  });

  // Sync layers from useLayers back to history when they change
  // This is now handled by the setLayers callback passed to useLayers

  const setActiveTool = (tool: ActiveTool | null) => {
    // Clear selection states if switching away from selection tools
    if (tool !== 'lasso' && tool !== 'selectionBrush') {
      onProjectUpdate({ selectionPath: null, selectionMaskDataUrl: null });
    }
    // Clear pending crop if switching away from crop tool
    if (tool !== 'crop' && initialProject.pendingCrop) {
      onProjectUpdate({ pendingCrop: undefined });
    }
    // Clear selective blur mask if switching away from blur brush
    if (tool !== 'blurBrush' && currentState.selectiveBlurMask) {
      recordHistory("Clear Blur Mask", { ...currentState, selectiveBlurMask: null, selectiveBlurAmount: 0, selectiveBlurStrength: 50 }, layers);
    }
    
    onProjectUpdate({ activeTool: tool });
  };

  /* ---------- Preset application ---------- */
  const applyPreset = useCallback(
    (preset: Preset) => {
      const presetState = {
        ...preset.state,
        curves: { ...initialCurvesState, ...preset.state.curves },
      };
      const newState = { ...currentState, ...presetState };
      recordHistory(`Apply Preset "${preset.name}"`, newState, layers);
    },
    [currentState, layers, recordHistory]
  );

  /* ---------- Image loading ---------- */
  const loadImageData = useCallback((dataUrl: string, successMsg: string, initialLayers: Layer[], initialDimensions?: { width: number; height: number }) => {
    const newHistoryItem: HistoryItem = { 
      name: "Load Image", 
      state: initialEditState, 
      layers: initialLayers 
    };
    
    onProjectUpdate({
      image: dataUrl,
      dimensions: initialDimensions,
      history: [newHistoryItem],
      currentHistoryIndex: 0,
      layers: initialLayers,
      selectedLayerId: initialLayers.length > 1 ? initialLayers[initialLayers.length - 1].id : null,
      pendingCrop: undefined,
      selectionPath: null,
      selectionMaskDataUrl: null,
      aspect: initialDimensions ? initialDimensions.width / initialDimensions.height : undefined,
    });
    showSuccess(successMsg);
  }, [onProjectUpdate]);

  const handleNewProject = useCallback((settings: NewProjectSettings) => {
    const { width, height, backgroundColor } = settings;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/png');
      
      const initialDimensions = { width, height };

      loadImageData(dataUrl, "New project created.", [{
        id: uuidv4(),
        type: "image",
        name: "Background",
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        isLocked: true,
      }], initialDimensions);
      onProjectUpdate({ fileInfo: { name: "Untitled-1.png", size: 0 }, exifData: null });
    } else {
      showError("Failed to create canvas for new project.");
    }
  }, [loadImageData, onProjectUpdate]);

  const handleGeneratedImageLoad = useCallback((dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const initialDimensions = { width: img.naturalWidth, height: img.naturalHeight };
      
      loadImageData(dataUrl, "New image generated successfully.", [{
        id: uuidv4(),
        type: "image",
        name: "Background",
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        isLocked: true,
      }], initialDimensions);
      onProjectUpdate({ fileInfo: { name: "generated-image.png", size: 0 }, exifData: null });
    };
    img.src = dataUrl;
  }, [loadImageData, onProjectUpdate]);

  const handleFileSelect = useCallback((file: File | undefined, importInSameProject: boolean = false) => {
    if (!file) return;
    const toastId = showLoading("Uploading file...");
    const fileNameLower = file.name.toLowerCase();

    const processImageFile = (dataUrl: string, initialDimensions: { width: number; height: number }) => {
      dismissToast(toastId);
      
      const newLayer: Layer = {
        id: uuidv4(),
        type: "drawing",
        name: file.name,
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        dataUrl: dataUrl,
        x: 50,
        y: 50,
        width: (initialDimensions.width / (dimensions?.width || initialDimensions.width)) * 100,
        height: (initialDimensions.height / (dimensions?.height || initialDimensions.height)) * 100,
        rotation: 0,
      };

      if (importInSameProject && image) {
        const updatedLayers = [...layers, newLayer];
        onLayerUpdate(updatedLayers, `Import Layer: ${file.name}`);
        onProjectUpdate({ selectedLayerId: newLayer.id });
        showSuccess(`File "${file.name}" imported as a new layer.`);
      } else {
        // New Project
        loadImageData(dataUrl, "Image uploaded successfully.", [{
          id: uuidv4(),
          type: "image",
          name: "Background",
          visible: true,
          opacity: 100,
          blendMode: 'normal',
          isLocked: true,
        }], initialDimensions);
        onProjectUpdate({ fileInfo: { name: file.name, size: file.size }, exifData: null });
      }
    };

    if (fileNameLower.endsWith('.psd') || fileNameLower.endsWith('.psb')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const psd = readPsd(reader.result as ArrayBuffer);
          const compositeImageUrl = psd.canvas.toDataURL();
          const initialDimensions = { width: psd.width, height: psd.height };
          
          const importedLayers: Layer[] = [];

          const processPsdLayers = (psdLayers: any[]) => {
            psdLayers.forEach((psdLayer) => {
              if (psdLayer.hidden) return;
              
              if (psdLayer.canvas) {
                const fullCanvas = document.createElement('canvas');
                fullCanvas.width = psd.width;
                fullCanvas.height = psd.height;
                const ctx = fullCanvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(psdLayer.canvas, psdLayer.left ?? 0, psdLayer.top ?? 0);
                  
                  const newLayer: Layer = {
                    id: uuidv4(),
                    type: 'drawing',
                    name: psdLayer.name || 'Flattened Layer',
                    visible: !psdLayer.hidden,
                    opacity: (psdLayer.opacity ?? 1) * 100,
                    blendMode: psdLayer.blendMode || 'normal',
                    dataUrl: fullCanvas.toDataURL(),
                    x: 50,
                    y: 50,
                    width: 100,
                    height: 100,
                    rotation: 0,
                  };
                  importedLayers.push(newLayer);
                }
              }
            });
          };

          if (psd.children) {
            processPsdLayers(psd.children);
          }
          
          // Add a transparent background layer if importing into a new project
          const finalLayers = importInSameProject ? importedLayers : [
            { id: uuidv4(), type: "image", name: "Background", visible: true, opacity: 100, blendMode: 'normal', isLocked: true } as Layer,
            ...importedLayers
          ];

          if (importInSameProject && image) {
            const updatedLayers = [...layers, ...finalLayers];
            onLayerUpdate(updatedLayers, `Import PSD Layers: ${file.name}`);
            onProjectUpdate({ selectedLayerId: importedLayers[importedLayers.length - 1]?.id || null });
            showSuccess(`PSD file imported as ${importedLayers.length} layers.`);
          } else {
            loadImageData(compositeImageUrl, "PSD/PSB file imported with layers.", finalLayers, initialDimensions);
            onProjectUpdate({ fileInfo: { name: file.name, size: file.size }, exifData: null });
          }
          dismissToast(toastId);
          showError(`Warning: ${file.name} was imported as flattened raster layers. Full vector editing is not supported.`);
        } catch (e) {
          console.error("Failed to parse PSD:", e);
          dismissToast(toastId);
          showError("Could not read the PSD/PSB file. It may be corrupt or an unsupported version.");
        }
      };
      reader.onerror = () => {
        dismissToast(toastId);
        showError("Failed to read the file.");
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    
    if (fileNameLower.endsWith('.ai') || fileNameLower.endsWith('.cdr') || fileNameLower.endsWith('.pdf')) {
      // --- STUB: Complex Vector Import ---
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        
        const tempImg = new Image();
        tempImg.onload = () => {
          const width = tempImg.naturalWidth;
          const height = tempImg.naturalHeight;
          const initialDimensions = { width, height };
          
          processImageFile(dataUrl, initialDimensions);
          showError(`Warning: ${file.name} was imported as a flattened image. Full vector editing is not supported.`);
        };
        tempImg.onerror = () => {
          dismissToast(toastId);
          showError(`Failed to read ${file.name}.`);
        };
        tempImg.src = dataUrl;
      };
      reader.onerror = () => {
        dismissToast(toastId);
        showError("Failed to read the file.");
      };
      reader.readAsDataURL(file);
      return;
      // --- END STUB ---
    }

    if (!file.type.startsWith("image/")) {
      dismissToast(toastId);
      showError("Invalid file type. Please upload an image, .psd, .psb, .pdf, .ai, or .cdr file.");
      return;
    }
    
    ExifReader.load(file).then((data) => onProjectUpdate({ exifData: data })).catch(() => onProjectUpdate({ exifData: null }));

    const reader = new FileReader();
    reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const initialDimensions = { width: img.naturalWidth, height: img.naturalHeight };
          processImageFile(dataUrl, initialDimensions);
        };
        img.src = dataUrl;
    };
    reader.onerror = () => {
      dismissToast(toastId);
      showError("Failed to read the image file.");
    };
    reader.readAsDataURL(file);
  }, [loadImageData, onProjectUpdate, layers, image, dimensions, onLayerUpdate]);

  const handleUrlImageLoad = useCallback(async (url: string, importInSameProject: boolean = false) => {
    const toastId = showLoading("Loading image from URL...");
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Network error ${response.status}`);
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) {
        dismissToast(toastId);
        showError("The provided URL does not point to a valid image.");
        return;
      }
      const filename = url.split("/").pop()?.split("?")[0] || "image.jpg";
      const file = new File([blob], filename, { type: blob.type });
      
      ExifReader.load(file).then((data) => onProjectUpdate({ exifData: data })).catch(() => onProjectUpdate({ exifData: null }));

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const initialDimensions = { width: img.naturalWidth, height: img.naturalHeight };
          dismissToast(toastId);

          const newLayer: Layer = {
            id: uuidv4(),
            type: "drawing",
            name: file.name,
            visible: true,
            opacity: 100,
            blendMode: 'normal',
            dataUrl: dataUrl,
            x: 50,
            y: 50,
            width: (initialDimensions.width / (dimensions?.width || initialDimensions.width)) * 100,
            height: (initialDimensions.height / (dimensions?.height || initialDimensions.height)) * 100,
            rotation: 0,
          };

          if (importInSameProject && image) {
            const updatedLayers = [...layers, newLayer];
            onLayerUpdate(updatedLayers, `Import Layer: ${file.name}`);
            onProjectUpdate({ selectedLayerId: newLayer.id });
            showSuccess(`Image from URL imported as a new layer.`);
          } else {
            loadImageData(dataUrl, "Image loaded successfully.", [{
              id: uuidv4(),
              type: "image",
              name: "Background",
              visible: true,
              opacity: 100,
              blendMode: 'normal',
              isLocked: true,
            }], initialDimensions);
            onProjectUpdate({ fileInfo: { name: file.name, size: file.size }, exifData: null });
          }
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        dismissToast(toastId);
        showError("Failed to read the image file from URL.");
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      dismissToast(toastId);
      console.error(e);
      showError("Could not load image. Check the URL and CORS policy.");
    }
  }, [loadImageData, onProjectUpdate, layers, image, dimensions, onLayerUpdate]);

  const handleNewFromClipboard = useCallback(async (importInSameProject: boolean = false) => {
    const toastId = showLoading("Checking clipboard...");
    try {
      const clipboardItems = await navigator.clipboard.read();
      let imageBlob: Blob | null = null;

      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          imageBlob = await item.getType(imageType);
          break;
        }
      }

      if (imageBlob) {
        dismissToast(toastId);
        const file = new File([imageBlob], "pasted-image.png", { type: imageBlob.type });
        handleFileSelect(file, importInSameProject);
      } else {
        dismissToast(toastId);
        showError("No image found on the clipboard.");
      }
    } catch (err) {
      dismissToast(toastId);
      console.error("Clipboard API error:", err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        showError("Clipboard access denied. Please allow access in your browser settings.");
      } else {
        showError("Could not read from clipboard. Your browser might not support this feature.");
      }
    }
  }, [handleFileSelect]);

  const loadTemplateData = useCallback((templateData: TemplateData) => {
    const { data: { editState, layers: templateLayers, dimensions: templateDimensions }, name } = templateData;
    
    const canvas = document.createElement('canvas');
    canvas.width = templateDimensions.width;
    canvas.height = templateDimensions.height;
    const dataUrl = canvas.toDataURL('image/png');

    const newState = { ...initialEditState, ...editState };
    const newHistoryItem = { name: "Load Template", state: newState, layers: templateLayers };
    
    onProjectUpdate({
      image: dataUrl,
      dimensions: templateDimensions,
      history: [newHistoryItem],
      currentHistoryIndex: 0,
      layers: templateLayers,
      selectedLayerId: null,
      pendingCrop: undefined,
      selectionPath: null,
      selectionMaskDataUrl: null,
      aspect: templateDimensions.width / templateDimensions.height,
    });
    showSuccess("Template loaded successfully.");
  }, [onProjectUpdate]);

  /* ---------- Project Save/Load ---------- */
  const handleSaveProject = useCallback(() => {
    if (!image) {
      showError("There is no project to save.");
      return;
    }
    saveProjectToFile({
      sourceImage: image,
      history,
      currentHistoryIndex,
      fileInfo,
    });
  }, [image, history, currentHistoryIndex, fileInfo]);

  const handleLoadProject = useCallback(async (file: File) => {
    const toastId = showLoading("Opening project...");
    try {
      const projectData = await loadProjectFromFile(file);
      
      const img = new Image();
      img.onload = () => {
        const initialDimensions = { width: img.naturalWidth, height: img.naturalHeight };
        
        onProjectUpdate({
          image: projectData.sourceImage,
          dimensions: initialDimensions,
          history: projectData.history,
          currentHistoryIndex: projectData.currentHistoryIndex,
          fileInfo: projectData.fileInfo,
          exifData: null, // EXIF data is not saved in .nanoedit files
          selectedLayerId: null,
          pendingCrop: undefined,
          selectionPath: null,
          selectionMaskDataUrl: null,
          layers: projectData.history[projectData.currentHistoryIndex].layers,
          aspect: initialDimensions.width / initialDimensions.height,
          activeTool: null,
        });
        dismissToast(toastId);
        showSuccess("Project opened successfully.");
      };
      img.onerror = () => {
        dismissToast(toastId);
        showError("Failed to load image data from project file.");
      };
      img.src = projectData.sourceImage || '';

    } catch (error: any) {
      dismissToast(toastId);
      console.error("Failed to load project:", error);
      showError(error.message || "Could not open the project file.");
    }
  }, [onProjectUpdate]);

  /* ---------- Adjustment handlers ---------- */
  const handleAdjustmentChange = useCallback((key: string, value: number) => {
    updateCurrentState({ adjustments: { ...currentState.adjustments, [key]: value } });
  }, [currentState.adjustments, updateCurrentState]);

  const handleAdjustmentCommit = useCallback((key: string, value: number) => {
    const newAdj = { ...currentState.adjustments, [key]: value };
    const name = `Adjust ${key.charAt(0).toUpperCase() + key.slice(1)}`;
    recordHistory(name, { ...currentState, adjustments: newAdj }, layers);
  }, [currentState, recordHistory, layers]);

  const handleEffectChange = useCallback((key: string, value: number) => {
    updateCurrentState({ effects: { ...currentState.effects, [key]: value } });
  }, [currentState.effects, updateCurrentState]);

  const handleEffectCommit = useCallback((key: string, value: number) => {
    const newEff = { ...currentState.effects, [key]: value };
    const name = `Adjust ${key.charAt(0).toUpperCase() + key.slice(1)}`;
    recordHistory(name, { ...currentState, effects: newEff }, layers);
  }, [currentState, recordHistory, layers]);

  const handleGradingChange = useCallback((key: string, value: number) => {
    updateCurrentState({ grading: { ...currentState.grading, [key]: value } });
  }, [currentState.grading, updateCurrentState]);

  const handleGradingCommit = useCallback((key: string, value: number) => {
    const newGrad = { ...currentState.grading, [key]: value };
    const name = `Adjust ${key.charAt(0).toUpperCase() + key.slice(1)}`;
    recordHistory(name, { ...currentState, grading: newGrad }, layers);
  }, [currentState, recordHistory, layers]);

  const handleHslAdjustmentChange = useCallback((color: keyof EditState['hslAdjustments'], key: keyof HslAdjustment, value: number) => {
    const newHsl = { 
      ...currentState.hslAdjustments, 
      [color]: { ...currentState.hslAdjustments[color], [key]: value } 
    };
    updateCurrentState({ hslAdjustments: newHsl });
  }, [currentState.hslAdjustments, updateCurrentState]);

  const handleHslAdjustmentCommit = useCallback((color: keyof EditState['hslAdjustments'], key: keyof HslAdjustment, value: number) => {
    const newHsl = { 
      ...currentState.hslAdjustments, 
      [color]: { ...currentState.hslAdjustments[color], [key]: value } 
    };
    const name = `Adjust HSL ${color.charAt(0).toUpperCase() + color.slice(1)} ${key.charAt(0).toUpperCase() + key.slice(1)}`;
    recordHistory(name, { ...currentState, hslAdjustments: newHsl }, layers);
  }, [currentState, recordHistory, layers]);

  const handleChannelChange = useCallback((channel: 'r' | 'g' | 'b', value: boolean) => {
    const newChannels = { ...currentState.channels, [channel]: value };
    const name = `Toggle ${channel.toUpperCase()} Channel`;
    recordHistory(name, { ...currentState, channels: newChannels }, layers);
  }, [currentState, recordHistory, layers]);

  const handleCurvesChange = useCallback((channel: keyof EditState['curves'], points: Point[]) => {
    updateCurrentState({ curves: { ...currentState.curves, [channel]: points } });
  }, [currentState.curves, updateCurrentState]);

  const handleCurvesCommit = useCallback((channel: keyof EditState['curves'], points: Point[]) => {
    const newCurves = { ...currentState.curves, [channel]: points };
    const channelName = channel === 'all' ? 'RGB' : channel.toUpperCase();
    recordHistory(`Adjust ${channelName} Curve`, { ...currentState, curves: newCurves }, layers);
  }, [currentState, recordHistory, layers]);

  const handleFilterChange = useCallback((value: string, name: string) => {
    const entryName = name === "None" ? "Remove Filter" : `Apply ${name} Filter`;
    recordHistory(entryName, { ...currentState, selectedFilter: value }, layers);
  }, [currentState, recordHistory, layers]);

  const handleTransformChange = useCallback((type: string) => {
    const newTrans = { ...currentState.transforms };
    const nameMap: Record<string, string> = {
      "rotate-left": "Rotate Left",
      "rotate-right": "Rotate Right",
      "flip-horizontal": "Flip Horizontal",
      "flip-vertical": "Flip Vertical",
    };
    switch (type) {
      case "rotate-left":
        newTrans.rotation = (newTrans.rotation - 90 + 360) % 360;
        break;
      case "rotate-right":
        newTrans.rotation = (newTrans.rotation + 90) % 360;
        break;
      case "flip-horizontal":
        newTrans.scaleX *= -1;
        break;
      case "flip-vertical":
        newTrans.scaleY *= -1;
        break;
      default:
        return;
    }
    recordHistory(nameMap[type] ?? "Transform", { ...currentState, transforms: newTrans }, layers);
  }, [currentState, recordHistory, layers]);

  const handleRotationChange = useCallback((value: number) => {
    updateCurrentState({ transforms: { ...currentState.transforms, rotation: value } });
  }, [currentState.transforms, updateCurrentState]);

  const handleRotationCommit = useCallback((value: number) => {
    recordHistory("Adjust Rotation", { ...currentState, transforms: { ...currentState.transforms, rotation: value } }, layers);
  }, [currentState, recordHistory, layers]);

  const handleFramePresetChange = useCallback((type: string, name: string, options?: { width: number; color: string }) => {
    const newFrame = {
      type: type as 'none' | 'solid',
      width: options?.width ?? 0,
      color: options?.color ?? '#000000',
    };
    recordHistory(`Set Frame: ${name}`, { ...currentState, frame: newFrame }, layers);
  }, [currentState, recordHistory, layers]);

  const handleFramePropertyChange = useCallback((key: 'width' | 'color', value: number | string) => {
    const newFrame = { ...currentState.frame, [key]: value };
    if (key === 'width' && value === 0) {
      newFrame.type = 'none';
    } else {
      newFrame.type = 'solid';
    }
    updateCurrentState({ frame: newFrame });
  }, [currentState.frame, updateCurrentState]);

  const handleFramePropertyCommit = useCallback(() => {
    recordHistory("Adjust Frame", currentState, layers);
  }, [currentState, recordHistory, layers]);

  /* ---------- Crop ---------- */
  const applyCrop = useCallback(() => {
    if (!pendingCrop) return;
    recordHistory("Crop Image", { ...currentState, crop: pendingCrop }, layers);
    onProjectUpdate({ pendingCrop: undefined });
    setActiveTool(null);
  }, [currentState, recordHistory, pendingCrop, layers, onProjectUpdate]);

  const cancelCrop = useCallback(() => {
    onProjectUpdate({ pendingCrop: undefined });
    setActiveTool(null);
  }, [onProjectUpdate]);

  /* ---------- Undo / Redo / Reset ---------- */
  const handleUndo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      onHistoryUpdate(history, newIndex, history[newIndex].layers);
    }
  }, [currentHistoryIndex, history, onHistoryUpdate]);

  const handleRedo = useCallback(() => {
    if (currentHistoryIndex < history.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      onHistoryUpdate(history, newIndex, history[newIndex].layers);
    }
  }, [currentHistoryIndex, history.length, history, onHistoryUpdate]);

  const handleReset = useCallback(() => {
    recordHistory("Reset All", initialEditState, [{
      id: uuidv4(),
      type: "image",
      name: "Background",
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      isLocked: true,
    }]);
    onProjectUpdate({
      selectedLayerId: null,
      pendingCrop: undefined,
      selectionPath: null,
      selectionMaskDataUrl: null,
      foregroundColor: "#000000",
      backgroundColor: "#FFFFFF",
    });
  }, [recordHistory, onProjectUpdate]);

  const jumpToHistory = useCallback((index: number) => {
    onHistoryUpdate(history, index, history[index].layers);
  }, [history, onHistoryUpdate]);

  /* ---------- Export / Copy ---------- */
  const handleDownload = useCallback((options: { format: string; quality: number; width: number; height: number; upscale: 1 | 2 | 4 }) => {
    if (!imgRef.current) return;
    downloadImage(
      { image: imgRef.current, layers: layers, ...currentState },
      options,
      stabilityApiKey
    );
  }, [currentState, layers, stabilityApiKey]);

  const handleCopy = useCallback(() => {
    if (!imgRef.current) return;
    copyImageToClipboard({ image: imgRef.current, layers: layers, ...currentState });
  }, [currentState, layers]);

  /* ---------- Generative fill ---------- */
  const applyGenerativeResult = useCallback(async (url: string, maskDataUrl: string | null) => {
    if (!imgRef.current || !dimensions) {
      showError("Image dimensions are required for generative fill.");
      return;
    }
    if (!maskDataUrl) {
      showError("A selection mask is required for generative fill.");
      return;
    }

    const toastId = showLoading("Applying generative fill...");

    try {
      const generatedImage = new Image();
      generatedImage.crossOrigin = "Anonymous";
      await new Promise((resolve, reject) => {
        generatedImage.onload = resolve;
        generatedImage.onerror = reject;
        generatedImage.src = url;
      });

      // Create a new drawing layer with the generated image and the provided mask
      const newLayer: Layer = {
        id: uuidv4(),
        type: "drawing",
        name: `Generative Fill ${layers.filter((l) => l.type === "drawing").length + 1}`,
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        dataUrl: generatedImage.src, // The full generated image
        maskDataUrl: maskDataUrl, // The feathered mask provided by the dialog
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        rotation: 0,
      };
      const updatedLayers = [...layers, newLayer];
      recordHistory("Generative Fill", currentState, updatedLayers);
      onProjectUpdate({ selectedLayerId: newLayer.id, selectionPath: null, selectionMaskDataUrl: null });
      dismissToast(toastId);
      showSuccess("Generative fill applied as a new layer.");
    } catch (e: any) {
      console.error(e);
      dismissToast(toastId);
      showError(e.message || "Generation failed.");
    }
  }, [imgRef, dimensions, layers, recordHistory, currentState, onProjectUpdate]);

  const setBrushState = useCallback((updates: Partial<Omit<BrushState, 'color'>>) => {
    onProjectUpdate({ brushStateInternal: { ...brushStateInternal, ...updates } });
  }, [brushStateInternal, onProjectUpdate]);

  const handleColorPick = useCallback((color: string) => {
    onProjectUpdate({ foregroundColor: color });
    setActiveTool('brush');
    showSuccess(`Color picked: ${color}`);
  }, [onProjectUpdate]);

  const handleForegroundColorChange = useCallback((color: string) => {
    onProjectUpdate({ foregroundColor: color });
  }, [onProjectUpdate]);

  const handleBackgroundColorChange = useCallback((color: string) => {
    onProjectUpdate({ backgroundColor: color });
  }, [onProjectUpdate]);

  const handleSwapColors = useCallback(() => {
    onProjectUpdate({ foregroundColor: backgroundColor, backgroundColor: foregroundColor });
    showSuccess("Colors swapped!");
  }, [foregroundColor, backgroundColor, onProjectUpdate]);

  /* ---------- Selective Blur Functions ---------- */
  const handleSelectiveBlurStroke = useCallback(async (strokeDataUrl: string, operation: 'add' | 'subtract') => {
    if (!imgRef.current || !dimensions) return;

    const imageDimensions = dimensions;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageDimensions.width;
    tempCanvas.height = imageDimensions.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const baseDataUrl = currentState.selectiveBlurMask;
    const strokeImg = new Image();

    const basePromise = baseDataUrl ? new Promise((res, rej) => { 
      const baseImg = new Image();
      baseImg.onload = () => { tempCtx.drawImage(baseImg, 0, 0); res(null); };
      baseImg.onerror = rej;
      baseImg.src = baseDataUrl; 
    }) : Promise.resolve();
    
    const strokePromise = new Promise((res, rej) => { strokeImg.onload = res; strokeImg.onerror = rej; strokeImg.src = strokeDataUrl; });

    await Promise.all([basePromise, strokePromise]);

    // Apply new stroke (grayscale mask)
    tempCtx.globalCompositeOperation = operation === 'add' ? 'source-over' : 'destination-out';
    tempCtx.drawImage(strokeImg, 0, 0);
    tempCtx.globalCompositeOperation = 'source-over'; 
    
    const combinedDataUrl = tempCanvas.toDataURL();
    
    const newState: EditState = {
      ...currentState,
      selectiveBlurMask: combinedDataUrl,
      selectiveBlurAmount: currentState.selectiveBlurStrength,
    };

    recordHistory("Apply Blur Brush Stroke", newState, layers);
  }, [currentState, dimensions, imgRef, recordHistory, layers]);

  const handleSelectiveBlurStrengthChange = useCallback((value: number) => {
    updateCurrentState({ selectiveBlurStrength: value });
  }, [updateCurrentState]);

  const handleSelectiveBlurStrengthCommit = useCallback((value: number) => {
    const newState = { ...currentState, selectiveBlurStrength: value, selectiveBlurAmount: value };
    recordHistory("Set Max Blur Strength", newState, layers);
  }, [currentState, recordHistory, layers]);


  /* ---------- Selection Brush Functions ---------- */
  const handleSelectionBrushStroke = useCallback(async (strokeDataUrl: string, operation: 'add' | 'subtract') => {
    if (!imgRef.current) return;

    const imageDimensions = { width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight };
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageDimensions.width;
    tempCanvas.height = imageDimensions.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw existing mask if any
    if (selectionMaskDataUrl) {
      const existingMask = new Image();
      await new Promise((res, rej) => { existingMask.onload = res; existingMask.onerror = rej; existingMask.src = selectionMaskDataUrl; });
      tempCtx.drawImage(existingMask, 0, 0);
    }

    // Apply new stroke
    const strokeImg = new Image();
    await new Promise((res, rej) => { strokeImg.onload = res; strokeImg.onerror = rej; strokeImg.src = strokeDataUrl; });

    tempCtx.globalCompositeOperation = operation === 'add' ? 'source-over' : 'destination-out';
    tempCtx.drawImage(strokeImg, 0, 0);
    tempCtx.globalCompositeOperation = 'source-over'; // Reset

    onProjectUpdate({ selectionMaskDataUrl: tempCanvas.toDataURL() });
  }, [imgRef, selectionMaskDataUrl, onProjectUpdate]);

  const clearSelectionMask = useCallback(() => {
    onProjectUpdate({ selectionMaskDataUrl: null, selectionPath: null });
    showSuccess("Selection cleared.");
  }, [onProjectUpdate]);

  const applyMaskToSelectionPath = useCallback(async () => {
    if (!selectionMaskDataUrl || !imgRef.current || !dimensions) {
      showError("No selection to apply.");
      return;
    }

    const toastId = showLoading("Applying selection...");

    try {
      const newSelectionPath = await maskToPolygon(selectionMaskDataUrl, dimensions.width, dimensions.height);
      
      if (newSelectionPath.length > 0) {
        onProjectUpdate({ selectionPath: newSelectionPath, selectionMaskDataUrl: null });
        dismissToast(toastId);
        showSuccess("Selection applied.");
        setActiveTool(null);
      } else {
        dismissToast(toastId);
        showError("No area selected with the brush.");
      }
    } catch (error: any) {
      dismissToast(toastId);
      console.error("Failed to convert mask to polygon:", error);
      showError(error.message || "Failed to apply selection.");
    }
  }, [selectionMaskDataUrl, imgRef, dimensions, onProjectUpdate]);

  const convertSelectionPathToMask = useCallback(async () => {
    if (!selectionPath || selectionPath.length < 2 || !dimensions) {
      showError("No polygonal selection to refine.");
      return;
    }

    const toastId = showLoading("Preparing selection for refinement...");
    try {
      const maskData = await polygonToMaskDataUrl(selectionPath, dimensions.width, dimensions.height);
      onProjectUpdate({ selectionMaskDataUrl: maskData });
      setActiveTool('selectionBrush');
      dismissToast(toastId);
      showSuccess("Selection ready for brush refinement.");
    } catch (error: any) {
      dismissToast(toastId);
      console.error("Failed to convert selection path to mask:", error);
      showError(error.message || "Failed to prepare selection for refinement.");
    }
  }, [selectionPath, dimensions, onProjectUpdate]);

  // New: Handle setting selection path and generating mask for visual feedback
  const setSelectionPathAndGenerateMask = useCallback(async (path: Point[] | null) => {
    onProjectUpdate({ selectionPath: path });
    if (path && path.length > 1 && dimensions) {
      try {
        const maskData = await polygonToMaskDataUrl(path, dimensions.width, dimensions.height);
        onProjectUpdate({ selectionMaskDataUrl: maskData });
      } catch (error) {
        console.error("Failed to generate mask from path:", error);
        onProjectUpdate({ selectionMaskDataUrl: null });
      }
    } else {
      onProjectUpdate({ selectionMaskDataUrl: null });
    }
  }, [dimensions, onProjectUpdate]);

  const applySelectionAsMask = useCallback(async () => {
    if (!selectedLayerId) {
      showError("Please select a layer to apply the mask to.");
      return;
    }
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer || selectedLayer.type === 'image') {
      showError("Cannot apply mask to the background layer.");
      return;
    }
    if (!selectionPath && !selectionMaskDataUrl) {
      showError("No active selection found.");
      return;
    }
    if (!dimensions) {
      showError("Image dimensions are required.");
      return;
    }

    const toastId = showLoading("Applying selection as layer mask...");
    
    let finalMaskDataUrl = selectionMaskDataUrl;

    // If we only have a polygonal path, convert it to a mask data URL first
    if (!finalMaskDataUrl && selectionPath && selectionPath.length > 1) {
      try {
        finalMaskDataUrl = await polygonToMaskDataUrl(selectionPath, dimensions.width, dimensions.height);
      } catch (error) {
        dismissToast(toastId);
        showError("Failed to generate mask from selection path.");
        return;
      }
    }

    if (finalMaskDataUrl) {
      const updatedLayers = layers.map(l => 
        l.id === selectedLayerId ? { ...l, maskDataUrl: finalMaskDataUrl } : l
      );
      onLayerUpdate(updatedLayers, `Apply Mask to Layer "${selectedLayer.name}".`);
      clearSelectionMask();
      dismissToast(toastId);
      showSuccess(`Selection applied as mask to layer "${selectedLayer.name}".`);
    } else {
      dismissToast(toastId);
      showError("Failed to create mask data.");
    }
  }, [selectedLayerId, layers, selectionPath, selectionMaskDataUrl, dimensions, onLayerUpdate, clearSelectionMask]);


  /* ---------- Keyboard shortcuts ---------- */
  useHotkeys("r", () => handleTransformChange("rotate-right"), { enabled: !!image, preventDefault: true });
  useHotkeys("shift+r", () => handleTransformChange("rotate-left"), { enabled: !!image, preventDefault: true });
  useHotkeys("h", () => handleTransformChange("flip-horizontal"), { enabled: !!image, preventDefault: true });
  useHotkeys("v", () => handleTransformChange("flip-vertical"), { enabled: !!image, preventDefault: true });
  useHotkeys("b", () => setActiveTool("brush"), { enabled: !!image });
  useHotkeys("e", () => setActiveTool("eraser"), { enabled: !!image });
  useHotkeys("t", () => setActiveTool("text"), { enabled: !!image });
  useHotkeys("l", () => setActiveTool("lasso"), { enabled: !!image });
  useHotkeys("c", () => setActiveTool("crop"), { enabled: !!image });
  useHotkeys("i", () => setActiveTool("eyedropper"), { enabled: !!image });
  useHotkeys("p", () => setActiveTool("shape"), { enabled: !!image });
  useHotkeys("m", () => setActiveTool("move"), { enabled: !!image });
  useHotkeys("g", () => setActiveTool("gradient"), { enabled: !!image });
  useHotkeys("s", () => setActiveTool("selectionBrush"), { enabled: !!image });
  useHotkeys("u", () => setActiveTool("blurBrush"), { enabled: !!image });
  useHotkeys("x", handleSwapColors, { enabled: true, preventDefault: true });
  useHotkeys("escape", () => {
    if (activeTool === 'crop') cancelCrop();
    else if (activeTool === 'selectionBrush') clearSelectionMask();
    else setActiveTool(null);
    if (selectionPath) onProjectUpdate({ selectionPath: null });
  }, { enabled: !!image, preventDefault: true });

  // Keyboard movement for selected layers
  const handleKeyboardMove = useCallback((dx: number, dy: number, speedMultiplier: number) => {
    if (selectedLayerId && (activeTool === 'move' || activeTool === null)) {
      const selectedLayer = layers.find(l => l.id === selectedLayerId);
      if (selectedLayer?.isLocked) return;

      // Find the selected layer and its parent container to calculate movement relative to its parent
      const findLayerAndParent = (
        id: string,
        currentLayers: Layer[],
        parent: Layer | null = null,
        path: Layer[] = []
      ): { layer: Layer | undefined; parent: Layer | null; path: Layer[] } => {
        for (const layer of currentLayers) {
          if (layer.id === id) {
            return { layer, parent, path: [...path, layer] };
          }
          if (layer.type === 'group' && layer.children) {
            const found = findLayerAndParent(id, layer.children, layer, [...path, layer]);
            if (found) return found;
          }
        }
        return { layer: undefined, parent: null, path: [] };
      };

      const { layer: layerToMove, parent: parentLayer } = findLayerAndParent(selectedLayerId, layers);

      if (layerToMove && (layerToMove.x !== undefined && layerToMove.y !== undefined)) {
        // Determine the effective dimensions of the parent container for percentage calculation
        let parentWidth = dimensions?.width || 1;
        let parentHeight = dimensions?.height || 1;

        if (parentLayer && parentLayer.type === 'group' && parentLayer.width && parentLayer.height) {
          // If the parent is a group, its dimensions are in percentage of the main image
          parentWidth = (parentLayer.width / 100) * (dimensions?.width || 1);
          parentHeight = (parentLayer.height / 100) * (dimensions?.height || 1);
        }

        const newX = (layerToMove.x ?? 0) + (dx * speedMultiplier / parentWidth) * 100;
        const newY = (layerToMove.y ?? 0) + (dy * speedMultiplier / parentHeight) * 100;
        
        updateLayer(selectedLayerId, { x: newX, y: newY });
      }
    }
  }, [selectedLayerId, activeTool, layers, dimensions, updateLayer]);

  useHotkeys("arrowup", (e) => handleKeyboardMove(0, -1, e.shiftKey ? 5 : 1), { preventDefault: true, enabled: !!image });
  useHotkeys("arrowdown", (e) => handleKeyboardMove(0, 1, e.shiftKey ? 5 : 1), { preventDefault: true, enabled: !!image });
  useHotkeys("arrowleft", (e) => handleKeyboardMove(-1, 0, e.shiftKey ? 5 : 1), { preventDefault: true, enabled: !!image });
  useHotkeys("arrowright", (e) => handleKeyboardMove(1, 0, e.shiftKey ? 5 : 1), { preventDefault: true, enabled: !!image });


  const canUndo = currentHistoryIndex > 0;
  const canRedo = currentHistoryIndex < history.length - 1;

  // Combine brushStateInternal with foregroundColor for the exposed brushState
  const brushState: BrushState = {
    ...brushStateInternal,
    color: foregroundColor,
  };

  return {
    image,
    imgRef,
    dimensions,
    fileInfo,
    exifData,
    currentState,
    history,
    currentHistoryIndex,
    aspect,
    canUndo,
    canRedo,
    handleFileSelect,
    handleUrlImageLoad,
    handleGeneratedImageLoad,
    handleNewProject,
    handleNewFromClipboard,
    handleSaveProject,
    handleLoadProject,
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
    pendingCrop,
    setPendingCrop: (crop) => onProjectUpdate({ pendingCrop: crop }),
    applyCrop,
    cancelCrop,
    handleReset,
    handleUndo,
    handleRedo,
    jumpToHistory,
    handleDownload,
    handleCopy,
    setAspect: (aspect) => onProjectUpdate({ aspect }),
    // Layer utilities
    layers,
    selectedLayerId,
    setSelectedLayer: (id) => onProjectUpdate({ selectedLayerId: id }),
    addTextLayer: (coords) => addTextLayer(coords, foregroundColor),
    addDrawingLayer,
    addShapeLayer: (coords, shapeType, initialWidth, initialHeight) => addShapeLayer(coords, shapeType, initialWidth, initialHeight, foregroundColor, backgroundColor),
    addGradientLayer,
    addAdjustmentLayer,
    toggleLayerVisibility,
    renameLayer,
    deleteLayer,
    duplicateLayer,
    mergeLayerDown,
    rasterizeLayer,
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
    activeTool: initialProject.activeTool,
    setActiveTool,
    // Brush state
    brushState,
    setBrushState,
    handleColorPick,
    // Gradient tool state
    gradientToolState,
    setGradientToolState: (state) => onProjectUpdate({ gradientToolState: state }),
    // Generative
    applyGenerativeResult,
    // Selection
    selectionPath,
    setSelectionPath: setSelectionPathAndGenerateMask,
    selectionMaskDataUrl,
    handleSelectionBrushStroke,
    clearSelectionMask,
    applyMaskToSelectionPath,
    convertSelectionPathToMask,
    // Selective Blur
    handleSelectiveBlurStroke,
    handleSelectiveBlurStrengthChange,
    handleSelectiveBlurStrengthCommit,
    // Shape tool
    selectedShapeType,
    setSelectedShapeType: (type) => onProjectUpdate({ selectedShapeType: type }),
    // Foreground/Background Colors
    foregroundColor,
    handleForegroundColorChange,
    backgroundColor,
    handleBackgroundColorChange,
    handleSwapColors,
    // Template loading
    loadTemplateData,
    // Layer Masking
    applySelectionAsMask,
    // Presets & History
    applyPreset, // <-- FIX 5: Ensure applyPreset is exposed
    recordHistory, // <-- FIX 6, 7, 8: Expose recordHistory
    // Fonts
    // These are global and managed in Index.tsx, not per-project state
    systemFonts: [],
    setSystemFonts: () => {},
    customFonts: [],
    setCustomFonts: () => {},
    // Expose loadImageData for Index.tsx template loading logic
    loadImageData,
  };
};