import * as React from 'react';
import type { ActiveTool, Dimensions, Point, ShapeType } from '@/types/editor';

interface UseShapeToolInteractionProps {
  activeTool: ActiveTool | null;
  workspaceRef: React.RefObject<HTMLDivElement>;
  imageContainerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  dimensions: Dimensions | null;
  addShapeLayer: (coords: Point, shapeType?: ShapeType) => void;
  selectedShapeType: ShapeType | null;
}

export const useShapeToolInteraction = (props: UseShapeToolInteractionProps) => {
  // Stub implementation
  return {};
};