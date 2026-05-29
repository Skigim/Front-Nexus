import type { ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

/** Page shell: persistent navbar + a constrained, data-dense content column. */
export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
