import EditorControls from "@/components/layout/EditorControls";

interface SidebarProps {
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
  };
  onEffectChange: (effect: string, value: number) => void;
  onEffectCommit: (effect: string, value: number) => void;
  onFilterChange: (filterValue: string) => void;
  selectedFilter: string;
  onTransformChange: (transformType: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onAspectChange: (aspect: number | undefined) => void;
  aspect: number | undefined;
}

const Sidebar = (props: SidebarProps) => {
  return (
    <aside className="h-full border-r bg-muted/40 p-4 overflow-y-auto">
      <EditorControls {...props} />
    </aside>
  );
};

export default Sidebar;