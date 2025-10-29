import { useCallback } from 'react';
import type { ActiveTool } from '@/types/editor';

export const useMoveTool = (
  setActiveTool: (tool: ActiveTool | null) => void,
) => {
  const handleMoveToolChange = useCallback((tool: ActiveTool) => {
    setActiveTool(tool);
  }, [setActiveTool]);

  return { handleMoveToolChange };
};