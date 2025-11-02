import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { toast } from 'sonner';
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
  type ShapeType,
  type Dispatch, // Import Dispatch
  type SetStateAction, // Import SetStateAction
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
  const [isFullscreen, setIsFullscreen] = useState(false); // ADDED
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // ADDED
  const [isMobile, setIsMobile] = useState(false); // ADDED (Stub)

  // Core Project State
  const [image, setImage] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [exifData, setExifData] = useState<any>(null);
  const [currentEditState, setCurrentEditState] = useState<EditState>(initialEditState);
  const [layers, setLayers] = useState<Layer[]>(initialLayerState);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const selectedLayer = useMemo(() => layers.find(l => l.id === selectedLayerId), [layers, selectedLayerId]); // ADDED
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
  const [brushState, setBrushState] = useState<BrushState>({ ...initialBrushState, color: '#000000' });
  const [gradientToolState, setGradientToolState] = useState<GradientToolState>(initialGradientToolState);
  const [foregroundColor, setForegroundColor] = useState<string>('#000000');
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF');
  const [selectedShapeType, setSelectedShapeType] = useState<ShapeType | null>('rect');
  const [selectionPath, setSelectionPath] = useState<Point[] | null>(null);
  const [selectionMaskDataUrl, setSelectionMaskDataUrl] = useState<string | null>(null);
  
  // Selective Retouching Amounts (Managed locally for live updates)
  const [selectiveBlurAmount, setSelectiveBlurAmount] = useState<number>(initialEditState.selectiveBlurAmount);
  const [selectiveSharpenAmount, setSelectiveSharpenAmount] = useState<number>(initialEditState.selectiveSharpenAmount); 
  
  const [customHslColor, setCustomHslColor] = useState<string>(initialEditState.customHslColor);
  const [selectionSettings, setSelectionSettings] = useState<SelectionSettings>(initialSelectionSettings);
  const [cloneSourcePoint, setCloneSourcePoint] = useState<Point | null>(null);

  // Selection Drawing State
  const [marqueeStart, setMarqueeStart] = useState<Point | null>(null);
  const [marqueeCurrent, setMarqueeCurrent] = useState<Point | null>(null);
  const [gradientStart, setGradientStart] = useState<Point | null>(null); // ADDED
  const [gradientCurrent, setGradientCurrent] = useState<Point | null>(null); // ADDED
  
  // Zoom State (Managed here for global access)
  const [zoom, setZoom] = useState(1);
  const [workspaceZoom, setWorkspaceZoom] = useState(1); // ADDED

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([initialHistoryItem]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [historyBrushSourceIndex, setHistoryBrushSourceIndex] = useState(0);

  // External Hooks
  const { systemFonts, customFonts, addCustomFont, removeCustomFont } = useFontManager();
  const { geminiApiKey, stabilityApiKey } = useSettings();

  const updateCurrentState = useCallback((updates: Partial<EditState>) => {
    setCurrentEditState(prev => ({ ...prev, ...updates }));
  }, []);

  const recordHistory = useCallback((name: string, state: EditState, currentLayers: Layer[]) => {
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    
    // Merge current tool/history state into the EditState before saving
    const stateToSave: EditState = {
        ...state,
        brushState: brushState,
        history: newHistory, // Save the history array itself
        historyBrushSourceIndex: currentHistoryIndex,
    };
    
    const newEntry: HistoryItem = { name, state: stateToSave, layers: currentLayers };
    
    // Prevent duplicate history entries if state hasn't changed significantly
    if (newHistory.length > 0 && newHistory[newHistory.length - 1].name === name) {
        return;
    }

    setHistory([...newHistory, newEntry]);
    setCurrentHistoryIndex(newHistory.length);
  }, [history, currentHistoryIndex, brushState]);

  const undo = useCallback((steps: number = 1) => {
    const newIndex = Math.max(0, currentHistoryIndex - steps);
    if (newIndex !== currentHistoryIndex) {
      const entry = history[newIndex];
      if (!entry) { // Safety check
        showError("History state not found.");
        return;
      }
      setCurrentEditState(entry.state);
      setLayers(entry.layers);
      setCurrentHistoryIndex(newIndex);
      setSelectedLayerId(null);
      
      // Restore local state amounts from history entry
      setSelectiveBlurAmount(entry.state.selectiveBlurAmount);
      setSelectiveSharpenAmount(entry.state.selectiveSharpenAmount);
      setBrushState(entry.state.brushState); // Restore brush state
      
      showSuccess(`Undo: ${entry.name}`);
    } else {
      showError("Cannot undo further.");
    }
  }, [history, currentHistoryIndex]);

  const redo = useCallback(() => {
    const newIndex = Math.min(history.length - 1, currentHistoryIndex + 1);
    if (newIndex !== currentHistoryIndex) {
      const entry = history[newIndex];
      if (!entry) { // Safety check
        showError("History state not found.");
        return;
      }
      setCurrentEditState(entry.state);
      setLayers(entry.layers);
      setCurrentHistoryIndex(newIndex);
      setSelectedLayerId(null);
      
      // Restore local state amounts from history entry
      setSelectiveBlurAmount(entry.state.selectiveBlurAmount);
      setSelectiveSharpenAmount(entry.state.selectiveSharpenAmount);
      setBrushState(entry.state.brushState); // Restore brush state
      
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
    setSelectiveBlurAmount(initialEditState.selectiveBlurAmount);
    setSelectiveSharpenAmount(initialEditState.selectiveSharpenAmount);
    setBrushState(initialBrushState); // Reset brush state
    showSuccess("All edits reset.");
  }, []);

  const clearSelectionState = useCallback(() => {
    setSelectionPath(null);
    setSelectionMaskDataUrl(null);
  }, []);
  
  // Placeholder functions for useEditorLogic destructuring
  const handleReorder = useCallback(() => console.log('reorder stub'), []);
  const handleCopy = useCallback(() => console.log('copy stub'), []);
  const handleLayerDelete = useCallback(() => console.log('delete layer stub'), []);
  const onBrushCommit = useCallback(() => recordHistory('Brush Settings Change', currentEditState, layers), [recordHistory, currentEditState, layers]);
  const handleZoomIn = useCallback(() => setWorkspaceZoom(prev => Math.min(5, prev + 0.1)), []);
  const handleZoomOut = useCallback(() => setWorkspaceZoom(prev => Math.max(0.1, prev - 0.1)), []);
  const handleFitScreen = useCallback(() => setWorkspaceZoom(1), []);
  const onOpenFontManager = useCallback(() => console.log('open font manager stub'), []);
  const onCropChange = useCallback(() => console.log('crop change stub'), []);
  const onCropComplete = useCallback(() => console.log('crop complete stub'), []);
  const handleProjectSettingsUpdate = useCallback(() => console.log('project settings update stub'), []);


  return {
    // Refs
    workspaceRef, imgRef,
    // Dialogs
    isGenerateOpen, setIsGenerateOpen,
    isGenerativeFillOpen, setIsGenerativeFillOpen,
    isPreviewingOriginal, setIsPreviewingOriginal,
    setIsFullscreen, setIsSettingsOpen, // ADDED
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
    historyBrushSourceIndex, setHistoryBrushSourceIndex,
    // Layers
    layers, setLayers: setLayers as Dispatch<SetStateAction<Layer[]>>, // FIXED: Type for setLayers
    selectedLayerId, setSelectedLayerId,
    selectedLayer, // ADDED
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
    gradientStart, setGradientStart, // ADDED
    gradientCurrent, setGradientCurrent, // ADDED
    clearSelectionState,
    selectiveBlurAmount, setSelectiveBlurAmount,
    selectiveSharpenAmount, setSelectiveSharpenAmount,
    customHslColor, setCustomHslColor,
    selectionSettings, setSelectionSettings,
    cloneSourcePoint, setCloneSourcePoint,
    // Zoom
    zoom, setZoom,
    workspaceZoom, setWorkspaceZoom, // ADDED
    // Constants
    initialLayerState, initialHistoryItem,
    initialEditState, // ADDED
    // External
    systemFonts,
    customFonts, addCustomFont, removeCustomFont,
    geminiApiKey, stabilityApiKey,
    dismissToast,
    // Placeholder functions for useEditorLogic destructuring
    handleReorder, isMobile, handleCopy, handleLayerDelete, onBrushCommit,
    handleZoomIn, handleZoomOut, handleFitScreen, onOpenFontManager,
    onCropChange, onCropComplete, handleProjectSettingsUpdate,
  };
};