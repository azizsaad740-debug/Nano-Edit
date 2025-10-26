"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Circle, Square } from "lucide-react"; // Import icons for shapes
import type { BrushState } from "@/types/editor";

interface BrushOptionsProps {
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushOpacity: number;
  setBrushOpacity: (opacity: number) => void;
  foregroundColor: string; // Changed from brushColor
  setForegroundColor: (color: string) => void; // Changed from setBrushColor
  brushHardness: number; // Added hardness
  setBrushHardness: (hardness: number) => void; // Added hardness setter
  brushSmoothness: number; // Added smoothness
  setBrushSmoothness: (smoothness: number) => void; // Added smoothness setter
  brushShape: 'circle' | 'square'; // New prop for brush shape
  setBrushShape: (shape: 'circle' | 'square') => void; // New prop for setting brush shape
  activeTool: "brush" | "eraser";
}

export const BrushOptions = ({
  brushSize,
  setBrushSize,
  brushOpacity,
  setBrushOpacity,
  foregroundColor, // Destructure foregroundColor
  setForegroundColor, // Destructure setForegroundColor
  brushHardness, // Destructure hardness
  setBrushHardness, // Destructure hardness setter
  brushSmoothness, // Destructure smoothness
  setBrushSmoothness, // Destructure smoothness setter
  brushShape, // Destructure brushShape
  setBrushShape, // Destructure setBrushShape
  activeTool,
}: BrushOptionsProps) => {
  return (
    <div className="flex flex-col gap-4 p-2 bg-muted/50 rounded-md">
      <div className="grid gap-1.5">
        <Label htmlFor="brush-size" className="text-xs">Size</Label>
        <Slider
          id="brush-size"
          min={1}
          max={200}
          step={1}
          value={[brushSize]}
          onValueChange={([v]) => setBrushSize(v)}
          className="w-full"
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
          className="w-full"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="brush-hardness" className="text-xs">Hardness</Label>
        <Slider
          id="brush-hardness"
          min={0}
          max={100}
          step={1}
          value={[brushHardness]}
          onValueChange={([v]) => setBrushHardness(v)}
          className="w-full"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="brush-smoothness" className="text-xs">Smoothness</Label>
        <Slider
          id="brush-smoothness"
          min={0}
          max={100}
          step={1}
          value={[brushSmoothness]}
          onValueChange={([v]) => setBrushSmoothness(v)}
          className="w-full"
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs">Shape</Label>
        <ToggleGroup type="single" value={brushShape} onValueChange={(value: 'circle' | 'square') => setBrushShape(value)} className="justify-start">
          <ToggleGroupItem value="circle" aria-label="Circle brush">
            <Circle className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="square" aria-label="Square brush">
            <Square className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {activeTool === 'brush' && (
        <div className="grid gap-1.5">
          <Label htmlFor="brush-color" className="text-xs">Color</Label>
          <Input
            id="brush-color"
            type="color"
            className="p-1 h-8 w-full"
            value={foregroundColor} // Use foregroundColor
            onChange={(e) => setForegroundColor(e.target.value)} // Update foregroundColor
          />
        </div>
      )}
    </div>
  );
};