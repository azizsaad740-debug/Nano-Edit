import * as React from "react";
import { cn } from "@/lib/utils";
import type { EditState } from "@/hooks/useEditorState";
import { Globe } from "lucide-react";

type HslColorKey = keyof EditState['hslAdjustments'];

interface HslColorSelectorProps {
  selectedColor: HslColorKey;
  onSelect: (color: HslColorKey) => void;
}

const colorOptions: { key: HslColorKey; name: string; color: string }[] = [
  { key: 'global', name: 'Global', color: 'hsl(var(--foreground))' },
  { key: 'red', name: 'Red', color: '#EF4444' },
  { key: 'orange', name: 'Orange', color: '#F97316' },
  { key: 'yellow', name: 'Yellow', color: '#EAB308' },
  { key: 'green', name: 'Green', color: '#22C55E' },
  { key: 'aqua', name: 'Aqua', color: '#06B6D4' },
  { key: 'blue', name: 'Blue', color: '#3B82F6' },
  { key: 'purple', name: 'Purple', color: '#A855F7' },
  { key: 'magenta', name: 'Magenta', color: '#EC4899' },
];

export const HslColorSelector = ({ selectedColor, onSelect }: HslColorSelectorProps) => {
  return (
    <div className="flex gap-2 justify-between">
      {colorOptions.map(({ key, color }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          className={cn(
            "w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center shrink-0",
            selectedColor === key
              ? "border-primary ring-2 ring-primary/50"
              : "border-transparent hover:border-muted-foreground/50"
          )}
          style={{ 
            backgroundColor: key === 'global' ? 'transparent' : color,
            borderColor: selectedColor === key ? 'hsl(var(--primary))' : 'hsl(var(--border))',
          }}
        >
          {key === 'global' ? (
            <Globe className={cn("h-4 w-4", selectedColor === key ? "text-primary" : "text-muted-foreground")} />
          ) : (
            <div className={cn("w-3 h-3 rounded-full", selectedColor === key ? "bg-background" : "bg-transparent")} />
          )}
        </button>
      ))}
    </div>
  );
};