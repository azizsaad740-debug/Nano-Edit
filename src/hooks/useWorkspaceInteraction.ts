import * as React from 'react';
import type { ActiveTool, Dimensions, GradientToolState, Layer, Point } from '@/types/editor';
import { showSuccess, showError } from '@/utils/toast';

export const useWorkspaceInteraction = (
  workspaceRef: React.RefObject<HTMLDivElement>,
  imgRef: React.RefObject<HTMLImageElement>,
  activeTool: ActiveTool | null,
  dimensions: Dimensions | null,
  setSelectionPath: (path: Point[] | null) => void,
  setSelectionMaskDataUrl: (url: string | null) => void,
  clearSelectionState: () => void,
  gradientToolState: GradientToolState,
  setSelectedLayerId: (id: string | null) => void,
  layers: Layer[],
  initialZoom: number,
  setZoom: (zoom: number) => void,
  setMarqueeStart: (point: Point | null) => void, // NEW
  setMarqueeCurrent: (point: Point | null) => void, // NEW
  onMarqueeSelectionComplete: (start: Point, end: Point) => void, // NEW
) => {
  const [zoom, setLocalZoom] = React.useState(initialZoom);
  const [isMouseOverImage, setIsMouseOverImage] = React.useState(false);
  const [gradientStart, setGradientStart] = React.useState<Point | null>(null);
  const [gradientCurrent, setGradientCurrent] = React.useState<Point | null>(null);
  
  // Use refs for marquee drawing state to avoid re-creating handlers constantly
  const marqueeStartRef = React.useRef<Point | null>(null);

  React.useEffect(() => {
    setLocalZoom(initialZoom);
  }, [initialZoom]);

  const handleFitScreen = React.useCallback(() => {
    if (!workspaceRef.current || !dimensions) return;
    const { width: wsWidth, height: wsHeight } = workspaceRef.current.getBoundingClientRect();
    const { width: imgWidth, height: imgHeight } = dimensions;

    const padding = 40;
    const fitZoom = Math.min((wsWidth - padding) / imgWidth, (wsHeight - padding) / imgHeight);
    setLocalZoom(fitZoom);
    setZoom(fitZoom);
  }, [workspaceRef, dimensions, setZoom]);

  const handleZoomIn = React.useCallback(() => {
    setLocalZoom(prev => {
      const newZoom = Math.min(5, prev * 1.2);
      setZoom(newZoom);
      return newZoom;
    });
  }, [setZoom]);

  const handleZoomOut = React.useCallback(() => {
    setLocalZoom(prev => {
      const newZoom = Math.max(0.1, prev / 1.2);
      setZoom(newZoom);
      return newZoom;
    });
  }, [setZoom]);

  const handleWheel = React.useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
  }, [handleZoomIn, handleZoomOut]);

  const handleWorkspaceMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current || !dimensions) return;

    const rect = imgRef.current.getBoundingClientRect();
    const isClickOnImage = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

    if (!isClickOnImage) {
      setSelectedLayerId(null);
      clearSelectionState();
      return;
    }
    
    const clickPoint: Point = { x: e.clientX, y: e.clientY };

    if (activeTool === 'gradient') {
      setGradientStart(clickPoint);
      setGradientCurrent(clickPoint);
    } else if (activeTool?.startsWith('marquee')) {
      marqueeStartRef.current = clickPoint;
      setMarqueeStart(clickPoint);
      setMarqueeCurrent(clickPoint);
      clearSelectionState();
    }
  }, [imgRef, dimensions, activeTool, setSelectedLayerId, clearSelectionState, setMarqueeStart, setMarqueeCurrent, setGradientStart, setGradientCurrent]);

  const handleWorkspaceMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'gradient' && gradientStart) {
      setGradientCurrent({ x: e.clientX, y: e.clientY });
    } else if (activeTool?.startsWith('marquee') && marqueeStartRef.current) {
      setMarqueeCurrent({ x: e.clientX, y: e.clientY });
    }
  }, [activeTool, gradientStart, setGradientCurrent, setMarqueeCurrent]);

  const handleWorkspaceMouseUp = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'gradient' && gradientStart && gradientCurrent) {
      // Logic to commit gradient layer creation goes here (handled in Index.tsx)
      setGradientStart(null);
      setGradientCurrent(null);
    } else if (activeTool?.startsWith('marquee') && marqueeStartRef.current) {
      const start = marqueeStartRef.current;
      const end: Point = { x: e.clientX, y: e.clientY };
      
      // Only commit if the selection area is non-zero
      if (Math.abs(start.x - end.x) > 5 && Math.abs(start.y - end.y) > 5) {
        onMarqueeSelectionComplete(start, end);
      } else {
        clearSelectionState();
      }
      
      marqueeStartRef.current = null;
      setMarqueeStart(null);
      setMarqueeCurrent(null);
    }
  }, [activeTool, gradientStart, gradientCurrent, onMarqueeSelectionComplete, clearSelectionState, setMarqueeStart, setMarqueeCurrent]);

  return {
    zoom,
    setZoom: setLocalZoom, // Expose local setter for internal use
    handleWheel,
    handleFitScreen,
    handleZoomIn,
    handleZoomOut,
    isMouseOverImage,
    setIsMouseOverImage,
    gradientStart,
    gradientCurrent,
    handleWorkspaceMouseDown,
    handleWorkspaceMouseMove,
    handleWorkspaceMouseUp,
  };
};