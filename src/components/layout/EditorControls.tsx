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
  History as HistoryIcon,
  Info as InfoIcon,
  Image as ImageIcon,
} from "lucide-react";

import LightingAdjustments from "@/components/editor/LightingAdjustments";
import Filters from "@/components/editor/Filters";
import Transform from "@/components/editor/Transform";
import Crop from "@/components/editor/Crop";
import History from "@/components/editor/History";
import ColorGrading from "@/components/editor/ColorGrading";
import Info from "@/components/editor/Info";
import Presets from "@/components/editor/Presets";
import Effects from "@/components/editor/Effects";
import React from "react";
import type { Preset } from "@/hooks/usePresets";
import type { Point, EditState } from "@/hooks/useEditorState";
import Frames from "@/components/editor/Frames";
import Curves from "@/components/editor/Curves";

interface EditorControlsProps {
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
  curves: EditState['curves'];
  onCurvesChange: (channel: keyof EditState['curves'], points: Point[]) => void;
  onCurvesCommit: (channel: keyof EditState['curves'], points: Point[]) => void;
  onFilterChange: (filterValue: string, filterName: string) => void;
  selectedFilter: string;
  onTransformChange: (transformType: string) => void;
  onAspectChange: (aspect: number | undefined) => void;
  aspect: number | undefined;
  history: { name: string }[];
  currentHistoryIndex: number;
  onHistoryJump: (index: number) => void;
  dimensions: { width: number; height: number } | null;
  fileInfo: { name: string; size: number } | null;
  imgRef: React.RefObject<HTMLImageElement>;
  exifData: any;
  presets: Preset[];
  onApplyPreset: (preset: Preset) => void;
  onSavePreset: () => void;
  onDeletePreset: (name: string) => void;
  frame: { type: 'none' | 'solid'; width: number; color: string; };
  onFramePresetChange: (type: string, name: string, options?: { width: number; color: string }) => void;
  onFramePropertyChange: (key: 'width' | 'color', value: any) => void;
  onFramePropertyCommit: () => void;
}

const EditorControls = (props: EditorControlsProps) => {
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
    curves,
    onCurvesChange,
    onCurvesCommit,
    onFilterChange,
    selectedFilter,
    onTransformChange,
    onAspectChange,
    aspect,
    history,
    currentHistoryIndex,
    onHistoryJump,
    dimensions,
    fileInfo,
    imgRef,
    exifData,
    presets,
    onApplyPreset,
    onSavePreset,
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
              <p>Adjust</p>
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
              <p>Effects</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="history" className="h-10 flex-1">
                <HistoryIcon className="h-5 w-5" />
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>History</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="info" className="h-10 flex-1">
                <InfoIcon className="h-5 w-5" />
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Info</p>
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
                imgRef={imgRef}
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
              <Transform onTransformChange={onTransformChange} />
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
                onSavePreset={onSavePreset}
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

      {/* History tab */}
      <TabsContent value="history" className="mt-4">
        <History history={history} currentIndex={currentHistoryIndex} onJump={onHistoryJump} />
      </TabsContent>

      {/* Info tab */}
      <TabsContent value="info" className="mt-4">
        <Info dimensions={dimensions} fileInfo={fileInfo} imgRef={imgRef} exifData={exifData} />
      </TabsContent>
    </Tabs>
  );
};

export default EditorControls;