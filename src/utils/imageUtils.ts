import { type Crop } from 'react-image-crop';
import { showSuccess, showError } from "@/utils/toast";
import { EditState } from '@/hooks/useEditorState';

interface ImageOptions extends EditState {
  image: HTMLImageElement;
}

const getEditedImageCanvas = ({
  image,
  crop,
  adjustments,
  effects,
  grading,
  selectedFilter,
  transforms,
}: ImageOptions): HTMLCanvasElement | null => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

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

  ctx.filter = [
    selectedFilter,
    `brightness(${adjustments.brightness}%)`,
    `contrast(${adjustments.contrast}%)`,
    `saturate(${adjustments.saturation}%)`,
    `blur(${effects.blur}px)`,
    `hue-rotate(${effects.hueShift}deg)`,
    `grayscale(${grading.grayscale}%)`,
    `sepia(${grading.sepia}%)`,
    `invert(${grading.invert}%)`,
  ].join(' ');
  
  ctx.save();

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

  ctx.restore();

  if (effects.vignette > 0) {
    const outerRadius = Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2;
    const innerRadius = outerRadius * (1 - (effects.vignette / 100) * 1.2);

    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, innerRadius,
        canvas.width / 2, canvas.height / 2, outerRadius
    );
    
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${effects.vignette / 100 * 0.7})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  return canvas;
};

export const downloadImage = (options: ImageOptions, exportOptions: { format: string; quality: number; width: number; height: number }) => {
  const sourceCanvas = getEditedImageCanvas(options);
  if (!sourceCanvas) return;

  const { format, quality, width, height } = exportOptions;
  
  let finalCanvas = sourceCanvas;

  if (width > 0 && height > 0 && (width !== sourceCanvas.width || height !== sourceCanvas.height)) {
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = width;
    resizedCanvas.height = height;
    const ctx = resizedCanvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(sourceCanvas, 0, 0, width, height);
      finalCanvas = resizedCanvas;
    }
  }

  const mimeType = `image/${format}`;
  const fileExtension = format;

  const link = document.createElement('a');
  link.download = `edited-image.${fileExtension}`;
  link.href = finalCanvas.toDataURL(mimeType, quality);
  link.click();
  showSuccess("Image downloaded successfully.");
};

export const copyImageToClipboard = (options: ImageOptions) => {
  const canvas = getEditedImageCanvas(options);
  if (!canvas) return;

  canvas.toBlob(async (blob) => {
    if (blob) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        showSuccess("Image copied to clipboard.");
      } catch (err) {
        console.error("Failed to copy image: ", err);
        showError("Failed to copy image to clipboard.");
      }
    } else {
      showError("Failed to create image blob.");
    }
  }, 'image/png');
};