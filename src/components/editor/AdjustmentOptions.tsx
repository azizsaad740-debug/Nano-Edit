"use client";

import * as React from "react";
import { Layer } from "@/types/editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface AdjustmentOptionsProps {
  layer: Layer;
  onLayerUpdate: (updates: Partial<Layer>) => void;
  onLayerCommit: (historyName: string) => void;
  onLayerPropertyCommit: (historyName: string) => void;
}

export const AdjustmentOptions: React.FC<AdjustmentOptionsProps> = ({
  layer,
  onLayerUpdate,
  onLayerCommit,
  onLayerPropertyCommit,
}) => {
  const isAdjustment = layer.type === 'adjustment';

  if (!isAdjustment) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Adjustment Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>Brightness</Label>
          <Slider min={-100} max={100} step={1} value={[0]} disabled />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Controls for the specific adjustment type will appear here.
        </p>
      </CardContent>
    </Card>
  );
};