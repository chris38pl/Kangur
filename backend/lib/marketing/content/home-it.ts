import type { HomeCopy } from "@/lib/marketing/content/home-types";

export const homeIt: HomeCopy = {
  hero: {
    eyebrow: "Kangur - l’app per la lista della spesa condivisa",
    lines: ["La lista è arrivata in chat?", "Uno screenshot e via."],
    lead: "Fai uno screenshot della conversazione. Kangur ricava i prodotti, li divide per reparto e li mostra a tutta la casa. Al supermercato ti basta il pollice.",
    storesNote: "Per iPhone e Android. Senza pubblicità. 10 usi dell’AI gratis per iniziare.",
    playSmall: "SCARICA SU",
    iosSmall: "SCARICA SU",
    chatLabel: "Una conversazione di esempio da cui nasce la lista",
    screenAlt: "La lista di questa conversazione in Kangur: 22 articoli, prima frutta e verdura, poi latticini",
  },
  chat: {
    contact: "Amore ❤️",
    status: "online",
    messages: [
      ["me", "esco dal lavoro, serve qualcosa?"],
      ["them", "sì! aspetta"],
      [
        "them",
        "latte, 10 uova, pomodori, carta igienica, formaggio, pane, burro, pollo 1kg, detersivo piatti, banane, pasta, cipolle, passata x2, yogurt bianco, patate, aglio, prosciutto, caffè, cetrioli, crocchette per il cane",
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
        title: "Al supermercato basta il pollice",
        body: "A destra: preso. A sinistra: non c’era. Una mano, un reparto, poi il prossimo.",
      },
    ],
    screenAlt: "Modalità spesa in Kangur: i cetrioli scorrono a destra come acquistati nel reparto Verdura",
  },
  ways: {
    lines: ["Niente chat?", "Ci sono altri modi."],
    intro: "La lista non arriva sempre in un messaggio. A volte è sul frigo, a volte è nella testa di qualcuno.",
    photo: {
      title: "Il foglietto sul frigo",
      body: "Fagli una foto, Kangur lo ricopia. Con una calligrafia davvero difficile può sbagliare, quindi dai un’occhiata al risultato.",
      note: ["latte, 10 uova", "carta igienica", "pollo 1 kg ??", "burro (c’è ancora?)", "qualcosa per cena"],
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
      body: "Scrivi con le virgole, detta o incolla un testo. Oppure aggiungi un prodotto alla volta: dopo due lettere Kangur ti dà dei suggerimenti.",
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
    body: "Dopo la spesa vedi cosa hai preso e cosa mancava. Prima che qualcuno lo chieda.",
    screenAlt: "Riepilogo della spesa in Kangur: 18 acquistati, 1 non disponibile, 24 minuti",
  },
  price: {
    lines: ["Quanto costa?", "Ecco lo scontrino."],
    body: "Liste, inviti e modalità spesa sono gratis. Si pagano solo l’AI senza limiti e una cronologia più lunga: un abbonamento mensile per tutto lo spazio, non uno a testa.",
    receiptLabel: "I prezzi di Kangur come uno scontrino",
    receipt: [
      { kind: "head", text: "Kangur" },
      { kind: "item", text: "Liste condivise", price: "0,00" },
      { kind: "item", text: "Persone in casa", note: "quante vuoi", price: "0,00" },
      { kind: "item", text: "10 usi dell’AI per iniziare", note: "per tutto lo spazio", price: "0,00" },
      { kind: "item", text: "Pubblicità", note: "non ne teniamo", price: "-" },
      { kind: "rule" },
      { kind: "item", text: "Premium, al mese", note: "AI senza limiti, 200 liste in cronologia", price: "nell’app" },
      { kind: "foot", text: "L’app mostra il prezzo nella tua valuta." },
      { kind: "rule" },
      { kind: "total", text: "Per iniziare", price: "0,00" },
      { kind: "foot", text: "Tenga pure il resto." },
    ],
    link: "Tutti i prezzi (in inglese)",
  },
  maker: {
    lines: ["Chi c’è dietro?", "Una persona a Poznań."],
    body: "Kangur lo fa una ditta individuale polacca, Krzysztof Krawiec Software. Niente reparto pubblicità e niente vendita di dati.",
    points: [
      { title: "Non ha accesso alle app di messaggistica", body: "Riceve solo lo screenshot che scegli." },
      { title: "Non guarda contatti né GPS", body: "Non li chiede nemmeno: a una lista della spesa non servono." },
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
        a: "Kangur è un’app per la lista della spesa condivisa, su iPhone e Android. Crea la lista da uno screenshot della chat, dalla foto di un foglietto, dal nome di un piatto, dalle liste precedenti o da ciò che scrivi, e la divide per reparto. Kangur in polacco vuol dire canguro: quello arancione con la felpa turchese sull’icona.",
      },
      {
        q: "Kangur è gratis?",
        a: "Sì. I limiti sono due: 10 usi dell’AI per tutto lo spazio, che non si rinnovano, e le ultime 20 liste in cronologia. Le liste a mano, gli inviti e la modalità spesa non hanno limiti. Con Premium l’AI è senza limiti.",
      },
      {
        q: "L’altra persona deve pagare?",
        a: "No. L’invito è gratis e Premium vale per tutto lo spazio, cioè per tutta la casa.",
      },
      {
        q: "Kangur legge i miei messaggi?",
        a: "No. Non ha accesso a nessuna app di messaggistica. Riceve solo l’immagine che scegli. L’immagine va al fornitore di AI (OpenAI), che ne legge la lista. Kangur non salva l’immagine.",
      },
      {
        q: "Cosa funziona senza segnale al supermercato?",
        a: "La modalità spesa su una lista già aperta: spunti, e le modifiche partono dopo. Termina la spesa quando torna il segnale. Per creare liste e usare l’AI serve internet.",
      },
      {
        q: "C’entra con la gara Kangourou?",
        a: "No. Di canguri ce ne sono tanti, il nostro fa solo liste della spesa. [[safety|Come riconoscerci (in inglese)]].",
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
