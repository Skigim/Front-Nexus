import type { ClanRanking, PlayerStats } from '../types';

// ---------------------------------------------------------------------------
// Mock data layer.
//
// These sample arrays stand in for live Firestore reads while the MVP is wired
// up. Components import from here so the data source can later be swapped for
// real Firestore queries without touching the view layer.
// ---------------------------------------------------------------------------

export const players: PlayerStats[] = [
  {
    id: 'nyx',
    username: 'Nyx',
    clanTag: 'VOID',
    wins: 482,
    losses: 191,
    kd: 2.41,
    elo: 2187,
    matches: 673,
    lastActive: '2026-05-29',
  },
  {
    id: 'helios',
    username: 'Helios',
    clanTag: 'SOL',
    wins: 437,
    losses: 203,
    kd: 2.12,
    elo: 2104,
    matches: 640,
    lastActive: '2026-05-28',
  },
  {
    id: 'koval',
    username: 'Koval',
    clanTag: 'VOID',
    wins: 401,
    losses: 220,
    kd: 1.88,
    elo: 2056,
    matches: 621,
    lastActive: '2026-05-29',
  },
  {
    id: 'maple',
    username: 'Maple',
    clanTag: null,
    wins: 388,
    losses: 244,
    kd: 1.62,
    elo: 1990,
    matches: 632,
    lastActive: '2026-05-27',
  },
  {
    id: 'orenji',
    username: 'Orenji',
    clanTag: 'SOL',
    wins: 355,
    losses: 198,
    kd: 1.79,
    elo: 1962,
    matches: 553,
    lastActive: '2026-05-29',
  },
  {
    id: 'vex',
    username: 'Vex',
    clanTag: 'IRON',
    wins: 322,
    losses: 261,
    kd: 1.34,
    elo: 1888,
    matches: 583,
    lastActive: '2026-05-26',
  },
  {
    id: 'sable',
    username: 'Sable',
    clanTag: 'IRON',
    wins: 298,
    losses: 240,
    kd: 1.41,
    elo: 1851,
    matches: 538,
    lastActive: '2026-05-25',
  },
  {
    id: 'quill',
    username: 'Quill',
    clanTag: null,
    wins: 271,
    losses: 289,
    kd: 1.05,
    elo: 1772,
    matches: 560,
    lastActive: '2026-05-28',
  },
  {
    id: 'drift',
    username: 'Drift',
    clanTag: 'VOID',
    wins: 244,
    losses: 211,
    kd: 1.27,
    elo: 1740,
    matches: 455,
    lastActive: '2026-05-29',
  },
  {
    id: 'echo',
    username: 'Echo',
    clanTag: 'SOL',
    wins: 219,
    losses: 268,
    kd: 0.97,
    elo: 1683,
    matches: 487,
    lastActive: '2026-05-24',
  },
];

export const clans: ClanRanking[] = [
  {
    id: 'void',
    tag: 'VOID',
    name: 'Void Collective',
    elo: 2098,
    members: 24,
    wins: 1127,
    losses: 622,
  },
  {
    id: 'sol',
    tag: 'SOL',
    name: 'Solaris',
    elo: 2011,
    members: 31,
    wins: 1011,
    losses: 669,
  },
  {
    id: 'iron',
    tag: 'IRON',
    name: 'Ironclad',
    elo: 1869,
    members: 19,
    wins: 620,
    losses: 501,
  },
  {
    id: 'aether',
    tag: 'AETH',
    name: 'Aether Wing',
    elo: 1802,
    members: 16,
    wins: 488,
    losses: 430,
  },
];

/** Look up a single player by their URL id. */
export function getPlayerById(id: string): PlayerStats | undefined {
  return players.find((player) => player.id === id);
}

/** Win rate as a 0–1 fraction; 0 when the player has no recorded matches. */
export function winRate(player: Pick<PlayerStats, 'wins' | 'losses'>): number {
  const total = player.wins + player.losses;
  return total === 0 ? 0 : player.wins / total;
}
