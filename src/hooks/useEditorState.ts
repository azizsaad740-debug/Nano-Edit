import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { toast } from 'sonner';
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
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
  type PanelTab,
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Core Project State
  const [image, setImage] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [exifData, setExifData] = useState<any>(null);
  const [currentEditState, setCurrentEditState] = useState<EditState>(initialEditState);
  const [layers, setLayers] = useState<Layer[]>(initialLayerState);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
  const [brushState, setBrushState] = useState<BrushState>(initialBrushState);
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
  
  // Gradient Drawing State
  const [gradientStart, setGradientStart] = useState<Point | null>(null);
  const [gradientCurrent, setGradientCurrent] = useState<Point | null>(null);
  
  // Zoom State (Managed here for global access)
  const [zoom, setZoom] = useState(1);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([initialHistoryItem]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [historyBrushSourceIndex, setHistoryBrushSourceIndex] = useState(0);

  // Panel Management State
  const [panelLayout, setPanelLayout] = useState<PanelTab[]>([]); // Initialized as empty, populated by Index.tsx
  const [activeRightTab, setActiveRightTab] = useState('layers');
  const [activeBottomTab, setActiveBottomTab] = useState('correction');
  
  // External Hooks
  const { systemFonts, customFonts, addCustomFont, removeCustomFont, onOpenFontManager } = useFontManager();
  const { geminiApiKey, stabilityApiKey } = useSettings();

  const selectedLayer = useMemo(() => layers.find(l => l.id === selectedLayerId), [layers, selectedLayerId]);

  const updateCurrentState = useCallback((updates: Partial<EditState>) => {
    setCurrentEditState(prev => ({ ...prev, ...updates }));
  }, []);

  // Define clearSelectionState before resetAllEdits
  const clearSelectionState = useCallback(() => {
    setSelectionPath(null);
    setSelectionMaskDataUrl(null);
    setMarqueeStart(null);
    setMarqueeCurrent(null);
  }, [setSelectionPath, setSelectionMaskDataUrl, setMarqueeStart, setMarqueeCurrent]);

  const recordHistory = useCallback((name: string, state: EditState, currentLayers: Layer[]) => {
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    
    // Merge brush state and history indices into the recorded EditState
    const stateToRecord: EditState = {
        ...state,
        brushState: brushState,
        history: newHistory, 
        historyBrushSourceIndex: currentHistoryIndex,
    };
    
    const newEntry: HistoryItem = { name, state: stateToRecord, layers: currentLayers };
    
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
  }, [history, currentHistoryIndex, setSelectiveBlurAmount, setSelectiveSharpenAmount, setBrushState]);

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
  }, [history, currentHistoryIndex, setSelectiveBlurAmount, setSelectiveSharpenAmount, setBrushState]);

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
  }, [clearSelectionState, setBrushState]);
  
  const reorderPanelTabs = useCallback((activeId: string, overId: string, newLocation: 'right' | 'bottom') => {
    setPanelLayout(prev => {
      const activeIndex = prev.findIndex(t => t.id === activeId);
      const overIndex = prev.findIndex(t => t.id === overId);
      
      if (activeIndex === -1 || overIndex === -1) return prev;

      const activeTab = prev[activeIndex];
      
      // 1. Change location if dropped onto a different panel
      if (activeTab.location !== newLocation) {
        const updated = prev.map(t => t.id === activeId ? { ...t, location: newLocation, visible: true } : t);
        return updated;
      }
      
      // 2. Reorder within the same panel
      const itemsInPanel = prev.filter(t => t.location === newLocation).sort((a, b) => a.order - b.order);
      const oldIndex = itemsInPanel.findIndex(t => t.id === activeId);
      const newIndex = itemsInPanel.findIndex(t => t.id === overId);
      
      const reorderedItems = arrayMove(itemsInPanel, oldIndex, newIndex);
      
      // Re-apply order numbers
      const updatedPanel = reorderedItems.map((t, index) => ({ ...t, order: index + 1 }));
      
      // Merge back into the full layout
      const otherTabs = prev.filter(t => t.location !== newLocation);
      return [...otherTabs, ...updatedPanel].sort((a, b) => a.order - b.order);
    });
  }, [setPanelLayout]);

  return {
    // Refs
    workspaceRef, imgRef,
    // Dialogs
    isGenerateOpen, setIsGenerateOpen,
    isGenerativeFillOpen, setIsGenerativeFillOpen,
    isPreviewingOriginal, setIsPreviewingOriginal,
    isFullscreen, setIsFullscreen,
    isSettingsOpen, setIsSettingsOpen,
    isMobile,
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
    layers, setLayers,
    selectedLayerId, setSelectedLayerId,
    selectedLayer,
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
    gradientStart, setGradientStart,
    gradientCurrent, setGradientCurrent,
    clearSelectionState,
    selectiveBlurAmount, setSelectiveBlurAmount,
    selectiveSharpenAmount, setSelectiveSharpenAmount,
    customHslColor, setCustomHslColor,
    selectionSettings, setSelectionSettings,
    cloneSourcePoint, setCloneSourcePoint,
    // Zoom
    workspaceZoom: zoom, setZoom,
    // Constants
    initialEditState, initialLayerState,
    // External
    systemFonts,
    customFonts, addCustomFont, removeCustomFont,
    onOpenFontManager,
    geminiApiKey, stabilityApiKey,
    dismissToast,
    // Panel Management
    panelLayout, setPanelLayout,
    reorderPanelTabs,
    activeRightTab, setActiveRightTab,
    activeBottomTab, setActiveBottomTab,
  };
};