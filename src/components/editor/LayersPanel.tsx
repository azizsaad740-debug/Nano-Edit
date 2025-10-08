"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Layer {
  id: string;
  type: "image" | "text";
  name: string;
  visible: boolean;
  content?: string;
}

interface LayerItemProps {
  layer: Layer;
  editingId: string | null;
  tempName: string;
  setTempName: (name: string) => void;
  startRename: (layer: Layer) => void;
  confirmRename: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  onEditTextLayer: (id: string) => void;
}

function LayerItem({
  layer,
  editingId,
  tempName,
  setTempName,
  startRename,
  confirmRename,
  onToggleVisibility,
  onDelete,
  onEditTextLayer,
}: LayerItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: layer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2 border rounded-md bg-background"
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none p-1"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <Switch
          checked={layer.visible}
          onCheckedChange={() => onToggleVisibility(layer.id)}
        />
        {editingId === layer.id ? (
          <Input
            className="w-32"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={() => confirmRename(layer.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmRename(layer.id);
            }}
            autoFocus
          />
        ) : (
          <span className="font-medium">{layer.name}</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {layer.type === "text" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEditTextLayer(layer.id)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => startRename(layer)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(layer.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

interface LayersPanelProps {
  layers: Layer[];
  onToggleVisibility: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onAddTextLayer: () => void;
  onEditTextLayer: (id: string) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
}

export const LayersPanel = ({
  layers,
  onToggleVisibility,
  onRename,
  onDelete,
  onAddTextLayer,
  onEditTextLayer,
  onReorder,
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
    onRename(id, tempName.trim() || "Untitled");
    setEditingId(null);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = layers.findIndex((l) => l.id === active.id);
      const newIndex = layers.findIndex((l) => l.id === over.id);
      onReorder(oldIndex, newIndex);
    }
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
            items={layers.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {layers.map((layer) => (
              <LayerItem
                key={layer.id}
                layer={layer}
                editingId={editingId}
                tempName={tempName}
                setTempName={setTempName}
                startRename={startRename}
                confirmRename={confirmRename}
                onToggleVisibility={onToggleVisibility}
                onDelete={onDelete}
                onEditTextLayer={onEditTextLayer}
              />
            ))}
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
};