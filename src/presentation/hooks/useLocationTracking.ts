import { useEffect, useRef } from 'react';
import { container } from '@/core/di/container';
import type { Employee } from '@/domain/entities';
import { useAttendanceStore } from '../store/attendanceStore';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Keeps a GPS watch alive while the employee is on duty (and live tracking is enabled),
 * appending breadcrumb points to the open attendance record.
 */
export function useLocationTracking(employee: Employee | null) {
  const open = useAttendanceStore((s) => s.open);
  const permission = useAttendanceStore((s) => s.permission);
  const pushTrailPoint = useAttendanceStore((s) => s.pushTrailPoint);
  const setTracking = useAttendanceStore((s) => s.setTracking);
  const liveTracking = useSettingsStore((s) => s.liveTracking);
  const stopRef = useRef<(() => void) | null>(null);

  const onDuty = Boolean(open && !open.clockOutAt);
  const shouldTrack = onDuty && liveTracking && permission === 'granted' && Boolean(employee);

  useEffect(() => {
    let cancelled = false;
    if (!shouldTrack || !employee) {
      stopRef.current?.();
      stopRef.current = null;
      setTracking(false);
      return;
    }
    container.locationService
      .watch((point) => {
        void pushTrailPoint(employee, point);
      })
      .then((stop) => {
        if (cancelled) {
          stop();
          return;
        }
        stopRef.current = stop;
        setTracking(true);
      })
      .catch(() => setTracking(false));
    return () => {
      cancelled = true;
      stopRef.current?.();
      stopRef.current = null;
      setTracking(false);
    };
    // employee identity is stable per session; re-subscribe only when tracking conditions change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldTrack, employee?.id]);
}
