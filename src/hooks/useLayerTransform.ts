"use client";

import type { Layer, ActiveTool } from "./useEditorState";
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
}: UseLayerTransformProps) => {
  const layerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [isRotating, setIsRotating] = React.useState(false);

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

  // --- Dragging Logic ---
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

    const dxPercent = (dx / containerRect.width) * 100;
    const dyPercent = (dy / containerRect.height) * 100;

    onUpdate(layer.id, {
      x: dragStartPos.current.initialX + dxPercent,
      y: dragStartPos.current.initialY + dyPercent,
    });
  }, [isDragging, containerRef, layer.id, onUpdate]);

  const handleDragMouseUp = React.useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onCommit(layer.id);
    }
  }, [isDragging, layer.id, onCommit]);

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

    const dxPercent = (dx / containerRect.width) * 100;
    const dyPercent = (dy / containerRect.height) * 100;

    let newWidth = resizeStartInfo.current.initialWidth;
    let newHeight = resizeStartInfo.current.initialHeight;
    let newX = resizeStartInfo.current.initialX;
    let newY = resizeStartInfo.current.initialY;

    if (type === "text") {
      // For text, resize changes font size
      let change = 0;
      switch (resizeStartInfo.current.handle) {
        case "top-left": change = -(dx + dy); break;
        case "top-right": change = dx - dy; break;
        case "bottom-left": change = -dx + dy; break;
        case "bottom-right": change = dx + dy; break;
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
  }, [isResizing, containerRef, layer.id, onUpdate, type, smartObjectData]);

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
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) handleDragMouseUp();
      if (isResizing) handleResizeMouseUp();
      if (isRotating) handleRotateMouseUp();
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
  ]);

  return {
    layerRef,
    handleDragMouseDown,
    handleResizeMouseDown,
    handleRotateMouseDown,
    isDragging,
    isResizing,
    isRotating,
  };
};