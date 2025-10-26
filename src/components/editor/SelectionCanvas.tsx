"use client";

import * as React from "react";
import type { Point } from "@/types/editor";

interface SelectionCanvasProps {
  imageRef: React.RefObject<HTMLImageElement>;
  onSelectionComplete: (path: Point[]) => void;
  selectionPath: Point[] | null;
}

const pencilCursor = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>\') 0 24, auto';

export const SelectionCanvas = ({
  imageRef,
  onSelectionComplete,
  selectionPath,
}: SelectionCanvasProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const isDrawingRef = React.useRef(false);
  const pathRef = React.useRef<Point[]>([]);
  const animationFrameRef = React.useRef<number>(0);

  const getCoords = React.useCallback((e: MouseEvent): Point | null => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, [imageRef]);

  const drawPath = React.useCallback((ctx: CanvasRenderingContext2D, path: Point[], dashOffset = 0) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (path.length < 2) return;

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 1)";
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = dashOffset;

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = "rgba(0, 0, 0, 1)";
    ctx.lineDashOffset = dashOffset + 6;
    ctx.stroke();
    ctx.restore();
  }, []);

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

  const startDrawing = React.useCallback((e: MouseEvent) => {
    const coords = getCoords(e);
    if (!coords) return;
    isDrawingRef.current = true;
    pathRef.current = [coords];
    onSelectionComplete([]); // Clear existing selection
  }, [getCoords, onSelectionComplete]);

  const draw = React.useCallback((e: MouseEvent) => {
    if (!isDrawingRef.current) return;
    const coords = getCoords(e);
    if (!coords) return;
    pathRef.current.push(coords);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

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
  }, [getCoords]);

  const endDrawing = React.useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    onSelectionComplete(pathRef.current);
    pathRef.current = [];
  }, [onSelectionComplete]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;

    document.addEventListener("mousemove", draw);
    document.addEventListener("mouseup", endDrawing);

    return () => {
      document.removeEventListener("mousemove", draw);
      document.removeEventListener("mouseup", endDrawing);
    };
  }, [draw, endDrawing, imageRef, imageRef.current?.complete]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-auto"
      style={{ cursor: pencilCursor }}
      onMouseDown={(e) => startDrawing(e.nativeEvent)}
    />
  );
};