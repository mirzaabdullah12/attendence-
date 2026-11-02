import type { GeoPoint, GeofenceCheck, OfficeLocation } from '../entities';

const EARTH_RADIUS_M = 6371000;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in meters (Haversine). */
export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function nearestOffice(point: GeoPoint, offices: OfficeLocation[]): GeofenceCheck {
  if (offices.length === 0) return { office: null, distanceMeters: null, inside: false };
  let best: OfficeLocation = offices[0];
  let bestDist = distanceMeters(point, best);
  for (const office of offices.slice(1)) {
    const d = distanceMeters(point, office);
    if (d < bestDist) {
      best = office;
      bestDist = d;
    }
  }
  // Accept the reading as "inside" if the geofence radius covers the point
  // after accounting for GPS accuracy error.
  const tolerance = Math.min(point.accuracy ?? 0, 50);
  return {
    office: best,
    distanceMeters: bestDist,
    inside: bestDist <= best.radiusMeters + tolerance,
  };
}

export function checkAgainstOffice(point: GeoPoint, office: OfficeLocation): GeofenceCheck {
  const d = distanceMeters(point, office);
  const tolerance = Math.min(point.accuracy ?? 0, 50);
  return { office, distanceMeters: d, inside: d <= office.radiusMeters + tolerance };
}

export function formatDistance(meters: number | null | undefined): string {
  if (meters == null) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}
