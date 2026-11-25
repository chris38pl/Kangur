import type { HomeCopy } from "@/lib/marketing/content/home-types";

export const homeDe: HomeCopy = {
  hero: {
    eyebrow: "Kangur - die App für gemeinsame Einkaufslisten",
    lines: ["Die Liste kam im Chat?", "Screenshot, fertig."],
    lead: "Mach einen Screenshot vom Gespräch. Kangur schreibt die Produkte heraus, sortiert sie nach Gängen und zeigt sie allen zu Hause. Im Laden wischst du nur noch.",
    storesNote: "Für iPhone und Android. Ohne Werbung. 10 kostenlose KI-Nutzungen zum Start.",
    playSmall: "JETZT BEI",
    iosSmall: "LADEN IM",
    chatLabel: "Ein Beispielgespräch, aus dem die Liste entsteht",
    screenAlt: "Dieselbe Liste in Kangur: 22 Artikel, zuerst Obst und Gemüse, dann Milchprodukte",
  },
  chat: {
    contact: "Schatz ❤️",
    status: "jetzt aktiv",
    messages: [
      ["me", "komme gleich von der arbeit, brauchst du was?"],
      ["them", "ja! warte"],
      [
        "them",
        "milch, eier 10 stück, tomaten, klopapier, käse, brot, butter, hähnchen 1kg, spülmittel, bananen, nudeln, zwiebeln, passata 2x, naturjoghurt, kartoffeln, knoblauch, schinken, kaffee, gurken, futter für den hund",
      ],
      ["them", "vergiss nichts 😘"],
      ["them", "ach und vielleicht chips"],
      ["them", "am besten 2 tüten paprika"],
      ["them", "uuund waschmittel, ist alle"],
    ],
  },
  steps: {
    lines: ["Abtippen?", "Lieber nicht."],
    items: [
      {
        pill: "Schritt 1",
        title: "Screenshot vom Chat",
        body: "Mal ist es eine lange Nachricht mit Kommas, mal sind es sieben mit „uuund waschmittel“ am Ende. Beides geht.",
      },
      {
        pill: "Schritt 2",
        title: "Kangur macht die Liste",
        body: "Es erkennt Produkte und Mengen und lässt „vergiss nichts 😘“ in Ruhe. Aus diesem Gespräch wurden 22 Artikel.",
      },
      {
        pill: "Schritt 3",
        title: "Im Laden nur wischen",
        body: "Nach rechts: gekauft. Nach links: nicht da. Eine Hand, ein Gang, nächster Gang.",
      },
    ],
    screenAlt: "Einkaufsmodus in Kangur: Gurken werden im Gang Gemüse als gekauft nach rechts gewischt",
  },
  ways: {
    lines: ["Kein Chat?", "Es geht auch anders."],
    intro: "Die Liste kommt nicht immer als Nachricht. Manchmal hängt sie am Kühlschrank, manchmal steckt sie in jemandes Kopf.",
    photo: {
      title: "Der Zettel am Kühlschrank",
      body: "Foto machen, Kangur schreibt ab. Bei sehr unleserlicher Schrift kann es sich irren, also wirf einen Blick darauf.",
      note: ["Milch, Eier 10", "Klopapier", "Hähnchen 1 kg ??", "Butter (noch da?)", "was zum Abendessen"],
    },
    dish: {
      title: "Das Gericht für heute",
      body: "Tippe „Carbonara“ und „Bruschetta“ und bekomme die Zutaten auf einer Liste. Salz und Pfeffer einmal, nicht zweimal. Was du schon hast, wählst du ab.",
      screenAlt: "Zutaten für Carbonara in Kangur zum Abwählen",
    },
    usual: {
      title: "Das Übliche",
      body: "Kangur sammelt Produkte aus deinen letzten fünf Listen und zeigt, welche immer wiederkommen. Du behältst, was du brauchst.",
      screenAlt: "Vorschlag aus dem Verlauf in Kangur: Bananen, Tomaten und Milch mit dem Hinweis 5-mal gekauft",
    },
    typed: {
      title: "Aus dem Kopf",
      body: "Tippe mit Kommas, diktiere oder füge Text aus der Zwischenablage ein. Oder einzeln: Kangur schlägt nach zwei Buchstaben vor.",
      chips: ["Milch", "Brot", "was Süßes"],
    },
  },
  together: {
    lines: ["Zwei Handys,", "eine Liste."],
    body: "Jemand schreibt vom Sofa Butter dazu, jemand auf dem Weg zum Laden Kaffee. Kurz darauf steht beides bei euch beiden.",
    points: [
      "Einladung per E-Mail, so viele Leute du willst",
      "Einladungen kosten nichts",
      "iPhone und Android auf derselben Liste",
      "Dein Handy meldet sich, wenn jemand einkaufen geht",
    ],
    screenAlt: "Ein gemeinsamer Bereich in Kangur mit den Personen, die Zugriff auf die Liste haben",
  },
  summary: {
    lines: ["Paprika?", "War keine da."],
    body: "Nach dem Einkauf siehst du, was gekauft wurde, was fehlte und wie lange es gedauert hat. Bevor jemand fragt.",
    screenAlt: "Einkaufszusammenfassung in Kangur: 18 gekauft, 1 nicht verfügbar, 24 Minuten",
  },
  price: {
    lines: ["Was kostet das?", "Hier ist der Bon."],
    body: "Listen, Haushalt und Einkaufsmodus sind kostenlos. Bezahlt werden nur KI ohne Limit und ein längerer Verlauf, einmal für den ganzen Bereich, nicht pro Person.",
    receiptLabel: "Preise von Kangur als Kassenbon",
    receipt: [
      { kind: "head", text: "Kangur" },
      { kind: "item", text: "Gemeinsame Listen", price: "0,00" },
      { kind: "item", text: "Dein Haushalt", note: "so viele du willst", price: "0,00" },
      { kind: "item", text: "10 KI-Nutzungen zum Start", price: "0,00" },
      { kind: "item", text: "Werbung", note: "führen wir nicht", price: "-" },
      { kind: "rule" },
      { kind: "item", text: "Premium", note: "KI ohne Limit, 200 Listen im Verlauf", price: "im Store" },
      { kind: "foot", text: "Den Preis in deiner Währung zeigt die App." },
      { kind: "rule" },
      { kind: "total", text: "Zum Start", price: "0,00" },
      { kind: "foot", text: "Stimmt so." },
    ],
    link: "Alle Preise (Englisch)",
  },
  maker: {
    lines: ["Wer steckt dahinter?", "Eine Person in Posen."],
    body: "Kangur macht ein Ein-Personen-Unternehmen aus Polen, Krzysztof Krawiec Software. Ohne Werbeabteilung und ohne Datenverkauf.",
    points: [
      { title: "Liest keine Chats", body: "Es sieht nur den Screenshot, den du auswählst." },
      { title: "Kennt weder Kontakte noch Standort", body: "Es fragt nicht danach, eine Einkaufsliste braucht sie nicht." },
      { title: "Hat keine Werbung", body: "Es lebt von Premium, nicht von deiner Aufmerksamkeit." },
    ],
    safetyLink: "Welche Berechtigungen Kangur nutzt (Englisch)",
    aboutLink: "Woher es kommt (Englisch)",
  },
  faq: {
    lines: ["Vor dem Download,", "kurz gesagt."],
    items: [
      {
        q: "Was ist Kangur?",
        a: "Kangur ist eine App für iPhone und Android für gemeinsame Einkaufslisten. Sie macht eine Liste aus einem Chat-Screenshot, dem Foto eines Zettels, dem Namen eines Gerichts, früheren Listen oder dem, was du tippst, und sortiert alles nach Gängen. Kangur ist Polnisch für Känguru: das orangefarbene im türkisen Hoodie auf dem Icon.",
      },
      {
        q: "Ist Kangur kostenlos?",
        a: "Ja, mit einer Grenze: Zum Start bekommst du 10 KI-Nutzungen, die sich nicht erneuern. Listen von Hand, dein Haushalt und der Einkaufsmodus sind unbegrenzt. KI ohne Limit gibt es mit Premium.",
      },
      {
        q: "Muss die andere Person bezahlen?",
        a: "Nein. Die Einladung ist kostenlos, und Premium gilt für den ganzen Bereich, also für alle zu Hause.",
      },
      {
        q: "Liest Kangur meine Nachrichten?",
        a: "Nein. Es hat keinen Zugriff auf irgendeinen Messenger. Es sieht nur das eine Bild, das du aus der Galerie wählst. Das Bild geht an den KI-Anbieter (OpenAI), um die Liste zu lesen, und Kangur speichert es nicht.",
      },
      {
        q: "Was funktioniert ohne Empfang im Laden?",
        a: "Abhaken auf einer geöffneten Liste: Änderungen warten auf dem Handy und werden später gesendet. Listen erstellen und KI brauchen Internet.",
      },
      {
        q: "Hat das etwas mit dem Känguru-Wettbewerb oder mit Fernzugriff zu tun?",
        a: "Weder noch. Kängurus gibt es viele, unseres kann nur Einkaufslisten. Es steuert weder Handy noch Computer, und von uns ruft niemand an. [[safety|Mehr zur Sicherheit (Englisch)]].",
      },
    ],
  },
  closing: {
    lines: ["Screenshot,", "fertig."],
    body: "Kangur - Einkaufsliste mit KI. Für Android und iPhone.",
    qrLabel: "QR-Code, der Kangur in Google Play oder im App Store öffnet",
    qrHint: "Am Computer? Mit dem Handy scannen.",
  },
};
