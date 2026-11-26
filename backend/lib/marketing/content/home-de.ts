import type { HomeCopy } from "@/lib/marketing/content/home-types";

export const homeDe: HomeCopy = {
  hero: {
    eyebrow: "Kangur - die App für gemeinsame Einkaufslisten",
    lines: ["Die Liste kam per Chat?", "Screenshot, fertig."],
    lead: "Mach einen Screenshot vom Chat. Kangur schreibt die Produkte heraus, sortiert sie nach Gängen und zeigt sie allen zu Hause. Im Laden wischst du nur noch.",
    storesNote: "Für iPhone und Android. Ohne Werbung. 10 kostenlose KI-Nutzungen zum Start.",
    playSmall: "JETZT BEI",
    iosSmall: "LADEN IM",
    chatLabel: "Ein Beispielchat, aus dem die Liste entsteht",
    screenAlt: "Die Liste aus diesem Chat in Kangur: 22 Artikel, zuerst Obst und Gemüse, dann Milchprodukte",
  },
  chat: {
    contact: "Schatz ❤️",
    status: "jetzt aktiv",
    messages: [
      ["me", "hab feierabend, brauchen wir noch was?"],
      ["them", "ja! warte"],
      [
        "them",
        "milch, 10 eier, tomaten, klopapier, käse, brot, butter, 1kg hähnchen, spülmittel, bananen, nudeln, zwiebeln, 2x passata, naturjoghurt, kartoffeln, knoblauch, schinken, kaffee, gurken, hundefutter",
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
        body: "Es erkennt Produkte und Mengen und lässt „vergiss nichts 😘“ in Ruhe. Aus diesem Chat wurden 22 Artikel.",
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
    intro: "Die Liste kommt nicht immer als Nachricht. Manchmal hängt sie am Kühlschrank, manchmal hat sie jemand nur im Kopf.",
    photo: {
      title: "Der Zettel am Kühlschrank",
      body: "Foto machen, Kangur schreibt ab. Bei sehr unleserlicher Schrift kann es sich irren, also wirf einen Blick aufs Ergebnis.",
      note: ["Milch, 10 Eier", "Klopapier", "Hähnchen 1 kg ??", "Butter (noch da?)", "was zum Abendessen"],
    },
    dish: {
      title: "Das Gericht für heute",
      body: "Tipp „Carbonara“ und „Bruschetta“ ein, und die Zutaten stehen auf einer Liste. Salz und Pfeffer einmal, nicht zweimal. Was du schon hast, wählst du ab.",
      screenAlt: "Zutaten für Carbonara in Kangur zum Abwählen",
    },
    usual: {
      title: "Das Übliche",
      body: "Kangur sammelt Produkte aus deinen letzten fünf Listen und zeigt, welche immer wiederkommen. Du behältst, was du brauchst.",
      screenAlt: "Vorschlag aus dem Verlauf in Kangur: Bananen, Tomaten und Milch mit dem Hinweis 5-mal gekauft",
    },
    typed: {
      title: "Aus dem Kopf",
      body: "Tipp alles mit Kommas ein, diktiere oder füge Text aus der Zwischenablage ein. Oder einzeln: Nach zwei Buchstaben macht Kangur Vorschläge.",
      chips: ["Milch", "Brot", "was Süßes"],
    },
  },
  together: {
    lines: ["Zwei Handys,", "eine Liste."],
    body: "Jemand schreibt vom Sofa aus Butter dazu, jemand anders auf dem Weg zum Laden noch Kaffee. Kurz darauf seht ihr beide beides.",
    points: [
      "Per E-Mail lädst du so viele Leute ein, wie du willst",
      "Einladungen kosten nichts",
      "iPhone und Android auf derselben Liste",
      "Dein Handy meldet sich, wenn jemand den Einkauf startet",
    ],
    screenAlt: "Ein gemeinsamer Bereich in Kangur mit den Personen, die Zugriff auf die Liste haben",
  },
  summary: {
    lines: ["Paprika?", "War keine da."],
    body: "Nach dem Einkauf siehst du, was gekauft wurde und was fehlte. Bevor jemand fragt.",
    screenAlt: "Einkaufszusammenfassung in Kangur: 18 gekauft, 1 nicht verfügbar, 24 Minuten",
  },
  price: {
    lines: ["Was kostet das?", "Hier ist der Bon."],
    body: "Listen, Teilen und Einkaufsmodus sind kostenlos. Geld kosten nur KI ohne Limit und ein längerer Verlauf: ein Monatsabo für den ganzen Bereich, nicht eins pro Person.",
    receiptLabel: "Preise von Kangur als Kassenbon",
    receipt: [
      { kind: "head", text: "Kangur" },
      { kind: "item", text: "Gemeinsame Listen", price: "0,00" },
      { kind: "item", text: "Leute im Haushalt", note: "so viele du willst", price: "0,00" },
      { kind: "item", text: "10 KI-Nutzungen zum Start", note: "für den ganzen Bereich", price: "0,00" },
      { kind: "item", text: "Werbung", note: "führen wir nicht", price: "-" },
      { kind: "rule" },
      { kind: "item", text: "Premium, monatlich", note: "KI ohne Limit, 200 Listen im Verlauf", price: "in der App" },
      { kind: "foot", text: "Den Preis in deiner Währung zeigt die App." },
      { kind: "rule" },
      { kind: "total", text: "Zum Start", price: "0,00" },
      { kind: "foot", text: "Stimmt so." },
    ],
    link: "Alle Preise (Englisch)",
  },
  maker: {
    lines: ["Wer steckt dahinter?", "Eine Person in Poznań."],
    body: "Hinter Kangur steht ein Ein-Personen-Unternehmen aus Polen, Krzysztof Krawiec Software. Ohne Werbeabteilung und ohne Datenverkauf.",
    points: [
      { title: "Hat keinen Zugriff auf Messenger", body: "Es bekommt nur den Screenshot, den du auswählst." },
      { title: "Schaut weder in Kontakte noch ins GPS", body: "Kangur fragt gar nicht danach: Für eine Einkaufsliste braucht man beides nicht." },
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
        a: "Kangur ist eine App für gemeinsame Einkaufslisten auf iPhone und Android. Sie macht eine Liste aus einem Chat-Screenshot, dem Foto eines Zettels, dem Namen eines Gerichts, früheren Listen oder dem, was du tippst, und sortiert alles nach Gängen. Kangur ist Polnisch für Känguru: das orangefarbene im türkisen Hoodie auf dem Icon.",
      },
      {
        q: "Ist Kangur kostenlos?",
        a: "Ja. Es gibt zwei Grenzen: 10 KI-Nutzungen für den ganzen Bereich, die sich nicht erneuern, und die letzten 20 Listen im Verlauf. Listen von Hand, Teilen und der Einkaufsmodus sind unbegrenzt. KI ohne Limit gibt es mit Premium.",
      },
      {
        q: "Muss die andere Person bezahlen?",
        a: "Nein. Die Einladung ist kostenlos, und Premium gilt für den ganzen Bereich, also für alle zu Hause.",
      },
      {
        q: "Liest Kangur meine Nachrichten?",
        a: "Nein. Kangur hat auf keinen Messenger Zugriff. Es bekommt nur das eine Bild, das du auswählst. Das Bild geht an den KI-Anbieter (OpenAI), der die Liste ausliest. Kangur speichert das Bild nicht.",
      },
      {
        q: "Was funktioniert ohne Empfang im Laden?",
        a: "Der Einkaufsmodus auf einer Liste, die schon offen ist: Du hakst ab, die Änderungen werden später gesendet. Beende den Einkauf, wenn du wieder Empfang hast. Für neue Listen und die KI brauchst du Internet.",
      },
      {
        q: "Hat das etwas mit dem Känguru-Wettbewerb zu tun?",
        a: "Nein. Kängurus gibt es viele, unseres kann nur Einkaufslisten. [[safety|So erkennst du uns (Englisch)]].",
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
