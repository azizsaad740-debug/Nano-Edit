import * as React from "react";
import type { Point } from "@/types/editor";

interface MarqueeCanvasProps {
  start: Point;
  current: Point;
  activeTool: 'marqueeRect' | 'marqueeEllipse'; // Added activeTool
}

const MarqueeCanvas = ({ start, current, activeTool }: MarqueeCanvasProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationFrameRef = React.useRef<number>(0);

  const drawMarquee = React.useCallback((ctx: CanvasRenderingContext2D, dashOffset: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Convert screen coordinates (start, current) to local coordinates relative to the canvas origin (0,0)
    // Since the canvas is inside the scaled image container, its bounding box reflects the scaled size.
    const localStart: Point = { x: start.x - rect.left, y: start.y - rect.top };
    const localCurrent: Point = { x: current.x - rect.left, y: current.y - rect.top };

    const x = Math.min(localStart.x, localCurrent.x);
    const y = Math.min(localStart.y, localCurrent.y);
    const w = Math.abs(localStart.x - localCurrent.x);
    const h = Math.abs(localStart.y - localCurrent.y);

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (w < 5 || h < 5) return; // Don't draw tiny selections

    ctx.save();
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);

    ctx.beginPath();
    
    if (activeTool === 'marqueeEllipse') {
      // Draw ellipse: (centerX, centerY, radiusX, radiusY, rotation, startAngle, endAngle)
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
    } else {
      ctx.rect(x, y, w, h);
    }

    // Draw white dashed line
    ctx.strokeStyle = "rgba(255, 255, 255, 1)";
    ctx.lineDashOffset = dashOffset;
    ctx.stroke();

    // Draw black dashed line (offset by half dash length)
    ctx.strokeStyle = "rgba(0, 0, 0, 1)";
    ctx.lineDashOffset = dashOffset + 6;
    ctx.stroke();
    
    ctx.restore();
  }, [start, current, activeTool]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match the parent container's scaled size
    // We rely on CSS to stretch it to 100% of the scaled container.
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let offset = 0;
    const animate = () => {
      offset += 0.5;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawMarquee(ctx, offset);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [drawMarquee]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-20" // Changed from fixed to absolute
    />
  );
};

export default MarqueeCanvas;