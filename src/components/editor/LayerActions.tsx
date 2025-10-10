"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Type, Layers, Copy, Merge } from "lucide-react";
import type { Layer } from "@/hooks/useEditorState";

interface LayerActionsProps {
  layers: Layer[];
  selectedLayer: Layer | undefined;
  onAddTextLayer: () => void;
  onAddDrawingLayer: () => void;
  onDeleteLayer: () => void;
  onDuplicateLayer: () => void;
  onMergeLayerDown: () => void;
  onRasterizeLayer: () => void;
}

export const LayerActions = ({
  layers,
  selectedLayer,
  onAddTextLayer,
  onAddDrawingLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onMergeLayerDown,
  onRasterizeLayer,
}: LayerActionsProps) => {
  const isActionable = selectedLayer && selectedLayer.type !== 'image';

  const isMergeable = React.useMemo(() => {
    if (!selectedLayer) return false;
    const layerIndex = layers.findIndex(l => l.id === selectedLayer.id);
    // Cannot merge if it's the first layer or the layer directly above the background
    if (layerIndex < 1 || layers[layerIndex - 1].type === 'image') {
      return false;
    }
    return true;
  }, [layers, selectedLayer]);

  const isRasterizable = selectedLayer?.type === 'text';

  return (
    <div className="mt-4 space-y-2 border-t pt-4">
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" onClick={onAddTextLayer}>
          <Type className="h-4 w-4 mr-2" />
          Add Text
        </Button>
        <Button size="sm" variant="outline" onClick={onAddDrawingLayer}>
          <Layers className="h-4 w-4 mr-2" />
          Add Layer
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDuplicateLayer}
          disabled={!isActionable}
        >
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onMergeLayerDown}
          disabled={!isMergeable}
        >
          <Merge className="h-4 w-4 mr-2" />
          Merge Down
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRasterizeLayer}
          disabled={!isRasterizable}
          className="col-span-2"
        >
          <Layers className="h-4 w-4 mr-2" />
          Rasterize Layer
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDeleteLayer}
          disabled={!isActionable}
          className="col-span-2"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Selected Layer
        </Button>
      </div>
    </div>
  );
};