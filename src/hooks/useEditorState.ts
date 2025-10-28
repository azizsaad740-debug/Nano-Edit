import { useState, useEffect, useCallback, useMemo } from "react";
import { type Crop } from "react-image-crop";
import ExifReader from "exifreader";
import { v4 as uuidv4 } from "uuid";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { copyImageToClipboard, downloadImage } from "@/utils/imageUtils";
import { saveProjectToFile, loadProjectFromFile, ProjectFile } from "@/utils/projectUtils";
import { useLayers } from "./useLayers";
import { useSettings } from "./useSettings";
import {
  initialEditState,
  initialLayerState,
  initialHistoryItem,
  initialBrushState,
  initialGradientToolState,
  initialCurvesState,
  initialHslAdjustment,
  type EditState,
  type Layer,
  type HistoryItem,
  type Point,
  type BrushState,
  type GradientToolState,
  type ActiveTool,
  type HslAdjustment,
  type HslColorKey,
} from "@/types/editor"; // Import types from centralized file

// Helper to deep clone state
const deepCloneState = (state: EditState): EditState => JSON.parse(JSON.stringify(state));

export const useEditorState = (
  activeProject: any, // Project type from useProjectManager
  handleProjectUpdate: (updates: Partial<typeof activeProject>) => void,
  handleHistoryUpdate: (history: HistoryItem[], currentHistoryIndex: number, layers: Layer[]) => void,
  handleLayerUpdate: (layers: Layer[], historyName?: string) => void,
  initialImage: string | null,
  initialDimensions: { width: number; height: number } | null,
  initialFileInfo: { name: string; size: number } | null,
  initialExifData: any | null,
  imgRef: React.RefObject<HTMLImageElement>,
) => {
  const { stabilityApiKey } = useSettings();

  // --- Core State from Project Manager ---
  const image = activeProject.image || initialImage;
  const dimensions = activeProject.dimensions || initialDimensions;
  const fileInfo = activeProject.fileInfo || initialFileInfo;
  const exifData = activeProject.exifData || initialExifData;
  const history = activeProject.history || [initialHistoryItem];
  const currentHistoryIndex = activeProject.currentHistoryIndex || 0;
  const layers = activeProject.layers || initialLayerState;
  const selectedLayerId = activeProject.selectedLayerId || null;
  const aspect = activeProject.aspect;
  const selectionPath = activeProject.selectionPath;
  const selectionMaskDataUrl = activeProject.selectionMaskDataUrl;
  const foregroundColor = activeProject.foregroundColor;
  const backgroundColor = activeProject.backgroundColor;
  const gradientToolState = activeProject.gradientToolState;
  const brushStateInternal = activeProject.brushStateInternal;
  const selectedShapeType = activeProject.selectedShapeType;
  const activeTool = activeProject.activeTool;
  const selectiveBlurAmount = activeProject.selectiveBlurAmount;
  const selectiveBlurMask = activeProject.selectiveBlurMask; // NEW: Selective blur mask

  // The current EditState is derived from the active history item
  const currentState: EditState = useMemo(() => {
    return history[currentHistoryIndex]?.state || initialEditState;
  }, [history, currentHistoryIndex]);

  // --- State Setters for Project Manager ---

  const updateCurrentState = useCallback((updates: Partial<EditState>) => {
    // This function is used for temporary changes (e.g., slider dragging)
    const newHistory = [...history];
    newHistory[currentHistoryIndex] = {
      ...newHistory[currentHistoryIndex],
      state: { ...currentState, ...updates },
    };
    handleHistoryUpdate(newHistory, currentHistoryIndex, layers);
  }, [currentState, history, currentHistoryIndex, layers, handleHistoryUpdate]);

  const recordHistory = useCallback((name: string, state: EditState, layers: Layer[]) => {
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    const newHistoryIndex = newHistory.length;
    const newHistoryItem: HistoryItem = { name, state: deepCloneState(state), layers: JSON.parse(JSON.stringify(layers)) };
    handleHistoryUpdate([...newHistory, newHistoryItem], newHistoryIndex, layers);
  }, [history, currentHistoryIndex, handleHistoryUpdate]);

  // --- Active Tool Management (Defined early to resolve hoisting issues) ---
  const setActiveTool = useCallback((tool: ActiveTool | null) => {
    handleProjectUpdate({ activeTool: tool });
  }, [handleProjectUpdate]);

  // --- Layer Management Hook Integration ---
  const {
    layers: managedLayers,
    selectedLayerId: managedSelectedLayerId,
    setSelectedLayerId,
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
    removeLayerMask,
    invertLayerMask,
    toggleClippingMask,
    toggleLayerLock,
    renameLayer,
    handleAddTextLayer,
    handleAddDrawingLayer,
    handleAddLayerFromBackground,
    handleLayerFromSelection,
    handleAddShapeLayer,
    handleAddGradientLayer,
    addAdjustmentLayer,
    deleteLayer: handleDeleteLayer,
    handleDeleteHiddenLayers,
    duplicateLayer: handleDuplicateLayer,
    mergeLayerDown: handleMergeLayerDown,
    rasterizeLayer: handleRasterizeLayer,
    handleRasterizeSmartObject,
    handleConvertSmartObjectToLayers,
    handleExportSmartObjectContents,
    handleArrangeLayer,
    handleToggleVisibility,
    handleDrawingStrokeEnd,
    applySelectionAsMask: applySelectionAsMaskFromLayers,
    canUndoLayers, // Corrected destructuring name
    canRedoLayers, // Corrected destructuring name
  } = useLayers({
    currentEditState: currentState,
    recordHistory,
    updateCurrentState,
    imgRef,
    imageNaturalDimensions: dimensions,
    gradientToolState,
    activeTool,
    layers,
    setLayers: handleLayerUpdate, // Pass the project manager's layer update function
    selectedLayerId,
    setSelectedLayerId: (id) => handleProjectUpdate({ selectedLayerId: id }),
    history,
    currentHistoryIndex,
    foregroundColor,
    backgroundColor,
    selectedShapeType,
    selectionMaskDataUrl,
    clearSelectionState: () => handleProjectUpdate({ selectionPath: null, selectionMaskDataUrl: null }),
  });

  // Function to commit temporary layer changes and record history
  const commitTemporaryLayerChange = useCallback((id: string, historyName: string) => {
    commitLayerChange(id); // Commits the temporary state
    recordHistory(historyName, currentState, layers); // Records history
  }, [commitLayerChange, recordHistory, currentState, layers]);

  // --- History Actions ---
  const handleUndo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      const prevItem = history[newIndex];
      handleHistoryUpdate(history, newIndex, prevItem.layers);
      handleProjectUpdate({ selectedLayerId: null });
      showSuccess(`Undo: ${prevItem.name}`);
    }
  }, [currentHistoryIndex, history, handleHistoryUpdate, handleProjectUpdate]);

  const handleRedo = useCallback(() => {
    if (currentHistoryIndex < history.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      const nextItem = history[newIndex];
      handleHistoryUpdate(history, newIndex, nextItem.layers);
      handleProjectUpdate({ selectedLayerId: null });
      showSuccess(`Redo: ${nextItem.name}`);
    }
  }, [currentHistoryIndex, history, handleHistoryUpdate, handleProjectUpdate]);

  const jumpToHistory = useCallback((index: number) => {
    if (index >= 0 && index < history.length) {
      const targetItem = history[index];
      handleHistoryUpdate(history, index, targetItem.layers);
      handleProjectUpdate({ selectedLayerId: null });
      showSuccess(`Jumped to: ${targetItem.name}`);
    }
  }, [history, handleHistoryUpdate, handleProjectUpdate]);

  // --- File/Project Management ---

  const handleFileSelect = useCallback(async (file: File, importInSameProject: boolean) => {
    const toastId = showLoading("Loading image...");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
      });

      const exifData = ExifReader.load(dataUrl);

      const newDimensions = { width: img.naturalWidth, height: img.naturalHeight };
      const newFileInfo = { name: file.name, size: file.size };

      const newLayer: Layer = {
        id: 'background',
        name: file.name,
        type: 'image',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        dataUrl: dataUrl,
        isLocked: true,
      };

      if (importInSameProject) {
        // Replace the background layer
        const updatedLayers = layers.map(l => l.id === 'background' ? newLayer : l);
        recordHistory(`Import Image: ${file.name}`, currentState, updatedLayers);
        handleProjectUpdate({
          image: dataUrl,
          dimensions: newDimensions,
          fileInfo: newFileInfo,
          exifData,
          aspect: newDimensions.width / newDimensions.height,
          layers: updatedLayers,
        });
      } else {
        // New project/tab (handled by Index.tsx, just update state)
        const newLayers = [newLayer];
        const newHistoryItem: HistoryItem = { name: `Load Image: ${file.name}`, state: initialEditState, layers: newLayers };
        handleProjectUpdate({
          image: dataUrl,
          dimensions: newDimensions,
          fileInfo: newFileInfo,
          exifData,
          aspect: newDimensions.width / newDimensions.height,
          history: [newHistoryItem],
          currentHistoryIndex: 0,
          layers: newLayers,
          selectedLayerId: null,
          pendingCrop: undefined,
          selectionPath: null,
          selectionMaskDataUrl: null,
        });
      }

      dismissToast(toastId);
      showSuccess("Image loaded successfully.");
    } catch (error) {
      dismissToast(toastId);
      console.error("File load error:", error);
      showError("Failed to load image file.");
    }
  }, [currentState, layers, recordHistory, handleProjectUpdate]);

  const handleUrlImageLoad = useCallback(async (url: string, importInSameProject: boolean) => {
    const toastId = showLoading("Loading image from URL...");
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch image.");
      const blob = await response.blob();
      const file = new File([blob], url.substring(url.lastIndexOf('/') + 1) || 'url-image.jpg', { type: blob.type });
      
      await handleFileSelect(file, importInSameProject);
      dismissToast(toastId);
    } catch (error) {
      dismissToast(toastId);
      console.error("URL load error:", error);
      showError("Failed to load image from URL.");
    }
  }, [handleFileSelect]);

  const handleGeneratedImageLoad = useCallback(async (url: string) => {
    const toastId = showLoading("Loading generated image...");
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch image.");
      const blob = await response.blob();
      const file = new File([blob], 'generated-image.png', { type: 'image/png' });
      
      await handleFileSelect(file, false);
      dismissToast(toastId);
    } catch (error) {
      dismissToast(toastId);
      console.error("Generated image load error:", error);
      showError("Failed to load generated image.");
    }
  }, [handleFileSelect]);

  const handleNewProject = useCallback((settings: { width: number; height: number; dpi: number; backgroundColor: string }) => {
    const { width, height, backgroundColor } = settings;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      showError("Failed to create canvas context.");
      return;
    }
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    const dataUrl = canvas.toDataURL();

    const newLayer: Layer = {
      id: 'background',
      name: 'Background',
      type: 'image',
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      dataUrl: dataUrl,
      isLocked: true,
    };
    const newLayers = [newLayer];
    const newDimensions = { width, height };
    const newFileInfo = { name: `New Project ${width}x${height}`, size: 0 };

    const newHistoryItem: HistoryItem = { name: `New Project ${width}x${height}`, state: initialEditState, layers: newLayers };
    
    handleProjectUpdate({
      image: dataUrl,
      dimensions: newDimensions,
      fileInfo: newFileInfo,
      exifData: null,
      aspect: width / height,
      history: [newHistoryItem],
      currentHistoryIndex: 0,
      layers: newLayers,
      selectedLayerId: null,
      pendingCrop: undefined,
      selectionPath: null,
      selectionMaskDataUrl: null,
    });
    showSuccess("New project created.");
  }, [handleProjectUpdate]);

  const handleNewFromClipboard = useCallback(async (importInSameProject: boolean) => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        if (item.types.includes('image/png')) {
          const blob = await item.getType('image/png');
          const file = new File([blob], 'pasted-image.png', { type: 'image/png' });
          await handleFileSelect(file, importInSameProject);
          return;
        }
      }
      showError("No image found in clipboard.");
    } catch (error) {
      console.error("Clipboard read error:", error);
      showError("Failed to read image from clipboard. Ensure you have granted clipboard permissions.");
    }
  }, [handleFileSelect]);

  const handleSaveProject = useCallback(() => {
    if (!image) {
      showError("No image loaded to save.");
      return;
    }
    const projectState: Omit<ProjectFile, 'version'> = {
      sourceImage: image,
      history: history,
      currentHistoryIndex: currentHistoryIndex,
      fileInfo: fileInfo,
    };
    saveProjectToFile(projectState);
  }, [image, history, currentHistoryIndex, fileInfo]);

  const handleLoadProject = useCallback(async (file: File) => {
    const toastId = showLoading("Loading project...");
    try {
      const projectData = await loadProjectFromFile(file);
      
      // Validate project structure
      if (!projectData.sourceImage || projectData.history.length === 0) {
        throw new Error("Project file is missing core data.");
      }

      const lastHistoryItem = projectData.history[projectData.currentHistoryIndex];
      const lastState = lastHistoryItem.state;
      const lastLayers = lastHistoryItem.layers;

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = projectData.sourceImage!;
      });

      const newDimensions = { width: img.naturalWidth, height: img.naturalHeight };
      
      handleProjectUpdate({
        image: projectData.sourceImage,
        dimensions: newDimensions,
        fileInfo: projectData.fileInfo,
        exifData: null, // EXIF data is not saved in project file
        aspect: newDimensions.width / newDimensions.height,
        history: projectData.history,
        currentHistoryIndex: projectData.currentHistoryIndex,
        layers: lastLayers,
        selectedLayerId: null,
        pendingCrop: lastState.crop,
        selectionPath: null,
        selectionMaskDataUrl: null,
      });

      dismissToast(toastId);
      showSuccess(`Project "${projectData.fileInfo?.name}" loaded successfully.`);
    } catch (error: any) {
      dismissToast(toastId);
      console.error("Project load error:", error);
      showError(error.message || "Failed to load project file.");
    }
  }, [handleProjectUpdate]);

  // --- Edit Controls Handlers ---

  const handleAdjustmentChange = useCallback((key: string, value: number) => {
    updateCurrentState({ adjustments: { ...currentState.adjustments, [key]: value } });
  }, [currentState.adjustments, updateCurrentState]);

  const handleAdjustmentCommit = useCallback((key: string, value: number) => {
    recordHistory(`Adjust ${key} to ${value}%`, currentState, layers);
  }, [currentState, layers, recordHistory]);

  const handleEffectChange = useCallback((key: string, value: number) => {
    updateCurrentState({ effects: { ...currentState.effects, [key]: value } });
  }, [currentState.effects, updateCurrentState]);

  const handleEffectCommit = useCallback((key: string, value: number) => {
    recordHistory(`Apply Effect ${key} to ${value}`, currentState, layers);
  }, [currentState, layers, recordHistory]);

  const handleGradingChange = useCallback((key: string, value: number) => {
    updateCurrentState({ grading: { ...currentState.grading, [key]: value } });
  }, [currentState.grading, updateCurrentState]);

  const handleGradingCommit = useCallback((key: string, value: number) => {
    recordHistory(`Apply Grading ${key} to ${value}%`, currentState, layers);
  }, [currentState, layers, recordHistory]);

  const handleHslAdjustmentChange = useCallback((color: HslColorKey, key: keyof HslAdjustment, value: number) => {
    const newHsl = { 
      ...currentState.hslAdjustments, 
      [color]: { ...currentState.hslAdjustments[color], [key]: value } 
    };
    updateCurrentState({ hslAdjustments: newHsl });
  }, [currentState.hslAdjustments, updateCurrentState]);

  const handleHslAdjustmentCommit = useCallback((color: HslColorKey, key: keyof HslAdjustment, value: number) => {
    recordHistory(`Adjust HSL ${color}/${key} to ${value}`, currentState, layers);
  }, [currentState, layers, recordHistory]);

  const handleChannelChange = useCallback((channel: 'r' | 'g' | 'b', value: boolean) => {
    const newChannels = { ...currentState.channels, [channel]: value };
    updateCurrentState({ channels: newChannels });
    recordHistory(`Toggle Channel ${channel.toUpperCase()}`, { ...currentState, channels: newChannels }, layers);
  }, [currentState, layers, recordHistory, updateCurrentState]);

  const handleCurvesChange = useCallback((channel: keyof EditState['curves'], points: Point[]) => {
    updateCurrentState({ curves: { ...currentState.curves, [channel]: points } });
  }, [currentState.curves, updateCurrentState]);

  const handleCurvesCommit = useCallback((channel: keyof EditState['curves'], points: Point[]) => {
    recordHistory(`Adjust Curves (${channel})`, currentState, layers);
  }, [currentState, layers, recordHistory]);

  const handleFilterChange = useCallback((filterValue: string, filterName: string) => {
    const newState = { ...currentState, selectedFilter: filterValue };
    updateCurrentState(newState);
    recordHistory(`Apply Filter: ${filterName}`, newState, layers);
  }, [currentState, layers, recordHistory, updateCurrentState]);

  const handleTransformChange = useCallback((transformType: string) => {
    let { rotation, scaleX, scaleY } = currentState.transforms;
    let name = "";

    switch (transformType) {
      case 'rotate-left':
        rotation = (rotation - 90 + 360) % 360;
        name = "Rotate Left";
        break;
      case 'rotate-right':
        rotation = (rotation + 90) % 360;
        name = "Rotate Right";
        break;
      case 'flip-horizontal':
        scaleX *= -1;
        name = "Flip Horizontal";
        break;
      case 'flip-vertical':
        scaleY *= -1;
        name = "Flip Vertical";
        break;
    }

    const newTransforms = { rotation, scaleX, scaleY };
    const newState = { ...currentState, transforms: newTransforms };
    updateCurrentState(newState);
    recordHistory(name, newState, layers);
  }, [currentState, layers, recordHistory, updateCurrentState]);

  const handleRotationChange = useCallback((value: number) => {
    updateCurrentState({ transforms: { ...currentState.transforms, rotation: value } });
  }, [currentState.transforms, updateCurrentState]);

  const handleRotationCommit = useCallback((value: number) => {
    recordHistory(`Set Rotation to ${Math.round(value)}°`, currentState, layers);
  }, [currentState, layers, recordHistory]);

  const handleFramePresetChange = useCallback((type: string, name: string, options?: { width: number; color: string }) => {
    const newFrame = options ? { type: type as 'none' | 'solid', width: options.width, color: options.color } : { type: 'none' as const, width: 0, color: '#000000' };
    const newState = { ...currentState, frame: newFrame };
    updateCurrentState(newState);
    recordHistory(`Apply Frame: ${name}`, newState, layers);
  }, [currentState, layers, recordHistory, updateCurrentState]);

  const handleFramePropertyChange = useCallback((key: 'width' | 'color', value: any) => {
    const newFrame = { ...currentState.frame, [key]: value };
    updateCurrentState({ frame: newFrame });
  }, [currentState.frame, updateCurrentState]);

  const handleFramePropertyCommit = useCallback(() => {
    recordHistory(`Adjust Frame`, currentState, layers);
  }, [currentState, layers, recordHistory]);

  const handleReset = useCallback(() => {
    const resetState = deepCloneState(initialEditState);
    const resetLayers = layers.map(l => l.id === 'background' ? l : { ...l, visible: false }); // Keep background visible
    recordHistory("Reset All Edits", resetState, resetLayers);
  }, [layers, recordHistory]);

  const applyPreset = useCallback((preset: { name: string; state: Partial<EditState> }) => {
    const newState = { ...currentState, ...preset.state };
    updateCurrentState(newState);
    recordHistory(`Apply Preset: ${preset.name}`, newState, layers);
  }, [currentState, layers, recordHistory, updateCurrentState]);

  // --- Crop Handlers ---
  const [pendingCrop, setPendingCrop] = useState<Crop | undefined>(currentState.crop); 

  useEffect(() => {
    // Sync pendingCrop when history changes
    setPendingCrop(currentState.crop);
  }, [currentState.crop]);

  const applyCrop = useCallback(() => {
    if (!pendingCrop) return;
    const newState = { ...currentState, crop: pendingCrop };
    updateCurrentState(newState);
    recordHistory("Apply Crop", newState, layers);
    // Fix TS Error 1: Remove access to pendingCrop.aspect
    // handleProjectUpdate({ aspect: pendingCrop.aspect }); 
    setActiveTool(null);
  }, [currentState, pendingCrop, layers, recordHistory, handleProjectUpdate, setActiveTool, updateCurrentState]);

  const cancelCrop = useCallback(() => {
    setPendingCrop(currentState.crop);
    setActiveTool(null);
  }, [currentState.crop, setActiveTool]);

  // --- Download/Copy Handlers ---
  const handleDownload = useCallback(async (exportOptions: { format: string; quality: number; width: number; height: number; upscale: 1 | 2 | 4 }) => {
    if (!imgRef.current || !dimensions) {
      showError("Image not fully loaded or dimensions unknown.");
      return;
    }
    
    await downloadImage({
      image: imgRef.current,
      layers,
      ...currentState,
    }, exportOptions, stabilityApiKey);
  }, [imgRef, dimensions, layers, currentState, stabilityApiKey]);

  const handleCopy = useCallback(() => {
    if (!imgRef.current || !dimensions) {
      showError("Image not fully loaded or dimensions unknown.");
      return;
    }
    copyImageToClipboard({
      image: imgRef.current,
      layers,
      ...currentState,
    });
  }, [imgRef, dimensions, layers, currentState]);

  // --- Color Tool Handlers ---
  const handleForegroundColorChange = useCallback((color: string) => {
    handleProjectUpdate({ foregroundColor: color });
  }, [handleProjectUpdate]);

  const handleBackgroundColorChange = useCallback((color: string) => {
    handleProjectUpdate({ backgroundColor: color });
  }, [handleProjectUpdate]);

  const handleSwapColors = useCallback(() => {
    handleProjectUpdate({ foregroundColor: backgroundColor, backgroundColor: foregroundColor }); 
  }, [foregroundColor, backgroundColor, handleProjectUpdate]);

  const handleColorPick = useCallback((color: string) => {
    handleProjectUpdate({ foregroundColor: color });
  }, [handleProjectUpdate]);

  // --- Generative Fill Handler ---
  const applyGenerativeResult = useCallback((resultUrl: string, maskDataUrl: string | null) => {
    if (!dimensions) {
      showError("Cannot apply generative result without dimensions.");
      return;
    }

    const newLayer: Layer = {
      id: uuidv4(),
      type: "drawing",
      name: "Generative Fill",
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      dataUrl: resultUrl,
      maskDataUrl: maskDataUrl || undefined,
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
      isLocked: false,
    };

    // Insert immediately above the background layer (index 1)
    const updatedLayers = [layers[0], newLayer, ...layers.slice(1)];
    
    handleProjectUpdate({ layers: updatedLayers, selectedLayerId: newLayer.id });
    recordHistory("Apply Generative Fill", currentState, updatedLayers);
    handleProjectUpdate({ selectionPath: null, selectionMaskDataUrl: null });
    showSuccess("Generative fill applied as a new layer.");
  }, [dimensions, layers, currentState, recordHistory, handleProjectUpdate]);

  // --- Selection/Masking Handlers ---
  const setSelectionPath = useCallback((path: Point[] | null) => {
    handleProjectUpdate({ selectionPath: path, selectionMaskDataUrl: null });
  }, [handleProjectUpdate]);

  const handleSelectionBrushStroke = useCallback((strokeDataUrl: string, operation: 'add' | 'subtract') => {
    // This function is complex as it needs to merge the stroke onto the existing mask.
    // For now, we treat the stroke as the new mask if no mask exists, or merge it if one does.
    
    // Since this is a complex canvas operation, we'll simplify it for now:
    // If no mask exists, the stroke becomes the mask.
    // If a mask exists, we assume the stroke is merged onto it (stub).
    
    if (!selectionMaskDataUrl) {
      handleProjectUpdate({ selectionMaskDataUrl: strokeDataUrl, selectionPath: null });
      showSuccess("Selection mask created.");
    } else {
      // In a real app, we would merge strokeDataUrl onto selectionMaskDataUrl using canvas composite operations.
      // For now, we just update the mask to the new stroke (simplification).
      handleProjectUpdate({ selectionMaskDataUrl: strokeDataUrl, selectionPath: null });
      showSuccess("Selection mask updated (stub merge).");
    }
  }, [selectionMaskDataUrl, handleProjectUpdate]);

  const clearSelectionMask = useCallback(() => {
    handleProjectUpdate({ selectionPath: null, selectionMaskDataUrl: null });
    showSuccess("Selection cleared.");
  }, [handleProjectUpdate]);

  const applyMaskToSelectionPath = useCallback(() => {
    // This function is used when the lasso path is finalized and needs to be converted to a mask.
    // Since the lasso path is already stored in selectionPath, we need a utility to convert it.
    // This utility is defined in src/utils/maskToPolygon.ts and src/utils/maskUtils.ts
    // For now, we rely on the Workspace component to call convertSelectionPathToMask when needed.
    showError("Use 'Refine Selection' to convert Lasso path to a mask first.");
  }, []);

  const convertSelectionPathToMask = useCallback(async () => {
    if (!selectionPath || !dimensions) {
      showError("No lasso selection path found.");
      return;
    }
    const toastId = showLoading("Refining selection...");
    try {
      // We use maskToPolygon to get a simplified path, but here we need the actual mask data URL.
      const { polygonToMaskDataUrl } = await import("@/utils/maskUtils");
      const maskDataUrl = await polygonToMaskDataUrl(selectionPath, dimensions.width, dimensions.height);
      
      handleProjectUpdate({ selectionMaskDataUrl: maskDataUrl, selectionPath: null });
      dismissToast(toastId);
      showSuccess("Selection refined to mask.");
    } catch (error) {
      dismissToast(toastId);
      showError("Failed to refine selection.");
    }
  }, [selectionPath, dimensions, handleProjectUpdate]);

  // --- Selective Blur Handlers ---
  const handleSelectiveBlurStrengthChange = useCallback((value: number) => {
    handleProjectUpdate({ selectiveBlurAmount: value });
  }, [handleProjectUpdate]);

  const handleSelectiveBlurStrengthCommit = useCallback((value: number) => {
    recordHistory(`Set Selective Blur Strength to ${value}%`, currentState, layers);
  }, [currentState, layers, recordHistory]);

  const handleSelectiveBlurStroke = useCallback((strokeDataUrl: string, operation: 'add' | 'subtract') => {
    // This stroke is applied to the selectiveBlurMask
    if (!selectiveBlurMask) {
      handleProjectUpdate({ selectiveBlurMask: strokeDataUrl });
      showSuccess("Selective blur mask created.");
    } else {
      // In a real app, we would merge strokeDataUrl onto selectiveBlurMask using canvas composite operations.
      // For now, we just update the mask to the new stroke (simplification).
      handleProjectUpdate({ selectiveBlurMask: strokeDataUrl });
      showSuccess("Selective blur mask updated (stub merge).");
    }
  }, [selectiveBlurMask, handleProjectUpdate]);

  // --- Template Loading ---
  const loadTemplateData = useCallback((template: { data: { editState: Partial<EditState>, layers: Layer[], dimensions: { width: number, height: number } } }) => {
    const { editState, layers: templateLayers, dimensions: templateDimensions } = template.data;
    
    const newState = { ...initialEditState, ...editState };
    
    // Ensure the background layer exists and is updated with a placeholder image
    const backgroundLayer = templateLayers.find(l => l.type === 'image');
    if (backgroundLayer) {
      backgroundLayer.dataUrl = image || 'public/placeholder.svg'; // Use current image or placeholder
    }

    const newHistoryItem: HistoryItem = { name: `Apply Template: ${template.data.editState.selectedFilter || 'Custom'}`, state: newState, layers: templateLayers };
    
    handleProjectUpdate({
      dimensions: templateDimensions,
      aspect: templateDimensions.width / templateDimensions.height,
      history: [newHistoryItem],
      currentHistoryIndex: 0,
      layers: templateLayers,
      selectedLayerId: null,
      pendingCrop: newState.crop,
      selectionPath: null,
      selectionMaskDataUrl: null,
    });
    showSuccess("Template applied.");
  }, [image, handleProjectUpdate]);

  // Check for template data in session storage on initial load
  useEffect(() => {
    const templateDataString = sessionStorage.getItem('nanoedit-template-data');
    if (templateDataString) {
      try {
        const templateData: { data: { editState: Partial<EditState>, layers: Layer[], dimensions: { width: number, height: number } } } = JSON.parse(templateDataString);
        loadTemplateData(templateData);
        sessionStorage.removeItem('nanoedit-template-data');
      } catch (e) {
        console.error("Failed to parse template data from session storage:", e);
        showError("Failed to load template data.");
      }
    }
  }, [loadTemplateData]);

  // --- Brush State Management ---
  const brushState: BrushState = useMemo(() => ({
    ...brushStateInternal,
  }), [brushStateInternal]);

  const setBrushState = useCallback((updates: Partial<Omit<BrushState, 'color'>>) => {
    handleProjectUpdate({ brushStateInternal: { ...brushStateInternal, ...updates } });
  }, [brushStateInternal, handleProjectUpdate]);

  // --- Shape Type Management ---
  const setSelectedShapeType = useCallback((type: Layer['shapeType'] | null) => {
    handleProjectUpdate({ selectedShapeType: type });
  }, [handleProjectUpdate]);

  // --- Public Interface ---
  return {
    // Core State
    image,
    dimensions,
    fileInfo,
    exifData,
    history,
    currentHistoryIndex,
    currentState,
    aspect,
    pendingCrop,
    foregroundColor,
    backgroundColor,
    activeTool,
    selectedShapeType,
    selectionPath,
    selectionMaskDataUrl,
    selectiveBlurAmount,
    selectiveBlurMask,

    // Project/File actions
    handleFileSelect,
    handleUrlImageLoad,
    handleGeneratedImageLoad,
    handleNewProject,
    handleNewFromClipboard,
    handleSaveProject,
    handleLoadProject,
    loadImageData: handleFileSelect, // Alias for compatibility

    // History Actions
    handleUndo,
    handleRedo,
    jumpToHistory,
    canUndo: canUndoLayers, // Corrected property name
    canRedo: canRedoLayers, // Corrected property name
    recordHistory,

    // Edit State Management
    updateCurrentState,
    handleAdjustmentChange,
    handleAdjustmentCommit,
    handleEffectChange,
    handleEffectCommit,
    handleGradingChange,
    handleGradingCommit,
    handleHslAdjustmentChange,
    handleHslAdjustmentCommit,
    handleChannelChange,
    handleCurvesChange,
    handleCurvesCommit,
    handleFilterChange,
    handleTransformChange,
    handleRotationChange,
    handleRotationCommit,
    handleFramePresetChange,
    handleFramePropertyChange,
    handleFramePropertyCommit,
    handleReset,
    applyPreset,

    // Crop Actions
    setPendingCrop,
    applyCrop,
    cancelCrop,
    setAspect: (aspect: number | undefined) => handleProjectUpdate({ aspect }),

    // Download/Copy
    handleDownload,
    handleCopy,

    // Color Tools
    handleForegroundColorChange,
    handleBackgroundColorChange,
    handleSwapColors,
    handleColorPick,

    // Generative Fill
    applyGenerativeResult,

    // Layer Management (from useLayers)
    layers: managedLayers,
    selectedLayerId: managedSelectedLayerId,
    setSelectedLayer: (id) => handleProjectUpdate({ selectedLayerId: id }),
    updateLayer,
    commitLayerChange,
    handleLayerPropertyCommit,
    handleLayerOpacityChange,
    handleLayerOpacityCommit,
    commitTemporaryLayerChange, // <-- ADDED
    reorderLayers,
    createSmartObject,
    openSmartObjectEditor,
    closeSmartObjectEditor,
    saveSmartObjectChanges,
    isSmartObjectEditorOpen,
    smartObjectEditingId,
    moveSelectedLayer: updateLayer, // Simple move is handled by updateLayer
    groupLayers,
    toggleGroupExpanded,
    removeLayerMask,
    invertLayerMask,
    toggleClippingMask,
    toggleLayerLock,
    renameLayer,
    deleteLayer: handleDeleteLayer,
    handleDeleteHiddenLayers,
    duplicateLayer: handleDuplicateLayer,
    mergeLayerDown: handleMergeLayerDown,
    rasterizeLayer: handleRasterizeLayer,
    handleRasterizeSmartObject,
    handleConvertSmartObjectToLayers,
    handleExportSmartObjectContents,
    handleArrangeLayer,
    handleToggleVisibility, // TS Error 2 Fix: Explicitly return this property
    addTextLayer: (coords) => handleAddTextLayer(coords, foregroundColor),
    addDrawingLayer: handleAddDrawingLayer,
    handleAddLayerFromBackground,
    handleLayerFromSelection,
    addShapeLayer: (coords, shapeType, initialWidth, initialHeight) => handleAddShapeLayer(coords, shapeType, initialWidth, initialHeight, foregroundColor, backgroundColor),
    addGradientLayer: handleAddGradientLayer,
    addAdjustmentLayer,
    handleDrawingStrokeEnd,

    // Tool State
    setActiveTool,
    brushState,
    setBrushState,
    gradientToolState,
    setGradientToolState: (state) => handleProjectUpdate({ gradientToolState: state }),
    setSelectedShapeType,

    // Selection/Masking
    setSelectionPath,
    handleSelectionBrushStroke,
    clearSelectionMask,
    applyMaskToSelectionPath,
    convertSelectionPathToMask,
    applySelectionAsMask: applySelectionAsMaskFromLayers,
    handleSelectiveBlurStrengthChange,
    handleSelectiveBlurStrengthCommit,
    handleSelectiveBlurStroke,

    // Templates
    loadTemplateData,
  };
};