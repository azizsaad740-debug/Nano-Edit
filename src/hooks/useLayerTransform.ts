import * as React from "react";
import { useCallback, useRef } from "react";
import type { Layer, ActiveTool, Point, VectorShapeLayerData, TextLayerData, Dimensions } from "@/types/editor";
import { isVectorShapeLayer, isTextLayer } from '@/types/editor';

interface UseLayerTransformProps {
  layer: Layer;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
  type: 'text' | 'vector-shape' | 'drawing' | 'gradient' | 'smart-object' | 'group';
  smartObjectData?: any;
  parentDimensions?: Dimensions | null;
  activeTool: ActiveTool | null;
  isSelected: boolean;
  zoom: number;
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
}: UseLayerTransformProps) => {
  const layerRef = useRef<HTMLDivElement>(null);
  const dragStartInfo = useRef<{ x: number; y: number; initialX: number; initialY: number; initialWidth: number; initialHeight: number; initialRotation: number }>({ x: 0, y: 0, initialX: 0, initialY: 0, initialWidth: 0, initialHeight: 0, initialRotation: 0 });
  const resizeStartInfo = useRef<{ x: number; y: number; initialWidth: number; initialHeight: number; initialX: number; initialY: number; position: string }>({ x: 0, y: 0, initialWidth: 0, initialHeight: 0, initialX: 0, initialY: 0, position: '' });
  const rotateStartInfo = useRef<{ x: number; y: number; initialRotation: number }>({ x: 0, y: 0, initialRotation: 0 });
  
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [isRotating, setIsRotating] = React.useState(false);
  
  const [isDraggingPoint, setIsDraggingPoint] = React.useState<number | null>(null);
  const pointDragStartInfo = React.useRef<{ x: number; y: number; initialPoints: Point[] | undefined }>({ x: 0, y: 0, initialPoints: undefined });

  const isMovable = activeTool === 'move' || (isSelected && !['lasso', 'brush', 'eraser', 'text', 'shape', 'eyedropper', 'crop'].includes(activeTool || ''));
  const isResizable = isSelected && !isDragging && !isRotating && !isDraggingPoint;
  const isRotatable = isSelected && !isDragging && !isResizing && !isDraggingPoint;

  // --- Point Dragging (for Vector Shapes) ---

  const handlePointDragMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement>, pointIndex: number) => {
    e.stopPropagation();
    if (!isVectorShapeLayer(layer) || !layer.points) return;
    
    setIsDraggingPoint(pointIndex);
    pointDragStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      initialPoints: layer.points,
    };
  }, [layer, setIsDraggingPoint]);

  const handlePointDragMouseMove = React.useCallback((e: MouseEvent) => {
    if (isDraggingPoint === null || !layerRef.current || !isVectorShapeLayer(layer) || !layer.points) return;
    
    const initialPoints = pointDragStartInfo.current.initialPoints;
    if (!initialPoints) return;

    // Scale down screen movement by zoom factor
    const dx = (e.clientX - pointDragStartInfo.current.x) / zoom;
    const dy = (e.clientY - pointDragStartInfo.current.y) / zoom;

    // Convert pixel movement (dx, dy) to percentage movement relative to the layer's bounding box
    const layerRect = layerRef.current.getBoundingClientRect();
    const dxPercent = (dx / layerRect.width) * 100;
    const dyPercent = (dy / layerRect.height) * 100;

    const newPoints = initialPoints.map((p, index) => {
      if (index === isDraggingPoint) {
        return { x: p.x + dxPercent, y: p.y + dyPercent };
      }
      return p;
    });

    onUpdate(layer.id, { points: newPoints });
  }, [isDraggingPoint, layer.id, layer, onUpdate, zoom]);

  const handlePointDragMouseUp = React.useCallback(() => {
    if (isDraggingPoint !== null) {
      onCommit(layer.id);
      setIsDraggingPoint(null);
    }
  }, [isDraggingPoint, layer.id, onCommit]);

  // --- Dragging (Move) ---

  const handleDragMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMovable || isDraggingPoint !== null) return;
    e.stopPropagation();

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    // Calculate initial position relative to container (in percentage)
    let initialXPercent = (rect.left + rect.width / 2 - containerRect.left) / containerRect.width * 100;
    let initialYPercent = (rect.top + rect.height / 2 - containerRect.top) / containerRect.height * 100;

    // Use layer's stored x/y if available, otherwise use calculated position
    initialXPercent = layer.x ?? initialXPercent;
    initialYPercent = layer.y ?? initialYPercent;

    dragStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: initialXPercent,
      initialY: initialYPercent,
      initialWidth: layer.width ?? 100,
      initialHeight: layer.height ?? 100,
      initialRotation: layer.rotation ?? 0,
    };

    setIsDragging(true);
  }, [layer, isMovable, isDraggingPoint, containerRef]);

  const handleDragMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Scale down screen movement by zoom factor
    const dx = (e.clientX - dragStartInfo.current.x) / zoom;
    const dy = (e.clientY - dragStartInfo.current.y) / zoom;

    const dxPercent = (dx / containerRect.width) * 100;
    const dyPercent = (dy / containerRect.height) * 100;

    const newX = dragStartInfo.current.initialX + dxPercent;
    const newY = dragStartInfo.current.initialY + dyPercent;

    onUpdate(layer.id, { x: newX, y: newY });
  }, [isDragging, layer.id, onUpdate, containerRef, zoom]);

  const handleDragMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onCommit(layer.id);
    }
  }, [isDragging, layer.id, onCommit]);

  // --- Resizing ---

  const handleResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, position: string) => {
    if (!isResizable) return;
    e.stopPropagation();

    const target = layerRef.current;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!target || !containerRect) return;

    const rect = target.getBoundingClientRect();

    // Calculate initial position relative to container (in percentage)
    let initialXPercent = (rect.left + rect.width / 2 - containerRect.left) / containerRect.width * 100;
    let initialYPercent = (rect.top + rect.height / 2 - containerRect.top) / containerRect.height * 100;

    // Use layer's stored x/y if available
    initialXPercent = layer.x ?? initialXPercent;
    initialYPercent = layer.y ?? initialYPercent;

    // Determine initial width/height in percentage relative to container
    let initialWidthPercent = (rect.width / containerRect.width) * 100;
    let initialHeightPercent = (rect.height / containerRect.height) * 100;

    // Special handling for text layers where width/height might not be explicitly set
    if (type === "text") {
      // We'll use fontSize as the "initialHeight" for calculation purposes
      initialHeightPercent = isTextLayer(layer) ? layer.fontSize ?? 48 : 48;
    } else if (type === "vector-shape" || type === "group" || type === "gradient" || type === "drawing" || type === "smart-object") {
      initialWidthPercent = layer.width ?? 100;
      initialHeightPercent = layer.height ?? 100;
    }

    resizeStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      initialWidth: initialWidthPercent,
      initialHeight: initialHeightPercent,
      initialX: initialXPercent,
      initialY: initialYPercent,
      position,
    };

    setIsResizing(true);
  }, [layer, isResizable, containerRef, type]);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const { x: startX, y: startY, initialWidth, initialHeight, initialX, initialY, position } = resizeStartInfo.current;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Scale down screen movement by zoom factor
    const dx = (e.clientX - startX) / zoom;
    const dy = (e.clientY - startY) / zoom;

    const dxPercent = (dx / containerRect.width) * 100;
    const dyPercent = (dy / containerRect.height) * 100;

    let newWidth = initialWidth;
    let newHeight = initialHeight;
    let newX = initialX;
    let newY = initialY;

    // Simplified resizing logic (ignoring rotation for now)
    if (position.includes('right')) {
      newWidth = initialWidth + dxPercent;
      newX = initialX + dxPercent / 2;
    } else if (position.includes('left')) {
      newWidth = initialWidth - dxPercent;
      newX = initialX - dxPercent / 2;
    }

    if (position.includes('bottom')) {
      newHeight = initialHeight + dyPercent;
      newY = initialY + dyPercent / 2;
    } else if (position.includes('top')) {
      newHeight = initialHeight - dyPercent;
      newY = initialY - dyPercent / 2;
    }

    // Clamp dimensions to a minimum size (e.g., 1%)
    newWidth = Math.max(1, newWidth);
    newHeight = Math.max(1, newHeight);

    onUpdate(layer.id, { 
      width: newWidth, 
      height: newHeight, 
      x: newX, 
      y: newY 
    });
  }, [isResizing, layer.id, onUpdate, containerRef, zoom]);

  const handleResizeMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      onCommit(layer.id);
    }
  }, [isResizing, layer.id, onCommit]);

  // --- Rotation ---

  const handleRotateMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRotatable) return;
    e.stopPropagation();

    const target = layerRef.current;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!target || !containerRect) return;

    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    rotateStartInfo.current = {
      x: centerX,
      y: centerY,
      initialRotation: layer.rotation ?? 0,
    };

    setIsRotating(true);
  }, [layer.rotation, isRotatable, containerRef]);

  const handleRotateMouseMove = useCallback((e: MouseEvent) => {
    if (!isRotating) return;

    const { x: centerX, y: centerY, initialRotation } = rotateStartInfo.current;

    const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const angleDeg = angleRad * (180 / Math.PI) + 90; // Adjust for 0deg being up

    // Normalize angle to -180 to 180
    let newRotation = angleDeg % 360;
    if (newRotation > 180) newRotation -= 360;
    if (newRotation < -180) newRotation += 360;

    onUpdate(layer.id, { rotation: newRotation });
  }, [isRotating, layer.id, onUpdate]);

  const handleRotateMouseUp = useCallback(() => {
    if (isRotating) {
      setIsRotating(false);
      onCommit(layer.id);
    }
  }, [isRotating, layer.id, onCommit]);

  // --- Global Event Listeners ---

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMouseMove);
      document.addEventListener('mouseup', handleDragMouseUp);
    } else if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
    } else if (isRotating) {
      document.addEventListener('mousemove', handleRotateMouseMove);
      document.addEventListener('mouseup', handleRotateMouseUp);
    } else if (isDraggingPoint !== null) {
      document.addEventListener('mousemove', handlePointDragMouseMove);
      document.addEventListener('mouseup', handlePointDragMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMouseMove);
      document.removeEventListener('mouseup', handleDragMouseUp);
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
      document.removeEventListener('mousemove', handleRotateMouseMove);
      document.removeEventListener('mouseup', handleRotateMouseUp);
      document.removeEventListener('mousemove', handlePointDragMouseMove);
      document.removeEventListener('mouseup', handlePointDragMouseUp);
    };
  }, [isDragging, isResizing, isRotating, isDraggingPoint, handleDragMouseMove, handleDragMouseUp, handleResizeMouseMove, handleResizeMouseUp, handleRotateMouseMove, handleRotateMouseUp, handlePointDragMouseMove, handlePointDragMouseUp]);

  return {
    layerRef,
    handleDragMouseDown,
    handleResizeMouseDown,
    handleRotateMouseDown,
    handlePointDragMouseDown,
    isDraggingPoint,
  };
};