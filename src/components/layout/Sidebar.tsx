import EditorControls from "@/components/layout/EditorControls";
import React from "react";
import type { Preset } from "@/hooks/usePresets";
import type { Layer } from "@/hooks/useEditorState";
import { LayersPanel } from "@/components/editor/LayersPanel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

interface SidebarProps {
  hasImage: boolean;
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  onAdjustmentChange: (adjustment: string, value: number) => void;
  onAdjustmentCommit: (adjustment: string, value: number) => void;
  effects: {
    blur: number;
    hueShift: number;
    vignette: number;
    noise: number;
  };
  onEffectChange: (effect: string, value: number) => void;
  onEffectCommit: (effect: string, value: number) => void;
  grading: {
    grayscale: number;
    sepia: number;
    invert: number;
  };
  onGradingChange: (gradingType: string, value: number) => void;
  onGradingCommit: (gradingType: string, value: number) => void;
  onFilterChange: (filterValue: string, filterName: string) => void;
  selectedFilter: string;
  onTransformChange: (transformType: string) => void;
  onAspectChange: (aspect: number | undefined) => void;
  aspect: number | undefined;
  history: { name: string }[];
  currentHistoryIndex: number;
  onHistoryJump: (index: number) => void;
  dimensions: { width: number; height: number } | null;
  fileInfo: { name: string; size: number } | null;
  imgRef: React.RefObject<HTMLImageElement>;
  exifData: any;
  presets: Preset[];
  onApplyPreset: (preset: Preset) => void;
  onSavePreset: () => void;
  onDeletePreset: (name: string) => void;
  // Layer props
  layers: Layer[];
  addTextLayer: () => void;
  toggleLayerVisibility: (id: string) => void;
  renameLayer: (id: string, newName: string) => void;
  deleteLayer: (id: string) => void;
  reorderLayers: (oldIndex: number, newIndex: number) => void;
  // Selection props
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  // Layer editing
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string) => void;
  // Frame props
  frame: { type: 'none' | 'solid'; width: number; color: string; };
  onFramePresetChange: (type: string, name: string, options?: { width: number; color: string }) => void;
  onFramePropertyChange: (key: 'width' | 'color', value: any) => void;
  onFramePropertyCommit: () => void;
}

const Sidebar = (props: SidebarProps) => {
  return (
    <aside className="h-full border-r bg-muted/40">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={60} minSize={30}>
          <div className="p-4 h-full overflow-y-auto">
            <EditorControls {...props} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={20}>
          <div className="p-4 h-full overflow-y-auto">
            {props.hasImage && (
              <LayersPanel
                layers={props.layers}
                onToggleVisibility={props.toggleLayerVisibility}
                onRename={props.renameLayer}
                onDelete={props.deleteLayer}
                onAddTextLayer={props.addTextLayer}
                onReorder={props.reorderLayers}
                selectedLayerId={props.selectedLayerId}
                onSelectLayer={props.onSelectLayer}
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </aside>
  );
};

export default Sidebar;