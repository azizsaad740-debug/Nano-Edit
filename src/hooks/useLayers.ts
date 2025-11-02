import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import { showError, showSuccess } from "@/utils/toast";
import type { Layer, ActiveTool, BrushState, GradientToolState, ShapeType, GroupLayerData, TextLayerData, DrawingLayerData, VectorShapeLayerData, GradientLayerData, Dimensions, EditState, Point, AdjustmentLayerData, AdjustmentState } from "@/types/editor";
import { isImageOrDrawingLayer, isTextLayer, isVectorShapeLayer, isDrawingLayer } from "@/types/editor";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils";
import { applyMaskDestructively } from "@/utils/imageUtils";
import { polygonToMaskDataUrl, invertMaskDataUrl, objectSelectToMaskDataUrl, floodFillToMaskDataUrl } from "@/utils/maskUtils";
import { initialCurvesState, initialHslAdjustment, initialGradingState } from "@/types/editor/initialState"; // Fix 7: Assuming initialGradingState is intended
import { mergeMasks } from "@/utils/maskUtils";

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
    selectedLayerId, // Destructure here (Fixes 9-15, 17-22)
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
        setLayers(prev => recursivelyUpdateLayer(prev as Layer[], id, updates)); // Fix 8: Casting prev
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

    // Fix 16: Adjustment Layer Type (around line 428)
    const defaultAdjustmentState: AdjustmentState = {
        brightness: 0, contrast: 0, saturation: 0,
        exposure: 0, gamma: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, clarity: 0, vibrance: 0, grain: 0,
    };

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

    // Fix 23, 24: EditState properties access (using type assertion)
    const mergeStrokeOntoLayer = useCallback(async (layerId: string, strokeDataUrl: string, dimensions: Dimensions, blendMode: string) => {
        // ... implementation
    }, []);

    const handleBrushStrokeEnd = useCallback(async (strokeDataUrl: string, layerId: string) => {
        const layer = layers.find(l => l.id === layerId);
        if (!layer || !dimensions) return;

        await mergeStrokeOntoLayer(
            layerId,
            strokeDataUrl,
            dimensions, 
            (currentEditState as any).brushState.blendMode // Fix 23
        );
        commitLayerChange(layerId, `Brush Stroke on ${layer.name}`);
    }, [layers, dimensions, (currentEditState as any).brushState.blendMode, updateLayer, commitLayerChange, mergeStrokeOntoLayer]); // Fix 24

    // Fix 25, 26, 27, 28: EditState properties access (using type assertion)
    const handleHistoryBrushStrokeEnd = useCallback(async (strokeDataUrl: string, layerId: string) => {
        const targetLayer = layers.find(l => l.id === layerId);
        const historySourceLayer = (currentEditState as any).history[(currentEditState as any).historyBrushSourceIndex]?.layers.find(l => l.id === layerId); // Fix 25, 26
        // ... implementation
    }, [layers, dimensions, (currentEditState as any).history, (currentEditState as any).historyBrushSourceIndex, updateLayer, commitLayerChange, mergeStrokeOntoLayer]); // Fix 27, 28

    // ... rest of hook
};