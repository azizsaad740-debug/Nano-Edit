"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BrushOptions } from "./BrushOptions";
import type { BrushState } from "@/types/editor";
import { Separator } from "@/components/ui/separator";

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
  // Pencil is essentially a brush with 100% hardness and 100% flow, 
  // and typically uses 'normal' blend mode. We expose size and opacity.

  return (
    <div className="space-y-4">
      <h3 className="text-md font-semibold">Pencil Tool Options</h3>
      
      {/* Size */}
      <div className="space-y-1">
        <Label>Size ({brushState.size})</Label>
        <BrushOptions
          activeTool="pencil"
          brushSize={brushState.size}
          setBrushSize={(size) => setBrushState({ size })}
          brushOpacity={brushState.opacity}
          setBrushOpacity={(opacity) => setBrushState({ opacity })}
          foregroundColor={foregroundColor}
          setForegroundColor={setForegroundColor}
          // Fixed properties for Pencil simulation
          brushHardness={100}
          setBrushHardness={() => {}}
          brushSmoothness={brushState.smoothness}
          setBrushSmoothness={(smoothness) => setBrushState({ smoothness })}
          brushShape={brushState.shape}
          setBrushShape={(shape) => setBrushState({ shape })}
          brushFlow={100}
          setBrushFlow={() => {}}
          brushAngle={0}
          setBrushAngle={() => {}}
          brushRoundness={100}
          setBrushRoundness={() => {}}
          brushSpacing={1} // Pencil usually has minimal spacing
          setBrushSpacing={() => {}}
          brushBlendMode={'normal'}
          setBrushBlendMode={() => {}}
        />
      </div>
      
      <Separator />
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="auto-erase"
          checked={false} // Stub
          onCheckedChange={() => {}}
        />
        <Label htmlFor="auto-erase" className="text-sm font-medium leading-none text-muted-foreground">
          Auto Erase (Stub)
        </Label>
      </div>
    </div>
  );
};