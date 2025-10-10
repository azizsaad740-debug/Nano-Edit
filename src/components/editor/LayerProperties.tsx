"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Layer } from "@/hooks/useEditorState";

interface LayerPropertiesProps {
  selectedLayer: Layer;
  onOpacityChange: (opacity: number) => void;
  onOpacityCommit: () => void;
  onLayerPropertyCommit: (updates: Partial<Layer>, historyName: string) => void;
}

const blendModes = [
  "normal", "multiply", "screen", "overlay", "darken", "lighten", 
  "color-dodge", "color-burn", "hard-light", "soft-light", "difference", 
  "exclusion", "hue", "saturation", "color", "luminosity"
];

export const LayerProperties = ({
  selectedLayer,
  onOpacityChange,
  onOpacityCommit,
  onLayerPropertyCommit,
}: LayerPropertiesProps) => {
  const handleBlendModeChange = (blendMode: string) => {
    onLayerPropertyCommit({ blendMode }, `Set Blend Mode to ${blendMode}`);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="layer-opacity">Opacity</Label>
          <span className="text-sm text-muted-foreground">{`${Math.round(selectedLayer.opacity ?? 100)}%`}</span>
        </div>
        <Slider
          id="layer-opacity"
          min={0}
          max={100}
          step={1}
          value={[selectedLayer.opacity ?? 100]}
          onValueChange={([v]) => onOpacityChange(v)}
          onValueCommit={onOpacityCommit}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="blend-mode">Blend Mode</Label>
        <Select
          value={selectedLayer.blendMode || 'normal'}
          onValueChange={handleBlendModeChange}
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
  );
};