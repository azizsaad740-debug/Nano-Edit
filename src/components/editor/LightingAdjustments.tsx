import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface LightingAdjustmentsProps {
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  onAdjustmentChange: (adjustment: string, value: number) => void;
}

const LightingAdjustments = ({ adjustments, onAdjustmentChange }: LightingAdjustmentsProps) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="brightness">Brightness</Label>
        <Slider
          id="brightness"
          min={0}
          max={200}
          step={1}
          value={[adjustments.brightness]}
          onValueChange={([value]) => onAdjustmentChange("brightness", value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contrast">Contrast</Label>
        <Slider
          id="contrast"
          min={0}
          max={200}
          step={1}
          value={[adjustments.contrast]}
          onValueChange={([value]) => onAdjustmentChange("contrast", value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="saturation">Saturation</Label>
        <Slider
          id="saturation"
          min={0}
          max={200}
          step={1}
          value={[adjustments.saturation]}
          onValueChange={([value]) => onAdjustmentChange("saturation", value)}
        />
      </div>
    </div>
  );
};

export default LightingAdjustments;