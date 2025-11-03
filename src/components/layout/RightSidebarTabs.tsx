import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LayersPanel } from '@/components/editor/LayersPanel';
import { LayerPropertiesContent } from "@/components/editor/LayerPropertiesContent";
import { ToolOptionsContent } from "@/components/editor/ToolOptionsContent";
import GlobalEffectsPanel from "@/components/editor/GlobalEffectsPanel";
import HistoryPanel from "@/components/auxiliary/HistoryPanel";
import BrushesPanel from "@/components/auxiliary/BrushesPanel";
import PathsPanel from "@/components/auxiliary/PathsPanel";
import AdjustmentsPanel from "@/components/auxiliary/AdjustmentsPanel";
import { ChannelsPanel } from "@/components/editor/ChannelsPanel";
import Presets from "@/components/editor/Presets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, Layers, Settings, SlidersHorizontal, History, SquareStack, Brush, PenTool, Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DraggableTab } from "./DraggableTab";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { RightSidebarTabsProps } from "./Sidebar";
import type { PanelTab } from "@/types/editor/core";
import { Button } from '@/components/ui/button'; // ADDED

export const RightSidebarTabs: React.FC<RightSidebarTabsProps> = (props) => {
  const {
    panelLayout, activeRightTab, setActiveRightTab, reorderPanelTabs,
  } = props;

  const rightTabs = React.useMemo(() => {
    return panelLayout
      .filter(t => t.location === 'right' && t.visible)
      .sort((a, b) => a.order - b.order);
  }, [panelLayout]);

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: 'right-panel',
    data: { location: 'right' },
  });

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case 'layers':
        return (
          <LayersPanel
            layers={props.layers}
            selectedLayerId={props.selectedLayerId}
            selectedLayer={props.selectedLayer}
            selectedLayerIds={props.selectedLayerIds} // PASSED
            onSelectLayer={props.onSelectLayer} // PASSED
            onReorder={props.onLayerReorder}
            toggleLayerVisibility={props.toggleLayerVisibility}
            renameLayer={props.renameLayer}
            deleteLayer={props.deleteLayer}
            onDuplicateLayer={props.onDuplicateLayer}
            onMergeLayerDown={props.onMergeLayerDown}
            onRasterizeLayer={props.onRasterizeLayer}
            onCreateSmartObject={props.onCreateSmartObject}
            onOpenSmartObject={props.onOpenSmartObject}
            onLayerUpdate={props.onLayerUpdate}
            onLayerCommit={props.onLayerCommit}
            onLayerPropertyCommit={props.onLayerPropertyCommit}
            onLayerOpacityChange={props.onLayerOpacityChange}
            onLayerOpacityCommit={props.onLayerOpacityCommit}
            addTextLayer={props.addTextLayer}
            addDrawingLayer={props.addDrawingLayer}
            onAddLayerFromBackground={props.onAddLayerFromBackground}
            onLayerFromSelection={props.onLayerFromSelection}
            addShapeLayer={props.addShapeLayer}
            addGradientLayer={props.addGradientLayer}
            onAddAdjustmentLayer={props.onAddAdjustmentLayer}
            selectedShapeType={props.selectedShapeType}
            groupLayers={props.groupLayers}
            toggleGroupExpanded={props.toggleGroupExpanded}
            onRemoveLayerMask={props.onRemoveLayerMask}
            onInvertLayerMask={props.onInvertLayerMask}
            onToggleClippingMask={props.onToggleClippingMask}
            onToggleLayerLock={props.onToggleLayerLock}
            onDeleteHiddenLayers={props.onDeleteHiddenLayers}
            onRasterizeSmartObject={props.onRasterizeSmartObject}
            onConvertSmartObjectToLayers={props.onConvertSmartObjectToLayers}
            onExportSmartObjectContents={props.onExportSmartObjectContents}
            onArrangeLayer={props.onArrangeLayer}
            hasActiveSelection={props.hasActiveSelection}
            onApplySelectionAsMask={props.onApplySelectionAsMask}
            handleDestructiveOperation={props.handleDestructiveOperation}
            foregroundColor={props.foregroundColor}
          />
        );
      case 'properties':
        return (
          <div className="space-y-4">
            <ToolOptionsContent
              activeTool={props.activeTool}
              brushState={props.brushState}
              setBrushState={props.setBrushState}
              onBrushCommit={props.onBrushCommit}
              gradientToolState={props.gradientToolState}
              setGradientToolState={props.setGradientToolState}
              gradientPresets={props.gradientPresets}
              onApplyGradientPreset={(preset) => props.setGradientToolState(preset.state)}
              onSaveGradientPreset={props.onSaveGradientPreset}
              onDeleteGradientPreset={props.onDeleteGradientPreset}
              selectiveBlurAmount={props.selectiveBlurAmount}
              onSelectiveBlurAmountChange={props.onSelectiveBlurAmountChange}
              onSelectiveBlurAmountCommit={props.onSelectiveBlurAmountCommit}
              selectiveSharpenAmount={props.selectiveSharpenAmount}
              onSelectiveSharpenAmountChange={props.onSelectiveSharpenAmountChange}
              onSelectiveSharpenAmountCommit={props.onSelectiveSharpenAmountCommit}
              cloneSourcePoint={props.cloneSourcePoint}
              selectionSettings={props.selectionSettings}
              handleCheckboxChange={props.onSelectionSettingChange}
              handleValueChange={props.onSelectionSettingChange}
              handleValueCommit={props.onSelectionSettingCommit}
              history={props.history}
              historyBrushSourceIndex={props.historyBrushSourceIndex}
              setHistoryBrushSourceIndex={props.setHistoryBrushSourceIndex}
              foregroundColor={props.foregroundColor}
              setForegroundColor={props.setForegroundColor}
            />
            {props.selectedLayer && (
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
                currentEditState={props.currentEditState}
              />
            )}
          </div>
        );
      case 'effects':
        return (
          <GlobalEffectsPanel
            hasImage={props.hasImage}
            effects={props.effects} // FIX 24
            onEffectChange={props.onEffectChange} // FIX 25
            onEffectCommit={props.onEffectCommit} // FIX 26
            onFilterChange={props.onFilterChange} // FIX 27
            selectedFilter={props.selectedFilter} // FIX 28
            onTransformChange={props.onTransformChange} // FIX 29
            rotation={props.rotation} // FIX 30
            onRotationChange={props.onRotationChange} // FIX 31
            onRotationCommit={props.onRotationCommit} // FIX 32
            onAspectChange={props.onAspectChange} // FIX 33
            aspect={props.aspect} // FIX 34
            frame={props.frame} // FIX 35
            onFramePresetChange={props.onFramePresetChange} // FIX 36
            onFramePropertyChange={props.onFramePropertyChange} // FIX 37
            onFramePropertyCommit={props.onFramePropertyCommit} // FIX 38
            presets={props.presets}
            onApplyPreset={props.onApplyPreset}
            onSavePreset={props.onSavePreset}
            onDeletePreset={props.onDeletePreset}
          />
        );
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
        return (
          <ChannelsPanel
            channels={props.channels}
            onChannelChange={props.onChannelChange}
          />
        );
      case 'brushes':
        return (
          <BrushesPanel
            brushState={props.brushState}
            setBrushState={props.setBrushState}
          />
        );
      case 'paths':
        return <PathsPanel />;
      case 'adjustments':
        return (
          <AdjustmentsPanel
            onAddAdjustmentLayer={props.onAddAdjustmentLayer}
          />
        );
      case 'templates':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Community Templates</h3>
            <p className="text-sm text-muted-foreground">
              Browse and load community templates to start your project.
            </p>
            <Button onClick={() => props.onOpenSettings()}>
              Go to Community Templates (Stub)
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

      <ScrollArea className="flex-1">
        <div className="p-4">
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