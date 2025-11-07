import * as React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Palette, LayoutGrid, Info, Compass, SlidersHorizontal, Zap } from "lucide-react";
import ColorPanel from "@/components/auxiliary/ColorPanel";
import InfoPanel from "@/components/auxiliary/InfoPanel";
import NavigatorPanel from "@/components/auxiliary/NavigatorPanel";
import ColorCorrectionPanel from "@/components/auxiliary/ColorCorrectionPanel";
import XtraAiPanel from "@/components/auxiliary/XtraAiPanel";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { EditState, HslAdjustment, Point } from "@/types/editor";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { DraggableTab } from "./DraggableTab";
import type { PanelTab } from "@/types/editor/core";

type HslColorKey = keyof EditState['hslAdjustments'];

interface BottomPanelProps {
  // Color Props
  foregroundColor: string;
  onForegroundColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onSwapColors: () => void;
  // Info/Navigator Props
  dimensions: { width: number; height: number } | null;
  fileInfo: { name: string; size: number } | null;
  imgRef: React.RefObject<HTMLImageElement>;
  exifData: any;
  colorMode: EditState['colorMode'];
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  hasImage: boolean;
  // Color Correction Props
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
  customHslColor: string;
  setCustomHslColor: (color: string) => void;
  // AI Props (NEW)
  geminiApiKey: string;
  base64Image: string | null;
  onImageResult: (resultUrl: string, historyName: string) => void;
  onMaskResult: (maskDataUrl: string, historyName: string) => void;
  onOpenSettings: () => void;
  // Panel Management Props (NEW)
  panelLayout: PanelTab[];
  reorderPanelTabs: (activeId: string, overId: string, newLocation: 'right' | 'bottom') => void;
  activeBottomTab: string;
  setActiveBottomTab: (id: string) => void;
  isGuest: boolean; // NEW
}

const BottomPanel: React.FC<BottomPanelProps> = (props) => {
  const navigate = useNavigate();
  const {
    panelLayout, activeBottomTab, setActiveBottomTab,
  } = props;

  const bottomTabs = React.useMemo(() => {
    return panelLayout
      .filter(t => t.location === 'bottom' && t.visible)
      .sort((a, b) => a.order - b.order);
  }, [panelLayout]);

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: 'bottom-panel',
    data: { location: 'bottom' },
  });

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case 'color':
        return (
          <ColorPanel
            foregroundColor={props.foregroundColor}
            onForegroundColorChange={props.onForegroundColorChange}
            backgroundColor={props.backgroundColor}
            onBackgroundColorChange={props.onBackgroundColorChange}
            onSwapColors={props.onSwapColors}
          />
        );
      case 'correction':
        return (
          <ColorCorrectionPanel
            adjustments={props.adjustments}
            onAdjustmentChange={props.onAdjustmentChange}
            onAdjustmentCommit={props.onAdjustmentCommit}
            grading={props.grading}
            onGradingChange={props.onGradingChange}
            onGradingCommit={props.onGradingCommit}
            hslAdjustments={props.hslAdjustments}
            onHslAdjustmentChange={props.onHslAdjustmentChange}
            onHslAdjustmentCommit={props.onHslAdjustmentCommit}
            curves={props.curves}
            onCurvesChange={props.onCurvesChange}
            onCurvesCommit={props.onCurvesCommit}
            imgRef={props.imgRef}
            customHslColor={props.customHslColor}
            setCustomHslColor={props.setCustomHslColor}
          />
        );
      case 'ai-xtra':
        return (
          <XtraAiPanel
            hasImage={props.hasImage}
            base64Image={props.base64Image}
            dimensions={props.dimensions}
            geminiApiKey={props.geminiApiKey}
            onImageResult={props.onImageResult}
            onMaskResult={props.onMaskResult}
            onOpenSettings={props.onOpenSettings}
            isGuest={props.isGuest}
          />
        );
      case 'info':
        return (
          <InfoPanel
            dimensions={props.dimensions}
            fileInfo={props.fileInfo}
            imgRef={props.imgRef}
            exifData={props.exifData}
            colorMode={props.colorMode}
          />
        );
      case 'navigator':
        return (
          <NavigatorPanel
            image={props.hasImage ? props.imgRef.current?.src || null : null}
            zoom={props.zoom}
            onZoomIn={props.onZoomIn}
            onZoomOut={props.onZoomOut}
            onFitScreen={props.onFitScreen}
            dimensions={props.dimensions}
          />
        );
      case 'templates':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Browse and load community templates to start your project.
            </p>
            <Button onClick={() => navigate('/community')}>
              Go to Community Templates
            </Button>
          </div>
        );
      default:
        return <div className="p-4 text-muted-foreground">Panel not found.</div>;
    }
  };

  return (
    <div className="w-full h-48 border-t bg-background flex shrink-0">
      <div className="flex-1 min-w-0 h-full">
        <Tabs value={activeBottomTab} onValueChange={setActiveBottomTab} className="w-full h-full flex flex-col">
          <TabsList className="w-full h-10 shrink-0 rounded-none border-b justify-start p-0" ref={setDroppableNodeRef}>
            <SortableContext
              items={bottomTabs.map(t => t.id)}
              strategy={horizontalListSortingStrategy}
            >
              {bottomTabs.map((tab) => (
                <DraggableTab
                  key={tab.id}
                  tab={tab}
                  isActive={activeBottomTab === tab.id}
                  onSelect={setActiveBottomTab}
                />
              ))}
            </SortableContext>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="p-4">
              {bottomTabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-0">
                  {renderTabContent(tab.id)}
                </TabsContent>
              ))}
            </div>
          </ScrollArea>
        </Tabs>
      </div>
      
      {/* Ad Section (Fixed width, bottom right) */}
      <div className="w-64 h-full border-l bg-muted/50 p-4 shrink-0 flex flex-col justify-between">
        <h3 className="text-sm font-semibold text-foreground">Ad Section</h3>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs border border-dashed rounded-md mt-2">
          Placeholder for Premium Features Ad (552x186px area)
        </div>
      </div>
    </div>
  );
};

export default BottomPanel;