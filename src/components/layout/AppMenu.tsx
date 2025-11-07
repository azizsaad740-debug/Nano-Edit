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
import { Menu, Settings, Image, Save, FolderOpen, FileText, ChevronDown, Layers as LayersIcon, History as HistoryIcon } from "lucide-react";
import { useToolInteraction } from '@/hooks/useToolInteraction';
import { useLayerManager } from '@/hooks/useLayerManager';
import { useHistoryManager } from '@/hooks/useHistoryManager';
import { useSettings } from '@/hooks/useSettings';
import { usePresetManager } from '@/hooks/usePresetManager';

const AppMenu: React.FC = () => {
  const { openFile, saveFile } = useToolInteraction();
  const { toggleLayerPanel } = useLayerManager();
  const { toggleHistoryPanel } = useHistoryManager();
  const { toggleSettingsPanel } = useSettings();
  const { togglePresetManager } = usePresetManager();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <Menu className="h-4 w-4" />
          Menu
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {/* File Menu Options */}
        <DropdownMenuItem onClick={openFile}>
          <FolderOpen className="mr-2 h-4 w-4" />
          <span>Open...</span>
          <span className="ml-auto text-xs opacity-60">Ctrl+O</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={saveFile}>
          <Save className="mr-2 h-4 w-4" />
          <span>Save</span>
          <span className="ml-auto text-xs opacity-60">Ctrl+S</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <FileText className="mr-2 h-4 w-4" />
          <span>Export...</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Window/Panel Options */}
        <DropdownMenuItem onClick={toggleLayerPanel}>
          <LayersIcon className="mr-2 h-4 w-4" />
          <span>Layers Panel</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleHistoryPanel}>
          <HistoryIcon className="mr-2 h-4 w-4" />
          <span>History Panel</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={togglePresetManager}>
          <Image className="mr-2 h-4 w-4" />
          <span>Preset Manager</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        
        {/* Settings */}
        <DropdownMenuItem onClick={toggleSettingsPanel}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AppMenu;