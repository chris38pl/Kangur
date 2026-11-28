import assert from "node:assert/strict";
import test from "node:test";

import {
  invitationText,
  listCreatedText,
  listDeletedText,
  memberJoinedText,
  shoppingFinishedText,
  shoppingStartedText,
} from "@/features/notifications/notificationText";
import { APP_LOCALE_IDS } from "@/lib/locale";

const W = "Dom Krawców";

test("Polish: the title is the workspace, the body starts with the name", () => {
  assert.deepEqual(
    shoppingFinishedText("pl", { workspaceName: W, actor: "Kasia", boughtCount: 18, itemCount: 20 }),
    { title: W, body: "Kasia: zakupy zakończone, 18 z 20 produktów" },
  );
  assert.equal(
    shoppingFinishedText("pl", { workspaceName: W, actor: null, boughtCount: 18, itemCount: 20 }).body,
    "Zakupy zakończone, 18 z 20 produktów",
  );
  assert.equal(
    shoppingFinishedText("pl", { workspaceName: W, actor: null, boughtCount: 1, itemCount: 1 }).body,
    "Zakupy zakończone, 1 z 1 produktu",
  );
  assert.equal(
    shoppingFinishedText("pl", { workspaceName: W, actor: "Kasia", boughtCount: 0, itemCount: 0 }).body,
    "Kasia: zakupy zakończone",
  );
  assert.equal(
    shoppingStartedText("pl", { workspaceName: W, actor: "Kasia", listName: "Sobota" }).body,
    "Kasia: zakupy rozpoczęte · Sobota",
  );
  assert.equal(memberJoinedText("pl", { workspaceName: W, member: "Kasia" }).body, "Nowa osoba: Kasia");
  assert.deepEqual(invitationText("pl", { workspaceName: W, actor: null }), {
    title: "Zaproszenie do przestrzeni Dom Krawców",
    body: "Dołącz, aby wspólnie tworzyć listy zakupów.",
  });
});

test("Russian and Ukrainian count with the right form", () => {
  const ru = (n: number) =>
    shoppingFinishedText("ru", { workspaceName: W, actor: null, boughtCount: n, itemCount: n }).body;
  assert.equal(ru(1), "Покупки завершены, 1 из 1 товара");
  assert.equal(ru(21), "Покупки завершены, 21 из 21 товара");
  assert.equal(ru(5), "Покупки завершены, 5 из 5 товаров");
  const uk = shoppingFinishedText("uk", { workspaceName: W, actor: null, boughtCount: 2, itemCount: 3 });
  assert.equal(uk.body, "Покупки завершено, 2 з 3 товарів");
});

test("every language fills every gap and says nothing about gender", () => {
  for (const locale of APP_LOCALE_IDS) {
    for (const actor of ["Kasia", null]) {
      const texts = [
        listCreatedText(locale, { workspaceName: W, actor, listName: "Sobota" }),
        listDeletedText(locale, { workspaceName: W, actor, listName: "Sobota" }),
        shoppingStartedText(locale, { workspaceName: W, actor, listName: "Sobota" }),
        shoppingFinishedText(locale, { workspaceName: W, actor, boughtCount: 3, itemCount: 4 }),
        shoppingFinishedText(locale, { workspaceName: W, actor, boughtCount: 1, itemCount: 1 }),
        shoppingFinishedText(locale, { workspaceName: W, actor, boughtCount: 0, itemCount: 0 }),
        invitationText(locale, { workspaceName: W, actor }),
        memberJoinedText(locale, { workspaceName: W, member: actor }),
      ];
      for (const { title, body } of texts) {
        const all = `${title} | ${body}`;
        assert.equal(/\{\{|\}\}/.test(all), false, `${locale}: ${all}`);
        // "zakończył(a)", "dodał(a)", "(ла)": the old way of guessing a gender.
        assert.equal(/\((a|а|ла|ўла|ла)\)/.test(all), false, `${locale}: ${all}`);
        assert.equal(all.includes("—") || all.includes("–"), false, `${locale}: ${all}`);
        if (actor) assert.equal(all.includes("Kasia"), true, `${locale}: ${all}`);
        else assert.equal(all.includes("Kasia"), false, `${locale}: ${all}`);
      }
    }
  }
});
