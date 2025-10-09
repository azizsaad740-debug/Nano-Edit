import { useState, useRef, useCallback } from "react";
import { type Crop } from "react-image-crop";
import { useHotkeys } from "react-hotkeys-hook";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { downloadImage, copyImageToClipboard } from "@/utils/imageUtils";
import ExifReader from "exifreader";
import type { Preset } from "./usePresets";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";

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
  };
  grading: {
    grayscale: number;
    sepia: number;
    invert: number;
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
  type: "image" | "text" | "drawing";
  name: string;
  visible: boolean;
  opacity?: number;
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
  // Drawing layer specific properties
  dataUrl?: string;
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

type ActiveTool = "lasso" | "brush" | "text" | "crop" | "eraser";

/* ---------- Initial state ---------- */
const initialEditState: EditState = {
  adjustments: { brightness: 100, contrast: 100, saturation: 100 },
  effects: { blur: 0, hueShift: 0, vignette: 0, noise: 0 },
  grading: { grayscale: 0, sepia: 0, invert: 0 },
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
  const imgRef = useRef<HTMLImageElement>(null);

  const currentState = history[currentHistoryIndex].state;
  const currentLayers = history[currentHistoryIndex].layers;

  const setActiveTool = (tool: ActiveTool | null) => {
    if (tool !== 'lasso') {
      setSelectionPath(null);
    }
    if (tool === 'crop') {
      setPendingCrop(currentState.crop || { unit: '%', width: 50, height: 50, x: 25, y: 25 });
    } else if (activeTool === 'crop' && tool !== 'crop') {
      setPendingCrop(undefined); // Cancel crop if switching tool
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
      const newState = { ...currentState, ...preset.state };
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

  const loadImageData = useCallback((dataUrl: string, successMsg: string) => {
    setImage(dataUrl);
    setHistory([initialHistoryItem]);
    setCurrentHistoryIndex(0);
    setSelectedLayerId(null);
    setPendingCrop(undefined);
    setSelectionPath(null);
    showSuccess(successMsg);
  }, []);

  const handleGeneratedImageLoad = useCallback((dataUrl: string) => {
    loadImageData(dataUrl, "New image generated successfully.");
    setFileInfo({ name: "generated-image.png", size: 0 });
    setExifData(null);
  }, [loadImageData]);

  const handleFileSelect = useCallback((file: File | undefined) => {
    if (!file) return;
    const toastId = showLoading("Uploading image...");
    if (!file.type.startsWith("image/")) {
      dismissToast(toastId);
      showError("Invalid file type. Please upload an image.");
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

  const handleFrameChange = useCallback((type: string, name: string, options?: { width: number; color: string }) => {
    const newFrame = {
      type: type as 'none' | 'solid',
      width: options?.width ?? 0,
      color: options?.color ?? '#000000',
    };
    recordHistory(`Set Frame: ${name}`, { ...currentState, frame: newFrame });
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
      fontWeight: "normal",
      fontStyle: "normal",
      textAlign: "center",
      rotation: 0,
      letterSpacing: 0,
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

  const reorderLayers = useCallback((oldIndex: number, newIndex: number) => {
    if (currentLayers[oldIndex].type === 'image' || currentLayers[newIndex].type === 'image') {
      showError("The background layer cannot be moved.");
      return;
    }
    const updated = arrayMove(currentLayers, oldIndex, newIndex);
    recordHistory("Reorder Layers", currentState, updated);
  }, [currentLayers, currentState, recordHistory]);

  /* ---------- Generative fill (stub) ---------- */
  const applyGenerativeResult = useCallback((url: string) => {
    setImage(url);
    showSuccess("Generative fill applied.");
  }, []);

  const handleSetBrushState = useCallback((updates: Partial<BrushState>) => {
    setBrushState(prev => ({ ...prev, ...updates }));
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
    handleAdjustmentChange,
    handleAdjustmentCommit,
    handleEffectChange,
    handleEffectCommit,
    handleGradingChange,
    handleGradingCommit,
    handleFilterChange,
    handleTransformChange,
    handleFrameChange,
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
    updateLayer,
    commitLayerChange,
    reorderLayers,
    // Tool state
    activeTool,
    setActiveTool,
    // Brush state
    brushState,
    setBrushState: handleSetBrushState,
    // Generative
    applyGenerativeResult,
    // Selection
    selectedLayerId,
    setSelectedLayer: setSelectedLayerId,
    selectionPath,
    setSelectionPath,
  };
};