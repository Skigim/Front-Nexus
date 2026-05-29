# Front-Nexus

A leaderboard and stat tracker for [OpenFront.io](https://openfront.io).

A fast, lightweight, data-dense dashboard MVP for competitive gaming stats,
built with React (TypeScript), Tailwind CSS, and Firebase (Auth + Firestore).

## Stack

- **React 18 + TypeScript** via **Vite**
- **Tailwind CSS** — utilitarian, high-contrast dark theme (sharp edges,
  monospaced stats, tight tabular layouts)
- **Firebase** — Firestore for data and Discord OAuth (OpenID Connect) for auth
- **React Router** for the Leaderboard / Clans / Player Profile views

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Firebase web config
npm run dev
```

Then open the printed local URL.

### Available scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite dev server            |
| `npm run build`   | Type-check and build for production  |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Lint the project with ESLint         |

## Configuration

All Firebase values are read from `VITE_*` environment variables — see
[`.env.example`](./.env.example). The Firebase web config is **not** secret and
is safe to ship to the browser; security is enforced via Firestore Security
Rules and Auth settings.

### Discord login

Firebase has no built-in Discord provider, so authentication uses Firebase's
generic **OpenID Connect** provider:

1. In the Firebase console, go to **Authentication → Sign-in method → Add new
   provider → OpenID Connect**.
2. Configure it against Discord's OAuth2 / OIDC endpoints and note the generated
   provider id (the console prefixes it with `oidc.`).
3. Set `VITE_DISCORD_OIDC_PROVIDER_ID` in `.env.local` to that id.

## Project structure

```
src/
  firebase/config.ts   Firebase init: Firestore + Discord OIDC auth helpers
  data/mockData.ts     Sample player stats and clan rankings (mock layer)
  components/          Navbar, Layout (shared shell)
  pages/               Leaderboard, Clans, PlayerProfile views
  types.ts             Shared domain types
```

The mock data layer stands in for live Firestore reads so the UI can be
developed independently; components import from `src/data/mockData.ts` and the
source can later be swapped for real Firestore queries.
