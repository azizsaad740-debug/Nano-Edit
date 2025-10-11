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
import type { Layer, BrushState, Point, EditState } from "@/hooks/useEditorState";
import { WorkspaceControls } from "./WorkspaceControls";
import { useHotkeys } from "react-hotkeys-hook";
import { SelectionCanvas } from "./SelectionCanvas";
import { ChannelFilter } from "./ChannelFilter";
import { CurvesFilter } from "./CurvesFilter";
import { EffectsFilters } from "./EffectsFilters";
import { SmartObjectLayer } from "./SmartObjectLayer";
import VectorShapeLayer from "./VectorShapeLayer"; // Import VectorShapeLayer

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
  activeTool?: "lasso" | "brush" | "text" | "crop" | "eraser" | "eyedropper" | "shape" | null; // Added 'shape'
  layers: Layer[];
  onAddTextLayer: (coords: { x: number; y: number }) => void;
  onAddDrawingLayer: () => string;
  onAddShapeLayer: (coords: { x: number; y: number }, shapeType?: Layer['shapeType'], initialWidth?: number, initialHeight?: number) => void; // Added onAddShapeLayer
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string) => void;
  selectedLayerId: string | null;
  brushState: BrushState;
  selectionPath: Point[] | null;
  onSelectionChange: (path: Point[]) => void;
  handleColorPick: (color: string) => void;
  imageNaturalDimensions: { width: number; height: number; } | null; // Pass natural dimensions
  selectedShapeType: Layer['shapeType'] | null; // New prop for selected shape type
}

// New component for drawing shape preview
interface ShapePreviewCanvasProps {
  start: Point;
  current: Point;
  shapeType: Layer['shapeType'];
  containerRect: DOMRect;
  imageNaturalDimensions: { width: number; height: number; } | null;
}

const ShapePreviewCanvas = ({ start, current, shapeType, containerRect, imageNaturalDimensions }: ShapePreviewCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !imageNaturalDimensions) return;

    canvas.width = imageNaturalDimensions.width;
    canvas.height = imageNaturalDimensions.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

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
    ctx.stroke();
  }, [start, current, shapeType, containerRect, imageNaturalDimensions]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
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
    onLayerUpdate,
    onLayerCommit,
    selectedLayerId,
    brushState,
    selectionPath,
    onSelectionChange,
    handleColorPick,
    imageNaturalDimensions,
    selectedShapeType, // Destructure selectedShapeType
  } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const workspaceContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const activeDrawingLayerIdRef = useRef<string | null>(null);
  
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const isSpaceDownRef = useRef(false);

  // Shape drawing state
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeStartCoords, setShapeStartCoords] = useState<Point | null>(null);
  const [shapeCurrentCoords, setShapeCurrentCoords] = useState<Point | null>(null);

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
    if (!image) return;

    if ((isSpaceDownRef.current || e.button === 1)) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    } else if ((activeTool === 'brush' || activeTool === 'eraser')) {
      const selectedLayer = layers.find(l => l.id === selectedLayerId);
      if (selectedLayer && selectedLayer.type === 'drawing') {
        activeDrawingLayerIdRef.current = selectedLayer.id;
      } else {
        activeDrawingLayerIdRef.current = onAddDrawingLayer();
      }
      setIsDrawing(true);
    } else if (activeTool === 'shape' && imageContainerRef.current) {
      setIsDrawingShape(true);
      setShapeStartCoords({ x: e.clientX, y: e.clientY });
      setShapeCurrentCoords({ x: e.clientX, y: e.clientY });
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
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!image) return;

    if (isPanning) {
      setIsPanning(false);
    } else if (isDrawingShape && shapeStartCoords && shapeCurrentCoords && imageContainerRef.current && imageNaturalDimensions) {
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
      }
      setShapeStartCoords(null);
      setShapeCurrentCoords(null);
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
    if (!imageContainerRef.current || !imgRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeTool === 'text') {
      onAddTextLayer({ x: xPercent, y: yPercent });
    } else if (activeTool === 'eyedropper') {
      const canvas = document.createElement('canvas');
      const img = imgRef.current;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const nativeX = (xPercent / 100) * img.naturalWidth;
      const nativeY = (yPercent / 100) * img.naturalHeight;
      const pixel = ctx.getImageData(nativeX, nativeY, 1, 1).data;
      
      const toHex = (c: number) => ('0' + c.toString(16)).slice(-2);
      const hexColor = `#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`;
      
      handleColorPick(hexColor);
    }
  };

  const handleDrawEnd = useCallback((strokeDataUrl: string) => {
    setIsDrawing(false);
    const layerId = activeDrawingLayerIdRef.current;
    if (!layerId) return;

    const layer = layers.find(l => l.id === layerId);
    const baseDataUrl = layer?.dataUrl;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx || !imgRef.current) return;

    tempCanvas.width = imgRef.current.naturalWidth;
    tempCanvas.height = imgRef.current.naturalHeight;

    const baseImg = new Image();
    const strokeImg = new Image();

    const basePromise = baseDataUrl ? new Promise(res => { baseImg.onload = res; baseImg.src = baseDataUrl; }) : Promise.resolve();
    const strokePromise = new Promise(res => { strokeImg.onload = res; strokeImg.src = strokeDataUrl; });

    Promise.all([basePromise, strokePromise]).then(() => {
      if (baseDataUrl) tempCtx.drawImage(baseImg, 0, 0);
      
      if (activeTool === 'eraser') {
        tempCtx.globalCompositeOperation = 'destination-out';
      }
      
      tempCtx.drawImage(strokeImg, 0, 0);
      const combinedDataUrl = tempCanvas.toDataURL();
      onLayerUpdate(layerId, { dataUrl: combinedDataUrl });
      onLayerCommit(layerId);
    });
  }, [layers, onLayerUpdate, onLayerCommit, imgRef, activeTool]);

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

  const eyedropperCursor = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3.5c1.9 1.9 1.9 5.1 0 7L10 17l-4 4-1-1 4-4 6.5-6.5c1.9-1.9 5.1-1.9 7 0L16.5 3.5z"/><path d="m14 7 3 3"/><path d="M9 13.5 2.5 20"/></svg>\') 0 24, auto';

  return (
    <div
      ref={workspaceContainerRef}
      className={cn(
        "flex items-center justify-center h-full w-full bg-muted/20 rounded-lg relative transition-all overflow-hidden",
        isDragging && "border-2 border-dashed border-primary ring-4 ring-primary/20",
        activeTool === 'text' && 'cursor-crosshair',
        activeTool === 'shape' && 'cursor-crosshair', // Cursor for shape tool
        isPanning ? 'cursor-grabbing' : (isSpaceDownRef.current && image ? 'cursor-grab' : '')
      )}
      style={{ cursor: activeTool === 'eyedropper' ? eyedropperCursor : undefined }}
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
                      <div ref={imageContainerRef} className="relative" style={containerStyle}>
                        <img
                          ref={imgRef}
                          src={image}
                          alt="Uploaded preview"
                          className="object-contain max-w-full max-h-[calc(100vh-12rem)] rounded-lg shadow-lg"
                          style={imageStyle}
                          onLoad={onImageLoad}
                        />
                        {activeTool === 'lasso' && (
                          <SelectionCanvas 
                            imageRef={imgRef}
                            selectionPath={selectionPath}
                            onSelectionComplete={onSelectionChange}
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
                              backgroundImage: "url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYmVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuODUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIi8+PC9zdmc+\")",
                            }}
                          />
                        )}
                        {layers.map((layer) => {
                          if (layer.type === 'text') {
                            return <TextLayer key={layer.id} layer={layer} containerRef={imageContainerRef} onUpdate={onLayerUpdate} onCommit={onLayerCommit} isSelected={layer.id === selectedLayerId} />;
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
                                parentDimensions={imageNaturalDimensions} // Pass imageNaturalDimensions here
                              />
                            );
                          }
                          if (layer.type === 'vector-shape') { // Render vector shapes
                            return (
                              <VectorShapeLayer
                                key={layer.id}
                                layer={layer}
                                containerRef={imageContainerRef}
                                onUpdate={onLayerUpdate}
                                onCommit={onLayerCommit}
                                isSelected={layer.id === selectedLayerId}
                              />
                            );
                          }
                          return null;
                        })}
                        {isDrawing && (activeTool === 'brush' || activeTool === 'eraser') && (
                          <LiveBrushCanvas
                            brushState={brushState}
                            imageRef={imgRef}
                            onDrawEnd={handleDrawEnd}
                            activeTool={activeTool}
                          />
                        )}
                        {isDrawingShape && shapeStartCoords && shapeCurrentCoords && imageContainerRef.current && (
                          <ShapePreviewCanvas
                            start={shapeStartCoords}
                            current={shapeCurrentCoords}
                            shapeType={selectedShapeType || 'rect'}
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