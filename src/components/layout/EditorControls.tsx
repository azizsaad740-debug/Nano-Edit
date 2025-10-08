import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LightingAdjustments from "@/components/editor/LightingAdjustments";
import Filters from "@/components/editor/Filters";
import Transform from "@/components/editor/Transform";

interface EditorControlsProps {
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  onAdjustmentChange: (adjustment: string, value: number) => void;
  onFilterChange: (filterValue: string) => void;
  selectedFilter: string;
  onTransformChange: (transformType: string) => void;
}

const EditorControls = ({ 
  adjustments, 
  onAdjustmentChange, 
  onFilterChange, 
  selectedFilter, 
  onTransformChange 
}: EditorControlsProps) => {
  return (
    <div className="flex flex-col gap-4">
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
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <Filters 
            onFilterChange={onFilterChange}
            selectedFilter={selectedFilter}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Transform</CardTitle>
        </CardHeader>
        <CardContent>
          <Transform onTransformChange={onTransformChange} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditorControls;