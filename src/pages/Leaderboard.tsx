import { Link } from 'react-router-dom';
import { players, winRate } from '../data/mockData';

const cell = 'px-3 py-1.5 text-right stat-num text-zinc-300';
const headCell =
  'px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500';

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** Global FFA leaderboard — players ranked by ELO. */
export default function Leaderboard() {
  const ranked = [...players].sort((a, b) => b.elo - a.elo);

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between border-b border-zinc-800 pb-2">
        <h1 className="text-sm font-bold uppercase tracking-widest text-zinc-100">
          Global FFA Leaderboard
        </h1>
        <span className="font-mono text-xs text-zinc-500">
          {ranked.length} players
        </span>
      </div>

      <div className="overflow-x-auto border border-zinc-800">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-zinc-900">
            <tr className="border-b border-zinc-800">
              <th className={`${headCell} w-12 text-left`}>#</th>
              <th className={`${headCell} text-left`}>Player</th>
              <th className={`${headCell} text-left`}>Clan</th>
              <th className={headCell}>ELO</th>
              <th className={headCell}>W</th>
              <th className={headCell}>L</th>
              <th className={headCell}>Win%</th>
              <th className={headCell}>K/D</th>
              <th className={headCell}>Matches</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((player, index) => (
              <tr
                key={player.id}
                className="border-b border-zinc-800/70 odd:bg-zinc-950 even:bg-zinc-900/40 hover:bg-zinc-800/40"
              >
                <td className="px-3 py-1.5 stat-num text-zinc-500">
                  {index + 1}
                </td>
                <td className="px-3 py-1.5">
                  <Link
                    to={`/player/${player.id}`}
                    className="font-medium text-zinc-100 hover:text-accent"
                  >
                    {player.username}
                  </Link>
                </td>
                <td className="px-3 py-1.5 font-mono text-xs text-zinc-500">
                  {player.clanTag ?? '—'}
                </td>
                <td className={`${cell} font-semibold text-zinc-100`}>
                  {player.elo}
                </td>
                <td className={cell}>{player.wins}</td>
                <td className={cell}>{player.losses}</td>
                <td className={cell}>{pct(winRate(player))}</td>
                <td className={cell}>{player.kd.toFixed(2)}</td>
                <td className={`${cell} text-zinc-500`}>{player.matches}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
