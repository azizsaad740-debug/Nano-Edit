"use client";

import * as React from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import { cn } from "@/lib/utils";
import type { Layer, EditState, ActiveTool, BrushState, Point, GradientToolState } from "@/types/editor";
import { isImageOrDrawingLayer } from "@/types/editor"; // Import type guard
import { Workspace } from "./Workspace";
import { WorkspaceControls } from "./WorkspaceControls";
import { TextLayer } from "./TextLayer";
import { DrawingLayer } from "./DrawingLayer";
import { SmartObjectLayer } from "./SmartObjectLayer";
import VectorShapeLayer from "./VectorShapeLayer";
import GradientLayer from "./GradientLayer";
import GroupLayer from "./GroupLayer";
import { LiveBrushCanvas } from "./LiveBrushCanvas";
import { SelectionCanvas } from "./SelectionCanvas";
import MarqueeCanvas from "./MarqueeCanvas";
import { GradientPreviewCanvas } from "./GradientPreviewCanvas";
import { SelectionMaskOverlay } from "./SelectionMaskOverlay";
import { ChannelFilter } from "./ChannelFilter";
import { CurvesFilter } from "./CurvesFilter";
import { EffectsFilters } from "./EffectsFilters";
import { SelectiveBlurFilter } from "./SelectiveBlurFilter";
import { SelectiveSharpenFilter } from "./SelectiveSharpenFilter"; // NEW IMPORT
import { AdjustmentLayer } from "./AdjustmentLayer";
import { polygonToMaskDataUrl } from "@/utils/maskUtils"; // Import missing utility
import { showError } from "@/utils/toast"; // Import missing utility

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
  selectiveBlurMask: string | null;
  selectiveBlurAmount: number;
  selectiveSharpenMask: string | null; // NEW
  selectiveSharpenAmount: number; // NEW
  marqueeStart: Point | null;
  marqueeCurrent: Point | null;
  gradientStart: Point | null;
  gradientCurrent: Point | null;
  cloneSourcePoint: Point | null;
  base64Image: string | null; // ADDED PROP
  historyImageSrc: string | null; // NEW PROP
  
  // Handlers
  onCropChange: (crop: Crop) => void;
  onCropComplete: (crop: Crop) => void;
  handleWorkspaceMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleWorkspaceMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleWorkspaceMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  setIsMouseOverImage: (isOver: boolean) => void;
  handleDrawingStrokeEnd: (strokeDataUrl: string, layerId: string) => void;
  handleSelectionBrushStrokeEnd: (strokeDataUrl: string, operation: 'add' | 'subtract') => void;
  handleSelectiveRetouchStrokeEnd: (strokeDataUrl: string, tool: 'blurBrush' | 'sharpenTool', operation: 'add' | 'subtract') => void; // UPDATED
  handleHistoryBrushStrokeEnd: (strokeDataUrl: string, layerId: string, historyStateName: string) => void;
  handleAddDrawingLayer: () => string;
  setSelectionPath: (path: Point[] | null) => void;
  setSelectionMaskDataUrl: (url: string | null) => void;
  clearSelectionState: () => void;
  updateCurrentState: (updates: Partial<EditState>) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  commitLayerChange: (id: string) => void;
  workspaceZoom: number;
  handleFitScreen: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  isPreviewingOriginal: boolean;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  workspaceRef,
  imgRef,
  image,
  dimensions,
  currentEditState,
  layers,
  selectedLayerId,
  activeTool,
  brushState,
  foregroundColor,
  backgroundColor,
  gradientToolState,
  selectionPath,
  selectionMaskDataUrl,
  selectiveBlurMask,
  selectiveBlurAmount,
  selectiveSharpenMask, // NEW
  selectiveSharpenAmount, // NEW
  marqueeStart,
  marqueeCurrent,
  gradientStart,
  gradientCurrent,
  cloneSourcePoint,
  base64Image, // DESTRUCTURED
  historyImageSrc, // DESTRUCTURED
  onCropChange,
  onCropComplete,
  handleWorkspaceMouseDown,
  handleWorkspaceMouseMove,
  handleWorkspaceMouseUp,
  handleWheel,
  setIsMouseOverImage,
  handleDrawingStrokeEnd,
  handleSelectionBrushStrokeEnd,
  handleSelectiveRetouchStrokeEnd, // UPDATED
  handleHistoryBrushStrokeEnd,
  handleAddDrawingLayer,
  setSelectionPath,
  setSelectionMaskDataUrl,
  clearSelectionState,
  updateCurrentState,
  updateLayer,
  commitLayerChange,
  workspaceZoom,
  handleFitScreen,
  handleZoomIn,
  handleZoomOut,
  isPreviewingOriginal,
}) => {
  const { crop, transforms, frame, channels, curves, effects, grading, selectedFilter, hslAdjustments, colorMode } = currentEditState;

  if (!dimensions) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/50">
        <p className="text-muted-foreground">Load an image or create a new project to begin.</p>
      </div>
    );
  }

  const { width, height } = dimensions;
  const { rotation, scaleX, scaleY } = transforms;

  const isCropActive = activeTool === 'crop';
  const isMarqueeActive = activeTool?.startsWith('marquee');
  const isLassoActive = activeTool?.startsWith('lasso');
  const isBrushToolActive = activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'pencil' || activeTool === 'cloneStamp' || activeTool === 'patternStamp';
  const isSelectionBrushToolActive = activeTool === 'selectionBrush' || activeTool === 'blurBrush' || activeTool === 'sharpenTool'; // UPDATED
  const isHistoryBrushActive = activeTool === 'historyBrush' || activeTool === 'artHistoryBrush';
  const isGradientToolActive = activeTool === 'gradient' && gradientStart && gradientCurrent;

  // Define the transform string for rotated/flipped elements
  const transformStyle = `rotateZ(${rotation || 0}deg) scaleX(${scaleX ?? 1}) scaleY(${scaleY ?? 1})`;

  // --- Filter String Generation ---
  const filterString = isPreviewingOriginal ? 'none' : `${selectedFilter} ${effects.vignette > 0 ? `url(#vignette-filter)` : ''} ${effects.noise > 0 ? `url(#noise-filter)` : ''} ${selectiveBlurAmount > 0 && selectiveBlurMask ? `url(#selective-blur-filter)` : ''} ${selectiveSharpenAmount > 0 && selectiveSharpenMask ? `url(#selective-sharpen-filter)` : ''} url(#channel-filter) url(#curves-filter) url(#advanced-effects-filter) ${colorMode === 'Grayscale' ? 'grayscale(100%)' : ''} ${colorMode === 'CMYK' ? 'sepia(100%) saturate(150%)' : ''}`.trim();

  // --- Layer Rendering ---
  const renderLayer = (layer: Layer): JSX.Element | null => {
    const isSelected = layer.id === selectedLayerId;
    const layerProps = {
      key: layer.id,
      layer,
      containerRef: workspaceRef,
      onUpdate: updateLayer,
      onCommit: (id: string) => {
        // Commit layer changes to history
        updateCurrentState({}); // Ensure currentEditState is up-to-date before recording
        commitLayerChange(id);
      },
      isSelected,
      activeTool,
      zoom: workspaceZoom,
    };

    if (!layer.visible) return null;

    if (layer.type === 'image' || layer.type === 'drawing') {
      // Background image is handled separately via img tag or canvas
      return null;
    }
    if (layer.type === 'text') {
      return <TextLayer {...layerProps} />;
    }
    if (layer.type === 'smart-object') {
      return <SmartObjectLayer {...layerProps} parentDimensions={dimensions} />;
    }
    if (layer.type === 'vector-shape') {
      return <VectorShapeLayer {...layerProps} />;
    }
    if (layer.type === 'gradient') {
      return <GradientLayer {...layerProps} imageNaturalDimensions={dimensions} />;
    }
    if (layer.type === 'adjustment') {
      return <AdjustmentLayer {...layerProps} />;
    }
    if (layer.type === 'group') {
      return <GroupLayer {...layerProps} parentDimensions={dimensions} renderChildren={renderLayer} globalSelectedLayerId={selectedLayerId} />;
    }
    return null;
  };

  // Find the background layer (image or drawing)
  const backgroundLayer = layers.find(l => l.id === 'background');
  const backgroundSrc = (backgroundLayer && isImageOrDrawingLayer(backgroundLayer)) ? backgroundLayer.dataUrl : image;

  return (
    <div className="flex-1 relative bg-muted/50 overflow-hidden">
      <Workspace
        workspaceRef={workspaceRef}
        handleWorkspaceMouseDown={handleWorkspaceMouseDown}
        handleWorkspaceMouseMove={handleWorkspaceMouseMove}
        handleWorkspaceMouseUp={handleWorkspaceMouseUp}
        handleWheel={handleWheel}
        setIsMouseOverImage={setIsMouseOverImage}
      >
        {/* SVG Filters (Hidden) */}
        <ChannelFilter channels={channels} />
        <CurvesFilter curves={curves} />
        <EffectsFilters effects={effects} />
        {selectiveBlurAmount > 0 && selectiveBlurMask && dimensions && (
          <SelectiveBlurFilter maskDataUrl={selectiveBlurMask} blurAmount={selectiveBlurAmount} imageNaturalDimensions={dimensions} />
        )}
        {selectiveSharpenAmount > 0 && selectiveSharpenMask && dimensions && (
          <SelectiveSharpenFilter maskDataUrl={selectiveSharpenMask} sharpenAmount={selectiveSharpenAmount} imageNaturalDimensions={dimensions} />
        )}
        {/* HslFilter and other filters are applied via CSS filter property */}

        {/* Main Image Container */}
        <div
          className="relative shadow-2xl border border-border bg-background"
          style={{
            width: width,
            height: height,
            transform: `scale(${workspaceZoom})`,
            transformOrigin: 'center center',
            overflow: 'hidden',
          }}
        >
          {/* Background Layer (Image or Drawing) */}
          {backgroundSrc && (
            <img
              ref={imgRef}
              src={backgroundSrc}
              alt="Base Image"
              crossOrigin="anonymous"
              className="absolute top-0 left-0 w-full h-full object-cover"
              style={{
                transform: transformStyle, // Apply rotation/flip
                filter: filterString,
                transformOrigin: 'center center',
                opacity: (backgroundLayer?.opacity ?? 100) / 100,
                mixBlendMode: backgroundLayer?.blendMode as any || 'normal',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Other Layers */}
          <div className="absolute inset-0 pointer-events-none">
            {layers.slice().reverse().map(renderLayer)}
          </div>

          {/* Selection Mask Overlay (Visual feedback for selection) */}
          {selectionMaskDataUrl && (
            <SelectionMaskOverlay
              maskDataUrl={selectionMaskDataUrl}
              imageNaturalDimensions={dimensions}
              overlayColor={activeTool === 'selectionBrush' ? 'rgba(0, 0, 255, 0.3)' : 'rgba(255, 0, 0, 0.5)'}
            />
          )}

          {/* Live Brush Canvas for Drawing/Erasing/Stamping/History Brush */}
          {(isBrushToolActive || isHistoryBrushActive) && dimensions && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: transformStyle, // Apply rotation/flip
                transformOrigin: 'center center',
              }}
            >
              <LiveBrushCanvas
                imageNaturalDimensions={dimensions}
                onStrokeEnd={(strokeDataUrl, layerId) => {
                  if (isHistoryBrushActive) {
                    handleHistoryBrushStrokeEnd(strokeDataUrl, layerId, 'Current State');
                  } else {
                    handleDrawingStrokeEnd(strokeDataUrl, layerId);
                  }
                }}
                onSelectionBrushStrokeEnd={handleSelectionBrushStrokeEnd}
                onSelectiveRetouchStrokeEnd={handleSelectiveRetouchStrokeEnd}
                activeTool={activeTool as 'brush' | 'eraser' | 'pencil' | 'selectionBrush' | 'blurBrush' | 'cloneStamp' | 'patternStamp' | 'historyBrush' | 'artHistoryBrush' | 'sharpenTool'}
                brushState={brushState}
                foregroundColor={foregroundColor}
                backgroundColor={backgroundColor}
                cloneSourcePoint={cloneSourcePoint}
                selectedLayerId={selectedLayerId}
                zoom={workspaceZoom}
                baseImageSrc={base64Image} // PASS BASE IMAGE
                historyImageSrc={historyImageSrc} // PASS HISTORY IMAGE SRC
              />
            </div>
          )}

          {/* Live Brush Canvas for Selection/Blur/Sharpen Masking */}
          {isSelectionBrushToolActive && dimensions && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: transformStyle, // Apply rotation/flip
                transformOrigin: 'center center',
              }}
            >
              <LiveBrushCanvas
                imageNaturalDimensions={dimensions}
                onStrokeEnd={handleDrawingStrokeEnd} // Placeholder, not used for selection/retouch tools
                onSelectionBrushStrokeEnd={handleSelectionBrushStrokeEnd}
                onSelectiveRetouchStrokeEnd={handleSelectiveRetouchStrokeEnd}
                activeTool={activeTool as 'brush' | 'eraser' | 'pencil' | 'selectionBrush' | 'blurBrush' | 'cloneStamp' | 'patternStamp' | 'historyBrush' | 'artHistoryBrush' | 'sharpenTool'}
                brushState={brushState}
                foregroundColor={foregroundColor}
                backgroundColor={backgroundColor}
                cloneSourcePoint={null}
                selectedLayerId={selectedLayerId}
                zoom={workspaceZoom}
                baseImageSrc={base64Image} // PASS BASE IMAGE
                historyImageSrc={historyImageSrc} // PASS HISTORY IMAGE SRC
              />
            </div>
          )}

          {/* Live Selection Canvas (Lasso/Polygonal Lasso) */}
          {isLassoActive && dimensions && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: transformStyle, // Apply rotation/flip
                transformOrigin: 'center center',
              }}
            >
              <SelectionCanvas
                imageRef={imgRef}
                onSelectionComplete={(path) => {
                  // Convert path to mask and set state (handled in useEditorLogic)
                  if (path.length > 1) {
                    polygonToMaskDataUrl(path, dimensions.width, dimensions.height)
                      .then(setSelectionMaskDataUrl)
                      .catch(() => showError("Failed to create lasso mask."));
                  }
                  setSelectionPath(path);
                }}
                selectionPath={selectionPath}
                activeTool={activeTool as 'lasso' | 'lassoPoly'}
              />
            </div>
          )}

          {/* Live Marquee Canvas */}
          {isMarqueeActive && marqueeStart && marqueeCurrent && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: transformStyle, // Apply rotation/flip
                transformOrigin: 'center center',
              }}
            >
              <MarqueeCanvas
                start={marqueeStart}
                current={marqueeCurrent}
                activeTool={activeTool as 'marqueeRect' | 'marqueeEllipse'}
              />
            </div>
          )}

          {/* Live Gradient Preview */}
          {isGradientToolActive && dimensions && workspaceRef.current && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: transformStyle, // Apply rotation/flip
                transformOrigin: 'center center',
              }}
            >
              <GradientPreviewCanvas
                start={gradientStart}
                current={gradientCurrent}
                gradientToolState={gradientToolState}
                containerRect={workspaceRef.current.getBoundingClientRect()}
                imageNaturalDimensions={dimensions}
              />
            </div>
          )}

          {/* Crop Tool Overlay */}
          {isCropActive && image && (
            <ReactCrop
              crop={crop || undefined}
              onChange={onCropChange}
              onComplete={onCropComplete}
              aspect={currentEditState.crop?.aspect || currentEditState.crop?.width / currentEditState.crop?.height || undefined}
              minWidth={10}
              minHeight={10}
              keepSelection
              className="absolute inset-0"
            >
              <img
                src={image}
                alt="Crop Target"
                style={{
                  width: '100%',
                  height: '100%',
                  opacity: 0, // Hide the image inside ReactCrop, we use the main image
                  pointerEvents: 'none',
                  // NOTE: ReactCrop handles its own internal transforms, so we don't apply transformStyle here.
                }}
              />
            </ReactCrop>
          )}
        </div>

        {/* Workspace Controls (Zoom/Fit) */}
        <WorkspaceControls
          zoom={workspaceZoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitScreen={handleFitScreen}
        />
      </Workspace>
    </div>
  );
};