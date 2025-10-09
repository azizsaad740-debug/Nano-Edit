import { useEffect, useState, useRef } from "react";
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
import { useEditorState } from "@/hooks/useEditorState";
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
import { ToolsPanel } from "@/components/layout/ToolsPanel";
import { GenerativeDialog } from "@/components/editor/GenerativeDialog";
import { GenerateImageDialog } from "@/components/editor/GenerateImageDialog";
import { ImportPresetsDialog } from "@/components/editor/ImportPresetsDialog";
import { NewProjectDialog } from "@/components/editor/NewProjectDialog";
import { useHotkeys } from "react-hotkeys-hook";
import { BrushOptions } from "@/components/editor/BrushOptions";

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
    handleGeneratedImageLoad,
    handleNewProject,
    handleSaveProject,
    handleLoadProject,
    handleAdjustmentChange,
    handleAdjustmentCommit,
    handleEffectChange,
    handleEffectCommit,
    handleGradingChange,
    handleGradingCommit,
    handleChannelChange,
    handleFilterChange,
    handleTransformChange,
    handleFramePresetChange,
    handleFramePropertyChange,
    handleFramePropertyCommit,
    pendingCrop,
    setPendingCrop,
    applyCrop,
    cancelCrop,
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
    addDrawingLayer,
    toggleLayerVisibility,
    renameLayer,
    deleteLayer,
    updateLayer,
    commitLayerChange,
    handleLayerOpacityChange,
    handleLayerOpacityCommit,
    reorderLayers,
    // tool state
    activeTool,
    setActiveTool,
    // brush state
    brushState,
    setBrushState,
    // generative
    applyGenerativeResult,
    // selection
    selectedLayerId,
    setSelectedLayer,
    selectionPath,
    setSelectionPath,
  } = useEditorState();

  const { presets, savePreset, deletePreset } = usePresets();
  const { apiKey } = useSettings();

  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openGenerative, setOpenGenerative] = useState(false);
  const [openGenerateImage, setOpenGenerateImage] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [openNewProject, setOpenNewProject] = useState(false);
  const openProjectInputRef = useRef<HTMLInputElement>(null);

  const handleOpenProjectClick = () => {
    openProjectInputRef.current?.click();
  };

  const handleProjectFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleLoadProject(file);
    }
    if (event.target) {
      event.target.value = "";
    }
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

  const { adjustments, effects, grading, channels, selectedFilter, transforms, crop, frame } = currentState;

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
    channels,
    onChannelChange: handleChannelChange,
    selectedFilter,
    onFilterChange: handleFilterChange,
    onTransformChange: handleTransformChange,
    onFramePresetChange: handleFramePresetChange,
    onFramePropertyChange: handleFramePropertyChange,
    onFramePropertyCommit: handleFramePropertyCommit,
    frame,
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
    reorderLayers,
    // selection
    selectedLayerId,
    onSelectLayer: setSelectedLayer,
    // layer editing
    onLayerUpdate: updateLayer,
    onLayerCommit: commitLayerChange,
    onLayerOpacityChange: handleLayerOpacityChange,
    onLayerOpacityCommit: handleLayerOpacityCommit,
  };

  const hasSelection = selectionPath && selectionPath.length > 0;

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
        setOpenSettings={setOpenSettings}
        setOpenImport={setOpenImport}
        onGenerateClick={() => setOpenGenerateImage(true)}
        onNewProjectClick={() => setOpenNewProject(true)}
        onSaveProject={handleSaveProject}
        onOpenProject={handleOpenProjectClick}
      >
        <div className="flex-1 flex items-center justify-center px-4">
          {(activeTool === 'brush' || activeTool === 'eraser') && (
            <BrushOptions
              activeTool={activeTool}
              brushSize={brushState.size}
              setBrushSize={(size) => setBrushState({ size })}
              brushOpacity={brushState.opacity}
              setBrushOpacity={(opacity) => setBrushState({ opacity })}
              brushColor={brushState.color}
              setBrushColor={(color) => setBrushState({ color })}
            />
          )}
          {activeTool === "lasso" && hasSelection && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setOpenGenerative(true)}>
                Generative Fill
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectionPath(null)}>
                Deselect
              </Button>
            </div>
          )}
        </div>
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

      <main className="flex-1 flex overflow-hidden">
        <ToolsPanel activeTool={activeTool} setActiveTool={setActiveTool} />
        <ResizablePanelGroup direction="horizontal" className="flex-1">
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
                channels={channels}
                selectedFilter={selectedFilter}
                transforms={transforms}
                frame={frame}
                crop={currentState.crop}
                pendingCrop={pendingCrop}
                onCropChange={setPendingCrop}
                onApplyCrop={applyCrop}
                onCancelCrop={cancelCrop}
                aspect={aspect}
                imgRef={imgRef}
                isPreviewingOriginal={isPreviewingOriginal}
                activeTool={activeTool}
                layers={layers}
                onAddTextLayer={addTextLayer}
                onAddDrawingLayer={addDrawingLayer}
                onLayerUpdate={updateLayer}
                onLayerCommit={commitLayerChange}
                selectedLayerId={selectedLayerId}
                brushState={brushState}
                selectionPath={selectionPath}
                onSelectionChange={setSelectionPath}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <Sidebar {...editorProps} />
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
      <GenerateImageDialog
        open={openGenerateImage}
        onOpenChange={setOpenGenerateImage}
        onGenerate={handleGeneratedImageLoad}
        apiKey={apiKey}
      />
      <ImportPresetsDialog open={openImport} onOpenChange={setOpenImport} />
      <NewProjectDialog
        open={openNewProject}
        onOpenChange={setOpenNewProject}
        onNewProject={handleNewProject}
      />
      <input
        type="file"
        ref={openProjectInputRef}
        onChange={handleProjectFileChange}
        className="hidden"
        accept=".nanoedit"
      />
    </div>
  );
};

export default Index;