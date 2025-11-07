"use client";

import * as React from "react";
import type { Point } from "@/types/editor";
import { polygonToMaskDataUrl } from "@/utils/maskUtils";
import { showError, showSuccess } from "@/utils/toast";

interface SelectionCanvasProps {
  imageRef: React.RefObject<HTMLImageElement>;
  onSelectionComplete: (path: Point[]) => void;
  selectionPath: Point[] | null;
  activeTool: 'lasso' | 'lassoPoly';
}

const pencilCursor = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>\') 0 24, auto';
const polyLassoCursor = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>\') 12 12, auto';

export const SelectionCanvas = ({
  imageRef,
  onSelectionComplete,
  selectionPath,
  activeTool,
}: SelectionCanvasProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const isDrawingRef = React.useRef(false);
  const pathRef = React.useRef<Point[]>([]);
  const animationFrameRef = React.useRef<number>(0);
  const [livePoint, setLivePoint] = React.useState<Point | null>(null);

  const getCoords = React.useCallback((e: MouseEvent): Point | null => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;
    
    // Calculate coordinates relative to the image (in image pixels)
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Clamp to image boundaries
    const dimensions = { width: imageRef.current.naturalWidth, height: imageRef.current.naturalHeight };
    return {
      x: Math.max(0, Math.min(dimensions.width, x)),
      y: Math.max(0, Math.min(dimensions.height, y)),
    };
  }, [imageRef]);

  const drawPath = React.useCallback((ctx: CanvasRenderingContext2D, path: Point[], dashOffset = 0) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (path.length < 2) return;

    ctx.save();
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // 1. Draw the main path (closed loop if finalized, or open if drawing)
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    
    // If polygonal lasso is active and not finalized, draw the live segment
    if (activeTool === 'lassoPoly' && livePoint) {
      ctx.lineTo(livePoint.x, livePoint.y);
    } else if (activeTool === 'lasso') {
      // Freehand lasso closes the loop
      ctx.closePath();
    }

    // Draw white dashed line
    ctx.strokeStyle = "rgba(255, 255, 255, 1)";
    ctx.lineDashOffset = dashOffset;
    ctx.stroke();

    // Draw black dashed line (offset by half dash length)
    ctx.strokeStyle = "rgba(0, 0, 0, 1)";
    ctx.lineDashOffset = dashOffset + 6;
    ctx.stroke();
    
    // Draw points for polygonal lasso
    if (activeTool === 'lassoPoly') {
      path.forEach(p => {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      });
    }

    ctx.restore();
  }, [livePoint, activeTool]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !selectionPath) {
      ctx?.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      return;
    }

    let offset = 0;
    const animate = () => {
      offset += 0.5;
      drawPath(ctx, selectionPath, offset);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [selectionPath, drawPath]);

  // --- Freehand Lasso Logic ---
  const startDrawing = React.useCallback((e: MouseEvent) => {
    if (activeTool !== 'lasso') return;
    const coords = getCoords(e);
    if (!coords) return;
    isDrawingRef.current = true;
    pathRef.current = [coords];
    // We don't clear selectionPath here, as it might hold a previous selection mask.
    // The parent component handles clearing the mask if a new selection starts.
  }, [getCoords, activeTool]);

  const draw = React.useCallback((e: MouseEvent) => {
    if (activeTool === 'lasso' && isDrawingRef.current) {
      const coords = getCoords(e);
      if (!coords) return;
      pathRef.current.push(coords);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      // Draw live freehand path (non-dashed)
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      if (pathRef.current.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(pathRef.current[0].x, pathRef.current[0].y);
      for (let i = 1; i < pathRef.current.length; i++) {
        ctx.lineTo(pathRef.current[i].x, pathRef.current[i].y);
      }
      
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 1)";
      ctx.lineWidth = 1;
      ctx.stroke();
      
    } else if (activeTool === 'lassoPoly' && selectionPath && selectionPath.length > 0) {
      // Polygonal lasso live segment tracking
      const coords = getCoords(e);
      if (coords) {
        setLivePoint(coords);
      }
    }
  }, [getCoords, activeTool, selectionPath]);

  const endDrawing = React.useCallback(() => {
    if (activeTool === 'lasso' && isDrawingRef.current) {
      isDrawingRef.current = false;
      onSelectionComplete(pathRef.current);
      pathRef.current = [];
    }
  }, [onSelectionComplete, activeTool]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    // Set canvas dimensions to the natural size of the image
    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;

    document.addEventListener("mousemove", draw);
    document.addEventListener("mouseup", endDrawing);

    return () => {
      document.removeEventListener("mousemove", draw);
      document.removeEventListener("mouseup", endDrawing);
    };
  }, [draw, endDrawing, imageRef, imageRef.current?.complete]);

  const cursorStyle = activeTool === 'lasso' ? pencilCursor : polyLassoCursor;

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-auto"
      style={{ cursor: cursorStyle }}
      onMouseDown={(e) => startDrawing(e.nativeEvent)}
    />
  );
};