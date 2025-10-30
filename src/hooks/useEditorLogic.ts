import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useHistory } from './useHistory';
import { useLayers } from './useLayers';
import { useCrop } from './useCrop';
import { useFrame } from './useFrame';
import { useAdjustments } from './useAdjustments';
import { useEffects } from './useEffects';
import { useColorGrading } from './useColorGrading';
import { useHslAdjustments } from './useHslAdjustments';
import { useCurves } from './useCurves';
import { useTransform } from './useTransform';
import { useChannels } from './useChannels';
import { useSelection } from './useSelection';
import { useSelectiveBlur } from './useSelectiveBlur';
import { useWorkspaceInteraction } from './useWorkspaceInteraction';
import { useImageLoader } from './useImageLoader';
import { useProjectSettings } from './useProjectSettings';
import { usePresets } from './usePresets';
import { useBrush } from './useBrush';
import { useTextTool } from './useTextTool';
import { useShapeTool } from './useShapeTool';
import { useGradientTool } from './useGradientTool';
import { useEyedropper } from './useEyedropper';
import { useGenerativeAi } from './useGenerativeAi';
import { useMoveTool } from './useMoveTool';
import { useLassoTool } from './useLassoTool';
import { useEditorState } from './useEditorState';
import { downloadImage, rasterizeEditedImageWithMask } from '@/utils/imageUtils';
import { upscaleImageApi } from '@/utils/stabilityApi';
import { showError, showSuccess, showLoading } from '@/utils/toast';
import type { ExportOptionsType } from '@/components/editor/ExportOptions';
import { initialEditState, initialLayerState, initialHistoryItem, initialCurvesState, Point } from '@/types/editor';
import { useGradientPresets } from './useGradientPresets'; // ADDED IMPORT

export const useEditorLogic = () => {
  const state = useEditorState();
  const {
    image, dimensions, fileInfo, layers, currentEditState, recordHistory,
    undo, redo, canUndo, canRedo,
    activeTool, setActiveTool, brushState, setBrushState, gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType, selectionPath, setSelectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl,
    selectiveBlurAmount, setSelectiveBlurAmount, customHslColor, setCustomHslColor, selectionSettings, setSelectionSettings,
    workspaceRef, imgRef, zoom, setZoom, marqueeStart, setMarqueeStart, marqueeCurrent, setMarqueeCurrent,
    cloneSourcePoint, setCloneSourcePoint,
    setSelectedLayerId, clearSelectionState, updateCurrentState,
    ...rest
  } = state;

  const { handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate } = useImageLoader(
    state.setImage, state.setDimensions, state.setFileInfo, state.setExifData, state.setLayers, state.resetAllEdits,
    state.recordHistory, state.setCurrentEditState, initialEditState, // Pass initialEditState constant
    state.initialLayerState, 
    state.setSelectedLayerId, state.clearSelectionState,
  );

  const { handleProjectSettingsUpdate } = useProjectSettings(
    currentEditState, updateCurrentState, recordHistory, layers, dimensions, state.setDimensions
  );
  
  const {
    smartObjectEditingId, openSmartObjectEditor, closeSmartObjectEditor, saveSmartObjectChanges,
    updateLayer, commitLayerChange, handleLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit,
    handleToggleVisibility, renameLayer, deleteLayer, duplicateLayer, mergeLayerDown, rasterizeLayer, createSmartObject,
    handleAddTextLayer, handleAddDrawingLayer, handleAddLayerFromBackground, handleLayerFromSelection, handleAddShapeLayer, handleAddGradientLayer, addAdjustmentLayer,
    groupLayers, toggleGroupExpanded, handleDrawingStrokeEnd, handleLayerDelete, reorderLayers, onSelectLayer: onSelectLayerFromLayers,
    removeLayerMask, invertLayerMask, toggleClippingMask, toggleLayerLock, handleDeleteHiddenLayers,
    handleRasterizeSmartObject, handleConvertSmartObjectToLayers, handleExportSmartObjectContents, handleArrangeLayer,
    applySelectionAsMask, handleSelectionBrushStrokeEnd,
  } = useLayers({
    layers, setLayers: state.setLayers, selectedLayerId: state.selectedLayerId, setSelectedLayerId: state.setSelectedLayerId, dimensions,
    recordHistory, currentEditState, foregroundColor, backgroundColor,
    selectedShapeType, selectionMaskDataUrl, setSelectionMaskDataUrl: state.setSelectionMaskDataUrl, clearSelectionState: state.clearSelectionState,
    brushState, activeTool,
  });

  const { handleGenerateImage, handleGenerativeFill } = useGenerativeAi(
    state.geminiApiKey, image, dimensions, state.setImage, state.setDimensions, state.setFileInfo, layers,
    handleAddDrawingLayer, updateLayer, commitLayerChange, state.clearSelectionState, rest.setIsGenerateOpen, rest.setIsGenerativeFillOpen
  );

  const handleExport = async (options: ExportOptionsType) => {
    if (!dimensions || !image) {
      showError("No image loaded to export.");
      return;
    }

    const toastId = showLoading("Rasterizing image...");
    const filename = fileInfo?.name.split('.')[0] || 'nanoedit_export';

    try {
      const finalBase64 = await rasterizeEditedImageWithMask(layers, dimensions, currentEditState, imgRef.current);
      
      if (options.upscale > 1) {
        toast.dismiss(toastId);
        const upscaleToastId = showLoading(`Upscaling image to ${options.upscale}x... (Stability AI)`);
        try {
          // Cast options.upscale to 2 | 4 since we checked options.upscale > 1
          const upscaledImage = await upscaleImageApi(finalBase64, state.stabilityApiKey, options.upscale as 2 | 4);
          downloadImage(upscaledImage, filename, options.format, options.quality);
          showSuccess("Upscale and export complete.");
        } catch (error) {
          showError("Failed to upscale image.");
        } finally {
          toast.dismiss(upscaleToastId);
        }
      } else {
        downloadImage(finalBase64, filename, options.format, options.quality);
        showSuccess("Image exported successfully.");
      }
    } catch (error) {
      showError("Failed to rasterize image for export.");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const { crop: cropState, onCropChange, onCropComplete, onAspectChange, aspect, applyPreset: applyCropPreset } = useCrop(
    currentEditState, updateCurrentState, recordHistory, layers
  );
  
  const { transforms, onTransformChange, rotation, onRotationChange, onRotationCommit, applyPreset: applyTransformPreset } = useTransform(
    currentEditState, updateCurrentState, recordHistory, layers
  );

  const { adjustments, onAdjustmentChange, onAdjustmentCommit, selectedFilter, onFilterChange, applyPreset: applyAdjustmentsPreset } = useAdjustments(
    currentEditState, updateCurrentState, recordHistory, layers
  );

  const { effects, onEffectChange, onEffectCommit, applyPreset: applyEffectsPreset } = useEffects(
    currentEditState, updateCurrentState, recordHistory, layers
  );

  const { grading, onGradingChange, onGradingCommit, applyPreset: applyGradingPreset } = useColorGrading(
    currentEditState, updateCurrentState, recordHistory, layers
  );

  const { hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, applyPreset: applyHslPreset } = useHslAdjustments(
    currentEditState, updateCurrentState, recordHistory, layers
  );

  const useCurvesProps = { currentEditState, updateCurrentState, recordHistory, layers };
  const { curves, onCurvesChange, onCurvesCommit, applyPreset: applyCurvesPreset } = useCurves(useCurvesProps);

  const useChannelsProps = { currentEditState, updateCurrentState, recordHistory, layers };
  const { channels, onChannelChange, applyPreset: applyChannelsPreset } = useChannels(useChannelsProps);

  const useFrameProps = { currentEditState, updateCurrentState, recordHistory, layers };
  const { frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, applyPreset: applyFramePreset } = useFrame(useFrameProps);

  const { selectiveBlurMask, handleSelectiveBlurStrokeEnd, applyPreset: applySelectiveBlurPreset } = useSelectiveBlur(
    currentEditState, updateCurrentState, recordHistory, layers, dimensions
  );

  const { presets, savePreset, deletePreset } = usePresets();
  const { gradientPresets, saveGradientPreset, deleteGradientPreset } = useGradientPresets(); // ADDED HOOK CALL

  const handleApplyPreset = useCallback((preset: typeof presets[0]) => {
    applyAdjustmentsPreset(preset.state);
    applyEffectsPreset(preset.state);
    applyGradingPreset(preset.state);
    applyHslPreset(preset.state);
    applyCurvesPreset(preset.state.curves || initialCurvesState);
    applyTransformPreset(preset.state);
    applyCropPreset(preset.state);
    applyFramePreset(preset.state);
    applySelectiveBlurPreset(preset.state);
    applyChannelsPreset(preset.state);
    recordHistory(`Applied Preset: ${preset.name}`, currentEditState, layers);
    showSuccess(`Preset "${preset.name}" applied.`);
  }, [currentEditState, layers, recordHistory, applyAdjustmentsPreset, applyEffectsPreset, applyGradingPreset, applyHslPreset, applyCurvesPreset, applyTransformPreset, applyCropPreset, applyFramePreset, applySelectiveBlurPreset, applyChannelsPreset]);

  const handleSavePreset = useCallback((name: string) => {
    savePreset(name, currentEditState, layers);
  }, [savePreset, currentEditState, layers]);

  const { handleBrushToolChange } = useBrush(setActiveTool, setBrushState, brushState, foregroundColor);
  const { handleTextToolChange } = useTextTool(setActiveTool);
  const { handleShapeToolChange } = useShapeTool(activeTool, setActiveTool, setSelectedShapeType, selectedShapeType);
  const { handleGradientToolChange } = useGradientTool(setActiveTool, setGradientToolState, gradientToolState);
  const { handleEyedropperToolChange } = useEyedropper(setActiveTool, setForegroundColor);
  const { handleMoveToolChange } = useMoveTool(setActiveTool);
  const { handleLassoToolChange } = useLassoTool(setActiveTool);

  const handleCopy = useCallback(() => {
    if (!dimensions || !image) {
      showError("No image loaded to copy.");
      return;
    }
    // Stub: In a real app, this would rasterize the image first.
    showSuccess("Image copied to clipboard (Stub).");
  }, [dimensions, image]);

  const handleSwapColors = useCallback(() => {
    const temp = foregroundColor;
    setForegroundColor(backgroundColor);
    setBackgroundColor(temp);
  }, [foregroundColor, backgroundColor, setForegroundColor, setBackgroundColor]);

  const handleMarqueeSelectionComplete = useCallback(async (start: Point, end: Point) => {
    // Placeholder logic to satisfy the interface
    console.log("Marquee selection complete:", start, end);
  }, []);

  const {
    zoom: workspaceZoom,
    setZoom: setWorkspaceZoom,
    handleWheel,
    handleFitScreen,
    handleZoomIn,
    handleZoomOut,
    isMouseOverImage,
    setIsMouseOverImage,
    gradientStart,
    gradientCurrent,
    handleWorkspaceMouseDown,
    handleWorkspaceMouseMove,
    handleWorkspaceMouseUp,
  } = useWorkspaceInteraction(
    workspaceRef, imgRef, activeTool, dimensions, setSelectionPath, setSelectionMaskDataUrl, clearSelectionState,
    gradientToolState, setSelectedLayerId, layers, zoom, setZoom, setMarqueeStart, setMarqueeCurrent,
    handleMarqueeSelectionComplete, currentEditState, setCloneSourcePoint
  );

  const hasActiveSelection = !!selectionMaskDataUrl || !!selectionPath;

  return {
    ...state,
    // Core State
    hasImage: !!image,
    selectedLayer: layers.find(l => l.id === state.selectedLayerId),
    // History
    undo, redo, canUndo, canRedo,
    // Layer Management (from useLayers)
    smartObjectEditingId, openSmartObjectEditor, closeSmartObjectEditor, saveSmartObjectChanges,
    updateLayer, commitLayerChange, handleLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit,
    handleToggleVisibility, renameLayer, deleteLayer, duplicateLayer, mergeLayerDown, rasterizeLayer, createSmartObject,
    handleAddTextLayer, handleAddDrawingLayer, handleAddLayerFromBackground, handleLayerFromSelection, handleAddShapeLayer, handleAddGradientLayer, addAdjustmentLayer,
    groupLayers, toggleGroupExpanded, handleDrawingStrokeEnd, handleLayerDelete, reorderLayers, onSelectLayer: onSelectLayerFromLayers,
    removeLayerMask, invertLayerMask, toggleClippingMask, toggleLayerLock, handleDeleteHiddenLayers,
    handleRasterizeSmartObject, handleConvertSmartObjectToLayers, handleExportSmartObjectContents, handleArrangeLayer,
    applySelectionAsMask, handleSelectionBrushStrokeEnd,
    // Adjustments
    adjustments, onAdjustmentChange, onAdjustmentCommit, effects, onEffectChange, onEffectCommit,
    grading, onGradingChange, onGradingCommit, hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit,
    curves, onCurvesChange, onCurvesCommit, selectedFilter, onFilterChange, channels, onChannelChange,
    transforms, onTransformChange, rotation, onRotationChange, onRotationCommit,
    crop: cropState, onCropChange, onCropComplete, onAspectChange, aspect, frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit,
    // Presets
    presets, handleApplyPreset, handleSavePreset, deletePreset,
    // Gradient Presets (from useEditorState)
    gradientPresets, saveGradientPreset, deleteGradientPreset, // FIXED: Now correctly exported
    // Project & IO
    handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate, handleExport, handleCopy, handleProjectSettingsUpdate,
    // AI
    handleGenerateImage, handleGenerativeFill,
    // Workspace
    workspaceZoom, handleWheel, handleFitScreen, handleZoomIn, handleZoomOut, isMouseOverImage, setIsMouseOverImage,
    gradientStart, gradientCurrent, handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp,
    hasActiveSelection,
    // Tools
    handleBrushToolChange, handleTextToolChange, handleShapeToolChange, handleGradientToolChange, handleEyedropperToolChange, handleMoveToolChange, handleLassoToolChange,
    handleSwapColors,
    ToolsPanel: require('@/components/layout/LeftSidebar').default, // Re-exporting the component reference
  };
};