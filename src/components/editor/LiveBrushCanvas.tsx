"use client";

import * as React from "react";
import { type BrushState, type Layer } from "@/hooks/useEditorState";

interface LiveBrushCanvasProps {
  brushState: BrushState;
  imageRef: React.RefObject<HTMLImageElement>;
  onDrawEnd: (dataUrl: string, layerId: string) => void;
  activeTool: "brush" | "eraser" | "selectionBrush"; // Added selectionBrush
  selectedLayerId: string | null;
  onAddDrawingLayer: () => string;
  layers: Layer[];
  isSelectionBrush: boolean; // New prop
  onSelectionBrushStrokeEnd?: (strokeDataUrl: string, operation: 'add' | 'subtract') => void; // New prop
  foregroundColor: string; // New prop
  backgroundColor: string; // New prop
}

export const LiveBrushCanvas = ({
  brushState,
  imageRef,
  onDrawEnd,
  activeTool,
  selectedLayerId,
  onAddDrawingLayer,
  layers,
  isSelectionBrush, // Destructure
  onSelectionBrushStrokeEnd, // Destructure
  foregroundColor, // Destructure
  backgroundColor, // Destructure
}: LiveBrushCanvasProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const contextRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = React.useRef(false);
  const pathPointsRef = React.useRef<Array<{ x: number; y: number; pressure?: number }>>([]);
  const animationFrameIdRef = React.useRef<number | null>(null);
  const activeDrawingLayerIdRef = React.useRef<string | null>(null);

  const getCoords = React.useCallback((e: MouseEvent): { x: number; y: number; pressure?: number } | null => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: (e as PointerEvent).pressure || 0.5, // Capture pressure, default to 0.5 for mouse
    };
  }, [imageRef]);

  const applyBrushSettings = React.useCallback((ctx: CanvasRenderingContext2D, isFinalRender: boolean, operation: 'add' | 'subtract' = 'add') => {
    ctx.lineWidth = brushState.size;
    ctx.lineJoin = brushState.shape === 'circle' ? "round" : "miter";
    ctx.lineCap = brushState.shape === 'circle' ? "round" : "butt";

    const maxBlur = brushState.size * 0.75;
    ctx.shadowBlur = maxBlur * (1 - brushState.hardness / 100);

    if (isSelectionBrush) {
      ctx.globalCompositeOperation = 'source-over'; // Always draw visibly for live preview
      if (isFinalRender) {
        ctx.strokeStyle = operation === 'add' ? 'white' : 'black';
        ctx.fillStyle = operation === 'add' ? 'white' : 'black';
        ctx.shadowColor = operation === 'add' ? 'white' : 'black';
        ctx.globalAlpha = 1.0; // Full opacity for final mask
      } else {
        ctx.strokeStyle = operation === 'add' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 255, 0.5)'; // Red for add, Blue for subtract
        ctx.fillStyle = operation === 'add' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 255, 0.5)';
        ctx.shadowColor = operation === 'add' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 255, 0.5)';
        ctx.globalAlpha = 0.5; // 50% opacity for live preview
      }
    } else if (activeTool === 'eraser') {
      if (isFinalRender) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)'; // Black for erasing
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.shadowColor = 'rgba(0,0,0,1)';
        ctx.globalAlpha = 1.0;
      } else { // Live preview for eraser
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)'; // Semi-transparent grey
        ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.globalAlpha = 0.5;
      }
    } else { // brush tool
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushState.color;
      ctx.fillStyle = brushState.color;
      ctx.shadowColor = brushState.color;
      ctx.globalAlpha = brushState.opacity / 100;
    }
  }, [brushState, activeTool, isSelectionBrush]);

  const drawPath = React.useCallback((ctx: CanvasRenderingContext2D, points: Array<{ x: number; y: number; pressure?: number }>, operation: 'add' | 'subtract' = 'add') => {
    if (points.length === 0) return;

    // Temporarily ignore smoothness for this drawing method, as it's designed for continuous paths.
    // For true smoothness with variable width, more complex interpolation and drawing is needed.

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const pressure = p.pressure || 0.5; // Default pressure for mouse events

      const effectiveSize = brushState.size * pressure;
      const effectiveOpacity = (brushState.opacity / 100) * pressure;

      // Apply settings for each point
      applyBrushSettings(ctx, false, operation); // Use false for live render, operation for color
      ctx.globalAlpha = effectiveOpacity; // Apply opacity per point

      ctx.beginPath();
      if (brushState.shape === 'circle') {
        ctx.arc(p.x, p.y, effectiveSize / 2, 0, 2 * Math.PI);
      } else { // square
        ctx.rect(p.x - effectiveSize / 2, p.y - effectiveSize / 2, effectiveSize, effectiveSize);
      }
      ctx.fill();
    }
  }, [brushState.size, brushState.opacity, brushState.hardness, brushState.shape, applyBrushSettings]);

  const renderLiveStroke = React.useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    const operation = foregroundColor === brushState.color ? 'add' : 'subtract'; // Determine operation for live preview
    drawPath(ctx, pathPointsRef.current, operation);

    if (isDrawingRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(renderLiveStroke);
    }
  }, [drawPath, foregroundColor, brushState.color]);

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

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = imageRef.current.naturalWidth;
    offscreenCanvas.height = imageRef.current.naturalHeight;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    if (offscreenCtx) {
      const operation = foregroundColor === brushState.color ? 'add' : 'subtract'; // Determine operation for final render
      applyBrushSettings(offscreenCtx, true, operation); // Pass true for final render
      drawPath(offscreenCtx, pathPointsRef.current, operation);

      if (isSelectionBrush && onSelectionBrushStrokeEnd) {
        onSelectionBrushStrokeEnd(offscreenCanvas.toDataURL(), operation);
      } else if (activeTool !== 'selectionBrush' && activeDrawingLayerIdRef.current) {
        onDrawEnd(offscreenCanvas.toDataURL(), activeDrawingLayerIdRef.current);
      } else if (activeTool !== 'selectionBrush') {
        // If not selection brush and no active drawing layer, create one
        activeDrawingLayerIdRef.current = onAddDrawingLayer();
        onDrawEnd(offscreenCanvas.toDataURL(), activeDrawingLayerIdRef.current);
      }
    } else {
      console.error("Failed to get offscreen canvas context for brush stroke.");
    }

    contextRef.current?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    pathPointsRef.current = [];
    activeDrawingLayerIdRef.current = null; // Reset active drawing layer
  }, [onDrawEnd, imageRef, applyBrushSettings, drawPath, isSelectionBrush, onSelectionBrushStrokeEnd, activeTool, foregroundColor, brushState.color, onAddDrawingLayer]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    contextRef.current = ctx;

    canvas.addEventListener("pointerdown", startDrawing);
    canvas.addEventListener("pointermove", draw);
    canvas.addEventListener("pointerup", endDrawing);
    canvas.addEventListener("pointerleave", endDrawing);

    return () => {
      canvas.removeEventListener("pointerdown", startDrawing);
      canvas.removeEventListener("pointermove", draw);
      canvas.removeEventListener("pointerup", endDrawing);
      canvas.removeEventListener("pointerleave", endDrawing);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [startDrawing, draw, endDrawing, imageRef]);
  
  React.useEffect(() => {
    if (contextRef.current) {
      applyBrushSettings(contextRef.current, false); // Pass false for live render
    }
  }, [brushState, activeTool, applyBrushSettings]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-auto touch-none"
    />
  );
};