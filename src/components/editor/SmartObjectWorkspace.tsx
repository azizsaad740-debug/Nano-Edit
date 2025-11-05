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
      onUpdate: onUpdate, // Use internal update handler
      onCommit: onCommit, // Pass the function directly (it now matches the required signature)
      isSelected,
      activeTool,
      zoom,
      setSelectedLayerId,
    };

    if (layer.type === 'text') {
      return <TextLayer {...layerProps} />;
    }
    if (layer.type === 'drawing') {
      return <DrawingLayer {...layerProps} />;
    }
    if (layer.type === 'image' && layer.id !== 'background') {
      return <ImageLayer {...layerProps} />;
    }
    if (layer.type === 'smart-object') {
      return <SmartObjectLayer {...layerProps} parentDimensions={currentParentDimensions} />;
    }
    if (layer.type === 'vector-shape') {
      return <VectorShapeLayer {...layerProps} />;
    }
    if (layer.type === 'gradient') {
      return <GradientLayer {...layerProps} imageNaturalDimensions={currentParentDimensions} />;
    }
    if (layer.type === 'group') {
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

  // Render layers in reverse order (bottom layer in array is rendered first/last in list)
  return (
    <div className="relative w-full h-full">
      {layers.slice().reverse().map((layer) => 
        renderLayer(layer, containerRef, parentDimensions)
      )}
    </div>
  );
};