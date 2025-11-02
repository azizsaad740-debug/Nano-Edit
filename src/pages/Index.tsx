import * as React from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";
import LeftSidebar from "@/components/layout/LeftSidebar";
import Sidebar, { RightSidebarTabsProps } from "@/components/layout/Sidebar";
import BottomPanel from "@/components/layout/BottomPanel";
import { NewProjectDialog } from "@/components/editor/NewProjectDialog";
import { ExportOptions } from "@/components/editor/ExportOptions";
import { SettingsDialog } from "@/components/layout/SettingsDialog";
import { ImportPresetsDialog } from "@/components/editor/ImportPresetsDialog";
import { GenerateImageDialog } from "@/components/editor/GenerateImageDialog";
import { GenerativeDialog } from "@/components/editor/GenerativeDialog";
import { ProjectSettingsDialog } from "@/components/editor/ProjectSettingsDialog";
import { SmartObjectEditor } from "@/components/editor/SmartObjectEditor";
import { CustomFontLoader } from "@/components/editor/CustomFontLoader";
import { FontManagerDialog } from "@/components/editor/FontManagerDialog";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav, MobileTab } from "@/components/mobile/MobileBottomNav";
import { MobileToolBar } from "@/components/mobile/MobileToolBar";
import { MobileToolOptions } from "@/components/mobile/MobileToolOptions";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { showSuccess, showError } from "@/utils/toast";
import { useHotkeys } from "react-hotkeys-hook";
import { useSession } from "@/integrations/supabase/session-provider";
import { supabase } from "@/integrations/supabase/client";
import { EditorHeader } from "@/components/layout/EditorHeader";
import type { PanelTab, ActiveTool } from "@/types/editor/core";
import { Layers, SlidersHorizontal, Settings, Brush, Palette, LayoutGrid, PenTool, History, Info, Compass, SquareStack, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const Index: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: isSessionLoading } = useSession();
  
  // --- Dialog State ---
  const [isNewProjectOpen, setIsNewProjectOpen] = React.useState(false);
  const [isExportOpen, setIsExportOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = React.useState(false);
  const [isFontManagerOpen, setIsFontManagerOpen] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [activeMobileTab, setActiveMobileTab] = React.useState<MobileTab>('layers');
  const [smartObjectLayerToEdit, setSmartObjectLayerToEdit] = React.useState<any>(null);

  // --- Core Logic Hook ---
  const logic = useEditorLogic({});

  // Destructuring logic results
  const {
    // Core State
    image, dimensions, fileInfo, exifData, layers, selectedLayerId, setSelectedLayerId: setSelectedLayerIdLogic, selectedLayer,
    activeTool, setActiveTool, brushState, setBrushState, gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType, selectionPath, setSelectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl,
    selectiveBlurAmount, setSelectiveBlurAmount, selectiveSharpenAmount, setSelectiveSharpenAmount,
    customHslColor, setCustomHslColor, selectionSettings, onSelectionSettingChange, onSelectionSettingCommit,
    channels, onChannelChange,
    
    // History
    history, currentHistoryIndex, recordHistory, undo, redo, canUndo, canRedo,
    setCurrentHistoryIndex, historyBrushSourceIndex, setHistoryBrushSourceIndex,
    
    // Layer Management
    toggleLayerVisibility, renameLayer, deleteLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents,
    updateLayer, commitLayerChange, onLayerPropertyCommit,
    handleLayerOpacityChange, handleLayerOpacityCommit,
    addTextLayer, addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection,
    addShapeLayer, addGradientLayer, onAddAdjustmentLayer,
    groupLayers, toggleGroupExpanded,
    onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onDeleteHiddenLayers, onArrangeLayer,
    hasActiveSelection, onApplySelectionAsMask, handleDestructiveOperation,
    handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleSelectiveRetouchStrokeEnd, handleHistoryBrushStrokeEnd,
    handleReorder,
    
    // Effects/Transform
    effects, onEffectChange, onEffectCommit, onFilterChange, selectedFilter,
    onTransformChange, rotation, onRotationChange, onRotationCommit, onAspectChange, aspect,
    frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit,
    
    // Color Correction
    adjustments, onAdjustmentChange, onAdjustmentCommit, grading, onGradingChange, onGradingCommit,
    hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, curves, onCurvesChange, onCurvesCommit,
    
    // Presets
    presets, handleApplyPreset, handleSavePreset, onDeletePreset,
    gradientPresets, onSaveGradientPreset, onDeleteGradientPreset,
    
    // Workspace Interaction
    workspaceZoom, handleZoomIn, handleZoomOut, handleFitScreen,
    handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp, handleWheel,
    
    // AI/Export/Project Management
    geminiApiKey, handleExportClick, handleNewProject, handleLoadProject, handleImageLoad,
    handleGenerativeFill, handleGenerateImage, handleSwapColors, handleLayerDelete,
    
    // Internal State
    workspaceRef, imgRef,
    currentEditState, updateCurrentState, resetAllEdits,
    base64Image, historyImageSrc,
    isPreviewingOriginal, setIsPreviewingOriginal,
    clearSelectionState,
    
    // External Hooks/Functions
    systemFonts, customFonts, addCustomFont, removeCustomFont,
    handleProjectSettingsUpdate,
    onBrushCommit,
    onCropChange, onCropComplete,
    
    // Panel Management (Fixes 292, 293)
    panelLayout: panelLayoutState, setPanelLayout, activeRightTab, setActiveRightTab, activeBottomTab, setActiveBottomTab,
    reorderPanelTabs: reorderPanelTabsLogic, // Renamed to avoid conflict
    
    // Selection Drawing State
    marqueeStart, marqueeCurrent, gradientStart, gradientCurrent, cloneSourcePoint,
    
    // Misc (Fix 294)
    selectiveBlurMask, selectiveSharpenMask,
    setIsGenerateOpen, setIsGenerativeFillOpen,
    isGenerateOpen, isGenerativeFillOpen,
    isMobile: isMobileLogic,
    setZoom,
  } = logic;

  // --- Derived/Wrapper Logic ---
  const isMobile = useIsMobile();
  const hasImage = !!image;
  const colorMode = currentEditState.colorMode;
  
  const handleExport = React.useCallback((options: any) => {
    handleExportClick(options);
  }, [handleExportClick]);
  
  const handleNewProjectWrapper = React.useCallback((settings: any) => {
    handleNewProject(settings);
  }, [handleNewProject]);
  
  const handleFileLoad = React.useCallback((file: File) => {
    if (file.name.endsWith('.nanoedit')) {
      handleLoadProject(file);
    } else {
      handleImageLoad(file);
    }
  }, [handleLoadProject, handleImageLoad]);
  
  const handleGenerativeFillWrapper = React.useCallback((resultUrl: string, maskDataUrl: string | null) => {
    handleGenerativeFill(resultUrl, maskDataUrl);
  }, [handleGenerativeFill]);
  
  const handleGenerateImageWrapper = React.useCallback((resultUrl: string) => {
    handleGenerateImage(resultUrl);
  }, [handleGenerateImage]);
  
  const handleToggleFullscreen = React.useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);
  
  const handleOpenSmartObject = (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (layer && layer.type === 'smart-object') {
      setSmartObjectLayerToEdit(layer);
    }
  };
  
  const handleSaveSmartObject = (updatedLayers: any[]) => {
    if (smartObjectLayerToEdit) {
      updateLayer(smartObjectLayerToEdit.id, {
        smartObjectData: {
          ...smartObjectLayerToEdit.smartObjectData,
          layers: updatedLayers,
        }
      });
      commitLayerChange(smartObjectLayerToEdit.id, `Edit Smart Object: ${smartObjectLayerToEdit.name}`);
    }
    setSmartObjectLayerToEdit(null);
  };
  
  const handleOpenFontManager = () => setIsFontManagerOpen(true);
  
  const handleHistoryJump = (index: number) => {
    setCurrentHistoryIndex(index);
    // Logic to restore state from history[index] is handled inside useEditorState/useEditorLogic
  };
  
  const handleOpenProject = () => {
    document.getElementById('file-upload-input')?.click();
  };
  
  const handleNewFromClipboard = (importInSameProject: boolean) => {
    showError("New from clipboard is a stub.");
  };
  
  const handleSaveProject = () => {
    showError("Project saving is a stub.");
  };
  
  const handleSyncProject = () => {
    showError("Cloud sync is a stub.");
  };
  
  const handleOpenSettings = () => setIsSettingsOpen(true);
  const handleOpenGenerate = () => setIsGenerateOpen(true);
  const handleOpenGenerativeFill = () => setIsGenerativeFillOpen(true);
  
  // --- Panel Management Logic ---
  
  // Initialize panel layout if empty (first load)
  React.useEffect(() => {
    if (panelLayoutState.length === 0) {
      // Define initial panel layout structure here, mapping icons
      const initialLayout: PanelTab[] = [
        { id: 'layers', name: 'Layers', icon: Layers, location: 'right', visible: true, order: 1 },
        { id: 'properties', name: 'Properties', icon: Settings, location: 'right', visible: true, order: 2 },
        { id: 'correction', name: 'Correction', icon: SlidersHorizontal, location: 'bottom', visible: true, order: 3 },
        { id: 'ai-xtra', name: 'AI Xtra', icon: Zap, location: 'bottom', visible: true, order: 4 },
        { id: 'history', name: 'History', icon: History, location: 'right', visible: false, order: 5 },
        { id: 'channels', name: 'Channels', icon: SquareStack, location: 'right', visible: false, order: 6 },
        { id: 'color', name: 'Color', icon: Palette, location: 'bottom', visible: false, order: 7 },
        { id: 'info', name: 'Info', icon: Info, location: 'bottom', visible: false, order: 8 },
        { id: 'navigator', name: 'Navigator', icon: Compass, location: 'bottom', visible: false, order: 9 },
        { id: 'brushes', name: 'Brushes', icon: Brush, location: 'right', visible: false, order: 10 },
        { id: 'paths', name: 'Paths', icon: PenTool, location: 'right', visible: false, order: 11 },
        { id: 'adjustments', name: 'Adjustments', icon: SlidersHorizontal, location: 'right', visible: false, order: 12 },
        { id: 'templates', name: 'Templates', icon: LayoutGrid, location: 'right', visible: false, order: 13 },
      ];
      setPanelLayout(initialLayout);
    }
  }, [panelLayoutState.length, setPanelLayout]);
  
  const togglePanelVisibility = (id: string) => {
    setPanelLayout(prev => prev.map(tab => {
      if (tab.id === id) {
        const newVisibility = !tab.visible;
        // If hiding, move to hidden location
        const newLocation = newVisibility ? (tab.location === 'hidden' ? 'right' : tab.location) : 'hidden';
        return { ...tab, visible: newVisibility, location: newLocation };
      }
      return tab;
    }));
  };
  
  // 3-argument function used by DndContext in Index.tsx
  const reorderDesktopPanelTabs = React.useCallback((activeId: string, overId: string, newLocation: 'right' | 'bottom') => {
    reorderPanelTabsLogic(activeId, overId, newLocation);
  }, [reorderPanelTabsLogic]);
  
  // 2-argument function used by components like MobileToolOptions
  const reorderPanelTabs = React.useCallback((activeId: string, overId: string) => {
    const activeTab = panelLayoutState.find(t => t.id === activeId);
    const newLocation = activeTab?.location || 'right'; // Default to right if unknown
    reorderPanelTabsLogic(activeId, overId, newLocation as 'right' | 'bottom');
  }, [reorderPanelTabsLogic, panelLayoutState]);
  
  // --- Render Logic ---

  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <div className="w-16 h-16 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full border-b-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user && location.pathname !== '/login' && location.pathname !== '/signup' && location.pathname !== '/terms' && location.pathname !== '/privacy') {
    return <Navigate to="/login" replace />;
  }
  
  if (smartObjectLayerToEdit) {
    return (
      <SmartObjectEditor
        layer={smartObjectLayerToEdit}
        onClose={() => setSmartObjectLayerToEdit(null)}
        onSave={handleSaveSmartObject}
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

  const rightSidebarProps: RightSidebarTabsProps = {
    hasImage, activeTool, selectedLayerId, selectedLayer, layers, onSelectLayer: setSelectedLayerIdLogic, onReorder: handleReorder,
    toggleLayerVisibility, renameLayer, deleteLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onOpenSmartObject: handleOpenSmartObject, onLayerUpdate: updateLayer, onLayerCommit: commitLayerChange, onLayerPropertyCommit,
    onLayerOpacityChange: handleLayerOpacityChange, onLayerOpacityCommit: handleLayerOpacityCommit,
    addTextLayer, addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection, addShapeLayer, addGradientLayer, onAddAdjustmentLayer,
    selectedShapeType, groupLayers, toggleGroupExpanded, onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onDeleteHiddenLayers, onArrangeLayer,
    hasActiveSelection, onApplySelectionAsMask, handleDestructiveOperation,
    effects, onEffectChange, onEffectCommit, onFilterChange, selectedFilter, onTransformChange, rotation, onRotationChange, onRotationCommit, onAspectChange, aspect,
    frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit,
    adjustments, onAdjustmentChange, onAdjustmentCommit, grading, onGradingChange, onGradingCommit,
    hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, curves, onCurvesChange, onCurvesCommit,
    presets, onApplyPreset: handleApplyPreset, onSavePreset: handleSavePreset, onDeletePreset,
    gradientToolState, setGradientToolState, gradientPresets, onSaveGradientPreset, onDeleteGradientPreset,
    brushState, setBrushState: (updates) => setBrushState(prev => ({ ...prev, ...updates })),
    selectiveBlurAmount, onSelectiveBlurAmountChange: setSelectiveBlurAmount, onSelectiveBlurAmountCommit: (v) => recordHistory(`Set Blur Amount to ${v}`, { ...currentEditState, selectiveBlurAmount: v }, layers),
    selectiveSharpenAmount, onSelectiveSharpenAmountChange: setSelectiveSharpenAmount, onSelectiveSharpenAmountCommit: (v) => recordHistory(`Set Sharpen Amount to ${v}`, { ...currentEditState, selectiveSharpenAmount: v }, layers),
    customHslColor, setCustomHslColor, systemFonts, customFonts, onOpenFontManager: handleOpenFontManager,
    cloneSourcePoint, selectionSettings, onSelectionSettingChange, onSelectionSettingCommit,
    channels, onChannelChange, history, historyBrushSourceIndex, setHistoryBrushSourceIndex,
    currentHistoryIndex, onHistoryJump: handleHistoryJump, undo, redo, canUndo, canRedo,
    LayersPanel: Sidebar,
    imgRef, foregroundColor, onForegroundColorChange: setForegroundColor, setForegroundColor: setForegroundColor, backgroundColor, onBackgroundColorChange: setBackgroundColor, onSwapColors: handleSwapColors,
    dimensions, fileInfo, exifData, colorMode, zoom: workspaceZoom, onZoomIn: handleZoomIn, onZoomOut: handleZoomOut, onFitScreen: handleFitScreen,
    geminiApiKey, base64Image: image, onImageResult: handleGenerateImageWrapper, onMaskResult: (maskDataUrl, name) => { setSelectionMaskDataUrl(maskDataUrl); recordHistory(name, currentEditState, layers); }, onOpenSettings: handleOpenSettings,
    panelLayout: panelLayoutState, reorderPanelTabs: reorderPanelTabs, activeRightTab, setActiveRightTab, activeBottomTab, setActiveBottomTab,
  };

  const bottomPanelProps = {
    foregroundColor, onForegroundColorChange: setForegroundColor, backgroundColor, onBackgroundColorChange: setBackgroundColor, onSwapColors: handleSwapColors,
    dimensions, fileInfo, imgRef, exifData, colorMode, zoom: workspaceZoom, onZoomIn: handleZoomIn, onZoomOut: handleZoomOut, onFitScreen: handleFitScreen, hasImage,
    adjustments, onAdjustmentChange, onAdjustmentCommit, grading, onGradingChange, onGradingCommit,
    hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, curves, onCurvesChange, onCurvesCommit,
    customHslColor, setCustomHslColor,
    geminiApiKey, base64Image: image, onImageResult: handleGenerateImageWrapper, onMaskResult: (maskDataUrl, name) => { setSelectionMaskDataUrl(maskDataUrl); recordHistory(name, currentEditState, layers); }, onOpenSettings: handleOpenSettings,
    panelLayout: panelLayoutState, reorderPanelTabs: reorderPanelTabs, activeBottomTab, setActiveBottomTab,
  };

  return (
    <DndContext
      sensors={useSensors(useSensor(PointerSensor))}
      collisionDetection={closestCenter}
      onDragEnd={(event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        
        const activeData = active.data.current;
        const overData = over.data.current;
        
        if (activeData?.type === 'panel-tab' && overData?.location) {
          reorderDesktopPanelTabs(active.id as string, over.id as string, overData.location as 'right' | 'bottom');
        }
      }}
    >
      <div className={cn("flex flex-col h-screen w-screen bg-background", isFullscreen && "fixed inset-0 z-50")}>
        
        {isMobile ? (
          <MobileHeader
            hasImage={hasImage}
            onNewProjectClick={() => setIsNewProjectOpen(true)}
            onOpenProject={handleOpenProject}
            onSaveProject={handleSaveProject}
            onExportClick={() => setIsExportOpen(true)}
            onReset={resetAllEdits}
            onSettingsClick={handleOpenSettings}
            onImportClick={() => setIsImportOpen(true)}
            onNewFromClipboard={() => handleNewFromClipboard(false)}
          />
        ) : (
          <EditorHeader
            logic={logic}
            setIsNewProjectOpen={setIsNewProjectOpen}
            setIsExportOpen={setIsExportOpen}
            setIsSettingsOpen={setIsSettingsOpen}
            setIsImportOpen={setIsImportOpen}
            setIsGenerateOpen={handleOpenGenerate}
            setIsGenerativeFillOpen={handleOpenGenerativeFill}
            setIsProjectSettingsOpen={setIsProjectSettingsOpen}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            panelLayout={panelLayoutState}
            togglePanelVisibility={togglePanelVisibility}
            activeRightTab={activeRightTab}
            setActiveRightTab={setActiveRightTab}
            activeBottomTab={activeBottomTab}
            setActiveBottomTab={setActiveBottomTab}
          />
        )}

        {isMobile && <MobileToolBar activeTool={activeTool} setActiveTool={setActiveTool} />}

        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          
          {/* Left Sidebar (Tools) */}
          {!isMobile && (
            <ResizablePanel defaultSize={5} minSize={5} maxSize={8} className="shrink-0">
              <LeftSidebar
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                selectedShapeType={selectedShapeType}
                setSelectedShapeType={setSelectedShapeType}
                foregroundColor={foregroundColor}
                onForegroundColorChange={setForegroundColor}
                backgroundColor={backgroundColor}
                onBackgroundColorChange={setBackgroundColor}
                onSwapColors={handleSwapColors}
                brushState={brushState}
                setBrushState={(updates) => setBrushState(prev => ({ ...prev, ...updates }))}
                selectiveBlurAmount={selectiveBlurAmount}
                onSelectiveBlurAmountChange={setSelectiveBlurAmount}
                onSelectiveBlurAmountCommit={(v) => recordHistory(`Set Blur Amount to ${v}`, { ...currentEditState, selectiveBlurAmount: v }, layers)}
              />
            </ResizablePanel>
          )}
          {!isMobile && <ResizableHandle withHandle />}

          {/* Main Content Area */}
          <ResizablePanel defaultSize={70} minSize={30} className="flex flex-col min-w-0">
            
            {/* Tool Options Bar (Desktop Only) */}
            {!isMobile && (
              <div className="w-full h-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
                {/* Placeholder for Tool Options Bar */}
              </div>
            )}

            {/* Workspace */}
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
              selectiveBlurMask={selectiveBlurMask}
              selectiveBlurAmount={selectiveBlurAmount}
              selectiveSharpenMask={selectiveSharpenMask}
              selectiveSharpenAmount={selectiveSharpenAmount}
              marqueeStart={marqueeStart}
              marqueeCurrent={marqueeCurrent}
              gradientStart={gradientStart}
              gradientCurrent={gradientCurrent}
              cloneSourcePoint={cloneSourcePoint}
              base64Image={image}
              historyImageSrc={historyImageSrc}
              onCropChange={onCropChange}
              onCropComplete={onCropComplete}
              handleWorkspaceMouseDown={handleWorkspaceMouseDown}
              handleWorkspaceMouseMove={handleWorkspaceMouseMove}
              handleWorkspaceMouseUp={handleWorkspaceMouseUp}
              handleWheel={handleWheel}
              setIsMouseOverImage={setIsPreviewingOriginal}
              handleDrawingStrokeEnd={handleDrawingStrokeEnd}
              handleSelectionBrushStrokeEnd={handleSelectionBrushStrokeEnd}
              handleSelectiveRetouchStrokeEnd={handleSelectiveRetouchStrokeEnd}
              handleHistoryBrushStrokeEnd={handleHistoryBrushStrokeEnd}
              handleAddDrawingLayer={addDrawingLayer}
              setSelectionPath={setSelectionPath}
              setSelectionMaskDataUrl={setSelectionMaskDataUrl}
              clearSelectionState={clearSelectionState}
              updateCurrentState={updateCurrentState}
              updateLayer={updateLayer}
              commitLayerChange={commitLayerChange}
              workspaceZoom={workspaceZoom}
              handleFitScreen={handleFitScreen}
              handleZoomIn={handleZoomIn}
              handleZoomOut={handleZoomOut}
              isPreviewingOriginal={isPreviewingOriginal}
              setSelectedLayerId={setSelectedLayerIdLogic}
            />
            
            {/* Bottom Panel (Desktop Only) */}
            {!isMobile && panelLayoutState.some(t => t.location === 'bottom' && t.visible) && (
              <ResizablePanelGroup direction="vertical" className="shrink-0">
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                  <BottomPanel {...bottomPanelProps} />
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </ResizablePanel>

          {/* Right Sidebar (Layers/Properties/Auxiliary) */}
          {!isMobile && panelLayoutState.some(t => t.location === 'right' && t.visible) && (
            <ResizablePanel defaultSize={25} minSize={15} maxSize={30} className="shrink-0">
              <Sidebar {...rightSidebarProps} />
            </ResizablePanel>
          )}
          
          {/* Mobile Bottom Panel (Tool Options) */}
          {isMobile && (
            <div className="fixed inset-x-0 top-12 bottom-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-y-auto">
              <MobileToolOptions
                {...rightSidebarProps}
                activeMobileTab={activeMobileTab}
                onOpenGenerate={handleOpenGenerate}
                onOpenGenerativeFill={handleOpenGenerativeFill}
                navigate={navigate}
              />
            </div>
          )}
        </ResizablePanelGroup>

        {/* Mobile Navigation */}
        {isMobile && (
          <MobileBottomNav activeTab={activeMobileTab} setActiveTab={(tab) => {
            setActiveMobileTab(tab);
            // If selecting a tool, switch to the 'tools' tab in the options panel
            if (['move', 'crop', 'text', 'eyedropper'].includes(tab)) {
              setActiveTool(tab as ActiveTool);
              setActiveMobileTab('tools');
            } else if (tab === 'layers') {
              // If selecting layers, ensure no tool is active unless it's a layer-specific tool
              if (activeTool && !['move', 'text', 'shape'].includes(activeTool)) {
                setActiveTool(null);
              }
            }
          }} />
        )}

        {/* Dialogs */}
        <NewProjectDialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen} onNewProject={handleNewProjectWrapper} />
        <ExportOptions open={isExportOpen} onOpenChange={setIsExportOpen} onExport={handleExport} dimensions={dimensions} />
        <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        <ImportPresetsDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
        <GenerateImageDialog 
          open={isGenerateOpen}
          onOpenChange={setIsGenerateOpen} 
          onGenerate={handleGenerateImageWrapper}
          apiKey={geminiApiKey || ''}
          imageNaturalDimensions={dimensions}
        />
        <GenerativeDialog 
          open={isGenerativeFillOpen}
          onOpenChange={setIsGenerativeFillOpen} 
          onApply={handleGenerativeFillWrapper}
          apiKey={geminiApiKey || ''}
          originalImage={image}
          selectionPath={selectionPath}
          selectionMaskDataUrl={selectionMaskDataUrl}
          imageNaturalDimensions={dimensions}
        />
        <ProjectSettingsDialog
          open={isProjectSettingsOpen}
          onOpenChange={setIsProjectSettingsOpen}
          currentDimensions={dimensions}
          currentColorMode={colorMode}
          onUpdateSettings={handleProjectSettingsUpdate}
        />
        <FontManagerDialog
          open={isFontManagerOpen}
          onOpenChange={setIsFontManagerOpen}
          systemFonts={systemFonts}
          customFonts={customFonts}
          addCustomFont={addCustomFont}
          removeCustomFont={removeCustomFont}
        />

        {/* Hidden File Input for Project/Image Loading */}
        <input
          type="file"
          id="file-upload-input"
          className="hidden"
          accept="image/*, .nanoedit"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileLoad(e.target.files[0]);
            }
          }}
        />
      </div>
    </DndContext>
  );
};