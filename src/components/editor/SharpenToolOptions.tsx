"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface SharpenToolOptionsProps {
  selectiveSharpenStrength: number;
  onStrengthChange: (value: number) => void;
  onStrengthCommit: (value: number) => void;
}

export const SharpenToolOptions: React.FC<SharpenToolOptionsProps> = ({
  selectiveSharpenStrength,
  onStrengthChange,
  onStrengthCommit,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Sharpen Strength ({selectiveSharpenStrength})</Label>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[selectiveSharpenStrength]}
          onValueChange={([value]) => onStrengthChange(value)}
          onValueCommit={([value]) => onStrengthCommit(value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Note: Sharpening is applied selectively via the brush stroke.
      </p>
    </div>
  );
};