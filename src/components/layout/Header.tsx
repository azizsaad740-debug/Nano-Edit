import { Image as ImageIcon, RotateCcw, Download, Eye, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onReset: () => void;
  onDownload: () => void;
  onCopy: () => void;
  hasImage: boolean;
  onTogglePreview: (isPreviewing: boolean) => void;
  children?: React.ReactNode;
}

const Header = ({ onReset, onDownload, onCopy, hasImage, onTogglePreview, children }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b shrink-0">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold">NanoEdit</h1>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <ThemeToggle />
        <Button
          variant="outline"
          size="sm"
          disabled={!hasImage}
          onMouseDown={() => onTogglePreview(true)}
          onMouseUp={() => onTogglePreview(false)}
          onMouseLeave={() => onTogglePreview(false)}
          onTouchStart={() => onTogglePreview(true)}
          onTouchEnd={() => onTogglePreview(false)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button variant="outline" size="sm" onClick={onReset} disabled={!hasImage}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button variant="outline" size="sm" onClick={onCopy} disabled={!hasImage}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
        <Button size="sm" onClick={onDownload} disabled={!hasImage}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </header>
  );
};

export default Header;