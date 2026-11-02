import * as Location from 'expo-location';
import type { GeoPoint } from '@/domain/entities';

export type LocationPermission = 'granted' | 'denied' | 'undetermined';

export interface LocationService {
  requestPermission(): Promise<LocationPermission>;
  getPermission(): Promise<LocationPermission>;
  servicesEnabled(): Promise<boolean>;
  getCurrentPosition(): Promise<GeoPoint>;
  watch(onPoint: (p: GeoPoint) => void, onError?: (e: Error) => void): Promise<() => void>;
}

function toPoint(loc: Location.LocationObject): GeoPoint {
  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    accuracy: loc.coords.accuracy ?? undefined,
    timestamp: loc.timestamp,
  };
}

function toPermission(status: Location.PermissionStatus): LocationPermission {
  if (status === Location.PermissionStatus.GRANTED) return 'granted';
  if (status === Location.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

export class ExpoLocationService implements LocationService {
  async requestPermission(): Promise<LocationPermission> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return toPermission(status);
  }

  async getPermission(): Promise<LocationPermission> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return toPermission(status);
  }

  async servicesEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch {
      return true;
    }
  }

  async getCurrentPosition(): Promise<GeoPoint> {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return toPoint(loc);
  }

  async watch(onPoint: (p: GeoPoint) => void, onError?: (e: Error) => void): Promise<() => void> {
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30_000,
        distanceInterval: 25,
      },
      (loc) => onPoint(toPoint(loc)),
      (err) => onError?.(new Error(typeof err === 'string' ? err : String(err))),
    );
    return () => sub.remove();
  }
}
