"use client";

import * as React from "react";
import { type BrushState } from "@/hooks/useEditorState";

interface LiveBrushCanvasProps {
  brushState: BrushState;
  imageRef: React.RefObject<HTMLImageElement>;
  onDrawEnd: (dataUrl: string) => void;
  activeTool: "brush" | "eraser";
}

export const LiveBrushCanvas = ({
  brushState,
  imageRef,
  onDrawEnd,
  activeTool,
}: LiveBrushCanvasProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const contextRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = React.useRef(false);
  const lastPointRef = React.useRef<{ x: number; y: number } | null>(null);
  const pathPointsRef = React.useRef<Array<{ x: number; y: number }>>([]);
  const animationFrameIdRef = React.useRef<number | null>(null);

  const getCoords = React.useCallback((e: MouseEvent) => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, [imageRef]);

  const drawSegment = React.useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx || pathPointsRef.current.length < 2) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear for redraw

    ctx.beginPath();
    ctx.moveTo(pathPointsRef.current[0].x, pathPointsRef.current[0].y);

    for (let i = 1; i < pathPointsRef.current.length; i++) {
      const p0 = pathPointsRef.current[i - 1];
      const p1 = pathPointsRef.current[i];
      // Simple linear interpolation for smoothing
      const midPoint = {
        x: p0.x + (p1.x - p0.x) * (1 - brushState.smoothness / 100),
        y: p0.y + (p1.y - p0.y) * (1 - brushState.smoothness / 100),
      };
      ctx.quadraticCurveTo(p0.x, p0.y, midPoint.x, midPoint.y);
    }
    ctx.lineTo(pathPointsRef.current[pathPointsRef.current.length - 1].x, pathPointsRef.current[pathPointsRef.current.length - 1].y);
    ctx.stroke();

    if (isDrawingRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(drawSegment);
    }
  }, [brushState.smoothness]);

  const startDrawing = React.useCallback((e: MouseEvent) => {
    const coords = getCoords(e);
    if (!coords || !contextRef.current) return;
    isDrawingRef.current = true;
    lastPointRef.current = coords;
    pathPointsRef.current = [coords];
    contextRef.current.beginPath();
    contextRef.current.moveTo(coords.x, coords.y);
    animationFrameIdRef.current = requestAnimationFrame(drawSegment);
  }, [getCoords, drawSegment]);

  const draw = React.useCallback((e: MouseEvent) => {
    if (!isDrawingRef.current) return;
    const currentCoords = getCoords(e);
    if (!currentCoords || !contextRef.current || !lastPointRef.current) return;

    const { x: lastX, y: lastY } = lastPointRef.current;
    const { x: currentX, y: currentY } = currentCoords;

    // Apply smoothness by averaging current point with last point
    const smoothedX = lastX + (currentX - lastX) * (1 - brushState.smoothness / 100);
    const smoothedY = lastY + (currentY - lastY) * (1 - brushState.smoothness / 100);
    
    pathPointsRef.current.push({ x: smoothedX, y: smoothedY });
    lastPointRef.current = { x: smoothedX, y: smoothedY };

  }, [getCoords, brushState.smoothness]);

  const endDrawing = React.useCallback(() => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    isDrawingRef.current = false;
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    contextRef.current?.closePath();
    onDrawEnd(canvasRef.current.toDataURL());
    pathPointsRef.current = [];
    lastPointRef.current = null;
  }, [onDrawEnd]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = brushState.color;
    ctx.lineWidth = brushState.size;
    ctx.globalAlpha = brushState.opacity / 100;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over';

    // Hardness simulation using shadowBlur
    // Higher hardness means less blur
    const maxBlur = brushState.size * 0.5; // Max blur can be half the brush size
    ctx.shadowBlur = maxBlur * (1 - brushState.hardness / 100);
    ctx.shadowColor = brushState.color; // Shadow color should match brush color for soft edges

    contextRef.current = ctx;

    document.addEventListener("mousemove", draw);
    document.addEventListener("mouseup", endDrawing);

    return () => {
      document.removeEventListener("mousemove", draw);
      document.removeEventListener("mouseup", endDrawing);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [brushState, draw, endDrawing, imageRef, activeTool]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full cursor-crosshair"
      onMouseDown={(e) => startDrawing(e.nativeEvent)}
    />
  );
};