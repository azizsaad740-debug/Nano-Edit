import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const blendModes = ['Normal', 'Multiply', 'Screen', 'Overlay', 'Darken', 'Lighten', 'Color Dodge', 'Color Burn', 'Hard Light', 'Soft Light', 'Difference', 'Exclusion', 'Hue', 'Saturation', 'Color', 'Luminosity'];

const LayerControls: React.FC = () => {
  // Placeholder state/handlers
  const [opacity, setOpacity] = React.useState(100);
  const [blendMode, setBlendMode] = React.useState('Normal');

  return (
    <div className="p-2 border-b flex items-center gap-4">
      {/* Opacity Control */}
      <div className="flex items-center gap-2 w-1/2">
        <Label htmlFor="opacity-slider" className="text-xs whitespace-nowrap w-12">
          Opacity ({opacity}%)
        </Label>
        <Slider
          id="opacity-slider"
          value={[opacity]}
          max={100}
          step={1}
          onValueChange={(v) => setOpacity(v[0])}
          className="flex-grow"
        />
      </div>

      {/* Blend Mode Control */}
      <div className="flex items-center gap-2 w-1/2">
        <Label htmlFor="blend-mode-select" className="text-xs whitespace-nowrap w-12">
          Blend
        </Label>
        <Select value={blendMode} onValueChange={setBlendMode}>
          <SelectTrigger id="blend-mode-select" className="h-8 text-xs">
            <SelectValue placeholder="Select Blend Mode" />
          </SelectTrigger>
          <SelectContent>
            {blendModes.map((mode) => (
              <SelectItem key={mode} value={mode} className="text-xs">
                {mode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LayerControls;