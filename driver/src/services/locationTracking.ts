import * as Location from 'expo-location';
import { Permission, Role } from 'react-native-appwrite';
import { databases, databaseId, COLLECTIONS } from '@/src/services/appwrite';
import { withRetry } from '@/src/services/withRetry';
import { Sentry } from '@/src/services/sentry';
import type { DriverRide } from '@/src/types';

type TrackingMode = 'offline' | 'idle' | 'assigned' | 'on_trip';

type LastUpload = {
  latitude: number;
  longitude: number;
  uploadedAt: number;
};

const RULES: Record<Exclude<TrackingMode, 'offline'>, { intervalMs: number; distanceMeters: number; accuracy: Location.Accuracy }> = {
  idle: { intervalMs: 45_000, distanceMeters: 50, accuracy: Location.Accuracy.Balanced },
  assigned: { intervalMs: 10_000, distanceMeters: 20, accuracy: Location.Accuracy.High },
  on_trip: { intervalMs: 5_000, distanceMeters: 10, accuracy: Location.Accuracy.High },
};

let subscription: Location.LocationSubscription | null = null;
let lastUpload: LastUpload | null = null;

export const distanceMeters = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const radius = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const getMode = (isOnline: boolean, activeRide: DriverRide | null): TrackingMode => {
  if (!isOnline) return 'offline';
  if (activeRide?.status === 'in_progress' || activeRide?.driverProgress === 'in_progress') return 'on_trip';
  if (activeRide?.id) return 'assigned';
  return 'idle';
};

type DriverLocationStatus = 'idle' | 'assigned' | 'on_trip';

const toStatus = (mode: Exclude<TrackingMode, 'offline'>): DriverLocationStatus => {
  if (mode === 'on_trip') return 'on_trip';
  if (mode === 'assigned') return 'assigned';
  return 'idle';
};

export const stopDriverLocationTracking = () => {
  subscription?.remove();
  subscription = null;
  lastUpload = null;
};

const uploadDriverLocation = async (
  driverId: string,
  ride: DriverRide | null,
  loc: Location.LocationObject,
  mode: Exclude<TrackingMode, 'offline'>,
) => {
  const now = new Date().toISOString();
  const data = {
    driverId,
    rideId: ride?.id ?? null,
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
    heading: loc.coords.heading ?? null,
    speed: loc.coords.speed ?? null,
    accuracy: loc.coords.accuracy ?? null,
    status: toStatus(mode),
    updatedAt: now,
  };

  const permissions = [
    Permission.read(Role.user(driverId)),
    Permission.update(Role.user(driverId)),
    Permission.delete(Role.user(driverId)),
  ];

  if (ride?.riderId) {
    permissions.push(Permission.read(Role.user(ride.riderId)));
  }

  await withRetry(
    () =>
      databases.upsertDocument({
        databaseId,
        collectionId: COLLECTIONS.DRIVER_LOCATIONS,
        documentId: driverId,
        data,
        permissions,
      }),
    { maxAttempts: 2, baseDelayMs: 2000 },
  );
};

export const startDriverLocationTracking = async (
  driverId: string,
  isOnline: boolean,
  activeRide: DriverRide | null,
  onLocalLocation?: (coords: { latitude: number; longitude: number }) => void,
) => {
  stopDriverLocationTracking();

  const mode = getMode(isOnline, activeRide);
  if (mode === 'offline') return;

  const rule = RULES[mode];
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return;

  subscription = await Location.watchPositionAsync(
    {
      accuracy: rule.accuracy,
      timeInterval: Math.max(1000, Math.floor(rule.intervalMs / 2)),
      distanceInterval: Math.max(5, Math.floor(rule.distanceMeters / 2)),
    },
    async (loc) => {
      const current = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      onLocalLocation?.(current);

      const now = Date.now();
      const shouldUpload =
        !lastUpload ||
        now - lastUpload.uploadedAt >= rule.intervalMs ||
        distanceMeters(lastUpload, current) >= rule.distanceMeters;

      if (!shouldUpload) return;

      try {
        await uploadDriverLocation(driverId, activeRide, loc, mode);
        lastUpload = { ...current, uploadedAt: now };
      } catch (error) {
        Sentry.captureException(error);
      }
    },
  );
};
