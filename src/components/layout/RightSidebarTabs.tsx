import * as React from 'react';
import type { Layer, EditState, PanelTab, Point, GradientToolState } from "@/types/editor";
import type { LucideIcon } from 'lucide-react';

export interface RightSidebarTabsProps {
  layers: Layer[];
  currentEditState: EditState;
  panelLayout: PanelTab[];
  activeRightTab: string;
  setActiveRightTab: (tab: string) => void;
  activeBottomTab: string;
  setActiveBottomTab: (tab: string) => void;
  
  // Layer Actions
  toggleLayerVisibility: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  onLayerOpacityCommit: () => void; // FIX 18
  onOpenSmartObject: (id: string) => void;
  onLayerReorder: (activeId: string, overId: string) => void;
  
  // Preset Actions
  onApplyPreset: (preset: any) => void; // FIX 18
  onSavePreset: (name: string) => void;
  onDeletePreset: (id: string) => void; // FIX 18
  onSaveGradientPreset: (name: string, state: GradientToolState) => void; // FIX 113: Corrected signature
  onDeleteGradientPreset: (id: string) => void; // FIX 18
  
  // Other Handlers
  addGradientLayer: (start: Point, end: Point) => void;
  onOpenFontManager: () => void;
  onOpenSettings: () => void;
  clearSelectionState: () => void; // FIX 124: Added missing required prop
}

// Placeholder component definition
export const RightSidebarTabs: React.FC<RightSidebarTabsProps> = (props) => {
  // Implementation details omitted
  return <div />;
};