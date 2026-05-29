import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { ClanRanking } from '../types';

const cell = 'px-3 py-1.5 text-right stat-num text-zinc-300';
const headCell =
  'px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500';

/** Clan rankings table. */
export default function Clans() {
  const [ranked, setRanked] = useState<ClanRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'clans'),
      orderBy('elo', 'desc'),
      limit(50)
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
  }, []);

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
      <div className="mb-4 flex items-baseline justify-between border-b border-zinc-800 pb-2">
        <h1 className="text-sm font-bold uppercase tracking-widest text-zinc-100">
          Clan Rankings
        </h1>
        <div className="flex items-center gap-4 font-mono text-[10px] text-zinc-500">
          <span>{ranked.length} clans active</span>
          <span className="text-zinc-700">|</span>
          <span className="text-accent animate-pulse">● LIVE DATA</span>
        </div>
      </div>

      <div className="overflow-x-auto border border-zinc-800">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-zinc-900">
            <tr className="border-b border-zinc-800">
              <th className={`${headCell} w-12 text-left`}>#</th>
              <th className={`${headCell} text-left`}>Tag</th>
              <th className={`${headCell} text-left`}>Clan</th>
              <th className={headCell}>ELO</th>
              <th className={headCell}>FFA Score</th>
              <th className={headCell}>Team Score</th>
              <th className={headCell}>Total Wins</th>
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
                  {(clan.elo || 0).toLocaleString()}
                </td>
                <td className={cell}>{(clan.ffaScore || 0).toLocaleString()}</td>
                <td className={cell}>{(clan.teamScore || 0).toLocaleString()}</td>
                <td className={cell}>{(clan.wins || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
