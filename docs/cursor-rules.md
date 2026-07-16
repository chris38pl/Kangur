# Kangur — Cursor Rules

**Purpose:** Persistent guidance for AI-assisted development in Cursor.  
**Docs allowed:** `prd.md`, `architecture.md`, `cursor-rules.md` only.

Read the PRD and architecture before large changes.

---

## Product

- AI shopping assistant — not a generic list/notes app.
- Killer path: **Import → AI Review → Shopping Mode → Finish → Archive**.
- Principles: AI First, One Hand, Shopping Mode, Fewest Taps, No Clutter, Trust AI but Verify, Family Focused.
- Non-goals: gamification, ads, coupons, social feed, settings sprawl, overengineering.

---

## Must-build UX (do not skip in MVP design)

- **AI Review:** low confidence, merge conflicts, unknown products, accept all / edit / reject.
- **Shopping Mode:** larger targets, swipe, huge checkboxes, optional keep-awake, minimal chrome.
- **Finish Shopping → Summary** (bought / unavailable / removed) → Archive.
- **Import:** Screenshot | Text | Clipboard (clipboard offer on return, esp. Android).
- **Repeat List** from History (MVP = copy; AI cleanup later).
- **Workspace avatar** (emoji, e.g. 🦘🏠🏢⛺).

---

## Branding

- Mascot: flat friendly kangaroo; warm orange; pocket / shopping bag motifs.
- Minimal, premium, flat — use design-system tokens (8px grid, radius scale, dark mode).

---

## Repo shape

- `mobile/` + `backend/` + `docs/` (or `apps/*` without `packages/`).
- Feature-first: `auth`, `workspace`, `shopping-list`, `shopping-item`, `billing`, `ai`, `profile`, `settings`.
- Backend = platform REST `/api/v1` + **OpenAPI** (for humans and codegen — not vanity).
- No Expo imports in backend.

---

## State management — absolute

- **Use:** TanStack Query + React state; light Zustand only if clearly needed.
- **Never:** Redux, MobX, Redux-Saga, Context-everywhere for server/cache state.

---

## AI rules — absolute

- Schema-driven Zod structured outputs only. Never parse free-form model text.
- Never invent quantities. Never infer/invent brands.
- Prefer merge over duplicate. Return confidence. Flag ambiguity.
- Categories: closed enum only —  
  `produce | fruit | vegetables | dairy | meat | fish | frozen | drinks | bakery | snacks | household | baby | pets | pharmacy | other`
- Meter **AI Credits** (name matters — not bare “Credits”): text/clipboard 1, screenshot 2, suggestions 3.
- Apply list changes only after Review accept (proposal → apply).

---

## Data & sync

- Current state in tables + `ShoppingEvent` **activity log**.
- Not event sourcing — never rebuild state from events.
- `RealtimeProvider` abstraction; MVP = smart polling (3s, list/Shopping Mode visible only).
- Do not hard-wire Ably/Supabase/Firebase into domain logic.

---

## Naming & i18n

- Product metering term: **AI Credits**.
- PL + EN from the start; no hardcoded user-facing strings in features.
- Category keys in DB/API; labels in UI only.

---

## Implementation order

1. Bootstrap (Expo, Next, Prisma, Clerk, OpenAPI)  
2. Workspace (+ avatar)  
3. CRUD  
4. Manual + Shopping Mode + Finish summary  
5. **AI** + AI Review + AI Credits  
6. Polling sync  
7. History + Repeat List  
8. Premium  
9. Polish  

---

## Coding habits

- Zod at HTTP/AI boundaries; keep OpenAPI in sync.
- Thin routes; named use-cases (`applyAiReview`, `finishShopping`, `debitAiCredits`, `repeatList`, …).
- Secrets only on backend; workspace AuthZ on every tenant op.
- No UploadThing / permanent screenshots unless a later feature needs durable media.
- Do not add extra `docs/*.md` without an explicit human request.
