import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { Layer, ActiveTool, Point, VectorShapeLayerData, TextLayerData, Dimensions } from "@/types/editor";
import { isVectorShapeLayer, isTextLayer } from '@/types/editor';

interface DraggingPoint {
  index: number;
  startX: number;
  startY: number;
  initialPoints: Point[];
}

interface UseLayerTransformProps {
  layer: Layer;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
  type: 'image' | 'drawing' | 'text' | 'vector-shape' | 'gradient' | 'smart-object' | 'group';
  parentDimensions?: Dimensions | null;
  activeTool: ActiveTool | null;
  isSelected: boolean;
  zoom: number;
  setSelectedLayerId: (id: string | null) => void;
}

export const useLayerTransform = ({
  layer,
  containerRef,
  onUpdate,
  onCommit,
  type,
  parentDimensions,
  activeTool,
  isSelected,
  zoom,
  setSelectedLayerId,
}: UseLayerTransformProps) => {
  const layerRef = useRef<HTMLDivElement>(null);
  const [isDraggingPoint, setIsDraggingPoint] = useState<DraggingPoint | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const getContainerRect = useCallback(() => {
    return containerRef.current?.getBoundingClientRect() || { width: 0, height: 0, left: 0, top: 0 };
  }, [containerRef]);

  const handlePointDragMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, index: number) => {
    e.stopPropagation();
    if (!isVectorShapeLayer(layer) || !layer.points) return;
    setIsDraggingPoint({
      index,
      startX: e.clientX,
      startY: e.clientY,
      initialPoints: layer.points,
    });
  }, [layer]);

  const handlePointDragMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingPoint === null || !layerRef.current || !isVectorShapeLayer(layer) || !layer.points) return;
    
    const containerRect = getContainerRect();
    const layerRect = layerRef.current.getBoundingClientRect();
    
    // Calculate movement relative to the container
    const deltaX = e.clientX - isDraggingPoint.startX;
    const deltaY = e.clientY - isDraggingPoint.startY;

    // Convert pixel delta to percentage relative to the layer's current size (100x100 viewBox)
    const deltaXPercent = (deltaX / layerRect.width) * 100;
    const deltaYPercent = (deltaY / layerRect.height) * 100;

    const newPoints = isDraggingPoint.initialPoints.map((p, i) => {
      if (i === isDraggingPoint.index) {
        // Update the point position (relative to 0-100%)
        return {
          x: Math.min(100, Math.max(0, p.x + deltaXPercent)),
          y: Math.min(100, Math.max(0, p.y + deltaYPercent)),
        };
      }
      return p;
    });

    onUpdate(layer.id, { points: newPoints });
  }, [isDraggingPoint, layer, onUpdate, getContainerRect]);

  const handlePointDragMouseUp = useCallback(() => {
    if (isDraggingPoint !== null) {
      onCommit(layer.id);
    }
    setIsDraggingPoint(null);
  }, [isDraggingPoint, onCommit, layer.id]);

  React.useEffect(() => {
    document.addEventListener('mousemove', handlePointDragMouseMove);
    document.addEventListener('mouseup', handlePointDragMouseUp);
    return () => {
      document.removeEventListener('mousemove', handlePointDragMouseMove);
      document.removeEventListener('mouseup', handlePointDragMouseUp);
    };
  }, [handlePointDragMouseMove, handlePointDragMouseUp]);


  // --- Dragging Logic (Move Tool) ---
  const handleDragMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (layer.isLocked || isDraggingPoint !== null) return;
    
    const isMovable = activeTool === 'move' || (isSelected && !['lasso', 'brush', 'eraser', 'text', 'shape', 'eyedropper'].includes(activeTool || ''));
    
    if (!isMovable) return;
    
    // If clicking on the layer, select it first if not already selected
    if (!isSelected) {
      setSelectedLayerId(layer.id);
    }

    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = layer.x ?? 50;
    const initialY = layer.y ?? 50;
    const containerRect = getContainerRect();

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      // Convert pixel delta to percentage relative to the container
      const deltaXPercent = (deltaX / containerRect.width) * 100;
      const deltaYPercent = (deltaY / containerRect.height) * 100;

      const newX = initialX + deltaXPercent;
      const newY = initialY + deltaYPercent;

      onUpdate(layer.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onCommit(layer.id);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  }, [layer, activeTool, isSelected, onUpdate, onCommit, getContainerRect, isDragging, isDraggingPoint, setSelectedLayerId]);

  // --- Resizing Logic ---
  const handleResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
    e.stopPropagation();
    if (layer.isLocked) return;

    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = layer.x ?? 50;
    const initialY = layer.y ?? 50;
    const initialWidth = layer.width ?? 10;
    const initialHeight = layer.height ?? 10;
    const initialRotation = layer.rotation ?? 0;
    const containerRect = getContainerRect();

    // Determine initial height/width in pixels for aspect ratio calculation
    let initialHeightPx = 0;
    let initialWidthPx = 0;
    
    if (type === "text") {
      // Text layer resizing usually affects font size, not bounding box directly, but we stub bounding box resize here.
      initialWidthPx = (initialWidth / 100) * containerRect.width;
      initialHeightPx = (initialHeight / 100) * containerRect.height;
    } else if (type === "vector-shape" || type === "group" || type === "gradient" || type === "drawing" || type === "smart-object" || type === "image") {
      initialWidthPx = (initialWidth / 100) * containerRect.width;
      initialHeightPx = (initialHeight / 100) * containerRect.height;
    }

    const initialAspect = initialWidthPx / initialHeightPx;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // Simplified resizing logic (no rotation handling for now)
      let newWidthPx = initialWidthPx;
      let newHeightPx = initialHeightPx;
      let newXPercent = initialX;
      let newYPercent = initialY;

      // Calculate new dimensions based on position
      if (position.includes('right')) {
        newWidthPx += deltaX;
      } else if (position.includes('left')) {
        newWidthPx -= deltaX;
        newXPercent += (deltaX / containerRect.width) * 100 / 2;
      }

      if (position.includes('bottom')) {
        newHeightPx += deltaY;
      } else if (position.includes('top')) {
        newHeightPx -= deltaY;
        newYPercent += (deltaY / containerRect.height) * 100 / 2;
      }
      
      // Apply aspect ratio lock (stubbed for simplicity)
      // if (e.shiftKey) { ... }

      // Convert back to percentage
      const newWidthPercent = (newWidthPx / containerRect.width) * 100;
      const newHeightPercent = (newHeightPx / containerRect.height) * 100;

      onUpdate(layer.id, { 
        width: Math.max(1, newWidthPercent), 
        height: Math.max(1, newHeightPercent),
        x: newXPercent,
        y: newYPercent,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      onCommit(layer.id);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [layer, onUpdate, onCommit, getContainerRect, isResizing, type]);

  // --- Rotation Logic ---
  const handleRotateMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (layer.isLocked) return;

    setIsRotating(true);
    const layerRect = layerRef.current?.getBoundingClientRect();
    if (!layerRect) return;

    const centerX = layerRect.left + layerRect.width / 2;
    const centerY = layerRect.top + layerRect.height / 2;
    const initialRotation = layer.rotation ?? 0;

    const getAngle = (clientX: number, clientY: number) => {
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      return Math.atan2(dy, dx) * (180 / Math.PI);
    };

    const startAngle = getAngle(e.clientX, e.clientY);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isRotating) return;
      const currentAngle = getAngle(e.clientX, e.clientY);
      let deltaAngle = currentAngle - startAngle;

      // Normalize angle
      let newRotation = initialRotation + deltaAngle;
      newRotation = (newRotation % 360 + 360) % 360;

      onUpdate(layer.id, { rotation: newRotation });
    };

    const handleMouseUp = () => {
      setIsRotating(false);
      onCommit(layer.id);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [layer, onUpdate, onCommit, isRotating]);

  return {
    layerRef,
    handleDragMouseDown,
    handleResizeMouseDown,
    handleRotateMouseDown,
    handlePointDragMouseDown,
    isDraggingPoint,
  };
};