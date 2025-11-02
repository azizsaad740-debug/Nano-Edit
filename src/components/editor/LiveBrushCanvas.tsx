"use client";

import * as React from "react";
import { type BrushState, type Layer, type Point } from "@/types/editor";
import { cn } from "@/lib/utils";

interface LiveBrushCanvasProps {
  imageNaturalDimensions: { width: number; height: number } | null;
  onStrokeEnd: (strokeDataUrl: string, layerId: string) => void; // For drawing/erasing/history
  onSelectionBrushStrokeEnd: (strokeDataUrl: string, operation: 'add' | 'subtract') => void; // For selectionBrush
  onSelectiveRetouchStrokeEnd: (strokeDataUrl: string, tool: 'blurBrush' | 'sharpenTool', operation: 'add' | 'subtract') => void; // For blurBrush/sharpenTool
  activeTool: 'brush' | 'eraser' | 'pencil' | 'selectionBrush' | 'blurBrush' | 'cloneStamp' | 'patternStamp' | 'historyBrush' | 'artHistoryBrush' | 'sharpenTool';
  brushState: BrushState;
  foregroundColor: string;
  backgroundColor: string;
  cloneSourcePoint?: Point | null;
  selectedLayerId: string | null;
  zoom: number;
  baseImageSrc: string | null; // ADDED PROP
  historyImageSrc: string | null; // NEW PROP for History Brush source
}

export const LiveBrushCanvas = ({
  imageNaturalDimensions,
  onStrokeEnd,
  onSelectionBrushStrokeEnd,
  onSelectiveRetouchStrokeEnd,
  activeTool,
  brushState,
  foregroundColor,
  backgroundColor,
  cloneSourcePoint,
  selectedLayerId,
  zoom,
  baseImageSrc,
  historyImageSrc, // DESTRUCTURED
}: LiveBrushCanvasProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = React.useRef<HTMLCanvasElement>(null); // For live preview
  const isDrawingRef = React.useRef(false);
  const lastPointRef = React.useRef<Point | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const baseImageRef = React.useRef<HTMLImageElement | null>(null); // Ref to hold the base image element
  const historyImageRef = React.useRef<HTMLImageElement | null>(null); // Ref to hold the history image element

  const isStampTool = activeTool === 'cloneStamp' || activeTool === 'patternStamp';
  const isHistoryBrush = activeTool === 'historyBrush' || activeTool === 'artHistoryBrush';
  const isEraser = activeTool === 'eraser';
  const isSelectionBrush = activeTool === 'selectionBrush';
  const isBlurBrush = activeTool === 'blurBrush';
  const isSharpenTool = activeTool === 'sharpenTool';
  const isSelectiveRetouchTool = isBlurBrush || isSharpenTool;
  const isPencil = activeTool === 'pencil';

  const { size, hardness, opacity, flow, shape, angle, roundness, spacing } = brushState;

  // Load base image when source changes (used for Clone/Pattern Stamp)
  React.useEffect(() => {
    if (baseImageSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        baseImageRef.current = img;
      };
      img.onerror = () => {
        baseImageRef.current = null;
        console.error("Failed to load base image for stamping.");
      };
      img.src = baseImageSrc;
    } else {
      baseImageRef.current = null;
    }
  }, [baseImageSrc]);
  
  // Load history image when source changes (used for History Brush)
  React.useEffect(() => {
    if (historyImageSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        historyImageRef.current = img;
      };
      img.onerror = () => {
        historyImageRef.current = null;
        console.error("Failed to load history image for brush.");
      };
      img.src = historyImageSrc;
    } else {
      historyImageRef.current = null;
    }
  }, [historyImageSrc]);

  const getOperation = (): 'add' | 'subtract' => {
    // For selection/retouch tools, operation depends on foreground/background color swap
    if (isSelectionBrush || isSelectiveRetouchTool) {
      return foregroundColor === backgroundColor ? 'add' : 'subtract';
    }
    return 'add';
  };

  const getBrushColor = () => {
    if (isEraser) return 'rgba(0, 0, 0, 1)'; 
    if (isSelectionBrush || isSelectiveRetouchTool) {
      // Use white for 'add' and black for 'subtract' on the mask canvas
      return getOperation() === 'add' ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)';
    }
    if (isHistoryBrush) {
      // History brush draws the historical image, so the stroke mask should be white
      return 'rgba(255, 255, 255, 1)'; 
    }
    return foregroundColor;
  };
  
  const drawBrushStroke = React.useCallback((ctx: CanvasRenderingContext2D, start: Point, end: Point) => {
    if (!imageNaturalDimensions) return;

    const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    const spacingPx = Math.max(1, size * (spacing / 100));
    const steps = Math.max(1, Math.ceil(distance / spacingPx));

    ctx.save();
    ctx.globalAlpha = (opacity / 100) * (flow / 100);
    ctx.fillStyle = getBrushColor();
    ctx.strokeStyle = getBrushColor();
    
    // Set composite operation for mask/eraser preview
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
    } else if (isSelectionBrush || isSelectiveRetouchTool) {
      // Use source-over for 'add' (white) and destination-out for 'subtract' (black)
      ctx.globalCompositeOperation = getOperation() === 'add' ? 'source-over' : 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
    
    ctx.filter = 'none'; 

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;

      const radius = size / 2;
      
      if (isStampTool && cloneSourcePoint && baseImageRef.current) {
        // --- Clone Stamp Logic ---
        
        // 1. Calculate offset: where the source pixel (cloneSourcePoint) should land (x, y)
        const offsetX = cloneSourcePoint.x - x;
        const offsetY = cloneSourcePoint.y - y;
        
        // 2. Clip the drawing to the brush shape
        ctx.beginPath();
        if (shape === 'circle') {
          ctx.arc(x, y, radius, 0, Math.PI * 2);
        } else {
          ctx.rect(x - radius, y - radius, size, size);
        }
        ctx.clip();
        
        // 3. Draw the source image, offset to align the clone source point
        // We draw the entire image, but only the clipped area is visible.
        ctx.drawImage(baseImageRef.current, -offsetX, -offsetY, imageNaturalDimensions.width, imageNaturalDimensions.height);
        
        // Restore context to remove clip path
        ctx.restore();
        ctx.save(); // Save again for the next iteration
        
      } else if (isHistoryBrush && historyImageRef.current) {
        // --- History Brush Logic ---
        
        // 1. Clip the drawing to the brush shape
        ctx.beginPath();
        if (shape === 'circle') {
          ctx.arc(x, y, radius, 0, Math.PI * 2);
        } else {
          ctx.rect(x - radius, y - radius, size, size);
        }
        ctx.clip();
        
        // 2. Draw the historical image (full canvas size)
        ctx.drawImage(historyImageRef.current, 0, 0, imageNaturalDimensions.width, imageNaturalDimensions.height);
        
        // Restore context to remove clip path
        ctx.restore();
        ctx.save(); // Save again for the next iteration
        
      } else {
        // --- Standard Brush/Eraser/Selection Brush Logic ---
        ctx.beginPath();
        if (shape === 'circle') {
          ctx.arc(x, y, radius, 0, Math.PI * 2);
        } else {
          ctx.rect(x - radius, y - radius, size, size);
        }
        ctx.fill();
      }
    }
    
    ctx.restore();
  }, [size, opacity, flow, shape, isEraser, isSelectionBrush, isSelectiveRetouchTool, isPencil, foregroundColor, cloneSourcePoint, isStampTool, imageNaturalDimensions, spacing, getOperation, isHistoryBrush, historyImageRef]);

  const getPointOnCanvas = React.useCallback((e: MouseEvent): Point | null => {
    if (!canvasRef.current || !imageNaturalDimensions) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Calculate coordinates relative to the canvas (in image pixels)
    const scaleX = imageNaturalDimensions.width / rect.width;
    const scaleY = imageNaturalDimensions.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, [imageNaturalDimensions]);

  const startStroke = React.useCallback((e: MouseEvent) => {
    if (e.button !== 0 || !imageNaturalDimensions) return; // Only left click
    
    // Prevent drawing if Alt/Meta key is pressed for stamp source selection
    if (isStampTool && (e.altKey || e.metaKey)) return;
    
    // Prevent stamping if source is not set
    if (isStampTool && !cloneSourcePoint) {
        console.warn("Clone source not set.");
        return;
    }

    const point = getPointOnCanvas(e);
    if (!point) return;

    isDrawingRef.current = true;
    setIsDrawing(true);
    lastPointRef.current = point;

    const ctx = canvasRef.current?.getContext('2d');
    const tempCtx = tempCanvasRef.current?.getContext('2d');
    if (!ctx || !tempCtx) return;

    // Clear temp canvas for preview
    tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);
    
    // Draw the initial dot
    drawBrushStroke(ctx, point, point);
  }, [getPointOnCanvas, drawBrushStroke, imageNaturalDimensions, isStampTool, cloneSourcePoint]);

  const continueStroke = React.useCallback((e: MouseEvent) => {
    if (!isDrawingRef.current) return;

    const currentPoint = getPointOnCanvas(e);
    const lastPoint = lastPointRef.current;
    if (!currentPoint || !lastPoint) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    drawBrushStroke(ctx, lastPoint, currentPoint);
    lastPointRef.current = currentPoint;
  }, [getPointOnCanvas, drawBrushStroke]);

  const endStroke = React.useCallback(() => {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;
    setIsDrawing(false);
    lastPointRef.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get the resulting stroke data URL
    const strokeDataUrl = canvas.toDataURL();
    
    // Clear the canvas for the next stroke
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);

    // Pass the stroke data to the parent hook for merging
    const operation = getOperation();
    
    if (isSelectiveRetouchTool) { 
        onSelectiveRetouchStrokeEnd(strokeDataUrl, activeTool as 'blurBrush' | 'sharpenTool', operation);
    } else if (isSelectionBrush) { 
        onSelectionBrushStrokeEnd(strokeDataUrl, operation);
    } else if (isHistoryBrush || isStampTool) {
      // For history brush and stamp tools, we merge the stroke onto the target layer
      onStrokeEnd(strokeDataUrl, selectedLayerId || 'background');
    } else {
      // For drawing/erasing, we pass the selectedLayerId
      onStrokeEnd(strokeDataUrl, selectedLayerId || 'background');
    }
  }, [onStrokeEnd, onSelectionBrushStrokeEnd, onSelectiveRetouchStrokeEnd, getOperation, isSelectiveRetouchTool, isSelectionBrush, isHistoryBrush, isStampTool, activeTool, selectedLayerId]);

  // --- Setup and Cleanup ---
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const tempCanvas = tempCanvasRef.current;
    if (!canvas || !tempCanvas || !imageNaturalDimensions) return;

    canvas.width = imageNaturalDimensions.width;
    canvas.height = imageNaturalDimensions.height;
    tempCanvas.width = imageNaturalDimensions.width;
    tempCanvas.height = imageNaturalDimensions.height;
    
    // Clear canvases on dimension change
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    tempCanvas.getContext('2d')?.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

    document.addEventListener('mousemove', continueStroke);
    document.addEventListener('mouseup', endStroke);

    return () => {
      document.removeEventListener('mousemove', continueStroke);
      document.removeEventListener('mouseup', endStroke);
    };
  }, [imageNaturalDimensions, continueStroke, endStroke]);

  // --- Live Preview (Cursor) ---
  const handleMouseMovePreview = React.useCallback((e: MouseEvent) => {
    if (!tempCanvasRef.current || isDrawingRef.current || !imageNaturalDimensions) return;
    
    const tempCtx = tempCanvasRef.current.getContext('2d');
    const currentPoint = getPointOnCanvas(e);
    if (!tempCtx || !currentPoint) return;

    tempCtx.clearRect(0, 0, tempCanvasRef.current.width, tempCanvasRef.current.height);
    
    // Draw brush cursor preview
    const radius = size / 2;
    const featherRadius = isPencil ? 0 : radius * (1 - hardness / 100);

    tempCtx.save();
    tempCtx.globalAlpha = 1.0;
    tempCtx.filter = 'none';
    
    // Draw outer circle (size)
    tempCtx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    tempCtx.lineWidth = 1;
    tempCtx.beginPath();
    tempCtx.arc(currentPoint.x, currentPoint.y, radius, 0, Math.PI * 2);
    tempCtx.stroke();
    
    // Draw inner circle (hardness/feather)
    if (featherRadius > 0) {
      tempCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      tempCtx.lineWidth = 1;
      tempCtx.beginPath();
      tempCtx.arc(currentPoint.x, currentPoint.y, radius - featherRadius, 0, Math.PI * 2);
      tempCtx.stroke();
    }
    
    // Draw clone source preview if stamping and source is set
    if (isStampTool && cloneSourcePoint && baseImageRef.current) {
        const sourceX = cloneSourcePoint.x;
        const sourceY = cloneSourcePoint.y;
        
        // Draw a target icon at the source point
        tempCtx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        tempCtx.lineWidth = 2;
        tempCtx.beginPath();
        tempCtx.arc(sourceX, sourceY, 5, 0, Math.PI * 2);
        tempCtx.moveTo(sourceX - 10, sourceY);
        tempCtx.lineTo(sourceX + 10, sourceY);
        tempCtx.moveTo(sourceX, sourceY - 10);
        tempCtx.lineTo(sourceX, sourceY + 10);
        tempCtx.stroke();
    }

    tempCtx.restore();
  }, [getPointOnCanvas, size, hardness, isPencil, imageNaturalDimensions, isStampTool, cloneSourcePoint]);

  React.useEffect(() => {
    document.addEventListener('mousemove', handleMouseMovePreview);
    return () => document.removeEventListener('mousemove', handleMouseMovePreview);
  }, [handleMouseMovePreview]);


  if (!imageNaturalDimensions) return null;

  // Determine cursor style
  let cursorStyle = 'crosshair';
  if (isStampTool) {
    if (isDrawing) {
        cursorStyle = 'none';
    } else if (cloneSourcePoint) {
        cursorStyle = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>\') 12 12, crosshair';
    } else {
        // Alt/Option key required to set source
        cursorStyle = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 6l-3 3"/></svg>\') 0 24, crosshair';
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Canvas for accumulating the stroke (hidden, same size as image) */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
          // Ensure the canvas scales correctly with the image container
        }}
      />
      
      {/* Canvas for live brush preview (visible, same size as image) */}
      <canvas
        ref={tempCanvasRef}
        className={cn(
          "absolute top-0 left-0",
          // Only allow mouse events if the tool is active and not a selection tool
          (activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'pencil' || isStampTool || isHistoryBrush || isSelectionBrush || isSelectiveRetouchTool) && "pointer-events-auto",
          isDrawing && "cursor-none"
        )}
        style={{
          width: '100%',
          height: '100%',
          cursor: isDrawing ? 'none' : cursorStyle,
        }}
        onMouseDown={(e) => startStroke(e.nativeEvent)}
      />
    </div>
  );
};