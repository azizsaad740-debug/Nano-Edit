import React from "react";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import Header from "./Header";
import { MenuBar } from "./MenuBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { PanelTab } from "@/types/editor/core";
import { showError } from "@/utils/toast"; // Import showError

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

export const EditorHeader: React.FC<EditorHeaderProps> = ({
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
    setSelectionSettings, setCloneSourcePoint, setZoom, setMarqueeStart, setMarqueeCurrent, // Fix 286, 287
    onOpenFontManager,
    stabilityApiKey, dismissToast,
    setImage, setDimensions, setFileInfo, setExifData, setLayers,
    initialEditState, initialLayerState,
    handleCopy,
    clearSelectionState,
  } = logic;

  // Wrapper for handleLoadProject to match expected signature (Fix 288, 290)
  const handleOpenProjectWrapper = useCallback(() => {
    // Trigger file input click, which calls handleFileLoad in Index.tsx
    document.getElementById('file-upload-input')?.click();
  }, []);

  // Keyboard shortcuts hook
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
    onOpenSettings: () => setIsSettingsOpen(true),
    onOpenGenerate: () => setIsGenerateOpen(true),
    onOpenGenerativeFill: () => setIsGenerativeFillOpen(true),
    onOpenProjectSettings: () => setIsProjectSettingsOpen(true),
    onExport: () => setIsExportOpen(true),
    onNewProject: () => setIsNewProjectOpen(true),
    onOpenProject: handleOpenProjectWrapper, // Use wrapper
    onSaveProject: () => showError("Project saving is a stub."),
    onReset: resetAllEdits,
  });

  return (
    <Header
      onNewProjectClick={() => setIsNewProjectOpen(true)}
      onOpenProject={handleOpenProjectWrapper} // Use wrapper
      onSaveProject={() => showError("Project saving is a stub.")} // Fix 289, 291
      onExportClick={() => setIsExportOpen(true)}
      onSettingsClick={() => setIsSettingsOpen(true)}
      onImportClick={() => setIsImportOpen(true)}
      onGenerateClick={() => setIsGenerateOpen(true)}
      onGenerativeFillClick={() => setIsGenerativeFillOpen(true)}
      onProjectSettingsClick={() => setIsProjectSettingsOpen(true)}
      onReset={resetAllEdits}
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      hasImage={!!image}
      onCopy={handleCopy}
      onToggleFullscreen={onToggleFullscreen}
      isFullscreen={isFullscreen}
      panelLayout={panelLayout}
      togglePanelVisibility={togglePanelVisibility}
      activeRightTab={activeRightTab}
      setActiveRightTab={setActiveRightTab}
      activeBottomTab={activeBottomTab}
      setActiveBottomTab={setActiveBottomTab}
    >
      <MenuBar
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
        panelLayout={panelLayout}
        togglePanelVisibility={togglePanelVisibility}
        activeRightTab={activeRightTab}
        setActiveRightTab={setActiveRightTab}
        activeBottomTab={activeBottomTab}
        setActiveBottomTab={setActiveBottomTab}
      />
    </Header>
  );
};