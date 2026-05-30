import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, isMock } from '../firebase/config';
import { type Player } from '../types';
import { winRate } from '../utils';

interface StatTileProps {
  label: string;
  value: string;
  emphasize?: boolean;
}

type GameTypeStat = Partial<Record<'wins' | 'matches' | 'score', number>>;

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function getTotalMatches(player: Player): number {
  const legacyPlayer = player as Player & {
    totalGames?: number;
    total_games?: number;
    games?: number;
  };

  const directMatches =
    toNumber(player.matches) ||
    toNumber(legacyPlayer.totalGames) ||
    toNumber(legacyPlayer.total_games) ||
    toNumber(legacyPlayer.games);

  if (directMatches > 0) return directMatches;
  return toNumber(player.wins) + toNumber(player.losses);
}

function getQueueStats(
  gameTypeStats: Player['gameTypeStats'],
  queue: 'FFA' | 'Team' | 'Modified'
): GameTypeStat | undefined {
  if (!gameTypeStats) return undefined;

  const queueAliases: Record<typeof queue, string[]> = {
    FFA: ['FFA', '1v1', 'ffa', 'ranked_ffa'],
    Team: ['Team', 'Teams', 'team', 'ranked_teams'],
    Modified: ['Modified', 'Duel', 'duel', 'ranked_duel', 'unknown'],
  };

  for (const key of queueAliases[queue]) {
    const stats = gameTypeStats[key] as GameTypeStat | undefined;
    if (stats) return stats;
  }

  return undefined;
}

function StatTile({ label, value, emphasize }: StatTileProps) {
  return (
    <div className="border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-1 stat-num text-2xl ${
          emphasize ? 'text-accent' : 'text-zinc-100'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/** Individual player profile, resolved from the :playerId URL parameter. */
export default function PlayerProfile() {
  const { playerId } = useParams<{ playerId: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;

    if (isMock) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'players', playerId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setPlayer({ id: docSnap.id, ...docSnap.data() } as Player);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [playerId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="stat-num text-zinc-500 animate-pulse uppercase tracking-widest text-xs">
          Loading Player Profile...
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <section className="border border-zinc-800 bg-zinc-900/40 px-4 py-6">
        <h1 className="text-sm font-bold uppercase tracking-widest text-zinc-100">
          Player not found
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          No player matches{' '}
          <span className="font-mono text-zinc-300">{playerId}</span>.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block text-xs font-medium uppercase tracking-wider text-accent hover:underline"
        >
          ← Back to leaderboard
        </Link>
      </section>
    );
  }

  return (
    <section>
      <Link
        to="/"
        className="text-xs font-medium uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
      >
        ← Leaderboard
      </Link>

      <div className="mt-3 flex flex-wrap items-baseline gap-3 border-b border-zinc-800 pb-3">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">
          {player.username}
        </h1>
        {player.clanTag && (
          <span className="font-mono text-xs font-semibold text-accent">
            [{player.clanTag}]
          </span>
        )}
        <span className="ml-auto font-mono text-xs text-zinc-500">
          Last active {player.lastActive}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-px bg-zinc-800 sm:grid-cols-4 lg:grid-cols-4">
        <StatTile label="ELO" value={String(player.elo)} emphasize />
        <StatTile label="Peak Rank" value={`#${player.peakPosition}`} />
        <StatTile label="K/D" value={player.kd.toFixed(2)} />
        <StatTile label="Win%" value={`${(winRate(player) * 100).toFixed(1)}%`} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {(['FFA', 'Team', 'Modified'] as const).map(q => {
          const stats = getQueueStats(player.gameTypeStats, q);
          const color = q === 'FFA' ? 'text-accent' : q === 'Team' ? 'text-blue-400' : 'text-purple-400';
          
          return (
            <div key={q} className="border border-zinc-800 bg-zinc-900/40 p-4">
              <h2 className={`text-xs font-bold uppercase tracking-widest ${color}`}>{q} Performance</h2>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase text-zinc-500">Score</div>
                  <div className="stat-num text-xl text-zinc-100">{(stats?.score || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase text-zinc-500">Wins</div>
                  <div className="stat-num text-xl text-zinc-100">{stats?.wins || 0}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase text-zinc-500">Matches</div>
                  <div className="stat-num text-xl text-zinc-100">{stats?.matches || 0}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Lifetime Summary</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-[10px] font-semibold uppercase text-zinc-500">Total Matches</div>
            <div className="stat-num text-lg text-zinc-300">{getTotalMatches(player)}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase text-zinc-500">Total Wins</div>
            <div className="stat-num text-lg text-zinc-300">{player.wins}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase text-zinc-500">Avg Score</div>
            <div className="stat-num text-lg text-zinc-300">{player.avgScorePerMatch.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase text-zinc-500">Overall Score</div>
            <div className="stat-num text-lg text-zinc-300">{player.totalScore.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
