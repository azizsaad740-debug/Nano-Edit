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

interface TransformProps {
  onTransformChange: (transformType: string) => void;
}

const Transform = ({ onTransformChange }: TransformProps) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" onClick={() => onTransformChange("rotate-left")}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Rotate Left
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Shortcut: Shift + R</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" onClick={() => onTransformChange("rotate-right")}>
            <RotateCw className="h-4 w-4 mr-2" />
            Rotate Right
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Shortcut: R</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" onClick={() => onTransformChange("flip-horizontal")}>
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Flip Horizontal
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Shortcut: H</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" onClick={() => onTransformChange("flip-vertical")}>
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Flip Vertical
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Shortcut: V</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default Transform;