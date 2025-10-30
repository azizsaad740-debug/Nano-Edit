"use client";

import * as React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
  onSelectiveBlurStrengthChange: (value: number) => void;
  onSelectiveBlurStrengthCommit: (value: number) => void;
}

const LeftSidebar = ({ 
  activeTool, setActiveTool, selectedShapeType, setSelectedShapeType,
  foregroundColor, onForegroundColorChange, backgroundColor, onBackgroundColorChange, onSwapColors,
  brushState, setBrushState, selectiveBlurAmount, onSelectiveBlurStrengthChange, onSelectiveBlurStrengthCommit
}: LeftSidebarProps) => {
  const isMobile = useIsMobile();

  if (isMobile) return null;

  return (
    <ResizablePanel defaultSize={15} minSize={10} maxSize={20} className="shrink-0">
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
            selectiveBlurStrength={selectiveBlurAmount}
            onSelectiveBlurStrengthChange={onSelectiveBlurStrengthChange}
            onSelectiveBlurStrengthCommit={onSelectiveBlurStrengthCommit}
          />
        </div>
      </ScrollArea>
    </ResizablePanel>
  );
};

export default LeftSidebar;