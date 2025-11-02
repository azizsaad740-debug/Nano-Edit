"use client";

import * as React from "react";
import type { Layer, GradientToolState } from "@/types/editor";
import { TextOptions } from "./TextOptions";
import { LayerGeneralProperties } from "./LayerGeneralProperties";
import ShapeOptions from "./ShapeOptions";
import { GradientOptions } from "./GradientOptions";
import MaskProperties from "./MaskProperties";
import { Separator } from "@/components/ui/separator";

interface SmartObjectLayerPropertiesProps {
  selectedLayer: Layer | undefined;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string) => void;
  // Stubs for required props in nested components
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
  gradientToolState: GradientToolState;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>;
  onRemoveLayerMask: (id: string) => void;
  onInvertLayerMask: (id: string) => void;
}

export const SmartObjectLayerProperties: React.FC<SmartObjectLayerPropertiesProps> = (props) => {
  const { selectedLayer } = props;

  if (!selectedLayer) {
    return <p className="text-sm text-muted-foreground p-4">Select a layer to view its properties.</p>;
  }

  // Helper functions tailored for the Smart Object context (no history name needed here)
  const handleUpdate = (updates: Partial<Layer>) => {
    props.onLayerUpdate(selectedLayer.id, updates);
  };

  const handleCommit = () => {
    props.onLayerCommit(selectedLayer.id);
  };
  
  // Helper for nested components that require a history name (we stub it here)
  const handleCommitWithName = (historyName: string) => {
    props.onLayerCommit(selectedLayer.id);
  };

  const isTextLayer = selectedLayer.type === 'text';
  const isShapeLayer = selectedLayer.type === 'vector-shape';
  const isGradientLayer = selectedLayer.type === 'gradient';
  const hasMask = !!selectedLayer.maskDataUrl;

  return (
    <div className="space-y-4">
      {/* General Properties (Opacity, Blend Mode) */}
      <LayerGeneralProperties
        layer={selectedLayer}
        onUpdate={props.onLayerUpdate}
        onCommit={props.onLayerCommit}
      />
      
      <Separator />

      {isTextLayer && (
        <TextOptions
          layer={selectedLayer}
          onLayerUpdate={handleUpdate}
          onLayerCommit={handleCommitWithName}
          systemFonts={props.systemFonts}
          customFonts={props.customFonts}
          onOpenFontManager={props.onOpenFontManager}
        />
      )}

      {isShapeLayer && (
        <ShapeOptions
          layer={selectedLayer}
          onLayerUpdate={handleUpdate}
          onLayerCommit={handleCommitWithName}
        />
      )}

      {isGradientLayer && (
        <GradientOptions
          layer={selectedLayer}
          onLayerUpdate={handleUpdate}
          onLayerCommit={handleCommitWithName}
          // Pass stubs for gradient presets as they are global, not SO specific
          gradientToolState={props.gradientToolState}
          setGradientToolState={props.setGradientToolState}
          gradientPresets={[]}
          onSaveGradientPreset={() => {}}
          onDeleteGradientPreset={() => {}}
        />
      )}

      {/* Mask Properties */}
      {hasMask && (
        <MaskProperties
          layer={selectedLayer}
          onRemoveMask={props.onRemoveLayerMask}
          onInvertMask={props.onInvertLayerMask}
          onLayerUpdate={handleUpdate}
          onLayerCommit={handleCommitWithName}
        />
      )}
      
      {/* Note: Adjustment layers are not typically nested inside Smart Objects, 
          but if they were, AdjustmentOptions would be included here. */}
    </div>
  );
};