import { initializeApp } from 'firebase/app';
import { getFirestore, doc, collection, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
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
  console.log('🔍 Starting Deep Exhaustive Crawler...');

  // 1. Get ALL players from our current DB to find their full history
  // Initially we fetch more seed players to expand the net
  const playersSnap = await getDocs(collection(db, 'players'));
  const allKnownPlayerIds = playersSnap.docs.map(doc => doc.id);
  
  console.log(`📡 Current Database: ${allKnownPlayerIds.length} players. Crawling their match history...`);

  const discoveredGameIds = new Set<string>();

  // 2. Deep Match Extraction
  // We don't just get 20, we want to sniff out every game we can find
  for (const publicId of allKnownPlayerIds) {
    try {
      const res = await fetch(`${OPENFRONT_API}/player/${publicId}`);
      if (!res.ok) continue;
      const json = await res.json();
      
      if (json.games && Array.isArray(json.games)) {
        json.games.forEach((g: any) => {
          if (g.gameId) discoveredGameIds.add(g.gameId);
        });
      }
      // Speed up slightly but stay safe
      await sleep(40); 
    } catch (e) {
      console.error(`Failed to fetch history for ${publicId}`);
    }
  }

  console.log(`📦 Exhaustive list built: ${discoveredGameIds.size} total unique games found.`);
  console.log('⚙️ Starting deep scrape of game logs...');

  // 3. Scrape EVERYTHING
  let batch = writeBatch(db);
  let batchSize = 0;
  let gamesProcessed = 0;
  let newPlayersFound = 0;

  for (const gameId of Array.from(discoveredGameIds)) {
    try {
      // Check if we've already processed this game? 
      // For now, we overwrite to keep stats fresh-ish
      
      const res = await fetch(`${OPENFRONT_API}/game/${gameId}`);
      if (!res.ok) continue;
      const json = await res.json();
      const gameData = GameResponseSchema.parse(json);

      gamesProcessed++;
      
      for (const p of gameData.info.players) {
        if (p.persistentID) {
           const playerRef = doc(db, 'players', p.persistentID);
           batch.set(playerRef, {
             username: p.username,
             clanTag: p.clanTag || null,
             lastSeenGame: gameId,
             updatedAt: serverTimestamp(),
             // We can also store game metadata here if needed
           }, { merge: true });
           batchSize++;
           newPlayersFound++;
        }
      }

      if (gamesProcessed % 20 === 0) {
        console.log(`📊 Progress: ${gamesProcessed}/${discoveredGameIds.size} games | ${newPlayersFound} player records updated.`);
      }

      await sleep(40); 
    } catch (e) {
      // Ignore parse/fetch errors
    }

    if (batchSize >= 450) {
      await batch.commit();
      batch = writeBatch(db);
      batchSize = 0;
      console.log('💾 Firestore Batch Sync Complete.');
    }
  }

  if (batchSize > 0) await batch.commit();
  console.log(`✅ EXHAUSTIVE CRAWL COMPLETE.`);
  console.log(`🏁 Total Games Scanned: ${gamesProcessed}`);
  console.log(`👤 Total Player/Game Links Processed: ${newPlayersFound}`);
}

discover();
