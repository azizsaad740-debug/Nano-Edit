import EditorControls from "@/components/layout/EditorControls";
import React from "react";
import type { Preset } from "@/hooks/usePresets";
import type { Layer, EditState, Point, ActiveTool, BrushState, GradientToolState } from "@/hooks/useEditorState";
import { LayersPanel } from "@/components/editor/LayersPanel";
import { PropertiesPanel } from "@/components/layout/PropertiesPanel"; // Import the new PropertiesPanel
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { GradientPreset } from "@/hooks/useGradientPresets";

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
  hslAdjustments: EditState['hslAdjustments']; // NEW prop
  onHslAdjustmentChange: (adjustment: keyof EditState['hslAdjustments'], value: number) => void; // NEW prop
  onHslAdjustmentCommit: (adjustment: keyof EditState['hslAdjustments'], value: number) => void; // NEW prop
  channels: EditState['channels'];
  onChannelChange: (channel: 'r' | 'g' | 'b', value: boolean) => void;
  curves: EditState['curves'];
  onCurvesChange: (channel: keyof EditState['curves'], points: Point[]) => void;
  onCurvesCommit: (channel: keyof EditState['curves'], points: Point[]) => void;
  onFilterChange: (filterValue: string, filterName: string) => void;
  selectedFilter: string;
  onTransformChange: (transformType: string) => void;
  rotation: number; // Added rotation prop
  onRotationChange: (value: number) => void; // Added onRotationChange prop
  onRotationCommit: (value: number) => void; // Added onRotationCommit prop
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
  addGradientLayer: () => void; // Added addGradientLayer
  onDuplicateLayer: () => void; // Renamed from duplicateLayer
  onMergeLayerDown: () => void; // Renamed from mergeLayerDown
  onRasterizeLayer: () => void; // Renamed from rasterizeLayer
  onReorder: (activeId: string, overId: string, isDroppingIntoGroup?: boolean) => void; // Added this line
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
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void; // Updated type
  // Gradient tool state
  gradientToolState: GradientToolState;
  setGradientToolState: React.Dispatch<React.SetStateAction<GradientToolState>>;
  // Gradient Presets
  gradientPresets: GradientPreset[];
  onSaveGradientPreset: (name: string, state: GradientToolState) => void;
  onDeleteGradientPreset: (name: string) => void;
  // Grouping
  groupLayers: (layerIds: string[]) => void;
  toggleGroupExpanded: (id: string) => void;
  // Foreground/Background Colors
  foregroundColor: string; // New prop
  setForegroundColor: (color: string) => void; // New prop
  // Selective Blur Props
  selectiveBlurStrength: number; // NEW prop
  onSelectiveBlurStrengthChange: (value: number) => void; // NEW prop
  onSelectiveBlurStrengthCommit: (value: number) => void; // NEW prop
  // Layer Masking
  hasActiveSelection: boolean; // NEW prop
  onApplySelectionAsMask: () => void; // NEW prop
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
                gradientToolState={props.gradientToolState}
                setGradientToolState={props.setGradientToolState}
                onLayerUpdate={props.onLayerUpdate}
                onLayerCommit={props.onLayerCommit}
                onLayerOpacityChange={props.onLayerOpacityChange}
                onLayerOpacityCommit={props.onLayerOpacityCommit}
                onLayerPropertyCommit={props.onLayerPropertyCommit}
                gradientPresets={props.gradientPresets}
                onSaveGradientPreset={props.onSaveGradientPreset}
                onDeleteGradientPreset={props.onDeleteGradientPreset}
                foregroundColor={props.foregroundColor} // Pass foregroundColor
                setForegroundColor={props.setForegroundColor} // Pass setForegroundColor
                selectiveBlurStrength={props.selectiveBlurStrength} // NEW prop
                onSelectiveBlurStrengthChange={props.onSelectiveBlurStrengthChange} // NEW prop
                onSelectiveBlurStrengthCommit={props.onSelectiveBlurStrengthCommit} // NEW prop
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
                onAddGradientLayer={props.addGradientLayer} // Passed addGradientLayer
                onDuplicateLayer={props.onDuplicateLayer} 
                onMergeLayerDown={props.onMergeLayerDown} 
                onRasterizeLayer={props.onRasterizeLayer}
                onReorder={props.onReorder}
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
                groupLayers={props.groupLayers} // Pass groupLayers
                toggleGroupExpanded={props.toggleGroupExpanded} // Pass toggleGroupExpanded
                hasActiveSelection={props.hasActiveSelection} 
                onApplySelectionAsMask={props.onApplySelectionAsMask} 
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </aside>
  );
};

export default Sidebar;