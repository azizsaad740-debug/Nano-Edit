"use client";

import * as React from "react";
import type { Layer } from "@/hooks/useEditorState";
import { ResizeHandle } from "./ResizeHandle";
import { cn } from "@/lib/utils";
import { RotateCw } from "lucide-react";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils";

interface SmartObjectLayerProps {
  layer: Layer;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
  isSelected: boolean;
  parentDimensions: { width: number; height: number } | null;
}

export const SmartObjectLayer = ({
  layer,
  containerRef,
  onUpdate,
  onCommit,
  isSelected,
  parentDimensions,
}: SmartObjectLayerProps) => {
  const smartObjectRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [isRotating, setIsRotating] = React.useState(false);
  const [renderedDataUrl, setRenderedDataUrl] = React.useState<string | null>(null);

  const dragStartPos = React.useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const resizeStartInfo = React.useRef({
    x: 0,
    y: 0,
    initialWidth: 0,
    initialHeight: 0,
    handle: "",
  });
  const rotateStartInfo = React.useRef({ angle: 0, rotation: 0 });

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

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelected) return;
    e.stopPropagation();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: layer.x ?? 50, // Use default 50 if undefined
      initialY: layer.y ?? 50, // Use default 50 if undefined
    };
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    const dxPercent = (dx / containerRect.width) * 100;
    const dyPercent = (dy / containerRect.height) * 100;

    onUpdate(layer.id, {
      x: dragStartPos.current.initialX + dxPercent,
      y: dragStartPos.current.initialY + dyPercent,
    });
  }, [isDragging, containerRef, layer.id, onUpdate, layer.x, layer.y]); // Added layer.x, layer.y to dependencies

  const handleMouseUp = React.useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onCommit(layer.id);
    }
  }, [isDragging, layer.id, onCommit]);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Resizing logic
  const handleResizeMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    handle: string
  ) => {
    e.stopPropagation();
    setIsResizing(true);
    
    // Calculate current percentage width/height for initial state
    const defaultWidthPx = layer.smartObjectData?.width || 1000;
    const defaultHeightPx = layer.smartObjectData?.height || 1000;
    const currentWidthPercent = layer.width ?? (parentDimensions ? (defaultWidthPx / parentDimensions.width) * 100 : 0);
    const currentHeightPercent = layer.height ?? (parentDimensions ? (defaultHeightPx / parentDimensions.height) * 100 : 0);

    resizeStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      initialWidth: currentWidthPercent,
      initialHeight: currentHeightPercent,
      handle,
    };
  };

  const handleResizeMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current || !parentDimensions) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - resizeStartInfo.current.x;
    const dy = e.clientY - resizeStartInfo.current.y;

    const dxPercent = (dx / containerRect.width) * 100;
    const dyPercent = (dy / containerRect.height) * 100;

    let newWidth = resizeStartInfo.current.initialWidth;
    let newHeight = resizeStartInfo.current.initialHeight;
    let newX = layer.x ?? 50;
    let newY = layer.y ?? 50;

    const currentAspect = (layer.smartObjectData?.width || 1) / (layer.smartObjectData?.height || 1);

    switch (resizeStartInfo.current.handle) {
      case "top-left":
        newWidth = resizeStartInfo.current.initialWidth - dxPercent;
        newHeight = newWidth / currentAspect;
        newX = (layer.x ?? 50) + dxPercent;
        newY = (layer.y ?? 50) + (resizeStartInfo.current.initialHeight - newHeight);
        break;
      case "top-right":
        newWidth = resizeStartInfo.current.initialWidth + dxPercent;
        newHeight = newWidth / currentAspect;
        newY = (layer.y ?? 50) + (resizeStartInfo.current.initialHeight - newHeight);
        break;
      case "bottom-left":
        newWidth = resizeStartInfo.current.initialWidth - dxPercent;
        newHeight = newWidth / currentAspect;
        newX = (layer.x ?? 50) + dxPercent;
        break;
      case "bottom-right":
        newWidth = resizeStartInfo.current.initialWidth + dxPercent;
        newHeight = newWidth / currentAspect;
        break;
    }

    newWidth = Math.max(0.1, newWidth); // Minimum width 0.1%
    newHeight = Math.max(0.1, newHeight); // Minimum height 0.1%

    onUpdate(layer.id, {
      width: newWidth,
      height: newHeight,
      x: newX,
      y: newY,
    });
  }, [isResizing, containerRef, layer.id, layer.x, layer.y, layer.smartObjectData, onUpdate, parentDimensions]);

  const handleResizeMouseUp = React.useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      onCommit(layer.id);
    }
  }, [isResizing, layer.id, onCommit]);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMouseMove);
      document.addEventListener("mouseup", handleResizeMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleResizeMouseMove);
      document.removeEventListener("mouseup", handleResizeMouseUp);
    };
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

  // Rotation logic
  const handleRotateMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!smartObjectRef.current) return;
    setIsRotating(true);
    const rect = smartObjectRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    rotateStartInfo.current = { angle: startAngle, rotation: layer.rotation || 0 };
  };

  const handleRotateMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isRotating || !smartObjectRef.current) return;
    const rect = smartObjectRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    const newRotation = rotateStartInfo.current.rotation + (currentAngle - rotateStartInfo.current.angle);
    onUpdate(layer.id, { rotation: newRotation });
  }, [isRotating, layer.id, onUpdate]);

  const handleRotateMouseUp = React.useCallback(() => {
    if (isRotating) {
      setIsRotating(false);
      onCommit(layer.id);
    }
  }, [isRotating, layer.id, onCommit]);

  React.useEffect(() => {
    if (isRotating) {
      document.addEventListener("mousemove", handleRotateMouseMove);
      document.addEventListener("mouseup", handleRotateMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isRotating, handleRotateMouseMove, handleRotateMouseUp]);

  if (!layer.visible || layer.type !== "smart-object" || !renderedDataUrl || !parentDimensions) return null;

  // Calculate current width/height in percentages relative to parentDimensions
  const defaultWidthPx = layer.smartObjectData?.width || 1000;
  const defaultHeightPx = layer.smartObjectData?.height || 1000;

  const currentWidthPercent = layer.width ?? (parentDimensions ? (defaultWidthPx / parentDimensions.width) * 100 : 0);
  const currentHeightPercent = layer.height ?? (parentDimensions ? (defaultHeightPx / parentDimensions.height) * 100 : 0);

  const style: React.CSSProperties = {
    left: `${layer.x ?? 50}%`,
    top: `${layer.y ?? 50}%`,
    width: `${currentWidthPercent}%`,
    height: `${currentHeightPercent}%`,
    transform: `translate(-50%, -50%) rotateZ(${layer.rotation || 0}deg)`,
    opacity: (layer.opacity ?? 100) / 100,
    mixBlendMode: layer.blendMode as any || 'normal',
    cursor: isSelected ? "move" : "default",
  };

  return (
    <div
      ref={smartObjectRef}
      onMouseDown={handleMouseDown}
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