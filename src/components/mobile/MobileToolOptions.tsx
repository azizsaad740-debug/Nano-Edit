"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MobileTab } from "./MobileBottomNav";
import { BrushOptions } from "@/components/editor/BrushOptions";
import { PencilOptions } from "@/components/editor/PencilOptions";
import { BlurBrushOptions } from "@/components/editor/BlurBrushOptions";
import { PaintBucketOptions } from "@/components/editor/PaintBucketOptions";
import { StampOptions } from "@/components/editor/StampOptions";
import { HistoryBrushOptions } from "@/components/editor/HistoryBrushOptions";
import { GradientToolOptions } from "@/components/editor/GradientToolOptions";
import SelectionToolOptions from "@/components/editor/SelectionToolOptions";
import GlobalAdjustmentsPanel from "@/components/editor/GlobalAdjustmentsPanel";
import ColorPanel from "@/components/auxiliary/ColorPanel";
import { Button } from "@/components/ui/button";
import { Sparkles, Settings, Zap } from "lucide-react";
import type { RightSidebarTabsProps } from "@/components/layout/Sidebar";
import { LayerPropertiesContent } from "../editor/LayerPropertiesContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Crop from "@/components/editor/Crop"; // Import Crop
import Transform from "@/components/editor/Transform"; // Import Transform
import { TextOptions } from "../editor/TextOptions"; // Import TextOptions
import ShapeOptions from "../editor/ShapeOptions"; // Import ShapeOptions
import { GradientOptions } from "../editor/GradientOptions"; // Import GradientOptions
import { Label } from "@/components/ui/label";

// We reuse the props interface from RightSidebarTabsProps for convenience
interface MobileToolOptionsProps extends RightSidebarTabsProps {
  activeMobileTab: MobileTab;
  onOpenSettings: () => void;
  onOpenGenerate: () => void;
  onOpenGenerativeFill: () => void;
}

export const MobileToolOptions: React.FC<MobileToolOptionsProps> = (props) => {
  // Destructure all required props from RightSidebarTabsProps
  const { 
    activeTool, activeMobileTab, brushState, setBrushState, foregroundColor, setForegroundColor, 
    onOpenSettings, onOpenGenerate, onOpenGenerativeFill, history,
    selectiveBlurAmount, 
    onSelectiveBlurAmountChange, 
    onSelectiveBlurAmountCommit, 
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
    LayersPanel, 
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
  } = props;

  const isBrushTool = activeTool === 'brush';
  const isEraserTool = activeTool === 'eraser';
  const isPencilTool = activeTool === 'pencil';
  const isSelectionBrushTool = activeTool === 'selectionBrush';
  const isBlurBrushTool = activeTool === 'blurBrush';
  const isStampTool = activeTool === 'cloneStamp' || activeTool === 'patternStamp';
  const isHistoryBrushTool = activeTool === 'historyBrush' || activeTool === 'artHistoryBrush';
  const isGradientTool = activeTool === 'gradient';
  const isPaintBucketTool = activeTool === 'paintBucket';
  const isSelectionTool = activeTool?.includes('marquee') || activeTool?.includes('lasso') || activeTool?.includes('select') || activeTool === 'quickSelect' || activeTool === 'magicWand' || activeTool === 'objectSelect';
  
  // Renamed to renderBrushAndFillOptions to avoid collision with renderToolOptionsContent
  const renderBrushAndFillOptions = () => {
    if (isBrushTool || isEraserTool) {
      return (
        <BrushOptions
          activeTool={isEraserTool ? 'eraser' : 'brush'}
          brushSize={brushState.size}
          setBrushSize={(size) => setBrushState({ size })}
          brushOpacity={brushState.opacity}
          setBrushOpacity={(opacity) => setBrushState({ opacity })}
          foregroundColor={foregroundColor}
          setForegroundColor={setForegroundColor}
          brushHardness={brushState.hardness}
          setBrushHardness={(hardness) => setBrushState({ hardness })}
          brushSmoothness={brushState.smoothness}
          setBrushSmoothness={(smoothness) => setBrushState({ smoothness })}
          brushShape={brushState.shape}
          setBrushShape={(shape) => setBrushState({ shape })}
          brushFlow={brushState.flow}
          setBrushFlow={(flow) => setBrushState({ flow })}
          brushAngle={brushState.angle}
          setBrushAngle={(angle) => setBrushState({ angle })}
          brushRoundness={brushState.roundness}
          setBrushRoundness={(roundness) => setBrushState({ roundness })}
          brushSpacing={brushState.spacing}
          setBrushSpacing={(spacing) => setBrushState({ spacing })}
          brushBlendMode={brushState.blendMode}
          setBrushBlendMode={(blendMode) => setBrushState({ blendMode })}
        />
      );
    }
    if (isPencilTool) {
      return (
        <PencilOptions
          brushState={brushState}
          setBrushState={setBrushState}
          foregroundColor={foregroundColor}
          setForegroundColor={setForegroundColor}
        />
      );
    }
    if (isSelectionBrushTool) {
      return (
        <BlurBrushOptions
          selectiveBlurStrength={selectiveBlurAmount}
          onStrengthChange={onSelectiveBlurAmountChange}
          onStrengthCommit={onSelectiveBlurAmountCommit}
        />
      );
    }
    if (isGradientTool) {
      return (
        <GradientToolOptions
          gradientToolState={gradientToolState}
          setGradientToolState={setGradientToolState}
          gradientPresets={gradientPresets}
          onApplyGradientPreset={(preset) => setGradientToolState(preset.state)}
          onSaveGradientPreset={onSaveGradientPreset}
          onDeleteGradientPreset={onDeleteGradientPreset}
        />
      );
    }
    if (isPaintBucketTool) {
      return <PaintBucketOptions />;
    }
    if (isStampTool) {
      return <StampOptions cloneSourcePoint={cloneSourcePoint} />;
    }
    if (isHistoryBrushTool) {
      return (
        <HistoryBrushOptions
          activeTool={activeTool as 'historyBrush' | 'artHistoryBrush'}
          history={history}
          brushSize={brushState.size}
          setBrushSize={(size) => setBrushState({ size })}
          brushOpacity={brushState.opacity}
          setBrushOpacity={(opacity) => setBrushState({ opacity })}
          brushFlow={brushState.flow}
          setBrushFlow={(flow) => setBrushState({ flow })}
          historyBrushSourceIndex={historyBrushSourceIndex}
          setHistoryBrushSourceIndex={setHistoryBrushSourceIndex}
        />
      );
    }
    
    return null;
  };

  const renderToolOptionsContent = () => {
    // 1. Tools with dedicated option components (Brushes, Selection, Fill, Stamp, History)
    const brushAndFillOptions = renderBrushAndFillOptions();
    if (brushAndFillOptions) {
      return <div className="p-4 space-y-4">{brushAndFillOptions}</div>;
    }

    // 2. Selection Tools (Marquee, Lasso, QuickSelect, MagicWand, ObjectSelect)
    if (isSelectionTool || activeTool === 'move') {
        return (
            <div className="p-4 space-y-4">
                <SelectionToolOptions
                    activeTool={activeTool}
                    settings={selectionSettings}
                    onSettingChange={onSelectionSettingChange}
                    onSettingCommit={onSelectionSettingCommit}
                />
            </div>
        );
    }
    
    // 3. Crop Tool
    if (activeTool === 'crop') {
      return (
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-semibold">Crop Tool Options</h3>
          <Crop onAspectChange={props.onAspectChange} currentAspect={props.aspect} />
        </div>
      );
    }
    
    // 4. Text Tool
    if (activeTool === 'text') {
        if (!selectedLayer || selectedLayer.type !== 'text') {
            return <p className="text-sm text-muted-foreground p-4">Click on the canvas to create a new text layer, or select an existing text layer to edit its properties.</p>;
        }
        return (
            <div className="p-4 space-y-4">
                <h3 className="text-lg font-semibold">Text Tool Properties</h3>
                <TextOptions
                    layer={selectedLayer}
                    onLayerUpdate={(updates) => onLayerUpdate(selectedLayer.id, updates)}
                    onLayerCommit={(name) => onLayerCommit(selectedLayer.id, name)}
                    systemFonts={systemFonts}
                    customFonts={customFonts}
                    onOpenFontManager={onOpenFontManager}
                />
            </div>
        );
    }
    
    // 5. Shape Tool
    if (activeTool === 'shape') {
        if (!selectedLayer || selectedLayer.type !== 'vector-shape') {
            return <p className="text-sm text-muted-foreground p-4">Click on the canvas to draw a new shape, or select an existing shape layer to edit its properties.</p>;
        }
        return (
            <div className="p-4 space-y-4">
                <h3 className="text-lg font-semibold">Shape Tool Properties</h3>
                <ShapeOptions
                    layer={selectedLayer}
                    onLayerUpdate={(updates) => onLayerUpdate(selectedLayer.id, updates)}
                    onLayerCommit={(name) => onLayerCommit(selectedLayer.id, name)}
                />
            </div>
        );
    }
    
    // 6. Gradient Tool (Layer Properties)
    if (activeTool === 'gradient') {
        if (!selectedLayer || selectedLayer.type !== 'gradient') {
            return <div className="p-4 space-y-4"><h3 className="text-lg font-semibold">Gradient Tool Defaults</h3>{renderBrushAndFillOptions()}</div>;
        }
        return (
            <div className="p-4 space-y-4">
                <h3 className="text-lg font-semibold">Gradient Layer Properties</h3>
                <GradientOptions
                    layer={selectedLayer}
                    onLayerUpdate={(updates) => onLayerUpdate(selectedLayer.id, updates)}
                    onLayerCommit={(name) => onLayerCommit(selectedLayer.id, name)}
                    gradientToolState={gradientToolState}
                    setGradientToolState={setGradientToolState}
                    gradientPresets={gradientPresets}
                    onSaveGradientPreset={onSaveGradientPreset}
                    onDeleteGradientPreset={onDeleteGradientPreset}
                />
            </div>
        );
    }
    
    // 7. Other tools (Eyedropper)
    if (activeTool === 'eyedropper') {
        return (
            <p className="text-sm text-muted-foreground p-4">
                Eyedropper Tool is active. Click on the image to sample a color.
            </p>
        );
    }

    return (
      <p className="text-sm text-muted-foreground p-4">
        Select a tool from the bottom bar.
      </p>
    );
  };

  const renderTabContent = () => {
    switch (activeMobileTab) {
      case 'tools':
        return renderToolOptionsContent();
        
      case 'properties':
        // If a layer is selected, show its properties. Otherwise, show the Layers Panel.
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
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-base">Layers</CardTitle>
            </CardHeader>
            <CardContent>
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
                onLayerFromSelection={onLayerFromSelection}
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
            </CardContent>
          </Card>
        );
      case 'adjustments':
        return (
          <GlobalAdjustmentsPanel
            hasImage={hasImage}
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
            imgRef={imgRef}
            customHslColor={customHslColor}
            setCustomHslColor={setCustomHslColor}
            presets={presets}
            onApplyPreset={onApplyPreset}
            onSavePreset={onSavePreset}
            onDeletePreset={onDeletePreset}
          />
        );
      case 'color':
        return (
          <ColorPanel
            foregroundColor={foregroundColor}
            onForegroundColorChange={onForegroundColorChange}
            backgroundColor={backgroundColor}
            onBackgroundColorChange={onBackgroundColorChange}
            onSwapColors={onSwapColors}
          />
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
      default:
        return null;
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