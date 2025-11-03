import { isImageOrDrawingLayer } from '@/types/editor';
import { applyLayerTransform } from './layerUtils'; // Fix TS2305
import { showError, showSuccess } from '@/utils/toast';
import { renderImageToCanvas } from './canvasUtils';
import type { Layer, Dimensions, EditState } from '@/types/editor';

// ... rest of the file