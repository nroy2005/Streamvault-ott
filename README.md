# StreamVault

| Classification | Public |
|---|---|
| **Version Date** | 2026-11-25 |
| **Status** | Final |

StreamVault is a dark-mode OTT streaming platform. The backend is a NestJS API over MongoDB that serves a catalog seeded from TMDB. The frontend is a React SPA with JWT auth, search-as-you-type, a watchlist, and a video player that remembers where you stopped.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│ Presentation    React 19 SPA · React Router · Tailwind CSS           │
│                 Pages: Login/Register · Home · Search · My List ·    │
│                 Player (YouTube IFrame API / hls.js / <video>)       │
├──────────────────────────────────────────────────────────────────────┤
│ Client state    Zustand (auth: in-memory access token; watchlist:    │
│ & data access   optimistic) · Axios + 401 refresh interceptor ·      │
│                 useFetch hooks with request cancellation             │
├───────────────────────────── HTTPS /api ─────────────────────────────┤
│ Edge            nginx: static assets + same-origin /api reverse proxy│
├──────────────────────────────────────────────────────────────────────┤
│ API             NestJS modules: auth · users · movies · watchlist ·  │
│                 playback · global ValidationPipe (DTOs) · global     │
│                 exception filter · Passport JWT guard · cookie-parser│
├──────────────────────────────────────────────────────────────────────┤
│ Data            MongoDB via Mongoose · text index (movies) · unique  │
│                 {userId, movieId} indexes (watchlist, playback)      │
├──────────────────────────────────────────────────────────────────────┤
│ External        TMDB API (seed script only; key never leaves server) │
│                 TMDB image CDN · YouTube (trailers)                  │
└──────────────────────────────────────────────────────────────────────┘
```

| Layer | Technology |
|---|---|
| Presentation | React 19, TypeScript, Vite, Tailwind CSS 4, React Router |
| Client state / data | Zustand, Axios, custom hooks (`useFetch`, `useMovies`, …) |
| Video | YouTube IFrame API, hls.js (lazy-loaded), native `<video>` |
| Edge | nginx (static hosting + `/api` reverse proxy) |
| API | NestJS 12, class-validator DTOs, Passport JWT, bcrypt, cookie-parser |
| Data | MongoDB 7, Mongoose 9 |
| Testing | Jest + ts-jest (backend), Vitest + React Testing Library (frontend) |
| Tooling / Infra | oxlint, Docker (multi-stage), docker-compose, GitHub Actions |

### Repository layout

```
backend/    NestJS API: src/{auth,users,movies,watchlist,playback,common}
frontend/   React SPA:  src/{api,stores,hooks,components,pages}
docker-compose.yml   mongo + backend + frontend
.github/workflows/ci.yml
```

---

## Getting started

### Prerequisites

- Node.js 24+
- Docker with Compose v2.24+ (for MongoDB, or to run the full stack)
- A TMDB API key (v3) to seed the catalog

### 1. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Fill in `backend/.env`. Generate each JWT secret with
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Signing keys. Use two different values. The app won't start without them. |
| `TMDB_API_KEY` | Used only by the seed script. Never shipped to the frontend. |
| `CORS_ORIGIN` | Only needed if the frontend is served from a different origin |
| `PORT` | API port (default 3000) |

### 2a. Local development

```bash
docker compose up -d mongo                         # MongoDB on :27017
cd backend  && npm install && npm run seed         # import ~60 movies from TMDB
npm run start:dev                                  # API on http://localhost:3000/api
cd ../frontend && npm install && npm run dev       # UI on http://localhost:5173
```

The Vite dev server forwards `/api` to `localhost:3000`, so the browser only ever talks to one origin.

### 2b. Full stack in Docker

```bash
docker compose up -d --build
docker compose exec backend node dist/movies/seed.js   # first run only
```

Then open http://localhost:8080.

> The backend runs with `NODE_ENV=production`, so the refresh cookie is marked `Secure`. Chrome and Firefox accept Secure cookies on `http://localhost`, but Safari does not. Deploy behind HTTPS.

---

## Testing & CI

| Command | Where | What it runs |
|---|---|---|
| `npm test` | `backend/` | Jest: AuthService (hashing, rotation, logout revocation), MoviesService (text search, regex fallback, escaping) |
| `npm test` | `frontend/` | Vitest + RTL: Login flow, Watchlist flow (add, optimistic rollback, remove) |
| `npm run lint` | both | oxlint |
| `npm run build` | both | Type-check and production build |

`.github/workflows/ci.yml` runs lint, test and build for both apps on every push to `main` and on pull requests targeting `main`.

---

## API overview

All routes are under `/api`. Routes marked 🔒 need `Authorization: Bearer <accessToken>`.

| Method | Route | Notes |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | Return `{ accessToken }` and set the `refresh_token` httpOnly cookie |
| POST | `/auth/refresh` | Reads the cookie, rotates it, and returns a new `{ accessToken }` |
| POST | `/auth/logout` | Revokes the refresh token server-side and clears the cookie |
| GET | `/movies?search=&genre=&page=&limit=` | Paginated. Full-text search with a word-prefix fallback. |
| GET | `/movies/:id` | |
| GET / POST | `/watchlist` 🔒 | List / add `{ movieId }` (adding twice is a no-op) |
| DELETE | `/watchlist/:movieId` 🔒 | |
| GET | `/playback` 🔒 | "Continue watching" list, most recent first |
| GET | `/playback/:movieId` 🔒 | Saved position (0 if none) |
| POST | `/playback` 🔒 | `{ movieId, positionSeconds }`. Upserts; the player calls it every 10 s. |

---

## Security notes

- **Passwords:** hashed with bcrypt (cost 12).
- **Refresh tokens:**
  - The cookie is `httpOnly`, `SameSite=Strict`, `Secure` in production, and scoped to `/api/auth`.
  - Each refresh issues a new token and the old one stops working.
  - Tokens are stored server-side as SHA-256 hashes. bcrypt can't be used here because it reads only the first 72 bytes, and those are identical across a user's JWTs.
- **Access tokens:** valid for 15 minutes, held in memory only, never in `localStorage`.
- **Input:** every request body and query string is validated with a DTO whitelist. Search input is regex-escaped before it reaches MongoDB.
- **TMDB key:** used only on the server.

---

## AI-Assisted Dev Log: Where I Overrode Claude Code

This project was built with Claude Code. In two places I didn't accept its first implementation and required a stronger one. Claude had flagged both as known limitations (with `ponytail:` comments) instead of fixing them.

### 1. Search: from whole-word full-text to search-as-you-type

**Claude's first version:**
- Search used a MongoDB `$text` index on `title` and `genres`.
- That ranks results by relevance, but it only matches whole words and their stems. Typing `aveng` returned nothing, so search-as-you-type in the navbar was effectively broken.
- Claude noted the limitation and suggested Atlas Search or a regex later.

**My override:** support case-insensitive partial prefix matching now, using an escaped-regex fallback.

**Result** (`backend/src/movies/movies.service.ts`):
1. Run the `$text` query first, so full words keep relevance ranking and use the index.
2. If that returns nothing, fall back to `{ $regex: (?:^|[\s\p{P}])<escaped term>, $options: 'i' }` on title and genres.
   - Matches at the start of any word: `aveng` finds *Avengers*, and `man` finds *Spider-Man* but not *Batman*.
   - User input is escaped, so regex metacharacters are matched literally. This also blocks regex injection.
3. Unit tests cover the escaping and matching rules.

**Trade-off accepted:** the fallback regex can't use an index (it scans the collection). That's fine at catalog sizes in the thousands. The upgrade path is Atlas Search autocomplete.

### 2. Refresh token: from localStorage to an httpOnly cookie

**Claude's first version:**
- The frontend kept the access and refresh tokens in `localStorage` (Zustand `persist`), and the API returned both in response bodies.
- Claude flagged that any XSS bug could steal the long-lived refresh token, but left the fix for later.

**My override:** the NestJS backend must set the refresh token as an httpOnly cookie (`cookie-parser`).

**Result:**
- **Backend:**
  - Login, register and refresh set a `refresh_token` cookie (`httpOnly`, `SameSite=Strict`, `Secure` in production, path `/api/auth`, 7-day max age). Response bodies contain only `{ accessToken }`.
  - `/auth/refresh` reads the cookie instead of the request body.
  - A new `/auth/logout` revokes the token server-side and clears the cookie. This endpoint is required, because page JavaScript can no longer delete the cookie itself.
- **Frontend:**
  - The access token now lives only in memory. Nothing is written to `localStorage`, and a test asserts this.
  - On page load, `restoreSession()` calls `/auth/refresh` to restore the session from the cookie.
  - Concurrent 401s share a single refresh call, because the backend rotates the token on every refresh.

**Trade-off accepted:** each user still has a single active refresh token, so logging in on a second device ends the first device's session. The upgrade path is a sessions collection.

---

## Known limitations / next steps

- **Not yet tested for real:** the Docker images and the end-to-end flow against a live MongoDB haven't been run. They were authored on a machine without Docker. Unit tests, lint and builds pass.
- **Trailers only:** the player plays each title's `trailerUrl`. There's no field for a full-length stream yet. The HLS path is used when that URL is an `.m3u8`.
- **No progress bars:** "Continue watching" shows a resume time, because movie duration isn't stored.
- **No Content-Security-Policy yet:** nginx doesn't send one. Adding one would further harden the app against XSS, but it needs testing with the YouTube embed.

---

Authored by: Nilimesh Roy.
