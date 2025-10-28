"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Zap, SlidersHorizontal, Palette, RotateCcw } from "lucide-react";
import { showError } from "@/utils/toast";

interface AdjustmentsPanelProps {
  onAddAdjustmentLayer: (type: 'brightness' | 'curves' | 'hsl' | 'grading') => void;
}

const adjustmentTypes = [
  { type: 'brightness' as const, name: 'Brightness/Contrast', icon: Sun },
  { type: 'curves' as const, name: 'Curves', icon: SlidersHorizontal },
  { type: 'hsl' as const, name: 'Hue/Saturation (HSL)', icon: Palette },
  { type: 'grading' as const, name: 'Color Grading', icon: Zap },
];

const AdjustmentsPanel: React.FC<AdjustmentsPanelProps> = ({ onAddAdjustmentLayer }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Quick Adjustment Layers</h3>
      <div className="grid grid-cols-2 gap-2">
        {adjustmentTypes.map(({ type, name, icon: Icon }) => (
          <Button 
            key={type} 
            variant="outline" 
            size="sm" 
            onClick={() => onAddAdjustmentLayer(type)}
            className="justify-start"
          >
            <Icon className="h-4 w-4 mr-2" /> {name}
          </Button>
        ))}
      </div>
      
      <div className="space-y-2 pt-4 border-t">
        <h3 className="text-sm font-medium">Auto Adjustments (Stub)</h3>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={() => showError("Auto Tone is a stub.")}>Auto Tone</Button>
          <Button variant="outline" size="sm" onClick={() => showError("Auto Contrast is a stub.")}>Auto Contrast</Button>
          <Button variant="outline" size="sm" onClick={() => showError("Auto Color is a stub.")}>Auto Color</Button>
        </div>
      </div>
      
      <div className="space-y-2 pt-4 border-t">
        <h3 className="text-sm font-medium">Presets (Stub)</h3>
        <Button variant="outline" size="sm" className="w-full" onClick={() => showError("Adjustment presets are a stub.")}>
          Load Adjustment Preset
        </Button>
      </div>
    </div>
  );
};

export default AdjustmentsPanel;