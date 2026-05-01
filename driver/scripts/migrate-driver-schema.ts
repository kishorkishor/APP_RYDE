#!/usr/bin/env ts-node
// ─── Driver Schema Migration Script ──────────────────────────────────────────
// Safely adds optional driver progress fields to the 'rides' Appwrite collection.
// Run with: npx ts-node scripts/migrate-driver-schema.ts
// Requires APPWRITE_API_KEY in environment (server-side only, never in app).
// This script is IDEMPOTENT — safe to run multiple times.
// ─────────────────────────────────────────────────────────────────────────────
import { Client, Databases } from 'node-appwrite';
import 'dotenv/config';

const ENDPOINT =
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID =
  process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '69ea59a700081d8ec806';
const DATABASE_ID =
  process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '69ea59ef00258ac48b94';
const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
  console.error('❌ APPWRITE_API_KEY is required. Set it in your environment (not in the app .env).');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

const RIDES_COLLECTION = 'rides';
const PROFILES_COLLECTION = 'profiles';

// Fields to add to 'rides' collection
const RIDE_FIELDS = [
  {
    key: 'driverProgress',
    type: 'string',
    size: 64,
    required: false,
    default: null,
    description: 'Driver workflow progress: heading_pickup | arrived | in_progress | completed',
  },
  {
    key: 'passengerVerified',
    type: 'boolean',
    required: false,
    default: false,
    description: 'Whether driver has verified passenger via QR scan',
  },
  {
    key: 'verifiedAt',
    type: 'string',
    size: 64,
    required: false,
    default: null,
    description: 'ISO timestamp when passenger was verified',
  },
  {
    key: 'completedAt',
    type: 'string',
    size: 64,
    required: false,
    default: null,
    description: 'ISO timestamp when ride was completed by driver',
  },
  {
    key: 'issueStatus',
    type: 'string',
    size: 128,
    required: false,
    default: null,
    description: 'Issue reason reported by driver',
  },
  {
    key: 'issueNote',
    type: 'string',
    size: 1024,
    required: false,
    default: null,
    description: 'Free-text issue note from driver',
  },
];

// Fields to add to 'profiles' collection (for driver profiles)
const PROFILE_DRIVER_FIELDS = [
  {
    key: 'isOnline',
    type: 'boolean',
    required: false,
    default: true,
    description: 'Whether driver is currently online/available',
  },
  {
    key: 'vehicleLabel',
    type: 'string',
    size: 128,
    required: false,
    default: null,
    description: 'Driver vehicle name (e.g. Lexus ES 350)',
  },
  {
    key: 'plateNumber',
    type: 'string',
    size: 32,
    required: false,
    default: null,
    description: 'Vehicle plate number',
  },
  {
    key: 'rideType',
    type: 'string',
    size: 50,
    required: false,
    default: null,
    description: 'Driver vehicle/service class',
  },
  {
    key: 'currentRideId',
    type: 'string',
    size: 64,
    required: false,
    default: null,
    description: 'ID of the ride currently assigned to this driver',
  },
];

async function getExistingAttributes(collectionId: string): Promise<string[]> {
  const result = await databases.listAttributes(DATABASE_ID, collectionId);
  return result.attributes.map((attr: any) => attr.key);
}

async function addStringAttribute(
  collectionId: string,
  key: string,
  size: number,
  required: boolean,
  defaultValue: string | null
) {
  await databases.createStringAttribute(
    DATABASE_ID,
    collectionId,
    key,
    size,
    required,
    defaultValue ?? undefined
  );
  console.log(`  ✅ Added string attribute: ${key}`);
}

async function addBooleanAttribute(
  collectionId: string,
  key: string,
  required: boolean,
  defaultValue: boolean
) {
  await databases.createBooleanAttribute(
    DATABASE_ID,
    collectionId,
    key,
    required,
    defaultValue
  );
  console.log(`  ✅ Added boolean attribute: ${key}`);
}

async function migrateCollection(
  collectionId: string,
  fields: typeof RIDE_FIELDS
) {
  console.log(`\n📋 Migrating collection: ${collectionId}`);
  const existing = await getExistingAttributes(collectionId);
  console.log(`   Existing attributes: ${existing.join(', ') || 'none'}`);

  for (const field of fields) {
    if (existing.includes(field.key)) {
      console.log(`  ⏭️  Skipping ${field.key} (already exists)`);
      continue;
    }

    try {
      if (field.type === 'boolean') {
        await addBooleanAttribute(
          collectionId,
          field.key,
          field.required,
          field.default as boolean
        );
      } else {
        await addStringAttribute(
          collectionId,
          field.key,
          field.size ?? 256,
          field.required,
          field.default as string | null
        );
      }
      // Appwrite needs a small delay between attribute creations
      await new Promise((r) => setTimeout(r, 500));
    } catch (err: any) {
      if (err?.code === 409 || err?.message?.includes('already exists')) {
        console.log(`  ⏭️  Skipping ${field.key} (already exists, caught)`);
      } else {
        console.error(`  ❌ Failed to add ${field.key}:`, err?.message);
      }
    }
  }
}

async function createIndexIfMissing(collectionId: string, key: string, attributes: string[]) {
  try {
    const indexes = await databases.listIndexes(DATABASE_ID, collectionId);
    if (indexes.indexes.some((index: any) => index.key === key)) {
      console.log(`  ⏭️  Skipping index ${key} (already exists)`);
      return;
    }
    await databases.createIndex(DATABASE_ID, collectionId, key, 'key' as any, attributes);
    console.log(`  ✅ Added index: ${key}`);
  } catch (err: any) {
    if (err?.code === 409 || err?.message?.includes('already exists')) {
      console.log(`  ⏭️  Skipping index ${key} (already exists, caught)`);
    } else {
      console.error(`  ❌ Failed to add index ${key}:`, err?.message);
    }
  }
}

async function main() {
  console.log('🚀 RYDE Driver Schema Migration');
  console.log(`   Endpoint: ${ENDPOINT}`);
  console.log(`   Project:  ${PROJECT_ID}`);
  console.log(`   Database: ${DATABASE_ID}`);

  await migrateCollection(RIDES_COLLECTION, RIDE_FIELDS);
  await migrateCollection(PROFILES_COLLECTION, PROFILE_DRIVER_FIELDS);

  console.log('\n🔍 Ensuring driver query indexes...');
  await createIndexIfMissing(RIDES_COLLECTION, 'idx_driverId', ['driverId']);
  await createIndexIfMissing(RIDES_COLLECTION, 'idx_requestType', ['requestType']);
  await createIndexIfMissing(RIDES_COLLECTION, 'idx_status', ['status']);
  await createIndexIfMissing(RIDES_COLLECTION, 'idx_scheduledPickupAt', ['scheduledPickupAt']);
  await createIndexIfMissing(PROFILES_COLLECTION, 'idx_role', ['role']);

  console.log('\n✅ Migration complete!');
  console.log('   All new fields are optional — existing data is unaffected.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
