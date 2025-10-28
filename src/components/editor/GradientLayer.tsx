"use client";

import * as React from "react";
import type { Layer, ActiveTool } from "@/types/editor";
import { ResizeHandle } from "./ResizeHandle";
import { cn } from "@/lib/utils";
import { RotateCw } from "lucide-react";
import { useLayerTransform } from "@/hooks/useLayerTransform";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils";

interface GradientLayerProps {
  layer: Layer;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
  isSelected: boolean;
  imageNaturalDimensions: { width: number; height: number } | null;
  activeTool: ActiveTool | null;
  zoom: number; // NEW
}

export const GradientLayer = ({
  layer,
  containerRef,
  onUpdate,
  onCommit,
  isSelected,
  imageNaturalDimensions,
  activeTool,
  zoom, // NEW
}: GradientLayerProps) => {
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
    type: "gradient",
    parentDimensions: imageNaturalDimensions,
    activeTool,
    isSelected,
    zoom, // PASS ZOOM
  });

  // Render the gradient's content to a canvas
  React.useEffect(() => {
    const renderGradient = async () => {
      if (!imageNaturalDimensions) {
        setRenderedDataUrl(null);
        return;
      }

      const canvas = await rasterizeLayerToCanvas(layer, imageNaturalDimensions);
      if (canvas) {
        setRenderedDataUrl(canvas.toDataURL());
      } else {
        setRenderedDataUrl(null);
      }
    };

    renderGradient();
  }, [layer, imageNaturalDimensions]); // Re-render if layer properties or image dimensions change

  if (!layer.visible || layer.type !== "gradient" || !renderedDataUrl || !imageNaturalDimensions) return null;

  const currentWidthPercent = layer.width ?? 100;
  const currentHeightPercent = layer.height ?? 100;

  const isMovable = activeTool === 'move' || (isSelected && !['lasso', 'brush', 'eraser', 'text', 'shape', 'eyedropper', 'gradient'].includes(activeTool || ''));

  const style: React.CSSProperties = {
    left: `${layer.x ?? 50}%`,
    top: `${layer.y ?? 50}%`,
    width: `${currentWidthPercent}%`,
    height: `${currentHeightPercent}%`,
    transform: `translate(-50%, -50%) rotateZ(${layer.rotation || 0}deg)`,
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
          className="w-full h-full object-fill" // Use object-fill to ensure gradient covers the area
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

export default GradientLayer;