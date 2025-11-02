import * as React from "react";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";
import { EditorHeader } from "@/components/layout/EditorHeader";
import Sidebar from "@/components/layout/Sidebar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import ToolOptionsBar from "@/components/layout/ToolOptionsBar";
import BottomPanel from "@/components/layout/BottomPanel";
import { NewProjectDialog } from "@/components/editor/NewProjectDialog";
import { ExportOptions } from "@/components/editor/ExportOptions";
import { SettingsDialog } from "@/components/layout/SettingsDialog";
import { ImportPresetsDialog } from "@/components/editor/ImportPresetsDialog";
import { CustomFontLoader } from "@/components/editor/CustomFontLoader";
import { FontManagerDialog } from "@/components/editor/FontManagerDialog";
import { GenerateImageDialog } from "@/components/editor/GenerateImageDialog";
import { GenerativeDialog } from "@/components/editor/GenerativeDialog";
import { ProjectSettingsDialog } from "@/components/editor/ProjectSettingsDialog";
import { SmartObjectEditor } from "@/components/editor/SmartObjectEditor";
import { useHotkeys } from "react-hotkeys-hook";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLocation, useNavigate } from "react-router-dom";
import { showError } from "@/utils/toast";
import LayersPanel from "@/components/editor/LayersPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { Point, ActiveTool, PanelLocation } from "@/types/editor";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav, MobileTab } from "@/components/mobile/MobileBottomNav";
import { MobileToolBar } from "@/components/mobile/MobileToolBar";
import { MobileToolOptions } from "@/components/mobile/MobileToolOptions";
import { Undo2, Redo2, ZoomIn, ZoomOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";


export const Index = () => {
  const logic = useEditorLogic();
  const navigate = useNavigate();
  const {
    image, dimensions, fileInfo, exifData, layers, selectedLayerId, selectedLayer,
    activeTool, setActiveTool, brushState, setBrushState, gradientToolState, setGradientToolState,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor,
    selectedShapeType, setSelectedShapeType, selectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl,
    selectiveBlurAmount, 
    selectiveSharpenAmount, 
    customHslColor, setCustomHslColor, selectionSettings, setSelectionSettings,
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
    groupLayers, toggleGroupExpanded, handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd,
    handleLayerDelete, reorderLayers, onSelectLayer: onSelectLayerFromLogic,
    removeLayerMask, invertLayerMask, toggleClippingMask, toggleLayerLock, handleDeleteHiddenLayers,
    handleRasterizeSmartObject, handleConvertSmartObjectToLayers, handleExportSmartObjectContents, handleArrangeLayer,
    applySelectionAsMask, handleDestructiveOperation,
    onBrushCommit,
    onSelectiveSharpenAmountChange, 
    onSelectiveSharpenAmountCommit, 
    onSelectiveBlurAmountChange, 
    onSelectiveBlurAmountCommit, 
    
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
    handleImageResult, 
    handleMaskResult, 
    base64Image, 
    historyImageSrc,
    
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
    systemFonts, customFonts, addCustomFont, removeCustomFont, 
    setZoom,
    handleSwapColors,
    handleSelectiveRetouchStrokeEnd, 
    selectiveBlurMask, 
    selectiveSharpenMask, 
    setSelectionPath,
    
    // Panel Management (NEW)
    panelLayout, togglePanelVisibility, reorderPanelTabs,
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
  
  // --- Panel State Management (NEW) ---
  const rightTabs = React.useMemo(() => panelLayout.filter(t => t.location === 'right' && t.visible).sort((a, b) => a.order - b.order), [panelLayout]);
  const bottomTabs = React.useMemo(() => panelLayout.filter(t => t.location === 'bottom' && t.visible).sort((a, b) => a.order - b.order), [panelLayout]);
  
  const [activeRightTab, setActiveRightTab] = React.useState(rightTabs[0]?.id || 'layers');
  const [activeBottomTab, setActiveBottomTab] = React.useState(bottomTabs[0]?.id || 'color');

  // Ensure active tabs are always visible and default to the first visible tab if the current one is hidden
  React.useEffect(() => {
    if (rightTabs.length > 0 && !rightTabs.some(t => t.id === activeRightTab)) {
      setActiveRightTab(rightTabs[0].id);
    }
    if (bottomTabs.length > 0 && !bottomTabs.some(t => t.id === activeBottomTab)) {
      setActiveBottomTab(bottomTabs[0].id);
    }
  }, [rightTabs, bottomTabs, activeRightTab, activeBottomTab]);
  
  // --- Mobile State ---
  const [activeMobileTab, setActiveMobileTab] = React.useState<MobileTab>('layers');
  const [isMobileOptionsOpen, setIsMobileOptionsOpen] = React.useState(false);

  // Define which tools should automatically open the options panel
  const toolsThatOpenOptions: ActiveTool[] = [
    'brush', 'eraser', 'pencil', 'crop', 'text', 
    'lasso', 'marqueeRect', 'marqueeEllipse', 'lassoPoly', 'quickSelect', 'magicWand', 'objectSelect',
    'selectionBrush', 'blurBrush', 'cloneStamp', 'patternStamp', 'historyBrush', 'artHistoryBrush', 'sharpenTool',
    'shape', 'gradient', 'paintBucket', 'eyedropper', 'move'
  ];

  const handleSetActiveTool = React.useCallback((tool: ActiveTool | null) => {
      setActiveTool(tool);
      
      const toolRequiresOptions = tool && toolsThatOpenOptions.includes(tool);
      
      if (toolRequiresOptions) {
          setActiveMobileTab('tools' as MobileTab); // Explicit cast
          setIsMobileOptionsOpen(true);
      } else {
          // If tool is deselected, keep options open but switch to layers/properties if applicable
          if (isMobileOptionsOpen) {
             setActiveMobileTab('layers');
          }
      }
  }, [setActiveTool, setIsMobileOptionsOpen]);

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

  // Handlers to manage both active state and panel visibility
  const handleSetActiveTab = React.useCallback((tab: MobileTab) => {
      setActiveMobileTab(tab);
      // Always open the options panel when switching tabs
      setIsMobileOptionsOpen(true);
  }, []);
  
  // --- DND Setup ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    
    const activeTab = panelLayout.find(t => t.id === activeId);
    if (!activeTab) return;

    const activeLocation = activeTab.location;
    let newLocation: PanelLocation | undefined;
    let targetOverId = overId;

    // 1. Determine if the drop target is a panel container itself
    if (over.data.current?.location) {
        newLocation = over.data.current.location as PanelLocation;
        // When dropping onto the container, we treat the 'over' ID as the active ID for insertion logic (insert at end)
        targetOverId = activeId; 
    } else {
        // 2. Determine if the drop target is another tab
        const overTab = panelLayout.find(t => t.id === overId);
        if (overTab) {
            newLocation = overTab.location;
        }
    }

    if (!newLocation) return;

    // If the location changed, or if it's an internal reorder
    if (newLocation !== activeLocation || activeId !== overId) {
        logic.reorderPanelTabs(activeId, targetOverId, newLocation);
        
        // Update active tab state if the active tab was moved to a new location
        if (newLocation === 'right') {
            setActiveRightTab(activeId);
        } else if (newLocation === 'bottom') {
            setActiveBottomTab(activeId);
        }
    }
  }, [panelLayout, logic, setActiveRightTab, setActiveBottomTab]);


  // --- Props for Sidebars and Workspace ---
  // Consolidate all props needed for MobileToolOptions (which reuses RightSidebarTabsProps structure)
  const mobileOptionsProps = {
    hasImage, activeTool, selectedLayerId, selectedLayer, layers, imgRef, onSelectLayer: onSelectLayerFromLogic, onReorder: reorderLayers, toggleLayerVisibility: handleToggleVisibility, renameLayer, deleteLayer, onDuplicateLayer: duplicateLayer, onMergeLayerDown: mergeLayerDown, onRasterizeLayer: rasterizeLayer, onCreateSmartObject: createSmartObject, onOpenSmartObject: openSmartObjectEditor, onLayerUpdate: updateLayer, onLayerCommit: commitLayerChange, onLayerPropertyCommit: handleLayerPropertyCommit, onLayerOpacityChange: handleLayerOpacityChange, onLayerOpacityCommit: handleLayerOpacityCommit, addTextLayer: (coords: Point, color: string) => handleAddTextLayer(coords, color), addDrawingLayer: handleAddDrawingLayer, onAddLayerFromBackground: handleAddLayerFromBackground, onLayerFromSelection: handleLayerFromSelection, addShapeLayer: (coords: Point, shapeType: any, initialWidth: any, initialHeight: any) => handleAddShapeLayer(coords, shapeType, initialWidth, initialHeight, foregroundColor, backgroundColor), addGradientLayer: handleAddGradientLayer, onAddAdjustmentLayer: addAdjustmentLayer, selectedShapeType, groupLayers, toggleGroupExpanded, onRemoveLayerMask: removeLayerMask, onInvertLayerMask: invertLayerMask, onToggleClippingMask: toggleClippingMask, onToggleLayerLock: toggleLayerLock, onDeleteHiddenLayers: handleDeleteHiddenLayers, onRasterizeSmartObject: handleRasterizeSmartObject, onConvertSmartObjectToLayers: handleConvertSmartObjectToLayers, onExportSmartObjectContents: handleExportSmartObjectContents, onArrangeLayer: handleArrangeLayer, hasActiveSelection, onApplySelectionAsMask: applySelectionAsMask, handleDestructiveOperation, adjustments, onAdjustmentChange, onAdjustmentCommit, effects, onEffectChange, onEffectCommit, grading, onGradingChange, onGradingCommit, hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, curves, onCurvesChange, onCurvesCommit, onFilterChange, selectedFilter, onTransformChange, rotation, onRotationChange, onRotationCommit, onAspectChange, aspect, frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, presets, onApplyPreset: handleApplyPreset, onSavePreset: handleSavePreset, onDeletePreset: deletePreset, gradientToolState, setGradientToolState, gradientPresets, onSaveGradientPreset: saveGradientPreset, onDeleteGradientPreset: deleteGradientPreset, brushState, setBrushState: setBrushStatePartial, selectiveBlurAmount, onSelectiveBlurAmountChange: onSelectiveBlurAmountChange, onSelectiveBlurAmountCommit: onSelectiveBlurAmountCommit, selectiveSharpenAmount, onSelectiveSharpenAmountChange: onSelectiveSharpenAmountChange, onSelectiveSharpenAmountCommit: onSelectiveSharpenAmountCommit, customHslColor, setCustomHslColor, systemFonts, customFonts, onOpenFontManager: () => setIsFontManagerOpen(true), cloneSourcePoint, selectionSettings, onSelectionSettingChange: (key, value) => setSelectionSettings(prev => ({ ...prev, [key]: value })), onSelectionSettingCommit: (key, value) => recordHistory(`Set Selection Setting ${String(key)}`, currentEditState, layers), history, currentHistoryIndex, onHistoryJump: (index: number) => { setCurrentEditState(history[index].state); setLayers(history[index].layers); setCurrentHistoryIndex(index); }, onUndo: undo, onRedo: redo, canUndo, canRedo, historyBrushSourceIndex, setHistoryBrushSourceIndex, foregroundColor, onForegroundColorChange: setForegroundColor, backgroundColor, onBackgroundColorChange: setBackgroundColor, onSwapColors: handleSwapColors, dimensions, fileInfo, exifData, colorMode: currentEditState.colorMode, zoom: workspaceZoom, onZoomIn: handleZoomIn, onZoomOut: handleZoomOut, onFitScreen: handleFitScreen, channels: currentEditState.channels, onChannelChange: onChannelChange, LayersPanel,
    activeMobileTab,
    onOpenSettings: () => setIsSettingsOpen(true),
    onOpenGenerate: () => setIsGenerateOpen(true),
    onOpenGenerativeFill: () => setIsGenerativeFillOpen(true),
    navigate,
    setActiveTool: handleSetActiveTool,
    setSelectedShapeType,
    setForegroundColor,
    geminiApiKey,
    base64Image: base64Image,
    onImageResult: handleImageResult,
    onMaskResult: handleMaskResult,
    // Panel Management Props (NEW)
    panelLayout,
    reorderPanelTabs: logic.reorderPanelTabs,
    activeRightTab,
    setActiveRightTab,
    activeBottomTab,
    setActiveBottomTab,
  };
 
  const editorWorkspaceProps = {
    workspaceRef, imgRef, image, dimensions, currentEditState, layers, selectedLayerId, activeTool, brushState, foregroundColor, backgroundColor, gradientToolState, selectionPath, selectionMaskDataUrl, selectiveBlurMask, selectiveBlurAmount, selectiveSharpenMask, selectiveSharpenAmount, handleSelectiveRetouchStrokeEnd, marqueeStart, marqueeCurrent, gradientStart, gradientCurrent, cloneSourcePoint, onCropChange, onCropComplete, handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp, handleWheel, setIsMouseOverImage, handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd, handleAddDrawingLayer, setSelectionPath, setSelectionMaskDataUrl, clearSelectionState, updateCurrentState, updateLayer, commitLayerChange, workspaceZoom, handleFitScreen, handleZoomIn, handleZoomOut, isPreviewingOriginal, base64Image,
    historyImageSrc,
  };
  
  const toolOptionsBarProps = {
    activeTool,
    brushState,
    setBrushState: setBrushStatePartial,
    onBrushCommit: () => recordHistory("Update Brush Settings", currentEditState, layers),
  };
 
  // Determine the bottom offset for the options panel
  // MobileBottomNav: h-16 (64px). MobileToolBar: h-16 (64px). Total fixed height: 128px.
  const mobileOptionsBottomOffset = 'bottom-[128px]';
 
 
  // --- Common Elements (File Input and Dialogs) ---
  const fileInput = (
    <input
      type="file"
      id="file-upload-input"
      className="hidden"
      accept="image/*,.nanoedit"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          if (file.name.endsWith('.nanoedit')) {
            handleLoadProject(file);
          } else {
            handleImageLoad(file);
          }
        }
        // Clear input value to allow re-uploading the same file
        e.target.value = '';
      }}
    />
  );
 
  const dialogs = (
    <>
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
        customFonts={customFonts}
        addCustomFont={addCustomFont}
        removeCustomFont={removeCustomFont}
      />
    </>
  );
 
 
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
 
  if (isMobile) {
    return (
      <>
        <div className="flex flex-col h-screen w-screen bg-background">
          <CustomFontLoader customFonts={customFonts} />
          
          {/* 1. Mobile Header */}
          <MobileHeader 
            hasImage={hasImage}
            onNewProjectClick={() => setIsNewProjectOpen(true)}
            onOpenProject={() => document.getElementById('file-upload-input')?.click()}
            onSaveProject={() => showError("Project saving is a stub.")}
            onExportClick={() => setIsExportOpen(true)} 
            onReset={logic.resetAllEdits}
            onSettingsClick={() => setIsSettingsOpen(true)}
            onImportClick={() => setIsImportOpen(true)}
            onNewFromClipboard={() => showError("New from clipboard is a stub.")}
          />
 
          {/* 2. Main Workspace Area */}
          <main className="flex-1 relative min-h-0 overflow-hidden">
            <EditorWorkspace {...editorWorkspaceProps} />
            
            {/* Floating Controls (Undo/Redo/Zoom) */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              <Button variant="secondary" size="icon" onClick={() => undo()} disabled={!canUndo}>
                <Undo2 className="h-5 w-5" />
              </Button>
              <Button variant="secondary" size="icon" onClick={() => redo()} disabled={!canRedo}>
                <Redo2 className="h-5 w-5" />
              </Button>
            </div>
            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
              <Button variant="secondary" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button variant="secondary" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-5 w-5" />
              </Button>
            </div>
          </main>
          
          {/* 3. Mobile Tool Options Panel (Collapsible) */}
          {isMobileOptionsOpen && (
            <div className={cn("absolute left-0 right-0 h-1/2 bg-background border-t border-border/50 z-20 shadow-2xl transition-all duration-300", mobileOptionsBottomOffset)}>
              <ScrollArea className="h-full">
                <MobileToolOptions {...mobileOptionsProps} onApplyPreset={handleApplyPreset} />
              </ScrollArea>
              {/* Close button for the options panel */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 z-30"
                onClick={() => setIsMobileOptionsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
 
          {/* 4. Secondary Tool Bar (Visible when 'Tools' is active) */}
          <MobileToolBar activeTool={activeTool} setActiveTool={handleSetActiveTool} />
 
          {/* 5. Bottom Navigation */}
          <MobileBottomNav activeTab={activeMobileTab} setActiveTab={handleSetActiveTab} />
        </div>
        {fileInput}
        {dialogs}
      </>
    );
  }
 
  // Desktop Layout
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen w-screen bg-background">
        <CustomFontLoader customFonts={customFonts} />
        
        {/* 1. Top Header Bar */}
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
          // Panel Management Props (NEW)
          panelLayout={panelLayout}
          togglePanelVisibility={togglePanelVisibility}
          activeRightTab={activeRightTab}
          setActiveRightTab={setActiveRightTab}
          activeBottomTab={activeBottomTab}
          setActiveBottomTab={setActiveBottomTab}
        />
        
        {/* 2. Tool Options Bar */}
        <ToolOptionsBar {...toolOptionsBarProps} />
 
        {/* 3. Main Content Area (Left | Center | Right) */}
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          
          {/* Left Sidebar Panel (Tools) */}
          <ResizablePanel defaultSize={5} minSize={4} maxSize={8} className="shrink-0">
            <LeftSidebar {...mobileOptionsProps} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          
          {/* Center Panel (Workspace) */}
          <ResizablePanel defaultSize={70} minSize={40}>
            <EditorWorkspace {...editorWorkspaceProps} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          
          {/* Right Sidebar Panel (Layers/Channels/Properties) */}
          <ResizablePanel defaultSize={25} minSize={15} maxSize={30} className="shrink-0 border-l bg-sidebar">
            <Sidebar 
              {...mobileOptionsProps} 
              onApplyPreset={handleApplyPreset} 
              // Panel Management Props (NEW)
              panelLayout={panelLayout}
              reorderPanelTabs={reorderPanelTabs}
              activeRightTab={activeRightTab}
              setActiveRightTab={setActiveRightTab}
              activeBottomTab={activeBottomTab}
              setActiveBottomTab={setActiveBottomTab}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
        
        {/* 4. Bottom Panel (Color/Info/Navigator/Templates/AI) */}
        <BottomPanel 
          foregroundColor={foregroundColor} 
          onForegroundColorChange={setForegroundColor} 
          backgroundColor={backgroundColor} 
          onBackgroundColorChange={setBackgroundColor} 
          onSwapColors={handleSwapColors}
          dimensions={dimensions}
          fileInfo={fileInfo}
          imgRef={imgRef}
          exifData={exifData}
          colorMode={currentEditState.colorMode}
          zoom={workspaceZoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitScreen={handleFitScreen}
          hasImage={hasImage}
          // Color Correction Props
          adjustments={adjustments}
          onAdjustmentChange={onAdjustmentChange}
          onAdjustmentCommit={onAdjustmentCommit}
          grading={grading}
          onGradingChange={onGradingChange}
          onGradingCommit={onGradingCommit}
          hslAdjustments={hslAdjustments}
          onHslAdjustmentChange={onHslAdjustmentChange}
          onHslAdjustmentCommit={onHslAdjustmentCommit}
          curves={curves}
          onCurvesChange={onCurvesChange}
          onCurvesCommit={onCurvesCommit}
          customHslColor={customHslColor}
          setCustomHslColor={setCustomHslColor}
          // AI Props (NEW)
          geminiApiKey={geminiApiKey}
          base64Image={base64Image}
          onImageResult={handleImageResult}
          onMaskResult={handleMaskResult}
          onOpenSettings={() => setIsSettingsOpen(true)}
          // Panel Management Props (NEW)
          panelLayout={panelLayout}
          reorderPanelTabs={reorderPanelTabs}
          activeBottomTab={activeBottomTab}
          setActiveBottomTab={setActiveBottomTab}
        />
      </div>
      {fileInput}
      {dialogs}
    </DndContext>
  );
};