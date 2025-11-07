"use client";

import * as React from "react";
import type { Layer, AdjustmentLayerData } from "@/types/editor";

interface AdjustmentLayerProps {
  layer: Layer;
}

/**
 * AdjustmentLayer is a structural component that holds adjustment data.
 * It renders nothing visually in the workspace, as its effects are applied
 * directly to the canvas context during the rasterization process.
 */
export const AdjustmentLayer = ({ layer }: AdjustmentLayerProps) => {
  const adjustmentLayer = layer as AdjustmentLayerData;
  
  if (!adjustmentLayer.visible || adjustmentLayer.type !== "adjustment") return null;
  
  // This component intentionally returns null as its effect is handled by the canvas renderer.
  return null;
};