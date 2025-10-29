import * as React from 'react';
import type { Point } from '@/types/editor';

export const useSelection = (
  selectionPath: Point[] | null,
  setSelectionPath: (path: Point[] | null) => void,
  selectionMaskDataUrl: string | null,
  setSelectionMaskDataUrl: (url: string | null) => void,
  clearSelectionState: () => void,
) => {
  // This hook manages the selection state, which is already handled in useEditorState.
  // It is kept here as a structural stub for potential future logic separation.
  return {
    selectionPath,
    setSelectionPath,
    selectionMaskDataUrl,
    setSelectionMaskDataUrl,
    clearSelectionState,
  };
};