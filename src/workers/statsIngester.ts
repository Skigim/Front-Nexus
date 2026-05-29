import { db } from '../firebase/config';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import type { PlayerStats } from '../types';

/**
 * OpenFront.io stats ingestion worker.
 * 
 * Fetches JSON snapshots from the OpenFront API, calculates derived 
 * metrics (ELO, K/D), and syncs them to Firestore.
 */
export async function runIngestion() {
  const API_ENDPOINT = import.meta.env.VITE_OPENFRONT_API_URL;
  
  if (!API_ENDPOINT) {
    console.warn('Worker: No VITE_OPENFRONT_API_URL configured.');
    return;
  }

  try {
    console.log('Worker: Starting ingestion pass...');
    
    // 1. Fetch raw data from OpenFront
    const response = await fetch(`${API_ENDPOINT}/stats/players`);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    
    const rawPlayers: any[] = await response.json();

    // 2. Map raw data to Front-Nexus schema
    const processedPlayers: PlayerStats[] = rawPlayers.map((raw) => {
      const wins = raw.ffa_wins || 0;
      const score = raw.ffa_score || 0;
      const matches = raw.total_games || 1; // avoid div by zero

      return {
        id: raw.user_id,
        username: raw.username,
        clanTag: raw.clan_tag || null,
        wins: wins,
        losses: matches - wins,
        kd: raw.kd || 1.0, // fallback if not in API
        elo: Math.floor((wins * 15) + (score / 10)), // Derived ELO formula
        matches: matches,
        lastActive: raw.updated_at || new Date().toISOString(),
        totalScore: score,
        avgScorePerMatch: score / matches,
        peakPosition: raw.position || 0,
      };
    });

    // 3. Batch write to Firestore
    const batch = writeBatch(db);
    processedPlayers.forEach((player) => {
      const playerRef = doc(db, 'players', player.id);
      batch.set(playerRef, {
        ...player,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });

    await batch.commit();
    console.log(`Worker: Successfully ingested ${processedPlayers.length} players.`);

    // 4. Update Ingestion Metadata
    const metaRef = doc(db, 'system', 'ingestion');
    await setDoc(metaRef, { lastSuccessfulRun: serverTimestamp() }, { merge: true });

  } catch (error) {
    console.error('Worker: Ingestion failed', error);
  }
}

// Internal helper for setDoc if not imported
import { setDoc as firestoreSetDoc } from 'firebase/firestore';
const setDoc = firestoreSetDoc;
