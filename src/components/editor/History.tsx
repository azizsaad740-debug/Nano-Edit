import { Button } from "@/components/ui/button";
import { Undo2, Redo2 } from "lucide-react";

interface HistoryProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const History = ({ onUndo, onRedo, canUndo, canRedo }: HistoryProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo}>
        <Undo2 className="h-4 w-4 mr-2" />
        Undo
      </Button>
      <Button variant="outline" size="sm" onClick={onRedo} disabled={!canRedo}>
        <Redo2 className="h-4 w-4 mr-2" />
        Redo
      </Button>
    </div>
  );
};

export default History;