"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, Download, Copy, Settings, Eye, Trash2, Zap, Image, Menu, Layers as LayersIcon, History as HistoryIcon } from 'lucide-react';
import { useToolInteraction } from '@/hooks/useToolInteraction';
import { useHistoryManager } from '../hooks/useHistoryManager';
import { useSettings } from '../hooks/useSettings';
import { useLayerManager } from '../hooks/useLayerManager';
import { usePresetManager } from '../hooks/usePresetManager';
import { useSmartObjectEditor } from '../hooks/useSmartObjectEditor';
import { useEditorState } from '../hooks/useEditorState';

interface EditorHeaderProps {
  onReset: () => void;
  onDownloadClick: () => void;
  onCopy: () => void;
  hasImage: boolean;
  onTogglePreview: (isPreviewing: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isGenerating: boolean;
  isPreviewing: boolean;
  isProxyMode: boolean;
  toggleProxyMode: () => void;
  toggleSmartObjectEditor: () => void;
  togglePresetManager: () => void;
  toggleSettingsPanel: () => void;
  toggleLayerPanel: () => void;
  toggleHistoryPanel: () => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
  onReset,
  onDownloadClick,
  onCopy,
  hasImage,
  onTogglePreview,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isGenerating,
  isPreviewing,
  isProxyMode,
  toggleProxyMode,
  toggleSmartObjectEditor,
  togglePresetManager,
  toggleSettingsPanel,
  toggleLayerPanel,
  toggleHistoryPanel,
}) => {
  const { resetAllEdits } = useEditorState();
  
  // Fix: Ensure relative imports for hooks
  const { undo, redo, isHistoryPanelOpen, toggleHistoryPanel: toggleHistory } = useHistoryManager();
  const { toggleSettingsPanel: toggleSettings } = useSettings();
  const { toggleLayerPanel: toggleLayers } = useLayerManager();
  const { togglePresetManager: togglePresets } = usePresetManager();
  const { toggleSmartObjectEditor: toggleSmartEditor } = useSmartObjectEditor();
  const { openFile, saveFile } = useToolInteraction();

  return (
    <div className="flex items-center justify-between h-10 px-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center space-x-2">
        {/* File/Menu actions */}
        <Button variant="ghost" size="sm" onClick={openFile} title="Open File (Ctrl+O)">
          <Menu className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={saveFile} title="Save File (Ctrl+S)">
          <Download className="h-4 w-4" />
        </Button>
        
        {/* Undo/Redo */}
        <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo} title="Undo">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo} title="Redo">
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        {/* Editor specific tools */}
        <Button 
          variant={isProxyMode ? "default" : "ghost"} 
          size="sm" 
          onClick={toggleProxyMode} 
          title="Toggle Proxy Mode"
        >
          <Zap className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleSmartEditor} 
          title="Smart Object Editor"
        >
          <Image className="h-4 w-4" />
        </Button>

        {/* Panel Toggles */}
        <Button variant="ghost" size="sm" onClick={toggleLayers} title="Layers Panel">
          <LayersIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleHistory} title="History Panel">
          <HistoryIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={togglePresets} title="Preset Manager">
          <Image className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleSettings} title="Settings">
          <Settings className="h-4 w-4" />
        </Button>

        {/* Reset/Preview */}
        <Button variant="ghost" size="sm" onClick={onReset} title="Reset All Edits">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button 
          variant={isPreviewing ? "default" : "ghost"} 
          size="sm" 
          onClick={() => onTogglePreview(!isPreviewing)} 
          title="Toggle Preview"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default EditorHeader;