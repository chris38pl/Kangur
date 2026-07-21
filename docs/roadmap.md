# Kangur - MVP Implementation Roadmap

**Status:** Living document - return here between milestones  
**Last updated:** 2026-07-21  
**Companions:** [prd.md](./prd.md) · [architecture.md](./architecture.md) · [cursor-rules.md](./cursor-rules.md) · [deploy.md](./deploy.md)

---

## Locked defaults

| Decision | Value |
|----------|--------|
| Repo layout | `mobile/` + `backend/` + `docs/` - **no `packages/`** |
| Database | **Neon** (serverless Postgres) + Prisma - **no Prisma Accelerate** |
| Free AI Credits | **30 / month** per workspace |
| AI Credit costs | Screenshot **2** · Text/Clipboard **1** |
| Invites | Email |
| Auth | Clerk: **email/password**, **Google**, **Apple** |
| AI Review | Always shown (compact when all high-confidence) |
| OpenAPI | **Generated from Zod only** - never hand-edit |
| Env setup | Complete `.env.example` from M01 (fresh clone in minutes) |

### OpenAPI (non-negotiable)

Spec is generated automatically from Zod (e.g. `@asteasolutions/zod-to-openapi` + build/CI script). Routes register Zod schemas; clients may consume the generated file. If the spec drifts, fix the **Zod source** - not the OpenAPI document.

### Product-first order (why)

```
Workspace → CRUD → AI (Import→Processing→Review→Apply) → Shopping Mode → Invites → Polling → …
```

Screenshot → AI → list is the product. Invites and polling support collaboration but do not define the wedge. Shopping Mode ships right after AI so the demo already works end-to-end.

```mermaid
flowchart TD
  M01[M01 Bootstrap]
  M02[M02 Auth Clerk]
  M03[M03 Workspace]
  M04[M04 Lists CRUD]
  M05[M05 Items Events]
  M06[M06 AI Full Path]
  M07[M07 AI Credits]
  M08[M08 Shopping Mode]
  M09[M09 Invites]
  M095[M09.5 Notifications]
  M10[M10 Smart Polling]
  M11[M11 History Repeat]
  M12[M12 Settings Profile]
  M125[M12.5 AI Evals]
  M13[M13 Stripe Premium]
  M138[M13.8 Landing]
  M139[M13.9 Brand Boot]
  M14[M14 Polish]
  M15[M15 Custom Categories]

  M01 --> M02 --> M03 --> M04 --> M05 --> M06 --> M07 --> M08
  M03 --> M09
  M08 --> M09
  M09 --> M095
  M08 --> M095
  M05 --> M10
  M08 --> M10
  M09 --> M10
  M095 --> M10
  M08 --> M11
  M03 --> M12
  M12 --> M125
  M11 --> M125
  M07 --> M13
  M11 --> M13
  M125 --> M13
  M10 --> M14
  M11 --> M14
  M12 --> M14
  M13 --> M138 --> M139 --> M14
  M14 --> M15
```

### Cursor habit

One vertical slice per milestone; register new Zod schemas so OpenAPI regenerates in the same change; no Redux/MobX; keep docs to: `prd.md`, `architecture.md`, `cursor-rules.md`, `roadmap.md`, `deploy.md`.

### Milestone status

| ID | Milestone | Status |
|----|-----------|--------|
| M01 | Bootstrap | done |
| M02 | Auth (Clerk) | done |
| M03 | Workspace | done |
| M04 | Lists CRUD | done |
| M05 | Items + events | done |
| M06 | AI full path | done |
| M07 | AI Credits | done |
| M08 | Shopping Mode | done |
| M08.5 | Data Sync Engine | done |
| M09 | Invites | done |
| M09.5 | Notifications (MVP) | done |
| M10 | Smart polling | done |
| M11 | History + Repeat | done |
| M12 | Settings + Profile | done |
| M12.5 | AI Evaluation Framework | pending |
| M13 | Stripe Premium (+ AI Generate from History) | pending |
| M13.4 | App Menu + Platform Console shell | done |
| M13.5 | Observability foundation | done |
| M13.6 | Platform Console Realtime | done |
| M13.8 | Public landing + legal | done |
| M13.9 | Brand Boot Animation | done |
| M14 | Polish + RC | pending |
| M15 | Custom categories (post-MVP) | pending |
| M13.7 | Client Metrics Ingestion | deferred (post-release) |

---

## M01 - Bootstrap (repo, apps, design tokens, i18n shell)

**Goal:** Runnable empty Expo + Next.js + Prisma + **Neon** + CI skeleton with design-system tokens, PL/EN wiring, and **complete `.env.example` files** (no product features yet).

**Creates:**
- `backend/package.json`, `backend/tsconfig.json`, `backend/next.config.ts`, `backend/app/layout.tsx`, `backend/app/api/health/route.ts`
- `backend/prisma/schema.prisma` (minimal stub + `DIRECT_URL` support if using Neon pooler), `backend/lib/prisma.ts`
- `backend/openapi/registry.ts`, `backend/scripts/generate-openapi.ts` (or npm script), generated `backend/openapi/openapi.json` (**gitignored or marked GENERATED - never hand-edited**)
- **`backend/.env.example`** - full variable set from day one (Neon `DATABASE_URL` / `DIRECT_URL`, Clerk, OpenAI, Stripe, `AI_FREE_MONTHLY_CREDITS=30`, `APP_URL`, …)
- **`mobile/.env.example`** - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_URL`
- `mobile/package.json`, Expo Router `mobile/app/_layout.tsx`, `mobile/app/(tabs)/_layout.tsx` + placeholder tab screens
- `mobile/design-system/tokens.ts`, `mobile/design-system/theme.ts`
- `mobile/lib/i18n/index.ts`, `mobile/lib/i18n/pl.json`, `mobile/lib/i18n/en.json`
- `mobile/lib/api/client.ts` (base URL only), `mobile/lib/query/client.tsx`
- Root `README.md` (setup: Neon project → copy env → migrate → run), `.gitignore`, optional `.github/workflows/ci.yml` (include `openapi:generate` check)
- Document Neon branching: production / preview / local (README)

**Depends on:** nothing  
**Complexity:** M  

**Acceptance:**
- [ ] `backend` starts; `GET /api/health` returns 200
- [ ] Expo app launches with 4 placeholder tabs
- [ ] Tokens + i18n switch PL/EN works on a demo string
- [ ] Prisma migrates successfully against **Neon** (pooled + direct URL pattern documented)
- [ ] **No Prisma Accelerate** in dependencies
- [ ] `pnpm openapi:generate` (or equivalent) produces OpenAPI from Zod registry only
- [ ] `.env.example` files list every expected secret/public var (including future Clerk/Stripe/OpenAI) so setup is copy-fill-run
---

## M02 - Authentication (Clerk)

**Goal:** Sign up / sign in via **email/password** and **Google**; Bearer JWT → `requireUser()` → `UserContext`; `GET /api/v1/me`.

**Status:** done (2026-07-16)  
**Deferred:** Apple Sign In (architecture-ready; implement before App Store path)

**Creates:**
- Prisma `User` (`clerkId`, `email`, nullable `locale`, timestamps)
- `backend/lib/auth/clerk.ts`, `requireUser.ts` → `UserContext`, `errors.ts`
- `backend/app/api/v1/me/route.ts` + OpenAPI from Zod
- `mobile` ClerkProvider + secure token cache, `(auth)` screens, route guards, `useMe()`, Profile sign out
- Env keys / Google redirect notes in `.env.example` + README (Apple deferred)

**Depends on:** M01  
**Complexity:** M  

**Acceptance:**
- [x] Email/password sign-up and sign-in (Clerk + mobile screens)
- [x] Google OAuth (mobile; Clerk Dashboard + `kangur://` redirect)
- [x] Apple Sign In **deferred** (not in M02)
- [x] `GET /api/v1/me` → 401 `{ code, message }` unauthenticated; 200 user DTO when valid; upsert + `updatedAt` touch; locale from device when null
- [x] Signed-out users redirected from tabs → auth; session restore via secure store
- [x] `requireUser` returns `UserContext`; single `useMe()`; auth `console.info` logs

---

## M03 - Workspace core (provision, avatar, switcher)

**Goal:** On first login, upsert `User` + default Home workspace; create/list/switch workspaces with icon id.

**Status:** done (2026-07-16)

**Creates (backend):**
- Prisma: `Workspace`, `WorkspaceMember` (`joinedAt`), `WorkspaceSettings`, optional `Subscription` (Premium only). **No AIUsage in M03.**
- `shared/workspace-icons.ts` - `{ id, emoji }[]` allowlist
- `backend/features/workspace/*`, `backend/lib/authorize.ts`
- `GET/POST /api/v1/workspaces`, `GET /api/v1/workspaces/:id` + OpenAPI from Zod

**Creates (mobile):**
- Switcher, create sheet, active workspace (AsyncStorage), Workspace tab wired to API

**Depends on:** M02  
**Complexity:** M  

**Acceptance:**
- [x] First login creates user + default Home (`icon: "home"`)
- [x] Create second workspace with custom icon; switcher updates active context
- [x] All workspace routes enforce membership (404)

---

## M04 - Shopping lists CRUD

**Goal:** Create/rename/list active lists in a workspace; open list screen (empty items OK).

**Status:** done (2026-07-16)

**Creates:**
- Prisma: `ShoppingList`
- `backend/features/shopping-list/*` + `/api/v1/workspaces/:id/lists` CRUD
- `mobile/features/shopping-list/home-lists-screen.tsx`, `list-screen.tsx` (shell)
- Home tab wired to active lists + create CTA

**Depends on:** M03  
**Complexity:** S–M  

**Acceptance:**
- [x] CRUD active lists scoped to workspace
- [x] Cross-workspace list IDs return 404/403
- [x] Home shows lists for active workspace only

---

## M05 - Shopping items CRUD + activity log writes

**Goal:** Manual add/edit/status; closed category enum; append `ShoppingEvent` on mutations (no polling yet). Baseline list so AI has something to merge into.

**Status:** done (2026-07-16)

**Creates:**
- Prisma: `ShoppingItem`, `ShoppingEvent`
- Zod: category enum, item DTOs
- `backend/features/shopping-item/*`, `backend/lib/events/appendShoppingEvent.ts`
- Routes under `/api/v1/lists/:listId/items`
- `mobile/features/shopping-item/manual-add-sheet.tsx`, item row (normal density)
- Register item/event Zod schemas → regenerate OpenAPI
- `GET .../events?after=` ready for later polling

**Depends on:** M04  
**Complexity:** M  

**Acceptance:**
- [x] Add/edit item; statuses pending/bought/unavailable/removed
- [x] Category only from closed enum
- [x] Each mutation creates a `ShoppingEvent` row
- [x] Events endpoint returns cursor-friendly results

---

## M06 - AI feature (Import → Processing → Review → Apply)

**Goal:** Ship the **entire killer path as one feature**. Solo user can go: import → AI → ready list.

**Status:** done (2026-07-16)

**Flow:**

```
Import (Screenshot | Text | Clipboard)
  → Processing
  → AI Review
  → Apply
  → List updated
```

**AI Review actions (required):**
- **Accept all** - primary CTA when safe
- **Accept individual** - per proposed item / merge
- **Reject individual** - drop one proposal row without leaving Review
- **Edit** - rename, qty, unit, category, note
- Reject-all / cancel abandon without apply (list unchanged)

**Creates (backend):**
- Prisma: `AiIngestRun`
- `backend/features/ai/schemas.ts` (Zod structured outputs)
- `backend/features/ai/ingestText.ts`, `ingestScreenshot.ts`, `applyAiProposal.ts`
- Routes: `POST .../ai/ingest`, `POST .../ai/apply`
- `backend/lib/openai.ts`
- Ephemeral screenshot handling (no durable storage)
- Register ingest/apply Zod → regenerate OpenAPI

**Creates (mobile):**
- `mobile/features/ai/import-chooser-screen.tsx`
- `mobile/features/ai/import-text-screen.tsx`, `import-screenshot-screen.tsx`, `clipboard-offer.tsx`
- `mobile/features/ai/processing-screen.tsx`
- `mobile/features/ai/ai-review-screen.tsx` (bulk + per-item accept/reject)
- Stack wiring from list → import → processing → review → back to list

**Depends on:** M05  
**Complexity:** L (2–3 Cursor sessions OK; still one milestone)

**Acceptance:**
- [x] Screenshot, text, and clipboard entry points work
- [x] Clipboard offer when returning with text (Android priority)
- [x] Ingest returns structured proposal only (never free-text parse)
- [x] Categories from closed enum; no invented quantities/brands in schema rules
- [x] Review shows low confidence, merges, unknown items
- [x] Accept all, accept individual, reject individual, and edit all work
- [x] Apply writes only accepted rows + events + raw JSONB; abandon before apply leaves list unchanged
- [x] Screenshots not persisted after the request

---

## M07 - AI Credits metering

**Goal:** Server-enforced AI Credits; Free cap; balance visible in UI.

**Cost table (MVP):**

| Action | AI Credits |
|--------|------------|
| Text import | 1 |
| Clipboard import | 1 |
| Screenshot import | 2 |

**Creates:**
- `backend/lib/aiCredits.ts` (`debitAiCredits`, period bucket, cost map above)
- Wire debit into successful **apply** (not failed validation / abandoned review)
- `GET .../ai-credits`
- `mobile/features/billing/ai-credits-badge.tsx` on Workspace tab
- Env `AI_FREE_MONTHLY_CREDITS=30`

**Depends on:** M06  
**Complexity:** S–M  

**Acceptance:**
- [x] Screenshot apply debits **2**; text/clipboard apply debits **1**
- [x] Exhausted Free balance blocks ingest; list CRUD still works
- [x] Product copy says “AI Credits”

---

## M08 - Shopping Mode + Finish Shopping + Summary

**Goal:** In-store UX + trip ending. Hard to leave by accident; easy to add one more item without exiting.

**Creates:**
- `mobile/features/shopping-list/shopping-mode-screen.tsx`
- `mobile/features/shopping-list/finish-summary-screen.tsx`
- `mobile/features/shopping-list/shopping-mode-exit-guard.ts` (back gesture / hardware back)
- `mobile/design-system/shopping-density.ts`
- Expo keep-awake integration
- **Floating Add Button** → manual add sheet without leaving Shopping Mode
- Backend archive / finish helpers as needed
- Swipe / huge checkboxes; Finish → counts → Archive

**Shopping Mode UX rules:**
- **Disable accidental back gesture** (iOS swipe-back / Android back) - or intercept it
- **Confirm exit** before leaving Shopping Mode (unless Finish Shopping flow)
- **Floating Add Button** - mid-shop add without exiting mode

**Depends on:** M05; best after M06 so demo is Import → Review → Shopping Mode  
**Complexity:** M  

**Acceptance:**
- [x] Start shopping enters Shopping Mode (large targets, minimal chrome)
- [x] Accidental back does not silently exit; user gets confirm exit
- [x] Floating Add Button opens manual add and returns to Shopping Mode
- [x] Optional keep-screen-on (default off until settings; hardcode toggle OK)
- [x] Finish shows Bought / Unavailable / Removed counts
- [x] Archive from summary removes list from Home active set

---

## M08.5 - Data Sync Engine + Shopping Session

**Goal:** Network is transport. UI stays instant. Engine reusable beyond shopping.

**Creates:**
- `mobile/features/data-sync-engine/` (façade: Queue, Worker, Persistence, Connectivity, Conflict stub)
- `mobile/features/shopping-list/session/` (Session SM; UI never mutates SessionState)
- `mobile/features/offline/OfflineStatusBanner.tsx`

**Acceptance:**
- [x] DataSyncEngine façade; modules independently testable
- [x] Events informational; no business logic on event order
- [x] Persistence meets durability (AsyncStorage; MMKV/SQLite swappable)
- [x] Time-sortable op ids; compress rules; single worker; 1s debounce; restart-safe flush
- [x] Session SM; Resume Continue/Discard; OfflineStatusBanner; Finish anyway local hide

---

## M09 - Members and email invitations

**Goal:** Multi-user workspace - after the product wedge exists.

**Creates:**
- Prisma: `Invitation` (tokenHash, pending|accepted|revoked)
- `backend/features/workspace/inviteMember.ts`, `acceptInvitation.ts`, `listInvitations.ts`, `revokeInvitation.ts`, `removeMember.ts`
- Routes: invitations CRUD, accept, member remove/role
- Mobile: invite section, pending list, member menus, `invite/[token]` accept flow

**Depends on:** M03; useful after M08 for two-person shopping demos
**Complexity:** M

**Acceptance:**
- [x] Owner/admin can invite by email; member cannot
- [x] Invitee accepts and sees workspace
- [x] Unauthorized role actions return 403

---

## M09.5 - Notifications (MVP)

**Goal:** Minimal production-ready notification architecture for workspace collaboration - push + in-app center + prefs - without spam.

**Creates:**
- Prisma: `Notification`, `UserNotificationPreferences`, `PushDevice`, `ShoppingSession`
- `backend/lib/events/DomainEventBus.ts` (`Promise.allSettled`)
- `NotificationHandler` → pure `NotificationRepository` → `NotificationCreatedEvent` → `PushHandler`
- `ShoppingSessionService` (start/finish: publish → archive → close)
- Routes: notifications list/read, prefs, push-devices, list sessions
- `mobile/features/notifications/` - center, bell badge, prefs, push registration

**Depends on:** M09 (invites), M08 / M08.5 (shopping session)
**Complexity:** M

**Acceptance:**
- [x] Home bell opens Notification Center; mint unread badge; groups Dzisiaj…Starsze; pull-to-refresh
- [x] Four MVP events via domain bus; repository has no side-effects; push via NotificationCreatedEvent
- [x] Prefs persisted; new shopping list default OFF
- [x] Taps: invite → accept; started → shop; finished → finish summary; list created → list
- [x] Navigation idempotent (no duplicate screens / sessions)
- [x] No per-item / AI / credits notifications

---

## M10 - Smart polling (`EventPollingProvider`)

**Goal:** Live collaboration once invites exist; transport-agnostic.

**Status:** done (2026-07-18)

**Creates:**
- `mobile/lib/realtime/EventPollingProvider.ts` - adaptive poll (3→5→10s), `pollNow`, drain cap
- `useListRealtime` + soft toast (presentation only) on list / Shopping Mode
- Cursor `{ lastEventId, lastUpdatedAt: event.createdAt }` in AsyncStorage
- `scheduleItemsRefresh` - debounced invalidate; defer while local sync pending

**Depends on:** M05 (events API), M09 (second user); Shopping Mode lifecycle from M08  
**Complexity:** M  

**Acceptance:**
- [x] Two members: A mutates, B updates within ~3s (hot interval) without pull-to-refresh
- [x] Polling stops on background / leave list; resumes with `pollNow` on foreground / online
- [x] No websocket vendor in domain code
- [x] Events never applied as list source of truth (invalidate → GET items)

---

## M11 - History + search + Repeat List

**Goal:** Past lists, search, duplicate as a new pending list.

**Status:** done (2026-07-19)

**Creates:**
- History tab UI + local search (single fetch, client-side filter)
- `GET /api/v1/workspaces/{id}/lists/history` (preview items, Free depth 20 / Premium cap 200)
- `POST /api/v1/lists/{id}/restore`, `POST /api/v1/lists/{id}/repeat`
- Free history depth guard → `403 HISTORY_LIMIT_EXCEEDED` (minimal body)
- Repeat: same title; all business item fields; navigate to new list; Restore secondary
- Analytics stubs: `history_opened` / `_search` / `_repeat` / `_repeat_completed` / `_restore`

**Depends on:** M08 (archive path)  
**Complexity:** S–M  

**Acceptance:**
- [x] History shows archived/past; search by title (local)
- [x] Repeat List creates new list with items reset to pending
- [x] Restore works
- [x] Free depth limit enforced (`HISTORY_LIMIT_EXCEEDED`)

---

## M12 - Workspace settings + Profile

**Goal:** Profile, locale, and notification preferences that users need day to day.

**Status:** done (2026-07-18)

**Shipped:**
- Profile tab - account details, login methods, change password, delete account, sign out
- Language toggle PL/EN (client i18n)
- Notification preferences screen (silent mode + per-type toggles; API-backed)
- Premium / plan affordances on profile (upsell stubs where billing not yet live)

**Deferred (not blocking M12):**
- Workspace settings: realtime sound / haptic, default shopping layout, keep-screen-on toggle UI, AI merge prefs - fold into M10 (sound/haptic with polling) or M14 if still needed
- Keep-awake in Shopping Mode remains hardcoded on for the trip (setting UI later)

**Depends on:** M03; notification prefs overlap M09.5  
**Complexity:** S–M  

**Acceptance:**
- [x] Profile tab: account, language, notifications, sign out
- [x] Profile switches PL/EN
- [x] Notification prefs persist via API
- [x] No settings sprawl beyond what shipped (+ deferred list above)

---

## M12.5 - AI Evaluation Framework

**Goal:** Offline harness for AI proposal quality (`backend/evals/`) so History Suggest (and later Import) can be regression-tested with real model calls before Premium monetization.

**Status:** pending

**Creates:**
- `backend/evals/` - Scenario → Adapter → Evaluator → Judges → Report
- Suite `history-suggest` (~29 YAML scenarios, golden baselines, hard/soft/info judges)
- CLI: `pnpm eval:ai`, `pnpm eval:prune-reports`
- Dated reports with suite/scenario/prompt versions, `promptHash`, `resolvedModel`, seed, cost, flaky `--repeat`, compare-prompt

**Depends on:** M11 (History Suggest pipeline), M12  
**Blocks:** ideally harden prompts before M13 Premium gates  
**Complexity:** M

**Acceptance:**
- [x] `pnpm eval:ai --suite history-suggest` harness wired (needs `OPENAI_API_KEY` for model scenarios)
- [x] Thin adapter over prod `buildSuggestFromHistory` + enrich (no HTTP/credits/DB)
- [x] Hard FAIL → exit 1; soft = warnings; info = metrics only
- [x] Golden write guarded (hard PASS + `--force`/confirm)
- [x] Report includes repro command, corpus snapshot, cost aggregates

---

## M13 - Stripe Premium

**Goal:** Introduce Premium workspaces powered by Stripe and deliver the first Premium-exclusive AI capability: **AI Generate from History**.

```
Stripe (billing)
    ↓
Premium Entitlements (workspace subscription active)
    ↓
AI Generate from History (first Premium feature)
```

**Key split:**
- **Stripe** = payment provider only (Checkout, Customer Portal, webhooks). Not part of the AI feature logic.
- **Premium Entitlements** = product gate on the workspace (active subscription).
- **AI Generate from History** = first feature unlocked by that entitlement. It is **not** “part of Stripe.”

**Premium-only ≠ Unlimited AI Credits.**  
AI Generate from History requires an **active Premium workspace** *and* still goes through the existing **AI Credits** path (which Premium makes unlimited). Free workspaces cannot run it even if they somehow had credits.

**Creates:**
- `backend/features/billing/*` - Checkout + Customer Portal + webhook → set Premium entitlement
- `mobile/features/billing/premium-screen.tsx`
- Subscription status unlocks Premium entitlements (unlimited AI Credits + Generate from History)
- **AI Generate from History** - generate a shopping list from recent shopping history:
  - Backend loads up to **5** latest archived lists (`updatedAt` DESC); **no user list picker**
  - Same shared AI path: proposal (`AiIngestRun`) → **AI Review** → Apply (not a separate AI stack)
  - Server enforces Premium before start; Free / expired → `403 PREMIUM_REQUIRED`
- Analytics stubs: `history_ai_generate_started` / `_reviewed` / `_applied` / `_cancelled`
- Register billing (+ generate-from-history) Zod schemas → regenerate OpenAPI

**Depends on:** M07, M03, **M11** (archived history)  
**Complexity:** L  
**Estimate:** 2–3 sessions  

**Acceptance:**
- [ ] Owner/admin Checkout; webhook upgrades workspace entitlement
- [ ] Premium skips Free AI Credit cap (unlimited credits)
- [ ] Member cannot manage billing
- [ ] Webhook signature verified
- [ ] Active Premium → AI Generate from History works (auto ≤5 recent archived lists → Review → new list)
- [ ] No Premium → backend returns **`403 PREMIUM_REQUIRED`** (backend is source of truth)
- [ ] Expired / cancelled subscription also blocks with **`403 PREMIUM_REQUIRED`**
- [ ] Distinct from **Repeat List** (deterministic copy; available on Free within history depth)

---

## M13.4 - App Navigation & Side Menu

**Goal:** Application-level navigation (App Menu) separate from Bottom Tabs; Platform Console shell + `platformRole` access. Prerequisite for M13.5 observability UI.

**Creates:**
- Declarative full-screen App Menu (Home tab stack, native push; Bottom Tabs stay visible) - config → visibility predicate → route
- Home hamburger opens Menu (not Workspace tab; not a left drawer)
- `User.platformRole` enum (`USER` | `ADMIN`) + `/me` + `requirePlatformAdmin`
- Platform Admin bootstrap via `PLATFORM_ADMIN_EMAILS` (one-way promote on upsert; never auto-demote)
- About screen (Version, Environment, API, Build, Commit)
- Platform Console route shell - Overview (Platform Status + metrics) → Business → Realtime → Scaling → Backend
- `GET /api/v1/platform/overview` (ADMIN only)

**Depends on:** M03, M12  
**Complexity:** S–M  
**Blocks:** - (M13.5 fills Overview metrics)

**Platform Admin Bootstrap:** `platformRole` defaults to `USER`. During upsert, if email ∈ `PLATFORM_ADMIN_EMAILS` and role ≠ `ADMIN`, promote to `ADMIN`. Never auto-demote from env changes. Demotion = explicit ops action. Env is per-environment config (not a DB seed).

**Acceptance:**
- [x] Tabs = workflows; Menu = application-level destinations
- [x] Menu hierarchy: Account / Workspace (1 shortcut) / Application / Platform
- [x] Platform section + Console only for `platformRole = ADMIN` (client hide + backend 403)
- [x] Platform Console read-only shell with Overview-first IA
- [x] About build identity fields
- [x] `PLATFORM_ADMIN_EMAILS` one-way promote on upsert (documented)
- [x] Architecture §4 + roadmap updated

---

## M13.5 - Observability & Scaling Foundation

**Goal:** Measure polling/sync/shopping health via a swappable Metrics facade; fill Platform Console Overview; inform WebSocket migration without shipping WebSockets.

**Status:** done (2026-07-19)

**Creates:**
- `shared/metrics/` - metric names, tags, provisional capacity constant  
- `mobile/lib/metrics/` - Noop / Console (DEV) / Composite; wired into EventPollingProvider, scheduleItemsRefresh, syncTelemetry  
- `backend/lib/metrics/` - Noop + InMemory (+ Console if `METRICS_DEBUG=1`), `withHttpMetrics`, Prisma query timing  
- Events + shopping session instrumentation; Platform Overview aggregates sessions + RPS/P95/headroom  
- Architecture §10.5 (SLOs, capacity, cost, dashboards, alerts, WS checklist)

**Depends on:** M10, M08.5, M08, M13.4  
**Complexity:** M  

**Acceptance:**
- [x] Metrics facade with Noop default; syncTelemetry routes through it  
- [x] Realtime poll/latency/empty/events/refresh metrics emitted  
- [x] Backend HTTP + events endpoint timing + session counters  
- [x] Presence KPI = open sessions (+ poll-derived RPS)  
- [x] Docs: SLOs, capacity (provisional), Scaling/WS decision notes  
- [x] No behaviour change to polling/sync algorithms  

**Out / Future:** WebSocket, full Prometheus/OTel prod exporters, tracing, heartbeats, k6 load-test playbook, `estimated_monthly_ws_cost`.

---

## M13.6 - Platform Console Realtime

**Goal:** Operational Realtime diagnostics in Platform Console - polling / events / refresh / sync - using existing M13.5 server metrics where possible; honest placeholders for client-only KPIs until ingest exists.

**Status:** done (2026-07-19)

**Creates:**
- `GET /api/v1/platform/realtime` (ADMIN) - P50/P95, empty-page ratio, events RPS, failures, sessions-as-pollers proxy  
- InMemory snapshot helpers: `p50`, `mean`, `zeroRatio`  
- Mobile Realtime panel: Polling / Events / Refresh / Sync sub-tabs, KPI cards + sparklines + interval distribution placeholder + system status  
- Console chrome: only **Overview** + **Realtime** visible; Scaling / Backend / Business deferred until data is valuable  
- Docs: phased Console growth order

**Depends on:** M13.5, M10  
**Complexity:** M  

**Acceptance:**
- [x] Realtime tab answers: is polling healthy? are events flowing? latency / empty ratio / failures visible  
- [x] No heavy chart libraries; lightweight sparklines + distribution bar  
- [x] Null / placeholder for Hot–Warm–Cold, refresh, sync, drain, pollNow (client metrics not ingested yet)  
- [x] Read-only; no polling/sync behaviour changes  

**Out / Future:** **M13.7** Client Metrics Ingestion (deferred post-release) for true poller gauges + interval tiers; Scaling / Backend / Business tabs; full Sync success-rate instrumentation.

---

## M13.8 - Public landing + legal

**Goal:** Minimalna strona publiczna przed release - krótki opis produktu, realne store CTAs, wymagane strony prawne + delete-account info pod Google Play / App Store; canonical metadata pod share/SEO.

**Hosting (locked):** Next.js `backend/` - route group `app/(marketing)/…`, ten sam deploy Vercel co API. Apex `https://getkangur.com`. **Bez** osobnego `landing/` ani `web/`.

**Creates/updates:**
- `backend/app/(marketing)/` - `/`, `/privacy`, `/terms`, `/contact`, `/delete-account`
- `/support` → redirect / alias to `/contact`
- Store buttons on `/`: Google Play (real URL via env/constant), App Store Coming Soon (disabled)
- Canonical metadata + favicon + OG image
- `robots.txt` + `sitemap.xml`
- `/site.webmanifest` with icons (**not** a full PWA)
- Public `not-found` with Kangur asset

**Routes:**

| Path | Behavior |
|------|----------|
| `/` | Short product blurb; store buttons (below) - no elaborate marketing landing |
| `/privacy` | Privacy policy |
| `/terms` | Terms of use |
| `/contact` | Contact |
| `/support` | Redirect / alias → `/contact` |
| `/delete-account` | How to delete account, what is deleted, support link (`/contact`) - instructions only, not self-service |

**Store buttons on `/` (not placeholders):**
- **Google Play** - active button with real URL (env / constant; swappable at launch without layout rebuild)
- **App Store** - visible **Coming Soon**, disabled (same layout, ready for a future URL)

**Depends on:** M13 (product ready to describe) - soft parallel OK if legal copy is ready  
**Blocks:** M14 RC / store submit (Play needs privacy URL + clear delete-account path)  
**Complexity:** S–M  
**Status:** done

**Acceptance:**
- [x] `/` on apex `getkangur.com` (prod) / Preview URL on PR - code ready; set `NEXT_PUBLIC_SITE_URL` on Vercel Production
- [x] `/privacy`, `/terms`, `/contact`, `/delete-account` available
- [x] `/support` → `/contact`
- [x] Google Play CTA = real link; App Store CTA = Coming Soon (disabled)
- [x] Canonical metadata + favicon + OG image configured
- [x] `robots.txt` + `sitemap.xml`
- [x] `/site.webmanifest` with icons (no PWA)
- [x] Public `not-found` with Kangur asset
- [x] Apex does not expose API (`/api/v1` only on `api.*`) - deploy topology in `docs/deploy.md`
- [x] PL copy minimum (EN nice-to-have in the same milestone if cheap)
- [x] privacy / terms / delete-account URLs ready for Google Play / Clerk / Stripe
- [x] All Google Play, Clerk, and Stripe links point at apex (`https://getkangur.com`), never `api.*` - documented; wire in dashboards at RC
- [x] Public inboxes: `contact@getkangur.com`, `support@getkangur.com` (`NEXT_PUBLIC_*_EMAIL`)

**Out of scope:** elaborate sales landing, blog, pricing tables, staging landing domain, separate web app, full self-service account deletion, PWA installability. Technical public endpoints (`/health`, `/metrics`, etc.) are **not** on apex - they stay on `api.*` only.

---

## M13.9 - Brand Boot Animation

**Goal:** Calm, premium cold-start experience (~850–1500 ms): white screen → one Splash Mascot lands → soft bounce → app content fades in under the mascot. Covers auth/home loading - **never invents waiting** beyond the min aesthetic window. Not a Premium/billing feature.

**Creates/updates:**
- `mobile/features/startup/AppStartupController.tsx` (+ hook/context) - cold-start-only orchestration; future home for onboarding / maintenance / force-update gates
- `mobile/components/BrandedBootSplash.tsx` - Reanimated mascot (lift, cubic-out enter, spring bounce, decorative shadow)
- Native Expo splash → white `#FFFFFF` handoff ([mobile/app.json](../mobile/app.json))
- Single splash mascot asset (fixed visual size ~42–48% width with min/max clamp); Premium / error / empty keep their own mascots elsewhere
- Home/auth reveal: **opacity only** (no BlurView, no translateY on content)
- After hard cap: existing **HomeSkeleton** (final page layout) → real content - never blank white, never full-screen layout swap after splash

**Design locks:**
- Cold start / process kill only - never on in-app navigation (Home ↔ Settings)
- Min **850 ms**, max **1500 ms**
- Splash ignores SafeArea - mascot optically centered on the physical screen
- Shadow is decorative only - never affects layout; animated independently
- Boot animation must never delay navigation that is already ready - purpose is to **cover loading**, not create waiting

**Depends on:** App shell (M02+); soft parallel with M13.8  
**Blocks:** M14 RC polish (boot = this milestone)  
**Complexity:** S  

**Acceptance:**
- [x] Cold start signed-in / signed-out shows branded boot then content
- [x] Warm navigation does not re-show splash
- [x] Timing within 850–1500 ms; fast boot still respects min window; slow boot hits cap then skeleton
- [x] One consistent Splash Mascot; sensible size on phone and tablet
- [x] No BlurView / expo-blur in this flow
- [x] Skeleton uses final Home chrome - no layout jump after splash

**Out of scope:** asset rotation, bag-only animation, Lottie/Rive, splash copy/tagline, dark mode

---

## M14 - Polish + release candidate

**Goal:** Design-system consistency, motion, mascot empty states, a11y, EAS smoke build. **Light mode only** - no dark theme. **Brand boot animation = M13.9** (do not re-scope splash here).

**Creates/updates:**
- Token / visual polish pass (light)
- 2–3 motions (enter, status, toast) - excluding boot splash
- Empty states (kangaroo / warm orange)
- Category labels PL/EN complete
- `mobile/eas.json` (already present - verify preview/prod profiles)
- Final sweep against PRD MVP acceptance
- Optional: remaining deferred settings from M12 (keep-screen-on UI, shopping layout)

**Depends on:** M06–M13 substantially complete; **M13.8** (privacy + delete-account URLs before RC / store); **M13.9** (brand boot)  
**Complexity:** M  

**Acceptance:**
- [ ] PL/EN parity on user-facing strings
- [ ] Shopping Mode one-handed verified
- [ ] PRD MVP checklist mostly green
- [ ] Dev/preview EAS build succeeds
- [ ] No dark-mode theme or dual-scheme polish required
- [ ] M13.8 live (privacy + delete-account URLs usable in Play / Clerk / Stripe)
- [x] M13.9 brand boot accepted on cold start

---

## M15 - Custom category packs (post-MVP)

**Goal:** Allow configuring category sets beyond grocery defaults so Kangur works for other list types - e.g. hardware / building store, plumbing, fishing tackle, or any custom pack. Same shopping-list UX (aisles as categories), different taxonomy.

**Creates/updates:**
- Category pack model (workspace- or list-scoped presets: grocery default + user-defined)
- CRUD UI to name packs and define categories (label, order, optional icon/color)
- List creation / settings: pick which pack applies
- AI ingest / categorization uses the active pack instead of hard-coded grocery categories
- Shopping Mode progress / badges respect custom categories
- PL/EN for pack UI; pack category labels as user content

**Depends on:** M14 (MVP complete); builds on M04–M06 category plumbing  
**Complexity:** L  
**Status:** post-MVP

**Acceptance:**
- [ ] User can create a custom pack (e.g. “Sklep budowlany”) with ordered categories
- [ ] List can use grocery default or a custom pack
- [ ] Items and AI assign categories from the active pack only
- [ ] Shopping Mode and filters work with custom categories
- [ ] Existing grocery lists unchanged when packs ship

---

## Phase 2 - Platform Evolution (Post-Release)

Milestones below are **intentionally deferred** until after the first production release. Pre-release priority is user-facing product and monetization (Stripe, billing, entitlements, RC, Play Store). Platform Console remains operational for MVP on server/proxy metrics.

---

## M13.7 - Client Metrics Ingestion

**Status:** Deferred until post-release (Planned - Phase 2 / Platform Evolution)

> M13.7 is intentionally deferred until after the first production release.  
> Platform Console is operational for MVP using existing proxy/server metrics.  
> Client metrics ingestion improves observability only and does not affect end-user functionality.

**Goal:** Ożywić placeholdery Realtime - klient już emituje metryki (`EventPollingProvider`, `scheduleItemsRefresh`, `syncTelemetry`), ale w prod trafiają do **Noop**. M13.7 dodaje ścieżkę buffer → batch POST → agregacja in-process → `GET /platform/realtime`.

**Bez zmian** w istniejących call sites `Metrics.*` - tylko nowy sink + wiring + API + mapowanie w `getRealtime`.

```mermaid
flowchart LR
  emit[Emit sites] --> facade[getMetrics Composite]
  facade --> buffer[BufferMetrics]
  facade --> noop[Noop]
  facade -.->|DEV only| console[Console]
  buffer -->|"POST co 20s"| ingest["/api/v1/platform/client-metrics"]
  ingest --> agg[ClientMetricsAggregator]
  agg --> memory[InMemory counters/hist]
  agg --> gauges[GaugeTTL store]
  memory --> realtime[getPlatformRealtime]
  gauges --> realtime
  realtime --> consoleUI[Platform Console Realtime]
```

### Decyzje (ustalone)

| Temat | Decyzja |
|--------|---------|
| Kto POSTuje | Każdy zalogowany klient (`requireUser`), nie tylko ADMIN |
| Kiedy włączone | Prod + DEV - Buffer zawsze w Composite; Console nadal tylko DEV |
| Interval | **20 s** (w oknie 15–30 s), + flush przy `AppState` → `background` |
| Identyfikacja | Anonimowy `clientInstanceId` (UUID w AsyncStorage) - do sumowania gauge’y |
| Tagi | Nadal ignorowane w store (jak dziś); tiers już mają osobne nazwy metryk |
| Bezpieczeństwo | Allowlista nazw `realtime.*` / `sync.*` z `shared/metrics/names.ts`; limity rozmiaru body; fire-and-forget (błąd sieci nie wpływa na app) |
| Proxy vs client | Gdy są dane klienta dla danej KPI - **preferuj klienta**; inaczej zostaw obecny proxy serwerowy |

**Nadal null po M13.7** (brak emitów dziś): `timeoutsPerSec`, `lastError*`, `avgDelayMs`, `sync.successRate` - bez sztucznego wypełniania; ewentualna instrumentacja w osobnym follow-upie.

### Creates

**Shared - kontrakt batcha** (`shared/metrics/client-batch.ts` lub Zod + shared type):

- `clientInstanceId: string` (uuid)
- `sentAt: number` (epoch ms)
- `counters: Record<string, number>` - **delty** od ostatniego udanego flusha
- `gauges: Record<string, number>` - ostatnia znana wartość
- `histograms: Record<string, number[]>` - próbki od ostatniego flusha (cap per name, np. 40)
- Helper `isIngestibleMetricName(name)` - allowlista z `MetricNames` (tylko realtime + sync)

**Mobile - Buffer + flush** (`mobile/lib/metrics/`):

- `buffer.ts` - implementacja `Metrics`; `drain(): ClientMetricsBatch | null`
- `flusher.ts` - timer 20 s + `AppState`; `apiFetch POST /api/v1/platform/client-metrics`; clear delty dopiero po 2xx
- `client-id.ts` - `getOrCreateClientInstanceId()` via AsyncStorage
- Composite: `[buffer, Noop]` (+ Console w DEV); `startMetricsFlusher` / `stopMetricsFlusher` przy login/logout
- Emit sites **bez zmian**; lokalny cap ~200 pending hist samples

**Backend - ingest + GaugeTTL:**

- `POST /api/v1/platform/client-metrics` - `requireUser`, Zod limits, OpenAPI, **204**
- `applyClientMetricsBatch`: counters/hist → InMemory; gauges multi-client (`realtime.active_pollers`, `sync.queue_length`, `sync.failed_ops`) → GaugeTTL map (TTL **90 s**) + `sumGauge(name)`

**Realtime API mapping** (`getRealtime.ts`) - prefer client when present:

| KPI | Źródło po M13.7 |
|-----|-----------------|
| `activePollers` | `sumGauge(realtime.active_pollers)` jeśli klienci w TTL, else proxy sessions |
| `pollRequestsPerSec` | `rps(realtime.poll.requests)` jeśli >0, else events/http proxy |
| `p50/p95` | `realtime.poll.latency_ms` jeśli hist, else events/http duration |
| `emptyPollRatio` | `empty / (empty+with_events)` z counters, else `zeroRatio(page_size)` |
| `failuresPerSec` | `rps(realtime.poll.failures)` jeśli ticks, else `http.errors` |
| `intervalDistribution` | shares z counters hot/warm/cold → `available: true` gdy suma > 0 |
| `events.*` drain/seeding/pollNow | counters klienta |
| `eventsPerSec` / perResponse | prefer `realtime.events.delivered` rps + mean `per_response` |
| `refresh.*` (bez avgDelay) | counters klienta |
| `sync` queue/retries/failed | sumGauge / counters |

**Depends on:** M13.5, M13.6, first production release  
**Complexity:** M  

**Acceptance:**
- [ ] Authenticated clients batch-POST realtime/sync metrics; allowlist enforced
- [ ] Realtime Console fills Hot/Warm/Cold, refresh, sync, drain, pollNow from ingested data
- [ ] Multi-client `active_pollers` summed via GaugeTTL (not last-write-wins)
- [ ] Emit sites unchanged; fire-and-forget (network failure does not affect app)
- [ ] Server proxies remain fallback when no client data yet

**Out / Future:** Prometheus/OTel exporters; per-workspace slice; infrastructure rate limiter; refresh delay / sync successRate / timeout/lastError instrumentation; persistence beyond process memory.

---

## Post-MVP - Future directions (not scheduled)

Documentation only - not implementation todos for M09.5.

Activity Feed · Audit Log · Notification Archive UI · Notification Delete · Mute Workspace · Mute User · Notification Search · Rich Push · Scheduled Notifications

Architecture hooks already present after M09.5: `NotificationCreatedEvent` fan-out, `archivedAt`, `actorUserId`, `sourceId`, `PushDevice.lastSeenAt` / `appVersion`, `ShoppingSession.clientInstanceId` / `clientPlatform`.

---

## Suggested Cursor session sizing

| Milestone | Typical sessions |
|-----------|------------------|
| M01–M05 | 1–2 each |
| M06 AI (full path) | 2–3 (one feature, multiple sessions OK) |
| M07–M12 | 1 each |
| M13 | 2–3 |
| M13.8 | 1 |
| M13.9 | 1 |
| M14 | 1–2 |
| M15 | 2–3 (post-MVP) |
| M13.7 | 2–3 (post-release; Platform Evolution) |

---

## Explicitly out of this roadmap

Voice, AI cleanup on Repeat, websocket vendors, UploadThing, Redux/MobX, `packages/` monorepo, web/admin apps, additional docs beyond the four listed above.

(**AI Generate from History** is in **M13**, not out of roadmap.)

---

## Post-roadmap - Data export (GDPR)

**Not scheduled in the MVP roadmap.** Follow-up after M15 / first production release.

**Goal:** Let users download their Kangur data from Privacy (UI row “Pobierz swoje dane”).

**Creates (when scheduled):**
- `POST /api/v1/me/data-export` - assemble user / workspaces / lists / items / prefs JSON; email via Resend (attachment or link); rate limit (e.g. 1 / 24h)
- Privacy screen export row + confirm copy
- i18n `privacy.export.*`

**Depends on:** Privacy screen (sessions + delete), Resend already used for invites  
**Out of scope until then:** S3 signed URLs, async job queue, in-app file download without email

---

## How to use this document

1. Before each milestone: re-read this file + relevant PRD/architecture sections.
2. Implement **one milestone at a time**, starting with **M01**.
3. After a milestone ships: tick acceptance criteria and set its status to `done` in the table above.
4. Detailed implementation plans for a single milestone (e.g. M01) may live in chat/Cursor plans - this file remains the source of truth for order and scope.
