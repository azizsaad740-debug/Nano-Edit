import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface ColorGradingProps {
  grading: {
    grayscale: number;
    sepia: number;
    invert: number;
  };
  onGradingChange: (gradingType: string, value: number) => void;
  onGradingCommit: (gradingType: string, value: number) => void;
}

const ColorGrading = ({ grading, onGradingChange, onGradingCommit }: ColorGradingProps) => {
  const handleReset = (gradingType: string) => {
    onGradingChange(gradingType, 0);
    onGradingCommit(gradingType, 0);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="grayscale">Grayscale</Label>
          <div className="flex items-center gap-2">
            <span className="w-8 text-right text-sm text-muted-foreground">{grading.grayscale}%</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReset("grayscale")}>
              <RotateCcw className="h-3 w-3" />
              <span className="sr-only">Reset Grayscale</span>
            </Button>
          </div>
        </div>
        <Slider
          id="grayscale"
          min={0}
          max={100}
          step={1}
          value={[grading.grayscale]}
          onValueChange={([value]) => onGradingChange("grayscale", value)}
          onValueCommit={([value]) => onGradingCommit("grayscale", value)}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="sepia">Sepia</Label>
          <div className="flex items-center gap-2">
            <span className="w-8 text-right text-sm text-muted-foreground">{grading.sepia}%</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReset("sepia")}>
              <RotateCcw className="h-3 w-3" />
              <span className="sr-only">Reset Sepia</span>
            </Button>
          </div>
        </div>
        <Slider
          id="sepia"
          min={0}
          max={100}
          step={1}
          value={[grading.sepia]}
          onValueChange={([value]) => onGradingChange("sepia", value)}
          onValueCommit={([value]) => onGradingCommit("sepia", value)}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="invert">Invert</Label>
          <div className="flex items-center gap-2">
            <span className="w-8 text-right text-sm text-muted-foreground">{grading.invert}%</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReset("invert")}>
              <RotateCcw className="h-3 w-3" />
              <span className="sr-only">Reset Invert</span>
            </Button>
          </div>
        </div>
        <Slider
          id="invert"
          min={0}
          max={100}
          step={1}
          value={[grading.invert]}
          onValueChange={([value]) => onGradingChange("invert", value)}
          onValueCommit={([value]) => onGradingCommit("invert", value)}
        />
      </div>
    </div>
  );
};

export default ColorGrading;