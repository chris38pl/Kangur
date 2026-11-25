import type { HomeCopy } from "@/lib/marketing/content/home-types";

export const homeIt: HomeCopy = {
  hero: {
    eyebrow: "Kangur - l’app per la lista della spesa condivisa",
    lines: ["La lista è arrivata in chat?", "Uno screenshot e via."],
    lead: "Fai uno screenshot della conversazione. Kangur ricava i prodotti, li divide per corsia e li mostra a tutta la casa. Al supermercato basta scorrere.",
    storesNote: "Per iPhone e Android. Senza pubblicità. 10 usi dell’AI gratis per iniziare.",
    playSmall: "SCARICA SU",
    iosSmall: "SCARICA SU",
    chatLabel: "Una conversazione di esempio da cui nasce la lista",
    screenAlt: "La stessa lista in Kangur: 22 articoli, prima frutta e verdura, poi latticini",
  },
  chat: {
    contact: "Amore ❤️",
    status: "online",
    messages: [
      ["me", "esco dal lavoro, serve qualcosa?"],
      ["them", "sì! aspetta"],
      [
        "them",
        "latte, uova 10, pomodori, carta igienica, formaggio, pane, burro, pollo 1kg, detersivo piatti, banane, pasta, cipolle, passata x2, yogurt bianco, patate, aglio, prosciutto, caffè, cetrioli, crocchette per il cane",
      ],
      ["them", "non dimenticare niente 😘"],
      ["them", "ah e magari delle patatine"],
      ["them", "meglio 2 sacchetti alla cipolla"],
      ["them", "eee il detersivo per la lavatrice, è finito"],
    ],
  },
  steps: {
    lines: ["Ricopiarla?", "Ma anche no."],
    items: [
      {
        pill: "Passo 1",
        title: "Screenshot della chat",
        body: "A volte è un messaggio lunghissimo con le virgole, a volte sono sette con un «eee il detersivo» alla fine. Vanno bene entrambi.",
      },
      {
        pill: "Passo 2",
        title: "Kangur fa la lista",
        body: "Riconosce prodotti e quantità e lascia in pace «non dimenticare niente 😘». Da questa chat sono usciti 22 articoli.",
      },
      {
        pill: "Passo 3",
        title: "Al supermercato scorri",
        body: "A destra: preso. A sinistra: non c’era. Una mano, una corsia, la prossima.",
      },
    ],
    screenAlt: "Modalità spesa in Kangur: i cetrioli scorrono a destra come acquistati nella corsia Verdura",
  },
  ways: {
    lines: ["Niente chat?", "Ci sono altri modi."],
    intro: "La lista non arriva sempre in un messaggio. A volte è sul frigo, a volte è nella testa di qualcuno.",
    photo: {
      title: "Il foglietto sul frigo",
      body: "Fagli una foto, Kangur lo ricopia. Con una calligrafia davvero difficile può sbagliare, quindi dai un’occhiata al risultato.",
      note: ["latte, uova 10", "carta igienica", "pollo 1 kg ??", "burro (c’è ancora?)", "qualcosa per cena"],
    },
    dish: {
      title: "Il piatto di stasera",
      body: "Scrivi «carbonara» e «bruschetta» e avrai gli ingredienti in una sola lista. Sale e pepe una volta, non due. Togli la spunta a ciò che hai già.",
      screenAlt: "Ingredienti della carbonara in Kangur, pronti da deselezionare",
    },
    usual: {
      title: "Il solito",
      body: "Kangur raccoglie i prodotti delle ultime cinque liste e mostra quelli che tornano più spesso. Tieni ciò che serve.",
      screenAlt: "Suggerimento dalla cronologia in Kangur: banane, pomodori e latte, comprati 5 volte",
    },
    typed: {
      title: "A memoria",
      body: "Scrivi con le virgole, detta o incolla un testo. Oppure aggiungi uno alla volta: Kangur suggerisce dopo due lettere.",
      chips: ["latte", "pane", "qualcosa di dolce"],
    },
  },
  together: {
    lines: ["Due telefoni,", "una lista sola."],
    body: "Qualcuno aggiunge il burro dal divano, qualcuno il caffè mentre va al supermercato. Poco dopo ci sono entrambi, per entrambi.",
    points: [
      "Inviti via e-mail quante persone vuoi",
      "Gli inviti non costano nulla",
      "iPhone e Android sulla stessa lista",
      "Il telefono avvisa quando qualcuno inizia la spesa",
    ],
    screenAlt: "Uno spazio condiviso in Kangur con le persone che hanno accesso alla lista",
  },
  summary: {
    lines: ["I peperoni?", "Non c’erano."],
    body: "Dopo la spesa vedi cosa hai preso, cosa mancava e quanto è durata. Prima che qualcuno lo chieda.",
    screenAlt: "Riepilogo della spesa in Kangur: 18 acquistati, 1 non disponibile, 24 minuti",
  },
  price: {
    lines: ["Quanto costa?", "Ecco lo scontrino."],
    body: "Liste, famiglia e modalità spesa sono gratis. Si paga solo l’AI senza limiti e una cronologia più lunga, una volta per tutto lo spazio e non a persona.",
    receiptLabel: "I prezzi di Kangur come uno scontrino",
    receipt: [
      { kind: "head", text: "Kangur" },
      { kind: "item", text: "Liste condivise", price: "0,00" },
      { kind: "item", text: "La tua casa", note: "quanti vuoi", price: "0,00" },
      { kind: "item", text: "10 usi dell’AI per iniziare", price: "0,00" },
      { kind: "item", text: "Pubblicità", note: "non ne teniamo", price: "-" },
      { kind: "rule" },
      { kind: "item", text: "Premium", note: "AI senza limiti, 200 liste in cronologia", price: "nello store" },
      { kind: "foot", text: "L’app mostra il prezzo nella tua valuta." },
      { kind: "rule" },
      { kind: "total", text: "Per iniziare", price: "0,00" },
      { kind: "foot", text: "Tenga pure il resto." },
    ],
    link: "Tutti i prezzi (in inglese)",
  },
  maker: {
    lines: ["Chi c’è dietro?", "Una persona a Poznań."],
    body: "Kangur lo fa un’azienda di una sola persona in Polonia, Krzysztof Krawiec Software. Niente reparto pubblicità e niente vendita di dati.",
    points: [
      { title: "Non legge le chat", body: "Vede solo lo screenshot che scegli." },
      { title: "Non conosce contatti né posizione", body: "Non li chiede: a una lista della spesa non servono." },
      { title: "Non ha pubblicità", body: "Vive di Premium, non della tua attenzione." },
    ],
    safetyLink: "Quali permessi usa Kangur (in inglese)",
    aboutLink: "Da dove viene (in inglese)",
  },
  faq: {
    lines: ["Prima di scaricare,", "in breve."],
    items: [
      {
        q: "Che cos’è Kangur?",
        a: "Kangur è un’app per iPhone e Android per liste della spesa condivise. Crea la lista da uno screenshot della chat, dalla foto di un foglietto, dal nome di un piatto, dalle liste precedenti o da ciò che scrivi, e la divide per corsia. Kangur in polacco vuol dire canguro: quello arancione con la felpa turchese sull’icona.",
      },
      {
        q: "Kangur è gratis?",
        a: "Sì, con un limite: all’inizio hai 10 usi dell’AI che non si rinnovano. Le liste a mano, la famiglia e la modalità spesa non hanno limiti. Con Premium l’AI è senza limiti.",
      },
      {
        q: "L’altra persona deve pagare?",
        a: "No. L’invito è gratis e Premium vale per tutto lo spazio, cioè per tutta la casa.",
      },
      {
        q: "Kangur legge i miei messaggi?",
        a: "No. Non ha accesso a nessuna app di messaggistica. Vede solo l’immagine che scegli dalla galleria. L’immagine va al fornitore di AI (OpenAI) per leggere la lista e Kangur non la salva.",
      },
      {
        q: "Cosa funziona senza segnale al supermercato?",
        a: "Spuntare i prodotti su una lista aperta: le modifiche aspettano nel telefono e partono dopo. Per creare liste e usare l’AI serve internet.",
      },
      {
        q: "C’entra con la gara Kangourou o con un desktop remoto?",
        a: "Né l’una né l’altro. Di canguri ce ne sono tanti, il nostro fa solo liste della spesa. Non controlla telefono o computer e nessuno di Kangur ti chiamerà. [[safety|Di più sulla sicurezza (in inglese)]].",
      },
    ],
  },
  closing: {
    lines: ["Uno screenshot", "e via."],
    body: "Kangur - lista della spesa con AI. Per Android e iPhone.",
    qrLabel: "Codice QR che apre Kangur su Google Play o App Store",
    qrHint: "Sei al computer? Inquadralo con il telefono.",
  },
};
