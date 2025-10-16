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

interface HeaderProps {
  onReset: () => void;
  onDownloadClick: () => void;
  onCopy: () => void;
// ... (rest of the file remains the same)