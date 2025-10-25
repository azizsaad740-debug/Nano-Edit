import React, { useState, useRef, useCallback } from "react";
import { type Crop } from "react-image-crop";
import { useHotkeys } from "react-hotkeys-hook";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { downloadImage, copyImageToClipboard } from "@/utils/imageUtils";
import ExifReader from "exifreader";
import type { Preset } from "./usePresets";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import type { NewProjectSettings } from "@/components/editor/NewProjectDialog";
import { saveProjectToFile, loadProjectFromFile } from "@/utils/projectUtils";
import { readPsd } from "ag-psd";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils";
import { useLayers } from "./useLayers";
import { maskToPolygon } from "@/utils/maskToPolygon";
import { polygonToMaskDataUrl } from "@/utils/maskUtils";
import type { TemplateData } from "../types/template";
import { useSettings } from "./useSettings";

export interface HslAdjustment {
// File contents excluded for brevity
// ...
// ...
// ...
  const {
    setSelectedLayerId: setLayerId,
    handleAddTextLayer: addTextLayer,
    handleAddDrawingLayer: addDrawingLayer,
    handleAddShapeLayer: addShapeLayer,
    handleAddGradientLayer: addGradientLayer,
    addAdjustmentLayer,
    handleToggleVisibility: toggleLayerVisibility,
    renameLayer,
    handleDeleteLayer: deleteLayer,
    handleDuplicateLayer: duplicateLayer,
    mergeLayerDown, // Correctly destructured
    rasterizeLayer, // Correctly destructured
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
    toggleClippingMask,
    toggleLayerLock,
  } = useLayers({
    currentEditState: currentState,
// File contents excluded for brevity
// ...
// ...
// ...
    // Layer utilities
    layers,
    selectedLayerId,
    setSelectedLayer: (id) => onProjectUpdate({ selectedLayerId: id }),
    addTextLayer: (coords) => addTextLayer(coords, foregroundColor),
    addDrawingLayer,
    addShapeLayer: (coords, shapeType, initialWidth, initialHeight) => addShapeLayer(coords, shapeType, initialWidth, initialHeight, foregroundColor, backgroundColor),
    addGradientLayer,
    addAdjustmentLayer,
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
    toggleClippingMask,
    toggleLayerLock,
    // Tool state
    activeTool: initialProject.activeTool,
// File contents excluded for brevity
// ...
// ...
// ...
    // Expose loadImageData for Index.tsx template loading logic
    loadImageData,
  };
};