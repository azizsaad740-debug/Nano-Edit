import * as React from 'react';
import type { ActiveTool, Dimensions, Point, EditState, Layer } from '@/types/editor';
import { rectToMaskDataUrl, ellipseToMaskDataUrl } from '@/utils/maskUtils';

interface UseMarqueeToolInteractionProps {
  activeTool: ActiveTool | null;
  workspaceRef: React.RefObject<HTMLDivElement>;
  imageContainerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  dimensions: Dimensions | null;
  marqueeStart: Point | null;
  marqueeCurrent: Point | null;
  setMarqueeStart: (point: Point | null) => void;
  setMarqueeCurrent: (point: Point | null) => void;
  setSelectionMaskDataUrl: (url: string | null) => void;
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void;
  currentEditState: EditState;
  layers: Layer[];
  imgRef: React.RefObject<HTMLImageElement>; // Added imgRef to get pixel coordinates
}

export const useMarqueeToolInteraction = (props: UseMarqueeToolInteractionProps) => {
  const {
    activeTool, dimensions, marqueeStart, marqueeCurrent,
    setMarqueeStart, setMarqueeCurrent, setSelectionMaskDataUrl,
    recordHistory, currentEditState, layers, imgRef
  } = props;

  const isMarqueeTool = activeTool === 'marqueeRect' || activeTool === 'marqueeEllipse';

  const getPointOnImage = React.useCallback((clientX: number, clientY: number): Point | null => {
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

  const handleMouseDown = React.useCallback((e: MouseEvent) => {
    if (!isMarqueeTool || !dimensions || e.button !== 0) return;
    
    // Start tracking screen coordinates
    setMarqueeStart({ x: e.clientX, y: e.clientY });
    setMarqueeCurrent({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  }, [isMarqueeTool, dimensions, setMarqueeStart, setMarqueeCurrent]);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (marqueeStart && isMarqueeTool) {
      setMarqueeCurrent({ x: e.clientX, y: e.clientY });
    }
  }, [marqueeStart, isMarqueeTool, setMarqueeCurrent]);

  const handleMouseUp = React.useCallback(async (e: MouseEvent) => {
    if (marqueeStart && marqueeCurrent && isMarqueeTool && dimensions) {
      const startPoint = getPointOnImage(marqueeStart.x, marqueeStart.y);
      const endPoint = getPointOnImage(marqueeCurrent.x, marqueeCurrent.y);
      
      if (startPoint && endPoint) {
        let maskDataUrl: string | null = null;
        if (activeTool === 'marqueeRect') {
          maskDataUrl = await rectToMaskDataUrl(startPoint, endPoint, dimensions.width, dimensions.height);
        } else if (activeTool === 'marqueeEllipse') {
          maskDataUrl = await ellipseToMaskDataUrl(startPoint, endPoint, dimensions.width, dimensions.height);
        }
        
        if (maskDataUrl) {
          setSelectionMaskDataUrl(maskDataUrl);
          recordHistory(`Marquee Selection (${activeTool})`, currentEditState, layers);
        }
      }
      setMarqueeStart(null);
      setMarqueeCurrent(null);
    }
  }, [marqueeStart, marqueeCurrent, isMarqueeTool, dimensions, activeTool, getPointOnImage, setSelectionMaskDataUrl, recordHistory, currentEditState, layers, setMarqueeStart, setMarqueeCurrent]);

  React.useEffect(() => {
    const workspace = props.workspaceRef.current;
    if (workspace) {
      // We attach mousedown to the workspace ref, and mousemove/up to the document
      workspace.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (workspace) {
        workspace.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [props.workspaceRef, handleMouseDown, handleMouseMove, handleMouseUp]);

  return {};
};