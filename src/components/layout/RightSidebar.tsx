import React, { useCallback } from "react";
import Sidebar from "./Sidebar";
import { useEditorLogic } from "@/hooks/useEditorLogic";

interface RightSidebarProps {
  logic: ReturnType<typeof useEditorLogic>;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ logic }) => {
  const {
    hasImage, activeTool, selectedLayer, selectedLayerId, layers, imgRef, // Added imgRef
    onSelectLayer, reorderLayers, handleToggleVisibility, renameLayer, deleteLayer, // Added onSelectLayer
    duplicateLayer, mergeLayerDown, rasterizeLayer, createSmartObject, openSmartObjectEditor,
    updateLayer, commitLayerChange, handleLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit,
    handleAddTextLayer, handleAddDrawingLayer, handleAddLayerFromBackground, handleLayerFromSelection,
    handleAddShapeLayer, handleAddGradientLayer, addAdjustmentLayer, selectedShapeType, groupLayers,
    toggleGroupExpanded, removeLayerMask, invertLayerMask, toggleClippingMask, toggleLayerLock,
    handleDeleteHiddenLayers, handleRasterizeSmartObject, handleConvertSmartObjectToLayers, handleExportSmartObjectContents,
    handleArrangeLayer, applySelectionAsMask, selectionMaskDataUrl,
    // Adjustments
    adjustments, onAdjustmentChange, onAdjustmentCommit, effects, onEffectChange, onEffectCommit,
    grading, onGradingChange, onGradingCommit, hslAdjustments, onHslAdjustmentChange, onHslAdjustmentCommit,
    curves, onCurvesChange, onCurvesCommit, selectedFilter, onFilterChange, transforms, onTransformChange, rotation, onRotationChange, onRotationCommit,
    onAspectChange, aspect, frame, onFramePresetChange, onFramePropertyChange, onFramePropertyCommit,
    // Presets
    presets, handleApplyPreset, handleSavePreset, deletePreset,
    gradientToolState, setGradientToolState, gradientPresets, saveGradientPreset, deleteGradientPreset,
    // History/Info/Color
    history, currentHistoryIndex, handleHistoryJump, undo, redo, canUndo, canRedo,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor, handleSwapColors,
    dimensions, fileInfo, exifData, currentEditState, channels, onChannelChange,
    zoom, handleZoomIn, handleZoomOut, handleFitScreen,
    // Brushes/Selective Blur
    brushState, setBrushStatePartial, selectiveBlurAmount, setSelectiveBlurAmount,
    // Fonts
    systemFonts, customFonts,
    // HSL Custom Color
    customHslColor, setCustomHslColor,
    // Project Settings
    handleProjectSettingsUpdate,
    // Selection Settings
    selectionSettings, onSelectionSettingChange, onSelectionSettingCommit, // NEW
  } = logic;

  const selectedLayerIds = selectedLayerId ? [selectedLayerId] : [];
  const smartObjectEditingId = layers.find(l => l.id === selectedLayerId && l.type === 'smart-object')?.id;

  // Wrapper to ensure onLayerCommit matches the expected signature (id, historyName)
  // We use handleLayerPropertyCommit with empty updates to commit the current state with a specific name.
  const handleCommitWithHistory = useCallback((id: string, historyName: string) => {
    handleLayerPropertyCommit(id, {}, historyName);
  }, [handleLayerPropertyCommit]);

  return (
    <Sidebar
      hasImage={hasImage}
      activeTool={activeTool}
      selectedLayerId={selectedLayerId}
      selectedLayer={selectedLayer}
      layers={layers}
      imgRef={imgRef}
      onSelectLayer={(id, ctrlKey, shiftKey) => {
        if (activeTool === 'eyedropper') return;
        onSelectLayer(id, ctrlKey, shiftKey);
      }}
      onReorder={reorderLayers}
      toggleLayerVisibility={handleToggleVisibility}
      renameLayer={renameLayer}
      deleteLayer={deleteLayer}
      onDuplicateLayer={() => selectedLayerId && duplicateLayer(selectedLayerId)}
      onMergeLayerDown={() => selectedLayerId && mergeLayerDown(selectedLayerId)}
      onRasterizeLayer={() => selectedLayerId && rasterizeLayer(selectedLayerId)}
      onCreateSmartObject={createSmartObject}
      onOpenSmartObject={openSmartObjectEditor}
      onLayerUpdate={updateLayer}
      onLayerCommit={handleCommitWithHistory}
      onLayerPropertyCommit={handleLayerPropertyCommit}
      onLayerOpacityChange={handleLayerOpacityChange}
      onLayerOpacityCommit={handleLayerOpacityCommit}
      addTextLayer={() => handleAddTextLayer({ x: 50, y: 50 }, foregroundColor)}
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
      onRasterizeSmartObject={() => smartObjectEditingId && handleRasterizeSmartObject(smartObjectEditingId)}
      onConvertSmartObjectToLayers={() => smartObjectEditingId && handleConvertSmartObjectToLayers(smartObjectEditingId)}
      onExportSmartObjectContents={() => smartObjectEditingId && handleExportSmartObjectContents(smartObjectEditingId)}
      onArrangeLayer={handleArrangeLayer}
      hasActiveSelection={!!selectionMaskDataUrl}
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
      selectedFilter={currentEditState.selectedFilter}
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
      onHistoryJump={handleHistoryJump}
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      // Color Props
      foregroundColor={foregroundColor}
      onForegroundColorChange={setForegroundColor}
      backgroundColor={backgroundColor}
      onBackgroundColorChange={setBackgroundColor}
      onSwapColors={handleSwapColors}
      // Info Props
      dimensions={dimensions}
      fileInfo={fileInfo}
      exifData={exifData}
      colorMode={currentEditState.colorMode}
      // Navigator Props
      zoom={zoom}
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
      onSelectiveBlurAmountCommit={() => logic.recordHistory("Change Selective Blur Strength", currentEditState, layers)}
      // Font Manager
      systemFonts={systemFonts}
      customFonts={customFonts}
      onOpenFontManager={() => {}} // Handled in Index.tsx dialogs
      // HSL Custom Color
      customHslColor={customHslColor}
      setCustomHslColor={setCustomHslColor}
      // Selection Settings
      selectionSettings={selectionSettings}
      onSelectionSettingChange={onSelectionSettingChange}
      onSelectionSettingCommit={onSelectionSettingCommit}
    />
  );
};