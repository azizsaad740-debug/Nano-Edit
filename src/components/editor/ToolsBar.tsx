"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  PenTool,
  Brush,
  Type,
  Wand2,
} from "lucide-react";

interface ToolsBarProps {
  activeTool: string;
  setActiveTool: (tool: "lasso" | "brush" | "text" | null) => void;
  openGenerativeDialog: () => void;
}

export const ToolsBar = ({
  activeTool,
  setActiveTool,
  openGenerativeDialog,
}: ToolsBarProps) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
      <Button
        variant={activeTool === "lasso" ? "default" : "outline"}
        size="sm"
        onClick={() => setActiveTool("lasso")}
      >
        <PenTool className="h-4 w-4 mr-1" />
        Lasso
      </Button>
      <Button
        variant={activeTool === "brush" ? "default" : "outline"}
        size="sm"
        onClick={() => setActiveTool("brush")}
      >
        <Brush className="h-4 w-4 mr-1" />
        Brush
      </Button>
      <Button
        variant={activeTool === "text" ? "default" : "outline"}
        size="sm"
        onClick={() => setActiveTool("text")}
      >
        <Type className="h-4 w-4 mr-1" />
        Text
      </Button>
      {activeTool === "lasso" && (
        <Button
          variant="secondary"
          size="sm"
          onClick={openGenerativeDialog}
        >
          <Wand2 className="h-4 w-4 mr-1" />
          Generate
        </Button>
      )}
    </div>
  );
};