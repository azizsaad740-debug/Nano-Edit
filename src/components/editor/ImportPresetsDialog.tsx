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
import { showSuccess, showError } from "@/utils/toast";

interface ImportPresetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportPresetsDialog = ({
  open,
  onOpenChange,
}: ImportPresetsDialogProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["xmp", "cube"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowed.includes(ext)) {
      showError("Unsupported file type. Please select an .xmp or .cube file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      // In a real implementation you would parse the preset/LUT and apply it.
      // Here we just acknowledge the import.
      showSuccess(`Preset "${file.name}" imported (stub).`);
      onOpenChange(false);
    };
    reader.onerror = () => {
      showError("Failed to read the preset file.");
    };
    reader.readAsText(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Preset / LUT</DialogTitle>
          <DialogDescription>
            Select an Adobe Lightroom .xmp preset or a .cube LUT file to import. (Currently a stub – the file is read and a toast is shown.)
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex justify-center">
          <Button onClick={triggerFileSelect}>Choose File</Button>
          <input
            type="file"
            accept=".xmp,.cube"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};