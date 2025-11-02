import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers, SlidersHorizontal, Settings, Brush, Palette, LayoutGrid, PenTool, History, Info, Compass, SquareStack, Zap } from "lucide-react";
import { ChannelsPanel } from "@/components/editor/ChannelsPanel";
import GlobalEffectsPanel from "@/components/editor/GlobalEffectsPanel";
import { LayerPropertiesContent } from "@/components/editor/LayerPropertiesContent";
import { ToolOptionsContent } from "@/components/editor/ToolOptionsContent";
import type { RightSidebarTabsProps } from "./Sidebar"; 
import BrushesPanel from "../auxiliary/BrushesPanel";
import PathsPanel from "../auxiliary/PathsPanel";
import HistoryPanel from "../auxiliary/HistoryPanel";
import Crop from "@/components/editor/Crop";
import InfoPanel from "../auxiliary/InfoPanel";
import NavigatorPanel from "../auxiliary/NavigatorPanel";
import ColorCorrectionPanel from "../auxiliary/ColorCorrectionPanel";
import XtraAiPanel from "../auxiliary/XtraAiPanel";
import ColorPanel from "../auxiliary/ColorPanel";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { DraggableTab } from "./DraggableTab";
import type { PanelTab } from "@/types/editor/core";

export const RightSidebarTabs: React.FC<RightSidebarTabsProps> = (props) => {
  const { 
    activeTool, selectedLayer, brushState, setBrushState, selectiveBlurAmount, onSelectiveBlurAmountChange, onSelectiveBlurAmountCommit, history, cloneSourcePoint, selectiveSharpenAmount, onSelectiveSharpenAmountChange, onSelectiveSharpenAmountCommit,
    panelLayout, activeRightTab, setActiveRightTab,
  } = props;
  
  const navigate = useNavigate();

  const isLayerSelected = !!selectedLayer;
  
  const rightTabs = React.useMemo(() => {
    return panelLayout
      .filter(t => t.location === 'right' && t.visible)
      .sort((a, b) => a.order - b.order);
  }, [panelLayout]);

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: 'right-panel',
    data: { location: 'right' },
  });

  const renderToolOptionsContent = () => {
    if (!activeTool) return null;
    
    return (
      <ToolOptionsContent
        activeTool={activeTool}
        brushState={brushState}
        setBrushState={setBrushState}
        foregroundColor={props.foregroundColor}
        setForegroundColor={props.setForegroundColor}
        backgroundColor={props.backgroundColor}
        selectiveBlurAmount={selectiveBlurAmount}
        onSelectiveBlurAmountChange={onSelectiveBlurAmountChange}
        onSelectiveBlurAmountCommit={onSelectiveBlurAmountCommit}
        selectiveSharpenAmount={selectiveSharpenAmount}
        onSelectiveSharpenAmountChange={onSelectiveSharpenAmountChange}
        onSelectiveSharpenAmountCommit={onSelectiveSharpenAmountCommit}
        selectionSettings={props.selectionSettings}
        onSelectionSettingChange={props.onSelectionSettingChange}
        onSelectionSettingCommit={props.onSelectionSettingCommit}
        gradientToolState={props.gradientToolState}
        setGradientToolState={props.setGradientToolState}
        gradientPresets={props.gradientPresets}
        onApplyGradientPreset={(preset) => props.setGradientToolState(preset.state)}
        onSaveGradientPreset={props.onSaveGradientPreset}
        onDeleteGradientPreset={props.onDeleteGradientPreset}
        cloneSourcePoint={cloneSourcePoint}
        history={history}
        historyBrushSourceIndex={props.historyBrushSourceIndex}
        setHistoryBrushSourceIndex={props.setHistoryBrushSourceIndex}
        onAspectChange={props.onAspectChange}
        aspect={props.aspect}
      />
    );
  };

  const renderPropertiesContent = () => {
    // Priority 1: Tool Options (if a non-layer-specific tool is active)
    const toolOptions = renderToolOptionsContent();
    if (toolOptions) {
      return <div className="p-4 space-y-4">{toolOptions}</div>;
    }

    // Priority 2: Layer Properties (if a layer is selected)
    if (isLayerSelected) {
      return (
        <div className="p-4 space-y-4">
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
        </div>
      );
    }
    
    // Priority 3: Global Effects/Transform (if no layer is selected)
    return (
      <div className="p-4 space-y-4">
        <GlobalEffectsPanel
          hasImage={props.hasImage}
          effects={props.effects}
          onEffectChange={props.onEffectChange}
          onEffectCommit={props.onEffectCommit}
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
          presets={props.presets}
          onApplyPreset={props.onApplyPreset}
          onSavePreset={props.onSavePreset}
          onDeletePreset={props.onDeletePreset}
        />
      </div>
    );
  };
  
  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case 'layers':
        return (
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
        );
      case 'properties':
        return renderPropertiesContent();
      case 'brushes':
        return (
          <div className="space-y-4">
            <h3 className="text-md font-semibold p-2">Tool Options</h3>
            {/* Render tool options here if a tool is active */}
            {(activeTool) && (
              <div className="px-2">
                {renderToolOptionsContent()}
              </div>
            )}
            <BrushesPanel brushState={props.brushState} setBrushState={props.setBrushState} />
          </div>
        );
      case 'paths':
        return <PathsPanel />;
      case 'history':
        return (
          <HistoryPanel
            history={props.history}
            currentIndex={props.currentHistoryIndex}
            onJump={props.onHistoryJump}
            onUndo={props.onUndo}
            onRedo={props.onRedo}
            canUndo={props.canUndo}
            canRedo={props.canRedo}
          />
        );
      case 'channels':
        return <ChannelsPanel channels={props.channels} onChannelChange={props.onChannelChange} />;
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
      case 'correction':
        return (
          <ColorCorrectionPanel
            adjustments={props.adjustments}
            onAdjustmentChange={props.onAdjustmentChange}
            onAdjustmentCommit={props.onAdjustmentCommit}
            grading={props.grading}
            onGradingChange={props.onGradingChange}
            onGradingCommit={props.onGradingCommit}
            hslAdjustments={props.hslAdjustments}
            onHslAdjustmentChange={props.onHslAdjustmentChange}
            onHslAdjustmentCommit={props.onHslAdjustmentCommit}
            curves={props.curves}
            onCurvesChange={props.onCurvesChange}
            onCurvesCommit={props.onCurvesCommit}
            imgRef={props.imgRef}
            customHslColor={props.customHslColor}
            setCustomHslColor={props.setCustomHslColor}
          />
        );
      case 'ai-xtra':
        return (
          <XtraAiPanel
            hasImage={props.hasImage}
            base64Image={props.base64Image}
            dimensions={props.dimensions}
            geminiApiKey={props.geminiApiKey}
            onImageResult={props.onImageResult}
            onMaskResult={props.onMaskResult}
            onOpenSettings={props.onOpenSettings}
          />
        );
      case 'info':
        return (
          <InfoPanel
            dimensions={props.dimensions}
            fileInfo={props.fileInfo}
            imgRef={props.imgRef}
            exifData={props.exifData}
            colorMode={props.colorMode}
          />
        );
      case 'navigator':
        return (
          <NavigatorPanel
            image={props.hasImage ? props.imgRef.current?.src || null : null}
            zoom={props.zoom}
            onZoomIn={props.onZoomIn}
            onZoomOut={props.onZoomOut}
            onFitScreen={props.onFitScreen}
            dimensions={props.dimensions}
          />
        );
      case 'templates':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Browse and load community templates to start your project.
            </p>
            <Button onClick={() => navigate('/community')}>
              Go to Community Templates
            </Button>
          </div>
        );
      default:
        return <div className="p-4 text-muted-foreground">Panel not found.</div>;
    }
  };

  return (
    <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="w-full h-full flex flex-col">
      <TabsList className="w-full h-10 shrink-0 rounded-none border-b justify-start p-0" ref={setDroppableNodeRef}>
        <SortableContext
          items={rightTabs.map(t => t.id)}
          strategy={horizontalListSortingStrategy}
        >
          {rightTabs.map((tab) => (
            <DraggableTab
              key={tab.id}
              tab={tab}
              isActive={activeRightTab === tab.id}
              onSelect={setActiveRightTab}
            />
          ))}
        </SortableContext>
      </TabsList>

      <ScrollArea className="flex-1 mt-4">
        <div className="p-2">
          {rightTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-0">
              {renderTabContent(tab.id)}
            </TabsContent>
          ))}
        </div>
      </ScrollArea>
    </Tabs>
  );
};