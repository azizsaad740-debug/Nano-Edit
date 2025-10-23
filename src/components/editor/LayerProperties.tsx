"use client";

import * as React from "react";
import type { Layer } from "@/hooks/useEditorState";

interface LayerPropertiesProps {
  selectedLayer: Layer;
}

export const LayerProperties = ({
  selectedLayer,
}: LayerPropertiesProps) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        General properties (Opacity and Blend Mode) are controlled in the Layers panel.
      </p>
    </div>
  );
};