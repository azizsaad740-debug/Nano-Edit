import { Button } from "@/components/ui/button";
import type { FrameState } from "@/types/editor"; // Import FrameState

interface CropProps {
  onAspectChange: (aspect: number | undefined) => void;
  currentAspect: number | undefined;
}

const aspectRatios = [
  { name: "Free", value: undefined },
  { name: "16:9", value: 16 / 9 },
  { name: "4:3", value: 4 / 3 },
  { name: "Square", value: 1 },
];

const Crop = ({ onAspectChange, currentAspect }: CropProps) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {aspectRatios.map(({ name, value }) => (
        <Button
          key={name}
          variant={currentAspect === value ? "secondary" : "outline"}
          size="sm"
          onClick={() => onAspectChange(value)}
        >
          {name}
        </Button>
      ))}
    </div>
  );
};

// --- Frames Component ---

interface Frame {
  type: 'none' | 'solid';
  width: number;
  color: string;
}

interface FramesProps {
  onFramePresetChange: (type: string, name: string, options?: { width: number; color: string }) => void;
  onFramePropertyChange: (key: 'width' | 'color', value: any) => void;
  onFramePropertyCommit: () => void;
  currentFrame: FrameState; // Use FrameState from types/editor.ts
}

const framePresets = [
  { name: "None", type: 'none' as const, options: { width: 0, color: '#000000' } },
  { name: "Thin White", type: 'solid' as const, options: { width: 10, color: '#FFFFFF' } },
  { name: "Thick White", type: 'solid' as const, options: { width: 25, color: '#FFFFFF' } },
  { name: "Thin Black", type: 'solid' as const, options: { width: 10, color: '#000000' } },
  { name: "Thick Black", type: 'solid' as const, options: { width: 25, color: '#000000' } },
];

const Frames = ({ onFramePresetChange, onFramePropertyChange, onFramePropertyCommit, currentFrame }: FramesProps) => {
  const isCurrent = (preset: typeof framePresets[0]) => {
    if (preset.type === 'none') {
      return currentFrame.type === 'none' || currentFrame.width === 0;
    }
    return currentFrame.type === preset.type &&
           currentFrame.width === preset.options.width &&
           currentFrame.color.toLowerCase() === preset.options.color.toLowerCase();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {framePresets.map((preset) => (
          <Button
            key={preset.name}
            variant="outline"
            size="sm"
            className={cn(
              "justify-start",
              isCurrent(preset) && "bg-accent text-accent-foreground"
            )}
            onClick={() => onFramePresetChange(preset.type, preset.name, preset.options)}
          >
            {preset.name}
          </Button>
        ))}
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="frame-width">Width</Label>
            <div className="flex items-center gap-2">
              <span className="w-10 text-right text-sm text-muted-foreground">{currentFrame.width}px</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => {
                  onFramePropertyChange("width", 0);
                  onFramePropertyCommit();
                }}
              >
                <RotateCcw className="h-3 w-3" />
                <span className="sr-only">Reset Width</span>
              </Button>
            </div>
          </div>
          <Slider
            id="frame-width"
            min={0}
            max={100}
            step={1}
            value={[currentFrame.width]}
            onValueChange={([value]) => onFramePropertyChange("width", value)}
            onValueCommit={onFramePropertyCommit}
          />
        </div>
        {currentFrame.type === 'solid' && currentFrame.width > 0 && (
          <div className="grid gap-2">
            <Label htmlFor="frame-color">Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="frame-color"
                type="color"
                className="p-1 h-10 w-12"
                value={currentFrame.color}
                onChange={(e) => onFramePropertyChange("color", e.target.value)}
                onBlur={onFramePropertyCommit}
              />
              <Input
                type="text"
                className="h-10 flex-1"
                value={currentFrame.color}
                onChange={(e) => onFramePropertyChange("color", e.target.value)}
                onBlur={onFramePropertyCommit}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Frames;