import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  geminiApiKey: string;
  stabilityApiKey: string;
  saveApiKey: (key: string, type: 'gemini' | 'stability') => Promise<void>;
  isFetching: boolean;
  isSettingsPanelOpen: boolean;
  toggleSettingsPanel: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      geminiApiKey: '',
      stabilityApiKey: '',
      isFetching: false,
      isSettingsPanelOpen: false,
      
      toggleSettingsPanel: () => set((state) => ({ isSettingsPanelOpen: !state.isSettingsPanelOpen })),

      saveApiKey: async (key, type) => {
        set({ isFetching: true });
        // In a real application, this would involve a secure backend call (e.g., Supabase Edge Function)
        // For now, we simulate saving to local storage/state
        if (type === 'gemini') {
          set({ geminiApiKey: key });
        } else if (type === 'stability') {
          set({ stabilityApiKey: key });
        }
        set({ isFetching: false });
      },
    }),
    {
      name: 'ai-settings-storage',
      partialize: (state) => ({
        geminiApiKey: state.geminiApiKey,
        stabilityApiKey: state.stabilityApiKey,
      }),
    }
  )
);