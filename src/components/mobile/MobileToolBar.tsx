"use client";

import * as React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Brush, Eraser, Crop, Type, MousePointer2, Move } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveTool } from "@/types/editor";

interface MobileToolBarProps {
  activeTool: ActiveTool | null;
  setActiveTool: (tool: ActiveTool | null) => void;
}

const tools: { name: string; icon: React.ElementType; tool: ActiveTool | 'select' }[] = [
  { name: "Move", icon: Move, tool: "move" },
  { name: "Brush", icon: Brush, tool: "brush" },
  { name: "Eraser", icon: Eraser, tool: "eraser" },
  { name: "Select", icon: MousePointer2, tool: "lasso" }, // Grouping selection tools under 'Select'
  { name: "Crop", icon: Crop, tool: "crop" },
  { name: "Text", icon: Type, tool: "text" },
];

export const MobileToolBar: React.FC<MobileToolBarProps> = ({ activeTool, setActiveTool }) => {
  const handleToolClick = (tool: ActiveTool | 'select') => {
    if (tool === 'select') {
      // Default to lasso tool for 'Select' group
      setActiveTool('lasso');
    } else {
      setActiveTool(tool);
    }
  };

  const isActive = (tool: ActiveTool | 'select') => {
    if (tool === 'select') {
      return activeTool?.includes('marquee') || activeTool?.includes('lasso') || activeTool?.includes('select');
    }
    return activeTool === tool;
  };

  return (
    <div className="w-full bg-background border-t border-border/50 shrink-0">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 p-2">
          {tools.map(({ name, icon: Icon, tool }) => (
            <Button
              key={name}
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col h-16 w-16 p-1 shrink-0",
                isActive(tool) && "bg-primary/10 text-primary border border-primary/50"
              )}
              onClick={() => handleToolClick(tool)}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs mt-1">{name}</span>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};