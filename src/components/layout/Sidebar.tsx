import { RightSidebarTabs } from "@/components/layout/RightSidebarTabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EditState, BrushState, ActiveTool, SelectionSettings, Layer, Point } from "@/types/editor";
import type { Preset } from "@/hooks/usePresets";

interface SidebarProps {
  // RightSidebarTabs Props
  hasImage: boolean;
  activeTool: ActiveTool | null;
  selectedLayerId: string | null;
  selectedLayer: Layer | undefined;
  layers: Layer[];
  imgRef: React.RefObject<HTMLImageElement>;
  onSelectLayer: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
  onReorder: (activeId: string, overId: string) => void;
  toggleLayerVisibility: (id: string) => void;
  renameLayer: (id: string, newName: string) => void;
  deleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMergeLayerDown: (id: string) => void;
  onRasterizeLayer: (id: string) => void;
  onCreateSmartObject: (layerIds: string[]) => void;
  onOpenSmartObject: (id: string) => void;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string, historyName: string) => void;
  onLayerPropertyCommit: (id: string, updates: Partial<Layer>, historyName: string) => void;
  onLayerOpacityChange: (opacity: number) => void;
  onLayerOpacityCommit: () => void;
  addTextLayer: (coords: Point, color: string) => void;
  addDrawingLayer: () => string;
  onAddLayerFromBackground: () => void;
  onLayerFromSelection: () => void;
  addShapeLayer: (coords: Point, shapeType?: any, initialWidth?: number, initialHeight?: number, fillColor?: string, strokeColor?: string) => void;
  addGradientLayer: () => void;
  onAddAdjustmentLayer: (type: 'brightness' | 'curves' | 'hsl' | 'grading') => void;
  selectedShapeType: any;
  groupLayers: (layerIds: string[]) => void;
  toggleGroupExpanded: (id: string) => void;
  onRemoveLayerMask: (id: string) => void;
  onInvertLayerMask: (id: string) => void;
  onToggleClippingMask: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  onDeleteHiddenLayers: () => void;
  onRasterizeSmartObject: (id: string) => void;
  onConvertSmartObjectToLayers: (id: string) => void;
  onExportSmartObjectContents: (id: string) => void;
  onArrangeLayer: (direction: 'front' | 'back' | 'forward' | 'backward') => void;
  hasActiveSelection: boolean;
  onApplySelectionAsMask: () => void;
  handleDestructiveOperation: (operation: 'delete' | 'fill') => void;
  // Global Adjustments Props
  adjustments: EditState['adjustments'];
  onAdjustmentChange: (adjustment: string, value: number) => void;
  onAdjustmentCommit: (adjustment: string, value: number) => void;
  effects: EditState['effects'];
  onEffectChange: (effect: string, value: number) => void;
  onEffectCommit: (effect: string, value: number) => void;
  grading: EditState['grading'];
  onGradingChange: (gradingType: string, value: number) => void;
  onGradingCommit: (gradingType: string, value: number) => void;
  hslAdjustments: EditState['hslAdjustments'];
  onHslAdjustmentChange: (color: any, key: any, value: number) => void;
  onHslAdjustmentCommit: (color: any, key: any, value: number) => void;
  curves: EditState['curves'];
  onCurvesChange: (channel: any, points: any[]) => void;
  onCurvesCommit: (channel: any, points: any[]) => void;
  onFilterChange: (filterValue: string, filterName: string) => void;
  selectedFilter: string;
  onTransformChange: (transformType: string) => void;
  rotation: number;
  onRotationChange: (value: number) => void;
  onRotationCommit: (value: number) => void;
  onAspectChange: (aspect: number | undefined) => void;
  aspect: number | undefined;
  frame: EditState['frame'];
  onFramePresetChange: (type: string, name: string, options?: { width: number; color: string }) => void;
  onFramePropertyChange: (key: 'width' | 'color', value: any) => void;
  onFramePropertyCommit: () => void;
  // Presets
  presets: Preset[];
  onApplyPreset: (preset: Preset) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (name: string) => void;
  // Gradient Presets
  gradientToolState: any;
  setGradientToolState: React.Dispatch<React.SetStateAction<any>>;
  gradientPresets: any[];
  onSaveGradientPreset: (name: string, state: any) => void;
  onDeleteGradientPreset: (name: string) => void;
  // Brush State
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  // Selective Blur
  selectiveBlurAmount: number;
  onSelectiveBlurAmountChange: (value: number) => void;
  onSelectiveBlurAmountCommit: (value: number) => void;
  // HSL Custom Color
  customHslColor: string;
  setCustomHslColor: (color: string) => void;
  // Font Manager Props
  systemFonts: string[];
  customFonts: string[];
  onOpenFontManager: () => void;
  // Clone Source Point
  cloneSourcePoint: Point | null;
  // Selection Settings
  selectionSettings: SelectionSettings;
  onSelectionSettingChange: (key: keyof SelectionSettings, value: any) => void;
  onSelectionSettingCommit: (key: keyof SelectionSettings, value: any) => void;
  // Channels Props
  channels: EditState['channels'];
  onChannelChange: (channel: 'r' | 'g' | 'b', value: boolean) => void;
  // Layers Panel Component
  LayersPanel: React.ComponentType<any>;
  // Image Ref
  imgRef: React.RefObject<HTMLImageElement>;
  // Color Props (Needed for LayersPanel/ToolOptions)
  foregroundColor: string;
  onForegroundColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
}

const Sidebar = (props: SidebarProps) => {
  // The mobile check is now handled in Index.tsx for the overall layout structure.
  // This component now represents the fixed Right Sidebar content.

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <RightSidebarTabs {...props} />
      </div>
    </ScrollArea>
  );
};

export default Sidebar;