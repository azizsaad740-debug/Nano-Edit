import { useState, useCallback, useRef, useMemo } from "react";
import {
  initialEditState,
  initialLayerState,
  initialHistoryItem,
  type Layer,
  type EditState,
  type ActiveTool,
  type Point,
  type BrushState,
  type GradientToolState,
  type Dimensions,
  type NewProjectSettings,
  type HistoryItem,
} from "@/types/editor";
import { useEditorState } from "@/hooks/useEditorState";
import { usePresets, type Preset } from "@/hooks/usePresets";
import { useGradientPresets } from "@/hooks/useGradientPresets";
import { useFontManager } from "@/hooks/useFontManager";
import { useSettings } from "@/hooks/useSettings";
import { useLayers } from "@/hooks/useLayers";
import { useImageLoader } from "@/hooks/useImageLoader";
import { useWorkspaceInteraction } from "@/hooks/useWorkspaceInteraction";
import { useExport } from "@/hooks/useExport";
import { useTransform } from "@/hooks/useTransform";
import { useCrop } from "@/hooks/useCrop";
import { useFrame } from "@/hooks/useFrame";
import { useAdjustments } from "@/hooks/useAdjustments";
import { useEffects } from "@/hooks/useEffects";
import { useColorGrading } from "@/hooks/useColorGrading";
import { useHslAdjustments } from "@/hooks/useHslAdjustments";
import { useCurves } from "@/hooks/useCurves";
import { useChannels } from "@/hooks/useChannels";
import { useSelectiveBlur } from "@/hooks/useSelectiveBlur";
import { useGenerativeAi } from "@/hooks/useGenerativeAi";
import { useProjectSettings } from "@/hooks/useProjectSettings";
import { copyImageToClipboard } from "@/utils/imageUtils";
import { showError, showSuccess } from "@/utils/toast";

export const useEditorLogic = (imgRef: React.RefObject<HTMLImageElement>, workspaceRef: React.RefObject<HTMLDivElement>) => {
  // --- Core State Management ---
  const coreState = useEditorState();
  const {
    image, setImage, dimensions, setDimensions, fileInfo, setFileInfo, exifData, setExifData,
    currentEditState, setCurrentEditState, updateCurrentState, resetAllEdits,
    history, currentHistoryIndex, recordHistory, undo, redo, canUndo, canRedo,
    layers, setLayers, selectedLayerId, setSelectedLayerId, activeTool, setActiveTool,
    brushState, setBrushState, gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType, selectionPath, setSelectionPath,
    selectionMaskDataUrl, setSelectionMaskDataUrl, clearSelectionState,
    selectiveBlurAmount, setSelectiveBlurAmount, customHslColor, setCustomHslColor,
    zoom, setZoom,
  } = coreState;
  
  // NEW: Preview state
  const [isPreviewingOriginal, setIsPreviewingOriginal] = useState(false);

  // --- External State/Manager Hooks ---
  const { presets, savePreset, deletePreset } = usePresets();
  const { gradientPresets, saveGradientPreset, deleteGradientPreset } = useGradientPresets();
  const { systemFonts, customFonts, addCustomFont, removeCustomFont, setSystemFonts } = useFontManager();
  const { geminiApiKey, stabilityApiKey, saveApiKey } = useSettings();

  // --- Brush Setter Wrapper ---
  const setBrushStatePartial = useCallback((updates: Partial<Omit<BrushState, 'color'>>) => {
    setBrushState(prev => ({ ...prev, ...updates }));
  }, [setBrushState]);

  // --- Individual Adjustment Hooks (for Global Adjustments Panel) ---
  const { adjustments, onAdjustmentChange, onAdjustmentCommit, applyPreset: applyAdjustmentsPreset } = useAdjustments(currentEditState, updateCurrentState, recordHistory, layers);
  const { effects, onEffectChange, onEffectCommit, applyPreset: applyEffectsPreset } = useEffects(currentEditState, updateCurrentState, recordHistory, layers);
  const { grading, onGradingChange, onGradingCommit, applyPreset: applyGradingPreset } = useColorGrading(currentEditState, updateCurrentState, recordHistory, layers);
  const { hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, applyPreset: applyHslPreset } = useHslAdjustments(currentEditState, updateCurrentState, recordHistory, layers);
  const { curves, onCurvesChange, onCurvesCommit, applyPreset: applyCurvesPreset } = useCurves(currentEditState, updateCurrentState, recordHistory, layers);
  const { selectedFilter, onFilterChange, applyPreset: applyFilterPreset } = useAdjustments(currentEditState, updateCurrentState, recordHistory, layers);
  const { transforms, onTransformChange, rotation, onRotationChange, onRotationCommit, applyPreset: applyTransformPreset } = useTransform(currentEditState, updateCurrentState, recordHistory, layers);
  const { crop, onCropChange, onCropComplete, onAspectChange, aspect, applyPreset: applyCropPreset } = useCrop(currentEditState, updateCurrentState, recordHistory, layers);
  const { frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, applyPreset: applyFramePreset } = useFrame(currentEditState, updateCurrentState, recordHistory, layers);
  const { channels, onChannelChange, applyPreset: applyChannelsPreset } = useChannels(currentEditState, updateCurrentState, recordHistory, layers);
  const { selectiveBlurMask, handleSelectiveBlurStrokeEnd, applyPreset: applySelectiveBlurPreset } = useSelectiveBlur(currentEditState, updateCurrentState, recordHistory, layers, dimensions);

  // --- Layer Selection Logic ---
  const onSelectLayer = useCallback((id: string, ctrlKey: boolean, shiftKey: boolean) => {
    // Simplified selection logic: only supports single selection for now
    // but maintains the signature required by LayersPanel for future multi-select support.
    setSelectedLayerId(id);
    clearSelectionState();
  }, [setSelectedLayerId, clearSelectionState]);

  // --- Layer Management Hook ---
  const layerActions = useLayers({
    currentEditState, recordHistory, updateCurrentState, imgRef, imageNaturalDimensions: dimensions,
    gradientToolState, activeTool, layers, selectedLayerId, setSelectedLayerId, history, currentHistoryIndex,
    foregroundColor, backgroundColor, selectedShapeType, selectionMaskDataUrl, clearSelectionState, selectiveBlurAmount,
    setLayers: (newLayersOrUpdater, historyName) => {
      setLayers(newLayersOrUpdater);
      if (historyName && Array.isArray(newLayersOrUpdater)) {
        recordHistory(historyName, currentEditState, newLayersOrUpdater);
      }
    },
  });

  // --- Image Loading and Project Management ---
  const imageLoaderActions = useImageLoader(
    setImage, setDimensions, setFileInfo, setExifData, setLayers, resetAllEdits,
    recordHistory, setCurrentEditState, initialEditState, initialLayerState, initialHistoryItem,
    setSelectedLayerId, clearSelectionState
  );

  // --- Export Hook ---
  const exportActions = useExport(imgRef, layers, currentEditState, stabilityApiKey, dimensions, fileInfo);

  // --- Workspace Interaction ---
  const workspaceInteraction = useWorkspaceInteraction(
    workspaceRef, imgRef, activeTool, dimensions, setSelectionPath, setSelectionMaskDataUrl,
    clearSelectionState, gradientToolState, setSelectedLayerId, layers, zoom, setZoom
  );
  
  // --- Project Settings Hook ---
  const projectSettingsActions = useProjectSettings(currentEditState, updateCurrentState, recordHistory, layers, dimensions, setDimensions);

  // --- Generative AI Hooks ---
  const generativeAiActions = useGenerativeAi(
    geminiApiKey, image, dimensions, setImage, setDimensions, setFileInfo, layers,
    layerActions.handleAddDrawingLayer, layerActions.updateLayer, layerActions.commitLayerChange,
    clearSelectionState, () => {}, () => {} // Placeholder for dialog setters
  );

  // --- Global Preset Application ---
  const handleApplyPreset = useCallback((preset: Preset) => {
    const { state, layers: presetLayers } = preset;
    applyAdjustmentsPreset(state);
    applyEffectsPreset(state);
    applyGradingPreset(state);
    applyHslPreset(state);
    applyCurvesPreset(state);
    applyFilterPreset(state);
    applyTransformPreset(state);
    applyCropPreset(state);
    applyFramePreset(state);
    applyChannelsPreset(state);
    applySelectiveBlurPreset(state);
    
    if (presetLayers) {
      setLayers(presetLayers);
    }

    recordHistory(`Apply Preset: ${preset.name}`, currentEditState, layers);
    showSuccess(`Preset "${preset.name}" applied.`);
  }, [
    applyAdjustmentsPreset, applyEffectsPreset, applyGradingPreset, applyHslPreset, applyCurvesPreset, applyFilterPreset,
    applyTransformPreset, applyCropPreset, applyFramePreset, applyChannelsPreset, applySelectiveBlurPreset,
    recordHistory, currentEditState, layers, setLayers
  ]);

  // --- Consolidated Callbacks ---
  const handleCopy = useCallback(() => {
    if (imgRef.current) {
      copyImageToClipboard({ image: imgRef.current, layers, ...currentEditState });
    } else {
      showError("No image loaded to copy.");
    }
  }, [imgRef, layers, currentEditState]);

  const handleSwapColors = useCallback(() => {
    const temp = foregroundColor;
    setForegroundColor(backgroundColor);
    setBackgroundColor(temp);
  }, [foregroundColor, backgroundColor, setForegroundColor, setBackgroundColor]);

  const handleLayerDelete = useCallback(() => {
    if (selectedLayerId) {
      layerActions.deleteLayer(selectedLayerId);
    }
  }, [selectedLayerId, layerActions.deleteLayer]);

  const handleHistoryJump = useCallback((index: number) => {
    undo(history.length - 1 - index);
  }, [undo, history.length]);

  const handleSavePreset = useCallback((name: string) => {
    savePreset(name, currentEditState, layers);
  }, [savePreset, currentEditState, layers]);

  return {
    // Core State
    ...coreState,
    hasImage: !!image,
    selectedLayer: layers.find(l => l.id === selectedLayerId),
    
    // NEW: Expose image ref and preview state
    imgRef,
    isPreviewingOriginal,
    setIsPreviewingOriginal,
    
    // External Managers
    geminiApiKey, stabilityApiKey, saveApiKey,
    presets, deletePreset, gradientPresets, saveGradientPreset, deleteGradientPreset,
    systemFonts, customFonts, addCustomFont, removeCustomFont, setSystemFonts,

    // Adjustments
    adjustments, onAdjustmentChange, onAdjustmentCommit,
    effects, onEffectChange, onEffectCommit,
    grading, onGradingChange, onGradingCommit,
    hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit,
    curves, onCurvesChange, onCurvesCommit,
    selectedFilter, onFilterChange,
    transforms, onTransformChange, rotation, onRotationChange, onRotationCommit,
    crop, onCropChange, onCropComplete, onAspectChange, aspect,
    frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit,
    channels, onChannelChange,
    selectiveBlurMask, handleSelectiveBlurStrokeEnd,

    // Layer Actions
    ...layerActions,
    onSelectLayer, // Expose the newly implemented function
    
    // Image/Project Actions
    ...imageLoaderActions,
    ...exportActions,
    ...generativeAiActions,
    ...projectSettingsActions, // Expose project settings actions
    
    // Workspace Interaction
    ...workspaceInteraction,
    workspaceZoom: zoom, // Expose zoom as workspaceZoom
    
    // Consolidated Callbacks
    handleApplyPreset,
    handleCopy,
    handleSwapColors,
    handleLayerDelete,
    handleHistoryJump,
    handleSavePreset,
    setBrushStatePartial,
  };
};