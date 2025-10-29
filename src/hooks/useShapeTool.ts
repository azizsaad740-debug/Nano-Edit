import { useCallback } from 'react';
import type { ActiveTool, Layer } from '@/types/editor';

export const useShapeTool = (
  setActiveTool: (tool: ActiveTool | null) => void,
  setSelectedShapeType: (type: Layer['shapeType'] | null) => void,
  selectedShapeType: Layer['shapeType'] | null,
) => {
  const handleShapeToolChange = useCallback((tool: ActiveTool) => {
    setActiveTool(tool);
  }, [setActiveTool]);

  return { handleShapeToolChange };
};