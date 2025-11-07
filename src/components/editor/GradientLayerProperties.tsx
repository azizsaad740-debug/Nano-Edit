"use client";

import * as React from "react";
import { Layer, GradientToolState, GradientLayerData } from "@/types/editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Minus, RotateCcw, ArrowDownUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface GradientLayerPropertiesProps {
  layer: GradientLayerData; // Use specific type
  onUpdate: (updates: Partial<GradientLayerData>) => void;
  onCommit: (historyName: string) => void;
}

const GradientLayerProperties: React.FC<GradientLayerPropertiesProps> = ({ layer, onUpdate, onCommit }) => {
  const handleUpdate = (updates: Partial<GradientLayerData>) => {
    onUpdate(updates);
  };

  const handleCommit = (historyName: string) => {
    onCommit(historyName);
  };

  const handleColorChange = (index: number, newColor: string) => {
    const newColors = [...(layer.gradientColors || [])];
    newColors[index] = newColor;
    handleUpdate({ gradientColors: newColors });
  };

  const handleStopChange = (index: number, newStop: number) => {
    const newStops = [...(layer.stops || [])];
    newStops[index] = newStop / 100; // Convert to 0-1 range
    handleUpdate({ stops: newStops });
  };

  const handleAddColor = () => {
    const newColors = [...(layer.gradientColors || ["#FFFFFF", "#000000"])];
    const newStops = [...(layer.stops || [0, 1])];
    
    // Add a new color in the middle
    newColors.splice(newColors.length - 1, 0, "#808080"); // Grey color
    newStops.splice(newStops.length - 1, 0, 0.5); // Middle stop
    
    handleUpdate({ gradientColors: newColors, stops: newStops });
    handleCommit("Add Gradient Color Stop");
  };

  const handleRemoveColor = (index: number) => {
    if ((layer.gradientColors?.length || 0) <= 2) return; // Must have at least two colors
    const newColors = (layer.gradientColors || []).filter((_, i) => i !== index);
    const newStops = (layer.stops || []).filter((_, i) => i !== index);
    handleUpdate({ gradientColors: newColors, stops: newStops });
    handleCommit("Remove Gradient Color Stop");
  };

  const handleResetFeather = () => {
    handleUpdate({ gradientFeather: 0 });
    handleCommit("Reset Gradient Feather");
  };
  
  const handleInvert = () => {
    handleUpdate({ gradientInverted: !layer.gradientInverted });
    handleCommit("Invert Gradient");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="gradient-type">Gradient Type</Label>
        <Select
          value={layer.gradientType}
          onValueChange={(v) => {
            handleUpdate({ gradientType: v as GradientLayerData['gradientType'] });
            handleCommit(`Change Gradient Type to ${v}`);
          }}
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
                value={[((layer.stops?.[index] ?? index / ((layer.gradientColors?.length || 1) - 1)) * 100)]}
                onValueChange={([v]) => handleStopChange(index, v)}
                onValueCommit={() => handleCommit("Change Gradient Stop")}
                className="flex-1"
              />
              <span className="w-10 text-right text-sm text-muted-foreground">{Math.round((layer.stops?.[index] ?? index / ((layer.gradientColors?.length || 1) - 1)) * 100)}%</span>
              {index > 0 && index < (layer.gradientColors?.length || 0) - 1 && (
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleRemoveColor(index)}>
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
            onValueChange={([v]) => handleUpdate({ gradientAngle: v })}
            onValueCommit={([v]) => handleCommit(`Set Gradient Angle to ${v}°`)}
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
                onValueChange={([v]) => handleUpdate({ gradientCenterX: v })}
                onValueCommit={([v]) => handleCommit(`Set Gradient Center X to ${v}%`)}
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
                onValueChange={([v]) => handleUpdate({ gradientCenterY: v })}
                onValueCommit={([v]) => handleCommit(`Set Gradient Center Y to ${v}%`)}
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
              onValueChange={([v]) => handleUpdate({ gradientRadius: v })}
              onValueCommit={([v]) => handleCommit(`Set Gradient Radius to ${v}%`)}
            />
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-2 border-t">
        <Label htmlFor="gradient-inverted">Invert</Label>
        <Button variant="outline" size="sm" onClick={handleInvert}>
          <ArrowDownUp className="h-4 w-4 mr-2" />
          {layer.gradientInverted ? "Inverted" : "Normal"}
        </Button>
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
          onValueChange={([v]) => handleUpdate({ gradientFeather: v })}
          onValueCommit={([v]) => handleCommit(`Set Gradient Feather to ${v}%`)}
        />
      </div>
    </div>
  );
};

export default GradientLayerProperties;