import * as React from 'react';
import type { ActiveTool, BrushState } from '@/types/editor';

export const useBrush = (
  setActiveTool: (tool: ActiveTool | null) => void,
  setBrushState: React.Dispatch<React.SetStateAction<BrushState>>,
  brushState: BrushState,
  foregroundColor: string,
) => {
  const handleBrushToolChange = React.useCallback((tool: ActiveTool) => {
    setActiveTool(tool);
  }, [setActiveTool]);

  return { handleBrushToolChange };
};