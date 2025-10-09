"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface BrushOptionsProps {
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushOpacity: number;
  setBrushOpacity: (opacity: number) => void;
  brushColor: string;
  setBrushColor: (color: string) => void;
  activeTool: "brush" | "eraser";
}

export const BrushOptions = ({
  brushSize,
  setBrushSize,
  brushOpacity,
  setBrushOpacity,
  brushColor,
  setBrushColor,
  activeTool,
}: BrushOptionsProps) => {
  return (
    <div className="flex items-center gap-4 p-2 bg-muted/50 rounded-md">
      <div className="grid gap-1.5">
        <Label htmlFor="brush-size" className="text-xs">Size</Label>
        <Slider
          id="brush-size"
          min={1}
          max={200}
          step={1}
          value={[brushSize]}
          onValueChange={([v]) => setBrushSize(v)}
          className="w-24"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="brush-opacity" className="text-xs">Opacity</Label>
        <Slider
          id="brush-opacity"
          min={0}
          max={100}
          step={1}
          value={[brushOpacity]}
          onValueChange={([v]) => setBrushOpacity(v)}
          className="w-24"
        />
      </div>
      {activeTool === 'brush' && (
        <div className="grid gap-1.5">
          <Label htmlFor="brush-color" className="text-xs">Color</Label>
          <Input
            id="brush-color"
            type="color"
            className="p-1 h-8 w-10"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};