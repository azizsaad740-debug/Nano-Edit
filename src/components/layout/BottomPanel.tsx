"use client";

import * as React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Palette, LayoutGrid, Info, Compass } from "lucide-react";
import ColorPanel from "@/components/auxiliary/ColorPanel";
import InfoPanel from "@/components/auxiliary/InfoPanel"; // Import InfoPanel
import NavigatorPanel from "@/components/auxiliary/NavigatorPanel"; // Import NavigatorPanel
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { EditState } from "@/types/editor";

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
}

const BottomPanel: React.FC<BottomPanelProps> = (props) => {
  const navigate = useNavigate();
  
  return (
    <div className="w-full h-48 border-t bg-background flex shrink-0">
      <div className="flex-1 min-w-0 h-full">
        <Tabs defaultValue="color" className="w-full h-full flex flex-col">
          <TabsList className="w-full h-10 shrink-0 rounded-none border-b justify-start">
            <TabsTrigger value="color" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background">
              <Palette className="h-4 w-4 mr-1" /> Color Palette
            </TabsTrigger>
            <TabsTrigger value="info" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background">
              <Info className="h-4 w-4 mr-1" /> Info
            </TabsTrigger>
            <TabsTrigger value="navigator" className="h-full flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background">
              <Compass className="h-4 w-4 mr-1" /> Navigator
            </TabsTrigger>
            <TabsTrigger value="templates" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background">
              <LayoutGrid className="h-4 w-4 mr-1" /> Templates
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="p-4">
              <TabsContent value="color" className="mt-0">
                <ColorPanel
                  foregroundColor={props.foregroundColor}
                  onForegroundColorChange={props.onForegroundColorChange}
                  backgroundColor={props.backgroundColor}
                  onBackgroundColorChange={props.onBackgroundColorChange}
                  onSwapColors={props.onSwapColors}
                />
              </TabsContent>
              
              <TabsContent value="info" className="mt-0">
                <InfoPanel
                  dimensions={props.dimensions}
                  fileInfo={props.fileInfo}
                  imgRef={props.imgRef}
                  exifData={props.exifData}
                  colorMode={props.colorMode}
                />
              </TabsContent>

              <TabsContent value="navigator" className="mt-0">
                <NavigatorPanel
                  image={props.hasImage ? props.imgRef.current?.src || null : null}
                  zoom={props.zoom}
                  onZoomIn={props.onZoomIn}
                  onZoomOut={props.onZoomOut}
                  onFitScreen={props.onFitScreen}
                  dimensions={props.dimensions}
                />
              </TabsContent>
              
              <TabsContent value="templates" className="mt-0">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Browse and load community templates to start your project.
                  </p>
                  <Button onClick={() => navigate('/community')}>
                    Go to Community Templates
                  </Button>
                </div>
              </TabsContent>
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