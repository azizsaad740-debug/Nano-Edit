"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Trash2, Type } from "lucide-react";
import type { Layer } from "@/hooks/useEditorState";

interface LayerActionsProps {
  selectedLayer: Layer | undefined;
  onAddTextLayer: () => void;
  onDeleteLayer: () => void;
  onOpacityChange: (opacity: number) => void;
  onOpacityCommit: () => void;
}

export const LayerActions = ({
  selectedLayer,
  onAddTextLayer,
  onDeleteLayer,
  onOpacityChange,
  onOpacityCommit,
}: LayerActionsProps) => {
  const isActionable = selectedLayer && selectedLayer.type !== 'image';
  const isOpacityEditable = !!selectedLayer;

  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="layer-opacity">Opacity</Label>
          <span className="text-sm text-muted-foreground">{isOpacityEditable ? `${Math.round(selectedLayer.opacity ?? 100)}%` : '-'}</span>
        </div>
        <Slider
          id="layer-opacity"
          min={0}
          max={100}
          step={1}
          value={[isOpacityEditable ? selectedLayer.opacity ?? 100 : 100]}
          onValueChange={([v]) => onOpacityChange(v)}
          onValueCommit={onOpacityCommit}
          disabled={!isOpacityEditable}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={onAddTextLayer}>
          <Type className="h-4 w-4 mr-2" />
          Add Text
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={onDeleteLayer}
          disabled={!isActionable}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Layer
        </Button>
      </div>
    </div>
  );
};