"use client";

import * as React from "react";
import { type BrushState, type Layer } from "@/types/editor";

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
  onSelectiveBlurStrokeEnd?: (strokeDataUrl: string, operation: 'add' | 'subtract') => void; // Renamed from onBlurBrushStrokeEnd
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
  onSelectiveBlurStrokeEnd, // Destructure using the correct name
  foregroundColor,
  backgroundColor,
}: LiveBrushCanvasProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const contextRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = React.useRef(false);
  const pathPointsRef = React.useRef<Array<{ x: number; y: number; pressure?: number }>>([]);
  const animationFrameIdRef = React.useRef<number | null>(null);
  const activeDrawingLayerIdRef = React.useRef<string | null>(null);
  const currentOperationRef = React.useRef<'add' | 'subtract'>('add'); // Track current operation

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
      const isAdding = operation === 'add'; 

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
      // When generating the stroke image for the eraser, we draw an opaque stroke (source-over)
      // The erasing composite operation (destination-out) is applied in useLayers.ts when merging.
      ctx.globalCompositeOperation = 'source-over'; 
      ctx.strokeStyle = 'rgba(0,0,0,1)'; 
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.shadowColor = 'rgba(0,0,0,1)';
      ctx.globalAlpha = brushState.opacity / 100; // Use brush opacity for eraser transparency
    } else { // brush tool
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = foregroundColor; // Use foregroundColor directly
      ctx.fillStyle = foregroundColor;
      ctx.shadowColor = foregroundColor;
      ctx.globalAlpha = brushState.opacity / 100;
    }
  }, [brushState, activeTool, isSelectionBrush, isBlurBrush, foregroundColor]);

  const drawPath = React.useCallback((ctx: CanvasRenderingContext2D, points: Array<{ x: number; y: number; pressure?: number }>, shape: 'circle' | 'square', size: number) => {
    if (points.length < 1) return;

    if (points.length === 1) {
      // Handle single point click/tap by drawing a filled shape
      ctx.beginPath();
      const p = points[0];
      const radius = size / 2;
      
      if (shape === 'circle') {
        ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - radius, p.y - radius, size, size);
      }
      return;
    }

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
      applyBrushSettings(ctx, 'add'); // Live preview always draws based on foreground/tool settings
      drawPath(ctx, pathPointsRef.current, brushState.shape, brushState.size);
    }

    if (isDrawingRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(renderLiveStroke);
    }
  }, [drawPath, isSelectionBrush, isBlurBrush, applyBrushSettings, brushState.shape, brushState.size]);

  const startDrawing = React.useCallback((e: MouseEvent) => {
    const coords = getCoords(e);
    if (!coords || !contextRef.current) return;

    // Determine operation based on mouse button
    const operation = e.button === 2 ? 'subtract' : 'add';
    currentOperationRef.current = operation;

    if (!isSelectionBrush && !isBlurBrush) { 
      // Regular brush/eraser: ensure we have a drawing layer
      const selectedLayer = layers.find(l => l.id === selectedLayerId);
      if (selectedLayer && selectedLayer.type === 'drawing') {
        activeDrawingLayerIdRef.current = selectedLayerId;
      } else if (activeTool === 'brush' || activeTool === 'eraser') {
        // Only create a new layer if using brush or eraser, not if using mask tools
        activeDrawingLayerIdRef.current = onAddDrawingLayer(); 
      } else {
        return; // Do nothing if no drawing layer is selected and tool is not brush/eraser
      }
    }

    isDrawingRef.current = true;
    pathPointsRef.current = [coords];
    animationFrameIdRef.current = requestAnimationFrame(renderLiveStroke);
  }, [getCoords, renderLiveStroke, selectedLayerId, onAddDrawingLayer, layers, isSelectionBrush, isBlurBrush, activeTool]);

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
      const operation = currentOperationRef.current;
      
      applyBrushSettings(offscreenCtx, operation);
      drawPath(offscreenCtx, pathPointsRef.current, brushState.shape, brushState.size);

      if (isSelectionBrush && onSelectionBrushStrokeEnd) {
        onSelectionBrushStrokeEnd(offscreenCanvas.toDataURL(), operation);
      } else if (isBlurBrush && onSelectiveBlurStrokeEnd) { 
        onSelectiveBlurStrokeEnd(offscreenCanvas.toDataURL(), operation); 
      } else if (activeDrawingLayerIdRef.current) {
        // Regular brush/eraser uses onDrawEnd (which is handleDrawingStrokeEnd from useLayers)
        onDrawEnd(offscreenCanvas.toDataURL(), activeDrawingLayerIdRef.current);
      }
    } else {
      console.error("Failed to get offscreen canvas context for brush stroke.");
    }

    contextRef.current?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    pathPointsRef.current = [];
    activeDrawingLayerIdRef.current = null; 
  }, [onDrawEnd, imageRef, applyBrushSettings, drawPath, isSelectionBrush, isBlurBrush, onSelectionBrushStrokeEnd, onSelectiveBlurStrokeEnd, brushState.shape, brushState.size]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    contextRef.current = ctx;

    // Use pointer events for better compatibility with pressure/touch
    canvas.addEventListener("pointerdown", startDrawing);
    canvas.addEventListener("pointermove", draw);
    canvas.addEventListener("pointerup", endDrawing);
    canvas.addEventListener("pointerleave", endDrawing);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault()); // Prevent context menu on right click

    return () => {
      canvas.removeEventListener("pointerdown", startDrawing);
      canvas.removeEventListener("pointermove", draw);
      canvas.removeEventListener("pointerup", endDrawing);
      canvas.removeEventListener("pointerleave", endDrawing);
      canvas.removeEventListener("contextmenu", (e) => e.preventDefault());
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [startDrawing, draw, endDrawing, imageRef]);
  
  React.useEffect(() => {
    // Update brush settings when state changes
    if (contextRef.current) {
      applyBrushSettings(contextRef.current, 'add');
    }
  }, [brushState, activeTool, applyBrushSettings, foregroundColor]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-auto touch-none"
    />
  );
};