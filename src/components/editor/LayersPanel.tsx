"use client";

import * as React from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
  DragOverlay,
  Active,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Layer, EditState, Point, ActiveTool, BrushState } from "@/hooks/useEditorState";
import LayerItem from "./LayerItem";
import { ChannelsPanel } from "./ChannelsPanel";
import { LayerActions } from "./LayerActions";
import { LayerControls } from "./LayerControls";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BrushOptions } from "../editor/BrushOptions";
import { arrayMove } from "@dnd-kit/sortable";
import { Plus, SlidersHorizontal, Palette, Zap, Sun, ChevronDown, Layers, Image as ImageIcon, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import LayerList from "./LayerList"; // NEW Import
import { getLayerDisplayOrderIds } from "@/utils/layerUtils"; // NEW Import

interface LayersPanelProps {
  layers: Layer[];
  onToggleVisibility: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onAddTextLayer: () => void;
  onAddDrawingLayer: () => string;
  onAddLayerFromBackground: () => void; // NEW prop
  onAddShapeLayer: (coords: { x: number; y: number }, shapeType?: Layer['shapeType'], initialWidth?: number, initialHeight?: number) => void;
  onAddGradientLayer: () => void;
  onAddAdjustmentLayer: (type: 'brightness' | 'curves' | 'hsl' | 'grading') => void;
  onDuplicateLayer: () => void;
  onMergeLayerDown: () => void;
  onRasterizeLayer: () => void;
  onRasterizeSmartObject: () => void; // NEW prop
  onConvertSmartObjectToLayers: () => void; // NEW prop
  onExportSmartObjectContents: () => void; // NEW prop
  onDeleteHiddenLayers: () => void; // NEW prop
  onArrangeLayer: (direction: 'front' | 'back' | 'forward' | 'backward') => void; // NEW prop
  onReorder: (activeId: string, overId: string) => void;
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  channels: EditState['channels'];
  onChannelChange: (channel: 'r' | 'g' | 'b', value: boolean) => void;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string) => void;
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void;
  onCreateSmartObject: (layerIds: string[]) => void;
  onOpenSmartObject: (id: string) => void;
  selectedShapeType: Layer['shapeType'] | null;
  activeTool: ActiveTool | null;
  brushState: BrushState;
  setBrushState: (updates: Partial<BrushState>) => void;
  groupLayers: (layerIds: string[]) => void;
  toggleGroupExpanded: (id: string) => void;
  hasActiveSelection: boolean;
  onApplySelectionAsMask: () => void;
  onRemoveLayerMask: (id: string) => void;
  onInvertLayerMask: (id: string) => void;
  onToggleClippingMask: () => void;
  onToggleLayerLock: (id: string) => void; // FIX: Corrected signature to accept ID
}

export const LayersPanel = ({
  layers,
  onToggleVisibility,
  onRename,
  onDelete,
  onAddTextLayer,
  onAddDrawingLayer,
  onAddLayerFromBackground, // Destructure NEW
  onAddShapeLayer,
  onAddGradientLayer,
  onAddAdjustmentLayer,
  onDuplicateLayer,
  onMergeLayerDown,
  onRasterizeLayer,
  onRasterizeSmartObject, // Destructure NEW
  onConvertSmartObjectToLayers, // Destructure NEW
  onExportSmartObjectContents, // Destructure NEW
  onDeleteHiddenLayers, // Destructure NEW
  onArrangeLayer, // Destructure NEW
  onReorder,
  selectedLayerId,
  onSelectLayer,
  channels,
  onChannelChange,
  onLayerUpdate,
  onLayerCommit,
  onLayerOpacityChange,
  onLayerOpacityCommit,
  onLayerPropertyCommit,
  onCreateSmartObject,
  onOpenSmartObject,
  selectedShapeType,
  activeTool,
  brushState,
  setBrushState,
  groupLayers,
  toggleGroupExpanded,
  hasActiveSelection,
  onApplySelectionAsMask,
  onRemoveLayerMask,
  onInvertLayerMask,
  onToggleClippingMask,
  onToggleLayerLock,
}: LayersPanelProps) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [tempName, setTempName] = React.useState("");
  const [selectedLayerIds, setSelectedLayerIds] = React.useState<string[]>([]);
  const [activeDragItem, setActiveDragItem] = React.useState<Active | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  React.useEffect(() => {
    if (selectedLayerId && !selectedLayerIds.includes(selectedLayerId)) {
      setSelectedLayerIds([selectedLayerId]);
    } else if (!selectedLayerId && selectedLayerIds.length > 0) {
      setSelectedLayerIds([]);
    }
  }, [selectedLayerId]);

  const startRename = (layer: Layer) => {
    setEditingId(layer.id);
    setTempName(layer.name);
  };

  const confirmRename = (id: string) => {
    if (editingId === id) {
      onRename(id, tempName.trim() || "Untitled");
      setEditingId(null);
    }
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  const findLayerForDragOverlay = (
    id: string,
    currentLayers: Layer[],
  ): Layer | undefined => {
    for (const layer of currentLayers) {
      if (layer.id === id) {
        return layer;
      }
      if (layer.type === 'group' && layer.children) {
        const found = findLayerForDragOverlay(id, layer.children);
        if (found) return found;
      }
    }
    return undefined;
  };

  const handleSelectLayer = (id: string, ctrlKey: boolean, shiftKey: boolean) => {
    if (ctrlKey) {
      setSelectedLayerIds(prev =>
        prev.includes(id)
          ? prev.filter(layerId => layerId !== id)
          : [...prev, id]
      );
    } else if (shiftKey && selectedLayerId) {
      // Use utility function for display order
      const allLayerIds = getLayerDisplayOrderIds(layers);
      const currentIndex = allLayerIds.indexOf(id);
      const lastIndex = allLayerIds.indexOf(selectedLayerId);
      
      const startIndex = Math.min(currentIndex, lastIndex);
      const endIndex = Math.max(currentIndex, lastIndex);
      
      const newSelection = allLayerIds
        .slice(startIndex, endIndex + 1);
        
      setSelectedLayerIds(newSelection);
    } else {
      setSelectedLayerIds([id]);
      onSelectLayer(id);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveDragItem(event.active);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over || active.id === over.id) {
      return;
    }
    onReorder(active.id as string, over.id as string);
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <Card className="mt-4 flex flex-col h-full border-0">
      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        <Tabs defaultValue="layers" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="layers" className="h-7 text-sm">Layers</TabsTrigger>
            <TabsTrigger value="channels" className="h-7 text-sm">Channels</TabsTrigger>
          </TabsList>
          <TabsContent value="layers" className="flex-1 flex flex-col mt-2 overflow-hidden">
            
            {/* Layer Controls Section (Blend Mode, Opacity, Fill) */}
            <LayerControls
              selectedLayer={selectedLayer}
              onLayerPropertyCommit={(updates, name) => selectedLayerId && onLayerPropertyCommit(selectedLayerId, updates, name)}
              onLayerOpacityChange={onLayerOpacityChange}
              onLayerOpacityCommit={onLayerOpacityCommit}
            />
            
            <ScrollArea className="flex-1 pt-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={layers.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-0"> {/* Removed vertical spacing */}
                    <LayerList
                      layersToRender={layers}
                      depth={0}
                      editingId={editingId}
                      tempName={tempName}
                      setTempName={setTempName}
                      startRename={startRename}
                      confirmRename={confirmRename}
                      cancelRename={cancelRename}
                      onToggleVisibility={onToggleVisibility}
                      selectedLayerIds={selectedLayerIds}
                      onSelectLayer={handleSelectLayer}
                      onToggleGroupExpanded={toggleGroupExpanded}
                      onRemoveLayerMask={onRemoveLayerMask}
                      onToggleLayerLock={onToggleLayerLock}
                    />
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeDragItem ? (
                    <LayerItem
                      layer={findLayerForDragOverlay(activeDragItem.id as string, layers)!}
                      isEditing={false}
                      tempName=""
                      setTempName={() => {}}
                      startRename={() => {}}
                      confirmRename={() => {}}
                      cancelRename={() => {}}
                      onToggleVisibility={() => {}}
                      isSelected={false}
                      onSelect={() => {}}
                      onToggleGroupExpanded={() => {}}
                      depth={0}
                      onRemoveMask={() => {}}
                      onToggleLock={() => {}}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </ScrollArea>
            
            {/* Layer Creation Dropdown */}
            <div className="mt-4 space-y-2 border-t pt-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Layer
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60">
                  <DropdownMenuItem onClick={onAddDrawingLayer}>
                    <Layers className="h-4 w-4 mr-2" />
                    Empty Layer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onAddLayerFromBackground}> {/* NEW action */}
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Layer from Background
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onAddTextLayer}>
                    <Layers className="h-4 w-4 mr-2" />
                    Text Layer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddShapeLayer({ x: 50, y: 50 })}>
                    <Layers className="h-4 w-4 mr-2" />
                    Shape Layer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onAddGradientLayer}>
                    <Layers className="h-4 w-4 mr-2" />
                    Gradient Layer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onAddAdjustmentLayer('brightness')}>
                    <Sun className="h-4 w-4 mr-2" />
                    Brightness/Contrast Adjustment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddAdjustmentLayer('curves')}>
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Curves Adjustment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddAdjustmentLayer('hsl')}>
                    <Palette className="h-4 w-4 mr-2" />
                    HSL Adjustment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddAdjustmentLayer('grading')}>
                    <Zap className="h-4 w-4 mr-2" />
                    Color Grading Adjustment
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <LayerActions
              layers={layers}
              selectedLayer={selectedLayer}
              selectedLayerIds={selectedLayerIds}
              onAddTextLayer={onAddTextLayer}
              onAddDrawingLayer={onAddDrawingLayer}
              onAddShapeLayer={onAddShapeLayer}
              onAddGradientLayer={onAddGradientLayer}
              onDeleteLayer={() => selectedLayerIds.forEach(id => onDelete(id))}
              onDuplicateLayer={onDuplicateLayer}
              onMergeLayerDown={onMergeLayerDown}
              onRasterizeLayer={onRasterizeLayer}
              onRasterizeSmartObject={onRasterizeSmartObject} // Pass NEW prop
              onConvertSmartObjectToLayers={onConvertSmartObjectToLayers} // Pass NEW prop
              onExportSmartObjectContents={onExportSmartObjectContents} // Pass NEW prop
              onDeleteHiddenLayers={onDeleteHiddenLayers} // Pass NEW prop
              onArrangeLayer={onArrangeLayer} // Pass NEW prop
              onCreateSmartObject={onCreateSmartObject}
              onOpenSmartObject={onOpenSmartObject}
              selectedShapeType={selectedShapeType}
              groupLayers={() => groupLayers(selectedLayerIds)}
              hasActiveSelection={hasActiveSelection}
              onApplySelectionAsMask={onApplySelectionAsMask}
              onInvertLayerMask={() => selectedLayerId && onInvertLayerMask(selectedLayerId)}
              onToggleClippingMask={onToggleClippingMask}
            />
          </TabsContent>
          <TabsContent value="channels" className="mt-2">
            <ChannelsPanel channels={channels} onChannelChange={onChannelChange} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};