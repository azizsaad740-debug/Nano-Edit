import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { EditState, HslAdjustment, HslColorKey } from "@/types/editor";
import { HslColorSelector } from "./HslColorSelector";
import React from "react";
import { cn } from "@/lib/utils";
import { ColorPicker } from "@/components/ui/color-picker";

interface HslAdjustmentsProps {
  hslAdjustments: EditState['hslAdjustments'];
  onAdjustmentChange: (color: HslColorKey, key: keyof HslAdjustment, value: number) => void;
  onAdjustmentCommit: (color: HslColorKey, key: keyof HslAdjustment, value: number) => void;
}

const HslAdjustments = ({ hslAdjustments, onAdjustmentChange, onAdjustmentCommit }: HslAdjustmentsProps) => {
  const [selectedColor, setSelectedColor] = React.useState<HslColorKey>('global');
  const [customColor, setCustomColor] = React.useState('#EC4899'); // Default magenta color for custom slot
  
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

  const renderSliderControl = (
    key: keyof HslAdjustment,
    label: string,
    min: number,
    max: number,
    step: number,
    trackClassName: string,
    unit: string = ''
  ) => (
    <div className="grid gap-1">
      <div className="flex items-center justify-between">
        <Label htmlFor={key} className="text-sm">{label}</Label>
        <div className="flex items-center gap-2">
          <span className="w-10 text-right text-sm text-muted-foreground">{currentAdjustment[key]}{unit}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReset(key)}>
            <RotateCcw className="h-3 w-3" />
            <span className="sr-only">Reset {label}</span>
          </Button>
        </div>
      </div>
      <SliderTrack className={trackClassName}>
        <Slider
          id={key}
          min={min}
          max={max}
          step={step}
          value={[currentAdjustment[key]]}
          onValueChange={([value]) => onAdjustmentChange(selectedColor, key, value)}
          onValueCommit={([value]) => onAdjustmentCommit(selectedColor, key, value)}
          className={cn(
            "absolute inset-0 [&>span:first-child]:bg-transparent [&>span:first-child]:h-full",
            // Apply custom thumb styling using CSS selector, replacing thumbClassName
            "[&>span:last-child]:h-5 [&>span:last-child]:w-5 [&>span:last-child]:border-2 [&>span:last-child]:border-background [&>span:last-child]:bg-white [&>span:last-child]:shadow-md"
          )}
        />
      </SliderTrack>
    </div>
  );

  return (
    <div className="space-y-4">
      <HslColorSelector 
        selectedColor={selectedColor} 
        onSelect={setSelectedColor} 
        customColor={customColor}
      />

      {selectedColor === 'magenta' && (
        <div className="grid gap-2 pt-2">
          <Label htmlFor="custom-color-picker">Custom Hue Reference</Label>
          <div className="flex items-center gap-2">
            <ColorPicker
              color={customColor}
              onChange={setCustomColor}
              onCommit={() => {}}
            />
            <span className="text-sm text-muted-foreground">{customColor.toUpperCase()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            This color is used as a visual reference for the 'Custom' slot. The HSL adjustments below are applied to the 'magenta' hue range internally.
          </p>
        </div>
      )}

      <div className="space-y-4 pt-2">
        {/* Hue Slider */}
        {renderSliderControl(
          "hue",
          "Hue",
          -180,
          180,
          1,
          "bg-gradient-to-r from-red-500 via-purple-500 to-red-500 rounded-full",
          "°"
        )}

        {/* Saturation Slider */}
        {renderSliderControl(
          "saturation",
          "Saturation",
          0,
          200,
          1,
          "bg-muted-foreground/30",
          "%"
        )}

        {/* Luminance Slider */}
        {renderSliderControl(
          "luminance",
          "Luminance",
          -100,
          100,
          1,
          "bg-muted-foreground/30",
          "%"
        )}
      </div>
      
      <p className="text-xs text-muted-foreground pt-2">
        Note: Per-color HSL adjustments are currently applied globally using the selected color's settings. Full per-color masking is not yet implemented.
      </p>
    </div>
  );
};

export default HslAdjustments;