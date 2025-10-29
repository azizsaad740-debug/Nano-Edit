"use client";

import * as React from "react";
import type { Layer, ActiveTool } from "@/types/editor";
import { ResizeHandle } from "./ResizeHandle";
import { cn } from "@/lib/utils";
import { RotateCw } from "lucide-react";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils";
import { useLayerTransform } from "@/hooks/useLayerTransform";

interface SmartObjectLayerProps {
  layer: Layer;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
  isSelected: boolean;
  parentDimensions: { width: number; height: number } | null;
  activeTool: ActiveTool | null;
  zoom: number; // NEW
}

export const SmartObjectLayer = ({
  layer,
  containerRef,
  onUpdate,
  onCommit,
  isSelected,
  parentDimensions,
  activeTool,
  zoom, // NEW
}: SmartObjectLayerProps) => {
  const [renderedDataUrl, setRenderedDataUrl] = React.useState<string | null>(null);

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
    type: "smart-object",
    smartObjectData: layer.smartObjectData,
    parentDimensions,
    activeTool,
    isSelected,
    zoom, // PASS ZOOM
  });

  // Render the smart object's content to a canvas
  React.useEffect(() => {
    const renderSmartObject = async () => {
      if (!layer.smartObjectData || !parentDimensions) {
        setRenderedDataUrl(null);
        return;
      }

      const canvas = await rasterizeLayerToCanvas(layer, parentDimensions);
      if (canvas) {
        setRenderedDataUrl(canvas.toDataURL());
      } else {
        setRenderedDataUrl(null);
      }
    };

    renderSmartObject();
  }, [layer.smartObjectData, parentDimensions, layer.opacity, layer.blendMode]);

  if (!layer.visible || layer.type !== "smart-object" || !renderedDataUrl || !parentDimensions) return null;

  // Calculate current width/height in percentages relative to parentDimensions
  const defaultWidthPx = layer.smartObjectData?.width || 1000;
  const defaultHeightPx = layer.smartObjectData?.height || 1000;

  const currentWidthPercent = layer.width ?? (parentDimensions ? (defaultWidthPx / parentDimensions.width) * 100 : 0);
  const currentHeightPercent = layer.height ?? (parentDimensions ? (defaultHeightPx / parentDimensions.height) * 100 : 0);

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
        <img
          src={renderedDataUrl}
          alt={layer.name}
          className="w-full h-full object-contain"
          style={{ pointerEvents: 'none' }}
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