"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PenTool, Square, Trash2, Copy, Check, ArrowRight } from "lucide-react";
import { showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const mockPaths = [
  { id: 'p1', name: "Work Path 1", type: "work" },
  { id: 'p2', name: "Clipping Path", type: "clipping" },
  { id: 'p3', name: "Vector Mask", type: "mask" },
];

const PathsPanel = () => {
  const [paths, setPaths] = React.useState(mockPaths);
  const [selectedPathId, setSelectedPathId] = React.useState<string | null>(null);
  const selectedPath = paths.find(p => p.id === selectedPathId);

  const handlePathAction = (action: string) => {
    if (!selectedPath) {
      showError("Please select a path first.");
      return;
    }
    showError(`Action "${action}" on path "${selectedPath.name}" is a stub.`);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Path Management</h3>
      <ScrollArea className="h-40 border rounded-md">
        <div className="space-y-1 p-2">
          {paths.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No paths available.</p>
          ) : (
            paths.map((path) => (
              <div
                key={path.id}
                className={cn(
                  "flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-colors",
                  selectedPathId === path.id ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
                )}
                onClick={() => setSelectedPathId(path.id)}
              >
                <div className="flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{path.name}</span>
                </div>
                <span className="text-xs text-muted-foreground capitalize">{path.type}</span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="flex flex-wrap gap-1 justify-start pt-2 border-t">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => showError("New path is a stub.")}>
          <PenTool className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePathAction("Duplicate")} disabled={!selectedPath}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePathAction("Delete")} disabled={!selectedPath}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePathAction("Make Selection")} disabled={!selectedPath}>
          <Check className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePathAction("Stroke Path")} disabled={!selectedPath}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePathAction("Fill Path")} disabled={!selectedPath}>
          <Square className="h-4 w-4" />
        </Button>
      </div>
      
      {selectedPath && selectedPath.type === 'clipping' && (
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-sm font-medium">Clipping Path Settings (Stub)</h4>
          <p className="text-xs text-muted-foreground">Flatness: 0.2px</p>
        </div>
      )}
    </div>
  );
};

export default PathsPanel;