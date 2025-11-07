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
import type { Point } from "@/types/editor";

interface GenerativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (resultUrl: string, maskDataUrl: string | null) => void; // Updated signature
  apiKey: string;
  originalImage: string | null;
  selectionPath: Point[] | null;
  selectionMaskDataUrl: string | null; // New prop
  imageNaturalDimensions: { width: number; height: number } | null; // New prop
  isGuest: boolean; // NEW
}

export const GenerativeDialog = ({
  open,
  onOpenChange,
  onApply,
  apiKey,
  originalImage,
  selectionPath,
  selectionMaskDataUrl, // Destructure new prop
  imageNaturalDimensions, // Destructure new prop
  isGuest, // DESTRUCTURED
}: GenerativeDialogProps) => {
  const [prompt, setPrompt] = React.useState("");
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const handleGenerate = async () => {
    if (isGuest) {
      showError("Please sign in to use generative AI.");
      return;
    }
    if (!apiKey) {
      showError("Please set your API key in Settings first.");
      return;
    }
    if (!prompt.trim()) {
      showError("Prompt cannot be empty.");
      return;
    }
    if (!originalImage || !imageNaturalDimensions) {
      showError("An image must be loaded to use generative fill.");
      return;
    }
    if (!selectionPath && !selectionMaskDataUrl) {
      showError("A selection is required for generative fill.");
      return;
    }

    const toastId = showLoading("Generating…");
    try {
      // Call the simulated generative fill API
      const generatedResultUrl = await generativeFillApi(prompt.trim());
      
      const img = new Image();
      img.onload = async () => {
        setPreviewUrl(generatedResultUrl);

        // Determine the mask to use: prioritize selectionMaskDataUrl, then create from selectionPath
        let finalMaskDataUrl = selectionMaskDataUrl;
        if (!finalMaskDataUrl && selectionPath && selectionPath.length > 1) {
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = imageNaturalDimensions.width;
          maskCanvas.height = imageNaturalDimensions.height;
          const maskCtx = maskCanvas.getContext('2d');
          if (maskCtx) {
            maskCtx.fillStyle = 'white';
            maskCtx.beginPath();
            maskCtx.moveTo(selectionPath[0].x, selectionPath[0].y);
            for (let i = 1; i < selectionPath.length; i++) {
              maskCtx.lineTo(selectionPath[i].x, selectionPath[i].y);
            }
            maskCtx.closePath();
            maskCtx.fill();
            // Apply a default feathering if mask was generated from path
            const featherRadius = 20; 
            maskCtx.filter = `blur(${featherRadius}px)`;
            maskCtx.drawImage(maskCanvas, 0, 0);
            finalMaskDataUrl = maskCanvas.toDataURL();
          }
        }

        // Simulate a short delay before applying
        setTimeout(() => {
          onApply(generatedResultUrl, finalMaskDataUrl); // Pass the final mask
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
          <Button onClick={handleGenerate} disabled={isGuest}>Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};