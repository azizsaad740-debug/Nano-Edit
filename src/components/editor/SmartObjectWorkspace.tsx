"use client";

import * as React from "react";
import type { Layer, ActiveTool, SmartObjectLayerData, GroupLayerData } from "@/types/editor";
import { TextLayer } from "./TextLayer";
import { SmartObjectLayer } from "./SmartObjectLayer";
import VectorShapeLayer from "./VectorShapeLayer";
import GradientLayer from "./GradientLayer";
import GroupLayer from "./GroupLayer";

interface SmartObjectWorkspaceProps {
  layers: Layer[];
  parentDimensions: { width: number; height: number };
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
  selectedLayerId: string | null;
  activeTool: ActiveTool | null;
  globalSelectedLayerId: string;
  zoom: number;
  // ADDED:
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
    setSelectedLayerId, // DESTRUCTURED
  } = props;

  const renderLayer = (layer: Layer): JSX.Element | null => {
    const isSelected = layer.id === selectedLayerId;

    const layerProps = {
      key: layer.id,
      layer,
      containerRef,
      onUpdate,
      onCommit,
      isSelected,
      activeTool,
      zoom,
      setSelectedLayerId, // PASSED
    };

    if (!layer.visible) return null;

    if (layer.type === 'text') {
      return <TextLayer {...layerProps} />;
    }
    if (layer.type === 'drawing') {
      // Drawing layer needs to be handled here too, but it doesn't use parentDimensions directly in its props
      // We need to ensure DrawingLayerProps includes setSelectedLayerId
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
        globalSelectedLayerId={globalSelectedLayerId}
      />;
    }
    return null;
  };

  return (
    <div className="w-full h-full relative">
      {layers.map(layer => renderLayer(layer))}
    </div>
  );
};