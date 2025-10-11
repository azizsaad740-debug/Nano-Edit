import EditorControls from "@/components/layout/EditorControls";
import React from "react";
import type { Preset } from "@/hooks/usePresets";
import type { Layer, EditState, Point, ActiveTool, BrushState } from "@/hooks/useEditorState";
import { LayersPanel } from "@/components/editor/LayersPanel";
import { PropertiesPanel } from "@/components/layout/PropertiesPanel"; // Import the new PropertiesPanel
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

interface SidebarProps {
  hasImage: boolean;
  adjustments: EditState['adjustments'];
  onAdjustmentChange: (adjustment: string, value: number) => void;
  onAdjustmentCommit: (adjustment: string, value: number) => void;
  effects: EditState['effects'];
  onEffectChange: (effect: string, value: number) => void;
  onEffectCommit: (effect: string, value: number) => void;
  grading: EditState['grading'];
  onGradingChange: (gradingType: string, value: number) => void;
  onGradingCommit: (gradingType: string, value: number) => void;
  channels: EditState['channels'];
  onChannelChange: (channel: 'r' | 'g' | 'b', value: boolean) => void;
  curves: EditState['curves'];
  onCurvesChange: (channel: keyof EditState['curves'], points: Point[]) => void;
  onCurvesCommit: (channel: keyof EditState['curves'], points: Point[]) => void;
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
  addTextLayer: (coords?: { x: number; y: number }) => void;
  addDrawingLayer: () => string;
  addShapeLayer: (coords: { x: number; y: number }, shapeType?: Layer['shapeType'], initialWidth?: number, initialHeight?: number) => void;
  toggleLayerVisibility: (id: string) => void;
  renameLayer: (id: string, newName: string) => void;
  deleteLayer: (id: string) => void;
  duplicateLayer: () => void;
  mergeLayerDown: () => void;
  rasterizeLayer: () => void;
  reorderLayers: (oldIndex: number, newIndex: number) => void;
  // Selection props
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  // Layer editing
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string) => void;
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void;
  // Frame props
  frame: EditState['frame'];
  onFramePresetChange: (type: string, name: string, options?: { width: number; color: string }) => void;
  onFramePropertyChange: (key: 'width' | 'color', value: any) => void;
  onFramePropertyCommit: () => void;
  // Smart object functions
  onCreateSmartObject: (layerIds: string[]) => void;
  onOpenSmartObject: (id: string) => void;
  // Shape tool
  selectedShapeType: Layer['shapeType'] | null;
  // Tool state
  activeTool: ActiveTool | null;
  // Brush state
  brushState: BrushState;
  setBrushState: (updates: Partial<BrushState>) => void;
}

const Sidebar = (props: SidebarProps) => {
  return (
    <aside className="h-full border-r bg-muted/40">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={40} minSize={20}>
          <div className="p-4 h-full overflow-y-auto">
            <EditorControls {...props} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={15}> {/* New panel for Properties */}
          <div className="p-4 h-full overflow-y-auto flex flex-col">
            {props.hasImage && (
              <PropertiesPanel
                selectedLayer={props.layers.find(l => l.id === props.selectedLayerId)}
                activeTool={props.activeTool}
                brushState={props.brushState}
                setBrushState={props.setBrushState}
                onLayerUpdate={props.onLayerUpdate}
                onLayerCommit={props.onLayerCommit}
                onLayerOpacityChange={props.onLayerOpacityChange}
                onLayerOpacityCommit={props.onLayerOpacityCommit}
                onLayerPropertyCommit={props.onLayerPropertyCommit}
              />
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="p-4 h-full overflow-y-auto flex flex-col">
            {props.hasImage && (
              <LayersPanel
                layers={props.layers}
                onToggleVisibility={props.toggleLayerVisibility}
                onRename={props.renameLayer}
                onDelete={props.deleteLayer}
                onAddTextLayer={props.addTextLayer}
                onAddDrawingLayer={props.addDrawingLayer}
                onAddShapeLayer={props.addShapeLayer}
                onDuplicateLayer={props.duplicateLayer}
                onMergeLayerDown={props.mergeLayerDown}
                onRasterizeLayer={props.rasterizeLayer}
                onReorder={props.reorderLayers}
                selectedLayerId={props.selectedLayerId}
                onSelectLayer={props.onSelectLayer}
                channels={props.channels}
                onChannelChange={props.onChannelChange}
                onLayerUpdate={props.onLayerUpdate}
                onLayerCommit={props.onLayerCommit}
                onLayerOpacityChange={props.onLayerOpacityChange}
                onLayerOpacityCommit={props.onLayerOpacityCommit}
                onLayerPropertyCommit={props.onLayerPropertyCommit}
                onCreateSmartObject={props.onCreateSmartObject}
                onOpenSmartObject={props.onOpenSmartObject}
                selectedShapeType={props.selectedShapeType}
                activeTool={props.activeTool}
                brushState={props.brushState}
                setBrushState={props.setBrushState}
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </aside>
  );
};

export default Sidebar;