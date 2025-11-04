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
  const smartObjectLayer = layer as SmartObjectLayerData;
  const imgRef = React.useRef<HTMLImageElement>(null);

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
        {/* Use img tag to display the rasterized dataUrl */}
        {smartObjectLayer.dataUrl ? (
          <img
            ref={imgRef}
            src={smartObjectLayer.dataUrl}
            alt={smartObjectLayer.name}
            className="w-full h-full object-contain pointer-events-none"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50 text-muted-foreground text-sm">
            Empty Smart Object
          </div>
        )}

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