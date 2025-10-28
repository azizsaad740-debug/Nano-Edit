import Sidebar from "@/components/layout/Sidebar";
import { Workspace } from "@/components/editor/Workspace"; // FIX 71: Named import
import {
  // ...
} from "@/components/ui/dialog";
import GlobalAdjustmentsPanel from "@/components/editor/GlobalAdjustmentsPanel";
import { useEditorState } from "@/hooks/useEditorState"; // FIX 72: Named import
import { usePresets } from "@/hooks/usePresets";
// ...