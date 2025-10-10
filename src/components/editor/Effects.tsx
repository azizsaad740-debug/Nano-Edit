import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface EffectsProps {
  effects: {
    blur: number;
    hueShift: number;
    vignette: number;
    noise: number;
    sharpen: number;
    clarity: number;
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
          min={-180}
          max={180}
          step={1}
          value={[effects.hueShift]}
          onValueChange={([value]) => onEffectChange("hueShift", value)}
          onValueCommit={([value]) => onEffectCommit("hueShift", value)}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="vignette">Vignette</Label>
          <div className="flex items-center gap-2">
            <span className="w-10 text-right text-sm text-muted-foreground">{effects.vignette}%</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReset("vignette")}>
              <RotateCcw className="h-3 w-3" />
              <span className="sr-only">Reset Vignette</span>
            </Button>
          </div>
        </div>
        <Slider
          id="vignette"
          min={0}
          max={100}
          step={1}
          value={[effects.vignette]}
          onValueChange={([value]) => onEffectChange("vignette", value)}
          onValueCommit={([value]) => onEffectCommit("vignette", value)}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="noise">Noise</Label>
          <div className="flex items-center gap-2">
            <span className="w-10 text-right text-sm text-muted-foreground">{effects.noise}%</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReset("noise")}>
              <RotateCcw className="h-3 w-3" />
              <span className="sr-only">Reset Noise</span>
            </Button>
          </div>
        </div>
        <Slider
          id="noise"
          min={0}
          max={100}
          step={1}
          value={[effects.noise]}
          onValueChange={([value]) => onEffectChange("noise", value)}
          onValueCommit={([value]) => onEffectCommit("noise", value)}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="sharpen">Sharpen</Label>
          <div className="flex items-center gap-2">
            <span className="w-10 text-right text-sm text-muted-foreground">{effects.sharpen}%</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReset("sharpen")}>
              <RotateCcw className="h-3 w-3" />
              <span className="sr-only">Reset Sharpen</span>
            </Button>
          </div>
        </div>
        <Slider
          id="sharpen"
          min={0}
          max={100}
          step={1}
          value={[effects.sharpen]}
          onValueChange={([value]) => onEffectChange("sharpen", value)}
          onValueCommit={([value]) => onEffectCommit("sharpen", value)}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="clarity">Clarity</Label>
          <div className="flex items-center gap-2">
            <span className="w-10 text-right text-sm text-muted-foreground">{effects.clarity}%</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReset("clarity")}>
              <RotateCcw className="h-3 w-3" />
              <span className="sr-only">Reset Clarity</span>
            </Button>
          </div>
        </div>
        <Slider
          id="clarity"
          min={0}
          max={100}
          step={1}
          value={[effects.clarity]}
          onValueChange={([value]) => onEffectChange("clarity", value)}
          onValueCommit={([value]) => onEffectCommit("clarity", value)}
        />
      </div>
    </div>
  );
};

export default Effects;