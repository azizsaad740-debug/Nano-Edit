"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlurBrushOptionsProps {
  selectiveBlurStrength: number;
  onStrengthChange: (value: number) => void;
  onStrengthCommit: (value: number) => void;
}

export const BlurBrushOptions = ({
  selectiveBlurStrength,
  onStrengthChange,
  onStrengthCommit,
}: BlurBrushOptionsProps) => {
  const handleReset = () => {
    onStrengthChange(50);
    onStrengthCommit(50);
  };

  return (
    <div className="flex flex-col gap-4 p-2 bg-muted/50 rounded-md">
      <h4 className="text-sm font-medium text-foreground">Max Blur Strength</h4>
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="blur-strength" className="text-xs">Intensity</Label>
          <div className="flex items-center gap-2">
            <span className="w-8 text-right text-sm text-muted-foreground">{selectiveBlurStrength}%</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleReset}>
              <RotateCcw className="h-3 w-3" />
              <span className="sr-only">Reset Strength</span>
            </Button>
          </div>
        </div>
        <Slider
          id="blur-strength"
          min={0}
          max={100}
          step={1}
          value={[selectiveBlurStrength]}
          onValueChange={([v]) => onStrengthChange(v)}
          onValueCommit={([v]) => onStrengthCommit(v)}
          className="w-full"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        This sets the maximum blur applied to the image. The brush opacity controls how much of this maximum blur is applied with each stroke.
      </p>
    </div>
  );
};