import React from 'react';
import { cn } from '@/lib/utils';
import { Globe, Palette } from 'lucide-react';
import type { HslColorKey } from '@/types/editor';

interface HslColorSelectorProps {
  selectedColor: HslColorKey;
  setSelectedColor: (key: HslColorKey) => void;
}

export const HslColorSelector: React.FC<HslColorSelectorProps> = ({ selectedColor, setSelectedColor }) => {
  const colorOptions: { key: HslColorKey; name: string; color: string }[] = [ // Fix 366
    { key: 'master', name: 'Master', color: 'hsl(var(--foreground))' },
    { key: 'red', name: 'Red', color: '#EF4444' },
    { key: 'yellow', name: 'Yellow', color: '#EAB308' },
    { key: 'green', name: 'Green', color: '#22C55E' },
    { key: 'cyan', name: 'Cyan', color: '#06B6D4' },
    { key: 'blue', name: 'Blue', color: '#3B82F6' },
    { key: 'magenta', name: 'Magenta', color: '#A855F7' },
  ];

  return (
    <div className="flex space-x-2">
      {colorOptions.map(({ key, name, color }) => (
        <div
          key={key}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all",
            selectedColor === key ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-muted-foreground',
            key === 'master' ? 'border border-muted-foreground' : 'border-none' // Fix 367, 368
          )}
          style={{ backgroundColor: key === 'master' ? 'transparent' : color }} // Fix 13, 14, 369, 370, 371
          onClick={() => setSelectedColor(key)}
        >
          {key === 'master' && <Globe className="h-4 w-4 text-muted-foreground" />} {/* Fix 15, 16, 17, 372, 373, 374 */}
          {key === 'magenta' && selectedColor !== 'magenta' && <Palette className="h-4 w-4 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );
};