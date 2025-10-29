import * as React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Layer, BlendMode } from "@/types/editor"; // ADDED BlendMode

interface LayerGeneralPropertiesProps {
// ...
  const handleBlendModeChange = (blendMode: string) => {
    handleUpdate({ blendMode: blendMode as BlendMode }); // FIX 14
    handleCommit(`Change Blend Mode to ${blendMode}`);
  };
// ...