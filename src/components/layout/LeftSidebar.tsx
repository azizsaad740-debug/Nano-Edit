"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { ToolsPanel } from "./ToolsPanel";
import type { ActiveTool, BrushState, ShapeType } from "@/types/editor";

interface LeftSidebarProps {
  activeTool: ActiveTool | null;
  setActiveTool: (tool: ActiveTool | null) => void;
  selectedShapeType: ShapeType | null;
  setSelectedShapeType: (type: ShapeType | null) => void;
  foregroundColor: string;
  onForegroundColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onSwapColors: () => void;
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  selectiveBlurAmount: number;
  onSelectiveBlurAmountChange: (value: number) => void;
  onSelectiveBlurAmountCommit: (value: number) => void;
}

const LeftSidebar = ({ 
  activeTool, setActiveTool, selectedShapeType, setSelectedShapeType,
  foregroundColor, onForegroundColorChange, backgroundColor, onBackgroundColorChange, onSwapColors,
  brushState, setBrushState, selectiveBlurAmount, onSelectiveBlurAmountChange, onSelectiveBlurAmountCommit
}: LeftSidebarProps) => {
  const isMobile = useIsMobile();

  if (isMobile) return null;

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <ToolsPanel
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          selectedShapeType={selectedShapeType}
          setSelectedShapeType={setSelectedShapeType}
          foregroundColor={foregroundColor}
          onForegroundColorChange={onForegroundColorChange}
          backgroundColor={backgroundColor}
          onBackgroundColorChange={onBackgroundColorChange}
          onSwapColors={onSwapColors}
          brushState={brushState}
          setBrushState={setBrushState}
          selectiveBlurAmount={selectiveBlurAmount}
          onSelectiveBlurAmountChange={onSelectiveBlurAmountChange}
          onSelectiveBlurAmountCommit={onSelectiveBlurAmountCommit}
        />
      </div>
    </ScrollArea>
  );
};

export default LeftSidebar;