import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import { showError, showSuccess } from "@/utils/toast";
import type { Layer, ActiveTool, BrushState, GradientToolState, ShapeType, GroupLayerData, TextLayerData, DrawingLayerData, VectorShapeLayerData, GradientLayerData, Dimensions, EditState, Point, AdjustmentLayerData, AdjustmentState } from "@/types/editor";
import { isImageOrDrawingLayer, isTextLayer, isVectorShapeLayer, isDrawingLayer } from "@/types/editor";
import { rasterizeLayerToCanvas, mergeStrokeOntoLayerDataUrl } from "@/utils/layerUtils";
import { applyMaskDestructively } from "@/utils/imageUtils";
import { polygonToMaskDataUrl, invertMaskDataUrl, objectSelectToMaskDataUrl, floodFillToMaskDataUrl, mergeMasks } from "@/utils/maskUtils"; // IMPORT mergeMasks
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
    setSelectionMaskDataUrl: (dataUrl: string | null) => void;
    clearSelectionState: () => void;
    setImage: (image: string | null) => void;
    setFileInfo: (info: { name: string; size: number } | null) => void;
    setSelectedLayerId: (id: string | null) => void;
    selectedLayerId: string | null; // ADDED to props
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
    setSelectionMaskDataUrl,
    clearSelectionState,
    setImage,
    setFileInfo,
    setSelectedLayerId,
    selectedLayerId, // Destructure here
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
        setLayers(prev => recursivelyUpdateLayer(prev as Layer[], id, updates));
    }, [setLayers, recursivelyUpdateLayer]);

    const commitLayerChange = useCallback((id: string, historyName?: string) => {
        const name = historyName || `Update Layer: ${layers.find(l => l.id === id)?.name || id}`;
        recordHistory(name, currentEditState, layers);
    }, [recordHistory, currentEditState, layers]);

    const handleLayerPropertyCommit = useCallback((id: string, updates: Partial<Layer>, historyName?: string) => {
        updateLayer(id, updates);
        commitLayerChange(id, historyName);
    }, [updateLayer, commitLayerChange]);

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

    // --- Brush Stroke Handlers ---

    const handleDrawingStrokeEnd = useCallback(async (strokeDataUrl: string, layerId: string) => {
        const layer = layers.find(l => l.id === layerId);
        if (!layer || !dimensions || !isDrawingLayer(layer)) {
            showError("Cannot draw: target layer is not a drawing layer or dimensions are unknown.");
            return;
        }

        try {
            const newLayerDataUrl = await mergeStrokeOntoLayerDataUrl(
                layer.dataUrl,
                strokeDataUrl,
                dimensions,
                currentEditState.brushState.blendMode // Use blend mode from brush state
            );

            updateLayer(layerId, { dataUrl: newLayerDataUrl });
            commitLayerChange(layerId, `Brush Stroke on ${layer.name}`);
        } catch (error) {
            console.error("Error merging brush stroke:", error);
            showError("Failed to apply brush stroke.");
        }
    }, [layers, dimensions, currentEditState.brushState.blendMode, updateLayer, commitLayerChange]);

    const handleHistoryBrushStrokeEnd = useCallback(async (strokeDataUrl: string, layerId: string) => {
        const targetLayer = layers.find(l => l.id === layerId);
        if (!targetLayer || !dimensions || !isDrawingLayer(targetLayer)) {
            showError("Cannot use History Brush: target layer is not a drawing layer or dimensions are unknown.");
            return;
        }
        
        // 1. Get the historical image source (from the history state)
        const historySourceLayer = currentEditState.history[currentEditState.historyBrushSourceIndex]?.layers.find(l => l.id === layerId) as DrawingLayerData | undefined;
        
        if (!historySourceLayer || !historySourceLayer.dataUrl) {
            showError("History source image not found.");
            return;
        }

        try {
            // 2. Merge the stroke (which is a mask) onto the current layer, using the historical image as the source content.
            // This is complex: we need to draw the current layer, then draw the historical image clipped by the stroke mask.
            
            // For simplicity in this stub, we will merge the historical image onto the current layer, 
            // using the stroke as a mask to reveal the historical state.
            
            const canvas = document.createElement('canvas');
            canvas.width = dimensions.width;
            canvas.height = dimensions.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Canvas context failed.");

            // A. Draw the current layer content
            const currentImg = new Image();
            await new Promise(resolve => { currentImg.onload = resolve; currentImg.src = targetLayer.dataUrl; });
            ctx.drawImage(currentImg, 0, 0);

            // B. Draw the historical image, clipped by the stroke mask
            const historyImg = new Image();
            await new Promise(resolve => { historyImg.onload = resolve; historyImg.src = historySourceLayer.dataUrl; });
            
            const strokeImg = new Image();
            await new Promise(resolve => { strokeImg.onload = resolve; strokeImg.src = strokeDataUrl; });

            // C. Use the stroke as a mask (destination-in) to isolate the area where the historical image should be drawn
            ctx.globalCompositeOperation = 'source-over'; // Reset
            
            // Create a temporary canvas for the historical image clipped by the stroke
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = dimensions.width;
            tempCanvas.height = dimensions.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) throw new Error("Temp canvas context failed.");
            
            // Draw historical image onto temp canvas
            tempCtx.drawImage(historyImg, 0, 0);
            
            // Clip historical image using the stroke mask
            tempCtx.globalCompositeOperation = 'destination-in';
            tempCtx.drawImage(strokeImg, 0, 0);
            
            // D. Draw the result back onto the main canvas (source-over)
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(tempCanvas, 0, 0);
            
            const newLayerDataUrl = canvas.toDataURL();

            updateLayer(layerId, { dataUrl: newLayerDataUrl });
            commitLayerChange(layerId, `History Brush on ${targetLayer.name}`);
        } catch (error) {
            console.error("Error merging history brush stroke:", error);
            showError("Failed to apply history brush stroke.");
        }
    }, [layers, dimensions, currentEditState.history, currentEditState.historyBrushSourceIndex, updateLayer, commitLayerChange]);

    const handleSelectionBrushStrokeEnd = useCallback(async (strokeDataUrl: string, operation: 'add' | 'subtract') => {
        if (!dimensions) {
            showError("Cannot apply selection brush: dimensions unknown.");
            return;
        }
        
        try {
            const newMaskDataUrl = await mergeMasks(
                selectionMaskDataUrl,
                strokeDataUrl,
                dimensions,
                operation
            );
            
            setSelectionMaskDataUrl(newMaskDataUrl);
            showSuccess(`Selection brush stroke applied (${operation}).`);
        } catch (error) {
            console.error("Error merging selection mask:", error);
            showError("Failed to update selection mask.");
        }
    }, [dimensions, selectionMaskDataUrl, setSelectionMaskDataUrl]);

    // --- Layer Creation/Deletion/Manipulation ---
    
    // ... (other layer functions remain the same)

    // --- Layer Creation Functions ---

    const addTextLayer = useCallback((coords: Point, color: string) => {
        const safeLayers = Array.isArray(layers) ? layers : [];
        const newLayer: TextLayerData = {
            id: uuidv4(),
            type: "text",
            name: `Text ${safeLayers.filter((l) => l.type === "text").length + 1}`,
            visible: true,
            content: "New Text Layer",
            x: coords.x / dimensions!.width * 100,
            y: coords.y / dimensions!.height * 100,
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
            scaleX: 1,
            scaleY: 1,
            letterSpacing: 0,
            padding: 10,
            lineHeight: 1.2,
            isLocked: false,
        };
        const updated = [...safeLayers, newLayer];
        setLayers(updated);
        recordHistory(`Add Text Layer: ${newLayer.name}`, currentEditState, updated);
        setSelectedLayerId(newLayer.id);
    }, [layers, recordHistory, currentEditState, dimensions, setSelectedLayerId]);

    const addDrawingLayer = useCallback(() => {
        if (!dimensions) {
            showError("Cannot add layer: dimensions unknown.");
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

        const safeLayers = Array.isArray(layers) ? layers : [];
        const newLayer: DrawingLayerData = {
            id: uuidv4(),
            type: "drawing",
            name: `Layer ${safeLayers.filter((l) => l.type !== "image").length}`,
            visible: true,
            opacity: 100,
            blendMode: 'normal',
            dataUrl: transparentDataUrl,
            x: 50,
            y: 50,
            width: 100,
            height: 100,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            isLocked: false,
        };
        const updated = [...safeLayers, newLayer];
        setLayers(updated);
        recordHistory(`Add Drawing Layer: ${newLayer.name}`, currentEditState, updated);
        setSelectedLayerId(newLayer.id);
        return newLayer.id;
    }, [layers, recordHistory, currentEditState, dimensions, setSelectedLayerId]);

    const onAddLayerFromBackground = useCallback(() => {
        const backgroundLayer = layers.find(l => l.id === 'background');
        if (!backgroundLayer || !isImageOrDrawingLayer(backgroundLayer) || !backgroundLayer.dataUrl) {
            showError("No background image found.");
            return;
        }

        const safeLayers = Array.isArray(layers) ? layers : [];
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
            scaleX: 1,
            scaleY: 1,
            isLocked: false,
        };
        const updated = [...safeLayers, newLayer];
        setLayers(updated);
        recordHistory(`Layer from Background`, currentEditState, updated);
        setSelectedLayerId(newLayer.id);
        showSuccess("New layer created from background content.");
    }, [layers, recordHistory, currentEditState, setSelectedLayerId]);

    const onLayerFromSelection = useCallback(async () => {
        if (!dimensions || !selectionMaskDataUrl) {
            showError("A selection must be active to create a layer from it.");
            return;
        }
        
        const backgroundLayer = layers.find(l => l.id === 'background');
        if (!backgroundLayer || !isImageOrDrawingLayer(backgroundLayer) || !backgroundLayer.dataUrl) {
            showError("Background image is required for this operation.");
            return;
        }

        try {
            // 1. Create a new layer containing only the selected area of the background
            const canvas = document.createElement('canvas');
            canvas.width = dimensions.width;
            canvas.height = dimensions.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Canvas context failed.");

            const bgImg = new Image();
            await new Promise(resolve => { bgImg.onload = resolve; bgImg.src = backgroundLayer.dataUrl; });
            
            const maskImg = new Image();
            await new Promise(resolve => { maskImg.onload = resolve; maskImg.src = selectionMaskDataUrl; });

            // Draw background image
            ctx.drawImage(bgImg, 0, 0);
            
            // Clip by mask (destination-in)
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(maskImg, 0, 0);
            
            const newLayerDataUrl = canvas.toDataURL();
            
            // 2. Create the new layer
            const safeLayers = Array.isArray(layers) ? layers : [];
            const newLayer: DrawingLayerData = {
                id: uuidv4(),
                type: "drawing",
                name: `Layer from Selection`,
                visible: true,
                opacity: 100,
                blendMode: 'normal',
                dataUrl: newLayerDataUrl,
                x: 50,
                y: 50,
                width: 100,
                height: 100,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                isLocked: false,
            };
            const updated = [...safeLayers, newLayer];
            setLayers(updated);
            recordHistory(`Layer from Selection`, currentEditState, updated);
            setSelectedLayerId(newLayer.id);
            clearSelectionState();
            showSuccess("New layer created from selection.");

        } catch (error) {
            console.error("Error creating layer from selection:", error);
            showError("Failed to create layer from selection.");
        }
    }, [layers, dimensions, selectionMaskDataUrl, clearSelectionState, recordHistory, currentEditState, setSelectedLayerId]);

    const addShapeLayer = useCallback((coords: Point, shapeType: ShapeType = 'rect', initialWidth: number = 10, initialHeight: number = 10, fillColor: string = foregroundColor, strokeColor: string = backgroundColor) => {
        const safeLayers = Array.isArray(layers) ? layers : [];
        const newLayer: VectorShapeLayerData = {
            id: uuidv4(),
            type: "vector-shape",
            name: `${shapeType?.charAt(0).toUpperCase() + shapeType?.slice(1) || 'Shape'} ${safeLayers.filter((l) => l.type === "vector-shape").length + 1}`,
            visible: true,
            x: coords.x / dimensions!.width * 100,
            y: coords.y / dimensions!.height * 100,
            width: initialWidth,
            height: initialHeight,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
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
        const updated = [...safeLayers, newLayer];
        setLayers(updated);
        recordHistory(`Add Shape Layer: ${newLayer.name}`, currentEditState, updated);
        setSelectedLayerId(newLayer.id);
    }, [layers, recordHistory, currentEditState, dimensions, foregroundColor, backgroundColor, setSelectedLayerId]);

    const addGradientLayer = useCallback(() => {
        const safeLayers = Array.isArray(layers) ? layers : [];
        const newLayer: GradientLayerData = {
            id: uuidv4(),
            type: "gradient",
            name: `Gradient ${safeLayers.filter((l) => l.type === "gradient").length + 1}`,
            visible: true,
            opacity: 100,
            blendMode: 'normal',
            x: 50,
            y: 50,
            width: 100,
            height: 100,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
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
        const updated = [...safeLayers, newLayer];
        setLayers(updated);
        recordHistory(`Add Gradient Layer: ${newLayer.name}`, currentEditState, updated);
        setSelectedLayerId(newLayer.id);
        return newLayer.id;
    }, [layers, recordHistory, currentEditState, gradientToolState, setSelectedLayerId]);

    const onAddAdjustmentLayer = useCallback((type: AdjustmentLayerData['adjustmentData']['type']) => {
        const safeLayers = Array.isArray(layers) ? layers : [];
        
        let adjustmentData: AdjustmentLayerData['adjustmentData'];
        let name: string;

        switch (type) {
            case 'brightness':
                adjustmentData = { type, adjustments: currentEditState.adjustments };
                name = 'Brightness/Contrast';
                break;
            case 'curves':
                adjustmentData = { type, curves: currentEditState.curves };
                name = 'Curves';
                break;
            case 'hsl':
                adjustmentData = { type, hslAdjustments: currentEditState.hslAdjustments };
                name = 'HSL Adjustment';
                break;
            case 'grading':
                adjustmentData = { type, grading: currentEditState.grading };
                name = 'Color Grading';
                break;
            default:
                return;
        }

        const newLayer: AdjustmentLayerData = {
            id: uuidv4(),
            type: "adjustment",
            name: `${name} Layer`,
            visible: true,
            opacity: 100,
            blendMode: 'normal',
            x: 50, y: 50, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1, isLocked: false,
            adjustmentData,
        };
        
        const updated = [...safeLayers, newLayer];
        setLayers(updated);
        recordHistory(`Add Adjustment Layer: ${name}`, currentEditState, updated);
        setSelectedLayerId(newLayer.id);
    }, [layers, recordHistory, currentEditState, setSelectedLayerId]);

    const renameLayer = useCallback((id: string, newName: string) => {
        const layer = layers.find(l => l.id === id);
        if (!layer) return;
        updateLayer(id, { name: newName });
        commitLayerChange(id, `Rename Layer to ${newName}`);
    }, [updateLayer, commitLayerChange, layers]);

    const deleteLayer = useCallback((id: string) => {
        const layer = layers.find(l => l.id === id);
        if (!layer || layer.id === 'background') {
            showError("Cannot delete the background layer.");
            return;
        }
        
        setLayers(prev => {
            const updated = prev.filter(l => l.id !== id);
            recordHistory(`Delete Layer: ${layer.name}`, currentEditState, updated);
            return updated;
        });
        if (selectedLayerId === id) {
            setSelectedLayerId(null);
        }
    }, [layers, setLayers, recordHistory, currentEditState, selectedLayerId, setSelectedLayerId]);

    const onDuplicateLayer = useCallback((id: string) => {
        const selectedLayer = layers.find(l => l.id === id);
        if (!selectedLayer || selectedLayer.id === 'background') return;
        
        const newLayer: Layer = {
            ...selectedLayer,
            id: uuidv4(),
            name: `${selectedLayer.name} Copy`,
        };
        
        setLayers(prev => {
            const index = prev.findIndex(l => l.id === selectedLayer.id);
            const updated = [...prev.slice(0, index + 1), newLayer, ...prev.slice(index + 1)];
            recordHistory(`Duplicate Layer: ${selectedLayer.name}`, currentEditState, updated);
            return updated;
        });
        setSelectedLayerId(newLayer.id);
    }, [layers, setLayers, recordHistory, currentEditState, setSelectedLayerId]);

    const onMergeLayerDown = useCallback(async (id: string) => {
        const targetIndex = layers.findIndex(l => l.id === id);
        if (targetIndex <= 0) {
            showError("Cannot merge down: target is the background or the bottom layer.");
            return;
        }
        
        const targetLayer = layers[targetIndex];
        const layerBelow = layers[targetIndex - 1];

        if (!dimensions || !isDrawingLayer(layerBelow) || !isDrawingLayer(targetLayer)) {
            showError("Merge Down is currently only supported for Drawing/Image layers onto a Drawing/Image layer.");
            return;
        }

        try {
            // 1. Rasterize the target layer onto a temporary canvas
            const targetCanvas = await rasterizeLayerToCanvas(targetLayer, dimensions);
            if (!targetCanvas) throw new Error("Failed to rasterize target layer.");
            const strokeDataUrl = targetCanvas.toDataURL();

            // 2. Merge the rasterized content onto the layer below
            const newLayerDataUrl = await mergeStrokeOntoLayerDataUrl(
                layerBelow.dataUrl,
                strokeDataUrl,
                dimensions,
                targetLayer.blendMode // Use the target layer's blend mode for the merge
            );

            // 3. Update the layer below and remove the target layer
            const updatedLayers = layers.filter(l => l.id !== id).map(l => {
                if (l.id === layerBelow.id) {
                    return { ...l, dataUrl: newLayerDataUrl };
                }
                return l;
            });

            setLayers(updatedLayers);
            recordHistory(`Merge Layer Down: ${targetLayer.name}`, currentEditState, updatedLayers);
            setSelectedLayerId(layerBelow.id);
            showSuccess(`Merged ${targetLayer.name} down into ${layerBelow.name}.`);

        } catch (error) {
            console.error("Merge Down failed:", error);
            showError("Failed to merge layers.");
        }
    }, [layers, dimensions, setLayers, recordHistory, currentEditState, setSelectedLayerId]);

    const onRasterizeLayer = useCallback(async (id: string) => {
        const layer = layers.find(l => l.id === id);
        if (!layer || layer.type === 'image' || layer.type === 'drawing') return;

        if (!dimensions) {
            showError("Cannot rasterize: dimensions unknown.");
            return;
        }

        try {
            const canvas = await rasterizeLayerToCanvas(layer, dimensions);
            if (!canvas) throw new Error("Failed to rasterize layer content.");
            
            const rasterDataUrl = canvas.toDataURL();
            
            const newLayer: DrawingLayerData = {
                id: layer.id,
                type: 'drawing',
                name: `${layer.name} (Rasterized)`,
                visible: layer.visible,
                opacity: layer.opacity,
                blendMode: layer.blendMode,
                dataUrl: rasterDataUrl,
                x: 50, y: 50, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1, isLocked: layer.isLocked,
                maskDataUrl: layer.maskDataUrl,
            };

            setLayers(prev => prev.map(l => l.id === id ? newLayer : l));
            commitLayerChange(id, `Rasterize Layer: ${layer.name}`);
            showSuccess(`${layer.name} rasterized.`);
        } catch (error) {
            console.error("Rasterization failed:", error);
            showError("Failed to rasterize layer.");
        }
    }, [layers, dimensions, setLayers, commitLayerChange]);

    const onCreateSmartObject = useCallback((layerIds: string[]) => {
        // ... (implementation remains the same)
    }, [layers, dimensions, setLayers, recordHistory, currentEditState, setSelectedLayerId]);

    const onOpenSmartObject = useCallback((id: string) => {
        // This function is handled in Index.tsx by setting smartObjectLayerToEdit state
        console.log(`Open Smart Object ${id} stub`);
    }, []);

    const onRasterizeSmartObject = useCallback(async (id: string) => {
        // ... (implementation remains the same)
    }, [layers, dimensions, updateLayer, commitLayerChange]);

    const onConvertSmartObjectToLayers = useCallback((id: string) => {
        // ... (implementation remains the same)
    }, [layers, setLayers, recordHistory, currentEditState, setSelectedLayerId]);

    const onExportSmartObjectContents = useCallback((id: string) => {
        // ... (implementation remains the same)
    }, [layers]);

    const groupLayers = useCallback((layerIds: string[]) => {
        // ... (implementation remains the same)
    }, [layers, setLayers, recordHistory, currentEditState, setSelectedLayerId]);

    const toggleGroupExpanded = useCallback((id: string) => {
        // ... (implementation remains the same)
    }, [updateLayer, commitLayerChange]);

    const onToggleClippingMask = useCallback((id: string) => {
        // ... (implementation remains the same)
    }, [layers, updateLayer, commitLayerChange]);

    const onToggleLayerLock = useCallback((id: string) => {
        // ... (implementation remains the same)
    }, [updateLayer, commitLayerChange]);

    const onDeleteHiddenLayers = useCallback(() => {
        // ... (implementation remains the same)
    }, [layers, setLayers, recordHistory, currentEditState, setSelectedLayerId]);

    const onArrangeLayer = useCallback((direction: 'front' | 'back' | 'forward' | 'backward') => {
        // ... (implementation remains the same)
    }, [layers, selectedLayerId, setLayers, recordHistory, currentEditState]);

    const onRemoveLayerMask = useCallback((id: string) => {
        // ... (implementation remains the same)
    }, [updateLayer, commitLayerChange, layers]);

    const onInvertLayerMask = useCallback(async (id: string) => {
        // ... (implementation remains the same)
    }, [layers, dimensions, updateLayer, commitLayerChange]);

    const handleDestructiveOperation = useCallback(async (operation: 'delete' | 'fill') => {
        // ... (implementation remains the same)
    }, [layers, dimensions, selectionMaskDataUrl, foregroundColor, updateLayer, commitLayerChange, clearSelectionState]);


    return {
        toggleLayerVisibility, renameLayer, deleteLayer, onDuplicateLayer, onMergeLayerDown, onRasterizeLayer,
        onCreateSmartObject, onOpenSmartObject, onRasterizeSmartObject, onConvertSmartObjectToLayers, onExportSmartObjectContents,
        updateLayer, commitLayerChange, onLayerPropertyCommit, handleLayerOpacityChange, handleLayerOpacityCommit,
        addTextLayer, addDrawingLayer, onAddLayerFromBackground, onLayerFromSelection,
        addShapeLayer, addGradientLayer, onAddAdjustmentLayer, groupLayers, toggleGroupExpanded,
        onRemoveLayerMask, onInvertLayerMask, onToggleClippingMask, onToggleLayerLock, onDeleteHiddenLayers, onArrangeLayer,
        hasActiveSelection: !!selectionMaskDataUrl, onApplySelectionAsMask, handleDestructiveOperation,
        handleDrawingStrokeEnd, handleSelectionBrushStrokeEnd, handleHistoryBrushStrokeEnd,
    };
};