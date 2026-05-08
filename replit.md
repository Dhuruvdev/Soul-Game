# SoulSync

A dreamy multiplayer social web game for Gen-Z Discord users — make connections, build bonds, play mini-games, earn XP, and collect aesthetic profile cosmetics.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/soulsync run dev` — run the frontend (port 19766, served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + Framer Motion + wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — Single source of truth for API contract
- `lib/db/src/schema/` — Drizzle table definitions (users, bonds, rooms, minigames, social, friends)
- `artifacts/api-server/src/routes/` — Express route handlers (users, social, bonds, rooms, minigames, dashboard)
- `artifacts/soulsync/src/` — React frontend (pages, components, CSS theme)
- `lib/api-client-react/src/generated/` — Generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — Generated Zod validators (do not edit)

## Architecture decisions

- Contract-first API: OpenAPI spec → codegen → typed hooks on frontend + Zod validators on backend
- Current user is hardcoded to ID=1 (no auth yet) — all endpoints use `CURRENT_USER_ID = 1`
- Orval naming: request body schemas must NOT end in "Body" if the operationId + "Body" would clash — use "Input" suffix instead
- `lib/api-zod/src/index.ts` exports only from `./generated/api` (not types) to avoid duplicate export conflicts
- Rooms use a join table (`room_occupants`) — occupant counts are computed dynamically

## Product

- **Dashboard**: personalized stats, active rooms strip, daily challenges, activity feed
- **Profile Card**: collectible identity card with XP, mood, aesthetic tags, delulu meter, red flag %, bonds
- **Social**: friends list, user search, anonymous compliments, hearts
- **Rooms**: 6 themed rooms (sleepover, study, heartbreak, arcade, gossip, chaotic VC)
- **Mini-Games**: Typing Chemistry, Delulu Detector, Emoji Panic, Memory Lane, Secret Voting
- **Compatibility**: animated score reveal with vibe/chaos/loyalty/humor breakdown
- **Leaderboard**: top players ranked by XP
- **Stats/Wrapped**: Spotify Wrapped-style shareable stats card

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- When adding new request body component schemas, use `Input` suffix (not `Body`) to avoid Orval naming clashes
- `lib/api-zod/src/index.ts` must only export from `./generated/api` — adding `./generated/types` causes duplicate export errors
- DB push: `pnpm --filter @workspace/db run push`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
