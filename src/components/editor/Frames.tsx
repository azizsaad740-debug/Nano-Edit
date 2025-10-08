import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Frame {
  type: 'none' | 'solid';
  width: number;
  color: string;
}

interface FramesProps {
  onFrameChange: (type: string, name: string, options?: { width: number; color: string }) => void;
  currentFrame: Frame;
}

const framePresets = [
  { name: "None", type: 'none' },
  { name: "Thin White", type: 'solid', options: { width: 10, color: '#FFFFFF' } },
  { name: "Thick White", type: 'solid', options: { width: 25, color: '#FFFFFF' } },
  { name: "Thin Black", type: 'solid', options: { width: 10, color: '#000000' } },
  { name: "Thick Black", type: 'solid', options: { width: 25, color: '#000000' } },
];

const Frames = ({ onFrameChange, currentFrame }: FramesProps) => {
  const isCurrent = (preset: typeof framePresets[0]) => {
    return currentFrame.type === preset.type &&
           currentFrame.width === (preset.options?.width ?? 0) &&
           currentFrame.color === (preset.options?.color ?? '#000000');
  };

  return (
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
          onClick={() => onFrameChange(preset.type, preset.name, preset.options)}
        >
          {preset.name}
        </Button>
      ))}
    </div>
  );
};

export default Frames;