"use client";

import * as React from "react";
import type { Layer, ActiveTool, Point } from "@/types/editor";
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
    handlePointDragMouseDown, // Destructure new handler
    isDraggingPoint,
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

  const { x, y, width, height, rotation, fillColor, strokeColor, strokeWidth, borderRadius, shapeType, points, starPoints, lineThickness } = layer;

  const defaultWidth = 10; // Default percentage width
  const defaultHeight = 10; // Default percentage height

  const currentWidth = width ?? defaultWidth;
  const currentHeight = height ?? defaultHeight;

  const isMovable = activeTool === 'move' || (isSelected && !['lasso', 'brush', 'eraser', 'text', 'shape', 'eyedropper'].includes(activeTool || ''));
  const isPointEditable = isSelected && (shapeType === 'polygon' || shapeType === 'triangle' || shapeType === 'custom');

  const style: React.CSSProperties = {
    left: `${x ?? 50}%`,
    top: `${y ?? 50}%`,
    width: `${currentWidth}%`,
    height: `${currentHeight}%`,
    transform: `translate(-50%, -50%) rotateZ(${rotation || 0}deg)`,
    opacity: (layer.opacity ?? 100) / 100,
    mixBlendMode: layer.blendMode as any || 'normal',
    cursor: isMovable && !isPointEditable ? "grab" : "default",
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
      case "polygon":
      case "custom":
        const polygonPoints = points || [{x: 0, y: 100}, {x: 50, y: 0}, {x: 100, y: 100}];
        const svgPoints = polygonPoints.map(p => `${p.x}% ${p.y}%`).join(" ");
        return <polygon points={svgPoints} />;
      case "star":
        const numPoints = starPoints || 5;
        const outerRadius = 50;
        const innerRadius = outerRadius / 2.5;
        const starPath: Point[] = [];
        
        for (let i = 0; i < numPoints * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (Math.PI / numPoints) * i;
          const x = 50 + radius * Math.sin(angle);
          const y = 50 - radius * Math.cos(angle);
          starPath.push({ x, y });
        }
        
        const starSvgPoints = starPath.map(p => `${p.x}% ${p.y}%`).join(" ");
        return <polygon points={starSvgPoints} />;
        
      case "line":
        // Line is drawn from (0, 50%) to (100%, 50%) relative to the bounding box
        // We use strokeLinecap="round" to make it look like a thick line
        return (
          <line 
            x1="0%" 
            y1="50%" 
            x2="100%" 
            y2="50%" 
            stroke={strokeColor || "currentColor"} 
            strokeWidth={lineThickness || 5} 
            strokeLinecap="round"
            fill="none"
          />
        );
      case "arrow":
        // Simple arrow path (stub, complex arrows require more points)
        // Draw a line and a simple arrowhead
        const thickness = lineThickness || 5;
        const arrowHeadSize = thickness * 3;
        return (
          <g>
            <line 
              x1="0%" 
              y1="50%" 
              x2="100%" 
              y2="50%" 
              stroke={strokeColor || "currentColor"} 
              strokeWidth={thickness} 
              strokeLinecap="round"
              fill="none"
            />
            <polygon 
              points={`100,50 ${100 - arrowHeadSize},${50 - arrowHeadSize / 2} ${100 - arrowHeadSize},${50 + arrowHeadSize / 2}`}
              fill={strokeColor || "currentColor"}
            />
          </g>
        );
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

        {isSelected && !isPointEditable && (
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

        {isPointEditable && points && (
          <>
            {points.map((point, index) => (
              <div
                key={index}
                className={cn(
                  "absolute w-3 h-3 bg-primary border-2 border-background rounded-full -m-1.5 cursor-move",
                  isDraggingPoint === index && "ring-2 ring-primary/50"
                )}
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                }}
                onMouseDown={(e) => handlePointDragMouseDown(e, index)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default VectorShapeLayer;