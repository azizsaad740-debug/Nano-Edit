"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, GripVertical, Type, Image as ImageIcon, Eye, EyeOff } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { Layer } from "@/hooks/useEditorState";

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
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const LayerItem = ({
  layer,
  isEditing,
  tempName,
  setTempName,
  startRename,
  confirmRename,
  cancelRename,
  onToggleVisibility,
  onDelete,
  isSelected,
  onSelect,
}: LayerItemProps) => {
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
  const handleIconClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(layer.id)}
      className={cn(
        "flex items-center justify-between p-2 border rounded-md transition-shadow cursor-pointer",
        isBackground ? "bg-muted/50" : "bg-background",
        isDragging && "shadow-lg z-10 relative",
        isSelected && !isDragging && "bg-accent text-accent-foreground ring-2 ring-ring"
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => handleIconClick(e, () => onToggleVisibility(layer.id))}
        >
          {layer.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </Button>
        {layer.type === 'image' ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : <Type className="h-4 w-4 text-muted-foreground" />}
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
            className="font-medium"
            onDoubleClick={() => {
              if (!isBackground) startRename(layer);
            }}
          >
            {layer.name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={handleButtonMouseDown}
          onClick={(e) => handleIconClick(e, () => startRename(layer))}
          disabled={isBackground}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={handleButtonMouseDown}
          onClick={(e) => handleIconClick(e, () => onDelete(layer.id))}
          disabled={isBackground}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

export default LayerItem;