import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DriverRide } from '@/src/types';

const KEYS = {
  ASSIGNED: 'ryde:assigned_rides',
  ACTIVE: 'ryde:active_ride',
} as const;

// Strip PII before persisting to unencrypted AsyncStorage
function stripPII(ride: DriverRide): DriverRide {
  return { ...ride, email: '', number: '' };
}

export async function cacheAssignedRides(rides: DriverRide[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ASSIGNED, JSON.stringify(rides.map(stripPII)));
  } catch {}
}

export async function getCachedAssignedRides(): Promise<DriverRide[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ASSIGNED);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function cacheActiveRide(ride: DriverRide): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ACTIVE, JSON.stringify(stripPII(ride)));
  } catch {}
}

export async function getCachedActiveRide(): Promise<DriverRide | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ACTIVE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearRideCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([KEYS.ASSIGNED, KEYS.ACTIVE]);
  } catch {}
}
