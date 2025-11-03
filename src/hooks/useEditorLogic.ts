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
  type ImageLayerData,
} from "@/types/editor";
import { showSuccess, showError, dismissToast } from "@/utils/toast";
import { useFontManager } from "./useFontManager";
import { useSettings } from "./useSettings";
import { useHistory } from './useHistory';
import { useLayers } from './useLayers';
import { useCrop } from './useCrop';
import { useFrame } from './useFrame';
import { useExport } from './useExport';
import { useGenerativeAi } from './useGenerativeAi';
import { useTransform } from './useTransform';
import { useAdjustments } from './useAdjustments';
import { useColorGrading } from './useColorGrading';
import { useHslAdjustments } from './useHslAdjustments';
import { useCurves } from './useCurves';
import { useChannels } from './useChannels';
import { useSelectiveRetouch } from './useSelectiveRetouch';
import { usePresets } from './usePresets';
import { useGradientPresets } from './useGradientPresets';
import { useProjectSettings } from './useProjectSettings';
import { useBrush } from './useBrush';
import { useTextTool } from './useTextTool';
import { useShapeTool } from './useShapeTool';
import { useGradientTool } from './useGradientTool';
import { useMoveTool } from './useMoveTool';
import { useLassoTool } from './useLassoTool';
import { useEyedropper } from './useEyedropper';
import { useDrawingTool } from './useDrawingTool';
import { useEffects } from './useEffects';
import { useImageLoader } from './useImageLoader';
import { rectToMaskDataUrl, ellipseToMaskDataUrl, floodFillToMaskDataUrl, objectSelectToMaskDataUrl } from '@/utils/maskUtils';
import { copyImageToClipboard } from '@/utils/imageUtils';
import { isImageOrDrawingLayer } from '@/types/editor';
import { useEditorState } from "./useEditorState";


export const useEditorLogic = (props: any) => {
  const state = useEditorState();
  const {
    // Core State
    image, dimensions, fileInfo, exifData, layers, selectedLayerId, selectedLayer,
    activeTool, setActiveTool, brushState, setBrushState, gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType, selectionPath, setSelectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl,
    selectiveBlurAmount, setSelectiveBlurAmount, selectiveSharpenAmount, setSelectiveSharpenAmount,
    customHslColor, setCustomHslColor, selectionSettings, setSelectionSettings, cloneSourcePoint, setCloneSourcePoint,
    
    // History
    history, currentHistoryIndex, recordHistory, undo, redo, canUndo, canRedo,
    setCurrentHistoryIndex, historyBrushSourceIndex, setHistoryBrushSourceIndex,
    setHistory,
    
    // Workspace/View
    workspaceRef, imgRef, workspaceZoom, setZoom,
    marqueeStart, setMarqueeStart, marqueeCurrent, setMarqueeCurrent,
    gradientStart, setGradientStart, gradientCurrent, setGradientCurrent,
    
    // Dialogs/UI
    isGenerateOpen, setIsGenerateOpen, isGenerativeFillOpen, setIsGenerativeFillOpen,
    isPreviewingOriginal, setIsPreviewingOriginal, isSettingsOpen, setIsSettingsOpen,
    isFullscreen, setIsFullscreen,
    activeRightTab, setActiveRightTab, activeBottomTab, setActiveBottomTab,
    
    // External/Constants
    systemFonts, customFonts, addCustomFont, removeCustomFont, onOpenFontManager,
    geminiApiKey, stabilityApiKey, dismissToast,
    currentEditState, updateCurrentState, resetAllEdits,
    setImage, setDimensions, setFileInfo, setExifData, setLayers, 
    setSelectedLayerId: setSelectedLayerIdState,
    setCurrentEditState,
    
    // Panel Management
    panelLayout, setPanelLayout, reorderPanelTabs, togglePanelVisibility,
    isMobile,
    initialEditState, initialLayerState,
    clearSelectionState,
    setIsMouseOverImage,
  } = state;

  // --- Derived State ---
  const hasImage = useMemo(() => Boolean(image), [image]);
  const base64Image = image;
  
  const historySourceLayer = history[currentEditState.historyBrushSourceIndex]?.layers.find(l => l.id === 'background');
  const historyImageSrc = historySourceLayer && isImageOrDrawingLayer(historySourceLayer) ? historySourceLayer.dataUrl : null;

  // --- Utility Functions ---
  const getPointOnImage = useCallback((clientX: number, clientY: number): Point | null => {
    if (!imgRef.current || !dimensions) return null;
    const rect = imgRef.current.getBoundingClientRect();
    
    // Calculate coordinates relative to the image (in image pixels)
    const scaleX = dimensions.width / rect.width;
    const scaleY = dimensions.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, [imgRef, dimensions]);

  // --- Zoom Handlers ---
  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(5, prev + 0.1)), [setZoom]);
  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(0.1, prev - 0.1)), [setZoom]);
  const handleFitScreen = useCallback(() => setZoom(1), [setZoom]);

  // --- Sub-Hooks (Destructuring all required properties) ---
  const { transforms, onTransformChange, rotation, onRotationChange, onRotationCommit, applyPreset: applyTransformPreset } = useTransform(currentEditState, updateCurrentState, recordHistory, layers);
  const { crop, onCropChange, onCropComplete, onAspectChange, aspect, applyPreset: applyCropPreset } = useCrop(currentEditState, updateCurrentState, recordHistory, layers);
  const { frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, applyPreset: applyFramePreset } = useFrame({ currentEditState, updateCurrentState, recordHistory, layers });
  const { adjustments, onAdjustmentChange, onAdjustmentCommit, selectedFilter, onFilterChange, applyPreset: applyAdjustmentsPreset } = useAdjustments(currentEditState, updateCurrentState, recordHistory, layers);
  const { effects, onEffectChange, onEffectCommit, applyPreset: applyEffectsPreset } = useEffects(currentEditState, updateCurrentState, recordHistory, layers);
  const { grading, onGradingChange, onGradingCommit, applyPreset: applyGradingPreset } = useColorGrading(currentEditState, updateCurrentState, recordHistory, layers);
  const { hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, applyPreset: applyHslPreset } = useHslAdjustments(currentEditState, updateCurrentState, recordHistory, layers);
  const { curves, onCurvesChange, onCurvesCommit, applyPreset: applyCurvesPreset } = useCurves({ currentEditState, updateCurrentState, recordHistory, layers });
  const { channels, onChannelChange: onChannelChangeHook, applyPreset: applyChannelsPreset } = useChannels({ currentEditState, updateCurrentState, recordHistory, layers });
  
  // Renamed to avoid redeclaration conflict with useLayers destructuring (Fixes Error 1, 2, 3)
  const { selectiveBlurMask, selectiveSharpenMask, handleSelectiveRetouchStrokeEnd, applyPreset: applySelectiveRetouchPreset } = useSelectiveRetouch(currentEditState, updateCurrentState, recordHistory, layers, dimensions);
  
  const { presets: globalPresets, savePreset: saveGlobalPreset, deletePreset: deleteGlobalPreset } = usePresets();
  const { gradientPresets, saveGradientPreset, deleteGradientPreset } = useGradientPresets();
  const { handleProjectSettingsUpdate } = useProjectSettings(currentEditState, updateCurrentState, recordHistory, layers, dimensions, setDimensions);
  const { handleBrushToolChange } = useBrush(setActiveTool, setBrushState, brushState, foregroundColor);
  const { handleTextToolChange } = useTextTool(setActiveTool);
  const { handleShapeToolChange } = useShapeTool(activeTool, setActiveTool, setSelectedShapeType, selectedShapeType);
  const { handleGradientToolChange } = useGradientTool(setActiveTool, setGradientToolState, gradientToolState);
  const { handleMoveToolChange } = useMoveTool(setActiveTool);
  const { handleLassoToolChange } = useLassoTool(setActiveTool);
  const { handleEyedropperToolChange } = useEyedropper(setActiveTool, setForegroundColor);
  const { handleDrawingToolChange } = useDrawingTool(setActiveTool);

  const { handleExportClick } = useExport({ layers, dimensions, currentEditState, imgRef, base64Image, stabilityApiKey });
  
  const { handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate, handleNewFromClipboard } = useImageLoader(
    setImage, setDimensions, setFileInfo, setExifData, setLayers, resetAllEdits, recordHistory, 
    setCurrentEditState, 
    currentEditState, initialEditState, initialLayerState, setSelectedLayerIdState, clearSelectionState,
    setHistory,
    setCurrentHistoryIndex
  );

  const {
    toggleLayerVisibility, renameLayer, deleteLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents,
    updateLayer, commitLayerChange, onLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit,
    addTextLayer, addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection,
    addShapeLayer, addGradientLayer: addGradientLayerHook, onAddAdjustmentLayer, groupLayers, toggleGroupExpanded,
    onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onDeleteHiddenLayers, onArrangeLayer,
    hasActiveSelection, onApplySelectionAsMask, handleDestructiveOperation,
    handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd,
    handleReorder, findLayer,
  } = useLayers({
    layers, setLayers, recordHistory, currentEditState, dimensions, 
    foregroundColor, backgroundColor, gradientToolState, selectedShapeType,
    selectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl,
    clearSelectionState, setImage, setFileInfo, setSelectedLayerId: setSelectedLayerIdState, selectedLayerId,
  });
  
  // Wrapper for addGradientLayer to handle tool interaction
  const addGradientLayerWithCoords = useCallback((startPoint: Point, endPoint: Point) => {
    addGradientLayerHook(startPoint, endPoint);
  }, [addGradientLayerHook]);
  
  const addGradientLayerNoArgs = useCallback(() => {
    if (!dimensions) {
      showError("Cannot add gradient layer without dimensions.");
      return;
    }
    // Default gradient from center to right edge (0-100% in image pixels)
    const start: Point = { x: dimensions.width / 2, y: dimensions.height / 2 };
    const end: Point = { x: dimensions.width, y: dimensions.height / 2 };
    addGradientLayerWithCoords(start, end);
  }, [dimensions, addGradientLayerWithCoords]);

  const { handleGenerateImage, handleGenerativeFill } = useGenerativeAi(
    geminiApiKey,
    image,
    dimensions,
    setImage,
    setDimensions,
    setFileInfo,
    layers,
    addDrawingLayer,
    updateLayer,
    commitLayerChange,
    clearSelectionState,
    setIsGenerateOpen,
    setIsGenerativeFillOpen,
  );

  // --- Xtra AI Result Handlers ---
  
  const handleXtraImageResult = useCallback((resultUrl: string, historyName: string) => {
    if (!dimensions) return;
    
    // Create a new image layer from the result URL
    const newLayer: Layer = {
      id: uuidv4(),
      name: historyName,
      type: 'image',
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      isLocked: false,
      maskDataUrl: null,
      dataUrl: resultUrl,
      exifData: null,
      x: 50, y: 50, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1,
    } as ImageLayerData;

    setLayers(prev => [newLayer, ...prev]);
    setSelectedLayerIdState(newLayer.id);
    recordHistory(historyName, currentEditState, [newLayer, ...layers]);
    showSuccess(`${historyName} applied as new layer.`);
  }, [dimensions, recordHistory, currentEditState, layers, setLayers, setSelectedLayerIdState]);

  const handleXtraMaskResult = useCallback((maskDataUrl: string, historyName: string) => {
    setSelectionMaskDataUrl(maskDataUrl);
    recordHistory(historyName, currentEditState, layers);
    clearSelectionState();
    showSuccess(`${historyName} selection created.`);
  }, [setSelectionMaskDataUrl, recordHistory, currentEditState, layers, clearSelectionState]);

  // --- Utility Action Handlers ---
  
  const handleCopy = useCallback(async () => {
    if (!base64Image) {
      showError("No image loaded to copy.");
      return;
    }
    try {
      // In a real app, this would render the full canvas with all layers/effects first
      await copyImageToClipboard(base64Image);
      showSuccess("Image copied to clipboard.");
    } catch (error) {
      showError("Failed to copy image to clipboard.");
    }
  }, [base64Image]);

  const handleSwapColors = useCallback(() => {
    setForegroundColor(backgroundColor);
    setBackgroundColor(foregroundColor);
    showSuccess("Foreground and background colors swapped.");
  }, [foregroundColor, backgroundColor, setForegroundColor, setBackgroundColor]);

  const handleLayerDelete = useCallback(() => {
    if (selectedLayerId) {
      deleteLayer(selectedLayerId);
    } else if (selectionMaskDataUrl) {
      // If no layer is selected but there is an active selection, delete the selected area on the active layer (if not background)
      handleDestructiveOperation('delete');
    } else {
      showError("Nothing selected to delete.");
    }
  }, [selectedLayerId, deleteLayer, selectionMaskDataUrl, handleDestructiveOperation]);

  // Wrapper for setBrushState to handle partial updates (Fixes Error 19, 30)
  const setBrushStateWrapper = useCallback((updates: Partial<Omit<BrushState, 'color'>>) => {
    setBrushState(prev => ({ ...prev, ...updates }));
  }, [setBrushState]);

  const onBrushCommit = useCallback(() => {
    // This function is called when brush settings change permanently (e.g., slider release)
    // We record the current brushState into history.
    recordHistory(`Update Brush Settings`, { ...currentEditState, brushState }, layers);
  }, [currentEditState, brushState, layers, recordHistory]);
  
  // --- Workspace Interaction Handlers ---
  
  const handleWorkspaceMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dimensions) return;
    const point = getPointOnImage(e.clientX, e.clientY);
    if (!point) return;

    // Example: Start Gradient drawing
    if (activeTool === 'gradient') {
      setGradientStart({ x: e.clientX, y: e.clientY });
      setGradientCurrent({ x: e.clientX, y: e.clientY });
    }
    
    // Example: Eyedropper tool
    if (activeTool === 'eyedropper') {
        // Logic to sample color (stub)
        setForegroundColor('#FF00FF'); // Sampled color stub
        setActiveTool(null);
    }
    
    // Example: Polygonal Lasso (start new path)
    if (activeTool === 'lassoPoly') {
        if (selectionPath && selectionPath.length > 0) {
            // Continue path
            setSelectionPath(prev => [...(prev || []), point]);
        } else {
            // Start new path
            setSelectionPath([point]);
        }
    }
    
    // Prevent default behavior for drag/selection
    // NOTE: Marquee tool interaction is now handled entirely within useMarqueeToolInteraction.ts
    if (activeTool === 'gradient' || activeTool === 'eyedropper' || activeTool === 'lassoPoly') {
        e.preventDefault();
    }
  }, [dimensions, getPointOnImage, activeTool, setGradientStart, setGradientCurrent, setForegroundColor, setActiveTool, selectionPath, setSelectionPath]);

  const handleWorkspaceMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dimensions) return;
    
    // Live Gradient update
    if (gradientStart && activeTool === 'gradient') {
      setGradientCurrent({ x: e.clientX, y: e.clientY });
    }
    
    // NOTE: Marquee tool interaction is now handled entirely within useMarqueeToolInteraction.ts
  }, [dimensions, activeTool, gradientStart, setGradientCurrent]);

  const handleWorkspaceMouseUp = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dimensions) return;
    
    // End Gradient drawing
    if (gradientStart && gradientCurrent && activeTool === 'gradient') {
      const startPoint = getPointOnImage(gradientStart.x, gradientStart.y);
      const endPoint = getPointOnImage(gradientCurrent.x, gradientCurrent.y);
      
      if (startPoint && endPoint) {
        addGradientLayerWithCoords(startPoint, endPoint);
      }
      setGradientStart(null);
      setGradientCurrent(null);
      setActiveTool(null);
    }
    
    // NOTE: Marquee tool interaction is now handled entirely within useMarqueeToolInteraction.ts
  }, [dimensions, gradientStart, gradientCurrent, activeTool, getPointOnImage, addGradientLayerWithCoords, setGradientStart, setGradientCurrent, setActiveTool]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom control
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    } else if (e.shiftKey) {
      // Horizontal scroll (stub)
      e.preventDefault();
      console.log("Horizontal scroll stub");
    }
  }, [handleZoomIn, handleZoomOut]);
  
  // Wrapper for layer selection to match LayersPanel signature
  const handleSelectLayer = useCallback((id: string, ctrlKey: boolean, shiftKey: boolean) => {
    // Simplified selection logic: just set the ID
    setSelectedLayerIdState(id);
  }, [setSelectedLayerIdState]);
  
  const handleMaskResult = useCallback((maskDataUrl: string, historyName: string) => {
    setSelectionMaskDataUrl(maskDataUrl);
    recordHistory(historyName, currentEditState, layers);
    clearSelectionState();
  }, [setSelectionMaskDataUrl, recordHistory, currentEditState, layers, clearSelectionState]);

  // --- Selective Retouch Commit Wrappers (Needed by Sidebar) ---
  const onSelectiveBlurAmountCommit = useCallback((value: number) => {
    updateCurrentState({ selectiveBlurAmount: value });
    recordHistory(`Set Selective Blur Amount to ${value}`, { ...currentEditState, selectiveBlurAmount: value }, layers);
  }, [updateCurrentState, recordHistory, currentEditState, layers]);

  const onSelectiveSharpenAmountCommit = useCallback((value: number) => {
    updateCurrentState({ selectiveSharpenAmount: value });
    recordHistory(`Set Selective Sharpen Amount to ${value}`, { ...currentEditState, selectiveSharpenAmount: value }, layers);
  }, [updateCurrentState, recordHistory, currentEditState, layers]);

  // --- Return all necessary state and handlers ---
  return {
    // Core State
    image, dimensions, fileInfo, exifData, layers, selectedLayerId, selectedLayer,
    activeTool, setActiveTool, brushState, setBrushState: setBrushStateWrapper, gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType, selectionPath, setSelectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl,
    selectiveBlurAmount, setSelectiveBlurAmount, selectiveSharpenAmount, setSelectiveSharpenAmount,
    customHslColor, setCustomHslColor, selectionSettings, setSelectionSettings, 
    onSelectionSettingChange: (key: keyof typeof selectionSettings, value: any) => setSelectionSettings(prev => ({ ...prev, [key]: value })),
    onSelectionSettingCommit: (key: keyof typeof selectionSettings, value: any) => recordHistory(`Set Selection Setting ${String(key)}`, { ...currentEditState, selectionSettings: { ...currentEditState.selectionSettings, [key]: value } }, layers),
    channels, onChannelChange: onChannelChangeHook,
    
    // History
    history, currentHistoryIndex, recordHistory, undo, redo, canUndo, canRedo,
    setCurrentHistoryIndex, historyBrushSourceIndex, setHistoryBrushSourceIndex,
    
    // Layer Management (Mapped to RightSidebarTabsProps names)
    onSelectLayer: handleSelectLayer, // Mapped
    toggleLayerVisibility, renameLayer, deleteLayer, 
    onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents,
    updateLayer, commitLayerChange, onLayerPropertyCommit, handleLayerOpacityChange, onLayerOpacityCommit: handleLayerOpacityCommit,
    addTextLayer: (coords: Point, color: string) => addTextLayer(coords, color),
    addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection,
    addShapeLayer: (coords: Point, shapeType?: ShapeType, initialWidth?: number, initialHeight?: number, fillColor?: string, strokeColor?: string) => addShapeLayer(coords, shapeType, initialWidth, initialHeight, fillColor, strokeColor),
    addGradientLayer: addGradientLayerWithCoords,
    addGradientLayerNoArgs,
    onAddAdjustmentLayer, groupLayers, toggleGroupExpanded,
    onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onDeleteHiddenLayers, onArrangeLayer,
    hasActiveSelection: !!selectionMaskDataUrl, onApplySelectionAsMask, handleDestructiveOperation,
    handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleSelectiveRetouchStrokeEnd, handleHistoryBrushStrokeEnd,
    onLayerReorder: handleReorder,
    
    // Effects/Transform
    effects, onEffectChange, onEffectCommit, onFilterChange, selectedFilter,
    onTransformChange, rotation, onRotationChange, onRotationCommit, onAspectChange, aspect,
    frame, onFramePresetChange: (type, name, options) => onFramePresetChange(type, name, options), onFramePropertyChange, onFramePropertyCommit,
    
    // Color Correction
    adjustments, onAdjustmentChange, onAdjustmentCommit, grading, onGradingChange, onGradingCommit,
    hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, curves, onCurvesChange, onCurvesCommit,
    
    // Presets (Mapped to RightSidebarTabsProps names)
    presets: globalPresets, 
    onApplyPreset: (preset: any) => {
        applyTransformPreset(preset.state);
        applyCropPreset(preset.state);
        applyAdjustmentsPreset(preset.state);
        applyGradingPreset(preset.state);
        applyHslPreset(preset.state);
        applyCurvesPreset(preset.state);
        applyChannelsPreset(preset.state);
        applyFramePreset(preset.state);
        applySelectiveRetouchPreset(preset.state);
        applyEffectsPreset(preset.state);
        if (preset.layers) setLayers(preset.layers);
        recordHistory(`Applied Preset: ${preset.name}`, currentEditState, layers);
    }, 
    handleSavePresetCommit: (name: string) => saveGlobalPreset(name, currentEditState, layers), 
    onDeletePreset: deleteGlobalPreset,
    gradientPresets, onSaveGradientPreset: saveGradientPreset, onDeleteGradientPreset: deleteGradientPreset,
    
    // Workspace Interaction
    zoom: workspaceZoom, handleZoomIn, handleZoomOut, handleFitScreen,
    handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp, handleWheel,
    
    // AI/Export/Project Management
    geminiApiKey, handleExportClick, handleNewProject, handleLoadProject, handleImageLoad,
    handleGenerativeFill, handleGenerateImage, handleSwapColors, handleLayerDelete,
    handleNewFromClipboard,
    handleMaskResult,
    
    // AI Results (NEW)
    onImageResult: handleXtraImageResult,
    onMaskResult: handleXtraMaskResult,
    
    // UI/Layout
    isFullscreen, setIsFullscreen,
    isSettingsOpen, setIsSettingsOpen,
    isGenerateOpen, setIsGenerateOpen,
    isGenerativeFillOpen, setIsGenerativeFillOpen,
    activeRightTab, setActiveRightTab,
    activeBottomTab, setActiveBottomTab,
    
    // Internal State
    marqueeStart, marqueeCurrent, gradientStart, gradientCurrent, cloneSourcePoint, setCloneSourcePoint,
    selectiveBlurMask, selectiveSharpenMask,
    workspaceRef, imgRef,
    currentEditState, updateCurrentState, resetAllEdits,
    base64Image, historyImageSrc,
    isPreviewingOriginal, setIsPreviewingOriginal,
    clearSelectionState,
    setSelectedLayerId: setSelectedLayerIdState,
    
    // External Hooks/Functions
    systemFonts, customFonts, addCustomFont, removeCustomFont, onOpenFontManager,
    handleProjectSettingsUpdate,
    onBrushCommit,
    stabilityApiKey, dismissToast,
    setImage, setDimensions, setFileInfo, setExifData, setLayers,
    initialEditState, initialLayerState,
    handleCopy,
    setZoom,
    reorderPanelTabs,
    togglePanelVisibility,
    onCropChange, onCropComplete,
    isMobile,
    setIsMouseOverImage,
    hasImage,
    
    // History Panel Mappings
    onHistoryJump: setCurrentHistoryIndex,
    
    // Mapped properties for consuming components (Fixes Errors 4, 6, 7, 8, 9, 10, 11)
    handleApplyPreset: (preset: any) => {
        applyTransformPreset(preset.state);
        applyCropPreset(preset.state);
        applyAdjustmentsPreset(preset.state);
        applyGradingPreset(preset.state);
        applyHslPreset(preset.state);
        applyCurvesPreset(preset.state);
        applyChannelsPreset(preset.state);
        applyFramePreset(preset.state);
        applySelectiveRetouchPreset(preset.state);
        applyEffectsPreset(preset.state);
        if (preset.layers) setLayers(preset.layers);
        recordHistory(`Applied Preset: ${preset.name}`, currentEditState, layers);
    },
    handleSavePreset: (name: string) => saveGlobalPreset(name, currentEditState, layers),
    panelLayout,
    setMarqueeStart,
    setMarqueeCurrent,
    setGradientStart,
    setGradientCurrent,
    colorMode: currentEditState.colorMode,
    
    // Added missing commit/history functions
    onSelectiveBlurAmountCommit,
    onSelectiveSharpenAmountCommit,
    onUndo: undo,
    onRedo: redo,
  };
};