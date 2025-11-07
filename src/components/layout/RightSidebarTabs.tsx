"use client";

import * as React from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { DraggableTab } from "./DraggableTab";
import { TooltipProvider } from "@/components/ui/tooltip";

// Content Components
import { LayersPanel } from "@/components/editor/LayersPanel";
import { ToolOptionsContent } from "@/components/editor/ToolOptionsContent";
import { LayerPropertiesContent } from "@/components/editor/LayerPropertiesContent";
import HistoryPanel from "@/components/auxiliary/HistoryPanel";
import { ChannelsPanel } from "@/components/editor/ChannelsPanel";
import BrushesPanel from "@/components/auxiliary/BrushesPanel";
import PathsPanel from "@/components/auxiliary/PathsPanel";
import AdjustmentsPanel from "@/components/auxiliary/AdjustmentsPanel";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";

import type { Layer, EditState, PanelTab, Point, GradientToolState, BrushState, SelectionSettings, ShapeType, HslAdjustment, ActiveTool } from "@/types/editor";
import type { Preset } from "@/hooks/usePresets";
import type { GradientPreset } from "@/hooks/useGradientPresets";

type HslColorKey = keyof EditState['hslAdjustments'];

export interface RightSidebarTabsProps {
  // Core State
  layers: Layer[];
  currentEditState: EditState;
  history: { name: string }[];
  currentHistoryIndex: number;
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  selectedLayer: Layer | undefined;
  dimensions: { width: number; height: number } | null;
  imgRef: React.RefObject<HTMLImageElement>;
  foregroundColor: string;
  backgroundColor: string;
  
  // Tool State
  activeTool: ActiveTool;
  brushState: BrushState;
  gradientToolState: GradientToolState;
  selectiveBlurAmount: number;
  selectiveSharpenAmount: number;
  cloneSourcePoint: Point | null;
  selectionSettings: SelectionSettings;
  historyBrushSourceIndex: number;
  
  // Presets
  presets: Preset[];
  gradientPresets: GradientPreset[];
  
  // Handlers
  onSelectLayer: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
  onLayerReorder: (activeId: string, overId: string) => void;
  toggleLayerVisibility: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  deleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMergeLayerDown: (id: string) => void;
  onRasterizeLayer: (id: string) => void;
  onCreateSmartObject: (layerIds: string[]) => void;
  onOpenSmartObject: (id: string) => void;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string, historyName: string) => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void;
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
  addTextLayer: (coords: Point, color: string) => void;
  addDrawingLayer: (coords: Point, dataUrl: string) => string;
  onAddLayerFromBackground: () => void;
  onLayerFromSelection: () => void;
  addShapeLayer: (coords: Point, shapeType?: ShapeType) => void;
  addGradientLayer: () => void;
  onAddAdjustmentLayer: (type: 'brightness' | 'curves' | 'hsl' | 'grading') => void;
  selectedShapeType: ShapeType | null;
  groupLayers: (layerIds: string[]) => void;
  toggleGroupExpanded: (id: string) => void;
  onRemoveLayerMask: (id: string) => void;
  onInvertLayerMask: (id: string) => void;
  onToggleClippingMask: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  onDeleteHiddenLayers: () => void;
  onRasterizeSmartObject: (id: string) => void;
  onConvertSmartObjectToLayers: (id: string) => void;
  onExportSmartObjectContents: (id: string) => void;
  onArrangeLayer: (direction: 'front' | 'back' | 'forward' | 'backward') => void;
  hasActiveSelection: boolean;
  onApplySelectionAsMask: () => void;
  handleDestructiveOperation: (operation: 'delete' | 'fill') => void;
  onBrushCommit: () => void;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>;
  onSelectiveBlurAmountChange: (value: number) => void;
  onSelectiveBlurAmountCommit: (value: number) => void;
  onSelectiveSharpenAmountChange: (value: number) => void;
  onSelectiveSharpenAmountCommit: (value: number) => void;
  onSelectionSettingChange: (key: keyof SelectionSettings, value: any) => void;
  onSelectionSettingCommit: (key: keyof SelectionSettings, value: any) => void;
  setHistoryBrushSourceIndex: (index: number) => void;
  setForegroundColor: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Preset Actions
  onApplyPreset: (preset: Preset) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (name: string) => void;
  onSaveGradientPreset: (name: string, state: GradientToolState) => void;
  onDeleteGradientPreset: (name: string) => void;
  
  // External/Dialogs
  onOpenFontManager: () => void;
  onOpenSettings: () => void;
  clearSelectionState: () => void;
  systemFonts: string[];
  customFonts: string[];
  customHslColor: string;
  setCustomHslColor: (color: string) => void;
  
  // Panel Management
  panelLayout: PanelTab[];
  reorderPanelTabs: (activeId: string, overId: string, newLocation: 'right' | 'bottom') => void;
  activeRightTab: string;
  setActiveRightTab: (tab: string) => void;
  activeBottomTab: string;
  setActiveBottomTab: (tab: string) => void;
  setCurrentHistoryIndex: (index: number) => void;
  onChannelChange: (channel: 'r' | 'g' | 'b', value: boolean) => void;
}

export const RightSidebarTabs: React.FC<RightSidebarTabsProps> = (props) => {
  const navigate = useNavigate();
  const {
    panelLayout, activeRightTab, setActiveRightTab, reorderPanelTabs,
    layers, selectedLayerId, selectedLayerIds, selectedLayer,
    onSelectLayer, onLayerReorder, toggleLayerVisibility, renameLayer,
    onLayerUpdate, onLayerCommit, onLayerPropertyCommit, onLayerOpacityChange, onLayerOpacityCommit,
    onUndo, onRedo, canUndo, canRedo,
    onAddAdjustmentLayer,
    onOpenSettings,
    // ... many other props
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id === over?.id) return;

    const activeTab = panelLayout.find(t => t.id === active.id);
    const overTab = panelLayout.find(t => t.id === over?.id);
    
    if (activeTab && overTab && activeTab.location === overTab.location) {
      // Reordering within the same panel
      onLayerReorder(active.id as string, over.id as string);
    } else if (activeTab && over?.data.current?.location) {
      // Moving between panels (or from hidden to visible panel)
      reorderPanelTabs(active.id as string, over.id as string, over.data.current.location as 'right' | 'bottom');
    }
  };

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case 'layers':
        return (
          <LayersPanel
            layers={layers}
            selectedLayerId={selectedLayerId}
            selectedLayer={selectedLayer}
            selectedLayerIds={selectedLayerIds}
            onSelectLayer={onSelectLayer}
            onReorder={onLayerReorder}
            toggleLayerVisibility={toggleLayerVisibility}
            renameLayer={renameLayer}
            deleteLayer={props.deleteLayer}
            onDuplicateLayer={props.onDuplicateLayer}
            onMergeLayerDown={props.onMergeLayerDown}
            onRasterizeLayer={props.onRasterizeLayer}
            onCreateSmartObject={props.onCreateSmartObject}
            onOpenSmartObject={props.onOpenSmartObject}
            onLayerUpdate={onLayerUpdate}
            onLayerCommit={onLayerCommit}
            onLayerPropertyCommit={onLayerPropertyCommit}
            onLayerOpacityChange={onLayerOpacityChange}
            onLayerOpacityCommit={onLayerOpacityCommit}
            addTextLayer={props.addTextLayer}
            addDrawingLayer={props.addDrawingLayer}
            onAddLayerFromBackground={props.onAddLayerFromBackground}
            onLayerFromSelection={props.onLayerFromSelection}
            addShapeLayer={props.addShapeLayer}
            addGradientLayer={props.addGradientLayer}
            onAddAdjustmentLayer={onAddAdjustmentLayer}
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
            <h3 className="text-sm font-medium">Tool Options</h3>
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
            {selectedLayer && (
              <>
                <h3 className="text-sm font-medium pt-4 border-t">Layer Properties</h3>
                <LayerPropertiesContent
                  selectedLayer={selectedLayer}
                  imgRef={props.imgRef}
                  onLayerUpdate={onLayerUpdate}
                  onLayerCommit={onLayerCommit}
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
              </>
            )}
          </div>
        );
      case 'history':
        return (
          <HistoryPanel
            history={props.history}
            currentIndex={props.currentHistoryIndex}
            onJump={props.setCurrentHistoryIndex}
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        );
      case 'channels':
        return (
          <ChannelsPanel
            channels={props.currentEditState.channels}
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
        return <AdjustmentsPanel onAddAdjustmentLayer={onAddAdjustmentLayer} />;
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
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="w-full h-full flex flex-col">
        <TabsList className="w-full h-10 shrink-0 rounded-none border-b justify-start p-0" ref={setDroppableNodeRef}>
          <SortableContext
            items={rightTabs.map(t => t.id)}
            strategy={horizontalListSortingStrategy}
          >
            <TooltipProvider>
              {rightTabs.map((tab) => (
                <DraggableTab
                  key={tab.id}
                  tab={tab}
                  isActive={activeRightTab === tab.id}
                  onSelect={setActiveRightTab}
                />
              ))}
            </TooltipProvider>
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
    </DndContext>
  );
};