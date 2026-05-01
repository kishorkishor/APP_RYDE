export type CityConfig = {
  id: string;
  name: string;
  center: [number, number]; // [longitude, latitude]
  bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  currency: string;
  pricing: {
    baseFare: number;
    perKmRate: number;
    perMinRate: number;
    minFare: number;
    typeMultipliers: Record<string, number>;
  };
};

export const CITIES: Record<string, CityConfig> = {
  riyadh: {
    id: 'riyadh',
    name: 'Riyadh',
    center: [46.6753, 24.7136], // [longitude, latitude]
    bounds: [46.40, 24.40, 47.00, 25.00],
    defaultZoom: 12,
    minZoom: 10,
    maxZoom: 18,
    currency: 'SAR',
    pricing: {
      baseFare: 10,
      perKmRate: 2,
      perMinRate: 0.5,
      minFare: 15,
      typeMultipliers: {
        swift: 1.0,
        comfort: 1.3,
        xl: 1.6,
        premium: 2.5,
      },
    },
  },
};

export const ACTIVE_CITY = CITIES[process.env.EXPO_PUBLIC_ACTIVE_CITY_ID || 'riyadh'] || CITIES.riyadh;
