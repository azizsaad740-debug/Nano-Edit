"use client";

import * as React from "react";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { EditorHeader } from "@/components/layout/EditorHeader";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";
import { RightSidebarTabs } from "@/components/layout/RightSidebarTabs";
import { BottomSidebarTabs } from "@/components/layout/BottomSidebarTabs";
import { NewProjectDialog } from "@/components/editor/NewProjectDialog";
import { ExportDialog } from "@/components/editor/ExportDialog";
import { ProjectSettingsDialog } from "@/components/editor/ProjectSettingsDialog";
import { SettingsDialog } from "@/components/layout/SettingsDialog";
import { ImportDialog } from "@/components/editor/ImportDialog";
import { GenerativeFillDialog } from "@/components/ai/GenerativeFillDialog";
import { GenerateImageDialog } from "@/components/ai/GenerateImageDialog";
import { FontManagerDialog } from "@/components/editor/FontManagerDialog";
import { cn } from "@/lib/utils";
import { EditorContext } from "@/context/EditorContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { useZoomFit } from "@/hooks/useZoomFit";
import { useMarqueeToolInteraction } from "@/hooks/useMarqueeToolInteraction";
import { useLassoToolInteraction } from "@/hooks/useLassoToolInteraction";
import { useMagicWandToolInteraction } from "@/hooks/useMagicWandToolInteraction";
import { useObjectSelectToolInteraction } from "@/hooks/useObjectSelectToolInteraction";
import { useGradientToolInteraction } from "@/hooks/useGradientToolInteraction";
import { useBrushToolInteraction } from "@/hooks/useBrushToolInteraction";
import { useMoveToolInteraction } from "@/hooks/useMoveToolInteraction";
import { useTextToolInteraction } from "@/hooks/useTextToolInteraction";
import { useShapeToolInteraction } from "@/hooks/useShapeToolInteraction";
import { useEyedropperToolInteraction } from "@/hooks/useEyedropperToolInteraction";
import { useHandToolInteraction } from "@/hooks/useHandToolInteraction";
import { useZoomToolInteraction } from "@/hooks/useZoomToolInteraction";
import { useCloneStampToolInteraction } from "@/hooks/useCloneStampToolInteraction";
import { useHistoryBrushToolInteraction } from "@/hooks/useHistoryBrushToolInteraction";
import { useSelectiveRetouchToolInteraction } from "@/hooks/useSelectiveRetouchToolInteraction"; // FIX 15: Added import

interface IndexPageProps {
  initialImage?: string;
}

export const IndexPage: React.FC<IndexPageProps> = ({ initialImage }) => {
  const editorLogic = useEditorLogic({ initialImage }); // FIX 10, 14, 18, 20, 22, 24: Renamed to editorLogic
  const {
    workspaceRef,
    imgRef,
    image,
    dimensions,
    layers,
    selectedLayerId,
    selectedLayerIds,
    activeTool,
    setActiveTool,
    currentEditState,
    zoom, // FIX 125: Destructure 'zoom'
    setZoom,
    handleZoomIn,
    handleZoomOut,
    handleFitScreen,
    handleWorkspaceMouseDown,
    handleWorkspaceMouseMove,
    handleWorkspaceMouseUp,
    handleWheel,
    setMarqueeStart,
    setMarqueeCurrent,
    setGradientStart,
    setGradientCurrent,
    setCloneSourcePoint,
    selectionPath,
    selectionMaskDataUrl,
    brushState,
    foregroundColor,
    backgroundColor,
    cloneSourcePoint,
    gradientToolState,
    updateLayer,
    commitLayerChange,
    setSelectedLayerId,
    handleDrawingStrokeEnd,
    handleSelectionBrushStrokeEnd,
    handleHistoryBrushStrokeEnd,
    handleSelectiveRetouchStrokeEnd, // FIX 15, 17: Destructure handler
    addGradientLayer: addGradientLayerWithArgs,
    addTextLayer: addTextLayerFn, // FIX 12: Renamed to avoid redeclaration
    addShapeLayer: addShapeLayerFn, // FIX 16: Renamed to avoid redeclaration
    base64Image, // FIX 42, 44, 46-49, 54: Destructure baseImageSrc
    historyImageSrc,
    onCropChange,
    onCropComplete,
    onLayerReorder,
    onSelectLayer,
    toggleLayerVisibility,
    renameLayer,
    onLayerOpacityCommit, // FIX 38: Destructure
    handleApplyPreset, // FIX 91: Destructure
    deletePreset, // FIX 91: Destructure
    deleteGradientPreset, // FIX 91: Destructure
    onOpenSmartObject,
    handleSavePresetCommit, // FIX 92: Destructure correct name
    saveGradientPreset,
    onOpenFontManager,
    setIsSettingsOpen,
    setIsFullscreen,
    isFullscreen,
    handleProjectSettingsUpdate,
    clearSelectionState,
    
    // Dialog State (FIX 115-122: Destructure state variables)
    isNewProjectOpen, setIsNewProjectOpen,
    isExportOpen, setIsExportOpen,
    isProjectSettingsOpen, setIsProjectSettingsOpen,
    isImportOpen, setIsImportOpen,
    isGenerateOpen, setIsGenerateOpen,
    isGenerativeFillOpen, setIsGenerativeFillOpen,
    isFontManagerOpen, setIsFontManagerOpen,
    isSettingsOpen,
    isMobile, setIsMobile, // FIX 112: Destructure
    
    // History/Edit State for Keyboard Shortcuts (FIX 111)
    undo, redo, canUndo, canRedo,
    handleCopy, handleSwapColors, handleLayerDelete, handleDestructiveOperation,
    onApplySelectionAsMask, onToggleLayerLock, onToggleClippingMask, onInvertLayerMask,
    onRemoveLayerMask, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers,
    onAddLayerFromBackground, onLayerFromSelection,
    rotation: editorLogic.rotation, // Pass rotation explicitly
    crop: editorLogic.crop, // Pass crop explicitly
    aspect: editorLogic.aspect, // Pass aspect explicitly
    
  } = editorLogic;

  // --- Tool Interactions (Fixing prop passing) ---
  
  // 1. Marquee Tools
  useMarqueeToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool, // FIX 39: Added missing props
    marqueeStart: editorLogic.marqueeStart, marqueeCurrent: editorLogic.marqueeCurrent,
    setMarqueeStart, setMarqueeCurrent, setSelectionPath: editorLogic.setSelectionPath,
    setSelectionMaskDataUrl: editorLogic.setSelectionMaskDataUrl,
    clearSelectionState,
  });

  // 2. Lasso Tools
  useLassoToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool, // FIX 40: Added missing props
    selectionPath, setSelectionPath: editorLogic.setSelectionPath,
    setSelectionMaskDataUrl: editorLogic.setSelectionMaskDataUrl,
    clearSelectionState,
  });

  // 3. Magic Wand
  useMagicWandToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool, // FIX 41: Added missing props
    setSelectionMaskDataUrl: editorLogic.setSelectionMaskDataUrl,
    baseImageSrc, // FIX 42
    clearSelectionState,
  });

  // 4. Object Select
  useObjectSelectToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool, // FIX 43: Added missing props
    setSelectionMaskDataUrl: editorLogic.setSelectionMaskDataUrl,
    baseImageSrc, // FIX 44
    clearSelectionState,
  });

  // 5. Gradient Tool
  useGradientToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool, // FIX 45: Added missing props
    gradientStart: editorLogic.gradientStart, gradientCurrent: editorLogic.gradientCurrent,
    setGradientStart, setGradientCurrent,
    addGradientLayer: addGradientLayerWithArgs,
  });

  // 6. Brush Tools (Drawing, Eraser, Selection Brush)
  useBrushToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool, // FIX 35: Added missing props
    brushState,
    selectedLayerId,
    foregroundColor,
    handleDrawingStrokeEnd,
    handleSelectionBrushStrokeEnd,
    baseImageSrc, // FIX 46
  });

  // 7. Selective Retouch Tools (Blur/Sharpen)
  useSelectiveRetouchToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool, // FIX 37: Added missing props
    brushState,
    handleSelectiveRetouchStrokeEnd, // FIX 15, 17: Correct usage
    baseImageSrc, // FIX 47
  });

  // 8. Clone Stamp Tool
  useCloneStampToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool, // FIX 36: Added missing props
    brushState,
    selectedLayerId,
    cloneSourcePoint,
    setCloneSourcePoint,
    handleDrawingStrokeEnd,
    baseImageSrc, // FIX 49
  });

  // 9. History Brush Tool
  useHistoryBrushToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool, // FIX 36: Added missing props
    brushState,
    selectedLayerId,
    handleHistoryBrushStrokeEnd,
    historyImageSrc,
  });

  // 10. Move Tool
  useMoveToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool, // FIX 50: Added missing props
    layers, selectedLayerIds,
    updateLayer, commitLayerChange,
    onSelectLayer,
    zoom, // Use 'zoom' instead of 'workspaceZoom'
  });

  // 11. Text Tool
  useTextToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool, // FIX 51: Added missing props
    foregroundColor,
    addTextLayer: addTextLayerFn,
    zoom,
  });

  // 12. Shape Tool
  useShapeToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool, // FIX 52: Added missing props
    foregroundColor,
    backgroundColor,
    addShapeLayer: addShapeLayerFn,
    zoom,
  });

  // 13. Eyedropper Tool
  useEyedropperToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool, // FIX 53: Added missing props
    baseImageSrc, // FIX 54
    foregroundColor: editorLogic.foregroundColor,
    setForegroundColor: editorLogic.setForegroundColor,
  });

  // 14. Hand Tool
  useHandToolInteraction({
    workspaceRef, activeTool,
    zoom, // FIX 109: Added zoom
    imageContainerRef: workspaceRef, // FIX 109: Assuming workspaceRef is sufficient for imageContainerRef
  });

  // 15. Zoom Tool
  useZoomToolInteraction({
    workspaceRef, activeTool,
    handleZoomIn, handleZoomOut,
    zoom, // FIX 110: Added zoom
    imageContainerRef: workspaceRef, // FIX 110: Assuming workspaceRef is sufficient
  });

  // --- Global Effects ---
  // FIX 55: Pass required functions explicitly to useKeyboardShortcuts
  useKeyboardShortcuts({
    activeTool, setActiveTool,
    onUndo: undo, onRedo: redo, canUndo, canRedo,
    onZoomIn: handleZoomIn, onZoomOut: handleZoomOut, onFitScreen: handleFitScreen,
    onCopy: handleCopy, onSwapColors: handleSwapColors, onLayerDelete: handleLayerDelete,
    onFillSelection: () => handleDestructiveOperation('fill'),
    onDeleteSelection: () => handleDestructiveOperation('delete'),
    onDeselect: clearSelectionState,
    onApplySelectionAsMask, onToggleLayerLock, onToggleClippingMask, onInvertLayerMask,
    onRemoveLayerMask, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers,
    onAddLayerFromBackground, onLayerFromSelection, onAddTextLayer: editorLogic.addTextLayer,
    onAddShapeLayer: editorLogic.addShapeLayer, onAddGradientLayer: editorLogic.addGradientLayerNoArgs,
    rotation: editorLogic.rotation,
    crop: editorLogic.crop,
    aspect: editorLogic.aspect,
  });
  
  useMobileDetection(setIsMobile); // FIX 112: Use destructured setIsMobile
  useResizeObserver(workspaceRef, dimensions, setZoom, handleFitScreen);
  useZoomFit(workspaceRef, dimensions, editorLogic.rotation, editorLogic.crop, editorLogic.aspect, handleFitScreen);

  // --- Layout Rendering ---
  const rightSidebarTabs = editorLogic.panelLayout.filter(t => t.location === 'right' && t.visible);
  const bottomSidebarTabs = editorLogic.panelLayout.filter(t => t.location === 'bottom' && t.visible);

  const rightSidebarWidth = rightSidebarTabs.length > 0 ? 280 : 0;
  const bottomSidebarHeight = bottomSidebarTabs.length > 0 ? 250 : 0;

  return (
    <EditorContext.Provider value={editorLogic}>
      <div className={cn("flex flex-col h-screen w-screen overflow-hidden", isFullscreen && "fixed inset-0 z-[9999]")}>
        <EditorHeader />
        <div className="flex flex-1 overflow-hidden">
          {/* Main Content Area */}
          <main
            className="flex-1 relative overflow-hidden"
            style={{
              width: `calc(100% - ${rightSidebarWidth}px)`,
              height: `calc(100% - ${bottomSidebarHeight}px)`,
            }}
          >
            <EditorWorkspace
              workspaceRef={workspaceRef}
              imgRef={imgRef}
              image={image}
              dimensions={dimensions}
              currentEditState={currentEditState}
              layers={layers}
              selectedLayerId={selectedLayerId}
              activeTool={activeTool}
              workspaceZoom={zoom} // Use 'zoom'
              selectionMaskDataUrl={selectionMaskDataUrl}
              selectionPath={editorLogic.selectionPath}
              marqueeStart={editorLogic.marqueeStart}
              marqueeCurrent={editorLogic.marqueeCurrent}
              gradientStart={editorLogic.gradientStart}
              gradientCurrent={editorLogic.gradientCurrent}
              brushState={brushState}
              foregroundColor={foregroundColor}
              backgroundColor={backgroundColor}
              cloneSourcePoint={cloneSourcePoint}
              isPreviewingOriginal={editorLogic.isPreviewingOriginal}
              gradientToolState={gradientToolState}
              
              handleWorkspaceMouseDown={handleWorkspaceMouseDown}
              handleWorkspaceMouseMove={handleWorkspaceMouseMove}
              handleWorkspaceMouseUp={handleWorkspaceMouseUp}
              handleWheel={handleWheel}
              setIsMouseOverImage={editorLogic.setIsMouseOverImage}
              handleZoomIn={handleZoomIn}
              handleZoomOut={handleZoomOut}
              handleFitScreen={handleFitScreen}
              onCropChange={onCropChange}
              onCropComplete={onCropComplete}
              handleDrawingStrokeEnd={handleDrawingStrokeEnd}
              handleSelectionBrushStrokeEnd={handleSelectionBrushStrokeEnd}
              handleSelectiveRetouchStrokeEnd={handleSelectiveRetouchStrokeEnd} // FIX 15, 17
              handleHistoryBrushStrokeEnd={handleHistoryBrushStrokeEnd}
              addGradientLayer={addGradientLayerWithArgs}
              addTextLayer={addTextLayerFn}
              addShapeLayer={addShapeLayerFn}
              setMarqueeStart={setMarqueeStart}
              setMarqueeCurrent={setMarqueeCurrent}
              setGradientStart={setGradientStart}
              setGradientCurrent={setGradientCurrent}
              setCloneSourcePoint={setCloneSourcePoint}
              updateLayer={updateLayer}
              commitLayerChange={commitLayerChange}
              setSelectedLayerId={setSelectedLayerId}
              base64Image={base64Image}
              historyImageSrc={historyImageSrc}
              recordHistory={editorLogic.recordHistory}
              setSelectionMaskDataUrl={editorLogic.setSelectionMaskDataUrl}
            />
          </main>

          {/* Right Sidebar */}
          {rightSidebarTabs.length > 0 && (
            <aside className="w-72 border-l bg-background/90 flex flex-col">
              <RightSidebarTabs
                layers={layers}
                currentEditState={currentEditState}
                panelLayout={editorLogic.panelLayout}
                activeRightTab={editorLogic.activeRightTab}
                setActiveRightTab={editorLogic.setActiveRightTab}
                activeBottomTab={editorLogic.activeBottomTab}
                setActiveBottomTab={editorLogic.setActiveBottomTab}
                toggleLayerVisibility={toggleLayerVisibility}
                renameLayer={renameLayer}
                onLayerOpacityCommit={onLayerOpacityCommit} // FIX 38
                onOpenSmartObject={onOpenSmartObject}
                onLayerReorder={onLayerReorder}
                onApplyPreset={handleApplyPreset} // FIX 91
                onSavePreset={handleSavePresetCommit}
                onDeletePreset={deletePreset} // FIX 91
                onSaveGradientPreset={saveGradientPreset} // FIX 113
                onDeleteGradientPreset={deleteGradientPreset} // FIX 91
                addGradientLayer={addGradientLayerWithArgs}
                onOpenFontManager={onOpenFontManager}
                onOpenSettings={() => setIsSettingsOpen(true)}
                clearSelectionState={clearSelectionState} // FIX 124
              />
            </aside>
          )}
        </div>

        {/* Bottom Sidebar */}
        {bottomSidebarTabs.length > 0 && (
          <footer
            className="h-[250px] border-t bg-background/90"
            style={{ marginRight: rightSidebarWidth }}
          >
            <BottomSidebarTabs
              currentEditState={currentEditState}
              updateCurrentState={editorLogic.updateCurrentState}
              recordHistory={editorLogic.recordHistory}
              layers={layers}
              selectedLayerId={selectedLayerId}
              activeBottomTab={editorLogic.activeBottomTab}
              setActiveBottomTab={editorLogic.setActiveBottomTab}
              onSelectionSettingChange={editorLogic.onSelectionSettingChange}
              onSelectionSettingCommit={editorLogic.onSelectionSettingCommit}
              onSelectiveBlurAmountCommit={editorLogic.onSelectiveBlurAmountCommit}
              onSelectiveSharpenAmountCommit={editorLogic.onSelectiveSharpenAmountCommit}
              customHslColor={editorLogic.customHslColor}
              setCustomHslColor={editorLogic.setCustomHslColor}
              onAdjustmentChange={editorLogic.onAdjustmentChange}
              onAdjustmentCommit={editorLogic.onAdjustmentCommit}
              onEffectChange={editorLogic.onEffectChange}
              onEffectCommit={editorLogic.onEffectCommit}
              onGradingChange={editorLogic.onGradingChange}
              onGradingCommit={editorLogic.onGradingCommit}
              onHslAdjustmentChange={editorLogic.onHslAdjustmentChange}
              onHslAdjustmentCommit={editorLogic.onHslAdjustmentCommit}
              onCurvesChange={editorLogic.onCurvesChange}
              onCurvesCommit={editorLogic.onCurvesCommit}
              onTransformChange={editorLogic.onTransformChange}
              onRotationChange={editorLogic.onRotationChange}
              onRotationCommit={editorLogic.onRotationCommit}
              onCropChange={editorLogic.onCropChange}
              onCropComplete={editorLogic.onCropComplete}
              onAspectChange={editorLogic.onAspectChange}
              onFramePresetChange={editorLogic.onFramePresetChange}
              onFramePropertyChange={editorLogic.onFramePropertyChange}
              onFramePropertyCommit={editorLogic.onFramePropertyCommit}
              onFilterChange={editorLogic.onFilterChange}
              onChannelChange={editorLogic.onChannelChange} // FIX 114: Use exported name 'onChannelChange'
              presets={editorLogic.presets}
              gradientPresets={editorLogic.gradientPresets}
              saveGradientPreset={editorLogic.saveGradientPreset}
              deleteGradientPreset={editorLogic.deleteGradientPreset}
              handleApplyPreset={handleApplyPreset}
              handleSavePresetCommit={handleSavePresetCommit}
              deletePreset={deletePreset}
            />
          </footer>
        )}
      </div>

      {/* Dialogs (FIX 115-122: Use destructured state variables) */}
      <NewProjectDialog
        open={isNewProjectOpen}
        onOpenChange={setIsNewProjectOpen}
        onNewProject={editorLogic.handleNewProject}
      />
      <ExportDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        onExport={editorLogic.handleExportClick}
      />
      <ProjectSettingsDialog
        open={isProjectSettingsOpen}
        onOpenChange={setIsProjectSettingsOpen}
        currentDimensions={dimensions}
        currentColorMode={currentEditState.colorMode}
        onUpdateSettings={handleProjectSettingsUpdate}
      />
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
      <ImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onLoadImage={editorLogic.handleImageLoad}
        onLoadProject={editorLogic.handleLoadProject}
        onLoadTemplate={editorLogic.handleLoadTemplate}
      />
      <GenerateImageDialog
        open={isGenerateOpen}
        onOpenChange={setIsGenerateOpen}
        onGenerate={editorLogic.handleGenerateImage}
      />
      <GenerativeFillDialog
        open={isGenerativeFillOpen}
        onOpenChange={setIsGenerativeFillOpen}
        onGenerate={editorLogic.handleGenerativeFill}
        hasActiveSelection={!!selectionMaskDataUrl}
      />
      <FontManagerDialog
        open={isFontManagerOpen}
        onOpenChange={setIsFontManagerOpen}
        systemFonts={editorLogic.systemFonts}
        customFonts={editorLogic.customFonts}
        addCustomFont={editorLogic.addCustomFont}
        removeCustomFont={editorLogic.removeCustomFont}
      />
    </EditorContext.Provider>
  );
};