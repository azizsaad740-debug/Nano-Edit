"use client";

import * as React from "react";
import type { Layer } from "@/hooks/useEditorState";

interface DrawingLayerProps {
  layer: Layer;
}

export const DrawingLayer = ({ layer }: DrawingLayerProps) => {
  if (!layer.visible || layer.type !== "drawing" || !layer.dataUrl) {
    return null;
  }

  return (
    <img
      src={layer.dataUrl}
      alt={layer.name}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ opacity: (layer.opacity ?? 100) / 100 }}
    />
  );
};