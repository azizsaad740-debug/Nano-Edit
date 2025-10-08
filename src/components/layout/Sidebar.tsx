import EditorControls from "@/components/layout/EditorControls";

interface SidebarProps {
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  onAdjustmentChange: (adjustment: string, value: number) => void;
  onFilterChange: (filterValue: string) => void;
  selectedFilter: string;
  onTransformChange: (transformType: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Sidebar = (props: SidebarProps) => {
  return (
    <aside className="w-80 border-r bg-muted/40 p-4 hidden md:block overflow-y-auto">
      <EditorControls {...props} />
    </aside>
  );
};

export default Sidebar;