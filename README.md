<div align="center">

# Expenzo

**A fast, secure personal expense tracker.**

Track spending, categorize it, and see where your money actually goes — with a dashboard that turns raw expenses into charts you'll actually look at.

[**Live App**](https://expenzotracker.vercel.app/) · [Report a bug](../../issues) · [Request a feature](../../issues)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript) ![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma) ![Tailwind](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss) ![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## The idea

Most expense trackers are either a spreadsheet in disguise or bloated with features nobody uses. Expenzo is the middle ground: log an expense in a few seconds, tag it with a category, and let the dashboard do the thinking — spend-by-category breakdowns, monthly trends, and a searchable/filterable history, all scoped tightly and securely to your own account.

**[expenzotracker.vercel.app →](https://expenzotracker.vercel.app/)**

Try it instantly with the **"Try the demo"** button on the login page — no signup needed:

```
demo@expenzo.app / Demo1234!
```

## Features

- 🔐 **Auth** — email/password or Google sign-in, secure sessions, generic error messages that never leak whether an account exists
- 💸 **Expense tracking** — add, edit, delete, with optional notes, all validated client- and server-side
- 🏷️ **Categories** — custom categories with color tags; deleting one never deletes the expenses, they just fall back to "Uncategorized"
- 🔎 **Filtering & search** — by date range, category, and free text, with URL-based state and pagination
- 📊 **Dashboard** — summary cards, spend-by-category chart, monthly trend, recent activity
- 🌍 **Multi-currency** — live exchange-rate conversion for a personal preferred currency
- 🖼️ **Profile** — editable name/email/password, avatar upload via Supabase Storage
- 🌓 **Dark mode**, toasts, skeleton loading states, and full keyboard/focus accessibility on every dialog
- 📱 **Responsive** — a genuinely usable mobile layout down to 320px, not just a squeezed desktop view
- 🛡️ **Security-first** — every single database query is scoped to the authenticated user at the data-access layer (not just route middleware), rate limiting on auth endpoints, HSTS/CSP-adjacent security headers, bcrypt password hashing, money stored as integer cents

## Stack

| Layer | Tech |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack, React 19.2) |
| Language | TypeScript, strict mode, no `any` |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (Base UI primitives) |
| Auth | [Auth.js v5](https://authjs.dev) — Credentials + Google OAuth, JWT sessions |
| Database | [Prisma 6](https://www.prisma.io) + PostgreSQL ([Supabase](https://supabase.com)) |
| Storage | Supabase Storage (avatar uploads) |
| Forms & validation | [Zod](https://zod.dev), react-hook-form |
| Data & charts | @tanstack/react-table, Recharts, date-fns |
| Testing | Vitest (unit) + Playwright (e2e) |
| Hosting | Vercel |

## Architecture

```
UI (Server / Client Components)
      │
      ▼
Server Actions        src/lib/actions/      writes only
      │
      ▼
Data Access Layer      src/lib/dal/          every DB query lives here, scoped to the user
      │
      ▼
Prisma Client           src/lib/db.ts
      │
      ▼
PostgreSQL (Supabase)
```

Every function in the Data Access Layer independently re-verifies the session and scopes its query with `where: { userId }`. Route-level protection (`proxy.ts`) is treated as a UX convenience only — the real authorization boundary is the DAL, since middleware-only auth checks are a known bypass vector ([CVE-2025-29927](https://github.com/advisories/GHSA-f82v-jwr5-mffw)).

## Getting started

### Prerequisites

- Node 22 LTS
- A [Supabase](https://supabase.com) project (Postgres database + Storage)

### Installation

```bash
git clone https://github.com/yousefalnaggar/Expenzo.git
cd Expenzo
npm install
cp .env.example .env.local   # fill in the values below
npx prisma migrate dev
npm run db:seed              # creates the demo account + sample data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooled connection string (runtime) |
| `DIRECT_URL` | Supabase direct connection string (migrations) |
| `AUTH_SECRET` | Session encryption secret — `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client credentials |
| `AUTH_URL` | Canonical deployment URL (e.g. `https://your-app.vercel.app`) — required in production |
| `EXCHANGE_RATE_API_KEY` | Currency conversion API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (avatar uploads) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — server-only, never exposed to the client |

**Google OAuth:** add these to the OAuth client's Authorized redirect URIs in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

- `http://localhost:3000/api/auth/callback/google` (local dev)
- `https://<your-production-domain>/api/auth/callback/google` (production)

### Scripts

```bash
npm run dev          # dev server (Turbopack)
npm run build        # production build
npm run start        # run the production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm test               # Vitest unit tests
npm run test:e2e       # Playwright e2e tests
npm run db:studio      # Prisma Studio
npm run db:seed        # seed demo data
```

## Deployment

Deployed on **Vercel** with a **Supabase** Postgres database and Storage bucket.

1. **Database** — provision (or reuse) a Supabase project, then run `npx prisma migrate deploy` against it.
2. **Storage** — the `avatars` bucket is created automatically on first upload, or create it manually (public, 2MB limit, `image/png`/`jpeg`/`webp` only).
3. **Vercel** — import the repo, add every variable from the table above under Project → Settings → Environment Variables, and set `AUTH_URL` to the real deployment URL.
4. **Google OAuth** — register the production callback URL (see above) before enabling Google sign-in.
5. Deploy — `postinstall` runs `prisma generate` automatically, no extra build config needed.

## Security

- Ownership enforced at the data layer (`requireUserId()`) on every single query, independent of route middleware
- Passwords hashed with bcrypt (cost 12); the hash never leaves the server in any query result
- Generic, non-enumerable login errors — never reveals whether an email is registered
- Money stored as integer cents, never floats
- Security headers (HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) and rate limiting on all routes

## License

[MIT](LICENSE) © Yousef Alnaggar
