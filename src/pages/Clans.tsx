import { clans, winRate } from '../data/mockData';

const cell = 'px-3 py-1.5 text-right stat-num text-zinc-300';
const headCell =
  'px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500';

/** Clan rankings table. */
export default function Clans() {
  const ranked = [...clans].sort((a, b) => b.elo - a.elo);

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between border-b border-zinc-800 pb-2">
        <h1 className="text-sm font-bold uppercase tracking-widest text-zinc-100">
          Clan Rankings
        </h1>
        <span className="font-mono text-xs text-zinc-500">
          {ranked.length} clans
        </span>
      </div>

      <div className="overflow-x-auto border border-zinc-800">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-zinc-900">
            <tr className="border-b border-zinc-800">
              <th className={`${headCell} w-12 text-left`}>#</th>
              <th className={`${headCell} text-left`}>Tag</th>
              <th className={`${headCell} text-left`}>Clan</th>
              <th className={headCell}>ELO</th>
              <th className={headCell}>Members</th>
              <th className={headCell}>W</th>
              <th className={headCell}>L</th>
              <th className={headCell}>Win%</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((clan, index) => (
              <tr
                key={clan.id}
                className="border-b border-zinc-800/70 odd:bg-zinc-950 even:bg-zinc-900/40 hover:bg-zinc-800/40"
              >
                <td className="px-3 py-1.5 stat-num text-zinc-500">
                  {index + 1}
                </td>
                <td className="px-3 py-1.5 font-mono text-xs font-semibold text-accent">
                  {clan.tag}
                </td>
                <td className="px-3 py-1.5 font-medium text-zinc-100">
                  {clan.name}
                </td>
                <td className={`${cell} font-semibold text-zinc-100`}>
                  {clan.elo}
                </td>
                <td className={cell}>{clan.members}</td>
                <td className={cell}>{clan.wins}</td>
                <td className={cell}>{clan.losses}</td>
                <td className={cell}>
                  {(winRate(clan) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
