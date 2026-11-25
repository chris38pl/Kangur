import type { HomeCopy } from "@/lib/marketing/content/home-types";

export const homeCs: HomeCopy = {
  hero: {
    eyebrow: "Kangur - aplikace na společný nákupní seznam",
    lines: ["Seznam přišel v chatu?", "Stačí snímek."],
    lead: "Udělej snímek konverzace. Kangur vypíše produkty, seřadí je podle uliček a ukáže je všem doma. V obchodě už jen přejíždíš prstem.",
    storesNote: "Pro iPhone a Android. Bez reklam. Na začátek 10 použití AI zdarma.",
    playSmall: "STÁHNOUT Z",
    iosSmall: "STÁHNOUT V",
    chatLabel: "Ukázková konverzace, ze které vznikne seznam",
    screenAlt: "Stejný seznam v Kanguru: 22 položek, nejdřív ovoce a zelenina, potom mléčné výrobky",
  },
  chat: {
    contact: "Miláček ❤️",
    status: "aktivní teď",
    messages: [
      ["me", "jdu z práce, mám něco koupit?"],
      ["them", "jo! počkej"],
      [
        "them",
        "mléko, vejce 10 ks, rajčata, toaletní papír, sýr, chleba, máslo, kuře 1kg, prostředek na nádobí, banány, těstoviny, cibuli, passatu 2x, bílý jogurt, brambory, česnek, šunku, kávu, okurky, granule pro psa",
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
        title: "Udělej snímek chatu",
        body: "Někdy je to jedna dlouhá zpráva s čárkami, někdy sedm a na konci „jéé a prací prášek“. Obojí funguje.",
      },
      {
        pill: "Krok 2",
        title: "Kangur udělá seznam",
        body: "Najde produkty a množství a „hlavně na nic nezapomeň 😘“ nechá být. Z tohoto chatu vyšlo 22 položek.",
      },
      {
        pill: "Krok 3",
        title: "V obchodě přejíždíš",
        body: "Doprava: koupeno. Doleva: nebylo. Jedna ruka, jedna ulička, další ulička.",
      },
    ],
    screenAlt: "Režim nákupu v Kanguru: okurky se v uličce Zelenina přejíždějí doprava jako koupené",
  },
  ways: {
    lines: ["Žádný chat?", "Jde to i jinak."],
    intro: "Seznam nechodí vždycky ve zprávě. Někdy visí na lednici a někdy ho má někdo v hlavě.",
    photo: {
      title: "Lístek z lednice",
      body: "Vyfoť ho a Kangur ho přepíše. U hodně nečitelného písma se může splést, tak na výsledek mrkni.",
      note: ["mléko, vejce 10", "toaletní papír", "kuře 1 kg ??", "máslo (ještě je?)", "něco k večeři"],
    },
    dish: {
      title: "Jídlo na dnešek",
      body: "Napiš „carbonara“ a „bruschetta“ a máš suroviny na jednom seznamu. Sůl a pepř jednou, ne dvakrát. Co máš doma, odznačíš.",
      screenAlt: "Suroviny na carbonaru v Kanguru, připravené k odznačení",
    },
    usual: {
      title: "To, co vždycky",
      body: "Kangur posbírá produkty z posledních pěti seznamů a ukáže, které se vracejí nejčastěji. Necháš si ty, které potřebuješ.",
      screenAlt: "Návrh z historie v Kanguru: banány, rajčata a mléko, koupeno 5krát",
    },
    typed: {
      title: "Z hlavy",
      body: "Piš s čárkami, nadiktuj nebo vlož text ze schránky. Nebo přidávej po jednom: Kangur napovídá po dvou písmenech.",
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
    screenAlt: "Společný prostor v Kanguru s lidmi, kteří mají k seznamu přístup",
  },
  summary: {
    lines: ["Paprika?", "Nebyla."],
    body: "Po nákupu vidíš, co se koupilo, co chybělo a jak dlouho to trvalo. Dřív, než se někdo zeptá.",
    screenAlt: "Shrnutí nákupu v Kanguru: 18 koupeno, 1 nebylo, 24 minut",
  },
  price: {
    lines: ["Kolik to stojí?", "Tady je účtenka."],
    body: "Seznamy, domácnost a režim nákupu jsou zdarma. Platí se jen za AI bez limitu a delší historii, jednou za celý prostor, ne za osobu.",
    receiptLabel: "Ceny Kanguru jako účtenka",
    receipt: [
      { kind: "head", text: "Kangur" },
      { kind: "item", text: "Společné seznamy", price: "0,00" },
      { kind: "item", text: "Domácnost", note: "kolik lidí chceš", price: "0,00" },
      { kind: "item", text: "10 použití AI na začátek", price: "0,00" },
      { kind: "item", text: "Reklamy", note: "nevedeme", price: "-" },
      { kind: "rule" },
      { kind: "item", text: "Premium", note: "AI bez limitu, 200 seznamů v historii", price: "v obchodě" },
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
      { title: "Nečte chaty", body: "Vidí jen snímek, který vybereš." },
      { title: "Nezná kontakty ani polohu", body: "Neptá se na ně, nákupní seznam je nepotřebuje." },
      { title: "Nemá reklamy", body: "Živí ho Premium, ne tvoje pozornost." },
    ],
    safetyLink: "Jaká oprávnění Kangur používá (anglicky)",
    aboutLink: "Odkud se vzal (anglicky)",
  },
  faq: {
    lines: ["Než stáhneš,", "krátce."],
    items: [
      {
        q: "Co je Kangur?",
        a: "Kangur je aplikace pro iPhone a Android na společné nákupní seznamy. Seznam udělá ze snímku chatu, fotky lístku, názvu jídla, předchozích seznamů nebo z toho, co napíšeš, a seřadí ho podle uliček. Kangur je polsky klokan: ten oranžový v tyrkysové mikině na ikoně.",
      },
      {
        q: "Je Kangur zdarma?",
        a: "Ano, s jedním limitem: na začátek máš 10 použití AI a ta se neobnovují. Ruční seznamy, domácnost a režim nákupu limit nemají. AI bez limitu dává Premium.",
      },
      {
        q: "Musí druhý člověk platit?",
        a: "Ne. Pozvánka je zdarma a Premium platí pro celý prostor, tedy pro všechny doma.",
      },
      {
        q: "Čte Kangur moje zprávy?",
        a: "Ne. Nemá přístup k žádné chatovací aplikaci. Vidí jen ten jeden obrázek, který vybereš z galerie. Obrázek jde k poskytovateli AI (OpenAI), aby se seznam přečetl, a Kangur ho neukládá.",
      },
      {
        q: "Co funguje bez signálu v obchodě?",
        a: "Odškrtávání na otevřeném seznamu: změny počkají v telefonu a odešlou se později. Vytváření seznamů a AI potřebují internet.",
      },
      {
        q: "Má to něco společného s matematickým Klokanem nebo se vzdálenou plochou?",
        a: "Ani s jedním. Klokanů je spousta, ten náš umí jen nákupní seznamy. Neovládá telefon ani počítač a nikdo od nás nevolá. [[safety|Víc o bezpečnosti (anglicky)]].",
      },
    ],
  },
  closing: {
    lines: ["Stačí", "snímek."],
    body: "Kangur - nákupní seznam s AI. Pro Android a iPhone.",
    qrLabel: "QR kód, který otevře Kangur v Google Play nebo App Store",
    qrHint: "U počítače? Naskenuj telefonem.",
  },
};
