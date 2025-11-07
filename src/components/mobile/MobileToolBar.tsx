"use client";

import * as React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Brush, Eraser, Crop, Type, MousePointer2, Move, Pencil, Palette, PaintBucket, Stamp, History, Focus, Pipette, SquareDashedMousePointer, Wand2, ScanEye, Square, Circle, Triangle, Minus, ArrowRight, PenTool, Droplet, Paintbrush } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveTool } from "@/types/editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button"; // Added Button import

interface MobileToolBarProps {
  activeTool: ActiveTool | null;
  setActiveTool: (tool: ActiveTool | null) => void;
}

// Grouped tools for dropdowns
const toolGroups: { 
  defaultTool: ActiveTool; 
  icon: React.ElementType; 
  group: string; 
  tools: { name: string; icon: React.ElementType; tool: ActiveTool }[] 
}[] = [
  {
    defaultTool: "marqueeRect",
    icon: SquareDashedMousePointer,
    group: "selection",
    tools: [
      { name: "Rectangular Marquee", icon: SquareDashedMousePointer, tool: "marqueeRect" },
      { name: "Elliptical Marquee", icon: Circle, tool: "marqueeEllipse" },
      { name: "Lasso Tool", icon: MousePointer2, tool: "lasso" },
      { name: "Polygonal Lasso", icon: PenTool, tool: "lassoPoly" },
      { name: "Quick Selection", icon: Wand2, tool: "quickSelect" },
      { name: "Magic Wand", icon: Wand2, tool: "magicWand" },
      { name: "Object Selection", icon: ScanEye, tool: "objectSelect" },
    ],
  },
  {
    defaultTool: "brush",
    icon: Brush,
    group: "paint",
    tools: [
      { name: "Brush Tool", icon: Brush, tool: "brush" },
      { name: "Pencil Tool", icon: Pencil, tool: "pencil" },
      { name: "Eraser Tool", icon: Eraser, tool: "eraser" },
      { name: "Paint Bucket", icon: PaintBucket, tool: "paintBucket" },
      { name: "Gradient Tool", icon: Palette, tool: "gradient" },
    ],
  },
  {
    defaultTool: "cloneStamp",
    icon: Stamp,
    group: "stamp",
    tools: [
      { name: "Clone Stamp", icon: Stamp, tool: "cloneStamp" },
      { name: "Pattern Stamp", icon: Stamp, tool: "patternStamp" },
    ],
  },
  {
    defaultTool: "blurBrush",
    icon: Droplet,
    group: "retouch",
    tools: [
      { name: "Blur Brush", icon: Droplet, tool: "blurBrush" },
      { name: "Sharpen Tool", icon: Focus, tool: "sharpenTool" },
      { name: "Selection Brush", icon: Paintbrush, tool: "selectionBrush" },
    ],
  },
  {
    defaultTool: "historyBrush",
    icon: History,
    group: "history",
    tools: [
      { name: "History Brush", icon: History, tool: "historyBrush" },
      { name: "Art History Brush", icon: History, tool: "artHistoryBrush" },
    ],
  },
  {
    defaultTool: "shape",
    icon: Square,
    group: "shape",
    tools: [
      { name: "Rectangle", icon: Square, tool: "shape" },
      { name: "Circle", icon: Circle, tool: "shape" },
      { name: "Triangle", icon: Triangle, tool: "shape" },
      { name: "Line", icon: Minus, tool: "shape" },
      { name: "Arrow", icon: ArrowRight, tool: "shape" },
      { name: "Custom Path", icon: PenTool, tool: "shape" },
    ],
  },
];

const singleTools: { name: string; icon: React.ElementType; tool: ActiveTool }[] = [
  { name: "Move", icon: Move, tool: "move" },
  { name: "Crop", icon: Crop, tool: "crop" }, // Corrected CropIcon to Crop
  { name: "Text", icon: Type, tool: "text" },
  { name: "Eyedropper", icon: Pipette, tool: "eyedropper" },
];

export const MobileToolBar: React.FC<MobileToolBarProps> = ({ activeTool, setActiveTool }) => {
  
  const isToolActive = (tool: ActiveTool) => activeTool === tool;
  
  const getActiveToolInGroup = (group: string) => {
    const groupTools = toolGroups.find(g => g.group === group)?.tools;
    return groupTools?.find(t => isToolActive(t.tool));
  };

  const handleToolSelect = (tool: ActiveTool) => {
    // Toggle logic: if the tool is already active, set it to null (deselect)
    const toolToSet = (tool === activeTool) ? null : tool;
    setActiveTool(toolToSet);
  };

  const renderToolButton = (tool: ActiveTool, Icon: React.ElementType, name: string) => (
    <Button
      key={tool}
      variant="ghost"
      size="sm"
      className={cn(
        "flex flex-col h-16 w-16 p-1 shrink-0",
        isToolActive(tool) && "bg-primary/10 text-primary border border-primary/50"
      )}
      onClick={() => handleToolSelect(tool)}
    >
      <Icon className="h-6 w-6" />
      <span className="text-xs mt-1">{name}</span>
    </Button>
  );

  const renderGroupDropdown = (groupData: typeof toolGroups[0]) => {
    const currentTool = getActiveToolInGroup(groupData.group);
    const Icon = currentTool?.icon || groupData.icon;
    const isActive = !!currentTool;

    return (
      <DropdownMenu key={groupData.group}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex flex-col h-16 w-16 p-1 shrink-0",
              isActive && "bg-primary/10 text-primary border border-primary/50"
            )}
            onClick={() => handleToolSelect(currentTool?.tool || groupData.defaultTool)}
          >
            <Icon className="h-6 w-6" />
            <span className="text-xs mt-1">{currentTool?.name.split(' ')[0] || groupData.defaultTool}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-48">
          {groupData.tools.map((item) => (
            <DropdownMenuItem key={item.tool} onClick={() => handleToolSelect(item.tool)}>
              {React.createElement(item.icon, { className: "h-4 w-4 mr-2" })}
              {item.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="w-full bg-background border-t border-border/50 shrink-0">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 p-2">
          {/* Single Tools */}
          {singleTools.map(t => renderToolButton(t.tool, t.icon, t.name))}
          
          {/* Grouped Tools */}
          {toolGroups.map(renderGroupDropdown)}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};