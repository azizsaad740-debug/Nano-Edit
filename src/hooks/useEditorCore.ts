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
  initialPanelLayout,
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
import { showSuccess, showError, dismissToast, showLoading } from "@/utils/toast";
import { useFontManager } from "./useFontManager";
import { useSettings } from "./useSettings";
import { useSession } from "@/integrations/supabase/session-provider";
import type { EditorAPI } from "@/core/EditorAPI";
import { extensionManager } from "@/core/ExtensionManager";
import { InvertToolExtension } from "@/extensions/ExampleExtension";

// Register extensions immediately (stub for Admin Panel management)
extensionManager.register(new InvertToolExtension());

export const useEditorCore = () => {
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
  const [isMouseOverImage, setIsMouseOverImage] = useState(false);
  const [isFontManagerOpen, setIsFontManagerOpen] = useState(false);

  // Core Project State
  const [image, setImage] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [exifData, setExifData] = useState<any>(null);
  const [currentEditState, setCurrentEditState] = useState<EditState>(initialEditState);
  const [layers, setLayers] = useState<Layer[]>(initialLayerState);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]); // NEW
  const selectedLayerId = selectedLayerIds.length > 0 ? selectedLayerIds[0] : null; // Derived primary ID
  const setSelectedLayerId = useCallback((id: string | null) => {
    setSelectedLayerIds(id ? [id] : []);
  }, []);
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
  const [panelLayout, setPanelLayout] = useState<PanelTab[]>(initialPanelLayout);
  const [activeRightTab, setActiveRightTab] = useState('layers');
  const [activeBottomTab, setActiveBottomTab] = useState('correction');
  
  // External Hooks
  const { systemFonts, customFonts, addCustomFont, removeCustomFont } = useFontManager();
  const { geminiApiKey, stabilityApiKey } = useSettings();
  const { user, isGuest, isAdmin } = useSession();

  const selectedLayer = useMemo(() => layers.find(l => l.id === selectedLayerId), [layers, selectedLayerId]);

  const updateCurrentState = useCallback((updates: Partial<EditState>) => {
    setCurrentEditState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearSelectionState = useCallback(() => {
    setSelectionPath(null);
    setSelectionMaskDataUrl(null);
    setMarqueeStart(null);
    setMarqueeCurrent(null);
  }, [setSelectionPath, setSelectionMaskDataUrl, setMarqueeStart, setMarqueeCurrent]);

  // --- Proxy Mode Logic ---
  const checkAndToggleProxyMode = useCallback(() => {
    if (!fileInfo || !dimensions) {
      updateCurrentState({ isProxyMode: false });
      return;
    }
    
    // Simple heuristic: If file size > 5MB OR layer count > 10, enable proxy mode
    const isHeavyFile = (fileInfo.size || 0) > 5 * 1024 * 1024; // 5MB
    const isComplexProject = layers.length > 10;
    
    const shouldBeProxy = isHeavyFile || isComplexProject;
    
    if (shouldBeProxy !== currentEditState.isProxyMode) {
      updateCurrentState({ isProxyMode: shouldBeProxy });
      if (shouldBeProxy) {
        showSuccess("Project complexity detected. Entering Proxy Mode (Low Quality Preview).");
      } else {
        showSuccess("Exiting Proxy Mode. Rendering in full quality.");
      }
    }
  }, [fileInfo, dimensions, layers.length, updateCurrentState, currentEditState.isProxyMode]);
  
  // Run proxy check whenever project state changes
  useEffect(() => {
    checkAndToggleProxyMode();
  }, [checkAndToggleProxyMode, layers, fileInfo, dimensions]);
  
  // --- Core API Implementation ---
  
  const updateLayerApi = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prevLayers => {
      const updateRecursive = (currentLayers: Layer[]): Layer[] => {
        return currentLayers.map(layer => {
          if (layer.id === id) {
            return { ...layer, ...updates } as Layer;
          }
          if (layer.type === 'group' && layer.children) {
            return { ...layer, children: updateRecursive(layer.children) } as Layer;
          }
          return layer;
        });
      };
      return updateRecursive(prevLayers);
    });
  }, [setLayers]);
  
  const recordHistoryApi = useCallback((name: string, stateUpdates?: Partial<EditState>, currentLayers?: Layer[]) => {
    const stateToRecord = stateUpdates ? { ...currentEditState, ...stateUpdates } : currentEditState;
    const layersToRecord = currentLayers || layers;
    
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    
    // Merge brush state and history indices into the recorded EditState
    const finalState: EditState = {
        ...stateToRecord,
        brushState: brushState,
        history: newHistory, 
        historyBrushSourceIndex: currentHistoryIndex,
    };
    
    const newEntry: HistoryItem = { name, state: finalState, layers: layersToRecord };
    
    // Prevent duplicate history entries if state hasn't changed significantly
    if (newHistory.length > 0 && newHistory[newHistory.length - 1].name === name) {
        return;
    }

    setHistory([...newHistory, newEntry]);
    setCurrentHistoryIndex(newHistory.length);
  }, [history, currentHistoryIndex, currentEditState, layers, brushState]);
  
  const getRole = useCallback((): 'guest' | 'registered' | 'admin' => {
    if (isGuest) return 'guest';
    if (isAdmin) return 'admin';
    if (user) return 'registered';
    return 'guest';
  }, [isGuest, isAdmin, user]);

  const editorApi: EditorAPI = useMemo(() => ({
    getLayers: () => layers,
    getEditState: () => currentEditState,
    getDimensions: () => dimensions,
    getSelectedLayerId: () => selectedLayerId,
    getBrushState: () => brushState,
    getSelectionMaskDataUrl: () => selectionMaskDataUrl,
    
    updateLayer: updateLayerApi,
    setLayers: setLayers,
    
    recordHistory: recordHistoryApi,
    
    showToast: (type, message) => {
      if (type === 'success') return showSuccess(message);
      if (type === 'error') return showError(message);
      if (type === 'loading') return showLoading(message);
      return '';
    },
    dismissToast: dismissToast,
    
    getUserRole: getRole,
    getApiKey: (service) => service === 'gemini' ? geminiApiKey : stabilityApiKey,
    
    invokeExtension: (id, method, args) => extensionManager.invokeExtension(id, method, args),
  }), [layers, currentEditState, dimensions, selectedLayerId, brushState, selectionMaskDataUrl, updateLayerApi, setLayers, recordHistoryApi, getRole, geminiApiKey, stabilityApiKey]);

  // Initialize Extension Manager once the API is stable
  useEffect(() => {
    extensionManager.initialize(editorApi);
  }, [editorApi]);
  
  // --- History Handlers (using API) ---
  
  const undo = useCallback((steps: number = 1) => {
    const newIndex = Math.max(0, currentHistoryIndex - steps);
    if (newIndex !== currentHistoryIndex) {
      const entry = history[newIndex];
      if (!entry) {
        showError("History state not found.");
        return;
      }
      setCurrentEditState(entry.state);
      setLayers(entry.layers);
      setCurrentHistoryIndex(newIndex);
      setSelectedLayerIds([]); // NEW
      
      // Restore local state amounts from history entry
      setSelectiveBlurAmount(entry.state.selectiveBlurAmount);
      setSelectiveSharpenAmount(entry.state.selectiveSharpenAmount);
      setBrushState(entry.state.brushState);
      
      showSuccess(`Undo: ${entry.name}`);
    } else {
      showError("Cannot undo further.");
    }
  }, [history, currentHistoryIndex, setSelectiveBlurAmount, setSelectiveSharpenAmount, setBrushState]);

  const redo = useCallback(() => {
    const newIndex = Math.min(history.length - 1, currentHistoryIndex + 1);
    if (newIndex !== currentHistoryIndex) {
      const entry = history[newIndex];
      if (!entry) {
        showError("History state not found.");
        return;
      }
      setCurrentEditState(entry.state);
      setLayers(entry.layers);
      setCurrentHistoryIndex(newIndex);
      setSelectedLayerIds([]); // NEW
      
      // Restore local state amounts from history entry
      setSelectiveBlurAmount(entry.state.selectiveBlurAmount);
      setSelectiveSharpenAmount(entry.state.selectiveSharpenAmount);
      setBrushState(entry.state.brushState);
      
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
    setSelectedLayerIds([]); // NEW
    clearSelectionState();
    setSelectiveBlurAmount(initialEditState.selectiveBlurAmount);
    setSelectiveSharpenAmount(initialEditState.selectiveSharpenAmount);
    setBrushState(initialBrushState);
    showSuccess("All edits reset.");
  }, [clearSelectionState, setBrushState]);
  
  const togglePanelVisibility = useCallback((id: string) => {
    setPanelLayout(prev => prev.map(tab => {
      if (tab.id === id) {
        const newLocation = tab.visible ? 'hidden' : (tab.location === 'hidden' ? 'right' : tab.location);
        return { ...tab, visible: !tab.visible, location: newLocation };
      }
      return tab;
    }));
  }, [setPanelLayout]);

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
    // Core API methods (exposed for useEditorLogic)
    editorApi,
    
    // Refs
    workspaceRef, imgRef,
    // Dialogs
    isGenerateOpen, setIsGenerateOpen,
    isGenerativeFillOpen, setIsGenerativeFillOpen,
    isPreviewingOriginal, setIsPreviewingOriginal,
    isFullscreen, setIsFullscreen,
    isSettingsOpen, setIsSettingsOpen,
    isMobile,
    isFontManagerOpen, setIsFontManagerOpen,
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
    recordHistory: recordHistoryApi, // Use API version
    undo, redo,
    canUndo, canRedo,
    historyBrushSourceIndex, setHistoryBrushSourceIndex,
    // Layers
    layers, setLayers,
    selectedLayerId, // Keep derived ID for compatibility
    setSelectedLayerId, // Keep setter for single selection
    selectedLayerIds, // NEW
    setSelectedLayerIds, // NEW
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
    onOpenFontManager: () => setIsFontManagerOpen(true),
    geminiApiKey, stabilityApiKey,
    dismissToast,
    // Panel Management
    panelLayout, setPanelLayout,
    reorderPanelTabs,
    togglePanelVisibility,
    activeRightTab, setActiveRightTab,
    activeBottomTab, setActiveBottomTab,
    setIsMouseOverImage,
    // Auth
    user, isGuest, isAdmin,
    // Proxy Mode
    checkAndToggleProxyMode,
  };
};