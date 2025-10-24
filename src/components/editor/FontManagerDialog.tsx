"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { UploadCloud, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FontManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  systemFonts: string[];
  setSystemFonts: (fonts: string[]) => void;
  customFonts: string[];
  setCustomFonts: (fonts: string[]) => void;
}

// List of common web-safe fonts to include if system scan fails
const WEBSAFE_FONTS = [
  "Arial", "Verdana", "Tahoma", "Trebuchet MS", "Georgia", "Times New Roman", "Courier New", "Lucida Console"
];

export const FontManagerDialog = ({
  open,
  onOpenChange,
  systemFonts,
  setSystemFonts,
  customFonts,
  setCustomFonts,
}: FontManagerDialogProps) => {
  const [isScanning, setIsScanning] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleScanSystemFonts = async () => {
    if (!('queryLocalFonts' in window)) {
      showError("System font scanning is not supported by your browser (requires experimental API access). Showing web-safe fonts instead.");
      setSystemFonts(WEBSAFE_FONTS);
      return;
    }

    setIsScanning(true);
    const toastId = showLoading("Scanning system fonts...");

    try {
      // @ts-ignore - Use experimental API
      const fonts = await window.queryLocalFonts();
      const uniqueFontNames = Array.from(new Set(fonts.map((f: any) => f.family))).sort() as string[];
      setSystemFonts(uniqueFontNames);
      showSuccess(`${uniqueFontNames.length} system fonts found.`);
    } catch (error) {
      console.error("Failed to scan system fonts:", error);
      showError("Permission denied or scanning failed. Showing web-safe fonts.");
      setSystemFonts(WEBSAFE_FONTS);
    } finally {
      dismissToast(toastId);
      setIsScanning(false);
    }
  };

  const handleCustomFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
    const fileName = file.name.toLowerCase();
    if (!allowedExtensions.some(ext => fileName.endsWith(ext))) {
      showError("Unsupported font file type. Please upload TTF, OTF, or WOFF files.");
      return;
    }

    const fontName = file.name.split('.').slice(0, -1).join('.');
    
    // --- STUB: In a real app, you would read the file and inject @font-face CSS ---
    
    if (!customFonts.includes(fontName)) {
        setCustomFonts([...customFonts, fontName]);
        showSuccess(`Custom font "${fontName}" added (Stub).`);
    } else {
        showError(`Font "${fontName}" is already listed.`);
    }
    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const allFonts = [...customFonts, ...systemFonts].sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Font Manager</DialogTitle>
          <DialogDescription>
            Manage system and custom fonts available for text layers.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0 space-y-4 py-4">
          {/* Custom Font Upload */}
          <div className="border p-3 rounded-md space-y-2">
            <h4 className="font-semibold">Custom Fonts</h4>
            <Button onClick={() => fileInputRef.current?.click()} className="w-full" variant="outline">
              <UploadCloud className="h-4 w-4 mr-2" /> Upload Font File (.ttf, .otf, .woff)
            </Button>
            <input
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              ref={fileInputRef}
              className="hidden"
              onChange={handleCustomFontUpload}
            />
            <div className="flex flex-wrap gap-2 pt-2">
                {customFonts.map(font => (
                    <span key={font} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full flex items-center">
                        {font}
                        {/* Add remove button if needed */}
                    </span>
                ))}
            </div>
          </div>

          {/* System Font Scan */}
          <div className="border p-3 rounded-md space-y-2">
            <h4 className="font-semibold">System Fonts</h4>
            <Button onClick={handleScanSystemFonts} className="w-full" disabled={isScanning}>
              <Search className={cn("h-4 w-4 mr-2", isScanning && "animate-spin")} />
              {isScanning ? "Scanning..." : "Scan Installed System Fonts"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Note: Requires browser permission and may not be supported on all platforms.
            </p>
          </div>

          {/* Font List */}
          <h4 className="font-semibold mt-4">Available Fonts ({allFonts.length})</h4>
          <ScrollArea className="flex-1 border rounded-md">
            <div className="p-2 space-y-1">
              {allFonts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No fonts loaded.</p>
              ) : (
                allFonts.map(font => (
                  <div key={font} className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-md">
                    <span className="text-sm" style={{ fontFamily: font }}>{font}</span>
                    {systemFonts.includes(font) && <Check className="h-4 w-4 text-green-500" />}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};