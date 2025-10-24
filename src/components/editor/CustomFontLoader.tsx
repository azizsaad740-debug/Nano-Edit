"use client";

import * as React from "react";

interface CustomFontLoaderProps {
  customFonts: string[]; // Array of font names (which are injected via CSS)
}

// This component is a stub for injecting custom font CSS rules.
export const CustomFontLoader = ({ customFonts }: CustomFontLoaderProps) => {
  const styleRef = React.useRef<HTMLStyleElement | null>(null);

  React.useEffect(() => {
    if (!styleRef.current) {
      styleRef.current = document.createElement('style');
      document.head.appendChild(styleRef.current);
    }

    // In a real application, this would dynamically load font files (e.g., via data URLs or paths)
    // and inject the necessary @font-face rules.
    // Since we don't handle font file parsing/storage here, this remains a structural stub.

    return () => {
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, [customFonts]);

  return null;
};