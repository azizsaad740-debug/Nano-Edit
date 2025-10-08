"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";

interface WorkspaceProps {
  image: string | null;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  selectedFilter: string;
  transforms: {
    rotation: number;
    scaleX: number;
    scaleY: number;
  };
}

const Workspace = ({ image, onImageUpload, adjustments, selectedFilter, transforms }: WorkspaceProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const imageStyle = {
    filter: `${selectedFilter} brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`,
    transform: `rotate(${transforms.rotation}deg) scale(${transforms.scaleX}, ${transforms.scaleY})`,
  };

  return (
    <div className="flex items-center justify-center h-full w-full bg-muted/20 rounded-lg">
      {image ? (
        <div className="relative max-w-full max-h-full p-4">
          <img
            src={image}
            alt="Uploaded preview"
            className="object-contain max-w-full max-h-[calc(100vh-12rem)] rounded-lg shadow-lg transition-transform duration-300"
            style={imageStyle}
          />
        </div>
      ) : (
        <Card className="w-full max-w-md border-2 border-dashed">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <UploadCloud className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold">Upload an Image</h2>
            <p className="text-muted-foreground">
              Click the button below to select an image from your device to start editing.
            </p>
            <Button onClick={triggerFileInput}>
              Select Image
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImageUpload}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Workspace;