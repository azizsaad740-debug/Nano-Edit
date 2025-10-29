"use client";

import * as React from "react";
import { Layer } from "@/types/editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash2, RotateCcw } from "lucide-react";
import { showError } from "@/utils/toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { ShapeType, VectorShapeLayerData } from "@/types/editor";

interface ShapeOptionsProps {
  layer: Layer;
  onLayerUpdate: (updates: Partial<Layer>) => void;
  onLayerCommit: (historyName: string) => void;
}

const ShapeOptions: React.FC<ShapeOptionsProps> = ({ layer, onLayerUpdate, onLayerCommit }) => {
  if (!layer || layer.type !== 'vector-shape') {
    return null;
  }

  const shapeLayer = layer as VectorShapeLayerData;

  const handleUpdate = (updates: Partial<VectorShapeLayerData>) => {
    onLayerUpdate(updates);
  };

  const handleCommit = (historyName: string) => {
    onLayerCommit(historyName);
  };

  const handleShapeTypeChange = (newShapeType: ShapeType) => {
    let updates: Partial<VectorShapeLayerData> = { shapeType: newShapeType };
    
    // Reset specific properties based on new type
    updates.borderRadius = undefined;
    updates.starPoints = undefined;
    updates.lineThickness = undefined;
    updates.points = undefined;

    if (newShapeType === 'triangle') {
      updates.points = [{x: 0, y: 100}, {x: 50, y: 0}, {x: 100, y: 100}];
    } else if (newShapeType === 'star') {
      updates.starPoints = 5;
    } else if (newShapeType === 'line' || newShapeType === 'arrow') {
      updates.lineThickness = 5;
      updates.fillColor = 'none';
      updates.strokeWidth = 2;
    } else if (newShapeType === 'custom' || newShapeType === 'polygon') {
      updates.points = shapeLayer.points || [{x: 20, y: 20}, {x: 80, y: 20}, {x: 80, y: 80}, {x: 20, y: 80}];
    }
    
    handleUpdate(updates);
    handleCommit(`Change Shape Type to ${newShapeType}`);
  };

  const convertToPolygon = () => {
    if (shapeLayer.shapeType === 'rect') {
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
    } else if (shapeLayer.shapeType === 'circle') {
      showError("Converting a circle to a polygon requires many points. Please use a rectangle as a starting point.");
    }
  };

  const addPoint = () => {
    if (shapeLayer.shapeType !== 'polygon' && shapeLayer.shapeType !== 'triangle' && shapeLayer.shapeType !== 'custom') return;
    const points = shapeLayer.points || [];
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
    if (shapeLayer.shapeType !== 'polygon' && shapeLayer.shapeType !== 'triangle' && shapeLayer.shapeType !== 'custom') return;
    const points = shapeLayer.points || [];
    if (points.length <= 3) {
      showError("A polygon must have at least 3 points.");
      return;
    }
    const newPoints = points.slice(0, -1);
    handleUpdate({ points: newPoints });
    handleCommit("Remove Polygon Point");
  };

  const isPolygonEditable = shapeLayer.shapeType === 'polygon' || shapeLayer.shapeType === 'triangle' || shapeLayer.shapeType === 'custom';
  const isLineShape = shapeLayer.shapeType === 'line' || shapeLayer.shapeType === 'arrow';
  const isFillable = !isLineShape;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Shape Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="shape-type">Shape Type</Label>
          <Select
            value={shapeLayer.shapeType}
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
              <SelectItem value="star">Star</SelectItem>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="arrow">Arrow</SelectItem>
              <SelectItem value="custom">Custom Path</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fill and Stroke Colors */}
        <div className="grid grid-cols-2 gap-4">
          {isFillable && (
            <div className="grid gap-2">
              <Label htmlFor="fill-color">Fill Color</Label>
              <Input
                id="fill-color"
                type="color"
                className="p-1 h-10 w-12"
                value={shapeLayer.fillColor || "#000000"}
                onChange={(e) => handleUpdate({ fillColor: e.target.value })}
                onBlur={() => handleCommit("Change Fill Color")}
              />
            </div>
          )}
          <div className={isFillable ? "grid gap-2" : "col-span-2 grid gap-2"}>
            <Label htmlFor="stroke-color">Stroke Color</Label>
            <Input
              id="stroke-color"
              type="color"
              className="p-1 h-10 w-12"
              value={shapeLayer.strokeColor || "#FFFFFF"}
              onChange={(e) => handleUpdate({ strokeColor: e.target.value })}
              onBlur={() => handleCommit("Change Stroke Color")}
            />
          </div>
        </div>

        {/* Stroke Width */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="stroke-width">Stroke Width</Label>
            <span className="text-sm text-muted-foreground">{shapeLayer.strokeWidth}px</span>
          </div>
          <Slider
            id="stroke-width"
            min={0}
            max={20}
            step={0.5}
            value={[shapeLayer.strokeWidth || 0]}
            onValueChange={([v]) => handleUpdate({ strokeWidth: v })}
            onValueCommit={() => handleCommit("Change Stroke Width")}
          />
        </div>

        {/* Shape Specific Controls */}
        {shapeLayer.shapeType === 'rect' && (
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="border-radius">Corner Radius</Label>
              <span className="text-sm text-muted-foreground">{shapeLayer.borderRadius}px</span>
            </div>
            <Slider
              id="border-radius"
              min={0}
              max={50}
              step={1}
              value={[shapeLayer.borderRadius || 0]}
              onValueChange={([v]) => handleUpdate({ borderRadius: v })}
              onValueCommit={() => handleCommit("Change Corner Radius")}
            />
          </div>
        )}
        
        {shapeLayer.shapeType === 'star' && (
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="star-points">Star Points</Label>
              <span className="text-sm text-muted-foreground">{shapeLayer.starPoints}</span>
            </div>
            <Slider
              id="star-points"
              min={3}
              max={20}
              step={1}
              value={[shapeLayer.starPoints || 5]}
              onValueChange={([v]) => handleUpdate({ starPoints: v })}
              onValueCommit={() => handleCommit("Change Star Points")}
            />
          </div>
        )}

        {isLineShape && (
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="line-thickness">Line Thickness</Label>
              <span className="text-sm text-muted-foreground">{shapeLayer.lineThickness}px</span>
            </div>
            <Slider
              id="line-thickness"
              min={1}
              max={50}
              step={1}
              value={[shapeLayer.lineThickness || 5]}
              onValueChange={([v]) => handleUpdate({ lineThickness: v })}
              onValueCommit={() => handleCommit("Change Line Thickness")}
            />
          </div>
        )}

        {/* Path Editing / Custom Shape */}
        <Accordion type="single" collapsible className="w-full pt-2 border-t">
          <AccordionItem value="path-editing">
            <AccordionTrigger>Path Editing</AccordionTrigger>
            <AccordionContent className="space-y-4">
              {!isPolygonEditable ? (
                <Button variant="outline" className="w-full" onClick={convertToPolygon} disabled={shapeLayer.shapeType === 'circle'}>
                  <Edit className="h-4 w-4 mr-2" /> Convert to Polygon for Point Editing
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Drag the points in the workspace to edit the path.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={addPoint}>
                      <Plus className="h-4 w-4 mr-2" /> Add Point
                    </Button>
                    <Button variant="outline" onClick={removeLastPoint} disabled={(shapeLayer.points?.length || 0) <= 3}>
                      <Trash2 className="h-4 w-4 mr-2" /> Remove Last Point
                    </Button>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Dimensions & Position (Copied from ShapeProperties.tsx) */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="dimensions">
            <AccordionTrigger>Dimensions & Position</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="width">Width</Label>
                    <span className="text-sm text-muted-foreground">{shapeLayer.width?.toFixed(1)}%</span>
                  </div>
                  <Slider
                    id="width"
                    min={1}
                    max={100}
                    step={0.1}
                    value={[shapeLayer.width || 10]}
                    onValueChange={([v]) => handleUpdate({ width: v })}
                    onValueCommit={() => handleCommit("Change Width")}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="height">Height</Label>
                    <span className="text-sm text-muted-foreground">{shapeLayer.height?.toFixed(1)}%</span>
                  </div>
                  <Slider
                    id="height"
                    min={1}
                    max={100}
                    step={0.1}
                    value={[shapeLayer.height || 10]}
                    onValueChange={([v]) => handleUpdate({ height: v })}
                    onValueCommit={() => handleCommit("Change Height")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="x-pos">X Position</Label>
                    <span className="text-sm text-muted-foreground">{shapeLayer.x?.toFixed(1)}%</span>
                  </div>
                  <Slider
                    id="x-pos"
                    min={0}
                    max={100}
                    step={0.1}
                    value={[shapeLayer.x || 50]}
                    onValueChange={([v]) => handleUpdate({ x: v })}
                    onValueCommit={() => handleCommit("Change X Position")}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="y-pos">Y Position</Label>
                    <span className="text-sm text-muted-foreground">{shapeLayer.y?.toFixed(1)}%</span>
                  </div>
                  <Slider
                    id="y-pos"
                    min={0}
                    max={100}
                    step={0.1}
                    value={[shapeLayer.y || 50]}
                    onValueChange={([v]) => handleUpdate({ y: v })}
                    onValueCommit={() => handleCommit("Change Y Position")}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rotation">Rotation</Label>
                  <span className="text-sm text-muted-foreground">{shapeLayer.rotation}°</span>
                </div>
                <Slider
                  id="rotation"
                  min={-180}
                  max={180}
                  step={1}
                  value={[shapeLayer.rotation || 0]}
                  onValueChange={([v]) => handleUpdate({ rotation: v })}
                  onValueCommit={() => handleCommit("Change Rotation")}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ShapeOptions;