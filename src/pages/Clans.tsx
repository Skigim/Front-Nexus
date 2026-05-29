import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, isMock } from '../firebase/config';
import type { ClanRanking } from '../types';

/** Clan rankings table. */
export default function Clans() {
  const cell = 'px-3 py-1.5 text-right stat-num text-zinc-300';
  const headCell =
    'px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500';

  const [ranked, setRanked] = useState<ClanRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'elo' | 'games'>('elo');

  useEffect(() => {
    if (isMock) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'clans'),
      orderBy(sortBy, 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClanRanking[];
      setRanked(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sortBy]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="stat-num text-zinc-500 animate-pulse uppercase tracking-widest text-xs">
          Fetching Clan Standings...
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-4 flex flex-col gap-4 border-b border-zinc-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-zinc-100">
            Clan Rankings
          </h1>
          <div className="mt-1 flex items-center gap-4 font-mono text-[10px] text-zinc-500">
            <span>{ranked.length} clans active</span>
            <span className="text-zinc-700">|</span>
            <span className="text-accent animate-pulse">● LIVE DATA</span>
          </div>
        </div>

        <div className="flex bg-zinc-950 p-1 border border-zinc-800">
          <button
            onClick={() => setSortBy('elo')}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-tighter transition-colors ${
              sortBy === 'elo' ? 'bg-zinc-800 text-accent' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setSortBy('games')}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-tighter transition-colors ${
              sortBy === 'games' ? 'bg-zinc-800 text-accent' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Activity
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-zinc-800">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-zinc-900">
            <tr className="border-b border-zinc-800">
              <th className={`${headCell} w-12 text-left`}>#</th>
              <th className={`${headCell} text-left`}>Tag</th>
              <th className={`${headCell} text-left`}>Clan</th>
              <th className={headCell}>{sortBy === 'elo' ? 'ELO' : 'GAMES'}</th>
              <th className={headCell}>W/L RATIO</th>
              <th className={headCell}>WINS</th>
              <th className={headCell}>LOSSES</th>
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
                  {sortBy === 'elo' 
                    ? (clan.elo || 0).toLocaleString() 
                    : (clan.games || 0).toLocaleString()}
                </td>
                <td className={cell}>
                  {(clan.weightedWLRatio || 0).toFixed(2)}
                </td>
                <td className={cell}>{(clan.wins || 0).toLocaleString()}</td>
                <td className={cell}>{(clan.losses || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
