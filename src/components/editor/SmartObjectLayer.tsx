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
  parentDimensions: { width: number; height: number } | null; // Changed from imageNaturalDimensions
}

export const SmartObjectLayer = ({
  layer,
  containerRef,
  onUpdate,
  onCommit,
  isSelected,
  parentDimensions, // Use parentDimensions
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
      if (!layer.smartObjectData || !parentDimensions) { // Use parentDimensions here
        setRenderedDataUrl(null);
        return;
      }

      const canvas = await rasterizeLayerToCanvas(layer, parentDimensions); // Use parentDimensions here
      if (canvas) {
        setRenderedDataUrl(canvas.toDataURL());
      } else {
        setRenderedDataUrl(null);
      }
    };

    renderSmartObject();
  }, [layer.smartObjectData, parentDimensions, layer.opacity, layer.blendMode]); // Re-render if smart object data or parent dimensions change

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelected) return;
    e.stopPropagation();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: layer.x ?? 0,
      initialY: layer.y ?? 0,
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
  }, [isDragging, containerRef, layer.id, onUpdate]);

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
    resizeStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      initialWidth: layer.width ?? 0,
      initialHeight: layer.height ?? 0,
      handle,
    };
  };

  const handleResizeMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current || !smartObjectRef.current || !parentDimensions) return; // Check parentDimensions

    const containerRect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - resizeStartInfo.current.x;
    const dy = e.clientY - resizeStartInfo.current.y;

    const dxPercent = (dx / containerRect.width) * 100;
    const dyPercent = (dy / containerRect.height) * 100;

    let newWidth = resizeStartInfo.current.initialWidth;
    let newHeight = resizeStartInfo.current.initialHeight;
    let newX = layer.x ?? 0;
    let newY = layer.y ?? 0;

    const currentAspect = (layer.smartObjectData?.width || 1) / (layer.smartObjectData?.height || 1);

    switch (resizeStartInfo.current.handle) {
      case "top-left":
        newWidth = resizeStartInfo.current.initialWidth - dxPercent;
        newHeight = newWidth / currentAspect;
        newX = (layer.x ?? 0) + dxPercent;
        newY = (layer.y ?? 0) + (resizeStartInfo.current.initialHeight - newHeight);
        break;
      case "top-right":
        newWidth = resizeStartInfo.current.initialWidth + dxPercent;
        newHeight = newWidth / currentAspect;
        newY = (layer.y ?? 0) + (resizeStartInfo.current.initialHeight - newHeight);
        break;
      case "bottom-left":
        newWidth = resizeStartInfo.current.initialWidth - dxPercent;
        newHeight = newWidth / currentAspect;
        newX = (layer.x ?? 0) + dxPercent;
        break;
      case "bottom-right":
        newWidth = resizeStartInfo.current.initialWidth + dxPercent;
        newHeight = newWidth / currentAspect;
        break;
    }

    newWidth = Math.max(1, newWidth);
    newHeight = Math.max(1, newHeight);

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
      document.removeEventListener("mousemove", handleRotateMouseMove);
      document.removeEventListener("mouseup", handleRotateMouseUp);
    };
  }, [isRotating, handleRotateMouseMove, handleRotateMouseUp]);

  if (!layer.visible || layer.type !== "smart-object" || !renderedDataUrl || !parentDimensions) return null;

  // Calculate default width/height relative to parentDimensions
  const defaultWidth = (layer.smartObjectData?.width || 1000) / parentDimensions.width * 100;
  const defaultHeight = (layer.smartObjectData?.height || 1000) / parentDimensions.height * 100;

  const style: React.CSSProperties = {
    left: `${layer.x ?? 0}%`,
    top: `${layer.y ?? 0}%`,
    width: `${layer.width ?? defaultWidth}%`,
    height: `${layer.height ?? defaultHeight}%`,
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