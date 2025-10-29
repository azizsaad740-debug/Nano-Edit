import type { Point, Dimensions } from "@/types/editor";

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

/**
 * Simulates generating a mask using a flood fill/magic wand algorithm.
 * Since actual pixel analysis is not possible, this stubs a selection area.
 *
 * @param clickPoint The starting point of the selection (in image pixels).
 * @param dimensions The dimensions of the image.
 * @param tolerance The color tolerance setting (0-255).
 * @returns A Promise that resolves to a data URL of the binary mask.
 */
export const floodFillToMaskDataUrl = async (
  clickPoint: Point,
  dimensions: Dimensions,
  tolerance: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error("Failed to get canvas context."));
    }

    // STUB: Simulate a selection based on the click point and tolerance.
    // Higher tolerance means a larger selection (larger radius).
    
    const maxRadius = Math.min(dimensions.width, dimensions.height) * 0.3;
    const radius = maxRadius * (tolerance / 255); // Scale radius by tolerance (0-255)
    const featherRadius = 30; 

    ctx.save();
    
    // 1. Draw the selection shape (white)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(clickPoint.x, clickPoint.y, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // 2. Apply feathering (blur)
    ctx.filter = `blur(${featherRadius}px)`;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(canvas, 0, 0); // Redraw to apply filter

    ctx.restore();
    
    resolve(canvas.toDataURL());
  });
};

/**
 * Converts an elliptical area defined by two points into a binary mask data URL.
 *
 * @param start The starting point of the ellipse bounding box (in image pixels).
 * @param end The ending point of the ellipse bounding box (in image pixels).
 * @param width The natural width of the image.
 * @param height The natural height of the image.
 * @returns A Promise that resolves to a data URL of the binary mask.
 */
export const ellipseToMaskDataUrl = async (
  start: Point,
  end: Point,
  width: number,
  height: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error("Failed to get canvas context."));
    }

    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(start.x - end.x);
    const h = Math.abs(start.y - end.y);

    ctx.fillStyle = 'white';
    ctx.beginPath();
    // Draw ellipse: (centerX, centerY, radiusX, radiusY, rotation, startAngle, endAngle)
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
    ctx.fill();

    resolve(canvas.toDataURL());
  });
};

/**
 * Simulates generating a mask using an AI object selection algorithm.
 *
 * @param dimensions The dimensions of the image.
 * @returns A Promise that resolves to a data URL of the binary mask.
 */
export const objectSelectToMaskDataUrl = async (
  dimensions: Dimensions
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error("Failed to get canvas context."));
    }

    // STUB: Simulate selecting a central object (e.g., a slightly feathered rectangle)
    const w = dimensions.width * 0.6;
    const h = dimensions.height * 0.7;
    const x = dimensions.width * 0.2;
    const y = dimensions.height * 0.15;
    const featherRadius = 50; 

    ctx.save();
    
    // 1. Draw the selection shape (white)
    ctx.fillStyle = 'white';
    ctx.fillRect(x, y, w, h);
    
    // 2. Apply feathering (blur)
    ctx.filter = `blur(${featherRadius}px)`;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(canvas, 0, 0); // Redraw to apply filter

    ctx.restore();
    
    resolve(canvas.toDataURL());
  });
};