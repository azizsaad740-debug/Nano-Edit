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
  imgRef: React.RefObject<HTMLImageElement>,
) => {
  const { stabilityApiKey } = useSettings();

  // --- Core State Management ---
  const [image, setImage] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [exifData, setExifData] = useState<any | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [pendingCrop, setPendingCrop] = useState<Crop | undefined>(undefined);
  const [selectionPath, setSelectionPath] = useState<Point[] | null>(null);
  const [selectionMaskDataUrl, setSelectionMaskDataUrl] = useState<string | null>(null);
  const [foregroundColor, setForegroundColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [gradientToolState, setGradientToolState] = useState<GradientToolState>(initialGradientToolState);
  const [brushStateInternal, setBrushStateInternal] = useState<Omit<BrushState, 'color'>>(initialBrushState);
  const [selectedShapeType, setSelectedShapeType] = useState<Layer['shapeType'] | null>('rect');
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
  const [selectiveBlurAmount, setSelectiveBlurAmount] = useState(50);
  const [selectiveBlurMask, setSelectiveBlurMask] = useState<string | null>(null);

  // --- History State ---
  const [history, setHistory] = useState<HistoryItem[]>([initialHistoryItem]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [layers, setLayers] = useState<Layer[]>(initialLayerState);
  
  // FIX: Define selectedLayerId state here
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null); 

  // The current EditState is derived from the active history item
  const currentState: EditState = useMemo(() => {
    return history[currentHistoryIndex]?.state || initialEditState;
  }, [history, currentHistoryIndex]);

  // --- History Actions ---

  const handleHistoryUpdate = useCallback((newHistory: HistoryItem[], newIndex: number, newLayers: Layer[]) => {
    setHistory(newHistory);
    setCurrentHistoryIndex(newIndex);
    setLayers(newLayers);
    // Sync crop state from history
    setPendingCrop(newHistory[newIndex].state.crop);
  }, []);

  const updateCurrentState = useCallback((updates: Partial<EditState>) => {
    // This function is used for temporary changes (e.g., slider dragging)
    const newHistory = [...history];
    newHistory[currentHistoryIndex] = {
      ...newHistory[currentHistoryIndex],
      state: { ...currentState, ...updates },
    };
    setHistory(newHistory);
  }, [currentState, history, currentHistoryIndex]);

  const recordHistory = useCallback((name: string, state: EditState, layers: Layer[]) => {
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    const newHistoryIndex = newHistory.length;
    const newHistoryItem: HistoryItem = { name, state: deepCloneState(state), layers: JSON.parse(JSON.stringify(layers)) };
    setHistory([...newHistory, newHistoryItem]);
    setCurrentHistoryIndex(newHistoryIndex);
  }, [history, currentHistoryIndex]);

  // --- Layer Management Hook Integration ---
  const handleLayerUpdate = useCallback((newLayersOrUpdater: Layer[] | ((prev: Layer[]) => Layer[]), historyName?: string) => {
    setLayers(prev => {
      const newLayers = typeof newLayersOrUpdater === 'function' ? newLayersOrUpdater(prev) : newLayersOrUpdater;
      if (historyName) {
        recordHistory(historyName, currentState, newLayers);
      }
      return newLayers;
    });
  }, [currentState, recordHistory]);

  const {
    layers: managedLayers,
    // selectedLayerId: managedSelectedLayerId, // Removed conflicting destructuring
    // setSelectedLayerId, // Removed conflicting destructuring
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
    canUndoLayers,
    canRedoLayers,
  } = useLayers({
    currentEditState: currentState,
    recordHistory,
    updateCurrentState,
    imgRef,
    imageNaturalDimensions: dimensions,
    gradientToolState,
    activeTool,
    layers,
    setLayers: handleLayerUpdate,
    selectedLayerId, // Now defined
    setSelectedLayerId, // Now defined
    history,
    currentHistoryIndex,
    foregroundColor,
    backgroundColor,
    selectedShapeType,
    selectionMaskDataUrl,
    clearSelectionState: () => {
      setSelectionPath(null);
      setSelectionMaskDataUrl(null);
    },
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
      setSelectedLayerId(null);
      showSuccess(`Undo: ${prevItem.name}`);
    }
  }, [currentHistoryIndex, history, handleHistoryUpdate, setSelectedLayerId]);

  const handleRedo = useCallback(() => {
    if (currentHistoryIndex < history.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      const nextItem = history[newIndex];
      handleHistoryUpdate(history, newIndex, nextItem.layers);
      setSelectedLayerId(null);
      showSuccess(`Redo: ${nextItem.name}`);
    }
  }, [currentHistoryIndex, history, handleHistoryUpdate, setSelectedLayerId]);

  const jumpToHistory = useCallback((index: number) => {
    if (index >= 0 && index < history.length) {
      const targetItem = history[index];
      handleHistoryUpdate(history, index, targetItem.layers);
      setSelectedLayerId(null);
      showSuccess(`Jumped to: ${targetItem.name}`);
    }
  }, [history, handleHistoryUpdate, setSelectedLayerId]);

  // --- File/Project Management ---

  const resetProjectState = useCallback(() => {
    setImage(null);
    setDimensions(null);
    setFileInfo(null);
    setExifData(null);
    setAspect(undefined);
    setPendingCrop(undefined);
    setSelectionPath(null);
    setSelectionMaskDataUrl(null);
    setForegroundColor("#000000");
    setBackgroundColor("#FFFFFF");
    setGradientToolState(initialGradientToolState);
    setBrushStateInternal(initialBrushState);
    setSelectedShapeType('rect');
    setActiveTool(null);
    setSelectiveBlurAmount(50);
    setSelectiveBlurMask(null);
    setHistory([initialHistoryItem]);
    setCurrentHistoryIndex(0);
    setLayers(initialLayerState);
    setSelectedLayerId(null);
  }, [setSelectedLayerId]);

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
        setImage(dataUrl);
        setDimensions(newDimensions);
        setFileInfo(newFileInfo);
        setExifData(exifData);
        setAspect(newDimensions.width / newDimensions.height);
        setLayers(updatedLayers);
      } else {
        // New project
        resetProjectState();
        const newLayers = [newLayer];
        const newHistoryItem: HistoryItem = { name: `Load Image: ${file.name}`, state: initialEditState, layers: newLayers };
        
        setImage(dataUrl);
        setDimensions(newDimensions);
        setFileInfo(newFileInfo);
        setExifData(exifData);
        setAspect(newDimensions.width / newDimensions.height);
        setHistory([newHistoryItem]);
        setCurrentHistoryIndex(0);
        setLayers(newLayers);
      }

      dismissToast(toastId);
      showSuccess("Image loaded successfully.");
    } catch (error) {
      dismissToast(toastId);
      console.error("File load error:", error);
      showError("Failed to load image file.");
    }
  }, [currentState, layers, recordHistory, resetProjectState]);

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
    
    resetProjectState();
    setImage(dataUrl);
    setDimensions(newDimensions);
    setFileInfo(newFileInfo);
    setAspect(width / height);
    setHistory([newHistoryItem]);
    setCurrentHistoryIndex(0);
    setLayers(newLayers);
    showSuccess("New project created.");
  }, [resetProjectState]);

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
      
      resetProjectState();
      setImage(projectData.sourceImage);
      setDimensions(newDimensions);
      setFileInfo(projectData.fileInfo);
      setAspect(newDimensions.width / newDimensions.height);
      setHistory(projectData.history);
      setCurrentHistoryIndex(projectData.currentHistoryIndex);
      setLayers(lastLayers);
      setPendingCrop(lastState.crop);
      setSelectedLayerId(null);
      setSelectionPath(null);
      setSelectionMaskDataUrl(null);

      dismissToast(toastId);
      showSuccess(`Project "${projectData.fileInfo?.name}" loaded successfully.`);
    } catch (error: any) {
      dismissToast(toastId);
      console.error("Project load error:", error);
      showError(error.message || "Failed to load project file.");
    }
  }, [resetProjectState]);

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
  
  useEffect(() => {
    // Sync pendingCrop when history changes
    setPendingCrop(currentState.crop);
  }, [currentState.crop]);

  const applyCrop = useCallback(() => {
    if (!pendingCrop) return;
    const newState = { ...currentState, crop: pendingCrop };
    updateCurrentState(newState);
    recordHistory("Apply Crop", newState, layers);
    setActiveTool(null);
  }, [currentState, pendingCrop, layers, recordHistory, setActiveTool, updateCurrentState]);

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
    setForegroundColor(color);
  }, []);

  const handleBackgroundColorChange = useCallback((color: string) => {
    setBackgroundColor(color);
  }, []);

  const handleSwapColors = useCallback(() => {
    setForegroundColor(backgroundColor);
    setBackgroundColor(foregroundColor);
  }, [foregroundColor, backgroundColor]);

  const handleColorPick = useCallback((color: string) => {
    setForegroundColor(color);
  }, []);

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
    
    setLayers(updatedLayers);
    setSelectedLayerId(newLayer.id);
    recordHistory("Apply Generative Fill", currentState, updatedLayers);
    setSelectionPath(null);
    setSelectionMaskDataUrl(null);
    showSuccess("Generative fill applied as a new layer.");
  }, [dimensions, layers, currentState, recordHistory, setLayers, setSelectedLayerId, setSelectionPath, setSelectionMaskDataUrl]);

  // --- Selection/Masking Handlers ---
  const clearSelectionState = useCallback(() => {
    setSelectionPath(null);
    setSelectionMaskDataUrl(null);
  }, []);

  const handleSelectionBrushStroke = useCallback((strokeDataUrl: string, operation: 'add' | 'subtract') => {
    if (!selectionMaskDataUrl) {
      setSelectionMaskDataUrl(strokeDataUrl);
      setSelectionPath(null);
      showSuccess("Selection mask created.");
    } else {
      // Stub: In a real app, we would merge strokeDataUrl onto selectionMaskDataUrl using canvas composite operations.
      setSelectionMaskDataUrl(strokeDataUrl);
      setSelectionPath(null);
      showSuccess("Selection mask updated (stub merge).");
    }
  }, [selectionMaskDataUrl, setSelectionMaskDataUrl, setSelectionPath]);

  const clearSelectionMask = useCallback(() => {
    clearSelectionState();
    showSuccess("Selection cleared.");
  }, [clearSelectionState]);

  const applyMaskToSelectionPath = useCallback(() => {
    showError("Use 'Refine Selection' to convert Lasso path to a mask first.");
  }, []);

  const convertSelectionPathToMask = useCallback(async () => {
    if (!selectionPath || !dimensions) {
      showError("No lasso selection path found.");
      return;
    }
    const toastId = showLoading("Refining selection...");
    try {
      const { polygonToMaskDataUrl } = await import("@/utils/maskUtils");
      const maskDataUrl = await polygonToMaskDataUrl(selectionPath, dimensions.width, dimensions.height);
      
      setSelectionMaskDataUrl(maskDataUrl);
      setSelectionPath(null);
      dismissToast(toastId);
      showSuccess("Selection refined to mask.");
    } catch (error) {
      dismissToast(toastId);
      showError("Failed to refine selection.");
    }
  }, [selectionPath, dimensions, setSelectionMaskDataUrl, setSelectionPath]);

  // --- Selective Blur Handlers ---
  const handleSelectiveBlurStrengthChange = useCallback((value: number) => {
    setSelectiveBlurAmount(value);
  }, []);

  const handleSelectiveBlurStrengthCommit = useCallback((value: number) => {
    recordHistory(`Set Selective Blur Strength to ${value}%`, currentState, layers);
  }, [currentState, layers, recordHistory]);

  const handleSelectiveBlurStroke = useCallback((strokeDataUrl: string, operation: 'add' | 'subtract') => {
    if (!selectiveBlurMask) {
      setSelectiveBlurMask(strokeDataUrl);
      showSuccess("Selective blur mask created.");
    } else {
      // Stub: In a real app, we would merge strokeDataUrl onto selectiveBlurMask using canvas composite operations.
      setSelectiveBlurMask(strokeDataUrl);
      showSuccess("Selective blur mask updated (stub merge).");
    }
  }, [selectiveBlurMask, setSelectiveBlurMask]);

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
    
    setDimensions(templateDimensions);
    setAspect(templateDimensions.width / templateDimensions.height);
    setHistory([newHistoryItem]);
    setCurrentHistoryIndex(0);
    setLayers(templateLayers);
    setSelectedLayerId(null);
    setPendingCrop(newState.crop);
    setSelectionPath(null);
    setSelectionMaskDataUrl(null);
    
    showSuccess("Template applied.");
  }, [image, setDimensions, setAspect, setHistory, setCurrentHistoryIndex, setLayers, setSelectedLayerId, setPendingCrop, setSelectionPath, setSelectionMaskDataUrl]);

  // --- Brush State Management ---
  const brushState: BrushState = useMemo(() => ({
    ...brushStateInternal,
    color: foregroundColor,
  }), [brushStateInternal, foregroundColor]);
  
  // FIX: Create a wrapper function for setBrushStateInternal to handle partial updates
  const setBrushState = useCallback((updates: Partial<Omit<BrushState, 'color'>>) => {
    setBrushStateInternal(prev => ({ ...prev, ...updates }));
  }, []);

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
    loadImageData: handleFileSelect,
    setDimensions, // Exposed for Workspace image load handler

    // History Actions
    handleUndo,
    handleRedo,
    jumpToHistory,
    canUndo: canUndoLayers,
    canRedo: canRedoLayers,
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
    setAspect,

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
    selectedLayerId, // Use state variable
    setSelectedLayer: setSelectedLayerId, // Use state setter
    updateLayer,
    commitLayerChange,
    handleLayerPropertyCommit,
    handleLayerOpacityChange,
    handleLayerOpacityCommit,
    commitTemporaryLayerChange,
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
    setBrushState, // Use the wrapped setter
    gradientToolState,
    setGradientToolState,
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