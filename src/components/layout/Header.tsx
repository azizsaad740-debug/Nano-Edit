import {
  Image as ImageIcon,
  RotateCcw,
  Download,
  Eye,
  Copy,
  Undo2,
  Redo2,
  Settings,
  FilePlus2,
  Sparkles,
  FilePlus,
  Save,
  FolderOpen,
  ChevronDown,
  ClipboardPaste,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { ThemeToggle } from "./ThemeToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onReset: () => void;
  onDownloadClick: () => void;
  onCopy: () => void;
  hasImage: boolean;
  onTogglePreview: (isPreviewing: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  children?: React.ReactNode;
  // Dialog controls
  setOpenSettings: (open: boolean) => void;
  setOpenImport: (open: boolean) => void;
  onGenerateClick: () => void;
  onNewProjectClick: () => void;
  onNewFromClipboard: () => void;
  onSaveProject: () => void;
  onOpenProject: () => void;
}

const Header = ({
  onReset,
  onDownloadClick,
  onCopy,
  hasImage,
  onTogglePreview,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  children,
  setOpenSettings,
  setOpenImport,
  onGenerateClick,
  onNewProjectClick,
  onNewFromClipboard,
  onSaveProject,
  onOpenProject,
}: HeaderProps) => {
  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b shrink-0">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold">NanoEdit</h1>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              File
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onNewProjectClick}>
              <FilePlus className="h-4 w-4 mr-2" />
              New Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNewFromClipboard}>
              <ClipboardPaste className="h-4 w-4 mr-2" />
              New from Clipboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenProject}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Open Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSaveProject} disabled={!hasImage}>
              <Save className="h-4 w-4 mr-2" />
              Save Project
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setOpenImport(true)}>
              <FilePlus2 className="h-4 w-4 mr-2" />
              Import Preset/LUT
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Edit
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onUndo} disabled={!canUndo}>
              <Undo2 className="h-4 w-4 mr-2" />
              Undo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRedo} disabled={!canRedo}>
              <Redo2 className="h-4 w-4 mr-2" />
              Redo
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onReset} disabled={!hasImage}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled={!hasImage}
              onMouseDown={() => onTogglePreview(true)}
              onMouseUp={() => onTogglePreview(false)}
              onMouseLeave={() => onTogglePreview(false)}
              onTouchStart={() => onTogglePreview(true)}
              onTouchEnd={() => onTogglePreview(false)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Hold to see original image</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onGenerateClick}>
              <Sparkles className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate Image</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => setOpenSettings(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Settings</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" disabled={!hasImage}>
              Export
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDownloadClick}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;