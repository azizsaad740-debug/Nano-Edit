import React, { useRef, useMemo } from 'react';
import { useLayerTransform } from "@/hooks/useLayerTransform";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils";
import type { Layer, ActiveTool, GradientLayerData, Point } from "@/types/editor";
import { ResizeHandle } from "./ResizeHandle";
import { cn } from "@/lib/utils";
import { RotateCw } from "lucide-react";

interface GradientLayerProps {
  layer: Layer;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
  isSelected: boolean;
  activeTool: ActiveTool | null;
  imageNaturalDimensions: { width: number; height: number } | null;
  zoom: number;
  setSelectedLayerId: (id: string | null) => void;
}

export const GradientLayer = ({ layer, containerRef, onUpdate, onCommit, isSelected, activeTool, imageNaturalDimensions, zoom, setSelectedLayerId }: GradientLayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gradientLayer = layer as GradientLayerData;

  const {
    layerRef,
    handleDragMouseDown,
    handleResizeMouseDown,
    handleRotateMouseDown,
  } = useLayerTransform({
    layer,
    containerRef,
    onUpdate,
    onCommit,
    type: "gradient",
    activeTool,
    isSelected,
    zoom,
    setSelectedLayerId,
  });

  // --- Canvas Rendering Logic ---
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !imageNaturalDimensions) return;

    canvas.width = imageNaturalDimensions.width;
    canvas.height = imageNaturalDimensions.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { gradientType, gradientColors, stops, gradientAngle, gradientFeather, gradientInverted, gradientCenterX, gradientCenterY, gradientRadius, startPoint, endPoint } = gradientLayer;

    ctx.save();
    ctx.globalAlpha = (gradientLayer.opacity ?? 100) / 100;
    ctx.globalCompositeOperation = gradientLayer.blendMode as GlobalCompositeOperation || 'source-over';

    let colors = [...gradientColors];
    let stopValues = [...stops];

    if (gradientInverted) {
      colors = colors.reverse();
      stopValues = stopValues.map(s => 1 - s).reverse();
    }

    // Convert percentage points (0-100) to pixel coordinates
    const toPx = (p: Point) => ({
      x: (p.x / 100) * imageNaturalDimensions.width,
      y: (p.y / 100) * imageNaturalDimensions.height,
    });

    if (gradientType === "linear" && startPoint && endPoint) {
      const startPx = toPx(startPoint);
      const endPx = toPx(endPoint);
      
      const gradient = ctx.createLinearGradient(startPx.x, startPx.y, endPx.x, endPx.y);
      colors.forEach((color, i) => {
        gradient.addColorStop(stopValues[i] ?? (i / (colors.length - 1)), color);
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (gradientType === "radial") {
      const centerX_px = (gradientCenterX / 100) * imageNaturalDimensions.width;
      const centerY_px = (gradientCenterY / 100) * imageNaturalDimensions.height;
      const radius_px = (gradientRadius / 100) * Math.max(imageNaturalDimensions.width, imageNaturalDimensions.height) / 2;

      const gradient = ctx.createRadialGradient(centerX_px, centerY_px, 0, centerX_px, centerY_px, radius_px);
      colors.forEach((color, i) => {
        gradient.addColorStop(stopValues[i] ?? (i / (colors.length - 1)), color);
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Apply feathering (blur) to the gradient canvas
    if (gradientFeather > 0) {
      ctx.filter = `blur(${gradientFeather * 0.5}px)`;
      ctx.drawImage(canvas, 0, 0);
    }

    ctx.restore();
  }, [gradientLayer, imageNaturalDimensions]);

  if (!layer.visible || layer.type !== "gradient" || !imageNaturalDimensions) return null;

  const currentWidthPercent = gradientLayer.width ?? 100;
  const currentHeightPercent = gradientLayer.height ?? 100;

  const isMovable = activeTool === 'move' || (isSelected && !['lasso', 'brush', 'eraser', 'text', 'shape', 'eyedropper'].includes(activeTool || ''));

  const style: React.CSSProperties = {
    left: `${gradientLayer.x ?? 50}%`,
    top: `${gradientLayer.y ?? 50}%`,
    width: `${currentWidthPercent}%`,
    height: `${currentHeightPercent}%`,
    transform: `translate(-50%, -50%) rotateZ(${gradientLayer.rotation || 0}deg) scaleX(${gradientLayer.scaleX ?? 1}) scaleY(${gradientLayer.scaleY ?? 1})`,
    opacity: (gradientLayer.opacity ?? 100) / 100,
    mixBlendMode: gradientLayer.blendMode as any || 'normal',
    cursor: isMovable ? "grab" : "default",
  };

  return (
    <div
      ref={layerRef}
      onMouseDown={handleDragMouseDown}
      className="absolute"
      style={style}
    >
      <div
        className={cn(
          "relative w-full h-full",
          isSelected && "outline outline-2 outline-primary outline-dashed"
        )}
      >
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />

        {isSelected && (
          <>
            <ResizeHandle position="top-left" onMouseDown={handleResizeMouseDown} />
            <ResizeHandle position="top-right" onMouseDown={handleResizeMouseDown} />
            <ResizeHandle position="bottom-left" onMouseDown={handleResizeMouseDown} />
            <ResizeHandle position="bottom-right" onMouseDown={handleResizeMouseDown} />
            <div
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-4 h-8 cursor-[grab] flex items-end justify-center"
              onMouseDown={handleRotateMouseDown}
            >
              <RotateCw className="w-4 h-4 text-primary bg-background rounded-full p-0.5" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};