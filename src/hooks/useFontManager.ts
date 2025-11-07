import { useState, useEffect, useCallback } from 'react';
import { showSuccess, showError } from '@/utils/toast';

const CUSTOM_FONTS_STORAGE_KEY = 'nanoedit-custom-fonts';
const DEFAULT_FREE_FONTS = [
  "Lato", "Lobster", "Montserrat", "Open Sans", "Pacifico", "Playfair Display", "Roboto"
];

export const useFontManager = () => {
  const [systemFonts] = useState<string[]>(DEFAULT_FREE_FONTS);
  const [customFonts, setCustomFonts] = useState<string[]>([]);

  // 1. Load custom fonts from local storage on mount
  useEffect(() => {
    try {
      const storedCustomFonts = localStorage.getItem(CUSTOM_FONTS_STORAGE_KEY);
      if (storedCustomFonts) {
        setCustomFonts(JSON.parse(storedCustomFonts));
      }
    } catch (error) {
      console.error("Failed to load custom fonts from local storage", error);
    }
  }, []);

  // Persist custom fonts to local storage
  const saveCustomFonts = useCallback((fonts: string[]) => {
    setCustomFonts(fonts);
    try {
      localStorage.setItem(CUSTOM_FONTS_STORAGE_KEY, JSON.stringify(fonts));
    } catch (error) {
      console.error("Failed to save custom fonts to local storage", error);
    }
  }, []);

  const addCustomFont = useCallback((fontName: string) => {
    if (customFonts.includes(fontName)) {
      showError(`Font "${fontName}" is already listed.`);
      return;
    }
    const newFonts = [...customFonts, fontName].sort();
    saveCustomFonts(newFonts);
    showSuccess(`Custom font "${fontName}" added.`);
  }, [customFonts, saveCustomFonts]);

  const removeCustomFont = useCallback((fontName: string) => {
    const newFonts = customFonts.filter(name => name !== fontName);
    saveCustomFonts(newFonts);
    showSuccess(`Custom font "${fontName}" removed.`);
  }, [customFonts, saveCustomFonts]);

  return {
    systemFonts,
    customFonts,
    addCustomFont,
    removeCustomFont,
  };
};