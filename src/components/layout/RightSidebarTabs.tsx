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
            {...props}
            onSelectLayer={(id, ctrlKey, shiftKey) => props.onSelectLayer(id, ctrlKey, shiftKey)}
            onReorder={(activeId, overId) => props.onReorder(activeId, overId, 'right')}
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
              />
            )}
          </div>
        );
      case 'effects':
        return (
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
            onFramePresetChange={(type, name, options) => props.onFramePresetChange(type, options)}
            onFramePropertyChange={props.onFramePropertyChange}
            onFramePropertyCommit={props.onFramePropertyCommit}
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