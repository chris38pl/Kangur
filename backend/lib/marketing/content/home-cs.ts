import type { HomeCopy } from "@/lib/marketing/content/home-types";

export const homeCs: HomeCopy = {
  hero: {
    eyebrow: "Kangur - aplikace na sdílený nákupní seznam",
    lines: ["Seznam přišel v chatu?", "Stačí screenshot."],
    lead: "Udělej screenshot konverzace. Kangur vypíše produkty, seřadí je podle uliček a ukáže je všem doma. V obchodě už stačí palec.",
    storesNote: "Pro iPhone a Android. Bez reklam. Na začátek 10 použití AI zdarma.",
    playSmall: "STÁHNOUT Z",
    iosSmall: "STÁHNOUT V",
    chatLabel: "Ukázková konverzace, ze které vznikne seznam",
    screenAlt: "Seznam z téhle konverzace v Kangurovi: 22 položek, nejdřív ovoce a zelenina, potom mléčné výrobky",
  },
  chat: {
    contact: "Miláček ❤️",
    status: "teď online",
    messages: [
      ["me", "jdu z práce, mám něco koupit?"],
      ["them", "jo! počkej"],
      [
        "them",
        "mlíko, 10 vajec, rajčata, toaleťák, sýr, chleba, máslo, kuře 1kg, prostředek na nádobí, banány, těstoviny, cibuli, 2x passatu, bílý jogurt, brambory, česnek, šunku, kafe, okurky, granule pro psa",
      ],
      ["them", "hlavně na nic nezapomeň 😘"],
      ["them", "a možná nějaké brambůrky"],
      ["them", "nejlíp 2 sáčky cibulových"],
      ["them", "jéé a prací prášek, došel"],
    ],
  },
  steps: {
    lines: ["Přepisovat?", "Škoda času."],
    items: [
      {
        pill: "Krok 1",
        title: "Udělej screenshot chatu",
        body: "Někdy je to jedna dlouhá zpráva s čárkami, někdy sedm a na konci „jéé a prací prášek“. Obojí funguje.",
      },
      {
        pill: "Krok 2",
        title: "Kangur udělá seznam",
        body: "Najde produkty a množství a „hlavně na nic nezapomeň 😘“ nechá být. Z tohoto chatu vyšlo 22 položek.",
      },
      {
        pill: "Krok 3",
        title: "V obchodě stačí palec",
        body: "Doprava: koupeno. Doleva: nebylo. Jedna ruka, jedna ulička, další ulička.",
      },
    ],
    screenAlt: "Režim nákupu v Kangurovi: okurky v uličce Zelenina se posouvají doprava jako koupené",
  },
  ways: {
    lines: ["Žádný chat?", "Jde to i jinak."],
    intro: "Seznam nepřijde vždycky zprávou. Někdy visí na lednici a někdy ho má někdo v hlavě.",
    photo: {
      title: "Lístek z lednice",
      body: "Vyfoť ho a Kangur ho přepíše. U hodně nečitelného písma se může splést, tak na výsledek mrkni.",
      note: ["mléko, vejce 10", "toaletní papír", "kuře 1 kg ??", "máslo (ještě je?)", "něco k večeři"],
    },
    dish: {
      title: "Jídlo na dnešek",
      body: "Napiš „carbonara“ a „bruschetta“ a máš suroviny na jednom seznamu. Sůl a pepř jednou, ne dvakrát. Co máš doma, odznačíš.",
      screenAlt: "Suroviny na carbonaru v Kangurovi, připravené k odznačení",
    },
    usual: {
      title: "To, co vždycky",
      body: "Kangur posbírá produkty z posledních pěti seznamů a ukáže, které se vracejí nejčastěji. Necháš si ty, které potřebuješ.",
      screenAlt: "Návrh z historie v Kangurovi: banány, rajčata a mléko, koupeno 5krát",
    },
    typed: {
      title: "Z hlavy",
      body: "Piš s čárkami, nadiktuj nebo vlož text ze schránky. Nebo přidávej po jednom: Kangur napovídá už od druhého písmene.",
      chips: ["mléko", "chleba", "něco sladkého"],
    },
  },
  together: {
    lines: ["Dva telefony,", "jeden seznam."],
    body: "Někdo z gauče přidá máslo, někdo cestou do obchodu kávu. Za chvíli je obojí na seznamu u obou.",
    points: [
      "Pozveš e-mailem, kolik lidí chceš",
      "Pozvánky nic nestojí",
      "iPhone a Android na jednom seznamu",
      "Telefon dá vědět, když někdo začne nakupovat",
    ],
    screenAlt: "Společný prostor v Kangurovi s lidmi, kteří mají k seznamu přístup",
  },
  summary: {
    lines: ["Paprika?", "Nebyla."],
    body: "Po nákupu vidíš, co se koupilo a co chybělo. Dřív, než se někdo zeptá.",
    screenAlt: "Shrnutí nákupu v Kangurovi: 18 koupeno, 1 nedostupné, 24 minut",
  },
  price: {
    lines: ["Kolik to stojí?", "Tady je účtenka."],
    body: "Seznamy, sdílení a režim nákupu jsou zdarma. Platí se jen za AI bez limitu a delší historii: jedno měsíční předplatné na celý prostor, ne na osobu.",
    receiptLabel: "Ceny Kangura jako účtenka",
    receipt: [
      { kind: "head", text: "Kangur" },
      { kind: "item", text: "Sdílené seznamy", price: "0,00" },
      { kind: "item", text: "Domácnost", note: "kolik lidí chceš", price: "0,00" },
      { kind: "item", text: "10 použití AI na začátek", note: "na celý prostor", price: "0,00" },
      { kind: "item", text: "Reklamy", note: "nevedeme", price: "-" },
      { kind: "rule" },
      { kind: "item", text: "Premium, měsíčně", note: "AI bez limitu, 200 seznamů v historii", price: "v aplikaci" },
      { kind: "foot", text: "Cenu ve tvé měně ukáže aplikace." },
      { kind: "rule" },
      { kind: "total", text: "Na začátek", price: "0,00" },
      { kind: "foot", text: "Drobné si nechte." },
    ],
    link: "Celý ceník (anglicky)",
  },
  maker: {
    lines: ["Kdo za tím stojí?", "Jeden člověk z Poznaně."],
    body: "Kangura dělá jednočlenná firma z Polska, Krzysztof Krawiec Software. Bez reklamního oddělení a bez prodeje dat.",
    points: [
      { title: "Nemá přístup k chatovacím aplikacím", body: "Dostane jen screenshot, který vybereš." },
      { title: "Nekouká do kontaktů ani na GPS", body: "Ani se na ně neptá, nákupní seznam je nepotřebuje." },
      { title: "Nemá reklamy", body: "Živí ho Premium, ne tvoje pozornost." },
    ],
    safetyLink: "Jaká oprávnění Kangur používá (anglicky)",
    aboutLink: "Odkud se vzal (anglicky)",
  },
  faq: {
    lines: ["Než si ho stáhneš,", "ve zkratce."],
    items: [
      {
        q: "Co je Kangur?",
        a: "Kangur je aplikace pro iPhone a Android na sdílené nákupní seznamy. Seznam udělá ze screenshotu chatu, fotky lístku, názvu jídla, předchozích seznamů nebo z toho, co napíšeš, a seřadí ho podle uliček. Kangur je polsky klokan: ten oranžový v tyrkysové mikině na ikoně.",
      },
      {
        q: "Je Kangur zdarma?",
        a: "Ano. Limity jsou dva: 10 použití AI na celý prostor, která se neobnovují, a posledních 20 seznamů v historii. Ruční seznamy, sdílení a režim nákupu limit nemají. AI bez limitu dává Premium.",
      },
      {
        q: "Musí druhý člověk platit?",
        a: "Ne. Pozvánka je zdarma a Premium platí pro celý prostor, tedy pro všechny doma.",
      },
      {
        q: "Čte Kangur moje zprávy?",
        a: "Ne. Nemá přístup k žádné chatovací aplikaci. Dostane jen ten jeden obrázek, který vybereš. Obrázek jde k poskytovateli AI (OpenAI), který z něj přečte seznam. Samotný obrázek Kangur neukládá.",
      },
      {
        q: "Co funguje bez signálu v obchodě?",
        a: "Režim nákupu na seznamu, který už máš otevřený: odškrtáváš a změny se odešlou později. Nákup ukonči, až bude zase signál. Nové seznamy a AI potřebují internet.",
      },
      {
        q: "Má to něco společného s matematickým Klokanem?",
        a: "Ne. Klokanů je spousta, ten náš umí jen nákupní seznamy. [[safety|Jak nás poznat (anglicky)]].",
      },
    ],
  },
  closing: {
    lines: ["Stačí", "screenshot."],
    body: "Kangur - nákupní seznam s AI. Pro Android a iPhone.",
    qrLabel: "QR kód, který otevře Kangura v Google Play nebo App Store",
    qrHint: "U počítače? Naskenuj telefonem.",
  },
};
