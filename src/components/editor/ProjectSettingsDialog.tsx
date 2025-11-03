import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import type { NewProjectSettings } from "@/types/editor";

interface ProjectSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectSettingsDialog = ({ isOpen, onClose }: ProjectSettingsDialogProps) => {
  const { dimensions, currentEditState, handleProjectSettingsUpdate } = useEditorLogic({});
  
  const [width, setWidth] = React.useState(dimensions?.width || 1920);
  const [height, setHeight] = React.useState(dimensions?.height || 1080);
  const [colorMode, setColorMode] = React.useState(currentEditState.colorMode || 'rgb');
  const [backgroundColor, setBackgroundColor] = React.useState('#FFFFFF');
  const [dpi, setDpi] = React.useState(72);

  React.useEffect(() => {
    if (dimensions) {
      setWidth(dimensions.width);
      setHeight(dimensions.height);
    }
    if (currentEditState.colorMode) {
      setColorMode(currentEditState.colorMode);
    }
  }, [dimensions, currentEditState.colorMode]);

  const handleSave = () => {
    handleProjectSettingsUpdate({
      width,
      height,
      colorMode,
      dpi,
      backgroundColor,
    });
    onClose();
  };
  
  const handleNewProject = () => {
    // Stub for creating a new project with current settings
    const newSettings: NewProjectSettings = {
      width,
      height,
      dpi,
      backgroundColor,
      colorMode: colorMode as NewProjectSettings['colorMode'],
    };
    // Assuming a function like handleNewProject exists in useEditorLogic
    // handleNewProject(newSettings);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="width" className="text-right">
              Width (px)
            </Label>
            <Input
              id="width"
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="height" className="text-right">
              Height (px)
            </Label>
            <Input
              id="height"
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dpi" className="text-right">
              DPI
            </Label>
            <Input
              id="dpi"
              type="number"
              value={dpi}
              onChange={(e) => setDpi(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="colorMode" className="text-right">
              Color Mode
            </Label>
            <Select value={colorMode} onValueChange={(value) => setColorMode(value as 'rgb' | 'grayscale' | 'cmyk')}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Color Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rgb">RGB Color</SelectItem>
                <SelectItem value="grayscale">Grayscale</SelectItem>
                <SelectItem value="cmyk">CMYK Color</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="backgroundColor" className="text-right">
              Background
            </Label>
            <Input
              id="backgroundColor"
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="col-span-3 h-10"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {/* Only show Save button if project is already loaded */}
          {dimensions && (
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          )}
          {/* Show New Project button if no project is loaded or if user wants to create a new one */}
          {!dimensions && (
            <Button onClick={handleNewProject}>
              Create New Project
            </Button>
          )}
          {/* Example of conditional rendering based on color mode */}
          {colorMode === 'cmyk' && ( // Fix TS2367: Changed 'CMYK' to 'cmyk'
            <p className="text-sm text-yellow-500">CMYK mode selected. Colors may appear different on screen.</p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};