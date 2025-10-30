import * as React from 'react';
import type { ActiveTool, Dimensions, GradientToolState, Layer, Point, EditState } from '@/types/editor';
import { showSuccess, showError } from '@/utils/toast';
import { polygonToMaskDataUrl, floodFillToMaskDataUrl, ellipseToMaskDataUrl, objectSelectToMaskDataUrl } from '@/utils/maskUtils';

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
  currentEditState: EditState, // NEW
  setCloneSourcePoint: (point: Point | null) => void, // NEW: Setter for clone source
  // NEW PROPS for Text Tool:
  handleAddTextLayer: (coords: Point, color: string) => void,
  foregroundColor: string,
) => {
  const [zoom, setLocalZoom] = React.useState(initialZoom);
  const [isMouseOverImage, setIsMouseOverImage] = React.useState(false);
  const [gradientStart, setGradientStart] = React.useState<Point | null>(null);
  const [gradientCurrent, setGradientCurrent] = React.useState<Point | null>(null);
  
  // Use refs for marquee drawing state to avoid re-creating handlers constantly
  const marqueeStartRef = React.useRef<Point | null>(null);
  
  // Ref for polygonal lasso drawing
  const polygonalPathRef = React.useRef<Point[]>([]);

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

  const getPointOnImage = React.useCallback((e: React.MouseEvent<HTMLDivElement> | MouseEvent): Point | null => {
    if (!imgRef.current || !dimensions) return null;
    const rect = imgRef.current.getBoundingClientRect();
    
    // Check if click is within the image bounds (scaled)
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      return null;
    }

    // Calculate coordinates relative to the image (in pixels)
    const scaleX = dimensions.width / rect.width;
    const scaleY = dimensions.height / rect.height;
    
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  }, [imgRef, dimensions]);

  const handleMagicWandClick = React.useCallback(async (clickPoint: Point) => {
    if (!dimensions) return;
    
    const tolerance = currentEditState.selectionSettings.tolerance;
    
    try {
      const maskUrl = await floodFillToMaskDataUrl(clickPoint, dimensions, tolerance);
      setSelectionMaskDataUrl(maskUrl);
      setSelectionPath(null);
      // Note: History recording is handled by useEditorLogic
      showSuccess(`Magic Wand selection created (Tolerance: ${tolerance}).`);
    } catch (error) {
      showError("Failed to create Magic Wand selection.");
      console.error(error);
    }
  }, [dimensions, currentEditState.selectionSettings.tolerance, setSelectionMaskDataUrl, setSelectionPath]);

  const handleObjectSelectClick = React.useCallback(async () => {
    if (!dimensions) return;
    
    try {
      const maskUrl = await objectSelectToMaskDataUrl(dimensions);
      setSelectionMaskDataUrl(maskUrl);
      setSelectionPath(null);
      showSuccess(`Object selection created (AI Stub).`);
    } catch (error) {
      showError("Failed to create Object selection.");
      console.error(error);
    }
  }, [dimensions, setSelectionMaskDataUrl, setSelectionPath]);


  const handleMarqueeSelectionComplete = React.useCallback(async (start: Point, end: Point) => {
    if (!dimensions || !workspaceRef.current || !imgRef.current) return;

    const imageRect = imgRef.current.getBoundingClientRect();
    
    // Calculate coordinates relative to the image (in pixels)
    const scaleX = dimensions.width / imageRect.width;
    const scaleY = dimensions.height / imageRect.height;

    // Convert screen coordinates (start/end) to image pixel coordinates
    const startX_px = Math.round((start.x - imageRect.left) * scaleX);
    const startY_px = Math.round((start.y - imageRect.top) * scaleY);
    const endX_px = Math.round((end.x - imageRect.left) * scaleX);
    const endY_px = Math.round((end.y - imageRect.top) * scaleY);

    const minX = Math.max(0, Math.min(startX_px, endX_px));
    const minY = Math.max(0, Math.min(startY_px, endY_px));
    const maxX = Math.min(dimensions.width, Math.max(startX_px, endX_px));
    const maxY = Math.min(dimensions.height, Math.max(startY_px, endY_px));

    let maskUrl: string;
    let historyName: string;

    if (activeTool === 'marqueeEllipse') {
      maskUrl = await ellipseToMaskDataUrl(
        { x: minX, y: minY },
        { x: maxX, y: maxY },
        dimensions.width,
        dimensions.height
      );
      historyName = "Elliptical Marquee Selection Applied";
    } else { // Default to Rectangular Marquee
      const rectPath: Point[] = [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
      ];
      maskUrl = await polygonToMaskDataUrl(rectPath, dimensions.width, dimensions.height);
      historyName = "Rectangular Marquee Selection Applied";
    }

    try {
      setSelectionMaskDataUrl(maskUrl);
      setSelectionPath(null); 
      // Note: History recording is handled by useEditorLogic (parent hook)
      showSuccess("Selection created.");
    } catch (error) {
      showError("Failed to create selection mask.");
      console.error(error);
    }
  }, [dimensions, workspaceRef, imgRef, setSelectionMaskDataUrl, setSelectionPath, activeTool]);

  const handlePaintBucketClick = React.useCallback(async (clickPoint: Point) => {
    if (!dimensions) return;

    // Stub: Simulate flood fill based on tolerance
    const tolerance = currentEditState.selectionSettings.tolerance;
    
    try {
      // Use the floodFillToMaskDataUrl stub to generate a mask based on tolerance
      const maskUrl = await floodFillToMaskDataUrl(clickPoint, dimensions, tolerance);
      
      // For now, we just show the mask as a selection feedback
      setSelectionMaskDataUrl(maskUrl);
      setSelectionPath(null);
      showSuccess(`Paint Bucket fill area selected (Tolerance: ${tolerance}).`);
      
    } catch (error) {
      showError("Failed to simulate Paint Bucket fill.");
      console.error(error);
    }
  }, [dimensions, currentEditState.selectionSettings.tolerance, setSelectionMaskDataUrl, setSelectionPath]);


  const handleWorkspaceMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current || !dimensions) return;

    const clickPoint = getPointOnImage(e);
    if (!clickPoint) {
      setSelectedLayerId(null);
      clearSelectionState();
      return;
    }
    
    const screenPoint: Point = { x: e.clientX, y: e.clientY };

    // --- Stamp Tool Alt+Click to set source ---
    if ((activeTool === 'cloneStamp' || activeTool === 'patternStamp') && (e.altKey || e.metaKey)) {
      setCloneSourcePoint(clickPoint);
      showSuccess("Clone source set.");
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    if (activeTool === 'gradient') {
      setGradientStart(screenPoint);
      setGradientCurrent(screenPoint);
    } else if (activeTool?.startsWith('marquee')) {
      marqueeStartRef.current = screenPoint;
      setMarqueeStart(screenPoint);
      setMarqueeCurrent(screenPoint);
      clearSelectionState();
    } else if (activeTool === 'lassoPoly') {
      // Polygonal Lasso: Add point on click
      if (e.button === 0) { // Left click
        if (polygonalPathRef.current.length === 0) {
          clearSelectionState();
        }
        polygonalPathRef.current.push(clickPoint);
        setSelectionPath([...polygonalPathRef.current]);
      }
    } else if (activeTool === 'magicWand' || activeTool === 'quickSelect') { // Handle Magic Wand and Quick Select
      handleMagicWandClick(clickPoint);
    } else if (activeTool === 'objectSelect') { // Object Select
      handleObjectSelectClick();
    } else if (activeTool === 'paintBucket') { // Paint Bucket
      handlePaintBucketClick(clickPoint);
    } else if (activeTool === 'text') { // NEW: Text Tool Click
      handleAddTextLayer(clickPoint, foregroundColor);
      e.stopPropagation();
    }
  }, [imgRef, dimensions, activeTool, setSelectedLayerId, clearSelectionState, setMarqueeStart, setMarqueeCurrent, setGradientStart, setGradientCurrent, getPointOnImage, setSelectionPath, handleMagicWandClick, handleObjectSelectClick, handlePaintBucketClick, setCloneSourcePoint, handleAddTextLayer, foregroundColor]);

  const handleWorkspaceMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'gradient' && gradientStart) {
      setGradientCurrent({ x: e.clientX, y: e.clientY });
    } else if (activeTool?.startsWith('marquee') && marqueeStartRef.current) {
      setMarqueeCurrent({ x: e.clientX, y: e.clientY });
    } else if (activeTool === 'lassoPoly' && polygonalPathRef.current.length > 0) {
      // Update the visual path with the current mouse position (screen coordinates)
      const currentPoint = getPointOnImage(e.nativeEvent);
      if (currentPoint) {
        setSelectionPath([...polygonalPathRef.current, currentPoint]);
      }
    }
  }, [activeTool, gradientStart, setGradientCurrent, setMarqueeCurrent, getPointOnImage, setSelectionPath]);

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

  // --- Polygonal Lasso Finalization ---
  React.useEffect(() => {
    if (activeTool !== 'lassoPoly') {
      polygonalPathRef.current = [];
      return;
    }

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Enter' && polygonalPathRef.current.length >= 3) {
        e.preventDefault();
        // Finalize selection
        const finalPath = polygonalPathRef.current;
        if (dimensions) {
          const maskUrl = await polygonToMaskDataUrl(finalPath, dimensions.width, dimensions.height);
          setSelectionMaskDataUrl(maskUrl);
          setSelectionPath(finalPath); // Keep path for visualization
          polygonalPathRef.current = [];
          showSuccess("Polygonal selection finalized.");
        }
      } else if (e.key === 'Escape') {
        polygonalPathRef.current = [];
        clearSelectionState();
        showSuccess("Polygonal selection cancelled.");
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, dimensions, setSelectionMaskDataUrl, setSelectionPath, clearSelectionState]);


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