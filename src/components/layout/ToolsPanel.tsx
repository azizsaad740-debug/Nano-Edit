"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Brush,
  Type,
  Crop as CropIcon,
  Eraser,
  Pipette,
  Square,
  RectangleHorizontal,
  Circle,
  Triangle,
  ChevronDown,
  Hand, // Import Hand icon
  Palette, // Import Palette icon for Gradient
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Layer } from "@/hooks/useEditorState";
import { ColorTool } from "./ColorTool"; // Import ColorTool

type Tool = "lasso" | "brush" | "text" | "crop" | "eraser" | "eyedropper" | "shape" | "move" | "gradient"; // Added 'gradient' tool

interface ToolsPanelProps {
  activeTool: Tool | null;
  setActiveTool: (tool: Tool | null) => void;
  selectedShapeType: Layer['shapeType'] | null;
  setSelectedShapeType: (type: Layer['shapeType'] | null) => void;
  foregroundColor: string; // New prop
  onForegroundColorChange: (color: string) => void; // New prop
  backgroundColor: string; // New prop
  onBackgroundColorChange: (color: string) => void; // New prop
  onSwapColors: () => void; // New prop
}

const tools: { name: string; icon: React.ElementType; tool: Tool; shortcut: string }[] = [
  { name: "Move", icon: Hand, tool: "move", shortcut: "M" }, // New Move tool
  { name: "Lasso", icon: Pencil, tool: "lasso", shortcut: "L" },
  { name: "Brush", icon: Brush, tool: "brush", shortcut: "B" },
  { name: "Eraser", icon: Eraser, tool: "eraser", shortcut: "E" },
  { name: "Text", icon: Type, tool: "text", shortcut: "T" },
  { name: "Shape", icon: Square, tool: "shape", shortcut: "P" },
  { name: "Gradient", icon: Palette, tool: "gradient", shortcut: "G" }, // New Gradient tool
  { name: "Crop", icon: CropIcon, tool: "crop", shortcut: "C" },
  { name: "Eyedropper", icon: Pipette, tool: "eyedropper", shortcut: "I" },
];

const shapeSubTools: { name: string; icon: React.ElementType; type: Layer['shapeType'] }[] = [
  { name: "Rectangle", icon: RectangleHorizontal, type: "rect" },
  { name: "Circle", icon: Circle, type: "circle" },
  { name: "Triangle", icon: Triangle, type: "triangle" },
];

export const ToolsPanel = ({ 
  activeTool, 
  setActiveTool, 
  selectedShapeType, 
  setSelectedShapeType,
  foregroundColor, // Destructure new props
  onForegroundColorChange,
  backgroundColor,
  onBackgroundColorChange,
  onSwapColors,
}: ToolsPanelProps) => {
  const currentShapeIcon = React.useMemo(() => {
    const subTool = shapeSubTools.find(st => st.type === selectedShapeType);
    return subTool ? subTool.icon : Square;
  }, [selectedShapeType]);

  const handleShapeToolSelect = (type: Layer['shapeType']) => {
    setActiveTool("shape");
    setSelectedShapeType(type);
  };

  return (
    <aside className="h-full border-r bg-muted/40 p-2">
      <TooltipProvider delayDuration={0}>
        <div className="flex flex-col items-center gap-2">
          <ColorTool
            foregroundColor={foregroundColor}
            onForegroundColorChange={onForegroundColorChange}
            backgroundColor={backgroundColor}
            onBackgroundColorChange={onBackgroundColorChange}
            onSwapColors={onSwapColors}
          />
          <div className="w-full h-px bg-border my-2" /> {/* Separator */}
          {tools.map((item) => {
            if (item.tool === "shape") {
              return (
                <DropdownMenu key={item.name}>
                  <Tooltip>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={activeTool === item.tool ? "secondary" : "ghost"}
                        size="icon"
                        className={cn("w-10 h-10", activeTool === item.tool && "bg-secondary")}
                        onClick={() => setActiveTool(item.tool === activeTool ? null : item.tool)}
                      >
                        {React.createElement(currentShapeIcon, { className: "h-5 w-5" })}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <TooltipContent side="right">
                      <p>{item.name} ({item.shortcut})</p>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent side="right" align="start" className="w-40">
                    {shapeSubTools.map((subTool) => (
                      <DropdownMenuItem key={subTool.name} onClick={() => handleShapeToolSelect(subTool.type)}>
                        {React.createElement(subTool.icon, { className: "h-4 w-4 mr-2" })}
                        {subTool.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTool === item.tool ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setActiveTool(item.tool === activeTool ? null : item.tool)}
                    className={cn("w-10 h-10", activeTool === item.tool && "bg-secondary")}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.name} ({item.shortcut})</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </aside>
  );
};