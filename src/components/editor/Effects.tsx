import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface EffectsProps {
  effects: {
    blur: number;
    hueShift: number;
  };
  onEffectChange: (effect: string, value: number) => void;
}

const Effects = ({ effects, onEffectChange }: EffectsProps) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="blur">Blur</Label>
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
        <Label htmlFor="hueShift">Hue Shift</Label>
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