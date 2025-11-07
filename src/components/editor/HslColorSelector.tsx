import React from 'react';
import { cn } from '@/lib/utils';
import { Globe, Palette } from 'lucide-react';
import type { HslColorKey } from '@/types/editor';

interface HslColorSelectorProps {
  selectedColor: HslColorKey;
  setSelectedColor: (key: HslColorKey) => void;
}

export const HslColorSelector: React.FC<HslColorSelectorProps> = ({ selectedColor, setSelectedColor }) => {
  const colorOptions: { key: HslColorKey; name: string; color: string }[] = [
    { key: 'master', name: 'Master', color: 'hsl(var(--foreground))' },
    { key: 'red', name: 'Red', color: '#EF4444' },
    { key: 'orange', name: 'Orange', color: '#F97316' },
    { key: 'yellow', name: 'Yellow', color: '#EAB308' },
    { key: 'green', name: 'Green', color: '#22C55E' },
    { key: 'aqua', name: 'Cyan', color: '#06B6D4' }, // FIX 30: Changed key from 'cyan' to 'aqua'
    { key: 'blue', name: 'Blue', color: '#3B82F6' },
    { key: 'purple', name: 'Purple', color: '#A855F7' },
    { key: 'magenta', name: 'Magenta', color: '#EC4899' },
  ];

  return (
    <div className="flex space-x-2">
      {colorOptions.map(({ key, name, color }) => (
        <div
          key={key}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all",
            selectedColor === key ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-muted-foreground',
            key === 'master' ? 'border border-muted-foreground' : 'border-none'
          )}
          style={{ backgroundColor: key === 'master' ? 'transparent' : color }}
          onClick={() => setSelectedColor(key)}
        >
          {key === 'master' && <Globe className="h-4 w-4 text-muted-foreground" />}
          {/* Removed redundant Palette icon logic */}
        </div>
      ))}
    </div>
  );
};