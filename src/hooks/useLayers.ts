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
import { rasterizeLayer } from '@/utils/imageUtils';

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

export const useLayers = ({ // Fix 46
  layers, setLayers, recordHistory, currentEditState, dimensions, foregroundColor, backgroundColor, gradientToolState, selectedShapeType, selectionPath, selectionMaskDataUrl, setSelectionMaskDataUrl, clearSelectionState, setImage, setFileInfo, setSelectedLayerId, selectedLayerId
}) => {
// ... (rest of file)