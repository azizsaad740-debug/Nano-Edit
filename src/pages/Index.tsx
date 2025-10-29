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
    
    // Layer Management
    smartObjectEditingId, openSmartObjectEditor, closeSmartObjectEditor, saveSmartObjectChanges,
    updateLayer, commitLayerChange, handleLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit,
    handleToggleVisibility, renameLayer, deleteLayer, duplicateLayer, mergeLayerDown, rasterizeLayer, createSmartObject,
    handleAddTextLayer, handleAddDrawingLayer, handleAddLayerFromBackground, handleLayerFromSelection, handleAddShapeLayer, handleAddGradientLayer, addAdjustmentLayer,
    groupLayers, toggleGroupExpanded, handleDrawingStrokeEnd, handleLayerDelete, reorderLayers, onSelectLayer: onSelectLayerFromLogic,
    removeLayerMask, invertLayerMask, toggleClippingMask, toggleLayerLock, handleDeleteHiddenLayers,
    handleRasterizeSmartObject, handleConvertSmartObjectToLayers, handleExportSmartObjectContents, handleArrangeLayer,
    applySelectionAsMask, handleSelectionBrushStrokeEnd,
    
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
        {/* Left Sidebar (Tools Panel) */}
        <div className="shrink-0">
          <logic.ToolsPanel
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            selectedShapeType={selectedShapeType}
            setSelectedShapeType={setSelectedShapeType}
            foregroundColor={foregroundColor}
            onForegroundColorChange={setForegroundColor}
            backgroundColor={backgroundColor}
            onBackgroundColorChange={setBackgroundColor}
            onSwapColors={() => {
              setForegroundColor(backgroundColor);
              setBackgroundColor(foregroundColor);
            }}
            brushState={brushState}
            setBrushState={setBrushStatePartial}
            selectiveBlurStrength={selectiveBlurAmount}
            onSelectiveBlurStrengthChange={setSelectiveBlurAmount}
            onSelectiveBlurStrengthCommit={(value) => recordHistory("Change Selective Blur Strength", currentEditState, layers)}
          />
        </div>

        {/* Main Workspace Area */}
        <EditorWorkspace
          workspaceRef={workspaceRef}
          imgRef={imgRef}
          image={image}
          dimensions={dimensions}
          currentEditState={currentEditState}
          layers={layers}
          selectedLayerId={selectedLayerId}
          activeTool={activeTool}
          brushState={brushState}
          foregroundColor={foregroundColor}
          backgroundColor={backgroundColor}
          gradientToolState={gradientToolState}
          selectionPath={selectionPath}
          selectionMaskDataUrl={selectionMaskDataUrl}
          selectiveBlurMask={currentEditState.selectiveBlurMask}
          selectiveBlurAmount={selectiveBlurAmount}
          marqueeStart={marqueeStart}
          marqueeCurrent={marqueeCurrent}
          gradientStart={gradientStart}
          gradientCurrent={gradientCurrent}
          cloneSourcePoint={cloneSourcePoint}
          onCropChange={onCropChange}
          onCropComplete={onCropComplete}
          handleWorkspaceMouseDown={handleWorkspaceMouseDown}
          handleWorkspaceMouseMove={handleWorkspaceMouseMove}
          handleWorkspaceMouseUp={handleWorkspaceMouseUp}
          handleWheel={handleWheel}
          setIsMouseOverImage={setIsMouseOverImage}
          handleDrawingStrokeEnd={handleDrawingStrokeEnd}
          handleSelectionBrushStrokeEnd={handleSelectionBrushStrokeEnd}
          handleAddDrawingLayer={handleAddDrawingLayer}
          setSelectionPath={setSelectionPath}
          setSelectionMaskDataUrl={setSelectionMaskDataUrl}
          clearSelectionState={clearSelectionState}
          updateCurrentState={updateCurrentState}
          updateLayer={updateLayer} // PASSED
          commitLayerChange={commitLayerChange} // PASSED
          workspaceZoom={workspaceZoom}
          handleFitScreen={handleFitScreen}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          isPreviewingOriginal={isPreviewingOriginal}
        />

        {/* Right Sidebar (Adjustments, Layers, Info) */}
        <aside className="w-80 shrink-0 border-l bg-sidebar">
          <Sidebar
            // RightSidebarTabs Props
            hasImage={hasImage}
            activeTool={activeTool}
            selectedLayerId={selectedLayerId}
            selectedLayer={selectedLayer}
            layers={layers}
            imgRef={imgRef}
            onSelectLayer={onSelectLayerFromLogic}
            onReorder={reorderLayers}
            toggleLayerVisibility={handleToggleVisibility}
            renameLayer={renameLayer}
            deleteLayer={deleteLayer}
            onDuplicateLayer={duplicateLayer}
            onMergeLayerDown={mergeLayerDown}
            onRasterizeLayer={rasterizeLayer}
            onCreateSmartObject={createSmartObject}
            onOpenSmartObject={openSmartObjectEditor}
            onLayerUpdate={updateLayer}
            onLayerCommit={commitLayerChange}
            onLayerPropertyCommit={handleLayerPropertyCommit}
            onLayerOpacityChange={handleLayerOpacityChange}
            onLayerOpacityCommit={handleLayerOpacityCommit}
            addTextLayer={(coords, color) => handleAddTextLayer(coords, color)}
            addDrawingLayer={handleAddDrawingLayer}
            onAddLayerFromBackground={handleAddLayerFromBackground}
            onLayerFromSelection={handleLayerFromSelection}
            addShapeLayer={(coords, shapeType, initialWidth, initialHeight) => handleAddShapeLayer(coords, shapeType, initialWidth, initialHeight, foregroundColor, backgroundColor)}
            addGradientLayer={handleAddGradientLayer}
            onAddAdjustmentLayer={addAdjustmentLayer}
            selectedShapeType={selectedShapeType}
            groupLayers={groupLayers}
            toggleGroupExpanded={toggleGroupExpanded}
            onRemoveLayerMask={removeLayerMask}
            onInvertLayerMask={invertLayerMask}
            onToggleClippingMask={toggleClippingMask}
            onToggleLayerLock={toggleLayerLock}
            onDeleteHiddenLayers={handleDeleteHiddenLayers}
            onRasterizeSmartObject={handleRasterizeSmartObject}
            onConvertSmartObjectToLayers={handleConvertSmartObjectToLayers}
            onExportSmartObjectContents={handleExportSmartObjectContents}
            onArrangeLayer={handleArrangeLayer}
            hasActiveSelection={hasActiveSelection}
            onApplySelectionAsMask={applySelectionAsMask}
            // Global Adjustments Props
            adjustments={adjustments}
            onAdjustmentChange={onAdjustmentChange}
            onAdjustmentCommit={onAdjustmentCommit}
            effects={effects}
            onEffectChange={onEffectChange}
            onEffectCommit={onEffectCommit}
            grading={grading}
            onGradingChange={onGradingChange}
            onGradingCommit={onGradingCommit}
            hslAdjustments={hslAdjustments}
            onHslAdjustmentChange={onHslAdjustmentChange}
            onHslAdjustmentCommit={onHslAdjustmentCommit}
            curves={curves}
            onCurvesChange={onCurvesChange}
            onCurvesCommit={onCurvesCommit}
            onFilterChange={onFilterChange}
            selectedFilter={selectedFilter}
            onTransformChange={onTransformChange}
            rotation={rotation}
            onRotationChange={onRotationChange}
            onRotationCommit={onRotationCommit}
            onAspectChange={onAspectChange}
            aspect={aspect}
            frame={frame}
            onFramePresetChange={onFramePresetChange}
            onFramePropertyChange={onFramePropertyChange}
            onFramePropertyCommit={onFramePropertyCommit}
            // Presets
            presets={presets}
            onApplyPreset={handleApplyPreset}
            onSavePreset={handleSavePreset}
            onDeletePreset={deletePreset}
            // Gradient Presets
            gradientToolState={gradientToolState}
            setGradientToolState={setGradientToolState}
            gradientPresets={gradientPresets}
            onSaveGradientPreset={saveGradientPreset}
            onDeleteGradientPreset={deleteGradientPreset}
            // History Props
            history={history}
            currentHistoryIndex={currentHistoryIndex}
            onHistoryJump={(index) => {
              setCurrentEditState(history[index].state);
              setLayers(history[index].layers);
              setCurrentHistoryIndex(index);
            }}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            // Color Props
            foregroundColor={foregroundColor}
            onForegroundColorChange={setForegroundColor}
            backgroundColor={backgroundColor}
            onBackgroundColorChange={setBackgroundColor}
            onSwapColors={() => {
              setForegroundColor(backgroundColor);
              setBackgroundColor(foregroundColor);
            }}
            // Info Props
            dimensions={dimensions}
            fileInfo={fileInfo}
            exifData={exifData}
            colorMode={currentEditState.colorMode}
            // Navigator Props
            zoom={workspaceZoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitScreen={handleFitScreen}
            // Channels Props
            channels={channels}
            onChannelChange={onChannelChange}
            // Brushes Props
            brushState={brushState}
            setBrushState={setBrushStatePartial}
            // Selective Blur
            selectiveBlurAmount={selectiveBlurAmount}
            onSelectiveBlurAmountChange={setSelectiveBlurAmount}
            onSelectiveBlurAmountCommit={(value) => recordHistory("Change Selective Blur Strength", currentEditState, layers)}
            // HSL Custom Color
            customHslColor={customHslColor}
            setCustomHslColor={setCustomHslColor}
            // Font Manager Props
            systemFonts={systemFonts}
            customFonts={customFonts}
            onOpenFontManager={() => setIsFontManagerOpen(true)}
            // Selection Settings
            selectionSettings={selectionSettings}
            onSelectionSettingChange={(key, value) => setSelectionSettings(prev => ({ ...prev, [key]: value }))}
            onSelectionSettingCommit={(key, value) => recordHistory(`Set Selection Setting ${String(key)}`, currentEditState, layers)}
            // Clone Source Point
            cloneSourcePoint={cloneSourcePoint}
            // Layers Panel Component
            LayersPanel={LayersPanel}
          />
        </aside>
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