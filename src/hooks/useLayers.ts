import { useState, useCallback, useMemo, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import { showSuccess, showError } from "@/utils/toast";
import type { Layer, EditState, ActiveTool, BrushState, GradientToolState, ShapeType, GroupLayerData, TextLayerData, DrawingLayerData, VectorShapeLayerData, GradientLayerData, ImageLayerData, Point, AdjustmentLayerData, SmartObjectLayerData, HistoryItem } from "@/types/editor";
import { initialCurvesState, initialHslAdjustment } from "@/types/editor";
import { saveProjectToFile } from "@/utils/projectUtils";
import { rasterizeEditedImageWithMask, downloadImage, applyMaskDestructively } from "@/utils/imageUtils";
import { invertMaskDataUrl, polygonToMaskDataUrl } from "@/utils/maskUtils";
import { maskToPolygon } from "@/utils/maskToPolygon";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils";

interface UseLayersProps {
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  dimensions: { width: number; height: number } | null;
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void;
  currentEditState: EditState;
  foregroundColor: string;
  backgroundColor: string;
  selectedShapeType: ShapeType | null;
  selectionMaskDataUrl: string | null;
  setSelectionMaskDataUrl: (url: string | null) => void;
  clearSelectionState: () => void;
  brushState: BrushState;
  activeTool: ActiveTool | null;
  onBrushCommit: () => void;
  history: HistoryItem[]; // ADDED
  currentHistoryIndex: number; // ADDED
  historyBrushSourceIndex: number; // ADDED
}

// Helper function to recursively find a layer and its container/path
interface LayerLocation {
  layer: Layer;
  container: Layer[];
  index: number;
  parentGroups: Layer[];
}

const findLayerLocation = (
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
};

// Helper function to recursively update a layer within the nested structure.
const recursivelyUpdateLayer = (layers: Layer[], id: string, updates: Partial<Layer>): Layer[] => {
  return layers.map(layer => {
    if (layer.id === id) {
      return { ...layer, ...updates };
    }
    if (layer.type === 'group' && layer.children) {
      const newChildren = recursivelyUpdateLayer(layer.children, id, updates);
      if (newChildren !== layer.children) {
        return { ...layer, children: newChildren };
      }
    }
    return layer;
  }) as Layer[];
};

// Helper function to recursively update a nested container (used for reordering/grouping).
const updateNestedContainer = (layers: Layer[], parentIds: string[], newContainer: Layer[]): Layer[] => {
  if (parentIds.length === 0) return newContainer;
  
  const targetId = parentIds[0];
  return layers.map(l => {
    if (l.id === targetId && l.type === 'group' && l.children) {
      return {
        ...l,
        children: updateNestedContainer(l.children, parentIds.slice(1), newContainer),
      } as GroupLayerData;
    }
    return l;
  });
};

// Helper function to recursively get a mutable reference to a nested container.
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


export const useLayers = ({
  layers, setLayers, selectedLayerId, setSelectedLayerId, dimensions,
  recordHistory, currentEditState, foregroundColor, backgroundColor,
  selectedShapeType, selectionMaskDataUrl, setSelectionMaskDataUrl, clearSelectionState,
  brushState, activeTool, onBrushCommit,
  history, currentHistoryIndex, historyBrushSourceIndex, // DESTRUCTURED
}: UseLayersProps) => {
  
  const smartObjectEditingId = useMemo(() => layers.find(l => l.id === selectedLayerId && l.type === 'smart-object')?.id || null, [layers, selectedLayerId]);

  // --- Core Layer Operations ---

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev => recursivelyUpdateLayer(prev, id, updates));
  }, [setLayers]);

  const commitLayerChange = useCallback((id: string) => {
    setLayers(prev => {
      recordHistory(`Edit Layer: ${prev.find(l => l.id === id)?.name || id}`, currentEditState, prev);
      return prev;
    });
  }, [recordHistory, currentEditState]);

  const handleLayerPropertyCommit = useCallback((id: string, updates: Partial<Layer>, historyName: string) => {
    setLayers(prev => {
      const updatedLayers = recursivelyUpdateLayer(prev, id, updates);
      recordHistory(historyName, currentEditState, updatedLayers);
      return updatedLayers;
    });
  }, [recordHistory, currentEditState]);

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

  const handleToggleVisibility = useCallback((id: string) => {
    setLayers(prev => {
      const location = findLayerLocation(id, prev);
      if (!location) return prev;
      const layer = location.layer;
      const updated = recursivelyUpdateLayer(prev, id, { visible: !layer.visible });
      recordHistory(layer.visible ? `Hide Layer: ${layer.name}` : `Show Layer: ${layer.name}`, currentEditState, updated);
      return updated;
    });
  }, [recordHistory, currentEditState]);

  const renameLayer = useCallback((id: string, newName: string) => {
    setLayers(prev => {
      const updated = recursivelyUpdateLayer(prev, id, { name: newName });
      recordHistory(`Rename Layer to ${newName}`, currentEditState, updated);
      return updated;
    });
  }, [recordHistory, currentEditState]);

  const deleteLayer = useCallback((id: string) => {
    setLayers(prev => {
      const location = findLayerLocation(id, prev);
      if (!location) return prev;
      
      const updatedContainer = location.container.filter(l => l.id !== id);
      
      let updatedLayers = prev;
      if (location.parentGroups.length > 0) {
        const parentIds = location.parentGroups.map(g => g.id);
        updatedLayers = updateNestedContainer(prev, parentIds, updatedContainer);
      } else {
        updatedLayers = updatedContainer;
      }

      recordHistory(`Delete Layer: ${location.layer.name}`, currentEditState, updatedLayers);
      if (selectedLayerId === id) setSelectedLayerId(null);
      return updatedLayers;
    });
  }, [recordHistory, currentEditState, selectedLayerId, setSelectedLayerId]);

  const handleLayerDelete = useCallback(() => {
    if (selectedLayerId) {
      deleteLayer(selectedLayerId);
    }
  }, [selectedLayerId, deleteLayer]);

  const duplicateLayer = useCallback((id: string) => {
    setLayers(prev => {
      const location = findLayerLocation(id, prev);
      if (!location) return prev;
      
      const originalLayer = location.layer;
      
      // Helper to recursively duplicate children for groups
      const duplicateChildren = (children: Layer[]): Layer[] => {
        return children.map(child => {
          const newChild: Layer = {
            ...child,
            id: uuidv4(),
            name: `${child.name} Copy`,
          } as Layer;
          
          if (child.type === 'group' && (child as GroupLayerData).children) {
            (newChild as GroupLayerData).children = duplicateChildren((child as GroupLayerData).children);
          }
          return newChild;
        });
      };

      const newLayer: Layer = {
        ...originalLayer,
        id: uuidv4(),
        name: `${originalLayer.name} Copy`,
        ...(originalLayer.type === 'group' && (originalLayer as GroupLayerData).children ? {
          children: duplicateChildren((originalLayer as GroupLayerData).children)
        } : {}),
      } as Layer;
      
      const updatedContainer = [...location.container.slice(0, location.index + 1), newLayer, ...location.container.slice(location.index + 1)];
      
      let updatedLayers = prev;
      if (location.parentGroups.length > 0) {
        const parentIds = location.parentGroups.map(g => g.id);
        updatedLayers = updateNestedContainer(prev, parentIds, updatedContainer);
      } else {
        updatedLayers = updatedContainer;
      }

      recordHistory(`Duplicate Layer: ${originalLayer.name}`, currentEditState, updatedLayers);
      setSelectedLayerId(newLayer.id);
      return updatedLayers;
    });
  }, [layers, selectedLayerId, recordHistory, currentEditState, setSelectedLayerId]);

  const mergeLayerDown = useCallback((id: string) => {
    // Stub: Merging layers is complex as it requires rasterization of the layer above onto the layer below.
    showError("Layer merging is a complex operation and is currently a stub.");
  }, []);

  const rasterizeLayer = useCallback((id: string) => {
    // Stub: Rasterizing vector/text layers requires rendering them to a canvas and replacing the layer with a drawing layer.
    showError("Rasterizing vector/text layers is currently a stub.");
  }, []);

  const reorderLayers = useCallback((activeId: string, overId: string) => {
    setLayers(prev => {
      const activeLocation = findLayerLocation(activeId, prev);
      const overLocation = findLayerLocation(overId, prev);

      if (!activeLocation || !overLocation || activeLocation.layer.isLocked) return prev;

      // Check if they are in the same container
      const activeParentIds = activeLocation.parentGroups.map(g => g.id).join(',');
      const overParentIds = overLocation.parentGroups.map(g => g.id).join(',');

      if (activeParentIds !== overParentIds) {
        showError("Cannot move layers between different groups (yet).");
        return prev;
      }

      const oldIndex = activeLocation.container.findIndex((l) => l.id === activeId);
      const newIndex = activeLocation.container.findIndex((l) => l.id === overId);

      // Reorder the container array
      const updatedContainer = arrayMove(activeLocation.container, oldIndex, newIndex);

      let updatedLayers = prev;
      if (activeLocation.parentGroups.length > 0) {
        const parentIds = activeLocation.parentGroups.map(g => g.id);
        updatedLayers = updateNestedContainer(prev, parentIds, updatedContainer);
      } else {
        updatedLayers = updatedContainer;
      }

      recordHistory("Reorder Layers", currentEditState, updatedLayers);
      return updatedLayers;
    });
  }, [recordHistory, currentEditState]);

  const onSelectLayer = useCallback((id: string, ctrlKey: boolean, shiftKey: boolean) => {
    // Simple selection for now, ignoring multi-select keys
    setSelectedLayerId(id);
  }, [setSelectedLayerId]);

  // --- Layer Creation ---

  const handleAddTextLayer = useCallback((coords: Point, color: string) => {
    const newLayer: TextLayerData = {
      id: uuidv4(),
      type: "text",
      name: `Text ${layers.filter((l) => l.type === "text").length + 1}`,
      visible: true,
      content: "New Text",
      x: (coords.x / (dimensions?.width || 1)) * 100, // Convert pixel X to percentage
      y: (coords.y / (dimensions?.height || 1)) * 100, // Convert pixel Y to percentage
      width: 50,
      height: 10,
      fontSize: 48,
      color: color,
      fontFamily: "Roboto",
      opacity: 100,
      blendMode: 'normal',
      fontWeight: "normal",
      fontStyle: "normal",
      textAlign: "center",
      rotation: 0,
      scaleX: 1, scaleY: 1,
      letterSpacing: 0,
      lineHeight: 1.2,
      isLocked: false,
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    recordHistory("Add Text Layer", currentEditState, updated);
    setSelectedLayerId(newLayer.id);
  }, [layers, recordHistory, currentEditState, dimensions, setLayers, setSelectedLayerId]);

  const handleAddDrawingLayer = useCallback(() => {
    if (!dimensions) {
      showError("Cannot add drawing layer without project dimensions.");
      return "";
    }
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      showError("Failed to create canvas for new drawing layer.");
      return "";
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const transparentDataUrl = canvas.toDataURL();

    const newLayer: DrawingLayerData = {
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
      scaleX: 1, scaleY: 1,
      isLocked: false,
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    recordHistory("Add Drawing Layer", currentEditState, updated);
    setSelectedLayerId(newLayer.id);
    return newLayer.id;
  }, [layers, recordHistory, currentEditState, dimensions, setLayers, setSelectedLayerId]);

  const handleAddLayerFromBackground = useCallback(() => {
    const backgroundLayer = layers.find(l => l.id === 'background') as ImageLayerData | DrawingLayerData | undefined;
    if (!backgroundLayer || !backgroundLayer.dataUrl) {
      showError("No background image to create layer from.");
      return;
    }

    const newLayer: DrawingLayerData = {
      id: uuidv4(),
      type: "drawing",
      name: `Layer from Background`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      dataUrl: backgroundLayer.dataUrl,
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1, scaleY: 1,
      isLocked: false,
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    recordHistory("Layer from Background", currentEditState, updated);
    setSelectedLayerId(newLayer.id);
  }, [layers, recordHistory, currentEditState, setLayers, setSelectedLayerId]);

  const handleLayerFromSelection = useCallback(async () => {
    if (!selectionMaskDataUrl || !dimensions) {
      showError("A selection must be active to create a layer from it.");
      return;
    }
    
    // Stub: In a real app, this would rasterize the selected area of the composite image
    // and create a new layer with that content and the mask applied.
    
    // For now, we create a transparent drawing layer and apply the mask.
    const newLayerId = handleAddDrawingLayer();
    updateLayer(newLayerId, {
      name: "Layer from Selection",
      maskDataUrl: selectionMaskDataUrl,
    });
    commitLayerChange(newLayerId);
    clearSelectionState();
    showSuccess("Layer created from selection (Stub: Content is transparent).");
  }, [selectionMaskDataUrl, dimensions, handleAddDrawingLayer, updateLayer, commitLayerChange, clearSelectionState]);


  const handleAddShapeLayer = useCallback((coords: Point, shapeType: ShapeType = 'rect', initialWidth: number = 10, initialHeight: number = 10, fillColor: string, strokeColor: string) => {
    const newLayer: VectorShapeLayerData = {
      id: uuidv4(),
      type: "vector-shape",
      name: `${shapeType?.charAt(0).toUpperCase() + shapeType?.slice(1) || 'Shape'} ${layers.filter((l) => l.type === "vector-shape").length + 1}`,
      visible: true,
      x: coords.x,
      y: coords.y,
      width: initialWidth,
      height: initialHeight,
      rotation: 0,
      scaleX: 1, scaleY: 1,
      opacity: 100,
      blendMode: 'normal',
      shapeType: shapeType,
      fillColor: fillColor,
      strokeColor: strokeColor,
      strokeWidth: 2,
      borderRadius: 0,
      points: shapeType === 'triangle' ? [{x: 0, y: 100}, {x: 50, y: 0}, {x: 100, y: 100}] : undefined,
      isLocked: false,
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    recordHistory("Add Shape Layer", currentEditState, updated);
    setSelectedLayerId(newLayer.id);
  }, [layers, recordHistory, currentEditState, setLayers, setSelectedLayerId]);

  const handleAddGradientLayer = useCallback(() => {
    const newLayer: GradientLayerData = {
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
      scaleX: 1, scaleY: 1,
      gradientType: 'linear',
      gradientColors: [foregroundColor, backgroundColor],
      gradientStops: [0, 1],
      gradientAngle: 90,
      gradientFeather: 0,
      gradientInverted: false,
      gradientCenterX: 50,
      gradientCenterY: 50,
      gradientRadius: 50,
      isLocked: false,
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    recordHistory("Add Gradient Layer", currentEditState, updated);
    setSelectedLayerId(newLayer.id);
  }, [layers, recordHistory, currentEditState, foregroundColor, backgroundColor, setLayers, setSelectedLayerId]);

  const addAdjustmentLayer = useCallback((type: 'brightness' | 'curves' | 'hsl' | 'grading') => {
    const initialData: Partial<AdjustmentLayerData['adjustmentData']> = {};
    let name: string;

    switch (type) {
      case 'brightness':
        initialData.adjustments = { brightness: 100, contrast: 100, saturation: 100, exposure: 0, gamma: 100, temperature: 0, tint: 0, highlights: 0, shadows: 0, clarity: 0, vibrance: 100, grain: 0 };
        name = "Brightness/Contrast";
        break;
      case 'curves':
        initialData.curves = initialCurvesState;
        name = "Curves";
        break;
      case 'hsl':
        initialData.hslAdjustments = currentEditState.hslAdjustments;
        name = "HSL Adjustment";
        break;
      case 'grading':
        initialData.grading = currentEditState.grading;
        name = "Color Grading";
        break;
    }

    const newLayer: AdjustmentLayerData = {
      id: uuidv4(),
      type: "adjustment",
      name: `${name} Layer`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      x: 50, y: 50, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1,
      isLocked: false,
      adjustmentData: { type, ...initialData },
    } as AdjustmentLayerData;
    const updated = [...layers, newLayer];
    setLayers(updated);
    recordHistory(`Add Adjustment Layer: ${name}`, currentEditState, updated);
    setSelectedLayerId(newLayer.id);
  }, [layers, recordHistory, currentEditState, setLayers, setSelectedLayerId]);

  // --- Grouping / Smart Objects ---

  const groupLayers = useCallback((layerIds: string[]) => {
    // Stub: Grouping layers is complex due to nested structure and reordering logic.
    showError("Grouping layers is currently a stub.");
  }, []);

  const toggleGroupExpanded = useCallback((id: string) => {
    setLayers(prev => {
      const location = findLayerLocation(id, prev);
      if (!location || location.layer.type !== 'group') return prev;
      
      const updated = recursivelyUpdateLayer(prev, id, { expanded: !(location.layer as GroupLayerData).expanded });
      recordHistory(`Toggle Group: ${location.layer.name}`, currentEditState, updated);
      return updated;
    });
  }, [recordHistory, currentEditState]);

  const createSmartObject = useCallback((layerIds: string[]) => {
    // Stub: Creating a smart object requires extracting layers and creating a nested structure.
    showError("Creating Smart Objects is currently a stub.");
  }, []);

  const saveSmartObjectChanges = useCallback((updatedLayers: Layer[]) => {
    if (!smartObjectEditingId) return;
    
    updateLayer(smartObjectEditingId, {
      smartObjectData: {
        ...(layers.find(l => l.id === smartObjectEditingId) as SmartObjectLayerData)?.smartObjectData,
        layers: updatedLayers,
      },
    });
    commitLayerChange(smartObjectEditingId);
    showSuccess("Smart Object saved.");
  }, [smartObjectEditingId, layers, updateLayer, commitLayerChange]);

  const handleRasterizeSmartObject = useCallback((id: string) => {
    showError("Rasterizing Smart Object is currently a stub.");
  }, []);

  const handleConvertSmartObjectToLayers = useCallback((id: string) => {
    showError("Converting Smart Object to Layers is currently a stub.");
  }, []);

  const handleExportSmartObjectContents = useCallback((id: string) => {
    showError("Exporting Smart Object Contents is currently a stub.");
  }, []);

  // --- Masking ---

  const removeLayerMask = useCallback((id: string) => {
    updateLayer(id, { maskDataUrl: undefined });
    handleLayerPropertyCommit(id, {}, "Remove Layer Mask");
  }, [updateLayer, handleLayerPropertyCommit]);

  const invertLayerMask = useCallback(async (id: string) => {
    const layer = findLayerLocation(id, layers)?.layer;
    if (!layer || !layer.maskDataUrl || !dimensions) return;

    try {
      const invertedMask = await invertMaskDataUrl(layer.maskDataUrl, dimensions.width, dimensions.height);
      updateLayer(id, { maskDataUrl: invertedMask });
      handleLayerPropertyCommit(id, {}, "Invert Layer Mask");
    } catch (error) {
      showError("Failed to invert mask.");
    }
  }, [layers, dimensions, updateLayer, handleLayerPropertyCommit]);

  const toggleClippingMask = useCallback((id: string) => {
    const layer = findLayerLocation(id, layers)?.layer;
    if (!layer) return;
    
    updateLayer(id, { isClippingMask: !layer.isClippingMask });
    handleLayerPropertyCommit(id, {}, layer.isClippingMask ? "Remove Clipping Mask" : "Create Clipping Mask");
  }, [layers, updateLayer, handleLayerPropertyCommit]);

  const toggleLayerLock = useCallback((id: string) => {
    const layer = findLayerLocation(id, layers)?.layer;
    if (!layer) return;
    
    updateLayer(id, { isLocked: !layer.isLocked });
    handleLayerPropertyCommit(id, {}, layer.isLocked ? "Unlock Layer" : "Lock Layer");
  }, [layers, updateLayer, handleLayerPropertyCommit]);

  const handleDeleteHiddenLayers = useCallback(() => {
    showError("Deleting hidden layers is currently a stub.");
  }, []);

  const handleArrangeLayer = useCallback((direction: 'front' | 'back' | 'forward' | 'backward') => {
    showError(`Layer arrangement to ${direction} is currently a stub.`);
  }, []);

  // --- Drawing/Brush Handlers ---

  const handleDrawingStrokeEnd = useCallback((strokeDataUrl: string, layerId: string) => {
    // 1. Determine the target layer ID, creating a new one if the selected layer is unsuitable.
    let targetId = layerId;
    const targetLayer = findLayerLocation(layerId, layers)?.layer;
    
    const isDrawable = targetLayer && (targetLayer.type === 'drawing' || targetLayer.id === 'background');

    if (!isDrawable) {
      // If no suitable layer is selected, create a new drawing layer.
      targetId = handleAddDrawingLayer();
      // Note: handleAddDrawingLayer already records history and sets selection.
    }

    // 2. Perform the merge operation on the determined layer.
    const mergeStroke = async () => {
      const finalTargetLayer = findLayerLocation(targetId, layers)?.layer as DrawingLayerData | ImageLayerData | undefined;
      if (!finalTargetLayer || !dimensions) return;

      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw existing content
      if (finalTargetLayer.dataUrl) {
        const existingImg = new Image();
        await new Promise(resolve => { existingImg.onload = resolve; existingImg.src = finalTargetLayer.dataUrl; });
        ctx.drawImage(existingImg, 0, 0);
      }

      // Draw new stroke
      const strokeImg = new Image();
      await new Promise(resolve => { strokeImg.onload = resolve; strokeImg.src = strokeDataUrl; });
      
      // Apply composite operation based on tool (eraser uses destination-out)
      if (activeTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else if (activeTool === 'cloneStamp' || activeTool === 'patternStamp') {
        // Stamp tools already draw sampled pixels, use source-over
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      
      ctx.drawImage(strokeImg, 0, 0);
      
      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';

      const newLayerDataUrl = canvas.toDataURL();
      
      updateLayer(targetId, { dataUrl: newLayerDataUrl, type: 'drawing' }); // Ensure background becomes 'drawing' if modified
      commitLayerChange(targetId);
    };

    mergeStroke();
  }, [layers, dimensions, activeTool, updateLayer, commitLayerChange, handleAddDrawingLayer]);

  const handleSelectionBrushStrokeEnd = useCallback((strokeDataUrl: string, operation: 'add' | 'subtract') => {
    // This handler is called by LiveBrushCanvas when a selection brush stroke is finished.
    // It merges the new stroke onto the existing selection mask.
    
    if (!dimensions) return;

    const mergeMask = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw existing mask
      if (selectionMaskDataUrl) {
        const existingMask = new Image();
        await new Promise(resolve => { existingMask.onload = resolve; existingMask.src = selectionMaskDataUrl; });
        ctx.drawImage(existingMask, 0, 0);
      }

      // 2. Draw new stroke (white for add, black for subtract)
      const strokeImg = new Image();
      await new Promise(resolve => { strokeImg.onload = resolve; strokeImg.src = strokeDataUrl; });
      
      // Use composite operations to merge masks
      if (operation === 'add') {
        ctx.globalCompositeOperation = 'source-over'; // Add white stroke
      } else {
        ctx.globalCompositeOperation = 'destination-out'; // Subtract black stroke
      }
      
      ctx.drawImage(strokeImg, 0, 0);
      
      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';

      const newMaskDataUrl = canvas.toDataURL();
      
      setSelectionMaskDataUrl(newMaskDataUrl);
      recordHistory(`Selection Brush: ${operation}`, currentEditState, layers);
    };

    mergeMask();
  }, [dimensions, selectionMaskDataUrl, setSelectionMaskDataUrl, recordHistory, currentEditState, layers]);

  const handleHistoryBrushStrokeEnd = useCallback((strokeDataUrl: string, layerId: string) => {
    if (!dimensions) return;

    const targetHistoryIndex = historyBrushSourceIndex;
    const targetHistoryState = history[targetHistoryIndex];

    if (!targetHistoryState) {
      showError("Invalid history state selected for brush.");
      return;
    }

    // 1. Rasterize the target history state image
    const rasterizeHistoryImage = async (): Promise<string | null> => {
      // STUB: For simplicity, we assume the historical image is the background layer's dataUrl
      // from that history state, ignoring all other layers/filters for now.
      const historicalBackground = targetHistoryState.layers.find(l => l.id === 'background') as ImageLayerData | DrawingLayerData | undefined;
      return historicalBackground?.dataUrl || null;
      
      // A full implementation would require calling rasterizeEditedImageWithMask with historical state/layers.
    };

    const mergeStroke = async () => {
      const historicalImageSrc = await rasterizeHistoryImage();
      if (!historicalImageSrc) {
        showError("Could not retrieve historical image data.");
        return;
      }
      
      // 2. Determine the target layer (must be drawing or background)
      let targetId = layerId;
      const targetLayer = findLayerLocation(layerId, layers)?.layer;
      const isDrawable = targetLayer && (targetLayer.type === 'drawing' || targetLayer.id === 'background');

      if (!isDrawable) {
        targetId = handleAddDrawingLayer(); // Creates new layer if needed
      }
      
      const finalTargetLayer = findLayerLocation(targetId, layers)?.layer as DrawingLayerData | ImageLayerData | undefined;
      if (!finalTargetLayer) return;

      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 3. Draw existing content (current state of the layer)
      if (finalTargetLayer.dataUrl) {
        const existingImg = new Image();
        await new Promise(resolve => { existingImg.onload = resolve; existingImg.src = finalTargetLayer.dataUrl; });
        ctx.drawImage(existingImg, 0, 0);
      }
      
      // 4. Draw the historical image, clipped by the stroke mask
      const strokeImg = new Image();
      await new Promise(resolve => { strokeImg.onload = resolve; strokeImg.src = strokeDataUrl; });
      
      const historicalImg = new Image();
      await new Promise(resolve => { historicalImg.onload = resolve; historicalImg.src = historicalImageSrc; });

      ctx.save();
      
      // Use the stroke as a clipping mask (destination-in)
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(strokeImg, 0, 0); // Draw the stroke mask (white area)
      ctx.globalCompositeOperation = 'source-in'; // Clip the historical image to the stroke area
      
      // Draw the historical image (which is full canvas size)
      ctx.drawImage(historicalImg, 0, 0, dimensions.width, dimensions.height);
      
      ctx.restore();
      
      const newLayerDataUrl = canvas.toDataURL();
      
      updateLayer(targetId, { dataUrl: newLayerDataUrl, type: 'drawing' });
      commitLayerChange(targetId);
      showSuccess(`History brush applied (Restored pixels from ${targetHistoryState.name}).`);
    };

    mergeStroke();
  }, [dimensions, history, historyBrushSourceIndex, layers, updateLayer, commitLayerChange, handleAddDrawingLayer, recordHistory, currentEditState]);


  // --- Paint Bucket Logic ---
  const handlePaintBucketFill = useCallback(async () => {
    if (activeTool !== 'paintBucket' || !selectionMaskDataUrl || !dimensions) return;

    const targetLayer = layers.find(l => l.id === selectedLayerId);
    
    // Check if targetLayer is a type that can be filled (Drawing, Vector, Gradient, Text, SmartObject, Group)
    if (!targetLayer || targetLayer.type === 'image' || targetLayer.type === 'adjustment') {
      showError("Please select a non-background, non-adjustment layer to fill.");
      clearSelectionState();
      return;
    }

    const fillLayerId = targetLayer.id;

    const fillOperation = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw existing content (only if it's a drawing layer, otherwise we assume vector/text layers handle their own fill properties)
      // We only handle drawing layers here for simplicity in rasterization.
      if (targetLayer.type === 'drawing' && targetLayer.dataUrl) {
        const existingImg = new Image();
        await new Promise(resolve => { existingImg.onload = resolve; existingImg.src = targetLayer.dataUrl; });
        ctx.drawImage(existingImg, 0, 0);
      }

      // 2. Draw the fill color using the mask as a clip
      const maskImg = new Image();
      await new Promise(resolve => { maskImg.onload = resolve; maskImg.src = selectionMaskDataUrl; });

      ctx.save();
      
      // Use the mask to define the area where the fill color should be drawn
      ctx.drawImage(maskImg, 0, 0);
      ctx.globalCompositeOperation = 'source-in'; // Draw new shape only where it overlaps the mask
      
      ctx.fillStyle = foregroundColor;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      
      ctx.restore();
      
      const newLayerDataUrl = canvas.toDataURL();
      
      // Update the layer. If it's a drawing layer, update dataUrl. 
      // If it's not a drawing layer, we create a new drawing layer above it.
      if (targetLayer.type !== 'drawing') {
        const newDrawingLayerId = handleAddDrawingLayer();
        updateLayer(newDrawingLayerId, {
          dataUrl: newLayerDataUrl,
          name: `Fill: ${targetLayer.name}`,
          opacity: 100,
          blendMode: 'normal',
          x: 50, y: 50, width: 100, height: 100, rotation: 0,
          scaleX: 1, scaleY: 1,
        });
        commitLayerChange(newDrawingLayerId);
      } else {
        updateLayer(fillLayerId, { dataUrl: newLayerDataUrl });
        commitLayerChange(fillLayerId);
      }
      
      clearSelectionState();
      showSuccess("Layer filled successfully.");
    };

    fillOperation();
  }, [activeTool, selectionMaskDataUrl, dimensions, layers, selectedLayerId, foregroundColor, updateLayer, commitLayerChange, clearSelectionState, handleAddDrawingLayer]);

  // Watch for selectionMaskDataUrl changes when Paint Bucket is active
  useEffect(() => {
    if (activeTool === 'paintBucket' && selectionMaskDataUrl) {
      handlePaintBucketFill();
    }
  }, [activeTool, selectionMaskDataUrl, handlePaintBucketFill]);

  // --- Destructive Selection Operations (Delete/Fill on Background) ---
  const handleDestructiveOperation = useCallback(async (operation: 'delete' | 'fill') => {
    if (!selectionMaskDataUrl || !dimensions) {
      showError(`A selection must be active to perform ${operation} operation.`);
      return;
    }

    const backgroundLayer = layers.find(l => l.id === 'background') as ImageLayerData | DrawingLayerData | undefined;
    if (!backgroundLayer || !backgroundLayer.dataUrl) {
      showError("No background image found.");
      return;
    }

    try {
      const newBaseDataUrl = await applyMaskDestructively(
        backgroundLayer.dataUrl,
        selectionMaskDataUrl,
        dimensions,
        operation,
        foregroundColor // Use foreground color for fill operation
      );

      // Update the background layer's data URL
      updateLayer('background', { dataUrl: newBaseDataUrl, type: 'drawing' }); // Convert to drawing layer if it was an image layer
      
      // Update the main image state if it was tied to the background layer
      if (backgroundLayer.type === 'image') {
        // Note: This is a simplification. In a real app, we'd need to update the main image state too.
        // For now, we rely on the background layer dataUrl being the source of truth.
      }

      commitLayerChange('background');
      clearSelectionState();
      showSuccess(`Selection ${operation === 'delete' ? 'deleted' : 'filled'} successfully.`);
    } catch (error) {
      console.error(`Destructive ${operation} failed:`, error);
      showError(`Failed to ${operation} selection.`);
    }
  }, [selectionMaskDataUrl, dimensions, layers, updateLayer, commitLayerChange, clearSelectionState, foregroundColor]);


  return {
    smartObjectEditingId,
    openSmartObjectEditor: useCallback((id: string) => { setSelectedLayerId(id); }, [setSelectedLayerId]),
    closeSmartObjectEditor: useCallback(() => { setSelectedLayerId(null); }, [setSelectedLayerId]),
    saveSmartObjectChanges,
    updateLayer,
    commitLayerChange,
    handleLayerPropertyCommit,
    handleLayerOpacityChange,
    handleLayerOpacityCommit,
    handleToggleVisibility,
    renameLayer,
    deleteLayer,
    duplicateLayer,
    mergeLayerDown,
    rasterizeLayer,
    createSmartObject,
    handleAddTextLayer,
    handleAddDrawingLayer,
    handleAddLayerFromBackground,
    handleLayerFromSelection,
    handleAddShapeLayer,
    handleAddGradientLayer,
    addAdjustmentLayer,
    groupLayers,
    toggleGroupExpanded,
    handleDrawingStrokeEnd,
    handleSelectionBrushStrokeEnd,
    handleHistoryBrushStrokeEnd,
    handleLayerDelete,
    reorderLayers,
    onSelectLayer,
    removeLayerMask,
    invertLayerMask,
    toggleClippingMask,
    toggleLayerLock,
    handleDeleteHiddenLayers,
    handleRasterizeSmartObject,
    handleConvertSmartObjectToLayers,
    handleExportSmartObjectContents,
    handleArrangeLayer,
    applySelectionAsMask: useCallback(async () => {
      if (!selectedLayerId || !selectionMaskDataUrl) {
        showError("A layer must be selected and a selection must be active.");
        return;
      }
      updateLayer(selectedLayerId, { maskDataUrl: selectionMaskDataUrl });
      commitLayerChange(selectedLayerId);
      clearSelectionState();
      showSuccess("Selection applied as layer mask.");
    }, [selectedLayerId, selectionMaskDataUrl, updateLayer, commitLayerChange, clearSelectionState]),
    handleDestructiveOperation,
    onBrushCommit,
  };
};