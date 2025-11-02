import React, { useRef, useMemo } from 'react';
import { useLayerTransform } from "@/hooks/useLayerTransform";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils"; // Fix 166
import type { Layer, ActiveTool, GradientLayerData } from "@/types/editor";
// ... (rest of file)