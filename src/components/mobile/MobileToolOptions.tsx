"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MobileTab } from "./MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Sparkles, Settings, Zap } from "lucide-react";
import type { RightSidebarTabsProps } from "@/components/layout/Sidebar";
import { LayerPropertiesContent } from "../editor/LayerPropertiesContent";
import ColorCorrectionPanel from "@/components/auxiliary/ColorCorrectionPanel";
import ColorPanel from "@/components/auxiliary/ColorPanel";
import GlobalEffectsPanel from "@/components/editor/GlobalEffectsPanel";
import { ToolOptionsContent } from "../editor/ToolOptionsContent"; // NEW IMPORT
import HistoryPanel from "../auxiliary/HistoryPanel";
import { ChannelsPanel } from "../editor/ChannelsPanel";
import BrushesPanel from "../auxiliary/BrushesPanel";
import PathsPanel from "../auxiliary/PathsPanel";
import InfoPanel from "../auxiliary/InfoPanel";
import NavigatorPanel from "../auxiliary/NavigatorPanel";
import LayersPanel from "../editor/LayersPanel";
import Crop from "@/components/editor/Crop";

// We reuse the props interface from RightSidebarTabsProps for convenience
interface MobileToolOptionsProps extends RightSidebarTabsProps {
  activeMobileTab: MobileTab;
  onOpenSettings: () => void;
  onOpenGenerate: () => void;
  onOpenGenerativeFill: () => void;
  navigate: (path: string) => void; // Added navigate prop (Fixes Error 17)
}

export const MobileToolOptions: React.FC<MobileToolOptionsProps> = (props) => {
  // Destructure all required props from RightSidebarTabsProps
  const { 
    activeTool, activeMobileTab, brushState, setBrushState, foregroundColor, setForegroundColor, 
    onOpenSettings, onOpenGenerate, onOpenGenerativeFill, history,
    selectiveBlurAmount, 
    onSelectiveBlurAmountChange, 
    onSelectiveBlurAmountCommit, 
    selectiveSharpenAmount, 
    onSelectiveSharpenAmountChange, 
    onSelectiveSharpenAmountCommit, 
    selectionSettings, 
    onSelectionSettingChange, 
    onSelectionSettingCommit, 
    gradientToolState, 
    setGradientToolState, 
    gradientPresets, 
    onSaveGradientPreset, 
    onDeleteGradientPreset, 
    cloneSourcePoint, 
    historyBrushSourceIndex, 
    setHistoryBrushSourceIndex, 
    selectedLayer, 
    imgRef, 
    onLayerUpdate, 
    onLayerCommit, 
    systemFonts, 
    customFonts, 
    onOpenFontManager, 
    customHslColor, 
    setCustomHslColor, 
    onRemoveLayerMask, 
    onInvertLayerMask, 
    LayersPanel: LayersPanelProp, 
    layers, 
    selectedLayerId, 
    onSelectLayer, 
    onReorder, 
    toggleLayerVisibility, 
    renameLayer, 
    deleteLayer, 
    onDuplicateLayer, 
    onMergeLayerDown, 
    onRasterizeLayer, 
    onCreateSmartObject, 
    onOpenSmartObject, 
    onLayerPropertyCommit, 
    onLayerOpacityChange, 
    onLayerOpacityCommit, 
    addTextLayer, 
    addDrawingLayer, 
    onAddLayerFromBackground, 
    onLayerFromSelection, 
    addShapeLayer, 
    addGradientLayer, 
    onAddAdjustmentLayer, 
    selectedShapeType, 
    groupLayers, 
    toggleGroupExpanded, 
    hasActiveSelection, 
    onApplySelectionAsMask, 
    onToggleClippingMask, 
    onToggleLayerLock, 
    onDeleteHiddenLayers, 
    onRasterizeSmartObject, 
    onConvertSmartObjectToLayers, 
    onExportSmartObjectContents, 
    onArrangeLayer, 
    handleDestructiveOperation, 
    hasImage, 
    adjustments, 
    onAdjustmentChange, 
    onAdjustmentCommit, 
    effects, 
    onEffectChange, 
    onEffectCommit, 
    grading, 
    onGradingChange, 
    onGradingCommit, 
    hslAdjustments, 
    onHslAdjustmentChange, 
    onHslAdjustmentCommit, 
    curves, 
    onCurvesChange, 
    onCurvesCommit, 
    onFilterChange, 
    selectedFilter, 
    onTransformChange, 
    rotation, 
    onRotationChange, 
    onRotationCommit, 
    onAspectChange, 
    aspect, 
    frame, 
    onFramePresetChange, 
    onFramePropertyChange, 
    onFramePropertyCommit, 
    presets, 
    onApplyPreset, 
    onSavePreset, 
    onDeletePreset, 
    backgroundColor, 
    onForegroundColorChange, 
    onBackgroundColorChange, 
    onSwapColors,
    currentHistoryIndex,
    onHistoryJump,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    dimensions, 
    fileInfo, 
    exifData, 
    colorMode, 
    zoom, 
    onZoomIn, 
    onZoomOut, 
    onFitScreen,
    channels,
    onChannelChange,
    navigate,
  } = props;

  const toolOptionsContentProps: ToolOptionsContentProps = {
    activeTool, brushState, setBrushState, foregroundColor, setForegroundColor, backgroundColor,
    selectiveBlurAmount, onSelectiveBlurAmountChange, onSelectiveBlurAmountCommit,
    selectiveSharpenAmount, onSelectiveSharpenAmountChange, onSelectiveSharpenAmountCommit,
    selectionSettings, onSelectionSettingChange, onSelectionSettingCommit,
    gradientToolState, setGradientToolState, gradientPresets, onApplyGradientPreset: (preset) => setGradientToolState(preset.state),
    onSaveGradientPreset, onDeleteGradientPreset, cloneSourcePoint, history,
    historyBrushSourceIndex, setHistoryBrushSourceIndex, onAspectChange, aspect,
  };

  const renderToolOptionsContent = () => {
    return <ToolOptionsContent {...toolOptionsContentProps} />;
  };

  const renderTabContent = () => {
    switch (activeMobileTab) {
      case 'layers':
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Layers</h3>
            <LayersPanel
              layers={layers}
              selectedLayerId={selectedLayerId}
              onSelectLayer={onSelectLayer}
              onReorder={onReorder}
              toggleLayerVisibility={toggleLayerVisibility}
              renameLayer={renameLayer}
              deleteLayer={deleteLayer}
              onDuplicateLayer={onDuplicateLayer}
              onMergeLayerDown={onMergeLayerDown}
              onRasterizeLayer={onRasterizeLayer}
              onCreateSmartObject={onCreateSmartObject}
              onOpenSmartObject={onOpenSmartObject}
              onLayerPropertyCommit={onLayerPropertyCommit}
              onLayerOpacityChange={onLayerOpacityChange}
              onLayerOpacityCommit={onLayerOpacityCommit}
              onAddTextLayer={(coords) => addTextLayer(coords, foregroundColor)}
              onAddDrawingLayer={addDrawingLayer}
              onAddLayerFromBackground={onAddLayerFromBackground}
              onAddLayerFromSelection={onLayerFromSelection}
              onAddShapeLayer={(coords, shapeType, initialWidth, initialHeight) => addShapeLayer(coords, shapeType, initialWidth, initialHeight, foregroundColor, backgroundColor)}
              onAddGradientLayer={addGradientLayer}
              onAddAdjustmentLayer={onAddAdjustmentLayer}
              selectedShapeType={selectedShapeType}
              groupLayers={groupLayers}
              toggleGroupExpanded={toggleGroupExpanded}
              hasActiveSelection={hasActiveSelection}
              onApplySelectionAsMask={onApplySelectionAsMask}
              onRemoveLayerMask={onRemoveLayerMask}
              onInvertLayerMask={onInvertLayerMask}
              onToggleClippingMask={onToggleClippingMask}
              onToggleLayerLock={onToggleLayerLock}
              onDeleteHiddenLayers={onDeleteHiddenLayers}
              onRasterizeSmartObject={onRasterizeSmartObject}
              onConvertSmartObjectToLayers={onConvertSmartObjectToLayers}
              onExportSmartObjectContents={onExportSmartObjectContents}
              onArrangeLayer={onArrangeLayer}
              handleDestructiveOperation={handleDestructiveOperation}
            />
          </div>
        );
        
      case 'properties':
        // If a layer is selected, show its properties. 
        if (selectedLayer) {
          return (
            <div className="p-4 space-y-4">
                <h3 className="text-lg font-semibold">Layer Properties</h3>
                <LayerPropertiesContent
                    selectedLayer={selectedLayer}
                    imgRef={imgRef}
                    onLayerUpdate={(id, updates) => onLayerUpdate(id, updates)}
                    onLayerCommit={(id, name) => onLayerCommit(id, name)}
                    systemFonts={systemFonts}
                    customFonts={customFonts}
                    onOpenFontManager={onOpenFontManager}
                    gradientToolState={gradientToolState}
                    setGradientToolState={setGradientToolState}
                    gradientPresets={gradientPresets}
                    onSaveGradientPreset={onSaveGradientPreset}
                    onDeleteGradientPreset={onDeleteGradientPreset}
                    customHslColor={customHslColor}
                    setCustomHslColor={setCustomHslColor}
                    onRemoveLayerMask={onRemoveLayerMask}
                    onInvertLayerMask={onInvertLayerMask}
                />
            </div>
          );
        }
        // If no layer is selected, show Global Effects/Transform
        return (
            <div className="p-4 space-y-4">
                <h3 className="text-lg font-semibold">Global Effects</h3>
                <GlobalEffectsPanel
                    hasImage={hasImage}
                    effects={effects}
                    onEffectChange={onEffectChange}
                    onEffectCommit={onEffectCommit}
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
                    presets={presets}
                    onApplyPreset={onApplyPreset}
                    onSavePreset={(name) => onSavePreset(name)}
                    onDeletePreset={onDeletePreset}
                />
            </div>
        );
      case 'adjustments':
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Global Color Adjustments</h3>
            <ColorCorrectionPanel
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
              imgRef={imgRef}
              customHslColor={customHslColor}
              setCustomHslColor={setCustomHslColor}
            />
          </div>
        );
      case 'color':
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Color Palette</h3>
            <ColorPanel
              foregroundColor={foregroundColor}
              onForegroundColorChange={onForegroundColorChange}
              backgroundColor={backgroundColor}
              onBackgroundColorChange={onBackgroundColorChange}
              onSwapColors={onSwapColors}
            />
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-4 p-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5" /> AI Tools
            </h3>
            <Button onClick={onOpenGenerate} className="w-full">
              Generate New Image
            </Button>
            <Button onClick={onOpenGenerativeFill} className="w-full" disabled={!hasActiveSelection}>
              Generative Fill (Requires Selection)
            </Button>
            <Button onClick={onOpenSettings} variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" /> Configure API Keys
            </Button>
          </div>
        );
      case 'history':
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">History</h3>
            <HistoryPanel
              history={history}
              currentIndex={currentHistoryIndex}
              onJump={onHistoryJump}
              onUndo={onUndo}
              onRedo={onRedo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          </div>
        );
      case 'channels':
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Channels</h3>
            <ChannelsPanel channels={channels} onChannelChange={onChannelChange} />
          </div>
        );
      case 'brushes':
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Brushes</h3>
            <BrushesPanel brushState={brushState} setBrushState={setBrushState} />
          </div>
        );
      case 'paths':
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Paths</h3>
            <PathsPanel />
          </div>
        );
      case 'info':
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Document Info</h3>
            <InfoPanel
              dimensions={dimensions}
              fileInfo={fileInfo}
              imgRef={imgRef}
              exifData={exifData}
              colorMode={colorMode}
            />
          </div>
        );
      case 'navigator':
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Navigator</h3>
            <NavigatorPanel
              image={hasImage ? imgRef.current?.src || null : null}
              zoom={zoom}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
              onFitScreen={onFitScreen}
              dimensions={dimensions}
            />
          </div>
        );
      case 'templates':
        return (
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Templates</h3>
            <p className="text-sm text-muted-foreground">
              Browse and load community templates to start your project.
            </p>
            <Button onClick={() => navigate('/community')}>
              Go to Community Templates
            </Button>
          </div>
        );
      case 'tools':
        // If 'tools' tab is active, render the tool options content based on activeTool
        const toolOptions = renderToolOptionsContent();
        if (toolOptions) return <div className="p-4 space-y-4">{toolOptions}</div>;
        
        return <p className="text-sm text-muted-foreground p-4">Select a tool from the bottom bar.</p>;
      default:
        return <p className="text-sm text-muted-foreground p-4">Select a tool or panel from the bottom bar.</p>;
    }
  };

  return (
    <div className="w-full h-full">
      <ScrollArea className="h-full">
        {renderTabContent()}
      </ScrollArea>
    </div>
  );
};