# Kangur - Product Requirements Document

**Working title:** Kangur - AI Shopping Assistant  
**Document type:** PRD (MVP)  
**Status:** Draft for greenfield MVP  
**Last updated:** 2026-07-16

---

## 1. Product Vision

Kangur is an **AI-first shopping assistant**, not another shopping list app.

It turns chaotic shopping input - Messenger screenshots, WhatsApp messages, SMS, pasted text, clipboard, and later voice - into an organized, collaborative shopping list in seconds.

**Core promise:** Open Kangur → import screenshot / text / clipboard → AI extracts, normalizes, merges, categorizes, and sorts → Review → ready list. No manual rewriting. No app switching. No chaos.

Kangur is also a **production-ready learning vehicle**: ship a real MVP with auth, billing, AI, live collaboration, and i18n before building a larger React Native SaaS.

### Problem

Today’s household flow is broken:

1. Partner sends a list via Messenger.
2. Shopper switches between chat and the store.
3. List is copied into Notes.
4. Bought items are crossed out manually.
5. More products arrive mid-trip.
6. Everything is copied again.
7. Categories are missing; unavailable items are forgotten.

### Solution

A workspace-owned collaborative list where AI ingests messy input and humans shop together with live sync - including a dedicated **Shopping Mode** and a clear **Finish Shopping** ending.

---

## 2. Kangur Product Principles

| Principle | Meaning |
|-----------|---------|
| **AI First** | Killer path is import → Review → ready list. Build that before polish extras. |
| **One Hand** | Primary shopping actions work with one thumb in-store. |
| **Shopping Mode** | In-store UX is a distinct mode: bigger targets, fewer actions, stay-awake option. |
| **Realtime by Default** | Shared lists feel live. Transport may evolve; the expectation does not. |
| **Fewest Possible Taps** | Every extra screen or confirm must earn its place. |
| **No Clutter** | No enterprise density, no settings sprawl, no decorative noise. |
| **Fast over Fancy** | Perceived speed beats visual spectacle. |
| **Shared by Default** | Lists live in workspaces; collaboration is the normal case. |
| **Premium Feeling** | Minimal, calm, high-quality UI - not “cheap free utility.” |
| **Trust AI but Verify** | Auto-apply high confidence; **AI Review** for the rest; never hide merges. |
| **Family Focused** | Designed for households and small groups, not social networks. |

---

## 3. Goals

### Primary goals (MVP)

| Goal | Success signal |
|------|----------------|
| Eliminate manual rewrite of chat lists | Import → Review → usable list in &lt; 30s |
| Keep one shared source of truth while shopping | Mid-trip adds appear without manual refresh |
| Make in-store UX unmatched | Shopping Mode: large targets, swipe, stay-awake |
| Clear trip ending | Finish Shopping → summary → archive |
| Monetize without blocking first value | Free **AI Credits**; Premium unlocks unlimited AI, full history, and **AI Generate from History** |

### Secondary goals

- Validate workspace + subscription billing (billing on **workspace**, not user).
- Establish stack and conventions transferable to a larger RN SaaS.
- PL/EN from day one.
- Treat the backend as a **platform API** (+ OpenAPI) so web/admin can arrive later without rewrite.

### Non-goals

See [§13 Non-goals](#13-non-goals).

---

## 4. User Personas

### Persona A - The Shopper (primary)

- Shopping with phone in one hand.
- Gets lists via Messenger/WhatsApp; hates retyping.
- Needs: speed, Shopping Mode, live updates, clear categories, Finish summary.

### Persona B - The List Sender

- Sends products from home/work while cooking.
- Expects adds to show up for the shopper.
- Needs: screenshot / text / clipboard → Review → done.

### Persona C - Household Admin

- Creates workspaces (with avatar), invites members, manages billing.
- Needs: simple invites, clear Premium status, **AI Credits** visibility.

---

## 5. User Stories

### Authentication & workspace

- As a new user, I can sign up with email or Google.
- As a user, I can create and switch workspaces (Home, Family, Camping, …) with a small avatar/emoji.
- As a workspace admin, I can invite members and manage roles.
- As a multi-workspace member, I only see lists and **AI Credits** for the active workspace.

### Capture & AI

- As a sender, I can import via **screenshot**, **text**, or **clipboard**.
- As an Android user, after copying a Messenger message, Kangur can offer clipboard import.
- As a user, I land on **AI Review** before committing uncertain results.
- As a user, I expect duplicates merged, names normalized, categories from a fixed taxonomy, notes kept.
- As a Free user, I understand **AI Credit** cost per action and remaining balance.

### Shopping & collaboration

- As a shopper, opening a list for shopping enters **Shopping Mode**.
- As a shopper, I mark items with huge checkboxes / swipe; only essential actions are visible.
- As a shopper, when someone else adds or updates an item, I see it without refresh.
- As a shopper, I can **Finish Shopping**, see a summary, then archive.

### Lists & history

- As a user, I can create, rename, archive, restore, search, and browse past lists.
- As a user, from History I can **Repeat List** (duplicate as a new list; optional AI cleanup later).
- As a Premium user, I can **AI Generate from History** - generate a shopping list from recent shopping history (backend uses up to 5 latest archived lists; no list picker) → AI Review → new list.
- As a Free user, Generate from History is blocked with an upgrade CTA; backend returns `403 PREMIUM_REQUIRED`.
- As a Premium user, I retain full history; Free users have limited history depth.

### Billing

- As a workspace admin, I can upgrade to Premium (~9.99 PLN/month) via Stripe for Premium entitlements: unlimited **AI Credits**, full history, and **AI Generate from History**.
- As a Free workspace, when **AI Credits** are exhausted I can still shop/edit lists but cannot run AI ingest until reset or upgrade.
- Premium-only features are gated by entitlements (active subscription), separate from the credit balance itself.

---

## 6. Primary UI Flows

### 6.1 Core shopping journey (killer path)

```
Open App
  → Home
  → Create List
  → Import (Screenshot | Text | Clipboard)
  → AI Processing
  → AI Review
  → Accept (all or edited)
  → Shopping Mode
  → Finish Shopping
  → Summary
  → Archive
```

### 6.2 Collaboration

```
Workspace
  → Invite member
  → Member accepts
  → Both open same list (Shopping Mode on device in store)
  → Live sync (polling MVP; transport-agnostic)
  → Soft notifications on remote changes
```

### 6.3 Manual path

```
Home → Create / Open List → Add item manually → Shopping Mode → Finish → Summary → Archive
```

### 6.4 Repeat from history

```
History → Select past list → Repeat List → New draft list
  → (Post-MVP optional) AI strip one-off items
  → Shopping Mode → …
```

### 6.5 AI Generate from History (Premium)

```
History / Create → AI Generate from History
  → Backend loads ≤5 latest archived lists (updatedAt DESC; no picker)
  → Premium entitlement check (else 403 PREMIUM_REQUIRED)
  → AI proposal (shared AiIngestRun path) → AI Review → Apply → New list
```

### 6.6 Billing

```
Workspace / Profile → Premium → Stripe Checkout
  → Premium entitlement active
  → Unlimited AI Credits + AI Generate from History unlocked
```

---

## 7. Navigation

### Bottom tabs

| Tab | Purpose |
|-----|---------|
| **Home** | Active lists, quick create, primary import CTA |
| **History** | Past / archived lists, search, **Repeat List**, **AI Generate from History** (Premium) |
| **Workspace** | Avatar, members, invites, plan, **AI Credits**, settings |
| **Profile** | Account, locale, app preferences, sign out |

### Stacks (pushed screens)

| Screen | From |
|--------|------|
| Shopping List / Shopping Mode | Home / History |
| AI Import (chooser) | Shopping List |
| Import Screenshot / Text / Clipboard | AI Import |
| AI Processing | After import submit |
| **AI Review** | After processing |
| Finish Shopping / Summary | Shopping Mode |
| Invite Members | Workspace |
| Workspace Settings | Workspace |
| Premium / Billing | Workspace / Profile |
| Manual Add Item | Shopping List |
| List Settings | Shopping List |

Keep navigation shallow. Prefer sheets for quick actions over deep stacks.

---

## 8. Key screens (product detail)

### 8.1 AI Review ⭐

One of the most important screens in the app. Shown after AI ingest when there is anything to confirm (always available after ingest; can be short if everything is high confidence).

**Surfaces:**

| Block | Purpose |
|-------|---------|
| **Low confidence items** | Items below confidence threshold - review before accept |
| **Merge conflicts / proposed merges** | “Milk” + “mleko 2%” → one item - confirm or split |
| **Unknown / ambiguous products** | Unclear intent, odd OCR, missing qty when source was vague |
| High-confidence auto-ready items | Shown as accepted preview (collapsed or checkmarked) |

**Actions:**

- **Accept all** - apply entire proposal (still respecting any unchecked rejects)
- **Edit** - rename, qty, unit, category, note per item
- **Reject** - drop item(s) from this ingest (do not add to list)
- Confirm / undo individual merges
- Back / cancel ingest apply (no list change if user abandons before accept)

**Principles:** Trust AI but Verify. Never silently merge low-confidence rows. Fewest taps: Accept all must be one clear primary CTA when safe.

### 8.2 Shopping Mode ⭐

Entered when the user opens a list to shop (from Home or “Start shopping”). Killer differentiator vs generic list apps.

| Behavior | Detail |
|----------|--------|
| Focus | Only pending (and maybe unavailable) - hide clutter |
| Targets | Huge checkboxes / tap areas; large type |
| Gestures | Swipe to bought / unavailable / remove (tunable) |
| Actions | Minimal chrome: status, maybe add, finish - no settings maze |
| Stay awake | Optional keep-screen-on while mode is active |
| Sync | Soft toasts for remote adds; optional sound/haptic |
| Exit | Back to normal list view or Finish Shopping |

Default shopping presentation (group-by-category vs flat) comes from workspace settings but layout stays Shopping-Mode-scaled.

### 8.3 Finish Shopping / Summary

Natural end of a trip:

```
Finish Shopping
  → Summary
      Bought: N
      Unavailable: N
      Removed: N
  → Archive (primary)
  → Keep active (secondary)
```

Summary is satisfying and useful for later Repeat List / analytics. Archive is the default happy path after Finish.

### 8.4 Import chooser

Import is an explicit entry with three MVP sources (+ manual add elsewhere):

1. **Screenshot** - camera roll / capture → vision  
2. **Text** - paste multi-line into a field  
3. **Clipboard** - detect clipboard text on return to app (especially Android); offer “Import from clipboard?”  

Manual add remains a separate, non-AI path.

---

## 9. Functional Requirements

### 9.1 Authentication

- Clerk: email + Google  
- Session for Expo and platform REST API  

### 9.2 Workspaces

- Users belong to one or more workspaces.
- Workspace owns: members, lists, **AI Credits** usage, subscription, settings, **avatar**.
- Roles: `owner`, `admin`, `member` (invite/billing: owner + admin).

**Avatar:** small emoji/icon identity per workspace (e.g. 🦘 🏠 🏢 ⛺). Shown in switcher, tabs header, invites. Huge UX clarity when juggling Home / Work / Camping.

### 9.3 Workspace settings

| Setting | Notes |
|---------|--------|
| Language | `pl` / `en` |
| Notifications | Collaboration notifications on/off |
| Realtime sound | Optional sound on remote changes |
| Realtime vibration | Optional haptic on remote changes |
| Default shopping mode | Group-by-category vs flat (feeds Shopping Mode layout) |
| Keep screen on in Shopping Mode | Optional |
| AI preferences | Conservative vs assertive merge (within product rules) |

### 9.4 Shopping lists

- CRUD, search (title, date), archive, restore.
- **Repeat List** from History: creates a new list copied from a past list (items reset to `pending`). Optional Post-MVP AI pass to strip one-off products.
- **AI Generate from History** (Premium entitlement, M13): generate a shopping list from recent shopping history. Backend automatically uses up to **5** latest archived lists (`updatedAt` DESC); the user does **not** pick lists. Reuses shared AI proposal → Review → Apply. Requires active Premium; Free / expired → `403 PREMIUM_REQUIRED`. Still meters via **AI Credits** (unlimited on Premium). Distinct from Repeat.
- Archive preferred over hard delete.

### 9.5 Shopping items

| Field | Notes |
|-------|--------|
| `name` | Display name |
| `normalizedName` | Canonical for merge/dedupe |
| `quantity` | Optional; never invent |
| `unit` | Optional |
| `note` | Preserved from source |
| `category` | Closed enum key only |
| `status` | `pending` \| `bought` \| `unavailable` \| `removed` |
| `addedBy` / `updatedBy` | User refs |
| timestamps | `createdAt`, `updatedAt` |

### 9.6 Category taxonomy (closed enum)

```
produce | fruit | vegetables | dairy | meat | fish | frozen
drinks | bakery | snacks | household | baby | pets | pharmacy | other
```

AI must choose only from this set. UI translates. Unknown → `other`.

### 9.7 Add products (MVP)

1. Screenshot  
2. Text  
3. Clipboard  
4. Manual  

Voice: Post-MVP.

### 9.8 AI processing

- Input: current list + screenshot and/or text (clipboard feeds text path).
- Output: structured JSON only (Zod + structured outputs).
- Extract, normalize, merge, categorize (enum only), keep notes, flag ambiguity, confidence.
- Never invent quantities or brands.
- Prefer merge over duplicate.
- Persist raw AI response (JSONB).
- Meter via **AI Credits**.

### 9.9 AI Credits (metering)

Always say **AI Credits** in product copy (not bare “Credits” - avoids currency confusion).

Free plan: monthly **AI Credits**. Premium: unlimited (fair-use).

**Premium-only feature ≠ Unlimited AI Credits.** Entitlements (e.g. Generate from History) are gated by active subscription; credits are a separate meter that Premium happens to set to unlimited.

| Action | Suggested cost |
|--------|----------------|
| Text / clipboard import | 1 AI Credit |
| Screenshot import | 2 AI Credits |
| **AI Generate from History** (Premium only) | TBD (≥1; same debit path) |
| Suggestions (other Post-MVP) | 3 AI Credits |
| Repeat List AI cleanup (Post-MVP) | TBD (likely ≥1) |

Exact Free monthly allowance set before beta. Enforce server-side.

### 9.10 Live collaboration

- While list / Shopping Mode is visible, remote changes appear without manual refresh.
- MVP: smart polling behind `RealtimeProvider`.
- Soft toast; optional sound/haptic.

### 9.11 Activity log (not event sourcing)

- `ShoppingEvent` = activity log beside current state.
- Never rebuild state by replaying events.

### 9.12 History & search

- Past lists within plan limits; search by title and date.
- **Repeat List** on history items (MVP: deterministic copy; Post-MVP optional AI cleanup on that copy).
- **AI Generate from History** (M13, Premium): generate a shopping list from recent shopping history - backend auto-loads ≤5 latest archived lists (`updatedAt` DESC), no picker; shared AI Review/Apply path.

### 9.13 AI Generate from History & other AI

- **AI Generate from History:** MVP via **M13** - Premium entitlement required; not available on Free.
- Other “AI suggestions” beyond Generate from History: Post-MVP.

### 9.14 Internationalization

- Polish + English from first commit.
- AI returns category keys; UI translates.

---

## 10. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| Performance | AI path &lt; ~30s perceived; Shopping Mode feels instant |
| Sync | Polling only while list/Shopping Mode visible; stop on background/lock/leave |
| Reliability | Mutations in DB; clients catch up via events after last known ID |
| Offline | Soft degradation OK for MVP |
| Security | Clerk AuthN; workspace AuthZ; no cross-tenant leaks |
| Privacy | Screenshots ephemeral |
| Accessibility | Huge Shopping Mode targets; contrast; don’t rely on color alone |
| i18n | No hardcoded user-facing strings in features |
| Maintainability | Feature-first; Zod + OpenAPI; Cursor-friendly |
| Observability | Log AI Credits, failures, confidence; Stripe webhooks |

---

## 11. MVP Scope

### In scope

- Clerk (email + Google)
- Workspaces (avatar, members, invitations, settings)
- Lists CRUD + archive/restore + search + **Repeat List** (copy)
- Items + closed category taxonomy
- Import: screenshot / text / clipboard + manual
- AI ingest + **AI Review** (low confidence, merges, unknown, accept all / edit / reject)
- **Shopping Mode**
- **Finish Shopping** → summary → archive
- Activity log (`ShoppingEvent`)
- Live sync via smart polling + `RealtimeProvider`
- Stripe workspace Premium (billing) + **Premium entitlements**
- **AI Generate from History** (Premium-only; ≤5 recent archived lists; shared AI Review path)
- **AI Credits** metering
- PL / EN
- Expo mobile + Next.js platform API (+ OpenAPI)

### Out of MVP

- Voice; AI cleanup on Repeat List (copy-only Repeat in MVP)  
- Stores, prices, recipes, pantry, receipts, location  
- Permanent screenshot storage  
- Web/admin UI (API ready for them)  
- Gamification, ads, coupons, social feed  
- Websocket vendor lock-in  
- Redux / MobX / Saga / Context-everywhere state architectures  

---

## 12. Post-MVP

1. Voice input  
2. AI cleanup on Repeat List (“remove one-off products”)  
3. Estimated shopping cost  
4. Recurring AI lists / further AI suggestion modes beyond Generate from History  
5. Recipe → list  
6. Pantry / receipts / stores / location  
7. Push sync transport if polling limits UX  
8. Web client / admin on the same platform API  

---

## 13. Monetization

Billing attaches to **Workspace**. Stripe is the payment provider; **Premium entitlements** unlock product features.

| Feature | Free | Premium |
|---------|------|---------|
| Repeat List | Yes (history depth limit) | Yes |
| AI Generate from History | No (`403 PREMIUM_REQUIRED`) | Yes |
| Unlimited AI Credits | No (monthly cap) | Yes |
| Full history depth | No (last 20 archived) | Yes (safety cap 200) |

| Plan | Price | Notes |
|------|-------|--------|
| Free | 0 | Limited monthly **AI Credits**; limited history |
| Premium | ~9.99 PLN / month | Entitlements above + Stripe Checkout / Customer Portal |

- Stripe Checkout + Customer Portal for owner/admin.
- AI Credits exhausted → upgrade CTA; list CRUD still works; AI blocked.
- Premium-only features stay blocked after subscription expiry (`403 PREMIUM_REQUIRED`), even if credit accounting would allow unlimited.

---

## 14. Non-Goals

- Not a generic notes app  
- No gamification, ads, coupon marketplace, social feed  
- No settings sprawl  
- No overengineering (no microservices, no CRDT, no full event sourcing)  
- No premature monorepo `packages/`  
- **No Redux, MobX, Redux Saga, or Context-everywhere**  

---

## 15. UI / Brand

**Brand personality:** Helpful, fast, friendly, reliable, simple.

**Taglines:**

- “Kangur - AI Shopping Assistant”
- “Kangur - Intelligent shopping for the whole family”

**Mascot / brand kit (direction):**

| Element | Direction |
|---------|-----------|
| Mascot | Flat kangaroo - friendly, minimal |
| Color | Warm orange primary |
| Motifs | Pocket, shopping bag |
| Style | Flat, warm, approachable - not corporate, not childish clutter |

**Look:** Modern, minimal, premium. Inspired by Linear, Notion Mobile, Todoist, Things 3, modern Material - adapted for shopping. See architecture Design System.

---

## 16. Acceptance Criteria (MVP)

### Capture → Review → list

- [ ] Screenshot / text / clipboard → AI Review → usable list  
- [ ] AI Review shows low confidence, merge proposals, unknown items  
- [ ] Accept all / edit / reject work; abandoned review does not partial-apply silently  
- [ ] Categories from closed taxonomy; UI localized  
- [ ] Quantities not invented; brands not inferred  

### Shopping Mode & finish

- [ ] Entering shop opens Shopping Mode (large targets, minimal chrome)  
- [ ] Optional keep-screen-on honored when enabled  
- [ ] Finish Shopping shows Bought / Unavailable / Removed counts  
- [ ] Archive from summary works  

### Collaboration

- [ ] Remote changes appear without pull-to-refresh while list visible  
- [ ] Soft notification names actor + action  
- [ ] Polling stops when leaving list / backgrounding  

### Workspace & billing

- [ ] Workspace avatar visible in switcher  
- [x] Repeat List creates a new pending copy from history  
- [ ] AI Credits enforced server-side; Premium via Stripe entitlements; Generate from History returns `403 PREMIUM_REQUIRED` when not entitled

### Quality

- [ ] One-handed Shopping Mode  
- [ ] No permanent screenshot storage  
- [ ] PL + EN on release candidate  
- [ ] No cross-workspace data access  

---

## 17. Open Decisions

| Topic | Default |
|-------|---------|
| Free monthly AI Credits | Set before beta |
| Free history depth | **Last 20 archived lists** (by `updatedAt`); Premium unlimited (safety cap 200). Beyond Free → `403 HISTORY_LIMIT_EXCEEDED` |
| Invite mechanism | Email first |
| When to skip AI Review | Skip only if zero flags and all high confidence - or always show compact Review |
| Soft vs hard delete | Archive lists; `removed` items |

---

## 18. Success Metrics

- Time to first accepted AI list (through Review)  
- % lists via screenshot / text / clipboard vs manual-only  
- Finish Shopping completion rate  
- Concurrent shoppers on same list  
- Free → Premium conversion  
- AI failure / low-confidence rate  
- Weekly active workspaces with ≥1 completed shop  
