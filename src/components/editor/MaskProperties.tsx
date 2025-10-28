"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2, ArrowDownUp } from "lucide-react";
import type { Layer } from "@/types/editor";
import { showError } from "@/utils/toast";

interface MaskPropertiesProps {
  layer: Layer;
  onRemoveMask: (id: string) => void;
  onInvertMask: (id: string) => void;
  onLayerUpdate: (updates: Partial<Layer>) => void;
  onLayerCommit: (historyName: string) => void;
}

const MaskProperties: React.FC<MaskPropertiesProps> = ({
  layer,
  onRemoveMask,
  onInvertMask,
  onLayerUpdate,
  onLayerCommit,
}) => {
  if (!layer.maskDataUrl) {
    return (
      <p className="text-sm text-muted-foreground">
        No mask applied to this layer. Use the selection tools to create one.
      </p>
    );
  }

  // Mask properties are currently stubbed as they require complex WebGL/Canvas manipulation
  // to apply density/feathering dynamically to the mask image itself.
  const [density, setDensity] = React.useState(100);
  const [feather, setFeather] = React.useState(0);

  const handleCommit = (historyName: string) => {
    onLayerCommit(historyName);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Layer Mask</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="density">Density (Stub)</Label>
            <span className="w-10 text-right text-sm text-muted-foreground">{density}%</span>
          </div>
          <Slider
            id="density"
            min={0}
            max={100}
            step={1}
            value={[density]}
            onValueChange={([v]) => setDensity(v)}
            onValueCommit={() => handleCommit("Change Mask Density")}
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="feather">Feather (Stub)</Label>
            <span className="w-10 text-right text-sm text-muted-foreground">{feather}px</span>
          </div>
          <Slider
            id="feather"
            min={0}
            max={50}
            step={1}
            value={[feather]}
            onValueChange={([v]) => setFeather(v)}
            onValueCommit={() => handleCommit("Change Mask Feather")}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="refine">Mask Edge Refinement (Stub)</Label>
          <Button variant="outline" disabled onClick={() => showError("Mask refinement is not yet implemented.")}>
            Refine Edge...
          </Button>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" className="flex-1" onClick={() => onInvertMask(layer.id)}>
            <ArrowDownUp className="h-4 w-4 mr-2" /> Invert Mask
          </Button>
          <Button variant="destructive" className="flex-1" onClick={() => onRemoveMask(layer.id)}>
            <Trash2 className="h-4 w-4 mr-2" /> Remove Mask
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaskProperties;