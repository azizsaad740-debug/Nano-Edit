import * as React from "react";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { Button } from "@/components/ui/button";
import { X, Save, Layers, Settings, Undo, Redo } from "lucide-react";
import { EditorWorkspace } from "./EditorWorkspace";
import { LayerPropertiesContent } from "./LayerPropertiesContent";
import { LayersPanel } from "./LayersPanel";
import { ToolOptionsContent } from "./ToolOptionsContent";
import { ToolOptionsBar } from "../layout/ToolOptionsBar";
import { EditorHeader } from "../layout/EditorHeader";
import { Sidebar } from "../layout/Sidebar";
import { BottomPanel } from "../layout/BottomPanel";
import { AuxiliaryPanel } from "../layout/AuxiliaryPanel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import type { Layer, Dimensions, EditState, HistoryItem, Point, GradientToolState } from "@/types/editor";
import type { GradientPreset } from "@/hooks/useGradientPresets";
import { rasterizeLayersToDataUrl } from "@/utils/layerUtils"; // Fix TS2305

// ... rest of the file