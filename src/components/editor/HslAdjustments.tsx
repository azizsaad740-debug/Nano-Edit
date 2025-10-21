import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { EditState } from "@/hooks/useEditorState";

interface HslAdjustmentsProps {
  hslAdjustments: EditState['hslAdjustments'];
  onAdjustmentChange: (adjustment: keyof EditState['hslAdjustments'], value: number) => void;
  onAdjustmentCommit: (adjustment: keyof EditState['hslAdjustments'], value: number) => void;
}

const HslAdjustments = ({ hslAdjustments, onAdjustmentChange, onAdjustmentCommit }: HslAdjustmentsProps) => {
  const handleReset = (adjustment: keyof EditState['hslAdjustments']) => {
    const defaultValue = adjustment === 'saturation' ? 100 : 0;
    onAdjustmentChange(adjustment, defaultValue);
    onAdjustmentCommit(adjustment, defaultValue);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="hue">Hue</Label>
          <div className="flex items-center gap-2">
            <span className="w-8 text-right text-sm text-muted-foreground">{hslAdjustments.hue}°</span>
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
          value={[hslAdjustments.hue]}
          onValueChange={([value]) => onAdjustmentChange("hue", value)}
          onValueCommit={([value]) => onAdjustmentCommit("hue", value)}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="saturation">Saturation</Label>
          <div className="flex items-center gap-2">
            <span className="w-8 text-right text-sm text-muted-foreground">{hslAdjustments.saturation}%</span>
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
          value={[hslAdjustments.saturation]}
          onValueChange={([value]) => onAdjustmentChange("saturation", value)}
          onValueCommit={([value]) => onAdjustmentCommit("saturation", value)}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="luminance">Luminance</Label>
          <div className="flex items-center gap-2">
            <span className="w-8 text-right text-sm text-muted-foreground">{hslAdjustments.luminance}%</span>
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
          value={[hslAdjustments.luminance]}
          onValueChange={([value]) => onAdjustmentChange("luminance", value)}
          onValueCommit={([value]) => onAdjustmentCommit("luminance", value)}
        />
      </div>
      
      <p className="text-xs text-muted-foreground pt-2">
        Note: Per-color HSL adjustments (like in Lightroom) are complex and currently stubbed as global adjustments.
      </p>
    </div>
  );
};

export default HslAdjustments;