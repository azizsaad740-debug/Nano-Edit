"use client";

import * as React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LightingAdjustments from "@/components/editor/LightingAdjustments";
import ColorGrading from "@/components/editor/ColorGrading";
import HslAdjustments from "@/components/editor/HslAdjustments";
import Curves from "@/components/editor/Curves";
import type { EditState, HslAdjustment, Point } from "@/types/editor";

type HslColorKey = keyof EditState['hslAdjustments'];

interface ColorCorrectionPanelProps {
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  onAdjustmentChange: (adjustment: string, value: number) => void;
  onAdjustmentCommit: (adjustment: string, value: number) => void;
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
  imgRef: React.RefObject<HTMLImageElement>;
  customHslColor: string;
  setCustomHslColor: (color: string) => void;
}

const ColorCorrectionPanel: React.FC<ColorCorrectionPanelProps> = (props) => {
  return (
    <Accordion type="multiple" className="w-full" defaultValue={["lighting", "curves"]}>
      <AccordionItem value="lighting">
        <AccordionTrigger>Lighting & Basic Color</AccordionTrigger>
        <AccordionContent>
          <LightingAdjustments
            adjustments={props.adjustments}
            onAdjustmentChange={props.onAdjustmentChange}
            onAdjustmentCommit={props.onAdjustmentCommit}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="curves">
        <AccordionTrigger>Curves</AccordionTrigger>
        <AccordionContent>
          <Curves
            curves={props.curves}
            onChange={props.onCurvesChange}
            onCommit={props.onCurvesCommit}
            imgRef={props.imgRef}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="hsl">
        <AccordionTrigger>HSL Adjustments</AccordionTrigger>
        <AccordionContent>
          <HslAdjustments
            hslAdjustments={props.hslAdjustments}
            onAdjustmentChange={props.onHslAdjustmentChange}
            onAdjustmentCommit={props.onHslAdjustmentCommit}
            customColor={props.customHslColor}
            setCustomColor={props.setCustomHslColor}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="grading">
        <AccordionTrigger>Color Grading</AccordionTrigger>
        <AccordionContent>
          <ColorGrading
            grading={props.grading}
            onGradingChange={props.onGradingChange}
            onGradingCommit={props.onGradingCommit}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default ColorCorrectionPanel;