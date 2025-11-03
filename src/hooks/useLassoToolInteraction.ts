import * as React from 'react';
import type { ActiveTool, Dimensions, Point, EditState, Layer } from '@/types/editor';
import { polygonToMaskDataUrl } from '@/utils/maskUtils';
import { showError, showSuccess } from '@/utils/toast';

interface UseLassoToolInteractionProps {
  activeTool: ActiveTool | null;
  workspaceRef: React.RefObject<HTMLDivElement>;
  imageContainerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  dimensions: Dimensions | null;
  selectionPath: Point[] | null;
  setSelectionPath: (path: Point[] | null) => void;
  setSelectionMaskDataUrl: (url: string | null) => void;
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void;
  currentEditState: EditState;
  layers: Layer[];
  imgRef: React.RefObject<HTMLImageElement>;
}

export const useLassoToolInteraction = (props: UseLassoToolInteractionProps) => {
  const {
    activeTool, dimensions, selectionPath, setSelectionPath, setSelectionMaskDataUrl,
    recordHistory, currentEditState, layers,
  } = props;

  // This function is called by SelectionCanvas when a path is completed (freehand lasso)
  const handleSelectionComplete = React.useCallback(async (path: Point[]) => {
    if (!dimensions || path.length < 3) {
      setSelectionPath(null);
      return;
    }

    try {
      const maskDataUrl = await polygonToMaskDataUrl(path, dimensions.width, dimensions.height);
      setSelectionMaskDataUrl(maskDataUrl);
      setSelectionPath(path); // Keep path for visual feedback
      recordHistory(`Lasso Selection (${activeTool})`, currentEditState, layers);
      showSuccess("Selection created.");
    } catch (error) {
      console.error("Failed to create lasso mask:", error);
      showError("Failed to create selection mask.");
      setSelectionPath(null);
      setSelectionMaskDataUrl(null);
    }
  }, [dimensions, activeTool, setSelectionMaskDataUrl, setSelectionPath, recordHistory, currentEditState, layers]);
  
  // Handle polygonal lasso finalization (double click or closing loop)
  const handleDoubleClick = React.useCallback(async (e: MouseEvent) => {
    if (activeTool === 'lassoPoly' && selectionPath && selectionPath.length >= 3) {
      e.preventDefault();
      await handleSelectionComplete(selectionPath);
      setSelectionPath(selectionPath); // Keep path visible
    }
  }, [activeTool, selectionPath, handleSelectionComplete, setSelectionPath]);

  React.useEffect(() => {
    document.addEventListener('dblclick', handleDoubleClick);
    return () => {
      document.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [handleDoubleClick]);

  return { handleSelectionComplete };
};