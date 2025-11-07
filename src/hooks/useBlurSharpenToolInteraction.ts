import * as React from 'react';
import type { ActiveTool, Dimensions } from '@/types/editor';

interface UseBlurSharpenToolInteractionProps {
  activeTool: ActiveTool | null;
  workspaceRef: React.RefObject<HTMLDivElement>;
  imageContainerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  dimensions: Dimensions | null;
}

export const useBlurSharpenToolInteraction = (props: UseBlurSharpenToolInteractionProps) => {
  // Stub implementation
  return {};
};