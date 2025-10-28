"use client";

import * as React from "react";
import { Layer } from "@/types/editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ShapeOptionsProps {
  layer: Layer;
  onLayerUpdate: (updates: Partial<Layer>) => void;
  onLayerCommit: (historyName: string) => void;
}

export const ShapeOptions: React.FC<ShapeOptionsProps> = ({
  layer,
  onLayerUpdate,
  onLayerCommit,
}) => {
  // Assuming layer is a ShapeLayerData type for actual implementation
  const isShape = layer.type === 'vector-shape';

  if (!isShape) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Shape Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="fillColor">Fill Color</Label>
          <Input id="fillColor" type="color" value={(layer as any).fillColor || '#000000'} disabled />
        </div>
        <div className="space-y-1">
          <Label htmlFor="strokeWidth">Stroke Width</Label>
          <Input id="strokeWidth" type="number" value={(layer as any).strokeWidth || 0} disabled />
        </div>
      </CardContent>
    </Card>
  );
};