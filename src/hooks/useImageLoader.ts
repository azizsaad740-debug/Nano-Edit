import { useCallback } from 'react';
import type { Layer, EditState, HistoryItem, NewProjectSettings, ImageLayerData, DrawingLayerData } from '@/types/editor';
import { showSuccess, showError } from '@/utils/toast';
import { loadProjectFromFile } from '@/utils/projectUtils';
import ExifReader from 'exifreader';

export const useImageLoader = (
  setImage: (image: string | null) => void,
  setDimensions: (dimensions: { width: number; height: number } | null) => void,
  setFileInfo: (info: { name: string; size: number } | null) => void,
  setExifData: (data: any) => void,
  setLayers: (layers: Layer[]) => void,
  resetAllEdits: () => void,
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void,
  setCurrentEditState: (state: EditState) => void,
  initialEditState: EditState,
  initialLayerState: Layer[],
  initialHistoryItem: HistoryItem,
  setSelectedLayerId: (id: string | null) => void,
  clearSelectionState: () => void,
) => {
  const handleImageLoad = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        
        // 1. Read EXIF data
        let exif = null;
        try {
          const tags = await ExifReader.load(file);
          exif = tags;
        } catch (error) {
          console.warn("Could not read EXIF data:", error);
        }

        // 2. Update state
        resetAllEdits();
        setImage(src);
        setDimensions({ width, height });
        setFileInfo({ name: file.name, size: file.size });
        setExifData(exif);
        
        // 3. Set initial layer state (Background layer)
        const backgroundLayer: ImageLayerData = {
          ...(initialLayerState[0] as ImageLayerData),
          dataUrl: src,
          scaleX: 1, // ADDED
          scaleY: 1, // ADDED
        };
        setLayers([backgroundLayer]);
        setSelectedLayerId('background');
        
        recordHistory("Image Loaded", initialEditState, [backgroundLayer]);
        showSuccess(`Image "${file.name}" loaded successfully.`);
      };
      img.onerror = () => {
        showError("Failed to load image.");
      };
      img.src = src;
    };
    reader.onerror = () => {
      showError("Failed to read file.");
    };
    reader.readAsDataURL(file);
  }, [resetAllEdits, setImage, setDimensions, setFileInfo, setExifData, setLayers, setSelectedLayerId, recordHistory, initialEditState, initialLayerState]);

  const handleNewProject = useCallback((settings: NewProjectSettings) => {
    resetAllEdits();
    setDimensions({ width: settings.width, height: settings.height });
    setFileInfo({ name: "New Project", size: 0 });
    setExifData(null);
    setImage(null); // No base image, just a canvas
    
    // Create a transparent drawing layer as the background
    const canvas = document.createElement('canvas');
    canvas.width = settings.width;
    canvas.height = settings.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = settings.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const dataUrl = canvas.toDataURL();

    const backgroundLayer: DrawingLayerData = {
      id: 'background',
      name: 'Background',
      type: 'drawing', // Use drawing type for a colored background
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      dataUrl: dataUrl,
      isLocked: true,
      x: 50, y: 50, width: 100, height: 100, rotation: 0,
      scaleX: 1, scaleY: 1, // ADDED
    };
    
    setLayers([backgroundLayer]);
    setSelectedLayerId('background');
    recordHistory("New Project Created", initialEditState, [backgroundLayer]);
    showSuccess("New project created.");
  }, [resetAllEdits, setDimensions, setFileInfo, setExifData, setImage, setLayers, setSelectedLayerId, recordHistory, initialEditState]);

  const handleLoadProject = useCallback(async (file: File) => {
    try {
      const projectData = await loadProjectFromFile(file);
      
      // 1. Reset state
      resetAllEdits();
      clearSelectionState();

      // 2. Apply history state
      const currentHistory = projectData.history[projectData.currentHistoryIndex];
      
      if (currentHistory) {
        setCurrentEditState(currentHistory.state);
        setLayers(currentHistory.layers);
        
        // 3. Set core properties
        setImage(projectData.sourceImage);
        setFileInfo(projectData.fileInfo);
        
        // 4. Determine dimensions from layers (assuming background layer holds dimensions)
        const backgroundLayer = currentHistory.layers.find(l => l.id === 'background') as ImageLayerData | DrawingLayerData | undefined;
        if (backgroundLayer && backgroundLayer.dataUrl) {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = backgroundLayer.dataUrl;
          });
          setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        } else {
          // Fallback if no image data is present (e.g., project started blank)
          setDimensions({ width: 1920, height: 1080 }); 
        }
        
        // 5. Rebuild history stack (stub: full history rebuild is complex, just set current state)
        // In a full implementation, we would load projectData.history into the history state.
        
        setSelectedLayerId(null);
        showSuccess(`Project "${file.name}" loaded successfully.`);
      } else {
        throw new Error("Project file is empty or corrupted.");
      }
    } catch (error: any) {
      console.error("Error loading project:", error);
      showError(error.message || "Failed to load project file.");
    }
  }, [resetAllEdits, clearSelectionState, setCurrentEditState, setLayers, setImage, setFileInfo, setDimensions, setSelectedLayerId]);

  const handleLoadTemplate = useCallback(async (template: any) => {
    const { data, dimensions: templateDimensions } = template.data;
    
    resetAllEdits();
    clearSelectionState();
    
    // 1. Set dimensions
    setDimensions(templateDimensions);
    setFileInfo({ name: template.name, size: 0 });
    
    // 2. Set layers
    setLayers(data.layers);
    
    // 3. Set edit state
    setCurrentEditState({ ...initialEditState, ...data.editState });
    
    // 4. Handle background image (if template uses a placeholder image)
    const backgroundLayer = data.layers.find((l: Layer) => l.id === 'background') as ImageLayerData | DrawingLayerData | undefined;
    if (backgroundLayer && backgroundLayer.dataUrl) {
      setImage(backgroundLayer.dataUrl);
    } else {
      // Use a placeholder image if the template is purely layered/vector
      setImage("https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=800&q=80");
    }
    
    setSelectedLayerId(null);
    recordHistory(`Load Template: ${template.name}`, { ...initialEditState, ...data.editState }, data.layers);
    showSuccess(`Template "${template.name}" loaded.`);
  }, [resetAllEdits, clearSelectionState, setDimensions, setFileInfo, setLayers, setCurrentEditState, setImage, setSelectedLayerId, recordHistory, initialEditState]);

  return { handleImageLoad, handleNewProject, handleLoadProject, handleLoadTemplate };
};