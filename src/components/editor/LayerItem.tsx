import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Lock, Unlock, Folder, FolderOpen, ChevronDown, ChevronRight, Image, Type, PenTool, Square, Layers, Zap, Palette, GripVertical } from 'lucide-react';
import type { Layer, GroupLayerData, AdjustmentLayerData, SmartObjectLayerData, GradientLayerData } from '@/types/editor';
import { isGroupLayer, isAdjustmentLayer, isSmartObjectLayer, isGradientLayer, isTextLayer, isVectorShapeLayer, isDrawingLayer } from '@/types/editor';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
  toggleVisibility: (id: string) => void;
  toggleGroupExpanded: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  renameLayer: (id: string, newName: string) => void;
  isDragging: boolean;
  onOpenSmartObjectEditor: (id: string) => void; // ADDED
}

const LayerIcon: React.FC<{ layer: Layer }> = ({ layer }) => {
  if (isGroupLayer(layer)) {
    const groupLayer = layer as GroupLayerData;
    return groupLayer.isExpanded ? <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  }
  if (isAdjustmentLayer(layer)) return <Zap className="h-3.5 w-3.5 text-yellow-500 shrink-0" />;
  if (isSmartObjectLayer(layer)) return <Layers className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
  if (isTextLayer(layer)) return <Type className="h-3.5 w-3.5 text-primary shrink-0" />;
  if (isVectorShapeLayer(layer)) return <Square className="h-3.5 w-3.5 text-green-500 shrink-0" />;
  if (isDrawingLayer(layer)) return <PenTool className="h-3.5 w-3.5 text-red-500 shrink-0" />;
  if (isGradientLayer(layer)) return <Palette className="h-3.5 w-3.5 text-purple-500 shrink-0" />;
  return <Image className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
};

export const LayerItem: React.FC<LayerItemProps> = ({
  layer,
  isSelected,
  onSelect,
  toggleVisibility,
  toggleGroupExpanded,
  onToggleLayerLock,
  renameLayer,
  isDragging,
  onOpenSmartObjectEditor, // DESTRUCTURED
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: layer.id, data: { layerId: layer.id } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const [isRenaming, setIsRenaming] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSelect = (e: React.MouseEvent) => {
    // Prevent selection if clicking on the rename input
    if (e.target instanceof HTMLInputElement) return;
    onSelect(layer.id, e.ctrlKey || e.metaKey, e.shiftKey);
  };

  const handleDoubleClick = () => {
    if (isSmartObjectLayer(layer)) {
      onOpenSmartObjectEditor(layer.id);
      return;
    }
    if (layer.id !== 'background' && !layer.isLocked) {
      setIsRenaming(true);
    }
  };

  const handleRenameBlur = () => {
    if (inputRef.current) {
      const newName = inputRef.current.value.trim();
      if (newName && newName !== layer.name) {
        renameLayer(layer.id, newName);
      }
    }
    setIsRenaming(false);
  };

  React.useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const isGroup = isGroupLayer(layer);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleSelect}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "flex items-center justify-between p-1.5 border-b border-border/50 transition-colors cursor-pointer text-sm group",
        isSelected && "bg-accent text-accent-foreground",
        isDragging && "shadow-lg opacity-70",
        layer.visible === false && "opacity-50"
      )}
    >
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {/* Drag Handle / Group Toggle */}
        <div className="flex items-center shrink-0">
          {isGroup ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => { e.stopPropagation(); toggleGroupExpanded(layer.id); }}
            >
              {(layer as GroupLayerData).isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </Button>
          ) : (
            <div
              {...attributes}
              {...listeners}
              className={cn(
                "cursor-grab touch-none p-1 h-6 w-6 flex items-center justify-center",
                layer.isLocked && "cursor-default opacity-50"
              )}
            >
              {/* Use GripVertical for drag handle, visible on hover */}
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {/* Visibility Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }}
        >
          {layer.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </Button>

        {/* Layer Icon */}
        <LayerIcon layer={layer} />

        {/* Layer Name */}
        <div className="flex-1 min-w-0 truncate">
          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              defaultValue={layer.name}
              onBlur={handleRenameBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameBlur();
                }
              }}
              className="w-full bg-transparent border-b border-primary focus:outline-none text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate" title={layer.name}>
              {layer.name}
            </span>
          )}
        </div>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Clipping Mask Indicator */}
        {layer.isClippingMask && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-4 w-4 text-primary/70">
                <ChevronRight className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent>Clipping Mask</TooltipContent>
          </Tooltip>
        )}

        {/* Lock Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={(e) => { e.stopPropagation(); onToggleLayerLock(layer.id); }}
          disabled={layer.id === 'background'}
        >
          {layer.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
        </Button>
      </div>
    </div>
  );
};