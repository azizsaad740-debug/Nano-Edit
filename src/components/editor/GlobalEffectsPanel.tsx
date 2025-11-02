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

import Filters from "@/components/editor/Filters";
import Transform from "@/components/editor/Transform";
import Crop from "@/components/editor/Crop";
import Presets from "@/components/editor/Presets";
import Effects from "@/components/editor/Effects";
import Frames from "@/components/editor/Frames";

import React from "react";
import type { Preset } from "@/hooks/usePresets";
import type { EditState, FrameState } from "@/types/editor"; // Removed Point, HslAdjustment imports

interface GlobalEffectsPanelProps {
  hasImage: boolean;
  // Removed color adjustment props (adjustments, grading, hslAdjustments, curves, etc.)
  
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
  
  onFilterChange: (filterValue: string, filterName: string) => void;
  selectedFilter: string;
  
  onTransformChange: (transformType: string) => void;
  rotation: number;
  onRotationChange: (value: number) => void;
  onRotationCommit: (value: number) => void;
  
  onAspectChange: (aspect: number | undefined) => void;
  aspect: number | undefined;
  
  frame: FrameState;
  onFramePresetChange: (type: FrameState['type'], name: string, options?: { width: number; color: string }) => void;
  onFramePropertyChange: (key: 'width' | 'color' | 'opacity' | 'roundness' | 'vignetteAmount' | 'vignetteRoundness', value: any) => void;
  onFramePropertyCommit: () => void; // UPDATED SIGNATURE
  
  // Preset Props
  presets: Preset[];
  onApplyPreset: (preset: Preset) => void;
  onSavePreset: () => void; // CHANGED: Expects dialog opener function
  onDeletePreset: (name: string) => void;
}

const GlobalEffectsPanel = (props: GlobalEffectsPanelProps) => {
  const {
    hasImage,
    effects,
    onEffectChange,
    onEffectCommit,
    onFilterChange,
    selectedFilter,
    onTransformChange,
    rotation,
    onRotationChange,
    onRotationCommit,
    onAspectChange,
    aspect,
    presets,
    onApplyPreset,
    onSavePreset, // Now the dialog opener
    onDeletePreset,
    frame,
    onFramePresetChange,
    onFramePropertyChange,
    onFramePropertyCommit,
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
    <Tabs defaultValue="effects" className="w-full">
      <TooltipProvider>
        <TabsList className="w-full h-12">
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

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="transform" className="h-10 flex-1">
                <CropIcon className="h-5 w-5" />
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Transform & Crop</p>
            </TooltipContent>
          </Tooltip>
        </TabsList>
      </TooltipProvider>

      {/* Effects tab */}
      <TabsContent value="effects" className="mt-4">
        <Accordion type="multiple" className="w-full" defaultValue={["presets", "filters", "effects"]}>
          <AccordionItem value="presets">
            <AccordionTrigger>Presets</AccordionTrigger>
            <AccordionContent>
              <Presets
                presets={presets}
                onApplyPreset={onApplyPreset}
                onSavePreset={onSavePreset} // CORRECTED: Pass the dialog opener directly
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
                onFramePresetChange={(type, name, options) => onFramePresetChange(type, name, options)} 
                onFramePropertyChange={onFramePropertyChange}
                onFramePropertyCommit={onFramePropertyCommit}
                currentFrame={frame} 
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
    </Tabs>
  );
};

export default GlobalEffectsPanel;