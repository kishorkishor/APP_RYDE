// ─── Routing Service (Driver App) ────────────────────────────────────────────
// Primary: Mapbox Directions with live traffic.
// Fallback: OSRM (free, no traffic) — app never crashes if Mapbox is down.

import { fetchMapboxRoute } from '@/src/services/mapbox';

const OSRM_URL = 'https://router.project-osrm.org';

export type RouteResult = {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  geometry: any; // GeoJSON LineString
  source: 'mapbox' | 'osrm';
};

export const fetchRoute = async (
  pickupLon: number,
  pickupLat: number,
  dropoffLon: number,
  dropoffLat: number,
): Promise<RouteResult | null> => {
  // Primary: Mapbox (live traffic, better geometry)
  try {
    const result = await fetchMapboxRoute(pickupLon, pickupLat, dropoffLon, dropoffLat);
    if (result) return { ...result, source: 'mapbox' };
  } catch {
    // Mapbox unavailable — fall through to OSRM
  }

  // Fallback: OSRM (free, no traffic)
  try {
    const url = `${OSRM_URL}/route/v1/driving/${pickupLon},${pickupLat};${dropoffLon},${dropoffLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM request failed');

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;

    const route = data.routes[0];
    return {
      distanceMeters: route.distance,
      distanceKm: Number((route.distance / 1000).toFixed(2)),
      durationSeconds: route.duration,
      durationMinutes: Math.ceil(route.duration / 60),
      geometry: route.geometry,
      source: 'osrm',
    };
  } catch {
    return null;
  }
};
