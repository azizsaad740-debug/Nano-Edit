"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, Check, X } from "lucide-react";
import ReactCrop, { type Crop } from "react-image-crop";
import { cn } from "@/lib/utils";
import SampleImages from "./SampleImages";
import UrlUploader from "./UrlUploader";
import { getFilterString } from "@/utils/filterUtils";
import { TextLayer } from "./TextLayer";
import { DrawingLayer } from "./DrawingLayer";
import { LiveBrushCanvas } from "./LiveBrushCanvas";
import type { Layer, BrushState, Point, EditState, GradientToolState } from "@/hooks/useEditorState";
import { WorkspaceControls } from "./WorkspaceControls";
import { useHotkeys } from "react-hotkeys-hook";
import { SelectionCanvas } from "./SelectionCanvas";
import { ChannelFilter } from "./ChannelFilter";
import { CurvesFilter } from "./CurvesFilter";
import { EffectsFilters } from "./EffectsFilters";
import { SmartObjectLayer } from "./SmartObjectLayer";
import VectorShapeLayer from "./VectorShapeLayer"; // Import VectorShapeLayer
import GroupLayer from "./GroupLayer"; // Import GroupLayer
import GradientLayer from "./GradientLayer"; // Import GradientLayer
import { GradientPreviewCanvas } from "./GradientPreviewCanvas"; // Import GradientPreviewCanvas
import { SelectionMaskOverlay } from "./SelectionMaskOverlay"; // Import SelectionMaskOverlay

interface WorkspaceProps {
  image: string | null;
  onFileSelect: (file: File | undefined) => void;
  onSampleSelect: (url: string) => void;
  onUrlSelect: (url: string) => void;
  onImageLoad: () => void;
  adjustments: EditState['adjustments'];
  effects: EditState['effects'];
  grading: EditState['grading'];
  channels: EditState['channels'];
  curves: EditState['curves'];
  selectedFilter: string;
  transforms: EditState['transforms'];
  frame: EditState['frame'];
  crop: Crop | undefined;
  pendingCrop: Crop | undefined;
  onCropChange: (crop: Crop | undefined) => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  aspect: number | undefined;
  imgRef: React.RefObject<HTMLImageElement>;
  isPreviewingOriginal: boolean;
  activeTool?: "lasso" | "brush" | "text" | "crop" | "eraser" | "eyedropper" | "shape" | "move" | "gradient" | "selectionBrush" | null; // Added 'selectionBrush'
  layers: Layer[];
  onAddTextLayer: (coords: { x: number; y: number }) => void;
  onAddDrawingLayer: () => string;
  onAddShapeLayer: (coords: { x: number; y: number }, shapeType?: Layer['shapeType'], initialWidth?: number, initialHeight?: number) => void; // Added onAddShapeLayer
  onAddGradientLayer: (options?: {
    x: number; y: number; width: number; height: number; rotation: number;
    gradientType: Layer['gradientType']; gradientColors: string[]; gradientStops: number[];
    gradientAngle: number; gradientCenterX: number; gradientCenterY: number;
    gradientRadius: number; gradientFeather: number; gradientInverted: boolean;
  }) => void; // Updated onAddGradientLayer signature
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string) => void;
  selectedLayerId: string | null;
  brushState: BrushState;
  gradientToolState: GradientToolState; // Added gradientToolState
  selectionPath: Point[] | null;
  selectionMaskDataUrl: string | null; // New prop
  onSelectionChange: (path: Point[]) => void;
  onSelectionBrushStrokeEnd: (strokeDataUrl: string, operation: 'add' | 'subtract') => void; // New prop
  handleColorPick: (color: string) => void;
  imageNaturalDimensions: { width: number; height: number; } | null; // Pass natural dimensions
  selectedShapeType: Layer['shapeType'] | null; // New prop for selected shape type
  setSelectedLayer: (id: string | null) => void; // Added setSelectedLayer
  setActiveTool: (tool: "lasso" | "brush" | "text" | "crop" | "eraser" | "eyedropper" | "shape" | "move" | "gradient" | "selectionBrush" | null) => void; // Added setActiveTool
  foregroundColor: string; // New prop
  backgroundColor: string; // New prop
}

// New component for drawing shape preview
interface ShapePreviewCanvasProps {
  start: Point;
  current: Point;
  shapeType: Layer['shapeType'];
  containerRect: DOMRect;
  imageNaturalDimensions: { width: number; height: number; } | null;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

const ShapePreviewCanvas = ({ start, current, shapeType, containerRect, imageNaturalDimensions, fillColor, strokeColor, strokeWidth }: ShapePreviewCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !imageNaturalDimensions) return;

    canvas.width = imageNaturalDimensions.width;
    canvas.height = imageNaturalDimensions.height;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    const scaleX = imageNaturalDimensions.width / containerRect.width;
    const scaleY = imageNaturalDimensions.height / containerRect.height;

    const startX = (start.x - containerRect.left) * scaleX;
    const startY = (start.y - containerRect.top) * scaleY;
    const currentX = (current.x - containerRect.left) * scaleX;
    const currentY = (current.y - containerRect.top) * scaleY;

    const width = currentX - startX;
    const height = currentY - startY;

    ctx.beginPath();
    switch (shapeType) {
      case 'rect':
        ctx.rect(startX, startY, width, height);
        break;
      case 'circle':
        const centerX = startX + width / 2;
        const centerY = startY + height / 2;
        const radius = Math.min(Math.abs(width), Math.abs(height)) / 2;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        break;
      case 'triangle':
        // Simple equilateral triangle based on width/height
        ctx.moveTo(startX + width / 2, startY);
        ctx.lineTo(startX + width, startY + height);
        ctx.lineTo(startX, startY + height);
        ctx.closePath();
        break;
      default:
        break;
    }

    if (fillColor !== 'none') {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    if (strokeWidth > 0 && strokeColor !== 'none') {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  }, [start, current, shapeType, containerRect, imageNaturalDimensions, fillColor, strokeColor, strokeWidth]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

// Utility to generate a circle or square SVG cursor
const createBrushCursor = (size: number, color: string, borderColor: string, borderWidth: number, shape: 'circle' | 'square') => {
  const halfSize = size / 2;
  const offset = halfSize + borderWidth;
  const svgContent = shape === 'circle'
    ? `<circle cx="${offset}" cy="${offset}" r="${halfSize}" fill="${color}" stroke="${borderColor}" stroke-width="${borderWidth}"/>`
    : `<rect x="${borderWidth}" y="${borderWidth}" width="${size}" height="${size}" fill="${color}" stroke="${borderColor}" stroke-width="${borderWidth}"/>`;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size + borderWidth * 2}" height="${size + borderWidth * 2}" viewBox="0 0 ${size + borderWidth * 2} ${size + borderWidth * 2}">
    ${svgContent}
  </svg>`;
  return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') ${offset} ${offset}, auto`;
};


const Workspace = (props: WorkspaceProps) => {
  const {
    image,
    onFileSelect,
    onSampleSelect,
    onUrlSelect,
    onImageLoad,
    adjustments,
    effects,
    grading,
    channels,
    curves,
    selectedFilter,
    transforms,
    frame,
    crop,
    pendingCrop,
    onCropChange,
    onApplyCrop,
    onCancelCrop,
    aspect,
    imgRef,
    isPreviewingOriginal,
    activeTool,
    layers,
    onAddTextLayer,
    onAddDrawingLayer,
    onAddShapeLayer, // Destructure onAddShapeLayer
    onAddGradientLayer, // Destructure onAddGradientLayer
    onLayerUpdate,
    onLayerCommit,
    selectedLayerId,
    brushState,
    gradientToolState, // Destructure gradientToolState
    selectionPath,
    selectionMaskDataUrl, // Destructure
    onSelectionChange,
    onSelectionBrushStrokeEnd, // Destructure
    handleColorPick,
    imageNaturalDimensions,
    selectedShapeType, // Destructure selectedShapeType
    setSelectedLayer, // Destructure setSelectedLayer
    setActiveTool, // Destructure setActiveTool
    foregroundColor, // Destructure foregroundColor
    backgroundColor, // Destructure backgroundColor
  } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const workspaceContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const isSpaceDownRef = useRef(false);
  const [isMouseOverImage, setIsMouseOverImage] = useState(false); // New state for mouse over image

  // Shape drawing state
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeStartCoords, setShapeStartCoords] = useState<Point | null>(null);
  const [shapeCurrentCoords, setShapeCurrentCoords] = useState<Point | null>(null);

  // Gradient drawing state
  const [isDrawingGradient, setIsDrawingGradient] = useState(false);
  const [gradientStartCoords, setGradientStartCoords] = useState<Point | null>(null);
  const [gradientCurrentCoords, setGradientCurrentCoords] = useState<Point | null>(null);

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(z + 0.1, 5)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(z - 0.1, 0.1)), []);

  const handleFitScreen = useCallback(() => {
    if (!imgRef.current || !workspaceContainerRef.current) return;
    const { naturalWidth, naturalHeight } = imgRef.current;
    const { clientWidth: containerWidth, clientHeight: containerHeight } = workspaceContainerRef.current;
    if (naturalWidth === 0 || naturalHeight === 0) return;
    const padding = 64;
    const widthRatio = (containerWidth - padding) / naturalWidth;
    const heightRatio = (containerHeight - padding) / naturalHeight;
    const newZoom = Math.min(widthRatio, heightRatio, 1);
    setZoom(newZoom);
    setPanOffset({ x: 0, y: 0 });
  }, [imgRef]);

  useEffect(() => {
    if (image) {
      const img = imgRef.current;
      const onImgLoad = () => setTimeout(handleFitScreen, 100);
      if (img) {
        img.addEventListener('load', onImgLoad, { once: true });
        if (img.complete) onImgLoad();
        return () => img.removeEventListener('load', onImgLoad);
      }
    } else {
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [image, handleFitScreen, imgRef]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!image || !imageContainerRef.current || !imageNaturalDimensions) return;

    // Prioritize drawing tools
    if (activeTool === 'shape') {
      setIsDrawingShape(true);
      setShapeStartCoords({ x: e.clientX, y: e.clientY });
      setShapeCurrentCoords({ x: e.clientX, y: e.clientY });
      e.preventDefault(); // Prevent other actions like panning
      return;
    } else if (activeTool === 'gradient') {
      setIsDrawingGradient(true);
      setGradientStartCoords({ x: e.clientX, y: e.clientY });
      setGradientCurrentCoords({ x: e.clientX, y: e.clientY });
      e.preventDefault();
      return;
    } else if ((activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'selectionBrush')) {
      // LiveBrushCanvas handles its own pointer events, so we don't need to do anything here
      // except prevent default if we want to stop other interactions.
      e.preventDefault();
      return;
    }

    // Then handle panning if no drawing tool is active
    if ((isSpaceDownRef.current || e.button === 1 || activeTool === 'move')) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!image) return;

    if (isPanning) {
      e.preventDefault();
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    } else if (isDrawingShape) {
      setShapeCurrentCoords({ x: e.clientX, y: e.clientY });
    } else if (isDrawingGradient) {
      setGradientCurrentCoords({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!image || !imageContainerRef.current || !imageNaturalDimensions) return;

    if (isPanning) {
      setIsPanning(false);
    } else if (isDrawingShape && shapeStartCoords && shapeCurrentCoords) {
      setIsDrawingShape(false);

      const containerRect = imageContainerRef.current.getBoundingClientRect();
      const scaleX = imageNaturalDimensions.width / containerRect.width;
      const scaleY = imageNaturalDimensions.height / containerRect.height;

      const startX_px = (shapeStartCoords.x - containerRect.left) * scaleX;
      const startY_px = (shapeStartCoords.y - containerRect.top) * scaleY;
      const endX_px = (shapeCurrentCoords.x - containerRect.left) * scaleX;
      const endY_px = (shapeCurrentCoords.y - containerRect.top) * scaleY;

      const minX_px = Math.min(startX_px, endX_px);
      const minY_px = Math.min(startY_px, endY_px);
      const maxX_px = Math.max(startX_px, endX_px);
      const maxY_px = Math.max(startY_px, endY_px);

      const width_px = maxX_px - minX_px;
      const height_px = maxY_px - minY_px;

      if (width_px > 1 && height_px > 1 && selectedShapeType) { // Ensure a minimum size
        const centerX_percent = ((minX_px + width_px / 2) / imageNaturalDimensions.width) * 100;
        const centerY_percent = ((minY_px + height_px / 2) / imageNaturalDimensions.height) * 100;
        const width_percent = (width_px / imageNaturalDimensions.width) * 100;
        const height_percent = (height_px / imageNaturalDimensions.height) * 100;

        onAddShapeLayer(
          { x: centerX_percent, y: centerY_percent },
          selectedShapeType,
          width_percent,
          height_percent
        );
        setActiveTool(null); // Deactivate shape tool after drawing
      }
      setShapeStartCoords(null);
      setShapeCurrentCoords(null);
    } else if (isDrawingGradient && gradientStartCoords && gradientCurrentCoords) {
      setIsDrawingGradient(false);

      const containerRect = imageContainerRef.current.getBoundingClientRect();
      const scaleX = imageNaturalDimensions.width / containerRect.width;
      const scaleY = imageNaturalDimensions.height / containerRect.height;

      const startX_px = (gradientStartCoords.x - containerRect.left) * scaleX;
      const startY_px = (gradientStartCoords.y - containerRect.top) * scaleY;
      const endX_px = (gradientCurrentCoords.x - containerRect.left) * scaleX;
      const endY_px = (gradientCurrentCoords.y - containerRect.top) * scaleY;

      const minX_px = Math.min(startX_px, endX_px);
      const minY_px = Math.min(startY_px, endY_px);
      const maxX_px = Math.max(startX_px, endX_px);
      const maxY_px = Math.max(startY_px, endY_px);

      const width_px = maxX_px - minX_px;
      const height_px = maxY_px - minY_px;

      if (width_px > 1 && height_px > 1) { // Ensure a minimum size
        const centerX_percent = ((minX_px + width_px / 2) / imageNaturalDimensions.width) * 100;
        const centerY_percent = ((minY_px + height_px / 2) / imageNaturalDimensions.height) * 100;
        const width_percent = (width_px / imageNaturalDimensions.width) * 100;
        const height_percent = (height_px / imageNaturalDimensions.height) * 100;

        let gradientAngle = 0;
        let radialCenterX = 50;
        let radialCenterY = 50;
        let radialRadius = 50;

        if (gradientToolState.type === 'linear') {
          gradientAngle = Math.atan2(endY_px - startY_px, endX_px - startX_px) * (180 / Math.PI);
          // Adjust angle to be 0-360 and relative to vertical for consistency with CSS gradients
          gradientAngle = (gradientAngle + 90 + 360) % 360;
        } else if (gradientToolState.type === 'radial') {
          radialCenterX = ((startX_px + width_px / 2) / imageNaturalDimensions.width) * 100;
          radialCenterY = ((startY_px + height_px / 2) / imageNaturalDimensions.height) * 100;
          radialRadius = (Math.sqrt(width_px * width_px + height_px * height_px) / 2 / Math.min(imageNaturalDimensions.width, imageNaturalDimensions.height)) * 100;
        }

        onAddGradientLayer({
          x: centerX_percent,
          y: centerY_percent,
          width: width_percent,
          height: height_percent,
          rotation: 0, // Gradients don't have a direct rotation property, angle handles it
          gradientType: gradientToolState.type,
          gradientColors: gradientToolState.colors,
          gradientStops: gradientToolState.stops,
          gradientAngle: gradientAngle,
          gradientCenterX: radialCenterX,
          gradientCenterY: radialCenterY,
          gradientRadius: radialRadius,
          gradientFeather: gradientToolState.feather,
          gradientInverted: gradientToolState.inverted,
        });
        setActiveTool(null); // Deactivate gradient tool after drawing
      }
      setGradientStartCoords(null);
      setGradientCurrentCoords(null);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!image || !workspaceContainerRef.current) return;
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Vertical Pan
      setPanOffset(prev => ({ ...prev, y: prev.y - e.deltaY }));
    } else if (e.altKey || e.shiftKey) {
      // Horizontal Pan
      setPanOffset(prev => ({ ...prev, x: prev.x - e.deltaY }));
    } else {
      // Zoom to cursor
      const rect = workspaceContainerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomAmount = e.deltaY * -0.001;
      const newZoom = Math.max(0.1, Math.min(zoom * (1 + zoomAmount), 5));
      
      const newPanX = mouseX - (mouseX - panOffset.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - panOffset.y) * (newZoom / zoom);

      setZoom(newZoom);
      setPanOffset({ x: newPanX, y: newPanY });
    }
  };

  useHotkeys('space', () => { isSpaceDownRef.current = true; }, { keydown: true });
  useHotkeys('space', () => { isSpaceDownRef.current = false; setIsPanning(false); }, { keyup: true });
  useHotkeys("+, =", handleZoomIn, { preventDefault: true });
  useHotkeys("-", handleZoomOut, { preventDefault: true });
  useHotkeys("f", handleFitScreen, { preventDefault: true });

  const triggerFileInput = () => fileInputRef.current?.click();
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => onFileSelect(event.target.files?.[0]);
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    onFileSelect(e.dataTransfer.files?.[0]);
  };

  const handleWorkspaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || !imgRef.current || !imageNaturalDimensions) {
      setSelectedLayer(null); // Deselect if no image or dimensions
      return;
    }

    // If a drawing tool is active, don't deselect layers on click
    if (activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'shape' || activeTool === 'gradient' || activeTool === 'selectionBrush') {
      return;
    }

    const rect = imageContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click coordinates to natural image pixels
    const scaleX = imageNaturalDimensions.width / rect.width;
    const scaleY = imageNaturalDimensions.height / rect.height;
    const nativeClickX = clickX * scaleX;
    const nativeClickY = clickY * scaleY;

    let layerClicked = false;
    // Recursive function to check for layer clicks within groups
    const checkLayerClick = (layersToCheck: Layer[]): boolean => {
      // Iterate in reverse order to check top-most layers first
      for (let i = layersToCheck.length - 1; i >= 0; i--) {
        const layer = layersToCheck[i];
        if (!layer.visible || layer.type === 'image' || layer.type === 'drawing') continue; // Skip background and drawing layers for direct click selection

        if (layer.type === 'group' && layer.children && layer.expanded) {
          // If it's an expanded group, check its children first
          if (checkLayerClick(layer.children)) {
            return true; // Child layer was clicked
          }
        }

        // For text, vector shapes, smart objects, and gradients, check if the click is within their transformed bounds
        const layerX_px = (layer.x ?? 50) / 100 * imageNaturalDimensions.width;
        const layerY_px = (layer.y ?? 50) / 100 * imageNaturalDimensions.height;
        let layerWidth_px = (layer.width ?? 10) / 100 * imageNaturalDimensions.width;
        let layerHeight_px = (layer.height ?? 10) / 100 * imageNaturalDimensions.height;

        if (layer.type === 'text') {
          const approxCharWidth = (layer.fontSize || 48) * 0.6; // Rough estimate
          layerWidth_px = (layer.content?.length || 1) * approxCharWidth;
          layerHeight_px = (layer.fontSize || 48) * 1.2;
        } else if (layer.type === 'smart-object' && layer.smartObjectData) {
          layerWidth_px = (layer.width ?? (layer.smartObjectData.width / imageNaturalDimensions.width) * 100) / 100 * imageNaturalDimensions.width;
          layerHeight_px = (layer.height ?? (layer.smartObjectData.height / imageNaturalDimensions.height) * 100) / 100 * imageNaturalDimensions.height;
        } else if (layer.type === 'gradient') {
          layerWidth_px = (layer.width ?? 100) / 100 * imageNaturalDimensions.width;
          layerHeight_px = (layer.height ?? 100) / 100 * imageNaturalDimensions.height;
        }

        // Adjust for center origin (x,y are center for text/vector shapes/smart objects/groups/gradients)
        const minX = layerX_px - layerWidth_px / 2;
        const minY = layerY_px - layerHeight_px / 2;
        const maxX = layerX_px + layerWidth_px / 2;
        const maxY = layerY_px + layerHeight_px / 2;

        if (nativeClickX >= minX && nativeClickX <= maxX && nativeClickY >= minY && nativeClickY <= maxY) {
          setSelectedLayer(layer.id);
          layerClicked = true;
          e.stopPropagation(); // Prevent deselecting if a layer was clicked
          
          // If a layer is clicked, deactivate text tool if it was active
          if (activeTool === 'text') {
            setActiveTool(null);
          }
          return true;
        }
      }
      return false;
    };

    layerClicked = checkLayerClick(layers);

    // If no layer was clicked, deselect any active layer
    if (!layerClicked) {
      setSelectedLayer(null);
    }

    // Handle tool-specific clicks if no layer was selected
    if (activeTool === 'text') {
      onAddTextLayer({ x: (nativeClickX / imageNaturalDimensions.width) * 100, y: (nativeClickY / imageNaturalDimensions.height) * 100 });
      setActiveTool(null); // Deactivate text tool after adding layer
    } else if (activeTool === 'eyedropper') {
      const canvas = document.createElement('canvas');
      const img = imgRef.current;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const pixel = ctx.getImageData(nativeClickX, nativeClickY, 1, 1).data;
      
      const toHex = (c: number) => ('0' + c.toString(16)).slice(-2);
      const hexColor = `#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`;
      
      handleColorPick(hexColor);
      setActiveTool('brush'); // Switch to brush after picking color
    }
  };

  const handleDrawEnd = useCallback((strokeDataUrl: string, layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    const baseDataUrl = layer?.dataUrl;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx || !imageNaturalDimensions) return;

    tempCanvas.width = imageNaturalDimensions.width;
    tempCanvas.height = imageNaturalDimensions.height;

    const baseImg = new Image();
    const strokeImg = new Image();

    const basePromise = baseDataUrl ? new Promise(res => { baseImg.onload = res; baseImg.src = baseDataUrl; }) : Promise.resolve();
    const strokePromise = new Promise(res => { strokeImg.onload = res; strokeImg.src = strokeDataUrl; });

    Promise.all([basePromise, strokePromise]).then(() => {
      if (baseDataUrl) tempCtx.drawImage(baseImg, 0, 0);
      tempCtx.drawImage(strokeImg, 0, 0);
      const combinedDataUrl = tempCanvas.toDataURL();
      onLayerUpdate(layerId, { dataUrl: combinedDataUrl });
      onLayerCommit(layerId);
    });
  }, [layers, onLayerUpdate, onLayerCommit, imageNaturalDimensions]);

  const backgroundLayer = layers.find(l => l.type === 'image');
  const isBackgroundVisible = backgroundLayer?.visible ?? true;

  const areAllChannelsVisible = channels.r && channels.g && channels.b;
  const isCurveSet = JSON.stringify(curves.all) !== JSON.stringify([{ x: 0, y: 0 }, { x: 255, y: 255 }]);
  const hasAdvancedEffects = effects.blur > 0 || effects.hueShift !== 0 || effects.sharpen > 0 || effects.clarity > 0;
  
  const baseFilter = getFilterString({ adjustments, effects, grading, selectedFilter });
  const curvesFilter = isCurveSet ? ' url(#curves-filter)' : '';
  const channelFilter = areAllChannelsVisible ? '' : ' url(#channel-filter)';
  const advancedEffectsFilter = hasAdvancedEffects ? ' url(#advanced-effects-filter)' : '';
  
  const imageFilterStyle = isPreviewingOriginal ? {} : { filter: `${baseFilter}${advancedEffectsFilter}${curvesFilter}${channelFilter}` };

  const imageStyle: React.CSSProperties = { ...imageFilterStyle, visibility: isBackgroundVisible ? 'visible' : 'hidden' };
  const wrapperTransformStyle = isPreviewingOriginal ? {} : { transform: `rotate(${transforms.rotation}deg) scale(${transforms.scaleX}, ${transforms.scaleY})` };
  
  const containerStyle: React.CSSProperties = {};
  if (!isBackgroundVisible) {
    containerStyle.backgroundImage = 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)';
    containerStyle.backgroundSize = '20px 20px';
    containerStyle.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
  }

  const cropClipPathStyle: React.CSSProperties = {};
  if (crop && crop.width > 0 && crop.height > 0 && activeTool !== 'crop') {
    const top = crop.y;
    const right = 100 - (crop.x + crop.width);
    const bottom = 100 - (crop.y + crop.height);
    const left = crop.x;
    cropClipPathStyle.clipPath = `inset(${top}% ${right}% ${bottom}% ${left}%)`;
  }

  // Custom Cursors
  const lassoCursor = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>\') 0 24, auto';
  const eyedropperCursor = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3.5c1.9 1.9 1.9 5.1 0 7L10 17l-4 4-1-1 4-4 6.5-6.5c1.9-1.9 5.1-1.9 7 0L16.5 3.5z"/><path d="m14 7 3 3"/><path d="M9 13.5 2.5 20"/></svg>\') 0 24, auto';
  const moveToolCursor = 'grab';
  const textCursor = 'text';
  const cropCursor = 'crosshair';
  const shapeCursor = 'crosshair';
  const gradientCursor = 'crosshair';
  const selectionBrushCursor = 'crosshair'; // Default for selection brush

  const brushSize = brushState.size;
  const brushBorderColor = activeTool === 'eraser' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)';
  const brushFillColor = activeTool === 'eraser' ? 'rgba(255,255,255,0.1)' : foregroundColor; // Use foregroundColor
  const brushBorderWidth = 1;

  const dynamicBrushCursor = createBrushCursor(brushSize, brushFillColor, brushBorderColor, brushBorderWidth, brushState.shape);
  const dynamicEraserCursor = createBrushCursor(brushSize, brushFillColor, brushBorderColor, brushBorderWidth, brushState.shape);


  const getCursorStyle = useCallback(() => {
    if (!image) return 'default';
    if (isPanning) return 'grabbing';
    if (isSpaceDownRef.current) return 'grab';

    if (isMouseOverImage) { // Apply tool-specific cursors only when over the image
      switch (activeTool) {
        case 'lasso': return lassoCursor;
        case 'brush': return dynamicBrushCursor;
        case 'eraser': return dynamicEraserCursor;
        case 'text': return textCursor;
        case 'crop': return cropCursor;
        case 'eyedropper': return eyedropperCursor;
        case 'shape': return shapeCursor;
        case 'move': return moveToolCursor;
        case 'gradient': return gradientCursor;
        case 'selectionBrush': return selectionBrushCursor;
        default: return 'default';
      }
    }
    return 'default'; // Default cursor when not over the image
  }, [image, isPanning, isSpaceDownRef, isMouseOverImage, activeTool, lassoCursor, dynamicBrushCursor, dynamicEraserCursor, textCursor, cropCursor, eyedropperCursor, shapeCursor, moveToolCursor, gradientCursor, selectionBrushCursor, brushState.shape]);

  const renderWorkspaceLayers = (layersToRender: Layer[]) => {
    return layersToRender.map((layer) => {
      if (!layer.visible) return null;

      if (layer.type === 'text') {
        return <TextLayer key={layer.id} layer={layer} containerRef={imageContainerRef} onUpdate={onLayerUpdate} onCommit={onLayerCommit} isSelected={layer.id === selectedLayerId} activeTool={activeTool} />;
      }
      if (layer.type === 'drawing') {
        return <DrawingLayer key={layer.id} layer={layer} />;
      }
      if (layer.type === 'smart-object') {
        return (
          <SmartObjectLayer
            key={layer.id}
            layer={layer}
            containerRef={imageContainerRef}
            onUpdate={onLayerUpdate}
            onCommit={onLayerCommit}
            isSelected={layer.id === selectedLayerId}
            parentDimensions={imageNaturalDimensions}
            activeTool={activeTool}
          />
        );
      }
      if (layer.type === 'vector-shape') {
        return (
          <VectorShapeLayer
            key={layer.id}
            layer={layer}
            containerRef={imageContainerRef}
            onUpdate={onLayerUpdate}
            onCommit={onLayerCommit}
            isSelected={layer.id === selectedLayerId}
            activeTool={activeTool}
          />
        );
      }
      if (layer.type === 'gradient') {
        return (
          <GradientLayer
            key={layer.id}
            layer={layer}
            containerRef={imageContainerRef}
            onUpdate={onLayerUpdate}
            onCommit={onLayerCommit}
            isSelected={layer.id === selectedLayerId}
            imageNaturalDimensions={imageNaturalDimensions}
            activeTool={activeTool}
          />
        );
      }
      if (layer.type === 'group') {
        return (
          <GroupLayer
            key={layer.id}
            layer={layer}
            containerRef={imageContainerRef}
            onUpdate={onLayerUpdate}
            onCommit={onLayerCommit}
            isSelected={layer.id === selectedLayerId}
            parentDimensions={imageNaturalDimensions}
            activeTool={activeTool}
            renderChildren={renderWorkspaceLayers} // Pass recursive renderer
          />
        );
      }
      return null;
    });
  };

  return (
    <div
      ref={workspaceContainerRef}
      className={cn(
        "flex items-center justify-center h-full w-full bg-muted/20 rounded-lg relative transition-all overflow-hidden",
        isDragging && "border-2 border-dashed border-primary ring-4 ring-primary/20",
        // Apply cursor-none only when mouse is over image and tool is active
        (activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'selectionBrush') && isMouseOverImage && 'cursor-none',
      )}
      style={{ 
        cursor: getCursorStyle()
      }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleWorkspaceClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <ChannelFilter channels={channels} />
      <CurvesFilter curves={curves} />
      <EffectsFilters effects={effects} />
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 flex flex-col items-center justify-center pointer-events-none z-10 rounded-lg">
          <UploadCloud className="h-16 w-16 text-primary" />
          <p className="mt-2 text-lg font-semibold text-primary">Drop image to upload</p>
        </div>
      )}
      {image ? (
        <>
          <div 
            className="transition-transform duration-200" 
            style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})` }}
          >
            <div className="relative max-w-full max-h-full p-4">
              {activeTool === 'crop' && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                  <Button size="sm" onClick={onApplyCrop}><Check className="h-4 w-4 mr-2" /> Apply Crop</Button>
                  <Button size="sm" variant="destructive" onClick={onCancelCrop}><X className="h-4 w-4 mr-2" /> Cancel</Button>
                </div>
              )}
              <div
                className="relative transition-all duration-200"
                style={{
                  padding: frame.type === 'solid' ? `${frame.width}px` : '0px',
                  backgroundColor: frame.type === 'solid' ? frame.color : 'transparent',
                  boxShadow: frame.type === 'solid' ? 'inset 0 0 10px rgba(0,0,0,0.2)' : 'none',
                  display: 'inline-block',
                }}
              >
                <div style={cropClipPathStyle}>
                  <ReactCrop
                    crop={activeTool === 'crop' ? pendingCrop : crop}
                    onChange={(_, percentCrop) => onCropChange(percentCrop)}
                    aspect={aspect}
                    disabled={activeTool !== 'crop'}
                  >
                    <div style={wrapperTransformStyle}>
                      <div 
                        ref={imageContainerRef} 
                        className="relative" 
                        style={containerStyle}
                        onMouseEnter={() => setIsMouseOverImage(true)} // Track mouse over image
                        onMouseLeave={() => setIsMouseOverImage(false)} // Track mouse leave image
                      >
                        <img
                          ref={imgRef}
                          src={image}
                          alt="Uploaded preview"
                          className="object-contain max-w-full max-h-[calc(100vh-12rem)] rounded-lg shadow-lg"
                          style={imageStyle}
                          onLoad={onImageLoad}
                        />
                        
                        {renderWorkspaceLayers(layers)} {/* Render layers first */}

                        {activeTool === 'lasso' && ( // Render SelectionCanvas after layers
                          <SelectionCanvas 
                            imageRef={imgRef}
                            selectionPath={selectionPath}
                            onSelectionComplete={onSelectionChange}
                          />
                        )}

                        {(activeTool === 'lasso' || activeTool === 'selectionBrush') && selectionMaskDataUrl && ( // Render SelectionMaskOverlay for both lasso and selectionBrush
                          <SelectionMaskOverlay
                            maskDataUrl={selectionMaskDataUrl}
                            imageNaturalDimensions={imageNaturalDimensions}
                          />
                        )}

                        {!isPreviewingOriginal && effects.vignette > 0 && (
                          <div
                            className="absolute inset-0 pointer-events-none rounded-lg"
                            style={{
                              boxShadow: `inset 0 0 ${effects.vignette * 2.5}px rgba(0,0,0,${effects.vignette / 100})`,
                            }}
                          />
                        )}
                        {!isPreviewingOriginal && effects.noise > 0 && (
                          <div
                            className="absolute inset-0 pointer-events-none rounded-lg mix-blend-overlay"
                            style={{
                              opacity: effects.noise / 100,
                              backgroundImage: "url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIz۰۰IiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYmVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuODUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIi8+PC9zdmc+\")",
                            }}
                          />
                        )}
                        
                        {(activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'selectionBrush') && (
                          <LiveBrushCanvas
                            brushState={brushState}
                            imageRef={imgRef}
                            onDrawEnd={handleDrawEnd}
                            activeTool={activeTool}
                            selectedLayerId={selectedLayerId}
                            onAddDrawingLayer={onAddDrawingLayer}
                            layers={layers}
                            isSelectionBrush={activeTool === 'selectionBrush'}
                            onSelectionBrushStrokeEnd={onSelectionBrushStrokeEnd}
                            foregroundColor={foregroundColor}
                            backgroundColor={backgroundColor}
                          />
                        )}
                        {isDrawingShape && shapeStartCoords && shapeCurrentCoords && imageContainerRef.current && (
                          <ShapePreviewCanvas
                            start={shapeStartCoords}
                            current={shapeCurrentCoords}
                            shapeType={selectedShapeType || 'rect'}
                            containerRect={imageContainerRef.current.getBoundingClientRect()}
                            imageNaturalDimensions={imageNaturalDimensions}
                            fillColor="#3B82F6"
                            strokeColor="#FFFFFF"
                            strokeWidth={2}
                          />
                        )}
                        {isDrawingGradient && gradientStartCoords && gradientCurrentCoords && imageContainerRef.current && (
                          <GradientPreviewCanvas
                            start={gradientStartCoords}
                            current={gradientCurrentCoords}
                            gradientToolState={gradientToolState}
                            containerRect={imageContainerRef.current.getBoundingClientRect()}
                            imageNaturalDimensions={imageNaturalDimensions}
                          />
                        )}
                      </div>
                    </div>
                  </ReactCrop>
                </div>
              </div>
            </div>
          </div>
          <WorkspaceControls 
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitScreen={handleFitScreen}
          />
        </>
      ) : (
        <div className="w-full max-w-md">
          <Card className="border-2 border-dashed">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 bg-muted rounded-full">
                <UploadCloud className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold">Upload an Image</h2>
              <p className="text-muted-foreground">
                Drag &amp; drop, paste from clipboard, or click the button to upload an image.
              </p>
              <Button onClick={triggerFileInput}>Select Image</Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                className="hidden"
                accept="image/png, image/jpeg, image/webp, .psd"
              />
            </CardContent>
          </Card>
          <UrlUploader onUrlSelect={onUrlSelect} />
          <SampleImages onSelect={onSampleSelect} />
        </div>
      )}
    </div>
  );
};

export default Workspace;