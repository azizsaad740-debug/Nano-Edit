"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Expand } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NavigatorPanelProps {
  image: string | null;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  dimensions: { width: number; height: number } | null;
}

const NavigatorPanel = ({ image, zoom, onZoomIn, onZoomOut, onFitScreen, dimensions }: NavigatorPanelProps) => {
  const [tempZoom, setTempZoom] = React.useState(Math.round(zoom * 100));

  React.useEffect(() => {
    setTempZoom(Math.round(zoom * 100));
  }, [zoom]);

  const handleZoomInputCommit = () => {
    const newZoom = Math.max(10, Math.min(500, tempZoom)) / 100;
    // Note: In a real app, this would call a function to set the zoom state in Index.tsx
    // For now, we rely on the existing zoom controls.
    console.log(`Stub: Setting zoom to ${newZoom}`);
  };

  const handleSliderChange = ([value]: number[]) => {
    setTempZoom(value);
    // Note: For performance, we usually don't update the main zoom state on every slider change,
    // but since we don't have a direct zoom setter here, we'll just update the local state.
  };

  if (!image || !dimensions) {
    return <p className="text-sm text-muted-foreground">Load an image to use the Navigator.</p>;
  }

  // Calculate preview size to fit within the panel (max 150px height/width)
  const maxPreviewSize = 150;
  const aspectRatio = dimensions.width / dimensions.height;
  let previewWidth = maxPreviewSize;
  let previewHeight = maxPreviewSize;

  if (aspectRatio > 1) {
    previewHeight = maxPreviewSize / aspectRatio;
  } else {
    previewWidth = maxPreviewSize * aspectRatio;
  }
  
  // Calculate the position and size of the view box (stub)
  const viewBoxSize = Math.min(100 / zoom, 100);
  const viewBoxStyle: React.CSSProperties = {
    width: `${viewBoxSize}%`,
    height: `${viewBoxSize}%`,
    border: '2px solid hsl(var(--primary))',
    position: 'absolute',
    top: '50%', // Stubbed center position
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Document Preview</h3>
      <div className="flex justify-center">
        <div 
          className="relative border rounded-md overflow-hidden bg-muted"
          style={{ width: previewWidth, height: previewHeight }}
        >
          <img 
            src={image} 
            alt="Document Preview" 
            className="w-full h-full object-contain" 
          />
          <div style={viewBoxStyle} />
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t">
        <h3 className="text-sm font-medium">Zoom Controls</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Slider
            min={10}
            max={500}
            step={1}
            value={[tempZoom]}
            onValueChange={handleSliderChange}
            onValueCommit={handleZoomInputCommit}
            className="flex-1"
          />
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={10}
            max={500}
            value={tempZoom}
            onChange={(e) => setTempZoom(parseInt(e.target.value) || 0)}
            onBlur={handleZoomInputCommit}
            className="w-20 h-8 text-sm text-right"
          />
          <span className="text-sm text-muted-foreground">%</span>
          <Button variant="outline" size="sm" className="flex-1" onClick={onFitScreen}>
            <Expand className="h-4 w-4 mr-2" /> Fit to Screen
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NavigatorPanel;