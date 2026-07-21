# Kangur - Deployment

**Companion to:** [architecture.md](./architecture.md) · [prd.md](./prd.md) · [roadmap.md](./roadmap.md) · [cursor-rules.md](./cursor-rules.md)  
**Status:** Ops runbook (3 environments)  
**Last updated:** 2026-07-21

Canonical env templates: [backend/.env.example](../backend/.env.example) · [mobile/.env.example](../mobile/.env.example)

---

## 1. Environments

| Env | Purpose | Backend | Neon DB | Clerk | Stripe | Mobile (EAS) |
|-----|---------|---------|---------|-------|--------|--------------|
| **Local** | Daily work | `http://localhost:3000` | `kangur-dev` | Development | Test | `development` |
| **Staging** | Pre-release tests | `https://staging-api.getkangur.com` (branch `staging`) | `kangur-staging` | Development (same project) | Test | `preview` → Google Play Closed Testing |
| **Production** | Live | `https://api.getkangur.com` (branch `main`) | `kangur-prod` | Production instance | Live | `production` → store |

**Landing (production only):** `https://getkangur.com` - `/`, `/privacy`, `/terms`, `/contact`, `/delete-account`; `/support` → `/contact`. No staging landing domain; use Vercel Preview URLs on PRs.

Sync on MVP is **HTTP polling** (`EventPollingProvider`), not Ably/Pusher. Test “realtime” = shared-list polling behaviour.

---

## 2. Domains (`getkangur.com`)

| Purpose | Host / path |
|---------|-------------|
| Landing + legal | `https://getkangur.com` - `/{locale}/…` (pl, en, de, ru, uk, fr, es, it, cs, be); bare `/privacy` etc. redirect by cookie / `Accept-Language`; Privacy & Terms copy: PL + EN (EN fallback) |
| API Production | `https://api.getkangur.com` → Vercel branch `main` |
| API Staging | `https://staging-api.getkangur.com` → Vercel branch `staging` |
| Landing staging | **None** - Vercel Preview URL on PR |

One Vercel project can serve all of these via domain + env mapping. PR Preview deployments stay on temporary `*.vercel.app` URLs and do **not** replace the stable staging API host.

### Hard rule - API host isolation

API and technical endpoints (`/api/v1/...`, `/health`, `/metrics`, etc.) are available **only** under `api.*` subdomains (`api.getkangur.com`, `staging-api.getkangur.com`). The apex domain `getkangur.com` **never** serves those paths.

External configs (Google Play, Clerk, Stripe) must use apex URLs (`https://getkangur.com/...`), never `api.*`.

This keeps future surfaces (`app.getkangur.com`, `admin.getkangur.com`) independent while the API contract stays in one place.

---

## 3. Git & release flow

```
feature/*
      │
      ▼
Pull Request → staging
      │
      ▼
Deploy Preview (staging)
      │
      ▼
Smoke tests
      │
      ▼
Google Play Closed Testing
      │
      ▼
Akceptacja
      │
      ▼
Pull Request → main
      │
      ▼
Deploy Production
      │
      ▼
Google Play Production
```

Branch model:

```
feature/xxx  →  staging  →  main
```

- **`staging`** - shared pre-production API + Closed Testing builds
- **`main`** - production API + store production
- **PR previews** - isolated Vercel URLs for a single change (optional check before merging to `staging`)

---

## 4. Deployment order

Never guess “migrate or deploy first.” Always:

1. **Merge branch** (`feature/*` → `staging`, later `staging` → `main`)
2. **Deploy Backend** (Vercel)
3. **Run Prisma migrations** - `pnpm db:migrate:deploy` against that env’s `DIRECT_URL`
4. **Verify API health** - smoke: auth, list CRUD, billing route reachable
5. **Verify Stripe webhook** - Dashboard deliveries + checkout smoke
6. **Build Mobile** - EAS `preview` (staging) or `production` (main)
7. **Closed Testing** - Google Play closed/internal track (staging path)
8. **Production** - store production track (after `main` deploy + acceptance)

Same order for staging and production releases. Migrations run **after** backend deploy so the live code matches the new schema as soon as migrate finishes.

Local Stripe webhooks:

```bash
stripe listen --forward-to localhost:3000/api/v1/billing/webhook
```

---

## 5. Rollback (MVP)

```
Deployment failed
      │
      ▼
Rollback Backend (Vercel previous deployment)
      │
      ▼
Rollback Mobile?
  ├── Yes (build already in store track) → halt / halt rollout
  └── No (not published) → skip
      │
      ▼
Restore DB?
  ├── Migration broke schema/data → Neon branch restore / backup
  └── Code bug only → skip DB restore (prefer forward-fix)
      │
      ▼
Disable feature flag? (kill switch without full rollback)
```

| Layer | MVP action |
|-------|------------|
| Backend | Redeploy previous Vercel deployment |
| Mobile | Only if already in Closed/Production - halt rollout; otherwise don’t publish |
| DB | Restore only when migration damaged schema/data; prefer forward-fix when safe |
| Feature flag | Kill switch: `HISTORY_SUGGESTIONS_ENABLED=false` (backend) and/or mobile `EXPO_PUBLIC_*` |

---

## 6. Services matrix

### 6.1 Vercel (backend)

- **One project**
- `main` → `api.getkangur.com` (Production env vars)
- `staging` → `staging-api.getkangur.com` (Preview / Staging env vars - map branch `staging` to the staging domain)
- Landing `getkangur.com` on production - same Next.js `backend/` deploy (`app/(marketing)/`); set `NEXT_PUBLIC_SITE_URL=https://getkangur.com`
- Root directory: `backend`
- Build: `prisma generate && next build` (see `backend/package.json`)
- Prefer **Neon → Vercel integration** for `DATABASE_URL` / `DIRECT_URL` per environment

### 6.2 Neon (Postgres)

| Env | DB / branch |
|-----|-------------|
| Local | `kangur-dev` |
| Staging | `kangur-staging` |
| Production | `kangur-prod` |

- Runtime: **pooled** URL → `DATABASE_URL`
- Migrations: **direct** URL → `DIRECT_URL`
- **Never** point staging at production (or vice versa)
- No Prisma Accelerate on MVP

```bash
cd backend
pnpm db:migrate:deploy   # uses DIRECT_URL
```

### 6.3 Clerk

| Env | Instance |
|-----|----------|
| Local + Staging | **Development** (one project) |
| Production | **Production** instance |

Mobile `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` must match the backend publishable key for that environment. No Clerk webhooks in MVP - Bearer JWT only.

### 6.4 Stripe

One Stripe account; modes split by environment:

| Env | Mode | Price IDs |
|-----|------|-----------|
| Local + Staging | **Test** | `price_test_*` (e.g. monthly) |
| Production | **Live** | `price_live_*` |

**Price IDs are never shared** across test and live. Set per env:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (one secret **per webhook endpoint URL**)
- `STRIPE_PRICE_PREMIUM_MONTHLY` (and yearly when used)
- `STRIPE_PRODUCT_PREMIUM` (product id for the env)

Webhook endpoints:

| Env | URL |
|-----|-----|
| Local | `stripe listen` → `localhost:3000/api/v1/billing/webhook` |
| Staging | `https://staging-api.getkangur.com/api/v1/billing/webhook` |
| Production | `https://api.getkangur.com/api/v1/billing/webhook` |

Events handled: `checkout.session.completed`, `customer.subscription.created|updated|deleted`.

### 6.5 OpenAI

One OpenAI account, **two projects**:

| Project | Used by |
|---------|---------|
| **Kangur Development** | Local + Staging |
| **Kangur Production** | Production |

Separate API keys, usage, limits, and billing dashboards. Set `OPENAI_API_KEY` per env. Optional: `OPENAI_MODEL_TEXT`, `OPENAI_MODEL_VISION`, `AI_FREE_MONTHLY_CREDITS` (default `30`).

### 6.6 Resend (optional)

Invite emails when `RESEND_API_KEY` + `EMAIL_FROM` are set. Without them, invites still work (accept URL returned/logged). Prefer a verified sending domain on production. `INVITE_ACCEPT_URL_BASE` defaults to `kangur://invite`.

### 6.7 Expo Push / EAS

| EAS profile | Distribution | Typical API URL |
|-------------|--------------|-----------------|
| `development` | Dev client, internal | `http://<LAN-IP>:3000` |
| `preview` | Internal → Closed Testing | `https://staging-api.getkangur.com` |
| `production` | Store | `https://api.getkangur.com` |

Profiles live in [mobile/eas.json](../mobile/eas.json). They do **not** inject `EXPO_PUBLIC_*` today - set via **EAS Secrets** or `env` per profile:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_APP_ENV` (`development` \| `preview` \| `production`)

Push uses Expo Push API (`exp.host/.../push/send`); keep EAS `projectId` in `app.json` consistent.

### 6.8 PostHog + Sentry

Enable from **Closed Testing** onward. Tag every event/crash with `environment=development|staging|production`.

#### PostHog - required events

| Event | When |
|-------|------|
| `workspace_created` | Workspace created |
| `shopping_started` | Enter Shopping Mode |
| `shopping_finished` | Finish Shopping → Summary |
| `premium_purchased` | Premium checkout completed / entitlement active |
| `ai_import_started` | AI import (screenshot/text) started |
| `ai_import_completed` | AI import succeeded |
| `ai_import_failed` | AI import failed |

#### Sentry - required context

Attach on every event/session:

| Field | Example |
|-------|---------|
| `release` | `1.0.3 (23)` - semver + build number |
| `environment` | `development` \| `staging` \| `production` |
| `userId` | Clerk / platform user id |
| `workspaceId` | Active workspace id |
| device model | e.g. Samsung S25 |
| OS version | e.g. Android 14 |

---

## 7. Environment variables

### 7.1 Backend

Source of truth: [backend/.env.example](../backend/.env.example).

| Variable | Local | Staging | Production | Notes |
|----------|-------|---------|------------|-------|
| `APP_URL` | `http://localhost:3000` | `https://staging-api.getkangur.com` | `https://api.getkangur.com` | No trailing slash; API host (Stripe etc.) |
| `NEXT_PUBLIC_APP_URL` | same | same | same | If needed by Next client |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Preview URL / same as deploy | `https://getkangur.com` | Marketing apex; `metadataBase`, sitemap, OG |
| `NEXT_PUBLIC_PLAY_STORE_URL` | Play listing URL | same | same | Home Google Play CTA |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `contact@getkangur.com` | same | same | `/contact` general inbox |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | `support@getkangur.com` | same | same | Support + delete-account |
| `CORS_ALLOWED_ORIGINS` | Expo web origins | as needed | as needed | Comma-separated |
| `DATABASE_URL` | Neon `kangur-dev` pooler | `kangur-staging` pooler | `kangur-prod` pooler | Runtime |
| `DIRECT_URL` | Neon direct | Neon direct | Neon direct | Migrations only |
| `CLERK_SECRET_KEY` | Dev | Dev | Prod | JWT verify |
| `CLERK_PUBLISHABLE_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Dev | Dev | Prod | Match mobile |
| `OPENAI_API_KEY` | Kangur Development | Kangur Development | Kangur Production | Separate projects |
| `AI_FREE_MONTHLY_CREDITS` | `30` | `30` | `30` | Or override |
| `HISTORY_SUGGESTIONS_ENABLED` | optional | optional | optional | Kill switch |
| `STRIPE_SECRET_KEY` | Test | Test | Live | Never mix |
| `STRIPE_WEBHOOK_SECRET` | from `stripe listen` | staging endpoint | prod endpoint | Per URL |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | `price_test_*` | `price_test_*` | `price_live_*` | **Never share** test↔live |
| `STRIPE_PRODUCT_PREMIUM` | test product | test product | live product | |
| `STRIPE_PRICE_PREMIUM_YEARLY` | when used | when used | when used | Same split rule |
| `BILLING_RETURN_URL_BASE` | `kangur://premium` | `kangur://premium` | `kangur://premium` | |
| `RESEND_API_KEY` / `EMAIL_FROM` | optional | optional | preferred | Invites |
| `INVITE_ACCEPT_URL_BASE` | `kangur://invite` | same | same | |
| `PLATFORM_ADMIN_EMAILS` | optional | optional | optional | Bootstrap admins |
| PostHog / Sentry secrets | optional locally | required for Closed Testing+ | required | When wired |

Vercel system vars (`VERCEL`, `VERCEL_ENV`, `VERCEL_URL`, …) are auto-injected - do not paste into local `.env`.

### 7.2 Mobile

Source of truth: [mobile/.env.example](../mobile/.env.example). **No secrets** (no OpenAI, Stripe secret, Clerk secret, DB URLs).

| Variable | Local | Staging / preview | Production |
|----------|-------|-------------------|------------|
| `EXPO_PUBLIC_API_URL` | `http://<LAN-IP>:3000` | `https://staging-api.getkangur.com` | `https://api.getkangur.com` |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Dev | Dev | Prod |
| `EXPO_PUBLIC_APP_ENV` | `development` | `preview` | `production` |
| `EXPO_PUBLIC_AI_REVIEW_ENABLED` | as needed | as needed | as needed |
| `EXPO_PUBLIC_HISTORY_SUGGESTIONS_ENABLED` | optional UX hide | optional | optional |

---

## 8. Mobile versioning

| Field | Example | Location |
|-------|---------|----------|
| `version` | `1.0.3` | `mobile/app.json` → `expo.version` |
| `android.versionCode` | `23` | `mobile/app.json` → `expo.android.versionCode` |
| `ios.buildNumber` | `23` | `mobile/app.json` → `expo.ios.buildNumber` |

**Rule:** increment `versionCode` / `buildNumber` on **every** store release. EAS `production` has `autoIncrement: true`, but keep `app.json` (or remote app version source) consistent so humans and Sentry agree.

Sentry / PostHog release label: `1.0.3 (23)`.

---

## 9. CI (GitHub Actions)

Target pipeline (no deploy yet - CI ≠ CD):

```
pnpm lint
      │
      ▼
typecheck
      │
      ▼
tests
      │
      ▼
build backend
      │
      ▼
build mobile
```

Current workflow: [.github/workflows/ci.yml](../.github/workflows/ci.yml) - backend lint / typecheck / OpenAPI drift / build; mobile lint / typecheck. Extend toward the full pipeline above; **do not** auto-deploy from CI until CD is intentional.

---

## 10. Checklists

### 10.1 First-time staging / production setup

1. Create Neon DB/branch (`kangur-staging` or `kangur-prod`)
2. Set Vercel env vars for that environment (including Neon URLs)
3. Deploy backend once → run `pnpm db:migrate:deploy`
4. Configure Clerk keys (Dev for staging, Prod for production)
5. Create Stripe webhook endpoint + Price IDs for that mode; set secrets
6. Set OpenAI key from the correct project (Development vs Production)
7. Configure EAS Secrets for the matching mobile profile
8. Wire PostHog + Sentry (from Closed Testing)
9. Smoke: auth → list → AI import → billing return deep link

### 10.2 Every release

Follow [§4 Deployment order](#4-deployment-order). Then bump mobile version numbers ([§8](#8-mobile-versioning)).

### 10.3 Safety

- Never put secrets on mobile
- Never mix Live Stripe / Clerk Production / Neon prod with local or staging clients
- Never serve API from `getkangur.com` apex
- Prefer feature-flag kill switches before emergency DB restores

---

## 11. Out of scope (MVP)

- Ably / Redis / object storage / Clerk webhooks
- Staging landing domain
- Automated CD (deploy from CI)
- Prisma Accelerate

Realtime remains smart polling until a later milestone.
