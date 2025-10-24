"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2, GripVertical, Type, Image as ImageIcon, Eye, EyeOff, FileArchive, Layers, Square, Folder, FolderOpen, ChevronRight, ChevronDown, Palette, SquareStack, X, CornerUpLeft, Lock, LockOpen, SlidersHorizontal, Sun, Zap } from "lucide-react"; // Added adjustment icons
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
  onToggleGroupExpanded?: (id: string) => void; // New prop for toggling group expansion
  depth?: number; // New prop for indentation
  onRemoveMask: (id: string) => void; // NEW prop for mask removal
  onToggleLock: (id: string) => void; // NEW prop for layer lock
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
  onToggleGroupExpanded,
  depth = 0,
  onRemoveMask, // Destructure new prop
  onToggleLock, // Destructure new prop
}: LayerItemProps) => {
  const isBackground = layer.type === "image";
  const isGroup = layer.type === "group";
  const hasMask = !!layer.maskDataUrl;
  const isClippingMask = !!layer.isClippingMask;
  const isLocked = !!layer.isLocked;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id, disabled: isBackground || isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${depth * 20 + 8}px`, // Indentation for nested layers
  };

  const handleIconClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const getLayerIcon = () => {
    if (isGroup) {
      return layer.expanded ? <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" /> : <Folder className="h-4 w-4 text-muted-foreground shrink-0" />;
    }
    switch (layer.type) {
      case 'image':
        return <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />;
      case 'text':
        return <Type className="h-4 w-4 text-muted-foreground shrink-0" />;
      case 'smart-object':
        return <FileArchive className="h-4 w-4 text-muted-foreground shrink-0" />;
      case 'vector-shape':
        return <Square className="h-4 w-4 text-muted-foreground shrink-0" />;
      case 'gradient': // Added for gradient layers
        return <Palette className="h-4 w-4 text-muted-foreground shrink-0" />;
      case 'adjustment': // NEW: Adjustment layer icons
        switch (layer.adjustmentData?.type) {
          case 'brightness':
            return <Sun className="h-4 w-4 text-muted-foreground shrink-0" />;
          case 'curves':
            return <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />;
          case 'hsl':
            return <Palette className="h-4 w-4 text-muted-foreground shrink-0" />;
          case 'grading':
            return <Zap className="h-4 w-4 text-muted-foreground shrink-0" />;
          default:
            return <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />;
        }
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
        "flex items-center justify-between p-2 border rounded-md transition-shadow cursor-pointer group",
        isBackground ? "bg-muted/50" : "bg-background",
        isDragging && "shadow-lg z-10 relative",
        isSelected && !isDragging && "bg-accent text-accent-foreground ring-2 ring-ring",
        isClippingMask && "border-l-4 border-l-primary/50", // Visual indicator for clipping mask
        isClippingMask && depth > 0 && "ml-4" // Indent clipped layer if nested
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "cursor-grab touch-none p-1",
            (isBackground || isLocked) && "cursor-not-allowed opacity-50"
          )}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        {isGroup && onToggleGroupExpanded && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={(e) => handleIconClick(e, () => onToggleGroupExpanded(layer.id))}
          >
            {layer.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => handleIconClick(e, () => onToggleVisibility(layer.id))}
        >
          {layer.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </Button>
        {getLayerIcon()}
        {/* Clipping Mask Indicator */}
        {isClippingMask && (
          <div title="Clipping Mask">
            <CornerUpLeft className="h-3 w-3 text-primary shrink-0" />
          </div>
        )}
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
              if (!isBackground && !isLocked) startRename(layer);
            }}
          >
            {layer.name}
          </span>
        )}
      </div>
      
      {/* Lock Indicator and Controls */}
      {!isBackground && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => handleIconClick(e, () => onToggleLock(layer.id))}
        >
          {isLocked ? <Lock className="h-4 w-4 text-muted-foreground" /> : <LockOpen className="h-4 w-4 text-muted-foreground" />}
        </Button>
      )}

      {/* Mask Indicator and Controls */}
      {hasMask && (
        <div className="flex items-center gap-1 shrink-0">
          <div className="relative flex items-center justify-center h-6 w-6 rounded-sm border border-muted-foreground/50 bg-background/50">
            <SquareStack className="h-3 w-3 text-muted-foreground" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive hover:bg-destructive/80"
              onClick={(e) => handleIconClick(e, () => onRemoveMask(layer.id))}
            >
              <X className="h-3 w-3 text-destructive-foreground" />
            </Button>
          </div>
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => handleIconClick(e, () => startRename(layer))}
        disabled={isBackground || isLocked}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default LayerItem;