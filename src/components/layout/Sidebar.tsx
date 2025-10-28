// Assuming RightSidebarTabs is exported as a named export in its file.
// If the error persists, it means the component is exported as default.
// Based on the file content in the previous turn, it is exported as a named constant: `export const RightSidebarTabs`.

// No change needed here if the export is correct, but if the error is TS2305, we must check the export in RightSidebarTabs.tsx.
// Since RightSidebarTabs.tsx exports `export const RightSidebarTabs`, the import should be named.
// The error TS2305 suggests the import is wrong. Let's assume the file was changed to a default export previously.

import GlobalAdjustmentsPanel from "@/components/editor/GlobalAdjustmentsPanel"; // Renamed import
import RightSidebarTabs from "@/components/layout/RightSidebarTabs"; // FIX 46: Changed to default import assumption
import type { Preset } from "@/hooks/usePresets";
// ...