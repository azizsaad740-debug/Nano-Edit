import React, { useState } from "react";
import Header from "./Header";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { loadProjectFromFile } from "@/utils/projectUtils";
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
}) => {
  const {
    hasImage, fileInfo, dimensions,
    resetAllEdits, undo, redo, canUndo, canRedo,
    handleCopy, handleSwapColors, handleLayerDelete,
    handleGenerateImage, handleGenerativeFill,
    handleImageLoad, handleLoadProject,
    activeTool, setActiveTool,
    onTransformChange,
    geminiApiKey,
    currentEditState,
    layers,
    handleZoomIn, handleZoomOut, handleFitScreen,
    clearSelectionState,
    setIsPreviewingOriginal,
    // ADDED: Brush commit function
    onBrushCommit,
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
      onToggleFullscreen={onToggleFullscreen}
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
  );
};