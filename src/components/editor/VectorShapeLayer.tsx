"use client";

import * as React from "react";
import type { Layer, ActiveTool } from "@/hooks/useEditorState";
import { ResizeHandle } from "./ResizeHandle";
import { cn } from "@/lib/utils";
import { RotateCw } from "lucide-react";
import { useLayerTransform } from "@/hooks/useLayerTransform";

interface VectorShapeLayerProps {
  layer: Layer;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
  isSelected: boolean;
  activeTool: ActiveTool | null;
}

const VectorShapeLayer = ({ layer, containerRef, onUpdate, onCommit, isSelected, activeTool }: VectorShapeLayerProps) => {
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
    type: "vector-shape",
    activeTool,
    isSelected,
  });

  if (!layer.visible || layer.type !== "vector-shape") return null;

  const { x, y, width, height, rotation, fillColor, strokeColor, strokeWidth, borderRadius, shapeType, points } = layer;

  const defaultWidth = 10; // Default percentage width
  const defaultHeight = 10; // Default percentage height

  const currentWidth = width ?? defaultWidth;
  const currentHeight = height ?? defaultHeight;

  const isMovable = activeTool === 'move' || (isSelected && !['lasso', 'brush', 'eraser', 'text', 'shape', 'eyedropper'].includes(activeTool || ''));

  const style: React.CSSProperties = {
    left: `${x ?? 50}%`,
    top: `${y ?? 50}%`,
    width: `${currentWidth}%`,
    height: `${currentHeight}%`,
    transform: `translate(-50%, -50%) rotateZ(${rotation || 0}deg)`,
    opacity: (layer.opacity ?? 100) / 100,
    mixBlendMode: layer.blendMode as any || 'normal',
    cursor: isMovable ? "grab" : "default",
  };

  const svgProps = {
    width: "100%",
    height: "100%",
    fill: fillColor || "none",
    stroke: strokeColor || "none",
    strokeWidth: strokeWidth || 0,
  };

  const renderShape = () => {
    switch (shapeType) {
      case "rect":
        return <rect x="0" y="0" width="100%" height="100%" rx={`${borderRadius || 0}%`} ry={`${borderRadius || 0}%`} />;
      case "circle":
        return <circle cx="50%" cy="50%" r="50%" />;
      case "triangle":
        const trianglePoints = points || [{x: 0, y: 100}, {x: 50, y: 0}, {x: 100, y: 100}];
        const svgPoints = trianglePoints.map(p => `${p.x}% ${p.y}%`).join(" ");
        return <polygon points={svgPoints} />;
      default:
        return null;
    }
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
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" {...svgProps}>
          {renderShape()}
        </svg>

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

export default VectorShapeLayer;