"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";

interface BrushOptionsProps {
  activeTool: "brush" | "eraser";
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushOpacity: number;
  setBrushOpacity: (opacity: number) => void;
  foregroundColor: string;
  setForegroundColor: (color: string) => void;
  brushHardness: number;
  setBrushHardness: (hardness: number) => void;
  brushSmoothness: number;
  setBrushSmoothness: (smoothness: number) => void;
  brushShape: 'circle' | 'square';
  setBrushShape: (shape: 'circle' | 'square') => void;
}

export const BrushOptions: React.FC<BrushOptionsProps> = ({
  activeTool,
  brushSize,
  setBrushSize,
  brushOpacity,
  setBrushOpacity,
  foregroundColor,
  setForegroundColor,
  brushHardness,
  setBrushHardness,
  brushSmoothness,
  setBrushSmoothness,
  brushShape,
  setBrushShape,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Size ({brushSize})</Label>
        <Slider
          min={1}
          max={200}
          step={1}
          value={[brushSize]}
          onValueChange={([value]) => setBrushSize(value)}
        />
      </div>
      <div className="space-y-1">
        <Label>Opacity ({brushOpacity}%)</Label>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[brushOpacity]}
          onValueChange={([value]) => setBrushOpacity(value)}
        />
      </div>
      <div className="space-y-1">
        <Label>Hardness ({brushHardness}%)</Label>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[brushHardness]}
          onValueChange={([value]) => setBrushHardness(value)}
        />
      </div>
      {activeTool === 'brush' && (
        <div className="space-y-1">
          <Label>Color</Label>
          <ColorPicker
            color={foregroundColor}
            onChange={setForegroundColor}
            onCommit={() => {}} // Placeholder
          />
        </div>
      )}
    </div>
  );
};