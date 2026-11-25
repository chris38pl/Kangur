import type { HomeCopy } from "@/lib/marketing/content/home-types";

export const homeEn: HomeCopy = {
  hero: {
    eyebrow: "Kangur - the shared grocery list app",
    lines: ["Got the list in a chat?", "Screenshot it. Sorted."],
    lead: "Take a screenshot of the conversation. Kangur picks out the items, sorts them by aisle and shows them to everyone at home. In the store you just swipe.",
    storesNote: "For iPhone and Android. No ads. 10 free AI uses to start.",
    playSmall: "GET IT ON",
    iosSmall: "DOWNLOAD ON THE",
    chatLabel: "A sample conversation the list is made from",
    screenAlt:
      "The same list in Kangur: 22 items, fruit and vegetables first, then dairy",
  },
  chat: {
    contact: "Honey ❤️",
    status: "active now",
    messages: [
      ["me", "leaving work, need anything?"],
      ["them", "yes! wait"],
      [
        "them",
        "milk, eggs x10, tomatoes, toilet paper, cheese, bread, butter, chicken 1kg, dish soap, bananas, pasta, onions, passata x2, plain yogurt, potatoes, garlic, ham, coffee, cucumbers, food for the doggo",
      ],
      ["them", "don’t forget anything 😘"],
      ["them", "oh and maybe some chips"],
      ["them", "best get 2 bags of sour cream & onion"],
      ["them", "aaand laundry detergent, we ran out"],
    ],
  },
  steps: {
    lines: ["Retype it?", "Life’s too short."],
    items: [
      {
        pill: "Step 1",
        title: "Screenshot the chat",
        body: "Sometimes it’s one long message with commas, sometimes seven with an “aaand detergent” at the end. Both work.",
      },
      {
        pill: "Step 2",
        title: "Kangur makes the list",
        body: "It catches items and amounts, and leaves “don’t forget anything 😘” alone. This chat came out as 22 items.",
      },
      {
        pill: "Step 3",
        title: "In the store you swipe",
        body: "Right: bought. Left: not there. One hand, one aisle, next aisle.",
      },
    ],
    screenAlt:
      "Shopping mode in Kangur: cucumbers being swiped right as purchased in the Vegetables aisle",
  },
  ways: {
    lines: ["No chat?", "There are other ways."],
    intro:
      "The list doesn’t always come in a message. Sometimes it hangs on the fridge, sometimes it sits in somebody’s head.",
    photo: {
      title: "The note on the fridge",
      body: "Take a photo and Kangur copies it out. Very messy handwriting can trip it up, so give the result a quick look.",
      note: ["milk, eggs 10", "toilet paper", "chicken 1 kg ??", "butter (do we have?)", "something for dinner"],
    },
    dish: {
      title: "Tonight’s dinner",
      body: "Type “carbonara” and “bruschetta” and get the ingredients on one list. Salt and pepper once, not twice. Untick what you already have.",
      screenAlt: "Carbonara ingredients in Kangur, ready to be unticked",
    },
    usual: {
      title: "The usual",
      body: "Kangur collects items from your last five lists and shows which ones keep coming back. Keep the ones you need.",
      screenAlt:
        "Suggestion from history in Kangur: bananas, tomatoes and milk, each marked Bought 5 times",
    },
    typed: {
      title: "Off the top of your head",
      body: "Type it with commas, dictate it or paste text from the clipboard. Or add one by one: Kangur suggests after two letters.",
      chips: ["milk", "bread", "something sweet"],
    },
  },
  together: {
    lines: ["Two phones,", "one list."],
    body: "Someone adds butter from the couch, someone adds coffee on the way to the store. A moment later both are on the list for both of you.",
    points: [
      "Invite as many people as you like, by email",
      "Invitations cost nothing",
      "iPhone and Android on the same list",
      "Your phone tells you when someone starts shopping",
    ],
    screenAlt: "A shared space in Kangur with the people who have access to the list",
  },
  summary: {
    lines: ["Bell peppers?", "Not in store."],
    body: "After shopping you see what was bought, what was missing and how long it took. Before anyone asks.",
    screenAlt: "Shopping summary in Kangur: 18 purchased, 1 unavailable, 24 minutes",
  },
  price: {
    lines: ["What does it cost?", "Here’s the receipt."],
    body: "Lists, your household and shopping mode are free. You only pay for unlimited AI and a longer history, once for the whole space, not per person.",
    receiptLabel: "Kangur prices as a receipt",
    receipt: [
      { kind: "head", text: "Kangur" },
      { kind: "item", text: "Shared lists", price: "free" },
      { kind: "item", text: "Your household", note: "as many as you like", price: "free" },
      { kind: "item", text: "10 AI uses to start", price: "free" },
      { kind: "item", text: "Ads", note: "out of stock", price: "-" },
      { kind: "rule" },
      { kind: "item", text: "Premium", note: "unlimited AI, 200 lists in history", price: "see store" },
      { kind: "foot", text: "The app shows the price in your currency." },
      { kind: "rule" },
      { kind: "total", text: "To start", price: "0.00" },
      { kind: "foot", text: "Keep the change." },
    ],
    link: "Full price list",
  },
  maker: {
    lines: ["Who makes it?", "One person in Poznań."],
    body: "Kangur is made by a one-person company from Poland, Krzysztof Krawiec Software. No ad department and no selling of data.",
    points: [
      { title: "Doesn’t read your chats", body: "It sees only the screenshot you pick." },
      { title: "Doesn’t know your contacts or location", body: "It never asks: a grocery list has no use for them." },
      { title: "Has no ads", body: "Premium pays for it, not your attention." },
    ],
    safetyLink: "Which permissions Kangur uses",
    aboutLink: "Where it came from",
  },
  faq: {
    lines: ["Before you download,", "in short."],
    items: [
      {
        q: "What is Kangur?",
        a: "Kangur is an app for iPhone and Android for shared grocery lists. It makes a list from a chat screenshot, a photo of a note, the name of a dish, your previous lists or whatever you type, and sorts the items by store aisle. Kangur is Polish for kangaroo: the orange one in a teal hoodie on the icon.",
      },
      {
        q: "Is Kangur free?",
        a: "Yes, with one limit: you get 10 AI uses to start and they do not renew. Manual lists, your household and shopping mode have no limit. Premium gives you unlimited AI. [[pricing|See prices]].",
      },
      {
        q: "Does the other person have to pay?",
        a: "No. The invitation is free, and Premium covers the whole space, so everyone at home at once.",
      },
      {
        q: "Does Kangur read my messages?",
        a: "No. It has no access to any messenger. It sees only the one image you pick from your gallery. The image goes to the AI provider (OpenAI) to read the list, and Kangur does not store it.",
      },
      {
        q: "What works without signal in the store?",
        a: "Ticking off items on an open list: changes wait on the phone and are sent later. Creating lists and AI need the internet.",
      },
      {
        q: "Is it connected to the Kangaroo maths contest or a remote desktop program?",
        a: "Neither. There are many kangaroos, ours only does grocery lists. It does not control your phone or computer, and nobody from Kangur will ever call you. [[safety|More about safety]].",
      },
    ],
  },
  closing: {
    lines: ["Screenshot it.", "Sorted."],
    body: "Kangur - grocery list with AI. For Android and iPhone.",
    qrLabel: "QR code that opens Kangur in Google Play or the App Store",
    qrHint: "On a computer? Scan it with your phone.",
  },
};
