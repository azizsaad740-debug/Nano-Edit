import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import LightingAdjustments from "@/components/editor/LightingAdjustments";
import Filters from "@/components/editor/Filters";
import Transform from "@/components/editor/Transform";
import History from "@/components/editor/History";
import Effects from "@/components/editor/Effects";
import Crop from "@/components/editor/Crop";

interface EditorControlsProps {
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

const EditorControls = (props: EditorControlsProps) => {
  const { 
    adjustments, onAdjustmentChange, onAdjustmentCommit,
    effects, onEffectChange, onEffectCommit,
    onFilterChange, selectedFilter, 
    onTransformChange,
    onUndo, onRedo, canUndo, canRedo,
    onAspectChange, aspect
  } = props;

  return (
    <Accordion type="multiple" className="w-full" defaultValue={['lighting-color']}>
      <AccordionItem value="history">
        <AccordionTrigger>History</AccordionTrigger>
        <AccordionContent>
          <History onUndo={onUndo} onRedo={onRedo} canUndo={canUndo} canRedo={canRedo} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="crop">
        <AccordionTrigger>Crop</AccordionTrigger>
        <AccordionContent>
          <Crop onAspectChange={onAspectChange} currentAspect={aspect} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="lighting-color">
        <AccordionTrigger>Lighting & Color</AccordionTrigger>
        <AccordionContent>
          <LightingAdjustments 
            adjustments={adjustments}
            onAdjustmentChange={onAdjustmentChange}
            onAdjustmentCommit={onAdjustmentCommit}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="effects">
        <AccordionTrigger>Effects</AccordionTrigger>
        <AccordionContent>
          <Effects 
            effects={effects} 
            onEffectChange={onEffectChange} 
            onEffectCommit={onEffectCommit}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="filters">
        <AccordionTrigger>Filters</AccordionTrigger>
        <AccordionContent>
          <Filters 
            onFilterChange={onFilterChange}
            selectedFilter={selectedFilter}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="transform">
        <AccordionTrigger>Transform</AccordionTrigger>
        <AccordionContent>
          <Transform onTransformChange={onTransformChange} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default EditorControls;