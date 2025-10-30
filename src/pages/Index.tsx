import * as React from "react";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";
import { EditorHeader } from "@/components/layout/EditorHeader";
import Sidebar from "@/components/layout/Sidebar";
import { NewProjectDialog } from "@/components/editor/NewProjectDialog";
import { ExportOptions } from "@/components/editor/ExportOptions";
import { SettingsDialog } from "@/components/layout/SettingsDialog";
import { GenerateImageDialog } from "@/components/editor/GenerateImageDialog";
import { GenerativeDialog } from "@/components/editor/GenerativeDialog";
import { ProjectSettingsDialog } from "@/components/editor/ProjectSettingsDialog";
import { SmartObjectEditor } from "@/components/editor/SmartObjectEditor";
import { useHotkeys } from "react-hotkeys-hook";
import { useIsMobile } from "@/hooks/use-mobile";
import { ImportPresetsDialog } from "@/components/editor/ImportPresetsDialog";
import { CustomFontLoader } from "@/components/editor/CustomFontLoader";
import { FontManagerDialog } from "@/components/editor/FontManagerDialog";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLocation } from "react-router-dom";
import { fetchCommunityTemplates } from "@/utils/templateApi";
import { showError } from "@/utils/toast";
import LayersPanel from "@/components/editor/LayersPanel"; // Import LayersPanel
import LeftSidebar from "@/components/layout/LeftSidebar"; // Import LeftSidebar
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"; // Import Resizable components
import type { Point } from "@/types/editor"; // Import Point type

export const Index = () => {
  const logic = useEditorLogic();
  const {
    image, dimensions, fileInfo, exifData, layers, selectedLayerId, selectedLayer,
    activeTool, setActiveTool, brushState, setBrushState, gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType, selectionPath, setSelectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl,
    selectiveBlurAmount, setSelectiveBlurAmount, customHslColor, setCustomHslColor,
    selectionSettings, setSelectionSettings,
    currentEditState, updateCurrentState,
    cloneSourcePoint,
    
    // History
    history, currentHistoryIndex, recordHistory, undo, redo, canUndo, canRedo,
    setCurrentEditState, setLayers, setCurrentHistoryIndex,
    historyBrushSourceIndex, setHistoryBrushSourceIndex,
    
    // Layer Management
    smartObjectEditingId, openSmartObjectEditor, closeSmartObjectEditor, saveSmartObjectChanges,
    updateLayer, commitLayerChange, handleLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit,
    handleToggleVisibility, renameLayer, deleteLayer, duplicateLayer, mergeLayerDown, rasterizeLayer, createSmartObject,
    handleAddTextLayer, handleAddDrawingLayer, handleAddLayerFromBackground, handleLayerFromSelection, handleAddShapeLayer, handleAddGradientLayer, addAdjustmentLayer,
    groupLayers, toggleGroupExpanded, handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd, // ADDED
    handleLayerDelete, reorderLayers, onSelectLayer: onSelectLayerFromLogic,
    removeLayerMask, invertLayerMask, toggleClippingMask, toggleLayerLock, handleDeleteHiddenLayers,
    handleRasterizeSmartObject, handleConvertSmartObjectToLayers, handleExportSmartObjectContents, handleArrangeLayer,
    applySelectionAsMask, handleDestructiveOperation, // ADDED
    
    // Adjustments
    adjustments, onAdjustmentChange, onAdjustmentCommit, effects, onEffectChange, onEffectCommit,
    grading, onGradingChange, onGradingCommit, hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit,
    curves, onCurvesChange, onCurvesCommit, selectedFilter, onFilterChange, channels, onChannelChange,
    transforms, onTransformChange, rotation, onRotationChange, onRotationCommit,
    crop, onCropChange, onCropComplete, onAspectChange, aspect,
    frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit,
    
    // Presets
    presets, handleApplyPreset, handleSavePreset, deletePreset,
    gradientPresets, saveGradientPreset, deleteGradientPreset,
    
    // Project & IO
    handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate,
    handleExport, handleCopy, handleProjectSettingsUpdate,
    
    // AI
    geminiApiKey, handleGenerateImage, handleGenerativeFill,
    
    // Workspace
    hasImage, hasActiveSelection,
    workspaceZoom, handleWheel, handleFitScreen, handleZoomIn, handleZoomOut,
    isMouseOverImage, setIsMouseOverImage,
    gradientStart, gradientCurrent,
    marqueeStart, marqueeCurrent,
    handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp,
    clearSelectionState,
    isPreviewingOriginal, setIsPreviewingOriginal,
    
    // Refs/External
    workspaceRef, imgRef,
    systemFonts, setSystemFonts, customFonts, addCustomFont, removeCustomFont,
    setZoom,
    handleSwapColors, // Destructure handleSwapColors
  } = logic;

  const isMobile = useIsMobile();
  const location = useLocation();
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = React.useState(false);
  const [isExportOpen, setIsExportOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = React.useState(false);
  const [isGenerativeFillOpen, setIsGenerativeFillOpen] = React.useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = React.useState(false);
  const [isFontManagerOpen, setIsFontManagerOpen] = React.useState(false);

  // --- Template Loading from Community Page ---
  React.useEffect(() => {
    const templateDataString = sessionStorage.getItem('nanoedit-template-data');
    if (templateDataString) {
      try {
        const template = JSON.parse(templateDataString);
        handleLoadTemplate(template);
        sessionStorage.removeItem('nanoedit-template-data');
      } catch (e) {
        showError("Failed to load template data.");
      }
    }
  }, [location.pathname, handleLoadTemplate]);

  // --- Fullscreen Toggle ---
  const handleToggleFullscreen = React.useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // --- Brush State Update (Partial) ---
  const setBrushStatePartial = React.useCallback((updates: Partial<Omit<typeof brushState, 'color'>>) => {
    setBrushState(prev => ({ ...prev, ...updates }));
  }, [setBrushState]);

  // --- Props for Sidebars and Workspace ---
  const sidebarProps = {
    // ... (all props passed to Sidebar)
    hasImage, activeTool, selectedLayerId, selectedLayer, layers, imgRef, onSelectLayer: onSelectLayerFromLogic, onReorder: reorderLayers, toggleLayerVisibility: handleToggleVisibility, renameLayer, deleteLayer, onDuplicateLayer: duplicateLayer, onMergeLayerDown: mergeLayerDown, onRasterizeLayer: rasterizeLayer, onCreateSmartObject: createSmartObject, onOpenSmartObject: openSmartObjectEditor, onLayerUpdate: updateLayer, onLayerCommit: commitLayerChange, onLayerPropertyCommit: handleLayerPropertyCommit, onLayerOpacityChange: handleLayerOpacityChange, onLayerOpacityCommit: handleLayerOpacityCommit, addTextLayer: (coords: Point, color: string) => handleAddTextLayer(coords, color), addDrawingLayer: handleAddDrawingLayer, onAddLayerFromBackground: handleAddLayerFromBackground, onLayerFromSelection: handleLayerFromSelection, addShapeLayer: (coords: Point, shapeType: any, initialWidth: any, initialHeight: any) => handleAddShapeLayer(coords, shapeType, initialWidth, initialHeight, foregroundColor, backgroundColor), addGradientLayer: handleAddGradientLayer, onAddAdjustmentLayer: addAdjustmentLayer, selectedShapeType, groupLayers, toggleGroupExpanded, onRemoveLayerMask: removeLayerMask, onInvertLayerMask: invertLayerMask, onToggleClippingMask: toggleClippingMask, onToggleLayerLock: toggleLayerLock, onDeleteHiddenLayers: handleDeleteHiddenLayers, onRasterizeSmartObject: handleRasterizeSmartObject, onConvertSmartObjectToLayers: handleConvertSmartObjectToLayers, onExportSmartObjectContents: handleExportSmartObjectContents, onArrangeLayer: handleArrangeLayer, hasActiveSelection, onApplySelectionAsMask: applySelectionAsMask, handleDestructiveOperation, adjustments, onAdjustmentChange, onAdjustmentCommit, effects, onEffectChange, onEffectCommit, grading, onGradingChange, onGradingCommit, hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, curves, onCurvesChange, onCurvesCommit, onFilterChange, selectedFilter, onTransformChange, rotation, onRotationChange, onRotationCommit, onAspectChange, aspect, frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, presets, onApplyPreset: handleApplyPreset, onSavePreset: handleSavePreset, onDeletePreset: deletePreset, gradientToolState, setGradientToolState, gradientPresets, onSaveGradientPreset: saveGradientPreset, onDeleteGradientPreset: deleteGradientPreset, brushState, setBrushState: setBrushStatePartial, selectiveBlurAmount, onSelectiveBlurAmountChange: setSelectiveBlurAmount, onSelectiveBlurAmountCommit: (value: number) => recordHistory("Change Selective Blur Strength", currentEditState, layers), customHslColor, setCustomHslColor, systemFonts, customFonts, onOpenFontManager: () => setIsFontManagerOpen(true), cloneSourcePoint, selectionSettings, onSelectionSettingChange: (key, value) => setSelectionSettings(prev => ({ ...prev, [key]: value })), onSelectionSettingCommit: (key, value) => recordHistory(`Set Selection Setting ${String(key)}`, currentEditState, layers), history, currentHistoryIndex, onHistoryJump: (index: number) => { setCurrentEditState(history[index].state); setLayers(history[index].layers); setCurrentHistoryIndex(index); }, onUndo: undo, onRedo: redo, canUndo, canRedo, historyBrushSourceIndex, setHistoryBrushSourceIndex, foregroundColor, onForegroundColorChange: setForegroundColor, backgroundColor, onBackgroundColorChange: setBackgroundColor, onSwapColors: handleSwapColors, dimensions, fileInfo, exifData, colorMode: currentEditState.colorMode, zoom: workspaceZoom, onZoomIn: handleZoomIn, onZoomOut: handleZoomOut, onFitScreen: handleFitScreen, channels: currentEditState.channels, onChannelChange: onChannelChange, LayersPanel,
  };

  const leftSidebarProps = {
    activeTool, setActiveTool, selectedShapeType, setSelectedShapeType,
    foregroundColor, onForegroundColorChange: setForegroundColor, backgroundColor, onBackgroundColorChange: setBackgroundColor, onSwapColors: handleSwapColors,
    brushState, setBrushState: setBrushStatePartial, selectiveBlurAmount, onSelectiveBlurStrengthChange: setSelectiveBlurAmount, onSelectiveBlurStrengthCommit: (value: number) => recordHistory("Change Selective Blur Strength", currentEditState, layers),
  };

  const editorWorkspaceProps = {
    workspaceRef, imgRef, image, dimensions, currentEditState, layers, selectedLayerId, activeTool, brushState, foregroundColor, backgroundColor, gradientToolState, selectionPath, selectionMaskDataUrl, selectiveBlurMask: currentEditState.selectiveBlurMask, selectiveBlurAmount, marqueeStart, marqueeCurrent, gradientStart, gradientCurrent, cloneSourcePoint, onCropChange, onCropComplete, handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp, handleWheel, setIsMouseOverImage, handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd, handleAddDrawingLayer, setSelectionPath, setSelectionMaskDataUrl, clearSelectionState, updateCurrentState, updateLayer, commitLayerChange, workspaceZoom, handleFitScreen, handleZoomIn, handleZoomOut, isPreviewingOriginal,
  };

  // --- Render Logic ---

  if (smartObjectEditingId) {
    const smartObjectLayer = layers.find(l => l.id === smartObjectEditingId);
    if (smartObjectLayer && smartObjectLayer.type === 'smart-object') {
      return (
        <SmartObjectEditor
          layer={smartObjectLayer}
          onClose={closeSmartObjectEditor}
          onSave={saveSmartObjectChanges}
          foregroundColor={foregroundColor}
          backgroundColor={backgroundColor}
          selectedShapeType={selectedShapeType}
          brushState={brushState}
          gradientToolState={gradientToolState}
          setBrushState={setBrushState}
          setGradientToolState={setGradientToolState}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          setSelectedShapeType={setSelectedShapeType}
          zoom={workspaceZoom}
          setZoom={setZoom}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          handleFitScreen={handleFitScreen}
        />
      );
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-background">
      <CustomFontLoader customFonts={customFonts} />
      
      <EditorHeader
        logic={logic}
        setIsNewProjectOpen={setIsNewProjectOpen}
        setIsExportOpen={setIsExportOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        setIsImportOpen={setIsImportOpen}
        setIsGenerateOpen={setIsGenerateOpen}
        setIsGenerativeFillOpen={setIsGenerativeFillOpen}
        setIsProjectSettingsOpen={setIsProjectSettingsOpen}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      <main className="flex flex-1 min-h-0">
        {isMobile ? (
          <>
            {/* Mobile Layout: Tools Panel is hidden, Sidebar is full width */}
            <EditorWorkspace {...editorWorkspaceProps} />
            <aside className="w-full h-full border-l bg-sidebar">
              <Sidebar {...sidebarProps} />
            </aside>
          </>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="w-full h-full">
            {/* Left Sidebar Panel */}
            <ResizablePanel defaultSize={15} minSize={10} maxSize={20} className="shrink-0">
              <LeftSidebar {...leftSidebarProps} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            
            {/* Workspace Panel */}
            <ResizablePanel defaultSize={65} minSize={40}>
              <EditorWorkspace {...editorWorkspaceProps} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            
            {/* Right Sidebar Panel */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="shrink-0 border-l bg-sidebar">
              <Sidebar {...sidebarProps} />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </main>

      {/* Dialogs */}
      <NewProjectDialog
        open={isNewProjectOpen}
        onOpenChange={setIsNewProjectOpen}
        onNewProject={handleNewProject}
      />
      <ExportOptions
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        onExport={handleExport}
        dimensions={dimensions}
      />
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
      <ImportPresetsDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
      />
      <GenerateImageDialog
        open={isGenerateOpen}
        onOpenChange={setIsGenerateOpen}
        onGenerate={handleGenerateImage}
        apiKey={geminiApiKey}
        imageNaturalDimensions={dimensions}
      />
      <GenerativeDialog
        open={isGenerativeFillOpen}
        onOpenChange={setIsGenerativeFillOpen}
        onApply={handleGenerativeFill}
        apiKey={geminiApiKey}
        originalImage={image}
        selectionPath={selectionPath}
        selectionMaskDataUrl={selectionMaskDataUrl}
        imageNaturalDimensions={dimensions}
      />
      <ProjectSettingsDialog
        open={isProjectSettingsOpen}
        onOpenChange={setIsProjectSettingsOpen}
        currentDimensions={dimensions}
        currentColorMode={currentEditState.colorMode}
        onUpdateSettings={handleProjectSettingsUpdate}
      />
      <FontManagerDialog
        open={isFontManagerOpen}
        onOpenChange={setIsFontManagerOpen}
        systemFonts={systemFonts}
        setSystemFonts={setSystemFonts}
        customFonts={customFonts}
        addCustomFont={addCustomFont}
        removeCustomFont={removeCustomFont}
      />
    </div>
  );
};