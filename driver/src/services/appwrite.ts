// ─── Appwrite Client (Driver App) ─────────────────────────────────────────────
import { Client, Account, Databases } from 'react-native-appwrite';

const endpoint =
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';
const databaseId =
  process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';
const platform =
  process.env.EXPO_PUBLIC_APPWRITE_PLATFORM || 'com.ryde.driver';

const client = new Client();

if (projectId) {
  client.setEndpoint(endpoint).setProject(projectId).setPlatform(platform);
}

export const account = new Account(client);
export const databases = new Databases(client);
export { client, databaseId };

// ─── Collection IDs (shared with rider app) ───────────────────────────────────
export const COLLECTIONS = {
  PROFILES: 'profiles',
  RIDES: 'rides',
  RIDE_EVENTS: 'ride_events',
  SAVED_PLACES: 'saved_places',
  CITIES: 'cities',
  VEHICLE_CLASSES: 'vehicle_classes',
  DRIVER_LOCATIONS: 'driver_locations',
} as const;
