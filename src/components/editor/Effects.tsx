import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface EffectsProps {
  effects: {
    blur: number;
    hueShift: number;
    vignette: number;
  };
  onEffectChange: (effect: string, value: number) => void;
  onEffectCommit: (effect: string, value: number) => void;
}

const Effects = ({ effects, onEffectChange, onEffectCommit }: EffectsProps) => {
  const handleReset = (effect: string) => {
    onEffectChange(effect, 0);
    onEffectCommit(effect, 0);
  };

  return (
    <div className="space-y-4">
      {/* Existing effect sliders */}
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
          onValueCommit={([value]) => onEffectCommit("blur", value)}
        />
      </div>
      {/* Brush placeholder */}
      <div className="pt-4 border-t">
        <Label className="block mb-2">Brush (coming soon)</Label>
        <div className="space-y-2">
          <Label htmlFor="brush-size">Size</Label>
          <Slider id="brush-size" min={1} max={100} step={1} disabled />
          <Label htmlFor="brush-opacity">Opacity</Label>
          <Slider id="brush-opacity" min={0} max={100} step={5} disabled />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Brush tool will allow freehand painting. Stay tuned!
        </p>
      </div>
    </div>
  );
};

export default Effects;