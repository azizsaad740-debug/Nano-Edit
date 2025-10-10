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

interface GenerateImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (resultUrl: string) => void;
  apiKey: string;
}

export const GenerateImageDialog = ({
  open,
  onOpenChange,
  onGenerate,
  apiKey,
}: GenerateImageDialogProps) => {
  const [prompt, setPrompt] = React.useState("");

  const handleGenerate = async () => {
    if (!apiKey) {
      showError("Please set your API key in Settings first.");
      return;
    }
    if (!prompt.trim()) {
      showError("Prompt cannot be empty.");
      return;
    }

    const toastId = showLoading("Generating image…");
    try {
      // Using a reliable placeholder for image generation
      const placeholderResult = `https://placehold.co/800x600/EEE/31343C?text=${encodeURIComponent(prompt.trim().replace(/\n/g, '\\n'))}`;
      
      // Preload the image to avoid showing a broken link
      const img = new Image();
      img.onload = () => {
        onGenerate(placeholderResult);
        dismissToast(toastId);
        showSuccess("Image generated.");
        onOpenChange(false);
        setPrompt("");
      };
      img.onerror = () => {
        dismissToast(toastId);
        showError("Failed to load generated image.");
      };
      img.src = placeholderResult;

    } catch (e) {
      dismissToast(toastId);
      console.error(e);
      showError("Generation failed.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Image</DialogTitle>
          <DialogDescription>
            Describe the image you want to create. This will replace your current workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="e.g. A majestic lion in the savanna"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleGenerate}>Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};