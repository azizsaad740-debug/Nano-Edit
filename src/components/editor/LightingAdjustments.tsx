import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface LightingAdjustmentsProps {
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  onAdjustmentChange: (adjustment: string, value: number) => void;
}

const LightingAdjustments = ({ adjustments, onAdjustmentChange }: LightingAdjustmentsProps) => {
  const handleReset = (adjustment: string) => {
    onAdjustmentChange(adjustment, 100);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="brightness">Brightness</Label>
          <div className="flex items-center gap-2">
            <span className="w-8 text-right text-sm text-muted-foreground">{adjustments.brightness}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReset("brightness")}>
              <RotateCcw className="h-3 w-3" />
              <span className="sr-only">Reset Brightness</span>
            </Button>
          </div>
        </div>
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
        <div className="flex items-center justify-between">
          <Label htmlFor="contrast">Contrast</Label>
          <div className="flex items-center gap-2">
            <span className="w-8 text-right text-sm text-muted-foreground">{adjustments.contrast}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReset("contrast")}>
              <RotateCcw className="h-3 w-3" />
              <span className="sr-only">Reset Contrast</span>
            </Button>
          </div>
        </div>
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
        <div className="flex items-center justify-between">
          <Label htmlFor="saturation">Saturation</Label>
          <div className="flex items-center gap-2">
            <span className="w-8 text-right text-sm text-muted-foreground">{adjustments.saturation}</span>
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
          value={[adjustments.saturation]}
          onValueChange={([value]) => onAdjustmentChange("saturation", value)}
        />
      </div>
    </div>
  );
};

export default LightingAdjustments;