# Front-Nexus — Copilot Instructions

Front-Nexus is a leaderboard and stat tracker for [OpenFront.io](https://openfront.io).
It is a data-dense, dark-theme React dashboard MVP for competitive gaming stats.

## Semantic Search

This codebase is indexed for semantic search. Use `semantic_search` to find relevant
symbols, types, components, and patterns before reading or editing files. Prefer it
over grep for conceptual queries (e.g. "how is auth handled", "where is clan data shaped").

## Stack

| Layer | Choice |
|-------|--------|
| UI framework | React 18 + TypeScript, bundled with Vite |
| Styling | Tailwind CSS — dark theme, high-contrast, sharp edges, monospaced stats, tight tabular layouts. No rounded-lg, no soft shadows. |
| Backend / Auth | Firebase (Firestore + Discord OIDC via Firebase's generic OpenID Connect provider) |
| Routing | React Router — three top-level views: Leaderboard, Clans, PlayerProfile |

## Architecture

```
src/
  firebase/config.ts   Firebase init: Firestore + Discord OIDC auth helpers
  data/mockData.ts     Mock player stats and clan rankings — stands in for live Firestore reads
  components/          Navbar, Layout (shared shell)
  pages/               Leaderboard, Clans, PlayerProfile views
  types.ts             Shared domain types
```

## Documentation

- **Architecture** — See [.github/architecture.md](.github/architecture.md) for data flow and worker design.

Components import from `src/data/mockData.ts`. When wiring up live data, swap
the mock import for a Firestore query — keep the same shape as `types.ts` defines.

## Conventions

- **TypeScript strict mode** — no `any`, no implicit `undefined`.
- **Tailwind only** — no inline styles, no CSS modules, no external UI libraries.
- Dark-theme palette: use `bg-gray-900` / `bg-gray-800` surfaces, `text-green-400` /
  `text-white` for stats, `font-mono` for numerical values.
- All Firebase config is read from `VITE_*` env vars — never hardcode credentials.
- Firebase Security Rules and Auth settings enforce access control; client-side checks
  are UX only, not security boundaries.
- Keep new pages under `src/pages/` and shared UI under `src/components/`.

## Build & Lint

```bash
npm install
npm run dev      # Vite dev server
npm run build    # Type-check + production build
npm run lint     # ESLint
```

Environment: copy `.env.example` → `.env.local` and fill in Firebase web config values.
