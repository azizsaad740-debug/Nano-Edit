"use client";

import type { Layer, ActiveTool, Point } from "@/types/editor";
import * as React from "react";

interface UseLayerTransformProps {
  layer: Layer;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
  type: "text" | "smart-object" | "vector-shape" | "group" | "gradient"; // Added 'gradient' type
  smartObjectData?: { width: number; height: number };
  parentDimensions?: { width: number; height: number } | null;
  activeTool: ActiveTool | null;
  isSelected: boolean;
  zoom: number; // NEW
}

export const useLayerTransform = ({
  layer,
  containerRef,
  onUpdate,
  onCommit,
  type,
  smartObjectData,
  parentDimensions,
  activeTool,
  isSelected,
  zoom, // NEW
}: UseLayerTransformProps) => {
  const layerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [isRotating, setIsRotating] = React.useState(false);
  const [isDraggingPoint, setIsDraggingPoint] = React.useState<number | null>(null); // Index of the point being dragged

  const dragStartPos = React.useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const resizeStartInfo = React.useRef({
    x: 0,
    y: 0,
    initialWidth: 0,
    initialHeight: 0,
    initialX: 0,
    initialY: 0,
    handle: "",
  });
  const rotateStartInfo = React.useRef({ angle: 0, rotation: 0 });
  const pointDragStartInfo = React.useRef<{ x: number; y: number; initialPoints: Layer['points'] }>({ x: 0, y: 0, initialPoints: [] });


  // --- Dragging Logic (Layer) ---
  const handleDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Always stop propagation for clicks on layers
    // Only allow dragging if 'move' tool is active OR 'gradient' tool is active OR the layer is already selected
    if (activeTool === 'move' || activeTool === 'gradient' || isSelected) {
      setIsDragging(true);
      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        initialX: layer.x ?? 0,
        initialY: layer.y ?? 0,
      };
    }
  };

  const handleDragMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    // FIX: Divide screen delta by zoom factor to get movement relative to the unscaled container.
    const dxPercent = (dx / zoom / containerRect.width) * 100;
    const dyPercent = (dy / zoom / containerRect.height) * 100;

    onUpdate(layer.id, {
      x: dragStartPos.current.initialX + dxPercent,
      y: dragStartPos.current.initialY + dyPercent,
    });
  }, [isDragging, containerRef, layer.id, onUpdate, zoom]);

  const handleDragMouseUp = React.useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onCommit(layer.id);
    }
  }, [isDragging, layer.id, onCommit]);

  // --- Dragging Logic (Point) ---
  const handlePointDragMouseDown = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    e.stopPropagation();
    if (type !== 'vector-shape' || !layer.points) return;

    setIsDraggingPoint(index);
    pointDragStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      initialPoints: layer.points,
    };
  };

  const handlePointDragMouseMove = React.useCallback((e: MouseEvent) => {
    if (isDraggingPoint === null || !layerRef.current || type !== 'vector-shape' || !layer.points) return;

    const layerRect = layerRef.current.getBoundingClientRect();
    const dx = e.clientX - pointDragStartInfo.current.x;
    const dy = e.clientY - pointDragStartInfo.current.y;

    // FIX: Divide screen delta by zoom factor to get movement relative to the unscaled layer.
    const dxPercent = (dx / zoom / layerRect.width) * 100;
    const dyPercent = (dy / zoom / layerRect.height) * 100;

    const newPoints = pointDragStartInfo.current.initialPoints.map((p, i) => {
      if (i === isDraggingPoint) {
        // Clamp point coordinates to 0-100% relative to the layer's bounding box
        let newX = p.x + dxPercent;
        let newY = p.y + dyPercent;
        
        newX = Math.max(0, Math.min(100, newX));
        newY = Math.max(0, Math.min(100, newY));

        return { x: newX, y: newY };
      }
      return p;
    });

    onUpdate(layer.id, { points: newPoints });
  }, [isDraggingPoint, layer.id, layer.points, onUpdate, type, zoom]);

  const handlePointDragMouseUp = React.useCallback(() => {
    if (isDraggingPoint !== null) {
      setIsDraggingPoint(null);
      onCommit(layer.id);
    }
  }, [isDraggingPoint, layer.id, onCommit]);


  // --- Resizing Logic ---
  const handleResizeMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    handle: string
  ) => {
    e.stopPropagation();
    setIsResizing(true);

    let initialWidthPercent = layer.width ?? 0;
    let initialHeightPercent = layer.height ?? 0;

    if (type === "smart-object" && parentDimensions && smartObjectData) {
      initialWidthPercent = layer.width ?? (smartObjectData.width / parentDimensions.width) * 100;
      initialHeightPercent = layer.height ?? (smartObjectData.height / parentDimensions.height) * 100;
    } else if (type === "text") {
      // For text, resizing changes fontSize, not width/height directly
      // We'll use fontSize as the "initialHeight" for calculation purposes
      initialHeightPercent = layer.fontSize ?? 48; // Use fontSize directly
    } else if (type === "vector-shape" || type === "group" || type === "gradient") { // Added 'group' and 'gradient' type
      initialWidthPercent = layer.width ?? 10;
      initialHeightPercent = layer.height ?? 10;
    }

    resizeStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      initialWidth: initialWidthPercent,
      initialHeight: initialHeightPercent,
      initialX: layer.x ?? 0,
      initialY: layer.y ?? 0,
      handle,
    };
  };

  const handleResizeMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current || !layerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - resizeStartInfo.current.x;
    const dy = e.clientY - resizeStartInfo.current.y;

    // FIX: Divide screen delta by zoom factor
    const dxCorrected = dx / zoom;
    const dyCorrected = dy / zoom;

    const dxPercent = (dxCorrected / containerRect.width) * 100;
    const dyPercent = (dyCorrected / containerRect.height) * 100;

    let newWidth = resizeStartInfo.current.initialWidth;
    let newHeight = resizeStartInfo.current.initialHeight;
    let newX = resizeStartInfo.current.initialX;
    let newY = resizeStartInfo.current.initialY;

    if (type === "text") {
      // For text, resize changes font size
      let change = 0;
      switch (resizeStartInfo.current.handle) {
        case "top-left": change = -(dxCorrected + dyCorrected); break;
        case "top-right": change = dxCorrected - dyCorrected; break;
        case "bottom-left": change = -dxCorrected + dyCorrected; break;
        case "bottom-right": change = dxCorrected + dyCorrected; break;
      }
      const newFontSize = Math.max(8, Math.round(resizeStartInfo.current.initialHeight + (change * 0.5)));
      onUpdate(layer.id, { fontSize: newFontSize });
    } else if (type === "smart-object" || type === "vector-shape" || type === "group" || type === "gradient") {
      // For smart objects, vector shapes, groups, and gradients, resize changes width/height directly, maintaining aspect ratio.
      
      let currentAspect = resizeStartInfo.current.initialWidth / resizeStartInfo.current.initialHeight;
      
      // If it's a smart object, use its internal dimensions for aspect ratio if available
      if (type === "smart-object" && smartObjectData) {
        currentAspect = (smartObjectData.width || 1) / (smartObjectData.height || 1);
      }

      let initialWidth = resizeStartInfo.current.initialWidth;
      let initialHeight = resizeStartInfo.current.initialHeight;

      switch (resizeStartInfo.current.handle) {
        case "top-left": {
          newWidth = initialWidth - dxPercent;
          newHeight = newWidth / currentAspect;
          
          const dW = newWidth - initialWidth;
          const dH = newHeight - initialHeight;
          
          newX = resizeStartInfo.current.initialX - dW / 2;
          newY = resizeStartInfo.current.initialY - dH / 2;
          break;
        }
        case "top-right": {
          newWidth = initialWidth + dxPercent;
          newHeight = newWidth / currentAspect;
          
          const dW = newWidth - initialWidth;
          const dH = newHeight - initialHeight;
          
          newX = resizeStartInfo.current.initialX + dW / 2;
          newY = resizeStartInfo.current.initialY - dH / 2;
          break;
        }
        case "bottom-left": {
          newWidth = initialWidth - dxPercent;
          newHeight = newWidth / currentAspect;
          
          const dW = newWidth - initialWidth;
          const dH = newHeight - initialHeight;
          
          newX = resizeStartInfo.current.initialX - dW / 2;
          newY = resizeStartInfo.current.initialY + dH / 2;
          break;
        }
        case "bottom-right": {
          newWidth = initialWidth + dxPercent;
          newHeight = newWidth / currentAspect;
          
          const dW = newWidth - initialWidth;
          const dH = newHeight - initialHeight;
          
          newX = resizeStartInfo.current.initialX + dW / 2;
          newY = resizeStartInfo.current.initialY + dH / 2;
          break;
        }
      }

      newWidth = Math.max(0.1, newWidth);
      newHeight = Math.max(0.1, newHeight);

      onUpdate(layer.id, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY,
      });
    }
  }, [isResizing, containerRef, layer.id, onUpdate, type, smartObjectData, zoom]);

  const handleResizeMouseUp = React.useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      onCommit(layer.id);
    }
  }, [isResizing, layer.id, onCommit]);

  // --- Rotation Logic ---
  const handleRotateMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!layerRef.current) return;
    setIsRotating(true);
    const rect = layerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    rotateStartInfo.current = { angle: startAngle, rotation: layer.rotation || 0 };
  };

  const handleRotateMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isRotating || !layerRef.current) return;
    const rect = layerRef.current.getBoundingClientRect();
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

  // --- Event Listeners ---
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) handleDragMouseMove(e);
      if (isResizing) handleResizeMouseMove(e);
      if (isRotating) handleRotateMouseMove(e);
      if (isDraggingPoint !== null) handlePointDragMouseMove(e);
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) handleDragMouseUp();
      if (isResizing) handleResizeMouseUp();
      if (isRotating) handleRotateMouseUp();
      if (isDraggingPoint !== null) handlePointDragMouseUp();
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [
    isDragging, handleDragMouseMove, handleDragMouseUp,
    isResizing, handleResizeMouseMove, handleResizeMouseUp,
    isRotating, handleRotateMouseMove, handleRotateMouseUp,
    isDraggingPoint, handlePointDragMouseMove, handlePointDragMouseUp,
  ]);

  return {
    layerRef,
    handleDragMouseDown,
    handleResizeMouseDown,
    handleRotateMouseDown,
    handlePointDragMouseDown, // Expose point drag handler
    isDragging,
    isResizing,
    isRotating,
    isDraggingPoint,
  };
};