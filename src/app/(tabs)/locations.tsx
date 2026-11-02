import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { container } from '@/core/di/container';
import type { Employee, OfficeLocation, Region } from '@/domain/entities';
import { distanceMeters, formatDistance } from '@/domain/services/geo';
import { formatTimeInZone } from '@/domain/services/time';
import {
  AppHeader,
  AppText,
  Banner,
  Button,
  Card,
  ChoiceChips,
  Field,
  Pill,
  Row,
  Screen,
  Segmented,
  Sheet,
} from '@/presentation/components';
import { useHaptics } from '@/presentation/hooks/useHaptics';
import { useNow } from '@/presentation/hooks/useNow';
import { useAttendanceStore } from '@/presentation/store/attendanceStore';
import { useAuthStore } from '@/presentation/store/authStore';
import { useScheduleStore } from '@/presentation/store/scheduleStore';
import { useTheme } from '@/presentation/theme';

const ZONES: Record<Region, { value: string; label: string }[]> = {
  PK: [{ value: 'Asia/Karachi', label: 'Pakistan (PKT)' }],
  US: [
    { value: 'America/New_York', label: 'Eastern' },
    { value: 'America/Chicago', label: 'Central' },
    { value: 'America/Denver', label: 'Mountain' },
    { value: 'America/Los_Angeles', label: 'Pacific' },
  ],
};

export default function LocationsScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const now = useNow(30_000);
  const actor = useAuthStore((s) => s.employee) as Employee;
  const locations = useScheduleStore((s) => s.locations);
  const reloadLocations = useScheduleStore((s) => s.reloadLocations);
  const position = useAttendanceStore((s) => s.position);
  const geofence = useAttendanceStore((s) => s.geofence);
  const locating = useAttendanceStore((s) => s.locating);
  const refreshLocation = useAttendanceStore((s) => s.refreshLocation);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState<Region>(actor.region);
  const [timeZone, setTimeZone] = useState<string>(ZONES[actor.region][0].value);
  const [radius, setRadius] = useState('150');
  const [error, setError] = useState<string | null>(null);

  const groups: { region: Region; title: string }[] = [
    { region: 'PK', title: 'Pakistan' },
    { region: 'US', title: 'United States' },
  ];

  const distanceTo = (o: OfficeLocation) => (position ? distanceMeters(position, o) : null);

  const submit = async () => {
    setError(null);
    const point = position ?? (await refreshLocation(actor));
    if (!point) {
      setError('Current GPS position is required to pin a new office.');
      return;
    }
    try {
      await container.locations.add.execute(actor, {
        name,
        address,
        region,
        timeZone,
        radiusMeters: Number(radius) || 150,
        point,
      });
      await reloadLocations();
      haptics.success();
      setAdding(false);
      setName('');
      setAddress('');
    } catch (e) {
      haptics.error();
      setError(e instanceof Error ? e.message : 'Could not add office');
    }
  };

  const confirmRemove = (o: OfficeLocation) => {
    Alert.alert('Remove office?', `${o.name} will no longer be available for clock-in.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await container.locations.remove.execute(actor, o.id);
            await reloadLocations();
          } catch (e) {
            Alert.alert('Not allowed', e instanceof Error ? e.message : 'Could not remove office');
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <AppHeader title="Locations" subtitle={`${locations.length} offices · geofenced clock-in`} />

      <Card tone="alt">
        <View style={styles.head}>
          <AppText variant="h3">My position</AppText>
          <Button
            title={locating ? 'Locating…' : 'Refresh'}
            size="sm"
            variant="secondary"
            onPress={() => void refreshLocation(actor)}
            disabled={locating}
          />
        </View>
        {position ? (
          <>
            <AppText variant="mono">
              {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
            </AppText>
            <AppText variant="small" tone="muted">
              Accuracy ±{Math.round(position.accuracy ?? 0)} m
              {geofence?.office ? ` · nearest ${geofence.office.name} (${formatDistance(geofence.distanceMeters)})` : ''}
            </AppText>
          </>
        ) : (
          <AppText variant="small" tone="muted">
            No GPS fix yet. Tap refresh and allow location access.
          </AppText>
        )}
      </Card>

      {groups.map((g) => {
        const list = locations.filter((l) => l.region === g.region);
        if (list.length === 0) return null;
        return (
          <View key={g.region} style={{ gap: 8 }}>
            <AppText variant="caption" tone="muted">
              {g.title.toUpperCase()}
            </AppText>
            <Card padded={false} style={{ paddingHorizontal: 16 }}>
              {list.map((o, i) => {
                const d = distanceTo(o);
                const here = d != null && d <= o.radiusMeters + Math.min(position?.accuracy ?? 0, 50);
                return (
                  <Row
                    key={o.id}
                    title={o.name}
                    subtitle={`${o.address} · ${o.radiusMeters} m radius · ${formatTimeInZone(now, o.timeZone)}`}
                    last={i === list.length - 1}
                    onPress={actor.role === 'manager' && o.isCustom ? () => confirmRemove(o) : undefined}
                    right={
                      here ? (
                        <Pill label="Here" tone="success" dot />
                      ) : (
                        <AppText variant="small" tone="muted">
                          {formatDistance(d)}
                        </AppText>
                      )
                    }
                    left={
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: here ? theme.colors.success : o.isCustom ? theme.colors.info : theme.colors.textFaint },
                        ]}
                      />
                    }
                  />
                );
              })}
            </Card>
          </View>
        );
      })}

      {actor.role === 'manager' ? (
        <Button title="Add office at my position" variant="secondary" onPress={() => setAdding(true)} />
      ) : (
        <AppText variant="small" tone="faint" center>
          Managers can add new office geofences from their current position.
        </AppText>
      )}

      <Sheet visible={adding} title="New office" onClose={() => setAdding(false)}>
        {error && <Banner message={error} onDismiss={() => setError(null)} />}
        <Field label="Office name" placeholder="8star Faisalabad" value={name} onChangeText={setName} />
        <Field label="Address" placeholder="Street, city" value={address} onChangeText={setAddress} />
        <AppText variant="caption" tone="muted">
          REGION
        </AppText>
        <Segmented
          value={region}
          options={[
            { value: 'PK', label: 'Pakistan' },
            { value: 'US', label: 'United States' },
          ]}
          onChange={(r) => {
            setRegion(r);
            setTimeZone(ZONES[r][0].value);
          }}
        />
        <AppText variant="caption" tone="muted">
          TIME ZONE
        </AppText>
        <ChoiceChips value={timeZone} choices={ZONES[region]} onChange={setTimeZone} />
        <Field
          label="Geofence radius (m)"
          keyboardType="number-pad"
          value={radius}
          onChangeText={setRadius}
          hint="Between 50 and 2000 meters. GPS accuracy is added as tolerance."
        />
        <AppText variant="small" tone="muted">
          {position
            ? `Pinned at ${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`
            : 'Your current GPS position will be used as the office center.'}
        </AppText>
        <Button title="Save office" onPress={submit} fullWidth />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
