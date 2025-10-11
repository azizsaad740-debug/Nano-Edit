"use client";

import * as React from "react";
import type { Layer } from "@/hooks/useEditorState";
import { TextLayer } from "./TextLayer";
import { DrawingLayer } from "./DrawingLayer";
import { cn } from "@/lib/utils";

interface SmartObjectWorkspaceProps {
  layers: Layer[];
  width: number;
  height: number;
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string) => void;
}

export const SmartObjectWorkspace = ({
  layers,
  width,
  height,
  selectedLayerId,
  onSelectLayer,
  onLayerUpdate,
  onLayerCommit,
}: SmartObjectWorkspaceProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Deselect if clicking on the workspace background
    if (e.target === containerRef.current) {
      onSelectLayer(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden border rounded-md bg-muted flex-1",
        "bg-gradient-to-br from-muted/50 to-muted/80" // Checkerboard effect for transparency
      )}
      style={{
        width: '100%',
        height: '100%',
        aspectRatio: width / height,
        maxWidth: '100%',
        maxHeight: '100%',
        backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
      }}
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
        {layers.map((layer) => {
          if (!layer.visible) return null;
          if (layer.type === 'text') {
            return (
              <TextLayer
                key={layer.id}
                layer={layer}
                containerRef={containerRef} // Pass the outer container ref
                onUpdate={onLayerUpdate}
                onCommit={onLayerCommit}
                isSelected={layer.id === selectedLayerId}
              />
            );
          }
          if (layer.type === 'drawing' && layer.dataUrl) {
            return (
              <DrawingLayer
                key={layer.id}
                layer={layer}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};