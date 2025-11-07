import { useCallback } from 'react';
import type { ActiveTool, Layer, Point, ShapeType, VectorShapeLayerData } from '@/types/editor';

export const useShapeTool = (
  activeTool: ActiveTool | null,
  setActiveTool: (tool: ActiveTool | null) => void,
  setSelectedShapeType: (type: ShapeType | null) => void,
  selectedShapeType: ShapeType | null,
) => {
  const handleShapeToolChange = useCallback((tool: ActiveTool) => {
    setActiveTool(tool);
  }, [setActiveTool]);

  return { handleShapeToolChange };
};