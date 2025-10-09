"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  PenTool,
  Brush,
  Type,
  Crop as CropIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Tool = "lasso" | "brush" | "text" | "crop";

interface ToolsPanelProps {
  activeTool: Tool | null;
  setActiveTool: (tool: Tool | null) => void;
}

const tools: { name: string; icon: React.ElementType; tool: Tool; shortcut: string }[] = [
  { name: "Lasso", icon: PenTool, tool: "lasso", shortcut: "L" },
  { name: "Brush", icon: Brush, tool: "brush", shortcut: "B" },
  { name: "Text", icon: Type, tool: "text", shortcut: "T" },
  { name: "Crop", icon: CropIcon, tool: "crop", shortcut: "C" },
];

export const ToolsPanel = ({ activeTool, setActiveTool }: ToolsPanelProps) => {
  return (
    <aside className="h-full border-r bg-muted/40 p-2">
      <TooltipProvider delayDuration={0}>
        <div className="flex flex-col items-center gap-2">
          {tools.map((item) => (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === item.tool ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setActiveTool(item.tool === activeTool ? null : item.tool)}
                  className="w-10 h-10"
                >
                  <item.icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.name} ({item.shortcut})</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </aside>
  );
};