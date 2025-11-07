import * as React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Layer, BlendMode } from "@/types/editor";

interface LayerGeneralPropertiesProps {
  layer: Layer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string, historyName: string) => void;
}

export const LayerGeneralProperties: React.FC<LayerGeneralPropertiesProps> = ({ layer, onUpdate, onCommit }) => {
  const handleUpdate = (updates: Partial<Layer>) => {
    onUpdate(layer.id, updates);
  };

  const handleCommit = (historyName: string) => {
    onCommit(layer.id, historyName);
  };

  const handleBlendModeChange = (blendMode: string) => {
    handleUpdate({ blendMode: blendMode as BlendMode });
    handleCommit(`Change Blend Mode to ${blendMode}`);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Opacity ({layer.opacity}%)</Label>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[layer.opacity]}
          onValueChange={([value]) => handleUpdate({ opacity: value })}
          onValueCommit={() => handleCommit(`Change Opacity of ${layer.name}`)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="blendMode">Blend Mode</Label>
        <Select
          value={layer.blendMode}
          onValueChange={handleBlendModeChange}
        >
          <SelectTrigger id="blendMode">
            <SelectValue placeholder="Normal" />
          </SelectTrigger>
          <SelectContent>
            {['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color'].map(mode => (
              <SelectItem key={mode} value={mode} className="capitalize">{mode}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};