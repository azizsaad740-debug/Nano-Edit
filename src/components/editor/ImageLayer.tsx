"use client";

import * as React from "react";
import type { Layer, ActiveTool, ImageLayerData } from "@/types/editor";
import { ResizeHandle } from "./ResizeHandle";
import { cn } from "@/lib/utils";
import { RotateCw } from "lucide-react";
import { useLayerTransform } from "@/hooks/useLayerTransform";

interface ImageLayerProps {
  layer: Layer;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string, historyName: string) => void;
  isSelected: boolean;
  activeTool: ActiveTool | null;
  zoom: number;
  setSelectedLayerId: (id: string | null) => void;
}

export const ImageLayer = ({ layer, containerRef, onUpdate, onCommit, isSelected, activeTool, zoom, setSelectedLayerId }: ImageLayerProps) => {
  const imageLayer = layer as ImageLayerData;
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
    onCommit: (id) => onCommit(id, `Update ${layer.name} Transform`),
    type: "image",
    activeTool,
    isSelected,
    zoom,
    setSelectedLayerId,
  });

  if (!layer.visible || layer.type !== "image" || layer.id === 'background') return null;

  const currentWidthPercent = imageLayer.width ?? 100;
  const currentHeightPercent = imageLayer.height ?? 100;

  const isMovable = activeTool === 'move' || (isSelected && !['lasso', 'brush', 'eraser', 'text', 'shape', 'eyedropper'].includes(activeTool || ''));

  const style: React.CSSProperties = {
    left: `${imageLayer.x ?? 50}%`,
    top: `${imageLayer.y ?? 50}%`,
    width: `${currentWidthPercent}%`,
    height: `${currentHeightPercent}%`,
    transform: `translate(-50%, -50%) rotateZ(${imageLayer.rotation || 0}deg) scaleX(${imageLayer.scaleX ?? 1}) scaleY(${imageLayer.scaleY ?? 1})`,
    opacity: (imageLayer.opacity ?? 100) / 100,
    mixBlendMode: imageLayer.blendMode as any || 'normal',
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
        <img
          ref={imgRef}
          src={imageLayer.dataUrl}
          alt={imageLayer.name}
          className="w-full h-full object-contain pointer-events-none"
          crossOrigin="anonymous"
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