"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import { showError } from "@/utils/toast";
import type { Layer, ActiveTool, BrushState, GradientToolState } from "./useEditorState";

export interface UseSmartObjectLayersProps {
  initialLayers: Layer[];
  smartObjectDimensions: { width: number; height: number };
  foregroundColor: string;
  backgroundColor: string;
  selectedShapeType: Layer['shapeType'] | null;
}

export const useSmartObjectLayers = ({
  initialLayers,
  smartObjectDimensions,
  foregroundColor,
  backgroundColor,
  selectedShapeType,
}: UseSmartObjectLayersProps) => {
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [history, setHistory] = useState<Layer[][]>([initialLayers]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const recordHistory = useCallback((newLayers: Layer[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newLayers]);
    setHistoryIndex(newHistory.length);
  }, [history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setLayers(history[newIndex]);
      setHistoryIndex(newIndex);
      setSelectedLayerId(null);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setLayers(history[newIndex]);
      setHistoryIndex(newIndex);
      setSelectedLayerId(null);
    }
  }, [history, historyIndex]);

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)));
  }, []);

  const commitLayerChange = useCallback((id: string) => {
    setLayers(prev => {
      recordHistory(prev);
      return prev;
    });
  }, [recordHistory]);

  const handleLayerPropertyCommit = useCallback((id: string, updates: Partial<Layer>, historyName: string) => {
    setLayers(prev => {
      const updatedLayers = prev.map(l => (l.id === id ? { ...l, ...updates } : l));
      recordHistory(updatedLayers);
      return updatedLayers;
    });
  }, [recordHistory]);

  const handleLayerOpacityChange = useCallback((opacity: number) => {
    if (selectedLayerId) {
      updateLayer(selectedLayerId, { opacity });
    }
  }, [selectedLayerId, updateLayer]);

  const handleLayerOpacityCommit = useCallback(() => {
    if (selectedLayerId) {
      commitLayerChange(selectedLayerId);
    }
  }, [selectedLayerId, commitLayerChange]);

  const handleAddTextLayer = useCallback(() => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "text",
      name: `Text ${layers.filter((l) => l.type === "text").length + 1}`,
      visible: true,
      content: "New Text",
      x: 50,
      y: 50,
      fontSize: 48,
      color: foregroundColor,
      fontFamily: "Roboto",
      opacity: 100,
      blendMode: 'normal',
      fontWeight: "normal",
      fontStyle: "normal",
      textAlign: "center",
      rotation: 0,
      letterSpacing: 0,
      padding: 10,
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    recordHistory(updated);
    setSelectedLayerId(newLayer.id);
  }, [layers, recordHistory, foregroundColor]);

  const handleAddDrawingLayer = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = smartObjectDimensions.width;
    canvas.height = smartObjectDimensions.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      showError("Failed to create canvas for new drawing layer.");
      return "";
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const transparentDataUrl = canvas.toDataURL();

    const newLayer: Layer = {
      id: uuidv4(),
      type: "drawing",
      name: `Drawing ${layers.filter((l) => l.type === "drawing").length + 1}`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      dataUrl: transparentDataUrl,
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    recordHistory(updated);
    setSelectedLayerId(newLayer.id);
    return newLayer.id;
  }, [layers, recordHistory, smartObjectDimensions]);

  const handleAddShapeLayer = useCallback(() => {
    if (!selectedShapeType) {
      showError("Please select a shape type first.");
      return;
    }
    const newLayer: Layer = {
      id: uuidv4(),
      type: "vector-shape",
      name: `${selectedShapeType?.charAt(0).toUpperCase() + selectedShapeType?.slice(1) || 'Shape'} ${layers.filter((l) => l.type === "vector-shape").length + 1}`,
      visible: true,
      x: 50,
      y: 50,
      width: 10,
      height: 10,
      rotation: 0,
      opacity: 100,
      blendMode: 'normal',
      shapeType: selectedShapeType,
      fillColor: foregroundColor,
      strokeColor: backgroundColor,
      strokeWidth: 2,
      borderRadius: 0,
      points: selectedShapeType === 'triangle' ? [{x: 0, y: 100}, {x: 50, y: 0}, {x: 100, y: 100}] : undefined,
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    recordHistory(updated);
    setSelectedLayerId(newLayer.id);
  }, [layers, recordHistory, selectedShapeType, foregroundColor, backgroundColor]);

  const handleAddGradientLayer = useCallback(() => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "gradient",
      name: `Gradient ${layers.filter((l) => l.type === "gradient").length + 1}`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
      gradientType: 'linear',
      gradientColors: [foregroundColor, backgroundColor],
      gradientStops: [0, 1],
      gradientAngle: 90,
      gradientFeather: 0,
      gradientInverted: false,
      gradientCenterX: 50,
      gradientCenterY: 50,
      gradientRadius: 50,
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    recordHistory(updated);
    setSelectedLayerId(newLayer.id);
  }, [layers, recordHistory, foregroundColor, backgroundColor]);

  const handleDeleteLayer = useCallback(() => {
    if (!selectedLayerId) return;
    const updated = layers.filter(l => l.id !== selectedLayerId);
    setLayers(updated);
    recordHistory(updated);
    setSelectedLayerId(null);
  }, [layers, selectedLayerId, recordHistory]);

  const handleDuplicateLayer = useCallback(() => {
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer) return;
    const newLayer: Layer = {
      ...selectedLayer,
      id: uuidv4(),
      name: `${selectedLayer.name} Copy`,
    };
    setLayers(prev => {
      const index = prev.findIndex(l => l.id === selectedLayer.id);
      const updated = [...prev.slice(0, index + 1), newLayer, ...prev.slice(index + 1)];
      recordHistory(updated);
      return updated;
    });
    setSelectedLayerId(newLayer.id);
  }, [layers, selectedLayerId, recordHistory]);

  const handleToggleVisibility = useCallback((id: string) => {
    setLayers(prev => {
      const updated = prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l);
      recordHistory(updated);
      return updated;
    });
  }, [recordHistory]);

  const handleReorder = useCallback((activeId: string, overId: string) => {
    const oldIndex = layers.findIndex((l) => l.id === activeId);
    const newIndex = layers.findIndex((l) => l.id === overId);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    
    setLayers(prev => {
      const updated = arrayMove(prev, oldIndex, newIndex);
      recordHistory(updated);
      return updated;
    });
  }, [layers, recordHistory]);

  const handleDrawingStrokeEnd = useCallback((strokeDataUrl: string, layerId: string) => {
    // This is a simplified version for the Smart Object Editor, assuming no complex history/undo needed here.
    // In a real scenario, this would merge the stroke onto the existing drawing layer dataUrl.
    // For now, we'll just update the dataUrl of the target layer.
    updateLayer(layerId, { dataUrl: strokeDataUrl });
    commitLayerChange(layerId);
  }, [updateLayer, commitLayerChange]);


  return {
    layers,
    selectedLayerId,
    setSelectedLayerId,
    handleUndo,
    handleRedo,
    handleReorder,
    handleLayerUpdate: updateLayer,
    handleLayerCommit: commitLayerChange,
    handleLayerPropertyCommit,
    handleLayerOpacityChange,
    handleLayerOpacityCommit,
    handleAddTextLayer,
    handleAddDrawingLayer,
    handleAddShapeLayer,
    handleAddGradientLayer,
    handleDeleteLayer,
    handleDuplicateLayer,
    handleToggleVisibility,
    handleDrawingStrokeEnd,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
};