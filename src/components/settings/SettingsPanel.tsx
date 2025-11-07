"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSettings } from "@/hooks/useSettings";
import { Settings } from "lucide-react";

export const SettingsPanel: React.FC = () => {
  const { isSettingsPanelOpen, toggleSettingsPanel } = useSettings();

  return (
    <Dialog open={isSettingsPanelOpen} onOpenChange={toggleSettingsPanel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" /> AI Settings (Modal Stub)
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 text-muted-foreground">
          This is a modal view of the Settings Panel.
        </div>
      </DialogContent>
    </Dialog>
  );
};