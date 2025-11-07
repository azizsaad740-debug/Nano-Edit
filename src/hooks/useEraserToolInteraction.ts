import * as React from 'react';
import type { ActiveTool, Dimensions } from '@/types/editor';

interface UseEraserToolInteractionProps {
  activeTool: ActiveTool | null;
  workspaceRef: React.RefObject<HTMLDivElement>;
  imageContainerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  dimensions: Dimensions | null;
}

export const useEraserToolInteraction = (props: UseEraserToolInteractionProps) => {
  // Stub implementation
  return {};
};