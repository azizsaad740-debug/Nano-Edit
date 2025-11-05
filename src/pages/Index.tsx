"use client";

import * as React from "react";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { EditorHeader } from "@/components/layout/EditorHeader";
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
import { EditorContext } from "@/context/EditorContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useIsMobile } from "@/hooks/use-mobile"; // Use the existing hook
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
import { useSelectiveRetouchToolInteraction } from "@/hooks/useSelectiveRetouchToolInteraction";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav, MobileTab } from "@/components/mobile/MobileBottomNav";
import { MobileToolBar } from "@/components/mobile/MobileToolBar";
import { MobileToolOptions } from "@/components/mobile/MobileToolOptions";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { SavePresetDialog } from "@/components/editor/SavePresetDialog";
import { SaveGradientPresetDialog } from "@/components/editor/SaveGradientPresetDialog";
import { SmartObjectEditor } from "@/components/editor/SmartObjectEditor";

interface IndexPageProps {
  initialImage?: string;
}

export const IndexPage: React.FC<IndexPageProps> = ({ initialImage }) => {
  const editorLogic = useEditorLogic({ initialImage });
  
  // Use the actual mobile detection hook
  const isMobile = useIsMobile();
  
  // Sync mobile state to editor logic
  React.useEffect(() => {
    editorLogic.setIsMobile(isMobile);
  }, [isMobile, editorLogic]);

  const {
    workspaceRef,
    imgRef,
    image,
    dimensions,
    layers,
    selectedLayerId,
    selectedLayerIds,
    selectedLayer,
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
    handleLayerOpacityChange: onLayerOpacityChange,
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
    isSmartObjectEditorOpen, setIsSmartObjectEditorOpen, // NEW
    smartObjectLayerToEdit, setSmartObjectLayerToEdit, // NEW
    
    // History/Edit State for Keyboard Shortcuts
    undo, redo, canUndo, canRedo,
    handleCopy, handleSwapColors, handleLayerDelete, handleDestructiveOperation,
    onApplySelectionAsMask, onToggleLayerLock, onToggleClippingMask, onInvertLayerMask,
    onRemoveLayerMask, onDuplicateLayer, onMergeLayerDown: onMergeLayerDownFn, onRasterizeLayer: onRasterizeLayerFn,
    onCreateSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers: onConvertSmartObjectToLayersFn,
    onExportSmartObjectContents,
    onAddLayerFromBackground, onLayerFromSelection,
    rotation,
    crop,
    aspect,
    
    // Additional Logic Props for RightSidebarTabs
    history, currentHistoryIndex,
    onLayerPropertyCommit,
    deleteLayer, onMergeLayerDown: onMergeLayerDownProp, onRasterizeLayer: onRasterizeLayerProp,
    onConvertSmartObjectToLayers: onConvertSmartObjectToLayersProp,
    groupLayers, toggleGroupExpanded, onDeleteHiddenLayers,
    hasActiveSelection,
    onBrushCommit, setBrushState,
    selectiveBlurAmount, setSelectiveBlurAmount, onSelectiveBlurAmountCommit,
    selectiveSharpenAmount, setSelectiveSharpenAmount, onSelectiveSharpenAmountCommit,
    onSelectionSettingChange, onSelectionSettingCommit,
    setHistoryBrushSourceIndex, setForegroundColor,
    presets, gradientPresets,
    systemFonts, customFonts, customHslColor, setCustomHslColor,
    
    // NEWLY DESTRUCTURED FOR JSX USAGE:
    addDrawingLayer: addDrawingLayerFnProp,
    onAddAdjustmentLayer,
    selectedShapeType,
    setGradientToolState,
    onChannelChange: onChannelChangeLogic,
    addGradientLayerNoArgs,
    onArrangeLayer,
    isGuest,
  } = editorLogic;

  // --- Preset Dialog State and Handlers ---
  const [isSavingPreset, setIsSavingPreset] = React.useState(false);
  const [isSavingGradientPreset, setIsSavingGradientPreset] = React.useState(false);

  const onOpenSavePresetDialog = () => setIsSavingPreset(true);
  const onOpenSaveGradientPresetDialog = () => setIsSavingGradientPreset(true);
  // --- End Preset Dialog State and Handlers ---

  // --- Mobile State Management ---
  const [activeMobileTab, setActiveMobileTab] = React.useState<MobileTab>('layers');
  const [isMobilePanelOpen, setIsMobilePanelOpen] = React.useState(false);

  React.useEffect(() => {
    if (isMobile && activeMobileTab) {
      setIsMobilePanelOpen(true);
    }
  }, [activeMobileTab, isMobile]);

  const handleMobileTabSelect = (tab: MobileTab) => {
    setActiveMobileTab(tab);
    setIsMobilePanelOpen(true);
  };

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
    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,\n    setSelectionMaskDataUrl: editorLogic.setSelectionMaskDataUrl,\n    baseImageSrc,\n    clearSelectionState,\n  });\n\n  // 4. Object Select\n  useObjectSelectToolInteraction({\n    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,\n    setSelectionMaskDataUrl: editorLogic.setSelectionMaskDataUrl,\n    baseImageSrc,\n    clearSelectionState,\n  });\n\n  // 5. Gradient Tool\n  useGradientToolInteraction({\n    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,\n    gradientStart: editorLogic.gradientStart, gradientCurrent: editorLogic.gradientCurrent,\n    setGradientStart, setGradientCurrent,\n    addGradientLayer: addGradientLayerWithArgs,\n  });\n\n  // 6. Brush Tools (Drawing, Eraser, Selection Brush)\n  useBrushToolInteraction({\n    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,\n    brushState,\n    selectedLayerId,\n    foregroundColor,\n    handleDrawingStrokeEnd,\n    handleSelectionBrushStrokeEnd,\n    baseImageSrc,\n  });\n\n  // 7. Selective Retouch Tools (Blur/Sharpen)\n  useSelectiveRetouchToolInteraction({\n    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,\n    brushState,\n    handleSelectiveRetouchStrokeEnd,\n    baseImageSrc,\n  });\n\n  // 8. Clone Stamp Tool\n  useCloneStampToolInteraction({\n    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,\n    brushState,\n    selectedLayerId,\n    cloneSourcePoint,\n    setCloneSourcePoint,\n    handleDrawingStrokeEnd,\n    baseImageSrc,\n  });\n\n  // 9. History Brush Tool\n  useHistoryBrushToolInteraction({\n    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,\n    brushState,\n    selectedLayerId,\n    handleHistoryBrushStrokeEnd,\n    historyImageSrc,\n  });\n\n  // 10. Move Tool\n  useMoveToolInteraction({\n    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,\n    layers, selectedLayerIds,\n    updateLayer,\n    commitLayerChange,\n    onSelectLayer,\n    zoom,\n  });\n\n  // 11. Text Tool\n  useTextToolInteraction({\n    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,\n    foregroundColor,\n    addTextLayer: addTextLayerFn,\n    zoom,\n  });\n\n  // 12. Shape Tool\n  useShapeToolInteraction({\n    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,\n    foregroundColor,\n    backgroundColor,\n    addShapeLayer: addShapeLayerFn,\n    zoom,\n  });\n\n  // 13. Eyedropper Tool\n  useEyedropperToolInteraction({\n    workspaceRef, imgRef, dimensions, activeTool, setActiveTool,\n    baseImageSrc,\n    foregroundColor: editorLogic.foregroundColor,\n    setForegroundColor: editorLogic.setForegroundColor,\n  });\n\n  // 14. Hand Tool\n  useHandToolInteraction({\n    workspaceRef, activeTool,\n    zoom,\n    imageContainerRef: workspaceRef,\n  });\n\n  // 15. Zoom Tool\n  useZoomToolInteraction({\n    workspaceRef, activeTool,\n    handleZoomIn, handleZoomOut,\n    zoom,\n    imageContainerRef: workspaceRef,\n  });\n\n  // --- Global Effects ---\n  useKeyboardShortcuts({\n    activeTool, setActiveTool,\n    onUndo: undo, onRedo: redo,\n    onZoomIn: handleZoomIn, onZoomOut: handleZoomOut, onFitScreen: handleFitScreen,\n    onCopy: handleCopy, onSwapColors: handleSwapColors, onLayerDelete: handleLayerDelete,\n    onFillSelection: () => handleDestructiveOperation('fill'),\n    onDeleteSelection: () => handleDestructiveOperation('delete'),\n    onDeselect: clearSelectionState,\n    onApplySelectionAsMask, onToggleLayerLock, onToggleClippingMask, onInvertLayerMask,\n    onRemoveLayerMask, onDuplicateLayer, onMergeLayerDown: onMergeLayerDownFn, onRasterizeLayer: onRasterizeLayerFn,\n    onCreateSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers: onConvertSmartObjectToLayersFn,\n    onAddLayerFromBackground, onLayerFromSelection, onAddTextLayer: editorLogic.addTextLayer,\n    onAddShapeLayer: editorLogic.addShapeLayer, onAddGradientLayer: editorLogic.addGradientLayerNoArgs,\n    rotation,\n    crop,\n    aspect,\n  });\n  \n  // useMobileDetection(setIsMobile); // Removed stub, using useIsMobile directly\n  useResizeObserver(workspaceRef, dimensions, setZoom, handleFitScreen);\n  useZoomFit(workspaceRef, dimensions, rotation, crop, aspect, handleFitScreen);\n\n  // --- Layout Rendering ---\n  const rightSidebarTabs = editorLogic.panelLayout.filter(t => t.location === 'right' && t.visible);\n  const bottomSidebarTabs = editorLogic.panelLayout.filter(t => t.location === 'bottom' && t.visible);\n\n  const rightSidebarWidth = rightSidebarTabs.length > 0 ? 280 : 0;\n  const bottomSidebarHeight = bottomSidebarTabs.length > 0 ? 250 : 0;\n  \n  // Left sidebar is 64px wide if not mobile\n  const leftSidebarWidth = isMobile ? 0 : 64;\n  \n  // Calculate main content area width based on visible sidebars\n  const mainContentWidth = `calc(100% - ${rightSidebarWidth}px - ${leftSidebarWidth}px)`;\n  const mainContentHeight = `calc(100% - ${bottomSidebarHeight}px)`;\n\n  const renderDesktopLayout = () => (\n    <div className={cn(\"flex flex-col h-screen w-screen overflow-hidden\", isFullscreen && \"fixed inset-0 z-[9999]\")}>\n      <EditorHeader />\n      <div className=\"flex flex-1 overflow-hidden\">\n        \n        {/* Left Sidebar (Tools Panel) */}\n        <aside className=\"w-16 border-r bg-muted/40 flex-shrink-0\">\n          <LeftSidebar\n            activeTool={activeTool}\n            setActiveTool={setActiveTool}\n            selectedShapeType={selectedShapeType}\n            setSelectedShapeType={editorLogic.setSelectedShapeType}\n            foregroundColor={foregroundColor}\n            onForegroundColorChange={editorLogic.setForegroundColor}\n            backgroundColor={backgroundColor}\n            onBackgroundColorChange={editorLogic.setBackgroundColor}\n            onSwapColors={editorLogic.handleSwapColors}\n            brushState={brushState}\n            setBrushState={editorLogic.setBrushState as any}\n            selectiveBlurAmount={editorLogic.selectiveBlurAmount}\n            onSelectiveBlurAmountChange={editorLogic.setSelectiveBlurAmount}\n            onSelectiveBlurAmountCommit={editorLogic.onSelectiveBlurAmountCommit}\n          />\n        </aside>\n\n        {/* Main Content Area */}\n        <main\n          className=\"flex-1 relative overflow-hidden\"\n          style={{\n            width: mainContentWidth,\n            height: mainContentHeight,\n          }}\n        >\n          <EditorWorkspace\n            workspaceRef={workspaceRef}\n            imgRef={imgRef}\n            image={image}\n            dimensions={dimensions}\n            currentEditState={currentEditState}\n            layers={layers}\n            selectedLayerId={selectedLayerId}\n            activeTool={activeTool}\n            workspaceZoom={zoom}\n            selectionMaskDataUrl={selectionMaskDataUrl}\n            selectionPath={editorLogic.selectionPath}\n            marqueeStart={editorLogic.marqueeStart}\n            marqueeCurrent={editorLogic.marqueeCurrent}\n            gradientStart={editorLogic.gradientStart}\n            gradientCurrent={editorLogic.gradientCurrent}\n            brushState={brushState}\n            foregroundColor={foregroundColor}\n            backgroundColor={backgroundColor}\n            cloneSourcePoint={cloneSourcePoint}\n            isPreviewingOriginal={editorLogic.isPreviewingOriginal}\n            gradientToolState={gradientToolState}\n            \n            handleWorkspaceMouseDown={handleWorkspaceMouseDown}\n            handleWorkspaceMouseMove={handleWorkspaceMouseMove}\n            handleWorkspaceMouseUp={handleWorkspaceMouseUp}\n            handleWheel={handleWheel}\n            setIsMouseOverImage={editorLogic.setIsMouseOverImage}\n            handleZoomIn={handleZoomIn}\n            handleZoomOut={handleZoomOut}\n            handleFitScreen={handleFitScreen}\n            onCropChange={onCropChange}\n            onCropComplete={onCropComplete}\n            handleDrawingStrokeEnd={handleDrawingStrokeEnd}\n            handleSelectionBrushStrokeEnd={handleSelectionBrushStrokeEnd}\n            handleSelectiveRetouchStrokeEnd={handleSelectiveRetouchStrokeEnd}\n            handleHistoryBrushStrokeEnd={handleHistoryBrushStrokeEnd}\n            addGradientLayer={addGradientLayerWithArgs}\n            addTextLayer={addTextLayerFn}\n            addShapeLayer={addShapeLayerFn}\n            setMarqueeStart={setMarqueeStart}\n            setMarqueeCurrent={setMarqueeCurrent}\n            setGradientStart={setGradientStart}\n            setGradientCurrent={setGradientCurrent}\n            setCloneSourcePoint={setCloneSourcePoint}\n            updateLayer={updateLayer}\n            commitLayerChange={commitLayerChange}\n            setSelectedLayerId={setSelectedLayerId}\n            base64Image={baseImageSrc}\n            historyImageSrc={historyImageSrc}\n            recordHistory={editorLogic.recordHistory}\n            setSelectionMaskDataUrl={editorLogic.setSelectionMaskDataUrl}\n          />\n        </main>\n\n        {/* Right Sidebar */}\n        {rightSidebarTabs.length > 0 && (\n          <aside className=\"w-72 border-l bg-background/90 flex flex-col flex-shrink-0\">\n            <RightSidebarTabs\n              layers={layers}\n              currentEditState={currentEditState}\n              history={history}\n              currentHistoryIndex={currentHistoryIndex}\n              selectedLayerId={selectedLayerId}\n              selectedLayerIds={selectedLayerIds}\n              selectedLayer={selectedLayer}\n              dimensions={dimensions}\n              imgRef={imgRef}\n              foregroundColor={foregroundColor}\n              backgroundColor={backgroundColor}\n              \n              activeTool={activeTool}\n              brushState={brushState}\n              gradientToolState={gradientToolState}\n              selectiveBlurAmount={selectiveBlurAmount}\n              selectiveSharpenAmount={selectiveSharpenAmount}\n              cloneSourcePoint={cloneSourcePoint}\n              selectionSettings={editorLogic.selectionSettings}\n              historyBrushSourceIndex={editorLogic.historyBrushSourceIndex}\n              \n              presets={presets}\n              gradientPresets={gradientPresets}\n              \n              onSelectLayer={onSelectLayer}\n              onLayerReorder={onLayerReorder}\n              toggleLayerVisibility={toggleLayerVisibility}\n              renameLayer={renameLayer}\n              deleteLayer={deleteLayer}\n              onDuplicateLayer={onDuplicateLayer}\n              onMergeLayerDown={onMergeLayerDownFn}\n              onRasterizeLayer={onRasterizeLayerFn}\n              onCreateSmartObject={onCreateSmartObject}\n              onOpenSmartObject={onOpenSmartObject}\n              onLayerUpdate={updateLayer}\n              onLayerCommit={commitLayerChange}\n              onLayerPropertyCommit={onLayerPropertyCommit}\n              onLayerOpacityChange={onLayerOpacityChange}\n              onLayerOpacityCommit={onLayerOpacityCommit}\n              addTextLayer={addTextLayerFn}\n              addDrawingLayer={addDrawingLayerFnProp}\n              onAddLayerFromBackground={onAddLayerFromBackground}\n              onLayerFromSelection={onLayerFromSelection}\n              addShapeLayer={addShapeLayerFn}\n              addGradientLayer={addGradientLayerNoArgs}\n              onAddAdjustmentLayer={onAddAdjustmentLayer}\n              selectedShapeType={selectedShapeType}\n              groupLayers={groupLayers}\n              toggleGroupExpanded={toggleGroupExpanded}\n              onRemoveLayerMask={onRemoveLayerMask}\n              onInvertLayerMask={onInvertLayerMask}\n              onToggleClippingMask={onToggleClippingMask}\n              onToggleLayerLock={onToggleLayerLock}\n              onDeleteHiddenLayers={onDeleteHiddenLayers}\n              onRasterizeSmartObject={onRasterizeSmartObject}\n              onConvertSmartObjectToLayers={onConvertSmartObjectToLayersFn}\n              onExportSmartObjectContents={onExportSmartObjectContents}\n              onArrangeLayer={editorLogic.onArrangeLayer}\n              hasActiveSelection={hasActiveSelection}\n              onApplySelectionAsMask={onApplySelectionAsMask}\n              handleDestructiveOperation={handleDestructiveOperation}\n              onBrushCommit={onBrushCommit}\n              setBrushState={setBrushState as any}\n              setGradientToolState={setGradientToolState}\n              onSelectiveBlurAmountChange={setSelectiveBlurAmount}\n              onSelectiveBlurAmountCommit={onSelectiveBlurAmountCommit}\n              onSelectiveSharpenAmountChange={setSelectiveSharpenAmount}\n              onSelectiveSharpenAmountCommit={onSelectiveSharpenAmountCommit}\n              onSelectionSettingChange={onSelectionSettingChange}\n              onSelectionSettingCommit={onSelectionSettingCommit}\n              setHistoryBrushSourceIndex={setHistoryBrushSourceIndex}\n              setForegroundColor={editorLogic.setForegroundColor}\n              onUndo={undo}\n              onRedo={redo}\n              canUndo={canUndo}\n              canRedo={canRedo}\n              onApplyPreset={handleApplyPreset}\n              onSavePreset={onOpenSavePresetDialog}\n              onDeletePreset={deletePreset}\n              onSaveGradientPreset={onOpenSaveGradientPresetDialog}\n              onDeleteGradientPreset={deleteGradientPreset}\n              onOpenFontManager={onOpenFontManager}\n              onOpenSettings={() => setIsSettingsOpen(true)}\n              clearSelectionState={clearSelectionState}\n              systemFonts={systemFonts}\n              customFonts={customFonts}\n              customHslColor={customHslColor}\n              setCustomHslColor={editorLogic.setCustomHslColor}\n              \n              panelLayout={editorLogic.panelLayout}\n              reorderPanelTabs={editorLogic.reorderPanelTabs}\n              activeRightTab={editorLogic.activeRightTab}\n              setActiveRightTab={editorLogic.setActiveRightTab}\n              activeBottomTab={editorLogic.activeBottomTab}\n              setActiveBottomTab={editorLogic.setActiveBottomTab}\n              setCurrentHistoryIndex={editorLogic.setCurrentHistoryIndex}\n              onChannelChange={editorLogic.onChannelChange}\n            />\n          </aside>\n        )}\n      </div>\n\n      {/* Bottom Sidebar */}\n      {bottomSidebarTabs.length > 0 && (\n        <footer\n          className=\"h-[250px] border-t bg-background/90 flex-shrink-0\"\n          style={{ marginRight: rightSidebarWidth, marginLeft: leftSidebarWidth }}\n        >\n          <BottomPanel\n            foregroundColor={foregroundColor}\n            onForegroundColorChange={editorLogic.setForegroundColor}\n            backgroundColor={backgroundColor}\n            onBackgroundColorChange={editorLogic.setBackgroundColor}\n            onSwapColors={editorLogic.handleSwapColors}\n            dimensions={dimensions}\n            fileInfo={editorLogic.fileInfo}\n            imgRef={imgRef}\n            exifData={editorLogic.exifData}\n            colorMode={currentEditState.colorMode}\n            zoom={zoom}\n            onZoomIn={handleZoomIn}\n            onZoomOut={handleZoomOut}\n            onFitScreen={handleFitScreen}\n            hasImage={!!image}\n            adjustments={editorLogic.adjustments}\n            onAdjustmentChange={editorLogic.onAdjustmentChange}\n            onAdjustmentCommit={editorLogic.onAdjustmentCommit}\n            grading={editorLogic.grading}\n            onGradingChange={editorLogic.onGradingChange}\n            onGradingCommit={editorLogic.onGradingCommit}\n            hslAdjustments={editorLogic.hslAdjustments}\n            onHslAdjustmentChange={editorLogic.onHslAdjustmentChange}\n            onHslAdjustmentCommit={editorLogic.onHslAdjustmentCommit}\n            curves={editorLogic.curves}\n            onCurvesChange={editorLogic.onCurvesChange}\n            onCurvesCommit={editorLogic.onCurvesCommit}\n            customHslColor={customHslColor}\n            setCustomHslColor={editorLogic.setCustomHslColor}\n            geminiApiKey={editorLogic.geminiApiKey}\n            base64Image={baseImageSrc}\n            onImageResult={editorLogic.handleGenerateImage}\n            onMaskResult={editorLogic.handleMaskResult}\n            onOpenSettings={() => setIsSettingsOpen(true)}\n            panelLayout={editorLogic.panelLayout}\n            reorderPanelTabs={editorLogic.reorderPanelTabs}\n            activeBottomTab={editorLogic.activeBottomTab}\n            setActiveBottomTab={editorLogic.setActiveBottomTab}\n            isGuest={isGuest}\n          />\n        </footer>\n      )}\n    </div>\n  );\n\n  const renderMobileLayout = () => (\n    <div className=\"flex flex-col h-screen w-screen overflow-hidden\">\n      <MobileHeader\n        hasImage={!!image}\n        onNewProjectClick={() => setIsNewProjectOpen(true)}\n        onOpenProject={editorLogic.handleLoadProject}\n        onSaveProject={editorLogic.handleSaveProject}\n        onExportClick={() => editorLogic.setIsExportOpen(true)}\n        onReset={editorLogic.resetAllEdits}\n        onSettingsClick={() => setIsSettingsOpen(true)}\n        onImportClick={() => setIsImportOpen(true)}\n        onNewFromClipboard={() => editorLogic.handleNewFromClipboard(false)}\n      />\n      \n      {/* Main Content Area (Workspace) */}\n      <main className=\"flex-1 relative overflow-hidden\">\n        <EditorWorkspace\n          workspaceRef={workspaceRef}\n          imgRef={imgRef}\n          image={image}\n          dimensions={dimensions}\n          currentEditState={currentEditState}\n          layers={layers}\n          selectedLayerId={selectedLayerId}\n          activeTool={activeTool}\n          workspaceZoom={zoom}\n          selectionMaskDataUrl={selectionMaskDataUrl}\n          selectionPath={editorLogic.selectionPath}\n          marqueeStart={editorLogic.marqueeStart}\n          marqueeCurrent={editorLogic.marqueeCurrent}\n          gradientStart={editorLogic.gradientStart}\n          gradientCurrent={editorLogic.gradientCurrent}\n          brushState={brushState}\n          foregroundColor={foregroundColor}\n          backgroundColor={backgroundColor}\n          cloneSourcePoint={cloneSourcePoint}\n          isPreviewingOriginal={editorLogic.isPreviewingOriginal}\n          gradientToolState={gradientToolState}\n          \n          handleWorkspaceMouseDown={handleWorkspaceMouseDown}\n          handleWorkspaceMouseMove={handleWorkspaceMouseMove}\n          handleWorkspaceMouseUp={handleWorkspaceMouseUp}\n          handleWheel={handleWheel}\n          setIsMouseOverImage={editorLogic.setIsMouseOverImage}\n          handleZoomIn={handleZoomIn}\n          handleZoomOut={handleZoomOut}\n          handleFitScreen={handleFitScreen}\n          onCropChange={onCropChange}\n          onCropComplete={onCropComplete}\n          handleDrawingStrokeEnd={handleDrawingStrokeEnd}\n          handleSelectionBrushStrokeEnd={handleSelectionBrushStrokeEnd}\n          handleSelectiveRetouchStrokeEnd={handleSelectiveRetouchStrokeEnd}\n          handleHistoryBrushStrokeEnd={handleHistoryBrushStrokeEnd}\n          addGradientLayer={addGradientLayerWithArgs}\n          addTextLayer={addTextLayerFn}\n          addShapeLayer={addShapeLayerFn}\n          setMarqueeStart={setMarqueeStart}\n          setMarqueeCurrent={setMarqueeCurrent}\n          setGradientStart={setGradientStart}\n          setGradientCurrent={setGradientCurrent}\n          setCloneSourcePoint={setCloneSourcePoint}\n          updateLayer={updateLayer}\n          commitLayerChange={commitLayerChange}\n          setSelectedLayerId={setSelectedLayerId}\n          base64Image={baseImageSrc}\n          historyImageSrc={historyImageSrc}\n          recordHistory={editorLogic.recordHistory}\n          setSelectionMaskDataUrl={editorLogic.setSelectionMaskDataUrl}\n        />\n      </main>\n      \n      {/* Mobile Tool Bar (Horizontal Scroll) */}\n      <MobileToolBar activeTool={activeTool} setActiveTool={setActiveTool} />\n\n      {/* Mobile Bottom Navigation (Tabs) */}\n      <MobileBottomNav activeTab={activeMobileTab} setActiveTab={handleMobileTabSelect} />\n\n      {/* Mobile Panel Drawer */}\n      <Drawer open={isMobilePanelOpen} onOpenChange={setIsMobilePanelOpen}>\n        <DrawerContent className=\"h-[85%]\">\n          <DrawerHeader>\n            <DrawerTitle className=\"capitalize\">{activeMobileTab} Panel</DrawerTitle>\n          </DrawerHeader>\n          <MobileToolOptions\n            activeTab={activeMobileTab}\n            setActiveTab={setActiveMobileTab}\n            logic={editorLogic}\n            onOpenFontManager={onOpenFontManager}\n            onSavePreset={onOpenSavePresetDialog}\n            onSaveGradientPreset={onOpenSaveGradientPresetDialog}\n            onOpenSettings={() => setIsSettingsOpen(true)}\n            onOpenSmartObject={onOpenSmartObject}\n            isGuest={isGuest}\n          />\n        </DrawerContent>\n      </Drawer>\n    </div>\n  );\n\n  return (\n    <EditorContext.Provider value={editorLogic}>\n      {/* Hidden file input for 'Open Image/Project' */}\n      <input\n        type=\"file\"\n        id=\"file-upload-input\"\n        accept=\"image/*,.nanoedit\"\n        className=\"hidden\"\n        onChange={(e) => {\n          const file = e.target.files?.[0];\n          if (file) {\n            editorLogic.handleImageLoad(file);\n          }\n          // Clear the input value so the same file can be selected again\n          e.target.value = '';\n        }}\n      />\n\n      {/* Dialogs */}\n      <NewProjectDialog\n        open={isNewProjectOpen}\n        onOpenChange={setIsNewProjectOpen}\n        onNewProject={editorLogic.handleNewProject}\n      />\n      <ExportOptions\n        open={isExportOpen}\n        onOpenChange={setIsExportOpen}\n        onExport={editorLogic.handleExportClick}\n        dimensions={dimensions}\n      />\n      <ProjectSettingsDialog\n        open={isProjectSettingsOpen}\n        onOpenChange={setIsProjectSettingsOpen}\n        currentDimensions={dimensions}\n        currentColorMode={currentEditState.colorMode}\n        onUpdateSettings={handleProjectSettingsUpdate}\n      />\n      <SettingsDialog\n        open={isSettingsOpen}\n        onOpenChange={setIsSettingsOpen}\n      />\n      <ImportDialog\n        open={isImportOpen}\n        onOpenChange={setIsImportOpen}\n        onLoadImage={editorLogic.handleImageLoad}\n        onLoadProject={editorLogic.handleLoadProject}\n        onLoadTemplate={editorLogic.handleLoadTemplate}\n      />\n      <GenerateImageDialog\n        open={isGenerateOpen}\n        onOpenChange={setIsGenerateOpen}\n        onGenerate={editorLogic.handleGenerateImage}\n        apiKey={editorLogic.geminiApiKey}\n        imageNaturalDimensions={dimensions}\n        isGuest={isGuest}\n      />\n      <GenerativeFillDialog\n        open={isGenerativeFillOpen}\n        onOpenChange={setIsGenerativeFillOpen}\n        onApply={editorLogic.handleGenerativeFill}\n        apiKey={editorLogic.geminiApiKey}\n        originalImage={image}\n        selectionPath={selectionPath}\n        selectionMaskDataUrl={selectionMaskDataUrl}\n        imageNaturalDimensions={dimensions}\n        isGuest={isGuest}\n      />\n      <FontManagerDialog\n        open={isFontManagerOpen}\n        onOpenChange={setIsFontManagerOpen}\n        systemFonts={editorLogic.systemFonts}\n        customFonts={editorLogic.customFonts}\n        addCustomFont={editorLogic.addCustomFont}\n        removeCustomFont={editorLogic.removeCustomFont}\n      />\n      \n      {/* Preset Save Dialogs */}\n      <SavePresetDialog\n        open={isSavingPreset}\n        onOpenChange={setIsSavingPreset}\n        onSave={handleSavePresetCommit}\n      />\n      <SaveGradientPresetDialog\n        open={isSavingGradientPreset}\n        onOpenChange={setIsSavingGradientPreset}\n        onSave={(name) => saveGradientPreset(name, gradientToolState)}\n      />\n      \n      {/* Smart Object Editor Dialog */}\n      {editorLogic.smartObjectLayerToEdit && (\n        <SmartObjectEditor\n          open={editorLogic.isSmartObjectEditorOpen}\n          onOpenChange={editorLogic.setIsSmartObjectEditorOpen}\n          smartObjectLayer={editorLogic.smartObjectLayerToEdit}\n          currentEditState={editorLogic.currentEditState}\n          foregroundColor={editorLogic.foregroundColor}\n          backgroundColor={editorLogic.backgroundColor}\n          systemFonts={editorLogic.systemFonts}\n          customFonts={editorLogic.customFonts}\n          gradientToolState={editorLogic.gradientToolState}\n          gradientPresets={editorLogic.gradientPresets}\n          onSaveGradientPreset={editorLogic.saveGradientPreset}\n          onDeleteGradientPreset={editorLogic.deleteGradientPreset}\n          onSaveAndClose={editorLogic.handleSaveSmartObject}\n          onOpenFontManager={editorLogic.onOpenFontManager}\n        />\n      )}\n      \n      {isMobile ? renderMobileLayout() : renderDesktopLayout()}\n    </EditorContext.Provider>\n  );\n};\n