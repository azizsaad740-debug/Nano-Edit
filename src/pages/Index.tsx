import { useEffect, useState, useRef, useCallback } from "react";
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
import { useGradientPresets } from "@/hooks/useGradientPresets";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ExportOptions } from "@/components/editor/ExportOptions";
import { SavePresetDialog } from "@/components/editor/SavePresetDialog";
import { SettingsDialog } from "@/components/layout/SettingsDialog";
import { GenerativeDialog } from "@/components/editor/GenerativeDialog";
import { GenerateImageDialog } from "@/components/editor/GenerateImageDialog";
import { ImportPresetsDialog } from "@/components/editor/ImportPresetsDialog";
import { NewProjectDialog } from "@/components/editor/NewProjectDialog";
import { useHotkeys } from "react-hotkeys-hook";
import { BrushOptions } from "@/components/editor/BrushOptions";
import { SmartObjectEditor } from "@/components/editor/SmartObjectEditor";
import { ToolsPanel } from "@/components/layout/ToolsPanel";
import { SaveGradientPresetDialog } from "@/components/editor/SaveGradientPresetDialog";
import { showLoading, dismissToast, showSuccess, showError } from "@/utils/toast"; // Import toast utilities
import type { TemplateData } from "../types/template"; // FIXED: Relative path

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
    handleNewFromClipboard,
    handleSaveProject,
    handleLoadProject,
    handleAdjustmentChange,
    handleAdjustmentCommit,
    handleEffectChange,
    handleEffectCommit,
    handleGradingChange,
    handleGradingCommit,
    handleHslAdjustmentChange, // NEW destructuring
    handleHslAdjustmentCommit, // NEW destructuring
    handleChannelChange,
    handleCurvesChange,
    handleCurvesCommit,
    handleFilterChange,
    handleTransformChange,
    handleRotationChange,
    handleRotationCommit,
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
    selectedLayerId,
    setSelectedLayer,
    addTextLayer,
    addDrawingLayer,
    addShapeLayer,
    addGradientLayer,
    toggleLayerVisibility,
    renameLayer,
    deleteLayer,
    duplicateLayer,
    mergeLayerDown,
    rasterizeLayer,
    updateLayer,
    commitLayerChange,
    handleLayerPropertyCommit,
    handleLayerOpacityChange,
    handleLayerOpacityCommit,
    reorderLayers,
    // smart object utilities
    createSmartObject,
    openSmartObjectEditor,
    closeSmartObjectEditor,
    saveSmartObjectChanges,
    isSmartObjectEditorOpen,
    smartObjectEditingId,
    // tool state
    activeTool,
    setActiveTool,
    // brush state
    brushState,
    setBrushState,
    handleColorPick,
    // gradient tool state
    gradientToolState,
    setGradientToolState,
    // generative
    applyGenerativeResult,
    // selection
    selectionPath,
    setSelectionPath,
    selectionMaskDataUrl, // New
    handleSelectionBrushStroke, // New
    clearSelectionMask, // New
    applyMaskToSelectionPath, // New
    convertSelectionPathToMask, // New
    // Selective Blur
    handleSelectiveBlurStroke, // NEW destructuring
    handleSelectiveBlurStrengthChange, // NEW destructuring
    handleSelectiveBlurStrengthCommit, // NEW destructuring
    // shape tool
    selectedShapeType,
    setSelectedShapeType,
    // grouping
    groupLayers,
    toggleGroupExpanded,
    // Foreground/Background Colors
    foregroundColor,
    handleForegroundColorChange,
    backgroundColor,
    handleBackgroundColorChange,
    handleSwapColors,
    // Template loading utility
    loadTemplateData,
    // Layer Masking
    applySelectionAsMask, // NEW destructuring
    removeLayerMask, // NEW destructuring
    invertLayerMask, // NEW destructuring
    // Drawing stroke end handler from useLayers
    handleDrawingStrokeEnd, // NEW destructuring
  } = useEditorState();

  const { presets, savePreset, deletePreset } = usePresets();
  const { gradientPresets, saveGradientPreset, deleteGradientPreset } = useGradientPresets();
  const { geminiApiKey } = useSettings(); // FIXED: Destructure geminiApiKey

  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openGenerative, setOpenGenerative] = useState(false);
  const [openGenerateImage, setOpenGenerateImage] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [openNewProject, setOpenNewProject] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const openProjectInputRef = useRef<HTMLInputElement>(null);

  // --- Template Loading Effect ---
  useEffect(() => {
    const templateDataString = sessionStorage.getItem('nanoedit-template-data');
    if (templateDataString) {
      sessionStorage.removeItem('nanoedit-template-data');
      try {
        const templateData: TemplateData = JSON.parse(templateDataString);
        
        // Load the template data into the editor state
        loadTemplateData(templateData);
        
        showSuccess("Template loaded successfully.");
      } catch (error) {
        console.error("Failed to parse template data:", error);
        showError("Failed to load template data from storage.");
      }
    }
  }, []);
  // --- End Template Loading Effect ---

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

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error(`Error attempting to disable fullscreen mode: ${err.message}`);
      });
    }
  }, []);

  const handleSyncProject = useCallback(() => {
    if (!image) {
      showError("No project loaded to sync.");
      return;
    }
    const toastId = showLoading("Connecting to Google Drive...");
    
    // --- STUB IMPLEMENTATION ---
    // In a real app, this would initiate the OAuth flow and then upload the project file.
    setTimeout(() => {
      dismissToast(toastId);
      showSuccess("Project sync initiated (Stub). You would need to implement the Google Drive API integration for full functionality.");
    }, 1500);
    // --- END STUB ---
  }, [image]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useHotkeys(
    "ctrl+i, cmd+i",
    (e) => {
      e.preventDefault();
      setOpenImport(true);
    },
    { enabled: true }
  );

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

  const { adjustments, effects, grading, channels, curves, selectedFilter, transforms, crop, frame, selectiveBlurStrength, hslAdjustments } = currentState;

  const hasActiveSelection = !!selectionPath || !!selectionMaskDataUrl;

  const sidebarProps = {
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
    hslAdjustments, // NEW prop
    onHslAdjustmentChange: handleHslAdjustmentChange, // NEW prop
    onHslAdjustmentCommit: handleHslAdjustmentCommit, // NEW prop
    channels,
    onChannelChange: handleChannelChange,
    curves,
    onCurvesChange: handleCurvesChange,
    onCurvesCommit: handleCurvesCommit,
    selectedFilter,
    onFilterChange: handleFilterChange,
    onTransformChange: handleTransformChange,
    rotation: transforms.rotation,
    onRotationChange: handleRotationChange,
    onRotationCommit: handleRotationCommit,
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
    addDrawingLayer,
    addShapeLayer,
    addGradientLayer,
    toggleLayerVisibility,
    renameLayer,
    deleteLayer,
    // FIX: Renaming keys to match SidebarProps interface
    onDuplicateLayer: () => selectedLayerId && duplicateLayer(selectedLayerId),
    onMergeLayerDown: () => selectedLayerId && mergeLayerDown(selectedLayerId),
    onRasterizeLayer: () => selectedLayerId && rasterizeLayer(selectedLayerId),
    onReorder: reorderLayers,
    // selection
    selectedLayerId,
    onSelectLayer: setSelectedLayer,
    // layer editing
    onLayerUpdate: updateLayer,
    onLayerCommit: commitLayerChange,
    onLayerPropertyCommit: handleLayerPropertyCommit,
    onLayerOpacityChange: handleLayerOpacityChange,
    onLayerOpacityCommit: handleLayerOpacityCommit,
    // smart objects
    onCreateSmartObject: createSmartObject, // ADDED
    onOpenSmartObject: openSmartObjectEditor, // ADDED
    // Shape tool
    selectedShapeType,
    // Tool state
    activeTool,
    // Brush state
    brushState,
    setBrushState,
    handleColorPick,
    // Gradient tool state
    gradientToolState,
    setGradientToolState,
    // Gradient Presets
    gradientPresets,
    onSaveGradientPreset: saveGradientPreset,
    onDeleteGradientPreset: deleteGradientPreset,
    // Grouping
    groupLayers,
    toggleGroupExpanded,
    // Foreground/Background Colors
    foregroundColor,
    setForegroundColor: handleForegroundColorChange,
    // Selective Blur Props
    selectiveBlurStrength, // NEW prop
    onSelectiveBlurStrengthChange: handleSelectiveBlurStrengthChange, // NEW prop
    onSelectiveBlurStrengthCommit: handleSelectiveBlurStrengthCommit, // NEW prop
    // Layer Masking
    hasActiveSelection, // NEW prop
    onApplySelectionAsMask: applySelectionAsMask, // NEW prop
    onRemoveLayerMask: removeLayerMask, // NEW prop
    onInvertLayerMask: invertLayerMask, // NEW prop
    // Drawing stroke end handler from useLayers
    handleDrawingStrokeEnd, // NEW destructuring
    // --- MISSING FRAME PROPS ---
    frame,
    onFramePresetChange: handleFramePresetChange,
    onFramePropertyChange: handleFramePropertyChange,
    onFramePropertyCommit: handleFramePropertyCommit,
  };

  
  const smartObjectToEdit = layers.find(layer => layer.id === smartObjectEditingId) || null;

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
        onNewFromClipboard={handleNewFromClipboard}
        onSaveProject={handleSaveProject}
        onOpenProject={handleOpenProjectClick}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        onSyncProject={handleSyncProject}
      >
        <div className="flex-1 flex items-center justify-center px-4">
          {(activeTool === "lasso" && hasActiveSelection) || (activeTool === "selectionBrush" && hasActiveSelection) || (hasActiveSelection && activeTool !== 'selectionBrush') ? (
            <div className="flex items-center gap-2">
              {activeTool === 'selectionBrush' ? (
                <Button size="sm" onClick={applyMaskToSelectionPath} disabled={!selectionMaskDataUrl}>
                  Apply Selection
                </Button>
              ) : (
                <Button size="sm" onClick={convertSelectionPathToMask} disabled={!selectionPath}>
                  Refine Selection
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setOpenGenerative(true)} disabled={!hasActiveSelection}>
                Generative Fill
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelectionMask}>
                Clear Selection
              </Button>
            </div>
          ) : null}
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
                <EditorControls {...sidebarProps} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Header>

      <main className="flex-1 flex overflow-hidden">
        <ToolsPanel 
          activeTool={activeTool} 
          setActiveTool={setActiveTool} 
          selectedShapeType={selectedShapeType}
          setSelectedShapeType={setSelectedShapeType}
          foregroundColor={foregroundColor} 
          onForegroundColorChange={handleForegroundColorChange} 
          backgroundColor={backgroundColor} 
          onBackgroundColorChange={handleBackgroundColorChange} 
          onSwapColors={handleSwapColors} 
          brushState={brushState} 
          setBrushState={setBrushState} 
        />
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={75}>
            <div className="h-full p-4 md:p-6 lg:p-8 overflow-auto">
              <Workspace
                image={image}
                onFileSelect={handleFileSelect}
                onSampleSelect={handleUrlImageLoad}
                onUrlSelect={handleUrlImageLoad}
                onImageLoad={handleImageLoad}
                currentState={currentState} // Pass currentState
                adjustments={adjustments}
                effects={effects}
                grading={grading}
                channels={channels}
                curves={curves}
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
                onAddShapeLayer={addShapeLayer}
                onAddGradientLayer={addGradientLayer}
                onLayerUpdate={updateLayer}
                onLayerCommit={commitLayerChange}
                selectedLayerId={selectedLayerId}
                brushState={brushState}
                gradientToolState={gradientToolState}
                selectionPath={selectionPath}
                selectionMaskDataUrl={selectionMaskDataUrl} // New
                onSelectionChange={setSelectionPath}
                onSelectionBrushStrokeEnd={handleSelectionBrushStroke} // New
                onSelectiveBlurStrokeEnd={handleSelectiveBlurStroke} // NEW prop
                handleColorPick={handleColorPick}
                imageNaturalDimensions={dimensions}
                selectedShapeType={selectedShapeType}
                setSelectedLayer={setSelectedLayer}
                setActiveTool={setActiveTool}
                foregroundColor={foregroundColor}
                backgroundColor={backgroundColor}
                onDrawingStrokeEnd={handleDrawingStrokeEnd} // NEW: Pass the dedicated drawing stroke handler
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <Sidebar {...sidebarProps} />
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
        apiKey={geminiApiKey}
        originalImage={image}
        selectionPath={selectionPath}
        selectionMaskDataUrl={selectionMaskDataUrl} // Pass new prop
        imageNaturalDimensions={dimensions}
      />
      <GenerateImageDialog
        open={openGenerateImage}
        onOpenChange={setOpenGenerateImage}
        onGenerate={handleGeneratedImageLoad}
        apiKey={geminiApiKey}
        imageNaturalDimensions={dimensions}
      />
      <ImportPresetsDialog open={openImport} onOpenChange={setOpenImport} />
      <NewProjectDialog
        open={openNewProject}
        onOpenChange={setOpenNewProject}
        onNewProject={handleNewProject}
      />
      {isSmartObjectEditorOpen && smartObjectToEdit && (
        <SmartObjectEditor
          smartObject={smartObjectToEdit}
          onClose={closeSmartObjectEditor}
          onSave={saveSmartObjectChanges}
          mainImage={image}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          brushState={brushState}
          setBrushState={setBrushState}
          foregroundColor={foregroundColor}
          onForegroundColorChange={handleForegroundColorChange}
          backgroundColor={backgroundColor}
          onBackgroundColorChange={handleBackgroundColorChange}
          onSwapColors={handleSwapColors}
          selectedShapeType={selectedShapeType}
          setSelectedShapeType={setSelectedShapeType}
        />
      )}
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