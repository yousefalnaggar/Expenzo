# Expenzo

A production-grade expense tracker built with Next.js 16, Auth.js v5, and Prisma on Postgres (Supabase).

**Try it live:** _add your deployed URL here after deploying_

Demo login: `demo@expenzo.app` / `Demo1234!` (also available as a one-click "Try the demo" button on the login page)

## Stack

- **Next.js 16** — App Router, Turbopack, React 19.2
- **TypeScript** — strict mode
- **Tailwind CSS v4** + **shadcn/ui** (Base UI primitives)
- **Auth.js v5** — Credentials + Google OAuth, JWT sessions
- **Prisma 6** + **PostgreSQL** (Supabase)
- **Supabase Storage** — avatar uploads
- **Zod**, **react-hook-form**, **@tanstack/react-table**, **Recharts**, **date-fns**
- **Vitest** (unit) + **Playwright** (e2e)

## Architecture

```
UI (Server/Client Components)
  → Server Actions   (src/lib/actions/)   — writes only
  → Data Access Layer (src/lib/dal/)      — every Prisma query, every query scoped to the signed-in user
  → Prisma Client     (src/lib/db.ts)
  → PostgreSQL (Supabase)
```

Every DAL function re-verifies the session and scopes all reads/writes with `where: { userId }` — authorization is enforced at the data layer, not just at the route/middleware level.

## Local development

### Prerequisites

- Node 22 LTS
- A Supabase project (Postgres database + Storage bucket)

### Setup

```bash
npm install
cp .env.example .env.local   # fill in the values below
npx prisma migrate dev
npm run db:seed              # creates the demo account + sample data
npm run dev
```

App runs at `http://localhost:3000`.

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooled connection string (used by the app at runtime) |
| `DIRECT_URL` | Supabase direct connection string (used by Prisma Migrate) |
| `AUTH_SECRET` | Session encryption secret — generate with `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client credentials (Google Cloud Console) |
| `AUTH_URL` | Full base URL of the deployment (e.g. `https://your-app.vercel.app`) — required in production |
| `EXCHANGE_RATE_API_KEY` | Currency conversion API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL, used for avatar uploads |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — server-only, never exposed to the client |

### Google OAuth redirect URI

In the Google Cloud Console OAuth client, add an **Authorized redirect URI** for every environment you use:

- `http://localhost:3000/api/auth/callback/google` (local dev)
- `https://<your-production-domain>/api/auth/callback/google` (production)

## Scripts

```bash
npm run dev          # dev server (Turbopack)
npm run build        # production build
npm run start         # run the production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm test              # Vitest unit tests
npm run test:e2e      # Playwright e2e tests
npm run db:studio     # Prisma Studio
npm run db:seed       # seed demo data
```

## Deploying (Vercel + Supabase)

1. **Database**: create a Supabase project (or reuse your dev one), run `npx prisma migrate deploy` against it, and seed it if you want the demo account live in production.
2. **Storage**: in the Supabase dashboard, confirm the `avatars` bucket exists (created automatically on first avatar upload, or create it manually: public, 2MB file size limit, `image/png`/`image/jpeg`/`image/webp` only).
3. **Vercel**: import the GitHub repo, set the Framework Preset to Next.js, and add every variable from the table above to the Vercel project's Environment Variables (Production + Preview). Set `AUTH_URL` to the real deployment URL.
4. **Google OAuth**: add the production callback URL (see above) to the Google Cloud Console OAuth client — Google rejects sign-in until this is registered.
5. Deploy. Vercel runs `npm run build` (which runs `prisma generate` via `postinstall`); no further build config needed.

## Security notes

- Ownership is checked at the DAL for every query (`requireUserId()`), not only via route middleware — middleware-only auth checks are bypassable (see [CVE-2025-29927](https://github.com/advisories/GHSA-f82v-jwr5-mffw)).
- Passwords are hashed with bcrypt (cost 12); `passwordHash` never leaves the server in any query result.
- Login failures return a single generic message regardless of whether the email exists or the password is wrong.
- Money is stored as integer cents, never floats.
- Security headers (HSTS, X-Frame-Options, etc.) and rate limiting are applied on all routes — see `next.config.ts`.
