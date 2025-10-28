import { cn } from "@/lib/utils";
import type { EditState, HslColorKey } from "@/types/editor";
import { Globe, Palette } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface HslColorSelectorProps {
  selectedColor: HslColorKey;
  onSelect: (color: HslColorKey) => void;
  customColor: string; // New prop for custom color hex
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
];

export const HslColorSelector = ({ selectedColor, onSelect, customColor }: HslColorSelectorProps) => {
  
  const finalColorOptions = [
    ...colorOptions,
    // Use 'magenta' key internally but display it as 'Custom'
    { key: 'magenta' as HslColorKey, name: 'Custom', color: customColor },
  ];

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex space-x-2 pb-2">
        {finalColorOptions.map(({ key, name, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={cn(
              "flex flex-col items-center justify-center p-1.5 rounded-md transition-all shrink-0 w-14 h-14 text-xs font-medium",
              selectedColor === key
                ? "bg-accent text-accent-foreground ring-2 ring-primary/50"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full mb-1 flex items-center justify-center",
                key === 'global' ? 'border border-muted-foreground' : 'border-none'
              )}
              style={{ backgroundColor: key === 'global' ? 'transparent' : color }}
            >
              {key === 'global' && <Globe className="h-4 w-4 text-muted-foreground" />}
              {key === 'magenta' && selectedColor !== 'magenta' && <Palette className="h-4 w-4 text-muted-foreground" />}
            </div>
            {name}
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};