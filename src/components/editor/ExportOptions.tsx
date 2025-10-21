import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface ExportOptionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: {
    format: string;
    quality: number;
    width: number;
    height: number;
    upscale: 1 | 2 | 4;
  }) => void;
  dimensions: { width: number; height: number } | null;
}

export const ExportOptions = ({
  open,
  onOpenChange,
  onExport,
  dimensions,
}: ExportOptionsProps) => {
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [quality, setQuality] = useState(90);
  const [width, setWidth] = useState(dimensions?.width || 0);
  const [height, setHeight] = useState(dimensions?.height || 0);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [upscale, setUpscale] = useState<1 | 2 | 4>(1);

  useEffect(() => {
    if (open && dimensions) {
      const factor = upscale;
      setWidth(dimensions.width * factor);
      setHeight(dimensions.height * factor);
    }
  }, [open, dimensions, upscale]);

  const handleUpscaleChange = (v: string) => {
    const newUpscale = parseInt(v, 10) as 1 | 2 | 4;
    setUpscale(newUpscale);
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (upscale > 1) return;
    const newWidth = parseInt(e.target.value, 10) || 0;
    setWidth(newWidth);
    if (keepAspectRatio && dimensions && dimensions.height > 0) {
      const aspect = dimensions.width / dimensions.height;
      setHeight(Math.round(newWidth / aspect));
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (upscale > 1) return;
    const newHeight = parseInt(e.target.value, 10) || 0;
    setHeight(newHeight);
    if (keepAspectRatio && dimensions && dimensions.width > 0) {
      const aspect = dimensions.width / dimensions.height;
      setWidth(Math.round(newHeight * aspect));
    }
  };

  const handleExport = () => {
    onExport({
      format,
      quality: quality / 100,
      width,
      height,
      upscale,
    });
    onOpenChange(false);
  };

  const isManualResizeDisabled = upscale > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Image</DialogTitle>
          <DialogDescription>
            Choose format, quality, and dimensions. Note: if you used generative fill, the exported file may be larger.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Upscale Option */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="upscale" className="text-right">
              AI Upscale
            </Label>
            <Select value={String(upscale)} onValueChange={handleUpscaleChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select upscale factor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">None (1x)</SelectItem>
                <SelectItem value="2">Creative Upscale (2x)</SelectItem>
                <SelectItem value="4">Creative Upscale (4x)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Format */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <Select value={format} onValueChange={(v) => setFormat(v as any)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="webp">WEBP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quality (only for JPEG/WEBP) */}
          {(format === "jpeg" || format === "webp") && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quality" className="text-right">
                Quality
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Slider
                  id="quality"
                  min={10}
                  max={100}
                  step={5}
                  value={[quality]}
                  onValueChange={([v]) => setQuality(v)}
                />
                <span className="w-10 text-right text-sm text-muted-foreground">{quality}%</span>
              </div>
            </div>
          )}

          {/* Dimensions */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Dimensions</Label>
            <div className="col-span-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <Input 
                type="number" 
                value={width} 
                onChange={handleWidthChange} 
                disabled={isManualResizeDisabled}
                className={isManualResizeDisabled ? "bg-muted" : ""}
              />
              <span className="text-muted-foreground">×</span>
              <Input 
                type="number" 
                value={height} 
                onChange={handleHeightChange} 
                disabled={isManualResizeDisabled}
                className={isManualResizeDisabled ? "bg-muted" : ""}
              />
            </div>
          </div>

          {/* Keep aspect ratio */}
          <div className="grid grid-cols-4 items-center gap-4">
            <div />
            <div className="col-span-3 flex items-center space-x-2">
              <Checkbox
                id="keep-aspect"
                checked={keepAspectRatio}
                onCheckedChange={(c) => setKeepAspectRatio(Boolean(c))}
                disabled={isManualResizeDisabled}
              />
              <Label htmlFor="keep-aspect" className="text-sm font-medium text-muted-foreground">
                Keep aspect ratio (Disabled when upscaling)
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleExport} disabled={!dimensions}>Download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportOptions;