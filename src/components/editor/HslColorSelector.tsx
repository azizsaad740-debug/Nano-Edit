import * as React from "react";
import { cn } from "@/lib/utils";
import type { EditState } from "@/hooks/useEditorState";
import { Globe, Circle } from "lucide-react";

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
    <div className="flex flex-wrap gap-2 justify-start">
      {colorOptions.map(({ key, name, color }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          className={cn(
            "flex items-center justify-center h-8 px-3 rounded-full text-xs font-medium transition-colors border",
            selectedColor === key
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground hover:bg-muted border-border"
          )}
        >
          {key === 'global' ? (
            <Globe className="h-3 w-3 mr-1" />
          ) : (
            <Circle className="h-3 w-3 mr-1" style={{ fill: color, stroke: color }} />
          )}
          {name}
        </button>
      ))}
    </div>
  );
};