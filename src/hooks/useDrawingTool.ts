import { useCallback } from 'react';
import type { ActiveTool } from '@/types/editor';

export const useDrawingTool = (
  setActiveTool: (tool: ActiveTool | null) => void,
) => {
  const handleDrawingToolChange = useCallback((tool: ActiveTool) => {
    setActiveTool(tool);
  }, [setActiveTool]);

  return { handleDrawingToolChange };
};