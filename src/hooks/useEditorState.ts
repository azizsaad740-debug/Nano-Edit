import { useState, useRef, useCallback } from "react";
import { type Crop } from "react-image-crop";
import { useHotkeys } from "react-hotkeys-hook";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { downloadImage, copyImageToClipboard } from "@/utils/imageUtils";
import ExifReader from "exifreader";
import type { Preset } from "./usePresets";
import { v4 as uuidv4 } from "uuid";

export interface EditState {
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  effects: {
    blur: number;
    hueShift: number;
    vignette: number;
  };
  grading: {
    grayscale: number;
    sepia: number;
    invert: number;
  };
  selectedFilter: string;
  transforms: {
    rotation: number;
    scaleX: number;
    scaleY: number;
  };
  crop: Crop | undefined;
}

/** Layer definition – only text layers are editable for now */
export interface Layer {
  id: string;
  type: "image" | "text";
  name: string;
  visible: boolean;
  content?: string; // text content for text layers
}

export interface HistoryItem {
  name: string;
  state: EditState;
  layers: Layer[];
}

/* ... rest of the file remains unchanged ... */