"use client";

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ImageIcon,
  ChevronDown,
  FolderOpen,
  Save,
  Layers as LayersIcon,
  History as HistoryIcon,
  Settings,
  Image,
  Menu,
} from "lucide-react";
import { useToolInteraction } from '@/hooks/useToolInteraction';
import { useLayerManager } from '@/hooks/useLayerManager';
import { useHistoryManager } from '@/hooks/useHistoryManager';
import { useSettings } from '@/hooks/useSettings';
import { usePresetManager } from '@/hooks/usePresetManager';
import AppMenu from './AppMenu'; // Import the new menu component

const Header: React.FC = () => {
  const { undo, redo } = useHistoryManager();
  const { toggleSettingsPanel } = useSettings();
  // Note: The following toggles are not strictly needed here anymore since they are in AppMenu, 
  // but keeping the imports for consistency if they were used elsewhere in the original file logic.
  const { toggleLayerPanel } = useLayerManager();
  const { toggleHistoryPanel } = useHistoryManager();
  const { togglePresetManager } = usePresetManager();
  const { openFile, saveFile } = useToolInteraction();

  return (
    <header className="flex items-center justify-between h-10 px-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center space-x-2">
        {/* Replaced 'File' dropdown with App Name/Logo */}
        <div className="flex items-center space-x-1 font-semibold text-sm text-primary">
          <ImageIcon className="h-4 w-4" />
          <span>Smart Editor</span>
        </div>
        
        {/* New centralized App Menu */}
        <AppMenu />

        {/* Removed old 'File' dropdown */}
        
        {/* Removed old 'Windows' dropdown */}
      </div>

      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={undo}
          className="text-xs"
        >
          Undo
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={redo}
          className="text-xs"
        >
          Redo
        </Button>
        
        {/* Quick access to Settings */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleSettingsPanel}
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default Header;