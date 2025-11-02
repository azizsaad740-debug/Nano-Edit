import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useHistory } from './useHistory';
import { useLayers } from './useLayers';
import { useCrop } from './useCrop';
import { useFrame } from './useFrame';
import { useExport } from './useExport';
import { useEditorState } from './useEditorState';
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
import { showSuccess, showError } from '@/utils/toast';
import type { Point, EditState, Layer, Dimensions, ActiveTool, ShapeType, GradientLayerData } from '@/types/editor';
import { initialEditState, initialLayerState, isImageOrDrawingLayer } from '@/types/editor';


export const useEditorLogic = (props: any) => {
  const state = useEditorState(); // Fix 64
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
    panelLayout, setPanelLayout, reorderPanelTabs,
    isMobile,
    initialEditState, initialLayerState,
    clearSelectionState,
  } = state;

  // --- Derived State ---
  const hasImage = useMemo(() => Boolean(image), [image]);
  const base64Image = image;
  
  const historySourceLayer = history[currentEditState.historyBrushSourceIndex]?.layers.find(l => l.id === 'background');
  const historyImageSrc = historySourceLayer && isImageOrDrawingLayer(historySourceLayer) ? historySourceLayer.dataUrl : null;

  // --- Utility Functions ---
  // ... (getPointOnImage)

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
  
  const { handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate } = useImageLoader( // Fix 65
    setImage, setDimensions, setFileInfo, setExifData, setLayers, resetAllEdits, recordHistory, 
    setCurrentEditState, 
    currentEditState, initialEditState, initialLayerState, setSelectedLayerIdState, clearSelectionState
  );

  const {
    toggleLayerVisibility, renameLayer, deleteLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents,
    updateLayer, commitLayerChange, onLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit,
    addTextLayer, addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection,
    addShapeLayer, addGradientLayer, onAddAdjustmentLayer, groupLayers, toggleGroupExpanded,
    onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onDeleteHiddenLayers, onArrangeLayer,
    hasActiveSelection, onApplySelectionAsMask, handleDestructiveOperation,
    handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd,
    handleReorder,
  } = useLayers({
    layers, setLayers, recordHistory, currentEditState, dimensions, 
    foregroundColor, backgroundColor, gradientToolState, selectedShapeType,
    selectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl,
    clearSelectionState, setImage, setFileInfo, setSelectedLayerId: setSelectedLayerIdState, selectedLayerId,
  });

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

  // ... (handleCopy, handleSwapColors, handleLayerDelete, onBrushCommit, handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp, handleWheel)

  // --- Return all necessary state and handlers ---
  return {
    // Core State (Fixes 188-222)
    image, dimensions, fileInfo, exifData, layers, selectedLayerId, selectedLayer,
    activeTool, setActiveTool, brushState, setBrushState, gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType, selectionPath, setSelectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl,
    selectiveBlurAmount, setSelectiveBlurAmount, selectiveSharpenAmount, setSelectiveSharpenAmount,
    customHslColor, setCustomHslColor, selectionSettings, 
    onSelectionSettingChange: (key: keyof typeof selectionSettings, value: any) => setSelectionSettings(prev => ({ ...prev, [key]: value })),
    onSelectionSettingCommit: (key: keyof typeof selectionSettings, value: any) => recordHistory(`Set Selection Setting ${key}`, { ...currentEditState, selectionSettings: { ...currentEditState.selectionSettings, [key]: value } }, layers),
    channels, onChannelChange: onChannelChangeHook,
    
    // History (Fixes 223-232)
    history, currentHistoryIndex, recordHistory, undo, redo, canUndo, canRedo,
    setCurrentHistoryIndex, historyBrushSourceIndex, setHistoryBrushSourceIndex,
    
    // Layer Management (Fixes 233-271)
    toggleLayerVisibility, renameLayer, deleteLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents,
    updateLayer, commitLayerChange, onLayerPropertyCommit,
    handleLayerOpacityChange, handleLayerOpacityCommit,
    addTextLayer: (coords: Point, color: string) => addTextLayer(coords, color),
    addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection,
    addShapeLayer: (coords: Point, shapeType?: ShapeType, initialWidth?: number, initialHeight?: number, fillColor?: string, strokeColor?: string) => addShapeLayer(coords, shapeType, initialWidth, initialHeight, fillColor, strokeColor),
    addGradientLayer, onAddAdjustmentLayer, groupLayers, toggleGroupExpanded,
    onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onDeleteHiddenLayers, onArrangeLayer,
    hasActiveSelection: !!selectionMaskDataUrl, onApplySelectionAsMask, handleDestructiveOperation,
    handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleSelectiveRetouchStrokeEnd, handleHistoryBrushStrokeEnd,
    handleReorder,
    
    // Effects/Transform (Fixes 66-80, 272-290)
    effects, onEffectChange, onEffectCommit, onFilterChange, selectedFilter,
    onTransformChange, rotation, onRotationChange, onRotationCommit, onAspectChange, aspect,
    frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit,
    
    // Color Correction
    adjustments, onAdjustmentChange, onAdjustmentCommit, grading, onGradingChange, onGradingCommit,
    hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, curves, onCurvesChange, onCurvesCommit,
    
    // Presets
    presets: globalPresets, handleApplyPreset: (preset: any) => {
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
    }, handleSavePreset: (name: string) => saveGlobalPreset(name, currentEditState, layers), onDeletePreset: deleteGlobalPreset,
    gradientPresets, onSaveGradientPreset: saveGradientPreset, onDeleteGradientPreset: deleteGlobalPreset,
    
    // Workspace Interaction (Fixes 291-298)
    workspaceZoom, handleZoomIn, handleZoomOut, handleFitScreen,
    handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp, handleWheel,
    
    // AI/Export/Project Management (Fixes 299-307)
    geminiApiKey, handleExportClick, handleNewProject, handleLoadProject, handleImageLoad,
    handleGenerativeFill, handleGenerateImage, handleSwapColors, handleLayerDelete,
    
    // UI/Layout
    isFullscreen, setIsFullscreen,
    isSettingsOpen, setIsSettingsOpen,
    isGenerateOpen, setIsGenerateOpen,
    isGenerativeFillOpen, setIsGenerativeFillOpen,
    activeRightTab, setActiveRightTab,
    activeBottomTab, setActiveBottomTab,
    
    // Internal State (Fixes 308-317, 333-337)
    marqueeStart, marqueeCurrent, gradientStart, setGradientStart, gradientCurrent, setGradientCurrent, cloneSourcePoint, setCloneSourcePoint,
    setSelectionSettings,
    selectiveBlurMask, selectiveSharpenMask,
    workspaceRef, imgRef,
    currentEditState, updateCurrentState, resetAllEdits,
    base64Image, historyImageSrc,
    isPreviewingOriginal, setIsPreviewingOriginal,
    clearSelectionState,
    setSelectedLayerId: setSelectedLayerIdState,
    
    // External Hooks/Functions (Fixes 318-325, 340-345)
    systemFonts, customFonts, addCustomFont, removeCustomFont, onOpenFontManager,
    handleProjectSettingsUpdate,
    onBrushCommit,
    stabilityApiKey, dismissToast,
    setImage, setDimensions, setFileInfo, setExifData, setLayers,
    initialEditState, initialLayerState,
    handleCopy,
    setZoom,
    reorderPanelTabs,
    onCropChange, onCropComplete,
    isMobile,
  };
};