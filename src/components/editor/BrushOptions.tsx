"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import { Separator } from "@/components/ui/separator";
import type { BlendMode } from "@/types/editor";

interface BrushOptionsProps {
  activeTool: "brush" | "eraser" | "pencil";
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
  // NEW PROPERTIES
  brushFlow: number;
  setBrushFlow: (flow: number) => void;
  brushAngle: number;
  setBrushAngle: (angle: number) => void;
  brushRoundness: number;
  setBrushRoundness: (roundness: number) => void;
  brushSpacing: number;
  setBrushSpacing: (spacing: number) => void;
  brushBlendMode: string;
  setBrushBlendMode: (blendMode: string) => void;
}

const blendModes = [
  "normal", "multiply", "screen", "overlay", "darken", "lighten", 
  "color-dodge", "color-burn", "hard-light", "soft-light", "difference", 
  "exclusion", "hue", "saturation", "color", "luminosity"
];

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
  brushFlow,
  setBrushFlow,
  brushAngle,
  setBrushAngle,
  brushRoundness,
  setBrushRoundness,
  brushSpacing,
  setBrushSpacing,
  brushBlendMode,
  setBrushBlendMode,
}) => {
  const isPencil = activeTool === 'pencil';
  const isEraser = activeTool === 'eraser';

  return (
    <div className="space-y-4">
      {/* Size */}
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
      
      {/* Opacity */}
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
      
      {/* Flow (Only for Brush/Eraser, not Pencil) */}
      {!isPencil && (
        <div className="space-y-1">
          <Label>Flow ({brushFlow}%)</Label>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[brushFlow]}
            onValueChange={([value]) => setBrushFlow(value)}
          />
        </div>
      )}

      {/* Hardness (Not for Pencil) */}
      {!isPencil && (
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
      )}
      
      {/* Smoothness */}
      <div className="space-y-1">
        <Label>Smoothness ({brushSmoothness}%)</Label>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[brushSmoothness]}
          onValueChange={([value]) => setBrushSmoothness(value)}
        />
      </div>

      {/* Shape */}
      <div className="space-y-1">
        <Label>Shape</Label>
        <Select
          value={brushShape}
          onValueChange={(value) => setBrushShape(value as 'circle' | 'square')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select shape" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="circle">Circle</SelectItem>
            <SelectItem value="square">Square</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Angle & Roundness (Advanced Brush Dynamics) */}
      {!isPencil && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Angle ({brushAngle}°)</Label>
            <Slider
              min={0}
              max={360}
              step={1}
              value={[brushAngle]}
              onValueChange={([value]) => setBrushAngle(value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Roundness ({brushRoundness}%)</Label>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[brushRoundness]}
              onValueChange={([value]) => setBrushRoundness(value)}
            />
          </div>
        </div>
      )}
      
      {/* Spacing */}
      {!isPencil && (
        <div className="space-y-1">
          <Label>Spacing ({brushSpacing}%)</Label>
          <Slider
            min={1}
            max={100}
            step={1}
            value={[brushSpacing]}
            onValueChange={([value]) => setBrushSpacing(value)}
          />
        </div>
      )}

      {/* Blend Mode */}
      <div className="space-y-1">
        <Label>Blend Mode</Label>
        <Select
          value={brushBlendMode}
          onValueChange={(value) => setBrushBlendMode(value as BlendMode)} // Fixed casting
        >
          <SelectTrigger>
            <SelectValue placeholder="Normal" />
          </SelectTrigger>
          <SelectContent>
            {blendModes.map(mode => (
              <SelectItem key={mode} value={mode} className="capitalize">{mode}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Color / Eraser Mode */}
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
      
      {isEraser && (
        <div className="space-y-1 pt-2 border-t">
          <Label>Eraser Mode (Stub)</Label>
          <Select defaultValue="brush">
            <SelectTrigger>
              <SelectValue placeholder="Brush" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brush">Brush</SelectItem>
              <SelectItem value="pencil">Pencil</SelectItem>
              <SelectItem value="block">Block</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Pressure Sensitivity Stub */}
      <div className="space-y-1 pt-2 border-t">
        <Label className="text-sm font-medium text-muted-foreground">Pressure Sensitivity (Stub)</Label>
        <p className="text-xs text-muted-foreground">
          Pressure mapping for size/opacity is not yet implemented.
        </p>
      </div>
    </div>
  );
};