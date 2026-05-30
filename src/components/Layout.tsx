import type { ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

/** Page shell: persistent navbar + a constrained, data-dense content column. */
export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <div className="bg-accent/10 border-b border-accent/20 px-4 py-1.5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
          <span className="mr-2">⚠️</span>
          Front-Nexus is in early development — stats accuracy and persistence are not yet guaranteed.
          <span className="ml-2">⚠️</span>
        </p>
      </div>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
