import type { Point } from "@/hooks/useEditorState";

/**
 * Converts a polygonal path into a binary mask data URL.
 * The polygon is drawn onto a canvas, and the resulting image data URL represents the mask.
 *
 * @param path An array of Points representing the polygonal path.
 * @param width The natural width of the image the mask applies to.
 * @param height The natural height of the image the mask applies to.
 * @returns A Promise that resolves to a data URL of the binary mask.
 */
export const polygonToMaskDataUrl = async (
  path: Point[],
  width: number,
  height: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (path.length < 2) {
      return resolve(''); // Return empty mask if path is too short
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error("Failed to get canvas context."));
    }

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.closePath();
    ctx.fill();

    resolve(canvas.toDataURL());
  });
};

/**
 * Inverts the colors of a binary mask data URL (white becomes black, black becomes white).
 *
 * @param maskDataUrl The data URL of the binary mask.
 * @param width The natural width of the image.
 * @param height The natural height of the image.
 * @returns A Promise that resolves to the data URL of the inverted mask.
 */
export const invertMaskDataUrl = async (
  maskDataUrl: string,
  width: number,
  height: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const maskImage = new Image();
    maskImage.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error("Failed to get canvas context."));
      }

      ctx.drawImage(maskImage, 0, 0);
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Invert RGB channels (assuming grayscale mask where R=G=B)
        data[i] = 255 - data[i];     // R
        data[i + 1] = 255 - data[i + 1]; // G
        data[i + 2] = 255 - data[i + 2]; // B
        // Alpha channel (data[i + 3]) remains unchanged
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };
    maskImage.onerror = reject;
    maskImage.src = maskDataUrl;
  });
};