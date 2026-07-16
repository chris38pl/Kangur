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

1. **Home** — active lists, create, import CTA  
2. **History** — past lists, search, **Repeat List**  
3. **Workspace** — avatar, members, invites, plan, **AI Credits**, settings  
4. **Profile** — account, language, sign out  

### Stacks

- Shopping List → **Shopping Mode**  
- AI Import chooser → Screenshot | Text | Clipboard → Processing → **AI Review**  
- Finish Shopping → Summary → Archive  
- Invite Members · Workspace Settings · Premium · Manual Add · List Settings  

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
- **Dark mode:** token-based from day one  
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

## 10. Synchronization (RealtimeProvider)

- Transport-agnostic.  
- **MVP: smart polling** — 3s interval; only while list / Shopping Mode visible; stop on background, lock, leave.  
- Fetch `ShoppingEvent`s after last known event ID; patch UI.  
- Future: Ably / Supabase Realtime / SSE as adapters — domain never imports a vendor SDK directly.

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

### Repeat List

MVP: API duplicates list + items with statuses reset to `pending`.  
Post-MVP: optional AI cleanup endpoint costing AI Credits.

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

Roles: owner / admin / member — invites & billing: owner + admin.

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
