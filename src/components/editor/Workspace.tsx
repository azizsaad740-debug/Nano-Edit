"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, Check, X } from "lucide-react";
import ReactCrop, { type Crop } from "react-image-crop";
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
import { VectorShapeLayer } from "./VectorShapeLayer";
import { GroupLayer } from "./GroupLayer";
import { GradientLayer } from "./GradientLayer";
import { GradientPreviewCanvas } from "./GradientPreviewCanvas";
import { SelectionMaskOverlay } from "./SelectionMaskOverlay";
import { SelectiveBlurFilter } from "./SelectiveBlurFilter";

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
  activeTool?: "lasso" | "brush" | "text" | "crop" | "eraser" | "eyedropper" | "shape" | "move" | "gradient" | "selectionBrush" | "blurBrush" | null;
  layers: Layer[];
  onAddTextLayer: (coords?: { x: number; y: number }) => void;
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
  onSelectLayer: (id: string) => void;
  brushState: BrushState;
  gradientToolState: GradientToolState;
  selectionPath: Point[] | null;
  selectionMaskDataUrl: string | null;
  onSelectionChange: (path: Point[]) => void;
  onSelectionBrushStrokeEnd: (strokeDataUrl: string, operation: 'add' | 'subtract') => void;
  onSelectiveBlurStrokeEnd: (strokeDataUrl: string, operation: 'add' | 'subtract') => void;
  handleColorPick: (color: string) => void;
  imageNaturalDimensions: { width: number; height: number } | null;
  selectedShapeType: Layer['shapeType'] | null;
  setSelectedLayer: (id: string | null) => void;
  setActiveTool: (tool: "lasso" | "brush" | "text" | "crop" | "eraser" | "eyedropper" | "shape" | "move" | "gradient" | "selectionBrush" | "blurBrush" | null) => void;
  foregroundColor: string;
  backgroundColor: string;
}

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
    onSelectLayer,
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
  } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const isSpaceDownRef = useRef(false);
  const [isMouseOverImage, setIsMouseOverImage] = useState(false);

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
    if (!imgRef.current || !imageContainerRef.current) return;
    const { naturalWidth, naturalHeight } = imgRef.current;
    const { clientWidth: containerWidth, clientHeight: containerHeight } = imageContainerRef.current;
    if (naturalWidth === 0 || naturalHeight === 0) return;
    const padding = 64;
    const widthRatio = (containerWidth - padding) / naturalWidth;
    const heightRatio = (containerHeight - padding) / naturalHeight;
    const newZoom = Math.min(widthRatio, heightRatio, 1);
    setZoom(newZoom);
    setPanOffset({ x: 0, y: 0 });
  }, [imgRef, imageContainerRef]);

  useEffect(() => {
    if (image) {
      const img = imgRef.current;
      const onImgLoad = () => setTimeout(handleFitScreen, 100);
      if (img) {
        img.addEventListener('load', onImgLoad, { once: true });
        if (img.complete) onImgLoad();
        return () => img.removeEventListener('load', onImgLoad);
      }
    }
  }, [image, handleFitScreen, imgRef]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!image || !imageContainerRef.current || !imageNaturalDimensions) return;

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
    }

    // Then handle panning if no drawing tool is active
    if ((isSpaceDownRef.current || e.button === 1 || activeTool === 'move')) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!image || !imageContainerRef.current || !imageNaturalDimensions) return;

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
          // Adjust angle to be 0-360 and relative to vertical for consistency with CSS gradients
          gradientAngle = (gradientAngle + 90 + 360) % 360;
        } else if (gradientToolState.type === 'radial') {
          radialCenterX = ((startX_px + width_px / 2) / imageNaturalDimensions.width) * 100;
          radialCenterY = ((startY_px + height_px / 2) / imageNaturalDimensions.height) * 100;
          radialRadius = (Math.sqrt(width_px * width_px + height_px * height_px) / 2) / Math.min(imageNaturalDimensions.width, imageNaturalDimensions.height)) * 100;
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
    if (!image || !imageContainerRef.current || !imageNaturalDimensions) return;
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Vertical Pan
      setPanOffset(prev => ({ ...prev, y: prev.y - e.deltaY }));
    } else if (e.altKey || e.shiftKey) {
      // Horizontal Pan
      setPanOffset(prev => ({ ...prev, x: prev.x - e.deltaY }));
    } else {
      // Zoom to cursor
      const rect = imageContainerRef.current.getBoundingClientRect();
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
  useHotkeys("+", handleZoomIn, { preventDefault: true });
  useHotkeys("-", handleZoomOut, { preventDefault: true });
  useHotkeys("f", handleFitScreen, { preventDefault: true });

  const triggerFileInput = () => fileInputRef.current?.click();
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => onFileSelect(event.target.files?.[0]);
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    onFileSelect(e.dataTransfer.files?.[0]);
  };

  const backgroundLayer = layers.find(l => l.type === 'image');
  const isBackgroundVisible = backgroundLayer?.visible ?? true;

  const areAllChannelsVisible = channels.r && channels.g && channels.b;
  const isCurveSet = JSON.stringify(curves.all) !== JSON.stringify([{ x: 0, y: 0 }, { x: 255, y: 255 }]);
  const hasAdvancedEffects = effects.blur > 0 || effects.hueShift !== 0 || effects.sharpen > 0 || effects.clarity > 0;

  // Simplified filter string - only apply filters when not previewing original image
  const imageFilterStyle = isPreviewingOriginal ? {} : { 
    filter: `${getFilterString({ adjustments, effects, grading, selectedFilter, hslAdjustments: currentState.hslAdjustments })}${isCurveSet ? 'url(#curves-filter)' : ''}${areAllChannelsVisible ? '' : 'url(#channel-filter)'}${hasAdvancedEffects ? 'url(#advanced-effects-filter)' : ''}`
  };

  const imageStyle: React.CSSProperties = { 
    ...imageFilterStyle, 
    visibility: isBackgroundVisible ? 'visible' : 'hidden' 
  };

  const wrapperTransformStyle = isPreviewingOriginal ? {} : { 
    transform: `rotate(${transforms.rotation}deg) scale(${transforms.scaleX}, ${transforms.scaleY})` 
  };

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

  return (
    <div className="flex-1 flex items-center justify-center overflow-hidden">
      <div
        ref={imageContainerRef}
        className={cn(
          "relative max-w-full max-h-[calc(100vh-12rem)] bg-muted/20 rounded-lg transition-all duration-200",
          isDragging && "border-2 border-dashed border-primary ring-4 ring-primary/20"
        )}
        style={wrapperTransformStyle}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <img
          ref={imgRef}
          src={image}
          alt="Uploaded preview"
          className="object-contain max-w-full max-h-[calc(100vh-12rem)] rounded-lg shadow-lg"
          style={imageStyle}
          onLoad={onImageLoad}
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

        {currentState.selectiveBlurMask && currentState.selectiveBlurAmount > 0 && (
          <SelectiveBlurFilter
            maskDataUrl={currentState.selectiveBlurMask}
            blurAmount={currentState.selectiveBlurAmount}
            imageNaturalDimensions={imageNaturalDimensions}
          />
        )}

        <div style={cropClipPathStyle}>
          {activeTool === 'crop' && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => onCropChange(percentCrop)}
              aspect={aspect}
              disabled={activeTool !== 'crop'}
            />
          )}
        </div>
      </div>

      <WorkspaceControls 
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitScreen={handleFitScreen}
      />
    </div>
  );
};

export default Workspace;