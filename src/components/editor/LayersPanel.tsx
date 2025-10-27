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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Layer } from "@/types/editor";
import LayerList from "./LayerList";
import { LayerControls } from "./LayerControls";

// NOTE: Keeping all props defined here to avoid cascading errors in parent components, 
// even though many related actions/buttons are removed for space saving.

interface LayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
  onReorder: (activeId: string, overId: string) => void;
  onToggleVisibility: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMergeLayerDown: (id: string) => void;
  onRasterizeLayer: (id: string) => void;
  onCreateSmartObject: (layerIds: string[]) => void;
  onOpenSmartObject: (id: string) => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void;
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
  onAddTextLayer: () => void;
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
    onToggleVisibility,
    onRename,
    onRemoveLayerMask,
    onToggleLayerLock,
  } = props;

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [tempName, setTempName] = React.useState("");
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);
  const selectedLayerIds = selectedLayerId ? [selectedLayerId] : [];

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
      onRename(id, tempName.trim());
    }
    setEditingId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <LayerControls
        selectedLayer={selectedLayer}
        onLayerPropertyCommit={(updates, name) => selectedLayerId && props.onLayerPropertyCommit(selectedLayerId, updates, name)}
        onLayerOpacityChange={props.onLayerOpacityChange}
        onLayerOpacityCommit={props.onLayerOpacityCommit}
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
                onToggleVisibility={onToggleVisibility}
                selectedLayerIds={selectedLayerIds}
                onSelectLayer={onSelectLayer}
                onToggleGroupExpanded={props.toggleGroupExpanded}
                onRemoveLayerMask={onRemoveLayerMask}
                onToggleLayerLock={onToggleLayerLock}
              />
            </div>
          </SortableContext>
        </DndContext>
      </ScrollArea>
    </div>
  );
};

export default LayersPanel;