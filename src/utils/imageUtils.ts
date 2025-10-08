import { type Crop } from 'react-image-crop';
import { showSuccess } from "@/utils/toast";

interface DownloadImageOptions {
  image: HTMLImageElement;
  crop: Crop | undefined;
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
}

export const downloadImage = ({
  image,
  crop,
  adjustments,
  effects,
  selectedFilter,
  transforms,
}: DownloadImageOptions) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const pixelCrop = (crop && crop.width > 0)
    ? {
        x: crop.x * scaleX,
        y: crop.y * scaleY,
        width: crop.width * scaleX,
        height: crop.height * scaleY,
      }
    : {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight,
      };

  const { rotation } = transforms;
  const isSwapped = rotation === 90 || rotation === 270;
  canvas.width = isSwapped ? pixelCrop.height : pixelCrop.width;
  canvas.height = isSwapped ? pixelCrop.width : pixelCrop.height;

  ctx.filter = `${selectedFilter} brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) blur(${effects.blur}px) hue-rotate(${effects.hueShift}deg)`;
  
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(transforms.rotation * Math.PI / 180);
  ctx.scale(transforms.scaleX, transforms.scaleY);
  
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    -pixelCrop.width / 2,
    -pixelCrop.height / 2,
    pixelCrop.width,
    pixelCrop.height
  );

  const link = document.createElement('a');
  link.download = 'edited-image.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  showSuccess("Image downloaded successfully.");
};