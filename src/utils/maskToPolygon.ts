import type { Point } from "@/hooks/useEditorState";

/**
 * Converts a binary mask (represented by a data URL) into a polygonal path.
 * It identifies boundary pixels and then sorts them by angle around their centroid
 * to form a closed polygon. This creates a more precise outline than a simple bounding box.
 *
 * @param maskDataUrl The data URL of the binary mask (white for selected, black/transparent for not selected).
 * @param width The natural width of the image the mask applies to.
 * @param height The natural height of the image the mask applies to.
 * @returns A Promise that resolves to an array of Points representing the polygonal path.
 */
export const maskToPolygon = async (
  maskDataUrl: string,
  width: number,
  height: number
): Promise<Point[]> => {
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

      // Helper to check if a pixel is "on" (part of the selection)
      const isSelected = (x: number, y: number) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return false;
        const i = (y * width + x) * 4;
        return data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0; // Check R, G, B channels
      };

      const boundaryPointsSet = new Set<string>(); // Use a Set to store unique points as strings "x,y"

      // Scan rows for horizontal edges
      for (let y = 0; y < height; y++) {
        let firstX = -1;
        let lastX = -1;
        for (let x = 0; x < width; x++) {
          if (isSelected(x, y)) {
            if (firstX === -1) firstX = x;
            lastX = x;
            // Add points where selection starts/ends horizontally
            if (!isSelected(x - 1, y)) boundaryPointsSet.add(`${x},${y}`); // Left edge
            if (!isSelected(x + 1, y)) boundaryPointsSet.add(`${x},${y}`); // Right edge
          }
        }
        // Also add the first and last selected pixel in the row if they exist
        if (firstX !== -1) {
            boundaryPointsSet.add(`${firstX},${y}`);
            boundaryPointsSet.add(`${lastX},${y}`);
        }
      }

      // Scan columns for vertical edges
      for (let x = 0; x < width; x++) {
        let firstY = -1;
        let lastY = -1;
        for (let y = 0; y < height; y++) {
          if (isSelected(x, y)) {
            if (firstY === -1) firstY = y;
            lastY = y;
            // Add points where selection starts/ends vertically
            if (!isSelected(x, y - 1)) boundaryPointsSet.add(`${x},${y}`); // Top edge
            if (!isSelected(x, y + 1)) boundaryPointsSet.add(`${x},${y}`); // Bottom edge
          }
        }
        // Also add the first and last selected pixel in the column if they exist
        if (firstY !== -1) {
            boundaryPointsSet.add(`${x},${firstY}`);
            boundaryPointsSet.add(`${x},${lastY}`);
        }
      }

      let boundaryPoints: Point[] = Array.from(boundaryPointsSet).map(s => {
        const [x, y] = s.split(',').map(Number);
        return { x, y };
      });

      if (boundaryPoints.length === 0) {
        return resolve([]); // No selection found
      }

      // Calculate centroid for sorting
      let centroidX = 0;
      let centroidY = 0;
      for (const p of boundaryPoints) {
        centroidX += p.x;
        centroidY += p.y;
      }
      centroidX /= boundaryPoints.length;
      centroidY /= boundaryPoints.length;

      // Sort points by angle around the centroid
      boundaryPoints.sort((a, b) => {
        const angleA = Math.atan2(a.y - centroidY, a.x - centroidX);
        const angleB = Math.atan2(b.y - centroidY, b.x - centroidX);
        return angleA - angleB;
      });

      // Optional: Simplify the polygon further (e.g., remove collinear points)
      const simplifyPolygon = (path: Point[], tolerance: number = 1): Point[] => {
        if (path.length <= 2) return path;
        const simplified: Point[] = [path[0]];
        for (let i = 1; i < path.length - 1; i++) {
          const p1 = simplified[simplified.length - 1];
          const p2 = path[i];
          const p3 = path[i + 1];
          // Check if p1, p2, p3 are approximately collinear
          const crossProduct = (p2.y - p1.y) * (p3.x - p2.x) - (p2.x - p1.x) * (p3.y - p2.y);
          if (Math.abs(crossProduct) > tolerance) { // If not collinear within tolerance
            simplified.push(p2);
          }
        }
        // Add the last point if it's not already there (to close the loop)
        if (simplified[simplified.length - 1] !== path[path.length - 1]) {
            simplified.push(path[path.length - 1]);
        }
        return simplified;
      };

      // Apply simplification
      boundaryPoints = simplifyPolygon(boundaryPoints, 5); // Adjust tolerance as needed

      resolve(boundaryPoints);
    };
    maskImage.onerror = reject;
    maskImage.src = maskDataUrl;
  });
};