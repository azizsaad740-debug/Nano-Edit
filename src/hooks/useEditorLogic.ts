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
import { useImageLoader } from "./useImageLoader";
import { useLayers } from "./useLayers";
import { useAdjustments } from "./useAdjustments";
import { useEffects } from "./useEffects";
import { useColorGrading } from "./useColorGrading";
import { useHslAdjustments } from "./useHslAdjustments";
import { useCurves } from "./useCurves";
import { useTransform } from "./useTransform";
import { useCrop } from "./useCrop";
import { useFrame } from "./useFrame";
import { usePresets } from "./usePresets";
import { useGradientPresets } from "./useGradientPresets";
import { useGenerativeAi } from "./useGenerativeAi";
import { useExport } from "./useExport";
import { useChannels } from "./useChannels";
import { useSelectiveRetouch } from "./useSelectiveRetouch";
import { useMarqueeToolInteraction } from "./useMarqueeToolInteraction";
import { useLassoToolInteraction } from "./useLassoToolInteraction";
import { useMagicWandToolInteraction } from "./useMagicWandToolInteraction";
import { useObjectSelectToolInteraction } from "./useObjectSelectToolInteraction";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { renderImageToCanvas, copyImageToClipboard } from "@/utils/imageUtils";
import ExifReader from "exifreader";
import { polygonToMaskDataUrl } from "@/utils/maskUtils";

// Register extensions immediately (stub for Admin Panel management)
extensionManager.register(new InvertToolExtension());

export const useEditorLogic = ({ initialImage }: { initialImage?: string }) => {
  // Refs for DOM elements
  const workspaceRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Dialog State
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isGenerativeFillOpen, setIsGenerativeFillOpen] = useState(false);
  const [isPreviewingOriginal, setIsPreviewingOriginal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMouseOverImage, setIsMouseOverImage] = useState(false);
  const [isFontManagerOpen, setIsFontManagerOpen] = useState(false);

  // Core Project State
  const [image, setImage] = useState<string | null>(initialImage || null);
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
  // FIX 4: Use initialGradientToolState directly
  const [brushState, setBrushState] = useState<BrushState>(initialEditState.brushState);
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
  const [selectionSettings, setSelectionSettings] = useState<SelectionSettings>(initialEditState.selectionSettings);
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
            return { ...layer, children: updateRecursive(layer.children, id, updates) } as Layer;
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
        selectiveBlurAmount: selectiveBlurAmount, // Include local state
        selectiveSharpenAmount: selectiveSharpenAmount, // Include local state
    };
    
    const newEntry: HistoryItem = { name, state: finalState, layers: layersToRecord };
    
    // Prevent duplicate history entries if state hasn't changed significantly
    if (newHistory.length > 0 && newHistory[newHistory.length - 1].name === name) {
        return;
    }

    setHistory([...newHistory, newEntry]);
    setCurrentHistoryIndex(newHistory.length);
  }, [history, currentHistoryIndex, currentEditState, layers, brushState, selectiveBlurAmount, selectiveSharpenAmount]);
  
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
        const activeTab = prev.find(t => t.id === activeId);
        if (!activeTab) return prev;

        // 1. Prepare the list of tabs in the target panel (excluding the active tab if it was already there)
        let targetTabs = prev
            .filter(t => t.location === newLocation && t.id !== activeId)
            .sort((a, b) => a.order - b.order);

        // 2. Find the index where the active tab should be inserted
        const overIndex = targetTabs.findIndex(t => t.id === overId);
        const insertIndex = overIndex === -1 ? targetTabs.length : overIndex;

        // 3. Insert the active tab into the target list
        const updatedActiveTab = { ...activeTab, location: newLocation, visible: true };
        targetTabs.splice(insertIndex, 0, updatedActiveTab);

        // 4. Re-assign order numbers for the target panel
        const updatedTargetTabs = targetTabs.map((t, index) => ({ ...t, order: index + 1 }));

        // 5. Filter out the active tab from its old location/state
        const remainingTabs = prev.filter(t => t.location !== newLocation && t.id !== activeId);

        // 6. Combine and return the new layout
        return [...remainingTabs, ...updatedTargetTabs].sort((a, b) => a.order - b.order);
    });
    
    // Ensure the newly moved tab becomes active in its new panel
    if (newLocation === 'right') {
        setActiveRightTab(activeId);
    } else {
        setActiveBottomTab(activeId);
    }
  }, [setPanelLayout, setActiveRightTab, setActiveBottomTab]);

  // --- Hook Integrations ---
  
  const { handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate, handleNewFromClipboard } = useImageLoader(
    setImage, setDimensions, setFileInfo, setExifData, setLayers, resetAllEdits, recordHistoryApi, setCurrentEditState, currentEditState, initialEditState, initialLayerState, setSelectedLayerId, clearSelectionState, setHistory, setCurrentHistoryIndex
  );
  
  const { 
    toggleLayerVisibility, renameLayer, deleteLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents,
    updateLayer: updateLayerLogic, commitLayerChange, onLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit, // FIX 5, 54: Corrected name
    addTextLayer, addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection,
    addShapeLayer, addGradientLayer: addGradientLayerLogic, onAddAdjustmentLayer, groupLayers, toggleGroupExpanded,
    onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onDeleteHiddenLayers, onArrangeLayer,
    hasActiveSelection, onApplySelectionAsMask, handleDestructiveOperation,
    handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd,
    handleReorder: onLayerReorder, findLayer, onSelectLayer, // NEW
  } = useLayers({
    layers, setLayers, recordHistory: recordHistoryApi, currentEditState, dimensions, foregroundColor, backgroundColor, gradientToolState, selectedShapeType, selectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl, clearSelectionState, setImage, setFileInfo, selectedLayerIds, setSelectedLayerIds, activeTool
  });
  
  const handleLayerDelete = useCallback(() => {
    if (selectedLayerIds.length > 0) {
      selectedLayerIds.forEach(id => deleteLayer(id));
    } else if (selectionMaskDataUrl) {
      handleDestructiveOperation('delete');
    } else {
      showError("Nothing selected to delete.");
    }
  }, [selectedLayerIds, deleteLayer, selectionMaskDataUrl, handleDestructiveOperation]);
  
  const addGradientLayerNoArgs = useCallback(() => {
    if (!dimensions) {
      showError("Cannot add gradient layer without dimensions.");
      return;
    }
    // Default gradient across the whole canvas
    addGradientLayerLogic({ x: 0, y: 0 }, { x: dimensions.width, y: dimensions.height });
  }, [dimensions, addGradientLayerLogic]);
  
  const { adjustments, onAdjustmentChange, onAdjustmentCommit, selectedFilter, onFilterChange, applyPreset: applyAdjustmentPreset } = useAdjustments(currentEditState, updateCurrentState, recordHistoryApi, layers);
  const { effects, onEffectChange, onEffectCommit, applyPreset: applyEffectsPreset } = useEffects(currentEditState, updateCurrentState, recordHistoryApi, layers);
  const { grading, onGradingChange, onGradingCommit, applyPreset: applyGradingPreset } = useColorGrading(currentEditState, updateCurrentState, recordHistoryApi, layers);
  const { hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, applyPreset: applyHslPreset } = useHslAdjustments(currentEditState, updateCurrentState, recordHistoryApi, layers);
  const { curves, onCurvesChange, onCurvesCommit, applyPreset: applyCurvesPreset } = useCurves({ currentEditState, updateCurrentState, recordHistory: recordHistoryApi, layers });
  const { transforms, onTransformChange, rotation, onRotationChange, onRotationCommit, applyPreset: applyTransformPreset } = useTransform(currentEditState, updateCurrentState, recordHistoryApi, layers);
  const { crop, onCropChange, onCropComplete, onAspectChange, aspect, applyPreset: applyCropPreset } = useCrop(currentEditState, updateCurrentState, recordHistoryApi, layers);
  const { frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, applyPreset: applyFramePreset } = useFrame({ currentEditState, updateCurrentState, recordHistory: recordHistoryApi, layers });
  const { presets, savePreset, deletePreset } = usePresets(); // FIX 6: Use deletePreset
  const { gradientPresets, saveGradientPreset, deleteGradientPreset } = useGradientPresets(); // FIX 7: Use deleteGradientPreset
  
  // NEW: Channels and Selective Retouching
  const { channels, onChannelChange: onChannelChangeLogic, applyPreset: applyChannelsPreset } = useChannels({ currentEditState, updateCurrentState, recordHistory: recordHistoryApi, layers });
  const { selectiveBlurMask, selectiveSharpenMask, handleSelectiveRetouchStrokeEnd, applyPreset: applySelectiveRetouchPreset, onSelectiveBlurAmountCommit, onSelectiveSharpenAmountCommit } = useSelectiveRetouch(currentEditState, updateCurrentState, recordHistoryApi, layers, dimensions);


  const handleSavePresetCommit = useCallback((name: string) => {
    savePreset(name, currentEditState, layers);
  }, [savePreset, currentEditState, layers]);
  
  const handleApplyPreset = useCallback((preset: any) => {
    applyAdjustmentPreset(preset.state);
    applyEffectsPreset(preset.state);
    applyGradingPreset(preset.state);
    applyHslPreset(preset.state);
    applyCurvesPreset(preset.state);
    applyTransformPreset(preset.state);
    applyCropPreset(preset.state);
    applyFramePreset(preset.state);
    applyChannelsPreset(preset.state);
    applySelectiveRetouchPreset(preset.state);
    
    if (preset.layers) {
      setLayers(preset.layers);
    }
    recordHistoryApi(`Applied Preset: ${preset.name}`, currentEditState, layers);
    showSuccess(`Preset "${preset.name}" applied.`);
  }, [applyAdjustmentPreset, applyEffectsPreset, applyGradingPreset, applyHslPreset, applyCurvesPreset, applyTransformPreset, applyCropPreset, applyFramePreset, applyChannelsPreset, applySelectiveRetouchPreset, recordHistoryApi, currentEditState, layers, setLayers]);

  const handleMaskResult = useCallback((maskDataUrl: string, historyName: string) => {
    setSelectionMaskDataUrl(maskDataUrl);
    recordHistoryApi(historyName, currentEditState, layers);
  }, [recordHistoryApi, currentEditState, layers]);

  const { handleGenerateImage, handleGenerativeFill } = useGenerativeAi(
    geminiApiKey, image, dimensions, setImage, setDimensions, setFileInfo, layers, addDrawingLayer, updateLayerLogic, commitLayerChange, clearSelectionState, setIsGenerateOpen, setIsGenerativeFillOpen
  );
  
  const { handleExportClick } = useExport({ layers, dimensions, currentEditState, imgRef, base64Image: image, stabilityApiKey });

  // --- Workspace Interaction Hooks ---
  
  useMarqueeToolInteraction({
    activeTool, workspaceRef, imageContainerRef: imgRef, zoom, dimensions, marqueeStart, marqueeCurrent, setMarqueeStart, setMarqueeCurrent, setSelectionMaskDataUrl, recordHistory: recordHistoryApi, currentEditState, layers, imgRef
  });
  
  useLassoToolInteraction({
    activeTool, workspaceRef, imageContainerRef: imgRef, zoom, dimensions, selectionPath, setSelectionPath, setSelectionMaskDataUrl, recordHistory: recordHistoryApi, currentEditState, layers, imgRef
  });
  
  useMagicWandToolInteraction({
    activeTool, workspaceRef, imageContainerRef: imgRef, zoom, dimensions, setSelectionMaskDataUrl, recordHistory: recordHistoryApi, currentEditState, layers, imgRef
  });
  
  useObjectSelectToolInteraction({
    activeTool, workspaceRef, imageContainerRef: imgRef, zoom, dimensions, setSelectionMaskDataUrl, recordHistory: recordHistoryApi, currentEditState, layers, imgRef
  });

  // --- Global Interaction Handlers ---

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(5, z + 0.1)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(0.1, z - 0.1)), []);
  const handleFitScreen = useCallback(() => setZoom(1), []);
  
  const handleCopy = useCallback(async () => {
    if (!image) {
      showError("No image to copy.");
      return;
    }
    const toastId = showLoading("Copying image to clipboard...");
    try {
      // Render the current state to a canvas (stub)
      const canvas = renderImageToCanvas(layers, dimensions || { width: 1, height: 1 }, currentEditState, imgRef.current, false, true);
      const dataUrl = canvas.toDataURL('image/png');
      await copyImageToClipboard(dataUrl);
      showSuccess("Image copied to clipboard.");
    } catch (error) {
      showError("Failed to copy image.");
    } finally {
      dismissToast(toastId);
    }
  }, [image, layers, dimensions, currentEditState]);

  const handleSwapColors = useCallback(() => {
    setForegroundColor(backgroundColor);
    setBackgroundColor(foregroundColor);
  }, [foregroundColor, backgroundColor]);

  const handleHistoryJump = useCallback((index: number) => {
    const entry = history[index];
    if (entry) {
      setCurrentEditState(entry.state);
      setLayers(entry.layers);
      setCurrentHistoryIndex(index);
      setSelectedLayerIds([]); // NEW
      
      // Restore local state amounts from history entry
      setSelectiveBlurAmount(entry.state.selectiveBlurAmount);
      setSelectiveSharpenAmount(entry.state.selectiveSharpenAmount);
      setBrushState(entry.state.brushState);
      
      showSuccess(`Jumped to: ${entry.name}`);
    }
  }, [history, setLayers, setCurrentEditState, setSelectiveBlurAmount, setSelectiveSharpenAmount, setBrushState]);

  // --- Workspace Mouse Handlers (Delegation) ---
  
  const handleWorkspaceMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // This is a central handler for tools that don't use dedicated interaction hooks
    if (activeTool === 'eyedropper' && dimensions) {
      // Eyedropper stub logic
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Simulate color pick (just a random hex for stub)
      const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
      setForegroundColor(randomColor);
      setActiveTool(null);
      showSuccess(`Color picked: ${randomColor}`);
    }
    
    // Handle polygonal lasso start
    if (activeTool === 'lassoPoly' && dimensions) {
      const imgRect = imgRef.current?.getBoundingClientRect();
      if (!imgRect) return;
      
      const scaleX = dimensions.width / imgRect.width;
      const scaleY = dimensions.height / imgRect.height;
      
      const x = (e.clientX - imgRect.left) * scaleX;
      const y = (e.clientY - imgRect.top) * scaleY;
      
      const newPoint: Point = { x, y };
      
      setSelectionPath(prev => {
        if (!prev) return [newPoint];
        
        // Check if closing the loop (near the start point)
        const startPoint = prev[0];
        const distance = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
        
        if (distance < 20 && prev.length >= 3) {
          // Close the loop (handled by lasso tool interaction on double click/mouse up)
          return prev;
        }
        
        return [...prev, newPoint];
      });
    }
    
    // Handle clone stamp source selection
    if (activeTool === 'cloneStamp' && (e.altKey || e.metaKey) && dimensions) {
      const imgRect = imgRef.current?.getBoundingClientRect();
      if (!imgRect) return;
      
      const scaleX = dimensions.width / imgRect.width;
      const scaleY = dimensions.height / imgRect.height;
      
      const x = (e.clientX - imgRect.left) * scaleX;
      const y = (e.clientY - imgRect.top) * scaleY;
      
      setCloneSourcePoint({ x, y });
      showSuccess("Clone source set.");
      e.preventDefault();
    }
    
    // Handle layer selection/deselection when clicking workspace
    if (activeTool === 'move' && !e.defaultPrevented) {
      // If clicking outside any layer, deselect all
      if (e.target === workspaceRef.current) {
        setSelectedLayerIds([]);
      }
    }
    
  }, [activeTool, dimensions, setSelectionPath, imgRef, setCloneSourcePoint, setSelectedLayerIds]);

  const handleWorkspaceMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Placeholder for general mouse move logic (e.g., cursor updates)
  }, []);

  const handleWorkspaceMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Placeholder for general mouse up logic
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
  }, [handleZoomIn, handleZoomOut]);

  // --- Base64 Image Source for AI/Export ---
  const base64Image = useMemo(() => {
    const backgroundLayer = layers.find(l => l.id === 'background');
    if (backgroundLayer && (backgroundLayer.type === 'image' || backgroundLayer.type === 'drawing')) {
      return backgroundLayer.dataUrl;
    }
    return null;
  }, [layers]);
  
  // --- History Brush Source Image ---
  const historyImageSrc = useMemo(() => {
    if (historyBrushSourceIndex >= 0 && historyBrushSourceIndex < history.length) {
      const historyLayers = history[historyBrushSourceIndex].layers;
      const backgroundLayer = historyLayers.find(l => l.id === 'background');
      if (backgroundLayer && (backgroundLayer.type === 'image' || backgroundLayer.type === 'drawing')) {
        return backgroundLayer.dataUrl;
      }
    }
    return base64Image; // Fallback to current image
  }, [history, historyBrushSourceIndex, base64Image]);

  // --- Final Return Object ---
  
  return useMemo(() => ({
    // Core State & Refs
    workspaceRef, imgRef,
    image, hasImage: !!image, dimensions, fileInfo, exifData,
    layers, selectedLayerId, setSelectedLayerId, selectedLayerIds, setSelectedLayerIds, selectedLayer,
    currentEditState, updateCurrentState, resetAllEdits,
    base64Image, historyImageSrc,
    
    // History
    history, currentHistoryIndex, recordHistory: recordHistoryApi, undo, redo, canUndo, canRedo,
    setCurrentHistoryIndex: handleHistoryJump, // Expose jump function via setter name
    historyBrushSourceIndex, setHistoryBrushSourceIndex,
    
    // Tools & Interaction
    activeTool, setActiveTool,
    brushState, setBrushState, onBrushCommit: () => recordHistoryApi("Update Brush Settings"),
    gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType,
    // Selection
    selectionPath, setSelectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl,
    marqueeStart, setMarqueeStart, marqueeCurrent, setMarqueeCurrent,
    gradientStart, setGradientStart, gradientCurrent, setGradientCurrent,
    cloneSourcePoint, setCloneSourcePoint,
    selectiveBlurAmount, setSelectiveBlurAmount, selectiveSharpenAmount, setSelectiveSharpenAmount,
    customHslColor, setCustomHslColor,
    selectionSettings, setSelectionSettings,
    workspaceZoom: zoom, zoom, setZoom,
    
    // Handlers
    handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp, handleWheel,
    handleZoomIn, handleZoomOut, handleFitScreen,
    handleCopy, handleSwapColors, handleLayerDelete,
    handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate, handleNewFromClipboard,
    handleExportClick, handleGenerateImage, handleGenerativeFill, handleMaskResult,
    handleProjectSettingsUpdate: (updates: any) => recordHistoryApi("Update Project Settings", updates), // Stub
    
    // Layer Actions
    updateLayer: updateLayerLogic, commitLayerChange, onLayerPropertyCommit,
    handleLayerOpacityChange, handleLayerOpacityCommit, // FIX 5, 54: Corrected name
    addTextLayer, addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection,
    addShapeLayer, addGradientLayer: addGradientLayerLogic, addGradientLayerNoArgs, onAddAdjustmentLayer,
    deleteLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents,
    groupLayers, toggleGroupExpanded, onLayerReorder, onArrangeLayer,
    onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onDeleteHiddenLayers,
    hasActiveSelection: !!selectionMaskDataUrl, onApplySelectionAsMask, handleDestructiveOperation,
    handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd,
    onSelectLayer, // NEW
    
    // Filters/Adjustments
    adjustments, onAdjustmentChange, onAdjustmentCommit,
    effects, onEffectChange, onEffectCommit,
    grading, onGradingChange, onGradingCommit,
    hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit,
    curves, onCurvesChange, onCurvesCommit,
    transforms, onTransformChange, rotation, onRotationChange, onRotationCommit,
    crop, onCropChange, onCropComplete, onAspectChange, aspect,
    frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit,
    selectedFilter, onFilterChange,
    channels, onChannelChange: onChannelChangeLogic,
    
    // Presets
    presets, handleApplyPreset, handleSavePresetCommit, deletePreset, // FIX 6, 9: Corrected name
    gradientPresets, saveGradientPreset, deleteGradientPreset, // FIX 7, 10: Corrected name
    
    // Settings/External
    geminiApiKey, stabilityApiKey,
    systemFonts, customFonts, addCustomFont, removeCustomFont, onOpenFontManager: () => setIsFontManagerOpen(true),
    isPreviewingOriginal, setIsPreviewingOriginal,
    setIsMouseOverImage,
    
    // Panel Management
    panelLayout, reorderPanelTabs, togglePanelVisibility, activeRightTab, setActiveRightTab, activeBottomTab, setActiveBottomTab,
    
    // Auth
    user, isGuest, isAdmin,
    
    // Selective Retouching Commit Functions (NEW)
    onSelectiveBlurAmountCommit,
    onSelectiveSharpenAmountCommit,
    
    // Dialog Setters (Exposed for Header/Index)
    setIsFullscreen, // FIX 67: Expose setter
    setIsSettingsOpen,
    setIsImportOpen,
    setIsGenerateOpen,
    setIsGenerativeFillOpen,
    setIsNewProjectOpen,
    setIsExportOpen,
    setIsProjectSettingsOpen,
    setIsFontManagerOpen,
    
    // Image/File Setters (Exposed for Smart Object Editor)
    setImage, setDimensions, setFileInfo, setExifData, setLayers, // FIX 57, 58, 59, 60, 61
    initialEditState, initialLayerState, // FIX 62, 63
    dismissToast, // FIX 56
    clearSelectionState, // FIX 64
  }), [
    workspaceRef, imgRef, image, dimensions, fileInfo, exifData, layers, selectedLayerId, setSelectedLayerId, selectedLayerIds, setSelectedLayerIds, selectedLayer, currentEditState, updateCurrentState, resetAllEdits, base64Image, historyImageSrc, history, currentHistoryIndex, recordHistoryApi, undo, redo, canUndo, canRedo, handleHistoryJump, historyBrushSourceIndex, setHistoryBrushSourceIndex, activeTool, setActiveTool, brushState, setBrushState, gradientToolState, setGradientToolState, foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor, selectedShapeType, setSelectedShapeType, selectionPath, setSelectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl, marqueeStart, setMarqueeStart, marqueeCurrent, setMarqueeCurrent, gradientStart, setGradientStart, gradientCurrent, setGradientCurrent, cloneSourcePoint, setCloneSourcePoint, selectiveBlurAmount, setSelectiveBlurAmount, selectiveSharpenAmount, setSelectiveSharpenAmount, customHslColor, setCustomHslColor, selectionSettings, setSelectionSettings, zoom, setZoom, handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp, handleWheel, handleZoomIn, handleZoomOut, handleFitScreen, handleCopy, handleSwapColors, handleLayerDelete, handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate, handleNewFromClipboard, handleExportClick, handleGenerateImage, handleGenerativeFill, handleMaskResult, updateLayerLogic, commitLayerChange, onLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit, addTextLayer, addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection, addShapeLayer, addGradientLayerLogic, addGradientLayerNoArgs, onAddAdjustmentLayer, deleteLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer, onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents, groupLayers, toggleGroupExpanded, onLayerReorder, onArrangeLayer, onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onDeleteHiddenLayers, hasActiveSelection, onApplySelectionAsMask, handleDestructiveOperation, handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd, onSelectLayer, adjustments, onAdjustmentChange, onAdjustmentCommit, effects, onEffectChange, onEffectCommit, grading, onGradingChange, onGradingCommit, hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, curves, onCurvesChange, onCurvesCommit, transforms, onTransformChange, rotation, onRotationChange, onRotationCommit, crop, onCropChange, onCropComplete, onAspectChange, aspect, frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, selectedFilter, onFilterChange, channels, onChannelChangeLogic, presets, handleApplyPreset, handleSavePresetCommit, deletePreset, gradientPresets, saveGradientPreset, deleteGradientPreset, geminiApiKey, stabilityApiKey, systemFonts, customFonts, addCustomFont, removeCustomFont, setIsPreviewingOriginal, setIsMouseOverImage, user, isGuest, isAdmin, panelLayout, reorderPanelTabs, togglePanelVisibility, activeRightTab, setActiveRightTab, activeBottomTab, setActiveBottomTab, onSelectiveBlurAmountCommit, onSelectiveSharpenAmountCommit, setIsFullscreen, setIsSettingsOpen, setIsImportOpen, setIsGenerateOpen, setIsGenerativeFillOpen, setIsNewProjectOpen, setIsExportOpen, setIsProjectSettingsOpen, setIsFontManagerOpen, setImage, setDimensions, setFileInfo, setExifData, setLayers, initialEditState, initialLayerState, dismissToast, clearSelectionState
  ]);
};