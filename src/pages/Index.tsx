import * as React from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";
import LeftSidebar from "@/components/layout/LeftSidebar";
import Sidebar from "@/components/layout/Sidebar";
import BottomPanel from "@/components/layout/BottomPanel";
import { MobileToolBar } from "@/components/mobile/MobileToolBar";
import { MobileToolOptions } from "@/components/mobile/MobileToolOptions";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { EditorHeader } from "@/components/layout/EditorHeader";
import { SettingsDialog } from "@/components/layout/SettingsDialog";
import { NewProjectDialog, NewProjectSettings } from "@/components/editor/NewProjectDialog";
import { ExportOptions } from "@/components/editor/ExportOptions";
import { ImportPresetsDialog } from "@/components/editor/ImportPresetsDialog";
import { GenerateImageDialog } from "@/components/editor/GenerateImageDialog";
import { GenerativeDialog } from "@/components/editor/GenerativeDialog";
import { ProjectSettingsDialog } from "@/components/editor/ProjectSettingsDialog";
import { FontManagerDialog } from "@/components/editor/FontManagerDialog";
import { SavePresetDialog } from "@/components/editor/SavePresetDialog";
import { SaveGradientPresetDialog } from "@/components/editor/SaveGradientPresetDialog";
import { SmartObjectEditor } from "@/components/editor/SmartObjectEditor";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { showError } from "@/utils/toast";
import { LayersPanel } from "@/components/editor/LayersPanel"; // Import the actual LayersPanel
import { useSession } from "../integrations/supabase/session-provider"; // ADDED

const Index: React.FC = () => {
  const logic = useEditorLogic({});
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { isGuest } = useSession(); // ADDED

  // State for dialogs
  const [isNewProjectOpen, setIsNewProjectOpen] = React.useState(false);
  const [isExportOpen, setIsExportOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = React.useState(false);
  const [isGenerativeFillOpen, setIsGenerativeFillOpen] = React.useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = React.useState(false);
  const [isFontManagerOpen, setIsFontManagerOpen] = React.useState(false);
  const [isSavePresetOpen, setIsSavePresetOpen] = React.useState(false);
  const [isSaveGradientPresetOpen, setIsSaveGradientPresetOpen] = React.useState(false);
  const [isSmartObjectEditorOpen, setIsSmartObjectEditorOpen] = React.useState<string | null>(null);

  // DND setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id === over?.id) return;

    const activeData = active.data.current;
    const overData = over?.data.current;

    if (activeData?.layerId && overData?.layerId) {
      logic.onLayerReorder(activeData.layerId, overData.layerId); // Corrected function name
    } else if (activeData?.tabId && overData?.tabId && activeData?.location && overData?.location) {
      logic.reorderPanelTabs(activeData.tabId, overData.tabId, overData.location);
    }
  };

  // Placeholder for fullscreen toggle
  const onToggleFullscreen = React.useCallback(() => {
    logic.setIsFullscreen(prev => !prev);
  }, [logic]);
  
  // Placeholder for mobile tab state
  const [mobileActiveTab, setMobileActiveTab] = React.useState<any>('layers');

  // Handlers for dialogs
  const handleNewProjectClick = React.useCallback(() => setIsNewProjectOpen(true), []);
  const handleExportClick = React.useCallback(() => setIsExportOpen(true), []);
  const handleOpenProject = React.useCallback(() => document.getElementById('file-upload-input')?.click(), []);
  const handleImportClick = React.useCallback(() => setIsImportOpen(true), []);
  const handleGenerateClick = React.useCallback(() => {
    if (!logic.dimensions) {
      showError("Please load an image or create a new project first.");
      return;
    }
    setIsGenerateOpen(true);
  }, [logic.dimensions]);
  const handleGenerativeFillClick = React.useCallback(() => {
    if (!logic.selectionMaskDataUrl) {
      showError("Please make a selection first.");
      return;
    }
    setIsGenerativeFillOpen(true);
  }, [logic.selectionMaskDataUrl]);
  
  const handleSavePreset = React.useCallback(() => setIsSavePresetOpen(true), []);
  const handleSaveGradientPreset = React.useCallback(() => setIsSaveGradientPresetOpen(true), []);

  // Type cast logic.handleNewProject to match NewProjectDialog's expected signature
  const handleNewProjectWrapper = logic.handleNewProject as (settings: NewProjectSettings) => void;

  // Render logic based on mobile/desktop
  if (isMobile) {
    return (
      <TooltipProvider>
        <div className="flex flex-col h-screen overflow-hidden">
          <MobileHeader
            hasImage={!!logic.image}
            onNewProjectClick={handleNewProjectClick}
            onOpenProject={handleOpenProject}
            onSaveProject={() => showError("Project saving is a stub.")}
            onExportClick={handleExportClick}
            onReset={logic.resetAllEdits}
            onSettingsClick={() => setIsSettingsOpen(true)}
            onImportClick={handleImportClick}
            onNewFromClipboard={() => logic.handleNewFromClipboard(false)}
          />
          <MobileToolBar
            activeTool={logic.activeTool}
            setActiveTool={logic.setActiveTool}
          />
          <div className="flex-1 relative overflow-hidden">
            <EditorWorkspace
              {...logic}
              workspaceRef={logic.workspaceRef}
              imgRef={logic.imgRef}
              workspaceZoom={logic.zoom} // Use 'zoom' alias
              handleWorkspaceMouseDown={logic.handleWorkspaceMouseDown}
              handleWorkspaceMouseMove={logic.handleWorkspaceMouseMove}
              handleWorkspaceMouseUp={logic.handleWorkspaceMouseUp}
              handleWheel={logic.handleWheel}
              setIsMouseOverImage={logic.setIsMouseOverImage}
              handleDrawingStrokeEnd={logic.handleDrawingStrokeEnd}
              handleSelectionBrushStrokeEnd={logic.handleSelectionBrushStrokeEnd}
              handleSelectiveRetouchStrokeEnd={logic.handleSelectiveRetouchStrokeEnd as any} // Casting to fix TS2322
              handleHistoryBrushStrokeEnd={logic.handleHistoryBrushStrokeEnd}
              handleAddDrawingLayer={logic.addDrawingLayer}
              onCropChange={logic.onCropChange}
              onCropComplete={logic.onCropComplete}
              addGradientLayer={logic.addGradientLayer}
              addTextLayer={logic.addTextLayer}
              addShapeLayer={logic.addShapeLayer}
              setMarqueeStart={logic.setMarqueeStart} // ADDED
              setMarqueeCurrent={logic.setMarqueeCurrent} // ADDED
              setGradientStart={logic.setGradientStart} // ADDED
              setGradientCurrent={logic.setGradientCurrent} // ADDED
              setCloneSourcePoint={logic.setCloneSourcePoint} // ADDED
            />
          </div>
          <MobileToolOptions
            activeTab={mobileActiveTab}
            setActiveTab={setMobileActiveTab}
            logic={logic}
            onOpenFontManager={() => setIsFontManagerOpen(true)}
            onSavePreset={handleSavePreset}
            onSaveGradientPreset={handleSaveGradientPreset}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenSmartObject={(id) => setIsSmartObjectEditorOpen(id)}
            isGuest={isGuest} // ADDED
          />
          <MobileBottomNav
            activeTab={mobileActiveTab}
            setActiveTab={setMobileActiveTab}
          />
        </div>
        {/* Hidden File Input for Mobile/Desktop */}
        <input
          type="file"
          id="file-upload-input"
          accept="image/*,.nanoedit"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              logic.handleImageLoad(file);
            }
            e.target.value = '';
          }}
        />
      </TooltipProvider>
    );
  }

  // Desktop Layout
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <TooltipProvider>
        <div className="flex flex-col h-screen overflow-hidden">
          <EditorHeader
            logic={logic}
            setIsNewProjectOpen={setIsNewProjectOpen}
            setIsExportOpen={setIsExportOpen}
            setIsSettingsOpen={setIsSettingsOpen}
            setIsImportOpen={setIsImportOpen}
            setIsGenerateOpen={setIsGenerateOpen}
            setIsGenerativeFillOpen={setIsGenerativeFillOpen}
            setIsProjectSettingsOpen={setIsProjectSettingsOpen}
            isFullscreen={logic.isFullscreen}
            onToggleFullscreen={onToggleFullscreen}
            panelLayout={logic.panelLayout}
            togglePanelVisibility={logic.togglePanelVisibility}
            activeRightTab={logic.activeRightTab}
            setActiveRightTab={logic.setActiveRightTab}
            activeBottomTab={logic.activeBottomTab}
            setActiveBottomTab={logic.setActiveBottomTab}
          />

          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Left Sidebar (Tools) */}
            <ResizablePanel defaultSize={5} minSize={4} maxSize={8} className="min-w-[60px]">
              <LeftSidebar
                activeTool={logic.activeTool}
                setActiveTool={logic.setActiveTool}
                selectedShapeType={logic.selectedShapeType}
                setSelectedShapeType={logic.setSelectedShapeType}
                foregroundColor={logic.foregroundColor}
                onForegroundColorChange={logic.setForegroundColor}
                backgroundColor={logic.backgroundColor}
                onBackgroundColorChange={logic.setBackgroundColor}
                onSwapColors={logic.handleSwapColors}
                brushState={logic.brushState}
                setBrushState={logic.setBrushState}
                selectiveBlurAmount={logic.selectiveBlurAmount}
                onSelectiveBlurAmountChange={logic.setSelectiveBlurAmount}
                onSelectiveBlurAmountCommit={(v) => logic.updateCurrentState({ selectiveBlurAmount: v })}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />

            {/* Main Workspace */}
            <ResizablePanel defaultSize={logic.panelLayout.some(t => t.location === 'bottom' && t.visible) ? 75 : 100} minSize={logic.panelLayout.some(t => t.location === 'bottom' && t.visible) ? 50 : 100}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={logic.panelLayout.some(t => t.location === 'bottom' && t.visible) ? 75 : 100} minSize={logic.panelLayout.some(t => t.location === 'bottom' && t.visible) ? 50 : 100}>
                  <EditorWorkspace
                    {...logic}
                    workspaceRef={logic.workspaceRef}
                    imgRef={logic.imgRef}
                    workspaceZoom={logic.zoom} // Use 'zoom' alias
                    handleWorkspaceMouseDown={logic.handleWorkspaceMouseDown}
                    handleWorkspaceMouseMove={logic.handleWorkspaceMouseMove}
                    handleWorkspaceMouseUp={logic.handleWorkspaceMouseUp}
                    handleWheel={logic.handleWheel}
                    setIsMouseOverImage={logic.setIsMouseOverImage}
                    handleDrawingStrokeEnd={logic.handleDrawingStrokeEnd}
                    handleSelectionBrushStrokeEnd={logic.handleSelectionBrushStrokeEnd}
                    handleSelectiveRetouchStrokeEnd={logic.handleSelectiveRetouchStrokeEnd as any} // Casting to fix TS2322
                    handleHistoryBrushStrokeEnd={logic.handleHistoryBrushStrokeEnd}
                    handleAddDrawingLayer={logic.addDrawingLayer}
                    onCropChange={logic.onCropChange}
                    onCropComplete={logic.onCropComplete}
                    addGradientLayer={logic.addGradientLayer}
                    addTextLayer={logic.addTextLayer}
                    addShapeLayer={logic.addShapeLayer}
                    setMarqueeStart={logic.setMarqueeStart} // ADDED
                    setMarqueeCurrent={logic.setMarqueeCurrent} // ADDED
                    setGradientStart={logic.setGradientStart} // ADDED
                    setGradientCurrent={logic.setGradientCurrent} // ADDED
                    setCloneSourcePoint={logic.setCloneSourcePoint} // ADDED
                  />
                </ResizablePanel>
                
                {logic.panelLayout.some(t => t.location === 'bottom' && t.visible) && (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={25} minSize={15} maxSize={50}>
                      <BottomPanel
                        foregroundColor={logic.foregroundColor}
                        onForegroundColorChange={logic.setForegroundColor}
                        backgroundColor={logic.backgroundColor}
                        onBackgroundColorChange={logic.setBackgroundColor}
                        onSwapColors={logic.handleSwapColors}
                        dimensions={logic.dimensions}
                        fileInfo={logic.fileInfo}
                        imgRef={logic.imgRef}
                        exifData={logic.exifData}
                        colorMode={logic.currentEditState.colorMode}
                        zoom={logic.zoom} // Use 'zoom' alias
                        onZoomIn={logic.handleZoomIn}
                        onZoomOut={logic.handleZoomOut}
                        onFitScreen={logic.handleFitScreen}
                        hasImage={!!logic.image}
                        adjustments={logic.adjustments}
                        onAdjustmentChange={logic.onAdjustmentChange}
                        onAdjustmentCommit={logic.onAdjustmentCommit}
                        grading={logic.grading}
                        onGradingChange={logic.onGradingChange}
                        onGradingCommit={logic.onGradingCommit}
                        hslAdjustments={logic.hslAdjustments}
                        onHslAdjustmentChange={logic.onHslAdjustmentChange}
                        onHslAdjustmentCommit={logic.onHslAdjustmentCommit}
                        curves={logic.curves}
                        onCurvesChange={logic.onCurvesChange}
                        onCurvesCommit={logic.onCurvesCommit}
                        customHslColor={logic.customHslColor}
                        setCustomHslColor={logic.setCustomHslColor}
                        geminiApiKey={logic.geminiApiKey}
                        base64Image={logic.base64Image}
                        onImageResult={logic.handleGenerateImage}
                        onMaskResult={logic.handleMaskResult} // ADDED
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        panelLayout={logic.panelLayout}
                        reorderPanelTabs={logic.reorderPanelTabs}
                        activeBottomTab={logic.activeBottomTab}
                        setActiveBottomTab={logic.setActiveBottomTab}
                        isGuest={isGuest} // ADDED
                      />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>
            <ResizableHandle withHandle />

            {/* Right Sidebar (Layers/Properties) */}
            {logic.panelLayout.some(t => t.location === 'right' && t.visible) && (
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="min-w-[250px]">
                <Sidebar
                  {...logic}
                  onOpenFontManager={() => setIsFontManagerOpen(true)}
                  onSavePreset={handleSavePreset} // Pass dialog opener
                  onSaveGradientPreset={handleSaveGradientPreset}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  onOpenSmartObject={(id) => setIsSmartObjectEditorOpen(id)}
                  
                  // Explicitly pass properties that require renaming or wrapping:
                  onLayerReorder={logic.onLayerReorder}
                  addGradientLayer={logic.addGradientLayerNoArgs}
                  onImageResult={logic.handleGenerateImage}
                  onMaskResult={logic.handleMaskResult}
                  
                  // Mappings for TS2740 error:
                  onLayerUpdate={logic.updateLayer}
                  onLayerCommit={logic.commitLayerChange}
                  onLayerOpacityChange={logic.handleLayerOpacityChange}
                  onSelectiveBlurAmountChange={logic.setSelectiveBlurAmount}
                  onSelectiveSharpenAmountChange={logic.setSelectiveSharpenAmount}
                  onChannelChange={logic.onChannelChange}
                  onHistoryJump={logic.onHistoryJump}
                  onBrushCommit={logic.onBrushCommit}
                  
                  // ADDED MISSING PROPS (Error 2 fix)
                  onSelectiveBlurAmountCommit={logic.onSelectiveBlurAmountCommit}
                  onSelectiveSharpenAmountCommit={logic.onSelectiveSharpenAmountCommit}
                  onUndo={logic.undo}
                  onRedo={logic.redo}
                  isGuest={isGuest} // ADDED
                />
              </ResizablePanel>
            )}
          </ResizablePanelGroup>
        </div>
        
        {/* Dialogs */}
        <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        <NewProjectDialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen} onNewProject={handleNewProjectWrapper} />
        <ExportOptions open={isExportOpen} onOpenChange={setIsExportOpen} onExport={logic.handleExportClick} dimensions={logic.dimensions} />
        <ImportPresetsDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
        <GenerateImageDialog 
          open={isGenerateOpen} 
          onOpenChange={setIsGenerateOpen} 
          onGenerate={logic.handleGenerateImage} 
          apiKey={logic.geminiApiKey} 
          imageNaturalDimensions={logic.dimensions}
          isGuest={isGuest} // ADDED
        />
        <GenerativeDialog
          open={isGenerativeFillOpen}
          onOpenChange={setIsGenerativeFillOpen}
          onApply={logic.handleGenerativeFill}
          apiKey={logic.geminiApiKey}
          originalImage={logic.base64Image}
          selectionPath={logic.selectionPath}
          selectionMaskDataUrl={logic.selectionMaskDataUrl}
          imageNaturalDimensions={logic.dimensions}
          isGuest={isGuest} // ADDED
        />
        <ProjectSettingsDialog
          open={isProjectSettingsOpen}
          onOpenChange={setIsProjectSettingsOpen}
          currentDimensions={logic.dimensions}
          currentColorMode={logic.currentEditState.colorMode}
          onUpdateSettings={logic.handleProjectSettingsUpdate}
        />
        <FontManagerDialog
          open={isFontManagerOpen}
          onOpenChange={setIsFontManagerOpen}
          systemFonts={logic.systemFonts}
          customFonts={logic.customFonts}
          addCustomFont={logic.addCustomFont}
          removeCustomFont={logic.removeCustomFont}
        />
        <SavePresetDialog
          open={isSavePresetOpen}
          onOpenChange={setIsSavePresetOpen}
          onSave={logic.handleSavePresetCommit} // Use the commit function
        />
        <SaveGradientPresetDialog
          open={isSaveGradientPresetOpen}
          onOpenChange={setIsSaveGradientPresetOpen}
          onSave={(name) => logic.onSaveGradientPreset(name, logic.gradientToolState)}
        />
        {isSmartObjectEditorOpen && (
          <SmartObjectEditor
            layerId={isSmartObjectEditorOpen}
            onClose={() => setIsSmartObjectEditorOpen(null)}
            onSave={logic.commitLayerChange}
            layers={logic.layers}
            updateLayer={logic.updateLayer}
            recordHistory={logic.recordHistory}
            currentEditState={logic.currentEditState}
            dimensions={logic.dimensions}
            foregroundColor={logic.foregroundColor}
            backgroundColor={logic.backgroundColor}
            gradientToolState={logic.gradientToolState}
            selectedShapeType={logic.selectedShapeType}
            selectionPath={logic.selectionPath}
            selectionMaskDataUrl={logic.selectionMaskDataUrl}
            clearSelectionState={logic.clearSelectionState}
            setImage={logic.setImage}
            setFileInfo={logic.setFileInfo}
            setSelectedLayerId={logic.setSelectedLayerId}
            selectedLayerId={logic.selectedLayerId}
            // ADDED PROPS:
            systemFonts={logic.systemFonts}
            customFonts={logic.customFonts}
            onOpenFontManager={logic.onOpenFontManager}
            gradientPresets={logic.gradientPresets}
            onSaveGradientPreset={logic.onSaveGradientPreset}
            onDeleteGradientPreset={logic.onDeleteGradientPreset}
          />
        )}
        {/* Hidden File Input for Desktop */}
        <input
          type="file"
          id="file-upload-input"
          accept="image/*,.nanoedit"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              logic.handleImageLoad(file);
            }
            e.target.value = '';
          }}
        />
      </TooltipProvider>
    </DndContext>
  );
};

export default Index;