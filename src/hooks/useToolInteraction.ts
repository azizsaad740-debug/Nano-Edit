import { create } from 'zustand';

interface ToolInteractionState {
  openFile: () => void;
  saveFile: () => void;
}

export const useToolInteraction = create<ToolInteractionState>(() => ({
  openFile: () => { console.log('Opening file...'); },
  saveFile: () => { console.log('Saving file...'); },
}));