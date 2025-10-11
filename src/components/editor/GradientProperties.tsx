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
import type { Layer } from "@/hooks/useEditorState";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface GradientPropertiesProps {
  layer: Layer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
}

const GradientProperties = ({ layer, onUpdate, onCommit }: GradientPropertiesProps) => {
  if (!layer || layer.type !== 'gradient') {
    return <p className="text-sm text-muted-foreground">Select a gradient layer to edit its properties.</p>;
  }

  const handleUpdate = (updates: Partial<Layer>) => {
    onUpdate(layer.id, updates);
  };

  const handleCommit = () => {
    onCommit(layer.id);
  };

  const handleGradientTypeChange = (newType: Layer['gradientType']) => {
    handleUpdate({ gradientType: newType });
    handleCommit();
  };

  const handleColorChange = (index: number, newColor: string) => {
    const newColors = [...(layer.gradientColors || [])];
    newColors[index] = newColor;
    handleUpdate({ gradientColors: newColors });
  };

  const handleAngleChange = (newAngle: number) => {
    handleUpdate({ gradientAngle: newAngle });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="gradient-type">Gradient Type</Label>
        <Select
          value={layer.gradientType}
          onValueChange={handleGradientTypeChange}
        >
          <SelectTrigger id="gradient-type">
            <SelectValue placeholder="Select gradient type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear</SelectItem>
            <SelectItem value="radial">Radial (Coming Soon)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Colors</Label>
        <div className="flex items-center gap-2">
          {(layer.gradientColors || ["#FFFFFF", "#000000"]).map((color, index) => (
            <Input
              key={index}
              type="color"
              className="p-1 h-10 w-12"
              value={color}
              onChange={(e) => handleColorChange(index, e.target.value)}
              onBlur={handleCommit}
            />
          ))}
        </div>
      </div>

      {layer.gradientType === 'linear' && (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="gradient-angle">Angle</Label>
            <span className="text-sm text-muted-foreground">{layer.gradientAngle}°</span>
          </div>
          <Slider
            id="gradient-angle"
            min={0}
            max={360}
            step={1}
            value={[layer.gradientAngle || 90]}
            onValueChange={([v]) => handleAngleChange(v)}
            onValueCommit={handleCommit}
          />
        </div>
      )}

      <Accordion type="multiple" className="w-full pt-2 border-t">
        <AccordionItem value="dimensions">
          <AccordionTrigger>Dimensions & Position</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="width">Width</Label>
                  <span className="text-sm text-muted-foreground">{layer.width?.toFixed(1)}%</span>
                </div>
                <Slider
                  id="width"
                  min={1}
                  max={100}
                  step={0.1}
                  value={[layer.width || 100]}
                  onValueChange={([v]) => handleUpdate({ width: v })}
                  onValueCommit={handleCommit}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="height">Height</Label>
                  <span className="text-sm text-muted-foreground">{layer.height?.toFixed(1)}%</span>
                </div>
                <Slider
                  id="height"
                  min={1}
                  max={100}
                  step={0.1}
                  value={[layer.height || 100]}
                  onValueChange={([v]) => handleUpdate({ height: v })}
                  onValueCommit={handleCommit}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="x-pos">X Position</Label>
                  <span className="text-sm text-muted-foreground">{layer.x?.toFixed(1)}%</span>
                </div>
                <Slider
                  id="x-pos"
                  min={0}
                  max={100}
                  step={0.1}
                  value={[layer.x || 50]}
                  onValueChange={([v]) => handleUpdate({ x: v })}
                  onValueCommit={handleCommit}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="y-pos">Y Position</Label>
                  <span className="text-sm text-muted-foreground">{layer.y?.toFixed(1)}%</span>
                </div>
                <Slider
                  id="y-pos"
                  min={0}
                  max={100}
                  step={0.1}
                  value={[layer.y || 50]}
                  onValueChange={([v]) => handleUpdate({ y: v })}
                  onValueCommit={handleCommit}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rotation">Rotation</Label>
                <span className="text-sm text-muted-foreground">{layer.rotation}°</span>
              </div>
              <Slider
                id="rotation"
                min={-180}
                max={180}
                step={1}
                value={[layer.rotation || 0]}
                onValueChange={([v]) => handleUpdate({ rotation: v })}
                onValueCommit={handleCommit}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default GradientProperties;