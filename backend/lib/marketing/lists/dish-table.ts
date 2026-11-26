import { DISHES, PRODUCTS, type Dish, type ProductId } from "@/lib/marketing/lists/christmas";
import { decimal } from "@/lib/marketing/lists/format";
import { typesetPl } from "@/lib/marketing/typography";

/** The table under the Christmas calculator: products dish by dish, the way a cook would say it. */
export const TABLE_PEOPLE = 8;

const nearest = (value: number, step: number) => Math.round(value / step) * step;

export function kitchenWeight(kg: number): string {
  if (kg >= 1) return `${decimal(nearest(kg, 0.1))} kg`;
  if (kg < 0.1) return `${nearest(kg * 1000, 5)} g`;
  const dag = kg * 100;
  return `${dag >= 20 ? nearest(dag, 5) : Math.round(dag)} dag`;
}

const kitchenVolume = (litres: number) =>
  litres >= 1 ? `${decimal(nearest(litres, 0.1))} l` : `${nearest(litres * 1000, 50)} ml`;

/** What one shop unit weighs, for things sold by the piece and cooked by weight. */
const KILOS: Partial<Record<ProductId, number>> = {
  sourCream: 0.4, mayo: 0.4, ghee: 0.25, butter: 0.2, yeast: 0.1,
};

/** A pinch. Nobody weighs these. */
const UNMEASURED: ReadonlySet<ProductId> = new Set<ProductId>([
  "bayLeaf", "allspice", "marjoram", "cloves", "cinnamon", "icingSugar", "soupGreens",
]);

/** Things counted in words: one head, half a root, two lemons. */
const WORDS: Partial<Record<ProductId, (amount: number) => string>> = {
  garlic: () => "główka czosnku",
  celeriac: (n) => (n <= 0.6 ? "pół selera" : "seler"),
  honey: (n) => (n <= 0.6 ? "pół słoika miodu" : "słoik miodu"),
  tomatoPaste: () => "słoiczek koncentratu",
  peas: () => "puszka groszku",
  poppyPaste: () => "puszka masy makowej",
  lemon: (n) => `${Math.ceil(n - 1e-9)} cytryny`,
  eggs: (n) => {
    const eggs = Math.ceil(n - 1e-9);
    return eggs === 1 ? "1 jajko" : `${eggs} ${eggs < 5 ? "jajka" : "jajek"}`;
  },
};

/** "Pietruszka (korzeń)" is "pietruszka" in a kitchen. */
const NAMES: Partial<Record<ProductId, string>> = {
  ghee: "masło klarowane", sourCream: "śmietana 18%", driedFruit: "susz owocowy", wheat: "pszenica", nuts: "bakalie",
  herring: "płaty śledziowe", carp: "karp", whiteFish: "biała ryba", beetKvass: "zakwas",
};

function say(product: ProductId, amount: number): string {
  const words = WORDS[product];
  if (words) return words(amount);
  const { name, unit } = PRODUCTS[product];
  const label = NAMES[product] ?? (name[0].toLocaleLowerCase("pl") + name.slice(1)).replace(/ \(.*\)$/u, "");
  if (UNMEASURED.has(product)) return label;
  const kilos = KILOS[product];
  if (kilos) return `${label} ${kitchenWeight(amount * kilos)}`;
  if (unit === "kg") return `${label} ${kitchenWeight(amount)}`;
  if (unit === "g") return `${label} ${kitchenWeight(amount / 1000)}`;
  if (unit === "l") return `${label} ${kitchenVolume(amount)}`;
  return label;
}

export type DishRow = { dish: string; products: string };

/** The twelve dishes the calculator starts with. */
export function dishTable(people: number = TABLE_PEOPLE): DishRow[] {
  return (DISHES as readonly Dish[])
    .filter((dish) => dish.starter)
    .map((dish) => ({
      dish: typesetPl(dish.name),
      products: typesetPl(
        dish.needs
          .map(({ product, each = 0, base = 0 }) => say(product as ProductId, base + each * people))
          .join(", "),
      ),
    }));
}
