import { create } from 'zustand';

interface EditorState {
  resetAllEdits: () => void;
}

export const useEditorState = create<EditorState>(() => ({
  resetAllEdits: () => { console.log('Resetting all edits...'); },
}));