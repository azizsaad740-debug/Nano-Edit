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
import type { Layer, EditState, Point, ActiveTool, BrushState } from "@/hooks/useEditorState";
import LayerItem from "./LayerItem";
import { ChannelsPanel } from "./ChannelsPanel";
import { LayerActions } from "./LayerActions";
import { LayerControls } from "./LayerControls"; // NEW Import
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BrushOptions } from "../editor/BrushOptions";
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
  onAddGradientLayer: () => void; // Added this line
  onDuplicateLayer: () => void;
  onMergeLayerDown: () => void;
  onRasterizeLayer: () => void;
  onReorder: (activeId: string, overId: string, isDroppingIntoGroup?: boolean) => void; // Updated signature
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
  // Layer Masking
  hasActiveSelection: boolean; // New prop
  onApplySelectionAsMask: () => void; // New prop
  onRemoveLayerMask: (id: string) => void; // NEW prop
  onInvertLayerMask: (id: string) => void; // NEW prop
  onToggleClippingMask: () => void; // NEW prop
}

export const LayersPanel = ({
  layers,
  onToggleVisibility,
  onRename,
  onDelete,
  onAddTextLayer,
  onAddDrawingLayer,
  onAddShapeLayer,
  onAddGradientLayer,
  onDuplicateLayer,
  onMergeLayerDown,
  onRasterizeLayer,
  onReorder, // Updated
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
  hasActiveSelection, // Destructure new prop
  onApplySelectionAsMask, // Destructure new prop
  onRemoveLayerMask, // Destructure new prop
  onInvertLayerMask, // Destructure new prop
  onToggleClippingMask, // Destructure new prop
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
        if (found) return found;
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
        <SortableContext
          items={[layer.id]}
          strategy={verticalListSortingStrategy}
        >
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
            onRemoveMask={onRemoveLayerMask} // Pass the new prop
          />
        </SortableContext>
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

  const handleDragStart = (event: any) => {
    setActiveDragItem(event.active);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over || active.id === over.id) {
      return;
    }
    onReorder(active.id as string, over.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const { layer: overLayer } = findLayerAndParent(over.id as string, layers);

    // If dragging over an expanded group, treat as dropping into the group
    if (overLayer && overLayer.type === 'group' && overLayer.expanded) {
      onReorder(active.id as string, over.id as string, true);
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
            
            {/* NEW Layer Controls Section */}
            <LayerControls
              selectedLayer={selectedLayer}
              onLayerPropertyCommit={(updates, name) => selectedLayerId && onLayerPropertyCommit(selectedLayerId, updates, name)}
              onLayerOpacityChange={onLayerOpacityChange}
              onLayerOpacityCommit={onLayerOpacityCommit}
            />
            
            <ScrollArea className="flex-1 pr-3 pt-2">
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
                      onRemoveMask={() => {}} // Dummy function for DragOverlay
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
              onAddGradientLayer={onAddGradientLayer}
              onDeleteLayer={() => selectedLayerIds.forEach(id => onDelete(id))} // Delete all selected layers
              onDuplicateLayer={onDuplicateLayer}
              onMergeLayerDown={onMergeLayerDown}
              onRasterizeLayer={onRasterizeLayer}
              onCreateSmartObject={onCreateSmartObject}
              onOpenSmartObject={onOpenSmartObject}
              selectedShapeType={selectedShapeType}
              groupLayers={() => groupLayers(selectedLayerIds)} // Pass groupLayers
              hasActiveSelection={hasActiveSelection} // Pass new prop
              onApplySelectionAsMask={onApplySelectionAsMask} // Pass new prop
              onInvertLayerMask={() => selectedLayerId && onInvertLayerMask(selectedLayerId)} // NEW: Pass handler
              onToggleClippingMask={onToggleClippingMask} // NEW: Pass handler
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