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