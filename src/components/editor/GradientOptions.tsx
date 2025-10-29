"use client";

import * as React from "react";
import { Layer, GradientToolState, GradientLayerData } from "@/types/editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import GradientLayerProperties from "./GradientLayerProperties"; // Import the renamed component

interface GradientOptionsProps {
  layer: Layer;
  onLayerUpdate: (updates: Partial<Layer>) => void;
  onLayerCommit: (historyName: string) => void;
  gradientToolState: GradientToolState;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>;
  gradientPresets: { id: string; name: string; state: GradientToolState }[];
  onSaveGradientPreset: (name: string, state: GradientToolState) => void;
  onDeleteGradientPreset: (id: string) => void;
}

export const GradientOptions: React.FC<GradientOptionsProps> = ({
  layer,
  onLayerUpdate,
  onLayerCommit,
  // The following props are for tool defaults/presets, not layer editing, 
  // but we keep them in the interface for consistency if needed later.
  gradientToolState,
  setGradientToolState,
  gradientPresets,
  onSaveGradientPreset,
  onDeleteGradientPreset,
}) => {
  const isGradient = layer.type === 'gradient';

  if (!isGradient) return null;

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">Gradient Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <GradientLayerProperties
            layer={layer}
            onUpdate={onLayerUpdate}
            onCommit={onLayerCommit}
          />
        </CardContent>
      </Card>
    </div>
  );
};