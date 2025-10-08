import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { showError } from "@/utils/toast";

interface UrlUploaderProps {
  onUrlSelect: (url: string) => void;
}

const UrlUploader = ({ onUrlSelect }: UrlUploaderProps) => {
  const [url, setUrl] = useState("");

  const handleLoad = () => {
    if (!url) {
      showError("Please enter a URL.");
      return;
    }
    try {
      new URL(url);
    } catch (_) {
      showError("Please enter a valid URL.");
      return;
    }
    onUrlSelect(url);
    setUrl("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleLoad();
    }
  };

  return (
    <div className="mt-6 text-center">
      <p className="text-sm text-muted-foreground mb-4">Or load from a URL</p>
      <div className="flex w-full items-center space-x-2">
        <div className="relative flex-grow">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />
        </div>
        <Button onClick={handleLoad}>Load</Button>
      </div>
    </div>
  );
};

export default UrlUploader;