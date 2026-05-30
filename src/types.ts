// Shared domain types for the Front-Nexus stats dashboard.

export interface PlayerStats {
  id: string;
  username: string;
  clanTag: string | null;
  wins: number;
  losses: number;
  kd: number;
  elo: number;
  matches: number;
  lastActive: string;
  totalScore: number;
  avgScorePerMatch: number;
  peakPosition: number;
  ffaWins: number;
  ffaScore: number;
  teamWins: number;
  teamScore: number;
  // Deep tracking extensions
  lastSeenGame?: string;
  persistentID?: string | null;
  platform?: string;
  gameTypeStats?: Record<string, {
    wins: number;
    matches: number;
    score: number;
  }>;
}

/** Alias for PlayerStats used in components */
export type Player = PlayerStats;

export interface ClanRanking {
  id: string;
  /** Short tag rendered in tables, e.g. "VOID". */
  tag: string;
  name: string;
  /** Aggregate clan rating. */
  elo: number;
  members: number;
  wins: number;
  losses: number;
  games: number;
  weightedWLRatio: number;
  // FFA specific
  ffaWins: number;
  ffaScore: number;
  // Team specific
  teamWins: number;
  teamScore: number;
}
