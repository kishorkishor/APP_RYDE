import { RideLocation } from '@/src/types';
import { reverseGeocode, searchPlaces } from '@/src/services/tomtom';

export const geocodeForward = async (query: string): Promise<RideLocation[]> => {
  return searchPlaces(query);
};

export const geocodeReverse = async (lon: number, lat: number): Promise<RideLocation | null> => {
  return reverseGeocode(lon, lat);
};
