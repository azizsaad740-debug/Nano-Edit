import { useCallback } from 'react';
import type { Layer, EditState, HistoryItem, NewProjectSettings, ImageLayerData, DrawingLayerData, Dimensions } from '@/types/editor';
import { isImageOrDrawingLayer } from '@/types/editor';
import { showSuccess, showError } from '@/utils/toast';
import { loadProjectFromFile, ProjectFile } from '@/utils/projectUtils';
import ExifReader from 'exifreader';
import { initialLayerState } from '@/types/editor';
import { v4 as uuidv4 } from 'uuid';
import * as React from 'react';
import type { TemplateProjectData } from '@/types/template'; // <-- ADDED

export const useImageLoader = (
  setImage: (image: string | null) => void,
  setDimensions: (dimensions: { width: number; height: number } | null) => void,
  setFileInfo: (info: { name: string; size: number } | null) => void,
  setExifData: (data: any) => void,
  setLayers: (layers: Layer[]) => void,
  resetAllEdits: () => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  setCurrentEditState: React.Dispatch<React.SetStateAction<EditState>>,
  currentEditState: EditState,
  initialEditState: EditState,
  initialLayerState: Layer[],
  setSelectedLayerId: (id: string | null) => void,
  clearSelectionState: () => void,
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>,
  setCurrentHistoryIndex: React.Dispatch<React.SetStateAction<number>>,
) => {
  const handleImageLoad = useCallback((file: File) => {
    if (file.name.endsWith(".nanoedit")) {
      // Handle project file loading
      loadProjectFromFile(file)
        .then(projectData => {
          resetAllEdits();
          
          // 1. Restore core state from the current history entry
          const currentEntry = projectData.history[projectData.currentHistoryIndex];
          if (!currentEntry) throw new Error("Corrupted project history.");

          // 2. Determine dimensions from the background layer in the restored state
          const backgroundLayer = currentEntry.layers.find(l => l.id === 'background');
          let restoredDimensions: Dimensions | null = null;
          if (backgroundLayer) {
            // Assuming background layer width/height are 100% relative to canvas dimensions
            // We need to infer the original canvas dimensions if they were saved, but since they aren't, 
            // we rely on the image data if available.
            if (isImageOrDrawingLayer(backgroundLayer) && backgroundLayer.dataUrl) {
              const img = new Image();
              img.onload = () => {
                setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
              };
              img.src = backgroundLayer.dataUrl;
            }
          }

          setImage(projectData.sourceImage);
          setFileInfo(projectData.fileInfo);
          setLayers(currentEntry.layers);
          setHistory(projectData.history);
          setCurrentHistoryIndex(projectData.currentHistoryIndex);
          setCurrentEditState(currentEntry.state);
          setSelectedLayerId(currentEntry.layers[0]?.id || null);
          
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

        const newLayers = [newBackgroundLayer];
        setLayers(newLayers);
        setSelectedLayerId('background');

        // 4. Record initial history state
        recordHistory('Image Loaded', currentEditState, newLayers);
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

    const newLayers = [newBackgroundLayer];
    setLayers(newLayers);
    setSelectedLayerId('background');

    // 4. Record initial history state
    recordHistory('New Project Created', { ...currentEditState, colorMode: colorMode as EditState['colorMode'] }, newLayers);
    showSuccess(`New project created: ${width}x${height}.`);
  }, [resetAllEdits, setImage, setDimensions, setFileInfo, setExifData, setLayers, recordHistory, currentEditState, setCurrentEditState, setSelectedLayerId]);

  const handleLoadProject = useCallback(() => {
    // This function is a trigger for the file input in Index.tsx
    document.getElementById('file-upload-input')?.click();
  }, []);
  
  const handleLoadTemplate = useCallback((templateData: TemplateProjectData, templateName: string) => {
    const { editState: partialEditState, layers: templateLayers, dimensions: templateDimensions } = templateData;
    
    resetAllEdits();
    
    // 1. Apply dimensions
    setDimensions(templateDimensions);
    
    // 2. Apply layers
    setLayers(templateLayers);
    
    // 3. Apply edit state (merging with initial state)
    setCurrentEditState(prev => ({
      ...prev,
      ...partialEditState,
      // Ensure complex objects are merged correctly if they exist in the template
      adjustments: { ...prev.adjustments, ...partialEditState.adjustments },
      grading: { ...prev.grading, ...partialEditState.grading },
      effects: { ...prev.effects, ...partialEditState.effects },
      // Note: We rely on the template provider to ensure layers contain the background image dataUrl
    }));
    
    // 4. Set background image/data if available in layers
    const backgroundLayer = templateLayers.find(l => l.id === 'background');
    if (backgroundLayer && isImageOrDrawingLayer(backgroundLayer)) {
      setImage(backgroundLayer.dataUrl);
      setFileInfo({ name: `Template: ${templateName}`, size: 0 });
    } else {
      setImage(null);
      setFileInfo(null);
    }

    // 5. Record initial history state
    const newLayers = templateLayers;
    recordHistory(`Template Loaded: ${templateName}`, currentEditState, newLayers);
    setSelectedLayerId('background');
    
    showSuccess(`Template "${templateName}" loaded successfully.`);
  }, [resetAllEdits, setDimensions, setLayers, setCurrentEditState, recordHistory, currentEditState, setImage, setFileInfo, setSelectedLayerId]);

  const handleNewFromClipboard = useCallback((importInSameProject: boolean) => {
    showError("New from clipboard is a stub.");
  }, []);

  return { handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate, handleNewFromClipboard };
};