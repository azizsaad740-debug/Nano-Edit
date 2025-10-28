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
import type { Layer, BrushState, Point, EditState, GradientToolState, ActiveTool } from "@/types/editor";
import { WorkspaceControls } from "./WorkspaceControls";
import { useHotkeys } from "react-hotkeys-hook";
import { SelectionCanvas } from "./SelectionCanvas";
import { ChannelFilter } from "./ChannelFilter";
import { CurvesFilter } from "./CurvesFilter";
import { EffectsFilters } from "./EffectsFilters";
import { SmartObjectLayer } from "./SmartObjectLayer";
import VectorShapeLayer from "./VectorShapeLayer";
import GroupLayer from "./GroupLayer";
import GradientLayer from "./GradientLayer";
import { GradientPreviewCanvas } from "./GradientPreviewCanvas";
import { SelectionMaskOverlay } from "./SelectionMaskOverlay";
import { SelectiveBlurFilter } from "./SelectiveBlurFilter";
import { HslFilter } from "./HslFilter";
import * as React from "react";

interface WorkspaceProps {
  image: string | null;
  onFileSelect: (file: File | undefined) => void;
  onSampleSelect: (url: string) => void;
  onUrlSelect: (url: string) => void;
  onImageLoad: () => void;
  currentState: EditState;
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
  activeTool?: ActiveTool | null;
  layers: Layer[];
  onAddTextLayer: (coords: { x: number; y: number }) => void;
  onAddDrawingLayer: () => string;
  onAddShapeLayer: (coords: { x: number; y: number }, shapeType?: Layer['shapeType'], initialWidth?: number, initialHeight?: number) => void;
  onAddGradientLayer: (options?: {
    x: number; y: number; width: number; height: number; rotation: number;
    gradientType: Layer['gradientType']; gradientColors: string[]; gradientStops: number[];
    gradientAngle: number; gradientCenterX: number; gradientCenterY: number;
    gradientRadius: number; gradientFeather: number; gradientInverted: boolean;
  }) => void;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string) => void;
  selectedLayerId: string | null;
  brushState: BrushState;
  gradientToolState: GradientToolState;
  selectionPath: Point[] | null;
  selectionMaskDataUrl: string | null;
  onSelectionChange: (path: Point[]) => void;
  onSelectionBrushStrokeEnd: (strokeDataUrl: string, operation: 'add' | 'subtract') => void;
  onSelectiveBlurStrokeEnd: (strokeDataUrl: string, operation: 'add' | 'subtract') => void;
  handleColorPick: (color: string) => void;
  imageNaturalDimensions: { width: number; height: number; } | null;
  selectedShapeType: Layer['shapeType'] | null;
  setSelectedLayer: (id: string | null) => void;
  setActiveTool: (tool: ActiveTool | null) => void;
  foregroundColor: string;
  backgroundColor: string;
  onDrawingStrokeEnd: (strokeDataUrl: string, layerId: string) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  panOffset: { x: number; y: number };
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  fitScreenRef: React.MutableRefObject<(() => void) | null>;
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
    currentState,
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
    onAddShapeLayer,
    onAddGradientLayer,
    onLayerUpdate,
    onLayerCommit,
    selectedLayerId,
    brushState,
    gradientToolState,
    selectionPath,
    selectionMaskDataUrl,
    onSelectionChange,
    onSelectionBrushStrokeEnd,
    onSelectiveBlurStrokeEnd,
    handleColorPick,
    imageNaturalDimensions,
    selectedShapeType,
    setSelectedLayer,
    setActiveTool,
    foregroundColor,
    backgroundColor,
    onDrawingStrokeEnd,
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    onZoomIn,
    onZoomOut,
    onFitScreen,
    fitScreenRef,
  } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const layerContainerRef = useRef<HTMLDivElement>(null); // Renamed ref for the container holding layers/canvases
  const workspaceContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const isSpaceDownRef = useRef(false);
  const [isMouseOverImage, setIsMouseOverImage] = useState(false);
  
  const [previousBrushTool, setPreviousBrushTool] = useState<"brush" | "eraser" | "selectionBrush" | "blurBrush" | null>(null);

  // Shape drawing state
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeStartCoords, setShapeStartCoords] = useState<Point | null>(null);
  const [shapeCurrentCoords, setShapeCurrentCoords] = useState<Point | null>(null);

  // Gradient drawing state
  const [isDrawingGradient, setIsDrawingGradient] = useState(false);
  const [gradientStartCoords, setGradientStartCoords] = useState<Point | null>(null);
  const [gradientCurrentCoords, setGradientCurrentCoords] = useState<Point | null>(null);

  // --- Zoom/Pan Logic ---
  const handleFitScreenInternal = useCallback(() => {
    if (!imgRef.current || !workspaceContainerRef.current) return;
    const { naturalWidth, naturalHeight } = imgRef.current;
    const { clientWidth: containerWidth, clientHeight: containerHeight } = workspaceContainerRef.current;
    if (naturalWidth === 0 || naturalHeight === 0) return;
    const padding = 64;
    const widthRatio = (containerWidth - padding) / naturalWidth;
    const heightRatio = (containerHeight - padding) / naturalHeight;
    const newZoom = Math.min(widthRatio, heightRatio, 1);
    
    if (newZoom !== zoom) {
      setZoom(newZoom);
    }
    setPanOffset({ x: 0, y: 0 });
  }, [imgRef, zoom, setZoom, setPanOffset]);

  useEffect(() => {
    if (fitScreenRef) {
      fitScreenRef.current = handleFitScreenInternal;
      return () => {
        if (fitScreenRef) {
          fitScreenRef.current = null;
        }
      };
    }
  }, [handleFitScreenInternal, fitScreenRef]);

  useEffect(() => {
    if (image) {
      const img = imgRef.current;
      const onImgLoad = () => setTimeout(handleFitScreenInternal, 100); 
      if (img) {
        img.addEventListener('load', onImgLoad, { once: true });
        if (img.complete) onImgLoad();
        return () => img.removeEventListener('load', onImgLoad);
      }
    } else {
      if (typeof setZoom === 'function') {
        setZoom(1);
      }
      if (typeof setPanOffset === 'function') {
        setPanOffset({ x: 0, y: 0 });
      }
    }
  }, [image, handleFitScreenInternal, imgRef, setZoom, setPanOffset]);
  
  useEffect(() => {
    if (activeTool === 'eyedropper') {
      if (previousBrushTool === null && (props.activeTool === 'brush' || props.activeTool === 'eraser' || props.activeTool === 'selectionBrush' || props.activeTool === 'blurBrush')) {
        setPreviousBrushTool(props.activeTool);
      }
    } else if (previousBrushTool !== null && (props.activeTool !== 'brush' && props.activeTool !== 'eraser' && props.activeTool !== 'selectionBrush' && props.activeTool !== 'blurBrush')) {
      setPreviousBrushTool(null);
    }
  }, [activeTool, props.activeTool, previousBrushTool]);


  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!image || !layerContainerRef.current || !imageNaturalDimensions) return;

    // Prioritize drawing tools
    if (activeTool === 'shape') {
      setIsDrawingShape(true);
      setShapeStartCoords({ x: e.clientX, y: e.clientY });
      setShapeCurrentCoords({ x: e.clientX, y: e.clientY });
      e.preventDefault();
      return;
    } else if (activeTool === 'gradient') {
      setIsDrawingGradient(true);
      setGradientStartCoords({ x: e.clientX, y: e.clientY });
      setGradientCurrentCoords({ x: e.clientX, y: e.clientY });
      e.preventDefault();
      return;
    } else if ((activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'selectionBrush' || activeTool === 'blurBrush')) {
      if (e.button === 2) e.preventDefault();
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
    if (!image || !layerContainerRef.current || !imageNaturalDimensions) return;

    if (isPanning) {
      setIsPanning(false);
    } else if (isDrawingShape && shapeStartCoords && shapeCurrentCoords) {
      setIsDrawingShape(false);

      const containerRect = layerContainerRef.current.getBoundingClientRect();
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

      if (width_px > 1 && height_px > 1 && selectedShapeType) {
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
        setActiveTool(null);
      }
      setShapeStartCoords(null);
      setShapeCurrentCoords(null);
    } else if (isDrawingGradient && gradientStartCoords && gradientCurrentCoords) {
      setIsDrawingGradient(false);

      const containerRect = layerContainerRef.current.getBoundingClientRect();
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

      if (width_px > 1 && height_px > 1) {
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
          rotation: 0,
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
        setActiveTool(null);
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
  useHotkeys("+, =", onZoomIn, { preventDefault: true });
  useHotkeys("-", onZoomOut, { preventDefault: true });
  useHotkeys("f", onFitScreen, { preventDefault: true });

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
    if (!layerContainerRef.current || !imgRef.current || !imageNaturalDimensions) {
      setSelectedLayer(null);
      return;
    }

    if (activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'shape' || activeTool === 'gradient' || activeTool === 'selectionBrush' || activeTool === 'blurBrush') {
      return;
    }

    const rect = layerContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click coordinates to natural image pixels
    const scaleX = imageNaturalDimensions.width / rect.width;
    const scaleY = imageNaturalDimensions.height / rect.height;
    const nativeClickX = clickX * scaleX;
    const nativeClickY = clickY * scaleY;

    let layerClicked = false;
    const checkLayerClick = (layersToCheck: Layer[]): boolean => {
      for (let i = layersToCheck.length - 1; i >= 0; i--) {
        const layer = layersToCheck[i];
        if (!layer.visible || layer.type === 'image' || layer.type === 'drawing') continue;

        if (layer.type === 'group' && layer.children && layer.expanded) {
          if (checkLayerClick(layer.children)) {
            return true;
          }
        }

        const layerX_percent = layer.x ?? 50;
        const layerY_percent = layer.y ?? 50;
        let layerWidth_percent = layer.width ?? 10;
        let layerHeight_percent = layer.height ?? 10;

        const layerX_px = (layerX_percent / 100) * imageNaturalDimensions.width;
        const layerY_px = (layerY_percent / 100) * imageNaturalDimensions.height;
        let layerWidth_px = (layerWidth_percent / 100) * imageNaturalDimensions.width;
        let layerHeight_px = (layerHeight_percent / 100) * imageNaturalDimensions.height;

        if (layer.type === 'text') {
          const approxCharWidth = (layer.fontSize || 48) * 0.6;
          layerWidth_px = (layer.content?.length || 1) * approxCharWidth;
          layerHeight_px = (layer.fontSize || 48) * 1.2;
        } else if (layer.type === 'smart-object' && layer.smartObjectData) {
          layerWidth_px = (layer.width ?? (layer.smartObjectData.width / imageNaturalDimensions.width) * 100) / 100 * imageNaturalDimensions.width;
          layerHeight_px = (layer.height ?? (layer.smartObjectData.height / imageNaturalDimensions.height) * 100) / 100 * imageNaturalDimensions.height;
        } else if (layer.type === 'gradient') {
          layerWidth_px = (layer.width ?? 100) / 100 * imageNaturalDimensions.width;
          layerHeight_px = (layer.height ?? 100) / 100 * imageNaturalDimensions.height;
        }

        const minX = layerX_px - layerWidth_px / 2;
        const minY = layerY_px - layerHeight_px / 2;
        const maxX = layerX_px + layerWidth_px / 2;
        const maxY = layerY_px + layerHeight_px / 2;

        if (nativeClickX >= minX && nativeClickX <= maxX && nativeClickY >= minY && nativeClickY <= maxY) {
          setSelectedLayer(layer.id);
          layerClicked = true;
          e.stopPropagation();
          
          if (activeTool === 'text') {
            setActiveTool(null);
          }
          return true;
        }
      }
      return false;
    };

    layerClicked = checkLayerClick(layers);

    if (!layerClicked) {
      setSelectedLayer(null);
    }

    if (activeTool === 'text') {
      onAddTextLayer({ x: (nativeClickX / imageNaturalDimensions.width) * 100, y: (nativeClickY / imageNaturalDimensions.height) * 100 });
      setActiveTool(null);
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
      
      setActiveTool(previousBrushTool || 'brush');
      setPreviousBrushTool(null);
    }
  };

  const backgroundLayer = layers.find(l => l.type === 'image');
  const isBackgroundVisible = backgroundLayer?.visible ?? true;

  const areAllChannelsVisible = channels.r && channels.g && channels.b;
  const isCurveSet = JSON.stringify(curves.all) !== JSON.stringify([{ x: 0, y: 0 }, { x: 255, y: 255 }]);
  const hasAdvancedEffects = effects.blur > 0 || effects.hueShift !== 0 || effects.sharpen > 0 || effects.clarity > 0;
  
  const isHslActive = Object.values(currentState.hslAdjustments).some(hsl => hsl.hue !== 0 || hsl.saturation !== 100 || hsl.luminance !== 0);
  
  const blurFilterUrl = (currentState.selectiveBlurMask && currentState.selectiveBlurAmount > 0) ? ' url(#selective-blur-filter)' : '';
  
  const baseFilter = getFilterString({ adjustments, effects, grading, selectedFilter, hslAdjustments: currentState.hslAdjustments });
  const curvesFilter = isCurveSet ? ' url(#curves-filter)' : '';
  const channelFilter = areAllChannelsVisible ? '' : ' url(#channel-filter)';
  const advancedEffectsFilter = hasAdvancedEffects ? ' url(#advanced-effects-filter)' : '';
  const hslFilter = isHslActive ? ' url(#hsl-filter)' : '';
  
  let colorModeFilter = '';
  if (currentState.colorMode === 'Grayscale') {
    colorModeFilter = ' grayscale(1)';
  } else if (currentState.colorMode === 'CMYK') {
    colorModeFilter = ' invert(1) hue-rotate(180deg) sepia(0.1) saturate(1.1)';
  }

  const imageFilterStyle = isPreviewingOriginal ? {} : { filter: `${baseFilter}${advancedEffectsFilter}${curvesFilter}${channelFilter}${hslFilter}${blurFilterUrl}${colorModeFilter}` };

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
  const selectionBrushCursor = 'crosshair';

  const brushSize = brushState.size;
  const brushBorderColor = activeTool === 'eraser' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)';
  const brushFillColor = activeTool === 'eraser' ? 'rgba(255,255,255,0.1)' : foregroundColor;
  const brushBorderWidth = 1;

  const dynamicBrushCursor = createBrushCursor(brushSize, brushFillColor, brushBorderColor, brushBorderWidth, brushState.shape);
  const dynamicEraserCursor = createBrushCursor(brushSize, brushFillColor, brushBorderColor, brushBorderWidth, brushState.shape);


  const getCursorStyle = useCallback(() => {
    if (!image) return 'default';
    if (isPanning) return 'grabbing';
    if (isSpaceDownRef.current) return 'grab';

    if (isMouseOverImage) {
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
        case 'blurBrush': return dynamicBrushCursor;
        default: return 'default';
      }
    }
    return 'default';
  }, [image, isPanning, isSpaceDownRef, isMouseOverImage, activeTool, lassoCursor, dynamicBrushCursor, dynamicEraserCursor, textCursor, cropCursor, eyedropperCursor, shapeCursor, moveToolCursor, gradientCursor, selectionBrushCursor, brushState.shape]);

  const renderWorkspaceLayers = (layersToRender: Layer[]) => {
    return layersToRender.map((layer) => {
      if (!layer.visible) return null;
      
      const layerProps = {
        key: layer.id,
        layer: layer,
        containerRef: layerContainerRef,
        onUpdate: onLayerUpdate,
        onCommit: onLayerCommit,
        isSelected: layer.id === selectedLayerId,
        activeTool: activeTool,
      };

      if (layer.type === 'text') {
        return <TextLayer {...layerProps} />;
      }
      if (layer.type === 'drawing' && layer.dataUrl) {
        return <DrawingLayer key={layer.id} layer={layer} />;
      }
      if (layer.type === 'smart-object') {
        return (
          <SmartObjectLayer
            {...layerProps}
            parentDimensions={imageNaturalDimensions}
          />
        );
      }
      if (layer.type === 'vector-shape') {
        return (
          <VectorShapeLayer
            {...layerProps}
          />
        );
      }
      if (layer.type === 'gradient') {
        return (
          <GradientLayer
            {...layerProps}
            imageNaturalDimensions={imageNaturalDimensions}
          />
        );
      }
      if (layer.type === 'group') {
        return (
          <GroupLayer
            {...layerProps}
            parentDimensions={imageNaturalDimensions}
            renderChildren={renderWorkspaceLayers}
            globalSelectedLayerId={selectedLayerId}
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
        (activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'selectionBrush' || activeTool === 'blurBrush') && isMouseOverImage && 'cursor-none',
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
      <HslFilter hslAdjustments={currentState.hslAdjustments} />
      {currentState.selectiveBlurMask && currentState.selectiveBlurAmount > 0 && (
        <SelectiveBlurFilter
          maskDataUrl={currentState.selectiveBlurMask}
          blurAmount={currentState.selectiveBlurAmount}
          imageNaturalDimensions={imageNaturalDimensions}
        />
      )}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 flex flex-col items-center justify-center pointer-events-none z-10 rounded-lg">
          <UploadCloud className="h-16 w-16 text-primary" />
          <p className="mt-2 text-lg font-semibold text-primary">Drop image to upload</p>
        </div>
      )}
      {image ? (
        <>
          <div 
            // This div applies the zoom and pan offset
            className="relative origin-center"
            style={{ 
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
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
                        ref={layerContainerRef} // This is the container for layers/canvases
                        className="relative" 
                        style={containerStyle}
                      >
                        <img
                          ref={imgRef}
                          src={image}
                          alt="Uploaded preview"
                          className="object-contain max-w-full max-h-[calc(100vh-12rem)] rounded-lg shadow-lg"
                          style={imageStyle}
                          onLoad={onImageLoad}
                          crossOrigin="anonymous"
                        />
                        
                        {renderWorkspaceLayers(layers)}

                        {activeTool === 'lasso' && (
                          <SelectionCanvas 
                            imageRef={imgRef}
                            selectionPath={selectionPath}
                            onSelectionComplete={onSelectionChange}
                          />
                        )}

                        {(activeTool === 'lasso' || activeTool === 'selectionBrush') && selectionMaskDataUrl && (
                          <SelectionMaskOverlay
                            maskDataUrl={selectionMaskDataUrl}
                            imageNaturalDimensions={imageNaturalDimensions}
                          />
                        )}

                        {(activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'selectionBrush' || activeTool === 'blurBrush') && (
                          <LiveBrushCanvas
                            brushState={brushState}
                            imageRef={imgRef}
                            onDrawEnd={onDrawingStrokeEnd}
                            activeTool={activeTool}
                            selectedLayerId={selectedLayerId}
                            onAddDrawingLayer={onAddDrawingLayer}
                            layers={layers}
                            isSelectionBrush={activeTool === 'selectionBrush'}
                            onSelectionBrushStrokeEnd={onSelectionBrushStrokeEnd}
                            onSelectiveBlurStrokeEnd={onSelectiveBlurStrokeEnd}
                            foregroundColor={foregroundColor}
                            backgroundColor={backgroundColor}
                          />
                        )}
                        {isDrawingShape && shapeStartCoords && shapeCurrentCoords && layerContainerRef.current && (
                          <ShapePreviewCanvas
                            start={shapeStartCoords}
                            current={shapeCurrentCoords}
                            shapeType={selectedShapeType || 'rect'}
                            containerRect={layerContainerRef.current.getBoundingClientRect()}
                            imageNaturalDimensions={imageNaturalDimensions}
                            fillColor="#3B82F6"
                            strokeColor="#FFFFFF"
                            strokeWidth={2}
                          />
                        )}
                        {isDrawingGradient && gradientStartCoords && gradientCurrentCoords && layerContainerRef.current && (
                          <GradientPreviewCanvas
                            start={gradientStartCoords}
                            current={gradientCurrentCoords}
                            gradientToolState={gradientToolState}
                            containerRect={layerContainerRef.current.getBoundingClientRect()}
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
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onFitScreen={onFitScreen}
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
                accept="image/png, image/jpeg, image/webp, .psd, .psb, .pdf, .ai, .cdr, .nanoedit"
              />
            </CardContent>
          </Card>
          <UrlUploader onUrlSelect={(url) => onUrlSelect(url)} />
          <SampleImages onSelect={(url) => onSampleSelect(url)} />
        </div>
      )}
    </div>
  );
};

export default Workspace;