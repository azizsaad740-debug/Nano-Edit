import * as React from "react";
import { ToolsPanel } from "./ToolsPanel";
import { useEditorLogic } from "@/hooks/useEditorLogic";

interface LeftSidebarProps {
  logic: ReturnType<typeof useEditorLogic>;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ logic }) => {
  const {
    activeTool, setActiveTool, selectedShapeType, setSelectedShapeType,
    foregroundColor, setForegroundColor, backgroundColor, setBackgroundColor, handleSwapColors,
    brushState, setBrushStatePartial, selectiveBlurAmount, setSelectiveBlurAmount,
    currentEditState, layers, recordHistory,
  } = logic;

  return (
    <ToolsPanel
      activeTool={activeTool}
      setActiveTool={setActiveTool}
      selectedShapeType={selectedShapeType}
      setSelectedShapeType={setSelectedShapeType}
      foregroundColor={foregroundColor}
      onForegroundColorChange={setForegroundColor}
      backgroundColor={backgroundColor}
      onBackgroundColorChange={setBackgroundColor}
      onSwapColors={handleSwapColors}
      brushState={brushState}
      setBrushState={setBrushStatePartial}
      selectiveBlurStrength={selectiveBlurAmount}
      onSelectiveBlurStrengthChange={setSelectiveBlurAmount}
      onSelectiveBlurStrengthCommit={() => recordHistory("Change Selective Blur Strength", currentEditState, layers)}
    />
  );
};