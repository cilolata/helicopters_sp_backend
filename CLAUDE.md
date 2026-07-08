# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # nodemon hot-reload (ts-node)
npm run build         # rm -rf dist && tsc
npm start             # node dist/server.js
npm test              # jest (src/__tests__/**/*.test.ts)
npm run db:migrate    # prisma migrate dev
npm run db:generate   # regenerate Prisma client after schema changes
npm run db:studio     # Prisma Studio UI
npm run registry:build  # rebuild prisma/data/anac-registry.json from ANAC CSV
```

## Architecture

Express + TypeScript backend. Polls an ADS-B receiver (dump1090 or adsb.fi), filters results to São Paulo helicopter registrations, persists to PostgreSQL via Prisma, and serves a live cache plus historical queries.

### Data flow

1. `src/utils/scheduler.ts` runs `SaveAircraftUseCase` on startup and every `POLL_INTERVAL_MS` (default 5s), with skip-if-running guard and 25s fetch timeout.
2. `SaveAircraftUseCase` (`src/use-cases.ts/save-aircrafts.ts`):
   - Accepts both dump1090 (`aircraft[]`) and adsb.fi (`ac[]`) response shapes.
   - Discards aircraft outside São Paulo bounding box (lat −24.010…−23.356, lon −46.826…−46.365), on ground, missing hex/lat/lon, or with 0 ADS-B messages.
   - **Classification**: looks up normalized callsign (uppercased, hyphens stripped) in `helicopterRegistry` (ANAC registry). Only aircraft whose callsign matches a registry entry are kept — no altitude/speed thresholds.
   - Writes to DB (`savePosition` + `saveAircraft` in parallel) and updates the in-memory live cache (`src/lib/aircraft-cache.ts`).
3. `src/utils/cleanup.ts` deletes old positions daily at BRT midnight (UTC 03:00) via a self-rescheduling `setTimeout`.

### ANAC registry

`prisma/data/anac-registry.json` maps callsign → `{ owner, model, operator }`. Built from the official ANAC CSV via `npm run registry:build` (`scripts/build-anac-registry.js`). Loaded once at startup into `helicopterRegistry` (`src/lib/helicopter-registry.ts`). Tests mock this file via `moduleNameMapper` in `jest.config.js`.

### API routes

All routes are in `src/controllers/aircrafts.ts`:

| Route | Rate limit | Description |
|---|---|---|
| `GET /aircrafts` | 10 req/10s | Live helicopters (reads in-memory cache) |
| `GET /aircrafts/today` | 30 req/60s | All aircraft seen today (BRT day) |
| `GET /aircrafts/history?date=YYYY-MM-DD` | 30 req/60s | Aircraft seen on a given BRT day |
| `GET /aircrafts/export?date=YYYY-MM-DD` | 30 req/60s | Same day, with last known position (raw SQL) |
| `GET /aircrafts/:icao/route` | 30 req/60s | Position trail for one aircraft since BRT midnight |

### Database (Prisma)

Schema in `prisma/schema.prisma`. Two models:
- **`aircraft`** — one row per ICAO hex, fields: `icao_hex` (PK), `first_seen`, `last_seen`, `last_callsign`, `last_squawk`, `operator`, `owner`, `model`. Index on `last_seen DESC`.
- **`positions`** — append-only, fields: `id`, `icao_hex`, `lat`, `lon`, `altitude`, `captured_at`. Index on `(icao_hex, captured_at DESC)`.

All timezone math uses BRT = UTC−3 (BRT midnight = UTC 03:00).

### Layer structure

```
src/
  app.ts                         # Express setup: helmet, CORS, rate limiters, routes
  server.ts                      # listen + headersTimeout/requestTimeout (Slow Loris guard)
  env/index.ts                   # Typed env object (PORT, POLL_INTERVAL_MS, DUMP1090_HOST, CORS_ORIGIN)
  config/database.ts             # Prisma client singleton
  entities/models/               # TypeScript interfaces: AircraftRaw, AircraftDB, PositionDB, Dump1090Response
  repositories/
    aircrafts.repository.interface.ts  # IAircraftsRepository
    db/aircrafts.ts                    # Prisma implementation
  use-cases.ts/                  # Business logic (directory name ends in .ts — do not rename)
    save-aircrafts.ts
    get-helicopters-use-case.ts  # Reads live cache
    get-today-aircrafts-use-case.ts
    factory/                     # Wires use cases with repository + registry
  lib/
    aircraft-cache.ts            # In-memory LiveAircraft[] (updateCache / getCache)
    helicopter-registry.ts       # Loads ANAC registry JSON at startup
  utils/
    scheduler.ts                 # Polling loop
    cleanup.ts                   # Nightly position cleanup
  __tests__/                     # Jest tests (mocks Prisma; mocks anac-registry.json)
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | Prisma connection URL (required) |
| `DIRECT_URL` | — | Direct DB URL for Prisma migrations (required) |
| `PORT` | `3000` | Express listen port |
| `DUMP1090_HOST` | — | ADS-B feed URL (dump1090 or adsb.fi) |
| `POLL_INTERVAL_MS` | `5000` | Polling interval in ms |
| `CORS_ORIGIN` | `""` | Allowed CORS origin |
