"use client";

import * as React from "react";
import ReactCrop, { Crop as CropType, PixelCrop, PercentCrop } from "react-image-crop"; // Added PercentCrop
import { cn } from "@/lib/utils";
import { Workspace } from "./Workspace";
import { WorkspaceControls } from "./WorkspaceControls";
import { SelectionMaskOverlay } from "./SelectionMaskOverlay";
import { LiveBrushCanvas } from "./LiveBrushCanvas";
import MarqueeCanvas from "./MarqueeCanvas";
import { GradientPreviewCanvas } from "./GradientPreviewCanvas";
import { SelectionCanvas } from "./SelectionCanvas";
import { SelectiveBlurFilter } from "./SelectiveBlurFilter";
import { SelectiveSharpenFilter } from "./SelectiveSharpenFilter";
import { ChannelFilter } from "./ChannelFilter";
import { EffectsFilters } from "./EffectsFilters";
import { HslFilter } from "./HslFilter";
import { CurvesFilter } from "./CurvesFilter";
import { CustomFontLoader } from "./CustomFontLoader";
import { ImageIcon } from "lucide-react"; // FIX 14: Added import
import { polygonToMaskDataUrl } from "@/utils/maskUtils"; // FIX 17: Added import
import { showError } from "@/utils/toast"; // FIX 20: Added import
import type {
  Layer,
  ActiveTool,
  Dimensions,
  CropState,
  Point,
  EditState,
  BrushState,
  GradientToolState,
  TextLayerData,
  DrawingLayerData,
  VectorShapeLayerData,
  GradientLayerData,
  SmartObjectLayerData,
  GroupLayerData,
  ShapeType, // FIX 11: Added import
} from "@/types/editor";
import {
  isImageLayer,
  isDrawingLayer,
  isTextLayer,
  isVectorShapeLayer,
  isGradientLayer,
  isAdjustmentLayer,
  isSmartObjectLayer,
  isGroupLayer,
} from "@/types/editor";
import { TextLayer } from "./TextLayer";
import { DrawingLayer } from "./DrawingLayer";
import { SmartObjectLayer } from "./SmartObjectLayer";
import VectorShapeLayer from "./VectorShapeLayer";
import { GradientLayer } from "./GradientLayer";
import GroupLayer from "./GroupLayer";
import { ImageLayer } from "./ImageLayer";

// Define the props interface based on usage in Index.tsx
interface EditorWorkspaceProps {
  workspaceRef: React.RefObject<HTMLDivElement>;
  imgRef: React.RefObject<HTMLImageElement>;
  image: string | null;
  dimensions: Dimensions | null;
  currentEditState: EditState;
  layers: Layer[];
  selectedLayerId: string | null;
  activeTool: ActiveTool | null;
  workspaceZoom: number;
  selectionMaskDataUrl: string | null;
  selectionPath: Point[] | null;
  marqueeStart: Point | null;
  marqueeCurrent: Point | null;
  gradientStart: Point | null;
  gradientCurrent: Point | null;
  brushState: BrushState;
  foregroundColor: string;
  backgroundColor: string;
  cloneSourcePoint: Point | null;
  isPreviewingOriginal: boolean;
  
  // Handlers
  handleWorkspaceMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleWorkspaceMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleWorkspaceMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  setIsMouseOverImage: (isOver: boolean) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleFitScreen: () => void;
  onCropChange: (crop: CropState) => void;
  onCropComplete: (crop: CropState) => void;
  handleDrawingStrokeEnd: (strokeDataUrl: string, layerId: string) => void;
  handleSelectionBrushStrokeEnd: (strokeDataUrl: string, operation: 'add' | 'subtract') => void;
  handleSelectiveRetouchStrokeEnd: (strokeDataUrl: string, tool: 'blurBrush' | 'sharpenTool', operation: 'add' | 'subtract') => void;
  handleHistoryBrushStrokeEnd: (strokeDataUrl: string, layerId: string) => void; // FIX 16: Added prop
  addGradientLayer: (start: Point, end: Point) => void;
  addTextLayer: (coords: Point, color: string) => void;
  addShapeLayer: (coords: Point, shapeType?: ShapeType) => void;
  setMarqueeStart: (point: Point | null) => void;
  setMarqueeCurrent: (point: Point | null) => void;
  setGradientStart: (point: Point | null) => void;
  setGradientCurrent: (point: Point | null) => void;
  setCloneSourcePoint: (point: Point | null) => void;
  
  // Layer Management
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  commitLayerChange: (id: string, name: string) => void;
  setSelectedLayerId: (id: string | null) => void;
  
  // Sources
  base64Image: string | null;
  historyImageSrc: string | null;
  
  // History/State Access for Canvas Logic
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void; // FIX 19: Added prop
  setSelectionMaskDataUrl: (url: string | null) => void; // FIX 18: Added prop
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = (props) => {
  const {
    workspaceRef,
    imgRef,
    image,
    dimensions,
    currentEditState,
    layers,
    selectedLayerId,
    activeTool,
    workspaceZoom,
    selectionMaskDataUrl,
    selectionPath,
    marqueeStart,
    marqueeCurrent,
    gradientStart,
    gradientCurrent,
    brushState,
    foregroundColor,
    backgroundColor,
    cloneSourcePoint,
    isPreviewingOriginal,
    
    // Handlers
    handleWorkspaceMouseDown,
    handleWorkspaceMouseMove,
    handleWorkspaceMouseUp,
    handleWheel,
    setIsMouseOverImage,
    handleZoomIn,
    handleZoomOut,
    handleFitScreen,
    onCropChange,
    onCropComplete,
    handleDrawingStrokeEnd,
    handleSelectionBrushStrokeEnd,
    handleSelectiveRetouchStrokeEnd,
    handleHistoryBrushStrokeEnd,
    addGradientLayer,
    addTextLayer,
    addShapeLayer,
    setMarqueeStart,
    setMarqueeCurrent,
    setGradientStart,
    setGradientCurrent,
    setCloneSourcePoint,
    
    // Layer Management
    updateLayer,
    commitLayerChange,
    setSelectedLayerId,
    
    // Sources
    base64Image,
    historyImageSrc,
    
    // History/State Access
    recordHistory, // FIX 19: Destructured
    setSelectionMaskDataUrl, // FIX 18: Destructured
  } = props;

  const hasImage = !!image && !!dimensions;
  const isCropToolActive = activeTool === "crop";
  const isMarqueeToolActive = activeTool === "marqueeRect" || activeTool === "marqueeEllipse";
  const isLassoToolActive = activeTool === "lasso" || activeTool === "lassoPoly";
  const isGradientToolActive = activeTool === "gradient" && gradientStart && gradientCurrent;
  const isBrushToolActive = activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'pencil' || activeTool === 'cloneStamp' || activeTool === 'patternStamp' || activeTool === 'historyBrush' || activeTool === 'artHistoryBrush' || activeTool === 'selectionBrush' || activeTool === 'blurBrush' || activeTool === 'sharpenTool';
  
  const imageContainerRef = React.useRef<HTMLDivElement>(null);

  // --- Layer Rendering Logic ---
  const renderLayer = (
    layer: Layer,
    currentContainerRef: React.RefObject<HTMLDivElement>,
    currentParentDimensions: Dimensions,
  ): JSX.Element | null => {
    if (!layer.visible) return null;

    const isSelected = selectedLayerId === layer.id;
    const layerProps = {
      key: layer.id,
      layer,
      containerRef: currentContainerRef,
      onUpdate: updateLayer,
      onCommit: commitLayerChange,
      isSelected,
      activeTool,
      zoom: workspaceZoom,
      setSelectedLayerId,
    };

    if (isTextLayer(layer)) {
      return <TextLayer {...layerProps} />;
    }
    if (isDrawingLayer(layer)) {
      return <DrawingLayer {...layerProps} />;
    }
    if (isImageLayer(layer) && layer.id !== 'background') {
      return <ImageLayer {...layerProps} />;
    }
    if (isSmartObjectLayer(layer)) {
      // FIX 12: SmartObjectLayer onCommit expects 2 arguments
      return <SmartObjectLayer {...layerProps} onCommit={(id) => commitLayerChange(id, `Update ${layer.name} Transform`)} parentDimensions={currentParentDimensions} />;
    }
    if (isVectorShapeLayer(layer)) {
      return <VectorShapeLayer {...layerProps} />;
    }
    if (isGradientLayer(layer)) {
      return <GradientLayer {...layerProps} imageNaturalDimensions={currentParentDimensions} />;
    }
    if (isGroupLayer(layer)) {
      // FIX 13: GroupLayer onCommit expects 2 arguments
      return (
        <GroupLayer
          {...layerProps}
          onCommit={(id) => commitLayerChange(id, `Update ${layer.name} Transform`)}
          parentDimensions={currentParentDimensions}
          globalSelectedLayerId={selectedLayerId}
          renderChildren={(child) => renderLayer(child, layerProps.containerRef, currentParentDimensions)}
        />
      );
    }
    return null;
  };
  // --- End Layer Rendering Logic ---

  // --- Filter Application ---
  const filterStyle: React.CSSProperties = React.useMemo(() => {
    if (isPreviewingOriginal) return {};
    
    const filters = currentEditState.selectedFilter ? [currentEditState.selectedFilter] : [];
    
    // Apply adjustments (brightness, contrast, saturation)
    const { adjustments } = currentEditState;
    filters.push(`brightness(${adjustments.brightness}%)`);
    filters.push(`contrast(${adjustments.contrast}%)`);
    filters.push(`saturate(${adjustments.saturation}%)`);
    
    // Apply grading (grayscale, sepia, invert)
    const { grading } = currentEditState;
    filters.push(`grayscale(${grading.grayscale}%)`);
    filters.push(`sepia(${grading.sepia}%)`);
    filters.push(`invert(${grading.invert}%)`);
    
    // Apply effects (vignette is handled by CSS overlay, others by SVG filter)
    const { effects } = currentEditState;
    if (effects.blur > 0 || effects.hueShift !== 0 || effects.sharpen > 0 || effects.clarity > 0) {
      filters.push(`url(#advanced-effects-filter)`);
    }
    
    // Apply HSL filter
    if (!currentEditState.channels.r || !currentEditState.channels.g || !currentEditState.channels.b) {
      filters.push(`url(#channel-filter)`);
    }
    
    // Apply HSL adjustments (master only, per-channel handled by SVG)
    // FIX 21: Use local state for gradientToolState check (although this is HSL, the logic was copied)
    if (currentEditState.hslAdjustments.master.hue !== 0 || currentEditState.hslAdjustments.master.saturation !== 0 || currentEditState.hslAdjustments.master.lightness !== 0) {
      filters.push(`url(#hsl-filter)`);
    }
    
    // Apply Curves filter
    if (!(currentEditState.curves.all.length === 2 && currentEditState.curves.all[0].x === 0 && currentEditState.curves.all[0].y === 0 && currentEditState.curves.all[1].x === 255 && currentEditState.curves.all[1].y === 255)) {
      filters.push(`url(#curves-filter)`);
    }
    
    // Apply selective retouching filters
    if (currentEditState.selectiveBlurMask && currentEditState.selectiveBlurAmount > 0) {
      filters.push(`url(#selective-blur-filter)`);
    }
    if (currentEditState.selectiveSharpenMask && currentEditState.selectiveSharpenAmount > 0) {
      filters.push(`url(#selective-sharpen-filter)`);
    }

    return { filter: filters.join(' ') };
  }, [currentEditState, isPreviewingOriginal]);

  // --- Image Container Style ---
  const containerStyle: React.CSSProperties = React.useMemo(() => {
    if (!dimensions) return {};

    const { crop, rotation, transform } = currentEditState;
    const scale = workspaceZoom;

    // Apply rotation from Transform panel
    const rotateZ = rotation || 0;
    
    // Apply flip/scale from Transform panel
    const scaleX = transform.scaleX || 1;
    const scaleY = transform.scaleY || 1;

    // Calculate cropped dimensions
    const croppedWidth = dimensions.width * (crop.width / 100);
    const croppedHeight = dimensions.height * (crop.height / 100);
    
    // Calculate crop offset (relative to the center of the cropped area)
    const offsetX = (crop.x - 50) * (dimensions.width / 100);
    const offsetY = (crop.y - 50) * (dimensions.height / 100);

    return {
      width: `${croppedWidth}px`,
      height: `${croppedHeight}px`,
      transform: `scale(${scale}) rotateZ(${rotateZ}deg) scaleX(${scaleX}) scaleY(${scaleY}) translate(${offsetX}px, ${offsetY}px)`,
      transformOrigin: 'center center',
      cursor: activeTool === 'hand' ? 'grab' : 'default',
    };
  }, [dimensions, currentEditState, workspaceZoom, activeTool]);

  // --- Crop Tool Logic ---
  const cropState: CropType = React.useMemo(() => ({
    unit: currentEditState.crop.unit,
    x: currentEditState.crop.x,
    y: currentEditState.crop.y,
    width: currentEditState.crop.width,
    height: currentEditState.crop.height,
    aspect: currentEditState.aspect,
  }), [currentEditState.crop, currentEditState.aspect]);

  const handleCropChange = (c: CropType) => {
    onCropChange(c as CropState);
  };

  const handleCropComplete = (c: PixelCrop, p: PercentCrop) => { // FIX 22: Corrected signature to match ReactCrop
    onCropComplete(p as CropState);
  };
  
  // --- Frame Overlay ---
  const frameOverlayStyle: React.CSSProperties = React.useMemo(() => {
    const { frame } = currentEditState;
    if (frame.type === 'none' || frame.width === 0) return {};
    
    const widthPx = frame.width;
    const roundnessPercent = frame.roundness;
    
    return {
      boxShadow: `inset 0 0 0 ${widthPx}px ${frame.color}`,
      borderRadius: `${roundnessPercent}%`,
      opacity: frame.opacity / 100,
      pointerEvents: 'none',
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 50,
    };
  }, [currentEditState.frame]);
  
  // --- Vignette Overlay (Separate from Frame) ---
  const vignetteOverlayStyle: React.CSSProperties = React.useMemo(() => {
    const { frame } = currentEditState;
    if (frame.vignetteAmount === 0) return {};
    
    const amount = frame.vignetteAmount / 100; // 0 to 1
    const roundness = frame.vignetteRoundness / 100; // 0 to 1
    
    // Radial gradient for vignette effect
    const color = currentEditState.frame.color || '#000000';
    
    return {
      background: `radial-gradient(ellipse at center, transparent 0%, ${color} ${50 - amount * 50}%, ${color} 100%)`,
      opacity: amount,
      borderRadius: `${roundness * 50}%`,
      pointerEvents: 'none',
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 50,
      mixBlendMode: 'multiply', // Standard vignette blend mode
    };
  }, [currentEditState.frame]);

  if (!hasImage) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted/50">
        <div className="text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-semibold">Start a New Project or Open an Image</p>
          <p className="text-sm">Use the File menu above.</p>
        </div>
      </div>
    );
  }

  return (
    <Workspace
      workspaceRef={workspaceRef}
      handleWorkspaceMouseDown={handleWorkspaceMouseDown}
      handleWorkspaceMouseMove={handleWorkspaceMouseMove}
      handleWorkspaceMouseUp={handleWorkspaceMouseUp}
      handleWheel={handleWheel}
      setIsMouseOverImage={setIsMouseOverImage}
    >
      {/* SVG Filters (Hidden) */}
      <ChannelFilter channels={currentEditState.channels} />
      <EffectsFilters effects={currentEditState.effects} />
      <HslFilter hslAdjustments={currentEditState.hslAdjustments} />
      <CurvesFilter curves={currentEditState.curves} />
      {currentEditState.selectiveBlurMask && currentEditState.selectiveBlurAmount > 0 && dimensions && (
        <SelectiveBlurFilter 
          maskDataUrl={currentEditState.selectiveBlurMask} 
          blurAmount={currentEditState.selectiveBlurAmount} 
          imageNaturalDimensions={dimensions} 
        />
      )}
      {currentEditState.selectiveSharpenMask && currentEditState.selectiveSharpenAmount > 0 && dimensions && (
        <SelectiveSharpenFilter 
          maskDataUrl={currentEditState.selectiveSharpenMask} 
          sharpenAmount={currentEditState.selectiveSharpenAmount} 
          imageNaturalDimensions={dimensions} 
        />
      )}
      <CustomFontLoader customFonts={currentEditState.customFonts || []} /> {/* FIX 15: Use currentEditState.customFonts */}

      {/* Image Container (Scaled and Transformed) */}
      <div
        ref={imageContainerRef}
        className={cn(
          "relative shadow-xl bg-background/50 border border-border transition-transform duration-100 ease-out",
          isCropToolActive && "cursor-crosshair"
        )}
        style={containerStyle}
      >
        {/* Base Image Layer (Background) */}
        {layers.slice().reverse().map((layer) => {
          if (layer.id === 'background' && isImageLayer(layer)) {
            return (
              <img
                key={layer.id}
                ref={imgRef}
                src={isPreviewingOriginal ? image : layer.dataUrl}
                alt="Base Image"
                className="w-full h-full object-contain pointer-events-none"
                style={{
                  ...filterStyle,
                  transform: `rotateZ(0deg) scaleX(1) scaleY(1)`, // Filters applied to the image element
                  filter: filterStyle.filter,
                  opacity: isPreviewingOriginal ? 1 : (layer.opacity / 100),
                  mixBlendMode: layer.blendMode as any || 'normal',
                }}
                crossOrigin="anonymous"
              />
            );
          }
          return null;
        })}
        
        {/* Other Layers (Drawn on top of the background image) */}
        {dimensions && (
          <div className="absolute inset-0">
            {layers.slice().reverse().map((layer) => {
              if (layer.id !== 'background') {
                return renderLayer(layer, imageContainerRef, dimensions);
              }
              return null;
            })}
          </div>
        )}

        {/* Frame Overlay */}
        <div style={frameOverlayStyle} />
        
        {/* Vignette Overlay */}
        <div style={vignetteOverlayStyle} />

        {/* Selection Mask Overlay (Red translucent mask) */}
        {selectionMaskDataUrl && dimensions && (
          <SelectionMaskOverlay 
            maskDataUrl={selectionMaskDataUrl} 
            imageNaturalDimensions={dimensions} 
            overlayColor="rgba(255, 0, 0, 0.5)"
          />
        )}

        {/* Live Brush Canvas (Drawing/Erasing/Stamping/Retouching) */}
        {isBrushToolActive && dimensions && (
          <LiveBrushCanvas
            imageNaturalDimensions={dimensions}
            onStrokeEnd={handleDrawingStrokeEnd}
            onSelectionBrushStrokeEnd={handleSelectionBrushStrokeEnd}
            onSelectiveRetouchStrokeEnd={handleSelectiveRetouchStrokeEnd}
            onHistoryBrushStrokeEnd={handleHistoryBrushStrokeEnd}
            activeTool={activeTool as any}
            brushState={brushState}
            foregroundColor={foregroundColor}
            backgroundColor={backgroundColor}
            cloneSourcePoint={cloneSourcePoint}
            selectedLayerId={selectedLayerId}
            zoom={workspaceZoom}
            baseImageSrc={base64Image}
            historyImageSrc={historyImageSrc}
          />
        )}

        {/* Live Marquee Selection Canvas */}
        {isMarqueeToolActive && marqueeStart && marqueeCurrent && (
          <MarqueeCanvas
            start={marqueeStart}
            current={marqueeCurrent}
            activeTool={activeTool as 'marqueeRect' | 'marqueeEllipse'}
          />
        )}
        
        {/* Live Lasso/Polygonal Lasso Canvas */}
        {isLassoToolActive && dimensions && imgRef.current && (
          <SelectionCanvas
            imageRef={imgRef}
            onSelectionComplete={(path) => {
              // This is handled by useLassoToolInteraction now, but we keep the prop for the canvas component
              // In a real app, this callback would trigger the mask creation logic in the hook.
              if (activeTool === 'lasso') {
                polygonToMaskDataUrl(path, dimensions.width, dimensions.height)
                  .then(setSelectionMaskDataUrl)
                  .then(() => recordHistory(`Lasso Selection`, currentEditState, layers))
                  .catch(() => showError("Failed to create selection mask."));
              }
            }}
            selectionPath={selectionPath}
            activeTool={activeTool as 'lasso' | 'lassoPoly'}
          />
        )}

        {/* Live Gradient Preview Canvas */}
        {activeTool === 'gradient' && gradientStart && gradientCurrent && dimensions && (
          <GradientPreviewCanvas
            start={gradientStart}
            current={gradientCurrent}
            gradientToolState={currentEditState.gradientToolState}
            containerRect={imageContainerRef.current?.getBoundingClientRect() || new DOMRect()}
            imageNaturalDimensions={dimensions}
          />
        )}

        {/* Crop Tool Overlay */}
        {isCropToolActive && dimensions && (
          <ReactCrop
            crop={cropState}
            onChange={handleCropChange}
            onComplete={handleCropComplete}
            aspect={currentEditState.aspect}
            minWidth={10}
            minHeight={10}
            className="absolute inset-0"
          >
            <div className="w-full h-full" />
          </ReactCrop>
        )}
      </div>

      {/* Workspace Controls (Zoom, Fit) */}
      <WorkspaceControls
        zoom={workspaceZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitScreen={handleFitScreen}
      />
    </Workspace>
  );
};