"use client";

import * as React from "react";
import type { Layer, ActiveTool, SmartObjectLayerData } from "@/types/editor";
import { ResizeHandle } from "./ResizeHandle";
import { cn } from "@/lib/utils";
import { RotateCw } from "lucide-react";
import { useLayerTransform } from "@/hooks/useLayerTransform";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils";

interface SmartObjectLayerProps {
  layer: Layer;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string, historyName: string) => void; // FIX 12: Added historyName
  isSelected: boolean;
  parentDimensions: { width: number; height: number } | null;
  activeTool: ActiveTool | null;
  zoom: number;
  setSelectedLayerId: (id: string | null) => void;
}

export const SmartObjectLayer = ({ layer, containerRef, onUpdate, onCommit, isSelected, parentDimensions, activeTool, zoom, setSelectedLayerId }: SmartObjectLayerProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const smartObjectLayer = layer as SmartObjectLayerData;

  const {
    layerRef,
    handleDragMouseDown,
    handleResizeMouseDown,
    handleRotateMouseDown,
  } = useLayerTransform({
    layer,
    containerRef,
    onUpdate,
    onCommit: (id) => onCommit(id, `Update ${layer.name} Transform`), // FIX 12: Wrapped commit
    type: "smart-object",
    parentDimensions,
    activeTool,
    isSelected,
    zoom,
    setSelectedLayerId,
  });

  // --- Canvas Rendering Logic (Stub) ---
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !parentDimensions) return;

    // Set canvas dimensions to the smart object's internal dimensions
    const internalWidth = smartObjectLayer.smartObjectData.width || parentDimensions.width;
    const internalHeight = smartObjectLayer.smartObjectData.height || parentDimensions.height;
    
    canvas.width = internalWidth;
    canvas.height = internalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // STUB: Simulate rendering the smart object contents
    ctx.fillStyle = 'rgba(100, 100, 255, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("Smart Object", canvas.width / 2, canvas.height / 2);

  }, [smartObjectLayer, parentDimensions]);

  if (!layer.visible || layer.type !== "smart-object" || !parentDimensions) return null;

  const currentWidthPercent = smartObjectLayer.width ?? 100;
  const currentHeightPercent = smartObjectLayer.height ?? 100;

  const isMovable = activeTool === 'move' || (isSelected && !['lasso', 'brush', 'eraser', 'text', 'shape', 'eyedropper'].includes(activeTool || ''));

  const style: React.CSSProperties = {
    left: `${smartObjectLayer.x ?? 50}%`,
    top: `${smartObjectLayer.y ?? 50}%`,
    width: `${currentWidthPercent}%`,
    height: `${currentHeightPercent}%`,
    transform: `translate(-50%, -50%) rotateZ(${smartObjectLayer.rotation || 0}deg) scaleX(${smartObjectLayer.scaleX ?? 1}) scaleY(${smartObjectLayer.scaleY ?? 1})`,
    opacity: (smartObjectLayer.opacity ?? 100) / 100,
    mixBlendMode: smartObjectLayer.blendMode as any || 'normal',
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