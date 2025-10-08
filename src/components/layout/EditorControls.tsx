import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LightingAdjustments from "@/components/editor/LightingAdjustments";
import Filters from "@/components/editor/Filters";
import Transform from "@/components/editor/Transform";
import History from "@/components/editor/History";
import Effects from "@/components/editor/Effects";

interface EditorControlsProps {
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  onAdjustmentChange: (adjustment: string, value: number) => void;
  effects: {
    blur: number;
    hueShift: number;
  };
  onEffectChange: (effect: string, value: number) => void;
  onFilterChange: (filterValue: string) => void;
  selectedFilter: string;
  onTransformChange: (transformType: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const EditorControls = ({ 
  adjustments, 
  onAdjustmentChange, 
  effects,
  onEffectChange,
  onFilterChange, 
  selectedFilter, 
  onTransformChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}: EditorControlsProps) => {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <History onUndo={onUndo} onRedo={onRedo} canUndo={canUndo} canRedo={canRedo} />
        </CardContent>
      </Card>
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
          <CardTitle>Effects</CardTitle>
        </CardHeader>
        <CardContent>
          <Effects effects={effects} onEffectChange={onEffectChange} />
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