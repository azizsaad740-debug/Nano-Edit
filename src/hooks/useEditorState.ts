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

export interface EditState {
// ... (EditState definition remains the same)
  selectiveBlurStrength: number; // NEW: Max blur strength (0-100)
}

export interface Point {
  x: number;
  y: number;
}

/** Layer definition */
export interface Layer {
// ... (Layer definition remains the same)
  expanded?: boolean; // For 'group' type
}

export interface HistoryItem {
// ... (HistoryItem definition remains the same)
}

export interface BrushState {
// ... (BrushState definition remains the same)
}

export interface GradientToolState {
// ... (GradientToolState definition remains the same)
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

const initialEditState: EditState = {
// ... (initialEditState definition remains the same)
  selectiveBlurStrength: 50, // NEW: Initialize to 50%
};

const initialBrushState: Omit<BrushState, 'color'> = { // Removed color from initial state
// ... (initialBrushState definition remains the same)
};

const initialGradientToolState: GradientToolState = {
// ... (initialGradientToolState definition remains the same)
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

  const loadImageData = useCallback((dataUrl: string, successMsg: string, initialLayers: Layer[]) => {
    setImage(dataUrl);
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
          loadImageData(dataUrl, `${file.name} imported. Vector objects flattened to raster layers.`, [
            { id: uuidv4(), type: "image", name: "Background", visible: true, opacity: 100, blendMode: 'normal' },
            newLayer
          ]);
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
// ... (handleUrlImageLoad remains the same)
  }, [loadImageData]);

  const handleNewFromClipboard = useCallback(async () => {
// ... (handleNewFromClipboard remains the same)
  }, [handleFileSelect]);

  const loadTemplateData = useCallback((templateData: TemplateData) => {
    const { editState, layers: templateLayers, dimensions: templateDimensions } = templateData;
    
    // 1. Create a blank canvas based on template dimensions
    const canvas = document.createElement('canvas');
    canvas.width = templateDimensions.width;
    canvas.height = templateDimensions.height;
    const dataUrl = canvas.toDataURL('image/png');

    // 2. Reset history and set base image (transparent canvas)
    setImage(dataUrl);
    setDimensions(templateDimensions);
    setFileInfo({ name: "Template.png", size: 0 });
    setExifData(null);
    
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

  }, [setLayers, setSelectedLayerId, setDimensions, setAspect]);

  /* ---------- Project Save/Load ---------- */
// ... (rest of the file remains the same)