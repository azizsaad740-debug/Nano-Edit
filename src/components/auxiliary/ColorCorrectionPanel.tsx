import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LightingAdjustments from "@/components/editor/LightingAdjustments";
import ColorGrading from "@/components/editor/ColorGrading";
import { HslAdjustments } from "@/components/editor/HslAdjustments";
import Curves from "@/components/editor/Curves";
import type { EditState, HslAdjustment, Point } from "@/types/editor";
import { Card, CardContent } from '@/components/ui/card';
import { Sun, Zap, Palette, SlidersHorizontal } from 'lucide-react';

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
    <Card className="w-full">
      <Tabs defaultValue="lighting">
        <TabsList className="grid w-full grid-cols-4 h-10">
          <TabsTrigger value="lighting" className="h-8">
            <Sun className="h-4 w-4 mr-1" /> Light
          </TabsTrigger>
          <TabsTrigger value="grading" className="h-8">
            <Zap className="h-4 w-4 mr-1" /> Grade
          </TabsTrigger>
          <TabsTrigger value="hsl" className="h-8">
            <Palette className="h-4 w-4 mr-1" /> HSL
          </TabsTrigger>
          <TabsTrigger value="curves" className="h-8">
            <SlidersHorizontal className="h-4 w-4 mr-1" /> Curves
          </TabsTrigger>
        </TabsList>
        <CardContent className="p-4">
          <TabsContent value="lighting" className="mt-0">
            <LightingAdjustments
              adjustments={props.adjustments}
              onAdjustmentChange={props.onAdjustmentChange}
              onAdjustmentCommit={props.onAdjustmentCommit}
            />
          </TabsContent>
          <TabsContent value="grading" className="mt-0">
            <ColorGrading
              grading={props.grading}
              onGradingChange={props.onGradingChange}
              onGradingCommit={props.onGradingCommit}
            />
          </TabsContent>
          <TabsContent value="hsl" className="mt-0">
            <HslAdjustments
              hslAdjustments={props.hslAdjustments}
              onAdjustmentChange={props.onHslAdjustmentChange}
              onAdjustmentCommit={props.onHslAdjustmentCommit}
              customColor={props.customHslColor}
              setCustomColor={props.setCustomHslColor}
            />
          </TabsContent>
          <TabsContent value="curves" className="mt-0">
            <Curves
              curves={props.curves}
              onCurvesChange={props.onCurvesChange}
              onCurvesCommit={props.onCurvesCommit}
              imgRef={props.imgRef}
            />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default ColorCorrectionPanel;