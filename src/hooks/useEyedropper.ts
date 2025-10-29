import { useCallback } from 'react';
import type { ActiveTool } from '@/types/editor';

export const useEyedropper = (
  setActiveTool: (tool: ActiveTool | null) => void,
  setForegroundColor: (color: string) => void,
) => {
  const handleEyedropperToolChange = useCallback((tool: ActiveTool) => {
    setActiveTool(tool);
  }, [setActiveTool]);

  return { handleEyedropperToolChange };
};