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
) => {
  const [zoom, setLocalZoom] = React.useState(initialZoom);
  const [isMouseOverImage, setIsMouseOverImage] = React.useState(false);
  const [gradientStart, setGradientStart] = React.useState<Point | null>(null);
  const [gradientCurrent, setGradientCurrent] = React.useState<Point | null>(null);

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

    if (activeTool === 'gradient') {
      setGradientStart({ x: e.clientX, y: e.clientY });
      setGradientCurrent({ x: e.clientX, y: e.clientY });
    }
  }, [imgRef, dimensions, activeTool, setSelectedLayerId, clearSelectionState]);

  const handleWorkspaceMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'gradient' && gradientStart) {
      setGradientCurrent({ x: e.clientX, y: e.clientY });
    }
  }, [activeTool, gradientStart]);

  const handleWorkspaceMouseUp = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'gradient' && gradientStart && gradientCurrent) {
      // Logic to commit gradient layer creation goes here (handled in Index.tsx)
      setGradientStart(null);
      setGradientCurrent(null);
    }
  }, [activeTool, gradientStart, gradientCurrent]);

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