# Products × categories export

Generated: `2026-07-26T08:51:11.513Z`

Snapshot of distinct shopping-list products (`ShoppingItem`) with assigned categories from Neon environments used for local development and staging.

## Sources

| Label in this file | Neon branch | Notes |
| --- | --- | --- |
| **development** | `production` | Local `backend/.env` `DATABASE_URL` currently points here. There is **no** separate Neon `development` / `kangur-dev` branch. |
| **staging** | `staging` | Neon branch `br-delicate-resonance-as90c3z4`. |

## Method

- Source table: `ShoppingItem`
- Product key: `lower(trim(coalesce(nullif(normalizedName, ''), name)))`
- Display name: `MIN(name)` for that key+category
- Occurrences = item rows; Lists = distinct `listId`
- Closed enum (`shared/shopping-categories.ts`): `fruit`, `vegetables`, `dairy`, `meat`, `fish`, `bakery`, `frozen`, `drinks`, `alcohol`, `snacks`, `pantry`, `spices`, `sauces`, `household`, `cleaning`, `baby`, `pets`, `pharmacy`, `cosmetics`, `electronics`, `office`, `garden`, `diy`, `other`

## Quick signals for category optimization

- **Unused enum categories** (zero products in either env): `cleaning`, `baby`, `electronics`, `office`, `garden`
- **Same product key assigned to multiple categories** (across envs): **16** — see below.
- **`other` is large** (38 distinct on development, 74 on staging) — strong candidate for new categories (e.g. pantry / spices / dry goods / sauces).

### Products with multiple categories

| Product key | Categories |
| --- | --- |
| bułka | `bakery`, `other` |
| jabłka | `fruit`, `other` |
| jajka | `dairy`, `other` |
| kabanosy | `meat`, `other` |
| makaron lasagne | `bakery`, `other` |
| makaron spaghetti | `bakery`, `other` |
| masło | `dairy`, `other` |
| mąka pszenna | `vegetables`, `bakery`, `other` |
| mleko | `dairy`, `other` |
| oliwki czarne | `vegetables`, `other` |
| passata pomidorowa | `vegetables`, `other` |
| pieczywo | `bakery`, `other` |
| piwo | `drinks`, `alcohol`, `other` |
| rodzynki | `fruit`, `other` |
| sos pomidorowy | `vegetables`, `other` |
| ziemniaki | `vegetables`, `other` |

## Development

Queried via local `DATABASE_URL` (Neon endpoint `ep-bold-hill-aswcl1ei` = branch **production**).

**Totals:** 328 item rows · 160 distinct names · 16 categories used

### Category summary

| Category | Item rows | Distinct products |
| --- | ---: | ---: |
| `fruit` | 34 | 13 |
| `vegetables` | 40 | 26 |
| `dairy` | 71 | 26 |
| `meat` | 38 | 22 |
| `fish` | 4 | 4 |
| `bakery` | 14 | 7 |
| `frozen` | 2 | 2 |
| `drinks` | 4 | 2 |
| `alcohol` | 4 | 2 |
| `snacks` | 20 | 8 |
| `household` | 17 | 4 |
| `pets` | 1 | 1 |
| `pharmacy` | 6 | 3 |
| `cosmetics` | 1 | 1 |
| `diy` | 5 | 5 |
| `other` | 67 | 38 |

### Products by category

#### `fruit`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Banan | 8 | 8 |
| Jabłka | 7 | 7 |
| Cytryna | 6 | 6 |
| Borówki | 2 | 2 |
| Maliny | 2 | 2 |
| Rodzynki | 2 | 2 |
| Banany | 1 | 1 |
| Borówka | 1 | 1 |
| Cytryny | 1 | 1 |
| Jabłko | 1 | 1 |
| Malina | 1 | 1 |
| Pomidorki | 1 | 1 |
| Śliwka | 1 | 1 |
#### `vegetables`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Pomidorki koktajlowe | 7 | 7 |
| Cebula | 4 | 4 |
| Groszek | 2 | 2 |
| Groszek z marchewką | 2 | 2 |
| Papryka | 2 | 2 |
| passata pomidorowa | 2 | 2 |
| Pomidor | 2 | 2 |
| Bazylia | 1 | 1 |
| Buraki gotowane | 1 | 1 |
| Cebula czerwona | 1 | 1 |
| Cebula zwykła | 1 | 1 |
| czosnek | 1 | 1 |
| Groch łuskany | 1 | 1 |
| melon | 1 | 1 |
| Ogórek | 1 | 1 |
| Papryka czerwona | 1 | 1 |
| Pieczarki | 1 | 1 |
| Pietruszka | 1 | 1 |
| Pietruszka korzeń | 1 | 1 |
| Pomidory | 1 | 1 |
| Por | 1 | 1 |
| Sałata | 1 | 1 |
| Seler | 1 | 1 |
| Surówka | 1 | 1 |
| Szpinak świeży | 1 | 1 |
| Warzywa | 1 | 1 |
#### `dairy`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Jogurt | 9 | 9 |
| Mleko | 9 | 9 |
| Jajka | 7 | 7 |
| Ser żółty | 6 | 6 |
| Masło | 5 | 5 |
| Ser | 5 | 5 |
| Monte | 3 | 3 |
| Ser wiejski | 3 | 3 |
| Serek wiejski | 3 | 3 |
| Jaja kurze | 2 | 2 |
| Jogurt naturalny | 2 | 2 |
| Ser mozzarella | 2 | 2 |
| Serek śmietankowy | 2 | 2 |
| Białko jaja kurzego | 1 | 1 |
| cheese | 1 | 1 |
| jajko | 1 | 1 |
| Jogurt pitny | 1 | 1 |
| milk | 1 | 1 |
| Mozzarella | 1 | 1 |
| Ser parmezan | 1 | 1 |
| Ser żółty z dziurami | 1 | 1 |
| Serki wiejskie | 1 | 1 |
| śmietana 18% | 1 | 1 |
| Śmietanka | 1 | 1 |
| Twaróg | 1 | 1 |
| yogurt | 1 | 1 |
#### `meat`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Kiełbasa | 5 | 5 |
| Pierś z kurczaka | 4 | 4 |
| Szynka | 4 | 4 |
| Boczek wędzony | 2 | 2 |
| Filet z kurczaka | 2 | 2 |
| Kabanosy | 2 | 2 |
| Karkówka | 2 | 2 |
| Mięso mielone | 2 | 2 |
| Wędlina | 2 | 2 |
| ham | 1 | 1 |
| Kaczka | 1 | 1 |
| Kiełbasa grillowa | 1 | 1 |
| Kiełbasa podwędzana | 1 | 1 |
| Kurczak | 1 | 1 |
| mielona wieprzowina | 1 | 1 |
| mielona wołowina | 1 | 1 |
| mięso mielone wieprzowe | 1 | 1 |
| Mięso mielone z indyka | 1 | 1 |
| szynka gotowana | 1 | 1 |
| Wędzony boczek | 1 | 1 |
| Wolowina | 1 | 1 |
| Wołowina na bitki | 1 | 1 |
#### `fish`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Krewetki | 1 | 1 |
| Łosoś | 1 | 1 |
| Łosoś na kanapkę | 1 | 1 |
| Śledź w sosie koperkowym | 1 | 1 |
#### `bakery`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Pieczywo | 7 | 7 |
| Chleb | 2 | 2 |
| bread | 1 | 1 |
| Bułka | 1 | 1 |
| Bułka z ziarnami | 1 | 1 |
| makaron spaghetti | 1 | 1 |
| Tortilla | 1 | 1 |
#### `frozen`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Frytki mrożone | 1 | 1 |
| pyzy ziemniaczane | 1 | 1 |
#### `drinks`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Kawa | 3 | 3 |
| Woda mineralna | 1 | 1 |
#### `alcohol`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Piwo | 3 | 3 |
| Whisky | 1 | 1 |
#### `snacks`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Czekolada gorzka | 5 | 5 |
| Żelki | 5 | 5 |
| Chrupki | 4 | 4 |
| Chrupki Cheetos | 2 | 2 |
| Chipsy | 1 | 1 |
| Chrupki serowe | 1 | 1 |
| Cukierki | 1 | 1 |
| Słodycze | 1 | 1 |
#### `household`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Papier toaletowy | 10 | 10 |
| Ręczniki papierowe | 5 | 5 |
| Cukier biały | 1 | 1 |
| Płytki | 1 | 1 |
#### `pets`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Karma dla psów | 1 | 1 |
#### `pharmacy`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Altacet | 2 | 2 |
| Utrogestan | 2 | 2 |
| Wazelina | 2 | 2 |
#### `cosmetics`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Dezodorant | 1 | 1 |
#### `diy`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Klej gipsowy | 1 | 1 |
| Krzyżaki do płytek | 1 | 1 |
| Profil CD | 1 | 1 |
| Śruba | 1 | 1 |
| Wkręty do drewna | 1 | 1 |
#### `other`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Mąka pszenna | 8 | 8 |
| Oliwa z oliwek | 8 | 8 |
| Kakao | 6 | 6 |
| Sos pesto | 5 | 5 |
| Coś słodkiego | 2 | 2 |
| Makaron | 2 | 2 |
| Makaron spaghetti | 2 | 2 |
| Passata pomidorowa | 2 | 2 |
| Ryż | 2 | 2 |
| sól | 2 | 2 |
| bazylia suszona | 1 | 1 |
| Bulion warzywny | 1 | 1 |
| Bulion wołowy | 1 | 1 |
| Cukier | 1 | 1 |
| drożdże świeże | 1 | 1 |
| eggs | 1 | 1 |
| Jajka | 1 | 1 |
| Karta na 3 dni | 1 | 1 |
| Kartka urodzinowa | 1 | 1 |
| Liść laurowy | 1 | 1 |
| Musztarda dijon | 1 | 1 |
| Papryka ostra | 1 | 1 |
| Papryka słodka | 1 | 1 |
| pieprz | 1 | 1 |
| pieprz czarny mielony | 1 | 1 |
| Płatki | 1 | 1 |
| Płatki owsiane | 1 | 1 |
| Proszek do pieczenia | 1 | 1 |
| Przyprawy | 1 | 1 |
| Risotto | 1 | 1 |
| rodzynki | 1 | 1 |
| Ryż do risotto | 1 | 1 |
| Sos | 1 | 1 |
| Sos ciemny | 1 | 1 |
| Sos pomidorowy | 1 | 1 |
| Sos słodki | 1 | 1 |
| Zapiekanka | 1 | 1 |
| Ziele angielskie | 1 | 1 |

## Staging

**Totals:** 575 item rows · 226 distinct names · 16 categories used

### Category summary

| Category | Item rows | Distinct products |
| --- | ---: | ---: |
| `fruit` | 41 | 18 |
| `vegetables` | 82 | 38 |
| `dairy` | 109 | 29 |
| `meat` | 60 | 27 |
| `fish` | 6 | 4 |
| `bakery` | 34 | 18 |
| `frozen` | 3 | 3 |
| `drinks` | 11 | 6 |
| `alcohol` | 7 | 3 |
| `snacks` | 22 | 9 |
| `household` | 16 | 3 |
| `pets` | 1 | 1 |
| `pharmacy` | 6 | 3 |
| `cosmetics` | 1 | 1 |
| `diy` | 5 | 5 |
| `other` | 171 | 74 |

### Products by category

#### `fruit`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Banan | 7 | 7 |
| Cytryna | 6 | 6 |
| Jabłka | 6 | 6 |
| Borówki | 3 | 3 |
| Maliny | 3 | 3 |
| Rodzynki | 3 | 3 |
| Owoce | 2 | 2 |
| Arbuz | 1 | 1 |
| Awokado | 1 | 1 |
| Banany | 1 | 1 |
| Borówka | 1 | 1 |
| Cytryny | 1 | 1 |
| Jabłko | 1 | 1 |
| Malina | 1 | 1 |
| Pomidorki | 1 | 1 |
| Sok z limonki | 1 | 1 |
| Śliwka | 1 | 1 |
| Truskawki | 1 | 1 |
#### `vegetables`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Pomidorki koktajlowe | 9 | 9 |
| Pieczarki | 7 | 7 |
| Ziemniaki | 7 | 6 |
| Cebula | 6 | 6 |
| Bazylia świeża | 3 | 3 |
| Groszek | 3 | 3 |
| Papryka | 3 | 3 |
| Sos pomidorowy | 3 | 3 |
| Czosnek | 2 | 2 |
| Groszek z marchewką | 2 | 2 |
| Marchew | 2 | 2 |
| Ogórek | 2 | 2 |
| Papryka czerwona | 2 | 2 |
| Pieczarki świeże | 2 | 2 |
| Pomidor | 2 | 2 |
| Pomidory | 2 | 2 |
| Pomidory krojone w puszce | 2 | 2 |
| Sałata | 2 | 2 |
| Seler korzeń | 2 | 2 |
| Bazylia | 1 | 1 |
| Cebula czerwona | 1 | 1 |
| Cebula dymka | 1 | 1 |
| Cebula zwykła | 1 | 1 |
| Kiełki fasoli mung | 1 | 1 |
| Koncentrat pomidorowy | 1 | 1 |
| Mąka pszenna | 1 | 1 |
| melon | 1 | 1 |
| Ogórki kiszone | 1 | 1 |
| Oliwki czarne | 1 | 1 |
| Pietruszka | 1 | 1 |
| Por | 1 | 1 |
| Sałata lodowa | 1 | 1 |
| Sałata rzymska | 1 | 1 |
| Seler | 1 | 1 |
| Surówka | 1 | 1 |
| Szczypiorek | 1 | 1 |
| Warzywa | 1 | 1 |
| Włoszczyzna | 1 | 1 |
#### `dairy`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Mleko | 14 | 14 |
| Jajka | 12 | 12 |
| Ser żółty | 11 | 11 |
| Jogurt | 10 | 10 |
| Masło | 10 | 10 |
| Ser mozzarella | 9 | 9 |
| Ser | 5 | 5 |
| Serek wiejski | 5 | 5 |
| Serek śmietankowy | 4 | 4 |
| Jogurt naturalny | 3 | 3 |
| Ser parmezan | 3 | 3 |
| Jaja kurze | 2 | 2 |
| Milk | 2 | 2 |
| Monte | 2 | 2 |
| Ser wiejski | 2 | 2 |
| Serki wiejskie | 2 | 2 |
| cheese | 1 | 1 |
| Halloumi | 1 | 1 |
| Jogurt truskawkowy | 1 | 1 |
| Mleko ryżowe | 1 | 1 |
| Mozzarella | 1 | 1 |
| Ser do smarowania | 1 | 1 |
| Ser mozzarella light | 1 | 1 |
| Ser żółty z dziurami | 1 | 1 |
| Śmietana 18% | 1 | 1 |
| Śmietanka | 1 | 1 |
| Twaróg | 1 | 1 |
| Twaróg półtłusty | 1 | 1 |
| yogurt | 1 | 1 |
#### `meat`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Szynka | 11 | 11 |
| Pierś z kurczaka | 9 | 9 |
| Kiełbasa | 5 | 5 |
| Mięso mielone | 4 | 4 |
| Mięso mielone wołowe | 3 | 3 |
| Boczek wędzony | 2 | 2 |
| Kabanosy | 2 | 2 |
| Karkówka | 2 | 2 |
| Mięso | 2 | 2 |
| Mięso mielone wieprzowe | 2 | 2 |
| Wędlina | 2 | 2 |
| Boczek | 1 | 1 |
| ham | 1 | 1 |
| Kiełbasa podwędzana | 1 | 1 |
| Kura | 1 | 1 |
| Kurczak | 1 | 1 |
| Mięso mielone z indyka | 1 | 1 |
| Parówki | 1 | 1 |
| Podudzia z kurczaka | 1 | 1 |
| Schab wieprzowy | 1 | 1 |
| Schab wieprzowy bez kości | 1 | 1 |
| Schabowy | 1 | 1 |
| Szynka gotowana | 1 | 1 |
| Szynka konserwowa | 1 | 1 |
| Szynka z indyka | 1 | 1 |
| Tofu | 1 | 1 |
| Wolowina | 1 | 1 |
#### `fish`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Łosoś | 3 | 3 |
| Krewetki | 1 | 1 |
| Łosoś na kanapkę | 1 | 1 |
| Śledź w sosie koperkowym | 1 | 1 |
#### `bakery`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Pieczywo | 8 | 8 |
| Mąka pszenna | 6 | 6 |
| Bread | 2 | 2 |
| Bułka tarta | 2 | 2 |
| Chleb | 2 | 2 |
| Makaron spaghetti | 2 | 2 |
| Bułka | 1 | 1 |
| Bułka z ziarnami | 1 | 1 |
| Bułki | 1 | 1 |
| Ciasto na pizzę | 1 | 1 |
| Ciasto na pizzę pełnoziarniste | 1 | 1 |
| Grzanki | 1 | 1 |
| Makaron lasagne | 1 | 1 |
| Makaron nitki | 1 | 1 |
| Makaron ramen | 1 | 1 |
| Makaron ryżowy | 1 | 1 |
| Tortilla | 1 | 1 |
| Tortilla pszenna | 1 | 1 |
#### `frozen`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Frytki | 1 | 1 |
| Frytki mrożone | 1 | 1 |
| Lody rożki | 1 | 1 |
#### `drinks`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Kawa | 3 | 3 |
| Woda mineralna niegazowana | 3 | 3 |
| Woda mineralna | 2 | 2 |
| Herbata melisa | 1 | 1 |
| Piwo | 1 | 1 |
| Woda niegazowana | 1 | 1 |
#### `alcohol`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Piwo | 5 | 5 |
| Beer | 1 | 1 |
| Wódka | 1 | 1 |
#### `snacks`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Czekolada gorzka | 5 | 5 |
| Żelki | 5 | 5 |
| Chrupki | 4 | 4 |
| Chrupki Cheetos | 2 | 2 |
| Cukierki | 2 | 2 |
| Chipsy | 1 | 1 |
| Chrupki serowe | 1 | 1 |
| Orzeszki ziemne | 1 | 1 |
| Paluszki | 1 | 1 |
#### `household`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Papier toaletowy | 10 | 10 |
| Ręczniki papierowe | 5 | 5 |
| Płytki | 1 | 1 |
#### `pets`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Karma dla psów | 1 | 1 |
#### `pharmacy`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Altacet | 2 | 2 |
| Utrogestan | 2 | 2 |
| Wazelina | 2 | 2 |
#### `cosmetics`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Dezodorant | 1 | 1 |
#### `diy`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Klej gipsowy | 1 | 1 |
| Krzyżaki do płytek | 1 | 1 |
| Profil CD | 1 | 1 |
| Śruba | 1 | 1 |
| Wkręty do drewna | 1 | 1 |
#### `other`

| Product | Occurrences | Lists |
| --- | ---: | ---: |
| Oliwa z oliwek | 13 | 13 |
| Mąka pszenna | 11 | 11 |
| Drożdże świeże | 8 | 8 |
| Sól | 7 | 7 |
| Kakao | 5 | 5 |
| Ryż | 5 | 5 |
| Sos pesto | 5 | 5 |
| Sos pomidorowy | 5 | 5 |
| Makaron | 4 | 4 |
| Olej roślinny | 4 | 4 |
| Pieprz czarny mielony | 4 | 4 |
| Makaron spaghetti | 3 | 3 |
| Passata pomidorowa | 3 | 3 |
| Woda | 3 | 3 |
| Bułka | 2 | 2 |
| Ciastka mafijne | 2 | 2 |
| Coś słodkiego | 2 | 2 |
| Deska serów | 2 | 2 |
| Eggs | 2 | 2 |
| Jabłka | 2 | 2 |
| Jogurty | 2 | 2 |
| Kabanosy | 2 | 2 |
| Kiełbasa 8szt | 2 | 2 |
| Masło | 2 | 2 |
| Mięso mielone 1kg | 2 | 2 |
| Mleko | 2 | 2 |
| Nachosy | 2 | 2 |
| Ogorki | 2 | 2 |
| Olej | 2 | 2 |
| Oliwki czarne | 2 | 2 |
| Oregano suszone | 2 | 2 |
| Papryczki | 2 | 2 |
| Pieczywo | 2 | 2 |
| Piwo | 2 | 2 |
| Salami | 2 | 2 |
| Schab 1,5kg w całości | 2 | 2 |
| Ser żółty kostka | 2 | 2 |
| Ser żółty w plastrach | 2 | 2 |
| Sok | 2 | 2 |
| Sok cytrynowy | 2 | 2 |
| Sos | 2 | 2 |
| Sos sojowy | 2 | 2 |
| Winogron | 2 | 2 |
| Zielony pieprz | 2 | 2 |
| Ziemniaki | 2 | 2 |
| Bazylia suszona | 1 | 1 |
| Bialko | 1 | 1 |
| Bulion drobiowy | 1 | 1 |
| Bulion warzywny lub kostka rosołowa | 1 | 1 |
| Cukier | 1 | 1 |
| Drożdże instant | 1 | 1 |
| Drożdże świeże lub suszone | 1 | 1 |
| Karta na 3 dni | 1 | 1 |
| Kartka urodzinowa | 1 | 1 |
| Makaron lasagne | 1 | 1 |
| Musztarda dijon | 1 | 1 |
| Olejek roślinny | 1 | 1 |
| Oliwa | 1 | 1 |
| Papryka ostra | 1 | 1 |
| Papryka słodka | 1 | 1 |
| Pieprz czarny | 1 | 1 |
| Płatki owsiane | 1 | 1 |
| Przyprawy | 1 | 1 |
| Risotto | 1 | 1 |
| rodzynki | 1 | 1 |
| Ser żółty plastry | 1 | 1 |
| Sos Cezar | 1 | 1 |
| Sos ciemny | 1 | 1 |
| Sos pomidorowy bez cukru | 1 | 1 |
| Sos pomidorowy do pizzy | 1 | 1 |
| Sos słodki | 1 | 1 |
| Wędliny dwa rodzaje | 1 | 1 |
| Zapiekanka | 1 | 1 |
| Zupki chińskie | 1 | 1 |

## Combined unique products (both envs)

One row per `(product key, category)`. Useful as the input list for the next optimization pass.

| Product | Category | Dev occurrences | Staging occurrences | Total |
| --- | --- | ---: | ---: | ---: |
| Banan | `fruit` | 8 | 7 | 15 |
| Jabłka | `fruit` | 7 | 6 | 13 |
| Cytryna | `fruit` | 6 | 6 | 12 |
| Borówki | `fruit` | 2 | 3 | 5 |
| Maliny | `fruit` | 2 | 3 | 5 |
| Rodzynki | `fruit` | 2 | 3 | 5 |
| Banany | `fruit` | 1 | 1 | 2 |
| Borówka | `fruit` | 1 | 1 | 2 |
| Cytryny | `fruit` | 1 | 1 | 2 |
| Jabłko | `fruit` | 1 | 1 | 2 |
| Malina | `fruit` | 1 | 1 | 2 |
| Owoce | `fruit` | 0 | 2 | 2 |
| Pomidorki | `fruit` | 1 | 1 | 2 |
| Śliwka | `fruit` | 1 | 1 | 2 |
| Arbuz | `fruit` | 0 | 1 | 1 |
| Awokado | `fruit` | 0 | 1 | 1 |
| Sok z limonki | `fruit` | 0 | 1 | 1 |
| Truskawki | `fruit` | 0 | 1 | 1 |
| Pomidorki koktajlowe | `vegetables` | 7 | 9 | 16 |
| Cebula | `vegetables` | 4 | 6 | 10 |
| Pieczarki | `vegetables` | 1 | 7 | 8 |
| Ziemniaki | `vegetables` | 0 | 7 | 7 |
| Groszek | `vegetables` | 2 | 3 | 5 |
| Papryka | `vegetables` | 2 | 3 | 5 |
| Groszek z marchewką | `vegetables` | 2 | 2 | 4 |
| Pomidor | `vegetables` | 2 | 2 | 4 |
| Bazylia świeża | `vegetables` | 0 | 3 | 3 |
| czosnek | `vegetables` | 1 | 2 | 3 |
| Ogórek | `vegetables` | 1 | 2 | 3 |
| Papryka czerwona | `vegetables` | 1 | 2 | 3 |
| Pomidory | `vegetables` | 1 | 2 | 3 |
| Sałata | `vegetables` | 1 | 2 | 3 |
| Sos pomidorowy | `vegetables` | 0 | 3 | 3 |
| Bazylia | `vegetables` | 1 | 1 | 2 |
| Cebula czerwona | `vegetables` | 1 | 1 | 2 |
| Cebula zwykła | `vegetables` | 1 | 1 | 2 |
| Marchew | `vegetables` | 0 | 2 | 2 |
| melon | `vegetables` | 1 | 1 | 2 |
| passata pomidorowa | `vegetables` | 2 | 0 | 2 |
| Pieczarki świeże | `vegetables` | 0 | 2 | 2 |
| Pietruszka | `vegetables` | 1 | 1 | 2 |
| Pomidory krojone w puszce | `vegetables` | 0 | 2 | 2 |
| Por | `vegetables` | 1 | 1 | 2 |
| Seler | `vegetables` | 1 | 1 | 2 |
| Seler korzeń | `vegetables` | 0 | 2 | 2 |
| Surówka | `vegetables` | 1 | 1 | 2 |
| Warzywa | `vegetables` | 1 | 1 | 2 |
| Buraki gotowane | `vegetables` | 1 | 0 | 1 |
| Cebula dymka | `vegetables` | 0 | 1 | 1 |
| Groch łuskany | `vegetables` | 1 | 0 | 1 |
| Kiełki fasoli mung | `vegetables` | 0 | 1 | 1 |
| Koncentrat pomidorowy | `vegetables` | 0 | 1 | 1 |
| Mąka pszenna | `vegetables` | 0 | 1 | 1 |
| Ogórki kiszone | `vegetables` | 0 | 1 | 1 |
| Oliwki czarne | `vegetables` | 0 | 1 | 1 |
| Pietruszka korzeń | `vegetables` | 1 | 0 | 1 |
| Sałata lodowa | `vegetables` | 0 | 1 | 1 |
| Sałata rzymska | `vegetables` | 0 | 1 | 1 |
| Szczypiorek | `vegetables` | 0 | 1 | 1 |
| Szpinak świeży | `vegetables` | 1 | 0 | 1 |
| Włoszczyzna | `vegetables` | 0 | 1 | 1 |
| Mleko | `dairy` | 9 | 14 | 23 |
| Jajka | `dairy` | 7 | 12 | 19 |
| Jogurt | `dairy` | 9 | 10 | 19 |
| Ser żółty | `dairy` | 6 | 11 | 17 |
| Masło | `dairy` | 5 | 10 | 15 |
| Ser mozzarella | `dairy` | 2 | 9 | 11 |
| Ser | `dairy` | 5 | 5 | 10 |
| Serek wiejski | `dairy` | 3 | 5 | 8 |
| Serek śmietankowy | `dairy` | 2 | 4 | 6 |
| Jogurt naturalny | `dairy` | 2 | 3 | 5 |
| Monte | `dairy` | 3 | 2 | 5 |
| Ser wiejski | `dairy` | 3 | 2 | 5 |
| Jaja kurze | `dairy` | 2 | 2 | 4 |
| Ser parmezan | `dairy` | 1 | 3 | 4 |
| milk | `dairy` | 1 | 2 | 3 |
| Serki wiejskie | `dairy` | 1 | 2 | 3 |
| cheese | `dairy` | 1 | 1 | 2 |
| Mozzarella | `dairy` | 1 | 1 | 2 |
| Ser żółty z dziurami | `dairy` | 1 | 1 | 2 |
| śmietana 18% | `dairy` | 1 | 1 | 2 |
| Śmietanka | `dairy` | 1 | 1 | 2 |
| Twaróg | `dairy` | 1 | 1 | 2 |
| yogurt | `dairy` | 1 | 1 | 2 |
| Białko jaja kurzego | `dairy` | 1 | 0 | 1 |
| Halloumi | `dairy` | 0 | 1 | 1 |
| jajko | `dairy` | 1 | 0 | 1 |
| Jogurt pitny | `dairy` | 1 | 0 | 1 |
| Jogurt truskawkowy | `dairy` | 0 | 1 | 1 |
| Mleko ryżowe | `dairy` | 0 | 1 | 1 |
| Ser do smarowania | `dairy` | 0 | 1 | 1 |
| Ser mozzarella light | `dairy` | 0 | 1 | 1 |
| Twaróg półtłusty | `dairy` | 0 | 1 | 1 |
| Szynka | `meat` | 4 | 11 | 15 |
| Pierś z kurczaka | `meat` | 4 | 9 | 13 |
| Kiełbasa | `meat` | 5 | 5 | 10 |
| Mięso mielone | `meat` | 2 | 4 | 6 |
| Boczek wędzony | `meat` | 2 | 2 | 4 |
| Kabanosy | `meat` | 2 | 2 | 4 |
| Karkówka | `meat` | 2 | 2 | 4 |
| Wędlina | `meat` | 2 | 2 | 4 |
| mięso mielone wieprzowe | `meat` | 1 | 2 | 3 |
| Mięso mielone wołowe | `meat` | 0 | 3 | 3 |
| Filet z kurczaka | `meat` | 2 | 0 | 2 |
| ham | `meat` | 1 | 1 | 2 |
| Kiełbasa podwędzana | `meat` | 1 | 1 | 2 |
| Kurczak | `meat` | 1 | 1 | 2 |
| Mięso | `meat` | 0 | 2 | 2 |
| Mięso mielone z indyka | `meat` | 1 | 1 | 2 |
| szynka gotowana | `meat` | 1 | 1 | 2 |
| Wolowina | `meat` | 1 | 1 | 2 |
| Boczek | `meat` | 0 | 1 | 1 |
| Kaczka | `meat` | 1 | 0 | 1 |
| Kiełbasa grillowa | `meat` | 1 | 0 | 1 |
| Kura | `meat` | 0 | 1 | 1 |
| mielona wieprzowina | `meat` | 1 | 0 | 1 |
| mielona wołowina | `meat` | 1 | 0 | 1 |
| Parówki | `meat` | 0 | 1 | 1 |
| Podudzia z kurczaka | `meat` | 0 | 1 | 1 |
| Schab wieprzowy | `meat` | 0 | 1 | 1 |
| Schab wieprzowy bez kości | `meat` | 0 | 1 | 1 |
| Schabowy | `meat` | 0 | 1 | 1 |
| Szynka konserwowa | `meat` | 0 | 1 | 1 |
| Szynka z indyka | `meat` | 0 | 1 | 1 |
| Tofu | `meat` | 0 | 1 | 1 |
| Wędzony boczek | `meat` | 1 | 0 | 1 |
| Wołowina na bitki | `meat` | 1 | 0 | 1 |
| Łosoś | `fish` | 1 | 3 | 4 |
| Krewetki | `fish` | 1 | 1 | 2 |
| Łosoś na kanapkę | `fish` | 1 | 1 | 2 |
| Śledź w sosie koperkowym | `fish` | 1 | 1 | 2 |
| Pieczywo | `bakery` | 7 | 8 | 15 |
| Mąka pszenna | `bakery` | 0 | 6 | 6 |
| Chleb | `bakery` | 2 | 2 | 4 |
| bread | `bakery` | 1 | 2 | 3 |
| makaron spaghetti | `bakery` | 1 | 2 | 3 |
| Bułka | `bakery` | 1 | 1 | 2 |
| Bułka tarta | `bakery` | 0 | 2 | 2 |
| Bułka z ziarnami | `bakery` | 1 | 1 | 2 |
| Tortilla | `bakery` | 1 | 1 | 2 |
| Bułki | `bakery` | 0 | 1 | 1 |
| Ciasto na pizzę | `bakery` | 0 | 1 | 1 |
| Ciasto na pizzę pełnoziarniste | `bakery` | 0 | 1 | 1 |
| Grzanki | `bakery` | 0 | 1 | 1 |
| Makaron lasagne | `bakery` | 0 | 1 | 1 |
| Makaron nitki | `bakery` | 0 | 1 | 1 |
| Makaron ramen | `bakery` | 0 | 1 | 1 |
| Makaron ryżowy | `bakery` | 0 | 1 | 1 |
| Tortilla pszenna | `bakery` | 0 | 1 | 1 |
| Frytki mrożone | `frozen` | 1 | 1 | 2 |
| Frytki | `frozen` | 0 | 1 | 1 |
| Lody rożki | `frozen` | 0 | 1 | 1 |
| pyzy ziemniaczane | `frozen` | 1 | 0 | 1 |
| Kawa | `drinks` | 3 | 3 | 6 |
| Woda mineralna | `drinks` | 1 | 2 | 3 |
| Woda mineralna niegazowana | `drinks` | 0 | 3 | 3 |
| Herbata melisa | `drinks` | 0 | 1 | 1 |
| Piwo | `drinks` | 0 | 1 | 1 |
| Woda niegazowana | `drinks` | 0 | 1 | 1 |
| Piwo | `alcohol` | 3 | 5 | 8 |
| Beer | `alcohol` | 0 | 1 | 1 |
| Whisky | `alcohol` | 1 | 0 | 1 |
| Wódka | `alcohol` | 0 | 1 | 1 |
| Czekolada gorzka | `snacks` | 5 | 5 | 10 |
| Żelki | `snacks` | 5 | 5 | 10 |
| Chrupki | `snacks` | 4 | 4 | 8 |
| Chrupki Cheetos | `snacks` | 2 | 2 | 4 |
| Cukierki | `snacks` | 1 | 2 | 3 |
| Chipsy | `snacks` | 1 | 1 | 2 |
| Chrupki serowe | `snacks` | 1 | 1 | 2 |
| Orzeszki ziemne | `snacks` | 0 | 1 | 1 |
| Paluszki | `snacks` | 0 | 1 | 1 |
| Słodycze | `snacks` | 1 | 0 | 1 |
| Papier toaletowy | `household` | 10 | 10 | 20 |
| Ręczniki papierowe | `household` | 5 | 5 | 10 |
| Płytki | `household` | 1 | 1 | 2 |
| Cukier biały | `household` | 1 | 0 | 1 |
| Karma dla psów | `pets` | 1 | 1 | 2 |
| Altacet | `pharmacy` | 2 | 2 | 4 |
| Utrogestan | `pharmacy` | 2 | 2 | 4 |
| Wazelina | `pharmacy` | 2 | 2 | 4 |
| Dezodorant | `cosmetics` | 1 | 1 | 2 |
| Klej gipsowy | `diy` | 1 | 1 | 2 |
| Krzyżaki do płytek | `diy` | 1 | 1 | 2 |
| Profil CD | `diy` | 1 | 1 | 2 |
| Śruba | `diy` | 1 | 1 | 2 |
| Wkręty do drewna | `diy` | 1 | 1 | 2 |
| Oliwa z oliwek | `other` | 8 | 13 | 21 |
| Mąka pszenna | `other` | 8 | 11 | 19 |
| Kakao | `other` | 6 | 5 | 11 |
| Sos pesto | `other` | 5 | 5 | 10 |
| drożdże świeże | `other` | 1 | 8 | 9 |
| sól | `other` | 2 | 7 | 9 |
| Ryż | `other` | 2 | 5 | 7 |
| Makaron | `other` | 2 | 4 | 6 |
| Sos pomidorowy | `other` | 1 | 5 | 6 |
| Makaron spaghetti | `other` | 2 | 3 | 5 |
| Passata pomidorowa | `other` | 2 | 3 | 5 |
| pieprz czarny mielony | `other` | 1 | 4 | 5 |
| Coś słodkiego | `other` | 2 | 2 | 4 |
| Olej roślinny | `other` | 0 | 4 | 4 |
| eggs | `other` | 1 | 2 | 3 |
| Sos | `other` | 1 | 2 | 3 |
| Woda | `other` | 0 | 3 | 3 |
| bazylia suszona | `other` | 1 | 1 | 2 |
| Bułka | `other` | 0 | 2 | 2 |
| Ciastka mafijne | `other` | 0 | 2 | 2 |
| Cukier | `other` | 1 | 1 | 2 |
| Deska serów | `other` | 0 | 2 | 2 |
| Jabłka | `other` | 0 | 2 | 2 |
| Jogurty | `other` | 0 | 2 | 2 |
| Kabanosy | `other` | 0 | 2 | 2 |
| Karta na 3 dni | `other` | 1 | 1 | 2 |
| Kartka urodzinowa | `other` | 1 | 1 | 2 |
| Kiełbasa 8szt | `other` | 0 | 2 | 2 |
| Masło | `other` | 0 | 2 | 2 |
| Mięso mielone 1kg | `other` | 0 | 2 | 2 |
| Mleko | `other` | 0 | 2 | 2 |
| Musztarda dijon | `other` | 1 | 1 | 2 |
| Nachosy | `other` | 0 | 2 | 2 |
| Ogorki | `other` | 0 | 2 | 2 |
| Olej | `other` | 0 | 2 | 2 |
| Oliwki czarne | `other` | 0 | 2 | 2 |
| Oregano suszone | `other` | 0 | 2 | 2 |
| Papryczki | `other` | 0 | 2 | 2 |
| Papryka ostra | `other` | 1 | 1 | 2 |
| Papryka słodka | `other` | 1 | 1 | 2 |
| Pieczywo | `other` | 0 | 2 | 2 |
| Piwo | `other` | 0 | 2 | 2 |
| Płatki owsiane | `other` | 1 | 1 | 2 |
| Przyprawy | `other` | 1 | 1 | 2 |
| Risotto | `other` | 1 | 1 | 2 |
| rodzynki | `other` | 1 | 1 | 2 |
| Salami | `other` | 0 | 2 | 2 |
| Schab 1,5kg w całości | `other` | 0 | 2 | 2 |
| Ser żółty kostka | `other` | 0 | 2 | 2 |
| Ser żółty w plastrach | `other` | 0 | 2 | 2 |
| Sok | `other` | 0 | 2 | 2 |
| Sok cytrynowy | `other` | 0 | 2 | 2 |
| Sos ciemny | `other` | 1 | 1 | 2 |
| Sos słodki | `other` | 1 | 1 | 2 |
| Sos sojowy | `other` | 0 | 2 | 2 |
| Winogron | `other` | 0 | 2 | 2 |
| Zapiekanka | `other` | 1 | 1 | 2 |
| Zielony pieprz | `other` | 0 | 2 | 2 |
| Ziemniaki | `other` | 0 | 2 | 2 |
| Bialko | `other` | 0 | 1 | 1 |
| Bulion drobiowy | `other` | 0 | 1 | 1 |
| Bulion warzywny | `other` | 1 | 0 | 1 |
| Bulion warzywny lub kostka rosołowa | `other` | 0 | 1 | 1 |
| Bulion wołowy | `other` | 1 | 0 | 1 |
| Drożdże instant | `other` | 0 | 1 | 1 |
| Drożdże świeże lub suszone | `other` | 0 | 1 | 1 |
| Jajka | `other` | 1 | 0 | 1 |
| Liść laurowy | `other` | 1 | 0 | 1 |
| Makaron lasagne | `other` | 0 | 1 | 1 |
| Olejek roślinny | `other` | 0 | 1 | 1 |
| Oliwa | `other` | 0 | 1 | 1 |
| pieprz | `other` | 1 | 0 | 1 |
| Pieprz czarny | `other` | 0 | 1 | 1 |
| Płatki | `other` | 1 | 0 | 1 |
| Proszek do pieczenia | `other` | 1 | 0 | 1 |
| Ryż do risotto | `other` | 1 | 0 | 1 |
| Ser żółty plastry | `other` | 0 | 1 | 1 |
| Sos Cezar | `other` | 0 | 1 | 1 |
| Sos pomidorowy bez cukru | `other` | 0 | 1 | 1 |
| Sos pomidorowy do pizzy | `other` | 0 | 1 | 1 |
| Wędliny dwa rodzaje | `other` | 0 | 1 | 1 |
| Ziele angielskie | `other` | 1 | 0 | 1 |
| Zupki chińskie | `other` | 0 | 1 | 1 |

---

_Local analysis artifact — not app runtime config. Safe to delete after the category review._
