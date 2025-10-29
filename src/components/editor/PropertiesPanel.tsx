"use client";

import * as React from "react";
import { TabsContent } from "@/components/ui/tabs";
import type { Layer, ActiveTool, BrushState, GradientToolState } from "@/types/editor";
import { TextOptions } from "./TextOptions";
import { AdjustmentOptions } from "./AdjustmentOptions";
import LayerGeneralProperties from "./LayerGeneralProperties";
import ShapeOptions from "./ShapeOptions";
import GradientOptions from "./GradientOptions";
import MaskProperties from "./MaskProperties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GradientPreset } from "@/hooks/useGradientPresets";

interface PropertiesPanelProps {
  selectedLayer: Layer | undefined;
  imgRef: React.RefObject<HTMLImageElement>;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string, historyName: string) => void;
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
  gradientToolState: GradientToolState;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>;
  gradientPresets: GradientPreset[];
  onSaveGradientPreset: (name: string, state: GradientToolState) => void;
  onDeleteGradientPreset: (name: string) => void;
  customHslColor: string;
  setCustomHslColor: (color: string) => void;
  onInvertLayerMask: (id: string) => void; // Added for MaskProperties usage
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = (props) => {
  const { selectedLayer, imgRef } = props;

  // Helper functions must be defined inside the component or passed as props
  const handleLayerUpdate = (updates: Partial<Layer>) => {
    if (selectedLayer) {
      props.onLayerUpdate(selectedLayer.id, updates);
    }
  };

  const handleLayerCommit = (historyName: string) => {
    if (selectedLayer) {
      props.onLayerCommit(selectedLayer.id, historyName);
    }
  };

  if (!selectedLayer) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Select a layer to view its properties.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* General Properties (Opacity, Blend Mode) */}
        <LayerGeneralProperties
          layer={selectedLayer}
          onUpdate={props.onLayerUpdate}
          onCommit={props.onLayerCommit}
        />

        {/* Text Options */}
        {selectedLayer.type === 'text' && (
          <TextOptions
            layer={selectedLayer}
            onLayerUpdate={handleLayerUpdate}
            onLayerCommit={handleLayerCommit}
            systemFonts={props.systemFonts}
            customFonts={props.customFonts}
            onOpenFontManager={props.onOpenFontManager}
          />
        )}

        {/* Shape Options */}
        {selectedLayer.type === 'vector-shape' && (
          <ShapeOptions
            layer={selectedLayer}
            onLayerUpdate={handleLayerUpdate}
            onLayerCommit={handleLayerCommit}
          />
        )}

        {/* Gradient Options */}
        {selectedLayer.type === 'gradient' && (
          <GradientOptions
            layer={selectedLayer}
            onLayerUpdate={handleLayerUpdate}
            onLayerCommit={handleLayerCommit}
            gradientToolState={props.gradientToolState}
            setGradientToolState={props.setGradientToolState}
            gradientPresets={props.gradientPresets}
            onSaveGradientPreset={props.onSaveGradientPreset}
            onDeleteGradientPreset={props.onDeleteGradientPreset}
          />
        )}

        {/* Adjustment Options */}
        {selectedLayer.type === 'adjustment' && (
          <AdjustmentOptions
            layer={selectedLayer}
            onLayerUpdate={handleLayerUpdate}
            onLayerCommit={handleLayerCommit}
            imgRef={imgRef}
            customHslColor={props.customHslColor}
            setCustomHslColor={props.setCustomHslColor}
          />
        )}

        {/* Mask Properties */}
        {selectedLayer.maskDataUrl && (
          <MaskProperties
            layer={selectedLayer}
            onRemoveMask={props.onRemoveLayerMask}
            onInvertMask={props.onInvertLayerMask}
            onLayerUpdate={handleLayerUpdate}
            onLayerCommit={handleLayerCommit}
          />
        )}
      </div>
    </ScrollArea>
  );
};