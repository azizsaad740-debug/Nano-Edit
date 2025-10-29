import * as React from 'react';
import type { ActiveTool, GradientToolState } from '@/types/editor';

export const useGradientTool = (
  setActiveTool: (tool: ActiveTool | null) => void,
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>,
  gradientToolState: GradientToolState,
) => {
  const handleGradientToolChange = React.useCallback((tool: ActiveTool) => {
    setActiveTool(tool);
  }, [setActiveTool]);

  return { handleGradientToolChange };
};