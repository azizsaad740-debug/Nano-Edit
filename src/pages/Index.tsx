"use client";

import React from "react";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import EditorHeader from "@/components/layout/EditorHeader";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";
import Sidebar from "@/components/layout/Sidebar";
import { LayerPanel } from "@/components/editor/LayerPanel";
import { HistoryPanel } from "@/components/editor/HistoryPanel";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { PresetManager } from "@/components/presets/PresetManager";
import Header from "@/components/layout/Header";
import { SmartObjectEditor } from "@/components/editor/SmartObjectEditor";

const Index: React.FC = () => {
  const {
    // Destructure all required properties from useEditorLogic
    resetAllEdits,
    handleExportClick, // Renamed from onDownloadClick
    handleCopy, // Renamed from onCopy
    hasImage,
    setIsPreviewingOriginal, // Renamed from onTogglePreview
    undo, // Renamed from onUndo
    redo, // Renamed from onRedo
    canUndo,
    canRedo,
    isGenerating, // Added to logic return
    isPreviewingOriginal: isPreviewing, // Renamed from isPreviewing
    currentEditState, // Used for isProxyMode
    updateCurrentState, // Used for toggleProxyMode
    setIsSmartObjectEditorOpen: toggleSmartObjectEditor, // Renamed from toggleSmartObjectEditor
    setIsPresetManagerOpen: togglePresetManager, // Renamed from togglePresetManager
    setIsSettingsOpen: toggleSettingsPanel, // Renamed from toggleSettingsPanel
    setIsLayerPanelOpen: toggleLayerPanel, // Renamed from toggleLayerPanel
    setIsHistoryPanelOpen: toggleHistoryPanel, // Renamed from toggleHistoryPanel
    
    // Workspace Props
    workspaceRef, imgRef, image, dimensions,
    activeTool, layers, selectedLayerId, selectionPath, selectionMaskDataUrl,
    workspaceZoom, foregroundColor, backgroundColor, marqueeStart, marqueeCurrent,
    gradientStart, gradientCurrent, brushState, gradientToolState,
    handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp, handleWheel,
    handleZoomIn, handleZoomOut, handleFitScreen,
    onCropChange, onCropComplete, handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd,
    handleSelectiveRetouchStrokeEnd, handleHistoryBrushStrokeEnd, addGradientLayer,
    addTextLayer, addShapeLayer, setMarqueeStart, setMarqueeCurrent, setGradientStart,
    setGradientCurrent, setCloneSourcePoint, updateLayer, commitLayerChange, setSelectedLayerId,
    base64Image, historyImageSrc, recordHistory, setSelectionMaskDataUrl,
    selectiveBlurAmount, selectiveSharpenAmount,
    
    // Smart Object Props
    isSmartObjectEditorOpen, smartObjectLayerToEdit, handleSaveSmartObject,
    systemFonts, customFonts, onOpenFontManager, gradientPresets, onSaveGradientPreset, onDeleteGradientPreset,
    
    // Auth
    isGuest,
  } = useEditorLogic({}); // FIX 30: Call with empty object

  const onDownloadClick = handleExportClick;
  const onCopy = handleCopy;
  const onTogglePreview = setIsPreviewingOriginal;
  const onUndo = undo;
  const onRedo = redo;
  
  const isProxyMode = currentEditState.isProxyMode;
  const toggleProxyMode = () => updateCurrentState({ isProxyMode: !isProxyMode });

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <EditorHeader
        onReset={resetAllEdits}
        onDownloadClick={onDownloadClick}
        onCopy={onCopy}
        hasImage={hasImage}
        onTogglePreview={onTogglePreview}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        isGenerating={isGenerating}
        isPreviewing={isPreviewing}
        isProxyMode={isProxyMode}
        toggleProxyMode={toggleProxyMode}
        toggleSmartObjectEditor={toggleSmartObjectEditor}
        togglePresetManager={togglePresetManager}
        toggleSettingsPanel={toggleSettingsPanel}
        toggleLayerPanel={toggleLayerPanel}
        toggleHistoryPanel={toggleHistoryPanel}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <EditorWorkspace 
          workspaceRef={workspaceRef}
          imgRef={imgRef}
          image={image}
          dimensions={dimensions}
          currentEditState={currentEditState}
          layers={layers}
          selectedLayerId={selectedLayerId}
          activeTool={activeTool}
          workspaceZoom={workspaceZoom}
          selectionMaskDataUrl={selectionMaskDataUrl}
          selectionPath={selectionPath}
          marqueeStart={marqueeStart}
          marqueeCurrent={marqueeCurrent}
          gradientStart={gradientStart}
          gradientCurrent={gradientCurrent}
          brushState={brushState}
          foregroundColor={foregroundColor}
          backgroundColor={backgroundColor}
          cloneSourcePoint={null} // Stubbed
          isPreviewingOriginal={isPreviewing}
          gradientToolState={gradientToolState}
          handleWorkspaceMouseDown={handleWorkspaceMouseDown}
          handleWorkspaceMouseMove={handleWorkspaceMouseMove}
          handleWorkspaceMouseUp={handleWorkspaceMouseUp}
          handleWheel={handleWheel}
          setIsMouseOverImage={() => {}} // Stubbed
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          handleFitScreen={handleFitScreen}
          onCropChange={onCropChange}
          onCropComplete={onCropComplete}
          handleDrawingStrokeEnd={handleDrawingStrokeEnd}
          handleSelectionBrushStrokeEnd={handleSelectionBrushStrokeEnd}
          handleSelectiveRetouchStrokeEnd={handleSelectiveRetouchStrokeEnd}
          handleHistoryBrushStrokeEnd={handleHistoryBrushStrokeEnd}
          addGradientLayer={addGradientLayer}
          addTextLayer={addTextLayer}
          addShapeLayer={addShapeLayer}
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
          recordHistory={recordHistory}
          setSelectionMaskDataUrl={setSelectionMaskDataUrl}
        />
      </div>
      <LayerPanel />
      <HistoryPanel />
      <SettingsPanel />
      <PresetManager />
      <SmartObjectEditor 
        open={isSmartObjectEditorOpen}
        onOpenChange={toggleSmartObjectEditor}
        smartObjectLayer={smartObjectLayerToEdit!}
        currentEditState={currentEditState}
        foregroundColor={foregroundColor}
        backgroundColor={backgroundColor}
        systemFonts={systemFonts}
        customFonts={customFonts}
        gradientToolState={gradientToolState}
        gradientPresets={gradientPresets}
        onSaveGradientPreset={onSaveGradientPreset}
        onDeleteGradientPreset={onDeleteGradientPreset}
        onSaveAndClose={handleSaveSmartObject}
        onOpenFontManager={onOpenFontManager}
      />
    </div>
  );
};

export default Index;