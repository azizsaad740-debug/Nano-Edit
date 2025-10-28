import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Undo2, Redo2 } from "lucide-react";
import History from "@/components/editor/History";
import * as React from "react";

interface HistoryPanelProps {
  history: { name: string }[];
  currentIndex: number;
  onJump: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const HistoryPanel = ({ history, currentIndex, onJump, onUndo, onRedo, canUndo, canRedo }: HistoryPanelProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">History States</h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onUndo} disabled={!canUndo}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onRedo} disabled={!canRedo}>
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <History history={history} currentIndex={currentIndex} onJump={onJump} />
      
      <div className="space-y-2 pt-4 border-t">
        <h3 className="text-sm font-medium">History Log (Stub)</h3>
        <p className="text-xs text-muted-foreground">
          Detailed session log and metadata tracking is not yet implemented.
        </p>
      </div>
    </div>
  );
};

export default HistoryPanel;