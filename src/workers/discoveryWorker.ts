import { initializeApp } from 'firebase/app';
import { getFirestore, doc, collection, getDocs, writeBatch, serverTimestamp, query, limit } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';

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

const OPENFRONT_API = "https://api.openfront.io";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const GameResponseSchema = z.object({
  info: z.object({
    gameID: z.string(),
    config: z.object({
      gameMode: z.string(),
      gameType: z.string(),
    }),
    players: z.array(z.object({
      username: z.string(),
      clanTag: z.string().nullable().optional(),
      persistentID: z.string().nullable().optional(), // This is often null, but we'll try to use it
      clientID: z.string(),
    })),
  }),
});

async function discover() {
  console.log('🔍 Starting Discovery Worker (Game Scraping)...');

  // 1. Get seed players from existing Firestore
  const playersSnap = await getDocs(query(collection(db, 'players'), limit(50)));
  const seedPlayerIds = playersSnap.docs.map(doc => doc.id);

  const discoveredGameIds = new Set<string>();
  const discoveredPlayerIds = new Set<string>();

  // 2. Fetch game IDs from player profiles
  console.log(`📡 Fetching match history for ${seedPlayerIds.length} seed players...`);
  for (const publicId of seedPlayerIds) {
    try {
      const res = await fetch(`${OPENFRONT_API}/player/${publicId}`);
      if (!res.ok) continue;
      const json = await res.json();
      
      if (json.games && Array.isArray(json.games)) {
        json.games.forEach((g: any) => {
          if (g.gameId) discoveredGameIds.add(g.gameId);
        });
      }
      await sleep(55); // Rate limit
    } catch (e) {
      console.error(`Failed to fetch profile for ${publicId}`);
    }
  }

  console.log(`📦 Found ${discoveredGameIds.size} unique game IDs. Scraping details...`);

  // 3. Scrape games for new players
  let batch = writeBatch(db);
  let batchSize = 0;

  for (const gameId of Array.from(discoveredGameIds).slice(0, 20)) { // Limit to 20 games for initial test
    try {
      const res = await fetch(`${OPENFRONT_API}/game/${gameId}`);
      if (!res.ok) continue;
      const json = await res.json();
      const gameData = GameResponseSchema.parse(json);

      console.log(`🎮 Scraping game ${gameId} (${gameData.info.players.length} players)...`);

      for (const p of gameData.info.players) {
        // Since we can't reliably get the publicId (profile ID) from the game log (clientID changes)
        // We will store them in a 'discovered_players' collection for now, or attempt to find their profile
        // Wait, what if we use an index of username -> publicId? 
        // For now, let's just log them.
        
        // If we want to truly grow the database, we need the public_id. 
        // The game log doesn't have it. 
        // But wait... the 'persistentID' might be it if it's not null.
        if (p.persistentID) {
           const playerRef = doc(db, 'players', p.persistentID);
           batch.set(playerRef, {
             username: p.username,
             clanTag: p.clanTag || null,
             discoveredVia: gameId,
             updatedAt: serverTimestamp()
           }, { merge: true });
           batchSize++;
        }
      }

      await sleep(100); // Respect API
    } catch (e) {
      // console.error(`Failed to scrape game ${gameId}`);
    }

    if (batchSize >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      batchSize = 0;
    }
  }

  if (batchSize > 0) await batch.commit();
  console.log('✅ Discovery run complete.');
}

discover();
