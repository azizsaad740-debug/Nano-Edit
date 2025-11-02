import { showSuccess, showError } from '@/utils/toast';
import type { Dimensions } from '@/types/editor';

// ... (rest of file)

export const generateImage = async (prompt: string, apiKey: string, width: number, height: number): Promise<string> => {
    // Stub implementation
    return "data:image/png;base64,...";
};

export const generativeFill = async (prompt: string, apiKey: string, originalImage: string, maskDataUrl: string, dimensions: Dimensions): Promise<string> => {
    // Stub implementation
    return "data:image/png;base64,...";
};

export { generateImage, generativeFill };