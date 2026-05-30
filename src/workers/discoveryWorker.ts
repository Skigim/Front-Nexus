import { initializeApp } from 'firebase/app';
import { getFirestore, doc, collection, getDocs, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
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
    results: z.array(z.object({
      clientID: z.string(),
      score: z.number().optional(),
      kills: z.number().optional(),
      deaths: z.number().optional(),
      position: z.number().optional(),
      won: z.boolean().optional(),
    })).optional(),
    players: z.array(z.object({
      username: z.string(),
      clanTag: z.string().nullable().optional(),
      persistentID: z.string().nullable().optional(),
      clientID: z.string(),
    })),
  }),
});

async function discover() {
  console.log('🔍 Starting Deep Exhaustive Crawler...');

  const playersSnap = await getDocs(collection(db, 'players'));
  const allKnownPlayerIds = playersSnap.docs.map(doc => doc.id);
  
  console.log(`📡 Current Database: ${allKnownPlayerIds.length} players. Crawling their match history...`);

  const discoveredGameIds = new Set<string>();

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
      await sleep(20); 
    } catch (e) {
      console.error(`Failed to fetch history for ${publicId}`);
    }
  }

  console.log(`📦 Exhaustive list built: ${discoveredGameIds.size} total unique games found.`);
  console.log('⚙️ Starting deep scrape of game logs and extended stats...');

  let batch = writeBatch(db);
  let batchSize = 0;
  let gamesProcessed = 0;
  let newPlayersFound = 0;

  for (const gameId of Array.from(discoveredGameIds).reverse()) {
    try {
      const res = await fetch(`${OPENFRONT_API}/game/${gameId}`);
      if (!res.ok) continue;
      const json = await res.json();
      const gameData = GameResponseSchema.parse(json);

      gamesProcessed++;
      const gameType = gameData.info.config.gameType;
      
      for (const p of gameData.info.players) {
        if (p.persistentID) {
           const result = gameData.info.results?.find(r => r.clientID === p.clientID);
           const playerRef = doc(db, 'players', p.persistentID);

           const statsUpdate: any = {
             username: p.username,
             clanTag: p.clanTag || null,
             lastSeenGame: gameId,
             updatedAt: serverTimestamp(),
           };

           if (result) {
              const gameTypeKey = `gameTypeStats.${gameType || 'unknown'}`;
              statsUpdate[`${gameTypeKey}.wins`] = increment(result.won ? 1 : 0);
              statsUpdate[`${gameTypeKey}.matches`] = increment(1);
              statsUpdate[`${gameTypeKey}.score`] = increment(result.score || 0);
              
              statsUpdate.totalScore = increment(result.score || 0);
              statsUpdate.wins = increment(result.won ? 1 : 0);
              statsUpdate.matches = increment(1);
           }

           batch.set(playerRef, statsUpdate, { merge: true });
           batchSize++;
           newPlayersFound++;
        }
      }

      if (gamesProcessed % 20 === 0) {
        console.log(`📊 Progress: ${gamesProcessed}/${discoveredGameIds.size} games | ${newPlayersFound} player records updated.`);
      }

      await sleep(20); 
    } catch (e) {
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
