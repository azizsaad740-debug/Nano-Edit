"use client";

import * as React from "react";
import { Upload, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  onExportClick: () => void;
  onSettingsClick: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onExportClick, onSettingsClick }) => {
  return (
    <header className="flex items-center justify-between h-12 px-4 bg-background border-b border-border/50 shrink-0">
      <h1 className="text-xl font-bold text-foreground">NanoEdit</h1>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onSettingsClick}>
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onExportClick}>
          <Upload className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};