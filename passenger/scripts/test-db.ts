import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';

// Load .env file
dotenv.config();

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId!)
  .setKey(apiKey!);

const databases = new Databases(client);

async function testDb() {
  try {
    await databases.create('testdb', 'Test DB');
    console.log('✅ Created testdb');
  } catch (error) {
    console.error('❌ Failed to create:', error);
  }
}

testDb();
