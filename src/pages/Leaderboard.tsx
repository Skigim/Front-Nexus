import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, onSnapshot, startAfter, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db, isMock } from '../firebase/config';
import { type Player } from '../types';

type Mode = 'Ranked' | 'Global';
type Queue = 'ALL' | 'FFA' | 'Team' | 'Modified';

/** Unified leaderboard — toggles between Official Ranked and Global Scraped data. */
export default function Leaderboard() {
  const cell = 'px-3 py-1.5 text-right stat-num text-zinc-300';
  const headCell =
    'px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500';

  const [mode, setMode] = useState<Mode>('Ranked');
  const [queue, setQueue] = useState<Queue>('ALL');
  const [loading, setLoading] = useState(true);
  const [playersList, setPlayersList] = useState<Player[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 50;

  useEffect(() => {
    if (isMock) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setPlayersList([]);
    setLastDoc(null);

    // Determine sort field
    let sortField = 'elo'; // Default for Ranked
    if (mode === 'Global') {
      sortField = queue === 'ALL' ? 'totalScore' : `gameTypeStats.${queue}.score`;
    }

    const q = query(
      collection(db, 'players'),
      orderBy(sortField, 'desc'),
      limit(PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Player[];
      
      setPlayersList(data);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      setLoading(false);
    }, (error) => {
      console.error("[Firestore] Subscription error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [mode, queue]);

  const loadMore = async () => {
    if (!lastDoc || isMock) return;

    let sortField = 'elo';
    if (mode === 'Global') {
      sortField = queue === 'ALL' ? 'totalScore' : `gameTypeStats.${queue}.score`;
    }

    const nextQ = query(
      collection(db, 'players'),
      orderBy(sortField, 'desc'),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );

    // We use a one-time get for pagination to avoid keeping too many listeners open
    const { getDocs } = await import('firebase/firestore');
    const snapshot = await getDocs(nextQ);
    const newData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Player[];

    setPlayersList(prev => [...prev, ...newData]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    setHasMore(snapshot.docs.length === PAGE_SIZE);
  };

  return (
    <section>
      <div className="mb-6 flex flex-col gap-6 border-b border-zinc-800 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest text-zinc-100 flex items-center gap-2">
              <span className="h-2 w-2 bg-accent inline-block" />
              {mode} {queue !== 'ALL' ? queue : ''} Standings
            </h1>
            <div className="mt-1 flex items-center gap-4 font-mono text-[10px] text-zinc-500">
              <span>{playersList.length} players loaded</span>
              <span className="text-zinc-700">|</span>
              <span className={isMock ? "text-zinc-600" : "text-accent animate-pulse"}>
                ● {isMock ? "MOCK DATA" : "LIVE FIRESTORE"}
              </span>
            </div>
          </div>

          <div className="flex bg-zinc-900 p-0.5 border border-zinc-800">
            {(['Ranked', 'Global'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
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

        {mode === 'Global' && (
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'FFA', 'Team', 'Modified'] as Queue[]).map((q) => (
              <button
                key={q}
                onClick={() => setQueue(q)}
                className={`px-3 py-1 text-[10px] font-mono border transition-all ${
                  queue === q
                    ? 'border-accent text-accent bg-accent/5'
                    : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto border border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-zinc-900/80">
            <tr className="border-b border-zinc-800">
              <th className={`${headCell} w-12 text-left`}>#</th>
              <th className={`${headCell} text-left`}>Player</th>
              <th className={`${headCell} text-left`}>Clan</th>
              <th className={headCell}>
                {mode === 'Ranked' ? 'ELO' : (queue === 'ALL' ? 'Total Score' : `${queue} Score`)}
              </th>
              <th className={headCell}>Matches</th>
              <th className={headCell}>K/D</th>
              <th className={`${headCell} text-accent`}>
                {mode === 'Ranked' ? 'Global Rank' : 'Points'}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                   <div className="stat-num text-zinc-500 animate-pulse text-xs tracking-widest uppercase">
                     Synchronizing Data Stream...
                   </div>
                </td>
              </tr>
            ) : playersList.map((player, index) => {
              const qStats = queue !== 'ALL' ? player.gameTypeStats?.[queue] : null;
              const displayScore = qStats ? qStats.score : player.totalScore;
              const displayMatches = qStats ? qStats.matches : player.matches;

              return (
                <tr
                  key={player.id}
                  className="border-b border-zinc-800/70 group transition-colors hover:bg-accent/[0.03]"
                >
                  <td className="px-3 py-1.5 stat-num text-zinc-500 text-right text-xs">
                    {index + 1}
                  </td>
                  <td className="px-3 py-1.5">
                    <Link
                      to={`/player/${player.id}`}
                      className="font-medium text-zinc-100 hover:text-accent transition-colors underline decoration-zinc-800 underline-offset-4 decoration-1 hover:decoration-accent"
                    >
                      {player.username}
                    </Link>
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[10px] text-zinc-500">
                    {player.clanTag ? (
                      <span className="text-zinc-400">[{player.clanTag}]</span>
                    ) : '—'}
                  </td>
                  <td className={`${cell} font-semibold text-zinc-100 group-hover:text-accent`}>
                    {(mode === 'Ranked' ? player.elo : displayScore).toLocaleString()}
                  </td>
                  <td className={cell}>
                    {displayMatches?.toLocaleString() || '0'}
                  </td>
                  <td className={cell}>{player.kd?.toFixed(2) || '0.00'}</td>
                  <td className={`${cell} text-zinc-500 font-bold group-hover:text-accent`}>
                    {mode === 'Ranked' ? `#${index + 1}` : displayScore.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            className="flex items-center gap-2 border border-zinc-800 bg-zinc-900 px-8 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400 transition-all hover:border-accent hover:text-accent active:scale-95"
          >
            Load Next {PAGE_SIZE} Records
          </button>
        </div>
      )}
    </section>
  );
}
