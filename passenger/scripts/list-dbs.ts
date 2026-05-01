import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';

// Load .env file
dotenv.config();

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!projectId || !apiKey) {
  console.error('❌ Error: Missing credentials.');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function listDbs() {
  try {
    const response = await databases.list();
    console.log('\n📦 Existing Databases in your Project:');
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Failed to list databases:', error);
  }
}

listDbs();
