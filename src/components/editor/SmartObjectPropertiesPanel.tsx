import * as React from "react";
import type { Layer, GradientToolState, TextLayerData, VectorShapeLayerData, GradientLayerData } from "@/types/editor";
import { isTextLayer, isVectorShapeLayer, isGradientLayer } from "@/types/editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextOptions } from "./TextOptions";
import ShapeOptions from "./ShapeOptions";
import { GradientOptions } from "./GradientOptions";
import { LayerGeneralProperties } from "./LayerGeneralProperties";
import type { GradientPreset } from "@/hooks/useGradientPresets";
import { showError } from "@/utils/toast";

interface SmartObjectPropertiesPanelProps {
  selectedLayer: Layer;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string, historyName: string) => void; // Added historyName
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
  gradientToolState: GradientToolState;
  gradientPresets: GradientPreset[];
  onSaveGradientPreset: (name: string, state: GradientToolState) => void;
  onDeleteGradientPreset: (name: string) => void;
}

export const SmartObjectPropertiesPanel: React.FC<SmartObjectPropertiesPanelProps> = (props) => {
  const { selectedLayer, onLayerUpdate, onLayerCommit } = props;

  // Helper functions must be defined inside the component or passed as props
  const handleLayerUpdate = (updates: Partial<Layer>) => {
    onLayerUpdate(selectedLayer.id, updates);
  };

  const handleLayerCommit = (historyName: string) => {
    // Note: History is only recorded when saving the Smart Object, 
    // but we call onLayerCommit to trigger internal state updates if needed.
    onLayerCommit(selectedLayer.id, historyName);
  };

  const renderSpecificOptions = () => {
    if (isTextLayer(selectedLayer)) {
      return (
        <TextOptions
          layer={selectedLayer as TextLayerData}
          onLayerUpdate={handleLayerUpdate}
          onLayerCommit={handleLayerCommit}
          systemFonts={props.systemFonts}
          customFonts={props.customFonts}
          onOpenFontManager={props.onOpenFontManager}
        />
      );
    }

    if (isVectorShapeLayer(selectedLayer)) {
      return (
        <ShapeOptions
          layer={selectedLayer as VectorShapeLayerData}
          onLayerUpdate={handleLayerUpdate}
          onLayerCommit={handleLayerCommit}
        />
      );
    }

    if (isGradientLayer(selectedLayer)) {
      // Note: GradientOptions is designed to edit layer properties directly via GradientLayerProperties
      return (
        <GradientOptions
          layer={selectedLayer as GradientLayerData}
          onLayerUpdate={handleLayerUpdate}
          onLayerCommit={handleLayerCommit}
          // Pass tool state/presets as stubs since they are usually for the tool, not the layer itself
          gradientToolState={props.gradientToolState}
          setGradientToolState={() => {}} 
          gradientPresets={props.gradientPresets}
          onSaveGradientPreset={() => showError("Saving presets is disabled inside Smart Object Editor.")}
          onDeleteGradientPreset={() => showError("Deleting presets is disabled inside Smart Object Editor.")}
        />
      );
    }
    
    // Default message for other layer types (Image, Drawing, Smart Object, Group)
    return (
      <p className="text-sm text-muted-foreground">
        No specific properties available for this layer type inside the Smart Object Editor.
      </p>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">Layer Properties: {selectedLayer.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* General Properties (Opacity, Blend Mode) */}
          <LayerGeneralProperties
            layer={selectedLayer}
            onUpdate={onLayerUpdate}
            onCommit={onLayerCommit}
          />
          
          {/* Specific Properties */}
          {renderSpecificOptions()}
        </CardContent>
      </Card>
    </div>
  );
};