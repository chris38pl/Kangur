/** Future multi-device conflict resolution - stub only. */
export const conflictResolver = {
  resolve(_local: unknown, _remote: unknown): "local" | "remote" | "merge" {
    return "local";
  },
};
