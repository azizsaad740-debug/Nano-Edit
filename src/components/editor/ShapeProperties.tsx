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
import type { Layer, ShapeType } from "@/types/editor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash2 } from "lucide-react";
import { showError } from "@/utils/toast";

interface ShapePropertiesProps {
  layer: Layer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string, historyName: string) => void;
}

const ShapeProperties = ({ layer, onUpdate, onCommit }: ShapePropertiesProps) => {
  if (!layer || layer.type !== 'vector-shape') {
    return <p className="text-sm text-muted-foreground">Select a shape layer to edit its properties.</p>;
  }

  const handleUpdate = (updates: Partial<Layer>) => {
    onUpdate(layer.id, updates);
  };

  const handleCommit = (historyName: string) => {
    onCommit(layer.id, historyName);
  };

  const handleShapeTypeChange = (newShapeType: ShapeType) => {
    let updates: Partial<Layer> = { shapeType: newShapeType };
    if (newShapeType === 'triangle') {
      updates.points = [{x: 0, y: 100}, {x: 50, y: 0}, {x: 100, y: 100}]; // Default triangle points
      updates.borderRadius = 0;
    } else if (newShapeType === 'rect') {
      updates.points = undefined;
    } else if (newShapeType === 'circle') {
      updates.points = undefined;
      updates.borderRadius = undefined;
    } else if (newShapeType === 'polygon') {
      updates.points = layer.points || [{x: 20, y: 20}, {x: 80, y: 20}, {x: 80, y: 80}, {x: 20, y: 80}]; // Default square polygon
      updates.borderRadius = 0;
    }
    handleUpdate(updates);
    handleCommit(`Change Shape Type to ${newShapeType}`);
  };

  const convertToPolygon = () => {
    if (layer.shapeType === 'rect') {
      handleUpdate({ 
        shapeType: 'polygon', 
        points: [
          {x: 0, y: 0}, 
          {x: 100, y: 0}, 
          {x: 100, y: 100}, 
          {x: 0, y: 100}
        ],
        borderRadius: 0,
      });
      handleCommit("Convert Rectangle to Polygon");
    } else if (layer.shapeType === 'circle') {
      showError("Converting a circle to a polygon requires many points. Please use a rectangle as a starting point.");
    }
  };

  const addPoint = () => {
    if (layer.shapeType !== 'polygon' && layer.shapeType !== 'triangle') return;
    const points = layer.points || [];
    if (points.length < 2) return;

    // Add a point roughly in the middle of the last segment
    const last = points[points.length - 1];
    const first = points[0];
    const newPoint = { x: (last.x + first.x) / 2, y: (last.y + first.y) / 2 };
    
    const newPoints = [...points, newPoint];
    handleUpdate({ points: newPoints, shapeType: 'polygon' });
    handleCommit("Add Polygon Point");
  };

  const removeLastPoint = () => {
    if (layer.shapeType !== 'polygon' && layer.shapeType !== 'triangle') return;
    const points = layer.points || [];
    if (points.length <= 3) {
      showError("A polygon must have at least 3 points.");
      return;
    }
    const newPoints = points.slice(0, -1);
    handleUpdate({ points: newPoints });
    handleCommit("Remove Polygon Point");
  };

  const isPolygon = layer.shapeType === 'polygon' || layer.shapeType === 'triangle';

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
            <SelectItem value="polygon">Polygon</SelectItem>
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
            onBlur={() => handleCommit("Change Fill Color")}
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
            onBlur={() => handleCommit("Change Stroke Color")}
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
          onValueCommit={() => handleCommit("Change Stroke Width")}
        />
      </div>

      {layer.shapeType === 'rect' && (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="border-radius">Corner Radius</Label>
            <span className="text-sm text-muted-foreground">{layer.borderRadius}px</span>
          </div>
          <Slider
            id="border-radius"
            min={0}
            max={50}
            step={1}
            value={[layer.borderRadius || 0]}
            onValueChange={([v]) => handleUpdate({ borderRadius: v })}
            onValueCommit={() => handleCommit("Change Corner Radius")}
          />
        </div>
      )}
      
      <Accordion type="multiple" className="w-full pt-2 border-t" defaultValue={['dimensions']}>
        <AccordionItem value="path-editing">
          <AccordionTrigger>Path Editing</AccordionTrigger>
          <AccordionContent className="space-y-4">
            {!isPolygon ? (
              <Button variant="outline" className="w-full" onClick={convertToPolygon}>
                <Edit className="h-4 w-4 mr-2" /> Convert to Polygon for Point Editing
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Drag the points in the workspace to edit the path.</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={addPoint}>
                    <Plus className="h-4 w-4 mr-2" /> Add Point
                  </Button>
                  <Button variant="outline" onClick={removeLastPoint} disabled={(layer.points?.length || 0) <= 3}>
                    <Trash2 className="h-4 w-4 mr-2" /> Remove Last Point
                  </Button>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

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
                  onValueCommit={() => handleCommit("Change Width")}
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
                  onValueCommit={() => handleCommit("Change Height")}
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
                  onValueCommit={() => handleCommit("Change X Position")}
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
                  onValueCommit={() => handleCommit("Change Y Position")}
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
                onValueCommit={() => handleCommit("Change Rotation")}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ShapeProperties;