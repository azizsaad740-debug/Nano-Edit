"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface BlurBrushOptionsProps {
  selectiveBlurStrength: number;
  onStrengthChange: (value: number) => void;
  onStrengthCommit: (value: number) => void;
}

export const BlurBrushOptions: React.FC<BlurBrushOptionsProps> = ({
  selectiveBlurStrength,
  onStrengthChange,
  onStrengthCommit,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Blur Strength ({selectiveBlurStrength})</Label>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[selectiveBlurStrength]}
          onValueChange={([value]) => onStrengthChange(value)}
          onValueCommit={([value]) => onStrengthCommit(value)}
        />
      </div>
    </div>
  );
};