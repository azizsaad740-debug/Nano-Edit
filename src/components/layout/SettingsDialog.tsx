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
import { Label } from "@/components/ui/label";
import { useSettings } from "@/hooks/useSettings";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({
  open,
  onOpenChange,
}: SettingsDialogProps) => {
  const { geminiApiKey, stabilityApiKey, saveApiKey } = useSettings();
  const [tempGeminiKey, setTempGeminiKey] = React.useState(geminiApiKey);
  const [tempStabilityKey, setTempStabilityKey] = React.useState(stabilityApiKey);

  React.useEffect(() => {
    if (open) {
      setTempGeminiKey(geminiApiKey);
      setTempStabilityKey(stabilityApiKey);
    }
  }, [open, geminiApiKey, stabilityApiKey]);

  const handleSave = () => {
    saveApiKey(tempGeminiKey.trim(), 'gemini');
    saveApiKey(tempStabilityKey.trim(), 'stability');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Settings</DialogTitle>
          <DialogDescription>
            Configure API keys for generative features (Gemini) and image enhancement (Stability AI).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <h4 className="font-semibold">Gemini / Generative Fill API</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gemini-api-key" className="text-right">
                API Key
              </Label>
              <Input
                id="gemini-api-key"
                className="col-span-3"
                value={tempGeminiKey}
                onChange={(e) => setTempGeminiKey(e.target.value)}
                placeholder="Nano Banana API Key"
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <h4 className="font-semibold">Stability AI / Upscale API</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stability-api-key" className="text-right">
                API Key
              </Label>
              <Input
                id="stability-api-key"
                className="col-span-3"
                value={tempStabilityKey}
                onChange={(e) => setTempStabilityKey(e.target.value)}
                placeholder="Stability AI API Key (starts with sk-)"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};