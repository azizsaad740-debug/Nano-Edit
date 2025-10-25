"use client";

import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils";
import type { Layer, EditState, Point, GradientToolState, ActiveTool, AdjustmentLayerData } from "./useEditorState";
import { initialCurvesState, initialHslAdjustment } from "./useEditorState";
import { invertMaskDataUrl } from "@/utils/maskUtils";
import { saveProjectToFile } from "@/utils/projectUtils"; // Import saveProjectToFile

// Helper utility functions for nested layer manipulation
const updateNestedContainer = (layers: Layer[], parentIds: string[], newContainer: Layer[]): Layer[] => {
  if (parentIds.length === 0) return newContainer;
  
  const targetId = parentIds[0];
  return layers.map(l => {
    if (l.id === targetId && l.type === 'group' && l.children) {
      return {
        ...l,
        children: updateNestedContainer(l.children, parentIds.slice(1), newContainer),
      };
    }
    return l;
  });
};

const getMutableContainer = (tree: Layer[], path: Layer[]): Layer[] => {
  let currentContainer = tree;
  for (const group of path) {
    const foundGroup = currentContainer.find(l => l.id === group.id);
    if (foundGroup && foundGroup.type === 'group' && foundGroup.children) {
      currentContainer = foundGroup.children;
    } else {
      return [];
    }
  }
  return currentContainer;
};

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
  gradientToolState: GradientToolState;
  activeTool: ActiveTool | null;
  layers: Layer[];
  // Allow function updates for setLayers to resolve TS2345 errors
  setLayers: (newLayersOrUpdater: Layer[] | ((prev: Layer[]) => Layer[]), historyName?: string) => void;
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  // Props needed for canUndo/canRedo calculation
  history: HistoryItem[];
  currentHistoryIndex: number;
  foregroundColor: string;
  backgroundColor: string;
  selectedShapeType: Layer['shapeType'] | null;
}

export const useLayers = ({
  currentEditState,
  recordHistory,
  updateCurrentState,
  imgRef,
  imageNaturalDimensions,
  gradientToolState,
  activeTool,
  layers,
  setLayers,
  selectedLayerId,
  setSelectedLayerId,
  history, // Destructure history
  currentHistoryIndex, // Destructure currentHistoryIndex
  foregroundColor,
  backgroundColor,
  selectedShapeType,
}: UseLayersProps) => {
  const [isSmartObjectEditorOpen, setIsSmartObjectEditorOpen] = useState(false);
  const [smartObjectEditingId, setSmartObjectEditingId] = useState<string | null>(null);

  const updateLayersState = useCallback(
    (newLayers: Layer[], historyName?: string) => {
      setLayers(newLayers, historyName);
    },
    [setLayers]
  );

  interface LayerLocation {
    layer: Layer;
    container: Layer[];
    index: number;
    parentGroups: Layer[];
  }

  const findLayerLocation = useCallback((
    id: string,
    currentLayers: Layer[],
    parentGroups: Layer[] = []
  ): LayerLocation | null => {
    for (let i = 0; i < currentLayers.length; i++) {
      const layer = currentLayers[i];
      if (layer.id === id) {
        return { layer, container: currentLayers, index: i, parentGroups };
      }
      if (layer.type === 'group' && layer.children) {
        const found = findLayerLocation(id, layer.children, [...parentGroups, layer]);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    // TS2345 fix: setLayers now accepts a function updater
    setLayers(prev => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }, [setLayers]);

  const commitLayerChange = useCallback((id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;
    let action = `Edit Layer "${layer.name}"`;
    if (layer.type === 'drawing') action = 'Brush Stroke';
    if (layer.type === 'vector-shape') action = `Edit Shape "${layer.name}"`;
    if (layer.type === 'gradient') action = `Edit Gradient "${layer.name}"`;
    if (layer.type === 'adjustment') action = `Edit Adjustment Layer "${layer.name}"`;
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

  const toggleLayerLock = useCallback((id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer || layer.type === 'image') {
      showError("The background layer cannot be locked/unlocked.");
      return;
    }
    const updated = layers.map(l => l.id === id ? { ...l, isLocked: !l.isLocked } : l);
    updateLayersState(updated, `Toggle Layer Lock on "${layer.name}"`);
  }, [layers, updateLayersState]);

  const renameLayer = useCallback((id: string, newName: string) => {
    const layerToRename = layers.find(l => l.id === id);
    if (!layerToRename) return;

    if (layerToRename.type === 'image' && layerToRename.name === 'Background') {
      showError("The default background layer cannot be renamed.");
      return;
    }

    const updated = layers.map(l => l.id === id ? { ...l, name: newName } : l);
    updateLayersState(updated, `Rename Layer to "${newName}"`);
  }, [layers, updateLayersState]);

  const deleteLayer = useCallback((id: string) => {
    const layerToDelete = layers.find(l => l.id === id);
    if (!layerToDelete) return;

    if (layerToDelete.type === 'image') {
      if (!imageNaturalDimensions) {
        showError("Cannot delete background without dimensions.");
        return;
      }
      // If background is deleted, replace it with a transparent drawing layer
      const canvas = document.createElement('canvas');
      canvas.width = imageNaturalDimensions.width;
      canvas.height = imageNaturalDimensions.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        showError("Failed to create canvas context for transparent background.");
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const transparentDataUrl = canvas.toDataURL();

      const newBgLayer: Layer = {
        id: uuidv4(),
        type: "drawing",
        name: "Background (Transparent)",
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        dataUrl: transparentDataUrl,
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        rotation: 0,
        isLocked: true,
      };
      const updated = layers.map(l => l.id === id ? newBgLayer : l);
      updateLayersState(updated, "Delete Background (Replaced with Transparent)");
      return;
    }

    if (id === selectedLayerId) {
      setSelectedLayerId(null);
    }
    const updated = layers.filter(l => l.id !== id);
    updateLayersState(updated, "Delete Layer");
  }, [layers, updateLayersState, selectedLayerId, imageNaturalDimensions]);

  const deleteHiddenLayers = useCallback(() => {
    const hiddenLayers = layers.filter(l => !l.visible && l.type !== 'image');
    if (hiddenLayers.length === 0) {
      showSuccess("No hidden layers found to delete.");
      return;
    }
    
    const updated = layers.filter(l => l.visible || l.type === 'image');
    updateLayersState(updated, `Delete ${hiddenLayers.length} Hidden Layers`);
    showSuccess(`${hiddenLayers.length} hidden layers deleted.`);
  }, [layers, updateLayersState]);

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
      isClippingMask: false,
      isLocked: false,
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

    if (!layerToRasterize || (layerToRasterize.type !== 'text' && layerToRasterize.type !== 'vector-shape' && layerToRasterize.type !== 'gradient') || !imgRef.current) {
      showError("Only text, vector shape, and gradient layers can be rasterized.");
      return;
    }

    const toastId = showLoading("Rasterizing layer...");
    try {
      const imageDimensions = { width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight };
      const canvas = await rasterizeLayerToCanvas(layerToRasterize, imageDimensions);
      if (!canvas) throw new Error("Failed to create canvas for rasterization.");

      const dataUrl = canvas.toDataURL();

      const newLayer: Layer = {
        id: uuidv4(),
        type: 'drawing',
        name: `${layerToRasterize.name} (Rasterized)`,
        visible: layerToRasterize.visible,
        opacity: layerToRasterize.opacity,
        blendMode: layerToRasterize.blendMode,
        dataUrl: dataUrl,
        isClippingMask: layerToRasterize.isClippingMask,
        isLocked: false,
        x: layerToRasterize.x,
        y: layerToRasterize.y,
        width: layerToRasterize.width,
        height: layerToRasterize.height,
        rotation: layerToRasterize.rotation,
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
        opacity: 100,
        blendMode: 'normal',
        isClippingMask: bottomLayer.isClippingMask,
        isLocked: false,
        x: bottomLayer.x,
        y: bottomLayer.y,
        width: bottomLayer.width,
        height: bottomLayer.height,
        rotation: bottomLayer.rotation,
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

  const reorderLayers = useCallback((activeId: string, overId: string) => {
    const activeLocation = findLayerLocation(activeId, layers);
    const overLocation = findLayerLocation(overId, layers);

    if (!activeLocation || !overLocation) {
      showError("Could not find layers for reordering.");
      return;
    }

    const { layer: activeLayer, container: activeContainer, index: activeIndex, parentGroups: activeParentGroups } = activeLocation;
    const { layer: overLayer, container: overContainer, index: overIndex, parentGroups: overParentGroups } = overLocation;

    if (activeLayer.type === 'image') {
      showError("The background layer cannot be moved.");
      return;
    }

    // Check if they are in the same container (same parent path length and same parent ID if nested)
    const sameParent = activeParentGroups.length === overParentGroups.length && 
                       (activeParentGroups.length === 0 || activeParentGroups[activeParentGroups.length - 1].id === overParentGroups[overParentGroups.length - 1].id);

    if (sameParent) {
      // 1. Simple reorder within the same container using arrayMove
      const newContainer = arrayMove(activeContainer, activeIndex, overIndex);
      
      setLayers(prevLayers => {
        const parentIds = activeParentGroups.map(g => g.id);
        return updateNestedContainer(prevLayers, parentIds, newContainer);
      }, `Reorder Layer "${activeLayer.name}"`);
      
    } else {
      // 2. Cross-container move (or drop into/out of a group)
      
      // Deep copy the entire structure to safely mutate
      let newLayers = JSON.parse(JSON.stringify(layers)) as Layer[];

      const mutableActiveContainer = getMutableContainer(newLayers, activeParentGroups);
      
      // Remove the active layer from its original container
      const currentActiveIndex = mutableActiveContainer.findIndex(l => l.id === activeId);
      if (currentActiveIndex === -1) return;
      const [movedLayer] = mutableActiveContainer.splice(currentActiveIndex, 1);

      let targetContainer: Layer[];
      let targetIndex: number;

      // Determine target container and index
      if (overLayer.type === 'group' && overLayer.expanded && overLayer.children) {
        // Drop INTO an expanded group (insert at the top of its children)
        targetContainer = getMutableContainer(newLayers, [...overParentGroups, overLayer]);
        targetIndex = 0; 
      } else {
        // Drop NEXT TO a layer or collapsed group
        targetContainer = getMutableContainer(newLayers, overParentGroups);
        
        // Find the index of the overId in the target container
        const currentOverIndex = targetContainer.findIndex(l => l.id === overId);
        targetIndex = currentOverIndex !== -1 ? currentOverIndex + 1 : targetContainer.length;
      }

      targetContainer.splice(targetIndex, 0, movedLayer);

      updateLayersState(newLayers, `Reorder Layer "${activeLayer.name}"`);
    }
  }, [layers, updateLayersState, findLayerLocation, setLayers]);

  const arrangeLayer = useCallback((direction: 'front' | 'back' | 'forward' | 'backward') => {
    if (!selectedLayerId) return;
    const location = findLayerLocation(selectedLayerId, layers);
    if (!location || location.layer.type === 'image') {
      showError("Cannot arrange background layer.");
      return;
    }

    const { container, index, layer } = location;
    let newIndex = index;

    if (direction === 'front') {
      newIndex = container.length - 1;
    } else if (direction === 'back') {
      newIndex = 0;
    } else if (direction === 'forward') {
      newIndex = Math.min(container.length - 1, index + 1);
    } else if (direction === 'backward') {
      newIndex = Math.max(0, index - 1);
    }

    if (newIndex === index) return;

    const newContainer = arrayMove(container, index, newIndex);
    
    setLayers(prevLayers => {
      const parentIds = location.parentGroups.map(g => g.id);
      return updateNestedContainer(prevLayers, parentIds, newContainer);
    }, `Arrange Layer "${layer.name}" to ${direction}`);
  }, [layers, selectedLayerId, findLayerLocation, setLayers]);

  /* ---------- Smart Object Functions ---------- */
  const createSmartObject = useCallback((layerIds: string[]) => {
    if (layerIds.length < 1) {
      showError("Please select at least one layer to create a smart object.");
      return;
    }
    if (!imageNaturalDimensions) {
      showError("Cannot create smart object without image dimensions.");
      return;
    }

    const selectedLayers = layers.filter(layer => layerIds.includes(layer.id));
    
    // 1. Calculate the bounding box in PIXELS relative to the main image canvas
    let minX_px = Infinity, minY_px = Infinity, maxX_px = -Infinity, maxY_px = -Infinity;
    
    selectedLayers.forEach(layer => {
      // We need to estimate the layer's bounding box in pixels relative to the main canvas
      const layerX_percent = layer.x ?? 50;
      const layerY_percent = layer.y ?? 50;
      let layerWidth_percent = layer.width ?? 10;
      let layerHeight_percent = layer.height ?? 10;

      // Convert percentages to pixels based on main image dimensions
      const layerX_px = (layerX_percent / 100) * imageNaturalDimensions.width;
      const layerY_px = (layerY_percent / 100) * imageNaturalDimensions.height;
      let layerWidth_px = (layerWidth_percent / 100) * imageNaturalDimensions.width;
      let layerHeight_px = (layerHeight_percent / 100) * imageNaturalDimensions.height;

      // Special handling for layers that don't use width/height properties directly (like text/drawing)
      if (layer.type === 'text') {
        const fontSize = layer.fontSize || 48;
        layerWidth_px = (layer.content?.length || 1) * fontSize * 0.6; // Rough estimate
        layerHeight_px = fontSize * 1.2;
      } else if (layer.type === 'drawing' && imgRef.current) {
        layerWidth_px = imgRef.current.naturalWidth;
        layerHeight_px = imgRef.current.naturalHeight;
      }

      // Calculate bounds
      minX_px = Math.min(minX_px, layerX_px - layerWidth_px / 2);
      minY_px = Math.min(minY_px, layerY_px - layerHeight_px / 2);
      maxX_px = Math.max(maxX_px, layerX_px + layerWidth_px / 2);
      maxY_px = Math.max(maxY_px, layerY_px + layerHeight_px / 2);
    });
    
    // 2. Define Smart Object's internal canvas dimensions
    const smartObjectWidth_px = Math.max(1, maxX_px - minX_px);
    const smartObjectHeight_px = Math.max(1, maxY_px - minY_px);
    
    // 3. Recalculate children's positions relative to the new Smart Object canvas (0,0)
    const nestedLayers: Layer[] = selectedLayers.map(layer => {
      const layerX_percent = layer.x ?? 50;
      const layerY_percent = layer.y ?? 50;
      let layerWidth_percent = layer.width ?? 10;
      let layerHeight_percent = layer.height ?? 10;

      const layerX_px = (layerX_percent / 100) * imageNaturalDimensions.width;
      const layerY_px = (layerY_percent / 100) * imageNaturalDimensions.height;
      let layerWidth_px = (layerWidth_percent / 100) * imageNaturalDimensions.width;
      let layerHeight_px = (layerHeight_percent / 100) * imageNaturalDimensions.height;

      if (layer.type === 'text') {
        const fontSize = layer.fontSize || 48;
        layerWidth_px = (layer.content?.length || 1) * fontSize * 0.6;
        layerHeight_px = fontSize * 1.2;
      } else if (layer.type === 'drawing' && imgRef.current) {
        layerWidth_px = imgRef.current.naturalWidth;
        layerHeight_px = imgRef.current.naturalHeight;
      }

      // Calculate new center position relative to the Smart Object's top-left corner (minX_px, minY_px)
      const relativeCenterX_px = layerX_px - minX_px;
      const relativeCenterY_px = layerY_px - minY_px;

      // Convert back to percentage relative to the Smart Object's internal dimensions
      const newX_percent = (relativeCenterX_px / smartObjectWidth_px) * 100;
      const newY_percent = (relativeCenterY_px / smartObjectHeight_px) * 100;
      
      // Recalculate width/height percentages relative to the Smart Object's internal dimensions
      const newWidth_percent = (layerWidth_px / smartObjectWidth_px) * 100;
      const newHeight_percent = (layerHeight_px / smartObjectHeight_px) * 100;

      return {
        ...layer,
        x: newX_percent,
        y: newY_percent,
        width: newWidth_percent,
        height: newHeight_percent,
        isClippingMask: false,
        isLocked: false,
      };
    });

    // 4. Define the Smart Object layer itself (position and size relative to main image)
    const smartObjectLayer: Layer = {
      id: uuidv4(),
      type: "smart-object",
      name: "Smart Object",
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      rotation: 0,
      isLocked: false,
      
      // Position and size relative to the main image canvas (in percentages)
      x: ((minX_px + smartObjectWidth_px / 2) / imageNaturalDimensions.width) * 100,
      y: ((minY_px + smartObjectHeight_px / 2) / imageNaturalDimensions.height) * 100,
      width: (smartObjectWidth_px / imageNaturalDimensions.width) * 100,
      height: (smartObjectHeight_px / imageNaturalDimensions.height) * 100,
      
      smartObjectData: {
        layers: nestedLayers,
        width: smartObjectWidth_px,
        height: smartObjectHeight_px
      }
    };

    const updatedLayers = layers
      .filter(layer => !layerIds.includes(layer.id))
      .concat(smartObjectLayer);

    updateLayersState(updatedLayers, "Create Smart Object");
    setSelectedLayerId(smartObjectLayer.id);
  }, [layers, updateLayersState, imageNaturalDimensions, imgRef, setSelectedLayerId]);

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

  const rasterizeSmartObject = useCallback(async () => {
    if (!selectedLayerId) return;
    const layerToRasterize = layers.find(l => l.id === selectedLayerId);

    if (!layerToRasterize || layerToRasterize.type !== 'smart-object' || !imgRef.current || !imageNaturalDimensions) {
      showError("Select a Smart Object to rasterize.");
      return;
    }

    const toastId = showLoading("Rasterizing Smart Object...");
    try {
      // Rasterize the Smart Object layer itself (which handles nested rendering)
      const canvas = await rasterizeLayerToCanvas(layerToRasterize, imageNaturalDimensions);
      if (!canvas) throw new Error("Failed to create canvas for rasterization.");

      const dataUrl = canvas.toDataURL();

      const newLayer: Layer = {
        id: uuidv4(),
        type: 'drawing',
        name: `${layerToRasterize.name} (Rasterized)`,
        visible: layerToRasterize.visible,
        opacity: layerToRasterize.opacity,
        blendMode: layerToRasterize.blendMode,
        dataUrl: dataUrl,
        isClippingMask: layerToRasterize.isClippingMask,
        isLocked: false,
        x: layerToRasterize.x,
        y: layerToRasterize.y,
        width: layerToRasterize.width,
        height: layerToRasterize.height,
        rotation: layerToRasterize.rotation,
      };

      const updatedLayers = layers.map(l => l.id === selectedLayerId ? newLayer : l);
      updateLayersState(updatedLayers, `Rasterize Smart Object "${layerToRasterize.name}"`);
      
      dismissToast(toastId);
      showSuccess("Smart Object rasterized.");
    } catch (err: any) {
      console.error("Failed to rasterize Smart Object:", err);
      dismissToast(toastId);
      showError(err.message || "Failed to rasterize Smart Object.");
    }
  }, [layers, updateLayersState, selectedLayerId, imgRef, imageNaturalDimensions]);

  const convertSmartObjectToLayers = useCallback(() => {
    if (!selectedLayerId) return;
    const smartObjectLayer = layers.find(l => l.id === selectedLayerId);

    if (!smartObjectLayer || smartObjectLayer.type !== 'smart-object' || !smartObjectLayer.smartObjectData || !imageNaturalDimensions) {
      showError("Select a Smart Object to convert to layers.");
      return;
    }

    const { smartObjectData, x: soX, y: soY, width: soW, height: soH } = smartObjectLayer;
    const { width: soWidth_px, height: soHeight_px } = smartObjectData;

    // 1. Calculate the Smart Object's bounding box in pixels relative to the main canvas
    const soX_percent = soX ?? 50;
    const soY_percent = soY ?? 50;
    const soWidth_percent = soW ?? 100;
    const soHeight_percent = soH ?? 100;
    
    const soX_px = (soX_percent / 100) * imageNaturalDimensions.width;
    const soY_px = (soY_percent / 100) * imageNaturalDimensions.height;
    
    const soWidth_px_on_canvas = imageNaturalDimensions.width * (soWidth_percent / 100);
    const soHeight_px_on_canvas = imageNaturalDimensions.height * (soHeight_percent / 100);

    const minX_px = soX_px - soWidth_px_on_canvas / 2;
    const minY_px = soY_px - soHeight_px_on_canvas / 2;

    // 2. Re-position and re-size nested layers relative to the main canvas
    const newLayers = smartObjectData.layers.map(nestedLayer => {
      const nestedX_percent = nestedLayer.x ?? 50;
      const nestedY_percent = nestedLayer.y ?? 50;
      const nestedW_percent = nestedLayer.width ?? 100;
      const nestedH_percent = nestedLayer.height ?? 100;

      // Calculate nested layer's center position relative to SO's internal canvas
      const relativeCenterX_px = (nestedX_percent / 100) * soWidth_px;
      const relativeCenterY_px = (nestedY_percent / 100) * soHeight_px;

      // Calculate nested layer's center position relative to main canvas
      const absoluteCenterX_px = minX_px + relativeCenterX_px;
      const absoluteCenterY_px = minY_px + relativeCenterY_px;

      // Calculate nested layer's size relative to main canvas
      const absoluteWidth_px = (nestedW_percent / 100) * soWidth_px_on_canvas;
      const absoluteHeight_px = (nestedH_percent / 100) * soHeight_px_on_canvas;

      return {
        ...nestedLayer,
        id: uuidv4(), // Assign new ID
        name: `${smartObjectLayer.name} - ${nestedLayer.name}`,
        isClippingMask: false,
        isLocked: false,
        
        // New position/size relative to main canvas (in percentages)
        x: (absoluteCenterX_px / imageNaturalDimensions.width) * 100,
        y: (absoluteCenterY_px / imageNaturalDimensions.height) * 100,
        width: (absoluteWidth_px / imageNaturalDimensions.width) * 100,
        height: (absoluteHeight_px / imageNaturalDimensions.height) * 100,
      };
    });

    // 3. Replace the Smart Object layer with its children
    const soIndex = layers.findIndex(l => l.id === selectedLayerId);
    const updatedLayers = [
      ...layers.slice(0, soIndex),
      ...newLayers,
      ...layers.slice(soIndex + 1),
    ];

    updateLayersState(updatedLayers, `Convert Smart Object "${smartObjectLayer.name}" to Layers`);
    setSelectedLayerId(null);
    showSuccess("Smart Object converted to individual layers.");
  }, [layers, selectedLayerId, updateLayersState, imageNaturalDimensions, setSelectedLayerId]);

  const exportSmartObjectContents = useCallback(() => {
    if (!selectedLayerId) return;
    const smartObjectLayer = layers.find(l => l.id === selectedLayerId);

    if (!smartObjectLayer || smartObjectLayer.type !== 'smart-object' || !smartObjectLayer.smartObjectData) {
      showError("Select a Smart Object to export its contents.");
      return;
    }

    const projectState = {
      sourceImage: null, // Smart object contents don't have a single source image
      history: [{ name: "Smart Object Contents", state: currentEditState, layers: smartObjectLayer.smartObjectData.layers }],
      currentHistoryIndex: 0,
      fileInfo: { name: `${smartObjectLayer.name}-contents.nanoedit`, size: 0 },
    };
    saveProjectToFile(projectState);
    showSuccess(`Smart Object contents saved as "${smartObjectLayer.name}-contents.nanoedit".`);
  }, [layers, selectedLayerId, currentEditState]);

  const moveSelectedLayer = useCallback((id: string, dx: number, dy: number) => {
    // TS2345 fix: setLayers now accepts a function updater
    setLayers(prevLayers => {
      const updatedLayers = prevLayers.map(layer => {
        if (layer.id === id && (layer.x !== undefined && layer.y !== undefined)) {
          const newX = (layer.x ?? 0) + dx;
          const newY = (layer.y ?? 0) + dy;
          return { ...layer, x: newX, y: newY };
        }
        return layer;
      });
      return updatedLayers;
    });
  }, [setLayers]);

  const groupLayers = useCallback((layerIds: string[]) => {
    if (layerIds.length < 2) {
      showError("Please select at least two layers to group.");
      return;
    }
    if (!imageNaturalDimensions) {
      showError("Cannot group layers without image dimensions.");
      return;
    }

    const selectedLayers = layers.filter(layer => layerIds.includes(layer.id));
    const nonBackgroundSelected = selectedLayers.filter(l => l.type !== 'image');

    if (nonBackgroundSelected.length !== selectedLayers.length) {
      showError("Cannot group the background layer.");
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    nonBackgroundSelected.forEach(layer => {
      const layerX_percent = layer.x ?? 50;
      const layerY_percent = layer.y ?? 50;
      let layerWidth_percent = layer.width ?? 10;
      let layerHeight_percent = layer.height ?? 10;

      const layerX_px = (layerX_percent / 100) * imageNaturalDimensions.width;
      const layerY_px = (layerY_percent / 100) * imageNaturalDimensions.height;
      let layerWidth_px = (layerWidth_percent / 100) * imageNaturalDimensions.width;
      let layerHeight_px = (layerHeight_percent / 100) * imageNaturalDimensions.height;

      if (layer.type === 'text') {
        const fontSize = layer.fontSize || 48;
        layerWidth_px = (layer.content?.length || 1) * fontSize * 0.6;
        layerHeight_px = fontSize * 1.2;
      } else if (layer.type === 'drawing' && imgRef.current) {
        layerWidth_px = imgRef.current.naturalWidth;
        layerHeight_px = imgRef.current.naturalHeight;
      } else if (layer.type === 'smart-object' && layer.smartObjectData) {
        layerWidth_px = (layer.width ?? (layer.smartObjectData.width / imageNaturalDimensions.width) * 100) / 100 * imageNaturalDimensions.width;
        layerHeight_px = (layer.height ?? (layer.smartObjectData.height / imageNaturalDimensions.height) * 100) / 100 * imageNaturalDimensions.height;
      } else if (layer.type === 'gradient') {
        layerWidth_px = (layer.width ?? 100) / 100 * imageNaturalDimensions.width;
        layerHeight_px = (layer.height ?? 100) / 100 * imageNaturalDimensions.height;
      }

      minX = Math.min(minX, layerX_px - layerWidth_px / 2);
      minY = Math.min(minY, layerY_px - layerHeight_px / 2);
      maxX = Math.max(maxX, layerX_px + layerWidth_px / 2);
      maxY = Math.max(maxY, layerY_px + layerHeight_px / 2);
    });

    const groupWidth_px = Math.max(1, maxX - minX);
    const groupHeight_px = Math.max(1, maxY - minY);
    const groupX_px = minX + groupWidth_px / 2;
    const groupY_px = minY + groupHeight_px / 2;

    const groupX_percent = (groupX_px / imageNaturalDimensions.width) * 100;
    const groupY_percent = (groupY_px / imageNaturalDimensions.height) * 100;
    const groupWidth_percent = (groupWidth_px / imageNaturalDimensions.width) * 100;
    const groupHeight_percent = (groupHeight_px / imageNaturalDimensions.height) * 100;

    const newGroup: Layer = {
      id: uuidv4(),
      type: "group",
      name: `Group ${layers.filter(l => l.type === 'group').length + 1}`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      expanded: true,
      isLocked: false,
      x: groupX_percent,
      y: groupY_percent,
      width: groupWidth_percent,
      height: groupHeight_percent,
      rotation: 0,
      children: nonBackgroundSelected.map(layer => {
        const childX_percent = layer.x ?? 50;
        const childY_percent = layer.y ?? 50;
        const childX_px = (childX_percent / 100) * imageNaturalDimensions.width;
        const childY_px = (childY_percent / 100) * imageNaturalDimensions.height;

        const relativeX_px = childX_px - minX;
        const relativeY_px = childY_px - minY;

        return {
          ...layer,
          // Recalculate child position relative to the group's bounding box (0-100%)
          x: (relativeX_px / groupWidth_px) * 100,
          y: (relativeY_px / groupHeight_px) * 100,
          isClippingMask: false,
          isLocked: false,
        };
      }),
    };

    const updatedLayers = layers
      .filter(layer => !layerIds.includes(layer.id))
      .concat(newGroup);

    updateLayersState(updatedLayers, "Group Layers");
    setSelectedLayerId(newGroup.id);
    showSuccess("Layers grouped successfully.");
  }, [layers, updateLayersState, imageNaturalDimensions, imgRef, setSelectedLayerId]);

  const toggleGroupExpanded = useCallback((id: string) => {
    // TS2345 fix: setLayers now accepts a function updater
    setLayers(prevLayers => prevLayers.map(layer => {
      if (layer.id === id && layer.type === 'group') {
        return { ...layer, expanded: !layer.expanded };
      }
      return layer;
    }));
  }, [setLayers]);

  const handleDrawingStrokeEnd = useCallback(async (strokeDataUrl: string, layerId: string) => {
    const targetLayer = layers.find(l => l.id === layerId);
    if (!targetLayer || !imgRef.current) return;

    const imageDimensions = { width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight };
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageDimensions.width;
    tempCanvas.height = imageDimensions.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const baseImg = new Image();
    const strokeImg = new Image();

    const basePromise = targetLayer.dataUrl ? new Promise((res, rej) => { baseImg.onload = res; baseImg.onerror = rej; baseImg.src = targetLayer.dataUrl!; }) : Promise.resolve();
    const strokePromise = new Promise((res, rej) => { strokeImg.onload = res; strokeImg.onerror = rej; strokeImg.src = strokeDataUrl; });

    await Promise.all([basePromise, strokePromise]);

    // Ensure default composite operation and full opacity for initial drawing
    tempCtx.globalCompositeOperation = 'source-over';
    tempCtx.globalAlpha = 1.0;

    if (targetLayer.dataUrl) {
      tempCtx.drawImage(baseImg, 0, 0); // Draw existing content
    }

    // Apply the correct composite operation for the new stroke
    if (activeTool === 'eraser') {
      tempCtx.globalCompositeOperation = 'destination-out';
    } else {
      tempCtx.globalCompositeOperation = 'source-over';
    }
    
    tempCtx.drawImage(strokeImg, 0, 0); // Draw the new stroke
    
    // Reset composite operation to default for subsequent operations if any
    tempCtx.globalCompositeOperation = 'source-over'; 
    tempCtx.globalAlpha = 1.0;

    const combinedDataUrl = tempCanvas.toDataURL();
    updateLayer(layerId, { dataUrl: combinedDataUrl });
    commitLayerChange(layerId);
  }, [layers, imgRef, updateLayer, commitLayerChange, activeTool]);

  const removeLayerMask = useCallback((id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer || !layer.maskDataUrl) {
      showError("Layer does not have a mask.");
      return;
    }
    
    const updatedLayers = layers.map(l => 
      l.id === id ? { ...l, maskDataUrl: undefined } : l
    );
    updateLayersState(updatedLayers, `Remove Mask from Layer "${layer.name}"`);
    showSuccess(`Mask removed from layer "${layer.name}".`);
  }, [layers, updateLayersState]);

  const invertLayerMask = useCallback(async (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer || !layer.maskDataUrl) {
      showError("Layer does not have a mask to invert.");
      return;
    }
    if (!imageNaturalDimensions) {
      showError("Cannot invert mask without image dimensions.");
      return;
    }

    const toastId = showLoading("Inverting layer mask...");
    try {
      const invertedMaskDataUrl = await invertMaskDataUrl(
        layer.maskDataUrl,
        imageNaturalDimensions.width,
        imageNaturalDimensions.height
      );

      const updatedLayers = layers.map(l => 
        l.id === id ? { ...l, maskDataUrl: invertedMaskDataUrl } : l
      );
      updateLayersState(updatedLayers, `Invert Mask on Layer "${layer.name}"`);
      dismissToast(toastId);
      showSuccess(`Mask inverted on layer "${layer.name}".`);
    } catch (error) {
      console.error("Failed to invert mask:", error);
      dismissToast(toastId);
      showError("Failed to invert mask.");
    }
  }, [layers, updateLayersState, imageNaturalDimensions]);

  const toggleClippingMask = useCallback((id: string) => {
    const layerIndex = layers.findIndex(l => l.id === id);
    const layer = layers[layerIndex];

    if (!layer || layer.type === 'image') {
      showError("The background layer cannot be a clipping mask.");
      return;
    }
    if (layerIndex === 0) {
      showError("Cannot clip mask to the layer below (it's the background).");
      return;
    }

    const updated = layers.map(l => 
      l.id === id ? { ...l, isClippingMask: !l.isClippingMask } : l
    );
    updateLayersState(updated, `Toggle Clipping Mask on Layer "${layer.name}"`);
  }, [layers, updateLayersState]);

  const addAdjustmentLayer = useCallback((adjustmentType: AdjustmentLayerData['type']) => {
    let name: string;
    let adjustmentData: AdjustmentLayerData;

    switch (adjustmentType) {
      case 'brightness':
        name = `Brightness/Contrast ${layers.filter(l => l.type === 'adjustment' && l.adjustmentData?.type === 'brightness').length + 1}`;
        adjustmentData = { type: 'brightness', adjustments: { brightness: 100, contrast: 100, saturation: 100 } };
        break;
      case 'curves':
        name = `Curves ${layers.filter(l => l.type === 'adjustment' && l.adjustmentData?.type === 'curves').length + 1}`;
        adjustmentData = { type: 'curves', curves: initialCurvesState };
        break;
      case 'hsl':
        name = `HSL ${layers.filter(l => l.type === 'adjustment' && l.adjustmentData?.type === 'hsl').length + 1}`;
        adjustmentData = { type: 'hsl', hslAdjustments: { global: { ...initialHslAdjustment }, red: { ...initialHslAdjustment }, orange: { ...initialHslAdjustment }, yellow: { ...initialHslAdjustment }, green: { ...initialHslAdjustment }, aqua: { ...initialHslAdjustment }, blue: { ...initialHslAdjustment }, purple: { ...initialHslAdjustment }, magenta: { ...initialHslAdjustment } } };
        break;
      case 'grading':
        name = `Color Grading ${layers.filter(l => l.type === 'adjustment' && l.adjustmentData?.type === 'grading').length + 1}`;
        adjustmentData = { type: 'grading', grading: { grayscale: 0, sepia: 0, invert: 0 } };
        break;
      default:
        return;
    }

    const newLayer: Layer = {
      id: uuidv4(),
      type: "adjustment",
      name: name,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      adjustmentData: adjustmentData,
      isLocked: false,
    };

    const updated = [...layers, newLayer];
    updateLayersState(updated, `Add Adjustment Layer: ${name}`);
    setSelectedLayerId(newLayer.id);
  }, [layers, updateLayersState, setSelectedLayerId]);

  // Layer creation functions exposed by useLayers
  const addTextLayer = useCallback((coords: { x: number; y: number }, color: string) => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "text",
      name: `Text ${layers.filter((l) => l.type === "text").length + 1}`,
      visible: true,
      content: "New Text",
      x: coords.x,
      y: coords.y,
      fontSize: 48,
      color: color,
      fontFamily: "Roboto",
      opacity: 100,
      blendMode: 'normal',
      fontWeight: "normal",
      textAlign: "center",
      rotation: 0,
      letterSpacing: 0,
      padding: 10,
    };
    const updated = [...layers, newLayer];
    updateLayersState(updated, "Add Text Layer");
    setSelectedLayerId(newLayer.id);
  }, [layers, updateLayersState, setSelectedLayerId]);

  const addDrawingLayer = useCallback(() => {
    if (!imageNaturalDimensions) {
      showError("Cannot add drawing layer without image dimensions.");
      return "";
    }
    const canvas = document.createElement('canvas');
    canvas.width = imageNaturalDimensions.width;
    canvas.height = imageNaturalDimensions.height;
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
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
    };
    const updated = [...layers, newLayer];
    updateLayersState(updated, "Add Drawing Layer");
    setSelectedLayerId(newLayer.id);
    return newLayer.id;
  }, [layers, updateLayersState, setSelectedLayerId, imageNaturalDimensions]);

  const addLayerFromBackground = useCallback(async () => {
    const backgroundLayer = layers.find(l => l.type === 'image' || (l.type === 'drawing' && l.id === 'background'));
    if (!backgroundLayer || !backgroundLayer.dataUrl || !imageNaturalDimensions) {
      showError("No background image loaded to create a layer from.");
      return;
    }

    const toastId = showLoading("Creating layer from background...");
    try {
      // Rasterize the background layer to ensure we capture the current state (if it's a drawing layer)
      const canvas = await rasterizeLayerToCanvas(backgroundLayer, imageNaturalDimensions);
      if (!canvas) throw new Error("Failed to rasterize background.");
      const dataUrl = canvas.toDataURL();

      const newLayer: Layer = {
        id: uuidv4(),
        type: "drawing",
        name: `Layer from Background`,
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        dataUrl: dataUrl,
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        rotation: 0,
      };
      const updated = [...layers, newLayer];
      updateLayersState(updated, "Layer from Background");
      setSelectedLayerId(newLayer.id);
      dismissToast(toastId);
      showSuccess("Layer created from background.");
    } catch (error) {
      dismissToast(toastId);
      showError("Failed to create layer from background.");
    }
  }, [layers, updateLayersState, setSelectedLayerId, imageNaturalDimensions]);

  const addShapeLayer = useCallback((coords: { x: number; y: number }, shapeType: Layer['shapeType'] = 'rect', initialWidth: number = 10, initialHeight: number = 10, fillColor: string, strokeColor: string) => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "vector-shape",
      name: `${shapeType?.charAt(0).toUpperCase() + shapeType?.slice(1) || 'Shape'} ${layers.filter((l) => l.type === "vector-shape").length + 1}`,
      visible: true,
      x: coords.x,
      y: coords.y,
      width: initialWidth,
      height: initialHeight,
      rotation: 0,
      opacity: 100,
      blendMode: 'normal',
      shapeType: shapeType,
      fillColor: fillColor,
      strokeColor: strokeColor,
      strokeWidth: 2,
      borderRadius: 0,
      points: shapeType === 'triangle' ? [{x: 0, y: 100}, {x: 50, y: 0}, {x: 100, y: 100}] : undefined,
    };
    const updated = [...layers, newLayer];
    updateLayersState(updated, "Add Shape Layer");
    setSelectedLayerId(newLayer.id);
  }, [layers, updateLayersState, setSelectedLayerId]);

  const addGradientLayer = useCallback(() => {
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
      gradientType: gradientToolState.type,
      gradientColors: gradientToolState.colors,
      gradientStops: gradientToolState.stops,
      gradientAngle: gradientToolState.angle,
      gradientFeather: gradientToolState.feather,
      gradientInverted: gradientToolState.inverted,
      gradientCenterX: gradientToolState.centerX,
      gradientCenterY: gradientToolState.centerY,
      gradientRadius: gradientToolState.radius,
    };
    const updated = [...layers, newLayer];
    updateLayersState(updated, "Add Gradient Layer");
    setSelectedLayerId(newLayer.id);
  }, [layers, updateLayersState, setSelectedLayerId, gradientToolState]);


  return {
    layers,
    selectedLayerId,
    setSelectedLayerId,
    // Layer manipulation functions (returned by their original names)
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
    moveSelectedLayer,
    groupLayers,
    toggleGroupExpanded,
    removeLayerMask,
    invertLayerMask,
    toggleClippingMask,
    toggleLayerLock,
    renameLayer,
    
    // Layer creation/deletion/duplication functions (aliased for clarity in useEditorState)
    handleAddTextLayer: addTextLayer,
    handleAddDrawingLayer: addDrawingLayer,
    handleAddLayerFromBackground: addLayerFromBackground, // NEW
    handleAddShapeLayer: addShapeLayer,
    handleAddGradientLayer: addGradientLayer,
    addAdjustmentLayer,
    handleDeleteLayer: deleteLayer,
    handleDeleteHiddenLayers: deleteHiddenLayers, // NEW
    handleDuplicateLayer: duplicateLayer,
    handleMergeLayerDown: mergeLayerDown,
    handleRasterizeLayer: rasterizeLayer,
    handleRasterizeSmartObject: rasterizeSmartObject, // NEW
    handleConvertSmartObjectToLayers: convertSmartObjectToLayers, // NEW
    handleExportSmartObjectContents: exportSmartObjectContents, // NEW
    handleArrangeLayer: arrangeLayer, // NEW

    // State/History helpers
    handleToggleVisibility: toggleLayerVisibility,
    handleDrawingStrokeEnd,
    canUndo: currentHistoryIndex > 0,
    canRedo: currentHistoryIndex < history.length - 1,
  };
};