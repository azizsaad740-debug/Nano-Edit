import React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { Layer, ActiveTool, Point, VectorShapeLayerData, TextLayerData, Dimensions } from "@/types/editor";
import { isVectorShapeLayer, isTextLayer } from '@/types/editor'; // Fix 159, 160

// ... (rest of file)

const handlePointDragMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement>, index: number) => {
    e.stopPropagation();
    if (!isVectorShapeLayer(layer) || !layer.points) return; // Fix 161
    
    setIsDraggingPoint({
      index,
      startX: e.clientX,
      startY: e.clientY,
      initialPoints: layer.points, // Fix 162
    });
  }, [layer, setIsDraggingPoint]);

const handlePointDragMouseMove = React.useCallback((e: MouseEvent) => {
    if (isDraggingPoint === null || !layerRef.current || !isVectorShapeLayer(layer) || !layer.points) return; // Fix 163
    // ...
  }, [isDraggingPoint, layerRef, layer, updateLayer]);

// ... (around line 192)
    } else if (type === "text") {
      // We'll use fontSize as the "initialHeight" for calculation purposes
      initialHeightPercent = isTextLayer(layer) ? (layer.fontSize ?? 48) : 48; // Fix 164
    } else if (type === "vector-shape" || type === "group" || type === "gradient" || type === "drawing" || type === "smart-object") {
// ...