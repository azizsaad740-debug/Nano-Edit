"use client";

import React from "react";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import EditorHeader from "@/components/layout/EditorHeader";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";
import { Sidebar } from "@/components/layout/Sidebar";
import { LayerPanel } from "@/components/editor/LayerPanel";
import { HistoryPanel } from "@/components/editor/HistoryPanel";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { PresetManager } from "@/components/presets/PresetManager";
import Header from "@/components/layout/Header";
import { SmartObjectEditor } from "@/components/editor/SmartObjectEditor";

const Index: React.FC = () => {
  const {
    // ... (keep existing destructuring)
    resetAllEdits,
    onDownloadClick,
    onCopy,
    hasImage,
    onTogglePreview,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    isGenerating,
    isPreviewing,
    isProxyMode,
    toggleProxyMode,
    toggleSmartObjectEditor,
    togglePresetManager,
    toggleSettingsPanel,
    toggleLayerPanel,
    toggleHistoryPanel,
  } = useEditorLogic();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <EditorHeader
        onReset={resetAllEdits}
        onDownloadClick={onDownloadClick}
        onCopy={onCopy}
        hasImage={hasImage}
        onTogglePreview={onTogglePreview}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        isGenerating={isGenerating}
        isPreviewing={isPreviewing}
        isProxyMode={isProxyMode}
        toggleProxyMode={toggleProxyMode}
        toggleSmartObjectEditor={toggleSmartObjectEditor}
        togglePresetManager={togglePresetManager}
        toggleSettingsPanel={toggleSettingsPanel}
        toggleLayerPanel={toggleLayerPanel}
        toggleHistoryPanel={toggleHistoryPanel}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <EditorWorkspace />
      </div>
      <LayerPanel />
      <HistoryPanel />
      <SettingsPanel />
      <PresetManager />
      <SmartObjectEditor />
    </div>
  );
};

export default Index;