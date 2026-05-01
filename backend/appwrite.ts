import { Client, Databases, Users } from 'node-appwrite';
import * as dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!projectId || !apiKey) {
  throw new Error('APPWRITE_PROJECT_ID or APPWRITE_API_KEY is missing in environment variables');
}

export const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

export const databases = new Databases(client);
export const users = new Users(client);

export const databaseId = process.env.APPWRITE_DATABASE_ID || 'velo';

export const COLLECTIONS = {
  PROFILES: 'profiles',
  RIDES: 'rides',
  RIDE_EVENTS: 'ride_events',
  SAVED_PLACES: 'saved_places',
  VEHICLE_CLASSES: 'vehicle_classes',
  DRIVER_LOCATIONS: 'driver_locations',
};
