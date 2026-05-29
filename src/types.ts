// Shared domain types for the Front-Nexus stats dashboard.

export interface PlayerStats {
  /** Stable, URL-safe identifier used in player profile routes. */
  id: string;
  /** Display handle as shown in OpenFront.io. */
  username: string;
  /** Optional clan tag, e.g. "VOID". */
  clanTag: string | null;
  wins: number;
  losses: number;
  /** Kill/Death ratio. */
  kd: number;
  /** Matchmaking rating. */
  elo: number;
  /** Total FFA matches played (used for activity sorting). */
  matches: number;
  /** ISO date string of the player's most recent match. */
  lastActive: string;
}

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
}
