"use client";

import * as React from "react";
import { Layer } from "@/types/editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LayerOptionsProps {
  layer: Layer;
  onLayerUpdate: (updates: Partial<Layer>) => void;
  onLayerPropertyCommit: (historyName: string) => void;
}

export const LayerOptions: React.FC<LayerOptionsProps> = ({
  layer,
  onLayerUpdate,
  onLayerPropertyCommit,
}) => {
  const handleCommit = (historyName: string) => {
    onLayerPropertyCommit(historyName);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Layer Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Opacity */}
        <div className="space-y-1">
          <Label>Opacity ({layer.opacity}%)</Label>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[layer.opacity]}
            onValueChange={([value]) => onLayerUpdate({ opacity: value })}
            onValueCommit={() => handleCommit(`Change Opacity of ${layer.name}`)}
          />
        </div>

        {/* Blend Mode */}
        <div className="space-y-1">
          <Label htmlFor="blendMode">Blend Mode</Label>
          <Select
            value={layer.blendMode}
            onValueChange={(value) => {
              onLayerUpdate({ blendMode: value as Layer['blendMode'] });
              handleCommit(`Change Blend Mode to ${value}`);
            }}
          >
            <SelectTrigger id="blendMode">
              <SelectValue placeholder="Normal" />
            </SelectTrigger>
            <SelectContent>
              {/* Placeholder list of blend modes */}
              {['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color'].map(mode => (
                <SelectItem key={mode} value={mode}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};