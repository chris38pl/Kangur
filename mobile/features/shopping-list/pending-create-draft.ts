/**
 * One-shot draft from FAB create → /list/:id (focus + optional AI text).
 * Analogous to pending-list-focus — no React context.
 */

export type CreateListFocus = "ai" | "meal" | "manual";

export type PendingCreateDraft = {
  focus: CreateListFocus;
  aiText?: string;
};

let draft: PendingCreateDraft | null = null;

export function setPendingCreateDraft(value: PendingCreateDraft): void {
  draft = value;
}

export function takePendingCreateDraft(): PendingCreateDraft | null {
  const value = draft;
  draft = null;
  return value;
}

export function clearPendingCreateDraft(): void {
  draft = null;
}
