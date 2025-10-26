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
import { ProjectSettingsDialog } from "@/components/editor/ProjectSettingsDialog";
import { useHotkeys } from "react-hotkeys-hook";
import { BrushOptions } from "@/components/editor/BrushOptions";
import { SmartObjectEditor } from "@/components/editor/SmartObjectEditor";
import { ToolsPanel } from "@/components/layout/ToolsPanel";
import { SaveGradientPresetDialog } from "@/components/editor/SaveGradientPresetDialog";
import { showLoading, dismissToast, showSuccess, showError } from "@/utils/toast";
import type { TemplateData } from "../types/template";
import { downloadSelectionAsImage } from "@/utils/imageUtils";
import { FontManagerDialog } from "@/components/editor/FontManagerDialog";
import { CustomFontLoader } from "@/components/editor/CustomFontLoader";
import { useProjectManager } from "@/hooks/useProjectManager";
import { useFontManager } from "@/hooks/useFontManager";

const Index = () => {
  const {
    projects,
    activeProjectId,
    activeProject,
    setActiveProjectId,
    updateActiveProject,
    createNewTab,
    closeProject,
  } = useProjectManager();

  const { geminiApiKey } = useSettings();
  const { presets, savePreset, deletePreset } = usePresets();
  const { gradientPresets, saveGradientPreset, deleteGradientPreset } = useGradientPresets();
  const { systemFonts, setSystemFonts, customFonts, addCustomFont, removeCustomFont } = useFontManager();

  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openGenerative, setOpenGenerative] = useState(false);
  const [openGenerateImage, setOpenGenerateImage] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [openNewProject, setOpenNewProject] = useState(false);
  const [openProjectSettings, setOpenProjectSettings] = useState(false);
  const [openFontManager, setOpenFontManager] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPreviewingOriginal, setIsPreviewingOriginal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const openProjectInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // --- Project State Management ---
  const handleProjectUpdate = useCallback((updates: Partial<typeof activeProject>) => {
    updateActiveProject(updates);
  }, [updateActiveProject]);

  const handleHistoryUpdate = useCallback((history, currentHistoryIndex, layers) => {
    updateActiveProject({ history, currentHistoryIndex, layers });
  }, [updateActiveProject]);

  const handleLayerUpdate = useCallback((layers, historyName) => {
    if (historyName) {
      const newState = activeProject?.history[activeProject.currentHistoryIndex].state;
      if (newState) {
        // This path is used by useLayers when committing a change (e.g., rename, delete, reorder)
        // We need to ensure the history is updated correctly.
        const newHistory = activeProject.history.slice(0, activeProject.currentHistoryIndex + 1);
        const newHistoryIndex = newHistory.length;
        const newHistoryItem = { name: historyName, state: newState, layers: layers };
        updateActiveProject({ history: [...newHistory, newHistoryItem], currentHistoryIndex: newHistoryIndex, layers });
      }
    } else {
      // This path is used by useLayers for temporary updates (e.g., dragging)
      updateActiveProject({ layers });
    }
  }, [activeProject, updateActiveProject]);

  const editorState = useEditorState(
    activeProject || projects[0], // Fallback to first project if activeProject is null (shouldn't happen)
    handleProjectUpdate,
    handleHistoryUpdate,
    handleLayerUpdate,
    activeProject?.image || null,
    activeProject?.dimensions || null,
    activeProject?.fileInfo || null,
    activeProject?.exifData || null,
    imgRef,
  );

  const {
    image,
    dimensions,
    fileInfo,
    exifData,
    currentState,
    history,
    currentHistoryIndex,
    aspect,
    canUndo,
    canRedo,
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
    handleHslAdjustmentChange,
    handleHslAdjustmentCommit,
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
    applyPreset,
    recordHistory,
    layers,
    selectedLayerId,
    setSelectedLayer,
    addTextLayer,
    addDrawingLayer,
    handleAddLayerFromBackground, // NEW
    handleLayerFromSelection, // NEW
    addShapeLayer,
    addGradientLayer,
    addAdjustmentLayer,
    toggleLayerVisibility,
    renameLayer,
    deleteLayer,
    handleDeleteHiddenLayers, // NEW
    duplicateLayer, // Now accepts ID
    mergeLayerDown,
    rasterizeLayer,
    handleRasterizeSmartObject, // NEW
    handleConvertSmartObjectToLayers, // NEW
    handleExportSmartObjectContents, // NEW
    handleArrangeLayer, // NEW
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
    groupLayers: groupLayersFn, // Renamed to avoid redeclaration
    toggleGroupExpanded: toggleGroupExpandedFn, // Renamed to avoid redeclaration
    activeTool,
    setActiveTool,
    brushState,
    setBrushState,
    handleColorPick,
    gradientToolState,
    setGradientToolState,
    applyGenerativeResult,
    selectionPath,
    setSelectionPath,
    selectionMaskDataUrl,
    handleSelectionBrushStroke,
    clearSelectionMask,
    applyMaskToSelectionPath,
    convertSelectionPathToMask,
    handleSelectiveBlurStroke,
    selectiveBlurStrength,
    handleSelectiveBlurStrengthChange,
    handleSelectiveBlurStrengthCommit,
    selectedShapeType,
    setSelectedShapeType,
    foregroundColor,
    handleForegroundColorChange,
    backgroundColor,
    handleBackgroundColorChange,
    handleSwapColors,
    loadTemplateData,
    applySelectionAsMask,
    removeLayerMask,
    invertLayerMask,
    toggleClippingMask,
    toggleLayerLock,
    handleDrawingStrokeEnd,
    loadImageData,
  } = editorState;

  // --- Local Functions ---
  const handleOpenProjectClick = (importInSameProject: boolean) => {
    openProjectInputRef.current?.click();
    openProjectInputRef.current?.setAttribute('data-import-mode', importInSameProject ? 'same' : 'new');
  };

  const handleProjectFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const importMode = event.target.getAttribute('data-import-mode') === 'same';
    
    if (file) {
      if (file.name.endsWith('.nanoedit')) {
        if (importMode && image) {
          showError("Cannot import a .nanoedit project into an existing project. Please open it in a new tab.");
          return;
        }
        handleLoadProject(file);
      } else {
        if (!importMode) {
          // Open in new tab
          const newProject = createNewTab(file?.name || "New Image");
          setActiveProjectId(newProject.id);
          handleFileSelect(file, false);
        } else {
          // Import in same project
          handleFileSelect(file, true);
        }
      }
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
    setTimeout(() => {
      dismissToast(toastId);
      showSuccess("Project sync initiated (Stub). You would need to implement the Google Drive API integration for full functionality.");
    }, 1500);
    // --- END STUB ---
  }, [image]);

  const handleExportSelection = useCallback(() => {
    if (!imgRef.current || !dimensions || !selectionMaskDataUrl) {
      showError("No active selection or image loaded.");
      return;
    }
    const fileName = fileInfo?.name.replace(/\.[^/.]+$/, "") || 'selection';
    downloadSelectionAsImage(imgRef.current, selectionMaskDataUrl, dimensions, `${fileName}-selection.png`);
  }, [imgRef, dimensions, selectionMaskDataUrl, fileInfo]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      // Ensure cleanup of hotkeys if needed, though useHotkeys handles its own cleanup
    };
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
          const imageFile = items[i].getAsFile();
          if (imageFile) {
            // Paste image in new tab
            const newProject = createNewTab("Pasted Image");
            setActiveProjectId(newProject.id);
            handleFileSelect(imageFile, false);
            event.preventDefault();
            return;
          }
        }
      }

      const pastedText = event.clipboardData?.getData("text/plain");
      if (pastedText) {
        try {
          new URL(pastedText);
          // Paste URL in new tab
          const newProject = createNewTab("Pasted URL");
          setActiveProjectId(newProject.id);
          handleUrlImageLoad(pastedText, false);
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
  }, [handleFileSelect, handleUrlImageLoad, createNewTab, setActiveProjectId]);

  const { adjustments, effects, grading, channels, curves, selectedFilter, transforms, crop, frame, hslAdjustments, colorMode } = currentState;

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
    hslAdjustments,
    onHslAdjustmentChange: handleHslAdjustmentChange,
    onHslAdjustmentCommit: handleHslAdjustmentCommit,
    channels,
    onChannelChange: handleChannelChange,
    curves,
    onCurvesChange: handleCurvesChange,
    onCurvesCommit: handleCurvesCommit,
    onFilterChange: handleFilterChange,
    selectedFilter,
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
    exifData,
    imgRef,
    presets,
    onApplyPreset: applyPreset,
    onSavePreset: () => setIsSavingPreset(true),
    onDeletePreset: deletePreset,
    // layers
    layers,
    addTextLayer: () => addTextLayer({ x: 50, y: 50 }),
    addDrawingLayer,
    onAddLayerFromBackground: handleAddLayerFromBackground, // FIX 7: Added missing prop
    onLayerFromSelection: handleLayerFromSelection, // NEW
    addShapeLayer: (coords, shapeType, initialWidth, initialHeight) => addShapeLayer(coords, shapeType, initialWidth, initialHeight),
    addGradientLayer,
    onAddAdjustmentLayer: addAdjustmentLayer, // FIX 7: Added missing prop
    onDuplicateLayer: duplicateLayer, // Now accepts ID
    onMergeLayerDown: () => selectedLayerId && mergeLayerDown(selectedLayerId),
    onRasterizeLayer: () => selectedLayerId && rasterizeLayer(selectedLayerId),
    onRasterizeSmartObject: () => selectedLayerId && handleRasterizeSmartObject(), // FIX 3
    onConvertSmartObjectToLayers: () => selectedLayerId && handleConvertSmartObjectToLayers(), // FIX 4
    onExportSmartObjectContents: () => selectedLayerId && handleExportSmartObjectContents(), // FIX 5
    onDeleteHiddenLayers: handleDeleteHiddenLayers, // NEW
    onArrangeLayer: handleArrangeLayer, // FIX 6
    onReorder: reorderLayers,
    toggleLayerVisibility, // FIX 11
    renameLayer, // FIX 11
    deleteLayer, // FIX 11
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
    onCreateSmartObject: createSmartObject,
    onOpenSmartObject: openSmartObjectEditor,
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
    groupLayers: (layerIds) => groupLayersFn(layerIds), // Use renamed function
    toggleGroupExpanded: toggleGroupExpandedFn, // Use renamed function
    // Foreground/Background Colors
    foregroundColor,
    setForegroundColor: handleForegroundColorChange,
    // Selective Blur Props
    selectiveBlurStrength,
    onSelectiveBlurStrengthChange: handleSelectiveBlurStrengthChange,
    onSelectiveBlurStrengthCommit: handleSelectiveBlurStrengthCommit,
    // Layer Masking
    hasActiveSelection,
    onApplySelectionAsMask: applySelectionAsMask,
    onRemoveLayerMask: removeLayerMask,
    onInvertLayerMask: invertLayerMask,
    onToggleClippingMask: () => selectedLayerId && toggleClippingMask(selectedLayerId),
    onToggleLayerLock: (id: string) => toggleLayerLock(id),
    // Drawing stroke end handler from useLayers
    handleDrawingStrokeEnd,
    // --- MISSING FRAME PROPS ---
    frame,
    onFramePresetChange: handleFramePresetChange,
    onFramePropertyChange: handleFramePropertyChange,
    onFramePropertyCommit: handleFramePropertyCommit,
    // Fonts
    systemFonts,
    customFonts,
    onOpenFontManager: () => setOpenFontManager(true),
  };

  
  const smartObjectToEdit = layers.find(layer => layer.id === smartObjectEditingId) || null;

  const handleProjectSettingsUpdate = (updates: { width?: number; height?: number; colorMode?: 'RGB' | 'CMYK' | 'Grayscale' }) => {
    if (updates.width && updates.height) {
      // This is a canvas resize, which requires a history commit and dimension update
      const newDimensions = { width: updates.width, height: updates.height };
      
      // 1. Update dimensions in project state
      updateActiveProject({ dimensions: newDimensions });
      
      // 2. Record history change for color mode
      if (updates.colorMode) {
        recordHistory(`Change Color Mode to ${updates.colorMode}`, { ...currentState, colorMode: updates.colorMode }, layers);
      } else {
        // If only dimensions changed, record history for resize
        recordHistory(`Resize Canvas to ${updates.width}x${updates.height}`, currentState, layers);
      }
      
      // 3. Show success message
      showSuccess(`Project resized to ${updates.width}x${updates.height}.`);
    } else if (updates.colorMode) {
      // Only color mode change
      recordHistory(`Change Color Mode to ${updates.colorMode}`, { ...currentState, colorMode: updates.colorMode }, layers);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      <CustomFontLoader customFonts={customFonts} />
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
        onNewFromClipboard={(importInSameProject) => handleNewFromClipboard(importInSameProject)}
        onSaveProject={handleSaveProject}
        onOpenProject={(importInSameProject) => handleOpenProjectClick(importInSameProject)}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        onSyncProject={handleSyncProject}
        setOpenProjectSettings={setOpenProjectSettings}
        // Multi-project props
        projects={projects}
        activeProjectId={activeProjectId}
        setActiveProjectId={setActiveProjectId}
        createNewTab={createNewTab}
        closeProject={closeProject}
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
              <Button variant="outline" size="sm" onClick={handleExportSelection} disabled={!selectionMaskDataUrl}>
                Export Selection
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
                onFileSelect={(file) => {
                  const newProject = createNewTab(file?.name || "New Image");
                  setActiveProjectId(newProject.id);
                  handleFileSelect(file, false);
                }}
                onSampleSelect={(url) => {
                  const newProject = createNewTab("Sample Image");
                  setActiveProjectId(newProject.id);
                  handleUrlImageLoad(url, false);
                }}
                onUrlSelect={(url) => {
                  const newProject = createNewTab("URL Image");
                  setActiveProjectId(newProject.id);
                  handleUrlImageLoad(url, false);
                }}
                onImageLoad={() => {
                  if (imgRef.current && activeProject) {
                    const { naturalWidth, naturalHeight } = imgRef.current;
                    if (naturalWidth > 0 && naturalHeight > 0) {
                      updateActiveProject({ 
                        dimensions: { width: naturalWidth, height: naturalHeight },
                        aspect: naturalWidth / naturalHeight,
                      });
                    }
                  }
                }}
                currentState={currentState}
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
                selectionMaskDataUrl={selectionMaskDataUrl}
                onSelectionChange={setSelectionPath}
                onSelectionBrushStrokeEnd={handleSelectionBrushStroke}
                onSelectiveBlurStrokeEnd={handleSelectiveBlurStroke}
                handleColorPick={handleColorPick}
                imageNaturalDimensions={dimensions}
                selectedShapeType={selectedShapeType}
                setSelectedLayer={setSelectedLayer}
                setActiveTool={setActiveTool}
                foregroundColor={foregroundColor}
                backgroundColor={backgroundColor}
                onDrawingStrokeEnd={handleDrawingStrokeEnd}
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
        selectionMaskDataUrl={selectionMaskDataUrl}
        imageNaturalDimensions={dimensions}
      />
      <GenerateImageDialog
        open={openGenerateImage}
        onOpenChange={setOpenGenerateImage}
        onGenerate={(url) => {
          const newProject = createNewTab("Generated Image");
          setActiveProjectId(newProject.id);
          handleGeneratedImageLoad(url);
        }}
        apiKey={geminiApiKey}
        imageNaturalDimensions={dimensions}
      />
      <ImportPresetsDialog open={openImport} onOpenChange={setOpenImport} />
      <NewProjectDialog
        open={openNewProject}
        onOpenChange={setOpenNewProject}
        onNewProject={(settings) => {
          const newProject = createNewTab(settings.width + 'x' + settings.height);
          setActiveProjectId(newProject.id);
          handleNewProject(settings);
        }}
      />
      <ProjectSettingsDialog
        open={openProjectSettings}
        onOpenChange={setOpenProjectSettings}
        currentDimensions={dimensions}
        currentColorMode={colorMode}
        onUpdateSettings={handleProjectSettingsUpdate}
      />
      <FontManagerDialog
        open={openFontManager}
        onOpenChange={setOpenFontManager}
        systemFonts={systemFonts}
        setSystemFonts={setSystemFonts}
        customFonts={customFonts}
        addCustomFont={addCustomFont}
        removeCustomFont={removeCustomFont}
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
          imgRef={imgRef}
          systemFonts={systemFonts}
          customFonts={customFonts}
          onOpenFontManager={() => setOpenFontManager(true)}
        />
      )}
      <input
        type="file"
        ref={openProjectInputRef}
        onChange={handleProjectFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp, .psd, .psb, .pdf, .ai, .cdr, .nanoedit"
      />
    </div>
  );
};

export default Index;