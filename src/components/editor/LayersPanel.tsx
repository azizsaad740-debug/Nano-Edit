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
import { cn } from "@/lib/utils";

interface Layer {
  id: string;
  type: "image" | "text";
  name: string;
  visible: boolean;
  content?: string;
}

interface LayerItemProps {
  layer: Layer;
  isEditing: boolean;
  tempName: string;
  setTempName: (name: string) => void;
  startRename: (layer: Layer) => void;
  confirmRename: (id: string) => void;
  cancelRename: () => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  onEditTextLayer: (id: string) => void;
}

function LayerItem({
  layer,
  isEditing,
  tempName,
  setTempName,
  startRename,
  confirmRename,
  cancelRename,
  onToggleVisibility,
  onDelete,
  onEditTextLayer,
}: LayerItemProps) {
  const isBackground = layer.type === "image";
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id, disabled: isBackground });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleButtonMouseDown = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-2 border rounded-md transition-shadow",
        isBackground ? "bg-muted/50" : "bg-background",
        isDragging && "shadow-lg z-10 relative"
      )}
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "cursor-grab touch-none p-1",
            isBackground && "cursor-not-allowed opacity-50"
          )}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <Switch
          checked={layer.visible}
          onCheckedChange={() => onToggleVisibility(layer.id)}
        />
        {isEditing ? (
          <Input
            className="w-32 h-8"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={() => confirmRename(layer.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmRename(layer.id);
              if (e.key === "Escape") cancelRename();
            }}
            autoFocus
          />
        ) : (
          <span
            className="font-medium cursor-pointer"
            onDoubleClick={() => {
              if (!isBackground) startRename(layer);
            }}
          >
            {layer.name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {layer.type === "text" && (
          <Button
            variant="ghost"
            size="icon"
            onMouseDown={handleButtonMouseDown}
            onClick={() => onEditTextLayer(layer.id)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={handleButtonMouseDown}
          onClick={() => startRename(layer)}
          disabled={isBackground}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={handleButtonMouseDown}
          onClick={() => onDelete(layer.id)}
          disabled={isBackground}
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
    if (active.id !== over.id) {
      const oldReversedIndex = reversedLayers.findIndex((l) => l.id === active.id);
      const newReversedIndex = reversedLayers.findIndex((l) => l.id === over.id);
      
      const oldIndex = layers.length - 1 - oldReversedIndex;
      const newIndex = layers.length - 1 - newReversedIndex;

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
                onEditTextLayer={onEditTextLayer}
              />
            ))}
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
};