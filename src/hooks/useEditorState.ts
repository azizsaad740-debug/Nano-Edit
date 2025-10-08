import { useState, useRef, useCallback } from "react";
import { type Crop } from 'react-image-crop';
import { useHotkeys } from 'react-hotkeys-hook';
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { downloadImage, copyImageToClipboard } from "@/utils/imageUtils";

export interface EditState {
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  effects: {
    blur: number;
    hueShift: number;
  };
  selectedFilter: string;
  transforms: {
    rotation: number;
    scaleX: number;
    scaleY: number;
  };
  crop: Crop | undefined;
}

export interface HistoryItem {
  name: string;
  state: EditState;
}

const initialEditState: EditState = {
  adjustments: { brightness: 100, contrast: 100, saturation: 100 },
  effects: { blur: 0, hueShift: 0 },
  selectedFilter: "",
  transforms: { rotation: 0, scaleX: 1, scaleY: 1 },
  crop: undefined,
};

const initialHistoryItem: HistoryItem = { name: "Initial State", state: initialEditState };

export const useEditorState = () => {
  const [image, setImage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([initialHistoryItem]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>();
  const [isPreviewingOriginal, setIsPreviewingOriginal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const currentState = history[currentHistoryIndex].state;

  const recordHistory = useCallback((name: string, state: EditState) => {
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    setHistory([...newHistory, { name, state }]);
    setCurrentHistoryIndex(newHistory.length);
  }, [history, currentHistoryIndex]);

  const updateCurrentState = useCallback((updates: Partial<EditState>) => {
    const newState = { ...currentState, ...updates };
    const newHistory = [...history];
    newHistory[currentHistoryIndex] = { ...newHistory[currentHistoryIndex], state: newState };
    setHistory(newHistory);
  }, [currentState, history, currentHistoryIndex]);

  const handleFileSelect = useCallback((file: File | undefined) => {
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result as string);
          setHistory([initialHistoryItem]);
          setCurrentHistoryIndex(0);
          showSuccess("Image uploaded successfully.");
        };
        reader.readAsDataURL(file);
      } else {
        showError("Invalid file type. Please upload an image.");
      }
    }
  }, []);

  const handleUrlImageLoad = useCallback(async (url: string) => {
    const toastId = showLoading("Loading image from URL...");
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Network response was not ok, status: ${response.status}`);
      }
      const blob = await response.blob();

      if (!blob.type.startsWith('image/')) {
        dismissToast(toastId);
        showError("The provided URL does not point to a valid image.");
        return;
      }

      const filename = url.substring(url.lastIndexOf('/') + 1).split('?')[0] || 'image.jpg';
      const file = new File([blob], filename, { type: blob.type });
      dismissToast(toastId);
      handleFileSelect(file);
    } catch (error) {
      dismissToast(toastId);
      console.error("Failed to fetch image from URL:", error);
      showError("Could not load image. Check the URL and CORS policy.");
    }
  }, [handleFileSelect]);

  const handleAdjustmentChange = useCallback((adjustment: string, value: number) => {
    const newAdjustments = { ...currentState.adjustments, [adjustment]: value };
    updateCurrentState({ adjustments: newAdjustments });
  }, [currentState.adjustments, updateCurrentState]);

  const handleAdjustmentCommit = useCallback((adjustment: string, value: number) => {
    const newAdjustments = { ...currentState.adjustments, [adjustment]: value };
    const name = `Adjust ${adjustment.charAt(0).toUpperCase() + adjustment.slice(1)}`;
    recordHistory(name, { ...currentState, adjustments: newAdjustments });
  }, [currentState, recordHistory]);

  const handleEffectChange = useCallback((effect: string, value: number) => {
    const newEffects = { ...currentState.effects, [effect]: value };
    updateCurrentState({ effects: newEffects });
  }, [currentState.effects, updateCurrentState]);

  const handleEffectCommit = useCallback((effect: string, value: number) => {
    const newEffects = { ...currentState.effects, [effect]: value };
    const name = `Adjust ${effect.charAt(0).toUpperCase() + effect.slice(1)}`;
    recordHistory(name, { ...currentState, effects: newEffects });
  }, [currentState, recordHistory]);

  const handleFilterChange = useCallback((filterValue: string, filterName: string) => {
    const name = filterName === "None" ? "Remove Filter" : `Apply ${filterName} Filter`;
    recordHistory(name, { ...currentState, selectedFilter: filterValue });
  }, [currentState, recordHistory]);

  const handleTransformChange = useCallback((transformType: string) => {
    const newTransforms = { ...currentState.transforms };
    const nameMap: { [key: string]: string } = {
      'rotate-left': 'Rotate Left',
      'rotate-right': 'Rotate Right',
      'flip-horizontal': 'Flip Horizontal',
      'flip-vertical': 'Flip Vertical',
    };
    switch (transformType) {
      case "rotate-left":
        newTransforms.rotation = (newTransforms.rotation - 90 + 360) % 360;
        break;
      case "rotate-right":
        newTransforms.rotation = (newTransforms.rotation + 90) % 360;
        break;
      case "flip-horizontal":
        newTransforms.scaleX *= -1;
        break;
      case "flip-vertical":
        newTransforms.scaleY *= -1;
        break;
      default:
        return;
    }
    recordHistory(nameMap[transformType], { ...currentState, transforms: newTransforms });
  }, [currentState, recordHistory]);

  const handleCropChange = useCallback((newCrop: Crop) => {
    updateCurrentState({ crop: newCrop });
  }, [updateCurrentState]);

  const handleCropComplete = useCallback((newCrop: Crop) => {
    recordHistory('Crop Image', { ...currentState, crop: newCrop });
  }, [currentState, recordHistory]);

  const handleReset = useCallback(() => {
    recordHistory('Reset All', initialEditState);
  }, [recordHistory]);

  const handleUndo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(currentHistoryIndex - 1);
    }
  }, [currentHistoryIndex]);

  const handleRedo = useCallback(() => {
    if (currentHistoryIndex < history.length - 1) {
      setCurrentHistoryIndex(currentHistoryIndex + 1);
    }
  }, [currentHistoryIndex, history.length]);

  const jumpToHistory = useCallback((index: number) => {
    setCurrentHistoryIndex(index);
  }, []);

  const handleDownload = useCallback((exportOptions: { format: string; quality: number }) => {
    if (!imgRef.current) return;
    downloadImage(
      {
        image: imgRef.current,
        ...currentState,
      },
      exportOptions
    );
  }, [currentState]);

  const handleCopy = useCallback(() => {
    if (!imgRef.current) return;
    copyImageToClipboard({
      image: imgRef.current,
      ...currentState,
    });
  }, [currentState]);

  useHotkeys('ctrl+z, cmd+z', handleUndo, { preventDefault: true });
  useHotkeys('ctrl+y, cmd+shift+z', handleRedo, { preventDefault: true });
  useHotkeys('ctrl+s, cmd+s', (e) => { e.preventDefault(); if (image) setIsExporting(true); }, { enabled: !!image }, [image]);
  useHotkeys('ctrl+shift+c, cmd+shift+c', (e) => { e.preventDefault(); handleCopy(); }, { enabled: !!image }, [handleCopy]);
  useHotkeys('r', () => handleTransformChange('rotate-right'), { enabled: !!image, preventDefault: true });
  useHotkeys('shift+r', () => handleTransformChange('rotate-left'), { enabled: !!image, preventDefault: true });
  useHotkeys('h', () => handleTransformChange('flip-horizontal'), { enabled: !!image, preventDefault: true });
  useHotkeys('v', () => handleTransformChange('flip-vertical'), { enabled: !!image, preventDefault: true });

  const canUndo = currentHistoryIndex > 0;
  const canRedo = currentHistoryIndex < history.length - 1;

  return {
    image,
    imgRef,
    currentState,
    history,
    currentHistoryIndex,
    aspect,
    canUndo,
    canRedo,
    handleFileSelect,
    handleUrlImageLoad,
    handleAdjustmentChange,
    handleAdjustmentCommit,
    handleEffectChange,
    handleEffectCommit,
    handleFilterChange,
    handleTransformChange,
    handleCropChange,
    handleCropComplete,
    handleReset,
    handleUndo,
    handleRedo,
    jumpToHistory,
    handleDownload,
    handleCopy,
    setAspect,
    isPreviewingOriginal,
    setIsPreviewingOriginal,
    isExporting,
    setIsExporting,
  };
};