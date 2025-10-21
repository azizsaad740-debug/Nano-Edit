"use client";

import * as React from "react";
import type { Layer, ActiveTool } from "@/hooks/useEditorState"; // Import ActiveTool
import { TextLayer } from "./TextLayer";
import { DrawingLayer } from "./DrawingLayer";
import { cn } from "@/lib/utils";
import { SmartObjectLayer } from "./SmartObjectLayer";
import VectorShapeLayer from "./VectorShapeLayer";
import GroupLayer from "./GroupLayer"; // Import GroupLayer

interface SmartObjectWorkspaceProps {
  layers: Layer[];
  width: number;
  height: number;
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string) => void;
  mainImage: string | null;
  activeTool: ActiveTool | null; // Added activeTool prop
}

export const SmartObjectWorkspace = ({
  layers,
  width,
  height,
  selectedLayerId,
  onSelectLayer,
  onLayerUpdate,
  onLayerCommit,
  mainImage,
  activeTool, // Destructure activeTool
}: SmartObjectWorkspaceProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Deselect if clicking on the workspace background
    if (e.target === containerRef.current) {
      onSelectLayer(null);
    }
  };

  const backgroundStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    aspectRatio: width / height,
    maxWidth: '100%',
    maxHeight: '100%',
  };

  if (mainImage) {
    backgroundStyle.backgroundImage = `url(${mainImage})`;
    backgroundStyle.backgroundSize = 'contain';
    backgroundStyle.backgroundRepeat = 'no-repeat';
    backgroundStyle.backgroundPosition = 'center';
  } else {
    // Checkerboard effect for transparency if no main image
    backgroundStyle.backgroundImage = 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)';
    backgroundStyle.backgroundSize = '20px 20px';
    backgroundStyle.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
  }

  const parentDimensions = { width, height }; // Dimensions of this smart object's canvas

  const renderWorkspaceLayers = (layersToRender: Layer[]) => {
    return layersToRender.map((layer) => {
      if (!layer.visible) return null;
      
      const layerProps = {
        key: layer.id,
        layer: layer,
        containerRef: containerRef,
        onUpdate: onLayerUpdate,
        onCommit: onLayerCommit,
        isSelected: layer.id === selectedLayerId,
        activeTool: activeTool,
      };

      if (layer.type === 'text') {
        return <TextLayer {...layerProps} />;
      }
      if (layer.type === 'drawing' && layer.dataUrl) {
        return <DrawingLayer key={layer.id} layer={layer} />;
      }
      if (layer.type === 'smart-object') {
        return <SmartObjectLayer {...layerProps} parentDimensions={parentDimensions} />;
      }
      if (layer.type === 'vector-shape') {
        return <VectorShapeLayer {...layerProps} />;
      }
      if (layer.type === 'group') {
        return <GroupLayer {...layerProps} parentDimensions={parentDimensions} renderChildren={renderWorkspaceLayers} />;
      }
      return null;
    });
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden border rounded-md bg-muted flex-1",
      )}
      style={backgroundStyle}
      onClick={handleClick}
    >
      <div
        className="relative"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transformOrigin: 'top left',
          transform: `scale(var(--scale-factor, 1))`, // Will be scaled by parent to fit
        }}
      >
        {renderWorkspaceLayers(layers)}
      </div>
    </div>
  );
};