import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export function useHaptics() {
  const enabled = useSettingsStore((s) => s.hapticsEnabled);
  const tap = useCallback(() => {
    if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [enabled]);
  const success = useCallback(() => {
    if (enabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [enabled]);
  const error = useCallback(() => {
    if (enabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }, [enabled]);
  return { tap, success, error };
}
