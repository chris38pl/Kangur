# Kangur — Architecture

**Companion to:** [prd.md](./prd.md) · [cursor-rules.md](./cursor-rules.md) · [roadmap.md](./roadmap.md)  
**Status:** Greenfield MVP architecture  
**Last updated:** 2026-07-16

---

## 1. Overview

Kangur is **mobile-first**, but the backend is a **platform**, not “an API for one app.”

```
Kangur Platform (Next.js REST + OpenAPI)
        │
        ├── Expo mobile (MVP client)
        ├── Web app          (future)
        ├── Admin            (future)
        └── Landing hooks    (future)
```

| Layer | Choice |
|-------|--------|
| Mobile | React Native, Expo, Expo Router, TypeScript, NativeWind |
| Platform API | Next.js App Router — versioned REST `/api/v1/...` + **OpenAPI generated from Zod** (never hand-edited) |
| Forms / validation | React Hook Form, Zod |
| Client data | **TanStack Query** + React local state; optional light Zustand |
| Client data — forbidden | **No Redux, MobX, Saga, Context-everywhere** |
| DB | **Neon** (serverless Postgres) + Prisma — **no Prisma Accelerate** for MVP |
| Auth | Clerk (email/password, Google, Apple) |
| Payments | Stripe (subscription on Workspace) |
| AI | OpenAI via AI SDK — vision + structured outputs + Zod |
| Sync (MVP) | Smart polling behind `RealtimeProvider` |
| Sync (later) | Ably / Supabase Realtime / SSE — undecided; cost-driven |
| Storage | No permanent screenshots; no UploadThing unless justified later |

**Docs only:** `prd.md`, `architecture.md`, `cursor-rules.md`, `roadmap.md`.

---

## 2. Platform vs client

- Backend exposes a **stable REST API** with Zod-validated contracts.
- **OpenAPI is generated from Zod only** (registry + generate script). Never hand-edit the OpenAPI file; fix Zod if it drifts.
- OpenAPI exists so Cursor/Claude/Copilot and codegen can produce typed clients — not for vanity Swagger UI.
- Expo is the first consumer; web/admin must be able to use the same `/api/v1` without rewriting domain logic.
- Prefer Route Handlers for mobile-facing operations.
- No Expo imports in `backend/`.

---

## 3. Repository structure (no packages monorepo)

```
kangur/
├── mobile/                 # Expo app
├── backend/                # Next.js platform API
├── shared/                 # Domain SSOT (locales, categories, themes)
└── docs/
    ├── prd.md
    ├── architecture.md
    ├── cursor-rules.md
    └── roadmap.md
```

Alternative: `apps/mobile` + `apps/backend` — still **without** `packages/`.

Duplicate Zod lightly if needed; extract shared package later when drift hurts.

### 3.1 Mobile — feature-first

```
mobile/
├── app/                    # Expo Router (tabs + stacks only)
├── features/
│   ├── auth/
│   ├── workspace/
│   ├── shopping-list/      # includes Shopping Mode, Finish summary
│   ├── shopping-item/
│   ├── billing/
│   ├── ai/                 # Import, Processing, AI Review
│   ├── profile/
│   └── settings/
├── components/             # Shared primitives only
├── design-system/          # tokens, theme, mascot usage rules
├── lib/                    # api client (from OpenAPI), query, i18n, RealtimeProvider
└── ...
```

**Prefer `features/*`** over horizontal `hooks/utils/services/repositories` dumps.

### 3.2 Backend — feature-first

```
backend/
├── app/api/v1/             # Route handlers
├── openapi/                # Spec or generation pipeline
├── features/
│   ├── auth/
│   ├── workspace/
│   ├── shopping-list/
│   ├── shopping-item/
│   ├── billing/
│   ├── ai/
│   └── ...
├── lib/                    # prisma, clerk, stripe, openai, aiCredits, authorize
├── prisma/
└── ...
```

---

## 4. Navigation architecture

### Bottom tabs

Primary daily workflows (one-handed shopping loop):

1. **Home** — active lists, create, import CTA  
2. **History** — archived lists (read-only), local search, **Repeat** (primary) / Restore (secondary)
3. **Workspace** — avatar, members, invites, plan, **AI Credits**, settings  
4. **Profile** — account hub, language, sign out  

### App Menu (full-screen)

Application-level destinations opened from the Home hamburger as a **full-width screen** nested in the Home tab stack (`/(tabs)/index/menu`) with the **native push / slide** transition — Bottom Tabs stay visible. Not a left drawer, Modal overlay, or Drawer navigator.

**Why full-screen (not a drawer):** better scalability for growing Platform/ops content; more layout space and a cleaner list; richer future destinations feel like real screens; navigation matches iOS/Android stack patterns used elsewhere (Account, Notifications).

Driven by **declarative menu config → visibility predicate → route**.

| Section | Contents |
|---------|----------|
| **Account** | Account details, Subscription, Notifications |
| **Workspace** | Single shortcut to Workspace tab |
| **Application** | Help, Feedback, Privacy, Terms, About |
| **Platform** | Platform Console — only when `platformRole = ADMIN` |

Tabs stay focused on workflows; the Menu scales for secondary / ops destinations without adding tabs. Do not duplicate tab destinations as menu rows (except the single Workspace shortcut).

### Platform Console

Read-only operational dashboard (`/platform-console`) for product owners / operators — **not** an admin panel (no mutations, flags UI, or user management in M13.4).

**Phased tabs (ship when data is valuable — do not build empty shells):**

1. **Overview** (M13.5) — Platform Health + key KPIs  
2. **Realtime** (M13.6) — polling / events / refresh / sync diagnostics (server/proxy metrics for MVP; client ingest = M13.7 post-release)  
3. **Scaling** — after load tests + capacity planning  
4. **Backend** — after richer monitoring (e.g. OTel)  
5. **Business** — after product analytics (DAU/MAU, premium, AI credits, …)

UI currently exposes **Overview** and **Realtime** only. Full IA order for later: Overview → Business → Realtime → Scaling → Backend.

### Stacks

- Shopping List → **Shopping Mode**  
- AI Import chooser → Screenshot | Text | Clipboard → Processing → **AI Review**  
- Finish Shopping → Summary → Archive  
- Invite Members · Workspace Settings · Premium · Manual Add · List Settings · **Menu** (Home stack) · About · Platform Console  

Screens live in `features/`; `app/` only wires routes.

---

## 5. Design system & branding

### 5.1 Principles

Flat, minimal, premium, friendly; one-handed; large targets; few taps; fast over fancy.

### 5.2 Tokens

- **Spacing:** 8px base — `4, 8, 12, 16, 24, 32, 40, 48`  
- **Radius:** fixed scale (e.g. sm/md/lg/xl) — no random radii  
- **Typography:** `display | title | headline | body | label | caption`  
- **Colors:** semantic tokens (`bg`, `surface`, `text`, `primary`, …); **warm orange** primary  
- **Theme:** light mode only (no dark theme)  
- **Icons:** one library only  
- **Motion:** 2–3 intentional (enter, status change, toast)  

### 5.3 Shopping Mode tokens

Larger type/spacing scale variant (e.g. density = `shopping`) — huge hit targets, reduced chrome.

### 5.4 Mascot

| Element | Direction |
|---------|-----------|
| Character | Flat kangaroo — friendly, minimal |
| Primary | Warm orange |
| Motifs | Pocket, shopping bag |
| Usage | Empty states, Premium, onboarding — sparingly, not every list row |

### 5.5 Accessibility

Contrast; hit slops; status not by color alone; labels on icon-only actions.

---

## 6. Architecture principles

1. Workspace tenancy — billing + **AI Credits** on workspace.  
2. Current state + activity log — **not** event sourcing.  
3. Structured AI only; closed category enum.  
4. Sync transport-agnostic (`RealtimeProvider`).  
5. Platform API + OpenAPI first.  
6. Feature-first modules.  
7. Boring state: Query + local state (+ light Zustand). **Never** Redux/MobX/Saga/Context soup.  
8. No packages monorepo until pain is real.  

---

## 7. State management

| Use | Tool |
|-----|------|
| Server/async state | TanStack Query |
| Ephemeral UI | React `useState` / component state |
| Cross-screen UI chrome (rare) | Light Zustand **only if needed** |
| Forms | React Hook Form + Zod |
| Auth | Clerk |
| Sync → cache | `RealtimeProvider` invalidates/patches Query |

**Do not add:** Redux, MobX, Redux-Saga, global React Context for server state.

Optimistic updates OK for status toggles. AI ingest is not optimistic — Processing → Review → apply.

Cache keys include: `workspace`, `lists`, `list`, `items`, `aiCredits`, `subscription`.

---

## 8. AI flow

```
Import (screenshot | text | clipboard)
  → POST /api/v1/lists/:id/ai/ingest
  → AuthZ + AI Credits check
  → Structured OpenAI output (Zod)
  → Return proposal (items, merges, confidence, ambiguities)
  → AI Review (client)
  → POST apply / confirm   (or apply in one step after Review accept)
  → Debit AI Credits + ShoppingEvents + persist raw JSONB
  → Shopping Mode
```

Prefer **proposal then explicit apply** after Review so Reject/Edit never leave half-applied junk. High-confidence-only shortcuts may auto-skip to compact Review — product rule in PRD open decisions.

### 8.1 AI principles

- Schema-driven; never parse free text  
- Never invent quantities or brands  
- Prefer merge over duplicate; flag ambiguity; return confidence  
- Categories from closed enum only  
- UI translates keys  

### 8.2 AI Credits

Product name: **AI Credits** (not “Credits”).

| Action | AI Credits |
|--------|------------|
| Text / clipboard import | 1 |
| Screenshot import | 2 |
| Suggestions (post-MVP) | 3 |

Track `aiCreditsUsed` per workspace billing period. Prefer not charging when nothing is applied.

### 8.3 AI Review (client responsibilities)

Render groups: low confidence, merge proposals, unknown/ambiguous, ready items.  
Actions: accept all, edit, reject, confirm/undo merge.  
Only then call apply endpoint (or equivalent transaction).

---

## 9. Shopping Mode & Finish (client)

- Entering “shop” sets UI density + optional `keepAwake`.  
- Finish Shopping computes counts from item statuses → Summary → Archive API.  
- Sync polling remains active in Shopping Mode under the same visibility rules.

---

## 10. Synchronization (EventPollingProvider)

- Transport-agnostic. MVP transport: **`EventPollingProvider`** (adaptive polling).  
- **Public API:** `start` / `stop` / `pollNow` / `isRunning` / `getCurrentListId` (+ optional `destroy`).  
- **Lifecycle:** mount→start; unmount→stop; background→pause; foreground→pollNow+resume; offline→pause; online→pollNow+resume; listId change→stop old+start new.  
- **Adaptive intervals:** 3s → 5s (30s idle) → 10s (2min idle); backoff only on successful empty polls; reset to 3s on events.  
- Fetch `ShoppingEvent`s after last known event id; **events are a refresh signal only** — never rebuild list state from payloads. Cache ownership: **SyncCacheAdapter + React Query**. Soft toast is presentation-only (never triggers refresh).  
- Future: `WebSocketTransport` without changing `useListRealtime()`; server push for **active list only**; ETag / 304 on events.

---

## 10.5 Observability & Scaling (M13.5)

### Principles

1. Fire-and-forget — metrics never block requests or change business logic.  
2. Provider pattern: `Metrics` interface + **Noop** (prod/tests default) + **Console** (DEV / `METRICS_DEBUG=1` only) + **InMemory** (backend process local for Platform Console).  
3. Shared catalogue: `@shared/metrics/names` + low-cardinality tags (`@shared/metrics/tags`).  
4. Prefer **server-authoritative** counters for sessions/AI; client emits realtime/sync health.

### Layout

| Area | Path |
|------|------|
| Names / capacity constant | `shared/metrics/` |
| Mobile facade | `mobile/lib/metrics/` |
| Backend facade + HTTP wrap + memory | `backend/lib/metrics/` |
| Client emit | `EventPollingProvider`, `scheduleItemsRefresh`, `syncTelemetry` |
| Server emit | events route, shopping sessions (`db.query_ms` reserved — Prisma middleware deferred; events path timed separately) |

### Presence (no heartbeat)

Primary KPI = open `ShoppingSession` rows (`finishedAt: null`). Secondary = events QPS / `realtime.active_pollers`. No dedicated heartbeat in M13.5.

### SLOs (MVP)

| Area | Target |
|------|--------|
| Events API P95 | < 250 ms (soft alert 500 ms) |
| Events availability | > 99% non-5xx (24h) |
| Client poll failures | < 0.5% of attempts |

### Capacity / headroom

```
estimated_RPS ≈ active_sessions × (1 / avg_interval_s)
headroom = PROVISIONAL_EVENTS_CAPACITY_RPS / estimated_RPS
```

`PROVISIONAL_EVENTS_CAPACITY_RPS = 2500` with `capacity_source=provisional` until the **Future load-testing playbook** (k6) refreshes the constant from measured SLO breach points — capacity MUST come from load tests, not permanent guesses.

### Cost

Leading indicator: `cost.events.*` and documented `estimated_monthly_polling_cost` formula in ops notes. Future: `estimated_monthly_ws_cost` for ROI crossover.

### Platform Console

- **Overview** — DB sessions + in-memory metrics (RPS, P95, headroom, pollingOk).  
- **Realtime** (`GET /api/v1/platform/realtime`) — events-API proxies (poll RPS, P50/P95, empty-page ratio, failures) + open sessions as active-poller proxy. Client-only KPIs (Hot/Warm/Cold, refresh, sync, drain/pollNow) stay null until **M13.7** client metrics ingest (post-release).  
- Later tabs (Scaling / Backend / Business) wait for load tests, OTel, and product analytics respectively.

### When to leave polling

Several signals over 2+ weeks: empty-poll waste + high RPS, headroom < 5×, latency floor / SLO burn, polling cost vs future WS cost, battery/pollNow storms. Order of levers: verify adaptive Hot/Warm/Cold → ETag/304 → WebSocket active-list-only.

### Future — Client Metrics Ingestion (M13.7, post-release)

MVP Platform Console is intentionally operable on **server/proxy metrics only**. Client emit sites already exist (`EventPollingProvider`, `scheduleItemsRefresh`, `syncTelemetry`); prod sink remains **Noop** until M13.7.

Target pipeline (do not implement before first production release):

```
Mobile Metrics.record → BufferMetrics → batch every ~20s
  → POST /api/v1/platform/client-metrics (requireUser, allowlist realtime.* / sync.*)
  → ClientMetricsAggregator (InMemory counters/hist + GaugeTTL for multi-client gauges)
  → GET /platform/realtime prefers client KPIs when present, else server proxies
  → Platform Console Realtime
```

Design locks (preserved for when M13.7 ships): anonymous `clientInstanceId`; counter deltas + gauge last-value + capped hist samples; GaugeTTL (~90s) for `active_pollers` / sync queue / failed ops; fire-and-forget flush; prefer client over proxy when data exists. Still out of ingest scope: OTel exporters, per-workspace slices, refresh-delay / sync successRate / lastError instrumentation, durable metric storage.

Also future: OTel/Prometheus exporters (same call sites), tracing, ETag `304_ratio`, WS metrics, load-test playbook, `estimated_monthly_ws_cost`.

---

## 11. Database design

### Entities

`User`, `Workspace`, `WorkspaceMember`, `Invitation`, `WorkspaceSettings`, `Subscription`, `AIUsage`, `ShoppingList`, `ShoppingItem`, `ShoppingEvent`, `AiIngestRun`

### Notable fields

**Workspace:** `name`, **`avatar`** (emoji/short code string), timestamps  

**WorkspaceSettings:** language, notifications, realtimeSound, realtimeVibration, defaultShoppingMode, keepScreenOnInShoppingMode, aiPreferences  

**AIUsage:** `aiCreditsUsed` per period (not mere request count)  

**ShoppingItem.category:** closed enum  

**ShoppingEvent:** activity log for sync cursor + toasts + audit — **not** for rebuilding state  

### Repeat List & History (M11)

- **History** lists archived lists only (`GET …/lists/history`) that have at least one non-removed item. Search is **client-side** after one fetch. Cards show 2–3 preview item names in list order (`sortOrder`, `createdAt`).
- **Soft-remove outcomes:** Finish Shopping → `status: archived` (History). User “Delete list” → `status: deleted` (hidden from Home and History). Both are soft deletes.
- **Free depth:** last **20** archived lists (`updatedAt` desc). Premium: no product limit (safety cap 200). Restore/repeat outside Free depth → **`403`** with code **`HISTORY_LIMIT_EXCEEDED`** (minimal body — no `totalArchived` counts until paywall).
- **Restore:** `archived` → `active` (`POST …/restore`).
- **Repeat:** new active list with **identical title**; copy **all business-relevant item fields** (today: name, category, amount, note, sortOrder, normalizedName, …). Do **not** copy runtime shopping state (`status` always `pending`; future bought/session timestamps). Navigate to the new list after success.
- Archived lists are **not editable** — only Repeat / Restore. `authorizeList` accepts `allowArchived` for those paths.
- Post-MVP: optional AI cleanup endpoint costing AI Credits.

### Activity log vs event sourcing

Update rows as source of truth; append events; **never** replay events to rebuild aggregates.

---

## 12. Security, auth, authz

- Secrets only on backend  
- Clerk JWT on protected routes  
- `authorize(workspaceId, userId, capability)` everywhere  
- Stripe webhook verification  
- AI Credits checked server-side  
- Image size/MIME limits  

Roles: workspace `owner` / `admin` / `member` — invites & billing: owner + admin.

Platform: `User.platformRole` (`USER` | `ADMIN`). Platform Console and `/api/v1/platform/*` require `ADMIN` via `requirePlatformAdmin` — hiding menu items is not authorization.

### Platform Admin Bootstrap

`platformRole` defaults to `USER`. This is **environment configuration**, not app seed data.

On user upsert the backend checks `PLATFORM_ADMIN_EMAILS` (comma-separated, normalized via `isPlatformAdminEmail`). If the authenticated email is on the allowlist and the current role is not already `ADMIN`, the user is **promoted** to `ADMIN`.

The backend **never** automatically demotes `ADMIN` → `USER` when an email is removed from the env list (typo / Preview misconfig must not lock operators out). Demotion is an explicit administrative operation (future: e.g. `pnpm platform:sync-admins`).

Purpose: bootstrap Platform Console access on new environments without manual SQL or database seeds.

---

## 13. Deployment & database (Neon)

| Piece | Target |
|-------|--------|
| Backend | **Vercel** |
| Database | **Neon** (serverless Postgres) |
| Mobile | EAS Build / Submit |
| Vendors | Clerk, Stripe, OpenAI |

### Why Neon

- Known stack from prior projects (Esteo): Prisma migrations, pooling, envs, Vercel integration — near-zero learning cost.
- Fits **Vercel → Next.js → Prisma → Neon** serverless path.
- **Branching:** Production / Preview / Local DB branches for safer schema work.
- MVP cost: effectively free for a long time at household scale.

### Prisma Accelerate

**Do not use for MVP.** Direct Neon connection (+ pooled URL when needed for serverless). Revisit Accelerate only if connection limits become a measured problem.

### Neon branching (recommended workflow)

```
Production branch
  → Preview branch (per PR / schema experiment)
  → Local development branch or shared dev branch
```

Use Neon pooler connection string for serverless runtimes (`DATABASE_URL` with pooler host). Keep a direct URL for migrations if Neon docs recommend splitting (`DATABASE_URL` pooled vs `DIRECT_URL` for Prisma migrate).

Prisma migrate in CI. Environments: development, preview, production — separate Clerk/Stripe/OpenAI keys; Neon branches mapped accordingly.

---

## 14. Environment variables

**From day one:** complete `.env.example` files so a fresh clone is minutes of setup, not archaeology. Copy → fill → run.

Canonical templates (keep in sync with these docs):

- [backend/.env.example](../backend/.env.example) — Neon, Vercel notes, Clerk, OpenAI, Stripe, AI Credits
- [mobile/.env.example](../mobile/.env.example) — `EXPO_PUBLIC_*` only

On Vercel: set secrets in Project → Environment Variables (Production / Preview / Development). Prefer **Neon Vercel integration** for `DATABASE_URL` / `DIRECT_URL`. System vars (`VERCEL_URL`, `VERCEL_ENV`, …) are auto-injected — do not paste them into `.env` locally unless a script needs them.

`DIRECT_URL` is for Prisma migrate against Neon’s non-pooled host. **No Prisma Accelerate** on MVP.

No OpenAI, Stripe secrets, Clerk secret, or database URLs on mobile.

---

## 15. Development workflow

1. Bootstrap mobile + backend + Prisma + **Neon** + OpenAPI skeleton (complete `.env.example` first)
2. Vertical feature slices
3. AI: schema → ingest proposal → Review UI → apply → AI Credits
4. Shopping Mode + Finish summary
5. Polling sync
6. Stripe locally via CLI
7. Update docs when decisions change (`prd`, `architecture`, `cursor-rules`, `roadmap` only)

Typed API client: generate from OpenAPI where practical.

---

## 16. Coding conventions

- TypeScript strict; Zod at HTTP + AI boundaries; keep OpenAPI in sync  
- Feature-first; design-system tokens only (warm orange, mascot sparingly)  
- i18n keys; category keys never localized in DB  
- Product copy: **AI Credits**, never bare “Credits” for metering  
- Named use-cases: `ingestScreenshot`, `applyAiReview`, `markItemBought`, `debitAiCredits`, `finishShopping`, `repeatList`  
- No Redux/MobX/Saga/Context-everywhere  

### 16.1 How to add a language

Locales are a pure domain layer in `shared/locales.ts` (`SUPPORTED_LOCALES`, `LOCALE_META`, `resolvePreferredLocale`). UI shows `emoji` + `nativeName`. AI uses a separate type + total `mapToAiLanguage`.

**Checklist:**

1. Add an entry in `shared/locales.ts` (id, nativeName, englishName, emoji, bcp47, defaultHomeName) — `LOCALE_META` updates automatically  
2. `mobile/lib/i18n/{id}.json` + entry in `mobile/lib/i18n/resources/index.ts`  
3. `backend/locales/{id}.json` (same keys as `DEFAULT_LOCALE`)  
4. `AI_LOCALE_BY_APP` + `AI_PROMPTS` in `backend/features/ai/outputLanguage.ts`  
5. `pnpm openapi:generate` in `backend/`  
6. `pnpm test:locales` in `backend/` (files + key parity + AI map)

**Architecture rule:** Adding a language must **not** require editing existing business logic or UI screens. If you need to change handlers, pickers, or add `if (locale === …)`, extend SSOT / catalogs / total maps first instead of scattering locale branches.

---

## 17. Scalability

Household scale first. Later: archive old events, tighten AI cost, swap `RealtimeProvider`. No microservices for MVP.

Neon pooler handles serverless connections. **Do not add Prisma Accelerate** until connection limits are a measured problem.

---

## 18. Risks

| Risk | Mitigation |
|------|------------|
| Vision / OCR errors | AI Review mandatory path for flags |
| Bad merges | Explicit merge confirm in Review |
| Polling lag / battery | 3s only when visible; stop aggressively |
| AI Credits confusion | Clear costs + balance; naming |
| Scope creep | Product principles + non-goals |

---

## 19. Implementation order

Source of truth: [roadmap.md](./roadmap.md).

```
M01 Bootstrap → M02 Auth → M03 Workspace → M04 Lists → M05 Items/events
→ M06 AI (Import→Processing→Review→Apply) → M07 AI Credits
→ M08 Shopping Mode (back confirm, FAB, Finish) → M09 Invites → M10 Polling
→ M11 History/Repeat → M12 Settings → M13 Stripe → M14 Polish
```

Database: **Neon** (no Prisma Accelerate). Complete `.env.example` from M01.  
Auth providers: email/password, Google, Apple.  
AI Review: accept/reject all **and** per-item.  
Shopping Mode: confirm exit + floating add.  
AI Credits: screenshot 2, text/clipboard 1, free 30/month.
