import { create } from 'zustand';

interface PresetManagerState {
  isPresetManagerOpen: boolean;
  togglePresetManager: () => void;
  // Placeholder for actual preset data and logic
  presets: any[];
}

export const usePresetManager = create<PresetManagerState>((set) => ({
  isPresetManagerOpen: false,
  presets: [],

  togglePresetManager: () => set((state) => ({ isPresetManagerOpen: !state.isPresetManagerOpen })),
}));