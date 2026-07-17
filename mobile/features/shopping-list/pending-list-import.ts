/**
 * One-shot payload when creating a list from AI import.
 * Content is captured BEFORE the list is created, so canceling the picker
 * / empty clipboard never leaves an empty list on the server.
 */
export type PendingListImport =
  | { kind: "clipboard"; text: string }
  | {
      kind: "image";
      uri: string;
      fileName?: string | null;
      mimeType?: string | null;
    };

let pending: PendingListImport | null = null;

export function setPendingListImport(value: PendingListImport): void {
  pending = value;
}

export function takePendingListImport(): PendingListImport | null {
  const value = pending;
  pending = null;
  return value;
}

export function clearPendingListImport(): void {
  pending = null;
}
