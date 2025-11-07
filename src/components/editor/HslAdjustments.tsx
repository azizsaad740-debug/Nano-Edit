import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { HslAdjustment, HslAdjustmentsState, HslColorKey } from '@/types/editor';
import { isDefaultHsl } from '@/utils/filterUtils';
import { HslColorSelector } from './HslColorSelector';

interface HslAdjustmentsProps {
  hslAdjustments: HslAdjustmentsState;
  onAdjustmentChange: (colorKey: HslColorKey, key: keyof HslAdjustment, value: number) => void;
  onAdjustmentCommit: (colorKey: HslColorKey, key: keyof HslAdjustment, value: number) => void;
  customColor: string;
  setCustomColor: (color: string) => void;
}

export const HslAdjustments: React.FC<HslAdjustmentsProps> = ({ hslAdjustments, onAdjustmentChange, onAdjustmentCommit, customColor, setCustomColor }) => {
  const [selectedColor, setSelectedColor] = React.useState<HslColorKey>('master');
  const currentAdjustment = hslAdjustments[selectedColor];

  const handleReset = (key: keyof HslAdjustment) => {
    onAdjustmentChange(selectedColor, key, 0);
    onAdjustmentCommit(selectedColor, key, 0);
  };

  return (
    <div className="space-y-4">
      <HslColorSelector selectedColor={selectedColor} setSelectedColor={setSelectedColor} />

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="hue">Hue</Label>
          <div className="flex items-center gap-2">
            <span className="w-10 text-right text-sm text-muted-foreground">{currentAdjustment.hue}°</span>
            <button onClick={() => handleReset('hue')} className="text-muted-foreground hover:text-foreground transition-colors">
              Reset
            </button>
          </div>
        </div>
        <Slider
          id="hue"
          min={-180}
          max={180}
          step={1}
          value={[currentAdjustment.hue]}
          onValueChange={([value]) => onAdjustmentChange(selectedColor, 'hue', value)}
          onValueCommit={([value]) => onAdjustmentCommit(selectedColor, 'hue', value)}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="saturation">Saturation</Label>
          <div className="flex items-center gap-2">
            <span className="w-10 text-right text-sm text-muted-foreground">{currentAdjustment.saturation}%</span>
            <button onClick={() => handleReset('saturation')} className="text-muted-foreground hover:text-foreground transition-colors">
              Reset
            </button>
          </div>
        </div>
        <Slider
          id="saturation"
          min={-100}
          max={100}
          step={1}
          value={[currentAdjustment.saturation]}
          onValueChange={([value]) => onAdjustmentChange(selectedColor, 'saturation', value)}
          onValueCommit={([value]) => onAdjustmentCommit(selectedColor, 'saturation', value)}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="lightness">Lightness</Label>
          <div className="flex items-center gap-2">
            <span className="w-10 text-right text-sm text-muted-foreground">{currentAdjustment.lightness}%</span>
            <button onClick={() => handleReset('lightness')} className="text-muted-foreground hover:text-foreground transition-colors">
              Reset
            </button>
          </div>
        </div>
        <Slider
          id="lightness"
          min={-100}
          max={100}
          step={1}
          value={[currentAdjustment.lightness]}
          onValueChange={([value]) => onAdjustmentChange(selectedColor, 'lightness', value)}
          onValueCommit={([value]) => onAdjustmentCommit(selectedColor, 'lightness', value)}
        />
      </div>
      
      {selectedColor === 'master' && (
        <div className="grid gap-2 pt-4 border-t">
          <Label htmlFor="custom-color-picker">Custom Color Picker (Stub)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="custom-color-picker"
              type="color"
              className="p-1 h-10 w-12"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
            />
            <Input
              type="text"
              className="h-10 flex-1"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Use the eyedropper tool to select a color from the image to target specific HSL ranges.
          </p>
        </div>
      )}
    </div>
  );
};