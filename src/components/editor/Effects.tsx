import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface EffectsProps {
  effects: {
    blur: number;
    hueShift: number;
  };
  onEffectChange: (effect: string, value: number) => void;
}

const Effects = ({ effects, onEffectChange }: EffectsProps) => {
  const handleReset = (effect: string) => {
    onEffectChange(effect, 0);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="blur">Blur</Label>
          <div className="flex items-center gap-2">
            <span className="w-10 text-right text-sm text-muted-foreground">{effects.blur}px</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReset("blur")}>
              <RotateCcw className="h-3 w-3" />
              <span className="sr-only">Reset Blur</span>
            </Button>
          </div>
        </div>
        <Slider
          id="blur"
          min={0}
          max={20}
          step={1}
          value={[effects.blur]}
          onValueChange={([value]) => onEffectChange("blur", value)}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="hueShift">Hue Shift</Label>
          <div className="flex items-center gap-2">
            <span className="w-10 text-right text-sm text-muted-foreground">{effects.hueShift}°</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReset("hueShift")}>
              <RotateCcw className="h-3 w-3" />
              <span className="sr-only">Reset Hue Shift</span>
            </Button>
          </div>
        </div>
        <Slider
          id="hueShift"
          min={0}
          max={360}
          step={1}
          value={[effects.hueShift]}
          onValueChange={([value]) => onEffectChange("hueShift", value)}
        />
      </div>
    </div>
  );
};

export default Effects;