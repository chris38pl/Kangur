# Kangur - Cursor Rules

**Purpose:** Persistent guidance for AI-assisted development in Cursor.  
**Docs allowed:** `prd.md`, `architecture.md`, `cursor-rules.md`, `roadmap.md`, `deploy.md` only.

Read the PRD, architecture, [roadmap.md](./roadmap.md), and [deploy.md](./deploy.md) (for release/env work) before large changes. Follow milestone order in the roadmap.

---

## Product

- AI shopping assistant - not a generic list/notes app.
- Killer path: **Import → AI Review → Shopping Mode → Finish → Archive**.
- Principles: AI First, One Hand, Shopping Mode, Fewest Taps, No Clutter, Trust AI but Verify, Family Focused.
- Non-goals: gamification, ads, coupons, social feed, settings sprawl, overengineering.

---

## Must-build UX (do not skip in MVP design)

- **AI Review:** low confidence, merges, unknown; accept all / **accept individual** / **reject individual** / edit.
- **Shopping Mode:** larger targets, swipe, huge checkboxes, optional keep-awake, minimal chrome; **confirm exit** (block accidental back); **Floating Add Button**.
- **Finish Shopping → Summary** (bought / unavailable / removed) → Archive.
- **Import:** Screenshot | Text | Clipboard (clipboard offer on return, esp. Android).
- **Repeat List** from History (MVP = copy; AI cleanup later).
- **Workspace avatar** (emoji, e.g. 🦘🏠🏢⛺).

---

## Branding

- Mascot: flat friendly kangaroo; warm orange; pocket / shopping bag motifs.
- Minimal, premium, flat - use design-system tokens (8px grid, radius scale). Light mode only.

---

## Repo shape

- `mobile/` + `backend/` + `docs/` (or `apps/*` without `packages/`).
- Feature-first: `auth`, `workspace`, `shopping-list`, `shopping-item`, `billing`, `ai`, `profile`, `settings`.
- Backend = platform REST `/api/v1` + **OpenAPI generated from Zod only** (never hand-edit).
- Auth: Clerk **email/password**, **Google**, **Apple**.
- DB: **Neon** + Prisma. **No Prisma Accelerate** for MVP. Prefer Neon branching for preview/schema work.
- Ship complete `.env.example` (backend + mobile) from M01 - every expected var listed.
- No Expo imports in backend.

---

## State management - absolute

- **Use:** TanStack Query + React state; light Zustand only if clearly needed.
- **Never:** Redux, MobX, Redux-Saga, Context-everywhere for server/cache state.

---

## AI rules - absolute

- Schema-driven Zod structured outputs only. Never parse free-form model text.
- Never invent quantities. Never infer/invent brands.
- Prefer merge over duplicate. Return confidence. Flag ambiguity.
- Categories: closed enum only -  
  `produce | fruit | vegetables | dairy | meat | fish | frozen | drinks | bakery | snacks | household | baby | pets | pharmacy | other`
- Meter **AI Credits** (name matters - not bare “Credits”): text/clipboard 1, screenshot 2, suggestions 3.
- Apply list changes only after Review accept (proposal → apply).
- Before shipping AI prompt/model changes: run `pnpm eval:ai --suite history-suggest` in `backend/` when OpenAI key is available (see `backend/evals/README.md`).

---

## Data & sync

- Current state in tables + `ShoppingEvent` **activity log**.
- Not event sourcing - never rebuild state from events.
- `RealtimeProvider` abstraction; MVP = smart polling (3s, list/Shopping Mode visible only).
- Do not hard-wire Ably/Supabase/Firebase into domain logic.

---

## Naming & i18n

- Product metering term: **AI Credits**.
- Locales are SSOT in `shared/locales.ts` (`SUPPORTED_LOCALES` / `LOCALE_META`). Catalogs: `mobile/lib/i18n/{id}.json`, `backend/locales/{id}.json`.
- No hardcoded user-facing strings in features; category keys in DB/API, labels in UI only.
- **How to add a language:** see [architecture.md §16.1](./architecture.md#161-how-to-add-a-language).
- Adding a language must not require editing business handlers, pickers, or `if (locale === …)` - extend SSOT and catalogs instead. Run `pnpm test:locales` in `backend/`.

---

## Implementation order

See [roadmap.md](./roadmap.md) (source of truth). Summary:

1. Bootstrap (Expo, Next, Prisma, **Neon**, OpenAPI-from-Zod, complete `.env.example`) → 2. Auth (email/password, Google, Apple) → 3. Workspace  
4. Lists CRUD → 5. Items + events  
6. **AI** (Import → Processing → Review → Apply) → 7. AI Credits  
8. Shopping Mode (back confirm, FAB) → 9. Invites → 10. Polling  
11. History + Repeat → 12. Settings → 12.5 AI Evals → 13. Premium → 14. Polish  

OpenAPI: generate from Zod only - never hand-edit.  
DB: Neon + Prisma; **no Prisma Accelerate** on MVP.  

---

## Coding habits

- Zod at HTTP/AI boundaries; keep OpenAPI in sync.
- Thin routes; named use-cases (`applyAiReview`, `finishShopping`, `debitAiCredits`, `repeatList`, …).
- Secrets only on backend; workspace AuthZ on every tenant op.
- No UploadThing / permanent screenshots unless a later feature needs durable media.
- Before finishing `mobile/` changes: run `pnpm lint` in `mobile/` and fix errors (CI fails the job otherwise).
- Do not add docs beyond `prd.md`, `architecture.md`, `cursor-rules.md`, `roadmap.md`, `deploy.md` without an explicit human request.
