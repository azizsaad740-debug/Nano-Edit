"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  PenTool,
  Brush,
  Type,
  Wand2,
  XCircle,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BrushOptions } from "./BrushOptions";
import type { BrushState, Point } from "@/hooks/useEditorState";

interface ToolsBarProps {
  activeTool: string;
  setActiveTool: (tool: "lasso" | "brush" | "text" | null) => void;
  openGenerativeDialog: () => void;
  brushState: BrushState;
  setBrushState: (updates: Partial<BrushState>) => void;
  selectionPath: Point[] | null;
  onClearSelection: () => void;
}

export const ToolsBar = ({
  activeTool,
  setActiveTool,
  openGenerativeDialog,
  brushState,
  setBrushState,
  selectionPath,
  onClearSelection,
}: ToolsBarProps) => {
  const hasSelection = selectionPath && selectionPath.length > 0;

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
          <p>Lasso selection (L)</p>
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
          <p>Brush tool (B)</p>
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
          <p>Text tool (T)</p>
        </TooltipContent>
      </Tooltip>

      {activeTool === 'brush' && (
        <BrushOptions
          brushSize={brushState.size}
          setBrushSize={(size) => setBrushState({ size })}
          brushOpacity={brushState.opacity}
          setBrushOpacity={(opacity) => setBrushState({ opacity })}
          brushColor={brushState.color}
          setBrushColor={(color) => setBrushState({ color })}
        />
      )}

      {activeTool === "lasso" && (
        <>
          {hasSelection && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onClearSelection}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear selection (Esc)</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="sm" onClick={openGenerativeDialog} disabled={!hasSelection}>
                <Wand2 className="h-4 w-4 mr-1" />
                Generate
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open generative fill dialog</p>
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
};