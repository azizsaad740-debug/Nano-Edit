"use client";

import * as React from "react";
import { type BrushState, type Layer } from "@/hooks/useEditorState";

interface LiveBrushCanvasProps {
  brushState: BrushState;
  imageRef: React.RefObject<HTMLImageElement>;
  onDrawEnd: (dataUrl: string, layerId: string) => void;
  activeTool: "brush" | "eraser" | "selectionBrush" | "blurBrush"; // Added blurBrush
  selectedLayerId: string | null;
  onAddDrawingLayer: () => string;
  layers: Layer[];
  isSelectionBrush: boolean;
  onSelectionBrushStrokeEnd?: (strokeDataUrl: string, operation: 'add' | 'subtract') => void;
  onBlurBrushStrokeEnd?: (strokeDataUrl: string, operation: 'add' | 'subtract') => void; // UPDATED: Removed blurAmount
  foregroundColor: string;
  backgroundColor: string;
}

export const LiveBrushCanvas = ({
  brushState,
  imageRef,
  onDrawEnd,
  activeTool,
  selectedLayerId,
  onAddDrawingLayer,
  layers,
  isSelectionBrush,
  onSelectionBrushStrokeEnd,
  onBlurBrushStrokeEnd, // Destructure
  foregroundColor,
  backgroundColor,
}: LiveBrushCanvasProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const contextRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = React.useRef(false);
  const pathPointsRef = React.useRef<Array<{ x: number; y: number; pressure?: number }>>([]);
  const animationFrameIdRef = React.useRef<number | null>(null);
  const activeDrawingLayerIdRef = React.useRef<string | null>(null);

  const isBlurBrush = activeTool === 'blurBrush'; // NEW flag

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

  const applyBrushSettings = React.useCallback((ctx: CanvasRenderingContext2D, operation: 'add' | 'subtract' = 'add') => {
    ctx.lineWidth = brushState.size;
    ctx.lineJoin = brushState.shape === 'circle' ? "round" : "miter";
    ctx.lineCap = brushState.shape === 'circle' ? "round" : "butt";

    const maxBlur = brushState.size * 0.75;
    ctx.shadowBlur = maxBlur * (1 - brushState.hardness / 100);

    if (isSelectionBrush || isBlurBrush) { // Handle selection and blur brushes (mask drawing)
      ctx.globalCompositeOperation = 'source-over'; 
      
      // Grayscale value based on opacity (0-255). White = max effect.
      const grayValue = Math.round(255 * (brushState.opacity / 100));
      const color = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
      
      // Determine if we are adding (drawing gray) or subtracting (drawing black)
      const isAdding = foregroundColor === brushState.color; 

      if (isBlurBrush) {
        // For blur brush, we draw the intensity mask.
        // If adding blur, draw gray based on opacity. If subtracting, draw black (0 blur).
        ctx.strokeStyle = isAdding ? color : 'black';
        ctx.fillStyle = isAdding ? color : 'black';
        ctx.shadowColor = isAdding ? color : 'black';
        ctx.globalAlpha = 1.0; // Full opacity for the mask itself
      } else { // Selection brush
        ctx.strokeStyle = operation === 'add' ? 'white' : 'black';
        ctx.fillStyle = operation === 'add' ? 'white' : 'black';
        ctx.shadowColor = operation === 'add' ? 'white' : 'black';
        ctx.globalAlpha = 1.0;
      }
    } else if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over'; 
      ctx.strokeStyle = 'rgba(0,0,0,1)'; 
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.shadowColor = 'rgba(0,0,0,1)';
      ctx.globalAlpha = 1.0; 
    } else { // brush tool
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushState.color;
      ctx.fillStyle = brushState.color;
      ctx.shadowColor = brushState.color;
      ctx.globalAlpha = brushState.opacity / 100;
    }
  }, [brushState, activeTool, isSelectionBrush, isBlurBrush, foregroundColor]);

  const drawPath = React.useCallback((ctx: CanvasRenderingContext2D, points: Array<{ x: number; y: number; pressure?: number }>) => {
    if (points.length < 1) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke(); // Draw the continuous line
  }, []);

  const renderLiveStroke = React.useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    if (isSelectionBrush || isBlurBrush) {
      // No live drawing on this canvas for mask brushes.
    } else {
      // For regular brush/eraser, draw live preview
      applyBrushSettings(ctx, foregroundColor === brushState.color ? 'add' : 'subtract');
      drawPath(ctx, pathPointsRef.current);
    }

    if (isDrawingRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(renderLiveStroke);
    }
  }, [drawPath, foregroundColor, brushState.color, isSelectionBrush, isBlurBrush, applyBrushSettings]);

  const startDrawing = React.useCallback((e: MouseEvent) => {
    const coords = getCoords(e);
    if (!coords || !contextRef.current) return;

    if (!isSelectionBrush && !isBlurBrush) { // Only check for drawing layer if not a mask brush
      const selectedLayer = layers.find(l => l.id === selectedLayerId);
      if (selectedLayer && selectedLayer.type === 'drawing') {
        activeDrawingLayerIdRef.current = selectedLayerId;
      } else {
        activeDrawingLayerIdRef.current = onAddDrawingLayer(); // Create a new drawing layer
      }
    }

    isDrawingRef.current = true;
    pathPointsRef.current = [coords];
    animationFrameIdRef.current = requestAnimationFrame(renderLiveStroke);
  }, [getCoords, renderLiveStroke, selectedLayerId, onAddDrawingLayer, layers, isSelectionBrush, isBlurBrush]);

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
      const operation = foregroundColor === brushState.color ? 'add' : 'subtract'; 
      
      applyBrushSettings(offscreenCtx, operation);
      drawPath(offscreenCtx, pathPointsRef.current);

      if (isSelectionBrush && onSelectionBrushStrokeEnd) {
        onSelectionBrushStrokeEnd(offscreenCanvas.toDataURL(), operation);
      } else if (isBlurBrush && onBlurBrushStrokeEnd) { // NEW: Handle blur brush end
        const blurOperation = foregroundColor === brushState.color ? 'add' : 'subtract';
        onBlurBrushStrokeEnd(offscreenCanvas.toDataURL(), blurOperation); // UPDATED: Removed blurAmount
      } else if (activeTool !== 'selectionBrush' && activeDrawingLayerIdRef.current) {
        onDrawEnd(offscreenCanvas.toDataURL(), activeDrawingLayerIdRef.current);
      }
    } else {
      console.error("Failed to get offscreen canvas context for brush stroke.");
    }

    contextRef.current?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    pathPointsRef.current = [];
    activeDrawingLayerIdRef.current = null; 
  }, [onDrawEnd, imageRef, applyBrushSettings, drawPath, isSelectionBrush, isBlurBrush, onSelectionBrushStrokeEnd, onBlurBrushStrokeEnd, activeTool, foregroundColor, brushState.color]);

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
    if (contextRef.current && !isSelectionBrush && !isBlurBrush) { // Only apply live settings for non-mask brushes
      applyBrushSettings(contextRef.current, foregroundColor === brushState.color ? 'add' : 'subtract');
    }
  }, [brushState, activeTool, applyBrushSettings, isSelectionBrush, isBlurBrush, foregroundColor]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-auto touch-none"
    />
  );
};