import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BrushState } from '@/types/editor';

interface PencilOptionsProps {
  brushState: BrushState;
  setBrushState: (updates: Partial<BrushState>) => void;
  onBrushCommit: () => void;
}

export const PencilOptions: React.FC<PencilOptionsProps> = ({ brushState, setBrushState, onBrushCommit }) => {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label>Size ({brushState.size})</Label>
        <Slider
          min={1}
          max={200}
          step={1}
          value={[brushState.size]}
          onValueChange={([v]) => setBrushState({ size: v })}
          onValueCommit={onBrushCommit}
        />
      </div>
      <div className="grid gap-2">
        <Label>Opacity ({brushState.opacity}%)</Label>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[brushState.opacity]}
          onValueChange={([v]) => setBrushState({ opacity: v })}
          onValueCommit={onBrushCommit}
        />
      </div>
      <div className="grid gap-2">
        <Label>Smoothness ({brushState.smoothness || 0}%)</Label>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[brushState.smoothness || 0]}
          onValueChange={([v]) => setBrushState({ smoothness: v })}
          onValueCommit={onBrushCommit}
        />
      </div>
      <div className="grid gap-2">
        <Label>Shape</Label>
        <Select
          value={brushState.shape as 'circle' | 'square'}
          onValueChange={(shape) => {
            setBrushState({ shape: shape as 'circle' | 'square' });
            onBrushCommit();
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select shape" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="circle">Circle</SelectItem>
            <SelectItem value="square">Square</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};