import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const filters = [
  { name: "None", value: "" },
  { name: "Vintage", value: "sepia(0.6) contrast(0.9) brightness(1.1) saturate(1.2)" },
  { name: "Cinematic", value: "contrast(1.2) saturate(1.1) brightness(0.9)" },
  { name: "Warm Glow", value: "sepia(0.4) saturate(1.5) contrast(1.1)" },
  { name: "Black & White", value: "grayscale(1)" },
  { name: "Cool Pop", value: "contrast(1.1) saturate(1.3) hue-rotate(-10deg)" },
];

interface FiltersProps {
  onFilterChange: (filterValue: string) => void;
  selectedFilter: string;
}

const Filters = ({ onFilterChange, selectedFilter }: FiltersProps) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.name}
          variant="outline"
          size="sm"
          className={cn(
            "justify-start",
            selectedFilter === filter.value && "bg-accent text-accent-foreground"
          )}
          onClick={() => onFilterChange(filter.value)}
        >
          {filter.name}
        </Button>
      ))}
    </div>
  );
};

export default Filters;