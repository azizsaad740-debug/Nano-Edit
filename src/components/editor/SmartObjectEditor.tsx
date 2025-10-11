"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Move, Type, Layers, Eye, EyeOff, Copy, Merge, Trash2 } from "lucide-react";
import type { Layer } from "@/hooks/useEditorState";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import { LayerProperties } from "./LayerProperties";
import TextProperties from "./TextProperties";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SmartObjectWorkspace } from "./SmartObjectWorkspace";
import { showError } from "@/utils/toast";

interface SmartObjectEditorProps {
  smartObject: Layer;
  onClose: () => void;
  onSave: (updatedLayers: Layer[]) => void;
}

interface SmartLayerItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onToggleVisibility: (id: string) => void;
}

const SmartLayerItem = ({ layer, isSelected, onSelect, onToggleVisibility }: SmartLayerItemProps) => {
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

export const SmartObjectEditor = ({ smartObject, onClose, onSave }: SmartObjectEditorProps) => {
  const [layers, setLayers] = React.useState<Layer[]>(smartObject.smartObjectData?.layers || []);
  const [selectedLayerId, setSelectedLayerId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  const handleSave = () => {
    onSave(layers);
  };

  const handleLayerUpdate = React.useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)));
  }, []);

  const handleLayerCommit = React.useCallback((id: string) => {
    // In a real scenario, this would trigger a history entry for the smart object itself
    // For now, we just ensure the state is updated.
  }, []);

  const handleLayerOpacityChange = React.useCallback((opacity: number) => {
    if (selectedLayerId) {
      handleLayerUpdate(selectedLayerId, { opacity });
    }
  }, [selectedLayerId, handleLayerUpdate]);

  const handleLayerOpacityCommit = React.useCallback(() => {
    if (selectedLayerId) {
      handleLayerCommit(selectedLayerId);
    }
  }, [selectedLayerId, handleLayerCommit]);

  const handleLayerPropertyCommit = React.useCallback((id: string, updates: Partial<Layer>) => {
    handleLayerUpdate(id, updates);
    handleLayerCommit(id);
  }, [handleLayerUpdate, handleLayerCommit]);

  const handleAddTextLayer = () => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "text",
      name: `Text ${layers.filter((l) => l.type === "text").length + 1}`,
      visible: true,
      content: "New Text",
      x: 50,
      y: 50,
      fontSize: 48,
      color: "#FFFFFF",
      fontFamily: "Roboto",
      opacity: 100,
      blendMode: 'normal',
      fontWeight: "normal",
      fontStyle: "normal",
      textAlign: "center",
      rotation: 0,
      letterSpacing: 0,
      padding: 10,
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const handleAddDrawingLayer = () => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "drawing",
      name: `Drawing ${layers.filter((l) => l.type === "drawing").length + 1}`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      dataUrl: "",
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    return newLayer.id; // Return ID for LiveBrushCanvas
  };

  const handleDeleteLayer = () => {
    if (!selectedLayerId) return;
    setLayers(prev => prev.filter(l => l.id !== selectedLayerId));
    setSelectedLayerId(null);
  };

  const handleDuplicateLayer = () => {
    if (!selectedLayer) return;
    const newLayer: Layer = {
      ...selectedLayer,
      id: uuidv4(),
      name: `${selectedLayer.name} Copy`,
    };
    setLayers(prev => {
      const index = prev.findIndex(l => l.id === selectedLayer.id);
      return [...prev.slice(0, index + 1), newLayer, ...prev.slice(index + 1)];
    });
    setSelectedLayerId(newLayer.id);
  };

  const handleMergeLayerDown = () => {
    if (!selectedLayer) return;
    const layerIndex = layers.findIndex(l => l.id === selectedLayer.id);
    if (layerIndex < 1) {
      showError("Cannot merge the bottom-most layer.");
      return;
    }

    const topLayer = layers[layerIndex];
    const bottomLayer = layers[layerIndex - 1];

    // Simplified merge for smart object editor: just remove top layer
    // In a full implementation, this would involve rasterizing and compositing
    setLayers(prev => prev.filter(l => l.id !== topLayer.id));
    setSelectedLayerId(bottomLayer.id);
    showError("Merge down is a stub in smart object editor. Only top layer removed.");
  };

  const handleRasterizeLayer = () => {
    if (!selectedLayer || selectedLayer.type !== 'text') {
      showError("Only text layers can be rasterized.");
      return;
    }
    // Simplified rasterize for smart object editor: just change type
    setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, type: 'drawing', content: undefined, dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' } : l));
    showError("Rasterize is a stub in smart object editor. Layer type changed to drawing.");
  };

  const handleToggleVisibility = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = layers.findIndex((l) => l.id === active.id);
    const newIndex = layers.findIndex((l) => l.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    
    setLayers(prev => arrayMove(prev, oldIndex, newIndex));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Edit Smart Object: {smartObject.name}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-1 gap-4 overflow-hidden">
            {/* Left Panel: Layers and Actions */}
            <div className="w-1/4 flex flex-col">
              <h3 className="font-medium mb-2">Layers</h3>
              <ScrollArea className="flex-1 border rounded-md p-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={layers.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {layers.map((layer) => (
                        <SmartLayerItem
                          key={layer.id}
                          layer={layer}
                          isSelected={selectedLayerId === layer.id}
                          onSelect={() => setSelectedLayerId(layer.id)}
                          onToggleVisibility={handleToggleVisibility}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </ScrollArea>
              <div className="mt-4 space-y-2 border-t pt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={handleAddTextLayer}>
                    <Type className="h-4 w-4 mr-2" />
                    Add Text
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleAddDrawingLayer}>
                    <Layers className="h-4 w-4 mr-2" />
                    Add Layer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDuplicateLayer}
                    disabled={!selectedLayer}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleMergeLayerDown}
                    disabled={!selectedLayer || layers.indexOf(selectedLayer) === 0}
                  >
                    <Merge className="h-4 w-4 mr-2" />
                    Merge Down
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRasterizeLayer}
                    disabled={selectedLayer?.type !== 'text'}
                    className="col-span-2"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Rasterize Layer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeleteLayer}
                    disabled={!selectedLayer}
                    className="col-span-2"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected Layer
                  </Button>
                </div>
              </div>
            </div>

            {/* Middle Panel: Workspace Preview */}
            <div className="w-1/2 flex flex-col">
              <h3 className="font-medium mb-2">Preview</h3>
              <SmartObjectWorkspace
                layers={layers}
                width={smartObject.smartObjectData?.width || 1000}
                height={smartObject.smartObjectData?.height || 1000}
                selectedLayerId={selectedLayerId}
                onSelectLayer={setSelectedLayerId}
                onLayerUpdate={handleLayerUpdate}
                onLayerCommit={handleLayerCommit}
              />
            </div>

            {/* Right Panel: Properties */}
            <div className="w-1/4 flex flex-col">
              <h3 className="font-medium mb-2">Properties</h3>
              <ScrollArea className="flex-1 border rounded-md p-4">
                {selectedLayer ? (
                  <Accordion type="multiple" className="w-full" defaultValue={['properties']}>
                    <AccordionItem value="properties">
                      <AccordionTrigger>General Properties</AccordionTrigger>
                      <AccordionContent>
                        <LayerProperties
                          selectedLayer={selectedLayer}
                          onOpacityChange={handleLayerOpacityChange}
                          onOpacityCommit={handleLayerOpacityCommit}
                          onLayerPropertyCommit={(updates, name) => handleLayerPropertyCommit(selectedLayer.id, updates)}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    {selectedLayer.type === 'text' && (
                      <AccordionItem value="text">
                        <AccordionTrigger>Text Properties</AccordionTrigger>
                        <AccordionContent>
                          <TextProperties
                            layer={selectedLayer}
                            onUpdate={handleLayerUpdate}
                            onCommit={handleLayerCommit}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                ) : (
                  <p className="text-muted-foreground text-sm">Select a layer to edit its properties.</p>
                )}
              </ScrollArea>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};