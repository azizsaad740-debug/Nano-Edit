import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useHistory } from './useHistory';
import { useLayers } from './useLayers';
import { useCrop } from './useCrop';
import { useFrame } from './useFrame';
import { useTransform } from './useTransform';
import { useAdjustments } from './useAdjustments';
import { useColorGrading } from './useColorGrading';
import { useHslAdjustments } from './useHslAdjustments';
import { useCurves } from './useCurves';
import { useChannels } from './useChannels';
import { useEffects } from './useEffects';
import { useSelectiveRetouch } from './useSelectiveRetouch';
import { usePresets } from './usePresets';
import { useGradientPresets } from './useGradientPresets';
import { useProjectSettings } from './useProjectSettings';
import { useGenerativeAi } from './useGenerativeAi';
import { useWorkspaceInteraction } from './useWorkspaceInteraction';
import { useImageLoader } from './useImageLoader';
import { useBrush } from './useBrush';
import { useEyedropper } from './useEyedropper';
import { useTextTool } from './useTextTool';
import { useMoveTool } from './useMoveTool';
import { useLassoTool } from './useLassoTool';
import { useDrawingTool } from './useDrawingTool';
import { useShapeTool } from './useShapeTool';
import { useGradientTool } from './useGradientTool';
import { useExport } from './useExport';
import { useEditorState } from './useEditorState';
import { showSuccess, showError } from '@/utils/toast';
import { rasterizeEditedImageWithMask, downloadImage, copyImageToClipboard, applyMaskDestructively } from '@/utils/imageUtils';
import { polygonToMaskDataUrl, ellipseToMaskDataUrl, floodFillToMaskDataUrl, objectSelectToMaskDataUrl } from '@/utils/maskUtils';
import type { Point, ActiveTool, Layer, Dimensions, EditState, GradientToolState, SelectionSettings } from '@/types/editor';
import { isImageOrDrawingLayer } from '@/types/editor';

export const useEditorLogic = () => {
  const state = useEditorState();
  
  const {
    workspaceRef, imgRef, isPreviewingOriginal, setIsPreviewingOriginal,
    image, setImage, dimensions, setDimensions, fileInfo, setFileInfo, exifData, setExifData,
    currentEditState, setCurrentEditState, updateCurrentState, resetAllEdits,
    layers, setLayers, selectedLayerId, setSelectedLayerId,
    activeTool, setActiveTool, brushState, setBrushState, gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType, selectionPath, setSelectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl,
    selectiveBlurAmount, setSelectiveBlurAmount, selectiveSharpenAmount, setSelectiveSharpenAmount,
    customHslColor, setCustomHslColor, selectionSettings, setSelectionSettings,
    marqueeStart, setMarqueeStart, marqueeCurrent, setMarqueeCurrent,
    gradientStart, setGradientStart, gradientCurrent, setGradientCurrent,
    cloneSourcePoint, setCloneSourcePoint,
    history, currentHistoryIndex, recordHistory, undo, redo, canUndo, canRedo,
    historyBrushSourceIndex, setHistoryBrushSourceIndex,
    systemFonts, customFonts, addCustomFont, removeCustomFont,
    geminiApiKey, stabilityApiKey,
    zoom, setZoom,
    initialLayerState, initialEditState,
    dismissToast,
  } = state;

  // --- Layer Management Hooks ---
  const {
    updateLayer,
    commitLayerChange,
    handleLayerPropertyCommit,
    handleLayerOpacityChange,
    handleLayerOpacityCommit,
    toggleLayerVisibility,
    renameLayer,
    deleteLayer,
    onDuplicateLayer,
    onMergeLayerDown,
    onRasterizeLayer,
    onCreateSmartObject,
    onOpenSmartObject,
    onRasterizeSmartObject,
    onConvertSmartObjectToLayers,
    onExportSmartObjectContents,
    onArrangeLayer,
    onToggleLayerLock,
    onDeleteHiddenLayers,
    addTextLayer,
    addDrawingLayer,
    onAddLayerFromBackground,
    onLayerFromSelection,
    addShapeLayer,
    addGradientLayer,
    onAddAdjustmentLayer,
    onApplySelectionAsMask,
    onRemoveLayerMask,
    onInvertLayerMask,
    onToggleClippingMask,
    groupLayers,
    toggleGroupExpanded,
    handleReorder,
    handleDrawingStrokeEnd,
    handleHistoryBrushStrokeEnd,
  } = useLayers({
    layers, setLayers, recordHistory, currentEditState, dimensions, foregroundColor, backgroundColor,
    gradientToolState, selectedShapeType, selectionPath, selectionMaskDataUrl, clearSelectionState,
    setImage, setFileInfo, setSelectedLayerId,
  });

  // --- Global Adjustment Hooks ---
  const { crop, onCropChange, onCropComplete, onAspectChange, aspect, applyPreset: applyCropPreset } = useCrop(currentEditState, updateCurrentState, recordHistory, layers);
  const { transforms, onTransformChange, rotation, onRotationChange, onRotationCommit, applyPreset: applyTransformPreset } = useTransform(currentEditState, updateCurrentState, recordHistory, layers);
  const { adjustments, onAdjustmentChange, onAdjustmentCommit, selectedFilter, onFilterChange, applyPreset: applyAdjustmentsPreset } = useAdjustments(currentEditState, updateCurrentState, recordHistory, layers);
  const { grading, onGradingChange, onGradingCommit, applyPreset: applyGradingPreset } = useColorGrading(currentEditState, updateCurrentState, recordHistory, layers);
  const { hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, applyPreset: applyHslPreset } = useHslAdjustments(currentEditState, updateCurrentState, recordHistory, layers);
  const { curves, onCurvesChange, onCurvesCommit, applyPreset: applyCurvesPreset } = useCurves({ currentEditState, updateCurrentState, recordHistory, layers });
  const { channels, onChannelChange, applyPreset: applyChannelsPreset } = useChannels({ currentEditState, updateCurrentState, recordHistory, layers });
  const { effects, onEffectChange, onEffectCommit, applyPreset: applyEffectsPreset } = useEffects(currentEditState, updateCurrentState, recordHistory, layers);
  const { frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, applyPreset: applyFramePreset } = useFrame({ currentEditState, updateCurrentState, recordHistory, layers });
  const { selectiveBlurMask, selectiveSharpenMask, handleSelectiveRetouchStrokeEnd, applyPreset: applySelectiveRetouchPreset } = useSelectiveRetouch(currentEditState, updateCurrentState, recordHistory, layers, dimensions);

  // --- Presets ---
  const { presets, savePreset, deletePreset } = usePresets();
  const { gradientPresets, saveGradientPreset, deleteGradientPreset } = useGradientPresets();

  const handleSavePreset = useCallback((name: string) => {
    savePreset(name, currentEditState, layers);
  }, [savePreset, currentEditState, layers]);

  const handleApplyPreset = useCallback((preset: { name: string; state: Partial<EditState>; layers?: Layer[] }) => {
    if (preset.state) {
      applyCropPreset(preset.state);
      applyTransformPreset(preset.state);
      applyAdjustmentsPreset(preset.state);
      applyGradingPreset(preset.state);
      applyHslPreset(preset.state);
      applyCurvesPreset(preset.state);
      applyChannelsPreset(preset.state);
      applyEffectsPreset(preset.state);
      applyFramePreset(preset.state);
      applySelectiveRetouchPreset(preset.state);
      
      // Update selection settings if present
      if (preset.state.selectionSettings) {
        setSelectionSettings(preset.state.selectionSettings);
      }
      
      // Update color mode
      if (preset.state.colorMode) {
        updateCurrentState({ colorMode: preset.state.colorMode });
      }
    }
    if (preset.layers) {
      setLayers(preset.layers);
      recordHistory(`Apply Preset: ${preset.name}`, currentEditState, preset.layers);
    } else {
      recordHistory(`Apply Preset: ${preset.name}`, currentEditState, layers);
    }
    showSuccess(`Preset "${preset.name}" applied.`);
  }, [applyCropPreset, applyTransformPreset, applyAdjustmentsPreset, applyGradingPreset, applyHslPreset, applyCurvesPreset, applyChannelsPreset, applyEffectsPreset, applyFramePreset, applySelectiveRetouchPreset, setSelectionSettings, updateCurrentState, setLayers, recordHistory, currentEditState, layers]);

  // --- Image Loading & Project Management ---
  const { handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate } = useImageLoader(
    setImage, setDimensions, setFileInfo, setExifData, setLayers, resetAllEdits, recordHistory, setCurrentEditState, initialEditState, initialLayerState, setSelectedLayerId, clearSelectionState
  );

  // --- AI / Generative ---
  const { handleGenerateImage, handleGenerativeFill } = useGenerativeAi(
    geminiApiKey, image, dimensions, setImage, setDimensions, setFileInfo, layers, addDrawingLayer, updateLayer, commitLayerChange, clearSelectionState, state.setIsGenerateOpen, state.setIsGenerativeFillOpen
  );

  // --- Tool Handlers ---
  const { handleBrushToolChange } = useBrush(setActiveTool, setBrushState, brushState, foregroundColor);
  const { handleEyedropperToolChange } = useEyedropper(setActiveTool, setForegroundColor);
  const { handleTextToolChange } = useTextTool(setActiveTool);
  const { handleMoveToolChange } = useMoveTool(setActiveTool);
  const { handleLassoToolChange } = useLassoTool(setActiveTool);
  const { handleDrawingToolChange } = useDrawingTool(setActiveTool);
  const { handleShapeToolChange } = useShapeTool(activeTool, setActiveTool, setSelectedShapeType, selectedShapeType);
  const { handleGradientToolChange } = useGradientTool(setActiveTool, setGradientToolState, gradientToolState);
  const { handleExportClick, handleCopy } = useExport(fileInfo, dimensions, currentEditState, layers, imgRef, state.image, stabilityApiKey);

  // --- Selection Handlers ---
  const handleMarqueeSelectionComplete = useCallback(async (start: Point, end: Point) => {
    if (!dimensions || !activeTool) return;

    const { width, height } = dimensions;
    let maskDataUrl: string | null = null;

    try {
      if (activeTool === 'marqueeRect') {
        // Create a polygon path from the rectangle corners
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const w = Math.abs(start.x - end.x);
        const h = Math.abs(start.y - end.y);
        
        const path: Point[] = [
          { x, y },
          { x: x + w, y },
          { x: x + w, y: y + h },
          { x, y: y + h },
        ];
        maskDataUrl = await polygonToMaskDataUrl(path, width, height);
        
      } else if (activeTool === 'marqueeEllipse') {
        maskDataUrl = await ellipseToMaskDataUrl(start, end, width, height);
      }
      
      if (maskDataUrl) {
        setSelectionMaskDataUrl(maskDataUrl);
        setSelectionPath(null); // Clear path if mask is generated
        recordHistory("Marquee Selection", currentEditState, layers);
        showSuccess("Selection created.");
      }
    } catch (error) {
      showError("Failed to create selection mask.");
      console.error(error);
    }
  }, [dimensions, activeTool, setSelectionMaskDataUrl, setSelectionPath, recordHistory, currentEditState, layers]);

  // --- Workspace Interaction ---
  const {
    zoom: workspaceZoom,
    setZoom: setWorkspaceZoom,
    handleWheel,
    handleFitScreen,
    handleZoomIn,
    handleZoomOut,
    isMouseOverImage,
    setIsMouseOverImage,
    gradientStart: wsGradientStart,
    gradientCurrent: wsGradientCurrent,
    handleWorkspaceMouseDown,
    handleWorkspaceMouseMove,
    handleWorkspaceMouseUp,
  } = useWorkspaceInteraction({
    workspaceRef, 
    imgRef, 
    activeTool, 
    dimensions, 
    setSelectionPath, 
    setSelectionMaskDataUrl, 
    clearSelectionState,
    gradientToolState, 
    setSelectedLayerId, 
    layers, 
    zoom, 
    setZoom, 
    setMarqueeStart, 
    setMarqueeCurrent,
    handleMarqueeSelectionComplete,
    currentEditState, 
    setCloneSourcePoint,
    handleAddTextLayer: (coords) => addTextLayer(coords, foregroundColor),
    foregroundColor,
    setForegroundColor,
    setActiveTool,
    selectionSettings, // PASSED
    recordHistory, // PASSED
  });
  
  const hasActiveSelection = !!selectionMaskDataUrl || !!selectionPath;

  // --- Utility Handlers ---
  const handleSwapColors = useCallback(() => {
    const temp = foregroundColor;
    setForegroundColor(backgroundColor);
    setBackgroundColor(temp);
  }, [foregroundColor, backgroundColor, setForegroundColor, setBackgroundColor]);

  const handleLayerDelete = useCallback(() => {
    if (selectedLayerId) {
      deleteLayer(selectedLayerId);
    } else if (hasActiveSelection) {
      clearSelectionState();
      showSuccess("Selection deselected.");
    } else {
      showError("Nothing selected to delete.");
    }
  }, [selectedLayerId, deleteLayer, hasActiveSelection, clearSelectionState]);

  const handleDestructiveOperation = useCallback(async (operation: 'delete' | 'fill') => {
    const backgroundLayer = layers.find(l => l.id === 'background');
    if (!backgroundLayer || !isImageOrDrawingLayer(backgroundLayer) || !backgroundLayer.dataUrl || !selectionMaskDataUrl || !dimensions) {
      showError("Destructive operation requires an image, dimensions, and an active selection mask.");
      return;
    }

    const toastId = toast.loading(`Applying destructive ${operation}...`);
    try {
      const newBaseDataUrl = await applyMaskDestructively(
        backgroundLayer.dataUrl,
        selectionMaskDataUrl,
        dimensions,
        operation,
        foregroundColor
      );
      
      // Update the background layer data
      updateLayer('background', { dataUrl: newBaseDataUrl });
      commitLayerChange('background', `${operation === 'delete' ? 'Delete' : 'Fill'} Selection`);
      clearSelectionState();
      
      // Update the main image source for histogram/exif reading
      setImage(newBaseDataUrl);
      
      toast.dismiss(toastId);
      showSuccess(`Selection ${operation === 'delete' ? 'deleted' : 'filled'} successfully.`);
    } catch (error) {
      console.error("Destructive operation failed:", error);
      toast.dismiss(toastId);
      showError("Failed to apply destructive operation.");
    }
  }, [layers, selectionMaskDataUrl, dimensions, foregroundColor, updateLayer, commitLayerChange, clearSelectionState, setImage]);

  // --- Brush Commit (for ToolOptionsBar) ---
  const onBrushCommit = useCallback(() => {
    recordHistory(`Update Brush Settings`, currentEditState, layers);
  }, [recordHistory, currentEditState, layers]);

  // --- Selection Settings Handlers ---
  const onSelectionSettingChange = useCallback((key: keyof SelectionSettings, value: any) => {
    setSelectionSettings(prev => ({ ...prev, [key]: value }));
  }, [setSelectionSettings]);

  const onSelectionSettingCommit = useCallback((key: keyof SelectionSettings, value: any) => {
    recordHistory(`Set Selection Setting ${key}`, currentEditState, layers);
  }, [recordHistory, currentEditState, layers]);

  // --- Final Exported State ---
  const selectedLayer = useMemo(() => layers.find(l => l.id === selectedLayerId), [layers, selectedLayerId]);
  const hasImage = !!image && !!dimensions;

  return {
    // State
    ...state,
    // Derived State
    selectedLayer,
    hasImage,
    hasActiveSelection,
    // Zoom/Interaction
    workspaceZoom,
    setWorkspaceZoom,
    handleWheel,
    handleFitScreen,
    handleZoomIn,
    handleZoomOut,
    isMouseOverImage,
    setIsMouseOverImage,
    gradientStart: wsGradientStart,
    gradientCurrent: wsGradientCurrent,
    handleWorkspaceMouseDown,
    handleWorkspaceMouseMove,
    handleWorkspaceMouseUp,
    // Layer Management
    updateLayer,
    commitLayerChange,
    handleLayerPropertyCommit,
    handleLayerOpacityChange,
    handleLayerOpacityCommit,
    toggleLayerVisibility,
    renameLayer,
    deleteLayer,
    onDuplicateLayer,
    onMergeLayerDown,
    onRasterizeLayer,
    onCreateSmartObject,
    onOpenSmartObject,
    onRasterizeSmartObject,
    onConvertSmartObjectToLayers,
    onExportSmartObjectContents,
    onArrangeLayer,
    onToggleLayerLock,
    onDeleteHiddenLayers,
    groupLayers,
    toggleGroupExpanded,
    handleReorder,
    // Layer Creation
    addTextLayer,
    addDrawingLayer,
    onAddLayerFromBackground,
    onLayerFromSelection,
    addShapeLayer,
    addGradientLayer,
    onAddAdjustmentLayer,
    // Masking
    onApplySelectionAsMask,
    onRemoveLayerMask,
    onInvertLayerMask,
    onToggleClippingMask,
    // Global Adjustments
    crop, onCropChange, onCropComplete, onAspectChange, aspect,
    transforms, onTransformChange, rotation, onRotationChange, onRotationCommit,
    adjustments, onAdjustmentChange, onAdjustmentCommit, selectedFilter, onFilterChange,
    grading, onGradingChange, onGradingCommit,
    hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit,
    curves, onCurvesChange, onCurvesCommit,
    channels, onChannelChange,
    effects, onEffectChange, onEffectCommit,
    frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit,
    selectiveBlurMask, selectiveSharpenMask, handleSelectiveRetouchStrokeEnd,
    // Presets
    presets, handleSavePreset, deletePreset, handleApplyPreset,
    gradientPresets, saveGradientPreset, deleteGradientPreset,
    // Image/Project
    handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate,
    // AI
    handleGenerateImage, handleGenerativeFill,
    // Utility
    handleSwapColors,
    handleLayerDelete,
    handleDestructiveOperation,
    handleExportClick,
    handleCopy,
    onBrushCommit,
    onSelectionSettingChange,
    onSelectionSettingCommit,
  };
};