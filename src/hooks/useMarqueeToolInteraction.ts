import * as React from 'react';
import type { ActiveTool, Dimensions, Point, EditState, Layer } from '@/types/editor';
import { rectToMaskDataUrl, ellipseToMaskDataUrl } from '@/utils/maskUtils';
import { showSuccess, showError } from '@/utils/toast';

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
    
    // Ensure coordinates are relative to the image element's top-left corner
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Clamp to image boundaries
    return {
      x: Math.max(0, Math.min(dimensions.width, x)),
      y: Math.max(0, Math.min(dimensions.height, y)),
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
        
        // Check if the selection area is large enough
        const width = Math.abs(startPoint.x - endPoint.x);
        const height = Math.abs(startPoint.y - endPoint.y);
        
        if (width < 5 || height < 5) {
            showError(" Selection area is too small.");
            setSelectionMaskDataUrl(null);
        } else {
            try {
                if (activeTool === 'marqueeRect') {
                    maskDataUrl = await rectToMaskDataUrl(startPoint, endPoint, dimensions.width, dimensions.height);
                } else if (activeTool === 'marqueeEllipse') {
                    maskDataUrl = await ellipseToMaskDataUrl(startPoint, endPoint, dimensions.width, dimensions.height);
                }
                
                if (maskDataUrl) {
                    setSelectionMaskDataUrl(maskDataUrl);
                    recordHistory(`Marquee Selection (${activeTool})`, currentEditState, layers);
                    showSuccess("Selection created.");
                }
            } catch (error) {
                console.error("Failed to create marquee mask:", error);
                showError("Failed to create selection mask.");
                setSelectionMaskDataUrl(null);
            }
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