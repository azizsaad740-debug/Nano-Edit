"use client";

import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils";
import type { Layer, EditState, Point, GradientToolState, ActiveTool, AdjustmentLayerData, initialCurvesState, initialHslAdjustment } from "./useEditorState";
import { invertMaskDataUrl } from "@/utils/maskUtils";

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
}: UseLayersProps) => {
  const [isSmartObjectEditorOpen, setIsSmartObjectEditorOpen] = useState(false);
  const [smartObjectEditingId, setSmartObjectEditingId] = useState<string | null>(null);

  const updateLayersState = useCallback(
    (newLayers: Layer[], historyName?: string) => {
      setLayers(newLayers, historyName);
    },
    [setLayers]
  );

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
        // TS2554 fix: Removed extraneous 'layer' argument
        const found = findLayerLocation(id, layer.children, [...parentGroups, layer]);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const reorderLayers = useCallback((activeId: string, overId: string, isDroppingIntoGroup: boolean = false) => {
    const activeLocation = findLayerLocation(activeId, layers);
    const overLocation = findLayerLocation(overId, layers);

    if (!activeLocation || !overLocation) {
      showError("Could not find layers for reordering.");
      return;
    }

    const { layer: activeLayer, index: activeIndex, parentGroups: activeParentGroups } = activeLocation;
    const { layer: overLayer, index: overIndex, parentGroups: overParentGroups } = overLocation;

    if (activeLayer.type === 'image') {
      showError("The background layer cannot be moved.");
      return;
    }

    let newLayers = JSON.parse(JSON.stringify(layers)) as Layer[];

    const getMutableContainer = (tree: Layer[], path: Layer[]): Layer[] => {
      let currentContainer = tree;
      for (const group of path) {
        const foundGroup = currentContainer.find(l => l.id === group.id);
        if (foundGroup && foundGroup.type === 'group' && foundGroup.children) {
          currentContainer = foundGroup.children;
        } else {
          console.error("Invalid path in getMutableContainer or group not found.");
          return [];
        }
      }
      return currentContainer;
    };

    const mutableActiveContainer = getMutableContainer(newLayers, activeParentGroups);
    const mutableOverContainer = getMutableContainer(newLayers, overParentGroups);

    const [movedLayer] = mutableActiveContainer.splice(activeIndex, 1);

    let targetContainer: Layer[];
    let targetIndex: number;

    if (isDroppingIntoGroup && overLayer.type === 'group' && overLayer.expanded && overLayer.children) {
      targetContainer = getMutableContainer(newLayers, [...overParentGroups, overLayer]);
      targetIndex = 0;
    } else if (overLayer.type === 'group' && !overLayer.expanded) {
      targetContainer = mutableOverContainer;
      targetIndex = overIndex + 1;
    } else {
      targetContainer = mutableOverContainer;
      targetIndex = overIndex;
    }

    targetContainer.splice(targetIndex, 0, movedLayer);

    updateLayersState(newLayers, `Reorder Layer "${activeLayer.name}"`);
  }, [layers, updateLayersState, findLayerLocation]);

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
      // We need to estimate the layer's bounding box in pixels based on its percentage properties
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
    const smartObjectWidth_px = maxX_px - minX_px;
    const smartObjectHeight_px = maxY_px - minY_px;
    
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

    const groupWidth_px = maxX - minX;
    const groupHeight_px = maxY - minY;
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
        const childX_px = (layer.x ?? 50) / 100 * imageNaturalDimensions.width;
        const childY_px = (layer.y ?? 50) / 100 * imageNaturalDimensions.height;

        const relativeX_px = childX_px - minX;
        const relativeY_px = childY_px - minY;

        return {
          ...layer,
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

  const addTextLayer = useCallback((coords: { x: number; y: number } | undefined, foregroundColor: string) => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "text",
      name: `Text ${layers.filter((l) => l.type === "text").length + 1}`,
      visible: true,
      content: "New Text",
      x: coords?.x ?? 50,
      y: coords?.y ?? 50,
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
      lineHeight: 1.2,
      isLocked: false,
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
    // Fill with transparent black
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
      isLocked: false,
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
  }, [layers, updateLayersState, imageNaturalDimensions, setSelectedLayerId]);

  const addShapeLayer = useCallback((
    coords: { x: number; y: number },
    shapeType: Layer['shapeType'] = 'rect',
    initialWidth: number = 10,
    initialHeight: number = 10,
    foregroundColor: string,
    backgroundColor: string,
  ) => {
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
      fillColor: foregroundColor,
      strokeColor: backgroundColor,
      strokeWidth: 2,
      borderRadius: 0,
      points: shapeType === 'triangle' ? [{x: 0, y: 100}, {x: 50, y: 0}, {x: 100, y: 100}] : undefined,
      isLocked: false,
    };
    const updated = [...layers, newLayer];
    updateLayersState(updated, `Add ${shapeType?.charAt(0).toUpperCase() + shapeType?.slice(1) || 'Shape'} Layer`);
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
      isLocked: false,
    };
    const updated = [...layers, newLayer];
    updateLayersState(updated, "Add Gradient Layer");
    setSelectedLayerId(newLayer.id);
  }, [layers, updateLayersState, gradientToolState, setSelectedLayerId]);

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


  return {
    image,
    imgRef,
    dimensions,
    fileInfo,
    exifData,
    currentState,
    history,
    currentHistoryIndex,
    aspect,
    canUndo,
    canRedo,
    handleFileSelect,
    handleUrlImageLoad,
    handleGeneratedImageLoad,
    handleNewProject,
    handleNewFromClipboard,
    handleSaveProject,
    handleLoadProject,
    handleAdjustmentChange,
    handleAdjustmentCommit,
    handleEffectChange,
    handleEffectCommit,
    handleGradingChange,
    handleGradingCommit,
    handleHslAdjustmentChange,
    handleHslAdjustmentCommit,
    handleChannelChange,
    handleCurvesChange,
    handleCurvesCommit,
    handleFilterChange,
    handleTransformChange,
    handleRotationChange,
    handleRotationCommit,
    handleFramePresetChange,
    handleFramePropertyChange,
    handleFramePropertyCommit,
    pendingCrop,
    setPendingCrop: (crop) => onProjectUpdate({ pendingCrop: crop }),
    applyCrop,
    cancelCrop,
    handleReset,
    handleUndo,
    handleRedo,
    jumpToHistory,
    handleDownload,
    handleCopy,
    setAspect: (aspect) => onProjectUpdate({ aspect }),
    // Layer utilities
    layers,
    selectedLayerId,
    setSelectedLayer: (id) => onProjectUpdate({ selectedLayerId: id }),
    addTextLayer: (coords) => addTextLayer(coords, foregroundColor),
    addDrawingLayer,
    addShapeLayer: (coords, shapeType, initialWidth, initialHeight) => addShapeLayer(coords, shapeType, initialWidth, initialHeight, foregroundColor, backgroundColor),
    addGradientLayer,
    addAdjustmentLayer, // Expose new function
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
    moveSelectedLayer,
    groupLayers,
    toggleGroupExpanded,
    handleDrawingStrokeEnd,
    removeLayerMask,
    invertLayerMask,
    toggleClippingMask,
    toggleLayerLock,
    // Tool state
    activeTool: initialProject.activeTool,
    setActiveTool,
    // Brush state
    brushState,
    setBrushState,
    handleColorPick,
    // Gradient tool state
    gradientToolState,
    setGradientToolState: (state) => onProjectUpdate({ gradientToolState: state }),
    // Generative
    applyGenerativeResult,
    // Selection
    selectionPath,
    setSelectionPath: setSelectionPathAndGenerateMask,
    selectionMaskDataUrl,
    handleSelectionBrushStroke,
    clearSelectionMask,
    applyMaskToSelectionPath,
    convertSelectionPathToMask,
    // Selective Blur
    handleSelectiveBlurStroke,
    handleSelectiveBlurStrengthChange,
    handleSelectiveBlurStrengthCommit,
    // Shape tool
    selectedShapeType,
    setSelectedShapeType: (type) => onProjectUpdate({ selectedShapeType: type }),
    // Foreground/Background Colors
    foregroundColor,
    handleForegroundColorChange,
    backgroundColor,
    handleBackgroundColorChange,
    handleSwapColors,
    // Template loading
    loadTemplateData,
    // Layer Masking
    applySelectionAsMask,
    // Presets & History
    applyPreset, // <-- FIX 5: Ensure applyPreset is exposed
    recordHistory, // <-- FIX 6, 7, 8: Expose recordHistory
    // Fonts
    // These are global and managed in Index.tsx, not per-project state
    systemFonts: [],
    setSystemFonts: () => {},
    customFonts: [],
    setCustomFonts: () => {},
    // Expose loadImageData for Index.tsx template loading logic
    loadImageData,
  };
};