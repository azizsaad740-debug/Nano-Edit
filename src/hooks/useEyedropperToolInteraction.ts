import * as React from 'react';
import type { ActiveTool, Dimensions } from '@/types/editor';

interface UseEyedropperToolInteractionProps {
  activeTool: ActiveTool | null;
  workspaceRef: React.RefObject<HTMLDivElement>;
  imageContainerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  dimensions: Dimensions | null;
  setForegroundColor: (color: string) => void;
}

export const useEyedropperToolInteraction = (props: UseEyedropperToolInteractionProps) => {
  // Stub implementation
  return {};
};