import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode } from '../theme/tokens';
import { zustandStorage } from './persist';

interface SettingsState {
  themeMode: ThemeMode;
  liveTracking: boolean;
  hapticsEnabled: boolean;
  hydrated: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setLiveTracking: (enabled: boolean) => void;
  setHaptics: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      liveTracking: true,
      hapticsEnabled: true,
      hydrated: false,
      setThemeMode: (themeMode) => set({ themeMode }),
      setLiveTracking: (liveTracking) => set({ liveTracking }),
      setHaptics: (hapticsEnabled) => set({ hapticsEnabled }),
    }),
    {
      name: '8star:settings',
      storage: zustandStorage,
      partialize: (s) => ({
        themeMode: s.themeMode,
        liveTracking: s.liveTracking,
        hapticsEnabled: s.hapticsEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        state && useSettingsStore.setState({ hydrated: true });
      },
    },
  ),
);
