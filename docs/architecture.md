# Kangur — Architecture

**Companion to:** [prd.md](./prd.md) · [cursor-rules.md](./cursor-rules.md)  
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
| Platform API | Next.js App Router — versioned REST `/api/v1/...` + **OpenAPI** |
| Forms / validation | React Hook Form, Zod |
| Client data | **TanStack Query** + React local state; optional light Zustand |
| Client data — forbidden | **No Redux, MobX, Saga, Context-everywhere** |
| DB | PostgreSQL + Prisma (JSONB for AI raw + event payloads) |
| Auth | Clerk (email, Google) |
| Payments | Stripe (subscription on Workspace) |
| AI | OpenAI via AI SDK — vision + structured outputs + Zod |
| Sync (MVP) | Smart polling behind `RealtimeProvider` |
| Sync (later) | Ably / Supabase Realtime / SSE — undecided; cost-driven |
| Storage | No permanent screenshots; no UploadThing unless justified later |

**Docs only:** `prd.md`, `architecture.md`, `cursor-rules.md`.

---

## 2. Platform vs client

- Backend exposes a **stable REST API** with Zod-validated contracts.
- Maintain an **OpenAPI** spec (generated from Zod/handlers or hand-kept in sync — pick one approach and stick to it).
- OpenAPI exists primarily so Cursor/Claude/Copilot and codegen can produce typed clients — not for vanity Swagger UI.
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
    └── cursor-rules.md
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

## 13. Deployment

Backend → Vercel (or Node). Postgres managed. Mobile → EAS.  
Vendors: Clerk, Stripe, OpenAI.  
Prisma migrate in CI. Environments: development, preview, production.

---

## 14. Environment variables

### Backend

```
DATABASE_URL=
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PREMIUM_MONTHLY=
APP_URL=
AI_FREE_MONTHLY_CREDITS=
```

### Mobile

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
EXPO_PUBLIC_API_URL=
```

---

## 15. Development workflow

1. Bootstrap mobile + backend + Prisma + Clerk + OpenAPI skeleton  
2. Vertical feature slices  
3. AI: schema → ingest proposal → Review UI → apply → AI Credits  
4. Shopping Mode + Finish summary  
5. Polling sync  
6. Stripe locally via CLI  
7. Update only the three docs when decisions change  

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

1. Repo + CI + Expo + Next + Prisma + Clerk + OpenAPI skeleton  
2. Workspace (avatar, members, invites)  
3. Lists + items CRUD  
4. Manual list + **Shopping Mode** + **Finish summary**  
5. **AI** import (screenshot / text / clipboard) + **AI Review** + AI Credits  
6. Live sync (smart polling + activity log)  
7. History + **Repeat List** (copy)  
8. Premium (Stripe)  
9. Polish (i18n, design system, mascot, motion, a11y)  

AI Review and Shopping Mode land before sync vendor experiments — they define the product.
