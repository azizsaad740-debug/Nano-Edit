import * as React from 'react';
import type { ActiveTool, Dimensions } from '@/types/editor';

interface UsePencilToolInteractionProps {
  activeTool: ActiveTool | null;
  workspaceRef: React.RefObject<HTMLDivElement>;
  imageContainerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  dimensions: Dimensions | null;
}

export const usePencilToolInteraction = (props: UsePencilToolInteractionProps) => {
  // Stub implementation
  return {};
};