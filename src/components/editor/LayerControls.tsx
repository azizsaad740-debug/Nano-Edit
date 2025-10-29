import * as React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Lock, Trash2, Copy, Layers, Group, Image, Mask, CornerDownRight } from "lucide-react";
import type { Layer, BlendMode } from "@/types/editor"; // ADDED BlendMode

interface LayerControlsProps {
// ...
  const handleBlendModeChange = (blendMode: string) => {
    if (selectedLayer) {
      onLayerPropertyCommit({ blendMode: blendMode as BlendMode }, `Set Blend Mode to ${blendMode}`); // FIX 12
    }
  };
// ...