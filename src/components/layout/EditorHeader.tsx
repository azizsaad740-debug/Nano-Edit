"use client";

import * as React from "react";
import { useEditorContext } from '@/context/EditorContext';
import Header from './Header';
import { MenuBar } from './MenuBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileHeader } from '../mobile/MobileHeader';
import { showError, showSuccess } from "@/utils/toast";

export const EditorHeader = () => {
  const editor = useEditorContext();
  const isMobile = useIsMobile();

  const {
    hasImage, undo, redo, canUndo, canRedo, handleCopy,
    setIsSettingsOpen, setIsImportOpen, setIsGenerateOpen,
    setIsNewProjectOpen, handleSaveProject, handleLoadProject,
    handleExportClick, onToggleFullscreen, isFullscreen,
    handleNewFromClipboard, currentEditState, panelLayout, togglePanelVisibility,
    activeRightTab, setActiveRightTab, activeBottomTab, setActiveBottomTab,
    setIsProjectSettingsOpen, resetAllEdits,
  } = editor;

  const onTogglePreview = React.useCallback((isPreviewing: boolean) => {
    editor.setIsPreviewingOriginal(isPreviewing);
  }, [editor]);

  const onSyncProject = React.useCallback(() => {
    showError("Cloud sync is a stub.");
  }, []);

  if (isMobile) {
    return (
      <MobileHeader
        hasImage={hasImage}
        onNewProjectClick={() => setIsNewProjectOpen(true)}
        onOpenProject={handleLoadProject}
        onSaveProject={handleSaveProject}
        onExportClick={() => editor.setIsExportOpen(true)}
        onReset={resetAllEdits}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onImportClick={() => setIsImportOpen(true)}
        onNewFromClipboard={handleNewFromClipboard}
      />
    );
  }

  return (
    <Header
      onReset={resetAllEdits}
      onDownloadClick={() => editor.setIsExportOpen(true)}
      onCopy={handleCopy}
      hasImage={hasImage}
      onTogglePreview={onTogglePreview}
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      setOpenSettings={setIsSettingsOpen}
      setOpenImport={setIsImportOpen}
      onGenerateClick={() => setIsGenerateOpen(true)}
      onNewProjectClick={() => setIsNewProjectOpen(true)}
      onNewFromClipboard={handleNewFromClipboard}
      onSaveProject={handleSaveProject}
      onOpenProject={handleLoadProject}
      onToggleFullscreen={onToggleFullscreen}
      isFullscreen={isFullscreen}
      onSyncProject={onSyncProject}
      setOpenProjectSettings={() => setIsProjectSettingsOpen(true)}
      panelLayout={panelLayout}
      togglePanelVisibility={togglePanelVisibility}
      activeRightTab={activeRightTab}
      setActiveRightTab={activeRightTab}
      activeBottomTab={activeBottomTab}
      setActiveBottomTab={activeBottomTab}
      isProxyMode={currentEditState.isProxyMode}
    >
      <MenuBar
        logic={editor}
        setIsNewProjectOpen={setIsNewProjectOpen}
        setIsExportOpen={editor.setIsExportOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        setIsImportOpen={setIsImportOpen}
        setIsGenerateOpen={setIsGenerateOpen}
        setIsGenerativeFillOpen={editor.setIsGenerativeFillOpen}
        setIsProjectSettingsOpen={setIsProjectSettingsOpen}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        panelLayout={panelLayout}
        togglePanelVisibility={togglePanelVisibility}
        activeRightTab={activeRightTab}
        setActiveRightTab={activeRightTab}
        activeBottomTab={activeBottomTab}
        setActiveBottomTab={activeBottomTab}
      />
    </Header>
  );
};