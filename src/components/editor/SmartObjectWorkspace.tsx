"use client";

import * as React from "react";
import type { Layer, ActiveTool, SmartObjectLayerData, GroupLayerData, Dimensions } from "@/types/editor";
import { TextLayer } from "./TextLayer";
import { DrawingLayer } from "./DrawingLayer";
import { SmartObjectLayer } from "./SmartObjectLayer";
import VectorShapeLayer from "./VectorShapeLayer";
import { GradientLayer } from "./GradientLayer";
import GroupLayer from "./GroupLayer";
import { ImageLayer } from "./ImageLayer";
import { isTextLayer, isDrawingLayer, isImageLayer, isSmartObjectLayer, isVectorShapeLayer, isGradientLayer, isGroupLayer } from "@/types/editor"; // Added imports

interface SmartObjectWorkspaceProps {
  layers: Layer[];
  parentDimensions: { width: number; height: number } | null;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string, historyName: string) => void;
  selectedLayerId: string | null;
  activeTool: ActiveTool | null;
  globalSelectedLayerId: string | null;
  zoom: number;
  setSelectedLayerId: (id: string | null) => void;
}

export const SmartObjectWorkspace: React.FC<SmartObjectWorkspaceProps> = (props) => {
  const {
    layers,
    parentDimensions,
    containerRef,
    onUpdate,
    onCommit,
    selectedLayerId,
    activeTool,
    globalSelectedLayerId,
    zoom,
    setSelectedLayerId,
  } = props;

  if (!parentDimensions) return null;

  // --- Recursive Layer Renderer ---
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
      onUpdate: onUpdate, // (id, updates) => void
      onCommit: onCommit, // (id, historyName) => void
      isSelected,
      activeTool,
      zoom,
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
      return <SmartObjectLayer {...layerProps} parentDimensions={currentParentDimensions} />;
    }
    if (isVectorShapeLayer(layer)) {
      return <VectorShapeLayer {...layerProps} />;
    }
    if (isGradientLayer(layer)) {
      return <GradientLayer {...layerProps} imageNaturalDimensions={currentParentDimensions} />;
    }
    if (isGroupLayer(layer)) {
      const groupLayer = layer as GroupLayerData;
      return (
        <GroupLayer
          {...layerProps}
          parentDimensions={currentParentDimensions}
          globalSelectedLayerId={globalSelectedLayerId}
          renderChildren={(child) => renderLayer(child, layerProps.containerRef, currentParentDimensions)}
        />
      );
    }
    return null;
  };
  // --- End Recursive Layer Renderer ---
  
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Deselect if the click target is the workspace background itself
    if (e.target === e.currentTarget) {
      setSelectedLayerId(null);
    }
  };

  // Render layers in reverse order (bottom layer in array is rendered first/last in list)
  return (
    <div className="relative w-full h-full" onMouseDown={handleBackgroundClick}>
      {layers.slice().reverse().map((layer) => 
        renderLayer(layer, containerRef, parentDimensions)
      )}
    </div>
  );
};