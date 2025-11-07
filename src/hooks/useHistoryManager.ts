import { create } from 'zustand';

interface HistoryState {
  history: any[]; // Simplified history state
  currentIndex: number;
  isHistoryPanelOpen: boolean;
  addState: (state: any) => void;
  undo: () => void;
  redo: () => void;
  toggleHistoryPanel: () => void;
}

export const useHistoryManager = create<HistoryState>((set, get) => ({
  history: [{}], // Initial empty state
  currentIndex: 0,
  isHistoryPanelOpen: false,
  
  toggleHistoryPanel: () => set((state) => ({ isHistoryPanelOpen: !state.isHistoryPanelOpen })),

  addState: (state) => {
    set((s) => {
      // Truncate history if we are not at the latest state
      const newHistory = s.history.slice(0, s.currentIndex + 1);
      newHistory.push(state);
      return {
        history: newHistory,
        currentIndex: newHistory.length - 1,
      };
    });
  },

  undo: () => {
    set((s) => ({
      currentIndex: Math.max(0, s.currentIndex - 1),
    }));
  },

  redo: () => {
    set((s) => ({
      currentIndex: Math.min(s.history.length - 1, s.currentIndex + 1),
    }));
  },
}));