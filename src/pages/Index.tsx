import React, { useState, useRef, useEffect, useMemo } from "react";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import Header from "@/components/layout/Header";
import LeftSidebar from "@/components/layout/LeftSidebar";
import Sidebar from "@/components/layout/Sidebar";
import BottomPanel from "@/components/layout/BottomPanel";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";
import { NewProjectDialog } from "@/components/editor/NewProjectDialog";
import { ExportOptions } from "@/components/editor/ExportOptions";
import { SettingsDialog } from "@/components/layout/SettingsDialog";
import { ImportPresetsDialog } from "@/components/editor/ImportPresetsDialog";
import { GenerateImageDialog } from "@/components/editor/GenerateImageDialog";
import { GenerativeDialog } from "@/components/editor/GenerativeDialog";
import { ProjectSettingsDialog } from "@/components/editor/ProjectSettingsDialog";
import { FontManagerDialog } from "@/components/editor/FontManagerDialog";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav, type MobileTab } from "@/components/mobile/MobileBottomNav";
import { MobileToolOptions } from "@/components/mobile/MobileToolOptions";
import { useNavigate } from "react-router-dom";
import { Layers as LayersIcon } from "lucide-react";
import LayersPanelComponent from "@/components/editor/LayersPanel";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { DraggableTab } from "@/components/layout/DraggableTab";
import type { PanelTab } from "@/types/editor/core";

export const Index = () => {
  const logic = useEditorLogic();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Panel Management State
  const initialPanelLayout: PanelTab[] = [
    { id: 'layers', name: 'Layers', icon: LayersIcon, location: 'right', visible: true, order: 1 },
    { id: 'properties', name: 'Properties', icon: LayersIcon, location: 'right', visible: true, order: 2 },
    { id: 'correction', name: 'Correction', icon: LayersIcon, location: 'right', visible: true, order: 3 },
    { id: 'ai-xtra', name: 'AI Xtra', icon: LayersIcon, location: 'right', visible: true, order: 4 },
    { id: 'brushes', name: 'Brushes', icon: LayersIcon, location: 'right', visible: false, order: 5 },
    { id: 'paths', name: 'Paths', icon: LayersIcon, location: 'right', visible: false, order: 6 },
    { id: 'history', name: 'History', icon: LayersIcon, location: 'bottom', visible: true, order: 7 },
    { id: 'channels', name: 'Channels', icon: LayersIcon, location: 'bottom', visible: false, order: 8 },
    { id: 'color', name: 'Color', icon: LayersIcon, location: 'bottom', visible: true, order: 9 },
    { id: 'info', name: 'Info', icon: LayersIcon, location: 'bottom', visible: true, order: 10 },
    { id: 'navigator', name: 'Navigator', icon: LayersIcon, location: 'bottom', visible: true, order: 11 },
    { id: 'templates', name: 'Templates', icon: LayersIcon, location: 'bottom', visible: false, order: 12 },
  ];
  const [panelLayout, setPanelLayout] = useState<PanelTab[]>(initialPanelLayout);
  const [activeRightTab, setActiveRightTab] = useState('layers');
  const [activeBottomTab, setActiveBottomTab] = useState('history');
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('layers');
  const [activeDragTab, setActiveDragTab] = useState<PanelTab | null>(null);

  const togglePanelVisibility = (id: string) => {
    setPanelLayout(prev => prev.map(t => t.id === id ? { ...t, visible: !t.visible } : t));
  };

  const reorderPanelTabs = (activeId: string, overId: string, newLocation: 'right' | 'bottom') => {
    setPanelLayout(prev => {
      const activeTab = prev.find(t => t.id === activeId);
      if (!activeTab) return prev;

      // 1. Move the tab to the new location/visibility
      const updatedLayout = prev.map(t => {
        if (t.id === activeId) {
          return { ...t, location: newLocation, visible: true };
        }
        return t;
      });

      // 2. Reorder tabs within the target panel
      const targetPanel = updatedLayout.filter(t => t.location === newLocation && t.visible);
      const activeIndex = targetPanel.findIndex(t => t.id === activeId);
      const overIndex = targetPanel.findIndex(t => t.id === overId);

      if (activeIndex !== -1 && overIndex !== -1) {
        const reorderedPanel = arrayMove(targetPanel, activeIndex, overIndex);
        
        // 3. Apply new order to the full layout
        const finalLayout = updatedLayout.map(t => {
          const reorderedItem = reorderedPanel.find(r => r.id === t.id);
          if (reorderedItem) {
            return { ...t, order: reorderedPanel.indexOf(reorderedItem) + 1 };
          }
          return t;
        });
        return finalLayout.sort((a, b) => a.order - b.order);
      }
      return updatedLayout;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    const tab = panelLayout.find(t => t.id === active.id);
    if (tab) {
      setActiveDragTab(tab);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragTab(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const overLocation = over.data.current?.location as 'right' | 'bottom' | undefined;

    if (overLocation) {
      reorderPanelTabs(activeId, overId, overLocation);
      if (overLocation === 'right') setActiveRightTab(activeId);
      if (overLocation === 'bottom') setActiveBottomTab(activeId);
    }
  };

  // Dialog State
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [isFontManagerOpen, setIsFontManagerOpen] = useState(false);

  // Destructure logic state and handlers
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
    
    // Marquee/Gradient/Clone State
    marqueeStart, marqueeCurrent,
    gradientStart, gradientCurrent,
    
    // History
    history, currentHistoryIndex, recordHistory, undo, redo, canUndo, canRedo,
    setCurrentEditState, setLayers, setCurrentHistoryIndex,
    historyBrushSourceIndex, setHistoryBrushSourceIndex,
    
    // Layer Management
    updateLayer, commitLayerChange, handleLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit,
    toggleLayerVisibility, renameLayer, deleteLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents,
    onArrangeLayer, onToggleLayerLock, onDeleteHiddenLayers,
    addTextLayer, addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection, addShapeLayer, addGradientLayer, onAddAdjustmentLayer,
    groupLayers, toggleGroupExpanded, handleReorder,
    onApplySelectionAsMask, onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask,
    handleDrawingStrokeEnd, handleSelectiveRetouchStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd,
    handleDestructiveOperation,
    
    // Global Adjustments
    crop, onCropChange, onCropComplete, onAspectChange, aspect,
    transforms, onTransformChange, rotation, onRotationChange, onRotationCommit,
    adjustments, onAdjustmentChange, onAdjustmentCommit, selectedFilter, onFilterChange,
    grading, onGradingChange, onGradingCommit,
    hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit,
    curves, onCurvesChange, onCurvesCommit,
    channels, onChannelChange,
    effects, onEffectChange, onEffectCommit,
    frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit,
    selectiveBlurMask, selectiveSharpenMask,
    
    // Presets
    presets, handleSavePreset, deletePreset, handleApplyPreset,
    gradientPresets, saveGradientPreset, deleteGradientPreset,
    
    // Image/Project
    handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate,
    
    // AI
    handleGenerateImage, handleGenerativeFill,
    
    // Utility
    handleSwapColors, handleLayerDelete, handleExportClick, handleCopy, onBrushCommit,
    onSelectionSettingChange, onSelectionSettingCommit,
    
    // Workspace Interaction
    workspaceZoom, handleWheel, handleFitScreen, handleZoomIn, handleZoomOut, setIsMouseOverImage,
    handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp,
    
    // External Hooks
    systemFonts, customFonts, addCustomFont, removeCustomFont,
    geminiApiKey, stabilityApiKey,
    
    // Dialogs
    isGenerateOpen, setIsGenerateOpen, isGenerativeFillOpen, setIsGenerativeFillOpen,
    
    // Preview
    isPreviewingOriginal, setIsPreviewingOriginal,
    
    // Image Ref
    imgRef,
    
    // Derived State
    hasImage,
    hasActiveSelection,
    
    // AI Orchestrator Props
    base64Image: image, // Use image as base64 stub
    onImageResult: handleGenerateImage,
    onMaskResult: (maskDataUrl, historyName) => {
      setSelectionMaskDataUrl(maskDataUrl);
      recordHistory(historyName, currentEditState, layers);
    },
    
    // History Brush Source
    historyImageSrc: history[historyBrushSourceIndex]?.layers.find(l => l.id === 'background')?.dataUrl || null,
  } = logic;

  // --- Handlers for Dialogs ---
  const handleExport = (options: any) => {
    handleExportClick(options);
  };

  const handleNewProjectWrapper = (settings: any) => {
    handleNewProject(settings);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.nanoedit')) {
      handleLoadProject(file);
    } else {
      handleImageLoad(file);
    }
  };

  const handleUpdateProjectSettings = (updates: { width?: number; height?: number; colorMode?: any }) => {
    logic.handleProjectSettingsUpdate(updates);
  };

  const handleGenerativeFillWrapper = (resultUrl: string, maskDataUrl: string | null) => {
    handleGenerativeFill(resultUrl, maskDataUrl);
  };

  const handleGenerateImageWrapper = (resultUrl: string) => {
    handleGenerateImage(resultUrl);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  // --- Sidebar Props ---
  const sidebarProps = {
    hasImage, activeTool, selectedLayerId, selectedLayer, layers,
    onSelectLayer: (id: string, ctrlKey: boolean, shiftKey: boolean) => {
      setSelectedLayerId(id);
      // Multi-select stub
    },
    onReorder: handleReorder,
    toggleLayerVisibility, renameLayer, deleteLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents,
    onLayerUpdate: updateLayer, onLayerCommit: commitLayerChange, onLayerPropertyCommit,
    onLayerOpacityChange: handleLayerOpacityChange, onLayerOpacityCommit: handleLayerOpacityCommit,
    addTextLayer: (coords: any, color: string) => addTextLayer(coords, color),
    addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection,
    addShapeLayer: (coords: any, shapeType: any, initialWidth: any, initialHeight: any, fillColor: any, strokeColor: any) => addShapeLayer(coords, shapeType, initialWidth, initialHeight, fillColor, strokeColor),
    addGradientLayer, onAddAdjustmentLayer,
    selectedShapeType, groupLayers, toggleGroupExpanded,
    onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onDeleteHiddenLayers, onArrangeLayer,
    hasActiveSelection, onApplySelectionAsMask, handleDestructiveOperation,
    // Global Effects
    effects, onEffectChange, onEffectCommit, onFilterChange, selectedFilter,
    onTransformChange, rotation, onRotationChange, onRotationCommit, onAspectChange, aspect,
    frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit,
    // Color Correction
    adjustments, onAdjustmentChange, onAdjustmentCommit, grading, onGradingChange, onGradingCommit,
    hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit, curves, onCurvesChange, onCurvesCommit,
    // Presets
    presets, onApplyPreset: handleApplyPreset, onSavePreset: handleSavePreset, onDeletePreset,
    gradientToolState, setGradientToolState, gradientPresets, onSaveGradientPreset, onDeleteGradientPreset,
    // Brush/Tool State
    brushState, setBrushState, selectiveBlurAmount, onSelectiveBlurAmountChange: setSelectiveBlurAmount, onSelectiveBlurAmountCommit: (v) => recordHistory(`Set Blur Amount to ${v}`, currentEditState, layers),
    selectiveSharpenAmount, onSelectiveSharpenAmountChange: setSelectiveSharpenAmount, onSelectiveSharpenAmountCommit: (v) => recordHistory(`Set Sharpen Amount to ${v}`, currentEditState, layers),
    customHslColor, setCustomHslColor, selectionSettings, onSelectionSettingChange, onSelectionSettingCommit,
    // Channels
    channels, onChannelChange,
    // History
    history, currentHistoryIndex, onHistoryJump: setCurrentHistoryIndex, onUndo: undo, onRedo: redo, canUndo, canRedo,
    historyBrushSourceIndex, setHistoryBrushSourceIndex,
    // Document/View Info
    dimensions, fileInfo, exifData, colorMode: currentEditState.colorMode, zoom: workspaceZoom, onZoomIn: handleZoomIn, onZoomOut: handleZoomOut, onFitScreen: handleFitScreen,
    // Color
    foregroundColor, onForegroundColorChange: setForegroundColor, setForegroundColor, backgroundColor, onBackgroundColorChange: setBackgroundColor, onSwapColors: handleSwapColors,
    // AI
    geminiApiKey, base64Image: image, onImageResult: handleGenerateImageWrapper, onMaskResult: (maskDataUrl, historyName) => { setSelectionMaskDataUrl(maskDataUrl); recordHistory(historyName, currentEditState, layers); }, onOpenSettings: () => setIsSettingsOpen(true),
    // Layers Panel Component
    LayersPanel: LayersPanelComponent,
    // Panel Management
    panelLayout, reorderPanelTabs, activeRightTab, setActiveRightTab, activeBottomTab, setActiveBottomTab,
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen w-screen">
        <MobileHeader
          hasImage={hasImage}
          onNewProjectClick={() => setIsNewProjectOpen(true)}
          onOpenProject={() => document.getElementById('file-upload-input')?.click()}
          onSaveProject={() => logic.onSaveProject()}
          onExportClick={() => setIsExportOpen(true)}
          onReset={logic.resetAllEdits}
          onSettingsClick={() => setIsSettingsOpen(true)}
          onImportClick={() => setIsImportOpen(true)}
          onNewFromClipboard={() => logic.onNewFromClipboard(false)}
        />
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <EditorWorkspace
            workspaceRef={logic.workspaceRef}
            {...logic}
            workspaceZoom={workspaceZoom}
            handleZoomIn={handleZoomIn}
            handleZoomOut={handleZoomOut}
            handleFitScreen={handleFitScreen}
            handleDrawingStrokeEnd={handleDrawingStrokeEnd}
            handleSelectionBrushStrokeEnd={handleSelectionBrushStrokeEnd}
            handleSelectiveRetouchStrokeEnd={handleSelectiveRetouchStrokeEnd}
            handleHistoryBrushStrokeEnd={handleHistoryBrushStrokeEnd}
            handleAddDrawingLayer={addDrawingLayer}
            updateLayer={updateLayer}
            commitLayerChange={commitLayerChange}
            updateCurrentState={updateCurrentState}
            setSelectedLayerId={setSelectedLayerId}
          />
        </div>
        <MobileToolOptions
          {...sidebarProps}
          activeMobileTab={activeMobileTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenGenerate={() => setIsGenerateOpen(true)}
          onOpenGenerativeFill={() => setIsGenerativeFillOpen(true)}
          navigate={navigate}
        />
        <MobileToolBar activeTool={activeTool} setActiveTool={setActiveTool} />
        
        {/* Mobile Dialogs */}
        <NewProjectDialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen} onNewProject={handleNewProjectWrapper} />
        <ExportOptions open={isExportOpen} onOpenChange={setIsExportOpen} onExport={handleExport} dimensions={dimensions} />
        <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        <ImportPresetsDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
        <GenerateImageDialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen} onGenerate={handleGenerateImageWrapper} apiKey={geminiApiKey} imageNaturalDimensions={dimensions} />
        <GenerativeDialog open={isGenerativeFillOpen} onOpenChange={setIsGenerativeFillOpen} onApply={handleGenerativeFillWrapper} apiKey={geminiApiKey} originalImage={image} selectionPath={selectionPath} selectionMaskDataUrl={selectionMaskDataUrl} imageNaturalDimensions={dimensions} />
        <ProjectSettingsDialog open={isProjectSettingsOpen} onOpenChange={setIsProjectSettingsOpen} currentDimensions={dimensions} currentColorMode={currentEditState.colorMode} onUpdateSettings={handleUpdateProjectSettings} />
        <FontManagerDialog open={isFontManagerOpen} onOpenChange={setIsFontManagerOpen} systemFonts={systemFonts} customFonts={customFonts} addCustomFont={addCustomFont} removeCustomFont={removeCustomFont} />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("flex flex-col h-screen w-screen", isFullscreen && "absolute inset-0 z-50")}>
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
          panelLayout={panelLayout}
          togglePanelVisibility={togglePanelVisibility}
          activeRightTab={activeRightTab}
          setActiveRightTab={setActiveRightTab}
          activeBottomTab={activeBottomTab}
          setActiveBottomTab={setActiveBottomTab}
        />
        <ToolOptionsBar activeTool={activeTool} brushState={brushState} setBrushState={setBrushState} onBrushCommit={onBrushCommit} />
        
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          {/* Left Sidebar (Tools) */}
          <ResizablePanel defaultSize={4} minSize={4} maxSize={6} className="min-w-[64px]">
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
              setBrushState={setBrushState}
              selectiveBlurAmount={selectiveBlurAmount}
              onSelectiveBlurAmountChange={setSelectiveBlurAmount}
              onSelectiveBlurAmountCommit={(v) => recordHistory(`Set Blur Amount to ${v}`, currentEditState, layers)}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Center Workspace */}
          <ResizablePanel defaultSize={70} minSize={30}>
            <EditorWorkspace
              workspaceRef={logic.workspaceRef}
              {...logic}
              workspaceZoom={workspaceZoom}
              handleWheel={handleWheel}
              handleFitScreen={handleFitScreen}
              handleZoomIn={handleZoomIn}
              handleZoomOut={handleZoomOut}
              handleWorkspaceMouseDown={handleWorkspaceMouseDown}
              handleWorkspaceMouseMove={handleWorkspaceMouseMove}
              handleWorkspaceMouseUp={handleWorkspaceMouseUp}
              handleDrawingStrokeEnd={handleDrawingStrokeEnd}
              handleSelectionBrushStrokeEnd={handleSelectionBrushStrokeEnd}
              handleSelectiveRetouchStrokeEnd={handleSelectiveRetouchStrokeEnd}
              handleHistoryBrushStrokeEnd={handleHistoryBrushStrokeEnd}
              handleAddDrawingLayer={addDrawingLayer}
              updateLayer={updateLayer}
              commitLayerChange={commitLayerChange}
              updateCurrentState={updateCurrentState}
              setSelectedLayerId={setSelectedLayerId}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Right Sidebar (Layers/Properties/Adjustments) */}
          <ResizablePanel defaultSize={26} minSize={15} maxSize={30} className="min-w-[250px] flex flex-col">
            <Sidebar
              {...sidebarProps}
              onOpenFontManager={() => setIsFontManagerOpen(true)}
            />
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Bottom Panel */}
        {panelLayout.some(t => t.location === 'bottom' && t.visible) && (
          <BottomPanel
            foregroundColor={foregroundColor}
            onForegroundColorChange={setForegroundColor}
            backgroundColor={backgroundColor}
            onBackgroundColorChange={setBackgroundColor}
            onSwapColors={handleSwapColors}
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
            geminiApiKey={geminiApiKey}
            base64Image={image}
            onImageResult={handleGenerateImageWrapper}
            onMaskResult={(maskDataUrl, historyName) => { setSelectionMaskDataUrl(maskDataUrl); recordHistory(historyName, currentEditState, layers); }}
            onOpenSettings={() => setIsSettingsOpen(true)}
            panelLayout={panelLayout}
            reorderPanelTabs={reorderPanelTabs}
            activeBottomTab={activeBottomTab}
            setActiveBottomTab={setActiveBottomTab}
          />
        )}
      </div>

      {/* Desktop Dialogs */}
      <NewProjectDialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen} onNewProject={handleNewProjectWrapper} />
      <ExportOptions open={isExportOpen} onOpenChange={setIsExportOpen} onExport={handleExport} dimensions={dimensions} />
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <ImportPresetsDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
      <GenerateImageDialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen} onGenerate={handleGenerateImageWrapper} apiKey={geminiApiKey} imageNaturalDimensions={dimensions} />
      <GenerativeDialog open={isGenerativeFillOpen} onOpenChange={setIsGenerativeFillOpen} onApply={handleGenerativeFillWrapper} apiKey={geminiApiKey} originalImage={image} selectionPath={selectionPath} selectionMaskDataUrl={selectionMaskDataUrl} imageNaturalDimensions={dimensions} />
      <ProjectSettingsDialog open={isProjectSettingsOpen} onOpenChange={setIsProjectSettingsOpen} currentDimensions={dimensions} currentColorMode={currentEditState.colorMode} onUpdateSettings={handleUpdateProjectSettings} />
      <FontManagerDialog open={isFontManagerOpen} onOpenChange={setIsFontManagerOpen} systemFonts={systemFonts} customFonts={customFonts} addCustomFont={addCustomFont} removeCustomFont={removeCustomFont} />
      
      <DragOverlay>
        {activeDragTab ? (
          <DraggableTab tab={activeDragTab} isActive={false} onSelect={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};