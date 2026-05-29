import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, loginWithDiscord, logout } from '../firebase/config';

const navItems = [
  { label: 'Leaderboards', to: '/' },
  { label: 'Clans', to: '/clans' },
];

function navLinkClass({ isActive }: { isActive: boolean }): string {
  const base =
    'px-3 py-2 text-xs font-medium uppercase tracking-wider border-b-2 transition-colors';
  return isActive
    ? `${base} border-accent text-zinc-100`
    : `${base} border-transparent text-zinc-400 hover:text-zinc-100`;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  async function handleLogin() {
    setBusy(true);
    setError(null);
    try {
      await loginWithDiscord();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    try {
      await logout();
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-6 px-4">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-widest text-zinc-100">
            Front<span className="text-accent">-</span>Nexus
          </span>
        </NavLink>

        <nav className="flex h-full items-stretch">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end className={navLinkClass}>
              <span className="flex h-full items-center">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {error && (
            <span className="font-mono text-[11px] text-accent">{error}</span>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-zinc-400">
                {user.displayName ?? user.email ?? 'Signed in'}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={busy}
                className="rounded-none border border-zinc-700 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              disabled={busy}
              className="rounded-none border border-accent bg-accent/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent hover:bg-accent hover:text-zinc-950 disabled:opacity-50"
            >
              {busy ? 'Connecting…' : 'Login with Discord'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
