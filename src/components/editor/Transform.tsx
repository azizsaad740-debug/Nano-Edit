import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  RotateCw,
  ArrowLeftRight,
  ArrowUpDown,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface TransformProps {
  onTransformChange: (transformType: string) => void;
  rotation: number;
  onRotationChange: (value: number) => void;
  onRotationCommit: (value: number) => void;
}

const Transform = ({ onTransformChange, rotation, onRotationChange, onRotationCommit }: TransformProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => onTransformChange("rotate-left")}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Rotate Left (Shift + R)</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => onTransformChange("rotate-right")}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Rotate Right (R)</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => onTransformChange("flip-horizontal")}>
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Flip Horizontal (H)</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => onTransformChange("flip-vertical")}>
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Flip Vertical (V)</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid gap-2 pt-4 border-t">
        <div className="flex items-center justify-between">
          <Label htmlFor="rotation-slider">Rotation</Label>
          <div className="flex items-center gap-2">
            <span className="w-10 text-right text-sm text-muted-foreground">{Math.round(rotation)}°</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { onRotationChange(0); onRotationCommit(0); }}>
              <RotateCcw className="h-3 w-3" />
              <span className="sr-only">Reset Rotation</span>
            </Button>
          </div>
        </div>
        <Slider
          id="rotation-slider"
          min={-180}
          max={180}
          step={1}
          value={[rotation]}
          onValueChange={([value]) => onRotationChange(value)}
          onValueCommit={([value]) => onRotationCommit(value)}
        />
      </div>
    </div>
  );
};

export default Transform;