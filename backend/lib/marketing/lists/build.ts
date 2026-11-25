import { AISLES, type Aisle } from "@/lib/marketing/aisles/labels";
import { decimal } from "@/lib/marketing/lists/format";
import { typesetPl } from "@/lib/marketing/typography";

/** Something you can put in a basket, with the smallest amount worth buying. */
export type Product<When extends string = string> = {
  name: string;
  aisle: Aisle;
  unit: "kg" | "g" | "l" | "szt." | "opak.";
  /** Amounts are rounded up to this: half a kilo, a whole can. */
  step: number;
  when: When;
  note?: string;
};

/** How much of a product a dish or a day needs. */
export type Need<Id extends string = string> = {
  product: Id;
  /** Grows with the number of people. */
  each?: number;
  /** The same for two people and for ten. */
  base?: number;
};

export type Line<When extends string = string> = {
  id: string;
  name: string;
  quantity: string;
  aisle: Aisle;
  when: When;
  note?: string;
};

function roundUp(amount: number, step: number): number {
  // 0.1 + 0.2 must not become the next half kilo.
  return Math.ceil(amount / step - 1e-9) * step;
}

export function formatAmount(amount: number, unit: Product["unit"]): string {
  if (unit === "g" && amount >= 1000) return `${decimal(amount / 1000)} kg`;
  return `${decimal(amount)} ${unit}`;
}

/**
 * Adds up everything that is needed, product by product, and rounds once at the end.
 * Rounding dish by dish would buy five half-empty bags of flour.
 */
export function addUp<Id extends string, When extends string>(
  products: Record<Id, Product<When>>,
  needs: readonly { need: Need<Id>; people: number }[],
): Line<When>[] {
  const totals = new Map<Id, number>();
  for (const { need, people } of needs) {
    const amount = (need.base ?? 0) + (need.each ?? 0) * people;
    totals.set(need.product, (totals.get(need.product) ?? 0) + amount);
  }

  return [...totals]
    .filter(([, amount]) => amount > 0)
    .map(([id, amount]) => {
      const { name, aisle, unit, step, when, note } = products[id];
      return {
        id,
        name: typesetPl(name),
        quantity: formatAmount(roundUp(amount, step), unit),
        aisle,
        when,
        ...(note ? { note: typesetPl(note) } : {}),
      };
    })
    .sort(
      (a, b) =>
        AISLES.indexOf(a.aisle) - AISLES.indexOf(b.aisle) ||
        a.name.localeCompare(b.name, "pl"),
    );
}
