import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { EditState, HslAdjustment } from "@/hooks/useEditorState";
import { HslColorSelector } from "./HslColorSelector";
import React from "react";
import { cn } from "@/lib/utils";

type HslColorKey = keyof EditState['hslAdjustments'];

interface HslAdjustmentsProps {
  hslAdjustments: EditState['hslAdjustments'];
  onAdjustmentChange: (color: HslColorKey, key: keyof HslAdjustment, value: number) => void;
  onAdjustmentCommit: (color: HslColorKey, key: keyof HslAdjustment, value: number) => void;
}

const HslAdjustments = ({ hslAdjustments, onAdjustmentChange, onAdjustmentCommit }: HslAdjustmentsProps) => {
  const [selectedColor, setSelectedColor] = React.useState<HslColorKey>('global');
  
  const currentAdjustment = hslAdjustments[selectedColor];

  const handleReset = (key: keyof HslAdjustment) => {
    const defaultValue = key === 'saturation' ? 100 : 0;
    onAdjustmentChange(selectedColor, key, defaultValue);
    onAdjustmentCommit(selectedColor, key, defaultValue);
  };

  const SliderTrack = ({ children, className, style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) => (
    <div className={cn("relative h-2 w-full", className)} style={style}>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      <HslColorSelector selectedColor={selectedColor} onSelect={setSelectedColor} />

      <div className="space-y-4 pt-2">
        {/* Hue Slider */}
        <div className="grid gap-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="hue" className="text-sm">Hue</Label>
            <span className="text-sm text-muted-foreground">{currentAdjustment.hue}°</span>
          </div>
          <SliderTrack className="bg-gradient-to-r from-red-500 via-purple-500 to-red-500 rounded-full">
            <Slider
              id="hue"
              min={-180}
              max={180}
              step={1}
              value={[currentAdjustment.hue]}
              onValueChange={([value]) => onAdjustmentChange(selectedColor, "hue", value)}
              onValueCommit={([value]) => onAdjustmentCommit(selectedColor, "hue", value)}
              className="absolute inset-0 [&>span:first-child]:bg-transparent [&>span:first-child]:h-full"
              thumbClassName="h-5 w-5 border-2 border-background bg-white shadow-md"
            />
          </SliderTrack>
        </div>

        {/* Saturation Slider */}
        <div className="grid gap-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="saturation" className="text-sm">Saturation</Label>
            <span className="text-sm text-muted-foreground">{currentAdjustment.saturation}%</span>
          </div>
          <SliderTrack className="bg-muted-foreground/30">
            <Slider
              id="saturation"
              min={0}
              max={200}
              step={1}
              value={[currentAdjustment.saturation]}
              onValueChange={([value]) => onAdjustmentChange(selectedColor, "saturation", value)}
              onValueCommit={([value]) => onAdjustmentCommit(selectedColor, "saturation", value)}
              className="absolute inset-0 [&>span:first-child]:bg-transparent [&>span:first-child]:h-full"
              thumbClassName="h-5 w-5 border-2 border-background bg-white shadow-md"
            />
          </SliderTrack>
        </div>

        {/* Luminance Slider */}
        <div className="grid gap-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="luminance" className="text-sm">Luminance</Label>
            <span className="text-sm text-muted-foreground">{currentAdjustment.luminance}%</span>
          </div>
          <SliderTrack className="bg-muted-foreground/30">
            <Slider
              id="luminance"
              min={-100}
              max={100}
              step={1}
              value={[currentAdjustment.luminance]}
              onValueChange={([value]) => onAdjustmentChange(selectedColor, "luminance", value)}
              onValueCommit={([value]) => onAdjustmentCommit(selectedColor, "luminance", value)}
              className="absolute inset-0 [&>span:first-child]:bg-transparent [&>span:first-child]:h-full"
              thumbClassName="h-5 w-5 border-2 border-background bg-white shadow-md"
            />
          </SliderTrack>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground pt-2">
        Note: Per-color HSL adjustments are currently applied globally using the selected color's settings. Full per-color masking is not yet implemented.
      </p>
    </div>
  );
};

export default HslAdjustments;