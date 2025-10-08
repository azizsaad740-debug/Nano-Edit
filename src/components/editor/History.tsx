import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HistoryProps {
  history: { name: string }[];
  currentIndex: number;
  onJump: (index: number) => void;
}

const History = ({ history, currentIndex, onJump }: HistoryProps) => {
  return (
    <ScrollArea className="h-48">
      <div className="flex flex-col gap-1 pr-4">
        {history.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start text-left",
              currentIndex === index && "bg-accent text-accent-foreground"
            )}
            onClick={() => onJump(index)}
          >
            {item.name}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default History;