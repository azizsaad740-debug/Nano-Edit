import { useMemo, useRef } from "react";
import { useEditorState } from "./useEditorState";
import { useAdjustments } from "./useAdjustments";
import { useEffects } from "./useEffects";
import { useColorGrading } from "./useColorGrading";
import { useHslAdjustments } from "./useHslAdjustments";
import { useCurves } from "./useCurves";
import { useTransform } from "./useTransform";
import { useCrop } from "./useCrop";
import { useFrame } from "./useFrame";
import { useLayers } from "./useLayers";
import { useImageLoader } from "./useImageLoader";
import { usePresets } from "./usePresets";
import { useGradientPresets } from "./useGradientPresets";
import { useWorkspaceInteraction } from "./useWorkspaceInteraction";
import { useGenerativeAi } from "./useGenerativeAi";
import { useProjectSettings } from "./useProjectSettings";
import { useChannels } from "./useChannels";
import { useSelectiveBlur } from "./useSelectiveBlur";
import { downloadImage, rasterizeEditedImageWithMask } from "@/utils/imageUtils";
import { upscaleImageApi } from "@/utils/stabilityApi";
import { showError, showSuccess } from "@/utils/toast";
import type { ExportOptions } from "@/components/editor/ExportOptions";
import type { Layer, EditState, HslColorKey, HslAdjustment, Point } from "@/types/editor";

export const useEditorLogic = () => {
  const state = useEditorState();
  const {
    image, dimensions, fileInfo, exifData, layers, selectedLayerId, selectedLayer,
    activeTool, setActiveTool, brushState, setBrushState, gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType, selectionPath, selectionMaskDataUrl,
    selectiveBlurAmount, setSelectiveBlurAmount, customHslColor, setCustomHslColor,
    selectionSettings, setSelectionSettings,
    currentEditState, updateCurrentState,
    cloneSourcePoint,
    
    // History
    history, currentHistoryIndex, recordHistory, undo, redo, canUndo, canRedo, resetAllEdits,
    
    // Layers
    layers: allLayers, setLayers,
    selectedLayerId: currentSelectedLayerId, setSelectedLayerId,
    
    // Selection/Marquee
    marqueeStart, setMarqueeStart, marqueeCurrent, setMarqueeCurrent,
    setSelectionPath, setSelectionMaskDataUrl, clearSelectionState,
    
    // Zoom/Workspace
    zoom, setZoom,
    workspaceRef, imgRef,
    
    // External/IO
    initialLayerState, initialHistoryItem,
    geminiApiKey, stabilityApiKey,
    dismissToast,
    isGenerateOpen, setIsGenerateOpen,
    isGenerativeFillOpen, setIsGenerativeFillOpen,
    isPreviewingOriginal, setIsPreviewingOriginal,
    
    // Font Manager
    systemFonts, setSystemFonts, customFonts, addCustomFont, removeCustomFont,
  } = state;

  // --- Global Adjustments Hooks ---
  const { adjustments, onAdjustmentChange, onAdjustmentCommit, selectedFilter, onFilterChange, applyPreset: applyAdjustmentsPreset } = useAdjustments(currentEditState, updateCurrentState, recordHistory, allLayers);
  const { effects, onEffectChange, onEffectCommit, applyPreset: applyEffectsPreset } = useEffects(currentEditState, updateCurrentState, recordHistory, allLayers);
  const { grading, onGradingChange, onGradingCommit, applyPreset: applyGradingPreset } = useColorGrading(currentEditState, updateCurrentState, recordHistory, allLayers);
  const { hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, applyPreset: applyHslPreset } = useHslAdjustments(currentEditState, updateCurrentState, recordHistory, allLayers);
  const { curves, onCurvesChange, onCurvesCommit, applyPreset: applyCurvesPreset } = useCurves({ currentEditState, updateCurrentState, recordHistory, layers: allLayers });
  const { transforms, onTransformChange, rotation, onRotationChange, onRotationCommit, applyPreset: applyTransformPreset } = useTransform(currentEditState, updateCurrentState, recordHistory, allLayers);
  const { crop, onCropChange, onCropComplete, onAspectChange, aspect, applyPreset: applyCropPreset } = useCrop(currentEditState, updateCurrentState, recordHistory, allLayers);
  const { frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, applyPreset: applyFramePreset } = useFrame({ currentEditState, updateCurrentState, recordHistory, layers: allLayers });
  const { channels, onChannelChange, applyPreset: applyChannelsPreset } = useChannels({ currentEditState, updateCurrentState, recordHistory, layers: allLayers });
  const { selectiveBlurMask: currentSelectiveBlurMask, handleSelectiveBlurStrokeEnd, applyPreset: applySelectiveBlurPreset } = useSelectiveBlur(currentEditState, updateCurrentState, recordHistory, allLayers, dimensions);

  // --- Presets ---
  const { presets, savePreset, deletePreset } = usePresets();
  const { gradientPresets, saveGradientPreset, deleteGradientPreset } = useGradientPresets();

  const handleApplyPreset = (preset: { name: string; state: Partial<EditState>; layers?: Layer[] }) => {
    if (preset.state) {
      applyAdjustmentsPreset(preset.state);
      applyEffectsPreset(preset.state);
      applyGradingPreset(preset.state);
      applyHslPreset(preset.state);
      if (preset.state.curves) {
        applyCurvesPreset(preset.state.curves);
      }
      applyChannelsPreset(preset.state);
      applyTransformPreset(preset.state);
      applyCropPreset(preset.state);
      applyFramePreset(preset.state);
      applySelectiveBlurPreset(preset.state);
    }
    if (preset.layers) {
      setLayers(preset.layers);
    }
    recordHistory(`Applied Preset: ${preset.name}`, currentEditState, allLayers);
    showSuccess(`Preset "${preset.name}" applied.`);
  };

  const handleSavePreset = (name: string) => {
    savePreset(name, currentEditState, allLayers);
  };

  // --- Layer Management ---
  const {
    smartObjectEditingId, openSmartObjectEditor, closeSmartObjectEditor, saveSmartObjectChanges,
    updateLayer, commitLayerChange, handleLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit,
    handleToggleVisibility, renameLayer, deleteLayer, duplicateLayer, mergeLayerDown, rasterizeLayer, createSmartObject,
    handleAddTextLayer, handleAddDrawingLayer, handleAddLayerFromBackground, handleLayerFromSelection, handleAddShapeLayer, handleAddGradientLayer, addAdjustmentLayer,
    groupLayers, toggleGroupExpanded, handleDrawingStrokeEnd, handleLayerDelete, reorderLayers, onSelectLayer,
    removeLayerMask, invertLayerMask, toggleClippingMask, toggleLayerLock, handleDeleteHiddenLayers,
    handleRasterizeSmartObject, handleConvertSmartObjectToLayers, handleExportSmartObjectContents, handleArrangeLayer,
    applySelectionAsMask, handleSelectionBrushStrokeEnd,
  } = useLayers({
    layers: allLayers, setLayers, selectedLayerId: currentSelectedLayerId, setSelectedLayerId, dimensions,
    recordHistory, currentEditState, foregroundColor, backgroundColor,
    selectedShapeType, selectionMaskDataUrl, setSelectionMaskDataUrl, clearSelectionState,
    brushState, activeTool,
  });

  // --- Image Loading and Project Management ---
  const { handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate } = useImageLoader(
    state.setImage, setDimensions, setFileInfo, setExifData, setLayers, resetAllEdits,
    recordHistory, setCurrentEditState, currentEditState, initialLayerState, initialHistoryItem,
    setSelectedLayerId, clearSelectionState,
  );

  // --- Export and AI ---
  const { handleGenerateImage, handleGenerativeFill } = useGenerativeAi(
    geminiApiKey, image, dimensions, state.setImage, setDimensions, setFileInfo,
    allLayers, handleAddDrawingLayer, updateLayer, commitLayerChange, clearSelectionState,
    setIsGenerateOpen, setIsGenerativeFillOpen,
  );

  const handleExport = async (options: ExportOptions) => {
    if (!dimensions || !image) {
      showError("No image loaded to export.");
      return;
    }

    const toastId = showSuccess("Preparing image for export...");

    try {
      // 1. Rasterize the final image (including all layers and adjustments)
      const base64Image = await rasterizeEditedImageWithMask(allLayers, dimensions, currentEditState, imgRef.current);

      let finalBase64 = base64Image;

      // 2. Handle AI Upscale
      if (options.upscale > 1) {
        const stabilityApiKey = state.stabilityApiKey;
        finalBase64 = await upscaleImageApi(base64Image, stabilityApiKey, options.upscale as 2 | 4);
      }

      // 3. Download
      downloadImage(finalBase64, fileInfo?.name || 'nanoedit_export', options.format, options.quality);
      showSuccess("Image exported successfully.");
    } catch (error) {
      console.error("Export failed:", error);
      showError("Export failed. Check console for details.");
    } finally {
      dismissToast(toastId);
    }
  };

  const handleCopy = () => {
    // Stub: Copying the final rasterized image to clipboard
    showError("Copy to clipboard is currently a stub.");
  };

  // --- Project Settings ---
  const { handleProjectSettingsUpdate } = useProjectSettings(
    currentEditState, updateCurrentState, recordHistory, allLayers, dimensions, setDimensions
  );

  // --- Workspace Interaction ---
  const handleMarqueeSelectionComplete = (start: Point, end: Point) => {
    // This is a stub function that needs to be defined here to satisfy the hook dependency
    // The actual logic is complex and handled in useWorkspaceInteraction (stubbed there for now)
    console.log("Marquee selection complete (stub).");
  };

  const {
    zoom: workspaceZoom, handleWheel, handleFitScreen, handleZoomIn, handleZoomOut,
    isMouseOverImage, setIsMouseOverImage, gradientStart, gradientCurrent,
    handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp,
  } = useWorkspaceInteraction(
    workspaceRef, imgRef, activeTool, dimensions,
    setSelectionPath, setSelectionMaskDataUrl, clearSelectionState,
    gradientToolState, setSelectedLayerId, allLayers, zoom, setZoom,
    setMarqueeStart, setMarqueeCurrent, handleMarqueeSelectionComplete,
    currentEditState, state.setCloneSourcePoint,
  );

  // --- Derived State ---
  const hasImage = !!image;
  const selectedLayer = useMemo(() => allLayers.find(l => l.id === currentSelectedLayerId), [allLayers, currentSelectedLayerId]);
  const hasActiveSelection = !!selectionMaskDataUrl || (selectionPath && selectionPath.length > 0);

  return {
    // Core State
    image, dimensions, fileInfo, exifData, layers: allLayers, selectedLayerId: currentSelectedLayerId, selectedLayer,
    activeTool, setActiveTool, brushState, setBrushState, gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType, selectionPath, selectionMaskDataUrl,
    selectiveBlurAmount, setSelectiveBlurAmount, customHslColor, setCustomHslColor,
    selectionSettings, setSelectionSettings,
    currentEditState, updateCurrentState,
    cloneSourcePoint,
    
    // History
    history: state.history, currentHistoryIndex: state.currentHistoryIndex,
    recordHistory, undo, redo, canUndo, canRedo, resetAllEdits,
    
    // Layer Management
    smartObjectEditingId, openSmartObjectEditor, closeSmartObjectEditor, saveSmartObjectChanges,
    updateLayer, commitLayerChange, handleLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit,
    handleToggleVisibility, renameLayer, deleteLayer, duplicateLayer, mergeLayerDown, rasterizeLayer, createSmartObject,
    handleAddTextLayer: (coords: Point) => handleAddTextLayer(coords, foregroundColor),
    handleAddDrawingLayer, handleAddLayerFromBackground, handleLayerFromSelection,
    handleAddShapeLayer: (coords: Point, shapeType?: Layer['shapeType'], initialWidth?: number, initialHeight?: number) => handleAddShapeLayer(coords, shapeType, initialWidth, initialHeight, foregroundColor, backgroundColor),
    handleAddGradientLayer, addAdjustmentLayer, groupLayers, toggleGroupExpanded,
    handleDrawingStrokeEnd, handleLayerDelete, reorderLayers, onSelectLayer,
    removeLayerMask, invertLayerMask, toggleClippingMask, toggleLayerLock, handleDeleteHiddenLayers,
    handleRasterizeSmartObject, handleConvertSmartObjectToLayers, handleExportSmartObjectContents, handleArrangeLayer,
    applySelectionAsMask, handleSelectionBrushStrokeEnd,
    
    // Adjustments
    adjustments, onAdjustmentChange, onAdjustmentCommit, effects, onEffectChange, onEffectCommit,
    grading, onGradingChange, onGradingCommit, hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit,
    curves, onCurvesChange, onCurvesCommit, selectedFilter, onFilterChange, channels, onChannelChange,
    transforms, onTransformChange, rotation, onRotationChange, onRotationCommit,
    crop, onCropChange, onCropComplete, onAspectChange, aspect,
    frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit,
    
    // Presets
    presets, handleApplyPreset, handleSavePreset, deletePreset,
    gradientPresets, saveGradientPreset, deleteGradientPreset,
    
    // Project & IO
    handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate,
    handleExport, handleCopy, handleProjectSettingsUpdate,
    
    // AI
    geminiApiKey, handleGenerateImage, handleGenerativeFill,
    
    // Workspace
    hasImage, hasActiveSelection,
    workspaceZoom, handleWheel, handleFitScreen, handleZoomIn, handleZoomOut,
    isMouseOverImage, setIsMouseOverImage,
    gradientStart: gradientStart as Point | null,
    gradientCurrent: gradientCurrent as Point | null,
    marqueeStart, marqueeCurrent,
    handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp,
    clearSelectionState,
    setIsPreviewingOriginal,
    
    // Refs/External
    workspaceRef, imgRef,
    systemFonts, setSystemFonts, customFonts, addCustomFont, removeCustomFont,
  };
};