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
import { useSelectiveRetouch } from './useSelectiveRetouch';
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
import { initialEditState, initialLayerState, initialHistoryItem, initialCurvesState, Point, Layer, isImageOrDrawingLayer } from '@/types/editor';
import { useGradientPresets } from './useGradientPresets';
import LeftSidebar from '@/components/layout/LeftSidebar';
import { Layers, Settings, Brush, PenTool, History, Palette, SlidersHorizontal, Zap, Info, Compass, LayoutGrid, SquareStack } from "lucide-react";
import { PanelTab, PanelLocation } from '@/types/editor/core';
import { ellipseToMaskDataUrl, polygonToMaskDataUrl } from '@/utils/maskUtils';

// Initial Panel Layout Definition
const initialPanelLayout: PanelTab[] = [
  // Right Sidebar Defaults
  { id: 'layers', name: 'Layers', icon: Layers, location: 'right', visible: true, order: 0 },
  { id: 'properties', name: 'Properties', icon: Settings, location: 'right', visible: true, order: 1 },
  { id: 'brushes', name: 'Brushes', icon: Brush, location: 'right', visible: true, order: 2 },
  { id: 'paths', name: 'Paths', icon: PenTool, location: 'right', visible: true, order: 3 },
  { id: 'history', name: 'History', icon: History, location: 'right', visible: true, order: 4 },
  { id: 'channels', name: 'Channels', icon: SquareStack, location: 'right', visible: true, order: 5 },
  // Bottom Panel Defaults
  { id: 'color', name: 'Color Palette', icon: Palette, location: 'bottom', visible: true, order: 0 },
  { id: 'correction', name: 'Color Correction', icon: SlidersHorizontal, location: 'bottom', visible: true, order: 1 },
  { id: 'ai-xtra', name: 'Xtra AI', icon: Zap, location: 'bottom', visible: true, order: 2 },
  { id: 'info', name: 'Info', icon: Info, location: 'bottom', visible: true, order: 3 },
  { id: 'navigator', name: 'Navigator', icon: Compass, location: 'bottom', visible: true, order: 4 },
  { id: 'templates', name: 'Templates', icon: LayoutGrid, location: 'bottom', visible: true, order: 5 },
];

const PANEL_LAYOUT_STORAGE_KEY = 'nanoedit-panel-layout';

export const useEditorLogic = () => {
  const state = useEditorState();
  
  // Initialize panelLayout from local storage or default
  const [panelLayout, setPanelLayout] = useState<PanelTab[]>(() => {
    if (typeof window !== 'undefined') {
      const storedLayout = localStorage.getItem(PANEL_LAYOUT_STORAGE_KEY);
      if (storedLayout) {
        try {
          const parsedLayout: PanelTab[] = JSON.parse(storedLayout);
          
          // Merge stored settings with defaults to ensure new tabs are included
          const layoutMap = new Map(parsedLayout.map(t => [t.id, t]));
          
          const mergedLayout = initialPanelLayout.map(defaultTab => {
            const storedTab = layoutMap.get(defaultTab.id);
            if (storedTab) {
              // Merge stored properties, prioritizing stored location/visibility/order
              return { ...defaultTab, ...storedTab };
            }
            return defaultTab;
          });
          
          // Sort by order to maintain consistency after merging
          return mergedLayout.sort((a, b) => a.order - b.order);
        } catch (e) {
          console.error("Failed to parse stored panel layout, using default.", e);
        }
      }
    }
    return initialPanelLayout;
  });

  // Persist panelLayout whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(PANEL_LAYOUT_STORAGE_KEY, JSON.stringify(panelLayout));
    } catch (e) {
      console.error("Failed to save panel layout to local storage.", e);
    }
  }, [panelLayout]);


  // Logic to update layout
  const updatePanelLayout = useCallback((updates: Partial<PanelTab> & { id: string }) => {
      setPanelLayout(prev => prev.map(tab => tab.id === updates.id ? { ...tab, ...updates } : tab));
  }, []);

  const togglePanelVisibility = useCallback((id: string) => {
      setPanelLayout(prev => prev.map(tab => {
          if (tab.id === id) {
              const newVisible = !tab.visible;
              let newLocation: PanelLocation = tab.location;
              
              if (newVisible) {
                  // If becoming visible, restore to last known location or default
                  if (tab.location === 'hidden') {
                      const initial = initialPanelLayout.find(i => i.id === id);
                      newLocation = initial?.location === 'right' ? 'right' : 'bottom';
                  }
              } else {
                  // If hiding, set location to 'hidden'
                  newLocation = 'hidden';
              }
              return { ...tab, visible: newVisible, location: newLocation };
          }
          return tab;
      }));
  }, []);

  const reorderPanelTabs = useCallback((activeId: string, overId: string, newLocation: PanelLocation) => {
      setPanelLayout(prev => {
          const activeTab = prev.find(t => t.id === activeId);
          if (!activeTab) return prev;

          // 1. Move the active tab to the new location and ensure it's visible
          const updatedActiveTab = { ...activeTab, location: newLocation, visible: true };

          // 2. Filter out the active tab from its old location/order
          const filtered = prev.filter(t => t.id !== activeId);

          // 3. Find the index of the 'over' tab within the target location
          const targetContainer = filtered.filter(t => t.location === newLocation).sort((a, b) => a.order - b.order);
          const overIndex = targetContainer.findIndex(t => t.id === overId);

          // 4. Insert the updated active tab into the target container
          const newContainer = [...targetContainer];
          if (overIndex === -1) {
              newContainer.push(updatedActiveTab); // Add to end if overId not found (e.g., empty container)
          } else {
              // Insert before the overId index
              newContainer.splice(overIndex, 0, updatedActiveTab);
          }

          // 5. Re-index the entire layout based on the new container order
          const finalLayout = prev.map(t => {
              const indexInNewContainer = newContainer.findIndex(nt => nt.id === t.id);
              if (indexInNewContainer !== -1) {
                  return { ...t, order: indexInNewContainer, location: newLocation, visible: true };
              }
              // Ensure tabs not in the new container keep their old location/order
              return t;
          });
          
          // 6. Re-sort the entire list by location and then by order
          return finalLayout.sort((a, b) => {
              if (a.location === b.location) return a.order - b.order;
              // Keep location groups stable (right, bottom, hidden)
              if (a.location === 'right' && b.location !== 'right') return -1;
              if (b.location === 'right' && a.location !== 'right') return 1;
              if (a.location === 'bottom' && b.location === 'hidden') return -1;
              if (b.location === 'bottom' && a.location === 'hidden') return 1;
              return 0;
          });
      });
  }, []);


  const {
    image, dimensions, fileInfo, layers, recordHistory,
    undo, redo, canUndo, canRedo,
    activeTool, setActiveTool, brushState, setBrushState, gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType, selectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl,
    selectiveBlurAmount, setSelectiveBlurAmount, // FIX 1, 2
    selectiveSharpenAmount, setSelectiveSharpenAmount, // FIX 3, 4
    customHslColor, setCustomHslColor, selectionSettings, setSelectionSettings,
    currentEditState, updateCurrentState,
    cloneSourcePoint,
    marqueeStart, marqueeCurrent,
    setSelectedLayerId, clearSelectionState,
    historyBrushSourceIndex, setHistoryBrushSourceIndex,
    workspaceRef, imgRef, zoom, setZoom, setMarqueeStart, setMarqueeCurrent,
    history, currentHistoryIndex, // DESTRUCTURED HISTORY STATE
    setSelectionPath, // ADDED
    ...rest
  } = state;

  // --- Derived State ---
  const base64Image = useMemo(() => {
    const backgroundLayer = layers.find(l => l.id === 'background');
    if (backgroundLayer && isImageOrDrawingLayer(backgroundLayer)) {
      return backgroundLayer.dataUrl || null;
    }
    return null;
  }, [layers]);
  
  const historyImageSrc = useMemo(() => {
    const isHistoryToolActive = activeTool === 'historyBrush' || activeTool === 'artHistoryBrush';
    if (!isHistoryToolActive || historyBrushSourceIndex === undefined || historyBrushSourceIndex >= history.length) {
      return null;
    }
    
    const historyItem = history[historyBrushSourceIndex];
    const backgroundLayer = historyItem.layers.find(l => l.id === 'background');
    
    // STUB: Return the background layer's data URL from the selected history state.
    if (backgroundLayer && isImageOrDrawingLayer(backgroundLayer)) {
      return backgroundLayer.dataUrl || null;
    }
    return null;
  }, [activeTool, history, historyBrushSourceIndex]);


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
    groupLayers, toggleGroupExpanded, handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd, // EXPOSED
    handleLayerDelete, reorderLayers, onSelectLayer: onSelectLayerFromLayers,
    removeLayerMask, invertLayerMask, toggleClippingMask, toggleLayerLock, handleDeleteHiddenLayers,
    handleRasterizeSmartObject, handleConvertSmartObjectToLayers, handleExportSmartObjectContents, handleArrangeLayer,
    applySelectionAsMask, handleDestructiveOperation, // EXPOSED
    onBrushCommit, // EXPOSED
    handleGradientSelectionComplete, // EXPOSED
  } = useLayers({
    layers, setLayers: state.setLayers, selectedLayerId: state.selectedLayerId, setSelectedLayerId: state.setSelectedLayerId, dimensions,
    recordHistory, currentEditState, foregroundColor, backgroundColor,
    selectedShapeType, selectionMaskDataUrl, setSelectionMaskDataUrl: state.setSelectionMaskDataUrl, clearSelectionState: state.clearSelectionState,
    brushState, activeTool,
    onBrushCommit: () => recordHistory("Update Brush Settings", currentEditState, layers), // Pass commit function
    history, // PASSED
    currentHistoryIndex, // PASSED
    historyBrushSourceIndex, // PASSED
    imgRef: state.imgRef, // <--- PASSING imgRef
    gradientToolState: state.gradientToolState, // <--- PASSING gradientToolState
  });

  const { handleGenerateImage, handleGenerativeFill } = useGenerativeAi(
    state.geminiApiKey, image, dimensions, state.setImage, state.setDimensions, state.setFileInfo, layers,
    handleAddDrawingLayer, updateLayer, commitLayerChange, state.clearSelectionState, rest.setIsGenerateOpen, rest.setIsGenerativeFillOpen
  );

  // --- New Handlers for AI Results ---
  
  const handleImageResult = useCallback((resultUrl: string, historyName: string) => {
    if (!dimensions) return;
    
    // 1. Update the background layer's data URL
    const backgroundLayer = layers.find(l => l.id === 'background');
    if (backgroundLayer) {
      updateLayer('background', { dataUrl: resultUrl, type: 'drawing' }); // Treat as drawing layer after modification
      commitLayerChange('background');
    } else {
      // If no background layer exists (e.g., new project), create one
      const newBackground: Layer = {
        id: 'background',
        name: 'Background',
        type: 'drawing',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        dataUrl: resultUrl,
        isLocked: true,
        x: 50, y: 50, width: 100, height: 100, rotation: 0,
        scaleX: 1, scaleY: 1,
      } as Layer;
      state.setLayers([newBackground, ...layers.filter(l => l.id !== 'background')]);
    }
    
    // 2. Record history
    recordHistory(historyName, currentEditState, layers);
  }, [dimensions, layers, updateLayer, commitLayerChange, state.setLayers, recordHistory, currentEditState]);

  const handleMaskResult = useCallback((maskDataUrl: string, historyName: string) => {
    // Set the new mask as the active selection
    state.setSelectionMaskDataUrl(maskDataUrl);
    state.setSelectionPath(null);
    recordHistory(historyName, currentEditState, layers);
  }, [state.setSelectionMaskDataUrl, state.setSelectionPath, recordHistory, currentEditState, layers]);

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
  const { selectiveBlurMask, selectiveSharpenMask, handleSelectiveRetouchStrokeEnd, applyPreset: applySelectiveRetouchPreset } = useSelectiveRetouch(
    currentEditState, updateCurrentState, recordHistory, layers, dimensions
  );
  const onSelectiveSharpenAmountChange = useCallback((value: number) => {
    setSelectiveSharpenAmount(value);
    updateCurrentState({ selectiveSharpenAmount: value }); // Update EditState for live preview
  }, [setSelectiveSharpenAmount, updateCurrentState]);
  const onSelectiveSharpenAmountCommit = useCallback((value: number) => {
    recordHistory(`Set Selective Sharpen Strength to ${value}`, currentEditState, layers);
  }, [currentEditState, layers, recordHistory]);
  const onSelectiveBlurAmountChange = useCallback((value: number) => {
    setSelectiveBlurAmount(value);
    updateCurrentState({ selectiveBlurAmount: value }); // Update EditState for live preview
  }, [setSelectiveBlurAmount, updateCurrentState]);
  const onSelectiveBlurAmountCommit = useCallback((value: number) => {
    recordHistory(`Set Selective Blur Strength to ${value}`, currentEditState, layers);
  }, [currentEditState, layers, recordHistory]);
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
    applySelectiveRetouchPreset(preset.state);
    applyChannelsPreset(preset.state);
    recordHistory(`Applied Preset: ${preset.name}`, currentEditState, layers);
    showSuccess(`Preset "${preset.name}" applied.`);
  }, [currentEditState, layers, recordHistory, applyAdjustmentsPreset, applyEffectsPreset, applyGradingPreset, applyHslPreset, applyCurvesPreset, applyTransformPreset, applyCropPreset, applyFramePreset, applySelectiveRetouchPreset, applyChannelsPreset]);
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
  
  // --- Marquee Selection Logic Implementation ---
  const handleMarqueeSelectionComplete = useCallback(async (start: Point, end: Point) => {
    if (!dimensions || !workspaceRef.current || !imgRef.current) return;

    const imageRect = imgRef.current.getBoundingClientRect();
    
    // Calculate coordinates relative to the image (in pixels)
    const scaleX = dimensions.width / imageRect.width;
    const scaleY = dimensions.height / imageRect.height;

    // Convert screen coordinates (start/end) to image pixel coordinates
    const startX_px = Math.round((start.x - imageRect.left) * scaleX);
    const startY_px = Math.round((start.y - imageRect.top) * scaleY);
    const endX_px = Math.round((end.x - imageRect.left) * scaleX);
    const endY_px = Math.round((end.y - imageRect.top) * scaleY);

    const minX = Math.max(0, Math.min(startX_px, endX_px));
    const minY = Math.max(0, Math.min(startY_px, endY_px));
    const maxX = Math.min(dimensions.width, Math.max(startX_px, endX_px));
    const maxY = Math.min(dimensions.height, Math.max(startY_px, endY_px));

    let maskUrl: string;
    let historyName: string;

    if (activeTool === 'marqueeEllipse') {
      maskUrl = await ellipseToMaskDataUrl(
        { x: minX, y: minY },
        { x: maxX, y: maxY },
        dimensions.width,
        dimensions.height
      );
      historyName = "Elliptical Marquee Selection Applied";
    } else { // Default to Rectangular Marquee
      const rectPath: Point[] = [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
      ];
      maskUrl = await polygonToMaskDataUrl(rectPath, dimensions.width, dimensions.height);
      historyName = "Rectangular Marquee Selection Applied";
    }

    try {
      setSelectionMaskDataUrl(maskUrl);
      setSelectionPath(null); 
      recordHistory(historyName, currentEditState, layers);
      showSuccess("Selection created.");
    } catch (error) {
      showError("Failed to create selection mask.");
      console.error(error);
    }
  }, [dimensions, workspaceRef, imgRef, activeTool, setSelectionMaskDataUrl, setSelectionPath, recordHistory, currentEditState, layers]);
  // --- End Marquee Selection Logic ---

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
    handleMarqueeSelectionComplete,
    currentEditState, state.setCloneSourcePoint,
    // NEW:
    handleAddTextLayer,
    foregroundColor,
    // ADDED:
    setForegroundColor,
    setActiveTool,
    handleGradientSelectionComplete, // <--- NEW PROP PASS
  );
  const hasActiveSelection = !!selectionMaskDataUrl || !!selectionPath;
  return {
    ...state,
    // Core State
    hasImage: !!image,
    selectedLayer: layers.find(l => l.id === state.selectedLayerId),
    // History
    undo, redo, canUndo, canRedo,
    historyBrushSourceIndex, setHistoryBrushSourceIndex,
    // Layer Management (from useLayers)
    smartObjectEditingId, openSmartObjectEditor, closeSmartObjectEditor, saveSmartObjectChanges,
    updateLayer, commitLayerChange, handleLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit,
    handleToggleVisibility, renameLayer, deleteLayer, duplicateLayer, mergeLayerDown, rasterizeLayer, createSmartObject,
    handleAddTextLayer, handleAddDrawingLayer, handleAddLayerFromBackground, handleLayerFromSelection, handleAddShapeLayer, handleAddGradientLayer: () => handleAddGradientLayer(), // Keep original simple add function
    addAdjustmentLayer,
    groupLayers, toggleGroupExpanded, handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd, // EXPOSED
    handleLayerDelete, reorderLayers, onSelectLayer: onSelectLayerFromLayers,
    removeLayerMask, invertLayerMask, toggleClippingMask, toggleLayerLock, handleDeleteHiddenLayers,
    handleRasterizeSmartObject, handleConvertSmartObjectToLayers, handleExportSmartObjectContents, handleArrangeLayer,
    applySelectionAsMask, handleDestructiveOperation, // EXPOSED
    onBrushCommit, // EXPOSED
    handleGradientSelectionComplete, // EXPOSED
    // Adjustments
    adjustments, onAdjustmentChange, onAdjustmentCommit, effects, onEffectChange, onEffectCommit,
    grading, onGradingChange, onGradingCommit, hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit,
    curves, onCurvesChange, onCurvesCommit, selectedFilter, onFilterChange, channels, onChannelChange,
    transforms, onTransformChange, rotation, onRotationChange, onRotationCommit,
    crop: cropState, onCropChange, onCropComplete, onAspectChange, aspect, frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit,
    // Selective Retouching
    selectiveBlurAmount: currentEditState.selectiveBlurAmount, // Read from EditState for consistency
    selectiveSharpenAmount: currentEditState.selectiveSharpenAmount, // Read from EditState for consistency
    selectiveBlurMask: selectiveBlurMask,
    selectiveSharpenMask: selectiveSharpenMask,
    onSelectiveBlurAmountChange,
    onSelectiveSharpenAmountChange,
    onSelectiveBlurAmountCommit,
    onSelectiveSharpenAmountCommit,
    handleSelectiveRetouchStrokeEnd, // EXPOSED
    // Presets
    presets, handleApplyPreset, handleSavePreset, deletePreset,
    // Gradient Presets (from useEditorState)
    gradientPresets, saveGradientPreset, deleteGradientPreset,
    // Project & IO
    handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate, handleExport, handleCopy, handleProjectSettingsUpdate,
    // AI
    handleGenerateImage, handleGenerativeFill,
    // AI Results Handlers
    handleImageResult,
    handleMaskResult,
    base64Image, // EXPOSED
    historyImageSrc, // EXPOSED
    // Workspace
    workspaceZoom, handleWheel, handleFitScreen, handleZoomIn, handleZoomOut, isMouseOverImage, setIsMouseOverImage,
    gradientStart, gradientCurrent, handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp,
    hasActiveSelection,
    // Tools
    handleBrushToolChange, handleTextToolChange, handleShapeToolChange, handleGradientToolChange, handleEyedropperToolChange, handleMoveToolChange, handleLassoToolChange,
    handleSwapColors,
    ToolsPanel: LeftSidebar, // Use the imported component
    // Panel Layout
    panelLayout, // EXPOSED
    togglePanelVisibility, // EXPOSED
    reorderPanelTabs, // EXPOSED
  };
};