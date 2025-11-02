import { useCallback } from 'react';
import type { Layer, EditState, HistoryItem, NewProjectSettings, ImageLayerData, DrawingLayerData, Dimensions } from '@/types/editor';
import { showSuccess, showError } from '@/utils/toast';
import { loadProjectFromFile, ProjectFile } from '@/utils/projectUtils';
import ExifReader from 'exifreader';
import { initialLayerState } from '@/types/editor';
import { v4 as uuidv4 } from 'uuid';
import * as React from 'react'; // ADDED

export const useImageLoader = (
  setImage: (image: string | null) => void,
  setDimensions: (dimensions: { width: number; height: number } | null) => void,
  setFileInfo: (info: { name: string; size: number } | null) => void,
  setExifData: (data: any) => void,
  setLayers: (layers: Layer[]) => void,
  resetAllEdits: () => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  setCurrentEditState: React.Dispatch<React.SetStateAction<EditState>>, // FIX 11
  currentEditState: EditState,
  initialEditState: EditState,
  initialLayerState: Layer[],
  setSelectedLayerId: (id: string | null) => void,
  clearSelectionState: () => void,
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>, // FIX 12
  setCurrentHistoryIndex: React.Dispatch<React.SetStateAction<number>>, // FIX 12
) => {
  const handleImageLoad = useCallback((file: File) => {
    if (file.name.endsWith(".nanoedit")) {
      // Handle project file loading
      loadProjectFromFile(file)
        .then(projectData => {
          resetAllEdits();
          setImage(projectData.sourceImage);
          setFileInfo(projectData.fileInfo);
          setLayers(projectData.history[projectData.currentHistoryIndex].layers); // Use layers from history entry
          setHistory(projectData.history);
          setCurrentHistoryIndex(projectData.currentHistoryIndex);
          setCurrentEditState(projectData.history[projectData.currentHistoryIndex].state);
          setSelectedLayerId(projectData.history[projectData.currentHistoryIndex].layers[0]?.id || null); // Use layers from history entry
          showSuccess(`Project "${file.name}" loaded successfully.`);
        })
        .catch(error => {
          showError(error.message);
        });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        // 1. Read EXIF data
        let exif = null;
        try {
          exif = await ExifReader.load(file);
        } catch (e) {
          console.warn("Could not read EXIF data:", e);
        }

        // 2. Reset state and set new image
        resetAllEdits();
        setImage(dataUrl);
        setDimensions({ width, height });
        setFileInfo({ name: file.name, size: file.size });
        setExifData(exif);

        // 3. Create new background layer
        const newBackgroundLayer: Layer = {
          id: 'background',
          name: file.name,
          type: 'image',
          visible: true,
          opacity: 100,
          blendMode: 'normal',
          isLocked: true,
          maskDataUrl: null,
          dataUrl: dataUrl,
          exifData: exif,
          x: 50, y: 50, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1,
        } as ImageLayerData;

        setLayers([newBackgroundLayer]);
        setSelectedLayerId('background');

        // 4. Record initial history state
        recordHistory('Image Loaded', currentEditState, [newBackgroundLayer]);
        showSuccess(`Image "${file.name}" loaded.`);
      };
      img.onerror = () => {
        showError("Failed to load image.");
      };
      reader.readAsDataURL(file);
    };
    reader.onerror = () => {
      showError("Failed to read file.");
    };
    reader.readAsDataURL(file);
  }, [
    resetAllEdits, setImage, setDimensions, setFileInfo, setExifData, setLayers,
    recordHistory, currentEditState, setCurrentEditState, setSelectedLayerId, clearSelectionState,
    setHistory, setCurrentHistoryIndex
  ]);

  const handleNewProject = useCallback((settings: NewProjectSettings) => {
    resetAllEdits();
    const { width, height, backgroundColor, colorMode } = settings;

    // 1. Create a blank canvas image data URL
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }
    const dataUrl = canvas.toDataURL('image/png');

    // 2. Set core state
    setImage(dataUrl);
    setDimensions({ width, height });
    setFileInfo({ name: 'New Project', size: 0 });
    setExifData(null);
    setCurrentEditState(prev => ({ ...prev, colorMode: colorMode as EditState['colorMode'] }));

    // 3. Create new background layer (as a drawing layer since it's editable content)
    const newBackgroundLayer: Layer = {
      id: 'background',
      name: 'Background',
      type: 'drawing',
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      isLocked: true,
      maskDataUrl: null,
      dataUrl: dataUrl,
      x: 50, y: 50, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1,
    } as DrawingLayerData;

    setLayers([newBackgroundLayer]);
    setSelectedLayerId('background');

    // 4. Record initial history state
    recordHistory('New Project Created', { ...currentEditState, colorMode: colorMode as EditState['colorMode'] }, [newBackgroundLayer]);
    showSuccess(`New project created: ${width}x${height}.`);
  }, [resetAllEdits, setImage, setDimensions, setFileInfo, setExifData, setLayers, recordHistory, currentEditState, setCurrentEditState, setSelectedLayerId]);

  const handleLoadProject = useCallback(() => {
    // This function is a trigger for the file input in Index.tsx
    document.getElementById('file-upload-input')?.click();
  }, []);
  
  const handleLoadTemplate = useCallback(() => {
    // Stub for loading template data
    showError("Template loading is a stub.");
  }, []);
  
  const handleNewFromClipboard = useCallback((importInSameProject: boolean) => {
    showError("New from clipboard is a stub.");
  }, []);

  return { handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate, handleNewFromClipboard };
};