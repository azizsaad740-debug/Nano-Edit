import * as React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Lock, Trash2, Copy, Layers, Group, Image, SquareStack, CornerUpLeft } from "lucide-react";
import type { Layer, BlendMode } from "@/types/editor";

interface LayerControlsProps {
  selectedLayer: Layer | undefined;
  onLayerPropertyCommit: (updates: Partial<Layer>, historyName: string) => void;
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
}

export const LayerControls: React.FC<LayerControlsProps> = ({
  selectedLayer,
  onLayerPropertyCommit,
  onLayerOpacityChange,
  onLayerOpacityCommit,
}) => {
  const handleBlendModeChange = (blendMode: string) => {
    if (selectedLayer) {
      onLayerPropertyCommit({ blendMode: blendMode as BlendMode }, `Set Blend Mode to ${blendMode}`);
    }
  };

  return (
    <div className="space-y-4 p-1">
      <div className="grid gap-2">
        <label className="text-sm font-medium">Opacity ({selectedLayer?.opacity ?? 100}%)</label>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={selectedLayer?.opacity ?? 100}
          onChange={(e) => onLayerOpacityChange(parseInt(e.target.value))}
          onMouseUp={onLayerOpacityCommit}
          onTouchEnd={onLayerOpacityCommit}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          disabled={!selectedLayer}
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="blendMode" className="text-sm font-medium">Blend Mode</label>
        <Select
          value={selectedLayer?.blendMode || 'normal'}
          onValueChange={handleBlendModeChange}
          disabled={!selectedLayer}
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