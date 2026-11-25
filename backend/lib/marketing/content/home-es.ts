import type { HomeCopy } from "@/lib/marketing/content/home-types";

export const homeEs: HomeCopy = {
  hero: {
    eyebrow: "Kangur - la app de lista de la compra compartida",
    lines: ["¿La lista está en el chat?", "Una captura y listo."],
    lead: "Haz una captura de la conversación. Kangur saca los productos, los ordena por pasillos y los comparte con toda la casa. En el súper solo deslizas.",
    storesNote: "Para iPhone y Android. Sin anuncios. 10 usos de IA gratis para empezar.",
    playSmall: "DISPONIBLE EN",
    iosSmall: "DESCÁRGALO EN EL",
    chatLabel: "Conversación de ejemplo de la que sale la lista",
    screenAlt: "La lista de esta conversación en Kangur: 22 artículos, primero fruta y verdura, luego lácteos",
  },
  chat: {
    contact: "Cariño ❤️",
    status: "en línea",
    messages: [
      ["me", "salgo del curro, compro algo?"],
      ["them", "sí! espera"],
      [
        "them",
        "leche, 10 huevos, tomates, papel higiénico, queso, pan, mantequilla, pollo 1kg, lavavajillas, plátanos, pasta, cebolla, passata x2, yogur natural, patatas, ajo, jamón, café, pepinos, pienso para el perro",
      ],
      ["them", "que no se te olvide nada 😘"],
      ["them", "ah y unas patatas fritas"],
      ["them", "mejor 2 bolsas de las de cebolla"],
      ["them", "yyy detergente, que se ha acabado"],
    ],
  },
  steps: {
    lines: ["¿Copiarla a mano?", "Ni hablar."],
    items: [
      {
        pill: "Paso 1",
        title: "Captura del chat",
        body: "A veces es un mensaje larguísimo con comas, a veces son siete con un «yyy detergente» al final. Valen los dos.",
      },
      {
        pill: "Paso 2",
        title: "Kangur hace la lista",
        body: "Detecta productos y cantidades, y deja en paz el «que no se te olvide nada 😘». De este chat salieron 22 artículos.",
      },
      {
        pill: "Paso 3",
        title: "En el súper, desliza",
        body: "A la derecha: comprado. A la izquierda: no había. Una mano, un pasillo, el siguiente.",
      },
    ],
    screenAlt: "Modo compra en Kangur: los pepinos se deslizan a la derecha como comprados en el pasillo Verduras",
  },
  ways: {
    lines: ["¿No hay chat?", "Hay otras formas."],
    intro: "La lista no siempre llega en un mensaje. A veces está en la nevera y a veces en la cabeza de alguien.",
    photo: {
      title: "La nota de la nevera",
      body: "Hazle una foto y Kangur la copia. Con una letra muy difícil puede equivocarse, así que échale un vistazo.",
      note: ["leche, 10 huevos", "papel higiénico", "pollo 1 kg ??", "mantequilla (¿queda?)", "algo para cenar"],
    },
    dish: {
      title: "El plato de hoy",
      body: "Escribe «carbonara» y «bruschetta» y tendrás los ingredientes en una sola lista. Sal y pimienta una vez, no dos. Desmarca lo que ya tienes.",
      screenAlt: "Ingredientes de la carbonara en Kangur, listos para desmarcar",
    },
    usual: {
      title: "Lo de siempre",
      body: "Kangur reúne los productos de tus cinco últimas listas y enseña cuáles se repiten más. Te quedas con los que hacen falta.",
      screenAlt: "Sugerencia del historial en Kangur: plátanos, tomates y leche, comprados 5 veces",
    },
    typed: {
      title: "De memoria",
      body: "Escribe con comas, dicta o pega un texto. O añádelos de uno en uno: con dos letras, Kangur ya te da ideas.",
      chips: ["leche", "pan", "algo dulce"],
    },
  },
  together: {
    lines: ["Dos móviles,", "una sola lista."],
    body: "Alguien añade mantequilla desde el sofá y otra persona, café de camino al súper. Un momento después, las dos cosas están en los dos móviles.",
    points: [
      "Invita por correo a todas las personas que quieras",
      "Las invitaciones no cuestan nada",
      "iPhone y Android en la misma lista",
      "El móvil avisa cuando alguien empieza la compra",
    ],
    screenAlt: "Un espacio compartido en Kangur con las personas que tienen acceso a la lista",
  },
  summary: {
    lines: ["¿Pimientos?", "No había."],
    body: "Después de la compra ves qué se compró y qué faltó. Antes de que alguien pregunte.",
    screenAlt: "Resumen de la compra en Kangur: 18 comprados, 1 no disponible, 24 minutos",
  },
  price: {
    lines: ["¿Cuánto cuesta?", "Aquí va el ticket."],
    body: "Hacer listas, compartirlas en casa y usar el modo compra es gratis. Solo se paga la IA sin límite y un historial más largo: una suscripción mensual para todo el espacio, no una por persona.",
    receiptLabel: "Precios de Kangur en forma de ticket",
    receipt: [
      { kind: "head", text: "Kangur" },
      { kind: "item", text: "Listas compartidas", price: "0,00" },
      { kind: "item", text: "Tu gente", note: "toda la que quieras", price: "0,00" },
      { kind: "item", text: "10 usos de IA para empezar", note: "para todo el espacio", price: "0,00" },
      { kind: "item", text: "Anuncios", note: "no los trabajamos", price: "-" },
      { kind: "rule" },
      { kind: "item", text: "Premium, al mes", note: "IA sin límite, 200 listas en el historial", price: "en la app" },
      { kind: "foot", text: "La app muestra el precio en tu moneda." },
      { kind: "rule" },
      { kind: "total", text: "Para empezar", price: "0,00" },
      { kind: "foot", text: "Quédate con el cambio." },
    ],
    link: "Todos los precios (en inglés)",
  },
  maker: {
    lines: ["¿Quién está detrás?", "Una persona en Poznań."],
    body: "Kangur lo hace una empresa unipersonal de Polonia, Krzysztof Krawiec Software. Sin departamento de publicidad y sin vender datos.",
    points: [
      { title: "No lee tus chats", body: "Solo ve la captura que eliges." },
      { title: "No mira tus contactos ni el GPS", body: "Ni siquiera los pide: una lista de la compra no los necesita." },
      { title: "No tiene anuncios", body: "Vive de Premium, no de tu atención." },
    ],
    safetyLink: "Qué permisos usa Kangur (en inglés)",
    aboutLink: "De dónde viene (en inglés)",
  },
  faq: {
    lines: ["Antes de descargar,", "en pocas palabras."],
    items: [
      {
        q: "¿Qué es Kangur?",
        a: "Kangur es una app de listas de la compra compartidas para iPhone y Android. Hace la lista a partir de una captura del chat, la foto de una nota, el nombre de un plato, tus listas anteriores o lo que escribas, y la ordena por pasillos. Kangur significa canguro en polaco: el naranja con sudadera turquesa del icono.",
      },
      {
        q: "¿Kangur es gratis?",
        a: "Sí. Hay dos límites: 10 usos de IA para todo el espacio, que no se renuevan, y las 20 últimas listas en el historial. Las listas a mano, compartir y el modo compra no tienen límite. La IA sin límite viene con Premium.",
      },
      {
        q: "¿La otra persona tiene que pagar?",
        a: "No. La invitación es gratis y Premium vale para todo el espacio, o sea, para toda la casa.",
      },
      {
        q: "¿Kangur lee mis mensajes?",
        a: "No. No tiene acceso a ninguna app de mensajería. Solo ve la imagen que eliges de la galería. La imagen va al proveedor de IA (OpenAI), que lee en ella la lista. Kangur no guarda la imagen.",
      },
      {
        q: "¿Qué funciona sin cobertura en el súper?",
        a: "El modo compra en una lista que ya tienes abierta: marcas y añades, y los cambios se envían después. Para crear listas y usar la IA hace falta internet.",
      },
      {
        q: "¿Tiene que ver con el concurso Canguro?",
        a: "No. Canguros hay muchos, el nuestro solo hace listas de la compra. [[safety|Cómo reconocernos (en inglés)]].",
      },
    ],
  },
  closing: {
    lines: ["Una captura", "y listo."],
    body: "Kangur - lista de la compra con IA. Para Android y iPhone.",
    qrLabel: "Código QR que abre Kangur en Google Play o en el App Store",
    qrHint: "¿Estás en el ordenador? Escanéalo con el móvil.",
  },
};
