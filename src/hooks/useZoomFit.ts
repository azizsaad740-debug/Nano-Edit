import * as React from 'react';
import type { Dimensions } from '@/types/editor';

interface UseZoomFitProps {
  workspaceRef: React.RefObject<HTMLDivElement>;
  imgRef: React.RefObject<HTMLImageElement>;
  dimensions: Dimensions | null;
  zoom: number;
  setZoom: (zoom: number | ((prevZoom: number) => number)) => void;
  handleFitScreen: () => void;
}

export const useZoomFit = ({
  workspaceRef,
  dimensions,
  setZoom,
}: UseZoomFitProps) => {
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  const fitToScreen = React.useCallback(() => {
    if (!workspaceRef.current || !dimensions) return;

    const workspaceRect = workspaceRef.current.getBoundingClientRect();
    const padding = 40; // Padding around the image

    const availableWidth = workspaceRect.width - padding;
    const availableHeight = workspaceRect.height - padding;

    if (availableWidth <= 0 || availableHeight <= 0) return;

    const scaleX = availableWidth / dimensions.width;
    const scaleY = availableHeight / dimensions.height;

    const newZoom = Math.min(scaleX, scaleY, 1); // Never zoom in past 100% if it fits

    // Clamp zoom to reasonable limits (0.1 to 5)
    const clampedZoom = Math.min(5, Math.max(0.1, newZoom));
    
    setZoom(clampedZoom);
    setIsInitialLoad(false);
  }, [workspaceRef, dimensions, setZoom]);

  // 1. Run fitToScreen on initial load of dimensions
  React.useEffect(() => {
    if (dimensions && isInitialLoad) {
      fitToScreen();
    }
  }, [dimensions, isInitialLoad, fitToScreen]);

  // 2. Run fitToScreen when workspace size changes (using a simple resize listener)
  React.useEffect(() => {
    const handleResize = () => {
      if (dimensions) {
        fitToScreen();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dimensions, fitToScreen]);
  
  // Expose fitToScreen function if needed externally (though handleFitScreen is passed via props)
  return { fitToScreen };
};