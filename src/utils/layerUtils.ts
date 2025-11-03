import type { Layer, Dimensions, Point, TextLayerData, EditState } from "@/types/editor";
import { isTextLayer } from "@/types/editor";

/**
 * Calculates the dimensions of a layer relative to the canvas (0-100%).
 * This is a stub implementation.
 */
export const getLayerDimensions = (layer: Layer): Dimensions => {
    // Stub: returns layer's relative width/height
    return { width: layer.width, height: layer.height };
};

/**
 * Calculates the center point of a layer relative to the canvas (0-100%).
 * This is a stub implementation.
 */
export const getLayerCenter = (layer: Layer): Point => {
    // Stub: returns layer's relative center point
    return { x: layer.x, y: layer.y };
};

/**
 * Applies text alignment to a canvas context.
 * @param ctx The canvas rendering context.
 * @param textAlign The desired text alignment.
 */
export const applyTextAlignment = (ctx: CanvasRenderingContext2D, textAlign: TextLayerData['textAlign']) => {
    // Note: CanvasTextAlign only supports 'start', 'end', 'left', 'right', 'center'.
    // 'justify' was removed from the type definition.
    ctx.textAlign = textAlign as CanvasTextAlign;
};

/**
 * Applies transformation matrix to layer coordinates.
 * This is a stub implementation.
 */
export const applyLayerTransform = (layer: Layer, dimensions: Dimensions): Layer => { // Fix TS2305
    // Stub implementation
    return layer;
};

/**
 * Renders a single layer to a canvas data URL.
 * This is a stub implementation.
 */
export const rasterizeLayerToCanvas = (layer: Layer, dimensions: Dimensions, editState: EditState): string => { // Fix TS2305
    // Stub implementation
    return '';
};

/**
 * Renders multiple layers to a single data URL.
 * This is a stub implementation.
 */
export const rasterizeLayersToDataUrl = (layers: Layer[], dimensions: Dimensions, editState: EditState): string => { // Fix TS2305
    // Stub implementation
    return '';
};