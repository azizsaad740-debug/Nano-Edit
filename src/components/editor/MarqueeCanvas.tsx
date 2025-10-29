import * as React from "react";
import type { Point } from "@/types/editor";

interface MarqueeCanvasProps {
  start: Point;
  current: Point;
}

const MarqueeCanvas = ({ start, current }: MarqueeCanvasProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationFrameRef = React.useRef<number>(0);

  const drawMarquee = React.useCallback((ctx: CanvasRenderingContext2D, dashOffset: number) => {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);

    const x = Math.min(start.x, current.x);
    const y = Math.min(start.y, current.y);
    const w = Math.abs(start.x - current.x);
    const h = Math.abs(start.y - current.y);

    if (w < 5 || h < 5) return; // Don't draw tiny selections

    ctx.save();
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);

    // Draw white dashed line
    ctx.strokeStyle = "rgba(255, 255, 255, 1)";
    ctx.lineDashOffset = dashOffset;
    ctx.strokeRect(x, y, w, h);

    // Draw black dashed line (offset by half dash length)
    ctx.strokeStyle = "rgba(0, 0, 0, 1)";
    ctx.lineDashOffset = dashOffset + 6;
    ctx.strokeRect(x, y, w, h);
    
    ctx.restore();
  }, [start, current]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    // Set canvas size to viewport size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let offset = 0;
    const animate = () => {
      offset += 0.5;
      drawMarquee(ctx, offset);
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
      className="fixed inset-0 pointer-events-none z-20"
    />
  );
};

export default MarqueeCanvas;