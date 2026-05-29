import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, isMock } from '../firebase/config';
import { type Player } from '../types';

type Mode = 'FFA' | 'Teams';

/** Global leaderboard — toggles between FFA and Teams. */
export default function Leaderboard() {
  const cell = 'px-3 py-1.5 text-right stat-num text-zinc-300';
  const headCell =
    'px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500';

  const [mode, setMode] = useState<Mode>('FFA');
  const [loading, setLoading] = useState(true);
  const [playersList, setPlayersList] = useState<Player[]>([]);

  useEffect(() => {
    if (isMock) {
      setLoading(false);
      return;
    }

    // Determine sort field based on mode
    const sortField = mode === 'FFA' ? 'ffaScore' : 'teamScore';
    
    const q = query(
      collection(db, 'players'),
      orderBy(sortField, 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`[Firestore] Received update: ${snapshot.size} players`);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Player[];
      
      setPlayersList(data);
      setLoading(false);
    }, (error) => {
      console.error("[Firestore] Subscription error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [mode]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="stat-num text-zinc-500 animate-pulse uppercase tracking-widest text-xs">
          Connecting to Front-Nexus Live Stats...
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-4 flex flex-col gap-4 border-b border-zinc-800 pb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-zinc-100">
            Global Leaderboard
          </h1>
          <div className="mt-1 flex items-center gap-4 font-mono text-[10px] text-zinc-500">
            <span>{playersList.length} players tracked</span>
            <span className="text-zinc-700">|</span>
            <span className="text-accent animate-pulse">● LIVE FIRESTORE</span>
          </div>
        </div>

        <div className="flex bg-zinc-900 p-0.5">
          {(['FFA', 'Teams'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setLoading(true);
                setMode(m);
              }}
              className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                mode === m
                  ? 'bg-accent text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border border-zinc-800">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-zinc-900">
            <tr className="border-b border-zinc-800">
              <th className={`${headCell} w-12 text-left`}>#</th>
              <th className={`${headCell} text-left`}>Player</th>
              <th className={`${headCell} text-left`}>Clan</th>
              <th className={headCell}>{mode} Score</th>
              <th className={headCell}>{mode} Wins</th>
              <th className={headCell}>K/D</th>
              <th className={headCell}>ELO</th>
            </tr>
          </thead>
          <tbody>
            {playersList.map((player, index) => (
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
                <td className={`${cell} font-semibold text-accent`}>
                  {(mode === 'FFA' ? player.ffaScore : player.teamScore).toLocaleString()}
                </td>
                <td className={cell}>
                  {mode === 'FFA' ? player.ffaWins : player.teamWins}
                </td>
                <td className={cell}>{player.kd.toFixed(2)}</td>
                <td className={cell}>{player.elo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
