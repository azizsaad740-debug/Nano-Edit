"use client";

import * as React from "react";
import type { Point, GradientToolState } from "@/types/editor";

interface GradientPreviewCanvasProps {
  start: Point;
  current: Point;
  gradientToolState: GradientToolState;
  containerRect: DOMRect;
  imageNaturalDimensions: { width: number; height: number } | null;
}

export const GradientPreviewCanvas = ({
  start,
  current,
  gradientToolState,
  containerRect,
  imageNaturalDimensions,
}: GradientPreviewCanvasProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !imageNaturalDimensions) return;

    canvas.width = imageNaturalDimensions.width;
    canvas.height = imageNaturalDimensions.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = imageNaturalDimensions.width / containerRect.width;
    const scaleY = imageNaturalDimensions.height / containerRect.height;

    const startX_px = (start.x - containerRect.left) * scaleX;
    const startY_px = (start.y - containerRect.top) * scaleY;
    const currentX_px = (current.x - containerRect.left) * scaleX;
    const currentY_px = (current.y - containerRect.top) * scaleY;

    const width_px = currentX_px - startX_px;
    const height_px = currentY_px - startY_px;

    ctx.save();

    let colors = [...gradientToolState.colors];
    let stops = [...gradientToolState.stops];

    if (gradientToolState.inverted) {
      colors = colors.reverse();
      stops = stops.map(s => 1 - s).reverse();
    }

    if (gradientToolState.type === "linear") {
      const angleRad = Math.atan2(height_px, width_px);
      const gradient = ctx.createLinearGradient(startX_px, startY_px, currentX_px, currentY_px);
      colors.forEach((color, i) => {
        gradient.addColorStop(stops[i] ?? (i / (colors.length - 1)), color);
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (gradientToolState.type === "radial") {
      const centerX_px = startX_px + width_px / 2;
      const centerY_px = startY_px + height_px / 2;
      const radius_px = Math.sqrt(width_px * width_px + height_px * height_px) / 2;

      const gradient = ctx.createRadialGradient(centerX_px, centerY_px, 0, centerX_px, centerY_px, radius_px);
      colors.forEach((color, i) => {
        gradient.addColorStop(stops[i] ?? (i / (colors.length - 1)), color);
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Apply feathering (blur) to the temporary gradient canvas
    if (gradientToolState.feather > 0) {
      ctx.filter = `blur(${gradientToolState.feather * 0.5}px)`; // Adjust blur strength
      ctx.drawImage(canvas, 0, 0); // Redraw to apply filter
    }

    ctx.restore();
  }, [start, current, gradientToolState, containerRect, imageNaturalDimensions]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};