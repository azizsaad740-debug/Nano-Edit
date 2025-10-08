"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  PenTool,
  Brush,
  Type,
  Wand2,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool === "lasso" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTool("lasso")}
          >
            <PenTool className="h-4 w-4 mr-1" />
            Lasso
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Lasso selection (Ctrl+L)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool === "brush" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTool("brush")}
          >
            <Brush className="h-4 w-4 mr-1" />
            Brush
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Brush tool (Ctrl+B)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTool("text")}
          >
            <Type className="h-4 w-4 mr-1" />
            Text
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Text tool (Ctrl+T)</p>
        </TooltipContent>
      </Tooltip>

      {activeTool === "lasso" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="sm" onClick={openGenerativeDialog}>
              <Wand2 className="h-4 w-4 mr-1" />
              Generate
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Open generative fill dialog</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};