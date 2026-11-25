import type { HomeCopy } from "@/lib/marketing/content/home-types";

export const homeFr: HomeCopy = {
  hero: {
    eyebrow: "Kangur - l’appli de liste de courses partagée",
    lines: ["La liste est dans le chat ?", "Une capture, c’est réglé."],
    lead: "Faites une capture de la conversation. Kangur relève les produits, les range par rayon et les montre à toute la maison. Au magasin, il suffit de glisser.",
    storesNote: "Pour iPhone et Android. Sans publicité. 10 utilisations de l’IA offertes pour commencer.",
    playSmall: "DISPONIBLE SUR",
    iosSmall: "TÉLÉCHARGER DANS",
    chatLabel: "Exemple de conversation qui devient une liste",
    screenAlt: "La même liste dans Kangur : 22 articles, d’abord fruits et légumes, puis produits laitiers",
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
        title: "Une capture du chat",
        body: "Parfois un long message avec des virgules, parfois sept avec un « eeet de la lessive » à la fin. Les deux marchent.",
      },
      {
        pill: "Étape 2",
        title: "Kangur fait la liste",
        body: "Il repère les produits et les quantités, et laisse « n’oublie rien 😘 » tranquille. Ce chat a donné 22 articles.",
      },
      {
        pill: "Étape 3",
        title: "Au magasin, on glisse",
        body: "À droite : acheté. À gauche : pas en rayon. Une main, un rayon, rayon suivant.",
      },
    ],
    screenAlt: "Mode courses dans Kangur : les concombres glissent vers la droite, achetés, au rayon Légumes",
  },
  ways: {
    lines: ["Pas de chat ?", "Il y a d’autres moyens."],
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
      body: "Écrivez avec des virgules, dictez ou collez un texte. Ou ajoutez un par un : Kangur propose dès deux lettres.",
      chips: ["lait", "pain", "un petit sucré"],
    },
  },
  together: {
    lines: ["Deux téléphones,", "une seule liste."],
    body: "Quelqu’un ajoute du beurre depuis le canapé, quelqu’un du café en route vers le magasin. Un instant plus tard, les deux sont sur la liste des deux.",
    points: [
      "Invitez par e-mail autant de personnes que vous voulez",
      "Les invitations sont gratuites",
      "iPhone et Android sur la même liste",
      "Le téléphone prévient quand quelqu’un part faire les courses",
    ],
    screenAlt: "Un espace partagé dans Kangur avec les personnes qui ont accès à la liste",
  },
  summary: {
    lines: ["Des poivrons ?", "Y’en avait pas."],
    body: "Après les courses, on voit ce qui a été acheté, ce qui manquait et combien de temps ça a pris. Avant même qu’on vous le demande.",
    screenAlt: "Récapitulatif des courses dans Kangur : 18 achetés, 1 indisponible, 24 minutes",
  },
  price: {
    lines: ["Combien ça coûte ?", "Voici le ticket."],
    body: "Les listes, la maison et le mode courses sont gratuits. On ne paie que l’IA sans limite et un historique plus long, une fois pour tout l’espace, pas par personne.",
    receiptLabel: "Les prix de Kangur sur un ticket de caisse",
    receipt: [
      { kind: "head", text: "Kangur" },
      { kind: "item", text: "Listes partagées", price: "0,00" },
      { kind: "item", text: "Votre foyer", note: "sans limite", price: "0,00" },
      { kind: "item", text: "10 utilisations de l’IA", price: "0,00" },
      { kind: "item", text: "Publicité", note: "on n’en fait pas", price: "-" },
      { kind: "rule" },
      { kind: "item", text: "Premium", note: "IA sans limite, 200 listes dans l’historique", price: "en boutique" },
      { kind: "foot", text: "L’appli affiche le prix dans votre devise." },
      { kind: "rule" },
      { kind: "total", text: "Pour commencer", price: "0,00" },
      { kind: "foot", text: "Gardez la monnaie." },
    ],
    link: "Tous les prix (en anglais)",
  },
  maker: {
    lines: ["Qui est derrière ?", "Une personne à Poznań."],
    body: "Kangur est fait par une entreprise d’une seule personne en Pologne, Krzysztof Krawiec Software. Pas de régie publicitaire, pas de vente de données.",
    points: [
      { title: "Ne lit pas vos chats", body: "Il ne voit que la capture que vous choisissez." },
      { title: "Ne connaît ni vos contacts ni votre position", body: "Il ne les demande pas : une liste de courses n’en a pas besoin." },
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
        a: "Kangur est une appli pour iPhone et Android, pour des listes de courses partagées. Elle fait une liste à partir d’une capture de chat, d’une photo de papier, du nom d’un plat, de vos listes précédentes ou de ce que vous tapez, et range le tout par rayon. Kangur veut dire kangourou en polonais : l’orange au sweat turquoise sur l’icône.",
      },
      {
        q: "Kangur est-il gratuit ?",
        a: "Oui, avec une limite : vous avez 10 utilisations de l’IA au départ et elles ne se renouvellent pas. Les listes à la main, le foyer et le mode courses sont illimités. Premium donne l’IA sans limite.",
      },
      {
        q: "L’autre personne doit-elle payer ?",
        a: "Non. L’invitation est gratuite et Premium couvre tout l’espace, donc toute la maison.",
      },
      {
        q: "Kangur lit-il mes messages ?",
        a: "Non. Il n’a accès à aucune messagerie. Il ne voit que l’image que vous choisissez dans la galerie. Elle est envoyée au fournisseur d’IA (OpenAI) pour lire la liste, et Kangur ne la conserve pas.",
      },
      {
        q: "Que se passe-t-il sans réseau au magasin ?",
        a: "Cocher des produits sur une liste ouverte fonctionne : les changements attendent dans le téléphone et partent plus tard. Créer une liste et utiliser l’IA demandent internet.",
      },
      {
        q: "Y a-t-il un lien avec le concours Kangourou ou un bureau à distance ?",
        a: "Aucun. Il y a beaucoup de kangourous, le nôtre ne fait que des listes de courses. Il ne contrôle ni téléphone ni ordinateur, et personne chez nous ne vous appelle. [[safety|En savoir plus (en anglais)]].",
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
