import { useState, useRef, useCallback } from "react";
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
  type: "image" | "text" | "drawing" | "smart-object";
  name: string;
  visible: boolean;
  opacity?: number;
  blendMode?: string;
  // Text layer specific properties
  content?: string;
  x?: number; // percentage from left
  y?: number; // percentage from top
  fontSize?: number; // pixels
  color?: string;
  fontFamily?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  rotation?: number; // degrees
  letterSpacing?: number; // pixels
  textShadow?: { color: string; blur: number; offsetX: number; offsetY: number };
  stroke?: { color: string; width: number };
  backgroundColor?: string;
  padding?: number;
  // Drawing layer specific properties
  dataUrl?: string;
  // Smart object properties
  smartObjectData?: {
    layers: Layer[];
    width: number;
    height: number;
  };
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
}

type ActiveTool = "lasso" | "brush" | "text" | "crop" | "eraser" | "eyedropper";

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

const initialLayers: Layer[] = [
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
  layers: initialLayers,
};

const initialBrushState: BrushState = {
  size: 50,
  opacity: 100,
  color: "#ff0000",
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
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [brushState, setBrushState] = useState<BrushState>(initialBrushState);
  const [pendingCrop, setPendingCrop] = useState<Crop | undefined>();
  const [selectionPath, setSelectionPath] = useState<Point[] | null>(null);
  const [isSmartObjectEditorOpen, setIsSmartObjectEditorOpen] = useState(false);
  const [smartObjectEditingId, setSmartObjectEditingId] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const currentState = history[currentHistoryIndex].state;
  const currentLayers = history[currentHistoryIndex].layers;

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

  const updateCurrentLayers = useCallback(
    (layers: Layer[]) => {
      const newHistory = [...history];
      newHistory[currentHistoryIndex] = { ...newHistory[currentHistoryIndex], layers };
      setHistory(newHistory);
    },
    [history, currentHistoryIndex]
  );

  /* ---------- Preset application ---------- */
  const applyPreset = useCallback(
    (preset: Preset) => {
      const presetState = {
        ...preset.state,
        curves: { ...initialCurvesState, ...preset.state.curves },
      };
      const newState = { ...currentState, ...presetState };
      recordHistory(`Apply Preset "${preset.name}"`, newState, currentLayers);
    },
    [currentState, currentLayers, recordHistory]
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

  const loadImageData = useCallback((dataUrl: string, successMsg: string, layers: Layer[] = initialLayers) => {
    setImage(dataUrl);
    const newHistoryItem = { ...initialHistoryItem, layers };
    setHistory([newHistoryItem]);
    setCurrentHistoryIndex(0);
    setSelectedLayerId(layers.length > 1 ? layers[layers.length - 1].id : null);
    setPendingCrop(undefined);
    setSelectionPath(null);
    showSuccess(successMsg);
  }, []);

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
      loadImageData(dataUrl, "New project created.");
      setFileInfo({ name: "Untitled-1.png", size: 0 });
      setExifData(null);
    } else {
      showError("Failed to create canvas for new project.");
    }
  }, [loadImageData]);

  const handleGeneratedImageLoad = useCallback((dataUrl: string) => {
    loadImageData(dataUrl, "New image generated successfully.");
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
            { ...initialLayers[0], id: uuidv4() } // New background
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
      loadImageData(reader.result as string, "Image uploaded successfully.");
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
        loadImageData(reader.result as string, "Image loaded successfully.");
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
      setPendingCrop(undefined);
      setSelectionPath(null);
      
      dismissToast(toastId);
      showSuccess("Project opened successfully.");
    } catch (error: any) {
      dismissToast(toastId);
      console.error("Failed to load project:", error);
      showError(error.message || "Could not open the project file.");
    }
  }, []);

  /* ---------- Adjustment handlers ---------- */
  const handleAdjustmentChange = useCallback((key: string, value: number) => {
    updateCurrentState({ adjustments: { ...currentState.adjustments, [key]: value } });
  }, [currentState.adjustments, updateCurrentState]);

  const handleAdjustmentCommit = useCallback((key: string, value: number) => {
    const newAdj = { ...currentState.adjustments, [key]: value };
    const name = `Adjust ${key.charAt(0).toUpperCase() + key.slice(1)}`;
    recordHistory(name, { ...currentState, adjustments: newAdj });
  }, [currentState, recordHistory]);

  const handleEffectChange = useCallback((key: string, value: number) => {
    updateCurrentState({ effects: { ...currentState.effects, [key]: value } });
  }, [currentState.effects, updateCurrentState]);

  const handleEffectCommit = useCallback((key: string, value: number) => {
    const newEff = { ...currentState.effects, [key]: value };
    const name = `Adjust ${key.charAt(0).toUpperCase() + key.slice(1)}`;
    recordHistory(name, { ...currentState, effects: newEff });
  }, [currentState, recordHistory]);

  const handleGradingChange = useCallback((key: string, value: number) => {
    updateCurrentState({ grading: { ...currentState.grading, [key]: value } });
  }, [currentState.grading, updateCurrentState]);

  const handleGradingCommit = useCallback((key: string, value: number) => {
    const newGrad = { ...currentState.grading, [key]: value };
    const name = `Adjust ${key.charAt(0).toUpperCase() + key.slice(1)}`;
    recordHistory(name, { ...currentState, grading: newGrad });
  }, [currentState, recordHistory]);

  const handleChannelChange = useCallback((channel: 'r' | 'g' | 'b', value: boolean) => {
    const newChannels = { ...currentState.channels, [channel]: value };
    const name = `Toggle ${channel.toUpperCase()} Channel`;
    recordHistory(name, { ...currentState, channels: newChannels });
  }, [currentState, recordHistory]);

  const handleCurvesChange = useCallback((channel: keyof EditState['curves'], points: Point[]) => {
    updateCurrentState({ curves: { ...currentState.curves, [channel]: points } });
  }, [currentState.curves, updateCurrentState]);

  const handleCurvesCommit = useCallback((channel: keyof EditState['curves'], points: Point[]) => {
    const newCurves = { ...currentState.curves, [channel]: points };
    const channelName = channel === 'all' ? 'RGB' : channel.toUpperCase();
    recordHistory(`Adjust ${channelName} Curve`, { ...currentState, curves: newCurves });
  }, [currentState, recordHistory]);

  const handleFilterChange = useCallback((value: string, name: string) => {
    const entryName = name === "None" ? "Remove Filter" : `Apply ${name} Filter`;
    recordHistory(entryName, { ...currentState, selectedFilter: value });
  }, [currentState, recordHistory]);

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
    recordHistory(nameMap[type] ?? "Transform", { ...currentState, transforms: newTrans });
  }, [currentState, recordHistory]);

  const handleFramePresetChange = useCallback((type: string, name: string, options?: { width: number; color: string }) => {
    const newFrame = {
      type: type as 'none' | 'solid',
      width: options?.width ?? 0,
      color: options?.color ?? '#000000',
    };
    recordHistory(`Set Frame: ${name}`, { ...currentState, frame: newFrame });
  }, [currentState, recordHistory]);

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
    recordHistory("Adjust Frame", currentState);
  }, [currentState, recordHistory]);

  /* ---------- Crop ---------- */
  const applyCrop = useCallback(() => {
    if (!pendingCrop) return;
    recordHistory("Crop Image", { ...currentState, crop: pendingCrop });
    setPendingCrop(undefined);
    setActiveTool(null);
  }, [currentState, recordHistory, pendingCrop]);

  const cancelCrop = useCallback(() => {
    setPendingCrop(undefined);
    setActiveTool(null);
  }, []);

  /* ---------- Undo / Redo / Reset ---------- */
  const handleUndo = useCallback(() => {
    if (currentHistoryIndex > 0) setCurrentHistoryIndex(currentHistoryIndex - 1);
  }, [currentHistoryIndex]);

  const handleRedo = useCallback(() => {
    if (currentHistoryIndex < history.length - 1) setCurrentHistoryIndex(currentHistoryIndex + 1);
  }, [currentHistoryIndex, history.length]);

  const handleReset = useCallback(() => {
    recordHistory("Reset All", initialEditState, initialLayers);
    setSelectedLayerId(null);
    setPendingCrop(undefined);
    setSelectionPath(null);
  }, [recordHistory]);

  const jumpToHistory = useCallback((index: number) => {
    setCurrentHistoryIndex(index);
  }, []);

  /* ---------- Export / Copy ---------- */
  const handleDownload = useCallback((options: { format: string; quality: number; width: number; height: number }) => {
    if (!imgRef.current) return;
    downloadImage(
      { image: imgRef.current, layers: currentLayers, ...currentState },
      options
    );
  }, [currentState, currentLayers]);

  const handleCopy = useCallback(() => {
    if (!imgRef.current) return;
    copyImageToClipboard({ image: imgRef.current, layers: currentLayers, ...currentState });
  }, [currentState, currentLayers]);

  /* ---------- Layer management ---------- */
  const rasterizeLayerToCanvas = async (layer: Layer, imageDimensions: { width: number; height: number }): Promise<HTMLCanvasElement | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = imageDimensions.width;
    canvas.height = imageDimensions.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (layer.type === 'drawing' && layer.dataUrl) {
        const img = new Image();
        await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
            img.src = layer.dataUrl!;
        });
        ctx.drawImage(img, 0, 0);
    } else if (layer.type === 'text') {
        const {
            content = '', x = 50, y = 50, fontSize = 48, color = '#000000',
            fontFamily = 'Roboto', fontWeight = 'normal', fontStyle = 'normal',
            textAlign = 'center', rotation = 0, textShadow, stroke,
            backgroundColor, padding = 0,
        } = layer;

        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textAlign = textAlign;

        const posX = (x / 100) * imageDimensions.width;
        const posY = (y / 100) * imageDimensions.height;

        ctx.save();
        ctx.translate(posX, posY);
        ctx.rotate(rotation * Math.PI / 180);

        const metrics = ctx.measureText(content);
        const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

        if (backgroundColor) {
            ctx.fillStyle = backgroundColor;
            let bgX = -padding;
            if (textAlign === 'center') bgX = -metrics.width / 2 - padding;
            else if (textAlign === 'right') bgX = -metrics.width - padding;
            
            const bgY = -metrics.actualBoundingBoxAscent - padding;
            const bgWidth = metrics.width + padding * 2;
            const bgHeight = textHeight + padding * 2;
            ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
            ctx.fillStyle = color;
        }

        if (textShadow) {
            ctx.shadowColor = textShadow.color;
            ctx.shadowBlur = textShadow.blur;
            ctx.shadowOffsetX = textShadow.offsetX;
            ctx.shadowOffsetY = textShadow.offsetY;
        }

        if (stroke && stroke.width > 0) {
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            ctx.strokeText(content, 0, 0);
        }
        ctx.fillText(content, 0, 0);
        ctx.restore();
    } else if (layer.type === 'smart-object' && layer.smartObjectData) {
      // For smart objects, we need to render all nested layers
      const smartCanvas = document.createElement('canvas');
      smartCanvas.width = layer.smartObjectData.width;
      smartCanvas.height = layer.smartObjectData.height;
      const smartCtx = smartCanvas.getContext('2d');
      
      if (smartCtx) {
        // Render all layers in the smart object
        for (const smartLayer of layer.smartObjectData.layers) {
          if (!smartLayer.visible) continue;
          
          smartCtx.globalAlpha = (smartLayer.opacity ?? 100) / 100;
          smartCtx.globalCompositeOperation = (smartLayer.blendMode || 'normal') as GlobalCompositeOperation;
          
          if (smartLayer.type === 'drawing' && smartLayer.dataUrl) {
            const img = new Image();
            await new Promise((res, rej) => {
              img.onload = res;
              img.onerror = rej;
              img.src = smartLayer.dataUrl!;
            });
            smartCtx.drawImage(img, 0, 0);
          } else if (smartLayer.type === 'text') {
            // Render text layer (simplified version)
            smartCtx.font = `${smartLayer.fontStyle || 'normal'} ${smartLayer.fontWeight || 'normal'} ${smartLayer.fontSize || 16}px ${smartLayer.fontFamily || 'Arial'}`;
            smartCtx.fillStyle = smartLayer.color || '#000000';
            smartCtx.fillText(smartLayer.content || '', smartLayer.x || 0, smartLayer.y || 0);
          }
        }
        
        // Draw the smart object onto the main canvas
        ctx.drawImage(smartCanvas, 0, 0, imageDimensions.width, imageDimensions.height);
      }
    }
    
    return canvas;
  };

  const addTextLayer = useCallback((coords?: { x: number; y: number }) => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "text",
      name: `Text ${currentLayers.filter((l) => l.type === "text").length + 1}`,
      visible: true,
      content: "New Text",
      x: coords?.x ?? 50,
      y: coords?.y ?? 50,
      fontSize: 48,
      color: "#FFFFFF",
      fontFamily: "Roboto",
      opacity: 100,
      blendMode: 'normal',
      fontWeight: "normal",
      fontStyle: "normal",
      textAlign: "center",
      rotation: 0,
      letterSpacing: 0,
      padding: 10,
    };
    const updated = [...currentLayers, newLayer];
    recordHistory("Add Text Layer", currentState, updated);
    setSelectedLayerId(newLayer.id);
    setActiveTool(null);
  }, [currentLayers, currentState, recordHistory]);

  const addDrawingLayer = useCallback(() => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "drawing",
      name: `Drawing ${currentLayers.filter((l) => l.type === "drawing").length + 1}`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      dataUrl: "",
    };
    const updated = [...currentLayers, newLayer];
    recordHistory("Add Drawing Layer", currentState, updated);
    setSelectedLayerId(newLayer.id);
    return newLayer.id;
  }, [currentLayers, currentState, recordHistory]);

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    const updatedLayers = currentLayers.map((l) => (l.id === id ? { ...l, ...updates } : l));
    updateCurrentLayers(updatedLayers);
  }, [currentLayers, updateCurrentLayers]);

  const commitLayerChange = useCallback((id: string) => {
    const layer = currentLayers.find((l) => l.id === id);
    if (!layer) return;
    const action = layer.type === 'drawing' ? 'Brush Stroke' : `Edit Layer "${layer.name}"`;
    recordHistory(action, currentState, currentLayers);
  }, [currentState, currentLayers, recordHistory]);

  const handleLayerPropertyCommit = useCallback((id: string, updates: Partial<Layer>, historyName: string) => {
    const updatedLayers = currentLayers.map((l) => (l.id === id ? { ...l, ...updates } : l));
    recordHistory(historyName, currentState, updatedLayers);
  }, [currentLayers, currentState, recordHistory]);

  const handleLayerOpacityChange = useCallback((opacity: number) => {
    if (selectedLayerId) {
      updateLayer(selectedLayerId, { opacity });
    }
  }, [selectedLayerId, updateLayer]);

  const handleLayerOpacityCommit = useCallback(() => {
    if (selectedLayerId) {
      commitLayerChange(selectedLayerId);
    }
  }, [selectedLayerId, commitLayerChange]);

  const toggleLayerVisibility = useCallback((id: string) => {
    const updated = currentLayers.map(l => l.id === id ? { ...l, visible: !l.visible } : l);
    updateCurrentLayers(updated);
  }, [currentLayers, updateCurrentLayers]);

  const renameLayer = useCallback((id: string, newName: string) => {
    const layerToRename = currentLayers.find(l => l.id === id);
    if (layerToRename && layerToRename.type === 'image') {
      showError("The background layer cannot be renamed.");
      return;
    }
    const updated = currentLayers.map(l => l.id === id ? { ...l, name: newName } : l);
    recordHistory(`Rename Layer to "${newName}"`, currentState, updated);
  }, [currentLayers, currentState, recordHistory]);

  const deleteLayer = useCallback((id: string) => {
    const layerToDelete = currentLayers.find(l => l.id === id);
    if (layerToDelete && layerToDelete.type === 'image') {
      showError("The background layer cannot be deleted.");
      return;
    }
    if (id === selectedLayerId) {
      setSelectedLayerId(null);
    }
    const updated = currentLayers.filter(l => l.id !== id);
    recordHistory("Delete Layer", currentState, updated);
  }, [currentLayers, currentState, recordHistory, selectedLayerId]);

  const duplicateLayer = useCallback((id: string) => {
    const layerIndex = currentLayers.findIndex(l => l.id === id);
    const layerToDuplicate = currentLayers[layerIndex];

    if (!layerToDuplicate || layerToDuplicate.type === 'image') {
      showError("The background layer cannot be duplicated.");
      return;
    }

    const newLayer: Layer = {
      ...layerToDuplicate,
      id: uuidv4(),
      name: `${layerToDuplicate.name} Copy`,
    };

    const updated = [
      ...currentLayers.slice(0, layerIndex + 1),
      newLayer,
      ...currentLayers.slice(layerIndex + 1),
    ];

    recordHistory("Duplicate Layer", currentState, updated);
    setSelectedLayerId(newLayer.id);
  }, [currentLayers, currentState, recordHistory]);

  const rasterizeLayer = useCallback(async (id: string) => {
    const layerToRasterize = currentLayers.find(l => l.id === id);

    if (!layerToRasterize || layerToRasterize.type !== 'text' || !imgRef.current) {
      showError("Only text layers can be rasterized.");
      return;
    }

    const toastId = showLoading("Rasterizing layer...");
    try {
      const imageDimensions = { width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight };
      const canvas = await rasterizeLayerToCanvas(layerToRasterize, imageDimensions);
      if (!canvas) throw new Error("Failed to create canvas for rasterization.");

      const dataUrl = canvas.toDataURL();

      const newLayer: Layer = {
        ...layerToRasterize,
        type: 'drawing',
        dataUrl: dataUrl,
        content: undefined, x: undefined, y: undefined, fontSize: undefined,
        fontFamily: undefined, fontWeight: undefined, fontStyle: undefined,
        textAlign: undefined, rotation: undefined, letterSpacing: undefined,
        textShadow: undefined, stroke: undefined, backgroundColor: undefined,
        padding: undefined,
      };

      const updatedLayers = currentLayers.map(l => l.id === id ? newLayer : l);
      recordHistory(`Rasterize Layer "${layerToRasterize.name}"`, currentState, updatedLayers);
      
      dismissToast(toastId);
      showSuccess("Layer rasterized.");
    } catch (err: any) {
      console.error("Failed to rasterize layer:", err);
      dismissToast(toastId);
      showError(err.message || "Failed to rasterize layer.");
    }
  }, [currentLayers, currentState, recordHistory, imgRef]);

  const mergeLayerDown = useCallback(async (id: string) => {
    const layerIndex = currentLayers.findIndex(l => l.id === id);
    
    if (layerIndex < 1 || currentLayers[layerIndex - 1].type === 'image') {
      showError("This layer cannot be merged down.");
      return;
    }

    const topLayer = currentLayers[layerIndex];
    const bottomLayer = currentLayers[layerIndex - 1];

    const toastId = showLoading("Merging layers...");

    try {
      if (!imgRef.current) throw new Error("Image reference is not available.");
      const imageDimensions = { width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight };

      const bottomCanvas = await rasterizeLayerToCanvas(bottomLayer, imageDimensions);
      const topCanvas = await rasterizeLayerToCanvas(topLayer, imageDimensions);

      if (!bottomCanvas || !topCanvas) throw new Error("Failed to rasterize layers for merging.");

      const mergedCanvas = document.createElement('canvas');
      mergedCanvas.width = imageDimensions.width;
      mergedCanvas.height = imageDimensions.height;
      const ctx = mergedCanvas.getContext('2d');
      if (!ctx) throw new Error("Failed to create canvas for merging.");

      // Draw bottom layer
      ctx.globalAlpha = (bottomLayer.opacity ?? 100) / 100;
      ctx.globalCompositeOperation = (bottomLayer.blendMode || 'normal') as GlobalCompositeOperation;
      ctx.drawImage(bottomCanvas, 0, 0);

      // Draw top layer
      ctx.globalAlpha = (topLayer.opacity ?? 100) / 100;
      ctx.globalCompositeOperation = (topLayer.blendMode || 'normal') as GlobalCompositeOperation;
      ctx.drawImage(topCanvas, 0, 0);

      const mergedDataUrl = mergedCanvas.toDataURL();

      const newBottomLayer: Layer = {
        id: bottomLayer.id,
        type: 'drawing',
        name: bottomLayer.name,
        visible: bottomLayer.visible,
        dataUrl: mergedDataUrl,
        opacity: 100, // Opacity is baked in, so reset to 100
        blendMode: 'normal', // Blend mode is baked in
      };

      const updatedLayers = currentLayers
        .filter(l => l.id !== topLayer.id)
        .map(l => l.id === bottomLayer.id ? newBottomLayer : l);

      recordHistory(`Merge Layer "${topLayer.name}" Down`, currentState, updatedLayers);
      setSelectedLayerId(bottomLayer.id);
      dismissToast(toastId);
      showSuccess("Layers merged.");

    } catch (err: any) {
      console.error("Failed to merge layers:", err);
      dismissToast(toastId);
      showError(err.message || "Failed to merge layers.");
    }
  }, [currentLayers, currentState, recordHistory, imgRef]);

  const reorderLayers = useCallback((oldIndex: number, newIndex: number) => {
    if (currentLayers[oldIndex].type === 'image' || currentLayers[newIndex].type === 'image') {
      showError("The background layer cannot be moved.");
      return;
    }
    const updated = arrayMove(currentLayers, oldIndex, newIndex);
    recordHistory("Reorder Layers", currentState, updated);
  }, [currentLayers, currentState, recordHistory]);

  /* ---------- Smart Object Functions ---------- */
  const createSmartObject = useCallback((layerIds: string[]) => {
    if (layerIds.length < 1) {
      showError("Please select at least one layer to create a smart object.");
      return;
    }

    // Get the selected layers
    const selectedLayers = currentLayers.filter(layer => layerIds.includes(layer.id));
    
    // Find the bounds of all selected layers
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    selectedLayers.forEach(layer => {
      if (layer.type === 'text' && layer.x !== undefined && layer.y !== undefined) {
        // For text layers, we need to calculate approximate bounds
        const fontSize = layer.fontSize || 16;
        const textWidth = (layer.content?.length || 1) * fontSize * 0.6; // Approximate width
        const textHeight = fontSize * 1.2; // Approximate height
        
        const x = (layer.x / 100) * (dimensions?.width || 1000);
        const y = (layer.y / 100) * (dimensions?.height || 1000);
        
        minX = Math.min(minX, x - textWidth / 2);
        minY = Math.min(minY, y - textHeight / 2);
        maxX = Math.max(maxX, x + textWidth / 2);
        maxY = Math.max(maxY, y + textHeight / 2);
      }
    });
    
    // If we couldn't determine bounds, use default size
    if (minX === Infinity) {
      minX = 0;
      minY = 0;
      maxX = dimensions?.width || 1000;
      maxY = dimensions?.height || 1000;
    }
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Create the smart object layer
    const smartObjectLayer: Layer = {
      id: uuidv4(),
      type: "smart-object",
      name: "Smart Object",
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      smartObjectData: {
        layers: selectedLayers,
        width,
        height
      }
    };

    // Remove the original layers and add the smart object
    const updatedLayers = currentLayers
      .filter(layer => !layerIds.includes(layer.id))
      .concat(smartObjectLayer);

    recordHistory("Create Smart Object", currentState, updatedLayers);
    setSelectedLayerId(smartObjectLayer.id);
  }, [currentLayers, currentState, recordHistory, dimensions]);

  const openSmartObjectEditor = useCallback((id: string) => {
    const layer = currentLayers.find(l => l.id === id);
    if (!layer || layer.type !== 'smart-object') {
      showError("Invalid smart object layer.");
      return;
    }
    
    setSmartObjectEditingId(id);
    setIsSmartObjectEditorOpen(true);
  }, [currentLayers]);

  const closeSmartObjectEditor = useCallback(() => {
    setIsSmartObjectEditorOpen(false);
    setSmartObjectEditingId(null);
  }, []);

  const saveSmartObjectChanges = useCallback((updatedLayers: Layer[]) => {
    if (!smartObjectEditingId) return;
    
    const updatedAllLayers = currentLayers.map(layer => {
      if (layer.id === smartObjectEditingId && layer.type === 'smart-object' && layer.smartObjectData) {
        return {
          ...layer,
          smartObjectData: {
            ...layer.smartObjectData,
            layers: updatedLayers
          }
        };
      }
      return layer;
    });
    
    recordHistory("Edit Smart Object", currentState, updatedAllLayers);
    closeSmartObjectEditor();
    showSuccess("Smart object changes saved.");
  }, [currentLayers, currentState, recordHistory, smartObjectEditingId, closeSmartObjectEditor]);

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
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx || !imgRef.current) {
        dismissToast(toastId);
        showError("Failed to create canvas for fill.");
        return;
      }

      canvas.width = imgRef.current.naturalWidth;
      canvas.height = imgRef.current.naturalHeight;

      // Create clipping path from selection
      ctx.beginPath();
      ctx.moveTo(selectionPath[0].x, selectionPath[0].y);
      for (let i = 1; i < selectionPath.length; i++) {
        ctx.lineTo(selectionPath[i].x, selectionPath[i].y);
      }
      ctx.closePath();
      ctx.clip();

      // Draw the generated image into the clipped area
      ctx.drawImage(generatedImage, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL();
      
      const newLayer: Layer = {
        id: uuidv4(),
        type: "drawing",
        name: `Fill ${currentLayers.filter((l) => l.type === "drawing").length + 1}`,
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        dataUrl: dataUrl,
      };
      const updatedLayers = [...currentLayers, newLayer];
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
  }, [selectionPath, imgRef, currentLayers, recordHistory, currentState]);

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
    { enabled: !!image }
  );
  useHotkeys(
    "ctrl+shift+c, cmd+shift+c",
    (e) => {
      e.preventDefault();
      handleCopy();
    },
    { enabled: !!image }
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
  useHotkeys("escape", () => {
    if (activeTool === 'crop') cancelCrop();
    else setActiveTool(null);
    if (selectionPath) setSelectionPath(null);
  }, { enabled: !!image });

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
    // Layer utilities
    layers: currentLayers,
    addTextLayer,
    addDrawingLayer,
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
    // Smart object utilities
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
    // Generative
    applyGenerativeResult,
    // Selection
    selectedLayerId,
    setSelectedLayer: setSelectedLayerId,
    selectionPath,
    setSelectionPath,
  };
};