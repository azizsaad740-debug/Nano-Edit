// ... (around line 260)
export interface FrameState {
  type: 'none' | 'border' | 'polaroid' | 'film' | 'solid'; // FIX 20: Added 'solid'
  width: number;
  color: string;
  padding?: number;
  radius?: number;
  opacity?: number;
}

export interface EditState {
  // ... existing properties
  crop: CropState | null;
  frame: FrameState;
  channels: { r: boolean; g: boolean; b: boolean }; // FIX 1, 21, 22, 23, 33
  colorMode: 'RGB' | 'CMYK' | 'Grayscale';
  selectiveBlurMask: string | null;
  // ...
}

export const initialEditState: EditState = {
  // ... existing properties
  crop: null,
  frame: { type: 'none', width: 0, color: '#000000' },
  channels: { r: true, g: true, b: true }, // FIX 1, 21, 22, 23, 33
  colorMode: 'RGB',
  selectiveBlurMask: null,
  // ...
};
// ...