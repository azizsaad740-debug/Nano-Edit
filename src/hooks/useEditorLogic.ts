import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useHistory } from './useHistory';
import { useLayers } from './useLayers';
import { useCrop } from './useCrop';
import { useFrame } from './useFrame';
import { useExport } from './useExport';
import { useEditorState } from './useEditorState';
import { useImageLoader } from './useImageLoader';
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
import { rectToMaskDataUrl, ellipseToMaskDataUrl, floodFillToMaskDataUrl, objectSelectToMaskDataUrl } from '@/utils/maskUtils';
import { copyImageToClipboard } from '@/utils/imageUtils';
import { showSuccess, showError } from '@/utils/toast';
import type { Point, EditState, Layer, Dimensions, ActiveTool, ShapeType } from '@/types/editor';
import { initialEditState, initialLayerState } from '@/types/editor';


export const useEditorLogic = (props: any) => {
  const state = useEditorState();
  const {
    image, dimensions, fileInfo, exifData, layers, selectedLayerId, setSelectedLayerId, selectedLayer,
    activeTool, setActiveTool, brushState, setBrushState, gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType, selectionPath, setSelectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl,
    selectiveBlurAmount, setSelectiveBlurAmount, selectiveSharpenAmount, setSelectiveSharpenAmount,
    customHslColor, setCustomHslColor, selectionSettings, setSelectionSettings, cloneSourcePoint, setCloneSourcePoint,
    history, currentHistoryIndex, recordHistory, undo, redo, canUndo, canRedo,
    setCurrentHistoryIndex, historyBrushSourceIndex, setHistoryBrushSourceIndex,
    workspaceRef, imgRef, workspaceZoom, setZoom,
    marqueeStart, setMarqueeStart, marqueeCurrent, setMarqueeCurrent,
    gradientStart, setGradientStart, gradientCurrent, setGradientCurrent,
    setIsGenerateOpen, setIsGenerativeFillOpen, isPreviewingOriginal, setIsPreviewingOriginal,
    systemFonts, customFonts, addCustomFont, removeCustomFont, onOpenFontManager,
    geminiApiKey, stabilityApiKey, dismissToast,
    currentEditState, updateCurrentState, resetAllEdits,
    setImage, setDimensions, setFileInfo, setExifData, setLayers,
    initialEditState, initialLayerState,
    setIsFullscreen, setIsSettingsOpen, handleReorder, isMobile,
    handleCopy, handleLayerDelete, onBrushCommit, handleZoomIn, handleZoomOut, handleFitScreen,
    onCropChange: onCropChangeLogic, onCropComplete: onCropCompleteLogic, handleProjectSettingsUpdate,
  } = state;

  // --- Derived State ---
  const hasImage = !!image;
  const base64Image = image; // Simplified for now, should be rasterized image
  const historyImageSrc = (history[historyBrushSourceIndex]?.layers.find(l => l.id === 'background') as Layer | undefined)?.dataUrl || null;

  // --- Utility Functions ---
  const clearSelectionState = useCallback(() => {
    setSelectionPath(null); 
    setSelectionMaskDataUrl(null); 
    setMarqueeStart(null); 
    setMarqueeCurrent(null); 
  }, [setSelectionPath, setSelectionMaskDataUrl, setMarqueeStart, setMarqueeCurrent]);

  const getPointOnImage = useCallback((e: React.MouseEvent<HTMLDivElement> | MouseEvent): Point | null => {
    if (!workspaceRef.current || !dimensions) return null;
    const rect = workspaceRef.current.getBoundingClientRect();
    
    // Calculate the center of the image container within the workspace
    const imageContainer = workspaceRef.current.querySelector('.relative.shadow-2xl');
    if (!imageContainer) return null;
    const imgRect = imageContainer.getBoundingClientRect();
    
    // Calculate coordinates relative to the top-left of the image container
    const xRelative = e.clientX - imgRect.left;
    const yRelative = e.clientY - imgRect.top;

    // Scale coordinates back to natural image pixels
    const scaleX = dimensions.width / imgRect.width;
    const scaleY = dimensions.height / imgRect.height;

    const x = Math.round(xRelative * scaleX);
    const y = Math.round(yRelative * scaleY);

    // Clamp to image bounds
    return {
      x: Math.max(0, Math.min(dimensions.width, x)),
      y: Math.max(0, Math.min(dimensions.height, y)),
    };
  }, [workspaceRef, dimensions]);

  // --- Sub-Hooks ---
  const { transforms, onTransformChange, rotation, onRotationChange, onRotationCommit, applyPreset: applyTransformPreset } = useTransform(currentEditState, updateCurrentState, recordHistory, layers);
  const { crop, onCropChange, onCropComplete, onAspectChange, aspect, applyPreset: applyCropPreset } = useCrop(currentEditState, updateCurrentState, recordHistory, layers);
  const { frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, applyPreset: applyFramePreset } = useFrame({ currentEditState, updateCurrentState, recordHistory, layers });
  const { handleExportClick } = useExport({ layers, dimensions, currentEditState, imgRef, base64Image, stabilityApiKey });
  const { adjustments, onAdjustmentChange, onAdjustmentCommit, selectedFilter, onFilterChange, applyPreset: applyAdjustmentsPreset } = useAdjustments(currentEditState, updateCurrentState, recordHistory, layers);
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

  const {
    toggleLayerVisibility, renameLayer, deleteLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents,
    updateLayer, commitLayerChange, onLayerPropertyCommit: handleLayerPropertyCommit,
    handleLayerOpacityChange, handleLayerOpacityCommit,
    addTextLayer, addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection,
    addShapeLayer, addGradientLayer, onAddAdjustmentLayer, groupLayers, toggleGroupExpanded,
    onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onDeleteHiddenLayers, onArrangeLayer,
    hasActiveSelection, onApplySelectionAsMask, handleDestructiveOperation,
    handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd,
  } = useLayers({
    layers, setLayers, recordHistory, currentEditState, dimensions, 
    foregroundColor, backgroundColor, gradientToolState, selectedShapeType,
    selectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl,
    clearSelectionState, setImage, setFileInfo, setSelectedLayerId, selectedLayerId,
  });

  const { handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate } = useImageLoader(
    setImage, setDimensions, setFileInfo, setExifData, setLayers, resetAllEdits, recordHistory, setCurrentEditState, initialEditState, initialLayerState, setSelectedLayerId, clearSelectionState
  );

  const { handleGenerativeFill, handleGenerateImage } = useGenerativeAi(
    geminiApiKey, image, dimensions, setImage, setDimensions, setFileInfo, layers, addDrawingLayer, updateLayer, commitLayerChange, clearSelectionState, setIsGenerateOpen, setIsGenerativeFillOpen
  );

  // --- Global Actions ---

  const handleCopy = useCallback(() => {
    if (!base64Image) {
      showError("No image loaded to copy.");
      return;
    }
    copyImageToClipboard(base64Image);
    showSuccess("Image copied to clipboard (stub).");
  }, [base64Image]);

  const handleSwapColors = useCallback(() => {
    setForegroundColor(backgroundColor);
    setBackgroundColor(foregroundColor);
  }, [foregroundColor, backgroundColor, setForegroundColor, setBackgroundColor]);

  const handleLayerDelete = useCallback(() => {
    if (selectedLayerId) {
      deleteLayer(selectedLayerId);
    } else if (selectionMaskDataUrl) {
      clearSelectionState();
      showSuccess("Selection deselected.");
    }
  }, [selectedLayerId, deleteLayer, selectionMaskDataUrl, clearSelectionState]);

  // --- Workspace Interaction Logic ---

  const isSelectionTool = activeTool?.startsWith('marquee') || activeTool?.startsWith('lasso') || activeTool === 'quickSelect' || activeTool === 'magicWand' || activeTool === 'objectSelect';
  const isMarqueeTool = activeTool?.startsWith('marquee');
  const isLassoTool = activeTool?.startsWith('lasso');
  const isBrushTool = activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'pencil' || activeTool === 'cloneStamp' || activeTool === 'patternStamp' || activeTool === 'historyBrush' || activeTool === 'artHistoryBrush' || activeTool === 'selectionBrush' || activeTool === 'blurBrush' || activeTool === 'sharpenTool';
  const isGradientTool = activeTool === 'gradient';
  const isMoveTool = activeTool === 'move';
  const isCropTool = activeTool === 'crop';
  const isEyedropperTool = activeTool === 'eyedropper';

  const handleWorkspaceMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dimensions) return;
    const point = getPointOnImage(e);
    if (!point) return;

    // 1. Handle Selection Tools (Marquee, Lasso, Magic Wand, Object Select)
    if (isSelectionTool) {
      // Clear existing path selection if starting a new one
      if (selectionSettings.selectionMode === 'new') {
        clearSelectionState();
      }
      
      if (isMarqueeTool) {
        setMarqueeStart(point);
        setMarqueeCurrent(point);
      } else if (isLassoTool && activeTool === 'lassoPoly') {
        // Polygonal lasso handles its own points via SelectionCanvas, 
        // but we need to ensure the canvas is active.
        if (!selectionPath || selectionPath.length === 0) {
          setSelectionPath([point]);
        } else {
          // Add point to existing path
          setSelectionPath(prev => prev ? [...prev, point] : [point]);
        }
      } else if (activeTool === 'magicWand') {
        // Magic Wand/Flood Fill (single click operation)
        floodFillToMaskDataUrl(point, dimensions, selectionSettings.tolerance)
          .then(setSelectionMaskDataUrl)
          .catch(() => showError("Failed to create magic wand selection."));
      } else if (activeTool === 'objectSelect') {
        // Object Select (single click operation)
        objectSelectToMaskDataUrl(dimensions)
          .then(setSelectionMaskDataUrl)
          .catch(() => showError("Failed to create object selection."));
      }
    } 
    // 2. Handle Gradient Tool
    else if (isGradientTool) {
      setGradientStart(point);
      setGradientCurrent(point);
    }
    // 3. Handle Eyedropper
    else if (isEyedropperTool) {
      // Stub: In a real app, we'd sample the pixel color here.
      const sampledColor = foregroundColor; // Use current foreground color as stub result
      setForegroundColor(sampledColor);
      showSuccess(`Color sampled: ${sampledColor} (Stub)`);
    }
    // 4. Handle Move Tool (Layer selection/drag handled by Layer components)
    else if (isMoveTool) {
      // Layer selection logic is handled by the layer components' onMouseDown
    }
    // 5. Handle Brush Tools (Drawing handled by LiveBrushCanvas)
    else if (isBrushTool) {
      // Drawing starts on LiveBrushCanvas's onMouseDown
    }
    // 6. Handle Crop Tool
    else if (isCropTool) {
      // Crop handles its own interaction via ReactCrop component
    }
    
    // Deselect layer if clicking outside a layer and not using a tool that requires interaction
    if (!isSelectionTool && !isBrushTool && !isGradientTool && !isMoveTool && !isCropTool && !isEyedropperTool) {
      setSelectedLayerId(null);
    }
  }, [dimensions, activeTool, getPointOnImage, isSelectionTool, isMarqueeTool, isLassoTool, isGradientTool, isEyedropperTool, isMoveTool, isBrushTool, isCropTool, selectionSettings.selectionMode, selectionPath, setSelectionPath, setMarqueeStart, setMarqueeCurrent, setGradientStart, setGradientCurrent, clearSelectionState, setSelectionMaskDataUrl, selectionSettings.tolerance, foregroundColor, setForegroundColor, setSelectedLayerId]);

  const handleWorkspaceMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dimensions) return;
    const point = getPointOnImage(e);
    if (!point) return;

    if (isMarqueeTool && marqueeStart) {
      setMarqueeCurrent(point);
    } else if (isGradientTool && gradientStart) {
      setGradientCurrent(point);
    }
    // Lasso tools handle live point tracking internally in SelectionCanvas
    // Brush tools handle live drawing internally in LiveBrushCanvas
  }, [dimensions, getPointOnImage, isMarqueeTool, marqueeStart, setMarqueeCurrent, isGradientTool, gradientStart, setGradientCurrent]);

  const handleWorkspaceMouseUp = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dimensions) return;
    const point = getPointOnImage(e);
    if (!point) return;

    if (isMarqueeTool && marqueeStart && marqueeCurrent) {
      // Finalize Marquee selection
      const maskPromise = activeTool === 'marqueeRect'
        ? rectToMaskDataUrl(marqueeStart, marqueeCurrent, dimensions.width, dimensions.height)
        : ellipseToMaskDataUrl(marqueeStart, marqueeCurrent, dimensions.width, dimensions.height);
      
      const maskDataUrl = await maskPromise;
      setSelectionMaskDataUrl(maskDataUrl);
      setMarqueeStart(null);
      setMarqueeCurrent(null);
      showSuccess("Marquee selection finalized.");
    } else if (isGradientTool && gradientStart && gradientCurrent) {
      // Finalize Gradient operation (create a new gradient layer)
      const newLayerId = addGradientLayer();
      
      // Calculate gradient properties based on the drawn line (stubbed for simplicity)
      const dx = gradientCurrent.x - gradientStart.x;
      const dy = gradientCurrent.y - gradientStart.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90; // 0deg is top-to-bottom
      
      updateLayer(newLayerId, {
        gradientType: gradientToolState.type as 'linear' | 'radial',
        gradientColors: gradientToolState.colors,
        gradientStops: gradientToolState.stops,
        gradientAngle: angle,
        gradientFeather: gradientToolState.feather,
        gradientInverted: gradientToolState.inverted,
        // For radial, use the center of the line as center, and length as radius
        gradientCenterX: (gradientStart.x + gradientCurrent.x) / 2 / dimensions.width * 100,
        gradientCenterY: (gradientStart.y + gradientCurrent.y) / 2 / dimensions.height * 100,
        gradientRadius: Math.sqrt(dx * dx + dy * dy) / 2 / Math.min(dimensions.width, dimensions.height) * 100,
        name: `${gradientToolState.type} Gradient`,
      });
      commitLayerChange(newLayerId, `Apply Gradient Layer`);
      
      setGradientStart(null);
      setGradientCurrent(null);
      setActiveTool(null);
    }
  }, [dimensions, activeTool, isMarqueeTool, marqueeStart, marqueeCurrent, isGradientTool, gradientStart, gradientCurrent, getPointOnImage, setSelectionMaskDataUrl, setMarqueeStart, setMarqueeCurrent, addGradientLayer, gradientToolState, updateLayer, commitLayerChange, setActiveTool]);

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

  // --- Return all necessary state and handlers ---
  return {
    // Core State
    image, dimensions, fileInfo, exifData, layers, selectedLayerId, selectedLayer,
    activeTool, setActiveTool, brushState, setBrushState, gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType, selectionPath, setSelectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl,
    selectiveBlurAmount, setSelectiveBlurAmount, selectiveSharpenAmount, setSelectiveSharpenAmount,
    customHslColor, setCustomHslColor, selectionSettings, onSelectionSettingChange: (key: keyof typeof selectionSettings, value: any) => setSelectionSettings(prev => ({ ...prev, [key]: value })), onSelectionSettingCommit: (key: keyof typeof selectionSettings, value: any) => recordHistory(`Set Selection Setting ${key}`, { ...currentEditState, selectionSettings: { ...currentEditState.selectionSettings, [key]: value } }, layers),
    channels, onChannelChange: onChannelChangeHook,
    
    // History
    history, currentHistoryIndex, recordHistory, undo, redo, canUndo, canRedo,
    setCurrentHistoryIndex, historyBrushSourceIndex, setHistoryBrushSourceIndex,
    
    // Layer Management
    toggleLayerVisibility, renameLayer, deleteLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents,
    updateLayer, commitLayerChange, onLayerPropertyCommit: handleLayerPropertyCommit,
    handleLayerOpacityChange, handleLayerOpacityCommit,
    addTextLayer: (coords: Point, color: string) => addTextLayer(coords, color),
    addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection,
    addShapeLayer: (coords: Point, shapeType?: ShapeType, initialWidth?: number, initialHeight?: number, fillColor?: string, strokeColor?: string) => addShapeLayer(coords, shapeType, initialWidth, initialHeight, fillColor, strokeColor),
    addGradientLayer: () => addGradientLayer(),
    onAddAdjustmentLayer: (type: 'brightness' | 'curves' | 'hsl' | 'grading') => onAddAdjustmentLayer(type),
    groupLayers: (layerIds: string[]) => groupLayers(layerIds),
    toggleGroupExpanded: (id: string) => toggleGroupExpanded(id),
    onRemoveLayerMask: (id: string) => onRemoveLayerMask(id),
    onInvertLayerMask: (id: string) => onInvertLayerMask(id),
    onToggleClippingMask: (id: string) => onToggleClippingMask(id),
    onToggleLayerLock: (id: string) => onToggleLayerLock(id),
    onDeleteHiddenLayers: () => onDeleteHiddenLayers(),
    onArrangeLayer: (direction: 'front' | 'back' | 'forward' | 'backward') => onArrangeLayer(direction),
    hasActiveSelection: !!selectionMaskDataUrl, onApplySelectionAsMask, handleDestructiveOperation,
    handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd,
    
    // Effects/Transform
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
        if (preset.layers) setLayers(preset.layers);
        recordHistory(`Applied Preset: ${preset.name}`, currentEditState, layers);
    }, handleSavePreset: (name: string) => saveGlobalPreset(name, currentEditState, layers), onDeletePreset: deleteGlobalPreset,
    gradientPresets, onSaveGradientPreset: saveGradientPreset, onDeleteGradientPreset: deleteGradientPreset,
    
    // Workspace Interaction
    workspaceZoom, handleZoomIn, handleZoomOut, handleFitScreen,
    handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp, handleWheel,
    
    // AI/Export/Project Management
    geminiApiKey, handleExportClick, handleNewProject, handleLoadProject, handleImageLoad,
    handleGenerativeFill, handleGenerateImage, handleSwapColors,
    
    // Panel Management
    panelLayout: state.panelLayout, reorderPanelTabs: (activeId: string, overId: string, newLocation: 'right' | 'bottom') => console.log('reorder stub'), activeRightTab: state.activeRightTab, setActiveRightTab: state.setActiveRightTab, activeBottomTab: state.activeBottomTab, setActiveBottomTab: state.setActiveBottomTab,
    
    // Internal State
    marqueeStart, marqueeCurrent, gradientStart, gradientCurrent, cloneSourcePoint,
    
    // Misc
    workspaceRef, imgRef,
    setIsFullscreen, setIsSettingsOpen,
    currentEditState, updateCurrentState,
    base64Image, historyImageSrc,
    isPreviewingOriginal, setIsPreviewingOriginal,
    clearSelectionState,
    setSelectedLayerId,
    isMobile,
  };
};