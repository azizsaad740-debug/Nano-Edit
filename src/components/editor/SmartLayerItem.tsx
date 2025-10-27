"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Move, Type, Layers, Eye, EyeOff, Square, Palette } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { Layer } from "@/types/editor";

interface SmartLayerItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onToggleVisibility: (id: string) => void;
}

export const SmartLayerItem = ({ layer, isSelected, onSelect, onToggleVisibility }: SmartLayerItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

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
      case 'text':
        return <Type className="h-4 w-4 text-muted-foreground shrink-0" />;
      case 'vector-shape':
        return <Square className="h-4 w-4 text-muted-foreground shrink-0" />;
      case 'gradient':
        return <Palette className="h-4 w-4 text-muted-foreground shrink-0" />;
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
        "flex items-center justify-between p-2 border rounded-md transition-shadow cursor-pointer bg-background",
        isDragging && "shadow-lg z-10 relative",
        isSelected && !isDragging && "bg-accent text-accent-foreground ring-2 ring-ring"
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none p-1"
        >
          <Move className="h-4 w-4 text-muted-foreground" />
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
        <span className="font-medium truncate">{layer.name}</span>
      </div>
    </div>
  );
};