import React, { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Workspace } from "@/components/editor/Workspace";
import Header from "@/components/layout/Header";
import { ToolsPanel } from "@/components/layout/ToolsPanel";
import { WorkspaceControls } from "@/components/editor/WorkspaceControls";
import { LiveBrushCanvas } from "@/components/editor/LiveBrushCanvas";
import { SelectionCanvas } from "@/components/editor/SelectionCanvas";
import { SelectionMaskOverlay } from "@/components/editor/SelectionMaskOverlay";
import { GradientPreviewCanvas } from "@/components/editor/GradientPreviewCanvas";
import { NewProjectDialog } from "@/components/editor/NewProjectDialog";
import { ExportOptions } from "@/components/editor/ExportOptions";
import { SettingsDialog } from "@/components/layout/SettingsDialog";
import { ImportPresetsDialog } from "@/components/editor/ImportPresetsDialog";
import { GenerateImageDialog } from "@/components/editor/GenerateImageDialog";
import { GenerativeDialog } from "@/components/editor/GenerativeDialog";
import { SmartObjectEditor } from "@/components/editor/SmartObjectEditor";
import { ProjectSettingsDialog } from "@/components/editor/ProjectSettingsDialog";
import { CustomFontLoader } from "@/components/editor/CustomFontLoader";

// Only import necessary hooks once
import { useEditorState } from "@/hooks/useEditorState";
import { usePresets, type Preset } from "@/hooks/usePresets";
import { useGradientPresets } from "@/hooks/useGradientPresets";
import { useFontManager } from "@/hooks/useFontManager";
import { useSettings } from "@/hooks/useSettings";
import { useLayers } from "@/hooks/useLayers";
import { useImageLoader } from "@/hooks/useImageLoader";
import { useWorkspaceInteraction } from "@/hooks/useWorkspaceInteraction";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSelection } from "@/hooks/useSelection";
import { useBrush } from "@/hooks/useBrush";
import { useGradientTool } from "@/hooks/useGradientTool";
import { useSmartObjectEditor } from "@/hooks/useSmartObjectEditor";
import { useProjectSettings } from "@/hooks/useProjectSettings";
import { useExport } from "@/hooks/useExport";
import { useHistory } from "@/hooks/useHistory";
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
import { useEyedropper } from "@/hooks/useEyedropper";
import { useShapeTool } from "@/hooks/useShapeTool";
import { useTextTool } from "@/hooks/useTextTool";
import { useMoveTool } from "@/hooks/useMoveTool";
import { useLassoTool } from "@/hooks/useLassoTool";
import { useDrawingTool } from "@/hooks/useDrawingTool";

import { useHotkeys } from "react-hotkeys-hook";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "@/integrations/supabase/session-provider";
import { useNavigate } from "react-router-dom";
import {
  initialEditState,
  initialBrushState,
  initialGradientToolState,
  initialLayerState,
  initialHistoryItem,
  type Layer,
  type EditState,
  type ActiveTool,
  type Point,
  type BrushState,
  type GradientToolState,
  type NewProjectSettings,
} from "@/types/editor";
import {
  showSuccess,
  showError,
  showLoading,
  dismissToast,
} from "@/utils/toast";
import {
  getEditedImageCanvas,
  copyImageToClipboard,
  downloadImage,
  rasterizeEditedImageWithMask,
} from "@/utils/imageUtils";
import { loadProjectFromFile } from "@/utils/projectUtils";
import { polygonToMaskDataUrl } from "@/utils/maskUtils";
import { cn } from "@/lib/utils";
import { RotateCw } from "lucide-react";
import { useLayerTransform } from "@/hooks/useLayerTransform";
import { TextLayer } from "@/components/editor/TextLayer";
import { DrawingLayer } from "@/components/editor/DrawingLayer";
import { SmartObjectLayer } from "@/components/editor/SmartObjectLayer";
import VectorShapeLayer from "@/components/editor/VectorShapeLayer";
import GradientLayer from "@/components/editor/GradientLayer";
import GroupLayer from "@/components/editor/GroupLayer";
import { AdjustmentLayer } from "@/components/editor/AdjustmentLayer";
import { ChannelFilter } from "@/components/editor/ChannelFilter";
import { CurvesFilter } from "@/components/editor/CurvesFilter";
import { EffectsFilters } from "@/components/editor/EffectsFilters";
import { HslFilter } from "@/components/editor/HslFilter";
import { SelectiveBlurFilter } from "@/components/editor/SelectiveBlurFilter";
import { getFilterString } from "@/utils/filterUtils";


// --- Main Component Definition ---

export const Index = () => {
  const { user, isGuest } = useSession();
  const navigate = useNavigate();

  // --- Core State Management ---
  const {
    image,
    setImage,
    dimensions,
    setDimensions,
    fileInfo,
    setFileInfo,
    exifData,
    setExifData,
    currentEditState,
    setCurrentEditState,
    updateCurrentState,
    resetAllEdits,
    history,
    currentHistoryIndex,
    recordHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    layers,
    setLayers,
    selectedLayerId,
    setSelectedLayerId,
    activeTool,
    setActiveTool,
    brushState,
    setBrushState,
    gradientToolState,
    setGradientToolState,
    foregroundColor,
    setForegroundColor,
    backgroundColor,
    setBackgroundColor,
    selectedShapeType,
    setSelectedShapeType,
    selectionPath,
    setSelectionPath,
    selectionMaskDataUrl,
    setSelectionMaskDataUrl,
    clearSelectionState,
    selectiveBlurAmount,
    setSelectiveBlurAmount,
    customHslColor,
    setCustomHslColor,
    zoom, setZoom, // Export zoom state from useEditorState
  } = useEditorState();

  const hasImage = !!image;
  const imgRef = useRef<HTMLImageElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPreviewingOriginal, setIsPreviewingOriginal] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isGenerativeFillOpen, setIsGenerativeFillOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);

  // --- Hooks Integration ---
  const { presets, savePreset, deletePreset } = usePresets();
  const { gradientPresets, saveGradientPreset, deleteGradientPreset } = useGradientPresets();
  const { systemFonts, customFonts, addCustomFont, removeCustomFont, setSystemFonts } = useFontManager();
  const { geminiApiKey, stabilityApiKey, saveApiKey } = useSettings();

  // --- Brush Setter Wrapper (Fixes Errors 7, 13, 15) ---
  const setBrushStatePartial = useCallback((updates: Partial<Omit<BrushState, 'color'>>) => {
    setBrushState(prev => ({ ...prev, ...updates }));
  }, [setBrushState]);

  // Layer Management Hooks (Consolidated)
  const {
    updateLayer,
    commitLayerChange,
    handleLayerPropertyCommit,
    handleLayerOpacityChange,
    handleLayerOpacityCommit,
    reorderLayers,
    createSmartObject,
    openSmartObjectEditor,
    closeSmartObjectEditor,
    saveSmartObjectChanges,
    isSmartObjectEditorOpen,
    smartObjectEditingId,
    moveSelectedLayer,
    groupLayers,
    toggleGroupExpanded,
    removeLayerMask,
    invertLayerMask,
    toggleClippingMask,
    toggleLayerLock,
    renameLayer: renameLayerAction,
    deleteLayer: deleteLayerAction,
    handleDeleteHiddenLayers,
    duplicateLayer: duplicateLayerAction,
    mergeLayerDown: mergeLayerDownAction,
    rasterizeLayer: rasterizeLayerAction,
    handleRasterizeSmartObject,
    handleConvertSmartObjectToLayers,
    handleExportSmartObjectContents,
    handleArrangeLayer,
    handleAddTextLayer,
    handleAddDrawingLayer,
    handleAddLayerFromBackground,
    handleLayerFromSelection,
    handleAddShapeLayer,
    handleAddGradientLayer,
    addAdjustmentLayer,
    deleteLayer,
    duplicateLayer,
    mergeLayerDown,
    rasterizeLayer,
    handleToggleVisibility,
    applySelectionAsMask,
    handleDrawingStrokeEnd,
  } = useLayers({
    currentEditState,
    recordHistory,
    updateCurrentState,
    imgRef,
    imageNaturalDimensions: dimensions,
    gradientToolState,
    activeTool,
    layers,
    setLayers: (newLayersOrUpdater, historyName) => {
      setLayers(newLayersOrUpdater);
      if (historyName && Array.isArray(newLayersOrUpdater)) { // Fix Error 5
        recordHistory(historyName, currentEditState, newLayersOrUpdater);
      }
    },
    selectedLayerId,
    setSelectedLayerId,
    history,
    currentHistoryIndex,
    foregroundColor,
    backgroundColor,
    selectedShapeType,
    selectionMaskDataUrl,
    clearSelectionState,
    selectiveBlurAmount,
    setSelectiveBlurAmount,
    customHslColor,
    setCustomHslColor,
  });

  // --- Individual Adjustment Hooks (for Global Adjustments Panel) ---
  const { adjustments, onAdjustmentChange, onAdjustmentCommit, applyPreset: applyAdjustmentsPreset } = useAdjustments(currentEditState, updateCurrentState, recordHistory, layers);
  const { effects, onEffectChange, onEffectCommit, applyPreset: applyEffectsPreset } = useEffects(currentEditState, updateCurrentState, recordHistory, layers);
  const { grading, onGradingChange, onGradingCommit, applyPreset: applyGradingPreset } = useColorGrading(currentEditState, updateCurrentState, recordHistory, layers);
  const { hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, applyPreset: applyHslPreset } = useHslAdjustments(currentEditState, updateCurrentState, recordHistory, layers);
  const { curves, onCurvesChange, onCurvesCommit, applyPreset: applyCurvesPreset } = useCurves(currentEditState, updateCurrentState, recordHistory, layers);
  const { selectedFilter, onFilterChange, applyPreset: applyFilterPreset } = useAdjustments(currentEditState, updateCurrentState, recordHistory, layers); // Reusing useAdjustments for filter
  const { transforms, onTransformChange, rotation, onRotationChange, onRotationCommit, applyPreset: applyTransformPreset } = useTransform(currentEditState, updateCurrentState, recordHistory, layers);
  const { crop, onCropChange, onCropComplete, onAspectChange, aspect, applyPreset: applyCropPreset } = useCrop(currentEditState, updateCurrentState, recordHistory, layers);
  const { frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, applyPreset: applyFramePreset } = useFrame(currentEditState, updateCurrentState, recordHistory, layers);
  const { channels, onChannelChange, applyPreset: applyChannelsPreset } = useChannels(currentEditState, updateCurrentState, recordHistory, layers);
  const { selectiveBlurMask, handleSelectiveBlurStrokeEnd, applyPreset: applySelectiveBlurPreset } = useSelectiveBlur(currentEditState, updateCurrentState, recordHistory, layers, dimensions);

  // --- Tool Hooks ---
  const { handleBrushToolChange } = useBrush(setActiveTool, setBrushStatePartial, brushState, foregroundColor);
  const { handleGradientToolChange } = useGradientTool(setActiveTool, setGradientToolState, gradientToolState);
  const { handleShapeToolChange } = useShapeTool(setActiveTool, setSelectedShapeType, selectedShapeType);
  const { handleTextToolChange } = useTextTool(setActiveTool);
  const { handleMoveToolChange } = useMoveTool(setActiveTool);
  const { handleLassoToolChange } = useLassoTool(setActiveTool);
  const { handleDrawingToolChange } = useDrawingTool(setActiveTool);
  const { handleEyedropperToolChange } = useEyedropper(setActiveTool, setForegroundColor);

  // --- Generative AI Hooks ---
  const { handleGenerateImage, handleGenerativeFill } = useGenerativeAi(
    geminiApiKey,
    image,
    dimensions,
    setImage,
    setDimensions,
    setFileInfo,
    layers,
    handleAddDrawingLayer,
    updateLayer,
    commitLayerChange,
    clearSelectionState,
    setIsGenerateOpen,
    setIsGenerativeFillOpen
  );

  // --- Image Loading and Project Management ---
  const { handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate } = useImageLoader(
    setImage,
    setDimensions,
    setFileInfo,
    setExifData,
    setLayers,
    resetAllEdits,
    recordHistory,
    setCurrentEditState,
    initialEditState,
    initialLayerState,
    initialHistoryItem,
    setSelectedLayerId,
    clearSelectionState
  );

  const { handleExport } = useExport(
    imgRef,
    layers,
    currentEditState,
    stabilityApiKey,
    dimensions,
    fileInfo
  );

  const { handleProjectSettingsUpdate } = useProjectSettings(
    currentEditState,
    updateCurrentState,
    recordHistory,
    layers,
    dimensions,
    setDimensions
  );

  // --- Workspace Interaction ---
  const {
    zoom: workspaceZoom, // Renamed to avoid shadowing/initialization error
    setZoom: setWorkspaceZoom, // Renamed for clarity
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
    zoom, // Use zoom from useEditorState (global state)
    setZoom // Use setZoom from useEditorState (global setter)
  );

  // --- Global Preset Application ---
  const handleApplyPreset = useCallback((preset: Preset) => {
    const { state } = preset;
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
    
    // Apply layer state if present (stub for complex layer presets)
    if (state.layers) {
      setLayers(state.layers);
    }

    recordHistory(`Apply Preset: ${preset.name}`, currentEditState, layers);
    showSuccess(`Preset "${preset.name}" applied.`);
  }, [
    applyAdjustmentsPreset, applyEffectsPreset, applyGradingPreset, applyHslPreset, applyCurvesPreset, applyFilterPreset,
    applyTransformPreset, applyCropPreset, applyFramePreset, applyChannelsPreset, applySelectiveBlurPreset,
    recordHistory, currentEditState, layers, setLayers
  ]);

  // --- Keyboard Shortcuts ---
  useKeyboardShortcuts({
    activeTool,
    setActiveTool,
    onUndo: undo,
    onRedo: redo,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onFitScreen: handleFitScreen,
    onDownloadClick: () => setIsExportOpen(true),
    onCopy: () => copyImageToClipboard({ image: imgRef.current!, layers, ...currentEditState }),
    onTransformChange: onTransformChange,
    onSwapColors: () => {
      const temp = foregroundColor;
      setForegroundColor(backgroundColor);
      setBackgroundColor(temp);
    },
    onNewProjectClick: () => setIsNewProjectOpen(true),
    onOpenProject: () => document.getElementById('file-upload-input')?.click(),
    onSaveProject: () => {
      // Stub: Save project logic here
      showError("Project saving is a stub.");
    },
    onGenerativeFill: () => setIsGenerativeFillOpen(true),
    onDelete: () => selectedLayerId && deleteLayer(selectedLayerId),
    onDeselect: clearSelectionState,
  });

  // --- Render Layer Logic ---
  const renderLayer = (layer: Layer): JSX.Element | null => {
    const isSelected = layer.id === selectedLayerId;
    const parentDimensions = dimensions;

    const layerProps = {
      key: layer.id,
      layer,
      containerRef: workspaceRef,
      onUpdate: updateLayer,
      onCommit: commitLayerChange,
      isSelected,
      activeTool,
      zoom: workspaceZoom, // Use workspaceZoom for rendering
    };

    if (!layer.visible) return null;

    if (layer.type === 'image') {
      // Background image is handled separately in the main workspace
      return null;
    }
    if (layer.type === 'text') {
      return <TextLayer {...layerProps} />;
    }
    if (layer.type === 'drawing') {
      return <DrawingLayer {...layerProps} />;
    }
    if (layer.type === 'smart-object') {
      return <SmartObjectLayer {...layerProps} parentDimensions={parentDimensions} />;
    }
    if (layer.type === 'vector-shape') {
      return <VectorShapeLayer {...layerProps} />;
    }
    if (layer.type === 'gradient') {
      return <GradientLayer {...layerProps} imageNaturalDimensions={parentDimensions} />;
    }
    if (layer.type === 'group') {
      return <GroupLayer
        {...layerProps}
        parentDimensions={parentDimensions}
        renderChildren={renderLayer}
        globalSelectedLayerId={selectedLayerId}
      />;
    }
    if (layer.type === 'adjustment') {
      return <AdjustmentLayer {...layerProps} />;
    }
    return null;
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <div className="flex flex-col h-screen w-screen bg-background">
      <CustomFontLoader customFonts={customFonts} />
      <Header
        onReset={resetAllEdits}
        onDownloadClick={() => setIsExportOpen(true)}
        onCopy={() => copyImageToClipboard({ image: imgRef.current!, layers, ...currentEditState })}
        hasImage={hasImage}
        onTogglePreview={setIsPreviewingOriginal}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        setOpenSettings={setIsSettingsOpen}
        setOpenImport={setIsImportOpen}
        onGenerateClick={() => setIsGenerateOpen(true)}
        onNewProjectClick={() => setIsNewProjectOpen(true)}
        onNewFromClipboard={() => showError("New from clipboard is a stub.")}
        onSaveProject={() => showError("Project saving is a stub.")}
        onOpenProject={() => document.getElementById('file-upload-input')?.click()}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        isFullscreen={isFullscreen}
        onSyncProject={() => showError("Cloud sync is a stub.")}
        setOpenProjectSettings={setIsProjectSettingsOpen}
      >
        {/* Header Center Content (e.g., Project Name) */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold truncate max-w-xs">
            {fileInfo?.name || "Untitled Project"}
          </h1>
          <span className="text-sm text-muted-foreground">
            {dimensions ? `(${dimensions.width}x${dimensions.height})` : ''}
          </span>
        </div>
      </Header>

      <main className={cn("flex flex-1 min-h-0", isFullscreen ? 'absolute inset-0 z-50' : 'relative')}>
        {/* Left Sidebar (Tools Panel) */}
        <ToolsPanel
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          selectedShapeType={selectedShapeType}
          setSelectedShapeType={setSelectedShapeType}
          foregroundColor={foregroundColor}
          onForegroundColorChange={setForegroundColor}
          backgroundColor={backgroundColor}
          onBackgroundColorChange={setBackgroundColor}
          onSwapColors={() => {
            const temp = foregroundColor;
            setForegroundColor(backgroundColor);
            setBackgroundColor(temp);
          }}
          brushState={brushState}
          setBrushState={setBrushStatePartial}
          selectiveBlurStrength={selectiveBlurAmount}
          onSelectiveBlurStrengthChange={setSelectiveBlurAmount}
          onSelectiveBlurStrengthCommit={() => recordHistory("Change Selective Blur Strength", currentEditState, layers)}
        />

        {/* Main Workspace Area */}
        <div className="flex-1 relative bg-muted/50 overflow-hidden">
          <Workspace
            workspaceRef={workspaceRef}
            handleWorkspaceMouseDown={handleWorkspaceMouseDown}
            handleWorkspaceMouseMove={handleWorkspaceMouseMove}
            handleWorkspaceMouseUp={handleWorkspaceMouseUp}
            handleWheel={handleWheel}
            setIsMouseOverImage={setIsMouseOverImage}
          >
            {hasImage && dimensions && (
              <div
                className="absolute top-1/2 left-1/2 transform origin-top-left transition-transform duration-100 ease-out shadow-2xl border border-border bg-background"
                style={{
                  width: dimensions.width,
                  height: dimensions.height,
                  transform: `translate(-50%, -50%) scale(${workspaceZoom})`, // Use workspaceZoom
                  cursor: isMouseOverImage ? 'crosshair' : 'default',
                }}
              >
                {/* SVG Filters for Global Adjustments */}
                <ChannelFilter channels={channels} />
                <CurvesFilter curves={curves} />
                <EffectsFilters effects={currentEditState.effects} />
                <HslFilter hslAdjustments={hslAdjustments} />
                {currentEditState.selectiveBlurMask && (
                  <SelectiveBlurFilter
                    maskDataUrl={currentEditState.selectiveBlurMask}
                    blurAmount={currentEditState.selectiveBlurAmount}
                    imageNaturalDimensions={dimensions}
                  />
                )}

                {/* Main Image Container */}
                <div
                  className="relative w-full h-full overflow-hidden"
                  style={{
                    filter: isPreviewingOriginal ? 'none' : `${currentEditState.selectedFilter} ${currentEditState.colorMode === 'Grayscale' ? 'grayscale(1)' : ''} ${currentEditState.colorMode === 'CMYK' ? 'invert(1) hue-rotate(180deg) sepia(0.1) saturate(1.1)' : ''} url(#curves-filter) url(#advanced-effects-filter) url(#hsl-filter) url(#selective-blur-filter) ${currentEditState.effects.vignette > 0 ? '' : ''}`,
                    transform: `rotateZ(${transforms.rotation}deg) scaleX(${transforms.scaleX}) scaleY(${transforms.scaleY})`,
                    transformOrigin: 'center center',
                  }}
                >
                  {/* Background Image Layer */}
                  {layers.find(l => l.id === 'background')?.visible && (
                    <img
                      ref={imgRef}
                      src={image}
                      alt={fileInfo?.name || "Image"}
                      className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
                      style={{
                        clipPath: crop ? `polygon(${crop.x}% ${crop.y}%, ${crop.x + crop.width}% ${crop.y}%, ${crop.x + crop.width}% ${crop.y + crop.height}%, ${crop.x}% ${crop.y + crop.height}%)` : 'none',
                        transform: `scaleX(${transforms.scaleX}) scaleY(${transforms.scaleY})`,
                        transformOrigin: 'center center',
                        filter: layers.some(l => l.type === 'adjustment') ? 'none' : getFilterString(currentEditState),
                        mixBlendMode: layers.find(l => l.id === 'background')?.blendMode as any || 'normal',
                        opacity: (layers.find(l => l.id === 'background')?.opacity ?? 100) / 100,
                      }}
                    />
                  )}

                  {/* Render all other layers (excluding background) */}
                  {layers.slice(1).map(renderLayer)}

                  {/* Live Brush/Eraser/Selection Canvas */}
                  {(activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'selectionBrush' || activeTool === 'blurBrush') && (
                    <LiveBrushCanvas
                      brushState={brushState}
                      imageRef={imgRef}
                      onDrawEnd={handleDrawingStrokeEnd}
                      activeTool={activeTool}
                      selectedLayerId={selectedLayerId}
                      onAddDrawingLayer={handleAddDrawingLayer}
                      layers={layers}
                      isSelectionBrush={activeTool === 'selectionBrush'}
                      onSelectionBrushStrokeEnd={(dataUrl, operation) => {
                        if (operation === 'add') {
                          setSelectionMaskDataUrl(dataUrl);
                        } else {
                          // Stub: Subtracting from mask requires complex canvas logic
                          showError("Subtracting from selection mask is a stub.");
                        }
                      }}
                      onSelectiveBlurStrokeEnd={(dataUrl, operation) => {
                        if (operation === 'add') {
                          updateCurrentState({ selectiveBlurMask: dataUrl });
                        } else {
                          // Stub: Subtracting from blur mask requires complex canvas logic
                          showError("Removing blur area is a stub.");
                        }
                      }}
                      foregroundColor={foregroundColor}
                      backgroundColor={backgroundColor}
                    />
                  )}

                  {/* Live Lasso Selection Canvas */}
                  {activeTool === 'lasso' && (
                    <SelectionCanvas
                      imageRef={imgRef}
                      onSelectionComplete={async (path) => {
                        setSelectionPath(path);
                        if (path.length > 1 && dimensions) {
                          const maskUrl = await polygonToMaskDataUrl(path, dimensions.width, dimensions.height);
                          setSelectionMaskDataUrl(maskUrl);
                        } else {
                          clearSelectionState();
                        }
                      }}
                      selectionPath={selectionPath}
                    />
                  )}

                  {/* Live Gradient Preview Canvas */}
                  {activeTool === 'gradient' && gradientStart && gradientCurrent && (
                    <GradientPreviewCanvas
                      start={gradientStart}
                      current={gradientCurrent}
                      gradientToolState={gradientToolState}
                      containerRect={workspaceRef.current!.getBoundingClientRect()}
                      imageNaturalDimensions={dimensions}
                    />
                  )}

                  {/* Selection Mask Overlay (for visual feedback) */}
                  {selectionMaskDataUrl && (activeTool === 'selectionBrush' || activeTool === 'lasso') && (
                    <SelectionMaskOverlay
                      maskDataUrl={selectionMaskDataUrl}
                      imageNaturalDimensions={dimensions}
                      overlayColor={foregroundColor}
                    />
                  )}
                </div>

                {/* Workspace Controls (Zoom/Fit) */}
                <WorkspaceControls
                  zoom={workspaceZoom} // Use workspaceZoom
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onFitScreen={handleFitScreen}
                />
              </div>
            )}
            {!hasImage && (
              <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                <p>Click "File" &gt; "Open Image/Project" to start.</p>
              </div>
            )}
          </Workspace>
        </div>

        {/* Right Sidebar (Layers, Properties, Adjustments) */}
        <aside className="w-80 shrink-0 border-l bg-sidebar">
          <Sidebar
            hasImage={hasImage}
            activeTool={activeTool}
            selectedLayerId={selectedLayerId}
            selectedLayer={selectedLayer}
            layers={layers}
            imgRef={imgRef}
            onSelectLayer={(id, ctrlKey, shiftKey) => {
              if (activeTool === 'eyedropper') return;
              setSelectedLayerId(id);
            }}
            onReorder={reorderLayers}
            toggleLayerVisibility={handleToggleVisibility}
            renameLayer={renameLayerAction}
            deleteLayer={deleteLayerAction}
            onDuplicateLayer={() => selectedLayerId && duplicateLayer(selectedLayerId)}
            onMergeLayerDown={() => selectedLayerId && mergeLayerDown(selectedLayerId)}
            onRasterizeLayer={() => selectedLayerId && rasterizeLayer(selectedLayerId)}
            onCreateSmartObject={createSmartObject}
            onOpenSmartObject={openSmartObjectEditor}
            onLayerUpdate={updateLayer}
            onLayerCommit={commitLayerChange}
            onLayerPropertyCommit={handleLayerPropertyCommit}
            onLayerOpacityChange={handleLayerOpacityChange}
            onLayerOpacityCommit={handleLayerOpacityCommit}
            addTextLayer={() => handleAddTextLayer({ x: 50, y: 50 }, foregroundColor)}
            addDrawingLayer={handleAddDrawingLayer}
            onAddLayerFromBackground={handleAddLayerFromBackground}
            onLayerFromSelection={handleLayerFromSelection}
            addShapeLayer={(coords, shapeType, initialWidth, initialHeight) => handleAddShapeLayer(coords, shapeType, initialWidth, initialHeight, foregroundColor, backgroundColor)}
            addGradientLayer={handleAddGradientLayer}
            onAddAdjustmentLayer={addAdjustmentLayer}
            selectedShapeType={selectedShapeType}
            groupLayers={groupLayers}
            toggleGroupExpanded={toggleGroupExpanded}
            onRemoveLayerMask={removeLayerMask}
            onInvertLayerMask={invertLayerMask}
            onToggleClippingMask={toggleClippingMask}
            onToggleLayerLock={toggleLayerLock}
            onDeleteHiddenLayers={handleDeleteHiddenLayers}
            onRasterizeSmartObject={() => smartObjectEditingId && handleRasterizeSmartObject(smartObjectEditingId)}
            onConvertSmartObjectToLayers={() => smartObjectEditingId && handleConvertSmartObjectToLayers(smartObjectEditingId)}
            onExportSmartObjectContents={() => smartObjectEditingId && handleExportSmartObjectContents(smartObjectEditingId)}
            onArrangeLayer={handleArrangeLayer}
            hasActiveSelection={!!selectionMaskDataUrl}
            onApplySelectionAsMask={applySelectionAsMask}
            // Global Adjustments Props
            adjustments={adjustments}
            onAdjustmentChange={onAdjustmentChange}
            onAdjustmentCommit={onAdjustmentCommit}
            effects={effects}
            onEffectChange={onEffectChange}
            onEffectCommit={onEffectCommit}
            grading={grading}
            onGradingChange={onGradingChange}
            onGradingCommit={onGradingCommit}
            hslAdjustments={hslAdjustments}
            onHslAdjustmentChange={onHslAdjustmentChange}
            onHslAdjustmentCommit={onHslAdjustmentCommit}
            curves={curves}
            onCurvesChange={onCurvesChange}
            onCurvesCommit={onCurvesCommit}
            onFilterChange={onFilterChange}
            selectedFilter={currentEditState.selectedFilter}
            onTransformChange={onTransformChange}
            rotation={rotation}
            onRotationChange={onRotationChange}
            onRotationCommit={onRotationCommit}
            onAspectChange={onAspectChange}
            aspect={aspect}
            frame={frame}
            onFramePresetChange={onFramePresetChange}
            onFramePropertyChange={onFramePropertyChange}
            onFramePropertyCommit={onFramePropertyCommit}
            // Presets
            presets={presets}
            onApplyPreset={handleApplyPreset}
            onSavePreset={(name) => savePreset(name, currentEditState)}
            onDeletePreset={deletePreset}
            // Gradient Presets
            gradientToolState={gradientToolState}
            setGradientToolState={setGradientToolState}
            gradientPresets={gradientPresets}
            onSaveGradientPreset={saveGradientPreset}
            onDeleteGradientPreset={deleteGradientPreset}
            // History Props
            history={history}
            currentHistoryIndex={currentHistoryIndex}
            onHistoryJump={(index) => {
              undo(history.length - 1 - index); // Calculate steps to jump
            }}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            // Color Props
            foregroundColor={foregroundColor}
            onForegroundColorChange={setForegroundColor}
            backgroundColor={backgroundColor}
            onBackgroundColorChange={setBackgroundColor}
            onSwapColors={() => {
              const temp = foregroundColor;
              setForegroundColor(backgroundColor);
              setBackgroundColor(temp);
            }}
            // Info Props
            dimensions={dimensions}
            fileInfo={fileInfo}
            exifData={exifData}
            colorMode={currentEditState.colorMode}
            // Navigator Props
            zoom={workspaceZoom} // Use workspaceZoom
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitScreen={handleFitScreen}
            // Channels Props
            channels={channels}
            onChannelChange={onChannelChange}
            // Brushes Props
            brushState={brushState}
            setBrushState={setBrushStatePartial}
            // Selective Blur
            selectiveBlurAmount={selectiveBlurAmount}
            onSelectiveBlurAmountChange={setSelectiveBlurAmount}
            onSelectiveBlurAmountCommit={() => recordHistory("Change Selective Blur Strength", currentEditState, layers)}
            // Font Manager
            systemFonts={systemFonts}
            customFonts={customFonts}
            onOpenFontManager={() => setIsImportOpen(true)}
            // HSL Custom Color
            customHslColor={customHslColor}
            setCustomHslColor={setCustomHslColor}
          />
        </aside>
      </main>

      {/* Hidden File Input for Loading */}
      <input
        type="file"
        id="file-upload-input"
        className="hidden"
        accept="image/*,.nanoedit"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            if (file.name.endsWith('.nanoedit')) {
              handleLoadProject(file);
            } else {
              handleImageLoad(file);
            }
          }
          e.target.value = ''; // Clear input
        }}
      />

      {/* Dialogs */}
      <NewProjectDialog
        open={isNewProjectOpen}
        onOpenChange={setIsNewProjectOpen}
        onNewProject={handleNewProject}
      />
      <ExportOptions
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        onExport={handleExport}
        dimensions={dimensions}
      />
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
      <ImportPresetsDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
      />
      <GenerateImageDialog
        open={isGenerateOpen}
        onOpenChange={setIsGenerateOpen}
        onGenerate={handleGenerateImage}
        apiKey={geminiApiKey}
        imageNaturalDimensions={dimensions}
      />
      <GenerativeDialog
        open={isGenerativeFillOpen}
        onOpenChange={setIsGenerativeFillOpen}
        onApply={handleGenerativeFill}
        apiKey={geminiApiKey}
        originalImage={image}
        selectionPath={selectionPath}
        selectionMaskDataUrl={selectionMaskDataUrl}
        imageNaturalDimensions={dimensions}
      />
      <ProjectSettingsDialog
        open={isProjectSettingsOpen}
        onOpenChange={setIsProjectSettingsOpen}
        currentDimensions={dimensions}
        currentColorMode={currentEditState.colorMode}
        onUpdateSettings={handleProjectSettingsUpdate}
      />
    </div>
  );
};