import React, { useState, useCallback, useMemo } from 'react';
import { showError, showSuccess } from '@/utils/toast';
import type { Point, Dimensions, ActiveTool, GradientToolState, Layer } from '@/types/editor';
import { useSelection } from './useSelection';
import { floodFillToMaskDataUrl, objectSelectToMaskDataUrl } from '@/utils/maskUtils';

// Define WorkspaceRef locally as it seems missing from types/editor
type WorkspaceRef = HTMLDivElement;

interface UseWorkspaceInteractionProps {
  workspaceRef: React.RefObject<WorkspaceRef>;
  imgRef: React.RefObject<HTMLImageElement>;
  activeTool: ActiveTool | null;
  dimensions: Dimensions | null;
  setSelectionPath: (path: Point[] | null) => void;
  setSelectionMaskDataUrl: (url: string | null) => void;
  clearSelectionState: () => void;
  gradientToolState: GradientToolState;
  setSelectedLayerId: (id: string | null) => void;
  layers: Layer[];
  zoom: number; // External zoom state
  setZoom: (zoom: number) => void; // External zoom setter
  setMarqueeStart: (point: Point | null) => void;
  setMarqueeCurrent: (point: Point | null) => void;
  handleMarqueeSelectionComplete: (start: Point, end: Point) => Promise<void>;
  currentEditState: any; // Simplified type
  setCloneSourcePoint: (point: Point | null) => void;
  handleAddTextLayer: (coords: Point) => void;
  foregroundColor: string;
  setForegroundColor: (color: string) => void;
  setActiveTool: (tool: ActiveTool | null) => void;
  selectionSettings: any; // Added selectionSettings
  recordHistory: (name: string, state: any, layers: Layer[]) => void; // Added recordHistory
}

export const useWorkspaceInteraction = ({
  workspaceRef,
  imgRef,
  activeTool,
  dimensions,
  setSelectionPath,
  setSelectionMaskDataUrl,
  clearSelectionState,
  gradientToolState,
  setSelectedLayerId,
  layers,
  zoom: externalZoom,
  setZoom: setExternalZoom,
  setMarqueeStart,
  setMarqueeCurrent,
  handleMarqueeSelectionComplete,
  currentEditState,
  setCloneSourcePoint,
  handleAddTextLayer,
  foregroundColor,
  setForegroundColor,
  setActiveTool,
  selectionSettings,
  recordHistory,
}: UseWorkspaceInteractionProps) => {
  const [workspaceZoom, setWorkspaceZoom] = useState(externalZoom);
  
  React.useEffect(() => {
    setWorkspaceZoom(externalZoom);
  }, [externalZoom]);

  const [isMouseOverImage, setIsMouseOverImage] = useState<boolean>(false);
  const [gradientStart, setGradientStart] = useState<Point | null>(null);
  const [gradientCurrent, setGradientCurrent] = useState<Point | null>(null);
  const [isGradientActive, setIsGradientActive] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panOrigin, setPanOrigin] = useState<Point | null>(null);
  
  // Local state to track marquee start/end in screen coordinates
  const [marqueeStartScreen, setMarqueeStartScreen] = useState<Point | null>(null);
  const [isMarqueeActive, setIsMarqueeActive] = useState(false);
  
  // Helper to convert screen coordinates to image pixel coordinates (0 to W/H)
  const getPointOnImage = useCallback((e: MouseEvent | React.MouseEvent): Point | null => {
    if (!imgRef.current || !dimensions || !workspaceRef.current) return null;
    
    const imgRect = imgRef.current.getBoundingClientRect();
    
    const clientX = 'clientX' in e ? e.clientX : e.nativeEvent.clientX;
    const clientY = 'clientY' in e ? e.clientY : e.nativeEvent.clientY;
    
    // Calculate coordinates relative to the image element's top-left corner on screen
    const xScreen = clientX - imgRect.left;
    const yScreen = clientY - imgRect.top;
    
    // Convert screen pixels relative to the scaled image to natural image pixels
    const scaleFactorX = dimensions.width / imgRect.width;
    const scaleFactorY = dimensions.height / imgRect.height;
    
    const x = Math.round(xScreen * scaleFactorX);
    const y = Math.round(yScreen * scaleFactorY);
    
    // Check if the click is within the image bounds (in natural pixels)
    if (x < 0 || x > dimensions.width || y < 0 || y > dimensions.height) {
        return null;
    }
    
    return { x, y };
  }, [imgRef, dimensions, workspaceRef]);


  // --- Zoom/Fit Handlers ---
  const handleFitScreen = useCallback(() => {
    const newZoom = 1; 
    setWorkspaceZoom(newZoom);
    setExternalZoom(newZoom);
  }, [setExternalZoom]);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(5, workspaceZoom + 0.1);
    setWorkspaceZoom(newZoom);
    setExternalZoom(newZoom);
  }, [setExternalZoom, workspaceZoom]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(0.1, workspaceZoom - 0.1);
    setWorkspaceZoom(newZoom);
    setExternalZoom(newZoom);
  }, [setExternalZoom, workspaceZoom]);
  
  // --- Interaction Handlers ---
  const handleWorkspaceMouseDown = useCallback(async (e: React.MouseEvent) => {
    if (!dimensions) return;
    
    const point = getPointOnImage(e);
    
    // 1. Clone Stamp Source Selection (Alt/Option + Click)
    if ((activeTool === 'cloneStamp' || activeTool === 'patternStamp') && (e.altKey || e.metaKey)) {
      if (point) {
        setCloneSourcePoint(point);
        showSuccess("Clone source set.");
      } else {
        showError("Click inside the image bounds to set clone source.");
      }
      return;
    }
    
    // 2. Text Tool Activation
    if (activeTool === 'text' && point) {
        // Convert natural pixel coordinates (0 to W/H) to percentage coordinates (0 to 100)
        const xPercent = (point.x / dimensions.width) * 100;
        const yPercent = (point.y / dimensions.height) * 100;
        handleAddTextLayer({ x: xPercent, y: yPercent });
        setActiveTool(null); // Deselect tool after placement
        return;
    }
    
    // 3. Eyedropper Tool
    if (activeTool === 'eyedropper' && point && imgRef.current) {
        // Stub: In a real app, we'd read the pixel color from the canvas composite.
        const sampledColor = '#FF0000'; // Stubbed sampled color
        setForegroundColor(sampledColor);
        setActiveTool(null);
        showSuccess(`Color sampled: ${sampledColor}`);
        return;
    }
    
    // 4. Magic Wand / Quick Select / Object Select
    if (activeTool === 'magicWand' || activeTool === 'quickSelect' || activeTool === 'objectSelect') {
        if (!point) {
            showError("Click inside the image bounds to select.");
            return;
        }
        
        let maskDataUrl: string | null = null;
        let historyName = "";
        
        if (activeTool === 'magicWand') {
            // Magic Wand uses flood fill logic (stubbed in maskUtils)
            maskDataUrl = await floodFillToMaskDataUrl(point, dimensions, selectionSettings.tolerance);
            historyName = "Magic Wand Selection";
        } else if (activeTool === 'quickSelect') {
            // Quick Select uses brush/drag logic (stubbed as a simple area selection)
            maskDataUrl = await floodFillToMaskDataUrl(point, dimensions, 64); // Use a fixed tolerance for quick select stub
            historyName = "Quick Selection";
        } else if (activeTool === 'objectSelect') {
            // Object Select uses AI (stubbed in maskUtils)
            maskDataUrl = await objectSelectToMaskDataUrl(dimensions);
            historyName = "Object Selection (AI)";
        }
        
        if (maskDataUrl) {
            setSelectionMaskDataUrl(maskDataUrl);
            setSelectionPath(null);
            recordHistory(historyName, currentEditState, layers);
            showSuccess("Selection created.");
        } else {
            showError("Failed to create selection mask.");
        }
        return;
    }
    
    // 5. Gradient Tool Start
    if (activeTool === 'gradient' && point) {
        setGradientStart({ x: e.clientX, y: e.clientY });
        setGradientCurrent({ x: e.clientX, y: e.clientY });
        setIsGradientActive(true);
        return;
    }
    
    // 6. Marquee Start
    if (activeTool?.startsWith('marquee')) {
        setMarqueeStartScreen({ x: e.clientX, y: e.clientY });
        setMarqueeStart({ x: e.clientX, y: e.clientY });
        setMarqueeCurrent({ x: e.clientX, y: e.clientY });
        setIsMarqueeActive(true);
        return;
    }
    
    // 7. Panning (Fallback)
    setIsPanning(true);
    setPanOrigin({ x: e.clientX, y: e.clientY });
    
  }, [dimensions, activeTool, getPointOnImage, setCloneSourcePoint, imgRef, setForegroundColor, handleAddTextLayer, setActiveTool, setGradientStart, setGradientCurrent, setMarqueeStart, setMarqueeCurrent, selectionSettings.tolerance, recordHistory, currentEditState, layers, setSelectionMaskDataUrl, setSelectionPath]);

  const handleWorkspaceMouseMove = useCallback((e: React.MouseEvent) => {
    // 1. Panning
    if (isPanning && panOrigin) {
      setPanOrigin({ x: e.clientX, y: e.clientY });
      return;
    }
    
    // 2. Gradient Drawing
    if (isGradientActive) {
        setGradientCurrent({ x: e.clientX, y: e.clientY });
        return;
    }
    
    // 3. Marquee Drawing
    if (isMarqueeActive) {
        setMarqueeCurrent({ x: e.clientX, y: e.clientY });
        return;
    }
    
  }, [isPanning, panOrigin, isGradientActive, setGradientCurrent, isMarqueeActive, setMarqueeCurrent]);

  const handleWorkspaceMouseUp = useCallback((e: React.MouseEvent) => {
    // 1. Panning End
    if (isPanning) {
      setIsPanning(false);
      setPanOrigin(null);
      return;
    }
    
    // 2. Gradient End
    if (isGradientActive && gradientStart) {
        setIsGradientActive(false);
        setGradientStart(null);
        setGradientCurrent(null);
        showSuccess("Gradient defined (Layer creation stub).");
        return;
    }
    
    // 3. Marquee End
    if (isMarqueeActive && marqueeStartScreen) {
        setIsMarqueeActive(false);
        setMarqueeStart(null);
        setMarqueeCurrent(null);
        
        const endPoint = getPointOnImage(e);
        if (endPoint && dimensions) {
            const startPoint = getPointOnImage({ clientX: marqueeStartScreen.x, clientY: marqueeStartScreen.y } as MouseEvent);
            
            if (startPoint && endPoint) {
                handleMarqueeSelectionComplete(startPoint, endPoint);
            }
        }
        setMarqueeStartScreen(null);
        return;
    }
    
  }, [isPanning, isGradientActive, gradientStart, isMarqueeActive, marqueeStartScreen, dimensions, handleMarqueeSelectionComplete, setGradientStart, setGradientCurrent, setMarqueeStart, setMarqueeCurrent, getPointOnImage]);

  // --- Wheel Handler ---
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!dimensions || !workspaceRef.current) return;
    const minZoom = 0.1;
    const maxZoom = 5;
    const newZoom = Math.min(maxZoom, Math.max(minZoom, workspaceZoom * (1 - e.deltaY * 0.001)));
    setWorkspaceZoom(newZoom);
    setExternalZoom(newZoom);
  }, [workspaceRef, dimensions, setExternalZoom, workspaceZoom]);


  return {
    zoom: workspaceZoom,
    setZoom: setWorkspaceZoom,
    handleWheel,
    handleFitScreen,
    handleZoomIn,
    handleZoomOut,
    isMouseOverImage,
    setIsMouseOverImage,
    gradientStart,
    gradientCurrent,
    handleWorkspaceMouseDown,
    handleWorkspaceMouseMove,
    handleWorkspaceMouseUp,
  };
};