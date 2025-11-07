import { create } from 'zustand';

interface SmartObjectEditorState {
  isSmartObjectEditorOpen: boolean;
  toggleSmartObjectEditor: () => void;
}

export const useSmartObjectEditor = create<SmartObjectEditorState>((set) => ({
  isSmartObjectEditorOpen: false,
  toggleSmartObjectEditor: () => set((state) => ({ isSmartObjectEditorOpen: !state.isSmartObjectEditorOpen })),
}));