"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import type { EditState } from "@/types/editor";

interface ProjectSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDimensions: { width: number; height: number } | null;
  currentColorMode: EditState['colorMode'];
  onUpdateSettings: (updates: {
    width?: number;
    height?: number;
    colorMode?: EditState['colorMode'];
  }) => void;
}

export const ProjectSettingsDialog = ({
  open,
  onOpenChange,
  currentDimensions,
  currentColorMode,
  onUpdateSettings,
}: ProjectSettingsDialogProps) => {
  const [width, setWidth] = React.useState(currentDimensions?.width || 0);
  const [height, setHeight] = React.useState(currentDimensions?.height || 0);
  const [colorMode, setColorMode] = React.useState<EditState['colorMode']>(currentColorMode);
  const [keepAspectRatio, setKeepAspectRatio] = React.useState(true);

  React.useEffect(() => {
    if (open && currentDimensions) {
      setWidth(currentDimensions.width);
      setHeight(currentDimensions.height);
      setColorMode(currentColorMode);
    }
  }, [open, currentDimensions, currentColorMode]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value, 10) || 0;
    setWidth(newWidth);
    if (keepAspectRatio && currentDimensions && currentDimensions.width > 0) {
      const aspect = currentDimensions.width / currentDimensions.height;
      setHeight(Math.round(newWidth / aspect));
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value, 10) || 0;
    setHeight(newHeight);
    if (keepAspectRatio && currentDimensions && currentDimensions.height > 0) {
      const aspect = currentDimensions.width / currentDimensions.height;
      setWidth(Math.round(newHeight * aspect));
    }
  };

  const handleSave = () => {
    if (width <= 0 || height <= 0) {
      showError("Dimensions must be greater than zero.");
      return;
    }

    const updates: { width?: number; height?: number; colorMode?: EditState['colorMode'] } = {};

    if (width !== currentDimensions?.width || height !== currentDimensions?.height) {
      updates.width = width;
      updates.height = height;
    }
    if (colorMode !== currentColorMode) {
      updates.colorMode = colorMode;
    }

    if (Object.keys(updates).length > 0) {
      onUpdateSettings(updates);
      showSuccess("Project settings updated.");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Adjust canvas size and color mode for the current project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Dimensions */}
          <div className="grid gap-2">
            <Label>Canvas Dimensions (Pixels)</Label>
            <div className="grid grid-cols-3 items-center gap-2">
              <Input type="number" value={width} onChange={handleWidthChange} />
              <span className="text-muted-foreground">×</span>
              <Input type="number" value={height} onChange={handleHeightChange} />
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                id="keep-aspect-ratio"
                checked={keepAspectRatio}
                onChange={(e) => setKeepAspectRatio(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="keep-aspect-ratio">Keep Aspect Ratio</Label>
            </div>
          </div>

          {/* Color Mode */}
          <div className="grid gap-2">
            <Label htmlFor="color-mode">Color Mode</Label>
            <Select
              value={colorMode}
              onValueChange={(v) => setColorMode(v as EditState['colorMode'])}
            >
              <SelectTrigger id="color-mode">
                <SelectValue placeholder="Select color mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RGB">RGB (Standard)</SelectItem>
                <SelectItem value="Grayscale">Grayscale</SelectItem>
                <SelectItem value="CMYK">CMYK (Print Simulation - Stub)</SelectItem>
              </SelectContent>
            </Select>
            {colorMode === 'CMYK' && (
              <p className="text-xs text-orange-500 mt-1">
                CMYK mode is a visual simulation using CSS filters and may not accurately represent final print output.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={!currentDimensions}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};