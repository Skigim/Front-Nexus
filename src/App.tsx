import { Link, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Leaderboard from './pages/Leaderboard';
import Clans from './pages/Clans';
import PlayerProfile from './pages/PlayerProfile';

function NotFound() {
  return (
    <section className="border border-zinc-800 bg-zinc-900/40 px-4 py-6">
      <h1 className="text-sm font-bold uppercase tracking-widest text-zinc-100">
        404 — Page not found
      </h1>
      <Link
        to="/"
        className="mt-4 inline-block text-xs font-medium uppercase tracking-wider text-accent hover:underline"
      >
        ← Back to leaderboard
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Leaderboard />} />
        <Route path="/clans" element={<Clans />} />
        <Route path="/player/:playerId" element={<PlayerProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
