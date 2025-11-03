import * as React from "react";
import { useLayerTransform } from "@/hooks/useLayerTransform";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils"; // Fix TS2305
import type { Layer, ActiveTool, GradientLayerData, Point } from "@/types/editor";
import { isGradientLayer } from "@/types/editor";
import { useEditorLogic } from "@/hooks/useEditorLogic";

// ... rest of the file