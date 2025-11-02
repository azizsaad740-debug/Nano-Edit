import React, { useState } from "react";
import Header from "./Header";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { loadProjectFromFile } from "@/utils/projectUtils";
import { showError } from "@/utils/toast";
import type { PanelTab } from "@/types/editor/core"; // Import PanelTab

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
  // ADDED Panel Management Props
  panelLayout: PanelTab[];
  togglePanelVisibility: (id: string) => void;
  activeRightTab: string;
  setActiveRightTab: (id: string) => void;
  activeBottomTab: string;
  setActiveBottomTab: (id: string) => void;
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
  // ADDED Panel Management Props
  panelLayout,
  togglePanelVisibility,
  activeRightTab,
  setActiveRightTab,
  activeBottomTab,
  setActiveBottomTab,
}) => {
  const {
    image, dimensions, fileInfo, exifData, layers, selectedLayerId, selectedLayer,
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
    setIsGenerateOpen: setIsGenerateOpenLogic, setIsGenerativeFillOpen: setIsGenerativeFillOpenLogic, isPreviewingOriginal, setIsPreviewingOriginal,
    systemFonts, customFonts, addCustomFont, removeCustomFont, onOpenFontManager,
    geminiApiKey, stabilityApiKey, dismissToast,
    currentEditState, updateCurrentState, resetAllEdits,
    setImage, setDimensions, setFileInfo, setExifData, setLayers,
    initialEditState, initialLayerState,
    setIsFullscreen: setIsFullscreenLogic, setIsSettingsOpen: setIsSettingsOpenLogic, handleReorder, isMobile,
    handleCopy, handleLayerDelete, onBrushCommit, handleZoomIn, handleZoomOut, handleFitScreen,
    onCropChange: onCropChangeLogic, onCropComplete: onCropCompleteLogic, handleProjectSettingsUpdate,
  } = logic;

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
    onCopy: handleCopy,
    onTransformChange: onTransformChange,
    onSwapColors: handleSwapColors,
    onNewProjectClick: () => setIsNewProjectOpen(true),
    onOpenProject: () => document.getElementById('file-upload-input')?.click(),
    onSaveProject: () => showError("Project saving is a stub."),
    onGenerativeFill: () => setIsGenerativeFillOpen(true),
    onDelete: handleLayerDelete,
    onDeselect: clearSelectionState,
  });

  return (
    <Header
      onReset={resetAllEdits}
      onDownloadClick={() => setIsExportOpen(true)}
      onCopy={handleCopy}
      hasImage={!!image} // FIXED: Use !!image
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
      onToggleFullscreen={onToggleFullscreen}
      isFullscreen={isFullscreen}
      onSyncProject={() => showError("Cloud sync is a stub.")}
      setOpenProjectSettings={setIsProjectSettingsOpen}
      // ADDED Panel Management Props
      panelLayout={panelLayout}
      togglePanelVisibility={togglePanelVisibility}
      activeRightTab={activeRightTab}
      setActiveRightTab={setActiveRightTab}
      activeBottomTab={activeBottomTab}
      setActiveBottomTab={setActiveBottomTab}
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
  );
};