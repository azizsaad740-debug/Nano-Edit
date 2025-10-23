"use client";

import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils";
import type { Layer, EditState, Point, GradientToolState, ActiveTool } from "./useEditorState"; // Import ActiveTool
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
  activeTool: ActiveTool | null; // Added activeTool prop
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
  gradientToolState,
  activeTool, // Destructure activeTool
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
    if (!imageNaturalDimensions) {
      showError("Cannot add drawing layer without image dimensions.");
      return ""; // Return empty string or throw error
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
    const transparentDataUrl = canvas.toDataURL(); // This will be a transparent PNG

    const newLayer: Layer = {
      id: uuidv4(),
      type: "drawing",
      name: `Drawing ${layers.filter((l) => l.type === "drawing").length + 1}`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      dataUrl: transparentDataUrl, // Initialize with transparent image
    };
    const updated = [...layers, newLayer];
    updateLayersState(updated, "Add Drawing Layer");
    setSelectedLayerId(newLayer.id);
    return newLayer.id;
  }, [layers, updateLayersState, imageNaturalDimensions]); // Add imageNaturalDimensions to dependencies

  const addShapeLayer = useCallback((
    coords: { x: number; y: number },
    shapeType: Layer['shapeType'] = 'rect',
    initialWidth?: number,
    initialHeight?: number
  ) => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "vector-shape",
      name: `${shapeType?.charAt(0).toUpperCase() + shapeType?.slice(1) || 'Shape'} ${layers.filter((l) => l.type === "vector-shape").length + 1}`,
      visible: true,
      x: coords.x,
      y: coords.y,
      width: initialWidth ?? 10, // Default width in percentage
      height: initialHeight ?? 10, // Default height in percentage
      rotation: 0,
      opacity: 100,
      blendMode: 'normal',
      shapeType: shapeType,
      fillColor: "#3B82F6", // Default blue fill
      strokeColor: "#FFFFFF", // Default white stroke
      strokeWidth: 2,
      borderRadius: 0, // Default for rect
      points: shapeType === 'triangle' ? [{x: 0, y: 100}, {x: 50, y: 0}, {x: 100, y: 100}] : undefined, // Default points for triangle
    };
    const updated = [...layers, newLayer];
    updateLayersState(updated, `Add ${shapeType?.charAt(0).toUpperCase() + shapeType?.slice(1) || 'Shape'} Layer`);
    setSelectedLayerId(newLayer.id);
  }, [layers, updateLayersState]);

  const addGradientLayer = useCallback((options?: {
    x: number; y: number; width: number; height: number; rotation: number;
    gradientType: Layer['gradientType']; gradientColors: string[]; gradientStops: number[];
    gradientAngle: number; gradientCenterX: number; gradientCenterY: number;
    gradientRadius: number; gradientFeather: number; gradientInverted: boolean;
  }) => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "gradient",
      name: `Gradient ${layers.filter((l) => l.type === "gradient").length + 1}`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      x: options?.x ?? 50,
      y: options?.y ?? 50,
      width: options?.width ?? 100,
      height: options?.height ?? 100,
      rotation: options?.rotation ?? 0,
      gradientType: options?.gradientType ?? gradientToolState.type,
      gradientColors: options?.gradientColors ?? gradientToolState.colors,
      gradientStops: options?.gradientStops ?? gradientToolState.stops,
      gradientAngle: options?.gradientAngle ?? gradientToolState.angle,
      gradientFeather: options?.gradientFeather ?? gradientToolState.feather,
      gradientInverted: options?.gradientInverted ?? gradientToolState.inverted,
      gradientCenterX: options?.gradientCenterX ?? gradientToolState.centerX,
      gradientCenterY: options?.gradientCenterY ?? gradientToolState.centerY,
      gradientRadius: options?.gradientRadius ?? gradientToolState.radius,
    };
    const updated = [...layers, newLayer];
    updateLayersState(updated, "Add Gradient Layer");
    setSelectedLayerId(newLayer.id);
  }, [layers, updateLayersState, gradientToolState]);

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }, []);

  const commitLayerChange = useCallback((id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;
    let action = `Edit Layer "${layer.name}"`;
    if (layer.type === 'drawing') action = 'Brush Stroke';
    if (layer.type === 'vector-shape') action = `Edit Shape "${layer.name}"`;
    if (layer.type === 'gradient') action = `Edit Gradient "${layer.name}"`;
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

    const selectedLayers = layers.filter(layer => layerIds.includes(layer.id));
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    selectedLayers.forEach(layer => {
      if (layer.type === 'text' && layer.x !== undefined && layer.y !== undefined) {
        const fontSize = layer.fontSize || 16;
        const textWidth = (layer.content?.length || 1) * fontSize * 0.6;
        const textHeight = fontSize * 1.2;
        
        const x = (layer.x / 100) * (imageNaturalDimensions?.width || 1000);
        const y = (layer.y / 100) * (imageNaturalDimensions?.height || 1000);
        
        minX = Math.min(minX, x - textWidth / 2);
        minY = Math.min(minY, y - textHeight / 2);
        maxX = Math.max(maxX, x + textWidth / 2);
        maxY = Math.max(maxY, y + textHeight / 2);
      } else if (layer.type === 'drawing' && imgRef.current) {
        minX = Math.min(minX, 0);
        minY = Math.min(minY, 0);
        maxX = Math.max(maxX, imgRef.current.naturalWidth);
        maxY = Math.max(maxY, imgRef.current.naturalHeight);
      } else if (layer.type === 'vector-shape' && layer.x !== undefined && layer.y !== undefined && layer.width !== undefined && layer.height !== undefined) {
        const shapeX = (layer.x / 100) * (imageNaturalDimensions?.width || 1000);
        const shapeY = (layer.y / 100) * (imageNaturalDimensions?.height || 1000);
        const shapeWidth = (layer.width / 100) * (imageNaturalDimensions?.width || 1000);
        const shapeHeight = (layer.height / 100) * (imageNaturalDimensions?.height || 1000);

        minX = Math.min(minX, shapeX - shapeWidth / 2);
        minY = Math.min(minY, shapeY - shapeHeight / 2);
        maxX = Math.max(maxX, shapeX + shapeWidth / 2);
        maxY = Math.max(maxY, shapeY + shapeHeight / 2);
      } else if (layer.type === 'gradient' && layer.x !== undefined && layer.y !== undefined && layer.width !== undefined && layer.height !== undefined) {
        const gradientX = (layer.x / 100) * (imageNaturalDimensions?.width || 1000);
        const gradientY = (layer.y / 100) * (imageNaturalDimensions?.height || 1000);
        const gradientWidth = (layer.width / 100) * (imageNaturalDimensions?.width || 1000);
        const gradientHeight = (layer.height / 100) * (imageNaturalDimensions?.height || 1000);

        minX = Math.min(minX, gradientX - gradientWidth / 2);
        minY = Math.min(minY, gradientY - gradientHeight / 2);
        maxX = Math.max(maxX, gradientX + gradientWidth / 2);
        maxY = Math.max(maxY, gradientY + gradientHeight / 2);
      }
    });
    
    if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
      minX = 0;
      minY = 0;
      maxX = imageNaturalDimensions?.width || 1000;
      maxY = imageNaturalDimensions?.height || 1000;
    }
    
    const width = maxX - minX;
    const height = maxY - minY;
    
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

  const moveSelectedLayer = useCallback((id: string, dx: number, dy: number) => {
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
  }, []);

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
      const layerX_px = (layer.x ?? 50) / 100 * imageNaturalDimensions.width;
      const layerY_px = (layer.y ?? 50) / 100 * imageNaturalDimensions.height;
      let layerWidth_px = (layer.width ?? 10) / 100 * imageNaturalDimensions.width;
      let layerHeight_px = (layer.height ?? 10) / 100 * imageNaturalDimensions.height;

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
        };
      }),
    };

    const updatedLayers = layers
      .filter(layer => !layerIds.includes(layer.id))
      .concat(newGroup);

    updateLayersState(updatedLayers, "Group Layers");
    setSelectedLayerId(newGroup.id);
    showSuccess("Layers grouped successfully.");
  }, [layers, updateLayersState, imageNaturalDimensions, imgRef]);

  const toggleGroupExpanded = useCallback((id: string) => {
    setLayers(prevLayers => prevLayers.map(layer => {
      if (layer.id === id && layer.type === 'group') {
        return { ...layer, expanded: !layer.expanded };
      }
      return layer;
    }));
  }, []);

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
    if (activeTool === 'eraser') { // Use the activeTool prop directly
      tempCtx.globalCompositeOperation = 'destination-out'; // <-- FIX: Use destination-out for erasing
    } else {
      tempCtx.globalCompositeOperation = 'source-over'; // Draw over existing content
    }
    
    tempCtx.drawImage(strokeImg, 0, 0); // Draw the new stroke
    
    // Reset composite operation to default for subsequent operations if any
    tempCtx.globalCompositeOperation = 'source-over'; 
    tempCtx.globalAlpha = 1.0; // Reset global alpha

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


  return {
    layers,
    setLayers,
    selectedLayerId,
    setSelectedLayerId,
    addTextLayer,
    addDrawingLayer,
    addShapeLayer,
    addGradientLayer,
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
  };
};