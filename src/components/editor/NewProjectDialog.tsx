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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArrowRightLeft } from "lucide-react";

export interface NewProjectSettings {
  width: number;
  height: number;
  dpi: number;
  backgroundColor: string;
}

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewProject: (settings: NewProjectSettings) => void;
}

const presets = [
  { name: "A4", width: 2480, height: 3508 },
  { name: "US Letter", width: 2550, height: 3300 },
  { name: "HD (16:9)", width: 1920, height: 1080 },
  { name: "Square", width: 1080, height: 1080 },
  { name: "Custom", width: 1920, height: 1080 },
];

export const NewProjectDialog = ({
  open,
  onOpenChange,
  onNewProject,
}: NewProjectDialogProps) => {
  const [width, setWidth] = React.useState(1920);
  const [height, setHeight] = React.useState(1080);
  const [dpi, setDpi] = React.useState(300);
  const [backgroundColor, setBackgroundColor] = React.useState("#FFFFFF");
  const [orientation, setOrientation] = React.useState<"portrait" | "landscape">("landscape");

  const handlePresetChange = (presetName: string) => {
    const preset = presets.find(p => p.name === presetName);
    if (preset) {
      const isLandscape = preset.width >= preset.height;
      setOrientation(isLandscape ? "landscape" : "portrait");
      setWidth(preset.width);
      setHeight(preset.height);
    }
  };

  const handleOrientationChange = (newOrientation: "portrait" | "landscape") => {
    if (newOrientation && newOrientation !== orientation) {
      setOrientation(newOrientation);
      if ((newOrientation === 'portrait' && width > height) || (newOrientation === 'landscape' && height > width)) {
        const oldWidth = width;
        setWidth(height);
        setHeight(oldWidth);
      }
    }
  };

  const handleCreate = () => {
    onNewProject({ width, height, dpi, backgroundColor });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Create a new blank canvas with custom settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="preset" className="text-right">Preset</Label>
            <Select onValueChange={handlePresetChange} defaultValue="Custom">
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent>
                {presets.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Dimensions</Label>
            <div className="col-span-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <Input type="number" value={width} onChange={e => setWidth(parseInt(e.target.value, 10) || 0)} />
              <span className="text-muted-foreground">×</span>
              <Input type="number" value={height} onChange={e => setHeight(parseInt(e.target.value, 10) || 0)} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Orientation</Label>
            <div className="col-span-3 flex items-center gap-2">
              <ToggleGroup type="single" value={orientation} onValueChange={handleOrientationChange}>
                <ToggleGroupItem value="portrait">Portrait</ToggleGroupItem>
                <ToggleGroupItem value="landscape">Landscape</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dpi" className="text-right">Resolution</Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input id="dpi" type="number" value={dpi} onChange={e => setDpi(parseInt(e.target.value, 10) || 72)} />
              <span className="text-sm text-muted-foreground">DPI</span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bg-color" className="text-right">Background</Label>
            <Input id="bg-color" type="color" className="p-1 h-10 w-12" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};