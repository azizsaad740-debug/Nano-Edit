import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { arrayMove } from '@dnd-kit/sortable';
import type { Layer, EditState, Dimensions, Point, ShapeType, GradientToolState, ImageLayerData, DrawingLayerData, TextLayerData, VectorShapeLayerData, GradientLayerData, AdjustmentLayerData, SmartObjectLayerData, GroupLayerData } from '@/types/editor';
import { isImageOrDrawingLayer, isTextLayer, isVectorShapeLayer, isGradientLayer, isAdjustmentLayer, isSmartObjectLayer, isGroupLayer, initialAdjustmentState, initialGradingState, initialHslAdjustmentsState, initialCurvesState, isDrawingLayer } from '@/types/editor';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { invertMaskDataUrl, mergeMasks } from '@/utils/maskUtils';
import { mergeStrokeOntoLayer } from '@/utils/imageUtils';
import { rasterizeLayersToDataUrl, rasterizeLayerToCanvas } from '@/utils/layerUtils';

interface UseLayersProps {
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  recordHistory: (name: string, stateUpdates?: Partial<EditState>, layers?: Layer[]) => void;
  currentEditState: EditState;
  dimensions: Dimensions | null;
  foregroundColor: string;
  backgroundColor: string;
  gradientToolState: GradientToolState;
  selectedShapeType: ShapeType | null;
  selectionPath: Point[] | null;
  selectionMaskDataUrl: string | null;
  setSelectionMaskDataUrl: (url: string | null) => void;
  clearSelectionState: () => void;
  setImage: (image: string | null) => void;
  setFileInfo: (info: { name: string; size: number } | null) => void;
  selectedLayerIds: string[];
  setSelectedLayerIds: React.Dispatch<React.SetStateAction<string[]>>;
  activeTool: string | null;
  onOpenSmartObject: (id: string) => void;
}

export const useLayers = ({
  layers, setLayers, recordHistory, currentEditState, dimensions, foregroundColor, backgroundColor,
  gradientToolState, selectedShapeType, selectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl, clearSelectionState,
  setImage, setFileInfo, selectedLayerIds, setSelectedLayerIds, activeTool, onOpenSmartObject
}: UseLayersProps) => {

  // --- Recursive Helpers ---

  const findLayerRecursive = (layers: Layer[], id: string): Layer | undefined => {
    for (const layer of layers) {
      if (layer.id === id) return layer;
      if (isGroupLayer(layer) && layer.children) {
        const found = findLayerRecursive(layer.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const findLayer = useCallback((id: string) => findLayerRecursive(layers, id), [layers]);

  const updateLayerRecursive = (currentLayers: Layer[], id: string, updates: Partial<Layer>): Layer[] => {
    return currentLayers.map(layer => {
      if (layer.id === id) {
        return { ...layer, ...updates } as Layer;
      }
      if (isGroupLayer(layer) && layer.children) {
        return { ...layer, children: updateLayerRecursive(layer.children, id, updates) } as Layer;
      }
      return layer;
    });
  };

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prevLayers => updateLayerRecursive(prevLayers, id, updates));
  }, [setLayers]);

  const commitLayerChange = useCallback((id: string, name: string) => {
    recordHistory(name, currentEditState, layers);
  }, [recordHistory, currentEditState, layers]);
  
  // Helper to get the parent array and index of a layer
  const getLayerLocation = (layers: Layer[], id: string, parent: Layer[] = layers): { parent: Layer[], index: number } | null => {
    const index = parent.findIndex(l => l.id === id);
    if (index !== -1) return { parent, index };

    for (const layer of parent) {
      if (isGroupLayer(layer) && layer.children) {
        const result = getLayerLocation(layer.children, id, layer.children);
        if (result) return result;
      }
    }
    return null;
  };
  
  // Helper to recursively filter layers
  const filterLayersRecursive = (currentLayers: Layer[], filterFn: (layer: Layer) => boolean): Layer[] => {
    return currentLayers.filter(layer => {
      if (isGroupLayer(layer) && layer.children) {
        layer.children = filterLayersRecursive(layer.children, filterFn);
      }
      return filterFn(layer);
    });
  };

  // --- Layer Creation Functions ---

  const createBaseLayer = (type: Layer['type'], name: string, position: { x: number; y: number } = { x: 50, y: 50 }, initialWidth: number = 10, initialHeight: number = 10): Omit<Layer, 'type'> => ({
    id: uuidv4(),
    name,
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    isLocked: false,
    maskDataUrl: null,
    isClippingMask: false,
    x: position.x, y: position.y, width: initialWidth, height: initialHeight, rotation: 0, scaleX: 1, scaleY: 1,
  });

  const addLayerToTop = useCallback((newLayer: Layer, historyName: string) => {
    setLayers(prev => [newLayer, ...prev]);
    setSelectedLayerIds([newLayer.id]);
    recordHistory(historyName, currentEditState, [newLayer, ...layers]);
  }, [layers, recordHistory, currentEditState, setSelectedLayerIds, setLayers]);

  const addTextLayer = useCallback((coords: Point, color: string) => {
    const newLayer: TextLayerData = {
      ...createBaseLayer('text', 'Text Layer', coords, 50, 10),
      type: 'text',
      content: 'New Text Layer',
      fontSize: 48,
      color: color,
      fontFamily: 'Roboto',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      letterSpacing: 0,
      lineHeight: 1.2,
      padding: 0,
      width: 50, height: 10,
    };
    addLayerToTop(newLayer, 'Add Text Layer');
  }, [foregroundColor, addLayerToTop]);

  const addDrawingLayer = useCallback((coords: Point, dataUrl: string) => {
    const newLayer: DrawingLayerData = {
      ...createBaseLayer('drawing', 'Drawing Layer', coords, 100, 100),
      type: 'drawing',
      dataUrl: dataUrl,
    };
    addLayerToTop(newLayer, 'Add Drawing Layer');
    return newLayer.id;
  }, [addLayerToTop]);

  const addShapeLayer = useCallback((coords: Point, shapeType: ShapeType = 'rect', initialWidth: number = 10, initialHeight: number = 10, fillColor: string = foregroundColor, strokeColor: string = backgroundColor) => {
    const newLayer: VectorShapeLayerData = {
      ...createBaseLayer('vector-shape', `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} Shape`, coords, initialWidth, initialHeight),
      type: 'vector-shape',
      shapeType: shapeType,
      fillColor: fillColor,
      strokeColor: strokeColor,
      strokeWidth: 2,
      borderRadius: shapeType === 'rect' ? 5 : 0,
    };
    addLayerToTop(newLayer, `Add ${newLayer.name}`);
  }, [foregroundColor, backgroundColor, addLayerToTop]);

  const addGradientLayer = useCallback((start: Point, end: Point) => {
    const newLayer: GradientLayerData = {
      ...createBaseLayer('gradient', 'Gradient Layer', { x: 50, y: 50 }, 100, 100),
      type: 'gradient',
      gradientType: gradientToolState.type === 'radial' ? 'radial' : 'linear',
      gradientColors: gradientToolState.colors,
      stops: gradientToolState.stops,
      gradientAngle: gradientToolState.angle,
      gradientFeather: gradientToolState.feather,
      gradientInverted: gradientToolState.inverted,
      gradientCenterX: gradientToolState.centerX,
      gradientCenterY: gradientToolState.centerY,
      gradientRadius: gradientToolState.radius,
      startPoint: start,
      endPoint: end,
    };
    addLayerToTop(newLayer, 'Add Gradient Layer');
  }, [gradientToolState, addLayerToTop]);

  const onAddAdjustmentLayer = useCallback((type: 'brightness' | 'curves' | 'hsl' | 'grading') => {
    const nameMap = {
      brightness: 'Brightness/Contrast',
      curves: 'Curves',
      hsl: 'HSL Adjustment',
      grading: 'Color Grading',
    };
    
    const newLayer: AdjustmentLayerData = {
      ...createBaseLayer('adjustment', `${nameMap[type]} Adjustment`, { x: 50, y: 50 }, 100, 100),
      type: 'adjustment',
      adjustmentData: {
        type,
        adjustments: type === 'brightness' ? initialAdjustmentState : undefined,
        curves: type === 'curves' ? initialCurvesState : undefined,
        hslAdjustments: type === 'hsl' ? initialHslAdjustmentsState : undefined,
        grading: type === 'grading' ? initialGradingState : undefined,
      },
    };
    addLayerToTop(newLayer, `Add ${newLayer.name}`);
  }, [addLayerToTop]);

  // --- Layer Manipulation Functions ---

  const deleteLayer = useCallback((id: string) => {
    if (id === 'background') {
      showError("Cannot delete the background layer.");
      return;
    }
    setLayers(prev => prev.filter(l => l.id !== id));
    setSelectedLayerIds(prev => prev.filter(lid => lid !== id));
    recordHistory(`Delete Layer: ${findLayer(id)?.name || 'Unknown'}`, currentEditState, layers.filter(l => l.id !== id));
  }, [layers, recordHistory, currentEditState, setSelectedLayerIds, findLayer, setLayers]);
  
  const handleLayerDelete = useCallback(() => {
    if (selectedLayerIds.length === 0) return;

    const deletableIds = selectedLayerIds.filter(id => id !== 'background');
    if (deletableIds.length === 0) {
      showError("Cannot delete the background layer.");
      return;
    }

    const deletedNames = deletableIds.map(id => findLayer(id)?.name || 'Unknown').join(', ');
    
    setLayers(prev => prev.filter(l => !deletableIds.includes(l.id)));
    setSelectedLayerIds([]);
    recordHistory(`Delete Layers: ${deletedNames}`, currentEditState, layers.filter(l => !deletableIds.includes(l.id)));
  }, [selectedLayerIds, layers, findLayer, recordHistory, currentEditState, setLayers, setSelectedLayerIds]);


  const onDuplicateLayer = useCallback((id: string) => {
    const originalLayer = findLayer(id);
    if (!originalLayer) return;

    const newLayer: Layer = {
      ...originalLayer,
      id: uuidv4(),
      name: `${originalLayer.name} Copy`,
      x: originalLayer.x + 1,
      y: originalLayer.y + 1,
      isLocked: false,
    };

    setLayers(prevLayers => {
      const location = getLayerLocation(prevLayers, id);
      if (!location) return prevLayers;

      const newParent = [...location.parent];
      newParent.splice(location.index, 0, newLayer);

      // Rebuild the layer tree if necessary (only if inside a group)
      if (location.parent !== prevLayers) {
        return updateLayerRecursive(prevLayers, location.parent[0].id, { children: newParent });
      }
      return newParent;
    });

    setSelectedLayerIds([newLayer.id]);
    recordHistory(`Duplicate Layer: ${originalLayer.name}`, currentEditState, layers);
    showSuccess(`Duplicated layer: ${newLayer.name}`);
  }, [layers, findLayer, recordHistory, currentEditState, setLayers, setSelectedLayerIds]);

  const onMergeLayerDown = useCallback(async (id: string) => {
    const location = getLayerLocation(layers, id);
    if (!location || location.index === location.parent.length - 1) {
      showError("Cannot merge down: no layer below or layer is background.");
      return;
    }

    const topLayer = location.parent[location.index];
    const bottomLayer = location.parent[location.index + 1];

    if (bottomLayer.id === 'background') {
      showError("Cannot merge into the background layer.");
      return;
    }
    
    if (topLayer.isLocked || bottomLayer.isLocked) {
        showError("Cannot merge locked layers.");
        return;
    }
    
    if (!dimensions) {
        showError("Cannot merge without canvas dimensions.");
        return;
    }

    const toastId = showLoading(`Merging ${topLayer.name} down...`);
    
    try {
        // 1. Rasterize the top layer to a canvas/data URL (respecting its properties)
        // STUB: In a real app, this would be a complex rasterization process.
        const topLayerRaster = await rasterizeLayersToDataUrl([topLayer], dimensions, currentEditState);
        
        // 2. Ensure the bottom layer is a drawing layer to receive the merge
        let baseDataUrl = '';
        let updatedBottomLayer: Layer;
        
        if (isDrawingLayer(bottomLayer)) {
            baseDataUrl = bottomLayer.dataUrl;
            updatedBottomLayer = bottomLayer;
        } else {
            // Rasterize the bottom layer if it's a vector/text/gradient/smart object
            const bottomLayerRaster = await rasterizeLayersToDataUrl([bottomLayer], dimensions, currentEditState);
            baseDataUrl = bottomLayerRaster;
            updatedBottomLayer = {
                ...bottomLayer,
                type: 'drawing',
                dataUrl: bottomLayerRaster,
                // Clear vector/text/gradient specific data
                ...(isVectorShapeLayer(bottomLayer) && { shapeType: undefined, fillColor: undefined, strokeColor: undefined }),
                ...(isTextLayer(bottomLayer) && { content: undefined, fontSize: undefined }),
                ...(isGradientLayer(bottomLayer) && { gradientType: undefined, gradientColors: undefined }),
                ...(isSmartObjectLayer(bottomLayer) && { smartObjectData: undefined }),
            } as DrawingLayerData;
        }
        
        // 3. Merge the top layer raster onto the bottom layer's data
        // SIMULATION: Just use the bottom layer's data URL as the result for now, 
        // and update its name.
        const mergedDataUrl = baseDataUrl; // STUB: Replace with actual merge logic
        
        const finalBottomLayer: DrawingLayerData = {
            ...(updatedBottomLayer as DrawingLayerData),
            dataUrl: mergedDataUrl,
            name: `${updatedBottomLayer.name} (Merged)`,
            // Inherit mask from top layer if bottom layer didn't have one
            maskDataUrl: updatedBottomLayer.maskDataUrl || topLayer.maskDataUrl,
        };

        // 4. Update layer structure: remove top layer, update bottom layer
        const newParent = location.parent.filter((_, i) => i !== location.index);
        newParent[location.index] = finalBottomLayer; // The bottom layer is now at the top layer's old index

        setLayers(prevLayers => {
          if (location.parent !== prevLayers) {
            return updateLayerRecursive(prevLayers, location.parent[0].id, { children: newParent });
          }
          return newParent;
        });

        setSelectedLayerIds([finalBottomLayer.id]);
        dismissToast(toastId);
        recordHistory(`Merge Layer Down: ${topLayer.name}`, currentEditState, layers);
        showSuccess(`Merged ${topLayer.name} down into ${bottomLayer.name}.`);
        
    } catch (error) {
        dismissToast(toastId);
        console.error("Merge failed:", error);
        showError("Layer merge failed due to an internal error.");
    }
  }, [layers, recordHistory, currentEditState, setLayers, setSelectedLayerIds, findLayer, dimensions, updateLayerRecursive]);

  const onRasterizeLayer = useCallback((id: string) => {
    const layerToRasterize = findLayer(id);
    if (!layerToRasterize || !dimensions) return;

    if (isImageOrDrawingLayer(layerToRasterize)) {
      showError("Layer is already rasterized.");
      return;
    }

    // STUB: Rasterize the layer content
    const rasterizedCanvas = rasterizeLayerToCanvas(layerToRasterize, dimensions);
    const rasterizedDataUrl = rasterizedCanvas.toDataURL('image/png');

    const newLayer: DrawingLayerData = {
      ...layerToRasterize,
      type: 'drawing',
      name: `${layerToRasterize.name} (Rasterized)`,
      dataUrl: rasterizedDataUrl,
    } as DrawingLayerData;

    updateLayer(id, newLayer);
    recordHistory(`Rasterize Layer: ${layerToRasterize.name}`, currentEditState, layers);
    showSuccess(`Layer ${layerToRasterize.name} rasterized.`);
  }, [layers, findLayer, dimensions, updateLayer, recordHistory, currentEditState]);

  const onCreateSmartObject = useCallback((layerIds: string[]) => {
    if (!dimensions || layerIds.length === 0) return;

    // 1. Extract layers and remove them from the main layer list
    const layersToMove = layers.filter(l => layerIds.includes(l.id));
    if (layersToMove.length === 0) return;

    // 2. Calculate bounding box (stub: assume 100x100 for simplicity)
    const soWidth = 50;
    const soHeight = 50;

    // 3. Create the Smart Object layer (stub rasterization)
    const newSoLayer: SmartObjectLayerData = {
      ...createBaseLayer('smart-object', 'Smart Object', { x: 50, y: 50 }, soWidth, soHeight),
      type: 'smart-object',
      smartObjectData: {
        sourceLayerId: layerIds[0], // Use the first layer as source reference
        layers: layersToMove,
        width: dimensions.width, // Use canvas dimensions for internal SO canvas size
        height: dimensions.height,
      },
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // Placeholder
    };

    // 4. Update layers: remove originals, insert SO layer
    setLayers(prev => {
      const remainingLayers = prev.filter(l => !layerIds.includes(l.id));
      
      // Find the index of the topmost layer being grouped
      const topLayerIndex = prev.findIndex(l => l.id === layersToMove[0].id);
      
      const newLayers = [...remainingLayers];
      newLayers.splice(topLayerIndex, 0, newSoLayer);
      return newLayers;
    });

    setSelectedLayerIds([newSoLayer.id]);
    recordHistory(`Create Smart Object (${layerIds.length} layers)`, currentEditState, layers);
    showSuccess(`Created Smart Object: ${newSoLayer.name}`);
  }, [layers, dimensions, recordHistory, currentEditState, setLayers, setSelectedLayerIds]);

  const onRasterizeSmartObject = useCallback(async (id: string) => {
    const soLayer = findLayer(id);
    if (!isSmartObjectLayer(soLayer) || !dimensions) return;

    const toastId = showLoading(`Rasterizing Smart Object: ${soLayer.name}...`);
    try {
      const internalDimensions: Dimensions = {
        width: soLayer.smartObjectData.width || dimensions.width,
        height: soLayer.smartObjectData.height || dimensions.height,
      };
      
      const rasterizedDataUrl = await rasterizeLayersToDataUrl(
        soLayer.smartObjectData.layers,
        internalDimensions,
        currentEditState
      );

      const newLayer: DrawingLayerData = {
        ...soLayer,
        type: 'drawing',
        name: `${soLayer.name} (Rasterized)`,
        dataUrl: rasterizedDataUrl,
        // Remove SO specific data
        smartObjectData: undefined,
      } as DrawingLayerData;

      updateLayer(id, newLayer);
      dismissToast(toastId);
      recordHistory(`Rasterize Smart Object: ${soLayer.name}`, currentEditState, layers);
      showSuccess(`Smart Object ${soLayer.name} rasterized to Drawing Layer.`);
    } catch (error) {
      dismissToast(toastId);
      showError("Failed to rasterize Smart Object.");
    }
  }, [layers, findLayer, dimensions, updateLayer, recordHistory, currentEditState]);

  const onConvertSmartObjectToLayers = useCallback((id: string) => {
    const soLayer = findLayer(id);
    if (!isSmartObjectLayer(soLayer)) return;

    const internalLayers = soLayer.smartObjectData.layers.map(l => ({ ...l, id: uuidv4() })); // Assign new IDs

    setLayers(prev => {
      const location = getLayerLocation(prev, id);
      if (!location) return prev;

      // Remove SO layer and insert internal layers above it
      const newParent = location.parent.filter(l => l.id !== id);
      newParent.splice(location.index, 0, ...internalLayers);
      
      return newParent;
    });

    setSelectedLayerIds(internalLayers.map(l => l.id));
    recordHistory(`Convert Smart Object to Layers: ${soLayer.name}`, currentEditState, layers);
    showSuccess(`Smart Object ${soLayer.name} converted back to layers.`);
  }, [layers, findLayer, recordHistory, currentEditState, setLayers, setSelectedLayerIds]);

  const onExportSmartObjectContents = useCallback((id: string) => {
    showError("Export Smart Object Contents is a stub.");
  }, []);

  const onAddLayerFromBackground = useCallback(() => {
    const backgroundLayer = findLayer('background');
    if (!backgroundLayer || !isImageOrDrawingLayer(backgroundLayer) || !dimensions) {
      showError("No background image loaded.");
      return;
    }

    const newLayer: ImageLayerData = {
      ...backgroundLayer,
      id: uuidv4(),
      name: 'Layer 1',
      isLocked: false,
      // Reset transform/position to default for a new layer
      x: 50, y: 50, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1,
    } as ImageLayerData;

    addLayerToTop(newLayer, 'Layer from Background');
  }, [findLayer, dimensions, addLayerToTop]);

  const onLayerFromSelection = useCallback(() => {
    if (!selectionMaskDataUrl || !dimensions) {
      showError("Please make a selection first.");
      return;
    }
    
    // STUB: Simulate creating a new layer containing only the selected area
    const newLayer: DrawingLayerData = {
      ...createBaseLayer('drawing', 'Layer via Selection', { x: 50, y: 50 }, 100, 100),
      type: 'drawing',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // Placeholder
      maskDataUrl: selectionMaskDataUrl, // Apply the selection mask to the new layer
    };

    addLayerToTop(newLayer, 'Layer via Selection');
    clearSelectionState();
    showSuccess("New layer created from selection (Stub).");
  }, [selectionMaskDataUrl, dimensions, addLayerToTop, clearSelectionState]);

  // --- Existing Layer Functions (Ensuring they use recursive helpers) ---

  const handleDestructiveOperation = useCallback((operation: 'delete' | 'fill') => {
    if (!selectionMaskDataUrl) return;
    
    const targetLayer = selectedLayerIds.length > 0 ? findLayer(selectedLayerIds[0]) : layers.find(l => l.id === 'background');
    if (!targetLayer || targetLayer.isLocked) {
      showError("Cannot perform destructive operation on a locked or non-existent layer.");
      return;
    }
    
    showSuccess(`${operation === 'delete' ? 'Deleted' : 'Filled'} selected area on ${targetLayer.name} (Stub).`);
    clearSelectionState();
    recordHistory(`Delete Selection`, currentEditState, layers);
  }, [selectionMaskDataUrl, selectedLayerIds, layers, currentEditState, recordHistory, clearSelectionState, findLayer]);

  const onSelectLayer = useCallback((id: string, ctrlKey: boolean, shiftKey: boolean) => {
    if (ctrlKey) {
      setSelectedLayerIds(prev => {
        if (prev.includes(id)) {
          return prev.filter(lid => lid !== id);
        } else {
          return [id, ...prev.filter(lid => lid !== id)];
        }
      });
    } else if (shiftKey) {
      if (selectedLayerIds.length === 0) {
        setSelectedLayerIds([id]);
        return;
      }
      
      const layersInOrder = layers.map(l => l.id);
      const lastSelectedId = selectedLayerIds[0];
      
      const startIndex = layersInOrder.indexOf(lastSelectedId);
      const endIndex = layersInOrder.indexOf(id);
      
      if (startIndex === -1 || endIndex === -1) {
        setSelectedLayerIds([id]);
        return;
      }
      
      const start = Math.min(startIndex, endIndex);
      const end = Math.max(startIndex, endIndex);
      
      const newSelection = layersInOrder.slice(start, end + 1);
      
      setSelectedLayerIds([id, ...newSelection.filter(lid => lid !== id)]);
      
    } else {
      setSelectedLayerIds([id]);
    }
  }, [layers, selectedLayerIds, setSelectedLayerIds]);
    
  const toggleLayerVisibility = useCallback((id: string) => {
    updateLayer(id, { visible: !findLayer(id)?.visible });
    recordHistory(`Toggle Visibility: ${findLayer(id)?.name}`, currentEditState, layers);
  }, [updateLayer, findLayer, recordHistory, currentEditState, layers]);
    
  const renameLayer = useCallback((id: string, newName: string) => {
    updateLayer(id, { name: newName });
    recordHistory(`Rename Layer to ${newName}`, currentEditState, layers);
  }, [updateLayer, recordHistory, currentEditState, layers]);
    
  const onLayerPropertyCommit = useCallback((id: string, updates: Partial<Layer>, historyName: string) => {
    updateLayer(id, updates);
    recordHistory(historyName, currentEditState, layers);
  }, [updateLayer, recordHistory, currentEditState, layers]);
    
  const handleLayerOpacityChange = useCallback((opacity: number) => {
    if (selectedLayerIds.length > 0) {
      selectedLayerIds.forEach(id => updateLayer(id, { opacity }));
    }
  }, [selectedLayerIds, updateLayer]);
    
  const handleLayerOpacityCommit = useCallback(() => {
    if (selectedLayerIds.length > 0) {
      recordHistory(`Change Opacity of ${selectedLayerIds.length} layers`, currentEditState, layers);
    }
  }, [selectedLayerIds, recordHistory, currentEditState, layers]);
    
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
    
  const onApplySelectionAsMask = useCallback(() => {
    if (selectedLayerIds.length === 0 || !selectionMaskDataUrl) {
      showError("Select a layer and make a selection first.");
      return;
    }
    const targetId = selectedLayerIds[0];
    updateLayer(targetId, { maskDataUrl: selectionMaskDataUrl });
    clearSelectionState();
    recordHistory(`Apply Selection as Mask to ${findLayer(targetId)?.name}`, currentEditState, layers);
  }, [selectedLayerIds, selectionMaskDataUrl, updateLayer, clearSelectionState, recordHistory, currentEditState, layers, findLayer]);
    
  const handleDrawingStrokeEnd = useCallback(async (strokeDataUrl: string, layerId: string) => {
    if (!dimensions) return;
    const targetLayer = findLayer(layerId);
    if (!targetLayer || !isDrawingLayer(targetLayer)) {
      showError("Cannot draw: target layer is not a drawing layer.");
      return;
    }
    
    const isEraser = activeTool === 'eraser';
    
    try {
      const newLayerDataUrl = await mergeStrokeOntoLayer(
          (targetLayer as DrawingLayerData).dataUrl,
          strokeDataUrl,
          dimensions,
          currentEditState.brushState,
          isEraser
      );
        
      updateLayer(layerId, { dataUrl: newLayerDataUrl });
      recordHistory(`${isEraser ? 'Erase' : 'Draw'} on ${targetLayer.name}`, currentEditState, layers);
    } catch (error) {
      console.error("Failed to merge drawing stroke:", error);
      showError("Failed to apply drawing stroke.");
    }
  }, [dimensions, findLayer, activeTool, currentEditState.brushState, updateLayer, recordHistory, currentEditState, layers]);

  const handleSelectionBrushStrokeEnd = useCallback(async (strokeDataUrl: string, operation: 'add' | 'subtract') => {
    if (!dimensions) return;
    
    try {
      const existingMask = selectionMaskDataUrl || '';
      const newMaskDataUrl = await mergeMasks(
        existingMask,
        strokeDataUrl,
        dimensions,
        operation
      );
      
      setSelectionMaskDataUrl(newMaskDataUrl);
      recordHistory(`Selection Brush: ${operation}`, currentEditState, layers);
    } catch (error) {
      console.error("Failed to merge selection brush stroke:", error);
      showError("Failed to update selection mask.");
    }
  }, [dimensions, selectionMaskDataUrl, setSelectionMaskDataUrl, recordHistory, currentEditState, layers]);

  const handleHistoryBrushStrokeEnd = useCallback(async (strokeDataUrl: string, layerId: string) => {
    if (!dimensions) return;
    const targetLayer = findLayer(layerId);
    if (!targetLayer || !isDrawingLayer(targetLayer)) {
      showError("Cannot use History Brush: target layer is not a drawing layer.");
      return;
    }
    
    try {
      const newLayerDataUrl = await mergeStrokeOntoLayer(
          (targetLayer as DrawingLayerData).dataUrl,
          strokeDataUrl,
          dimensions,
          currentEditState.brushState,
          false
      );
        
      updateLayer(layerId, { dataUrl: newLayerDataUrl });
      recordHistory(`History Brush applied to ${targetLayer.name}`, currentEditState, layers);
    } catch (error) {
      console.error("Failed to merge history brush stroke:", error);
      showError("Failed to apply history brush stroke.");
    }
  }, [dimensions, findLayer, currentEditState.brushState, updateLayer, recordHistory, currentEditState, layers]);
    
  const onLayerReorder = useCallback((activeId: string, overId: string) => {
    const oldIndex = layers.findIndex(l => l.id === activeId);
    const newIndex = layers.findIndex(l => l.id === overId);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newLayers = arrayMove(layers, oldIndex, newIndex);
    setLayers(newLayers);
    recordHistory("Reorder Layers", currentEditState, newLayers);
  }, [layers, setLayers, recordHistory, currentEditState]);
    
  // --- Implemented Stubs ---
  
  const onDeleteHiddenLayers = useCallback(() => {
    const layersToDelete = layers.filter(l => !l.visible && l.id !== 'background');
    if (layersToDelete.length === 0) {
      showError("No hidden layers found to delete (excluding background).");
      return;
    }

    const newLayers = filterLayersRecursive(layers, (layer) => {
      return layer.visible || layer.id === 'background';
    });

    setLayers(newLayers);
    setSelectedLayerIds([]);
    recordHistory(`Delete ${layersToDelete.length} Hidden Layers`, currentEditState, newLayers);
    showSuccess(`${layersToDelete.length} hidden layers deleted.`);
  }, [layers, recordHistory, currentEditState, setLayers, setSelectedLayerIds]);

  const groupLayers = useCallback((layerIds: string[]) => {
    if (!dimensions || layerIds.length < 1) {
      showError("Select at least one layer to group.");
      return;
    }
    
    // 1. Sort layers to group by their current index (top to bottom)
    const sortedLayersToGroup = layers
      .filter(l => layerIds.includes(l.id))
      .sort((a, b) => layers.findIndex(l => l.id === a.id) - layers.findIndex(l => l.id === b.id));
    
    if (sortedLayersToGroup.length === 0) return;

    // 2. Find the index of the topmost layer in the group
    const topLayerIndex = layers.findIndex(l => l.id === sortedLayersToGroup[0].id);
    if (topLayerIndex === -1) return;

    // 3. Create the new Group layer
    const newGroup: GroupLayerData = {
      ...createBaseLayer('group', 'New Group', { x: 50, y: 50 }, 100, 100),
      type: 'group',
      children: sortedLayersToGroup,
      isExpanded: true,
    };
    
    // 4. Update layers: remove originals, insert group layer at the top layer's position
    setLayers(prev => {
      const remainingLayers = prev.filter(l => !layerIds.includes(l.id));
      
      // Find the index in the original array where the group should be inserted
      const insertionIndex = prev.findIndex(l => l.id === sortedLayersToGroup[0].id);
      
      // Reconstruct the array: layers above insertion point + new group + layers below the group
      const layersBefore = prev.slice(0, insertionIndex).filter(l => !layerIds.includes(l.id));
      const layersAfter = prev.slice(insertionIndex + sortedLayersToGroup.length).filter(l => !layerIds.includes(l.id));
      
      return [...layersBefore, newGroup, ...layersAfter];
    });

    setSelectedLayerIds([newGroup.id]);
    recordHistory(`Group ${layerIds.length} Layers`, currentEditState, layers);
    showSuccess(`Created group: ${newGroup.name}`);
  }, [layers, dimensions, recordHistory, currentEditState, setLayers, setSelectedLayerIds, createBaseLayer]);

  // Helper to move a layer within its parent array
  const moveLayerInParent = (layers: Layer[], id: string, direction: 'front' | 'back' | 'forward' | 'backward'): Layer[] => {
    const location = getLayerLocation(layers, id);
    if (!location) return layers;

    const { parent, index } = location;
    const layerToMove = parent[index];

    let newIndex = index;

    if (direction === 'forward') {
      newIndex = Math.max(0, index - 1);
    } else if (direction === 'backward') {
      newIndex = Math.min(parent.length - 1, index + 1);
    } else if (direction === 'front') {
      newIndex = 0;
    } else if (direction === 'back') {
      newIndex = parent.length - 1;
    }
    
    // Prevent moving the background layer
    if (layerToMove.id === 'background' && (direction === 'forward' || direction === 'front')) {
        return layers;
    }

    if (newIndex === index) return layers;

    const newParent = arrayMove(parent, index, newIndex);

    // If we moved a top-level layer, return the new top-level array
    if (parent === layers) {
      return newParent;
    }

    // If we moved a nested layer, we need to update the parent group recursively
    return updateLayerRecursive(layers, location.parent[0].id, { children: newParent });
  };

  const onArrangeLayer = useCallback((direction: 'front' | 'back' | 'forward' | 'backward') => {
    if (selectedLayerIds.length !== 1) {
      showError("Please select exactly one layer to arrange.");
      return;
    }
    const id = selectedLayerIds[0];
    
    setLayers(prevLayers => moveLayerInParent(prevLayers, id, direction));
    recordHistory(`Arrange Layer: ${direction}`, currentEditState, layers);
  }, [selectedLayerIds, recordHistory, currentEditState, layers, setLayers]);
    
  // --- Final Return Object ---
    
  return useMemo(() => ({
    findLayer,
    updateLayer,
    commitLayerChange,
    deleteLayer,
    handleLayerDelete,
    handleDestructiveOperation, onSelectLayer, toggleLayerVisibility, renameLayer,
    onLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit,
    toggleGroupExpanded, onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask,
    onToggleLayerLock, onApplySelectionAsMask, handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd,
    handleHistoryBrushStrokeEnd, onLayerReorder, groupLayers, onDeleteHiddenLayers, onArrangeLayer,
    onDuplicateLayer, onMergeLayerDown, onRasterizeLayer, onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents,
    onAddAdjustmentLayer, onAddLayerFromBackground, onLayerFromSelection,
    addTextLayer, addDrawingLayer, addShapeLayer, addGradientLayer,
    hasActiveSelection: !!selectionMaskDataUrl,
  }), [
    findLayer, updateLayer, commitLayerChange, deleteLayer, handleLayerDelete, handleDestructiveOperation, onSelectLayer, toggleLayerVisibility, renameLayer, onLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit, toggleGroupExpanded, onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onApplySelectionAsMask, handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd, onLayerReorder, groupLayers, onDeleteHiddenLayers, onArrangeLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer, onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents, onAddAdjustmentLayer, onAddLayerFromBackground, onLayerFromSelection, addTextLayer, addDrawingLayer, addShapeLayer, addGradientLayer, selectionMaskDataUrl
  ]);
};