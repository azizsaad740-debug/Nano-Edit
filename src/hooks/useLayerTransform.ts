import * as React from "react";
import { useCallback, useRef } from "react";
import type { Layer, ActiveTool, Point, VectorShapeLayerData, TextLayerData } from "@/types/editor";
import { isVectorShapeLayer, isTextLayer } from '@/types/editor'; // Assuming type guards are available or defined locally

// ... (inside useLayerTransform)

// Error 4: Layer['points'] is invalid. Use Point[] or undefined.
const pointDragStartInfo = React.useRef<{ x: number; y: number; initialPoints: Point[] | undefined }>({ x: 0, y: 0, initialPoints: undefined }); // FIX 4

// ... (around line 93)
  const handlePointDragMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement>, pointIndex: number) => {
    e.stopPropagation();
    if (!isVectorShapeLayer(layer) || !layer.points) return; // FIX 5: Use type guard
    
    setIsDraggingPoint(pointIndex);
    pointDragStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      initialPoints: layer.points, // FIX 6: Layer is now narrowed to VectorShapeLayerData
    };
  }, [layer, type, setIsDraggingPoint]);

// ... (around line 104)
  const handlePointDragMouseMove = React.useCallback((e: MouseEvent) => {
    if (isDraggingPoint === null || !layerRef.current || !isVectorShapeLayer(layer) || !layer.points) return; // FIX 7: Use type guard
    
    const initialPoints = pointDragStartInfo.current.initialPoints;
    if (!initialPoints) return;

    const dx = (e.clientX - pointDragStartInfo.current.x) / zoom;
    const dy = (e.clientY - pointDragStartInfo.current.y) / zoom;

    const newPoints = initialPoints.map((p, index) => {
      if (index === isDraggingPoint) {
        return { x: p.x + dx, y: p.y + dy };
      }
      return p;
    });

    onUpdate(layer.id, { points: newPoints });
  }, [isDraggingPoint, layer.id, layer, onUpdate, zoom]); // FIX 8: Removed layer.points from dependency array, layer is sufficient

// ... (around line 156)
    } else if (type === "text") {
      // We'll use fontSize as the "initialHeight" for calculation purposes
      initialHeightPercent = isTextLayer(layer) ? layer.fontSize ?? 48 : 48; // FIX 9: Use type guard
    } else if (type === "vector-shape" || type === "group" || type === "gradient" || type === "drawing") { // Added 'drawing' type
// ...