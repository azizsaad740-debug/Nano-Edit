import { useState, useEffect, useCallback } from 'react';
import type { GradientToolState } from '@/types/editor';
import { showSuccess } from '@/utils/toast';
import { v4 as uuidv4 } from "uuid";

export interface GradientPreset {
  id: string;
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
        // Ensure loaded presets have an ID for compatibility, generating one if missing
        const loadedPresets: GradientPreset[] = JSON.parse(storedPresets).map((p: any) => ({
            ...p,
            id: p.id || uuidv4(),
        }));
        setGradientPresets(loadedPresets);
      }
    } catch (error) {
      console.error("Failed to load gradient presets from local storage", error);
    }
  }, []);

  const saveGradientPreset = useCallback((name: string, state: GradientToolState) => {
    const existing = gradientPresets.find(p => p.name === name);
    const newPreset: GradientPreset = { 
      id: existing ? existing.id : uuidv4(),
      name, 
      state 
    };
    
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