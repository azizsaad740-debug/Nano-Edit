"use client";

import * as React from "react";
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
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Type,
  Layers,
  Square,
  Palette,
  SlidersHorizontal,
  Sun,
} from "lucide-react";
import type { Layer, Point } from "@/types/editor";
import LayerItem from "./LayerItem";
import { LayerControls } from "./LayerControls";
import { LayerActions } from "./LayerActions";
import LayerList from "./LayerList";

interface LayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
  onReorder: (activeId: string, overId: string) => void;
  toggleLayerVisibility: (id: string) => void; // Renamed from onToggleVisibility
  renameLayer: (id: string, newName: string) => void; // Renamed from onRename
  deleteLayer: (id: string) => void; // Renamed from onDelete
  onDuplicateLayer: (id: string) => void;
  onMergeLayerDown: (id: string) => void;
  onRasterizeLayer: (id: string) => void;
  onCreateSmartObject: (layerIds: string[]) => void;
  onOpenSmartObject: (id: string) => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void;
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
  onAddTextLayer: (coords: Point) => void; // UPDATED SIGNATURE
  onAddDrawingLayer: () => string;
  onAddLayerFromBackground: () => void;
  onLayerFromSelection: () => void;
  onAddShapeLayer: (coords: { x: number; y: number }, shapeType?: Layer['shapeType'], initialWidth?: number, initialHeight?: number) => void;
  onAddGradientLayer: () => void;
  onAddAdjustmentLayer: (type: 'brightness' | 'curves' | 'hsl' | 'grading') => void;
  selectedShapeType: Layer['shapeType'] | null;
  groupLayers: (layerIds: string[]) => void;
  toggleGroupExpanded: (id: string) => void;
  hasActiveSelection: boolean;
  onApplySelectionAsMask: () => void;
  onRemoveLayerMask: (id: string) => void;
  onInvertLayerMask: (id: string) => void;
  onToggleClippingMask: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  onDeleteHiddenLayers: () => void;
  onRasterizeSmartObject: () => void;
  onConvertSmartObjectToLayers: () => void;
  onExportSmartObjectContents: () => void;
  onArrangeLayer: (direction: 'front' | 'back' | 'forward' | 'backward') => void;
}

const LayersPanel = (props: LayersPanelProps) => {
  const {
    layers,
    selectedLayerId,
    onSelectLayer,
    onReorder,
    toggleLayerVisibility, // Renamed
    renameLayer, // Renamed
    deleteLayer, // Renamed
    onDuplicateLayer,
    onMergeLayerDown,
    onRasterizeLayer,
    onCreateSmartObject,
    onOpenSmartObject,
    onLayerPropertyCommit,
    onLayerOpacityChange,
    onLayerOpacityCommit,
    onAddTextLayer,
    onAddDrawingLayer,
    onAddLayerFromBackground,
    onLayerFromSelection,
    onAddShapeLayer,
    onAddGradientLayer,
    onAddAdjustmentLayer,
    selectedShapeType,
    groupLayers,
    toggleGroupExpanded,
    onRemoveLayerMask,
    onInvertLayerMask,
    onToggleClippingMask,
    onToggleLayerLock,
    onDeleteHiddenLayers,
    onRasterizeSmartObject,
    onConvertSmartObjectToLayers,
    onExportSmartObjectContents,
    onArrangeLayer,
    hasActiveSelection,
    onApplySelectionAsMask,
  } = props;

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [tempName, setTempName] = React.useState("");
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);
  const selectedLayerIds = selectedLayerId ? [selectedLayerId] : []; // Simplified for now

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
    if (tempName.trim() && tempName !== selectedLayer?.name) {
      renameLayer(id, tempName.trim());
    }
    setEditingId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  const handleAddLayer = (type: 'text' | 'drawing' | 'shape' | 'gradient' | 'adjustment' | 'from-background' | 'from-selection') => {
    // Default coordinates for quick add buttons (center of canvas)
    const defaultCoords = { x: 50, y: 50 }; 
    
    if (type === 'text') {
      onAddTextLayer(defaultCoords);
    } else if (type === 'drawing') {
      onAddDrawingLayer();
    } else if (type === 'shape') {
      onAddShapeLayer(defaultCoords, selectedShapeType || 'rect', 10, 10);
    } else if (type === 'gradient') {
      onAddGradientLayer();
    } else if (type === 'adjustment') {
      // Default to brightness/contrast for quick add
      onAddAdjustmentLayer('brightness');
    } else if (type === 'from-background') {
      onAddLayerFromBackground();
    } else if (type === 'from-selection') {
      onLayerFromSelection();
    }
  };

  return (
    <Card className="flex flex-col h-full border-none shadow-none">
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
            <div className="space-y-0.5">
              {/* Recursive Layer List */}
              <LayerList
                layersToRender={layers}
                depth={0}
                editingId={editingId}
                tempName={tempName}
                setTempName={setTempName}
                startRename={startRename}
                confirmRename={confirmRename}
                cancelRename={cancelRename}
                onToggleVisibility={toggleLayerVisibility}
                selectedLayerIds={selectedLayerIds}
                onSelectLayer={onSelectLayer}
                onToggleGroupExpanded={toggleGroupExpanded}
                onRemoveLayerMask={onRemoveLayerMask}
                onToggleLayerLock={onToggleLayerLock}
              />
            </div>
          </SortableContext>
        </DndContext>
      </ScrollArea>
      
      <div className="mt-4 space-y-2 border-t pt-4">
        {/* Quick Add Buttons */}
        <div className="flex flex-wrap gap-1 justify-start">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" className="h-8 w-8" variant="outline" onClick={() => handleAddLayer('text')}>
                <Type className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Text Layer</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" className="h-8 w-8" variant="outline" onClick={() => handleAddLayer('drawing')}>
                <Layers className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Empty Layer</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" className="h-8 w-8" variant="outline" onClick={() => handleAddLayer('shape')}>
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Shape Layer</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" className="h-8 w-8" variant="outline" onClick={() => handleAddLayer('gradient')}>
                <Palette className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Gradient Layer</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" className="h-8 w-8" variant="outline" onClick={() => handleAddLayer('adjustment')}>
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Adjustment Layer</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" className="h-8 w-8" variant="outline" onClick={() => handleAddLayer('from-background')}>
                <Sun className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Layer from Background</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" className="h-8 w-8" variant="outline" onClick={() => handleAddLayer('from-selection')} disabled={!hasActiveSelection}>
                <Layers className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Layer from Selection</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <LayerActions
          layers={layers}
          selectedLayer={selectedLayer}
          selectedLayerIds={selectedLayerIds}
          onAddTextLayer={() => handleAddLayer('text')}
          onAddDrawingLayer={() => handleAddLayer('drawing')}
          onAddShapeLayer={(coords, shapeType, initialWidth, initialHeight) => onAddShapeLayer(coords, shapeType, initialWidth, initialHeight)}
          onAddGradientLayer={() => handleAddLayer('gradient')}
          onDeleteLayer={() => selectedLayerId && deleteLayer(selectedLayerId)}
          onDuplicateLayer={() => selectedLayerId && onDuplicateLayer(selectedLayerId)}
          onMergeLayerDown={() => selectedLayerId && onMergeLayerDown(selectedLayerId)}
          onRasterizeLayer={() => selectedLayerId && onRasterizeLayer(selectedLayerId)}
          onCreateSmartObject={onCreateSmartObject}
          onOpenSmartObject={onOpenSmartObject}
          selectedShapeType={selectedShapeType}
          groupLayers={() => groupLayers(selectedLayerIds)}
          hasActiveSelection={hasActiveSelection}
          onApplySelectionAsMask={onApplySelectionAsMask}
          onInvertLayerMask={() => selectedLayerId && onInvertLayerMask(selectedLayerId)}
          onToggleClippingMask={() => selectedLayerId && onToggleClippingMask(selectedLayerId)}
          onDeleteHiddenLayers={onDeleteHiddenLayers}
          onRasterizeSmartObject={onRasterizeSmartObject}
          onConvertSmartObjectToLayers={onConvertSmartObjectToLayers}
          onExportSmartObjectContents={onExportSmartObjectContents}
          onArrangeLayer={onArrangeLayer}
        />
      </div>
    </Card>
  );
};

export default LayersPanel;