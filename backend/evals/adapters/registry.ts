import { historySuggestAdapter } from "./historySuggest";
import { mealProposalAdapter } from "./mealProposal";
import { shoppingCategoriesAdapter } from "./shoppingCategories";
import { textIngestAdapter } from "./textIngest";
import type { EvalAdapter } from "./types";

const adapters: Record<string, EvalAdapter> = {
  [historySuggestAdapter.id]: historySuggestAdapter,
  "history-suggest": historySuggestAdapter,
  [mealProposalAdapter.id]: mealProposalAdapter,
  meal: mealProposalAdapter,
  [shoppingCategoriesAdapter.id]: shoppingCategoriesAdapter,
  "shopping-categories-eval": shoppingCategoriesAdapter,
  [textIngestAdapter.id]: textIngestAdapter,
  "shopping-import": textIngestAdapter,
};

export function getAdapter(id: string): EvalAdapter {
  const adapter = adapters[id];
  if (!adapter) {
    throw new Error(`Unknown eval adapter: ${id}`);
  }
  return adapter;
}
