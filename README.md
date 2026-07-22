# Kangur

AI Shopping Assistant - Expo mobile + Next.js platform API.

## Architecture

```
kangur/
├── backend/     # Next.js platform API (Prisma, Neon, OpenAPI)
├── mobile/      # Expo app (Expo Router, NativeWind)
└── docs/        # prd, architecture, cursor-rules, roadmap, deploy
```

No pnpm workspace. No `packages/` monorepo.

## Prerequisites

- [ ] Node 24 LTS
- [ ] pnpm 9 (`npm i -g pnpm@9`)
- [ ] Neon account
- [ ] Clerk account
- [ ] OpenAI account
- [ ] Stripe account

## Development

1. Install deps

```bash
cd backend && pnpm install
cd ../mobile && pnpm install
```

2. Copy env

```bash
cp backend/.env.example backend/.env.local
cp mobile/.env.example mobile/.env
```

Fill Neon `DATABASE_URL` (pooled) + `DIRECT_URL` (direct).  
Set Clerk keys (`CLERK_SECRET_KEY`, publishable keys) and enable email/password + Google; allow unverified email for MVP.  
Set `EXPO_PUBLIC_API_URL` to `http://<LAN-IP>:3000` or an Expo tunnel - **not** `localhost` on a physical device.  
Google OAuth: add Clerk redirect URIs for Expo scheme `kangur://`. Apple auth is deferred.

3. Prisma migrate (backend)

```bash
cd backend
pnpm db:migrate:deploy
# or: pnpm db:migrate   # interactive for local/dev
```

4. Run

```bash
cd backend && pnpm dev          # 0.0.0.0:3000
cd mobile && pnpm start
```

## Deploy

Ops runbook: **[docs/deploy.md](docs/deploy.md)**

- Environments: local → staging (`staging-api.getkangur.com`) → production (`api.getkangur.com`)
- Landing: `getkangur.com` (never serves API)
- Order: merge feature → `staging` (local merge + push) → Vercel (`build:vercel` + migrate) → smoke → EAS preview / Closed Testing → later `staging` → `main` for production
- Neon DBs: `kangur-dev` / `kangur-staging` / `kangur-prod`

## Notes

- No Prisma Accelerate
- Neon branching: production / staging / local
- OpenAPI: `cd backend && pnpm openapi:generate` - do not hand-edit `openapi.json`
- Docs: `docs/prd.md`, `docs/architecture.md`, `docs/cursor-rules.md`, `docs/roadmap.md`, `docs/deploy.md`
- No pnpm workspace / no `packages/` monorepo
