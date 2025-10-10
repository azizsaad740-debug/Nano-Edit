"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2, GripVertical, Type, Image as ImageIcon, Eye, EyeOff, FileArchive, Layers } from "lucide-react";
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
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
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

  const handleIconClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const getLayerIcon = () => {
    switch (layer.type) {
      case 'image':
        return <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />;
      case 'text':
        return <Type className="h-4 w-4 text-muted-foreground shrink-0" />;
      case 'smart-object':
        return <FileArchive className="h-4 w-4 text-muted-foreground shrink-0" />;
      default:
        return <Layers className="h-4 w-4 text-muted-foreground shrink-0" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "flex items-center justify-between p-2 border rounded-md transition-shadow cursor-pointer",
        isBackground ? "bg-muted/50" : "bg-background",
        isDragging && "shadow-lg z-10 relative",
        isSelected && !isDragging && "bg-accent text-accent-foreground ring-2 ring-ring"
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
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
          className="h-8 w-8 shrink-0"
          onClick={(e) => handleIconClick(e, () => onToggleVisibility(layer.id))}
        >
          {layer.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </Button>
        {getLayerIcon()}
        {isEditing ? (
          <Input
            className="h-8"
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
            className="font-medium truncate"
            onDoubleClick={() => {
              if (!isBackground) startRename(layer);
            }}
          >
            {layer.name}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={(e) => handleIconClick(e, () => startRename(layer))}
        disabled={isBackground}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default LayerItem;