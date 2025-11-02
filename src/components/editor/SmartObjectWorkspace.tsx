"use client";

import * as React from "react";
import type { Layer, ActiveTool, SmartObjectLayerData, GroupLayerData } from "@/types/editor";
import { TextLayer } from "./TextLayer";
import { DrawingLayer } from "./DrawingLayer";
import { SmartObjectLayer } from "./SmartObjectLayer";
import VectorShapeLayer from "./VectorShapeLayer";
import { GradientLayer } from "./GradientLayer";
import GroupLayer from "./GroupLayer";

interface SmartObjectWorkspaceProps {
  layers: Layer[];
  parentDimensions: { width: number; height: number } | null;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCommit: (id: string) => void;
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

  // Render layers in reverse order (bottom layer in array is rendered first/last in list)
  return (
    <div className="relative w-full h-full">
      {layers.slice().reverse().map((layer) => {
        const isSelected = selectedLayerId === layer.id;
        const layerProps = {
          key: layer.id,
          layer,
          containerRef,
          onUpdate,
          onCommit,
          isSelected,
          activeTool,
          zoom,
          setSelectedLayerId,
        };

        if (!layer.visible) return null;

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
          return <GroupLayer {...layerProps} parentDimensions={parentDimensions} renderChildren={() => null} globalSelectedLayerId={globalSelectedLayerId} />;
        }
        return null;
      })}
    </div>
  );
};