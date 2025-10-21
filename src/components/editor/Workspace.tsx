import { useRef, useState, useCallback, MouseEvent, DragEvent, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import ReactCrop, { Crop } from "react-image-crop";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/utils/toast";
import { formatBytes } from "@/lib/utils";
import type {
  EditState,
  Layer,
  ActiveTool,
  BrushState,
  GradientToolState,
  Point,
} from "@/hooks/useEditorState";
import { TextLayer } from "./TextLayer";
import VectorShapeLayer from "./VectorShapeLayer";
import { GradientLayer } from "./GradientLayer";
import { SmartObjectLayer } from "./SmartObjectLayer";
import GroupLayer from "./GroupLayer";
import { LiveBrushCanvas } from "./LiveBrushCanvas";
import { SelectionCanvas } from "./SelectionCanvas";
import { SelectionMaskOverlay } from "./SelectionMaskOverlay";
import { GradientPreviewCanvas } from "./GradientPreviewCanvas";
import { SelectiveBlurFilter } from "./SelectiveBlurFilter";
import { WorkspaceControls } from "./WorkspaceControls";
import { CurvesFilter } from "./CurvesFilter";
import { ChannelFilter } from "./ChannelFilter";
import { EffectsFilters } from "./EffectsFilters";
import SampleImages from "./SampleImages";
import UrlUploader from "./UrlUploader";
import "react-image-crop/dist/ReactCrop.css";