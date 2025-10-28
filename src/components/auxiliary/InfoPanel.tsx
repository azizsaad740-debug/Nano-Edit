import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Info from "@/components/editor/Info";
import * as React from "react";
import type { EditState } from "@/types/editor";
import { Separator } from "@/components/ui/separator";

interface InfoPanelProps {
  dimensions: { width: number; height: number } | null;
  fileInfo: { name: string; size: number } | null;
  imgRef: React.RefObject<HTMLImageElement>;
  exifData: any;
  colorMode: EditState['colorMode'];
}

const InfoPanel = ({ dimensions, fileInfo, imgRef, exifData, colorMode }: InfoPanelProps) => {
  // Stubs for cursor/measurement info
  const [cursorX, setCursorX] = React.useState(0);
  const [cursorY, setCursorY] = React.useState(0);
  const [cursorColor, setCursorColor] = React.useState('#000000');

  // Simulate cursor tracking (in a real app, this would be handled by Workspace)
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Simulate coordinates relative to the image (0-1000 range for simplicity)
      setCursorX(Math.round(e.clientX % 1000));
      setCursorY(Math.round(e.clientY % 1000));
      // Simulate color pick (just a random hex for stub)
      setCursorColor(`#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Document Info</h3>
      <Info dimensions={dimensions} fileInfo={fileInfo} imgRef={imgRef} exifData={exifData} />
      
      <Separator />

      <h3 className="text-sm font-medium">Cursor & Measurement</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Position (X/Y):</span>
          <span>{cursorX} / {cursorY} px (Stub)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Color (Hex):</span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: cursorColor }} />
            {cursorColor.toUpperCase()} (Stub)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Measurement (W/H):</span>
          <span>0 / 0 px (Stub)</span>
        </div>
      </div>

      <Separator />

      <h3 className="text-sm font-medium">Document Settings</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Color Mode:</span>
          <span>{colorMode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Bit Depth:</span>
          <span>8-bit (Stub)</span>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;