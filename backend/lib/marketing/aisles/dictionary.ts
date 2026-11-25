import { CATALOG_PRODUCTS } from "@shared/product-catalog";
import type { ShoppingCategory } from "@shared/shopping-categories";

/** [phrase, aisle]. Sent to the browser, so it stays small: Polish only, no slugs. */
export type AisleWord = readonly [phrase: string, aisle: ShoppingCategory];

/**
 * Everyday words the app's catalogue does not need, because AI reads whole sentences
 * there. The web tool only looks words up, so it has to know them. A few brands that became
 * everyday words are here too, because that is how people write; they are never shown.
 */
const EXTRA: Partial<Record<ShoppingCategory, string>> = {
  fruit:
    "owoce, gruszki, winogrono, jagody, borówki amerykańskie, daktyle świeże, suszone śliwki świeże, banany bio, clementynki, klementynki, pigwa, nektaryny, brzoskwinie",
  vegetables:
    "warzywa, pietruszka korzeń, seler, marchewki, papryka czerwona, papryka żółta, pomidor, ogórek szklarniowy, ogórki gruntowe, ziemniaczki, pieczarki brązowe, groszek cukrowy, fasola szparagowa, kapusta biała, kapusta młoda, młoda kapusta, sałata masłowa, bazylia świeża, świeża bazylia, świeże zioła, mięta, kolendra, rozmaryn świeży, tymianek świeży, por, buraczki, czosnek niedźwiedzi, tofu, hummus, kimchi, ogórki małosolne, kurki, grzyby świeże, oliwki świeże, zakwas buraczany, zakwas na barszcz, barszcz kiszony, jarmuż świeży, topinambur, patison, kukurydza kolba, kolby kukurydzy",
  dairy:
    "mleko owsiane, mleko sojowe, mleko migdałowe, napój owsiany, mleko bez laktozy, śmietana 18, śmietana 12, śmietanka 30, śmietanka 36, śmietanka do kawy, jogurt naturalny, jogurt owocowy, skyr, ser biały, biały ser, ser w plastrach, ser tarty, ser mozzarella, ser kozi, ser owczy, oscypek, camembert, brie, gouda, cheddar, ricotta, halloumi, twarożek, serek, serek kanapkowy, serek do smarowania, jajka z wolnego wybiegu, masło klarowane, masło ekstra, smalec, deser mleczny, budyń gotowy, masło roślinne, zsiadłe mleko",
  meat:
    "mięso, filet z kurczaka, filet z indyka, pierś z indyka, udka, skrzydełka, kurczak cały, wędlina, wędliny, kiełbasa biała, biała kiełbasa, kiełbasa śląska, frankfurterki, kaszanka, polędwica, polędwiczki, łopatka, golonka, wątróbka, gulasz, mięso na gulasz, mięso na rosół, porcja rosołowa, kości na rosół, kaczka, gęś, królik, cielęcina, baranina, mięso mielone wołowe, szynka parmeńska, szynka konserwowa, boczek wędzony, bekon, słonina, mortadela, żebro",
  fish:
    "ryba, ryby, karp, filet z karpia, dzwonka karpia, filet z dorsza, filet z mintaja, mintaj, morszczuk, sola, halibut, sandacz, szczupak, płaty śledziowe, śledź w oleju, śledzie w oleju, śledź matjas, matjasy, łosoś wędzony, makrela wędzona, tuńczyk w puszce, sardynki, szprotki, paluszki krabowe, owoce morza, kawior, ryba wędzona",
  bakery:
    "pieczywo, bułeczki, kajzerki, grahamki, bochenek, chleb żytni, chleb na zakwasie, chleb krojony, rogale, rogaliki, ciabatta, pita, chałka, bajgle, wrapy, lawasz, ciasto drożdżowe, ciasto, makowiec, sernik, szarlotka, piernik, babka, tort, pączki, ciasto francuskie świeże, tosty, bułki do burgerów, bułki do hot dogów, opłatek, opłatki, podpłomyki",
  frozen:
    "mrożonka, mrożony szpinak, szpinak mrożony, mrożone pierogi, kopytka, pyzy, knedle, uszka, pierogi ruskie, pierogi z mięsem, pierogi z kapustą, ryba mrożona, mrożony filet, lód, kostki lodu, ciasto francuskie, ciasto filo, krokiety, kluski śląskie, warzywa na patelnię, mrożona włoszczyzna, mieszanka chińska, lody na patyku, pizza",
  drinks:
    "napoje, 7 up, 7up, sok, soki, nektar, woda niegazowana, woda mineralna, zgrzewka wody, herbata zielona, herbata owocowa, herbata czarna, zioła do picia, melisa, kawa mielona, kawa ziarnista, kawa rozpuszczalna, kapsułki do kawy, kakao do picia, lemoniada, oranżada, tonik, izotonik, syrop malinowy, syrop, kompot, kefir do picia, kawa zbożowa, kubuś soczek, soczki, soczki dla dzieci",
  alcohol:
    "wino czerwone, wino białe, wino musujące, szampan, prosecco, wódka, whisky, rum, gin, likier, nalewka, piwo bezalkoholowe, cydr, grzaniec",
  snacks:
    "słodycze, ciastka, cukierki, batony, batonik, czekoladki, bombonierka, ptasie mleczko, galaretki, chrupki, chrupki kukurydziane, prażynki, nachos, orzeszki, orzeszki ziemne, pistacje, orzechy włoskie, orzechy laskowe, orzechy nerkowca, mieszanka studencka, pestki dyni, słonecznik, suszone owoce, daktyle, guma do żucia, lizaki, chałwa, nugat, pierniczki, delicje, sezamki, precelki, pianki, wafle",
  pantry:
    "mąka pszenna, mąka tortowa, mąka żytnia, mąka krupczatka, makaron świderki, makaron penne, makaron nitki, łazanki, nitki, ryż basmati, ryż jaśminowy, ryż na risotto, kasza, kasza pęczak, pęczak, kasza bulgur, płatki, płatki śniadaniowe, granola, otręby, fasola, fasola biała, fasola czerwona, groch, groch łuskany, groszek ptysiowy, mak, masa makowa, susz, susz wigilijny, susz owocowy, suszone śliwki, śliwki suszone, suszone jabłka, pszenica na kutię, pszenica, morele suszone, żurawina suszona, skórka pomarańczowa, bakalie, sezam, siemię lniane, nasiona chia, cukier brązowy, cukier trzcinowy, cukier wanilinowy, cukier waniliowy, budyń, kisiel, galaretka, żelatyna, proszek budyniowy, soda, soda oczyszczona, bulion, rosół w kostce, rosołki, kostka rosołowa, bulion w kostce, zupka, zupa w proszku, barszcz czerwony, barszcz w kartonie, koncentrat barszczu, konserwa, konserwy, pasztet w puszce, powidła, krem orzechowy, masło z orzechów, syrop klonowy, ksylitol, słodzik, pomidory krojone, pulpa pomidorowa, kapary, papier ryżowy, makaron ryżowy, chleb chrupki, sucharki, bułka na tartę bułkę, panierka, migdały płatki, kukurydza, orzechy do ciasta, polewa czekoladowa, posypka, kaszka manna, zacierki",
  spices:
    "przyprawy, sól i pieprz, sól himalajska, pieprz czarny, pieprz ziołowy, papryka słodka, papryka ostra, papryka wędzona, czosnek granulowany, cebula suszona, curry, zioła prowansalskie, przyprawa do kurczaka, przyprawa do piernika, przyprawa do grilla, przyprawa do gyrosa, goździki, gałka muszkatołowa, kardamon, anyż, wanilia, laska wanilii, estragon, lubczyk, rozmaryn, natka suszona, koper suszony, jałowiec, kolendra mielona, chili w płatkach, vegeta, przyprawa uniwersalna, imbir mielony",
  sauces:
    "sos, sosy, sos pomidorowy, sos do makaronu, sos ostry, sos barbecue, sos bbq, sos teriyaki, sos rybny, sos sałatkowy, sos tatarski, sos tysiąca wysp, sos słodko kwaśny, sriracha, tahini, ćwikła, chrzan tarty, keczup, pesto zielone, ocet winny, ocet jabłkowy, dressing",
  household:
    "papier do pieczenia, folia spożywcza, folia, woreczki, woreczki na lód, worki, worki do odkurzacza, ręcznik papierowy, serwetki, świeczki, świece, zapałki, zapalniczka, żarówka, żarówki, słomki, kubeczki jednorazowe, talerzyki, pojemniki na żywność, pojemniki na wynos, pudełka na jedzenie, torby na zakupy, reklamówki, filtry do kawy, wykałaczki, patyczki do szaszłyków, spinacze do bielizny, znicze, wkłady do zniczy, sianko, papier do pakowania, wstążka, taśma klejąca, torebki prezentowe, podpałka, brykiet, węgiel drzewny, tacki",
  cleaning:
    "płyn, płyn do podłóg, płyn do szyb, płyn do mycia naczyń, płyn do prania, kapsułki do prania, proszek, odplamiacz, odkamieniacz, kret, domestos, wybielacz, mleczko do czyszczenia, sól do zmywarki, nabłyszczacz, ściereczki, ścierki, druciak, zmywak, mop, miotła, rękawice gumowe, rękawiczki, kostki do toalety, odświeżacz powietrza, odświeżacz do wc, zawieszka do wc, środek do czyszczenia, pasta do zmywarki, kapsułki do zmywarki",
  baby:
    "pieluchy, pampersy, pieluchomajtki, mleko modyfikowane, kaszka dla dziecka, kaszka, słoiczki, słoiczek, obiadek, deserek dla dziecka, mokre chusteczki dla dzieci, chusteczki nawilżane, smoczek, butelka dla dziecka, soczek dla dziecka, krem na odparzenia, mus owocowy, musy",
  pets:
    "karma, karma dla pieska, karma dla kotka, karma sucha, karma mokra, saszetki dla kota, puszki dla psa, żwirek, żwirek dla kota, przysmaki dla psa, przysmaki dla kota, smaczki, kość dla psa, pokarm dla ryb, ziarno dla ptaków, siano dla królika, podkłady dla psa",
  pharmacy:
    "chusteczki higieniczne, leki, kończące się leki, tabletki przeciwbólowe, tabletki na ból głowy, aspiryna, ibuprofen, paracetamol, witamina c, witamina d, witaminy, magnez, syrop na kaszel, krople do nosa, tabletki na gardło, termometr, bandaż, woda utleniona, plastry opatrunkowe, tampony, wkładki, maseczki, elektrolity, probiotyk, maść",
  cosmetics:
    "mydło, żel do mycia, odżywka do włosów, odżywka, lakier do włosów, pianka do golenia, maszynka do golenia, maszynki, żyletki, krem, krem do rąk, krem do twarzy, balsam, balsam do ciała, pasta, szczoteczka do zębów, szczoteczka, szczoteczki, nić dentystyczna, płyn do płukania ust, waciki, płatki kosmetyczne, patyczki do uszu, patyczki higieniczne, perfumy, pomadka, zmywacz do paznokci, tusz, antyperspirant, płyn do kąpieli, gąbka do kąpieli, szampon dla dzieci",
  electronics: "baterie aaa, baterie aa, bateria, ładowarka, kabel, przedłużacz, słuchawki, pendrive",
  office:
    "zeszyt, zeszyty, długopis, długopisy, ołówek, kredki, farby, plastelina, klej, nożyczki, blok rysunkowy, papier ksero, kartki świąteczne, koperty, znaczki, taśma",
  garden: "ziemia do kwiatów, ziemia, doniczka, nawóz, nasiona, kwiaty, kwiaty cięte, bukiet, choinka, jemioła, stroik, trawa",
  diy: "gwoździe, śruby, kołki, wkręty, silikon, farba, pędzel, wałek malarski, taśma malarska, klej montażowy, wiertło",
  other: "bilety, gazeta, karta podarunkowa",
};

/** Words nobody should read on our page, only find. */
export const UNSHOWN: ReadonlySet<string> = new Set([
  "pampersy", "domestos", "kret", "vegeta", "delicje", "ptasie mleczko", "kubuś soczek", "sriracha",
]);

/**
 * Where the tool differs from the app on purpose: the app keeps oil in "Inne", and in a shop
 * it stands next to the flour. To be moved in the catalogue too.
 */
const MOVED: Readonly<Record<string, ShoppingCategory>> = Object.fromEntries(
  ["oliwa z oliwek", "oliwa", "olej roślinny", "olej", "olej rzepakowy", "olej lniany", "olej słonecznikowy", "olej kokosowy", "olej albo oliwa"].map(
    (word) => [word, "pantry" as const],
  ),
);

export function buildAisleWords(): AisleWord[] {
  const words: AisleWord[] = [];
  const seen = new Set<string>();
  const add = (phrase: string, aisle: ShoppingCategory) => {
    const key = phrase.trim().toLocaleLowerCase("pl");
    if (!key || seen.has(key)) return;
    seen.add(key);
    words.push([key, aisle]);
  };

  for (const [phrase, aisle] of Object.entries(MOVED)) add(phrase, aisle);
  // Then the app's own catalogue, so the tool and Kangur agree.
  for (const product of CATALOG_PRODUCTS) {
    add(product.labels.pl, product.category);
    for (const alias of product.aliases?.pl ?? []) add(alias, product.category);
  }
  for (const [aisle, list] of Object.entries(EXTRA)) {
    for (const phrase of list.split(",")) add(phrase, aisle as ShoppingCategory);
  }
  return words;
}
