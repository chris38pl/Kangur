import type { MealProposalResponse } from "@/features/ai/schemas";

type PendingMealProposal = {
  listId: string;
  workspaceId: string;
  response: MealProposalResponse;
  acceptedRowIds: string[];
  rejectedMealIds: string[];
  mealIndex: number;
};

let pending: PendingMealProposal | null = null;

export function setPendingMealProposal(
  value: Omit<
    PendingMealProposal,
    "acceptedRowIds" | "rejectedMealIds" | "mealIndex"
  > & {
    acceptedRowIds?: string[];
    rejectedMealIds?: string[];
    mealIndex?: number;
  },
): void {
  pending = {
    acceptedRowIds: value.acceptedRowIds ?? [],
    rejectedMealIds: value.rejectedMealIds ?? [],
    mealIndex: value.mealIndex ?? 0,
    listId: value.listId,
    workspaceId: value.workspaceId,
    response: value.response,
  };
}

export function getPendingMealProposal(): PendingMealProposal | null {
  return pending;
}

export function updatePendingMealProposal(
  patch: Partial<
    Pick<
      PendingMealProposal,
      "acceptedRowIds" | "rejectedMealIds" | "mealIndex"
    >
  >,
): void {
  if (!pending) return;
  pending = { ...pending, ...patch };
}

export function clearPendingMealProposal(): void {
  pending = null;
}

let openComposerForListId: string | null = null;

export function setPendingMealComposer(listId: string): void {
  openComposerForListId = listId;
}

export function takePendingMealComposer(listId: string): boolean {
  if (openComposerForListId !== listId) return false;
  openComposerForListId = null;
  return true;
}
