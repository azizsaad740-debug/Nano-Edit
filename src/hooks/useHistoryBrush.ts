import * as React from 'react';
import type { ActiveTool, BrushState, Dimensions, Point } from '@/types/editor';

interface UseHistoryBrushProps {
  activeTool: ActiveTool | null;
  brushState: BrushState;
  dimensions: Dimensions | null;
  onStrokeEnd: (strokeDataUrl: string, layerId: string) => void;
  selectedLayerId: string | null;
  historyImageSrc: string | null;
}

export const useHistoryBrush = (props: UseHistoryBrushProps) => {
  // Stub implementation
  return {};
};