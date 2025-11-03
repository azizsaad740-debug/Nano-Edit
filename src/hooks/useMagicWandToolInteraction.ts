import * as React from 'react';
import type { ActiveTool, Dimensions, EditState, Layer } from '@/types/editor';
import { floodFillToMaskDataUrl } from '@/utils/maskUtils';
import { showError, showSuccess } from '@/utils/toast';

interface UseMagicWandToolInteractionProps {
  activeTool: ActiveTool | null;
  workspaceRef: React.RefObject<HTMLDivElement>;
  imageContainerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  dimensions: Dimensions | null;
  setSelectionMaskDataUrl: (url: string | null) => void;
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void;
  currentEditState: EditState;
  layers: Layer[];
  imgRef: React.RefObject<HTMLImageElement>;
}

export const useMagicWandToolInteraction = (props: UseMagicWandToolInteractionProps) => {
  const {
    activeTool, dimensions, setSelectionMaskDataUrl,
    recordHistory, currentEditState, layers, imgRef
  } = props;

  const isMagicWandTool = activeTool === 'magicWand' || activeTool === 'quickSelect';
  const tolerance = currentEditState.selectionSettings.tolerance;

  const getPointOnImage = React.useCallback((clientX: number, clientY: number) => {
    if (!imgRef.current || !dimensions) return null;
    const rect = imgRef.current.getBoundingClientRect();
    
    // Calculate coordinates relative to the image (in image pixels)
    const scaleX = dimensions.width / rect.width;
    const scaleY = dimensions.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, [imgRef, dimensions]);

  const handleMouseDown = React.useCallback(async (e: MouseEvent) => {
    if (!isMagicWandTool || !dimensions || e.button !== 0) return;
    
    const clickPoint = getPointOnImage(e.clientX, e.clientY);
    if (!clickPoint) return;

    try {
      // Use floodFillToMaskDataUrl stub for both Magic Wand and Quick Select
      const maskDataUrl = await floodFillToMaskDataUrl(clickPoint, dimensions, tolerance);
      setSelectionMaskDataUrl(maskDataUrl);
      recordHistory(`Magic Wand Selection`, currentEditState, layers);
      showSuccess("Selection created.");
    } catch (error) {
      console.error("Magic Wand failed:", error);
      showError("Failed to create selection.");
      setSelectionMaskDataUrl(null);
    }
  }, [isMagicWandTool, dimensions, tolerance, getPointOnImage, setSelectionMaskDataUrl, recordHistory, currentEditState, layers]);

  React.useEffect(() => {
    const workspace = props.workspaceRef.current;
    if (workspace) {
      workspace.addEventListener('mousedown', handleMouseDown);
    }

    return () => {
      if (workspace) {
        workspace.removeEventListener('mousedown', handleMouseDown);
      }
    };
  }, [props.workspaceRef, handleMouseDown]);

  return {};
};