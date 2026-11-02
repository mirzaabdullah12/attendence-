import { Redirect, Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Icon, type IconName } from '@/presentation/components';
import { useLocationTracking } from '@/presentation/hooks/useLocationTracking';
import { useAttendanceStore } from '@/presentation/store/attendanceStore';
import { useAuthStore } from '@/presentation/store/authStore';
import { useScheduleStore } from '@/presentation/store/scheduleStore';
import { useTheme } from '@/presentation/theme';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Clock', icon: 'clock' },
  { name: 'schedule', title: 'Schedule', icon: 'calendar' },
  { name: 'history', title: 'History', icon: 'history' },
  { name: 'locations', title: 'Locations', icon: 'pin' },
  { name: 'profile', title: 'Profile', icon: 'user' },
];

export default function TabsLayout() {
  const theme = useTheme();
  const employee = useAuthStore((s) => s.employee);
  const load = useAttendanceStore((s) => s.load);
  const initSchedule = useScheduleStore((s) => s.init);

  useLocationTracking(employee);

  useEffect(() => {
    if (employee) {
      void load(employee);
      void initSchedule(employee);
    }
  }, [employee, load, initSchedule]);

  if (!employee) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.textFaint,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, focused }) => (
              <Icon name={t.icon} color={String(color ?? theme.colors.textFaint)} strokeWidth={focused ? 2.2 : 1.7} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
