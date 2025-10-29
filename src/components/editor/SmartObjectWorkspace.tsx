"use client";

import * as React from "react";
import type { Layer, ActiveTool } from "@/types/editor";
import { TextLayer } from "./TextLayer"; // FIX 65: Named import
import { SmartObjectLayer } from "./SmartObjectLayer"; // FIX 66: Named import
import VectorShapeLayer from "./VectorShapeLayer"; // Assuming default export
import GradientLayer from "./GradientLayer"; // Assuming default export
import GroupLayer from "./GroupLayer"; // Assuming default export

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
}

export const SmartObjectWorkspace: React.FC<SmartObjectWorkspaceProps> = (props) => { // FIX 67: Ensure return type is JSX.Element or null
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
  } = props;

  const renderChildren = (layersToRender: Layer[]) => {
    return layersToRender.map(layer => renderLayer(layer));
  };

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
    };

    if (!layer.visible) return null;

    if (layer.type === 'text') {
      return <TextLayer {...layerProps} />;
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
        renderChildren={renderLayer} // FIX 68: Pass the defined renderChildren function
        globalSelectedLayerId={globalSelectedLayerId}
      />;
    }
    return null;
  };

  return (
    <div className="w-full h-full relative">
      {renderChildren(layers)}
    </div>
  );
};