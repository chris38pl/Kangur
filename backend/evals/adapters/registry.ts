import { historySuggestAdapter } from "./historySuggest";
import type { EvalAdapter } from "./types";

const adapters: Record<string, EvalAdapter> = {
  [historySuggestAdapter.id]: historySuggestAdapter,
  "history-suggest": historySuggestAdapter,
};

export function getAdapter(id: string): EvalAdapter {
  const adapter = adapters[id];
  if (!adapter) {
    throw new Error(`Unknown eval adapter: ${id}`);
  }
  return adapter;
}
