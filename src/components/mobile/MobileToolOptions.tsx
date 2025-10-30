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
import { Sparkles, Settings } from "lucide-react";
import type { RightSidebarTabsProps } from "@/components/layout/RightSidebarTabs";
import { LayerPropertiesContent } from "../editor/LayerPropertiesContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// We reuse the props interface from RightSidebarTabsProps for convenience
interface MobileToolOptionsProps extends RightSidebarTabsProps {
  activeMobileTab: MobileTab;
  onOpenSettings: () => void;
  onOpenGenerate: () => void;
  onOpenGenerativeFill: () => void;
}

export const MobileToolOptions: React.FC<MobileToolOptionsProps> = (props) => {
  const { activeTool, activeMobileTab, brushState, setBrushState, foregroundColor, setForegroundColor, onOpenSettings, onOpenGenerate, onOpenGenerativeFill, history } = props;

  const isBrushTool = activeTool === 'brush';
  const isEraserTool = activeTool === 'eraser';
  const isPencilTool = activeTool === 'pencil';
  const isSelectionBrushTool = activeTool === 'selectionBrush';
  const isBlurBrushTool = activeTool === 'blurBrush';
  const isStampTool = activeTool === 'cloneStamp' || activeTool === 'patternStamp';
  const isHistoryBrushTool = activeTool === 'historyBrush' || activeTool === 'artHistoryBrush';
  const isGradientTool = activeTool === 'gradient';
  const isPaintBucketTool = activeTool === 'paintBucket';
  const isSelectionTool = activeTool?.includes('marquee') || activeTool?.includes('lasso') || activeTool?.includes('select');

  const renderToolOptions = () => {
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
          onStrengthChange={props.onSelectiveBlurAmountChange}
          onStrengthCommit={props.onSelectiveBlurAmountCommit}
        />
      );
    }
    if (isSelectionTool) {
      return (
        <SelectionToolOptions
          activeTool={activeTool}
          settings={props.selectionSettings}
          onSettingChange={props.onSelectionSettingChange}
          onSettingCommit={props.onSelectionSettingCommit}
        />
      );
    }
    if (isGradientTool) {
      return (
        <GradientToolOptions
          gradientToolState={props.gradientToolState}
          setGradientToolState={props.setGradientToolState}
          gradientPresets={props.gradientPresets}
          onApplyGradientPreset={(preset) => props.setGradientToolState(preset.state)}
          onSaveGradientPreset={props.onSaveGradientPreset}
          onDeleteGradientPreset={props.onDeleteGradientPreset}
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
          historyBrushSourceIndex={props.historyBrushSourceIndex}
          setHistoryBrushSourceIndex={props.setHistoryBrushSourceIndex}
        />
      );
    }
    
    return (
      <p className="text-sm text-muted-foreground p-4">
        Select a tool to view its options.
      </p>
    );
  };

  const renderTabContent = () => {
    switch (activeMobileTab) {
      case 'tools':
        // Render tool-specific options if a tool is active
        if (activeTool && activeTool !== 'move' && activeTool !== 'crop' && activeTool !== 'text' && activeTool !== 'eyedropper') {
          return renderToolOptions();
        }
        // Fallthrough to properties if no specific tool options are needed (e.g., Move, Crop, Text)
      case 'properties':
        if (props.selectedLayer) {
          return (
            <LayerPropertiesContent
              selectedLayer={props.selectedLayer}
              imgRef={props.imgRef}
              onLayerUpdate={props.onLayerUpdate}
              onLayerCommit={props.onLayerCommit}
              systemFonts={props.systemFonts}
              customFonts={props.customFonts}
              onOpenFontManager={props.onOpenFontManager}
              gradientToolState={props.gradientToolState}
              setGradientToolState={props.setGradientToolState}
              gradientPresets={props.gradientPresets}
              onSaveGradientPreset={props.onSaveGradientPreset}
              onDeleteGradientPreset={props.onDeleteGradientPreset}
              customHslColor={props.customHslColor}
              setCustomHslColor={props.setCustomHslColor}
              onRemoveLayerMask={props.onRemoveLayerMask}
              onInvertLayerMask={props.onInvertLayerMask}
            />
          );
        }
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-base">Layers</CardTitle>
            </CardHeader>
            <CardContent>
              <props.LayersPanel
                layers={props.layers}
                selectedLayerId={props.selectedLayerId}
                onSelectLayer={props.onSelectLayer}
                onReorder={props.onReorder}
                toggleLayerVisibility={props.toggleLayerVisibility}
                renameLayer={props.renameLayer}
                deleteLayer={props.deleteLayer}
                onDuplicateLayer={props.onDuplicateLayer}
                onMergeLayerDown={props.onMergeLayerDown}
                onRasterizeLayer={props.onRasterizeLayer}
                onCreateSmartObject={props.onCreateSmartObject}
                onOpenSmartObject={props.onOpenSmartObject}
                onLayerPropertyCommit={props.onLayerPropertyCommit}
                onLayerOpacityChange={props.onLayerOpacityChange}
                onLayerOpacityCommit={props.onLayerOpacityCommit}
                onAddTextLayer={(coords) => props.addTextLayer(coords, props.foregroundColor)}
                onAddDrawingLayer={props.addDrawingLayer}
                onAddLayerFromBackground={props.onAddLayerFromBackground}
                onLayerFromSelection={props.onLayerFromSelection}
                onAddShapeLayer={(coords, shapeType, initialWidth, initialHeight) => props.addShapeLayer(coords, shapeType, initialWidth, initialHeight, props.foregroundColor, props.backgroundColor)}
                onAddGradientLayer={props.addGradientLayer}
                onAddAdjustmentLayer={props.onAddAdjustmentLayer}
                selectedShapeType={props.selectedShapeType}
                groupLayers={props.groupLayers}
                toggleGroupExpanded={props.toggleGroupExpanded}
                hasActiveSelection={props.hasActiveSelection}
                onApplySelectionAsMask={props.onApplySelectionAsMask}
                onRemoveLayerMask={props.onRemoveLayerMask}
                onInvertLayerMask={props.onInvertLayerMask}
                onToggleClippingMask={props.onToggleClippingMask}
                onToggleLayerLock={props.onToggleLayerLock}
                onDeleteHiddenLayers={props.onDeleteHiddenLayers}
                onRasterizeSmartObject={props.onRasterizeSmartObject}
                onConvertSmartObjectToLayers={props.onConvertSmartObjectToLayers}
                onExportSmartObjectContents={props.onExportSmartObjectContents}
                onArrangeLayer={props.onArrangeLayer}
                handleDestructiveOperation={props.handleDestructiveOperation}
              />
            </CardContent>
          </Card>
        );
      case 'adjustments':
        return (
          <GlobalAdjustmentsPanel
            hasImage={props.hasImage}
            adjustments={props.adjustments}
            onAdjustmentChange={props.onAdjustmentChange}
            onAdjustmentCommit={props.onAdjustmentCommit}
            effects={props.effects}
            onEffectChange={props.onEffectChange}
            onEffectCommit={props.onEffectCommit}
            grading={props.grading}
            onGradingChange={props.onGradingChange}
            onGradingCommit={props.onGradingCommit}
            hslAdjustments={props.hslAdjustments}
            onHslAdjustmentChange={props.onHslAdjustmentChange}
            onHslAdjustmentCommit={props.onHslAdjustmentCommit}
            curves={props.curves}
            onCurvesChange={props.onCurvesChange}
            onCurvesCommit={props.onCurvesCommit}
            onFilterChange={props.onFilterChange}
            selectedFilter={props.selectedFilter}
            onTransformChange={props.onTransformChange}
            rotation={props.rotation}
            onRotationChange={props.onRotationChange}
            onRotationCommit={props.onRotationCommit}
            onAspectChange={props.onAspectChange}
            aspect={props.aspect}
            frame={props.frame}
            onFramePresetChange={props.onFramePresetChange}
            onFramePropertyChange={props.onFramePropertyChange}
            onFramePropertyCommit={props.onFramePropertyCommit}
            imgRef={props.imgRef}
            customHslColor={props.customHslColor}
            setCustomHslColor={props.setCustomHslColor}
            presets={props.presets}
            onApplyPreset={props.onApplyPreset}
            onSavePreset={props.onSavePreset}
            onDeletePreset={props.onDeletePreset}
          />
        );
      case 'color':
        return (
          <ColorPanel
            foregroundColor={props.foregroundColor}
            onForegroundColorChange={props.onForegroundColorChange}
            backgroundColor={props.backgroundColor}
            onBackgroundColorChange={props.onBackgroundColorChange}
            onSwapColors={props.onSwapColors}
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
            <Button onClick={onOpenGenerativeFill} className="w-full" disabled={!props.hasActiveSelection}>
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