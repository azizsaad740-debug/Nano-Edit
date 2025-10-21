import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { EditState, HslAdjustment } from "@/hooks/useEditorState";
import { HslColorSelector } from "./HslColorSelector";
import React from "react";

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

  return (
    <div className="space-y-4">
      <HslColorSelector selectedColor={selectedColor} onSelect={setSelectedColor} />

      <div className="space-y-4 pt-2">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="hue">Hue</Label>
            <div className="flex items-center gap-2">
              <span className="w-8 text-right text-sm text-muted-foreground">{currentAdjustment.hue}°</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReset("hue")}>
                <RotateCcw className="h-3 w-3" />
                <span className="sr-only">Reset Hue</span>
              </Button>
            </div>
          </div>
          <Slider
            id="hue"
            min={-180}
            max={180}
            step={1}
            value={[currentAdjustment.hue]}
            onValueChange={([value]) => onAdjustmentChange(selectedColor, "hue", value)}
            onValueCommit={([value]) => onAdjustmentCommit(selectedColor, "hue", value)}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="saturation">Saturation</Label>
            <div className="flex items-center gap-2">
              <span className="w-8 text-right text-sm text-muted-foreground">{currentAdjustment.saturation}%</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReset("saturation")}>
                <RotateCcw className="h-3 w-3" />
                <span className="sr-only">Reset Saturation</span>
              </Button>
            </div>
          </div>
          <Slider
            id="saturation"
            min={0}
            max={200}
            step={1}
            value={[currentAdjustment.saturation]}
            onValueChange={([value]) => onAdjustmentChange(selectedColor, "saturation", value)}
            onValueCommit={([value]) => onAdjustmentCommit(selectedColor, "saturation", value)}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="luminance">Luminance</Label>
            <div className="flex items-center gap-2">
              <span className="w-8 text-right text-sm text-muted-foreground">{currentAdjustment.luminance}%</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReset("luminance")}>
                <RotateCcw className="h-3 w-3" />
                <span className="sr-only">Reset Luminance</span>
              </Button>
            </div>
          </div>
          <Slider
            id="luminance"
            min={-100}
            max={100}
            step={1}
            value={[currentAdjustment.luminance]}
            onValueChange={([value]) => onAdjustmentChange(selectedColor, "luminance", value)}
            onValueCommit={([value]) => onAdjustmentCommit(selectedColor, "luminance", value)}
          />
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground pt-2">
        Note: Per-color HSL adjustments are currently applied globally using the selected color's settings. Full per-color masking is not yet implemented.
      </p>
    </div>
  );
};

export default HslAdjustments;