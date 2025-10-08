import { Button } from "@/components/ui/button";
import { RotateCcw, RotateCw, ArrowLeftRight, ArrowUpDown } from "lucide-react";

interface TransformProps {
  onTransformChange: (transformType: string) => void;
}

const Transform = ({ onTransformChange }: TransformProps) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" size="sm" onClick={() => onTransformChange("rotate-left")}>
        <RotateCcw className="h-4 w-4 mr-2" />
        Rotate Left
      </Button>
      <Button variant="outline" size="sm" onClick={() => onTransformChange("rotate-right")}>
        <RotateCw className="h-4 w-4 mr-2" />
        Rotate Right
      </Button>
      <Button variant="outline" size="sm" onClick={() => onTransformChange("flip-horizontal")}>
        <ArrowLeftRight className="h-4 w-4 mr-2" />
        Flip Horizontal
      </Button>
      <Button variant="outline" size="sm" onClick={() => onTransformChange("flip-vertical")}>
        <ArrowUpDown className="h-4 w-4 mr-2" />
        Flip Vertical
      </Button>
    </div>
  );
};

export default Transform;