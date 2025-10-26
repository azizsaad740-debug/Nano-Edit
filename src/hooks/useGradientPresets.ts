import { useState, useEffect, useCallback } from 'react';
import type { GradientToolState } from '@/types/editor';
import { showSuccess } from '@/utils/toast';

export interface GradientPreset {
  name: string;
  state: GradientToolState;
}

const GRADIENT_PRESETS_STORAGE_KEY = 'nanoedit-gradient-presets';

export const useGradientPresets = () => {
  const [gradientPresets, setGradientPresets] = useState<GradientPreset[]>([]);

  useEffect(() => {
    try {
      const storedPresets = localStorage.getItem(GRADIENT_PRESETS_STORAGE_KEY);
      if (storedPresets) {
        setGradientPresets(JSON.parse(storedPresets));
      }
    } catch (error) {
      console.error("Failed to load gradient presets from local storage", error);
    }
  }, []);

  const saveGradientPreset = useCallback((name: string, state: GradientToolState) => {
    const newPreset: GradientPreset = { name, state };
    
    const updatedPresets = [...gradientPresets.filter(p => p.name !== name), newPreset].sort((a, b) => a.name.localeCompare(b.name));
    
    setGradientPresets(updatedPresets);
    localStorage.setItem(GRADIENT_PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
    showSuccess(`Gradient preset "${name}" saved.`);
  }, [gradientPresets]);

  const deleteGradientPreset = useCallback((name: string) => {
    const updatedPresets = gradientPresets.filter(p => p.name !== name);
    setGradientPresets(updatedPresets);
    localStorage.setItem(GRADIENT_PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
    showSuccess(`Gradient preset "${name}" deleted.`);
  }, [gradientPresets]);

  return { gradientPresets, saveGradientPreset, deleteGradientPreset };
};