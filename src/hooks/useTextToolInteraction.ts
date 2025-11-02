import * as React from 'react';
import type { ActiveTool, Dimensions, Point } from '@/types/editor';

interface UseTextToolInteractionProps {
  activeTool: ActiveTool | null;
  workspaceRef: React.RefObject<HTMLDivElement>;
  imageContainerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  dimensions: Dimensions | null;
  addTextLayer: (coords: Point, color: string) => void;
  foregroundColor: string;
}

export const useTextToolInteraction = (props: UseTextToolInteractionProps) => {
  // Stub implementation
  return {};
};