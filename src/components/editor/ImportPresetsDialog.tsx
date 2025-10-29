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

    const allowed = ["xmp", "cube", "json"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowed.includes(ext)) {
      showError("Unsupported file type. Please select an .xmp, .cube, or .json (Design Token) file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        if (ext === 'json') {
          // Simulate processing Figma Design Tokens
          const tokens = JSON.parse(content);
          console.log("Figma Design Tokens imported:", tokens);
          showSuccess(`Design Tokens from "${file.name}" imported and applied (stub).`);
        } else {
          // Preset/LUT import stub
          showSuccess(`Preset "${file.name}" imported (stub).`);
        }
        onOpenChange(false);
      } catch (error) {
        showError("Failed to parse the file content.");
      }
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
          <DialogTitle>Import Preset / Design Tokens</DialogTitle>
          <DialogDescription>
            Select an Adobe Lightroom .xmp preset, a .cube LUT file, or a Figma Design Token .json file to import.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex justify-center">
          <Button onClick={triggerFileSelect}>Choose File</Button>
          <input
            type="file"
            accept=".xmp,.cube,.json"
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