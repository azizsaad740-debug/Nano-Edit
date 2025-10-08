import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LightingAdjustments from "@/components/editor/LightingAdjustments";

interface SidebarProps {
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  onAdjustmentChange: (adjustment: string, value: number) => void;
}

const Sidebar = ({ adjustments, onAdjustmentChange }: SidebarProps) => {
  return (
    <aside className="w-80 border-r bg-muted/40 p-4 hidden md:flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Lighting & Color</CardTitle>
        </CardHeader>
        <CardContent>
          <LightingAdjustments 
            adjustments={adjustments}
            onAdjustmentChange={onAdjustmentChange}
          />
        </CardContent>
      </Card>
    </aside>
  );
};

export default Sidebar;