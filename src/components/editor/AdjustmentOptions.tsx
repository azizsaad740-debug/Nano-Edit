"use client";

import * as React from "react";
import type { Layer, EditState } from "@/types/editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdjustmentLayerControls } from "./AdjustmentLayerControls";
import { LayerGeneralProperties } from "./LayerGeneralProperties";
import type { AdjustmentLayerData } from "@/types/editor";

interface AdjustmentOptionsProps {
  layer: Layer;
  onLayerUpdate: (updates: Partial<Layer>) => void;
  onLayerCommit: (historyName: string) => void;
  imgRef: React.RefObject<HTMLImageElement>; // Required for Curves component
  customHslColor: string; // NEW
  setCustomHslColor: (color: string) => void; // NEW
  currentEditState: EditState; // ADDED
}

export const AdjustmentOptions: React.FC<AdjustmentOptionsProps> = ({
  layer,
  onLayerUpdate,
  onLayerCommit,
  imgRef,
  customHslColor,
  setCustomHslColor,
  currentEditState,
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
  const handleCommitById = (id: string, historyName: string) => {
    if (id === layer.id) {
      onLayerCommit(historyName);
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
            layer={layer as AdjustmentLayerData}
            onUpdate={onLayerUpdate}
            onCommit={onLayerCommit}
            imgRef={imgRef}
            customHslColor={customHslColor}
            setCustomHslColor={setCustomHslColor}
            currentEditState={currentEditState}
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