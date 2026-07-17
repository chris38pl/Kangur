/** Time-sortable op id (ULID-style enough for queue ordering). */
export function createSyncOpId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `${t}${r}`;
}
