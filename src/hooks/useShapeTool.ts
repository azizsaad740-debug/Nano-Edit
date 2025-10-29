import { useCallback } from 'react';
import type { ActiveTool, Layer, Point, ShapeType, VectorShapeLayerData } from '@/types/editor'; // Import ShapeType

// ... (inside useShapeTool)

// FIX 70, 71: Use ShapeType
export const useShapeTool = (
  activeTool: ActiveTool | null,
  setActiveTool: (tool: ActiveTool | null) => void,
  setSelectedShapeType: (type: ShapeType | null) => void,
  selectedShapeType: ShapeType | null,
) => {
// ...
// FIX 63: Use ShapeType
// ...