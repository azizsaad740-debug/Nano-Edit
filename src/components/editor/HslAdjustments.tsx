"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import * as React from "react";
import type { EditState, HslAdjustment, HslColorKey } from "@/types/editor";
import { HslColorSelector } from "./HslColorSelector";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface HslAdjustmentsProps {
  hslAdjustments: EditState['hslAdjustments'];
  onAdjustmentChange: (color: HslColorKey, key: keyof HslAdjustment, value: number) => void;
  onAdjustmentCommit: (color: HslColorKey, key: keyof HslAdjustment, value: number) => void;
  customColor: string;
  setCustomColor: (color: string) => void;
}

const HSL_CONTROLS: { key: keyof HslAdjustment; label: string; min: number; max: number; unit: string }[] = [
  { key: 'hue', label: 'Hue', min: -180, max: 180, unit: '°' },
  { key: 'saturation', label: 'Saturation', min: 0, max: 200, unit: '%' },
  { key: 'luminance', label: 'Luminance', min: -100, max: 100, unit: '%' },
];

const HslAdjustments = ({ hslAdjustments, onAdjustmentChange, onAdjustmentCommit, customColor, setCustomColor }: HslAdjustmentsProps) => {
  const [selectedColor, setSelectedColor] = React.useState<HslColorKey>('global');
  const currentAdjustment = hslAdjustments[selectedColor];

  const handleReset = (key: keyof HslAdjustment) => {
    let defaultValue = 0;
    if (key === 'saturation') defaultValue = 100;
    
    onAdjustmentChange(selectedColor, key, defaultValue);
    onAdjustmentCommit(selectedColor, key, defaultValue);
  };

  return (
    <div className="space-y-4">
      <HslColorSelector 
        selectedColor={selectedColor} 
        onSelect={setSelectedColor} 
        customColor={customColor}
      />

      {selectedColor === 'magenta' && (
        <div className="grid gap-2 pt-2 border-t">
          <Label htmlFor="custom-color-picker">Custom Color Range (Magenta Stub)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="custom-color-picker"
              type="color"
              className="p-1 h-10 w-12"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
            />
            <Input
              type="text"
              className="h-10 flex-1"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            In a full implementation, this color would define the center of the adjustable hue range.
          </p>
        </div>
      )}
      
      <Separator />

      {HSL_CONTROLS.map(({ key, label, min, max, unit }) => (
        <div key={String(key)} className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={String(key)} className="text-sm">{label}</Label>
            <div className="flex items-center gap-2">
              <span className="w-10 text-right text-sm text-muted-foreground">
                {currentAdjustment[key]}
                {unit}
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReset(key)}>
                <RotateCcw className="h-3 w-3" />
                <span className="sr-only">Reset {label}</span>
              </Button>
            </div>
          </div>
          <Slider
            id={String(key)}
            min={min}
            max={max}
            step={1}
            value={[currentAdjustment[key]]}
            onValueChange={([value]) => onAdjustmentChange(selectedColor, key, value)}
            onValueCommit={([value]) => onAdjustmentCommit(selectedColor, key, value)}
          />
        </div>
      ))}
    </div>
  );
};

export default HslAdjustments;