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
  crop: Crop | undefined;
}

/** Layer definition */
export interface Layer {
  id: string;
  type: "image" | "text";
  name: string;
  visible: boolean;
  // Text layer specific properties
  content?: string;
  x?: number; // percentage from left
  y?: number; // percentage from top
  fontSize?: number; // pixels
  color?: string;
  fontFamily?: string;
}

export interface HistoryItem {
  name: string;
  state: EditState;
  layers: Layer[];
}

/* ---------- Initial state ---------- */
const initialEditState: EditState = {
  adjustments: { brightness: 100, contrast: 100, saturation: 100 },
  effects: { blur: 0, hueShift: 0, vignette: 0 },
  grading: { grayscale: 0, sepia: 0, invert: 0 },
  selectedFilter: "",
  transforms: { rotation: 0, scaleX: 1, scaleY: 1 },
  crop: undefined,
};

const initialLayers: Layer[] = [
  {
    id: uuidv4(),
    type: "image",
    name: "Background",
    visible: true,
  },
];

const initialHistoryItem: HistoryItem = {
  name: "Initial State",
  state: initialEditState,
  layers: initialLayers,
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
  const [activeTool, setActiveTool] = useState<"lasso" | "brush" | "text" | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [pendingCrop, setPendingCrop] = useState<Crop | undefined>();
  const imgRef = useRef<HTMLImageElement>(null);

  const currentState = history[currentHistoryIndex].state;
  const currentLayers = history[currentHistoryIndex].layers;

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
    showSuccess(successMsg);
  }, []);

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

  /* ---------- Crop ---------- */
  const applyCrop = useCallback(() => {
    if (!pendingCrop) return;
    recordHistory("Crop Image", { ...currentState, crop: pendingCrop });
    setPendingCrop(undefined);
  }, [currentState, recordHistory, pendingCrop]);

  const cancelCrop = useCallback(() => {
    setPendingCrop(undefined);
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
  }, [recordHistory]);

  const jumpToHistory = useCallback((index: number) => {
    setCurrentHistoryIndex(index);
  }, []);

  /* ---------- Export / Copy ---------- */
  const handleDownload = useCallback((options: { format: string; quality: number; width: number; height: number }) => {
    if (!imgRef.current) return;
    downloadImage(
      { image: imgRef.current, ...currentState },
      options
    );
  }, [currentState]);

  const handleCopy = useCallback(() => {
    if (!imgRef.current) return;
    copyImageToClipboard({ image: imgRef.current, ...currentState });
  }, [currentState]);

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
    };
    const updated = [...currentLayers, newLayer];
    recordHistory("Add Text Layer", currentState, updated);
    setSelectedLayerId(newLayer.id);
    setActiveTool(null);
  }, [currentLayers, currentState, recordHistory]);

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    const updatedLayers = currentLayers.map((l) => (l.id === id ? { ...l, ...updates } : l));
    updateCurrentLayers(updatedLayers);
  }, [currentLayers, updateCurrentLayers]);

  const commitLayerChange = useCallback((id: string) => {
    const layer = currentLayers.find((l) => l.id === id);
    if (!layer) return;
    recordHistory(`Edit Layer "${layer.name}"`, currentState, currentLayers);
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
  useHotkeys("t", () => setActiveTool("text"), { enabled: !!image });
  useHotkeys("l", () => setActiveTool("lasso"), { enabled: !!image });
  useHotkeys("escape", () => {
    if (pendingCrop) cancelCrop();
    if (activeTool) setActiveTool(null);
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
    handleAdjustmentChange,
    handleAdjustmentCommit,
    handleEffectChange,
    handleEffectCommit,
    handleGradingChange,
    handleGradingCommit,
    handleFilterChange,
    handleTransformChange,
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
    toggleLayerVisibility,
    renameLayer,
    deleteLayer,
    updateLayer,
    commitLayerChange,
    reorderLayers,
    // Tool state
    activeTool,
    setActiveTool,
    // Generative
    applyGenerativeResult,
    // Selection
    selectedLayerId,
    setSelectedLayer: setSelectedLayerId,
  };
};