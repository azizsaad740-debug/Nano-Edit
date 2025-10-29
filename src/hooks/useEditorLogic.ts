import { useState, useCallback, useMemo, useEffect } from "react";
import { useEditorState } from "./useEditorState";
import { useImageLoader } from "./useImageLoader";
import { useLayers } from "./useLayers";
import { useAdjustments } from "./useAdjustments";
import { useEffects } from "./useEffects";
import { useColorGrading } from "./useColorGrading";
import { useHslAdjustments } from "./useHslAdjustments";
import { useCurves } from "./useCurves";
import { useChannels } from "./useChannels";
import { useTransform } from "./useTransform";
import { useCrop } from "./useCrop";
import { useFrame } from "./useFrame";
import { usePresets } from "./usePresets";
import { useGradientPresets } from "./useGradientPresets";
import { useSettings } from "./useSettings";
import { useGenerativeAi } from "./useGenerativeAi";
import { useFontManager } from "./useFontManager";
import { useSelectiveBlur } from "./useSelectiveBlur";
import { useWorkspaceInteraction } from "./useWorkspaceInteraction";
import { useProjectSettings } from "@/hooks/useProjectSettings";
import { copyImageToClipboard, downloadImage, rasterizeEditedImageWithMask } from "@/utils/imageUtils";
import { polygonToMaskDataUrl, invertMaskDataUrl } from "@/utils/maskUtils";
import { showError, showSuccess } from "@/utils/toast";
import type { Layer, EditState, ActiveTool, Point, BrushState, SelectionSettings } from "@/types/editor";

export const useEditorLogic = (
  imgRef: React.RefObject<HTMLImageElement>,
  workspaceRef: React.RefObject<HTMLDivElement>,
) => {
  const state = useEditorState();
  const {
    image, dimensions, fileInfo, exifData, currentEditState, layers, selectedLayerId, activeTool,
    brushState, gradientToolState, foregroundColor, backgroundColor, selectedShapeType, selectionPath,
    selectionMaskDataUrl, selectiveBlurAmount, customHslColor, selectionSettings,
    setDimensions, setFileInfo, setExifData, setCurrentEditState, setLayers, setSelectedLayerId,
    setActiveTool, setBrushState, setGradientToolState, setForegroundColor, setBackgroundColor,
    setSelectedShapeType, setSelectionPath, setSelectionMaskDataUrl, clearSelectionState,
    updateCurrentState, recordHistory, undo, redo, canUndo, canRedo, resetAllEdits,
    selectiveBlurMask, setSelectiveBlurAmount, setCustomHslColor, setSelectionSettings,
    marqueeStart, setMarqueeStart, marqueeCurrent, setMarqueeCurrent,
    zoom, setZoom,
  } = state;

  const hasImage = !!image || layers.length > 1;
  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  // --- Settings & AI ---
  const { geminiApiKey, stabilityApiKey } = useSettings();
  const { systemFonts, customFonts, setSystemFonts, addCustomFont, removeCustomFont } = useFontManager();

  // --- Workspace Interaction ---
  const {
    zoom: workspaceZoom,
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
    async (start, end) => {
      if (dimensions) {
        // Marquee selection completion logic is handled inside useWorkspaceInteraction now
        // We just need to record history here if needed, but the mask is set directly.
        recordHistory("Marquee Selection Applied", currentEditState, layers);
      }
    },
    currentEditState,
  );

  // --- Adjustments Hooks ---
  const { adjustments, onAdjustmentChange, onAdjustmentCommit, selectedFilter, onFilterChange, applyPreset: applyAdjustmentsPreset } = useAdjustments(currentEditState, updateCurrentState, recordHistory, layers);
  const { effects, onEffectChange, onEffectCommit, applyPreset: applyEffectsPreset } = useEffects(currentEditState, updateCurrentState, recordHistory, layers);
  const { grading, onGradingChange, onGradingCommit, applyPreset: applyGradingPreset } = useColorGrading(currentEditState, updateCurrentState, recordHistory, layers);
  const { hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, applyPreset: applyHslPreset } = useHslAdjustments(currentEditState, updateCurrentState, recordHistory, layers);
  const { curves, onCurvesChange, onCurvesCommit, applyPreset: applyCurvesPreset } = useCurves({ currentEditState, updateCurrentState, recordHistory, layers });
  const { channels, onChannelChange, applyPreset: applyChannelsPreset } = useChannels(currentEditState, updateCurrentState, recordHistory, layers);
  const { transforms, onTransformChange, rotation, onRotationChange, onRotationCommit, applyPreset: applyTransformPreset } = useTransform(currentEditState, updateCurrentState, recordHistory, layers);
  const { crop, onCropChange, onCropComplete, onAspectChange, aspect, applyPreset: applyCropPreset } = useCrop(currentEditState, updateCurrentState, recordHistory, layers);
  const { frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, applyPreset: applyFramePreset } = useFrame(currentEditState, updateCurrentState, recordHistory, layers);
  const { selectiveBlurMask: currentSelectiveBlurMask, handleSelectiveBlurStrokeEnd, applyPreset: applySelectiveBlurPreset } = useSelectiveBlur(currentEditState, updateCurrentState, recordHistory, layers, dimensions);

  // --- Presets ---
  const { presets, savePreset, deletePreset } = usePresets();
  const { gradientPresets, saveGradientPreset, deleteGradientPreset } = useGradientPresets();

  const handleApplyPreset = useCallback((preset: { name: string; state: Partial<EditState>; layers?: Layer[] }) => {
    if (preset.state) {
      applyAdjustmentsPreset(preset.state);
      applyEffectsPreset(preset.state);
      applyGradingPreset(preset.state);
      applyHslPreset(preset.state);
      applyCurvesPreset(preset.state);
      applyChannelsPreset(preset.state);
      applyTransformPreset(preset.state);
      applyCropPreset(preset.state);
      applyFramePreset(preset.state);
      applySelectiveBlurPreset(preset.state);
    }
    if (preset.layers) {
      setLayers(preset.layers);
    }
    recordHistory(`Applied Preset: ${preset.name}`, currentEditState, layers);
    showSuccess(`Preset "${preset.name}" applied.`);
  }, [currentEditState, layers, recordHistory, applyAdjustmentsPreset, applyEffectsPreset, applyGradingPreset, applyHslPreset, applyCurvesPreset, applyChannelsPreset, applyTransformPreset, applyCropPreset, applyFramePreset, applySelectiveBlurPreset, setLayers]);

  const handleSavePreset = useCallback((name: string) => {
    savePreset(name, currentEditState, layers);
  }, [savePreset, currentEditState, layers]);

  // --- Layer Management ---
  const {
    smartObjectEditingId,
    openSmartObjectEditor,
    closeSmartObjectEditor,
    saveSmartObjectChanges,
    updateLayer,
    commitLayerChange,
    handleLayerPropertyCommit,
    handleLayerOpacityChange,
    handleLayerOpacityCommit,
    handleToggleVisibility,
    renameLayer,
    deleteLayer,
    duplicateLayer,
    mergeLayerDown,
    rasterizeLayer,
    createSmartObject,
    handleAddTextLayer,
    handleAddDrawingLayer,
    handleAddLayerFromBackground,
    handleLayerFromSelection,
    handleAddShapeLayer,
    handleAddGradientLayer,
    addAdjustmentLayer,
    groupLayers,
    toggleGroupExpanded,
    handleDrawingStrokeEnd,
    handleLayerDelete,
    reorderLayers,
    onSelectLayer,
    removeLayerMask,
    invertLayerMask,
    toggleClippingMask,
    toggleLayerLock,
    handleDeleteHiddenLayers,
    handleRasterizeSmartObject,
    handleConvertSmartObjectToLayers,
    handleExportSmartObjectContents,
    handleArrangeLayer,
    applySelectionAsMask,
    handleSelectionBrushStrokeEnd,
  } = useLayers({
    layers, setLayers, selectedLayerId, setSelectedLayerId, dimensions,
    recordHistory, currentEditState, foregroundColor, backgroundColor,
    selectedShapeType, selectionMaskDataUrl, clearSelectionState,
    brushState,
  });

  // --- Image Loading ---
  const { handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate } = useImageLoader(
    state.setImage, setDimensions, setFileInfo, setExifData, setLayers, resetAllEdits,
    recordHistory, setCurrentEditState, currentEditState, state.initialLayerState, state.initialHistoryItem,
    setSelectedLayerId, clearSelectionState,
  );

  // --- Project Settings ---
  const { handleProjectSettingsUpdate } = useProjectSettings(
    currentEditState, updateCurrentState, recordHistory, layers, dimensions, setDimensions
  );

  // --- Export & Copy ---
  const handleExport = useCallback(async (options: { format: string; quality: number; width: number; height: number; upscale: 1 | 2 | 4 }) => {
    if (!dimensions || !image) {
      showError("No image loaded to export.");
      return;
    }
    
    const base64Image = await rasterizeEditedImageWithMask(layers, dimensions, currentEditState, imgRef.current);

    if (options.upscale > 1) {
      // Upscale logic (stubbed in utils/stabilityApi.ts)
      const { upscaleImageApi } = await import("@/utils/stabilityApi");
      try {
        const upscaledBase64 = await upscaleImageApi(base64Image, stabilityApiKey, options.upscale);
        downloadImage(upscaledBase64, fileInfo?.name || 'nanoedit_upscaled', options.format, options.quality);
        showSuccess("Image upscaled and downloaded.");
      } catch (error) {
        showError("AI Upscale failed. Downloading original size.");
        downloadImage(base64Image, fileInfo?.name || 'nanoedit_edited', options.format, options.quality);
      }
    } else {
      downloadImage(base64Image, fileInfo?.name || 'nanoedit_edited', options.format, options.quality);
      showSuccess("Image downloaded.");
    }
  }, [dimensions, image, layers, currentEditState, imgRef, fileInfo, stabilityApiKey]);

  const handleCopy = useCallback(async () => {
    if (!dimensions || !image) {
      showError("No image loaded to copy.");
      return;
    }
    const base64Image = await rasterizeEditedImageWithMask(layers, dimensions, currentEditState, imgRef.current);
    copyImageToClipboard(base64Image);
    showSuccess("Image copied to clipboard.");
  }, [dimensions, image, layers, currentEditState, imgRef]);

  // --- AI Generation ---
  const { handleGenerateImage, handleGenerativeFill } = useGenerativeAi(
    geminiApiKey, image, dimensions, state.setImage, setDimensions, setFileInfo,
    layers, handleAddDrawingLayer, updateLayer, commitLayerChange, clearSelectionState,
    () => {}, () => {} // Dialog setters are handled in Index.tsx
  );

  // --- Color Tools ---
  const handleSwapColors = useCallback(() => {
    setForegroundColor(backgroundColor);
    setBackgroundColor(foregroundColor);
  }, [foregroundColor, backgroundColor, setForegroundColor, setBackgroundColor]);

  // --- Brush State Management ---
  const setBrushStatePartial = useCallback((updates: Partial<Omit<BrushState, 'color'>>) => {
    setBrushState(prev => {
      const newState = { ...prev, ...updates };
      // Commit history only if a non-temporary property is changed (e.g., size, hardness, flow)
      if (updates.size !== undefined || updates.hardness !== undefined || updates.flow !== undefined) {
        recordHistory("Change Brush Settings", currentEditState, layers);
      }
      return newState;
    });
  }, [setBrushState, recordHistory, currentEditState, layers]);

  // --- Selection Settings Management ---
  const onSelectionSettingChange = useCallback((key: keyof SelectionSettings, value: any) => {
    setSelectionSettings(prev => ({ ...prev, [key]: value }));
  }, [setSelectionSettings]);

  const onSelectionSettingCommit = useCallback((key: keyof SelectionSettings, value: any) => {
    recordHistory(`Set Selection Setting ${String(key)} to ${value}`, currentEditState, layers);
  }, [currentEditState, layers, recordHistory]);

  // --- Preview State ---
  const [isPreviewingOriginal, setIsPreviewingOriginal] = useState(false);

  return {
    // Core State
    image, hasImage, dimensions, fileInfo, exifData, currentEditState, layers, selectedLayerId, selectedLayer,
    activeTool, setActiveTool, selectedShapeType, setSelectedShapeType,
    brushState, setBrushState, setBrushStatePartial, gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectionPath, selectionMaskDataUrl, setSelectionPath, setSelectionMaskDataUrl, clearSelectionState,
    selectiveBlurAmount, setSelectiveBlurAmount, customHslColor, setCustomHslColor,
    selectionSettings, onSelectionSettingChange, onSelectionSettingCommit,
    marqueeStart, marqueeCurrent,
    // History
    history: state.history, currentHistoryIndex: state.currentHistoryIndex, handleHistoryJump: state.setCurrentHistoryIndex,
    undo, redo, canUndo, canRedo, resetAllEdits,
    // Workspace Interaction
    workspaceZoom, handleWheel, handleFitScreen, handleZoomIn, handleZoomOut, isMouseOverImage, setIsMouseOverImage,
    gradientStart, gradientCurrent, handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp,
    // Adjustments
    adjustments, onAdjustmentChange, onAdjustmentCommit, effects, onEffectChange, onEffectCommit,
    grading, onGradingChange, onGradingCommit, hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit,
    curves, onCurvesChange, onCurvesCommit, channels, onChannelChange,
    selectedFilter, onFilterChange, transforms, onTransformChange, rotation, onRotationChange, onRotationCommit,
    crop, onCropChange, onCropComplete, onAspectChange, aspect, frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit,
    // Presets
    presets, handleApplyPreset, handleSavePreset, deletePreset,
    gradientPresets, saveGradientPreset, deleteGradientPreset,
    // Layer Management
    updateLayer, commitLayerChange, handleLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit,
    handleToggleVisibility, renameLayer, deleteLayer, duplicateLayer, mergeLayerDown, rasterizeLayer, createSmartObject,
    openSmartObjectEditor, closeSmartObjectEditor, saveSmartObjectChanges, smartObjectEditingId,
    handleAddTextLayer, handleAddDrawingLayer, handleAddLayerFromBackground, handleLayerFromSelection, handleAddShapeLayer, handleAddGradientLayer, addAdjustmentLayer,
    groupLayers, toggleGroupExpanded, handleDrawingStrokeEnd, handleLayerDelete, reorderLayers, onSelectLayer,
    removeLayerMask, invertLayerMask, toggleClippingMask, toggleLayerLock, handleDeleteHiddenLayers,
    handleRasterizeSmartObject, handleConvertSmartObjectToLayers, handleExportSmartObjectContents, handleArrangeLayer,
    applySelectionAsMask, handleSelectionBrushStrokeEnd, handleSelectiveBlurStrokeEnd,
    // File/Export/AI
    handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate,
    handleExport, handleCopy, handleGenerateImage, handleGenerativeFill,
    geminiApiKey, stabilityApiKey,
    // Color Tools
    handleSwapColors,
    // Project Settings
    handleProjectSettingsUpdate,
    // Fonts
    systemFonts, customFonts,
    // Preview
    isPreviewingOriginal, setIsPreviewingOriginal,
    // Zoom setter for external use
    setZoom,
  };
};