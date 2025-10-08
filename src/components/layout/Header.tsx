import { Image as ImageIcon, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onReset: () => void;
  onDownload: () => void;
  hasImage: boolean;
}

const Header = ({ onReset, onDownload, hasImage }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b shrink-0">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold">NanoEdit</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onReset} disabled={!hasImage}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
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