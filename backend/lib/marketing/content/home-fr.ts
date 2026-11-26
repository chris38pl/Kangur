import type { HomeCopy } from "@/lib/marketing/content/home-types";

export const homeFr: HomeCopy = {
  hero: {
    eyebrow: "Kangur - l’appli de liste de courses partagée",
    lines: ["La liste arrive par message ?", "Une capture, c’est réglé."],
    lead: "Faites une capture de la conversation. Kangur relève les produits, les range par rayon et les montre à toute la maison. Au magasin, un coup de pouce suffit.",
    storesNote: "Pour iPhone et Android. Sans publicité. 10 utilisations de l’IA offertes pour commencer.",
    playSmall: "DISPONIBLE SUR",
    iosSmall: "TÉLÉCHARGER DANS L’",
    chatLabel: "Exemple de conversation qui devient une liste",
    screenAlt: "La liste de cette conversation dans Kangur : 22 articles, d’abord fruits et légumes, puis produits laitiers",
  },
  chat: {
    contact: "Mon cœur ❤️",
    status: "en ligne",
    messages: [
      ["me", "je sors du boulot, il faut quelque chose ?"],
      ["them", "oui ! attends"],
      [
        "them",
        "lait, œufs x10, tomates, papier toilette, fromage, pain, beurre, poulet 1kg, liquide vaisselle, bananes, pâtes, oignons, passata x2, yaourt nature, pommes de terre, ail, jambon, café, concombres, croquettes pour le chien",
      ],
      ["them", "n’oublie rien 😘"],
      ["them", "ah et peut-être des chips"],
      ["them", "prends 2 paquets à l’oignon"],
      ["them", "eeet de la lessive, y’en a plus"],
    ],
  },
  steps: {
    lines: ["Tout recopier ?", "La vie est trop courte."],
    items: [
      {
        pill: "Étape 1",
        title: "Une capture d’écran",
        body: "Parfois un long message avec des virgules, parfois sept avec un « eeet de la lessive » à la fin. Dans les deux cas, ça marche.",
      },
      {
        pill: "Étape 2",
        title: "Kangur fait la liste",
        body: "Il repère les produits et les quantités, et laisse « n’oublie rien 😘 » tranquille. Cette conversation a donné 22 articles.",
      },
      {
        pill: "Étape 3",
        title: "Au magasin, un coup de pouce",
        body: "À droite : acheté. À gauche : pas en rayon. Une main, un rayon, rayon suivant.",
      },
    ],
    screenAlt: "Mode courses dans Kangur : les concombres glissent vers la droite, achetés, au rayon Légumes",
  },
  ways: {
    lines: ["Pas de message ?", "Il y a d’autres moyens."],
    intro: "La liste n’arrive pas toujours par message. Parfois elle est sur le frigo, parfois dans la tête de quelqu’un.",
    photo: {
      title: "Le mot sur le frigo",
      body: "Prenez-le en photo, Kangur recopie. Une écriture vraiment illisible peut le tromper, alors jetez un œil au résultat.",
      note: ["lait, œufs 10", "papier toilette", "poulet 1 kg ??", "beurre (il en reste ?)", "un truc pour ce soir"],
    },
    dish: {
      title: "Le plat de ce soir",
      body: "Tapez « carbonara » et « bruschetta » : les ingrédients arrivent sur une seule liste. Sel et poivre une fois, pas deux. Décochez ce que vous avez.",
      screenAlt: "Ingrédients de la carbonara dans Kangur, à décocher",
    },
    usual: {
      title: "Comme d’habitude",
      body: "Kangur rassemble les produits de vos cinq dernières listes et montre ceux qui reviennent le plus. Vous gardez ce qu’il faut.",
      screenAlt: "Suggestion depuis l’historique dans Kangur : bananes, tomates et lait, achetés 5 fois",
    },
    typed: {
      title: "De tête",
      body: "Écrivez avec des virgules, dictez ou collez un texte. Ou ajoutez les produits un par un : Kangur fait des propositions dès la deuxième lettre.",
      chips: ["lait", "pain", "un truc sucré"],
    },
  },
  together: {
    lines: ["Deux téléphones,", "une seule liste."],
    body: "Quelqu’un ajoute du beurre depuis le canapé, quelqu’un d’autre du café sur le chemin du magasin. Un instant plus tard, tout est sur vos deux téléphones.",
    points: [
      "Invitez par e-mail autant de personnes que vous voulez",
      "Les invitations sont gratuites",
      "iPhone et Android sur la même liste",
      "Le téléphone prévient quand quelqu’un commence les courses",
    ],
    screenAlt: "Un espace partagé dans Kangur avec les personnes qui ont accès à la liste",
  },
  summary: {
    lines: ["Des poivrons ?", "Y’en avait pas."],
    body: "Après les courses, on voit ce qui a été acheté et ce qui manquait. Avant même qu’on vous le demande.",
    screenAlt: "Récapitulatif des courses dans Kangur : 18 achetés, 1 indisponible, 24 minutes",
  },
  price: {
    lines: ["Combien ça coûte ?", "Voici le ticket."],
    body: "Les listes, le partage et le mode courses sont gratuits. Seuls l’IA sans limite et un historique plus long sont payants : un abonnement mensuel pour tout l’espace, pas un par personne.",
    receiptLabel: "Les prix de Kangur sur un ticket de caisse",
    receipt: [
      { kind: "head", text: "Kangur" },
      { kind: "item", text: "Listes partagées", price: "0,00" },
      { kind: "item", text: "Votre foyer", note: "sans limite", price: "0,00" },
      { kind: "item", text: "10 utilisations de l’IA", note: "pour tout l’espace", price: "0,00" },
      { kind: "item", text: "Publicité", note: "on n’en fait pas", price: "-" },
      { kind: "rule" },
      { kind: "item", text: "Premium, par mois", note: "IA sans limite, 200 listes dans l’historique", price: "dans l’appli" },
      { kind: "foot", text: "L’appli affiche le prix dans votre devise." },
      { kind: "rule" },
      { kind: "total", text: "Pour commencer", price: "0,00" },
      { kind: "foot", text: "Gardez la monnaie." },
    ],
    link: "Tous les prix (en anglais)",
  },
  maker: {
    lines: ["Qui est derrière ?", "Une personne à Poznań."],
    body: "Kangur est l’œuvre d’une entreprise individuelle polonaise, Krzysztof Krawiec Software. Pas de régie publicitaire, pas de vente de données.",
    points: [
      { title: "N’a pas accès à vos messageries", body: "Il ne reçoit que la capture que vous choisissez." },
      { title: "Ne regarde ni vos contacts ni le GPS", body: "Il ne les demande même pas : une liste de courses n’en a pas besoin." },
      { title: "N’a pas de publicité", body: "Il vit de Premium, pas de votre attention." },
    ],
    safetyLink: "Les autorisations utilisées (en anglais)",
    aboutLink: "D’où il vient (en anglais)",
  },
  faq: {
    lines: ["Avant de télécharger,", "en bref."],
    items: [
      {
        q: "Qu’est-ce que Kangur ?",
        a: "Kangur est une appli de listes de courses partagées pour iPhone et Android. Elle fait une liste à partir d’une capture de conversation, d’une photo de note manuscrite, du nom d’un plat, de vos listes précédentes ou de ce que vous tapez, et range le tout par rayon. Kangur veut dire kangourou en polonais. C’est lui sur l’icône : pelage orange, sweat turquoise.",
      },
      {
        q: "Kangur est-il gratuit ?",
        a: "Oui. Il y a deux limites : 10 utilisations de l’IA pour tout l’espace, qui ne se renouvellent pas, et les 20 dernières listes dans l’historique. Les listes à la main, le partage et le mode courses sont illimités. Premium donne l’IA sans limite.",
      },
      {
        q: "L’autre personne doit-elle payer ?",
        a: "Non. L’invitation est gratuite et Premium couvre tout l’espace, donc toute la maison.",
      },
      {
        q: "Kangur lit-il mes messages ?",
        a: "Non. Il n’a accès à aucune messagerie. Il ne reçoit que l’image que vous choisissez. Elle est envoyée au fournisseur d’IA (OpenAI), qui y lit la liste. Kangur ne conserve pas l’image.",
      },
      {
        q: "Que se passe-t-il sans réseau au magasin ?",
        a: "Le mode courses sur une liste déjà ouverte : vous cochez, les changements partent plus tard. Terminez les courses une fois le réseau revenu. Pour une nouvelle liste ou l’IA, il faut internet.",
      },
      {
        q: "Y a-t-il un lien avec le concours Kangourou ?",
        a: "Aucun. Il y a beaucoup de kangourous, le nôtre ne fait que des listes de courses. [[safety|Comment nous reconnaître (en anglais)]].",
      },
    ],
  },
  closing: {
    lines: ["Une capture,", "c’est réglé."],
    body: "Kangur - liste de courses avec l’IA. Pour Android et iPhone.",
    qrLabel: "QR code qui ouvre Kangur dans Google Play ou l’App Store",
    qrHint: "Sur un ordinateur ? Scannez avec le téléphone.",
  },
};
