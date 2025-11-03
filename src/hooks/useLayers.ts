import React, { useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { arrayMove } from '@dnd-kit/sortable';
import {
  initialEditState, initialLayerState, isImageOrDrawingLayer, isTextLayer, isVectorShapeLayer, isDrawingLayer,
  type Layer, type ActiveTool, type BrushState, type GradientToolState, type ShapeType, type GroupLayerData,
  type TextLayerData, type DrawingLayerData, type VectorShapeLayerData, type GradientLayerData, type Dimensions,
  type EditState, type Point, type AdjustmentLayerData, type AdjustmentState,
} from '@/types/editor';
import { showSuccess, showError } from '@/utils/toast';
import { invertMaskDataUrl } from '@/utils/maskUtils'; // Import utility

interface UseLayersProps {
    layers: Layer[];
    setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
    recordHistory: (name: string, state: EditState, layers: Layer[]) => void;
    currentEditState: EditState;
    dimensions: Dimensions | null;
    foregroundColor: string;
    backgroundColor: string;
    gradientToolState: GradientToolState;
    selectedShapeType: ShapeType | null;
    selectionPath: Point[] | null;
    selectionMaskDataUrl: string | null;
    setSelectionMaskDataUrl: (dataUrl: string | null) => void;
    clearSelectionState: () => void;
    setImage: (image: string | null) => void;
    setFileInfo: (info: { name: string; size: number } | null) => void;
    setSelectedLayerId: (id: string | null) => void;
    selectedLayerId: string | null;
}

export const useLayers = ({
  layers, setLayers, recordHistory, currentEditState, dimensions, foregroundColor, backgroundColor, gradientToolState, selectedShapeType, selectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl, clearSelectionState, setImage, setFileInfo, setSelectedLayerId, selectedLayerId
}: UseLayersProps) => {
  
  // --- Layer Utility Functions ---
  
  const findLayer = useCallback((id: string, currentLayers: Layer[] = layers): Layer | undefined => {
    for (const layer of currentLayers) {
      if (layer.id === id) return layer;
      if (layer.type === 'group' && layer.children) {
        const found = findLayer(id, layer.children);
        if (found) return found;
      }
    }
    return undefined;
  }, [layers]);

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prevLayers => {
      const updateRecursive = (currentLayers: Layer[]): Layer[] => {
        return currentLayers.map(layer => {
          if (layer.id === id) {
            return { ...layer, ...updates } as Layer;
          }
          if (layer.type === 'group' && layer.children) {
            return { ...layer, children: updateRecursive(layer.children) } as Layer;
          }
          return layer;
        });
      };
      return updateRecursive(prevLayers);
    });
  }, [setLayers]);

  const commitLayerChange = useCallback((id: string, name: string) => {
    recordHistory(name, currentEditState, layers);
  }, [currentEditState, layers, recordHistory]);

  // --- Layer Creation Utilities ---
  
  // Helper to create base layer properties (x, y are expected to be percentages 0-100)
  const createBaseLayer = useCallback((type: Layer['type'], name: string, coords: Point): Omit<Layer, 'type'> => ({
    id: uuidv4(),
    name,
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    isLocked: false,
    maskDataUrl: null,
    isClippingMask: false,
    x: coords.x, y: coords.y, 
    width: 100, height: 100, // Default to full canvas size, adjusted later by specific layer type
    rotation: 0, scaleX: 1, scaleY: 1,
  }), []);

  // --- Layer Creation Implementations ---

  const addTextLayer = useCallback((coords: Point, color: string) => {
    const newLayer: TextLayerData = {
      ...createBaseLayer('text', 'Text Layer', coords),
      type: 'text',
      content: 'New Text',
      fontSize: 48,
      color: color,
      fontFamily: 'Roboto',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      letterSpacing: 0,
      lineHeight: 1.2,
      padding: 0,
      width: 50, height: 10, // Text layers usually have small default size
    };
    setLayers(prev => [newLayer, ...prev]);
    setSelectedLayerId(newLayer.id);
    recordHistory(`Add Text Layer`, currentEditState, [newLayer, ...layers]);
    showSuccess(`Added Text Layer.`);
  }, [createBaseLayer, setLayers, setSelectedLayerId, recordHistory, currentEditState, layers]);

  const addShapeLayer = useCallback((coords: Point, shapeType: ShapeType = 'rect', initialWidth: number = 10, initialHeight: number = 10, fillColor: string = foregroundColor, strokeColor: string = backgroundColor) => {
    const newLayer: VectorShapeLayerData = {
      ...createBaseLayer('vector-shape', `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} Layer`, coords),
      type: 'vector-shape',
      shapeType: shapeType,
      fillColor: fillColor,
      strokeColor: strokeColor,
      strokeWidth: 2,
      borderRadius: shapeType === 'rect' ? 5 : 0,
      width: initialWidth, height: initialHeight,
      x: coords.x, y: coords.y,
      
      // Shape specific defaults
      points: (shapeType === 'triangle') ? [{x: 0, y: 100}, {x: 50, y: 0}, {x: 100, y: 100}] : undefined,
      starPoints: (shapeType === 'star') ? 5 : undefined,
      lineThickness: (shapeType === 'line' || shapeType === 'arrow') ? 5 : undefined,
    };
    
    // Adjust fill/stroke for line/arrow types
    if (shapeType === 'line' || shapeType === 'arrow') {
        newLayer.fillColor = 'none';
        newLayer.strokeWidth = 2;
    }

    setLayers(prev => [newLayer, ...prev]);
    setSelectedLayerId(newLayer.id);
    recordHistory(`Add ${shapeType} Layer`, currentEditState, [newLayer, ...layers]);
    showSuccess(`Added ${shapeType} Layer.`);
  }, [createBaseLayer, foregroundColor, backgroundColor, setLayers, setSelectedLayerId, recordHistory, currentEditState, layers]);

  const addGradientLayer = useCallback((startPoint: Point, endPoint: Point) => {
    if (!dimensions) {
      showError("Cannot add gradient layer without dimensions.");
      return;
    }
    
    // Convert pixel coordinates (startPoint, endPoint) to percentage (0-100)
    const startPercent: Point = { x: (startPoint.x / dimensions.width) * 100, y: (startPoint.y / dimensions.height) * 100 };
    const endPercent: Point = { x: (endPoint.x / dimensions.width) * 100, y: (endPoint.y / dimensions.height) * 100 };
    
    const newLayer: GradientLayerData = {
      ...createBaseLayer('gradient', 'Gradient Layer', { x: 50, y: 50 }), // Center position
      type: 'gradient',
      width: 100, height: 100, // Full canvas size
      
      // Gradient specific properties
      gradientType: gradientToolState.type === 'radial' ? 'radial' : 'linear',
      gradientColors: gradientToolState.colors,
      stops: gradientToolState.stops,
      gradientAngle: gradientToolState.angle,
      gradientFeather: gradientToolState.feather,
      gradientInverted: gradientToolState.inverted,
      gradientCenterX: gradientToolState.centerX,
      gradientCenterY: gradientToolState.centerY,
      gradientRadius: gradientToolState.radius,
      
      startPoint: startPercent,
      endPoint: endPercent,
    };
    
    setLayers(prev => [newLayer, ...prev]);
    setSelectedLayerId(newLayer.id);
    recordHistory(`Add Gradient Layer`, currentEditState, [newLayer, ...layers]);
    showSuccess(`Added Gradient Layer.`);
  }, [dimensions, gradientToolState, createBaseLayer, setLayers, setSelectedLayerId, recordHistory, currentEditState, layers]);

  // --- Layer Actions (Simplified Stubs) ---
  
  const deleteLayer = useCallback((id: string) => {
    if (id === 'background') {
      showError("Cannot delete the background layer.");
      return;
    }
    setLayers(prev => prev.filter(l => l.id !== id));
    setSelectedLayerId(null);
    recordHistory(`Delete Layer: ${findLayer(id)?.name || 'Unknown'}`, currentEditState, layers.filter(l => l.id !== id));
  }, [layers, recordHistory, currentEditState, setSelectedLayerId, findLayer]);
  
  const handleDestructiveOperation = useCallback((operation: 'delete' | 'fill') => {
    if (!selectionMaskDataUrl) return;
    
    const targetLayer = selectedLayerId ? findLayer(selectedLayerId) : layers.find(l => l.id === 'background');
    if (!targetLayer || targetLayer.isLocked) {
      showError("Cannot perform destructive operation on a locked or non-existent layer.");
      return;
    }
    
    // Stub: In a real app, this would involve complex canvas operations:
    // 1. Rasterize the target layer.
    // 2. Apply the mask to the rasterized image (delete or fill).
    // 3. Update the layer's dataUrl.
    
    showSuccess(`${operation === 'delete' ? 'Deleted' : 'Filled'} selected area on ${targetLayer.name} (Stub).`);
    clearSelectionState();
    recordHistory(`${operation === 'delete' ? 'Delete' : 'Fill'} Selection`, currentEditState, layers);
  }, [selectionMaskDataUrl, selectedLayerId, layers, currentEditState, recordHistory, clearSelectionState, findLayer]);

  // --- Other Layer Management Stubs ---
  
  const toggleLayerVisibility = useCallback((id: string) => {
    updateLayer(id, { visible: !findLayer(id)?.visible });
    recordHistory(`Toggle Visibility: ${findLayer(id)?.name}`, currentEditState, layers);
  }, [updateLayer, findLayer, recordHistory, currentEditState, layers]);
  
  const renameLayer = useCallback((id: string, newName: string) => {
    updateLayer(id, { name: newName });
    recordHistory(`Rename Layer to ${newName}`, currentEditState, layers);
  }, [updateLayer, recordHistory, currentEditState, layers]);
  
  const onDuplicateLayer = useCallback((id: string) => {
    showError("Duplicate Layer is a stub.");
  }, []);
  
  const onMergeLayerDown = useCallback((id: string) => {
    showError("Merge Layer Down is a stub.");
  }, []);
  
  const onRasterizeLayer = useCallback((id: string) => {
    showError("Rasterize Layer is a stub.");
  }, []);
  
  const onCreateSmartObject = useCallback((layerIds: string[]) => {
    showError("Create Smart Object is a stub.");
  }, []);
  
  const onOpenSmartObject = useCallback((id: string) => {
    showError("Open Smart Object is a stub.");
  }, []);
  
  const onRasterizeSmartObject = useCallback((id: string) => {
    showError("Rasterize Smart Object is a stub.");
  }, []);
  
  const onConvertSmartObjectToLayers = useCallback((id: string) => {
    showError("Convert Smart Object to Layers is a stub.");
  }, []);
  
  const onExportSmartObjectContents = useCallback((id: string) => {
    showError("Export Smart Object Contents is a stub.");
  }, []);
  
  const onLayerPropertyCommit = useCallback((id: string, updates: Partial<Layer>, historyName: string) => {
    updateLayer(id, updates);
    recordHistory(historyName, currentEditState, layers);
  }, [updateLayer, recordHistory, currentEditState, layers]);
  
  const handleLayerOpacityChange = useCallback((opacity: number) => {
    if (selectedLayerId) {
      updateLayer(selectedLayerId, { opacity });
    }
  }, [selectedLayerId, updateLayer]);
  
  const handleLayerOpacityCommit = useCallback(() => {
    if (selectedLayerId) {
      recordHistory(`Change Opacity of ${findLayer(selectedLayerId)?.name}`, currentEditState, layers);
    }
  }, [selectedLayerId, recordHistory, currentEditState, layers, findLayer]);
  
  const addDrawingLayer = useCallback((coords: Point, dataUrl: string) => {
    showError("Add Drawing Layer is a stub.");
    return uuidv4(); // Return a dummy ID
  }, []);
  
  const onAddLayerFromBackground = useCallback(() => {
    showError("Add Layer From Background is a stub.");
  }, []);
  
  const onLayerFromSelection = useCallback(() => {
    showError("Layer From Selection is a stub.");
  }, []);
  
  const onAddAdjustmentLayer = useCallback((type: 'brightness' | 'curves' | 'hsl' | 'grading') => {
    showError("Add Adjustment Layer is a stub.");
  }, []);
  
  const groupLayers = useCallback((layerIds: string[]) => {
    showError("Group Layers is a stub.");
  }, []);
  
  const toggleGroupExpanded = useCallback((id: string) => {
    updateLayer(id, { isExpanded: !(findLayer(id) as GroupLayerData)?.isExpanded });
  }, [updateLayer, findLayer]);
  
  const onRemoveLayerMask = useCallback((id: string) => {
    updateLayer(id, { maskDataUrl: null });
    recordHistory(`Remove Mask from ${findLayer(id)?.name}`, currentEditState, layers);
  }, [updateLayer, recordHistory, currentEditState, layers, findLayer]);
  
  const onInvertLayerMask = useCallback(async (id: string) => {
    const layerToUpdate = findLayer(id);
    if (!layerToUpdate || !layerToUpdate.maskDataUrl || !dimensions) {
      showError("Cannot invert mask: layer or mask data missing.");
      return;
    }
    
    try {
      const invertedMaskUrl = await invertMaskDataUrl(
        layerToUpdate.maskDataUrl,
        dimensions.width,
        dimensions.height
      );
      updateLayer(id, { maskDataUrl: invertedMaskUrl });
      recordHistory(`Invert Mask on ${layerToUpdate.name}`, currentEditState, layers);
      showSuccess(`Mask inverted on ${layerToUpdate.name}.`);
    } catch (error) {
      console.error("Failed to invert mask:", error);
      showError("Failed to invert layer mask.");
    }
  }, [updateLayer, findLayer, dimensions, recordHistory, currentEditState, layers]);
  
  const onToggleClippingMask = useCallback((id: string) => {
    updateLayer(id, { isClippingMask: !findLayer(id)?.isClippingMask });
    recordHistory(`Toggle Clipping Mask: ${findLayer(id)?.name}`, currentEditState, layers);
  }, [updateLayer, findLayer, recordHistory, currentEditState, layers]);
  
  const onToggleLayerLock = useCallback((id: string) => {
    updateLayer(id, { isLocked: !findLayer(id)?.isLocked });
    recordHistory(`Toggle Lock: ${findLayer(id)?.name}`, currentEditState, layers);
  }, [updateLayer, findLayer, recordHistory, currentEditState, layers]);
  
  const onDeleteHiddenLayers = useCallback(() => {
    showError("Delete Hidden Layers is a stub.");
  }, []);
  
  const onArrangeLayer = useCallback((direction: 'front' | 'back' | 'forward' | 'backward') => {
    showError(`Arrange Layer ${direction} is a stub.`);
  }, []);
  
  const onApplySelectionAsMask = useCallback(() => {
    if (!selectedLayerId || !selectionMaskDataUrl) {
      showError("Select a layer and make a selection first.");
      return;
    }
    updateLayer(selectedLayerId, { maskDataUrl: selectionMaskDataUrl });
    clearSelectionState();
    recordHistory(`Apply Selection as Mask to ${findLayer(selectedLayerId)?.name}`, currentEditState, layers);
  }, [selectedLayerId, selectionMaskDataUrl, updateLayer, clearSelectionState, recordHistory, currentEditState, layers, findLayer]);
  
  const handleDrawingStrokeEnd = useCallback((strokeDataUrl: string, layerId: string) => {
    showError("Drawing stroke end is a stub.");
  }, []);
  
  const handleSelectionBrushStrokeEnd = useCallback((strokeDataUrl: string, operation: 'add' | 'subtract') => {
    showError("Selection brush stroke end is a stub.");
  }, []);
  
  const handleHistoryBrushStrokeEnd = useCallback((strokeDataUrl: string, layerId: string) => {
    showError("History brush stroke end is a stub.");
  }, []);
  
  const handleReorder = useCallback((activeId: string, overId: string) => {
    const oldIndex = layers.findIndex(l => l.id === activeId);
    const newIndex = layers.findIndex(l => l.id === overId);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newLayers = arrayMove(layers, oldIndex, newIndex);
    setLayers(newLayers);
    recordHistory("Reorder Layers", currentEditState, newLayers);
  }, [layers, setLayers, recordHistory, currentEditState]);

  return {
    toggleLayerVisibility, renameLayer, deleteLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
    onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents,
    updateLayer, commitLayerChange, onLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit,
    addTextLayer, addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection,
    addShapeLayer, addGradientLayer, onAddAdjustmentLayer, groupLayers, toggleGroupExpanded,
    onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onDeleteHiddenLayers, onArrangeLayer,
    hasActiveSelection: !!selectionMaskDataUrl, onApplySelectionAsMask, handleDestructiveOperation,
    handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd,
    handleReorder,
    findLayer,
  };
};