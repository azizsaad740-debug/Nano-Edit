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

interface ShapePropertiesProps {
  layer: Layer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
}

const ShapeProperties = ({ layer, onUpdate, onCommit }: ShapePropertiesProps) => {
  if (!layer || layer.type !== 'vector-shape') {
    return <p className="text-sm text-muted-foreground">Select a shape layer to edit its properties.</p>;
  }

  const handleUpdate = (updates: Partial<Layer>) => {
    onUpdate(layer.id, updates);
  };

  const handleCommit = () => {
    onCommit(layer.id);
  };

  const handleShapeTypeChange = (newShapeType: Layer['shapeType']) => {
    let updates: Partial<Layer> = { shapeType: newShapeType };
    if (newShapeType === 'triangle') {
      updates.points = [{x: 0, y: 100}, {x: 50, y: 0}, {x: 100, y: 100}]; // Default triangle points
      updates.borderRadius = 0;
    } else if (newShapeType === 'rect') {
      updates.points = undefined;
    } else if (newShapeType === 'circle') {
      updates.points = undefined;
      updates.borderRadius = undefined;
    }
    handleUpdate(updates);
    handleCommit();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="shape-type">Shape Type</Label>
        <Select
          value={layer.shapeType}
          onValueChange={handleShapeTypeChange}
        >
          <SelectTrigger id="shape-type">
            <SelectValue placeholder="Select shape type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rect">Rectangle</SelectItem>
            <SelectItem value="circle">Circle</SelectItem>
            <SelectItem value="triangle">Triangle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="fill-color">Fill Color</Label>
          <Input
            id="fill-color"
            type="color"
            className="p-1 h-10 w-12"
            value={layer.fillColor || "#000000"}
            onChange={(e) => handleUpdate({ fillColor: e.target.value })}
            onBlur={handleCommit}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="stroke-color">Stroke Color</Label>
          <Input
            id="stroke-color"
            type="color"
            className="p-1 h-10 w-12"
            value={layer.strokeColor || "#FFFFFF"}
            onChange={(e) => handleUpdate({ strokeColor: e.target.value })}
            onBlur={handleCommit}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="stroke-width">Stroke Width</Label>
          <span className="text-sm text-muted-foreground">{layer.strokeWidth}px</span>
        </div>
        <Slider
          id="stroke-width"
          min={0}
          max={20}
          step={0.5}
          value={[layer.strokeWidth || 0]}
          onValueChange={([v]) => handleUpdate({ strokeWidth: v })}
          onValueCommit={handleCommit}
        />
      </div>

      {layer.shapeType === 'rect' && (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="border-radius">Corner Radius</Label>
            <span className="text-sm text-muted-foreground">{layer.borderRadius}%</span>
          </div>
          <Slider
            id="border-radius"
            min={0}
            max={50}
            step={1}
            value={[layer.borderRadius || 0]}
            onValueChange={([v]) => handleUpdate({ borderRadius: v })}
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
                  value={[layer.width || 10]}
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
                  value={[layer.height || 10]}
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

export default ShapeProperties;