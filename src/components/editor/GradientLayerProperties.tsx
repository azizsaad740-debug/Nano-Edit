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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Plus, Minus, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface GradientLayerPropertiesProps {
  layer: Layer;
  onUpdate: (updates: Partial<Layer>) => void;
  onCommit: (historyName: string) => void;
}

const GradientLayerProperties = ({ layer, onUpdate, onCommit }: GradientLayerPropertiesProps) => {
  if (!layer || layer.type !== 'gradient') {
    return <p className="text-sm text-muted-foreground">Select a gradient layer to edit its properties.</p>;
  }

  const handleUpdate = (updates: Partial<Layer>) => {
    onUpdate(updates);
  };

  const handleCommit = (name: string) => {
    onCommit(name);
  };

  const handleGradientTypeChange = (newType: Layer['gradientType']) => {
    handleUpdate({ gradientType: newType });
    handleCommit(`Change Gradient Type to ${newType}`);
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
    handleCommit("Add Gradient Color Stop");
  };

  const handleRemoveColor = (index: number) => {
    if ((layer.gradientColors?.length || 0) <= 2) return; // Must have at least two colors
    const newColors = (layer.gradientColors || []).filter((_, i) => i !== index);
    const newStops = (layer.gradientStops || []).filter((_, i) => i !== index);
    handleUpdate({ gradientColors: newColors, gradientStops: newStops });
    handleCommit("Remove Gradient Color Stop");
  };

  const handleAngleChange = (newAngle: number) => {
    handleUpdate({ gradientAngle: newAngle });
  };

  const handleAngleCommit = (newAngle: number) => {
    handleCommit(`Set Gradient Angle to ${newAngle}°`);
  };

  const handleInvertChange = (inverted: boolean) => {
    handleUpdate({ gradientInverted: inverted });
    handleCommit(inverted ? "Invert Gradient" : "Uninvert Gradient");
  };

  const handleFeatherChange = (newFeather: number) => {
    handleUpdate({ gradientFeather: newFeather });
  };

  const handleFeatherCommit = (newFeather: number) => {
    handleCommit(`Set Gradient Feather to ${newFeather}%`);
  };

  const handleResetFeather = () => {
    handleUpdate({ gradientFeather: 0 });
    handleCommit("Reset Gradient Feather");
  };

  const handleRadialCenterChange = (axis: 'x' | 'y', value: number) => {
    if (axis === 'x') handleUpdate({ gradientCenterX: value });
    else handleUpdate({ gradientCenterY: value });
  };

  const handleRadialCenterCommit = (axis: 'x' | 'y', value: number) => {
    handleCommit(`Set Radial Center ${axis.toUpperCase()} to ${value}%`);
  };

  const handleRadialRadiusChange = (value: number) => {
    handleUpdate({ gradientRadius: value });
  };

  const handleRadialRadiusCommit = (value: number) => {
    handleCommit(`Set Radial Radius to ${value}%`);
  };

  const handleDimensionChange = (key: 'width' | 'height' | 'x' | 'y' | 'rotation', value: number) => {
    handleUpdate({ [key]: value });
  };

  const handleDimensionCommit = (key: 'width' | 'height' | 'x' | 'y' | 'rotation', value: number) => {
    handleCommit(`Change Layer ${key}`);
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
                onBlur={() => handleCommit("Change Gradient Color")}
              />
              <Slider
                min={0}
                max={100}
                step={1}
                value={[((layer.gradientStops?.[index] ?? index / ((layer.gradientColors?.length || 1) - 1)) * 100)]}
                onValueChange={([v]) => handleStopChange(index, v)}
                onValueCommit={() => handleCommit("Change Gradient Stop Position")}
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
            onValueCommit={([v]) => handleAngleCommit(v)}
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
                onValueCommit={([v]) => handleRadialCenterCommit('x', v)}
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
                onValueCommit={([v]) => handleRadialCenterCommit('y', v)}
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
              onValueCommit={([v]) => handleRadialRadiusCommit(v)}
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
          onValueCommit={([v]) => handleFeatherCommit(v)}
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
                  onValueChange={([v]) => handleDimensionChange("width", v)}
                  onValueCommit={([v]) => handleDimensionCommit("width", v)}
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
                  onValueChange={([v]) => handleDimensionChange("height", v)}
                  onValueCommit={([v]) => handleDimensionCommit("height", v)}
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
                  onValueChange={([v]) => handleDimensionChange("x", v)}
                  onValueCommit={([v]) => handleDimensionCommit("x", v)}
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
                  onValueChange={([v]) => handleDimensionChange("y", v)}
                  onValueCommit={([v]) => handleDimensionCommit("y", v)}
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
                onValueChange={([v]) => handleDimensionChange("rotation", v)}
                onValueCommit={([v]) => handleDimensionCommit("rotation", v)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default GradientLayerProperties;