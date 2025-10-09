"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Trash2, Type, Layers } from "lucide-react";
import type { Layer } from "@/hooks/useEditorState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LayerActionsProps {
  selectedLayer: Layer | undefined;
  onAddTextLayer: () => void;
  onAddDrawingLayer: () => void;
  onDeleteLayer: () => void;
  onOpacityChange: (opacity: number) => void;
  onOpacityCommit: () => void;
  onLayerPropertyCommit: (updates: Partial<Layer>, historyName: string) => void;
}

const blendModes = [
  "normal", "multiply", "screen", "overlay", "darken", "lighten", 
  "color-dodge", "color-burn", "hard-light", "soft-light", "difference", 
  "exclusion", "hue", "saturation", "color", "luminosity"
];

export const LayerActions = ({
  selectedLayer,
  onAddTextLayer,
  onAddDrawingLayer,
  onDeleteLayer,
  onOpacityChange,
  onOpacityCommit,
  onLayerPropertyCommit,
}: LayerActionsProps) => {
  const isActionable = selectedLayer && selectedLayer.type !== 'image';
  const isOpacityEditable = !!selectedLayer;

  const handleBlendModeChange = (blendMode: string) => {
    if (selectedLayer) {
      onLayerPropertyCommit({ blendMode }, `Set Blend Mode to ${blendMode}`);
    }
  };

  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      <div className="grid grid-cols-2 gap-4">
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
        <div className="grid gap-2">
          <Label htmlFor="blend-mode">Blend Mode</Label>
          <Select
            value={selectedLayer?.blendMode || 'normal'}
            onValueChange={handleBlendModeChange}
            disabled={!isActionable}
          >
            <SelectTrigger id="blend-mode" className="capitalize">
              <SelectValue placeholder="Blend Mode" />
            </SelectTrigger>
            <SelectContent>
              {blendModes.map(mode => (
                <SelectItem key={mode} value={mode} className="capitalize">{mode}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" variant="outline" onClick={onAddTextLayer}>
          <Type className="h-4 w-4 mr-2" />
          Text
        </Button>
        <Button size="sm" variant="outline" onClick={onAddDrawingLayer}>
          <Layers className="h-4 w-4 mr-2" />
          Layer
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDeleteLayer}
          disabled={!isActionable}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
};