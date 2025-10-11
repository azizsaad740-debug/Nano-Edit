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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showLoading, showSuccess, showError, dismissToast } from "@/utils/toast";
import { generativeFillApi } from "@/utils/aiImageGenerator"; // Import the simulated API

interface GenerativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (resultUrl: string) => void;
  apiKey: string;
  originalImage: string | null; // Added originalImage prop
  selectionPath: Point[] | null; // Added selectionPath prop
}

interface Point { // Define Point interface here or import from a common type file
  x: number;
  y: number;
}

export const GenerativeDialog = ({
  open,
  onOpenChange,
  onApply,
  apiKey,
  originalImage, // Destructure originalImage
  selectionPath, // Destructure selectionPath
}: GenerativeDialogProps) => {
  const [prompt, setPrompt] = React.useState("");
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const handleGenerate = async () => {
    if (!apiKey) {
      showError("Please set your API key in Settings first.");
      return;
    }
    if (!prompt.trim()) {
      showError("Prompt cannot be empty.");
      return;
    }
    if (!originalImage || !selectionPath || selectionPath.length < 2) {
      showError("A selection is required for generative fill.");
      return;
    }

    const toastId = showLoading("Generating…");
    try {
      // Call the simulated generative fill API
      const generatedResultUrl = await generativeFillApi(prompt.trim());
      
      const img = new Image();
      img.onload = () => {
        setPreviewUrl(generatedResultUrl);
        // Simulate a short delay before applying
        setTimeout(() => {
          onApply(generatedResultUrl);
          dismissToast(toastId);
          showSuccess("Generated image ready.");
          setPreviewUrl(null);
          onOpenChange(false);
        }, 500);
      };
      img.onerror = () => {
        dismissToast(toastId);
        showError("Failed to load generated image preview.");
      };
      img.src = generatedResultUrl;

    } catch (e) {
      console.error(e);
      dismissToast(toastId);
      showError("Generation failed.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generative Fill</DialogTitle>
          <DialogDescription>
            Describe what you want to add or replace in the selected area.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="e.g. Add a blue sky"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          {previewUrl && (
            <div className="mt-2 flex justify-center">
              <img src={previewUrl} alt="Generated preview" className="max-w-full max-h-48 rounded-md shadow" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleGenerate}>Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};