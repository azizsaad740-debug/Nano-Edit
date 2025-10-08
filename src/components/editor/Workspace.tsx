"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";
import ReactCrop, { type Crop } from 'react-image-crop';
import { cn } from "@/lib/utils";

interface WorkspaceProps {
  image: string | null;
  onFileSelect: (file: File | undefined) => void;
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
  isPreviewingOriginal: boolean;
}

const Workspace = (props: WorkspaceProps) => {
  const { 
    image, onFileSelect, adjustments, effects, selectedFilter, transforms,
    crop, onCropChange, onCropComplete, aspect, imgRef, isPreviewingOriginal
  } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(event.target.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    onFileSelect(e.dataTransfer.files?.[0]);
  };

  const imageStyle = isPreviewingOriginal ? {} : {
    filter: `${selectedFilter} brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) blur(${effects.blur}px) hue-rotate(${effects.hueShift}deg)`,
    transform: `rotate(${transforms.rotation}deg) scale(${transforms.scaleX}, ${transforms.scaleY})`,
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-center h-full w-full bg-muted/20 rounded-lg relative transition-all",
        isDragging && "border-2 border-dashed border-primary ring-4 ring-primary/20"
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 flex flex-col items-center justify-center pointer-events-none z-10 rounded-lg">
          <UploadCloud className="h-16 w-16 text-primary" />
          <p className="mt-2 text-lg font-semibold text-primary">Drop image to upload</p>
        </div>
      )}
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
              Drag & drop, paste from clipboard, or click the button to upload an image.
            </p>
            <Button onClick={triggerFileInput}>
              Select Image
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
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