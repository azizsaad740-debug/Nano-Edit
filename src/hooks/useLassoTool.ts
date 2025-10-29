import { useCallback } from 'react';
import type { ActiveTool } from '@/types/editor';

export const useLassoTool = (
  setActiveTool: (tool: ActiveTool | null) => void,
) => {
  const handleLassoToolChange = useCallback((tool: ActiveTool) => {
    setActiveTool(tool);
  }, [setActiveTool]);

  return { handleLassoToolChange };
};