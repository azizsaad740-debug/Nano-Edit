import { useState, useEffect, useCallback } from 'react';
import { showSuccess, showError } from '@/utils/toast';

const CUSTOM_FONTS_STORAGE_KEY = 'nanoedit-custom-fonts';
const WEBSAFE_FONTS = [
  "Arial", "Verdana", "Tahoma", "Trebuchet MS", "Georgia", "Times New Roman", "Courier New", "Lucida Console"
];

export const useFontManager = () => {
  const [systemFonts, setSystemFonts] = useState<string[]>([]);
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

  // 2. Load system fonts on mount (if supported)
  useEffect(() => {
    const loadInitialSystemFonts = async () => {
      if ('queryLocalFonts' in window) {
        try {
          // @ts-ignore - Use experimental API
          const fonts = await window.queryLocalFonts();
          const uniqueFontNames = Array.from(new Set(fonts.map((f: any) => f.family))).sort() as string[];
          setSystemFonts(uniqueFontNames);
        } catch (error) {
          // Permission denied or failed to load, fall back to web-safe
          setSystemFonts(WEBSAFE_FONTS);
        }
      } else {
        // Browser doesn't support API, fall back to web-safe
        setSystemFonts(WEBSAFE_FONTS);
      }
    };
    loadInitialSystemFonts();
  }, []); // Run once on mount

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
    setSystemFonts,
    customFonts,
    addCustomFont,
    removeCustomFont,
  };
};