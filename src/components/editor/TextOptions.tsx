import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider'; // Import Slider
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, Globe } from 'lucide-react';
import type { TextLayerData } from '@/types/editor';

interface TextOptionsProps {
  layer: TextLayerData;
  handleUpdate: (updates: Partial<TextLayerData>) => void;
  handleCommit: (name: string) => void;
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
}

export const TextOptions: React.FC<TextOptionsProps> = ({ layer, handleUpdate, handleCommit, systemFonts, customFonts, onOpenFontManager }) => {
  // ... (existing logic)

  return (
    <div className="grid gap-4">
      {/* ... (other controls) */}
      
      {/* Text Shadow Controls */}
      <div className="grid gap-2">
        <Label>Text Shadow</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1">
            <Label htmlFor="shadow-x">Offset X</Label>
            <Slider min={-20} max={20} step={1} value={[layer.textShadow?.offsetX || 0]} onValueChange={([v]) => handleTextShadowChange('offsetX', v)} onValueCommit={handleTextShadowCommit} /> {/* Fix 32 */}
          </div>
          <div className="grid gap-1">
            <Label htmlFor="shadow-y">Offset Y</Label>
            <Slider min={-20} max={20} step={1} value={[layer.textShadow?.offsetY || 0]} onValueChange={([v]) => handleTextShadowChange('offsetY', v)} onValueCommit={handleTextShadowCommit} /> {/* Fix 32 */}
          </div>
        </div>
        {/* ... (rest of shadow controls) */}
      </div>
      
      {/* ... (rest of file) */}
    </div>
  );
};