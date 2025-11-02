import * as React from 'react';
import type { ActiveTool, Dimensions, Point } from '@/types/editor';

interface UseCloneStampToolInteractionProps {
  activeTool: ActiveTool | null;
  workspaceRef: React.RefObject<HTMLDivElement>;
  imageContainerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  dimensions: Dimensions | null;
  setCloneSourcePoint: (point: Point | null) => void;
  cloneSourcePoint: Point | null;
}

export const useCloneStampToolInteraction = (props: UseCloneStampToolInteractionProps) => {
  // Stub implementation
  return {};
};