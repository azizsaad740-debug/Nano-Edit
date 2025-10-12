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
  // Smart object properties
  smartObjectData?: {
    layers: Layer[];
    width: number;
    height: number;
  };
  // Group layer properties
  children?: Layer[]; // For 'group' type
  expanded?: boolean; // For 'group' type
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
}

export interface HistoryItem {
  name: string;
  state: EditState;
  layers: Layer[];
}

export interface BrushState {
  size: number;
  opacity: number;
  color: string;
  hardness: number; // Added hardness
  smoothness: number; // Added smoothness
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

export type ActiveTool = "lasso" | "brush" | "text" | "crop" | "eraser" | "eyedropper" | "shape" | "move" | "gradient"; // Added 'gradient' tool

/* ---------- Initial state ---------- */
const defaultCurve = [{ x: 0, y: 0 }, { x: 255, y: 255 }];
const initialCurvesState = {
  all: [...defaultCurve],
  r: [...defaultCurve],
  g: [...defaultCurve],
  b: [...defaultCurve],
};

const initialEditState: EditState = {
  adjustments: { brightness: 100, contrast: 100, saturation: 100 },
  effects: { blur: 0, hueShift: 0, vignette: 0, noise: 0, sharpen: 0, clarity: 0 },
  grading: { grayscale: 0, sepia: 0, invert: 0 },
  channels: { r: true, g: true, b: true },
  curves: initialCurvesState,
  selectedFilter: "",
  transforms: { rotation: 0, scaleX: 1, scaleY: 1 },
  frame: { type: 'none', width: 0, color: '#000000' },
  crop: undefined,
};

const initialHistoryItem: HistoryItem = {
  name: "Initial State",
  state: initialEditState,
  layers: [], // Layers will be managed by useLayers
};

const initialBrushState: BrushState = {
  size: 50,
  opacity: 100,
  color: "#ff0000",
  hardness: 50, // Default hardness (0-100)
  smoothness: 0, // Default smoothness (0-100)
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

/* ---------- Hook implementation ---------- */
export const useEditorState = () => {
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
  const [brushState, setBrushState] = useState<BrushState>(initialBrushState);
  const [gradientToolState, setGradientToolState] = useState<GradientToolState>(initialGradientToolState);
  const [pendingCrop, setPendingCrop] = useState<Crop | undefined>();
  const [selectionPath, setSelectionPath] = useState<Point[] | null>(null);
  const [selectedShapeType, setSelectedShapeType] = useState<Layer['shapeType'] | null>('rect'); // Default to rectangle
  const imgRef = useRef<HTMLImageElement>(null);

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
  } = useLayers({
    currentEditState: currentState,
    recordHistory: (name, state, layers) => recordHistory(name, state, layers),
    updateCurrentState,
    imgRef,
    imageNaturalDimensions: dimensions,
    gradientToolState, // Pass gradientToolState to useLayers
  });

  // Sync layers from useLayers back to history when they change
  React.useEffect(() => {
    if (layers !== currentLayers) {
      updateCurrentLayersInHistory(layers);
    }
  }, [layers, currentLayers, updateCurrentLayersInHistory]);

  const setActiveTool = (tool: ActiveTool | null) => {
    if (tool !== 'lasso') {
      setSelectionPath(null);
    }

    // Handle entering/leaving crop mode
    if (tool === 'crop') {
      // Entering crop mode
      setPendingCrop(currentState.crop || { unit: '%', width: 50, height: 50, x: 25, y: 25 });
    } else if (activeTool === 'crop') {
      // Leaving crop mode (since tool is not 'crop' here)
      setPendingCrop(undefined);
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

  const loadImageData = useCallback((dataUrl: string, successMsg: string, initialLayers: Layer[]) => {
    setImage(dataUrl);
    const newHistoryItem = { ...initialHistoryItem, layers: initialLayers };
    setHistory([newHistoryItem]);
    setCurrentHistoryIndex(0);
    setLayers(initialLayers);
    setSelectedLayerId(initialLayers.length > 1 ? initialLayers[initialLayers.length - 1].id : null);
    setPendingCrop(undefined);
    setSelectionPath(null);
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
      loadImageData(dataUrl, "New project created.", [{
        id: uuidv4(),
        type: "image",
        name: "Background",
        visible: true,
        opacity: 100,
        blendMode: 'normal',
      }]);
      setFileInfo({ name: "Untitled-1.png", size: 0 });
      setExifData(null);
    } else {
      showError("Failed to create canvas for new project.");
    }
  }, [loadImageData]);

  const handleGeneratedImageLoad = useCallback((dataUrl: string) => {
    loadImageData(dataUrl, "New image generated successfully.", [{
      id: uuidv4(),
      type: "image",
      name: "Background",
      visible: true,
      opacity: 100,
      blendMode: 'normal',
    }]);
    setFileInfo({ name: "generated-image.png", size: 0 });
    setExifData(null);
  }, [loadImageData]);

  const handleFileSelect = useCallback((file: File | undefined) => {
    if (!file) return;
    const toastId = showLoading("Uploading file...");

    if (file.name.toLowerCase().endsWith('.psd')) {
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
          loadImageData(compositeImageUrl, "PSD file imported with layers.", importedLayers);
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

    if (!file.type.startsWith("image/")) {
      dismissToast(toastId);
      showError("Invalid file type. Please upload an image or a .psd file.");
      return;
    }
    setDimensions(null);
    setFileInfo({ name: file.name, size: file.size });
    setExifData(null);
    ExifReader.load(file).then(setExifData).catch(() => setExifData(null));

    const reader = new FileReader();
    reader.onloadend = () => {
      dismissToast(toastId);
      loadImageData(reader.result as string, "Image uploaded successfully.", [{
        id: uuidv4(),
        type: "image",
        name: "Background",
        visible: true,
        opacity: 100,
        blendMode: 'normal',
      }]);
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
        dismissToast(toastId);
        loadImageData(reader.result as string, "Image loaded successfully.", [{
          id: uuidv4(),
          type: "image",
          name: "Background",
          visible: true,
          opacity: 100,
          blendMode: 'normal',
        }]);
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
      setSelectionPath(null);
      
      dismissToast(toastId);
      showSuccess("Project opened successfully.");
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
    setSelectionPath(null);
  }, [recordHistory, setSelectedLayerId]);

  const jumpToHistory = useCallback((index: number) => {
    setCurrentHistoryIndex(index);
    setLayers(history[index].layers);
  }, [history, setLayers]);

  /* ---------- Export / Copy ---------- */
  const handleDownload = useCallback((options: { format: string; quality: number; width: number; height: number }) => {
    if (!imgRef.current) return;
    downloadImage(
      { image: imgRef.current, layers: layers, ...currentState },
      options
    );
  }, [currentState, layers]);

  const handleCopy = useCallback(() => {
    if (!imgRef.current) return;
    copyImageToClipboard({ image: imgRef.current, layers: layers, ...currentState });
  }, [currentState, layers]);

  /* ---------- Generative fill ---------- */
  const applyGenerativeResult = useCallback((url: string) => {
    if (!selectionPath || selectionPath.length < 2) {
      showError("A selection is required for generative fill.");
      return;
    }

    const toastId = showLoading("Applying generative fill...");

    const generatedImage = new Image();
    generatedImage.crossOrigin = "Anonymous";
    generatedImage.onload = () => {
      const mainCanvas = document.createElement('canvas');
      const mainCtx = mainCanvas.getContext('2d');
      if (!mainCtx || !imgRef.current) {
        dismissToast(toastId);
        showError("Failed to create canvas for fill.");
        return;
      }

      mainCanvas.width = imgRef.current.naturalWidth;
      mainCanvas.height = imgRef.current.naturalHeight;

      // 1. Create a mask canvas
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = mainCanvas.width;
      maskCanvas.height = mainCanvas.height;
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) {
        dismissToast(toastId);
        showError("Failed to create mask canvas for feathering.");
        return;
      }

      // Draw the selection path onto the mask canvas
      maskCtx.fillStyle = 'white';
      maskCtx.beginPath();
      maskCtx.moveTo(selectionPath[0].x, selectionPath[0].y);
      for (let i = 1; i < selectionPath.length; i++) {
        maskCtx.lineTo(selectionPath[i].x, selectionPath[i].y);
      }
      maskCtx.closePath();
      maskCtx.fill();

      // Apply blur to the mask for feathering
      const featherRadius = 20; // Adjust this value for desired feathering
      maskCtx.filter = `blur(${featherRadius}px)`;
      maskCtx.drawImage(maskCanvas, 0, 0); // Redraw to apply filter

      // 2. Draw the generated image onto the main canvas
      mainCtx.drawImage(generatedImage, 0, 0, mainCanvas.width, mainCanvas.height);

      // 3. Apply the blurred mask to the generated image
      mainCtx.globalCompositeOperation = 'destination-in';
      mainCtx.drawImage(maskCanvas, 0, 0);
      mainCtx.globalCompositeOperation = 'source-over'; // Reset composite operation

      const dataUrl = mainCanvas.toDataURL();
      
      const newLayer: Layer = {
        id: uuidv4(),
        type: "drawing",
        name: `Fill ${layers.filter((l) => l.type === "drawing").length + 1}`,
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        dataUrl: dataUrl,
      };
      const updatedLayers = [...layers, newLayer];
      recordHistory("Generative Fill", currentState, updatedLayers);
      setSelectedLayerId(newLayer.id);
      setSelectionPath(null);
      dismissToast(toastId);
      showSuccess("Generative fill applied.");
    };
    generatedImage.onerror = () => {
      dismissToast(toastId);
      showError("Failed to load generated image for fill.");
    };
    generatedImage.src = url;
  }, [selectionPath, imgRef, layers, recordHistory, currentState, setSelectedLayerId]);

  const handleSetBrushState = useCallback((updates: Partial<BrushState>) => {
    setBrushState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleColorPick = useCallback((color: string) => {
    setBrushState(prev => ({ ...prev, color }));
    _setActiveTool('brush');
    showSuccess(`Color picked: ${color}`);
  }, []);

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
  useHotkeys("escape", () => {
    if (activeTool === 'crop') cancelCrop();
    else setActiveTool(null);
    if (selectionPath) setSelectionPath(null);
  }, { enabled: !!image, preventDefault: true }); // Ensure escape prevents default

  // Keyboard movement for selected layers
  const handleKeyboardMove = useCallback((dx: number, dy: number, speedMultiplier: number) => {
    if (selectedLayerId && (activeTool === 'move' || activeTool === null)) {
      moveSelectedLayer(selectedLayerId, dx * speedMultiplier, dy * speedMultiplier);
    }
  }, [selectedLayerId, activeTool, moveSelectedLayer]);

  useHotkeys("arrowup", (e) => handleKeyboardMove(0, -1, e.shiftKey ? 5 : 1), { preventDefault: true, enabled: !!image });
  useHotkeys("arrowdown", (e) => handleKeyboardMove(0, 1, e.shiftKey ? 5 : 1), { preventDefault: true, enabled: !!image });
  useHotkeys("arrowleft", (e) => handleKeyboardMove(-1, 0, e.shiftKey ? 5 : 1), { preventDefault: true, enabled: !!image });
  useHotkeys("arrowright", (e) => handleKeyboardMove(1, 0, e.shiftKey ? 5 : 1), { preventDefault: true, enabled: !!image });


  const canUndo = currentHistoryIndex > 0;
  const canRedo = currentHistoryIndex < history.length - 1;

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
    // Tool state
    activeTool,
    setActiveTool,
    // Brush state
    brushState,
    setBrushState: handleSetBrushState,
    handleColorPick,
    // Gradient tool state
    gradientToolState,
    setGradientToolState,
    // Generative
    applyGenerativeResult,
    // Selection
    selectionPath,
    setSelectionPath,
    // Shape tool
    selectedShapeType,
    setSelectedShapeType,
    // Grouping
    groupLayers,
    toggleGroupExpanded,
  };
};