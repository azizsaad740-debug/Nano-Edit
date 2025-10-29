import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  initialEditState,
  initialBrushState,
  initialGradientToolState,
  initialLayerState,
  initialHistoryItem,
  initialSelectionSettings,
  type Layer,
  type EditState,
  type ActiveTool,
  type Point,
  type BrushState,
  type GradientToolState,
  type Dimensions,
  type HistoryItem,
  type SelectionSettings,
} from "@/types/editor";
import { showSuccess, showError, dismissToast } from "@/utils/toast";
import { useFontManager } from "./useFontManager";
import { useSettings } from "./useSettings";

export const useEditorState = () => {
  // Refs for DOM elements
  const workspaceRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Dialog State
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isGenerativeFillOpen, setIsGenerativeFillOpen] = useState(false);
  const [isPreviewingOriginal, setIsPreviewingOriginal] = useState(false);

  // Core Project State
  const [image, setImage] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [exifData, setExifData] = useState<any>(null);
  const [currentEditState, setCurrentEditState] = useState<EditState>(initialEditState);
  const [layers, setLayers] = useState<Layer[]>(initialLayerState);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
  const [brushState, setBrushState] = useState<BrushState>({ ...initialBrushState, color: '#000000' });
  const [gradientToolState, setGradientToolState] = useState<GradientToolState>(initialGradientToolState);
  const [foregroundColor, setForegroundColor] = useState<string>('#000000');
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF');
  const [selectedShapeType, setSelectedShapeType] = useState<Layer['shapeType'] | null>('rect');
  const [selectionPath, setSelectionPath] = useState<Point[] | null>(null);
  const [selectionMaskDataUrl, setSelectionMaskDataUrl] = useState<string | null>(null);
  const [selectiveBlurAmount, setSelectiveBlurAmount] = useState<number>(initialEditState.selectiveBlurAmount);
  const [customHslColor, setCustomHslColor] = useState<string>(initialEditState.customHslColor);
  const [selectionSettings, setSelectionSettings] = useState<SelectionSettings>(initialSelectionSettings);
  const [cloneSourcePoint, setCloneSourcePoint] = useState<Point | null>(null);

  // Selection Drawing State
  const [marqueeStart, setMarqueeStart] = useState<Point | null>(null);
  const [marqueeCurrent, setMarqueeCurrent] = useState<Point | null>(null);
  
  // Zoom State (Managed here for global access)
  const [zoom, setZoom] = useState(1);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([initialHistoryItem]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);

  // External Hooks
  const { systemFonts, setSystemFonts, customFonts, addCustomFont, removeCustomFont } = useFontManager();
  const { geminiApiKey, stabilityApiKey } = useSettings();

  const updateCurrentState = useCallback((updates: Partial<EditState>) => {
    setCurrentEditState(prev => ({ ...prev, ...updates }));
  }, []);

  const recordHistory = useCallback((name: string, state: EditState, currentLayers: Layer[]) => {
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    const newEntry: HistoryItem = { name, state, layers: currentLayers };
    
    // Prevent duplicate history entries if state hasn't changed significantly
    if (newHistory.length > 0 && newHistory[newHistory.length - 1].name === name) {
        return;
    }

    setHistory([...newHistory, newEntry]);
    setCurrentHistoryIndex(newHistory.length);
  }, [history, currentHistoryIndex]);

  const undo = useCallback((steps: number = 1) => {
    const newIndex = Math.max(0, currentHistoryIndex - steps);
    if (newIndex !== currentHistoryIndex) {
      const entry = history[newIndex];
      setCurrentEditState(entry.state);
      setLayers(entry.layers);
      setCurrentHistoryIndex(newIndex);
      setSelectedLayerId(null);
      showSuccess(`Undo: ${entry.name}`);
    } else {
      showError("Cannot undo further.");
    }
  }, [history, currentHistoryIndex]);

  const redo = useCallback(() => {
    const newIndex = Math.min(history.length - 1, currentHistoryIndex + 1);
    if (newIndex !== currentHistoryIndex) {
      const entry = history[newIndex];
      setCurrentEditState(entry.state);
      setLayers(entry.layers);
      setCurrentHistoryIndex(newIndex);
      setSelectedLayerId(null);
      showSuccess(`Redo: ${entry.name}`);
    } else {
      showError("Cannot redo further.");
    }
  }, [history, currentHistoryIndex]);

  const canUndo = currentHistoryIndex > 0;
  const canRedo = currentHistoryIndex < history.length - 1;

  const resetAllEdits = useCallback(() => {
    setCurrentEditState(initialEditState);
    setLayers(initialLayerState);
    setHistory([initialHistoryItem]);
    setCurrentHistoryIndex(0);
    setSelectedLayerId(null);
    clearSelectionState();
    showSuccess("All edits reset.");
  }, []);

  const clearSelectionState = useCallback(() => {
    setSelectionPath(null);
    setSelectionMaskDataUrl(null);
  }, []);

  return {
    // Refs
    workspaceRef, imgRef,
    // Dialogs
    isGenerateOpen, setIsGenerateOpen,
    isGenerativeFillOpen, setIsGenerativeFillOpen,
    isPreviewingOriginal, setIsPreviewingOriginal,
    // Core State
    image, setImage,
    dimensions, setDimensions,
    fileInfo, setFileInfo,
    exifData, setExifData,
    currentEditState, setCurrentEditState,
    updateCurrentState,
    resetAllEdits,
    // History
    history, setHistory,
    currentHistoryIndex, setCurrentHistoryIndex,
    recordHistory,
    undo, redo,
    canUndo, canRedo,
    // Layers
    layers, setLayers,
    selectedLayerId, setSelectedLayerId,
    // Tools
    activeTool, setActiveTool,
    brushState, setBrushState,
    gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor,
    backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType,
    // Selection
    selectionPath, setSelectionPath,
    selectionMaskDataUrl, setSelectionMaskDataUrl,
    marqueeStart, setMarqueeStart,
    marqueeCurrent, setMarqueeCurrent,
    clearSelectionState,
    selectiveBlurAmount, setSelectiveBlurAmount,
    customHslColor, setCustomHslColor,
    selectionSettings, setSelectionSettings,
    cloneSourcePoint, setCloneSourcePoint,
    // Zoom
    zoom, setZoom,
    // Constants
    initialLayerState, initialHistoryItem,
    // External
    systemFonts, setSystemFonts, customFonts, addCustomFont, removeCustomFont,
    geminiApiKey, stabilityApiKey,
    dismissToast,
  };
};