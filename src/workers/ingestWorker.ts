import { initializeApp } from 'firebase/app';
import { getFirestore, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
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

// --- Zod Schemas ---

const LeaderboardPlayerSchema = z.object({
  public_id: z.string(),
  username: z.string(),
  elo: z.number().optional().default(0),
  clanTag: z.string().nullable().optional(),
  rank: z.number().optional(),
});

const LeaderboardResponseSchema = z.object({
  "1v1": z.array(LeaderboardPlayerSchema),
});

const RankedStatsSchema = z.object({
  wins: z.coerce.number().optional().default(0),
  losses: z.coerce.number().optional().default(0),
  elo: z.coerce.number().optional().default(0),
  matches: z.coerce.number().optional().default(0),
  kd: z.coerce.number().optional().default(0),
  score: z.coerce.number().optional().default(0),
});

const PlayerProfileSchema = z.object({
  stats: z.object({
    Ranked: z.object({
      "1v1": RankedStatsSchema.optional(),
      "Teams": RankedStatsSchema.optional(),
    }).optional(),
  }).optional(),
});

const ClanLeaderboardItemSchema = z.object({
  clanTag: z.string(),
  wins: z.coerce.number().optional().default(0),
  losses: z.coerce.number().optional().default(0),
  games: z.coerce.number().optional().default(0),
  weightedWLRatio: z.coerce.number().optional().default(0),
});

const ClanLeaderboardResponseSchema = z.array(ClanLeaderboardItemSchema);

if (!firebaseConfig.apiKey) {
  console.error('❌ Error: VITE_FIREBASE_API_KEY is missing in .env.local');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPlayerProfile(publicId: string) {
  try {
    const res = await fetch(`${OPENFRONT_API}/player/${publicId}`);
    if (!res.ok) return null;
    const json = await res.json();
    return PlayerProfileSchema.parse(json);
  } catch (e) {
    return null;
  }
}

/**
 * Worker Logic: 
 * 1. Fetch Players from OpenFront (1v1 & Teams).
 * 2. Fetch detailed profiles (respecting rate limits).
 * 3. Fetch Clan leaderboard.
 * 4. Update Firestore in batches.
 */
async function ingest() {
  console.log('🚀 Starting OpenFront Ingestion...');

  try {
    // 1. FETCH PLAYERS
    const modes = ['ranked_1v1', 'ranked_teams', 'ranked_ffa', 'ranked_duel', 'unranked'];
    const allPlayers: Map<string, any> = new Map();

    for (const mode of modes) {
      for (let page = 1; page <= 2; page++) {
        console.log(`📡 Fetching ${mode} leaderboard (page ${page})...`);
        const response = await fetch(`${OPENFRONT_API}/leaderboard/ranked?page=${page}&type=${mode}`);
        if (!response.ok) {
          console.error(`❌ Failed to fetch ${mode} page ${page}: ${response.status}`);
          continue;
        }
        
        const rawData = await response.json();
        if (!rawData["1v1"] || !Array.isArray(rawData["1v1"])) {
          console.log(`⚠️ No player data found for ${mode} page ${page}.`);
          continue;
        }

        const validatedData = LeaderboardResponseSchema.parse(rawData);
        const players = validatedData["1v1"];

        console.log(`📦 Found ${players.length} players in ${mode} (page ${page}).`);

        for (const p of players) {
          if (!allPlayers.has(p.public_id)) {
            allPlayers.set(p.public_id, p);
          }
        }
      }
    }

    // 2. FETCH DETAILED PROFILES & SYNC PLAYERS
    console.log(`👤 Fetching detailed profiles for ${allPlayers.size} players (respecting 20 req/sec limit)...`);
    
    let batch = writeBatch(db);
    let count = 0;
    let batchSize = 0;

    for (const [publicId, baseInfo] of allPlayers.entries()) {
      count++;
      if (count % 10 === 0) console.log(`  Processing player ${count}/${allPlayers.size}...`);
      
      const profile = await fetchPlayerProfile(publicId);
      // Wait ~55ms between profile fetches to respect 20 req/sec limit
      await sleep(55);

      const stats1v1 = profile?.stats?.Ranked?.["1v1"];
      const statsTeams = profile?.stats?.Ranked?.["Teams"];

      const playerRef = doc(db, 'players', publicId);
      const playerUpdate = {
        id: publicId,
        username: baseInfo.username,
        clanTag: baseInfo.clanTag || null,
        elo: baseInfo.elo || (stats1v1?.elo || 0),
        
        // mode specific
        ffaWins: stats1v1?.wins || 0,
        ffaScore: stats1v1?.score || 0,
        teamWins: statsTeams?.wins || 0,
        teamScore: statsTeams?.score || 0,

        // Aggregate Totals
        wins: (stats1v1?.wins || 0) + (statsTeams?.wins || 0),
        losses: (stats1v1?.losses || 0) + (statsTeams?.losses || 0),
        matches: (stats1v1?.matches || 0) + (statsTeams?.matches || 0),
        kd: stats1v1?.kd || statsTeams?.kd || 0,
        totalScore: (stats1v1?.score || 0) + (statsTeams?.score || 0),
        avgScorePerMatch: ((stats1v1?.score || 0) + (statsTeams?.score || 0)) / ((stats1v1?.matches || 0) + (statsTeams?.matches || 0) || 1),
        
        lastActive: new Date().toISOString(),
        peakPosition: baseInfo.rank || 0,
        updatedAt: serverTimestamp()
      };

      batch.set(playerRef, playerUpdate, { merge: true });
      batchSize++;

      if (batchSize >= 400) {
        console.log('💾 Committing player batch...');
        await batch.commit();
        batch = writeBatch(db);
        batchSize = 0;
      }
    }

    // 3. FETCH CLANS
    console.log('📡 Fetching clan leaderboard...');
    const clanRes = await fetch(`${OPENFRONT_API}/public/clans/leaderboard`);
    if (clanRes.ok) {
      const clanData = await clanRes.json();
      console.log('📦 Processing clan leaderboard...');
      
      const clanList = Array.isArray(clanData) ? clanData : (clanData.clans || []);
      const validatedClans = z.array(ClanLeaderboardItemSchema).parse(clanList);
      
      for (const clan of validatedClans) {
        const clanRef = doc(db, 'clans', clan.clanTag);
        batch.set(clanRef, {
          id: clan.clanTag,
          tag: clan.clanTag,
          name: clan.clanTag, // API doesn't provide full name here
          elo: Math.floor(clan.weightedWLRatio * 1000), // Derived ELO
          members: 0,
          wins: clan.wins,
          losses: clan.losses,
          ffaWins: 0,
          ffaScore: 0,
          teamWins: 0,
          teamScore: 0,
          updatedAt: serverTimestamp()
        }, { merge: true });
        batchSize++;

        if (batchSize >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          batchSize = 0;
        }
      }
    }

    // 4. Update System Metadata
    const metaRef = doc(db, 'system', 'ingestion');
    batch.set(metaRef, {
      lastSuccessfulRun: serverTimestamp(),
      playerCount: allPlayers.size
    }, { merge: true });

    await batch.commit();
    console.log('✅ Ingestion Complete. Firestore updated.');

  } catch (err) {
    console.error('❌ Ingestion failed:', err);
  } finally {
    process.exit();
  }
}

ingest();
