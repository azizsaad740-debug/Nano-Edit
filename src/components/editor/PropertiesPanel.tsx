"use client";

import * as React from "react";
import { TabsContent } from "@/components/ui/tabs"; // FIX 56, 64
import type { Layer, ActiveTool, BrushState, GradientToolState } from "@/types/editor";
import { TextOptions } from "./TextOptions";
import { AdjustmentOptions } from "./AdjustmentOptions"; // FIX 57
// ... (other imports)

// Assuming PropertiesPanel is a functional component:
interface PropertiesPanelProps {
  // ... (all existing props)
  customHslColor: string; // Added in previous turn
  setCustomHslColor: (color: string) => void; // Added in previous turn
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

  // ... (rest of the component logic)

  // ... (around line 231)
  {selectedLayer?.type === 'adjustment' && (
    <TabsContent value="adjustment" className="mt-4">
        <AdjustmentOptions
            layer={selectedLayer} // FIX 58
            onLayerUpdate={handleLayerUpdate} // FIX 59
            onLayerCommit={handleLayerCommit} // FIX 60
            imgRef={imgRef} // FIX 61
            customHslColor={props.customHslColor} // FIX 62
            setCustomHslColor={props.setCustomHslColor} // FIX 63
        />
    </TabsContent>
  )}
  // ...
};