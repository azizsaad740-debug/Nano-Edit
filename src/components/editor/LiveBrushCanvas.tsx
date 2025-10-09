"use client";

import * as React from "react";
import { type BrushState } from "@/hooks/useEditorState";

interface LiveBrushCanvasProps {
  brushState: BrushState;
  imageRef: React.RefObject<HTMLImageElement>;
  onDrawEnd: (dataUrl: string) => void;
}

export const LiveBrushCanvas = ({
  brushState,
  imageRef,
  onDrawEnd,
}: LiveBrushCanvasProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const contextRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = React.useRef(false);

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

  const startDrawing = React.useCallback((e: MouseEvent) => {
    const coords = getCoords(e);
    if (!coords || !contextRef.current) return;
    isDrawingRef.current = true;
    contextRef.current.beginPath();
    contextRef.current.moveTo(coords.x, coords.y);
  }, [getCoords]);

  const draw = React.useCallback((e: MouseEvent) => {
    if (!isDrawingRef.current) return;
    const coords = getCoords(e);
    if (!coords || !contextRef.current) return;
    contextRef.current.lineTo(coords.x, coords.y);
    contextRef.current.stroke();
  }, [getCoords]);

  const endDrawing = React.useCallback(() => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    isDrawingRef.current = false;
    contextRef.current?.closePath();
    onDrawEnd(canvasRef.current.toDataURL());
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
    contextRef.current = ctx;

    document.addEventListener("mousemove", draw);
    document.addEventListener("mouseup", endDrawing, { once: true });

    return () => {
      document.removeEventListener("mousemove", draw);
      document.removeEventListener("mouseup", endDrawing);
    };
  }, [brushState, draw, endDrawing, imageRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full cursor-crosshair"
      onMouseDown={(e) => startDrawing(e.nativeEvent)}
    />
  );
};