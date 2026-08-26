/** One-shot: after AI apply from another screen, show bulk-import footer toast. */

let pending: { listId: string; count: number } | null = null;

export function setPendingAiImportToast(listId: string, count: number): void {
  if (count < 1) return;
  pending = { listId, count };
}

export function takePendingAiImportToast(listId: string): number | null {
  if (!pending || pending.listId !== listId) return null;
  const count = pending.count;
  pending = null;
  return count;
}
