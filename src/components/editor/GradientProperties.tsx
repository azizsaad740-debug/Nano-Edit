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
import { Button } from "@/components/ui/button";
import { Plus, Minus, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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

  const handleStopChange = (index: number, newStop: number) => {
    const newStops = [...(layer.gradientStops || [])];
    newStops[index] = newStop / 100; // Convert to 0-1 range
    handleUpdate({ gradientStops: newStops });
  };

  const handleAddColor = () => {
    const newColors = [...(layer.gradientColors || ["#FFFFFF", "#000000"])];
    const newStops = [...(layer.gradientStops || [0, 1])];
    
    // Add a new color in the middle
    newColors.splice(newColors.length - 1, 0, "#808080"); // Grey color
    newStops.splice(newStops.length - 1, 0, 0.5); // Middle stop
    
    handleUpdate({ gradientColors: newColors, gradientStops: newStops });
    handleCommit();
  };

  const handleRemoveColor = (index: number) => {
    if ((layer.gradientColors?.length || 0) <= 2) return; // Must have at least two colors
    const newColors = (layer.gradientColors || []).filter((_, i) => i !== index);
    const newStops = (layer.gradientStops || []).filter((_, i) => i !== index);
    handleUpdate({ gradientColors: newColors, gradientStops: newStops });
    handleCommit();
  };

  const handleAngleChange = (newAngle: number) => {
    handleUpdate({ gradientAngle: newAngle });
  };

  const handleInvertChange = (inverted: boolean) => {
    handleUpdate({ gradientInverted: inverted });
    handleCommit();
  };

  const handleFeatherChange = (newFeather: number) => {
    handleUpdate({ gradientFeather: newFeather });
  };

  const handleFeatherCommit = () => {
    handleCommit();
  };

  const handleResetFeather = () => {
    handleUpdate({ gradientFeather: 0 });
    handleCommit();
  };

  const handleRadialCenterChange = (axis: 'x' | 'y', value: number) => {
    if (axis === 'x') handleUpdate({ gradientCenterX: value });
    else handleUpdate({ gradientCenterY: value });
  };

  const handleRadialRadiusChange = (value: number) => {
    handleUpdate({ gradientRadius: value });
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
            <SelectItem value="radial">Radial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Colors & Stops</Label>
        <div className="flex flex-col gap-2">
          {(layer.gradientColors || ["#FFFFFF", "#000000"]).map((color, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="color"
                className="p-1 h-10 w-12"
                value={color}
                onChange={(e) => handleColorChange(index, e.target.value)}
                onBlur={handleCommit}
              />
              <Slider
                min={0}
                max={100}
                step={1}
                value={[((layer.gradientStops?.[index] ?? index / ((layer.gradientColors?.length || 1) - 1)) * 100)]}
                onValueChange={([v]) => handleStopChange(index, v)}
                onValueCommit={handleCommit}
                className="flex-1"
              />
              <span className="w-10 text-right text-sm text-muted-foreground">{Math.round((layer.gradientStops?.[index] ?? index / ((layer.gradientColors?.length || 1) - 1)) * 100)}%</span>
              {index > 0 && index < (layer.gradientColors?.length || 0) - 1 && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveColor(index)}>
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={handleAddColor} className="mt-2">
            <Plus className="h-4 w-4 mr-2" /> Add Color Stop
          </Button>
        </div>
      </div>

      {layer.gradientType === 'linear' && (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="gradient-angle">Angle</Label>
            <span className="w-10 text-right text-sm text-muted-foreground">{layer.gradientAngle}°</span>
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

      {layer.gradientType === 'radial' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="gradient-center-x">Center X</Label>
                <span className="text-sm text-muted-foreground">{layer.gradientCenterX}%</span>
              </div>
              <Slider
                id="gradient-center-x"
                min={0}
                max={100}
                step={1}
                value={[layer.gradientCenterX || 50]}
                onValueChange={([v]) => handleRadialCenterChange('x', v)}
                onValueCommit={handleCommit}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="gradient-center-y">Center Y</Label>
                <span className="text-sm text-muted-foreground">{layer.gradientCenterY}%</span>
              </div>
              <Slider
                id="gradient-center-y"
                min={0}
                max={100}
                step={1}
                value={[layer.gradientCenterY || 50]}
                onValueChange={([v]) => handleRadialCenterChange('y', v)}
                onValueCommit={handleCommit}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="gradient-radius">Radius</Label>
              <span className="text-sm text-muted-foreground">{layer.gradientRadius}%</span>
            </div>
            <Slider
              id="gradient-radius"
              min={0}
              max={100}
              step={1}
              value={[layer.gradientRadius || 50]}
              onValueChange={([v]) => handleRadialRadiusChange(v)}
              onValueCommit={handleCommit}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label htmlFor="gradient-inverted">Invert</Label>
        <Switch
          id="gradient-inverted"
          checked={layer.gradientInverted}
          onCheckedChange={handleInvertChange}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="gradient-feather">Feather</Label>
          <div className="flex items-center gap-2">
            <span className="w-10 text-right text-sm text-muted-foreground">{layer.gradientFeather}%</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleResetFeather}>
              <RotateCcw className="h-3 w-3" />
              <span className="sr-only">Reset Feather</span>
            </Button>
          </div>
        </div>
        <Slider
          id="gradient-feather"
          min={0}
          max={100}
          step={1}
          value={[layer.gradientFeather || 0]}
          onValueChange={([v]) => handleFeatherChange(v)}
          onValueCommit={handleFeatherCommit}
        />
      </div>

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