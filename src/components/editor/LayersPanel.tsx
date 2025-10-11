"use client";

import * as React from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  Active,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Layer, EditState, ActiveTool, BrushState } from "@/hooks/useEditorState";
import LayerItem from "./LayerItem";
import { ChannelsPanel } from "./ChannelsPanel";
import { LayerActions } from "./LayerActions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BrushOptions } from "./BrushOptions";
import { arrayMove } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast"; // Import showError

interface LayersPanelProps {
  layers: Layer[];
  onToggleVisibility: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onAddTextLayer: () => void;
  onAddDrawingLayer: () => string;
  onAddShapeLayer: (coords: { x: number; y: number }, shapeType?: Layer['shapeType'], initialWidth?: number, initialHeight?: number) => void;
  onDuplicateLayer: () => void;
  onMergeLayerDown: () => void;
  onRasterizeLayer: () => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  channels: EditState['channels'];
  onChannelChange: (channel: 'r' | 'g' | 'b', value: boolean) => void;
  // Layer editing props for properties panels
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string) => void;
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void;
  // Smart object functions
  onCreateSmartObject: (layerIds: string[]) => void;
  onOpenSmartObject: (id: string) => void;
  selectedShapeType: Layer['shapeType'] | null;
  // Tool state
  activeTool: ActiveTool | null;
  // Brush state
  brushState: BrushState;
  setBrushState: (updates: Partial<BrushState>) => void;
  // Grouping
  groupLayers: (layerIds: string[]) => void;
  toggleGroupExpanded: (id: string) => void;
  updateLayersState: (newLayers: Layer[], historyName?: string) => void; // Add updateLayersState
}

export const LayersPanel = ({
  layers,
  onToggleVisibility,
  onRename,
  onDelete,
  onAddTextLayer,
  onAddDrawingLayer,
  onAddShapeLayer,
  onDuplicateLayer,
  onMergeLayerDown,
  onRasterizeLayer,
  onReorder,
  selectedLayerId,
  onSelectLayer,
  channels,
  onChannelChange,
  onLayerUpdate,
  onLayerCommit,
  onLayerOpacityChange,
  onLayerOpacityCommit,
  onLayerPropertyCommit,
  onCreateSmartObject,
  onOpenSmartObject,
  selectedShapeType,
  activeTool,
  brushState,
  setBrushState,
  groupLayers,
  toggleGroupExpanded,
  updateLayersState, // Destructure updateLayersState
}: LayersPanelProps) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [tempName, setTempName] = React.useState("");
  const [selectedLayerIds, setSelectedLayerIds] = React.useState<string[]>([]);
  const [activeDragItem, setActiveDragItem] = React.useState<Active | null>(null);

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

  // Helper to find a layer by ID, potentially nested
  const findLayerAndParent = (
    id: string,
    currentLayers: Layer[],
    parent: Layer | null = null,
    path: Layer[] = []
  ): { layer: Layer | undefined; parent: Layer | null; path: Layer[] } => {
    for (const layer of currentLayers) {
      if (layer.id === id) {
        return { layer, parent, path: [...path, layer] };
      }
      if (layer.type === 'group' && layer.children) {
        const found = findLayerAndParent(id, layer.children, layer, [...path, layer]);
        if (found.layer) return found;
      }
    }
    return { layer: undefined, parent: null, path: [] };
  };

  // Helper to update layers array, potentially nested
  const updateLayersRecursively = (
    currentLayers: Layer[],
    targetId: string,
    updates: Partial<Layer>
  ): Layer[] => {
    return currentLayers.map(layer => {
      if (layer.id === targetId) {
        return { ...layer, ...updates };
      }
      if (layer.type === 'group' && layer.children) {
        return {
          ...layer,
          children: updateLayersRecursively(layer.children, targetId, updates),
        };
      }
      return layer;
    });
  };

  const handleSelectLayer = (id: string, ctrlKey: boolean, shiftKey: boolean) => {
    if (ctrlKey) {
      setSelectedLayerIds(prev =>
        prev.includes(id)
          ? prev.filter(layerId => layerId !== id)
          : [...prev, id]
      );
    } else if (shiftKey && selectedLayerId) {
      const allLayerIds = getAllLayerIds(layers);
      const currentIndex = allLayerIds.indexOf(id);
      const lastIndex = allLayerIds.indexOf(selectedLayerId);
      
      const startIndex = Math.min(currentIndex, lastIndex);
      const endIndex = Math.max(currentIndex, lastIndex);
      
      const newSelection = allLayerIds
        .slice(startIndex, endIndex + 1);
        
      setSelectedLayerIds(newSelection);
    } else {
      setSelectedLayerIds([id]);
      onSelectLayer(id);
    }
  };

  const getAllLayerIds = (layersToProcess: Layer[]): string[] => {
    let ids: string[] = [];
    layersToProcess.forEach(layer => {
      ids.push(layer.id);
      if (layer.type === 'group' && layer.children && layer.expanded) {
        ids = ids.concat(getAllLayerIds(layer.children));
      }
    });
    return ids;
  };

  const renderLayerItems = (layersToRender: Layer[], depth: number) => {
    return layersToRender.map((layer) => (
      <React.Fragment key={layer.id}>
        <LayerItem
          layer={layer}
          isEditing={editingId === layer.id}
          tempName={tempName}
          setTempName={setTempName}
          startRename={startRename}
          confirmRename={confirmRename}
          cancelRename={cancelRename}
          onToggleVisibility={onToggleVisibility}
          isSelected={selectedLayerIds.includes(layer.id)}
          onSelect={(e) => handleSelectLayer(layer.id, e.ctrlKey, e.shiftKey)}
          onToggleGroupExpanded={toggleGroupExpanded}
          depth={depth}
        />
        {layer.type === 'group' && layer.expanded && layer.children && (
          <SortableContext
            items={layer.children.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {renderLayerItems(layer.children, depth + 1)}
          </SortableContext>
        )}
      </React.Fragment>
    ));
  };

  const getParentContainer = (id: string, currentLayers: Layer[]): Layer[] | undefined => {
    if (currentLayers.some(l => l.id === id)) {
      return currentLayers; // It's a top-level layer
    }
    for (const layer of currentLayers) {
      if (layer.type === 'group' && layer.children) {
        const found = getParentContainer(id, layer.children);
        if (found) return found;
      }
    }
    return undefined;
  };

  const handleDragStart = (event: any) => {
    setActiveDragItem(event.active);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over || active.id === over.id) {
      return;
    }

    const { layer: activeLayer } = findLayerAndParent(active.id as string, layers);
    if (!activeLayer || activeLayer.type === 'image') {
      showError("Cannot move the background layer.");
      return;
    }

    const activeContainer = getParentContainer(active.id as string, layers);
    const overContainer = getParentContainer(over.id as string, layers);

    if (!activeContainer || !overContainer) {
      console.error("Could not find containers for active or over item.");
      return;
    }

    const oldIndex = activeContainer.findIndex((l) => l.id === active.id);
    const newIndex = overContainer.findIndex((l) => l.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    let newLayersState = [...layers];

    // Case 1: Moving within the same container (top-level or within a group)
    if (activeContainer === overContainer) {
      const updatedContainer = arrayMove(activeContainer, oldIndex, newIndex);
      if (activeContainer === layers) {
        newLayersState = updatedContainer;
      } else {
        // Update the parent group's children
        newLayersState = updateLayersRecursively(newLayersState, overContainer[0].id, {
          children: updatedContainer,
        });
      }
      onReorder(oldIndex, newIndex); // This needs to be adapted for nested reordering
    }
    // Case 2: Moving between different containers (e.g., into/out of a group)
    else {
      const [movedLayer] = activeContainer.splice(oldIndex, 1);
      overContainer.splice(newIndex, 0, movedLayer);

      // Update the state for both affected containers
      newLayersState = layers.map(layer => {
        if (layer.type === 'group' && layer.children === activeContainer) {
          return { ...layer, children: activeContainer };
        }
        if (layer.type === 'group' && layer.children === overContainer) {
          return { ...layer, children: overContainer };
        }
        return layer;
      });
      // If top-level layers were affected
      if (activeContainer === layers) newLayersState = activeContainer;
      if (overContainer === layers) newLayersState = overContainer;

      // This is a simplified reorder, a full implementation would need to track parent IDs
      // For now, we'll just update the state directly and record a generic history entry.
      updateLayersState(newLayersState, "Reorder Layers");
    }
    updateLayersState(newLayersState, "Reorder Layers"); // Record history
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const { layer: activeLayer } = findLayerAndParent(active.id as string, layers);
    const { layer: overLayer, parent: overParent } = findLayerAndParent(over.id as string, layers);

    if (!activeLayer || activeLayer.type === 'image') return; // Cannot drag background

    // Logic for dropping into a group
    if (overLayer && overLayer.type === 'group' && overLayer.expanded) {
      const newLayersState = [...layers];
      const activeContainer = getParentContainer(active.id as string, newLayersState);
      const overContainer = overLayer.children;

      if (activeContainer && overContainer && activeContainer !== overContainer) {
        const [movedLayer] = activeContainer.splice(activeContainer.findIndex(l => l.id === active.id), 1);
        overContainer.unshift(movedLayer); // Add to the beginning of the group

        updateLayersState(newLayersState, `Move Layer "${activeLayer.name}" into Group "${overLayer.name}"`);
        return;
      }
    }
    // Logic for dropping out of a group or reordering
    else if (overLayer && overParent && overParent.type === 'group' && !overParent.expanded) {
      // If dropping over a collapsed group, treat it as dropping onto the group itself
      // This means the layer should be placed next to the group, not inside it.
      const newLayersState = [...layers];
      const activeContainer = getParentContainer(active.id as string, newLayersState);
      const overContainer = getParentContainer(overParent.id as string, newLayersState);

      if (activeContainer && overContainer && activeContainer !== overContainer) {
        const [movedLayer] = activeContainer.splice(activeContainer.findIndex(l => l.id === active.id), 1);
        const overParentIndex = overContainer.findIndex(l => l.id === overParent.id);
        overContainer.splice(overParentIndex + 1, 0, movedLayer); // Place after the collapsed group

        updateLayersState(newLayersState, `Move Layer "${activeLayer.name}" next to Group "${overParent.name}"`);
        return;
      }
    }
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <Card className="mt-4 flex flex-col h-full">
      <CardContent className="flex-1 flex flex-col min-h-0 pt-4">
        <Tabs defaultValue="layers" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="layers">Layers</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
          </TabsList>
          <TabsContent value="layers" className="flex-1 flex flex-col mt-2 overflow-hidden">
            <ScrollArea className="flex-1 pr-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
              >
                <SortableContext
                  items={layers.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {renderLayerItems(layers, 0)}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeDragItem ? (
                    <LayerItem
                      layer={findLayerAndParent(activeDragItem.id as string, layers).layer!}
                      isEditing={false}
                      tempName=""
                      setTempName={() => {}}
                      startRename={() => {}}
                      confirmRename={() => {}}
                      cancelRename={() => {}}
                      onToggleVisibility={() => {}}
                      isSelected={false}
                      onSelect={() => {}}
                      onToggleGroupExpanded={() => {}}
                      depth={0}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </ScrollArea>
            <LayerActions
              layers={layers}
              selectedLayer={selectedLayer}
              selectedLayerIds={selectedLayerIds}
              onAddTextLayer={onAddTextLayer}
              onAddDrawingLayer={onAddDrawingLayer}
              onAddShapeLayer={onAddShapeLayer}
              onDeleteLayer={() => selectedLayerIds.forEach(id => onDelete(id))} // Delete all selected layers
              onDuplicateLayer={onDuplicateLayer}
              onMergeLayerDown={onMergeLayerDown}
              onRasterizeLayer={onRasterizeLayer}
              onCreateSmartObject={onCreateSmartObject}
              onOpenSmartObject={onOpenSmartObject}
              selectedShapeType={selectedShapeType}
              groupLayers={() => groupLayers(selectedLayerIds)} // Pass groupLayers
            />
          </TabsContent>
          <TabsContent value="channels" className="mt-2">
            <ChannelsPanel channels={channels} onChannelChange={onChannelChange} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};