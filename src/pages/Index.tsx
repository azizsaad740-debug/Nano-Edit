"use client";

import * as React from "react";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { EditorHeader } from "@/components/layout/EditorHeader"; // FIX 10: Now correctly exported
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";
import { RightSidebarTabs } from "@/components/layout/RightSidebarTabs";
import BottomPanel from "@/components/layout/BottomPanel";
import { NewProjectDialog } from "@/components/editor/NewProjectDialog";
import { ExportOptions } from "@/components/editor/ExportOptions";
import { ProjectSettingsDialog } from "@/components/editor/ProjectSettingsDialog";
import { SettingsDialog } from "@/components/layout/SettingsDialog";
import { ImportDialog } from "@/components/editor/ImportDialog";
import { GenerativeDialog as GenerativeFillDialog } from "@/components/editor/GenerativeDialog";
import { GenerateImageDialog } from "@/components/editor/GenerateImageDialog";
import { FontManagerDialog } from "@/components/editor/FontManagerDialog";
import { cn } from "@/lib/utils";
import { EditorContext } from "@/context/EditorContext"; // FIX 11: Context stubbed
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { useZoomFit } from "@/hooks/useZoomFit";
import { useMarqueeToolInteraction } from "@/hooks/useMarqueeToolInteraction"; // FIX 12: Hook stub updated
import { useLassoToolInteraction } from "@/hooks/useLassoToolInteraction"; // FIX 13: Hook stub updated
import { useMagicWandToolInteraction } from "@/hooks/useMagicWandToolInteraction"; // FIX 14: Hook stub updated
import { useObjectSelectToolInteraction } from "@/hooks/useObjectSelectToolInteraction"; // FIX 15: Hook stub updated
import { useGradientToolInteraction } from "@/hooks/useGradientToolInteraction"; // FIX 16: Hook stub updated
import { useBrushToolInteraction } from "@/hooks/useBrushToolInteraction";
import { useMoveToolInteraction } from "@/hooks/useMoveToolInteraction"; // FIX 18: Hook stub updated
import { useTextToolInteraction } from "@/hooks/useTextToolInteraction"; // FIX 19: Hook stub updated
import { useShapeToolInteraction } from "@/hooks/useShapeToolInteraction"; // FIX 20: Hook stub updated
import { useEyedropperToolInteraction } from "@/hooks/useEyedropperToolInteraction"; // FIX 21: Hook stub updated
import { useHandToolInteraction } from "@/hooks/useHandToolInteraction";
import { useZoomToolInteraction } from "@/hooks/useZoomToolInteraction";
import { useCloneStampToolInteraction } from "@/hooks/useCloneStampToolInteraction"; // FIX 17: Hook stub updated
import { useHistoryBrushToolInteraction } from "@/hooks/useHistoryBrushToolInteraction";
import { useSelectiveRetouchToolInteraction } from "@/hooks/useSelectiveRetouchToolInteraction";

interface IndexPageProps {
  initialImage?: string;
}

export const IndexPage: React.FC<IndexPageProps> = ({ initialImage }) => {
  const editorLogic = useEditorLogic({ initialImage });
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
    zoom,
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
    handleSelectiveRetouchStrokeEnd,
    addGradientLayer: addGradientLayerWithArgs,
    addTextLayer: addTextLayerFn,
    addShapeLayer: addShapeLayerFn,
    base64Image: baseImageSrc,
    historyImageSrc,
    onCropChange,
    onCropComplete,
    onLayerReorder,
    onSelectLayer,
    toggleLayerVisibility,
    renameLayer,
    handleLayerOpacityCommit: onLayerOpacityCommit,
    handleApplyPreset,
    deletePreset,
    deleteGradientPreset,
    onOpenSmartObject,
    handleSavePresetCommit,
    saveGradientPreset,
    onOpenFontManager,
    setIsSettingsOpen,
    setIsFullscreen,
    isFullscreen,
    handleProjectSettingsUpdate,
    clearSelectionState,
    
    // Dialog State
    isNewProjectOpen, setIsNewProjectOpen,
    isExportOpen, setIsExportOpen,
    isProjectSettingsOpen, setIsProjectSettingsOpen,
    isImportOpen, setIsImportOpen,
    isGenerateOpen, setIsGenerateOpen,
    isGenerativeFillOpen, setIsGenerativeFillOpen,
    isFontManagerOpen, setIsFontManagerOpen,
    isSettingsOpen,
    isMobile, setIsMobile,
    
    // History/Edit State for Keyboard Shortcuts
    undo, redo, canUndo, canRedo,
    handleCopy, handleSwapColors, handleLayerDelete, handleDestructiveOperation,
    onApplySelectionAsMask, onToggleLayerLock, onToggleClippingMask, onInvertLayerMask,
    onRemoveLayerMask, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers,
    onAddLayerFromBackground, onLayerFromSelection,
    rotation,
    crop,
    aspect,
    
  } = editorLogic;

  // --- Tool Interactions (Fixing prop passing) ---
  
  // 1. Marquee Tools
  useMarqueeToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,
    marqueeStart: editorLogic.marqueeStart, marqueeCurrent: editorLogic.marqueeCurrent,
    setMarqueeStart, setMarqueeCurrent, setSelectionPath: editorLogic.setSelectionPath,
    setSelectionMaskDataUrl: editorLogic.setSelectionMaskDataUrl,
    clearSelectionState,
  });

  // 2. Lasso Tools
  useLassoToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,
    selectionPath, setSelectionPath: editorLogic.setSelectionPath,
    setSelectionMaskDataUrl: editorLogic.setSelectionMaskDataUrl,
    clearSelectionState,
  });

  // 3. Magic Wand
  useMagicWandToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,
    setSelectionMaskDataUrl: editorLogic.setSelectionMaskDataUrl,
    baseImageSrc,
    clearSelectionState,
  });

  // 4. Object Select
  useObjectSelectToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,
    setSelectionMaskDataUrl: editorLogic.setSelectionMaskDataUrl,
    baseImageSrc,
    clearSelectionState,
  });

  // 5. Gradient Tool
  useGradientToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,
    gradientStart: editorLogic.gradientStart, gradientCurrent: editorLogic.gradientCurrent,
    setGradientStart, setGradientCurrent,
    addGradientLayer: addGradientLayerWithArgs,
  });

  // 6. Brush Tools (Drawing, Eraser, Selection Brush)
  useBrushToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,
    brushState,
    selectedLayerId,
    foregroundColor,
    handleDrawingStrokeEnd,
    handleSelectionBrushStrokeEnd,
    baseImageSrc,
  });

  // 7. Selective Retouch Tools (Blur/Sharpen)
  useSelectiveRetouchToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,
    brushState,
    handleSelectiveRetouchStrokeEnd,
    baseImageSrc,
  });

  // 8. Clone Stamp Tool
  useCloneStampToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,
    brushState,
    selectedLayerId,
    cloneSourcePoint,
    setCloneSourcePoint,
    handleDrawingStrokeEnd,
    baseImageSrc,
  });

  // 9. History Brush Tool
  useHistoryBrushToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,
    brushState,
    selectedLayerId,
    handleHistoryBrushStrokeEnd,
    historyImageSrc,
  });

  // 10. Move Tool
  useMoveToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,
    layers, selectedLayerIds,
    updateLayer, commitLayerChange,
    onSelectLayer,
    zoom,
  });

  // 11. Text Tool
  useTextToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,
    foregroundColor,
    addTextLayer: addTextLayerFn,
    zoom,
  });

  // 12. Shape Tool
  useShapeToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,
    foregroundColor,
    backgroundColor,
    addShapeLayer: addShapeLayerFn,
    zoom,
  });

  // 13. Eyedropper Tool
  useEyedropperToolInteraction({
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,
    baseImageSrc,
    foregroundColor: editorLogic.foregroundColor,
    setForegroundColor: editorLogic.setForegroundColor,
  });

  // 14. Hand Tool
  useHandToolInteraction({
    workspaceRef, activeTool,
    zoom,
    imageContainerRef: workspaceRef,
  });

  // 15. Zoom Tool
  useZoomToolInteraction({
    workspaceRef, activeTool,
    handleZoomIn, handleZoomOut,
    zoom,
    imageContainerRef: workspaceRef,
  });

  // --- Global Effects ---
  // Pass required functions explicitly to useKeyboardShortcuts
  useKeyboardShortcuts({
    activeTool, setActiveTool,
    onUndo: undo, onRedo: redo,
    onZoomIn: handleZoomIn, onZoomOut: handleZoomOut, onFitScreen: handleFitScreen,
    onCopy: handleCopy, onSwapColors: handleSwapColors, onLayerDelete: handleLayerDelete, // FIX 22: onLayerDelete added to stub
    onFillSelection: () => handleDestructiveOperation('fill'),
    onDeleteSelection: () => handleDestructiveOperation('delete'),
    onDeselect: clearSelectionState,
    onApplySelectionAsMask, onToggleLayerLock, onToggleClippingMask, onInvertLayerMask,
    onRemoveLayerMask, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers,
    onAddLayerFromBackground, onLayerFromSelection, onAddTextLayer: editorLogic.addTextLayer,
    onAddShapeLayer: editorLogic.addShapeLayer, onAddGradientLayer: editorLogic.addGradientLayerNoArgs,
    rotation,
    crop,
    aspect,
  });
  
  useMobileDetection(setIsMobile);
  useResizeObserver(workspaceRef, dimensions, setZoom, handleFitScreen);
  useZoomFit(workspaceRef, dimensions, rotation, crop, aspect, handleFitScreen);

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
              workspaceZoom={zoom}
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
              handleSelectiveRetouchStrokeEnd={handleSelectiveRetouchStrokeEnd}
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
              base64Image={baseImageSrc}
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
                onLayerOpacityCommit={onLayerOpacityCommit}
                onOpenSmartObject={onOpenSmartObject}
                onLayerReorder={onLayerReorder}
                onApplyPreset={handleApplyPreset}
                onSavePreset={handleSavePresetCommit}
                onDeletePreset={deletePreset}
                onSaveGradientPreset={saveGradientPreset}
                onDeleteGradientPreset={deleteGradientPreset}
                addGradientLayer={addGradientLayerWithArgs}
                onOpenFontManager={onOpenFontManager}
                onOpenSettings={() => setIsSettingsOpen(true)}
                clearSelectionState={clearSelectionState}
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
            <BottomPanel
              // FIX 3: Renamed component to BottomPanel
              // Pass all required props to BottomPanel
              foregroundColor={foregroundColor}
              onForegroundColorChange={editorLogic.setForegroundColor}
              backgroundColor={backgroundColor}
              onBackgroundColorChange={editorLogic.setBackgroundColor}
              onSwapColors={editorLogic.handleSwapColors}
              dimensions={dimensions}
              fileInfo={editorLogic.fileInfo}
              imgRef={imgRef}
              exifData={editorLogic.exifData}
              colorMode={currentEditState.colorMode}
              zoom={zoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitScreen={handleFitScreen}
              hasImage={!!image}
              adjustments={editorLogic.adjustments}
              onAdjustmentChange={editorLogic.onAdjustmentChange}
              onAdjustmentCommit={editorLogic.onAdjustmentCommit}
              grading={editorLogic.grading}
              onGradingChange={editorLogic.onGradingChange}
              onGradingCommit={editorLogic.onGradingCommit}
              hslAdjustments={editorLogic.hslAdjustments}
              onHslAdjustmentChange={editorLogic.onHslAdjustmentChange}
              onHslAdjustmentCommit={editorLogic.onHslAdjustmentCommit}
              curves={editorLogic.curves}
              onCurvesChange={editorLogic.onCurvesChange}
              onCurvesCommit={editorLogic.onCurvesCommit}
              customHslColor={editorLogic.customHslColor}
              setCustomHslColor={editorLogic.setCustomHslColor}
              geminiApiKey={editorLogic.geminiApiKey}
              base64Image={baseImageSrc}
              onImageResult={editorLogic.handleGenerateImage}
              onMaskResult={editorLogic.handleMaskResult}
              onOpenSettings={() => setIsSettingsOpen(true)}
              panelLayout={editorLogic.panelLayout}
              reorderPanelTabs={editorLogic.reorderPanelTabs}
              activeBottomTab={editorLogic.activeBottomTab}
              setActiveBottomTab={editorLogic.setActiveBottomTab}
              isGuest={editorLogic.isGuest}
            />
          </footer>
        )}
      </div>

      {/* Dialogs */}
      <NewProjectDialog
        open={isNewProjectOpen}
        onOpenChange={setIsNewProjectOpen}
        onNewProject={editorLogic.handleNewProject}
      />
      <ExportOptions
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        onExport={editorLogic.handleExportClick}
        dimensions={dimensions}
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
        apiKey={editorLogic.geminiApiKey}
        imageNaturalDimensions={dimensions}
        isGuest={editorLogic.isGuest}
      />
      <GenerativeFillDialog
        open={isGenerativeFillOpen}
        onOpenChange={setIsGenerativeFillOpen}
        onApply={editorLogic.handleGenerativeFill}
        apiKey={editorLogic.geminiApiKey}
        originalImage={image}
        selectionPath={selectionPath}
        selectionMaskDataUrl={selectionMaskDataUrl}
        imageNaturalDimensions={dimensions}
        isGuest={editorLogic.isGuest}
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