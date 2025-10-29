import * as React from "react";
import { Workspace } from "@/components/editor/Workspace";
import { WorkspaceControls } from "@/components/editor/WorkspaceControls";
import { LiveBrushCanvas } from "@/components/editor/LiveBrushCanvas";
import { SelectionCanvas } from "@/components/editor/SelectionCanvas";
import { SelectionMaskOverlay } from "@/components/editor/SelectionMaskOverlay";
import { GradientPreviewCanvas } from "@/components/editor/GradientPreviewCanvas";
import { ChannelFilter } from "@/components/editor/ChannelFilter";
import { CurvesFilter } from "@/components/editor/CurvesFilter";
import { EffectsFilters } from "@/components/editor/EffectsFilters";
import { HslFilter } from "@/components/editor/HslFilter";
import { SelectiveBlurFilter } from "@/components/editor/SelectiveBlurFilter";
import { TextLayer } from "@/components/editor/TextLayer";
import { DrawingLayer } from "@/components/editor/DrawingLayer";
import { SmartObjectLayer } from "@/components/editor/SmartObjectLayer";
import VectorShapeLayer from "@/components/editor/VectorShapeLayer";
import GradientLayer from "@/components/editor/GradientLayer";
import GroupLayer from "@/components/editor/GroupLayer";
import { AdjustmentLayer } from "@/components/editor/AdjustmentLayer";
import { getFilterString } from "@/utils/filterUtils";
import { cn } from "@/lib/utils";
import type { Layer, ActiveTool, Dimensions, EditState, Point } from "@/types/editor";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { polygonToMaskDataUrl } from "@/utils/maskUtils";
import { showError } from "@/utils/toast";

interface EditorWorkspaceProps {
  logic: ReturnType<typeof useEditorLogic>;
  workspaceRef: React.RefObject<HTMLDivElement>;
  imgRef: React.RefObject<HTMLImageElement>;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({ logic, workspaceRef, imgRef }) => {
  const {
    image, // Added image
    hasImage, dimensions, fileInfo, currentEditState, layers, selectedLayerId, activeTool,
    brushState, gradientToolState, foregroundColor, backgroundColor, selectionPath,
    selectionMaskDataUrl, setSelectionPath, setSelectionMaskDataUrl, clearSelectionState,
    updateCurrentState, handleDrawingStrokeEnd, handleAddDrawingLayer,
    workspaceZoom, handleWheel, handleFitScreen, handleZoomIn, handleZoomOut,
    isMouseOverImage, setIsMouseOverImage, gradientStart, gradientCurrent,
    handleWorkspaceMouseDown, handleWorkspaceMouseMove, handleWorkspaceMouseUp,
    transforms, crop, channels, curves, isPreviewingOriginal,
    updateLayer, commitLayerChange,
  } = logic;

  // --- Render Layer Logic ---
  const renderLayer = (layer: Layer): JSX.Element | null => {
    const isSelected = layer.id === selectedLayerId;
    const parentDimensions = dimensions;

    const layerProps = {
      key: layer.id,
      layer,
      containerRef: workspaceRef,
      onUpdate: updateLayer,
      onCommit: commitLayerChange,
      isSelected,
      activeTool,
      zoom: workspaceZoom,
    };

    if (!layer.visible) return null;

    if (layer.type === 'image') {
      return null;
    }
    if (layer.type === 'text') {
      return <TextLayer {...layerProps} />;
    }
    if (layer.type === 'drawing') {
      return <DrawingLayer {...layerProps} />;
    }
    if (layer.type === 'smart-object') {
      return <SmartObjectLayer {...layerProps} parentDimensions={parentDimensions} />;
    }
    if (layer.type === 'vector-shape') {
      return <VectorShapeLayer {...layerProps} />;
    }
    if (layer.type === 'gradient') {
      return <GradientLayer {...layerProps} imageNaturalDimensions={parentDimensions} />;
    }
    if (layer.type === 'group') {
      return <GroupLayer
        {...layerProps}
        parentDimensions={parentDimensions}
        renderChildren={renderLayer}
        globalSelectedLayerId={selectedLayerId}
      />;
    }
    if (layer.type === 'adjustment') {
      return <AdjustmentLayer {...layerProps} />;
    }
    return null;
  };

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
        {hasImage && dimensions ? (
          <div
            className="absolute top-1/2 left-1/2 transform origin-top-left transition-transform duration-100 ease-out shadow-2xl border border-border bg-background"
            style={{
              width: dimensions.width,
              height: dimensions.height,
              transform: `translate(-50%, -50%) scale(${workspaceZoom})`,
              cursor: isMouseOverImage ? 'crosshair' : 'default',
            }}
          >
            {/* SVG Filters for Global Adjustments */}
            <ChannelFilter channels={channels} />
            <CurvesFilter curves={curves} />
            <EffectsFilters effects={currentEditState.effects} />
            <HslFilter hslAdjustments={currentEditState.hslAdjustments} />
            {currentEditState.selectiveBlurMask && (
              <SelectiveBlurFilter
                maskDataUrl={currentEditState.selectiveBlurMask}
                blurAmount={currentEditState.selectiveBlurAmount}
                imageNaturalDimensions={dimensions}
              />
            )}

            {/* Main Image Container */}
            <div
              className="relative w-full h-full overflow-hidden"
              style={{
                filter: isPreviewingOriginal ? 'none' : `${currentEditState.selectedFilter} ${currentEditState.colorMode === 'Grayscale' ? 'grayscale(1)' : ''} ${currentEditState.colorMode === 'CMYK' ? 'invert(1) hue-rotate(180deg) sepia(0.1) saturate(1.1)' : ''} url(#curves-filter) url(#advanced-effects-filter) url(#hsl-filter) url(#selective-blur-filter) ${currentEditState.effects.vignette > 0 ? '' : ''}`,
                transform: `rotateZ(${transforms.rotation}deg) scaleX(${transforms.scaleX}) scaleY(${transforms.scaleY})`,
                transformOrigin: 'center center',
              }}
            >
              {/* Background Image Layer */}
              {layers.find(l => l.id === 'background')?.visible && (
                <img
                  ref={imgRef}
                  src={image!}
                  alt={fileInfo?.name || "Image"}
                  className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
                  style={{
                    clipPath: crop ? `polygon(${crop.x}% ${crop.y}%, ${crop.x + crop.width}% ${crop.y}%, ${crop.x + crop.width}% ${crop.y + crop.height}%, ${crop.x}% ${crop.y + crop.height}%)` : 'none',
                    transform: `scaleX(${transforms.scaleX}) scaleY(${transforms.scaleY})`,
                    transformOrigin: 'center center',
                    filter: layers.some(l => l.type === 'adjustment') ? 'none' : getFilterString(currentEditState),
                    mixBlendMode: layers.find(l => l.id === 'background')?.blendMode as any || 'normal',
                    opacity: (layers.find(l => l.id === 'background')?.opacity ?? 100) / 100,
                  }}
                />
              )}

              {/* Render all other layers (excluding background) */}
              {layers.slice(1).map(renderLayer)}

              {/* Live Brush/Eraser/Selection Canvas */}
              {(activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'selectionBrush' || activeTool === 'blurBrush') && (
                <LiveBrushCanvas
                  brushState={brushState}
                  imageRef={imgRef}
                  onDrawEnd={handleDrawingStrokeEnd}
                  activeTool={activeTool}
                  selectedLayerId={selectedLayerId}
                  onAddDrawingLayer={handleAddDrawingLayer}
                  layers={layers}
                  isSelectionBrush={activeTool === 'selectionBrush'}
                  onSelectionBrushStrokeEnd={async (dataUrl, operation) => {
                    if (operation === 'add') {
                      setSelectionMaskDataUrl(dataUrl);
                    } else {
                      showError("Subtracting from selection mask is a stub.");
                    }
                  }}
                  onSelectiveBlurStrokeEnd={async (dataUrl, operation) => {
                    if (operation === 'add') {
                      updateCurrentState({ selectiveBlurMask: dataUrl });
                    } else {
                      showError("Removing blur area is a stub.");
                    }
                  }}
                  foregroundColor={foregroundColor}
                  backgroundColor={backgroundColor}
                />
              )}

              {/* Live Lasso Selection Canvas */}
              {activeTool === 'lasso' && (
                <SelectionCanvas
                  imageRef={imgRef}
                  onSelectionComplete={async (path) => {
                    setSelectionPath(path);
                    if (path.length > 1 && dimensions) {
                      const maskUrl = await polygonToMaskDataUrl(path, dimensions.width, dimensions.height);
                      setSelectionMaskDataUrl(maskUrl);
                    } else {
                      clearSelectionState();
                    }
                  }}
                  selectionPath={selectionPath}
                />
              )}

              {/* Live Gradient Preview Canvas */}
              {activeTool === 'gradient' && gradientStart && gradientCurrent && (
                <GradientPreviewCanvas
                  start={gradientStart}
                  current={gradientCurrent}
                  gradientToolState={gradientToolState}
                  containerRect={workspaceRef.current!.getBoundingClientRect()}
                  imageNaturalDimensions={dimensions}
                />
              )}

              {/* Selection Mask Overlay (for visual feedback) */}
              {selectionMaskDataUrl && (activeTool === 'selectionBrush' || activeTool === 'lasso') && (
                <SelectionMaskOverlay
                  maskDataUrl={selectionMaskDataUrl}
                  imageNaturalDimensions={dimensions}
                  overlayColor={foregroundColor}
                />
              )}
            </div>

            {/* Workspace Controls (Zoom/Fit) */}
            <WorkspaceControls
              zoom={workspaceZoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitScreen={handleFitScreen}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full text-muted-foreground">
            <p>Click "File" &gt; "Open Image/Project" to start.</p>
          </div>
        )}
      </Workspace>
    </div>
  );
};