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
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Layer, EditState, ActiveTool, BrushState } from "@/hooks/useEditorState";
import LayerItem from "./LayerItem";
import { ChannelsPanel } from "./ChannelsPanel";
import { LayerActions } from "./LayerActions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BrushOptions } from "./BrushOptions";

interface LayersPanelProps {
  layers: Layer[];
  onToggleVisibility: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onAddTextLayer: () => void;
  onAddDrawingLayer: () => string;
  onAddShapeLayer: (coords: { x: number; y: number }, shapeType?: Layer['shapeType'], initialWidth?: number, initialHeight?: number) => void;
  onDuplicateLayer: () => void;
  onMergeLayerDown: () => void;
  onRasterizeLayer: () => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  channels: EditState['channels'];
  onChannelChange: (channel: 'r' | 'g' | 'b', value: boolean) => void;
  // Layer editing props for properties panels
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string) => void;
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void;
  // Smart object functions
  onCreateSmartObject: (layerIds: string[]) => void;
  onOpenSmartObject: (id: string) => void;
  selectedShapeType: Layer['shapeType'] | null;
  // Tool state
  activeTool: ActiveTool | null;
  // Brush state
  brushState: BrushState;
  setBrushState: (updates: Partial<BrushState>) => void;
}

export const LayersPanel = ({
  layers,
  onToggleVisibility,
  onRename,
  onDelete,
  onAddTextLayer,
  onAddDrawingLayer,
  onAddShapeLayer,
  onDuplicateLayer,
  onMergeLayerDown,
  onRasterizeLayer,
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
}: LayersPanelProps) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [tempName, setTempName] = React.useState("");
  const [selectedLayerIds, setSelectedLayerIds] = React.useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

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

  const reversedLayers = React.useMemo(() => [...layers].reverse(), [layers]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldReversedIndex = reversedLayers.findIndex((l) => l.id === active.id);
    const newReversedIndex = reversedLayers.findIndex((l) => l.id === over.id);

    if (oldReversedIndex === -1 || newReversedIndex === -1) {
      return;
    }
    
    const oldIndex = layers.length - 1 - oldReversedIndex;
    const newIndex = layers.length - 1 - newReversedIndex;

    onReorder(oldIndex, newIndex);
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  const handleSelectLayer = (id: string, ctrlKey: boolean, shiftKey: boolean) => {
    if (ctrlKey) {
      // Toggle selection
      setSelectedLayerIds(prev => 
        prev.includes(id) 
          ? prev.filter(layerId => layerId !== id) 
          : [...prev, id]
      );
    } else if (shiftKey && selectedLayerId) {
      // Range selection
      const currentIndex = layers.findIndex(l => l.id === id);
      const lastIndex = layers.findIndex(l => l.id === selectedLayerId);
      
      const startIndex = Math.min(currentIndex, lastIndex);
      const endIndex = Math.max(currentIndex, lastIndex);
      
      const newSelection = layers
        .slice(startIndex, endIndex + 1)
        .map(l => l.id);
        
      setSelectedLayerIds(newSelection);
    } else {
      // Single selection
      setSelectedLayerIds([id]);
      onSelectLayer(id);
    }
  };

  return (
    <Card className="mt-4 flex flex-col h-full">
      <CardContent className="flex-1 flex flex-col min-h-0 pt-4">
        <Tabs defaultValue="layers" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2"> {/* Changed to 2 columns */}
            <TabsTrigger value="layers">Layers</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
          </TabsList>
          <TabsContent value="layers" className="flex-1 flex flex-col mt-2 overflow-hidden">
            <ScrollArea className="flex-1 pr-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={reversedLayers.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {reversedLayers.map((layer) => (
                      <LayerItem
                        key={layer.id}
                        layer={layer}
                        isEditing={editingId === layer.id}
                        tempName={tempName}
                        setTempName={setTempName}
                        startRename={startRename}
                        confirmRename={confirmRename}
                        cancelRename={cancelRename}
                        onToggleVisibility={onToggleVisibility}
                        isSelected={selectedLayerIds.includes(layer.id)}
                        onSelect={(e) => handleSelectLayer(layer.id, e.ctrlKey, e.shiftKey)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ScrollArea>
            <LayerActions
              layers={layers}
              selectedLayer={selectedLayer}
              selectedLayerIds={selectedLayerIds}
              onAddTextLayer={onAddTextLayer}
              onAddDrawingLayer={onAddDrawingLayer}
              onAddShapeLayer={onAddShapeLayer}
              onDeleteLayer={() => selectedLayerId && onDelete(selectedLayerId)}
              onDuplicateLayer={onDuplicateLayer}
              onMergeLayerDown={onMergeLayerDown}
              onRasterizeLayer={onRasterizeLayer}
              onCreateSmartObject={onCreateSmartObject}
              onOpenSmartObject={onOpenSmartObject}
              selectedShapeType={selectedShapeType}
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