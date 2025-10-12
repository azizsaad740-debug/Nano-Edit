"use client";

import * as React from "react";
import { type BrushState, type Layer } from "@/hooks/useEditorState";

interface LiveBrushCanvasProps {
  brushState: BrushState;
  imageRef: React.RefObject<HTMLImageElement>;
  onDrawEnd: (dataUrl: string, layerId: string) => void;
  activeTool: "brush" | "eraser";
  selectedLayerId: string | null;
  onAddDrawingLayer: () => string;
  layers: Layer[]; // Added layers prop
}

export const LiveBrushCanvas = ({
  brushState,
  imageRef,
  onDrawEnd,
  activeTool,
  selectedLayerId,
  onAddDrawingLayer,
  layers, // Destructure layers
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
      pressure: (e as PointerEvent).pressure || 0.5,
    };
  }, [imageRef]);

  const applyBrushSettings = React.useCallback((ctx: CanvasRenderingContext2D, isFinalRender: boolean) => {
    ctx.lineWidth = brushState.size;
    ctx.globalAlpha = brushState.opacity / 100;
    ctx.lineJoin = brushState.shape === 'circle' ? "round" : "miter";
    ctx.lineCap = brushState.shape === 'circle' ? "round" : "butt";

    const maxBlur = brushState.size * 0.75;
    ctx.shadowBlur = maxBlur * (1 - brushState.hardness / 100);

    if (activeTool === 'eraser') {
      if (isFinalRender) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)'; // Black for erasing
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.shadowColor = 'rgba(0,0,0,1)';
      } else { // Live preview for eraser
        ctx.globalCompositeOperation = 'source-over'; // Always draw visibly for live preview
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)'; // Semi-transparent grey
        ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
      }
    } else { // brush tool
      ctx.globalCompositeOperation = 'source-over'; // Always draw visibly for live preview
      ctx.strokeStyle = brushState.color;
      ctx.fillStyle = brushState.color;
      ctx.shadowColor = brushState.color;
    }
  }, [brushState, activeTool]);

  const drawPath = React.useCallback((ctx: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>) => {
    if (points.length === 0) return;

    if (points.length === 1) {
      // Draw a single dot for the very first point
      ctx.beginPath();
      if (brushState.shape === 'circle') {
        ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, 2 * Math.PI); // Draw a circle with radius half the line width
      } else { // square
        ctx.rect(points[0].x - ctx.lineWidth / 2, points[0].y - ctx.lineWidth / 2, ctx.lineWidth, ctx.lineWidth);
      }
      ctx.fill(); // Fill the shape
      return;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];

      const controlX = p1.x;
      const controlY = p1.y;

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      const smoothFactor = brushState.smoothness / 100;
      const smoothedControlX = controlX * (1 - smoothFactor) + midX * smoothFactor;
      const smoothedControlY = controlY * (1 - smoothFactor) + midY * smoothFactor;

      ctx.quadraticCurveTo(smoothedControlX, smoothedControlY, midX, midY);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
  }, [brushState.smoothness, brushState.shape]);

  const renderLiveStroke = React.useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    applyBrushSettings(ctx, false); // Pass false for live render

    drawPath(ctx, pathPointsRef.current);

    if (isDrawingRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(renderLiveStroke);
    }
  }, [applyBrushSettings, drawPath]);

  const startDrawing = React.useCallback((e: MouseEvent) => {
    const coords = getCoords(e);
    if (!coords || !contextRef.current) return;

    // Determine which layer to draw on
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (selectedLayer && selectedLayer.type === 'drawing') {
      activeDrawingLayerIdRef.current = selectedLayerId;
    } else {
      activeDrawingLayerIdRef.current = onAddDrawingLayer(); // Create a new drawing layer
    }

    isDrawingRef.current = true;
    pathPointsRef.current = [coords];
    animationFrameIdRef.current = requestAnimationFrame(renderLiveStroke);
  }, [getCoords, renderLiveStroke, selectedLayerId, onAddDrawingLayer, layers]);

  const draw = React.useCallback((e: MouseEvent) => {
    if (!isDrawingRef.current) return;
    const currentCoords = getCoords(e);
    if (!currentCoords) return;
    pathPointsRef.current.push(currentCoords);
  }, [getCoords]);

  const endDrawing = React.useCallback(() => {
    if (!isDrawingRef.current || !canvasRef.current || !imageRef.current || !activeDrawingLayerIdRef.current) return;
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
      applyBrushSettings(offscreenCtx, true); // Pass true for final render
      drawPath(offscreenCtx, pathPointsRef.current);
      onDrawEnd(offscreenCanvas.toDataURL(), activeDrawingLayerIdRef.current);
    } else {
      console.error("Failed to get offscreen canvas context for brush stroke.");
    }

    contextRef.current?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    pathPointsRef.current = [];
    activeDrawingLayerIdRef.current = null; // Reset active drawing layer
  }, [onDrawEnd, imageRef, applyBrushSettings, drawPath]);

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