# Yonderlust

An AI travel concierge for when you want to go somewhere but do not know where.
You give it your free days, budget and mood; it finds trips worth taking and builds
them end to end.

> You tell us *when*. We tell you *where*.

This repository is the **frontend** (Next.js). It is built contract-first against a
typed service layer so a backend can be plugged in later without touching the UI.

## Stack

- **Next.js 16 (App Router) + React 19 + TypeScript** (strict)
- **Tailwind CSS** with a design-token layer (`src/styles/tokens.css`)
- **Framer Motion** for animation
- **TanStack Query** for data fetching / caching
- **Zod** for runtime validation of API responses
- **Supabase** (`@supabase/ssr`) for Google OAuth
- **lucide-react** for icons; brand art is inline SVG

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: only needed for sign-in
npm run dev                  # http://localhost:3000
```

The app runs fully on **mock data** out of the box — no backend or keys required.
Sign-in is the only feature that needs Supabase configured (see below).

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Architecture: contract-first, swappable data layer

All data access goes through one **service interface** (`src/services/types.ts` — the
single source of truth shared with the backend). Two implementations satisfy it:

- `mock` — typed fixtures with realistic latency (`src/mocks/data.ts`)
- `api` — fetches the backend and validates every response with Zod schemas

`src/services/index.ts` picks the implementation from an env var. **Components never
know where the data comes from.**

### Swapping mock → backend

1. Implement the endpoints expected by `apiTripService` in `src/services/tripService.ts`
   (`POST /discover`, `GET /trips/:id`, `GET /destinations`, …). Responses must match
   the Zod schemas in `src/services/schemas.ts`, which mirror `types.ts`.
2. Set the env vars:
   ```env
   NEXT_PUBLIC_DATA_SOURCE=live
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.example.com
   ```
3. That is it — no component changes. Keep `types.ts` in sync with the backend so the
   contract holds.

## Auth (Supabase + Google OAuth)

Set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

In the Supabase dashboard, enable the Google provider and add
`http://localhost:3000/auth/callback` to the allowed redirect URLs. Browsing is open;
only **saving trips** requires sign-in. Without keys, the app still runs and the
sign-in button is disabled.

## Project structure

```
src/
  app/                 # App Router: routes, layout, providers
    page.tsx           #  /            landing
    discover/          #  /discover    AI planner (hero feature)
    trip/[id]/         #  /trip/:id    full trip detail
    plan/              #  /plan        manual builder with budget bar
    saved/             #  /saved       saved trips (auth required)
    auth/callback/     #  OAuth code exchange
  features/            # planner, manual, trip, saved, auth, landing
  components/          # ui primitives, layout, brand, loaders, trip card
  services/            # types (contract), schemas, tripService, authService, index
  lib/                 # utils, vibes, queryClient, supabase clients
  mocks/               # typed fixtures
  styles/tokens.css    # design tokens
```

## Notes

- Destination imagery uses placeholder photography (Lorem Picsum) — swap for curated
  photos before launch.
- The AI planner runs on mock itineraries. Real LLM calls must go through the backend
  (a client-side key would be exposed), so they are intentionally deferred to the `api`
  layer.
