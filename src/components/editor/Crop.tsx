import { Button } from "@/components/ui/button";

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

export default Crop;