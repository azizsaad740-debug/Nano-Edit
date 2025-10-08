"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";
import ReactCrop, { type Crop } from 'react-image-crop';

interface WorkspaceProps {
  image: string | null;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  effects: {
    blur: number;
    hueShift: number;
  };
  selectedFilter: string;
  transforms: {
    rotation: number;
    scaleX: number;
    scaleY: number;
  };
  crop: Crop | undefined;
  onCropChange: (crop: Crop) => void;
  onCropComplete: (crop: Crop) => void;
  aspect: number | undefined;
  imgRef: React.RefObject<HTMLImageElement>;
}

const Workspace = (props: WorkspaceProps) => {
  const { 
    image, onImageUpload, adjustments, effects, selectedFilter, transforms,
    crop, onCropChange, onCropComplete, aspect, imgRef
  } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const imageStyle = {
    filter: `${selectedFilter} brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) blur(${effects.blur}px) hue-rotate(${effects.hueShift}deg)`,
    transform: `rotate(${transforms.rotation}deg) scale(${transforms.scaleX}, ${transforms.scaleY})`,
  };

  return (
    <div className="flex items-center justify-center h-full w-full bg-muted/20 rounded-lg">
      {image ? (
        <div className="relative max-w-full max-h-full p-4">
          <ReactCrop
            crop={crop}
            onChange={c => onCropChange(c)}
            onComplete={c => onCropComplete(c)}
            aspect={aspect}
          >
            <img
              ref={imgRef}
              src={image}
              alt="Uploaded preview"
              className="object-contain max-w-full max-h-[calc(100vh-12rem)] rounded-lg shadow-lg"
              style={imageStyle}
            />
          </ReactCrop>
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