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
import type { Layer, EditState } from "@/hooks/useEditorState";
import LayerItem from "./LayerItem";
import { ChannelsPanel } from "./ChannelsPanel";
import { LayerActions } from "./LayerActions";
import { LayerProperties } from "./LayerProperties";
import TextProperties from "./TextProperties";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface LayersPanelProps {
  layers: Layer[];
  onToggleVisibility: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onAddTextLayer: () => void;
  onAddDrawingLayer: () => void;
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
}

export const LayersPanel = ({
  layers,
  onToggleVisibility,
  onRename,
  onDelete,
  onAddTextLayer,
  onAddDrawingLayer,
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
}: LayersPanelProps) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [tempName, setTempName] = React.useState("");

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

  return (
    <Card className="mt-4 flex flex-col h-full">
      <CardContent className="flex-1 flex flex-col min-h-0 pt-4">
        <Tabs defaultValue="layers" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="layers">Layers</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
          </TabsList>
          <TabsContent value="layers" className="flex-1 flex flex-col mt-2 overflow-hidden">
            {selectedLayer && selectedLayer.type !== 'image' && (
              <ScrollArea className="pr-3 pb-2 mb-2 border-b">
                <Accordion type="multiple" className="w-full" defaultValue={['properties']}>
                  <AccordionItem value="properties">
                    <AccordionTrigger>Properties</AccordionTrigger>
                    <AccordionContent>
                      <LayerProperties
                        selectedLayer={selectedLayer}
                        onOpacityChange={onLayerOpacityChange}
                        onOpacityCommit={onLayerOpacityCommit}
                        onLayerPropertyCommit={(updates, name) => onLayerPropertyCommit(selectedLayer.id, updates, name)}
                      />
                    </AccordionContent>
                  </AccordionItem>
                  {selectedLayer.type === 'text' && (
                    <AccordionItem value="text">
                      <AccordionTrigger>Text</AccordionTrigger>
                      <AccordionContent>
                        <TextProperties
                          layer={selectedLayer}
                          onUpdate={onLayerUpdate}
                          onCommit={onLayerCommit}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </ScrollArea>
            )}
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
                        isSelected={editingId ? false : selectedLayerId === layer.id}
                        onSelect={onSelectLayer}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ScrollArea>
            <LayerActions
              layers={layers}
              selectedLayer={selectedLayer}
              onAddTextLayer={onAddTextLayer}
              onAddDrawingLayer={onAddDrawingLayer}
              onDeleteLayer={() => selectedLayerId && onDelete(selectedLayerId)}
              onDuplicateLayer={onDuplicateLayer}
              onMergeLayerDown={onMergeLayerDown}
              onRasterizeLayer={onRasterizeLayer}
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