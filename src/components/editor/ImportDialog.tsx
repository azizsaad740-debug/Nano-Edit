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
import { UploadCloud, FolderOpen, FilePlus2 } from "lucide-react";
import type { TemplateProjectData } from "@/types/template";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadImage: (file: File) => void;
  onLoadProject: () => void; // Trigger function for project file input
  onLoadTemplate: (templateData: TemplateProjectData, templateName: string) => void; // Stub for template loading
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ open, onOpenChange, onLoadImage, onLoadProject, onLoadTemplate }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith(".nanoedit")) {
      // Project file loading is handled by onLoadImage which checks the extension
      onLoadImage(file);
    } else if (fileName.match(/\.(jpg|jpeg|png|webp|gif|bmp|tiff|psd)$/)) {
      // Image file
      onLoadImage(file);
    } else if (fileName.match(/\.(xmp|cube|json)$/)) {
      // Preset/LUT/Design Token file (Stub processing)
      showSuccess(`Preset file "${file.name}" imported (Stub).`);
    } else {
      showError("Unsupported file type. Please select an image, .nanoedit project, or preset file.");
    }
    
    onOpenChange(false);
    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const handleLoadProjectClick = () => {
    // This triggers the hidden file input in Index.tsx which is configured to handle .nanoedit files
    onLoadProject();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import / Open File</DialogTitle>
          <DialogDescription>
            Load an image, open a saved project, or import a preset file.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button variant="outline" className="w-full h-12" onClick={triggerFileSelect}>
            <UploadCloud className="h-5 w-5 mr-2" /> Load New Image
          </Button>
          
          <Button variant="outline" className="w-full h-12" onClick={handleLoadProjectClick}>
            <FolderOpen className="h-5 w-5 mr-2" /> Open NanoEdit Project (.nanoedit)
          </Button>
          
          <Button variant="outline" className="w-full h-12" onClick={triggerFileSelect}>
            <FilePlus2 className="h-5 w-5 mr-2" /> Import Preset / LUT (.xmp, .cube, .json)
          </Button>
          
          {/* Hidden file input for image/preset selection */}
          <input
            type="file"
            accept="image/*,.nanoedit,.xmp,.cube,.json"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};