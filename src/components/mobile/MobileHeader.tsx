"use client";

import * as React from "react";
import { Upload, Settings, ChevronDown, FilePlus, FolderOpen, Save, Download, FilePlus2, ClipboardPaste, RotateCcw, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/integrations/supabase/session-provider";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "@/utils/toast";
import { useTheme } from "../layout/ThemeProvider"; // Import useTheme

interface MobileHeaderProps {
  hasImage: boolean;
  onNewProjectClick: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onExportClick: () => void;
  onReset: () => void;
  onSettingsClick: () => void;
  onImportClick: () => void;
  onNewFromClipboard: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  hasImage,
  onNewProjectClick,
  onOpenProject,
  onSaveProject,
  onExportClick,
  onReset,
  onSettingsClick,
  onImportClick,
  onNewFromClipboard,
}) => {
  const { isGuest, setIsGuest } = useSession();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

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
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="flex items-center justify-between h-12 px-4 bg-background border-b border-border/50 shrink-0">
      <h1 className="text-xl font-bold text-foreground">NanoEdit</h1>
      <div className="flex items-center gap-2">
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <ChevronDown className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onNewProjectClick}>
              <FilePlus className="h-4 w-4 mr-2" />
              New Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenProject}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Open Image/Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNewFromClipboard}>
              <ClipboardPaste className="h-4 w-4 mr-2" />
              New from Clipboard (Stub)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSaveProject} disabled={!hasImage || isGuest}>
              <Save className="h-4 w-4 mr-2" />
              Save Project (.nanoedit) (Stub)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportClick} disabled={!hasImage}>
              <Download className="h-4 w-4 mr-2" />
              Export Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onImportClick}>
              <FilePlus2 className="h-4 w-4 mr-2" />
              Import Preset / LUT
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onReset} disabled={!hasImage}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All Edits
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSettingsClick}>
              <Settings className="h-4 w-4 mr-2" />
              AI Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme}>
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 mr-2" />
              ) : (
                <Moon className="h-4 w-4 mr-2" />
              )}
              Toggle Theme ({theme === 'dark' ? 'Light' : 'Dark'})
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              {isGuest ? "End Guest Session" : "Log Out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
      </div>
    </header>
  );
};