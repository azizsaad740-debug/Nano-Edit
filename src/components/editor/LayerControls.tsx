import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, LockOpen, Square, Move, Crop, Brush, Pencil, Search, Type } from "lucide-react";
import type { Layer } from "@/types/editor";
import { cn } from "@/lib/utils";

interface LayerControlsProps {
  selectedLayer: Layer | undefined;
  onLayerPropertyCommit: (updates: Partial<Layer>, historyName: string) => void;
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
}

const blendModes = [
  "normal", "multiply", "screen", "overlay", "darken", "lighten", 
  "color-dodge", "color-burn", "hard-light", "soft-light", "difference", 
  "exclusion", "hue", "saturation", "color", "luminosity"
];

// Placeholder for lock/fill functionality (Fill is currently tied to Opacity in our model)
const lockOptions = [
  { name: "Lock Transparency", icon: Square, key: "lockTransparency" },
  { name: "Lock Image Pixels", icon: Brush, key: "lockPixels" },
  { name: "Lock Position", icon: Move, key: "lockPosition" },
  { name: "Lock All", icon: Lock, key: "lockAll" },
];

export const LayerControls = ({
  selectedLayer,
  onLayerPropertyCommit,
  onLayerOpacityChange,
  onLayerOpacityCommit,
}: LayerControlsProps) => {
  const isBackground = selectedLayer?.type === 'image';
  const isDisabled = !selectedLayer || isBackground;

  const handleBlendModeChange = (blendMode: string) => {
    if (selectedLayer) {
      onLayerPropertyCommit({ blendMode }, `Set Blend Mode to ${blendMode}`);
    }
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    const value = parseInt(e.target.value, 10);
    const opacity = Math.max(0, Math.min(100, value || 0));
    onLayerOpacityChange(opacity);
  };

  const handleOpacityCommit = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    onLayerOpacityCommit();
  };

  const currentOpacity = selectedLayer?.opacity ?? 100;

  return (
    <div className="space-y-2 p-2 border-b">
      {/* Filter/Sort Bar (Stubbed) */}
      <div className="flex items-center gap-2">
        <Select defaultValue="kind">
          <SelectTrigger className="w-[100px] h-8 text-xs">
            <Search className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Kind" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kind">Kind</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
        {/* Placeholder icons for filtering/sorting */}
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <Square className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <Brush className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <Type className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <Crop className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <LockOpen className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Blend Mode / Opacity / Fill Bar */}
      <div className="flex items-center gap-2">
        <Select
          value={selectedLayer?.blendMode || 'normal'}
          onValueChange={handleBlendModeChange}
          disabled={isDisabled}
        >
          <SelectTrigger className="w-[100px] h-8 text-xs capitalize">
            <SelectValue placeholder="Normal" />
          </SelectTrigger>
          <SelectContent>
            {blendModes.map(mode => (
              <SelectItem key={mode} value={mode} className="capitalize">{mode}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Opacity:</span>
          <Input
            type="number"
            min={0}
            max={100}
            value={currentOpacity}
            onChange={handleOpacityChange}
            onBlur={handleOpacityCommit}
            className="w-14 h-8 p-1 text-right text-xs"
            disabled={isDisabled}
          />
          <span>%</span>
        </div>
      </div>

      {/* Lock / Fill Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Lock:</span>
          {lockOptions.map((option) => (
            <Button 
              key={option.key} 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              disabled={isDisabled}
            >
              <option.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Fill:</span>
          <Input
            type="number"
            min={0}
            max={100}
            value={currentOpacity} // Using opacity for fill since our model doesn't distinguish yet
            className="w-14 h-8 p-1 text-right text-xs"
            disabled={isDisabled}
          />
          <span>%</span>
        </div>
      </div>
    </div>
  );
};