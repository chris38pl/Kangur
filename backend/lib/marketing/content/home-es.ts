import type { HomeCopy } from "@/lib/marketing/content/home-types";

export const homeEs: HomeCopy = {
  hero: {
    eyebrow: "Kangur - la app de lista de la compra compartida",
    lines: ["¿La lista llegó por el chat?", "Una captura y listo."],
    lead: "Haz una captura de la conversación. Kangur saca los productos, los ordena por pasillos y los enseña a todos en casa. En el súper solo deslizas.",
    storesNote: "Para iPhone y Android. Sin anuncios. 10 usos de IA gratis para empezar.",
    playSmall: "DISPONIBLE EN",
    iosSmall: "DESCARGAR EN",
    chatLabel: "Conversación de ejemplo de la que sale la lista",
    screenAlt: "La misma lista en Kangur: 22 artículos, primero fruta y verdura, luego lácteos",
  },
  chat: {
    contact: "Cariño ❤️",
    status: "en línea",
    messages: [
      ["me", "salgo del trabajo, ¿compro algo?"],
      ["them", "¡sí! espera"],
      [
        "them",
        "leche, huevos 10, tomates, papel higiénico, queso, pan, mantequilla, pollo 1kg, lavavajillas, plátanos, pasta, cebolla, passata x2, yogur natural, patatas, ajo, jamón, café, pepinos, pienso para el perro",
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
      note: ["leche, huevos 10", "papel higiénico", "pollo 1 kg ??", "mantequilla (¿queda?)", "algo para cenar"],
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
      body: "Escribe con comas, dicta o pega un texto. O añade uno a uno: Kangur sugiere con dos letras.",
      chips: ["leche", "pan", "algo dulce"],
    },
  },
  together: {
    lines: ["Dos móviles,", "una sola lista."],
    body: "Alguien añade mantequilla desde el sofá y alguien café de camino al súper. Al momento las dos cosas están en la lista de los dos.",
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
    body: "Después de la compra ves qué se compró, qué faltó y cuánto tardaste. Antes de que alguien pregunte.",
    screenAlt: "Resumen de la compra en Kangur: 18 comprados, 1 no disponible, 24 minutos",
  },
  price: {
    lines: ["¿Cuánto cuesta?", "Aquí va el ticket."],
    body: "Las listas, tu casa y el modo compra son gratis. Solo se paga la IA sin límite y un historial más largo, una vez por todo el espacio y no por persona.",
    receiptLabel: "Precios de Kangur en forma de ticket",
    receipt: [
      { kind: "head", text: "Kangur" },
      { kind: "item", text: "Listas compartidas", price: "0,00" },
      { kind: "item", text: "Tu gente", note: "toda la que quieras", price: "0,00" },
      { kind: "item", text: "10 usos de IA para empezar", price: "0,00" },
      { kind: "item", text: "Anuncios", note: "no nos quedan", price: "-" },
      { kind: "rule" },
      { kind: "item", text: "Premium", note: "IA sin límite, 200 listas en el historial", price: "en la tienda" },
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
      { title: "No conoce tus contactos ni tu ubicación", body: "No los pide: una lista de la compra no los necesita." },
      { title: "No tiene anuncios", body: "Vive de Premium, no de tu atención." },
    ],
    safetyLink: "Qué permisos usa Kangur (en inglés)",
    aboutLink: "De dónde viene (en inglés)",
  },
  faq: {
    lines: ["Antes de descargar,", "en corto."],
    items: [
      {
        q: "¿Qué es Kangur?",
        a: "Kangur es una app para iPhone y Android de listas de la compra compartidas. Hace la lista a partir de una captura del chat, la foto de una nota, el nombre de un plato, tus listas anteriores o lo que escribas, y la ordena por pasillos. Kangur significa canguro en polaco: el naranja con sudadera turquesa del icono.",
      },
      {
        q: "¿Kangur es gratis?",
        a: "Sí, con un límite: empiezas con 10 usos de IA que no se renuevan. Las listas a mano, tu gente y el modo compra no tienen límite. La IA sin límite viene con Premium.",
      },
      {
        q: "¿La otra persona tiene que pagar?",
        a: "No. La invitación es gratis y Premium vale para todo el espacio, o sea, para toda la casa.",
      },
      {
        q: "¿Kangur lee mis mensajes?",
        a: "No. No tiene acceso a ninguna app de mensajería. Solo ve la imagen que eliges de la galería. La imagen va al proveedor de IA (OpenAI) para leer la lista y Kangur no la guarda.",
      },
      {
        q: "¿Qué funciona sin cobertura en el súper?",
        a: "Marcar productos en una lista abierta: los cambios esperan en el móvil y se envían después. Crear listas y usar la IA necesita internet.",
      },
      {
        q: "¿Tiene que ver con el concurso Canguro o con un escritorio remoto?",
        a: "Con ninguno. Canguros hay muchos, el nuestro solo hace listas de la compra. No controla el móvil ni el ordenador y nadie de Kangur te va a llamar. [[safety|Más sobre seguridad (en inglés)]].",
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
