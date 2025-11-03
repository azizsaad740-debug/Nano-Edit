const deleteLayer = useCallback((id: string) => {
    if (id === 'background') {
      showError("Cannot delete the background layer.");
      return;
    }
    setLayers(prev => prev.filter(l => l.id !== id));
    setSelectedLayerIds(prev => prev.filter(lid => lid !== id)); // NEW
    recordHistory(`Delete Layer: ${findLayer(id)?.name || 'Unknown'}`, currentEditState, layers.filter(l => l.id !== id));
  }, [layers, recordHistory, currentEditState, setSelectedLayerIds, findLayer]);
  
  const handleDestructiveOperation = useCallback((operation: 'delete' | 'fill') => {
    if (!selectionMaskDataUrl) return;
    
    const targetLayer = selectedLayerIds.length > 0 ? findLayer(selectedLayerIds[0]) : layers.find(l => l.id === 'background');
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
  }, [selectionMaskDataUrl, selectedLayerIds, layers, currentEditState, recordHistory, clearSelectionState, findLayer]);

  // --- New Layer Selection Logic ---
  const onSelectLayer = useCallback((id: string, ctrlKey: boolean, shiftKey: boolean) => {
    if (ctrlKey) {
      // Ctrl/Cmd + Click: Toggle selection
      setSelectedLayerIds(prev => {
        if (prev.includes(id)) {
          return prev.filter(lid => lid !== id);
        } else {
          // Add to selection, making it the primary selected layer (first in array)
          return [id, ...prev.filter(lid => lid !== id)];
        }
      });
    } else if (shiftKey) {
      // Shift + Click: Range selection
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
      
      // Ensure the clicked layer is the primary selection
      setSelectedLayerIds([id, ...newSelection.filter(lid => lid !== id)]);
      
    } else {
      // Single click: Set selection
      setSelectedLayerIds([id]);
    }
  }, [layers, selectedLayerIds, setSelectedLayerIds]);
  
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
    if (selectedLayerIds.length > 0) {
      selectedLayerIds.forEach(id => updateLayer(id, { opacity }));
    }
  }, [selectedLayerIds, updateLayer]);
  
  const handleLayerOpacityCommit = useCallback(() => {
    if (selectedLayerIds.length > 0) {
      recordHistory(`Change Opacity of ${selectedLayerIds.length} layers`, currentEditState, layers);
    }
  }, [selectedLayerIds, recordHistory, currentEditState, layers]);
  
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
    if (selectedLayerIds.length === 0 || !selectionMaskDataUrl) {
      showError("Select a layer and make a selection first.");
      return;
    }
    // Apply mask to the primary selected layer
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
    
    // FIX 1, 2: Use local activeTool state instead of currentEditState.activeTool
    const isEraser = activeTool === 'eraser';
    
    try {
      const newLayerDataUrl = await mergeStrokeOntoLayer(
        targetLayer.dataUrl,
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
    
    // History brush uses the strokeDataUrl as a mask to reveal the historical image.
    // The LiveBrushCanvas already handles drawing the historical image content onto the strokeDataUrl.
    // We need to merge this stroke (which contains the historical content) onto the current layer.
    
    try {
      const newLayerDataUrl = await mergeStrokeOntoLayer(
        targetLayer.dataUrl,
        strokeDataUrl,
        dimensions,
        currentEditState.brushState,
        false // Not an eraser operation
      );
      
      updateLayer(layerId, { dataUrl: newLayerDataUrl });
      recordHistory(`History Brush applied to ${targetLayer.name}`, currentEditState, layers);
    } catch (error) {
      console.error("Failed to merge history brush stroke:", error);
      showError("Failed to apply history brush stroke.");
    }
  }, [dimensions, findLayer, currentEditState.brushState, updateLayer, recordHistory, currentEditState, layers]);
  
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
    addTextLayer, addDrawingLayer: (coords: Point, dataUrl: string) => { showError("Add Drawing Layer is a stub."); return uuidv4(); }, // Stub implementation for addDrawingLayer
    onAddLayerFromBackground, onLayerFromSelection,
    addShapeLayer, addGradientLayer, onAddAdjustmentLayer, groupLayers, toggleGroupExpanded,
    onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onDeleteHiddenLayers, onArrangeLayer,
    hasActiveSelection: !!selectionMaskDataUrl, onApplySelectionAsMask, handleDestructiveOperation,
    handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd,
    handleReorder,
    findLayer,
    onSelectLayer, // NEW
  };
};