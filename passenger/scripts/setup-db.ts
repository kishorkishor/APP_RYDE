import { Client, Databases, DatabasesIndexType } from 'node-appwrite';
import * as dotenv from 'dotenv';

// Load .env file
dotenv.config();

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'velo';
const apiKey = process.env.APPWRITE_API_KEY;

if (!projectId || !apiKey) {
  console.error('❌ Error: EXPO_PUBLIC_APPWRITE_PROJECT_ID or APPWRITE_API_KEY is missing in .env');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

const COLLECTIONS = [
  { id: 'profiles', name: 'Profiles' },
  { id: 'rides', name: 'Rides' },
  { id: 'ride_events', name: 'Ride Events' },
  { id: 'saved_places', name: 'Saved Places' },
  { id: 'vehicle_classes', name: 'Vehicle Classes' },
  { id: 'driver_locations', name: 'Driver Locations' }
];

async function setupDatabase() {
  console.log('🚀 Starting Appwrite Database Setup...');

  try {
    // 1. Ensure Collections Exist
    for (const coll of COLLECTIONS) {
      try {
        await databases.createCollection(databaseId, coll.id, coll.name);
        console.log(`✅ Collection created: ${coll.name}`);
      } catch (e: any) {
        if (e.code === 409) {
          console.log(`ℹ️ Collection already exists: ${coll.name}`);
        } else {
          throw e;
        }
      }
    }

    // 2. Setup Profiles
    console.log('\n📝 Setting up Profiles attributes...');
    await createAttributeString('profiles', 'passengerName', 100, true);
    await createAttributeString('profiles', 'projectLeader', 100, true);
    await createAttributeString('profiles', 'projectCode', 50, true);
    await createAttributeString('profiles', 'email', 100, true);
    await createAttributeString('profiles', 'number', 20, true);
    await createAttributeString('profiles', 'role', 50, false); // rider, driver, admin
    await createAttributeString('profiles', 'companyName', 100, false);
    await createAttributeString('profiles', 'avatarUrl', 500, false);
    await createAttributeString('profiles', 'driverPhotoUrl', 500, false);
    await createAttributeString('profiles', 'vehiclePhotoUrl', 500, false);
    await createAttributeFloat('profiles', 'rating', false);
    await createAttributeInteger('profiles', 'totalTrips', false);
    await createAttributeString('profiles', 'vehicleLabel', 128, false);
    await createAttributeString('profiles', 'plateNumber', 32, false);
    await createAttributeString('profiles', 'rideType', 50, false);
    await createAttributeBoolean('profiles', 'isOnline', false);
    await createAttributeString('profiles', 'currentRideId', 64, false);

    console.log('🔍 Creating Profiles indexes...');
    await createIndex('profiles', 'idx_role', ['role']);

    // 3. Setup Rides
    console.log('\n📝 Setting up Rides attributes...');
    await createAttributeString('rides', 'riderId', 50, true);
    await createAttributeString('rides', 'passengerName', 100, false);
    await createAttributeString('rides', 'email', 100, false);
    await createAttributeString('rides', 'projectCode', 50, false);
    await createAttributeString('rides', 'projectLeader', 100, false);
    await createAttributeString('rides', 'companyName', 100, false);
    await createAttributeString('rides', 'number', 20, false);
    await createAttributeString('rides', 'status', 20, true); // pending, accepted, assigned, in_progress, completed, cancelled
    await createAttributeString('rides', 'adminStatus', 50, false); // pending_admin_assignment, assigned, dispatched, completed, cancelled
    await createAttributeFloat('rides', 'pickupLat', true);
    await createAttributeFloat('rides', 'pickupLng', true);
    await createAttributeString('rides', 'pickupAddress', 255, true);
    await createAttributeFloat('rides', 'dropoffLat', true);
    await createAttributeFloat('rides', 'dropoffLng', true);
    await createAttributeString('rides', 'dropoffAddress', 255, true);
    await createAttributeString('rides', 'rideType', 50, true);
    await createAttributeFloat('rides', 'fareAmount', true);
    await createAttributeFloat('rides', 'distanceKm', false);
    await createAttributeInteger('rides', 'durationMinutes', false);
    await createAttributeString('rides', 'requestType', 20, false); // now, scheduled
    await createAttributeString('rides', 'scheduledPickupAt', 50, false);
    await createAttributeString('rides', 'requestedAt', 50, false);
    await createAttributeString('rides', 'driverId', 50, false);
    await createAttributeString('rides', 'driverName', 100, false);
    await createAttributeString('rides', 'driverPhone', 20, false);
    await createAttributeString('rides', 'vehicleLabel', 100, false);
    await createAttributeString('rides', 'driverProgress', 64, false);
    await createAttributeBoolean('rides', 'passengerVerified', false);
    await createAttributeString('rides', 'verifiedAt', 64, false);
    await createAttributeString('rides', 'completedAt', 64, false);
    await createAttributeString('rides', 'issueStatus', 128, false);
    await createAttributeString('rides', 'issueNote', 1024, false);

    console.log('🔍 Creating Rides indexes...');
    await createIndex('rides', 'idx_status', ['status']);
    await createIndex('rides', 'idx_adminStatus', ['adminStatus']);
    await createIndex('rides', 'idx_projectCode', ['projectCode']);
    await createIndex('rides', 'idx_riderId', ['riderId']);
    await createIndex('rides', 'idx_requestedAt', ['requestedAt']);
    await createIndex('rides', 'idx_driverId', ['driverId']);
    await createIndex('rides', 'idx_requestType', ['requestType']);
    await createIndex('rides', 'idx_scheduledPickupAt', ['scheduledPickupAt']);

    // 3b. Setup Ride Events
    console.log('\nSetting up Ride Events attributes...');
    await createAttributeString('ride_events', 'rideId', 64, true);
    await createAttributeString('ride_events', 'action', 64, true);
    await createAttributeString('ride_events', 'actorId', 64, false);
    await createAttributeString('ride_events', 'actorName', 128, false);
    await createAttributeString('ride_events', 'driverId', 64, false);
    await createAttributeString('ride_events', 'driverName', 128, false);
    await createAttributeString('ride_events', 'pickupAddress', 255, false);
    await createAttributeString('ride_events', 'dropoffAddress', 255, false);
    await createAttributeString('ride_events', 'notes', 1024, false);
    await createAttributeString('ride_events', 'createdAt', 64, true);

    console.log('Creating Ride Events indexes...');
    await createIndex('ride_events', 'idx_rideId', ['rideId']);
    await createIndex('ride_events', 'idx_createdAt', ['createdAt']);

    // 4. Setup Saved Places
    console.log('\n📝 Setting up Saved Places attributes...');
    await createAttributeString('saved_places', 'riderId', 50, true);
    await createAttributeString('saved_places', 'label', 100, true);
    await createAttributeString('saved_places', 'address', 255, true);
    await createAttributeFloat('saved_places', 'latitude', true);
    await createAttributeFloat('saved_places', 'longitude', true);
    await createAttributeString('saved_places', 'kind', 50, true); // home, work, saved

    // 5. Setup Vehicle Classes
    console.log('\n📝 Setting up Vehicle Classes attributes...');
    await createAttributeString('vehicle_classes', 'name', 100, true);
    await createAttributeString('vehicle_classes', 'tagline', 255, false);
    await createAttributeInteger('vehicle_classes', 'capacity', false);
    await createAttributeInteger('vehicle_classes', 'availabilityCount', false);
    await createAttributeInteger('vehicle_classes', 'sortOrder', false);
    await createAttributeBoolean('vehicle_classes', 'isActive', false);

    // 6. Setup Driver Locations
    console.log('\n📝 Setting up Driver Locations attributes...');
    await createAttributeString('driver_locations', 'driverId', 50, true);
    await createAttributeString('driver_locations', 'rideId', 50, false);
    await createAttributeFloat('driver_locations', 'lat', true);
    await createAttributeFloat('driver_locations', 'lng', true);
    await createAttributeFloat('driver_locations', 'heading', false);
    await createAttributeFloat('driver_locations', 'speed', false);
    await createAttributeFloat('driver_locations', 'accuracy', false);
    await createAttributeString('driver_locations', 'status', 20, true);
    await createAttributeString('driver_locations', 'updatedAt', 50, true);

    console.log('🔍 Creating Driver Locations indexes...');
    await createIndex('driver_locations', 'idx_driverId', ['driverId']);
    await createIndex('driver_locations', 'idx_rideId', ['rideId']);

    console.log('\n🎉 Setup complete! Check your Appwrite console.');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Helpers
async function createAttributeString(collectionId: string, key: string, size: number, required: boolean) {
  try { await databases.createStringAttribute(databaseId, collectionId, key, size, required); }
  catch (e: any) { if (e.code !== 409) console.error(`Error creating ${key} in ${collectionId}:`, e.message); }
}

async function createAttributeFloat(collectionId: string, key: string, required: boolean) {
  try { await databases.createFloatAttribute(databaseId, collectionId, key, required); }
  catch (e: any) { if (e.code !== 409) console.error(`Error creating ${key} in ${collectionId}:`, e.message); }
}

async function createAttributeInteger(collectionId: string, key: string, required: boolean) {
  try { await databases.createIntegerAttribute(databaseId, collectionId, key, required); }
  catch (e: any) { if (e.code !== 409) console.error(`Error creating ${key} in ${collectionId}:`, e.message); }
}

async function createAttributeBoolean(collectionId: string, key: string, required: boolean) {
  try { await databases.createBooleanAttribute(databaseId, collectionId, key, required); }
  catch (e: any) { if (e.code !== 409) console.error(`Error creating ${key} in ${collectionId}:`, e.message); }
}

async function createIndex(collectionId: string, key: string, attributes: string[]) {
  try { await databases.createIndex(databaseId, collectionId, key, DatabasesIndexType.Key, attributes); }
  catch (e: any) { if (e.code !== 409) console.error(`Error creating index ${key} in ${collectionId}:`, e.message); }
}

setupDatabase();
