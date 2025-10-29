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
import { initialEditState, initialLayerState, initialHistoryItem } from '@/types/editor';

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
    ...rest
  } = state;

  const { handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate } = useImageLoader(
    state.setImage, state.setDimensions, state.setFileInfo, state.setExifData, state.setLayers, state.resetAllEdits,
    state.recordHistory, state.setCurrentEditState, initialEditState, initialLayerState, initialHistoryItem,
    state.setSelectedLayerId, state.clearSelectionState,
  );

  const { handleProjectSettingsUpdate } = useProjectSettings(
    currentEditState, state.updateCurrentState, recordHistory, layers, dimensions, state.setDimensions
  );

  const { handleGenerateImage, handleGenerativeFill } = useGenerativeAi(
    state.geminiApiKey, image, dimensions, state.setImage, state.setDimensions, state.setFileInfo, layers,
    rest.handleAddDrawingLayer, rest.updateLayer, rest.commitLayerChange, state.clearSelectionState, state.setIsGenerateOpen, state.setIsGenerativeFillOpen
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
          const upscaledImage = await upscaleImageApi(finalBase64, state.stabilityApiKey, options.upscale);
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

  // ... (rest of the logic hook definitions)

  const { crop: cropState, onCropChange, onCropComplete, onAspectChange, aspect, applyPreset: applyCropPreset } = useCrop(
    currentEditState, state.updateCurrentState, recordHistory, layers
  );
  
  const { transforms, onTransformChange, rotation, onRotationChange, onRotationCommit, applyPreset: applyTransformPreset } = useTransform(
    currentEditState, state.updateCurrentState, recordHistory, layers
  );

  const { adjustments, onAdjustmentChange, onAdjustmentCommit, selectedFilter, onFilterChange, applyPreset: applyAdjustmentsPreset } = useAdjustments(
    currentEditState, state.updateCurrentState, recordHistory, layers
  );

  const { effects, onEffectChange, onEffectCommit, applyPreset: applyEffectsPreset } = useEffects(
    currentEditState, state.updateCurrentState, recordHistory, layers
  );

  const { grading, onGradingChange, onGradingCommit, applyPreset: applyGradingPreset } = useColorGrading(
    currentEditState, state.updateCurrentState, recordHistory, layers
  );

  const { hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, applyPreset: applyHslPreset } = useHslAdjustments(
    currentEditState, state.updateCurrentState, recordHistory, layers
  );

  const { curves, onCurvesChange, onCurvesCommit, applyPreset: applyCurvesPreset } = useCurves({
    currentEditState, state.updateCurrentState, recordHistory, layers
  });

  const { channels, onChannelChange, applyPreset: applyChannelsPreset } = useChannels({
    currentEditState, state.updateCurrentState, recordHistory, layers
  });

  const { frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, applyPreset: applyFramePreset } = useFrame({
    currentEditState, state.updateCurrentState, recordHistory, layers
  });

  const { selectiveBlurMask, handleSelectiveBlurStrokeEnd, applyPreset: applySelectiveBlurPreset } = useSelectiveBlur(
    currentEditState, state.updateCurrentState, recordHistory, layers, dimensions
  );

  const { presets, savePreset, deletePreset } = usePresets();

  const handleApplyPreset = useCallback((preset: typeof presets[0]) => {
    applyAdjustmentsPreset(preset.state);
    applyEffectsPreset(preset.state);
    applyGradingPreset(preset.state);
    applyHslPreset(preset.state);
    applyCurvesPreset(preset.state);
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
    workspaceRef, imgRef, activeTool, dimensions, setSelectionPath, setSelectionMaskDataUrl, state.clearSelectionState,
    gradientToolState, state.setSelectedLayerId, layers, zoom, setZoom, setMarqueeStart, setMarqueeCurrent,
    rest.onMarqueeSelectionComplete, currentEditState, setCloneSourcePoint
  );

  const hasActiveSelection = !!selectionMaskDataUrl || !!selectionPath;

  return {
    ...state,
    // Core State
    hasImage: !!image,
    // History
    undo, redo, canUndo, canRedo,
    // Layer Management
    ...rest,
    // Adjustments
    adjustments, onAdjustmentChange, onAdjustmentCommit, effects, onEffectChange, onEffectCommit,
    grading, onGradingChange, onGradingCommit, hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit,
    curves, onCurvesChange, onCurvesCommit, selectedFilter, onFilterChange, channels, onChannelChange,
    transforms, onTransformChange, rotation, onRotationChange, onRotationCommit,
    crop, onCropChange, onCropComplete, onAspectChange, aspect, frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit,
    // Presets
    presets, handleApplyPreset, handleSavePreset, deletePreset,
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
    handleDrawingStrokeEnd: rest.handleDrawingStrokeEnd,
    handleSelectionBrushStrokeEnd: rest.handleSelectionBrushStrokeEnd,
    handleLayerDelete: rest.handleLayerDelete,
    handleSwapColors,
    ToolsPanel: require('@/components/layout/LeftSidebar').default, // Re-exporting the component reference
  };
};