import { useState, useEffect, useCallback } from 'react';
import type { EditState } from '@/types/editor';
import { showSuccess } from '@/utils/toast';

export interface Preset {
  name: string;
  state: Partial<EditState>;
}

const PRESETS_STORAGE_KEY = 'nanoedit-presets';

export const usePresets = () => {
  const [presets, setPresets] = useState<Preset[]>([]);

  useEffect(() => {
    try {
      const storedPresets = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (storedPresets) {
        setPresets(JSON.parse(storedPresets));
      }
    } catch (error) {
      console.error("Failed to load presets from local storage", error);
    }
  }, []);

  const savePreset = useCallback((name: string, state: EditState) => {
    const { crop, ...stateToSave } = state;
    const newPreset: Preset = { name, state: stateToSave };
    
    const updatedPresets = [...presets.filter(p => p.name !== name), newPreset].sort((a, b) => a.name.localeCompare(b.name));
    
    setPresets(updatedPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
    showSuccess(`Preset "${name}" saved.`);
  }, [presets]);

  const deletePreset = useCallback((name: string) => {
    const updatedPresets = presets.filter(p => p.name !== name);
    setPresets(updatedPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
    showSuccess(`Preset "${name}" deleted.`);
  }, [presets]);

  return { presets, savePreset, deletePreset };
};