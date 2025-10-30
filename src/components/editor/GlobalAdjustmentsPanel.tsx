import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SlidersHorizontal,
  Crop as CropIcon,
  Wand2,
  Image as ImageIcon,
} from "lucide-react";

import LightingAdjustments from "@/components/editor/LightingAdjustments";
import Filters from "@/components/editor/Filters";
import Transform from "@/components/editor/Transform";
import Crop from "@/components/editor/Crop";
import Presets from "@/components/editor/Presets";
import Effects from "@/components/editor/Effects";
import HslAdjustments from "@/components/editor/HslAdjustments";
import ColorGrading from "@/components/editor/ColorGrading";
import Frames from "@/components/editor/Frames";
import Curves from "@/components/editor/Curves";

import React from "react";
import type { Preset } from "@/hooks/usePresets";
import type { Point, EditState, HslAdjustment, FrameState } from "@/types/editor"; // Import FrameState

type HslColorKey = keyof EditState['hslAdjustments'];

interface GlobalAdjustmentsPanelProps {
  hasImage: boolean;
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
    vignette: number;
    noise: number;
    sharpen: number;
    clarity: number;
  };
  onEffectChange: (effect: string, value: number) => void;
  onEffectCommit: (effect: string, value: number) => void;
  grading: {
    grayscale: number;
    sepia: number;
    invert: number;
  };
  onGradingChange: (gradingType: string, value: number) => void;
  onGradingCommit: (gradingType: string, value: number) => void;
  hslAdjustments: EditState['hslAdjustments'];
  onHslAdjustmentChange: (color: HslColorKey, key: keyof HslAdjustment, value: number) => void;
  onHslAdjustmentCommit: (color: HslColorKey, key: keyof HslAdjustment, value: number) => void;
  curves: EditState['curves'];
  onCurvesChange: (channel: keyof EditState['curves'], points: Point[]) => void;
  onCurvesCommit: (channel: keyof EditState['curves'], points: Point[]) => void;
  onFilterChange: (filterValue: string, filterName: string) => void;
  selectedFilter: string;
  onTransformChange: (transformType: string) => void;
  rotation: number;
  onRotationChange: (value: number) => void;
  onRotationCommit: (value: number) => void;
  onAspectChange: (aspect: number | undefined) => void;
  aspect: number | undefined;
  frame: FrameState;
  onFramePresetChange: (type: string, name: string, options?: { width: number; color: string }) => void;
  onFramePropertyChange: (key: 'width' | 'color', value: any) => void;
  onFramePropertyCommit: () => void;
  imgRef: React.RefObject<HTMLImageElement>;
  customHslColor: string; // NEW
  setCustomHslColor: (color: string) => void; // NEW
  // Preset Props (Added to fix errors 2, 3, 4, 5)
  presets: Preset[];
  onApplyPreset: (preset: Preset) => void;
  onSavePreset: (name: string) => void; // This is the function that takes the name from the dialog
  onDeletePreset: (name: string) => void;
}

const GlobalAdjustmentsPanel = (props: GlobalAdjustmentsPanelProps) => {
  const {
    hasImage,
    adjustments,
    onAdjustmentChange,
    onAdjustmentCommit,
    effects,
    onEffectChange,
    onEffectCommit,
    grading,
    onGradingChange,
    onGradingCommit,
    hslAdjustments,
    onHslAdjustmentChange,
    onHslAdjustmentCommit,
    curves,
    onCurvesChange,
    onCurvesCommit,
    onFilterChange,
    selectedFilter,
    onTransformChange,
    rotation,
    onRotationChange,
    onRotationCommit,
    onAspectChange,
    aspect,
    presets, // Destructured
    onApplyPreset, // Destructured
    onSavePreset, // Destructured
    onDeletePreset, // Destructured
    frame,
    onFramePresetChange,
    onFramePropertyChange,
    onFramePropertyCommit,
    customHslColor, // NEW
    setCustomHslColor, // NEW
  } = props;

  if (!hasImage) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
        <ImageIcon className="h-12 w-12 mb-4" />
        <h3 className="text-lg font-semibold">No Image Loaded</h3>
        <p className="text-sm">Upload an image to begin editing.</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="adjust" className="w-full">
      <TooltipProvider>
        <TabsList className="w-full h-12">
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="adjust" className="h-10 flex-1">
                <SlidersHorizontal className="h-5 w-5" />
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Adjustments</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="transform" className="h-10 flex-1">
                <CropIcon className="h-5 w-5" />
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Transform</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="effects" className="h-10 flex-1">
                <Wand2 className="h-5 w-5" />
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Effects & Presets</p>
            </TooltipContent>
          </Tooltip>
        </TabsList>
      </TooltipProvider>

      {/* Adjust tab */}
      <TabsContent value="adjust" className="mt-4">
        <Accordion type="multiple" className="w-full" defaultValue={["lighting-color", "color-grading"]}>
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
          <AccordionItem value="curves">
            <AccordionTrigger>Curves</AccordionTrigger>
            <AccordionContent>
              <Curves
                curves={curves}
                onChange={onCurvesChange}
                onCommit={onCurvesCommit}
                imgRef={props.imgRef}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="hsl-adjustments">
            <AccordionTrigger>HSL Adjustments</AccordionTrigger>
            <AccordionContent>
              <HslAdjustments
                hslAdjustments={hslAdjustments}
                onAdjustmentChange={onHslAdjustmentChange}
                onAdjustmentCommit={onHslAdjustmentCommit}
                customColor={customHslColor}
                setCustomColor={setCustomHslColor}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="color-grading">
            <AccordionTrigger>Color Grading</AccordionTrigger>
            <AccordionContent>
              <ColorGrading
                grading={grading}
                onGradingChange={onGradingChange}
                onGradingCommit={onGradingCommit}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContent>

      {/* Transform tab */}
      <TabsContent value="transform" className="mt-4">
        <Accordion type="multiple" className="w-full" defaultValue={["crop", "transform"]}>
          <AccordionItem value="crop">
            <AccordionTrigger>Crop</AccordionTrigger>
            <AccordionContent>
              <Crop onAspectChange={onAspectChange} currentAspect={aspect} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="transform">
            <AccordionTrigger>Transform</AccordionTrigger>
            <AccordionContent>
              <Transform 
                onTransformChange={onTransformChange} 
                rotation={rotation}
                onRotationChange={(value) => onRotationChange(value)}
                onRotationCommit={(value) => onRotationCommit(value)}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContent>

      {/* Effects tab */}
      <TabsContent value="effects" className="mt-4">
        <Accordion type="multiple" className="w-full" defaultValue={["presets", "filters", "effects"]}>
          <AccordionItem value="presets">
            <AccordionTrigger>Presets</AccordionTrigger>
            <AccordionContent>
              <Presets
                presets={presets}
                onApplyPreset={onApplyPreset}
                onSavePreset={() => props.onSavePreset("New Preset")} // Call the prop function with a placeholder name, which triggers the dialog
                onDeletePreset={onDeletePreset}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="filters">
            <AccordionTrigger>Filters</AccordionTrigger>
            <AccordionContent>
              <Filters onFilterChange={onFilterChange} selectedFilter={selectedFilter} />
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
          <AccordionItem value="frames">
            <AccordionTrigger>Frames</AccordionTrigger>
            <AccordionContent>
              <Frames 
                onFramePresetChange={onFramePresetChange} 
                onFramePropertyChange={onFramePropertyChange}
                onFramePropertyCommit={onFramePropertyCommit}
                currentFrame={frame} 
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContent>
    </Tabs>
  );
};

export default GlobalAdjustmentsPanel;