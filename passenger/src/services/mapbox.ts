// ─── Mapbox Services ──────────────────────────────────────────────────────────
// Primary map tiles + routing with live traffic.
// Falls back to TomTom (routing) or OpenFreeMap (tiles) if unavailable.
// Uses the existing MapLibre SDK — no new SDK needed.

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// ─── Map Style ────────────────────────────────────────────────────────────────
// Returns a MapLibre-compatible raster style using Mapbox navigation tiles.
// Uses the navigation-day-v1 style — clean, optimised for ride-hailing.

export const getMapboxMapStyle = () => {
  if (!TOKEN) return null;
  return {
    version: 8 as const,
    sources: {
      mapbox: {
        type: 'raster' as const,
        tiles: [
          `https://api.mapbox.com/styles/v1/mapbox/navigation-day-v1/tiles/256/{z}/{x}/{y}?access_token=${TOKEN}`,
        ],
        tileSize: 256,
        attribution: '© <a href="https://www.mapbox.com/">Mapbox</a> © <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      },
    },
    layers: [{ id: 'mapbox-tiles', type: 'raster' as const, source: 'mapbox' }],
  };
};

export const hasMapboxToken = () => !!TOKEN;

// ─── Directions API ───────────────────────────────────────────────────────────
// driving-traffic profile includes live Riyadh traffic data.
// Free tier: 100,000 requests/month — well within limits for 500 users.

export type MapboxRouteResult = {
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

export const fetchMapboxRoute = async (
  pickupLon: number,
  pickupLat: number,
  dropoffLon: number,
  dropoffLat: number,
): Promise<MapboxRouteResult | null> => {
  if (!TOKEN) return null;

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/` +
    `${pickupLon},${pickupLat};${dropoffLon},${dropoffLat}` +
    `?geometries=geojson&overview=full&access_token=${TOKEN}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox Directions failed: ${res.status}`);

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return null;

  return {
    distanceMeters: route.distance,
    distanceKm: Number((route.distance / 1000).toFixed(2)),
    durationSeconds: route.duration,
    durationMinutes: Math.ceil(route.duration / 60),
    geometry: {
      type: 'Feature',
      geometry: route.geometry,
      properties: {},
    },
  };
};
