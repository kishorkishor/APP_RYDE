import { Client, Databases, DatabasesIndexType } from 'node-appwrite';
import * as dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const projectId = process.env.APPWRITE_PROJECT_ID;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'velo';
const apiKey = process.env.APPWRITE_API_KEY;

if (!projectId || !apiKey) {
  throw new Error('APPWRITE_PROJECT_ID or APPWRITE_API_KEY is missing');
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

const collectionId = 'ride_events';

async function ensureCollection() {
  try {
    await databases.createCollection(databaseId, collectionId, 'Ride Events');
    console.log('Created ride_events collection');
  } catch (err: any) {
    if (err.code !== 409) throw err;
    console.log('ride_events collection already exists');
  }
}

async function ensureStringAttribute(key: string, size: number, required = false) {
  try {
    await databases.createStringAttribute(databaseId, collectionId, key, size, required);
    console.log(`Created ${key}`);
  } catch (err: any) {
    if (err.code !== 409) throw err;
  }
}

async function ensureIndex(key: string, attributes: string[]) {
  try {
    await databases.createIndex(databaseId, collectionId, key, DatabasesIndexType.Key, attributes);
    console.log(`Created index ${key}`);
  } catch (err: any) {
    if (err.code !== 409) throw err;
  }
}

async function main() {
  await ensureCollection();
  await ensureStringAttribute('rideId', 64, true);
  await ensureStringAttribute('action', 64, true);
  await ensureStringAttribute('actorId', 64);
  await ensureStringAttribute('actorName', 128);
  await ensureStringAttribute('driverId', 64);
  await ensureStringAttribute('driverName', 128);
  await ensureStringAttribute('pickupAddress', 255);
  await ensureStringAttribute('dropoffAddress', 255);
  await ensureStringAttribute('notes', 1024);
  await ensureStringAttribute('createdAt', 64, true);
  await ensureIndex('idx_rideId', ['rideId']);
  await ensureIndex('idx_createdAt', ['createdAt']);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
