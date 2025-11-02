import React, { useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  type Layer, type EditState, type ActiveTool, type BrushState, type Point, type GradientToolState,
  isImageOrDrawingLayer,
} from '@/types/editor';
import { useIsMobile } from '@/hooks/use-mobile';
import { ImageLayer } from './ImageLayer';
import { DrawingLayer } from './DrawingLayer';
import { TextLayer } from './TextLayer';
import VectorShapeLayer from './VectorShapeLayer';
import { GradientLayer } from './GradientLayer';
import GroupLayer from './GroupLayer';
import { SmartObjectLayer } from './SmartObjectLayer';
import { SelectionCanvas } from './SelectionCanvas';
import MarqueeCanvas from './MarqueeCanvas';
import { GradientPreviewCanvas } from './GradientPreviewCanvas';
import { WorkspaceControls } from './WorkspaceControls';
import { SelectionMaskOverlay } from './SelectionMaskOverlay';
import { SelectiveBlurFilter } from './SelectiveBlurFilter';
import { SelectiveSharpenFilter } from './SelectiveSharpenFilter';
import { ChannelFilter } from './ChannelFilter';
import { EffectsFilters } from './EffectsFilters';
import { HslFilter } from './HslFilter';
import { CurvesFilter } from './CurvesFilter';
import { Workspace } from './Workspace';
import { useCropTool } from '@/hooks/useCropTool';
import { useDrawing } from '@/hooks/useDrawing';
import { useHistoryBrush } from '@/hooks/useHistoryBrush';
import { useSelectiveRetouchBrush } from '@/hooks/useSelectiveRetouchBrush';
import { useMoveToolInteraction } from '@/hooks/useMoveToolInteraction';
import { useGradientToolInteraction } from '@/hooks/useGradientToolInteraction';
import { useMarqueeToolInteraction } from '@/hooks/useMarqueeToolInteraction';
import { useLassoToolInteraction } from '@/hooks/useLassoToolInteraction';
import { useEyedropperToolInteraction } from '@/hooks/useEyedropperToolInteraction';
import { useTextToolInteraction } from '@/hooks/useTextToolInteraction';
import { useShapeToolInteraction } from '@/hooks/useShapeToolInteraction';
import { useZoomToolInteraction } from '@/hooks/useZoomToolInteraction';
import { useHandToolInteraction } from '@/hooks/useHandToolInteraction';
import { useMagicWandToolInteraction } from '@/hooks/useMagicWandToolInteraction';
import { useObjectSelectToolInteraction } from '@/hooks/useObjectSelectToolInteraction';
import { useCloneStampToolInteraction } from '@/hooks/useCloneStampToolInteraction';
import { usePatternStampToolInteraction } from '@/hooks/usePatternStampToolInteraction';
import { useArtHistoryBrushToolInteraction } from '@/hooks/useArtHistoryBrushToolInteraction';
import { useEraserToolInteraction } from '@/hooks/useEraserToolInteraction';
import { usePencilToolInteraction } from '@/hooks/usePencilToolInteraction';
import { useBlurSharpenToolInteraction } from '@/hooks/useBlurSharpenToolInteraction';
import { useSelectionBrushToolInteraction } from '@/hooks/useSelectionBrushToolInteraction';
import { useQuickSelectToolInteraction } from '@/hooks/useQuickSelectToolInteraction';
import { usePaintBucketToolInteraction } from '@/hooks/usePaintBucketToolInteraction';
import { LiveBrushCanvas } from './LiveBrushCanvas';

interface EditorWorkspaceProps {
  workspaceRef: React.RefObject<HTMLDivElement>;
  imgRef: React.RefObject<HTMLImageElement>;
  image: string | null;
  dimensions: { width: number; height: number } | null;
  currentEditState: EditState;
  layers: Layer[];
  selectedLayerId: string | null;
  activeTool: ActiveTool | null;
  brushState: BrushState;
  foregroundColor: string;
  backgroundColor: string;
  gradientToolState: GradientToolState;
  selectionPath: Point[] | null;
  selectionMaskDataUrl: string | null;
  selectiveBlurMask: string | null | undefined;
  selectiveBlurAmount: number;
  selectiveSharpenMask: string | null | undefined;
  selectiveSharpenAmount: number;
  marqueeStart: Point | null;
  marqueeCurrent: Point | null;
  gradientStart: Point | null;
  gradientCurrent: Point | null;
  cloneSourcePoint: Point | null;
  base64Image: string | null;
  historyImageSrc: string | null;
  onCropChange: (crop: any) => void;
  onCropComplete: (crop: any) => void;
  handleWorkspaceMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleWorkspaceMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleWorkspaceMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  setIsMouseOverImage: (isOver: boolean) => void;
  handleDrawingStrokeEnd: (strokeDataUrl: string, layerId: string) => void;
  handleSelectionBrushStrokeEnd: (strokeDataUrl: string, operation: 'add' | 'subtract') => void;
  handleSelectiveRetouchStrokeEnd: (strokeDataUrl: string, tool: 'blurBrush' | 'sharpenTool', operation: 'add' | 'subtract') => void;
  handleHistoryBrushStrokeEnd: (strokeDataUrl: string, layerId: string) => void;
  handleAddDrawingLayer: (coords: Point, dataUrl: string) => string;
  setSelectionPath: (path: Point[] | null) => void;
  setSelectionMaskDataUrl: (dataUrl: string | null) => void;
  clearSelectionState: () => void;
  updateCurrentState: (updates: Partial<EditState>) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  commitLayerChange: (id: string, name: string) => void;
  workspaceZoom: number;
  handleFitScreen: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  isPreviewingOriginal: boolean;
  setSelectedLayerId: (id: string | null) => void;
  recordHistory: (name: string, state: EditState, layers: Layer[]) => void; // ADDED
  setGradientStart: (point: Point | null) => void; // ADDED
  setGradientCurrent: (point: Point | null) => void; // ADDED
  setMarqueeStart: (point: Point | null) => void; // ADDED
  setMarqueeCurrent: (point: Point | null) => void; // ADDED
  setForegroundColor: (color: string) => void; // ADDED
  setCloneSourcePoint: (point: Point | null) => void; // ADDED
}

// Helper component to render layers recursively
const renderLayer = (
  layer: Layer,
  containerRef: React.RefObject<HTMLDivElement>,
  props: EditorWorkspaceProps,
  globalSelectedLayerId: string | null,
): JSX.Element | null => {
  if (!layer.visible) return null;

  const isSelected = props.selectedLayerId === layer.id;
  const layerProps = {
    key: layer.id,
    layer,
    containerRef,
    onUpdate: props.updateLayer,
    onCommit: (id: string) => props.commitLayerChange(id, `Update Layer: ${layer.name}`), // Fixed onCommit signature
    isSelected,
    activeTool: props.activeTool,
    zoom: props.workspaceZoom,
    setSelectedLayerId: props.setSelectedLayerId,
  };

  if (layer.type === 'image' || layer.type === 'drawing') {
    // Base image/drawing layers are handled by ImageLayer/DrawingLayer
    if (layer.id === 'background' && props.image) {
      // The main background image is handled separately below, but we include it here for layer list consistency
      return null; 
    }
    if (layer.type === 'drawing') {
      return <DrawingLayer {...layerProps} />;
    }
    // If it's an image layer other than background, treat it like a drawing layer with image content
    if (layer.type === 'image') {
      return <ImageLayer {...layerProps} />;
    }
  }
  if (layer.type === 'text') {
    return <TextLayer {...layerProps} />;
  }
  if (layer.type === 'vector-shape') {
    return <VectorShapeLayer {...layerProps} />;
  }
  if (layer.type === 'gradient') {
    return <GradientLayer {...layerProps} imageNaturalDimensions={props.dimensions} />;
  }
  if (layer.type === 'smart-object') {
    return <SmartObjectLayer {...layerProps} parentDimensions={props.dimensions} />;
  }
  if (layer.type === 'group') {
    const groupLayer = layer as GroupLayer;
    return (
      <GroupLayer
        {...layerProps}
        parentDimensions={props.dimensions}
        globalSelectedLayerId={globalSelectedLayerId}
        renderChildren={(child) => renderLayer(child, layerProps.containerRef, props, globalSelectedLayerId)}
      />
    );
  }
  return null;
};


export const EditorWorkspace: React.FC<EditorWorkspaceProps> = (props) => {
  const { crop, transform, frame, channels, curves, effects, grading, selectedFilter, hslAdjustments, colorMode } = props.currentEditState;
  const isMobile = useIsMobile();
  
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  // Determine the size of the image container based on dimensions and zoom
  const containerStyle = useMemo(() => {
    if (!props.dimensions) return {};
    return {
      width: props.dimensions.width * props.workspaceZoom,
      height: props.dimensions.height * props.workspaceZoom,
    };
  }, [props.dimensions, props.workspaceZoom]);

  // Determine if any brush tool is active
  const isBrushToolActive = props.activeTool === 'brush' || props.activeTool === 'eraser' || props.activeTool === 'pencil' || props.activeTool === 'selectionBrush' || props.activeTool === 'blurBrush' || props.activeTool === 'cloneStamp' || props.activeTool === 'patternStamp' || props.activeTool === 'historyBrush' || props.activeTool === 'artHistoryBrush' || props.activeTool === 'sharpenTool';
  
  // Determine if any selection tool is active
  const isSelectionToolActive = props.activeTool === 'marqueeRect' || props.activeTool === 'marqueeEllipse' || props.activeTool === 'lasso' || props.activeTool === 'lassoPoly' || props.activeTool === 'quickSelect' || props.activeTool === 'magicWand' || props.activeTool === 'objectSelect';
  
  // Determine if gradient tool is active and drawing
  const isGradientDrawing = props.activeTool === 'gradient' && props.gradientStart && props.gradientCurrent;
  
  // Determine if crop tool is active
  const isCropToolActive = props.activeTool === 'crop';

  // Determine if selection path is active (for lasso/poly lasso)
  const isLassoActive = (props.activeTool === 'lasso' || props.activeTool === 'lassoPoly') && props.selectionPath && props.selectionPath.length > 0;

  // Determine if marquee is active
  const isMarqueeActive = (props.activeTool === 'marqueeRect' || props.activeTool === 'marqueeEllipse') && props.marqueeStart && props.marqueeCurrent;

  // Determine if we should show the original image (preview mode)
  const showOriginal = props.isPreviewingOriginal;
  
  // Get the background layer data URL
  const backgroundLayer = props.layers.find(l => l.id === 'background');
  const backgroundDataUrl = backgroundLayer && isImageOrDrawingLayer(backgroundLayer) ? backgroundLayer.dataUrl : null;

  // --- Tool Interaction Hooks (Stubs for now, but needed for event handling) ---
  useCropTool({ activeTool: props.activeTool, dimensions: props.dimensions, crop: crop, onCropChange: props.onCropChange, onCropComplete: props.onCropComplete, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom });
  useDrawing({ activeTool: props.activeTool, brushState: props.brushState, foregroundColor: props.foregroundColor, dimensions: props.dimensions, onStrokeEnd: props.handleDrawingStrokeEnd, selectedLayerId: props.selectedLayerId, baseImageSrc: props.base64Image });
  useHistoryBrush({ activeTool: props.activeTool, brushState: props.brushState, dimensions: props.dimensions, onStrokeEnd: props.handleHistoryBrushStrokeEnd, selectedLayerId: props.selectedLayerId, historyImageSrc: props.historyImageSrc });
  useSelectiveRetouchBrush({ activeTool: props.activeTool, brushState: props.brushState, dimensions: props.dimensions, onStrokeEnd: props.handleSelectiveRetouchStrokeEnd, selectedLayerId: props.selectedLayerId });
  useMoveToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions, selectedLayerId: props.selectedLayerId, updateLayer: props.updateLayer, commitLayerChange: props.commitLayerChange, layers: props.layers });
  useGradientToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions, gradientStart: props.gradientStart, gradientCurrent: props.gradientCurrent, setGradientStart: props.setGradientStart, setGradientCurrent: props.setGradientCurrent, addGradientLayer: props.addGradientLayer });
  useMarqueeToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions, marqueeStart: props.marqueeStart, marqueeCurrent: props.marqueeCurrent, setMarqueeStart: props.setMarqueeStart, setMarqueeCurrent: props.setMarqueeCurrent, setSelectionMaskDataUrl: props.setSelectionMaskDataUrl, recordHistory: props.recordHistory, currentEditState: props.currentEditState, layers: props.layers });
  useLassoToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions, selectionPath: props.selectionPath, setSelectionPath: props.setSelectionPath, setSelectionMaskDataUrl: props.setSelectionMaskDataUrl, recordHistory: props.recordHistory, currentEditState: props.currentEditState, layers: props.layers });
  useEyedropperToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions, setForegroundColor: props.setForegroundColor });
  useTextToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions, addTextLayer: props.addTextLayer, foregroundColor: props.foregroundColor });
  useShapeToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions, addShapeLayer: props.addShapeLayer, selectedShapeType: props.currentEditState.selectedShapeType });
  useZoomToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, handleZoomIn: props.handleZoomIn, handleZoomOut: props.handleZoomOut });
  useHandToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom });
  useMagicWandToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions, setSelectionMaskDataUrl: props.setSelectionMaskDataUrl, recordHistory: props.recordHistory, currentEditState: props.currentEditState, layers: props.layers });
  useObjectSelectToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions, setSelectionMaskDataUrl: props.setSelectionMaskDataUrl, recordHistory: props.recordHistory, currentEditState: props.currentEditState, layers: props.layers });
  useCloneStampToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions, setCloneSourcePoint: props.setCloneSourcePoint, cloneSourcePoint: props.cloneSourcePoint });
  usePatternStampToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions });
  useArtHistoryBrushToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions });
  useEraserToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions });
  usePencilToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions });
  useBlurSharpenToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions });
  useSelectionBrushToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions, brushState: props.brushState, foregroundColor: props.foregroundColor, backgroundColor: props.backgroundColor, onStrokeEnd: props.handleSelectionBrushStrokeEnd, selectionMaskDataUrl: props.selectionMaskDataUrl, setSelectionMaskDataUrl: props.setSelectionMaskDataUrl, recordHistory: props.recordHistory, currentEditState: props.currentEditState, layers: props.layers });
  useQuickSelectToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions, setSelectionMaskDataUrl: props.setSelectionMaskDataUrl, recordHistory: props.recordHistory, currentEditState: props.currentEditState, layers: props.layers });
  usePaintBucketToolInteraction({ activeTool: props.activeTool, workspaceRef: props.workspaceRef, imageContainerRef, zoom: props.workspaceZoom, dimensions: props.dimensions, foregroundColor: props.foregroundColor, selectedLayerId: props.selectedLayerId, updateLayer: props.updateLayer, commitLayerChange: props.commitLayerChange });
  
  // --- Rendering ---
  
  if (!props.dimensions || !backgroundDataUrl) {
    return (
      <Workspace
        workspaceRef={props.workspaceRef}
        handleWorkspaceMouseDown={props.handleWorkspaceMouseDown}
        handleWorkspaceMouseMove={props.handleWorkspaceMouseMove}
        handleWorkspaceMouseUp={props.handleWorkspaceMouseUp}
        handleWheel={props.handleWheel}
        setIsMouseOverImage={props.setIsMouseOverImage}
      >
        <div className="text-center text-muted-foreground">
          <p>Start a new project or open an image.</p>
        </div>
      </Workspace>
    );
  }

  // Apply global filters via SVG filters
  const filterString = showOriginal ? 'none' : props.currentEditState.selectedFilter;
  const filterUrl = showOriginal ? 'none' : (
    (props.selectiveBlurMask && props.selectiveBlurAmount > 0) ? 'url(#selective-blur-filter)' :
    (props.selectiveSharpenMask && props.selectiveSharpenAmount > 0) ? 'url(#selective-sharpen-filter)' :
    (props.currentEditState.channels.r === false || props.currentEditState.channels.g === false || props.currentEditState.channels.b === false) ? 'url(#channel-filter)' :
    (props.currentEditState.effects.blur > 0 || props.currentEditState.effects.hueShift !== 0 || props.currentEditState.effects.sharpen > 0 || props.currentEditState.effects.clarity > 0) ? 'url(#advanced-effects-filter)' :
    'none'
  );
  
  const imageStyle: React.CSSProperties = {
    filter: `${filterString} ${filterUrl === 'none' ? '' : filterUrl}`,
    transform: `rotate(${props.currentEditState.rotation}deg) scaleX(${props.currentEditState.transform.scaleX}) scaleY(${props.currentEditState.transform.scaleY})`,
    mixBlendMode: props.layers.find(l => l.id === 'background')?.blendMode as any || 'normal', // Fixed access to layers
    opacity: (props.layers.find(l => l.id === 'background')?.opacity ?? 100) / 100, // Fixed access to layers
  };
  
  // Apply CMYK simulation filter if active
  if (props.currentEditState.colorMode === 'CMYK') {
    imageStyle.filter = `${imageStyle.filter} grayscale(100%) sepia(100%) hue-rotate(180deg) contrast(120%)`; // Simple CMYK simulation
  }
  
  // Apply frame padding if active
  const framePadding = props.currentEditState.frame.size || 0;
  const frameColor = props.currentEditState.frame.color || '#000000';
  
  const frameStyle: React.CSSProperties = {
    padding: `${framePadding * props.workspaceZoom}px`,
    backgroundColor: frameColor,
    borderRadius: `${props.currentEditState.frame.roundness || 0}px`,
    boxShadow: props.currentEditState.frame.type === 'vignette' ? `inset 0 0 ${props.currentEditState.frame.vignetteAmount * 5}px rgba(0, 0, 0, 0.8)` : 'none',
  };

  return (
    <Workspace
      workspaceRef={props.workspaceRef}
      handleWorkspaceMouseDown={props.handleWorkspaceMouseDown}
      handleWorkspaceMouseMove={props.handleWorkspaceMouseMove}
      handleWorkspaceMouseUp={props.handleWorkspaceMouseUp}
      handleWheel={props.handleWheel}
      setIsMouseOverImage={props.setIsMouseOverImage}
    >
      {/* SVG Filters Container */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <ChannelFilter channels={props.currentEditState.channels} />
        <EffectsFilters effects={props.currentEditState.effects} />
        <HslFilter hslAdjustments={props.currentEditState.hslAdjustments} />
        <CurvesFilter curves={props.currentEditState.curves} />
        {props.selectiveBlurMask && props.selectiveBlurAmount > 0 && props.dimensions && (
          <SelectiveBlurFilter 
            maskDataUrl={props.selectiveBlurMask} 
            blurAmount={props.selectiveBlurAmount} 
            imageNaturalDimensions={props.dimensions} 
          />
        )}
        {props.selectiveSharpenMask && props.selectiveSharpenAmount > 0 && props.dimensions && (
          <SelectiveSharpenFilter 
            maskDataUrl={props.selectiveSharpenMask} 
            sharpenAmount={props.selectiveSharpenAmount} 
            imageNaturalDimensions={props.dimensions} 
          />
        )}
      </svg>

      <div 
        ref={imageContainerRef}
        className={cn(
          "relative transition-all duration-100 ease-out shadow-2xl bg-background",
          isCropToolActive && "cursor-crosshair"
        )}
        style={{ ...containerStyle, ...frameStyle }}
      >
        {/* 1. Background Image Layer */}
        <img
          ref={props.imgRef}
          src={backgroundDataUrl || undefined}
          alt="Editable Image"
          className="w-full h-full object-contain pointer-events-none"
          style={imageStyle}
          crossOrigin="anonymous"
        />
        
        {/* 2. Other Layers (Rendered in reverse order of array, so index 0 is on top) */}
        <div className="absolute inset-0 pointer-events-none">
          {props.layers.slice(1).reverse().map(layer => renderLayer(layer, imageContainerRef, props, props.selectedLayerId))}
        </div>

        {/* 3. Selection Mask Overlay (Shows the selected area) */}
        {props.selectionMaskDataUrl && props.dimensions && (
          <SelectionMaskOverlay 
            maskDataUrl={props.selectionMaskDataUrl} 
            imageNaturalDimensions={props.dimensions} 
            overlayColor="rgba(255, 0, 0, 0.3)"
          />
        )}

        {/* 4. Live Tool Canvases (Marquee, Lasso, Gradient, Brush) */}
        {isMarqueeActive && props.dimensions && (
          <MarqueeCanvas 
            start={props.marqueeStart!} 
            current={props.marqueeCurrent!} 
            activeTool={props.activeTool as 'marqueeRect' | 'marqueeEllipse'}
          />
        )}
        
        {isLassoActive && props.dimensions && (
          <SelectionCanvas
            imageRef={props.imgRef}
            onSelectionComplete={(path) => {
              // This is handled by the LassoToolInteraction hook, but we keep the component here
            }}
            selectionPath={props.selectionPath}
            activeTool={props.activeTool as 'lasso' | 'lassoPoly'}
          />
        )}
        
        {isGradientDrawing && props.dimensions && (
          <GradientPreviewCanvas
            start={props.gradientStart!}
            current={props.gradientCurrent!}
            gradientToolState={props.gradientToolState}
            containerRect={imageContainerRef.current!.getBoundingClientRect()}
            imageNaturalDimensions={props.dimensions}
          />
        )}
        
        {isBrushToolActive && props.dimensions && (
          <LiveBrushCanvas
            imageNaturalDimensions={props.dimensions}
            onStrokeEnd={props.handleDrawingStrokeEnd}
            onSelectionBrushStrokeEnd={props.handleSelectionBrushStrokeEnd}
            onSelectiveRetouchStrokeEnd={props.handleSelectiveRetouchStrokeEnd}
            activeTool={props.activeTool as any}
            brushState={props.brushState}
            foregroundColor={props.foregroundColor}
            backgroundColor={props.backgroundColor}
            cloneSourcePoint={props.cloneSourcePoint}
            selectedLayerId={props.selectedLayerId}
            zoom={props.workspaceZoom}
            baseImageSrc={props.base64Image}
            historyImageSrc={props.historyImageSrc}
          />
        )}
        
        {/* 5. Workspace Controls (Zoom, Fit Screen) */}
        <WorkspaceControls
          zoom={props.workspaceZoom}
          onZoomIn={props.handleZoomIn}
          onZoomOut={props.handleZoomOut}
          onFitScreen={props.handleFitScreen}
        />
      </div>
    </Workspace>
  );
};