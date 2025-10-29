import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BrushOptions } from "./BrushOptions";
import type { BrushState } from "@/types/editor";

interface PencilOptionsProps {
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  foregroundColor: string;
  setForegroundColor: (color: string) => void;
}

export const PencilOptions: React.FC<PencilOptionsProps> = ({
  brushState,
  setBrushState,
  foregroundColor,
  setForegroundColor,
}) => {
  const [autoErase, setAutoErase] = React.useState(false);

  const handleBrushUpdate = (updates: Partial<Omit<BrushState, 'color'>>) => {
    setBrushState(updates);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="auto-erase"
          checked={autoErase}
          onCheckedChange={setAutoErase}
        />
        <Label htmlFor="auto-erase" className="text-sm font-medium leading-none">
          Auto-erase (Stub)
        </Label>
      </div>
      
      {/* Pencil uses BrushOptions internally but overrides certain settings (Hardness=100, Flow=100, Spacing=1) */}
      <BrushOptions
        activeTool="pencil"
        brushSize={brushState.size}
        setBrushSize={(size) => handleBrushUpdate({ size })}
        brushOpacity={brushState.opacity}
        setBrushOpacity={(opacity) => handleBrushUpdate({ opacity })}
        foregroundColor={foregroundColor}
        setForegroundColor={setForegroundColor}
        brushHardness={100} // Pencil is always hard
        setBrushHardness={() => {}}
        brushSmoothness={brushState.smoothness}
        setBrushSmoothness={(smoothness) => handleBrushUpdate({ smoothness })}
        brushShape={brushState.shape}
        setBrushShape={(shape) => handleBrushUpdate({ shape })}
        brushFlow={100} // Pencil is always 100 flow
        setBrushFlow={() => {}}
        brushAngle={0}
        setBrushAngle={() => {}}
        brushRoundness={100}
        setBrushRoundness={() => {}}
        brushSpacing={1} // Pencil is usually 1 spacing
        setBrushSpacing={() => {}}
        brushBlendMode={brushState.blendMode}
        setBrushBlendMode={(blendMode) => handleBrushUpdate({ blendMode })}
      />
    </div>
  );
};