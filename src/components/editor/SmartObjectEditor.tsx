"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Move, Type, Layers } from "lucide-react";
import type { Layer } from "@/hooks/useEditorState";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface SmartObjectEditorProps {
  smartObject: Layer;
  onClose: () => void;
  onSave: (updatedLayers: Layer[]) => void;
}

interface SmartLayerItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
}

const SmartLayerItem = ({ layer, isSelected, onSelect, onRename }: SmartLayerItemProps) => {
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
        {getLayerIcon()}
        <span className="font-medium truncate">{layer.name}</span>
      </div>
    </div>
  );
};

export const SmartObjectEditor = ({ smartObject, onClose, onSave }: SmartObjectEditorProps) => {
  const [layers, setLayers] = React.useState<Layer[]>(smartObject.smartObjectData?.layers || []);
  const [selectedLayerId, setSelectedLayerId] = React.useState<string | null>(null);

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  const handleSave = () => {
    onSave(layers);
  };

  const handleRenameLayer = (id: string, name: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, name } : layer
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Edit Smart Object: {smartObject.name}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-1 gap-4 overflow-hidden">
            <div className="w-1/3 flex flex-col">
              <h3 className="font-medium mb-2">Layers</h3>
              <ScrollArea className="flex-1 border rounded-md p-2">
                <div className="space-y-2">
                  {layers.map(layer => (
                    <SmartLayerItem
                      key={layer.id}
                      layer={layer}
                      isSelected={selectedLayerId === layer.id}
                      onSelect={() => setSelectedLayerId(layer.id)}
                      onRename={(name) => handleRenameLayer(layer.id, name)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="w-2/3 flex flex-col">
              <h3 className="font-medium mb-2">Preview</h3>
              <div className="flex-1 border rounded-md bg-muted flex items-center justify-center">
                {selectedLayer ? (
                  <div className="text-center">
                    <p className="font-medium">{selectedLayer.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedLayer.type === 'text' ? 'Text Layer' : 'Layer'}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Select a layer to edit</p>
                )}
              </div>
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