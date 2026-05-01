import { ACTIVE_CITY } from '@/src/config/city';
import type { RideLocation } from '@/src/types';

const TOMTOM_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY || '';
const BASE_URL = 'https://api.tomtom.com';
const SEARCH_TTL_MS = 10 * 60 * 1000;
const REVERSE_TTL_MS = 30 * 60 * 1000;
const ROUTE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_LANGUAGE = 'en-US';

type CacheEntry<T> = { expiresAt: number; value: T };

const cache = new Map<string, CacheEntry<unknown>>();

const getCached = <T>(key: string): T | null => {
  const hit = cache.get(key);
  if (!hit || hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value as T;
};

const setCached = <T>(key: string, value: T, ttlMs: number) => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

const roundCoord = (value: number, decimals = 5) => Number(value.toFixed(decimals));

export const getTomTomMapStyle = () => {
  if (!TOMTOM_KEY) return 'https://tiles.openfreemap.org/styles/liberty';

  return {
    version: 8 as const,
    sources: {
      tomtom: {
        type: 'raster' as const,
        tiles: [
          `${BASE_URL}/map/1/tile/basic/main/{z}/{x}/{y}.png?tileSize=256&key=${TOMTOM_KEY}`,
        ],
        tileSize: 256,
        attribution: 'TomTom',
      },
    },
    layers: [{ id: 'tomtom', type: 'raster' as const, source: 'tomtom' }],
  };
};

const ensureKey = () => {
  if (!TOMTOM_KEY) throw new Error('Missing EXPO_PUBLIC_TOMTOM_API_KEY');
};

let searchController: AbortController | null = null;

export const searchPlaces = async (query: string): Promise<RideLocation[]> => {
  const normalized = query.trim().replace(/\s+/g, ' ').toLowerCase();
  if (normalized.length < 3) return [];

  const [lon, lat] = ACTIVE_CITY.center;
  const cacheKey = `search:${ACTIVE_CITY.id}:${normalized}`;
  const cached = getCached<RideLocation[]>(cacheKey);
  if (cached) return cached;

  searchController?.abort();
  searchController = new AbortController();

  try {
    ensureKey();
    const params = new URLSearchParams({
      key: TOMTOM_KEY,
      limit: '5',
      lat: String(lat),
      lon: String(lon),
      radius: '50000',
      language: DEFAULT_LANGUAGE,
    });
    const url = `${BASE_URL}/search/2/search/${encodeURIComponent(normalized)}.json?${params}`;
    const res = await fetch(url, { signal: searchController.signal });
    if (!res.ok) throw new Error(`TomTom search failed: ${res.status}`);
    const data = await res.json();

    const places = (data.results || [])
      .map((item: any): RideLocation | null => {
        const position = item.position;
        if (!position || typeof position.lat !== 'number' || typeof position.lon !== 'number') {
          return null;
        }
        const address = item.address || {};
        const label =
          item.poi?.name ||
          address.freeformAddress ||
          address.streetName ||
          address.municipality ||
          'Unknown location';
        const secondaryText = [
          address.municipality,
          address.countrySubdivision,
          address.country,
        ]
          .filter(Boolean)
          .join(', ');

        return {
          label,
          address: address.freeformAddress || label,
          secondaryText,
          latitude: position.lat,
          longitude: position.lon,
          placeId: item.id,
          cityId: ACTIVE_CITY.id,
          countryCode: address.countryCode,
        };
      })
      .filter(Boolean) as RideLocation[];

    setCached(cacheKey, places, SEARCH_TTL_MS);
    return places;
  } catch (error: any) {
    if (error?.name === 'AbortError') return [];
    console.error('TomTom search error:', error);
    return [];
  }
};

let reverseController: AbortController | null = null;

export const reverseGeocode = async (lon: number, lat: number): Promise<RideLocation | null> => {
  const roundedLon = roundCoord(lon);
  const roundedLat = roundCoord(lat);
  const cacheKey = `reverse:${roundedLat},${roundedLon}`;
  const cached = getCached<RideLocation | null>(cacheKey);
  if (cached) return cached;

  reverseController?.abort();
  reverseController = new AbortController();

  try {
    ensureKey();
    const params = new URLSearchParams({
      key: TOMTOM_KEY,
      language: DEFAULT_LANGUAGE,
    });
    const url = `${BASE_URL}/search/2/reverseGeocode/${roundedLat},${roundedLon}.json?${params}`;
    const res = await fetch(url, { signal: reverseController.signal });
    if (!res.ok) throw new Error(`TomTom reverse geocode failed: ${res.status}`);
    const data = await res.json();
    const address = data.addresses?.[0]?.address;
    if (!address) {
      setCached(cacheKey, null, REVERSE_TTL_MS);
      return null;
    }

    const label =
      address.freeformAddress ||
      address.streetName ||
      address.municipality ||
      'Unknown location';
    const result: RideLocation = {
      label,
      address: address.freeformAddress || label,
      secondaryText: [address.municipality, address.countrySubdivision].filter(Boolean).join(', '),
      latitude: lat,
      longitude: lon,
      cityId: ACTIVE_CITY.id,
      countryCode: address.countryCode,
    };

    setCached(cacheKey, result, REVERSE_TTL_MS);
    return result;
  } catch (error: any) {
    if (error?.name === 'AbortError') return null;
    console.error('TomTom reverse geocode error:', error);
    return null;
  }
};

export type TomTomRouteResult = {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  geometry: {
    type: 'Feature';
    geometry: { type: 'LineString'; coordinates: [number, number][] };
    properties: Record<string, never>;
  };
};

export const calculateRoute = async (
  pickupLon: number,
  pickupLat: number,
  dropoffLon: number,
  dropoffLat: number
): Promise<TomTomRouteResult | null> => {
  const keyParts = [pickupLat, pickupLon, dropoffLat, dropoffLon].map((v) => roundCoord(v, 4));
  const cacheKey = `route:${keyParts.join(':')}`;
  const cached = getCached<TomTomRouteResult>(cacheKey);
  if (cached) return cached;

  try {
    ensureKey();
    const params = new URLSearchParams({
      key: TOMTOM_KEY,
      traffic: 'true',
      routeRepresentation: 'polyline',
      computeTravelTimeFor: 'all',
      travelMode: 'car',
    });
    const points = `${pickupLat},${pickupLon}:${dropoffLat},${dropoffLon}`;
    const url = `${BASE_URL}/routing/1/calculateRoute/${points}/json?${params}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TomTom route failed: ${res.status}`);
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;

    const summary = route.summary || {};
    const routePoints = (route.legs || [])
      .flatMap((leg: any) => leg.points || [])
      .map((point: any) => [point.longitude, point.latitude] as [number, number])
      .filter(([lon, lat]: [number, number]) => typeof lon === 'number' && typeof lat === 'number');

    if (routePoints.length < 2) return null;

    const result: TomTomRouteResult = {
      distanceMeters: Number(summary.lengthInMeters || 0),
      distanceKm: Number((Number(summary.lengthInMeters || 0) / 1000).toFixed(2)),
      durationSeconds: Number(summary.travelTimeInSeconds || 0),
      durationMinutes: Math.ceil(Number(summary.travelTimeInSeconds || 0) / 60),
      geometry: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: routePoints },
        properties: {},
      },
    };

    setCached(cacheKey, result, ROUTE_TTL_MS);
    return result;
  } catch (error) {
    console.error('TomTom routing error:', error);
    return null;
  }
};
