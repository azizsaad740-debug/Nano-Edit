import { useState, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import { showSuccess, showError } from "@/utils/toast";
import type { Layer, EditState, ActiveTool, Point, BrushState } from "@/types/editor";
import { initialCurvesState, initialHslAdjustment } from "@/types/editor";
import { saveProjectToFile } from "@/utils/projectUtils";
import { rasterizeEditedImageWithMask } from "@/utils/imageUtils"; // FIX 54
import { invertMaskDataUrl, polygonToMaskDataUrl } from "@/utils/maskUtils";
import { maskToPolygon } from "@/utils/maskToPolygon";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils";
import { downloadImage } from "@/utils/imageUtils";

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
  selectedShapeType: Layer['shapeType'] | null;
  selectionMaskDataUrl: string | null;
  clearSelectionState: () => void;
  brushState: BrushState;
  activeTool: ActiveTool | null; // Added activeTool
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
  });
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
      };
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
  selectedShapeType, selectionMaskDataUrl, clearSelectionState,
  brushState, activeTool, // Destructure activeTool
}: UseLayersProps) => {

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
      const newLayer: Layer = {
        ...originalLayer,
        id: uuidv4(),
        name: `${originalLayer.name} Copy`,
        children: originalLayer.type === 'group' && originalLayer.children 
          ? originalLayer.children.map(c => ({ ...c, id: uuidv4() })) // Simple deep copy for children
          : undefined,
      };
      
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
  }, [recordHistory, currentEditState, setSelectedLayerId]);

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

  const handleAddTextLayer = useCallback((coords: { x: number; y: number }, color: string) => {
    const newLayer: Layer = {
      id: uuidv4(),
      type: "text",
      name: `Text ${layers.filter((l) => l.type === "text").length + 1}`,
      visible: true,
      content: "New Text",
      x: coords.x,
      y: coords.y,
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
  }, [layers, recordHistory, currentEditState, foregroundColor, setLayers, setSelectedLayerId]);

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
    const backgroundLayer = layers.find(l => l.id === 'background');
    if (!backgroundLayer || !backgroundLayer.dataUrl) {
      showError("No background image to create layer from.");
      return;
    }

    const newLayer: Layer = {
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


  const handleAddShapeLayer = useCallback((coords: { x: number; y: number }, shapeType: Layer['shapeType'] = 'rect', initialWidth: number = 10, initialHeight: number = 10, fillColor: string, strokeColor: string) => {
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
    const initialData: Partial<Layer> = {};
    let name: string;

    switch (type) {
      case 'brightness':
        initialData.adjustmentData = { type: 'brightness', adjustments: { brightness: 100, contrast: 100, saturation: 100 } };
        name = "Brightness/Contrast";
        break;
      case 'curves':
        initialData.adjustmentData = { type: 'curves', curves: initialCurvesState };
        name = "Curves";
        break;
      case 'hsl':
        initialData.adjustmentData = { type: 'hsl', hslAdjustments: currentEditState.hslAdjustments };
        name = "HSL Adjustment";
        break;
      case 'grading':
        initialData.adjustmentData = { type: 'grading', grading: currentEditState.grading };
        name = "Color Grading";
        break;
    }

    const newLayer: Layer = {
      id: uuidv4(),
      type: "adjustment",
      name: `${name} Layer`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      x: 50, y: 50, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1,
      isLocked: false,
      ...initialData,
    };
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

  const createSmartObject = useCallback((layerIds: string[]) => {
    // Stub: Creating a smart object requires extracting layers and creating a nested structure.
    showError("Creating Smart Objects is currently a stub.");
  }, []);

  const saveSmartObjectChanges = useCallback((updatedLayers: Layer[]) => {
    if (!smartObjectEditingId) return;
    
    updateLayer(smartObjectEditingId, {
      smartObjectData: {
        ...layers.find(l => l.id === smartObjectEditingId)?.smartObjectData,
        layers: updatedLayers,
      } as Layer['smartObjectData'],
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
    // This handler is called by LiveBrushCanvas when a stroke is finished.
    // It merges the new stroke onto the existing layer's dataUrl.
    
    const targetLayer = findLayerLocation(layerId, layers)?.layer;
    if (!targetLayer || !dimensions) return;

    const mergeStroke = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw existing content
      if (targetLayer.dataUrl) {
        const existingImg = new Image();
        await new Promise(resolve => { existingImg.onload = resolve; existingImg.src = targetLayer.dataUrl!; });
        ctx.drawImage(existingImg, 0, 0);
      }

      // 2. Draw new stroke
      const strokeImg = new Image();
      await new Promise(resolve => { strokeImg.onload = resolve; strokeImg.src = strokeDataUrl; });
      
      // Apply composite operation based on tool (eraser uses destination-out)
      if (activeTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      
      ctx.drawImage(strokeImg, 0, 0);
      
      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';

      const newLayerDataUrl = canvas.toDataURL();
      
      updateLayer(layerId, { dataUrl: newLayerDataUrl });
      commitLayerChange(layerId);
    };

    mergeStroke();
  }, [layers, dimensions, activeTool, updateLayer, commitLayerChange]);

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

  // --- Paint Bucket Logic ---
  const handlePaintBucketFill = useCallback(async () => {
    if (activeTool !== 'paintBucket' || !selectionMaskDataUrl || !dimensions) return;

    const targetLayer = layers.find(l => l.id === selectedLayerId);
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

      // 1. Draw existing content (if any)
      if (targetLayer.dataUrl) {
        const existingImg = new Image();
        await new Promise(resolve => { existingImg.onload = resolve; existingImg.src = targetLayer.dataUrl!; });
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
      
      updateLayer(fillLayerId, { dataUrl: newLayerDataUrl });
      commitLayerChange(fillLayerId);
      clearSelectionState();
      showSuccess("Layer filled successfully.");
    };

    fillOperation();
  }, [activeTool, selectionMaskDataUrl, dimensions, layers, selectedLayerId, foregroundColor, updateLayer, commitLayerChange, clearSelectionState]);

  // Watch for selectionMaskDataUrl changes when Paint Bucket is active
  useEffect(() => {
    if (activeTool === 'paintBucket' && selectionMaskDataUrl) {
      handlePaintBucketFill();
    }
  }, [activeTool, selectionMaskDataUrl, handlePaintBucketFill]);


  return {
    smartObjectEditingId: useMemo(() => layers.find(l => l.id === selectedLayerId && l.type === 'smart-object')?.id || null, [layers, selectedLayerId]),
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
    toggleGroupExpanded: useCallback((id: string) => {
      updateLayer(id, { expanded: !findLayerLocation(id, layers)?.layer.expanded });
    }, [updateLayer, layers]),
    handleDrawingStrokeEnd,
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
    handleSelectionBrushStrokeEnd,
  };
};