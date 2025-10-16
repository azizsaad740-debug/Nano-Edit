import React, { useState, useRef, useCallback } from "react";
import { type Crop } from "react-image-crop";
import { useHotkeys } from "react-hotkeys-hook";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { downloadImage, copyImageToClipboard } from "@/utils/imageUtils";
import ExifReader from "exifreader";
import type { Preset } from "./usePresets";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import type { NewProjectSettings } from "@/components/editor/NewProjectDialog";
import { saveProjectToFile, loadProjectFromFile } from "@/utils/projectUtils";
import { readPsd } from "ag-psd";
import { rasterizeLayerToCanvas } from "@/utils/layerUtils";
import { useLayers } from "./useLayers";
import { maskToPolygon } from "@/utils/maskToPolygon";
import { polygonToMaskDataUrl } from "@/utils/maskUtils"; // Import the new utility
import type { TemplateData } from "../types/template"; // FIXED: Relative path
// ... (rest of the file remains the same)