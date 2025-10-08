"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";
import ReactCrop, { type Crop } from 'react-image-crop';
import { cn } from "@/lib/utils";
import SampleImages from "./SampleImages";
import UrlUploader from "./UrlUploader";

interface WorkspaceProps {
  image: string | null;
  onFileSelect: (file: File | undefined) => void;
  onSampleSelect: (url: string) => void;
  onUrlSelect: (url: string) => void;
  onImageLoad: () => void;
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  effects: {
    blur: number;
    hueShift: number;
    vignette: number;
  };
  grading: {
    grayscale: number;
    sepia: number;
    invert: number;
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
    image, onFileSelect, onSampleSelect, onUrlSelect, onImageLoad, adjustments, effects, grading, selectedFilter, transforms,
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

  const imageFilterStyle = isPreviewingOriginal ? {} : {
    filter: [
      selectedFilter,
      `brightness(${adjustments.brightness}%)`,
      `contrast(${adjustments.contrast}%)`,
      `saturate(${adjustments.saturation}%)`,
      `blur(${effects.blur}px)`,
      `hue-rotate(${effects.hueShift}deg)`,
      `grayscale(${grading.grayscale}%)`,
      `sepia(${grading.sepia}%)`,
      `invert(${grading.invert}%)`,
    ].join(' '),
  };

  const wrapperTransformStyle = isPreviewingOriginal ? {} : {
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
            <div style={wrapperTransformStyle}>
              <div className="relative">
                <img
                  ref={imgRef}
                  src={image}
                  alt="Uploaded preview"
                  className="object-contain max-w-full max-h-[calc(100vh-12rem)] rounded-lg shadow-lg"
                  style={imageFilterStyle}
                  onLoad={onImageLoad}
                />
                {!isPreviewingOriginal && effects.vignette > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none rounded-lg"
                    style={{
                      boxShadow: `inset 0 0 ${effects.vignette * 2.5}px rgba(0,0,0,${effects.vignette / 100})`
                    }}
                  />
                )}
              </div>
            </div>
          </ReactCrop>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <Card className="border-2 border-dashed">
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
          <UrlUploader onUrlSelect={onUrlSelect} />
          <SampleImages onSelect={onSampleSelect} />
        </div>
      )}
    </div>
  );
};

export default Workspace;