import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers, SlidersHorizontal, Settings, Brush, Palette, LayoutGrid, PenTool, History } from "lucide-react";
import { ChannelsPanel } from "@/components/editor/ChannelsPanel";
import GlobalAdjustmentsPanel from "@/components/editor/GlobalAdjustmentsPanel";
import { LayerPropertiesContent } from "@/components/editor/LayerPropertiesContent";
import { BrushOptions } from "@/components/editor/BrushOptions";
import { BlurBrushOptions } from "@/components/editor/BlurBrushOptions";
import SelectionToolOptions from "@/components/editor/SelectionToolOptions";
import { PencilOptions } from "@/components/editor/PencilOptions";
import { PaintBucketOptions } from "@/components/editor/PaintBucketOptions";
import { StampOptions } from "@/components/editor/StampOptions";
import { HistoryBrushOptions } from "@/components/editor/HistoryBrushOptions";
import { GradientToolOptions } from "@/components/editor/GradientToolOptions";
import type { RightSidebarTabsProps } from "./Sidebar"; 
import BrushesPanel from "../auxiliary/BrushesPanel"; // Import BrushesPanel
import PathsPanel from "../auxiliary/PathsPanel"; // Import PathsPanel
import HistoryPanel from "../auxiliary/HistoryPanel"; // Import HistoryPanel

export const RightSidebarTabs: React.FC<RightSidebarTabsProps> = (props) => {
  const { activeTool, selectedLayer, brushState, setBrushState, selectiveBlurAmount, onSelectiveBlurAmountChange, onSelectiveBlurAmountCommit, history, cloneSourcePoint } = props;

  const isLayerSelected = !!selectedLayer;
  const isTextToolActive = activeTool === 'text';
  const isShapeToolActive = activeTool === 'shape';
  const isGradientToolActive = activeTool === 'gradient';
  
  const isLayerSpecificTool = isTextToolActive || isShapeToolActive || isGradientToolActive;
  const isLayerPropertyPanelActive = isLayerSelected && !isLayerSpecificTool;

  const renderPropertiesContent = () => {
    // 1. Layer Properties (if a layer is selected AND it's not a layer-specific tool)
    if (isLayerPropertyPanelActive) {
      return (
        <LayerPropertiesContent
          selectedLayer={selectedLayer}
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
    
    // 2. Tool Options (if a layer-specific tool is active)
    if (isLayerSpecificTool) {
      return (
        <LayerPropertiesContent
          selectedLayer={selectedLayer}
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
    
    // 3. Global Adjustments (if no layer is selected and no layer-specific tool is active)
    if (!isLayerSelected && !isLayerSpecificTool) {
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
    }

    return (
      <p className="text-sm text-muted-foreground p-4">
        Select a layer or activate a tool to view properties.
      </p>
    );
  };

  const renderToolOptionsContent = () => {
    const isBrushTool = activeTool === 'brush';
    const isEraserTool = activeTool === 'eraser';
    const isPencilTool = activeTool === 'pencil';
    const isSelectionBrushTool = activeTool === 'selectionBrush';
    const isBlurBrushTool = activeTool === 'blurBrush';
    const isStampTool = activeTool === 'cloneStamp' || activeTool === 'patternStamp';
    const isHistoryBrushTool = activeTool === 'historyBrush' || activeTool === 'artHistoryBrush';
    const isGradientTool = activeTool === 'gradient';
    const isPaintBucketTool = activeTool === 'paintBucket';
    const isSelectionTool = activeTool?.includes('marquee') || activeTool?.includes('lasso') || activeTool?.includes('select') || activeTool === 'quickSelect' || activeTool === 'magicWand' || activeTool === 'objectSelect' || activeTool === 'move';

    if (isBrushTool || isEraserTool) {
      return (
        <BrushOptions
          activeTool={isEraserTool ? 'eraser' : 'brush'}
          brushSize={brushState.size}
          setBrushSize={(size) => setBrushState({ size })}
          brushOpacity={brushState.opacity}
          setBrushOpacity={(opacity) => setBrushState({ opacity })}
          foregroundColor={props.foregroundColor}
          setForegroundColor={props.setForegroundColor}
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
          foregroundColor={props.foregroundColor}
          setForegroundColor={props.setForegroundColor}
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
    
    return (
      <p className="text-sm text-muted-foreground p-4">
        Select a tool to view its options.
      </p>
    );
  };

  return (
    <Tabs defaultValue="layers" className="w-full h-full flex flex-col">
      <TabsList className="w-full h-10 shrink-0 rounded-none border-b justify-start">
        <TabsTrigger value="layers" className="h-full flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background">
          <Layers className="h-4 w-4 mr-1" /> Layers
        </TabsTrigger>
        <TabsTrigger value="properties" className="h-full flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background">
          <Settings className="h-4 w-4 mr-1" /> Properties
        </TabsTrigger>
        <TabsTrigger value="brushes" className="h-full flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background">
          <Brush className="h-4 w-4 mr-1" /> Brushes
        </TabsTrigger>
        <TabsTrigger value="paths" className="h-full flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background">
          <PenTool className="h-4 w-4 mr-1" /> Paths
        </TabsTrigger>
        <TabsTrigger value="history" className="h-full flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background">
          <History className="h-4 w-4 mr-1" /> History
        </TabsTrigger>
        <TabsTrigger value="channels" className="h-full flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background">
          <Palette className="h-4 w-4 mr-1" /> Channels
        </TabsTrigger>
      </TabsList>

      <ScrollArea className="flex-1 mt-4">
        <div className="p-2">
          <TabsContent value="layers">
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
          </TabsContent>

          <TabsContent value="properties">
            {renderPropertiesContent()}
          </TabsContent>
          
          <TabsContent value="brushes">
            <div className="space-y-4">
              <h3 className="text-md font-semibold">Tool Options</h3>
              {renderToolOptionsContent()}
            </div>
            <BrushesPanel brushState={props.brushState} setBrushState={props.setBrushState} />
          </TabsContent>
          
          <TabsContent value="paths">
            <PathsPanel />
          </TabsContent>
          
          <TabsContent value="history">
            <HistoryPanel
              history={props.history}
              currentIndex={props.currentHistoryIndex}
              onJump={props.onHistoryJump}
              onUndo={props.onUndo}
              onRedo={props.onRedo}
              canUndo={props.canUndo}
              canRedo={props.canRedo}
            />
          </TabsContent>

          <TabsContent value="channels">
            <ChannelsPanel channels={props.channels} onChannelChange={props.onChannelChange} />
          </TabsContent>
        </div>
      </ScrollArea>
    </Tabs>
  );
};