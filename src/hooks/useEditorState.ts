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
import { polygonToMaskDataUrl } from "@/utils/maskUtils"; // Import the new utility
import type { TemplateData } from "../types/template"; // Import TemplateData
import { useSettings } from "./useSettings"; // NEW import

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
  selectiveBlurMask: string | null; // NEW: Data URL of the blur mask (grayscale)
  selectiveBlurAmount: number; // NEW: Max blur amount (0-100)
  selectiveBlurStrength: number; // NEW: Max blur strength (0-100)
}

export interface Point {
  x: number;
  y: number;
}

/** Layer definition */
export interface Layer {
  id: string;
  type: "image" | "text" | "drawing" | "smart-object" | "vector-shape" | "group" | "gradient"; // Added 'group' and 'gradient' type
  name: string;
  visible: boolean;
  opacity?: number;
  blendMode?: string;
  // Text layer specific properties
  content?: string;
  // Drawing layer specific properties
  dataUrl?: string;
  maskDataUrl?: string; // New: Mask for drawing layers
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

export type ActiveTool = "lasso" | "brush" | "text" | "crop" | "eraser" | "eyedropper" | "shape" | "move" | "gradient" | "selectionBrush" | "blurBrush"; // ADDED blurBrush

/* ---------- Initial state ---------- */
const defaultCurve = [{ x: 0, y: 0 }, { x: 255, y: 255 }];
const initialCurvesState = {
  all: [...defaultCurve],
  r: [...defaultCurve],
  g: [...defaultCurve],
  b: [...defaultCurve],
};

const initialHslAdjustment: HslAdjustment = { hue: 0, saturation: 100, luminance: 0 };

const initialEditState: EditState = {
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
  selectiveBlurMask: null, // ADDED
  selectiveBlurAmount: 0,  // ADDED
  selectiveBlurStrength: 50, // NEW: Initialize to 50%
};

const initialBrushState: Omit<BrushState, 'color'> = { // Removed color from initial state
  size: 50,
  opacity: 100,
  hardness: 50, // Default hardness (0-100)
  smoothness: 0, // Default smoothness (0-100)
  shape: 'circle', // Default brush shape
};

const initialGradientToolState: GradientToolState = {
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
const initialLayerState: Layer[] = [
  {
    id: uuidv4(),
    type: "image",
    name: "Background",
    visible: true,
    opacity: 100,
    blendMode: 'normal',
  },
];

const initialHistoryItem: HistoryItem = {
  name: "Initial State",
  state: initialEditState,
  layers: initialLayerState,
};

/* ---------- Hook implementation ---------- */
export const useEditorState = () => {
  const { geminiApiKey, stabilityApiKey } = useSettings(); // NEW: Destructure keys
  
  const [image, setImage] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [exifData, setExifData] = useState<any | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([initialHistoryItem]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>();
  const [isPreviewingOriginal, setIsPreviewingOriginal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTool, _setActiveTool] = useState<ActiveTool | null>(null);
  const [brushStateInternal, setBrushStateInternal] = useState<Omit<BrushState, 'color'>>(initialBrushState); // Renamed to avoid conflict
  const [gradientToolState, setGradientToolState] = useState<GradientToolState>(initialGradientToolState);
  const [pendingCrop, setPendingCrop] = useState<Crop | undefined>();
  const [selectionPath, _setSelectionPath] = useState<Point[] | null>(null); // Renamed internal setter
  const [selectionMaskDataUrl, setSelectionMaskDataUrl] = useState<string | null>(null); // New state for selection mask
  const [selectedShapeType, setSelectedShapeType] = useState<Layer['shapeType'] | null>('rect'); // Default to rectangle
  const imgRef = useRef<HTMLImageElement>(null);

  // New color states
  const [foregroundColor, setForegroundColor] = useState<string>("#000000");
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");

  const currentState = history[currentHistoryIndex].state;
  const currentLayers = history[currentHistoryIndex].layers; // Get layers from history

  /* ---------- History helpers ---------- */
  const recordHistory = useCallback(
    (name: string, state: EditState, layers: Layer[] = currentLayers) => {
      const newHistory = history.slice(0, currentHistoryIndex + 1);
      setHistory([...newHistory, { name, state, layers }]);
      setCurrentHistoryIndex(newHistory.length);
    },
    [history, currentHistoryIndex, currentLayers]
  );

  const updateCurrentState = useCallback(
    (updates: Partial<EditState>) => {
      const newState = { ...currentState, ...updates };
      const newHistory = [...history];
      newHistory[currentHistoryIndex] = { ...newHistory[currentHistoryIndex], state: newState };
      setHistory(newHistory);
    },
    [currentState, history, currentHistoryIndex]
  );

  const updateCurrentLayersInHistory = useCallback(
    (layers: Layer[]) => {
      const newHistory = [...history];
      newHistory[currentHistoryIndex] = { ...newHistory[currentHistoryIndex], layers };
      setHistory(newHistory);
    },
    [history, currentHistoryIndex]
  );

  const {
    layers,
    setLayers,
    selectedLayerId,
    setSelectedLayerId,
    addTextLayer,
    addDrawingLayer,
    addShapeLayer,
    addGradientLayer, // Added addGradientLayer
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
    groupLayers, // Added groupLayers
    toggleGroupExpanded, // Added toggleGroupExpanded
    handleDrawingStrokeEnd, // Destructure the new drawing stroke handler
  } = useLayers({
    currentEditState: currentState,
    recordHistory: (name, state, layers) => recordHistory(name, state, layers),
    updateCurrentState,
    imgRef,
    imageNaturalDimensions: dimensions,
    gradientToolState, // Pass gradientToolState to useLayers
    activeTool, // Pass activeTool to useLayers
  });

  // Sync layers from useLayers back to history when they change
  React.useEffect(() => {
    if (layers !== currentLayers) {
      updateCurrentLayersInHistory(layers);
    }
  }, [layers, currentLayers, updateCurrentLayersInHistory]);

  const setActiveTool = (tool: ActiveTool | null) => {
    // Clear selection states if switching away from selection tools
    if (tool !== 'lasso' && tool !== 'selectionBrush') {
      _setSelectionPath(null); // Use the internal setter directly
      setSelectionMaskDataUrl(null);
    }
    // Clear pending crop if switching away from crop tool
    if (tool !== 'crop' && activeTool === 'crop') {
      setPendingCrop(undefined);
    }
    // Clear selective blur mask if switching away from blur brush
    if (tool !== 'blurBrush' && currentState.selectiveBlurMask) {
      recordHistory("Clear Blur Mask", { ...currentState, selectiveBlurMask: null, selectiveBlurAmount: 0, selectiveBlurStrength: 50 }, layers);
    }
    
    _setActiveTool(tool);
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
  const handleImageLoad = useCallback(() => {
    if (imgRef.current) {
      setDimensions({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight,
      });
    }
  }, []);

  const loadImageData = useCallback((dataUrl: string, successMsg: string, initialLayers: Layer[], initialDimensions?: { width: number; height: number }) => {
    setImage(dataUrl);
    if (initialDimensions) {
      setDimensions(initialDimensions); // Set dimensions immediately if provided
    }
    const newHistoryItem = { ...initialHistoryItem, name: "Load Image", layers: initialLayers };
    setHistory([newHistoryItem]);
    setCurrentHistoryIndex(0);
    setLayers(initialLayers);
    setSelectedLayerId(initialLayers.length > 1 ? initialLayers[initialLayers.length - 1].id : null);
    setPendingCrop(undefined);
    _setSelectionPath(null); // Clear selection path on new image load
    setSelectionMaskDataUrl(null); // Clear mask on new image load
    showSuccess(successMsg);
  }, [setLayers, setSelectedLayerId]);

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
      
      // FIX: Set dimensions immediately
      setDimensions({ width, height });

      loadImageData(dataUrl, "New project created.", [{
        id: uuidv4(),
        type: "image",
        name: "Background",
        visible: true,
        opacity: 100,
        blendMode: 'normal',
      }], { width, height });
      setFileInfo({ name: "Untitled-1.png", size: 0 });
      setExifData(null);
    } else {
      showError("Failed to create canvas for new project.");
    }
  }, [loadImageData]);

  const handleGeneratedImageLoad = useCallback((dataUrl: string) => {
    // We need to load the image first to get dimensions before calling loadImageData
    const img = new Image();
    img.onload = () => {
      const initialDimensions = { width: img.naturalWidth, height: img.naturalHeight };
      setDimensions(initialDimensions); // Set dimensions immediately
      loadImageData(dataUrl, "New image generated successfully.", [{
        id: uuidv4(),
        type: "image",
        name: "Background",
        visible: true,
        opacity: 100,
        blendMode: 'normal',
      }], initialDimensions);
      setFileInfo({ name: "generated-image.png", size: 0 });
      setExifData(null);
    };
    img.src = dataUrl;
  }, [loadImageData]);

  const handleFileSelect = useCallback((file: File | undefined) => {
    if (!file) return;
    const toastId = showLoading("Uploading file...");
    const fileNameLower = file.name.toLowerCase();

    if (fileNameLower.endsWith('.psd')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const psd = readPsd(reader.result as ArrayBuffer);
          const compositeImageUrl = psd.canvas.toDataURL();
          
          const importedLayers: Layer[] = [
            { id: uuidv4(), type: "image", name: "Background", visible: true, opacity: 100, blendMode: 'normal' }
          ];

          // Process PSD layers and convert unsupported ones to flattened layers
          const processPsdLayers = (psdLayers: any[], parentGroup: any = null) => {
            psdLayers.forEach((psdLayer, index) => {
              // Skip hidden layers
              if (psdLayer.hidden) return;
              
              // Handle group layers
              if (psdLayer.children) {
                processPsdLayers(psdLayer.children, psdLayer);
                return;
              }
              
              // Skip adjustment layers and other unsupported types
              if (psdLayer.adjustment || psdLayer.type === 'smartObject') {
                // Convert to flattened layer
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
                    };
                    importedLayers.push(newLayer);
                  }
                }
                return;
              }
              
              // Handle regular layers
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
                    name: psdLayer.name || 'Layer',
                    visible: !psdLayer.hidden,
                    opacity: (psdLayer.opacity ?? 1) * 100,
                    blendMode: psdLayer.blendMode || 'normal',
                    dataUrl: fullCanvas.toDataURL(),
                  };
                  importedLayers.push(newLayer);
                }
              }
            });
          };

          if (psd.children) {
            processPsdLayers(psd.children);
          }

          dismissToast(toastId);
          // FIX: Set dimensions immediately
          setDimensions({ width: psd.width, height: psd.height });
          loadImageData(compositeImageUrl, "PSD file imported with layers.", importedLayers, { width: psd.width, height: psd.height });
          setFileInfo({ name: file.name, size: file.size });
          setExifData(null);
        } catch (e) {
          console.error("Failed to parse PSD:", e);
          dismissToast(toastId);
          showError("Could not read the PSD file. It may be corrupt or an unsupported version.");
        }
      };
      reader.onerror = () => {
        dismissToast(toastId);
        showError("Failed to read the file.");
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    
    if (fileNameLower.endsWith('.ai') || fileNameLower.endsWith('.cdr')) {
      // --- STUB: Complex Vector Import ---
      const reader = new FileReader();
      reader.onloadend = () => {
        // Simulate parsing and flattening into a single raster layer
        const dataUrl = reader.result as string;
        
        // We need dimensions to create the canvas, so we rely on the browser to load the image first
        const tempImg = new Image();
        tempImg.onload = () => {
          const width = tempImg.naturalWidth;
          const height = tempImg.naturalHeight;
          const initialDimensions = { width, height };
          
          const newLayer: Layer = {
            id: uuidv4(),
            type: 'drawing',
            name: `${file.name} (Flattened)`,
            visible: true,
            opacity: 100,
            blendMode: 'normal',
            dataUrl: dataUrl,
          };
          
          dismissToast(toastId);
          // FIX: Set dimensions immediately
          setDimensions(initialDimensions);
          loadImageData(dataUrl, `${file.name} imported. Vector objects flattened to raster layers.`, [
            { id: uuidv4(), type: "image", name: "Background", visible: true, opacity: 100, blendMode: 'normal' },
            newLayer
          ], initialDimensions);
          setFileInfo({ name: file.name, size: file.size });
          setExifData(null);
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
      showError("Invalid file type. Please upload an image, .psd, .ai, or .cdr file.");
      return;
    }
    setDimensions(null);
    setFileInfo({ name: file.name, size: file.size });
    setExifData(null);
    ExifReader.load(file).then(setExifData).catch(() => setExifData(null));

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const initialDimensions = { width: img.naturalWidth, height: img.naturalHeight };
        dismissToast(toastId);
        // FIX: Set dimensions immediately
        setDimensions(initialDimensions);
        loadImageData(dataUrl, "Image uploaded successfully.", [{
          id: uuidv4(),
          type: "image",
          name: "Background",
          visible: true,
          opacity: 100,
          blendMode: 'normal',
        }], initialDimensions);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      dismissToast(toastId);
      showError("Failed to read the image file.");
    };
    reader.readAsDataURL(file);
  }, [loadImageData]);

  const handleUrlImageLoad = useCallback(async (url: string) => {
    const toastId = showLoading("Loading image from URL...");
    try {
      setDimensions(null);
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
      setFileInfo({ name: file.name, size: file.size });
      setExifData(null);
      ExifReader.load(file).then(setExifData).catch(() => setExifData(null));

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const initialDimensions = { width: img.naturalWidth, height: img.naturalHeight };
          dismissToast(toastId);
          // FIX: Set dimensions immediately
          setDimensions(initialDimensions);
          loadImageData(dataUrl, "Image loaded successfully.", [{
            id: uuidv4(),
            type: "image",
            name: "Background",
            visible: true,
            opacity: 100,
            blendMode: 'normal',
          }], initialDimensions);
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
  }, [loadImageData]);

  const handleNewFromClipboard = useCallback(async () => {
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
        handleFileSelect(file);
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
    const { editState, layers: templateLayers, dimensions: templateDimensions } = templateData;
    
    // 1. Create a blank canvas based on template dimensions
    const canvas = document.createElement('canvas');
    canvas.width = templateDimensions.width;
    canvas.height = templateDimensions.height;
    const dataUrl = canvas.toDataURL('image/png');

    // 2. Reset history and set base image (transparent canvas)
    // FIX: Set dimensions immediately
    setDimensions(templateDimensions);
    
    // 3. Apply template layers and edit state
    const newState = { ...initialEditState, ...editState };
    const newHistoryItem = { name: "Load Template", state: newState, layers: templateLayers };
    
    setHistory([newHistoryItem]);
    setCurrentHistoryIndex(0);
    setLayers(templateLayers);
    setSelectedLayerId(null);
    setPendingCrop(undefined);
    _setSelectionPath(null);
    setSelectionMaskDataUrl(null);
    
    // 4. Set aspect ratio if available
    setAspect(templateDimensions.width / templateDimensions.height);
    
    // 5. Load image data (which now uses the pre-set dimensions)
    loadImageData(dataUrl, "Template loaded successfully.", templateLayers, templateDimensions);

  }, [setLayers, setSelectedLayerId, setDimensions, setAspect, loadImageData]);

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
      
      setImage(projectData.sourceImage);
      setHistory(projectData.history);
      setCurrentHistoryIndex(projectData.currentHistoryIndex);
      setFileInfo(projectData.fileInfo);
      
      setExifData(null);
      setSelectedLayerId(null);
      setLayers(projectData.history[projectData.currentHistoryIndex].layers);
      setPendingCrop(undefined);
      _setSelectionPath(null); // Clear selection path on project load
      setSelectionMaskDataUrl(null); // Clear mask on project load
      
      // FIX: Load image to get dimensions before setting state
      const img = new Image();
      img.onload = () => {
        const initialDimensions = { width: img.naturalWidth, height: img.naturalHeight };
        setDimensions(initialDimensions);
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
  }, [setSelectedLayerId, setLayers]);

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
    setPendingCrop(undefined);
    setActiveTool(null);
  }, [currentState, recordHistory, pendingCrop, layers]);

  const cancelCrop = useCallback(() => {
    setPendingCrop(undefined);
    setActiveTool(null);
  }, []);

  /* ---------- Undo / Redo / Reset ---------- */
  const handleUndo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(currentHistoryIndex - 1);
      setLayers(history[currentHistoryIndex - 1].layers);
    }
  }, [currentHistoryIndex, history, setLayers]);

  const handleRedo = useCallback(() => {
    if (currentHistoryIndex < history.length - 1) {
      setCurrentHistoryIndex(currentHistoryIndex + 1);
      setLayers(history[currentHistoryIndex + 1].layers);
    }
  }, [currentHistoryIndex, history.length, history, setLayers]);

  const handleReset = useCallback(() => {
    recordHistory("Reset All", initialEditState, [{
      id: uuidv4(),
      type: "image",
      name: "Background",
      visible: true,
      opacity: 100,
      blendMode: 'normal',
    }]);
    setSelectedLayerId(null);
    setPendingCrop(undefined);
    _setSelectionPath(null); // Clear selection path on reset
    setSelectionMaskDataUrl(null); // Clear mask on reset
    setForegroundColor("#000000"); // Reset foreground color
    setBackgroundColor("#FFFFFF"); // Reset background color
  }, [recordHistory, setSelectedLayerId]);

  const jumpToHistory = useCallback((index: number) => {
    setCurrentHistoryIndex(index);
    setLayers(history[index].layers);
  }, [history, setLayers]);

  /* ---------- Export / Copy ---------- */
  const handleDownload = useCallback((options: { format: string; quality: number; width: number; height: number; upscale: 1 | 2 | 4 }) => {
    if (!imgRef.current) return;
    downloadImage(
      { image: imgRef.current, layers: layers, ...currentState },
      options,
      stabilityApiKey // Pass stability API key
    );
  }, [currentState, layers, stabilityApiKey]);

  const handleCopy = useCallback(() => {
    if (!imgRef.current) return;
    copyImageToClipboard({ image: imgRef.current, layers: layers, ...currentState });
  }, [currentState, layers]);

  /* ---------- Generative fill ---------- */
  const applyGenerativeResult = useCallback(async (url: string, maskDataUrl: string | null) => { // Updated signature
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
      };
      const updatedLayers = [...layers, newLayer];
      recordHistory("Generative Fill", currentState, updatedLayers);
      setSelectedLayerId(newLayer.id);
      _setSelectionPath(null); // Clear the selection path
      setSelectionMaskDataUrl(null); // Clear the selection mask overlay
      dismissToast(toastId);
      showSuccess("Generative fill applied as a new layer.");
    } catch (e: any) {
      console.error(e);
      dismissToast(toastId);
      showError(e.message || "Generation failed.");
    }
  }, [imgRef, dimensions, layers, recordHistory, currentState, setSelectedLayerId]);

  const setBrushState = useCallback((updates: Partial<Omit<BrushState, 'color'>>) => {
    setBrushStateInternal(prev => ({ ...prev, ...updates }));
  }, []);

  const handleColorPick = useCallback((color: string) => {
    setForegroundColor(color);
    _setActiveTool('brush');
    showSuccess(`Color picked: ${color}`);
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
    showSuccess("Colors swapped!");
  }, [foregroundColor, backgroundColor]);

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
      selectiveBlurAmount: currentState.selectiveBlurStrength, // Use the dedicated strength value
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

    setSelectionMaskDataUrl(tempCanvas.toDataURL());
  }, [imgRef, selectionMaskDataUrl]);

  const clearSelectionMask = useCallback(() => {
    setSelectionMaskDataUrl(null);
    _setSelectionPath(null); // Use the internal setter directly
    showSuccess("Selection cleared.");
  }, []);

  const applyMaskToSelectionPath = useCallback(async () => {
    if (!selectionMaskDataUrl || !imgRef.current || !dimensions) {
      showError("No selection to apply.");
      return;
    }

    const toastId = showLoading("Applying selection...");

    try {
      const newSelectionPath = await maskToPolygon(selectionMaskDataUrl, dimensions.width, dimensions.height);
      
      if (newSelectionPath.length > 0) {
        _setSelectionPath(newSelectionPath); // Use the internal setter directly
        setSelectionMaskDataUrl(null); // Clear the mask overlay after applying
        dismissToast(toastId);
        showSuccess("Selection applied.");
        setActiveTool(null); // Deactivate tool after applying
      } else {
        dismissToast(toastId);
        showError("No area selected with the brush.");
      }
    } catch (error: any) {
      dismissToast(toastId);
      console.error("Failed to convert mask to polygon:", error);
      showError(error.message || "Failed to apply selection.");
    }
  }, [selectionMaskDataUrl, imgRef, dimensions]);

  const convertSelectionPathToMask = useCallback(async () => {
    if (!selectionPath || selectionPath.length < 2 || !dimensions) {
      showError("No polygonal selection to refine.");
      return;
    }

    const toastId = showLoading("Preparing selection for refinement...");
    try {
      const maskData = await polygonToMaskDataUrl(selectionPath, dimensions.width, dimensions.height);
      setSelectionMaskDataUrl(maskData);
      setActiveTool('selectionBrush');
      dismissToast(toastId);
      showSuccess("Selection ready for brush refinement.");
    } catch (error: any) {
      dismissToast(toastId);
      console.error("Failed to convert selection path to mask:", error);
      showError(error.message || "Failed to prepare selection for refinement.");
    }
  }, [selectionPath, dimensions]);

  // New: Handle setting selection path and generating mask for visual feedback
  const setSelectionPathAndGenerateMask = useCallback(async (path: Point[] | null) => {
    _setSelectionPath(path); // Use the internal setter
    if (path && path.length > 1 && dimensions) {
      try {
        const maskData = await polygonToMaskDataUrl(path, dimensions.width, dimensions.height);
        setSelectionMaskDataUrl(maskData);
      } catch (error) {
        console.error("Failed to generate mask from path:", error);
        setSelectionMaskDataUrl(null);
      }
    } else {
      setSelectionMaskDataUrl(null);
    }
  }, [dimensions]);

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
      recordHistory(`Apply Mask to Layer "${selectedLayer.name}"`, currentState, updatedLayers);
      clearSelectionMask();
      dismissToast(toastId);
      showSuccess(`Selection applied as mask to layer "${selectedLayer.name}".`);
    } else {
      dismissToast(toastId);
      showError("Failed to create mask data.");
    }
  }, [selectedLayerId, layers, selectionPath, selectionMaskDataUrl, dimensions, recordHistory, currentState, clearSelectionMask]);


  /* ---------- Keyboard shortcuts ---------- */
  useHotkeys("ctrl+z, cmd+z", handleUndo, { preventDefault: true });
  useHotkeys("ctrl+y, cmd+shift+z", handleRedo, { preventDefault: true });
  useHotkeys(
    "ctrl+s, cmd+s",
    (e) => {
      e.preventDefault();
      if (image) setIsExporting(true);
    },
    { enabled: !!image, preventDefault: true } // Ensure preventDefault is true
  );
  useHotkeys(
    "ctrl+c, cmd+c", // Added Ctrl+C / Cmd+C for copy
    (e) => {
      e.preventDefault();
      handleCopy();
    },
    { enabled: !!image, preventDefault: true }
  );
  useHotkeys(
    "ctrl+v, cmd+v", // Added Ctrl+V / Cmd+V for paste
    (e) => {
      e.preventDefault();
      // Paste logic is handled by a global event listener in Index.tsx
      // This hotkey just ensures the default browser paste is prevented.
    },
    { enabled: true, preventDefault: true } // Always prevent default for paste
  );
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
  useHotkeys("g", () => setActiveTool("gradient"), { enabled: !!image }); // Added shortcut for gradient tool
  useHotkeys("s", () => setActiveTool("selectionBrush"), { enabled: !!image }); // Shortcut for selection brush
  useHotkeys("u", () => setActiveTool("blurBrush"), { enabled: !!image }); // NEW Shortcut for blur brush
  useHotkeys("x", handleSwapColors, { enabled: true, preventDefault: true }); // Shortcut to swap foreground/background colors
  useHotkeys("escape", () => {
    if (activeTool === 'crop') cancelCrop();
    else if (activeTool === 'selectionBrush') clearSelectionMask();
    else setActiveTool(null);
    if (selectionPath) _setSelectionPath(null); // Use the internal setter directly
  }, { enabled: !!image, preventDefault: true }); // Ensure escape prevents default

  // Keyboard movement for selected layers
  const handleKeyboardMove = useCallback((dx: number, dy: number, speedMultiplier: number) => {
    if (selectedLayerId && (activeTool === 'move' || activeTool === null)) {
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

      const { layer: selectedLayer, parent: parentLayer } = findLayerAndParent(selectedLayerId, layers);

      if (selectedLayer && (selectedLayer.x !== undefined && selectedLayer.y !== undefined)) {
        // Determine the effective dimensions of the parent container for percentage calculation
        let parentWidth = dimensions?.width || 1;
        let parentHeight = dimensions?.height || 1;

        if (parentLayer && parentLayer.type === 'group' && parentLayer.width && parentLayer.height) {
          // If the parent is a group, its dimensions are in percentage of the main image
          parentWidth = (parentLayer.width / 100) * (dimensions?.width || 1);
          parentHeight = (parentLayer.height / 100) * (dimensions?.height || 1);
        }

        const newX = (selectedLayer.x ?? 0) + (dx * speedMultiplier / parentWidth) * 100;
        const newY = (selectedLayer.y ?? 0) + (dy * speedMultiplier / parentHeight) * 100;
        
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
    handleImageLoad,
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
    handleRotationChange, // Exposed for continuous rotation
    handleRotationCommit, // Exposed for continuous rotation commit
    handleFramePresetChange,
    handleFramePropertyChange,
    handleFramePropertyCommit,
    pendingCrop,
    setPendingCrop,
    applyCrop,
    cancelCrop,
    handleReset,
    handleUndo,
    handleRedo,
    jumpToHistory,
    handleDownload,
    handleCopy,
    setAspect,
    isPreviewingOriginal,
    setIsPreviewingOriginal,
    isExporting,
    setIsExporting,
    applyPreset,
    // Layer utilities from useLayers
    layers,
    selectedLayerId,
    setSelectedLayer: setSelectedLayerId,
    addTextLayer,
    addDrawingLayer,
    addShapeLayer,
    addGradientLayer,
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
    handleDrawingStrokeEnd, // EXPOSED: The new drawing stroke handler
    // Tool state
    activeTool,
    setActiveTool,
    // Brush state
    brushState,
    setBrushState, // Now takes Partial<Omit<BrushState, 'color'>>
    handleColorPick,
    // Gradient tool state
    gradientToolState,
    setGradientToolState,
    // Generative
    applyGenerativeResult,
    // Selection
    selectionPath,
    setSelectionPath: setSelectionPathAndGenerateMask, // Use the new function for lasso
    selectionMaskDataUrl, // Exposed selection mask
    handleSelectionBrushStroke, // Exposed selection brush stroke handler
    clearSelectionMask, // Exposed clear selection mask handler
    applyMaskToSelectionPath, // Exposed apply mask to selection path handler
    convertSelectionPathToMask, // Exposed convert selection path to mask handler
    // Selective Blur
    handleSelectiveBlurStroke, // NEW export
    handleSelectiveBlurStrengthChange, // NEW export
    handleSelectiveBlurStrengthCommit, // NEW export
    // Shape tool
    selectedShapeType,
    setSelectedShapeType,
    // Foreground/Background Colors
    foregroundColor,
    handleForegroundColorChange,
    backgroundColor,
    handleBackgroundColorChange,
    handleSwapColors,
    // Template loading
    loadTemplateData,
    // Layer Masking
    applySelectionAsMask, // NEW export
  };
};