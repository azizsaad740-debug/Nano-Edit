"use client";

import * as React from "react";
import type { Layer } from "@/types/editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdjustmentLayerControls } from "./AdjustmentLayerControls";
import { LayerGeneralProperties } from "./LayerGeneralProperties";

interface AdjustmentOptionsProps {
  layer: Layer;
  onLayerUpdate: (updates: Partial<Layer>) => void;
  onLayerCommit: (historyName: string) => void;
  imgRef: React.RefObject<HTMLImageElement>; // Required for Curves component
  customHslColor: string; // NEW
  setCustomHslColor: (color: string) => void; // NEW
}

export const AdjustmentOptions: React.FC<AdjustmentOptionsProps> = ({
  layer,
  onLayerUpdate,
  onLayerCommit,
  imgRef,
  customHslColor,
  setCustomHslColor,
}) => {
  const isAdjustment = layer.type === 'adjustment';

  if (!isAdjustment) return null;

  // Helper to update the layer via ID, required by AdjustmentLayerControls
  const handleUpdateById = (id: string, updates: Partial<Layer>) => {
    if (id === layer.id) {
      onLayerUpdate(updates);
    }
  };

  // Helper to commit the layer via ID, required by AdjustmentLayerControls
  const handleCommitById = (id: string) => {
    if (id === layer.id) {
      onLayerCommit(`Edit Adjustment Layer: ${layer.name}`);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">Adjustment Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdjustmentLayerControls
            layer={layer as any} // Cast to any temporarily until full type resolution
            onUpdate={onLayerUpdate}
            onCommit={onLayerCommit}
            imgRef={imgRef}
            customHslColor={customHslColor}
            setCustomHslColor={setCustomHslColor}
          />
        </CardContent>
      </Card>
      
      {/* General Layer Properties (Opacity/Blend Mode) */}
      <LayerGeneralProperties
        layer={layer}
        onUpdate={handleUpdateById}
        onCommit={handleCommitById}
      />
    </div>
  );
};