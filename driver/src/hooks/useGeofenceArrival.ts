import { useEffect, useRef } from 'react';
import { distanceMeters } from '@/src/services/locationTracking';

const ARRIVAL_RADIUS_M = 150;

export function useGeofenceArrival(
  driverCoords: { latitude: number; longitude: number } | null,
  targetCoords: { latitude: number; longitude: number } | null,
  rideId: string | undefined,
  onArrived: () => void,
) {
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!driverCoords || !targetCoords || !rideId) return;
    if (firedRef.current === rideId) return;

    const dist = distanceMeters(driverCoords, targetCoords);

    if (dist <= ARRIVAL_RADIUS_M) {
      firedRef.current = rideId;
      onArrived();
    }
  }, [driverCoords?.latitude, driverCoords?.longitude, rideId]);

  useEffect(() => {
    firedRef.current = null;
  }, [rideId]);
}
