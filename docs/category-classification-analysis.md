# Analiza jakości klasyfikacji kategorii AI

**Zakres:** wyłącznie przypisywanie `category` (nie normalizacja nazw).  
**Status:** gotowy do implementacji.

**Decyzje zamknięte (final):**

| Temat | Decyzja |
| --- | --- |
| Nowe kategorie | `pantry` + `spices` + `sauces` |
| Olej / oliwa | `other` — **CategoryCorrections** (wyjątek biznesowy) |
| Kolejność wdrożenia | **1 Prompt → 2 Enum → 3 Corrections → 4 Eval suite (osobny milestone)** |
| CategoryCorrections | Tylko wyjątki biznesowe / decyzje produktu — **nigdy** naprawa błędów AI; **tylko** zmiana `category` |
| AI errors (mąka, makaron, passata, melon, piwo…) | **Prompt + Shopping Categories Eval** — bez lokalnych reguł na nazwie |
| Eval suite | Nazwa: **Shopping Categories Eval**; kolejny milestone po MVP jakości |
| Prompt examples | Locale-agnostic aisle rules + **przykłady w języku outputu AI** |

---

## Category Design Principles

1. Kategorie = alejki sklepu, nie klasyfikacja biologiczna ani kulinarna.
2. **Kategorie mają wspierać szybkie zakupy.** Nie muszą odpowiadać oficjalnym kategoriom producentów ani sieci sklepów.
3. Jeden domyślny aisle na produkt w aplikacji — nawet jeśli w różnych sieciach leży inaczej.
4. Mała liczba kategorii — nową dodajemy tylko gdy znacząco zmniejsza `other` **i** odpowiada realnej alejce.
5. Przy niejednoznaczności: **spójność > „obiektywna poprawność”**.
6. `other` = „nie umiem zaklasyfikować” / non-grocery. Wyjątki biznesowe **nie** uczymy w prompcie — CategoryCorrections.
7. Locale-agnostic aisle thinking; przykłady w promptach **zawsze w bieżącym języku outputu AI**.
8. CategoryCorrections zmieniają **wyłącznie** `category` — nigdy `name` / `amount` / `note` / quantity / jednostki.
9. CategoryCorrections = wyjątki biznesowe, nie drugi classifier AI; każda reguła ↔ fixture w Shopping Categories Eval.

---

## Kontekst ilościowy

| Env | Item rows | `other` rows | `other` distinct | Share `other` |
| --- | ---: | ---: | ---: | ---: |
| development | 328 | 67 | 38 | ~20% |
| staging | 575 | 171 | 74 | ~30% |

---

## A. Docelowy model alejki

| Kategoria | Sens | Z eksportu | Dodać? |
| --- | --- | --- | --- |
| `pantry` | suchy prowiant | mąka, ryż, makaron, drożdże, cukier, kakao, płatki, buliony, bułka tarta… | **Tak** |
| `spices` | przyprawy | sól, pieprz, oregano, suszone zioła… | **Tak** |
| `sauces` | sosy / słoiki | pesto, passata, sos pomidorowy, sojowy, musztarda… | **Tak** |
| `oils` | za mało SKU | — | **Nie** |
| olej/oliwa → `other` | decyzja UX | via CategoryCorrections | **Locked** |

Szacunek staging: `other` z ~30% → ~5–6% item rows (w tym świadomie oleje).

**Granice aisle (dla promptów):** świeże zioła→vegetables / suszone→spices; masło→dairy; oliwki→vegetables; passata→sauces; sól→spices; bułka tarta→pantry; tofu bez hardcode.

---

## Analiza danych (skrót)

- Multi-cat / błędy AI (makaron→bakery, mąka→vegetables, passata→vegetables, melon→vegetables, piwo→drinks): naprawia **prompt + eval**, nie Corrections.
- Olej w `other`: wyjątek biznesowy — **Corrections**.
- Przyczyny: brak aisle’ów; cienki prompt; rzadkie halucynacje; brak psującej logiki app.

---

## 5. CATEGORY RULES (prompt)

Shared we wszystkich builderach.

**Wiodące (locale-agnostic):**

- *Think in terms of supermarket aisles rather than food taxonomy.*
- *Choose the category based on where shoppers would typically look for the product in a supermarket.*

**Bez** odniesień do kraju / sieci.

**Przykłady** (flour / pasta / breadcrumbs / beer…) zawsze w **języku outputu AI** (PL→Mąka, EN→Flour, DE→Mehl, …) — ten sam mechanizm co reszta i18n promptów.

Reguły:

1. Aisle thinking.
2. Prefer aisle over `other`. `other` = cannot classify / non-grocery **only** — nie uczyć modelu „oils ∈ other”.
3. `alcohol` for beer/wine/spirits — never `drinks`.
4. `bakery` = bread/rolls/tortillas/dough — NOT pasta, flour, breadcrumbs, yeast.
5. `pantry` = flour, rice, pasta, oats, sugar, cocoa, yeast, baking powder, broth, instant noodles, breadcrumbs.
6. `spices` = salt, pepper, dried herbs, spice paprika.
7. `sauces` = pesto, passata, tomato sauce/concentrate, soy, mustard, jar sauces.
8. Fresh herbs → vegetables; dried → spices.
9. DIY vs household; sugar ≠ household.
10. Ambiguous (tofu): best aisle guess; consistency over invented truth.

---

## 6. CategoryCorrections — filozofia (zmieniona)

### Co wolno

- Wyłącznie **`(aiCategory, name?) → finalCategory`**
- Nigdy nie modyfikuje: `name`, `amount`, `note`, quantity, jednostek
- Wyłącznie **wyjątki biznesowe / świadome decyzje produktu**
- Matching: `exact` | `startsWith` (gdy potrzebne); **zakaz `contains`**
- Skala: **bardzo mała** (rzędu 1–5 reguł biznesowych), nie lista napraw AI

### Czego nie wolno

- Naprawiać błędów modelu na podstawie lokalnych nazw (`mąka`→pantry, `makaron`→pantry, `passata`→sauces, `melon`→fruit, `piwo`→alcohol) — to **łamie wielojęzyczność** i tworzy ukryty classifier PL-only
- Rozrastać się w słownik 10 locale × setki synonimów

### MVP whitelist (biznesowa)

| Cel biznesowy | Podejście | Korekta |
| --- | --- | --- |
| Olej / oliwa zawsze `other` | Mały **zamknięty** zestaw synonymów oleju we wspieranych językach outputu (jedyny dozwolony mini-słownik — wyjątek produktowy, nie „AI fix catalog”) | → `other` |

Reszta jakości: **prompt + Shopping Categories Eval**.

Jeśli w przyszłości pojawi się potrzeba korekt semantycznych niezależnych od języka — rozważyć `concept` w kontrakcie AI (poza MVP); nie budować PL-only text rules.

**Zasada:** każda reguła Corrections ↔ fixture w Shopping Categories Eval (ten sam PR).

---

## 7. Structured logs

```json
{
  "product": "Makaron spaghetti",
  "aiCategory": "bakery",
  "finalCategory": "pantry",
  "corrected": false,
  "correctionRule": null,
  "confidence": 0.98
}
```

Gdy correction zadziała (np. olej):

```json
{
  "product": "Oliwa z oliwek",
  "aiCategory": "pantry",
  "finalCategory": "other",
  "corrected": true,
  "correctionRule": "oil->other",
  "confidence": 0.91
}
```

Pola: `product`, `aiCategory`, `finalCategory`, `corrected`, `correctionRule` (string | null), opcjonalnie `confidence`.  
Cel: po miesiącach widać usage reguł (17k vs 2 → usunąć martwe).

Uwaga: gdy Corrections są tylko biznesowe, `corrected: true` będzie rzadkie; logi nadal pokazują pewne błędy AI (`corrected: false`, zła `aiCategory`) do poprawy promptów.

---

## 8. Milestone: Shopping Categories Eval

Nazwa: **Shopping Categories Eval** (spójnie z przyszłymi Meal Eval / OCR Eval / Suggest Eval).

**Nie blokuje MVP** — osobny milestone po Prompt+Enum+Corrections.

| Element | Opis |
| --- | --- |
| Scope | Setki fixture’ów wielojęzycznych: name (+ locale) → expectedCategory |
| Trigger | Zmiana CATEGORY RULES / enum / CategoryCorrections |
| Metryki | overall accuracy; other-reduction; confusion bakery↔pantry, vegetables↔sauces |
| Gate | brak regresji na obowiązkowych fixtures; Success Criteria poniżej |

Obowiązkowe case’y (wielojęzyczne gdzie sensowne): pasta≠bakery; melon≠vegetables; beer=alcohol; flour=pantry; passata=sauces; **oil/olive oil=other**; breadcrumbs=pantry; sugar≠household.

---

## Success Criteria

MVP / milestone uznajemy za domknięty gdy:

1. Udział `other` na staging spada z **~30% do <10%** item rows (re-eksport).
2. Wszystkie **obowiązkowe fixtures** Shopping Categories Eval przechodzą (gdy suite już istnieje).
3. **Brak regresji** na wcześniej poprawnych aisle’ach (fruit/dairy/meat/…).
4. Liczba reguł **CategoryCorrections ≤ 10** (cel MVP: ≪10, głównie oil→other).
5. Corrections **nie** zawierają language-dependent AI-fix rules na nazwach produktów.

---

## Ranking wdrożenia (final)

| # | Krok | Priorytet | Uwagi |
| --- | --- | --- | --- |
| **1** | CATEGORY RULES (aisle + localized examples) | **High / MVP** | Odblokowuje jakość od razu |
| **2** | Enum `pantry` + `spices` + `sauces` (+ i18n ×10, ikony, Prisma, aisle order) | **High / MVP** | |
| **3** | CategoryCorrections (tylko wyjątki biznesowe, oil→other) + logi z `correctionRule` | **High / MVP** | |
| **4** | **Shopping Categories Eval** (osobny milestone) | **High / next** | Nie blokuje MVP; największa wartość LT |
| 5 | Docs sync enum + Principles w docs | Medium | |
| — | oils aisle / olej w pantry / oils w prompt other / PL AI-fix corrections / majority history | Odrzucone | |

---

## Plan wdrożenia

**MVP (teraz):**

1. Raport → `docs/category-classification-analysis.md` (z Principles + Success Criteria).
2. Shared CATEGORY RULES + przykłady per AI output language.
3. Migrate enum `pantry` / `spices` / `sauces` + i18n + ikony.
4. CategoryCorrections: tylko oil→other (+ mini synonym list wspieranych locale) + structured logs.
5. Smoke / ręczne sprawdzenie staging.

**Next milestone:**

6. Shopping Categories Eval (setki case’ów, CI gate, Success Criteria).
7. Re-eksport staging vs Success Criteria (`other` < 10%).

---

## Poza zakresem

- Normalizacja nazw / singular↔plural
- M15; migracja historycznych DB rows
- `contains()`; CategoryCorrections jako AI classifier; słownik napraw AI × N locale
- `canonicalName` / `concept` w kontrakcie AI (możliwa przyszłość, nie MVP)
- Majority-from-history; tofu hardcode


