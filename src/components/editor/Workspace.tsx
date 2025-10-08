"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, Check, X } from "lucide-react";
import ReactCrop, { type Crop } from "react-image-crop";
import { cn } from "@/lib/utils";
import SampleImages from "./SampleImages";
import UrlUploader from "./UrlUploader";
import { getFilterString } from "@/utils/filterUtils";
import { TextLayer } from "./TextLayer";
import type { Layer } from "@/hooks/useEditorState";

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
  pendingCrop: Crop | undefined;
  onCropChange: (crop: Crop | undefined) => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  aspect: number | undefined;
  imgRef: React.RefObject<HTMLImageElement>;
  isPreviewingOriginal: boolean;
  activeTool?: "lasso" | "brush" | "text" | null;
  layers: Layer[];
  onAddTextLayer: (coords: { x: number; y: number }) => void;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerCommit: (id: string) => void;
  selectedLayerId: string | null;
}

const Workspace = (props: WorkspaceProps) => {
  const {
    image,
    onFileSelect,
    onSampleSelect,
    onUrlSelect,
    onImageLoad,
    adjustments,
    effects,
    grading,
    selectedFilter,
    transforms,
    crop,
    pendingCrop,
    onCropChange,
    onApplyCrop,
    onCancelCrop,
    aspect,
    imgRef,
    isPreviewingOriginal,
    activeTool,
    layers,
    onAddTextLayer,
    onLayerUpdate,
    onLayerCommit,
    selectedLayerId,
  } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
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

  const handleWorkspaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'text' && imageContainerRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onAddTextLayer({ x, y });
    }
  };

  const imageFilterStyle = isPreviewingOriginal
    ? {}
    : {
        filter: getFilterString({
          adjustments,
          effects,
          grading,
          selectedFilter,
        }),
      };

  const wrapperTransformStyle = isPreviewingOriginal
    ? {}
    : {
        transform: `rotate(${transforms.rotation}deg) scale(${transforms.scaleX}, ${transforms.scaleY})`,
      };

  const lassoOverlay = activeTool === "lasso" && (
    <div className="absolute inset-0 border-2 border-dashed border-primary/60 pointer-events-none" />
  );

  const brushOverlay =
    activeTool === "brush" && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-24 h-24 border-2 border-dashed border-green-500 rounded-full opacity-50" />
      </div>
    );

  return (
    <div
      className={cn(
        "flex items-center justify-center h-full w-full bg-muted/20 rounded-lg relative transition-all",
        isDragging && "border-2 border-dashed border-primary ring-4 ring-primary/20",
        activeTool === 'text' && 'cursor-crosshair'
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleWorkspaceClick}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 flex flex-col items-center justify-center pointer-events-none z-10 rounded-lg">
          <UploadCloud className="h-16 w-16 text-primary" />
          <p className="mt-2 text-lg font-semibold text-primary">Drop image to upload</p>
        </div>
      )}
      {image ? (
        <div className="relative max-w-full max-h-full p-4">
          {pendingCrop && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              <Button size="sm" onClick={onApplyCrop}><Check className="h-4 w-4 mr-2" /> Apply Crop</Button>
              <Button size="sm" variant="destructive" onClick={onCancelCrop}><X className="h-4 w-4 mr-2" /> Cancel</Button>
            </div>
          )}
          <ReactCrop
            crop={pendingCrop ?? crop}
            onChange={(_, percentCrop) => onCropChange(percentCrop)}
            aspect={aspect}
          >
            <div style={wrapperTransformStyle}>
              <div ref={imageContainerRef} className="relative">
                <img
                  ref={imgRef}
                  src={image}
                  alt="Uploaded preview"
                  className="object-contain max-w-full max-h-[calc(100vh-12rem)] rounded-lg shadow-lg"
                  style={imageFilterStyle}
                  onLoad={onImageLoad}
                />
                {lassoOverlay}
                {brushOverlay}
                {!isPreviewingOriginal && effects.vignette > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none rounded-lg"
                    style={{
                      boxShadow: `inset 0 0 ${effects.vignette * 2.5}px rgba(0,0,0,${effects.vignette / 100})`,
                    }}
                  />
                )}
                {layers.map((layer) => (
                  <TextLayer
                    key={layer.id}
                    layer={layer}
                    containerRef={imageContainerRef}
                    onUpdate={onLayerUpdate}
                    onCommit={onLayerCommit}
                    isSelected={layer.id === selectedLayerId}
                  />
                ))}
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
                Drag &amp; drop, paste from clipboard, or click the button to upload an image.
              </p>
              <Button onClick={triggerFileInput}>Select Image</Button>
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