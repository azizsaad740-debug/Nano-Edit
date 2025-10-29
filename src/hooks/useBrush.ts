import * as React from 'react';
import type { ActiveTool, BrushState } from '@/types/editor';

export const useBrush = (
  setActiveTool: (tool: ActiveTool | null) => void,
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void,
  brushState: BrushState,
  foregroundColor: string,
) => {
  const handleBrushToolChange = React.useCallback((tool: ActiveTool) => {
    setActiveTool(tool);
  }, [setActiveTool]);

  return { handleBrushToolChange };
};