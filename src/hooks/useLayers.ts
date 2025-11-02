import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import { showError, showSuccess } from "@/utils/toast";
import type { Layer, ActiveTool, BrushState, GradientToolState, ShapeType, GroupLayerData, TextLayerData, DrawingLayerData, VectorShapeLayerData, GradientLayerData, Dimensions, EditState, Point, AdjustmentLayerData } from "@/types/editor";
import { isImageOrDrawingLayer, isTextLayer, isVectorShapeLayer, isDrawingLayer } from "@/types/editor";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils";
import { applyMaskDestructively } from "@/utils/imageUtils";
import { polygonToMaskDataUrl, invertMaskDataUrl, objectSelectToMaskDataUrl, floodFillToMaskDataUrl } from "@/utils/maskUtils";
import { initialCurvesState, initialHslAdjustment, initialGradingState } from "@/types/editor/initialState";

interface UseLayersProps {
  layers: Layer[];
  setLayers: (layers: Layer[]) => void;
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void;
  currentEditState: EditState;
  dimensions: Dimensions | null;
  foregroundColor: string;
  backgroundColor: string;
  gradientToolState: GradientToolState;
  selectedShapeType: ShapeType | null;
  selectionPath: Point[] | null;
  selectionMaskDataUrl: string | null;
  clearSelectionState: () => void;
  setImage: (image: string | null) => void;
  setFileInfo: (info: { name: string; size: number } | null) => void;
  setSelectedLayerId: (id: string | null) => void;
}

export const useLayers = ({
  layers,
  setLayers,
  recordHistory,
  currentEditState,
  dimensions,
  foregroundColor,
  backgroundColor,
  gradientToolState,
  selectedShapeType,
  selectionPath,
  selectionMaskDataUrl,
  clearSelectionState,
  setImage,
  setFileInfo,
  setSelectedLayerId,
}: UseLayersProps) => {
  // Helper function to recursively update a layer
  const recursivelyUpdateLayer = useCallback((currentLayers: Layer[], id: string, updates: Partial<Layer>): Layer[] => {
    return currentLayers.map(layer => {
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
  }, []);

  // Helper function to recursively find a layer's container
  const findLayerContainer = useCallback((id: string, currentLayers: Layer[]): { container: Layer[], index: number } | null => {
    for (let i = 0; i < currentLayers.length; i++) {
      const layer = currentLayers[i];
      if (layer.id === id) {
        return { container: currentLayers, index: i };
      }
      if (layer.type === 'group' && layer.children) {
        const found = findLayerContainer(id, layer.children);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // --- Core Layer Operations ---

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev => recursivelyUpdateLayer(prev, id, updates));
  }, [setLayers, recursivelyUpdateLayer]);

  const commitLayerChange = useCallback((id: string, historyName?: string) => {
    const name = historyName || `Update Layer: ${layers.find(l => l.id === id)?.name || id}`;
    recordHistory(name, currentEditState, layers);
  }, [recordHistory, currentEditState, layers]);

  const handleLayerPropertyCommit = useCallback((id: string, updates: Partial<Layer>, historyName: string) => {
    const updatedLayers = recursivelyUpdateLayer(layers, id, updates);
    setLayers(updatedLayers);
    recordHistory(historyName, currentEditState, updatedLayers);
  }, [recordHistory, currentEditState, layers, recursivelyUpdateLayer, setLayers]);

  const handleLayerOpacityChange = useCallback((opacity: number) => {
    if (selectedLayerId) {
      updateLayer(selectedLayerId, { opacity });
    }
  }, [selectedLayerId, updateLayer]);

  const handleLayerOpacityCommit = useCallback(() => {
    if (selectedLayerId) {
      commitLayerChange(selectedLayerId, `Change Opacity of ${layers.find(l => l.id === selectedLayerId)?.name}`);
    }
  }, [selectedLayerId, commitLayerChange, layers]);

  const toggleLayerVisibility = useCallback((id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer) return;
    const updatedLayers = recursivelyUpdateLayer(layers, id, { visible: !layer.visible });
    setLayers(updatedLayers);
    recordHistory(`Toggle Visibility: ${layer.name}`, currentEditState, updatedLayers);
  }, [layers, recordHistory, currentEditState, recursivelyUpdateLayer, setLayers]);

  const renameLayer = useCallback((id: string, newName: string) => {
    const updatedLayers = recursivelyUpdateLayer(layers, id, { name: newName });
    setLayers(updatedLayers);
    recordHistory(`Rename Layer to ${newName}`, currentEditState, updatedLayers);
  }, [layers, recordHistory, currentEditState, recursivelyUpdateLayer, setLayers]);

  const deleteLayer = useCallback((id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer || layer.type === 'image') return;

    const updatedLayers = layers.filter(l => l.id !== id);
    setLayers(updatedLayers);
    setSelectedLayerId(null);
    recordHistory(`Delete Layer: ${layer.name}`, currentEditState, updatedLayers);
  }, [layers, recordHistory, currentEditState, setLayers, setSelectedLayerId]);

  const onDuplicateLayer = useCallback((id: string) => {
    const layerToDuplicate = layers.find(l => l.id === id);
    if (!layerToDuplicate || layerToDuplicate.type === 'image') return;

    const newLayer: Layer = {
      ...layerToDuplicate,
      id: uuidv4(),
      name: `${layerToDuplicate.name} Copy`,
      isLocked: false,
    };

    const index = layers.findIndex(l => l.id === id);
    const updatedLayers = [...layers.slice(0, index + 1), newLayer, ...layers.slice(index + 1)];
    setLayers(updatedLayers);
    setSelectedLayerId(newLayer.id);
    recordHistory(`Duplicate Layer: ${layerToDuplicate.name}`, currentEditState, updatedLayers);
  }, [layers, recordHistory, currentEditState, setLayers, setSelectedLayerId]);

  const onMergeLayerDown = useCallback((id: string) => {
    // Stub: Merging layers is complex as it requires rasterization of the layer above onto the layer below.
    showError("Layer merging is a complex operation and is currently a stub.");
  }, []);

  const onRasterizeLayer = useCallback((id: string) => {
    // Stub: Rasterizing vector/text layers requires rendering to canvas and replacing the layer with a drawing layer.
    showError("Layer rasterization is currently a stub.");
  }, []);

  const onCreateSmartObject = useCallback((layerIds: string[]) => {
    // Stub: Creating a smart object involves grouping layers and storing their state recursively.
    showError("Creating Smart Object is currently a stub.");
  }, []);

  const onOpenSmartObject = useCallback((id: string) => {
    // Stub: Opening smart object editor requires routing/modal logic.
    showError("Opening Smart Object Editor is currently a stub.");
  }, []);

  const onRasterizeSmartObject = useCallback((id: string) => {
    showError("Rasterizing Smart Object is currently a stub.");
  }, []);

  const onConvertSmartObjectToLayers = useCallback((id: string) => {
    showError("Converting Smart Object to Layers is currently a stub.");
  }, []);

  const onExportSmartObjectContents = useCallback((id: string) => {
    showError("Exporting Smart Object Contents is currently a stub.");
  }, []);

  const onArrangeLayer = useCallback((direction: 'front' | 'back' | 'forward' | 'backward') => {
    showError(`Layer arrangement (${direction}) is currently a stub.`);
  }, []);

  const onToggleLayerLock = useCallback((id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer || layer.type === 'image') return;
    const updatedLayers = recursivelyUpdateLayer(layers, id, { isLocked: !layer.isLocked });
    setLayers(updatedLayers);
    recordHistory(`Toggle Lock: ${layer.name}`, currentEditState, updatedLayers);
  }, [layers, recordHistory, currentEditState, recursivelyUpdateLayer, setLayers]);

  const onDeleteHiddenLayers = useCallback(() => {
    const visibleLayers = layers.filter(l => l.visible);
    if (visibleLayers.length === layers.length) {
      showError("No hidden layers to delete.");
      return;
    }
    setLayers(visibleLayers);
    recordHistory("Delete Hidden Layers", currentEditState, visibleLayers);
    showSuccess("Hidden layers deleted.");
  }, [layers, recordHistory, currentEditState, setLayers]);

  // --- Layer Creation ---

  const addTextLayer = useCallback((coords: Point, color: string) => {
    if (!dimensions) {
      showError("Cannot add layer: No project dimensions defined.");
      return;
    }
    const newLayer: TextLayerData = {
      id: uuidv4(),
      type: "text",
      name: `Text ${layers.filter((l) => l.type === "text").length + 1}`,
      visible: true,
      content: "New Text Layer",
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
      padding: 10,
      lineHeight: 1.2,
      isLocked: false,
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    setSelectedLayerId(newLayer.id);
    recordHistory(`Add Text Layer: ${newLayer.name}`, currentEditState, updated);
  }, [layers, recordHistory, currentEditState, dimensions, setLayers, setSelectedLayerId]);

  const addDrawingLayer = useCallback(() => {
    if (!dimensions) {
      showError("Cannot add layer: No project dimensions defined.");
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
      name: `Layer ${layers.filter((l) => l.type === "drawing").length + 1}`,
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
    setSelectedLayerId(newLayer.id);
    recordHistory(`Add Empty Layer: ${newLayer.name}`, currentEditState, updated);
    return newLayer.id;
  }, [layers, recordHistory, currentEditState, dimensions, setLayers, setSelectedLayerId]);

  const onAddLayerFromBackground = useCallback(() => {
    const backgroundLayer = layers.find(l => l.id === 'background');
    if (!backgroundLayer || !isImageOrDrawingLayer(backgroundLayer) || !backgroundLayer.dataUrl) {
      showError("No background image to duplicate.");
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
      x: 50, y: 50, width: 100, height: 100, rotation: 0,
      scaleX: 1, scaleY: 1,
      isLocked: false,
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    setSelectedLayerId(newLayer.id);
    recordHistory(`Layer from Background`, currentEditState, updated);
  }, [layers, recordHistory, currentEditState, setLayers, setSelectedLayerId]);

  const onLayerFromSelection = useCallback(async () => {
    if (!selectionMaskDataUrl || !dimensions) {
      showError("A selection must be active to create a layer from it.");
      return;
    }
    
    // Stub: This operation requires rasterizing the current visible image, clipping it by the mask,
    // and creating a new layer from the result.
    showError("Creating a layer from selection is currently a stub.");
  }, [selectionMaskDataUrl, dimensions]);

  const addShapeLayer = useCallback((coords: Point, shapeType: ShapeType = 'rect', initialWidth: number = 10, initialHeight: number = 10, fillColor: string, strokeColor: string) => {
    if (!dimensions) {
      showError("Cannot add layer: No project dimensions defined.");
      return;
    }
    
    const newLayer: VectorShapeLayerData = {
      id: uuidv4(),
      type: "vector-shape",
      name: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} ${layers.filter((l) => l.type === "vector-shape").length + 1}`,
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
    setSelectedLayerId(newLayer.id);
    recordHistory(`Add Shape Layer: ${newLayer.name}`, currentEditState, updated);
  }, [layers, recordHistory, currentEditState, dimensions, setLayers, setSelectedLayerId]);

  const addGradientLayer = useCallback(() => {
    if (!dimensions) {
      showError("Cannot add layer: No project dimensions defined.");
      return;
    }
    
    const gradientType: 'linear' | 'radial' = 
      (gradientToolState.type === 'linear' || gradientToolState.type === 'radial') 
        ? gradientToolState.type 
        : 'linear'; // Default to 'linear' if type is unsupported

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
      gradientType: gradientType,
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
    setLayers(updated);
    setSelectedLayerId(newLayer.id);
    recordHistory(`Add Gradient Layer: ${newLayer.name}`, currentEditState, updated);
    return newLayer.id;
  }, [layers, recordHistory, currentEditState, dimensions, gradientToolState, setLayers, setSelectedLayerId]);

  const onAddAdjustmentLayer = useCallback((type: 'brightness' | 'curves' | 'hsl' | 'grading') => {
    if (!dimensions) {
      showError("Cannot add layer: No project dimensions defined.");
      return;
    }
    
    const baseData = {
      brightness: { brightness: 100, contrast: 100, saturation: 100 },
      curves: initialCurvesState,
      hsl: {
        global: { ...initialHslAdjustment },
        red: { ...initialHslAdjustment },
        orange: { ...initialHslAdjustment },
        yellow: { ...initialHslAdjustment },
        green: { ...initialHslAdjustment },
        aqua: { ...initialHslAdjustment },
        blue: { ...initialHslAdjustment },
        purple: { ...initialHslAdjustment },
        magenta: { ...initialHslAdjustment },
      },
      grading: initialGradingState,
    };

    const newLayer: AdjustmentLayerData = {
      id: uuidv4(),
      type: "adjustment",
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Adjustment`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      x: 50, y: 50, width: 100, height: 100, rotation: 0,
      scaleX: 1, scaleY: 1,
      isLocked: false,
      adjustmentData: {
        type: type,
        adjustments: type === 'brightness' ? baseData.brightness : undefined,
        curves: type === 'curves' ? baseData.curves : undefined,
        hslAdjustments: type === 'hsl' ? baseData.hsl : undefined,
        grading: type === 'grading' ? baseData.grading : undefined,
      },
    };

    const updated = [...layers, newLayer];
    setLayers(updated);
    setSelectedLayerId(newLayer.id);
    recordHistory(`Add Adjustment Layer: ${newLayer.name}`, currentEditState, updated);
  }, [layers, recordHistory, currentEditState, dimensions, setLayers, setSelectedLayerId]);

  // --- Masking Operations ---

  const onApplySelectionAsMask = useCallback(async () => {
    if (!selectedLayerId || !selectionMaskDataUrl) {
      showError("A layer must be selected and an active selection must exist.");
      return;
    }
    if (selectedLayerId === 'background') {
      showError("Cannot apply mask to the background layer directly. Use Layer from Background first.");
      return;
    }

    const layer = layers.find(l => l.id === selectedLayerId);
    if (!layer) return;

    updateLayer(selectedLayerId, { maskDataUrl: selectionMaskDataUrl });
    commitLayerChange(selectedLayerId, `Apply Mask to ${layer.name}`);
    clearSelectionState();
    showSuccess("Selection applied as layer mask.");
  }, [selectedLayerId, selectionMaskDataUrl, layers, updateLayer, commitLayerChange, clearSelectionState]);

  const onRemoveLayerMask = useCallback((id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer || !layer.maskDataUrl) return;

    updateLayer(id, { maskDataUrl: undefined });
    commitLayerChange(id, `Remove Mask from ${layer.name}`);
    showSuccess("Layer mask removed.");
  }, [layers, updateLayer, commitLayerChange]);

  const onInvertLayerMask = useCallback(async (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer || !layer.maskDataUrl || !dimensions) {
      showError("Layer must have an active mask.");
      return;
    }

    const invertedMask = await invertMaskDataUrl(layer.maskDataUrl, dimensions.width, dimensions.height);
    updateLayer(id, { maskDataUrl: invertedMask });
    commitLayerChange(id, `Invert Mask on ${layer.name}`);
    showSuccess("Layer mask inverted.");
  }, [layers, dimensions, updateLayer, commitLayerChange]);

  const onToggleClippingMask = useCallback((id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer || layer.type === 'image') return;

    const isClipping = layer.isClippingMask;
    updateLayer(id, { isClippingMask: !isClipping });
    commitLayerChange(id, isClipping ? `Remove Clipping Mask from ${layer.name}` : `Create Clipping Mask on ${layer.name}`);
    showSuccess(isClipping ? "Clipping mask removed." : "Clipping mask created.");
  }, [layers, updateLayer, commitLayerChange]);

  // --- Grouping and Reordering ---

  const groupLayers = useCallback((layerIds: string[]) => {
    if (layerIds.length < 2) {
      showError("Select at least two layers to group.");
      return;
    }
    
    // Filter out layers to be grouped and sort them by their current index (bottom to top)
    const layersToGroup = layers
      .filter(l => layerIds.includes(l.id))
      .sort((a, b) => layers.findIndex(l => l.id === a.id) - layers.findIndex(l => l.id === b.id));

    if (layersToGroup.some(l => l.type === 'image')) {
      showError("Cannot group the Background layer.");
      return;
    }

    const firstIndex = layers.findIndex(l => l.id === layersToGroup[0].id);
    
    const newGroup: GroupLayerData = {
      id: uuidv4(),
      type: 'group',
      name: 'New Group',
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      x: 50, y: 50, width: 100, height: 100, rotation: 0,
      scaleX: 1, scaleY: 1,
      isLocked: false,
      children: layersToGroup,
      expanded: true,
    };

    // Remove grouped layers and insert the new group at the position of the lowest grouped layer
    const updatedLayers = layers.filter(l => !layerIds.includes(l.id));
    updatedLayers.splice(firstIndex, 0, newGroup);

    setLayers(updatedLayers);
    setSelectedLayerId(newGroup.id);
    recordHistory("Group Layers", currentEditState, updatedLayers);
    showSuccess("Layers grouped successfully.");
  }, [layers, recordHistory, currentEditState, setLayers, setSelectedLayerId]);

  const toggleGroupExpanded = useCallback((id: string) => {
    const layer = layers.find(l => l.id === id);
    if (layer && layer.type === 'group') {
      updateLayer(id, { expanded: !layer.expanded });
    }
  }, [layers, updateLayer]);

  const handleReorder = useCallback((activeId: string, overId: string) => {
    const oldIndex = layers.findIndex((l) => l.id === activeId);
    const newIndex = layers.findIndex((l) => l.id === overId);

    if (oldIndex === -1 || newIndex === -1) {
      // Handle reordering within groups (stub)
      showError("Reordering within groups is currently a stub.");
      return;
    }

    // Prevent moving the background layer
    if (layers[oldIndex].type === 'image' || layers[newIndex].type === 'image') {
      showError("Cannot move the Background layer.");
      return;
    }

    const updatedLayers = arrayMove(layers, oldIndex, newIndex);
    setLayers(updatedLayers);
    recordHistory("Reorder Layers", currentEditState, updatedLayers);
  }, [layers, recordHistory, currentEditState, setLayers]);

  // --- Drawing/Stamping/History Brush Logic ---

  const handleDrawingStrokeEnd = useCallback((strokeDataUrl: string, layerId: string) => {
    const targetLayer = layers.find(l => l.id === layerId);
    if (!targetLayer || !isDrawingLayer(targetLayer)) {
      showError("Cannot draw: Target layer is not a drawing layer.");
      return;
    }

    // Stub: In a real app, this would merge the strokeDataUrl onto the targetLayer.dataUrl
    // For now, we just update the dataUrl with the stroke (which is a full canvas image)
    updateLayer(layerId, { dataUrl: strokeDataUrl });
    commitLayerChange(layerId, `Draw on ${targetLayer.name}`);
  }, [layers, updateLayer, commitLayerChange]);

  const handleHistoryBrushStrokeEnd = useCallback((strokeDataUrl: string, layerId: string, historyStateName: string) => {
    // Stub: History brush requires merging the stroke (mask) with the historical image data.
    showError("History brush is a stub.");
  }, []);

  return {
    // Core Layer Management
    layers,
    updateLayer,
    commitLayerChange,
    handleLayerPropertyCommit,
    handleLayerOpacityChange,
    handleLayerOpacityCommit,
    toggleLayerVisibility,
    renameLayer,
    deleteLayer,
    onDuplicateLayer,
    onMergeLayerDown,
    onRasterizeLayer,
    onCreateSmartObject,
    onOpenSmartObject,
    onRasterizeSmartObject,
    onConvertSmartObjectToLayers,
    onExportSmartObjectContents,
    onArrangeLayer,
    onToggleLayerLock,
    onDeleteHiddenLayers,
    // Layer Creation
    addTextLayer,
    addDrawingLayer,
    onAddLayerFromBackground,
    onLayerFromSelection,
    addShapeLayer,
    addGradientLayer,
    onAddAdjustmentLayer,
    // Masking
    onApplySelectionAsMask,
    onRemoveLayerMask,
    onInvertLayerMask,
    onToggleClippingMask,
    // Grouping/Reordering
    groupLayers,
    toggleGroupExpanded,
    handleReorder,
    // Drawing/Brush
    handleDrawingStrokeEnd,
    handleHistoryBrushStrokeEnd,
  };
};