"use client";

import * as React from "react";
import type { Layer, ActiveTool } from "@/types/editor";
import { ResizeHandle } from "./ResizeHandle";
import { cn } from "@/lib/utils";
import { RotateCw } from "lucide-react";
import { useLayerTransform } from "@/hooks/useLayerTransform";

interface DrawingLayerProps {
  layer: Layer;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
  isSelected: boolean;
  activeTool: ActiveTool | null;
  zoom: number;
}

export const DrawingLayer = ({ layer, containerRef, onUpdate, onCommit, isSelected, activeTool, zoom }: DrawingLayerProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [contentDimensions, setContentDimensions] = React.useState<{ width: number; height: number } | null>(null);

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
    type: "drawing", // Use 'drawing' type
    activeTool,
    isSelected,
    zoom,
  });

  // --- Canvas Rendering Logic ---
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !layer.dataUrl) return;

    const loadImage = async (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    const renderLayer = async () => {
      try {
        const contentImage = await loadImage(layer.dataUrl!);
        
        // Set canvas dimensions to the natural size of the content image
        canvas.width = contentImage.naturalWidth;
        canvas.height = contentImage.naturalHeight;
        
        setContentDimensions({ width: contentImage.naturalWidth, height: contentImage.naturalHeight });
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the content image directly onto the canvas
        ctx.globalCompositeOperation = 'source-over'; 
        ctx.globalAlpha = 1.0; 

        ctx.drawImage(contentImage, 0, 0);

      } catch (error) {
        console.error("Failed to render drawing layer:", error);
        setContentDimensions(null);
      }
    };

    renderLayer();
  }, [layer.dataUrl]);

  if (!layer.visible || layer.type !== "drawing" || !layer.dataUrl || !contentDimensions) {
    return null;
  }

  const currentWidthPercent = layer.width ?? 100;
  const currentHeightPercent = layer.height ?? 100;

  const isMovable = activeTool === 'move' || (isSelected && !['lasso', 'brush', 'eraser', 'text', 'shape', 'eyedropper'].includes(activeTool || ''));

  const style: React.CSSProperties = {
    left: `${layer.x ?? 50}%`,
    top: `${layer.y ?? 50}%`,
    width: `${currentWidthPercent}%`,
    height: `${currentHeightPercent}%`,
    transform: `translate(-50%, -50%) rotateZ(${layer.rotation || 0}deg) scaleX(${layer.scaleX ?? 1}) scaleY(${layer.scaleY ?? 1})`, // ADDED scaleX/scaleY
    opacity: (layer.opacity ?? 100) / 100,
    mixBlendMode: layer.blendMode as any || 'normal',
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
          // The canvas element itself is sized to contentDimensions pixels, 
          // but the CSS ensures it stretches to the parent div's percentage size.
          style={{
            width: '100%',
            height: '100%',
          }}
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