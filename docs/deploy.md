# Kangur - Deployment

**Companion to:** [architecture.md](./architecture.md) · [prd.md](./prd.md) · [roadmap.md](./roadmap.md) · [cursor-rules.md](./cursor-rules.md)  
**Status:** Ops runbook (3 environments)  
**Last updated:** 2026-07-23

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
Local merge → staging  (+ push origin staging)
      │
      ▼
Vercel deploy staging (build:vercel + migrate)
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
Local merge staging → main  (+ push)   [when releasing]
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
- **Default merge path:** local `git checkout` target → `git pull` → `git merge` source → `git push` (no GitHub PR / `gh` required). GitHub PRs are optional when you want review UI.

### 3.1 Merge feature → staging (agent / ops)

```bash
git fetch origin staging <feature-branch>
git checkout staging
git pull origin staging
git merge <feature-branch>    # fast-forward when possible
git push origin staging
```

Vercel picks up `staging` and runs `pnpm build:vercel` (`prisma migrate deploy` included).

### 3.2 Promote staging → main

```bash
git fetch origin main staging
git checkout main
git pull origin main
git merge staging
git push origin main
```

Only when explicitly releasing to production.
---

## 4. Deployment order

Never guess “migrate or deploy first.” Always:

1. **Merge branch** (`feature/*` → `staging`, later `staging` → `main`)
2. **Deploy Backend** (Vercel) - build runs `pnpm build:vercel` (`prisma migrate deploy` → `prisma generate` → `next build`) via [`backend/vercel.json`](../backend/vercel.json)
3. **Verify API health** - smoke: auth, list CRUD, billing route reachable
4. **Verify Stripe webhook** - Dashboard deliveries + checkout smoke
5. **Build Mobile** - EAS `preview` (staging) or `production` (main)
6. **Closed Testing** - Google Play closed/internal track (staging path)
7. **Production** - store production track (after `main` deploy + acceptance)

Same order for staging and production. Migrations apply **during the Vercel build** (before the new deployment goes live). Failed migrate fails the build — new code without schema does not ship.

Manual escape hatch (local / broken deploy):

```bash
cd backend
pnpm db:migrate:deploy   # against that env’s DIRECT_URL
```

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
- Build: `pnpm build:vercel` (see [`backend/vercel.json`](../backend/vercel.json) + `backend/package.json`)
  - `prisma migrate deploy` (needs `DIRECT_URL`)
  - `prisma generate && next build`
- CI / local `pnpm build` does **not** migrate (dummy DB in CI) — only Vercel uses `build:vercel`
- Prefer **Neon → Vercel integration** for `DATABASE_URL` / `DIRECT_URL` per environment
- Ensure `DIRECT_URL` is set for **Production** and **Preview** (staging) build env — migrate fails closed without it

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
pnpm db:migrate:deploy   # manual / local; Vercel runs this in build:vercel
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

Separate API keys, usage, limits, and billing dashboards. Set `OPENAI_API_KEY` per env. Optional: `OPENAI_MODEL_TEXT`, `OPENAI_MODEL_VISION`, `AI_FREE_MONTHLY_CREDITS` (default `15`).

### 6.6 Resend (optional)

Invite emails when `RESEND_API_KEY` + `EMAIL_FROM` are set. Without them, invites still work (accept URL returned/logged). Prefer a verified sending domain on production. `INVITE_ACCEPT_URL_BASE` defaults to `kangur://invite`.

### 6.7 Expo Push / EAS

| EAS profile | Android / iOS id | App name | Typical API URL |
|-------------|------------------|----------|-----------------|
| `development` | `app.kangur.dev` | Kangur DEV (green badge) | `http://<LAN-IP>:3000` |
| `preview` | `app.kangur` | Kangur | `https://staging-api.getkangur.com` |
| `production` | `app.kangur` | Kangur | `https://api.getkangur.com` |

Dual-install: DEV and store builds can sit side-by-side on one device. `preview` and `production` **must** share `app.kangur` (Play listing application ID) so Play updates replace Internal Testing.

Profiles live in [mobile/eas.json](../mobile/eas.json). They set `EXPO_PUBLIC_APP_ENV`; other `EXPO_PUBLIC_*` via **EAS Secrets** / environment:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_APP_ENV` (`development` \| `preview` \| `production`)

Push uses Expo Push API (`exp.host/.../push/send`); keep EAS `projectId` in `app.config.ts` consistent.

**Push delivery vs badge (two systems):**
- Badge / unread dot always comes from `GET /api/v1/notifications` (backend state). App refreshes that data on AppState active, pull-to-refresh, and when a push is received — never treats push delivery as the badge source of truth.
- OS push requires FCM (Android) + APNs (iOS) credentials configured in EAS for this Expo project, a physical device, notification permission granted, and an active `PushDevice` row (`disabledAt` null). Stale Expo tokens are soft-deactivated (`disabledAt`) when Expo returns `DeviceNotRegistered`.
- Prefs: some types (e.g. list created) default **OFF** — enable in Settings → Notifications for those events to create rows + pushes.
- **Smoke test should verify both notification delivery and badge refresh independently.**

**Sign in with Apple (native):** `app.config.ts` sets `ios.usesAppleSignIn` and the `expo-apple-authentication` plugin. After those native changes, run `expo prebuild` (local iOS) **and** ship a new EAS **Development / Preview iOS** build before device QA. Enable Apple in Clerk Dashboard + Apple Developer (Services ID / key) — credentials are not stored in the repo. OAuth redirects: store `kangur://`, DEV `kangur-dev://`.

#### Dual-install checklist (`app.kangur.dev`)

- [ ] Clerk: allow redirect scheme `kangur-dev://` (and native apps) for Development instance
- [ ] Google Cloud OAuth: Android client for package `app.kangur.dev` + SHA-1 of the **development** keystore (EAS credentials)
- [ ] First `eas build --profile development` — EAS creates a separate Android keystore for the new package
- [ ] Local invites / deep links while on DEV: use `kangur-dev://` (store builds keep `kangur://`)

### 6.8 PostHog + Sentry

Enable from **Closed Testing** onward (**M13.11** — full catalogue, privacy rules, flags, and rollout order in [roadmap.md](./roadmap.md) § M13.11). Tag every event/crash with `environment=development|staging|production`.

#### PostHog - required events (summary)

Full list + props + ownership in M13.11 / `shared/analytics/`. Minimum for Closed Testing:

| Event | When |
|-------|------|
| `account_created` | First account upsert (backend) |
| `workspace_created` | Workspace created (backend) |
| `shopping_started` | Enter Shopping Mode |
| `shopping_finished` | Finish Shopping → Summary |
| `shopping_cancelled` | Exit Shopping Mode without finish |
| `subscription_activated` | Premium entitlement active (Stripe webhook only) |
| `ai_import_started` | AI import (screenshot/text/clipboard) started |
| `ai_import_edited` | User edited ≥1 Review row before apply |
| `ai_import_accepted` | AI import applied with ≥1 item |
| `ai_import_rejected` / `ai_import_failed` | Abandoned or failed |

No autocapture; no Session Replay in MVP. Every event includes `schemaVersion` + `environment`.

#### Sentry - required context

Attach on every event/session:

| Field | Example |
|-------|---------|
| `release` | `1.0.3 (23)` - semver + build number |
| `environment` | `development` \| `staging` \| `production` |
| `userId` | Opaque platform user id |
| `workspaceId` | Active workspace id |
| `domain` / `severity` | Closed enums when set |
| `requestId` | Logical op (e.g. one AI import) |
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
| `AI_FREE_MONTHLY_CREDITS` | `15` | `15` | `15` | Or override |
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
| `POSTHOG_KEY` / `POSTHOG_HOST` | optional | Closed Testing+ | required | Product analytics (noop if unset) |
| `ANALYTICS_ENABLED` | `0` | `1` | `1` | Force on in local; kill with `0` |
| `SENTRY_DSN` | optional | Closed Testing+ | required | Crash/API errors |
| `SENTRY_DEV` | `0` | — | — | Force Sentry on in development |

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
| `EXPO_PUBLIC_POSTHOG_KEY` / `HOST` | optional | Closed Testing+ | required |
| `EXPO_PUBLIC_ANALYTICS_ENABLED` | `0` | — | — | Force on in local Dev Client |
| `EXPO_PUBLIC_SENTRY_DSN` | optional | Closed Testing+ | required |
| `EXPO_PUBLIC_SENTRY_DEV` | `0` | — | — | Force Sentry on in development |

---

## 8. Mobile versioning

Canonical config: [`mobile/app.config.ts`](../mobile/app.config.ts) (not `app.json`).

| Field | When it changes | Example | Source |
|-------|-----------------|---------|--------|
| **Version** (semver) | Milestone / product release only | M13 → `0.9.0`, …, MVP → `1.0.0`, patch → `1.0.1` | `version` in `app.config.ts` |
| **Build** | Every EAS **preview** and **production** APK | `121`, `122`, `123` | Native `versionCode` / `buildNumber` via EAS `autoIncrement` + `appVersionSource: "remote"` |
| **Environment** | Per EAS profile | `development` / `preview` / `production` | `EXPO_PUBLIC_APP_ENV` in [`eas.json`](../mobile/eas.json) → `extra.appEnv` |
| **Commit** | Every EAS build | `95d8561` | `EAS_BUILD_GIT_COMMIT_HASH` → `extra.gitCommit` |
| **API host** | Build-time API URL | `staging.getkangur.com` | `EXPO_PUBLIC_API_URL` (shown on About for misconfig detection) |

**Do not** bump semver on every preview APK. Between milestones testers report e.g. `0.10.0 (Build 122)`.

UI: [`getAppBuildInfo()`](../mobile/lib/app-build-info.ts) powers About + Profile. Dev Client shows **Development Build** (no product semver). About shows Version, Build, Environment badge, Commit (tap to copy), and API.

Sentry / PostHog release label: `{{version}} ({{build}})`.

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
2. Set Vercel env vars for that environment (including Neon `DATABASE_URL` + `DIRECT_URL`)
3. Deploy backend once — `build:vercel` applies pending migrations automatically
4. Configure Clerk keys (Dev for staging, Prod for production)
5. Create Stripe webhook endpoint + Price IDs for that mode; set secrets
6. Set OpenAI key from the correct project (Development vs Production)
7. Configure EAS Secrets for the matching mobile profile
8. Wire PostHog + Sentry (from Closed Testing)
9. Smoke: auth → list → AI import → billing return deep link

### 10.2 Every release

Follow [§4 Deployment order](#4-deployment-order). Bump **semver** only on product milestones; EAS auto-increments **build** on preview/production ([§8](#8-mobile-versioning)).

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
