import { Link, useParams } from 'react-router-dom';
import { getPlayerById, winRate } from '../data/mockData';

interface StatTileProps {
  label: string;
  value: string;
  emphasize?: boolean;
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
  const player = playerId ? getPlayerById(playerId) : undefined;

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

      <div className="mt-4 grid grid-cols-2 gap-px bg-zinc-800 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="ELO" value={String(player.elo)} emphasize />
        <StatTile label="K/D" value={player.kd.toFixed(2)} />
        <StatTile label="Win%" value={`${(winRate(player) * 100).toFixed(1)}%`} />
        <StatTile label="Wins" value={String(player.wins)} />
        <StatTile label="Losses" value={String(player.losses)} />
        <StatTile label="Matches" value={String(player.matches)} />
      </div>
    </section>
  );
}
