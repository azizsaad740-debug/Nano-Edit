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
  LayoutGrid, // Import LayoutGrid icon
  Plus, // Import Plus icon for new tab
  X, // Import X icon for close tab
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
import { useNavigate, Link } from "react-router-dom"; // Import Link
import { showSuccess, showError } from "@/utils/toast"; // ADDED: Import toast utilities
import { cn } from "@/lib/utils";

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
  setOpenSettings: (open: boolean) => void;
  setOpenImport: (open: boolean) => void;
  onGenerateClick: () => void;
  onNewProjectClick: () => void;
  onNewFromClipboard: (importInSameProject: boolean) => void;
  onSaveProject: () => void;
  onOpenProject: (importInSameProject: boolean) => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onSyncProject: () => void;
  setOpenProjectSettings: (open: boolean) => void; // NEW prop
  // Multi-project props
  projects: { id: string; name: string }[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  createNewTab: (name?: string) => void;
  closeProject: (id: string) => void;
  children: React.ReactNode;
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
  setOpenSettings,
  setOpenImport,
  onGenerateClick,
  onNewProjectClick,
  onNewFromClipboard,
  onSaveProject,
  onOpenProject,
  onToggleFullscreen,
  isFullscreen,
  onSyncProject,
  setOpenProjectSettings, // NEW prop
  projects,
  activeProjectId,
  setActiveProjectId,
  createNewTab,
  closeProject,
  children,
}: HeaderProps) => {
  const [isHoveringPreview, setIsHoveringPreview] = React.useState(false);
  const navigate = useNavigate();
  const { user, isGuest, setIsGuest } = useSession();

  React.useEffect(() => {
    onTogglePreview(isHoveringPreview);
  }, [isHoveringPreview, onTogglePreview]);

  const handleLogout = async () => {
    if (isGuest) {
      setIsGuest(false);
      showSuccess("Guest session ended.");
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
    <header className="flex flex-col border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
      {/* Tab Bar */}
      <div className="flex items-center h-10 border-b px-2 overflow-x-auto overflow-y-hidden">
        {projects.map((project) => (
          <div
            key={project.id}
            className={cn(
              "flex items-center h-full px-3 text-sm cursor-pointer border-r border-border/50 transition-colors",
              project.id === activeProjectId
                ? "bg-accent text-accent-foreground font-medium"
                : "bg-background hover:bg-muted/50 text-muted-foreground"
            )}
            onClick={() => setActiveProjectId(project.id)}
          >
            <span className="truncate max-w-[150px]">{project.name}</span>
            {projects.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-2 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  closeProject(project.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-2 shrink-0"
          onClick={() => createNewTab()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Control Bar */}
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                File
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onNewProjectClick}>
                <FilePlus className="h-4 w-4 mr-2" />
                New Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onOpenProject(false)}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Open Image/Project in New Tab
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenProject(true)} disabled={!hasImage}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Import in Same Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNewFromClipboard(false)}>
                <ClipboardPaste className="h-4 w-4 mr-2" />
                New from Clipboard (New Tab)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNewFromClipboard(true)} disabled={!hasImage}>
                <ClipboardPaste className="h-4 w-4 mr-2" />
                Import from Clipboard (Same Project)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSaveProject} disabled={!hasImage}>
                <Save className="h-4 w-4 mr-2" />
                Save Project (.nanoedit)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onGenerateClick}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate New Image (New Tab)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpenImport(true)}>
                <FilePlus2 className="h-4 w-4 mr-2" />
                Import Preset / LUT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo}>
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Undo (Ctrl+Z)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo}>
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Redo (Ctrl+Y)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {children}

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onMouseDown={() => setIsHoveringPreview(true)}
                onMouseUp={() => setIsHoveringPreview(false)}
                onMouseLeave={() => setIsHoveringPreview(false)}
                disabled={!hasImage}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Preview Original</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onCopy} disabled={!hasImage}>
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy to Clipboard (Ctrl+C)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onDownloadClick} disabled={!hasImage}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export (Ctrl+S)</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onReset} disabled={!hasImage}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All Edits
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpenProjectSettings(true)} disabled={!hasImage}>
                <Settings className="h-4 w-4 mr-2" />
                Project Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpenSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                AI Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSyncProject} disabled={!hasImage}>
                <Cloud className="h-4 w-4 mr-2" />
                Sync to Cloud (Stub)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleFullscreen}>
                {isFullscreen ? (
                  <Minimize className="h-4 w-4 mr-2" />
                ) : (
                  <Maximize className="h-4 w-4 mr-2" />
                )}
                {isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/community')}>
                <LayoutGrid className="h-4 w-4 mr-2" />
                Community Templates
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                {isGuest ? "End Guest Session" : "Log Out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;