"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Layer } from "@/types/editor";

interface LayerGeneralPropertiesProps {
  layer: Layer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string, historyName: string) => void; // Updated signature
}

const blendModes = [
  "normal", "multiply", "screen", "overlay", "darken", "lighten", 
  "color-dodge", "color-burn", "hard-light", "soft-light", "difference", 
  "exclusion", "hue", "saturation", "color", "luminosity"
];

const LayerGeneralProperties = ({ layer, onUpdate, onCommit }: LayerGeneralPropertiesProps) => {
  const handleUpdate = (updates: Partial<Layer>) => {
    onUpdate(layer.id, updates);
  };

  const handleCommit = (historyName: string) => {
    onCommit(layer.id, historyName);
  };

  const handleBlendModeChange = (blendMode: string) => {
    handleUpdate({ blendMode });
    handleCommit(`Change Blend Mode to ${blendMode}`);
  };

  const handleOpacityChange = (value: number) => {
    handleUpdate({ opacity: value });
  };

  const handleOpacityCommit = ([value]: number[]) => {
    handleCommit("Change Opacity");
  };

  return (
    <div className="space-y-4">
      {/* Blend Mode */}
      <div className="grid gap-2">
        <Label htmlFor="blend-mode">Blend Mode</Label>
        <Select
          value={layer.blendMode || 'normal'}
          onValueChange={handleBlendModeChange}
          disabled={layer.type === 'image'}
        >
          <SelectTrigger id="blend-mode" className="capitalize">
            <SelectValue placeholder="Normal" />
          </SelectTrigger>
          <SelectContent>
            {blendModes.map(mode => (
              <SelectItem key={mode} value={mode} className="capitalize">{mode}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Opacity */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="opacity">Opacity</Label>
          <span className="text-sm text-muted-foreground">{layer.opacity ?? 100}%</span>
        </div>
        <Slider
          id="opacity"
          min={0}
          max={100}
          step={1}
          value={[layer.opacity ?? 100]}
          onValueChange={([v]) => handleOpacityChange(v)}
          onValueCommit={handleOpacityCommit}
          disabled={layer.type === 'image'}
        />
      </div>
      
      {/* Fill (Stubbed to match Opacity for now) */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="fill">Fill</Label>
          <span className="text-sm text-muted-foreground">{layer.opacity ?? 100}%</span>
        </div>
        <Slider
          id="fill"
          min={0}
          max={100}
          step={1}
          value={[layer.opacity ?? 100]}
          onValueChange={([v]) => handleOpacityChange(v)} // Use opacity handler for now
          onValueCommit={handleOpacityCommit}
          disabled={layer.type === 'image'}
        />
      </div>
    </div>
  );
};

export default LayerGeneralProperties;