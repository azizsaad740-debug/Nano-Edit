"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { Layer } from "@/hooks/useEditorState";

interface EditTextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layer: Layer | null;
  onSave: (id: string, updates: Partial<Layer>) => void;
}

export const EditTextDialog = ({
  open,
  onOpenChange,
  layer,
  onSave,
}: EditTextDialogProps) => {
  const [content, setContent] = React.useState("");
  const [fontSize, setFontSize] = React.useState(48);
  const [color, setColor] = React.useState("#FFFFFF");

  React.useEffect(() => {
    if (layer) {
      setContent(layer.content || "");
      setFontSize(layer.fontSize || 48);
      setColor(layer.color || "#FFFFFF");
    }
  }, [layer]);

  const handleSave = () => {
    if (layer) {
      onSave(layer.id, { content, fontSize, color });
      onOpenChange(false);
    }
  };

  if (!layer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Text Layer</DialogTitle>
          <DialogDescription>
            Modify the content, size, and color of your text.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="content" className="text-right">
              Text
            </Label>
            <Input
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="font-size" className="text-right">
              Size
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Slider
                id="font-size"
                min={8}
                max={256}
                step={1}
                value={[fontSize]}
                onValueChange={([v]) => setFontSize(v)}
              />
              <span className="w-12 text-right text-sm text-muted-foreground">{fontSize}px</span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Color
            </Label>
            <Input
              id="color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="col-span-3 p-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};