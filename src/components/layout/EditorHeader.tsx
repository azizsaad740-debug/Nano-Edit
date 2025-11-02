import React, { useCallback } from "react";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import Header from "./Header";
import { MenuBar } from "./MenuBar"; // Fix 184
import { TooltipProvider } from "@/components/ui/tooltip";
import type { PanelTab } from "@/types/editor/core";
import { showError } from "@/utils/toast";

interface EditorHeaderProps {
  logic: ReturnType<typeof useEditorLogic>;
  setIsNewProjectOpen: (open: boolean) => void;
  setIsExportOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsImportOpen: (open: boolean) => void;
  setIsGenerateOpen: (open: boolean) => void;
  setIsGenerativeFillOpen: (open: boolean) => void;
  setIsProjectSettingsOpen: (open: boolean) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  panelLayout: PanelTab[];
  togglePanelVisibility: (id: string) => void;
  activeRightTab: string;
  setActiveRightTab: (tab: string) => void;
  activeBottomTab: string;
  setActiveBottomTab: (tab: string) => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({ // Fix 68, 185
  logic,
  setIsNewProjectOpen,
  setIsExportOpen,
  setIsSettingsOpen,
  setIsImportOpen,
  setIsGenerateOpen,
  setIsGenerativeFillOpen,
  setIsProjectSettingsOpen,
  isFullscreen,
  onToggleFullscreen,
  panelLayout,
  togglePanelVisibility,
  activeRightTab,
  setActiveRightTab,
  activeBottomTab,
  setActiveBottomTab,
}) => {
  // Destructuring logic results
  const {
    image, dimensions, fileInfo, exifData, layers, selectedLayerId, selectedLayer,
    activeTool, setActiveTool, brushState, setBrushState, gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType, selectionPath, setSelectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl,
    selectiveBlurAmount, setSelectiveBlurAmount, selectiveSharpenAmount, setSelectiveSharpenAmount,
    customHslColor, setCustomHslColor, selectionSettings, onSelectionSettingChange, onSelectionSettingCommit,
    channels, onChannelChange,
    history, currentHistoryIndex, recordHistory, undo, redo, canUndo, canRedo,
    setCurrentHistoryIndex, historyBrushSourceIndex, setHistoryBrushSourceIndex,
    toggleLayerVisibility, renameLayer, deleteLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents,
    updateLayer, commitLayerChange, onLayerPropertyCommit,
    handleLayerOpacityChange, handleLayerOpacityCommit,
    addTextLayer, addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection,
    addShapeLayer, addGradientLayer, onAddAdjustmentLayer,
    groupLayers, toggleGroupExpanded,
    onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onDeleteHiddenLayers, onArrangeLayer,
    hasActiveSelection, onApplySelectionAsMask, handleDestructiveOperation,
    effects, onEffectChange, onEffectCommit, onFilterChange, selectedFilter,
    onTransformChange, rotation, onRotationChange, onRotationCommit, onAspectChange, aspect,
    frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit,
    adjustments, onAdjustmentChange, onAdjustmentCommit, grading, onGradingChange, onGradingCommit,
    hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, curves, onCurvesChange, onCurvesCommit,
    presets, handleApplyPreset, handleSavePreset, onDeletePreset,
    gradientPresets, onSaveGradientPreset, onDeleteGradientPreset,
    workspaceZoom, handleZoomIn, handleZoomOut, handleFitScreen,
    geminiApiKey, handleExportClick, handleNewProject, handleLoadProject, handleImageLoad,
    handleGenerativeFill, handleGenerateImage, handleSwapColors, handleLayerDelete,
    workspaceRef, imgRef,
    currentEditState, updateCurrentState, resetAllEdits,
    base64Image, historyImageSrc,
    isPreviewingOriginal, setIsPreviewingOriginal,
    handleProjectSettingsUpdate,
    onBrushCommit,
    
    // Missing properties added here:
    setSelectionSettings, setCloneSourcePoint, setZoom, setMarqueeStart, setMarqueeCurrent,
    onOpenFontManager,
    stabilityApiKey, dismissToast,
    setImage, setDimensions, setFileInfo, setExifData, setLayers,
    initialEditState, initialLayerState,
    handleCopy,
    clearSelectionState,
    panelLayout: logicPanelLayout, // Rename to avoid conflict with prop
    reorderPanelTabs,
  } = logic;

  // Wrapper for handleLoadProject to match expected signature
  const handleOpenProjectWrapper = useCallback(() => {
    document.getElementById('file-upload-input')?.click();
  }, []);
  
  const handleDownloadClick = useCallback(() => {
    setIsExportOpen(true);
  }, [setIsExportOpen]);
  
  const handleGenerativeFillWrapper = useCallback(() => {
    setIsGenerativeFillOpen(true);
  }, [setIsGenerativeFillOpen]);
  
  const handleGenerateImageWrapper = useCallback(() => {
    setIsGenerateOpen(true);
  }, [setIsGenerateOpen]);
  
  const handleNewProjectClickWrapper = useCallback(() => {
    setIsNewProjectOpen(true);
  }, [setIsNewProjectOpen]);
  
  const handleSaveProjectWrapper = useCallback(() => {
    showError("Project saving is a stub.");
  }, []);
  
  const handleNewFromClipboardWrapper = useCallback(() => {
    logic.handleNewFromClipboard(false);
  }, [logic]);

  // Keyboard shortcuts hook (Fix 69)
  useKeyboardShortcuts({
    activeTool, setActiveTool,
    onUndo: undo,
    onRedo: redo,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onFitScreen: handleFitScreen,
    onSwapColors: handleSwapColors,
    onDeselect: clearSelectionState,
    onDelete: handleLayerDelete,
    onCopy: handleCopy,
    onTransformChange: onTransformChange as any, // Casting to fix TS2322
    onDownloadClick: handleDownloadClick,
    onGenerativeFill: handleGenerativeFillWrapper,
    onNewProjectClick: handleNewProjectClickWrapper,
    onOpenProject: handleOpenProjectWrapper,
    onSaveProject: handleSaveProjectWrapper,
  });

  return (
    <Header // Fix 70
      onReset={resetAllEdits}
      onDownloadClick={handleDownloadClick}
      onCopy={handleCopy}
      hasImage={!!image}
      onTogglePreview={setIsPreviewingOriginal}
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      setOpenSettings={setIsSettingsOpen}
      setOpenImport={setIsImportOpen}
      onGenerateClick={handleGenerateImageWrapper}
      onNewProjectClick={handleNewProjectClickWrapper}
      onNewFromClipboard={handleNewFromClipboardWrapper}
      onSaveProject={handleSaveProjectWrapper}
      onOpenProject={handleOpenProjectWrapper}
      onToggleFullscreen={onToggleFullscreen}
      isFullscreen={isFullscreen}
      onSyncProject={() => showError("Sync to Cloud is a stub.")}
      setOpenProjectSettings={setIsProjectSettingsOpen}
      panelLayout={logicPanelLayout}
      togglePanelVisibility={togglePanelVisibility}
      activeRightTab={activeRightTab}
      setActiveRightTab={setActiveRightTab}
      activeBottomTab={activeBottomTab}
      setActiveBottomTab={setActiveBottomTab}
    >
      <MenuBar // Fix 71
        logic={logic}
        setIsNewProjectOpen={setIsNewProjectOpen}
        setIsExportOpen={setIsExportOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        setIsImportOpen={setIsImportOpen}
        setIsGenerateOpen={setIsGenerateOpen}
        setIsGenerativeFillOpen={setIsGenerativeFillOpen}
        setIsProjectSettingsOpen={setIsProjectSettingsOpen}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        panelLayout={logicPanelLayout}
        togglePanelVisibility={togglePanelVisibility}
        activeRightTab={activeRightTab}
        setActiveRightTab={setActiveRightTab}
        activeBottomTab={activeBottomTab}
        setActiveBottomTab={setActiveBottomTab}
      />
    </Header>
  );
};