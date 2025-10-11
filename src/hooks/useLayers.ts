"use client";

import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils";
import type { Layer, EditState, Point } from "./useEditorState";

export interface HistoryItem {
  name: string;
  state: EditState;
  layers: Layer[];
}

export interface UseLayersProps {
  currentEditState: EditState;
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void;
  updateCurrentState: (updates: Partial<EditState>) => void;
  imgRef: React.RefObject<HTMLImageElement>;
  imageNaturalDimensions: { width: number; height: number } | null;
}

const initialLayers: Layer[] = [
  {
    id: uuidv4(),
    type: "image",
    name: "Background",
    visible: true,
    opacity: 100,
    blendMode: 'normal',
  },
];

export const useLayers = ({
  currentEditState,
  recordHistory,
  updateCurrentState,
  imgRef,
  imageNaturalDimensions,
}: UseLayersProps) => {
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isSmartObjectEditorOpen, setIsSmartObjectEditorOpen] = useState(false);
  const [smartObjectEditingId, setSmartObjectEditingId] = useState<string | null>(null);

  const updateLayersState = useCallback(
    (newLayers: Layer[], historyName?: string) => {
      setLayers(newLayers);
      if (historyName) {
        recordHistory(historyName, currentEditState, newLayers);
      }
    },
    [currentEditState, recordHistory]
  );

  const addTextLayer = useCallback((coords?: { x: number; y: number }) => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "text",
      name: `Text ${layers.filter((l) => l.type === "text").length + 1}`,
      visible: true,
      content: "New Text",
      x: coords?.x ?? 50,
      y: coords?.y ?? 50,
      fontSize: 48,
      color: "#FFFFFF",
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
    updateLayersState(updated, "Add Text Layer");
    setSelectedLayerId(newLayer.id);
  }, [layers, updateLayersState]);

  const addDrawingLayer = useCallback(() => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "drawing",
      name: `Drawing ${layers.filter((l) => l.type === "drawing").length + 1}`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      dataUrl: "",
    };
    const updated = [...layers, newLayer];
    updateLayersState(updated, "Add Drawing Layer");
    setSelectedLayerId(newLayer.id);
    return newLayer.id;
  }, [layers, updateLayersState]);

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }, []);

  const commitLayerChange = useCallback((id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;
    const action = layer.type === 'drawing' ? 'Brush Stroke' : `Edit Layer "${layer.name}"`;
    recordHistory(action, currentEditState, layers);
  }, [currentEditState, layers, recordHistory]);

  const handleLayerPropertyCommit = useCallback((id: string, updates: Partial<Layer>, historyName: string) => {
    const updatedLayers = layers.map((l) => (l.id === id ? { ...l, ...updates } : l));
    updateLayersState(updatedLayers, historyName);
  }, [layers, updateLayersState]);

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

  const toggleLayerVisibility = useCallback((id: string) => {
    const updated = layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l);
    updateLayersState(updated, "Toggle Layer Visibility");
  }, [layers, updateLayersState]);

  const renameLayer = useCallback((id: string, newName: string) => {
    const layerToRename = layers.find(l => l.id === id);
    if (layerToRename && layerToRename.type === 'image') {
      showError("The background layer cannot be renamed.");
      return;
    }
    const updated = layers.map(l => l.id === id ? { ...l, name: newName } : l);
    updateLayersState(updated, `Rename Layer to "${newName}"`);
  }, [layers, updateLayersState]);

  const deleteLayer = useCallback((id: string) => {
    const layerToDelete = layers.find(l => l.id === id);
    if (layerToDelete && layerToDelete.type === 'image') {
      showError("The background layer cannot be deleted.");
      return;
    }
    if (id === selectedLayerId) {
      setSelectedLayerId(null);
    }
    const updated = layers.filter(l => l.id !== id);
    updateLayersState(updated, "Delete Layer");
  }, [layers, updateLayersState, selectedLayerId]);

  const duplicateLayer = useCallback((id: string) => {
    const layerIndex = layers.findIndex(l => l.id === id);
    const layerToDuplicate = layers[layerIndex];

    if (!layerToDuplicate || layerToDuplicate.type === 'image') {
      showError("The background layer cannot be duplicated.");
      return;
    }

    const newLayer: Layer = {
      ...layerToDuplicate,
      id: uuidv4(),
      name: `${layerToDuplicate.name} Copy`,
    };

    const updated = [
      ...layers.slice(0, layerIndex + 1),
      newLayer,
      ...layers.slice(layerIndex + 1),
    ];

    updateLayersState(updated, "Duplicate Layer");
    setSelectedLayerId(newLayer.id);
  }, [layers, updateLayersState]);

  const rasterizeLayer = useCallback(async (id: string) => {
    const layerToRasterize = layers.find(l => l.id === id);

    if (!layerToRasterize || layerToRasterize.type !== 'text' || !imgRef.current) {
      showError("Only text layers can be rasterized.");
      return;
    }

    const toastId = showLoading("Rasterizing layer...");
    try {
      const imageDimensions = { width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight };
      const canvas = await rasterizeLayerToCanvas(layerToRasterize, imageDimensions);
      if (!canvas) throw new Error("Failed to create canvas for rasterization.");

      const dataUrl = canvas.toDataURL();

      const newLayer: Layer = {
        ...layerToRasterize,
        type: 'drawing',
        dataUrl: dataUrl,
        content: undefined, x: undefined, y: undefined, fontSize: undefined,
        fontFamily: undefined, fontWeight: undefined, fontStyle: undefined,
        textAlign: undefined, rotation: undefined, letterSpacing: undefined,
        textShadow: undefined, stroke: undefined, backgroundColor: undefined,
        padding: undefined, width: undefined, height: undefined,
      };

      const updatedLayers = layers.map(l => l.id === id ? newLayer : l);
      updateLayersState(updatedLayers, `Rasterize Layer "${layerToRasterize.name}"`);
      
      dismissToast(toastId);
      showSuccess("Layer rasterized.");
    } catch (err: any) {
      console.error("Failed to rasterize layer:", err);
      dismissToast(toastId);
      showError(err.message || "Failed to rasterize layer.");
    }
  }, [layers, updateLayersState, imgRef]);

  const mergeLayerDown = useCallback(async (id: string) => {
    const layerIndex = layers.findIndex(l => l.id === id);
    
    if (layerIndex < 1 || layers[layerIndex - 1].type === 'image') {
      showError("This layer cannot be merged down.");
      return;
    }

    const topLayer = layers[layerIndex];
    const bottomLayer = layers[layerIndex - 1];

    const toastId = showLoading("Merging layers...");

    try {
      if (!imgRef.current) throw new Error("Image reference is not available.");
      const imageDimensions = { width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight };

      const bottomCanvas = await rasterizeLayerToCanvas(bottomLayer, imageDimensions);
      const topCanvas = await rasterizeLayerToCanvas(topLayer, imageDimensions);

      if (!bottomCanvas || !topCanvas) throw new Error("Failed to rasterize layers for merging.");

      const mergedCanvas = document.createElement('canvas');
      mergedCanvas.width = imageDimensions.width;
      mergedCanvas.height = imageDimensions.height;
      const ctx = mergedCanvas.getContext('2d');
      if (!ctx) throw new Error("Failed to create canvas for merging.");

      // Draw bottom layer
      ctx.globalAlpha = (bottomLayer.opacity ?? 100) / 100;
      ctx.globalCompositeOperation = (bottomLayer.blendMode || 'normal') as GlobalCompositeOperation;
      ctx.drawImage(bottomCanvas, 0, 0);

      // Draw top layer
      ctx.globalAlpha = (topLayer.opacity ?? 100) / 100;
      ctx.globalCompositeOperation = (topLayer.blendMode || 'normal') as GlobalCompositeOperation;
      ctx.drawImage(topCanvas, 0, 0);

      const mergedDataUrl = mergedCanvas.toDataURL();

      const newBottomLayer: Layer = {
        id: bottomLayer.id,
        type: 'drawing',
        name: bottomLayer.name,
        visible: bottomLayer.visible,
        dataUrl: mergedDataUrl,
        opacity: 100, // Opacity is baked in, so reset to 100
        blendMode: 'normal', // Blend mode is baked in
      };

      const updatedLayers = layers
        .filter(l => l.id !== topLayer.id)
        .map(l => l.id === bottomLayer.id ? newBottomLayer : l);

      updateLayersState(updatedLayers, `Merge Layer "${topLayer.name}" Down`);
      setSelectedLayerId(bottomLayer.id);
      dismissToast(toastId);
      showSuccess("Layers merged.");

    } catch (err: any) {
      console.error("Failed to merge layers:", err);
      dismissToast(toastId);
      showError(err.message || "Failed to merge layers.");
    }
  }, [layers, updateLayersState, imgRef]);

  const reorderLayers = useCallback((oldIndex: number, newIndex: number) => {
    if (layers[oldIndex].type === 'image' || layers[newIndex].type === 'image') {
      showError("The background layer cannot be moved.");
      return;
    }
    const updated = arrayMove(layers, oldIndex, newIndex);
    updateLayersState(updated, "Reorder Layers");
  }, [layers, updateLayersState]);

  /* ---------- Smart Object Functions ---------- */
  const createSmartObject = useCallback((layerIds: string[]) => {
    if (layerIds.length < 1) {
      showError("Please select at least one layer to create a smart object.");
      return;
    }

    // Get the selected layers
    const selectedLayers = layers.filter(layer => layerIds.includes(layer.id));
    
    // Find the bounds of all selected layers
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    selectedLayers.forEach(layer => {
      if (layer.type === 'text' && layer.x !== undefined && layer.y !== undefined) {
        // For text layers, we need to calculate approximate bounds
        const fontSize = layer.fontSize || 16;
        const textWidth = (layer.content?.length || 1) * fontSize * 0.6; // Approximate width
        const textHeight = fontSize * 1.2; // Approximate height
        
        const x = (layer.x / 100) * (imageNaturalDimensions?.width || 1000);
        const y = (layer.y / 100) * (imageNaturalDimensions?.height || 1000);
        
        minX = Math.min(minX, x - textWidth / 2);
        minY = Math.min(minY, y - textHeight / 2);
        maxX = Math.max(maxX, x + textWidth / 2);
        maxY = Math.max(maxY, y + textHeight / 2);
      } else if (layer.type === 'drawing' && imgRef.current) {
        // For drawing layers, assume they cover the whole canvas for now
        minX = Math.min(minX, 0);
        minY = Math.min(minY, 0);
        maxX = Math.max(maxX, imgRef.current.naturalWidth);
        maxY = Math.max(maxY, imgRef.current.naturalHeight);
      }
    });
    
    // If we couldn't determine bounds, use default size
    if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
      minX = 0;
      minY = 0;
      maxX = imageNaturalDimensions?.width || 1000;
      maxY = imageNaturalDimensions?.height || 1000;
    }
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Create the smart object layer
    const smartObjectLayer: Layer = {
      id: uuidv4(),
      type: "smart-object",
      name: "Smart Object",
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      x: (minX / (imageNaturalDimensions?.width || 1000)) * 100,
      y: (minY / (imageNaturalDimensions?.height || 1000)) * 100,
      width: (width / (imageNaturalDimensions?.width || 1000)) * 100,
      height: (height / (imageNaturalDimensions?.height || 1000)) * 100,
      rotation: 0,
      smartObjectData: {
        layers: selectedLayers,
        width,
        height
      }
    };

    // Remove the original layers and add the smart object
    const updatedLayers = layers
      .filter(layer => !layerIds.includes(layer.id))
      .concat(smartObjectLayer);

    updateLayersState(updatedLayers, "Create Smart Object");
    setSelectedLayerId(smartObjectLayer.id);
  }, [layers, updateLayersState, imageNaturalDimensions, imgRef]);

  const openSmartObjectEditor = useCallback((id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer || layer.type !== 'smart-object') {
      showError("Invalid smart object layer.");
      return;
    }
    
    setSmartObjectEditingId(id);
    setIsSmartObjectEditorOpen(true);
  }, [layers]);

  const closeSmartObjectEditor = useCallback(() => {
    setIsSmartObjectEditorOpen(false);
    setSmartObjectEditingId(null);
  }, []);

  const saveSmartObjectChanges = useCallback((updatedNestedLayers: Layer[]) => {
    if (!smartObjectEditingId) return;
    
    const updatedAllLayers = layers.map(layer => {
      if (layer.id === smartObjectEditingId && layer.type === 'smart-object' && layer.smartObjectData) {
        return {
          ...layer,
          smartObjectData: {
            ...layer.smartObjectData,
            layers: updatedNestedLayers
          }
        };
      }
      return layer;
    });
    
    updateLayersState(updatedAllLayers, "Edit Smart Object");
    closeSmartObjectEditor();
    showSuccess("Smart object changes saved.");
  }, [layers, updateLayersState, smartObjectEditingId, closeSmartObjectEditor]);

  return {
    layers,
    setLayers, // Expose setLayers for initial load from project
    selectedLayerId,
    setSelectedLayerId,
    addTextLayer,
    addDrawingLayer,
    toggleLayerVisibility,
    renameLayer,
    deleteLayer,
    duplicateLayer,
    mergeLayerDown,
    rasterizeLayer,
    updateLayer,
    commitLayerChange,
    handleLayerPropertyCommit,
    handleLayerOpacityChange,
    handleLayerOpacityCommit,
    reorderLayers,
    createSmartObject,
    openSmartObjectEditor,
    closeSmartObjectEditor,
    saveSmartObjectChanges,
    isSmartObjectEditorOpen,
    smartObjectEditingId,
  };
};