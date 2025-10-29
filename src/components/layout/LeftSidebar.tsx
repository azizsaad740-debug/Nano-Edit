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
import { useEditorLogic } from "@/hooks/useEditorLogic";

interface LeftSidebarProps {
  logic: ReturnType<typeof useEditorLogic>;
}

const LeftSidebar = ({ logic }: LeftSidebarProps) => {
  const isMobile = useIsMobile();
  const {
    brushState, setBrushState, selectiveBlurAmount, setSelectiveBlurAmount,
    currentEditState, layers, recordHistory,
  } = logic;

  if (isMobile) return null;

  return (
    <ResizablePanel defaultSize={15} minSize={10} maxSize={20} className="shrink-0">
      <ScrollArea className="h-full">
        <div className="p-2">
          <ToolsPanel
            activeTool={logic.activeTool}
            setActiveTool={logic.setActiveTool}
            selectedShapeType={logic.selectedShapeType}
            setSelectedShapeType={logic.setSelectedShapeType}
            foregroundColor={logic.foregroundColor}
            onForegroundColorChange={logic.setForegroundColor}
            backgroundColor={logic.backgroundColor}
            onBackgroundColorChange={logic.setBackgroundColor}
            onSwapColors={() => {
              logic.setForegroundColor(logic.backgroundColor);
              logic.setBackgroundColor(logic.foregroundColor);
            }}
            brushState={brushState}
            setBrushState={(updates) => setBrushState(prev => ({ ...prev, ...updates }))}
            selectiveBlurStrength={selectiveBlurAmount}
            onSelectiveBlurStrengthChange={setSelectiveBlurAmount}
            onSelectiveBlurStrengthCommit={(value) => recordHistory("Change Selective Blur Strength", currentEditState, layers)}
          />
        </div>
      </ScrollArea>
    </ResizablePanel>
  );
};

export default LeftSidebar;