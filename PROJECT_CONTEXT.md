# PROJECT_CONTEXT — Kangur

**Dokument kanoniczny (konstytucja projektu)**  
**Język:** polski  
**Odbiorca pierwotny:** AI (Business OS / asystenci strategiczni)  
**Odbiorca wtórny:** founder  
**Data odzwierciedlenia stanu:** 2026-08-10 (release **1.0.3**, gałąź robocza `release/1.0.3`)  
**Źródło prawdy o implementacji:** kod + `docs/` + historia commitów — przy konflikcie **preferuj kod i release notes** nad starszym PRD/roadmap, chyba że sekcja „Niespójności” mówi inaczej.

Ten dokument **nie jest** README, PRD ani dokumentacją developerską. Jest modelem wiedzy biznesowo-produktowo-technicznej, który ma umożliwić innemu modelowi AI — bez dostępu do repozytorium — rozumowanie o Kangurze na poziomie kogoś, kto pracował przy projekcie miesiącami.

---

## Spis treści

1. [Executive Summary](#1-executive-summary)
2. [Jak czytać ten dokument](#2-jak-czytać-ten-dokument)
3. [Project History](#3-project-history)
4. [Vision](#4-vision)
5. [Business Context](#5-business-context)
6. [Product](#6-product)
7. [Architecture](#7-architecture)
8. [AI](#8-ai)
9. [Engineering](#9-engineering)
10. [Current State](#10-current-state)
11. [Roadmap](#11-roadmap)
12. [Risks](#12-risks)
13. [Assumptions](#13-assumptions)
14. [Decision Log Summary](#14-decision-log-summary)
15. [Lessons Learned](#15-lessons-learned)
16. [Known Inconsistencies](#16-known-inconsistencies-niespójności-dokumentacji-vs-kod)
17. [Glossary](#17-glossary)
18. [References](#18-references)

---

## 1. Executive Summary

**Kangur** to **AI-first shopping assistant** dla gospodarstw domowych i małych grup — nie „kolejna aplikacja z listą zakupów”.

**Obietnica produktu:** otwórz aplikację → zaimportuj zrzut ekranu / tekst / schowek (później głos) → AI wyodrębnia, normalizuje, scala, kategoryzuje → **AI Review** → gotowa współdzielona lista → **Shopping Mode** w sklepie → **Finish Shopping** → archiwum.

**Forma:** aplikacja mobilna (Expo / React Native) + **platformowe API** (Next.js, REST `/api/v1`, OpenAPI generowane z Zod) + marketing/landing na tym samym deployu Vercel.

**Monetyzacja:** freemium na poziomie **workspace** (nie użytkownika). Free = miesięczny limit **AI Credits** + ograniczona głębokość historii + **history-merge** (lista z poprzednich zakupów). Premium (`PREMIUM_V1`) = nielimitowane AI Credits + pełniejsza historia. Płatności web: Stripe; Google/Apple IAP — fundament Billing Platform, pełne sklepowe providers jeszcze nie domknięte.

**Stan (as-built):** MVP funkcjonalne do wersji mobilnej **1.0.3** (2026-08-10). Milestone **M14** (Polish + RC) w toku. Publiczna dystrybucja produkcyjna w sklepach nadal wymaga domknięcia ścieżki RC (Closed Testing, smoke, ewentualnie promote `staging` → `main`).

**Drugorzędny cel founderski (jawny w PRD):** Kangur jest też **pojazdem uczącym** — realne MVP z auth, billingiem, AI, colaboracją i i18n przed budową większego SaaS na React Native.

**Taglines (brand):**
- „Kangur — AI Shopping Assistant”
- „Kangur — Intelligent shopping for the whole family”

**Domeny:** `getkangur.com` (landing), `api.getkangur.com` (prod API), `staging-api.getkangur.com` (staging API). Kontakt: `contact@getkangur.com`, `support@getkangur.com`.

---

## 2. Jak czytać ten dokument

### 2.1 Hierarchia prawdy

| Priorytet | Źródło | Kiedy używać |
|-----------|--------|--------------|
| 1 | Kod (`backend/`, `mobile/`, `shared/`, Prisma) | Stan faktyczny produktu |
| 2 | Release notes (`docs/releases/*`, What’s New JSON) | Co faktycznie wyszło w danej wersji |
| 3 | `docs/architecture.md`, `docs/security.md`, `docs/deploy.md` | Intencje architektoniczne i ops |
| 4 | `docs/roadmap.md` | Status milestone’ów i wizja; status w tabeli może lagować za kodem |
| 5 | `docs/prd.md` | Wizja produktu, personas, non-goals; częściowo superseded |

### 2.2 Oznaczenia w tym dokumencie

- **FAKT** — potwierdzone w repo / commitach / schema.
- **ZAŁOŻENIE** — wnioskowane lub biznesowo domniemane; wymaga okresowej walidacji.
- **NIEUDokumentOWANE** — brak wiarygodnego źródła w repo; nie zgadujemy.
- **KONFLIKT** — dokumenty i kod się rozmijają; szczegóły w [§16](#16-known-inconsistencies-niespójności-dokumentacji-vs-kod).

### 2.3 Czego ten dokument nie robi

- Nie zastępuje OpenAPI ani migracji Prisma.
- Nie jest checklistą release.
- Nie inventuje metryk biznesowych (MAU, MRR, CAC), których nie ma w repo.

---

## 3. Project History

### 3.1 Jak powstał projekt

**FAKT (PRD + commit `d05d541`, 2026-07-16):** Projekt wystartował od dokumentacji produktowej i decyzji stackowych (Neon zamiast klasycznego Postgres self-host / Accelerate). Następnego dnia bootstrap repo (`a5d3023`), potem intensywny sprint MVP (~10 dni kalendarzowych od bootstrap do 1.0.2).

Kangur powstał jako odpowiedź na konkretny, codzienny ból gospodarstwa: lista zakupów żyje w Messengerze / WhatsApp / SMS, a osoba w sklepie przełącza się między czatem a notatkami, gubi kategorie, statusy „niedostępne” i aktualizacje mid-trip.

Równolegle founder traktuje Kangura jako **pierwszy pełny produkt RN SaaS** (auth + billing + AI + sync + i18n), z którego konwencje mają przenieść się na kolejne produkty.

### 3.2 Oś czasu (major milestones)

| Data (approx.) | Wydarzenie |
|----------------|------------|
| 2026-07-16 | PRD + roadmap + decyzje Neon/env; bootstrap struktury |
| 2026-07-17 | MVP API, Shopping Mode, Expo development builds; polish auth/workspace |
| 2026-07-18 | Invites, notifications, polish Shopping Mode |
| 2026-07-19 | Skalowalne i18n (10 locale), privacy, history, Platform Console |
| 2026-07-21 | Premium (Stripe), Generate from History, marketing site, brand boot |
| 2026-07-22 | Local-first shopping sync SSoT; aisle reorder; Meal Proposal (M21 early); Apple Sign In; Sentry/PostHog; locale/evals |
| 2026-07-23 | Release prep **1.0.1** (security, navigation, UX); FCM Android |
| 2026-07-26 | Release **1.0.2**: shopping sync, create-list handoff, feedback, AI categories (pantry/spices/sauces) |

### 3.3 Ewolucja produktu (ważne pivots)

1. **Backend = Platform API, nie „API pod jedną apkę”** — od początku Next.js ma obsługiwać przyszły web/admin bez przepisywania domeny.
2. **Brak monorepo `packages/`** — świadoma decyzja anty-overengineering; współdzielenie przez folder `shared/` + kopiowanie do `mobile/.shared`.
3. **Sync: polling za abstrakcją RealtimeProvider** — nie WebSockets/Ably w MVP; decyzja kosztowa i złożonościowa.
4. **Billing Platform multi-provider** — Stripe działa; Google/Apple jako stuby w katalogu/providers, pełne IAP później.
5. **AI Credits: rezerwacja przy ingest (nie przy apply)** — pivot bezpieczeństwa/biznesu względem wcześniejszego „debit on apply” (security.md, release 1.0.1).
6. **Kategorie = alejki sklepu** — po analizie danych dodano `pantry`, `spices`, `sauces`; oleje celowo → `other` przez CategoryCorrections.
7. **Meal Proposal (M21) wdrożony wcześniej niż roadmap „vision”** — kod i evals istnieją; roadmap nadal oznacza M21 jako post-release vision (**KONFLIKT** / lag dokumentacji).
8. **i18n: z PL+EN do 10 locale** — `pl, en, de, fr, es, it, cs, ru, uk, be` jako SSOT w `shared/locales.ts`.
9. **Local-first Shopping Sync** — własna mutacja optymistyczna; remote przez eventy; settled reconcile; klucz React Query `["shopping-items", listId, "active"]`.

### 3.4 Lessons learned (historyczne — skrót; pełniej w §15)

- Killer path (Import → Review → Shopping Mode → Finish) musi być pierwsze; invites/polling są wspierające.
- Dokumentacja szybko się rozjeżdża z kodem przy szybkim sprincie — stąd ten PROJECT_CONTEXT i sekcja niespójności.
- OpenAPI z Zod + CI drift check chroni kontrakt API.
- Kredyty trzeba rezerwować przed kosztownym wywołaniem modelu.

---

## 4. Vision

### 4.1 Mission

Uczynić zakupy domowe **wspólnym, spokojnym, jednostronnym (one-hand) doświadczeniem**, w którym chaos komunikacji (czaty, zrzuty, notatki) zamienia się w **jedną wiarygodną listę** — a AI robi ciężką pracę normalizacji, a człowiek zachowuje kontrolę przez Review i Shopping Mode.

### 4.2 Long-term vision

**Horyzont produktowy (z roadmapy wizyjnej):**

1. **MVP / 1.x (obecny):** AI lista + współpraca + Shopping Mode + freemium Premium.
2. **M15:** custom category packs (post-MVP).
3. **M20 Smart Store Ecosystem:** po liście Kangur pomaga zdecydować *gdzie* kupować, w jakiej kolejności alejek, jak płacić mniej; partnerstwa retail **rozszerzają** produkt, nie są warunkiem startu etapów.
4. **M21–M23:** od przepisu / posiłku do listy, discovery przepisów, spersonalizowane posiłki — częściowo **już zaczęte** przez early Meal Proposal.

**Horyzont founderski (ZAŁOŻENIE / PRD):** Kangur waliduje stack i dyscyplinę inżynierską pod większy RN SaaS.

**NIEUDokumentOWANE:** formalna misja firmy, nazwa spółki, docelowy TAM/SAM/SOM w liczbach.

### 4.3 Product philosophy

| Zasada | Znaczenie |
|--------|-----------|
| **AI First** | Killer path to import → Review → gotowa lista |
| **One Hand** | Główne akcje w sklepie kciukiem |
| **Shopping Mode** | Osobny tryb: większe targety, mniej akcji, opcjonalnie keep-awake |
| **Realtime by Default** | Wspólna lista „żyje”; transport może się zmienić, oczekiwanie nie |
| **Fewest Possible Taps** | Każdy dodatkowy ekran musi się „opłacić” |
| **No Clutter** | Bez enterprise density i settings sprawl |
| **Fast over Fancy** | Percypowana prędkość > spektakl |
| **Shared by Default** | Listy w workspace; colaboracja to norma |
| **Premium Feeling** | Spokojne, wysokiej jakości UI |
| **Trust AI but Verify** | AI proponuje; człowiek akceptuje (Review) |
| **Family Focused** | Gospodarstwa / małe grupy, nie sieć społecznościowa |

### 4.4 Core principles (architektura produktu)

- Tenancy = **Workspace** (billing + AI Credits na workspace).
- Stan bieżący w tabelach + `ShoppingEvent` jako **activity log** — **nie** event sourcing.
- AI wyłącznie **structured outputs** (Zod); zamknięta taksonomia kategorii.
- Sync za `RealtimeProvider` / `EventPollingProvider` — transport wymienialny.
- Platform API + OpenAPI-from-Zod.
- Feature-first modules.
- Stan klienta: TanStack Query + lokalny state; **nigdy** Redux / MobX / Saga / Context-everywhere.
- Brak `packages/` monorepo, dopóki ból duplikacji nie jest realny.

### 4.5 Non-goals (świadomie NIE)

Z PRD / cursor-rules / architecture — nadal aktualne jako intencja produktu, o ile nie supersedowane kodem:

- Nie jest generyczną aplikacją notatek.
- Brak gamifikacji, reklam, marketplace kuponów, social feed.
- Brak settings sprawl.
- Brak overengineeringu: microservices, CRDT, pełne event sourcing, Prisma Accelerate w MVP, twarde WebSocket vendor lock-in w domenie.
- Brak premature monorepo `packages/`.
- Brak Redux / MobX / Saga.
- MVP nie obejmowało (i nadal nie jest core): sklepów/cen/pantry trwałego/receipts/location jako produktu; trwałego storage screenshotów; osobnego web/admin UI (API jest gotowe).
- Session Replay PostHog: **wyłączony** na MVP.
- Embeddings / vector search: **nieobecne** w kodzie.

---

## 5. Business Context

### 5.1 Problem statement

Dzisiejszy flow gospodarstwa:

1. Partner wysyła listę Messengera / WhatsApp / SMS.
2. Osoba w sklepie przełącza czat ↔ notatki.
3. Lista trafia do Notes / papieru.
4. Odznaczanie ręcznie; mid-trip dochodzą produkty.
5. Brak kategorii; „niedostępne” giną; brak wspólnego źródła prawdy.

**Koszt:** czas, frustracja, pominięte produkty, konflikt „kto miał kupić X”.

### 5.2 Target users

**Personas (PRD):**

| Persona | Potrzeba |
|---------|----------|
| **Shopper (primary)** | One-hand Shopping Mode, live updates, kategorie, Finish summary |
| **List Sender** | Screenshot / tekst / schowek → Review → done, bez przepisywania |
| **Household Admin** | Workspace, zaproszenia, billing Premium, widoczność AI Credits |

**FAKT:** produkt jest family/household-focused.  
**ZAŁOŻENIE:** pierwotny rynek językowy i cenowy skłania się ku PL (cena ~9.99 PLN w PRD; copy PL w What’s New), przy jednoczesnym shipie 10 locale UI.  
**NIEUDokumentOWANE:** dokładny ICP demograficzny, kanały akwizycji poza Play Closed Testing / landing.

### 5.3 Market

**FAKT z wizji M20:** docelowo ekosystem „smart store” i potencjalne partnerstwa retail przy skali (w wizji pojawia się rząd wielkości 10–50k MAU jako kontekst negocjacyjny — to **wizja**, nie metryka osiągnięta).

**NIEUDokumentOWANE:** formalna analiza rynku, wielkość rynku list zakupowych, pozycjonowanie vs Big Tech grocery.

### 5.4 Competitors (jeśli relevant)

**NIEUDokumentOWANE w repo** jako lista konkurentów.  
**ZAŁOŻENIE produktowe (z non-goals i principles):** Kangur konkuruje nie z „listami checklist”, lecz z **chaosem czatu + Notes**; różnicuje się AI ingest + Review + Shopping Mode + workspace billing.

Inspiracje UI (PRD): Linear, Notion Mobile, Todoist, Things 3, nowoczesny Material — **zaadaptowane** do zakupów, nie kopiowane 1:1.

### 5.5 Unique value proposition

1. **Import chaosu komunikacyjnego** (screenshot / text / clipboard) → strukturalna lista w sekundach.
2. **Trust but verify** — AI Review zamiast ślepego auto-apply jako domyślnej filozofii produktu (uwaga: flaga env może auto-apply — §16).
3. **Shopping Mode** zaprojektowany pod sklep (duże cele, swipe, finish).
4. **Workspace jako jednostka współpracy i monetyzacji**.
5. **Historia + Repeat + history-merge** — lista z poprzednich zakupów (Free w limicie głębokości; bez LLM).
6. **Meal Proposal** — wejście od dania do składników (early ship).

### 5.6 Business model

**FAKT:** Freemium B2C (household), billing na **Workspace**.

| Warstwa | Free | Premium (`PREMIUM_V1`) |
|---------|------|-------------------------|
| AI Credits | Miesięczny limit | Unlimited (fair-use implied) |
| History depth | Ostatnie **20** archived | Safety cap **200** |
| History-merge (create from previous lists) | Tak (w limicie historii) | Tak (głębsze źródła) |
| Repeat List | Tak (w limicie historii) | Tak |
| CRUD list / Shopping Mode | Tak | Tak |

Entitlement SoT: model `Subscription` + feature set z `shared/billing/product-catalog.ts`.  
Produkty katalogowe: `PREMIUM_MONTHLY`, `PREMIUM_YEARLY`.

**Rozróżnienie kluczowe:** „Premium-only feature” ≠ „Unlimited AI Credits”. History-merge (create from previous lists) jest **Free** w limicie głębokości historii; kredyty AI dotyczą importu (screenshot/text/meal). Premium pogłębia historię źródeł merge i daje unlimited credits.

### 5.7 Monetization & pricing philosophy

- **Web:** Stripe Checkout + Customer Portal + webhooks.
- **Android / iOS:** planowane przez Billing Platform (Google Play Billing / App Store); w katalogu są mappingi, pełne IAP + RTDN/ASN — otwarte.
- **Cena w PRD:** ~**9.99 PLN / miesiąc** jako przykładowa.  
- **FAKT as-built:** wyświetlana cena pochodzi z Stripe (`GET /api/v1/billing/premium-price`), nie z hardcoded katalogu.  
- **NIEUDokumentOWANE w tym passie:** aktualna live price ID / kwota w Stripe Live.

**Filozofia:** nie blokować pierwszej wartości (Free AI Credits + history-merge + pełne zakupy); paywall na głębi historii oraz unlimited AI Credits.

### 5.8 Success metrics (zdefiniowane w PRD; niekoniecznie instrumentowane end-to-end)

- Time to first accepted AI list (przez Review)
- % list via screenshot / text / clipboard vs manual-only
- Finish Shopping completion rate
- Concurrent shoppers on same list
- Free → Premium conversion
- AI failure / low-confidence rate
- Weekly active workspaces with ≥1 completed shop

**FAKT:** PostHog jest podpięty pod typed analytics events (`shared/analytics/events.ts`); weryfikacja funneli to pozostałość M14 RC.  
**NIEUDokumentOWANE:** aktualne wartości tych metryk w produkcji.

---

## 6. Product

### 6.1 Major features (as-built)

| Obszar | Zdolność |
|--------|----------|
| Auth | Clerk: email/password, Google, Apple; Bearer JWT |
| Workspace | Tworzenie, switcher, avatar/ikona, role owner/admin/member, settings |
| Invites | Email invites; deep-link; single-use accept |
| Lists | CRUD, archive/restore/delete soft, search, category aisle order per list |
| Items | name, qty, unit, note, category enum, status pending/bought/unavailable/removed |
| AI Import | Screenshot, text, clipboard → proposal → (Review) → apply |
| AI Credits | Metering Free; unlimited Premium; costs per source |
| Shopping Mode | Duże targety, swipe, finish confirm, local-first sync |
| Finish | Summary bought/unavailable/removed → archive |
| History | Archived lists; Repeat; preferredForAi star; history-merge (Free within depth) |
| Meal Proposal | Recipe/dish → ingredients → list (early M21) |
| Notifications | In-app + push (Expo / FCM Android) |
| Billing | Stripe Premium monthly/yearly; portal |
| Feedback | In-app bug/feature + optional photo (UploadThing) |
| Platform Console | Overview + Realtime KPIs; workspace browser; feedback inbox (ADMIN) |
| Marketing | Landing + privacy/terms/contact/delete-account/faq/support (locale) |
| i18n | 10 locale UI |
| Observability | Sentry + PostHog |
| Soft update | App version gate (`APP_LATEST_VERSION` / min supported) |
| What’s New | Toast po update + historia release notes |

### 6.2 Current capabilities vs intentional gaps

**Działa (as-built 1.0.3):** pełna pętla killer path, colaboracja pollingiem, Premium Stripe, history-merge (Free), Meal Proposal, feedback, Platform admin, 10 locale, local-first shopping.

**Świadomie ograniczone / brak:**

- Pełne Google/Apple IAP + reconcile job
- WebSockets / presence pełne
- Voice jako primary capture (są helpery speech dictation; voice-as-product post-MVP w PRD)
- AI cleanup na Repeat List
- Custom category packs (M15)
- Smart Store (M20)
- Trwały pantry / ceny / sklepy / receipts
- Web client / pełny admin web
- Client metrics ingest (M13.7)
- Session Replay
- Embeddings
- Distributed rate limiter (jest in-memory per instance)

### 6.3 User journeys (kanoniczne)

**Killer path:**
```
Open → Home → Create List → Import (Screenshot|Text|Clipboard)
  → AI Processing → AI Review → Accept → Shopping Mode
  → Finish → Summary → Archive
```

**Colaboracja:**
```
Workspace → Invite → Accept → Shared list → Polling sync + soft toasts
```

**Manual:**
```
Home → List → Add item → Shopping Mode → Finish
```

**Repeat:**
```
History → Repeat List → New pending copy → shop
```

**History-merge (Free, create from previous lists):**
```
History/Create → Merge → Backend picks ≤5 lists (preferredForAi first; Free depth)
  → Deterministic proposal → Review → Apply → New list
```

**Meal Proposal:**
```
Dish/description → AI structured recipe/ingredients → Review → Add to list
```

**Billing:**
```
Workspace/Profile → Premium → Stripe Checkout → Entitlement active
```

### 6.4 Key workflows (szczegóły produktowe)

#### AI Review
Jeden z najważniejszych ekranów. Grupy: low confidence, merge proposals, unknown/ambiguous, high-confidence preview. Akcje: Accept all, edit, reject, confirm/undo merges. Abandon przed accept nie powinien cicho partial-apply.

**KONFLIKT:** PRD/roadmap mówią „always shown”; mobile default `EXPO_PUBLIC_AI_REVIEW_ENABLED=false` → auto-apply po ingest, dopóki nie ustawiono `"true"`.

#### Shopping Mode
Osobna gęstość UI; swipe status; Floating Add; confirm exit; opcjonalny keep-awake (settings). Layout group-by-category vs flat z workspace settings (część UI settings może być deferred).

#### Finish Shopping
Naturalne zakończenie: counts → Archive (happy path) lub keep active.

#### preferredForAi
Gwiazdka na History („Prefer for next list”, nie „favorites”). Wpływa na selekcję źródeł history-merge — **preferowane najpierw**, potem uzupełnienie najnowszymi.

### 6.5 Important UX decisions

- Light mode only.
- Bottom tabs: Home | Workspace | FAB create | History(Lists) | Profile.
- App Menu = **full-screen stack** z hamburgera Home, nie drawer.
- Tabs = daily workflows; Menu = secondary/ops/platform.
- Navigation classes: Root / Task / Details; Intent owns navigation; UI nie robi `router.replace` byle gdzie.
- Android Root Back: Home = double-exit; inne taby → Home.
- Brand: flat kangaroo, warm orange, pocket/bag; mascot sparingly.
- Product copy: zawsze **„AI Credits”**, nie bare „Credits”.
- Category keys w DB; labele tylko w UI.
- Create list handoff (1.0.2): FAB → skeleton → `/list/:id` bez flash `/list/new`.
- Suggest-from-history v6: `amount: null` / bez merge blurbs do użytkownika.

---

## 7. Architecture

### 7.1 High-level

```
┌─────────────────────────────────────────────┐
│           Kangur Platform (Next.js)         │
│  /api/v1/*  +  marketing app/[locale]/*     │
│  Prisma → Neon Postgres                     │
└───────────────┬─────────────────────────────┘
                │ HTTPS REST + Bearer (Clerk)
┌───────────────▼─────────────────────────────┐
│     Expo mobile (first client)              │
│  Expo Router · TanStack Query · NativeWind  │
│  EventPollingProvider · DataSyncEngine      │
└─────────────────────────────────────────────┘
        future: Web app, Admin (same API)
```

**Repo layout (FAKT):**
```
kangur/
├── backend/   # Next.js platform API + marketing
├── mobile/    # Expo app
├── shared/    # Domain SSOT (copied → mobile/.shared)
├── docs/
├── scripts/
└── PROJECT_CONTEXT.md
```
Brak root `package.json` / pnpm workspace / `packages/`.

### 7.2 Technology stack (wersje ~ lipiec 2026)

| Warstwa | Wybór |
|---------|--------|
| Runtime | Node ≥24, pnpm 9.15.9 |
| Backend | Next 16.2.x, React 19.2.x, Prisma 6.19.x, Zod 4.x |
| Mobile | Expo ~57, RN 0.86, Expo Router ~57, NativeWind 4, Reanimated 4.5 |
| Auth | Clerk (backend + Expo) |
| DB | Neon serverless Postgres + Prisma (**bez** Accelerate) |
| AI | OpenAI official SDK; opcjonalny Gemini w `AI_PROVIDER_CHAIN` |
| Payments | Stripe; Billing Platform stubs Google/Apple |
| Sync | Adaptive HTTP polling |
| Storage | UploadThing **tylko** feedback attachments |
| Email | Resend (opcjonalnie invites) |
| Analytics | PostHog (EU host default; no autocapture/replay MVP) |
| Errors | Sentry (mobile + Next) |
| Push | Expo Push + Firebase FCM (Android `google-services.json`) |
| Builds | EAS (development `app.kangur.dev`, preview/prod `app.kangur`) |
| Hosting API/landing | Vercel |

**Zustand:** wspomniany w docs jako opcjonalny; **nie** jest zależnością `mobile/package.json` (stan na eksplorację).

### 7.3 Infrastructure & deployment

| Env | API | Neon (intended) | Clerk | Stripe | EAS |
|-----|-----|-----------------|-------|--------|-----|
| Local | localhost:3000 | kangur-dev | Dev | Test | development |
| Staging | staging-api.getkangur.com | kangur-staging | Dev (shared) | Test | preview → Play Closed Testing |
| Prod | api.getkangur.com | kangur-prod | Prod instance | Live | production |

- Apex `getkangur.com` **nigdy** nie serwuje `/api/*`.
- Git: `feature/*` → lokalny merge → `staging` → (później) `staging` → `main`.
- Vercel `build:vercel` = `prisma migrate deploy` + generate + `next build`.
- CI ≠ CD (lint/typecheck/OpenAPI drift/build; bez auto-deploy store).
- Soft-update: `APP_LATEST_VERSION`, `APP_MIN_SUPPORTED_VERSION` (default min `1.0.0`).

**KONFLIKT ops:** marketing default Play URL używa `app.getkangur.mobile`; natywny package id aplikacji to `app.kangur` / `app.kangur.dev`.  
**Historyczna nota (2026-07-26 export):** lokalny `DATABASE_URL` wskazywał kiedyś na Neon production branch — traktować jako ostrzeżenie ops, nie docelowy stan.

### 7.4 Major modules

**Backend features:** `ai`, `app`, `auth`, `billing`, `feedback`, `notifications`, `platform`, `shopping-item`, `shopping-list`, `workspace`.

**Mobile features:** `about`, `ai`, `app-menu`, `app-update`, `auth`, `billing`, `data-sync-engine`, `feedback`, `history`, `notifications`, `offline`, `platform-console`, `platform-feedback`, `platform-workspaces`, `profile`, `shopping-item`, `shopping-list`, `startup`, `whats-new`, `workspace`.

**Shared SSOT:** locales, shopping-categories, category-corrections, billing catalog, analytics events/flags/ownership, metrics names, workspace-icons.

### 7.5 Data model (Prisma — kanoniczne nazwy)

**Enums (wybrane):** `WorkspaceRole`, `PlatformRole`, `ListStatus`, `ItemStatus`, `ShoppingCategory` (24 klucze w tym pantry/spices/sauces), `AiProposalSource` (text|screenshot|clipboard|history|meal), `FeedbackType`, billing enums.

**Modele:**  
`User`, `Workspace`, `WorkspaceMember`, `Invitation`, `WorkspaceSettings`, `Subscription`, `BillingPurchase`, `BillingEvent`, `AIUsage`, `AiCreditHold`, `ShoppingList` (`preferredForAi`, `categoryOrder`, …), `ShoppingItem`, `ShoppingEvent`, **`AiProposalRun`** (docs czasem mówią `AiIngestRun` — **błędna nazwa**), `Notification`, `UserNotificationPreferences`, `PushDevice`, `ShoppingSession`, `Feedback`.

**Profile PII:** UI profilu w Clerk; DB User: `clerkId`, `email`, `locale`, `platformRole`.

**TODO w schema:** workspace domain events jeszcze nie modelowane.

### 7.6 Authentication & authorization

- AuthN: Clerk Bearer (nie cookie) → brak CSRF na JSON API.
- Identity SSoT: `clerkId` + primary email (`normalizeEmail`). Apple Private Relay = normalny email — **bez** specjalnych branchy.
- AuthZ: `authorize` / `authorizeList` / `requireRole` / `requirePlatformAdmin`.
- Platform ADMIN: one-way promote przez `PLATFORM_ADMIN_EMAILS` tylko gdy email **verified**.
- Platform workspace browser: synthetic in-memory `owner` — **bez** tworzenia `WorkspaceMember`; mobile overlay AsyncStorage `adminBrowsingWorkspaceId`.
- First login: default Home workspace (`icon: home`; PL nazwa „Dom”), serializowane tworzenie (fix race 1.0.2).

### 7.7 Synchronization

- MVP: `EventPollingProvider` adaptive polling.
- Events = **sygnał odświeżenia**, nigdy rebuild stanu z payloadu.
- Cadence list detail: ~3s → 5s → 10s; shopping: ~12s → 15s → 20s.
- Own events: advance cursor only; remote: `requestItemsRefresh` + soft toast.
- Settled reconcile po opróżnieniu outbound queue / leave / foreground.
- Local authority tylko dla pending outbound entity; inaczej remote wins.
- Inbound SSoT: Realtime → DataSyncEngine → invalidate → GET → `reconcileServerSnapshot`.
- Soft offline: baner + degradacja OK dla MVP.

### 7.8 Integrations / external services

Neon, Vercel, Clerk, Stripe, OpenAI, (opcjonalnie Gemini), Resend, Expo/EAS, Firebase FCM, UploadThing, PostHog, Sentry, Google Play / App Store.

**Nie w MVP:** Ably, Redis, Prisma Accelerate, Mixpanel/Amplitude/Firebase Analytics, Session Replay, Clerk webhooks.

### 7.9 AI architecture (skrót — szczegóły §8)

```
Trigger → AuthZ (+ Premium jeśli trzeba) → Reserve AI Credits
  → Structured OpenAI (Zod) → AiProposalRun
  → (opcjonalnie) AI Review → Apply (rehydrate z stored proposal)
  → Events; hold staje się spent / refund on failure
```

### 7.10 Scalability assumptions

- Provisional events capacity RPS = **2500** (`capacity_source=provisional`) aż do load testów k6.
- Leave polling gdy przez ≥2 tygodnie: waste empty polls, headroom <5×, SLO burn, koszt polling vs WS.
- Lever order: adaptive cadence → ETag/304 → WebSocket active-list-only.
- Rate limits: in-memory per instance (AI 10/min, invites 20/h, …) — nie global distributed.

### 7.11 Security considerations

- Workspace isolation przez authorize*.
- Invite tokens: SHA-256 w DB; raw token nie w API create / push payloads.
- AI: Prompt/Data Separation (`<<<UNTRUSTED_DATA>>>`); apply nie ufa klientowi na name/category — rehydrate z `AiProposalRun.proposal`.
- Screenshot: MIME + magic-byte sniff; ephemeral (brak trwałego storage produktowego).
- No raw SQL — tylko Prisma.
- Credits reserved at ingest; refund on OpenAI failure; 15 min hold TTL; abandon po sukcesie = spent.

### 7.12 Performance considerations

- AI path perceived &lt; ~30s (PRD NFR).
- Shopping Mode: instant local mutations.
- Events API SLO: P95 &lt; 250 ms (soft alert 500 ms); availability &gt;99% non-5xx.
- Client poll failures &lt; 0.5%.
- Import timeouts floored for large clipboard/vision (1.0.2).

---

## 8. AI

### 8.1 How AI is used

| Use case | Source enum | Credit cost (kod) | Premium gate? |
|----------|-------------|-------------------|---------------|
| Text import | `text` | 1 | Nie (credits) |
| Clipboard | `clipboard` | 1 | Nie |
| Screenshot | `screenshot` | 1 | Nie |
| History-merge | `history` | 0 | Nie (Free; depth limits sources) |
| Meal proposal | `meal` | 1 | (credits; szczegóły gate wg kodu feature) |

### 8.2 Current AI capabilities

- Ekstrakcja produktów ze zrzutów i tekstu wieloliniowego.
- Normalizacja nazw, merge duplicates, confidence, ambiguity flags.
- Kategoryzacja do zamkniętego enum (aisle thinking).
- CategoryCorrections post-process (wyjątki biznesowe, np. oleje → `other`).
- History-merge (v7: deterministic; amounts/notes null; curated aliases).
- Meal proposal: danie → składniki → lista.
- Offline eval harness: `history-suggest`, `meal-proposal`, `shopping-categories`, `text-ingest`.
- Output language aligned z locale.
- Opcjonalny provider chain (domyślnie OpenAI).

### 8.3 Future AI vision

- Voice capture jako first-class.
- AI cleanup na Repeat (strip one-offs).
- Dalsze suggestion modes.
- M20: ranking sklepów / ścieżka alejek / promo (wizja).
- M22–M23: discovery i personalizacja posiłków.
- **Nieplanowane w kodzie:** embeddings / RAG / fine-tune — brak śladu.

### 8.4 Prompting philosophy

- Schema-driven structured outputs only — nigdy parse free-form.
- Never invent quantities or brands.
- Prefer merge over duplicate; return confidence; flag ambiguity.
- Categories: supermarket aisles, not biology; locale-agnostic rules; examples in AI output language.
- CategoryCorrections = **tylko** business exceptions (nie „naprawianie AI”); zmieniają wyłącznie `category`.
- Prompt/Data Separation dla untrusted user content.
- Bias Generate from History: near-complete weekly grocery; better false positive than false negative; hard-drop clear DIY one-offs.
- Przed zmianą promptów: `pnpm eval:ai --suite …`.

### 8.5 Known AI limitations

- OCR / screenshot quality zależna od źródła.
- Multi-category reality vs single aisle per item.
- Historycznie wysoki udział `other` przed pantry/spices/sauces (~20–30% w snapshotach); po zmianach oczekiwana poprawa — wymaga rewalidacji eval/data.
- Brak vector memory / cross-workspace learning.
- Model costs + latency; Free credits limitują abuse.
- Review UX zależy od flagi env (może ukryć Review).

### 8.6 Important implementation decisions

- Wspólna ścieżka proposal → Review → Apply dla import i history.
- Persist raw AI response (JSONB) w `AiProposalRun`.
- Credits: reserve at ingest; abandon after success = spent.
- History source selection: `preferredForAi` then fill to 5; no client picker.
- Free AI uses (lifetime meter): default **15** (`AI_FREE_LIFETIME_CREDITS`, fallback legacy monthly env / 15). Flat cost **1** per AI action; history-merge **0**. UX: „darmowe użycia AI”, not „credits/lifetime”.
- Evals offline nie debitują credits / nie persystują DB.

---

## 9. Engineering

### 9.1 Coding philosophy

- Feature-first, thin route handlers, named use-cases.
- Cursor-friendly: małe, czytelne slice’y milestone.
- Product-first order: Workspace → CRUD → AI path → Shopping Mode → Invites → Polling → …
- „Boring technology” tam, gdzie nie jest to klin produktu.
- Complete `.env.example` od dnia 1.

### 9.2 Architectural principles

Patrz §4.4 i architecture.md §6. Najważniejsze absoluty:

1. Workspace tenancy  
2. Current state + activity log (nie event sourcing)  
3. Structured AI + closed categories  
4. Transport-agnostic sync  
5. Platform API + OpenAPI-from-Zod  
6. Feature-first  
7. Query + local state; never Redux/MobX  
8. No packages until pain  

### 9.3 Folder structure philosophy

- `app/` (Expo Router / Next routes) tylko wiring.
- Logika w `features/`.
- `shared/` = SSOT domenowy bez published package; `mobile/scripts/sync-shared.js` kopiuje do `mobile/.shared` (Metro/EAS SHA-1).
- Duplicate Zod lekko OK; extract package później.

### 9.4 Testing approach

| Rodzaj | Stan |
|--------|------|
| Backend CI | lint, typecheck, OpenAPI drift, build |
| Mobile CI | lint, typecheck |
| Locale parity | `pnpm test:locales` (+ reguła Cursor: wszystkie 10 locale) |
| AI evals | `pnpm eval:ai --suite <name>` |
| Billing smoke | script smoke-billing |
| Mobile node tests | małe (`test:auth-boot`, `test:http-anomaly`) |
| E2E | **NIEUDokumentOWANE** / brak dużego suite |

### 9.5 Deployment strategy

Patrz §7.3. Zasada: merge → Vercel migrate+build → API smoke → EAS → Closed Testing → (osobna decyzja) prod.

### 9.6 Versioning

- Mobile semver w `app.config.ts` / `package.json` (obecnie **1.0.2**).
- EAS build number auto-increment na preview/production.
- Soft-update sheet + What’s New toast (kolejność: soft-update first).
- First install nie pokazuje What’s New toast (seed `lastSeen`).

### 9.7 Important ADRs

**FAKT:** brak formalnych plików ADR w repo. Poniżej „ADR-like” decyzje udokumentowane w docs/kodzie:

| Decyzja | Dlaczego |
|---------|----------|
| Neon + Prisma, no Accelerate | Prostota MVP, koszt, serverless Postgres |
| No packages monorepo | Uniknąć premature abstraction |
| OpenAPI from Zod only | Jedno źródło kontraktu; CI drift |
| Polling not WS | Koszt, złożoność, wystarczające na MVP |
| Billing on workspace | Rodzina dzieli Premium; prostszy mental model |
| Credits at ingest | Nie płacić OpenAI „za darmo” przy abandon po sukcesie; chronić przed abuse |
| App Menu full-screen | Skalowalność Platform/ops vs drawer |
| Categories = aisles | Szybkie zakupy, nie taxonomia żywności |
| Oils → other via corrections | Za mało SKU na osobny aisle; wyjątek produktowy |
| preferredForAi | Lepsza jakość Generate without picker UX |
| Platform API first | Web/admin bez rewrite |
| Session Replay off | Privacy + MVP scope |
| Meal proposal early | Walidacja zainteresowania recipe→list przed pełnym M21–M23 |

### 9.8 Known technical debt

- M13.7 client metrics ingest deferred.
- Google/Apple webhook routes: TODO verify + apply entitlement.
- Distributed rate limiting.
- Workspace domain events nie w schema.
- `notificationHandler.ts`: extract steps TODO.
- Deferred workspace settings UI (sound/haptic, keep-screen-on toggle, shopping layout) — częściowo.
- Play package id mismatch marketing vs app.
- Docs set większy niż „tylko 5 plików” z cursor-rules.
- Roadmap status lag (M21).
- Provisional capacity constant bez load testów.
- Wysoki historyczny `other`; unused categories w danych (cleaning, baby, electronics, office, garden) wg export snapshot.

### 9.9 Trade-offs

| Wybrano | Koszt |
|---------|-------|
| Polling | Bateria/koszt RPS vs prostota |
| Soft offline | Nie pełny offline-first CRDT |
| Shared copy script | Brak prawdziwego package versioning |
| Stripe-first | IAP delay na native stores |
| Closed taxonomy | Mniej elastyczności vs szybsze zakupy |
| Reserve credits on ingest | Użytkownik „traci” credit nawet przy abandon po udanym proposal |
| 10 locale early | Koszt utrzymania i18n vs reach |
| Early Meal Proposal | Roadmap/docs niespójne; więcej powierzchni AI do utrzymania |

---

## 10. Current State

### 10.1 What is already implemented

Milestone’y **M01–M13.11** w roadmap oznaczone jako done; plus istotne dodatki 1.0.1/1.0.2 (local-first sync, feedback, pantry/spices/sauces, What’s New, meal proposal, FCM wiring, security hardening credits).

### 10.2 What is production-ready

**FAKT względny:** kod na `staging` z release 1.0.2 jest kandydatem RC.  
**ZAŁOŻENIE / ops:** „production-ready” dla store production track **nie jest zamknięte**, dopóki M14 RC checklist (Closed Testing, Privacy naming Sentry/PostHog, PostHog funnel verify, one-handed QA, PRD sweep) i ewentualny merge `staging`→`main` nie przejdą.

### 10.3 What is experimental / early

- Meal Proposal (wczesny względem roadmapy wizyjnej).
- Speech dictation helpers.
- Platform Console Realtime (server proxies; client KPIs null do M13.7).
- Gemini fallback (env-gated).
- Admin workspace browser (powerful; ops risk).

### 10.4 What is missing

Patrz §6.2 + M14 remaining + IAP + M15 + M20 wizja.

### 10.5 Current priorities (lipiec 2026)

1. Domknięcie **M14 RC** (QA, Closed Testing, privacy/analytics naming, funnel).
2. Stabilność shopping sync / create-list / feedback w Closed Testing.
3. UploadThing token + migrate per env dla feedback.
4. Apple Sign In device QA po Developer Account + nowym EAS iOS build.
5. Utrzymanie spójności i18n (10 locale).
6. (Następnie) decyzja promote do production / IAP / M15.

### 10.6 Open problems

- Ujednolicić Free AI Credits (15 vs 30) — decyzja produktowa + env.
- Ujednolicić AI Review default (always vs env off).
- Play package id marketing vs native.
- Kiedy wychodzić z pollingu (dane capacity).
- Jakość kategorii po wprowadzeniu pantry/spices/sauces — re-measure `other`.
- IAP compliance i entitlement reconcile.
- Czy Meal Proposal komunikować jako shipped feature czy beta.

---

## 11. Roadmap

### 11.1 Near-term

| ID | Temat | Status |
|----|-------|--------|
| M14 | Polish + RC | **in progress** |
| M14.5 | In-App Feedback | implemented; needs UT token + migrate |
| M13.x IAP | Google/Apple providers + reconcile | open |
| M13.7 | Client metrics ingest | deferred post-release |

### 11.2 Long-term

| ID | Temat | Status |
|----|-------|--------|
| M15 | Custom category packs | pending post-MVP |
| M20 | Smart Store Ecosystem (E1–E8 vision) | vision |
| M21 | Recipe → Shopping List | vision w roadmap; **częściowo shipped** jako Meal Proposal |
| M22 | Recipe Discovery | vision |
| M23 | Personalized Meal Discovery | vision |

### 11.3 Potential future directions (PRD post-MVP + wizje)

- Voice input first-class
- AI cleanup on Repeat
- Estimated shopping cost
- Recurring AI lists
- Pantry / receipts / stores / location
- Push/WS transport
- Web client / admin
- GDPR data export (wzmiankowany jako post-roadmap)
- OTel / load-test playbook / WS cost ROI
- Retail partnerships after MAU (M20)

### 11.4 Intentionally postponed

- Prisma Accelerate
- Ably / hard WS
- Session Replay
- Autocapture analytics
- Gamification / ads / coupons / social
- CRDT / event sourcing
- packages/ monorepo
- Empty Platform Console tab shells (Scaling/Backend/Business) przed danymi
- Full shopping presence
- Etap 3 optimistic create-list shell (tylko jeśli POST P95 wysokie)

---

## 12. Risks

### 12.1 Business risks

- Freemium conversion: za mało Credits Free → frustracja; za dużo → brak Premium.
- Household billing: kto płaci w rodzinie; churn przy zmianie admina.
- Zależność od App Store / Play review i IAP rules.
- Retail partnerships zbyt wcześnie (M20 ostrzega: partnerstwa po wartości produktu).
- **NIEUDokumentOWANE:** runway, unit economics OpenAI vs ARPU.

### 12.2 Technical risks

- Polling cost / Neon capacity przy wzroście concurrent shopping sessions.
- In-memory rate limits nieskuteczne multi-instance.
- OpenAI outage → branded AI unavailable (jest ekran); kredyty/refund paths muszą trzymać spójność.
- Sync race conditions mimo local-first (złożoność reconcile).
- Env mixups (Stripe live/test, Neon prod vs staging) — już historycznie wrażliwe.

### 12.3 Product risks

- AI Review wyłączony env → erozja „Trust but Verify”.
- Słaba klasyfikacja → użytkownik nie ufa kategoriom / Shopping Mode.
- Generate from History „za dużo śmieci” mimo v6.
- Scope creep Smart Store / recipes przed solidnym core loop.

### 12.4 Operational risks

- Founder-operated Platform Console hard-delete workspaces.
- Feedback bez UploadThing token = degraded.
- Apple Sign In wymaga zewnętrznych dashboardów + rebuild.
- CI green ≠ store ready.
- Dokumentacja lag → złe decyzje AI/agentów (mitigowane tym plikiem).

### 12.5 Dependency risks

| Zależność | Ryzyko |
|-----------|--------|
| Clerk | Auth outage / pricing / Apple linking |
| Neon | Cold start / quotas |
| OpenAI | Cost, policy, model drift |
| Stripe | Webhook correctness = entitlement correctness |
| Vercel | Deploy/migrate coupling |
| Expo/EAS/RN | Upgrade churn |
| PostHog/Sentry | Privacy disclosure accuracy |
| Google/Apple | IAP, FCM, Sign in with Apple |

---

## 13. Assumptions

### 13.1 Critical business assumptions

1. Gospodarstwa wolą współdzieloną listę od czatu mid-trip.  
2. Screenshot/text import jest killer adoption path.  
3. Freemium z Credits wystarczy do activation przed paywallem.  
4. Billing na workspace jest zrozumiały dla rodzin.  
5. PL-centric pricing (~9.99 PLN) jest akceptowalny — **do walidacji**.  
6. Kangur jako learning vehicle nie koliduje z jakością produktu konsumenckiego.

### 13.2 Technical assumptions

1. Polling wystarczy do „feels live” w skali MVP.  
2. Neon + Prisma bez Accelerate utrzyma SLO events.  
3. Structured OpenAI + Zod jest wystarczająco deterministic przy evalach.  
4. Clerk primary email jest wystarczającym SSoT dla invites (w tym Private Relay).  
5. Kopiowanie `shared/` jest akceptowalne do czasu realnego bólu package.

### 13.3 Product assumptions

1. Zamknięta taksonomia alejek > custom categories na start (M15 później).  
2. Użytkownik zaakceptuje Review friction dla zaufania (lub env auto-apply na early builds).  
3. 10 locale early jest warte kosztu.  
4. Light mode only jest OK.  
5. Meal proposal zwiększa retention / Premium interest.

### 13.4 Things that should be periodically validated

- Free credit allowance (15 vs 30) vs conversion i cost.  
- AI Review enablement rate vs support burden.  
- Share of `other` categories po zmianach.  
- Events RPS / headroom / polling cost.  
- PostHog funnel: import → review → shop → finish → premium.  
- Play/App Store package IDs i listing URLs.  
- IAP readiness before marketing Premium on mobile stores.  
- Czy M21 early spełnia jakość bez durable Recipe DB.

---

## 14. Decision Log Summary

Poniżej tylko decyzje, które **ukształtowały** projekt (dlaczego).

1. **AI shopping assistant, nie list app** — klin = import chaosu, nie checklist UI.  
2. **Workspace tenancy + billing** — colaboracja i monetyzacja w jednym miejscu.  
3. **Platform API + OpenAPI-from-Zod** — przyszły web/admin i typed clients dla AI tools.  
4. **Expo + Next + Neon + Clerk + OpenAI + Stripe** — nowoczesny, „boring enough” stack SaaS.  
5. **No packages monorepo** — prędkość MVP.  
6. **No Prisma Accelerate** — unikać premature paid abstraction.  
7. **Polling behind RealtimeProvider** — realtime expectation bez WS kosztu.  
8. **Activity log ≠ event sourcing** — prostszy mental model, mniej bugów rebuild.  
9. **AI Credits metering + Premium entitlements oddzielnie** — elastyczny paywall.  
10. **Credits reserved at ingest** — ochrona kosztu modelu.  
11. **Closed aisle taxonomy + corrections pipeline** — szybkie zakupy + kontrolowane wyjątki.  
12. **preferredForAi zamiast picker** — mniej tapów, lepszy sygnał jakości historii.  
13. **App Menu full-screen** — skalowanie Platform bez zaśmiecania tabów.  
14. **10 locale SSOT** — ekspansja językowa bez if-locale w biznesie.  
15. **Local-first shopping sync** — perceived speed w sklepie przy słabej sieci.  
16. **Observability: Sentry + PostHog, no Session Replay** — crash + funnel bez creepy replay.  
17. **Meal Proposal early** — walidacja recipe wedge przed pełnym ekosystemem M22/M23.  
18. **Smart Store as vision after core value** — partnerstwa retail nie blokują shipu.

---

## 15. Lessons Learned

### 15.1 Biggest successes

- Szybkie dojście od PRD (16.07) do 1.0.2 (26.07) z pełnym klinem AI + Shopping Mode + billing.  
- Dyscyplina OpenAPI-from-Zod + feature-first utrzymała spójność przy AI-assisted coding.  
- Local-first sync adresuje realny ból sklepu (słaba sieć).  
- Evals harness daje regresję jakości promptów.  
- Platform Console + admin browser daje founderowi ops bez osobnego admin web.  
- i18n SSOT skaluje się do 10 locale.

### 15.2 Biggest mistakes / frictions

- Drift dokumentacji (credits 30 vs 15, Review always vs env off, M21 vision vs shipped, AiIngestRun naming, Play package id).  
- Ops ryzyko wskazania lokalnego DB na production branch (export note).  
- Marketing Play URL rozjechany z bundle id.  
- Część settings UX deferred mimo PRD — dług wizualny vs scope.

### 15.3 What should never be repeated

- Hand-edit OpenAPI.  
- Rebuild list state from ShoppingEvent payloads.  
- Redux/MobX/Context-everywhere dla server state.  
- Traktowanie CategoryCorrections jako „drugiego AI” do łata błędów modelu.  
- Ciche cross-tenant access / zwracanie raw invite tokens.  
- Silent git branch mutation w shared agent chats (reguła Cursor).  
- Ship user-facing string tylko w pl/en bez pozostałych locale.

### 15.4 What should always be preserved

- Killer path Import → Review → Shopping Mode → Finish.  
- Trust AI but Verify (nawet jeśli env chwilowo auto-apply — filozofia produktu).  
- Workspace jako granica tenancy i billingu.  
- Structured AI + closed categories.  
- Platform API mindset.  
- Feature-first + Query state model.  
- Nazwa meteringu **AI Credits**.  
- Light, calm, one-hand brand.  
- Eval before prompt ship gdy klucz dostępny.  
- Apex nigdy nie serwuje API.

---

## 16. Known Inconsistencies (niespójności dokumentacji vs kod)

Te punkty **muszą** być świadomie rozstrzygane przy decyzjach; nie wolno „uśredniać” milcząco.

| Temat | Dokumenty | Kod / as-built | Rekomendacja dla AI |
|-------|-----------|----------------|---------------------|
| Free AI uses | 15 lifetime (flat 1/action) | Default **15** (`AI_FREE_LIFETIME_CREDITS`) | Preferuj kod/env |
| AI Review | PRD/roadmap: always shown | `EXPO_PUBLIC_AI_REVIEW_ENABLED` default **false** (auto-apply) | Podawaj obie prawdy; nie zakładaj Review always-on bez sprawdzenia env |
| Model nazwa AI run | Docs: `AiIngestRun` | Prisma: **`AiProposalRun`** | Używaj `AiProposalRun` |
| Play package | Marketing/env example: `app.getkangur.mobile` | App: **`app.kangur`** / dev `app.kangur.dev` | Preferuj `app.config.ts` |
| M21 Meal Proposal | Roadmap: vision post-release | Commits + features + evals **shipped** | Traktuj jako early-shipped; roadmap lag |
| Generate History selection | Starszy PRD: ≤5 archived `updatedAt` DESC | Architecture/kod: **preferredForAi first**, then fill | Preferuj architecture/kod |
| Docs allowlist | cursor-rules: tylko 5 plików | Istnieją security, navigation, releases, category analysis, … | Traktuj allowlist jako historyczną preferencję; pliki istnieją |
| Debit credits | Starsze teksty „debit on apply” | **Reserve at ingest** | Preferuj security.md + kod |
| Neon naming | Ideal: kangur-dev/staging/prod | Export note: local wskazywał prod branch | Waliduj env; nie zakładaj idealnego nazewnictwa |

---

## 17. Glossary

### Domain / business

| Termin | Znaczenie |
|--------|-----------|
| **Kangur** | Nazwa produktu / AI Shopping Assistant |
| **Workspace** | Jednostka tenancy: członkowie, listy, kredyty, subskrypcja |
| **AI Credits** | Meter AI (nie waluta fiat); product copy zawsze z „AI” |
| **Premium / PREMIUM_V1** | Feature set: unlimited credits, full history, generate from history |
| **Shopping Mode** | Tryb UI zoptymalizowany pod sklep |
| **AI Review** | Ekran weryfikacji propozycji AI przed apply |
| **Finish Shopping** | Zakończenie sesji zakupów + summary + archive |
| **Repeat List** | Deterministyczna kopia archived → nowa lista pending |
| **History-merge** | Free: nowa lista z ≤5 źródeł historii (deterministic merge + Review) |
| **preferredForAi** | Flaga listy „preferuj przy następnej liście z historii” (gwiazdka) |
| **Meal Proposal** | AI: danie/opis → składniki → lista |
| **Category / aisle** | Zamknięty enum półki sklepowej |
| **CategoryCorrections** | Reguły biznesowe zmieniające wyłącznie category |
| **Platform Console** | Ops dashboard dla `platformRole=ADMIN` |
| **Billing Platform** | Warstwa providerów płatności → entitlement SoT |
| **Closed Testing** | Google Play track przed produkcją |
| **What’s New** | In-app release notes po update |

### Technical

| Termin | Znaczenie |
|--------|-----------|
| **Platform API** | Versioned REST `/api/v1` + OpenAPI-from-Zod |
| **AiProposalRun** | Rekord propozycji AI (proposal JSONB, status) |
| **ShoppingEvent** | Activity log / sync cursor — nie event sourcing |
| **EventPollingProvider** | MVP transport realtime |
| **DataSyncEngine** | Orkiestracja refresh/reconcile cache |
| **RealtimeProvider** | Abstrakcja transportu sync |
| **authorize / authorizeList** | AuthZ workspace/list |
| **SSOT** | Single source of truth (np. `shared/`) |
| **EAS** | Expo Application Services (buildy) |
| **FCM** | Firebase Cloud Messaging (Android push) |
| **Hold TTL** | 15 min auto-refund orphaned credit reserves |

### Abbreviations

| Skrót | Rozwinięcie |
|-------|-------------|
| PRD | Product Requirements Document |
| NFR | Non-functional requirements |
| IAP | In-app purchase |
| RTDN | Real-time developer notifications (Google) |
| ASN | App Store Server Notifications |
| RC | Release candidate |
| SLO | Service level objective |
| MAU/DAU | Monthly/Daily active users |
| SSoT / SSOT | Single source of truth |

---

## 18. References

### Dokumenty w repozytorium

- `README.md` — setup i mapa repo  
- `docs/prd.md` — wizja produktu, personas, scope MVP (Draft 2026-07-16)  
- `docs/architecture.md` — architektura as-designed (+ local-first sync)  
- `docs/roadmap.md` — milestone’y M01–M15 + wizje M20–M23  
- `docs/deploy.md` — środowiska, git flow, Vercel/EAS  
- `docs/security.md` — AuthN/Z, credits, rate limits  
- `docs/cursor-rules.md` — reguły AI-assisted development  
- `docs/navigation-principles.md` — Root/Task/Details  
- `docs/category-classification-analysis.md` — decyzje pantry/spices/sauces/oils  
- `docs/products-categories-export.md` — snapshot danych kategorii  
- `docs/releases/1.0.1.md`, `docs/releases/1.0.2.md` — checklists release  
- `backend/evals/README.md` — harness ewaluacji AI  
- `mobile/features/whats-new/releases/1.0.2.json` — copy What’s New  

### Kod / SSOT kluczowe

- `backend/prisma/schema.prisma`  
- `backend/lib/aiCredits.ts`  
- `backend/lib/authorize.ts` (AuthZ)  
- `backend/features/ai/**`  
- `backend/features/billing/**`  
- `shared/billing/product-catalog.ts`  
- `shared/locales.ts`  
- `shared/shopping-categories.ts`  
- `shared/category-corrections.ts`  
- `shared/analytics/events.ts`  
- `mobile/app.config.ts`  
- `mobile/scripts/sync-shared.js`  
- `mobile/features/data-sync-engine/**`  
- `backend/.env.example`, `mobile/.env.example`  
- `backend/vercel.json`, `mobile/eas.json`  
- `.github/workflows/ci.yml`  
- `.cursor/rules/*.mdc`  

### Zewnętrzne powierzchnie produktu

- Landing: https://getkangur.com  
- API staging: https://staging-api.getkangur.com  
- API prod: https://api.getkangur.com  

---

## Epilog — jak AI powinno używać tego pliku

1. Najpierw ustal **pytanie** (produkt / biznes / architektura / AI / ops).  
2. Czytaj odpowiednią sekcję; przy konflikcie zajrzyj do [§16](#16-known-inconsistencies-niespójności-dokumentacji-vs-kod).  
3. Nie wynajduj metryk, cen live Stripe, statusu store production ani danych prawnych firmy — oznacz jako **NIEUDokumentOWANE**.  
4. Preferuj **as-built 1.0.2** nad aspiracjami PRD z 16.07, chyba że pytanie dotyczy oryginalnej intencji.  
5. To, co „nigdy nie powinno się zmienić”, jest w §4.4, §15.4 i Decision Log — zmieniaj tylko świadomie i aktualizuj ten dokument.

---

*Koniec PROJECT_CONTEXT.md — Kangur. Aktualizuj przy każdej istotnej zmianie konstytucyjnej (model monetyzacji, tenancy, klin produktu, stack fundamentów, niespójności rozstrzygnięte).*
