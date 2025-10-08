import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Workspace from "@/components/editor/Workspace";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import EditorControls from "@/components/layout/EditorControls";
import { useEditorState, type Layer } from "@/hooks/useEditorState";
import { usePresets } from "@/hooks/usePresets";
import { useSettings } from "@/hooks/useSettings";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ExportOptions } from "@/components/editor/ExportOptions";
import { SavePresetDialog } from "@/components/editor/SavePresetDialog";
import { SettingsDialog } from "@/components/layout/SettingsDialog";
import { ToolsBar } from "@/components/editor/ToolsBar";
import { GenerativeDialog } from "@/components/editor/GenerativeDialog";
import { ImportPresetsDialog } from "@/components/editor/ImportPresetsDialog";
import { EditTextDialog } from "@/components/editor/EditTextDialog";
import { useHotkeys } from "react-hotkeys-hook";

const Index = () => {
  const {
    image,
    imgRef,
    dimensions,
    fileInfo,
    exifData,
    currentState,
    history,
    currentHistoryIndex,
    aspect,
    canUndo,
    canRedo,
    handleImageLoad,
    handleFileSelect,
    handleUrlImageLoad,
    handleAdjustmentChange,
    handleAdjustmentCommit,
    handleEffectChange,
    handleEffectCommit,
    handleGradingChange,
    handleGradingCommit,
    handleFilterChange,
    handleTransformChange,
    handleCropChange,
    handleCropComplete,
    handleReset,
    handleUndo,
    handleRedo,
    jumpToHistory,
    handleDownload,
    handleCopy,
    setAspect,
    isPreviewingOriginal,
    setIsPreviewingOriginal,
    isExporting,
    setIsExporting,
    applyPreset,
    // layer utilities
    layers,
    addTextLayer,
    toggleLayerVisibility,
    renameLayer,
    deleteLayer,
    updateLayer,
    commitLayerChange,
    // tool state
    activeTool,
    setActiveTool,
    // generative
    applyGenerativeResult,
  } = useEditorState();

  const { presets, savePreset, deletePreset } = usePresets();
  const { apiKey } = useSettings();

  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openGenerative, setOpenGenerative] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [editingLayer, setEditingLayer] = useState<Layer | null>(null);

  const handleOpenEditDialog = (layerId: string) => {
    const layerToEdit = layers.find((l) => l.id === layerId);
    if (layerToEdit) {
      setEditingLayer(layerToEdit);
    }
  };

  const handleSaveEditText = (id: string, updates: Partial<Layer>) => {
    updateLayer(id, updates);
    commitLayerChange(id);
  };

  // Shortcut to open Import Presets dialog (Ctrl+I / Cmd+I)
  useHotkeys(
    "ctrl+i, cmd+i",
    (e) => {
      e.preventDefault();
      setOpenImport(true);
    },
    { enabled: true }
  );

  // Paste handling (unchanged)
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            event.preventDefault();
            return;
          }
        }
      }

      const pastedText = event.clipboardData?.getData("text/plain");
      if (pastedText) {
        try {
          new URL(pastedText);
          handleUrlImageLoad(pastedText);
          event.preventDefault();
        } catch (_) {
          // Not a valid URL
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handleFileSelect, handleUrlImageLoad]);

  const { adjustments, effects, grading, selectedFilter, transforms, crop } = currentState;

  const editorProps = {
    hasImage: !!image,
    adjustments,
    onAdjustmentChange: handleAdjustmentChange,
    onAdjustmentCommit: handleAdjustmentCommit,
    effects,
    onEffectChange: handleEffectChange,
    onEffectCommit: handleEffectCommit,
    grading,
    onGradingChange: handleGradingChange,
    onGradingCommit: handleGradingCommit,
    selectedFilter,
    onFilterChange: handleFilterChange,
    onTransformChange: handleTransformChange,
    onAspectChange: setAspect,
    aspect,
    history,
    currentHistoryIndex,
    onHistoryJump: jumpToHistory,
    dimensions,
    fileInfo,
    imgRef,
    exifData,
    presets,
    onApplyPreset: applyPreset,
    onSavePreset: () => setIsSavingPreset(true),
    onDeletePreset: deletePreset,
    // layers
    layers,
    addTextLayer,
    toggleLayerVisibility,
    renameLayer,
    deleteLayer,
    onEditTextLayer: handleOpenEditDialog,
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      <Header
        onReset={handleReset}
        onDownloadClick={() => setIsExporting(true)}
        onCopy={handleCopy}
        hasImage={!!image}
        onTogglePreview={setIsPreviewingOriginal}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        openSettings={openSettings}
        setOpenSettings={setOpenSettings}
        openImport={openImport}
        setOpenImport={setOpenImport}
      >
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" disabled={!image}>
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only">Open edit controls</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[320px] sm:w-[400px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Edit Image</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <EditorControls {...editorProps} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Header>

      {/* Tools bar (visible on desktop, hidden on mobile) */}
      <div className="hidden md:block p-2 bg-muted/20">
        <ToolsBar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          openGenerativeDialog={() => setOpenGenerative(true)}
        />
      </div>

      <main className="flex-1">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="hidden md:block">
            <Sidebar {...editorProps} />
          </ResizablePanel>
          <ResizableHandle withHandle className="hidden md:flex" />
          <ResizablePanel defaultSize={75}>
            <div className="h-full p-4 md:p-6 lg:p-8 overflow-auto">
              <Workspace
                image={image}
                onFileSelect={handleFileSelect}
                onSampleSelect={handleUrlImageLoad}
                onUrlSelect={handleUrlImageLoad}
                onImageLoad={handleImageLoad}
                adjustments={adjustments}
                effects={effects}
                grading={grading}
                selectedFilter={selectedFilter}
                transforms={transforms}
                crop={crop}
                onCropChange={handleCropChange}
                onCropComplete={handleCropComplete}
                aspect={aspect}
                imgRef={imgRef}
                isPreviewingOriginal={isPreviewingOriginal}
                activeTool={activeTool}
                layers={layers}
                onLayerUpdate={updateLayer}
                onLayerCommit={commitLayerChange}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      <ExportOptions
        open={isExporting}
        onOpenChange={setIsExporting}
        onExport={handleDownload}
        dimensions={dimensions}
      />
      <SavePresetDialog
        open={isSavingPreset}
        onOpenChange={setIsSavingPreset}
        onSave={(name) => savePreset(name, currentState)}
      />
      <SettingsDialog open={openSettings} onOpenChange={setOpenSettings} />
      <GenerativeDialog
        open={openGenerative}
        onOpenChange={setOpenGenerative}
        onApply={applyGenerativeResult}
        apiKey={apiKey}
      />
      <ImportPresetsDialog open={openImport} onOpenChange={setOpenImport} />
      <EditTextDialog
        open={!!editingLayer}
        onOpenChange={(open) => !open && setEditingLayer(null)}
        layer={editingLayer}
        onSave={handleSaveEditText}
      />
    </div>
  );
};

export default Index;