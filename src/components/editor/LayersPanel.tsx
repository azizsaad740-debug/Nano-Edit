"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import type { Layer } from "@/hooks/useEditorState";
import LayerItem from "./LayerItem";

interface LayersPanelProps {
  layers: Layer[];
  onToggleVisibility: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onAddTextLayer: () => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
}

export const LayersPanel = ({
  layers,
  onToggleVisibility,
  onRename,
  onDelete,
  onAddTextLayer,
  onReorder,
  selectedLayerId,
  onSelectLayer,
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
      return; // Should not happen
    }
    
    const oldIndex = layers.length - 1 - oldReversedIndex;
    const newIndex = layers.length - 1 - newReversedIndex;

    onReorder(oldIndex, newIndex);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Layers</CardTitle>
        <Button size="sm" onClick={onAddTextLayer}>
          Add Text
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={reversedLayers.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
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
                onDelete={onDelete}
                isSelected={editingId ? false : selectedLayerId === layer.id}
                onSelect={onSelectLayer}
              />
            ))}
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
};