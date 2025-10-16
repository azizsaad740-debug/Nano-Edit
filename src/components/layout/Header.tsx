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
  Maximize, // Import Maximize icon for fullscreen
  Minimize, // Import Minimize icon for fullscreen
  LogOut, // Import LogOut icon
  Cloud, // Import Cloud icon for sync
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
import { useSession } from "@/integrations/supabase/session-provider";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "@/utils/toast";

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
  onToggleFullscreen: () => void; // New prop for fullscreen
  isFullscreen: boolean; // New prop to indicate fullscreen state
  onSyncProject: () => void; // New prop for sync
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
  onToggleFullscreen, // Destructure new prop
  isFullscreen, // Destructure new prop
  onSyncProject, // Destructure new prop
}: HeaderProps) => {
  const { user, isGuest, setIsGuest } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (isGuest) {
      setIsGuest(false);
      localStorage.removeItem('nanoedit-is-guest');
      showSuccess("Logged out of guest session.");
      navigate('/login', { replace: true });
      return;
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      showError("Failed to log out.");
    } else {
      showSuccess("Logged out successfully.");
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b shrink-0">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold">NanoEdit</h1>
        {(user || isGuest) && (
          <span className="text-xs text-muted-foreground ml-2">
            {isGuest ? "(Guest Mode)" : `(User: ${user?.email || 'Authenticated'})`}
          </span>
        )}
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

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onToggleFullscreen}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onSyncProject} disabled={!hasImage}>
              <Cloud className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sync Project to Google Drive (Stub)</p>
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
        
        {(user || isGuest) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </header>
  );
};

export default Header;