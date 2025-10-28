"use client";

import * as React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  History,
  Palette,
  Info,
  LayoutGrid,
  Brush,
  PenTool,
  SlidersHorizontal,
  Layers,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import HistoryPanel from "@/components/auxiliary/HistoryPanel";
import ColorPanel from "@/components/auxiliary/ColorPanel";
import InfoPanel from "@/components/auxiliary/InfoPanel";
import NavigatorPanel from "@/components/auxiliary/NavigatorPanel";
import BrushesPanel from "@/components/auxiliary/BrushesPanel";
import PathsPanel from "@/components/auxiliary/PathsPanel";
import AdjustmentsPanel from "@/components/auxiliary/AdjustmentsPanel";
import { ChannelsPanel } from "@/components/editor/ChannelsPanel";
import type { EditState, BrushState } from "@/types/editor";

interface AuxiliaryPanelProps {
  hasImage: boolean;
  // History Props
  history: { name: string }[];
  currentHistoryIndex: number;
  onHistoryJump: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  // Color Props
  foregroundColor: string;
  onForegroundColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onSwapColors: () => void;
  // Info Props
  dimensions: { width: number; height: number } | null;
  fileInfo: { name: string; size: number } | null;
  imgRef: React.RefObject<HTMLImageElement>;
  exifData: any;
  colorMode: EditState['colorMode'];
  // Navigator Props
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  // Channels Props
  channels: EditState['channels'];
  onChannelChange: (channel: 'r' | 'g' | 'b', value: boolean) => void;
  // Brushes Props
  brushState: BrushState;
  setBrushState: (updates: Partial<Omit<BrushState, 'color'>>) => void;
  // Adjustments Props
  onAddAdjustmentLayer: (type: 'brightness' | 'curves' | 'hsl' | 'grading') => void;
}

const AuxiliaryPanel = (props: AuxiliaryPanelProps) => {
  return (
    <Tabs defaultValue="history" className="w-full h-full flex flex-col">
      <TooltipProvider>
        <TabsList className="w-full h-10 shrink-0">
          <Tooltip>
            <TabsTrigger value="history" className="h-8 flex-1">
              <History className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>History</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TabsTrigger value="channels" className="h-8 flex-1">
              <Layers className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>Channels</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TabsTrigger value="color" className="h-8 flex-1">
              <Palette className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>Color</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TabsTrigger value="info" className="h-8 flex-1">
              <Info className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>Info</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TabsTrigger value="navigator" className="h-8 flex-1">
              <LayoutGrid className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>Navigator</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TabsTrigger value="brushes" className="h-8 flex-1">
              <Brush className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>Brushes</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TabsTrigger value="paths" className="h-8 flex-1">
              <PenTool className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>Paths</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TabsTrigger value="adjustments" className="h-8 flex-1">
              <SlidersHorizontal className="h-4 w-4" />
            </TabsTrigger>
            <TooltipContent>Adjustments</TooltipContent>
          </Tooltip>
        </TabsList>
      </TooltipProvider>

      <div className="flex-1 overflow-y-auto mt-4">
        <TabsContent value="history" className="p-1">
          <HistoryPanel
            history={props.history}
            currentIndex={props.currentHistoryIndex}
            onJump={props.onHistoryJump}
            onUndo={props.onUndo}
            onRedo={props.onRedo}
            canUndo={props.canUndo}
            canRedo={props.canRedo}
          />
        </TabsContent>
        <TabsContent value="channels" className="p-1">
          <ChannelsPanel channels={props.channels} onChannelChange={props.onChannelChange} />
        </TabsContent>
        <TabsContent value="color" className="p-1">
          <ColorPanel
            foregroundColor={props.foregroundColor}
            onForegroundColorChange={props.onForegroundColorChange}
            backgroundColor={props.backgroundColor}
            onBackgroundColorChange={props.onBackgroundColorChange}
            onSwapColors={props.onSwapColors}
          />
        </TabsContent>
        <TabsContent value="info" className="p-1">
          <InfoPanel
            dimensions={props.dimensions}
            fileInfo={props.fileInfo}
            imgRef={props.imgRef}
            exifData={props.exifData}
            colorMode={props.colorMode}
          />
        </TabsContent>
        <TabsContent value="navigator" className="p-1">
          <NavigatorPanel
            image={props.hasImage ? props.imgRef.current?.src || null : null}
            zoom={props.zoom}
            onZoomIn={props.onZoomIn}
            onZoomOut={props.onZoomOut}
            onFitScreen={props.onFitScreen}
            dimensions={props.dimensions}
          />
        </TabsContent>
        <TabsContent value="brushes" className="p-1">
          <BrushesPanel brushState={props.brushState} setBrushState={props.setBrushState} />
        </TabsContent>
        <TabsContent value="paths" className="p-1">
          <PathsPanel />
        </TabsContent>
        <TabsContent value="adjustments" className="p-1">
          <AdjustmentsPanel onAddAdjustmentLayer={props.onAddAdjustmentLayer} />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default AuxiliaryPanel;