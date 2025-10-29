import { useCallback } from 'react';
import type { ActiveTool } from '@/types/editor';

export const useTextTool = (
  setActiveTool: (tool: ActiveTool | null) => void,
) => {
  const handleTextToolChange = useCallback((tool: ActiveTool) => {
    setActiveTool(tool);
  }, [setActiveTool]);

  return { handleTextToolChange };
};