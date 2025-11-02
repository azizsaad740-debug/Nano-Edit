import * as React from 'react';
import type { ActiveTool, Dimensions, Point } from '@/types/editor';

interface UseGradientToolInteractionProps {
  activeTool: ActiveTool | null;
  workspaceRef: React.RefObject<HTMLDivElement>;
  imageContainerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  dimensions: Dimensions | null;
  gradientStart: Point | null;
  gradientCurrent: Point | null;
  setGradientStart: (point: Point | null) => void;
  setGradientCurrent: (point: Point | null) => void;
  addGradientLayer: (start: Point, end: Point) => void;
}

export const useGradientToolInteraction = (props: UseGradientToolInteractionProps) => {
  // Stub implementation
  return {};
};