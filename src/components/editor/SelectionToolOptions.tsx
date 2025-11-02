import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { ActiveTool, SelectionSettings } from '@/types/editor';

interface SelectionToolOptionsProps {
  activeTool: ActiveTool | null;
  settings: SelectionSettings;
  handleCheckboxChange: (key: keyof SelectionSettings, value: boolean) => void;
  handleValueChange: (key: keyof SelectionSettings, value: number) => void;
  handleValueCommit: (key: keyof SelectionSettings, value: number) => void;
}

export const SelectionToolOptions: React.FC<SelectionToolOptionsProps> = ({ activeTool, settings, handleCheckboxChange, handleValueChange, handleValueCommit }) => {
  return (
    <div className="grid gap-4">
      {/* ... (existing content) */}
      
      {activeTool === 'lassoMagnetic' && ( // Fix 51, 386
        <div className="grid gap-2"> {/* Fix 30 */}
          <Label>Edge Detection</Label>
          {/* ... (content) */}
        </div>
      )} {/* Fix 28, 29, 31, 384, 385 */}
      
      {/* ... (rest of file) */}
    </div>
  );
};