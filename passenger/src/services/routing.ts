import { ACTIVE_CITY } from '@/src/config/city';
import { calculateRoute } from '@/src/services/tomtom';
import { fetchMapboxRoute } from '@/src/services/mapbox';

export type RouteResult = {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  geometry: any; // GeoJSON LineString
  calculatedFare: number;
  source: 'mapbox' | 'tomtom';
};

export const fetchRoute = async (
  pickupLon: number,
  pickupLat: number,
  dropoffLon: number,
  dropoffLat: number,
  rideTypeMultiplier: number = 1.0
): Promise<RouteResult | null> => {
  let raw: { distanceMeters: number; durationSeconds: number; geometry: any } | null = null;
  let source: 'mapbox' | 'tomtom' = 'mapbox';

  // Primary: Mapbox Directions with live traffic
  try {
    const result = await fetchMapboxRoute(pickupLon, pickupLat, dropoffLon, dropoffLat);
    if (result) raw = result;
  } catch {
    // Mapbox unavailable — fall through to TomTom
  }

  // Fallback: TomTom (also has traffic data)
  if (!raw) {
    try {
      const result = await calculateRoute(pickupLon, pickupLat, dropoffLon, dropoffLat);
      if (result) {
        raw = result;
        source = 'tomtom';
      }
    } catch {
      return null;
    }
  }

  if (!raw) return null;

  const distanceKm = Number((raw.distanceMeters / 1000).toFixed(2));
  const durationMinutes = Math.ceil(raw.durationSeconds / 60);

  const pricing = ACTIVE_CITY.pricing;
  let fare = (pricing.baseFare + distanceKm * pricing.perKmRate + durationMinutes * pricing.perMinRate) * rideTypeMultiplier;
  fare = Math.max(fare, pricing.minFare);
  fare = Math.round(fare * 100) / 100;

  return {
    distanceMeters: raw.distanceMeters,
    distanceKm,
    durationSeconds: raw.durationSeconds,
    durationMinutes,
    geometry: raw.geometry,
    calculatedFare: fare,
    source,
  };
};
