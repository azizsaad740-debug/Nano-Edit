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
  const pathPointsRef = React.useRef<Array<{ x: number; y: number; pressure?: number }>>([]); // Added pressure for future use
  const animationFrameIdRef = React.useRef<number | null>(null);

  const getCoords = React.useCallback((e: MouseEvent): { x: number; y: number; pressure?: number } | null => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: (e as PointerEvent).pressure || 0.5, // Default pressure if not a PointerEvent
    };
  }, [imageRef]);

  const applyBrushSettings = React.useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = brushState.color;
    ctx.lineWidth = brushState.size;
    ctx.globalAlpha = brushState.opacity / 100;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over';

    // Simulate hardness using shadowBlur
    // A hardness of 100 means no blur (sharp edge), 0 means maximum blur (softest edge)
    const maxBlur = brushState.size * 0.75; // Max blur can be up to 75% of brush size
    ctx.shadowBlur = maxBlur * (1 - brushState.hardness / 100);
    ctx.shadowColor = brushState.color; // Shadow color should match brush color for soft edges
    if (activeTool === 'eraser') {
      ctx.shadowColor = 'rgba(0,0,0,1)'; // Eraser shadow should be opaque black for destination-out
    }
  }, [brushState, activeTool]);

  const drawPath = React.useCallback((ctx: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>) => {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    // Implement basic smoothing using quadratic curves
    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];

      // Calculate control point for quadratic curve
      const controlX = p1.x;
      const controlY = p1.y;

      // Calculate midpoint between p1 and p2 for smoother connection
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      // Adjust control point based on smoothness
      const smoothFactor = brushState.smoothness / 100;
      const smoothedControlX = controlX * (1 - smoothFactor) + midX * smoothFactor;
      const smoothedControlY = controlY * (1 - smoothFactor) + midY * smoothFactor;

      ctx.quadraticCurveTo(smoothedControlX, smoothedControlY, midX, midY);
    }
    // Draw the last segment
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
  }, [brushState.smoothness]);

  const renderLiveStroke = React.useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear for redraw of live preview
    applyBrushSettings(ctx); // Apply settings for live preview

    drawPath(ctx, pathPointsRef.current);

    if (isDrawingRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(renderLiveStroke);
    }
  }, [applyBrushSettings, drawPath]);

  const startDrawing = React.useCallback((e: MouseEvent) => {
    const coords = getCoords(e);
    if (!coords || !contextRef.current) return;
    isDrawingRef.current = true;
    pathPointsRef.current = [coords];
    animationFrameIdRef.current = requestAnimationFrame(renderLiveStroke);
  }, [getCoords, renderLiveStroke]);

  const draw = React.useCallback((e: MouseEvent) => {
    if (!isDrawingRef.current) return;
    const currentCoords = getCoords(e);
    if (!currentCoords) return;
    pathPointsRef.current.push(currentCoords);
  }, [getCoords]);

  const endDrawing = React.useCallback(() => {
    if (!isDrawingRef.current || !canvasRef.current || !imageRef.current) return;
    isDrawingRef.current = false;
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    // Create an offscreen canvas to render the final stroke
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = imageRef.current.naturalWidth;
    offscreenCanvas.height = imageRef.current.naturalHeight;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    if (offscreenCtx) {
      applyBrushSettings(offscreenCtx); // Apply settings to offscreen canvas
      drawPath(offscreenCtx, pathPointsRef.current); // Draw the complete path
      onDrawEnd(offscreenCanvas.toDataURL());
    } else {
      console.error("Failed to get offscreen canvas context for brush stroke.");
    }

    // Clear the live preview canvas after drawing is complete
    contextRef.current?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    pathPointsRef.current = [];
  }, [onDrawEnd, imageRef, applyBrushSettings, drawPath]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    contextRef.current = ctx;

    // Use Pointer Events for better brush control (pressure, etc.)
    canvas.addEventListener("pointerdown", startDrawing);
    canvas.addEventListener("pointermove", draw);
    canvas.addEventListener("pointerup", endDrawing);
    canvas.addEventListener("pointerleave", endDrawing); // End drawing if pointer leaves canvas

    return () => {
      canvas.removeEventListener("pointerdown", startDrawing);
      canvas.removeEventListener("pointermove", draw);
      canvas.removeEventListener("pointerup", endDrawing);
      canvas.removeEventListener("pointerleave", endDrawing);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [startDrawing, draw, endDrawing, imageRef]); // Dependencies for useEffect
  
  // Update brush settings on contextRef when brushState changes
  React.useEffect(() => {
    if (contextRef.current) {
      applyBrushSettings(contextRef.current);
    }
  }, [brushState, activeTool, applyBrushSettings]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-auto touch-none" // Use touch-none to prevent browser scrolling/zooming
    />
  );
};