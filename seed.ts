import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore';
import { players, clans } from './src/data/mockData';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error('❌ Error: VITE_FIREBASE_API_KEY is missing in .env.local');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log('🚀 Starting database seed...');

  try {
    const batch = writeBatch(db);

    // Seed Players
    console.log(`- Queueing ${players.length} players...`);
    players.forEach((player) => {
      const playerRef = doc(collection(db, 'players'), player.id);
      batch.set(playerRef, player);
    });

    // Seed Clans
    console.log(`- Queueing ${clans.length} clans...`);
    clans.forEach((clan) => {
      const clanRef = doc(collection(db, 'clans'), clan.id);
      batch.set(clanRef, clan);
    });

    await batch.commit();
    console.log('✅ Success! Mock data pushed to Firestore.');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit();
  }
}

seed();
