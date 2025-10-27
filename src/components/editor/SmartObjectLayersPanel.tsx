"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Type, Layers, Copy, Trash2, Square, Palette } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
}
from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Layer } from "@/types/editor";
import { SmartLayerItem } from "./SmartLayerItem";
import { LayerControls } from "./LayerControls";

interface SmartObjectLayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  selectedLayer: Layer | undefined;
  onSelectLayer: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  onToggleVisibility: (id: string) => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void;
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
  handleAddTextLayer: () => void;
  handleAddDrawingLayer: () => string;
  handleAddShapeLayer: () => void;
  handleAddGradientLayer: () => void;
  handleDeleteLayer: () => void;
  handleDuplicateLayer: () => void;
  onRename: (id: string, newName: string)
    => void;
}

export const SmartObjectLayersPanel = ({
  layers,
  selectedLayerId,
  selectedLayer,
  onSelectLayer,
  onReorder,
  onToggleVisibility,
  onLayerPropertyCommit,
  onLayerOpacityChange,
  onLayerOpacityCommit,
  handleAddTextLayer,
  handleAddDrawingLayer,
  handleAddShapeLayer,
  handleAddGradientLayer,
  handleDeleteLayer,
  handleDuplicateLayer,
  onRename,
}: SmartObjectLayersPanelProps) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [tempName, setTempName] = React.useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(active.id as string, over.id as string);
  };

  const startRename = (layer: Layer) => {
    setEditingId(layer.id);
    setTempName(layer.name);
  };

  const confirmRename = (id: string) => {
    if (tempName.trim() && tempName !== layers.find(l => l.id === id)?.name) {
      onRename(id, tempName.trim());
    }
    setEditingId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Layers</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
        <LayerControls
          selectedLayer={selectedLayer}
          onLayerPropertyCommit={(updates, name) => selectedLayerId && onLayerPropertyCommit(selectedLayerId, updates, name)}
          onLayerOpacityChange={onLayerOpacityChange}
          onLayerOpacityCommit={onLayerOpacityCommit}
        />
        <ScrollArea className="flex-1 pr-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={layers.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {layers.map((layer) => (
                  <SmartLayerItem
                    key={layer.id}
                    layer={layer}
                    isSelected={selectedLayerId === layer.id}
                    onSelect={() => onSelectLayer(layer.id)}
                    onToggleVisibility={onToggleVisibility}
                    isEditing={editingId === layer.id}
                    tempName={tempName}
                    setTempName={setTempName}
                    startRename={startRename}
                    confirmRename={confirmRename}
                    cancelRename={cancelRename}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>
        <div className="mt-4 space-y-2 border-t pt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" onClick={handleAddTextLayer}>
              <Type className="h-4 w-4 mr-2" />
              Add Text
            </Button>
            <Button size="sm" variant="outline" onClick={handleAddDrawingLayer}>
              <Layers className="h-4 w-4 mr-2" />
              Add Layer
            </Button>
            <Button size="sm" variant="outline" onClick={handleAddShapeLayer}>
              <Square className="h-4 w-4 mr-2" />
              Add Shape
            </Button>
            <Button size="sm" variant="outline" onClick={handleAddGradientLayer}>
              <Palette className="h-4 w-4 mr-2" />
              Add Gradient
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDuplicateLayer}
              disabled={!selectedLayer}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeleteLayer}
              disabled={!selectedLayer}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};