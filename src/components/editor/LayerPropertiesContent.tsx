"use client";

import * as React from "react";
import type { Layer, ActiveTool, BrushState, GradientToolState, EditState, HslAdjustment } from "@/types/editor";
import { TextOptions } from "./TextOptions";
import { AdjustmentOptions } from "./AdjustmentOptions";
import { LayerGeneralProperties } from "./LayerGeneralProperties";
import ShapeOptions from "./ShapeOptions";
import { GradientOptions } from "./GradientOptions";
import MaskProperties from "./MaskProperties";
import type { GradientPreset } from "@/hooks/useGradientPresets";

type HslColorKey = keyof EditState['hslAdjustments'];

interface LayerPropertiesContentProps {
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
  onRemoveLayerMask: (id: string) => void;
  onInvertLayerMask: (id: string) => void;
}

export const LayerPropertiesContent: React.FC<LayerPropertiesContentProps> = (props) => {
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

  if (!selectedLayer) return null;

  const isTextLayer = selectedLayer.type === 'text';
  const isShapeLayer = selectedLayer.type === 'vector-shape';
  const isGradientLayer = selectedLayer.type === 'gradient';
  const isAdjustmentLayer = selectedLayer.type === 'adjustment';
  const hasMask = !!selectedLayer.maskDataUrl;

  return (
    <div className="space-y-4">
      {/* General Properties (Opacity, Blend Mode, Fill) */}
      <LayerGeneralProperties
        layer={selectedLayer}
        onUpdate={props.onLayerUpdate}
        onCommit={props.onLayerCommit}
      />

      {isTextLayer && (
        <TextOptions
          layer={selectedLayer}
          onLayerUpdate={handleLayerUpdate}
          onLayerCommit={handleLayerCommit}
          systemFonts={props.systemFonts}
          customFonts={props.customFonts}
          onOpenFontManager={props.onOpenFontManager}
        />
      )}

      {isShapeLayer && (
        <ShapeOptions
          layer={selectedLayer}
          onLayerUpdate={handleLayerUpdate}
          onLayerCommit={handleLayerCommit}
        />
      )}

      {isGradientLayer && (
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

      {isAdjustmentLayer && (
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
      {hasMask && (
        <MaskProperties
          layer={selectedLayer}
          onRemoveMask={props.onRemoveLayerMask}
          onInvertMask={props.onInvertLayerMask}
          onLayerUpdate={handleLayerUpdate}
          onLayerCommit={handleLayerCommit}
        />
      )}
    </div>
  );
};